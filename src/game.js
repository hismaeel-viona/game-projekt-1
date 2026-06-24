import { getElements, createFakeTargetButton } from './ui.js';
import { updateDisplay, updateRecord } from './scoring.js';
import { loadRecord, saveRecord } from './storage.js';

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
    gameTimeValue,
    speedValue,
    fakeCountValue
} = getElements();

let points = 0;
let remainingTime = 20;
let gameRunning = false;
let timerId = null;
let record = 0;
let gameTime = 20;
let baseSpeed = 5;
let fakeTargetCount = 0;
let fakeTargets = [];

let targetX = 0;
let targetY = 0;
let velocityX = 5;
let velocityY = 5;
let animationId = null;

function updateSliderValues() {
    gameTimeValue.textContent = gameTime + 's';
    speedValue.textContent = baseSpeed;
    fakeCountValue.textContent = fakeTargetCount;
}

function createFakeTargets() {
    fakeTargets = [];
    for (let i = 0; i < fakeTargetCount; i++) {
        const fakeTarget = createFakeTargetButton(gameField);
        const fakeData = {
            element: fakeTarget,
            x: 40 + Math.random() * (gameField.offsetWidth - 80),
            y: 40 + Math.random() * (gameField.offsetHeight - 80),
            vx: (Math.random() - 0.5) * baseSpeed * 2,
            vy: (Math.random() - 0.5) * baseSpeed * 2
        };

        fakeTarget.addEventListener('click', function (e) {
            e.stopPropagation();
            if (gameRunning) {
                endGame(true);
            }
        });

        fakeTargets.push(fakeData);
    }
}

function removeFakeTargets() {
    fakeTargets.forEach(ft => ft.element.remove());
    fakeTargets = [];
}

function updateTargetPosition() {
    const gameFieldWidth = gameField.offsetWidth;
    const gameFieldHeight = gameField.offsetHeight;
    const targetRadius = 40;

    targetX += velocityX;
    targetY += velocityY;

    if (targetX - targetRadius <= 0 || targetX + targetRadius >= gameFieldWidth) {
        velocityX *= -1;
        targetX = Math.max(targetRadius, Math.min(gameFieldWidth - targetRadius, targetX));
    }

    if (targetY - targetRadius <= 0 || targetY + targetRadius >= gameFieldHeight) {
        velocityY *= -1;
        targetY = Math.max(targetRadius, Math.min(gameFieldHeight - targetRadius, targetY));
    }

    target.style.left = targetX + 'px';
    target.style.top = targetY + 'px';

    fakeTargets.forEach(ft => {
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

    if (gameRunning) {
        animationId = requestAnimationFrame(updateTargetPosition);
    }
}

function startGame() {
    points = 0;
    remainingTime = gameTime;
    gameRunning = true;

    gameTimeSlider.disabled = true;
    speedSlider.disabled = true;
    fakeCountSlider.disabled = true;

    startButton.disabled = true;
    target.style.display = 'block';

    createFakeTargets();
    fakeTargets.forEach(ft => {
        ft.element.style.display = 'block';
        if (ft.vx === 0) ft.vx = baseSpeed;
        if (ft.vy === 0) ft.vy = baseSpeed;
    });

    const gameFieldWidth = gameField.offsetWidth;
    const gameFieldHeight = gameField.offsetHeight;
    targetX = 40 + Math.random() * (gameFieldWidth - 80);
    targetY = 40 + Math.random() * (gameFieldHeight - 80);

    velocityX = (Math.random() - 0.5) * baseSpeed * 2;
    velocityY = (Math.random() - 0.5) * baseSpeed * 2;

    if (velocityX === 0) velocityX = baseSpeed;
    if (velocityY === 0) velocityY = baseSpeed;

    if (animationId) cancelAnimationFrame(animationId);
    updateTargetPosition();

    clearInterval(timerId);
    timerId = setInterval(() => {
        remainingTime--;
        updateDisplay({ pointsDisplay, timeDisplay, recordDisplay, points, remainingTime, record });

        if (remainingTime <= 0) {
            endGame();
        }
    }, 1000);
}

function endGame(hitFake = false) {
    gameRunning = false;

    clearInterval(timerId);
    if (animationId) cancelAnimationFrame(animationId);

    const newRecord = updateRecord(points, record);
    if (newRecord !== record) {
        record = newRecord;
        saveRecord(record);
    }

    target.style.display = 'none';
    fakeTargets.forEach(ft => ft.element.style.display = 'none');
    removeFakeTargets();

    startButton.disabled = false;
    gameTimeSlider.disabled = false;
    speedSlider.disabled = false;
    fakeCountSlider.disabled = false;

    if (hitFake) {
        message.textContent = 'Oops! You hit a fake target. You lost!';
    } else {
        message.textContent = 'Time\'s up. You scored ' + points + ' points.';
    }
    updateDisplay({ pointsDisplay, timeDisplay, recordDisplay, points, remainingTime, record });
}

function handleTargetClick() {
    if (!gameRunning) return;

    points++;
    updateDisplay({ pointsDisplay, timeDisplay, recordDisplay, points, remainingTime, record });

    const gameFieldWidth = gameField.offsetWidth;
    const gameFieldHeight = gameField.offsetHeight;
    targetX = 40 + Math.random() * (gameFieldWidth - 80);
    targetY = 40 + Math.random() * (gameFieldHeight - 80);
}

function setupEventListeners() {
    gameTimeSlider.addEventListener('input', function () {
        gameTime = parseInt(this.value, 10);
        updateSliderValues();
    });

    speedSlider.addEventListener('input', function () {
        baseSpeed = parseInt(this.value, 10);
        updateSliderValues();
    });

    fakeCountSlider.addEventListener('input', function () {
        fakeTargetCount = parseInt(this.value, 10);
        updateSliderValues();
    });

    target.addEventListener('click', handleTargetClick);
    startButton.addEventListener('click', startGame);
}

function initializeGame() {
    record = loadRecord();
    updateSliderValues();
    updateDisplay({ pointsDisplay, timeDisplay, recordDisplay, points, remainingTime, record });
    setupEventListeners();
}

initializeGame();
