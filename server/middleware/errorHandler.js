import { AppError, ValidationError } from '../utils/errors.js';
import logger from '../utils/logger.js';
import { ZodError } from 'zod';

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
    const requestId = req.id || req.headers['x-request-id'] || 'req_unknown';

    let statusCode = 500;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'An internal server error occurred';
    let details = null;

    if (err instanceof AppError) {
        statusCode = err.statusCode;
        code = err.code;
        message = err.message;
        details = err.details;
    } else if (err instanceof ZodError) {
        statusCode = 400;
        code = 'VALIDATION_ERROR';
        message = 'Request validation failed';
        details = err.issues.map(i => ({
            field: i.path.join('.'),
            message: i.message,
        }));
    } else if (err.name === 'CastError') {
        statusCode = 400;
        code = 'INVALID_ID';
        message = `Invalid ${err.path || 'identifier'}: ${err.value}`;
    } else if (err.name === 'ValidationError') {
        // Mongoose validation error
        statusCode = 400;
        code = 'VALIDATION_ERROR';
        message = err.message;
        details = Object.values(err.errors || {}).map(e => ({
            field: e.path,
            message: e.message,
        }));
    } else if (err.code === 11000) {
        statusCode = 409;
        code = 'DUPLICATE_RESOURCE';
        message = 'A resource with this key already exists';
    } else if (err.type === 'entity.too.large' || err.code === 'LIMIT_FILE_SIZE') {
        statusCode = 413;
        code = 'PAYLOAD_TOO_LARGE';
        message = 'Payload or file exceeds maximum allowable size';
    } else {
        statusCode = err.status || err.statusCode || 500;
        if (statusCode >= 400 && statusCode < 500) {
            code = 'CLIENT_ERROR';
            message = err.message;
        } else {
            message = process.env.NODE_ENV === 'production'
                ? 'An internal server error occurred'
                : err.message || 'An internal server error occurred';
        }
    }

    logger.error('Request error:', {
        requestId,
        route: req.originalUrl || req.path,
        method: req.method,
        statusCode,
        code,
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
        userId: req.user?.userId || null,
    });

    const responsePayload = {
        error: {
            code,
            message,
            requestId,
            ...(details ? { details } : {}),
        },
        // Root fallback message for any legacy frontend consumption
        message,
    };

    res.status(statusCode).json(responsePayload);
}

export default errorHandler;
