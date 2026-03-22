let TOTAL_TIME = 15 * 60;

const state = {
  selectedTrainer: 'negative',
  noTimeMode: false,
  musicEnabled: true,
  mode: 'easy',
  running: false,
  finished: false,
  timeLeft: TOTAL_TIME,
  timerId: null,
  current: null,
  score: 0,
  streak: 0,
  answerCount: 0,
  correctCount: 0,
  difficultyStep: 0,
  history: []
};

const els = {
  hubScreen: document.getElementById('hubScreen'),
  settingsScreen: document.getElementById('settingsScreen'),
  quizScreen: document.getElementById('quizScreen'),
  resultsScreen: document.getElementById('resultsScreen'),
  globalTimer: document.getElementById('globalTimer'),
  selectedModeText: document.getElementById('selectedModeText'),
  trainerTitle: document.getElementById('trainerTitle'),
  trainerSubtitle: document.getElementById('trainerSubtitle'),
  modeBadge: document.getElementById('modeBadge'),
  finalModeBadge: document.getElementById('finalModeBadge'),
  levelBadge: document.getElementById('levelBadge'),
  scoreBadge: document.getElementById('scoreBadge'),
  streakBadge: document.getElementById('streakBadge'),
  questionText: document.getElementById('questionText'),
  answerInput: document.getElementById('answerInput'),
  submitBtn: document.getElementById('submitBtn'),
  skipBtn: document.getElementById('skipBtn'),
  endBtn: document.getElementById('endBtn'),
  timeLeftText: document.getElementById('timeLeftText'),
  timeProgress: document.getElementById('timeProgress'),
  difficultyText: document.getElementById('difficultyText'),
  finalScore: document.getElementById('finalScore'),
  finalCorrect: document.getElementById('finalCorrect'),
  finalTotal: document.getElementById('finalTotal'),
  answersList: document.getElementById('answersList'),
  retryBtn: document.getElementById('retryBtn'),
  backHomeBtn: document.getElementById('backHomeBtn'),
  backToHubBtn: document.getElementById('backToHubBtn'),
  startBtn: document.getElementById('startBtn'),
  musicToggle: document.getElementById('musicToggle')
};

const trainerConfig = {
  negative: {
    title: 'Trener liczb ujemnych',
    subtitle: 'Zadania z minusami, nawiasami i znakami obok siebie.'
  },
  multiplication: {
    title: 'Tabliczka mnożenia',
    subtitle: 'Szybkie ćwiczenia z mnożeniem w stylu tabliczki, z rosnącą trudnością.'
  },
  fractions: {
    title: 'Trener ułamków',
    subtitle: 'Działania na ułamkach zwykłych, niewłaściwych i mieszanych.'
  },
  equations: {
    title: 'Trener równań',
    subtitle: 'Rozwiązuj proste równania z jedną niewiadomą x.'
  }
};

const difficultyNames = ['Łatwy', 'Średni', 'Trudny'];

const correctSound = new Audio('./assets/soundEffects/correctAns.mp3');
const wrongSound = new Audio('./assets/soundEffects/wrongAns.mp3');
const backgroundMusic = new Audio('./assets/music/bgMusic.mp3');

correctSound.volume = 0.2;
wrongSound.volume = 1;
backgroundMusic.loop = true;
backgroundMusic.volume = 0.05;

function showScreen(name) {
  [els.hubScreen, els.settingsScreen, els.quizScreen, els.resultsScreen].forEach(el => el.classList.remove('active'));

  if (name === 'hub') els.hubScreen.classList.add('active');
  if (name === 'settings') els.settingsScreen.classList.add('active');
  if (name === 'quiz') els.quizScreen.classList.add('active');
  if (name === 'results') els.resultsScreen.classList.add('active');
}

function openTrainer(id) {
  state.selectedTrainer = id;
  renderTrainerSettings();
  showScreen('settings');
}

function renderTrainerSettings() {
  const cfg = trainerConfig[state.selectedTrainer] || trainerConfig.negative;
  els.trainerTitle.textContent = cfg.title;
  els.trainerSubtitle.textContent = cfg.subtitle;
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[randInt(0, arr.length - 1)];
}

function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b !== 0) {
    [a, b] = [b, a % b];
  }
  return a || 1;
}

