/* ============================================
   MiaMath - Math Engine
   Dynamically generates PA 3rd Grade math questions
   All categories aligned with PA Academic Standards
   ============================================ */

const MathEngine = (() => {

  // ---- Utility helpers ----

  function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function makeChoices(correct, decoys) {
    const choices = shuffle([correct, ...decoys.slice(0, 3)]);
    return choices;
  }

  function nearbyNumbers(n, count, range) {
    const result = new Set();
    while (result.size < count) {
      const delta = rand(-range, range);
      const candidate = n + delta;
      if (candidate !== n && candidate > 0) result.add(candidate);
    }
    return [...result];
  }

  // ---- Multiplication ----

  function genMultiplication(difficulty) {
    let a, b;
    if (difficulty === 1) {
      const easyMultipliers = [1, 2, 3, 5, 10];
      a = rand(1, 10);
      b = easyMultipliers[rand(0, easyMultipliers.length - 1)];
    } else if (difficulty === 2) {
      const tables = [3, 4, 6, 7, 8];
      a = rand(2, 12);
      b = tables[rand(0, tables.length - 1)];
    } else {
      a = rand(6, 12);
      b = rand(6, 12);
    }
    const answer = a * b;
    const isWordProblem = rand(0, 2) === 0;
    const wordTemplates = [
      `Mia has ${a} bags with ${b} crystals each. How many crystals total?`,
      `There are ${a} demon armies with ${b} soldiers each. How many soldiers?`,
      `Mia earns ${b} XP for each of ${a} battles she wins. How much XP total?`,
      `${a} K-pop albums have ${b} songs each. How many songs in all?`,
      `Mia needs to defeat ${a} demon groups. Each group has ${b} demons. How many demons?`
    ];
    const text = isWordProblem
      ? wordTemplates[rand(0, wordTemplates.length - 1)]
      : `What is ${a} × ${b}?`;

    const decoys = nearbyNumbers(answer, 3, Math.max(3, Math.round(answer * 0.2)));
    decoys.push(a + b); // common mistake

    return {
      text,
      answer,
      choices: makeChoices(answer, decoys),
      category: 'multiplication',
      difficulty,
      isWordProblem,
      hint: `💡 ${a} × ${b}: Try counting by ${Math.min(a,b)}s, ${Math.min(a,b)} times. Or break it up: ${a}×${Math.floor(b/2)}=${a*Math.floor(b/2)}, then add ${a}×${b-Math.floor(b/2)}=${a*(b-Math.floor(b/2))}. Answer: ${answer}!`,
      type: 'multiple-choice'
    };
  }

  // ---- Division ----

  function genDivision(difficulty) {
    let divisor, quotient;
    if (difficulty === 1) {
      divisor = [2, 5, 10][rand(0, 2)];
      quotient = rand(1, 10);
    } else if (difficulty === 2) {
      divisor = [3, 4, 6, 7][rand(0, 3)];
      quotient = rand(2, 10);
    } else {
      divisor = [8, 9, 11, 12][rand(0, 3)];
      quotient = rand(3, 12);
    }
    const dividend = divisor * quotient;
    const isWordProblem = rand(0, 2) === 0;
    const wordTemplates = [
      `Mia has ${dividend} crystals to share equally among ${divisor} pouches. How many per pouch?`,
      `${dividend} demon cards are split into groups of ${divisor}. How many groups?`,
      `${dividend} XP points are divided equally among ${divisor} battles. How much XP per battle?`,
      `${dividend} K-pop stickers are shared equally by ${divisor} friends. How many stickers each?`
    ];
    const text = isWordProblem
      ? wordTemplates[rand(0, wordTemplates.length - 1)]
      : `What is ${dividend} ÷ ${divisor}?`;

    const decoys = nearbyNumbers(quotient, 3, 3);
    decoys.push(quotient + divisor);

    return {
      text,
      answer: quotient,
      choices: makeChoices(quotient, decoys),
      category: 'division',
      difficulty,
      isWordProblem,
      hint: `💡 Think: ${divisor} × ? = ${dividend}. Count by ${divisor}s until you reach ${dividend}. That's ${quotient} steps! ✨`,
      type: 'multiple-choice'
    };
  }

  // ---- Fractions ----

  function genFractions(difficulty) {
    if (difficulty === 1) {
      // Identify half, third, quarter
      const fracs = [
        { q: 'Which shows HALF of a shape?', a: '1/2', wrong: ['1/3', '1/4', '2/3'], hint: '💡 Half means split into 2 equal parts. 1 out of 2 = one half = 1/2! 🍕' },
        { q: 'What fraction means one out of four equal parts?', a: '1/4', wrong: ['1/2', '2/4', '3/4'], hint: '💡 One out of FOUR equal parts = 1/4. Like cutting a pizza into 4 slices and taking 1! 🍕' },
        { q: 'Which fraction is the SAME as 2/4?', a: '1/2', wrong: ['1/4', '3/4', '2/3'], hint: '💡 2/4 = 2 out of 4. If you simplify (divide by 2): 2÷2=1, 4÷2=2, so 2/4 = 1/2! ✨' },
        { q: 'Is 1/3 bigger or smaller than 1/2?', a: 'Smaller', wrong: ['Bigger', 'The same', 'Impossible to tell'], hint: '💡 If you cut something into MORE pieces, each piece is SMALLER. 1/3 < 1/2! 📦' }
      ];
      const q = fracs[rand(0, fracs.length - 1)];
      return {
        text: q.q, answer: q.a,
        choices: shuffle([q.a, ...q.wrong]),
        category: 'fractions', difficulty,
        hint: q.hint, type: 'multiple-choice-text'
      };
    } else if (difficulty === 2) {
      // Equivalent fractions and basic ops
      const pairs = [
        { a: '1/2', eq: '2/4', other: ['3/4', '1/3', '4/6'] },
        { a: '1/3', eq: '2/6', other: ['1/2', '3/9', '2/9'] },
        { a: '2/3', eq: '4/6', other: ['1/3', '3/6', '5/6'] },
        { a: '3/4', eq: '6/8', other: ['1/4', '4/8', '5/8'] },
        { a: '1/2', eq: '3/6', other: ['2/6', '4/6', '1/3'] }
      ];
      const p = pairs[rand(0, pairs.length - 1)];
      const useEq = rand(0, 1) === 0;
      const answer = useEq ? p.eq : p.a;
      const question = `Which fraction is EQUAL to ${useEq ? p.a : p.eq}?`;
      return {
        text: question,
        answer,
        choices: shuffle([answer, ...p.other.slice(0, 3)]),
        category: 'fractions', difficulty,
        hint: `💡 To find equivalent fractions, multiply or divide BOTH top and bottom by the same number! ${p.a} = ${p.eq} because you multiply or divide both by the right number! 🔢`,
        type: 'multiple-choice-text'
      };
    } else {
      // Compare and order fractions
      const comps = [
        { q: 'Which is bigger: 3/4 or 2/3?', a: '3/4', wrong: ['2/3', 'They\'re equal', 'Can\'t tell'], hint: '💡 To compare: 3/4 = 9/12 and 2/3 = 8/12. So 3/4 > 2/3! 🧮' },
        { q: 'Order from SMALLEST to LARGEST: 1/2, 1/4, 3/4', a: '1/4, 1/2, 3/4', wrong: ['1/2, 1/4, 3/4', '3/4, 1/2, 1/4', '1/4, 3/4, 1/2'], hint: '💡 Bigger denominator = smaller pieces. 1/4 is smallest, then 1/2 = 2/4, then 3/4! 📊' },
        { q: 'Mia ate 5/8 of her candy. What fraction is LEFT?', a: '3/8', wrong: ['5/8', '2/8', '4/8'], hint: '💡 Whole = 8/8. Eaten = 5/8. Left = 8/8 - 5/8 = 3/8! 🍬' }
      ];
      const c = comps[rand(0, comps.length - 1)];
      return {
        text: c.q, answer: c.a,
        choices: shuffle([c.a, ...c.wrong]),
        category: 'fractions', difficulty,
        hint: c.hint, type: 'multiple-choice-text'
      };
    }
  }

  // ---- Place Value ----

  function genPlaceValue(difficulty) {
    if (difficulty === 1) {
      // Identify place value digits (hundreds)
      const num = rand(100, 999);
      const places = ['ones', 'tens', 'hundreds'];
      const place = places[rand(0, 2)];
      const digits = { ones: num % 10, tens: Math.floor(num / 10) % 10, hundreds: Math.floor(num / 100) };
      const answer = digits[place];
      const decoys = nearbyNumbers(answer, 3, 4).map(n => Math.max(0, Math.min(9, n)));
      return {
        text: `What digit is in the ${place} place in ${num}?`,
        answer,
        choices: makeChoices(answer, [...new Set(decoys.filter(d => d !== answer))]),
        category: 'placeValue', difficulty,
        hint: `💡 In ${num}: H=${digits.hundreds}, T=${digits.tens}, O=${digits.ones}. The ${place} digit is ${answer}! 🔢`,
        type: 'multiple-choice'
      };
    } else if (difficulty === 2) {
      // 4-digit numbers
      const types = ['value', 'expanded', 'compare'];
      const t = types[rand(0, 2)];
      if (t === 'value') {
        const num = rand(1000, 9999);
        const placeNames = ['ones', 'tens', 'hundreds', 'thousands'];
        const place = placeNames[rand(0, 3)];
        const multipliers = { ones: 1, tens: 10, hundreds: 100, thousands: 1000 };
        const digit = Math.floor(num / multipliers[place]) % 10;
        const answer = digit * multipliers[place];
        const decoys = [digit * multipliers[place] + multipliers[place],
                        digit * multipliers[place] - multipliers[place],
                        (digit + 1) * multipliers[place]].filter(d => d > 0);
        return {
          text: `What is the VALUE of the ${place} digit in ${num.toLocaleString()}?`,
          answer,
          choices: makeChoices(answer, decoys),
          category: 'placeValue', difficulty,
          hint: `💡 In ${num.toLocaleString()}, the ${place} digit is ${digit}. Its value = ${digit} × ${multipliers[place]} = ${answer}! 🌟`,
          type: 'multiple-choice'
        };
      } else if (t === 'expanded') {
        const th = rand(1, 9); const h = rand(0, 9); const te = rand(0, 9); const o = rand(0, 9);
        const num = th * 1000 + h * 100 + te * 10 + o;
        return {
          text: `What is ${th},000 + ${h * 100} + ${te * 10} + ${o}?`,
          answer: num,
          choices: makeChoices(num, nearbyNumbers(num, 3, 100)),
          category: 'placeValue', difficulty,
          hint: `💡 Just add them: ${th},000 + ${h * 100} + ${te * 10} + ${o} = ${num.toLocaleString()}! ✨`,
          type: 'multiple-choice'
        };
      } else {
        const a = rand(1000, 9999); const b = rand(1000, 9999);
        const bigger = Math.max(a, b);
        const strA = a.toLocaleString(); const strB = b.toLocaleString();
        return {
          text: `Which is GREATER: ${strA} or ${strB}?`,
          answer: bigger.toLocaleString(),
          choices: [strA, strB, 'They are equal', 'Can\'t tell'],
          category: 'placeValue', difficulty,
          hint: `💡 Compare digit by digit from left to right! ${strA} vs ${strB} - find the first place they differ! 🔍`,
          type: 'multiple-choice-text'
        };
      }
    } else {
      // Round to nearest 10/100
      const num = rand(100, 9999);
      const roundTo = [10, 100, 1000][rand(0, 2)];
      const answer = Math.round(num / roundTo) * roundTo;
      const decoys = [answer + roundTo, answer - roundTo, Math.floor(num / roundTo) * roundTo].filter(d => d > 0);
      return {
        text: `Round ${num.toLocaleString()} to the nearest ${roundTo.toLocaleString()}.`,
        answer,
        choices: makeChoices(answer, decoys),
        category: 'placeValue', difficulty,
        hint: `💡 Find the ${roundTo === 10 ? 'ones' : roundTo === 100 ? 'tens' : 'hundreds'} digit. If it's 5 or more, round UP. If less than 5, round DOWN. ${num} → ${answer}! 🎯`,
        type: 'multiple-choice'
      };
    }
  }

  // ---- Addition ----

  function genAddition(difficulty) {
    let a, b;
    if (difficulty === 1) { a = rand(10, 99); b = rand(10, 99); }
    else if (difficulty === 2) { a = rand(100, 999); b = rand(100, 999); }
    else { a = rand(1000, 4999); b = rand(1000, 4999); }
    const answer = a + b;
    const isWordProblem = rand(0, 1) === 0;
    const wordTemplates = [
      `Mia earned ${a.toLocaleString()} XP on Monday and ${b.toLocaleString()} XP on Tuesday. How much XP total?`,
      `There are ${a.toLocaleString()} fans at Mia's concert and ${b.toLocaleString()} more arrive. How many fans are there now?`,
      `Mia collected ${a.toLocaleString()} magic crystals and ${b.toLocaleString()} more. How many total?`
    ];
    const text = isWordProblem
      ? wordTemplates[rand(0, wordTemplates.length - 1)]
      : `What is ${a.toLocaleString()} + ${b.toLocaleString()}?`;
    const decoys = nearbyNumbers(answer, 3, Math.max(10, Math.round(answer * 0.05)));
    return {
      text, answer,
      choices: makeChoices(answer, decoys),
      category: 'addition', difficulty, isWordProblem,
      hint: `💡 Add column by column right to left! Don't forget to carry when a column adds up to 10 or more! ${a} + ${b} = ${answer}! 💪`,
      type: 'multiple-choice'
    };
  }

  // ---- Subtraction ----

  function genSubtraction(difficulty) {
    let a, b;
    if (difficulty === 1) { a = rand(20, 99); b = rand(10, a - 5); }
    else if (difficulty === 2) { a = rand(200, 999); b = rand(100, a - 50); }
    else { a = rand(1000, 5000); b = rand(500, a - 200); }
    const answer = a - b;
    const isWordProblem = rand(0, 1) === 0;
    const wordTemplates = [
      `The demon had ${a.toLocaleString()} HP. Mia dealt ${b.toLocaleString()} damage. How much HP is left?`,
      `Mia had ${a.toLocaleString()} XP but used ${b.toLocaleString()} for a special power. How much XP remains?`,
      `There were ${a.toLocaleString()} crystals. Mia used ${b.toLocaleString()}. How many are left?`
    ];
    const text = isWordProblem
      ? wordTemplates[rand(0, wordTemplates.length - 1)]
      : `What is ${a.toLocaleString()} - ${b.toLocaleString()}?`;
    const decoys = nearbyNumbers(answer, 3, Math.max(10, Math.round(answer * 0.05)));
    return {
      text, answer,
      choices: makeChoices(answer, decoys),
      category: 'subtraction', difficulty, isWordProblem,
      hint: `💡 Subtract column by column right to left. Borrow when needed! ${a} - ${b} = ${answer}! ⚔️`,
      type: 'multiple-choice'
    };
  }

  // ---- Time & Measurement ----

  function genTime(difficulty) {
    if (difficulty === 1) {
      const questions = [
        { q: 'How many minutes are in 1 hour?', a: 60, wrong: [30, 45, 100], hint: '💡 There are always 60 minutes in 1 hour! ⏰' },
        { q: 'How many seconds are in 1 minute?', a: 60, wrong: [30, 100, 120], hint: '💡 60 seconds = 1 minute. Count: 1, 2, 3... all the way to 60! ⏱️' },
        { q: 'How many days are in 1 week?', a: 7, wrong: [5, 6, 8], hint: '💡 7 days in a week: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday! 📅' },
        { q: 'How many months are in 1 year?', a: 12, wrong: [10, 11, 13], hint: '💡 12 months: Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec! 📆' },
        { q: 'How many days are in 2 weeks?', a: 14, wrong: [10, 12, 21], hint: '💡 1 week = 7 days. 2 weeks = 7 × 2 = 14 days! 🗓️' }
      ];
      const q = questions[rand(0, questions.length - 1)];
      return { ...q, choices: makeChoices(q.a, q.wrong), category: 'time', difficulty, type: 'multiple-choice' };
    } else if (difficulty === 2) {
      // Elapsed time
      const startH = rand(8, 15);
      const startM = [0, 15, 30, 45][rand(0, 3)];
      const duration = [15, 20, 30, 45, 60][rand(0, 4)];
      let endH = startH;
      let endM = startM + duration;
      if (endM >= 60) { endH++; endM -= 60; }
      const startStr = `${startH}:${startM.toString().padStart(2, '0')} ${startH < 12 ? 'AM' : 'PM'}`;
      const endStr   = `${endH}:${endM.toString().padStart(2, '0')} ${endH < 12 ? 'AM' : 'PM'}`;
      const isElapsed = rand(0, 1) === 0;

      if (isElapsed) {
        return {
          text: `School starts at ${startStr} and ends at ${endStr}. How many minutes long?`,
          answer: duration,
          choices: makeChoices(duration, [duration - 15, duration + 15, duration + 30].filter(d => d > 0)),
          category: 'time', difficulty,
          hint: `💡 Count from ${startStr} to ${endStr}. Count by 15s or 30s! Total: ${duration} minutes! ⏰`,
          type: 'multiple-choice'
        };
      } else {
        return {
          text: `Mia's concert starts at ${startStr} and lasts ${duration} minutes. When does it end?`,
          answer: endStr,
          choices: shuffle([endStr,
            `${endH}:${(endM + 15).toString().padStart(2, '0')} ${endH < 12 ? 'AM' : 'PM'}`,
            `${endH - 1}:${endM.toString().padStart(2, '0')} ${startH < 12 ? 'AM' : 'PM'}`,
            `${endH}:${Math.max(0, endM - 15).toString().padStart(2, '0')} ${endH < 12 ? 'AM' : 'PM'}`]),
          category: 'time', difficulty,
          hint: `💡 Start at ${startStr}, count forward ${duration} minutes. ${duration} minutes = ${Math.floor(duration/60)} hour(s) and ${duration % 60} min! Answer: ${endStr}! 🎵`,
          type: 'multiple-choice-text'
        };
      }
    } else {
      // Word problems with multiple steps
      const hrs = rand(1, 5);
      const mins = [15, 20, 30, 45][rand(0, 3)];
      const totalMins = hrs * 60 + mins;
      const questions = [
        {
          q: `Mia practiced math for ${hrs} hour${hrs>1?'s':''} and ${mins} minutes. How many minutes total?`,
          a: totalMins,
          wrong: [hrs * 60, hrs + mins, hrs * 60 + 30],
          hint: `💡 ${hrs} hour${hrs>1?'s':''} = ${hrs} × 60 = ${hrs*60} minutes. Add ${mins} more: ${hrs*60} + ${mins} = ${totalMins} minutes! ⏱️`
        },
        {
          q: `If a math game takes 2 hours and 15 minutes, how many minutes is that?`,
          a: 135, wrong: [120, 215, 125],
          hint: '💡 2 hours = 2 × 60 = 120 minutes. Add 15 = 135 minutes! ⏰'
        }
      ];
      const q = questions[rand(0, questions.length - 1)];
      return { ...q, choices: makeChoices(q.a, q.wrong), category: 'time', difficulty, type: 'multiple-choice', isWordProblem: true };
    }
  }

  // ---- Geometry (Area & Perimeter) ----

  function genGeometry(difficulty) {
    if (difficulty <= 2) {
      const isArea = rand(0, 1) === 0;
      const l = rand(2, 12);
      const w = rand(2, l);
      const isSquare = rand(0, 2) === 0;
      const side = rand(2, 10);

      if (isSquare && !isArea) {
        const p = side * 4;
        return {
          text: `A square has sides of ${side} cm. What is the PERIMETER?`,
          answer: p,
          choices: makeChoices(p, [side * 3, side * 2, p + side]),
          category: 'geometry', difficulty,
          hint: `💡 A square has 4 equal sides. Perimeter = 4 × side = 4 × ${side} = ${p} cm! 🔷`,
          type: 'multiple-choice'
        };
      } else if (isArea) {
        const shape = isSquare ? 'square' : 'rectangle';
        const sl = isSquare ? side : l;
        const sw = isSquare ? side : w;
        const area = sl * sw;
        const context = rand(0,1) === 0;
        const contextTexts = [
          `Mia's dance stage is a ${shape} ${sl} m × ${sw} m. What is the AREA?`,
          `A rectangle is ${sl} units long and ${sw} units wide. What is the AREA?`,
          `Find the area of a ${shape} with length ${sl} and width ${sw}.`
        ];
        return {
          text: contextTexts[rand(0, contextTexts.length - 1)],
          answer: area,
          choices: makeChoices(area, [sl + sw, sl * 2 + sw * 2, area + sl]),
          category: 'geometry', difficulty,
          hint: `💡 Area = length × width = ${sl} × ${sw} = ${area} square units! 📐`,
          type: 'multiple-choice'
        };
      } else {
        const p = (l + w) * 2;
        return {
          text: `A rectangle is ${l} units long and ${w} units wide. What is the PERIMETER?`,
          answer: p,
          choices: makeChoices(p, [l * w, l + w, p + 2]),
          category: 'geometry', difficulty,
          hint: `💡 Perimeter = 2 × length + 2 × width = 2×${l} + 2×${w} = ${2*l} + ${2*w} = ${p} units! 📏`,
          type: 'multiple-choice'
        };
      }
    } else {
      // Multi-step word problems
      const l = rand(4, 15); const w = rand(3, l);
      const area = l * w; const p = (l + w) * 2;
      const isArea = rand(0, 1) === 0;
      const ans = isArea ? area : p;
      const word = isArea ? 'AREA' : 'PERIMETER';
      const decoys = isArea ? [p, l + w, area + l] : [area, l * 4, p + 4];
      return {
        text: `Mia's K-pop stage is ${l} meters long and ${w} meters wide. What is the ${word} of the stage?`,
        answer: ans,
        choices: makeChoices(ans, decoys),
        category: 'geometry', difficulty, isWordProblem: true,
        hint: isArea
          ? `💡 Area = ${l} × ${w} = ${area} square meters! Perfect K-pop stage! 🎵`
          : `💡 Perimeter = 2×${l} + 2×${w} = ${2*l} + ${2*w} = ${p} meters! 🎤`,
        type: 'multiple-choice'
      };
    }
  }

  // ---- Patterns ----

  function genPatterns(difficulty) {
    if (difficulty === 1) {
      // Simple skip counting
      const step = [2, 3, 5, 10][rand(0, 3)];
      const start = rand(0, 10) * step;
      const seq = [start, start + step, start + step*2, start + step*3, start + step*4];
      const answer = start + step * 5;
      return {
        text: `What comes next?\n${seq.join(', ')}, ___`,
        answer,
        choices: makeChoices(answer, [answer + step, answer - step, answer + 2*step]),
        category: 'patterns', difficulty,
        hint: `💡 Each number increases by ${step}! ${seq[seq.length-1]} + ${step} = ${answer}! 🎵`,
        type: 'multiple-choice'
      };
    } else if (difficulty === 2) {
      const ruleTypes = ['add', 'subtract', 'multiply'];
      const ruleType = ruleTypes[rand(0, ruleTypes.length - 1)];
      let seq, rule, answer;

      if (ruleType === 'add') {
        const step = rand(4, 15);
        const start = rand(5, 30);
        seq = Array.from({length: 5}, (_, i) => start + i * step);
        answer = seq[4] + step;
        rule = `+${step}`;
      } else if (ruleType === 'subtract') {
        const step = rand(3, 10);
        const start = rand(50, 100);
        seq = Array.from({length: 5}, (_, i) => start - i * step);
        answer = seq[4] - step;
        rule = `-${step}`;
      } else {
        const factor = [2, 3][rand(0, 1)];
        const start = rand(1, 5);
        seq = Array.from({length: 5}, (_, i) => start * Math.pow(factor, i));
        answer = seq[4] * factor;
        rule = `×${factor}`;
      }

      return {
        text: `What comes next?\n${seq.join(', ')}, ___`,
        answer,
        choices: makeChoices(answer, nearbyNumbers(answer, 3, Math.max(5, Math.round(answer * 0.2)))),
        category: 'patterns', difficulty,
        hint: `💡 The rule is ${rule}! Each number is ${rule.startsWith('+') ? 'increased' : rule.startsWith('-') ? 'decreased' : 'multiplied'} by ${rule.slice(1)}! ✨`,
        type: 'multiple-choice'
      };
    } else {
      // Input-output tables
      const ops = [
        { rule: 'n × 3', fn: n => n * 3, hint: 'Multiply each input by 3!' },
        { rule: 'n × 4 + 1', fn: n => n * 4 + 1, hint: 'Multiply by 4, then add 1!' },
        { rule: 'n × 2 + 5', fn: n => n * 2 + 5, hint: 'Multiply by 2, then add 5!' },
        { rule: 'n + n + 2', fn: n => n * 2 + 2, hint: 'Double the input and add 2!' }
      ];
      const op = ops[rand(0, ops.length - 1)];
      const inputs = [1, 2, 3, 4, 5, 6, 7].sort(() => Math.random() - 0.5).slice(0, 4);
      const shown = inputs.slice(0, 3);
      const target = inputs[3];
      const answer = op.fn(target);

      let tableText = 'INPUT → OUTPUT\n';
      shown.forEach(i => { tableText += `  ${i} → ${op.fn(i)}\n`; });
      tableText += `  ${target} → ___`;

      return {
        text: tableText,
        answer,
        choices: makeChoices(answer, nearbyNumbers(answer, 3, Math.max(3, Math.round(answer * 0.2)))),
        category: 'patterns', difficulty,
        hint: `💡 ${op.hint} Input ${target}: ${op.rule.replace('n', target)} = ${answer}! 🔢`,
        type: 'multiple-choice'
      };
    }
  }

  // ---- Main question generator ----

  function generateQuestion(category, difficulty) {
    difficulty = Math.max(1, Math.min(3, difficulty || 2));
    try {
      switch (category) {
        case 'multiplication': return genMultiplication(difficulty);
        case 'division':       return genDivision(difficulty);
        case 'fractions':      return genFractions(difficulty);
        case 'placeValue':     return genPlaceValue(difficulty);
        case 'time':           return genTime(difficulty);
        case 'geometry':       return genGeometry(difficulty);
        case 'patterns':       return genPatterns(difficulty);
        case 'addition':       return genAddition(difficulty);
        case 'subtraction':    return genSubtraction(difficulty);
        default:               return genMultiplication(difficulty);
      }
    } catch (e) {
      console.warn('Question generation error for', category, e);
      return genAddition(1);
    }
  }

  function generateMixed(difficulty) {
    const categories = ['multiplication', 'division', 'fractions', 'placeValue', 'time', 'geometry', 'patterns', 'addition', 'subtraction'];
    return generateQuestion(categories[rand(0, categories.length - 1)], difficulty);
  }

  function checkAnswer(question, userAnswer) {
    const correct = question.answer;
    if (typeof correct === 'number') {
      return parseInt(userAnswer, 10) === correct || parseFloat(userAnswer) === correct;
    }
    return String(userAnswer).trim().toLowerCase() === String(correct).trim().toLowerCase();
  }

  // ---- Public API ----
  return { generateQuestion, generateMixed, checkAnswer, rand, shuffle };
})();
