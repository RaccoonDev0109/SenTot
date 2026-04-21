import { AppointmentStatus, Prisma } from "@prisma/client";
import { prisma } from "../db/prisma";
import { ApiError } from "../utils/errors";

function isUpcoming(d: Date) {
  return d.getTime() >= Date.now();
}

async function assertCanAccessAppointment(opts: { appointmentId: string; userId: string; roles: string[] }) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: opts.appointmentId },
    include: { pet: true },
  });
  if (!appointment) throw new ApiError({ code: "NOT_FOUND", status: 404, message: "Appointment not found" });

  if (opts.roles.includes("admin")) return appointment;

  if (opts.roles.includes("clinic_staff")) {
    const staff = await prisma.clinicStaff.findUnique({
      where: { clinicId_userId: { clinicId: appointment.clinicId, userId: opts.userId } },
    });
    if (staff) return appointment;
  }

  if (appointment.pet.ownerId === opts.userId) return appointment;

  throw new ApiError({ code: "FORBIDDEN", status: 403, message: "Forbidden" });
}

async function assertCustomerOwnsPet(userId: string, petId: string) {
  const pet = await prisma.pet.findUnique({ where: { id: petId }, select: { id: true, ownerId: true } });
  if (!pet) throw new ApiError({ code: "NOT_FOUND", status: 404, message: "Pet not found" });
  if (pet.ownerId !== userId) throw new ApiError({ code: "FORBIDDEN", status: 403, message: "Forbidden" });
  return pet;
}

async function assertClinicActive(clinicId: string) {
  const clinic = await prisma.clinic.findUnique({ where: { id: clinicId }, select: { id: true, status: true } });
  if (!clinic || clinic.status !== "active") {
    throw new ApiError({ code: "NOT_FOUND", status: 404, message: "Clinic not found" });
  }
  return clinic;
}

async function validateWorkingHours(clinicId: string, dateTime: Date) {
  const dayOfWeek = dateTime.getUTCDay();
  const wh = await prisma.clinicWorkingHour.findFirst({ where: { clinicId, dayOfWeek } });
  if (!wh) return; // phase 1: no working hours configured => skip strict validation
  if (wh.isClosed) throw new ApiError({ code: "CONFLICT", status: 409, message: "Clinic is closed at that day" });

  if (!wh.openTime || !wh.closeTime) return;
  const hm = (d: Date) => d.getUTCHours() * 60 + d.getUTCMinutes();
  const slot = hm(dateTime);
  const open = hm(wh.openTime);
  const close = hm(wh.closeTime);
  if (slot < open || slot >= close) {
    throw new ApiError({ code: "CONFLICT", status: 409, message: "Outside clinic working hours" });
  }
}

export async function createAppointment(opts: {
  userId: string;
  roles: string[];
  petId: string;
  clinicId: string;
  dateTime: Date;
  notes?: string;
}) {
  if (opts.dateTime.getTime() < Date.now()) {
    throw new ApiError({ code: "CONFLICT", status: 409, message: "Cannot book in the past" });
  }

  if (!opts.roles.includes("admin")) {
    await assertCustomerOwnsPet(opts.userId, opts.petId);
  }
  await assertClinicActive(opts.clinicId);
  await validateWorkingHours(opts.clinicId, opts.dateTime);

  try {
    const appointment = await prisma.appointment.create({
      data: {
        petId: opts.petId,
        clinicId: opts.clinicId,
        dateTime: opts.dateTime,
        notes: opts.notes,
        status: "pending",
      },
      include: { pet: true, clinic: true },
    });

    await prisma.notification.create({
      data: {
        userId: appointment.pet.ownerId,
        type: "appointment",
        title: "Đã tạo lịch hẹn",
        body: `Lịch hẹn của bạn đang chờ xác nhận.`,
        data: { appointmentId: appointment.id, clinicId: appointment.clinicId },
      },
    });

    return appointment;
  } catch (e) {
    const pe = e as Prisma.PrismaClientKnownRequestError;
    if (pe.code === "P2002") {
      throw new ApiError({ code: "CONFLICT", status: 409, message: "Timeslot already booked" });
    }
    throw e;
  }
}

export async function listMyAppointments(opts: { userId: string; filter?: "upcoming" | "past" }) {
  const where: any = { pet: { ownerId: opts.userId } };
  if (opts.filter === "upcoming") where.dateTime = { gte: new Date() };
  if (opts.filter === "past") where.dateTime = { lt: new Date() };

  return prisma.appointment.findMany({
    where,
    orderBy: { dateTime: "desc" },
    include: { clinic: true, pet: true },
  });
}

