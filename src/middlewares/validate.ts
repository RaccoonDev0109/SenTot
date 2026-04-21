import type { RequestHandler } from "express";
import type { ZodSchema } from "zod";

export function validate(opts: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}): RequestHandler {
  return (req, _res, next) => {
    if (opts.body) (req as any).body = opts.body.parse(req.body);
    if (opts.query) {
      const parsed = opts.query.parse(req.query) as any;
      Object.assign(req.query as any, parsed);
    }
    if (opts.params) {
      const parsed = opts.params.parse(req.params) as any;
      Object.assign(req.params as any, parsed);
    }
    next();
  };
}

