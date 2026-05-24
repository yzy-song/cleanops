import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ServiceType, PropertySize, ServiceFrequency } from '@cleanops/db';

interface PricingParams {
  serviceType: ServiceType;
  propertySize: PropertySize;
  bathrooms?: number;
  frequency: ServiceFrequency;
  isCommercial: boolean;
  companyId: string;
}

export interface PricingResult {
  estimatedDuration: number;
  lineItems: { description: string; quantity: number; unitPrice: number; totalPrice: number }[];
  subtotal: number;
  vatAmount: number;
  grandTotal: number;
  depositRequired: boolean;
  depositAmount: number | null;
}

const PROPERTY_MULTIPLIER: Record<PropertySize, number> = {
  STUDIO: 1, ONE_BED: 1, TWO_BED: 1.5, THREE_BED: 2, FOUR_BED: 2.5,
  FIVE_PLUS_BED: 3, COMMERCIAL_SMALL: 2, COMMERCIAL_LARGE: 4,
};

const SERVICE_BASE_HOURS: Record<ServiceType, number> = {
  REGULAR: 2, DEEP_CLEAN: 4, END_OF_TENANCY: 3, COMMERCIAL: 3,
  WINDOW: 1.5, CARPET: 2, OVEN: 1.5,
};

const SERVICE_LABELS: Record<ServiceType, string> = {
  REGULAR: 'Regular House Cleaning',
  DEEP_CLEAN: 'Deep Clean',
  END_OF_TENANCY: 'End of Tenancy Cleaning',
  COMMERCIAL: 'Commercial Cleaning',
  WINDOW: 'Window Cleaning',
  CARPET: 'Carpet Cleaning',
  OVEN: 'Oven Cleaning',
};

const SIZE_LABELS: Record<PropertySize, string> = {
  STUDIO: 'Studio', ONE_BED: '1 Bed', TWO_BED: '2 Bed', THREE_BED: '3 Bed',
  FOUR_BED: '4 Bed', FIVE_PLUS_BED: '5+ Bed',
  COMMERCIAL_SMALL: 'Small Office', COMMERCIAL_LARGE: 'Large Office',
};

@Injectable()
export class PricingService {
  constructor(private prisma: PrismaService) {}

  async calculatePrice(params: PricingParams): Promise<PricingResult> {
    const company = await this.prisma.client.company.findUnique({
      where: { id: params.companyId },
      select: { baseHourlyRate: true },
    });
    const hourlyRate = company?.baseHourlyRate ?? 1480;

    const baseHours = SERVICE_BASE_HOURS[params.serviceType];
    const multiplier = PROPERTY_MULTIPLIER[params.propertySize];
    const bathroomExtra = params.serviceType === ServiceType.END_OF_TENANCY && params.bathrooms
      ? params.bathrooms * 0.5
      : 0;

    const estimatedDuration = Math.round(baseHours * multiplier + bathroomExtra);
    const subtotal = estimatedDuration * hourlyRate;
    const vatRate = params.isCommercial ? 0.23 : 0.135;
    const vatAmount = Math.round(subtotal * vatRate);
    const grandTotal = subtotal + vatAmount;
    const depositRequired = params.frequency === ServiceFrequency.ONE_OFF && grandTotal >= 50000;
    const depositAmount = depositRequired ? Math.round(grandTotal * 0.25) : null;

    const serviceLabel = SERVICE_LABELS[params.serviceType];
    const sizeLabel = SIZE_LABELS[params.propertySize];
    const lineItems = [
      {
        description: `${serviceLabel} — ${sizeLabel}`,
        quantity: estimatedDuration,
        unitPrice: hourlyRate,
        totalPrice: subtotal,
      },
    ];

    return { estimatedDuration, lineItems, subtotal, vatAmount, grandTotal, depositRequired, depositAmount };
  }
}
