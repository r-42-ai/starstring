/*
  THE MONSTERS

  Five kinds, all chosen by Nea, plus her two ways of fighting back:
  land on a head, or smash through one while swinging.

  Most of what's checked here is the stuff that is easy to get subtly
  wrong and impossible to see by eye at sixty frames a second: does a
  crawler actually turn round at the edge, does a lurker stay asleep
  until you're close, is a stomp still a stomp when your feet are one
  pixel deep.
*/
const fs = require('fs'), vm = require('vm'), path = require('path');
const ROOT = path.join(__dirname, '..');

let pass = 0, fail = 0;
const check = (n, c, e = '') =>
  c ? (pass++, console.log('  PASS  ' + n))
    : (fail++, console.log('  FAIL  ' + n + '  ' + e));

function world(map) {
  const sb = { console: { log() {}, warn() {}, error() {} }, Math };
  vm.createContext(sb);
  for (const f of ['js/config.js', 'js/level.js', 'js/camera.js',
                   'js/grapple.js', 'js/monsters.js', 'js/player.js'])
    vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), sb, { filename: f });
  vm.runInContext('var Input={left:false,right:false,jump:false,jumpPressed:false,' +
                  'grapple:false,grapplePressed:false,up:false,down:false};', sb);
  const g = n => vm.runInContext(n, sb);
  const LEVELS = g('LEVELS');
  LEVELS.__test = { name: 'test', map };
  const Level = g('Level'), Monsters = g('Monsters');
  Level.load('__test');
  Monsters.load(Level);
  return { CONFIG: g('CONFIG'), Level, Monsters, Player: g('Player'), sb };
}

const S = 1 / 60;

console.log('\n--- reading them out of the map ---');
{
  const w = world([
    '................',
    '................',
    '......~.........',
    '................',
    '..c....z...v..^.',
    '################',
  ]);
  const kinds = w.Monsters.list.map(m => m.kind).sort();
  check('all five letters become monsters',
        w.Monsters.list.length === 5, `${w.Monsters.list.length}`);
  check('and they are the right five',
        kinds.join(',') === 'crawler,faller,flyer,lurker,spikes', kinds.join(','));
  const crawler = w.Monsters.list.find(m => m.kind === 'crawler');
  check('a monster stands on the bottom of its own square',
        crawler.y + crawler.h === 5 * w.CONFIG.TILE,
        `${crawler.y + crawler.h} vs ${5 * w.CONFIG.TILE}`);
  check('a letter that means nothing is not a monster',
        !w.Monsters.list.some(m => !m.kind));
}

console.log('\n--- the crawler turns round at the edge ---');
{
  /*
     The test that matters most. Without an edge check a crawler walks
     off the ledge you carefully put it on and falls out of the level,
     so by the time you arrive the platform is empty.
  */
  const w = world([
    '................',
    '................',
    '................',
    '.....c..........',
    '...##########...',
    '................',
  ]);
  const m = w.Monsters.list[0];
  const p = { x: 99999, y: 0, w: 44, h: 92 };
  let minX = m.x, maxX = m.x, fell = false;
  for (let i = 0; i < 60 * 20; i++) {
    w.Monsters.update(S, p);
    minX = Math.min(minX, m.x); maxX = Math.max(maxX, m.x);
    if (m.y > 6 * w.CONFIG.TILE) fell = true;
  }
  const T = w.CONFIG.TILE;
  check('it never falls off', !fell);
  check('it stays on the platform, left end',  minX >= 3 * T - 4, `${minX} vs ${3*T}`);
  check('it stays on the platform, right end', maxX + m.w <= 13 * T + 4,
        `${maxX + m.w} vs ${13*T}`);
  check('it actually walks about rather than standing still',
        maxX - minX > 4 * T, `only moved ${Math.round(maxX - minX)}px`);
}

{
  /*
     RANGE has to make it turn round, not just tidy up after some other
     reason turned it. On a long corridor with no wall and no edge to
     hit, nothing else ever turns it -- and the clamp never runs.
  */
  const w = world([
    '................................................',
    '................................................',
    '................................................',
    '.....................c..........................',
    '################################################',
  ]);
  const m = w.Monsters.list[0];
  const p = { x: 999999, y: 0, w: 44, h: 92 };
  let minX = m.x, maxX = m.x;
  for (let i = 0; i < 60 * 60; i++) {
    w.Monsters.update(S, p);
    minX = Math.min(minX, m.x); maxX = Math.max(maxX, m.x);
  }
  const R = w.CONFIG.MONSTERS.CRAWLER.RANGE;
  check('on open ground it still turns round at its range',
        maxX - minX < R * 2 + 8,
        `wandered ${Math.round(maxX - minX)}px, range is ${R} each way`);
  check('...and it stays near where you put it',
        Math.abs(minX - m.homeX) <= R + 4 && Math.abs(maxX - m.homeX) <= R + 4);
  check('...but it does not just stand there', maxX - minX > R);
}

