class Category {
  constructor(name, color = '#667eea', description = '', id = null) {
    if (!name || name.trim() === '') {
      throw new Error('Category name cannot be empty');
    }

    this.id = id || Date.now().toString();
    this.name = name.trim().toLowerCase();
    this.displayName = name.trim();
    this.color = this.validateColor(color) || '#667eea';
    this.description = description.trim();
    this.createdAt = new Date().toISOString();
  }

  validateColor(color) {
    const hexRegex = /^#[0-9A-F]{6}$/i;
    return hexRegex.test(color) ? color : null;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      displayName: this.displayName,
      color: this.color,
      description: this.description,
      createdAt: this.createdAt
    };
  }

  static fromJSON(data) {
    return new Category(data.displayName || data.name, data.color, data.description, data.id);
  }

  static DEFAULT_CATEGORIES = [
    new Category('Work', '#3b82f6', 'Work-related tasks'),
    new Category('Personal', '#8b5cf6', 'Personal tasks'),
    new Category('Shopping', '#ec4899', 'Shopping list items'),
    new Category('Health', '#10b981', 'Health and fitness'),
    new Category('Urgent', '#ef4444', 'Urgent tasks'),
    new Category('Important', '#f59e0b', 'Important tasks')
  ];
}

module.exports = Category;
