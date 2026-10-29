import {
  deleteNoteForUser,
  findNoteByIdForUser,
  insertNote,
  listNotesForUser,
  updateNoteForUser,
} from '../../db/queries/notes';
import { AppError } from '../../lib/AppError';
import { CreateNoteInput, UpdateNoteInput } from './notes.schema';
import { ListNotesOptions, Note } from './notesTypes';

const defaultListOptions: ListNotesOptions = { limit: 100, offset: 0 };

export async function createNote(userId: string, data: CreateNoteInput): Promise<Note> {
  return insertNote({ title: data.title, content: data.content ?? '', userId });
}

export async function listNotes(
  userId: string,
  options: ListNotesOptions = defaultListOptions,
): Promise<Note[]> {
  return listNotesForUser(userId, options);
}

export async function getNote(userId: string, noteId: string): Promise<Note> {
  const note = await findNoteByIdForUser(noteId, userId);
  if (!note) {
    throw new AppError(404, 'note_not_found', 'Note not found');
  }
  return note;
}

export async function updateNote(
  userId: string,
  noteId: string,
  changes: UpdateNoteInput,
): Promise<Note> {
  const note = await updateNoteForUser(noteId, userId, changes);
  if (!note) {
    throw new AppError(404, 'note_not_found', 'Note not found');
  }
  return note;
}

export async function removeNote(userId: string, noteId: string): Promise<void> {
  const deleted = await deleteNoteForUser(noteId, userId);
  if (!deleted) {
    throw new AppError(404, 'note_not_found', 'Note not found');
  }
}
