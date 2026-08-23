/* ============================================================
   STARSTRING — THE GRAPPLING HOOK
   ============================================================

   The move the whole game is named after.

   ------------------------------------------------------------
   THE BIG IDEA — AND WHY THE OBVIOUS WAY DOESN'T WORK
   ------------------------------------------------------------

   The obvious way to make a rope is:

       1. let the hero fall normally
       2. if she ends up further from the anchor than the rope is long,
          drag her back onto the circle
       3. throw away the speed that was pulling her away from it

   That LOOKS right, and it's what most people write first. But it
   quietly steals a little energy on every single frame, because
   dragging her back shortens her path. So the swing slowly dies out
   all by itself. You push and push and she just... stops. And you
   can't find the bug, because there isn't one — it's the method.

   So we don't track WHERE she is. We track the ANGLE OF THE ROPE.

       angle       how far round the rope has swung from straight down
       angVel      how fast that angle is changing
       length      how long the rope is

   Her position is then worked out FROM the angle, every frame:

       x = anchor.x + length * sin(angle)
       y = anchor.y + length * cos(angle)

   Nothing gets dragged anywhere, so no energy leaks out. The swing
   keeps going exactly like a real one, and the momentum you build up
   is really there when you let go.

   This is a proper physics pendulum, and it's about fifteen lines.

   ------------------------------------------------------------
   WHY PUMPING NEEDS THAT cos(angle)
   ------------------------------------------------------------

   On a real swing you don't get higher by pulling sideways — you get
   higher by moving your legs AT THE RIGHT MOMENT. Push when you're
   already moving that way and you gain. Push at the wrong moment and
   you lose. That timing IS the skill.

   The cos(angle) is what creates it. At the bottom of the swing it's
   near 1, so pressing does a lot. At the far edges it's near 0, so
   pressing does almost nothing.

   If you simplified it to "pressing right speeds up the swing", you
   could hold one button and spin round and round the anchor forever.
   No timing, no skill, no fun.
   ============================================================ */

