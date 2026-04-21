const currentPage = window.location.pathname.split("/").pop();

if (document.getElementById("logoutBtn")) {
  document.getElementById("logoutBtn").addEventListener("click", logout);
}

const getTrustLevel = (role) => {
  if (role === "Promotor") return 100;
  if (role === "Explorador") return 75;
  if (role === "Validador") return 50;
  return 0;
};

const getReadableStatus = (status) => {
  if (status === "publicado") return "Oficialmente";
  if (status === "por_verificar") return "Pendiente confirmación";
  if (status === "cancelado") return "Cancelado";
  if (status === "realizado") return "Realizado";
  if (status === "rechazado") return "Rechazado";
  return status;
};

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

// NUEVO: mapa de creación
let createEventMap;
let createEventMarker = null;

function initCreateEventMap() {
  const mapContainer = document.getElementById("createEventMap");
  if (!mapContainer || typeof L === "undefined") return;
  if (createEventMap) return;

  createEventMap = L.map("createEventMap").setView([9.9281, -84.0907], 11);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap"
  }).addTo(createEventMap);

  createEventMap.on("click", (e) => {
    const { lat, lng } = e.latlng;
    setSelectedLocation(lat, lng);
  });
}

function setSelectedLocation(lat, lng) {
  const latitudeInput = document.getElementById("latitude");
  const longitudeInput = document.getElementById("longitude");

  if (!latitudeInput || !longitudeInput || !createEventMap) return;

  latitudeInput.value = lat;
  longitudeInput.value = lng;

  if (createEventMarker) {
    createEventMap.removeLayer(createEventMarker);
  }

  createEventMarker = L.marker([lat, lng]).addTo(createEventMap);
  createEventMarker.bindPopup("Ubicación del evento seleccionada").openPopup();
}

function clearSelectedLocation() {
  const latitudeInput = document.getElementById("latitude");
  const longitudeInput = document.getElementById("longitude");

  if (latitudeInput) latitudeInput.value = "";
  if (longitudeInput) longitudeInput.value = "";

  if (createEventMap && createEventMarker) {
    createEventMap.removeLayer(createEventMarker);
    createEventMarker = null;
  }
}

function setupCreatePage() {
  requireAuth();

  const currentUser = getUser();
  const zoneInput = document.getElementById("zone");

  if (currentUser?.role === "Promotor" && zoneInput) {
    zoneInput.value = currentUser.zone || "";
    zoneInput.readOnly = true;
  }

  document.getElementById("createEventForm")?.addEventListener("submit", createEvent);
  document.getElementById("photoEvidence")?.addEventListener("change", previewEventImage);
  document.getElementById("clearLocationBtn")?.addEventListener("click", clearSelectedLocation);

  initCreateEventMap();
}

function setupEventsPage() {
  requireAuth();

  const currentUser = getUser();
  const filterZone = document.getElementById("filterZone");

  if (currentUser?.zone && filterZone) {
    filterZone.value = currentUser.zone;
    filterZone.readOnly = true;
  }

  loadEvents();

  document.getElementById("filterEventsForm")?.addEventListener("submit", filterEvents);
  document.getElementById("loadAllBtn")?.addEventListener("click", () => {
    document.getElementById("filterEventsForm")?.reset();

    if (currentUser?.zone && filterZone) {
      filterZone.value = currentUser.zone;
      filterZone.readOnly = true;
    }

    loadEvents();
  });
}

if (currentPage === "crear-evento.html") {
  setupCreatePage();
}

if (currentPage === "eventos.html") {
  setupEventsPage();
}

if (currentPage === "detalle-eventos.html") {
  requireAuth();
  loadEventDetail();

  document.getElementById("cancelEventBtn")?.addEventListener("click", cancelEvent);
  document.getElementById("deleteEventBtn")?.addEventListener("click", deleteEvent);
  document.getElementById("completeEventBtn")?.addEventListener("click", completeEvent);
  document.getElementById("attendanceForm")?.addEventListener("submit", registerAttendance);
  document.getElementById("confirmAttendanceForm")?.addEventListener("submit", confirmAttendance);
  document.getElementById("pointsForm")?.addEventListener("submit", assignPoints);
}

