export function updateDisplay({ pointsDisplay, timeDisplay, recordDisplay, points, remainingTime, record }) {
    pointsDisplay.textContent = points;
    timeDisplay.textContent = remainingTime;
    recordDisplay.textContent = record;
}

export function updateRecord(points, record) {
    return points > record ? points : record;
}
