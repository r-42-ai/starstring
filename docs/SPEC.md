# STARSTRING — GAME SPEC

*A string between stars.*

**Designer:** AXY
**Built with:** AI, guided by AXY's specifications
**Platform:** Tablet first, phone second. Must work offline.

---

## 0. New Ideas From AXY — being folded in

Three changes she made after the first draft. Recorded here word-for-word
so nothing gets lost; the sections below are being updated to match.

1. **Four heroes, each with their own superpower.** ✅ folded into §3 and §5b.
   Two girls, two boys: grappling hook, super dash, wall climbing, long jump.
   Swappable mid-level. Turns one game into four.

2. **Every planet has its own blob to rescue.** ✅ folded into §4.
   All different — the Crystal Caves one has diamonds on its head.

3. **Anchors recharge.** ✅ folded into §5. Four seconds rather than a
   minute, with the reasoning written out so AXY can judge it herself.

*All three are now part of the spec proper. This section can be deleted
once everyone has read it.*

---

## 1. The Pitch

You and your pet glowing blob crash-land in an alien star system. In the crash, your blob gets scared and runs off — leaving a trail of glowing footprints across strange planets. You have a space suit and a grappling hook. Go find your friend.

It's a jump-and-run game where the best part isn't running or jumping — it's **swinging**. Every planet pulls with a different gravity, so the same swing feels completely different depending on where you are.

---

## 2. The Story

Your ship breaks apart above an unexplored star system. You make it to the surface. Your blob doesn't stay with you — it panics and bolts.

Blobs glow. That turns out to be lucky, because it leaves faint traces of light behind wherever it goes. You follow the glow from planet to planet.

At the end of each planet you get **close** — you see it, you nearly reach it, and it darts away again, scared. You only actually catch it at the very end of the game, when it finally recognises you.

**Ending:** you sit down and stop chasing. You wait. The blob comes to you.

---

## 3. Your Hero

You're a kid in a space suit. Every suit has a **clear round helmet visor** — so whoever you chose is always visible through the glass.

### Choosing your character

Four kids crash-landed together: **two girls and two boys**. Each of them can do something the others can't.

### The four heroes and their powers

| Hero | Power | What it does |
|---|---|---|
| 1 | 🪝 **Grappling hook** | Fires a rope at glowing anchors and swings from them. The signature move of the game — the one the game is named after. |
| 2 | 💨 **Super dash** | A fast burst forward that smashes straight through cracked crystal walls, opening secret rooms nobody else can reach. |
| 3 | 🧗 **Wall climbing** | Sticks to walls and climbs straight up them. Turns the Crystal Caves' tall shafts into staircases. |
| 4 | 🦘 **Long jump** | A huge leap across distances a normal jump can't cross. Recharges every **7 seconds**, so you have to pick your moment. |

Everyone can run and jump. The power is the *extra*.

### Swapping

**You can change hero at any time, in the middle of a level.** Press the swap button and you become someone else instantly, right where you're standing.

### Every hero has their own path

*(AXY's rule, and it's the heart of the game.)*

A level is **not** one route with optional extras. It's **four routes braided together**.

Some parts can *only* be crossed by one hero:

| Obstacle | Only crossable by |
|---|---|
| A canyon with rings above it | 🪝 the grappler |
| A cracked crystal wall | 💨 the dasher |
| A tall smooth shaft | 🧗 the climber |
| A gap too wide to jump | 🦘 the long-jumper |

So you don't pick a hero and hope. You read what's in front of you, work out *who you need to be*, and become them.

**And because swapping is free and instant, you can never get stuck.** That's what makes hard locks fair — the lock is a puzzle, not a punishment.

> ⚠️ **The one level design rule that must never be broken:**
> every place you can reach must be escapable by *at least one* of the four.
> Break this and the player is trapped forever and has to restart. It's the
> single most important thing to check when building a level.

### Their own levels too

As well as the braided main levels, each hero gets **bonus levels built entirely around their power** — a whole level of nothing but swinging, a whole level of nothing but climbing. Unlocked by finding that planet's Blob Traces.

> ⚙️ *Build note: the code stays simple — one character controller with a `power` setting, plus four sets of pictures. All the design work lives in the levels, which is exactly where you want it.*

### Suit colour

You also pick a **suit colour**: orange, blue, green, purple, pink, or white. So 4 heroes × 6 colours = **24 looks**.

> ⚙️ *Build note: this only works if the suit is drawn **white/light grey** in the artwork, so the code can tint it any colour. Tinting an orange suit blue is impossible. Same rule for the blobs — draw them pale, colour them in code.*

