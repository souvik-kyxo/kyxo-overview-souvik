const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const authRouter = require('../src/routes/auth');
const tasksRouter = require('../src/routes/tasks');

const app = express();
app.use(bodyParser.json());
app.use('/api/auth', authRouter);
app.use('/api/tasks', tasksRouter);

const TEST_PASSWORD = process.env.TEST_PASSWORD || 'testPassword123';

describe('End-to-End Workflow', () => {
  describe('Complete User Journey', () => {
    test('[REQ-10001:AC1] full workflow: register, create task, mark done', async () => {
      const userCreds = {
        username: 'fullworkflowuser',
        email: 'workflow@example.com',
        password: TEST_PASSWORD
      };

      // Step 1: Register user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userCreds);

      expect(registerResponse.status).toBe(201);
      const { accessToken, user } = registerResponse.body;
      expect(accessToken).toBeDefined();
      expect(user.username).toBe(userCreds.username);

      // Step 2: Load tasks (should be empty)
      const tasksResponse1 = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(tasksResponse1.status).toBe(200);
      expect(tasksResponse1.body).toEqual([]);

      // Step 3: Create a task
      const taskData = {
        title: 'Complete project',
        description: 'Finish the project by Friday',
        priority: 'high',
        tags: ['work', 'urgent'],
        dueDate: '2025-12-31'
      };

      const createTaskResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(taskData);

      expect(createTaskResponse.status).toBe(201);
      const task = createTaskResponse.body;
      expect(task.title).toBe(taskData.title);
      expect(task.description).toBe(taskData.description);
      expect(task.priority).toBe('high');
      expect(task.status).toBe('todo');
      expect(task.done).toBe(false);

      // Step 4: Fetch tasks (should have one)
      const tasksResponse2 = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(tasksResponse2.status).toBe(200);
      expect(tasksResponse2.body.length).toBe(1);
      expect(tasksResponse2.body[0].title).toBe(taskData.title);

      // Step 5: Update task status
      const updateStatusResponse = await request(app)
        .put(`/api/tasks/${task.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status: 'in-progress' });

      expect(updateStatusResponse.status).toBe(200);
      expect(updateStatusResponse.body.status).toBe('in-progress');

      // Step 6: Mark task as done
      const markDoneResponse = await request(app)
        .put(`/api/tasks/${task.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ done: true });

      expect(markDoneResponse.status).toBe(200);
      expect(markDoneResponse.body.done).toBe(true);
      expect(markDoneResponse.body).toHaveProperty('completedAt');

      // Step 7: Verify task shows as done
      const tasksResponse3 = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(tasksResponse3.body[0].done).toBe(true);
      expect(tasksResponse3.body[0].status).toBe('in-progress');

      // Step 8: Delete task
      const deleteResponse = await request(app)
        .delete(`/api/tasks/${task.id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(deleteResponse.status).toBe(200);

      // Step 9: Verify task is deleted
      const tasksResponse4 = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(tasksResponse4.body.length).toBe(0);
    });

    test('login, refresh token, access tasks workflow', async () => {
      // Register user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'tokenworkflowuser',
          email: 'tokenworkflow@example.com',
          password: TEST_PASSWORD
        });

      const { refreshToken: originalRefreshToken } = registerResponse.body;

      // Login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'tokenworkflowuser',
          password: TEST_PASSWORD
        });

      expect(loginResponse.status).toBe(200);
      let accessToken = loginResponse.body.accessToken;

      // Create task with original token
      const createTaskResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Test task' });

      expect(createTaskResponse.status).toBe(201);
      const taskId = createTaskResponse.body.id;

      // Refresh token
      const refreshResponse = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: originalRefreshToken });

      expect(refreshResponse.status).toBe(200);
      accessToken = refreshResponse.body.accessToken;

      // Access tasks with refreshed token
      const tasksResponse = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(tasksResponse.status).toBe(200);
      expect(tasksResponse.body.length).toBe(1);
      expect(tasksResponse.body[0].id).toBe(taskId);
    });

    test('can manage multiple tasks with different priorities', async () => {
      // Register user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'multitaskuser',
          email: 'multitask@example.com',
          password: TEST_PASSWORD
        });

      const { accessToken } = registerResponse.body;

      // Create multiple tasks with different priorities
      const tasks = [
        { title: 'High priority', priority: 'high' },
        { title: 'Medium priority', priority: 'medium' },
        { title: 'Low priority', priority: 'low' }
      ];

      const createdTasks = [];
      for (const taskData of tasks) {
        const response = await request(app)
          .post('/api/tasks')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(taskData);

        expect(response.status).toBe(201);
        createdTasks.push(response.body);
      }

      // Fetch all tasks
      const tasksResponse = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(tasksResponse.status).toBe(200);
      expect(tasksResponse.body.length).toBe(3);

      // Verify priorities are preserved
      const priorities = tasksResponse.body.map(t => t.priority);
      expect(priorities).toContain('high');
      expect(priorities).toContain('medium');
      expect(priorities).toContain('low');

      // Update priorities
      for (let i = 0; i < createdTasks.length; i++) {
        const newPriority = tasks[i].priority === 'high' ? 'low' : 'high';
        const updateResponse = await request(app)
          .put(`/api/tasks/${createdTasks[i].id}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ priority: newPriority });

        expect(updateResponse.status).toBe(200);
        expect(updateResponse.body.priority).toBe(newPriority);
      }
    });

    test('[REQ-10002:AC1] can update task status and display multiple stage statuses', async () => {
      // Register user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'statususer',
          email: 'status@example.com',
          password: TEST_PASSWORD
        });

      const { accessToken } = registerResponse.body;

      // Create a task with default status
      const createTaskResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Task with status' });

      expect(createTaskResponse.status).toBe(201);
      const task = createTaskResponse.body;
      expect(task.status).toBe('todo');

      // Test updating task to in-progress status
      const updateInProgressResponse = await request(app)
        .put(`/api/tasks/${task.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status: 'in-progress' });

      expect(updateInProgressResponse.status).toBe(200);
      expect(updateInProgressResponse.body.status).toBe('in-progress');

      // Test updating task to done status
      const updateDoneResponse = await request(app)
        .put(`/api/tasks/${task.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status: 'done' });

      expect(updateDoneResponse.status).toBe(200);
      expect(updateDoneResponse.body.status).toBe('done');

      // Verify status is displayed when fetching tasks
      const tasksResponse = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(tasksResponse.status).toBe(200);
      const fetchedTask = tasksResponse.body.find(t => t.id === task.id);
      expect(fetchedTask.status).toBe('done');

      // Create multiple tasks with different statuses to verify system supports multiple stages
      const task2CreateResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Task 2', status: 'in-progress' });

      const task2 = task2CreateResponse.body;
      expect(task2.status).toBe('in-progress');

      const task3CreateResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Task 3', status: 'todo' });

      const task3 = task3CreateResponse.body;
      expect(task3.status).toBe('todo');

      // Verify multiple stages are supported in the system
      const allTasksResponse = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`);

      const statuses = allTasksResponse.body.map(t => t.status);
      expect(statuses).toContain('todo');
      expect(statuses).toContain('in-progress');
      expect(statuses).toContain('done');
    });
  });

  describe('Error Scenarios', () => {
    test('handles missing required task fields gracefully', async () => {
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'erroruser',
          email: 'error@example.com',
          password: TEST_PASSWORD
        });

      const { accessToken } = registerResponse.body;

      // Try to create task without title
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ priority: 'high' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('handles concurrent task operations', async () => {
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'concurrentuser',
          email: 'concurrent@example.com',
          password: TEST_PASSWORD
        });

      const { accessToken } = registerResponse.body;

      // Create multiple tasks concurrently
      const taskPromises = [1, 2, 3].map(i =>
        request(app)
          .post('/api/tasks')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ title: `Task ${i}` })
      );

      const responses = await Promise.all(taskPromises);
      responses.forEach(response => {
        expect(response.status).toBe(201);
      });

      // Verify all tasks were created
      const tasksResponse = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(tasksResponse.body.length).toBe(3);
    });
  });
});
