const Itinerary = require("../Models/itinerary");
const Event = require("../Models/event");

/**
 * Crear itinerario
 * Regla:
 * - Debe tener al menos 1 evento
 * - No tiene límite fijo de eventos
 */
exports.createItinerary = async (req, res) => {
  try {
    const { title, date, events } = req.body;

    if (!title || !date) {
      return res.status(400).json({
        message: "El título y la fecha del itinerario son obligatorios"
      });
    }

    if (!Array.isArray(events) || events.length < 1) {
      return res.status(400).json({
        message: "Debes enviar al menos un evento para crear el itinerario"
      });
    }

    const itineraryDate = new Date(date);

    if (isNaN(itineraryDate.getTime())) {
      return res.status(400).json({
        message: "La fecha del itinerario no es válida"
      });
    }

    const uniqueEventIds = [...new Set(events)];

    if (uniqueEventIds.length !== events.length) {
      return res.status(400).json({
        message: "No se permiten eventos repetidos en el mismo itinerario"
      });
    }

    const foundEvents = await Event.find({
      _id: { $in: uniqueEventIds }
    });

    if (foundEvents.length !== uniqueEventIds.length) {
      return res.status(404).json({
        message: "Uno o más eventos no existen"
      });
    }

    const itineraryEvents = uniqueEventIds.map((eventId, index) => ({
      event: eventId,
      order: index + 1
    }));

    const itinerary = await Itinerary.create({
      title: title.trim(),
      user: req.user._id,
      date: itineraryDate,
      events: itineraryEvents
    });

    const populatedItinerary = await Itinerary.findById(itinerary._id)
      .populate("user", "name email role zone")
      .populate("events.event");

    return res.status(201).json({
      message: "Itinerario creado correctamente",
      itinerary: populatedItinerary
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al crear el itinerario",
      error: error.message
    });
  }
};

/**
 * Obtener todos los itinerarios del usuario autenticado
 */
exports.getMyItineraries = async (req, res) => {
  try {
    const itineraries = await Itinerary.find({ user: req.user._id })
      .populate("events.event")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      total: itineraries.length,
      itineraries
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al obtener tus itinerarios",
      error: error.message
    });
  }
};

/**
 * Obtener un itinerario por ID
 * Regla:
 * - Solo el dueño puede verlo
 */
exports.getItineraryById = async (req, res) => {
  try {
    const { id } = req.params;

    const itinerary = await Itinerary.findById(id)
      .populate("user", "name email role zone")
      .populate("events.event");

    if (!itinerary) {
      return res.status(404).json({
        message: "Itinerario no encontrado"
      });
    }

    if (String(itinerary.user._id) !== String(req.user._id)) {
      return res.status(403).json({
        message: "No tienes permisos para ver este itinerario"
      });
    }

    return res.status(200).json(itinerary);
  } catch (error) {
    return res.status(500).json({
      message: "Error al obtener el itinerario",
      error: error.message
    });
  }
};

/**
 * Agregar un evento al itinerario
 * Regla:
 * - Solo el dueño
 * - No se permiten duplicados
 */
exports.addEventToItinerary = async (req, res) => {
  try {
    const { id } = req.params;
    const { eventId } = req.body;

    if (!eventId) {
      return res.status(400).json({
        message: "Debes enviar el eventId"
      });
    }

    const itinerary = await Itinerary.findById(id);

    if (!itinerary) {
      return res.status(404).json({
        message: "Itinerario no encontrado"
      });
    }

    if (String(itinerary.user) !== String(req.user._id)) {
      return res.status(403).json({
        message: "No tienes permisos para modificar este itinerario"
      });
    }

    const eventExists = await Event.findById(eventId);

    if (!eventExists) {
      return res.status(404).json({
        message: "El evento no existe"
      });
    }

    const alreadyAdded = itinerary.events.some(
      (item) => String(item.event) === String(eventId)
    );

    if (alreadyAdded) {
      return res.status(400).json({
        message: "El evento ya existe en el itinerario"
      });
    }

    itinerary.events.push({
      event: eventId,
      order: itinerary.events.length + 1
    });

    await itinerary.save();

    const populatedItinerary = await Itinerary.findById(itinerary._id)
      .populate("user", "name email role zone")
      .populate("events.event");

    return res.status(200).json({
      message: "Evento agregado al itinerario correctamente",
      itinerary: populatedItinerary
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al agregar el evento al itinerario",
      error: error.message
    });
  }
};

/**
 * Eliminar un evento del itinerario
 * Regla:
 * - Solo el dueño
 * - Reordena automáticamente
 */
