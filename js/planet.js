/* ============================================================
   STARSTRING — THE PLANET
   ============================================================

   The map screen. Finish a level and you come out here: the whole
   Crystal Planet hanging in space, with fifteen levels marked on it
   and a path winding between them.

   Drag it to turn it. Scroll or pinch to zoom. Tap a level to play it.

   ------------------------------------------------------------
   HOW A FLAT SCREEN DRAWS A ROUND PLANET
   ------------------------------------------------------------

   Every level sits at a spot on a ball, given the way places on Earth
   are: how far up or down (latitude) and how far around (longitude).

   Turning those two numbers into a point in space is three lines:

       x = cos(up/down) * sin(around)
       y = sin(up/down)
       z = cos(up/down) * cos(around)

   That gives a point on a ball of size 1. Then we spin the whole ball
   by however far you've dragged, and to get it onto the screen we
   simply THROW THE z AWAY and draw x and y.

   That sounds far too easy to work, and it is nearly the whole trick.
   The one extra thing: z tells us whether a point is on the near side
   of the planet or the far side. Positive is facing us. Negative is
   round the back — so we hide it. That single check is what makes a
   flat circle read as a sphere you're looking at.
   ============================================================ */

const Planet = {

  /*
     Fifteen levels, wound around the planet in a spiral so the path
     between them travels across the whole surface instead of sitting
     in one place. Only the first one is built so far; the rest are
     waiting.
  */
  levels: [],

  yaw: 0.6,          // how far it's turned left/right, in radians
  pitch: -0.25,      // and up/down
  zoom: 1,
  spin: 0.06,        // it turns slowly on its own when you leave it alone

  // Dragging
  _dragging: false,
  _lastX: 0,
  _lastY: 0,
  _dragged: 0,       // how far this drag has moved, to tell drags from taps
  _pinchDist: 0,

  selected: 0,       // which level the finger is over
  lastPlayed: 0,     // where you're standing on the map

  init() {
    this.levels = [];
    for (let i = 0; i < CONFIG.PLANET.LEVEL_COUNT; i++) {
      const t = i / (CONFIG.PLANET.LEVEL_COUNT - 1);

      // A spiral: sweep from near the south pole up to near the north,
      // going round and round as it climbs.
      const lat = (-0.72 + t * 1.44);                 // radians, pole to pole
      const lon = t * Math.PI * 3.4;                  // nearly two full turns

      // The two levels that exist so far. Everything after them is
      // waiting to be built.
      const built = [
        { key: 'tutorial',        name: 'First Steps' },
        { key: 'crystal-caves-1', name: 'The Way Out' },
      ];

      this.levels.push({
        number: i + 1,
        lat, lon,
        key:  built[i] ? built[i].key  : null,
        name: built[i] ? built[i].name : 'Level ' + (i + 1),
        done: false,
      });
    }
    this.load();
  },

  // Level 1 is always open. After that, a level opens when the one
  // before it is finished.
  isUnlocked(i) {
    if (i === 0) return true;
    return this.levels[i - 1].done;
  },

  complete(key) {
    const lvl = this.levels.find(l => l.key === key);
    if (lvl) lvl.done = true;
    this.save();
  },


  /* ---------- REMEMBERING WHAT YOU'VE DONE ---------- */

  save() {
    try {
      localStorage.setItem('starstring.progress',
        JSON.stringify(this.levels.map(l => l.done)));
    } catch (e) {
      // Some browsers refuse to remember anything for a page opened
      // straight off the disk. Not a problem worth crashing over —
      // you just start fresh next time.
    }
  },

  load() {
    try {
      const saved = JSON.parse(localStorage.getItem('starstring.progress'));
      if (Array.isArray(saved)) {
        saved.forEach((done, i) => { if (this.levels[i]) this.levels[i].done = done; });
      }
    } catch (e) { /* nothing saved, or not allowed. Start fresh. */ }
  },


  /* ---------- TURNING A SPOT ON THE BALL INTO A SPOT ON SCREEN ---------- */

  project(lat, lon) {
    // Where it is on a ball of size 1
    return this.projectVec(
      Math.cos(lat) * Math.sin(lon),
      Math.sin(lat),
      Math.cos(lat) * Math.cos(lon)
    );
  },

  /*
     The same thing for ANY point in space, not just one sitting exactly
     on the ball. Crystal spikes stick out past the surface, so they
     need points further out than 1 — hence this taking a whole vector
     rather than just a latitude and longitude.

     It also hands back the turned x, y and z, because working out
     which way a flat crystal face is pointing needs them.
  */
  projectVec(x, y, z) {
    // Spin it left/right by however far you've dragged
    const cy = Math.cos(this.yaw), sy = Math.sin(this.yaw);
    const x2 =  x * cy + z * sy;
    const z2 = -x * sy + z * cy;

    // Then tip it up/down
    const cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
    const y2 = y * cp - z2 * sp;
    const z3 = y * sp + z2 * cp;

    const r = this.radius();
    return {
      x: CONFIG.WIDTH / 2 + x2 * r,
      y: CONFIG.HEIGHT / 2 - y2 * r,
      z: z3,                       // positive = facing us, negative = round the back
      depth: (z3 + 1) / 2,         // 0 at the far side, 1 at the near side
      vx: x2, vy: y2, vz: z3,      // the turned direction, for lighting
    };
  },

  radius() {
    return CONFIG.PLANET.RADIUS * this.zoom;
  },


  /* ---------- DRAGGING, PINCHING, TAPPING ---------- */

  update(dt) {
    const P = CONFIG.PLANET;
    const touches = [...Input._touches.values()];

    if (touches.length >= 2) {
      // TWO FINGERS = pinch to zoom
      const d = Math.hypot(touches[0].x - touches[1].x, touches[0].y - touches[1].y);
      if (this._pinchDist) this.setZoom(this.zoom * (d / this._pinchDist));
      this._pinchDist = d;
      this._dragging = false;

    } else if (touches.length === 1) {
      this._pinchDist = 0;
      const t = touches[0];
      if (!this._dragging) {
        this._dragging = true;
        this._dragged = 0;
      } else {
        const dx = t.x - this._lastX;
        const dy = t.y - this._lastY;
        this.yaw   -= dx * P.DRAG_SPEED;
        this.pitch -= dy * P.DRAG_SPEED;
        this._dragged += Math.abs(dx) + Math.abs(dy);
      }
      this._lastX = t.x;
      this._lastY = t.y;

    } else {
      this._dragging = false;
      this._pinchDist = 0;

      // Left alone, it turns gently by itself. A still planet looks
      // like a picture; a turning one looks like a place.
      this.yaw += this.spin * dt;
    }

    // A finished tap, noticed by the pointer events themselves rather
    // than by watching the list of fingers frame by frame. Fast taps
    // used to fall between two frames and never register at all.
    if (Input.tapped) {
      this._lastX = Input.tapped.x;
      this._lastY = Input.tapped.y;
      this.tap(Input.tapped.x, Input.tapped.y);
      Input.tapped = null;
    }

    // Don't let it tip so far you're looking at it upside down
    const limit = P.MAX_PITCH;
    this.pitch = Math.max(-limit, Math.min(limit, this.pitch));

    // Which level is the finger nearest to?
    this.selected = this.levelAt(this._lastX, this._lastY);
  },

  setZoom(z) {
    this.zoom = Math.max(CONFIG.PLANET.MIN_ZOOM, Math.min(CONFIG.PLANET.MAX_ZOOM, z));
  },

  // Which level marker is under this point? -1 for none.
  // Only levels on the NEAR side count — you can't tap through a planet.
  levelAt(sx, sy) {
    let best = -1, bestD = CONFIG.PLANET.TAP_RADIUS;
    for (let i = 0; i < this.levels.length; i++) {
      const p = this.project(this.levels[i].lat, this.levels[i].lon);
      if (p.z <= 0) continue;
      const d = Math.hypot(p.x - sx, p.y - sy);
      if (d < bestD) { bestD = d; best = i; }
    }
    return best;
  },

  tap(sx, sy) {
    const i = this.levelAt(sx, sy);
    if (i < 0) return;
    if (!this.isUnlocked(i)) return;      // still locked
    const lvl = this.levels[i];
    if (!lvl.key) return;                 // not built yet
    this.lastPlayed = i;                  // that's where you'll be standing
    Game.startLevel(lvl.key);
  },
};
