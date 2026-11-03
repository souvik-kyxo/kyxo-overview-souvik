const User = require('../src/models/User');
const bcrypt = require('bcryptjs');

const TEST_PASSWORD = process.env.TEST_PASSWORD || 'testpass';

describe('User Model', () => {
  describe('User Creation', () => {
    test('creates a user with username and email', async () => {
      const user = await User.create('testuser', 'test@example.com', TEST_PASSWORD);

      expect(user.username).toBe('testuser');
      expect(user.email).toBe('test@example.com');
      expect(user.id).toBeDefined();
      expect(user.createdAt).toBeDefined();
    });

    test('hashes password on creation', async () => {
      const password = TEST_PASSWORD;
      const user = await User.create('testuser', 'test@example.com', password);

      expect(user.passwordHash).toBeDefined();
      expect(user.passwordHash).not.toBe(password);
    });
  });

  describe('Password Verification', () => {
    test('verifies correct password', async () => {
      const password = TEST_PASSWORD;
      const user = await User.create('testuser', 'test@example.com', password);

      const isValid = await user.verifyPassword(password);
      expect(isValid).toBe(true);
    });

    test('rejects incorrect password', async () => {
      const password = TEST_PASSWORD;
      const user = await User.create('testuser', 'test@example.com', password);

      const isValid = await user.verifyPassword('WrongPassword');
      expect(isValid).toBe(false);
    });
  });

  describe('JSON Serialization', () => {
    test('toJSON excludes password hash', async () => {
      const user = await User.create('testuser', 'test@example.com', TEST_PASSWORD);
      const json = user.toJSON();

      expect(json.username).toBe('testuser');
      expect(json.email).toBe('test@example.com');
      expect(json).not.toHaveProperty('password');
      expect(json).not.toHaveProperty('passwordHash');
    });

    test('toJSON includes id and createdAt', async () => {
      const user = await User.create('testuser', 'test@example.com', TEST_PASSWORD);
      const json = user.toJSON();

      expect(json).toHaveProperty('id');
      expect(json).toHaveProperty('createdAt');
    });

    test('fromJSON creates user from JSON data', async () => {
      const originalUser = await User.create('testuser', 'test@example.com', TEST_PASSWORD);
      const json = originalUser.toJSON();
      json.passwordHash = originalUser.passwordHash;

      const restoredUser = User.fromJSON({ ...json });

      expect(restoredUser.username).toBe(originalUser.username);
      expect(restoredUser.email).toBe(originalUser.email);
      expect(restoredUser.id).toBe(originalUser.id);
    });
  });

  describe('User Validation', () => {
    test('users have unique IDs', async () => {
      const user1 = await User.create('user1', 'user1@example.com', TEST_PASSWORD);
      const user2 = await User.create('user2', 'user2@example.com', TEST_PASSWORD);

      expect(user1.id).not.toBe(user2.id);
    });
  });
});
