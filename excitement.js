'use strict';
// Presentation reads engine state; all power, clocks and attacks live in the engines.
const excitementBattle=document.body.classList.contains('versus-page');
let excitementEffects=!matchMedia('(prefers-reduced-motion: reduce)').matches,excitementMusic=true,lastBeat=-1,lastFrenzy=false;
try{excitementEffects=localStorage.getItem('equationEffects')===null?excitementEffects:localStorage.getItem('equationEffects')==='on';excitementMusic=localStorage.getItem('equationMusic')!=='off'}catch{}
const effectSettings=document.createElement('div');effectSettings.className='effect-settings';
for(const [label,key,current] of [['閃光及震動','effects',excitementEffects],['節奏音樂（需開啟聲音）','music',excitementMusic]]){const wrap=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.checked=current;input.onchange=()=>{if(key==='effects')excitementEffects=input.checked;else excitementMusic=input.checked;document.body.classList.toggle('effects-off',!excitementEffects);try{localStorage.setItem(key==='effects'?'equationEffects':'equationMusic',input.checked?'on':'off')}catch{}};wrap.append(input,document.createTextNode(' '+label));effectSettings.append(wrap)}
(excitementBattle?document.querySelector('#battleSetup .setup-card'):document.querySelector('#overlay .menu')).append(effectSettings);
const excitementHelp=document.createElement('p');excitementHelp.className='turbo-help';excitementHelp.textContent=excitementBattle?'極速：連續命中提升火力；8 秒內連解可追加攻擊。金色星題沿用所選課題，解出送 2 題；連擊最高送 3 題。解星題可反彈來襲攻擊（最多來回兩次）。救援每局一次：P1 按 R，P2 按 /。限時最後 30 秒進入狂熱。':'極速：連續命中提升火力；8 秒內連解獲額外分數。R 救援每局一次，推回全部等式。限時最後 30 秒進入狂熱；不下降練習停用極速。';effectSettings.before(excitementHelp);
const excitementPanels=learningPanels.map(ui=>{const line=document.createElement('p');line.className='power-status';const bar=document.createElement('div');bar.className='power-meter';bar.setAttribute('aria-hidden','true');const fill=document.createElement('span');bar.append(fill);const rescueButton=document.createElement('button');rescueButton.type='button';rescueButton.className='rescue-button';rescueButton.setAttribute('aria-label',excitementBattle?'玩家 '+(Number(ui.panel.dataset.learningPlayer)+1)+' 救援':'危機救援');rescueButton.onclick=()=>{if(excitementBattle)activePlayer(Number(ui.panel.dataset.learningPlayer))?.rescue();else rescue()};ui.panel.insertBefore(line,ui.choices);ui.panel.insertBefore(bar,ui.choices);ui.panel.append(rescueButton);return {ui,line,bar,fill,rescueButton}});
function updateExcitement(){
 const enabled=excitementBattle?!!match?.turbo:turbo,finale=enabled&&(excitementBattle?match.frenzy:frenzy);
 document.body.classList.toggle('turbo-active',enabled);document.body.classList.toggle('frenzy-mode',!!finale);document.body.classList.toggle('effects-off',!excitementEffects);
 for(const panel of excitementPanels){const i=Number(panel.ui.panel.dataset.learningPlayer),p=excitementBattle?match?.players[i]:null;
 panel.line.hidden=panel.bar.hidden=panel.rescueButton.hidden=!enabled;if(!enabled)continue;
 const power=excitementBattle?p.heat:heat,chain=excitementBattle?p.chain:fastChain,until=excitementBattle?p.chainUntil:chainUntil,elapsed=excitementBattle?match.elapsed:sessionElapsed,remaining=Math.max(0,until-elapsed),used=excitementBattle?p.rescueUsed:rescueUsed;
 panel.line.textContent=(finale?'🔥 最後狂熱 · ':'')+'火力 '+power+'/5'+(chain&&remaining>0?' · '+chain+' 連解 · '+remaining.toFixed(1)+' 秒續擊':' · 8 秒內連解可追擊');panel.fill.style.width=power*20+'%';panel.rescueButton.textContent=used?'救援已用盡':'🛟 救援一次'+(excitementBattle?(i===0?' R':' /'):' R');panel.rescueButton.disabled=used||!(excitementBattle?p.canFire:canAct());
 const field=document.querySelector(excitementBattle?'#field'+i:'#field');field.dataset.power=String(power);document.querySelector(excitementBattle?'#cannon'+i:'#cannon').style.setProperty('--heat',power);
 }
 const active=excitementBattle?match?.status==='playing'&&!match.paused&&match.countdown<=0:running&&!paused;
 if(enabled&&active&&!mobileInputEditing&&excitementMusic&&sound){const elapsed=excitementBattle?match.elapsed:sessionElapsed,beat=Math.floor(elapsed/(finale?.18:.34));if(beat!==lastBeat){lastBeat=beat;const notes=finale?[440,554,659,880,659,554]:[220,330,440,330];if(excitementBattle)tone(notes[beat%notes.length]);else beep(notes[beat%notes.length]);}}
 lastFrenzy=finale;
}
function excitementEvent(e){const enabled=excitementBattle?!!match?.turbo:turbo;if(!enabled)return;
 const i=e.player||0,field=document.querySelector(excitementBattle?'#field'+i:'#field');
 if(e.type==='fire'){const cannon=document.querySelector(excitementBattle?'#cannon'+i:'#cannon');cannon.classList.remove('turbo-recoil');void cannon.offsetWidth;cannon.classList.add('turbo-recoil');}
 if(['clear','rescue','attack-reflect','frenzy','chain'].includes(e.type)){
 const label=e.type==='rescue'?'🛟 救援啟動':e.type==='attack-reflect'?'↩ 反彈攻擊！':e.type==='frenzy'?'🔥 最後 30 秒！':e.type==='chain'?e.chain+' 連解！':(excitementBattle?match.players[i].chain:fastChain)>=2?'連擊爆發！':'漂亮解題！';
 if(excitementBattle){if(!['clear','chain'].includes(e.type))callout(i,label);}else callout(label,'#ffe68b');
 if(excitementEffects){field.classList.remove('turbo-burst');void field.offsetWidth;field.classList.add('turbo-burst');if(navigator.vibrate)navigator.vibrate(e.type==='rescue'?[35,30,35]:30);}
 if(e.type==='clear'){const teacher=document.querySelector(excitementBattle?'#avatar'+i:'#teacher');teacher.classList.remove('turbo-cheer');void teacher.offsetWidth;teacher.classList.add('turbo-cheer');if(sound){if(excitementBattle)tone(880);else beep(880);}}
 }
 if(e.type==='attack-flight'){
 const packet=document.createElement('div');packet.className='duel-flight';packet.textContent=(e.bounces?'↩':'⚔')+' ×'+e.strength;packet.setAttribute('aria-hidden','true');const from=document.querySelector('#field'+i).getBoundingClientRect(),to=document.querySelector('#field'+(1-i)).getBoundingClientRect();const x=from.left+from.width/2,y=Math.min(innerHeight-35,Math.max(35,from.top+from.height/2));packet.style.left=x+'px';packet.style.top=y+'px';packet.style.setProperty('--flight-x',(to.left+to.width/2-x)+'px');packet.style.setProperty('--flight-y',(Math.min(innerHeight-35,Math.max(35,to.top+to.height/2))-y)+'px');document.body.append(packet);setTimeout(()=>packet.remove(),850);
 }
}
const excitementCSS=document.createElement('link');excitementCSS.rel='stylesheet';excitementCSS.href='excitement.css?v=150';document.head.append(excitementCSS);updateExcitement();
