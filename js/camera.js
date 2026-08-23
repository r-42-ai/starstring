/* ============================================================
   STARSTRING — CAMERA
   ============================================================

   Decides which part of the world you can see.

   Nothing in the world actually moves when you walk. The hero moves,
   and the camera slides along to keep her in view — exactly like a
   real camera following an actor across a stage.

   Three ideas make a platformer camera feel good instead of horrible:

   1. IT LAGS BEHIND
      It doesn't lock onto the hero rigidly. It drifts towards where
      she is, always slightly behind. A camera welded to the character
      feels stiff and makes people feel sick.

   2. IT LOOKS AHEAD
      When you run right, the camera sits a little to the RIGHT of
      you, so you can see what's coming. Turn around and it drifts
      the other way. Without this you're always running blind into
      the edge of the screen.

   3. IT IGNORES JUMPING
      This is the big one. If the camera followed you up and down
      every time you jumped, the whole world would bounce and it
      would be genuinely unpleasant to play. So it remembers the
      height of the ground you last stood on and stays there — and
      only follows you downwards if you fall a long way.
   ============================================================ */

const Camera = {

  x: 0,
  y: 0,
  lookAhead: 0,      // how far ahead we're currently peeking
  groundY: 0,        // height of the last ground the hero stood on

  init(player) {
    this.groundY = player.y;
    this.lookAhead = 0;
    const t = this._target(player);
    this.x = t.x;
    this.y = t.y;
    this._clamp();
  },

  // Jump straight to the hero with no drifting — used when she
  // respawns, so the camera doesn't go sailing across the level.
  snap(player) {
    this.init(player);
  },

  update(dt, player) {
    const C = CONFIG.CAMERA;

    // Peek ahead in whichever direction she's actually moving.
    // This drifts rather than snapping, so turning round doesn't
    // make the screen lurch.
    const wanted = (Math.abs(player.vx) > 30 ? Math.sign(player.vx) : 0) * C.LOOK_AHEAD;
    this.lookAhead += (wanted - this.lookAhead) * this._smooth(C.LOOK_AHEAD_SPEED, dt);

    // Remember the last solid ground, so jumping doesn't move the view.
    //
    // BUT swinging is different from jumping. A jump is over in a
    // moment; a swing can carry you right up to the roof and stay
    // there. If the view refuses to follow, the ring you're hanging
    // from ends up off the top of the screen and you're playing blind.
    // So while the rope has hold of her, the camera follows properly.
    if (typeof Grapple !== 'undefined' && Grapple.attached) {
      this.groundY = player.y;
    } else if (player.grounded) {
      this.groundY = player.y;
    } else if (player.y > this.groundY + C.FALL_THRESHOLD) {
      // ...unless she's fallen a long way down, in which case we'd
      // better follow or she disappears off the bottom of the screen.
      this.groundY = player.y - C.FALL_THRESHOLD;
    }

    const t = this._target(player);
    this.x += (t.x - this.x) * this._smooth(C.FOLLOW_SPEED, dt);
    this.y += (t.y - this.y) * this._smooth(C.VERTICAL_SPEED, dt);

    this._clamp();
  },

  // Where the camera would ideally be, right now
  _target(player) {
    return {
      x: player.x + player.w / 2 + this.lookAhead - CONFIG.WIDTH / 2,
      y: this.groundY + player.h / 2 - CONFIG.HEIGHT * CONFIG.CAMERA.VERTICAL_BIAS,
    };
  },

  /*
     Smoothing that behaves the same at any frame rate.

     The obvious way to drift towards a target is:
         position += (target - position) * 0.1
     ...but that moves ten times as fast on a 120fps tablet as on a
     12fps one, so the camera would feel different on every device.

     Using exp() makes the movement depend on TIME rather than on how
     many frames happened, so it behaves identically everywhere.
  */
  _smooth(speed, dt) {
    return 1 - Math.exp(-speed * dt);
  },

  // Never show the black nothingness outside the level
  _clamp() {
    const maxX = Level.pixelWidth() - CONFIG.WIDTH;
    const maxY = Level.pixelHeight() - CONFIG.HEIGHT;

    // If the level is smaller than the screen, centre it instead
    this.x = maxX <= 0 ? maxX / 2 : Math.max(0, Math.min(maxX, this.x));
    this.y = maxY <= 0 ? maxY / 2 : Math.max(0, Math.min(maxY, this.y));
  },

  // Shift everything drawn after this by the camera position.
  // Always pair it with ctx.restore(), or the buttons end up
  // sliding around the world too.
  apply(ctx) {
    ctx.translate(-this.x, -this.y);
  },

  // Which blocks are actually on screen? Everything else can be
  // skipped. It makes no difference in a small level, but it's what
  // lets a huge one run just as fast.
  visibleTiles() {
    const T = CONFIG.TILE;
    return {
      colStart: Math.max(0, Math.floor(this.x / T)),
      colEnd:   Math.min(Level.cols - 1, Math.floor((this.x + CONFIG.WIDTH) / T)),
      rowStart: Math.max(0, Math.floor(this.y / T)),
      rowEnd:   Math.min(Level.rows - 1, Math.floor((this.y + CONFIG.HEIGHT) / T)),
    };
  },
};
