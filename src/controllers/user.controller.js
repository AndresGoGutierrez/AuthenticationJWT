import User from "../models/User"
import Role from "../models/Role"

export const createUser = async (req, res) => {
  try {
    const { username, email, password, roles } = req.body

    // Crear un nuevo usuario
    const newUser = new User({
      username,
      email,
      password: await User.encryptPassword(password),
    })

    // Asignar roles si se proporcionan
    if (roles && roles.length > 0) {
      const foundRoles = await Role.find({ name: { $in: roles } })
      newUser.roles = foundRoles.map((role) => role._id)
    } else {
      // Asignar rol de usuario por defecto
      const role = await Role.findOne({ name: "user" })
      newUser.roles = [role._id]
    }

    // Guardar el usuario
    const savedUser = await newUser.save()

    // Responder con el usuario creado (sin contraseña)
    const userWithoutPassword = { ...savedUser._doc }
    delete userWithoutPassword.password

    res.status(201).json(userWithoutPassword)
  } catch (err) {
    console.error("Error al crear usuario:", err)
    res.status(500).json({ message: "Error interno al crear usuario" })
  }
}

export const getUsers = async (req, res) => {
  try {
    console.log("Obteniendo usuarios...")

    // Obtener todos los usuarios sin incluir la contraseña
    const users = await User.find({}, { password: 0 }).populate("roles")

    // Transformar los datos para el cliente
    const transformedUsers = users.map((user) => ({
      _id: user._id,
      username: user.username,
      email: user.email,
      roles: user.roles.map((role) => role.name),
      createdAt: user.createdAt,
    }))

    console.log(`Se encontraron ${transformedUsers.length} usuarios`)
    res.status(200).json(transformedUsers)
  } catch (err) {
    console.error("Error al obtener usuarios:", err)
    res.status(500).json({ message: "Error interno al listar usuarios" })
  }
}

export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params

    // Obtener el usuario por ID sin incluir la contraseña
    const user = await User.findById(userId, { password: 0 }).populate("roles")

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" })
    }

    // Transformar los datos para el cliente
    const transformedUser = {
      _id: user._id,
      username: user.username,
      email: user.email,
      roles: user.roles.map((role) => role.name),
      createdAt: user.createdAt,
    }

    res.status(200).json(transformedUser)
  } catch (err) {
    console.error("Error al obtener usuario:", err)
    res.status(500).json({ message: "Error interno al obtener usuario" })
  }
}

export const updateUser = async (req, res) => {
  try {
    const { userId } = req.params
    const { username, email, roles } = req.body

    // Preparar los datos a actualizar
    const updateData = {}
    if (username) updateData.username = username
    if (email) updateData.email = email

    // Actualizar roles si se proporcionan
    if (roles && roles.length > 0) {
      const foundRoles = await Role.find({ name: { $in: roles } })
      updateData.roles = foundRoles.map((role) => role._id)
    }

    // Actualizar el usuario
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      fields: { password: 0 },
    }).populate("roles")

    if (!updatedUser) {
      return res.status(404).json({ message: "Usuario no encontrado" })
    }

    // Transformar los datos para el cliente
    const transformedUser = {
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      roles: updatedUser.roles.map((role) => role.name),
      createdAt: updatedUser.createdAt,
    }

    res.status(200).json(transformedUser)
  } catch (err) {
    console.error("Error al actualizar usuario:", err)
    res.status(500).json({ message: "Error interno al actualizar usuario" })
  }
}

export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params

    // Eliminar el usuario
    const deletedUser = await User.findByIdAndDelete(userId)

    if (!deletedUser) {
      return res.status(404).json({ message: "Usuario no encontrado" })
    }

    res.status(200).json({ message: "Usuario eliminado correctamente" })
  } catch (err) {
    console.error("Error al eliminar usuario:", err)
    res.status(500).json({ message: "Error interno al eliminar usuario" })
  }
}

export const changeUserRole = async (req, res) => {
  try {
    const { userId } = req.params
    const { roles } = req.body

    if (!roles || !Array.isArray(roles) || roles.length === 0) {
      return res.status(400).json({ message: "Se requiere al menos un rol" })
    }

    // Buscar los roles en la base de datos
    const foundRoles = await Role.find({ name: { $in: roles } })

    if (foundRoles.length === 0) {
      return res.status(400).json({ message: "Roles no válidos" })
    }

    // Actualizar los roles del usuario
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { roles: foundRoles.map((role) => role._id) },
      { new: true, fields: { password: 0 } },
    ).populate("roles")

    if (!updatedUser) {
      return res.status(404).json({ message: "Usuario no encontrado" })
    }

    // Transformar los datos para el cliente
    const transformedUser = {
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      roles: updatedUser.roles.map((role) => role.name),
      createdAt: updatedUser.createdAt,
    }

    res.status(200).json(transformedUser)
  } catch (err) {
    console.error("Error al cambiar rol de usuario:", err)
    res.status(500).json({ message: "Error interno al cambiar rol de usuario" })
  }
}
