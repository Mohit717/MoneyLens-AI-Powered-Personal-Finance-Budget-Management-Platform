import argon2 from 'argon2';

export class PasswordService {
    /**
     * Hash password using Argon2id algorithm with OWASP recommended parameters
     */
    static async hashPassword(password: string): Promise<string> {
        return argon2.hash(password, {
            type: argon2.argon2id,
            memoryCost: 2 ** 16, // 64 MB memory
            timeCost: 3,         // 3 iterations
            parallelism: 4,      // 4 parallel threads
        });
    }

    /**
     * Verify plain text password against Argon2 hash
     */
    static async verifyPassword(hash: string, plainText: string): Promise<boolean> {
        try {
            return await argon2.verify(hash, plainText);
        } catch {
            return false;
        }
    }
}