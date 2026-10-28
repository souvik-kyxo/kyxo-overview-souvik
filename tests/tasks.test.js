const Task = require('../src/models/Task');

describe('Task Model', () => {
  describe('Constructor', () => {
    test('creates a task with valid title', () => {
      const task = new Task('Buy groceries');
      expect(task.title).toBe('Buy groceries');
      expect(task.status).toBe('todo');
      expect(task.done).toBe(false);
      expect(task.id).toBeDefined();
    });

    test('throws error for empty title', () => {
      expect(() => new Task('')).toThrow('Task title cannot be empty');
      expect(() => new Task('   ')).toThrow('Task title cannot be empty');
    });

    test('creates task with custom status and done flag', () => {
      const task = new Task('Complete project', 'in-progress', true);
      expect(task.title).toBe('Complete project');
      expect(task.status).toBe('in-progress');
      expect(task.done).toBe(true);
    });

    test('trims whitespace from title', () => {
      const task = new Task('  Buy groceries  ');
      expect(task.title).toBe('Buy groceries');
    });
  });

  describe('markAsDone', () => {
    test('marks task as done', () => {
      const task = new Task('Buy groceries');
      expect(task.done).toBe(false);
      task.markAsDone();
      expect(task.done).toBe(true);
    });
  });

  describe('markAsNotDone', () => {
    test('marks task as not done', () => {
      const task = new Task('Buy groceries', 'todo', true);
      expect(task.done).toBe(true);
      task.markAsNotDone();
      expect(task.done).toBe(false);
    });
  });

  describe('updateStatus', () => {
    test('updates status to valid value', () => {
      const task = new Task('Buy groceries');
      task.updateStatus('in-progress');
      expect(task.status).toBe('in-progress');

      task.updateStatus('done');
      expect(task.status).toBe('done');

      task.updateStatus('todo');
      expect(task.status).toBe('todo');
    });

    test('throws error for invalid status', () => {
      const task = new Task('Buy groceries');
      expect(() => task.updateStatus('invalid')).toThrow('Invalid status: invalid');
    });
  });

  describe('JSON serialization', () => {
    test('toJSON returns correct object', () => {
      const task = new Task('Buy groceries', 'in-progress', true, 'task-123', '2025-01-01T00:00:00Z');
      const json = task.toJSON();

      expect(json).toEqual({
        id: 'task-123',
        title: 'Buy groceries',
        status: 'in-progress',
        done: true,
        createdAt: '2025-01-01T00:00:00Z'
      });
    });

    test('fromJSON creates task from JSON', () => {
      const json = {
        id: 'task-123',
        title: 'Buy groceries',
        status: 'in-progress',
        done: true,
        createdAt: '2025-01-01T00:00:00Z'
      };

      const task = Task.fromJSON(json);
      expect(task.id).toBe('task-123');
      expect(task.title).toBe('Buy groceries');
      expect(task.status).toBe('in-progress');
      expect(task.done).toBe(true);
      expect(task.createdAt).toBe('2025-01-01T00:00:00Z');
    });
  });
});
