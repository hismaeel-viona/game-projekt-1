import { getElements, createFakeTargetButton } from './ui.js';
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

const state = {
    points: 0,
    remainingTime: 20,
    gameRunning: false,
    timerId: null,
    record: 0,
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
};

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

    if (state.gameRunning) {
        state.animationId = requestAnimationFrame(updateTargetPosition);
    }
}

function startGame() {
    hideHighscoreEntryForm();
    message.textContent = 'Spiel läuft...';
    state.points = 0;
    state.remainingTime = state.gameTime;
    state.gameRunning = true;

    gameTimeSlider.disabled = true;
    speedSlider.disabled = true;
    fakeCountSlider.disabled = true;
    squareCountSlider.disabled = true;
    starCountSlider.disabled = true;
    startButton.disabled = true;

    target.style.display = 'block';
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
    updateDisplay({ pointsDisplay, timeDisplay, recordDisplay, points: state.points, remainingTime: state.remainingTime, record: state.record });
}

function handleTargetClick() {
    if (!state.gameRunning) return;

    state.points = calculatePoints(state.points);
    updateDisplay({ pointsDisplay, timeDisplay, recordDisplay, points: state.points, remainingTime: state.remainingTime, record: state.record });

    const gameFieldWidth = gameField.offsetWidth;
    const gameFieldHeight = gameField.offsetHeight;
    state.targetX = 40 + Math.random() * (gameFieldWidth - 80);
    state.targetY = 40 + Math.random() * (gameFieldHeight - 80);
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

    target.addEventListener('click', handleTargetClick);
    startButton.addEventListener('click', startGame);
    window.addEventListener('mousemove', (event) => {
        updateBackgroundSquares(event.clientX, event.clientY);
    });
}

function initializeGame() {
    createBackgroundSquares();
    createBackgroundStars();
    state.record = loadRecord();
    updateSliderValues();
    updateDisplay({ pointsDisplay, timeDisplay, recordDisplay, points: state.points, remainingTime: state.remainingTime, record: state.record });
    renderHighscoreList();
    hideHighscoreEntryForm();
    setupEventListeners();
}

initializeGame();
