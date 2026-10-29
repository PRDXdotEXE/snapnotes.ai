import argon2 from 'argon2';
import { createUser, getUserByEmail, getUserByUserName } from '../../db/queries/users';
import type { User } from '../../db/schema';
import { AppError } from '../../lib/AppError';
import type { LoginInput, RegisterInput } from './auth.schema';
import type { PublicUser } from './auth.types';

export const toPublicUser = ({ passwordHash: _passwordHash, ...user }: User): PublicUser => user;

const dummyHash = argon2.hash('dummy-password-for-timing');

const isUniqueViolation = (err: unknown): boolean => {
  const e = err as { code?: string; cause?: { code?: string } };
  return e?.code === '23505' || e?.cause?.code === '23505';
};

export const registerUser = async ({
  email,
  username,
  password,
}: RegisterInput): Promise<PublicUser> => {
  const passwordHash = await argon2.hash(password);

  try {
    const created = await createUser({ email, name: username, passwordHash });
    return toPublicUser(created);
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw new AppError(409, 'user_exists', 'Email or username already exists');
    }
    throw err;
  }
};

export const loginUser = async ({ email, username, password }: LoginInput): Promise<PublicUser> => {
  const user = email ? await getUserByEmail(email) : await getUserByUserName(username!);

  const hash = user?.passwordHash ?? (await dummyHash);
  const valid = await argon2.verify(hash, password);

  if (!user || !valid) {
    throw new AppError(401, 'invalid_credentials', 'Invalid credentials');
  }

  return toPublicUser(user);
};
