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

router.get("/pending", auth, role("Validador"), getPendingEvents);
router.get("/rejected", auth, role("Validador"), getRejectedEvents);
router.get("/duplicates", auth, role("Validador"), findPossibleDuplicates);

router.put("/approve/:id", auth, role("Validador"), approveEvent);
router.put("/reject/:id", auth, role("Validador"), rejectEvent);
router.put("/recategorize/:id", auth, role("Validador"), recategorizeEvent);
router.put("/merge-duplicates", auth, role("Validador"), mergeDuplicateEvents);

module.exports = router;