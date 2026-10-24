(function(root){
'use strict';
const gcd=(a,b)=>{a=a<0n?-a:a;b=b<0n?-b:b;while(b){[a,b]=[b,a%b]}return a};
class Q{
 constructor(n,d=1){if(n instanceof Q){this.n=n.n;this.d=n.d;return} if(typeof n==='string'&&n.includes('/'))[n,d]=n.split('/'); n=BigInt(n);d=BigInt(d);if(!d)throw Error('不能除以 0');if(d<0n){n=-n;d=-d}const g=gcd(n,d);this.n=n/g;this.d=d/g}
 add(v){v=q(v);return new Q(this.n*v.d+v.n*this.d,this.d*v.d)} neg(){return new Q(-this.n,this.d)} sub(v){return this.add(q(v).neg())} mul(v){v=q(v);return new Q(this.n*v.n,this.d*v.d)} div(v){v=q(v);return new Q(this.n*v.d,this.d*v.n)} eq(v){v=q(v);return this.n===v.n&&this.d===v.d} toString(){return this.d===1n?String(this.n):this.n+'/'+this.d}
}
const q=v=>v instanceof Q?v:new Q(v), side=(a,b)=>({a:q(a),b:q(b)});
const eq=(a,b,c,d,group=null)=>({l:side(a,b),r:side(c,d),group});
const solution=e=>e.r.b.sub(e.l.b).div(e.l.a.sub(e.r.a));
const verify=(e,x)=>e.l.a.mul(x).add(e.l.b).eq(e.r.a.mul(x).add(e.r.b));
const lcm=e=>[e.l.a,e.l.b,e.r.a,e.r.b].reduce((a,v)=>a/gcd(a,v.d)*v.d,1n);
const solved=e=>!e.group&&e.l.a.eq(1)&&e.l.b.eq(0)&&e.r.a.eq(0);
const operationLabel=(op,v)=>op+(op==='÷'&&q(v).n<0n?'('+q(v)+')':q(v));
function moves(e){
 if(e.group)return [{op:'÷',v:q(e.group.k),kind:'scale',target:'group',label:operationLabel('÷',e.group.k)}];
 const out=[];const add=(op,v,kind,target)=>out.push({op,v:q(v),kind,target,label:operationLabel(op,v)+(kind==='x'?'x':'')});
 if(lcm(e)>1n)out.push({op:'LCM',v:q(lcm(e)),kind:'scale',target:'fraction',label:'×'+lcm(e)});
 for(const s of ['l','r']){
  if(!e[s].b.eq(0)&&s==='l')add(e[s].b.n>0n?'−':'+',e[s].b.n>0n?e[s].b:e[s].b.neg(),'constant',s+'b');
  if(!e[s].a.eq(0)&&s==='r')add(e[s].a.n>0n?'−':'+',e[s].a.n>0n?e[s].a:e[s].a.neg(),'x',s+'a');
 }
 if(e.l.b.eq(0)&&e.r.a.eq(0)&&!e.l.a.eq(0)&&!e.l.a.eq(1)){
  add('÷',e.l.a,'scale','la');
  if(e.l.a.d!==1n)add('×',q(1).div(e.l.a),'scale','la');
 }
 return out;
}
function apply(e,m){
 const valid=moves(e).find(t=>t.op===m.op&&t.kind===m.kind&&t.target===m.target&&t.v.eq(m.v));
 if(!valid)throw Error('本關採用指定消元路線；其他等價方法亦可能成立。請按分級提示進行。');
 let n=eq(e.l.a,e.l.b,e.r.a,e.r.b);
 if(m.kind!=='expand')for(const s of ['l','r']){
  if(m.kind==='scale'){const f=m.op==='÷'?q(1).div(m.v):m.v;n[s]=side(n[s].a.mul(f),n[s].b.mul(f))}
  else{const k=m.kind==='x'?'a':'b';n[s][k]=n[s][k].add(m.op==='−'?m.v.neg():m.v)}
 }
 if(!solution(e).eq(solution(n)))throw Error('等價檢查失敗');return n;
}
function generate(level,rand=Math.random){
 const pick=a=>a[Math.floor(rand()*a.length)], x=pick([-5,-3,-2,0,2,3,4,6]),a=pick([-4,-3,2,3,4,5]),b=pick([-7,-4,-2,3,5,8]);
 if(level===1)return rand()<.5?eq(1,b,0,x+b):eq(a,0,0,a*x);
 if(level===2)return eq(a,b,0,a*x+b);
 if(level===3){let c=a+pick([-3,-1,1,2]);if(c===0)c=1;return eq(a,b,c,(a-c)*x+b)}
 if(level===4){const k=pick([-3,-2,2,3]);return eq(k,k*b,0,k*(x+b),{k,b})}
 const d=pick([2,3,4,6]);let f=pick([3,4,5]);if(a*f===d)f=7;return eq(q(a).div(d),q(b).div(d),q(1).div(f),q(a).div(d).sub(q(1).div(f)).mul(x).add(q(b).div(d)));
}
function parseOperand(text){
 const s=String(text).trim().replaceAll('−','-');
 if(!/^-?\d{1,6}(?:\/-?\d{1,6})?$/.test(s))throw Error('請輸入整數或分數，例如 3、-3、1/2。');
 const value=q(s);if(value.eq(0))throw Error('請輸入非零數值；不能乘或除以零。');return value;
}
const ERROR_NAMES={aim:'未命中',target:'目標不符',value:'數值不符',operation:'運算不符',route:'指定路線'};
function diagnose(e,node,ammo){
 if(!node)return {code:'aim',text:'未命中：試試點選泡泡，再微調角度。'};
 const all=moves(e),target=all.filter(m=>m.target===node.key||(m.target==='fraction'&&e[node.key[0]]?.[node.key[1]]?.d>1n));
 if(!target.length)return {code:ammo.kind==='scale'&&!e.l.b.eq(0)?'route':'target',text:ammo.kind==='scale'&&!e.l.b.eq(0)?'指定路線：本關先消常數，再除係數；其他等價解法亦可成立。':'目標不符：先處理提示中需要消去的項。'};
 const op=target.filter(m=>m.op===ammo.op&&m.kind===ammo.kind);
 if(!op.length)return {code:'operation',text:'運算不符：想一想用哪個相反運算消去這一項。'};
 if(!op.some(m=>m.v.eq(ammo.v)))return {code:'value',text:'數值不符：運算方向正確，再檢查正負號和數值。'};
 return null;
}
function newStats(){return {shots:0,hits:0,hints:0,solved:0,errors:{aim:0,target:0,value:0,operation:0,route:0}}}
function accuracy(s){return s.shots?Math.round(100*s.hits/s.shots):0}
function report(s){const common=Object.entries(s.errors).filter(([,n])=>n).sort((a,b)=>b[1]-a[1]);return '完成 '+s.solved+' 題 · 正確命中 '+accuracy(s)+'%（'+s.hits+'/'+s.shots+' 發） · 提示 '+s.hints+' 次'+(common.length?' · 常見：'+common.map(([k,n])=>ERROR_NAMES[k]+' '+n).join('、'):' · 暫無錯誤紀錄')}
function operandChoices(v){v=q(v);const list=[v];for(const candidate of [v.neg(),q(1).div(v),v.add(1),v.sub(1),q(2),q(3)])if(!candidate.eq(0)&&!list.some(x=>x.eq(candidate)))list.push(candidate);return list.slice(0,3).sort((a,b)=>{const d=a.sub(b);return d.n<0n?-1:d.n>0n?1:0}).map(String)}
// Balanced, deterministic groups of five keep mixed decks fair for both players.
function topicAt(index,topic=0,seed=1){
 topic=Number(topic);if(topic>=1&&topic<=5)return topic;
 const bag=[1,2,3,4,5];let n=(seed^Math.imul(1+Math.floor(index/5),0x9e3779b9))>>>0;
 for(let i=4;i>0;i--){n=(Math.imul(n,1664525)+1013904223)>>>0;const j=n%(i+1);[bag[i],bag[j]]=[bag[j],bag[i]];}
 return bag[index%5];
}
function speedMultiplier(value){const n=Number(value);return [.65,1,1.6,2.3].includes(n)?n:1.6}
const api={topicAt,speedMultiplier,diagnose,newStats,accuracy,report,operandChoices,ERROR_NAMES,Q,q,eq,solution,verify,lcm,solved,moves,apply,generate,parseOperand};root.EquationMath=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);

