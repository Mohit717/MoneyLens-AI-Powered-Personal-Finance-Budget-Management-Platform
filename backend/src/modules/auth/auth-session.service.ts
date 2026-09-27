import { TokenService } from '../../services/token.service.js';
import { AuthSessionRepository } from './auth-session.repository.js';

export class AuthSessionService {

    static async createSession(
        user: { id: string; email: string; role: string },
        existingFamilyId?: string
    ) {
        const familyId = existingFamilyId || TokenService.generateFamilyId();

        const accessToken = await TokenService.generateAccessToken({
            userId: user.id,
            email: user.email,
            role: user.role,
        });

        const refreshToken = await TokenService.generateRefreshToken({
            userId: user.id,
            familyId,
        });

        const tokenHash = TokenService.hashToken(refreshToken);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        await AuthSessionRepository.createSession({
            userId: user.id,
            tokenHash,
            familyId,
            expiresAt,
        });

        return {
            accessToken,
            refreshToken,
            familyId,
        };
    }

    static async rotateSession(rawRefreshToken: string) {
        // 1. Verify JWT signature with jose
        const payload = await TokenService.verifyRefreshToken(rawRefreshToken);
        if (!payload) {
            throw new Error('UNAUTHORIZED')
        }

        // 2. Hash raw token and find session in DB
        const tokenHash = TokenService.hashToken(rawRefreshToken);
        const session = await AuthSessionRepository.findByTokenHash(tokenHash);

        if (!session) {
            throw new Error('SESSION_ERROR')
        }

        if (session.isRevoked) {
            await AuthSessionRepository.revokeFamily(session.familyId);
            throw new Error('SECURITY_BREACH_DETECTED')
        }

        // 4. Revoke old refresh token (Burn token)
        await AuthSessionRepository.revokeToken(session.id);

        // 5. Issue new Access Token + new Refresh Token pair under the SAME familyId
        return this.createSession(
            {
                id: session.user.id,
                email: session.user.email,
                role: session.user.role,
            },
            session.familyId
        );
    }

    /**
     * Revoke session on logout
     */
    static async revokeSession(rawRefreshToken: string) {
        const tokenHash = TokenService.hashToken(rawRefreshToken);
        const session = await AuthSessionRepository.findByTokenHash(tokenHash);
        if (session) {
            await AuthSessionRepository.revokeToken(session.id);
        }
    }
}