import express from 'express';
import passport from 'passport';
import { authController, getClientUrl } from './controller.js';
import authMiddleware from '../../middleware/auth.js';

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
    (req, res, next) => {
        passport.authenticate('google', {
            session: false,
            failureRedirect: `${getClientUrl()}/login?error=google_auth_failed`,
        })(req, res, next);
    },
    authController.handleCallback
);

// Session endpoints
router.get('/me', authMiddleware, authController.getMe);
router.post('/logout', authController.logout);

export default router;