### Unlocking

All four heroes are available from the start — the game doesn't work if you can't swap. **Star Bits** buy suit colours and power upgrades instead (a longer rope, a faster dash recharge).

> ⚙️ *Build note: the swap screen is a later feature. The game gets built with one hero and the grappling hook first, and the other three powers get added one at a time.*

---

## 4. The Blobs

Round, squishy, glowing creatures about the size of a football. They bounce instead of walking, and squash and stretch when they land.

### Your blob

The one you're chasing. It ran off when you crashed, and it's frightened. You don't catch it until the very end.

**It glows differently depending on its mood:**

| Colour | Mood |
|--------|------|
| Warm yellow | Happy |
| Blue | Sad or scared |
| Pink | Excited |
| Green | It has spotted something hidden |

### One blob to rescue on every planet

**Every planet has its own blob, and they all look different.** They live there, and each one is stuck or trapped somehow. You rescue one per planet, and it joins you.

By the end of the game you have a whole crew of blobs bouncing along behind you — and then you finally catch your own.

| Planet | Its blob |
|---|---|
| Crystal Caves | **Crystal blob** — diamonds growing out of its head, deep glowing purple |
| Jungle Moon | Leafy green, little vines trailing off it |
| Ice Moon | Pale blue, frosted, snowflakes drifting around it |
| Machine Planet | Metallic, bolts and a flickering screen for a face |
| Storm Planet | Crackling yellow, sparks jumping across it |

> ⚙️ *Build note: cheap to build, big payoff. It's one drawing per planet and one colour value — the bouncing, squashing and following code is written once and shared by all of them.*

### What a rescued blob does

It follows you, lights up dark areas, and glows green when there's a secret nearby. The more blobs you've rescued, the brighter your little parade gets.

---

## 5. How You Move

### Basic movement

- **Run left and right** — with a little acceleration, so you build up speed rather than snapping instantly to full speed
- **Jump** — hold the button longer to jump higher
- **Fall** — you fall faster than you rise, which makes jumps feel snappy instead of floaty

### Feel rules (these matter more than they sound)

These are small mercies that make a platformer feel good instead of frustrating. Every good platformer has them, and most players never notice:

- **Coyote time** — if you run off a ledge, you can still jump for about 0.1 seconds afterwards
- **Jump buffering** — if you press jump slightly *before* you land, it still counts when you touch down
- **Variable jump height** — let go early, jump lower
- **Gentle corner forgiveness** — if you clip the corner of a platform by a pixel or two, you get nudged past it instead of stopping dead

### THE GRAPPLING HOOK

This is the signature move of the game.

**How it works:**

1. Only **glowing anchor points** can be grappled. They're placed deliberately by the level designer. On the Crystal Caves they're **glowing cyan crystal rings**; later planets get their own look (vines, metal hooks), but always the same glowing cyan light, so you never have to learn a new rule.
2. Anchors **pulse brighter** when you're close enough to reach one.
3. Press the **grapple button** and the rope fires to the nearest reachable anchor. You don't have to aim precisely — the game helps you. (You can also tap directly on a specific anchor if you want to choose.)
4. **Hold** the button to stay attached. **Release** to let go.
5. While hanging, you **swing like a pendulum**. Pressing left and right doesn't move you directly — it *pumps* the swing, exactly like a real playground swing. Time it right and you go higher and higher.
6. When you let go, you keep all your speed. A well-timed release launches you a long way.

**Rules:**

- Max grapple range: about 5 tiles. You simply can't attach to anything further away, so the rope is never longer than that.
- You can't grapple through walls — the rope needs a clear line when it fires
- **The rope snaps if you swing into a wall.** Clear, fair, and it stops the game glitching.
- You can shorten the rope while hanging — and just like a real swing, pulling yourself in makes you go *faster*
- You can jump off the rope for a little extra boost

### Anchors have to recharge

**Once you let go of an anchor, it goes dim and stops working for a few seconds.** Then it lights back up and you can use it again.

This stops you swinging back and forth on the same ring forever, and turns a row of anchors into a proper challenge: you have to keep moving forward, because the one behind you has gone out.

| | |
|---|---|
| Recharge time | **4 seconds** *(AXY originally said a minute — see below)* |
| Recharging anchor | dark, dull, obviously not usable |
| Nearly ready | starts to flicker back on |
| Ready | glowing brightly again |

