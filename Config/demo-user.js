require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../Models/Usuario");

const usersToSeed = [
  {
    name: "Adi Kamakiri",
    email: "p_adi_kamakiri@gmail.com",
    password: "asd123",
    role: "Promotor",
    zone: "San Jose"
  },
  {
    name: "Adi Aguacaliente",
    email: "initado_adi_aguacaliente@gmail.com",
    password: "qwe123 ",
    role: "explorador",
    zone: "San Jose"
  },
  {
    name: "Adi Ba",
    email: "validador_adi_ba@gmail.com",
    password: "zxc123",
    role: "moderador",
    zone: "San Jose"
  }
];

const seedUsers = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("No se encontró MONGO_URI en el archivo .env");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB conectado para carga inicial");

    for (const userData of usersToSeed) {
      const existingUser = await User.findOne({ email: userData.email });

      if (existingUser) {
        console.log(`ℹ️ El usuario ya existe: ${userData.email}`);
        continue;
      }

      await User.create(userData);
      console.log(`✅ Usuario creado: ${userData.email} | Rol: ${userData.role}`);
    }

    console.log("🎉 Carga inicial de usuarios completada");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error al cargar usuarios iniciales:", error.message);
    process.exit(1);
  }
};

seedUsers();