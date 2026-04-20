function saveToken(token) {
  localStorage.setItem("token", token);
}

function getToken() {
  return localStorage.getItem("token");
}

function saveUser(user) {
  localStorage.setItem("user", JSON.stringify(user));
}

function getUser() {
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "index.html";
}

function authHeaders() {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };
}

function requireAuth() {
  if (!getToken()) {
    window.location.href = "index.html";
  }
}

function showMessage(containerId, text, type = "info") {
  const box = document.getElementById(containerId);
  if (!box) return;

  box.classList.remove("d-none", "alert-info", "alert-success", "alert-danger", "alert-warning");

  if (type === "success") box.classList.add("alert", "alert-success");
  else if (type === "error") box.classList.add("alert", "alert-danger");
  else if (type === "warning") box.classList.add("alert", "alert-warning");
  else box.classList.add("alert", "alert-info");

  box.textContent = text;
}

function hideMessage(containerId) {
  const box = document.getElementById(containerId);
  if (!box) return;
  box.classList.add("d-none");
  box.textContent = "";
}

function formatDate(dateValue) {
  if (!dateValue) return "Sin fecha";
  const date = new Date(dateValue);
  return date.toLocaleString();
}

function statusBadge(status) {
  return `<span class="badge ${status}">${status}</span>`;
}

function sourceBadge(sourceType) {
  return `<span class="badge ${sourceType}">${sourceType}</span>`;
}

function trustByRole(role) {
  if (role === "Promotor") return 100;
  if (role === "Explorador") return 75;
  if (role === "Validador") return 50;
  return 0;
}