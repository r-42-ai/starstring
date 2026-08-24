/* ============================================================
   STARSTRING — CONFIG
   ============================================================

   THIS IS NEA'S FILE.

   Every number that decides how the game FEELS lives here.
   Nothing else does. You can change anything in this file and
   the game will still run — it will just feel different.

   How to use it:
     1. Change ONE number
     2. Reload the game
     3. Play it and notice what changed
     4. Change it back, or keep it

   Changing one number at a time is the whole trick. If you change
   five and it feels worse, you won't know which one did it.

   Distances are in pixels. One tile is 64 pixels.
   Speeds are in pixels per second. So 420 means
   "moves 420 pixels in one second" — about 6.5 tiles.
   ============================================================ */

const CONFIG = {

  /* ---------- THE SCREEN ---------- */

  // The game always thinks it is this size, no matter what device
  // it's on. A phone, a tablet and a laptop all get exactly the same
  // game — it just gets scaled bigger or smaller to fit the screen.
  // This is why you never have to worry about screen sizes.
  WIDTH: 1280,
  HEIGHT: 720,

  TILE: 64,          // how big one block of the world is

  // How much the outer corners of the rock are rounded off, in pixels.
  // 0 gives you brick walls. About a third of a block looks like a cave.
  ROCK_ROUNDING: 22,


  /* ---------- TIME ---------- */

  // The game does its thinking 60 times every second, always.
  // Not "as fast as the device can" — exactly 60. That's why the
  // game runs at the same speed on a fast tablet and a slow phone.
  STEP: 1 / 60,

  // If the game freezes for a moment (you switched apps, for example),
  // don't try to catch up on more than this many steps at once.
  MAX_STEPS_PER_FRAME: 5,


  /* ---------- THE HERO ---------- */

  PLAYER: {
    WIDTH: 44,       // how wide the hero's body is for bumping into things
    HEIGHT: 92,      // how tall

    // --- RUNNING ---
    MAX_SPEED: 420,      // top running speed
    ACCEL: 3200,         // how quickly you speed up. Lower = more slippery
    DECEL: 3000,         // how quickly you stop. Lower = you skid
    AIR_ACCEL: 1900,     // how much you can steer while in the air

    // --- JUMPING ---
    // Negative because on a screen, up is a SMALLER number. Weird but true.
    //
    // This has to clear THREE blocks (192px) comfortably, and here's
    // why three: the hero is 92px tall, which is nearly a block and a
    // half. So she already fills the two rows above the floor — put a
    // platform there and she simply walks into it head first. The
    // lowest a platform can go above ground she walks on is 3 rows.
    //
    // -920 reached 220px, which cleared 192 only if you held the button
    // down for the whole jump. -980 reaches 250px, so a normal jump
    // clears it with room to spare.
    JUMP_SPEED: -980,

    // Falling is faster than rising. This is the single biggest
    // reason a jump feels "snappy" instead of "floaty".
    // Try 1.0 (equal) and you'll instantly feel how bad it is.
    FALL_MULTIPLIER: 1.9,

    // If you let go of the jump button early, you stop rising quickly.
    // That's how you get small hops AND big jumps from one button.
    LOW_JUMP_MULTIPLIER: 2.6,

    MAX_FALL_SPEED: 1500,   // you never fall faster than this

    // --- THE THREE MERCIES ---
    // These make the game feel fair. Players never notice them.
    // They only notice when they're missing.

    // You can still jump for this long after running off a ledge.
    // 0.10 = a tenth of a second. Set it to 0 and the game feels mean.
    COYOTE_TIME: 0.10,

    // If you press jump slightly BEFORE you land, it still counts.
    JUMP_BUFFER: 0.12,

    // If you jump and clip the corner of a ceiling by this many pixels,
    // you get nudged around it instead of stopping dead.
    CORNER_CORRECTION: 12,
  },


  /* ---------- THE WORLD ---------- */

  // How hard the planet pulls you down.
  // Each planet multiplies this by its own number (see level.js),
  // so the Crystal Caves at 0.8 feel lighter than a normal planet.
  GRAVITY: 2400,


  /* ---------- THE GRAPPLING HOOK ---------- */

  // The move the game is named after. These numbers decide whether
  // swinging feels amazing or annoying, so they're worth playing with.
  GRAPPLE: {
    RANGE: 350,          // how far away an anchor can be and still be grabbed
    MAX_ROPE: 350,       // the rope is never longer than this

    // ...and never shorter than this. A very short rope makes the
    // swing whip round insanely fast (the maths divides by the length,
    // so a tiny length means a huge number). This keeps it sane.
    MIN_ROPE: 75,

    // How much the hero tilts to line up with the rope.
    // 1 would make her a rigid stick pointing straight at the anchor,
    // which looks silly at the ends of a swing. 0.72 keeps her a bit
    // more upright, like a person actually hanging on.
    HANG_LEAN: 0.72,

    // PUMPING — how much pressing left/right adds to your swing.
    // This is the skill of the whole move: press at the right moment
    // and you go higher, press at the wrong moment and you slow down.
    // Too high and it stops being a skill; too low and it feels dead.
    PUMP: 5.0,

    // How quickly a swing dies down on its own if you don't pump it.
    // 0 = swings forever like a perfect pendulum. Try it — it's fun,
    // but you never have to work for anything.
    DAMPING: 0.22,

    // A speed limit, so you can't build up enough energy to loop
    // right over the top of the anchor. Radians per second.
    MAX_SWING_SPEED: 3.6,

    // Pressing jump while hanging lets go AND gives you a boost upwards
    RELEASE_BOOST: 210,

    /*
       THE THREE KINDS OF RING (Nea's idea)

         o  CYAN   the normal one
         r  RED    breaks much sooner. Keep moving.
         g  GREEN  never breaks at all. A place to rest and think.

       Green rings are the safe ones, so use them sparingly — somewhere
       to stop and work out what to do next. Red ones are the opposite:
       grab, swing, gone. A row of red rings is a proper test of nerve.
    */
    RING_TYPES: {
      o: { maxSwings: 6,        cooldown: 4.0, color: '#3ee8ff' },
      r: { maxSwings: 3,        cooldown: 5.5, color: '#ff5a6e' },
      g: { maxSwings: Infinity, cooldown: 0,   color: '#5cff9d' },
    },

    // HOW MANY SWINGS BEFORE THE ROPE GIVES OUT (for a normal ring).
    //
    // Nea spotted this: if you can hang on forever, you can just dangle
    // out of reach and monsters can never touch you. Hanging becomes a
    // hiding place, and hiding places ruin games.
    //
    // So the rope tires. Each time you swing past the bottom counts as
    // one. After this many, it lets go whether you like it or not.
    MAX_SWINGS: 6,

    // How far she can sink into something while swinging before the
    // rope snaps.
    //
    // These two are deliberately different, and that difference is the
    // whole trick. Skimming the FLOOR with your feet at the bottom of a
    // swing is one of the best-feeling things in the game, so we forgive
    // a lot of it. Slamming sideways into a WALL should stop you, so we
    // forgive very little of that.
    //
    // One number for both doesn't work: big enough to skim the floor
    // means big enough to pass through walls.
    WALL_FORGIVENESS: 10,     // sideways
    GROUND_FORGIVENESS: 22,   // up and down

    // The rope flashes for this many swings before it goes, so it's
    // a warning rather than a nasty surprise.
    WARN_SWINGS: 3,

    // How fast the rope reels in and out, in pixels per second.
    REEL_SPEED: 260,

    // Let go of the button faster than this and it counts as a TAP,
    // so you stay hanging with your thumb free. Hold it longer and
    // letting go drops you off, which is what you'd expect.
    TAP_TIME: 0.22,

    // Grab a ring and let go again faster than this and it costs you
    // nothing — an accidental tap shouldn't burn the ring for 4 seconds.
    MIN_HOLD_FOR_COOLDOWN: 0.25,

    // How long an anchor stays dark after you've used it.
    // Nea originally wanted 60. Set it to 60 and see what happens —
    // you swing once and then stand around doing nothing.
    ANCHOR_COOLDOWN: 4.0,

    // Anchors you can reach pulse, so you can see what's grabbable
    PULSE_SPEED: 4.0,
    ANCHOR_SIZE: 62,
    ROPE_WIDTH: 4,

    // The rope hangs through the BOTTOM of the ring, not from the
    // middle of it. A rope coming out of thin air in the centre of a
    // hoop looks wrong — it should pass through the hoop like a real one.
    // Measured as a fraction of the ring's height.
    ROPE_ANCHOR_OFFSET: 0.40,

    // The rope ends at her HAND, not at her belly button. Measured
    // from the middle of her body, towards the ring.
    ROPE_HAND_OFFSET: 0.34,
  },


  /* ---------- HINTS ---------- */

  // How the game teaches you: short lines floating in the world,
  // appearing when you get near the thing they're about.
  HINT: {
    FADE_AT: 320,     // how close you have to be for one to be fully visible
  },


  /* ---------- THE PLANET MAP ---------- */

  // The screen you come out to when you finish a level: the whole
  // planet, turning in space, with the levels marked on it.
  PLANET: {
    LEVEL_COUNT: 15,
    RADIUS: 230,        // how big the planet is on screen at zoom 1
    MARKER: 17,         // how big a level marker is
    MIN_ZOOM: 0.55,
    MAX_ZOOM: 2.6,
    ZOOM_STEP: 1.12,    // how much one notch of the scroll wheel does
    DRAG_SPEED: 0.006,  // radians turned per pixel dragged
    MAX_PITCH: 1.1,     // how far you can tip it before it gets silly
    // How near a level you have to tap. Generous on purpose: the
    // markers are small, fingers are not, and missing a tap is far
    // more annoying than occasionally hitting the wrong level.
    TAP_RADIUS: 78,
    TAP_SLOP: 12,       // move further than this and it was a drag, not a tap
    HERO_SIZE: 54,      // how tall you look standing on the planet

    /*
       The planet's colours, deliberately the SAME green and gold you
       see inside the levels. It should be obvious you're looking at
       the place you've been walking around in — a map in different
       colours to the game feels like a different game.
    */
    COLORS: {
      GREEN_DARK:  '#07200f',   // green crystal, in shadow
      GREEN_LIGHT: '#86e8a4',   // ...and catching the light
      GOLD_DARK:   '#2c1e07',   // gold crystal, in shadow
      GOLD_LIGHT:  '#ffdb8a',   // ...and catching the light (the level's gold)
      HALO:        '150,255,180',
    },
  },


  /* ---------- THE CLOCK ---------- */

  // Every level has a time limit. It isn't there to be cruel — it's
  // there so that dithering costs you something, which is what makes
  // deciding quickly feel good.
  //
  // The number itself comes from `node tools/measure_time.js`, which
  // plays the level with a robot and reports how long it takes. Guessing
  // a time limit is how you end up with one that's impossible.
  TIMER: {
    WARN_AT: 30,        // seconds left when it starts going red
    PANIC_AT: 10,       // seconds left when it starts beating
    FLASH_SPEED: 6,
  },


  /* ---------- THE PORTAL ---------- */

  // The way out at the end of a level. You have to get INTO it, which
  // makes where it's placed the last puzzle of the level.
  /* ---------- THE MONSTERS ---------- */

  // Five kinds, all Nea's choice. Each is one letter in the map, and the
  // letters are meant to look like the thing: ^ points up out of the
  // floor, v points down at your head, ~ bobs about, z is asleep.
  MONSTERS: {
    LETTERS: {
      c: 'crawler',
      '~': 'flyer',
      z: 'lurker',
      '^': 'spikes',
      v: 'faller',
    },

    // Landing on a head bounces you back up this much of a full jump.
    // A whole jump would mean you could cross a level on monsters alone
    // without ever touching the ground, which is a different game.
    BOUNCE: 0.72,

    // How far into a monster your feet may be and still count as a
    // stomp rather than a bump. Too small and stomping feels like luck;
    // too big and brushing its shoulder kills it.
    STOMP_DEPTH: 0.55,

    SQUASH_TIME: 0.35,   // how long it stays on screen, flattened

    CRAWLER: {
      WIDTH: 56, HEIGHT: 44,
      SPEED: 110,        // slower than you run (420), so you can escape
      RANGE: 260,        // never wanders more than this from where it started
      KILLABLE: true,
    },

    FLYER: {
      WIDTH: 52, HEIGHT: 52,
      SPEED: 1.9,        // radians a second -- how fast it bobs
      RANGE: 96,         // a block and a half up, a block and a half down
      KILLABLE: true,
    },

    LURKER: {
      WIDTH: 60, HEIGHT: 56,
      SPEED: 190,        // faster than a crawler, still slower than you
      WAKE_RANGE: 330,   // about five blocks: it wakes before you see it move
      RANGE: 384,        // its leash. Lead it six blocks and it goes home.
      KILLABLE: true,
    },

    // Not alive. A rock with a point on it.
    SPIKES: { WIDTH: 64, HEIGHT: 40, KILLABLE: false },

    // Also not alive. A rock that lets go.
    FALLER: {
      WIDTH: 60, HEIGHT: 60,
      TRIGGER: 40,       // how far either side of it counts as "under it"

      // It shudders for this long before letting go. Without it the drop
      // is unavoidable: it falls at 1150 and you run at 420, so being
      // underneath at all means being hit. A third of a second is enough
      // to sprint clear OR to stop and let it go past.
      WARN: 0.35,
      FALL_SPEED: 1150,  // much faster than gravity. It should be a shock.
      RISE_SPEED: 150,   // slow going back up, so you get a turn
      REST: 1.1,         // seconds sat on the floor before it climbs back
      KILLABLE: false,
    },
  },

  PORTAL: {
    RADIUS: 46,          // how big it looks
    TOUCH_RADIUS: 52,    // how close you have to get. Slightly generous.
    SPIN: 1.6,           // how fast it turns
    PULSE: 2.4,
    RING_COUNT: 4,
    SUCK_TIME: 0.75,     // how long you take to spiral in and vanish
    COMPLETE_PAUSE: 2.6, // seconds of celebrating before it starts again
  },


  /* ---------- THE CAMERA ---------- */

  CAMERA: {
    // How quickly the view catches up with you.
    // Higher = tighter and snappier. Lower = lazier and floatier.
    // Try 1 (drunk cameraman) and 30 (welded to your head) to feel
    // why somewhere in between is right.
    FOLLOW_SPEED: 6,

    // Up and down is deliberately slower than side to side.
    // Vertical camera movement is far more noticeable, and far more
    // likely to make someone feel ill.
    VERTICAL_SPEED: 4,

    // How far ahead the camera peeks in the direction you're running,
    // so you can see what's coming instead of running blind.
    LOOK_AHEAD: 120,
    LOOK_AHEAD_SPEED: 2.5,

    // Where the hero sits on the screen, top to bottom.
    // 0.5 = dead centre. 0.58 puts her slightly below the middle,
    // which gives you more room to see what's above — useful in a
    // game about jumping and swinging upwards.
    VERTICAL_BIAS: 0.58,

    // How far you can fall before the camera gives up ignoring
    // jumps and follows you down. Below this, jumping doesn't move
    // the view at all.
    FALL_THRESHOLD: 190,
  },


  /* ---------- THE BUTTONS ---------- */

  BUTTONS: {
    RADIUS: 58,        // how big the button LOOKS
    HIT_RADIUS: 95,    // how big the button actually IS to your thumb.
                       // Bigger than it looks, on purpose. Thumbs are
                       // not precise and the game should be forgiving.
    MARGIN: 40,

    // The button pictures have a little empty space around the circle
    // (and the grapple one has a glow). Drawing them slightly bigger
    // makes the visible circle match RADIUS exactly.
    IMAGE_SCALE: 1.09,
  },


  /* ---------- THE HERO'S PICTURE ---------- */

  // The hero's picture is bigger than the invisible box used for
  // bumping into walls. That's completely normal in games: the box
  // is deliberately a bit slimmer than the character so you don't
  // catch on edges that look like you should fit through.
  SPRITE: {
    HERO_SCALE: 1.14,   // picture height, compared to the box height

    // Where her hands are, measured up her body from her feet.
    // 0 = feet, 1 = top of her head. This is the spot the rope is
    // tied to, and it stays welded there however she spins about.
    HAND_HEIGHT: 0.86,
  },


  /* ---------- MAKING A STILL PICTURE FEEL ALIVE ---------- */

  // We only have ONE drawing of the hero so far, so she looks like a
  // sticker being dragged around. Real walking frames are coming, but
  // you can get a surprising amount of life out of a single picture
  // just by moving, squashing and tilting it.
  //
  // Animators call this squash and stretch, and it is one of the
  // oldest tricks there is — Disney were doing it in the 1930s.
  //
  // Try setting these all to 0 and watch how dead she goes.
  ANIM: {
    // --- WALKING ---
    BOB_HEIGHT: 5,     // how far the body lifts on each step
    STRIDE: 44,        // how far you travel per step. Smaller = quicker steps.
                       // The bounce is tied to DISTANCE, not time, so it
                       // automatically matches however fast you're going.
    LEAN: 0.11,        // how far she tilts forwards when running flat out

    // --- LANDING ---
    LAND_SQUASH: 0.80,     // how squashed she goes on a heavy landing
    LAND_MIN_SPEED: 320,   // slower than this and she lands normally
    SQUASH_RECOVER: 12,    // how fast she springs back. Lower = wobblier.

    // --- IN THE AIR ---
    AIR_STRETCH: 0.16,     // how much she stretches when rising or falling fast

    // --- STANDING STILL ---
    BREATH_SPEED: 2.2,
    BREATH_AMOUNT: 0.018,  // tiny. You shouldn't notice it, only miss it.
  },


  /* ---------- COLOURS (until the real artwork arrives) ---------- */

  /*
     THE CRYSTAL PLANET — deep green and gold. (Nea's choice.)

     One rule decides everything here:

       THINGS YOU CAN TOUCH MUST NOT LOOK LIKE DECORATION.

     That got harder the moment the crystals went gold, because Star
     Bits are gold too. So gold decoration is kept DARK and DULL, while
     anything you can pick up is bright, glowing, and — most importantly
     — MOVING. Nothing decorative ever moves. That's the real tell, and
     players learn it in seconds without being told.

     The grapple rings stay cyan, a colour used for nothing else on the
     whole planet, so they can never be mistaken for scenery.
  */
  COLORS: {
    SKY_TOP: '#163225',        // the cavern roof, far above
    SKY_MID: '#0c1d15',
    SKY_BOTTOM: '#040a07',     // the dark at the bottom
    // Real stone is GREY. The green is saved for the far background
    // and the gold for the crystals, so the three never compete.
    SOLID: '#565d60',          // stone
    SOLID_DEEP: '#3d4447',     // stone further from the surface
    ROCK_LIGHT: '#767d80',     // where a stone catches the light
    ROCK_MID: '#5c6367',
    ROCK_DARK: '#454b4e',      // and where it doesn't
    ROCK_CRACK: '#22282b',     // the gaps between the stones
    SOLID_TOP: '#d9a441',      // gold crystal crust on top of the rock
    SOLID_TOP_GLOW: '#ffdb8a',
    SPARKLE: '#fff6d5',        // the glitter
    LIGHT_SHAFT: '#ffe9a8',    // sunlight through the hole in the roof
    PLAYER: '#ffffff',
    PLAYER_EDGE: '#00e5ff',
    BUTTON: 'rgba(255,255,255,0.16)',
    BUTTON_ACTIVE: 'rgba(0,229,255,0.42)',
    BUTTON_EDGE: 'rgba(255,255,255,0.5)',
    TEXT: 'rgba(255,255,255,0.75)',
    ROPE: '#0a7d94',
    ROPE_CORE: '#9df5ff',
    ROPE_TIRED: '#b03a5b',
    ROPE_TIRED_CORE: '#ffb3c6',
    ANCHOR: '#3ee8ff',
    PORTAL_CORE: '#ffffff',
    PORTAL_A: '#7af5ff',
    PORTAL_B: '#c07aff',
  },


  /* ---------- THE GLITTER ---------- */

  // Nea's "wow" for this planet: the crystals glitter.
  //
  // Nothing is stored for any of this. Each sparkle's position and
  // timing is worked out from the block it sits on, so the same block
  // always twinkles the same way — but nothing has to be remembered
  // between frames. A whole cave of glitter costs almost nothing.
  SPARKLE: {
    PER_TILE: 4,        // sparkles on each block of crystal
    SIZE: 2.2,
    SPEED: 1.7,         // how fast they twinkle
    SHARPNESS: 6,       // higher = quick glints rather than slow pulsing
    BRIGHTNESS: 0.85,
  },


  /* ---------- HELPERS FOR TESTING ---------- */

  DEBUG: {
    SHOW_FPS: true,       // show how fast the game is running
    SHOW_HITBOXES: false, // draw the invisible boxes used for bumping
  },
};
