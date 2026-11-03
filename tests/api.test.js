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

  describe('Priority Feature', () => {
    test('[REQ-10001:AC1] creates a task with priority level', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ title: 'High priority task', priority: 'high' });

      expect(response.status).toBe(201);
      expect(response.body.priority).toBe('high');
    });

    test('creates a task with default priority if not specified', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ title: 'Default priority task' });

      expect(response.status).toBe(201);
      expect(response.body.priority).toBe('medium');
    });

    test('updates task priority', async () => {
      const createResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ title: 'Task to update priority', priority: 'low' });

      const taskId = createResponse.body.id;

      const updateResponse = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({ priority: 'high' });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.priority).toBe('high');
    });

    test('supports all priority levels', async () => {
      const priorities = ['low', 'medium', 'high'];

      for (const priority of priorities) {
        const response = await request(app)
          .post('/api/tasks')
          .set('Authorization', `Bearer ${testToken}`)
          .send({ title: `Task with ${priority} priority`, priority });

        expect(response.status).toBe(201);
        expect(response.body.priority).toBe(priority);
      }
    });
  });

  describe('Description and Tags Feature', () => {
    test('creates a task with description', async () => {
      const description = 'This is a detailed task description';
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ title: 'Task with description', description });

      expect(response.status).toBe(201);
      expect(response.body.description).toBe(description);
    });

    test('creates a task with tags', async () => {
      const tags = ['work', 'urgent', 'client'];
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ title: 'Task with tags', tags });

      expect(response.status).toBe(201);
      expect(response.body.tags).toEqual(tags);
    });

    test('updates task description', async () => {
      const createResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ title: 'Task to update description', description: 'Original' });

      const taskId = createResponse.body.id;
      const newDescription = 'Updated description';

      const updateResponse = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({ description: newDescription });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.description).toBe(newDescription);
    });

    test('updates task tags', async () => {
      const createResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ title: 'Task with tags', tags: ['old'] });

      const taskId = createResponse.body.id;
      const newTags = ['new', 'tags', 'added'];

      const updateResponse = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({ tags: newTags });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.tags).toEqual(newTags);
    });
  });

  describe('Timestamps Feature', () => {
    test('task has createdAt and updatedAt timestamps', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ title: 'Task with timestamps' });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
      expect(new Date(response.body.createdAt)).toBeInstanceOf(Date);
    });

    test('[REQ-10003:AC1] task gets completedAt when marked done', async () => {
      const createResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ title: 'Task to complete' });

      const taskId = createResponse.body.id;

      const updateResponse = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({ done: true });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body).toHaveProperty('completedAt');
      expect(new Date(updateResponse.body.completedAt)).toBeInstanceOf(Date);
    });

    test('completedAt is cleared when task is marked not done', async () => {
      const createResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ title: 'Task to uncomplete' });

      const taskId = createResponse.body.id;

      // Mark as done
      await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({ done: true });

      // Mark as not done
      const unmarkResponse = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({ done: false });

      expect(unmarkResponse.status).toBe(200);
      expect(unmarkResponse.body.completedAt).toBeUndefined();
    });

    test('updatedAt is updated when task is modified', async () => {
      const createResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ title: 'Task to modify' });

      const taskId = createResponse.body.id;
      const originalUpdatedAt = createResponse.body.updatedAt;

      // Small delay to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      const updateResponse = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({ title: 'Task modified' });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.updatedAt).not.toBe(originalUpdatedAt);
    });
  });
});
