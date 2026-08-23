/* ============================================================
   STARSTRING — LEVEL
   ============================================================

   NEA: THIS IS THE FUN ONE.

   The level below is drawn with letters. You can rearrange it
   like drawing on squared paper, save the file, reload the game,
   and you have made a new level. No code involved.

     .  = empty space
     #  = solid block you can stand on
     P  = where the hero starts

   Rules:
     - Every row must be exactly the same length
     - Keep them inside the ' ' quote marks and end with a comma
     - There must be exactly one P

   Try it right now: add a few # somewhere and reload.
   ============================================================ */

const LEVELS = {

  'crystal-caves-1': {

    name: 'First Steps',

    // How strongly this planet pulls you down.
    // 1.0 is normal. The Crystal Caves are 0.8, so you're a bit lighter.
    // Change it to 0.4 and you'll feel like you're on a tiny moon.
    // Change it to 2.0 and you'll barely get off the ground.
    gravityScale: 0.8,

    map: [
      '....................',
      '....................',
      '............#####...',
      '....................',
      '.......####.........',
      '....................',
      '................###.',
      '.....###............',
      '....................',
      '..P.............####',
      '####################',
    ],
  },

};


/* ============================================================
   Below here is the code that reads the letters above.
   You don't need to change any of it.
   ============================================================ */

const Level = {

  map: [],
  cols: 0,
  rows: 0,
  gravityScale: 1,
  spawnX: 0,
  spawnY: 0,

  load(key) {
    const data = LEVELS[key];
    if (!data) {
      console.error('There is no level called "' + key + '"');
      return;
    }

    this.map = data.map;
    this.rows = data.map.length;
    this.cols = data.map[0].length;
    this.gravityScale = data.gravityScale ?? 1;

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

    // Find where the hero starts
    let found = false;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
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

  pixelWidth()  { return this.cols * CONFIG.TILE; },
  pixelHeight() { return this.rows * CONFIG.TILE; },
};
