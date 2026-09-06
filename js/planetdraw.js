/* ============================================================
   STARSTRING — DRAWING THE PLANET
   ============================================================

   Kept separate from planet.js so that one file is about WHERE
   things are and this one is about what they LOOK like. Those two
   jobs change for completely different reasons.
   ============================================================ */

const PlanetDraw = {

  draw(ctx, clock) {
    this._stars(ctx, clock);
    this._halo(ctx);
    this._spikes(ctx, false);      // the shards sticking out round the back
    this._facets(ctx);             // the gem itself
    this._spikes(ctx, true);       // and the ones in front
    this._glints(ctx, clock);
    this._path(ctx, clock);
    this._levels(ctx, clock);
    this._hero(ctx, clock);
    this._label(ctx);
  },

  // Light comes from up and to the left, and everything on the planet
  // is shaded from this one direction. Using the same light everywhere
  // is most of what makes a picture look solid.
  LIGHT: { x: -0.45, y: 0.55, z: 0.70 },

  /* ---------- SPACE ---------- */

  // Stars behind the planet. Worked out from their number rather than
  // stored, so the same star is always in the same place.
  _stars(ctx, clock) {
    ctx.fillStyle = '#04070c';
    ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);

    for (let i = 0; i < 180; i++) {
      const n = (k) => {
        const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
        return v - Math.floor(v);
      };
      const x = n(1) * CONFIG.WIDTH;
      const y = n(2) * CONFIG.HEIGHT;
      const twinkle = 0.35 + Math.abs(Math.sin(clock * 0.8 + n(3) * 6.28)) * 0.65;
      ctx.globalAlpha = twinkle * (0.3 + n(4) * 0.7);
      ctx.fillStyle = '#dff0ff';
      ctx.fillRect(x, y, 1.6, 1.6);
    }
    ctx.globalAlpha = 1;
  },

  /* ---------- THE PLANET ITSELF ---------- */

  /*
     A CRYSTAL, NOT A BALL.

     The first version was a smooth green sphere, and it looked like a
     grassy world. The problem wasn't the colour — it was the SMOOTHNESS.
     Anything shaded with a soft gradient reads as something soft.

     Crystal is the opposite: FLAT FACES meeting at SHARP EDGES. So the
     planet is now built out of hundreds of flat panes, each one lit on
     its own according to which way it happens to point. Turn it and the
     bright faces sweep across it the way they do on a cut gem.

     Three things do the work:

       FACETS   flat panes, each a single flat colour — no gradients
       EDGES    a lighter line along every join, so you see the cuts
       SPIKES   shards breaking the round outline, so the silhouette
                itself says "crystal" before you've looked at anything
  */
  _facets(ctx) {
    const BANDS = 17, SEGS = 34;

    // Every facet worked out first, then drawn furthest-away first, so
    // near faces cover far ones.
    const faces = [];

    for (let b = 0; b < BANDS; b++) {
      for (let sg = 0; sg < SEGS; sg++) {
        const corners = [
          this._vertex(b,     sg),
          this._vertex(b,     sg + 1),
          this._vertex(b + 1, sg + 1),
          this._vertex(b + 1, sg),
        ];
        // If every corner is round the back, skip the whole face
        if (corners.every(c => c.vz <= 0)) continue;

        // Which way is this face pointing? The average of its corners
        // is close enough on a ball, and it's three lines instead of
        // thirty.
        let nx = 0, ny = 0, nz = 0;
        for (const c of corners) { nx += c.vx; ny += c.vy; nz += c.vz; }
        const len = Math.hypot(nx, ny, nz) || 1;
        nx /= len; ny /= len; nz /= len;
        if (nz <= 0.02) continue;                 // facing away from us

        const lit = Math.max(0, nx * this.LIGHT.x + ny * this.LIGHT.y + nz * this.LIGHT.z);

        // Which mineral is this face made of?
        //
        // Deciding at random per face gives a beach ball — gold and
        // teal scattered like a chessboard. Real rock comes in VEINS,
        // so this is worked out from where the face is, which makes
        // neighbours mostly agree and the colours run in bands.
        const lat = (b / BANDS - 0.5) * Math.PI;
        const lon = (sg / SEGS) * Math.PI * 2;
        const vein = Math.sin(lat * 2.4 + 1.1) * 0.62 +
                     Math.cos(lon * 1.7 - 0.4) * 0.55 +
                     Math.sin(lat * 5.1 + lon * 2.3) * 0.22 +
                     (this._rnd(b * SEGS + sg, 9) - 0.5) * 0.30;

        faces.push({ corners, lit, z: nz, key: b * SEGS + sg, gold: vein > 0.22 });
      }
    }

    faces.sort((a, b) => a.z - b.z);

    for (const f of faces) {
      // Two minerals in one rock: cold teal and warm gold, running in
      // veins. Deep shadows and bright faces — a narrow range of greys
      // is exactly what made the first version look like grass.
      const shade = Math.pow(f.lit, 1.7);

      const C = CONFIG.PLANET.COLORS;
      const col = f.gold
        ? this._mix(C.GOLD_DARK,  C.GOLD_LIGHT,  shade * 0.96 + this._rnd(f.key,4) * 0.04)
        : this._mix(C.GREEN_DARK, C.GREEN_LIGHT, shade * 0.94 + this._rnd(f.key,5) * 0.06);

      ctx.beginPath();
      ctx.moveTo(f.corners[0].x, f.corners[0].y);
      for (let i = 1; i < 4; i++) ctx.lineTo(f.corners[i].x, f.corners[i].y);
      ctx.closePath();

      ctx.fillStyle = col;
      ctx.fill();

      // The cut line along each edge. Bright where the light hits,
      // dark in shadow — this is what makes the facets look sharp
      // rather than like a mosaic of flat tiles.
      ctx.strokeStyle = shade > 0.55
        ? `rgba(235,255,225,${0.20 + shade * 0.35})`
        : 'rgba(4,18,10,0.55)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  },

  /*
     One corner of the crystal.

     The radius is nudged in and out a little per corner, which is what
     stops it looking like a perfectly smooth geodesic ball — real
     crystal is lumpy. The nudge comes from WHICH corner it is, so
     neighbouring faces that share a corner always agree about where
     it is and no gaps ever open up between them.
  */
  _vertex(band, seg) {
    const BANDS = 17, SEGS = 34;
    const lat = (band / BANDS - 0.5) * Math.PI;
    const lon = (seg % SEGS) / SEGS * Math.PI * 2;

    const wobble = 1 + (this._rnd(band * 131 + (seg % SEGS), 7) - 0.5) * 0.11;

    return Planet.projectVec(
      Math.cos(lat) * Math.sin(lon) * wobble,
      Math.sin(lat) * wobble,
      Math.cos(lat) * Math.cos(lon) * wobble
    );
  },

  /*
     SHARDS BREAKING THE OUTLINE.

     This is the single most useful thing on the whole screen. A circle
     reads as a ball no matter what you paint inside it. A circle with
     crystal shards poking out past its edge reads as a crystal before
     you have consciously looked at anything.
  */
  _spikes(ctx, front) {
    for (let i = 0; i < 46; i++) {
      const lat = (this._rnd(i, 11) - 0.5) * 2.9;
      const lon = this._rnd(i, 12) * Math.PI * 2;

      const dirX = Math.cos(lat) * Math.sin(lon);
      const dirY = Math.sin(lat);
      const dirZ = Math.cos(lat) * Math.cos(lon);

      const base = Planet.projectVec(dirX, dirY, dirZ);
      // Draw the ones behind the planet first and the ones in front
      // afterwards, so the planet sits properly between them.
      if (front ? base.vz < 0 : base.vz >= 0) continue;

      const length = 1 + 0.09 + this._rnd(i, 13) * 0.20;
      const tip = Planet.projectVec(dirX * length, dirY * length, dirZ * length);

      // How wide it is at the bottom, across the screen
      const dx = tip.x - base.x, dy = tip.y - base.y;
      const long = Math.hypot(dx, dy) || 1;
      const wide = (4 + this._rnd(i, 14) * 9) * Planet.zoom;
      const px = -dy / long * wide, py = dx / long * wide;

      const lit = Math.max(0, base.vx * this.LIGHT.x + base.vy * this.LIGHT.y +
                              base.vz * this.LIGHT.z);
      const gold = this._rnd(i, 15) > 0.5;

      ctx.globalAlpha = front ? 1 : 0.55;
      ctx.beginPath();
      ctx.moveTo(tip.x, tip.y);
      ctx.lineTo(base.x + px, base.y + py);
      ctx.lineTo(base.x - px, base.y - py);
      ctx.closePath();
      const C = CONFIG.PLANET.COLORS;
      ctx.fillStyle = gold
        ? this._mix(C.GOLD_DARK,  C.GOLD_LIGHT,  Math.pow(lit, 1.3))
        : this._mix(C.GREEN_DARK, C.GREEN_LIGHT, Math.pow(lit, 1.3));
      ctx.fill();

      // A bright edge down one side of the shard
      ctx.beginPath();
      ctx.moveTo(tip.x, tip.y);
      ctx.lineTo(base.x + px, base.y + py);
      ctx.strokeStyle = `rgba(240,255,228,${0.25 + lit * 0.5})`;
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  },

  // Hard little four-pointed glints on the brightest faces. Crystal
  // catches the light in sharp points; soft things never do.
  _glints(ctx, clock) {
    for (let i = 0; i < 26; i++) {
      const lat = (this._rnd(i, 21) - 0.5) * 2.6;
      const lon = this._rnd(i, 22) * Math.PI * 2;
      const p = Planet.project(lat, lon);
      if (p.vz <= 0.15) continue;

      const lit = Math.max(0, p.vx * this.LIGHT.x + p.vy * this.LIGHT.y + p.vz * this.LIGHT.z);
      if (lit < 0.45) continue;                 // only where the light lands

      let t = Math.sin(clock * 1.6 + this._rnd(i, 23) * 6.28);
      if (t <= 0) continue;
      t = Math.pow(t, 5) * lit;
      if (t < 0.03) continue;

      const size = (5 + this._rnd(i, 24) * 7) * t * Planet.zoom;
      ctx.globalAlpha = t;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(p.x - size * 2.4, p.y - size * 0.16, size * 4.8, size * 0.32);
      ctx.fillRect(p.x - size * 0.16, p.y - size * 2.4, size * 0.32, size * 4.8);
      ctx.beginPath();
      ctx.arc(p.x, p.y, size * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  },

  _halo(ctx) {
    const cx = CONFIG.WIDTH / 2, cy = CONFIG.HEIGHT / 2, r = Planet.radius();
    const halo = ctx.createRadialGradient(cx, cy, r * 0.85, cx, cy, r * 1.5);
    const H = CONFIG.PLANET.COLORS.HALO;
    halo.addColorStop(0, `rgba(${H},0.26)`);
    halo.addColorStop(1, `rgba(${H},0)`);
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.5, 0, Math.PI * 2);
    ctx.fill();
  },


  /* ---------- LITTLE HELPERS ---------- */

  // Repeatable pseudo-randomness: same inputs, same answer, always.
  _rnd(a, b) {
    const v = Math.sin(a * 91.7 + b * 217.3) * 43758.5453;
    return v - Math.floor(v);
  },

  // Blend between two colours. t=0 gives the first, t=1 the second.
  _mix(c1, c2, t) {
    t = Math.max(0, Math.min(1, t));
    const a = parseInt(c1.slice(1), 16), b = parseInt(c2.slice(1), 16);
    const r = Math.round(((a >> 16) & 255) + (((b >> 16) & 255) - ((a >> 16) & 255)) * t);
    const g = Math.round(((a >> 8) & 255) + (((b >> 8) & 255) - ((a >> 8) & 255)) * t);
    const bl = Math.round((a & 255) + ((b & 255) - (a & 255)) * t);
    return `rgb(${r},${g},${bl})`;
  },

  /*
     YOU, standing on the last level you played.

     Drawn small, and turned so her feet point at the middle of the
     planet — which is what "standing up" means when the ground is a
     ball. Without that she looks like a sticker; with it she looks
     like she's actually on it.
  */
  _hero(ctx, clock) {
    const i = Planet.lastPlayed;
    if (i == null || i < 0 || !Planet.levels[i]) return;

    const l = Planet.levels[i];
    const p = Planet.project(l.lat, l.lon);
    if (p.z <= 0.05) return;                 // she's round the back

    const cx = CONFIG.WIDTH / 2, cy = CONFIG.HEIGHT / 2;
    const dx = p.x - cx, dy = p.y - cy;
    const away = Math.hypot(dx, dy) || 1;

    // Which way is "up" for someone standing here
    const upX = dx / away, upY = dy / away;
    const angle = Math.atan2(upX, -upY);

    const h = CONFIG.PLANET.HERO_SIZE * Planet.zoom * (0.6 + p.z * 0.4);
    const bob = Math.sin(clock * 2) * h * 0.03;

    ctx.save();
    // stand her ON the surface, not in it
    ctx.translate(p.x + upX * (h * 0.52 + bob), p.y + upY * (h * 0.52 + bob));
    ctx.rotate(angle);
    ctx.globalAlpha = 0.4 + p.z * 0.6;

    if (typeof Assets !== 'undefined' && Assets.has && Assets.has('hero_idle_1')) {
      const img = Assets.get('hero_idle_1');
      const w = h * (img.width / img.height);
      ctx.drawImage(img, -w / 2, -h, w, h);
    } else {
      ctx.fillStyle = '#eaf6ff';
      ctx.fillRect(-h * 0.18, -h, h * 0.36, h);
    }
    ctx.restore();
  },

  /* ---------- THE PATH BETWEEN THE LEVELS ---------- */

  _path(ctx, clock) {
    for (let i = 0; i < Planet.levels.length - 1; i++) {
      const a = Planet.levels[i], b = Planet.levels[i + 1];
      const open = a.done;                 // the path lights up as you progress

      for (let s = 0; s < 24; s++) {
        const t0 = s / 24, t1 = (s + 1) / 24;
        const p0 = Planet.project(a.lat + (b.lat - a.lat) * t0,
                                  a.lon + (b.lon - a.lon) * t0);
        const p1 = Planet.project(a.lat + (b.lat - a.lat) * t1,
                                  a.lon + (b.lon - a.lon) * t1);
        if (p0.z <= 0 || p1.z <= 0) continue;

        ctx.globalAlpha = (open ? 0.85 : 0.28) * p0.depth;
        ctx.strokeStyle = open ? '#ffdb8a' : '#5e7a70';
        ctx.lineWidth = open ? 3 : 2;
        ctx.setLineDash(open ? [] : [5, 7]);
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.stroke();
      }
    }
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  },

  /* ---------- THE LEVELS ---------- */

  _levels(ctx, clock) {
    // Furthest away first, so nearer markers are drawn over the top
    const order = Planet.levels
      .map((l, i) => ({ l, i, p: Planet.project(l.lat, l.lon) }))
      .filter(o => o.p.z > 0)
      .sort((a, b) => a.p.z - b.p.z);

    for (const { l, i, p } of order) {
      const unlocked = Planet.isPlayable(i);   // earned AND built
      const soon = Planet.isUnlocked(i) && !l.key;   // earned, not built yet
      const here = (Planet.selected === i);

      // Markers shrink as they go round the side — that's what makes
      // them sit ON the ball rather than float in front of it.
      const size = CONFIG.PLANET.MARKER * (0.55 + p.z * 0.45) * Planet.zoom;
      const pulse = unlocked && !l.done ? 1 + Math.sin(clock * 3.4) * 0.14 : 1;
      const r = size * pulse * (here ? 1.25 : 1);

      ctx.globalAlpha = 0.35 + p.depth * 0.65;

      // A glow under the one you can play next
      if (unlocked && !l.done) {
        const g = ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, r * 3);
        g.addColorStop(0, 'rgba(255,219,138,0.5)');
        g.addColorStop(1, 'rgba(255,219,138,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p.x, p.y, r * 3, 0, Math.PI * 2); ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = l.done ? '#5cff9d' : unlocked ? '#ffdb8a'
                                         : soon ? '#6b6250' : '#3c4a44';
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = l.done ? '#c9ffe2' : unlocked ? '#fff4d6' : '#2a3531';
      ctx.stroke();

      /*
         A TICK on finished levels -- DRAWN, not typed.

         The first version put the character '✓' through fillText, and
         AXY's tablet showed the number on a green button instead; the
         headless renderer showed nothing at all. A text glyph is only
         as reliable as whatever font the device happens to resolve
         'system-ui' to, and canvas gives you no warning when a glyph is
         missing -- it just draws the wrong thing, differently wrong on
         every machine.

         Three lines through ctx.stroke() look identical everywhere,
         which for an icon is the entire job. Numbers are safe to type:
         every font since the dawn of fonts has digits.
      */
      if (l.done) {
        ctx.strokeStyle = '#0a1a12';
        ctx.lineWidth = Math.max(2.5, r * 0.22);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(p.x - r * 0.42, p.y + r * 0.05);
        ctx.lineTo(p.x - r * 0.10, p.y + r * 0.38);
        ctx.lineTo(p.x + r * 0.45, p.y - r * 0.32);
        ctx.stroke();
      } else if (unlocked && l.number === 0) {
        // The teaching level isn't a number (AXY's rule), so it gets a
        // four-pointed star -- drawn with strokes, like the tick,
        // because typed icons render differently on every device.
        ctx.strokeStyle = '#0a1a12';
        ctx.lineWidth = Math.max(2.5, r * 0.2);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - r * 0.45); ctx.lineTo(p.x, p.y + r * 0.45);
        ctx.moveTo(p.x - r * 0.45, p.y); ctx.lineTo(p.x + r * 0.45, p.y);
        ctx.stroke();
        ctx.lineWidth = Math.max(2, r * 0.14);
        ctx.beginPath();
        ctx.moveTo(p.x - r * 0.26, p.y - r * 0.26); ctx.lineTo(p.x + r * 0.26, p.y + r * 0.26);
        ctx.moveTo(p.x + r * 0.26, p.y - r * 0.26); ctx.lineTo(p.x - r * 0.26, p.y + r * 0.26);
        ctx.stroke();
      } else if (unlocked) {
        ctx.fillStyle = '#0a1a12';
        ctx.font = `bold ${Math.round(r * 1.1)}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(l.number), p.x, p.y + 1);
      }

      if (!unlocked) {
        ctx.strokeStyle = '#6d7d76';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y - r * 0.15, r * 0.32, Math.PI, 0);
        ctx.stroke();
        ctx.fillStyle = '#6d7d76';
        ctx.fillRect(p.x - r * 0.4, p.y - r * 0.15, r * 0.8, r * 0.55);
      }
      ctx.globalAlpha = 1;
    }
  },

  /* ---------- WORDS ---------- */

  _label(ctx) {
    // Dark bands top and bottom. Zoom the planet right in and it fills
    // the screen, and white writing on a pale green planet is
    // unreadable. These keep the words legible whatever is behind them.
    const top = ctx.createLinearGradient(0, 0, 0, 130);
    top.addColorStop(0, 'rgba(4,7,12,0.85)');
    top.addColorStop(1, 'rgba(4,7,12,0)');
    ctx.fillStyle = top;
    ctx.fillRect(0, 0, CONFIG.WIDTH, 130);

    const bottom = ctx.createLinearGradient(0, CONFIG.HEIGHT, 0, CONFIG.HEIGHT - 150);
    bottom.addColorStop(0, 'rgba(4,7,12,0.85)');
    bottom.addColorStop(1, 'rgba(4,7,12,0)');
    ctx.fillStyle = bottom;
    ctx.fillRect(0, CONFIG.HEIGHT - 150, CONFIG.WIDTH, 150);

    // _levels left the baseline set to 'middle' for its numbers.
    // Leaving it that way shifts every line of writing up by half its
    // own height — a small thing that makes a screen look sloppy.
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(230,255,240,0.9)';
    ctx.font = 'bold 34px system-ui, sans-serif';
    ctx.fillText('THE CRYSTAL PLANET', CONFIG.WIDTH / 2, 58);

    const done = Planet.levels.filter(l => l.done && l.number > 0).length;
    ctx.fillStyle = 'rgba(190,220,205,0.75)';
    ctx.font = '20px system-ui, sans-serif';
    // "of 14", not 15: the teaching level isn't a number, so it isn't
    // counted in the score either. Finishing school isn't beating a level.
    ctx.fillText(`${done} of ${Planet.levels.length - 1} levels finished`,
                 CONFIG.WIDTH / 2, 90);

    // What's under your finger
    const i = Planet.selected;
    if (i >= 0) {
      const l = Planet.levels[i];
      const open = Planet.isUnlocked(i);
      ctx.font = 'bold 30px system-ui, sans-serif';
      ctx.fillStyle = Planet.isPlayable(i) ? '#ffdb8a' : '#7d8d86';
      // The teaching level gets no number in front of its name
      const tag = l.number === 0 ? '' : `${l.number}. `;
      ctx.fillText(open ? `${tag}${l.name}` : `${tag}Locked`,
                   CONFIG.WIDTH / 2, CONFIG.HEIGHT - 78);

      ctx.font = '20px system-ui, sans-serif';
      ctx.fillStyle = 'rgba(210,235,222,0.7)';
      ctx.fillText(
        !open ? 'finish the one before it first'
              : l.key ? 'tap to play' : 'not built yet',
        CONFIG.WIDTH / 2, CONFIG.HEIGHT - 46);
    } else {
      ctx.font = '20px system-ui, sans-serif';
      ctx.fillStyle = 'rgba(190,220,205,0.55)';
      ctx.fillText('drag to turn it  ·  scroll or pinch to zoom  ·  tap a level',
                   CONFIG.WIDTH / 2, CONFIG.HEIGHT - 46);
    }
  },
};
