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

  // "jumpPressed" is true only on the ONE frame the button goes down.
  // That's different from "jump", which stays true while it's held.
  // Holding is for jump height; the single press is for starting a jump.
  jumpPressed: false,

  _keys: {},
  _touches: new Map(),   // every finger currently on the screen
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
      if (['Space', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'ArrowDown'].includes(e.code)) {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', (e) => { this._keys[e.code] = false; });

    /* ---------- TOUCH ---------- */
    // "pointer" events cover fingers, mouse and stylus all at once,
    // so we only have to write this bit one time.
    canvas.addEventListener('pointerdown', (e) => {
      canvas.setPointerCapture(e.pointerId);
      this._touches.set(e.pointerId, this._toGameCoords(e));
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
      this._touches.delete(e.pointerId);
      e.preventDefault();
    };
    canvas.addEventListener('pointerup', endTouch);
    canvas.addEventListener('pointercancel', endTouch);
    canvas.addEventListener('pointerleave', endTouch);

    // Stop the tablet's own menus popping up mid-game
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
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
      { id: 'jump',    x: CONFIG.WIDTH - B.MARGIN - B.RADIUS,     y: bottom },
      { id: 'grapple', x: CONFIG.WIDTH - B.MARGIN - B.RADIUS*1.1, y: bottom - B.RADIUS * 2.5 },
    ];
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

  // Is any finger touching this button?
  // Note it uses HIT_RADIUS, which is bigger than the button looks.
  isButtonTouched(id) {
    const btn = this._buttons.find(b => b.id === id);
    if (!btn) return false;
    const r = CONFIG.BUTTONS.HIT_RADIUS;
    for (const t of this._touches.values()) {
      const dx = t.x - btn.x;
      const dy = t.y - btn.y;
      if (dx * dx + dy * dy <= r * r) return true;
    }
    return false;
  },

  getButtons() {
    return this._buttons;
  },

  // Called once per frame, before the game thinks.
  update() {
    const wasJump = this.jump;

    this.left = this._keys['ArrowLeft']  || this._keys['KeyA'] ||
                this.isButtonTouched('left');

    this.right = this._keys['ArrowRight'] || this._keys['KeyD'] ||
                 this.isButtonTouched('right');

    this.jump = this._keys['Space'] || this._keys['ArrowUp'] || this._keys['KeyW'] ||
                this.isButtonTouched('jump');

    // Went from not-pressed to pressed, this exact frame
    this.jumpPressed = this.jump && !wasJump;
  },
};
