/* ============================================
   MiaMath - Game Engine
   Core battle logic, state machine, all modes
   ============================================ */

const GameEngine = (() => {

  // ---- Demon roster ----
  const DEMONS = [
    {
      id: 'multipli-fiend',
      name: 'Multipli Fiend',
      category: 'multiplication',
      sprite: 'assets/demons/multipli-fiend.svg',
      hp: 5, color: '#9D00FF',
      intro: 'Mua ha ha! I am the Multipli Fiend! Can you multiply your way to victory?',
      taunts: [
        'Times tables are my power! Can you handle this?',
        'Multiply if you dare, Mia!',
        'Each × symbol drains your energy... unless you know your facts!'
      ],
      victoryLine: 'No! Impossible! My multiplication power is GONE!',
      level: 1
    },
    {
      id: 'division-goblin',
      name: 'Division Goblin',
      category: 'division',
      sprite: 'assets/demons/division-goblin.svg',
      hp: 5, color: '#00CC66',
      intro: 'Heh heh! I split everything in half... including your brain! Ready for division?',
      taunts: [
        'Division is destruction! Can you figure this out?',
        'Share equally... if you CAN, Mia!',
        'How many groups? Tell me or suffer!'
      ],
      victoryLine: 'AUGH! Divided by your math power! You win, Mia!',
      level: 2
    },
    {
      id: 'place-value-pirate',
      name: 'Place Value Pirate',
      category: 'placeValue',
      sprite: 'assets/demons/place-value-pirate.svg',
      hp: 5, color: '#FF8C00',
      intro: 'Arr! I\'ve stolen the place value treasure! Ones, tens, hundreds, THOUSANDS! Can you find the value?',
      taunts: [
        'Which place is which, young hunter?',
        'Thousands, hundreds, tens, ones... arrr, can you sort \'em?',
        'The digits be jumbled! Set \'em right if ye dare!'
      ],
      victoryLine: 'Blimey! You know your place values! The treasure is yours, Mia!',
      level: 3
    },
    {
      id: 'fraction-phantom',
      name: 'Fraction Phantom',
      category: 'fractions',
      sprite: 'assets/demons/fraction-phantom.svg',
      hp: 6, color: '#FF6EC7',
      intro: 'I am half here... half there... all fractions! Can you piece together the answer?',
      taunts: [
        'Numerators... denominators... can your mind handle this?',
        'Parts of a whole, parts of your soul! What fraction is THIS?',
        'Equivalent or not? Choose wisely, Mia!'
      ],
      victoryLine: 'You\'ve mastered fractions! I fade into the fraction realm... farewell, Mia!',
      level: 4
    },
    {
      id: 'time-trickster',
      name: 'Time Trickster',
      category: 'time',
      sprite: 'assets/demons/time-trickster.svg',
      hp: 5, color: '#00BFFF',
      intro: 'Tick tock! Time is MY weapon! How many minutes? How many hours? Answer fast!',
      taunts: [
        'Time flies! But can you measure it?',
        'What time will it be? THINK, Mia!',
        'Elapsed time! Hurry or I\'ll steal your hours!'
      ],
      victoryLine: 'Time\'s up for ME! Your time-mastery is incredible, Mia!',
      level: 5
    },
    {
      id: 'pattern-sprite',
      name: 'Pattern Sprite',
      category: 'patterns',
      sprite: 'assets/demons/pattern-sprite.svg',
      hp: 5, color: '#FFD700',
      intro: '1, 2, 3, 4... what comes next? I am made of patterns and ONLY patterns!',
      taunts: [
        'What\'s the rule? Find the pattern, Mia!',
        'Input goes in... output comes out... what is it?',
        'Skip count! Skip count! Can you follow?'
      ],
      victoryLine: 'You broke my pattern! The Sprite is defeated! Amazing, Mia!',
      level: 6
    },
    {
      id: 'geo-guardian',
      name: 'Geo Guardian',
      category: 'geometry',
      sprite: 'assets/demons/geo-guardian.svg',
      hp: 6, color: '#FF4500',
      intro: 'RAAR! I am the guardian of shapes! Calculate my area and perimeter... if you can!',
      taunts: [
        'LENGTH times WIDTH! Can you calculate the area?',
        'Perimeter! Add all my sides! I dare you!',
        'My geometric power cannot be defeated by shapes alone!'
      ],
      victoryLine: 'Incredible! Your geometry skills have shattered my armor! You win, Mia!',
      level: 7
    },
    {
      id: 'boss-demon',
      name: 'Kali-Math-ulator',
      category: 'mixed',
      sprite: 'assets/demons/boss-demon.svg',
      hp: 10, color: '#FF0080',
      intro: 'MUA HA HA! I am KALI-MATH-ULATOR, master of ALL math! Times, divide, fractions, geometry... I know it ALL! Can Mia defeat me?!',
      taunts: [
        'I combine EVERY math power! Can you match me?',
        'Multiplication AND fractions AND geometry... choose wisely!',
        'The ultimate math demon cannot be stopped!',
        'Feel the power of ALL math categories!',
        'You\'re doing well, Mia... but not WELL ENOUGH!'
      ],
      victoryLine: 'IMPOSSIBLE!! No one has ever defeated the Kali-Math-ulator! MIAAA... you are the true Demon Hunter Champion!',
      level: 8,
      isBoss: true
    }
  ];

  // ---- Game state ----
  let state = {
    mode: 'adventure',
    demon: null,
    question: null,
    questionsAnswered: 0,
    questionsCorrect: 0,
    wrongStreak: 0,
    currentDemonIndex: 0,
    demonHP: 0,
    miaEnergy: 3,
    miaMaxEnergy: 3,
    battleXP: 0,
    phase: 'idle',
    difficulty: 1,
    adventureLevelQueue: [],
    dailyQuestions: [],
    dailyIndex: 0,
    listeners: {}
  };

  // ---- Events ----
  function on(event, handler) {
    if (!state.listeners[event]) state.listeners[event] = [];
    state.listeners[event].push(handler);
  }

  function emit(event, data) {
    (state.listeners[event] || []).forEach(fn => fn(data));
  }

  // ---- Helpers ----
  function getDemonByIndex(idx) {
    return DEMONS[Math.min(idx, DEMONS.length - 1)];
  }

  function getDemonForMode(mode) {
    if (mode === 'boss') return DEMONS[DEMONS.length - 1];
    if (mode === 'practice') return null;
    if (mode === 'daily') return null;
    // Adventure: use currentDemonIndex
    return DEMONS[state.currentDemonIndex] || DEMONS[0];
  }

  function getDifficultyFromAccuracy(accuracy, baseLevel) {
    if (accuracy < 55) return Math.max(1, baseLevel - 1);
    if (accuracy > 80) return Math.min(3, baseLevel + 1);
    return baseLevel;
  }

  function getDailyDemon() {
    const day = new Date().getDay();
    return DEMONS[day % DEMONS.length];
  }

  // ---- Start modes ----

  function startAdventure(demonIndex, savedProgress) {
    state.mode = 'adventure';
    state.currentDemonIndex = demonIndex || savedProgress?.adventureProgress?.currentLevel || 0;
    state.currentDemonIndex = Math.min(state.currentDemonIndex, DEMONS.length - 1);
    initBattle(DEMONS[state.currentDemonIndex]);
  }

  function startPractice(preferredCategory) {
    state.mode = 'practice';
    state.demon = {
      name: 'Practice Mode',
      category: preferredCategory || 'mixed',
      sprite: null,
      hp: 999,
      color: '#00BFFF'
    };
    state.questionsAnswered = 0;
    state.questionsCorrect  = 0;
    state.wrongStreak = 0;
    state.phase = 'battle';
    state.difficulty = 1;
    emit('practice_start', { demon: state.demon });
    nextQuestion();
  }

  function startBoss() {
    state.mode = 'boss';
    initBattle(DEMONS[DEMONS.length - 1]);
  }

  function startDaily() {
    state.mode = 'daily';
    // 10 mixed questions at medium difficulty
    state.dailyQuestions = Array.from({length: 10}, (_, i) => {
      const cats = ['multiplication', 'division', 'fractions', 'placeValue', 'time', 'geometry', 'patterns', 'addition', 'subtraction'];
      const cat = cats[i % cats.length];
      return MathEngine.generateQuestion(cat, 2);
    });
    state.dailyIndex = 0;
    state.questionsAnswered = 0;
    state.questionsCorrect  = 0;
    state.demon = getDailyDemon();
    state.demonHP = 10;
    state.miaEnergy = 10;
    state.phase = 'battle';
    emit('daily_start', { demon: state.demon, total: 10 });
    emit('question_ready', { question: state.dailyQuestions[0], num: 1, total: 10 });
    state.question = state.dailyQuestions[0];
  }

  function initBattle(demon) {
    state.demon = { ...demon };
    state.demonHP = demon.hp;
    state.miaEnergy = state.mode === 'boss' ? 5 : 3;
    state.miaMaxEnergy = state.miaEnergy;
    state.questionsAnswered = 0;
    state.questionsCorrect  = 0;
    state.wrongStreak = 0;
    state.battleXP = 0;
    state.phase = 'intro';
    state.difficulty = demon.level <= 2 ? 1 : demon.level <= 5 ? 2 : 3;
    emit('battle_start', { demon: state.demon });
  }

  function beginBattle() {
    state.phase = 'battle';
    nextQuestion();
  }

  // ---- Question flow ----

  function nextQuestion() {
    if (state.mode === 'daily') {
      const q = state.dailyQuestions[state.dailyIndex];
      state.question = q;
      emit('question_ready', { question: q, num: state.dailyIndex + 1, total: 10 });
      return;
    }

    const category = state.demon?.category === 'mixed'
      ? ['multiplication', 'division', 'fractions', 'placeValue', 'time', 'geometry', 'patterns'][
          Math.floor(Math.random() * 7)]
      : (state.demon?.category || 'multiplication');

    const accuracy = state.questionsAnswered > 0
      ? (state.questionsCorrect / state.questionsAnswered) * 100
      : 50;
    const diff = state.mode === 'boss'
      ? 3
      : getDifficultyFromAccuracy(accuracy, state.difficulty);

    const q = MathEngine.generateQuestion(category, diff);
    state.question = q;
    emit('question_ready', { question: q });
  }

  // ---- Answer processing ----

  function submitAnswer(userAnswer) {
    if (state.phase !== 'battle' || !state.question) return;

    const correct = MathEngine.checkAnswer(state.question, userAnswer);
    state.questionsAnswered++;

    if (correct) {
      state.questionsCorrect++;
      state.wrongStreak = 0;

      // Record to progress
      const result = ProgressSystem.recordAnswer(
        state.question.category,
        true,
        state.question.difficulty
      );
      state.battleXP += result.xpGained || 10;

      // Update XP bar
      const ps = ProgressSystem.getState();
      UIEngine.updateXPBar(
        ps.xp - ProgressSystem.getXPForCurrentLevel(),
        ProgressSystem.getXPForLevel(ps.level + 1) - ProgressSystem.getXPForCurrentLevel(),
        ps.level
      );

      // Level up check
      if (result.leveledUp) {
        UIEngine.showLevelUp(ps.level, ProgressSystem.getLevelTitle());
        AudioManager.playLevelUp();
      }

      // Damage demon
      state.demonHP = Math.max(0, state.demonHP - 1);

      emit('answer_correct', {
        question: state.question,
        demonHP: state.demonHP,
        demonMaxHP: state.demon.hp,
        xpGained: result.xpGained,
        newBadges: result.newBadges,
        streak: ps.currentStreak
      });

      // Check streak milestones
      if ([5, 10, 15, 20].includes(ps.currentStreak)) {
        emit('streak_milestone', { streak: ps.currentStreak });
      }

      // Check win
      if (state.demonHP <= 0) {
        setTimeout(() => triggerVictory(), 800);
        return;
      }

    } else {
      state.wrongStreak++;
      ProgressSystem.recordAnswer(state.question.category, false, state.question.difficulty);

      // Reduce mia energy
      if (state.wrongStreak >= 3 && state.mode !== 'practice') {
        state.miaEnergy = Math.max(0, state.miaEnergy - 1);
        state.wrongStreak = 0;
      }

      emit('answer_wrong', {
        question: state.question,
        hint: state.question.hint,
        miaEnergy: state.miaEnergy,
        miaMaxEnergy: state.miaMaxEnergy
      });

      // Check defeat
      if (state.miaEnergy <= 0 && state.mode !== 'practice') {
        setTimeout(() => triggerDefeat(), 600);
        return;
      }
    }

    // Daily challenge: advance
    if (state.mode === 'daily') {
      state.dailyIndex++;
      if (state.dailyIndex >= 10) {
        setTimeout(() => triggerDailyComplete(), 800);
        return;
      }
    }

    // Schedule next question
    setTimeout(() => nextQuestion(), correct ? 1200 : 2500);
  }

  // ---- Outcome handlers ----

  function triggerVictory() {
    state.phase = 'victory';
    const ps = ProgressSystem.getState();

    let xpGained = state.battleXP;
    let leveledUp = false;
    let newBadges = [];

    if (state.mode === 'boss') {
      const r = ProgressSystem.recordBossBattleWon();
      xpGained += r.xpGained;
      leveledUp = r.leveledUp;
      newBadges = r.newBadges;
    } else if (state.mode === 'adventure') {
      const r = ProgressSystem.recordBattleWon(state.demon.category);
      xpGained += r.xpGained;
      leveledUp = r.leveledUp;
      newBadges = r.newBadges;
      ProgressSystem.recordAdventureLevel(state.currentDemonIndex);
    } else {
      const r = ProgressSystem.recordBattleWon(state.demon?.category || 'mixed');
      xpGained += r.xpGained;
      newBadges = r.newBadges;
    }

    const accuracy = state.questionsAnswered > 0
      ? Math.round((state.questionsCorrect / state.questionsAnswered) * 100) : 0;

    emit('battle_victory', {
      demon: state.demon,
      xpGained,
      accuracy,
      streak: ps.currentStreak,
      newBadges,
      leveledUp,
      mode: state.mode,
      nextDemonIndex: state.mode === 'adventure' ? state.currentDemonIndex + 1 : null,
      hasNextDemon: state.mode === 'adventure' && state.currentDemonIndex < DEMONS.length - 2
    });
  }

  function triggerDefeat() {
    state.phase = 'defeat';
    const ps = ProgressSystem.getState();
    const accuracy = state.questionsAnswered > 0
      ? Math.round((state.questionsCorrect / state.questionsAnswered) * 100) : 0;

    emit('battle_defeat', {
      demon: state.demon,
      accuracy,
      streak: ps.currentStreak,
      mode: state.mode
    });
  }

  function triggerDailyComplete() {
    const perfect = state.questionsCorrect === 10;
    const result = ProgressSystem.recordDailyChallenge(
      state.questionsCorrect, 10, perfect
    );

    emit('daily_complete', {
      score: state.questionsCorrect,
      total: 10,
      perfect,
      xpGained: result.xpGained,
      newBadges: result.newBadges,
      accuracy: Math.round((state.questionsCorrect / 10) * 100)
    });
  }

  // ---- Advance to next demon ----
  function advanceToNextDemon() {
    state.currentDemonIndex++;
    if (state.currentDemonIndex >= DEMONS.length) {
      emit('adventure_complete', {});
      return;
    }
    initBattle(DEMONS[state.currentDemonIndex]);
  }

  function retryBattle() {
    initBattle(state.demon);
  }

  // ---- Getters ----
  function getState()  { return state; }
  function getDemons() { return DEMONS; }
  function getCurrentDemon() { return state.demon; }
  function getDemonForAdventureLevel(lvl) { return DEMONS[lvl] || DEMONS[0]; }

  // ---- Public API ----
  return {
    on,
    startAdventure,
    startPractice,
    startBoss,
    startDaily,
    beginBattle,
    submitAnswer,
    nextQuestion,
    advanceToNextDemon,
    retryBattle,
    getState,
    getDemons,
    getCurrentDemon,
    getDemonForAdventureLevel,
    DEMONS
  };
})();
