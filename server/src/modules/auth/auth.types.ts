import type { Request } from 'express';
import type { UserResponse } from '../../db/schema';

export type PublicUser = UserResponse;
export type AuthenticatedRequest = Request & { user?: UserResponse };

declare global {
  namespace Express {
    interface Request {
      user?: UserResponse;
    }
  }
}
