'use strict';
// Native-size touch controls surround the existing mathematical playfield.
const mobileVersus=document.body.classList.contains('versus-page');
let mobileEditor=null;
const mobileOverlayParent=document.querySelector('#overlay')?.parentElement;
function mirrorMath(sourceId,targetId){
 const source=document.querySelector(sourceId),target=document.querySelector(targetId);if(!source||!target)return;
 const signature=source.innerHTML??source.textContent;if(target._mathSignature===signature)return;target._mathSignature=signature;
 if(!source.textContent){target.textContent='命中後顯示運算步驟';target.classList.add('waiting');return;}
 target.classList.remove('waiting');
 if(source.childNodes&&typeof source.cloneNode==='function')target.replaceChildren(...Array.from(source.childNodes,n=>n.cloneNode(true)));else target.textContent=source.textContent;
}
function syncMobileHud(){
 if(!mobileMode)return;
 document.querySelector('#deviceStatus').textContent=mobileInputEditing?'輸入中：場面暫停':'';
 if(mobileVersus){
  if(!match)return;
  for(const p of match.players){const i=p.index;if(typeof computerMode!=='undefined'&&computerMode&&i===1)continue;
   document.querySelector('#vsMobileLoaded'+i).textContent=p.ammo().label;document.querySelector('#vsMobileName'+i).textContent=document.querySelector('#name'+i).textContent;document.querySelector('#vsMobileTeacher'+i).src=document.querySelector('#avatar'+i).src;mirrorMath('#math'+i,'#vsMobileMath'+i);
   document.querySelector('#vsMobileMessage'+i).textContent=p.message;
   document.querySelector('#vsMobileHint'+i).textContent='提示 '+Math.min(3,p.hintLevel+1)+'/3';
   document.querySelector('#vsMobileLabel'+i).hidden=!match.challenge;
   const input=document.querySelector('#vsMobileValue'+i);if(input.value!==p.manualValue)input.value=p.manualValue;
   document.querySelector('#vsMobileFire'+i).disabled=!p.canFire;
   for(const b of document.querySelectorAll('.mobile-vs-controls[data-player="'+i+'"] [data-vs-op]')){const on=Number(b.dataset.vsOp)===p.op;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));}
  }
 }else{
  document.querySelector('#mobileLoaded').textContent=loaded?.label||'選擇運算';
  document.querySelector('#mobileProgress').textContent=score+' 分 · ♥ '+lives+' · '+topicName()+' · '+learningStats.solved+' 題';document.querySelector('#mobileTeacherIcon').src=document.querySelector('#teacher').src;document.querySelector('#mobileTeacherName').textContent=String(document.querySelector('#teacher').alt||'').replace(' 指導老師','');mirrorMath('#teachingMath','#mobileMath');
  document.querySelector('#mobileFeedback').textContent=document.querySelector('#speech').textContent;
  document.querySelector('#mobileHint').textContent='提示 '+Math.min(3,hintLevel+1)+'/3';
  document.querySelector('#mobileValueLabel').hidden=!challenge;
  const input=document.querySelector('#mobileValue'),value=document.querySelector('#ammoValue').value;if(input.value!==value)input.value=value;
  document.querySelector('#mobileFire').disabled=!canAct();
 }
 document.querySelector('#devicePause').textContent=(mobileVersus?match?.paused:paused)?'繼續':'暫停';
}
function setDeviceMode(on){
 // Layout must not move a target while its shot or operation is in progress.
 if(mobileVersus?match?.players.some(p=>p.bullet||p.phase):busy){document.querySelector('#deviceStatus').textContent='請等炮彈完成後切換';return;}
 if(mobileEditor)mobileEditor.blur();mobileInputEditing=false;mobileMode=!!on;
 document.body.classList.toggle('mobile-mode',mobileMode);
 document.querySelector('#deviceToolbar').hidden=!mobileMode;
 if(!mobileVersus){document.querySelector('#mobileControls').hidden=!mobileMode;if(document.querySelector('#deviceChoice'))document.querySelector('#deviceChoice').checked=mobileMode;const overlay=document.querySelector('#overlay');if(mobileMode)document.body.append(overlay);else mobileOverlayParent.append(overlay);
  keys.clear();PACE.maxRows=mobileMode?4:12;PACE.spawnTime=mobileMode?5:2;
  if(rows.length){const ordered=[...rows].sort((a,b)=>b.y-a.y);const bottom=Math.min(220,ordered[0].y);
   ordered.forEach((r,i)=>{r.lane=mobileMode?0:(r.spawnSide??i%2);if(mobileMode){r.y=bottom-i*156;r.scatterX=(r.spawnSide?1:-1)*(40+Math.random()*110);}renderRow(r);});if(practice)arrangePracticeRows();load();}
  fit();
 }else{match?.players.forEach(p=>p.held.clear());fitBattle();}
 document.querySelector('#deviceToggle').textContent=mobileMode?'電腦版':'📱 手提裝置模式';
 try{localStorage.setItem('equationMobileMode',mobileMode?'on':'off')}catch{}
 syncMobileHud();
}
function registerEditor(input,onInput){
 input.addEventListener('input',onInput);
 input.addEventListener('focus',()=>{if(!mobileMode)return;mobileEditor=input;mobileInputEditing=true;if(mobileVersus)match?.players.forEach(p=>p.held.clear());else keys.clear();syncMobileHud();});
 input.addEventListener('blur',()=>{if(mobileEditor!==input)return;mobileEditor=null;mobileInputEditing=false;if(mobileVersus)fitBattle();else fit();syncMobileHud();});
 input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();input.blur();}});
}
document.querySelector('#deviceToggle').onclick=()=>setDeviceMode(!mobileMode);
document.querySelector('#deviceDesktop').onclick=()=>setDeviceMode(false);
document.querySelector('#devicePause').onclick=()=>{if(mobileVersus)pause();else togglePause();syncMobileHud();};
if(!mobileVersus){
 document.querySelector('#deviceChoice').addEventListener('change',e=>setDeviceMode(e.target.checked));
 document.querySelector('#mobileFire').onclick=()=>{document.querySelector('#mobileValue').blur();launch();syncMobileHud();};
 document.querySelector('#mobileHint').onclick=()=>{hint();syncMobileHud();};
 registerEditor(document.querySelector('#mobileValue'),()=>{document.querySelector('#ammoValue').value=document.querySelector('#mobileValue').value;load();});
 const field=document.querySelector('#field');
 field.addEventListener('pointerdown',e=>{if(!mobileMode||!canAct()||e.target.closest('.node'))return;field.setPointerCapture(e.pointerId);});
 field.addEventListener('pointermove',e=>{if(!mobileMode||!canAct()||e.buttons!==1)return;const rect=field.getBoundingClientRect();const x=(e.clientX-rect.left)*W/rect.width,y=(e.clientY-rect.top)*H/rect.height;angle=Math.max(-70,Math.min(70,Math.atan2(x-ORIGIN.x,ORIGIN.y-y)*180/Math.PI));updateAim();});
}else{
 for(let i=0;i<2;i++){
  document.querySelector('#vsMobileFire'+i).onclick=()=>{document.querySelector('#vsMobileValue'+i).blur();activePlayer(i)?.fire();syncMobileHud();};
  document.querySelector('#vsMobileHint'+i).onclick=()=>{activePlayer(i)?.hint();syncMobileHud();};
  registerEditor(document.querySelector('#vsMobileValue'+i),()=>{const p=activePlayer(i);if(p){p.manualValue=document.querySelector('#vsMobileValue'+i).value;render();}});
  const group=document.querySelector('.mobile-vs-controls[data-player="'+i+'"]');
  for(const b of group.querySelectorAll('[data-vs-op]'))b.onclick=()=>{const p=activePlayer(i);if(p?.active)p.op=Number(b.dataset.vsOp);syncMobileHud();};
  for(const b of group.querySelectorAll('[data-vs-turn]')){b.onpointerdown=e=>{const p=activePlayer(i);if(!p?.active)return;b.setPointerCapture(e.pointerId);p.held.add(b.dataset.vsTurn);};for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>match?.players[i].held.delete(b.dataset.vsTurn));}
 }
}
let savedDeviceMode=null;try{savedDeviceMode=localStorage.getItem('equationMobileMode')}catch{}
const touchDefault=typeof matchMedia==='function'&&matchMedia('(pointer:coarse)').matches&&innerWidth<=1100;
setDeviceMode(savedDeviceMode===null?touchDefault:savedDeviceMode==='on');