function previewEventImage(e) {
  const file = e.target.files?.[0];
  const preview = document.getElementById("imagePreview");
  const previewEmpty = document.getElementById("imagePreviewEmpty");
  const previewBody = document.getElementById("imagePreviewBody");

  if (!preview || !previewEmpty || !previewBody) return;

  if (!file) {
    preview.src = "";
    preview.classList.add("d-none");
    previewBody.classList.add("d-none");
    previewEmpty.classList.remove("d-none");
    return;
  }

  const fileReader = new FileReader();
  fileReader.onload = (event) => {
    preview.src = event.target.result;
    preview.classList.remove("d-none");
    previewBody.classList.remove("d-none");
    previewEmpty.classList.add("d-none");
  };
  fileReader.readAsDataURL(file);
}

async function createEvent(e) {
  e.preventDefault();
  hideMessage("eventsMessage");

  const title = document.getElementById("title").value.trim();
  const description = document.getElementById("description").value.trim();
  const category = document.getElementById("category").value.trim();
  const rawDate = document.getElementById("date").value;
  const zone = document.getElementById("zone").value.trim();
  const placeName = document.getElementById("placeName").value.trim();
  const address = document.getElementById("address").value.trim();
  const photoEvidence = document.getElementById("photoEvidence").files[0];

  // coordenadas opcionales elegidas en mapa
  const latitude = document.getElementById("latitude")?.value.trim();
  const longitude = document.getElementById("longitude")?.value.trim();

  if (title.length < 3) {
    return showMessage("eventsMessage", "El título debe tener al menos 3 caracteres", "error");
  }

  if (description.length < 10) {
    return showMessage("eventsMessage", "La descripción debe tener al menos 10 caracteres", "error");
  }

  if (placeName.length < 3) {
    return showMessage("eventsMessage", "El nombre del lugar debe tener al menos 3 caracteres", "error");
  }

  if (placeName.length < 5) {
    return showMessage(
      "eventsMessage",
      "El lugar debe ser más específico (ej: Parque Central de Heredia)",
      "error"
    );
  }

  if (!zone) {
    return showMessage("eventsMessage", "La zona es obligatoria", "error");
  }

  const formData = new FormData();
  formData.append("title", title);
  formData.append("description", description);
  formData.append("category", category);
  formData.append("date", rawDate ? new Date(rawDate).toISOString() : "");
  formData.append("zone", zone);
  formData.append("placeName", placeName);
  formData.append("address", address);

  // enviar coordenadas solo si fueron marcadas manualmente
  if (latitude && longitude) {
    formData.append("latitude", latitude);
    formData.append("longitude", longitude);
  }

  if (photoEvidence) {
    formData.append("photoEvidence", photoEvidence);
  }

  try {
    const response = await fetch(`${API_BASE_URL}/events`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getToken()}`
      },
      body: formData
    });

    const { data, rawText } = await readResponse(response);

    if (!response.ok) {
      return showMessage(
        "eventsMessage",
        data?.message || rawText || "No se pudo crear el evento",
        "error"
      );
    }

    if (data?.event && data.event.geocoded === false) {
      showMessage(
        "eventsMessage",
        "Evento creado, pero la ubicación no pudo ser identificada con precisión. Revisa el nombre del lugar y la dirección.",
        "warning"
      );
    } else {
      showMessage(
        "eventsMessage",
        data?.message || "Evento creado correctamente",
        "success"
      );
    }

    document.getElementById("createEventForm").reset();

    const currentUser = getUser();
    const zoneInput = document.getElementById("zone");
    if (currentUser?.role === "Promotor" && zoneInput) {
      zoneInput.value = currentUser.zone || "";
      zoneInput.readOnly = true;
    }

    previewEventImage({ target: { files: [] } });
    clearSelectedLocation();

    setTimeout(() => {
      window.location.href = "eventos.html";
    }, 1400);
  } catch (error) {
    console.error("Error al crear evento:", error);
    showMessage("eventsMessage", "Error de conexión con el servidor", "error");
  }
}

async function loadEvents(query = "") {
  const list = document.getElementById("eventsList");
  if (!list) return;

  list.innerHTML = `<div class="col-12"><p>Cargando eventos...</p></div>`;

  try {
    const response = await fetch(`${API_BASE_URL}/events${query}`, {
      headers: authHeaders()
    });

    const { data, rawText } = await readResponse(response);

    if (!response.ok) {
      list.innerHTML = `<div class="col-12"><p>${data?.message || rawText || "No se pudieron cargar los eventos."}</p></div>`;
      return;
    }

    if (!data?.events || data.events.length === 0) {
      list.innerHTML = `<div class="col-12"><p>No hay eventos disponibles.</p></div>`;
      return;
    }

    list.innerHTML = data.events.map((event) => {
      const trust = getTrustLevel(event.createdBy?.role);

      return `
        <div class="col-12 col-md-6 col-xl-4">
          <article class="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
            ${
              event.photoEvidence
                ? `<img
                    src="http://localhost:5500${event.photoEvidence}"
                    alt="Imagen del evento ${event.title}"
                    class="w-100"
                    style="height: 220px; object-fit: cover;"
                  />`
                : `<div class="d-flex align-items-center justify-content-center bg-light text-muted" style="height: 220px;">
                     Sin imagen
                   </div>`
            }
            <div class="card-body">
              <h3 class="h5 fw-bold">${event.title}</h3>
              <p>${event.description}</p>
              <p><strong>Lugar:</strong> ${event.placeName}</p>
              <p><strong>Zona:</strong> ${event.zone}</p>
              <p><strong>Fecha:</strong> ${formatDate(event.date)}</p>
              <p><strong>Estado:</strong> ${getReadableStatus(event.status)}</p>
              <p><strong>Fuente:</strong> ${event.sourceType}</p>
              <p><strong>Confianza:</strong> ${trust}%</p>
              <p><strong>Ubicación en mapa:</strong> ${event.geocoded ? "Sí" : "Pendiente"}</p>
              <div class="d-grid">
                <a class="btn btn-primary" href="detalle-eventos.html?id=${event._id}">
                  Ver detalle
                </a>
              </div>
            </div>
          </article>
        </div>
      `;
    }).join("");
  } catch (error) {
    console.error("Error al cargar eventos:", error);
    list.innerHTML = `<div class="col-12"><p>Error de conexión con el servidor.</p></div>`;
  }
}

function filterEvents(e) {
  e.preventDefault();

  const params = new URLSearchParams();

  const status = document.getElementById("filterStatus").value;
  const zone = document.getElementById("filterZone").value.trim();
  const sourceType = document.getElementById("filterSourceType").value;
  const category = document.getElementById("filterCategory").value.trim();
  const placeName = document.getElementById("filterPlaceName").value.trim();

  if (status) params.append("status", status);
  if (zone) params.append("zone", zone);
  if (sourceType) params.append("sourceType", sourceType);
  if (category) params.append("category", category);
  if (placeName) params.append("placeName", placeName);

  const query = params.toString() ? `?${params.toString()}` : "";
  loadEvents(query);
}

async function loadEventDetail() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const container = document.getElementById("eventDetailContainer");

  if (!id) {
    container.innerHTML = "<p>No se proporcionó el ID del evento.</p>";
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/events/${id}`, {
      headers: authHeaders()
    });
    const { data, rawText } = await readResponse(response);

    if (!response.ok) {
      container.innerHTML = `<p>${data?.message || rawText || "No se pudo cargar el evento."}</p>`;
      return;
    }

    const event = data;
    const trust = getTrustLevel(event.createdBy?.role);

    container.innerHTML = `
      ${
        event.photoEvidence
          ? `<div class="mb-4">
              <img
                src="http://localhost:5500${event.photoEvidence}"
                alt="Imagen del evento ${event.title}"
                class="img-fluid rounded-4 w-100"
                style="max-height: 420px; object-fit: cover;"
              />
            </div>`
          : ""
      }
      <h2 class="h3 fw-bold mb-3">${event.title}</h2>
      <p>${event.description}</p>
      <p><strong>Estado:</strong> ${getReadableStatus(event.status)}</p>
      <p><strong>Fuente:</strong> ${event.sourceType}</p>
      <p><strong>Confianza del creador:</strong> ${trust}%</p>
      <p><strong>Lugar:</strong> ${event.placeName}</p>
      <p><strong>Dirección:</strong> ${event.address || "Sin dirección"}</p>
      <p><strong>Zona:</strong> ${event.zone}</p>
      <p><strong>Fecha:</strong> ${formatDate(event.date)}</p>
      <p><strong>Ubicación en mapa:</strong> ${event.geocoded ? "Sí" : "Pendiente"}</p>
      <p><strong>Creado por:</strong> ${event.createdBy?.name || "-"}</p>
      <p><strong>Rol del creador:</strong> ${event.createdBy?.role || "-"}</p>
      <p><strong>Participación:</strong> ${event.attendancePercentage ?? "Sin registrar"}</p>
      <p><strong>Nivel:</strong> ${event.attendanceLevel || "Sin clasificar"}</p>
      <p><strong>Puntos asignados:</strong> ${event.assignedPoints ?? "Sin asignar"}</p>
    `;

    const currentUser = getUser();
    const actionSection = document.getElementById("eventActionsSection");

    if (!currentUser || currentUser.role !== "Promotor" || currentUser.zone !== event.zone) {
      actionSection.style.display = "none";
    } else {
      actionSection.style.display = "";
    }
  } catch (error) {
    console.error("Error al cargar detalle del evento:", error);
    container.innerHTML = "<p>Error de conexión con el servidor.</p>";
  }
}

