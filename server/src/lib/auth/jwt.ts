import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken';
import { env } from '../../config/env';
import { AppError } from '../AppError';

export const ACCESS_TTL_S = 15 * 60; // 15 minutes
export const REFRESH_TTL_S = 7 * 24 * 60 * 60;
export type TokenType = 'access' | 'refresh';

export interface AccessTokenPayload extends JwtPayload {
  sub: string; // userId
  type: 'access';
}

export interface RefreshTokenPayload extends JwtPayload {
  sub: string; // userId
  jti: string; // unique identifier for the token
  type: 'refresh';
}

export type DecodedToken = AccessTokenPayload | RefreshTokenPayload;

export const generateAccessToken = (payload: { sub: string }): string => {
  return jwt.sign({ ...payload, type: 'access' }, env.JWT_SECRET, {
    algorithm: 'HS256',
    issuer: env.JWT_ISSUER,
    expiresIn: ACCESS_TTL_S,
  });
};

export const generateRefreshToken = (payload: { sub: string; jti: string }): string => {
  return jwt.sign({ ...payload, type: 'refresh' }, env.JWT_SECRET, {
    algorithm: 'HS256',
    issuer: env.JWT_ISSUER,
    expiresIn: REFRESH_TTL_S,
  });
};

export const verifyToken = (token: string, type: TokenType): DecodedToken => {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: env.JWT_ISSUER,
    }) as DecodedToken;

    if (typeof decoded === 'string') {
      throw new AppError(401, 'unauthorized', 'Invalid token');
    }
    if (decoded.type !== type) {
      throw new AppError(401, 'unauthorized', 'Invalid token type');
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
