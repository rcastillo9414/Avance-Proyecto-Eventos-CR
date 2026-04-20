const express = require("express");
const router = express.Router();

const auth = require("../Middleware/auth");
const role = require("../Middleware/role");

const {
  createManagedUser,
  getManagedProfiles,
  getProfilesByZone,
  updateManagedUserRole
} = require("../Controllers/user.controller");

router.post("/", auth, role("Promotor"), createManagedUser);
router.get("/mine", auth, role("Promotor"), getManagedProfiles);
router.put("/:id/role", auth, role("Promotor"), updateManagedUserRole);
router.get("/zone", auth, role("Promotor", "Explorador", "Validador"), getProfilesByZone);

module.exports = router;