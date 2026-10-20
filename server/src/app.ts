import { randomUUID } from 'node:crypto';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { env } from './config/env';
import { logger } from './lib/logger';
import { errorHandler, notFound } from './middleware/errorHandler';
import { healthRouter } from './modules/health/health.routes';
import { authRouter } from './modules/auth/auth.routes';
import cookieParser from 'cookie-parser';
export const app = express();

app.use(
  pinoHttp({
    logger,
    genReqId: (req, res) => {
      const header = req.headers['x-request-id'];
      const id = typeof header === 'string' ? header : randomUUID();
      res.setHeader('X-Request-Id', id);
      return id;
    },
  }),
);
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.get('/', (_req, res) => {
  res.status(200).json({ message: 'Welcome to SnapNotes API' });
});

app.use('/api/v1', healthRouter);
app.use('/api/v1/auth', authRouter);

app.use(notFound);
app.use(errorHandler);