async function cancelEvent() {
  const id = new URLSearchParams(window.location.search).get("id");

  const confirmed = confirm("¿Deseas cancelar este evento?");
  if (!confirmed) {
    return showMessage("detailMessage", "La cancelación del evento fue anulada por el usuario", "warning");
  }

  try {
    const response = await fetch(`${API_BASE_URL}/events/cancel/${id}`, {
      method: "PUT",
      headers: authHeaders()
    });

    const { data, rawText } = await readResponse(response);

    if (!response.ok) {
      return showMessage(
        "detailMessage",
        data?.message || rawText || "No se pudo cancelar el evento",
        "error"
      );
    }

    showMessage(
      "detailMessage",
      data?.message || "El evento fue cancelado correctamente",
      "success"
    );

    loadEventDetail();
  } catch (error) {
    console.error("Error al cancelar evento:", error);
    showMessage("detailMessage", "Error de conexión con el servidor", "error");
  }
}

async function deleteEvent() {
  const id = new URLSearchParams(window.location.search).get("id");

  const confirmed = confirm("¿Deseas eliminar este evento? Esta acción no se puede deshacer.");
  if (!confirmed) {
    return showMessage("detailMessage", "La eliminación del evento fue cancelada por el usuario", "warning");
  }

  try {
    const response = await fetch(`${API_BASE_URL}/events/${id}`, {
      method: "DELETE",
      headers: authHeaders()
    });

    const { data, rawText } = await readResponse(response);

    if (!response.ok) {
      return showMessage(
        "detailMessage",
        data?.message || rawText || "No se pudo eliminar el evento",
        "error"
      );
    }

    showMessage(
      "detailMessage",
      data?.message || "El evento fue eliminado correctamente",
      "success"
    );

    setTimeout(() => {
      window.location.href = "eventos.html";
    }, 1200);
  } catch (error) {
    console.error("Error al eliminar evento:", error);
    showMessage("detailMessage", "Error de conexión con el servidor", "error");
  }
}

