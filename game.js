'use strict';
const M=EquationMath,$=s=>document.querySelector(s),names=['一步方程','兩步方程','兩邊未知數','括號','分數與 LCM'];
let rows=[],selected=null,target=null,op='−',score=0,combo=0,lives=3,level=1,cleared=0,running=false,paused=false,busy=false,practice=false,last=0,spawnClock=0,nextId=1,sound=false,audio=null,epoch=0;
function beep(freq=440){if(!sound)return;try{audio=audio||new(window.AudioContext||window.webkitAudioContext)();audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type='square';o.frequency.value=freq;g.gain.setValueAtTime(.035,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.13);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+.14)}catch{}}
const current=()=>rows.find(r=>r.id===selected);
function term(v,x=false){return x?(v.eq(1)?'x':v.eq(-1)?'−x':v+'x'):String(v)}
function sideText(s){return (s.a.eq(0)?'':term(s.a,true))+(s.b.eq(0)?'':(s.a.eq(0)?'':s.b.n<0n?' − ':' + ')+(s.a.eq(0)?s.b:s.b.n<0n?s.b.neg():s.b))||'0'}
const textEq=e=>e.group?`${e.group.k}(x ${e.group.b<0?'−':'+'} ${Math.abs(e.group.b)}) = ${sideText(e.r)}`:`${sideText(e.l)} = ${sideText(e.r)}`;
function message(s){$('#message').textContent=s;const t=$('#teacherSpeech');if(t){t.textContent=s;const panel=$('#teacherPanel');panel.classList.remove('cheer','think');void panel.offsetWidth;panel.classList.add(/成功|消除|完成|STAGE/.test(s)?'cheer':'think')}}
function hud(){$('#score').textContent=String(score).padStart(6,'0');$('#stage').textContent=String(level).padStart(2,'0')+' / 05';$('#combo').textContent='×'+Math.max(combo,1);$('#lives').textContent='♥ '.repeat(lives)||'—';$('#levelName').textContent=String(level).padStart(2,'0')+' · '+names[level-1];$('#progress').textContent=cleared+' / 4 CLEARED';$('#pause').textContent=paused?'繼續 P':'暫停 P'}
function spawn(){let e=M.generate(level);let r={id:nextId++,e,original:e,y:48,el:document.createElement('div')};r.el.className='row';r.el.onclick=()=>{if(canAct()){selected=r.id;target=null;render()}};rows.push(r);$('#rows').append(r.el);if(!selected)selected=r.id;render()}
function canAct(){return running&&!paused&&!busy}
function node(r,key,label){let b=document.createElement('button');b.className='node';b.textContent=label;b.dataset.target=key;b.setAttribute('aria-label','目標 '+label);const ms=M.moves(r.e);if(ms.some(m=>m.target===key||m.target==='fraction'&&key.length===2&&r.e[key[0]]?.[key[1]]?.d>1n))b.classList.add('valid');if(r.id===selected&&target===key)b.classList.add('target');b.onclick=ev=>{ev.stopPropagation();if(!canAct())return;selected=r.id;target=key;render();aim(r.el.querySelector('[data-target="'+key+'"]'))};return b}
function aim(b){const f=$('#field').getBoundingClientRect(),r=b.getBoundingClientRect();$('#barrel').style.transform=`rotate(${Math.atan2(r.x+r.width/2-f.x-f.width/2,f.bottom-40-r.y)*180/Math.PI}deg)`}
function render(){
 for(const r of rows){r.el.className='row'+(r.id===selected?' selected':'');r.el.replaceChildren();const id=document.createElement('span');id.className='row-id';id.textContent='#'+String(r.id).padStart(2,'0');r.el.append(id);const line=document.createElement('div');line.className='equation';
 for(const s of ['l','r']){if(s==='r'){let eq=document.createElement('span');eq.className='equals';eq.textContent='=';line.append(eq)}if(s==='l'&&r.e.group){const g=r.e.group;line.append(node(r,'group',`${g.k}(x ${g.b<0?'−':'+'} ${Math.abs(g.b)})`));continue}const v=r.e[s];if(!v.a.eq(0))line.append(node(r,s+'a',term(v.a,true)));if(!v.b.eq(0)||v.a.eq(0))line.append(node(r,s+'b',(v.b.n>0n&&!v.a.eq(0)?'+':'')+v.b));}
 r.el.append(line);r.el.style.top=r.y+'px';}
 const r=current();$('#selectedLabel').textContent=r?'目標 #'+r.id+' · '+(target||'點選數字／項'):'先選一行等式';
 for(const b of document.querySelectorAll('[data-op]')){const active=b.dataset.op===(typeof loaded!=='undefined'&&loaded?loaded.op:op);b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))}
 const old=$('#ammo').value;$('#ammo').replaceChildren();if(r){const moves=M.moves(r.e).filter(m=>m.op===op);for(const m of moves){let o=document.createElement('option');o.value=[m.kind,m.target,m.v].join('|');o.textContent=m.label;$('#ammo').append(o)}if(!moves.length){let o=document.createElement('option');o.textContent='這一步不適用';o.value='';$('#ammo').append(o)}if([...$('#ammo').options].some(o=>o.value===old))$('#ammo').value=old;}
 $('#fire').textContent=r&&M.solved(r.e)?'驗算消除 ✦':'發射 ↗';$('#fire').disabled=!canAct();hud();
}
function chooseOp(v){if(!canAct())return;op=v;render()}
function hint(){if(!canAct())return;const r=current();if(!r)return;if(M.solved(r.e)){message('已得 x = '+r.e.r.b+'；按「驗算消除」代入原式。');return}const m=M.moves(r.e)[0];op=m.op;target=m.target==='fraction'?['la','lb','ra','rb'].find(k=>r.e[k[0]][k[1]].d>1n):m.target;render();$('#ammo').value=[m.kind,m.target,m.v].join('|');message(m.kind==='expand'?'×1 保持等值，利用分配律展開括號。':`已裝填 ${m.label}。瞄準黃色目標，按發射；兩邊都會 ${m.label}。`)}
function burst(r,label){for(let i=0;i<14;i++){const star=document.createElement('span');star.className='spark';star.textContent=i%3?'✦':'★';star.style.left=(20+Math.random()*60)+'%';star.style.top=(r.y+20)+'px';star.style.setProperty('--sx',((Math.random()-.5)*180)+'px');star.style.setProperty('--sy',(-30-Math.random()*110)+'px');star.style.color=['#ffdc77','#78f4cd','#ff85b5','#91bdff'][i%4];$('#field').append(star);setTimeout(()=>star.remove(),900)}let p=document.createElement('div');p.className='pop';p.textContent=label;p.style.left='35%';p.style.top=r.y+'px';$('#field').append(p);setTimeout(()=>p.remove(),1000)}
function remove(r){r.el.remove();rows=rows.filter(a=>a!==r);if(selected===r.id){selected=rows[0]?.id||null;target=null}}
function fire(){if(!canAct())return;const r=current();if(!r)return;
 if(M.solved(r.e)){const x=r.e.r.b;if(!M.verify(r.original,x)){message('原式驗算失敗。');return}combo=Math.min(combo+1,8);score+=100*combo;cleared++;$('#history').textContent=`${textEq(r.original)} → x = ${x}。代入原式：左邊 = ${r.original.l.a.mul(x).add(r.original.l.b)}，右邊 = ${r.original.r.a.mul(x).add(r.original.r.b)} ✓`;message('代入驗算成功！等式消除。');burst(r,'+'+100*combo+' ✦');beep(880);remove(r);if(cleared>=4){if(level===5){finish(true);return}level++;cleared=0;message('STAGE '+level+' · '+names[level-1]);}if(!rows.length)spawn();render();return}
 const m=M.moves(r.e).find(m=>m.op===op&&[m.kind,m.target,m.v].join('|')===$('#ammo').value);
 const targetOK=m&&(m.target===target||m.target==='fraction'&&target&&target.length===2&&r.e[target[0]]?.[target[1]]?.d>1n);
 if(!targetOK){combo=0;message('未命中有效目標。請選炮彈對應的項，或按 H 提示。');beep(120);render();return}
 let next;try{next=M.apply(r.e,m)}catch(err){message(err.message);return}
 busy=true;render();const token=epoch;const shot=$('#shot'),f=$('#field').getBoundingClientRect(),n=r.el.querySelector(`[data-target="${target}"]`).getBoundingClientRect();shot.style.display='block';const animation=shot.animate([{left:(f.width/2-12)+'px',top:(f.height-65)+'px'},{left:(n.x-f.x+n.width/2-12)+'px',top:(n.y-f.y)+'px'}],{duration:1,fill:'forwards'});
 animation.onfinish=async()=>{animation.cancel();shot.style.display='none';if(token!==epoch)return;await showBalanceStep(r,m);if(token!==epoch)return;const before=textEq(r.e);r.e=next;busy=false;score+=10;$('#mirror').textContent=m.kind==='expand'?'分配律：a(x+b) = ax+ab':`左邊 ${m.label}  ⚖  右邊 ${m.label}`;$('#history').textContent=before+' → '+textEq(next);message(M.solved(next)?'已解出 x！按「驗算消除」完成。':m.kind==='expand'?'括號已展開，負號已分配到每一項。':'左右兩邊完成同一運算，等式仍然平衡。');beep(520);target=null;render();r.el.classList.add('flash');if(M.solved(r.e)){selected=r.id;fire()}};
}
function start(){epoch++;rows.forEach(r=>r.el.remove());rows=[];selected=null;target=null;score=combo=cleared=0;lives=3;level=Number($('#startLevel')?.value||1);practice=!!$('#practice')?.checked;running=true;paused=busy=false;spawnClock=0;nextId=1;$('#overlay').classList.add('hidden');$('#history').textContent='每次射擊後，這裏顯示等價運算紀錄。';message('點選發光的項，選炮彈；或按 H 裝填提示。');spawn();hint();last=performance.now()}
function finish(win){running=false;paused=false;$('#overlay').innerHTML=`<div><p class="eyebrow">${win?'ALL SYSTEMS BALANCED':'TRY ANOTHER ROUND'}</p><h2>${win?'全關完成！':'GAME OVER'}</h2><p>得分 ${score} · ${win?'你已完成五類平衡挑戰。':'按重開，重新挑戰。'}</p><button class="primary" onclick="location.reload()">返回選關 ↻</button></div>`;$('#overlay').classList.remove('hidden');render()}
function pause(){if(!running||busy)return;paused=!paused;$('#overlay').innerHTML=paused?'<div><p class="eyebrow">TAKE A BREATH</p><h2>PAUSED</h2><p>按 P 或右上「繼續」返回。</p></div>':'';$('#overlay').classList.toggle('hidden',!paused);render()}
$('#start').onclick=start;$('#restart').onclick=()=>location.reload();$('#pause').onclick=pause;$('#hint').onclick=hint;$('#fire').onclick=fire;$('#sound').onclick=()=>{sound=!sound;$('#sound').textContent='♪ '+(sound?'ON':'OFF');$('#sound').setAttribute('aria-pressed',sound);beep()};document.querySelectorAll('[data-op]').forEach(b=>b.onclick=()=>chooseOp(b.dataset.op));
document.addEventListener('visibilitychange',()=>{if(document.hidden&&running&&!paused&&!busy)pause()});
function frame(t){const dt=Math.min((t-last)/1000,.1);last=t;if(running&&!paused&&!busy&&!practice){spawnClock+=dt;const speed=2.4+level*.65+cleared*.12;for(const r of rows){r.y+=speed*dt;r.el.style.top=r.y+'px';if(r.y+r.el.offsetHeight>$('#field').clientHeight-85){remove(r);lives--;combo=0;message('等式碰到危險線！失去一顆心。');beep(100);if(lives<=0){finish(false);break}render()}}if(running&&((spawnClock>18&&rows.length<3&&rows.every(r=>r.y>125))||!rows.length)){spawnClock=0;spawn()}}requestAnimationFrame(frame)}requestAnimationFrame(frame);

