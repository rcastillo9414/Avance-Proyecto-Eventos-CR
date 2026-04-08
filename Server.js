require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./Config/Mongodb");

const authRoutes = require("./Rutas/auth.routes");
const auth = require("./Middleware/auth");
const role = require("./Middleware/role");

const app = express();

// Conectar a MongoDB
connectDB();

// Middlewares globales
app.use(cors());
app.use(express.json());

// Ruta principal
app.get("/", (req, res) => {
  res.json({
    message: "API de Eventos Locales funcionando correctamente"
  });
});

// Rutas de autenticación
app.use("/api/auth", authRoutes);

// Ruta protegida de prueba
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

const PORT = process.env.PORT || 5500;

app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en el puerto ${PORT}`);
});