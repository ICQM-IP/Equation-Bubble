const assert=require('node:assert/strict'),M=require('./math.js');let checks=0;
function solve(e){const original=e;for(let i=0;i<12&&!M.solved(e);i++){const ms=M.moves(e);assert(ms.length,'no softlock');for(const m of ms){const n=M.apply(e,m);assert(M.solution(n).eq(M.solution(e)));checks++}e=M.apply(e,ms[0])}assert(M.solved(e));assert(M.verify(original,e.r.b));checks++;return e.r.b.toString()}
for(const [e,x] of [[M.eq(1,3,0,7),'4'],[M.eq(-2,5,0,11),'-3'],[M.eq(3,-7,1,5),'6'],[M.eq(-2,-6,0,4,{k:-2,b:3}),'-5'],[M.eq('1/2','1/3','1/4','5/6'),'2'],[M.eq(3,0,0,1),'1/3'],[M.eq(2,5,0,5),'0']])assert.equal(solve(e),x);
assert.equal(M.lcm(M.eq('1/4','1/6','1/10',0)),60n);assert.equal(M.q('-2/-4').toString(),'1/2');assert.throws(()=>M.q(1).div(0));
for(const m of [{op:'÷',v:M.q(0),kind:'scale',target:'la'},{op:'×',v:M.q(0),kind:'scale',target:'la'},{op:'−',v:M.q(2),kind:'constant',target:'lb'},{op:'−',v:M.q(3),kind:'constant',target:'rb'}])assert.throws(()=>M.apply(M.eq(2,3,0,9),m));
let seed=123456;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};for(let level=1;level<=5;level++)for(let i=0;i<500;i++)solve(M.generate(level,rand));console.log('PASS: 2,500 generated equations + representative/invalid cases; '+checks+' exact equivalence and substitution checks.');

const ordered=M.eq(5,5,0,35);
assert(!M.moves(ordered).some(m=>m.op==='÷'));
assert.throws(()=>M.apply(ordered,{op:'÷',v:M.q(5),kind:'scale',target:'la'}));
const subtract=M.moves(ordered).find(m=>m.op==='−'&&m.v.eq(5));
const isolated=M.apply(ordered,subtract);
assert(isolated.l.a.eq(5)&&isolated.l.b.eq(0)&&isolated.r.b.eq(30));
assert(M.moves(isolated).some(m=>m.op==='÷'&&m.v.eq(5)));
assert.equal(solve(ordered),'6');
console.log('PASS: required order: 5x+5=35 → −5 → 5x=30 → ÷5 → x=6; premature division rejected.');

const bracketEq=M.eq(3,-21,0,-15,{k:3,b:-7});
assert.equal(M.moves(bracketEq).length,1);const divideBracket=M.moves(bracketEq)[0];assert.equal(divideBracket.op,'÷');assert.equal(divideBracket.v.toString(),'3');assert.equal(divideBracket.target,'group');
const bracketNext=M.apply(bracketEq,divideBracket);assert.equal(bracketNext.group,null);assert.equal(bracketNext.l.a.toString(),'1');assert.equal(bracketNext.l.b.toString(),'-7');assert.equal(bracketNext.r.b.toString(),'-5');assert.equal(solve(bracketEq),'2');
assert.throws(()=>M.apply(bracketEq,{op:'×',v:M.q(1),kind:'expand',target:'group'}));assert.throws(()=>M.apply(bracketEq,{op:'+',v:M.q(7),kind:'constant',target:'lb'}));
assert.equal(solve(M.eq(-3,21,0,15,{k:-3,b:-7})),'2');
console.log('PASS: 3(x-7)=-15 requires ÷3 → x-7=-5 → +7 → x=2; expansion and premature addition rejected; negative outer coefficient supported.');

assert.equal(M.moves(M.eq(-1,0,0,2)).find(m=>m.op==='÷').label,'÷(-1)');
assert.equal(M.moves(M.eq(-3,0,0,6)).find(m=>m.op==='÷').label,'÷(-3)');
assert.equal(M.moves(M.eq('-1/2',0,0,2)).find(m=>m.op==='÷').label,'÷(-1/2)');
assert.equal(M.moves(M.eq(-3,21,0,15,{k:-3,b:-7}))[0].label,'÷(-3)');
assert.equal(M.moves(M.eq(3,0,0,6)).find(m=>m.op==='÷').label,'÷3');
console.log('PASS: negative divisors use parentheses, including -1, -3, negative fractions and bracket coefficients; positive divisors unchanged.');

assert.equal(M.moves(M.eq('1/2','1/5',0,3)).find(m=>m.op==='LCM').label,'×10');
console.log('PASS: LCM operation displays only actual multiplier ×10.');