// Keyboard arcade: physical trajectories, wall reflection, first-node collision.
let angle=0,ammoIndex=0,loaded=null,keys=new Set();
const resolveHit=fire;
function cartridges(){const valid=[];for(const r of rows)for(const m of M.moves(r.e)){const id=m.op+'|'+m.kind+'|'+m.v;if(!valid.some(t=>t.id===id))valid.push({...m,id})}return ['+','−','×','÷','LCM'].flatMap(op=>{const found=valid.filter(m=>m.op===op);return found.length?found:[{op,v:M.q(1),kind:op==='+'||op==='−'?'constant':'scale',id:op+'|default',label:op==='LCM'?'×LCM（目前無分母）':op+'1'}]})}
function load(delta=0){const all=cartridges();if(!all.length)return;ammoIndex=(ammoIndex+delta+all.length)%all.length;loaded=all[ammoIndex];op=loaded.op;document.documentElement.dataset.ammo=op;const bubble=$('#loadedBubble');if(bubble){bubble.textContent=loaded.op==='LCM'?'LCM':loaded.op+loaded.v; bubble.style.fontSize=bubble.textContent.length>4?'13px':'18px'}for(const b of document.querySelectorAll('[data-op]')){const active=b.dataset.op===(typeof loaded!=='undefined'&&loaded?loaded.op:op);b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))}const ammoSelect=$('#ammo');ammoSelect.replaceChildren();const option=document.createElement('option');option.value=loaded.id;option.textContent=loaded.label;ammoSelect.append(option);$('#selectedLabel').classList.add('loaded');$('#selectedLabel').textContent='炮彈 '+loaded.label+' · 角度 '+Math.round(angle)+'°';$('#fire').textContent='發射 Space';$('#barrel').style.transform='rotate('+angle+'deg)'}
function launch(){if(!canAct())return;if(!loaded)load();if(!loaded)return;const ammo={...loaded},field=$('#field'),f=field.getBoundingClientRect(),w=field.clientWidth;let x=w/2,y=field.clientHeight-65,dx=Math.sin(angle*Math.PI/180)*6,dy=-Math.cos(angle*Math.PI/180)*6,hit=null;const points=[{left:(x-12)+'px',top:(y-12)+'px'}];
 for(let i=0;i<1600;i++){x+=dx;y+=dy;if(x<12){x=24-x;dx=-dx}if(x>w-12){x=2*(w-12)-x;dx=-dx}points.push({left:(x-12)+'px',top:(y-12)+'px'});for(const r of rows){for(const n of r.el.querySelectorAll('.node')){const b=n.getBoundingClientRect();if(x>=b.left-f.left-8&&x<=b.right-f.left+8&&y>=b.top-f.top-8&&y<=b.bottom-f.top+8){hit={r,key:n.dataset.target};break}}if(hit)break}if(hit||y<0)break}
 busy=true;render();const shot=$('#shot');shot.style.display='block';const token=epoch;const anim=shot.animate(points,{duration:Math.max(180,points.length*7),fill:'forwards'});anim.onfinish=()=>{anim.cancel();shot.style.display='none';if(token!==epoch)return;busy=false;if(!hit){combo=0;message('彈珠飛過目標！調整角度再試。');render();load();return}selected=hit.r.id;target=hit.key;const m=M.moves(hit.r.e).find(m=>m.op===ammo.op&&m.kind===ammo.kind&&m.v.eq(ammo.v)&&(m.target===target||m.target==='fraction'&&hit.r.e[target[0]]?.[target[1]]?.d>1n));if(!m){combo=0;message('步驟不適用：先消去常數項，再除以 x 的係數。可按 H 提示。');beep(120);render();load();return}op=m.op;render();$('#ammo').value=[m.kind,m.target,m.v].join('|');resolveHit();setTimeout(()=>load(),30)};
}
$('#fire').onclick=launch;
const oldStart=start;$('#start').onclick=()=>{oldStart();angle=0;load();message('左右鍵瞄準，上下鍵換彈，Space / Enter 發射。')};
document.addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(['arrowleft','arrowright','arrowup','arrowdown','enter',' '].includes(k)){e.preventDefault();if(e.target.matches('select,input'))e.target.blur()}if(k==='p')pause();if(k==='r')location.reload();if(!canAct())return;if(k==='enter'||k===' ')launch();if(k==='arrowup')load(-1);if(k==='arrowdown')load(1);if(k==='arrowleft'||k==='arrowright')keys.add(k);if(k==='h'){hint();const r=current(),m=M.moves(r.e)[0],all=cartridges();if(m){ammoIndex=all.findIndex(a=>a.op===m.op&&a.kind===m.kind&&a.v.eq(m.v));load()}}});
document.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>keys.clear());
let aimTime=0;function aimFrame(t){const dt=Math.min((t-aimTime)/1000,.05);aimTime=t;if(canAct()){const d=(keys.has('arrowright')?1:0)-(keys.has('arrowleft')?1:0);if(d){angle=Math.max(-72,Math.min(72,angle+d*65*dt));load()}}requestAnimationFrame(aimFrame)}requestAnimationFrame(aimFrame);

