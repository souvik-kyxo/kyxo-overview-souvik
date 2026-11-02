const bcryptjs = require('bcryptjs');

class User {
  constructor(id, email, passwordHash, createdAt = null) {
    this.id = id;
    this.email = email;
    this.passwordHash = passwordHash;
    this.createdAt = createdAt || new Date().toISOString();
  }

  async verifyPassword(password) {
    return bcryptjs.compare(password, this.passwordHash);
  }

  static async hashPassword(password) {
    return bcryptjs.hash(password, 10);
  }

  toJSON() {
    return {
      id: this.id,
      email: this.email,
      createdAt: this.createdAt
    };
  }

  static fromJSON(data) {
    return new User(data.id, data.email, data.passwordHash, data.createdAt);
  }
}

module.exports = User;
