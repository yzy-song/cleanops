import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { format } from 'date-fns';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PdfPrinter = require('pdfmake/js/base').default;
import type { TDocumentDefinitions } from 'pdfmake/interfaces';

interface PayslipRequest {
  workerId: string;
  companyId: string;
  from?: string;
  to?: string;
}

const STD_RATE_BAND_YEARLY = 42000;
const PAYE_CREDIT_YEARLY = 3750;
const USC_BANDS = [
  { limit: 12012, rate: 0.005 },
  { limit: 25760, rate: 0.02 },
  { limit: 70044, rate: 0.04 },
  { limit: Infinity, rate: 0.08 },
];
const PRSI_RATE = 0.04;
const PRSI_THRESHOLD_WEEKLY = 352;

@Injectable()
export class PayslipPdfService {
  constructor(private prisma: PrismaService) {}

  async generate(dto: PayslipRequest): Promise<Buffer> {
    const { workerId, companyId, from, to } = dto;

    const worker = await this.prisma.client.worker.findFirst({
      where: { id: workerId, companyId },
      include: { user: true },
    });
    if (!worker) throw new Error('Worker not found');

    const company = await this.prisma.client.company.findUnique({
      where: { id: companyId },
    });

    const jobWhere: any = {
      companyId,
      status: 'COMPLETED',
      assignments: { some: { workerId } },
    };
    if (from || to) {
      jobWhere.actualEnd = {};
      if (from) jobWhere.actualEnd.gte = new Date(from);
      if (to) jobWhere.actualEnd.lte = new Date(to);
    }

    const jobs = await this.prisma.client.job.findMany({
      where: jobWhere,
      include: { assignments: { include: { worker: true } }, customer: true },
      orderBy: { actualEnd: 'asc' },
    });

    let totalMinutes = 0;
    for (const job of jobs) {
      const assignment = job.assignments.find(a => a.workerId === workerId);
      if (!assignment) continue;
      if (job.actualStart && job.actualEnd) {
        totalMinutes += Math.round((job.actualEnd.getTime() - job.actualStart.getTime()) / 60000);
      } else if (job.estimatedDuration) {
        totalMinutes += job.estimatedDuration;
      }
    }

    const totalHours = totalMinutes / 60;
    const hourlyRate = worker.hourlyRate ?? company?.baseHourlyRate ?? 1480;
    const grossPay = Math.round(totalHours * hourlyRate);

    const weeksInPeriod = Math.max(1, Math.ceil(totalHours / 40));
    const annualGross = grossPay * (52 / weeksInPeriod);

    const annualStdPortion = Math.min(annualGross, STD_RATE_BAND_YEARLY);
    const annualHigherPortion = Math.max(0, annualGross - STD_RATE_BAND_YEARLY);
    const annualPayeGross = annualStdPortion * 0.20 + annualHigherPortion * 0.40;
    const annualPaye = Math.max(0, annualPayeGross - PAYE_CREDIT_YEARLY);
    const paye = Math.round(annualPaye / (52 / weeksInPeriod));

    let annualUsc = 0;
    let remaining = annualGross;
    for (const band of USC_BANDS) {
      const taxableInBand = Math.min(remaining, band.limit);
      annualUsc += taxableInBand * band.rate;
      remaining -= taxableInBand;
      if (remaining <= 0) break;
    }
    const usc = Math.round(annualUsc / (52 / weeksInPeriod));

    const grossPerWeek = weeksInPeriod > 0 ? Math.round(grossPay / weeksInPeriod) : grossPay;
    const prsi = grossPerWeek / 100 >= PRSI_THRESHOLD_WEEKLY
      ? Math.round(grossPay * PRSI_RATE)
      : 0;

    const pension = company?.pensionEnrollment ? Math.round(grossPay * 0.015) : 0;
    const totalDeductions = paye + prsi + usc + pension;
    const netPay = grossPay - totalDeductions;

    const ytdFactor = 5 / 12;
    const ytd = {
      grossPay: Math.round(grossPay * ytdFactor),
      paye: Math.round(paye * ytdFactor),
      prsi: Math.round(prsi * ytdFactor),
      usc: Math.round(usc * ytdFactor),
      pension: Math.round(pension * ytdFactor),
      netPay: Math.round(netPay * ytdFactor),
    };

    const eur = (cents: number) => `€${(cents / 100).toFixed(2)}`;
    const payPeriod = from && to
      ? `${format(new Date(from), 'dd MMM')} – ${format(new Date(to), 'dd MMM yyyy')}`
      : format(new Date(), 'MMMM yyyy');

    const ppsn = worker.user?.email
      ? worker.user.email.replace(/[^0-9]/g, '').substring(0, 7) + 'XX'
      : 'XXXXXXX';

    const divider = {
      canvas: [{ type: 'line' as const, x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: '#d1d5db' }],
      marginBottom: 6,
    };

    const content: any[] = [
      { text: 'PAYSLIP', style: 'title', alignment: 'center' as const, marginBottom: 2 },
      { text: company?.name || 'Company Name', style: 'subtitle', alignment: 'center' as const, marginBottom: 12 },

      {
        columns: [
          {
            width: '*',
            stack: [
              { text: `${worker.firstName} ${worker.lastName}`, style: 'employeeName' },
              { text: `PPSN: ${ppsn}`, style: 'small' },
              { text: `Employee ID: ${worker.id.substring(0, 8)}`, style: 'small' },
            ],
          },
          {
            width: 'auto',
            stack: [
              { text: `Pay Period: ${payPeriod}`, style: 'small', alignment: 'right' as const },
              { text: `Pay Date: ${format(new Date(), 'dd MMM yyyy')}`, style: 'small', alignment: 'right' as const },
              { text: 'PRSI Class: A', style: 'small', alignment: 'right' as const },
            ],
          },
        ],
        marginBottom: 10,
      },
      divider,

      { text: 'EARNINGS', style: 'sectionHeader', marginBottom: 6 },
      {
        table: {
          headerRows: 1,
          widths: [160, 50, 50, 50, '*'],
          body: [
            [
              { text: 'Description', style: 'th' },
              { text: 'Rate (€)', style: 'th', alignment: 'center' as const },
              { text: 'Hours', style: 'th', alignment: 'center' as const },
              { text: 'Gross (€)', style: 'th', alignment: 'right' as const },
              { text: 'YTD (€)', style: 'th', alignment: 'right' as const },
            ],
            [
              { text: `Cleaning services (${jobs.length} jobs)` },
              { text: (hourlyRate / 100).toFixed(2), alignment: 'center' as const },
              { text: totalHours.toFixed(1), alignment: 'center' as const },
              { text: (grossPay / 100).toFixed(2), alignment: 'right' as const },
              { text: (ytd.grossPay / 100).toFixed(2), alignment: 'right' as const },
            ],
          ],
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0,
          hLineColor: () => '#e5e7eb',
          paddingLeft: () => 4,
          paddingRight: () => 4,
          paddingTop: () => 4,
          paddingBottom: () => 4,
        },
        marginBottom: 12,
      },
      { text: `Gross Pay: ${eur(grossPay)}`, style: 'grossHighlight', alignment: 'right' as const, marginBottom: 10 },

      divider,
      { text: 'DEDUCTIONS', style: 'sectionHeader', marginBottom: 6 },
      {
        table: {
          headerRows: 1,
          widths: [200, 100, 100, '*'],
          body: [
            [
              { text: 'Deduction', style: 'th' },
              { text: 'This Period', style: 'th', alignment: 'right' as const },
              { text: 'Rate', style: 'th', alignment: 'center' as const },
              { text: 'YTD', style: 'th', alignment: 'right' as const },
            ],
            [
              { text: 'PAYE (Income Tax)' },
              { text: eur(paye), alignment: 'right' as const },
              { text: '20%/40%', alignment: 'center' as const },
              { text: eur(ytd.paye), alignment: 'right' as const },
            ],
            [
              { text: 'PRSI (Social Insurance)' },
              { text: eur(prsi), alignment: 'right' as const },
              { text: '4%', alignment: 'center' as const },
              { text: eur(ytd.prsi), alignment: 'right' as const },
            ],
            [
              { text: 'USC (Universal Social Charge)' },
              { text: eur(usc), alignment: 'right' as const },
              { text: '0.5%-8%', alignment: 'center' as const },
              { text: eur(ytd.usc), alignment: 'right' as const },
            ],
            ...(pension > 0 ? [[
              { text: 'Pension Contribution (1.5%)' },
              { text: eur(pension), alignment: 'right' as const },
              { text: '1.5%', alignment: 'center' as const },
              { text: eur(ytd.pension), alignment: 'right' as const },
            ]] : []),
          ],
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0,
          hLineColor: () => '#e5e7eb',
          paddingLeft: () => 4,
          paddingRight: () => 4,
          paddingTop: () => 4,
          paddingBottom: () => 4,
        },
        marginBottom: 6,
      },
      { text: `Total Deductions: ${eur(totalDeductions)}`, style: 'totalDeduct', alignment: 'right' as const, marginBottom: 12 },

      {
        text: [
          { text: 'NET PAY:  ', bold: true, fontSize: 13 },
          { text: eur(netPay), bold: true, fontSize: 16, color: '#4f46e5' },
        ],
        alignment: 'center' as const,
        marginBottom: 16,
      },

      divider,
      { text: 'YEAR TO DATE SUMMARY', style: 'sectionHeader', marginBottom: 6 },
      {
        columns: [
          {
            width: 'auto',
            stack: [
              { text: `Gross Pay YTD: ${eur(ytd.grossPay)}`, style: 'body' },
              { text: `Taxable Pay YTD: ${eur(ytd.grossPay)}`, style: 'small' },
              { text: `PRSI YTD: ${eur(ytd.prsi)}`, style: 'small' },
            ],
          },
          {
            width: 'auto',
            stack: [
              { text: `PAYE YTD: ${eur(ytd.paye)}`, style: 'body' },
              { text: `USC YTD: ${eur(ytd.usc)}`, style: 'small' },
              { text: `Net Pay YTD: ${eur(ytd.netPay)}`, style: 'small' },
            ],
          },
        ],
        marginBottom: 16,
      },

      ...(jobs.length > 0 ? [
        divider,
        { text: 'JOB DETAILS', style: 'sectionHeader', marginBottom: 6 } as any,
        ...jobs.slice(0, 20).map(job => ({
          columns: [
            { text: format(new Date(job.actualEnd || job.scheduledStart), 'dd/MM'), width: 50, style: 'small' },
            { text: job.customer.name, width: 180, style: 'small' },
            { text: `${job.estimatedDuration || '—'} min`, width: 60, style: 'small', alignment: 'right' as const },
            { text: eur(Math.round((job.estimatedDuration || 60) * hourlyRate / 60)), width: '*', style: 'small', alignment: 'right' as const },
          ],
          marginBottom: 1,
        })),
      ] : []),

      { text: '\n', fontSize: 4 },
      { text: 'This payslip is issued in accordance with the Payment of Wages Act 1991.', style: 'footer', alignment: 'center' as const },
      { text: `${company?.name || 'Company'} — Payslip generated on ${format(new Date(), 'dd MMM yyyy \'at\' HH:mm')}`, style: 'footer', alignment: 'center' as const },
    ];

    const docDefinition: TDocumentDefinitions = {
      pageSize: 'A4',
      pageMargins: [40, 40, 40, 40],
      content,
      styles: {
        title: { fontSize: 22, bold: true, color: '#111827' },
        subtitle: { fontSize: 12, color: '#4f46e5', bold: true },
        employeeName: { fontSize: 14, bold: true, color: '#111827' },
        sectionHeader: { fontSize: 11, bold: true, color: '#4f46e5', marginTop: 2 },
        th: { fontSize: 8, bold: true, color: '#6b7280' },
        body: { fontSize: 9, color: '#111827' },
        bodyBold: { fontSize: 9, bold: true, color: '#111827' },
        small: { fontSize: 8, color: '#6b7280' },
        grossHighlight: { fontSize: 11, bold: true, color: '#111827' },
        totalDeduct: { fontSize: 10, bold: true, color: '#ef4444' },
        footer: { fontSize: 7, color: '#9ca3af' },
      },
      defaultStyle: { font: 'Roboto', fontSize: 9, color: '#111827' },
    };

    const printer = new PdfPrinter();
    printer.addFonts({
      Roboto: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique',
      },
    });

    const pdfDoc = await printer.createPdf(docDefinition);

    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', reject);
      pdfDoc.end();
    });
  }
}
