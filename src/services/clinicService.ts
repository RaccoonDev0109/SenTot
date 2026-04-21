import { prisma } from "../db/prisma";
import { ApiError } from "../utils/errors";

export async function listClinics(opts: {
  page: number;
  pageSize: number;
  q?: string;
  service?: string;
}) {
  const skip = (opts.page - 1) * opts.pageSize;

  const where = {
    status: "active" as const,
    AND: [
      opts.q
        ? {
            OR: [
              { name: { contains: opts.q, mode: "insensitive" as const } },
              { address: { contains: opts.q, mode: "insensitive" as const } },
              { services: { some: { name: { contains: opts.q, mode: "insensitive" as const } } } },
            ],
          }
        : {},
      opts.service
        ? { services: { some: { name: { contains: opts.service, mode: "insensitive" as const } } } }
        : {},
    ],
  };

  const [items, total] = await Promise.all([
    prisma.clinic.findMany({
      where,
      skip,
      take: opts.pageSize,
      orderBy: { name: "asc" },
      include: { services: true },
    }),
    prisma.clinic.count({ where }),
  ]);

  return { items, total, page: opts.page, pageSize: opts.pageSize };
}

export async function getClinicPublic(clinicId: string) {
  const clinic = await prisma.clinic.findFirst({
    where: { id: clinicId, status: "active" },
    include: { services: true, workingHours: true, facilities: true, galleryImages: true },
  });
  if (!clinic) throw new ApiError({ code: "NOT_FOUND", status: 404, message: "Clinic not found" });
  return clinic;
}

export async function listClinicServices(clinicId: string) {
  const clinic = await prisma.clinic.findFirst({ where: { id: clinicId, status: "active" }, select: { id: true } });
  if (!clinic) throw new ApiError({ code: "NOT_FOUND", status: 404, message: "Clinic not found" });
  return prisma.clinicService.findMany({ where: { clinicId }, orderBy: { name: "asc" } });
}

async function assertClinicManageAccess(opts: { clinicId: string; userId: string; roles: string[] }) {
  if (opts.roles.includes("admin")) return;
  if (!opts.roles.includes("clinic_staff")) {
    throw new ApiError({ code: "FORBIDDEN", status: 403, message: "Forbidden" });
  }
  const link = await prisma.clinicStaff.findUnique({
    where: { clinicId_userId: { clinicId: opts.clinicId, userId: opts.userId } },
  });
  if (!link) throw new ApiError({ code: "FORBIDDEN", status: 403, message: "Not clinic staff of this clinic" });
}

export async function updateClinic(opts: {
  clinicId: string;
  userId: string;
  roles: string[];
  data: Partial<{
    name: string;
    address: string;
    phone: string;
    description: string;
    openHoursText: string;
    coverImageUrl: string | null;
    latitude: number | null;
    longitude: number | null;
    status: "draft" | "active" | "suspended";
  }>;
}) {
  await assertClinicManageAccess({ clinicId: opts.clinicId, userId: opts.userId, roles: opts.roles });
  const clinic = await prisma.clinic.findUnique({ where: { id: opts.clinicId } });
  if (!clinic) throw new ApiError({ code: "NOT_FOUND", status: 404, message: "Clinic not found" });

  return prisma.clinic.update({ where: { id: opts.clinicId }, data: opts.data });
}

export async function addClinicService(opts: { clinicId: string; userId: string; roles: string[]; name: string }) {
  await assertClinicManageAccess({ clinicId: opts.clinicId, userId: opts.userId, roles: opts.roles });
  try {
    return await prisma.clinicService.create({ data: { clinicId: opts.clinicId, name: opts.name } });
  } catch {
    throw new ApiError({ code: "CONFLICT", status: 409, message: "Service already exists" });
  }
}

export async function deleteClinicService(opts: { clinicId: string; userId: string; roles: string[]; serviceId: string }) {
  await assertClinicManageAccess({ clinicId: opts.clinicId, userId: opts.userId, roles: opts.roles });
  await prisma.clinicService.delete({ where: { id: opts.serviceId } });
}

export async function getWorkingHours(opts: { clinicId: string; userId: string; roles: string[] }) {
  await assertClinicManageAccess({ clinicId: opts.clinicId, userId: opts.userId, roles: opts.roles });
  return prisma.clinicWorkingHour.findMany({ where: { clinicId: opts.clinicId }, orderBy: { dayOfWeek: "asc" } });
}

export async function putWorkingHours(opts: {
  clinicId: string;
  userId: string;
  roles: string[];
  items: Array<{ dayOfWeek: number; isClosed: boolean; openTime?: string | null; closeTime?: string | null }>;
}) {
  await assertClinicManageAccess({ clinicId: opts.clinicId, userId: opts.userId, roles: opts.roles });

  // store times as TIME in db; Prisma accepts Date for @db.Time - we map from HH:mm
  function parseTime(s: string): Date {
    const [hh, mm] = s.split(":").map((x) => Number(x));
    return new Date(Date.UTC(1970, 0, 1, hh, mm, 0));
  }

  const data = opts.items.map((i) => ({
    clinicId: opts.clinicId,
    dayOfWeek: i.dayOfWeek,
    isClosed: i.isClosed,
    openTime: i.isClosed || !i.openTime ? null : parseTime(i.openTime),
    closeTime: i.isClosed || !i.closeTime ? null : parseTime(i.closeTime),
  }));

  await prisma.$transaction([
    prisma.clinicWorkingHour.deleteMany({ where: { clinicId: opts.clinicId } }),
    prisma.clinicWorkingHour.createMany({ data }),
  ]);

  return prisma.clinicWorkingHour.findMany({ where: { clinicId: opts.clinicId }, orderBy: { dayOfWeek: "asc" } });
}

