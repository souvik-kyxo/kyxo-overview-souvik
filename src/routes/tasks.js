const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const TaskStorage = require('../utils/storage');
const { authMiddleware } = require('../middleware/auth');
const {
  validateTaskTitle,
  validateStatus,
  validateDueDate,
  validateTaskId
} = require('../middleware/validation');

router.use(authMiddleware);

router.get('/', (req, res) => {
  try {
    const tasks = TaskStorage.loadTasks(req.userId);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load tasks' });
  }
});

router.post('/', (req, res) => {
  try {
    const { title, status = 'todo', done = false, dueDate = null } = req.body;

    if (!validateTaskTitle(title)) {
      return res.status(400).json({ error: 'Task title must be between 1 and 500 characters' });
    }

    if (status && !validateStatus(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    if (!validateDueDate(dueDate)) {
      return res.status(400).json({ error: 'Invalid due date format' });
    }

    if (typeof done !== 'boolean') {
      return res.status(400).json({ error: 'Done must be a boolean' });
    }

    const tasks = TaskStorage.loadTasks(req.userId);
    const newTask = new Task(title, status, done, null, null, dueDate);
    tasks.push(newTask);
    TaskStorage.saveTasks(req.userId, tasks);

    res.status(201).json(newTask.toJSON());
  } catch (error) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { status, done, title, dueDate } = req.body;

    if (!validateTaskId(id)) {
      return res.status(400).json({ error: 'Invalid task ID' });
    }

    const tasks = TaskStorage.loadTasks(req.userId);
    const task = tasks.find(t => t.id === id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (title !== undefined) {
      if (!validateTaskTitle(title)) {
        return res.status(400).json({ error: 'Task title must be between 1 and 500 characters' });
      }
      task.title = title.trim();
    }

    if (status !== undefined) {
      if (!validateStatus(status)) {
        return res.status(400).json({ error: 'Invalid status value' });
      }
      task.updateStatus(status);
    }

    if (done !== undefined) {
      if (typeof done !== 'boolean') {
        return res.status(400).json({ error: 'Done must be a boolean' });
      }
      task.done = done;
    }

    if (dueDate !== undefined) {
      if (!validateDueDate(dueDate)) {
        return res.status(400).json({ error: 'Invalid due date format' });
      }
      task.dueDate = dueDate;
    }

    TaskStorage.saveTasks(req.userId, tasks);
    res.json(task.toJSON());
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;

    if (!validateTaskId(id)) {
      return res.status(400).json({ error: 'Invalid task ID' });
    }

    const tasks = TaskStorage.loadTasks(req.userId);
    const index = tasks.findIndex(t => t.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const deletedTask = tasks.splice(index, 1)[0];
    TaskStorage.saveTasks(req.userId, tasks);

    res.json(deletedTask.toJSON());
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

module.exports = router;
