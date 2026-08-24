/*
  THE PLANET MAP

  Checks the maths that turns a spot on a ball into a spot on the
  screen, and the rule about which levels are open.
*/
const fs=require('fs'), vm=require('vm'), path=require('path');
const ROOT = __dirname + '/..';
const sandbox = { console:{log(){},warn(){},error(){}}, Math,
                  localStorage:{ getItem:()=>null, setItem:()=>{} } };
vm.createContext(sandbox);
for (const f of ['js/config.js','js/planet.js'])
  vm.runInContext(fs.readFileSync(path.join(ROOT,f),'utf8'), sandbox, {filename:f});
vm.runInContext('var Input={_touches:new Map(),tapped:null}; var Game={started:null,startLevel(k){this.started=k;}};', sandbox);
const g=n=>vm.runInContext(n,sandbox);
const CONFIG=g('CONFIG'), Planet=g('Planet'), Game=g('Game'), Input=g('Input');

let pass=0, fail=0;
const check=(n,c,e='')=>{ c?(pass++,console.log('  PASS  '+n)):(fail++,console.log('  FAIL  '+n+'  '+e)); };

Planet.init();

console.log('\n--- fifteen levels on a path ---');
check('there are fifteen', Planet.levels.length === 15, `${Planet.levels.length}`);
check('they are numbered 1 to 15',
      Planet.levels.every((l,i) => l.number === i+1));
check('level 1 is the tutorial', Planet.levels[0].key === 'tutorial');
check('level 2 is The Way Out',  Planet.levels[1].key === 'crystal-caves-1');
check('level 3 is The Illusions', Planet.levels[2].key === 'illusions');
check('they spiral round the planet rather than sitting in a heap',
      new Set(Planet.levels.map(l => Math.round(l.lat*10))).size > 8);

console.log('\n--- flat screen, round planet ---');
Planet.yaw = 0; Planet.pitch = 0; Planet.zoom = 1;
const front = Planet.project(0, 0);
const back  = Planet.project(0, Math.PI);
check('a spot facing you counts as visible', front.z > 0, `z=${front.z.toFixed(2)}`);
check('a spot round the back does not',      back.z  < 0, `z=${back.z.toFixed(2)}`);
check('the near side is drawn dead centre',
      Math.abs(front.x - CONFIG.WIDTH/2) < 1 && Math.abs(front.y - CONFIG.HEIGHT/2) < 1);

const edge = Planet.project(0, Math.PI/2);
check('a spot at the side lands on the rim',
      Math.abs(Math.abs(edge.x - CONFIG.WIDTH/2) - Planet.radius()) < 1);
check('nothing ever leaves the planet',
      Planet.levels.every(l => {
        const p = Planet.project(l.lat, l.lon);
        return Math.hypot(p.x - CONFIG.WIDTH/2, p.y - CONFIG.HEIGHT/2) <= Planet.radius() + 1;
      }));

console.log('\n--- turning it ---');
const before = Planet.project(0, 0).z;
Planet.yaw = Math.PI;
const after = Planet.project(0, 0).z;
check('turning it halfway round hides what was facing you',
      before > 0 && after < 0, `${before.toFixed(2)} -> ${after.toFixed(2)}`);
Planet.yaw = 0;

console.log('\n--- zooming ---');
Planet.setZoom(99);
check('cannot zoom in past the limit', Planet.zoom === CONFIG.PLANET.MAX_ZOOM);
Planet.setZoom(0.001);
check('cannot zoom out past the limit', Planet.zoom === CONFIG.PLANET.MIN_ZOOM);
Planet.setZoom(1);

console.log('\n--- unlocking ---');
check('level 1 is open from the start', Planet.isUnlocked(0));
check('level 2 is not', !Planet.isUnlocked(1));
check('none of the rest are',
      Planet.levels.slice(1).every((_, i) => !Planet.isUnlocked(i+1)));

Planet.complete('tutorial');
check('finishing level 1 ticks it off', Planet.levels[0].done);
check('...and opens level 2', Planet.isUnlocked(1));
check('...but not level 3', !Planet.isUnlocked(2));

console.log('\n--- tapping ---');
Planet.yaw = 0; Planet.pitch = 0;
// aim straight at level 1
const l0 = Planet.levels[0];
Planet.yaw = -l0.lon; Planet.pitch = l0.lat;
const p0 = Planet.project(l0.lat, l0.lon);
check('you can tap a level you can see', Planet.levelAt(p0.x, p0.y) === 0,
      `found ${Planet.levelAt(p0.x, p0.y)}`);
Game.started = null;
Planet.tap(p0.x, p0.y);
check('tapping an open level starts it', Game.started === 'tutorial');

Game.started = null;
Planet.levels[0].done = false;      // relock everything after level 1
const l4 = Planet.levels[4];
Planet.yaw = -l4.lon; Planet.pitch = l4.lat;
const p4 = Planet.project(l4.lat, l4.lon);
Planet.tap(p4.x, p4.y);
check('tapping a locked level does nothing', Game.started === null);

console.log('\n--- a fast tap still counts ---');
// The old code watched the list of fingers frame by frame, so a tap
// that started AND finished between two frames was never seen at all.
// Taps are now recorded by the pointer events themselves.
Planet.levels[0].done = false;
Game.started = null;
Planet.yaw = -Planet.levels[0].lon; Planet.pitch = Planet.levels[0].lat;
const pt = Planet.project(Planet.levels[0].lat, Planet.levels[0].lon);
Input.tapped = { x: pt.x, y: pt.y };
Input._touches.clear();                  // no finger on screen at all
Planet.update(1/60);
check('a tap with no finger ever seen on screen still works',
      Game.started === 'tutorial', `started ${Game.started}`);
check('and the tap is used up, not repeated', Input.tapped === null);

console.log('\n--- unlocked is not the same as playable ---');
/*
   Finishing level 3 unlocks level 4, which hasn't been built. The map
   used to pulse it gold and say "play me", and tapping did nothing.
*/
/*
   Don't hardcode WHICH level isn't built -- that number changes every
   time a level ships. Ask the map. This test named level 4 and broke
   the day level 4 was built, which is a test failing for being out of
   date rather than for finding anything.
*/
const nextUp = Planet.levels.findIndex(l => !l.key);
Planet.levels.forEach((l, i) => { l.done = i < nextUp; });
check(`finishing level ${nextUp} unlocks level ${nextUp + 1}`,
      Planet.isUnlocked(nextUp));
check(`...but level ${nextUp + 1} is NOT playable, because it does not exist yet`,
      !Planet.isPlayable(nextUp));
check('every built level that is unlocked IS playable',
      Planet.levels.slice(0, nextUp).every((_, i) => Planet.isPlayable(i)));
check('a locked level is never playable',
      !Planet.isPlayable(nextUp + 1) && !Planet.isUnlocked(nextUp + 1));
Game.started = null;
Planet.yaw = -Planet.levels[nextUp].lon; Planet.pitch = Planet.levels[nextUp].lat;
const notBuilt = Planet.project(Planet.levels[nextUp].lat, Planet.levels[nextUp].lon);
Planet.tap(notBuilt.x, notBuilt.y);
check('tapping a level that is not built does nothing at all',
      Game.started === null, `started ${Game.started}`);

console.log('\n--- nothing has gone to NaN ---');
check('every level projects to a real number',
      Planet.levels.every(l => {
        const p = Planet.project(l.lat, l.lon);
        return Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z);
      }));

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail?1:0);
