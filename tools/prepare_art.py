#!/usr/bin/env python3
"""
STARSTRING — ART PIPELINE
=========================

Turns raw pictures from Gemini into game-ready PNGs.

Gemini draws everything on a flat magenta background because asking
for a transparent background doesn't work reliably. This script takes
the magenta away and leaves the picture floating on nothing.

Three jobs:

  1. KEY      remove the magenta, leaving soft edges instead of jaggy ones
  2. DESPILL  clean the faint magenta tint off the very edge pixels
  3. TRIM     cut away empty space and centre the picture

Use it like this:

    python3 tools/prepare_art.py key  <in.jpg> <out.png> [--size 256]
    python3 tools/prepare_art.py split <in.jpg> <out_dir/> [--min-area 5000]

`key` does one picture. `split` finds every separate object in one
picture and saves each as its own file — handy for the style bible,
which has five things on one sheet.
"""

import sys
import os
import argparse
import numpy as np
from PIL import Image


# The background colour Gemini is told to use: pure magenta.
# We never quite get pure magenta back, because JPEG compression
# smudges colours slightly. So we work with a range, not one value.
LOW  = 0.15   # below this "magenta-ness", the pixel is definitely the picture
HIGH = 0.75   # above this, it's definitely background


def magenta_ness(rgb):
    """
    How magenta is each pixel, from 0 (not at all) to 1 (completely)?

    Magenta is lots of red, lots of blue, no green. So we ask:
    'how much do the red and blue channels both beat the green one?'

      pure magenta (255,0,255) -> 1.0
      white        (255,255,255) -> 0.0
      cyan         (0,255,255) -> 0.0
      grey         (128,128,128) -> 0.0

    Only magenta scores high, which is exactly why magenta makes a
    good background colour: almost nothing in real artwork looks
    like it, so nothing gets removed by accident.
    """
    r = rgb[..., 0].astype(np.float32)
    g = rgb[..., 1].astype(np.float32)
    b = rgb[..., 2].astype(np.float32)
    return np.clip((np.minimum(r, b) - g) / 255.0, 0.0, 1.0)


def key_image(img):
    """Remove the magenta background. Returns an RGBA image."""
    rgb = np.array(img.convert('RGB'))
    m = magenta_ness(rgb)

    # Soft edges. A hard on/off cut gives jagged staircase edges;
    # fading between two thresholds gives smooth ones.
    alpha = 1.0 - np.clip((m - LOW) / (HIGH - LOW), 0.0, 1.0)

    out = rgb.astype(np.float32)

    # DESPILL
    # Pixels right on the edge are a blend of the picture and the
    # magenta behind it, which leaves a faint pink rim. We pull the
    # red and blue back down towards the green to cancel it.
    #
    # Crucially this is scaled by (1 - alpha), so it only touches
    # see-through edge pixels. Solid pixels are left completely alone
    # — otherwise it would drain the colour out of anything legitimately
    # purple or pink, like the crystal rocks.
    r, g, b = out[..., 0], out[..., 1], out[..., 2]
    avg_rb = (r + b) / 2.0
    excess = np.maximum(avg_rb - g, 0.0) * (1.0 - alpha)
    out[..., 0] = np.clip(r - excess, 0, 255)
    out[..., 2] = np.clip(b - excess, 0, 255)

    rgba = np.dstack([out, alpha * 255.0]).astype(np.uint8)
    return Image.fromarray(rgba, 'RGBA')


