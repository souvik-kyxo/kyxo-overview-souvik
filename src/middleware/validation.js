const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  if (typeof password !== 'string') return false;
  if (password.length < 8) return false;
  return true;
};

const validateTaskTitle = (title) => {
  if (typeof title !== 'string') return false;
  const trimmed = title.trim();
  if (trimmed.length === 0 || trimmed.length > 500) return false;
  return true;
};

const validateStatus = (status) => {
  const validStatuses = ['todo', 'in-progress', 'done'];
  return validStatuses.includes(status);
};

const validateDueDate = (dueDate) => {
  if (dueDate === null || dueDate === undefined || dueDate === '') return true;
  const date = new Date(dueDate);
  return !isNaN(date.getTime());
};

const validateTaskId = (id) => {
  return typeof id === 'string' && id.trim().length > 0 && id.length < 100;
};

module.exports = {
  validateEmail,
  validatePassword,
  validateTaskTitle,
  validateStatus,
  validateDueDate,
  validateTaskId
};
