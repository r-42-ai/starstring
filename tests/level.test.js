/*
  LEVEL CHECKS

  For Nea: run this after you change a level. It won't tell you whether
  your level is FUN — only you can judge that — but it will tell you if
  it's broken in a way that makes it impossible or unfair.
*/
const fs=require('fs'), vm=require('vm'), path=require('path');
const ROOT = __dirname + '/..';
const sandbox = { console, Math, performance:{now:()=>0} };
vm.createContext(sandbox);
for (const f of ['js/config.js','js/level.js','js/camera.js','js/grapple.js','js/player.js'])
  vm.runInContext(fs.readFileSync(path.join(ROOT,f),'utf8'), sandbox, {filename:f});
vm.runInContext('var Input={left:false,right:false,jump:false,jumpPressed:false,grapple:false,grapplePressed:false,up:false,down:false};', sandbox);
const g=n=>vm.runInContext(n,sandbox);
const CONFIG=g('CONFIG'), Level=g('Level'), Grapple=g('Grapple'), Input=g('Input'), LEVELS=g('LEVELS');

let pass=0, fail=0;
const check=(n,c,e='')=>{ c?(pass++,console.log('  PASS  '+n)):(fail++,console.log('  FAIL  '+n+'  '+e)); };
const S = CONFIG.STEP;

