import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { validate } from "../../../middlewares/validate";
import { login, logout, refresh, registerUser } from "../../../services/authService";

export const authRouter = Router();

const authLimiter = rateLimit({
  windowMs: 60_000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

authRouter.post(
  "/register",
  authLimiter,
  validate({
    body: z.object({
      fullName: z.string().min(1),
      email: z.string().email(),
      phone: z.string().min(6),
      password: z.string().min(6),
    }),
  }),
  async (req, res, next) => {
    try {
      const user = await registerUser(req.body);
      res.status(201).json({ user });
    } catch (e) {
      next(e);
    }
  },
);

authRouter.post(
  "/login",
  authLimiter,
  validate({
    body: z.object({
      email: z.string().email(),
      password: z.string().min(1),
    }),
  }),
  async (req, res, next) => {
    try {
      const result = await login(req.body);
      res.json(result);
    } catch (e) {
      next(e);
    }
  },
);

authRouter.post(
  "/refresh",
  authLimiter,
  validate({ body: z.object({ refreshToken: z.string().min(1) }) }),
  async (req, res, next) => {
    try {
      const result = await refresh(req.body);
      res.json(result);
    } catch (e) {
      next(e);
    }
  },
);

authRouter.post(
  "/logout",
  validate({ body: z.object({ refreshToken: z.string().min(1) }) }),
  async (req, res, next) => {
    try {
      await logout(req.body);
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  },
);

