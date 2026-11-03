const fs = require('fs');
const path = require('path');
const User = require('../models/User');

const USERS_FILE = path.join(__dirname, '../../users.json');

class UserStorage {
  static loadUsers() {
    try {
      if (fs.existsSync(USERS_FILE)) {
        const data = fs.readFileSync(USERS_FILE, 'utf8');
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
        username: user.username,
        email: user.email,
        passwordHash: user.passwordHash,
        createdAt: user.createdAt
      }));
      fs.writeFileSync(USERS_FILE, JSON.stringify(usersData, null, 2), 'utf8');
    } catch (error) {
      console.error('Error saving users:', error);
      throw error;
    }
  }

  static findUserByUsername(users, username) {
    return users.find(user => user.username === username);
  }

  static findUserByEmail(users, email) {
    return users.find(user => user.email === email);
  }

  static findUserById(users, id) {
    return users.find(user => user.id === id);
  }
}

module.exports = UserStorage;
