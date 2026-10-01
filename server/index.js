import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import path from 'path';
import { fileURLToPath } from 'url';

// Fallback loader using native Node process.loadEnvFile if available
if (typeof process.loadEnvFile === 'function') {
    try {
        process.loadEnvFile();
    } catch {
        // .env file already loaded or not present
    }
}

import logger from './utils/logger.js';
import requestLogger from './middleware/requestLogger.js';
import errorHandler from './middleware/errorHandler.js';
import authMiddleware from './middleware/auth.js';
import User from './models/User.js';

// Route imports
import healthRoutes from './routes/health.js';
import authRoutes, { callbackRouter as authCallbackRoutes } from './modules/auth/routes.js';
import deckRoutes from './modules/decks/routes.js';
import collectionRoutes from './modules/collections/routes.js';
import generateRoutes from './modules/generation/routes.js';
import quizRoutes from './modules/quiz/routes.js';
import exportRoutes from './modules/export/routes.js';
import preferencesRoutes from './modules/preferences/routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const CLIENT_URL = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');

// Trust proxy for secure cookies / HTTPS on Render and proxies
app.set('trust proxy', 1);

const allowedOrigins = [
    CLIENT_URL,
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'https://studywithflashlearn.netlify.app',
].filter(Boolean);

// ── Core Middleware ──
app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (
            allowedOrigins.includes(origin) ||
            origin.endsWith('.netlify.app') ||
            origin.startsWith('http://localhost:') ||
            origin.startsWith('http://127.0.0.1:')
        ) {
            return callback(null, true);
        }
        return callback(new Error(`CORS origin not allowed: ${origin}`));
    },
    credentials: true,
}));
app.use(cookieParser());
app.use(requestLogger);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// ── Passport Google Strategy ──
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/google/callback',
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
                logger.error('Passport Google Strategy Error during authentication:', err);
                done(err, null);
            }
        }
    ));
} else {
    logger.warn('⚠ Google OAuth is not configured — sign-in will be unavailable');
}

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

// ── Health & Metrics ──
app.use(healthRoutes);

// ── Auth Routes ──
app.use('/auth', authRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/', authCallbackRoutes);

// ── Section 15: API Versioning (v1) ──
app.use('/api/v1/decks', authMiddleware, deckRoutes);
app.use('/api/v1/collections', authMiddleware, collectionRoutes);
app.use('/api/v1/generate', authMiddleware, generateRoutes);
app.use('/api/v1/quiz', authMiddleware, quizRoutes);
app.use('/api/v1/export', authMiddleware, exportRoutes);
app.use('/api/v1/preferences', authMiddleware, preferencesRoutes);

// ── Backward-compatible /api routes ──
app.use('/api/decks', authMiddleware, deckRoutes);
app.use('/api/collections', authMiddleware, collectionRoutes);
app.use('/api/generate', authMiddleware, generateRoutes);
app.use('/api/quiz', authMiddleware, quizRoutes);
app.use('/api/export', authMiddleware, exportRoutes);
app.use('/api/preferences', authMiddleware, preferencesRoutes);

// ── Serve frontend in production ──
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../dist')));

    app.get(/^.*$/, (req, res) => {
        res.sendFile(path.join(__dirname, '../dist/index.html'));
    });
}

// ── Section 2: Global Centralized Error Handler ──
app.use(errorHandler);

// ── MongoDB Connection & Server Start ──
let server = null;

async function start() {
    const rawMongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || '';
    const mongoUri = rawMongoUri.trim().replace(/^(['"])(.*)\1$/, '$2').trim();

    try {
        if (mongoUri && mongoUri !== 'your_mongodb_connection_string_here') {
            await mongoose.connect(mongoUri);
            logger.info('✓ Connected to MongoDB');
            console.log('✓ Connected to MongoDB');
        } else {
            logger.warn('⚠ MONGODB_URI not configured — running without database');
            console.warn('⚠ MONGODB_URI not configured — running without database');
        }
    } catch (err) {
        logger.error('✗ MongoDB connection error:', { message: err.message });
        console.error('✗ MongoDB connection error:', err.message);
        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        }
    }

    server = app.listen(PORT, () => {
        logger.info(`✓ FlashLearn server running on http://localhost:${PORT}`);
        console.log(`✓ FlashLearn server running on http://localhost:${PORT}`);

        // Keep-alive ping mechanism for Render deployment
        const url = process.env.RENDER_EXTERNAL_URL;
        if (url) {
            const PING_INTERVAL = 10 * 60 * 1000;
            setInterval(async () => {
                try {
                    await fetch(`${url}/health/live`);
                } catch (error) {
                    logger.warn('Error pinging server:', { message: error.message });
                }
            }, PING_INTERVAL);
        }
    });

    return server;
}

// ── Section 29: Graceful Shutdown ──
async function gracefulShutdown(signal) {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);

    if (server) {
        server.close(async () => {
            logger.info('HTTP server closed, active requests completed.');
            try {
                if (mongoose.connection.readyState !== 0) {
                    await mongoose.connection.close();
                    logger.info('MongoDB connection closed.');
                }
                process.exit(0);
            } catch (err) {
                logger.error('Error during database disconnection:', err);
                process.exit(1);
            }
        });

        // Force shutdown after timeout if requests do not terminate
        setTimeout(() => {
            logger.error('Graceful shutdown timeout exceeded. Forcing exit.');
            process.exit(1);
        }, 10000);
    } else {
        process.exit(0);
    }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

if (process.env.NODE_ENV !== 'test') {
    start();
}

export { app, start };
export default app;

