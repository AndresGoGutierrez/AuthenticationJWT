import { Router } from "express"
const router = Router()

import * as userCtrl from "../controllers/user.controller"
import { authJwt, verifySignup } from "../middlewares"

// Create a new user (admin only)
router.post("/", [authJwt.verifyToken, authJwt.isAdmin, verifySignup.checkRolesExisted], userCtrl.createUser)

// Get all users (admin only)
router.get(
  "/",
  [
    authJwt.verifyToken, // only authenticated users
    authJwt.isAdmin,     // only administrators
  ],
  userCtrl.getUsers,
)

// Get a specific user (admin only)
router.get("/:userId", [authJwt.verifyToken, authJwt.isAdmin], userCtrl.getUserById)

// Update a user (admin only)
router.put("/:userId", [authJwt.verifyToken, authJwt.isAdmin], userCtrl.updateUser)

// Delete a user (admin only)
router.delete("/:userId", [authJwt.verifyToken, authJwt.isAdmin], userCtrl.deleteUser)

// Change a user's role (admin only)
router.patch("/:userId/role", [authJwt.verifyToken, authJwt.isAdmin], userCtrl.changeUserRole)

export default router
