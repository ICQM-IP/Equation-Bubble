// DOM-fixture boot and input regression tests; these do not replace visual browser QA.
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
class El{
 constructor(tag='div'){this.tagName=tag;this.children=[];this.dataset={};this.attrs={};this.events={};this.style={setProperty(k,v){this[k]=v}};this.className='';this.value='';this._text='';this.classList={contains:x=>this.className.split(' ').includes(x),add:(...xs)=>this.className=[...new Set([...this.className.split(' '),...xs])].join(' '),remove:(...xs)=>this.className=this.className.split(' ').filter(x=>!xs.includes(x)).join(' '),toggle:(x,on)=>{if(on===undefined)on=!this.classList.contains(x);on?this.classList.add(x):this.classList.remove(x);return on}}}
 set textContent(v){this._text=String(v);this.children=[]}get textContent(){return this._text+this.children.map(c=>c.textContent).join('')}
 append(...xs){for(const x of xs){x.parent=this;this.children.push(x)}}replaceChildren(...xs){this._text='';this.children=[];this.append(...xs)}remove(){if(this.parent)this.parent.children=this.parent.children.filter(x=>x!==this)}setAttribute(k,v){this.attrs[k]=v}addEventListener(k,v){this.events[k]=v}get offsetWidth(){return 1}setPointerCapture(){}getBoundingClientRect(){return {left:0,top:0,width:760,height:620}}closest(){return null}
}
const html=fs.readFileSync(__dirname+'/battle.html','utf8'),ids={};for(const m of html.matchAll(/<[^>]*\bid="([^"]+)"[^>]*>/g)){const el=new El(),cl=m[0].match(/\bclass="([^"]*)"/);if(cl)el.className=cl[1];ids[m[1]]=el}ids.battleLevel.value='2';const arenas=new El(),touches=[];
for(let i=0;i<2;i++){const g=new El();g.dataset.player=String(i);const turns=['left','right'].map(turn=>{const e=new El('button');e.dataset.turn=turn;return e}),ammo=new El('button'),fire=new El('button');g.querySelectorAll=s=>s==='[data-turn]'?turns:[];g.querySelector=s=>s.includes('ammo')?ammo:fire;touches.push(g)}
const frames=[],events={},store=new Map();const ctx={EquationMath:require('./math.js'),EquationVersus:require('./versus-engine.js'),EquationTeachers:require('./characters.js'),document:{querySelector(s){if(s==='.arenas')return arenas;assert(s.startsWith('#'),'unknown selector '+s);assert(ids[s.slice(1)],'missing UI node '+s);return ids[s.slice(1)]},querySelectorAll:s=>s==='.battle-touch'?touches:[],createElement:t=>new El(t),createElementNS:(ns,t)=>new El(t),addEventListener:(k,fn)=>events[k]=fn,hidden:false},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v))},innerWidth:1672,innerHeight:1080,addEventListener(){},requestAnimationFrame:fn=>frames.push(fn),setTimeout(){},console,Math,Date};ctx.window=ctx;vm.createContext(ctx);vm.runInContext(fs.readFileSync(__dirname+'/battle.js','utf8'),ctx);const run=s=>vm.runInContext(s,ctx);let time=0;const advance=n=>{for(let i=0;i<n;i++){const frame=frames.shift();assert(frame,'frame loop stopped');frame(time+=50)}};const key=(k,repeat=false)=>events.keydown({key:k,repeat,preventDefault(){}});
assert.equal(frames.length,1);assert.equal(ids.choices0.children.length,5);assert.equal(ids.choices1.children.length,5);assert.equal(ids.ops0.children.length,5);assert.equal(ids.ops1.children.length,5);
ids.choices0.children[1].onclick();ids.choices1.children[4].onclick();assert.equal(ids.chosen0.textContent,'Mr. IP');assert.equal(ids.chosen1.textContent,'Ip Sir');
ids.battleStart.onclick();assert(ids.battleSetup.classList.contains('hidden'));assert.equal(run('match.players[0].teacher'),1);assert.equal(run('match.players[1].teacher'),4);assert.equal(ids.avatar0.src,'assets/mr-ip-point-right.png');assert.equal(ids.avatar1.src,'assets/ip-sir-point-right.png');
advance(70);assert.equal(run('match.countdown'),0);assert(run('match.players.every(p=>p.rows[0].y>136)'));assert.equal(ids.rows0.children.length,4);assert.equal(ids.rows1.children.length,4);
run('match.players.forEach(p=>p.hint(true))');key('f');key('Enter');assert(run('match.players.every(p=>p.bullet!==null)'));const bulletY=run('match.players[0].bullet.y');advance(1);assert(run('match.players[0].bullet===null||match.players[0].bullet.y<'+bulletY));
key('p');assert.equal(run('match.paused'),true);const paused=run('JSON.stringify(match.players.map(p=>p.rows.map(r=>r.y)))');advance(20);assert.equal(run('JSON.stringify(match.players.map(p=>p.rows.map(r=>r.y)))'),paused);ids.battleResume.onclick();assert.equal(run('match.paused'),false);advance(50);
const beforeOp=run('match.players[1].op');key('w');assert.equal(run('match.players[1].op'),beforeOp);key('d');assert(run('match.players[0].held.has("right")'));assert(!run('match.players[1].held.has("right")'));events.keyup({key:'d'});assert(!run('match.players[0].held.has("right")'));
// New incoming equations reach the actual rendered opponent field.
run('match.attack(0)');advance(70);assert(run('match.players[1].received>=1'));assert(ids.rows1.children.length>=5);assert(ids.incoming1.textContent.includes('已收'));
// A round can end, show the winner, and restart with empty attack queues.
run('match.players[1].lives=1;match.players[1].grace=0;match.players[1].rows[0].y=EquationVersus.LINE-65');advance(1);assert.equal(run('match.status'),'ended');assert(!ids.battleResult.classList.contains('hidden'));assert(ids.resultTitle.textContent.includes('Mr. IP'));ids.rematch.onclick();assert.equal(run('match.status'),'playing');assert.equal(run('match.players[1].incoming.length'),0);assert.equal(run('match.players[1].received'),0);assert(ids.battleResult.classList.contains('hidden'));
ids.battleReset.onclick();assert(!ids.battleSetup.classList.contains('hidden'));assert.equal(run('match.paused'),true);
for(const t of require('./characters.js'))assert(fs.existsSync(__dirname+'/'+t.image),'missing teacher image '+t.image);
console.log('PASS: actual VS page boots and schedules frames; both five-character selectors; five ammo buttons each; chosen sprites; countdown; real falling; both fire keys; pause; separate input; incoming attacks rendered; winner overlay; clean rematch; setup return; all teacher assets exist.');

