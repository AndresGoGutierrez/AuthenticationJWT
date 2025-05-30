import jwt from "jsonwebtoken"
import config from "../config"
import User from "../models/User"

export const verifyToken = async (req, res, next) => {
  try {
    // Get the token from the headers
    const token =
      req.headers["x-access-token"] || (req.headers.authorization && req.headers.authorization.split(" ")[1])

    if (!token) {
      console.log("No token provided")
      return res.status(403).json({ message: "No token provided" })
    }

    console.log("Verifying token...")

    // Verify the token
    const decoded = jwt.verify(token, config.SECRET)
    req.userId = decoded.id

    // Find the user by ID and exclude the password
    const user = await User.findById(req.userId, { password: 0 }).populate("roles")

    if (!user) {
      console.log("User not found")
      return res.status(404).json({ message: "User not found" })
    }

    console.log(`User found: ${user.username}`)

    // Save the user in req for later use
    req.user = user

    next()
  } catch (error) {
    console.error("Error in verifyToken:", error)
    return res.status(401).json({ message: "Unauthorized" })
  }
}

export const isModerator = async (req, res, next) => {
  try {
    // The user should already be in req.user from verifyToken
    if (!req.user) {
      console.log("User not found in req.user")

      // Try to get the user if not in req.user
      if (req.userId) {
        const user = await User.findById(req.userId, { password: 0 }).populate("roles")
        if (!user) {
          return res.status(404).json({ message: "User not found" })
        }
        req.user = user
      } else {
        return res.status(500).json({ message: "Internal server error" })
      }
    }

    // Check if the user has the moderator role
    const roles = req.user.roles
    const isModerator = roles.some((role) => role.name === "moderator")

    if (isModerator) {
      console.log("User is a moderator")
      next()
      return
    }

    console.log("User is not a moderator")
    return res.status(403).json({ message: "Require Moderator role" })
  } catch (error) {
    console.error("Error in isModerator:", error)
    return res.status(500).json({ message: "Error checking moderator role" })
  }
}

export const isAdmin = async (req, res, next) => {
  try {
    // The user should already be in req.user from verifyToken
    if (!req.user) {
      console.log("User not found in req.user")

      // Try to get the user if not in req.user
      if (req.userId) {
        const user = await User.findById(req.userId, { password: 0 }).populate("roles")
        if (!user) {
          return res.status(404).json({ message: "User not found" })
        }
        req.user = user
      } else {
        return res.status(500).json({ message: "Internal server error" })
      }
    }

    // Check if the user has the admin role
    const roles = req.user.roles
    console.log("User roles:", roles)

    const isAdmin = roles.some((role) => role.name === "admin")

    if (isAdmin) {
      console.log("User is an admin")
      next()
      return
    }

    console.log("User is not an admin")
    return res.status(403).json({ message: "Require Admin role" })
  } catch (error) {
    console.error("Error in isAdmin:", error)
    return res.status(500).json({ message: "Error checking admin role" })
  }
}
