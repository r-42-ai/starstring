#!/usr/bin/env python3
"""
THE LEVEL BUILDER            python3 tools/make_levels.py

Levels 4, 5 and 6 are not typed out by hand. They're built here, out of
shapes the robot has PROVEN it can get through, and then written into
js/level.js.

Why a builder instead of drawing the maps by hand: levels 2 and 3 were
drawn by hand, and both of them were IMPOSSIBLE the first time. Not
slightly unfair -- actually impossible, with no way through at all:

  - level 3 had a fake tunnel through a wall with no floor under it
  - level 3's stepping stones had rings 570px away; the rope reaches 350
  - level 3's finale had you jumping UP into the first ring, which
    clamps the rope to MIN_ROPE and gives a pendulum that goes nowhere

Every one of those is the same mistake: a shape that looks fine drawn on
a grid but that the physics won't allow. So the shapes live in one place
now, measured once, and levels are assembled from them.

THE TWO SHAPES
--------------

`pad`    ground, a step up, a step up again to ring height. The only
         approach to a ring chain that reliably works, because you have
         to arrive AT ring height with the ring still ahead of you --
         then the rope comes out long and flat. Grab a ring you're
         already level with and the rope is shorter than MIN_ROPE; the
         robot hung on one of those for the rest of the level.

`perch`  a small ledge instead of a whole pad -- less ground, and you
         have to land on it rather than run onto it. Its top surface
         MUST be row 9. At row 7 or 8 the flight arrives at the ledge's
         side instead of its top and you smack into it: every single
         playing style died at the first one.

Numbers that came from measuring, not from taste:

  rings sit 6 columns apart at row 6
  a chain starts 5 columns past the end of a pad or perch
  after the last ring you fly about 3 columns on and peak at row 7

That last one is how the portals are placed. `tools/flight.js` plays the
level thirty ways and prints a map of where you actually end up; the
portal goes where the game already sends people, not where it looked
nice on the grid.
"""
import os, sys

H          = 18   # every level is 18 rows tall
GROUND_TOP = 13   # the floor's surface
RING_ROW   = 6    # rings hang here

LEVEL_JS = os.path.join(os.path.dirname(__file__), '..', 'js', 'level.js')


class Map:
    def __init__(self, w):
        self.w = w
        self.g = [['.' for _ in range(w)] for _ in range(H)]

    def put(self, c, r, ch):
        if 0 <= c < self.w and 0 <= r < H:
            self.g[r][c] = ch

    def block(self, c0, c1, r0, r1, ch='#'):
        for c in range(c0, c1 + 1):
            for r in range(r0, r1 + 1):
                self.put(c, r, ch)

    def ground(self, c0, c1, top=GROUND_TOP):
        self.block(c0, c1, top, H - 1)

    def pad(self, c):
        """Ground with a staircase up to ring height.
        Occupies columns c..c+12. Returns where the ring chain starts."""
        self.ground(c, c + 12)
        self.block(c + 4, c + 8, 10, 10)
        self.block(c + 9, c + 12, 7, 7)
        return c + 17

    def perch(self, c, width=5):
        """A small ledge at row 9. Occupies c..c+width-1.
        Returns where the ring chain starts."""
        self.block(c, c + width - 1, 9, 10)
        return c + width + 4

    # A monster standing on top of whatever is at this column.
    #
    # Both of these REFUSE to overwrite anything that is already there.
    # Without that guard a monster landed on top of a level's P and the
    # start point simply vanished -- the level still loaded, the hero
    # just had nowhere to begin. Silently deleting something is much
    # worse than declining to place something.
    def guard(self, c, ch):
        for r in range(H):
            if self.g[r][c] == '#':
                if r > 0 and self.g[r - 1][c] == '.':
                    self.put(c, r - 1, ch)
                return

    # A monster hanging in mid-air (flyers and fallers)
    def hang(self, c, r, ch):
        if 0 <= r < H and self.g[r][c] == '.':
            self.put(c, r, ch)

    def chain(self, c, n, types='o', row=RING_ROW):
        """n rings, six columns apart. Returns the column of the last."""
        for i in range(n):
            self.put(c + i * 6, row, types[i % len(types)])
        return c + (n - 1) * 6

    def rows(self, width=None):
        return [''.join(r)[:width] for r in self.g]


