'use strict';
const assert=require('node:assert/strict'),M=require('./math.js'),V=require('./versus-engine.js');
for(const [text,expected] of [['-1/2','-1/2'],['3','3'],['−3','-3'],['2/-4','-1/2']])assert.equal(String(M.parseOperand(text)),expected);
for(const text of ['', '0','1/0','0/3','1.5','1/2/3','Infinity','<script>','1234567'])assert.throws(()=>M.parseOperand(text));
const a=new V.Match({seed:302}),b=new V.Match({seed:302});a.countdown=b.countdown=0;
a.players[1].receiveAttack();a.players[1].receiveAttack();assert.equal(a.players[1].next,4);assert.equal(a.players[1].attackNext,2);
const normal=a.players[1].spawn(),control=b.players[1].spawn();assert.equal(V.equationText(normal.e),V.equationText(control.e));assert.equal(normal.special,control.special);
assert.equal(V.equationText(a.attackEquation(0)),V.equationText(b.attackEquation(0)));
const match=new V.Match({challenge:true,seed:123});match.countdown=0;const p=match.players[0];p.angle=30;p.op=2;p.hint();assert.equal(p.hintLevel,1);assert.equal(p.angle,30);assert.equal(p.op,2);assert.equal(p.manualValue,'');p.hint();assert.equal(p.hintLevel,2);assert.equal(p.angle,30);p.hint();assert.equal(p.hintLevel,3);assert(p.manualValue);assert(V.aimTrace(p).hit);const target=V.aimTrace(p).hit;
p.manualValue='';assert.equal(p.fire(),false);p.manualValue='1/0';assert.equal(p.fire(),false);p.manualValue=String(M.moves(target.row.e).find(m=>m.op===V.OPS[p.op]).v);assert.equal(p.fire(),true);const value=String(p.bullet.ammo.v);p.manualValue='99';assert.equal(String(p.bullet.ammo.v),value);
console.log('PASS: strict rational operands; independent attack stream and normal-star schedule; three-stage VS hints; manual-value validation; immutable shot values.');

const linear=new V.Match({challenge:true,level:3});linear.countdown=0;const lp=linear.players[0];lp.rows=[];const lr=lp.spawn({lane:0,y:160,special:false});lr.e=M.eq(3,0,2,4);V.layout(lr);lp.angle=Math.atan2(lr.nodes.find(n=>n.key==='ra').x+33-V.ORIGIN.x,V.ORIGIN.y-lr.y-33)*180/Math.PI;lp.op=1;lp.manualValue='2';assert.equal(lp.ammo().label,'−2x');
