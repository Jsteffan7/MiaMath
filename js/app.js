/* ============================================
   MiaMath - App Entry Point
   Handles routing, initialization, event wiring
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ---- Load progress ----
  const ps = ProgressSystem.load();
  AudioManager.init();
  AudioManager.setEnabled(ps.settings?.soundEnabled !== false);
  AudioManager.setMusicEnabled(ps.settings?.musicEnabled === true);

  // ---- Detect current page ----
  const page = detectPage();

  if (page === 'index')     initLandingPage(ps);
  if (page === 'game')      initGamePage(ps);
  if (page === 'dashboard') initDashboardPage(ps);
});

function detectPage() {
  const path = window.location.pathname;
  if (path.includes('game'))      return 'game';
  if (path.includes('dashboard')) return 'dashboard';
  return 'index';
}

// ============================================
// LANDING PAGE
// ============================================

function initLandingPage(ps) {
  UIEngine.initStars('starsContainer');
  UIEngine.updateQuickStats(ps);

  // Personalize
  const nameEls = document.querySelectorAll('.player-name');
  nameEls.forEach(el => el.textContent = ps.playerName || 'Mia');

  // Load hero sprite
  const heroEl = document.getElementById('heroPic');
  if (heroEl) heroEl.src = 'assets/characters/mia.svg';

  // Daily challenge button state
  if (ProgressSystem.isDailyDone()) {
    const dailyCard = document.querySelector('.daily-card');
    if (dailyCard) {
      dailyCard.querySelector('.card-desc').textContent = '✅ Complete! Come back tomorrow!';
      dailyCard.style.opacity = '0.7';
    }
  }

  // Animate mode cards staggered entrance
  document.querySelectorAll('.mode-card').forEach((card, i) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    setTimeout(() => {
      card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, 200 + i * 100);
  });
}

// ============================================
// GAME PAGE
// ============================================

function initGamePage(ps) {
  UIEngine.initStars('starsContainer');
  AudioManager.init();

  const params = new URLSearchParams(window.location.search);
  const mode = params.get('mode') || 'adventure';
  const demonIdx = parseInt(params.get('level') || '0', 10);

  // Initial XP bar
  UIEngine.updateXPBar(
    ps.xp - ProgressSystem.getXPForCurrentLevel(),
    ProgressSystem.getXPForLevel(ps.level + 1) - ProgressSystem.getXPForCurrentLevel(),
    ps.level
  );

  // Update streak badge
  updateStreakBadge(ps.currentStreak);

  // Wire up game engine events
  wireGameEvents(mode);

  // Start the correct mode
  if (mode === 'adventure')  GameEngine.startAdventure(demonIdx, ps);
  else if (mode === 'practice') GameEngine.startPractice();
  else if (mode === 'boss')  GameEngine.startBoss();
  else if (mode === 'daily') GameEngine.startDaily();

  // Result overlay buttons
  document.getElementById('btnNextDemon')?.addEventListener('click', () => {
    UIEngine.hideResult();
    GameEngine.advanceToNextDemon();
  });
  document.getElementById('btnRetry')?.addEventListener('click', () => {
    UIEngine.hideResult();
    GameEngine.retryBattle();
  });
  document.getElementById('btnHome')?.addEventListener('click', () => {
    window.location.href = 'index.html';
  });
  document.getElementById('btnHome2')?.addEventListener('click', () => {
    window.location.href = 'index.html';
  });

  // HUD back button
  document.getElementById('hudHomeBtn')?.addEventListener('click', () => {
    if (confirm('Leave this battle? Your progress will be saved!')) {
      window.location.href = 'index.html';
    }
  });

  // Sound toggle
  const soundBtn = document.getElementById('soundToggle');
  if (soundBtn) {
    soundBtn.textContent = ps.settings?.soundEnabled !== false ? '🔊' : '🔇';
    soundBtn.addEventListener('click', () => {
      const current = ps.settings?.soundEnabled !== false;
      ProgressSystem.updateSettings({ soundEnabled: !current });
      AudioManager.setEnabled(!current);
      soundBtn.textContent = !current ? '🔊' : '🔇';
    });
  }

  // Fill-in-blank submit
  const fillForm = document.getElementById('fillBlankForm');
  if (fillForm) {
    fillForm.addEventListener('submit', e => {
      e.preventDefault();
      const val = document.getElementById('fillBlankInput').value.trim();
      if (val !== '') {
        AudioManager.playClick();
        processAnswer(val);
        document.getElementById('fillBlankInput').value = '';
      }
    });
  }
}

function wireGameEvents(mode) {
  // ---- Battle start ----
  GameEngine.on('battle_start', ({ demon }) => {
    AudioManager.playDemonEntrance();
    setDemonDisplay(demon);
    setMiaDisplay();

    // Show intro overlay
    if (mode !== 'practice') {
      UIEngine.showModeIntro(demon, () => {
        GameEngine.beginBattle();
      });
    } else {
      GameEngine.beginBattle();
    }
  });

  // ---- Practice start ----
  GameEngine.on('practice_start', ({ demon }) => {
    document.getElementById('demonNameBadge').textContent = '📚 Practice Mode';
    document.getElementById('demonSpeech').textContent = 'Let\'s practice your math skills, Mia!';
    document.getElementById('demonSprite')?.setAttribute('data', 'assets/characters/mia.svg');
    UIEngine.updateSegmentHP('demonHPSegments', 0, 0);
    document.querySelector('.demon-side')?.classList.add('hidden');
    setMiaDisplay();
  });

  // ---- Daily start ----
  GameEngine.on('daily_start', ({ demon, total }) => {
    setDemonDisplay(demon);
    setMiaDisplay();
    const progressEl = document.getElementById('dailyProgress');
    if (progressEl) {
      progressEl.style.display = 'block';
      updateDailyProgress(0, total);
    }
    GameEngine.beginBattle();
  });

  // ---- Question ready ----
  GameEngine.on('question_ready', ({ question, num, total }) => {
    UIEngine.setQuestion(question);
    UIEngine.hideHint();
    UIEngine.enableAllChoices();

    // Show input type
    if (question.type === 'multiple-choice' || question.type === 'multiple-choice-text') {
      showChoiceArea(question);
    } else {
      showFillArea();
    }

    // Update daily progress
    if (mode === 'daily' && num) {
      updateDailyProgress(num - 1, total);
    }

    // Demon taunt
    const gs = GameEngine.getState();
    if (gs.demon?.taunts) {
      const taunts = gs.demon.taunts;
      const taunt = taunts[Math.floor(Math.random() * taunts.length)];
      UIEngine.setDemonSpeech(taunt);
    }
  });

  // ---- Correct answer ----
  GameEngine.on('answer_correct', ({ demonHP, demonMaxHP, xpGained, newBadges, streak }) => {
    AudioManager.playCorrect();
    UIEngine.showFeedback('correct');
    UIEngine.flashQuestionArea('correct');
    UIEngine.animateMiaAttack(document.getElementById('miaSprite'));
    UIEngine.animateDemonHit(document.getElementById('demonSprite'));
    UIEngine.showScorePopup(document.getElementById('battleArena'), `+${xpGained} XP`, true);

    if (mode !== 'practice') {
      UIEngine.updateSegmentHP('demonHPSegments', demonHP, demonMaxHP);
    }

    updateStreakBadge(streak);
    if ([5, 10, 15, 20].includes(streak)) {
      UIEngine.showCombo(streak);
      AudioManager.playCombo();
    }

    if (newBadges && newBadges.length > 0) {
      setTimeout(() => {
        AudioManager.playBadgeUnlock();
        UIEngine.toast(`🏆 Badge unlocked: ${newBadges[0]}!`, 'success', 3000);
      }, 1000);
    }

    const psNow = ProgressSystem.getState();
    UIEngine.updateXPBar(
      psNow.xp - ProgressSystem.getXPForCurrentLevel(),
      ProgressSystem.getXPForLevel(psNow.level + 1) - ProgressSystem.getXPForCurrentLevel(),
      psNow.level
    );
  });

  // ---- Wrong answer ----
  GameEngine.on('answer_wrong', ({ hint, miaEnergy, miaMaxEnergy }) => {
    AudioManager.playWrong();
    UIEngine.showFeedback('wrong');
    UIEngine.flashQuestionArea('wrong');
    UIEngine.animateMiaHurt(document.getElementById('miaSprite'));
    UIEngine.shakeElement(document.getElementById('questionArea'));
    UIEngine.showHint(hint);

    if (mode !== 'practice') {
      UIEngine.updateHPBar('miaEnergy', miaEnergy, miaMaxEnergy);
      updateStreakBadge(0);
    }
  });

  // ---- Streak milestone ----
  GameEngine.on('streak_milestone', ({ streak }) => {
    AudioManager.playStreak();
    UIEngine.showCombo(streak);
    updateStreakBadge(streak);
  });

  // ---- Victory ----
  GameEngine.on('battle_victory', (data) => {
    AudioManager.playVictory();
    UIEngine.animateDemonDefeat(document.getElementById('demonSprite'), () => {
      UIEngine.launchConfetti();
    });

    setTimeout(() => {
      const ps = ProgressSystem.getState();
      UIEngine.showResult({
        victory: true,
        message: `Incredible, <span class="name-hi">Mia</span>! You defeated ${data.demon.name}! ${data.demon.victoryLine || ''}`,
        xpGained: data.xpGained,
        accuracy: data.accuracy,
        streak: ps.longestStreak,
        newBadge: data.newBadges?.[0] || null
      });

      // Show/hide next demon button
      const nextBtn = document.getElementById('btnNextDemon');
      if (nextBtn) {
        nextBtn.style.display = data.hasNextDemon ? 'inline-flex' : 'none';
      }
    }, 1500);
  });

  // ---- Defeat ----
  GameEngine.on('battle_defeat', (data) => {
    AudioManager.playDefeat();
    const ps = ProgressSystem.getState();
    UIEngine.showResult({
      victory: false,
      message: `Don't give up, <span class="name-hi">Mia</span>! Every demon gets harder to beat the more you practice. Try again!`,
      xpGained: 0,
      accuracy: data.accuracy,
      streak: ps.longestStreak
    });

    const nextBtn = document.getElementById('btnNextDemon');
    if (nextBtn) nextBtn.style.display = 'none';
  });

  // ---- Daily complete ----
  GameEngine.on('daily_complete', (data) => {
    const ps = ProgressSystem.getState();
    if (data.perfect) UIEngine.launchConfetti();
    AudioManager.playVictory();

    UIEngine.showResult({
      victory: data.score >= 7,
      message: data.perfect
        ? `PERFECT SCORE! You got every question right, <span class="name-hi">Mia</span>! You are TODAY\'S Champion!`
        : `Great effort, <span class="name-hi">Mia</span>! You got ${data.score} out of 10 correct! Keep practicing!`,
      xpGained: data.xpGained,
      accuracy: data.accuracy,
      streak: ps.longestStreak,
      newBadge: data.newBadges?.[0] || null
    });

    const nextBtn = document.getElementById('btnNextDemon');
    if (nextBtn) nextBtn.style.display = 'none';
  });

  // ---- Adventure complete ----
  GameEngine.on('adventure_complete', () => {
    AudioManager.playVictory();
    UIEngine.launchConfetti();
    const ps = ProgressSystem.getState();
    UIEngine.showResult({
      victory: true,
      message: `🎉 YOU DID IT, <span class="name-hi">Mia</span>! You've defeated ALL demons and saved the realm! You are the ultimate K-Pop Demon Hunter Champion! 🏆`,
      xpGained: 500,
      accuracy: ProgressSystem.getAccuracy(),
      streak: ps.longestStreak
    });
    const nextBtn = document.getElementById('btnNextDemon');
    if (nextBtn) nextBtn.style.display = 'none';
  });
}

// ---- Display helpers ----

function setDemonDisplay(demon) {
  const nameEl  = document.getElementById('demonNameBadge');
  const hpEl    = document.getElementById('demonHPSegments');
  const spriteEl = document.getElementById('demonSprite');

  if (nameEl) nameEl.textContent = demon.name;
  if (hpEl)   UIEngine.updateSegmentHP('demonHPSegments', demon.hp, demon.hp);
  if (spriteEl && demon.sprite) {
    spriteEl.data = demon.sprite;
  }
  UIEngine.animateDemonEntrance(document.getElementById('demonSprite'));
}

function setMiaDisplay() {
  const gs = GameEngine.getState();
  UIEngine.updateHPBar('miaEnergy', gs.miaEnergy, gs.miaMaxEnergy);
  const miaSprite = document.getElementById('miaSprite');
  if (miaSprite) miaSprite.src = 'assets/characters/mia.svg';
}

function showChoiceArea(question) {
  const choiceDiv = document.getElementById('choiceArea');
  const fillDiv   = document.getElementById('fillArea');
  if (choiceDiv) choiceDiv.style.display = 'block';
  if (fillDiv)   fillDiv.style.display = 'none';

  UIEngine.renderChoices(question.choices, (choice, btn) => {
    AudioManager.playClick();
    UIEngine.disableAllChoices();

    const correct = MathEngine.checkAnswer(question, choice);
    UIEngine.highlightChoice(btn, correct);

    if (!correct) {
      // Highlight the correct answer
      document.querySelectorAll('.choice-btn').forEach(b => {
        if (MathEngine.checkAnswer(question, b.textContent)) {
          b.classList.add('correct');
        }
      });
    }
    processAnswer(choice);
  });
}

function showFillArea() {
  const choiceDiv = document.getElementById('choiceArea');
  const fillDiv   = document.getElementById('fillArea');
  if (choiceDiv) choiceDiv.style.display = 'none';
  if (fillDiv)   fillDiv.style.display = 'block';
  const input = document.getElementById('fillBlankInput');
  if (input) { input.value = ''; setTimeout(() => input.focus(), 100); }
}

function processAnswer(val) {
  GameEngine.submitAnswer(val);
}

function updateStreakBadge(streak) {
  const el = document.getElementById('streakBadge');
  if (!el) return;
  el.textContent = `🔥 ${streak}`;
  el.classList.toggle('hot', streak >= 5);
}

function updateDailyProgress(current, total) {
  const fill = document.getElementById('dailyProgressFill');
  const text = document.getElementById('dailyProgressText');
  if (fill) fill.style.width = ((current / total) * 100) + '%';
  if (text) text.textContent = `Question ${current + 1} of ${total}`;
}

// ============================================
// DASHBOARD PAGE
// ============================================

function initDashboardPage(ps) {
  UIEngine.initStars('starsContainer');

  // Hero card
  const pNameEl = document.getElementById('heroName');
  const titleEl  = document.getElementById('heroTitle');
  const lvlRing  = document.getElementById('heroLevelRing');
  if (pNameEl)  pNameEl.textContent  = ps.playerName || 'Mia';
  if (titleEl)  titleEl.textContent  = ProgressSystem.getLevelTitle();
  if (lvlRing)  lvlRing.textContent  = `${ps.level}`;

  // XP bar
  const xpFill  = document.getElementById('heroXpFill');
  const xpCurr  = document.getElementById('heroXpCurrent');
  const xpNext  = document.getElementById('heroXpNext');
  const currBase = ProgressSystem.getXPForCurrentLevel();
  const nextBase = ProgressSystem.getXPForLevel(ps.level + 1);
  const pct = nextBase > currBase ? ((ps.xp - currBase) / (nextBase - currBase)) * 100 : 100;
  if (xpFill) setTimeout(() => { xpFill.style.width = Math.min(100, pct) + '%'; }, 300);
  if (xpCurr) xpCurr.textContent = (ps.xp - currBase).toLocaleString();
  if (xpNext)  xpNext.textContent  = (nextBase - currBase).toLocaleString();

  // Stats
  const acc = ProgressSystem.getAccuracy();
  setDashStat('statTotalQ',    ps.totalAnswered.toLocaleString());
  setDashStat('statAccuracy',  acc + '%');
  setDashStat('statStreak',    ps.longestStreak);
  setDashStat('statDemons',    ps.demonsDefeated);
  setDashStat('statLevel',     ps.level);
  setDashStat('statXP',        ps.xp.toLocaleString());

  // Skill bars
  renderSkillBars(ps);

  // Badges
  renderBadges(ps);

  // Recommended practice
  renderRecommendations(ps);
}

function setDashStat(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function renderSkillBars(ps) {
  const skills = [
    { key: 'multiplication', name: 'Multiplication', icon: '✖️', color: '#9D00FF' },
    { key: 'division',       name: 'Division',       icon: '➗', color: '#00CC66' },
    { key: 'fractions',      name: 'Fractions',      icon: '½',  color: '#FF6EC7' },
    { key: 'placeValue',     name: 'Place Value',    icon: '🔢', color: '#FF8C00' },
    { key: 'time',           name: 'Time',           icon: '⏰', color: '#00BFFF' },
    { key: 'geometry',       name: 'Geometry',       icon: '📐', color: '#FF4500' },
    { key: 'patterns',       name: 'Patterns',       icon: '🎵', color: '#FFD700' },
    { key: 'addition',       name: 'Addition',       icon: '➕', color: '#FF69B4' },
    { key: 'subtraction',    name: 'Subtraction',    icon: '➖', color: '#6A5ACD' }
  ];

  const container = document.getElementById('skillBars');
  if (!container) return;
  container.innerHTML = '';

  skills.forEach(skill => {
    const acc = ProgressSystem.getCategoryAccuracy(skill.key);
    const total = ps.categoryStats?.[skill.key]?.total || 0;
    const row = document.createElement('div');
    row.className = 'skill-row';
    row.innerHTML = `
      <span class="skill-icon">${skill.icon}</span>
      <span class="skill-name">${skill.name}</span>
      <div class="skill-track">
        <div class="skill-fill" data-pct="${acc}" style="width:0%;background:linear-gradient(90deg,${skill.color},${skill.color}aa)"></div>
      </div>
      <span class="skill-pct" style="color:${skill.color}">${total > 0 ? acc + '%' : '--'}</span>
    `;
    container.appendChild(row);
  });

  // Animate fills
  setTimeout(() => {
    container.querySelectorAll('.skill-fill').forEach(el => {
      el.style.width = el.dataset.pct + '%';
    });
  }, 400);
}

function renderBadges(ps) {
  const container = document.getElementById('badgesGrid');
  if (!container) return;

  // Load rewards.json
  fetch('data/rewards.json')
    .then(r => r.json())
    .then(data => {
      container.innerHTML = '';
      data.badges.forEach(badge => {
        const unlocked = ps.badges.includes(badge.id);
        const card = document.createElement('div');
        card.className = `badge-card ${unlocked ? 'unlocked' : 'locked'} ${badge.rarity || ''}`;
        card.innerHTML = `
          <span class="badge-icon">${badge.icon || badge.emoji || '🏅'}</span>
          <div class="badge-name">${badge.name}</div>
          <div class="badge-desc">${unlocked ? badge.description : '???'}</div>
          <span class="badge-rarity rarity-${badge.rarity}">${badge.rarity}</span>
        `;
        if (unlocked) {
          card.title = badge.unlockMessage || badge.description;
        }
        container.appendChild(card);
      });
    })
    .catch(() => {
      container.innerHTML = '<p style="color:var(--text-muted);font-size:13px">Play to earn badges!</p>';
    });
}

function renderRecommendations(ps) {
  const container = document.getElementById('recommendGrid');
  if (!container) return;

  const weak = ProgressSystem.getWeakestCategories(3);
  const catInfo = {
    multiplication: { name: 'Multiplication', icon: '✖️', mode: 'practice' },
    division:       { name: 'Division',       icon: '➗', mode: 'practice' },
    fractions:      { name: 'Fractions',      icon: '½',  mode: 'practice' },
    placeValue:     { name: 'Place Value',    icon: '🔢', mode: 'practice' },
    time:           { name: 'Time',           icon: '⏰', mode: 'practice' },
    geometry:       { name: 'Geometry',       icon: '📐', mode: 'practice' },
    patterns:       { name: 'Patterns',       icon: '🎵', mode: 'practice' },
    addition:       { name: 'Addition',       icon: '➕', mode: 'practice' },
    subtraction:    { name: 'Subtraction',    icon: '➖', mode: 'practice' }
  };

  // Always show Daily Challenge first
  container.innerHTML = `
    <a href="game.html?mode=daily" class="recommend-card">
      <span class="rec-icon">🌙</span>
      <div class="rec-name">Daily Challenge</div>
      <div class="rec-desc">${ProgressSystem.isDailyDone() ? '✅ Done today! Come back tomorrow.' : 'Complete today\'s 10 questions!'}</div>
      <span class="rec-action">Start →</span>
    </a>
  `;

  if (weak.length === 0) {
    container.innerHTML += `
      <a href="game.html?mode=adventure" class="recommend-card">
        <span class="rec-icon">⚔️</span>
        <div class="rec-name">Adventure Mode</div>
        <div class="rec-desc">Battle through all demon levels!</div>
        <span class="rec-action">Battle →</span>
      </a>
    `;
  } else {
    weak.slice(0, 2).forEach(cat => {
      const info = catInfo[cat] || { name: cat, icon: '📚', mode: 'practice' };
      container.innerHTML += `
        <a href="game.html?mode=practice&cat=${cat}" class="recommend-card">
          <span class="rec-icon">${info.icon}</span>
          <div class="rec-name">Practice ${info.name}</div>
          <div class="rec-desc">Mia, this area needs more work! Let's level it up!</div>
          <span class="rec-action">Practice →</span>
        </a>
      `;
    });
  }
}
