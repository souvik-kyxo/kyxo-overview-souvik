const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const tasksRouter = require('../src/routes/tasks');

const app = express();
app.use(bodyParser.json());
app.use('/api/tasks', tasksRouter);

describe('Categories API', () => {
  describe('GET /api/tasks/categories/all', () => {
    test('returns array of categories', async () => {
      const response = await request(app).get('/api/tasks/categories/all');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    test('categories have required properties', async () => {
      const response = await request(app).get('/api/tasks/categories/all');
      const category = response.body[0];
      expect(category).toHaveProperty('name');
      expect(category).toHaveProperty('displayName');
      expect(category).toHaveProperty('color');
    });
  });

  describe('POST /api/tasks/categories', () => {
    test('creates a new category', async () => {
      const timestamp = Date.now();
      const response = await request(app)
        .post('/api/tasks/categories')
        .send({ name: `Test Category ${timestamp}`, color: '#ff5733', description: 'A test category' });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.displayName).toBe(`Test Category ${timestamp}`);
      expect(response.body.color).toBe('#ff5733');
    });

    test('rejects empty category name', async () => {
      const response = await request(app)
        .post('/api/tasks/categories')
        .send({ name: '', color: '#ff5733' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('rejects duplicate category', async () => {
      const timestamp = Date.now();
      const uniqueName = `Unique Category ${timestamp}`;
      await request(app)
        .post('/api/tasks/categories')
        .send({ name: uniqueName, color: '#ff5733' });

      const duplicateResponse = await request(app)
        .post('/api/tasks/categories')
        .send({ name: uniqueName, color: '#ff5733' });

      expect(duplicateResponse.status).toBe(409);
      expect(duplicateResponse.body).toHaveProperty('error');
    });

    test('validates hex color format', async () => {
      const timestamp = Date.now();
      const response = await request(app)
        .post('/api/tasks/categories')
        .send({ name: `Invalid Color ${timestamp}`, color: 'invalid' });

      expect(response.status).toBe(201);
      expect(response.body.color).toBe('#667eea');
    });
  });

  describe('DELETE /api/tasks/categories/:name', () => {
    test('deletes a category', async () => {
      const createResponse = await request(app)
        .post('/api/tasks/categories')
        .send({ name: 'Category to Delete', color: '#ff5733' });

      const categoryName = createResponse.body.name;

      const deleteResponse = await request(app)
        .delete(`/api/tasks/categories/${categoryName}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.name).toBe(categoryName);
    });

    test('returns 404 for non-existent category', async () => {
      const response = await request(app)
        .delete('/api/tasks/categories/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Categories with Tasks', () => {
    test('creates task with categories', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({
          title: 'Task with categories',
          categories: ['work', 'urgent'],
          status: 'todo',
          done: false
        });

      expect(response.status).toBe(201);
      expect(response.body.categories).toEqual(['work', 'urgent']);
    });

    test('updates task categories', async () => {
      const createResponse = await request(app)
        .post('/api/tasks')
        .send({
          title: 'Task to update',
          status: 'todo',
          done: false
        });

      const taskId = createResponse.body.id;

      const updateResponse = await request(app)
        .put(`/api/tasks/${taskId}`)
        .send({ categories: ['personal', 'shopping'] });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.categories).toEqual(['personal', 'shopping']);
    });

    test('clears task categories', async () => {
      const createResponse = await request(app)
        .post('/api/tasks')
        .send({
          title: 'Task with categories',
          categories: ['work'],
          status: 'todo',
          done: false
        });

      const taskId = createResponse.body.id;

      const updateResponse = await request(app)
        .put(`/api/tasks/${taskId}`)
        .send({ categories: [] });

      expect(updateResponse.status).toBe(200);
      expect(Array.isArray(updateResponse.body.categories) && updateResponse.body.categories.length === 0).toBe(true);
    });
  });
});
