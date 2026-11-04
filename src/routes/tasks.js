const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const TaskStorage = require('../utils/storage');
const { authenticateToken } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimit');

let tasks = TaskStorage.loadTasks();

router.use(authenticateToken);
router.use(apiLimiter);

router.get('/', (req, res) => {
  const userTasks = tasks.filter(t => t.userId === req.user.userId);
  res.json(userTasks);
});

router.post('/', (req, res) => {
  try {
    const {
      title,
      status = 'todo',
      done = false,
      dueDate = null,
      priority = 'medium',
      description = '',
      tags = []
    } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Task title is required' });
    }

    const newTask = new Task(
      title,
      req.user.userId,
      status,
      done,
      null,
      null,
      dueDate,
      priority,
      description,
      tags
    );
    tasks.push(newTask);
    TaskStorage.saveTasks(tasks);

    res.status(201).json(newTask.toJSON());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { status, done, title, dueDate, priority, description, tags } = req.body;

    const task = tasks.find(t => t.id === id && t.userId === req.user.userId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (title !== undefined) {
      if (!title || title.trim() === '') {
        return res.status(400).json({ error: 'Task title cannot be empty' });
      }
      task.title = title.trim();
      task.updatedAt = new Date().toISOString();
    }

    if (status !== undefined) {
      task.updateStatus(status);
    }

    if (done !== undefined) {
      if (done) {
        task.markAsDone();
      } else {
        task.markAsNotDone();
      }
    }

    if (dueDate !== undefined) {
      task.dueDate = dueDate;
      task.updatedAt = new Date().toISOString();
    }

    if (priority !== undefined) {
      task.updatePriority(priority);
    }

    if (description !== undefined) {
      task.description = description;
      task.updatedAt = new Date().toISOString();
    }

    if (tags !== undefined) {
      task.tags = tags;
      task.updatedAt = new Date().toISOString();
    }

    TaskStorage.saveTasks(tasks);
    res.json(task.toJSON());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const index = tasks.findIndex(t => t.id === id && t.userId === req.user.userId);

    if (index === -1) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const deletedTask = tasks.splice(index, 1)[0];
    TaskStorage.saveTasks(tasks);

    res.json(deletedTask.toJSON());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
