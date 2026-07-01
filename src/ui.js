export function getElements() {
    return {
        gameField: document.getElementById('spielfeld'),
        target: document.getElementById('target'),
        startButton: document.getElementById('start'),
        pointsDisplay: document.getElementById('punkte'),
        timeDisplay: document.getElementById('zeit'),
        recordDisplay: document.getElementById('rekord'),
        highscoreEntries: document.getElementById('highscoreEntries'),
        highscoreEntryForm: document.getElementById('highscoreEntryForm'),
        highscoreText: document.getElementById('highscoreText'),
        submitHighscore: document.getElementById('submitHighscore'),
        clearHighscores: document.getElementById('clearHighscores'),
        message: document.getElementById('meldung'),
        gameTimeSlider: document.getElementById('gameTimeSlider'),
        speedSlider: document.getElementById('speedSlider'),
        fakeCountSlider: document.getElementById('fakeCountSlider'),
        difficultySelector: document.getElementById('difficultySelector'),
        squareCountSlider: document.getElementById('squareCountSlider'),
        starCountSlider: document.getElementById('starCountSlider'),
        gameTimeValue: document.getElementById('gameTimeValue'),
        speedValue: document.getElementById('speedValue'),
        fakeCountValue: document.getElementById('fakeCountValue'),
        squareCountValue: document.getElementById('squareCountValue'),
        starCountValue: document.getElementById('starCountValue')
    };
}

function createSvgTarget(type) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 128 128');
    svg.setAttribute('aria-hidden', 'true');
    svg.classList.add('target-svg');

    const assetUrl = type === 'apple'
        ? new URL('../assets/apple.svg', import.meta.url)
        : new URL('../assets/mine.svg', import.meta.url);
    const assetPath = assetUrl.toString();

    svg.setAttribute('data-asset', assetPath);

    const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
    image.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', assetPath);
    image.setAttribute('href', assetPath);
    image.setAttribute('width', '128');
    image.setAttribute('height', '128');
    image.setAttribute('x', '0');
    image.setAttribute('y', '0');
    svg.appendChild(image);

    return svg;
}

export function decorateTargetButton(button, type) {
    if (!button) return null;

    button.innerHTML = '';
    button.className = type === 'apple' ? 'target' : 'fake-target';
    button.setAttribute('aria-label', type === 'apple' ? 'Target' : 'Fake target');
    button.appendChild(createSvgTarget(type));
    return button;
}

export function createTargetButton(gameField) {
    const target = document.createElement('button');
    decorateTargetButton(target, 'apple');
    gameField.appendChild(target);
    return target;
}

export function createFakeTargetButton(gameField) {
    const fakeTarget = document.createElement('button');
    decorateTargetButton(fakeTarget, 'mine');
    gameField.appendChild(fakeTarget);
    return fakeTarget;
}