const Grapple = {

  attached: false,
  anchor: null,
  length: 0,
  angle: 0,      // 0 = hanging straight down. Positive = swung right.
  angVel: 0,     // how fast the angle is changing, in radians per second
  heldTime: 0,   // how long we've been hanging on this one
  swings: 0,     // how many times we've swung past the bottom

  reset() {
    this.attached = false;
    this.anchor = null;
    this.angVel = 0;
    this.heldTime = 0;
    this.swings = 0;
    this.tapLatched = false;
  },

  // How many swings does the ring we're on allow? Red rings give you
  // far fewer; green rings never run out at all.
  maxSwings() {
    if (!this.anchor) return CONFIG.GRAPPLE.MAX_SWINGS;
    return Level.ringType(this.anchor).maxSwings;
  },

  // How worn out is the rope? 0 = fresh, 1 = about to give way.
  tiredness() {
    const max = this.maxSwings();
    return isFinite(max) ? Math.min(1, this.swings / max) : 0;
  },

  isTiring() {
    const max = this.maxSwings();
    if (!isFinite(max)) return false;          // green rings never tire
    return this.swings >= max - CONFIG.GRAPPLE.WARN_SWINGS;
  },

  /*
     Called every step, before the hero's normal movement.
     Returns true if the rope is in charge of her this frame,
     which tells the player code to leave her alone.
  */
  update(dt, player) {
    Level.updateAnchors(dt);

    if (this.attached) {
      this.heldTime += dt;

      // JUMP = launch off the rope, keeping your speed AND getting a
      // boost upwards. This is the exciting way to leave a swing.
      if (Input.jumpPressed) {
        this.detach(player, CONFIG.GRAPPLE.RELEASE_BOOST);
        return false;
      }

      /*
         LETTING GO — the button works two ways, and it works out
         which one you meant from how long you held it.

           HOLD and release   ->  you drop off the moment you let go.
                                  What you'd expect on a keyboard, and
                                  what Nea asked for.

           QUICK TAP          ->  you stay hanging with nothing held
                                  down. Tap again to drop off.

         Why bother with both? On a tablet the grapple and jump buttons
         are both under your right thumb. If you had to HOLD grapple,
         that thumb is busy and you could never press jump — so
         launching off a swing would be physically impossible.
         The quick tap frees your thumb up.
      */
      if (Input.grapplePressed) {          // tapped again — drop off
        this.detach(player, 0);
        return false;
      }

      if (!this.tapLatched && !Input.grapple) {
        if (this.heldTime <= CONFIG.GRAPPLE.TAP_TIME) {
          this.tapLatched = true;          // that was a tap — keep hanging
        } else {
          this.detach(player, 0);          // they were holding on, and let go
          return false;
        }
      }

      return this.swing(dt, player);
    }

    // Just pressed grapple — look for something to grab
    if (Input.grapplePressed) {
      const anchor = this.findAnchor(player);
      if (anchor) {
        // Try it — but be ready to pretend it never happened.
        const wasX = player.x, wasY = player.y;
        const wasVx = player.vx, wasVy = player.vy;

        this.attach(player, anchor);
        this.heldTime = 0;
        if (this.swing(dt, player)) return true;

        // The very first moment of the swing would have put her inside
        // a wall or the floor — which happens if you try to grapple
        // while standing somewhere the rope can't actually swing.
        //
        // Rather than grabbing on and snapping straight off (which
        // looks broken AND wastes the ring), we just don't grab at all.
        // Nothing happens, nothing is lost, try again from somewhere else.
        player.x = wasX; player.y = wasY;
        player.vx = wasVx; player.vy = wasVy;
        return false;
      }
    }
    return false;
  },


  /* ---------- FINDING SOMETHING TO GRAB ---------- */

  // The nearest ring that is close enough, lit up, above her, and
  // not hidden behind a wall. You never have to aim — the game does
  // it for you, because aiming precisely with a thumb is impossible.
  findAnchor(player) {
    const G = CONFIG.GRAPPLE;
    const cx = player.x + player.w / 2;
    const cy = player.y + player.h / 2;

    let best = null;
    let bestDistance = Infinity;

    for (const a of Level.anchors) {
      if (a.cooldown > 0) continue;              // still dark, still recharging
      if (a.y > cy - 24) continue;               // must be above her — you hang FROM a rope

      const distance = Math.hypot(a.x - cx, a.y - cy);
      if (distance > G.RANGE) continue;          // too far away
      if (distance < 1) continue;

      if (!Level.hasLineOfSight(cx, cy, a.x, a.y)) continue;   // wall in the way

      if (distance < bestDistance) {
        bestDistance = distance;
        best = a;
      }
    }
    return best;
  },

  // Is there anything she could grab right now? Used to make the
  // reachable ring pulse, so you can see it before you press.
  anchorInReach(player) {
    return this.attached ? null : this.findAnchor(player);
  },


  /* ---------- GRABBING ON ---------- */

  attach(player, anchor) {
    const cx = player.x + player.w / 2;
    const cy = player.y + player.h / 2;
    const dx = cx - anchor.x;
    const dy = cy - anchor.y;

    this.anchor = anchor;
    this.length = Math.max(
      CONFIG.GRAPPLE.MIN_ROPE,
      Math.min(Math.hypot(dx, dy), CONFIG.GRAPPLE.MAX_ROPE)
    );

    // Which way round is the rope? Measured from straight down.
    this.angle = Math.atan2(dx, dy);

    // Turn the speed she's already travelling at into a swing speed.
    // Only the part of her movement that goes AROUND the anchor counts
    // — the part pulling away from it is taken up by the rope.
    // This is why grabbing on mid-leap keeps your momentum instead
    // of jerking you to a dead stop.
    const tangentX = Math.cos(this.angle);
    const tangentY = -Math.sin(this.angle);
    this.angVel = (player.vx * tangentX + player.vy * tangentY) / this.length;

    this.attached = true;
  },


  /* ---------- SWINGING ---------- */

  swing(dt, player) {
    // The rope can let go part-way through its own update — it tires
    // out, or it hits a wall. If anything calls this afterwards there
    // is no anchor left to swing around, so say so instead of crashing.
    if (!this.attached || !this.anchor) return false;

    const G = CONFIG.GRAPPLE;
    const gravity = CONFIG.GRAVITY * Level.gravityScale;

    // 1. Gravity pulls the rope back towards straight down.
    //    This one line is the entire pendulum.
    this.angVel += -(gravity / this.length) * Math.sin(this.angle) * dt;

    // 2. Pumping. See the long note at the top for why cos() matters.
    const push = (Input.right ? 1 : 0) - (Input.left ? 1 : 0);
    this.angVel += G.PUMP * push * Math.cos(this.angle) * dt;

    // 2b. REELING THE ROPE IN AND OUT (up and down)
    //
    //     There is real physics here, and it's the same physics as a
    //     spinning ice skater pulling their arms in: pull yourself
    //     closer to the middle and you speed up. A LOT — the effect
    //     goes with the SQUARE of the length, so halving the rope makes
    //     you swing four times as fast.
    //
    //     That means reeling in at the bottom of a swing is a real
    //     trick: it's how you build up speed without pumping, and how
    //     you get up to somewhere high.
    const reel = (Input.down ? 1 : 0) - (Input.up ? 1 : 0);
    if (reel !== 0) {
      const oldLength = this.length;
      const newLength = Math.max(G.MIN_ROPE,
                        Math.min(G.MAX_ROPE, oldLength + reel * G.REEL_SPEED * dt));
      if (newLength !== oldLength) {
        const ratio = oldLength / newLength;
        this.angVel *= ratio * ratio;
        this.length = newLength;
      }
    }

    // 3. A little air resistance, so a swing you ignore dies down
    this.angVel -= this.angVel * G.DAMPING * dt;

    // 4. Speed limit, so you can't loop right over the top
    this.angVel = Math.max(-G.MAX_SWING_SPEED, Math.min(G.MAX_SWING_SPEED, this.angVel));

    // 5. Move the rope
    const before = this.angle;
    this.angle += this.angVel * dt;

    // 5b. THE ROPE TIRES.
    //     Every time the swing passes through the bottom, that's one
    //     more swing used up. When they run out, the rope lets go —
    //     so you can't hang on forever and use it as a hiding place.
    if (Math.sign(before) !== Math.sign(this.angle) && Math.abs(this.angVel) > 0.15) {
      this.swings++;
      if (this.swings >= this.maxSwings()) {
        this.detach(player, 0);
        return false;
      }
    }

    // 6. Work out where that puts her
    const cx = this.anchor.x + Math.sin(this.angle) * this.length;
    const cy = this.anchor.y + Math.cos(this.angle) * this.length;
    player.x = cx - player.w / 2;
    player.y = cy - player.h / 2;

    // 7. Keep her real speed up to date, so that letting go just works
    player.vx =  this.angVel * this.length * Math.cos(this.angle);
    player.vy = -this.angVel * this.length * Math.sin(this.angle);
    player.grounded = false;

    // 8. Swing into a wall and the rope snaps.
    //    We deliberately do NOT try to make the rope and the walls
    //    negotiate with each other — they'd fight, and she'd jitter
    //    horribly in the corner. Snapping is clear, fair, and it's
    //    obvious to the player what just happened.
    if (this.hitsTerrain(player)) {
      this.detach(player, 0);
      return false;
    }

    return true;
  },

  /*
     Has she really hit something, or just brushed past it?

     THE BUG THIS FIXES
     ------------------
     The first version snapped the rope if her box touched ANY solid
     block at all. That sounds right, but it made grappling while
     standing on the ground completely impossible: the moment the rope
     took over, the swing dipped her two pixels into the floor she was
     already standing on, the code shouted "wall!", and the rope snapped
     instantly. Press grapple, nothing happens, every single time.

     So we test with a box a bit SMALLER than she is. Brushing past a
     surface is fine and feels good — skimming the ground at the bottom
     of a swing is one of the nicest things about swinging. Properly
     burying yourself in a wall still snaps the rope.
  */
  hitsTerrain(player) {
    const sideways = CONFIG.GRAPPLE.WALL_FORGIVENESS;
    const updown   = CONFIG.GRAPPLE.GROUND_FORGIVENESS;
    const T = CONFIG.TILE;

    const left   = player.x + sideways;
    const right  = player.x + player.w - sideways - 1;
    const top    = player.y + updown;
    const bottom = player.y + player.h - updown - 1;

    if (right <= left || bottom <= top) return false;

    for (let row = Math.floor(top / T); row <= Math.floor(bottom / T); row++) {
      for (let col = Math.floor(left / T); col <= Math.floor(right / T); col++) {
        if (Level.isSolidAt(col, row)) return true;
      }
    }
    return false;
  },


  /* ---------- LETTING GO ---------- */

  detach(player, boost) {
    // The ring goes dark and needs a rest before it works again.
    //
    // ...unless you barely touched it. Grabbing and instantly letting
    // go by accident shouldn't cost you the ring for four seconds —
    // that's punishing a mistake that gained you nothing.
    if (this.anchor && this.heldTime > CONFIG.GRAPPLE.MIN_HOLD_FOR_COOLDOWN) {
      this.anchor.cooldown = Level.ringType(this.anchor).cooldown;
    }
    this.attached = false;
    this.anchor = null;
    this.heldTime = 0;
    this.swings = 0;
    this.tapLatched = false;

    // Her speed is already correct from the swing — we don't touch it.
    // That preserved momentum is the entire point of the move.
    if (boost) player.vy -= boost;
  },


  /* ---------- DRAWING THE ROPE ---------- */

  draw(ctx, player, alpha) {
    if (!this.attached) return;

    const G = CONFIG.GRAPPLE;
    // Where the rope comes out of the ring: through the bottom of the
    // hoop, not out of nothing in the middle of it.
    const ringX = this.anchor.x;
    const ringY = this.anchor.y + G.ANCHOR_SIZE * G.ROPE_ANCHOR_OFFSET;

    // Where it ends on her: her hands. The player works this out using
    // exactly the same turning and stretching it uses to draw her, so
    // the rope stays welded to her instead of sliding about.
    const hand = player.grappleHandPoint(alpha);
    const handX = hand.x;
    const handY = hand.y;

    // The warning that the rope is about to give way is shown on the
    // RING, not here — see _drawAnchors in game.js. The rope itself
    // just gets visibly thinner as it wears out.
    const outer = CONFIG.COLORS.ROPE;
    const inner = CONFIG.COLORS.ROPE_CORE;
    const wear = 1 - this.tiredness() * 0.45;

    ctx.save();
    ctx.strokeStyle = outer;
    ctx.lineWidth = G.ROPE_WIDTH * wear;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(ringX, ringY);
    ctx.lineTo(handX, handY);
    ctx.stroke();

    // A brighter thin line down the middle, so it glows
    ctx.strokeStyle = inner;
    ctx.lineWidth = 1.5 * wear;
    ctx.stroke();

    // A little knot where her hand grips it
    ctx.fillStyle = inner;
    ctx.beginPath();
    ctx.arc(handX, handY, 4.5 * wear, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  },
};
