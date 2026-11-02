class TodoApp {
  constructor() {
    this.tasks = [];
    this.searchQuery = '';
    this.selectedCategories = new Set();
    this.taskForm = document.getElementById('taskForm');
    this.taskInput = document.getElementById('taskInput');
    this.dueDateInput = document.getElementById('dueDateInput');
    this.categoryInput = document.getElementById('categoryInput');
    this.searchInput = document.getElementById('searchInput');
    this.tasksContainer = document.getElementById('tasksContainer');
    this.categoryFiltersContainer = document.getElementById('categoryFilters');
    this.emptyState = document.getElementById('emptyState');

    this.taskForm.addEventListener('submit', (e) => this.addTask(e));
    this.searchInput.addEventListener('input', (e) => this.handleSearch(e));
    this.loadTasks();
  }

  async loadTasks() {
    try {
      const response = await fetch('/api/tasks');
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
    const categoriesInput = this.categoryInput.value.trim();
    const categories = categoriesInput
      ? categoriesInput.split(',').map(cat => cat.trim().toLowerCase()).filter(cat => cat)
      : [];

    if (!title) {
      this.taskInput.focus();
      return;
    }

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, status: 'todo', done: false, dueDate, categories })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add task');
      }

      const newTask = await response.json();
      this.tasks.push(newTask);
      this.taskInput.value = '';
      this.dueDateInput.value = '';
      this.categoryInput.value = '';
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' }
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

  toggleCategory(category) {
    if (this.selectedCategories.has(category)) {
      this.selectedCategories.delete(category);
    } else {
      this.selectedCategories.add(category);
    }
    this.render();
  }

  getAllCategories() {
    const categories = new Set();
    this.tasks.forEach(task => {
      if (task.categories && Array.isArray(task.categories)) {
        task.categories.forEach(cat => categories.add(cat));
      }
    });
    return Array.from(categories).sort();
  }

  getFilteredTasks() {
    let filtered = this.tasks;

    if (this.searchQuery.trim()) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(this.searchQuery)
      );
    }

    if (this.selectedCategories.size > 0) {
      filtered = filtered.filter(task =>
        task.categories && Array.isArray(task.categories) &&
        Array.from(this.selectedCategories).some(cat => task.categories.includes(cat))
      );
    }

    return filtered;
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

  renderCategoryFilters() {
    const allCategories = this.getAllCategories();

    if (allCategories.length === 0) {
      this.categoryFiltersContainer.innerHTML = '';
      return;
    }

    const categoryButtons = allCategories.map(category => {
      const isSelected = this.selectedCategories.has(category);
      return `
        <button
          class="category-filter-btn ${isSelected ? 'active' : ''}"
          onclick="app.toggleCategory('${this.escapeHtml(category)}')"
        >
          ${this.escapeHtml(category)}
        </button>
      `;
    }).join('');

    this.categoryFiltersContainer.innerHTML = `
      <div class="category-filter-header">Filter by category:</div>
      <div class="category-filter-buttons">
        ${categoryButtons}
        ${this.selectedCategories.size > 0 ? '<button class="category-filter-btn clear-btn" onclick="app.clearCategoryFilters()">Clear</button>' : ''}
      </div>
    `;
  }

  clearCategoryFilters() {
    this.selectedCategories.clear();
    this.render();
  }

  render() {
    this.renderCategoryFilters();
    const filteredTasks = this.getFilteredTasks();

    if (this.tasks.length === 0) {
      this.tasksContainer.innerHTML = '<p id="emptyState" class="empty-state">No tasks yet. Add one to get started!</p>';
      return;
    }

    if (filteredTasks.length === 0) {
      this.tasksContainer.innerHTML = '<p id="emptyState" class="empty-state">No tasks match your filters.</p>';
      return;
    }

    this.tasksContainer.innerHTML = filteredTasks.map(task => {
      const dueDateStatus = this.getDueDateStatus(task.dueDate);
      const dueDateClass = dueDateStatus ? `due-date ${dueDateStatus}` : 'due-date';
      const dueDateDisplay = task.dueDate ? `<span class="${dueDateClass}">${this.formatDate(task.dueDate)}</span>` : '<span class="due-date-placeholder">Add due date</span>';
      const formattedDate = task.dueDate ? task.dueDate : '';

      const categoriesHtml = task.categories && Array.isArray(task.categories) && task.categories.length > 0
        ? `<div class="task-categories">${task.categories.map(cat => `<span class="category-tag">${this.escapeHtml(cat)}</span>`).join('')}</div>`
        : '';

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
            ${categoriesHtml}
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
              <input
                type="text"
                class="task-category-input"
                placeholder="Add categories (comma-separated)"
                value="${task.categories && Array.isArray(task.categories) ? task.categories.join(', ') : ''}"
                onchange="app.updateTask('${task.id}', { categories: event.target.value.split(',').map(c => c.trim().toLowerCase()).filter(c => c) })"
                title="Click to add or edit categories"
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
