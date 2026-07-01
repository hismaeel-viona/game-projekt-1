import { getElements, createFakeTargetButton, decorateTargetButton } from './ui.js';
import { updateDisplay, updateRecord, calculatePoints } from './scoring.js';
import { loadRecord, saveRecord, saveHighscoreEntry, getHighscoreList, clearHighscoreList } from './storage.js';

const ui = getElements();
const {
    gameField,
    target,
    startButton,
    pointsDisplay,
    timeDisplay,
    recordDisplay,
    message,
    gameTimeSlider,
    speedSlider,
    fakeCountSlider,
    squareCountSlider,
    starCountSlider,
    gameTimeValue,
    speedValue,
    fakeCountValue,
    squareCountValue,
    starCountValue,
    highscoreEntries,
    highscoreEntryForm,
    highscoreText,
    submitHighscore,
    clearHighscores
} = ui;

const body = document.body;
const backgroundSquares = [];

const difficultyPresets = {
    easy: {
        gameTime: 25,
        baseSpeed: 3,
        fakeTargetCount: 0,
    },
    medium: {
        gameTime: 20,
        baseSpeed: 5,
        fakeTargetCount: 1,
    },
    hard: {
        gameTime: 15,
        baseSpeed: 8,
        fakeTargetCount: 3,
    },
};

function getDifficultyConfig(level) {
    return difficultyPresets[level] || difficultyPresets.medium;
}

function applyDifficultyPreset(level) {
    const preset = getDifficultyConfig(level);
    state.difficulty = level;
    state.gameTime = preset.gameTime;
    state.baseSpeed = preset.baseSpeed;
    state.fakeTargetCount = preset.fakeTargetCount;

    if (ui.difficultySelector) {
        ui.difficultySelector.value = level;
    }
    if (ui.gameTimeSlider) {
        ui.gameTimeSlider.value = String(state.gameTime);
    }
    if (ui.speedSlider) {
        ui.speedSlider.value = String(state.baseSpeed);
    }
    if (ui.fakeCountSlider) {
        ui.fakeCountSlider.value = String(state.fakeTargetCount);
    }

    updateSliderValues();
}

const state = {
    points: 0,
    remainingTime: 20,
    gameRunning: false,
    timerId: null,
    record: 0,
    difficulty: 'medium',
    gameTime: 20,
    baseSpeed: 5,
    fakeTargetCount: 0,
    squareCount: 8,
    starCount: 24,
    fakeTargets: [],
    targetX: 0,
    targetY: 0,
    velocityX: 5,
    velocityY: 5,
    animationId: null,
    reactionTimes: [],
    bestReaction: null,
    avgReaction: null,
    targetShownAt: null,
    medianReaction: null,
    p90Reaction: null,
    paused: false,
};

function computeMedian(arr) {
    if (!arr || arr.length === 0) return null;
    const sorted = Array.from(arr).sort((a,b)=>a-b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
        return Math.round((sorted[mid-1] + sorted[mid]) / 2);
    }
    return sorted[mid];
}

function computePercentile(arr, p) {
    if (!arr || arr.length === 0) return null;
    const sorted = Array.from(arr).sort((a,b)=>a-b);
    const idx = Math.ceil((p/100) * sorted.length) - 1;
    return sorted[Math.max(0, Math.min(sorted.length-1, idx))];
}

