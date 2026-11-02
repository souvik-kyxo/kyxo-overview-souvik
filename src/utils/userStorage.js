const fs = require('fs');
const path = require('path');
const User = require('../models/User');

const STORAGE_FILE = path.join(__dirname, '../../users.json');

class UserStorage {
  static loadUsers() {
    try {
      if (fs.existsSync(STORAGE_FILE)) {
        const data = fs.readFileSync(STORAGE_FILE, 'utf8');
        const usersData = JSON.parse(data);
        return usersData.map(userData => User.fromJSON(userData));
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
    return [];
  }

  static saveUsers(users) {
    try {
      const usersData = users.map(user => ({
        id: user.id,
        email: user.email,
        passwordHash: user.passwordHash,
        createdAt: user.createdAt
      }));
      fs.writeFileSync(STORAGE_FILE, JSON.stringify(usersData, null, 2), 'utf8');
    } catch (error) {
      console.error('Error saving users:', error);
      throw error;
    }
  }

  static findUserByEmail(email, users) {
    return users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  static findUserById(id, users) {
    return users.find(u => u.id === id);
  }
}

module.exports = UserStorage;
