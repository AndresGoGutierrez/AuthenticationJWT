import jwt from "jsonwebtoken"
import config from "../config"
import User from "../models/User"

export const verifyToken = async (req, res, next) => {
  try {
    // Obtener el token de los headers
    const token =
      req.headers["x-access-token"] || (req.headers.authorization && req.headers.authorization.split(" ")[1])

    if (!token) {
      console.log("No token provided")
      return res.status(403).json({ message: "No token provided" })
    }

    console.log("Verificando token...")

    // Verificar el token
    const decoded = jwt.verify(token, config.SECRET)
    req.userId = decoded.id

    // Buscar el usuario
    const user = await User.findById(req.userId, { password: 0 }).populate("roles")

    if (!user) {
      console.log("Usuario no encontrado")
      return res.status(404).json({ message: "Usuario no encontrado" })
    }

    console.log(`Usuario encontrado: ${user.username}`)

    // Guardar el usuario en req para uso posterior
    req.user = user

    next()
  } catch (error) {
    console.error("Error en verifyToken:", error)
    return res.status(401).json({ message: "Unauthorized" })
  }
}

export const isModerator = async (req, res, next) => {
  try {
    // El usuario ya debe estar en req.user desde verifyToken
    if (!req.user) {
      console.log("Usuario no encontrado en req.user")

      // Intentar obtener el usuario si no está en req.user
      if (req.userId) {
        const user = await User.findById(req.userId, { password: 0 }).populate("roles")
        if (!user) {
          return res.status(404).json({ message: "Usuario no encontrado" })
        }
        req.user = user
      } else {
        return res.status(500).json({ message: "Error interno del servidor" })
      }
    }

    // Verificar si el usuario tiene rol de moderador
    const roles = req.user.roles
    const isModerator = roles.some((role) => role.name === "moderator")

    if (isModerator) {
      console.log("Usuario es moderador")
      next()
      return
    }

    console.log("Usuario no es moderador")
    return res.status(403).json({ message: "Require Moderator role" })
  } catch (error) {
    console.error("Error en isModerator:", error)
    return res.status(500).json({ message: "Error al verificar rol de moderador" })
  }
}

export const isAdmin = async (req, res, next) => {
  try {
    // El usuario ya debe estar en req.user desde verifyToken
    if (!req.user) {
      console.log("Usuario no encontrado en req.user")

      // Intentar obtener el usuario si no está en req.user
      if (req.userId) {
        const user = await User.findById(req.userId, { password: 0 }).populate("roles")
        if (!user) {
          return res.status(404).json({ message: "Usuario no encontrado" })
        }
        req.user = user
      } else {
        return res.status(500).json({ message: "Error interno del servidor" })
      }
    }

    // Verificar si el usuario tiene rol de administrador
    const roles = req.user.roles
    console.log("Roles del usuario:", roles)

    const isAdmin = roles.some((role) => role.name === "admin")

    if (isAdmin) {
      console.log("Usuario es administrador")
      next()
      return
    }

    console.log("Usuario no es administrador")
    return res.status(403).json({ message: "Require Admin role" })
  } catch (error) {
    console.error("Error en isAdmin:", error)
    return res.status(500).json({ message: "Error al verificar rol de administrador" })
  }
}
