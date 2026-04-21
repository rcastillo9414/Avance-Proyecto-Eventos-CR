const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const forgotForm = document.getElementById("forgotForm");
const resetForm = document.getElementById("resetForm");

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

// solicitar recuperación
if (forgotForm) {
  forgotForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideMessage("forgotMessage");

    const email = document.getElementById("email").value.trim();

    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        return showMessage("forgotMessage", data.message || "No se pudo procesar la solicitud", "error");
      }

      showMessage("forgotMessage", data.message, "success");
    } catch (error) {
      showMessage("forgotMessage", "No se pudo conectar con el servidor", "error");
    }
  });
}

//restablecer contraseña
if (resetForm) {
  resetForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideMessage("resetMessage");

    const password = document.getElementById("password").value.trim();
    const confirmPassword = document.getElementById("confirmPassword").value.trim();
    const token = new URLSearchParams(window.location.search).get("token");

    if (!token) {
      return showMessage("resetMessage", "No se encontró el token de recuperación", "error");
    }

    if (password.length < 6) {
      return showMessage("resetMessage", "La nueva contraseña debe tener al menos 6 caracteres", "error");
    }

    if (password !== confirmPassword) {
      return showMessage("resetMessage", "Las contraseñas no coinciden", "error");
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password })
      });

      const data = await response.json();

      if (!response.ok) {
        return showMessage("resetMessage", data.message || "No se pudo restablecer la contraseña", "error");
      }

      showMessage("resetMessage", data.message, "success");

      setTimeout(() => {
        window.location.href = "index.html";
      }, 1500);
    } catch (error) {
      showMessage("resetMessage", "No se pudo conectar con el servidor", "error");
    }
  });
}