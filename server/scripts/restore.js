import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import logger from '../utils/logger.js';

import User from '../models/User.js';
import Deck from '../models/Deck.js';
import Collection from '../models/Collection.js';
import QuizResult from '../models/QuizResult.js';
import DeckVisit from '../models/DeckVisit.js';
import GlobalUsage from '../models/GlobalUsage.js';
import UserUsage from '../models/UserUsage.js';

export async function runRestore(targetBackupDir) {
    if (!fs.existsSync(targetBackupDir)) {
        throw new Error(`Backup directory does not exist: ${targetBackupDir}`);
    }

    const manifestPath = path.join(targetBackupDir, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
        throw new Error(`Manifest file not found in ${targetBackupDir}`);
    }

    const uri = process.env.MONGODB_URI;
    if (!uri) {
        throw new Error('MONGODB_URI not configured. Cannot perform restore.');
    }

    if (mongoose.connection.readyState !== 1) {
        await mongoose.connect(uri);
    }

    logger.info(`Starting database restoration from ${targetBackupDir}...`);

    const collections = [
        { name: 'users', model: User },
        { name: 'decks', model: Deck },
        { name: 'collections', model: Collection },
        { name: 'quizresults', model: QuizResult },
        { name: 'deckvisits', model: DeckVisit },
        { name: 'globalusages', model: GlobalUsage },
        { name: 'userusages', model: UserUsage },
    ];

    const restoredCounts = {};

    for (const { name, model } of collections) {
        const filePath = path.join(targetBackupDir, `${name}.json`);
        if (!fs.existsSync(filePath)) {
            logger.warn(`No backup file found for ${name}, skipping.`);
            continue;
        }

        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        if (Array.isArray(data) && data.length > 0) {
            // Upsert / restore items
            await model.deleteMany({});
            await model.insertMany(data);
            restoredCounts[name] = data.length;
            logger.info(`Restored ${data.length} records into ${name}`);
        } else {
            restoredCounts[name] = 0;
        }
    }

    logger.info('Database restoration completed successfully.');
    return restoredCounts;
}

if (process.argv[1] && process.argv[1].endsWith('restore.js')) {
    const backupDir = process.argv[2];
    if (!backupDir) {
        console.error('Usage: node server/scripts/restore.js <path-to-backup-dir>');
        process.exit(1);
    }

    runRestore(path.resolve(backupDir))
        .then(() => process.exit(0))
        .catch((err) => {
            logger.error('Restore failed:', err);
            process.exit(1);
        });
}