def trim_and_square(img, pad_ratio=0.04, size=None, square=True):
    """
    Cut off the empty space around the picture.

    With square=True it then pads back out to a square — right for
    buttons and icons, which the game draws in square slots.

    With square=False it leaves the tight crop — right for characters,
    where the game needs to know the real shape to stand them on the
    ground properly.
    """
    a = np.array(img)[..., 3]
    ys, xs = np.where(a > 8)
    if len(xs) == 0:
        return img

    x0, x1 = xs.min(), xs.max() + 1
    y0, y1 = ys.min(), ys.max() + 1
    img = img.crop((int(x0), int(y0), int(x1), int(y1)))

    if not square:
        return img.resize((size, size), Image.LANCZOS) if size else img

    # Pad out to a square, picture centred
    w, h = img.size
    side = int(max(w, h) * (1 + pad_ratio * 2))
    square = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    square.paste(img, ((side - w) // 2, (side - h) // 2))

    if size:
        square = square.resize((size, size), Image.LANCZOS)
    return square


def find_objects(alpha, min_area, threshold=90):
    """
    Find each separate blob of picture in an image.

    Walks the image and, whenever it meets a solid pixel it hasn't
    seen before, spreads out from it to find everything connected to
    it. That group is one object. Then it carries on looking.

    (This is a flood fill, the same idea as the paint bucket tool.
    We use a list of pixels to visit rather than calling the function
    inside itself, because on a 2048x2048 image the recursive version
    runs out of memory and crashes.)
    """
    solid = alpha > threshold
    h, w = solid.shape
    seen = np.zeros_like(solid, dtype=bool)
    labels = np.zeros(solid.shape, dtype=np.int32)   # which object each pixel belongs to
    boxes = []
    next_label = 1

    for sy in range(h):
        for sx in range(w):
            if not solid[sy, sx] or seen[sy, sx]:
                continue

            label = next_label
            next_label += 1
            stack = [(sy, sx)]
            seen[sy, sx] = True
            minx = maxx = sx
            miny = maxy = sy
            area = 0

            while stack:
                y, x = stack.pop()
                labels[y, x] = label
                area += 1
                if x < minx: minx = x
                if x > maxx: maxx = x
                if y < miny: miny = y
                if y > maxy: maxy = y

                for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    ny, nx = y + dy, x + dx
                    if 0 <= ny < h and 0 <= nx < w and solid[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        stack.append((ny, nx))

            if area >= min_area:
                boxes.append({'box': (minx, miny, maxx + 1, maxy + 1),
                              'area': area, 'label': label})

    boxes.sort(key=lambda b: b['box'][0])   # left to right
    return boxes, labels


def keep_connected_to(alpha, seed, threshold=8):
    """
    Keep only the part of the picture that is actually joined to this
    object, and rub out everything else.

    Why this is needed: objects have soft glows around them, which are
    too faint to count as part of any object. When we widen the crop box
    to catch this object's glow, we can also catch a slice of the glow
    belonging to the object next door — which then shows up in the game
    as a mysterious floating smudge.

    So we spread outwards from the pixels we know belong to this object,
    through anything even slightly visible. Whatever we can't reach isn't
    ours, and gets deleted.
    """
    visible = alpha > threshold
    h, w = visible.shape
    keep = np.zeros_like(visible, dtype=bool)

    stack = [(int(y), int(x)) for y, x in zip(*np.where(seed))]
    for y, x in stack:
        keep[y, x] = True

    while stack:
        y, x = stack.pop()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and visible[ny, nx] and not keep[ny, nx]:
                keep[ny, nx] = True
                stack.append((ny, nx))

    return keep


def cmd_key(args):
    img = Image.open(args.input)
    out = trim_and_square(key_image(img), size=args.size)
    os.makedirs(os.path.dirname(args.output) or '.', exist_ok=True)
    out.save(args.output)
    print(f'{os.path.basename(args.input)} -> {args.output}  ({out.size[0]}x{out.size[1]})')


def cmd_split(args):
    img = Image.open(args.input)
    keyed = key_image(img)
    alpha = np.array(keyed)[..., 3]

    boxes, labels = find_objects(alpha, args.min_area)
    os.makedirs(args.output, exist_ok=True)

    rgba = np.array(keyed)

    print(f'Found {len(boxes)} objects in {os.path.basename(args.input)}:')
    for i, b in enumerate(boxes):
        x0, y0, x1, y1 = b['box']

        # Grow the box a little so soft glows aren't clipped off
        grow = int(max(x1 - x0, y1 - y0) * 0.10)
        x0 = max(0, x0 - grow); y0 = max(0, y0 - grow)
        x1 = min(keyed.size[0], x1 + grow); y1 = min(keyed.size[1], y1 + grow)

        # Growing the box can drag in a slice of the object next door.
        # First rub out anything belonging to a DIFFERENT object...
        piece = rgba[y0:y1, x0:x1].copy()
        lab = labels[y0:y1, x0:x1]
        piece[(lab != 0) & (lab != b['label']), 3] = 0

        # ...then rub out any leftover glow that isn't joined to us,
        # which would otherwise appear as a floating smudge in the game.
        keep = keep_connected_to(piece[..., 3], lab == b['label'])
        piece[~keep, 3] = 0

        img = Image.fromarray(piece, 'RGBA')
        img = trim_and_square(img, pad_ratio=0.02, square=False)

        path = os.path.join(args.output, f'object_{i}.png')
        img.save(path)
        print(f'  object_{i}.png  {img.size[0]}x{img.size[1]}  area={b["area"]}')


def main():
    p = argparse.ArgumentParser(description='Starstring art pipeline')
    sub = p.add_subparsers(dest='cmd', required=True)

    k = sub.add_parser('key', help='remove the magenta from one picture')
    k.add_argument('input')
    k.add_argument('output')
    k.add_argument('--size', type=int, default=None)
    k.set_defaults(func=cmd_key)

    s = sub.add_parser('split', help='separate every object in one picture')
    s.add_argument('input')
    s.add_argument('output')
    s.add_argument('--min-area', type=int, default=5000)
    s.set_defaults(func=cmd_split)

    args = p.parse_args()
    args.func(args)


if __name__ == '__main__':
    main()