function showBalanceStep(r,m){
 if(m.kind==='expand')return Promise.resolve();
 const line=r.el.querySelector('.equation');line.replaceChildren();
 for(const side of ['l','r']){
  if(side==='r'){const equals=document.createElement('span');equals.className='equals';equals.textContent='=';line.append(equals)}
  const expression=document.createElement('span');expression.className='step-expression';
  const old=document.createElement('span');old.textContent=sideText(r.e[side]);
  const added=document.createElement('span');added.className='balance-added';
  if(m.kind==='scale'){
   old.textContent='('+sideText(r.e[side])+')';
   added.textContent=' '+(m.op==='÷'?'÷':'×')+' '+(m.v.n<0n?'('+m.v+')':m.v);
  }else added.textContent=' '+m.op+' '+(m.kind==='x'?term(m.v,true):m.v);
  expression.append(old,added);line.append(expression);
 }
 $('#mirror').textContent='兩邊同時 '+m.label;
 message('保持平衡：左右兩邊做同一運算，然後化簡。');
 return new Promise(resolve=>setTimeout(resolve,1000));
}

const teacherChoice=$('#teacherSelect');
function setTeacher(){const i=teacherChoice.selectedIndex,character=$('#teacherCharacter');const narrow=window.matchMedia('(min-width:621px) and (max-width:850px)').matches;const scale=narrow?517/1672:602/1672;character.style.backgroundPosition=(-([110,410,700,990,1280][i])*scale)+'px '+(-253*scale)+'px';character.setAttribute('aria-label',teacherChoice.value);try{localStorage.setItem('equationTeacher',String(i))}catch{}}
try{const saved=Number(localStorage.getItem('equationTeacher')??2);if(Number.isInteger(saved)&&saved>=0&&saved<5)teacherChoice.selectedIndex=saved}catch{}
teacherChoice.addEventListener('change',setTeacher);window.addEventListener('resize',setTeacher);setTeacher();

// Match the preview's live dotted aiming guide and clickable colored ammo dock.
function updateAimGuide(){const f=$('#field'),x=f.clientWidth/2,y=f.clientHeight-65,r=angle*Math.PI/180;$('#aimGuide').setAttribute('viewBox','0 0 '+f.clientWidth+' '+f.clientHeight);$('#aimPath').setAttribute('d','M '+x+' '+y+' L '+(x+Math.sin(r)*170)+' '+(y-Math.cos(r)*170));requestAnimationFrame(updateAimGuide)}requestAnimationFrame(updateAimGuide);
for(const button of document.querySelectorAll('[data-op]'))button.onclick=()=>{if(!canAct())return;const a=cartridges();ammoIndex=a.findIndex(m=>m.op===button.dataset.op);load()};
