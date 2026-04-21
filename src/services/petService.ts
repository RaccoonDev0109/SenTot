import { prisma } from "../db/prisma";
import { ApiError } from "../utils/errors";
import { PetGender, PetSpecies, VaccinationStatus } from "@prisma/client";

export async function listPets(opts: { userId: string; roles: string[]; ownerId?: string }) {
  const isAdmin = opts.roles.includes("admin");
  const ownerId = isAdmin && opts.ownerId ? opts.ownerId : opts.userId;

  return prisma.pet.findMany({
    where: { ownerId },
    orderBy: { createdAt: "desc" },
  });
}

export async function createPet(input: {
  userId: string;
  name: string;
  species: PetSpecies;
  breed: string;
  gender: PetGender;
  birthDate: Date;
  weightKg: number;
  description?: string;
  avatarKey?: string;
}) {
  return prisma.pet.create({
    data: {
      ownerId: input.userId,
      name: input.name,
      species: input.species,
      breed: input.breed,
      gender: input.gender,
      birthDate: input.birthDate,
      weightKg: input.weightKg,
      description: input.description,
      avatarKey: input.avatarKey,
    },
  });
}

export async function getPet(opts: { userId: string; roles: string[]; petId: string }) {
  const pet = await prisma.pet.findUnique({ where: { id: opts.petId } });
  if (!pet) throw new ApiError({ code: "NOT_FOUND", status: 404, message: "Pet not found" });

  const isAdmin = opts.roles.includes("admin");
  if (!isAdmin && pet.ownerId !== opts.userId) {
    throw new ApiError({ code: "FORBIDDEN", status: 403, message: "Forbidden" });
  }
  return pet;
}

export async function updatePet(opts: {
  userId: string;
  roles: string[];
  petId: string;
  data: Partial<{
    name: string;
    species: PetSpecies;
    breed: string;
    gender: PetGender;
    birthDate: Date;
    weightKg: number;
    description: string | null;
    avatarKey: string | null;
  }>;
}) {
  await getPet({ userId: opts.userId, roles: opts.roles, petId: opts.petId });
  return prisma.pet.update({
    where: { id: opts.petId },
    data: opts.data,
  });
}

export async function deletePet(opts: { userId: string; roles: string[]; petId: string }) {
  await getPet({ userId: opts.userId, roles: opts.roles, petId: opts.petId });
  await prisma.pet.delete({ where: { id: opts.petId } });
}

function computeVaccinationStatus(date: Date, nextDueDate: Date): VaccinationStatus {
  const today = new Date();
  const todayDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const dateUtc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const nextUtc = new Date(Date.UTC(nextDueDate.getUTCFullYear(), nextDueDate.getUTCMonth(), nextDueDate.getUTCDate()));

  if (dateUtc.getTime() <= todayDate.getTime()) return "completed";
  if (nextUtc.getTime() < todayDate.getTime()) return "overdue";
  return "upcoming";
}

export async function listVaccinations(opts: { userId: string; roles: string[]; petId: string }) {
  await getPet({ userId: opts.userId, roles: opts.roles, petId: opts.petId });
  return prisma.vaccination.findMany({ where: { petId: opts.petId }, orderBy: { nextDueDate: "asc" } });
}

export async function createVaccination(opts: {
  userId: string;
  roles: string[];
  petId: string;
  vaccineName: string;
  date: Date;
  nextDueDate: Date;
  notes?: string;
}) {
  await getPet({ userId: opts.userId, roles: opts.roles, petId: opts.petId });
  const status = computeVaccinationStatus(opts.date, opts.nextDueDate);
  return prisma.vaccination.create({
    data: {
      petId: opts.petId,
      vaccineName: opts.vaccineName,
      date: opts.date,
      nextDueDate: opts.nextDueDate,
      status,
      notes: opts.notes,
    },
  });
}

export async function updateVaccination(opts: {
  userId: string;
  roles: string[];
  vaccinationId: string;
  data: Partial<{ vaccineName: string; date: Date; nextDueDate: Date; notes: string | null }>;
}) {
  const v = await prisma.vaccination.findUnique({ where: { id: opts.vaccinationId } });
  if (!v) throw new ApiError({ code: "NOT_FOUND", status: 404, message: "Vaccination not found" });
  await getPet({ userId: opts.userId, roles: opts.roles, petId: v.petId });

  const date = opts.data.date ?? v.date;
  const nextDueDate = opts.data.nextDueDate ?? v.nextDueDate;
  const status = computeVaccinationStatus(date, nextDueDate);

  return prisma.vaccination.update({
    where: { id: opts.vaccinationId },
    data: { ...opts.data, status },
  });
}

export async function deleteVaccination(opts: { userId: string; roles: string[]; vaccinationId: string }) {
  const v = await prisma.vaccination.findUnique({ where: { id: opts.vaccinationId } });
  if (!v) throw new ApiError({ code: "NOT_FOUND", status: 404, message: "Vaccination not found" });
  await getPet({ userId: opts.userId, roles: opts.roles, petId: v.petId });
  await prisma.vaccination.delete({ where: { id: opts.vaccinationId } });
}

