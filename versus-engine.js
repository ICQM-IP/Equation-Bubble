(function(root){
'use strict';
const M=typeof module!=='undefined'&&module.exports?require('./math.js'):root.EquationMath;
const OPS=['+','−','×','÷','LCM'],W=760,H=620,LINE=478,ORIGIN={x:380,y:555};
const qtext=v=>String(v).replaceAll('-','−'),xt=v=>v.eq(1)?'x':v.eq(-1)?'−x':qtext(v)+'x';
function sideText(s){return (s.a.eq(0)?'':xt(s.a))+(s.b.eq(0)?'':(s.a.eq(0)?'':s.b.n<0n?' − ':' + ')+qtext(!s.a.eq(0)&&s.b.n<0n?s.b.neg():s.b))||'0'}
function equationText(e){return (e.group?`${e.group.k}(x ${e.group.b<0?'−':'+'} ${Math.abs(e.group.b)})`:sideText(e.l))+' = '+sideText(e.r)}
function terms(e){const out=[];for(const s of ['l','r']){if(s==='r')out.push({key:'equals',text:'=',color:'purple'});if(s==='l'&&e.group){out.push({key:'group',text:`${e.group.k}(x${e.group.b<0?'−':'+'}${Math.abs(e.group.b)})`,color:'blue'});continue}if(!e[s].a.eq(0))out.push({key:s+'a',text:xt(e[s].a),color:'blue'});if(!e[s].b.eq(0)||e[s].a.eq(0))out.push({key:s+'b',text:(!e[s].a.eq(0)&&e[s].b.n>0n?'+':'')+qtext(e[s].b),color:s==='l'?'red':'gold'})}return out}
function rng(seed){let n=seed>>>0;return ()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296}}
function clone(e){return M.eq(e.l.a,e.l.b,e.r.a,e.r.b,e.group?{...e.group}:null)}
function validTarget(e,node,m){return m.target===node.key||(m.target==='fraction'&&e[node.key[0]]?.[node.key[1]]?.d>1n)}
function layout(row){const data=terms(row.e),raw=data.map(t=>t.key==='equals'?54:t.text.length>5?87:66),available=W/2-14,totalRaw=raw.reduce((a,b)=>a+b,0)+3*(raw.length-1),factor=Math.min(1,available/totalRaw);const sizes=raw.map(s=>s*factor),gap=3*factor,total=sizes.reduce((a,b)=>a+b,0)+gap*(sizes.length-1),room=Math.max(0,(W/2-total)/2-4),left=row.lane*W/2+(W/2-total)/2+Math.max(-room,Math.min(room,row.jitter));let x=left;row.height=66;row.nodes=data.map((t,i)=>{const n={...t,x,w:sizes[i],h:66};x+=sizes[i]+gap;return n});return row}
function contact(player,x,y){for(const r of player.rows)for(const n of r.nodes){if(n.key==='equals')continue;if(((x-(n.x+n.w/2))/(n.w/2+5))**2+((y-(r.y+33))/(33+5))**2<=1)return {row:r,node:n}}return null}
function aimTrace(player){let {x,y}=ORIGIN,dx=Math.sin(player.angle*Math.PI/180),dy=-Math.cos(player.angle*Math.PI/180),bounces=0;const path=[{x,y}];for(let i=0;i<900;i++){x+=dx*4;y+=dy*4;if(x<14){x=28-x;dx=-dx;bounces++}if(x>W-14){x=2*(W-14)-x;dx=-dx;bounces++}path.push({x,y});const hit=contact(player,x,y);if(hit||y<0)return {path,hit,bounces}}return {path,hit:null,bounces}}
class Player{
 constructor(match,index,teacher){this.match=match;this.index=index;this.teacher=teacher;this.rows=[];this.next=0;this.attackNext=0;this.serial=0;this.manualValue='';this.hintKey=null;this.hintLevel=0;this.angle=index===0?-12:12;this.op=0;this.score=0;this.combo=0;this.lives=3;this.sent=0;this.received=0;this.specialClears=0;this.misses=0;this.phase=null;this.bullet=null;this.grace=0;this.reward=0;this.spawnClock=0;this.incoming=[];this.revision=0;this.message='★ 題目解完，向對手追加一題！';this.teaching=null;this.clears=0;this.held=new Set();this.aimed=null}
 get active(){return this.match.status==='playing'&&this.match.countdown<=0&&this.lives>0&&!this.match.paused}
 get canFire(){return this.active&&!this.bullet&&!this.phase&&this.reward<=0}
 emit(type,data={}){this.match.events.push({type,player:this.index,...data})}
 spawn({attack=false,lane=null,y=null,special=null}={}){if(this.rows.length>=12)return null;const ordinal=attack?this.attackNext++:this.next++;const e=clone(attack?this.match.attackEquation(ordinal):this.match.equation(ordinal)),id=++this.serial;if(lane===null){const counts=[this.rows.filter(r=>r.lane===0),this.rows.filter(r=>r.lane===1)];lane=counts[0].length<=counts[1].length?0:1}const column=this.rows.filter(r=>r.lane===lane),top=column.length?Math.min(...column.map(r=>r.y)):100;if(y===null)y=Math.min(10,top-96);const row=layout({id,e,original:clone(e),lane,y,jitter:(this.match.layoutRandom(this.index,id)-.5)*100,special:special??(!attack&&ordinal%3===0),attack,height:66,nodes:[]});this.rows.push(row);this.revision++;return row}
 initialize(){this.spawn({lane:0,y:136,special:true});this.spawn({lane:1,y:150,special:false});this.spawn({lane:0,y:40,special:false});this.spawn({lane:1,y:54,special:true})}
 autoAmmo(){const hit=aimTrace(this).hit,focus=hit?.row||[...this.rows].filter(r=>r.y>=0).sort((a,b)=>b.y-a.y)[0],op=OPS[this.op],moves=focus?M.moves(focus.e):[];return moves.find(m=>m.op===op&&hit&&validTarget(focus.e,hit.node,m))||moves.find(m=>m.op===op)||{op,v:M.q(1),kind:op==='+'||op==='−'?'constant':'scale',label:op==='LCM'?'×?':op+'?',unavailable:true}}
 ammo(){const move=this.autoAmmo();if(!this.match.challenge)return move;let v;try{v=M.parseOperand(this.manualValue)}catch{return {...move,label:(move.op==='LCM'?'×':move.op)+'?',manualValid:false}}return {...move,v,manualValid:true,label:(move.op==='LCM'?'×':move.op)+(move.op==='÷'&&v.n<0n?'('+v+')':v)+(move.kind==='x'?'x':'')};}
 cycle(delta){if(!this.active)return;this.op=(this.op+delta+OPS.length)%OPS.length}
 setAngle(value){if(!this.active)return;this.angle=Math.max(-70,Math.min(70,value))}
 hint(full=false){if(!this.canFire)return;for(const row of [...this.rows].sort((a,b)=>b.y-a.y)){
 for(const m of M.moves(row.e)){const node=row.nodes.find(n=>validTarget(row.e,n,m));if(!node)continue;
 const saved=this.angle,angle=Math.max(-70,Math.min(70,Math.atan2(node.x+node.w/2-ORIGIN.x,ORIGIN.y-row.y-33)*180/Math.PI));this.angle=angle;const actual=aimTrace(this).hit;this.angle=saved;
 if(actual?.row!==row||!validTarget(row.e,actual.node,m))continue;
 const key=row.id+'|'+equationText(row.e)+'|'+node.key;if(key!==this.hintKey){this.hintKey=key;this.hintLevel=0;}this.hintLevel=full?3:Math.min(3,this.hintLevel+1);
 this.aimed={row:row.id,key:node.key};
 if(this.hintLevel===1)this.message='提示 1：先處理發光項 '+node.text+'。';
 if(this.hintLevel===2)this.message='提示 2：兩邊同時做 '+(m.op==='LCM'?'乘最小公倍數':m.op)+' 運算。';
 if(this.hintLevel===3){this.op=OPS.indexOf(m.op);this.angle=angle;if(this.match.challenge)this.manualValue=String(m.v);this.message='提示 3：兩邊都 '+m.label+'，已協助瞄準。';}
 return;
 }}this.message='先清理最下方的等式，打開射擊路線。';}

 fire(){if(!this.canFire)return false;const ammo=this.ammo();if(this.match.challenge&&!ammo.manualValid){this.message='請先輸入非零整數或分數，例如 3 或 -1/2。';return false;}this.bullet={x:ORIGIN.x,y:ORIGIN.y,dx:Math.sin(this.angle*Math.PI/180),dy:-Math.cos(this.angle*Math.PI/180),ammo:{...ammo},bounces:0};this.emit('fire');return true}
 miss(text){this.bullet=null;this.combo=0;this.misses++;this.message=text;this.emit('miss');this.revision++}
 impact(hit,shot){this.bullet=null;const move=M.moves(hit.row.e).find(m=>m.op===shot.ammo.op&&m.kind===shot.ammo.kind&&m.v.eq(shot.ammo.v)&&validTarget(hit.row.e,hit.node,m));if(!move){this.miss('本關請先消常數再除係數；其他等價解法亦可成立。');return}const next=M.apply(hit.row.e,move);this.hintKey=null;this.hintLevel=0;this.aimed=null;if(this.match.challenge)this.manualValue='';if(shot.bounces){this.score+=75;this.emit('bank',{points:75})}this.phase={row:hit.row,move,next,elapsed:0,applied:false};this.teaching={equation:clone(hit.row.e),move};this.message='兩邊都 '+move.label+'！';this.revision++;this.emit('hit')}
 finish(row){if(!M.solved(row.e)||!M.verify(row.original,row.e.r.b))throw Error('Solution verification failed');this.combo=Math.min(8,this.combo+1);const gain=100*this.combo;this.score+=gain;this.clears++;this.reward=.45;this.rows=this.rows.filter(r=>r!==row);this.message='平衡完成！x = '+qtext(row.e.r.b);this.teaching={answer:row.e.r.b};this.emit('clear',{x:qtext(row.e.r.b),points:gain,y:row.y,special:row.special});if(row.special){this.specialClears++;this.sent++;this.match.attack(this.index);this.emit('attack-send')}
 const push=Math.min(28,Math.max(0,Math.min(...this.rows.map(r=>r.y))+100));for(const other of this.rows)other.y-=push;this.revision++}
 refill(){if(this.rows.length>=8)return;for(let lane=0;lane<2;lane++){const column=this.rows.filter(r=>r.lane===lane),top=column.length?Math.min(...column.map(r=>r.y)):100;if(top>=104){this.spawn({lane,y:8});return}}}
 receiveAttack(){if(this.rows.length>=12||this.rows.every(r=>r.y< -160))return false;const tops=[0,1].map(l=>{const rs=this.rows.filter(r=>r.lane===l);return rs.length?Math.min(...rs.map(r=>r.y)):100});const lane=tops[0]>=tops[1]?0:1;if(tops[lane]<-160)return false;this.spawn({attack:true,lane,special:false});this.received++;this.message='收到攻擊！追加一條等式。';this.emit('attack-receive');return true}
 lose(row){this.rows=this.rows.filter(r=>r!==row);this.lives--;this.combo=0;this.grace=1.8;this.message='碰線！暫時安全，重新瞄準。';for(const other of this.rows)other.y-=48;this.revision++;this.emit('life-loss')}
 step(dt){if(!this.active)return;const turn=(this.held.has('right')?1:0)-(this.held.has('left')?1:0);if(turn&&!this.bullet&&!this.phase)this.setAngle(this.angle+turn*65*dt);this.reward=Math.max(0,this.reward-dt);this.grace=Math.max(0,this.grace-dt);
 if(this.grace<=0&&this.reward<=0){for(const row of [...this.rows].sort((a,b)=>b.y-a.y)){if(this.phase?.row===row)continue;let y=row.y+(6+this.match.level*.5)*dt;const below=this.rows.filter(r=>r!==row&&r.lane===row.lane&&r.y>row.y).sort((a,b)=>a.y-b.y)[0];if(below)y=Math.min(y,below.y-row.height-28);row.y=y;if(row.y+row.height>LINE){this.lose(row);break}}}
 if(this.lives<=0)return;for(const incoming of this.incoming)if(incoming.born<this.match.elapsed)incoming.delay=Math.max(0,incoming.delay-dt);if(this.incoming.length&&this.incoming[0].delay<=0&&!this.phase&&this.receiveAttack())this.incoming.shift();
 if(this.bullet){const shot=this.bullet,steps=Math.ceil(dt*1100/4),distance=dt*1100/steps;for(let i=0;i<steps;i++){shot.x+=shot.dx*distance;shot.y+=shot.dy*distance;if(shot.x<14){shot.x=28-shot.x;shot.dx=-shot.dx;shot.bounces++}if(shot.x>W-14){shot.x=2*(W-14)-shot.x;shot.dx=-shot.dx;shot.bounces++}const hit=contact(this,shot.x,shot.y);if(hit){this.impact(hit,shot);break}if(shot.y<0){this.miss('未命中，再調整角度。');break}}}
 else if(this.phase){const phase=this.phase;phase.elapsed+=dt;if(!phase.applied&&phase.elapsed>=.6){phase.row.e=phase.next;layout(phase.row);phase.applied=true;this.score+=10;this.revision++}if(phase.elapsed>=.8){this.phase=null;if(M.solved(phase.row.e))this.finish(phase.row);else{this.teaching={text:equationText(phase.row.e)};this.message='繼續下一步！';this.revision++}}}
 this.spawnClock+=dt;if(!this.rows.length&&!this.phase){this.spawn({lane:0,y:15});this.spawnClock=0}else if(this.spawnClock>=10&&this.reward<=0){this.refill();this.spawnClock=0}}
}
class Match{
 constructor({level=2,teachers=[2,0],seed=12345,challenge=false}={}){this.level=Math.max(1,Math.min(5,Number(level)||2));this.challenge=challenge;this.seed=seed>>>0;this.random=rng(this.seed);this.deck=[];this.attackDeck=[];this.attackRandom=rng((this.seed^0x9e3779b9)>>>0);this.players=teachers.map((t,i)=>new Player(this,i,t));this.events=[];this.status='playing';this.paused=false;this.countdown=3;this.elapsed=0;this.winner=null;this.attacks=0;this.players.forEach(p=>p.initialize())}
 equation(index){while(this.deck.length<=index){let e;do{e=M.generate(this.level,this.random)}while(M.solved(e));this.deck.push(e)}return this.deck[index]}
 attackEquation(index){while(this.attackDeck.length<=index){let e;do{e=M.generate(this.level,this.attackRandom)}while(M.solved(e));this.attackDeck.push(e)}return this.attackDeck[index]}
 layoutRandom(player,id){return rng((this.seed+id*104729)>>>0)()}
 attack(from){const to=1-from;this.players[to].incoming.push({delay:.9,from,born:this.elapsed,id:++this.attacks});this.players[from].message='★ 攻擊！對手增加一條等式。'}
 pause(){if(this.status!=='playing')return;this.paused=!this.paused;this.players.forEach(p=>p.held.clear())}
 step(dt){if(this.status!=='playing'||this.paused)return;dt=Math.min(.05,Math.max(0,dt));if(this.countdown>0){this.countdown=Math.max(0,this.countdown-dt);return}this.elapsed+=dt;this.players.forEach(p=>p.step(dt));const dead=this.players.map(p=>p.lives<=0);if(dead.some(Boolean)){this.status='ended';this.winner=dead.every(Boolean)?null:dead[0]?1:0;this.players.forEach(p=>{p.held.clear();p.bullet=null;p.phase=null;p.incoming=[]});this.events.push({type:'end',winner:this.winner})}}
}
const api={Match,Player,OPS,W,H,LINE,ORIGIN,terms,layout,contact,aimTrace,sideText,equationText,qtext};root.EquationVersus=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
