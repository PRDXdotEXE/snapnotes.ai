import type { Request, Response } from 'express';
import { AppError } from '../../lib/AppError';
import { createNote, getNote, listNotes, removeNote, updateNote } from './notes.service';
import { noteIdSchema } from './notes.schema';
import type { Note } from './notesTypes';

const toResponse = ({ userId: _userId, ...note }: Note) => note;

const requireUser = (req: Request) => {
  if (!req.user) {
    throw new AppError(401, 'unauthorized', 'Authentication required');
  }
  return req.user;
};

const noteId = (req: Request) => noteIdSchema.parse(req.params.id);

export async function createNotes(req: Request, res: Response) {
  const note = await createNote(requireUser(req).id, req.body);
  return res.status(201).json({ message: 'Note created', note: toResponse(note) });
}

export async function getNotes(req: Request, res: Response) {
  const notes = await listNotes(requireUser(req).id);
  return res.status(200).json({ message: 'OK', notes: notes.map(toResponse) });
}

export async function getNoteById(req: Request, res: Response) {
  const note = await getNote(requireUser(req).id, noteId(req));
  return res.status(200).json({ message: 'OK', note: toResponse(note) });
}

export async function updateNoteRoute(req: Request, res: Response) {
  const note = await updateNote(requireUser(req).id, noteId(req), req.body);
  return res.status(200).json({ message: 'Note updated', note: toResponse(note) });
}

export async function deleteNote(req: Request, res: Response) {
  await removeNote(requireUser(req).id, noteId(req));
  return res.status(200).json({ message: 'Note deleted' });
}
