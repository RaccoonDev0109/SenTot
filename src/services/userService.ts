import bcrypt from "bcryptjs";
import { prisma } from "../db/prisma";
import { ApiError } from "../utils/errors";

export async function requireActiveUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, status: true, fullName: true, email: true, phone: true, avatarUrl: true, createdAt: true },
  });
  if (!user) throw new ApiError({ code: "UNAUTHORIZED", status: 401, message: "Unauthorized" });
  if (user.status !== "active") throw new ApiError({ code: "FORBIDDEN", status: 403, message: "User is locked" });
  return user;
}

export async function updateProfile(userId: string, input: { fullName?: string; phone?: string; avatarUrl?: string }) {
  await requireActiveUser(userId);

  if (input.phone) {
    const existing = await prisma.user.findFirst({
      where: { phone: input.phone, id: { not: userId } },
      select: { id: true },
    });
    if (existing) throw new ApiError({ code: "CONFLICT", status: 409, message: "Phone already exists" });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}),
    },
    select: { id: true, fullName: true, email: true, phone: true, avatarUrl: true, createdAt: true },
  });
  return user;
}

export async function changePassword(userId: string, input: { currentPassword: string; newPassword: string }) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, status: true, passwordHash: true },
  });
  if (!user) throw new ApiError({ code: "UNAUTHORIZED", status: 401, message: "Unauthorized" });
  if (user.status !== "active") throw new ApiError({ code: "FORBIDDEN", status: 403, message: "User is locked" });

  const ok = await bcrypt.compare(input.currentPassword, user.passwordHash);
  if (!ok) throw new ApiError({ code: "UNAUTHORIZED", status: 401, message: "Invalid current password" });

  const passwordHash = await bcrypt.hash(input.newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

  // revoke all refresh tokens after password change
  await prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
}

