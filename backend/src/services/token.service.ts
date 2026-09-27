import { SignJWT, jwtVerify, JWTPayload } from 'jose';
import { createHash, randomUUID } from "node:crypto";
import { env } from '../config/env.js';

export interface TokenPayload extends JWTPayload {
    userId: string;
    email: string;
    role: string;
    familyId?: string;
}

export interface GeneratedTokens {
    accessToken: string;
    refreshToken: string;
    familyId: string;
}

export class TokenService {
    private static accessSecret = new TextEncoder().encode(env.jwt.accessSecret);
    private static refreshSecret = new TextEncoder().encode(env.jwt.refreshSecret);

    /**
     * Generate short-lived Access Token (15m)
     */
    static async generateAccessToken(payload: { userId: string; email: string; role: string }): Promise<string> {
        return new SignJWT({ ...payload })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime(env.jwt.accessExpiresIn)
            .sign(this.accessSecret);
    }

    /**
     * Generate long-lived Refresh Token (7d) with family ID for rotation tracking
     */
    static async generateRefreshToken(payload: { userId: string; familyId: string }): Promise<string> {
        return new SignJWT({ ...payload, jti: crypto.randomUUID() })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime(env.jwt.refreshExpiresIn)
            .sign(this.refreshSecret);
    }

    /**
     * Verify Access Token
     */
    static async verifyAccessToken(token: string): Promise<TokenPayload | null> {
        try {
            const { payload } = await jwtVerify(token, this.accessSecret);
            return payload as TokenPayload;
        } catch {
            return null;
        }
    }

    /**
     * Verify Refresh Token
     */
    static async verifyRefreshToken(token: string): Promise<{ userId: string; familyId: string } | null> {
        try {
            const { payload } = await jwtVerify(token, this.refreshSecret);
            return {
                userId: payload.userId as string,
                familyId: payload.familyId as string,
            };
        } catch {
            return null;
        }
    }

    /**
     * Hash a refresh token before storing in DB (SHA-256)
     * Storing raw tokens in DB is a risk if DB is compromised.
     */
    static hashToken(token: string): string {
        return createHash('sha256').update(token).digest('hex');
    }

    /**
     * Generate a unique family ID for Refresh Token Rotation
     */
    static generateFamilyId(): string {
        return randomUUID();
    }
}