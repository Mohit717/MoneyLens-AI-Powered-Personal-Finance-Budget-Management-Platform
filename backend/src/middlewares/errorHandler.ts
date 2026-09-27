import type { ErrorRequestHandler } from "express";
import { Prisma } from "../generated/prisma/client.js";
import { ZodError } from "zod";
import { AuditLogger } from "../services/logger.service.js";

export class AppError extends Error {
    constructor(
        public readonly statusCode: number,
        public readonly code: string,
        message: string
    ) {
        super(message);
        this.name = "AppError";
    }
}

const ERROR_STATUS_MAP: Record<string, { status: number; code?: string }> = {
    INVALID_CREDENTIALS: { status: 401 },
    EMAIL_ALREADY_EXISTS: { status: 409 },
    INVALID_OTP: { status: 400 },
    TOO_MANY_ATTEMPTS: { status: 400 },
    MISSING_TOKEN: { status: 401, code: "UNAUTHORIZED" },
    UNAUTHORIZED: { status: 401 },
    SESSION_ERROR: { status: 401 },
    SECURITY_BREACH_DETECTED: { status: 401 },
    TOO_MANY_REQUESTS: { status: 429 },
    USER_NOT_FOUND: { status: 404 },
    EMAIL_ALREADY_VERIFIED: { status: 400 },
};

export const errorHandler: ErrorRequestHandler = async (error, req, res, _next) => {
    const userId = (req as any).user?.id || null;
    const ipAddress = req.ip || req.socket.remoteAddress || null;
    const userAgent = req.get("user-agent") || null;
    const reqWithT = req as any;

    let statusCode = 500;
    let code = "INTERNAL_SERVER_ERROR";
    let errorMessage = error.message || "An unexpected error occurred.";

    const mapped = ERROR_STATUS_MAP[error.message];
    if (mapped) {
        statusCode = mapped.status;
        code = mapped.code || error.message;
    }

    if (error instanceof ZodError) {
        const formattedErrors = error.issues.map((e) => ({
            field: e.path.join(".").replace("body.", ""),
            message: e.message,
        })) as any;

        statusCode = 400
        code = "VALIDATION_ERROR"
        errorMessage = formattedErrors[0].message
    }

    // 1. Handle Known Custom Application Errors (AppError)
    if (error instanceof AppError || error?.name === "AppError" || typeof error?.statusCode === "number") {
        const statusCode = error.statusCode || 400;
        const code = error.code || "BAD_REQUEST";
        const localizedMessage = reqWithT.t && typeof reqWithT.t === 'function' && code
            ? reqWithT.t(code, { defaultValue: error.message })
            : error.message;

        await AuditLogger.log({
            level: statusCode >= 500 ? "error" : "warn",
            action: code,
            message: error.message,
            userId,
            ipAddress,
            userAgent,
            metadata: { path: req.originalUrl, method: req.method },
        });

        res.status(statusCode).json({
            success: false,
            error: {
                code,
                message: localizedMessage || error.message,
            },
        });
        return;
    }

    const localizedMessage = reqWithT.t && typeof reqWithT.t === 'function' && code ? reqWithT.t(code) : errorMessage;

    await AuditLogger.log({
        level: "error",
        action: code,
        message: localizedMessage,
        userId,
        ipAddress,
        userAgent,
        metadata: {
            path: req.originalUrl,
            method: req.method,
            stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
        },
    });

    res.status(statusCode).json({
        success: false,
        error: {
            code,
            message: localizedMessage,
        },
    });
};