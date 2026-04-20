const express = require("express");
const router = express.Router();

const auth = require("../Middleware/auth");

const {
  createItinerary,
  getMyItineraries,
  getItineraryById,
  addEventToItinerary,
  removeEventFromItinerary,
  reorderItineraryEvents,
  updateItinerary,
  deleteItinerary
} = require("../Controllers/intinerario.controller");

// Crear itinerario
router.post("/", auth, createItinerary);

// Obtener todos mis itinerarios
router.get("/mine", auth, getMyItineraries);

// Obtener un itinerario por ID
router.get("/:id", auth, getItineraryById);

// Agregar un evento al itinerario
router.put("/:id/add-event", auth, addEventToItinerary);

// Eliminar un evento del itinerario
router.put("/:id/remove-event", auth, removeEventFromItinerary);

// Reordenar eventos del itinerario
router.put("/:id/reorder", auth, reorderItineraryEvents);

// Actualizar título o fecha del itinerario
router.put("/:id", auth, updateItinerary);

// Eliminar itinerario
router.delete("/:id", auth, deleteItinerary);

module.exports = router;