const Event = require("../Models/event");
const User = require("../Models/Usuario");

const getAttendanceLevel = (percentage) => {
  if (percentage >= 80) return "alta";
  if (percentage >= 60) return "moderada";
  if (percentage >= 40) return "regular";
  return "baja";
};

/* * Crear evento
 * - Si lo crea un promotor => fuente oficial + publicado
 * - Si lo crea un explorador => fuente comunitaria + por_verificar*/
exports.createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      date,
      zone,
      placeName,
      address,
      photoEvidence
    } = req.body;

    // Validación de campos obligatorios
    if (!title || !description || !date || !zone || !placeName) {
      return res.status(400).json({
        message: "Título, descripción, fecha, zona y nombre del lugar son obligatorios"
      });
    }

    const eventDate = new Date(date);
    const now = new Date();

    // Validar fecha
    if (isNaN(eventDate.getTime())) {
      return res.status(400).json({
        message: "La fecha del evento no es válida"
      });
    }

    if (eventDate <= now) {
      return res.status(400).json({
        message: "La fecha del evento debe ser futura"
      });
    }

    // Definir tipo de fuente y estado según rol
    const isPromotor = req.user.role === "promotor";

    const sourceType = isPromotor ? "oficial" : "comunitaria";
    const status = isPromotor ? "publicado" : "por_verificar";

    const event = await Event.create({
      title: title.trim(),
      description: description.trim(),
      category: Array.isArray(category) ? category : [],
      date: eventDate,
      zone: zone.trim(),
      placeName: placeName.trim(),
      address: address ? address.trim() : "",
      sourceType,
      status,
      photoEvidence: photoEvidence ? photoEvidence.trim() : "",
      createdBy: req.user._id
    });

    return res.status(201).json({
      message: "Evento creado correctamente",
      event
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al crear el evento",
      error: error.message
    });
  }
};

/** Listar todos los eventos
 * Puede filtrar por:
 * - status
 * - zone
 * - sourceType
 * - category
 * - placeName  */
exports.getEvents = async (req, res) => {
  try {
    const { status, zone, sourceType, category, placeName } = req.query;

    const filters = {};

    if (status) filters.status = status;
    if (zone) filters.zone = zone;
    if (sourceType) filters.sourceType = sourceType;
    if (category) filters.category = { $in: [category] };

    // Búsqueda parcial por nombre del lugar
    if (placeName) {
      filters.placeName = { $regex: placeName, $options: "i" };
    }

    const events = await Event.find(filters)
      .populate("createdBy", "name email role zone points")
      .populate("validatedBy", "name email role")
      .populate("rejectedBy", "name email role")
      .populate("pointsAssignedBy", "name email role")
      .sort({ date: 1 });

    return res.status(200).json({
      total: events.length,
      events
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al listar eventos",
      error: error.message
    });
  }
};

/** * Obtener detalle de un evento por ID */
exports.getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id)
      .populate("createdBy", "name email role zone points")
      .populate("validatedBy", "name email role")
      .populate("rejectedBy", "name email role")
      .populate("pointsAssignedBy", "name email role");

    if (!event) {
      return res.status(404).json({
        message: "Evento no encontrado"
      });
    }

    return res.status(200).json(event);
  } catch (error) {
    return res.status(500).json({
      message: "Error al obtener el evento",
      error: error.message
    });
  }
};

/** * Obtener eventos creados por el usuario autenticado*/
exports.getMyEvents = async (req, res) => {
  try {
    const events = await Event.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      total: events.length,
      events
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al obtener tus eventos",
      error: error.message
    });
  }
};

/*** Editar evento
 * Regla:
 * - Solo puede editar el creador del evento o un moderador
 * - No se permite editar si está cancelado */