function renderSparkline(svgEl, data) {
    if (!svgEl) return;
    // try to get rendered size; fall back to defaults
    const rect = svgEl.getBoundingClientRect();
    const width = rect.width || svgEl.clientWidth || 300;
    const height = rect.height || svgEl.clientHeight || 48;
    svgEl.innerHTML = '';
    if (!data || data.length === 0) return;
    const sorted = Array.from(data).slice(-40);
    const max = Math.max(...sorted);
    const min = Math.min(...sorted);
    const len = sorted.length;

    // set explicit viewBox for consistent scaling
    svgEl.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svgEl.setAttribute('preserveAspectRatio', 'none');

    const points = sorted.map((v,i)=>{
        const x = (len === 1) ? width/2 : (i/(len-1)) * width;
        const y = height - ((v - min) / Math.max(1, (max-min))) * height;
        return `${x},${y}`;
    }).join(' ');

    const ns = 'http://www.w3.org/2000/svg';
    const poly = document.createElementNS(ns,'polyline');
    poly.setAttribute('points', points);
    poly.setAttribute('fill','none');
    poly.setAttribute('stroke','#facc15');
    poly.setAttribute('stroke-width','2');
    poly.setAttribute('stroke-linecap','round');
    poly.setAttribute('stroke-linejoin','round');
    svgEl.appendChild(poly);

    // subtle area fill for better visibility
    if (len > 1) {
        const areaPoints = `${points} ${width},${height} 0,${height}`;
        const polyFill = document.createElementNS(ns,'polygon');
        polyFill.setAttribute('points', areaPoints);
        polyFill.setAttribute('fill', 'rgba(250,200,21,0.08)');
        svgEl.insertBefore(polyFill, poly);
    }
}

// ------------------------------
// Rendering and UI helpers
// ------------------------------
function updateSliderValues() {
    gameTimeValue.textContent = state.gameTime + 's';
    speedValue.textContent = state.baseSpeed;
    fakeCountValue.textContent = state.fakeTargetCount;
    squareCountValue.textContent = state.squareCount;
    starCountValue.textContent = state.starCount;
}

function updateBackgroundSquares(mouseX, mouseY) {
    const xFactor = Math.min(1, Math.max(0, mouseX / window.innerWidth));
    const yFactor = Math.min(1, Math.max(0, mouseY / window.innerHeight));

    backgroundSquares.forEach((square, index) => {
        const baseSize = parseFloat(square.dataset.baseSize) || 18;
        const size = baseSize + xFactor * 50;
        const baseRotation = parseFloat(square.dataset.baseRotation) || 0;
        const rotationOffset = (yFactor - 0.5) * 220 + (xFactor - 0.5) * 90;
        const offset = index % 2 === 0 ? 1 : -1;

        square.style.width = `${size}px`;
        square.style.height = `${size}px`;
        square.style.transform = `translate(-50%, -50%) rotate(${baseRotation + rotationOffset * offset}deg)`;
        square.style.opacity = `${0.3 + 0.7 * xFactor}`;
    });

    updateBackgroundStars(xFactor);
}

function updateBackgroundStars(xFactor) {
    document.querySelectorAll('.background-star').forEach((star) => {
        const scale = 0.8 + xFactor * 1.5;
        star.style.transform = `translate(-50%, -50%) scale(${scale})`;
        star.style.opacity = `${0.4 + 0.4 * xFactor}`;
    });
}

function createBackgroundSquares() {
    const existingContainer = document.querySelector('.background-squares');
    if (existingContainer) {
        existingContainer.remove();
    }

    const container = document.createElement('div');
    container.className = 'background-squares';
    body.appendChild(container);

    for (let i = 0; i < state.squareCount; i++) {
        const square = document.createElement('div');
        square.className = 'background-square';
        square.style.left = `${5 + Math.random() * 90}%`;
        square.style.top = `${5 + Math.random() * 90}%`;
        const baseSize = 16 + Math.random() * 20;
        square.dataset.baseSize = baseSize.toString();
        square.dataset.baseRotation = (Math.random() * 360).toString();
        square.style.width = `${baseSize}px`;
        square.style.height = `${baseSize}px`;
        square.style.opacity = `${0.35 + Math.random() * 0.5}`;
        square.style.transform = `translate(-50%, -50%) rotate(${square.dataset.baseRotation}deg)`;
        container.appendChild(square);
        backgroundSquares.push(square);
    }
}

function resetBackgroundSquares() {
    const existingContainer = document.querySelector('.background-squares');
    if (existingContainer) {
        existingContainer.remove();
    }

    backgroundSquares.length = 0;
    createBackgroundSquares();
}

function createBackgroundStars() {
    const existingStars = document.querySelectorAll('.background-star');
    existingStars.forEach((star) => star.remove());

    for (let i = 0; i < state.starCount; i++) {
        const star = document.createElement('div');
        star.className = 'background-star';
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.width = `${Math.random() * 2 + 1}px`;
        star.style.height = star.style.width;
        body.appendChild(star);
    }
}

