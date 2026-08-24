/* ============================================================
   STARSTRING — LEVEL
   ============================================================

   NEA: THIS IS THE FUN ONE.

   The level below is drawn with letters. You can rearrange it
   like drawing on squared paper, save the file, reload the game,
   and you have made a new level. No code involved.

     .  = empty space
     #  = solid block you can stand on
     o  = a glowing CYAN ring — the normal one, 6 swings
     r  = a RED ring — breaks after only 3 swings. Keep moving!
     g  = a GREEN ring — never breaks. Somewhere safe to think.
     P  = where the hero starts
     F  = a FLAG. Touch it and it lights up. FALL DOWN A HOLE after
          that and you start again from the flag — and the clock winds
          back up to full.
          (Running out of TIME is different: that sends you all the way
          back to the start and puts the flags out again.)
     ?  = an ILLUSION. Looks EXACTLY like solid rock, but it isn't
          there at all. Walk straight through it.

          Use them two ways, and both are good:
            - as a WALL hiding a shortcut nobody would guess at
            - as a FLOOR that drops you into a hole
          Once you've been through one it stays faintly shimmering,
          so you don't have to remember where it was.

     X  = THE PORTAL — the way out. Touch it and the level is done.

     MONSTERS. One letter each, and the letter looks like the thing:

     c  = a CRAWLER. Paces its platform and turns round at the edge.
     ~  = a FLYER. Bobs up and down in the air, in your swing path.
     z  = a LURKER. Sits still like a rock until you get close (that's
          the z — it's asleep), then it comes after you.
     ^  = SPIKES. Never move. Can never be beaten.
     v  = a FALLER. Hangs there until you walk underneath, then drops.
          Can never be beaten either — get out from under it.

     Touch any of them and you go back to your last flag. Land on a
     crawler, flyer or lurker's HEAD and it's squashed, and you bounce.
     Hit one while you're SWINGING and you smash right through it.

     WHERE TO PUT A FLYER, and this one is worth knowing:

       hang it just BELOW A RING, so you meet it while you're on the
       rope and can smash through it.

     Put one in the GAP between two rings and it becomes a wall. You're
     in mid-air there — off the rope, so you can't smash it, and with no
     ground under you, so you can't dodge. Every playing style died on
     one I'd put between two rings on level 3, and no player could have
     done any better.

   Where you put the X is the last puzzle of the level. Directly above
   a ledge means a straight jump. Off to one side over a drop means you
   have to swing and let go at exactly the right moment. Moving it two
   blocks can change a whole level.

   Rules:
     - Every row must be exactly the same length
     - Keep them inside the ' ' quote marks and end with a comma
     - There must be exactly one P

   ONE THING TO WATCH: the buttons sit on top of the bottom-left and
   bottom-right corners of the screen. Your thumbs cover those corners
   the whole time you're playing. So don't put anything important
   there — and never start the hero there, or you can't see yourself.

   Try it right now: add a few # somewhere and reload.
   ============================================================ */

