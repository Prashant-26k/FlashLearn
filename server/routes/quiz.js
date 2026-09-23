import express from 'express';
import QuizResult from '../models/QuizResult.js';

const router = express.Router();

// POST save quiz result
router.post('/result', async (req, res) => {
    try {
        const { deckIds, score, total } = req.body;
        const result = new QuizResult({
            deckIds: deckIds || [],
            score,
            total,
            userId: req.user.userId,
        });
        await result.save();
        res.status(201).json(result);
    } catch {
        res.status(500).json({ error: 'Failed to save quiz result' });
    }
});

// GET quiz history
router.get('/history', async (req, res) => {
    try {
        const results = await QuizResult.find({ userId: req.user.userId })
            .sort('-date')
            .limit(20);
        res.json(results);
    } catch {
        res.status(500).json({ error: 'Failed to fetch quiz history' });
    }
});

// GET quiz stats — aggregated stats for dashboard
// Returns: totalCorrect, totalQuestions, quizzesTaken, activityDates, dailyActivity, streak data
router.get('/stats', async (req, res) => {
    try {
        const results = await QuizResult.find({ userId: req.user.userId }).sort('-date');

        const quizzesTaken = results.length;
        const totalCorrect = results.reduce((sum, r) => sum + (r.score || 0), 0);
        const totalQuestions = results.reduce((sum, r) => sum + (r.total || 0), 0);
        const activityDates = results.map(r => r.date);

        // Optional client timezone offset in minutes (e.g. from new Date().getTimezoneOffset())
        const tzOffsetMin = parseInt(req.query.tzOffset, 10);
        const hasTzOffset = !Number.isNaN(tzOffsetMin);

        // Helper to format date to 'YYYY-MM-DD' adjusted for user's timezone
        const getDayKey = (dateObj) => {
            if (hasTzOffset) {
                const localMs = dateObj.getTime() - (tzOffsetMin * 60000);
                return new Date(localMs).toISOString().slice(0, 10);
            }
            const d = new Date(dateObj);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        };

        // Group activity per calendar day
        const dailyActivity = {};
        results.forEach(r => {
            const key = getDayKey(new Date(r.date));
            if (!dailyActivity[key]) {
                dailyActivity[key] = { quizzes: 0, totalQuestions: 0, totalCorrect: 0 };
            }
            dailyActivity[key].quizzes += 1;
            dailyActivity[key].totalQuestions += (r.total || 0);
            dailyActivity[key].totalCorrect += (r.score || 0);
        });

        const daySet = new Set(Object.keys(dailyActivity));

        const now = new Date();
        const todayStr = getDayKey(now);
        const yesterdayMs = now.getTime() - 24 * 60 * 60 * 1000;
        const yesterdayStr = getDayKey(new Date(yesterdayMs));

        // Count current streak from today backwards
        let currentStreak = 0;
        let checkMs = now.getTime();
        let checkStr = todayStr;
        while (daySet.has(checkStr)) {
            currentStreak++;
            checkMs -= 24 * 60 * 60 * 1000;
            checkStr = getDayKey(new Date(checkMs));
        }

        // If today has no activity yet, but yesterday does, the streak is alive from yesterday
        if (currentStreak === 0 && daySet.has(yesterdayStr)) {
            checkMs = yesterdayMs;
            checkStr = yesterdayStr;
            while (daySet.has(checkStr)) {
                currentStreak++;
                checkMs -= 24 * 60 * 60 * 1000;
                checkStr = getDayKey(new Date(checkMs));
            }
        }

        // Longest streak: check consecutive active calendar days (UTC normalized to prevent DST bugs)
        const allDays = [...daySet].sort();
        let maxStreak = 0;
        let tempStreak = 0;
        let prevDate = null;
        for (const dayStr of allDays) {
            const currDate = new Date(dayStr + 'T00:00:00Z');
            if (prevDate) {
                const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
                if (diffDays === 1) {
                    tempStreak++;
                } else if (diffDays > 1) {
                    maxStreak = Math.max(maxStreak, tempStreak);
                    tempStreak = 1;
                }
            } else {
                tempStreak = 1;
            }
            prevDate = currDate;
        }
        maxStreak = Math.max(maxStreak, tempStreak, currentStreak);

        const totalActiveDays = daySet.size;

        res.json({
            quizzesTaken,
            totalCorrect,
            totalQuestions,
            activityDates,
            dailyActivity,
            currentStreak,
            maxStreak,
            totalActiveDays,
        });
    } catch {
        res.status(500).json({ error: 'Failed to fetch quiz stats' });
    }
});

export default router;
