class Task {
  constructor(
    title,
    userId,
    status = 'todo',
    done = false,
    id = null,
    createdAt = null,
    dueDate = null,
    priority = 'medium',
    description = '',
    tags = [],
    updatedAt = null,
    completedAt = null
  ) {
    if (!title || title.trim() === '') {
      throw new Error('Task title cannot be empty');
    }

    const validPriorities = ['low', 'medium', 'high'];
    if (!validPriorities.includes(priority)) {
      throw new Error(`Invalid priority: ${priority}`);
    }

    this.id = id || Date.now().toString();
    this.userId = userId;
    this.title = title.trim();
    this.status = status; // 'todo', 'in-progress', 'done'
    this.done = done;
    this.priority = priority; // 'low', 'medium', 'high'
    this.description = description;
    this.tags = tags || [];
    this.createdAt = createdAt || new Date().toISOString();
    this.updatedAt = updatedAt || new Date().toISOString();
    this.dueDate = dueDate;
    this.completedAt = completedAt;
  }

  markAsDone() {
    this.done = true;
    this.completedAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  markAsNotDone() {
    this.done = false;
    this.completedAt = null;
    this.updatedAt = new Date().toISOString();
  }

  updateStatus(newStatus) {
    const validStatuses = ['todo', 'in-progress', 'done'];
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid status: ${newStatus}`);
    }
    this.status = newStatus;
    this.updatedAt = new Date().toISOString();
  }

  updatePriority(newPriority) {
    const validPriorities = ['low', 'medium', 'high'];
    if (!validPriorities.includes(newPriority)) {
      throw new Error(`Invalid priority: ${newPriority}`);
    }
    this.priority = newPriority;
    this.updatedAt = new Date().toISOString();
  }

  toJSON() {
    const json = {
      id: this.id,
      userId: this.userId,
      title: this.title,
      status: this.status,
      done: this.done,
      priority: this.priority,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
    if (this.description) {
      json.description = this.description;
    }
    if (this.tags && this.tags.length > 0) {
      json.tags = this.tags;
    }
    if (this.dueDate !== null) {
      json.dueDate = this.dueDate;
    }
    if (this.completedAt !== null) {
      json.completedAt = this.completedAt;
    }
    return json;
  }

  static fromJSON(data) {
    return new Task(
      data.title,
      data.userId,
      data.status,
      data.done,
      data.id,
      data.createdAt,
      data.dueDate,
      data.priority || 'medium',
      data.description || '',
      data.tags || [],
      data.updatedAt,
      data.completedAt || null
    );
  }
}

module.exports = Task;
