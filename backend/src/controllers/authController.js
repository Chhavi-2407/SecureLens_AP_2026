
import { OAuth2Client } from "google-auth-library";
import authService from "../services/authService.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }

    const result = await authService.registerUser({
      name,
      email: email.toLowerCase().trim(),
      password,
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: result,
    });
  } catch (error) {
    console.error("Registration error:", error);

    if (error.message === "User with this email already exists") {
      return res.status(409).json({ success: false, message: error.message });
    }

    return res.status(500).json({
      success: false,
      message: "Something went wrong during registration",
    });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const result = await authService.loginUser({
      email: email.toLowerCase().trim(),
      password,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    console.error("Login error:", error);

    if (error.message === "Invalid email or password") {
      return res.status(401).json({ success: false, message: error.message });
    }

    return res.status(500).json({
      success: false,
      message: "Something went wrong during login",
    });
  }
}

async function googleLogin(req, res) {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: "Google credential is required",
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload?.email || payload.email_verified !== true) {
      return res.status(401).json({
        success: false,
        message: "Google account email is not verified",
      });
    }

    const result = await authService.googleLoginUser({
      email: payload.email.toLowerCase().trim(),
      name: payload.name || payload.email.split("@")[0],
    });

    return res.status(200).json({
      success: true,
      message: "Google login successful",
      data: result,
    });
  } catch (error) {
    console.error("Google login error:", error);

    return res.status(401).json({
      success: false,
      message: "Google authentication failed",
    });
  }
}


async function getMe(req, res) {
  try {
    const user = await authService.getUserProfile(req.user.userId);

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get profile error:", error);

    return res.status(404).json({
      success: false,
      message: "Unable to fetch user profile",
    });
  }
}

async function updateProfile(req, res) {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    if (name.trim().length > 100) {
      return res.status(400).json({
        success: false,
        message: "Name cannot exceed 100 characters",
      });
    }

    const user = await authService.updateUserProfile(
      req.user.userId,
      { name }
    );

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: user,
    });
  } catch (error) {
    console.error("Profile update error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update profile",
    });
  }
}

async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current and new passwords are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters",
      });
    }

    await authService.changeUserPassword(
      req.user.userId,
      { currentPassword, newPassword }
    );

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Password change error:", error);

    if (error.message === "Current password is incorrect") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to change password",
    });
  }
}
async function updateNotifications(req, res) {
  try {
    const { scanNotifications } = req.body;

    if (typeof scanNotifications !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "scanNotifications must be a boolean",
      });
    }

    const user = await authService.updateNotificationPreference(
      req.user.userId,
      scanNotifications
    );

    return res.status(200).json({
      success: true,
      message: "Notification preferences updated",
      data: user,
    });
  } catch (error) {
    console.error("Notification update error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update notification preferences",
    });
  }
}

export default {
  register,
  login,
  googleLogin,
  getMe,
  updateProfile,
  changePassword,
  updateNotifications,
};