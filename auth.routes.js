const express = require("express");
const router = express.Router();
const {
  register,
  login,
  forgotPassword,
  resetPassword
} = require("../Controllers/auth.controller");

router.post("/register", register);
router.post("/login", login);

// NUEVO
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;