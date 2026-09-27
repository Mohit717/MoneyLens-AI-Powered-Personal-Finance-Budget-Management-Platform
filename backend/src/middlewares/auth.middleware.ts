import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../services/token.service.js';

export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
    };
}

export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        let token: string | undefined;
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        } else if (req.cookies?.accessToken) {
            token = req.cookies.accessToken;
        }

        if (!token) {
            throw new Error('MISSING_TOKEN')
        }

        const payload = await TokenService.verifyAccessToken(token);
        if (!payload) {
            throw new Error('MISSING_TOKEN')
        }

        req.user = {
            id: payload.userId as string,
            email: payload.email as string,
            role: payload.role as string,
        };

        next();
    } catch (error) {
        next(error);
    }
};