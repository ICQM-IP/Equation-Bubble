'use strict';
// Presentation only: observe teacher events, never alter physics, scoring or timers.
(() => {
  const versus = document.body.classList.contains('versus-page');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const views = [];
  const reactions = [null, null];
  const messages = {
    fire: ['出發！', .38, 1], hit: ['漂亮一步！', .85, 2],
    clear: ['平衡完成！', 1.25, 4], chain: ['連解！', 1.25, 5],
    rescue: ['救援啟動！', 1.4, 8], 'attack-send': ['星題出擊！', 1.1, 6],
    'attack-reflect': ['反彈成功！', 1.4, 8], 'attack-cancel': ['漂亮反制！', 1.2, 7],
    'life-loss': ['再接再厲！', 1.1, 6], miss: ['再想一步', .8, 1]
  };
  const effectsOn = () => !reduced.matches && (typeof excitementEffects === 'undefined' || excitementEffects);
  for (let i = 0; i < (versus ? 2 : 1); i++) {
    for (const selector of versus ? ['#avatar' + i, '#vsMobileTeacher' + i] : ['#teacher', '#mobileTeacherIcon']) {
      const source = document.querySelector(selector);
      if (!source) continue;
      const frame = document.createElement('div');
      frame.className = 'mentor-stage';
      frame.dataset.player = String(i);
      frame.setAttribute('aria-hidden', 'true');
      const glow = document.createElement('span');
      glow.className = 'mentor-glow';
      const portrait = document.createElement('img');
      portrait.className = 'mentor-cut-in';
      portrait.alt = '';
      const caption = document.createElement('span');
      caption.className = 'mentor-caption';
      caption.textContent = 'READY';
      frame.append(glow, portrait, caption);
      source.before(frame);
      views.push({source, frame, portrait, caption, i});
    }
  }
  window.arcadeArtEvent = event => {
    const i = event.player || 0;
    if (event.type === 'fire' && effectsOn()) {
      const cannon = document.querySelector(versus ? '#cannon' + i : '#cannon');
      cannon.classList.remove('arcade-shot');
      void cannon.offsetWidth;
      cannon.classList.add('arcade-shot');
    }
    const entry = messages[event.type];
    if (!entry) return;
    const chain = event.chain || (versus ? match?.players[i]?.chain : (typeof turbo !== 'undefined' && turbo ? fastChain : typeof combo !== 'undefined' ? combo : fastChain)) || 0;
    const strong = ['rescue', 'attack-reflect', 'attack-cancel', 'attack-send'].includes(event.type)
      || (['clear', 'chain'].includes(event.type) && chain >= 2);
    const priority = entry[2];
    if (reactions[i]?.left > 0 && reactions[i].priority > priority) return;
    reactions[i] = {text:chain >= 2 && ['clear','chain'].includes(event.type) ? chain + ' 連解！' : entry[0],
      left:entry[1], strong, priority, type:event.type};
  };
  let last = 0, session;
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000 || 0); last = now;
    const current = versus ? match : version;
    if (session !== current) { session = current; reactions.fill(null); }
    const pausedArt = document.hidden || mobileInputEditing || (versus ? !!match?.paused : paused);
    document.body.classList.toggle('arcade-art-paused', !!pausedArt);
    const active = versus ? match?.status === 'playing' && document.querySelector('#battleSetup').classList.contains('hidden')
      && document.querySelector('#battleResult').classList.contains('hidden') : running;
    if (!pausedArt) reactions.forEach(reaction => { if (reaction) reaction.left = Math.max(0, reaction.left - dt); });
    for (const view of views) {
      const {source, frame, portrait, caption, i} = view;
      if(versus&&mobileMode&&typeof computerMode!=='undefined'&&computerMode&&i===1){frame.hidden=true;continue;}
      const visible = active && source.getClientRects().length && getComputedStyle(source).display !== 'none';
      frame.hidden = !visible;
      if (!visible) continue;
      frame.style.left = source.offsetLeft + 'px'; frame.style.top = source.offsetTop + 'px';
      frame.style.width = source.offsetWidth + 'px'; frame.style.height = source.offsetHeight + 'px';
      frame.style.animationPlayState = pausedArt ? 'paused' : 'running';
      const reaction = reactions[i];
      const showing = reaction?.left > 0;
      frame.classList.toggle('is-reacting', !!showing);
      frame.classList.toggle('is-special', !!showing && reaction.strong && effectsOn());
      frame.classList.toggle('is-quiet', !effectsOn());
      frame.dataset.reaction = showing ? reaction.type : 'idle';
      caption.textContent = showing ? reaction.text : 'READY';
      if (portrait.getAttribute('src') !== source.getAttribute('src')) portrait.src = source.getAttribute('src');
      const actor = source.parentElement.querySelector('.teacher-actor');
      if (actor) {
        actor.classList.toggle('arcade-mentor-reacting', !!showing && effectsOn());
        actor.classList.toggle('arcade-mentor-special', !!showing && reaction.strong && effectsOn());
      }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
