import mongoose from 'mongoose';
import logger from './utils/logger.js';
import createApp from './app.js';

const app = createApp();
const PORT = Number(process.env.PORT) || 3001;
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

