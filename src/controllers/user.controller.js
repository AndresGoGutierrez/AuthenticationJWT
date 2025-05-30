import User from "../models/User"
import Role from "../models/Role"

export const createUser = async (req, res) => {
  try {
    const { username, email, password, roles } = req.body

    // Create a new user
    const newUser = new User({
      username,
      email,
      password: await User.encryptPassword(password),
    })

    // Assign roles if provided
    if (roles && roles.length > 0) {
      const foundRoles = await Role.find({ name: { $in: roles } })
      newUser.roles = foundRoles.map((role) => role._id)
    } else {
      // Assign default role
      const role = await Role.findOne({ name: "user" })
      newUser.roles = [role._id]
    }

    // Save the user
    const savedUser = await newUser.save()

    // Respond with created user (excluding password)
    const userWithoutPassword = { ...savedUser._doc }
    delete userWithoutPassword.password

    res.status(201).json(userWithoutPassword)
  } catch (err) {
    console.error("Error creating user:", err)
    res.status(500).json({ message: "Internal error creating user" })
  }
}

export const getUsers = async (req, res) => {
  try {
    console.log("Fetching users...")

    // Get all users excluding password
    const users = await User.find({}, { password: 0 }).populate("roles")

    // Transform data for client
    const transformedUsers = users.map((user) => ({
      _id: user._id,
      username: user.username,
      email: user.email,
      roles: user.roles.map((role) => role.name),
      createdAt: user.createdAt,
    }))

    console.log(`Found ${transformedUsers.length} users`)
    res.status(200).json(transformedUsers)
  } catch (err) {
    console.error("Error fetching users:", err)
    res.status(500).json({ message: "Internal error listing users" })
  }
}

export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params

    // Get user by ID excluding password
    const user = await User.findById(userId, { password: 0 }).populate("roles")

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Transform data for client
    const transformedUser = {
      _id: user._id,
      username: user.username,
      email: user.email,
      roles: user.roles.map((role) => role.name),
      createdAt: user.createdAt,
    }

    res.status(200).json(transformedUser)
  } catch (err) {
    console.error("Error fetching user:", err)
    res.status(500).json({ message: "Internal error fetching user" })
  }
}

export const updateUser = async (req, res) => {
  try {
    const { userId } = req.params
    const { username, email, roles } = req.body

    // Prepare data to update
    const updateData = {}
    if (username) updateData.username = username
    if (email) updateData.email = email

    // Update roles if provided
    if (roles && roles.length > 0) {
      const foundRoles = await Role.find({ name: { $in: roles } })
      updateData.roles = foundRoles.map((role) => role._id)
    }

    // Update the user
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      fields: { password: 0 },
    }).populate("roles")

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" })
    }

    // Transform data for client
    const transformedUser = {
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      roles: updatedUser.roles.map((role) => role.name),
      createdAt: updatedUser.createdAt,
    }

    res.status(200).json(transformedUser)
  } catch (err) {
    console.error("Error updating user:", err)
    res.status(500).json({ message: "Internal error updating user" })
  }
}

export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params

    // Delete user
    const deletedUser = await User.findByIdAndDelete(userId)

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" })
    }

    res.status(200).json({ message: "User successfully deleted" })
  } catch (err) {
    console.error("Error deleting user:", err)
    res.status(500).json({ message: "Internal error deleting user" })
  }
}

export const changeUserRole = async (req, res) => {
  try {
    const { userId } = req.params
    const { roles } = req.body

    if (!roles || !Array.isArray(roles) || roles.length === 0) {
      return res.status(400).json({ message: "At least one role is required" })
    }

    // Find roles in database
    const foundRoles = await Role.find({ name: { $in: roles } })

    if (foundRoles.length === 0) {
      return res.status(400).json({ message: "Invalid roles" })
    }

    // Update user roles
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { roles: foundRoles.map((role) => role._id) },
      { new: true, fields: { password: 0 } },
    ).populate("roles")

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" })
    }

    // Transform data for client
    const transformedUser = {
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      roles: updatedUser.roles.map((role) => role.name),
      createdAt: updatedUser.createdAt,
    }

    res.status(200).json(transformedUser)
  } catch (err) {
    console.error("Error changing user role:", err)
    res.status(500).json({ message: "Internal error changing user role" })
  }
}
