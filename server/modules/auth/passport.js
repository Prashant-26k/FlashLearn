import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../../models/User.js';
import logger from '../../utils/logger.js';

export function configurePassport(passportInstance = passport) {
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
        const isProduction = process.env.NODE_ENV === 'production';
        const callbackURL = process.env.GOOGLE_CALLBACK_URL || (
            isProduction
                ? (() => { logger.error('GOOGLE_CALLBACK_URL is not set in production — Google OAuth will fail. Set it to https://<your-backend>/google/callback on Render.'); return null; })()
                : 'http://localhost:3001/google/callback'
        );

        if (callbackURL) {
            passportInstance.use(new GoogleStrategy(
                {
                    clientID: process.env.GOOGLE_CLIENT_ID,
                    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                    callbackURL,
                    proxy: true,
                },
                async (accessToken, refreshToken, profile, done) => {
                    try {
                        let user = await User.findOne({ googleId: profile.id });
                        if (!user) {
                            user = await User.create({
                                googleId: profile.id,
                                displayName: profile.displayName,
                                email: profile.emails?.[0]?.value || '',
                                avatar: profile.photos?.[0]?.value || '',
                            });
                        } else {
                            user.displayName = profile.displayName;
                            user.avatar = profile.photos?.[0]?.value || user.avatar;
                            await user.save();
                        }
                        done(null, user);
                    } catch (err) {
                        logger.error('Passport Google Strategy Error during authentication:', err);
                        done(err, null);
                    }
                }
            ));
        }
    } else {
        logger.warn('⚠ Google OAuth is not configured — sign-in will be unavailable');
    }

    passportInstance.serializeUser((user, done) => done(null, user.id));
    passportInstance.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (err) {
            done(err, null);
        }
    });

    return passportInstance;
}

export default configurePassport;