function normalizeFraction(n, d) {
  if (d === 0) return null;
  if (d < 0) {
    n = -n;
    d = -d;
  }
  const g = gcd(n, d);
  return { n: n / g, d: d / g };
}

function compareFractions(a, b) {
  return a && b && a.n === b.n && a.d === b.d;
}

function addFractions(a, b) {
  return normalizeFraction(a.n * b.d + b.n * a.d, a.d * b.d);
}

function subFractions(a, b) {
  return normalizeFraction(a.n * b.d - b.n * a.d, a.d * b.d);
}

function mulFractions(a, b) {
  return normalizeFraction(a.n * b.n, a.d * b.d);
}

function divFractions(a, b) {
  return normalizeFraction(a.n * b.d, a.d * b.n);
}

function fractionToDisplay(fr) {
  if (!fr) return '';
  const sign = fr.n < 0 ? '-' : '';
  const absN = Math.abs(fr.n);
  const d = fr.d;
  const whole = Math.floor(absN / d);
  const rem = absN % d;

  if (rem === 0) return `${sign}${whole}`;
  if (whole === 0) return `${sign}${rem}/${d}`;
  return `${sign}${whole} ${rem}/${d}`;
}

function fractionToTex(fr, style = 'proper') {
  if (!fr) return '';

  const sign = fr.n < 0 ? '-' : '';
  const absN = Math.abs(fr.n);
  const d = fr.d;
  const whole = Math.floor(absN / d);
  const rem = absN % d;

  if (rem === 0) return `${sign}${whole}`;

  if (style === 'mixed' && whole > 0) {
    return `${sign}${whole}\\frac{${rem}}{${d}}`;
  }

  return `${sign}\\frac{${absN}}{${d}}`;
}

function formatFractionOperandTex(fr, op, style) {
  const tex = fractionToTex(fr, style);
  const needsParens = tex.startsWith('-') || (tex.includes('\\frac') && style === 'mixed');

  if (op === '×' || op === '÷') {
    return needsParens ? `(${tex})` : tex;
  }

  return tex.startsWith('-') ? `(${tex})` : tex;
}

function parseFractionInput(raw) {
  const text = String(raw).trim().replace(',', '.');

  const mixedMatch = text.match(/^([+-]?\d+)\s+(\d+)\/(\d+)$/);
  if (mixedMatch) {
    const whole = parseInt(mixedMatch[1], 10);
    const num = parseInt(mixedMatch[2], 10);
    const den = parseInt(mixedMatch[3], 10);
    if (den === 0 || num < 0) return null;

    const sign = whole < 0 ? -1 : 1;
    const absWhole = Math.abs(whole);
    return normalizeFraction(sign * (absWhole * den + num), den);
  }

  const fracMatch = text.match(/^([+-]?\d+)\/(\d+)$/);
  if (fracMatch) {
    const n = parseInt(fracMatch[1], 10);
    const d = parseInt(fracMatch[2], 10);
    if (d === 0) return null;
    return normalizeFraction(n, d);
  }

  const intMatch = text.match(/^([+-]?\d+)$/);
  if (intMatch) {
    const n = parseInt(intMatch[1], 10);
    return normalizeFraction(n, 1);
  }

  return null;
}

function makeRandomFraction(style, denom = null) {
  const d = denom ?? randInt(2, 12);
  let n;

  if (style === 'proper') {
    n = randInt(1, d - 1);
  } else if (style === 'improper') {
    n = randInt(d + 1, d * 2);
  } else {
    const whole = randInt(1, 6);
    const rem = randInt(1, d - 1);
    n = whole * d + rem;
  }

  if (Math.random() < 0.5) n = -n;
  return normalizeFraction(n, d);
}

function getFractionDifficultyLabel(level) {
  if (state.mode === 'easy') return 'Ułamki zwykłe';
  if (state.mode === 'medium') return level <= 3 ? 'Ułamki i działania' : 'Ułamki niewłaściwe';
  return level <= 3 ? 'Ułamki mieszane' : 'Ułamki złożone';
}