// ------------------------------
// Game state and logic
// ------------------------------
function ensureTargetVisuals() {
    if (!target) return null;
    if (target.querySelector('.target-svg')) return target;
    return decorateTargetButton(target, 'apple');
}

function createFakeTargets() {
    state.fakeTargets = [];

    for (let i = 0; i < state.fakeTargetCount; i++) {
        const fakeTarget = createFakeTargetButton(gameField);
        const fakeData = {
            element: fakeTarget,
            x: 40 + Math.random() * (gameField.offsetWidth - 80),
            y: 40 + Math.random() * (gameField.offsetHeight - 80),
            vx: (Math.random() - 0.5) * state.baseSpeed * 2,
            vy: (Math.random() - 0.5) * state.baseSpeed * 2,
        };

        fakeTarget.addEventListener('click', (e) => {
            e.stopPropagation();
            if (state.gameRunning) {
                state.fakeHitCount = (state.fakeHitCount || 0) + 1;
                endGame(true);
            }
        });

        state.fakeTargets.push(fakeData);
    }
}

function removeFakeTargets() {
    state.fakeTargets.forEach((ft) => ft.element.remove());
    state.fakeTargets = [];
}

function updateTargetPosition() {
    const gameFieldWidth = gameField.offsetWidth;
    const gameFieldHeight = gameField.offsetHeight;
    const targetRadius = 40;

    state.targetX += state.velocityX;
    state.targetY += state.velocityY;

    if (state.targetX - targetRadius <= 0 || state.targetX + targetRadius >= gameFieldWidth) {
        state.velocityX *= -1;
        state.targetX = Math.max(targetRadius, Math.min(gameFieldWidth - targetRadius, state.targetX));
    }

    if (state.targetY - targetRadius <= 0 || state.targetY + targetRadius >= gameFieldHeight) {
        state.velocityY *= -1;
        state.targetY = Math.max(targetRadius, Math.min(gameFieldHeight - targetRadius, state.targetY));
    }

    target.style.left = state.targetX + 'px';
    target.style.top = state.targetY + 'px';

    state.fakeTargets.forEach((ft) => {
        ft.x += ft.vx;
        ft.y += ft.vy;

        if (ft.x - targetRadius <= 0 || ft.x + targetRadius >= gameFieldWidth) {
            ft.vx *= -1;
            ft.x = Math.max(targetRadius, Math.min(gameFieldWidth - targetRadius, ft.x));
        }

        if (ft.y - targetRadius <= 0 || ft.y + targetRadius >= gameFieldHeight) {
            ft.vy *= -1;
            ft.y = Math.max(targetRadius, Math.min(gameFieldHeight - targetRadius, ft.y));
        }

        ft.element.style.left = ft.x + 'px';
        ft.element.style.top = ft.y + 'px';
    });

    if (state.gameRunning && !state.paused) {
        state.animationId = requestAnimationFrame(updateTargetPosition);
    }
}

function startGame() {
    hideHighscoreEntryForm();
    message.textContent = 'Spiel läuft...';
    state.points = 0;
    state.remainingTime = state.gameTime;
    state.gameRunning = true;
    state.hitCount = 0;
    state.fakeHitCount = 0;
    state.missCount = 0;

    gameTimeSlider.disabled = true;
    speedSlider.disabled = true;
    fakeCountSlider.disabled = true;
    squareCountSlider.disabled = true;
    starCountSlider.disabled = true;
    startButton.disabled = true;

    ensureTargetVisuals();
    target.style.display = 'block';
    try { target.focus(); } catch (e) {}
    createFakeTargets();
    state.fakeTargets.forEach((ft) => {
        ft.element.style.display = 'block';
        if (ft.vx === 0) ft.vx = state.baseSpeed;
        if (ft.vy === 0) ft.vy = state.baseSpeed;
    });

    const gameFieldWidth = gameField.offsetWidth;
    const gameFieldHeight = gameField.offsetHeight;
    state.targetX = 40 + Math.random() * (gameFieldWidth - 80);
    state.targetY = 40 + Math.random() * (gameFieldHeight - 80);
    state.targetShownAt = Date.now();

    state.velocityX = (Math.random() - 0.5) * state.baseSpeed * 2;
    state.velocityY = (Math.random() - 0.5) * state.baseSpeed * 2;

    if (state.velocityX === 0) state.velocityX = state.baseSpeed;
    if (state.velocityY === 0) state.velocityY = state.baseSpeed;

    if (state.animationId) cancelAnimationFrame(state.animationId);
    updateTargetPosition();

    clearInterval(state.timerId);
    state.timerId = setInterval(() => {
        state.remainingTime--;
        updateDisplay({ pointsDisplay, timeDisplay, recordDisplay, points: state.points, remainingTime: state.remainingTime, record: state.record });

        if (state.remainingTime <= 0) {
            endGame();
        }
    }, 1000);
}

