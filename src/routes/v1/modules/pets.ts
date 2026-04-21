import { Router } from "express";
import { z } from "zod";
import { PetGender, PetSpecies } from "@prisma/client";
import { requireAuth } from "../../../middlewares/requireAuth";
import { validate } from "../../../middlewares/validate";
import { createPet, createVaccination, deletePet, getPet, listPets, listVaccinations, updatePet } from "../../../services/petService";
import { requireRole } from "../../../middlewares/requireRole";

export const petsRouter = Router();

petsRouter.use(requireAuth);

petsRouter.get(
  "/",
  validate({
    query: z.object({
      ownerId: z.string().uuid().optional(),
    }),
  }),
  async (req, res, next) => {
    try {
      const pets = await listPets({
        userId: req.auth!.userId,
        roles: req.auth!.roles,
        ownerId: req.query.ownerId as string | undefined,
      });
      res.json({ items: pets });
    } catch (e) {
      next(e);
    }
  },
);

petsRouter.post(
  "/",
  requireRole("customer", "admin"),
  validate({
    body: z
      .object({
        name: z.string().min(1),
        species: z.nativeEnum(PetSpecies),
        breed: z.string().min(1),
        gender: z.nativeEnum(PetGender),
        birthDate: z.coerce.date(),
        weightKg: z.coerce.number().positive(),
        description: z.string().optional(),
        avatarKey: z.string().optional(),
      })
      .strict(),
  }),
  async (req, res, next) => {
    try {
      const pet = await createPet({ userId: req.auth!.userId, ...req.body });
      res.status(201).json({ pet });
    } catch (e) {
      next(e);
    }
  },
);

petsRouter.get(
  "/:id",
  validate({ params: z.object({ id: z.string().uuid() }) }),
  async (req, res, next) => {
    try {
      const pet = await getPet({ userId: req.auth!.userId, roles: req.auth!.roles, petId: String(req.params.id) });
      res.json({ pet });
    } catch (e) {
      next(e);
    }
  },
);

petsRouter.patch(
  "/:id",
  validate({
    params: z.object({ id: z.string().uuid() }),
    body: z
      .object({
        name: z.string().min(1).optional(),
        species: z.nativeEnum(PetSpecies).optional(),
        breed: z.string().min(1).optional(),
        gender: z.nativeEnum(PetGender).optional(),
        birthDate: z.coerce.date().optional(),
        weightKg: z.coerce.number().positive().optional(),
        description: z.string().nullable().optional(),
        avatarKey: z.string().nullable().optional(),
      })
      .strict(),
  }),
  async (req, res, next) => {
    try {
      const pet = await updatePet({
        userId: req.auth!.userId,
        roles: req.auth!.roles,
        petId: String(req.params.id),
        data: req.body,
      });
      res.json({ pet });
    } catch (e) {
      next(e);
    }
  },
);

petsRouter.delete(
  "/:id",
  validate({ params: z.object({ id: z.string().uuid() }) }),
  async (req, res, next) => {
    try {
      await deletePet({ userId: req.auth!.userId, roles: req.auth!.roles, petId: String(req.params.id) });
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  },
);

petsRouter.get(
  "/:petId/vaccinations",
  validate({ params: z.object({ petId: z.string().uuid() }) }),
  async (req, res, next) => {
    try {
      const items = await listVaccinations({
        userId: req.auth!.userId,
        roles: req.auth!.roles,
        petId: String(req.params.petId),
      });
      res.json({ items });
    } catch (e) {
      next(e);
    }
  },
);

petsRouter.post(
  "/:petId/vaccinations",
  validate({
    params: z.object({ petId: z.string().uuid() }),
    body: z
      .object({
        vaccineName: z.string().min(1),
        date: z.coerce.date(),
        nextDueDate: z.coerce.date(),
        notes: z.string().optional(),
      })
      .strict(),
  }),
  async (req, res, next) => {
    try {
      const vaccination = await createVaccination({
        userId: req.auth!.userId,
        roles: req.auth!.roles,
        petId: String(req.params.petId),
        ...req.body,
      });
      res.status(201).json({ vaccination });
    } catch (e) {
      next(e);
    }
  },
);

