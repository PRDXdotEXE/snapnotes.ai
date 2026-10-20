import { eq } from 'drizzle-orm';
import { db } from '..';
import { users } from '../schema';
import type { NewUser, User } from '../schema';

export async function createUser(user: NewUser): Promise<User> {
  const [createdUser] = await db
    .insert(users)
    .values({ ...user, email: user.email.toLowerCase() })
    .returning();
  return createdUser;
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  return user;
}

export async function getUserByUserName(username: string): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.name, username)).limit(1);
  return user;
}

export async function getUserById(id: string): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return user;
}
