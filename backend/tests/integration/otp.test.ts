import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import crypto from 'node:crypto';
import app from '../../src/app.js';
import { prisma } from '../../src/lib/prisma.js';
import { PasswordService } from '../../src/services/password.service.js';

describe('OTP Verification & Password Reset (Integration)', () => {
  const testEmail = `otp_test_${Date.now()}@example.com`;
  const initialPassword = 'InitialPassword123!';
  const newPassword = 'NewPassword456!';
  let userId: string;

  beforeAll(async () => {
    // Create unverified test user in DB
    const passwordHash = await PasswordService.hashPassword(initialPassword);
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash,
        name: 'OTP Test User',
        isEmailVerified: false,
      },
    });
    userId = user.id;
  });

  afterAll(async () => {
    // Cleanup sessions, OTP codes, audit logs, and test user
    await prisma.refreshToken.deleteMany({ where: { userId } });
    await prisma.otpCode.deleteMany({ where: { email: testEmail } });
    await prisma.auditLog.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { id: userId } });
  });

  it('1. should send Email Verification OTP via POST /api/v1/auth/otp/send-verification', async () => {
    const res = await request(app)
      .post('/api/v1/auth/otp/send-verification')
      .send({ email: testEmail });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Verification OTP has been sent to your email address.');

    // Assert OTP record is saved in DB
    const otpInDb = await prisma.otpCode.findFirst({
      where: { email: testEmail, purpose: 'EMAIL_VERIFICATION' },
    });
    expect(otpInDb).toBeDefined();
    expect(otpInDb?.isUsed).toBe(false);
  });

  it('2. should reject verification with incorrect OTP code (400 Bad Request)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/otp/verify-email')
      .send({
        email: testEmail,
        code: '000000', // Invalid OTP
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_OTP');
  });

  it('3. should verify email successfully with correct OTP code and update isEmailVerified', async () => {
    // Insert a known active OTP into DB for deterministic testing
    const validCode = '123456';
    const codeHash = crypto.createHash('sha256').update(validCode).digest('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.otpCode.create({
      data: {
        email: testEmail,
        codeHash,
        purpose: 'EMAIL_VERIFICATION',
        expiresAt,
      },
    });

    const res = await request(app)
      .post('/api/v1/auth/otp/verify-email')
      .send({
        email: testEmail,
        code: validCode,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify user is marked as verified in DB
    const updatedUser = await prisma.user.findUnique({ where: { id: userId } });
    expect(updatedUser?.isEmailVerified).toBe(true);
  });

  it('4. should request password reset OTP via POST /api/v1/auth/otp/forgot-password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/otp/forgot-password')
      .send({ email: testEmail });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const otpInDb = await prisma.otpCode.findFirst({
      where: { email: testEmail, purpose: 'PASSWORD_RESET' },
    });
    expect(otpInDb).toBeDefined();
  });

  it('5. should reset password with valid OTP and allow login with new password', async () => {
    const resetCode = '654321';
    const codeHash = crypto.createHash('sha256').update(resetCode).digest('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.otpCode.create({
      data: {
        email: testEmail,
        codeHash,
        purpose: 'PASSWORD_RESET',
        expiresAt,
      },
    });

    // Reset Password
    const resetRes = await request(app)
      .post('/api/v1/auth/otp/reset-password')
      .send({
        email: testEmail,
        code: resetCode,
        newPassword,
      });

    expect(resetRes.status).toBe(200);
    expect(resetRes.body.success).toBe(true);

    // Verify Login works with new password
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testEmail,
        password: newPassword,
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
  });
});

