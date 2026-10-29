import { and, desc, eq } from 'drizzle-orm';
import { db } from '../index';
import { notes } from '../schema';

export async function insertNote(values: { userId: string; title: string; content: string }) {
  const [note] = await db.insert(notes).values(values).returning();
  return note;
}

export async function listNotesForUser(
  userId: string,
  { limit, offset }: { limit: number; offset: number },
) {
  return db
    .select()
    .from(notes)
    .where(eq(notes.userId, userId))
    .orderBy(desc(notes.updatedAt)) // most recently edited first
    .limit(limit)
    .offset(offset);
}

export async function findNoteByIdForUser(id: string, userId: string) {
  const [note] = await db
    .select()
    .from(notes)
    .where(and(eq(notes.id, id), eq(notes.userId, userId)));
  return note;
}

export async function updateNoteForUser(
  id: string,
  userId: string,
  changes: { title?: string; content?: string },
) {
  const [note] = await db
    .update(notes)
    .set({ ...changes, updatedAt: new Date() })
    .where(and(eq(notes.id, id), eq(notes.userId, userId)))
    .returning();
  return note;
}

export async function deleteNoteForUser(id: string, userId: string) {
  const rows = await db
    .delete(notes)
    .where(and(eq(notes.id, id), eq(notes.userId, userId)))
    .returning({ id: notes.id });
  return rows.length > 0;
}