# ---------------------------------------------------------------- levels

def the_long_fall():
    """
    LEVEL 4 -- less ground, and the portal is above you.

    Four islands of floor, and SHORT hops between them -- three or four
    rings, not a chain that goes on forever. That's level 5's trick, and
    doing it here first would spoil it. The portal sits at the very TOP
    of the arc you fly after the last ring, so you have to launch at the
    right moment -- a beat late and you sail underneath it.
    """
    m = Map(300)
    c = m.pad(0)
    m.put(2, 12, 'P')
    last = 0
    for i, (n, ty) in enumerate([(3, 'oro'), (4, 'oro'), (4, 'ror'), (5, 'ror')]):
        if i:
            c = m.pad(last + 3)
            if i in (1, 3):
                m.put(last + 5, 12, 'F')
        last = m.chain(c, n, ty)
    cyan_finish(m, last)
    # Monsters. Every one of these was checked by the robot: the
    # packer proposes a lot and keeps only the ones that leave the
    # level finishable. See tools/make_levels.py notes.
    m.guard(0, '^'); m.guard(7, '^'); m.guard(11, 'c'); m.guard(33, 'c')
    m.guard(42, '^'); m.guard(44, 'c'); m.guard(70, '^'); m.guard(77, '^')
    m.guard(5, '^'); m.guard(9, 'c'); m.guard(10, '^'); m.guard(36, 'c')
    m.guard(40, '^'); m.guard(72, 'c'); m.guard(75, '^'); m.guard(80, '^')
    m.guard(81, 'c'); m.guard(108, 'c'); m.guard(115, '^'); m.guard(117, 'c')
    m.guard(120, '^')
    m.hang(39, 6, 'v'); m.hang(78, 6, 'v'); m.hang(17, 9, '~')
    m.hang(23, 9, '~'); m.hang(29, 9, '~'); m.hang(49, 9, '~')
    m.hang(55, 9, '~'); m.hang(61, 9, '~'); m.hang(67, 9, '~')
    m.hang(87, 9, '~'); m.hang(93, 9, '~'); m.hang(99, 9, '~')
    m.hang(105, 9, '~'); m.hang(125, 9, '~'); m.hang(131, 9, '~')
    m.hang(137, 9, '~'); m.hang(143, 9, '~'); m.hang(149, 9, '~')
    m.put(last + 2, 7, 'X')          # measured: the peak of the flight
    return m, last + 8


