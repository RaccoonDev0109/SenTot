import bcrypt from "bcryptjs";
import { prisma } from "../db/prisma";
import { ApiError } from "../utils/errors";
import { newId, sha256 } from "../utils/crypto";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt";
import { env } from "../config/env";
import { parseDurationToMs } from "../utils/duration";

async function getUserRoles(userId: string): Promise<string[]> {
  const rows = await prisma.userRole.findMany({
    where: { userId },
    include: { role: true },
  });
  return rows.map((r) => r.role.code);
}

export async function registerUser(input: {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}) {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: input.email }, { phone: input.phone }] },
    select: { id: true },
  });
  if (existing) {
    throw new ApiError({ code: "CONFLICT", status: 409, message: "Email or phone already exists" });
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  const customerRole = await prisma.role.findUnique({ where: { code: "customer" } });
  if (!customerRole) {
    throw new ApiError({
      code: "INTERNAL_ERROR",
      status: 500,
      message: "Roles not seeded (missing customer role)",
    });
  }

  const user = await prisma.user.create({
    data: {
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      passwordHash,
      roles: { create: [{ roleId: customerRole.id }] },
      settings: { create: {} },
    },
    select: { id: true, fullName: true, email: true, phone: true, avatarUrl: true, createdAt: true },
  });

  return user;
}

export async function login(input: { email: string; password: string }) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true, fullName: true, email: true, phone: true, avatarUrl: true, status: true, passwordHash: true },
  });
  if (!user) {
    throw new ApiError({ code: "UNAUTHORIZED", status: 401, message: "Invalid credentials" });
  }
  if (user.status !== "active") {
    throw new ApiError({ code: "FORBIDDEN", status: 403, message: "User is locked" });
  }

  const ok = await bcrypt.compare(input.password, user.passwordHash);
  if (!ok) {
    throw new ApiError({ code: "UNAUTHORIZED", status: 401, message: "Invalid credentials" });
  }

  const roles = await getUserRoles(user.id);
  const accessToken = signAccessToken({ sub: user.id, roles });

  const refreshTokenId = newId();
  const refreshToken = signRefreshToken({ sub: user.id, jti: refreshTokenId });

  const expiresAt = new Date(Date.now() + parseDurationToMs(env.JWT_REFRESH_TTL));
  await prisma.refreshToken.create({
    data: {
      id: refreshTokenId,
      userId: user.id,
      tokenHash: sha256(refreshToken),
      expiresAt,
    },
  });

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, fullName: user.fullName, email: user.email, phone: user.phone, avatarUrl: user.avatarUrl },
  };
}

export async function refresh(input: { refreshToken: string }) {
  let payload: { sub: string; jti: string };
  try {
    payload = verifyRefreshToken(input.refreshToken);
  } catch {
    throw new ApiError({ code: "UNAUTHORIZED", status: 401, message: "Invalid refresh token" });
  }

  const row = await prisma.refreshToken.findUnique({ where: { id: payload.jti } });
  if (!row || row.userId !== payload.sub) {
    throw new ApiError({ code: "UNAUTHORIZED", status: 401, message: "Invalid refresh token" });
  }
  if (row.revokedAt) {
    throw new ApiError({ code: "UNAUTHORIZED", status: 401, message: "Refresh token revoked" });
  }
  if (row.expiresAt.getTime() < Date.now()) {
    throw new ApiError({ code: "UNAUTHORIZED", status: 401, message: "Refresh token expired" });
  }
  if (row.tokenHash !== sha256(input.refreshToken)) {
    throw new ApiError({ code: "UNAUTHORIZED", status: 401, message: "Invalid refresh token" });
  }

  // Rotation: revoke old + issue new
  await prisma.refreshToken.update({
    where: { id: row.id },
    data: { revokedAt: new Date() },
  });

  const roles = await getUserRoles(payload.sub);
  const accessToken = signAccessToken({ sub: payload.sub, roles });

  const newRefreshTokenId = newId();
  const newRefreshToken = signRefreshToken({ sub: payload.sub, jti: newRefreshTokenId });
  const expiresAt = new Date(Date.now() + parseDurationToMs(env.JWT_REFRESH_TTL));
  await prisma.refreshToken.create({
    data: {
      id: newRefreshTokenId,
      userId: payload.sub,
      tokenHash: sha256(newRefreshToken),
      expiresAt,
    },
  });

  return { accessToken, refreshToken: newRefreshToken };
}

export async function logout(input: { refreshToken: string }) {
  let payload: { sub: string; jti: string };
  try {
    payload = verifyRefreshToken(input.refreshToken);
  } catch {
    return;
  }

  await prisma.refreshToken.updateMany({
    where: { id: payload.jti, userId: payload.sub, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

