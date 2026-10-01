import express from 'express';
import passport from 'passport';
import { authController } from './controller.js';
import authMiddleware from '../../middleware/auth.js';

const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');

const router = express.Router();
export const callbackRouter = express.Router();

// Initiate Google OAuth
router.get('/google',
    authController.initiateGoogle,
    (req, res, next) => {
        passport.authenticate('google', {
            scope: ['profile', 'email'],
            state: req._oauthState,
        })(req, res, next);
    }
);

// Google OAuth callback
callbackRouter.get('/google/callback',
    authController.validateState,
    passport.authenticate('google', { session: false, failureRedirect: `${clientUrl}/login?error=google_auth_failed` }),
    authController.handleCallback
);

// Session endpoints
router.get('/me', authMiddleware, authController.getMe);
router.post('/logout', authController.logout);

export default router;

