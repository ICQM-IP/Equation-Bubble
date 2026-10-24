'use strict';
// Welcome presets only configure existing controls; engines retain all game rules.
(() => {
  const home = document.querySelector('.home-menu');
  if (!home) return;
  const byId = id => document.getElementById(id);
  let activity = 'practice';
  const activityButtons = [...home.querySelectorAll('[data-activity]')];
  const setActivity = next => {
    activity = next;
    const practice = next === 'practice';
    byId('practice').checked = practice;
    byId('sessionLength').value = practice ? '0' : '180';
    byId('soloTurbo').checked = !practice;
    byId('fallSpeed').value = practice ? '1' : '1.6';
    byId('gentlePace').checked = true;
    activityButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.activity === next)));
    refreshSummary();
  };
  function refreshSummary() {
    const practice = byId('practice').checked;
    const timed = byId('sessionLength').value === '180';
    byId('activityNote').textContent = practice
      ? (timed ? '方程停止下降，在三分鐘內按自己的節奏解題。' : '方程停止下降，留一點時間想清楚。')
      : (timed ? '三分鐘內逐題解開方程，看看自己的進步。' : '方程持續下降，解題時也要留意危險線。');
    const label = activity === 'timed' ? '開始挑戰' : '開始練習';
    byId('start').replaceChildren(document.createTextNode(label + ' '));
    const arrow = document.createElement('span');
    arrow.textContent = '→';
    arrow.setAttribute('aria-hidden', 'true');
    byId('start').append(arrow);
    byId('fallSpeed').disabled = practice;
    byId('soloTurbo').disabled = practice;
  }
  activityButtons.forEach(button => button.addEventListener('click', () => setActivity(button.dataset.activity)));
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
    document.querySelector('#field .node')?.focus({preventScroll:true});
  });
  // Avoid a game shortcut taking over while the native welcome form is open.
  home.addEventListener('keydown', event => event.stopPropagation());
  setActivity('practice');
  teacherPreview();
})();
