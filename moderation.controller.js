const Event = require("../Models/event");

/**
 * Obtener todos los eventos pendientes de validación
 * Solo moderadores
 */
exports.getPendingEvents = async (req, res) => {
  try {
    const events = await Event.find({
      status: "por_verificar",
      duplicateOf: null
    })
      .populate("createdBy", "name email role zone points")
      .sort({ createdAt: -1 });

    res.status(200).json({
      total: events.length,
      events
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener eventos pendientes",
      error: error.message
    });
  }
};

/**
 * Aprobar / validar un evento pendiente
 * El moderador puede ajustar categoría antes de publicarlo
 */
exports.approveEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { category } = req.body;

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        message: "Evento no encontrado"
      });
    }

    if (event.status !== "por_verificar") {
      return res.status(400).json({
        message: "Solo se pueden aprobar eventos en estado por_verificar"
      });
    }

    event.status = "publicado";
    event.validatedBy = req.user._id;
    event.rejectedBy = null;
    event.rejectionReason = "";

    if (category !== undefined) {
      event.category = Array.isArray(category) ? category : [];
    }

    await event.save();

    res.status(200).json({
      message: "Evento aprobado y publicado correctamente",
      event
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al aprobar el evento",
      error: error.message
    });
  }
};

/**
 * Rechazar evento pendiente
 */
exports.rejectEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        message: "Evento no encontrado"
      });
    }

    if (event.status !== "por_verificar") {
      return res.status(400).json({
        message: "Solo se pueden rechazar eventos en estado por_verificar"
      });
    }

    event.status = "rechazado";
    event.rejectedBy = req.user._id;
    event.rejectionReason = reason || "El evento no cumple con los criterios de validación";
    event.validatedBy = null;

    await event.save();

    res.status(200).json({
      message: "Evento rechazado correctamente",
      event
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al rechazar el evento",
      error: error.message
    });
  }
};

/**
 * Recategorizar un evento
 * Útil para corregir etiquetas y categorías
 */
exports.recategorizeEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { category } = req.body;

    if (!Array.isArray(category) || category.length === 0) {
      return res.status(400).json({
        message: "Debes enviar un arreglo de categorías válido"
      });
    }

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        message: "Evento no encontrado"
      });
    }

    event.category = category;
    await event.save();

    res.status(200).json({
      message: "Evento recategorizado correctamente",
      event
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al recategorizar el evento",
      error: error.message
    });
  }
};

/**
 * Fusionar eventos duplicados
 * Se conserva el evento principal y el duplicado queda referenciado
 */
exports.mergeDuplicateEvents = async (req, res) => {
  try {
    const { primaryEventId, duplicateEventId } = req.body;

    if (!primaryEventId || !duplicateEventId) {
      return res.status(400).json({
        message: "Debes enviar primaryEventId y duplicateEventId"
      });
    }

    if (primaryEventId === duplicateEventId) {
      return res.status(400).json({
        message: "No puedes fusionar un evento consigo mismo"
      });
    }

    const primaryEvent = await Event.findById(primaryEventId);
    const duplicateEvent = await Event.findById(duplicateEventId);

    if (!primaryEvent || !duplicateEvent) {
      return res.status(404).json({
        message: "Uno o ambos eventos no existen"
      });
    }

    if (duplicateEvent.duplicateOf) {
      return res.status(400).json({
        message: "El evento duplicado ya fue fusionado anteriormente"
      });
    }

    duplicateEvent.duplicateOf = primaryEvent._id;
    duplicateEvent.status = "cancelado";
    duplicateEvent.rejectionReason = "Evento fusionado por duplicidad";
    duplicateEvent.rejectedBy = req.user._id;

    await duplicateEvent.save();

    res.status(200).json({
      message: "Eventos fusionados correctamente",
      primaryEvent,
      duplicateEvent
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al fusionar eventos",
      error: error.message
    });
  }
};

/**
 * Obtener eventos rechazados
 * Solo moderadores
 */
exports.getRejectedEvents = async (req, res) => {
  try {
    const events = await Event.find({
      status: "rechazado"
    })
      .populate("createdBy", "name email role zone points")
      .populate("rejectedBy", "name email role")
      .sort({ updatedAt: -1 });

    res.status(200).json({
      total: events.length,
      events
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener eventos rechazados",
      error: error.message
    });
  }
};

/**
 * Obtener posibles duplicados por zona y nombre aproximado
 * Esta es una ayuda básica para moderación
 */
exports.findPossibleDuplicates = async (req, res) => {
  try {
    const { zone, title, placeName } = req.query;

    const filters = {
      duplicateOf: null
    };

    if (zone) filters.zone = zone;
    if (title) filters.title = { $regex: title, $options: "i" };
    if (placeName) filters.placeName = { $regex: placeName, $options: "i" };

    const events = await Event.find(filters)
      .populate("createdBy", "name email role zone")
      .sort({ date: 1, createdAt: -1 });

    res.status(200).json({
      total: events.length,
      events
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al buscar posibles duplicados",
      error: error.message
    });
  }
};