console.log('\n--- the flyer bobs, and stays put sideways ---');
{
  const w = world([
    '................',
    '................',
    '.....~..........',
    '................',
    '................',
    '################',
  ]);
  const m = w.Monsters.list[0];
  const p = { x: 99999, y: 0, w: 44, h: 92 };
  const startX = m.x;
  let lo = m.y, hi = m.y;
  for (let i = 0; i < 60 * 8; i++) {
    w.Monsters.update(S, p);
    lo = Math.min(lo, m.y); hi = Math.max(hi, m.y);
  }
  check('it goes up and down', hi - lo > 100, `${Math.round(hi - lo)}px`);
  check('it does not drift sideways', Math.abs(m.x - startX) < 1);
  check('it never leaves its patch of sky',
        hi - lo <= w.CONFIG.MONSTERS.FLYER.RANGE * 2 + 2);
}

console.log('\n--- the lurker sleeps until you are close ---');
{
  const w = world([
    '................',
    '................',
    '................',
    '.....z..........',
    '################',
    '################',
  ]);
  const m = w.Monsters.list[0];
  const T = w.CONFIG.TILE;
  const far  = { x: 14 * T, y: 3 * T - 92, w: 44, h: 92 };
  const near = { x: 8 * T,  y: 3 * T - 92, w: 44, h: 92 };

  for (let i = 0; i < 120; i++) w.Monsters.update(S, far);
  check('far away, it stays asleep', !m.awake);
  check('...and does not move', Math.abs(m.x - m.homeX) < 1);

  for (let i = 0; i < 30; i++) w.Monsters.update(S, near);
  check('close by, it wakes up', m.awake);
  const before = m.x;
  for (let i = 0; i < 60; i++) w.Monsters.update(S, near);
  check('and it comes after you', m.x > before + 20,
        `moved ${Math.round(m.x - before)}px`);

  for (let i = 0; i < 60 * 4; i++) w.Monsters.update(S, far);
  check('lead it too far from its rock and it gives up', !m.awake);
  for (let i = 0; i < 60 * 8; i++) w.Monsters.update(S, far);
  check('...and plods back home', Math.abs(m.x - m.homeX) < 2,
        `${Math.round(m.x)} vs home ${Math.round(m.homeX)}`);
  check('it never strays further than its leash',
        Math.abs(m.x - m.homeX) <= w.CONFIG.MONSTERS.LURKER.RANGE + 4);
}

console.log('\n--- the faller waits until you are underneath ---');
{
  const w = world([
    '................',
    '.....v..........',
    '................',
    '................',
    '................',
    '################',
  ]);
  const m = w.Monsters.list[0];
  const T = w.CONFIG.TILE;
  const away  = { x: 12 * T, y: 5 * T - 92, w: 44, h: 92 };
  const under = { x: 5 * T,  y: 5 * T - 92, w: 44, h: 92 };

  for (let i = 0; i < 120; i++) w.Monsters.update(S, away);
  check('nobody underneath, it just hangs there',
        m.state === 'waiting' && Math.abs(m.y - m.homeY) < 1);

  for (let i = 0; i < 6; i++) w.Monsters.update(S, under);
  check('walk under it and it shudders first', m.state === 'warning', m.state);
  check('...and it has NOT moved yet, so you can still get clear',
        Math.abs(m.y - m.homeY) < 1);

  const warn = w.CONFIG.MONSTERS.FALLER.WARN;
  check('the warning is long enough to run out from under it',
        warn * w.CONFIG.PLAYER.MAX_SPEED > w.CONFIG.MONSTERS.FALLER.WIDTH + 40,
        `${Math.round(warn * w.CONFIG.PLAYER.MAX_SPEED)}px of running`);

  for (let i = 0; i < Math.ceil(warn * 60) + 2; i++) w.Monsters.update(S, under);
  check('then it lets go', m.state === 'falling', m.state);

  for (let i = 0; i < 60 * 2; i++) w.Monsters.update(S, under);
  check('it stops when it hits the floor', m.state === 'resting' || m.state === 'rising');
  check('...and it stops ON the floor, not through it',
        m.y + m.h <= 5 * T + 4, `${m.y + m.h} vs ${5 * T}`);

  for (let i = 0; i < 60 * 12; i++) w.Monsters.update(S, away);
  check('then it climbs back up and waits again',
        m.state === 'waiting' && Math.abs(m.y - m.homeY) < 2,
        `${m.state} at y=${Math.round(m.y)}, home ${Math.round(m.homeY)}`);
}

