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
const validationCard = document.getElementById("validationCard");
const usersCard = document.getElementById("usersCard");

if (user?.role !== "Validador") {
  validationLink.style.display = "none";
  validationCard.style.display = "none";
}

if (user?.role !== "Promotor") {
  usersLink.style.display = "none";
  usersCard.style.display = "none";
}

document.getElementById("logoutBtn").addEventListener("click", logout);