import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory } from 'rate-limiter-flexible';

// Sensitive Auth Rate Limiter (Max 5 attempts per 15 mins per IP)
const authLimiter = new RateLimiterMemory({
    points: 5,
    duration: 15 * 60,
});

export const authRateLimiter = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
        await authLimiter.consume(ip);
        next();
    } catch {
        throw new Error("TOO_MANY_REQUESTS")
    }
};