const RECORD_KEY = 'reaction_hunter_record';
const HIGHSCORE_LIST_KEY = 'reaction_hunter_highscores';

export function loadRecord() {
    try {
        const saved = localStorage.getItem(RECORD_KEY);
        return saved !== null ? parseInt(saved, 10) || 0 : 0;
    } catch (e) {
        return 0;
    }
}

export function saveRecord(record) {
    try {
        localStorage.setItem(RECORD_KEY, String(record));
    } catch (e) {
        // ignore storage errors
    }
}

export function loadHighscoreList() {
    try {
        const saved = localStorage.getItem(HIGHSCORE_LIST_KEY);
        const list = saved ? JSON.parse(saved) : [];
        return Array.isArray(list) ? list : [];
    } catch (e) {
        return [];
    }
}

export function getHighscoreList() {
    return loadHighscoreList();
}

export function saveHighscoreEntry(entry) {
    try {
        const list = loadHighscoreList();
        const sanitized = {
            score: typeof entry.score === 'number' && Number.isFinite(entry.score) ? entry.score : 0,
            text: typeof entry.text === 'string' ? entry.text.slice(0, 50) : '',
            date: typeof entry.date === 'string' ? entry.date : new Date().toISOString(),
        };
        list.push(sanitized);
        list.sort((a, b) => b.score - a.score);
        localStorage.setItem(HIGHSCORE_LIST_KEY, JSON.stringify(list));
    } catch (e) {
        // ignore storage errors
    }
}

export function clearHighscoreList() {
    try {
        localStorage.removeItem(HIGHSCORE_LIST_KEY);
    } catch (e) {
        // ignore storage errors
    }
}
