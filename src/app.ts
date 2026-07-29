import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Express } from 'express';
import rateLimit from 'express-rate-limit';

import { env } from './env';
import { errorMiddleware } from './middlewares/error.middleware';
import accountRoutes from './routes/account.routes';
import authRoutes from './routes/auth.routes';
import mcpRoutes from './routes/mcp.routes';
import symbolRoutes from './routes/symbol.routes';
import userRoutes from './routes/user.routes';
import versionRoutes from './routes/version.routes';

const app: Express = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
    cors({
        origin: env.CLIENT_URL,
        credentials: true,
        optionsSuccessStatus: 200,
    })
);

app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});

const isTestEnv = env.NODE_ENV === 'test';

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15m
    limit: 20,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skip: () => isTestEnv,
});

const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1m
    limit: 60,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skip: () => isTestEnv,
});

app.use('/auth', authLimiter, authRoutes);
app.use('/users', apiLimiter, userRoutes);
app.use('/accounts', apiLimiter, accountRoutes);
app.use('/symbols', apiLimiter, symbolRoutes);
app.use('/version', apiLimiter, versionRoutes);
app.use('/mcp', mcpRoutes);

app.use(errorMiddleware);

export default app;
