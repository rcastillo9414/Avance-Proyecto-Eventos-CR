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

    category: {
      type: [String],
      default: []
    },

    date: {
      type: Date,
      required: [true, "La fecha del evento es obligatoria"]
    },

    zone: {
      type: String,
      required: [true, "La zona es obligatoria"],
      trim: true,
      maxlength: [100, "La zona no puede superar los 100 caracteres"]
    },

    placeName: {
      type: String,
      required: [true, "El nombre del lugar es obligatorio"],
      trim: true,
      minlength: [3, "El nombre del lugar debe tener al menos 3 caracteres"],
      maxlength: [150, "El nombre del lugar no puede superar los 150 caracteres"]
    },

    address: {
      type: String,
      default: "",
      trim: true,
      maxlength: [250, "La dirección no puede superar los 250 caracteres"]
    },

    // Ubicación geoespacial interna generada en  backend
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point"
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0]
      }
    },

    // Indica si se logró geocodificar correctamente
    geocoded: {
      type: Boolean,
      default: false
    },

    sourceType: {
      type: String,
      enum: {
        values: ["oficial", "comunitaria"],
        message: "El tipo de fuente no es válido"
      },
      default: "comunitaria"
    },

    status: {
      type: String,
      enum: {
        values: ["publicado", "por_verificar", "cancelado", "realizado", "rechazado"],
        message: "El estado del evento no es válido"
      },
      default: "por_verificar"
    },

    photoEvidence: {
      type: String,
      default: "",
      trim: true
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "El usuario creador es obligatorio"]
    },

    validatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    rejectionReason: {
      type: String,
      default: "",
      trim: true,
      maxlength: [300, "La razón del rechazo no puede superar los 300 caracteres"]
    },

    duplicateOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      default: null
    },

    attendancePercentage: {
      type: Number,
      min: [0, "El porcentaje no puede ser menor a 0"],
      max: [100, "El porcentaje no puede ser mayor a 100"],
      default: null
    },

    attendanceLevel: {
      type: String,
      enum: {
        values: ["alta", "moderada", "regular", "baja", null],
        message: "El nivel de participación no es válido"
      },
      default: null
    },

    attendanceConfirmedByPromoter: {
      type: Boolean,
      default: false
    },

    assignedPoints: {
      type: Number,
      min: [1, "Los puntos mínimos son 1"],
      max: [10, "Los puntos máximos son 10"],
      default: null
    },

    pointsAssignedAt: {
      type: Date,
      default: null
    },

    pointsAssignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    completedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Indice geoespacial para búsquedas cercanas
eventSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Event", eventSchema);