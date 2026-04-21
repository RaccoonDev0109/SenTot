import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc";
import { authRouter } from "./modules/auth";
import { meRouter } from "./modules/me";
import { petsRouter } from "./modules/pets";
import { vaccinationsRouter } from "./modules/vaccinations";
import { clinicsRouter } from "./modules/clinics";
import { appointmentsRouter } from "./modules/appointments";
import { notificationsRouter } from "./modules/notifications";
import { adminRouter } from "./modules/admin";

export const apiV1Router = Router();

apiV1Router.get("/", (_req, res) => res.json({ name: "SenTot API", version: "v1" }));

const openapi = swaggerJSDoc({
  definition: {
    openapi: "3.0.0",
    info: { title: "SenTot API", version: "1.0.0" },
  },
  apis: [],
});

apiV1Router.use("/docs", swaggerUi.serve, swaggerUi.setup(openapi));

apiV1Router.use("/auth", authRouter);
apiV1Router.use("/me", meRouter);
apiV1Router.use("/pets", petsRouter);
apiV1Router.use("/vaccinations", vaccinationsRouter);
apiV1Router.use("/clinics", clinicsRouter);
apiV1Router.use("/appointments", appointmentsRouter);
apiV1Router.use("/notifications", notificationsRouter);
apiV1Router.use("/admin", adminRouter);

