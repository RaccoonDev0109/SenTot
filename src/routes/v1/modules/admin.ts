import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../../middlewares/requireAuth";
import { requireRole } from "../../../middlewares/requireRole";
import { validate } from "../../../middlewares/validate";
import { adminListUsers, adminSetUserRoles, adminSetUserStatus } from "../../../services/adminUserService";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole("admin"));

adminRouter.get(
  "/users",
  async (req, res, next) => {
    try {
      const query = z
        .object({
          page: z.coerce.number().int().positive().default(1),
          pageSize: z.coerce.number().int().positive().max(100).default(20),
          q: z.string().optional(),
        })
        .parse(req.query);
      const { page, pageSize, q } = query;
      const result = await adminListUsers({ page, pageSize, q });
      res.json(result);
    } catch (e) {
      next(e);
    }
  },
);

adminRouter.patch(
  "/users/:id/status",
  validate({
    params: z.object({ id: z.string().uuid() }),
    body: z.object({ status: z.enum(["active", "locked"]) }).strict(),
  }),
  async (req, res, next) => {
    try {
      await adminSetUserStatus({
        actorUserId: req.auth!.userId,
        userId: String(req.params.id),
        status: req.body.status,
      });
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  },
);

adminRouter.put(
  "/users/:id/roles",
  validate({
    params: z.object({ id: z.string().uuid() }),
    body: z.object({ roles: z.array(z.string().min(1)).min(1) }).strict(),
  }),
  async (req, res, next) => {
    try {
      await adminSetUserRoles({
        actorUserId: req.auth!.userId,
        userId: String(req.params.id),
        roleCodes: req.body.roles,
      });
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  },
);