function makeFractionQuestion(level) {
  const op =
    state.mode === 'easy'
      ? pick(['+', '-'])
      : state.mode === 'medium'
        ? pick(['+', '-', '×'])
        : pick(['+', '-', '×', '÷']);

  const style =
    level <= 2
      ? 'proper'
      : level <= 4
        ? pick(['proper', 'improper'])
        : pick(['proper', 'improper', 'mixed']);

  const sameDen = state.mode === 'easy' && (op === '+' || op === '-');
  const denomA = randInt(2, 12);
  const denomB = sameDen ? denomA : randInt(2, 12);

  const a = makeRandomFraction(style, denomA);
  const b = makeRandomFraction(style, denomB);

  let answer;
  if (op === '+') answer = addFractions(a, b);
  if (op === '-') answer = subFractions(a, b);
  if (op === '×') answer = mulFractions(a, b);
  if (op === '÷') answer = divFractions(a, b);

  return {
    expr: `\\(${formatFractionOperandTex(a, op, style)} ${op} ${formatFractionOperandTex(b, op, style)}\\)`,
    answer
  };
}

function getMultiplicationLimit(level) {
  if (state.mode === 'easy') {
    if (level <= 2) return 5;
    if (level <= 4) return 7;
    return 10;
  }

  if (state.mode === 'medium') {
    if (level <= 2) return 7;
    if (level <= 4) return 10;
    return 15;
  }

  return 20;
}

function makeMultiplicationExpression(limit) {
  const a = randInt(1, limit);
  const b = randInt(1, limit);
  return {
    expr: `${a} × ${b}`,
    answer: a * b
  };
}

function getDifficultyLabel(level) {
  if (state.selectedTrainer === 'multiplication') {
    const limit = getMultiplicationLimit(level);
    return `Tabliczka do ${limit}`;
  }

  if (state.mode === 'hard') return 'Trudny';
  if (state.mode === 'medium') return level >= 4 ? 'Trudny' : 'Średni';
  return level >= 3 ? 'Średni' : 'Łatwy';
}

function calculateLevel() {
  const base = state.mode === 'easy' ? 1 : state.mode === 'medium' ? 2 : 3;
  return Math.min(6, base + Math.floor(state.correctCount / 4) + Math.floor(state.streak / 3));
}

function randomOperand(limit) {
  const n = randInt(-limit, limit);
  return n === 0 ? limit : n;
}

function wrapIfNegative(value) {
  const text = String(value).trim();

  if (/^\(+\s*-\d+\s*\)+$/.test(text)) {
    const num = text.match(/-?\d+/)?.[0];
    return num ? `(${num})` : text;
  }

  if (/^\(-?\d+\)$/.test(text)) {
    return text;
  }

  if (text.startsWith('-')) {
    return `(${text})`;
  }

  return text;
}

function rawValue(value) {
  return String(value).trim();
}

function formatBinaryExpression(a, op, b) {
  return `${wrapIfNegative(a)} ${op} ${wrapIfNegative(b)}`;
}

function makeSimpleExpression(limit) {
  const a = randomOperand(limit);
  const b = randomOperand(limit);
  const op = pick(['+', '-']);
  const expr = formatBinaryExpression(a, op, b);
  return { expr, answer: op === '+' ? a + b : a - b };
}

function makeParenExpression(limit) {
  const a = randomOperand(limit);
  const b = randomOperand(limit);
  const c = randomOperand(limit);
  const style = pick(['aOpParen', 'parenOpC', 'mix']);

  if (style === 'aOpParen') {
    const op1 = pick(['+', '-']);
    const op2 = pick(['+', '-']);
    const inside = formatBinaryExpression(b, op2, c);
    return {
      expr: `${wrapIfNegative(a)} ${op1} (${inside})`,
      answer: op1 === '+' ? a + (op2 === '+' ? b + c : b - c) : a - (op2 === '+' ? b + c : b - c)
    };
  }

  if (style === 'parenOpC') {
    const op1 = pick(['+', '-']);
    const op2 = pick(['+', '-']);
    const inside = formatBinaryExpression(a, op1, b);
    return {
      expr: `(${inside}) ${op2} ${wrapIfNegative(c)}`,
      answer: (op1 === '+' ? a + b : a - b) + (op2 === '+' ? c : -c)
    };
  }

  const op1 = pick(['+', '-']);
  const op2 = pick(['+', '-']);
  const left = `${wrapIfNegative(a)} ${op1} (${rawValue(b)})`;
  return {
    expr: `${left} ${op2} ${wrapIfNegative(c)}`,
    answer: (op1 === '+' ? a + b : a - b) + (op2 === '+' ? c : -c)
  };
}