function endGame(hitFake = false) {
    state.gameRunning = false;

    clearInterval(state.timerId);
    if (state.animationId) cancelAnimationFrame(state.animationId);

    const newRecord = updateRecord(state.points, state.record);
    if (newRecord !== state.record) {
        state.record = newRecord;
        saveRecord(state.record);
    }

    target.style.display = 'none';
    state.fakeTargets.forEach((ft) => ft.element.style.display = 'none');
    removeFakeTargets();

    startButton.disabled = false;
    gameTimeSlider.disabled = false;
    speedSlider.disabled = false;
    fakeCountSlider.disabled = false;
    squareCountSlider.disabled = false;
    starCountSlider.disabled = false;

    if (hitFake) {
        message.textContent = 'Oops! You hit a fake target. Du kannst deinen Score jetzt speichern.';
    } else {
        message.textContent = 'Time\'s up. Du kannst deinen Score jetzt speichern.';
    }
    showHighscoreEntryForm();
    showStatsOverlay();
    updateDisplay({ pointsDisplay, timeDisplay, recordDisplay, points: state.points, remainingTime: state.remainingTime, record: state.record });
}

function handleTargetClick(event) {
    if (!state.gameRunning) return;
    if (state.paused) return;
    event.stopPropagation();
    state.hitCount += 1;

    // reaction time measurement
    if (state.targetShownAt) {
        const reaction = Date.now() - state.targetShownAt;
        state.reactionTimes.push(reaction);
        // update best
        if (state.bestReaction === null || reaction < state.bestReaction) {
            state.bestReaction = reaction;
        }
        // update average
        const sum = state.reactionTimes.reduce((a, b) => a + b, 0);
        state.avgReaction = Math.round(sum / state.reactionTimes.length);
    }

    state.points = calculatePoints(state.points);
    updateDisplay({ pointsDisplay, timeDisplay, recordDisplay, points: state.points, remainingTime: state.remainingTime, record: state.record });

    const gameFieldWidth = gameField.offsetWidth;
    const gameFieldHeight = gameField.offsetHeight;
    state.targetX = 40 + Math.random() * (gameFieldWidth - 80);
    state.targetY = 40 + Math.random() * (gameFieldHeight - 80);
    state.targetShownAt = Date.now();
}

function pauseGame() {
    if (!state.gameRunning || state.paused) return;
    state.paused = true;
    if (state.timerId) {
        clearInterval(state.timerId);
        state.timerId = null;
    }
    if (state.animationId) {
        cancelAnimationFrame(state.animationId);
        state.animationId = null;
    }
    message.textContent = 'Pausiert';
    showPauseOverlay();
    announce('Spiel pausiert');
}

function resumeGame() {
    if (!state.gameRunning || !state.paused) return;
    state.paused = false;
    // restart animation
    updateTargetPosition();
    // restart timer
    if (state.timerId) clearInterval(state.timerId);
    state.timerId = setInterval(() => {
        if (!state.paused) {
            state.remainingTime--;
            updateDisplay({ pointsDisplay, timeDisplay, recordDisplay, points: state.points, remainingTime: state.remainingTime, record: state.record });
            if (state.remainingTime <= 0) {
                endGame();
            }
        }
    }, 1000);
    message.textContent = 'Spiel läuft...';
    hidePauseOverlay();
    announce('Spiel fortgesetzt');
}

