import { prisma } from "../db/prisma";

export async function listNotifications(userId: string, opts: { page: number; pageSize: number }) {
  const skip = (opts.page - 1) * opts.pageSize;
  const [items, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take: opts.pageSize,
    }),
    prisma.notification.count({ where: { userId } }),
  ]);
  return { items, total, page: opts.page, pageSize: opts.pageSize };
}

export async function markAllRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}

export async function markRead(userId: string, notificationId: string) {
  await prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { readAt: new Date() },
  });
}

