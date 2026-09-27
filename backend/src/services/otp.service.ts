import crypto from 'node:crypto';
import { prisma } from '../lib/prisma.js';
import { MailService } from './mail.service.js';
import { OtpPurpose } from '../generated/prisma/client.js';

export class OtpService {
    /**
     * Hash OTP code using SHA-256 before saving to DB
     */
    private static hashOtp(code: string): string {
        return crypto.createHash('sha256').update(code).digest('hex');
    }

    /**
     * Generate 6-digit numeric OTP and send via Nodemailer
     */
    static async generateAndSendOtp(email: string, purpose: OtpPurpose): Promise<void> {
        // 1. Generate 6-digit random numeric code
        const rawOtp = crypto.randomInt(100000, 999999).toString();
        const codeHash = this.hashOtp(rawOtp);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // 2. Invalidate previous active OTPs for this email and purpose
        await prisma.otpCode.updateMany({
            where: { email, purpose, isUsed: false },
            data: { isUsed: true },
        });

        // 3. Save new OTP record in DB
        await prisma.otpCode.create({
            data: {
                email,
                codeHash,
                purpose,
                expiresAt,
            },
        });

        // 4. Send Email via Nodemailer
        await MailService.sendOtpEmail(email, rawOtp, purpose);
    }

    /**
     * Verify OTP with attempt throttling and single-use burning
     */
    static async verifyOtp(email: string, code: string, purpose: OtpPurpose): Promise<boolean> {
        const codeHash = this.hashOtp(code);

        // 1. Find active OTP record
        const otpRecord = await prisma.otpCode.findFirst({
            where: {
                email,
                purpose,
                isUsed: false,
                expiresAt: { gt: new Date() },
            },
            orderBy: { createdAt: 'desc' },
        });

        if (!otpRecord) {
            throw new Error('INVALID_OTP');
        }

        // 2. Check maximum allowed attempts (Max 5 attempts)
        if (otpRecord.attempts >= 5) {
            await prisma.otpCode.update({
                where: { id: otpRecord.id },
                data: { isUsed: true },
            });
            throw new Error('TOO_MANY_ATTEMPTS');
        }

        // 3. Verify code hash
        if (otpRecord.codeHash !== codeHash) {
            // Increment attempt counter on wrong code
            await prisma.otpCode.update({
                where: { id: otpRecord.id },
                data: { attempts: { increment: 1 } },
            });
            throw new Error('INVALID_OTP');
        }

        // 4. Burn OTP (Mark as used)
        await prisma.otpCode.update({
            where: { id: otpRecord.id },
            data: { isUsed: true },
        });

        return true;
    }
}