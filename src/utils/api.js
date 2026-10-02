import axios from 'axios';
import {
    getCacheEntry,
    setCached,
    invalidatePattern,
    clearCache,
    dedupedRequest,
    buildCacheKey,
    DEFAULT_FRESH_MS,
    DEFAULT_TTL_MS,
} from './cache';

export function getBackendBaseUrl() {
    const raw = (
        import.meta.env.VITE_AUTH_BASE_URL
        || import.meta.env.VITE_API_BASE_URL
        || (import.meta.env.DEV ? 'http://localhost:3001' : 'https://flashlearn-7ayp.onrender.com')
    );
    return raw.replace(/\/api\/?$/, '').replace(/\/$/, '');
}

const defaultBaseUrl = import.meta.env.DEV
    ? ''
    : (import.meta.env.VITE_API_BASE_URL || 'https://flashlearn-7ayp.onrender.com');

const api = axios.create({
    baseURL: defaultBaseUrl,
    timeout: 30000,
    withCredentials: true, // Send HttpOnly session cookies when available
});

// Request interceptor: attach token, request ID
api.interceptors.request.use((config) => {
    // 1. Dual authentication support: Bearer token + Cookie
    const token = localStorage.getItem('flashlearn_token');
    if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // 2. Section 16: Request ID tracing
    if (!config.headers['X-Request-Id']) {
        config.headers['X-Request-Id'] = `req_client_${Math.random().toString(36).slice(2, 10)}`;
    }

    return config;
});

// Response interceptor: auto-invalidation, normalization, 401 redirect, conflict detection, idempotent retry
api.interceptors.response.use(
    (response) => {
        // Automatic cache invalidation on successful mutations
        const method = response.config?.method?.toLowerCase();
        if (['post', 'put', 'patch', 'delete'].includes(method)) {
            const url = response.config?.url || '';
            if (url.includes('/auth/logout')) {
                clearCache();
            } else if (url.includes('/decks') || url.includes('/generate')) {
                invalidatePattern('/api/decks');
                invalidatePattern('/api/collections');
                invalidatePattern('/api/quiz/stats');
                invalidatePattern('decks');
                invalidatePattern('dashboard_decks');
                invalidatePattern('quiz_stats');
                invalidatePattern('deck_');
            } else if (url.includes('/collections')) {
                invalidatePattern('/api/collections');
                invalidatePattern('/api/decks');
                invalidatePattern('collections');
                invalidatePattern('decks');
            } else if (url.includes('/quiz')) {
                invalidatePattern('/api/quiz');
                invalidatePattern('quiz_stats');
            } else if (url.includes('/preferences')) {
                invalidatePattern('/api/preferences');
            }
        }
        return response;
    },
    async (error) => {
        const config = error.config;
        const status = error.response?.status;

        // Section 2: Normalize structured error responses
        if (error.response?.data?.error) {
            const errData = error.response.data.error;
            if (typeof errData === 'object' && errData.message) {
                error.apiCode = errData.code;
                error.apiMessage = errData.message;
                error.apiDetails = errData.details;
            } else if (typeof errData === 'string') {
                error.apiMessage = errData;
            }
        }

        // Section 6: Mark conflict errors
        if (status === 409) {
            error.isConflict = true;
        }

        // Section 4: 401 handling
        if (status === 401) {
            localStorage.removeItem('flashlearn_token');
            clearCache();
            if (
                !config?.skipAuthRedirect &&
                typeof window !== 'undefined' &&
                window.location.pathname !== '/login' &&
                window.location.pathname !== '/'
            ) {
                window.location.href = '/login';
            }
        }

        // Section 19: Retry policy for idempotent GET requests on network error
        if (
            config &&
            config.method === 'get' &&
            !config._retried &&
            (!error.response || (status >= 502 && status <= 504))
        ) {
            config._retried = true;
            await new Promise(res => setTimeout(res, 1000));
            return api(config);
        }

        return Promise.reject(error);
    }
);

/**
 * Enhanced cached GET with in-flight deduplication and stale-while-revalidate.
 * Returns immediately from memory (0ms) when data is cached and fresh.
 */
api.getCached = async function (url, config = {}, options = {}) {
    const {
        ttlMs = DEFAULT_TTL_MS,
        freshMs = DEFAULT_FRESH_MS,
        forceFresh = false,
        onBackgroundUpdate,
    } = options;

    const cacheKey = buildCacheKey(url, config.params);
    const entry = getCacheEntry(cacheKey);

    // 1. Fresh cache hit: return immediately (0ms, no network call)
    if (entry && !forceFresh && entry.isFresh) {
        return { data: entry.data, status: 200, statusText: 'OK', headers: {}, config, cached: true };
    }

    // 2. Stale cache hit (within TTL): return stale data immediately (0ms) and revalidate in background
    if (entry && !forceFresh && Date.now() <= entry.expiresAt) {
        dedupedRequest(cacheKey, () => api.get(url, config))
            .then((res) => {
                const freshData = res.data;
                setCached(cacheKey, freshData, ttlMs, freshMs);
                if (onBackgroundUpdate && JSON.stringify(entry.data) !== JSON.stringify(freshData)) {
                    onBackgroundUpdate(freshData);
                }
            })
            .catch(() => {});

        return { data: entry.data, status: 200, statusText: 'OK', headers: {}, config, cached: true, stale: true };
    }

    // 3. Cache miss / expired / forced refresh: fetch over network with in-flight deduplication
    const res = await dedupedRequest(cacheKey, () => api.get(url, config));
    setCached(cacheKey, res.data, ttlMs, freshMs);
    return res;
};

export function getApiErrorMessage(error, defaultMsg = 'An unexpected error occurred') {
    if (!error) return defaultMsg;
    if (error.isConflict) {
        return 'Your deck was changed in another tab. Reload the latest version or review your local changes.';
    }
    return (
        error.apiMessage ||
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        defaultMsg
    );
}

export default api;
