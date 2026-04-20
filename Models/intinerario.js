const mongoose = require("mongoose");

const itinerarySchema = new mongoose.Schema(
  {
    // Título del itinerario
    title: {
      type: String,
      required: [true, "El título del itinerario es obligatorio"],
      trim: true,
      minlength: [3, "El título debe tener al menos 3 caracteres"],
      maxlength: [120, "El título no puede superar los 120 caracteres"]
    },

    // Usuario dueño del itinerario
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "El usuario propietario es obligatorio"]
    },

    // Fecha principal del itinerario
    date: {
      type: Date,
      required: [true, "La fecha del itinerario es obligatoria"]
    },

    // Lista ordenada de eventos del itinerario
    events: [
      {
        event: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Event",
          required: true
        },
        order: {
          type: Number,
          required: true
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Itinerary", itinerarySchema);