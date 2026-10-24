(function(root){
'use strict';
const ACTIONS={idle:'待機呼吸',signature:'招牌動作',aim:'跟隨瞄準',fire:'揮手助攻',hit:'點頭肯定',clear:'解題歡呼',clap:'連解拍手',pump:'連解握拳',victory:'勝利姿勢',think:'思考提示',danger:'緊張戒備',rescue:'雙手救援',attack:'揮手攻擊',block:'格擋反制',reflect:'反彈攻擊',recover:'抹汗再出發'};
const PRIORITY={idle:0,signature:1,aim:2,danger:3,think:4,fire:5,hit:6,clear:7,clap:7,pump:7,attack:8,block:9,reflect:9,rescue:10,recover:10,victory:11};
const DURATIONS={fire:.7,hit:1,clear:1.8,clap:1.8,pump:1.8,think:2.4,rescue:1.8,attack:1.2,block:1.4,reflect:1.6,recover:2.5,victory:3,signature:2.4};
class Controller{
 constructor(){this.action='idle';this.left=0;this.clock=0;this.direction=1;this.chain=0;}
 play(action,{chain=0,force=false}={}){if(!(action in ACTIONS))return false;if(!force&&this.left>0&&PRIORITY[action]<PRIORITY[this.action])return false;if(!force&&action===this.action&&this.left>0)return false;this.action=action;this.left=DURATIONS[action]||0;this.chain=chain;this.started=this.clock;return true;}
 step(dt,{paused=false,danger=false,aim=0,active=true}={}){if(paused)return;this.clock+=dt;this.direction=aim< -3?-1:aim>3?1:this.direction;if(this.left>0){this.left=Math.max(0,this.left-dt);if(this.left)return;}this.action=active&&danger?'danger':active&&Math.abs(aim)>3?'aim':'idle';if(active&&!danger&&Math.floor(this.clock/9)>Math.floor((this.clock-dt)/9))this.play('signature');}
}
function eventAction(e,chain=0){return {fire:'fire',hit:'hit',miss:'think',clear:chain>=4?'pump':chain>=2?'clap':'clear',chain:chain>=4?'pump':'clap',rescue:'rescue','attack-send':'attack','attack-flight':'attack','attack-cancel':'block','attack-reflect':'reflect','attack-receive':'danger','life-loss':'recover',frenzy:'pump'}[e.type];}

const ease=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)};
function poseAt(action,t,u,id=2,direction=1,motion=true){
 if(!motion)u=.5;
 const breath=motion?Math.sin(t*2):0,duration=DURATIONS[action]||2;
 const envelope=motion?ease(u/.20)*ease((duration-u)/.32):1;
 const wave=motion?Math.sin(u*6):0,bodyWave=motion?Math.sin(u*3.8):0;
 const rest={lx:.30,ly:.69,rx:.77,ry:.64,head:motion?Math.sin(t*1.8-.5)*.012:0,leg:0,jump:breath*.65,lean:0,shift:breath*.35,squash:1,point:0,thumb:0};
 const target={...rest};
 if(action==='aim'){target.head=direction*.045;target.rx=.83;target.ry=.48;target.point=1;}
 if(action==='fire'||action==='attack'){const release=ease((u-.10)/.22);target.rx=.66+release*.20;target.ry=.54-release*.08;target.lx=.28;target.ly=.66;target.lean=(release-.25)*.035;target.shift=(release-.25)*3;target.point=1;}
 if(action==='hit'){target.rx=.76;target.ry=.51;target.head=motion?Math.sin(Math.min(1,u/.7)*Math.PI*2)*.045:0;target.thumb=1;}
 if(action==='clear'||action==='victory'){target.lx=.28;target.ly=.35;target.rx=.76;target.ry=.32;const jumpPhase=Math.max(0,Math.min(1,(u-.18)/.62));target.jump=motion?-Math.sin(jumpPhase*Math.PI)*9:0;target.squash=motion?1-Math.sin(Math.min(1,u/.18)*Math.PI)*.025:1;target.head=-.025;target.leg=motion?Math.sin(jumpPhase*Math.PI)*.025:0;}
 if(action==='clap'){const gap=.026+(motion?(1+Math.cos(u*9))*.025:0);target.lx=.51-gap;target.ly=.60;target.rx=.51+gap;target.ry=.60;target.lean=bodyWave*.012;}
 if(action==='pump'||action==='danger'){target.lx=.29;target.ly=.49+wave*.012;target.rx=.76;target.ry=.47-wave*.012;target.head=bodyWave*.015;target.lean=action==='danger'?-.015:bodyWave*.016;}
 if(action==='think'){target.rx=.61;target.ry=id===2?.35:.48;target.head=.055;target.lean=-.012;}
 if(action==='rescue'){const push=ease((u-.2)/.4);target.lx=.35-push*.10;target.ly=.57-push*.05;target.rx=.72+push*.16;target.ry=.56-push*.06;target.lean=(push-.3)*.045;target.shift=push*3;}
 if(action==='block'||action==='reflect'){target.lx=.49;target.ly=.48;target.rx=.61;target.ry=.46;target.lean=-.025;target.shift=-2;if(action==='reflect'){const push=ease((u-.4)/.35);target.lx+=push*.08;target.rx+=push*.17;target.lean+=push*.045;target.shift+=push*4;}}
 if(action==='recover'){target.rx=.65;target.ry=.29;target.head=-.045;target.lean=-.015;}
 if(action==='signature'){const hands=[[[.44,.61],[.59,.61]],[[.43,.58],[.59,.58]],[[.30,.68],[.62,.35]],[[.30,.59],[.76,.50]],[[.53,.60],[.46,.60]]][id];target.lx=hands[0][0];target.ly=hands[0][1];target.rx=hands[1][0];target.ry=hands[1][1];target.head=[.025,-.02,.035,-.025,.02][id];target.lean=bodyWave*.008;}
 const weight=['idle','aim','danger'].includes(action)?1:envelope;
 for(const key of Object.keys(target))target[key]=rest[key]+(target[key]-rest[key])*weight;
 return target;
}
class PoseBlend{
 constructor(){this.value=null;}
 step(target,dt,motion=true){if(!this.value||!motion){this.value={...target};return this.value;}const next={...this.value};for(const key of Object.keys(target)){const rate=key==='head'?9:['lean','shift','squash','jump','leg'].includes(key)?12:17;next[key]+=(target[key]-next[key])*(-Math.expm1(-rate*Math.max(0,dt)));}this.value=next;return next;}
}
const api={ACTIONS,Controller,eventAction,poseAt,PoseBlend};if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(typeof document==='undefined')return;
const battle=document.body.classList.contains('versus-page'),controllers=[new Controller(),new Controller()],actors=[],reduced=matchMedia('(prefers-reduced-motion: reduce)');
// Independent clipped limbs retain each teacher's original pixel artwork.
const bitmapCache=new WeakMap();
const shapes={head:[[0,0],[.76,0],[.73,.29],[.68,.43],[.59,.50],[.31,.48],[.18,.45]],right:[[.65,.26],[1,.26],[1,.64],[.60,.64],[.60,.50]],left:[[.27,.51],[.40,.54],[.44,.73],[.30,.77],[.18,.64],[.21,.55]],legL:[[0,.73],[.5,.73],[.5,1],[0,1]],legR:[[.5,.73],[1,.73],[1,1],[.5,1]]};
function polygon(ctx,points){ctx.moveTo(points[0][0]*256,points[0][1]*256);for(const [x,y] of points.slice(1))ctx.lineTo(x*256,y*256);ctx.closePath();}
function draw(ctx,img,controller,id,actor){
 const t=controller.clock,a=controller.action,u=Math.max(0,t-(controller.started||0)),motion=!reduced.matches&&!(typeof excitementEffects!=='undefined'&&!excitementEffects);
 const dt=actor.poseClock===undefined?0:Math.max(0,Math.min(.05,t-actor.poseClock));actor.poseClock=t;
 const pose=actor.blend.step(poseAt(a,t,u,id,controller.direction,motion),dt,motion);
 actor.canvas.dataset.pose=JSON.stringify(pose);
 ctx.clearRect(0,0,256,280);ctx.save();ctx.translate(128+pose.shift,230+pose.jump);ctx.rotate(pose.lean);ctx.scale(1/pose.squash,pose.squash);ctx.translate(-128,-230);ctx.translate(12,12);ctx.scale(.9,.9);
 // Cache a disjoint set of parts so overlaps never leave a duplicate limb.
 let bitmaps=bitmapCache.get(img);
 if(!bitmaps||bitmaps.src!==img.src){
  bitmaps={src:img.src};const assigned=[];
  for(const key of ['head','right','left','legL','legR','body']){
   const layer=document.createElement('canvas');layer.width=layer.height=256;const c=layer.getContext('2d');c.drawImage(img,0,0,256,256);
   if(key!=='body'){c.save();c.globalCompositeOperation='destination-in';c.beginPath();polygon(c,shapes[key]);c.fill();c.restore();}
   c.globalCompositeOperation='destination-out';for(const shape of assigned){c.beginPath();polygon(c,shape);c.fill();}c.globalCompositeOperation='source-over';
   bitmaps[key]=layer;if(key!=='body')assigned.push(shapes[key]);
  }bitmapCache.set(img,bitmaps);
 }
 // Small joint patches close the seams as the arms move independently.
 ctx.fillStyle=['#f1bd32','#30303b','#3680d0','#27365c','#9b9fa8'][id];ctx.fillRect(86,137,18,22);ctx.fillRect(152,129,19,23);
 ctx.drawImage(bitmaps.body,0,0);
 function part(key,x,y,angle){ctx.save();ctx.translate(x*256,y*256);ctx.rotate(angle);ctx.translate(-x*256,-y*256);ctx.drawImage(bitmaps[key],0,0);ctx.restore();}
 part('legL',.46,.75,pose.leg);part('legR',.56,.75,-pose.leg);
 const hands=[[pose.lx,pose.ly],[pose.rx,pose.ry]];
 const shirt=['#f4c343','#30313c','#418de1','#283b66','#a8aab4'][id],shade=['#ce981d','#20232e','#245da2','#1c2949','#797e8d'][id];
 function arm(side,hand){const sx=(side?.65:.34)*256,sy=(side?.54:.56)*256,hx=hand[0]*256,hy=hand[1]*256,ex=(sx+hx)/2+(side?7:-7),ey=(sy+hy)/2+10;
  ctx.lineJoin='round';ctx.lineCap='round';ctx.beginPath();ctx.moveTo(sx,sy);ctx.quadraticCurveTo(ex,ey,hx,hy);ctx.strokeStyle='#1c202a';ctx.lineWidth=18;ctx.stroke();ctx.strokeStyle='#ffc48b';ctx.lineWidth=12;ctx.stroke();
  ctx.beginPath();ctx.moveTo(sx,sy);ctx.quadraticCurveTo(sx+(ex-sx)*.6,sy+(ey-sy)*.6,id===1?ex:sx+(ex-sx)*.7,id===1?ey:sy+(ey-sy)*.7);ctx.strokeStyle=shade;ctx.lineWidth=20;ctx.stroke();ctx.strokeStyle=shirt;ctx.lineWidth=14;ctx.stroke();
  ctx.save();ctx.translate(hx,hy);ctx.rotate((side?1:-1)*.12+(hy-sy)*.003);
  // Stepped pixel corners, knuckles and a softer outline replace square blocks.
  ctx.beginPath();ctx.moveTo(-5,-8);ctx.lineTo(5,-8);ctx.lineTo(8,-5);ctx.lineTo(8,4);ctx.lineTo(4,8);ctx.lineTo(-5,8);ctx.lineTo(-8,4);ctx.lineTo(-8,-4);ctx.closePath();ctx.fillStyle='#ffd09d';ctx.strokeStyle='#392d2a';ctx.lineWidth=2.5;ctx.fill();ctx.stroke();ctx.fillStyle='#e9a371';ctx.fillRect(-5,4,9,2);ctx.fillStyle='#ffe3ba';ctx.fillRect(-4,-5,6,2);
  if(side&&pose.point>.05){ctx.save();ctx.scale(pose.point,1);ctx.fillStyle='#392d2a';ctx.fillRect(4,-10,17,6);ctx.fillStyle='#ffd2a5';ctx.fillRect(4,-8,15,3);ctx.restore();}
  if(side&&pose.thumb>.05){ctx.save();ctx.scale(1,pose.thumb);ctx.fillStyle='#392d2a';ctx.fillRect(-2,-18,7,14);ctx.fillStyle='#ffd2a5';ctx.fillRect(0,-16,3,12);ctx.restore();}ctx.restore();
 }
 arm(0,hands[0]);arm(1,hands[1]);
 part('head',.49,.48,pose.head);
 // A short eyelid blink, placed over the original eyes; glasses remain visible.
 const eyes=id===2?[[.463,.35],[.632,.33]]:id===0?[[.494,.30],[.622,.28]]:id===1?[[.457,.35],[.592,.35]]:id===3?[[.459,.34],[.611,.33]]:[[.491,.37],[.625,.36]];
 const blink=t%4.7,closure=motion&&blink<.18?Math.sin(blink/.18*Math.PI):0;
 if(closure>.05){ctx.save();ctx.translate(.49*256,.48*256);ctx.rotate(pose.head);ctx.translate(-.49*256,-.48*256);for(const [x,y] of eyes){ctx.fillStyle='#ffc48a';ctx.fillRect(x*256,y*256,10,12*closure);if(closure>.85){ctx.fillStyle='#603e36';ctx.fillRect(x*256,y*256+10,10,1.5);}}ctx.restore();}
 ctx.restore();
 const symbol={think:'?',danger:'!',rescue:'✦',attack:'➜',block:'◇',reflect:'↶',clear:'★',clap:'♪',pump:'★',victory:'★',recover:'·'}[a];
 if(symbol){ctx.globalAlpha=motion?ease(u/.22):1;ctx.font='bold 28px sans-serif';ctx.textAlign='center';ctx.fillStyle=['block','reflect','rescue'].includes(a)?'#9fffe2':'#ffe372';ctx.strokeStyle='#263c52';ctx.lineWidth=4;ctx.strokeText(symbol,222,45);ctx.fillText(symbol,222,45);ctx.globalAlpha=1;}
}
function mount(img,i,preview=false){if(!img)return;const canvas=document.createElement('canvas');canvas.width=256;canvas.height=280;canvas.className='teacher-actor';canvas.setAttribute('aria-hidden','true');img.after(canvas);actors.push({img,canvas,ctx:canvas.getContext('2d'),i,preview,blend:new PoseBlend()});}
if(battle){for(let i=0;i<2;i++){mount(document.querySelector('#avatar'+i),i);mount(document.querySelector('#vsMobileTeacher'+i),i);}}else{mount(document.querySelector('#teacher'),0);mount(document.querySelector('#mobileTeacherIcon'),0);}
let resultEvent=null;
function teacherEvent(e){if(e.type==='end'){resultEvent=e;for(let i=0;i<(battle?2:1);i++)controllers[i].play(e.winner===null||e.winner===i?'victory':'recover',{force:true});return;}const i=e.player||0,chain=e.chain||(battle?match?.players[i]?.chain:typeof fastChain!=='undefined'?fastChain:0),action=eventAction(e,chain);if(action)controllers[i].play(action,{chain});}
root.teacherEvent=teacherEvent;
const previewController=new Controller();let previewId=2,previewActive=false;
const dialog=document.createElement('dialog');dialog.className='teacher-preview';dialog.setAttribute('aria-label','老師動作預覽');
const title=document.createElement('h2');title.textContent='老師動作預覽';const note=document.createElement('p');note.textContent='五位老師能力相同，各有招牌動作。遊戲中會按情況自動反應。';
const pick=document.createElement('select');pick.setAttribute('aria-label','預覽老師');EquationTeachers.forEach((t,i)=>{const o=document.createElement('option');o.value=i;o.textContent=t.name;pick.append(o)});pick.value='2';
const previewImg=document.createElement('img');previewImg.className='preview-teacher';previewImg.src=EquationTeachers[2].image;previewImg.alt=EquationTeachers[2].name;
const stage=document.createElement('div');stage.className='teacher-preview-stage';stage.append(previewImg);
const label=document.createElement('p');label.className='teacher-action-label';label.textContent=ACTIONS.idle;
const buttons=document.createElement('div');buttons.className='teacher-action-buttons';for(const [action,name] of Object.entries(ACTIONS)){const b=document.createElement('button');b.type='button';b.textContent=name;b.dataset.teacherAction=action;b.onclick=()=>{previewController.play(action,{force:true});previewController.left=4;label.textContent=name;};buttons.append(b);}
const close=document.createElement('button');close.textContent='關閉預覽';close.type='button';close.onclick=()=>dialog.close();pick.onchange=()=>{previewId=Number(pick.value);previewImg.src=EquationTeachers[previewId].image;previewImg.alt=EquationTeachers[previewId].name;previewController.play('signature',{force:true});label.textContent=ACTIONS.signature;};
const open=document.createElement('button');open.type='button';open.className='teacher-preview-open';open.textContent='老師動作預覽';open.onclick=()=>{previewActive=true;dialog.showModal();};
(battle?document.querySelector('#battleSetup .setup-card'):document.querySelector('#overlay .menu')).append(open);
dialog.addEventListener('close',()=>{previewActive=false;});dialog.append(title,note,pick,stage,label,buttons,close);document.body.append(dialog);mount(previewImg,0,true);
let last=0,lastSession=null,lastHints=[0,0];
function frame(now){const dt=Math.min(.05,(now-last)/1000||0);last=now;
 for(let j=actors.length-1;j>=0;j--)if(!actors[j].img.isConnected){actors[j].canvas.remove();actors.splice(j,1);}
 const session=battle?match:typeof version!=='undefined'?version:null;if(session!==lastSession){lastSession=session;resultEvent=null;lastHints=[0,0];for(const c of controllers){c.left=0;c.action='idle';}}
 if(resultEvent){
  if(battle){document.querySelectorAll('#resultDetails .result-avatar').forEach((img,i)=>{if(!img.dataset.motionMounted){img.dataset.motionMounted='yes';img.parentElement.style.position='relative';mount(img,i);}});}
  else{const menu=document.querySelector('#overlay .menu');if(menu&&!menu.querySelector('.solo-result-teacher')){const box=document.createElement('div');box.className='teacher-result-stage';const img=document.createElement('img');img.className='solo-result-teacher';img.src=document.querySelector('#teacher').src;img.alt=document.querySelector('#teacher').alt;box.append(img);menu.prepend(box);mount(img,0);}}
 }
 const pausedGame=battle?!!match?.paused:typeof paused!=='undefined'&&paused;
 const active=battle?match?.status==='playing'&&match.countdown<=0:typeof running!=='undefined'&&running;
 for(let i=0;i<(battle?2:1);i++){const p=battle?match?.players[i]:null;const hints=battle?p?.stats?.hints||0:learningStats.hints;if(hints>lastHints[i])controllers[i].play('think');lastHints[i]=hints;controllers[i].step(dt,{paused:pausedGame||mobileInputEditing||document.hidden,active,danger:!!document.querySelector(battle?'#field'+i:'#field')?.classList.contains('urgent'),aim:battle?p?.angle||0:angle});}
 if(previewActive)previewController.step(dt,{active:false});
 for(const actor of actors){const {img,canvas,ctx,i,preview}=actor;if(!img.isConnected){canvas.remove();continue;}const visible=img.getClientRects().length&&getComputedStyle(img).display!=='none'&&(!preview||previewActive);canvas.hidden=!visible;if(!visible||!img.complete||!img.naturalWidth)continue;
 const c=preview?previewController:controllers[i],id=preview?previewId:battle?match?.players[i]?.teacher??selection[i]:Number(document.querySelector('#singleTeacher')?.value??localStorage.getItem('equationTeacher')??2);
 // The sibling shares the source's coordinate space, including mobile layout.
 canvas.style.left=img.offsetLeft+'px';canvas.style.top=img.offsetTop+'px';canvas.style.width=img.offsetWidth+'px';canvas.style.height=img.offsetHeight+'px';canvas.dataset.action=c.action;canvas.dataset.clock=c.clock.toFixed(3);canvas.dataset.teacher=String(id);img.classList.add('teacher-motion-source');draw(ctx,img,c,id,actor);canvas.style.animationPlayState=pausedGame?'paused':'running';
 }
 requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
})(typeof globalThis!=='undefined'?globalThis:this);
