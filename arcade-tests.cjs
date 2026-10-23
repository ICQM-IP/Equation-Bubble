// UI-state tests in a deterministic DOM fixture. These do not substitute for visual browser QA.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
class Element{
 constructor(tag='div'){this.tagName=tag;this.children=[];this.dataset={};this.style={setProperty(k,v){this[k]=v}};this.attrs={};this.className='';this._text='';this.value='';this.checked=false;this.events={};this.classList={add:(...xs)=>this.className=[...new Set([...this.className.split(' '),...xs])].join(' '),remove:(...xs)=>this.className=this.className.split(' ').filter(x=>!xs.includes(x)).join(' '),toggle:(x,on)=>{const has=this.className.split(' ').includes(x);if(on===undefined)on=!has;on?this.classList.add(x):this.classList.remove(x);return on}}}
 set textContent(v){this._text=String(v);this.children=[]}get textContent(){return this._text+this.children.map(c=>c.textContent).join('')}
 append(...xs){for(const x of xs){x.parent=this;this.children.push(x)}}replaceChildren(...xs){this._text='';this.children=[];this.append(...xs)}remove(){if(this.parent)this.parent.children=this.parent.children.filter(x=>x!==this)}setAttribute(k,v){this.attrs[k]=v}addEventListener(k,v){this.events[k]=v}get offsetWidth(){return 1}setPointerCapture(){}getBoundingClientRect(){return {left:276,top:120,width:1120,height:660}}closest(){return null}
}
const html=fs.readFileSync(__dirname+'/arcade.html','utf8'),ids={};for(const m of html.matchAll(/id="([^"]+)"/g))ids[m[1]]=new Element();ids.startLevel.value='2';ids.paceMode=new Element('select');ids.paceMode.value='normal';ids.practice.checked=true;
const buttons=['+','−','×','÷','LCM'].map(op=>{const e=new Element('button');e.dataset.op=op;return e}),holds=['left','right'].map(d=>{const e=new Element('button');e.dataset.hold=d;return e}),path=new Element('path'),events={};
const frameQueue=[];
const context={EquationTeachers:require('./characters.js'),EquationMath:require('./math.js'),document:{querySelector(s){if(s==='#trajectory path')return path;assert(s[0]==='#','unexpected selector '+s);assert(ids[s.slice(1)],'missing element '+s);return ids[s.slice(1)]},querySelectorAll(s){return s==='[data-op]'?buttons:holds},createElement:tag=>new Element(tag),createElementNS:(ns,tag)=>new Element(tag),addEventListener:(k,v)=>events[k]=v,hidden:false},innerWidth:1672,innerHeight:941,addEventListener(){},requestAnimationFrame(fn){frameQueue.push(fn)},setTimeout(){},location:{reload(){}},console,Math};context.window=context;vm.createContext(context);vm.runInContext(fs.readFileSync(__dirname+'/arcade.js','utf8'),context);
assert.equal(frameQueue.length,1,'page load must schedule the real animation loop');
ids.practice.checked=false;ids.start.onclick();
const bootY=vm.runInContext('rows[0].y',context);
for(let i=1;i<=20;i++){assert(frameQueue.length,'frame loop must continue');frameQueue.shift()(i*50)}
assert(vm.runInContext('rows[0].y',context)>bootY,'actual scheduled frames must move equations');
ids.fire.onclick();assert(vm.runInContext('bullet!==null',context),'fire button must launch');
for(let i=21;i<=25;i++)frameQueue.shift()(i*50);
assert(vm.runInContext('bullet===null||bullet.index>0',context),'scheduled frames must advance the projectile');
ids.practice.checked=true;
console.log('PASS: page boot schedules frame loop; start button triggers falling; fire button launches and scheduled frames advance the projectile.');
vm.runInContext('function preparePair(){reset();if(document.querySelector("#paceMode").value==="normal"){frantic=false;PACE.maxRows=3;PACE.spawnTime=10;while(rows.length>2)remove(rows[rows.length-1]);rows[0].y=180;rows[1].y=15;rows[1].e=M.eq(2,-2,0,8);rows[1].original=rows[1].e;for(const r of rows)renderRow(r);hint(true)}}',context);
const run=s=>vm.runInContext(s,context),step=n=>run(`for(let i=0;i<${n};i++){testTime+=50;tick(testTime)}`);run('let testTime=0;last=0;preparePair();energy=0;rows[0].e=M.eq(3,-2,0,4);rows[0].original=rows[0].e;renderRow(rows[0]);hint(true)');
assert.equal(run('loaded.label'),'+2');assert.equal(buttons.filter(b=>b.attrs['aria-pressed']==='true').length,1);assert.equal(buttons[0].attrs['aria-pressed'],'true');
run('load(1)');assert.equal(buttons[1].attrs['aria-pressed'],'true');run('hint(true)');assert.equal(run('trace().hit.node.key'),'lb');
run('launch()');step(10);assert(run('busy'));assert(ids.teachingMath.textContent.includes('+2'));assert.equal(run('rows[0].e.l.b.toString()'),'-2');
run('togglePause()');const elapsed=run('phase.elapsed');step(50);assert.equal(run('phase.elapsed'),elapsed);run('togglePause()');step(50);
assert.equal(run('rows[0].e.l.b.toString()'),'0');assert.equal(run('rows[0].e.r.b.toString()'),'6');assert.equal(run('cleared'),0);
run('hint(true)');assert.equal(run('loaded.label'),'÷3');run('launch()');step(100);assert.equal(run('cleared'),1);assert.equal(run('score'),120);
// Premature division is rejected even when the physical projectile hits the coefficient.
run('rows[0].e=M.eq(5,5,0,35);rows[0].original=rows[0].e;renderRow(rows[0]);busy=false;hit({token:version,hit:{r:rows[0],node:rows[0].nodes[0]},ammo:{op:"÷",kind:"scale",v:M.q(5)}})');assert.equal(run('rows[0].e.l.b.toString()'),'5');assert.equal(run('busy'),false);
// Reset in the middle of a flight cannot apply an obsolete hit.
run('hint(true);launch();const oldBullet=bullet;preparePair();hit(oldBullet)');assert.equal(run('score'),0);assert.equal(run('cleared'),0);
// Responsive coordinates preserve the design's geometry.
run('innerWidth=834;innerHeight=500;fit()');assert.equal(ids.stage.style.transform,'scale(0.4988038277511962)');
console.log('PASS: startup; yellow ammo selection; physical target hit; both-side operation phase; pause during animation; simplification; automatic solution clear; invalid division rejection; reset safety; responsive scale.');



