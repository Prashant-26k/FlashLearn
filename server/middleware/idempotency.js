import IdempotencyKey from '../models/IdempotencyKey.js';
import mongoose from 'mongoose';

const memoryStore = new Map();

export function idempotency(req, res, next) {
    const key = req.headers['idempotency-key'];
    if (!key || req.method === 'GET' || req.method === 'HEAD') {
        return next();
    }

    const userId = req.user?.userId ? String(req.user.userId) : 'anonymous';
    const storeKey = `${userId}:${key}`;

    // 1. Check in-memory store
    const memCached = memoryStore.get(storeKey);
    if (memCached) {
        res.setHeader('X-Idempotent-Replay', 'true');
        return res.status(memCached.statusCode).json(memCached.body);
    }

    // 2. Check MongoDB if connected
    const checkDbAndProceed = async () => {
        if (mongoose.connection.readyState === 1) {
            try {
                const existing = await IdempotencyKey.findOne({ key, userId }).lean();
                if (existing) {
                    memoryStore.set(storeKey, { statusCode: existing.statusCode, body: existing.responseBody });
                    res.setHeader('X-Idempotent-Replay', 'true');
                    return res.status(existing.statusCode).json(existing.responseBody);
                }
            } catch {
                // Continue to execute request if DB check fails
            }
        }

        // Intercept response to store result
        const originalJson = res.json.bind(res);
        res.json = function (body) {
            const statusCode = res.statusCode || 200;
            // Only cache successful operations or client errors, not 500s
            if (statusCode < 500) {
                memoryStore.set(storeKey, { statusCode, body });
                // Clean up memory store if too large
                if (memoryStore.size > 2000) {
                    const firstKey = memoryStore.keys().next().value;
                    memoryStore.delete(firstKey);
                }

                if (mongoose.connection.readyState === 1) {
                    IdempotencyKey.create({
                        key,
                        userId,
                        statusCode,
                        responseBody: body,
                    }).catch(() => {});
                }
            }
            return originalJson(body);
        };

        next();
    };

    checkDbAndProceed().catch(next);
}

export default idempotency;
