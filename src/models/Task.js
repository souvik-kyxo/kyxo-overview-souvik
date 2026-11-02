class Task {
  constructor(title, status = 'todo', done = false, id = null, createdAt = null, dueDate = null) {
    if (!title || title.trim() === '') {
      throw new Error('Task title cannot be empty');
    }

    this.id = id || Date.now().toString();
    this.title = title.trim();
    this.status = status; // 'todo', 'in-progress', 'done'
    this.done = done;
    this.createdAt = createdAt || new Date().toISOString();
    this.dueDate = dueDate;
  }

  markAsDone() {
    this.done = true;
  }

  markAsNotDone() {
    this.done = false;
  }

  updateStatus(newStatus) {
    const validStatuses = ['todo', 'in-progress', 'done'];
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid status: ${newStatus}`);
    }
    this.status = newStatus;
  }

  toJSON() {
    const json = {
      id: this.id,
      title: this.title,
      status: this.status,
      done: this.done,
      createdAt: this.createdAt
    };
    if (this.dueDate !== null) {
      json.dueDate = this.dueDate;
    }
    return json;
  }

  static fromJSON(data) {
    return new Task(data.title, data.status, data.done, data.id, data.createdAt, data.dueDate);
  }
}

module.exports = Task;
