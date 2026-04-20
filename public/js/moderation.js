requireAuth();

const user = getUser();

if (user?.role !== "Validador") {
  alert("Acceso restringido a validadores");
  window.location.href = "dashboard.html";
}

document.getElementById("logoutBtn").addEventListener("click", logout);
document.getElementById("duplicateSearchForm").addEventListener("submit", searchDuplicates);

loadPendingEvents();
loadRejectedEvents();

async function loadPendingEvents() {
  const container = document.getElementById("pendingEvents");
  container.innerHTML = `<div class="col-12"><p>Cargando eventos pendientes...</p></div>`;

  try {
    const response = await fetch(`${API_BASE_URL}/moderation/pending`, {
      headers: authHeaders()
    });

    const data = await response.json();

    if (!response.ok || !data.events?.length) {
      container.innerHTML = `<div class="col-12"><p>No hay eventos pendientes.</p></div>`;
      return;
    }

    container.innerHTML = data.events.map(event => `
      <div class="col-12 col-md-6">
        <article class="card border-0 shadow-sm rounded-4 h-100">
          <div class="card-body">
            <h3 class="h5 fw-bold">${event.title}</h3>
            <p>${event.description}</p>
            <p><strong>Lugar:</strong> ${event.placeName}</p>
            <p><strong>Zona:</strong> ${event.zone}</p>
            <p><strong>Categorías:</strong> ${(event.category || []).join(", ") || "Sin categorías"}</p>
            <div class="d-grid gap-2 d-md-flex">
              <button class="btn btn-success" onclick="approveEvent('${event._id}')">Aprobar</button>
              <button class="btn btn-danger" onclick="rejectEvent('${event._id}')">Rechazar</button>
            </div>
          </div>
        </article>
      </div>
    `).join("");
  } catch (error) {
    container.innerHTML = `<div class="col-12"><p>Error de conexión.</p></div>`;
  }
}

async function loadRejectedEvents() {
  const container = document.getElementById("rejectedEvents");
  container.innerHTML = `<div class="col-12"><p>Cargando eventos rechazados...</p></div>`;

  try {
    const response = await fetch(`${API_BASE_URL}/moderation/rejected`, {
      headers: authHeaders()
    });

    const data = await response.json();

    if (!response.ok || !data.events?.length) {
      container.innerHTML = `<div class="col-12"><p>No hay eventos rechazados.</p></div>`;
      return;
    }

    container.innerHTML = data.events.map(event => `
      <div class="col-12 col-md-6">
        <article class="card border-0 shadow-sm rounded-4 h-100">
          <div class="card-body">
            <h3 class="h5 fw-bold">${event.title}</h3>
            <p>${event.description}</p>
            <p><strong>Razón:</strong> ${event.rejectionReason || "No especificada"}</p>
          </div>
        </article>
      </div>
    `).join("");
  } catch (error) {
    container.innerHTML = `<div class="col-12"><p>Error de conexión.</p></div>`;
  }
}

async function approveEvent(id) {
  const categoryText = prompt("Categorías separadas por coma (opcional):", "");
  const category = categoryText
    ? categoryText.split(",").map(item => item.trim()).filter(Boolean)
    : [];

  const response = await fetch(`${API_BASE_URL}/moderation/approve/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ category })
  });

  const data = await response.json();

  if (!response.ok) {
    return showMessage("moderationMessage", data.message || "No se pudo aprobar", "error");
  }

  showMessage("moderationMessage", data.message, "success");
  loadPendingEvents();
  loadRejectedEvents();
}

async function rejectEvent(id) {
  const reason = prompt("Motivo del rechazo:", "Información insuficiente");

  const response = await fetch(`${API_BASE_URL}/moderation/reject/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ reason })
  });

  const data = await response.json();

  if (!response.ok) {
    return showMessage("moderationMessage", data.message || "No se pudo rechazar", "error");
  }

  showMessage("moderationMessage", data.message, "success");
  loadPendingEvents();
  loadRejectedEvents();
}

async function searchDuplicates(e) {
  e.preventDefault();

  const params = new URLSearchParams();
  const zone = document.getElementById("duplicateZone").value.trim();
  const title = document.getElementById("duplicateTitle").value.trim();
  const placeName = document.getElementById("duplicatePlaceName").value.trim();

  if (zone) params.append("zone", zone);
  if (title) params.append("title", title);
  if (placeName) params.append("placeName", placeName);

  const container = document.getElementById("duplicateResults");
  container.innerHTML = `<div class="col-12"><p>Buscando coincidencias...</p></div>`;

  try {
    const response = await fetch(`${API_BASE_URL}/moderation/duplicates?${params.toString()}`, {
      headers: authHeaders()
    });

    const data = await response.json();

    if (!response.ok || !data.events?.length) {
      container.innerHTML = `<div class="col-12"><p>No se encontraron posibles duplicados.</p></div>`;
      return;
    }

    container.innerHTML = data.events.map(event => `
      <div class="col-12 col-md-6">
        <article class="card border-0 shadow-sm rounded-4 h-100">
          <div class="card-body">
            <h3 class="h5 fw-bold">${event.title}</h3>
            <p><strong>Lugar:</strong> ${event.placeName}</p>
            <p><strong>Zona:</strong> ${event.zone}</p>
            <p><strong>Fecha:</strong> ${formatDate(event.date)}</p>
          </div>
        </article>
      </div>
    `).join("");
  } catch (error) {
    container.innerHTML = `<div class="col-12"><p>Error de conexión.</p></div>`;
  }
}