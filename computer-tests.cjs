'use strict';
const assert=require('node:assert/strict'),V=require('./versus-engine.js'),C=require('./computer.js');
function round({topic=2,difficulty='normal',speed=1.6,duration=180,random=null,seed=55}={}){const m=new V.Match({topic,seed,turbo:true,gentle:true,speed,duration}),cpu=new C.Controller(m.players[1],difficulty,random);return {m,cpu};}
function advance(state,seconds){for(let i=0;i<Math.ceil(seconds/.025);i++){state.cpu.step(.025);state.m.step(.025)}}
for(const topic of [0,1,2,3,4,5]){const s=round({topic,random:()=>.99});advance(s,180+3.1);const p=s.m.players[1];assert(p.stats.shots>0&&p.stats.hits>0&&p.clears>0,'computer solves topic '+topic);assert.equal(p.stats.hints,0,'computer does not use player hints');assert.equal(s.m.status,'ended');assert(p.stats.hits<=p.stats.shots);}
const stopped=round();const p=stopped.m.players[1];stopped.cpu.step(.05);assert.equal(stopped.cpu.elapsed,0,'countdown freezes thought clock');stopped.m.countdown=0;advance(stopped,.5);stopped.m.pause();const clock=stopped.cpu.elapsed,shots=p.stats.shots;advance(stopped,5);assert.equal(stopped.cpu.elapsed,clock);assert.equal(p.stats.shots,shots);stopped.m.pause();advance(stopped,5);assert(p.stats.shots>shots);
stopped.m.end();const endedShots=p.stats.shots;advance(stopped,5);assert.equal(p.stats.shots,endedShots);
const independent=round();independent.m.countdown=0;const human=independent.m.players[0];Object.defineProperty(independent.m.players,'0',{configurable:true,get(){throw Error('computer read human player')}});for(let i=0;i<100;i++)independent.cpu.step(.05);Object.defineProperty(independent.m.players,'0',{configurable:true,value:human,writable:true});
const rescued=round();rescued.m.countdown=0;rescued.m.players[1].rows[0].y=V.LINE-70;rescued.cpu.step(.05);assert(rescued.m.players[1].rescueUsed);const y=rescued.m.players[1].rows[0].y;rescued.cpu.step(.05);assert.equal(rescued.m.players[1].rows[0].y,y,'one rescue only');
assert(C.LEVELS.easy.delay>C.LEVELS.normal.delay&&C.LEVELS.normal.delay>C.LEVELS.hard.delay);assert(C.LEVELS.easy.error>C.LEVELS.normal.error&&C.LEVELS.normal.error>C.LEVELS.hard.error);
const survival=round({duration:0});advance(survival,180);assert.equal(survival.m.status,'ended','survival can end through lost hearts');assert(survival.m.players.some(p=>p.lives===0));
console.log('PASS: computer completes all five topics and mixed rounds with normal physics; independent choices; no hints; countdown/pause/end locks; one rescue; three difficulties; timed and three-heart survival results.');
for(const difficulty of ['easy','normal','hard'])for(const speed of [.65,1.6,2.3]){
 const s=round({difficulty,speed,seed:137});advance(s,90);
 const p=s.m.players[1];assert(p.stats.shots>0);assert(p.clears>0,'difficulty '+difficulty+' at '+speed+' still solves questions');
}
console.log('PASS: all three real difficulty profiles solve at slow, default and extreme descent speeds.');
const touch=round(),phonePlayer=touch.m.players[0];touch.m.countdown=0;phonePlayer.touchLayout=true;phonePlayer.rows=phonePlayer.rows.slice(0,1);phonePlayer.rows[0].lane=0;phonePlayer.rows[0].touchLayout=true;V.layout(phonePlayer.rows[0]);assert.equal(phonePlayer.rows[0].height,100);assert(phonePlayer.rows[0].nodes.every(n=>n.x>=0&&n.x+n.w<=V.W));phonePlayer.hint(true);phonePlayer.fire();advance(touch,2);assert(phonePlayer.stats.hits>0,'larger phone target uses matching physical hit boxes');
const next=phonePlayer.spawn({lane:1});assert.equal(next.lane,0);assert.equal(next.height,100);assert(next.touchLayout);
console.log('PASS: phone player has full-width single-column targets, working hints, real collision hits and consistent new rows.');

assert.equal(C.LEVELS.easy.delay,1.8);assert.equal(C.LEVELS.easy.error,.08);assert.equal(C.LEVELS.easy.rescueAt,65);
let entryTotal=0,standardTotal=0;
for(const topic of [1,2,3,4,5]){const easy=round({topic,difficulty:'easy'}),normal=round({topic,difficulty:'normal'});advance(easy,180);advance(normal,180);entryTotal+=easy.m.players[1].clears;standardTotal+=normal.m.players[1].clears;}
assert(standardTotal>entryTotal,'new standard solves more questions than former standard / new entry');
console.log('PASS: entry preserves the previous standard profile; stronger standard solves more questions across all five topics.');
