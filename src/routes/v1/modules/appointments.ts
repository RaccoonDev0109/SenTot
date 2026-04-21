import { Router } from "express";
import { z } from "zod";
import { AppointmentStatus } from "@prisma/client";
import { requireAuth } from "../../../middlewares/requireAuth";
import { validate } from "../../../middlewares/validate";
import { createAppointment, listClinicAppointments, listMyAppointments, updateAppointmentStatus } from "../../../services/appointmentService";

export const appointmentsRouter = Router();

appointmentsRouter.use(requireAuth);

appointmentsRouter.post(
  "/",
  validate({
    body: z
      .object({
        petId: z.string().uuid(),
        clinicId: z.string().uuid(),
        dateTime: z.coerce.date(),
        notes: z.string().optional(),
      })
      .strict(),
  }),
  async (req, res, next) => {
    try {
      const appointment = await createAppointment({
        userId: req.auth!.userId,
        roles: req.auth!.roles,
        ...req.body,
      });
      res.status(201).json({ appointment });
    } catch (e) {
      next(e);
    }
  },
);

appointmentsRouter.get(
  "/",
  validate({
    query: z.object({
      filter: z.enum(["upcoming", "past"]).optional(),
    }),
  }),
  async (req, res, next) => {
    try {
      const items = await listMyAppointments({ userId: req.auth!.userId, filter: req.query.filter as any });
      res.json({ items });
    } catch (e) {
      next(e);
    }
  },
);

appointmentsRouter.get(
  "/clinics/:clinicId",
  validate({
    params: z.object({ clinicId: z.string().uuid() }),
    query: z.object({
      date: z.coerce.date().optional(),
      status: z.nativeEnum(AppointmentStatus).optional(),
    }),
  }),
  async (req, res, next) => {
    try {
      const items = await listClinicAppointments({
        clinicId: String(req.params.clinicId),
        userId: req.auth!.userId,
        roles: req.auth!.roles,
        date: req.query.date as any,
        status: req.query.status as any,
      });
      res.json({ items });
    } catch (e) {
      next(e);
    }
  },
);

appointmentsRouter.patch(
  "/:id/status",
  validate({
    params: z.object({ id: z.string().uuid() }),
    body: z
      .object({
        action: z.enum(["confirm", "cancel", "reschedule", "complete", "no_show"]),
        dateTime: z.coerce.date().optional(),
        reason: z.string().optional(),
      })
      .strict(),
  }),
  async (req, res, next) => {
    try {
      const appointment = await updateAppointmentStatus({
        appointmentId: String(req.params.id),
        actorUserId: req.auth!.userId,
        roles: req.auth!.roles,
        action: req.body.action,
        dateTime: req.body.dateTime,
        reason: req.body.reason,
      });
      res.json({ appointment });
    } catch (e) {
      next(e);
    }
  },
);

