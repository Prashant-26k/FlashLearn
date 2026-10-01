const INTERVALS = {
    again: 0,
    good: 1,
    easy: 4,
};

export function getStudyQueue(cards, now = new Date()) {
    const timestamp = now.getTime();
    const indexed = cards.map((card, index) => ({ card, index }));
    const due = indexed
        .filter(({ card }) => !card.dueAt || new Date(card.dueAt).getTime() <= timestamp)
        .sort((a, b) => {
            const dueA = a.card.dueAt ? new Date(a.card.dueAt).getTime() : 0;
            const dueB = b.card.dueAt ? new Date(b.card.dueAt).getTime() : 0;
            return dueA - dueB || a.index - b.index;
        });

    if (due.length) return due.map(({ index }) => index);

    // Keep a session useful when every card is scheduled for later.
    return indexed
        .sort((a, b) => new Date(a.card.dueAt).getTime() - new Date(b.card.dueAt).getTime() || a.index - b.index)
        .slice(0, 1)
        .map(({ index }) => index);
}

export function reviewCard(card, rating, now = new Date()) {
    if (!Object.prototype.hasOwnProperty.call(INTERVALS, rating)) {
        throw new Error('Invalid review rating');
    }

    const repetitions = (card.repetitions || 0) + (rating === 'again' ? 0 : 1);
    const intervalDays = rating === 'again'
        ? 0
        : Math.max(1, Math.round((card.intervalDays || 0 || 1) * INTERVALS[rating]));
    const dueAt = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);

    return {
        ...card,
        dueAt,
        intervalDays,
        repetitions,
        lapses: (card.lapses || 0) + (rating === 'again' ? 1 : 0),
        easeFactor: Math.max(1.3, (card.easeFactor || 2.5) + (rating === 'easy' ? 0.15 : rating === 'again' ? -0.2 : 0)),
        lastReviewedAt: now,
    };
}
