import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../../middlewares/requireAuth";
import { validate } from "../../../middlewares/validate";
import { changePassword, requireActiveUser, updateProfile } from "../../../services/userService";

export const meRouter = Router();

meRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const user = await requireActiveUser(req.auth!.userId);
    res.json({ user });
  } catch (e) {
    next(e);
  }
});

meRouter.patch(
  "/",
  requireAuth,
  validate({
    body: z
      .object({
        fullName: z.string().min(1).optional(),
        phone: z.string().min(6).optional(),
        avatarUrl: z.string().url().optional(),
      })
      .strict(),
  }),
  async (req, res, next) => {
    try {
      const user = await updateProfile(req.auth!.userId, req.body);
      res.json({ user });
    } catch (e) {
      next(e);
    }
  },
);

meRouter.patch(
  "/password",
  requireAuth,
  validate({
    body: z
      .object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(6),
      })
      .strict(),
  }),
  async (req, res, next) => {
    try {
      await changePassword(req.auth!.userId, req.body);
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  },
);

