import { notes } from '../../db/schema';

export type Note = typeof notes.$inferSelect;
export type ListNotesOptions = { limit: number; offset: number };
