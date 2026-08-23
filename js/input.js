/* ============================================================
   STARSTRING — INPUT
   ============================================================

   Works out what the player is pressing.

   Two ways to play:
     - Touching buttons on the screen  (tablet and phone)
     - The keyboard                    (laptop, for testing)

   Both feed into the same three answers: am I going left,
   am I going right, am I jumping. The rest of the game never
   needs to know which one you used.
   ============================================================ */

const Input = {

  // The three things the game asks about
  left: false,
  right: false,
  jump: false,
  grapple: false,
  grapplePressed: false,

  // Only used while swinging, to reel the rope in and out
  up: false,
  down: false,

  // "jumpPressed" is true only on the ONE frame the button goes down.
  // That's different from "jump", which stays true while it's held.
  // Holding is for jump height; the single press is for starting a jump.
  jumpPressed: false,

  _keys: {},
  _touches: new Map(),   // every finger currently on the screen
  _pressed: new Set(),   // which buttons those fingers add up to
  swinging: false,       // set by the game; turns the rope buttons on
  wheel: 0,              // scroll notches since we last looked

  /*
     A COMPLETED TAP, remembered until somebody reads it.

     THE BUG THIS FIXES
     ------------------
     The planet map used to spot taps by watching the list of fingers:
     one finger this frame, none the next, and it hadn't moved much —
     that's a tap.

     Which quietly misses fast taps entirely. Press and release inside
     a sixtieth of a second and BOTH things happen between two frames,
     so the game never sees a finger at all and nothing happens. The
     harder you tap, the less likely it is to work — which is exactly
     backwards, and maddening.

     So taps are now noticed by the pointer events themselves, the
     instant they happen, and kept until something reads them.
  */
  tapped: null,
  _downPos: new Map(),
  _buttons: [],          // where the on-screen buttons are
  _canvas: null,
  _scale: 1,
  _offsetX: 0,
  _offsetY: 0,

  init(canvas) {
    this._canvas = canvas;
    this._defineButtons();

    /* ---------- KEYBOARD (for testing on a laptop) ---------- */
    window.addEventListener('keydown', (e) => {
      this._keys[e.code] = true;
      // Stop the page scrolling when you press space or the arrows
      if (['Space', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'ArrowDown',
           'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', (e) => { this._keys[e.code] = false; });

    /* ---------- TOUCH ---------- */
    // "pointer" events cover fingers, mouse and stylus all at once,
    // so we only have to write this bit one time.
    canvas.addEventListener('pointerdown', (e) => {
      canvas.setPointerCapture(e.pointerId);
      const p = this._toGameCoords(e);
      this._touches.set(e.pointerId, p);
      this._downPos.set(e.pointerId, p);
      e.preventDefault();
    });
    canvas.addEventListener('pointermove', (e) => {
      if (this._touches.has(e.pointerId)) {
        // Sliding your thumb between buttons works. It should.
        this._touches.set(e.pointerId, this._toGameCoords(e));
      }
      e.preventDefault();
    });
    const endTouch = (e) => {
      // Did this finger go down and come up again without really
      // moving? Then it was a tap, whatever the frame rate was doing.
      const down = this._downPos.get(e.pointerId);
      if (down) {
        const up = this._toGameCoords(e);
        if (Math.hypot(up.x - down.x, up.y - down.y) < CONFIG.PLANET.TAP_SLOP * 2) {
          this.tapped = up;
        }
        this._downPos.delete(e.pointerId);
      }
      this._touches.delete(e.pointerId);
      e.preventDefault();
    };
    canvas.addEventListener('pointerup', endTouch);
    canvas.addEventListener('pointercancel', endTouch);
    canvas.addEventListener('pointerleave', endTouch);

    // Stop the tablet's own menus popping up mid-game
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // The scroll wheel — only used on the planet map, for zooming.
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.wheel += Math.sign(e.deltaY);
    }, { passive: false });
  },

  // Where the buttons live, in GAME coordinates (always 1280x720),
  // never in real screen pixels. That's why they land in the right
  // place on every device.
  _defineButtons() {
    const B = CONFIG.BUTTONS;
    const bottom = CONFIG.HEIGHT - B.MARGIN - B.RADIUS;

    this._buttons = [
      { id: 'left',    x: B.MARGIN + B.RADIUS,                    y: bottom },
      { id: 'right',   x: B.MARGIN + B.RADIUS * 3.4,              y: bottom },
      { id: 'jump',    x: CONFIG.WIDTH - B.MARGIN - B.RADIUS,       y: bottom },
      { id: 'grapple', x: CONFIG.WIDTH - B.MARGIN - B.RADIUS * 1.3, y: bottom - B.RADIUS * 3.1 },

      // These two only exist while you're hanging on the rope. There
      // isn't room for six buttons all the time, so they appear when
      // they're useful and get out of the way when they're not.
      { id: 'reelIn',  x: B.MARGIN + B.RADIUS,       y: bottom - B.RADIUS * 2.6,
        onlyWhileSwinging: true },
      { id: 'reelOut', x: B.MARGIN + B.RADIUS * 3.4, y: bottom - B.RADIUS * 2.6,
        onlyWhileSwinging: true },
    ];

    // Buttons must sit further apart than their invisible reach, or a
    // thumb landing between two of them is ambiguous. Warn if not.
    for (let i = 0; i < this._buttons.length; i++) {
      for (let j = i + 1; j < this._buttons.length; j++) {
        const a = this._buttons[i], b = this._buttons[j];
        const gap = Math.hypot(a.x - b.x, a.y - b.y);
        if (gap < CONFIG.BUTTONS.HIT_RADIUS) {
          console.warn(
            `Buttons "${a.id}" and "${b.id}" are only ${gap.toFixed(0)}px apart, ` +
            `which is less than their ${CONFIG.BUTTONS.HIT_RADIUS}px reach. ` +
            `They will be hard to tell apart.`
          );
        }
      }
    }
  },

  // Turn a real screen position into a game position.
  // The canvas might be stretched or shrunk to fit the screen,
  // so we have to undo that to know what was actually touched.
  _toGameCoords(e) {
    const rect = this._canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / rect.width  * CONFIG.WIDTH,
      y: (e.clientY - rect.top)  / rect.height * CONFIG.HEIGHT,
    };
  },

  /*
     Work out which buttons are being pressed.

     THE BUG THIS FIXES
     ------------------
     The first version asked each button on its own: "is any finger
     within my reach?" The buttons' invisible reach is much wider than
     they look — deliberately, so they're easy to hit — which means
     those reaches OVERLAP.

     So one thumb landing between two buttons pressed BOTH of them.
     Put a thumb between left and right and the hero stood still,
     because the code says "go left, but not if right is also pressed".
     Put a thumb between jump and grapple and you fired the rope every
     time you tried to jump.

     The fix: go through the FINGERS instead of the buttons, and give
     each finger to the single nearest button. One finger, one button,
     always.
  */
  _resolveTouches() {
    this._pressed.clear();
    const r = CONFIG.BUTTONS.HIT_RADIUS;

    for (const t of this._touches.values()) {
      let nearest = null;
      let nearestDistance = Infinity;

      for (const b of this._buttons) {
        if (b.onlyWhileSwinging && !this.swinging) continue;
        const dx = t.x - b.x;
        const dy = t.y - b.y;
        const d = Math.hypot(dx, dy);
        if (d <= r && d < nearestDistance) {
          nearestDistance = d;
          nearest = b;
        }
      }
      if (nearest) this._pressed.add(nearest.id);
    }
  },

  isButtonTouched(id) {
    return this._pressed.has(id);
  },

  getButtons() {
    return this._buttons;
  },

  // Called once per frame, before the game thinks.
  update() {
    const wasJump = this.jump;
    const wasGrapple = this.grapple;

    // Decide which buttons the fingers are on, before asking about them
    this._resolveTouches();

    this.left = this._keys['ArrowLeft']  || this._keys['KeyA'] ||
                this.isButtonTouched('left');

    this.right = this._keys['ArrowRight'] || this._keys['KeyD'] ||
                 this.isButtonTouched('right');

    // Jump is SPACE, and only SPACE.
    //
    // Up/down and W/S both shorten and lengthen the rope now, so
    // neither of them can also be jump — one key can't sensibly do two
    // things at once. There are only so many keys, and every one has to
    // earn its place. This is a real thing game designers argue about.
    this.jump = this._keys['Space'] || this.isButtonTouched('jump');

    this.up   = this._keys['ArrowUp']   || this._keys['KeyW'] ||
                this.isButtonTouched('reelIn');
    this.down = this._keys['ArrowDown'] || this._keys['KeyS'] ||
                this.isButtonTouched('reelOut');

    // Hold the grapple button to stay hanging, let go to drop off
    this.grapple = this._keys['ShiftLeft'] || this._keys['KeyE'] || this._keys['KeyJ'] ||
                   this.isButtonTouched('grapple');

    // Went from not-pressed to pressed, this exact frame
    this.jumpPressed = this.jump && !wasJump;
    this.grapplePressed = this.grapple && !wasGrapple;
  },
};
