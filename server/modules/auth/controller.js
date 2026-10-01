import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../../models/User.js';

const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
const oauthStateCookie = 'flashlearn_oauth_state';

function createOAuthState() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not configured');
    }
    const value = crypto.randomBytes(32).toString('hex');
    const signature = crypto
        .createHmac('sha256', secret)
        .update(value)
        .digest('hex');
    return `${value}.${signature}`;
}

function isValidOAuthState(state) {
    if (!state || !state.includes('.')) return false;
    const secret = process.env.JWT_SECRET;
    const [value, signature] = state.split('.');
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(value)
        .digest('hex');
    const provided = Buffer.from(signature, 'hex');
    const expected = Buffer.from(expectedSignature, 'hex');

    return provided.length === expected.length && crypto.timingSafeEqual(provided, expected);
}

export const authController = {
    initiateGoogle(req, res, next) {
        if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
            return res.redirect(`${clientUrl}/login?error=oauth_not_configured`);
        }
        let state;
        try {
            state = createOAuthState();
        } catch {
            return res.redirect(`${clientUrl}/login?error=oauth_not_configured`);
        }

        res.cookie(oauthStateCookie, state, {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 10 * 60 * 1000,
        });

        // Continue to passport
        req._oauthState = state;
        next();
    },

    validateState(req, res, next) {
        const state = req.query.state;
        const storedState = req.cookies?.[oauthStateCookie];

        res.clearCookie(oauthStateCookie);
        if (!storedState || storedState !== state || !isValidOAuthState(state)) {
            return res.redirect(`${clientUrl}/login?error=oauth_state_invalid`);
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

        // Section 4: Secure + HttpOnly + SameSite cookie
        res.cookie('flashlearn_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/',
        });

        // Also pass hash token for client compatibility if cookie isn't accepted
        res.redirect(`${clientUrl}/#token=${encodeURIComponent(token)}`);
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
        res.clearCookie('flashlearn_token', { path: '/' });
        res.json({ message: 'Logged out successfully' });
    },
};

