'use strict';
const assert=require('node:assert/strict'),M=require('./math.js'),V=require('./versus-engine.js');
const make=(o={})=>{const m=new V.Match({seed:31,...o});m.countdown=0;return m};
const advance=(m,t)=>{for(let i=0;i<Math.ceil(t/.025);i++)m.step(.025)};
const e=M.eq(3,-2,0,4),a={op:'+',kind:'constant',v:M.q(2)};
assert.equal(M.diagnose(e,null,a).code,'aim');assert.equal(M.diagnose(e,{key:'rb'},a).code,'target');assert.equal(M.diagnose(e,{key:'lb'},{...a,op:'−'}).code,'operation');assert.equal(M.diagnose(e,{key:'lb'},{...a,v:M.q(3)}).code,'value');assert.equal(M.diagnose(e,{key:'la'},{op:'÷',kind:'scale',v:M.q(3)}).code,'route');assert.equal(M.diagnose(e,{key:'lb'},a),null);
for(const v of ['1','-1','2','-7','1/2','-3/4']){const choices=M.operandChoices(M.q(v));assert.equal(choices.length,3);assert.equal(new Set(choices).size,3);assert(choices.some(c=>M.q(c).eq(v)));assert(choices.every(c=>!M.q(c).eq(0)))}
let m=make({duration:1});m.players[0].clears=2;m.players[1].clears=1;advance(m,1.1);assert.equal(m.winner,0);assert.equal(m.status,'ended');
m=make({duration:1});m.players[0].stats.shots=2;m.players[0].stats.hits=1;advance(m,1.1);assert.equal(m.winner,0,'zero shots count as 0%, not an automatic tie');
m=make({duration:1});m.players[0].stats.shots=4;m.players[0].stats.hits=2;m.players[1].stats.shots=2;m.players[1].stats.hits=1;advance(m,1.1);assert.equal(m.winner,null,'equal exact proportions draw');
m=make({duration:1});m.pause();advance(m,2);assert.equal(m.elapsed,0);m.pause();m.players[0].lives=1;m.players[0].rows[0].y=V.LINE-65;advance(m,.1);assert.equal(m.status,'playing');assert.equal(m.players[0].lives,3,'timed mode continues after crossing the line');
m=make();m.attack(1);advance(m,.025);let p=m.players[0],row=p.rows[0];row.e=M.eq(1,0,0,2);row.original=M.eq(3,0,0,6);p.finish(row);assert.equal(p.cancelled,1);assert.equal(p.incoming.length,0);assert.equal(p.sent,0);assert.equal(m.players[1].incoming.length,0);
m=make();m.attack(1);p=m.players[0];row=p.rows[0];row.e=M.eq(1,0,0,2);row.original=M.eq(3,0,0,6);p.finish(row);assert.equal(p.cancelled,0,'same-frame sends do not give the second player a cancellation advantage');assert.equal(p.sent,1);
m=make({gentle:true});assert(m.players.every(p=>p.rows.length===1));m.elapsed=61;p=m.players[0];p.rows[0].y=180;p.refill();assert.equal(p.rows.length,2);
console.log('PASS: five feedback categories; exact rational choices; timed wins/ties/zero shots; paused timer; timed line recovery; counterattack; simultaneous fairness; gentle opening.');
