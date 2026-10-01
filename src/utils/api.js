import axios from 'axios';

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

// Response interceptor: normalization, 401 redirect, conflict detection, idempotent retry
api.interceptors.response.use(
    (response) => {
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
