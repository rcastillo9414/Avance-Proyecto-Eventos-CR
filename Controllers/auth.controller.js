const jwt = require("jsonwebtoken");
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