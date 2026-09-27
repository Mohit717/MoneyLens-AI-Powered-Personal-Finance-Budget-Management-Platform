import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { prisma } from '../../src/lib/prisma.js';
import { PasswordService } from '../../src/services/password.service.js';

describe('RTR Refresh, Logout & Protected /me Profile (Integration)', () => {
  const testEmail = `rtr_test_${Date.now()}@example.com`;
  const testPassword = 'SecurePassword123!';
  let userId: string;
  let accessToken: string;
  let refreshTokenCookie: string;

  beforeAll(async () => {
    // 1. Create a verified user in DB
    const passwordHash = await PasswordService.hashPassword(testPassword);
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash,
        name: 'RTR Integration User',
        isEmailVerified: true,
      },
    });
    userId = user.id;

    // 2. Perform Login to obtain initial Access Token & Refresh Token Cookie
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testEmail, password: testPassword }) as any;

    accessToken = loginRes.body.data.accessToken;
    const cookies = loginRes.headers['set-cookie'] as string[];
    const rawCookie = cookies.find((c) => c.startsWith('refreshToken='))!;
    // Extract only "refreshToken=xyz" (excluding Path, HttpOnly, etc. for request Cookie header)
    refreshTokenCookie = rawCookie.split(';')[0];
  });

  afterAll(async () => {
    // Cleanup sessions, audit logs, and test user
    await prisma.refreshToken.deleteMany({ where: { userId } });
    await prisma.auditLog.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { id: userId } });
  });

  it('1. should fetch protected user profile via GET /api/v1/auth/me with Bearer token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.email).toBe(testEmail);
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it('2. should reject GET /api/v1/auth/me without token (401 Unauthorized)', async () => {
    const res = await request(app).get('/api/v1/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('3. should rotate refresh token successfully via POST /api/v1/auth/refresh (RTR)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', [refreshTokenCookie]) as any;

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();

    // Verify a new Refresh Token Cookie was issued
    const newCookies = res.headers['set-cookie'] as string[];
    const newRawCookie = newCookies.find((c) => c.startsWith('refreshToken='))!;
    expect(newRawCookie).toBeDefined();

    // Update refreshTokenCookie for subsequent theft detection test
    const oldCookie = refreshTokenCookie;
    refreshTokenCookie = newRawCookie.split(';')[0];

    // 🚨 4. Test Theft Detection: Reusing the OLD (revoked) Refresh Token!
    const reuseRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', [oldCookie]);

    expect(reuseRes.status).toBe(401);
    expect(reuseRes.body.success).toBe(false);
    expect(reuseRes.body.error.code).toBe('SECURITY_BREACH_DETECTED');

    // Verify that ALL sessions in this family were revoked due to theft detection
    const activeSessions = await prisma.refreshToken.findMany({
      where: { userId, isRevoked: false },
    });
    expect(activeSessions.length).toBe(0);
  });

  it('5. should logout user via POST /api/v1/auth/logout and clear cookie', async () => {
    // Re-login to get a fresh session for logout test
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testEmail, password: testPassword }) as any;

    const freshRawCookie = (loginRes.headers['set-cookie'] as string[]).find((c) => c.startsWith('refreshToken='))!;
    const freshCookie = freshRawCookie.split(';')[0];

    const logoutRes = await request(app)
      .post('/api/v1/auth/logout')
      .set('Cookie', [freshCookie]) as any;

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.success).toBe(true);

    // Verify cookie was cleared
    const setCookieHeader = logoutRes.headers['set-cookie'] as string[];
    expect(setCookieHeader).toBeDefined();
  });
});
