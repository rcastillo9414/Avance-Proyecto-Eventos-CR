const express = require("express");
const router = express.Router();

const auth = require("../Middleware/auth");
const role = require("../Middleware/role");
const { getAuditLogs } = require("../Controllers/auditoria-controllers");

// Promotor y Validador pueden revisar la auditoría de su zona
router.get("/", auth, role("Promotor", "Validador"), getAuditLogs);

module.exports = router;