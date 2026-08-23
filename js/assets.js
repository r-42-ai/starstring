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

    // Cut out of the style bible, so we have real art to look at early.
    // Proper versions arrive with art batch 3.
    this.load('hero_idle_1', 'assets/sprites/hero_idle_1.png');
    this.load('anchor',      'assets/sprites/anchor_idle.png');
    this.load('blob',        'assets/sprites/blob_idle_1.png');

    // Not drawn yet. The moment this file appears in the folder, the
    // game starts using it for swinging — no code change needed.
    // The prompt for it is in docs/ART_PROMPTS.md ("hero_grapple.png").
    this.load('hero_grapple', 'assets/sprites/hero_grapple.png');

    // Not used by the game yet, but ready and waiting:
    //   assets/sprites/blob_idle_1.png    (Blob)
    //   assets/sprites/starbit.png        (collectible — Step 12)
    //   assets/sprites/tile_platform.png  (needs a tileable version first)
  },
};