// Shooting no longer causes a discrete pressure drop.
run('preparePair();practice=false;energy=0;const initialY=rows[0].y');step(100);assert(run('rows[0].y>initialY'));run('const beforeShotsY=rows[0].y;for(let i=0;i<8;i++){launch();bullet=null;busy=false;reject("test miss");settlePressure()}');assert.equal(run('rows[0].y'),run('beforeShotsY'));
// Matching equations no longer cause a cross-equation chain.
run('preparePair();hint(true);launch()');step(130);assert.equal(run('chains'),0);assert.equal(run('rows[0].e.l.b.toString()'),'0');assert.equal(run('rows[1].e.l.b.toString()'),'-2');assert.equal(run('rows[0].e.r.b.toString()'),'6');assert.equal(run('rows[1].e.r.b.toString()'),'8');assert.equal(run('score'),10);assert.equal(ids.links.children.length,0);
// Insufficient energy gives only one operation; an incompatible scale cannot link.
run('preparePair();energy=0;hint(true);launch()');step(90);assert.equal(run('chains'),0);assert.equal(run('rows[1].e.l.b.toString()'),'-2');
run('rows[0].e=M.eq(5,0,0,30);rows[1].e=M.eq(5,5,0,35)');assert.equal(run('linkedMove(rows[0],M.moves(rows[0].e).find(m=>m.op==="÷"))'),null);
// A real wall-reflected trajectory, not just a synthetic bonus flag.
run('preparePair();energy=0;rows[0].y=50;rows[1].y=-100;for(const r of rows)renderRow(r);let bankAngle=null;for(let a=-70;a<0;a+=.1){angle=a;const tr=trace();if(tr.bounces>0&&tr.hit?.r===rows[0]&&tr.hit.node.key==="lb"){bankAngle=a;break}}');assert.notEqual(run('bankAngle'),null);run('angle=bankAngle;launch()');step(120);assert.equal(run('bankShots'),1);assert.equal(run('score'),85);assert.equal(run('energy'),0);
// Pressure loss and pause safety.
run('preparePair();practice=false;energy=0;rows[0].y=LIMIT-100;descend(.05)');assert.equal(run('lives'),2);
run('preparePair();practice=false;shotsLeft=1;togglePause()');step(100);assert.equal(run('shotsLeft'),1);assert.equal(run('paused'),true);
console.log('PASS: no shot-count pressure; continuous descent; single-equation shots; no cross-equation chain; actual wall bounce bonus; energy budget; collision loss; pause safety.');

