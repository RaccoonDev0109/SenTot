import { prisma } from "../db/prisma";
import { ApiError } from "../utils/errors";

export async function adminListUsers(opts: { page: number; pageSize: number; q?: string }) {
  const skip = (opts.page - 1) * opts.pageSize;
  const where = opts.q
    ? {
        OR: [
          { fullName: { contains: opts.q, mode: "insensitive" as const } },
          { email: { contains: opts.q, mode: "insensitive" as const } },
          { phone: { contains: opts.q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: opts.pageSize,
      orderBy: { createdAt: "desc" },
      select: { id: true, fullName: true, email: true, phone: true, status: true, createdAt: true },
    }),
    prisma.user.count({ where }),
  ]);

  return { items, total, page: opts.page, pageSize: opts.pageSize };
}

export async function adminSetUserStatus(opts: { actorUserId: string; userId: string; status: "active" | "locked" }) {
  const user = await prisma.user.findUnique({ where: { id: opts.userId }, select: { id: true } });
  if (!user) throw new ApiError({ code: "NOT_FOUND", status: 404, message: "User not found" });

  await prisma.user.update({ where: { id: opts.userId }, data: { status: opts.status } });

  await prisma.auditLog.create({
    data: {
      actorUserId: opts.actorUserId,
      action: opts.status === "locked" ? "USER_LOCKED" : "USER_UNLOCKED",
      entityType: "user",
      entityId: opts.userId,
    },
  });

  if (opts.status === "locked") {
    await prisma.refreshToken.updateMany({ where: { userId: opts.userId, revokedAt: null }, data: { revokedAt: new Date() } });
  }
}

export async function adminSetUserRoles(opts: { actorUserId: string; userId: string; roleCodes: string[] }) {
  const user = await prisma.user.findUnique({ where: { id: opts.userId }, select: { id: true } });
  if (!user) throw new ApiError({ code: "NOT_FOUND", status: 404, message: "User not found" });

  const roles = await prisma.role.findMany({ where: { code: { in: opts.roleCodes } } });
  if (roles.length !== opts.roleCodes.length) {
    throw new ApiError({ code: "VALIDATION_ERROR", status: 400, message: "Unknown role code(s)" });
  }

  await prisma.$transaction([
    prisma.userRole.deleteMany({ where: { userId: opts.userId } }),
    prisma.userRole.createMany({ data: roles.map((r) => ({ userId: opts.userId, roleId: r.id })) }),
    prisma.auditLog.create({
      data: {
        actorUserId: opts.actorUserId,
        action: "USER_ROLES_UPDATED",
        entityType: "user",
        entityId: opts.userId,
        metadata: { roles: opts.roleCodes },
      },
    }),
  ]);
}

