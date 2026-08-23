# STARSTRING — ART PROMPTS (Nano Banana Pro)

How to generate every picture the game needs, in one consistent style.

---

## THE GOLDEN RULE

**Generate the Style Bible first. Then make every single other asset by feeding that image back in as a reference.**

If you skip this, you get twenty assets that each look nice on their own and look completely wrong together. Character consistency from text alone is unreliable; character consistency from a reference image is very good. This one habit is the difference between a game that looks made and a game that looks assembled.

---

## STEP 1 — The Style Bible

Generate this **one image** and keep re-rolling it until Nea genuinely loves it. This might take twenty tries. It is worth every one of them, because everything else in the game inherits from it.

> A single reference sheet for a 2D mobile platformer game, bold colourful cartoon style. Shown on one image: a child astronaut with long dark hair, wearing a **white and light grey** space suit with a large clear round glass helmet, a small round **pale white glowing** blob creature, a chunk of purple crystal cave rock platform, a glowing cyan crystal ring, and a small gold star collectible. Art style: bold flat colours, thick dark outlines around every shape, minimal shading with only one or two tones per colour, very high contrast, clean readable silhouettes, modern mobile game art, vector-like. Side view, orthographic, no perspective. Solid flat magenta background, hex FF00FF. No text, no labels, no watermark.

> ⚠️ **The suit must be white/light grey and the blob pale white — not orange, not yellow.** The game colours them in code, which is how 7 characters turn into 42 combinations and how Blob changes mood colour. You cannot tint an orange suit blue. This is the one prompt detail that, if you get it wrong, costs you every character asset in the game.

**When it's right, save it as `STYLE_BIBLE.png` and never delete it.**

---

## STEP 2 — Everything Else

For every prompt below: **attach `STYLE_BIBLE.png` as a reference image** and begin the prompt with:

> Using the attached reference for style, character design, colours, line weight and proportions —

### Rules that apply to every single asset

| Rule | Why |
|---|---|
| Flat magenta background, hex **#FF00FF** | Far more reliable than asking for transparency. Removed afterwards with one script. Applies to backgrounds too — where a background needs a see-through gap, that gap is magenta. |
| **Same canvas size within a set** | So frames line up. Characters and objects: square, 512×512. Tiles: square, 512×512 *(the game draws them at 64px — check the seams still match after downscaling)*. Backgrounds: 1920×1080. |
| Side view, orthographic, no perspective | It's a 2D side-scrolling game. |
| **Character's feet at the same height in every frame** | Otherwise the hero bobs up and down while running, and it looks broken. This is the single most common mistake. |
| One asset per image | Generated sprite sheets have uneven spacing and are a nightmare to cut up. |
| No text, no watermark, no drop shadow, no ground shadow | Shadows get drawn by the code. |

---

## HERO — Character 1 (build with this one only, at first)

Generate these **10 frames**. Same character, same size, feet always at the same height.

| File | Prompt (after the reference preamble) |
|---|---|
| `hero_idle_1.png` | ...the child astronaut standing still, facing right, arms relaxed at sides, calm. Full body, feet at the bottom edge of the frame. |
| `hero_idle_2.png` | ...the same astronaut standing still facing right, but very slightly crouched with shoulders a little lower, as a breathing animation frame. Identical position and size, feet at the bottom edge. |
| `hero_run_1.png` | ...the same astronaut running right, left leg forward and extended, right leg back, arms swinging opposite. Feet at the bottom edge. |
| `hero_run_2.png` | ...the same astronaut running right, mid-stride passing pose, legs close together, body slightly raised. |
| `hero_run_3.png` | ...the same astronaut running right, right leg forward and extended, left leg back, arms swinging opposite. |
| `hero_run_4.png` | ...the same astronaut running right, mid-stride passing pose, legs close together, mirror of frame 2. |
| `hero_jump.png` | ...the same astronaut jumping upward, facing right, legs tucked slightly, arms raised, looking up, an energetic rising pose. |
| `hero_fall.png` | ...the same astronaut falling, facing right, legs spread apart for balance, arms out to the sides. |
| `hero_grapple.png` | ...the same astronaut hanging from a rope held in one raised hand, facing right, body angled, legs together and trailing, as if swinging. |
| `hero_hurt.png` | ...the same astronaut knocked backwards, facing right, head tipped back, arms flung up, an off-balance recoiling pose. |

> 💡 **The suit is white/light grey in the art and gets tinted in code** — so this one set of frames gives all six suit colours for free.

**Character 1 is the long-dark-hair girl** — the same one in the Style Bible. She's character #1 of the 7 in the spec.

### The other 6 characters (much later)

Same 10 frames each, always referencing the Style Bible **and** the finished character 1 frames:

> Using the attached references — the same astronaut suit, same proportions and identical pose, but with short curly hair visible through the helmet visor.