run('preparePair();practice=true;const practiceY=rows[0].y');step(100);assert.equal(run('rows[0].y'),run('practiceY'));
run('preparePair();practice=false;togglePause();const pausedY=rows[0].y');step(100);assert.equal(run('rows[0].y'),run('pausedY'));
run('togglePause();rows[0].y=LIMIT-110-.1');step(1);assert.equal(run('lives'),2);
console.log('PASS: equations descend without shooting; practice and pause stop descent; crossing danger line loses a life.');

run('preparePair();practice=false;const rewardRow=rows[0];rewardRow.e=M.eq(1,0,0,2);rewardRow.original=M.eq(3,-2,0,4);clearSolved(rewardRow);const rewardY=rows[0].y');
assert.equal(run('score'),100);assert.equal(run('canAct()'),false);assert(ids.field.children.some(e=>e.className==='solution-reward'));
step(5);assert.equal(run('rows[0].y'),run('rewardY'));run('togglePause();const frozenReward=rewardTimer');step(30);assert.equal(run('rewardTimer'),run('frozenReward'));run('togglePause()');step(30);assert.equal(run('canAct()'),true);assert(run('rows[0].y>rewardY'));
console.log('PASS: solved-answer celebration; reward does not duplicate score; brief success freeze; pause/resume of freeze; play resumes automatically.');

// Frantic mode keeps other equations falling during shots and teaching animations.

ids.paceMode.value='frantic';ids.practice.checked=false;run('preparePair();energy=0;const crowdedCount=rows.length;const firstFlightY=rows[0].y;hint(true);launch()');step(2);assert.equal(run('crowdedCount'),4);assert(run('rows[0].y>firstFlightY'));
run('preparePair();energy=0;hint(true);launch()');step(12);assert(run('phase!==null'));run('const locked=phase.r;const lockedY=locked.y;const otherMoving=rows.find(r=>r!==locked&&r.y>=0);const otherY=otherMoving.y');step(3);assert.equal(run('locked.y'),run('lockedY'));assert(run('otherMoving.y>otherY'));
run('togglePause();const panicPauseY=rows[0].y');step(30);assert.equal(run('rows[0].y'),run('panicPauseY'));
console.log('PASS: four-equation opening; real-time falling during projectile flight; moving-target collision; only active equation freezes during teaching; pause still stops all motion.');


run('preparePair()');assert.equal(run('rows.length'),4);assert.equal(run('rows.filter(r=>r.lane===0).length'),2);assert.equal(run('rows.filter(r=>r.lane===1).length'),2);
assert(run('rows.every(r=>r.height===76&&r.nodes.every(n=>n.x>=r.lane*W/2&&n.x+n.w<=(r.lane+1)*W/2))'));
run('for(const r of rows)if(r.lane===0)r.y+=150;const filled=refillDense()');assert.equal(run('filled'),true);assert.equal(run('rows.length'),5);assert.equal(run('rows[4].lane'),0);
assert(run('rows.every((a,i)=>rows.every((b,j)=>i===j||a.lane!==b.lane||Math.abs(a.y-b.y)>=a.height))'));
console.log('PASS: four real equations in two columns; two layers per column; compact hitboxes; lane-aware replenishment; no overlapping equations.');

run('preparePair()');assert(run('new Set(rows.map(r=>Math.round(r.scatterX))).size>=2'));assert(run('new Set(rows.filter(r=>r.lane===0).map(r=>Math.round(r.y%70))).size>=1'));
const firstLayout=run('rows.map(r=>r.y+","+r.scatterX).join("|")');run('preparePair()');assert.notEqual(run('rows.map(r=>r.y+","+r.scatterX).join("|")'),firstLayout);
console.log('PASS: irregular horizontal placement; staggered layer heights; layouts vary between waves while maintaining readable equation order.');

