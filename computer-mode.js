'use strict';
// Presentation of the computer match. The bot itself only receives its own player.
function configureComputerMatch(config){
 computerMode=config.opponent==='computer';computerDifficulty=config.difficulty||'normal';
 document.body.classList.toggle('computer-mode',computerMode);
 document.querySelector('#arena0').closest('.arena-slot').classList.add('computer-player-slot');
 document.querySelector('#arena1').closest('.arena-slot').classList.add('computer-opponent-slot');
 const existing=document.querySelector('#computerStatus');if(existing)existing.remove();
 if(!computerMode)return;
 const opponent=document.querySelector('.computer-opponent-slot');
 if(!document.querySelector('#computerPreviewToggle')){
  const header=document.createElement('div');header.className='computer-preview-heading';
  const title=document.createElement('strong');title.textContent='電腦即時畫面';
  const toggle=document.createElement('button');toggle.id='computerPreviewToggle';toggle.type='button';toggle.textContent='收起';toggle.setAttribute('aria-expanded','true');toggle.setAttribute('aria-controls','arena1');
  toggle.onclick=()=>{const collapsed=document.body.classList.toggle('computer-preview-collapsed');toggle.textContent=collapsed?'展開':'收起';toggle.setAttribute('aria-expanded',String(!collapsed));fitBattle();};
  header.append(title,toggle);opponent.prepend(header);
 }

 const status=document.createElement('section');status.id='computerStatus';status.setAttribute('aria-label','電腦對手狀態');
 const image=document.createElement('img');image.src=EquationTeachers[config.teachers[1]].image;image.alt='';
 const text=document.createElement('div'),name=document.createElement('strong'),progress=document.createElement('span'),warning=document.createElement('span');
 name.textContent='電腦 · '+EquationTeachers[config.teachers[1]].name+' · '+EquationComputer.LEVELS[computerDifficulty].name;
 progress.id='computerProgress';warning.id='computerWarning';warning.setAttribute('role','status');
 text.append(name,progress,warning);status.append(image,text);
 document.querySelector('#battleStage').insertBefore(status,document.querySelector('.arenas'));
 document.querySelector('#arena0 .player-tag').textContent='YOU';document.querySelector('#arena1 .player-tag').textContent='COMPUTER';
 document.title='Equation Bubble — 挑戰電腦';document.querySelector('.arenas').setAttribute('aria-label','玩家對戰電腦遊戲區');document.querySelector('.battle-header small').textContent='PLAYER VS COMPUTER';document.querySelector('.battle-header h1').textContent='EQUATION BUBBLE · 挑戰電腦';document.querySelector('.battle-footer span:last-child').textContent='挑戰電腦 · '+EquationComputer.LEVELS[computerDifficulty].name+'難度';
 for(const selector of ['#fire0','#vsMobileFire0'])document.querySelector(selector).textContent='發射 ✦';
 document.querySelector('#hint0').textContent='H 提示 1/3';
 document.querySelector('#arena0 .player-controls').firstChild.textContent='← / → 或 A / D 瞄準';
}
function renderComputerStatus(){
 if(!computerMode||!match)return;
 const p=match.players[1],you=match.players[0],clock=match.duration?' · 剩餘 '+Math.ceil(Math.max(0,match.duration-match.elapsed))+' 秒':'';
 const state=match.status==='ended'?'對戰結束':match.paused?'已暫停':match.countdown>0?'準備開始':computerController?.status||'思考中';
 document.querySelector('#computerProgress').textContent='♥ '+p.lives+' · 已解 '+p.clears+' 題 · '+state+clock;
 const incoming=you.incoming.reduce((n,a)=>n+a.remaining,0);
 document.querySelector('#computerWarning').textContent=incoming?'⚠ '+incoming+' 題來襲 · '+Math.ceil(you.incoming[0].delay)+' 秒 · 解星題反制':'你已解 '+you.clears+' 題 · 星題可攻擊電腦';
 document.querySelector('#computerStatus').classList.toggle('danger-incoming',incoming>0);
}

// A full-width, single-column player field gives phone targets native touch size.
function configureComputerPlayer(){
 if(!computerMode||!match)return;
 const p=match.players[0],touch=!!mobileMode;if(!!p.touchLayout===touch)return;
 p.touchLayout=touch;let previous=Infinity;
 for(const row of [...p.rows].sort((a,b)=>b.y-a.y)){
  if(touch){row.desktopLane=row.lane;row.lane=0;row.y=Math.min(row.y,previous-128);previous=row.y;}
  else row.lane=row.desktopLane??row.id%2;
  row.touchLayout=touch;V.layout(row);
 }
 p.hintKey=null;p.hintLevel=0;p.aimed=null;p.revision++;
}
