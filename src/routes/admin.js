const express = require("express")
const router = express.Router()
const UserModule = require('../models/User');
const User = UserModule.default || UserModule;
const Role = require("../models/Role")
const { verifyToken, isAdmin } = require("../middlewares/authJWT")

// Debug middleware
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

// Get all users (admin only)
router.get("/users", [verifyToken, isAdmin], async (req, res) => {
  try {
    console.log("Fetching all users")
    const users = await User.find({}, { password: 0 }).populate("roles")

    // Transform data for client
    const transformedUsers = users.map((user) => ({
      id: user._id,
      username: user.username,
      email: user.email,
      roles: user.roles.map((role) => role.name),
      createdAt: user.createdAt,
    }))

    console.log(`Found ${transformedUsers.length} users`)
    res.json(transformedUsers)
  } catch (error) {
    console.error("Error fetching users:", error)
    res.status(500).json({ message: "Error fetching users" })
  }
})

// Get specific user (admin only)
router.get("/users/:id", [verifyToken, isAdmin], async (req, res) => {
  const { id } = req.params;
  console.log("getUserById called with userId:", id);
  try {
    console.log("User:", User);
    console.log("typeof User.findById:", typeof User.findById);
    const user = await User.findById(id, { password: 0 }).populate("roles");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const transformedUser = {
      id: user._id,
      username: user.username,
      email: user.email,
      roles: user.roles.map((role) => role.name),
      createdAt: user.createdAt,
    };

    res.json(transformedUser);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Error fetching user" });
  }
});


// Update user (admin only)
router.put("/users/:id", [verifyToken, isAdmin], async (req, res) => {
  try {
    const { username, email } = req.body

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { username, email },
      { new: true, fields: { password: 0 } },
    ).populate("roles")

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" })
    }

    // Transform data for client
    const transformedUser = {
      id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      roles: updatedUser.roles.map((role) => role.name),
      createdAt: updatedUser.createdAt,
    }

    res.json(transformedUser)
  } catch (error) {
    res.status(500).json({ message: "Error updating user" })
  }
})

// Change user role (admin only)
router.patch("/users/:id/role", [verifyToken, isAdmin], async (req, res) => {
  try {
    const { roles } = req.body

    if (!roles || !Array.isArray(roles)) {
      return res.status(400).json({ message: "An array of roles is required" })
    }

    // Get role IDs
    const foundRoles = await Role.find({ name: { $in: roles } })

    if (foundRoles.length === 0) {
      return res.status(400).json({ message: "Invalid roles" })
    }

    const roleIds = foundRoles.map((role) => role._id)

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { roles: roleIds },
      { new: true, fields: { password: 0 } },
    ).populate("roles")

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" })
    }

    // Transform data for client
    const transformedUser = {
      id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      roles: updatedUser.roles.map((role) => role.name),
      createdAt: updatedUser.createdAt,
    }

    res.json(transformedUser)
  } catch (error) {
    res.status(500).json({ message: "Error changing user role" })
  }
})

// Delete user (admin only)
router.delete("/users/:id", [verifyToken, isAdmin], async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id)

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json({ message: "User successfully deleted" })
  } catch (error) {
    res.status(500).json({ message: "Error deleting user" })
  }
})

module.exports = router
