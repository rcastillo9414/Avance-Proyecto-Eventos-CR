const express = require("express");
const router = express.Router();

const auth = require("../Middleware/auth");
const role = require("../Middleware/role");
const uploadEventImage = require("../Middleware/imgevento");

const {
  createEvent,
  getEvents,
  getEventById,
  getMyEvents,
  getNearbyEvents,
  updateEvent,
  cancelEvent,
  deleteEvent,
  markEventAsCompleted,
  registerAttendancePercentage,
  confirmAttendanceLevel,
  assignEventPoints
} = require("../Controllers/event.controller");

router.post(
  "/",
  auth,
  role("Promotor", "Explorador", "Validador"),
  uploadEventImage.single("photoEvidence"),
  createEvent
);

router.get("/", auth, role("Promotor", "Explorador", "Validador"), getEvents);
router.get("/mine", auth, getMyEvents);

// NUEVO: eventos cercanos para dashboard
router.get("/nearby", auth, role("Promotor", "Explorador", "Validador"), getNearbyEvents);

router.get("/:id", auth, role("Promotor", "Explorador", "Validador"), getEventById);

router.put("/complete/:id", auth, role("Promotor"), markEventAsCompleted);
router.put("/attendance/:id", auth, role("Promotor"), registerAttendancePercentage);
router.put("/attendance/confirm/:id", auth, role("Promotor"), confirmAttendanceLevel);
router.put("/points/:id", auth, role("Promotor"), assignEventPoints);

router.put(
  "/:id",
  auth,
  role("Promotor"),
  uploadEventImage.single("photoEvidence"),
  updateEvent
);

router.put("/cancel/:id", auth, role("Promotor"), cancelEvent);
router.delete("/:id", auth, role("Promotor"), deleteEvent);

module.exports = router;