def nothing_underneath():
    """
    LEVEL 5 -- the floor shrinks to ledges, and the portal is in a slot.

    THE ring level. Thirty-eight of them, in chains of eight, nine, ten
    and eleven -- more than levels 4 and 6 put together, and the only level
    that asks you to keep a swing going that long.

    No pads after the first: you land on ledges five wide, at ring
    height, with nothing at all below them. The portal is behind a
    two-row gap between a roof and a floor of rock -- too high and you
    hit the roof, too low and you hit the floor.
    """
    m = Map(300)
    c = m.pad(0)
    m.put(2, 12, 'P')
    last = 0
    for i, (n, ty) in enumerate([(8, 'ror'), (9, 'ror'), (10, 'ror'), (11, 'ror')]):
        if i:
            pc = last + 3
            c = m.perch(pc)
            if i in (1, 3):
                m.put(pc + 2, 8, 'F')
        last = m.chain(c, n, ty)
    cyan_finish(m, last)
    # Monsters. Every one of these was checked by the robot: the
    # packer proposes a lot and keeps only the ones that leave the
    # level finishable. See tools/make_levels.py notes.
    m.guard(0, '^'); m.guard(7, '^'); m.guard(11, 'c'); m.guard(63, '^')
    m.guard(66, 'c'); m.guard(126, '^'); m.guard(264, 'c'); m.guard(266, '^')
    m.guard(5, '^'); m.guard(9, 'c'); m.guard(10, '^'); m.guard(125, '^')
    m.guard(260, '^'); m.guard(261, 'c'); m.guard(265, '^')
    m.hang(65, 5, 'v'); m.hang(17, 9, '~'); m.hang(23, 9, '~')
    m.hang(29, 9, '~'); m.hang(35, 9, '~'); m.hang(41, 9, '~')
    m.hang(47, 9, '~'); m.hang(53, 9, '~'); m.hang(59, 9, '~')
    m.hang(71, 9, '~'); m.hang(77, 9, '~'); m.hang(83, 9, '~')
    m.hang(89, 9, '~'); m.hang(95, 9, '~'); m.hang(101, 9, '~')
    m.hang(107, 9, '~'); m.hang(113, 9, '~'); m.hang(119, 9, '~')
    m.hang(131, 9, '~'); m.hang(137, 9, '~'); m.hang(143, 9, '~')
    m.hang(149, 9, '~'); m.hang(155, 9, '~'); m.hang(161, 9, '~')
    m.hang(167, 9, '~'); m.hang(173, 9, '~'); m.hang(179, 9, '~')
    m.hang(185, 9, '~'); m.hang(197, 9, '~'); m.hang(203, 9, '~')
    m.hang(209, 9, '~'); m.hang(215, 9, '~'); m.hang(221, 9, '~')
    m.hang(227, 9, '~'); m.hang(233, 9, '~'); m.hang(239, 9, '~')
    m.hang(245, 9, '~'); m.hang(251, 9, '~'); m.hang(257, 9, '~')
    s = last + 3
    m.block(s, s + 6, 4, 6)          # roof
    m.block(s, s + 6, 9, 11)         # floor -- leaves rows 7 and 8 open
    m.put(last + 5, 7, 'X')
    return m, s + 11


def the_last_jump():
    """
    LEVEL 6 -- barely any ground at all, and the portal is in a pocket.

    Two ledges four wide, and one single flag in the whole level. The
    portal is inside an alcove with rock above it, below it and behind
    it: one way in, and if you miss you hit the back wall.

    NOT many rings -- that's level 5's job. Nea: "aendere das es nur bei
    lev fuenf so viel ringe gibt bei 4 und 6 it shouldnt have so much
    rings." Level 6 is hard because there is nowhere to stand and the
    portal is in a box, not because the chains go on forever.
    """
    m = Map(320)
    c = m.pad(0)
    m.put(2, 12, 'P')
    last = 0
    for i, n in enumerate([6, 7, 8]):
        if i:
            pc = last + 3
            c = m.perch(pc, 4)
            if i == 1:
                m.put(pc + 1, 8, 'F')
        last = m.chain(c, n, 'ror')
    cyan_finish(m, last)
    # Monsters. Every one of these was checked by the robot: the
    # packer proposes a lot and keeps only the ones that leave the
    # level finishable. See tools/make_levels.py notes.
    m.guard(0, '^'); m.guard(5, '^'); m.guard(9, 'c'); m.guard(10, '^')
    m.guard(52, 'z'); m.guard(99, 'c'); m.guard(100, '^'); m.guard(150, '^')
    m.guard(153, 'c'); m.guard(155, '^'); m.guard(156, 'z')
    m.hang(11, 3, 'v'); m.hang(154, 1, 'v'); m.hang(17, 9, '~')
    m.hang(23, 9, '~'); m.hang(29, 9, '~'); m.hang(35, 9, '~')
    m.hang(41, 9, '~'); m.hang(47, 9, '~'); m.hang(58, 9, '~')
    m.hang(64, 9, '~'); m.hang(70, 9, '~'); m.hang(76, 9, '~')
    m.hang(82, 9, '~'); m.hang(88, 9, '~'); m.hang(94, 9, '~')
    m.hang(105, 9, '~'); m.hang(111, 9, '~'); m.hang(117, 9, '~')
    m.hang(123, 9, '~'); m.hang(129, 9, '~'); m.hang(135, 9, '~')
    m.hang(141, 9, '~'); m.hang(147, 9, '~')
    a = last + 2
    m.block(a, a + 7, 5, 6)          # roof
    m.block(a, a + 7, 10, 11)        # floor
    m.block(a + 5, a + 7, 7, 9)      # the back of the pocket
    m.put(last + 4, 8, 'X')
    return m, a + 11


