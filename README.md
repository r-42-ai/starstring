# STARSTRING

*A string between stars.*

A jump-and-run game for tablets. You crash on an alien planet, your glowing pet blob runs off, and you follow its trail across a star system with a grappling hook.

**Designed by Nea. Built with AI.**

---

## Playing it right now

Open `index.html` in a browser. That's it — no installing, no build step, no internet.

**Title screen → the planet → tap a level.** Level 1 teaches you how to
play; everything after it is unlocked by finishing the one before.

### How the game teaches you

There is no page of instructions, and that's deliberate: nobody reads
them. Instead the hints float **in the world**, right where the thing
they're about is, and only when you get near.

**Level 1 — "First Steps"** teaches, in this order and one at a time:
run, jump, grapple, **let go**, a golden **flag**, a **cyan** ring, a
**green** ring, a **red** ring, the portal. Each of the three rings gets
a dip of its own, with its hint right beside it — naming all three at
once teaches nobody anything.

It has no clock and nothing in it can kill you: every dip has a floor
and can be jumped back out of. A tutorial that punishes you teaches you
to be frightened.

**Level 2 — "The Way Out"** teaches the rest, again one thing at a time
and right where you first meet it: the clock, green rings, flags, the
illusions, red rings, and the six-ring finale.

**Level 3 — "The Illusions"** stops teaching and starts lying. Seven
traps in a row: a wall you walk through, a floor that isn't there, a
whole bridge across a chasm that doesn't exist, three thick walls each
with a fake tunnel, stepping stones where every other one is a lie, and
a landing spot by the portal that will drop you into nothing.

It gets **one** hint, right at the start — *"this whole place lies to
you"* — and then says nothing else for two hundred blocks. Three flags
make being wrong survivable; the clock is 2:45 instead of 3:00, because
it's meant to be harder.

### Say each thing once

Two corrections from Nea, both the same rule:

> **"in the illusions there are too many clues"**
> **"the rules you had in lev 1 don't have to pop up again in lev 2"**

The hint count now only ever goes **down**:

| | | |
|---|---|---|
| **Level 1** | 9 hints | teaches everything, one thing at a time |
| **Level 2** | 2 hints | only what's new: *the clock*, and *the level can lie* |
| **Level 3** | 1 hint | the rule, and never an answer |

Level 2 used to re-explain green rings, red rings, flags and the portal
— all four of which level 1 already teaches properly, with a whole dip
of its own for each. Repeating them says two things to the player, and
neither is good: that the game wasn't listening the first time, and that
hints are noise you can skip. **Once hints are skippable, the two that
matter get skipped as well.**

`flow.test.js` now enforces this: no level after the first may say the
words GREEN, RED, FLAG, JUMP, GRAPPLE, run or swing, and the hint count
can never go back up.

### Finishing a level

The portal hands you straight back out to the planet, with the level
ticked off — from every level, which `flow.test.js` checks by actually
playing each ending.

One thing that needed fixing there: finishing level 3 unlocks level 4,
and level 4 **hasn't been built yet**. The map lit it up gold, pulsed
it, and said *play me* — and tapping did nothing at all. A button that
begs to be pressed and then ignores you is worse than no button. So
*unlocked* ("you've earned it") and *playable* ("and it exists") are now
two different questions, and only playable levels glow.

> `playable.test.js` checks something stricter for level 1 than for any
> other level: **all thirty** playing styles must finish it, not just
> one. A teaching level that a bad player can fail isn't teaching. For
> level 3 it checks the opposite — that *fewer* styles can finish it
> than level 2, so "harder" is measured rather than hoped for.

**On a laptop:**

| | |
|---|---|
| move | ← → or **A / D** |
| jump | **space** |
| grapple | **shift** or **E** |
| rope shorter / longer | ↑ ↓ or **W / S** *(only while swinging)* |

Jump is space and only space — up/down and W/S are needed for the rope,
and one key can't sensibly do two things.

**On a tablet:** the buttons on screen. The grapple button lights up when
there's a ring close enough to grab.

**The grapple button works two ways, and it works out which you meant:**

| | |
|---|---|
| **Hold** it, then let go | you drop off the moment you release |
| **Quick tap** | you stay hanging with nothing held down. Tap again to drop |

The quick tap matters on a tablet: grapple and jump are both under your
right thumb, so if you had to hold grapple you could never press jump.

