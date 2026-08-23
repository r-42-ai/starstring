/* ============================================================
   STARSTRING — BACKGROUND
   ============================================================

   The cavern behind you. Nothing here is a picture — every crystal,
   spire and stalactite is drawn by the code from a handful of numbers.

   ------------------------------------------------------------
   PARALLAX — the trick that makes flat pictures look deep
   ------------------------------------------------------------

   Hold a finger up and move your head. Your finger shoots across your
   view; the wall behind it barely moves; the moon doesn't move at all.
   Your brain reads "how fast does it slide?" as "how far away is it?"

   So we draw the cave in layers and slide each one at a different
   speed:

       far layer    moves at 12% of your speed   -> feels miles away
       middle layer moves at 32%                 -> a bit closer
       near layer   moves at 60%                 -> almost touching you

   The blocks you actually stand on move at 100%. That gap is the
   whole illusion.

   ------------------------------------------------------------
   WHY THERE'S NOTHING TO STORE
   ------------------------------------------------------------

   The cave could be a hundred thousand pixels wide and this file
   still wouldn't remember a single spire. Each one's size and shape
   is worked out from WHICH spire it is — number 47 always comes out
   the same. So we only ever build the handful on screen right now,
   and they're identical every time you walk back past them.
   ============================================================ */

const Background = {

  // Furthest away first, so nearer layers are drawn over the top.
  LAYERS: [
    { parallax: 0.12, spacing: 210, color: '#12291d', minH: 150, maxH: 380,
      width: 1.5, glints: true },
    { parallax: 0.32, spacing: 150, color: '#0e2118', minH: 110, maxH: 300,
      width: 1.1, glints: true },
    { parallax: 0.60, spacing: 260, color: '#071410', minH: 130, maxH: 280,
      width: 1.8, glints: false },
  ],

  draw(ctx, clock) {
    this._drawSky(ctx);
    for (let i = 0; i < this.LAYERS.length; i++) {
      this._drawLayer(ctx, this.LAYERS[i], i, clock);
    }
  },

  _drawSky(ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, CONFIG.HEIGHT);
    g.addColorStop(0,    CONFIG.COLORS.SKY_TOP);
    g.addColorStop(0.55, CONFIG.COLORS.SKY_MID);
    g.addColorStop(1,    CONFIG.COLORS.SKY_BOTTOM);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
  },

  _drawLayer(ctx, layer, layerIndex, clock) {
    // How far this layer has slid. Slower than the camera, so it
    // feels further away.
    const offsetX = Camera.x * layer.parallax;
    const offsetY = Camera.y * layer.parallax * 0.45;

    // Which spires could possibly be on screen? Only build those.
    const first = Math.floor((offsetX - layer.spacing) / layer.spacing);
    const last  = Math.ceil((offsetX + CONFIG.WIDTH + layer.spacing) / layer.spacing);

    ctx.save();
    ctx.fillStyle = layer.color;

    for (let i = first; i <= last; i++) {
      const seed = i * 17 + layerIndex * 991;
      const x = i * layer.spacing - offsetX;

      // Stalagmite growing up from the floor
      const upH = layer.minH + this._noise(seed, 1) * (layer.maxH - layer.minH);
      const upW = (50 + this._noise(seed, 2) * 90) * layer.width;
      const upLean = (this._noise(seed, 3) - 0.5) * 40;
      this._spire(ctx, x, CONFIG.HEIGHT - offsetY * 0.4, -upH, upW, upLean);

      // Stalactite hanging down from the roof
      if (this._noise(seed, 4) > 0.25) {
        const dnH = layer.minH * 0.7 + this._noise(seed, 5) * (layer.maxH - layer.minH) * 0.8;
        const dnW = (40 + this._noise(seed, 6) * 80) * layer.width;
        const dnLean = (this._noise(seed, 7) - 0.5) * 40;
        const gap = x + layer.spacing * 0.5;
        this._spire(ctx, gap, -offsetY * 0.4, dnH, dnW, dnLean);
      }
    }

    // Faint gold glimmers deep in the dark, so the far cave feels
    // like it's full of crystal too rather than being empty paint.
    if (layer.glints) {
      for (let i = first; i <= last; i++) {
        const seed = i * 17 + layerIndex * 991;
        for (let k = 0; k < 2; k++) {
          const twinkle = Math.sin(clock * 0.9 + this._noise(seed, k + 11) * 6.28);
          if (twinkle <= 0.55) continue;
          const gx = i * layer.spacing - offsetX + this._noise(seed, k + 12) * layer.spacing;
          const gy = this._noise(seed, k + 13) * CONFIG.HEIGHT - offsetY * 0.4;
          ctx.globalAlpha = (twinkle - 0.55) * 0.55;
          ctx.fillStyle = CONFIG.COLORS.SOLID_TOP;
          ctx.beginPath();
          ctx.arc(gx, gy, 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = layer.color;
    }

    ctx.restore();
  },

  // One crystal spire: a lopsided triangle. Negative height points up.
  _spire(ctx, x, baseY, height, width, lean) {
    ctx.beginPath();
    ctx.moveTo(x - width / 2, baseY);
    ctx.lineTo(x + lean, baseY + height);
    ctx.lineTo(x + width / 2, baseY);
    ctx.closePath();
    ctx.fill();
  },

  // Same repeatable pseudo-randomness the rest of the game uses:
  // the same inputs always give the same answer, so nothing needs
  // storing and the cave never changes behind your back.
  _noise(seed, i) {
    const n = Math.sin(seed * 127.1 + i * 311.7) * 43758.5453;
    return n - Math.floor(n);
  },
};
