const PRODUCTION_CLIENT_URL = 'https://studywithflashlearn.netlify.app';

function getClientUrl() {
    const isProduction = process.env.NODE_ENV === 'production';
    let clientUrl = (process.env.CLIENT_URL || (isProduction ? '' : 'http://localhost:5173'))
        .trim()
        .replace(/\/$/, '');

    if (clientUrl.startsWith('https://localhost') || clientUrl.startsWith('https://127.0.0.1')) {
        clientUrl = clientUrl.replace(/^https:\/\//i, 'http://');
    }

    return clientUrl;
}

export function getAllowedOrigins() {
    const isProduction = process.env.NODE_ENV === 'production';

    return [
        getClientUrl(),
        PRODUCTION_CLIENT_URL,
        ...(!isProduction ? [
            'http://localhost:5173',
            'http://localhost:3000',
            'http://127.0.0.1:5173',
        ] : []),
    ].filter(Boolean);
}

export function createCorsOptions() {
    const allowedOrigins = getAllowedOrigins();

    return {
        origin(origin, callback) {
            if (!origin) return callback(null, true);
            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            return callback(new Error(`CORS origin not allowed: ${origin}`));
        },
        credentials: true,
    };
}

export const corsOptions = createCorsOptions();

