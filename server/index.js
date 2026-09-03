import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from './models/User.js';
import authMiddleware from './middleware/auth.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Route imports
import authRoutes from './routes/auth.js';
import deckRoutes from './routes/decks.js';
import collectionRoutes from './routes/collections.js';
import generateRoutes from './routes/generate.js';
import quizRoutes from './routes/quiz.js';
import exportRoutes from './routes/export.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for secure cookies / HTTPS on Render
app.set('trust proxy', 1);

// ── Middleware ──
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// ── Passport Google Strategy ──
passport.use(new GoogleStrategy(
    {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/auth/google/callback',
        proxy: true,
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            let user = await User.findOne({ googleId: profile.id });
            if (!user) {
                user = await User.create({
                    googleId: profile.id,
                    displayName: profile.displayName,
                    email: profile.emails?.[0]?.value || '',
                    avatar: profile.photos?.[0]?.value || '',
                });
            } else {
                user.displayName = profile.displayName;
                user.avatar = profile.photos?.[0]?.value || user.avatar;
                await user.save();
            }
            done(null, user);
        } catch (err) {
            console.error('Passport Google Strategy Error during authentication:', err);
            done(err, null);
        }
    }
));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

// ── Routes ──
app.use('/auth', authRoutes);

// Protected API routes
app.use('/api/decks', authMiddleware, deckRoutes);
app.use('/api/collections', authMiddleware, collectionRoutes);
app.use('/api/generate', authMiddleware, generateRoutes);
app.use('/api/quiz', authMiddleware, quizRoutes);
app.use('/api/export', authMiddleware, exportRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../dist')));

    app.get(/^.*$/, (req, res) => {
        res.sendFile(path.join(__dirname, '../dist/index.html'));
    });
}

// ── MongoDB Connection & Server Start ──
async function start() {
    try {
        if (process.env.MONGODB_URI && process.env.MONGODB_URI !== 'your_mongodb_connection_string_here') {
            await mongoose.connect(process.env.MONGODB_URI);
            console.log('✓ Connected to MongoDB');
        } else {
            console.warn('⚠ MONGODB_URI not configured — running without database');
        }
    } catch (err) {
        console.error('✗ MongoDB connection error:', err.message);
        console.warn('⚠ Server running without database connection');
    }

    app.listen(PORT, () => {
        console.log(`✓ FlashLearn server running on http://localhost:${PORT}`);
        
        // ── Render Keep-Alive Ping Mechanism ──
        const url = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
        const PING_INTERVAL = 5 * 60 * 1000; // 5 minutes

        setInterval(async () => {
            try {
                const response = await fetch(`${url}/api/health`);
                console.log(`[${new Date().toISOString()}] Keep-alive ping to ${url}/api/health - Status: ${response.status}`);
            } catch (error) {
                console.error(`[${new Date().toISOString()}] Error pinging server:`, error.message);
            }
        }, PING_INTERVAL);
    });
}

start();