ids.paceMode.value='normal';ids.practice.checked=false;
run('preparePair();const slowY=rows[0].y');step(20);assert(Math.abs(run('rows[0].y-slowY')-7.5)<.001);
console.log('PASS: matching equations remain independent; no chain lines or energy rewards; descent reduced by 50%; no discrete pressure drop.');

ids.paceMode.value='normal';ids.practice.checked=true;
run('preparePair();rows[0].e=M.eq(2,-7,0,13);rows[0].original=rows[0].e;rows[1].e=M.eq(3,-4,0,8);rows[1].original=rows[1].e;renderRow(rows[0]);renderRow(rows[1]);selected=rows[0];hint(true)');
assert.equal(run('loaded.label'),'+7');assert.equal(ids.cannonAmmo.textContent,'+7');assert.equal(run('cartridges().length'),5);
run('for(let i=0;i<5;i++)load(1)');assert.equal(run('loaded.label'),'+7');
run('launch()');step(100);assert.equal(run('rows[0].e.l.b.toString()'),'0');assert.equal(run('rows[0].e.r.b.toString()'),'20');assert.equal(run('rows[1].e.l.b.toString()'),'-4');
run('rows[0].e=M.eq(3,-4,0,8);rows[0].original=rows[0].e;renderRow(rows[0]);ammoIndex=OPS.indexOf("+");hint(true)');assert.equal(run('loaded.label'),'+4');
run('ammoIndex=OPS.indexOf("÷");load()');assert.equal(run('loaded.label'),'÷?');
console.log('PASS: -7 target loads +7 despite another +4 equation; five operation types only; +7 applies to both sides; other equation unchanged; target changes update operand; premature division has no valid ammo.');

ids.paceMode.value='normal';run('reset()');assert.equal(run('rows.length'),4);
run('for(const r of [...rows])remove(r);startWave()');assert.equal(run('rows.length'),1);
ids.paceMode.value='frantic';run('reset()');assert.equal(run('rows.length'),4);run('for(const r of [...rows])remove(r);startWave()');assert.equal(run('rows.length'),1);
console.log('PASS: single standard pace opens with four equations; empty-board replenishment adds exactly one in both modes; four-equation opening retained; shooting cannot trigger pressure drops.');

ids.paceMode.value='normal';ids.practice.checked=true;
run('preparePair();rows[0].e=M.eq(3,-21,0,-15,{k:3,b:-7});rows[0].original=rows[0].e;renderRow(rows[0]);selected=rows[0];hint(true)');assert.equal(run('loaded.label'),'÷3');assert.equal(run('trace().hit.node.key'),'group');run('launch()');step(10);assert(ids.teachingMath.textContent.includes('3(x − 7)'));assert(ids.teachingMath.textContent.includes('÷3'));step(70);assert.equal(run('rows[0].e.l.b.toString()'),'-7');assert.equal(run('rows[0].e.r.b.toString()'),'-5');run('hint(true)');assert.equal(run('loaded.label'),'+7');
console.log('PASS: bracket target auto-loads ÷3; teaching keeps original brackets and shows division on both sides; simplification unlocks +7.');

run('preparePair();rows[0].e=M.eq(-1,0,0,2);rows[0].original=rows[0].e;renderRow(rows[0]);selected=rows[0];hint(true)');assert.equal(run('loaded.label'),'÷(-1)');assert.equal(ids.cannonAmmo.textContent,'÷(-1)');run('launch()');step(10);assert.equal(ids.teachingMath.textContent.split('÷(-1)').length-1,2);step(70);assert.equal(run('cleared'),1);
console.log('PASS: cannon previews ÷(-1), both animation sides show ÷(-1), exact solution still clears normally.');

const fractionDemo=new Element();context.fractionDemo=fractionDemo;run('renderMath(fractionDemo,"÷(-1/2)")');assert.equal(fractionDemo.attrs['aria-label'],'÷(-1/2)');const frac=fractionDemo.children.find(e=>e.className==='stack-frac');assert(frac);assert.equal(frac.children[0].textContent,'1');assert.equal(frac.children[1].textContent,'2');assert(!fractionDemo.textContent.includes('/'));assert(fractionDemo.textContent.includes('−'));
run('preparePair();rows[0].e=M.eq("-1/2",0,0,2);rows[0].original=rows[0].e;renderRow(rows[0]);selected=rows[0];hint(true);ammoIndex=OPS.indexOf("÷");load()');assert.equal(run('loaded.label'),'÷(-1/2)');assert(ids.cannonAmmo.children.some(e=>e.className==='stack-frac'));assert(run('rows[0].nodes[0].el.children.some(e=>e.className==="stack-frac")'));
console.log('PASS: fractions use numerator/denominator DOM layers and a CSS bar; no visible slash; negative sign outside fraction; equation and cannon use the same notation.');