function togglePause() {
    if (state.paused) resumeGame(); else pauseGame();
}

function handleGameFieldClick() {
    if (!state.gameRunning) return;

    state.missCount += 1;
    message.textContent = 'Miss! Keep trying.';
}

function createStatsOverlay() {
    if (document.getElementById('statsOverlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'statsOverlay';
    overlay.className = 'stats-overlay hidden';
    overlay.innerHTML = `
        <div class="stats-card" role="dialog" aria-modal="true" aria-labelledby="statsTitle">
            <h2 id="statsTitle">Ergebnis</h2>
                    <div class="stats-roll">
                        <div class="stat-row"><span class="stat-label">Treffer:</span><span id="statHit" class="stat-value">0</span></div>
                        <div class="stat-row"><span class="stat-label">Falsche Treffer:</span><span id="statFake" class="stat-value">0</span></div>
                        <div class="stat-row"><span class="stat-label">Fehlversuche:</span><span id="statMiss" class="stat-value">0</span></div>
                        <div class="stat-row"><span class="stat-label">Durchschnittliche Reaktionszeit:</span><span id="statAvg" class="stat-value">0 ms</span></div>
                        <div class="stat-row"><span class="stat-label">Beste Reaktionszeit:</span><span id="statBest" class="stat-value">0 ms</span></div>
                        <div class="stat-row"><span class="stat-label">Median Reaktionszeit:</span><span id="statMedian" class="stat-value">0 ms</span></div>
                        <div class="stat-row"><span class="stat-label">90th Percentile:</span><span id="statP90" class="stat-value">0 ms</span></div>
                        <div class="stat-row sparkline-row">
                            <div class="sparkline-wrapper">
                                <div id="statSparkMax" class="axis-label">0 ms</div>
                                <svg id="statSparkline" width="100%" height="48" aria-hidden="true"></svg>
                                <div id="statSparkMin" class="axis-label">0 ms</div>
                            </div>
                            <div class="sparkline-x" aria-hidden="true">
                                <span id="statX0">0</span>
                                <span id="statXmid">—</span>
                                <span id="statXend">—</span>
                            </div>
                        </div>
                    </div>
            <button id="closeStats" class="stats-close">Schließen</button>
        </div>`;

    body.appendChild(overlay);

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) hideStatsOverlay();
    });

    const closeBtn = overlay.querySelector('#closeStats');
    if (closeBtn) closeBtn.addEventListener('click', hideStatsOverlay);
}

function ensureLiveRegion() {
    if (document.getElementById('liveRegion')) return;
    const lr = document.createElement('div');
    lr.id = 'liveRegion';
    lr.setAttribute('aria-live','polite');
    lr.className = 'sr-only';
    body.appendChild(lr);
}

function announce(msg) {
    ensureLiveRegion();
    const lr = document.getElementById('liveRegion');
    if (!lr) return;
    lr.textContent = msg;
    // clear after a short time to avoid repeated announcements
    setTimeout(() => { if (lr.textContent === msg) lr.textContent = ''; }, 2500);
}

function createPauseOverlay() {
    if (document.getElementById('pauseOverlay')) return;
    const ov = document.createElement('div');
    ov.id = 'pauseOverlay';
    ov.className = 'pause-overlay hidden';
    ov.innerHTML = `<div class="pause-card">Pausiert</div>`;
    body.appendChild(ov);
}

function showPauseOverlay() {
    createPauseOverlay();
    const ov = document.getElementById('pauseOverlay');
    if (!ov) return;
    ov.classList.remove('hidden');
}

function hidePauseOverlay() {
    const ov = document.getElementById('pauseOverlay');
    if (!ov) return;
    ov.classList.add('hidden');
}

