export function getStudyQueue(cards, now = new Date()) {
    const timestamp = now.getTime();
    const indexed = cards.map((card, index) => ({ card, index }));
    const due = indexed.filter(({ card }) => !card.dueAt || new Date(card.dueAt).getTime() <= timestamp);
    const sortByDue = (a, b) => new Date(a.card.dueAt || 0).getTime() - new Date(b.card.dueAt || 0).getTime() || a.index - b.index;
    const ordered = due.sort(sortByDue);
    if (ordered.length) return ordered.map(({ index }) => index);
    return indexed.sort(sortByDue).slice(0, 1).map(({ index }) => index);
}

export function reviewCard(card, rating, now = new Date()) {
    const intervals = { again: 0, good: 1, easy: 4 };
    if (!Object.prototype.hasOwnProperty.call(intervals, rating)) throw new Error('Invalid review rating');
    const intervalDays = rating === 'again' ? 0 : Math.max(1, Math.round((card.intervalDays || 1) * intervals[rating]));
    return {
        ...card,
        dueAt: new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000),
        intervalDays,
        repetitions: (card.repetitions || 0) + (rating === 'again' ? 0 : 1),
        lapses: (card.lapses || 0) + (rating === 'again' ? 1 : 0),
        easeFactor: Math.max(1.3, (card.easeFactor || 2.5) + (rating === 'easy' ? 0.15 : rating === 'again' ? -0.2 : 0)),
        lastReviewedAt: now,
    };
}
