const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const TaskStorage = require('../utils/storage');

let tasks = TaskStorage.loadTasks();

router.get('/', (req, res) => {
  res.json(tasks);
});

router.post('/', (req, res) => {
  try {
    const { title, status = 'todo', done = false } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Task title is required' });
    }

    const newTask = new Task(title, status, done);
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
    const { status, done, title } = req.body;

    const task = tasks.find(t => t.id === id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (title !== undefined) {
      if (!title || title.trim() === '') {
        return res.status(400).json({ error: 'Task title cannot be empty' });
      }
      task.title = title.trim();
    }

    if (status !== undefined) {
      task.updateStatus(status);
    }

    if (done !== undefined) {
      task.done = done;
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
    const index = tasks.findIndex(t => t.id === id);

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