function showStatsOverlay() {
    createStatsOverlay();
    const overlay = document.getElementById('statsOverlay');
    if (!overlay) return;
    overlay.classList.remove('hidden');

    const hitEl = document.getElementById('statHit');
    const fakeEl = document.getElementById('statFake');
    const missEl = document.getElementById('statMiss');

    if (hitEl) hitEl.textContent = String(state.hitCount || 0);
    if (fakeEl) fakeEl.textContent = String(state.fakeHitCount || 0);
    if (missEl) missEl.textContent = String(state.missCount || 0);
    const avgEl = document.getElementById('statAvg');
    const bestEl = document.getElementById('statBest');
    if (avgEl) avgEl.textContent = (state.avgReaction !== null) ? `${state.avgReaction} ms` : '—';
    if (bestEl) bestEl.textContent = (state.bestReaction !== null) ? `${state.bestReaction} ms` : '—';
    const medianEl = document.getElementById('statMedian');
    const p90El = document.getElementById('statP90');
    const sparkEl = document.getElementById('statSparkline');

    // compute median/p90
    const median = computeMedian(state.reactionTimes);
    const p90 = computePercentile(state.reactionTimes, 90);
    state.medianReaction = median;
    state.p90Reaction = p90;

    if (medianEl) medianEl.textContent = median !== null ? `${median} ms` : '—';
    if (p90El) p90El.textContent = p90 !== null ? `${p90} ms` : '—';

    // render sparkline and axis labels
    if (sparkEl) renderSparkline(sparkEl, state.reactionTimes);
    const sparkMax = document.getElementById('statSparkMax');
    const sparkMin = document.getElementById('statSparkMin');
    const x0 = document.getElementById('statX0');
    const xmid = document.getElementById('statXmid');
    const xend = document.getElementById('statXend');
    const values = state.reactionTimes || [];
    if (values.length > 0) {
        const max = Math.max(...values);
        const min = Math.min(...values);
        if (sparkMax) sparkMax.textContent = `${max} ms`;
        if (sparkMin) sparkMin.textContent = `${min} ms`;
        if (x0) x0.textContent = '1';
        if (xmid) xmid.textContent = String(Math.ceil(values.length / 2));
        if (xend) xend.textContent = String(values.length);
    } else {
        if (sparkMax) sparkMax.textContent = '—';
        if (sparkMin) sparkMin.textContent = '—';
        if (x0) x0.textContent = '—';
        if (xmid) xmid.textContent = '—';
        if (xend) xend.textContent = '—';
    }

    const card = overlay.querySelector('.stats-card');
    if (card) {
        card.classList.remove('pop-in');
        // force reflow then add animation class
        void card.offsetWidth;
        card.classList.add('pop-in');
    }

    const vals = overlay.querySelectorAll('.stat-value');
    vals.forEach((el, i) => {
        setTimeout(() => el.classList.add('flash'), 200 * i);
        setTimeout(() => el.classList.remove('flash'), 200 * i + 1400);
    });
}

function hideStatsOverlay() {
    const overlay = document.getElementById('statsOverlay');
    if (!overlay) return;
    overlay.classList.add('hidden');
}

function showHighscoreEntryForm() {
    if (!highscoreEntryForm || !highscoreText) return;
    highscoreEntryForm.classList.remove('hidden');
    highscoreText.value = '';
    highscoreText.focus();
}

function hideHighscoreEntryForm() {
    if (!highscoreEntryForm || !highscoreText) return;
    highscoreEntryForm.classList.add('hidden');
    highscoreText.value = '';
}

function submitHighscoreEntry() {
    if (!highscoreText) return;
    const text = highscoreText.value.trim().slice(0, 50);
    saveHighscoreEntry({
        score: state.points,
        text,
        date: new Date().toISOString(),
    });
    renderHighscoreList();
    hideHighscoreEntryForm();
    message.textContent = 'Score gespeichert!';
}

function renderHighscoreList() {
    if (!highscoreEntries) return;
    const highscores = getHighscoreList();
    highscoreEntries.innerHTML = '';

    if (highscores.length === 0) {
        highscoreEntries.innerHTML = '<li>Keine Einträge</li>';
        return;
    }

    highscores.slice(0, 10).forEach((entry) => {
        const li = document.createElement('li');
        const label = entry.text ? `${entry.text} — ` : '';
        const date = entry.date ? new Date(entry.date).toLocaleDateString('de-DE') : '';
        li.textContent = `${entry.score} Punkte — ${label}${date}`.trim();
        highscoreEntries.appendChild(li);
    });
}