async function completeEvent() {
  const id = new URLSearchParams(window.location.search).get("id");

  const confirmed = confirm("¿Deseas marcar este evento como realizado?");
  if (!confirmed) {
    return showMessage("detailMessage", "La acción fue cancelada por el usuario", "warning");
  }

  try {
    const response = await fetch(`${API_BASE_URL}/events/complete/${id}`, {
      method: "PUT",
      headers: authHeaders()
    });

    const { data, rawText } = await readResponse(response);

    if (!response.ok) {
      return showMessage(
        "detailMessage",
        data?.message || rawText || "No se pudo marcar como realizado",
        "error"
      );
    }

    showMessage(
      "detailMessage",
      data?.message || "El evento fue marcado como realizado correctamente",
      "success"
    );
    loadEventDetail();
  } catch (error) {
    console.error("Error al marcar evento como realizado:", error);
    showMessage("detailMessage", "Error de conexión con el servidor", "error");
  }
}

async function registerAttendance(e) {
  e.preventDefault();
  const id = new URLSearchParams(window.location.search).get("id");
  const percentage = document.getElementById("attendancePercentage").value;

  const confirmed = confirm(`¿Deseas registrar ${percentage}% de participación para este evento?`);
  if (!confirmed) {
    return showMessage("detailMessage", "El registro de participación fue cancelado", "warning");
  }

  try {
    const response = await fetch(`${API_BASE_URL}/events/attendance/${id}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({
        attendancePercentage: percentage
      })
    });

    const { data, rawText } = await readResponse(response);

    if (!response.ok) {
      return showMessage(
        "detailMessage",
        data?.message || rawText || "No se pudo registrar la participación",
        "error"
      );
    }

    showMessage(
      "detailMessage",
      data?.message || "Participación registrada correctamente",
      "success"
    );
    loadEventDetail();
  } catch (error) {
    console.error("Error al registrar participación:", error);
    showMessage("detailMessage", "Error de conexión con el servidor", "error");
  }
}

async function confirmAttendance(e) {
  e.preventDefault();
  const id = new URLSearchParams(window.location.search).get("id");
  const level = document.getElementById("attendanceLevel").value;

  const confirmed = confirm(`¿Deseas confirmar la clasificación final como "${level}"?`);
  if (!confirmed) {
    return showMessage("detailMessage", "La confirmación de clasificación fue cancelada", "warning");
  }

  try {
    const response = await fetch(`${API_BASE_URL}/events/attendance/confirm/${id}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({
        attendanceLevel: level
      })
    });

    const { data, rawText } = await readResponse(response);

    if (!response.ok) {
      return showMessage(
        "detailMessage",
        data?.message || rawText || "No se pudo confirmar la clasificación",
        "error"
      );
    }

    showMessage(
      "detailMessage",
      data?.message || "Clasificación confirmada correctamente",
      "success"
    );
    loadEventDetail();
  } catch (error) {
    console.error("Error al confirmar clasificación:", error);
    showMessage("detailMessage", "Error de conexión con el servidor", "error");
  }
}

async function assignPoints(e) {
  e.preventDefault();
  const id = new URLSearchParams(window.location.search).get("id");
  const points = document.getElementById("assignedPoints").value;

  const confirmed = confirm(`¿Deseas asignar ${points} puntos a este evento?`);
  if (!confirmed) {
    return showMessage("detailMessage", "La asignación de puntos fue cancelada", "warning");
  }

  try {
    const response = await fetch(`${API_BASE_URL}/events/points/${id}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({
        assignedPoints: points
      })
    });

    const { data, rawText } = await readResponse(response);

    if (!response.ok) {
      return showMessage(
        "detailMessage",
        data?.message || rawText || "No se pudieron asignar los puntos",
        "error"
      );
    }

    showMessage(
      "detailMessage",
      data?.message || "Puntos asignados correctamente",
      "success"
    );
    loadEventDetail();
  } catch (error) {
    console.error("Error al asignar puntos:", error);
    showMessage("detailMessage", "Error de conexión con el servidor", "error");
  }
}