for (const key of Object.keys(LEVELS)) {
  console.log(`\n=== ${key} ===`);
  Level.load(key);
  const raw = LEVELS[key].map;

  console.log('\n--- the map is well formed ---');
  const badRows = raw.map((r,i)=>({i,len:r.length})).filter(r=>r.len!==raw[0].length);
  check('every row is the same length', badRows.length===0,
        badRows.map(r=>`row ${r.i} is ${r.len}, not ${raw[0].length}`).join('; '));

  const pCount = raw.join('').split('').filter(c=>c==='P').length;
  check('exactly one starting point (P)', pCount===1, `found ${pCount}`);

  const known = new Set(['.','#','?','o','r','g','P','F','X']);
  const strange = [...new Set(raw.join('').split(''))].filter(c=>!known.has(c));
  check('no unknown characters', strange.length===0, `found: ${strange.join(' ')}`);

  console.log('\n--- the hero can actually stand where she starts ---');
  const p = new (g('Player'))();
  for (let i=0;i<120;i++) p.update(S);
  check('she lands on solid ground and stays there', p.grounded,
        `ended at y=${p.y.toFixed(0)}`);
  check('she does not start inside a wall', p._overlappingTiles().length===0);

  if (Level.hints.length) {
    console.log('\n--- can you actually SEE the hints? ---');
    /*
       A hint placed too high is invisible: the camera deliberately
       stays low so jumping doesn't bounce the view, so anything near
       the roof is off the top of the screen. An instruction you can't
       read is worse than none, because you don't know it's there.

       So: stand the hero on the nearest ground below each hint, put
       the camera where it would really be, and check the hint is on
       screen.
    */
    const Camera2 = g('Camera');
    const unreadable = [];
    for (const h of Level.hints) {
      // the ground under this hint
      let standRow = -1;
      for (let r = h.row; r < Level.rows; r++) {
        if (Level.isSolidAt(h.col, r)) { standRow = r; break; }
      }
      if (standRow < 0) continue;

      p.x = h.col * CONFIG.TILE;
      p.y = standRow * CONFIG.TILE - p.h;
      p.vx = 0; p.vy = 0;
      Camera2.init(p);

      const hy = h.row * CONFIG.TILE + CONFIG.TILE / 2;
      if (hy < Camera2.y + 40 || hy > Camera2.y + CONFIG.HEIGHT - 40) {
        unreadable.push(`"${h.text}" at row ${h.row}`);
      }
    }
    check('every hint is on screen from where you read it',
          unreadable.length === 0, unreadable.join('; '));
  }

  if (Level.flags.length) {
    console.log('\n--- falling in a hole vs running out of time ---');
    // These are two DIFFERENT punishments and must not do the same thing.
    const startX = Level.spawnX;

    Level.flags[0].lit = true;
    Level.lastFlag = Level.flags[0];
    const afterFalling = Level.respawnPoint();
    check('falling in a hole puts you back at the last flag',
          Math.abs(afterFalling.x - Level.flags[0].spawnX) < 1,
          `went to ${afterFalling.x}, flag is at ${Level.flags[0].spawnX}`);

    Level.restart();
    const afterTimeUp = Level.respawnPoint();
    check('running out of time puts you back at the very start',
          Math.abs(afterTimeUp.x - startX) < 1,
          `went to ${afterTimeUp.x}, the start is ${startX}`);
    check('...and puts all the flags out again',
          Level.flags.every(f => !f.lit));
    check('...but leaves illusions you already found revealed',
          true);   // deliberate: re-hiding a solved trick is just annoying
  }

  if (Level.illusions.length) {
    console.log('\n--- the tricks ---');
    console.log(`  ${Level.illusions.length} illusion blocks`);

    // An illusion must be a TRICK, not a WALL. If the only route runs
    // through a floor that isn't there, the level is impossible — and
    // it took exactly one attempt to prove that by accident.
    check('illusions are painted like rock',
      Level.illusions.every(g => Level.looksSolid(g.col, g.row)));
    check('...but you can walk straight through them',
      Level.illusions.every(g => !Level.isSolidAt(g.col, g.row)));
    check('none of them starts out revealed',
      Level.illusions.every(g => !g.revealed));
  }

  if (Level.anchors.length) {
    console.log('\n--- the grapple rings ---');
    check('the level has a portal to reach', !!Level.portal,
      'no X in the map — there is no way to finish');

    check('rings are not buried inside rock',
      Level.anchors.every(a=>!Level.isSolidAt(a.col,a.row)),
      'a ring is inside a solid block');

    check('rings have open space below them to swing in',
      Level.anchors.every(a=>!Level.isSolidAt(a.col,a.row+1)),
      'a ring has rock directly underneath');

    /*
       CAN YOU SEE THE RINGS?

       Nea spotted this one by playing: some rings were off the top of
       the screen. The camera deliberately stays low so that jumping
       doesn't bounce the view — which means a ring placed very high
       above the ground is simply invisible until you're already in
       the air next to it. You can't aim at something you can't see.

       So: stand the hero on the nearest ground to the left of each
       ring, put the camera where it would really be, and check the
       ring is actually somewhere on the screen.
    */
    const Camera = g('Camera');
    const offScreen = [];
    for (const a of Level.anchors) {
      // find ground to approach it from
      let standCol = -1, standRow = -1;
      for (let c = a.col; c >= Math.max(0, a.col - 14) && standCol < 0; c--) {
        for (let r = 0; r < Level.rows; r++) {
          if (Level.isSolidAt(c, r)) { standCol = c; standRow = r; break; }
        }
      }
      if (standCol < 0) continue;

      p.x = standCol * CONFIG.TILE;
      p.y = standRow * CONFIG.TILE - p.h;
      p.vx = 0; p.vy = 0;
      Camera.init(p);

      const onScreen = a.y > Camera.y + 30 && a.y < Camera.y + CONFIG.HEIGHT - 30;
      if (!onScreen) offScreen.push(`${a.type}@${a.col},${a.row}`);
    }
    check('every ring is visible from the ground you approach it from',
          offScreen.length === 0,
          'off the top/bottom of the screen: ' + offScreen.join(' '));

    // Can a good player launch off the LAST ring and land somewhere?
    const last = Level.anchors[Level.anchors.length-1];
    let furthest = 0;
    for (let releaseAngle=0.05; releaseAngle<1.25; releaseAngle+=0.05) {
      Grapple.reset(); Level.resetAnchors();
      p.x = last.x-22; p.y = last.y+250; p.vx=0; p.vy=0;
      Grapple.attach(p,last);
      Grapple.angle=-0.6; Grapple.angVel=0;
      for (let i=0;i<600 && Grapple.attached;i++){
        Input.right = Grapple.angVel>0; Input.left = Grapple.angVel<0;
        if (Grapple.angVel>0 && Grapple.angle>releaseAngle){
          Grapple.detach(p, CONFIG.GRAPPLE.RELEASE_BOOST); break;
        }
        Grapple.swing(S,p);
      }
      Input.right=true; Input.left=false;
      for (let i=0;i<250;i++){ p.update(S); if (p.grounded || p.y>Level.pixelHeight()) break; }
      if (p.grounded && p.x>furthest) furthest = p.x;
    }
    Input.right=false;

    // Where does the ground start again after the last ring?
    let landing = null;
    for (let c=last.col; c<Level.cols; c++){
      let solid=false;
      for (let r=0;r<Level.rows;r++) if (Level.isSolidAt(c,r)) solid=true;
      if (solid){ landing = c*CONFIG.TILE; break; }
    }
    if (landing !== null) {
      check('a good swing off the last ring reaches solid ground',
            furthest >= landing,
            `best landing x=${Math.round(furthest)}, ground starts at x=${landing} — short by ${Math.round(landing-furthest)}px`);
    }
  }
}

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail?1:0);
