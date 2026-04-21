import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../../middlewares/requireAuth";
import { validate } from "../../../middlewares/validate";
import { listNotifications, markAllRead, markRead } from "../../../services/notificationService";

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

notificationsRouter.get(
  "/",
  async (req, res, next) => {
    try {
      const query = z
        .object({
          page: z.coerce.number().int().positive().default(1),
          pageSize: z.coerce.number().int().positive().max(100).default(20),
        })
        .parse(req.query);
      const { page, pageSize } = query;
      const result = await listNotifications(req.auth!.userId, { page, pageSize });
      res.json(result);
    } catch (e) {
      next(e);
    }
  },
);

notificationsRouter.post("/mark-all-read", async (req, res, next) => {
  try {
    await markAllRead(req.auth!.userId);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

notificationsRouter.post(
  "/:id/read",
  validate({ params: z.object({ id: z.string().uuid() }) }),
  async (req, res, next) => {
    try {
      await markRead(req.auth!.userId, String(req.params.id));
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  },
);

