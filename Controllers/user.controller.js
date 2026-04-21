const User = require("../Models/Usuario");
const AuditLog = require("../Models/Auditoria");

const MASTER_PROMOTER_EMAIL = "p_adi_kamakiri@gmail.com";

const getTrustLevelByRole = (role) => {
  if (role === "Promotor") return 100;
  if (role === "Explorador") return 75;
  if (role === "Validador") return 50;
  return 0;
};

exports.createManagedUser = async (req, res) => {
  try {
    const { name, email, password, role, zone } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        message: "Nombre, correo, contraseña y rol son obligatorios"
      });
    }

    const validRoles = ["Promotor", "Explorador", "Validador"];

    if (!validRoles.includes(role)) {
      return res.status(400).json({
        message: "El rol enviado no es válido"
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "Ya existe un usuario con ese correo"
      });
    }

    let finalZone = req.user.zone;

    if (req.user.email === MASTER_PROMOTER_EMAIL && role === "Promotor") {
      if (!zone || !zone.trim()) {
        return res.status(400).json({
          message: "La zona es obligatoria al crear un Promotor desde el promotor principal"
        });
      }

      finalZone = zone.trim();
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      zone: finalZone,
      createdBy: req.user._id
    });

    await AuditLog.create({
      action: "CREATE_MANAGED_USER",
      entityType: "User",
      entityId: user._id,
      performedBy: req.user._id,
      zone: req.user.zone,
      details: {
        createdUser: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          zone: user.zone
        }
      }
    });

    return res.status(201).json({
      message: "Perfil creado correctamente",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        zone: user.zone,
        trustLevel: getTrustLevelByRole(user.role)
      }
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al crear el perfil",
      error: error.message
    });
  }
};

exports.getManagedProfiles = async (req, res) => {
  try {
    let users;

    // NUEVO: el promotor principal puede ver todos los usuarios creados
    if (req.user.email === MASTER_PROMOTER_EMAIL) {
      users = await User.find({}).select("-password");
    } else {
      users = await User.find({
        createdBy: req.user._id,
        zone: req.user.zone
      }).select("-password");
    }

    const formattedUsers = users.map((user) => ({
      ...user.toObject(),
      trustLevel: getTrustLevelByRole(user.role)
    }));

    return res.status(200).json({
      total: formattedUsers.length,
      users: formattedUsers
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al obtener perfiles",
      error: error.message
    });
  }
};

exports.getProfilesByZone = async (req, res) => {
  try {
    const users = await User.find({
      zone: req.user.zone
    }).select("-password");

    const formattedUsers = users.map((user) => ({
      ...user.toObject(),
      trustLevel: getTrustLevelByRole(user.role)
    }));

    return res.status(200).json({
      total: formattedUsers.length,
      users: formattedUsers
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al obtener perfiles por zona",
      error: error.message
    });
  }
};

exports.updateManagedUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ["Promotor", "Explorador", "Validador"];

    if (!validRoles.includes(role)) {
      return res.status(400).json({
        message: "El nuevo rol no es válido"
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        message: "No se encontró un usuario"
      });
    }

    if (
      String(user.createdBy) !== String(req.user._id) ||
      user.zone !== req.user.zone
    ) {
      return res.status(403).json({
        message: "No puedes modificar perfiles fuera de tu gestión o zona"
      });
    }

    const previousRole = user.role;
    user.role = role;
    await user.save();

    await AuditLog.create({
      action: "UPDATE_USER_ROLE",
      entityType: "User",
      entityId: user._id,
      performedBy: req.user._id,
      zone: req.user.zone,
      details: {
        previousRole,
        newRole: user.role
      }
    });

    return res.status(200).json({
      message: "Rol actualizado correctamente",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        zone: user.zone,
        trustLevel: getTrustLevelByRole(user.role)
      }
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al actualizar el rol",
      error: error.message
    });
  }
};