exports.removeEventFromItinerary = async (req, res) => {
  try {
    const { id } = req.params;
    const { eventId } = req.body;

    if (!eventId) {
      return res.status(400).json({
        message: "Debes enviar el eventId"
      });
    }

    const itinerary = await Itinerary.findById(id);

    if (!itinerary) {
      return res.status(404).json({
        message: "Itinerario no encontrado"
      });
    }

    if (String(itinerary.user) !== String(req.user._id)) {
      return res.status(403).json({
        message: "No tienes permisos para modificar este itinerario"
      });
    }

    const initialLength = itinerary.events.length;

    itinerary.events = itinerary.events.filter(
      (item) => String(item.event) !== String(eventId)
    );

    if (itinerary.events.length === initialLength) {
      return res.status(404).json({
        message: "El evento no se encuentra en el itinerario"
      });
    }

    itinerary.events = itinerary.events.map((item, index) => ({
      event: item.event,
      order: index + 1
    }));

    await itinerary.save();

    const populatedItinerary = await Itinerary.findById(itinerary._id)
      .populate("user", "name email role zone")
      .populate("events.event");

    return res.status(200).json({
      message: "Evento eliminado del itinerario correctamente",
      itinerary: populatedItinerary
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al eliminar el evento del itinerario",
      error: error.message
    });
  }
};

/**
 * Reordenar los eventos del itinerario
 * Regla:
 * - Solo el dueño
 * - Debe enviarse la lista completa de eventIds en su nuevo orden
 */
exports.reorderItineraryEvents = async (req, res) => {
  try {
    const { id } = req.params;
    const { events } = req.body;

    if (!Array.isArray(events) || events.length < 1) {
      return res.status(400).json({
        message: "Debes enviar un arreglo válido de eventos"
      });
    }

    const itinerary = await Itinerary.findById(id);

    if (!itinerary) {
      return res.status(404).json({
        message: "Itinerario no encontrado"
      });
    }

    if (String(itinerary.user) !== String(req.user._id)) {
      return res.status(403).json({
        message: "No tienes permisos para modificar este itinerario"
      });
    }

    const currentIds = itinerary.events.map((item) => String(item.event)).sort();
    const newIds = events.map((eventId) => String(eventId)).sort();

    if (currentIds.length !== newIds.length) {
      return res.status(400).json({
        message: "Debes incluir todos los eventos actuales del itinerario"
      });
    }

    const sameElements =
      JSON.stringify(currentIds) === JSON.stringify(newIds);

    if (!sameElements) {
      return res.status(400).json({
        message: "La nueva lista debe contener exactamente los mismos eventos del itinerario"
      });
    }

    itinerary.events = events.map((eventId, index) => ({
      event: eventId,
      order: index + 1
    }));

    await itinerary.save();

    const populatedItinerary = await Itinerary.findById(itinerary._id)
      .populate("user", "name email role zone")
      .populate("events.event");

    return res.status(200).json({
      message: "Eventos del itinerario reordenados correctamente",
      itinerary: populatedItinerary
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al reordenar el itinerario",
      error: error.message
    });
  }
};

/**
 * Actualizar datos básicos del itinerario
 * Regla:
 * - Solo el dueño
 */
exports.updateItinerary = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, date } = req.body;

    const itinerary = await Itinerary.findById(id);

    if (!itinerary) {
      return res.status(404).json({
        message: "Itinerario no encontrado"
      });
    }

    if (String(itinerary.user) !== String(req.user._id)) {
      return res.status(403).json({
        message: "No tienes permisos para editar este itinerario"
      });
    }

    if (title !== undefined) itinerary.title = title.trim();

    if (date !== undefined) {
      const itineraryDate = new Date(date);

      if (isNaN(itineraryDate.getTime())) {
        return res.status(400).json({
          message: "La nueva fecha del itinerario no es válida"
        });
      }

      itinerary.date = itineraryDate;
    }

    await itinerary.save();

    const populatedItinerary = await Itinerary.findById(itinerary._id)
      .populate("user", "name email role zone")
      .populate("events.event");

    return res.status(200).json({
      message: "Itinerario actualizado correctamente",
      itinerary: populatedItinerary
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al actualizar el itinerario",
      error: error.message
    });
  }
};

/**
 * Eliminar itinerario
 * Regla:
 * - Solo el dueño
 */
exports.deleteItinerary = async (req, res) => {
  try {
    const { id } = req.params;

    const itinerary = await Itinerary.findById(id);

    if (!itinerary) {
      return res.status(404).json({
        message: "Itinerario no encontrado"
      });
    }

    if (String(itinerary.user) !== String(req.user._id)) {
      return res.status(403).json({
        message: "No tienes permisos para eliminar este itinerario"
      });
    }

    await Itinerary.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Itinerario eliminado correctamente"
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al eliminar el itinerario",
      error: error.message
    });
  }
};