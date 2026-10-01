export class ProviderError extends Error {
    constructor(message, { status, retryable = false, errorType = 'PROVIDER_ERROR', retryAfterMs = 0 } = {}) {
        super(message);
        this.name = 'ProviderError';
        this.status = status;
        this.retryable = retryable;
        this.errorType = errorType;
        this.retryAfterMs = retryAfterMs;
    }
}

export function classifyProviderError(error) {
    if (error instanceof ProviderError) return error;
    const status = error.status || error.statusCode
        || Number(error.message?.match(/\b(400|401|403|404|408|429|500|502|503|504)\b/)?.[1]);
    const retryable = !status || [408, 429, 500, 502, 503, 504].includes(status);
    return new ProviderError(error.message || 'Provider request failed', {
        status,
        retryable,
        errorType: status === 429 ? 'RATE_LIMITED' : retryable ? 'TEMPORARY_FAILURE' : 'PROVIDER_ERROR',
    });
}
