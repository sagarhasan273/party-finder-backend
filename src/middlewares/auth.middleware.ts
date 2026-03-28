import { NextFunction, Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
);

export interface GoogleUser {
    sub: string;
    email: string;
    name: string;
    picture: string;
}

// extend Express Request
declare global {
    namespace Express {
        interface Request {
            googleUser?: GoogleUser;
        }
    }
}

export const googleAuthMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
)
    : Promise<void> => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            res.status(401).json({ message: 'No token provided' });
            return;
        }

        // Verify token with Google
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();

        if (!payload) {
            res.status(401).json({ message: 'Invalid token payload' });
            return;
        }

        // attach user info to request
        req.googleUser = {
            sub: payload.sub!,
            email: payload.email!,
            name: payload.name!,
            picture: payload.picture!,
        };

        next();
    } catch (error) {
        res.status(401).json({
            message: 'Invalid or expired Google token',
        });
        return;
    }
};