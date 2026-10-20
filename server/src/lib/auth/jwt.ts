import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken';
import { env } from '../../config/env';
import { AppError } from '../AppError';

type TokenPayload = Pick<JwtPayload, 'sub'>;

export const generateToken = (
  payload: TokenPayload,
  expiresIn: SignOptions['expiresIn'],
): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    algorithm: 'HS256',
    issuer: env.JWT_ISSUER,
    expiresIn,
  });
};

export const verifyToken = (token: string): JwtPayload => {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: env.JWT_ISSUER,
    });

    if (typeof decoded === 'string') {
      throw new AppError(401, 'unauthorized', 'Invalid token');
    }
    return decoded;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError(401, 'unauthorized', 'Token expired');
    }
    throw new AppError(401, 'unauthorized', 'Invalid token');
  }
};
