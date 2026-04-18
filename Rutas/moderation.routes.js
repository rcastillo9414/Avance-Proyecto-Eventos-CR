const express = require("express");
const router = express.Router();

const auth = require("../Middleware/auth");
const role = require("../Middleware/role");

const {
  getPendingEvents,
  approveEvent,
  rejectEvent,
  recategorizeEvent,
  mergeDuplicateEvents,
  getRejectedEvents,
  findPossibleDuplicates
} = require("../Controllers/moderation.controller");

// Todas estas rutas son solo para moderadores
router.get("/pending", auth, role("moderador"), getPendingEvents);
router.get("/rejected", auth, role("moderador"), getRejectedEvents);
router.get("/duplicates", auth, role("moderador"), findPossibleDuplicates);

router.put("/approve/:id", auth, role("moderador"), approveEvent);
router.put("/reject/:id", auth, role("moderador"), rejectEvent);
router.put("/recategorize/:id", auth, role("moderador"), recategorizeEvent);
router.put("/merge-duplicates", auth, role("moderador"), mergeDuplicateEvents);

module.exports = router;