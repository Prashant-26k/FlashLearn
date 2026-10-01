import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import logger from '../utils/logger.js';

// Models to back up
import User from '../models/User.js';
import Deck from '../models/Deck.js';
import Collection from '../models/Collection.js';
import QuizResult from '../models/QuizResult.js';
import DeckVisit from '../models/DeckVisit.js';
import GlobalUsage from '../models/GlobalUsage.js';
import UserUsage from '../models/UserUsage.js';

const RETENTION_DAYS = 30;

export async function runBackup(backupRootDir = path.resolve('backups')) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(backupRootDir, `backup-${timestamp}`);

    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    const uri = process.env.MONGODB_URI;
    if (!uri) {
        throw new Error('MONGODB_URI not configured. Cannot perform backup.');
    }

    if (mongoose.connection.readyState !== 1) {
        await mongoose.connect(uri);
    }

    logger.info(`Starting database backup to ${backupDir}...`);

    const collections = [
        { name: 'users', model: User },
        { name: 'decks', model: Deck },
        { name: 'collections', model: Collection },
        { name: 'quizresults', model: QuizResult },
        { name: 'deckvisits', model: DeckVisit },
        { name: 'globalusages', model: GlobalUsage },
        { name: 'userusages', model: UserUsage },
    ];

    const manifest = {
        timestamp: new Date().toISOString(),
        backupDir,
        counts: {},
    };

    for (const { name, model } of collections) {
        const docs = await model.find().lean();
        const filePath = path.join(backupDir, `${name}.json`);
        fs.writeFileSync(filePath, JSON.stringify(docs, null, 2), 'utf-8');
        manifest.counts[name] = docs.length;
        logger.info(`Backed up ${docs.length} documents from ${name}`);
    }

    fs.writeFileSync(path.join(backupDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf-8');
    logger.info('Backup completed successfully.');

    // Enforce retention policy
    enforceRetentionPolicy(backupRootDir, RETENTION_DAYS);

    return manifest;
}

export function enforceRetentionPolicy(backupRootDir, retentionDays) {
    if (!fs.existsSync(backupRootDir)) return;

    const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
    const entries = fs.readdirSync(backupRootDir);

    for (const entry of entries) {
        const fullPath = path.join(backupRootDir, entry);
        const stats = fs.statSync(fullPath);
        if (stats.isDirectory() && entry.startsWith('backup-') && stats.mtimeMs < cutoff) {
            fs.rmSync(fullPath, { recursive: true, force: true });
            logger.info(`Purged expired backup: ${entry}`);
        }
    }
}

if (process.argv[1] && process.argv[1].endsWith('backup.js')) {
    runBackup()
        .then(() => process.exit(0))
        .catch((err) => {
            logger.error('Backup failed:', err);
            process.exit(1);
        });
}

