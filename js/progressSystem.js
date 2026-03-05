/* ============================================
   MiaMath - Progress System
   Handles XP, levels, badges, and local storage
   ============================================ */

const ProgressSystem = (() => {
  const SAVE_KEY = 'miamath_progress';

  const DEFAULT_STATE = {
    playerName: 'Mia',
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    totalCorrect: 0,
    totalAnswered: 0,
    currentStreak: 0,
    longestStreak: 0,
    totalBattles: 0,
    battlesWon: 0,
    demonsDefeated: 0,
    bossDefeated: false,
    badges: [],
    categoryStats: {
      multiplication: { correct: 0, total: 0 },
      division:       { correct: 0, total: 0 },
      fractions:      { correct: 0, total: 0 },
      placeValue:     { correct: 0, total: 0 },
      time:           { correct: 0, total: 0 },
      geometry:       { correct: 0, total: 0 },
      patterns:       { correct: 0, total: 0 },
      addition:       { correct: 0, total: 0 },
      subtraction:    { correct: 0, total: 0 }
    },
    adventureProgress: {
      currentLevel: 0,
      defeatedDemons: [],
      levelStars: {}
    },
    dailyChallenge: {
      date: null,
      completed: false,
      score: 0,
      perfect: false
    },
    settings: {
      soundEnabled: true,
      musicEnabled: false
    },
    firstPlayDate: null,
    lastPlayDate: null,
    activityLog: []    // array of date strings (e.g. "Mon Jan 01 2026") – one per active day
  };

  // Level thresholds (XP required for each level)
  const LEVEL_THRESHOLDS = [
    0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700,
    3250, 3850, 4500, 5200, 5950, 6750, 7600, 8500, 9450, 10000
  ];

  const LEVEL_TITLES = [
    'Trainee', 'Apprentice', 'Math Cadet', 'Demon Scout', 'Battle Mage',
    'Math Knight', 'Demon Hunter', 'Elite Hunter', 'Math Champion', 'Legendary Hero',
    'Demon Slayer', 'Math Overlord', 'Academy Master', 'Grand Champion', 'Ultimate Hero',
    'Math Legend', 'Phantom Slayer', 'Supreme Master', 'Celestial Hunter', 'Demon Destroyer'
  ];

  const XP_REWARDS = {
    correct_easy:    10,
    correct_medium:  15,
    correct_hard:    25,
    wrong:            0,
    demon_defeated:  75,
    boss_defeated:  300,
    daily_complete: 100,
    daily_perfect:  250,
    streak_bonus_5:  20,
    streak_bonus_10: 50
  };

  let state = null;
  let pendingBadges = [];

  function load() {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Deep merge with defaults so new fields are always present
        state = deepMerge(JSON.parse(JSON.stringify(DEFAULT_STATE)), parsed);
      } else {
        state = JSON.parse(JSON.stringify(DEFAULT_STATE));
        state.firstPlayDate = new Date().toISOString();
      }
    } catch (e) {
      console.warn('Progress load failed, starting fresh.', e);
      state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    }
    state.lastPlayDate = new Date().toISOString();
    save();
    return state;
  }

  function save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Progress save failed.', e);
    }
  }

  function reset() {
    state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    state.firstPlayDate = new Date().toISOString();
    save();
    return state;
  }

  function getState() { return state; }

  function deepMerge(target, source) {
    for (const key in source) {
      if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key]) target[key] = {};
        deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
    return target;
  }

  // ---- XP & Level ----

  function addXP(amount) {
    if (!state) return { leveledUp: false, newBadges: [] };
    state.xp += amount;
    const result = checkLevelUp();
    save();
    return result;
  }

  function checkLevelUp() {
    let leveledUp = false;
    while (state.level < LEVEL_THRESHOLDS.length &&
           state.xp >= getXPForLevel(state.level + 1)) {
      state.level++;
      leveledUp = true;
    }
    state.xpToNextLevel = getXPForLevel(state.level + 1) || getXPForLevel(state.level);
    return { leveledUp, level: state.level };
  }

  function getXPForLevel(level) {
    if (level <= 1) return 0;
    const idx = Math.min(level - 1, LEVEL_THRESHOLDS.length - 1);
    return LEVEL_THRESHOLDS[idx];
  }

  function getXPForCurrentLevel() {
    return getXPForLevel(state.level);
  }

  function getLevelProgress() {
    const currentBase = getXPForCurrentLevel();
    const nextBase    = getXPForLevel(state.level + 1);
    if (!nextBase || nextBase <= currentBase) return 100;
    const progress = ((state.xp - currentBase) / (nextBase - currentBase)) * 100;
    return Math.min(100, Math.max(0, progress));
  }

  function getLevelTitle() {
    const idx = Math.min(state.level - 1, LEVEL_TITLES.length - 1);
    return LEVEL_TITLES[idx];
  }

  // ---- Activity log ----

  function logActivity() {
    const today = new Date().toDateString();
    if (!state.activityLog) state.activityLog = [];
    if (!state.activityLog.includes(today)) {
      state.activityLog.unshift(today);
      state.activityLog = state.activityLog.slice(0, 90); // keep ~3 months
      save();
    }
  }

  // ---- Answer tracking ----

  function recordAnswer(category, correct, difficulty) {
    if (!state) return {};
    state.totalAnswered++;

    const cat = state.categoryStats[category];
    if (cat) {
      cat.total++;
      if (correct) cat.correct++;
    }

    if (correct) {
      state.totalCorrect++;
      state.currentStreak++;
      if (state.currentStreak > state.longestStreak) {
        state.longestStreak = state.currentStreak;
      }
    } else {
      state.currentStreak = 0;
    }

    // XP for correct answers
    let xpGained = 0;
    if (correct) {
      const diffKey = difficulty <= 1 ? 'correct_easy' : (difficulty === 2 ? 'correct_medium' : 'correct_hard');
      xpGained += XP_REWARDS[diffKey] || 10;

      // Streak bonuses
      if (state.currentStreak === 5)  xpGained += XP_REWARDS.streak_bonus_5;
      if (state.currentStreak === 10) xpGained += XP_REWARDS.streak_bonus_10;
    }

    logActivity();
    save();

    const newBadges = checkBadges();
    return { xpGained, newBadges };
  }

  function recordBattleWon(demonType) {
    state.battlesWon++;
    state.totalBattles++;
    state.demonsDefeated++;
    const xp = XP_REWARDS.demon_defeated;
    state.xp += xp;
    const lvl = checkLevelUp();
    save();
    const newBadges = checkBadges();
    return { xpGained: xp, leveledUp: lvl.leveledUp, newBadges };
  }

  function recordBossBattleWon() {
    state.bossDefeated = true;
    state.battlesWon++;
    state.totalBattles++;
    const xp = XP_REWARDS.boss_defeated;
    state.xp += xp;
    const lvl = checkLevelUp();
    save();
    const newBadges = checkBadges();
    return { xpGained: xp, leveledUp: lvl.leveledUp, newBadges };
  }

  function recordAdventureLevel(levelNum, stars) {
    if (!state.adventureProgress.defeatedDemons.includes(levelNum)) {
      state.adventureProgress.defeatedDemons.push(levelNum);
    }
    state.adventureProgress.levelStars[levelNum] = Math.max(
      state.adventureProgress.levelStars[levelNum] || 0,
      stars || 3
    );
    state.adventureProgress.currentLevel = Math.max(
      state.adventureProgress.currentLevel,
      levelNum
    );
    save();
    return checkBadges();
  }

  function recordDailyChallenge(score, total, perfect) {
    const today = new Date().toDateString();
    state.dailyChallenge = { date: today, completed: true, score, total, perfect };
    let xp = XP_REWARDS.daily_complete;
    if (perfect) xp += XP_REWARDS.daily_perfect - XP_REWARDS.daily_complete;
    state.xp += xp;
    const lvl = checkLevelUp();
    save();
    const newBadges = checkBadges();
    return { xpGained: xp, leveledUp: lvl.leveledUp, newBadges };
  }

  function isDailyDone() {
    if (!state.dailyChallenge.completed) return false;
    return state.dailyChallenge.date === new Date().toDateString();
  }

  // ---- Badge system ----

  function checkBadges() {
    if (!state) return [];
    const newBadges = [];

    const badgeDefs = [
      { id: 'first_battle',       check: () => state.battlesWon >= 1 },
      { id: 'multiplication_novice', check: () => (state.categoryStats.multiplication?.correct || 0) >= 10 },
      { id: 'multiplication_master', check: () => (state.categoryStats.multiplication?.correct || 0) >= 50 },
      { id: 'division_defender',  check: () => (state.categoryStats.division?.correct || 0) >= 25 },
      { id: 'fraction_fighter',   check: () => (state.categoryStats.fractions?.correct || 0) >= 25 },
      { id: 'geometry_guardian',  check: () => (state.categoryStats.geometry?.correct || 0) >= 20 },
      { id: 'streak_5',           check: () => state.longestStreak >= 5 },
      { id: 'streak_10',          check: () => state.longestStreak >= 10 },
      { id: 'perfect_daily',      check: () => state.dailyChallenge.perfect },
      { id: 'boss_slayer',        check: () => state.bossDefeated },
      { id: 'level_5',            check: () => state.level >= 5 },
      { id: 'level_10',           check: () => state.level >= 10 },
      { id: 'time_master',        check: () => (state.categoryStats.time?.correct || 0) >= 20 },
      { id: 'pattern_pro',        check: () => (state.categoryStats.patterns?.correct || 0) >= 20 },
      { id: 'place_value_pro',    check: () => (state.categoryStats.placeValue?.correct || 0) >= 20 },
      { id: 'adventurer',         check: () => (state.adventureProgress.defeatedDemons?.length || 0) >= 1 },
      { id: 'demon_hunter',       check: () => state.demonsDefeated >= 5 },
      { id: 'accuracy_90',        check: () => {
          const acc = getAccuracy();
          return acc >= 90 && state.totalAnswered >= 30;
        }
      }
    ];

    for (const def of badgeDefs) {
      if (!state.badges.includes(def.id) && def.check()) {
        state.badges.push(def.id);
        newBadges.push(def.id);
      }
    }

    if (newBadges.length > 0) save();
    return newBadges;
  }

  // ---- Stats helpers ----

  function getAccuracy() {
    if (!state || state.totalAnswered === 0) return 0;
    return Math.round((state.totalCorrect / state.totalAnswered) * 100);
  }

  function getCategoryAccuracy(cat) {
    const c = state?.categoryStats[cat];
    if (!c || c.total === 0) return 0;
    return Math.round((c.correct / c.total) * 100);
  }

  function getWeakestCategories(n) {
    if (!state) return [];
    return Object.entries(state.categoryStats)
      .filter(([, v]) => v.total >= 5)
      .sort(([, a], [, b]) => (a.correct / a.total) - (b.correct / b.total))
      .slice(0, n)
      .map(([k]) => k);
  }

  function getRecommendedDifficulty(category) {
    const acc = getCategoryAccuracy(category);
    if (acc < 60) return 1;
    if (acc < 80) return 2;
    return 3;
  }

  function updateSettings(newSettings) {
    state.settings = { ...state.settings, ...newSettings };
    save();
  }

  // ---- Public API ----
  return {
    load,
    save,
    reset,
    getState,
    addXP,
    getLevelProgress,
    getLevelTitle,
    getXPForCurrentLevel,
    getXPForLevel,
    recordAnswer,
    recordBattleWon,
    recordBossBattleWon,
    recordAdventureLevel,
    recordDailyChallenge,
    isDailyDone,
    checkBadges,
    getAccuracy,
    getCategoryAccuracy,
    getWeakestCategories,
    getRecommendedDifficulty,
    updateSettings,
    logActivity,
    XP_REWARDS,
    LEVEL_TITLES
  };
})();
