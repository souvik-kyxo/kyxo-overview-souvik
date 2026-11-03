const bcrypt = require('bcryptjs');

class User {
  constructor(username, email, passwordHash, id = null, createdAt = null) {
    this.id = id || Date.now().toString();
    this.username = username;
    this.email = email;
    this.passwordHash = passwordHash;
    this.createdAt = createdAt || new Date().toISOString();
  }

  toJSON() {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      createdAt: this.createdAt
    };
  }

  static async create(username, email, password) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    return new User(username, email, passwordHash);
  }

  async verifyPassword(password) {
    return bcrypt.compare(password, this.passwordHash);
  }

  static fromJSON(data) {
    return new User(data.username, data.email, data.passwordHash, data.id, data.createdAt);
  }
}

module.exports = User;
