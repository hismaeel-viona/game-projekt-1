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
        squareCountSlider: document.getElementById('squareCountSlider'),
        starCountSlider: document.getElementById('starCountSlider'),
        gameTimeValue: document.getElementById('gameTimeValue'),
        speedValue: document.getElementById('speedValue'),
        fakeCountValue: document.getElementById('fakeCountValue'),
        squareCountValue: document.getElementById('squareCountValue'),
        starCountValue: document.getElementById('starCountValue')
    };
}

export function createFakeTargetButton(gameField) {
    const fakeTarget = document.createElement('button');
    fakeTarget.className = 'fake-target';
    fakeTarget.setAttribute('aria-label', 'Fake target');
    gameField.appendChild(fakeTarget);
    return fakeTarget;
}
