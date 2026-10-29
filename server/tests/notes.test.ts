import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app';

const suffix = randomUUID().replaceAll('-', '').slice(0, 10);
const credentials = {
  email: `notes-${suffix}@example.com`,
  username: `notesuser${suffix}`,
  password: 'password-123',
};

const setCookies = (res: request.Response): string[] => {
  const raw = res.headers['set-cookie'];
  if (!raw) return [];
  return Array.isArray(raw) ? raw : [raw];
};

const cookieNamed = (res: request.Response, name: string): string | undefined =>
  setCookies(res)
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.split(';')[0];

const signUpAs = async (creds: {
  email: string;
  username: string;
  password: string;
}): Promise<string> => {
  const register = await request(app).post('/api/v1/auth/register').send(creds);
  if (register.status === 409) {
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: creds.email, password: creds.password });
    expect(login.status).toBe(200);
    const reused = cookieNamed(login, 'access_token');
    expect(reused).toBeDefined();
    return reused!;
  }
  expect(register.status).toBe(201);
  const access = cookieNamed(register, 'access_token');
  expect(access).toBeDefined();
  return access!;
};

const signUp = (): Promise<string> => signUpAs(credentials);

describe('notes', () => {
  it('requires auth on every notes route', async () => {
    expect((await request(app).get('/api/v1/notes')).status).toBe(401);
    expect((await request(app).post('/api/v1/notes').send({ title: 'x' })).status).toBe(401);
    expect((await request(app).delete('/api/v1/notes/123')).status).toBe(401);
  });

  it('creates, lists, reads, updates and deletes a note', async () => {
    const cookie = await signUp();

    const created = await request(app)
      .post('/api/v1/notes')
      .set('Cookie', cookie)
      .send({ title: 'Groceries', content: 'milk, eggs' });
    expect(created.status).toBe(201);
    expect(created.body.note).toMatchObject({ title: 'Groceries', content: 'milk, eggs' });
    expect(created.body.note).not.toHaveProperty('userId');
    const id = created.body.note.id as string;

    const list = await request(app).get('/api/v1/notes').set('Cookie', cookie);
    expect(list.status).toBe(200);
    expect(list.body.notes.some((note: { id: string }) => note.id === id)).toBe(true);

    const single = await request(app).get(`/api/v1/notes/${id}`).set('Cookie', cookie);
    expect(single.status).toBe(200);
    expect(single.body.note).toMatchObject({ id, title: 'Groceries' });

    const updated = await request(app)
      .patch(`/api/v1/notes/${id}`)
      .set('Cookie', cookie)
      .send({ title: 'Groceries (urgent)' });
    expect(updated.status).toBe(200);
    expect(updated.body.note).toMatchObject({ title: 'Groceries (urgent)', content: 'milk, eggs' });

    const removed = await request(app).delete(`/api/v1/notes/${id}`).set('Cookie', cookie);
    expect(removed.status).toBe(200);

    const afterDelete = await request(app).get(`/api/v1/notes/${id}`).set('Cookie', cookie);
    expect(afterDelete.status).toBe(404);
    expect(afterDelete.body.error.code).toBe('note_not_found');
  });

  it("never exposes another user's note", async () => {
    const cookie = await signUp();
    const created = await request(app)
      .post('/api/v1/notes')
      .set('Cookie', cookie)
      .send({ title: 'Private', content: 'secret' });
    const id = created.body.note.id as string;

    const otherCookie = await signUpAs({
      email: `other-${suffix}@example.com`,
      username: `otheruser${suffix}`,
      password: 'password-123',
    });

    const stolen = await request(app).get(`/api/v1/notes/${id}`).set('Cookie', otherCookie);
    expect(stolen.status).toBe(404);

    const stolenDelete = await request(app)
      .delete(`/api/v1/notes/${id}`)
      .set('Cookie', otherCookie);
    expect(stolenDelete.status).toBe(404);

    await request(app).delete(`/api/v1/notes/${id}`).set('Cookie', cookie);
  });

  it('rejects an empty payload and a malformed note id', async () => {
    const cookie = await signUp();

    const empty = await request(app)
      .post('/api/v1/notes')
      .set('Cookie', cookie)
      .send({ title: '   ' });
    expect(empty.status).toBe(422);
    expect(empty.body.error.code).toBe('validation_failed');

    const emptyPatch = await request(app).patch('/api/v1/notes/123').set('Cookie', cookie).send({});
    expect(emptyPatch.status).toBe(422);

    const malformed = await request(app).get('/api/v1/notes/not-a-uuid').set('Cookie', cookie);
    expect(malformed.status).toBe(422);
    expect(malformed.body.error.code).toBe('validation_failed');
  });
});
