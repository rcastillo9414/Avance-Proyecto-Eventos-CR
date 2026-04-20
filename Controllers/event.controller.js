const Event = require("../Models/event");
const User = require("../Models/Usuario");
const AuditLog = require("../Models/Auditoria");

const getAttendanceLevel = (percentage) => {
  if (percentage >= 80) return "alta";
  if (percentage >= 60) return "moderada";
  if (percentage >= 40) return "regular";
  return "baja";
};

const canPromotorManageEvent = (user, event) => {
  return user.role === "Promotor" && user.zone === event.zone;
};

exports.createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      date,
      zone,
      placeName,
      address
    } = req.body;

    if (!title || !description || !date || !placeName) {
      return res.status(400).json({
        message: "Título, descripción, fecha y nombre del lugar son obligatorios"
      });
    }

    const finalZone = req.user.role === "Promotor"
      ? req.user.zone
      : (zone || "").trim();

    if (!finalZone) {
      return res.status(400).json({
        message: "La zona es obligatoria"
      });
    }

    if (req.user.role === "Promotor" && finalZone !== req.user.zone) {
      return res.status(403).json({
        message: "El promotor solo puede crear eventos en su propia zona"
      });
    }

    const eventDate = new Date(date);
    const now = new Date();

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

    const isPromotor = req.user.role === "Promotor";
    const sourceType = isPromotor ? "oficial" : "comunitaria";
    const status = isPromotor ? "publicado" : "por_verificar";

    const parsedCategory = category
      ? String(category).split(",").map((item) => item.trim()).filter(Boolean)
      : [];

    const imagePath = req.file ? `/uploads/${req.file.filename}` : "";

    const event = await Event.create({
      title: title.trim(),
      description: description.trim(),
      category: parsedCategory,
      date: eventDate,
      zone: finalZone,
      placeName: placeName.trim(),
      address: address ? address.trim() : "",
      sourceType,
      status,
      photoEvidence: imagePath,
      createdBy: req.user._id
    });

    await AuditLog.create({
      action: "CREATE_EVENT",
      entityType: "Event",
      entityId: event._id,
      performedBy: req.user._id,
      zone: event.zone,
      details: {
        title: event.title,
        status: event.status,
        sourceType: event.sourceType,
        photoEvidence: event.photoEvidence
      }
    });

    return res.status(201).json({
      message: "Evento creado correctamente",
      event
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const firstError = Object.values(error.errors)[0];
      return res.status(400).json({
        message: firstError.message
      });
    }

    return res.status(500).json({
      message: "Error al crear el evento",
      error: error.message
    });
  }
};

exports.getEvents = async (req, res) => {
  try {
    const { status, zone, sourceType, category, placeName } = req.query;

    const filters = {};

    if (status) filters.status = status;
    if (zone) filters.zone = zone;
    if (sourceType) filters.sourceType = sourceType;
    if (category) filters.category = { $in: [category] };
    if (placeName) filters.placeName = { $regex: placeName, $options: "i" };

    const events = await Event.find(filters)
      .populate("createdBy", "name email role zone points")
      .populate("validatedBy", "name email role")
      .populate("rejectedBy", "name email role")
      .populate("pointsAssignedBy", "name email role")
      .sort({ sourceType: 1, date: 1, createdAt: -1 });

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

exports.getMyEvents = async (req, res) => {
  try {
    const events = await Event.find({ createdBy: req.user._id }).sort({ createdAt: -1 });

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
      address
    } = req.body;

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        message: "Evento no encontrado"
      });
    }

    if (!canPromotorManageEvent(req.user, event)) {
      return res.status(403).json({
        message: "Solo un promotor de la misma zona puede realizar esta acción"
      });
    }

    if (event.status === "cancelado") {
      return res.status(400).json({
        message: "No se puede editar un evento cancelado"
      });
    }

    const changes = {};

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

      changes.date = {
        previous: event.date,
        next: newDate
      };
      event.date = newDate;
    }

    if (zone !== undefined && zone.trim() !== req.user.zone) {
      return res.status(403).json({
        message: "El promotor no puede mover eventos fuera de su zona"
      });
    }

    if (title !== undefined) {
      changes.title = { previous: event.title, next: title.trim() };
      event.title = title.trim();
    }

    if (description !== undefined) {
      changes.description = { previous: event.description, next: description.trim() };
      event.description = description.trim();
    }

    if (category !== undefined) {
      const parsedCategory = String(category)
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      changes.category = { previous: event.category, next: parsedCategory };
      event.category = parsedCategory;
    }

    if (zone !== undefined) {
      changes.zone = { previous: event.zone, next: zone.trim() };
      event.zone = zone.trim();
    }

    if (placeName !== undefined) {
      changes.placeName = { previous: event.placeName, next: placeName.trim() };
      event.placeName = placeName.trim();
    }

    if (address !== undefined) {
      changes.address = { previous: event.address, next: address.trim() };
      event.address = address.trim();
    }

    if (req.file) {
      const imagePath = `/uploads/${req.file.filename}`;
      changes.photoEvidence = { previous: event.photoEvidence, next: imagePath };
      event.photoEvidence = imagePath;
    }

    await event.save();

    await AuditLog.create({
      action: "UPDATE_EVENT",
      entityType: "Event",
      entityId: event._id,
      performedBy: req.user._id,
      zone: event.zone,
      details: changes
    });

    return res.status(200).json({
      message: "Evento actualizado correctamente",
      event
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const firstError = Object.values(error.errors)[0];
      return res.status(400).json({
        message: firstError.message
      });
    }

    return res.status(500).json({
      message: "Error al actualizar el evento",
      error: error.message
    });
  }
};

