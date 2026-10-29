import { z } from 'zod';

export const createNoteSchema = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().max(50000).optional(),
});

export const updateNoteSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    content: z.string().max(50000).optional(),
  })
  .refine((data) => data.title !== undefined || data.content !== undefined, {
    message: 'Provide title or content',
    path: ['title'],
  });

export const noteIdSchema = z.uuid();

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
