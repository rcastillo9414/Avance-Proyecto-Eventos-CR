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

async function readResponse(response) {
  const rawText = await response.text();

  try {
    return {
      data: rawText ? JSON.parse(rawText) : {},
      rawText
    };
  } catch (error) {
    return {
      data: null,
      rawText
    };
  }
}

async function loadPendingEvents() {
  const container = document.getElementById("pendingEvents");
  container.innerHTML = `<div class="col-12"><p>Cargando eventos pendientes...</p></div>`;

  try {
    const response = await fetch(`${API_BASE_URL}/moderation/pending`, {
      headers: authHeaders()
    });

    const { data, rawText } = await readResponse(response);

    if (!response.ok || !data.events?.length) {
      container.innerHTML = `<div class="col-12"><p>${data?.message || rawText || "No hay eventos pendientes."}</p></div>`;
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

            <div class="mb-3">
              <label class="form-label fw-semibold" for="recategory-${event._id}">Recategorizar</label>
              <input
                id="recategory-${event._id}"
                type="text"
                class="form-control"
                placeholder="Cultura, Música, Feria"
              />
            </div>

            <div class="d-grid gap-2">
              <button class="btn btn-success" onclick="approveEvent('${event._id}')">Aprobar</button>
              <button class="btn btn-outline-primary" onclick="recategorizeEvent('${event._id}')">Guardar categorías</button>
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

    const { data, rawText } = await readResponse(response);

    if (!response.ok || !data.events?.length) {
      container.innerHTML = `<div class="col-12"><p>${data?.message || rawText || "No hay eventos rechazados."}</p></div>`;
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

  const { data, rawText } = await readResponse(response);

  if (!response.ok) {
    return showMessage("moderationMessage", data?.message || rawText || "No se pudo aprobar", "error");
  }

  showMessage("moderationMessage", data?.message || "Evento aprobado", "success");
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

  const { data, rawText } = await readResponse(response);

  if (!response.ok) {
    return showMessage("moderationMessage", data?.message || rawText || "No se pudo rechazar", "error");
  }

  showMessage("moderationMessage", data?.message || "Evento rechazado", "success");
  loadPendingEvents();
  loadRejectedEvents();
}

async function recategorizeEvent(id) {
  const input = document.getElementById(`recategory-${id}`);
  const category = (input?.value || "")
    .split(",")
    .map(item => item.trim())
    .filter(Boolean);

  if (!category.length) {
    return showMessage("moderationMessage", "Debes indicar al menos una categoría", "warning");
  }

  const response = await fetch(`${API_BASE_URL}/moderation/recategorize/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ category })
  });

  const { data, rawText } = await readResponse(response);

  if (!response.ok) {
    return showMessage("moderationMessage", data?.message || rawText || "No se pudo recategorizar", "error");
  }

  showMessage("moderationMessage", data?.message || "Evento recategorizado", "success");
  loadPendingEvents();
}

async function mergeDuplicateEvents(primaryEventId, duplicateEventId) {
  if (!primaryEventId || !duplicateEventId) {
    return showMessage("moderationMessage", "Debes seleccionar un evento principal y uno duplicado", "warning");
  }

  if (primaryEventId === duplicateEventId) {
    return showMessage("moderationMessage", "No puedes fusionar el mismo evento", "warning");
  }

  const response = await fetch(`${API_BASE_URL}/moderation/merge-duplicates`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ primaryEventId, duplicateEventId })
  });

  const { data, rawText } = await readResponse(response);

  if (!response.ok) {
    return showMessage("moderationMessage", data?.message || rawText || "No se pudieron fusionar los eventos", "error");
  }

  showMessage("moderationMessage", data?.message || "Eventos fusionados correctamente", "success");
  searchDuplicates(new Event("submit"));
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

    const { data, rawText } = await readResponse(response);

    if (!response.ok || !data.events?.length) {
      container.innerHTML = `<div class="col-12"><p>${data?.message || rawText || "No se encontraron posibles duplicados."}</p></div>`;
      return;
    }

    container.innerHTML = `
      <div class="col-12">
        <div class="alert alert-info">
          Selecciona cuál evento es principal y cuál será marcado como duplicado.
        </div>
      </div>
      ${data.events.map(event => `
        <div class="col-12 col-lg-6">
          <article class="card border-0 shadow-sm rounded-4 h-100">
            <div class="card-body">
              <div class="form-check">
                <input class="form-check-input" type="radio" name="primaryEvent" value="${event._id}" id="primary-${event._id}">
                <label class="form-check-label fw-semibold" for="primary-${event._id}">
                  Principal
                </label>
              </div>

              <div class="form-check mb-3">
                <input class="form-check-input" type="radio" name="duplicateEvent" value="${event._id}" id="duplicate-${event._id}">
                <label class="form-check-label fw-semibold" for="duplicate-${event._id}">
                  Duplicado
                </label>
              </div>

              <h3 class="h5 fw-bold">${event.title}</h3>
              <p>${event.description}</p>
              <p><strong>Lugar:</strong> ${event.placeName}</p>
              <p><strong>Zona:</strong> ${event.zone}</p>
              <p><strong>Fecha:</strong> ${formatDate(event.date)}</p>
            </div>
          </article>
        </div>
      `).join("")}
      <div class="col-12">
        <button class="btn btn-dark" onclick="confirmMergeSelection()">Fusionar duplicados</button>
      </div>
    `;
  } catch (error) {
    container.innerHTML = `<div class="col-12"><p>Error de conexión.</p></div>`;
  }
}

function confirmMergeSelection() {
  const primaryEventId = document.querySelector('input[name="primaryEvent"]:checked')?.value;
  const duplicateEventId = document.querySelector('input[name="duplicateEvent"]:checked')?.value;
  mergeDuplicateEvents(primaryEventId, duplicateEventId);
}