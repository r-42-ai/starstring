/* ============================================================
   STARSTRING — PLAYER
   ============================================================

   Everything the hero does: running, falling, jumping,
   and bumping into blocks.

   The most important idea in this whole file:

     WE MOVE SIDEWAYS FIRST AND SORT OUT THE BUMPS,
     THEN WE MOVE UP-AND-DOWN AND SORT OUT THOSE BUMPS.

   Two separate steps, never both at once. If you do both at once,
   the hero catches on the invisible joins between blocks and
   jitters. Almost every broken platformer game has this bug.
   ============================================================ */

class Player {

  constructor() {
    this.w = CONFIG.PLAYER.WIDTH;
    this.h = CONFIG.PLAYER.HEIGHT;
    this.respawn();
  }

  respawn() {
    if (typeof Grapple !== 'undefined') Grapple.reset();
    if (typeof Level !== 'undefined' && Level.resetAnchors) Level.resetAnchors();
    // Back to the last flag you lit, or the very start if you
    // haven't reached one yet.
    const back = Level.respawnPoint ? Level.respawnPoint() : { x: Level.spawnX, y: Level.spawnY };
    this.x = back.x;
    this.y = back.y;
    this.prevX = this.x;      // where we were last step, for smooth drawing
    this.prevY = this.y;
    this.vx = 0;              // speed sideways
    this.vy = 0;              // speed up and down
    this.grounded = false;    // are we standing on something?
    this.facing = 1;          // 1 = looking right, -1 = looking left
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;

    // --- animation state ---
    this.stepPhase = 0;       // where we are in the walk cycle
    this.squash = 1;          // 1 = normal, less = squashed flat
    this.wasGrounded = true;
    this.idleTime = 0;
  }

  update(dt) {
    // Remember where we were, so the drawing can be smooth
    this.prevX = this.x;
    this.prevY = this.y;

    // If the rope has hold of her, it decides where she goes and
    // all the normal running and falling is skipped entirely.
    if (Grapple.update(dt, this)) {
      this.wasGrounded = this.grounded;
      this.grounded = false;
      if (Math.abs(this.vx) > 20) this.facing = Math.sign(this.vx);
      this._updateAnimation(dt, 0);
      this._fellOutOfTheWorld();
      return;
    }

    this._handleRunning(dt);
    this._handleJumping(dt);
    this._applyGravity(dt);

    // Remember how fast we were falling — the collision is about to
    // set it to zero, and we want to know for the landing squash.
    const fallSpeed = this.vy;

    // THE TWO SEPARATE STEPS
    this._moveX(this.vx * dt);
    this._moveY(this.vy * dt);

    // Only NOW do we decide whether we're standing on something,
    // once all the moving is finished. See the note on _isOnGround.
    this.wasGrounded = this.grounded;
    this.grounded = this._isOnGround();

    this._updateAnimation(dt, fallSpeed);
    Level.touchFlags(this);
    Level.revealIllusions(this);
    this._fellOutOfTheWorld();
  }


  /* ---------- RUNNING ---------- */

  _handleRunning(dt) {
    const P = CONFIG.PLAYER;

    // You steer less well in mid-air than on the ground.
    const power = this.grounded ? P.ACCEL : P.AIR_ACCEL;

    if (Input.left && !Input.right) {
      this.vx -= power * dt;
      this.facing = -1;
    } else if (Input.right && !Input.left) {
      this.vx += power * dt;
      this.facing = 1;
    } else {
      // Nothing pressed — slow down. This is friction.
      // On the ground you stop quickly; in the air you keep drifting.
      const brake = (this.grounded ? P.DECEL : P.DECEL * 0.25) * dt;
      if (Math.abs(this.vx) <= brake) {
        this.vx = 0;
      } else {
        this.vx -= Math.sign(this.vx) * brake;
      }
    }

    // Never go faster than the top speed
    this.vx = Math.max(-P.MAX_SPEED, Math.min(P.MAX_SPEED, this.vx));
  }


  /* ---------- JUMPING ---------- */

