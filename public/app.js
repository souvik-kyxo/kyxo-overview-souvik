class TodoApp {
  constructor() {
    this.tasks = [];
    this.categories = [];
    this.categoryColorMap = {};
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
    this.categoryInput.addEventListener('input', (e) => this.handleCategoryInput(e));
    this.loadCategories();
    this.loadTasks();
  }

  async loadCategories() {
    try {
      const response = await fetch('/api/tasks/categories/all');
      if (!response.ok) throw new Error('Failed to load categories');
      this.categories = await response.json();
      this.buildCategoryColorMap();
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

  buildCategoryColorMap() {
    this.categoryColorMap = {};
    this.categories.forEach(cat => {
      this.categoryColorMap[cat.name] = cat.color;
    });
  }

  toggleCategoryManager() {
    const manager = document.getElementById('categoryManager');
    manager.classList.toggle('hidden');
    if (!manager.classList.contains('hidden')) {
      this.renderCategoriesManager();
    }
  }

  getTaskCountByCategory(categoryName) {
    return this.tasks.filter(task =>
      task.categories && Array.isArray(task.categories) &&
      task.categories.includes(categoryName)
    ).length;
  }

  renderCategoriesManager() {
    const content = document.getElementById('categoriesListContent');

    if (this.categories.length === 0) {
      content.innerHTML = '<p style="color: #999; font-size: 14px;">No categories yet. Create one above!</p>';
      return;
    }

    content.innerHTML = this.categories.map(cat => {
      const taskCount = this.getTaskCountByCategory(cat.name);
      return `
        <div class="category-item">
          <div class="category-item-info">
            <div class="category-item-color" style="background-color: ${cat.color}"></div>
            <span class="category-item-name">${this.escapeHtml(cat.name)}</span>
            <span class="category-item-count">${taskCount} task${taskCount !== 1 ? 's' : ''}</span>
          </div>
          <div class="category-item-actions">
            <button class="btn-delete-category" onclick="app.deleteCategory('${this.escapeHtml(cat.name)}')">Delete</button>
          </div>
        </div>
      `;
    }).join('');
  }

  async addNewCategory() {
    const nameInput = document.getElementById('newCategoryName');
    const colorInput = document.getElementById('newCategoryColor');
    const name = nameInput.value.trim();
    const color = colorInput.value;

    if (!name) {
      alert('Please enter a category name');
      nameInput.focus();
      return;
    }

    try {
      const response = await fetch('/api/tasks/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, color, description: '' })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add category');
      }

      const newCategory = await response.json();
      this.categories.push(newCategory);
      this.buildCategoryColorMap();
      nameInput.value = '';
      colorInput.value = '#667eea';
      this.renderCategoriesManager();
      this.render();
    } catch (error) {
      console.error('Error adding category:', error);
      alert(error.message);
    }
  }

  async deleteCategory(categoryName) {
    if (!confirm(`Delete category "${categoryName}"? Tasks with this category will not be deleted.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/tasks/categories/${categoryName}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete category');
      }

      this.categories = this.categories.filter(c => c.name !== categoryName);
      this.buildCategoryColorMap();
      this.renderCategoriesManager();
      this.render();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert(error.message);
    }
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

  handleCategoryInput(e) {
    const input = e.target.value;
    const suggestions = this.getRecommendedCategories(input);
    this.renderCategorySuggestions(suggestions);
  }

  getRecommendedCategories(input) {
    if (!input.trim()) {
      return this.categories.slice(0, 5);
    }
    const lastCategory = input.split(',').pop().trim().toLowerCase();
    return this.categories.filter(cat =>
      cat.displayName.toLowerCase().startsWith(lastCategory)
    ).slice(0, 5);
  }

  renderCategorySuggestions(suggestions) {
    const container = document.getElementById('categorySuggestions');
    if (!container) return;

    if (suggestions.length === 0) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = suggestions.map(cat => `
      <div class="category-suggestion" onclick="app.addSuggestionCategory('${this.escapeHtml(cat.displayName)}')">
        <span class="suggestion-color" style="background-color: ${cat.color}"></span>
        <span class="suggestion-name">${this.escapeHtml(cat.displayName)}</span>
      </div>
    `).join('');
  }

  addSuggestionCategory(categoryName) {
    const current = this.categoryInput.value.trim();
    const categories = current ? current.split(',').map(c => c.trim()) : [];

    if (!categories.includes(categoryName)) {
      categories.push(categoryName);
      this.categoryInput.value = categories.join(', ');
    }

    const container = document.getElementById('categorySuggestions');
    if (container) container.innerHTML = '';
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
      const color = this.getCategoryColor(category);
      return `
        <button
          class="category-filter-btn ${isSelected ? 'active' : ''}"
          style="${isSelected ? `background-color: ${color}; border-color: ${color};` : ''}"
          onclick="app.toggleCategory('${this.escapeHtml(category)}')"
          title="Filter by ${this.escapeHtml(category)}"
        >
          <span class="category-dot" style="background-color: ${color}"></span>
          ${this.escapeHtml(category)}
        </button>
      `;
    }).join('');

    this.categoryFiltersContainer.innerHTML = `
      <div class="category-filter-header">Filter by category:</div>
      <div class="category-filter-buttons">
        ${categoryButtons}
        ${this.selectedCategories.size > 0 ? '<button class="category-filter-btn clear-btn" onclick="app.clearCategoryFilters()">✕ Clear</button>' : ''}
      </div>
    `;
  }

  getCategoryColor(categoryName) {
    return this.categoryColorMap[categoryName.toLowerCase()] || '#667eea';
  }

  clearCategoryFilters() {
    this.selectedCategories.clear();
    this.render();
  }

  render() {
    this.renderCategoryFilters();
    const categoryManager = document.getElementById('categoryManager');
    if (categoryManager && !categoryManager.classList.contains('hidden')) {
      this.renderCategoriesManager();
    }
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
        ? `<div class="task-categories">${task.categories.map(cat => {
          const color = this.getCategoryColor(cat);
          return `<span class="category-tag" style="background: linear-gradient(135deg, ${color} 0%, ${this.adjustColor(color, -20)} 100%)">${this.escapeHtml(cat)}</span>`;
        }).join('')}</div>`
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

  adjustColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255))
      .toString(16).slice(1);
  }
}

let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new TodoApp();
});
