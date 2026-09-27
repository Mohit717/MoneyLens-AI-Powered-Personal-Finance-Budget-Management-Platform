import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

    PORT: z.coerce
        .number()
        .int()
        .positive()
        .default(4000),

    APP_ORIGIN: z.string().default("http://localhost:3000"),

    LOG_LEVEL: z
        .enum(["fatal", "error", "warn", "info", "debug", "trace"])
        .default("info"),

    DATABASE_URL: z.string().min(1),

    // JWT Configuration
    JWT_ACCESS_SECRET: z
        .string()
        .min(32, "JWT access secret must be at least 32 characters long")
        .default("super-secret-access-token-key-minimum-32-chars-long"),

    JWT_REFRESH_SECRET: z
        .string()
        .min(32, "JWT refresh secret must be at least 32 characters long")
        .default("super-secret-refresh-token-key-minimum-32-chars-long"),

    JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
    JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

    // SMTP Configuration
    SMTP_HOST: z.string().default("smtp.ethereal.email"),
    SMTP_PORT: z.coerce.number().default(587),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    SMTP_FROM: z.string().default("Auth Service <no-reply@authservice.com>"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error("Invalid environment configuration:");
    console.error(parsed.error.format());

    process.exit(1);
}

export const env = {
    ...parsed.data,
    jwt: {
        accessSecret: parsed.data.JWT_ACCESS_SECRET,
        refreshSecret: parsed.data.JWT_REFRESH_SECRET,
        accessExpiresIn: parsed.data.JWT_ACCESS_EXPIRES_IN,
        refreshExpiresIn: parsed.data.JWT_REFRESH_EXPIRES_IN,
    },
};