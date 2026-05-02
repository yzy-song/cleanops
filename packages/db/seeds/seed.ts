import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function seed() {
  console.log("Seeding...\n");

  // 1. Company
  const company = await prisma.company.upsert({
    where: { id: "seed-company-1" },
    update: {},
    create: {
      id: "seed-company-1",
      name: "CleanOps Demo Ltd",
      vatNumber: "IE1234567WA",
      baseHourlyRate: 1480,
      pensionEnrollment: true,
    },
  });
  console.log("Company:", company.name);

  // 2. Users
  const hash = await bcrypt.hash("pass123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@demo.com" },
    update: {},
    create: { id: "seed-user-admin", email: "admin@demo.com", password: hash, role: "ADMIN", companyId: company.id },
  });
  console.log("Admin:", admin.email);

  const mgr = await prisma.user.upsert({
    where: { email: "manager@demo.com" },
    update: {},
    create: { id: "seed-user-manager", email: "manager@demo.com", password: hash, role: "MANAGER", companyId: company.id },
  });
  console.log("Manager:", mgr.email);

  const w1u = await prisma.user.upsert({
    where: { email: "tom@demo.com" },
    update: {},
    create: { id: "seed-user-worker1", email: "tom@demo.com", password: hash, role: "WORKER", companyId: company.id },
  });
  const w2u = await prisma.user.upsert({
    where: { email: "sarah@demo.com" },
    update: {},
    create: { id: "seed-user-worker2", email: "sarah@demo.com", password: hash, role: "WORKER", companyId: company.id },
  });

  // 3. Workers
  const w1 = await prisma.worker.upsert({
    where: { phone: "0851000001" },
    update: {},
    create: { id: "seed-worker-1", firstName: "Tom", lastName: "Murphy", phone: "0851000001", email: "tom@demo.com", companyId: company.id, userId: w1u.id },
  });
  console.log("Worker:", w1.firstName, w1.lastName);

  const w2 = await prisma.worker.upsert({
    where: { phone: "0851000002" },
    update: {},
    create: { id: "seed-worker-2", firstName: "Sarah", lastName: "O'Brien", phone: "0851000002", email: "sarah@demo.com", companyId: company.id, userId: w2u.id },
  });
  console.log("Worker:", w2.firstName, w2.lastName);

  // 4. Customers (Dublin addresses)
  const customers = [
    { id: "seed-cust-1", name: "Molly Malone", address: "47-48 Temple Bar, Dublin", eircode: "D02 N725", lat: 53.3457, lng: -6.2634, isCommercial: false },
    { id: "seed-cust-2", name: "Trinity College Hotel", address: "College Green, Dublin 2", eircode: "D02 VR66", lat: 53.3444, lng: -6.2583, isCommercial: true },
    { id: "seed-cust-3", name: "Pearse Street Apartments", address: "191 Pearse Street, Dublin 2", eircode: "D02 W9R8", lat: 53.3440, lng: -6.2500, isCommercial: false },
    { id: "seed-cust-4", name: "Rathmines Dental", address: "148 Rathmines Road Lower, Dublin 6", eircode: "D06 A8X2", lat: 53.3236, lng: -6.2640, isCommercial: true },
    { id: "seed-cust-5", name: "John & Mary Byrne", address: "12 Orwell Road, Rathgar, Dublin 6", eircode: "D06 V6P8", lat: 53.3128, lng: -6.2742, isCommercial: false },
  ];

  for (const c of customers) {
    await prisma.customer.upsert({ where: { id: c.id }, update: {}, create: { ...c, companyId: company.id } });
    console.log("Customer:", c.name);
  }

  // 5. Jobs
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const t1 = new Date(tomorrow); t1.setHours(9, 0, 0, 0);
  const t2 = new Date(tomorrow); t2.setHours(14, 0, 0, 0);
  const dayAfter = new Date(); dayAfter.setDate(dayAfter.getDate() + 2); dayAfter.setHours(10, 0, 0, 0);
  const nextWeek = new Date(); nextWeek.setDate(nextWeek.getDate() + 7);
  const nw1 = new Date(nextWeek); nw1.setHours(8, 0, 0, 0);
  const nw2 = new Date(nextWeek); nw2.setHours(11, 0, 0, 0);

  const jobs = [
    { id: "seed-job-1", customerId: "seed-cust-1", scheduledStart: t1, estimatedDuration: 120, notes: "Bring eco-friendly products", status: "PENDING", workerIds: ["seed-worker-1"] },
    { id: "seed-job-2", customerId: "seed-cust-2", scheduledStart: t2, estimatedDuration: 180, notes: "Commercial deep clean, all floors", status: "PENDING", workerIds: ["seed-worker-1", "seed-worker-2"] },
    { id: "seed-job-3", customerId: "seed-cust-3", scheduledStart: dayAfter, estimatedDuration: 90, status: "PENDING", workerIds: ["seed-worker-2"] },
    { id: "seed-job-4", customerId: "seed-cust-4", scheduledStart: nw1, estimatedDuration: 60, notes: "Weekly dental clinic cleaning", status: "PENDING", workerIds: ["seed-worker-1"], isRecurring: true, recurrenceRule: "WEEKLY" },
    { id: "seed-job-5", customerId: "seed-cust-5", scheduledStart: nw2, estimatedDuration: 120, notes: "Move-out clean, all rooms", status: "PENDING", workerIds: ["seed-worker-2"] },
  ];

  for (const j of jobs) {
    const { workerIds, ...data } = j;
    await prisma.job.upsert({
      where: { id: j.id },
      update: {},
      create: {
        ...data,
        isRecurring: data.isRecurring ?? false,
        recurrenceRule: data.recurrenceRule ?? null,
        companyId: company.id,
        assignments: { create: workerIds.map((wId) => ({ worker: { connect: { id: wId } } })) },
      },
    });
    const status = data.isRecurring ? `${data.recurrenceRule}` : data.status;
    console.log(`Job: ${j.id.slice(0, 8)} - ${status}`);
  }

  console.log("\n=== Seed Complete ===");
  console.log("Admin:   admin@demo.com / pass123");
  console.log("Manager: manager@demo.com / pass123");
  console.log("Worker:  tom@demo.com / pass123");
  console.log("Worker:  sarah@demo.com / pass123");
  console.log("5 customers + 5 jobs created.\n");
}

seed()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