# --------------------------------------------------------------- writing

def cyan_finish(m, last):
    """
    The last ring before the portal is never red.

    Nea moved red rings from four swings to three, and three is not
    enough to build the swing that carries you into a portal: the level
    test measured the best possible launch off each level's final ring
    and came up 82px short on two of them. A ring that breaks before you
    can wind up is the wrong ring to end a level on.
    """
    m.put(last, RING_ROW, 'o')


def shafts(width, n):
    """Light from the hole in the cave roof, spread across the level."""
    out = []
    for i in range(n):
        col = int(width * (i + 0.5) / n)
        out.append((col, 4 + (i * 3) % 4, round(1.4 + (i * 0.7) % 1.8, 1)))
    return out


# The clock gets tighter twice over: fewer seconds each level, AND less
# slack inside them. `robot` is measured, not guessed -- it is the
# fastest of thirty playing styles.
#
#            robot   limit   a person gets
#   level 3   29.2s   165s      5.6x
#   level 4   27.2s   130s      4.8x
#   level 5   33.1s   125s      3.8x
#   level 6   19.8s    70s      3.5x
#
# If level 6 turns out to be cruel rather than hard, THIS is the number
# to loosen first -- it's one line and it changes nothing else.
LEVELS = [
    # key, name, builder, seconds, one hint
    ('the-long-fall', 'The Long Fall', the_long_fall, 130,
     (5, 11, 'nothing to land on out there')),
    ('nothing-underneath', 'Nothing Underneath', nothing_underneath, 125,
     (5, 11, 'the ledges keep getting smaller')),
    ('the-last-jump', 'The Last Jump', the_last_jump, 70,
     (5, 11, 'one flag. Make it count.')),
]


def render(key, name, rows, seconds, hint, width):
    hintjs = "      { col: %d, row: %d, text: '%s' },\n" % hint
    shaftjs = "".join("      { col: %d, width: %d, tilt: %s },\n" % s
                      for s in shafts(width, 5))
    return ("  '%s': {\n\n    name: '%s',\n    gravityScale: 0.8,\n"
            "    timeLimit: %d,\n\n    lightShafts: [\n%s    ],\n\n"
            "    hints: [\n%s    ],\n\n    map: [\n%s    ],\n  },\n\n"
            % (key, name, seconds, shaftjs, hintjs,
               "".join("      '%s',\n" % r for r in rows)))


def main():
    src = open(LEVEL_JS, encoding='utf-8').read()
    for key, name, build, seconds, hint in LEVELS:
        m, width = build()
        rows = m.rows(width)
        block = render(key, name, rows, seconds, hint, width)
        if "'%s': {" % key in src:
            i = src.index("  '%s': {" % key)
            j = src.index("\n  },\n", i) + len("\n  },\n\n")
            src = src[:i] + block + src[j:]
        else:
            i = src.index("};", src.index('const LEVELS'))
            src = src[:i] + block + src[i:]
        air = sum(1 for c in range(width)
                  if not any(rows[r][c] == '#' for r in range(H)))
        print('%-22s %3d wide  %4.1f%% of it is thin air  %ds'
              % (name, width, 100 * air / width, seconds))
    open(LEVEL_JS, 'w', encoding='utf-8').write(src)
    print('\nwritten to js/level.js -- now run: node tests/playable.test.js')


if __name__ == '__main__':
    main()
