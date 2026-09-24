import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const router = express.Router();
export const callbackRouter = express.Router();
const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
const oauthStateCookie = 'flashlearn_oauth_state';

function createOAuthState() {
    const value = crypto.randomBytes(32).toString('hex');
    const signature = crypto
        .createHmac('sha256', process.env.JWT_SECRET)
        .update(value)
        .digest('hex');
    return `${value}.${signature}`;
}

function isValidOAuthState(state) {
    if (!state || !state.includes('.')) return false;

    const [value, signature] = state.split('.');
    const expectedSignature = crypto
        .createHmac('sha256', process.env.JWT_SECRET)
        .update(value)
        .digest('hex');
    const provided = Buffer.from(signature, 'hex');
    const expected = Buffer.from(expectedSignature, 'hex');

    return provided.length === expected.length
        && crypto.timingSafeEqual(provided, expected);
}

// Initiate Google OAuth
router.get('/google', (req, res, next) => {
    const state = createOAuthState();
    res.cookie(oauthStateCookie, state, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 10 * 60 * 1000,
    });
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        state,
    })(req, res, next);
});

// Google OAuth callback
callbackRouter.get('/google/callback',
    (req, res, next) => {
        const state = req.query.state;
        const storedState = req.headers.cookie
            ?.split(';')
            .map((cookie) => cookie.trim())
            .find((cookie) => cookie.startsWith(`${oauthStateCookie}=`))
            ?.slice(`${oauthStateCookie}=`.length);

        res.clearCookie(oauthStateCookie);
        if (!storedState || storedState !== state || !isValidOAuthState(state)) {
            return res.redirect(`${clientUrl}/login?error=oauth_state_invalid`);
        }
        next();
    },
    passport.authenticate('google', { session: false, failureRedirect: `${clientUrl}/login?error=google_auth_failed` }),
    (req, res) => {
        const token = jwt.sign(
            {
                userId: req.user._id,
                email: req.user.email,
                displayName: req.user.displayName,
                avatar: req.user.avatar,
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.redirect(`${clientUrl}/#token=${encodeURIComponent(token)}`);
    }
);

// Logout
router.post('/logout', (req, res) => {
    res.clearCookie('flashlearn_token');
    res.json({ message: 'Logged out' });
});

export default router;
