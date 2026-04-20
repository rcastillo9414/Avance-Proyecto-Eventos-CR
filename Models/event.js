const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    // Título del evento
    title: {
      type: String,
      required: [true, "El título es obligatorio"],
      trim: true,
      minlength: [3, "El título debe tener al menos 3 caracteres"],
      maxlength: [120, "El título no puede superar los 120 caracteres"]
    },

    // Descripción general del evento
    description: {
      type: String,
      required: [true, "La descripción es obligatoria"],
      trim: true,
      minlength: [10, "La descripción debe tener al menos 10 caracteres"],
      maxlength: [1000, "La descripción no puede superar los 1000 caracteres"]
    },

    // Categorías del evento
    // Ejemplo: ["Cultura", "Artesanía", "AireLibre"]
    category: {
      type: [String],
      default: []
    },

    // Fecha y hora del evento
    date: {
      type: Date,
      required: [true, "La fecha del evento es obligatoria"]
    },

    // Zona general donde pertenece el evento
    zone: {
      type: String,
      required: [true, "La zona es obligatoria"],
      trim: true,
      maxlength: [100, "La zona no puede superar los 100 caracteres"]
    },

    // Nombre del pueblo, ciudad, local o punto de referencia principal
    // Ejemplo: "Parque Central de Naranjo"
    placeName: {
      type: String,
      required: [true, "El nombre del lugar es obligatorio"],
      trim: true,
      minlength: [3, "El nombre del lugar debe tener al menos 3 caracteres"],
      maxlength: [150, "El nombre del lugar no puede superar los 150 caracteres"]
    },

    // Dirección adicional opcional
    // Ejemplo: "Costado norte de la iglesia"
    address: {
      type: String,
      default: "",
      trim: true,
      maxlength: [250, "La dirección no puede superar los 250 caracteres"]
    },

    // Tipo de fuente del evento
    // oficial: creado por promotor
    // comunitaria: creado por explorador u otro usuario
    sourceType: {
      type: String,
      enum: {
        values: ["oficial", "comunitaria"],
        message: "El tipo de fuente no es válido"
      },
      default: "comunitaria"
    },

    // Estado actual del evento
    status: {
      type: String,
      enum: {
        values: ["publicado", "por_verificar", "cancelado", "realizado", "rechazado"],
        message: "El estado del evento no es válido"
      },
      default: "por_verificar"
    },

    // URL o ruta de la evidencia fotográfica
    photoEvidence: {
      type: String,
      default: "",
      trim: true
    },

    // Usuario que creó el evento
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "El usuario creador es obligatorio"]
    },

    // Usuario que validó el evento, si aplica
    validatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    // Usuario que rechazó el evento, si aplica
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    // Motivo del rechazo
    rejectionReason: {
      type: String,
      default: "",
      trim: true,
      maxlength: [300, "La razón del rechazo no puede superar los 300 caracteres"]
    },

    // Referencia al evento principal si este fue fusionado por duplicidad
    duplicateOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      default: null
    },

    // Porcentaje de participación final del evento
    attendancePercentage: {
      type: Number,
      min: [0, "El porcentaje no puede ser menor a 0"],
      max: [100, "El porcentaje no puede ser mayor a 100"],
      default: null
    },

    // Clasificación automática o final de participación
    attendanceLevel: {
      type: String,
      enum: {
        values: ["alta", "moderada", "regular", "baja", null],
        message: "El nivel de participación no es válido"
      },
      default: null
    },

    // Indica si el promotor confirmó manualmente la clasificación final
    attendanceConfirmedByPromoter: {
      type: Boolean,
      default: false
    },

    // Puntos asignados al evento cuando ya fue realizado
    assignedPoints: {
      type: Number,
      min: [1, "Los puntos mínimos son 1"],
      max: [10, "Los puntos máximos son 10"],
      default: null
    },

    // Fecha en que se marcaron los puntos
    pointsAssignedAt: {
      type: Date,
      default: null
    },

    // Usuario que asignó los puntos
    pointsAssignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    // Fecha en la que el evento fue marcado como realizado
    completedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Event", eventSchema);