exports.updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      category,
      date,
      zone,
      placeName,
      address,
      photoEvidence
    } = req.body;

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        message: "Evento no encontrado"
      });
    }

    const isOwner = String(event.createdBy) === String(req.user._id);
    const isModerator = req.user.role === "moderador";

    if (!isOwner && !isModerator) {
      return res.status(403).json({
        message: "No tienes permisos para editar este evento"
      });
    }

    if (event.status === "cancelado") {
      return res.status(400).json({
        message: "No se puede editar un evento cancelado"
      });
    }

    // Si se quiere cambiar la fecha, se valida
    if (date !== undefined) {
      const newDate = new Date(date);

      if (isNaN(newDate.getTime())) {
        return res.status(400).json({
          message: "La nueva fecha no es válida"
        });
      }

      if (newDate <= new Date()) {
        return res.status(400).json({
          message: "La nueva fecha debe ser futura"
        });
      }

      event.date = newDate;
    }

    // Actualización parcial de campos
    if (title !== undefined) event.title = title.trim();
    if (description !== undefined) event.description = description.trim();
    if (category !== undefined) event.category = Array.isArray(category) ? category : [];
    if (zone !== undefined) event.zone = zone.trim();
    if (placeName !== undefined) event.placeName = placeName.trim();
    if (address !== undefined) event.address = address.trim();
    if (photoEvidence !== undefined) event.photoEvidence = photoEvidence.trim();

    await event.save();

    return res.status(200).json({
      message: "Evento actualizado correctamente",
      event
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al actualizar el evento",
      error: error.message
    });
  }
};

/**  Cancelar evento
 * Regla:
 * - Solo creador o moderador
 * - Solo si faltan 63 horas o más*/
exports.cancelEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        message: "Evento no encontrado"
      });
    }

    const isOwner = String(event.createdBy) === String(req.user._id);
    const isModerator = req.user.role === "moderador";

    if (!isOwner && !isModerator) {
      return res.status(403).json({
        message: "No tienes permisos para cancelar este evento"
      });
    }

    if (event.status === "cancelado") {
      return res.status(400).json({
        message: "El evento ya se encuentra cancelado"
      });
    }

    const now = new Date();
    const eventDate = new Date(event.date);
    const diffHours = (eventDate - now) / (1000 * 60 * 60);

    if (diffHours < 63) {
      return res.status(400).json({
        message: "Un evento solo se puede cancelar con al menos 63 horas de anticipación"
      });
    }

    event.status = "cancelado";
    await event.save();

    return res.status(200).json({
      message: "Evento cancelado correctamente",
      event
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al cancelar el evento",
      error: error.message
    });
  }
};

/** Eliminar evento
 * Regla:
 * - Solo moderador o creador
 * - Solo si está en estado por_verificar */
exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        message: "Evento no encontrado"
      });
    }

    const isOwner = String(event.createdBy) === String(req.user._id);
    const isModerator = req.user.role === "moderador";

    if (!isOwner && !isModerator) {
      return res.status(403).json({
        message: "No tienes permisos para eliminar este evento"
      });
    }

    if (event.status !== "por_verificar") {
      return res.status(400).json({
        message: "Solo se pueden eliminar eventos en estado por_verificar"
      });
    }

    await Event.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Evento eliminado correctamente"
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al eliminar el evento",
      error: error.message
    });
  }
};

/** Marcar evento como realizado
 * Regla:
 * - Solo creador o moderador
 * - Solo si la fecha del evento ya pasó */
exports.markEventAsCompleted = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        message: "Evento no encontrado"
      });
    }

    const isOwner = String(event.createdBy) === String(req.user._id);
    const isModerator = req.user.role === "moderador";

    if (!isOwner && !isModerator) {
      return res.status(403).json({
        message: "No tienes permisos para marcar este evento como realizado"
      });
    }

    if (event.status === "cancelado") {
      return res.status(400).json({
        message: "No se puede marcar como realizado un evento cancelado"
      });
    }

    if (event.status === "realizado") {
      return res.status(400).json({
        message: "El evento ya fue marcado como realizado"
      });
    }

    const now = new Date();

    if (new Date(event.date) > now) {
      return res.status(400).json({
        message: "No se puede marcar como realizado antes de que termine el evento"
      });
    }

    event.status = "realizado";
    event.completedAt = now;

    await event.save();

    return res.status(200).json({
      message: "Evento marcado como realizado correctamente",
      event
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al marcar el evento como realizado",
      error: error.message
    });
  }
};

