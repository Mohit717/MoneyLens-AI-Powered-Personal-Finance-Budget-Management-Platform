import { pinoLog } from "../config/pino.js";
import { prisma } from "../lib/prisma.js";

export interface AuditLogOptions {
    level?: 'info' | 'warn' | 'error' | 'fatal';
    action: string;
    message: string;
    userId?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    metadata?: Record<string, any> | null;
}

export class AuditLogger {
    static async log(options: AuditLogOptions): Promise<void> {
        const level = options.level || 'info';
        try {
            await prisma.auditLog.create({
                data: {
                    level,
                    action: options.action,
                    message: options.message,
                    userId: options.userId || null,
                    ipAddress: options.ipAddress || null,
                    userAgent: options.userAgent || null,
                    metadata: options.metadata || undefined,
                },
            });
        } catch (err) {
            pinoLog.error({ err, action: options.action }, 'Failed to persist audit log into Database');
        }
    }
}