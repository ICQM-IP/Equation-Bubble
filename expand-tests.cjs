'use strict';
const assert=require('node:assert/strict'),M=require('./math.js'),V=require('./versus-engine.js');
for(const k of [-4,-3,-1,1,2,3])for(const b of [-7,-1,0,3]){
 const e=M.eq(k,k*b,0,k*(2+b),{k,b}),before=V.equationText(e),move=M.moves(e).find(m=>m.op==='EXPAND');assert(move);const next=M.apply(e,move);assert.equal(next.group,null);assert(next.l.a.eq(k));assert(next.l.b.eq(k*b));assert(next.r.b.eq(e.r.b));assert(M.solution(next).eq(2));assert.equal(V.equationText(e),before);assert(M.moves(e).some(m=>m.op==='÷'));
 let solved=next;for(let n=0;n<10&&!M.solved(solved);n++)solved=M.apply(solved,M.moves(solved)[0]);assert(M.solved(solved));assert(M.verify(e,solved.r.b));
}
assert(!M.moves(M.eq(3,-3,0,9)).some(m=>m.op==='EXPAND'));assert.throws(()=>M.apply(M.eq(3,-3,0,9),{op:'EXPAND',v:M.q(1),kind:'expand',target:'group'}));
for(const touch of [false,true]){
 const match=new V.Match({turbo:true,gentle:true});match.countdown=0;const p=match.players[0];p.rows=[];p.touchLayout=touch;const row=p.spawn({y:150,special:false});row.e=M.eq(3,-3,0,9,{k:3,b:-1});row.original=row.e;V.layout(row);p.hint(true);p.op=V.OPS.indexOf('EXPAND');assert.equal(p.ammo().kind,'expand');assert(p.fire());for(let t=0;t<150;t++)match.step(.025);assert.equal(p.stats.hits,1);assert.equal(row.e.group,null);assert(row.e.l.a.eq(3));assert(row.e.l.b.eq(-3));assert(p.teaching);assert.equal(p.stats.errors.operation,0);
}
assert.deepEqual(V.OPS,['+','−','×','÷','EXPAND','LCM']);
console.log('PASS: signed bracket expansion preserves both sides and solutions; invalid targets rejected; desktop and phone shots apply real expansion.');

const CPU=require('./computer.js'),cpuMatch=new V.Match({turbo:true,gentle:true});cpuMatch.countdown=0;const bot=cpuMatch.players[1];bot.rows=[];const bracket=bot.spawn({y:180,special:false});bracket.e=M.eq(3,-3,0,9,{k:3,b:-1});bracket.original=bracket.e;V.layout(bracket);const controller=new CPU.Controller(bot);assert.equal(V.OPS[controller.plan().op],'EXPAND');console.log('PASS: computer opponent can plan bracket expansion.');