console.log('\n--- fighting back, both of Nea\'s ways ---');
{
  const w = world([
    '................',
    '................',
    '................',
    '.....c..........',
    '################',
    '################',
  ]);
  const T = w.CONFIG.TILE;
  const m = w.Monsters.list[0];

  // Walking into it: you lose.
  const walker = { x: m.x - 30, y: m.y + m.h - 92, w: 44, h: 92, vy: 0, grounded: true };
  walker.x = m.x - 20;
  check('walking into one gets you', w.Monsters.check(walker, false) === 'hit');

  // Landing on its head: it loses.
  w.Monsters.reset();
  const stomper = { x: m.x, y: m.y - 88, w: 44, h: 92, vy: 400, grounded: false };
  check('landing on its head squashes it',
        w.Monsters.check(stomper, false) === 'squashed');
  check('...and it is dead', !w.Monsters.list[0].alive);
  check('...and you bounce back up', stomper.vy < 0, `vy=${stomper.vy}`);
  check('...by less than a whole jump, so you cannot cross a level on heads',
        stomper.vy > w.CONFIG.PLAYER.JUMP_SPEED,
        `${stomper.vy} vs ${w.CONFIG.PLAYER.JUMP_SPEED}`);

  // Swinging into it: it loses, and you keep going.
  w.Monsters.reset();
  const swinger = { x: m.x - 10, y: m.y, w: 44, h: 92, vy: 0, grounded: false };
  check('swinging into one smashes it', w.Monsters.check(swinger, true) === 'squashed');
  check('...and you are not bounced off course', swinger.vy === 0);

  // Standing still inside one is not a stomp.
  w.Monsters.reset();
  const still = { x: m.x, y: m.y, w: 44, h: 92, vy: 0, grounded: true };
  check('drifting into one at zero speed is not a stomp',
        w.Monsters.check(still, false) === 'hit');
}

console.log('\n--- spikes and fallers can never be beaten ---');
{
  const w = world([
    '................',
    '.....v..........',
    '................',
    '................',
    '.........^......',
    '################',
  ]);
  for (const m of w.Monsters.list) {
    // A faller is only dangerous mid-drop, so put it mid-drop.
    if (m.kind === 'faller') m.state = 'falling';
    const onTop   = { x: m.x, y: m.y - 88, w: 44, h: 92, vy: 400, grounded: false };
    const inSwing = { x: m.x, y: m.y, w: 44, h: 92, vy: 0, grounded: false };
    check(`you cannot stomp a ${m.kind}`,
          w.Monsters.check(onTop, false) === 'hit');
    check(`you cannot smash a ${m.kind} on the rope either`,
          w.Monsters.check(inSwing, true) === 'hit');
    w.Monsters.reset();
  }
}

console.log('\n--- a landed faller is just a rock ---');
{
  /*
     It drops on your head; that is the whole monster. Once it has landed
     it is scenery until it climbs back up. Hurting you while it sits
     there turned it into a wall -- it lands in the corridor and nothing
     can get past until it has finished resting and slowly risen.
  */
  const w = world([
    '................',
    '.....v..........',
    '................',
    '................',
    '................',
    '################',
  ]);
  const m = w.Monsters.list[0];
  const T = w.CONFIG.TILE;
  const under = { x: 5 * T, y: 5 * T - 92, w: 44, h: 92, vy: 0, grounded: true };

  m.state = 'falling';
  const inTheWay = { x: m.x, y: m.y, w: 44, h: 92, vy: 0, grounded: true };
  check('while it is dropping, it gets you',
        w.Monsters.check(inTheWay, false) === 'hit');

  w.Monsters.reset();
  for (let i = 0; i < 6; i++) w.Monsters.update(S, under);
  for (let i = 0; i < 60 * 2; i++) w.Monsters.update(S, under);
  const resting = { x: m.x, y: m.y, w: 44, h: 92, vy: 0, grounded: true };
  check('once it has landed, you can walk straight past it',
        w.Monsters.check(resting, false) === null, m.state);

  w.Monsters.reset();
  const waiting = { x: m.x, y: m.y, w: 44, h: 92, vy: 0, grounded: false };
  check('and hanging up there it is harmless too',
        w.Monsters.check(waiting, false) === null);
}

console.log('\n--- they all come back when you do ---');
{
  /*
     Dying and finding the monsters still dead would make a hard bit
     easier every time you failed it, until eventually you walked
     through an empty level. The wrong way round.
  */
  const w = world([
    '................',
    '................',
    '................',
    '..c..c..c.......',
    '################',
  ]);
  for (const m of w.Monsters.list) { m.alive = false; m.x += 200; }
  w.Monsters.reset();
  check('all of them are alive again', w.Monsters.list.every(m => m.alive));
  check('and back where they started',
        w.Monsters.list.every(m => m.x === m.homeX && m.y === m.homeY));
}

console.log('\n--- looking ahead (this is what the robot uses) ---');
{
  const w = world([
    '................',
    '................',
    '................',
    '.....c..........',
    '################',
  ]);
  const m = w.Monsters.list[0];
  const near = { x: m.x - 70, y: m.y + m.h - 92, w: 44, h: 92 };
  const far  = { x: m.x - 600, y: m.y + m.h - 92, w: 44, h: 92 };
  check('a monster just ahead is spotted', w.Monsters.aheadOf(near, 90) === m);
  check('one right across the level is not', w.Monsters.aheadOf(far, 90) === null);
  m.alive = false;
  check('a squashed one is not in the way any more',
        w.Monsters.aheadOf(near, 90) === null);
}

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