run('preparePair();rows[0].e=M.eq("1/2","1/5",0,3);rows[0].original=rows[0].e;renderRow(rows[0]);selected=rows[0];hint(true)');assert.equal(run('loaded.label'),'×10');assert.equal(ids.cannonAmmo.textContent,'×10');assert.equal(ids.ammoText.textContent,'×10');run('launch()');assert.equal(ids.projectile.textContent,'×10');
console.log('PASS: LCM cannon, ammo display and flying projectile all show ×10 without LCM prefix.');

assert(!html.includes('id="paceMode"'));run('reset()');assert.equal(run('frantic'),true);assert.equal(run('rows.length'),4);
console.log('PASS: no pace selector; standard game always uses the former frantic settings; four-equation opening retained.');


for(let teacherId=0;teacherId<5;teacherId++){ids.singleTeacher.value=String(teacherId);run('chooseSingleTeacher()');assert.equal(ids.teacher.src,require('./characters.js')[teacherId].image)}
assert(html.includes('href="battle.html"'));console.log('PASS: single-player menu links to VS mode and supports all five teacher sprites.');

// v10: progressive hints do not immediately choose ammo or aim.
ids.learningMode.value='assist';run('preparePair();hintKey=null;hintLevel=0;angle=30;ammoIndex=2;updateAim();hint()');assert.equal(run('angle'),30);assert.equal(run('ammoIndex'),2);assert.equal(run('hintLevel'),1);run('hint()');assert.equal(run('angle'),30);assert.equal(run('hintLevel'),2);run('hint()');assert.equal(run('hintLevel'),3);assert.equal(run('trace().hit.node.key'),'lb');
// Challenge requires a manual operand and snapshots the entered value in flight.
ids.learningMode.value='challenge';run('preparePair();hint(true)');assert.equal(ids.manualAmmo.hidden,false);assert.equal(ids.ammoValue.value,'2');ids.ammoValue.value='';run('load();launch()');assert.equal(run('bullet'),null);ids.ammoValue.value='4';run('load();launch()');assert.equal(run('bullet.ammo.v.toString()'),'4');run('bullet=null;busy=false');ids.ammoValue.value='1/0';run('load();launch()');assert.equal(run('bullet'),null);
// Keyboard shortcuts cannot steal input while typing fractions or negatives.
const op=run('ammoIndex');events.keydown({key:'ArrowDown',target:{matches:()=>true},preventDefault(){throw Error('stole input')}});assert.equal(run('ammoIndex'),op);
// Advancing a stage clears stale previous-level equations.
ids.learningMode.value='assist';run('preparePair();cleared=3;rows[0].original=M.eq(1,0,0,2);rows[0].e=rows[0].original;clearSolved(rows[0])');assert.equal(run('level'),3);assert.equal(run('rows.length'),0);run('startWave()');assert(run('rows.every(r=>!r.e.r.a.eq(0)||M.verify(r.original,M.solution(r.e)))'));
// A cluster of equations crossing the line loses only one heart during grace.
run('preparePair();frantic=true;practice=false;rows[0].lane=0;rows[1].lane=1;for(const r of rows)r.y=LIMIT;descend(.05)');assert.equal(run('lives'),2);assert.equal(run('graceTimer'),1.8);run('descend(1)');assert.equal(run('lives'),2);
console.log('PASS: v10 staged reachable hints; challenge validation and immutable shot operand; typing preserves input; clean stage transitions; single-life cluster protection.');

