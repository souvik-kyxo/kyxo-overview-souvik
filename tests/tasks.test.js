const Task = require('../src/models/Task');

describe('Task Model', () => {
  describe('Constructor', () => {
    test('creates a task with valid title', () => {
      const task = new Task('Buy groceries', 'user-1');
      expect(task.title).toBe('Buy groceries');
      expect(task.status).toBe('todo');
      expect(task.done).toBe(false);
      expect(task.id).toBeDefined();
      expect(task.priority).toBe('medium');
    });

    test('throws error for empty title', () => {
      expect(() => new Task('', 'user-1')).toThrow('Task title cannot be empty');
      expect(() => new Task('   ', 'user-1')).toThrow('Task title cannot be empty');
    });

    test('creates task with custom status and done flag', () => {
      const task = new Task('Complete project', 'user-1', 'in-progress', true);
      expect(task.title).toBe('Complete project');
      expect(task.status).toBe('in-progress');
      expect(task.done).toBe(true);
    });

    test('trims whitespace from title', () => {
      const task = new Task('  Buy groceries  ', 'user-1');
      expect(task.title).toBe('Buy groceries');
    });
  });

  describe('markAsDone', () => {
    test('[REQ-10003:AC1] marks task as done', () => {
      const task = new Task('Buy groceries', 'user-1');
      expect(task.done).toBe(false);
      task.markAsDone();
      expect(task.done).toBe(true);
      expect(task.completedAt).not.toBeNull();
    });
  });

  describe('markAsNotDone', () => {
    test('marks task as not done', () => {
      const task = new Task('Buy groceries', 'user-1', 'todo', true);
      expect(task.done).toBe(true);
      task.markAsNotDone();
      expect(task.done).toBe(false);
    });
  });

  describe('updateStatus', () => {
    test('[REQ-10002:AC1] updates status to valid value', () => {
      const task = new Task('Buy groceries', 'user-1');
      task.updateStatus('in-progress');
      expect(task.status).toBe('in-progress');

      task.updateStatus('done');
      expect(task.status).toBe('done');

      task.updateStatus('todo');
      expect(task.status).toBe('todo');
    });

    test('throws error for invalid status', () => {
      const task = new Task('Buy groceries', 'user-1');
      expect(() => task.updateStatus('invalid')).toThrow('Invalid status: invalid');
    });
  });

  describe('JSON serialization', () => {
    test('toJSON returns correct object', () => {
      const task = new Task('Buy groceries', 'user-1', 'in-progress', true, 'task-123', '2025-01-01T00:00:00Z');
      const json = task.toJSON();

      expect(json.id).toBe('task-123');
      expect(json.title).toBe('Buy groceries');
      expect(json.status).toBe('in-progress');
      expect(json.done).toBe(true);
      expect(json.createdAt).toBe('2025-01-01T00:00:00Z');
      expect(json.priority).toBe('medium');
      expect(json).toHaveProperty('updatedAt');
    });

    test('fromJSON creates task from JSON', () => {
      const json = {
        id: 'task-123',
        userId: 'user-1',
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
      expect(task.priority).toBe('medium');
    });
  });

  describe('Due dates feature', () => {
    test('creates task with dueDate', () => {
      const task = new Task('Buy groceries', 'user-1', 'todo', false, 'task-1', '2025-01-01T00:00:00Z', '2025-12-31');
      expect(task.dueDate).toBe('2025-12-31');
    });

    test('toJSON includes dueDate when set', () => {
      const task = new Task('Buy groceries', 'user-1', 'todo', false, 'task-1', '2025-01-01T00:00:00Z', '2025-12-31');
      const json = task.toJSON();
      expect(json.dueDate).toBe('2025-12-31');
      expect(json).toHaveProperty('dueDate');
    });

    test('toJSON excludes dueDate when null', () => {
      const task = new Task('Buy groceries', 'user-1', 'todo', false, 'task-1', '2025-01-01T00:00:00Z', null);
      const json = task.toJSON();
      expect(json).not.toHaveProperty('dueDate');
    });

    test('fromJSON handles dueDate correctly', () => {
      const json = {
        id: 'task-1',
        userId: 'user-1',
        title: 'Buy groceries',
        status: 'todo',
        done: false,
        createdAt: '2025-01-01T00:00:00Z',
        dueDate: '2025-12-31'
      };
      const task = Task.fromJSON(json);
      expect(task.dueDate).toBe('2025-12-31');
    });

    test('fromJSON handles missing dueDate', () => {
      const json = {
        id: 'task-1',
        userId: 'user-1',
        title: 'Buy groceries',
        status: 'todo',
        done: false,
        createdAt: '2025-01-01T00:00:00Z'
      };
      const task = Task.fromJSON(json);
      expect(task.dueDate).toBeNull();
    });
  });

  describe('Priority feature', () => {
    test('creates task with priority', () => {
      const task = new Task('Buy groceries', 'user-1', 'todo', false, 'task-1', null, null, 'high');
      expect(task.priority).toBe('high');
    });

    test('defaults to medium priority', () => {
      const task = new Task('Buy groceries', 'user-1');
      expect(task.priority).toBe('medium');
    });

    test('supports all priority levels', () => {
      const priorities = ['low', 'medium', 'high'];
      priorities.forEach(priority => {
        const task = new Task('Task', 'user-1', 'todo', false, null, null, null, priority);
        expect(task.priority).toBe(priority);
      });
    });

    test('throws error for invalid priority', () => {
      expect(() => new Task('Task', 'user-1', 'todo', false, null, null, null, 'invalid')).toThrow('Invalid priority: invalid');
    });

    test('updatePriority changes priority and updatedAt', () => {
      const task = new Task('Task', 'user-1', 'todo', false, 'task-1', '2025-01-01T00:00:00Z', null, 'low');
      const originalUpdatedAt = task.updatedAt;

      task.updatePriority('high');

      expect(task.priority).toBe('high');
      expect(task.updatedAt).not.toBe(originalUpdatedAt);
    });

    test('toJSON includes priority', () => {
      const task = new Task('Buy groceries', 'user-1', 'todo', false, 'task-1', null, null, 'high');
      const json = task.toJSON();
      expect(json.priority).toBe('high');
    });
  });

  describe('Description and tags feature', () => {
    test('creates task with description', () => {
      const description = 'This is a task description';
      const task = new Task('Task', 'user-1', 'todo', false, 'task-1', null, null, 'medium', description);
      expect(task.description).toBe(description);
    });

    test('creates task with tags', () => {
      const tags = ['work', 'urgent'];
      const task = new Task('Task', 'user-1', 'todo', false, 'task-1', null, null, 'medium', '', tags);
      expect(task.tags).toEqual(tags);
    });

    test('description is included in toJSON when set', () => {
      const task = new Task('Task', 'user-1', 'todo', false, 'task-1', null, null, 'medium', 'Some description');
      const json = task.toJSON();
      expect(json.description).toBe('Some description');
    });

    test('description is excluded from toJSON when empty', () => {
      const task = new Task('Task', 'user-1');
      const json = task.toJSON();
      expect(json).not.toHaveProperty('description');
    });

    test('tags are included in toJSON when set', () => {
      const tags = ['tag1', 'tag2'];
      const task = new Task('Task', 'user-1', 'todo', false, 'task-1', null, null, 'medium', '', tags);
      const json = task.toJSON();
      expect(json.tags).toEqual(tags);
    });

    test('tags are excluded from toJSON when empty', () => {
      const task = new Task('Task', 'user-1');
      const json = task.toJSON();
      expect(json).not.toHaveProperty('tags');
    });
  });

  describe('Timestamps feature', () => {
    test('task has updatedAt timestamp', () => {
      const task = new Task('Task', 'user-1');
      expect(task).toHaveProperty('updatedAt');
      expect(new Date(task.updatedAt)).toBeInstanceOf(Date);
    });

    test('completedAt is null initially', () => {
      const task = new Task('Task', 'user-1');
      expect(task.completedAt).toBeNull();
    });

    test('markAsDone sets completedAt', () => {
      const task = new Task('Task', 'user-1');
      task.markAsDone();
      expect(task.completedAt).not.toBeNull();
      expect(new Date(task.completedAt)).toBeInstanceOf(Date);
    });

    test('markAsNotDone clears completedAt', () => {
      const task = new Task('Task', 'user-1', 'todo', true, 'task-1', null, null, 'medium', '', [], null, '2025-01-01T00:00:00Z');
      expect(task.completedAt).not.toBeNull();
      task.markAsNotDone();
      expect(task.completedAt).toBeNull();
    });

    test('updatedAt is updated when status changes', () => {
      const task = new Task('Task', 'user-1', 'todo', false, 'task-1', '2025-01-01T00:00:00Z');
      const originalUpdatedAt = task.updatedAt;

      task.updateStatus('in-progress');

      expect(task.updatedAt).not.toBe(originalUpdatedAt);
    });

    test('toJSON includes updatedAt', () => {
      const task = new Task('Task', 'user-1');
      const json = task.toJSON();
      expect(json).toHaveProperty('updatedAt');
    });

    test('completedAt is included in toJSON when set', () => {
      const task = new Task('Task', 'user-1', 'todo', true, 'task-1', null, null, 'medium', '', [], null, '2025-01-01T00:00:00Z');
      const json = task.toJSON();
      expect(json.completedAt).toBe('2025-01-01T00:00:00Z');
    });

    test('completedAt is excluded from toJSON when null', () => {
      const task = new Task('Task', 'user-1');
      const json = task.toJSON();
      expect(json).not.toHaveProperty('completedAt');
    });
  });
});