function makeAdvancedExpression(limit) {
  const a = randomOperand(limit);
  const b = randomOperand(limit);
  const c = randomOperand(limit);
  const d = randomOperand(limit);
  const pattern = pick(['negInside', 'doubleMinus', 'mixedParen']);

  if (pattern === 'negInside') {
    const outerOp = pick(['+', '-']);
    const innerOp = pick(['+', '-']);
    const tailOp = pick(['+', '-']);
    const innerValue = innerOp === '+' ? b + c : b - c;
    const tailValue = tailOp === '+' ? d : -d;
    const expr = `${wrapIfNegative(a)} ${outerOp} (${formatBinaryExpression(b, innerOp, c)}) ${tailOp} ${wrapIfNegative(d)}`;
    const left = outerOp === '+' ? a + innerValue : a - innerValue;
    return { expr, answer: left + tailValue };
  }

  if (pattern === 'doubleMinus') {
    const tailOp = pick(['+', '-']);
    const tailValue = tailOp === '+' ? d : -d;
    const expr = `${wrapIfNegative(a)} - (${rawValue(b)} - ${rawValue(c)}) ${tailOp} ${wrapIfNegative(d)}`;
    return { expr, answer: a - (b - c) + tailValue };
  }

  const op1 = pick(['+', '-']);
  const op2 = pick(['+', '-']);
  const op3 = pick(['+', '-']);
  const expr = `(${formatBinaryExpression(a, op1, b)}) ${op2} (${formatBinaryExpression(c, op3, d)})`;
  const left = op1 === '+' ? a + b : a - b;
  const right = op3 === '+' ? c + d : c - d;
  const ans = op2 === '+' ? left + right : left - right;
  return { expr, answer: ans };
}

function getEquationDifficultyLabel(level) {
  if (state.mode === 'easy') {
    return level <= 2 ? 'Równania proste' : 'Równania z 2 krokami';
  }

  if (state.mode === 'medium') {
    return level <= 2 ? 'Równania z nawiasem' : 'Równania 2-krokowe';
  }

  return level <= 2 ? 'Równania trudniejsze' : 'Równania mieszane';
}

function eqTerm(n) {
  return n < 0 ? `(${n})` : `${n}`;
}

function makeEquationQuestion(level) {
  const pattern = pick(['add', 'sub', 'mul', 'div', 'mulAdd', 'mulSub']);

  let expr = '';
  let answer = 0;

  if (pattern === 'add') {
    const xValue = randInt(-12, 12) || 5;
    const a = randInt(1, 20);
    expr = `x + ${eqTerm(a)} = ${xValue + a}`;
    answer = xValue;
  } else if (pattern === 'sub') {
    const xValue = randInt(-12, 12) || 5;
    const a = randInt(1, 20);
    expr = `x - ${eqTerm(a)} = ${xValue - a}`;
    answer = xValue;
  } else if (pattern === 'mul') {
    const xValue = randInt(-12, 12) || 5;
    const a = randInt(2, 12);
    expr = `${a}x = ${a * xValue}`;
    answer = xValue;
  } else if (pattern === 'div') {
    const rhs = randInt(-12, 12) || 4;
    const a = randInt(2, 12);
    expr = `x ÷ ${a} = ${rhs}`;
    answer = rhs * a;
  } else if (pattern === 'mulAdd') {
    const xValue = randInt(-12, 12) || 5;
    const a = randInt(2, 9);
    const b = randInt(-10, 10);
    expr = `${a}x + ${eqTerm(b)} = ${a * xValue + b}`;
    answer = xValue;
  } else {
    const xValue = randInt(-12, 12) || 5;
    const a = randInt(2, 9);
    const b = randInt(-10, 10);
    expr = `${a}x - ${eqTerm(b)} = ${a * xValue - b}`;
    answer = xValue;
  }

  return {
    expr: `\\(${expr}\\)`,
    answer
  };
}

