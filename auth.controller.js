const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../Models/Usuario");

const generarToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, zone } = req.body;

    if (!name || !email || !password || !zone) {
      return res.status(400).json({
        message: "Nombre, correo, contraseña y zona son obligatorios"
      });
    }

    const usuarioExistente = await User.findOne({ email });

    if (usuarioExistente) {
      return res.status(400).json({
        message: "Ya existe un usuario con ese correo"
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: "Explorador",
      zone
    });

    res.status(201).json({
      message: "Usuario registrado correctamente",
      token: generarToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        zone: user.zone,
        points: user.points
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al registrar usuario",
      error: error.message
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Correo y contraseña son obligatorios"
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Credenciales inválidas"
      });
    }

    const passwordCorrecta = await user.comparePassword(password);

    if (!passwordCorrecta) {
      return res.status(400).json({
        message: "Credenciales inválidas"
      });
    }

    res.status(200).json({
      message: "Login exitoso",
      token: generarToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        zone: user.zone,
        points: user.points
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al iniciar sesión",
      error: error.message
    });
  }
};

// solicitar recuperación
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "El correo es obligatorio"
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Por seguridad, responder igual aunque no exista
    if (!user) {
      return res.status(200).json({
        message: "Si el correo existe, se enviaron instrucciones para recuperar la contraseña"
      });
    }

    const token = crypto.randomBytes(32).toString("hex");

    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutos
    await user.save();

    // En esta etapa se deja visible en consola para pruebas locales.
    // Más adelante esto se reemplaza por envío real con correo.
    const resetUrl = `http://localhost:5500/reset-password.html?token=${token}`;
    console.log("🔐 Enlace de recuperación:", resetUrl);

    return res.status(200).json({
      message: "Si el correo existe, se enviaron instrucciones para recuperar la contraseña"
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al procesar la recuperación de contraseña",
      error: error.message
    });
  }
};

// restablecer contraseña
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        message: "Token y nueva contraseña son obligatorios"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "La nueva contraseña debe tener al menos 6 caracteres"
      });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        message: "El enlace no es válido o ya expiró"
      });
    }

    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();

    return res.status(200).json({
      message: "La contraseña fue actualizada correctamente"
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al restablecer la contraseña",
      error: error.message
    });
  }
};