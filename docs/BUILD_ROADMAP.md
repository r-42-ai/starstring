# STARSTRING — BUILD ROADMAP

**The rule: every step ends with something you can actually play.**

Never work on something for two sessions without seeing it run. If a step is too big to finish in one sitting, split it.

---

## How to work

1. Pick **one** step from this list
2. Describe it to the AI as precisely as you can
3. Try it on the tablet
4. If it's wrong, say **what** is wrong — not "fix it". *"The jump is too floaty and he takes too long to come down"* gets a good result. *"The jump is bad"* doesn't.
5. When it works, **save a numbered copy of the whole folder** — `v04_camera_works`
6. Tick the step off below

> **The most valuable habit:** when something breaks, spend five minutes trying to work out why *before* pasting the error to the AI. Those five minutes are where you actually learn. Then paste it and see if you were right.

---

## Phase 1 — A world that exists

**🎨 Art batches 1 and 2 first** — the Style Bible and the four control buttons.

### ☐ Step 1 — Hello, rectangle
A coloured rectangle on screen. Touch buttons move it left and right. It accelerates and slows down instead of snapping to full speed.

Three things must be right from the very first step, because retrofitting them later is genuinely painful:

- **Logical resolution 1280×720**, scaled to fit the screen with letterboxing. Never position anything in real screen pixels.
- **Fixed timestep** physics with an accumulator. Otherwise the game runs at a different speed on the tablet than on the laptop, and every number you tune will be wrong on the other device.
- **Touch buttons with oversized invisible hit areas** — the tappable region extends well beyond the visible button.

**Playable result:** you can slide a box around. Yes, really — this counts.

### ☐ Step 2 — Gravity and a floor
The box falls. There's ground it lands on. The jump button makes it jump. Hold longer = higher.
**Playable result:** a jumping box.

### ☐ Step 3 — Platforms
A handful of platforms to land on. Collision resolved **X first, then Y, separately** — this is the step that goes wrong if rushed.
**Playable result:** a jumping box in a small level. This is a real platformer already.

### ☐ Step 4 — Make the jump feel *good*
Coyote time, jump buffering, faster falling than rising, and **corner forgiveness** — if you clip the corner of a platform by a pixel or two, you get nudged past it instead of stopping dead. Put every number in `config.js`.
**Playable result:** the same game, but suddenly it feels right. Spend real time here. Change one number at a time and feel the difference — this is the most instructive step in the entire project.

### ☐ Step 5 — Camera
The view follows the hero, with a bit of lag so it feels smooth. Bigger level to move through.
**Playable result:** a world instead of a screen.

**🎨 Art batch 3 goes in here** — hero frames, ground tiles, all three background layers.

### ☐ Step 6 — The hero is a real character
Replace the rectangle with the sprite. Idle animation, run animation, jump and fall frames. Flip the sprite when running left.
**Playable result:** your actual character, running around your actual world.

### ☐ Step 7 — Parallax background
Three layers scrolling at different speeds.
**Playable result:** it now looks like a real game. Show someone.

---

## Phase 2 — The grappling hook 🪝

*The boss fight of the project. Take it in three parts.*

**🎨 Art batch 4 goes in first** — anchors and `hero_grapple`.

### ☐ Step 8 — Anchors exist
Place glowing anchor points in the level. They pulse brighter when the hero is close enough to reach one. Also build the two rules about *which* anchor you get: **nearest one within grapple range**, and **line of sight** — a raycast that refuses the shot if a wall is in the way.
**Playable result:** nothing new to do, but you can see where the rope will be able to go.

### ☐ Step 9 — Rope that pulls (the easy version)
Press grapple → a rope line draws to the chosen anchor → the hero gets pulled toward it. No swinging yet. Add tapping directly on an anchor to pick that one instead of the nearest.
**Playable result:** you can zip around. Already fun. Play it for a while before moving on.

### ☐ Step 10 — SWINGING 🎉
Follow the polar-pendulum method in **SPEC.md section 14** exactly — track the rope's angle and how fast the angle is changing, not the hero's position.

⚠️ The obvious approach (move the hero, then snap them back onto a circle) leaks energy and the swing dies out. If your swing keeps slowing down on its own, that's the bug, and the spec explains the fix.

Left and right *pump* the swing, and the timing matters. Releasing keeps all your momentum. The rope snaps if you swing into a wall.
**Playable result:** the game you actually designed. This is the big one.

### ☐ Step 11 — Swing polish
Shorten the rope while hanging — and make it speed you up, like tucking your legs on a real swing. Jump off the rope for extra height. Star Bits placed in arcs that show you where a good swing goes.
**Playable result:** swinging that feels skilful instead of random.

