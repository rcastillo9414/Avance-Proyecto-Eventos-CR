requireAuth();

const user = getUser();

const getTrustLevel = (role) => {
  if (role === "Promotor") return 100;
  if (role === "Explorador") return 75;
  if (role === "Validador") return 50;
  return 0;
};

document.getElementById("welcomeText").textContent =
  `Hola ${user?.name || ""}. Rol actual: ${user?.role || "-"} | Zona: ${user?.zone || "-"}`;

document.getElementById("userRole").textContent = user?.role || "-";
document.getElementById("userZone").textContent = user?.zone || "-";
document.getElementById("userPoints").textContent = user?.points ?? 0;
document.getElementById("userTrust").textContent = `${getTrustLevel(user?.role)}%`;

const validationLink = document.getElementById("validationLink");
const usersLink = document.getElementById("usersLink");
const auditLink = document.getElementById("auditLink");

const validationCard = document.getElementById("validationCard");
const usersCard = document.getElementById("usersCard");
const auditCard = document.getElementById("auditCard");

if (user?.role !== "Validador") {
  if (validationLink) validationLink.style.display = "none";
  if (validationCard) validationCard.style.display = "none";
}

if (user?.role !== "Promotor") {
  if (usersLink) usersLink.style.display = "none";
  if (usersCard) usersCard.style.display = "none";
}

if (user?.role !== "Promotor" && user?.role !== "Validador") {
  if (auditLink) auditLink.style.display = "none";
  if (auditCard) auditCard.style.display = "none";
}

document.getElementById("logoutBtn").addEventListener("click", logout);

// mapa y eventos cercanos
let nearbyMap;
let userMarker;
let nearbyMarkersLayer;
let currentUserCoords = null;

function showNearbyMessage(text, type = "info") {
  const box = document.getElementById("nearbyEventsMessage");
  if (!box) return;

  box.classList.remove("d-none", "alert-info", "alert-success", "alert-danger", "alert-warning");
  box.classList.add("alert");

  if (type === "success") box.classList.add("alert-success");
  else if (type === "error") box.classList.add("alert-danger");
  else if (type === "warning") box.classList.add("alert-warning");
  else box.classList.add("alert-info");

  box.textContent = text;
}

function hideNearbyMessage() {
  const box = document.getElementById("nearbyEventsMessage");
  if (!box) return;
  box.classList.add("d-none");
  box.textContent = "";
}

function initNearbyMap() {
  if (nearbyMap) return;

  nearbyMap = L.map("nearbyMap").setView([9.9281, -84.0907], 11);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap"
  }).addTo(nearbyMap);

  nearbyMarkersLayer = L.layerGroup().addTo(nearbyMap);
}

function clearNearbyMarkers() {
  if (nearbyMarkersLayer) {
    nearbyMarkersLayer.clearLayers();
  }
}

function renderNearbyList(events) {
  const container = document.getElementById("nearbyEventsList");
  if (!container) return;

  if (!events.length) {
    container.innerHTML = `<p class="text-muted mb-0">No se encontraron eventos cercanos en el radio seleccionado.</p>`;
    return;
  }

  container.innerHTML = events.map((event) => `
    <div class="border rounded-4 p-3 bg-white">
      <h4 class="h6 fw-bold mb-1">${event.title}</h4>
      <p class="text-muted mb-2">${event.placeName}</p>
      <p class="mb-1"><strong>Estado:</strong> ${event.status}</p>
      <p class="mb-2"><strong>Fecha:</strong> ${formatDate(event.date)}</p>
      <a class="btn btn-sm btn-primary" href="detalle-eventos.html?id=${event._id}">
        Ver detalle
      </a>
    </div>
  `).join("");
}

function renderNearbyMap(events) {
  if (!nearbyMap) return;

  clearNearbyMarkers();

  if (currentUserCoords) {
    const { lat, lng } = currentUserCoords;

    userMarker = L.marker([lat, lng])
      .addTo(nearbyMarkersLayer)
      .bindPopup("Tu ubicación actual");
  }

  const bounds = [];

  if (currentUserCoords) {
    bounds.push([currentUserCoords.lat, currentUserCoords.lng]);
  }

  events.forEach((event) => {
    if (
      typeof event.latitude === "number" &&
      typeof event.longitude === "number" &&
      !Number.isNaN(event.latitude) &&
      !Number.isNaN(event.longitude)
    ) {
      const marker = L.marker([event.latitude, event.longitude]).addTo(nearbyMarkersLayer);

      marker.bindPopup(`
        <div style="min-width: 180px;">
          <strong>${event.title}</strong><br />
          ${event.placeName}<br />
          ${formatDate(event.date)}<br />
          <a href="detalle-eventos.html?id=${event._id}">Ver detalle</a>
        </div>
      `);

      bounds.push([event.latitude, event.longitude]);
    }
  });

  if (bounds.length) {
    nearbyMap.fitBounds(bounds, { padding: [30, 30] });
  }
}

async function loadNearbyEvents() {
  if (!currentUserCoords) {
    showNearbyMessage("Debes permitir la ubicación para ver eventos cercanos.", "warning");
    return;
  }

  hideNearbyMessage();

  const nearbyEventsList = document.getElementById("nearbyEventsList");
  if (nearbyEventsList) {
    nearbyEventsList.innerHTML = `<p class="text-muted mb-0">Cargando eventos cercanos...</p>`;
  }

  const radius = document.getElementById("nearbyRadius")?.value || "10000";

  try {
    const response = await fetch(
      `${API_BASE_URL}/events/nearby?lat=${currentUserCoords.lat}&lng=${currentUserCoords.lng}&radius=${radius}`,
      {
        headers: authHeaders()
      }
    );

    const rawText = await response.text();
    const data = rawText ? JSON.parse(rawText) : {};

    if (!response.ok) {
      showNearbyMessage(data.message || "No se pudieron cargar eventos cercanos.", "error");
      renderNearbyList([]);
      renderNearbyMap([]);
      return;
    }

    const events = data.events || [];
    renderNearbyList(events);
    renderNearbyMap(events);

    if (!events.length) {
      showNearbyMessage("No hay eventos cercanos en tu zona para ese radio.", "info");
    }
  } catch (error) {
    console.error("Error al cargar eventos cercanos:", error);
    showNearbyMessage("Error de conexión al cargar eventos cercanos.", "error");
    renderNearbyList([]);
    renderNearbyMap([]);
  }
}

function requestUserLocation() {
  if (!navigator.geolocation) {
    showNearbyMessage("Tu navegador no soporta geolocalización.", "warning");
    return;
  }

  showNearbyMessage("Solicitando ubicación para buscar eventos cercanos...", "info");

  navigator.geolocation.getCurrentPosition(
    (position) => {
      currentUserCoords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      hideNearbyMessage();
      loadNearbyEvents();
    },
    () => {
      showNearbyMessage("No se pudo obtener tu ubicación. Revisa los permisos del navegador.", "warning");
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000
    }
  );
}

initNearbyMap();
requestUserLocation();

document.getElementById("reloadNearbyBtn")?.addEventListener("click", () => {
  if (!currentUserCoords) {
    requestUserLocation();
    return;
  }
  loadNearbyEvents();
});

document.getElementById("nearbyRadius")?.addEventListener("change", () => {
  if (currentUserCoords) {
    loadNearbyEvents();
  }
});