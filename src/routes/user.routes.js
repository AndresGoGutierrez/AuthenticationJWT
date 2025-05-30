import { Router } from "express"
const router = Router()

import * as userCtrl from "../controllers/user.controller"
import { authJwt, verifySignup } from "../middlewares"

// Crear un nuevo usuario (solo administradores)
router.post("/", [authJwt.verifyToken, authJwt.isAdmin, verifySignup.checkRolesExisted], userCtrl.createUser)

// Obtener todos los usuarios (solo administradores)
router.get(
  "/",
  [
    authJwt.verifyToken, // sólo usuarios autenticados
    authJwt.isAdmin, // sólo administradores
  ],
  userCtrl.getUsers,
)

// Obtener un usuario específico (solo administradores)
router.get("/:userId", [authJwt.verifyToken, authJwt.isAdmin], userCtrl.getUserById)

// Actualizar un usuario (solo administradores)
router.put("/:userId", [authJwt.verifyToken, authJwt.isAdmin], userCtrl.updateUser)

// Eliminar un usuario (solo administradores)
router.delete("/:userId", [authJwt.verifyToken, authJwt.isAdmin], userCtrl.deleteUser)

// Cambiar el rol de un usuario (solo administradores)
router.patch("/:userId/role", [authJwt.verifyToken, authJwt.isAdmin], userCtrl.changeUserRole)

export default router
