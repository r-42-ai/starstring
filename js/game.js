/* ============================================================
   STARSTRING — GAME
   ============================================================

   Starts everything up, keeps the clock, and draws the world.

   THE FIXED TIMESTEP
   ------------------
   Screens refresh at different speeds — 60 times a second on some
   devices, 120 on others. If we just moved the hero "a bit" each
   time the screen refreshed, the game would literally run twice as
   fast on a good tablet.

   So instead: we collect up the time that has passed, and do exactly
   as many 1/60th-of-a-second thinking steps as fit inside it. The
   game always thinks in identical little chunks, no matter what
   device it's on.

   Then when we draw, we blend between the last step and the next
   one, so it still looks perfectly smooth.
   ============================================================ */

const Game = {

  canvas: null,
  ctx: null,
  player: null,

  accumulator: 0,
  lastTime: 0,
  clock: 0,          // seconds since the game started, for pulsing things
  completed: 0,      // seconds left of the "you did it" celebration
  timeLeft: 0,       // seconds left to finish the level
  outOfTime: 0,      // seconds left of the "time's up" message

  /*
     WHICH SCREEN ARE WE ON?

       'title'   the name of the game, and Blob
       'planet'  the map: the whole world turning in space
       'playing' inside a level

     One loop runs both. Everything below asks this first, and that
     one question is what keeps two completely different screens from
     tangling with each other.
  */
  mode: 'title',
  fps: 0,
  _fpsTimer: 0,
  _frames: 0,

  init() {
    this.canvas = document.getElementById('game');
    this.ctx = this.canvas.getContext('2d');

    // The canvas is always exactly the game's size.
    // The CSS then stretches the whole thing to fit the screen.
    this.canvas.width = CONFIG.WIDTH;
    this.canvas.height = CONFIG.HEIGHT;

    Assets.loadAll();
    Input.init(this.canvas);
    Planet.init();

    Title.init();
    this.mode = 'title';

    window.addEventListener('resize', () => this.resize());
    window.addEventListener('orientationchange', () => setTimeout(() => this.resize(), 200));
    this.resize();

    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  },

  // Work out how big to draw the canvas so it fills as much of the
  // screen as possible WITHOUT stretching it out of shape.
  // The leftover space becomes black bars. That's letterboxing.
  resize() {
    const scale = Math.min(
      window.innerWidth / CONFIG.WIDTH,
      window.innerHeight / CONFIG.HEIGHT
    );
    this.canvas.style.width  = Math.floor(CONFIG.WIDTH * scale) + 'px';
    this.canvas.style.height = Math.floor(CONFIG.HEIGHT * scale) + 'px';
  },

  // Leave the map and drop into a level.
  startLevel(key) {
    Level.load(key);
    Terrain.build();               // repaint all the rock for this level
    this.player = new Player();
    Camera.init(this.player);
    this.timeLeft = Level.timeLimit;
    this.completed = 0;
    this.outOfTime = 0;
    this.currentKey = key;
    this.mode = 'playing';
  },

  // Finished it — back out to the map, with this level ticked off.
  returnToPlanet(finished) {
    if (finished) Planet.complete(this.currentKey);
    this.mode = 'planet';
  },

  loop(now) {
    requestAnimationFrame((t) => this.loop(t));

    let elapsed = (now - this.lastTime) / 1000;
    this.lastTime = now;

    // If the game was paused (you switched apps), don't try to
    // catch up on ten seconds of physics all at once.
    const maxElapsed = CONFIG.STEP * CONFIG.MAX_STEPS_PER_FRAME;
    if (elapsed > maxElapsed) elapsed = maxElapsed;

    this.accumulator += elapsed;
    this.clock += elapsed;

    // ---- THE TITLE SCREEN ----
    if (this.mode === 'title') {
      Input.update();
      Title.update(elapsed);
      this.accumulator = 0;
      Title.draw(this.ctx);
      this._countFps(elapsed);
      return;
    }

    // ---- THE MAP ----
    if (this.mode === 'planet') {
      Input.update();
      if (Input.wheel) {
        Planet.setZoom(Planet.zoom * Math.pow(CONFIG.PLANET.ZOOM_STEP, -Input.wheel));
        Input.wheel = 0;
      }
      Planet.update(elapsed);
      this.accumulator = 0;
      PlanetDraw.draw(this.ctx, this.clock);
      this._countFps(elapsed);
      return;
    }

    // ---- INSIDE A LEVEL ----
    // Do as many identical thinking steps as fit in the time that passed
    while (this.accumulator >= CONFIG.STEP) {
      this.accumulator -= CONFIG.STEP;

      // The level can END in a step — you got into the portal and the
      // celebration finished. When that happens we're on the map now,
      // and there is no level left to keep stepping or to draw.
      if (this.step()) return;
    }

    // How far are we between one step and the next? (0 to 1)
    const alpha = this.accumulator / CONFIG.STEP;

    this.draw(alpha);
    this._countFps(elapsed);
  },


  /*
     ONE step of a level: exactly 1/60 of a second of thinking.

     This used to live in the middle of loop(), tangled up with frame
     timing and drawing, which meant nothing could test it — you can't
     ask requestAnimationFrame to play a level for you. Pulled out on
     its own it's a plain function: call it, and time moves forward.

     Returns TRUE if the level is over and we've gone back to the map.
  */
  step() {
    {
      // The reel-in / reel-out buttons only exist while swinging
      Input.swinging = Grapple.attached;
      Input.update();

      // Once the portal has hold of you, you stop steering. Being
      // able to run about while you're being sucked in would break
      // the moment completely.
      if (!this.completed) this.player.update(CONFIG.STEP);

      if (this.player.justRespawned) {
        Camera.snap(this.player);
        this.player.justRespawned = false;
      } else {
        Camera.update(CONFIG.STEP, this.player);
      }

      /*
         THE CLOCK.

         It only ticks while you're actually playing — not during the
         celebration at the end, and not while the "time's up" message
         is on screen. A clock that keeps running through a cutscene
         is a bug players never forgive.
      */
      if (Level.timeLimit && !this.completed && !this.outOfTime) {
        const flagsBefore = Level.flags.filter(f => f.lit).length;
        this.timeLeft -= CONFIG.STEP;

        // Reaching a flag winds the clock right back up. That's the
        // reward for getting somewhere, and it's what stops a long
        // level being one impossible sprint.
        if (Level.flags.filter(f => f.lit).length > flagsBefore) {
          this.timeLeft = Level.timeLimit;
        }

        if (this.timeLeft <= 0) {
          this.timeLeft = 0;
          this.outOfTime = 2.0;
        }
      }

      if (this.outOfTime > 0) {
        this.outOfTime -= CONFIG.STEP;
        if (this.outOfTime <= 0) {
          this.outOfTime = 0;

          // Running out of time sends you right back to the START —
          // flags and all. Falling down a hole only costs you the last
          // stretch; the clock costs you the whole level. Two different
          // punishments for two different mistakes, and the clock
          // wouldn't be frightening if a flag saved you from it.
          Level.restart();
          this.player.respawn();
          Camera.snap(this.player);
          this.timeLeft = Level.timeLimit;
        }
      }

      // Got into the portal?
      if (!this.completed && !this.outOfTime && Level.touchingPortal(this.player)) {
        this.completed = CONFIG.PORTAL.COMPLETE_PAUSE;
      }
      if (this.completed > 0) {
        this.completed -= CONFIG.STEP;
        if (this.completed <= 0) {
          this.completed = 0;
          this.returnToPlanet(true);   // out to the map, level ticked off
          return true;
        }
      }
    }
    return false;
  },


  /* ---------- DRAWING ---------- */

  draw(alpha) {
    const ctx = this.ctx;

    // The cavern behind you. Drawn WITHOUT the camera, because each
    // layer slides at its own slower speed to fake distance.
    Background.draw(ctx, this.clock);

    // --- everything from here on lives in the world ---
    ctx.save();
    Camera.apply(ctx);
    this._drawLightShafts(ctx);
    this._drawWorld(ctx);
    this._drawRevealedIllusions(ctx);
    this._drawHints(ctx);
    this._drawFlags(ctx);
    this._drawPortal(ctx);
    this._drawAnchors(ctx);
    // The rope is drawn behind her, so her hands are in front of it
    Grapple.draw(ctx, this.player, alpha);
    if (this.completed > 0) this._drawEnteringPortal(ctx);
    else this.player.draw(ctx, alpha);
    this._drawWorldDebug(ctx);
    ctx.restore();

    // --- and everything from here on is stuck to the screen ---
    this._drawButtons(ctx);
    this._drawClock(ctx);
    this._drawComplete(ctx);
    this._drawOutOfTime(ctx);
    this._drawDebug(ctx);
  },


  /*
     Sunlight falling through the holes in the cavern roof.

     Drawn BEFORE the rock, so the rock covers the bottom of the beam
     and it looks like light landing on the ground rather than a
     glowing sheet floating in front of everything.

     Each beam is a long thin four-cornered shape that gets wider and
     fainter as it falls, plus a slow breathing brightness so it feels
     alive rather than painted on.
  */
  _drawLightShafts(ctx) {
    if (!Level.lightShafts.length) return;
    const T = CONFIG.TILE;
    const height = Level.pixelHeight();

    ctx.save();
    for (let i = 0; i < Level.lightShafts.length; i++) {
      const s = Level.lightShafts[i];
      const topX = s.col * T;
      const topW = s.width * T;
      const drift = (s.tilt ?? 1) * T;

      // Beams get wider towards the floor, like real light spreading
      const botX = topX + drift;
      const botW = topW * 1.9;

      const breathe = 0.82 + Math.sin(this.clock * 0.5 + i * 2.1) * 0.18;

      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0,    'rgba(255,233,168,0.24)');
      grad.addColorStop(0.55, 'rgba(255,233,168,0.10)');
      grad.addColorStop(1,    'rgba(255,233,168,0.00)');

      ctx.globalAlpha = breathe;
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(topX, 0);
      ctx.lineTo(topX + topW, 0);
      ctx.lineTo(botX + botW, height);
      ctx.lineTo(botX, height);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  },

  // The rock was all drawn once when the level loaded, so this is a
  // single stamp. Only the glitter is still worked out every frame,
  // because that's the bit that has to move.
  _drawWorld(ctx) {
    Terrain.draw(ctx);

    const v = Camera.visibleTiles();
    for (let row = v.rowStart; row <= v.rowEnd; row++) {
      for (let col = v.colStart; col <= v.colEnd; col++) {
        if (!Level.isSolidAt(col, row)) continue;
        this._drawSparkles(ctx, col, row, col * CONFIG.TILE, row * CONFIG.TILE);
      }
    }
  },

  // THE GLITTER. Each sparkle sits at a fixed spot on its block and
  // twinkles on a timer of its own, so the whole cave shimmers
  // instead of blinking on and off together.
  _drawSparkles(ctx, col, row, x, y) {
    const S = CONFIG.SPARKLE;
    const T = CONFIG.TILE;

    for (let i = 0; i < S.PER_TILE; i++) {
      const phase = this._noise(col, row, i + 31) * Math.PI * 2;

      // sin() goes smoothly up and down; raising it to a power turns
      // that gentle wave into a sharp little glint.
      let t = Math.sin(this.clock * S.SPEED + phase);
      if (t <= 0) continue;
      t = Math.pow(t, S.SHARPNESS);
      if (t < 0.02) continue;

      const sx = x + this._noise(col, row, i + 3) * T;
      const sy = y + this._noise(col, row, i + 7) * T;
      const size = S.SIZE * t;

      ctx.fillStyle = CONFIG.COLORS.SPARKLE;

      // Two crossed slivers make the four points of a star. They're
      // drawn faint, because a hard cross just looks like a plus sign.
      ctx.globalAlpha = t * S.BRIGHTNESS * 0.5;
      ctx.fillRect(sx - size * 2.4, sy - size * 0.18, size * 4.8, size * 0.36);
      ctx.fillRect(sx - size * 0.18, sy - size * 2.4, size * 0.36, size * 4.8);

      // ...and a small bright core in the middle. That's the bit your
      // eye actually reads as a glint of light rather than a shape.
      ctx.globalAlpha = t * S.BRIGHTNESS;
      ctx.beginPath();
      ctx.arc(sx, sy, size * 0.62, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 1;
    }
  },

  // A repeatable pseudo-random number between 0 and 1 for a given
  // block and slot. Same inputs always give the same answer, which is
  // why the cave doesn't shimmer differently every time you look away.
  _noise(col, row, i) {
    const n = Math.sin(col * 127.1 + row * 311.7 + i * 74.7) * 43758.5453;
    return n - Math.floor(n);
  },

  /*
     Recolouring the ring.

     The drawing we have is cyan. Painting a coloured blob over the
     middle of it doesn't work — you end up with a cyan ring that has
     something red inside it, which is not the same thing at all.

     So we repaint the picture itself. Draw it onto a spare canvas,
     then paint over it with 'source-atop', which only touches the
     pixels that are already there. The ring turns red; the empty
     space around it stays empty.

     Each colour is only made once and then kept, because doing this
     sixty times a second for every ring on screen would be daft.
  */
  _tintedRing(color) {
    const img = Assets.get('anchor');
    if (color === CONFIG.COLORS.ANCHOR) return img;

    if (!this._ringTints) this._ringTints = {};
    if (this._ringTints[color]) return this._ringTints[color];

    const c = document.createElement('canvas');
    c.width = img.width;
    c.height = img.height;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    g.globalCompositeOperation = 'source-atop';   // only where there's already paint
    g.globalAlpha = 0.85;
    g.fillStyle = color;
    g.fillRect(0, 0, c.width, c.height);

    this._ringTints[color] = c;
    return c;
  },

  /*
     Illusions you've already walked through.

     Before you find one, nothing is drawn here at all — it's painted
     into the rock exactly like every other block, and it has to be,
     or you'd spot it.

     Once you've been through it, a soft shimmer appears over it. Not
     so it becomes see-through, just so you can tell it's a way in.
     Hiding it again afterwards would only be annoying: the trick is
     fun once, and tedious every time after that.
  */
  _drawRevealedIllusions(ctx) {
    const T = CONFIG.TILE;
    for (const g of Level.illusions) {
      if (!g.revealed) continue;
      const x = g.col * T, y = g.row * T;
      const shimmer = 0.22 + Math.sin(this.clock * 2.2 + g.col * 0.7 + g.row) * 0.12;

      ctx.save();
      ctx.globalAlpha = shimmer;
      ctx.fillStyle = CONFIG.COLORS.PORTAL_A;
      ctx.fillRect(x, y, T, T);
      ctx.globalAlpha = shimmer * 1.6;
      ctx.strokeStyle = CONFIG.COLORS.PORTAL_CORE;
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 3, y + 3, T - 6, T - 6);
      ctx.restore();
    }
  },

  /*
     HINTS — how the game teaches you.

     Not a page of instructions before you start. Words that appear in
     the world, right where the thing they're about is, and only when
     you get near them.

     Nobody reads instructions. Everybody reads one short line floating
     over the exact spot where they're stuck.

     They fade in as you approach and fade out as you leave, and once
     you've seen one it stays a little visible — so if you come back
     round you get a reminder without being shouted at again.
  */
  _drawHints(ctx) {
    if (!Level.hints.length) return;
    const px = this.player.x + this.player.w / 2;
    const py = this.player.y + this.player.h / 2;

    for (const h of Level.hints) {
      const hx = h.col * CONFIG.TILE + CONFIG.TILE / 2;
      const hy = h.row * CONFIG.TILE + CONFIG.TILE / 2;
      const d = Math.hypot(hx - px, hy - py);

      // Full strength when you're near, fading out by twice that
      const near = Math.max(0, Math.min(1, (CONFIG.HINT.FADE_AT - d) / CONFIG.HINT.FADE_AT));
      if (near > 0.05) h.seen = 1;
      const alpha = Math.max(near, h.seen * 0.22);
      if (alpha < 0.03) continue;

      const bob = Math.sin(this.clock * 2 + h.col) * 4;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 27px system-ui, sans-serif';

      const w = ctx.measureText(h.text).width + 46;
      ctx.fillStyle = 'rgba(4,16,12,0.72)';
      ctx.beginPath();
      ctx.roundRect(hx - w/2, hy - 24 + bob, w, 48, 24);
      ctx.fill();
      ctx.strokeStyle = `rgba(255,219,138,${0.5 * alpha})`;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#ffedc4';
      ctx.fillText(h.text, hx, hy + 1 + bob);
      ctx.restore();
    }
  },

  /*
     THE FLAGS.

     Dull grey when you haven't reached one yet, bright gold and
     WAVING once you have. The waving matters: it's the difference
     between "there's a flag there" and "you've got that one, you're
     safe now". You should be able to tell at a glance from across
     the screen, because that's when you need to know.
  */
  _drawFlags(ctx) {
    for (const f of Level.flags) {
      const x = f.x, y = f.y;
      const poleTop = y - 40, poleBottom = y + 30;

      // the pole
      ctx.strokeStyle = f.lit ? '#e8d9a8' : '#5a6166';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x, poleTop);
      ctx.lineTo(x, poleBottom);
      ctx.stroke();

      // the cloth — a lit flag ripples, an unlit one hangs limp
      const wave = f.lit ? Math.sin(this.clock * 4 + f.col) * 7 : 0;
      const droop = f.lit ? 0 : 8;
      ctx.fillStyle = f.lit ? CONFIG.COLORS.SOLID_TOP : '#454b4e';
      ctx.beginPath();
      ctx.moveTo(x + 2, poleTop);
      ctx.quadraticCurveTo(x + 30, poleTop + 6 + wave, x + 46, poleTop + 14 + droop);
      ctx.quadraticCurveTo(x + 28, poleTop + 22 - wave, x + 2, poleTop + 30);
      ctx.closePath();
      ctx.fill();

      if (f.lit) {
        ctx.globalAlpha = 0.35 + Math.sin(this.clock * 3 + f.col) * 0.15;
        const glow = ctx.createRadialGradient(x, y, 4, x, y, 70);
        glow.addColorStop(0, 'rgba(255,219,138,0.6)');
        glow.addColorStop(1, 'rgba(255,219,138,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(x - 70, y - 70, 140, 140);
        ctx.globalAlpha = 1;
      }
    }
  },

  /*
     THE PORTAL — the way out.

     It's built from a few rings spinning at different speeds and in
     opposite directions. That's the whole trick to making something
     look like a swirling hole rather than a drawn circle: nothing in
     it moves at the same rate as anything else, so your eye never
     finds a pattern to lock onto.
  */
  _drawPortal(ctx) {
    const P = Level.portal;
    if (!P) return;
    const G = CONFIG.PORTAL;
    const C = CONFIG.COLORS;

    const breathe = 1 + Math.sin(this.clock * G.PULSE) * 0.07;

    ctx.save();
    ctx.translate(P.x, P.y);

    // A soft halo, so it glows into the cave around it
    const halo = ctx.createRadialGradient(0, 0, G.RADIUS * 0.3, 0, 0, G.RADIUS * 2.4);
    halo.addColorStop(0, 'rgba(150,220,255,0.42)');
    halo.addColorStop(1, 'rgba(150,220,255,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(-G.RADIUS * 2.4, -G.RADIUS * 2.4, G.RADIUS * 4.8, G.RADIUS * 4.8);

    // The rings, each turning at its own speed, alternating direction
    for (let i = 0; i < G.RING_COUNT; i++) {
      const t = i / G.RING_COUNT;
      const dir = (i % 2 === 0) ? 1 : -1;
      const r = G.RADIUS * breathe * (1 - t * 0.55);

      ctx.save();
      ctx.rotate(this.clock * G.SPIN * dir * (0.6 + t));
      ctx.strokeStyle = (i % 2 === 0) ? C.PORTAL_A : C.PORTAL_B;
      ctx.lineWidth = 5 - t * 2;
      ctx.globalAlpha = 0.85 - t * 0.25;
      ctx.beginPath();
      // Not a full circle — a gap in each ring is what makes it spin
      // visibly. A complete circle turning looks completely still.
      ctx.arc(0, 0, r, 0.5, Math.PI * 1.75);
      ctx.stroke();
      ctx.restore();
    }

    // The bright middle
    ctx.globalAlpha = 0.9;
    const core = ctx.createRadialGradient(0, 0, 0, 0, 0, G.RADIUS * 0.42);
    core.addColorStop(0, C.PORTAL_CORE);
    core.addColorStop(1, 'rgba(122,245,255,0)');
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(0, 0, G.RADIUS * 0.42, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  },

  /*
     THE CLOCK, top middle.

     Three states, and they escalate: calm white, then red when you're
     running low, then red AND beating when you're nearly out. The
     beating matters — by that point you're looking at the hero, not
     at the clock, and something pulsing in the corner of your eye is
     the only way you'll notice.
  */
  _drawClock(ctx) {
    if (!Level.timeLimit) return;

    const T = CONFIG.TIMER;
    const secs = Math.max(0, this.timeLeft);
    const low = secs <= T.WARN_AT;
    const panic = secs <= T.PANIC_AT;

    const beat = panic ? 1 + Math.abs(Math.sin(this.clock * T.FLASH_SPEED)) * 0.16 : 1;

    const mins = Math.floor(secs / 60);
    const rest = Math.floor(secs % 60);
    const text = mins + ':' + String(rest).padStart(2, '0');

    ctx.save();
    ctx.translate(CONFIG.WIDTH / 2, 54);
    ctx.scale(beat, beat);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 46px system-ui, sans-serif';

    // a dark backing, so it stays readable over a bright cave
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = '#04100c';
    ctx.beginPath();
    ctx.roundRect(-86, -30, 172, 60, 14);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = low ? '#ff6b7d' : '#eaf6ff';
    ctx.fillText(text, 0, 2);
    ctx.restore();
  },

  _drawOutOfTime(ctx) {
    if (this.outOfTime <= 0) return;
    const fade = Math.min(1, this.outOfTime / 0.4);
    ctx.save();
    ctx.globalAlpha = 0.6 * fade;
    ctx.fillStyle = '#1a0409';
    ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    ctx.globalAlpha = fade;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff6b7d';
    ctx.font = 'bold 70px system-ui, sans-serif';
    ctx.fillText("TIME'S UP", CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2);
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = '26px system-ui, sans-serif';
    ctx.fillText('back to the very beginning', CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 + 48);
    ctx.restore();
  },

  /*
     DISAPPEARING INTO THE PORTAL.

     Walking through a portal and out the other side isn't an ending —
     it's a doorway. Being pulled IN is an ending.

     So for the first part of the celebration she spirals inwards,
     shrinking and spinning, until there's nothing left. Three things
     at once (moving in, getting smaller, turning) is what makes it
     read as being *drawn* in rather than just fading out.
  */
  _drawEnteringPortal(ctx) {
    const P = Level.portal;
    if (!P) return;

    const total = CONFIG.PORTAL.COMPLETE_PAUSE;
    const suck = CONFIG.PORTAL.SUCK_TIME;

    // 0 at the moment you touch it, 1 when you've completely gone
    let t = (total - this.completed) / suck;
    t = Math.max(0, Math.min(1, t));

    // Slow at first, then quick — like something taking hold of you
    const ease = t * t * t;
    if (ease >= 0.999) return;                 // gone

    const px = this.player.x + this.player.w / 2;
    const py = this.player.y + this.player.h / 2;
    const x = px + (P.x - px) * ease;
    const y = py + (P.y - py) * ease;

    const height = this.player.h * CONFIG.SPRITE.HERO_SCALE * (1 - ease);
    const spin = ease * 9;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(spin);
    ctx.globalAlpha = 1 - ease * 0.35;

    if (Assets.has('hero_idle_1')) {
      const img = Assets.get('hero_idle_1');
      const w = height * (img.width / img.height);
      ctx.drawImage(img, -w / 2, -height / 2, w, height);
    } else {
      ctx.fillStyle = CONFIG.COLORS.PLAYER;
      ctx.fillRect(-this.player.w / 2 * (1 - ease), -height / 2,
                   this.player.w * (1 - ease), height);
    }
    ctx.restore();

    // The portal flares as it swallows you
    ctx.save();
    ctx.globalAlpha = Math.sin(t * Math.PI) * 0.8;
    const flare = ctx.createRadialGradient(P.x, P.y, 2, P.x, P.y,
                                           CONFIG.PORTAL.RADIUS * 2.6);
    flare.addColorStop(0, 'rgba(255,255,255,0.9)');
    flare.addColorStop(1, 'rgba(122,245,255,0)');
    ctx.fillStyle = flare;
    ctx.beginPath();
    ctx.arc(P.x, P.y, CONFIG.PORTAL.RADIUS * 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  },

  _drawComplete(ctx) {
    if (this.completed <= 0) return;
    // Don't say "you made it" until she's actually gone in
    const shown = CONFIG.PORTAL.COMPLETE_PAUSE - this.completed - CONFIG.PORTAL.SUCK_TIME;
    if (shown < 0) return;
    const fade = Math.min(1, Math.min(this.completed / 0.4, shown / 0.25));

    ctx.save();
    ctx.globalAlpha = 0.55 * fade;
    ctx.fillStyle = '#06131b';
    ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);

    ctx.globalAlpha = fade;
    ctx.textAlign = 'center';
    ctx.fillStyle = CONFIG.COLORS.PORTAL_A;
    ctx.font = 'bold 74px system-ui, sans-serif';
    ctx.fillText('YOU MADE IT', CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 - 6);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.font = '28px system-ui, sans-serif';
    ctx.fillText(Level.name || '', CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 + 46);
    ctx.restore();
  },

  // The grapple rings. Three looks: dark (recharging), lit (usable),
  // and pulsing (usable AND close enough to grab right now).
  _drawAnchors(ctx) {
    const G = CONFIG.GRAPPLE;
    const size = G.ANCHOR_SIZE;
    const reachable = Grapple.anchorInReach(this.player);

    for (const a of Level.anchors) {
      const charging = a.cooldown > 0;
      const inReach = (a === reachable);
      const held = Grapple.attached && Grapple.anchor === a;

      // A ring you can grab BLINKS — the whole thing gets brighter and
      // bigger and back again, so it's impossible to miss out of the
      // corner of your eye while you're concentrating on jumping.
      //
      // And when the rope is nearly worn out, the ring you're hanging
      // from blinks RED, fast. That's your warning to let go.
      const breaking = held && Grapple.isTiring();
      const speed = breaking ? G.PULSE_SPEED * 2.6 : G.PULSE_SPEED;
      const blink = (inReach || held) ? (Math.sin(this.clock * speed) + 1) / 2 : 0;
      const s = size * (1 + blink * (breaking ? 0.26 : 0.16));

      const tint = Level.ringType(a).color;

      ctx.save();
      ctx.globalAlpha = charging ? 0.22 : 0.78 + blink * 0.22;

      if (Assets.has('anchor')) {
        // The WHOLE ring is its colour, not just a blob in the middle.
        const img = this._tintedRing(tint);
        const w = s * (img.width / img.height);

        // A halo behind it, brightest at the top of each blink
        if (blink > 0.01) {
          ctx.save();
          ctx.globalAlpha = blink * 0.5;
          const hw = w * 1.5, hs = s * 1.5;
          ctx.drawImage(img, a.x - hw / 2, a.y - hs / 2, hw, hs);
          ctx.restore();
        }
        ctx.drawImage(img, a.x - w / 2, a.y - s / 2, w, s);
      } else {
        ctx.strokeStyle = charging ? '#4a3a63' : tint;
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.ellipse(a.x, a.y, s * 0.3, s * 0.44, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // While recharging, a little bar fills up so you know how long
      if (charging) {
        const left = 1 - a.cooldown / G.ANCHOR_COOLDOWN;
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = '#4a3a63';
        ctx.fillRect(a.x - 20, a.y + size * 0.5, 40, 4);
        ctx.fillStyle = tint;
        ctx.fillRect(a.x - 20, a.y + size * 0.5, 40 * left, 4);
      }

      ctx.restore();
    }
  },

  _drawButtons(ctx) {
    const B = CONFIG.BUTTONS;

    for (const btn of Input.getButtons()) {
      // The rope buttons are hidden until you're actually on the rope
      if (btn.onlyWhileSwinging && !Grapple.attached) continue;

      const pressed = Input.isButtonTouched(btn.id);
      ctx.globalAlpha = 1;

      // The grapple button glows when there's actually something
      // in reach to grab, so you know before you press.
      if (btn.id === 'grapple' && !Grapple.attached && !Grapple.anchorInReach(this.player)) {
        ctx.globalAlpha = 0.45;
      }

      // Use the real picture if it exists, otherwise draw a circle
      if (Assets.has('btn_' + btn.id)) {
        const img = Assets.get('btn_' + btn.id);
        // Pressed buttons get bigger and brighter, so there's some
        // feedback under your thumb — your thumb is covering the button,
        // so the change has to be visible around the edges.
        const scale = B.IMAGE_SCALE * (pressed ? 1.08 : 1);
        const size = B.RADIUS * 2 * scale;
        ctx.globalAlpha *= pressed ? 1 : 0.8;
        ctx.drawImage(img, btn.x - size / 2, btn.y - size / 2, size, size);
      } else {
        ctx.beginPath();
        ctx.arc(btn.x, btn.y, B.RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = pressed ? CONFIG.COLORS.BUTTON_ACTIVE : CONFIG.COLORS.BUTTON;
        ctx.fill();
        ctx.strokeStyle = CONFIG.COLORS.BUTTON_EDGE;
        ctx.lineWidth = 3;
        ctx.stroke();

        this._drawButtonIcon(ctx, btn);
      }

      ctx.globalAlpha = 1;
    }
  },

  _drawButtonIcon(ctx, btn) {
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 5;
    const s = 17;

    ctx.beginPath();
    if (btn.id === 'left') {
      ctx.moveTo(btn.x + s * 0.5, btn.y - s);
      ctx.lineTo(btn.x - s * 0.6, btn.y);
      ctx.lineTo(btn.x + s * 0.5, btn.y + s);
      ctx.closePath();
      ctx.fill();
    } else if (btn.id === 'right') {
      ctx.moveTo(btn.x - s * 0.5, btn.y - s);
      ctx.lineTo(btn.x + s * 0.6, btn.y);
      ctx.lineTo(btn.x - s * 0.5, btn.y + s);
      ctx.closePath();
      ctx.fill();
    } else if (btn.id === 'jump') {
      ctx.moveTo(btn.x - s, btn.y + s * 0.5);
      ctx.lineTo(btn.x, btn.y - s * 0.6);
      ctx.lineTo(btn.x + s, btn.y + s * 0.5);
      ctx.closePath();
      ctx.fill();
    } else if (btn.id === 'grapple') {
      // A little hook shape
      ctx.arc(btn.x, btn.y - 2, s * 0.7, Math.PI * 0.15, Math.PI * 1.5);
      ctx.stroke();
    } else if (btn.id === 'reelIn') {
      // arrow up, with a short rope under it
      ctx.moveTo(btn.x - s * 0.7, btn.y);
      ctx.lineTo(btn.x, btn.y - s * 0.8);
      ctx.lineTo(btn.x + s * 0.7, btn.y);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(btn.x, btn.y + s * 0.1);
      ctx.lineTo(btn.x, btn.y + s * 0.9);
      ctx.stroke();
    } else if (btn.id === 'reelOut') {
      ctx.moveTo(btn.x - s * 0.7, btn.y);
      ctx.lineTo(btn.x, btn.y + s * 0.8);
      ctx.lineTo(btn.x + s * 0.7, btn.y);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(btn.x, btn.y - s * 0.1);
      ctx.lineTo(btn.x, btn.y - s * 0.9);
      ctx.stroke();
    }
  },

  // Debug drawing that belongs IN the world, so it moves with the camera
  _drawWorldDebug(ctx) {
    if (!CONFIG.DEBUG.SHOW_HITBOXES) return;
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.player.x, this.player.y, this.player.w, this.player.h);
  },

  // Debug drawing stuck to the screen
  _drawDebug(ctx) {
    if (!CONFIG.DEBUG.SHOW_FPS) return;
    ctx.fillStyle = CONFIG.COLORS.TEXT;
    ctx.font = '20px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(this.fps + ' fps', 20, 32);
    ctx.fillText(this.player.grounded ? 'on the ground' : 'in the air', 20, 58);
  },

  _countFps(elapsed) {
    this._frames++;
    this._fpsTimer += elapsed;
    if (this._fpsTimer >= 0.5) {
      this.fps = Math.round(this._frames / this._fpsTimer);
      this._frames = 0;
      this._fpsTimer = 0;
    }
  },
};

window.addEventListener('load', () => Game.init());
