'use strict';
// Welcome presets only configure existing controls; engines retain all game rules.
(() => {
  const home = document.querySelector('.home-menu');
  if (!home) return;
  const byId = id => document.getElementById(id);
  const preferenceKey = 'equationSoloSettings';
  const defaults = {practice:false, sessionLength:'0', soloTurbo:true, fallSpeed:'1.6', gentlePace:true};
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(preferenceKey) || '{}') || {}; } catch {}
  for (const [id, fallback] of Object.entries(defaults)) {
    const input = byId(id);
    if (typeof fallback === 'boolean') input.checked = typeof saved[id] === 'boolean' ? saved[id] : fallback;
    else input.value = (id === 'fallSpeed' ? ['0.65','1','1.6','2.3'] : ['0','180']).includes(saved[id]) ? saved[id] : fallback;
  }
  // Migrate old rhythm preferences: speed now has one selector.
  byId('soloTurbo').checked = true;
  if (['0','1','2','3','4','5'].includes(saved.startLevel)) byId('startLevel').value = saved.startLevel;
  if (['0','1','2','3','4'].includes(saved.singleTeacher)) {
    byId('singleTeacher').value = saved.singleTeacher;
    chooseSingleTeacher();
  }
  function rememberSolo() {
    const settings = {};
    for (const id of [...Object.keys(defaults), 'startLevel', 'singleTeacher']) {
      settings[id] = typeof defaults[id] === 'boolean' ? byId(id).checked : byId(id).value;
    }
    try { localStorage.setItem(preferenceKey, JSON.stringify(settings)); } catch {}
  }
  function refreshSummary() {
    const practice = byId('practice').checked;
    const timed = byId('sessionLength').value === '180';
    byId('activityNote').textContent = practice
      ? (timed ? '方程停止下降，在三分鐘內按自己的節奏解題。' : '方程停止下降，留一點時間想清楚。')
      : (timed ? '三分鐘挑戰：碰線只移除該題，不扣心，持續至時間到。' : '方程持續下降，解題時也要留意危險線。');
    const label = '開始練習';
    byId('start').replaceChildren(document.createTextNode(label + ' '));
    const arrow = document.createElement('span');
    arrow.textContent = '→';
    arrow.setAttribute('aria-hidden', 'true');
    byId('start').append(arrow);
    byId('fallSpeed').disabled = practice;
    byId('soloTurbo').disabled = practice;
  }
  home.querySelector('[data-activity=practice]').addEventListener('click', () => {
    refreshSummary();
  });
  for (const id of [...Object.keys(defaults), 'startLevel', 'singleTeacher']) byId(id).addEventListener('change', rememberSolo);
  for (const id of ['practice', 'sessionLength']) byId(id).addEventListener('change', refreshSummary);
  const teacherPreview = () => {
    const teacher = EquationTeachers[Number(byId('singleTeacher').value)] || EquationTeachers[2];
    byId('homeTeacher').src = teacher.image;
    byId('homeTeacher').alt = teacher.name + ' 指導老師';
    byId('homeTeacherName').textContent = teacher.name + ' · 你的指導老師';
  };
  byId('singleTeacher').addEventListener('change', teacherPreview);
  // These controls are supplied by the shared effects and teacher scripts.
  for (const node of [...home.querySelectorAll('.effect-settings, .teacher-preview-open')]) byId('homeEffects').append(node);
  home.querySelector('.turbo-help')?.remove(); // The same controls are explained under 玩法說明.
  byId('start').addEventListener('click', () => {
    document.body.classList.remove('home-open');
    if (typeof focusSoloStage === 'function') focusSoloStage();
    else document.querySelector('#field .node')?.focus({preventScroll:true});
  });
  // Avoid a game shortcut taking over while the native welcome form is open.
  home.addEventListener('keydown', event => {
    if (document.body.classList.contains('home-open')) event.stopPropagation();
  });
  refreshSummary();
  teacherPreview();
})();
