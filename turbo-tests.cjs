'use strict';
const assert=require('node:assert/strict'),M=require('./math.js'),V=require('./versus-engine.js');
const make=(o={})=>{const m=new V.Match({seed:55,level:2,turbo:true,duration:180,...o});m.countdown=0;return m};
const advance=(m,t)=>{for(let n=0;n<Math.ceil(t/.025);n++)m.step(.025)};
const solvedRow=p=>{const row=p.rows[0];row.e=M.eq(1,0,0,2);row.original=M.eq(3,0,0,6);return row};
let m=make(),p=m.players[0];assert.equal(p.rows.length,2);assert.equal(p.rows[0].risk,false);assert.equal(p.rows[1].risk,true);assert.equal(V.equationText(p.rows[1].e),V.equationText(m.players[1].rows[1].e));
for(let level=1;level<=5;level++){m=make({level});p=m.players[0];const row=p.rows[1];let steps=0;while(p.rows.includes(row)&&steps++<12){const move=M.moves(row.e)[0],node=row.nodes.find(n=>move.target===n.key||move.target==='fraction'&&row.e[n.key[0]]?.[n.key[1]]?.d>1n);p.impact({row,node},{ammo:move,bounces:0});advance(m,.5)}assert(steps<12);assert.equal(p.clears,1);assert.equal(m.players[1].incoming[0].remaining,2);}
m=make();p=m.players[0];let row=solvedRow(p);p.finish(row);assert.equal(p.chain,1);assert.equal(p.sent,0);row=solvedRow(p);row.special=false;row.risk=false;m.elapsed=7;p.finish(row);assert.equal(p.chain,2);assert.equal(m.players[1].incoming[0].remaining,1);p.miss('miss');assert.equal(p.heat,0);assert.equal(p.chain,0);assert.equal(p.chainUntil,0);
m=make();p=m.players[0];m.attack(1,3);advance(m,.025);row=solvedRow(p);row.special=true;row.risk=true;p.finish(row);assert.equal(p.incoming.length,0);assert.equal(p.reflected,1);assert.equal(m.players[1].incoming[0].remaining,3);assert.equal(m.players[1].incoming[0].bounces,1);
m=make();m.attack(1,2,2);advance(m,.025);p=m.players[0];row=solvedRow(p);row.special=true;row.risk=true;p.finish(row);assert.equal(p.incoming.length,0);assert.equal(m.players[1].incoming.length,0,'second rebound can be blocked without infinite reflection');
m=make();m.attack(0,3);advance(m,4.6);assert.equal(m.players[1].received,3);assert.equal(m.players[1].incoming.length,0);
m=make();p=m.players[0];const ys=p.rows.map(r=>r.y);assert(p.rescue());assert(p.rows.every((r,i)=>r.y===ys[i]-90));assert.equal(p.rescue(),false);assert(p.grace>=1.8);m=make();m.pause();assert.equal(m.players[0].rescue(),false);advance(m,8);assert.equal(m.elapsed,0);m.pause();assert(m.players[0].rescue());
m=make();m.elapsed=149.99;advance(m,.025);assert(m.frenzy);assert.equal(m.events.filter(e=>e.type==='frenzy').length,1);advance(m,1);assert.equal(m.events.filter(e=>e.type==='frenzy').length,1);
m=make();p=m.players[0];row=p.rows[0];const move=M.moves(row.e)[0],node=row.nodes.find(n=>n.key===move.target);p.impact({row,node},{ammo:move,bounces:0});assert.equal(p.heat,1);advance(m,.35);assert(p.phase?.applied);advance(m,.15);assert.equal(p.phase,null);
const classic=new V.Match();classic.countdown=0;assert.equal(classic.players[0].rescue(),false);assert.equal(classic.players[0].rows.length,4);
console.log('PASS: turbo fair risk decks and all five exact solves; chain attacks; miss reset; strength-preserving reflection; bounded rallies; multi-question delivery; single-use/paused rescue; one-shot finale; faster phases; classic preservation.');
