import { describe, expect, it, vi } from 'vitest'
import { AuthService, normalizeEmail } from '../../src/modules/auth/auth.service.js';
import { PasswordService } from '../../src/services/password.service.js';

describe('AuthService Unit Tests', () => {
    describe('normalizeEmail', () => {
        it('should trim, lowercase, and normalize email address', () => {
            const rawEmail = '  Test.User@Example.COM  ';
            const normalized = normalizeEmail(rawEmail);
            expect(normalized).toBe('test.user@example.com');
        });
    });

    describe('PasswordService', () => {
        it('should hash password using Argon2id and verify correctly', async () => {
            const password = 'SuperSecurePassword123!';
            const hash = await PasswordService.hashPassword(password);
            expect(hash).toBeDefined();
            expect(hash.startsWith('$argon2id$')).toBe(true);
            const isValid = await PasswordService.verifyPassword(hash, password);
            expect(isValid).toBe(true);
            const isInvalid = await PasswordService.verifyPassword(hash, 'WrongPassword');
            expect(isInvalid).toBe(false);
        });
    });

    describe('AuthService.register', () => {
        it('should throw 409 EMAIL_ALREADY_EXISTS if user email is taken', async () => {
            const mockRepository: any = {
                findUserByEmail: vi.fn().mockResolvedValue({ id: '1', email: 'existing@example.com' }),
            };
            const authService = new AuthService(mockRepository);
            await expect(
                authService.register({
                    email: 'existing@example.com',
                    password: 'Password123!',
                })
            ).rejects.toThrow(new Error('EMAIL_ALREADY_EXISTS'));
        });
    });
})