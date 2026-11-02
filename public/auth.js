document.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.getElementById('loginBtn');
  const registerBtn = document.getElementById('registerBtn');
  const authEmail = document.getElementById('authEmail');
  const authPassword = document.getElementById('authPassword');
  const userEmailDisplay = document.getElementById('userEmail');

  loginBtn.addEventListener('click', async () => {
    const email = authEmail.value.trim();
    const password = authPassword.value;

    if (!email || !password) {
      alert('Please enter both email and password');
      return;
    }

    await app.login(email, password);
    userEmailDisplay.textContent = app.userEmail;
  });

  registerBtn.addEventListener('click', async () => {
    const email = authEmail.value.trim();
    const password = authPassword.value;

    if (!email || !password) {
      alert('Please enter both email and password');
      return;
    }

    await app.register(email, password);
    userEmailDisplay.textContent = app.userEmail;
  });

  const authForm = document.getElementById('authForm');
  authForm.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        registerBtn.click();
      } else {
        loginBtn.click();
      }
    }
  });
});
