class TodoApp {
  constructor() {
    this.tasks = [];
    this.searchQuery = '';
    this.token = localStorage.getItem('authToken');
    this.userEmail = localStorage.getItem('userEmail');

    this.authContainer = document.getElementById('authContainer');
    this.appContainer = document.getElementById('appContainer');
    this.taskForm = document.getElementById('taskForm');
    this.taskInput = document.getElementById('taskInput');
    this.dueDateInput = document.getElementById('dueDateInput');
    this.searchInput = document.getElementById('searchInput');
    this.tasksContainer = document.getElementById('tasksContainer');
    this.logoutBtn = document.getElementById('logoutBtn');

    if (this.token) {
      this.showApp();
      this.taskForm.addEventListener('submit', (e) => this.addTask(e));
      this.searchInput.addEventListener('input', (e) => this.handleSearch(e));
      this.logoutBtn.addEventListener('click', () => this.logout());
      this.loadTasks();
    } else {
      this.showAuth();
    }
  }

  showAuth() {
    this.authContainer.style.display = 'block';
    if (this.appContainer) this.appContainer.style.display = 'none';
  }

  showApp() {
    if (this.authContainer) this.authContainer.style.display = 'none';
    this.appContainer.style.display = 'block';
  }

  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    };
  }

  async loadTasks() {
    try {
      const response = await fetch('/api/tasks', {
        headers: this.getHeaders()
      });
      if (!response.ok) throw new Error('Failed to load tasks');
      this.tasks = await response.json();
      this.render();
    } catch (error) {
      console.error('Error loading tasks:', error);
      alert('Failed to load tasks. Please refresh the page.');
    }
  }

  async addTask(e) {
    e.preventDefault();
    const title = this.taskInput.value.trim();
    const dueDate = this.dueDateInput.value || null;

    if (!title) {
      this.taskInput.focus();
      return;
    }

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ title, status: 'todo', done: false, dueDate })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add task');
      }

      const newTask = await response.json();
      this.tasks.push(newTask);
      this.taskInput.value = '';
      this.dueDateInput.value = '';
      this.render();
    } catch (error) {
      console.error('Error adding task:', error);
      alert('Failed to add task. Please try again.');
    }
  }

  async updateTask(id, updates) {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update task');
      }

      const updatedTask = await response.json();
      const index = this.tasks.findIndex(t => t.id === id);
      if (index !== -1) {
        this.tasks[index] = updatedTask;
      }
      this.render();
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Failed to update task. Please try again.');
    }
  }

  async deleteTask(id) {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete task');
      }

      this.tasks = this.tasks.filter(t => t.id !== id);
      this.render();
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task. Please try again.');
    }
  }

  async register(email, password) {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      this.token = data.token;
      this.userEmail = data.user.email;
      localStorage.setItem('authToken', this.token);
      localStorage.setItem('userEmail', this.userEmail);
      this.showApp();
      this.loadTasks();
    } catch (error) {
      alert(error.message || 'Registration failed');
    }
  }

  async login(email, password) {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      this.token = data.token;
      this.userEmail = data.user.email;
      localStorage.setItem('authToken', this.token);
      localStorage.setItem('userEmail', this.userEmail);
      this.showApp();
      this.loadTasks();
    } catch (error) {
      alert(error.message || 'Login failed');
    }
  }

  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    this.token = null;
    this.userEmail = null;
    this.tasks = [];
    this.showAuth();
    document.getElementById('authForm').reset();
  }

  handleSearch(e) {
    this.searchQuery = e.target.value.toLowerCase();
    this.render();
  }

  getFilteredTasks() {
    if (!this.searchQuery.trim()) {
      return this.tasks;
    }
    return this.tasks.filter(task =>
      task.title.toLowerCase().includes(this.searchQuery)
    );
  }

  getDueDateStatus(dueDate) {
    if (!dueDate) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);

    const diffTime = due - today;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    if (diffDays < 0) return 'overdue';
    if (diffDays === 0) return 'today';
    if (diffDays <= 7) return 'upcoming';
    return null;
  }

  formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const due = new Date(dateStr);
    due.setHours(0, 0, 0, 0);

    if (due.getTime() === today.getTime()) {
      return 'Due today';
    }
    if (due.getTime() === tomorrow.getTime()) {
      return 'Due tomorrow';
    }

    return `Due ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined })}`;
  }

  render() {
    const filteredTasks = this.getFilteredTasks();

    if (this.tasks.length === 0) {
      this.tasksContainer.innerHTML = '<p id="emptyState" class="empty-state">No tasks yet. Add one to get started!</p>';
      return;
    }

    if (filteredTasks.length === 0) {
      this.tasksContainer.innerHTML = '<p id="emptyState" class="empty-state">No tasks match your search.</p>';
      return;
    }

    this.tasksContainer.innerHTML = filteredTasks.map(task => {
      const dueDateStatus = this.getDueDateStatus(task.dueDate);
      const dueDateClass = dueDateStatus ? `due-date ${dueDateStatus}` : 'due-date';
      const dueDateDisplay = task.dueDate ? `<span class="${dueDateClass}">${this.formatDate(task.dueDate)}</span>` : '<span class="due-date-placeholder">Add due date</span>';
      const formattedDate = task.dueDate ? task.dueDate : '';

      return `
        <div class="task-item ${task.done ? 'done' : ''} ${task.dueDate && dueDateStatus === 'overdue' ? 'overdue' : ''}">
          <input
            type="checkbox"
            class="task-checkbox"
            ${task.done ? 'checked' : ''}
            onchange="app.updateTask('${task.id}', { done: ${!task.done} })"
          >
          <div class="task-content">
            <div class="task-title">${this.escapeHtml(task.title)}</div>
            <div class="task-meta">
              <select
                class="status-select"
                value="${task.status}"
                onchange="app.updateTask('${task.id}', { status: event.target.value })"
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
              <input
                type="date"
                class="task-due-date-input"
                value="${formattedDate}"
                onchange="app.updateTask('${task.id}', { dueDate: event.target.value || null })"
                title="Click to set or edit due date"
              >
            </div>
          </div>
          <div class="task-actions">
            <button class="btn-delete" onclick="app.deleteTask('${task.id}')">Delete</button>
          </div>
        </div>
      `;
    }).join('');
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new TodoApp();
});
