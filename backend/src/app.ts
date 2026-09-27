import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env.js';
import cookieParser from 'cookie-parser';
import appRoutes from './routes.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { prisma } from './lib/prisma.js';
import { i18nMiddleware } from './config/i18n.js';

const app = express();

app.use(helmet());
app.use(cors({
    origin: env.APP_ORIGIN,
    credentials: true
}))

app.use(express.json());
app.use(cookieParser());
app.use(i18nMiddleware);

app.get('/health', async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.status(200).json({
            status: "ok",
            database: "connected",
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(503).json({
            status: "error",
            database: "disconnected",
            timestamp: new Date().toISOString()
        });
    }
});
app.use("/api/v1", appRoutes);
app.use(errorHandler);

export default app;