---

## Phase 3 — A real level

**🎨 Art batch 5 goes in here.**

### ☐ Step 12 — Collectibles
Star Bits you pick up, a counter on screen.

### ☐ Step 13 — Hearts and dying
Health, losing hearts, respawning, the hurt animation. Falling in a pit.

### ☐ Step 14 — Beacons (checkpoints)
They light up when passed. You respawn at the last one.

### ☐ Step 15 — Hazards
Spikes. Crumbling platforms that shake, crack and fall.

### ☐ Step 16 — Crystal Crawlers
Patrolling enemies. Bounce on the head to squash (and bounce higher). Side contact hurts. Add **invincibility frames** — a moment after being hit where you can't be hit again and the hero flashes. Without it you can lose all five hearts standing in one place, which feels broken.

### ☐ Step 17 — Levels as data
Move the level into a proper level file — a grid of tiles plus a list of objects.

⚠️ **Level files must be plain JavaScript objects loaded with a `<script>` tag, not JSON.** Opening the game from a file on disk blocks JSON loading, and it fails quietly — you'll get a blank screen and no useful error.
**This is the big moment.** From here you can design levels forever without touching a single line of engine code. You stop being a programmer and become a game designer.

### ☐ Step 18 — Build Crystal Caves levels 1–4
Now it's pure design work. *First Steps*, *The Rings*, *Deep Down*, *The Great Chasm*.

---

## Phase 4 — A real game

**🎨 Art batch 6 goes in here.**

### ☐ Step 19 — Level start and finish
A goal marker at the end. A level-complete screen showing Star Bits and Blob Traces found.

### ☐ Step 20 — Two modes
Relaxed and Challenge, from one settings object: hearts, checkpoint frequency, whether pits cost a heart. Mostly just numbers.

### ☐ Step 21 — Challenge medals
A level timer, target times per level, gold/silver/bronze on the level-complete screen. Challenge mode only. *(Separate step because it's real code, not a setting.)*

### ☐ Step 22 — Blob Traces
Three hidden per level, plus Blob's glowing trail as decoration showing the path it took. A counter. Finding all three on a planet unlocks a bonus level.

### ☐ Step 23 — Title screen and star map
Blob on the title screen. A map with Crystal Caves unlocked and the other planets locked.

### ☐ Step 24 — Saving
Progress, Star Bits and unlocks saved on the device so they survive closing the game.

### ☐ Step 25 — Sound
Jump, land, collect, hurt, the *thwip* of the rope. Sound is worth more than you'd think — it roughly doubles how good the game feels for about an hour of work.

### ☐ Step 26 — Offline install
Manifest and service worker. Put it on GitHub Pages, add it to the tablet's home screen.
**Playable result:** a real app icon on your tablet, working with no internet. Show everyone you know.

### ☐ Step 27 — The planet finale
The scene where you see Blob and it darts away.

---

## Phase 5 — More

### ☐ Step 28 — Blob as a companion
Once rescued, Blob follows you, lights up dark areas, and glows green when a secret is nearby. Needs following behaviour, a light effect, and secret-detection.

**🎨 Art batch 7.**

### ☐ Step 29 — Character select
7 characters, 6 suit colours, unlocked with Star Bits. The tinting system that makes 42 combinations out of 7 sprite sets lives here.

### ☐ Step 30 — Planet 2
New art, new gravity number, new speciality hazard. Everything else already exists — this is where all the earlier work pays off and a whole planet takes days instead of months.

### ☐ Step 31 — A level editor
Build levels inside the game itself instead of editing files. Ambitious, and the single most fun thing you could possibly add.

---

## Keeping the code healthy

AI-built projects rot if nobody watches for it. Three habits prevent it:

- **All tunable numbers in `config.js`**, never buried in the code
- **Ask for comments in plain language** you can read — you should be able to skim any file and roughly know what lives where, even though you didn't write it
- **When a file passes ~400 lines, split it.** Ask the AI to do it, then check the game still runs and save a version

If it ever gets truly unfixable: **`SPEC.md` still describes the whole game.** You can rebuild from it. That's why the spec exists.

---

## Roughly how long

| Phase | Sessions |
|---|---|
| 1 — A world that exists | 3–5 |
| 2 — The grappling hook | 2–4 |
| 3 — A real level | 4–6 |
| 4 — A real game | 6–9 |
| 5 — More | forever |

**A playable, good-looking game with swinging: somewhere around 15–25 sessions.**

But you'll have something worth showing people after Phase 1.
