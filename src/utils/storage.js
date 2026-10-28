const fs = require('fs');
const path = require('path');
const Task = require('../models/Task');

const STORAGE_FILE = path.join(__dirname, '../../tasks.json');

class TaskStorage {
  static loadTasks() {
    try {
      if (fs.existsSync(STORAGE_FILE)) {
        const data = fs.readFileSync(STORAGE_FILE, 'utf8');
        const tasksData = JSON.parse(data);
        return tasksData.map(taskData => Task.fromJSON(taskData));
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
    return [];
  }

  static saveTasks(tasks) {
    try {
      const tasksData = tasks.map(task => task.toJSON());
      fs.writeFileSync(STORAGE_FILE, JSON.stringify(tasksData, null, 2), 'utf8');
    } catch (error) {
      console.error('Error saving tasks:', error);
      throw error;
    }
  }
}

module.exports = TaskStorage;
