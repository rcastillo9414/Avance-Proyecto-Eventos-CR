requireAuth();

const user = getUser();

document.getElementById("logoutBtn").addEventListener("click", logout);

const createSection = document.getElementById("createUserForm")?.closest(".card")?.closest(".col-12");
const infoSection = document.querySelector(".col-12.col-xl-7");

if (user?.role === "Promotor") {
  document.getElementById("createUserForm").addEventListener("submit", createManagedUser);
  loadManagedUsers();
} else if (user?.role === "Explorador" || user?.role === "Validador") {
  if (createSection) createSection.style.display = "none";
  if (infoSection) {
    infoSection.classList.remove("col-xl-7");
    infoSection.classList.add("col-12");
  }
  loadZoneUsers();
} else {
  alert("Acceso restringido");
  window.location.href = "dashboard.html";
}

async function createManagedUser(e) {
  e.preventDefault();
  hideMessage("usersMessage");

  const payload = {
    name: document.getElementById("userName").value.trim(),
    email: document.getElementById("userEmail").value.trim(),
    password: document.getElementById("userPassword").value.trim(),
    role: document.getElementById("userRole").value
  };

  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      return showMessage("usersMessage", data.message || "No se pudo crear el perfil", "error");
    }

    showMessage("usersMessage", data.message, "success");
    document.getElementById("createUserForm").reset();
    loadManagedUsers();
  } catch (error) {
    console.error("Error al crear perfil:", error);
    showMessage("usersMessage", "Error de conexión con el servidor", "error");
  }
}

async function loadManagedUsers() {
  const list = document.getElementById("usersList");
  list.innerHTML = `<div class="col-12"><p>Cargando perfiles...</p></div>`;

  try {
    const response = await fetch(`${API_BASE_URL}/users/mine`, {
      headers: authHeaders()
    });

    const data = await response.json();

    if (!response.ok) {
      list.innerHTML = `<div class="col-12"><p>No se pudieron cargar los perfiles.</p></div>`;
      return;
    }

    if (!data.users || data.users.length === 0) {
      list.innerHTML = `<div class="col-12"><p>No hay perfiles gestionados.</p></div>`;
      return;
    }

    list.innerHTML = data.users.map((managedUser) => `
      <div class="col-12 col-md-6 col-xl-4">
        <div class="card border-0 shadow-sm rounded-4 h-100">
          <div class="card-body">
            <h3 class="h5 fw-bold mb-2">${managedUser.name}</h3>
            <p class="mb-1"><strong>Correo:</strong> ${managedUser.email}</p>
            <p class="mb-1"><strong>Rol actual:</strong> ${managedUser.role}</p>
            <p class="mb-1"><strong>Zona:</strong> ${managedUser.zone}</p>
            <p class="mb-3"><strong>Confianza:</strong> ${managedUser.trustLevel}%</p>

            <div class="mb-3">
              <label class="form-label fw-semibold" for="role-${managedUser._id}">
                Cambiar rol
              </label>
              <select id="role-${managedUser._id}" class="form-select">
                <option value="Explorador" ${managedUser.role === "Explorador" ? "selected" : ""}>Explorador</option>
                <option value="Promotor" ${managedUser.role === "Promotor" ? "selected" : ""}>Promotor</option>
                <option value="Validador" ${managedUser.role === "Validador" ? "selected" : ""}>Validador</option>
              </select>
            </div>

            <button class="btn btn-primary w-100" onclick="updateManagedUserRole('${managedUser._id}')">
              Actualizar rol
            </button>
          </div>
        </div>
      </div>
    `).join("");
  } catch (error) {
    console.error("Error al cargar perfiles gestionados:", error);
    list.innerHTML = `<div class="col-12"><p>Error de conexión con el servidor.</p></div>`;
  }
}

async function loadZoneUsers() {
  const list = document.getElementById("usersList");
  list.innerHTML = `<div class="col-12"><p>Cargando perfiles de la zona...</p></div>`;

  try {
    const response = await fetch(`${API_BASE_URL}/users/zone`, {
      headers: authHeaders()
    });

    const data = await response.json();

    if (!response.ok) {
      list.innerHTML = `<div class="col-12"><p>No se pudieron cargar los perfiles de la zona.</p></div>`;
      return;
    }

    if (!data.users || data.users.length === 0) {
      list.innerHTML = `<div class="col-12"><p>No hay perfiles disponibles en la zona.</p></div>`;
      return;
    }

    list.innerHTML = data.users.map((zoneUser) => `
      <div class="col-12 col-md-6 col-xl-4">
        <div class="card border-0 shadow-sm rounded-4 h-100">
          <div class="card-body">
            <h3 class="h5 fw-bold mb-2">${zoneUser.name}</h3>
            <p class="mb-1"><strong>Correo:</strong> ${zoneUser.email}</p>
            <p class="mb-1"><strong>Rol actual:</strong> ${zoneUser.role}</p>
            <p class="mb-1"><strong>Zona:</strong> ${zoneUser.zone}</p>
            <p class="mb-0"><strong>Confianza:</strong> ${zoneUser.trustLevel}%</p>
          </div>
        </div>
      </div>
    `).join("");
  } catch (error) {
    console.error("Error al cargar perfiles por zona:", error);
    list.innerHTML = `<div class="col-12"><p>Error de conexión con el servidor.</p></div>`;
  }
}

async function updateManagedUserRole(userId) {
  const role = document.getElementById(`role-${userId}`).value;

  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/role`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ role })
    });

    const data = await response.json();

    if (!response.ok) {
      return showMessage("usersMessage", data.message || "No se pudo actualizar el rol", "error");
    }

    showMessage("usersMessage", data.message, "success");
    loadManagedUsers();
  } catch (error) {
    console.error("Error al actualizar rol:", error);
    showMessage("usersMessage", "Error de conexión con el servidor", "error");
  }
}