const jwt = require("jsonwebtoken");
const User = require("../Models/Usuario");

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Acceso denegado. Token no proporcionado"
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        message: "Usuario no autorizado"
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Token inválido o expirado"
    });
  }
};

module.exports = auth;