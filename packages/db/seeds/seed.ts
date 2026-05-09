import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

function daysAgo(days: number, hour = 9): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, Math.floor(Math.random() * 60), 0, 0);
  return d;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function seed() {
  console.log("Seeding large dataset...\n");

  // Clean old seed data
  await prisma.invoice.deleteMany({ where: { companyId: "seed-company-1" } });
  await prisma.jobAssignment.deleteMany({ where: { job: { companyId: "seed-company-1" } } });
  await prisma.jobPhoto.deleteMany({ where: { job: { companyId: "seed-company-1" } } });
  await prisma.job.deleteMany({ where: { companyId: "seed-company-1" } });
  await prisma.customer.deleteMany({ where: { companyId: "seed-company-1" } });
  await prisma.worker.deleteMany({ where: { companyId: "seed-company-1" } });
  await prisma.user.deleteMany({ where: { companyId: "seed-company-1" } });
  await prisma.company.deleteMany({ where: { id: "seed-company-1" } });
  console.log("Cleaned old seed data");

  // 1. Company
  const company = await prisma.company.create({
    data: {
      id: "seed-company-1",
      name: "CleanOps Demo Ltd",
      vatNumber: "IE1234567WA",
      baseHourlyRate: 1480,
      pensionEnrollment: true,
      subscriptionStatus: "ACTIVE",
      subscriptionPlan: "PRO",
      trialEndsAt: daysAgo(-200, 0),
      subscriptionEndsAt: daysAgo(-90, 0),
    },
  });
  console.log("Company:", company.name);

  // 2. Users + Workers
  const hash = await bcrypt.hash("pass123", 10);

  await prisma.user.create({
    data: { id: "seed-user-admin", email: "admin@demo.com", password: hash, role: "ADMIN", companyId: company.id },
  });
  await prisma.user.create({
    data: { id: "seed-user-manager", email: "manager@demo.com", password: hash, role: "MANAGER", companyId: company.id },
  });

  const workerDefs = [
    { id: "seed-worker-1", first: "Tom", last: "Murphy", phone: "0851000001", email: "tom@demo.com", rate: 1550 },
    { id: "seed-worker-2", first: "Sarah", last: "O'Brien", phone: "0851000002", email: "sarah@demo.com", rate: 1700 },
    { id: "seed-worker-3", first: "Ciarán", last: "Ó Sé", phone: "0851000003", email: "ciaran@demo.com", rate: 1480 },
    { id: "seed-worker-4", first: "Aisling", last: "Ní Bhriain", phone: "0851000004", email: "aisling@demo.com", rate: 1600 },
    { id: "seed-worker-5", first: "Piotr", last: "Nowak", phone: "0851000005", email: "piotr@demo.com", rate: 1650 },
    { id: "seed-worker-6", first: "Emma", last: "Walsh", phone: "0851000006", email: "emma@demo.com", rate: 1500 },
    { id: "seed-worker-7", first: "Jamie", last: "Byrne", phone: "0851000007", email: "jamie@demo.com", rate: 1550 },
    { id: "seed-worker-8", first: "Olive", last: "Keane", phone: "0851000008", email: "olive@demo.com", rate: 1750 },
  ];

  const workers: any[] = [];
  for (const wd of workerDefs) {
    const u = await prisma.user.create({
      data: { id: `seed-user-${wd.id}`, email: wd.email, password: hash, role: "WORKER", companyId: company.id },
    });
    const w = await prisma.worker.create({
      data: { id: wd.id, firstName: wd.first, lastName: wd.last, phone: wd.phone, hourlyRate: wd.rate, email: wd.email, companyId: company.id, userId: u.id },
    });
    workers.push(w);
  }
  console.log(`Workers: ${workers.length}`);

  // 3. Customers — 25 realistic Dublin addresses
  const custDefs = [
    { name: "Molly Malone", addr: "47-48 Temple Bar, Dublin", eircode: "D02 N725", lat: 53.3457, lng: -6.2634, comm: false, code: "Key under mat" },
    { name: "Trinity College Hotel", addr: "College Green, Dublin 2", eircode: "D02 VR66", lat: 53.3444, lng: -6.2583, comm: true, code: "Front desk" },
    { name: "Pearse Street Apartments", addr: "191 Pearse Street, Dublin 2", eircode: "D02 W9R8", lat: 53.3440, lng: -6.2500, comm: false, code: "Gate #2244" },
    { name: "Rathmines Dental", addr: "148 Rathmines Road Lower, Dublin 6", eircode: "D06 A8X2", lat: 53.3236, lng: -6.2640, comm: true },
    { name: "John & Mary Byrne", addr: "12 Orwell Road, Rathgar, Dublin 6", eircode: "D06 V6P8", lat: 53.3128, lng: -6.2742, comm: false, code: "Side gate" },
    { name: "Grand Canal Diner", addr: "Unit 3, Grand Canal Dock, Dublin 4", eircode: "D04 T6X4", lat: 53.3418, lng: -6.2385, comm: true },
    { name: "Siobhán Ní Cheallaigh", addr: "25 Leeson Park, Dublin 6", eircode: "D06 K7T1", lat: 53.3321, lng: -6.2520, comm: false },
    { name: "Baggot Street Offices", addr: "53 Baggot Street Lower, Dublin 2", eircode: "D02 XT51", lat: 53.3378, lng: -6.2459, comm: true },
    { name: "Ranelagh Wellness", addr: "18 Ranelagh Road, Dublin 6", eircode: "D06 Y2K4", lat: 53.3261, lng: -6.2560, comm: true },
    { name: "Clontarf Family Home", addr: "7 Seafield Road, Clontarf, Dublin 3", eircode: "D03 P8W2", lat: 53.3640, lng: -6.2060, comm: false, code: "Back door open" },
    { name: "Donnybrook Medical", addr: "2 Donnybrook Road, Dublin 4", eircode: "D04 N9R6", lat: 53.3220, lng: -6.2270, comm: true },
    { name: "Liberties Coffee Co", addr: "45 Meath Street, Dublin 8", eircode: "D08 W3K8", lat: 53.3419, lng: -6.2806, comm: true },
    { name: "Ringsend Apartments", addr: "12 Pigeon House Road, Dublin 4", eircode: "D04 T5N2", lat: 53.3401, lng: -6.2248, comm: false, code: "Apartment 3B" },
    { name: "Kimmage Family", addr: "33 Sundrive Road, Kimmage, Dublin 12", eircode: "D12 Y8T3", lat: 53.3210, lng: -6.2900, comm: false },
    { name: "Dundrum Dental", addr: "5 Main Street, Dundrum, Dublin 14", eircode: "D14 C5R7", lat: 53.2900, lng: -6.2440, comm: true },
    { name: "Blackrock House", addr: "22 Rock Road, Blackrock, Co Dublin", eircode: "A94 V3F2", lat: 53.3010, lng: -6.1860, comm: false, code: "Keys in lockbox" },
    { name: "Malahide Marina", addr: "Unit 8, Marina Village, Malahide", eircode: "K36 W6P2", lat: 53.4536, lng: -6.1468, comm: true },
    { name: "Swords Business Park", addr: "Unit 12, Airside, Swords", eircode: "K67 T9Y4", lat: 53.4550, lng: -6.2200, comm: true },
    { name: "Dalkey Residence", addr: "1 Sorrento Road, Dalkey", eircode: "A96 X8N3", lat: 53.2793, lng: -6.1081, comm: false, code: "Gate intercom #5" },
    { name: "Finglas Community", addr: "88 Glasnevin Ave, Finglas, Dublin 11", eircode: "D11 B4P7", lat: 53.3840, lng: -6.2930, comm: false },
    { name: "Howth Harbour Café", addr: "14 Harbour Road, Howth", eircode: "D13 R2V5", lat: 53.3895, lng: -6.0710, comm: true },
    { name: "Castleknock Guesthouse", addr: "3 College Road, Castleknock, Dublin 15", eircode: "D15 P6W2", lat: 53.3742, lng: -6.3603, comm: true },
    { name: "Templeogue Townhouse", addr: "66 Cypress Grove Road, Templeogue, D6W", eircode: "D6W Y5A8", lat: 53.2970, lng: -6.3110, comm: false },
    { name: "IFSC Offices", addr: "North Wall Quay, Dublin 1", eircode: "D01 T6F8", lat: 53.3490, lng: -6.2460, comm: true },
    { name: "Sandymount Strand", addr: "9 Beach Road, Sandymount, Dublin 4", eircode: "D04 N2P3", lat: 53.3290, lng: -6.2150, comm: false },
  ];

  const customers: any[] = [];
  for (let i = 0; i < custDefs.length; i++) {
    const c = custDefs[i];
    const cust = await prisma.customer.create({
      data: {
        id: `seed-cust-${i + 1}`,
        name: c.name,
        email: `cust${i + 1}@example.com`,
        phone: `085300${String(i + 1).padStart(4, "0")}`,
        address: c.addr,
        eircode: c.eircode,
        lat: c.lat,
        lng: c.lng,
        isCommercial: c.comm,
        accessCode: c.code || null,
        companyId: company.id,
      },
    });
    customers.push(cust);
  }
  console.log(`Customers: ${customers.length}`);

  // 4. Generate ~350 jobs across 90 days + some future
  let jobCount = 0;
  let invoiceCount = 0;
  let invoiceNum = 0;

  const notesOptions = [
    "Regular clean", "Deep clean", "Post-renovation", "End-of-tenancy",
    "Move-in clean", "Window cleaning included", "Oven deep clean",
    "Carpet shampoo", "Weekly office clean", "Monthly maintenance",
    null, null, null, null, null, // many jobs have no notes
  ];

  async function createJob(scheduledDaysAgo: number, hour: number) {
    const customer = pick(customers);
    const numWorkers = Math.random() < 0.15 ? 2 : Math.random() < 0.05 ? 3 : 1;
    const assignedWorkers = new Set<any>();
    while (assignedWorkers.size < numWorkers) {
      assignedWorkers.add(pick(workers));
    }
    const workerArr = Array.from(assignedWorkers);

    const durationMin = pick([60, 60, 90, 90, 90, 120, 120, 120, 150, 180, 180, 240]);
    const start = daysAgo(scheduledDaysAgo, hour);

    // Determine status
    let status: string;
    if (scheduledDaysAgo < 0) {
      status = "PENDING"; // future
    } else if (scheduledDaysAgo === 0 && Math.random() < 0.08) {
      status = "IN_PROGRESS"; // today, small chance
    } else if (scheduledDaysAgo >= 1) {
      status = Math.random() < 0.92 ? "COMPLETED" : Math.random() < 0.5 ? "CANCELLED" : "PENDING";
    } else {
      status = "PENDING";
    }

    const isEndOfTenancy = pick(notesOptions) === "End-of-tenancy";
    const depositAmount = isEndOfTenancy ? pick([3000, 5000, 8000, 10000]) : (Math.random() < 0.08 ? pick([2000, 3000, 4000]) : null);
    const isDepositPaid = depositAmount ? (status === "COMPLETED" ? true : Math.random() < 0.6) : false;

    const actualStart = (status === "COMPLETED" || status === "IN_PROGRESS")
      ? new Date(start.getTime() + randInt(2, 15) * 60000)
      : undefined;
    const actualEnd = (status === "COMPLETED")
      ? new Date(start.getTime() + (durationMin + randInt(-20, 30)) * 60000)
      : undefined;

    const jobId = `seed-job-${jobCount + 1}`;

    await prisma.job.create({
      data: {
        id: jobId,
        customerId: customer.id,
        companyId: company.id,
        scheduledStart: start,
        estimatedDuration: durationMin,
        status,
        notes: pick(notesOptions),
        depositAmount,
        isDepositPaid,
        actualStart,
        actualEnd,
        isRecurring: Math.random() < 0.1,
        recurrenceRule: Math.random() < 0.1 ? "WEEKLY" : null,
        assignments: {
          create: workerArr.map((w: any) => ({ worker: { connect: { id: w.id } } })),
        },
      },
    });

    jobCount++;

    // Generate invoice for COMPLETED jobs
    if (status === "COMPLETED") {
      const primaryWorker = workerArr[0];
      const rate = primaryWorker.hourlyRate ?? company.baseHourlyRate;
      const actualMin = actualStart && actualEnd
        ? Math.round((actualEnd.getTime() - actualStart.getTime()) / 60000)
        : durationMin;
      const hours = actualMin / 60;
      const subtotal = Math.round(hours * rate);
      const vatRate = customer.isCommercial ? 0.23 : 0.135;
      const vatAmount = Math.round(subtotal * vatRate);
      const amount = subtotal + vatAmount;

      const shouldBePaid = Math.random() < 0.72;
      const invoiceStatus = shouldBePaid ? "PAID" : "UNPAID";
      const paidAt = shouldBePaid ? new Date(start.getTime() + randInt(1, 10) * 86400000) : null;
      const paymentMethod = shouldBePaid ? pick(["STRIPE", "STRIPE", "BANK_TRANSFER", "CASH", "STRIPE"]) : null;

      invoiceNum++;
      await prisma.invoice.create({
        data: {
          invoiceNumber: invoiceNum,
          amount,
          vatAmount,
          status: invoiceStatus,
          paymentMethod,
          paidAt,
          createdAt: start, // match job date so overdue detection works
          companyId: company.id,
          jobId,
          reminderCount: !shouldBePaid && scheduledDaysAgo > 10 ? randInt(1, 3) : 0,
          reminderSentAt: !shouldBePaid && scheduledDaysAgo > 10 ? daysAgo(scheduledDaysAgo - randInt(3, 7), 12) : null,
        },
      });
      invoiceCount++;
    }
  }

  // Generate jobs across 90 days
  // More jobs on weekdays, fewer on weekends
  for (let day = -14; day <= 90; day++) {
    const d = new Date();
    d.setDate(d.getDate() - day);
    const dow = d.getDay(); // 0=Sunday
    const isWeekend = dow === 0 || dow === 6;

    // Jobs per day: weekdays 3-7, weekends 1-3, today extra
    let jobsToday = isWeekend ? randInt(1, 3) : randInt(3, 7);
    if (day === 0) jobsToday = Math.max(jobsToday, 6); // today at least 6
    if (day === -1) jobsToday = randInt(1, 3); // tomorrow

    for (let h = 0; h < jobsToday; h++) {
      const hour = pick([7, 8, 8, 9, 9, 10, 10, 11, 12, 13, 14, 14, 15, 16]);
      await createJob(day, hour);
    }
  }

  // Extra future jobs for the coming 2 weeks
  for (let day = -15; day <= -1; day++) {
    if (Math.random() < 0.5) {
      await createJob(day, pick([8, 9, 10, 11, 14, 15]));
    }
  }

  console.log(`Jobs: ${jobCount}`);
  console.log(`Invoices: ${invoiceCount}`);

  // 5. Summary
  const paidInv = await prisma.invoice.count({ where: { companyId: company.id, status: "PAID" } });
  const unpaidInv = await prisma.invoice.count({ where: { companyId: company.id, status: "UNPAID" } });
  const overdueInv = await prisma.invoice.count({
    where: { companyId: company.id, status: "UNPAID", createdAt: { lt: daysAgo(8, 0) } },
  });
  const depositJobs = await prisma.job.count({
    where: { companyId: company.id, depositAmount: { not: null } },
  });
  const pendingDeposits = await prisma.job.count({
    where: { companyId: company.id, depositAmount: { not: null }, isDepositPaid: false },
  });

  console.log("\n=== Seed Complete ===");
  console.log(`Company:    ${company.name} (${company.subscriptionPlan} plan)`);
  console.log(`Workers:    ${workers.length}`);
  console.log(`Customers:  ${customers.length}`);
  console.log(`Jobs:       ${jobCount}`);
  console.log(`Invoices:   ${invoiceCount} (${paidInv} paid, ${unpaidInv} unpaid, ${overdueInv} overdue)`);
  console.log(`Deposits:   ${depositJobs} jobs (${pendingDeposits} pending)`);
  console.log("\nLogin: admin@demo.com / pass123\n");
}

seed()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
