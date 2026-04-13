require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const authRoutes = require("./routes/auth.routes");
const eventRoutes = require("./routes/event.routes");
const moderationRoutes = require("./routes/moderation.routes");

const auth = require("./Middleware/auth");
const role = require("./Middleware/role");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "API de Eventos Locales funcionando correctamente"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/moderation", moderationRoutes);

// Ruta privada de prueba
app.get("/api/private", auth, (req, res) => {
  res.json({
    message: "Ruta privada accesible",
    user: req.user
  });
});

// Ruta protegida solo para moderador
app.get("/api/moderador", auth, role("moderador"), (req, res) => {
  res.json({
    message: "Bienvenido moderador"
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en el puerto ${PORT}`);
});