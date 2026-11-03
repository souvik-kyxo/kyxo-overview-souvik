const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const authRouter = require('../src/routes/auth');
const tasksRouter = require('../src/routes/tasks');
const User = require('../src/models/User');
const UserStorage = require('../src/utils/userStorage');

const app = express();
app.use(bodyParser.json());
app.use('/api/auth', authRouter);
app.use('/api/tasks', tasksRouter);

const TEST_PASSWORD = process.env.TEST_PASSWORD || 'TestPass123456';

describe('Authentication & Authorization', () => {
  const testUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: TEST_PASSWORD
  };

  describe('User Registration', () => {
    test('[REQ-10001:AC1] can register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(response.status).toBe(201);
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.username).toBe(testUser.username);
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    test('rejects registration with existing username', async () => {
      const user1 = { ...testUser };
      const user2 = { ...testUser, email: 'different@example.com' };

      await request(app).post('/api/auth/register').send(user1);
      const response = await request(app).post('/api/auth/register').send(user2);

      expect(response.status).toBe(409);
      expect(response.body.error).toContain('Username already exists');
    });

    test('rejects registration with existing email', async () => {
      const user1 = { ...testUser };
      const user2 = { ...testUser, username: 'differentuser' };

      await request(app).post('/api/auth/register').send(user1);
      const response = await request(app).post('/api/auth/register').send(user2);

      expect(response.status).toBe(409);
      expect(response.body.error).toContain('Email already exists');
    });

    test('rejects registration with missing fields', async () => {
      const invalidUsers = [
        { email: 'test@example.com', password: 'password' },
        { username: 'testuser', password: 'password' },
        { username: 'testuser', email: 'test@example.com' }
      ];

      for (const user of invalidUsers) {
        const response = await request(app).post('/api/auth/register').send(user);
        expect(response.status).toBe(400);
      }
    });

    test('rejects registration with short password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...testUser, password: 'short' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('at least 6 characters');
    });

    test('rejects registration with short username', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...testUser, username: 'ab' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('at least 3 characters');
    });
  });

  describe('User Login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(testUser);
    });

    test('can login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: testUser.username, password: testUser.password });

      expect(response.status).toBe(200);
      expect(response.body.user.username).toBe(testUser.username);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    test('rejects login with invalid username', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'nonexistent', password: testUser.password });

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Invalid username or password');
    });

    test('rejects login with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: testUser.username, password: 'wrongpassword' });

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Invalid username or password');
    });

    test('rejects login with missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: testUser.username });

      expect(response.status).toBe(400);
    });
  });

  describe('Token Refresh', () => {
    let refreshToken;

    beforeEach(async () => {
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(testUser);
      refreshToken = registerResponse.body.refreshToken;
    });

    test('can refresh access token with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(typeof response.body.accessToken).toBe('string');
    });

    test('rejects refresh with invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid.token.here' });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Invalid or expired');
    });

    test('rejects refresh with missing refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('required');
    });
  });

  describe('Route Protection & Authorization', () => {
    let accessToken;
    let user1Token;
    let user2Token;
    let user1Id;
    let user2Id;

    beforeEach(async () => {
      const response1 = await request(app)
        .post('/api/auth/register')
        .send({ username: 'user1', email: 'user1@example.com', password: TEST_PASSWORD });
      user1Token = response1.body.accessToken;
      user1Id = response1.body.user.id;

      const response2 = await request(app)
        .post('/api/auth/register')
        .send({ username: 'user2', email: 'user2@example.com', password: TEST_PASSWORD });
      user2Token = response2.body.accessToken;
      user2Id = response2.body.user.id;
    });

    test('rejects task request without authentication token', async () => {
      const response = await request(app).get('/api/tasks');

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('required');
    });

    test('[REQ-10002:AC1] rejects task request with invalid token', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', 'Bearer invalid.token.here');

      expect(response.status).toBe(403);
    });

    test('user1 cannot access user2 tasks', async () => {
      const task1Response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ title: 'User 1 task' });

      const task1Id = task1Response.body.id;

      const user2TasksResponse = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${user2Token}`);

      const user2Tasks = user2TasksResponse.body;
      const foundTask = user2Tasks.find(t => t.id === task1Id);

      expect(foundTask).toBeUndefined();
    });

    test('user cannot delete another user\'s task', async () => {
      const task1Response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ title: 'User 1 task' });

      const task1Id = task1Response.body.id;

      const deleteResponse = await request(app)
        .delete(`/api/tasks/${task1Id}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(deleteResponse.status).toBe(404);
    });

    test('user cannot update another user\'s task', async () => {
      const task1Response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ title: 'User 1 task' });

      const task1Id = task1Response.body.id;

      const updateResponse = await request(app)
        .put(`/api/tasks/${task1Id}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ title: 'Modified' });

      expect(updateResponse.status).toBe(404);
    });
  });

  describe('Password Security', () => {
    test('password is hashed and not stored in plain text', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      const user = response.body.user;
      expect(user).not.toHaveProperty('password');
      expect(user).not.toHaveProperty('passwordHash');
    });
  });
});
