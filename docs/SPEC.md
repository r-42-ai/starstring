# STARSTRING — GAME SPEC

*A string between stars.*

**Designer:** Nea
**Built with:** AI, guided by Nea's specifications
**Platform:** Tablet first, phone second. Must work offline.

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

At the start you pick from **7 characters**:

**People (4):**

| # | Hair |
|---|------|
| 1 | Long dark hair |
| 2 | Short curly hair |
| 3 | Blonde ponytail |
| 4 | Red hair in two buns |

**Animals (3):**

| # | Animal |
|---|--------|
| 5 | Cat |
| 6 | Fox |
| 7 | Rabbit |

Animals wear space suits too, with their ears folded inside the helmet.

### Suit colour

Separately from your character, you pick a **suit colour**: orange, blue, green, purple, pink, or white. So 7 characters × 6 colours = **42 combinations**.

> ⚙️ *Build note: this only works if the suit is drawn **white/light grey** in the artwork, so the code can tint it any colour. Tinting an orange suit blue is impossible. Same rule for Blob — draw it pale, colour it in code.*

### Unlocking

You start with 2 characters and 2 colours. The rest are bought with **Star Bits** you collect while playing. This gives collecting a point.

> ⚙️ *Build note: the character-select screen is a later feature. The game gets built with one character first.*

---

## 4. Blob (Your Pet)

A round, squishy, glowing creature about the size of a football. It bounces instead of walking, and squashes and stretches when it lands.

**It glows differently depending on its mood:**

| Colour | Mood |
|--------|------|
| Warm yellow | Happy |
| Blue | Sad or scared |
| Pink | Excited |
| Green | It has spotted something hidden |

### What Blob does in the game

**Before you rescue it (most of the game):** Blob is what you're chasing. You see its glowing trail through the level, and at the end of each planet you get a short scene where you almost reach it.

**After you rescue it (final planet, and free-play afterwards):** Blob follows you around, lights up dark areas, and glows green when there's a secret nearby.

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
**Mood:** underground, glowing, beautiful, a bit echoey and mysterious
**Colours:** deep purple and near-black rock; hot pink, cyan and white crystals that give off light; pools of glowing liquid

**What's in it:**

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

**Why:** instant refresh, no toolchain between Nea and the result, and AI assistants generate reliable vanilla canvas code.

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
- **Every tunable number lives in `config.js`** — gravity, run speed, acceleration, friction, jump velocity, coyote time, jump buffer, fall multiplier, corner-correction distance, grapple range, rope pump force, rope damping, max angular speed, terminal velocity. Nea should be able to change how the game feels without touching any logic.
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

**STARSTRING** — chosen by Nea.

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
