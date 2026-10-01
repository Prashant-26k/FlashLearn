import jwt from 'jsonwebtoken';
import { AuthenticationError, AuthorizationError } from '../utils/errors.js';

export default function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    }

    if (!token && req.cookies) {
        token = req.cookies.flashlearn_token;
    }

    if (!token) {
        return next(new AuthenticationError('Unauthorized — no token provided'));
    }

    try {
        const secret = process.env.JWT_SECRET;
        const decoded = jwt.verify(token, secret);
        req.user = {
            userId: decoded.userId,
            email: decoded.email,
            displayName: decoded.displayName,
            avatar: decoded.avatar,
        };
        next();
    } catch {
        return next(new AuthenticationError('Unauthorized — invalid token'));
    }
}

export function checkOwnership(resourceUserId, currentUserId) {
    if (!resourceUserId || !currentUserId || String(resourceUserId) !== String(currentUserId)) {
        throw new AuthorizationError('You do not have permission to access or modify this resource');
    }
}

