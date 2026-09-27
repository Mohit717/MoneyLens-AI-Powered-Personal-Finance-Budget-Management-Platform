import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { prisma } from '../../src/lib/prisma.js';
import { PasswordService } from '../../src/services/password.service.js';

describe('POST /api/v1/auth/login (Integration)', () => {
    const testEmail = `login_test_${Date.now()}@example.com`;
    const testPassword = 'SecurePassword123!';
    let userId: string;

    beforeAll(async () => {
        // Create a test user in DB prior to running login tests
        const passwordHash = await PasswordService.hashPassword(testPassword);
        const user = await prisma.user.create({
            data: {
                email: testEmail,
                passwordHash,
                name: 'Login Test User',
            },
        });
        userId = user.id;
    });

    afterAll(async () => {
        // Cleanup sessions, audit logs, and test user
        await prisma.refreshToken.deleteMany({ where: { userId } });
        await prisma.auditLog.deleteMany({ where: { userId } });
        await prisma.user.deleteMany({ where: { id: userId } });
    });

    it('1. should authenticate user with valid credentials and return access token + refresh cookie', async () => {
        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({
                email: testEmail,
                password: testPassword,
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe('Login successful');
        expect(res.body.data.accessToken).toBeDefined();
        expect(res.body.data.user).toBeDefined();
        expect(res.body.data.user.email).toBe(testEmail);

        // Verify Refresh Token Cookie is set in response headers
        const cookies = res.headers['set-cookie'];
        expect(cookies).toBeDefined();
        const refreshCookie = (cookies as string[]).find((c) => c.startsWith('refreshToken='));
        expect(refreshCookie).toBeDefined();
        expect(refreshCookie).toContain('HttpOnly');

        // Verify session record was created in database
        const sessionInDb = await prisma.refreshToken.findFirst({
            where: { userId },
        });
        expect(sessionInDb).toBeDefined();
        expect(sessionInDb?.isRevoked).toBe(false);

        // Verify Audit Log entry
        const auditLog = await prisma.auditLog.findFirst({
            where: { action: 'AUTH_LOGIN_SUCCESS', userId },
        });
        expect(auditLog).toBeDefined();
    });

    it('2. should return 401 INVALID_CREDENTIALS when password is incorrect', async () => {
        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({
                email: testEmail,
                password: 'WrongPassword123!',
            });

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
        expect(res.body.error.message).toBe('Invalid email or password.');
    });

    it('3. should return 401 INVALID_CREDENTIALS when email does not exist', async () => {
        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({
                email: 'nonexistent_user_9999@example.com',
                password: testPassword,
            });

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
        expect(res.body.error.message).toBe('Invalid email or password.');
    });

    it('4. should return 400 VALIDATION_ERROR when email format is invalid', async () => {
        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({
                email: 'invalid-email-format',
                password: testPassword,
            });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
});