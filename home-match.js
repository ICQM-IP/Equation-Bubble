'use strict';
// One welcome screen owns both activities; only Start navigates to versus.
(() => {
 const KEY='equationHomeBattle', PENDING='equationBattleLaunch', MODE='equationHomeActivity';
 const read=k=>{try{return JSON.parse(sessionStorage.getItem(k)||'null')}catch{return null}};
 const save=(k,v)=>{try{sessionStorage.setItem(k,JSON.stringify(v));return true}catch{return false}};
 const valid=(v,values,fallback)=>values.includes(String(v))?String(v):fallback;
 const teacher=v=>Number.isInteger(Number(v))&&Number(v)>=0&&Number(v)<EquationTeachers.length?Number(v):2;
 function normalize(v={}){v=v&&typeof v==='object'?v:{};return {teachers:Array.isArray(v.teachers)&&v.teachers.length===2?v.teachers.map(teacher):[2,0],topic:valid(v.topic,['0','1','2','3','4','5'],'0'),speed:valid(v.speed,['0.65','1','1.6','2.3'],'1.6'),duration:valid(v.duration,['0','180'],'180'),turbo:true,gentle:v.gentle!==false,sound:v.sound===true,mobile:typeof v.mobile==='boolean'?v.mobile:null,effects:typeof v.effects==='boolean'?v.effects:null,music:v.music!==false};}
 const byId=id=>document.getElementById(id);
 function goHome(){save(MODE,'battle');location.href='index.html';}
 if(document.body.classList.contains('versus-page')){
  const launch=new URLSearchParams(location.search).get('start')==='1'?read(PENDING):null;
  if(!launch){save(MODE,'battle');location.replace('index.html');return;}
  const c=normalize(launch);try{sessionStorage.removeItem(PENDING)}catch{}
  for(let i=0;i<2;i++)choose(i,c.teachers[i]);
  for(const [id,value] of [['battleLevel',c.topic],['battleSpeed',c.speed],['battleDuration',c.duration]])byId(id).value=value;
  byId('battleTurbo').checked=c.turbo;byId('battleGentle').checked=c.gentle;
  const footer=document.querySelector('.battle-footer span');if(footer)footer.textContent=c.turbo?'★ 星題送 2 題 · 連解最多 3 題 · 可反制／反彈':'★ 完整解出星題送 1 題 · 可抵消來襲攻擊';
  if(c.mobile!==null)setDeviceMode(c.mobile);
  const effects=document.querySelectorAll('.effect-settings input');
  for(const [i,value]of [[0,c.effects],[1,c.music]])if(effects[i]&&value!==null){effects[i].checked=value;effects[i].dispatchEvent(new Event('change'));}
  if(sound!==c.sound)byId('battleSound').click();
  byId('battleReset').textContent='返回設定';byId('battleReset').onclick=goHome;
  byId('reselect').textContent='返回主頁設定';byId('reselect').onclick=goHome;
  begin();return;
 }
 const home=document.querySelector('.home-menu');if(!home)return;
 const panel=home.querySelector('.home-panel'), link=home.querySelector('.battle-card');
 const battleButton=document.createElement('button');battleButton.type='button';battleButton.className=link.className;battleButton.dataset.activity='battle';battleButton.setAttribute('aria-pressed','false');battleButton.append(...link.childNodes);link.replaceWith(battleButton);
 const draft=normalize(read(KEY)), form=document.createElement('section');form.className='home-battle-settings';form.id='homeBattleSettings';form.hidden=true;form.setAttribute('aria-label','雙人對戰設定');
 const fields={};
 const roles=document.createElement('div');roles.className='home-battle-players';form.append(roles);
 function select(host,id,label,options,value){const wrap=document.createElement('label');wrap.htmlFor=id;const title=document.createElement('span');title.textContent=label;const input=document.createElement('select');input.id=id;for(const [v,t]of options){const option=document.createElement('option');option.value=v;option.textContent=t;input.append(option)}input.value=String(value);wrap.append(title,input);host.append(wrap);fields[id]=input;return input;}
 const previews=[];
 for(let i=0;i<2;i++){const card=document.createElement('div');card.className='home-battle-player player-'+i;roles.append(card);const image=document.createElement('img');card.append(image);const slot=document.createElement('div');card.append(slot);const input=select(slot,'homePlayer'+i,'PLAYER '+(i+1),EquationTeachers.map((t,j)=>[String(j),t.name]),draft.teachers[i]);const keys=document.createElement('small');keys.textContent=i===0?'A/D 瞄準 · W/S 換彈 · F 發射':'方向鍵瞄準／換彈 · Enter 發射';slot.append(keys);previews.push(()=>{const t=EquationTeachers[teacher(input.value)];image.src=t.image;image.alt=t.name+' 玩家 '+(i+1);});input.addEventListener('change',()=>{previews[i]();remember()});previews[i]();}
 const grid=document.createElement('div');grid.className='home-battle-grid';form.append(grid);
 select(grid,'homeBattleTopic','練習課題',[['0','混合課題 · 全部五類'],['1','一步方程'],['2','兩步方程'],['3','兩邊未知數'],['4','括號'],['5','分數與 LCM']],draft.topic);
 select(grid,'homeBattleSpeed','下降速度',[['0.65','慢速 · 0.65×'],['1','標準 · 1×'],['1.6','快速 · 1.6×'],['2.3','極速 · 2.3×']],draft.speed);
 select(grid,'homeBattleDuration','勝負方式',[['180','3 分鐘 · 解題數優先'],['0','生存賽 · 三顆心']],draft.duration);
 function check(id,label,value){const wrap=document.createElement('label');wrap.className='home-battle-check';const input=document.createElement('input');input.type='checkbox';input.id=id;input.checked=value;wrap.append(input,document.createTextNode(label));form.append(wrap);fields[id]=input;}
 check('homeBattleGentle','循序增加題目密度',draft.gentle);check('homeBattleSound','開啟遊戲聲音',draft.sound);
 const more=byId('homeAdvanced'),soloBasic=home.querySelector('.basic-settings'), note=byId('activityNote'),route=home.querySelector('.home-route');
 panel.insertBefore(form,note);let activity='solo';
 const help=home.querySelector('.home-help'), originalHelp=help.innerHTML;
 const speedNote=document.createElement('p');speedNote.className='home-speed-note';speedNote.textContent='只需選擇下降速度；單人與雙人採用相同速度標準，預設快速 1.6×。連擊與救援自動開啟；不下降練習會暫停下降並停用連擊與救援。';speedNote.style.cssText='font:12px/1.6 system-ui;color:#607a76;margin:10px 0;text-align:left';panel.insertBefore(speedNote,note);
 const soloLabels=Array.from(more.querySelectorAll('.advanced-grid > label')).filter(e=>!e.querySelector('#deviceChoice'));
 function config(){const effects=home.querySelectorAll('.effect-settings input');return normalize({teachers:[fields.homePlayer0.value,fields.homePlayer1.value],topic:fields.homeBattleTopic.value,speed:fields.homeBattleSpeed.value,duration:fields.homeBattleDuration.value,turbo:true,gentle:fields.homeBattleGentle.checked,sound:fields.homeBattleSound.checked,mobile:byId('deviceChoice').checked,effects:effects[0]?.checked,music:effects[1]?.checked});}
 function remember(){save(KEY,config());}
 for(const el of Object.values(fields))el.addEventListener('change',remember);
 function setActivity(next){activity=next;const battle=next==='battle';home.dataset.activity=next;help.innerHTML=battle?'<summary>玩法說明 <span>雙人操作及勝負規則</span></summary><p>玩家 1：A/D 瞄準、W/S 換運算、F 發射、G 提示、R 救援。</p><p>玩家 2：方向鍵瞄準及換運算、Enter 發射、L 提示、/ 救援。P 同時暫停兩邊。</p><p>極速星題送 2 題，連解最多送 3 題；非極速星題送 1 題。來襲預警期間完成星題可反制，反彈最多兩次。</p><p>限時賽先比解題數，再比正確命中率；生存賽先失去三顆心者落敗。所有運算均自動配數值。</p>':originalHelp;save(MODE,next);form.hidden=!battle;soloBasic.hidden=battle;for(const label of soloLabels)label.hidden=battle;home.querySelector('[data-activity=practice]').setAttribute('aria-pressed',String(!battle));battleButton.setAttribute('aria-pressed',String(battle));byId('start').textContent=battle?'開始雙人遊戲 →':'開始練習 →';note.textContent=battle?'同機雙人 · 所有設定完成後，按開始遊戲進入對戰。':byId('practice').checked?'方程停止下降，留一點時間想清楚。':'方程持續下降，解題時也要留意危險線。';route.textContent=battle?'星題完成可攻擊對手；限時賽先比解題數，再比正確命中率。':'解題路線：先消左常數、右邊 x 項，再除係數；括號先除外係數。';const extra=more.querySelector('summary span');if(extra)extra.textContent=battle?'操作台與效果':'老師、速度與效果';}
 battleButton.onclick=()=>setActivity('battle');home.querySelector('[data-activity=practice]').addEventListener('click',()=>setActivity('solo'));
 byId('start').addEventListener('click',event=>{if(activity!=='battle')return;event.preventDefault();event.stopImmediatePropagation();remember();if(!save(PENDING,config())){note.textContent='瀏覽器未能保留設定，請允許此網站儲存資料後重試。';return;}location.href='battle.html?start=1';},true);
 // The live device preference belongs to mobile.js, never to an old match draft.
 setActivity(read(MODE)==='battle'?'battle':'solo');
 const style=document.createElement('style');style.textContent=".home-battle-settings{margin-top:20px;text-align:left}.home-battle-players{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:15px}.home-battle-player{display:flex;align-items:center;gap:8px;padding:10px 8px;background:#eef6f3;border:1px solid #b6d5cc;border-top:3px solid #58baca;border-radius:12px;min-width:0}.home-battle-player.player-1{background:#faf0f4;border-color:#e5c5d3;border-top-color:#d887a9}.home-battle-player img{width:55px;height:78px;object-fit:contain;image-rendering:pixelated;flex:none}.home-battle-player>div{min-width:0;flex:1}.home-menu .home-battle-settings label{display:block;font:600 12px/1.5 system-ui,sans-serif;color:#4d6665;margin:0}.home-battle-settings label>span{display:block;margin-bottom:6px}.home-battle-player small{display:block;font-size:9px;line-height:1.5;color:#728383;margin-top:6px}.home-battle-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:12px 0}.home-battle-grid>label:last-child{grid-column:1/-1}.home-menu .home-battle-settings select{width:100%;max-width:100%;font-size:13px!important;background:#fffefb;color:#294b4b;border:1px solid #d0dcd5;border-radius:8px;padding:9px 6px}.home-menu .home-battle-settings .home-battle-check{display:flex;align-items:center;gap:8px;font-weight:500;margin:9px 0;color:#385858}.home-battle-check input{width:17px;height:17px;accent-color:#267e75}.home-menu [hidden]{display:none!important}.home-menu .battle-card[aria-pressed=true]{border:2px solid #ae6e91;background:#faf0f5}.home-menu .battle-card[aria-pressed=true] .activity-arrow{color:#ae6e91}.home-battle-settings input:focus-visible{outline:3px solid #ddac55;outline-offset:3px}@media(max-width:460px){.home-battle-players{gap:7px}.home-battle-player{display:block;text-align:center;padding:8px 6px}.home-battle-player img{height:65px;width:50px}.home-battle-player small{font-size:8px}.home-battle-grid{gap:9px}}";document.head.append(style);
})();
