requireAuth();

document.getElementById("logoutBtn").addEventListener("click", logout);
document.getElementById("createItineraryForm").addEventListener("submit", createItinerary);

loadAvailableEvents();
loadItineraries();

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

async function loadAvailableEvents() {
  const container = document.getElementById("availableEventsList");
  container.innerHTML = `<p class="mb-0 text-muted">Cargando eventos disponibles...</p>`;

  try {
    const response = await fetch(`${API_BASE_URL}/events?status=publicado`, {
      headers: authHeaders()
    });

    const { data, rawText } = await readResponse(response);

    if (!response.ok || !data?.events || data.events.length === 0) {
      container.innerHTML = `<p class="mb-0 text-muted">${data?.message || rawText || "No hay eventos disponibles para agregar."}</p>`;
      return;
    }

    container.innerHTML = data.events.map((event) => `
      <div class="form-check mb-3 border rounded-3 p-3">
        <input
          class="form-check-input itinerary-event-checkbox"
          type="checkbox"
          value="${event._id}"
          id="event-${event._id}"
        />
        <label class="form-check-label w-100" for="event-${event._id}">
          <strong>${event.title}</strong><br />
          <span class="text-muted">${event.placeName} - ${formatDate(event.date)}</span><br />
          <small>Zona: ${event.zone}</small>
        </label>
      </div>
    `).join("");
  } catch (error) {
    console.error("Error al cargar eventos disponibles:", error);
    container.innerHTML = `<p class="mb-0 text-danger">Error de conexión con el servidor.</p>`;
  }
}

async function createItinerary(e) {
  e.preventDefault();
  hideMessage("itineraryMessage");

  const title = document.getElementById("itineraryTitle").value.trim();
  const date = document.getElementById("itineraryDate").value;

  const selectedEvents = Array.from(
    document.querySelectorAll(".itinerary-event-checkbox:checked")
  ).map((checkbox) => checkbox.value);

  if (!title || !date) {
    return showMessage("itineraryMessage", "El título y la fecha son obligatorios", "error");
  }

  if (!selectedEvents.length) {
    return showMessage("itineraryMessage", "Debes seleccionar al menos un evento", "error");
  }

  try {
    const response = await fetch(`${API_BASE_URL}/itineraries`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        title,
        date,
        events: selectedEvents
      })
    });

    const { data, rawText } = await readResponse(response);

    if (!response.ok) {
      return showMessage(
        "itineraryMessage",
        data?.message || rawText || "No se pudo crear el itinerario",
        "error"
      );
    }

    showMessage("itineraryMessage", data?.message || "Itinerario creado correctamente", "success");
    document.getElementById("createItineraryForm").reset();

    document
      .querySelectorAll(".itinerary-event-checkbox")
      .forEach((checkbox) => {
        checkbox.checked = false;
      });

    loadItineraries();
  } catch (error) {
    console.error("Error al crear itinerario:", error);
    showMessage("itineraryMessage", "Error de conexión con el servidor", "error");
  }
}

async function loadItineraries() {
  const list = document.getElementById("itinerariesList");
  list.innerHTML = "<p>Cargando itinerarios...</p>";

  try {
    const response = await fetch(`${API_BASE_URL}/itineraries/mine`, {
      headers: authHeaders()
    });

    const { data, rawText } = await readResponse(response);

    if (!response.ok || !data?.itineraries?.length) {
      list.innerHTML = `<p>${data?.message || rawText || "No tienes itinerarios creados."}</p>`;
      return;
    }

    list.innerHTML = data.itineraries.map(itinerary => `
      <div class="col-12 col-lg-6">
        <article class="card border-0 shadow-sm rounded-4 h-100">
          <div class="card-body">
            <h3 class="h5 fw-bold">${itinerary.title}</h3>
            <p><strong>Fecha:</strong> ${formatDate(itinerary.date)}</p>
            <h4 class="h6 mt-3">Eventos</h4>
            <ul class="list-group list-group-flush">
              ${(itinerary.events || [])
                .sort((a, b) => a.order - b.order)
                .map(item => `
                  <li class="list-group-item px-0">
                    <strong>#${item.order}</strong> ${item.event?.title || "Evento"}
                    <br />
                    <small>${item.event?.placeName || ""} - ${formatDate(item.event?.date)}</small>
                  </li>
                `).join("")}
            </ul>
            <div class="d-grid mt-3">
              <button class="btn btn-danger" onclick="deleteItinerary('${itinerary._id}')">
                Eliminar
              </button>
            </div>
          </div>
        </article>
      </div>
    `).join("");
  } catch (error) {
    console.error("Error al cargar itinerarios:", error);
    list.innerHTML = "<p>Error de conexión con el servidor.</p>";
  }
}

async function deleteItinerary(id) {
  if (!confirm("¿Deseas eliminar este itinerario?")) return;

  try {
    const response = await fetch(`${API_BASE_URL}/itineraries/${id}`, {
      method: "DELETE",
      headers: authHeaders()
    });

    const { data, rawText } = await readResponse(response);

    if (!response.ok) {
      return showMessage(
        "itineraryMessage",
        data?.message || rawText || "No se pudo eliminar el itinerario",
        "error"
      );
    }

    showMessage("itineraryMessage", data?.message || "Itinerario eliminado correctamente", "success");
    loadItineraries();
  } catch (error) {
    console.error("Error al eliminar itinerario:", error);
    showMessage("itineraryMessage", "Error de conexión con el servidor", "error");
  }
}