  _handleJumping(dt) {
    const P = CONFIG.PLAYER;

    // COYOTE TIME
    // Named after the cartoon coyote who runs off a cliff and only
    // falls once he looks down. On the ground the timer is full;
    // once you leave the ground it counts down, and you can still
    // jump until it runs out.
    if (this.grounded) {
      this.coyoteTimer = P.COYOTE_TIME;
    } else {
      this.coyoteTimer -= dt;
    }

    // JUMP BUFFERING
    // If you press jump just before you land, we remember it for a
    // moment and use it the instant you touch down.
    if (Input.jumpPressed) {
      this.jumpBufferTimer = P.JUMP_BUFFER;
    } else {
      this.jumpBufferTimer -= dt;
    }

    // A jump happens when we have BOTH a recent press AND recent ground
    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
      this.vy = P.JUMP_SPEED;
      this.grounded = false;
      this.jumpBufferTimer = 0;
      this.coyoteTimer = 0;
    }
  }


  /* ---------- GRAVITY ---------- */

  _applyGravity(dt) {
    const P = CONFIG.PLAYER;

    // The planet decides how strong gravity is here
    let g = CONFIG.GRAVITY * Level.gravityScale;

    if (this.vy > 0) {
      // Going down — fall faster than we rose. Makes jumps feel snappy.
      g *= P.FALL_MULTIPLIER;
    } else if (this.vy < 0 && !Input.jump) {
      // Going up but the button was released — cut the jump short.
      // This is how one button gives you both small hops and big jumps.
      g *= P.LOW_JUMP_MULTIPLIER;
    }

    this.vy += g * dt;

    if (this.vy > P.MAX_FALL_SPEED) this.vy = P.MAX_FALL_SPEED;
  }


  /* ---------- STEP ONE: MOVE SIDEWAYS ---------- */

  _moveX(dx) {
    if (dx === 0) return;
    this.x += dx;

    const tiles = this._overlappingTiles();
    for (const t of tiles) {
      const left   = t.col * CONFIG.TILE;
      const right  = left + CONFIG.TILE;

      if (dx > 0) {
        this.x = left - this.w;   // stop against the left face of the block
      } else {
        this.x = right;           // stop against the right face
      }
      this.vx = 0;
      break;
    }

    // The edges of the level are solid too, even where there's no block
    // drawn. Otherwise you can simply walk out of the world sideways.
    const maxX = Level.pixelWidth() - this.w;
    if (this.x < 0)    { this.x = 0;    this.vx = 0; }
    if (this.x > maxX) { this.x = maxX; this.vx = 0; }
  }


  /* ---------- STEP TWO: MOVE UP AND DOWN ---------- */

  _moveY(dy) {
    if (dy === 0) return;
    this.y += dy;

    const tiles = this._overlappingTiles();
    if (tiles.length === 0) return;

    if (dy < 0) {
      // Heading upwards and we hit a ceiling.
      // CORNER FORGIVENESS: if we only just clipped the edge of the
      // block, slide us around it instead of stopping the jump dead.
      if (this._tryCornerCorrection(tiles)) return;
    }

    for (const t of tiles) {
      const top    = t.row * CONFIG.TILE;
      const bottom = top + CONFIG.TILE;

      if (dy > 0) {
        this.y = top - this.h;   // landed on top of the block
      } else {
        this.y = bottom;         // bonked our head
      }
      this.vy = 0;
      break;
    }
  }

  // If the hero's head clipped a block by only a few pixels,
  // nudge sideways so the jump carries on. Without this, jumping
  // through a gap that is exactly the right size feels impossible.
  _tryCornerCorrection(tiles) {
    const nudge = CONFIG.PLAYER.CORNER_CORRECTION;

    for (const t of tiles) {
      const blockLeft  = t.col * CONFIG.TILE;
      const blockRight = blockLeft + CONFIG.TILE;

      // How far are we poking into this block from each side?
      const overlapOnRight = this.x + this.w - blockLeft; // we're mostly left of it
      const overlapOnLeft  = blockRight - this.x;         // we're mostly right of it

      // Only a tiny bit of the head is caught on the left edge — slide left
      if (overlapOnRight > 0 && overlapOnRight <= nudge) {
        const saved = this.x;
        this.x -= overlapOnRight;
        if (this._overlappingTiles().length === 0) return true;
        this.x = saved;
      }

      // Only a tiny bit caught on the right edge — slide right
      if (overlapOnLeft > 0 && overlapOnLeft <= nudge) {
        const saved = this.x;
        this.x += overlapOnLeft;
        if (this._overlappingTiles().length === 0) return true;
        this.x = saved;
      }
    }
    return false;
  }


  /* ---------- ANIMATION ----------

     We have exactly one drawing of the hero. Everything that makes
     her look alive is done here, by moving that one drawing about.

     Three things are happening:

       BOUNCE   she lifts a little on every step, like real walking
       SQUASH   she flattens when she lands and stretches when she flies
       LEAN     she tilts forwards when running fast

     The bounce is tied to how far she has TRAVELLED, not to the clock.
     That's the important bit: it means her steps automatically speed up
     when she runs and slow down when she creeps, without any extra work.
     ---------------------------------------------------------------- */

  _updateAnimation(dt, fallSpeed) {
    const A = CONFIG.ANIM;

    // Walk cycle. Distance-driven, so steps match your speed.
    if (this.grounded) {
      this.stepPhase += (Math.abs(this.vx) * dt / A.STRIDE) * Math.PI;
    } else {
      this.stepPhase = 0;   // no footsteps in mid-air
    }

    // Landing squash — only for a proper landing, not for stepping
    // off a small ledge, otherwise she twitches constantly.
    if (this.grounded && !this.wasGrounded && fallSpeed > A.LAND_MIN_SPEED) {
      this.squash = A.LAND_SQUASH;
    }

    // Spring back to normal. This is the bounce-back after the squash.
    this.squash += (1 - this.squash) * Math.min(1, A.SQUASH_RECOVER * dt);

    // Breathing, for when she's standing perfectly still
    this.idleTime += dt;
  }


  /* ---------- ARE WE STANDING ON SOMETHING? ----------

     This looks like it should be easy, and it is the single most
     common place a platformer goes wrong. Here's the story.

     The obvious way is: "when I move down and bump into a block,
     I must have landed." That works for the landing itself, but
     it falls apart when you just stand still.

     When you're standing on a block you are NOT inside it. You are
     exactly touching the top of it, which is a different thing.
     So the bump test says "no bump" and the game thinks you're
     falling. Gravity pulls you down a fraction of a pixel, and
     now you ARE inside it, so the game says "landed!" and pushes
     you back out. Next frame it happens all over again.

     The result: the game flickers between "on the ground" and
     "in the air" sixty times a second while you stand perfectly
     still. Nea spotted this within a minute of playing.

     The fix is to stop asking "did I bump into something" and ask
     a better question instead:

         IS THERE SOLID GROUND JUST BELOW MY FEET?

     One pixel below, to be exact. That question gives the same
     answer every frame while you stand still, so no more flicker.
     -------------------------------------------------------- */

  _isOnGround() {
    const T = CONFIG.TILE;

    // The row of blocks one pixel beneath our feet
    const row = Math.floor((this.y + this.h + 1) / T);

    // Check every column our body covers — you count as standing
    // on the ground if even one toe is over something solid.
    const colStart = Math.floor(this.x / T);
    const colEnd   = Math.floor((this.x + this.w - 1) / T);

    for (let col = colStart; col <= colEnd; col++) {
      if (Level.isSolidAt(col, row)) return true;
    }
    return false;
  }


  /* ---------- WHICH BLOCKS ARE WE INSIDE? ---------- */

  _overlappingTiles() {
    const T = CONFIG.TILE;

    // Only look at the few squares the hero could possibly be touching,
    // not the whole level. Checking every block every frame would be
    // slow and pointless.
    const colStart = Math.floor(this.x / T);
    const colEnd   = Math.floor((this.x + this.w - 1) / T);
    const rowStart = Math.floor(this.y / T);
    const rowEnd   = Math.floor((this.y + this.h - 1) / T);

    const hits = [];
    for (let row = rowStart; row <= rowEnd; row++) {
      for (let col = colStart; col <= colEnd; col++) {
        if (Level.isSolidAt(col, row)) hits.push({ col, row });
      }
    }
    return hits;
  }


  /* ---------- FALLING OFF THE BOTTOM ---------- */

  _fellOutOfTheWorld() {
    if (this.y > Level.pixelHeight() + 400) {
      this.respawn();
      // Tell the game to jump the camera back too, instead of letting
      // it glide slowly across the whole level after you.
      this.justRespawned = true;
    }
  }


  /* ---------- DRAWING ---------- */

  // "alpha" is a number between 0 and 1 saying how far we are between
  // the last thinking step and the next one. Using it makes movement
  // look perfectly smooth even though the game only thinks 60 times
  // a second. This is called interpolation.
  draw(ctx, alpha) {
    const drawX = this.prevX + (this.x - this.prevX) * alpha;
    const drawY = this.prevY + (this.y - this.prevY) * alpha;

    if (Assets.has('hero_idle_1')) {
      this._drawSprite(ctx, drawX, drawY);
    } else {
      // No picture yet — a plain rectangle, so the game still runs
      ctx.fillStyle = CONFIG.COLORS.PLAYER;
      ctx.fillRect(drawX, drawY, this.w, this.h);
      ctx.fillStyle = CONFIG.COLORS.PLAYER_EDGE;
      const stripeW = 8;
      ctx.fillRect(
        this.facing === 1 ? drawX + this.w - stripeW : drawX,
        drawY + 14, stripeW, 20
      );
    }
  }

  /*
     How she is turned and stretched while swinging.

     Kept in its own little function because TWO things need it: the
     drawing, and working out where her hands are. If they each worked
     it out separately they would drift apart, and the rope would come
     out of thin air near her instead of being held.
  */
  _swingTransform() {
    const trail = Math.max(-0.35, Math.min(0.35, Grapple.angVel * 0.11));
    const stretch = 1 + Math.min(Math.abs(Grapple.angVel) * 0.035, 0.12);
    return {
      rot: -Grapple.angle * CONFIG.GRAPPLE.HANG_LEAN + trail,
      sx: 1 / stretch,
      sy: stretch,
    };
  }

  /*
     Where her HANDS are in the world right now.

     THE BUG THIS FIXES
     ------------------
     The rope used to end at "a bit of the way from her middle towards
     the ring". That sounds fine, but the direction to the ring keeps
     changing as she swings — so the end of the rope slid around her
     body the whole time, and never looked attached to anything.

     The fix is to pick one spot ON HER — her hands — and put it through
     exactly the same turning and stretching the picture goes through.
     Then it's welded to her, and stays welded however she spins.
  */
  grappleHandPoint(alpha) {
    const drawX = this.prevX + (this.x - this.prevX) * alpha;
    const drawY = this.prevY + (this.y - this.prevY) * alpha;

    const img = (Grapple.attached && Assets.has('hero_grapple'))
      ? Assets.get('hero_grapple')
      : Assets.get('hero_idle_1');

    const height = this.h * CONFIG.SPRITE.HERO_SCALE;
    const footX = drawX + this.w / 2;
    const footY = drawY + this.h;

    const t = Grapple.attached
      ? this._swingTransform()
      : { rot: 0, sx: 1, sy: 1 };

    // Her hands, in the picture's own coordinates: straight up her
    // middle, near the top. Feet are at (0, 0), head is at (0, -height).
    const localY = -height * CONFIG.SPRITE.HAND_HEIGHT;

    // Now put that point through the same stretch, then the same turn,
    // then the same move — the exact order the canvas uses to draw her.
    const stretchedY = localY * t.sy;
    const cos = Math.cos(t.rot), sin = Math.sin(t.rot);

    return {
      x: footX - stretchedY * sin,
      y: footY + stretchedY * cos,
    };
  }

  _drawSprite(ctx, drawX, drawY) {
    const A = CONFIG.ANIM;

    // Use the proper swinging drawing if it exists yet, otherwise fall
    // back to the standing one, tilted along the rope.
    const swinging = Grapple.attached;
    const img = (swinging && Assets.has('hero_grapple'))
      ? Assets.get('hero_grapple')
      : Assets.get('hero_idle_1');

    // Work out the picture's size from its own shape, so it never
    // gets squashed or stretched, whatever size the file happens to be.
    const height = this.h * CONFIG.SPRITE.HERO_SCALE;
    const width  = height * (img.width / img.height);

    // Everything is measured from the point between her feet.
    // Anchoring there is what keeps her standing ON the ground
    // however much she squashes or stretches.
    const footX = drawX + this.w / 2;
    const footY = drawY + this.h;

    const moving = Math.abs(this.vx) > 20;

    // BOUNCE — abs() so she only ever rises, never sinks into the floor
    const bob = (this.grounded && moving)
      ? Math.abs(Math.sin(this.stepPhase)) * A.BOB_HEIGHT
      : 0;

    // SWINGING — she stretches out along the rope, as if hanging from
    // her arms, and swings a little further than the rope does, the way
    // your legs trail behind you on a real swing.
    if (swinging) {
      const t = this._swingTransform();
      ctx.save();
      ctx.translate(footX, footY);
      ctx.rotate(t.rot);
      ctx.scale(this.facing * t.sx, t.sy);
      ctx.drawImage(img, -width / 2, -height, width, height);
      ctx.restore();
      return;
    }

    // SQUASH AND STRETCH
    let sy;
    if (this.grounded) {
      sy = this.squash;
      if (!moving) {
        sy += Math.sin(this.idleTime * A.BREATH_SPEED) * A.BREATH_AMOUNT;
      }
    } else {
      // Stretch out in the air, more the faster she's going
      const speed = Math.min(Math.abs(this.vy) / 900, 1);
      sy = 1 + speed * A.AIR_STRETCH;
    }
    // Squeeze the width by the opposite amount, so she keeps her volume.
    // Without this she just looks like she's being resized.
    const sx = 1 / sy;

    // LEAN — tilt into the run.
    // While swinging she hangs along the rope instead, which is what
    // your body actually does on a swing. (The minus sign is because
    // on a screen, y counts downwards.)
    const lean = Grapple.attached
      ? -Grapple.angle * CONFIG.GRAPPLE.HANG_LEAN
      : (this.vx / CONFIG.PLAYER.MAX_SPEED) * A.LEAN;

    ctx.save();
    ctx.translate(footX, footY - bob);
    ctx.rotate(lean);
    ctx.scale(this.facing * sx, sy);
    // Drawn from -height up to 0, so the feet sit exactly on the origin
    ctx.drawImage(img, -width / 2, -height, width, height);
    ctx.restore();
  }
}
