const FLIP_DURATION = { slow: '1.0s', normal: '0.6s', fast: '0.4s' };

export function getFlipDuration() {
    try {
        const prefs = JSON.parse(localStorage.getItem('flashlearn_prefs') || '{}');
        return FLIP_DURATION[prefs.flipSpeed] || FLIP_DURATION.normal;
    } catch {
        return FLIP_DURATION.normal;
    }
}
