'use strict';
const assert=require('node:assert/strict'),M=require('./math.js'),V=require('./versus-engine.js');
function family(e){if(e.group)return 4;if([e.l.a,e.l.b,e.r.a,e.r.b].some(q=>q.d>1n))return 5;if(!e.r.a.eq(0))return 3;if(e.l.b.eq(0)||e.l.a.eq(1))return 1;return 2;}
for(let seed=1;seed<12;seed++)for(let block=0;block<8;block++)assert.deepEqual(Array.from({length:5},(_,i)=>M.topicAt(block*5+i,0,seed)).sort(),[1,2,3,4,5]);
for(let topic=1;topic<=5;topic++){const m=new V.Match({topic,level:topic,turbo:true,seed:41});for(let i=0;i<80;i++){assert.equal(family(m.equation(i)),topic);assert.equal(family(m.attackEquation(i)),topic);assert.equal(family(m.riskEquation(i)),topic);}assert(m.players.every(p=>p.rows.every(r=>r.topic===topic)));}
const mixed=new V.Match({topic:0,turbo:true,seed:21});for(let i=0;i<25;i++){assert.equal(family(mixed.equation(i)),M.topicAt(i,0,21));assert.equal(family(mixed.riskEquation(i)),M.topicAt(i,0,21));}
const run=speed=>{const m=new V.Match({topic:1,seed:31,turbo:true,speed});m.countdown=0;const p=m.players[0],y=p.rows[0].y;m.step(.05);return p.rows[0].y-y;};assert(Math.abs(run(1.6)/run(1)-1.6)<1e-8);assert(run(2.3)>run(1.6));assert(run(.65)<run(1));assert.equal(new V.Match().speed,1.6);assert.equal(M.speedMultiplier('garbage'),1.6);
console.log('PASS: balanced seeded mixed topics; fixed ordinary/attack/star families across entire decks; mixed fairness; four real descent speeds and faster default.');

// A clear density choice and uniform descent throughout the entire round.
for(const speed of [.65,1,1.6,2.3])for(const elapsed of [0,60,150]){
 const m=new V.Match({topic:2,turbo:true,gentle:true,speed,duration:180});m.countdown=0;m.elapsed=elapsed;m.frenzy=elapsed>=150;
 const p=m.players[0];p.rows=p.rows.slice(0,1);p.rows[0].y=100;const y=p.rows[0].y;m.step(.05);
 assert(Math.abs(p.rows[0].y-y-M.descentSpeed(speed)*.05)<1e-8,'fixed speed independent of elapsed/finale');
}
const sparse=new V.Match({turbo:true,gentle:true}),dense=new V.Match({turbo:true,gentle:false});
assert.equal(sparse.players[0].rows.length,2);assert.equal(dense.players[0].rows.length,4);
for(const match of [sparse,dense]){match.elapsed=0;const p=match.players[0];p.rows.forEach(r=>r.y+=200);p.refill();}
assert.equal(sparse.players[0].rows.length,2);assert.equal(dense.players[0].rows.length,5);
console.log('PASS: every selected speed stays uniform through finale; sparse/dense openings and refill limits differ.');
