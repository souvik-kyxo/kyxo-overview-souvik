const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const tasksRouter = require('../src/routes/tasks');

const app = express();
app.use(bodyParser.json());
app.use('/api/tasks', tasksRouter);

describe('Category Organization Features', () => {
  describe('GET /api/tasks/filter/category/:categoryName', () => {
    test('filters tasks by category', async () => {
      await request(app)
        .post('/api/tasks')
        .send({
          title: 'Work task',
          categories: ['work'],
          status: 'todo',
          done: false
        });

      const response = await request(app)
        .get('/api/tasks/filter/category/work');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].categories).toContain('work');
    });

    test('returns empty array for non-existent category', async () => {
      const response = await request(app)
        .get('/api/tasks/filter/category/nonexistent');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });
  });

  describe('GET /api/tasks/by-category', () => {
    test('returns tasks grouped by category', async () => {
      await request(app)
        .post('/api/tasks')
        .send({
          title: 'Personal task',
          categories: ['personal'],
          status: 'todo',
          done: false
        });

      const response = await request(app)
        .get('/api/tasks/by-category');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('grouped');
      expect(response.body).toHaveProperty('uncategorized');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.grouped)).toBe(true);
    });

    test('groups structure contains category and count', async () => {
      const response = await request(app)
        .get('/api/tasks/by-category');

      expect(response.status).toBe(200);
      if (response.body.grouped.length > 0) {
        const group = response.body.grouped[0];
        expect(group).toHaveProperty('category');
        expect(group).toHaveProperty('tasks');
        expect(group).toHaveProperty('count');
      }
    });
  });

  describe('GET /api/tasks/categories/stats', () => {
    test('returns category statistics', async () => {
      const response = await request(app)
        .get('/api/tasks/categories/stats');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('category stats include task count', async () => {
      const response = await request(app)
        .get('/api/tasks/categories/stats');

      expect(response.status).toBe(200);
      if (response.body.length > 0) {
        const stat = response.body[0];
        expect(stat).toHaveProperty('name');
        expect(stat).toHaveProperty('taskCount');
        expect(typeof stat.taskCount).toBe('number');
      }
    });
  });
});
