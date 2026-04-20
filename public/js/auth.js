const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideMessage("loginMessage");

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        return showMessage("loginMessage", data.message || "Error al iniciar sesión", "error");
      }

      saveToken(data.token);
      saveUser(data.user);
      window.location.href = "dashboard.html";
    } catch (error) {
      showMessage("loginMessage", "No se pudo conectar con el servidor", "error");
    }
  });
}

if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideMessage("registerMessage");

    const payload = {
      name: document.getElementById("name").value.trim(),
      email: document.getElementById("email").value.trim(),
      password: document.getElementById("password").value.trim(),
      zone: document.getElementById("zone").value.trim()
    };

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        return showMessage("registerMessage", data.message || "Error al registrar usuario", "error");
      }

      saveToken(data.token);
      saveUser(data.user);
      window.location.href = "dashboard.html";
    } catch (error) {
      showMessage("registerMessage", "No se pudo conectar con el servidor", "error");
    }
  });
}