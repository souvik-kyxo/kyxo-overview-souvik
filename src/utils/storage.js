const fs = require('fs');
const path = require('path');
const Task = require('../models/Task');

const STORAGE_DIR = path.join(__dirname, '../../tasks_data');

class TaskStorage {
  static ensureDir() {
    if (!fs.existsSync(STORAGE_DIR)) {
      fs.mkdirSync(STORAGE_DIR, { recursive: true });
    }
  }

  static getStorageFile(userId) {
    return path.join(STORAGE_DIR, `${userId}.json`);
  }

  static loadTasks(userId) {
    try {
      this.ensureDir();
      const file = this.getStorageFile(userId);
      if (fs.existsSync(file)) {
        const data = fs.readFileSync(file, 'utf8');
        const tasksData = JSON.parse(data);
        return tasksData.map(taskData => Task.fromJSON(taskData));
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
    return [];
  }

  static saveTasks(userId, tasks) {
    try {
      this.ensureDir();
      const file = this.getStorageFile(userId);
      const tasksData = tasks.map(task => task.toJSON());
      fs.writeFileSync(file, JSON.stringify(tasksData, null, 2), 'utf8');
    } catch (error) {
      console.error('Error saving tasks:', error);
      throw error;
    }
  }
}

module.exports = TaskStorage;