> 🎮 *A note on why not a minute: a minute is an extremely long time in a game. You'd swing once and then stand still doing nothing for the next fifty-five seconds. Four seconds is long enough that you can't cheat by swinging on the same ring over and over, but short enough that you never wait around. It'll be a number in `config.js` — set it to 60 and feel the difference. This is the kind of thing you can only judge by playing it.*

---

## 5b. The Other Three Powers

| Power | How it works | Rules |
|---|---|---|
| 💨 **Super dash** | A fast burst forward. Smashes through cracked crystal walls that nothing else can break. | Short recharge. Can't change direction mid-dash. |
| 🧗 **Wall climbing** | Hold towards a wall to stick to it, then climb up. | You slide down slowly rather than climbing forever — otherwise there's no challenge in a tall shaft. |
| 🦘 **Long jump** | An enormous leap forwards, much further than a normal jump. | Recharges every **7 seconds**. Only works from the ground, not in mid-air. |

**Design rule for every level:** a normal run-and-jump route must exist all the way to the end. The powers are for reaching *extra* places — secrets, shortcuts, Blob Traces — never for basic progress.

**Why swinging is worth the effort:** it's the only move in the game that rewards *timing* rather than accuracy. Anyone can learn to jump. Learning to swing well takes practice — and that's what makes the game feel good months later.

---

## 6. Gravity

Every planet pulls differently. This is what stops later planets feeling like more of the same.

| Planet type | Gravity | How it feels |
|---|---|---|
| Small moon | 0.5× | Enormous floaty jumps, long slow swings |
| Crystal caves | 0.8× | Slightly light, comfortable, good for learning |
| Normal planet | 1.0× | Standard, snappy |
| Heavy world | 1.4× | Short jumps, fast falls, swings whip around quickly |

**Important:** gravity is a single number in the level file. Changing it changes the entire feel of a level without touching any other code. This is the cheapest possible way to make the game feel varied.

---

## 7. Two Difficulty Modes

The player chooses at the start, and can change any time.

| | 🌱 **Relaxed** | 🔥 **Challenge** |
|---|---|---|
| Hearts | 5 | 3 |
| Checkpoints | Often | Only at big milestones |
| Falling in a pit | Respawn instantly, no heart lost | Lose one heart |
| Enemies | Stunned for a moment after they hit you, so you can escape | No mercy |
| Running out of hearts | Back to last checkpoint | Back to start of level |
| Timer | None | Optional time targets for medals |

Both modes have the same levels and the same secrets. Nothing is locked behind Challenge mode.

> ⚙️ *Build note: this is almost entirely a data change — one settings object with different numbers. Very little extra code.*

---

## 8. Danger

Each planet has its own **speciality**, so you're not fighting everything at once.

### Crystal Caves (Planet 1) — creatures and crumbling ground

- **Crystal Crawler** — a wobbly six-legged creature that walks back and forth along a platform. Bounce on its head to squash it (and bounce extra high). Touch it from the side and you lose a heart.
- **Crystal spikes** — sharp formations growing from floors and ceilings. Touch = lose a heart.
- **Crumbling crystal platforms** — they shudder, crack, and fall about half a second after you land. Keep moving.
- **Bottomless pits** — the caves have deep shafts.

### Later planets (ideas, not decided yet)

- **Jungle moon** — spore clouds, snapping plants, vines that swing
- **Ice moon** — slippery floors, cracking ice, freezing wind that pushes you
- **Machine planet** — broken robots that patrol, lasers, conveyor belts
- **Storm planet** — lightning, wind that changes your jump arc mid-air

---

## 9. What You Collect

| Thing | What it does |
|---|---|
| ⭐ **Star Bits** | Scattered everywhere. Spend them on characters and suit colours. |
| 💛 **Hearts** | Refill one heart. |
| 🔵 **Blob Traces** | Three hidden per level, glowing faintly. These are the "secrets" — finding all three of a planet unlocks a bonus level. |
| 🚩 **Beacons** | Checkpoints. They light up when you pass them. |

---

## 10. How the Game Is Structured

**Star map** → pick a planet → **planet** → 3–4 levels → **planet finale** (a short scene where you nearly reach Blob) → back to the star map, next planet unlocked.

Planned planets: **Crystal Caves** → Jungle Moon → Ice Moon → Machine Planet → Storm Planet → *Blob's hiding place*

You only need to build Planet 1 to have a real game. Everything after that is more of the same machine, with new numbers and new art.

---

## 11. Planet 1 — The Crystal Caves

**Gravity:** 0.8×

**Where you are:** *one enormous cavern with holes in the roof.* You're underground — closed in, cosy, echoey — but great shafts of sunlight pour down from far above, and you can see sky through the gaps. Best of both: the safety of a cave and something beautiful to look up at.

