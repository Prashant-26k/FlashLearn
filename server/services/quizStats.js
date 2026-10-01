export function getDayKey(date, tzOffsetMin) {
    const value = new Date(date);
    if (Number.isFinite(tzOffsetMin)) {
        return new Date(value.getTime() - tzOffsetMin * 60000).toISOString().slice(0, 10);
    }
    return value.toISOString().slice(0, 10);
}

function shiftDay(dayKey, amount) {
    const date = new Date(`${dayKey}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + amount);
    return date.toISOString().slice(0, 10);
}

function longestStreak(days) {
    let longest = 0;
    let current = 0;
    let previous = null;

    for (const day of [...days].sort()) {
        if (previous && day === shiftDay(previous, 1)) {
            current += 1;
        } else {
            current = 1;
        }
        longest = Math.max(longest, current);
        previous = day;
    }
    return longest;
}

export function calculateQuizStats(results, { now = new Date(), tzOffsetMin } = {}) {
    const dailyActivity = {};
    for (const result of results) {
        const key = getDayKey(result.date, tzOffsetMin);
        dailyActivity[key] ||= { quizzes: 0, totalQuestions: 0, totalCorrect: 0 };
        dailyActivity[key].quizzes += 1;
        dailyActivity[key].totalQuestions += result.total || 0;
        dailyActivity[key].totalCorrect += result.score || 0;
    }

    const activeDays = new Set(Object.keys(dailyActivity));
    const today = getDayKey(now, tzOffsetMin);
    const firstDay = activeDays.has(today) ? today : shiftDay(today, -1);
    let currentStreak = 0;
    for (let day = firstDay; activeDays.has(day); day = shiftDay(day, -1)) {
        currentStreak += 1;
    }

    return {
        quizzesTaken: results.length,
        totalCorrect: results.reduce((sum, result) => sum + (result.score || 0), 0),
        totalQuestions: results.reduce((sum, result) => sum + (result.total || 0), 0),
        activityDates: results.map(result => result.date),
        dailyActivity,
        currentStreak,
        maxStreak: longestStreak(activeDays),
        totalActiveDays: activeDays.size,
    };
}
