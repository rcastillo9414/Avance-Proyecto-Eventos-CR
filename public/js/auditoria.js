requireAuth();

const user = getUser();

if (user?.role !== "Promotor" && user?.role !== "Validador") {
  alert("Acceso restringido a Promotores y Validadores");
  window.location.href = "dashboard.html";
}

document.getElementById("logoutBtn").addEventListener("click", logout);
document.getElementById("auditFiltersForm").addEventListener("submit", handleAuditFilters);
document.getElementById("reloadAuditBtn").addEventListener("click", () => loadAuditLogs());

const validationLink = document.getElementById("validationLink");
const usersLink = document.getElementById("usersLink");

if (user?.role !== "Validador" && validationLink) {
  validationLink.style.display = "none";
}

if (user?.role !== "Promotor" && usersLink) {
  usersLink.style.display = "none";
}

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

function showAuditMessage(text, type = "info") {
  const box = document.getElementById("auditMessage");
  if (!box) return;

  box.classList.remove("d-none", "alert-info", "alert-success", "alert-danger", "alert-warning");
  box.classList.add("alert");

  if (type === "success") box.classList.add("alert-success");
  else if (type === "error") box.classList.add("alert-danger");
  else if (type === "warning") box.classList.add("alert-warning");
  else box.classList.add("alert-info");

  box.textContent = text;
}

function hideAuditMessage() {
  const box = document.getElementById("auditMessage");
  if (!box) return;
  box.classList.add("d-none");
  box.textContent = "";
}

function formatAuditDetails(details) {
  if (!details || typeof details !== "object") {
    return "Sin detalles";
  }

  return Object.entries(details)
    .map(([key, value]) => {
      const renderedValue =
        typeof value === "object" && value !== null
          ? JSON.stringify(value)
          : String(value);
      return `<li><strong>${key}:</strong> ${renderedValue}</li>`;
    })
    .join("");
}

function renderAuditList(logs) {
  const container = document.getElementById("auditList");
  const count = document.getElementById("auditCount");

  if (!container || !count) return;

  count.textContent = `${logs.length} resultado(s)`;

  if (!logs.length) {
    container.innerHTML = `<p class="text-muted mb-0">No se encontraron registros de auditoría.</p>`;
    return;
  }

  container.innerHTML = logs.map((log) => `
    <article class="card border-0 shadow-sm rounded-4">
      <div class="card-body p-4">
        <div class="d-flex flex-column flex-lg-row justify-content-between gap-2 mb-3">
          <div>
            <h3 class="h5 fw-bold mb-1">${log.action}</h3>
            <p class="text-muted mb-0">Entidad: ${log.entityType}</p>
          </div>
          <div class="text-lg-end">
            <span class="badge text-bg-primary">${log.zone || "Sin zona"}</span>
            <p class="text-muted mb-0 mt-2">${formatDate(log.createdAt)}</p>
          </div>
        </div>

        <p class="mb-1"><strong>Realizado por:</strong> ${log.performedBy?.name || "Usuario"} (${log.performedBy?.role || "-"})</p>
        <p class="mb-3"><strong>Correo:</strong> ${log.performedBy?.email || "-"}</p>

        <div>
          <h4 class="h6 fw-bold">Detalles</h4>
          <ul class="mb-0">
            ${formatAuditDetails(log.details)}
          </ul>
        </div>
      </div>
    </article>
  `).join("");
}

async function loadAuditLogs(query = "") {
  const container = document.getElementById("auditList");
  if (container) {
    container.innerHTML = `<p class="text-muted mb-0">Cargando auditoría...</p>`;
  }

  hideAuditMessage();

  try {
    const response = await fetch(`${API_BASE_URL}/audit${query}`, {
      headers: authHeaders()
    });

    const { data, rawText } = await readResponse(response);

    if (!response.ok) {
      renderAuditList([]);
      return showAuditMessage(
        data?.message || rawText || "No se pudo cargar la auditoría",
        "error"
      );
    }

    renderAuditList(data.logs || []);
  } catch (error) {
    renderAuditList([]);
    showAuditMessage("Error de conexión con el servidor", "error");
  }
}

function handleAuditFilters(e) {
  e.preventDefault();

  const params = new URLSearchParams();

  const action = document.getElementById("filterAction").value.trim();
  const entityType = document.getElementById("filterEntityType").value;
  const limit = document.getElementById("filterLimit").value;

  if (action) params.append("action", action);
  if (entityType) params.append("entityType", entityType);
  if (limit) params.append("limit", limit);

  const query = params.toString() ? `?${params.toString()}` : "";
  loadAuditLogs(query);
}

loadAuditLogs();