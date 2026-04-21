import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../../middlewares/requireAuth";
import { validate } from "../../../middlewares/validate";
import {
  addClinicService,
  deleteClinicService,
  getClinicPublic,
  getWorkingHours,
  listClinicServices,
  listClinics,
  putWorkingHours,
  updateClinic,
} from "../../../services/clinicService";
import { AppointmentStatus } from "@prisma/client";
import { listClinicAppointments } from "../../../services/appointmentService";

export const clinicsRouter = Router();

// Public
clinicsRouter.get(
  "/",
  async (req, res, next) => {
    try {
      const query = z
        .object({
          page: z.coerce.number().int().positive().default(1),
          pageSize: z.coerce.number().int().positive().max(100).default(20),
          q: z.string().optional(),
          service: z.string().optional(),
        })
        .parse(req.query);
      const { page, pageSize, q, service } = query;
      const result = await listClinics({ page, pageSize, q, service });
      res.json(result);
    } catch (e) {
      next(e);
    }
  },
);

clinicsRouter.get(
  "/:id",
  validate({ params: z.object({ id: z.string().uuid() }) }),
  async (req, res, next) => {
    try {
      const clinic = await getClinicPublic(String(req.params.id));
      res.json({ clinic });
    } catch (e) {
      next(e);
    }
  },
);

clinicsRouter.get(
  "/:id/services",
  validate({ params: z.object({ id: z.string().uuid() }) }),
  async (req, res, next) => {
    try {
      const items = await listClinicServices(String(req.params.id));
      res.json({ items });
    } catch (e) {
      next(e);
    }
  },
);

// Management (staff/admin)
clinicsRouter.patch(
  "/:id",
  requireAuth,
  validate({
    params: z.object({ id: z.string().uuid() }),
    body: z
      .object({
        name: z.string().min(1).optional(),
        address: z.string().min(1).optional(),
        phone: z.string().min(1).optional(),
        description: z.string().min(1).optional(),
        openHoursText: z.string().min(1).optional(),
        coverImageUrl: z.string().url().nullable().optional(),
        latitude: z.coerce.number().nullable().optional(),
        longitude: z.coerce.number().nullable().optional(),
        status: z.enum(["draft", "active", "suspended"]).optional(),
      })
      .strict(),
  }),
  async (req, res, next) => {
    try {
      const clinic = await updateClinic({
        clinicId: String(req.params.id),
        userId: req.auth!.userId,
        roles: req.auth!.roles,
        data: req.body,
      });
      res.json({ clinic });
    } catch (e) {
      next(e);
    }
  },
);

clinicsRouter.post(
  "/:id/services",
  requireAuth,
  validate({
    params: z.object({ id: z.string().uuid() }),
    body: z.object({ name: z.string().min(1) }).strict(),
  }),
  async (req, res, next) => {
    try {
      const service = await addClinicService({
        clinicId: String(req.params.id),
        userId: req.auth!.userId,
        roles: req.auth!.roles,
        name: req.body.name,
      });
      res.status(201).json({ service });
    } catch (e) {
      next(e);
    }
  },
);

clinicsRouter.delete(
  "/:id/services/:serviceId",
  requireAuth,
  validate({ params: z.object({ id: z.string().uuid(), serviceId: z.string().uuid() }) }),
  async (req, res, next) => {
    try {
      await deleteClinicService({
        clinicId: String(req.params.id),
        userId: req.auth!.userId,
        roles: req.auth!.roles,
        serviceId: String(req.params.serviceId),
      });
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  },
);

clinicsRouter.get(
  "/:id/working-hours",
  requireAuth,
  validate({ params: z.object({ id: z.string().uuid() }) }),
  async (req, res, next) => {
    try {
      const items = await getWorkingHours({
        clinicId: String(req.params.id),
        userId: req.auth!.userId,
        roles: req.auth!.roles,
      });
      res.json({ items });
    } catch (e) {
      next(e);
    }
  },
);

clinicsRouter.put(
  "/:id/working-hours",
  requireAuth,
  validate({
    params: z.object({ id: z.string().uuid() }),
    body: z
      .object({
        items: z.array(
          z
            .object({
              dayOfWeek: z.number().int().min(0).max(6),
              isClosed: z.boolean(),
              openTime: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
              closeTime: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
            })
            .strict(),
        ),
      })
      .strict(),
  }),
  async (req, res, next) => {
    try {
      const items = await putWorkingHours({
        clinicId: String(req.params.id),
        userId: req.auth!.userId,
        roles: req.auth!.roles,
        items: req.body.items,
      });
      res.json({ items });
    } catch (e) {
      next(e);
    }
  },
);

// Staff scope appointments (matches spec: GET /clinics/:clinicId/appointments)
clinicsRouter.get(
  "/:id/appointments",
  requireAuth,
  validate({
    params: z.object({ id: z.string().uuid() }),
    query: z.object({
      date: z.coerce.date().optional(),
      status: z.nativeEnum(AppointmentStatus).optional(),
    }),
  }),
  async (req, res, next) => {
    try {
      const items = await listClinicAppointments({
        clinicId: String(req.params.id),
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

