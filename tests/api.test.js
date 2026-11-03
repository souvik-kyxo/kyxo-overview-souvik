const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const tasksRouter = require('../src/routes/tasks');
const authRouter = require('../src/routes/auth');
const Task = require('../src/models/Task');
const { generateAccessToken } = require('../src/middleware/auth');

// Create test app
const app = express();
app.use(bodyParser.json());
app.use('/api/auth', authRouter);
app.use('/api/tasks', tasksRouter);

let testUserId = 'test-user-1';
let testToken = generateAccessToken(testUserId, 'testuser');

describe('Tasks API', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  describe('GET /api/tasks', () => {
    test('returns 401 without authentication', async () => {
      const response = await request(app).get('/api/tasks');
      expect(response.status).toBe(401);
    });

    test('returns empty array initially with auth', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${testToken}`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /api/tasks', () => {
    test('creates a new task with valid data', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ title: 'New task', status: 'todo', done: false });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('New task');
      expect(response.body.status).toBe('todo');
      expect(response.body.done).toBe(false);
    });

    test('rejects empty title', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ title: '', status: 'todo', done: false });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('rejects whitespace-only title', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ title: '   ', status: 'todo', done: false });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('creates task with default status if not provided', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ title: 'Another task' });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('todo');
      expect(response.body.done).toBe(false);
    });
  });

  describe('PUT /api/tasks/:id', () => {
    test('updates task status', async () => {
      // Create a task first
      const createResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ title: 'Task to update', status: 'todo', done: false });

      const taskId = createResponse.body.id;

      // Update the task status
      const updateResponse = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({ status: 'in-progress' });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.status).toBe('in-progress');
      expect(updateResponse.body.title).toBe('Task to update');
    });

    test('updates task done flag', async () => {
      // Create a task first
      const createResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ title: 'Task to mark done', status: 'todo', done: false });

      const taskId = createResponse.body.id;

      // Mark as done
      const updateResponse = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({ done: true });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.done).toBe(true);
      expect(updateResponse.body.status).toBe('todo'); // Status should remain unchanged
    });

    test('returns 404 for non-existent task', async () => {
      const response = await request(app)
        .put('/api/tasks/nonexistent-id')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ status: 'done' });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    test('rejects empty title update', async () => {
      // Create a task first
      const createResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ title: 'Original title', status: 'todo', done: false });

      const taskId = createResponse.body.id;

      // Try to update with empty title
      const updateResponse = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({ title: '' });

      expect(updateResponse.status).toBe(400);
      expect(updateResponse.body).toHaveProperty('error');
    });

    test('updates multiple fields at once', async () => {
      // Create a task first
      const createResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ title: 'Task to update', status: 'todo', done: false });

      const taskId = createResponse.body.id;

      // Update multiple fields
      const updateResponse = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({ status: 'done', done: true });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.status).toBe('done');
      expect(updateResponse.body.done).toBe(true);
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    test('deletes a task', async () => {
      // Create a task first
      const createResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ title: 'Task to delete', status: 'todo', done: false });

      const taskId = createResponse.body.id;

      // Delete the task
      const deleteResponse = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.id).toBe(taskId);
      expect(deleteResponse.body.title).toBe('Task to delete');

      // Verify it's gone
      const getResponse = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${testToken}`);
      const taskExists = getResponse.body.some(t => t.id === taskId);
      expect(taskExists).toBe(false);
    });

    test('returns 404 for non-existent task', async () => {
      const response = await request(app)
        .delete('/api/tasks/nonexistent-id')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Happy path scenarios', () => {
    test('add new task and verify it appears exactly once', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ title: 'Test task', status: 'todo', done: false });

      expect(response.status).toBe(201);
      const taskId = response.body.id;

      // Get all tasks
      const listResponse = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${testToken}`);
      const matchingTasks = listResponse.body.filter(t => t.id === taskId);
      expect(matchingTasks.length).toBe(1);
      expect(matchingTasks[0].title).toBe('Test task');
    });

    test('assign status to task and verify it displays', async () => {
      // Create task
      const createResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ title: 'Status test task', status: 'todo', done: false });

      const taskId = createResponse.body.id;

      // Assign status
      const updateResponse = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({ status: 'in-progress' });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.status).toBe('in-progress');

      // Verify in list
      const listResponse = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${testToken}`);
      const task = listResponse.body.find(t => t.id === taskId);
      expect(task.status).toBe('in-progress');
    });

    test('mark task as done and change status while retaining done state', async () => {
      // Create task
      const createResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ title: 'Complex test task', status: 'todo', done: false });

      const taskId = createResponse.body.id;

      // Mark as done
      const doneResponse = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({ done: true });

      expect(doneResponse.body.done).toBe(true);
      expect(doneResponse.body.status).toBe('todo');

      // Change status while done
      const statusResponse = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({ status: 'in-progress' });

      expect(statusResponse.body.status).toBe('in-progress');
      expect(statusResponse.body.done).toBe(true); // Should still be done
    });
  });

  describe('Due Dates Feature', () => {
    test('creates a task with a due date', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ title: 'Task with due date', status: 'todo', done: false, dueDate: '2025-12-31' });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('dueDate');
      expect(response.body.dueDate).toBe('2025-12-31');
    });

    test('creates a task without a due date', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ title: 'Task without due date', status: 'todo', done: false });

      expect(response.status).toBe(201);
      expect(response.body.dueDate).toBeUndefined();
    });

    test('updates a task with a due date', async () => {
      const createResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ title: 'Task to add due date', status: 'todo', done: false });

      const taskId = createResponse.body.id;

      const updateResponse = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({ dueDate: '2025-06-30' });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.dueDate).toBe('2025-06-30');
    });

    test('clears a due date by setting it to null', async () => {
      const createResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ title: 'Task with due date', status: 'todo', done: false, dueDate: '2025-12-31' });

      const taskId = createResponse.body.id;

      const updateResponse = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({ dueDate: null });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.dueDate).toBeUndefined();
    });

    test('persists due date across multiple operations', async () => {
      const createResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ title: 'Task with persistence', status: 'todo', done: false, dueDate: '2025-12-31' });

      const taskId = createResponse.body.id;

      // Change status but keep due date
      await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({ status: 'in-progress' });

      // Mark as done but keep due date
      const finalResponse = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({ done: true });

      expect(finalResponse.body.dueDate).toBe('2025-12-31');
      expect(finalResponse.body.status).toBe('in-progress');
      expect(finalResponse.body.done).toBe(true);
    });
  });
});