const LEVELS = {

  /*
     LEVEL 1 — the one that teaches you.

     Three rules, and they're the whole reason it works:

       NOTHING CAN KILL YOU.  No bottomless pits, no clock. The dip in
       the middle can be walked through and jumped back out of. A
       tutorial that punishes you teaches you to be frightened.

       ONE NEW THING AT A TIME.  Run. Jump. Swing. Let go. A flag.
       A green ring. A red ring. The portal. Never two at once, and
       each one gets its own stretch of level to itself.

       THE THREE RINGS EACH GET A DIP OF THEIR OWN.  You meet cyan,
       then green, then red, one at a time, with the hint right there.
       Naming all three at once teaches nobody anything.

       IT TELLS YOU IN THE WORLD, NOT ON A PAGE.  The hints float right
       where the thing they're about is, and only when you get near.
       Nobody reads instructions. Everybody reads one line hanging over
       the exact spot where they're stuck.
  */
  'tutorial': {

    name: 'First Steps',
    gravityScale: 0.8,
    timeLimit: 0,          // no clock. Take as long as you like.

    lightShafts: [
      { col: 8,  width: 3, tilt: 1.2 },
      { col: 34, width: 5, tilt: 2.0 },
      { col: 54, width: 4, tilt: 1.4 },
    ],

    hints: [
      { col: 5, row: 7, text: 'hold  \u25b6  to run' },
      { col: 14, row: 7, text: 'press JUMP to climb up' },
      { col: 19, row: 6, text: 'SPIKES. These can never be beaten \u2014 jump them.' },
      { col: 25, row: 6, text: 'that block DROPS when you walk under. Keep running!' },
      { col: 29, row: 3, text: 'run off the edge, then press GRAPPLE' },
      { col: 35, row: 5, text: 'press  \u25c0  \u25b6  to swing higher' },
      { col: 40, row: 6, text: 'GRAPPLE again to let go \u2014 or JUMP to launch off' },
      { col: 48, row: 4, text: 'a golden FLAG saves your place if you fall' },
      { col: 58, row: 3, text: 'a GREEN ring never breaks \u2014 take your time' },
      { col: 62, row: 7, text: 'a MONSTER! Swing right through it \u2014 on the rope you win' },
      { col: 74, row: 6, text: '\u2026or land on its HEAD. You bounce off.' },
      { col: 86, row: 3, text: 'a RED ring breaks fast \u2014 keep moving!' },
      { col: 101, row: 4, text: 'walk into the portal to finish' },
    ],

    map: [
      '....................................................................................................................',
      '....................................................................................................................',
      '....................................................................................................................',
      '....................................................................................................................',
      '...................................o...........................g...........................r........................',
      '....................................................................................................................',
      '..................................................................~........................................X........',
      '......................^...v.....................F...^.........................c...............................^.....',
      '................################.........##################............################............#################',
      '................################.........##################............################............#################',
      '...P............################.........##################............################............#################',
      '####################################################################################################################',
      '####################################################################################################################',
      '####################################################################################################################',
      '####################################################################################################################',
      '####################################################################################################################',
    ],
  },

  /*
     LEVEL 3 — THE ILLUSIONS.

     Harder than level 2, and built around one idea: you cannot trust
     your eyes. Walls you walk through, floors that drop you, a stone
     bridge that isn't there, stepping stones where half are lies.

     The rule from level 2 still holds and matters MORE here, not less:
     an illusion must be a TRICK, NOT A WALL. Every fake thing either
     opens a way through, or drops you somewhere you can climb back out
     of. The only place a lie can really hurt you is the false bridge —
     and the rings above it are in plain sight.
  */
  'illusions': {

    name: 'The Illusions',
    gravityScale: 0.8,

    // Tighter than level 2's three minutes, because this one is meant
    // to be harder. `node tools/measure_time.js illusions` says the
    // robot does it in 31.9s and suggests 180; 165 is deliberately
    // meaner than that suggestion.
    timeLimit: 165,

    lightShafts: [
      { col: 17,  width: 3, tilt: 1.2 },
      { col: 45,  width: 4, tilt: 2.0 },
      { col: 74,  width: 7, tilt: 3.0 },
      { col: 108, width: 4, tilt: 1.5 },
      { col: 143, width: 6, tilt: 2.5 },
      { col: 188, width: 5, tilt: 1.5 },
    ],

    /*
       ONE hint, at the very start, and then silence.

       Nea's note: "in the illusions there are too many clues." She was
       right. The first version put a sign before every trap naming the
       trap, which means the level never actually tricks you once — you
       are just following instructions. A level called The Illusions
       that warns you about all of its illusions is a corridor.

       So this hint gives you the RULE, and never an answer. What is a
       lie and what isn't is yours to find out, and getting it wrong is
       the point. The flags are there to make being wrong survivable.
    */
    hints: [
      { col: 5, row: 11, text: 'this whole place lies to you' },
    ],

    map: [
      '..............................................................................................................................................................................................................',
      '..............................................................................................................................................................................................................',
      '..............................................................................................................................................................................................................',
      '....................................................................................................................................................................................??????....................',
      '........................................................................................................v.....................................................................................................',
      '..............................................................................................................................................................................................................',
      '...............................................................................................................................................................................^c......o.....r.....o..........',
      '.................z................................................o......r......o......r..........^c.....^......^...................................~..........................####...........................',
      '................####............................................................................####....####....####........................r.............r............................................X......',
      '.............v..####...................v....v...................................~...............####....####....####.v....v...............................................^.v..............~..................',
      '................####..............................................~.............................####....####....####................c...z.................................#####......................??????...',
      '................????..............................................?????????????????????.........????....????....????................#####..?????..#####..?????..#####.........................................',
      '^.P....^..^c....????......^.........c...z.....F.........^..................................^..^.????c...????..F.????...^^c..c.......#####..?????..#####..?????..#####.c.^.....F...............................',
      '##############################?????##############....##########............................######################################.....................................#############...........................',
      '##############################?????##############....##########............................######################################.....................................#############...........................',
      '##############################?????##############....##########............................######################################.....................................#############...........................',
      '#################################################....##########............................######################################.....................................#############...........................',
      '#################################################....##########............................######################################.....................................#############...........................',
    ],
  },

  'crystal-caves-1': {

    name: 'The Way Out',

    // How strongly this planet pulls you down.
    // 1.0 is normal. The Crystal Caves are 0.8, so you're a bit lighter.
    // Change it to 0.4 and you'll feel like you're on a tiny moon.
    // Change it to 2.0 and you'll barely get off the ground.
    gravityScale: 0.8,

    // How long you get, in seconds.
    //
    // Reaching a flag winds the clock back up to full. But if it ever
    // reaches zero you go back to the VERY BEGINNING — flags and all.
    // Falling in a hole costs you a stretch; the clock costs you the
    // whole level.
    //
    // Measured with `node tools/measure_time.js` — don't guess it.
    timeLimit: 180,

    /*
       Level 1 taught running, jumping and swinging. This one teaches
       everything else — and again, one thing at a time, right where
       you first meet it. Never a wall of text before you start.
    */
    /*
       ONLY WHAT LEVEL 1 DIDN'T ALREADY SAY.

       Nea: "the rules you had in lev 1 don't have to pop up again in
       lev 2." She's right — this used to re-explain green rings, red
       rings, flags and the portal, all four of which level 1 teaches
       properly, with a whole dip of its own for each. Repeating them
       here says two things to the player, neither of them good: that
       the game wasn't listening the first time, and that hints are
       noise to be skipped. Once hints become skippable, the two that
       actually matter get skipped too.

       So level 2 says exactly two things, and both are brand new:
       the clock, and the fact that the level can lie to you.
    */
    hints: [
      { col: 5,   row: 11, text: 'the clock is running \u2014 don\u2019t dawdle' },
      { col: 114, row: 9,  text: 'careful \u2014 not everything here is really there' },
    ],

    // Sunlight pouring down through holes in the cavern roof.
    //   col   = which column the hole is above
    //   width = how many blocks wide the beam is
    //   tilt  = how far it leans over as it falls (blocks)
    // Purely decoration — you can walk straight through them.
    lightShafts: [
      { col: 10,  width: 3, tilt: 1.5 },
      { col: 36,  width: 4, tilt: 2.0 },
      { col: 55,  width: 5, tilt: 2.5 },
      { col: 79,  width: 3, tilt: 1.0 },
      { col: 115, width: 7, tilt: 3.5 },
      { col: 156, width: 4, tilt: 1.5 },
      { col: 190, width: 5, tilt: 1.0 },
      { col: 214, width: 6, tilt: 2.0 },
    ],

    // 236 blocks wide — about twelve screens, ending at a PORTAL.
    //   20-50    little jumps
    //   51-58    your first rope crossing (a GREEN ring — take your time)
    //   63-80    stepping stones
    //   105-134  THE GREAT CHASM — four rings, one green to rest on
    //   135-154  low roof, mind your head
    //   155-176  second chasm — all RED. Three swings each. Move!
    //   190-230  THE FINALE — six rings, then swing into the portal.
    //            No jump can reach it. Only a rope.
    //
    // THE TRICKS (Nea's idea): the level lies to you in three places.
    //   148-149  a wall of fake rock hiding a shortcut
    //   112-116  a ledge across the chasm that isn't there at all
    //   156-160  a ledge that looks like the way on and goes nowhere
    //
    // Only THREE flags, and only before the hard parts. A flag every
    // few blocks would mean never really being in any danger.
    //          1         2         3         4         5         6
    // 0123456789012345678901234567890123456789012345678901234567890...
    map: [
      '............................................................................................................................................................................................................................................',
      '............................................................................................................................................................................................................................................',
      '........................................................................................................v...................................................#####...........................................................................',
      '............................................................................................................................................................................................................................................',
      '..............................................................................................................o......g......o......o........................................................................................................',
      '.............v....................................................................................^c..F.....................................................................................................................................',
      '.................................................................................................########...................................^..c...^.....z^.................................................................................',
      '.................................................................................................########.....~......~......~......~........###############....r.....r.....r...............c.^....o.....r.....o.....g.....r.....o...........',
      '..............^..z...............................^...............v............v..................########.......?????.....................................................................####..............................................',
      '.............#####..............................###.g.....................................#####..########...........................................??..............................................................................X.......',
      '.................................................................................................########.......................................####??.........~.....~.....~..........^...........~.....~.....~.....~.....~.....~...........',
      '.......^..................v.^..........v..^.c..................^..c...^.............^z..c........########...........................................??...............................#####..................................................',
      '......#####................#####..........#####................####...####...####...#####........########...............................z.............F.....................................................................................',
      '.................................................................................................########..............................####################...............................F.................................................',
      '^.P..............................................................................................########..............................####################......................#############..............................................',
      '####################...############...#############........################......##############..########..............................####################......................#############..............................................',
      '####################...############...#############........################......##############..########..............................####################......................#############..............................................',
      '####################...############...#############........################......##############..########..............................####################......................#############..............................................',
    ],
  },

  'the-long-fall': {

    name: 'The Long Fall',
    gravityScale: 0.8,
    timeLimit: 130,

    lightShafts: [
      { col: 15, width: 4, tilt: 1.4 },
      { col: 47, width: 7, tilt: 2.1 },
      { col: 78, width: 6, tilt: 2.8 },
      { col: 109, width: 5, tilt: 1.7 },
      { col: 141, width: 4, tilt: 2.4 },
    ],

    hints: [
      { col: 5, row: 11, text: 'nothing to land on out there' },
    ],

    map: [
      '.............................................................................................................................................................',
      '.............................................................................................................................................................',
      '.............................................................................................................................................................',
      '.............................................................................................................................................................',
      '.............................................................................................................................................................',
      '.............................................................................................................................................................',
      '.........c^c.....o.....r.....o.........v..^.c....o.....r.....o.....o..........v.^c.....r.....o.....r.....r...........c..^....r.....o.....r.....r.....o.......',
      '.........####............................####..................................####..................................####..............................X.....',
      '.............................................................................................................................................................',
      '.....^.^.........~.....~.....~......c...^........~.....~.....~.....~.......^.^.........~.....~.....~.....~.........^.........~.....~.....~.....~.....~.......',
      '....#####...........................#####.................................#####.................................#####........................................',
      '.............................................................................................................................................................',
      '^.P..............................cF...................................^.c...................................c.F..............................................',
      '#############...................#############.........................#############.........................#############....................................',
      '#############...................#############.........................#############.........................#############....................................',
      '#############...................#############.........................#############.........................#############....................................',
      '#############...................#############.........................#############.........................#############....................................',
      '#############...................#############.........................#############.........................#############....................................',
    ],
  },

  'nothing-underneath': {

    name: 'Nothing Underneath',
    gravityScale: 0.8,
    timeLimit: 125,

    lightShafts: [
      { col: 27, width: 4, tilt: 1.4 },
      { col: 81, width: 7, tilt: 2.1 },
      { col: 135, width: 6, tilt: 2.8 },
      { col: 189, width: 5, tilt: 1.7 },
      { col: 243, width: 4, tilt: 2.4 },
    ],

    hints: [
      { col: 5, row: 11, text: 'the ledges keep getting smaller' },
    ],

    map: [
      '...............................................................................................................................................................................................................................................................................',
      '...............................................................................................................................................................................................................................................................................',
      '...............................................................................................................................................................................................................................................................................',
      '...............................................................................................................................................................................................................................................................................',
      '....................................................................................................................................................................................................................................................................#######....',
      '.................................................................v..................................................................................................................................................................................................#######....',
      '.........c^c.....r.....o.....r.....r.....o.....r.....r.....o...........r.....o.....r.....r.....o.....r.....r.....o.....r...........r.....o.....r.....r.....o.....r.....r.....o.....r.....r...........r.....o.....r.....r.....o.....r.....r.....o.....r.....r.....o..#######....',
      '.........####.........................................................................................................................................................................................................................................................X........',
      '...............................................................^F.c..........................................................^^...............................................................F................................................................................',
      '.....^.^.........~.....~.....~.....~.....~.....~.....~.....~..#####....~.....~.....~.....~.....~.....~.....~.....~.....~..#####....~.....~.....~.....~.....~.....~.....~.....~.....~.....~..#####....~.....~.....~.....~.....~.....~.....~.....~.....~.....~.....~..#######....',
      '....#####.....................................................#####.......................................................#####.............................................................#####...................................................................#######....',
      '....................................................................................................................................................................................................................................................................#######....',
      '^.P............................................................................................................................................................................................................................................................................',
      '#############..................................................................................................................................................................................................................................................................',
      '#############..................................................................................................................................................................................................................................................................',
      '#############..................................................................................................................................................................................................................................................................',
      '#############..................................................................................................................................................................................................................................................................',
      '#############..................................................................................................................................................................................................................................................................',
    ],
  },

  'the-last-jump': {

    name: 'The Last Jump',
    gravityScale: 0.8,
    timeLimit: 70,

    lightShafts: [
      { col: 16, width: 4, tilt: 1.4 },
      { col: 48, width: 7, tilt: 2.1 },
      { col: 80, width: 6, tilt: 2.8 },
      { col: 112, width: 5, tilt: 1.7 },
      { col: 144, width: 4, tilt: 2.4 },
    ],

    hints: [
      { col: 5, row: 11, text: 'one flag. Make it count.' },
    ],

    map: [
      '................................................................................................................................................................',
      '..........................................................................................................................................................v.....',
      '................................................................................................................................................................',
      '...........v....................................................................................................................................................',
      '................................................................................................................................................................',
      '.....................................................................................................................................................########...',
      '.........c^......r.....o.....r.....r.....o.....r..........r.....o.....r.....r.....o.....r.....r..........r.....o.....r.....r.....o.....r.....r.....o.########...',
      '.........####.............................................................................................................................................###...',
      '...................................................Fz..............................................c^..................................................X..###...',
      '.....^...........~.....~.....~.....~.....~.....~..####....~.....~.....~.....~.....~.....~.....~..####....~.....~.....~.....~.....~.....~.....~.....~......###...',
      '....#####.........................................####...........................................####................................................########...',
      '.....................................................................................................................................................########...',
      '^.P.............................................................................................................................................................',
      '#############...................................................................................................................................................',
      '#############...................................................................................................................................................',
      '#############...................................................................................................................................................',
      '#############...................................................................................................................................................',
      '#############...................................................................................................................................................',
    ],
  },

};