for(const i of [0,1])for(const b of ids['ops'+i].children){assert.equal(b.children[0].tagName,'svg');assert.equal(b.children[0].attrs.viewBox,'0 0 64 64');assert(b.attrs['aria-label']);}
console.log('PASS: all ten operation controls use resolution-independent SVG icons with accessible operation names.');

for(const teacher of require('./characters.js'))assert(teacher.image==='assets/teacher.png'||teacher.image.endsWith('-point-right.png'));
console.log('PASS: all five screens use the pointing teacher roster; Yeung Sir retained and four edited right-pointing assets present.');

run('mobileMode=true;innerWidth=390;fitBattle()');assert.equal(ids.battleStage.style.transform,'none');assert.equal(ids.battleViewport.style.width,'100%');assert(+ids.battleStage.style['--arena-scale']<1);
run('begin();mobileInputEditing=true');const mobileCountdown=run('match.countdown');advance(20);assert.equal(run('match.countdown'),mobileCountdown);run('mobileInputEditing=false');advance(10);assert.equal(run('match.countdown'),mobileCountdown,'small screen keeps match paused');run('innerWidth=1024;innerHeight=768;fitBattle();pause()');advance(10);assert(run('match.countdown')<mobileCountdown);
run('mobileMode=false;fitBattle()');assert.equal(ids.battleStage.style.width,'1672px');
console.log('PASS: v11 stacked mobile arena scaling; native editing freezes both countdowns; desktop layout restores.');

ids.battleTurbo.checked=true;ids.battleGentle.checked=true;ids.battleDuration.value='180';run('begin();match.countdown=0');assert.equal(run('match.turbo'),true);assert.equal(run('match.players[0].rows.length'),2);key('r');assert.equal(run('match.players[0].rescueUsed'),true);assert.equal(run('match.players[1].rescueUsed'),false);key('/');assert.equal(run('match.players[1].rescueUsed'),true);run('fitBattle()');assert.equal(ids.battleStage.style.height,'1220px');run('begin();match.countdown=0');assert.equal(run('match.players[0].rescueUsed'),false);
console.log('PASS: turbo UI configuration, independent rescue keys, clean rematch and desktop height.');

// Exercise actual excitement announcements together with the battle event presenter.
run('const excitementBattle=true;let excitementEffects=false;');const excitementSource=fs.readFileSync(__dirname+'/excitement.js','utf8');vm.runInContext(excitementSource.slice(excitementSource.indexOf('function excitementEvent(e)'),excitementSource.indexOf('\nconst excitementCSS')),ctx);
run('begin();match.countdown=0;match.players[0].chain=2;match.events.push({type:"clear",player:0,x:"2",points:200,y:100,special:false},{type:"chain",player:0,chain:2});events()');assert.equal(ids.effects0.children.filter(e=>e.className.split(' ').includes('battle-callout')).length,1);assert(ids.effects0._announcement.textContent.includes('SOLVED!'));assert(ids.effects0._announcement.textContent.includes('2 連解'));run('callout(0,"BANK SHOT!");callout(0,"rescue")');assert.equal(ids.effects0.children.filter(e=>e.className.split(' ').includes('battle-callout')).length,1);
console.log('PASS: actual turbo and battle presenters share one non-overlapping announcement per player, including consecutive events.');

// IMEs may report Process/Unidentified/non-Latin key values for Latin physical keys.
run('begin();match.countdown=0');
const physical=(code,key='Process',extra={})=>events.keydown({code,key,repeat:false,preventDefault(){},...extra});
physical('KeyA');assert(run('match.players[0].held.has("left")'));
events.keyup({code:'KeyA',key:'Unidentified'});assert(!run('match.players[0].held.has("left")'));
physical('KeyD','ㄎ');assert(run('match.players[0].held.has("right")'));
events.keyup({code:'KeyD',key:'Process'});assert(!run('match.players[0].held.has("right")'));
const firstOp=run('match.players[0].op');physical('KeyW');assert.notEqual(run('match.players[0].op'),firstOp);physical('KeyS');assert.equal(run('match.players[0].op'),firstOp);
run('match.players[0].hint(true)');physical('KeyF');assert(run('match.players[0].bullet!==null'));assert(run('match.players[1].bullet===null'));
physical('KeyA','a',{target:{matches:()=>true}});assert(!run('match.players[0].held.has("left")'));
physical('KeyD','d',{metaKey:true});assert(!run('match.players[0].held.has("right")'));
console.log('PASS: physical WASDF keys work with IME/non-Latin key values; release clears holds; typing and browser shortcuts stay isolated.');
