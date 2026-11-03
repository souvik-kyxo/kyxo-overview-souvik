class TodoApp {
  constructor() {
    this.tasks = [];
    this.searchQuery = '';
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
    this.user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;

    this.initializeElements();
    this.initializeEventListeners();
    this.checkAuthStatus();
  }

  initializeElements() {
    this.authSection = document.getElementById('authSection');
    this.appSection = document.getElementById('appSection');
    this.loginForm = document.getElementById('loginForm');
    this.registerForm = document.getElementById('registerForm');
    this.loginTab = document.getElementById('loginTab');
    this.registerTab = document.getElementById('registerTab');
    this.loginError = document.getElementById('loginError');
    this.registerError = document.getElementById('registerError');

    this.taskForm = document.getElementById('taskForm');
    this.taskInput = document.getElementById('taskInput');
    this.dueDateInput = document.getElementById('dueDateInput');
    this.searchInput = document.getElementById('searchInput');
    this.tasksContainer = document.getElementById('tasksContainer');
    this.emptyState = document.getElementById('emptyState');
  }

  initializeEventListeners() {
    this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    this.registerForm.addEventListener('submit', (e) => this.handleRegister(e));
    this.taskForm.addEventListener('submit', (e) => this.addTask(e));
    this.searchInput.addEventListener('input', (e) => this.handleSearch(e));
  }

  checkAuthStatus() {
    if (this.accessToken && this.user) {
      this.showAppSection();
      this.loadTasks();
    } else {
      this.showAuthSection();
    }
  }

  showAuthSection() {
    this.authSection.style.display = 'flex';
    this.appSection.style.display = 'none';
  }

  showAppSection() {
    this.authSection.style.display = 'none';
    this.appSection.style.display = 'block';
  }

  switchToLogin() {
    this.loginTab.style.display = 'block';
    this.registerTab.style.display = 'none';
    this.loginError.textContent = '';
  }

  switchToRegister() {
    this.loginTab.style.display = 'none';
    this.registerTab.style.display = 'block';
    this.registerError.textContent = '';
  }

  async handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        const error = await response.json();
        this.loginError.textContent = error.error || 'Login failed';
        return;
      }

      const data = await response.json();
      this.accessToken = data.accessToken;
      this.refreshToken = data.refreshToken;
      this.user = data.user;

      localStorage.setItem('accessToken', this.accessToken);
      localStorage.setItem('refreshToken', this.refreshToken);
      localStorage.setItem('user', JSON.stringify(this.user));

      this.loginForm.reset();
      this.showAppSection();
      this.loadTasks();
    } catch (error) {
      this.loginError.textContent = 'Network error. Please try again.';
      console.error('Login error:', error);
    }
  }

  async handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });

      if (!response.ok) {
        const error = await response.json();
        this.registerError.textContent = error.error || 'Registration failed';
        return;
      }

      const data = await response.json();
      this.accessToken = data.accessToken;
      this.refreshToken = data.refreshToken;
      this.user = data.user;

      localStorage.setItem('accessToken', this.accessToken);
      localStorage.setItem('refreshToken', this.refreshToken);
      localStorage.setItem('user', JSON.stringify(this.user));

      this.registerForm.reset();
      this.showAppSection();
      this.loadTasks();
    } catch (error) {
      this.registerError.textContent = 'Network error. Please try again.';
      console.error('Register error:', error);
    }
  }

  logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    this.accessToken = null;
    this.refreshToken = null;
    this.user = null;
    this.tasks = [];
    this.showAuthSection();
    this.loginForm.reset();
    this.switchToLogin();
  }

  async loadTasks() {
    try {
      const response = await fetch('/api/tasks', {
        headers: { 'Authorization': `Bearer ${this.accessToken}` }
      });
      if (!response.ok) throw new Error('Failed to load tasks');
      this.tasks = await response.json();
      this.render();
    } catch (error) {
      console.error('Error loading tasks:', error);
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
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        },
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
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        },
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
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        }
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
