export function updateDisplay({ pointsDisplay, timeDisplay, recordDisplay, points, remainingTime, record }) {
    pointsDisplay.textContent = points;
    timeDisplay.textContent = remainingTime;
    recordDisplay.textContent = record;
}

export function updateRecord(points, record) {
    return points > record ? points : record;
}

export function calculatePoints(currentPoints) {
    const nextPoints = currentPoints + 1;
    const bonusHits = [5, 10, 15];

    if (bonusHits.includes(nextPoints)) {
        return nextPoints + 1;
    }

    return nextPoints;
}
