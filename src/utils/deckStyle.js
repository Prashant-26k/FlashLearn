export const DECK_ICONS = {
    bio: { icon: 'biotech', bg: 'rgba(75,43,238,0.12)', color: '#7c6af5' },
    science: { icon: 'science', bg: 'rgba(249,115,22,0.12)', color: '#f97316' },
    chemistry: { icon: 'science', bg: 'rgba(249,115,22,0.12)', color: '#f97316' },
    calculus: { icon: 'calculate', bg: 'rgba(20,184,166,0.12)', color: '#14b8a6' },
    algebra: { icon: 'calculate', bg: 'rgba(20,184,166,0.12)', color: '#14b8a6' },
    math: { icon: 'calculate', bg: 'rgba(20,184,166,0.12)', color: '#14b8a6' },
    history: { icon: 'history_edu', bg: 'rgba(168,85,247,0.12)', color: '#a855f7' },
    geo: { icon: 'public', bg: 'rgba(20,184,166,0.12)', color: '#14b8a6' },
    geography: { icon: 'public', bg: 'rgba(20,184,166,0.12)', color: '#14b8a6' },
    lang: { icon: 'translate', bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
    spanish: { icon: 'translate', bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
    french: { icon: 'translate', bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
    code: { icon: 'code', bg: 'rgba(34,197,94,0.12)', color: '#22c55e' },
    python: { icon: 'code', bg: 'rgba(34,197,94,0.12)', color: '#22c55e' },
    java: { icon: 'code', bg: 'rgba(34,197,94,0.12)', color: '#22c55e' },
    programming: { icon: 'code', bg: 'rgba(34,197,94,0.12)', color: '#22c55e' },
    machine: { icon: 'smart_toy', bg: 'rgba(6,182,212,0.12)', color: '#06b6d4' },
    ai: { icon: 'smart_toy', bg: 'rgba(6,182,212,0.12)', color: '#06b6d4' },
    ml: { icon: 'smart_toy', bg: 'rgba(6,182,212,0.12)', color: '#06b6d4' },
    medical: { icon: 'medical_services', bg: 'rgba(239,68,68,0.12)', color: '#ef4444' },
    anatomy: { icon: 'medical_services', bg: 'rgba(239,68,68,0.12)', color: '#ef4444' },
    music: { icon: 'music_note', bg: 'rgba(168,85,247,0.12)', color: '#a855f7' },
    art: { icon: 'palette', bg: 'rgba(168,85,247,0.12)', color: '#a855f7' },
};

export const FALLBACK_COLORS = [
    { bg: 'rgba(75,43,238,0.12)', color: '#7c6af5' },
    { bg: 'rgba(249,115,22,0.12)', color: '#f97316' },
    { bg: 'rgba(20,184,166,0.12)', color: '#14b8a6' },
    { bg: 'rgba(168,85,247,0.12)', color: '#a855f7' },
    { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
    { bg: 'rgba(34,197,94,0.12)', color: '#22c55e' },
];

export const DECK_ICON_COLORS = [
    { bg: 'rgba(75,43,238,0.12)', color: '#7c6af5' },
    { bg: 'rgba(249,115,22,0.12)', color: '#f97316' },
    { bg: 'rgba(20,184,166,0.12)', color: '#14b8a6' },
    { bg: 'rgba(168,85,247,0.12)', color: '#a855f7' },
    { bg: 'rgba(239,68,68,0.12)', color: '#ef4444' },
    { bg: 'rgba(34,197,94,0.12)', color: '#22c55e' },
];

function getDeckText(deck) {
    return `${deck.title || ''}${deck.topic || ''}`.toLowerCase();
}

export function getDeckStyle(deck, idx) {
    const text = getDeckText(deck);
    for (const [key, style] of Object.entries(DECK_ICONS)) {
        if (text.includes(key)) return style;
    }
    const fallback = FALLBACK_COLORS[idx % FALLBACK_COLORS.length];
    return { icon: deck.icon || 'layers', ...fallback };
}

export function getDeckIcon(deck) {
    const text = getDeckText(deck);
    for (const [key, style] of Object.entries(DECK_ICONS)) {
        if (text.includes(key)) return style.icon;
    }
    return 'layers';
}

export function getDeckColor(idx) {
    return DECK_ICON_COLORS[idx % DECK_ICON_COLORS.length];
}
