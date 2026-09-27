import { PrismaClient, UserStatus } from "../../generated/prisma/client.js";
import { prisma } from '../../lib/prisma.js';

export class AuthSessionRepository {
  /**
   * Create and persist a new RefreshToken session record in DB
   */
  static async createSession(data: {
    userId: string;
    tokenHash: string;
    familyId: string;
    expiresAt: Date;
  }) {
    return prisma.refreshToken.create({
      data: {
        userId: data.userId,
        tokenHash: data.tokenHash,
        familyId: data.familyId,
        expiresAt: data.expiresAt,
      },
    });
  }

  /**
   * Find session record by hashed token string
   */
  static async findByTokenHash(tokenHash: string) {
    return prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
  }

  /**
   * Mark a single refresh token session as revoked
   */
  static async revokeToken(id: string) {
    return prisma.refreshToken.update({
      where: { id },
      data: { isRevoked: true },
    });
  }

  /**
   * Revoke all sessions belonging to the same token family (Theft Detection / Token Reuse)
   */
  static async revokeFamily(familyId: string) {
    return prisma.refreshToken.updateMany({
      where: { familyId },
      data: { isRevoked: true },
    });
  }

  /**
   * Delete expired refresh tokens from database
   */
  static async deleteExpiredTokens() {
    return prisma.refreshToken.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
  }
}

