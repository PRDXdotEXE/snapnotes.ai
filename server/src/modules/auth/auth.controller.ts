import type { Request, Response } from 'express';
import { AppError } from '../../lib/AppError';
import { clearAuthCookies, setAuthCookies } from '../../lib/cookies';
import { loginUser, registerUser } from './auth.service';

export const register = async (req: Request, res: Response) => {
  const user = await registerUser(req.body);
  setAuthCookies(res, user.id);
  return res.status(201).json({ message: 'User created successfully', user });
};

export const login = async (req: Request, res: Response) => {
  const user = await loginUser(req.body);
  setAuthCookies(res, user.id);
  return res.status(200).json({ message: 'Login successful', user });
};

export const logout = async (_req: Request, res: Response) => {
  clearAuthCookies(res);
  return res.status(200).json({ message: 'Logout successful' });
};

export const me = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(401, 'unauthorized', 'Authentication required');
  }
  return res.status(200).json({ message: 'OK', user: req.user });
};
