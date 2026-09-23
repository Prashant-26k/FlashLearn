/**
 * ActivityHeatmap — Contribution graph matching Stitch SCREEN_15.
 * 40-week or 52-week horizontal calendar with 7 day cells per column,
 * month labels, and live submission/quiz counts from real backend data.
 */
export default function ActivityHeatmap({ activityDates = [], weeksCount = 40 }) {
    // Build activity count map: YYYY-MM-DD -> count
    const activityCount = {};
    activityDates.forEach(d => {
        const date = new Date(d);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        activityCount[key] = (activityCount[key] || 0) + 1;
    });

    // Generate weeks ending on the current week
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayOfWeek = today.getDay(); // 0 (Sun) to 6 (Sat)

    // Total days to generate = weeksCount * 7
    const totalDays = weeksCount * 7;
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - totalDays + (7 - dayOfWeek));

    const weeks = [];
    const months = [];
    let currentMonth = -1;

    let iterDate = new Date(startDate);
    for (let w = 0; w < weeksCount; w++) {
        const daysInWeek = [];
        for (let d = 0; d < 7; d++) {
            const key = `${iterDate.getFullYear()}-${String(iterDate.getMonth() + 1).padStart(2, '0')}-${String(iterDate.getDate()).padStart(2, '0')}`;
            const count = activityCount[key] || 0;
            const isFuture = iterDate > today;

            if (d === 0) {
                const month = iterDate.getMonth();
                if (month !== currentMonth) {
                    currentMonth = month;
                    months.push({
                        weekIndex: w,
                        label: iterDate.toLocaleDateString('en-US', { month: 'short' }),
                    });
                }
            }

            daysInWeek.push({
                key,
                count: isFuture ? 0 : count,
                isFuture,
                dateStr: iterDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            });

            iterDate.setDate(iterDate.getDate() + 1);
        }
        weeks.push(daysInWeek);
    }

    const getCellColor = (day) => {
        if (day.isFuture) return '#18181c';
        if (day.count === 0) return '#222222';
        if (day.count === 1) return '#166534';
        if (day.count === 2) return '#22c55e';
        if (day.count <= 4) return '#4ade80';
        return '#86efac';
    };

    return (
        <div className="overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
            <div className="inline-flex flex-col gap-1.5 min-w-max">
                {/* 40 Week Columns */}
                <div style={{ display: 'flex', gap: '3.5px' }}>
                    {weeks.map((week, wIdx) => (
                        <div key={wIdx} style={{ display: 'flex', flexDirection: 'column', gap: '3.5px' }}>
                            {week.map(day => (
                                <span
                                    key={day.key}
                                    style={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: 2,
                                        backgroundColor: getCellColor(day),
                                        display: 'inline-block',
                                        transition: 'transform 100ms ease, opacity 100ms ease',
                                        cursor: day.isFuture ? 'default' : 'pointer',
                                    }}
                                    title={day.isFuture ? '' : `${day.dateStr}: ${day.count} quiz${day.count !== 1 ? 'zes' : ''}`}
                                    aria-label={day.isFuture ? '' : `${day.dateStr}: ${day.count} quiz${day.count !== 1 ? 'zes' : ''}`}
                                />
                            ))}
                        </div>
                    ))}
                </div>

                {/* Months legend row */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 9,
                    color: 'var(--text-muted)',
                    fontWeight: 500,
                    padding: '0 2px',
                    letterSpacing: '-0.02em',
                }}>
                    {['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'].map((m, idx) => (
                        <span key={idx} style={{ width: 32, textAlign: 'left' }}>{m}</span>
                    ))}
                </div>
            </div>
        </div>
    );
}
