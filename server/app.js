import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from 'passport';
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

import requestLogger from './middleware/requestLogger.js';
import errorHandler from './middleware/errorHandler.js';
import authMiddleware from './middleware/auth.js';
import healthRoutes from './routes/health.js';
import authRoutes, { callbackRouter as authCallbackRoutes } from './modules/auth/routes.js';
import deckRoutes from './modules/decks/routes.js';
import collectionRoutes from './modules/collections/routes.js';
import generateRoutes from './modules/generation/routes.js';
import quizRoutes from './modules/quiz/routes.js';
import exportRoutes from './modules/export/routes.js';
import preferencesRoutes from './modules/preferences/routes.js';
import { createCorsOptions } from './config/cors.js';
import configurePassport from './modules/auth/passport.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp() {
    const app = express();

    app.set('trust proxy', 1);

    app.use(cors(createCorsOptions()));
    app.use(cookieParser());
    app.use(requestLogger);
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));
    configurePassport(passport);
    app.use(passport.initialize());

    app.use(healthRoutes);

    app.use('/auth', authRoutes);
    app.use('/api/v1/auth', authRoutes);
    app.use('/', authCallbackRoutes);

    app.use('/api/v1/decks', authMiddleware, deckRoutes);
    app.use('/api/v1/collections', authMiddleware, collectionRoutes);
    app.use('/api/v1/generate', authMiddleware, generateRoutes);
    app.use('/api/v1/quiz', authMiddleware, quizRoutes);
    app.use('/api/v1/export', authMiddleware, exportRoutes);
    app.use('/api/v1/preferences', authMiddleware, preferencesRoutes);

    app.use('/api/decks', authMiddleware, deckRoutes);
    app.use('/api/collections', authMiddleware, collectionRoutes);
    app.use('/api/generate', authMiddleware, generateRoutes);
    app.use('/api/quiz', authMiddleware, quizRoutes);
    app.use('/api/export', authMiddleware, exportRoutes);
    app.use('/api/preferences', authMiddleware, preferencesRoutes);

    if (process.env.NODE_ENV === 'production') {
        app.use(express.static(path.join(__dirname, '../dist')));

        app.get(/^.*$/, (req, res) => {
            res.sendFile(path.join(__dirname, '../dist/index.html'));
        });
    }

    app.use(errorHandler);

    return app;
}

export default createApp;
