# STARSTRING — GEMINI PROMPTS (Batches 1 & 2)

Copy-paste ready. Do these two batches now; everything else waits until the game needs it.

---

# BATCH 1 — The Style Bible

**This is the most important image in the entire project.** Every other picture gets made by showing Gemini this one and saying "same style". Re-roll it until AXY genuinely loves it. Twenty attempts is normal and fine.

### The prompt

```
A single reference sheet for a 2D mobile platformer game called Starstring,
in a bold colourful cartoon style.

Shown together on one image:
- a child astronaut with long dark hair, wearing a WHITE and LIGHT GREY
  space suit with a large clear round glass helmet
- a small round PALE WHITE glowing blob creature with big friendly eyes
- a chunk of purple crystal cave rock platform
- a glowing cyan crystal ring, like a hoop
- a small gold five-pointed star

Art style: bold flat colours, thick dark outlines around every shape,
minimal shading with only one or two tones per colour, very high contrast,
clean readable silhouettes, modern mobile game art, vector-like.

Side view, orthographic, no perspective.
Solid flat magenta background, hex FF00FF.
No text, no labels, no watermark, no drop shadows.
```

### ⚠️ The one thing not to get wrong

**The suit must come out white/light grey. The blob must come out pale white.**

Not orange. Not yellow. The game paints them in code — that's how 7 characters become 42 combinations and how Blob changes colour with its mood. You cannot tint an orange suit blue.

If Gemini keeps making the suit colourful anyway, add: `The space suit is pure white with light grey panels and no coloured accents at all.`

### What "good" looks like

Before accepting it, check:

- [ ] Could you tell what each object is from across the room?
- [ ] Are the outlines thick and dark on *everything*?
- [ ] Is the background flat magenta with no gradient or texture?
- [ ] Is the suit actually white, and the blob actually pale?
- [ ] Does AXY like it? ← this is the real test

Save it as `assets/raw/STYLE_BIBLE.png` and never delete it.

---

# BATCH 2 — The Four Buttons

Needed right now — the game already has button-shaped placeholders waiting for these.

**For each one: attach `STYLE_BIBLE.png` and start the prompt with:**

> Using the attached image as the reference for art style, colours, line weight and overall look —

### `btn_left.png`
```
...a large round translucent game control button for a mobile game,
with a bold white left-pointing triangle arrow in the centre.
Thick dark outline, semi-transparent dark fill, clean and simple.
Square image, centred, solid flat magenta background hex FF00FF.
No text, no watermark.
```

### `btn_right.png`
```
...the same round translucent game control button design,
with a bold white right-pointing triangle arrow in the centre.
Identical size, style and framing to the left button.
Square image, centred, solid flat magenta background hex FF00FF.
```

### `btn_jump.png`
```
...the same round translucent game control button design,
with a bold white upward-pointing arrow in the centre.
Slightly chunkier and more prominent than the direction buttons.
Square image, centred, solid flat magenta background hex FF00FF.
```

### `btn_grapple.png`
```
...the same round game control button design but glowing cyan,
with a white grappling hook and rope icon in the centre.
It should look special and more powerful than the other buttons.
Square image, centred, solid flat magenta background hex FF00FF.
```

---

## After generating: remove the magenta

Save the four raw files into `assets/raw/`, then ask your AI assistant:

> Write me a Python script that takes every PNG in `assets/raw/`, makes every magenta pixel (#FF00FF, with a tolerance for near-magenta edge pixels) transparent, and saves the result into `assets/ui/` with the same filename.

Do **not** do this by hand — you'll be repeating it for sixty more images later.

Then drop the finished PNGs into `assets/ui/` and reload the game. The buttons appear on their own. **You won't need to change a single line of code** — the game already checks whether the pictures exist and uses them if they do.

That moment — dropping in a file and watching the game change — is worth showing AXY deliberately. It's the first time the art and the code meet.

---

## Batches 3 onward

Live in `ART_PROMPTS.md`, alongside the schedule of which step needs what. Don't generate ahead — art you can't see in the game yet is wasted effort, and the style tends to drift when you make assets in a vacuum.
