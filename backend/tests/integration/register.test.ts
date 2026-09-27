import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "../../src/lib/prisma.js";
import request from 'supertest';
import app from '../../src/app.js';

describe('POST /api/v1/auth/register (Integration)', () => {
    const testEmail = `test_${Date.now()}@example.com`;

    // Cleanup test user, OTP codes, and audit logs after tests
    afterAll(async () => {
        await prisma.otpCode.deleteMany({ where: { email: testEmail } });
        await prisma.auditLog.deleteMany({ where: { message: { contains: testEmail } } });
        await prisma.user.deleteMany({ where: { email: testEmail } });
    });

    it('1. should register a new user successfully and dispatch OTP (201 Created)', async () => {
        const res = await request(app)
            .post('/api/v1/auth/register')
            .send({
                email: testEmail,
                password: 'SecurePassword123!',
                name: 'Integration User',
            });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe('User registered successfully. A verification OTP has been sent to your email address.');
        expect(res.body.data.user).toBeDefined();
        expect(res.body.data.user.email).toBe(testEmail);
        expect(res.body.data.user.passwordHash).toBeUndefined();

        // Verify OTP code record was created in database
        const otpRecord = await prisma.otpCode.findFirst({
            where: { email: testEmail, purpose: 'EMAIL_VERIFICATION' },
        });
        expect(otpRecord).toBeDefined();
        expect(otpRecord?.isUsed).toBe(false);
    });

    it('2. should return 409 EMAIL_ALREADY_EXISTS when registering duplicate email', async () => {
        const res = await request(app)
            .post('/api/v1/auth/register')
            .send({
                email: testEmail,
                password: 'AnotherPassword123!',
            });
        expect(res.status).toBe(409);
        expect(res.body.success).toBe(false);
        expect(res.body.error.message).toBe('An account with this email address already exists. Please sign in instead.');
    });

    it('3. should return 400 VALIDATION_ERROR when password is too short', async () => {
        const res = await request(app)
            .post('/api/v1/auth/register')
            .send({
                email: 'invalid@example.com',
                password: 'short', // < 8 characters
            });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
});