/** Registrar porcentaje de participación
 * Regla:
 * - Solo creador o moderador
 * - Solo en eventos realizados */
exports.registerAttendancePercentage = async (req, res) => {
  try {
    const { id } = req.params;
    const { attendancePercentage } = req.body;

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        message: "Evento no encontrado"
      });
    }

    const isOwner = String(event.createdBy) === String(req.user._id);
    const isModerator = req.user.role === "moderador";

    if (!isOwner && !isModerator) {
      return res.status(403).json({
        message: "No tienes permisos para registrar la participación"
      });
    }

    if (event.status !== "realizado") {
      return res.status(400).json({
        message: "Solo se puede registrar participación en eventos realizados"
      });
    }

    const percentage = Number(attendancePercentage);

    if (Number.isNaN(percentage) || percentage < 0 || percentage > 100) {
      return res.status(400).json({
        message: "El porcentaje de participación debe estar entre 0 y 100"
      });
    }

    event.attendancePercentage = percentage;
    event.attendanceLevel = getAttendanceLevel(percentage);
    event.attendanceConfirmedByPromoter = false;

    await event.save();

    return res.status(200).json({
      message: "Porcentaje de participación registrado correctamente",
      event
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al registrar la participación",
      error: error.message
    });
  }
};

/** Confirmar nivel final de participación
 * Regla:
 * - Solo creador o moderador
 * - Solo en eventos realizados */
exports.confirmAttendanceLevel = async (req, res) => {
  try {
    const { id } = req.params;
    const { attendanceLevel } = req.body;

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        message: "Evento no encontrado"
      });
    }

    const isOwner = String(event.createdBy) === String(req.user._id);
    const isModerator = req.user.role === "moderador";

    if (!isOwner && !isModerator) {
      return res.status(403).json({
        message: "No tienes permisos para confirmar la participación"
      });
    }

    if (event.status !== "realizado") {
      return res.status(400).json({
        message: "Solo se puede confirmar participación en eventos realizados"
      });
    }

    const validLevels = ["alta", "moderada", "regular", "baja"];

    if (!validLevels.includes(attendanceLevel)) {
      return res.status(400).json({
        message: "El nivel de participación no es válido"
      });
    }

    event.attendanceLevel = attendanceLevel;
    event.attendanceConfirmedByPromoter = true;

    await event.save();

    return res.status(200).json({
      message: "Nivel de participación confirmado correctamente",
      event
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al confirmar el nivel de participación",
      error: error.message
    });
  }
};

/** Asignar puntos al evento
 * Regla:
 * - Solo creador o moderador
 * - Solo en eventos realizados
 * - Solo una vez */
exports.assignEventPoints = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedPoints } = req.body;

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        message: "Evento no encontrado"
      });
    }

    const isOwner = String(event.createdBy) === String(req.user._id);
    const isModerator = req.user.role === "moderador";

    if (!isOwner && !isModerator) {
      return res.status(403).json({
        message: "No tienes permisos para asignar puntos"
      });
    }

    if (event.status !== "realizado") {
      return res.status(400).json({
        message: "Solo se pueden asignar puntos a eventos realizados"
      });
    }

    if (event.assignedPoints !== null) {
      return res.status(400).json({
        message: "Los puntos ya fueron asignados a este evento"
      });
    }

    const points = Number(assignedPoints);

    if (Number.isNaN(points) || points < 1 || points > 10) {
      return res.status(400).json({
        message: "Los puntos deben ser un número entre 1 y 10"
      });
    }

    event.assignedPoints = points;
    event.pointsAssignedAt = new Date();
    event.pointsAssignedBy = req.user._id;

    await event.save();

    // Si el evento fue comunitario, se asignan los puntos al creador
    if (event.sourceType === "comunitaria") {
      const creator = await User.findById(event.createdBy);

      if (creator) {
        creator.points += points;
        await creator.save();
      }
    }

    return res.status(200).json({
      message: "Puntos asignados correctamente",
      event
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al asignar puntos al evento",
      error: error.message
    });
  }
};