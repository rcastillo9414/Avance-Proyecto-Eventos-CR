const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "El nombre es obligatorio"],
      trim: true
    },
    email: {
      type: String,
      required: [true, "El correo es obligatorio"],
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, "La contraseña es obligatoria"],
      minlength: 6
    },
    role: {
      type: String,
      enum: ["Promotor", "Explorador", "Validador"],
      default: "Explorador"
    },
    zone: {
      type: String,
      default: ""
    },

    
    // Indica qué promotor creó este perfil
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    points: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Encripta la contraseña antes de guardarla
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar contraseñas
userSchema.methods.comparePassword = async function (passwordIngresada) {
  return await bcrypt.compare(passwordIngresada, this.password);
};

module.exports = mongoose.model("User", userSchema);