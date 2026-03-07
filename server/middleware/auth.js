import jwt from 'jsonwebtoken';

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
        return res.status(401).json({ error: 'Unauthorized — no token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = {
            userId: decoded.userId,
            email: decoded.email,
            displayName: decoded.displayName,
            avatar: decoded.avatar,
        };
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Unauthorized — invalid token' });
    }
}