**Colours:** deep green rock, gold crystals. Rich and ancient, like somewhere valuable.

### The planet itself, seen from space

A **cut crystal**, not a ball: hundreds of flat faces, each lit on its
own, with shards breaking the outline. Gold and teal running in veins.

> ⚙️ *The lesson from getting this wrong first time: a smooth gradient
> reads as something SOFT, whatever colour you make it. Our first planet
> was green and smooth and looked like grass. Colour wasn't the problem —
> smoothness was. Flat faces and sharp edges are what say "mineral".*

### The level plays tricks on you

*(AXY's idea.)* Some blocks look **exactly** like solid rock and aren't
there at all. Not drawn differently, not see-through — painted by the
very same code as every other block in the cave, because anything else
would give it away.

Use them two ways:

- a **wall** hiding a shortcut nobody would guess at
- a **ledge or floor** that drops you when you trust it

Plus paths that simply lead nowhere, which need no code at all — just a
tempting ledge and the nerve to leave it empty.

> ⚠️ **The rule: an illusion must be a trick, not a wall.** Put a fake
> floor on the only route through a level and you haven't made it
> tricky, you've made it impossible. `tests/playable.test.js` checks this
> by actually playing the level.

Once you've walked through an illusion it shimmers from then on. The
trick is delightful once and infuriating every time after that.

### The one thing people will remember: the glittering

The crystals **twinkle**. Not a background effect — the whole cavern shimmers as you move through it, hundreds of tiny glints catching the light at different moments.

> ⚙️ *Build note: already built, and it costs almost nothing. Each sparkle's spot and timing is worked out from the block it sits on, so nothing has to be stored or remembered — a whole cave of glitter is free.*

### ⚠️ The readability problem gold created

Gold crystals and gold **Star Bits** look the same. That's a real problem: you can't tell treasure from scenery.

The rule that solves it:

> **Decoration never moves. Anything you can pick up always does.**

So gold rock crystals are dark, dull and perfectly still. Star Bits are bright, glowing, and bob and spin. Players learn this in seconds without being told a thing.

And the grapple rings stay **cyan** — a colour used for nothing else on the whole planet, so they can never be mistaken for scenery.

**What's in it:**

- **Shafts of sunlight** falling through holes in the roof, drifting and breathing
- Solid crystal ledges and rocky ground
- Crumbling crystal platforms
- Crystal spikes on floors and ceilings
- **Crystal rings** hanging from the ceiling — the grapple anchors, glowing cyan
- Crystal Crawlers patrolling
- Star Bits arranged in arcs that show you the path a good swing would take *(this is a nice trick: collectibles teach the player how to play without any text)*
- Three hidden Blob Traces

**The four levels:**

| Level | What it teaches | Name idea |
|---|---|---|
| 1 | Running, jumping, and the world | *First Steps* |
| 2 | Your first grapple anchors — short, safe swings over small gaps | *The Rings* |
| 3 | Crawlers, spikes, crumbling platforms — swinging under pressure | *Deep Down* |
| 4 | Everything at once, a long swing sequence over a huge chasm | *The Great Chasm* |

**Planet finale:** you reach a vast glowing cavern and see Blob sitting on a crystal spire. You get close. It looks at you, glows blue — scared — and vanishes into a tunnel. A new trail leads away, and the star map opens up.

---

## 12. Controls (Touch)

Landscape orientation. Big, forgiving buttons — invisible hit areas extend well beyond what you can see.

```
┌─────────────────────────────────────────────┐
│  ♥♥♥♥♥    ⭐ 42          (5 hearts Relaxed,  │
│                           3 in Challenge)   │
│                                             │
│                 GAME                        │
│                                             │
│                                             │
│   ( ◀ )  ( ▶ )              (GRAPPLE)      │
│                                (JUMP)       │
└─────────────────────────────────────────────┘
```

- Left thumb: **left / right**
- Right thumb: **jump** (lower) and **grapple** (upper)
- Grapple is **hold to stay attached, release to let go**
- Tapping directly on a glowing anchor also fires the rope at it

**Rule:** test on the real tablet early. Controls that feel fine with a mouse feel wrong with a thumb.

---

## 13. How It Looks

**Style: bold and colourful.**

- Big clear shapes, easy to read on a small screen
- Thick dark outlines around everything
- Flat bright colours with just one or two shades — no complicated shading or texture
- Very strong contrast between the *things you can touch* and the *background*: backgrounds are darker, softer and slightly blurred; anything you can stand on, grab or collect is bright and sharply outlined

**This last rule is the most important one in the whole document.** A player should be able to glance at any screenshot and instantly know what's solid, what's dangerous and what's decoration.

**Backgrounds** are built from three layers that scroll at different speeds (far, middle, near). This alone makes the game look professional.

---

## 14. Technical Notes

*(This section is for the AI doing the building, and for Papa.)*

**Stack:** plain HTML + CSS + JavaScript, Canvas 2D. No frameworks, no build step, no npm.

**Why:** instant refresh, no toolchain between AXY and the result, and AI assistants generate reliable vanilla canvas code.

**Files:**

```
/index.html
/css/style.css
/js/config.js      ← all tunable numbers live here
/js/engine.js      ← game loop, input, camera
/js/player.js      ← movement, jumping, grappling
/js/entities.js    ← enemies, collectibles, hazards
/js/levels/crystal-caves-1.js  ← level data as plain JS objects
/assets/           ← PNG sprites
/manifest.json
/sw.js             ← service worker for offline
```

**Key technical decisions:**

- **Logical resolution 1280×720**, scaled to fit the screen with letterboxing. Tile size 64px. Hero roughly 96px tall.
- **Fixed timestep** physics with an accumulator, rendering interpolated. Keeps the game feeling identical on a fast tablet and a slow phone.
- **Collision: resolve X and Y separately.** Move on X, resolve X overlaps; then move on Y, resolve Y overlaps. Doing both at once is the single most common source of bugs in platformers — the character catches on seams between tiles and jitters.
- **Levels are plain JS objects**, not JSON files. Opening `index.html` from disk blocks `fetch()`, so JSON level loading will silently fail. Levels are `<script>` includes.
- **Every tunable number lives in `config.js`** — gravity, run speed, acceleration, friction, jump velocity, coyote time, jump buffer, fall multiplier, corner-correction distance, grapple range, rope pump force, rope damping, max angular speed, terminal velocity. AXY should be able to change how the game feels without touching any logic.
- **Grapple swing physics — use a proper pendulum, not a position constraint.** The obvious approach (move the player, then snap them back onto a circle and delete the outward velocity) leaks energy every frame, so the swing quietly dies out instead of building up. Track the swing in **polar coordinates** instead:

  - State while attached: rope length `L`, angle `θ` from straight down, angular velocity `ω`
  - Each step: `ω += -(gravity / L) * sin(θ) * dt`, then `ω *= damping`, then `θ += ω * dt`
  - Position is derived: `pos = anchor + L * (sin θ, cos θ)`
  - **Pumping:** `ω += pumpForce * inputX * cos(θ) * dt`. The `cos(θ)` term is what makes it a *timing* skill — pressing right while the tangent points right adds energy, pressing at the wrong moment takes it away. Do **not** simplify this to "input adds angular velocity", or holding one button just spins the player round the anchor and the skill disappears.
  - Clamp `ω` to a maximum so it can't loop the anchor
  - **Shortening the rope:** conserve angular momentum — `ω *= (oldL / newL)²`. This is what makes pulling yourself in speed you up, exactly like tucking your legs on a real swing.
  - **On attach:** convert the player's current velocity to `ω = tangentialComponent / L`. Attaching is only allowed within grapple range, so the rope is never over-long and the player is never yanked.
  - **On release:** velocity = `ω * L` in the tangent direction. That preserved momentum is the entire feeling of the move.
  - **Terrain while swinging:** if the player's box overlaps solid tiles, **break the rope** and fall back to normal physics. Don't try to make the rope constraint and the tile collision negotiate — they will fight and jitter.

**Offline / getting it onto the tablet:** `manifest.json` + service worker, hosted free on GitHub Pages. One-time internet to add it to the home screen; fully offline after that, fullscreen with no address bar. Updates get pushed from the laptop instead of copying files around — which matters a lot on an iPad.

**Version discipline:** whenever something works, save a copy of the whole folder with a number and a name — `v07_swinging_works`. AI rewrites break working things, and being able to go back to "the version where the jump felt right" is essential.

---

## 15. The Name

**STARSTRING** — chosen by AXY.

A string between stars: the rope you swing on, and the thread connecting you to Blob.

---

## 16. Decided Later

- What Blob's hiding place looks like (the final planet)
- Music and sound
- Whether animals have different abilities, or are just a different look
- Whether there's a level editor *(there should be)*
- Names for the animal characters

---

*This document is the source of truth. If the code ever gets into a mess that can't be fixed, the game can be rebuilt from this file.*
