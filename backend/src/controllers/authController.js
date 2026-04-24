import bcrypt from "bcryptjs";
import { prisma } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { signToken } from "../utils/jwt.js";
import { loginSchema, registerSchema } from "../validators/zodSchemas.js";

const authUserSelect = {
  id: true,
  email: true,
  fullName: true,
  phone: true,
  role: true,
  avatarUrl: true,
  bio: true,
  gender: true,
  occupation: true,
  isPhoneVerified: true,
  isIdVerified: true,
  isBanned: true,
  createdAt: true
};

export const register = asyncHandler(async (req, res) => {
  const validatedData = registerSchema.parse(req.body);
  const { email, password, fullName, phone, role = "seeker" } = validatedData;

  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  });
  if (existingUser) {
    return res.status(409).json({ message: "Email already registered" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash: hashedPassword,
      fullName,
      phone,
      role
    },
    select: authUserSelect
  });

  const token = signToken({ userId: user.id, role: user.role });

  return res.status(201).json({
    message: "Registered successfully",
    token,
    user
  });
});

export const login = asyncHandler(async (req, res) => {
  const validatedData = loginSchema.parse(req.body);
  const { email, password } = validatedData;

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  });

  if (!user || user.isBanned) {
    return res.status(401).json({ message: "Invalid credentials or account banned" });
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = signToken({ userId: user.id, role: user.role });

  const safeUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: authUserSelect
  });

  return res.json({
    message: "Logged in successfully",
    token,
    user: safeUser
  });
});

export const me = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: authUserSelect
  });

  return res.json({ user });
});

export const switchRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!["seeker", "host"].includes(role)) {
    return res.status(400).json({ message: "Role must be seeker or host" });
  }

  const updatedUser = await prisma.user.update({
    where: { id: req.user.id },
    data: { role },
    select: authUserSelect
  });

  const token = signToken({ userId: updatedUser.id, role: updatedUser.role });

  return res.json({
    message: "Role switched successfully",
    token,
    user: updatedUser
  });
});
