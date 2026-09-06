// Button tests. Both bugs AXY hit were here, so this is worth having.
const fs=require('fs'), vm=require('vm'), path=require('path');
const ROOT = __dirname + '/..';
const sandbox = { console: {log:()=>{}, warn:()=>{}, error:console.error}, Math };
vm.createContext(sandbox);
for (const f of ['js/config.js','js/input.js'])
  vm.runInContext(fs.readFileSync(path.join(ROOT,f),'utf8'), sandbox, {filename:f});
const g=n=>vm.runInContext(n,sandbox);
const CONFIG=g('CONFIG'), Input=g('Input');

let pass=0, fail=0;
const check=(n,c,e='')=>{ c?(pass++,console.log('  PASS  '+n)):(fail++,console.log('  FAIL  '+n+'  '+e)); };

Input._defineButtons();
const btn = id => Input._buttons.find(b=>b.id===id);
const touchAt = (x,y) => { Input._touches.clear(); Input._touches.set(1,{x,y}); Input.update(); };
const touchMany = pts => { Input._touches.clear(); pts.forEach((p,i)=>Input._touches.set(i,p)); Input.update(); };

console.log('\n--- buttons are far enough apart ---');
let tooClose = [];
for (let i=0;i<Input._buttons.length;i++)
  for (let j=i+1;j<Input._buttons.length;j++){
    const a=Input._buttons[i], b=Input._buttons[j];
    const gap=Math.hypot(a.x-b.x,a.y-b.y);
    if (gap < CONFIG.BUTTONS.HIT_RADIUS) tooClose.push(`${a.id}/${b.id} ${gap.toFixed(0)}px`);
  }
check('no two buttons are closer than their reach', tooClose.length===0, tooClose.join(', '));

console.log('\n--- all buttons are on screen ---');
const off = Input._buttons.filter(b =>
  b.x - CONFIG.BUTTONS.RADIUS < 0 || b.x + CONFIG.BUTTONS.RADIUS > CONFIG.WIDTH ||
  b.y - CONFIG.BUTTONS.RADIUS < 0 || b.y + CONFIG.BUTTONS.RADIUS > CONFIG.HEIGHT);
check('every button fits on screen', off.length===0, off.map(b=>b.id).join(','));

console.log('\n--- ONE FINGER CAN ONLY PRESS ONE BUTTON (the bug AXY found) ---');
const pairs = [['left','right'], ['jump','grapple']];
for (const [a,b] of pairs) {
  const A=btn(a), B=btn(b);
  let doubles = 0;
  // walk a finger all the way from the middle of one to the middle of the other
  for (let t=0; t<=1; t+=0.02) {
    touchAt(A.x + (B.x-A.x)*t, A.y + (B.y-A.y)*t);
    if (Input._pressed.size > 1) doubles++;
  }
  check(`a finger between ${a} and ${b} never presses both`, doubles===0, `${doubles} spots pressed both`);
}

console.log('\n--- and it still presses SOMETHING everywhere sensible ---');
touchAt(btn('left').x, btn('left').y);
check('centre of left presses left', Input.left && !Input.right);
touchAt(btn('right').x, btn('right').y);
check('centre of right presses right', Input.right && !Input.left);
touchAt(btn('jump').x, btn('jump').y);
check('centre of jump presses jump', Input.jump && !Input.grapple);
touchAt(btn('grapple').x, btn('grapple').y);
check('centre of grapple presses grapple', Input.grapple && !Input.jump);

console.log('\n--- the buttons are forgiving ---');
const j = btn('jump');
touchAt(j.x - CONFIG.BUTTONS.RADIUS - 20, j.y);
check('a near miss still counts as a press', Input.jump);

console.log('\n--- two thumbs at once ---');
touchMany([{x:btn('left').x,y:btn('left').y},{x:btn('jump').x,y:btn('jump').y}]);
check('can run and jump at the same time', Input.left && Input.jump && !Input.right);
touchMany([{x:btn('right').x,y:btn('right').y},{x:btn('grapple').x,y:btn('grapple').y}]);
check('can run and grapple at the same time', Input.right && Input.grapple);

console.log('\n--- press means the moment you press, not while held ---');
Input._touches.clear(); Input.update();
touchAt(btn('grapple').x, btn('grapple').y);
check('grapplePressed fires on the first frame', Input.grapplePressed);
Input.update();
check('and not on the second', !Input.grapplePressed && Input.grapple);

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail?1:0);
