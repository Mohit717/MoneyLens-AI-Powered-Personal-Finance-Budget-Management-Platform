import app from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";
import { pinoLog } from "./config/pino.js";

async function startServer() {
    try {
        // 1. Verify Database Connection
        await prisma.$queryRaw`SELECT 1`;
        pinoLog.info("✅ Database connected successfully");

        // 2. Start HTTP Server
        const server = app.listen(env.PORT, () => {
            pinoLog.info(`🚀 Server running on http://localhost:${env.PORT}`);
        });

        // 3. Graceful Shutdown Signals
        const shutdown = async (signal: string) => {
            pinoLog.info(`${signal} signal received: closing HTTP server...`);
            server.close(async () => {
                await prisma.$disconnect();
                pinoLog.info("Database disconnected cleanly. Exiting process.");
                process.exit(0);
            });
        };

        process.on("SIGTERM", () => shutdown("SIGTERM"));
        process.on("SIGINT", () => shutdown("SIGINT"));
    } catch (error) {
        pinoLog.error({ error }, "❌ Failed to connect to Database on startup");
        await prisma.$disconnect();
        process.exit(1);
    }
}

startServer();