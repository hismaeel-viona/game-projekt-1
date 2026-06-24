export function loadRecord() {
    try {
        const saved = localStorage.getItem('reaction_hunter_record');
        return saved !== null ? parseInt(saved, 10) || 0 : 0;
    } catch (e) {
        return 0;
    }
}

export function saveRecord(record) {
    try {
        localStorage.setItem('reaction_hunter_record', String(record));
    } catch (e) {
        // ignore storage errors
    }
}
