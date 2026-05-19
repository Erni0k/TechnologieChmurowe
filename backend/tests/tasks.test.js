jest.mock('../src/models/db', () => ({
  pool: { query: jest.fn() },
  initDB: jest.fn().mockResolvedValue(undefined),
}));

const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const { pool } = require('../src/models/db');

const JWT_SECRET = 'dev-secret';
process.env.JWT_SECRET = JWT_SECRET;

function makeToken(userId = 1, username = 'testuser') {
  return jwt.sign({ userId, username }, JWT_SECRET);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /api/health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('POST /api/auth/register', () => {
  it('creates user and returns token', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 1, username: 'alice' }],
    });
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'alice', password: 'secret123' });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.username).toBe('alice');
  });

  it('returns 400 when username already exists', async () => {
    pool.query.mockRejectedValueOnce({ code: '23505' });
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'alice', password: 'secret123' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already exists/i);
  });

  it('returns 400 when password is too short', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'alice', password: '123' });
    expect(res.status).toBe(400);
  });

  it('stores a bcrypt hash, not plaintext password', async () => {
    let storedHash;
    pool.query.mockImplementationOnce(async (sql, params) => {
      storedHash = params[1];
      return { rows: [{ id: 1, username: 'alice' }] };
    });
    await request(app)
      .post('/api/auth/register')
      .send({ username: 'alice', password: 'mypassword' });
    expect(storedHash).toBeDefined();
    expect(storedHash).not.toBe('mypassword');
    const isHash = await bcrypt.compare('mypassword', storedHash);
    expect(isHash).toBe(true);
  });
});

describe('POST /api/auth/login', () => {
  it('returns token for valid credentials', async () => {
    const hash = await bcrypt.hash('correctpassword', 12);
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 1, username: 'alice', password_hash: hash }],
    });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'alice', password: 'correctpassword' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('returns 401 for wrong password', async () => {
    const hash = await bcrypt.hash('correctpassword', 12);
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 1, username: 'alice', password_hash: hash }],
    });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'alice', password: 'wrongpassword' });
    expect(res.status).toBe(401);
  });

  it('returns 401 for unknown user', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'ghost', password: 'whatever' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/tasks', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(401);
  });

  it('returns task list for authenticated user', async () => {
    const tasks = [
      { id: 1, user_id: 1, title: 'Buy milk', completed: false },
      { id: 2, user_id: 1, title: 'Do laundry', completed: true },
    ];
    pool.query.mockResolvedValueOnce({ rows: tasks });
    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].title).toBe('Buy milk');
  });
});

describe('POST /api/tasks', () => {
  it('creates a new task', async () => {
    const newTask = { id: 3, user_id: 1, title: 'New task', description: null, completed: false };
    pool.query.mockResolvedValueOnce({ rows: [newTask] });
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ title: 'New task' });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('New task');
  });

  it('returns 400 when title is missing', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ description: 'no title' });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/tasks/:id', () => {
  it('deletes task and returns 204', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
    const res = await request(app)
      .delete('/api/tasks/1')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(204);
  });

  it('returns 404 when task does not exist', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app)
      .delete('/api/tasks/999')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(404);
  });
});
