'use strict';
// Welcome presets only configure existing controls; engines retain all game rules.
(() => {
  const home = document.querySelector('.home-menu');
  if (!home) return;
  const byId = id => document.getElementById(id);
  byId('practice').checked = false;
  byId('sessionLength').value = '0';
  byId('soloTurbo').checked = false;
  byId('fallSpeed').value = '1.6';
  byId('gentlePace').checked = true;
  function refreshSummary() {
    const practice = byId('practice').checked;
    const timed = byId('sessionLength').value === '180';
    byId('activityNote').textContent = practice
      ? (timed ? '方程停止下降，在三分鐘內按自己的節奏解題。' : '方程停止下降，留一點時間想清楚。')
      : (timed ? '三分鐘內逐題解開方程，看看自己的進步。' : '方程持續下降，解題時也要留意危險線。');
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
    byId('practice').checked = false;
    byId('sessionLength').value = '0';
    byId('soloTurbo').checked = false;
    refreshSummary();
  });
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
