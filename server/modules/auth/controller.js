import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../../models/User.js';

export function getClientUrl() {
    let url = (process.env.CLIENT_URL || 'http://localhost:5173').trim().replace(/\/$/, '');
    if (url.startsWith('https://localhost') || url.startsWith('https://127.0.0.1')) {
        url = url.replace(/^https:\/\//i, 'http://');
    }
    return url;
}

const oauthStateCookie = 'flashlearn_oauth_state';

export function createOAuthState() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not configured');
    }
    const timestamp = Date.now().toString();
    const value = crypto.randomBytes(32).toString('hex');
    const dataToSign = `${value}.${timestamp}`;
    const signature = crypto
        .createHmac('sha256', secret)
        .update(dataToSign)
        .digest('hex');
    return `${dataToSign}.${signature}`;
}

export function isValidOAuthState(state) {
    if (!state || typeof state !== 'string') return false;
    const parts = state.split('.');
    const secret = process.env.JWT_SECRET;
    if (!secret) return false;

    // 3-part format: value.timestamp.signature
    if (parts.length === 3) {
        const [value, timestamp, signature] = parts;
        const time = parseInt(timestamp, 10);
        // Expire after 15 minutes (900,000 ms)
        if (isNaN(time) || Math.abs(Date.now() - time) > 15 * 60 * 1000) {
            return false;
        }
        const dataToSign = `${value}.${timestamp}`;
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(dataToSign)
            .digest('hex');
        const provided = Buffer.from(signature, 'hex');
        const expected = Buffer.from(expectedSignature, 'hex');
        return provided.length === expected.length && crypto.timingSafeEqual(provided, expected);
    }

    // 2-part legacy format: value.signature
    if (parts.length === 2) {
        const [value, signature] = parts;
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(value)
            .digest('hex');
        const provided = Buffer.from(signature, 'hex');
        const expected = Buffer.from(expectedSignature, 'hex');
        return provided.length === expected.length && crypto.timingSafeEqual(provided, expected);
    }

    return false;
}

export const authController = {
    initiateGoogle(req, res, next) {
        const targetClientUrl = getClientUrl();
        if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
            return res.redirect(`${targetClientUrl}/login?error=oauth_not_configured`);
        }
        let state;
        try {
            state = createOAuthState();
        } catch {
            return res.redirect(`${targetClientUrl}/login?error=oauth_not_configured`);
        }

        const isProd = process.env.NODE_ENV === 'production';
        res.cookie(oauthStateCookie, state, {
            httpOnly: true,
            sameSite: isProd ? 'none' : 'lax',
            secure: isProd,
            maxAge: 15 * 60 * 1000,
            path: '/', // Ensure cookie is sent to /google/callback
        });

        // Continue to passport
        req._oauthState = state;
        next();
    },

    validateState(req, res, next) {
        const state = req.query.state;
        const storedState = req.cookies?.[oauthStateCookie];
        const targetClientUrl = getClientUrl();

        const isProd = process.env.NODE_ENV === 'production';
        res.clearCookie(oauthStateCookie, {
            path: '/',
            secure: isProd,
            sameSite: isProd ? 'none' : 'lax',
        });

        // 1. Cryptographically verify the state signature & freshness
        if (!state || !isValidOAuthState(state)) {
            return res.redirect(`${targetClientUrl}/login?error=oauth_state_invalid`);
        }

        // 2. If browser preserved cookie, verify match
        if (storedState && storedState !== state) {
            return res.redirect(`${targetClientUrl}/login?error=oauth_state_invalid`);
        }

        next();
    },

    handleCallback(req, res) {
        const secret = process.env.JWT_SECRET;
        const token = jwt.sign(
            {
                userId: req.user._id,
                email: req.user.email,
                displayName: req.user.displayName,
                avatar: req.user.avatar,
            },
            secret,
            { expiresIn: '7d' }
        );

        const isProd = process.env.NODE_ENV === 'production';
        // Section 4: Secure + HttpOnly + SameSite cookie (SameSite=None for cross-origin Netlify/Render)
        res.cookie('flashlearn_token', token, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/',
        });

        // Also pass hash token for client compatibility if cookie isn't accepted
        res.redirect(`${getClientUrl()}/#token=${encodeURIComponent(token)}`);
    },

    async getMe(req, res) {
        if (!req.user) {
            return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not logged in' } });
        }
        const user = await User.findById(req.user.userId).select('displayName email avatar learningStyle generationCount createdAt');
        res.json({
            user: {
                userId: req.user.userId,
                displayName: user?.displayName || req.user.displayName,
                email: user?.email || req.user.email,
                avatar: user?.avatar || req.user.avatar,
                learningStyle: user?.learningStyle || 'sequential',
            }
        });
    },

    logout(req, res) {
        const isProd = process.env.NODE_ENV === 'production';
        res.clearCookie('flashlearn_token', {
            path: '/',
            secure: isProd,
            sameSite: isProd ? 'none' : 'lax',
        });
        res.json({ message: 'Logged out successfully' });
    },
};

