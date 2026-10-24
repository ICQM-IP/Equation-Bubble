(function(root){
'use strict';
const ACTIONS={idle:'待機呼吸',signature:'招牌動作',aim:'跟隨瞄準',fire:'揮手助攻',hit:'點頭肯定',clear:'解題歡呼',clap:'連解拍手',pump:'連解握拳',victory:'勝利姿勢',think:'思考提示',danger:'緊張戒備',rescue:'雙手救援',attack:'揮手攻擊',block:'格擋反制',reflect:'反彈攻擊',recover:'抹汗再出發'};
const PRIORITY={idle:0,signature:1,aim:2,danger:3,think:4,fire:5,hit:6,clear:7,clap:7,pump:7,attack:8,block:9,reflect:9,rescue:10,recover:10,victory:11};
const DURATIONS={fire:.5,hit:.8,clear:1.5,clap:1.5,pump:1.5,think:1.8,rescue:1.5,attack:1,block:1.1,reflect:1.4,recover:2,victory:3,signature:1.8};
class Controller{
 constructor(){this.action='idle';this.left=0;this.clock=0;this.direction=1;this.chain=0;}
 play(action,{chain=0,force=false}={}){if(!(action in ACTIONS))return false;if(!force&&this.left>0&&PRIORITY[action]<PRIORITY[this.action])return false;this.action=action;this.left=DURATIONS[action]||0;this.chain=chain;this.started=this.clock;return true;}
 step(dt,{paused=false,danger=false,aim=0,active=true}={}){if(paused)return;this.clock+=dt;this.direction=aim< -3?-1:aim>3?1:this.direction;if(this.left>0){this.left=Math.max(0,this.left-dt);if(this.left)return;}this.action=active&&danger?'danger':active&&Math.abs(aim)>3?'aim':'idle';if(active&&!danger&&Math.floor(this.clock/9)>Math.floor((this.clock-dt)/9))this.play('signature');}
}
function eventAction(e,chain=0){return {fire:'fire',hit:'hit',miss:'think',clear:chain>=4?'pump':chain>=2?'clap':'clear',chain:chain>=4?'pump':'clap',rescue:'rescue','attack-send':'attack','attack-flight':'attack','attack-cancel':'block','attack-reflect':'reflect','attack-receive':'danger','life-loss':'recover',frenzy:'pump'}[e.type];}
const api={ACTIONS,Controller,eventAction};if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(typeof document==='undefined')return;
const battle=document.body.classList.contains('versus-page'),controllers=[new Controller(),new Controller()],actors=[],reduced=matchMedia('(prefers-reduced-motion: reduce)');
// Independent clipped limbs retain each teacher's original pixel artwork.
const bitmapCache=new WeakMap();
const shapes={head:[[0,0],[.76,0],[.73,.29],[.68,.43],[.59,.50],[.31,.48],[.18,.45]],right:[[.65,.26],[1,.26],[1,.64],[.60,.64],[.60,.50]],left:[[.27,.51],[.40,.54],[.44,.73],[.30,.77],[.18,.64],[.21,.55]],legL:[[0,.73],[.5,.73],[.5,1],[0,1]],legR:[[.5,.73],[1,.73],[1,1],[.5,1]]};
function polygon(ctx,points){ctx.moveTo(points[0][0]*256,points[0][1]*256);for(const [x,y] of points.slice(1))ctx.lineTo(x*256,y*256);ctx.closePath();}
function draw(ctx,img,controller,id){
 const t=controller.clock,a=controller.action,u=t-(controller.started||0),motion=!reduced.matches&&!(typeof excitementEffects!=='undefined'&&!excitementEffects),wave=motion?Math.sin(u*14):0,pulse=motion?Math.sin(u*9):0;
 let right=.08,left=0,head=0,leg=0,jump=0,lean=0;
 if(motion){jump=Math.sin(t*2.6)*1.2;head=Math.sin(t*1.7)*.015;
 if(a==='aim'){right=-.12;head=controller.direction*.035;}
 if(a==='signature'){right=[-.35,.15,-.5,.3,.4][id];left=[-.18,.5,.15,-.4,-.45][id];head=[.07,-.04,.08,-.05,.02][id]*Math.sin(u*5);leg=Math.sin(u*7)*.035;}
 if(a==='fire'||a==='attack'){right=-.3+Math.sin(u*12)*.3;left=.12;lean=.035;leg=.05;}
 if(a==='hit'){head=Math.sin(u*9)*.09;right=-.55;left=.1;}
 if(['clear','clap','pump','victory'].includes(a)){jump=-Math.abs(pulse)*(a==='clear'?10:6);right=-.65+wave*(a==='clap'?.3:.12);left=.18-wave*.12;head=pulse*.03;leg=wave*.05;}
 if(a==='think'){head=.09;right=-.45;left=.12;}
 if(a==='danger'){right=-.3+wave*.06;left=.4;head=wave*.025;lean=-.025;}
 if(a==='rescue'){right=-.2+pulse*.2;left=-.24+pulse*.12;lean=pulse*.06;leg=.08;}
 if(a==='block'||a==='reflect'){right=-.5+pulse*.13;left=.25;lean=-.04;leg=.07;}
 if(a==='recover'){right=-.55;head=-.08;left=.2;jump=Math.sin(u*5)*2;}
 }
 ctx.clearRect(0,0,256,280);ctx.save();ctx.translate(128,230+jump);ctx.rotate(lean);ctx.translate(-128,-230);ctx.translate(12,12);ctx.scale(.9,.9);if(controller.direction<0){ctx.translate(256,0);ctx.scale(-1,1);}
 
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
 part('legL',.46,.75,leg);part('legR',.56,.75,-leg);
 // Articulated two-joint arms give each gesture its own hand placement.
 let hands=[[.30,.70],[.84,.46]],point=true,thumb=false;
 if(a==='idle')hands=[[.30,.69],[.77,.63]];
 if(a==='hit'){hands=[[.30,.68],[.76,.51]];point=false;thumb=true;}
 if(a==='think'){hands=[[.30,.69],id===2?[.61,.35]:[.61,.48]];point=false;}
 if(a==='clear'||a==='victory'){hands=[[.28,.35],[.76,.32]];point=false;}
 if(a==='clap'){const gap=.015+Math.abs(wave)*.055;hands=[[.51-gap,.60],[.51+gap,.60]];point=false;}
 if(a==='pump'||a==='danger'){hands=[[.28,.49],[.77,.47]];point=false;}
 if(a==='rescue'){hands=[[.25,.52],[.88,.50]];point=false;}
 if(a==='block'||a==='reflect'){hands=[[.49,.48],[.61,.46]];point=false;}
 if(a==='recover'){hands=[[.30,.69],[.65,.29]];point=false;}
 if(a==='signature'){hands=[[[.44,.61],[.59,.61]],[[.43,.58],[.59,.58]],[[.30,.68],[.62,.35]],[[.30,.59],[.76,.50]],[[.53,.60],[.46,.60]]][id];point=false;}
 const shirt=['#f4c343','#30313c','#418de1','#283b66','#a8aab4'][id],shade=['#ce981d','#20232e','#245da2','#1c2949','#797e8d'][id];
 function arm(side,hand){const sx=(side?.65:.34)*256,sy=(side?.54:.56)*256,hx=hand[0]*256,hy=hand[1]*256,ex=(sx+hx)/2+(side?5:-5),ey=(sy+hy)/2+7;
  ctx.lineJoin='miter';ctx.lineCap='square';ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(ex,ey);ctx.lineTo(hx,hy);ctx.strokeStyle='#1c202a';ctx.lineWidth=18;ctx.stroke();ctx.strokeStyle='#ffc48b';ctx.lineWidth=12;ctx.stroke();
  ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(id===1?ex:sx+(ex-sx)*.65,id===1?ey:sy+(ey-sy)*.65);ctx.strokeStyle=shade;ctx.lineWidth=20;ctx.stroke();ctx.strokeStyle=shirt;ctx.lineWidth=14;ctx.stroke();
  ctx.fillStyle='#1c202a';ctx.fillRect(hx-8,hy-8,16,17);ctx.fillStyle='#ffcc98';ctx.fillRect(hx-6,hy-6,12,12);ctx.fillStyle='#e79866';ctx.fillRect(hx-6,hy+4,12,3);
  if(side&&point){ctx.fillStyle='#1c202a';ctx.fillRect(hx+4,hy-11,18,7);ctx.fillStyle='#ffd2a5';ctx.fillRect(hx+5,hy-9,15,3);}
  if(side&&thumb){ctx.fillStyle='#1c202a';ctx.fillRect(hx-2,hy-19,8,15);ctx.fillStyle='#ffd2a5';ctx.fillRect(hx,hy-17,4,13);}
 }
 arm(0,hands[0]);arm(1,hands[1]);
 part('head',.49,.48,head);
 // A short eyelid blink, placed over the original eyes; glasses remain visible.
 const eyes=id===2?[[.463,.35],[.632,.33]]:id===0?[[.494,.30],[.622,.28]]:id===1?[[.457,.35],[.592,.35]]:id===3?[[.459,.34],[.611,.33]]:[[.491,.37],[.625,.36]];
 if(motion&&t%4.7<.11){ctx.fillStyle='#ffc48a';for(const [x,y] of eyes){ctx.fillRect(x*256,y*256,10,16);ctx.fillStyle='#603e36';ctx.fillRect(x*256,(y+.025)*256,10,2);ctx.fillStyle='#ffc48a';}}
 ctx.restore();
 const symbol={think:'?',danger:'!',rescue:'✦',attack:'➜',block:'◇',reflect:'↶',clear:'★',clap:'♪',pump:'★',victory:'★',recover:'·'}[a];
 if(symbol){ctx.font='bold 28px sans-serif';ctx.textAlign='center';ctx.fillStyle=['block','reflect','rescue'].includes(a)?'#9fffe2':'#ffe372';ctx.strokeStyle='#263c52';ctx.lineWidth=4;ctx.strokeText(symbol,222,45);ctx.fillText(symbol,222,45);}
}
function mount(img,i,preview=false){if(!img)return;const canvas=document.createElement('canvas');canvas.width=256;canvas.height=280;canvas.className='teacher-actor';canvas.setAttribute('aria-hidden','true');img.after(canvas);actors.push({img,canvas,ctx:canvas.getContext('2d'),i,preview});}
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
 canvas.style.left=img.offsetLeft+'px';canvas.style.top=img.offsetTop+'px';canvas.style.width=img.offsetWidth+'px';canvas.style.height=img.offsetHeight+'px';canvas.dataset.action=c.action;canvas.dataset.clock=c.clock.toFixed(3);canvas.dataset.teacher=String(id);img.classList.add('teacher-motion-source');draw(ctx,img,c,id);canvas.style.animationPlayState=pausedGame?'paused':'running';
 }
 requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
})(typeof globalThis!=='undefined'?globalThis:this);
