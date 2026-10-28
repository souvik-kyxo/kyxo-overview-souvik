const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const tasksRouter = require('../src/routes/tasks');
const Task = require('../src/models/Task');

// Create test app
const app = express();
app.use(bodyParser.json());
app.use('/api/tasks', tasksRouter);

describe('Tasks API', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  describe('GET /api/tasks', () => {
    test('returns empty array initially', async () => {
      const response = await request(app).get('/api/tasks');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /api/tasks', () => {
    test('creates a new task with valid data', async () => {
      const response = await request(app)
        .post('/api/tasks')
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
        .send({ title: '', status: 'todo', done: false });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('rejects whitespace-only title', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({ title: '   ', status: 'todo', done: false });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('creates task with default status if not provided', async () => {
      const response = await request(app)
        .post('/api/tasks')
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
        .send({ title: 'Task to update', status: 'todo', done: false });

      const taskId = createResponse.body.id;

      // Update the task status
      const updateResponse = await request(app)
        .put(`/api/tasks/${taskId}`)
        .send({ status: 'in-progress' });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.status).toBe('in-progress');
      expect(updateResponse.body.title).toBe('Task to update');
    });

    test('updates task done flag', async () => {
      // Create a task first
      const createResponse = await request(app)
        .post('/api/tasks')
        .send({ title: 'Task to mark done', status: 'todo', done: false });

      const taskId = createResponse.body.id;

      // Mark as done
      const updateResponse = await request(app)
        .put(`/api/tasks/${taskId}`)
        .send({ done: true });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.done).toBe(true);
      expect(updateResponse.body.status).toBe('todo'); // Status should remain unchanged
    });

    test('returns 404 for non-existent task', async () => {
      const response = await request(app)
        .put('/api/tasks/nonexistent-id')
        .send({ status: 'done' });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    test('rejects empty title update', async () => {
      // Create a task first
      const createResponse = await request(app)
        .post('/api/tasks')
        .send({ title: 'Original title', status: 'todo', done: false });

      const taskId = createResponse.body.id;

      // Try to update with empty title
      const updateResponse = await request(app)
        .put(`/api/tasks/${taskId}`)
        .send({ title: '' });

      expect(updateResponse.status).toBe(400);
      expect(updateResponse.body).toHaveProperty('error');
    });

    test('updates multiple fields at once', async () => {
      // Create a task first
      const createResponse = await request(app)
        .post('/api/tasks')
        .send({ title: 'Task to update', status: 'todo', done: false });

      const taskId = createResponse.body.id;

      // Update multiple fields
      const updateResponse = await request(app)
        .put(`/api/tasks/${taskId}`)
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
        .send({ title: 'Task to delete', status: 'todo', done: false });

      const taskId = createResponse.body.id;

      // Delete the task
      const deleteResponse = await request(app)
        .delete(`/api/tasks/${taskId}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.id).toBe(taskId);
      expect(deleteResponse.body.title).toBe('Task to delete');

      // Verify it's gone
      const getResponse = await request(app).get('/api/tasks');
      const taskExists = getResponse.body.some(t => t.id === taskId);
      expect(taskExists).toBe(false);
    });

    test('returns 404 for non-existent task', async () => {
      const response = await request(app)
        .delete('/api/tasks/nonexistent-id');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Happy path scenarios', () => {
    test('add new task and verify it appears exactly once', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({ title: 'Test task', status: 'todo', done: false });

      expect(response.status).toBe(201);
      const taskId = response.body.id;

      // Get all tasks
      const listResponse = await request(app).get('/api/tasks');
      const matchingTasks = listResponse.body.filter(t => t.id === taskId);
      expect(matchingTasks.length).toBe(1);
      expect(matchingTasks[0].title).toBe('Test task');
    });

    test('assign status to task and verify it displays', async () => {
      // Create task
      const createResponse = await request(app)
        .post('/api/tasks')
        .send({ title: 'Status test task', status: 'todo', done: false });

      const taskId = createResponse.body.id;

      // Assign status
      const updateResponse = await request(app)
        .put(`/api/tasks/${taskId}`)
        .send({ status: 'in-progress' });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.status).toBe('in-progress');

      // Verify in list
      const listResponse = await request(app).get('/api/tasks');
      const task = listResponse.body.find(t => t.id === taskId);
      expect(task.status).toBe('in-progress');
    });

    test('mark task as done and change status while retaining done state', async () => {
      // Create task
      const createResponse = await request(app)
        .post('/api/tasks')
        .send({ title: 'Complex test task', status: 'todo', done: false });

      const taskId = createResponse.body.id;

      // Mark as done
      const doneResponse = await request(app)
        .put(`/api/tasks/${taskId}`)
        .send({ done: true });

      expect(doneResponse.body.done).toBe(true);
      expect(doneResponse.body.status).toBe('todo');

      // Change status while done
      const statusResponse = await request(app)
        .put(`/api/tasks/${taskId}`)
        .send({ status: 'in-progress' });

      expect(statusResponse.body.status).toBe('in-progress');
      expect(statusResponse.body.done).toBe(true); // Should still be done
    });
  });
});
