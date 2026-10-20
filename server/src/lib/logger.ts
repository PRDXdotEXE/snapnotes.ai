import pino from 'pino';
import { env } from '../config/env';

export const logger = pino({
  level: env.LOG_LEVEL,
  redact: ['req.headers.authorization', 'req.headers.cookie'],
  transport: env.NODE_ENV === 'development' ? { target: 'pino-pretty' } : undefined,
});
