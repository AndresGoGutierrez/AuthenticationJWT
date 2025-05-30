const express = require("express")
const router = express.Router()
const User = require("../models/User")
const Role = require("../models/Role")
const { verifyToken, isAdmin } = require("../middlewares/authJWT")

// Middleware para depuración
router.use((req, res, next) => {
  console.log("Admin API Request:", {
    method: req.method,
    path: req.path,
    headers: {
      authorization: req.headers.authorization ? "Bearer ..." : undefined,
      "x-access-token": req.headers["x-access-token"] ? "..." : undefined,
    },
    body: req.body,
  })
  next()
})

// Obtener todos los usuarios (solo admin)
router.get("/users", [verifyToken, isAdmin], async (req, res) => {
  try {
    console.log("Obteniendo todos los usuarios")
    const users = await User.find({}, { password: 0 }).populate("roles")

    // Transformar los datos para el cliente
    const transformedUsers = users.map((user) => ({
      id: user._id,
      username: user.username,
      email: user.email,
      roles: user.roles.map((role) => role.name),
      createdAt: user.createdAt,
    }))

    console.log(`Encontrados ${transformedUsers.length} usuarios`)
    res.json(transformedUsers)
  } catch (error) {
    console.error("Error al obtener usuarios:", error)
    res.status(500).json({ message: "Error al obtener usuarios" })
  }
})

// Obtener un usuario específico (solo admin)
router.get("/users/:id", [verifyToken, isAdmin], async (req, res) => {
  try {
    const user = await User.findById(req.params.id, { password: 0 }).populate("roles")

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" })
    }

    // Transformar los datos para el cliente
    const transformedUser = {
      id: user._id,
      username: user.username,
      email: user.email,
      roles: user.roles.map((role) => role.name),
      createdAt: user.createdAt,
    }

    res.json(transformedUser)
  } catch (error) {
    res.status(500).json({ message: "Error al obtener usuario" })
  }
})

// Actualizar un usuario (solo admin)
router.put("/users/:id", [verifyToken, isAdmin], async (req, res) => {
  try {
    const { username, email } = req.body

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { username, email },
      { new: true, fields: { password: 0 } },
    ).populate("roles")

    if (!updatedUser) {
      return res.status(404).json({ message: "Usuario no encontrado" })
    }

    // Transformar los datos para el cliente
    const transformedUser = {
      id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      roles: updatedUser.roles.map((role) => role.name),
      createdAt: updatedUser.createdAt,
    }

    res.json(transformedUser)
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar usuario" })
  }
})

// Cambiar rol de usuario (solo admin)
router.patch("/users/:id/role", [verifyToken, isAdmin], async (req, res) => {
  try {
    const { roles } = req.body

    if (!roles || !Array.isArray(roles)) {
      return res.status(400).json({ message: "Se requiere un array de roles" })
    }

    // Obtener los IDs de los roles
    const foundRoles = await Role.find({ name: { $in: roles } })

    if (foundRoles.length === 0) {
      return res.status(400).json({ message: "Roles no válidos" })
    }

    const roleIds = foundRoles.map((role) => role._id)

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { roles: roleIds },
      { new: true, fields: { password: 0 } },
    ).populate("roles")

    if (!updatedUser) {
      return res.status(404).json({ message: "Usuario no encontrado" })
    }

    // Transformar los datos para el cliente
    const transformedUser = {
      id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      roles: updatedUser.roles.map((role) => role.name),
      createdAt: updatedUser.createdAt,
    }

    res.json(transformedUser)
  } catch (error) {
    res.status(500).json({ message: "Error al cambiar rol de usuario" })
  }
})

// Eliminar un usuario (solo admin)
router.delete("/users/:id", [verifyToken, isAdmin], async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id)

    if (!deletedUser) {
      return res.status(404).json({ message: "Usuario no encontrado" })
    }

    res.json({ message: "Usuario eliminado correctamente" })
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar usuario" })
  }
})

module.exports = router