exports.cancelEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        message: "Evento no encontrado"
      });
    }

    if (!canPromotorManageEvent(req.user, event)) {
      return res.status(403).json({
        message: "Solo un promotor de la misma zona puede realizar esta acción"
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

    const previousStatus = event.status;
    event.status = "cancelado";
    await event.save();

    await AuditLog.create({
      action: "CANCEL_EVENT",
      entityType: "Event",
      entityId: event._id,
      performedBy: req.user._id,
      zone: event.zone,
      details: {
        previousStatus,
        newStatus: event.status
      }
    });

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

exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        message: "Evento no encontrado"
      });
    }

    if (!canPromotorManageEvent(req.user, event)) {
      return res.status(403).json({
        message: "Solo un promotor de la misma zona puede realizar esta acción"
      });
    }

    if (event.status !== "por_verificar") {
      return res.status(400).json({
        message: "Solo se pueden eliminar eventos en estado por_verificar"
      });
    }

    await AuditLog.create({
      action: "DELETE_EVENT",
      entityType: "Event",
      entityId: event._id,
      performedBy: req.user._id,
      zone: event.zone,
      details: {
        deletedEvent: {
          title: event.title,
          status: event.status,
          photoEvidence: event.photoEvidence
        }
      }
    });

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

exports.markEventAsCompleted = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        message: "Evento no encontrado"
      });
    }

    if (!canPromotorManageEvent(req.user, event)) {
      return res.status(403).json({
        message: "Solo un promotor de la misma zona puede realizar esta acción"
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

    const previousStatus = event.status;
    event.status = "realizado";
    event.completedAt = now;

    await event.save();

    await AuditLog.create({
      action: "MARK_EVENT_COMPLETED",
      entityType: "Event",
      entityId: event._id,
      performedBy: req.user._id,
      zone: event.zone,
      details: {
        previousStatus,
        newStatus: event.status,
        completedAt: event.completedAt
      }
    });

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

    if (!canPromotorManageEvent(req.user, event)) {
      return res.status(403).json({
        message: "Solo un promotor de la misma zona puede realizar esta acción"
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

    const previousPercentage = event.attendancePercentage;
    const previousLevel = event.attendanceLevel;

    event.attendancePercentage = percentage;
    event.attendanceLevel = getAttendanceLevel(percentage);
    event.attendanceConfirmedByPromoter = false;

    await event.save();

    await AuditLog.create({
      action: "REGISTER_ATTENDANCE_PERCENTAGE",
      entityType: "Event",
      entityId: event._id,
      performedBy: req.user._id,
      zone: event.zone,
      details: {
        previousPercentage,
        newPercentage: event.attendancePercentage,
        previousLevel,
        newLevel: event.attendanceLevel
      }
    });

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

    if (!canPromotorManageEvent(req.user, event)) {
      return res.status(403).json({
        message: "Solo un promotor de la misma zona puede realizar esta acción"
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

    const previousLevel = event.attendanceLevel;

    event.attendanceLevel = attendanceLevel;
    event.attendanceConfirmedByPromoter = true;

    await event.save();

    await AuditLog.create({
      action: "CONFIRM_ATTENDANCE_LEVEL",
      entityType: "Event",
      entityId: event._id,
      performedBy: req.user._id,
      zone: event.zone,
      details: {
        previousLevel,
        newLevel: event.attendanceLevel
      }
    });

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

    if (!canPromotorManageEvent(req.user, event)) {
      return res.status(403).json({
        message: "Solo un promotor de la misma zona puede realizar esta acción"
      });
    }

    if (event.status !== "realizado") {
      return res.status(400).json({
        message: "Solo se pueden asignar puntos a eventos realizados"
      });
    }

    if (!event.attendanceConfirmedByPromoter) {
      return res.status(400).json({
        message: "Debes confirmar la clasificación final de asistencia antes de asignar puntos"
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

    if (event.sourceType === "comunitaria") {
      const creator = await User.findById(event.createdBy);

      if (creator) {
        creator.points += points;
        await creator.save();
      }
    }

    await AuditLog.create({
      action: "ASSIGN_EVENT_POINTS",
      entityType: "Event",
      entityId: event._id,
      performedBy: req.user._id,
      zone: event.zone,
      details: {
        assignedPoints: event.assignedPoints,
        assignedToCreator: event.sourceType === "comunitaria"
      }
    });

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