function fitQuestionText() {
  const el = els.questionText;
  const wrap = el.closest('.question-wrap');
  if (!wrap) return;

  el.style.fontSize = '64px';
  el.style.whiteSpace = 'nowrap';

  const maxWidth = wrap.clientWidth - 32;
  let fontSize = 64;

  while (el.scrollWidth > maxWidth && fontSize > 24) {
    fontSize -= 2;
    el.style.fontSize = fontSize + 'px';
  }
}

function updateMusicButton() {
  if (!els.musicToggle) return;
  els.musicToggle.textContent = state.musicEnabled ? '🔊' : '🔇';
  els.musicToggle.title = state.musicEnabled ? 'Wycisz muzykę' : 'Włącz muzykę';
}

function startBackgroundMusic() {
  if (!state.musicEnabled) return;
  backgroundMusic.play().catch(() => {});
}

function stopBackgroundMusic() {
  backgroundMusic.pause();
  backgroundMusic.currentTime = 0;
}

function toggleMusic() {
  state.musicEnabled = !state.musicEnabled;
  updateMusicButton();

  if (state.musicEnabled && state.running && !state.finished) {
    startBackgroundMusic();
  } else {
    stopBackgroundMusic();
  }
}

function playSound(type) {
  const sound = type === 'correct' ? correctSound : wrongSound;
  sound.currentTime = 0;
  sound.play().catch(() => {});
}

function generateQuestion() {
  const level = calculateLevel();
  let q;

  if (state.selectedTrainer === 'multiplication') {
    const limit = getMultiplicationLimit(level);
    q = makeMultiplicationExpression(limit);
    els.answerInput.placeholder = 'Wpisz wynik';
    els.answerInput.inputMode = 'numeric';
  } else if (state.selectedTrainer === 'fractions') {
    q = makeFractionQuestion(level);
    els.answerInput.placeholder = 'Np. 3/4, 1 1/2, -2/3';
    els.answerInput.inputMode = 'text';
  } else if (state.selectedTrainer === 'equations') {
    q = makeEquationQuestion(level);
    els.answerInput.placeholder = 'Wpisz wartość x';
    els.answerInput.inputMode = 'numeric';
  } else {
    const maxAbs = state.mode === 'easy' ? 10 : state.mode === 'medium' ? 20 : 30;

    if (level <= 2) {
      q = makeSimpleExpression(maxAbs);
    } else if (level <= 4) {
      q = makeParenExpression(maxAbs);
    } else {
      q = makeAdvancedExpression(maxAbs);
    }

    els.answerInput.placeholder = 'Wpisz odpowiedź i naciśnij Enter';
    els.answerInput.inputMode = 'numeric';
  }

  state.current = q;
  els.questionText.innerHTML = q.expr;

  if (window.MathJax?.typesetPromise) {
    MathJax.typesetClear?.([els.questionText]);
    MathJax.typesetPromise([els.questionText]).then(() => {
      fitQuestionText();
    });
  } else {
    fitQuestionText();
  }

  els.levelBadge.textContent = `Poziom: ${level}`;

  if (state.selectedTrainer === 'fractions') {
    els.difficultyText.textContent = getFractionDifficultyLabel(level);
  } else if (state.selectedTrainer === 'equations') {
    els.difficultyText.textContent = getEquationDifficultyLabel(level);
  } else {
    els.difficultyText.textContent = getDifficultyLabel(level);
  }

  els.answerInput.value = '';
  els.answerInput.focus();
}

function setMode(mode) {
  state.mode = mode;
  els.selectedModeText.textContent = `Wybrany tryb: ${mode === 'easy' ? 'łatwy' : mode === 'medium' ? 'średni' : 'trudny'}`;
  document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.toggle('active-mode', btn.dataset.mode === mode));
  updateBadges();
}

function updateBadges() {
  const modeLabel = state.mode === 'easy' ? 'łatwy' : state.mode === 'medium' ? 'średni' : 'trudny';
  els.modeBadge.textContent = `Tryb: ${modeLabel}`;
  els.finalModeBadge.textContent = `Tryb: ${modeLabel}`;
  els.scoreBadge.textContent = `Wynik: ${state.score}`;
  els.streakBadge.textContent = `Seria: ${state.streak}`;
  els.finalScore.textContent = state.score;
  els.finalCorrect.textContent = state.correctCount;
  els.finalTotal.textContent = state.history.length;
}

