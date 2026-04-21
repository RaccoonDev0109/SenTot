"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function upsertRole(code, name) {
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
    const passwordHash = await bcryptjs_1.default.hash(adminPassword, 10);
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
    const clinic = await prisma.clinic.upsert({
        where: { id: "00000000-0000-0000-0000-000000000001" },
        update: {},
        create: {
            id: "00000000-0000-0000-0000-000000000001",
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
