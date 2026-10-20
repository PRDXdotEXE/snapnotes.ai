import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app';

const suffix = randomUUID().replaceAll('-', '').slice(0, 10);
const credentials = {
  email: `test-${suffix}@example.com`,
  username: `testuser${suffix}`,
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

const ensureUser = async (): Promise<void> => {
  const res = await request(app).post('/api/v1/auth/register').send(credentials);
  expect([201, 409]).toContain(res.status);
};

describe('auth', () => {
  it('POST /api/v1/auth/register creates a user and sets httpOnly cookies', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(credentials);

    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({
      email: credentials.email,
      name: credentials.username,
    });
    expect(res.body.user).not.toHaveProperty('passwordHash');
    expect(res.body).not.toHaveProperty('token');

    const access = cookieNamed(res, 'access_token');
    expect(access).toBeDefined();
    expect(setCookies(res).join(' ')).toContain('HttpOnly');
    expect(access).toContain('access_token=');
  });

  it('registering the same email twice returns 409 user_exists', async () => {
    await ensureUser();
    const res = await request(app).post('/api/v1/auth/register').send(credentials);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('user_exists');
  });

  it('registering an invalid payload returns 422 validation_failed', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'not-an-email', username: 'ab', password: 'short' });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('validation_failed');
  });

  it('POST /api/v1/auth/login with a wrong password returns 401', async () => {
    await ensureUser();
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: credentials.email, password: 'wrong-password' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('invalid_credentials');
  });

  it('POST /api/v1/auth/login succeeds and GET /api/v1/auth/me reads the cookie', async () => {
    await ensureUser();
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: credentials.email, password: credentials.password });

    expect(login.status).toBe(200);
    expect(login.body.user).not.toHaveProperty('passwordHash');
    const access = cookieNamed(login, 'access_token');
    expect(access).toBeDefined();

    const me = await request(app).get('/api/v1/auth/me').set('Cookie', access!);
    expect(me.status).toBe(200);
    expect(me.body.user).toMatchObject({ email: credentials.email });
    expect(me.body.user).not.toHaveProperty('passwordHash');
  });

  it('GET /api/v1/auth/me without a cookie returns 401 unauthorized', async () => {
    const res = await request(app).get('/api/v1/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('unauthorized');
  });

  it('POST /api/v1/auth/logout clears the auth cookies', async () => {
    await ensureUser();
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: credentials.email, password: credentials.password });
    const access = cookieNamed(login, 'access_token');

    const res = await request(app).post('/api/v1/auth/logout').set('Cookie', access!);

    expect(res.status).toBe(200);
    expect(setCookies(res).join(' ')).toContain('access_token=;');
    expect(setCookies(res).join(' ')).toContain('refresh_token=;');
  });
});
