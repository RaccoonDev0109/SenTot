import type { RequestHandler } from "express";
import { ApiError } from "../utils/errors";
import { verifyAccessToken } from "../utils/jwt";

export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;
  if (!token) {
    return next(new ApiError({ code: "UNAUTHORIZED", status: 401, message: "Missing access token" }));
  }
  try {
    const payload = verifyAccessToken(token);
    req.auth = { userId: payload.sub, roles: payload.roles ?? [] };
    return next();
  } catch {
    return next(new ApiError({ code: "UNAUTHORIZED", status: 401, message: "Invalid access token" }));
  }
};

