export class AppError extends Error {
    constructor(message, { statusCode = 500, code = 'INTERNAL_ERROR', details = null } = {}) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class ValidationError extends AppError {
    constructor(message = 'Validation failed', details = null) {
        super(message, { statusCode: 400, code: 'VALIDATION_ERROR', details });
    }
}

export class AuthenticationError extends AppError {
    constructor(message = 'Authentication required') {
        super(message, { statusCode: 401, code: 'AUTHENTICATION_REQUIRED' });
    }
}

export class AuthorizationError extends AppError {
    constructor(message = 'You do not have permission to access this resource') {
        super(message, { statusCode: 403, code: 'FORBIDDEN' });
    }
}

export class NotFoundError extends AppError {
    constructor(message = 'Resource not found', code = 'NOT_FOUND') {
        super(message, { statusCode: 404, code });
    }
}

export class ConflictError extends AppError {
    constructor(message = 'Resource conflict occurred', code = 'CONFLICT', details = null) {
        super(message, { statusCode: 409, code, details });
    }
}

export class RateLimitError extends AppError {
    constructor(message = 'Too many requests, please try again later') {
        super(message, { statusCode: 429, code: 'RATE_LIMIT_EXCEEDED' });
    }
}

export class ExternalServiceError extends AppError {
    constructor(message = 'External service error occurred', details = null) {
        super(message, { statusCode: 502, code: 'EXTERNAL_SERVICE_ERROR', details });
    }
}

export class DatabaseError extends AppError {
    constructor(message = 'Database operation failed', details = null) {
        super(message, { statusCode: 500, code: 'DATABASE_ERROR', details });
    }
}
