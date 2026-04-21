import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { ApiError, toApiError } from "../utils/errors";
import { logger } from "../utils/logger";

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  // JSON parse errors from express.json()/body-parser
  // body-parser sets status/statusCode = 400 and exposes the error
  if (
    err &&
    typeof err === "object" &&
    (err as any).type === "entity.parse.failed" &&
    ((err as any).status === 400 || (err as any).statusCode === 400)
  ) {
    const apiErr = new ApiError({
      code: "VALIDATION_ERROR",
      status: 400,
      message: "Invalid JSON body",
    });
    return res.status(400).json({
      code: apiErr.code,
      message: apiErr.message,
      requestId: req.requestId,
    });
  }

  if (err instanceof ZodError) {
    const apiErr = new ApiError({
      code: "VALIDATION_ERROR",
      status: 400,
      message: "Validation error",
      details: err.flatten(),
    });
    return res.status(apiErr.status).json({
      code: apiErr.code,
      message: apiErr.message,
      details: apiErr.details,
      requestId: req.requestId,
    });
  }

  const apiErr = toApiError(err);

  if (apiErr.status >= 500) {
    logger.error({ err, requestId: req.requestId }, "Unhandled error");
  }

  return res.status(apiErr.status).json({
    code: apiErr.code,
    message: apiErr.message,
    details: apiErr.details,
    requestId: req.requestId,
  });
};

