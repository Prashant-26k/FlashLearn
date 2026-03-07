import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Initiate Google OAuth
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email'],
}));

// Google OAuth callback
router.get('/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/login' }),
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

        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        res.redirect(`${clientUrl}/?token=${token}`);
    }
);

// Logout
router.post('/logout', (req, res) => {
    res.clearCookie('flashlearn_token');
    res.json({ message: 'Logged out' });
});

export default router;
