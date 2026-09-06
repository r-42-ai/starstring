/*
  MONSTERS

  Five kinds, all chosen by AXY. Each one is a single letter you type
  into the map in level.js -- exactly like a ring or a flag. There is
  nothing else to do: put the letter in, save, reload.

      c  CRAWLER  paces a platform and turns round at the edge
      ~  FLYER    bobs up and down in mid-air, in your swing path
      z  LURKER   sits still like a rock until you get close, then chases
      ^  SPIKES   never move. Crystal, and sharp.
      v  FALLER   hangs above you and drops the moment you walk under it

  The letters are meant to look like the thing:  ^ points up out of the
  floor, v points down at your head, ~ bobs, z is asleep.

  THE RULES, all AXY's:

    - touch one and you go back to the last flag. The same punishment as
      falling in a hole, so there is nothing new to learn.
    - LAND ON ITS HEAD and it's squashed, and you bounce off it.
    - HIT IT WHILE SWINGING and you smash straight through. On the rope
      you are dangerous; on your feet you are not.
    - spikes and fallers can never be beaten. They aren't alive -- one is
      a rock with a point on it and the other is a rock that lets go.

  WHY THE TWO WAYS OF FIGHTING BACK ARE BOTH WORTH HAVING

  Stomping is the one every platform game has, and it's the answer when
  you're on foot. Smashing through while swinging is the one that belongs
  to THIS game: it turns the grapple from a way of crossing gaps into a
  weapon, and it means a monster placed under a ring chain is a target
  rather than a wall. A game named after its rope should have a rope that
  does more than carry you.
*/
const Monsters = {

  list: [],

  /* ---------- READING THEM OUT OF THE MAP ---------- */

  load(level) {
    this.list = [];
    for (let r = 0; r < level.rows; r++) {
      for (let c = 0; c < level.cols; c++) {
        const kind = CONFIG.MONSTERS.LETTERS[level.map[r][c]];
        if (kind) this.list.push(this._make(kind, c, r));
      }
    }
  },

  _make(kind, col, row) {
    const T = CONFIG.TILE;
    const M = CONFIG.MONSTERS[kind.toUpperCase()];
    const m = {
      kind, col, row,
      w: M.WIDTH, h: M.HEIGHT,
      // Standing on the bottom of its own square, middle of it sideways
      homeX: col * T + T / 2 - M.WIDTH / 2,
      homeY: (row + 1) * T - M.HEIGHT,
      dir: -1,            // crawlers start walking left

      /*
         Where in its bob a flyer starts -- worked out from WHERE IT IS,
         never from Math.random().

         Random looked fine and quietly broke the tests: the same level
         played differently every time, so "can this be finished" got a
         different answer on different runs. A level went from passing to
         failing with nothing changed in it, which is the worst kind of
         failure to chase, because the first thing you do is go looking
         at the level.

         Two flyers in the same level still start out of step with each
         other, because their columns differ. It just doesn't change
         between one run and the next.
      */
      phase: (Math.sin(col * 127.1 + row * 311.7) * 43758.5453 % 1) * Math.PI * 2,
      alive: true,
      awake: false,       // lurkers only
      returning: false,   // lurkers: plodding back to their rock
      state: 'waiting',   // fallers: waiting | warning | falling | resting | rising
      timer: 0,
      squashed: 0,        // seconds of the squashed-flat animation left
    };
    m.x = m.homeX; m.y = m.homeY;
    m.prevX = m.x; m.prevY = m.y;
    return m;
  },

  // Everything comes back when you do. Dying and finding the monsters
  // still dead would make a hard bit easier every time you failed it,
  // which is the wrong way round.
  reset() {
    for (const m of this.list) {
      m.alive = true; m.awake = false; m.returning = false; m.squashed = 0;
      m.state = 'waiting'; m.timer = 0; m.dir = -1;
      m.x = m.homeX; m.y = m.homeY;
      m.prevX = m.x; m.prevY = m.y;
    }
  },


  /* ---------- MOVING ---------- */

  update(dt, player) {
    for (const m of this.list) {
      m.prevX = m.x; m.prevY = m.y;
      if (m.squashed > 0) { m.squashed -= dt; continue; }
      if (!m.alive) continue;
      if (m.kind === 'crawler') this._crawl(m, dt);
      else if (m.kind === 'flyer') this._fly(m, dt);
      else if (m.kind === 'lurker') this._lurk(m, dt, player);
      else if (m.kind === 'faller') this._fall(m, dt, player);
      // spikes do nothing at all, which is their entire personality
    }
  },

  _crawl(m, dt) {
    const M = CONFIG.MONSTERS.CRAWLER, T = CONFIG.TILE;
    m.x += m.dir * M.SPEED * dt;

    /*
       Turn round at a WALL or at the EDGE of the platform.

       The edge test is the one that matters: look at the square
       diagonally down-ahead, and if there's no floor there, turn round.
       Without it a crawler walks off its ledge and falls out of the
       level, and the ledge you carefully placed it on is empty by the
       time you arrive.
    */
    const ahead = m.dir < 0 ? m.x : m.x + m.w;
    const aheadCol = Math.floor((ahead + m.dir * 2) / T);
    const bodyRow  = Math.floor((m.y + m.h / 2) / T);
    const floorRow = Math.floor((m.y + m.h + 2) / T);

    /*
       RANGE HAS TO MAKE IT TURN, not just tidy up afterwards.

       The first version clamped m.x back inside the range only at the
       moment it turned round for some OTHER reason -- so on a long
       corridor with no wall and no edge, nothing ever turned it and the
       clamp never ran. A crawler I put at column 124 of level 3 patrolled
       the whole thirty-seven-block corridor, walked into an illusion
       tunnel one block high, and camped there. The robot died on it
       fifty-eight times.

       Two lessons, and the second is the useful one:

         - a limit that is only enforced when something else happens is
           not a limit
         - a monster that can walk somewhere you cannot fight it is a
           wall, and a wall you cannot see coming is just unfair
    */
    const tooFar = (m.dir < 0 && m.x <= m.homeX - M.RANGE) ||
                   (m.dir > 0 && m.x >= m.homeX + M.RANGE);

    if (tooFar || Level.isSolidAt(aheadCol, bodyRow) ||
        !Level.isSolidAt(aheadCol, floorRow)) {
      m.dir = -m.dir;
      m.x = Math.max(m.homeX - M.RANGE, Math.min(m.homeX + M.RANGE, m.x));
    }
  },

  _fly(m, dt) {
    const M = CONFIG.MONSTERS.FLYER;
    m.phase += dt * M.SPEED;
    m.y = m.homeY - Math.sin(m.phase) * M.RANGE;
  },

  _lurk(m, dt, player) {
    const M = CONFIG.MONSTERS.LURKER;
    const dx = (player.x + player.w / 2) - (m.x + m.w / 2);
    const dy = (player.y + player.h / 2) - (m.y + m.h / 2);
    const dist = Math.hypot(dx, dy);

    const T = CONFIG.TILE;
    const floorRow = Math.floor((m.y + m.h + 2) / T);
    const stepTo = (target, speed) => {
      const dir = target < m.x ? -1 : 1;
      const next = m.x + dir * speed * dt;
      if (Math.abs(target - m.x) < speed * dt) { m.x = target; return; }
      m.dir = dir;
      // It chases, but it doesn't walk off a cliff after you.
      const edge = dir < 0 ? next : next + m.w;
      if (Level.isSolidAt(Math.floor(edge / T), floorRow)) m.x = next;
    };

    /*
       IT IS ON A LEASH, AND GOING HOME IS A COMMITMENT.

       Two ways to lose it: get well clear, or lead it as far as it will
       go from its rock. Without the leash a lurker follows you the whole
       length of the level, which isn't a monster any more, it's a
       permanent condition -- and you could tow every lurker on the level
       into one heap behind you.

       `returning` is what makes it stick, and leaving it out cost me a
       failing test. Giving up put the lurker at the end of its leash,
       one step from home -- still well inside waking distance of the
       player who lured it there. So it woke straight back up, hit the
       leash again, gave up again, and juddered on the spot forever.

       Deciding to go home has to survive you standing right next to it.
    */
    if (m.returning) {
      if (Math.abs(m.x - m.homeX) < 2) { m.x = m.homeX; m.returning = false; }
      else stepTo(m.homeX, M.SPEED * 0.55);
      return;
    }

    if (!m.awake && dist < M.WAKE_RANGE) m.awake = true;
    if (!m.awake) return;

    if (dist > M.WAKE_RANGE * 2.2 || Math.abs(m.x - m.homeX) > M.RANGE) {
      m.awake = false;
      m.returning = true;
      return;
    }

    stepTo(player.x + player.w / 2 - m.w / 2, M.SPEED);
  },

  _fall(m, dt, player) {
    const M = CONFIG.MONSTERS.FALLER, T = CONFIG.TILE;
    const px = player.x + player.w / 2;

    if (m.state === 'waiting') {
      // Are you underneath it? Only then does it let go.
      if (px > m.x - M.TRIGGER && px < m.x + m.w + M.TRIGGER &&
          player.y > m.y) { m.state = 'warning'; m.timer = M.WARN; }

    } else if (m.state === 'warning') {
      /*
         IT SHUDDERS BEFORE IT DROPS.

         Without this beat of warning the faller is not a monster, it's a
         coin toss: it lets go the instant you are underneath, falls
         nearly twice as fast as you run, and there is no reaction on
         earth that gets you out from under it. Every playing style died
         at the same block on level 3 -- and a person would have died
         there too, and would have been right to be annoyed about it.

         A third of a second is enough to sprint clear if you keep going,
         and enough to stop dead if you'd rather wait. Either choice
         works, which is what makes it a decision instead of a tax.
      */
      m.timer -= dt;
      if (m.timer <= 0) m.state = 'falling';

    } else if (m.state === 'falling') {
      m.y += M.FALL_SPEED * dt;
      const below = Math.floor((m.y + m.h + 1) / T);
      const c0 = Math.floor(m.x / T), c1 = Math.floor((m.x + m.w - 1) / T);
      if (Level.isSolidAt(c0, below) || Level.isSolidAt(c1, below) ||
          m.y > Level.pixelHeight()) {
        m.state = 'resting'; m.timer = M.REST;
      }

    } else if (m.state === 'resting') {
      m.timer -= dt;
      if (m.timer <= 0) m.state = 'rising';

    } else {
      m.y -= M.RISE_SPEED * dt;
      if (m.y <= m.homeY) { m.y = m.homeY; m.state = 'waiting'; }
    }
  },


  /* ---------- BUMPING INTO THEM ---------- */

  /*
     Returns 'squashed', 'hit', or null.

     The order matters. Squashing is checked FIRST, because a stomp is
     also a touch: your feet are inside the monster at the moment you
     land on it. Test "did it get me" first and you can never kill
     anything -- you just die on top of it.
  */
  check(player, swinging) {
    for (const m of this.list) {
      if (!m.alive || m.squashed > 0) continue;

      /*
         A FALLER ONLY HURTS YOU WHILE IT IS FALLING.

         It drops on your head -- that's the whole monster. Once it has
         landed it is a rock sitting on the floor, and rocks sitting on
         the floor don't hurt anybody.

         The first version hurt you whenever you touched it, and that
         turned it from a monster into a WALL: it lands in the corridor,
         rests for a second, then climbs back up at a crawl, and for all
         that time nothing can get past. Every playing style died on the
         same block, over and over, on a level they had otherwise
         finished. A hazard you cannot pass, only outlive, is a locked
         door with a timer on it.
      */
      if (m.kind === 'faller' && m.state !== 'falling') continue;

      if (!this._overlaps(player, m)) continue;

      const M = CONFIG.MONSTERS;
      const killable = M[m.kind.toUpperCase()].KILLABLE;

      if (killable && swinging) {
        this._kill(m);
        return 'squashed';
      }

      if (killable && player.vy > 0) {
        // Coming DOWN onto its head: her feet have to still be in the
        // upper part of it, otherwise walking into one while falling
        // even slightly would count as a stomp.
        const feet = player.y + player.h;
        if (feet - player.vy * CONFIG.STEP <= m.y + m.h * M.STOMP_DEPTH) {
          this._kill(m);
          player.vy = CONFIG.PLAYER.JUMP_SPEED * M.BOUNCE;
          player.grounded = false;
          return 'squashed';
        }
      }

      return 'hit';
    }
    return null;
  },

  _kill(m) {
    m.alive = false;
    m.squashed = CONFIG.MONSTERS.SQUASH_TIME;
  },

  _overlaps(p, m) {
    return p.x < m.x + m.w && p.x + p.w > m.x &&
           p.y < m.y + m.h && p.y + p.h > m.y;
  },

  // Is there a monster in the way just ahead, on the ground? Used by the
  // robot in the tests, so it can jump instead of walking into things.
  aheadOf(player, look = 90) {
    for (const m of this.list) {
      if (!m.alive || m.squashed > 0) continue;
      const dx = m.x - (player.x + player.w);
      if (dx > -player.w && dx < look &&
          Math.abs(m.y - player.y) < CONFIG.TILE * 2) return m;
    }
    return null;
  },
};

if (typeof module !== 'undefined') module.exports = { Monsters };
