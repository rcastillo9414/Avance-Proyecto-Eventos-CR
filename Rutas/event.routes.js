const express = require("express");
const router = express.Router();

const auth = require("../Middleware/auth");
const role = require("../Middleware/role");

const {
  createEvent,
  getEvents,
  getEventById,
  getMyEvents,
  updateEvent,
  cancelEvent,
  deleteEvent,
  markEventAsCompleted,
  registerAttendancePercentage,
  confirmAttendanceLevel,
  assignEventPoints
} = require("../Controllers/event.controller");

// Crear evento
router.post("/", auth, role("promotor", "explorador", "moderador"), createEvent);

// Listar eventos
router.get("/", getEvents);

// Obtener mis eventos
router.get("/mine", auth, getMyEvents);

// Marcar evento como realizado
router.put("/complete/:id", auth, markEventAsCompleted);

// Registrar porcentaje de participación
router.put("/attendance/:id", auth, registerAttendancePercentage);

// Confirmar nivel final de participación
router.put("/attendance/confirm/:id", auth, confirmAttendanceLevel);

// Asignar puntos al evento
router.put("/points/:id", auth, assignEventPoints);

// Obtener evento por ID
router.get("/:id", getEventById);

// Editar evento
router.put("/:id", auth, updateEvent);

// Cancelar evento
router.put("/cancel/:id", auth, cancelEvent);

// Eliminar evento
router.delete("/:id", auth, deleteEvent);

module.exports = router;