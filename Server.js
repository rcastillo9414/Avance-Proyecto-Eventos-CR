require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");

const authRoutes = require("./Rutas/auth.routes");
const eventRoutes = require("./Rutas/event.routes");
const itineraryRoutes = require("./Rutas/intinerario.routes");
const moderationRoutes = require("./Rutas/moderation.routes");
const userRoutes = require("./Rutas/user.routes");
const auditRoutes = require("./Rutas/auditoria-routes");

const auth = require("./Middleware/auth");
const role = require("./Middleware/role");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

// Servir imágenes subidas
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.json({
    message: "API de Eventos Locales funcionando correctamente"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/itineraries", itineraryRoutes);
app.use("/api/moderation", moderationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/audit", auditRoutes);

// Ruta privada de prueba
app.get("/api/private", auth, (req, res) => {
  res.json({
    message: "Ruta privada accesible",
    user: req.user
  });
});

// Ruta protegida solo para Validador
app.get("/api/moderador", auth, role("Validador"), (req, res) => {
  res.json({
    message: "Bienvenido validador"
  });
});

const PORT = process.env.PORT || 5500;

app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en el puerto ${PORT}`);
});