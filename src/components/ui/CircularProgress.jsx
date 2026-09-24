/**
 * CircularProgress — reusable SVG circle progress ring
 * Used in: Dashboard recent deck items, MyDecks cards
 */
export default function CircularProgress({
    percent = 0,
    size = 48,
    stroke = 3,
    color = '#4b2bee',
    trackColor = '#27272a',
    children,
}) {
    const r = (size - stroke * 2) / 2;
    const circumference = 2 * Math.PI * r;
    const offset = circumference - (percent / 100) * circumference;
    const center = size / 2;

    return (
        <div style={{ position: 'relative', width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg
                width={size}
                height={size}
                style={{ transform: 'rotate(-90deg)', display: 'block' }}
                viewBox={`0 0 ${size} ${size}`}
            >
                {/* Track */}
                <circle
                    cx={center}
                    cy={center}
                    r={r}
                    fill="none"
                    stroke={trackColor}
                    strokeWidth={stroke}
                />
                {/* Progress */}
                <circle
                    cx={center}
                    cy={center}
                    r={r}
                    fill="none"
                    stroke={color}
                    strokeWidth={stroke}
                    strokeDasharray={`${circumference} ${circumference}`}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 500ms ease' }}
                />
            </svg>
            {/* Center content */}
            {children && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {children}
                </div>
            )}
        </div>
    );
}