function updateTimerUI() {
  if (state.noTimeMode) {
    els.globalTimer.textContent = 'Czas: ∞';
    els.timeLeftText.textContent = '∞';
    els.timeProgress.style.width = '0%';
    return;
  }

  els.globalTimer.textContent = `Czas: ${formatTime(state.timeLeft)}`;
  els.timeLeftText.textContent = formatTime(state.timeLeft);
  const elapsed = TOTAL_TIME - state.timeLeft;
  const pct = Math.max(0, Math.min(100, (elapsed / TOTAL_TIME) * 100));
  els.timeProgress.style.width = `${pct}%`;
}

function startGame() {
  state.running = true;
  state.finished = false;
  state.timeLeft = TOTAL_TIME;
  state.score = 0;
  state.streak = 0;
  state.answerCount = 0;
  state.correctCount = 0;
  state.difficultyStep = 0;
  state.history = [];

  updateBadges();
  updateTimerUI();
  showScreen('quiz');
  startBackgroundMusic();
  generateQuestion();

  clearInterval(state.timerId);
  state.timerId = null;

  if (!state.noTimeMode) {
    state.timerId = setInterval(() => {
      state.timeLeft -= 1;
      updateTimerUI();
      if (state.timeLeft <= 0) {
        endGame();
      }
    }, 1000);
  } else {
    updateTimerUI();
  }
}

function registerAnswer(raw, skipped = false) {
  if (!state.running || state.finished) return;

  const correct = state.current.answer;

  let userValue = null;
  let isCorrect = false;
  let userAnswerText = skipped ? 'Pominięte' : raw;
  let correctAnswerText = String(correct);

  if (state.selectedTrainer === 'fractions') {
    userValue = skipped ? null : parseFractionInput(raw);
    isCorrect = !skipped && compareFractions(userValue, correct);

    if (!skipped && userValue) {
      userAnswerText = fractionToDisplay(userValue);
    }
    correctAnswerText = fractionToDisplay(correct);
  } else {
    userValue = skipped ? null : Number(raw);
    isCorrect = !skipped && Number.isFinite(userValue) && userValue === correct;
  }

  state.answerCount += 1;
  if (isCorrect) {
    state.correctCount += 1;
    state.score += 1;
    state.streak += 1;
  } else {
    state.streak = 0;
  }

  state.history.push({
    expr: state.current.expr,
    userAnswer: skipped ? 'Pominięte' : raw,
    userAnswerText,
    correctAnswer: correct,
    correctAnswerText,
    isCorrect,
    skipped,
    index: state.answerCount
  });

  if (!skipped) {
    playSound(isCorrect ? 'correct' : 'wrong');
  }

  updateBadges();
  generateQuestion();
}

function renderResults() {
  els.answersList.innerHTML = '';
  state.history.forEach((item, idx) => {
    const div = document.createElement('div');
    div.className = `answer-item ${item.isCorrect ? 'correct' : 'wrong'}`;
    div.innerHTML = `
      <div class="expr">${idx + 1}. ${escapeHtml(item.expr)}</div>
      <div class="details">
        Twoja odpowiedź: <strong>${escapeHtml(String(item.userAnswerText ?? item.userAnswer))}</strong><br>
        Poprawna odpowiedź: <strong>${escapeHtml(String(item.correctAnswerText ?? item.correctAnswer))}</strong>
        ${item.isCorrect ? '<br><small>Poprawnie</small>' : '<br><small>Błąd</small>'}
      </div>
    `;
    els.answersList.appendChild(div);
  });

  els.finalScore.textContent = state.score;
  els.finalCorrect.textContent = state.correctCount;
  els.finalTotal.textContent = state.history.length;
  updateBadges();
}

function updatePercentage() {
  const percent = state.history.length
    ? Math.round((state.correctCount / state.history.length) * 100)
    : 0;
  els.finalScore.textContent = `${state.score} (${percent}%)`;
}

function endGame() {
  if (state.finished) return;
  state.finished = true;
  state.running = false;
  clearInterval(state.timerId);
  state.timerId = null;
  stopBackgroundMusic();
  renderResults();
  updatePercentage();
  showScreen('results');
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

document.querySelectorAll('.hub-card[data-trainer]').forEach(card => {
  card.addEventListener('click', () => openTrainer(card.dataset.trainer));
});

els.backToHubBtn.addEventListener('click', () => {
  stopBackgroundMusic();
  showScreen('hub');
});

document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', () => setMode(btn.dataset.mode));
});

