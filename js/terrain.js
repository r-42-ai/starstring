/* ============================================================
   STARSTRING — TERRAIN
   ============================================================

   Draws all the rock in the level — ONCE — onto a hidden picture,
   and from then on the game just stamps that picture down.

   ------------------------------------------------------------
   WHY BOTHER?
   ------------------------------------------------------------

   The rock never changes. Every frame we were redrawing hundreds of
   individual stones, each with its own shading, sixty times a second,
   to produce exactly the same result every time. That's a lot of work
   for no reason, and on a tablet it's the difference between a smooth
   game and a stuttery one.

   So we draw the whole cave once when the level loads, keep it as a
   hidden picture, and after that each frame is a single stamp.

   And here's the good bit: because it only happens ONCE, we can
   afford to make it beautiful. Every stone gets a proper rounded
   3D shading gradient — light from the top left, shadow bottom
   right — which would be far too slow to do every frame.

   That's a trade worth remembering: work out what never changes,
   do it once, and spend what you saved on making it look better.
   ============================================================ */

const Terrain = {

  canvas: null,
  ctx: null,

  build() {
    // A hidden drawing surface exactly the size of the whole level
    this.canvas = document.createElement('canvas');
    this.canvas.width  = Level.pixelWidth();
    this.canvas.height = Level.pixelHeight();
    this.ctx = this.canvas.getContext('2d');

    const ctx = this.ctx;
    const T = CONFIG.TILE;
    const C = CONFIG.COLORS;

    /*
       THREE PASSES, and the order matters.

       If each block were finished before starting the next, the next
       block's dark background would paint over the stones that had
       spilled out of the last one — putting a straight seam back
       between them, and you'd see the grid the world is built on.

       So: darkness everywhere first, THEN all the stones (which can
       happily overlap each other), THEN the gold on top.
    */

    // NOTE: everything below asks looksSolid(), never isSolidAt().
    // That's deliberate — an illusion has to be painted by exactly the
    // same code as real rock, or you'd spot it instantly.

    // PASS 1 — the dark gaps between the stones
    ctx.fillStyle = C.ROCK_CRACK;
    for (let row = 0; row < Level.rows; row++) {
      for (let col = 0; col < Level.cols; col++) {
        if (Level.looksSolid(col, row)) ctx.fillRect(col * T, row * T, T, T);
      }
    }

    // PASS 2 — the stones, spilling across the seams
    for (let row = 0; row < Level.rows; row++) {
      for (let col = 0; col < Level.cols; col++) {
        if (!Level.looksSolid(col, row)) continue;
        this._stones(ctx, col, row);
      }
    }

    // PASS 3 — the gold crust and the hanging crystals
    for (let row = 0; row < Level.rows; row++) {
      for (let col = 0; col < Level.cols; col++) {
        if (!Level.looksSolid(col, row)) continue;
        this._gold(ctx, col, row);
      }
    }
  },

  // One stamp per frame, instead of hundreds of little drawings.
  draw(ctx) {
    if (this.canvas) ctx.drawImage(this.canvas, 0, 0);
  },


  /* ---------- THE STONES ---------- */

  _stones(ctx, col, row) {
    const T = CONFIG.TILE;
    const C = CONFIG.COLORS;
    const x = col * T, y = row * T;

    const up = Level.looksSolid(col, row - 1), down  = Level.looksSolid(col, row + 1);
    const lf = Level.looksSolid(col - 1, row), right = Level.looksSolid(col + 1, row);

    ctx.save();

    // Only fence the stones in where the rock actually ENDS. Between
    // two solid blocks they're allowed to spill over each other, and
    // that spilling is what hides the grid.
    if (!up || !down || !lf || !right) {
      this.outline(ctx, x, y, up, down, lf, right);
      ctx.clip();
    }

    const exposed = !up;
    const greys = exposed
      ? [C.ROCK_LIGHT, C.SOLID, C.ROCK_MID, C.SOLID]
      : [C.SOLID, C.ROCK_MID, C.ROCK_DARK, C.ROCK_MID];

    // Four stones in a rough 2x2, each shoved well off its spot so
    // they never line up in a grid
    for (let i = 0; i < 4; i++) {
      const gx = i % 2, gy = (i / 2) | 0;
      const cx = x + (gx * 0.5 + 0.25 + (this.noise(col, row, i + 80) - 0.5) * 0.34) * T;
      const cy = y + (gy * 0.5 + 0.25 + (this.noise(col, row, i + 84) - 0.5) * 0.34) * T;
      const r  = T * (0.30 + this.noise(col, row, i + 88) * 0.13);
      const grey = greys[Math.floor(this.noise(col, row, i + 92) * greys.length)];
      this._pebble(ctx, cx, cy, r, col * 31 + row * 7 + i, grey);
    }

    // Small chips filling the cracks, so it looks packed rather than
    // like four balls floating in the dark
    for (let i = 0; i < 3; i++) {
      const cx = x + this.noise(col, row, i + 96) * T;
      const cy = y + this.noise(col, row, i + 99) * T;
      const r  = T * (0.10 + this.noise(col, row, i + 102) * 0.09);
      this._pebble(ctx, cx, cy, r, col * 13 + row * 29 + i, C.ROCK_DARK);
    }

    ctx.restore();
  },

  /*
     One stone, shaded so it looks round instead of flat.

     THE 3D BIT
     ----------
     A flat colour reads as a sticker. What makes something look solid
     is that it's LIT — brighter where the light hits it, darker where
     it curves away. So each stone gets a gradient whose bright spot
     sits up and to the left, as if there's a lamp up there, fading to
     shadow at the bottom right.

     Then a soft dark crescent underneath grounds it, and a thin bright
     line along the top edge is the glint you get on a real rounded
     surface. Those three things together are the whole trick.

     This is only affordable because it happens once at load. Doing it
     sixty times a second would be far too slow.
  */
  _pebble(ctx, cx, cy, r, seed, color) {
    const C = CONFIG.COLORS;

    // Points around a circle, each pushed in or out by a different
    // amount — that unevenness stops it looking like a drawn circle.
    //
    // noise() takes THREE numbers. Passing two leaves the third
    // undefined, which quietly makes every radius NaN — and a shape
    // built from NaN draws nothing at all, with no error.
    const POINTS = 8;
    const pts = [];
    for (let i = 0; i < POINTS; i++) {
      const angle = (i / POINTS) * Math.PI * 2;
      const radius = r * (0.76 + this.noise(seed, i + 1, 5) * 0.40);
      pts.push([cx + Math.cos(angle) * radius,
                cy + Math.sin(angle) * radius * 0.86]);
    }

    // Join them with CURVES, not straight lines. Straight lines give a
    // spiky shard; curving through the halfway points gives a worn,
    // rounded stone — which is what cave rock actually looks like.
    const shape = () => {
      ctx.beginPath();
      const first = [(pts[POINTS - 1][0] + pts[0][0]) / 2,
                     (pts[POINTS - 1][1] + pts[0][1]) / 2];
      ctx.moveTo(first[0], first[1]);
      for (let i = 0; i < POINTS; i++) {
        const next = pts[(i + 1) % POINTS];
        const mid = [(pts[i][0] + next[0]) / 2, (pts[i][1] + next[1]) / 2];
        ctx.quadraticCurveTo(pts[i][0], pts[i][1], mid[0], mid[1]);
      }
      ctx.closePath();
    };

    // The shadow it casts on the stones beneath it
    ctx.save();
    ctx.translate(2.5, 3);
    shape();
    ctx.fillStyle = C.ROCK_CRACK;
    ctx.globalAlpha = 0.55;
    ctx.fill();
    ctx.restore();

    // The stone itself, lit from the top left
    shape();
    const light = ctx.createRadialGradient(
      cx - r * 0.38, cy - r * 0.42, r * 0.08,   // the bright spot
      cx, cy, r * 1.15                          // fading out to the edge
    );
    light.addColorStop(0,    this._lighten(color, 32));
    light.addColorStop(0.55, color);
    light.addColorStop(1,    this._darken(color, 34));
    ctx.fillStyle = light;
    ctx.fill();

    // A bright glint along the top edge, where a rounded surface
    // catches the light most sharply
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = this._lighten(color, 50);
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy + r * 0.16, r * 0.82, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
    ctx.restore();

    // And the dark seam around it, so stones read as separate lumps
    shape();
    ctx.strokeStyle = C.ROCK_CRACK;
    ctx.lineWidth = 1.6;
    ctx.globalAlpha = 0.6;
    ctx.stroke();
    ctx.globalAlpha = 1;
  },


  /* ---------- THE GOLD ---------- */

  _gold(ctx, col, row) {
    const T = CONFIG.TILE;
    const C = CONFIG.COLORS;
    const x = col * T, y = row * T;

    const up = Level.looksSolid(col, row - 1), down  = Level.looksSolid(col, row + 1);
    const lf = Level.looksSolid(col - 1, row), right = Level.looksSolid(col + 1, row);

    // The gold has to follow the ROUNDED outline of the rock, not sit
    // on it as a straight bar — painting a straight strip across a
    // rounded corner squares that corner straight back off again.
    if (!up || !down) {
      ctx.save();
      this.outline(ctx, x, y, up, down, lf, right);
      ctx.clip();

      if (!up) {
        // A gold crust along the top, so you can see instantly what you
        // can stand on. Deliberately smooth — shards sticking up out of
        // a floor read as "this will hurt you".
        const g = ctx.createLinearGradient(0, y, 0, y + 10);
        g.addColorStop(0, C.SOLID_TOP_GLOW);
        g.addColorStop(1, C.SOLID_TOP);
        ctx.fillStyle = g;
        ctx.fillRect(x - 2, y, T + 4, 9);
      }
      if (!down) {
        ctx.fillStyle = C.SOLID_TOP;
        ctx.fillRect(x - 2, y + T - 7, T + 4, 7);
      }
      ctx.restore();
    }

    // Gold crystals hanging from the undersides, like the stalactites
    // on a real cave roof. Drawn OUTSIDE the clip, because they are
    // meant to stick out into the air.
    if (!down) this._teeth(ctx, col, row, x, y + T);
  },

  _teeth(ctx, col, row, x, y) {
    const T = CONFIG.TILE;
    const C = CONFIG.COLORS;

    for (let i = 0; i < 3; i++) {
      const cx = x + (0.16 + this.noise(col, row, i + 200) * 0.68) * T;
      const h  = 5 + this.noise(col, row, i + 209) * 16;
      const w  = 3 + this.noise(col, row, i + 217) * 4;
      const lean = (this.noise(col, row, i + 223) - 0.5) * 5;

      ctx.fillStyle = C.SOLID_TOP;
      ctx.beginPath();
      ctx.moveTo(cx + lean, y + h);
      ctx.lineTo(cx + w, y - 4);
      ctx.lineTo(cx - w, y - 4);
      ctx.closePath();
      ctx.fill();

      // A lit face down one side, so it reads as a hard crystal
      // rather than a flat paper triangle
      ctx.fillStyle = C.SOLID_TOP_GLOW;
      ctx.beginPath();
      ctx.moveTo(cx + lean, y + h);
      ctx.lineTo(cx + w * 0.35, y - 4);
      ctx.lineTo(cx - w * 0.15, y - 4);
      ctx.closePath();
      ctx.fill();
    }
  },


  /* ---------- SHAPES AND HELPERS ---------- */

  /*
     The outline of one block of rock — but ROUNDED, so a platform
     doesn't look like a brick.

     A corner is only rounded off if BOTH sides meeting there are open
     air. That makes it an outer corner of the rock, the bit you'd
     actually see worn smooth in a cave. Corners buried inside the rock
     stay square, so neighbouring blocks still join into one solid lump.
  */
  outline(ctx, x, y, up, down, lf, right) {
    const T = CONFIG.TILE;
    const R = CONFIG.ROCK_ROUNDING;

    const tl = (!up   && !lf)    ? R : 0;
    const tr = (!up   && !right) ? R : 0;
    const br = (!down && !right) ? R : 0;
    const bl = (!down && !lf)    ? R : 0;

    // Reach WELL past the edge on any side that's buried in more rock.
    //
    // A hair's width isn't enough: a one-block-thick platform has open
    // air above and below every block, so every block gets fenced in,
    // and you end up seeing a dark seam at every join. Letting the
    // stones spill a good way into the rock next door is what makes a
    // row of blocks read as one lump of stone.
    const SPILL = T * 0.6;
    const x0 = x - (lf    ? SPILL : 0), x1 = x + T + (right ? SPILL : 0);
    const y0 = y - (up    ? SPILL : 0), y1 = y + T + (down  ? SPILL : 0);

    ctx.beginPath();
    ctx.moveTo(x0 + tl, y0);
    ctx.lineTo(x1 - tr, y0);
    if (tr) ctx.quadraticCurveTo(x1, y0, x1, y0 + tr); else ctx.lineTo(x1, y0);
    ctx.lineTo(x1, y1 - br);
    if (br) ctx.quadraticCurveTo(x1, y1, x1 - br, y1); else ctx.lineTo(x1, y1);
    ctx.lineTo(x0 + bl, y1);
    if (bl) ctx.quadraticCurveTo(x0, y1, x0, y1 - bl); else ctx.lineTo(x0, y1);
    ctx.lineTo(x0, y0 + tl);
    if (tl) ctx.quadraticCurveTo(x0, y0, x0 + tl, y0); else ctx.lineTo(x0, y0);
    ctx.closePath();
  },

  // A repeatable pseudo-random number between 0 and 1. Same inputs
  // always give the same answer, so nothing needs storing and the
  // cave never changes behind your back.
  noise(a, b, c) {
    const n = Math.sin(a * 127.1 + b * 311.7 + c * 74.7) * 43758.5453;
    return n - Math.floor(n);
  },

  _lighten(hex, amount) { return this._shift(hex, amount); },
  _darken(hex, amount)  { return this._shift(hex, -amount); },

  _shift(hex, amount) {
    const n = parseInt(hex.slice(1), 16);
    const clamp = v => Math.max(0, Math.min(255, v));
    const r = clamp(((n >> 16) & 255) + amount);
    const g = clamp(((n >> 8) & 255) + amount);
    const b = clamp((n & 255) + amount);
    return `rgb(${r},${g},${b})`;
  },
};
