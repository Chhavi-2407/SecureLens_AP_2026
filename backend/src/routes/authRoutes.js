import express from "express";
import authController from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/me", authMiddleware, authController.getMe);

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/google", authController.googleLogin);

router.put("/profile", authMiddleware, authController.updateProfile);
router.post("/change-password", authMiddleware, authController.changePassword);
router.put(
  "/notifications",
  authMiddleware,
  authController.updateNotifications
);

export default router;