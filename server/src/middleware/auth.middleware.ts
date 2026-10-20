import type { RequestHandler } from 'express';
import { getUserById } from '../db/queries/users';
import { AppError } from '../lib/AppError';
import { verifyToken } from '../lib/auth/jwt';
import { ACCESS_COOKIE } from '../lib/cookies';

export const requireAuth: RequestHandler = async (req, _res, next) => {
  try {
    const token = req.cookies?.[ACCESS_COOKIE];
    if (!token) {
      throw new AppError(401, 'unauthorized', 'Authentication required');
    }

    const { sub } = verifyToken(token);
    if (!sub) {
      throw new AppError(401, 'unauthorized', 'Invalid token');
    }

    const user = await getUserById(sub);
    if (!user) {
      throw new AppError(401, 'unauthorized', 'Invalid token');
    }

    const { passwordHash, ...safeUser } = user;
    req.user = safeUser;
    next();
  } catch (error) {
    next(error);
  }
};
