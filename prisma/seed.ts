import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const SEED_CLINIC_ID = "11111111-1111-4111-8111-111111111111"; // valid UUID v4
const LEGACY_SEED_CLINIC_ID = "00000000-0000-0000-0000-000000000001";

async function upsertRole(code: string, name: string) {
  return prisma.role.upsert({
    where: { code },
    update: { name },
    create: { code, name },
  });
}

async function main() {
  const [customerRole, clinicStaffRole, adminRole] = await Promise.all([
    upsertRole("customer", "Customer"),
    upsertRole("clinic_staff", "Clinic staff"),
    upsertRole("admin", "Admin"),
  ]);

  // Minimal admin for first-time login (can be removed anytime)
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@sentot.local";
  const adminPhone = process.env.SEED_ADMIN_PHONE ?? "0000000000";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin@123456";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      fullName: "System Admin",
      phone: adminPhone,
      passwordHash,
      status: "active",
    },
    create: {
      fullName: "System Admin",
      email: adminEmail,
      phone: adminPhone,
      passwordHash,
      status: "active",
    },
  });

  // Ensure roles are attached
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
    update: {},
    create: { userId: adminUser.id, roleId: adminRole.id },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: clinicStaffRole.id } },
    update: {},
    create: { userId: adminUser.id, roleId: clinicStaffRole.id },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: customerRole.id } },
    update: {},
    create: { userId: adminUser.id, roleId: customerRole.id },
  });

  // Seed one clinic (optional convenience)
  // Remove legacy clinic id which fails stricter UUID validators (v4/version/variant)
  await prisma.clinic.deleteMany({ where: { id: LEGACY_SEED_CLINIC_ID } });

  const clinic = await prisma.clinic.upsert({
    where: { id: SEED_CLINIC_ID },
    update: {},
    create: {
      id: SEED_CLINIC_ID,
      name: "SenTot Vet Clinic",
      address: "123 Demo Street",
      phone: "0123456789",
      description: "Seed clinic for development.",
      openHoursText: "08:00 - 20:00",
      status: "active",
    },
  });

  await prisma.clinicService.createMany({
    data: [
      { clinicId: clinic.id, name: "Tiêm phòng" },
      { clinicId: clinic.id, name: "Khám tổng quát" },
    ],
    skipDuplicates: true,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    await prisma.$disconnect();
    console.error(e);
    process.exit(1);
  });

