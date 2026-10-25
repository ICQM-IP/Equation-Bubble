(function(root){
'use strict';
const ACTIONS={idle:'自然站姿',signature:'招牌動作',aim:'跟隨瞄準',fire:'揮手助攻',hit:'點頭肯定',clear:'解題歡呼',clap:'連解拍手',pump:'連解握拳',victory:'勝利姿勢',think:'思考提示',danger:'緊張戒備',rescue:'雙手救援',attack:'揮手攻擊',block:'格擋反制',reflect:'反彈攻擊',recover:'抹汗再出發'};
const PRIORITY={idle:0,signature:1,aim:2,danger:3,think:4,fire:5,hit:6,clear:7,clap:7,pump:7,attack:8,block:9,reflect:9,rescue:10,recover:10,victory:11};
const DURATIONS={fire:.7,hit:1,clear:1.8,clap:1.8,pump:1.8,think:2.4,rescue:1.8,attack:1.2,block:1.4,reflect:1.6,recover:2.5,victory:3,signature:2.4};
class Controller{
 constructor(){this.action='idle';this.left=0;this.clock=0;this.direction=1;this.chain=0;}
 play(action,{chain=0,force=false}={}){if(!(action in ACTIONS))return false;if(!force&&this.left>0&&PRIORITY[action]<PRIORITY[this.action])return false;if(!force&&action===this.action&&this.left>0)return false;this.action=action;this.left=DURATIONS[action]||0;this.chain=chain;this.started=this.clock;return true;}
 step(dt,{paused=false,danger=false,aim=0,active=true}={}){if(paused)return;this.clock+=dt;this.direction=aim< -3?-1:aim>3?1:this.direction;if(this.left>0){this.left=Math.max(0,this.left-dt);if(this.left)return;}this.action=active&&danger?'danger':active&&Math.abs(aim)>3?'aim':'idle';if(active&&!danger&&Math.floor(this.clock/9)>Math.floor((this.clock-dt)/9))this.play('signature');}
}
function eventAction(e,chain=0){return {fire:'fire',hit:'hit',miss:'think',clear:chain>=4?'pump':chain>=2?'clap':'clear',chain:chain>=4?'pump':'clap',rescue:'rescue','attack-send':'attack','attack-flight':'attack','attack-cancel':'block','attack-reflect':'reflect','attack-receive':'danger','life-loss':'recover',frenzy:'pump'}[e.type];}

const FRAME_ORDER=Object.keys(ACTIONS);
function frameRect(width,height,action){const index=FRAME_ORDER.indexOf(action);if(index<0)throw Error('Unknown teacher action');return {x:(index%4)*width/4,y:Math.floor(index/4)*height/4,width:width/4,height:height/4};}
const api={ACTIONS,Controller,eventAction,FRAME_ORDER,frameRect};if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(typeof document==='undefined')return;
const battle=document.body.classList.contains('versus-page'),controllers=[new Controller(),new Controller()],actors=[];
// Every cell contains one independently illustrated COMPLETE teacher pose.
// No limb masks, skeletal transforms, procedural hands or joint interpolation.
const atlases=EquationTeachers.map((teacher,id)=>{const image=new Image();image.decoding='async';image.src='assets/teacher-actions-'+id+'.png?v=200';return image;});
function draw(ctx,img,controller,id,actor){
 const sheet=atlases[id];if(!sheet?.complete||!sheet.naturalWidth)return false;
 const cell=FRAME_ORDER.indexOf(controller.action),rect=frameRect(sheet.naturalWidth,sheet.naturalHeight,controller.action),sw=rect.width,sh=rect.height;
 ctx.clearRect(0,0,256,280);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 const scale=Math.min(256/sw,280/sh),w=sw*scale,h=sh*scale;
 ctx.drawImage(sheet,rect.x,rect.y,sw,sh,(256-w)/2,(280-h)/2,w,h);
 actor.canvas.dataset.frame=String(cell);actor.canvas.dataset.art=sheet.getAttribute('src');return true;
}
function mount(img,i,preview=false){if(!img)return;const canvas=document.createElement('canvas');canvas.width=256;canvas.height=280;canvas.className='teacher-actor';canvas.setAttribute('aria-hidden','true');img.after(canvas);actors.push({img,canvas,ctx:canvas.getContext('2d'),i,preview});}
if(battle){for(let i=0;i<2;i++){mount(document.querySelector('#avatar'+i),i);mount(document.querySelector('#vsMobileTeacher'+i),i);}}else{mount(document.querySelector('#teacher'),0);mount(document.querySelector('#mobileTeacherIcon'),0);}
let resultEvent=null;
function teacherEvent(e){if(typeof root.arcadeArtEvent==='function')root.arcadeArtEvent(e);if(e.type==='end'){resultEvent=e;for(let i=0;i<(battle?2:1);i++)controllers[i].play(e.winner===null||e.winner===i?'victory':'recover',{force:true});return;}const i=e.player||0,chain=e.chain||(battle?match?.players[i]?.chain:typeof fastChain!=='undefined'?fastChain:0),action=eventAction(e,chain);if(action)controllers[i].play(action,{chain});}
root.teacherEvent=teacherEvent;
const previewController=new Controller();let previewId=2,previewActive=false;
const dialog=document.createElement('dialog');dialog.className='teacher-preview';dialog.setAttribute('aria-label','老師動作預覽');
const title=document.createElement('h2');title.textContent='老師動作預覽';const note=document.createElement('p');note.textContent='每個動作都是獨立繪製的完整角色圖。遊戲中會按情況自動換圖。';
const pick=document.createElement('select');pick.setAttribute('aria-label','預覽老師');EquationTeachers.forEach((t,i)=>{const o=document.createElement('option');o.value=i;o.textContent=t.name;pick.append(o)});pick.value='2';
const previewImg=document.createElement('img');previewImg.className='preview-teacher';previewImg.src=EquationTeachers[2].image;previewImg.alt=EquationTeachers[2].name;
const stage=document.createElement('div');stage.className='teacher-preview-stage';stage.append(previewImg);
const label=document.createElement('p');label.className='teacher-action-label';label.textContent=ACTIONS.idle;
const buttons=document.createElement('div');buttons.className='teacher-action-buttons';for(const [action,name] of Object.entries(ACTIONS)){const b=document.createElement('button');b.type='button';b.textContent=name;b.dataset.teacherAction=action;b.onclick=()=>{previewController.play(action,{force:true});previewController.left=4;label.textContent=name;};buttons.append(b);}
const close=document.createElement('button');close.textContent='關閉預覽';close.type='button';close.onclick=()=>dialog.close();pick.onchange=()=>{previewId=Number(pick.value);previewImg.src=EquationTeachers[previewId].image;previewImg.alt=EquationTeachers[previewId].name;previewController.play('signature',{force:true});label.textContent=ACTIONS.signature;};
const open=document.createElement('button');open.type='button';open.className='teacher-preview-open';open.textContent='老師動作預覽';open.onclick=()=>{previewActive=true;dialog.showModal();};
// The pose preview has no player-facing entry point.
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
 canvas.style.left=img.offsetLeft+'px';canvas.style.top=img.offsetTop+'px';canvas.style.width=img.offsetWidth+'px';canvas.style.height=img.offsetHeight+'px';canvas.dataset.action=c.action;canvas.dataset.clock=c.clock.toFixed(3);canvas.dataset.teacher=String(id);const ready=draw(ctx,img,c,id,actor);img.classList.toggle('teacher-motion-source',ready);canvas.hidden=!ready;canvas.style.animationPlayState=pausedGame?'paused':'running';
 }
 requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
})(typeof globalThis!=='undefined'?globalThis:this);