// v11 mobile core: larger one-column targets and stable pointer geometry.
run('mobileMode=true;reset()');assert.equal(run('rows.length'),2);assert(run('rows.every(r=>r.lane===0&&r.height===132)'));assert.equal(run('PACE.maxRows'),4);run('hint(true);launch()');step(120);assert.equal(run('score'),10);
// Input editing freezes physics, bullets and animation without opening an overlay.
run('reset();mobileInputEditing=true;practice=false');const mobileY=run('JSON.stringify(rows.map(r=>r.y))');step(20);assert.equal(run('JSON.stringify(rows.map(r=>r.y))'),mobileY);run('mobileInputEditing=false');step(5);assert.notEqual(run('JSON.stringify(rows.map(r=>r.y))'),mobileY);
run('innerWidth=390;innerHeight=844;fit()');assert.equal(ids.stage.style.width,'1120px');assert.equal(ids.viewport.style.width,'390px');run('innerWidth=844;innerHeight=390;fit()');assert(parseFloat(ids.viewport.style.height)<=334);assert(parseFloat(ids.viewport.style.width)<=558);
// Load the actual mobile bridge against this DOM fixture, including native input focus.
context.document.body=new Element('body');context.document.body.classList.contains=x=>context.document.body.className.split(' ').includes(x);ids.overlay.parentElement=ids.stage;ids.stage.append(ids.overlay);run('mobileMode=false;busy=false;phase=null;bullet=null');vm.runInContext(fs.readFileSync(__dirname+'/mobile.js','utf8'),context);
run('setDeviceMode(true)');assert.equal(ids.deviceToolbar.hidden,false);assert.equal(ids.mobileControls.hidden,false);assert.equal(ids.overlay.parent,context.document.body);assert.equal(run('mobileMode'),true);
ids.mobileValue.events.focus();assert.equal(run('mobileInputEditing'),true);ids.mobileValue.value='-1/2';ids.mobileValue.events.input();assert.equal(ids.ammoValue.value,'-1/2');ids.mobileValue.events.blur();assert.equal(run('mobileInputEditing'),false);run('setDeviceMode(false)');assert.equal(ids.overlay.parent,ids.stage);assert.equal(ids.mobileControls.hidden,true);
console.log('PASS: v11 mobile opening, collision geometry, input pause, portrait/landscape fit, real mobile script boot, menu relocation, native input sync and desktop return.');

// v12 fixed readout preserves stacked-fraction DOM and avoids rebuilding unchanged content.
Object.defineProperty(Element.prototype,'childNodes',{get(){return this.children},configurable:true});
Element.prototype.cloneNode=function(deep){const c=new Element(this.tagName);c.className=this.className;c.attrs={...this.attrs};c._text=this._text;if(deep)c.append(...this.children.map(n=>n.cloneNode(true)));return c;};
run('setDeviceMode(true);renderMath(document.querySelector("#teachingMath"),"x = -1/2");syncMobileHud()');
const copiedFraction=ids.mobileMath.children.find(n=>n.className==='stack-frac');assert(copiedFraction,'fixed readout must contain a real stacked fraction');assert.equal(copiedFraction.children[0].textContent,'1');assert.equal(copiedFraction.children[1].textContent,'2');assert.notEqual(copiedFraction,ids.teachingMath.children.find(n=>n.className==='stack-frac'));run('syncMobileHud()');assert.equal(ids.mobileMath.children.find(n=>n.className==='stack-frac'),copiedFraction);
run('setDeviceMode(false)');console.log('PASS: v12 fixed board preserves fraction DOM, keeps the source intact and caches unchanged frames.');

// v13 real single-player timer obeys pause/editor locks; fixed topic never advances.
ids.learningMode.value='assist';ids.sessionLength.value='180';ids.gentlePace.checked=true;ids.startLevel.value='1';ids.practice.checked=true;run('reset()');assert.equal(run('rows.length'),1);assert.equal(run('sessionLimit'),180);step(10);const sessionTime=run('sessionElapsed');assert(sessionTime>0);run('togglePause()');step(10);assert.equal(run('sessionElapsed'),sessionTime);run('togglePause();mobileInputEditing=true');step(10);assert.equal(run('sessionElapsed'),sessionTime);run('mobileInputEditing=false;sessionElapsed=179.99');step(1);assert.equal(run('running'),false);assert(ids.overlay.textContent.includes('0/0'));
ids.sessionLength.value='0';ids.fixedTopic.checked=true;run('reset();cleared=3;rows[0].e=M.eq(1,0,0,2);rows[0].original=M.eq(3,0,0,6);clearSolved(rows[0])');assert.equal(run('level'),1);assert.equal(run('learningStats.solved'),1);assert.equal(run('cleared'),4);assert.equal(run('running'),true);
console.log('PASS: v13 solo gentle opening, real timer, paused/editor timer locks, timed results, fixed topic and verified solve statistics.');
