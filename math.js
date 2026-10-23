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
 if(!valid)throw Error('這枚炮彈不能消去所選項。請改用提示的等價步驟。');
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
 if(level===3){const c=a+pick([-3,-1,1,2]);return eq(a,b,c,(a-c)*x+b)}
 if(level===4){const k=pick([-3,-2,2,3]);return eq(k,k*b,0,k*(x+b),{k,b})}
 const d=pick([2,3,4,6]);let f=pick([3,4,5]);if(a*f===d)f=7;return eq(q(a).div(d),q(b).div(d),q(1).div(f),q(a).div(d).sub(q(1).div(f)).mul(x).add(q(b).div(d)));
}
const api={Q,q,eq,solution,verify,lcm,solved,moves,apply,generate};root.EquationMath=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);