/* ============================================================
   Below here is the code that reads the letters above.
   You don't need to change any of it.
   ============================================================ */

const Level = {

  map: [],
  name: '',
  cols: 0,
  rows: 0,
  gravityScale: 1,
  timeLimit: 0,
  spawnX: 0,
  spawnY: 0,
  anchors: [],
  lightShafts: [],
  portal: null,
  flags: [],
  hints: [],
  illusions: [],
  lastFlag: null,

  load(key) {
    this.anchors = [];
    this.portal = null;
    this.flags = [];
    this.illusions = [];
    this.lastFlag = null;
    const data = LEVELS[key];
    if (!data) {
      console.error('There is no level called "' + key + '"');
      return;
    }

    this.name = data.name || '';
    this.map = data.map;
    this.rows = data.map.length;
    this.cols = data.map[0].length;
    this.gravityScale = data.gravityScale ?? 1;
    this.timeLimit = data.timeLimit ?? 0;
    this.lightShafts = data.lightShafts ?? [];
    this.hints = (data.hints || []).map(h => ({ ...h, seen: 0 }));

    // A common mistake worth catching early: rows of different lengths.
    for (let r = 0; r < this.rows; r++) {
      if (this.map[r].length !== this.cols) {
        console.warn(
          'Row ' + r + ' of the level is ' + this.map[r].length +
          ' characters long, but row 0 is ' + this.cols + '. ' +
          'Every row has to be the same length.'
        );
      }
    }

    // Find where the hero starts, and every grapple ring
    let found = false;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const ch = this.map[r][c];
        if (ch === 'o' || ch === 'r' || ch === 'g') {
          this.anchors.push({
            col: c,
            row: r,
            x: c * CONFIG.TILE + CONFIG.TILE / 2,   // centre of the square
            y: r * CONFIG.TILE + CONFIG.TILE / 2,
            type: ch,
            cooldown: 0,      // seconds left before it works again
          });
        }
        if (ch === '?') {
          this.illusions.push({ col: c, row: r, revealed: false });
        }
        if (ch === 'F') {
          this.flags.push({
            col: c, row: r,
            x: c * CONFIG.TILE + CONFIG.TILE / 2,
            y: r * CONFIG.TILE + CONFIG.TILE / 2,
            // where you come back to: standing on the ground under it
            spawnX: c * CONFIG.TILE + CONFIG.TILE / 2 - CONFIG.PLAYER.WIDTH / 2,
            spawnY: (r + 1) * CONFIG.TILE - CONFIG.PLAYER.HEIGHT,
            lit: false,
          });
        }
        if (this.map[r][c] === 'X') {
          this.portal = {
            col: c, row: r,
            x: c * CONFIG.TILE + CONFIG.TILE / 2,
            y: r * CONFIG.TILE + CONFIG.TILE / 2,
          };
        }
        if (this.map[r][c] === 'P') {
          // Line the hero's feet up with the bottom of that square
          this.spawnX = c * CONFIG.TILE + CONFIG.TILE / 2 - CONFIG.PLAYER.WIDTH / 2;
          this.spawnY = (r + 1) * CONFIG.TILE - CONFIG.PLAYER.HEIGHT;
          found = true;
        }
      }
    }
    if (!found) {
      console.warn('This level has no P, so the hero has nowhere to start.');
      this.spawnX = CONFIG.TILE;
      this.spawnY = CONFIG.TILE;
    }
  },

  /*
     ILLUSIONS (Nea's idea)

     There are two different questions you can ask about a block, and
     the whole trick is that they can disagree:

        looksSolid()  — should this be PAINTED as rock?
        isSolidAt()   — should this STOP you?

     For ordinary rock the answer is yes to both. For an illusion it's
     yes to the first and no to the second. That one difference is the
     entire mechanic, and it's why it's convincing: the illusion isn't
     drawn as a special see-through thing, it is drawn by exactly the
     same code as every other block in the cave.
  */
  looksSolid(col, row) {
    if (col < 0 || col >= this.cols) return false;
    if (row < 0 || row >= this.rows) return false;
    const ch = this.map[row][col];
    return ch === '#' || ch === '?';
  },

  // Walk into an illusion and it gives itself away — from then on it
  // shimmers, so you never have to remember where it was.
  revealIllusions(player) {
    if (!this.illusions.length) return;
    const T = CONFIG.TILE;
    const c0 = Math.floor(player.x / T), c1 = Math.floor((player.x + player.w - 1) / T);
    const r0 = Math.floor(player.y / T), r1 = Math.floor((player.y + player.h - 1) / T);
    for (const g of this.illusions) {
      if (g.revealed) continue;
      if (g.col >= c0 && g.col <= c1 && g.row >= r0 && g.row <= r1) g.revealed = true;
    }
  },

  // Is the square at this row and column solid?
  // Anything outside the level counts as empty, except below the
  // bottom, so you can fall out of the world (we'll need that later).
  isSolidAt(col, row) {
    if (col < 0 || col >= this.cols) return false;
    if (row < 0 || row >= this.rows) return false;
    return this.map[row][col] === '#';
  },

  // Same question, but asked with pixels instead of squares
  isSolidAtPixel(x, y) {
    return this.isSolidAt(
      Math.floor(x / CONFIG.TILE),
      Math.floor(y / CONFIG.TILE)
    );
  },

  /*
     FLAGS — Nea's idea, and the thing that makes a long level bearable.

     Walk past one and it lights up. From then on, falling down a hole
     puts you back at that flag rather than all the way at the start.

     Without these, dying near the end of a twelve-screen level means
     replaying the whole thing, and nobody does that twice.
  */
  touchFlags(player) {
    const cx = player.x + player.w / 2;
    const cy = player.y + player.h / 2;
    for (const f of this.flags) {
      if (f.lit) continue;
      if (Math.abs(f.x - cx) < 46 && Math.abs(f.y - cy) < 80) {
        f.lit = true;
        this.lastFlag = f;
      }
    }
  },

  /*
     Back to the very beginning.

     Used when the clock runs out — which is different from falling
     down a hole. Falling costs you a little; running out of time
     costs you the whole level. That difference is what gives the
     clock its teeth, and it's what stops flags making a long level
     completely safe.

     One thing is deliberately NOT undone: illusions you've already
     walked through stay shimmering. Hiding a trick again once someone
     has worked it out isn't a challenge, it's just annoying — the
     trick was fun the first time and never will be again.
  */
  restart() {
    for (const f of this.flags) f.lit = false;
    this.lastFlag = null;
    this.resetAnchors();
    if (typeof Monsters !== 'undefined') Monsters.reset();
  },

  // Where do you come back to? The last flag you lit, or the start.
  respawnPoint() {
    return this.lastFlag
      ? { x: this.lastFlag.spawnX, y: this.lastFlag.spawnY }
      : { x: this.spawnX, y: this.spawnY };
  },

  // What kind of ring is this? Falls back to the normal one if a
  // level uses a letter we don't know about.
  ringType(anchor) {
    return CONFIG.GRAPPLE.RING_TYPES[anchor.type] || CONFIG.GRAPPLE.RING_TYPES.o;
  },

  // Anchors go dark after use and count back down to working again
  updateAnchors(dt) {
    for (const a of this.anchors) {
      if (a.cooldown > 0) a.cooldown = Math.max(0, a.cooldown - dt);
    }
  },

  resetAnchors() {
    for (const a of this.anchors) a.cooldown = 0;
  },

  // Can you draw a straight line between these two points without
  // going through a wall? Used so you can't grapple through rock.
  //
  // We walk along the line in small steps and check each spot. It's
  // not the cleverest way, but it's about ten lines instead of fifty
  // and you'd never notice the difference.
  hasLineOfSight(x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1;
    const distance = Math.hypot(dx, dy);
    const steps = Math.ceil(distance / 12);

    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      if (this.isSolidAtPixel(x1 + dx * t, y1 + dy * t)) return false;
    }
    return true;
  },

  // Has she got into the portal? Measured centre to centre, so it's
  // about touching it rather than clipping its corner.
  touchingPortal(player) {
    if (!this.portal) return false;
    const dx = (player.x + player.w / 2) - this.portal.x;
    const dy = (player.y + player.h / 2) - this.portal.y;
    return Math.hypot(dx, dy) < CONFIG.PORTAL.TOUCH_RADIUS;
  },

  pixelWidth()  { return this.cols * CONFIG.TILE; },
  pixelHeight() { return this.rows * CONFIG.TILE; },
};
