import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { AuditLogger } from './logger.service.js';
import { MailTemplateEngine } from '../mail/mail-template.engine.js';

export interface SendMailOptions {
    to: string | string[];
    subject: string;
    template: string; // e.g., 'email-verification', 'password-reset', 'welcome-email'
    data?: Record<string, any>;
    attachments?: any[];
    cc?: string | string[];
    bcc?: string | string[];
}

export class MailService {
    private static transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    });

    /**
     * Universal dynamic function to render and send ANY kind of HTML email.
     * Renders target template + binds into layout.html wrapper.
     */
    static async sendMail(options: SendMailOptions): Promise<void> {
        const { to, subject, template, data = {}, attachments, cc, bcc } = options;

        // 1. Render template dynamically with MailTemplateEngine
        const html = MailTemplateEngine.render({
            template,
            subject,
            data,
        });

        // 2. Dev mode audit logging for easy local testing
        if (env.NODE_ENV === 'development' || env.NODE_ENV === 'test') {
            await AuditLogger.log({
                level: 'info',
                action: 'DEV_MAIL_SENT',
                message: `[DEV MAIL] Template "${template}" sent to ${Array.isArray(to) ? to.join(', ') : to}`,
                metadata: { to, subject, template, data },
            });
        }

        // 3. Dispatch Email via Nodemailer
        try {
            await this.transporter.sendMail({
                from: env.SMTP_FROM,
                to,
                subject,
                html,
                attachments,
                cc,
                bcc,
            });

            await AuditLogger.log({
                level: 'info',
                action: 'EMAIL_DISPATCH_SUCCESS',
                message: `Email "${subject}" (${template}) sent to ${Array.isArray(to) ? to.join(', ') : to}`,
                metadata: { to, template },
            });
        } catch (error) {
            await AuditLogger.log({
                level: 'error',
                action: 'EMAIL_DISPATCH_FAILED',
                message: `Failed to dispatch email "${subject}" (${template}) to ${Array.isArray(to) ? to.join(', ') : to}`,
                metadata: { error: (error as any)?.message || String(error), to, template },
            });

            if (env.NODE_ENV === 'production') {
                throw new Error('Failed to send email');
            }
        }
    }

    /**
     * Helper function specifically for OTP emails using the generic sendMail engine
     */
    static async sendOtpEmail(to: string, otp: string, purpose: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET'): Promise<void> {
        const isVerification = purpose === 'EMAIL_VERIFICATION';
        const template = isVerification ? 'email-verification' : 'password-reset';
        const subject = isVerification ? 'Verify Your Email Address' : 'Password Reset OTP';

        await this.sendMail({
            to,
            subject,
            template,
            data: {
                email: to,
                otp,
            },
        });
    }
}