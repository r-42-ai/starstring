/* ============================================================
   STARSTRING — THE TITLE SCREEN
   ============================================================

   The first thing anyone sees. Its whole job is to say what the game
   is called, show you Blob, and get out of the way.

   Nothing here is clever. That's on purpose: a title screen you have
   to work out is a title screen that's failed.
   ============================================================ */

const Title = {

  time: 0,
  ready: false,        // ignore the very first frames, so a tap that
                       // started somewhere else doesn't skip the screen

  init() {
    this.time = 0;
    this.ready = false;
  },

  update(dt) {
    this.time += dt;
    if (this.time > 0.4) this.ready = true;

    if (!this.ready) return;

    const pressed = Input.tapped || Input._touches.size > 0 ||
                    Input.jump || Input.grapple || Input.left || Input.right;
    if (pressed) {
      // Swallow the tap that got us here, or it lands on the map
      // underneath and starts a level you never chose.
      Input.tapped = null;
      Game.mode = 'planet';
    }
  },

  draw(ctx) {
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
    const t = this.time;

    // --- space ---
    ctx.fillStyle = '#04070c';
    ctx.fillRect(0, 0, W, H);

    for (let i = 0; i < 150; i++) {
      const n = k => {
        const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
        return v - Math.floor(v);
      };
      ctx.globalAlpha = (0.25 + n(4) * 0.75) *
                        (0.4 + Math.abs(Math.sin(t * 0.7 + n(3) * 6.28)) * 0.6);
      ctx.fillStyle = '#dff0ff';
      ctx.fillRect(n(1) * W, n(2) * H, 1.7, 1.7);
    }
    ctx.globalAlpha = 1;

    // --- crystal shards round the edges, so it looks like this game
    //     and not like any game ---
    for (let i = 0; i < 14; i++) {
      const n = k => {
        const v = Math.sin(i * 71.3 + k * 191.7) * 43758.5453;
        return v - Math.floor(v);
      };
      const bottom = i % 2 === 0;
      const x = n(1) * W;
      const h = 60 + n(2) * 190;
      const w = 18 + n(3) * 34;
      const y = bottom ? H + 10 : -10;
      const dir = bottom ? -1 : 1;

      ctx.globalAlpha = 0.5 + n(4) * 0.4;
      ctx.fillStyle = n(5) > 0.5
        ? CONFIG.PLANET.COLORS.GOLD_DARK
        : CONFIG.PLANET.COLORS.GREEN_DARK;
      ctx.beginPath();
      ctx.moveTo(x, y + h * dir);
      ctx.lineTo(x + w, y);
      ctx.lineTo(x - w, y);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // --- Blob, floating ---
    const blobY = H * 0.40 + Math.sin(t * 1.3) * 12;
    const glow = ctx.createRadialGradient(W/2, blobY, 8, W/2, blobY, 150);
    glow.addColorStop(0, 'rgba(255,240,190,0.45)');
    glow.addColorStop(1, 'rgba(255,240,190,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(W/2, blobY, 150, 0, Math.PI*2); ctx.fill();

    if (typeof Assets !== 'undefined' && Assets.has && Assets.has('blob')) {
      const img = Assets.get('blob');
      const h = 120, w = h * (img.width / img.height);
      ctx.drawImage(img, W/2 - w/2, blobY - h/2, w, h);
    } else {
      ctx.fillStyle = '#f6ffe8';
      ctx.beginPath();
      ctx.ellipse(W/2, blobY, 56, 48, 0, 0, Math.PI*2);
      ctx.fill();
    }

    // --- the name ---
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';

    ctx.fillStyle = CONFIG.PLANET.COLORS.GOLD_LIGHT;
    ctx.font = 'bold 92px system-ui, sans-serif';
    ctx.fillText('STARSTRING', W/2, H * 0.66);

    ctx.fillStyle = 'rgba(200,235,215,0.8)';
    ctx.font = 'italic 27px system-ui, sans-serif';
    ctx.fillText('a string between stars', W/2, H * 0.72);

    // --- start ---
    const blink = 0.55 + Math.abs(Math.sin(t * 2.2)) * 0.45;
    ctx.globalAlpha = blink;
    ctx.fillStyle = '#eafff6';
    ctx.font = 'bold 30px system-ui, sans-serif';
    ctx.fillText('tap anywhere to begin', W/2, H * 0.86);
    ctx.globalAlpha = 1;

    ctx.fillStyle = 'rgba(160,190,175,0.55)';
    ctx.font = '19px system-ui, sans-serif';
    ctx.fillText('designed by Nea', W/2, H - 28);
  },
};
