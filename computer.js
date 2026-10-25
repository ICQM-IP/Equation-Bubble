(function(root){
'use strict';
const V=typeof module!=='undefined'&&module.exports?require('./versus-engine.js'):root.EquationVersus;
const M=typeof module!=='undefined'&&module.exports?require('./math.js'):root.EquationMath;
const LEVELS={easy:{name:'入門',delay:3.1,error:.17,rescueAt:25},normal:{name:'標準',delay:1.8,error:.08,rescueAt:65},hard:{name:'挑戰',delay:.95,error:.025,rescueAt:100}};
class Controller{
 constructor(player,difficulty='normal',random=null){this.player=player;this.level=LEVELS[difficulty]||LEVELS.normal;this.elapsed=0;this.pending=null;this.windup=0;this.status='思考中';let seed=(player.match.seed^0xa5b35705)>>>0;this.random=random||(()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296});}
 plan(){
  const p=this.player,savedAngle=p.angle,savedOp=p.op;
  const rows=[...p.rows].filter(r=>r.y>=0).sort((a,b)=>p.incoming.length?(Number(b.special)-Number(a.special)||b.y-a.y):b.y-a.y);
  let result=null;
  for(const row of rows){for(const move of M.moves(row.e)){
   const nodes=row.nodes.filter(n=>move.target===n.key||move.target==='fraction'&&row.e[n.key[0]]?.[n.key[1]]?.d>1n);
   for(const node of nodes){const angle=Math.atan2(node.x+node.w/2-V.ORIGIN.x,V.ORIGIN.y-row.y-node.h/2)*180/Math.PI;if(Math.abs(angle)>70)continue;
    p.angle=angle;p.op=V.OPS.indexOf(move.op);const hit=V.aimTrace(p).hit;
    if(hit?.row===row&&hit.node===node){result={row:row.id,key:node.key,op:p.op};break;}
   }if(result)break;
  }if(result)break;}
  p.angle=savedAngle;p.op=savedOp;return result;
 }
 aim(plan){const p=this.player,row=p.rows.find(r=>r.id===plan.row),node=row?.nodes.find(n=>n.key===plan.key);if(!node)return false;p.op=plan.op;p.setAngle(Math.atan2(node.x+node.w/2-V.ORIGIN.x,V.ORIGIN.y-row.y-node.h/2)*180/Math.PI);return true;}
 step(dt){
  const p=this.player;if(!p.active)return;
  if(!p.canFire){this.status=p.phase?'正在運算':p.bullet?'已發射':'準備下一題';return;}
  if(!p.rescueUsed&&p.rows.some(r=>V.LINE-r.y-r.height<this.level.rescueAt)&&p.rescue()){this.status='使用救援';return;}
  dt=Math.min(.05,Math.max(0,dt));
  if(this.pending){this.windup-=dt;this.status='正在瞄準';if(this.windup>0)return;const plan=this.pending;this.pending=null;if(this.aim(plan)){if(this.random()<this.level.error)p.setAngle(p.angle+(this.random()<.5?-18:18));p.fire();}this.elapsed=0;return;}
  this.elapsed+=dt;this.status='思考中';if(this.elapsed<this.level.delay)return;
  this.elapsed=0;const plan=this.plan();if(!plan){this.status='尋找射擊路線';return;}
  this.pending=plan;this.windup=.35;this.aim(plan);this.status='正在瞄準';
 }
}
const api={Controller,LEVELS};root.EquationComputer=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
