import { type CookieOptions, type Response } from 'express';

const isProd = process.env.NODE_ENV === 'production';

const ACCESS_MAX_AGE = 15 * 60 * 1000; // 15 min
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

const baseOptions: CookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: 'lax',
};

export const ACCESS_COOKIE = 'access_token';
export const REFRESH_COOKIE = 'refresh_token';

export const setAuthCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string,
): string => {
  res.cookie(ACCESS_COOKIE, accessToken, {
    ...baseOptions,
    maxAge: ACCESS_MAX_AGE,
  });

  res.cookie(REFRESH_COOKIE, refreshToken, {
    ...baseOptions,
    maxAge: REFRESH_MAX_AGE,
    path: '/api/v1/auth', // only sent to auth routes
  });

  return refreshToken; // hash and store this in Postgres
};

export const clearAuthCookies = (res: Response): void => {
  res.clearCookie(ACCESS_COOKIE, baseOptions);
  res.clearCookie(REFRESH_COOKIE, { ...baseOptions, path: '/api/v1/auth' });
};
