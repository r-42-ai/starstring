/* ============================================================
   STARSTRING — ASSETS
   ============================================================

   Loads pictures. Nothing here needs changing yet.

   The clever bit: pictures are OPTIONAL. If a picture isn't there,
   the game draws a coloured shape instead and carries on running.

   That means you can build the whole game with rectangles, then
   drop PNG files into the assets folder and watch them appear —
   without touching a single line of code.
   ============================================================ */

const Assets = {

  images: {},

  // Ask for a picture. If it isn't there, no error, no crash —
  // the game just carries on with a placeholder shape.
  load(name, path) {
    const img = new Image();
    img.onload = () => { this.images[name] = img; };
    img.onerror = () => { /* no picture yet — that's completely fine */ };
    img.src = path;
  },

  // Do we have this picture yet?
  has(name) {
    return !!this.images[name];
  },

  get(name) {
    return this.images[name];
  },

  // Load everything the game might want.
  // Files that don't exist yet are simply skipped.
  loadAll() {
    // Buttons (art batch 2)
    this.load('btn_left',    'assets/ui/btn_left.png');
    this.load('btn_right',   'assets/ui/btn_right.png');
    this.load('btn_jump',    'assets/ui/btn_jump.png');
    this.load('btn_grapple', 'assets/ui/btn_grapple.png');

    // Hero (art batch 3) — not used yet, arrives at Step 6
    // this.load('hero_idle_1', 'assets/sprites/hero_idle_1.png');
  },
};
