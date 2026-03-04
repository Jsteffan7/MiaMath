/* ============================================
   MiaMath - UI Engine
   Handles all DOM manipulation, animations, overlays
   ============================================ */

const UIEngine = (() => {

  // ---- Stars background ----
  function initStars(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    for (let i = 0; i < 80; i++) {
      const star = document.createElement('div');
      star.className = 'star-dot';
      const size = Math.random() * 3 + 1;
      star.style.cssText = `
        width: ${size}px; height: ${size}px;
        top: ${Math.random() * 100}%;
        left: ${Math.random() * 100}%;
        --dur: ${2 + Math.random() * 3}s;
        animation-delay: ${Math.random() * 3}s;
        opacity: ${0.2 + Math.random() * 0.8};
      `;
      container.appendChild(star);
    }
  }

  // ---- Particles system ----
  function spawnParticles(containerId, count, colors) {
    const container = document.getElementById(containerId) || document.body;
    const defaultColors = ['#FF0080', '#00BFFF', '#FFD700', '#9D00FF', '#00FF88', '#FF69B4'];
    const palette = colors || defaultColors;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      const size = Math.random() * 12 + 4;
      const color = palette[Math.floor(Math.random() * palette.length)];
      const dur = 1.5 + Math.random() * 2;
      p.style.cssText = `
        width: ${size}px; height: ${size}px;
        background: ${color};
        top: ${Math.random() * 60}%;
        left: ${Math.random() * 100}%;
        animation-duration: ${dur}s;
        box-shadow: 0 0 ${size}px ${color};
      `;
      container.appendChild(p);
      setTimeout(() => p.remove(), dur * 1000 + 200);
    }
  }

  // ---- Confetti ----
  function launchConfetti() {
    const canvas = document.getElementById('confettiCanvas');
    if (!canvas) return;
    canvas.classList.add('active');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const pieces = Array.from({length: 120}, () => ({
      x: Math.random() * canvas.width,
      y: -20,
      w: 8 + Math.random() * 10,
      h: 4 + Math.random() * 8,
      color: ['#FF0080', '#00BFFF', '#FFD700', '#9D00FF', '#00FF88', '#FF69B4'][Math.floor(Math.random() * 6)],
      vx: (Math.random() - 0.5) * 6,
      vy: 2 + Math.random() * 4,
      rot: Math.random() * 360,
      rotV: (Math.random() - 0.5) * 8
    }));

    let frame;
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let active = false;
      pieces.forEach(p => {
        if (p.y < canvas.height + 20) {
          active = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot * Math.PI / 180);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          ctx.restore();
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.1;
          p.rot += p.rotV;
        }
      });
      if (active) {
        frame = requestAnimationFrame(draw);
      } else {
        canvas.classList.remove('active');
      }
    }
    draw();
    setTimeout(() => {
      cancelAnimationFrame(frame);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.classList.remove('active');
    }, 4000);
  }

  // ---- Score popup ----
  function showScorePopup(container, text, isPositive, x, y) {
    const el = document.createElement('div');
    el.className = `score-popup ${isPositive ? 'positive' : 'negative'}`;
    el.textContent = text;
    el.style.left = (x || 50) + '%';
    el.style.top  = (y || 40) + '%';
    (container || document.body).appendChild(el);
    setTimeout(() => el.remove(), 1100);
  }

  // ---- Feedback overlay ----
  function showFeedback(type) {
    const el = document.getElementById('feedbackOverlay');
    if (!el) return;
    el.textContent = type === 'correct' ? '✓ Correct!' : '✗ Try Again!';
    el.className = `feedback-overlay ${type === 'correct' ? 'correct-feed' : 'wrong-feed'}`;
    el.style.opacity = '';
    setTimeout(() => { el.style.opacity = '0'; }, 800);
  }

  // ---- Combo flash ----
  function showCombo(streak) {
    const el = document.createElement('div');
    el.className = 'combo-flash';
    const msgs = {
      5:  '🔥 5 in a row! On fire!',
      10: '⚡ 10 COMBO! Unstoppable!',
      15: '🌟 15 COMBO! Legendary!',
      20: '👑 20 COMBO! QUEEN MIA!'
    };
    el.textContent = msgs[streak] || `🔥 ${streak} Combo!`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1600);
  }

  // ---- HP bar update ----
  function updateHPBar(containerId, current, max) {
    const fill  = document.getElementById(containerId + 'Fill');
    const label = document.getElementById(containerId + 'Value');
    if (!fill) return;
    const pct = Math.max(0, (current / max) * 100);
    fill.style.width = pct + '%';
    if (label) label.textContent = `${Math.max(0, current)}/${max}`;
    fill.classList.remove('good', 'warn', 'crit');
    if (pct > 60) fill.classList.add('good');
    else if (pct > 30) fill.classList.add('warn');
    else fill.classList.add('crit');
  }

  function updateSegmentHP(containerId, current, max) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < max; i++) {
      const seg = document.createElement('div');
      seg.className = `hp-segment ${i < current ? 'filled' + (max <= 3 ? ' full' : '') : ''}`;
      container.appendChild(seg);
    }
  }

  // ---- XP bar update ----
  function updateXPBar(current, max, level) {
    const fill  = document.getElementById('xpBarFill');
    const curr  = document.getElementById('xpCurrent');
    const next  = document.getElementById('xpNext');
    const lvlEl = document.getElementById('levelDisplay');
    if (fill) fill.style.width = Math.min(100, (current / max) * 100) + '%';
    if (curr) curr.textContent = current;
    if (next) next.textContent = max;
    if (lvlEl) lvlEl.textContent = `Lv.${level}`;
  }

  // ---- Character animations ----
  function animateDemonEntrance(demonEl) {
    if (!demonEl) return;
    demonEl.classList.remove('demon-entrance', 'demon-hit', 'demon-defeat');
    void demonEl.offsetWidth;
    demonEl.classList.add('demon-entrance');
    setTimeout(() => demonEl.classList.remove('demon-entrance'), 1000);
  }

  function animateDemonHit(demonEl) {
    if (!demonEl) return;
    demonEl.classList.remove('demon-hit');
    void demonEl.offsetWidth;
    demonEl.classList.add('demon-hit');
    setTimeout(() => demonEl.classList.remove('demon-hit'), 700);
  }

  function animateDemonDefeat(demonEl, cb) {
    if (!demonEl) return;
    demonEl.classList.add('demon-defeat');
    setTimeout(() => {
      if (cb) cb();
    }, 1300);
  }

  function animateMiaAttack(miaEl) {
    if (!miaEl) return;
    miaEl.classList.remove('mia-attack');
    void miaEl.offsetWidth;
    miaEl.classList.add('mia-attack');
    setTimeout(() => miaEl.classList.remove('mia-attack'), 600);
  }

  function animateMiaHurt(miaEl) {
    if (!miaEl) return;
    miaEl.classList.remove('mia-hurt');
    void miaEl.offsetWidth;
    miaEl.classList.add('mia-hurt');
    setTimeout(() => miaEl.classList.remove('mia-hurt'), 800);
  }

  function shakeElement(el) {
    if (!el) return;
    el.classList.remove('shake-anim');
    void el.offsetWidth;
    el.classList.add('shake-anim');
    setTimeout(() => el.classList.remove('shake-anim'), 600);
  }

  function pulseCorrect(el) {
    if (!el) return;
    el.classList.add('correct-burst');
    setTimeout(() => el.classList.remove('correct-burst'), 600);
  }

  // ---- Dialog / Speech bubble ----
  function setDemonSpeech(text) {
    const el = document.getElementById('demonSpeech');
    if (el) {
      el.style.animation = 'none';
      el.offsetWidth;
      el.textContent = text;
      el.style.animation = 'fadeInUp 0.4s ease';
    }
  }

  // ---- Choice buttons ----
  function renderChoices(choices, onChoiceClick, container) {
    const grid = container || document.getElementById('choicesGrid');
    if (!grid) return;
    grid.innerHTML = '';
    choices.forEach((choice, i) => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.textContent = choice;
      btn.dataset.index = i;
      btn.addEventListener('click', () => onChoiceClick(choice, btn));
      grid.appendChild(btn);
    });
  }

  function highlightChoice(btn, isCorrect) {
    btn.classList.add(isCorrect ? 'correct' : 'wrong');
    btn.disabled = true;
  }

  function disableAllChoices() {
    document.querySelectorAll('.choice-btn').forEach(b => b.disabled = true);
  }

  function enableAllChoices() {
    document.querySelectorAll('.choice-btn').forEach(b => {
      b.disabled = false;
      b.classList.remove('correct', 'wrong');
    });
  }

  // ---- Hint display ----
  function showHint(text) {
    const el = document.getElementById('hintArea');
    if (!el) return;
    el.innerHTML = `<span class="hint-icon">💡</span> ${text}`;
    el.classList.add('visible');
  }

  function hideHint() {
    const el = document.getElementById('hintArea');
    if (el) { el.classList.remove('visible'); el.innerHTML = ''; }
  }

  // ---- Question display ----
  function setQuestion(question) {
    const qEl = document.getElementById('questionText');
    const catEl = document.getElementById('categoryTag');
    if (qEl) {
      qEl.textContent = question.text;
      qEl.className = `question-text${question.isWordProblem ? ' word-problem' : ''}`;
    }
    if (catEl) {
      const catLabels = {
        multiplication: '✖️ Multiplication', division: '➗ Division',
        fractions: '½ Fractions', placeValue: '🔢 Place Value',
        time: '⏰ Time', geometry: '📐 Geometry',
        patterns: '🎵 Patterns', addition: '➕ Addition', subtraction: '➖ Subtraction'
      };
      catEl.textContent = catLabels[question.category] || question.category;
    }
  }

  // ---- Flash question area ----
  function flashQuestionArea(type) {
    const el = document.getElementById('questionArea');
    if (!el) return;
    el.classList.remove('correct-flash', 'wrong-flash');
    void el.offsetWidth;
    el.classList.add(type === 'correct' ? 'correct-flash' : 'wrong-flash');
    setTimeout(() => el.classList.remove('correct-flash', 'wrong-flash'), 500);
  }

  // ---- Result overlay ----
  function showResult(data) {
    const overlay = document.getElementById('resultOverlay');
    const card    = document.getElementById('resultCard');
    if (!overlay || !card) return;

    card.className = `result-card ${data.victory ? 'victory' : 'defeat'}`;
    document.getElementById('resultIcon').textContent  = data.victory ? '🏆' : '💪';
    document.getElementById('resultTitle').textContent = data.victory ? 'VICTORY!' : 'Keep Going!';
    document.getElementById('resultMsg').innerHTML     = data.message || '';
    document.getElementById('resultXPGain').textContent= data.xpGained ? `+${data.xpGained} XP` : '';

    const accEl = document.getElementById('resultAccuracy');
    const strEl = document.getElementById('resultStreak');
    if (accEl) accEl.textContent = (data.accuracy || 0) + '%';
    if (strEl) strEl.textContent = data.streak || 0;

    const badgeEl = document.getElementById('badgeUnlocked');
    if (badgeEl && data.newBadge) {
      badgeEl.classList.add('show');
      document.getElementById('badgeUnlockedName').textContent = data.newBadge;
    } else if (badgeEl) {
      badgeEl.classList.remove('show');
    }

    overlay.classList.add('active');
  }

  function hideResult() {
    const overlay = document.getElementById('resultOverlay');
    if (overlay) overlay.classList.remove('active');
  }

  // ---- Mode intro ----
  function showModeIntro(demonData, onStart) {
    const intro = document.getElementById('modeIntro');
    if (!intro) return;

    const imgEl  = intro.querySelector('.intro-demon-preview img, .intro-demon-preview object');
    const nameEl = intro.querySelector('.intro-demon-name');
    const subEl  = intro.querySelector('.intro-sub');
    const descEl = intro.querySelector('.intro-desc');
    const btn    = intro.querySelector('.intro-start-btn');

    if (imgEl && demonData.sprite) imgEl.src = demonData.sprite;
    if (nameEl) nameEl.textContent = demonData.name;
    if (subEl)  subEl.textContent  = demonData.category + ' Master';
    if (descEl) descEl.textContent = demonData.intro || `${demonData.name} has appeared! Use your math skills to defeat them!`;

    intro.classList.remove('hide');
    if (btn) {
      btn.onclick = () => {
        intro.classList.add('hide');
        setTimeout(() => { if (onStart) onStart(); }, 500);
      };
    }
  }

  // ---- Level up overlay ----
  function showLevelUp(level, title) {
    const el = document.createElement('div');
    el.className = 'levelup-overlay';
    el.innerHTML = `
      <div style="text-align:center">
        <div style="font-family:var(--font-title);font-size:80px;color:var(--gold);text-shadow:0 0 40px var(--gold);animation:xpPop 0.6s ease">⭐</div>
        <div style="font-family:var(--font-title);font-size:48px;color:var(--gold)">LEVEL UP!</div>
        <div style="font-size:24px;color:white;margin-top:8px">Mia is now <strong style="color:var(--pink)">Level ${level}</strong></div>
        <div style="font-size:18px;color:var(--text-muted);margin-top:6px">${title}</div>
      </div>
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2000);
  }

  // ---- Toast notification ----
  function toast(msg, type, duration) {
    const el = document.createElement('div');
    el.style.cssText = `
      position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
      background: ${type === 'success' ? 'linear-gradient(135deg,var(--green),#009944)' : type === 'error' ? 'var(--red)' : 'linear-gradient(135deg,var(--purple),var(--pink))'};
      color: white; padding: 12px 28px; border-radius: 30px;
      font-size: 16px; font-weight: 700; z-index: 999;
      animation: fadeInUp 0.3s ease;
      box-shadow: 0 4px 20px rgba(0,0,0,0.4);
      white-space: nowrap;
    `;
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), duration || 2500);
  }

  // ---- Quick stats update ----
  function updateQuickStats(state) {
    const levelEl    = document.getElementById('statLevel');
    const xpEl       = document.getElementById('statXP');
    const accEl      = document.getElementById('statAccuracy');
    const streakEl   = document.getElementById('statStreak');
    if (levelEl) levelEl.textContent = state.level;
    if (xpEl)    xpEl.textContent    = state.xp.toLocaleString();
    if (accEl)   accEl.textContent   = state.totalAnswered > 0
      ? Math.round((state.totalCorrect / state.totalAnswered) * 100) + '%' : '--';
    if (streakEl) streakEl.textContent = state.longestStreak;
  }

  // ---- Load SVG into img ----
  function setCharacterSprite(elementId, src) {
    const el = document.getElementById(elementId);
    if (!el) return;
    // Use object tag for inline SVG rendering
    if (el.tagName === 'OBJECT') {
      el.data = src;
    } else if (el.tagName === 'IMG') {
      el.src = src;
    }
  }

  // ---- Public API ----
  return {
    initStars,
    spawnParticles,
    launchConfetti,
    showScorePopup,
    showFeedback,
    showCombo,
    updateHPBar,
    updateSegmentHP,
    updateXPBar,
    animateDemonEntrance,
    animateDemonHit,
    animateDemonDefeat,
    animateMiaAttack,
    animateMiaHurt,
    shakeElement,
    pulseCorrect,
    setDemonSpeech,
    renderChoices,
    highlightChoice,
    disableAllChoices,
    enableAllChoices,
    showHint,
    hideHint,
    setQuestion,
    flashQuestionArea,
    showResult,
    hideResult,
    showModeIntro,
    showLevelUp,
    toast,
    updateQuickStats,
    setCharacterSprite
  };
})();
