import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../../middlewares/requireAuth";
import { validate } from "../../../middlewares/validate";
import { deleteVaccination, updateVaccination } from "../../../services/petService";

export const vaccinationsRouter = Router();

vaccinationsRouter.use(requireAuth);

vaccinationsRouter.patch(
  "/:id",
  validate({
    params: z.object({ id: z.string().uuid() }),
    body: z
      .object({
        vaccineName: z.string().min(1).optional(),
        date: z.coerce.date().optional(),
        nextDueDate: z.coerce.date().optional(),
        notes: z.string().nullable().optional(),
      })
      .strict(),
  }),
  async (req, res, next) => {
    try {
      const vaccination = await updateVaccination({
        userId: req.auth!.userId,
        roles: req.auth!.roles,
        vaccinationId: String(req.params.id),
        data: req.body,
      });
      res.json({ vaccination });
    } catch (e) {
      next(e);
    }
  },
);

vaccinationsRouter.delete(
  "/:id",
  validate({ params: z.object({ id: z.string().uuid() }) }),
  async (req, res, next) => {
    try {
      await deleteVaccination({ userId: req.auth!.userId, roles: req.auth!.roles, vaccinationId: String(req.params.id) });
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  },
);

