import { and, eq, gt, isNull } from 'drizzle-orm';
import argon2 from 'argon2';

import { db } from '../index';
import { refreshTokens } from '../schema';

export const createRefreshToken = async (
  userId: string,
  jti: string,
  token: string,
  expiresAt: Date,
) => {
  const tokenHash = await argon2.hash(token);

  const [refreshToken] = await db
    .insert(refreshTokens)
    .values({
      userId,
      tokenHash,
      expiresAt,
      jti,
    })
    .returning();

  return refreshToken;
};

export const findRefreshTokenByJti = async (jti: string) => {
  const refreshToken = await db
    .select()
    .from(refreshTokens)
    .where(
      and(
        eq(refreshTokens.jti, jti),
        isNull(refreshTokens.revokedAt),
        gt(refreshTokens.expiresAt, new Date()),
      ),
    );
  return refreshToken;
};

export const revokeRefreshToken = async (id: string) => {
  await db
    .update(refreshTokens)
    .set({
      revokedAt: new Date(),
    })
    .where(eq(refreshTokens.id, id));
};

export const revokeAllRefreshTokens = async (userId: string): Promise<void> => {
  await db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));
};
