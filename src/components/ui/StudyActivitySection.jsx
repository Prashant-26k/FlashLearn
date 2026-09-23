import { useState, useRef } from 'react';

/**
 * StudyActivitySection — Redesigned learning streak and activity heatmap.
 * Features:
 * - Prominent streak hero with immediate 1-second comprehension.
 * - Electric Indigo color scale for FlashLearn identity.
 * - Clean supporting statistics (Active Days, Longest Streak, Total Sessions).
 * - 52-week horizontal contribution graph with day-of-week labels and month headers.
 * - Rich interactive floating tooltip with genuine quiz & question metrics.
 * - Polished empty & active states with motivational guidance.
 */
export default function StudyActivitySection({ quizStats, statsLoading, onStartReview }) {
    const [hoveredDay, setHoveredDay] = useState(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    const containerRef = useRef(null);

    const currentStreak = quizStats?.currentStreak ?? 0;
    const maxStreak = quizStats?.maxStreak ?? 0;
    const totalActiveDays = quizStats?.totalActiveDays ?? 0;
    const quizzesTaken = quizStats?.quizzesTaken ?? 0;
    const dailyActivity = quizStats?.dailyActivity || {};

    // Generate 52 weeks (364 days) up to today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayOfWeek = today.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat

    // 52 weeks = 364 days
    const WEEKS_COUNT = 52;
    const totalDays = WEEKS_COUNT * 7;
    // Align so the last column ends on Saturday or today's week
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - totalDays + (7 - dayOfWeek));

    const weeks = [];
    const monthLabels = [];
    let lastMonth = -1;

    const iterDate = new Date(startDate);
    for (let w = 0; w < WEEKS_COUNT; w++) {
        const daysInWeek = [];
        for (let d = 0; d < 7; d++) {
            const y = iterDate.getFullYear();
            const m = String(iterDate.getMonth() + 1).padStart(2, '0');
            const dayNum = String(iterDate.getDate()).padStart(2, '0');
            const key = `${y}-${m}-${dayNum}`;

            const activity = dailyActivity[key];
            const isFuture = iterDate > today;

            // Record month label at top on first day of week
            if (d === 0) {
                const monthIndex = iterDate.getMonth();
                if (monthIndex !== lastMonth) {
                    lastMonth = monthIndex;
                    monthLabels.push({
                        weekIdx: w,
                        label: iterDate.toLocaleDateString('en-US', { month: 'short' }),
                    });
                }
            }

            daysInWeek.push({
                key,
                quizzes: activity ? activity.quizzes : 0,
                totalQuestions: activity ? activity.totalQuestions : 0,
                totalCorrect: activity ? activity.totalCorrect : 0,
                isFuture,
                dateStr: iterDate.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                }),
            });

            iterDate.setDate(iterDate.getDate() + 1);
        }
        weeks.push(daysInWeek);
    }

    // Intensity scale using Electric Indigo palette
    const getCellColor = (day) => {
        if (day.isFuture) return '#141418';
        if (day.quizzes === 0) return '#1b1b22';
        if (day.quizzes === 1) return 'rgba(75, 43, 238, 0.40)';
        if (day.quizzes === 2) return 'rgba(75, 43, 238, 0.65)';
        if (day.quizzes <= 4) return 'rgba(75, 43, 238, 0.88)';
        return '#7c6af5';
    };

    const handleMouseEnter = (day, e) => {
        if (day.isFuture) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const containerRect = containerRef.current?.getBoundingClientRect() || { left: 0, top: 0, width: 600 };
        const rawX = rect.left - containerRect.left + rect.width / 2;
        const clampedX = Math.max(70, Math.min(rawX, (containerRect.width || 600) - 100));
        setTooltipPos({
            x: clampedX,
            y: rect.top - containerRect.top,
        });
        setHoveredDay(day);
    };

    const handleMouseLeave = () => {
        setHoveredDay(null);
    };

    return (
        <section
            ref={containerRef}
            style={{
                position: 'relative',
                background: '#141417',
                border: '1px solid #27272a',
                borderRadius: 16,
                padding: '22px 24px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
                marginBottom: 32,
            }}
        >
            {/* ── 1. Section Header ── */}
            <div style={{
                display: 'flex', flexWrap: 'wrap', alignItems: 'center',
                justifyContent: 'space-between', gap: 12, paddingBottom: 18,
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: 'rgba(75, 43, 238, 0.12)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--accent)' }}>
                            local_fire_department
                        </span>
                    </div>
                    <div>
                        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.02em', margin: 0 }}>
                            Study Activity
                        </h2>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, marginTop: 1 }}>
                            Your learning activity and streak progress over the past year
                        </p>
                    </div>
                </div>

                {/* Status Pill */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {currentStreak > 0 ? (
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '4px 12px', borderRadius: 999,
                            background: 'rgba(52, 211, 153, 0.10)',
                            border: '1px solid rgba(52, 211, 153, 0.25)',
                            color: '#34d399', fontSize: 12, fontWeight: 600,
                        }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px #34d399' }} />
                            Streak Active
                        </span>
                    ) : (
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '4px 12px', borderRadius: 999,
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid #27272a',
                            color: 'var(--text-muted)', fontSize: 12, fontWeight: 500,
                        }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#71717a' }} />
                            No Active Streak
                        </span>
                    )}
                </div>
            </div>

            {/* ── 2. Prominent Streak Hero & Stats ── */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 14,
                padding: '20px 0',
                alignItems: 'stretch',
            }}>
                {/* Hero Streak Card */}
                <div style={{
                    gridColumn: 'span 1',
                    background: currentStreak > 0
                        ? 'linear-gradient(135deg, rgba(75, 43, 238, 0.16) 0%, rgba(20, 20, 24, 0.8) 100%)'
                        : '#17171c',
                    border: currentStreak > 0 ? '1px solid rgba(75, 43, 238, 0.35)' : '1px solid #27272a',
                    borderRadius: 14,
                    padding: '16px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: 104,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{
                            fontSize: 34, lineHeight: 1,
                            filter: currentStreak > 0 ? 'drop-shadow(0 2px 8px rgba(249, 115, 22, 0.4))' : 'grayscale(1)',
                        }}>
                            🔥
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                                <span style={{
                                    fontSize: 32, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1,
                                    color: currentStreak > 0 ? '#ffffff' : '#a1a1aa',
                                }}>
                                    {statsLoading ? '—' : currentStreak}
                                </span>
                                <span style={{ fontSize: 14, fontWeight: 700, color: currentStreak > 0 ? '#f97316' : '#a1a1aa' }}>
                                    Day Streak
                                </span>
                            </div>
                            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.3 }}>
                                {currentStreak > 0
                                    ? 'Keep it going! Complete a study session today.'
                                    : 'Review cards today to start your learning streak.'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Supporting Stat 1: Active Days */}
                <div style={{
                    background: '#17171c',
                    border: '1px solid #27272a',
                    borderRadius: 14,
                    padding: '16px 18px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#34d399' }}>calendar_today</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Active Days
                        </span>
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.03em' }}>
                        {statsLoading ? '—' : totalActiveDays}
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        in the past year
                    </span>
                </div>

                {/* Supporting Stat 2: Longest Streak */}
                <div style={{
                    background: '#17171c',
                    border: '1px solid #27272a',
                    borderRadius: 14,
                    padding: '16px 18px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#eab308' }}>military_tech</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Longest Streak
                        </span>
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.03em' }}>
                        {statsLoading ? '—' : `${maxStreak} ${maxStreak === 1 ? 'day' : 'days'}`}
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        personal best
                    </span>
                </div>

                {/* Supporting Stat 3: Total Sessions */}
                <div style={{
                    background: '#17171c',
                    border: '1px solid #27272a',
                    borderRadius: 14,
                    padding: '16px 18px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--accent)' }}>school</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Study Sessions
                        </span>
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.03em' }}>
                        {statsLoading ? '—' : quizzesTaken}
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        quizzes completed
                    </span>
                </div>
            </div>

            {/* ── 3. Heatmap Container ── */}
            <div style={{
                background: '#111114',
                border: '1px solid #222228',
                borderRadius: 12,
                padding: '16px 16px 12px',
                position: 'relative',
            }}>
                <div style={{ overflowX: 'auto', paddingBottom: 6, scrollbarWidth: 'thin' }}>
                    <div style={{ minWidth: 780 }}>
                        {/* Month Headers */}
                        <div style={{ display: 'flex', marginLeft: 32, marginBottom: 6, fontSize: 10, color: '#71717a', fontWeight: 500 }}>
                            {monthLabels.map((m, idx) => (
                                <span
                                    key={idx}
                                    style={{
                                        display: 'inline-block',
                                        width: `${100 / 12}%`,
                                        textAlign: 'left',
                                        letterSpacing: '-0.01em',
                                    }}
                                >
                                    {m.label}
                                </span>
                            ))}
                        </div>

                        {/* Heatmap Grid with Day Labels on Left */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                            {/* Day-of-week column: Mon, Wed, Fri */}
                            <div style={{
                                display: 'flex', flexDirection: 'column', gap: 3.5,
                                fontSize: 9, color: '#71717a', fontWeight: 500,
                                width: 26, textAlign: 'right', paddingRight: 4,
                                userSelect: 'none',
                            }}>
                                <span style={{ height: 12, lineHeight: '12px' }}>Sun</span>
                                <span style={{ height: 12, lineHeight: '12px' }}>Mon</span>
                                <span style={{ height: 12, lineHeight: '12px' }}>Tue</span>
                                <span style={{ height: 12, lineHeight: '12px' }}>Wed</span>
                                <span style={{ height: 12, lineHeight: '12px' }}>Thu</span>
                                <span style={{ height: 12, lineHeight: '12px' }}>Fri</span>
                                <span style={{ height: 12, lineHeight: '12px' }}>Sat</span>
                            </div>

                            {/* 52 Week Columns */}
                            <div style={{ display: 'flex', gap: '3.5px', flex: 1 }}>
                                {weeks.map((week, wIdx) => (
                                    <div key={wIdx} style={{ display: 'flex', flexDirection: 'column', gap: '3.5px' }}>
                                        {week.map(day => (
                                            <button
                                                key={day.key}
                                                type="button"
                                                onClick={() => day.quizzes > 0 && onStartReview?.()}
                                                onMouseEnter={(e) => handleMouseEnter(day, e)}
                                                onMouseLeave={handleMouseLeave}
                                                onFocus={(e) => handleMouseEnter(day, e)}
                                                onBlur={handleMouseLeave}
                                                aria-label={day.isFuture ? 'Future date' : `${day.dateStr}: ${day.quizzes} sessions`}
                                                style={{
                                                    width: 12,
                                                    height: 12,
                                                    borderRadius: 2.5,
                                                    backgroundColor: getCellColor(day),
                                                    border: day.quizzes > 0
                                                        ? '1px solid rgba(255, 255, 255, 0.12)'
                                                        : '1px solid rgba(255, 255, 255, 0.03)',
                                                    padding: 0,
                                                    margin: 0,
                                                    cursor: day.isFuture ? 'default' : 'pointer',
                                                    transition: 'transform 120ms ease, opacity 120ms ease',
                                                    outline: 'none',
                                                }}
                                                tabIndex={day.isFuture ? -1 : 0}
                                            />
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── 4. Floating Interactive Tooltip ── */}
                {hoveredDay && (
                    <div
                        style={{
                            position: 'absolute',
                            left: tooltipPos.x,
                            top: tooltipPos.y - 70,
                            transform: 'translateX(-50%)',
                            background: '#1e1e24',
                            border: '1px solid #383842',
                            borderRadius: 8,
                            padding: '8px 12px',
                            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
                            pointerEvents: 'none',
                            zIndex: 40,
                            whiteSpace: 'nowrap',
                            animation: 'fadeUp 150ms ease forwards',
                        }}
                    >
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#ffffff' }}>
                            {hoveredDay.dateStr}
                        </div>
                        {hoveredDay.quizzes > 0 ? (
                            <div style={{ fontSize: 11, color: '#34d399', fontWeight: 600, marginTop: 2 }}>
                                {hoveredDay.quizzes} quiz {hoveredDay.quizzes === 1 ? 'session' : 'sessions'}
                                {hoveredDay.totalQuestions > 0 && (
                                    <span style={{ color: '#a1a1aa', fontWeight: 400 }}>
                                        {' '}· {hoveredDay.totalQuestions} questions
                                        {hoveredDay.totalQuestions > 0 && ` (${Math.round((hoveredDay.totalCorrect / hoveredDay.totalQuestions) * 100)}% accuracy)`}
                                    </span>
                                )}
                            </div>
                        ) : (
                            <div style={{ fontSize: 11, color: '#a1a1aa', marginTop: 2 }}>
                                No study activity on this day
                            </div>
                        )}
                    </div>
                )}

                {/* ── 5. Heatmap Footer: Motivation & Legend ── */}
                <div style={{
                    display: 'flex', flexWrap: 'wrap', alignItems: 'center',
                    justifyContent: 'space-between', gap: 12, marginTop: 12, paddingTop: 10,
                    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                }}>
                    {/* Motivational note or action */}
                    <div>
                        {currentStreak === 0 ? (
                            <button
                                onClick={onStartReview}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 6,
                                    background: 'transparent', border: 'none', color: 'var(--accent)',
                                    fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0,
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                                onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                            >
                                <span>Start a quiz today to begin your streak</span>
                                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_forward</span>
                            </button>
                        ) : (
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                🔥 Daily practice cements long-term memory.
                            </span>
                        )}
                    </div>

                    {/* Intensity Legend */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: '#71717a' }}>
                        <span>Less</span>
                        <div style={{ display: 'flex', gap: 3 }}>
                            {['#1b1b22', 'rgba(75, 43, 238, 0.40)', 'rgba(75, 43, 238, 0.65)', 'rgba(75, 43, 238, 0.88)', '#7c6af5'].map((color, idx) => (
                                <span
                                    key={idx}
                                    style={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: 2,
                                        backgroundColor: color,
                                        border: idx > 0 ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.03)',
                                        display: 'inline-block',
                                    }}
                                />
                            ))}
                        </div>
                        <span>More</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
