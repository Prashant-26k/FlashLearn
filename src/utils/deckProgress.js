const READ_CARDS_PREFIX = 'deck_read_cards_';

function getStorageKey(deckId) {
    return `${READ_CARDS_PREFIX}${deckId}`;
}

export function getReadCards(deckId, cardCount = 0) {
    try {
        const stored = JSON.parse(localStorage.getItem(getStorageKey(deckId)) || '[]');
        if (!Array.isArray(stored)) return [];
        return [...new Set(stored)].filter(index => Number.isInteger(index) && index >= 0 && index < cardCount);
    } catch {
        return [];
    }
}

export function markCardRead(deckId, cardIndex, cardCount) {
    const readCards = getReadCards(deckId, cardCount);
    if (!readCards.includes(cardIndex)) {
        readCards.push(cardIndex);
        try {
            localStorage.setItem(getStorageKey(deckId), JSON.stringify(readCards));
        } catch {
            // Progress is best effort when browser storage is unavailable.
        }
    }
    return readCards;
}

export function getDeckReadPercentage(deck) {
    const cardCount = deck?.cards?.length || 0;
    if (!cardCount) return 0;
    return Math.round((getReadCards(deck._id, cardCount).length / cardCount) * 100);
}
