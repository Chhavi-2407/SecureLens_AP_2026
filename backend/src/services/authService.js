
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { randomBytes } from "crypto";
import prisma from "../config/database.js";

function createToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function formatUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    scanNotifications: user.scanNotifications,
    createdAt: user.createdAt,
  };
}

async function registerUser({ name, email, password }) {
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { name, email, passwordHash },
  });

  return { user: formatUser(user), token: createToken(user) };
}

async function loginUser({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) throw new Error("Invalid email or password");

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatch) throw new Error("Invalid email or password");

  return { user: formatUser(user), token: createToken(user) };
}

async function googleLoginUser({ email, name }) {
  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    // Google-only accounts receive a random, unusable local password.
    const randomPassword = randomBytes(48).toString("hex");
    const passwordHash = await bcrypt.hash(randomPassword, 12);

    user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
    });
  }

  return { user: formatUser(user), token: createToken(user) };
}

async function getUserProfile(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return formatUser(user);
}

async function updateUserProfile(userId, { name }) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { name: name.trim() },
  });

  return formatUser(user);
}

async function changeUserPassword(userId, { currentPassword, newPassword }) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const passwordMatch = await bcrypt.compare(
    currentPassword,
    user.passwordHash
  );

  if (!passwordMatch) {
    throw new Error("Current password is incorrect");
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  return true;
}
async function updateNotificationPreference(userId, enabled) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      scanNotifications: enabled,
    },
  });

  return formatUser(user);
}


export default {
  registerUser,
  loginUser,
  googleLoginUser,
  getUserProfile,
  updateUserProfile,
  changeUserPassword,
  updateNotificationPreference,
};