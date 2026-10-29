import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate';
import {
  createNotes,
  deleteNote,
  getNoteById,
  getNotes,
  updateNoteRoute,
} from './notes.controller';
import { createNoteSchema, updateNoteSchema } from './notes.schema';

export const notesRouter = Router();

notesRouter.use(requireAuth);

notesRouter.get('/', getNotes);
notesRouter.post('/', validate(createNoteSchema), createNotes);
notesRouter.get('/:id', getNoteById);
notesRouter.put('/:id', validate(updateNoteSchema), updateNoteRoute);
notesRouter.patch('/:id', validate(updateNoteSchema), updateNoteRoute);
notesRouter.delete('/:id', deleteNote);
