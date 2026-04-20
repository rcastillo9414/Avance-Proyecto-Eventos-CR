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

if (currentPage === "eventos.html") {
  requireAuth();

  const currentUser = getUser();
  const zoneInput = document.getElementById("zone");

  if (currentUser?.role === "Promotor" && zoneInput) {
    zoneInput.value = currentUser.zone || "";
    zoneInput.readOnly = true;
  }

  loadEvents();

  document.getElementById("createEventForm").addEventListener("submit", createEvent);
  document.getElementById("filterEventsForm").addEventListener("submit", filterEvents);
  document.getElementById("loadAllBtn").addEventListener("click", () => loadEvents());
}

if (currentPage === "detalle-eventos.html") {
  requireAuth();
  loadEventDetail();

  document.getElementById("completeEventBtn").addEventListener("click", completeEvent);
  document.getElementById("attendanceForm").addEventListener("submit", registerAttendance);
  document.getElementById("confirmAttendanceForm").addEventListener("submit", confirmAttendance);
  document.getElementById("pointsForm").addEventListener("submit", assignPoints);
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

  if (title.length < 3) {
    return showMessage("eventsMessage", "El título debe tener al menos 3 caracteres", "error");
  }

  if (description.length < 10) {
    return showMessage("eventsMessage", "La descripción debe tener al menos 10 caracteres", "error");
  }

  if (placeName.length < 3) {
    return showMessage("eventsMessage", "El nombre del lugar debe tener al menos 3 caracteres", "error");
  }

  const formData = new FormData();
  formData.append("title", title);
  formData.append("description", description);
  formData.append("category", category);
  formData.append("date", rawDate ? new Date(rawDate).toISOString() : "");
  formData.append("zone", zone);
  formData.append("placeName", placeName);
  formData.append("address", address);

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

    showMessage(
      "eventsMessage",
      data?.message || "Evento creado correctamente",
      "success"
    );

    document.getElementById("createEventForm").reset();

    const currentUser = getUser();
    const zoneInput = document.getElementById("zone");
    if (currentUser?.role === "Promotor" && zoneInput) {
      zoneInput.value = currentUser.zone || "";
      zoneInput.readOnly = true;
    }

    loadEvents();
  } catch (error) {
    console.error("Error al crear evento:", error);
    showMessage("eventsMessage", "Error de conexión con el servidor", "error");
  }
}

async function loadEvents(query = "") {
  const list = document.getElementById("eventsList");
  list.innerHTML = `<div class="col-12"><p>Cargando eventos...</p></div>`;

  try {
    const response = await fetch(`${API_BASE_URL}/events${query}`);
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
                : ""
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
    const response = await fetch(`${API_BASE_URL}/events/${id}`);
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

async function completeEvent() {
  const id = new URLSearchParams(window.location.search).get("id");

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

    showMessage("detailMessage", data?.message || "Evento actualizado", "success");
    loadEventDetail();
  } catch (error) {
    console.error("Error al marcar evento como realizado:", error);
    showMessage("detailMessage", "Error de conexión con el servidor", "error");
  }
}

async function registerAttendance(e) {
  e.preventDefault();
  const id = new URLSearchParams(window.location.search).get("id");

  try {
    const response = await fetch(`${API_BASE_URL}/events/attendance/${id}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({
        attendancePercentage: document.getElementById("attendancePercentage").value
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

    showMessage("detailMessage", data?.message || "Participación registrada", "success");
    loadEventDetail();
  } catch (error) {
    console.error("Error al registrar participación:", error);
    showMessage("detailMessage", "Error de conexión con el servidor", "error");
  }
}

async function confirmAttendance(e) {
  e.preventDefault();
  const id = new URLSearchParams(window.location.search).get("id");

  try {
    const response = await fetch(`${API_BASE_URL}/events/attendance/confirm/${id}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({
        attendanceLevel: document.getElementById("attendanceLevel").value
      })
    });

    const { data, rawText } = await readResponse(response);

    if (!response.ok) {
      return showMessage(
        "detailMessage",
        data?.message || rawText || "No se pudo confirmar la participación",
        "error"
      );
    }

    showMessage("detailMessage", data?.message || "Participación confirmada", "success");
    loadEventDetail();
  } catch (error) {
    console.error("Error al confirmar participación:", error);
    showMessage("detailMessage", "Error de conexión con el servidor", "error");
  }
}

async function assignPoints(e) {
  e.preventDefault();
  const id = new URLSearchParams(window.location.search).get("id");

  try {
    const response = await fetch(`${API_BASE_URL}/events/points/${id}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({
        assignedPoints: document.getElementById("assignedPoints").value
      })
    });

    const { data, rawText } = await readResponse(response);

    if (!response.ok) {
      return showMessage(
        "detailMessage",
        data?.message || rawText || "No se pudieron asignar puntos",
        "error"
      );
    }

    showMessage("detailMessage", data?.message || "Puntos asignados", "success");
    loadEventDetail();
  } catch (error) {
    console.error("Error al asignar puntos:", error);
    showMessage("detailMessage", "Error de conexión con el servidor", "error");
  }
}