While swinging: **left/right to pump** (timing matters — press the way
you're already going), and **jump to launch off** with a boost.

**Three kinds of ring** (Nea's idea):

| | |
|---|---|
| 🔵 **cyan** | the normal one — 6 swings |
| 🔴 **red** | breaks after 4. Keep moving. |
| 🟢 **green** | never breaks. Somewhere safe to stop and think. |

The ring **blinks red and fast** when the rope is nearly gone.

**Flags** light up as you pass them, and there are only three — only
before the hard parts. A flag every few blocks would mean never really
being in danger.

**The level lies to you.** In three places it shows you something that
isn't true:

- a **wall** across the low corridor that you can walk straight through
- a **ledge** across the great chasm that isn't there at all
- a **tempting high ledge** above the second chasm that goes nowhere

Once you've walked through an illusion it shimmers from then on, so you
never have to remember where it was. The trick is fun once and tedious
every time after that.

> The rule that makes this work: **an illusion must be a trick, not a
> wall.** My first attempt put a fake floor on the only route through the
> level, which doesn't make it tricky — it makes it impossible. The
> playable test caught it immediately.

**The portal** at the end is the way out. You have to get *into* it, and
where it sits is the last puzzle of the level.

**There's a clock.** Three minutes. It goes red at 30 seconds and starts
beating at 10. Reaching a flag winds it right back up.

**Two different mistakes, two different punishments:**

| | |
|---|---|
| fall down a hole | back to the last flag |
| **run out of time** | **back to the very beginning** |

That gap is the whole point. If a flag saved you from the clock too, the
clock wouldn't be frightening — and a clock nobody is afraid of may as
well not be there.

> The three minutes isn't a guess. `node tools/measure_time.js` plays the
> level with the robot and reports how long it takes (33.5 seconds — it
> never hesitates), and the limit is set about five times that, because a
> person still learning a level is far slower than a machine that already
> knows it.

---

## The planet map

The game opens on **the whole Crystal Planet**, turning in space, with
**fifteen levels** marked on it and a path winding between them.

| | |
|---|---|
| turn it | **drag** with the mouse or a finger |
| zoom | **scroll**, or **pinch** with two fingers |
| play a level | **tap** it |

Only level 1 is open to begin with. Finish it and level 2 lights up, and
the path between them turns gold. Finish a level and you come straight
back out here.

**You stand on the last level you played** — small, on the surface, and
turned so your feet point at the middle of the planet. That last bit
matters: "standing up" means something different at every spot on a ball,
and without it she'd look like a sticker on glass.

**The planet is a cut crystal**, not a ball. It's built from hundreds of
flat faces, each lit on its own depending on which way it points, with
shards of crystal breaking the outline all the way round.

The first version was a smooth green sphere and it looked like a grassy
world. The problem wasn't the colour — it was the **smoothness**. Anything
shaded with a soft gradient reads as something soft. Crystal is flat faces
meeting at sharp edges, so that's what it's made of now.

Three things do the work:

- **facets** — flat panes, each a single flat colour, no gradients anywhere
- **edges** — a bright line along every join, so you can see the cuts
- **shards** — spikes breaking the round outline, so the silhouette says
  "crystal" before you've consciously looked at anything

The **green and gold match the levels exactly** — the same colours you're
walking through inside the caves. A map painted in different colours to
the game feels like a different game.

They run in **veins** rather than being scattered face by face. Random per
face gives you a beach ball; real rock comes in bands.

All of it is in `config.js` under `PLANET.COLORS`, so you can repaint the
whole planet by changing four colours.

Levels round the back of the planet are hidden, exactly as they should
be — that's what makes it feel like a ball rather than a picture of one.

> **How a flat screen draws a round planet.** Every level sits at a
> latitude and longitude, like a place on Earth. Three lines of maths
> turn that into a point in space, the whole ball gets spun by however
> far you've dragged, and then to put it on screen we simply **throw the
> depth away** and draw the other two numbers. The depth isn't wasted
> though: its sign tells us whether a point is on the near side or round
> the back, and hiding the back is the entire illusion.

---

## Where things are

```
index.html          the page itself
css/style.css       almost nothing — the game is drawn on a canvas
js/config.js        ★ every number that decides how the game FEELS
js/level.js         ★ the level, drawn with letters
js/player.js        running, jumping, bumping into things
js/grapple.js       the swinging rope
js/camera.js        which bit of the world you can see
js/input.js         buttons and keyboard
js/title.js         the title screen
js/planet.js        the map: where the levels are on the planet
js/planetdraw.js    the map: what it looks like
js/game.js          the clock, the two screens, and the drawing
js/assets.js        loads pictures (and shrugs if they're missing)
assets/             pictures go here
docs/               ★ the design documents
```

★ = the files Nea will spend the most time in.

---

## The documents

| File | What it's for |
|---|---|
| `docs/SPEC.md` | The whole game described in words. The source of truth. |
| `docs/BUILD_ROADMAP.md` | 31 steps to build it. Tick them off. |
| `docs/ART_PROMPTS.md` | Every picture the game needs, and what to type to make it. |
| `docs/GEMINI_PROMPTS.md` | Batches 1 and 2, ready to paste. Start here. |

---

## Two things to try first

**1. Change how it feels.** Open `js/config.js`, find `JUMP_SPEED`, change `-920` to `-1200`. Reload. Then try `FALL_MULTIPLIER` at `1.0` instead of `1.9` and feel how wrong it is. That one number is most of what makes a jump feel good.

**2. Change the world.** Open `js/level.js`. The level is drawn with dots and `#`. Move some blocks, save, reload. You just designed a level.

---

## Working on it

- One step from the roadmap at a time
- When something works, **save a copy of the whole folder** with a number: `v04_camera_works`. AI rewrites break working things.
- When it breaks, spend five minutes working out why *before* asking the AI. That's where the learning is.
- Every number that controls feel goes in `config.js` — never buried in the code

---

## Where it's up to

- [x] **Steps 1–4** — moving, gravity, jumping, platforms, and a jump that feels right
- [x] **Step 5** — a camera that follows you
- [x] Real artwork for the buttons and the hero, plus movement animation
- [x] **Steps 8–11** — the grappling hook 🪝 swing, pump, reel in/out, release, recharge
- [x] **Step 7** — scrolling background layers *(drawn in code, no art needed)*
- [x] The Crystal Planet: green and gold faceted rock, glitter, light shafts
- [x] **Step 14** — flags you respawn at
- [x] **Step 19** — a portal to finish the level
- [x] A 236-block level (twelve screens), verified beatable by test
- [x] **Steps 20b, 22** — a clock, and the planet map with 15 levels
- [x] **Step 22b** — a title screen, and a tutorial level that teaches
      by playing rather than by a page of text
- [ ] **Step 6** — proper walking frames *(needs art batch 3)*
- [ ] **Step 12** — collecting Star Bits
- [ ] **Steps 15–16** — spikes, crumbling platforms, Crystal Crawlers

Full list in `docs/BUILD_ROADMAP.md`.

---

## Checking nothing is broken

```
node tests/physics.test.js     # running, jumping, landing, walls
node tests/camera.test.js      # the view stays in the level and follows you
node tests/grapple.test.js     # swinging, aiming, momentum, recharging
node tests/input.test.js       # one finger can only press one button
node tests/level.test.js       # ★ is my level broken?
node tests/playable.test.js    # ★★ can my level actually be FINISHED?
node tests/planet.test.js      # the map: projection, zooming, unlocking
node tests/flow.test.js        # finishing a level takes you back to the map
```

**The last two are the ones for Nea.** Run them whenever you change a level.

`level.test.js` catches the obvious breakages: rows of different lengths,
a missing P, a ring stuck inside a rock.

`playable.test.js` actually **plays your level**. A little robot runs
right, jumps the gaps, grabs the rings, pumps the swing and launches off
— and it tries about thirty different playing styles, from cautious to
reckless. If none of them can finish, nobody can, however good they are.
It tells you which block it got stuck at.

Neither can tell you whether your level is *fun*. That part is yours.

Run them all after any change to `player.js`, `grapple.js`, `camera.js`
or `config.js`.

There are also tools that draw pictures of the game without opening a
browser, which is how the camera, the animation and the swing were checked:

```
node tools/render_preview.js       # one frame
node tools/render_camera_shots.js  # three frames from across the level
node tools/render_anim_strip.js    # a strip of running frames
node tools/render_swing.js         # plays the chasm and maps the whole path
node tools/render_tour.js          # three snapshots from around the level
node tools/measure_time.js         # ★ how long does my level take to finish?
node tools/render_planet.js        # four views of the planet map
node tools/render_screens.js       # the title screen and the tutorial hints
```
