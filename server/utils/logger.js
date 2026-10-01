import winston from 'winston';
import fs from 'fs';
import path from 'path';

// Ensure logs directory exists
const logsDir = path.resolve('logs');
if (!fs.existsSync(logsDir)) {
    try {
        fs.mkdirSync(logsDir, { recursive: true });
    } catch {
        // Ignore if unable to create directory (e.g. read-only envs)
    }
}

const sanitizeFilter = winston.format((info) => {
    const sensitiveKeys = ['password', 'token', 'jwt', 'secret', 'authorization', 'cookie', 'buffer', 'content', 'apikey', 'key'];
    
    function sanitize(obj) {
        if (!obj || typeof obj !== 'object') return obj;
        if (Array.isArray(obj)) return obj.map(sanitize);
        const clean = {};
        for (const [key, val] of Object.entries(obj)) {
            if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
                clean[key] = '[REDACTED]';
            } else if (typeof val === 'object' && val !== null) {
                clean[key] = sanitize(val);
            } else {
                clean[key] = val;
            }
        }
        return clean;
    }

    return sanitize(info);
});

const transports = [
    new winston.transports.Console({
        format: winston.format.combine(
            sanitizeFilter(),
            winston.format.colorize(),
            winston.format.timestamp(),
            winston.format.printf(({ level, message, timestamp, ...rest }) => {
                const restString = Object.keys(rest).length ? ` ${JSON.stringify(rest)}` : '';
                return `[${timestamp}] ${level}: ${message}${restString}`;
            })
        ),
    }),
];

try {
    transports.push(
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' })
    );
} catch {
    // Console fallback
}

export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'test' ? 'warn' : 'info'),
    format: winston.format.combine(
        sanitizeFilter(),
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports,
});

export default logger;