Remaining 6: short curly hair · blonde ponytail · red hair in two buns · cat · fox · rabbit. For the animals: *"the same astronaut suit and pose, but the character is a cartoon cat with ears folded down inside the round glass helmet."*

**Don't do this until the game works.** It's 60 more images.

---

## BLOB (the pet)

| File | Prompt |
|---|---|
| `blob_idle_1.png` | ...a small round glowing blob creature, soft squishy body, big friendly eyes, **pale white and glowing**, sitting still. Round shape. |
| `blob_idle_2.png` | ...the same blob creature, squashed slightly wider and flatter as a bouncing animation frame. Same size canvas. |
| `blob_squash.png` | ...the same blob creature squashed very flat and wide, as if it has just landed hard. |
| `blob_stretch.png` | ...the same blob creature stretched tall and narrow, as if launching upward. |
| `blob_scared.png` | ...the same pale white blob creature with eyes wide, body pulled in small and tight, looking frightened. |
| `blob_trail.png` | ...a small faint glowing paw-print-like smudge of light left behind on the ground, soft and blurry, pale white, as if something glowing passed by. *(Level decoration marking Blob's path — not the same as the hidden `blobtrace` collectible.)* |

> **Blob is drawn pale white on purpose.** All four moods — yellow happy, blue scared, pink excited, green secret-nearby — are done by tinting in code. That's why `blob_scared` no longer specifies blue: only the *pose* differs.

---

## CRYSTAL CAVES — Tiles

All tiles: **square canvas, 512×512**, designed to sit edge-to-edge with no visible seam.

| File | Prompt |
|---|---|
| `tile_ground_top.png` | ...a square tile of dark purple alien cave rock with a flat top surface, small glowing pink crystals growing along the top edge. Tileable horizontally, edges must match seamlessly. |
| `tile_ground_fill.png` | ...a square tile of solid dark purple alien cave rock interior, subtle darker cracks, no crystals, no top surface. Tileable in all directions. |
| `tile_platform.png` | ...a small floating platform of purple crystal rock, flat top, chunky rounded shape, glowing cyan crystal edge underneath. |
| `tile_crumble_1.png` | ...the same floating crystal platform, intact and solid. |
| `tile_crumble_2.png` | ...the same platform with visible cracks spreading across it and small chips breaking off, still whole. |
| `tile_crumble_3.png` | ...the same platform badly shattered and falling apart into chunks. |
| `spikes_floor.png` | ...a row of sharp jagged pink crystal spikes pointing upward, growing from a rocky base. Dangerous looking. |
| `spikes_ceiling.png` | ...a row of sharp jagged pink crystal spikes pointing downward, hanging from rocky cave ceiling. |

---

## GRAPPLE ANCHORS

These are the most important objects in the game to make readable. They must be **unmistakable**.

| File | Prompt |
|---|---|
| `anchor_idle.png` | ...a ring-shaped formation of glowing cyan crystal hanging from a small rocky mount, like a hoop you could throw a rope through. Softly glowing. Clearly a special interactive object. |
| `anchor_active.png` | ...the same glowing cyan crystal ring but much brighter and more intense, with a bright halo of light around it, clearly activated and ready to be grabbed. |

---

## COLLECTIBLES

| File | Prompt |
|---|---|
| `starbit.png` | ...a small bright gold five-pointed star with a soft glow and a rounded, chunky, friendly shape. |
| `heart.png` | ...a small bright pink glowing heart, rounded chunky shape, thick dark outline. |
| `blobtrace.png` | ...a small faint glowing blue wisp of light shaped like a tiny soft blob, semi-transparent and ghostly, like a trace someone left behind. |
| `beacon_off.png` | ...a small unlit alien beacon post, dark metal with a dull grey crystal lamp on top, planted in rock. |
| `beacon_on.png` | ...the same beacon post but the crystal lamp is lit bright warm orange and glowing strongly, with light spilling around it. |
| `goal_flag.png` | ...a tall glowing alien marker at the end of a level, a bright column of warm light rising from a metal base, unmistakably a finish point. |

> Beacons light **orange**, not green — green is reserved for Blob glowing near a secret. One colour, one meaning.

---

## ENEMY — Crystal Crawler

| File | Prompt |
|---|---|
| `crawler_1.png` | ...a small six-legged alien creature with a rounded crystal shell on its back, big simple eyes, walking to the right, legs in a forward stride. Wobbly and slightly silly rather than scary. Feet at the bottom edge. |
| `crawler_2.png` | ...the same creature walking right, legs in a different stride position, body bobbing slightly higher. Feet at the bottom edge. |
| `crawler_3.png` | ...the same creature walking right, third stride position. Feet at the bottom edge. |
| `crawler_4.png` | ...the same creature walking right, fourth stride position. Feet at the bottom edge. |
| `crawler_squashed.png` | ...the same creature squashed completely flat, eyes turned into little swirls, comically defeated. |

---

## BACKGROUNDS — Three Parallax Layers

**Wide canvas, 1920×1080.** These must be **darker, softer and lower contrast** than anything the player can touch — that contrast is what makes the game readable.

| File | Prompt |
|---|---|
| `bg_far.png` | ...a distant cave background, very dark deep purple, huge faint crystal formations barely visible in shadow, soft glow in the far distance. Very low contrast, muted, hazy, no sharp outlines. Seamlessly tileable horizontally. |
| `bg_mid.png` | ...a middle-distance cave layer, dark purple rock walls with medium glowing pink and cyan crystal clusters, moderately dark, softer outlines than foreground objects. Seamlessly tileable horizontally. |
| `bg_near.png` | ...a near foreground cave layer, large dark rock formations and big crystal clusters in silhouette, dark and mostly shadowed, framing the top and bottom edges of the screen. Seamlessly tileable horizontally. The open middle of the image is flat magenta so it becomes see-through. |

---

## UI

| File | Prompt |
|---|---|
| `btn_left.png` | ...a large round translucent game control button with a bold white left-pointing triangle arrow, thick outline, mobile game UI. |
| `btn_right.png` | ...the same button design with a bold white right-pointing triangle arrow. |
| `btn_jump.png` | ...the same button design, larger, with a bold white upward arrow and the look of a jump button. |
| `btn_grapple.png` | ...the same button design in glowing cyan, with a white hook-and-rope icon. |
| `ui_heart_full.png` | ...a small bright pink heart icon for a health bar, chunky and bold with a thick outline. |
| `ui_heart_empty.png` | ...the same heart icon but dark grey and hollow, showing an empty health slot. |

---

## SCREENS (Phase 4 and later)

| File | Prompt |
|---|---|
| `title_art.png` | ...a title screen illustration: the child astronaut standing on a purple crystal ledge reaching out toward a small glowing blob creature floating just out of reach, alien starry sky behind, dramatic and warm. Wide 1920×1080. Leave clear empty space in the upper third for the game's name. |
| `starmap_bg.png` | ...a star map background, deep space, purple and blue nebula clouds, scattered stars, calm and beautiful. Wide 1920×1080. |
| `planet_crystal.png` | ...a small round planet icon for a star map, a purple world covered in glowing pink and cyan crystals, viewed from space, bold cartoon style with a thick outline. |
| `planet_locked.png` | ...a small round planet icon for a star map, entirely dark grey silhouette with a simple padlock symbol on it, clearly not yet available. |
| `ui_panel.png` | ...a rounded rectangular menu panel for a game UI, dark translucent purple with a glowing cyan border, empty in the middle, bold cartoon style. |
| `ui_lock.png` | ...a small gold padlock icon, chunky and bold with a thick outline. |
| `medal_gold.png` | ...a small gold medal icon with a ribbon, chunky bold cartoon style. Generate silver and bronze versions too. |

---

## AFTER GENERATING

1. **Remove the magenta.** One script keys out `#FF00FF` across the whole folder — ask the AI to write it. Don't do it by hand 60 times.
2. **Check the feet line up.** Put the run frames in a row. If the character bobs up and down, regenerate the bad frame or nudge it in an image editor. Do this *before* building the animation code, or you'll spend an hour debugging code that was never broken.
3. **Squint at a screenshot.** If you can't instantly tell what's solid and what's background, the background is too bright. Darken it.

---

## GENERATION ORDER

Don't generate everything at once. Follow the build — art you can't see yet is wasted effort.

| Batch | Assets | Needed by |
|---|---|---|
| **1** | `STYLE_BIBLE.png` | Everything |
| **2** | The 4 UI buttons (`btn_left`, `btn_right`, `btn_jump`, `btn_grapple`) | Step 1 — you need something to press |
| **3** | Hero: `idle_1-2`, `run_1-4`, `jump`, `fall` · `tile_ground_top`, `tile_ground_fill`, `tile_platform` · all 3 background layers | Steps 6–7 |
| **4** | `anchor_idle`, `anchor_active`, `hero_grapple` | Steps 8–10 — the grappling hook |
| **5** | `starbit`, `heart`, `ui_heart_full`, `ui_heart_empty`, `hero_hurt`, `beacon_off`, `beacon_on`, `spikes_floor`, `spikes_ceiling`, `tile_crumble_1-3`, `crawler_1-4`, `crawler_squashed` | Steps 12–16 — a real level |
| **6** | `blobtrace`, `blob_trail`, `goal_flag`, `blob_*` set, `title_art`, `starmap_bg`, `planet_crystal`, `planet_locked`, `ui_panel`, `ui_lock`, `medal_*` | Steps 19–26 — a finished-feeling game |
| **7** | The other 6 characters (60 images) | Step 27 — character select, much later |

> **Batch 2 is deliberately tiny and comes first.** You need buttons on screen from the very first step. Everything else can be a coloured rectangle for a while — controls can't.
