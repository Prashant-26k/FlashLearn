export function SkeletonLine({ width = '100%', height = 16, style = {} }) {
    return <div className="skeleton" style={{ width, height, ...style }} />;
}

export function SkeletonCard({ style = {} }) {
    return (
        <div className="deck-card" style={{ ...style }}>
            <SkeletonLine width="60%" height={18} style={{ marginBottom: 12 }} />
            <SkeletonLine width="30%" height={14} style={{ marginBottom: 8 }} />
            <SkeletonLine width="40%" height={12} />
        </div>
    );
}

export function SkeletonGrid({ count = 6 }) {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </div>
    );
}