function setupEventListeners() {
    gameTimeSlider.addEventListener('input', function () {
        state.gameTime = parseInt(this.value, 10);
        updateSliderValues();
    });

    speedSlider.addEventListener('input', function () {
        state.baseSpeed = parseInt(this.value, 10);
        updateSliderValues();
    });

    fakeCountSlider.addEventListener('input', function () {
        state.fakeTargetCount = parseInt(this.value, 10);
        updateSliderValues();
    });

    if (ui.difficultySelector) {
        ui.difficultySelector.addEventListener('change', function () {
            applyDifficultyPreset(this.value);
        });
    }

    squareCountSlider.addEventListener('input', function () {
        state.squareCount = parseInt(this.value, 10);
        updateSliderValues();
        resetBackgroundSquares();
    });

    starCountSlider.addEventListener('input', function () {
        state.starCount = parseInt(this.value, 10);
        updateSliderValues();
        createBackgroundStars();
    });

    if (submitHighscore) {
        submitHighscore.addEventListener('click', () => {
            submitHighscoreEntry();
        });
    }

    if (clearHighscores) {
        clearHighscores.addEventListener('click', () => {
            clearHighscoreList();
            renderHighscoreList();
            message.textContent = 'Highscores gelöscht.';
        });
    }

    gameField.addEventListener('click', handleGameFieldClick);
    target.addEventListener('click', handleTargetClick);
    startButton.addEventListener('click', startGame);
    // Keyboard controls: Start (S), Pause/Resume (P), Close overlay (Escape), Enter/Space to hit target
    window.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        if (key === 's') {
            if (!state.gameRunning) startGame();
        }
        if (key === 'p') {
            if (state.gameRunning) togglePause();
        }
        if (e.key === 'Escape') {
            hideStatsOverlay();
        }
        if ((e.key === 'Enter' || e.key === ' ') && document.activeElement === target) {
            // simulate click
            handleTargetClick(new Event('click'));
            // prevent default to avoid page scroll on space
            e.preventDefault();
        }
        // Ctrl/Cmd+S to save highscore when entry form visible
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
            if (highscoreEntryForm && !highscoreEntryForm.classList.contains('hidden')) {
                submitHighscoreEntry();
                e.preventDefault();
                announce('Highscore gespeichert');
            }
        }
    });
    window.addEventListener('mousemove', (event) => {
        updateBackgroundSquares(event.clientX, event.clientY);
    });
}

function createControlsPanel() {
    const existing = document.getElementById('controlsPanel');
    if (existing) return;

    const panel = document.createElement('div');
    panel.id = 'controlsPanel';
    panel.className = 'controls-panel';
    panel.innerHTML = `
        <h3>Controls</h3>
        <ul>
            <li><strong>S</strong> — Spiel starten</li>
            <li><strong>P</strong> — Pause / Fortsetzen</li>
            <li><strong>Enter</strong> / <strong>Space</strong> — Ziel treffen (wenn fokussiert)</li>
            <li><strong>Esc</strong> — Overlay schließen</li>
            <li><strong>Ctrl/Cmd + S</strong> — Highscore speichern (wenn Formular sichtbar)</li>
        </ul>
    `;

    const options = document.querySelector('.options');
    if (options) {
        options.appendChild(panel);
    } else {
        body.appendChild(panel);
    }
}

function initializeGame() {
    createBackgroundSquares();
    createBackgroundStars();
    state.record = loadRecord();
    applyDifficultyPreset(state.difficulty);
    updateDisplay({ pointsDisplay, timeDisplay, recordDisplay, points: state.points, remainingTime: state.remainingTime, record: state.record });
    renderHighscoreList();
    hideHighscoreEntryForm();
    setupEventListeners();
    createControlsPanel();
}

initializeGame();

export { getDifficultyConfig, applyDifficultyPreset, state, showStatsOverlay };
