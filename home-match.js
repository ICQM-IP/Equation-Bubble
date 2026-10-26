'use strict';
// One welcome screen owns both activities; only Start navigates to versus.
(() => {
 const KEY='equationHomeBattle', AIKEY='equationHomeComputer', PENDING='equationBattleLaunch', MODE='equationHomeActivity';
 const read=k=>{try{return JSON.parse(sessionStorage.getItem(k)||'null')}catch{return null}};
 const save=(k,v)=>{try{sessionStorage.setItem(k,JSON.stringify(v));return true}catch{return false}};
 const valid=(v,values,fallback)=>values.includes(String(v))?String(v):fallback;
 const teacher=v=>Number.isInteger(Number(v))&&Number(v)>=0&&Number(v)<EquationTeachers.length?Number(v):2;
 function normalize(v={}){v=v&&typeof v==='object'?v:{};return {teachers:Array.isArray(v.teachers)&&v.teachers.length===2?v.teachers.map(teacher):[2,0],topic:valid(v.topic,['0','1','2','3','4','5'],'0'),speed:valid(v.speed,['0.65','1','1.6','2.3'],'1.6'),duration:valid(v.duration,['0','180'],v.opponent==='computer'?'0':'180'),opponent:v.opponent==='computer'?'computer':'human',difficulty:valid(v.difficulty,['easy','normal','hard'],'normal'),turbo:true,gentle:v.gentle!==false,sound:v.sound===true,mobile:typeof v.mobile==='boolean'?v.mobile:null,effects:typeof v.effects==='boolean'?v.effects:null,music:v.music!==false};}
 const byId=id=>document.getElementById(id);
 function goHome(){save(MODE,typeof computerMode!=='undefined'&&computerMode?'computer':'battle');location.href='index.html';}
 if(document.body.classList.contains('versus-page')){
  const launch=new URLSearchParams(location.search).get('start')==='1'?read(PENDING):null;
  if(!launch){if(read(MODE)!=='computer')save(MODE,'battle');location.replace('index.html');return;}
  const c=normalize(launch);if(c.opponent==='human'&&isHandheldDevice()){save(MODE,'battle');sessionStorage.removeItem(PENDING);location.replace('index.html');return;}if(c.opponent==='human')c.mobile=false;if(typeof configureComputerMatch==='function')configureComputerMatch(c);try{sessionStorage.removeItem(PENDING)}catch{}
  for(let i=0;i<2;i++)choose(i,c.teachers[i]);
  for(const [id,value] of [['battleLevel',c.topic],['battleSpeed',c.speed],['battleDuration',c.duration]])byId(id).value=value;
  byId('battleTurbo').checked=c.turbo;byId('battleGentle').checked=c.gentle;
  const footer=document.querySelector('.battle-footer span');if(footer)footer.textContent=c.turbo?'★ 星題送 2 題 · 連解最多 3 題 · 可反制／反彈':'★ 完整解出星題送 1 題 · 可抵消來襲攻擊';
  if(c.mobile!==null)setDeviceMode(c.mobile);byId('deviceToggle').hidden=c.opponent==='human';
  const effects=document.querySelectorAll('.effect-settings input');
  for(const [i,value]of [[0,c.effects],[1,c.music]])if(effects[i]&&value!==null){effects[i].checked=value;effects[i].dispatchEvent(new Event('change'));}
  if(sound!==c.sound)byId('battleSound').click();
  byId('battleReset').textContent='返回設定';byId('battleReset').onclick=goHome;
  byId('reselect').textContent='返回主頁設定';byId('reselect').onclick=goHome;
  begin();return;
 }
 const home=document.querySelector('.home-menu');if(!home)return;
 for(const key of [KEY,AIKEY]){const saved=read(key);if(saved)save(key,{...saved,topic:'0'});} // Default all activities to mixed on a fresh home visit.
 const panel=home.querySelector('.home-panel'), link=home.querySelector('.battle-card');
 const battleButton=document.createElement('button');battleButton.type='button';battleButton.className=link.className;battleButton.dataset.activity='battle';battleButton.setAttribute('aria-pressed','false');battleButton.append(...link.childNodes);link.replaceWith(battleButton);
 battleButton.querySelector('small').textContent='只限電腦 · 同一鍵盤雙人';
 const draft=normalize(read(KEY)), computerDraft=normalize(read(AIKEY)||{opponent:'computer',duration:'0'}), form=document.createElement('section');form.className='home-battle-settings';form.id='homeBattleSettings';form.hidden=true;form.setAttribute('aria-label','雙人對戰設定');
 const computerButton=document.createElement('button');computerButton.type='button';computerButton.className='activity-card computer-card';computerButton.dataset.activity='computer';computerButton.setAttribute('aria-pressed','false');computerButton.innerHTML='<span class=activity-icon aria-hidden=true><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="13" rx="2"/><path d="M8 21h8M12 16v5M9 7l6 5M15 7l-6 5"/></svg></span><strong>挑戰電腦</strong><small>與電腦老師較量</small><span class=activity-check>✓</span>';battleButton.parentElement.append(computerButton);
 const fields={};
 const roles=document.createElement('div');roles.className='home-battle-players';form.append(roles);
 function select(host,id,label,options,value){const wrap=document.createElement('label');wrap.htmlFor=id;const title=document.createElement('span');title.textContent=label;const input=document.createElement('select');input.id=id;for(const [v,t]of options){const option=document.createElement('option');option.value=v;option.textContent=t;input.append(option)}input.value=String(value);wrap.append(title,input);host.append(wrap);fields[id]=input;return input;}
 function controlGuide(host,kind){
  host.classList.add('selection-controls');host.replaceChildren();
  host.hidden=byId('deviceChoice').checked&&activity!=='battle';if(host.hidden)return;
  const heading=document.createElement('strong');heading.textContent=kind==='bot'?'電腦操作':'操作按鈕';host.append(heading);
  if(kind==='bot'){const text=document.createElement('span');text.textContent='自動瞄準、換運算、發射及救援';host.append(text);return;}
  const touch=byId('deviceChoice').checked&&activity!=='battle';
  const controls=touch?[['◀ ▶','瞄準'],['＋ − × ÷ 拆括弧 LCM','選運算'],['發射','發射'],['提示','提示'],['救援','救援一次']]:kind==='p1'?[['A D','瞄準'],['W S','換運算'],['F','發射'],['G','提示'],['R','救援一次']]:kind==='p2'?[['← →','瞄準'],['↑ ↓','換運算'],['Enter','發射'],['L','提示'],['/','救援一次']]:[['← →','瞄準'],['↑ ↓','換運算'],['Space / Enter','發射'],['H','提示'],['R','救援一次']];
  for(const [key,label]of controls){const item=document.createElement('span'),cap=document.createElement('kbd');if(key==='W S'||key==='↑ ↓'){cap.className='stacked-keys';for(const symbol of key.split(' ')){const row=document.createElement('span');row.textContent=symbol;cap.append(row);}cap.setAttribute('aria-label',key==='W S'?'W 上、S 下':'向上、向下');}else cap.textContent=key;item.append(cap,document.createTextNode(label));host.append(item);}
  const pause=document.createElement('span');pause.textContent=touch?'遊戲上方：暫停':'P：暫停整場';host.append(pause);
 }
 const soloGuide=document.createElement('div');byId('singleTeacher').parentElement.append(soloGuide);
 const previews=[];
 for(let i=0;i<2;i++){const card=document.createElement('div');card.className='home-battle-player player-'+i;roles.append(card);const image=document.createElement('img');card.append(image);const slot=document.createElement('div');card.append(slot);const input=select(slot,'homePlayer'+i,'PLAYER '+(i+1),EquationTeachers.map((t,j)=>[String(j),t.name]),draft.teachers[i]);const keys=document.createElement('small');keys.textContent=i===0?'A/D 瞄準 · W/S 換彈 · F 發射':'方向鍵瞄準／換彈 · Enter 發射';slot.append(keys);previews.push(()=>{const t=EquationTeachers[teacher(input.value)];image.src=t.image;image.alt=t.name+' 玩家 '+(i+1);});input.addEventListener('change',()=>{previews[i]();remember()});previews[i]();}
 const grid=document.createElement('div');grid.className='home-battle-grid';form.append(grid);
 select(grid,'homeBattleTopic','練習課題',[['0','混合課題 · 全部五類'],['1','一步方程'],['2','兩步方程'],['3','兩邊未知數'],['4','括號'],['5','分數與 LCM']],draft.topic);
 select(grid,'homeBattleSpeed','下降速度',[['0.65','慢速 · 0.65×'],['1','標準 · 1×'],['1.6','快速 · 1.6×'],['2.3','極速 · 2.3×']],draft.speed);
 select(grid,'homeBattleDuration','勝負方式',[['180','3 分鐘 · 解題數優先'],['0','生存賽 · 三顆心']],draft.duration);
 select(grid,'homeComputerDifficulty','電腦難度',[['easy','入門 · 較慢、較多失誤'],['normal','標準 · 穩定解題'],['hard','挑戰 · 較快、較少失誤']],computerDraft.difficulty);fields.homeComputerDifficulty.parentElement.hidden=true;
 function check(id,label,value){const wrap=document.createElement('label');wrap.className='home-battle-check';const input=document.createElement('input');input.type='checkbox';input.id=id;input.checked=value;wrap.append(input,document.createTextNode(label));form.append(wrap);fields[id]=input;}
 check('homeBattleGentle','循序增加題目密度',draft.gentle);check('homeBattleSound','開啟遊戲聲音',draft.sound);
 const more=byId('homeAdvanced'),soloBasic=home.querySelector('.basic-settings'), note=byId('activityNote'),route=home.querySelector('.home-route');
 panel.insertBefore(form,note);let activity='solo';
 const help=home.querySelector('.home-help'), originalHelp=help.innerHTML;
 const speedNote=document.createElement('p');speedNote.className='home-speed-note';speedNote.textContent='下降速度全場固定，所有模式採用相同標準，預設快速 1.6×。連擊與救援自動開啟；不下降練習會暫停下降並停用連擊與救援。';speedNote.style.cssText='font:12px/1.6 system-ui;color:#607a76;margin:10px 0;text-align:left';panel.insertBefore(speedNote,note);
 const soloLabels=Array.from(more.querySelectorAll('.advanced-grid > label')).filter(e=>!e.querySelector('#deviceChoice'));
 function config(){const effects=home.querySelectorAll('.effect-settings input');return normalize({opponent:activity==='computer'?'computer':'human',difficulty:fields.homeComputerDifficulty.value,teachers:[fields.homePlayer0.value,fields.homePlayer1.value],topic:fields.homeBattleTopic.value,speed:fields.homeBattleSpeed.value,duration:fields.homeBattleDuration.value,turbo:true,gentle:fields.homeBattleGentle.checked,sound:fields.homeBattleSound.checked,mobile:byId('deviceChoice').checked,effects:effects[0]?.checked,music:effects[1]?.checked});}
 function remember(){if(activity!=='solo')save(activity==='computer'?AIKEY:KEY,config());}
 for(const el of Object.values(fields))el.addEventListener('change',remember);
 function updateBattleAvailability(){const start=byId('start');if(!start)return;const blocked=activity==='battle'&&isHandheldDevice();start.disabled=blocked;if(activity==='battle'){note.textContent=blocked?'雙人對戰只限電腦使用同一鍵盤遊玩。手提裝置請選擇「自主練習」或「挑戰電腦」。':'只限電腦 · 同一鍵盤雙人對戰，完成設定後按開始遊戲。';start.textContent=blocked?'雙人對戰只限電腦遊玩':'開始雙人遊戲 →';}}
 function setActivity(next){
  if(activity!=='solo')remember();
  activity=next;const battle=next!=='solo',computer=next==='computer';
  if(battle){const saved=normalize(read(computer?AIKEY:KEY)||(computer?{opponent:'computer',duration:'0'}:{}));
   for(const [id,value]of [['homeBattleTopic',saved.topic],['homeBattleSpeed',saved.speed],['homeBattleDuration',saved.duration],['homeComputerDifficulty',saved.difficulty],['homePlayer0',saved.teachers[0]],['homePlayer1',saved.teachers[1]]])fields[id].value=String(value);
   fields.homeBattleGentle.checked=saved.gentle;fields.homeBattleSound.checked=saved.sound;previews.forEach(f=>f());
  }
  home.dataset.activity=next;save(MODE,next);form.hidden=!battle;form.setAttribute('aria-label',computer?'挑戰電腦設定':'雙人對戰設定');soloBasic.hidden=battle;fields.homeComputerDifficulty.parentElement.hidden=!computer;
  for(const label of soloLabels)label.hidden=battle;
  home.querySelector('[data-activity=practice]').setAttribute('aria-pressed',String(!battle));battleButton.setAttribute('aria-pressed',String(next==='battle'));computerButton.setAttribute('aria-pressed',String(computer));
  fields.homePlayer0.parentElement.querySelector('span').textContent=computer?'你的老師':'PLAYER 1';fields.homePlayer1.parentElement.querySelector('span').textContent=computer?'電腦老師':'PLAYER 2';
  controlGuide(roles.querySelector('.player-1 small'),computer?'bot':'p2');
  controlGuide(roles.querySelector('.player-0 small'),computer?'solo':'p1');
  controlGuide(soloGuide,'solo');
  byId('start').textContent=computer?'開始挑戰電腦 →':battle?'開始雙人遊戲 →':'開始練習 →';
  note.textContent=computer?(fields.homeBattleDuration.value==='0'?'三顆心生存賽：先失去三顆心者落敗。可另選 3 分鐘限時賽。':'3 分鐘限時賽：先比解題數，再比命中率；碰線不扣心。'):battle?'同機雙人 · 所有設定完成後，按開始遊戲進入對戰。':byId('practice').checked?'方程停止下降，留一點時間想清楚。':'方程持續下降，解題時也要留意危險線。';
  route.textContent=battle?'星題可攻擊、反制；老師角色不影響能力，電腦難度另行選擇。':'解題路線：先消左常數、右邊 x 項，再除係數；括號可先拆括弧，或先除外係數。';
  help.innerHTML=battle?'<summary>玩法說明 <span>操作及勝負規則</span></summary><p>'+(computer?'你：方向鍵或 A/D 瞄準，↑/↓ 或 W/S 換運算，Space／Enter／F 發射，H／G 提示，R 救援。手機可使用觸控按鈕。':'玩家 1：A/D 瞄準、W/S 換運算、F 發射、G 提示、R 救援。玩家 2：方向鍵、Enter 發射、L 提示、/ 救援。')+'</p><p>P 暫停整場。星題送 2 題，連解最多送 3 題；來襲預警期間解星題可反制，反彈最多兩次。</p><p>生存賽先失去三顆心者落敗；限時賽持續 3 分鐘，碰線不扣心，先比解題數，再比命中率。</p>'+(computer?'<p>電腦只根據自己的方程逐步選擇運算及發射，會有思考時間、失誤，亦會使用一次救援；不讀取你的按鍵或發射選擇。</p>':''):originalHelp;
  updateBattleAvailability();
  const extra=more.querySelector('summary span');if(extra)extra.textContent=battle?'操作台與效果':'老師、速度與效果';
 }

 function refreshDeviceControls(){if(!byId('start')||!byId('deviceChoice'))return;updateBattleAvailability();controlGuide(soloGuide,'solo');controlGuide(roles.querySelector('.player-0 small'),activity==='computer'?'solo':'p1');controlGuide(roles.querySelector('.player-1 small'),activity==='computer'?'bot':'p2');}
 document.addEventListener('equation-device-change',refreshDeviceControls);
 byId('deviceChoice').addEventListener('change',refreshDeviceControls);
 battleButton.onclick=()=>setActivity('battle');computerButton.onclick=()=>setActivity('computer');home.querySelector('[data-activity=practice]').addEventListener('click',()=>setActivity('solo'));
 fields.homeBattleDuration.addEventListener('change',()=>{if(activity==='computer')note.textContent=fields.homeBattleDuration.value==='0'?'三顆心生存賽：先失去三顆心者落敗。':'3 分鐘限時賽：先比解題數，再比命中率；碰線不扣心。';});
 byId('start').addEventListener('click',event=>{if(activity==='solo')return;event.preventDefault();event.stopImmediatePropagation();if(activity==='battle'&&isHandheldDevice()){updateBattleAvailability();return;}remember();const launch=config();if(activity==='battle')launch.mobile=false;if(!save(PENDING,launch)){note.textContent='瀏覽器未能保留設定，請允許此網站儲存資料後重試。';return;}location.href='battle.html?start=1';},true);
 // The live device preference belongs to mobile.js, never to an old match draft.
 setActivity(['battle','computer'].includes(read(MODE))?read(MODE):'solo');
 const style=document.createElement('style');style.textContent=".home-battle-settings{margin-top:20px;text-align:left}.home-battle-players{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:15px}.home-battle-player{display:flex;align-items:center;gap:8px;padding:10px 8px;background:#eef6f3;border:1px solid #b6d5cc;border-top:3px solid #58baca;border-radius:12px;min-width:0}.home-battle-player.player-1{background:#faf0f4;border-color:#e5c5d3;border-top-color:#d887a9}.home-battle-player img{width:55px;height:78px;object-fit:contain;image-rendering:pixelated;flex:none}.home-battle-player>div{min-width:0;flex:1}.home-menu .home-battle-settings label{display:block;font:600 12px/1.5 system-ui,sans-serif;color:#4d6665;margin:0}.home-battle-settings label>span{display:block;margin-bottom:6px}.home-battle-player small{display:block;font-size:9px;line-height:1.5;color:#728383;margin-top:6px}.home-battle-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:12px 0}.home-battle-grid>label:last-child{grid-column:1/-1}.home-menu .home-battle-settings select{width:100%;max-width:100%;font-size:13px!important;background:#fffefb;color:#294b4b;border:1px solid #d0dcd5;border-radius:8px;padding:9px 6px}.home-menu .home-battle-settings .home-battle-check{display:flex;align-items:center;gap:8px;font-weight:500;margin:9px 0;color:#385858}.home-battle-check input{width:17px;height:17px;accent-color:#267e75}.home-menu [hidden]{display:none!important}.home-menu .battle-card[aria-pressed=true]{border:2px solid #ae6e91;background:#faf0f5}.home-menu .battle-card[aria-pressed=true] .activity-arrow{color:#ae6e91}.home-battle-settings input:focus-visible{outline:3px solid #ddac55;outline-offset:3px}@media(max-width:460px){.home-battle-players{gap:7px}.home-battle-player{display:block;text-align:center;padding:8px 6px}.home-battle-player img{height:65px;width:50px}.home-battle-player small{font-size:8px}.home-battle-grid{gap:9px}}";document.head.append(style);
})();
