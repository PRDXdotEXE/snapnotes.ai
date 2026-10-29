import { pgTable, pgEnum, uuid, text, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { junit } from 'node:test/reporters';

export const jobStatus = pgEnum('job_status', ['pending', 'processing', 'completed', 'failed']);
export const jobType = pgEnum('job_type', [
  'extract_text',
  'generate_pdf',
  'generate_summary',
  'generate_questions',
]);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date()),
  name: text('name').notNull().unique(),
});

export const notes = pgTable('notes', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const processingJobs = pgTable(
  'processing_jobs',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    noteId: uuid('note_id')
      .notNull()
      .references(() => notes.id, { onDelete: 'cascade' }),
    status: jobStatus('status').notNull().default('pending'),
    type: jobType('type').notNull(),

    progress: integer('progress').notNull().default(0),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [index('jobs_note_idx').on(t.noteId), index('jobs_status_idx').on(t.status)],
);

export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull().unique(),
    jti: text('jti').notNull().unique(),
    expiresAt: timestamp('expires_at').notNull(),
    revokedAt: timestamp('revoked_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    index('refresh_tokens_user_idx').on(t.userId),
    index('refresh_tokens_expires_idx').on(t.expiresAt),
  ],
);

export type NewUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type UserResponse = Omit<User, 'passwordHash'>;

export type RefreshToken = typeof refreshTokens.$inferSelect;
export type NewRefreshToken = typeof refreshTokens.$inferInsert;
