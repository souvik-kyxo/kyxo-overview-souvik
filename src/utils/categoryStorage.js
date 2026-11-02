const fs = require('fs');
const path = require('path');
const Category = require('../models/Category');

const CATEGORIES_FILE = path.join(__dirname, '../../categories.json');

class CategoryStorage {
  static loadCategories() {
    try {
      if (fs.existsSync(CATEGORIES_FILE)) {
        const data = fs.readFileSync(CATEGORIES_FILE, 'utf8');
        const categoriesData = JSON.parse(data);
        return categoriesData.map(catData => Category.fromJSON(catData));
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
    return this.initializeDefaultCategories();
  }

  static initializeDefaultCategories() {
    const defaults = Category.DEFAULT_CATEGORIES.map(cat => cat.toJSON());
    fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(defaults, null, 2), 'utf8');
    return Category.DEFAULT_CATEGORIES;
  }

  static saveCategories(categories) {
    try {
      const categoriesData = categories.map(cat => cat.toJSON());
      fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(categoriesData, null, 2), 'utf8');
    } catch (error) {
      console.error('Error saving categories:', error);
      throw error;
    }
  }

  static getCategoryByName(name) {
    const categories = this.loadCategories();
    return categories.find(cat => cat.name === name.toLowerCase());
  }

  static getCategoryColor(categoryName) {
    const category = this.getCategoryByName(categoryName);
    return category ? category.color : '#667eea';
  }
}

module.exports = CategoryStorage;
