import crypto from 'crypto';
import logger from '../utils/logger.js';
import metricsService from '../services/metricsService.js';

export function requestLogger(req, res, next) {
    const start = Date.now();
    const requestId = req.headers['x-request-id'] || `req_${crypto.randomUUID()}`;
    req.id = requestId;
    res.setHeader('X-Request-Id', requestId);

    res.on('finish', () => {
        const duration = Date.now() - start;
        const statusCode = res.statusCode;

        // Record metrics for observability
        metricsService.recordHttpRequest(statusCode, duration);

        const logData = {
            requestId,
            timestamp: new Date().toISOString(),
            route: req.originalUrl || req.url,
            method: req.method,
            status: statusCode,
            duration,
            userId: req.user?.userId || null,
        };

        if (statusCode >= 500) {
            logger.error('HTTP Request 5xx', logData);
        } else if (statusCode >= 400) {
            logger.warn('HTTP Request 4xx', logData);
        } else {
            logger.info('HTTP Request OK', logData);
        }
    });

    next();
}

export default requestLogger;
