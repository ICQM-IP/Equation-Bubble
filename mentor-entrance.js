(function(root){
'use strict';
const intersects=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
function crosses(rect,a,b){
 let lo=0,hi=1;for(const [p,d,min,max] of [[a.x,b.x-a.x,rect.x,rect.x+rect.w],[a.y,b.y-a.y,rect.y,rect.y+rect.h]]){
  if(Math.abs(d)<1e-9){if(p<min||p>max)return false;continue;}
  let t0=(min-p)/d,t1=(max-p)/d;if(t0>t1)[t0,t1]=[t1,t0];lo=Math.max(lo,t0);hi=Math.min(hi,t1);if(lo>hi)return false;
 }return true;
}
function placement({width,height,line,origin,strong=false,compact=false,side=0,obstacles=[],path=[],preferredX}){
 const y=line+(compact?48:34),h=Math.min(strong?162:138,height-y-8),w=Math.min(strong?250:215,width*.32);
 if(h<65)return null;
 const left=16,right=width-w-16;
 const candidates=[preferredX,...(strong?[origin-w-22,origin+22,side?right:left,side?left:right]:[side?right:left,side?left:right])].filter(Number.isFinite);
 for(const candidate of candidates){
  const rect={x:Math.max(left,Math.min(right,candidate)),y,w,h};const padded={x:rect.x-10,y:rect.y-8,w:w+20,h:h+16};
  if(obstacles.some(o=>intersects(padded,o)))continue;
  if(path.some((p,i)=>i>0&&crosses(padded,path[i-1],p)))continue;
  return rect;
 }return null;
}
function entranceFor(e){
 const chain=Number(e.chain)||0;
 if(e.type==='clear'||e.type==='chain')return {strong:chain>=3,text:chain>=2?chain+' 連解！':'漂亮消元！',pose:chain>=3?7:5,duration:chain>=3?1.1:.78,priority:chain>=3?3:1};
 const special={rescue:['救援啟動！',11], 'attack-send':['星題出擊！',12], 'attack-cancel':['漂亮反制！',13], 'attack-reflect':['反彈成功！',14]}[e.type];
 return special?{strong:true,text:special[0],pose:special[1],duration:1.1,priority:4}:null;
}
const api={placement,entranceFor,crosses};if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(typeof document==='undefined')return;
const versus=document.body.classList.contains('versus-page'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
const tracks=[],sheets=EquationTeachers.map((teacher,i)=>{const img=new Image();img.src='assets/teacher-actions-'+i+'.png?v=200';return img;});
for(let i=0;i<(versus?2:1);i++){
 const field=document.querySelector(versus?'#field'+i:'#field');
 const el=document.createElement('div');el.className='stage-entrance';el.setAttribute('aria-hidden','true');el.hidden=true;
 const canvas=document.createElement('canvas');canvas.width=320;canvas.height=200;canvas.className='stage-mentor-portrait';
 const label=document.createElement('span');label.className='stage-mentor-label';el.append(canvas,label);field.append(el);
 tracks.push({field,el,canvas,label,i,reaction:null,lastX:undefined});
}
const previous=root.arcadeArtEvent;
root.arcadeArtEvent=function(e){
 if(previous)previous(e);
 const track=tracks[e.player||0];if(!track)return;
 const chain=e.chain||(versus?match?.players[e.player||0]?.chain:typeof turbo!=='undefined'&&turbo?fastChain:combo)||0;
 const reaction=entranceFor({...e,chain});if(!reaction)return;
 if(track.reaction?.left>0&&track.reaction.priority>reaction.priority)return;
 track.reaction={...reaction,left:reaction.duration};track.lastX=undefined;
 track.el.classList.remove('arrive');void track.el.offsetWidth;track.el.classList.add('arrive');
};
function showEntrance(track,on){
 track.el.hidden=!on;
 for(const selector of versus?['#avatar'+track.i,'#vsMobileTeacher'+track.i]:['#teacher','#mobileTeacherIcon']){
  const source=document.querySelector(selector);if(!source)continue;
  source.classList.toggle('mentor-offstage',on);
  source.parentElement.querySelector('.teacher-actor')?.classList.toggle('mentor-offstage',on);
 }
 for(const decoration of document.querySelectorAll('.mentor-stage[data-player="'+track.i+'"]'))decoration.classList.toggle('mentor-offstage',on);
}
function localRect(el,fieldRect,sx,sy){const r=el.getBoundingClientRect();return {x:(r.left-fieldRect.left)*sx,y:(r.top-fieldRect.top)*sy,w:r.width*sx,h:r.height*sy};}
let last=0,session;
function frame(now){
 const dt=Math.min(.05,(now-last)/1000||0);last=now;
 const current=versus?match:version;if(current!==session){session=current;tracks.forEach(t=>{t.reaction=null;t.lastX=undefined;});}
 const pausedNow=document.hidden||mobileInputEditing||(versus?!!match?.paused:paused);
 const active=versus?match?.status==='playing'&&match.countdown<=0&&document.querySelector('#battleSetup').classList.contains('hidden')&&document.querySelector('#battleResult').classList.contains('hidden'):running;
 const quiet=reduced.matches||typeof excitementEffects!=='undefined'&&!excitementEffects;
 for(const t of tracks){
  const reaction=t.reaction;if(reaction&&!pausedNow)reaction.left=Math.max(0,reaction.left-dt);
  if(!active||!reaction||reaction.left<=0){showEntrance(t,false);continue;}
  const rect=t.field.getBoundingClientRect();if(!rect.width||!rect.height){showEntrance(t,false);continue;}
  const width=t.field.offsetWidth,height=t.field.offsetHeight,sx=width/rect.width,sy=height/rect.height;
  const danger=t.field.querySelector(versus?'.battle-danger':'.danger');
  const obstacleNodes=[...t.field.querySelectorAll(versus?'.battle-row':'.row')];if(danger)obstacleNodes.push(danger);
  const obstacles=obstacleNodes.map(el=>localRect(el,rect,sx,sy));
  const guide=document.querySelector(versus?'#guide'+t.i:'#trajectory path');
  const numbers=(guide?.getAttribute('d')||'').match(/[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?/gi)||[];
  const path=[];for(let j=0;j+1<numbers.length;j+=2)path.push({x:Number(numbers[j]),y:Number(numbers[j+1])});
  const strong=reaction.strong&&!quiet;
  const pos=placement({width,height,line:versus?478:476,origin:versus?380:560,strong,compact:mobileMode,side:t.i,obstacles,path,preferredX:t.lastX});
  showEntrance(t,!!pos);if(!pos)continue;t.lastX=pos.x;
  Object.assign(t.el.style,{left:pos.x+'px',top:pos.y+'px',width:pos.w+'px',height:pos.h+'px',animationPlayState:pausedNow?'paused':'running'});
  t.el.classList.toggle('behind-cannon',strong);t.el.classList.toggle('quiet',quiet);t.el.classList.toggle('from-right',!!t.i);
  t.el.dataset.event=reaction.pose;t.label.textContent=reaction.text;
  const source=document.querySelector(versus?'#avatar'+t.i:'#teacher');
  const id=Math.max(0,EquationTeachers.findIndex(teacher=>teacher.image===source.getAttribute('src')));
  const sheet=sheets[id],ctx=t.canvas.getContext('2d');ctx.clearRect(0,0,320,200);
  if(sheet.complete&&sheet.naturalWidth){const cell=sheet.naturalWidth/4,row=sheet.naturalHeight/4;ctx.imageSmoothingEnabled=true;ctx.drawImage(sheet,(reaction.pose%4)*cell,Math.floor(reaction.pose/4)*row,cell,row*.62,0,0,320,200);}
  else if(source.complete&&source.naturalWidth)ctx.drawImage(source,0,0,source.naturalWidth,source.naturalHeight*.62,0,0,320,200);
 }
 requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
})(typeof globalThis!=='undefined'?globalThis:this);