els.submitBtn.addEventListener('click', () => {
  const value = els.answerInput.value.trim();
  if (value === '') return;
  registerAnswer(value);
});

els.answerInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const value = els.answerInput.value.trim();
    if (value !== '') registerAnswer(value);
  }
});

els.skipBtn.addEventListener('click', () => {
  registerAnswer('', true);
});

els.endBtn.addEventListener('click', endGame);

els.retryBtn.addEventListener('click', () => startGame());

els.startBtn.addEventListener('click', startGame);

els.backHomeBtn.addEventListener('click', () => {
  clearInterval(state.timerId);
  state.timerId = null;
  state.running = false;
  state.finished = false;
  state.history = [];
  state.score = 0;
  state.streak = 0;
  state.correctCount = 0;
  state.answerCount = 0;
  state.timeLeft = TOTAL_TIME;
  stopBackgroundMusic();
  updateTimerUI();
  updateBadges();
  showScreen('hub');
});

if (els.musicToggle) {
  els.musicToggle.addEventListener('click', toggleMusic);
  updateMusicButton();
}

const noTimeBtn = document.createElement('button');
noTimeBtn.textContent = 'Tryb bez limitu czasu';
noTimeBtn.className = 'secondary-btn';
document.querySelector('#settingsScreen .panel').appendChild(noTimeBtn);

noTimeBtn.addEventListener('click', () => {
  state.noTimeMode = !state.noTimeMode;
  noTimeBtn.textContent = state.noTimeMode
    ? 'Tryb: bez limitu (kliknij aby wyłączyć)'
    : 'Tryb bez limitu czasu';
  updateTimerUI();
});

function exportPDF() {
  const moduleTitle = trainerConfig[state.selectedTrainer]?.title || 'Moduł treningowy';
  const modeLabel = state.mode === 'easy' ? 'Łatwy' : state.mode === 'medium' ? 'Średni' : 'Trudny';

  const win = window.open('', '_blank');
  const rows = state.history.map((h, i) => `
    <tr style="background:${h.isCorrect ? '#d1fae5' : '#fee2e2'}">
      <td>${i + 1}</td>
      <td>${h.expr}</td>
      <td>${h.userAnswerText ?? h.userAnswer}</td>
      <td>${h.correctAnswerText ?? h.correctAnswer}</td>
    </tr>
  `).join('');

  win.document.write(`
    <html>
    <head>
      <title>${moduleTitle} — wyniki</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 24px;
          color: #111827;
        }
        h1 {
          margin: 0 0 8px;
        }
        .meta {
          margin: 0 0 18px;
          color: #374151;
          font-size: 14px;
          line-height: 1.5;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 12px;
        }
        th, td {
          border: 1px solid #d1d5db;
          padding: 8px;
          text-align: left;
          vertical-align: top;
        }
        th {
          background: #f3f4f6;
        }
      </style>
    </head>
    <body>
      <h1>${moduleTitle}</h1>
      <div class="meta">
        Poziom trudności: <strong>${modeLabel}</strong><br>
        Tryb czasu: <strong>${state.noTimeMode ? 'bez limitu czasu' : formatTime(TOTAL_TIME)}</strong>
      </div>

      <table>
        <tr>
          <th>#</th>
          <th>Zadanie</th>
          <th>Twoja odpowiedź</th>
          <th>Poprawna</th>
        </tr>
        ${rows}
      </table>

      <script>
        window.print();
      <\/script>
    </body>
    </html>
  `);

  win.document.close();
}

const pdfBtn = document.createElement('button');
pdfBtn.textContent = 'Eksport do PDF';
pdfBtn.className = 'secondary-btn';
els.resultsScreen.querySelector('.results-actions').appendChild(pdfBtn);

pdfBtn.addEventListener('click', exportPDF);

function init() {
  renderTrainerSettings();
  setMode('easy');
  updateMusicButton();
  updateTimerUI();
  showScreen('hub');
}

window.addEventListener('resize', () => {
  if (state.current) fitQuestionText();
});

init();