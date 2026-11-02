const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const TaskStorage = require('../utils/storage');
const CategoryStorage = require('../utils/categoryStorage');
const Category = require('../models/Category');

let tasks = TaskStorage.loadTasks();
let categories = CategoryStorage.loadCategories();

router.get('/', (req, res) => {
  res.json(tasks);
});

router.post('/', (req, res) => {
  try {
    const { title, status = 'todo', done = false, dueDate = null, categories = [] } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Task title is required' });
    }

    const processedCategories = Array.isArray(categories)
      ? categories.map(c => c.trim().toLowerCase()).filter(c => c)
      : [];

    const newTask = new Task(title, status, done, null, null, dueDate, processedCategories);
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
    const { status, done, title, dueDate, categories } = req.body;

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

    if (dueDate !== undefined) {
      task.dueDate = dueDate;
    }

    if (categories !== undefined) {
      task.categories = Array.isArray(categories)
        ? categories.map(c => c.trim().toLowerCase()).filter(c => c)
        : [];
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

router.get('/categories/all', (req, res) => {
  try {
    const categoryList = categories.map(cat => cat.toJSON());
    res.json(categoryList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/categories', (req, res) => {
  try {
    const { name, color = '#667eea', description = '' } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const existingCategory = categories.find(c => c.name === name.trim().toLowerCase());
    if (existingCategory) {
      return res.status(409).json({ error: 'Category already exists' });
    }

    const newCategory = new Category(name, color, description);
    categories.push(newCategory);
    CategoryStorage.saveCategories(categories);

    res.status(201).json(newCategory.toJSON());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/categories/:name', (req, res) => {
  try {
    const { name } = req.params;
    const index = categories.findIndex(c => c.name === name.toLowerCase());

    if (index === -1) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const deletedCategory = categories.splice(index, 1)[0];
    CategoryStorage.saveCategories(categories);

    res.json(deletedCategory.toJSON());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