export async function listClinicAppointments(opts: {
  clinicId: string;
  userId: string;
  roles: string[];
  date?: Date;
  status?: AppointmentStatus;
}) {
  if (!opts.roles.includes("admin")) {
    const staff = await prisma.clinicStaff.findUnique({ where: { clinicId_userId: { clinicId: opts.clinicId, userId: opts.userId } } });
    if (!staff) throw new ApiError({ code: "FORBIDDEN", status: 403, message: "Forbidden" });
  }

  const where: any = { clinicId: opts.clinicId };
  if (opts.status) where.status = opts.status;
  if (opts.date) {
    const start = new Date(Date.UTC(opts.date.getUTCFullYear(), opts.date.getUTCMonth(), opts.date.getUTCDate(), 0, 0, 0));
    const end = new Date(Date.UTC(opts.date.getUTCFullYear(), opts.date.getUTCMonth(), opts.date.getUTCDate(), 23, 59, 59));
    where.dateTime = { gte: start, lte: end };
  }

  return prisma.appointment.findMany({ where, orderBy: { dateTime: "asc" }, include: { pet: true } });
}

function assertTransition(from: AppointmentStatus, action: string): AppointmentStatus {
  switch (action) {
    case "confirm":
      if (from !== "pending") throw new ApiError({ code: "CONFLICT", status: 409, message: "Invalid status transition" });
      return "confirmed";
    case "cancel":
      if (from === "completed" || from === "cancelled") throw new ApiError({ code: "CONFLICT", status: 409, message: "Invalid status transition" });
      return "cancelled";
    case "complete":
      if (from !== "confirmed") throw new ApiError({ code: "CONFLICT", status: 409, message: "Invalid status transition" });
      return "completed";
    case "no_show":
      if (from !== "confirmed") throw new ApiError({ code: "CONFLICT", status: 409, message: "Invalid status transition" });
      return "no_show";
    case "reschedule":
      if (from !== "confirmed") throw new ApiError({ code: "CONFLICT", status: 409, message: "Invalid status transition" });
      return "confirmed";
    default:
      throw new ApiError({ code: "VALIDATION_ERROR", status: 400, message: "Unknown action" });
  }
}

export async function updateAppointmentStatus(opts: {
  appointmentId: string;
  actorUserId: string;
  roles: string[];
  action: "confirm" | "cancel" | "reschedule" | "complete" | "no_show";
  dateTime?: Date;
  reason?: string;
}) {
  const appointment = await assertCanAccessAppointment({
    appointmentId: opts.appointmentId,
    userId: opts.actorUserId,
    roles: opts.roles,
  });

  // permission narrowing: customer can only cancel own appointment (and only upcoming)
  const isOwner = appointment.pet.ownerId === opts.actorUserId;
  const isAdmin = opts.roles.includes("admin");
  const isClinicStaff = opts.roles.includes("clinic_staff");
  if (!isAdmin) {
    if (opts.action === "confirm" || opts.action === "complete" || opts.action === "no_show" || opts.action === "reschedule") {
      if (!isClinicStaff) throw new ApiError({ code: "FORBIDDEN", status: 403, message: "Forbidden" });
    }
    if (opts.action === "cancel" && !isOwner && !isClinicStaff) {
      throw new ApiError({ code: "FORBIDDEN", status: 403, message: "Forbidden" });
    }
  }

  if (opts.action === "cancel" && !isUpcoming(appointment.dateTime)) {
    throw new ApiError({ code: "CONFLICT", status: 409, message: "Cannot cancel past appointment" });
  }

  const nextStatus = assertTransition(appointment.status, opts.action);

  if (opts.action === "reschedule") {
    if (!opts.dateTime) throw new ApiError({ code: "VALIDATION_ERROR", status: 400, message: "dateTime is required for reschedule" });
    if (opts.dateTime.getTime() < Date.now()) throw new ApiError({ code: "CONFLICT", status: 409, message: "Cannot reschedule to past" });
    await validateWorkingHours(appointment.clinicId, opts.dateTime);
  }

  try {
    const updated = await prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        status: nextStatus,
        ...(opts.action === "reschedule" ? { dateTime: opts.dateTime! } : {}),
        ...(opts.action === "cancel"
          ? { cancelReason: opts.reason ?? null, cancelledAt: new Date() }
          : {}),
      },
      include: { pet: true },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: opts.actorUserId,
        action: `APPOINTMENT_${opts.action.toUpperCase()}`,
        entityType: "appointment",
        entityId: updated.id,
        metadata: { from: appointment.status, to: updated.status, reason: opts.reason, dateTime: updated.dateTime },
      },
    });

    await prisma.notification.create({
      data: {
        userId: updated.pet.ownerId,
        type: "appointment",
        title: "Cập nhật lịch hẹn",
        body: `Trạng thái lịch hẹn đã được cập nhật: ${updated.status}.`,
        data: { appointmentId: updated.id },
      },
    });

    return updated;
  } catch (e) {
    const pe = e as Prisma.PrismaClientKnownRequestError;
    if (pe.code === "P2002") {
      throw new ApiError({ code: "CONFLICT", status: 409, message: "Timeslot already booked" });
    }
    throw e;
  }
}

