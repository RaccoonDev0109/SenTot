import type { RequestHandler } from "express";
import { ApiError } from "../utils/errors";

export function requireRole(...allowed: string[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.auth) {
      return next(new ApiError({ code: "UNAUTHORIZED", status: 401, message: "Unauthorized" }));
    }
    const roles = req.auth.roles ?? [];
    const ok = roles.some((r) => allowed.includes(r));
    if (!ok) {
      return next(new ApiError({ code: "FORBIDDEN", status: 403, message: "Forbidden" }));
    }
    next();
  };
}

