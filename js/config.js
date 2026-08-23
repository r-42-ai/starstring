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
    JUMP_SPEED: -920,

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


  /* ---------- THE BUTTONS ---------- */

  BUTTONS: {
    RADIUS: 58,        // how big the button LOOKS
    HIT_RADIUS: 95,    // how big the button actually IS to your thumb.
                       // Bigger than it looks, on purpose. Thumbs are
                       // not precise and the game should be forgiving.
    MARGIN: 40,
  },


  /* ---------- COLOURS (until the real artwork arrives) ---------- */

  COLORS: {
    SKY_TOP: '#2a1145',
    SKY_BOTTOM: '#140820',
    SOLID: '#5b3a7e',
    SOLID_TOP: '#ff5fd2',
    PLAYER: '#ffffff',
    PLAYER_EDGE: '#00e5ff',
    BUTTON: 'rgba(255,255,255,0.16)',
    BUTTON_ACTIVE: 'rgba(0,229,255,0.42)',
    BUTTON_EDGE: 'rgba(255,255,255,0.5)',
    TEXT: 'rgba(255,255,255,0.75)',
  },


  /* ---------- HELPERS FOR TESTING ---------- */

  DEBUG: {
    SHOW_FPS: true,       // show how fast the game is running
    SHOW_HITBOXES: false, // draw the invisible boxes used for bumping
  },
};
