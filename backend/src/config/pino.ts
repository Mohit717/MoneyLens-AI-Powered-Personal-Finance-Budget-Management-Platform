import pino from "pino";
import { env } from "../config/env.js";

export const pinoLog = pino({
    level: env.LOG_LEVEL,

    redact: {
        paths: [
            "req.headers.authorization",
            "req.headers.cookie",
            "res.headers['set-cookie']",
            "*.password",
            "*.accessToken",
            "*.refreshToken",
            "*.token",
        ],
        censor: "[REDACTED]",
    },
});
