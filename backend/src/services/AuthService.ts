import bcrypt from "bcryptjs";
import { prisma } from "../infrastructure/prisma.js";
import { signToken } from "../middleware/auth.js";
import { HttpError } from "../middleware/errorHandler.js";

export async function login(email: string, password: string) {
  const user = await prisma.adminUser.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
  if (!user) throw new HttpError(401, "Invalid credentials", "Email or password is incorrect.");

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new HttpError(401, "Invalid credentials", "Email or password is incorrect.");

  const session = signToken({
    id: user.id,
    email: user.email,
    role: user.role as "admin" | "csm",
    name: user.name ?? undefined,
  });

  return {
    ...session,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
  };
}
