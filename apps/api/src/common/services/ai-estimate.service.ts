import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

export interface PhotoEstimate {
  roomType: string;
  roomSize: string;
  condition: string;
  estimatedMinutes: number;
  recommendedService: string;
  notes: string;
}

@Injectable()
export class AiEstimateService {
  private readonly openai: OpenAI | null;
  private readonly logger = new Logger(AiEstimateService.name);

  constructor(private configService: ConfigService) {
    const apiKey = configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.warn('OPENAI_API_KEY not set — AI photo estimate disabled');
      this.openai = null;
    } else {
      this.openai = new OpenAI({ apiKey });
    }
  }

  async estimateFromPhotos(photos: string[]): Promise<PhotoEstimate | null> {
    if (!this.openai) {
      this.logger.warn('AI estimate skipped — OpenAI not configured');
      return null;
    }
    if (!photos.length) return null;

    try {
      const imageContents = photos.map((base64) => ({
        type: 'image_url' as const,
        image_url: { url: base64, detail: 'low' as const },
      }));

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              'You are a professional cleaning estimator. Analyze the room photo(s) and return a JSON estimate. Be conservative — underestimate rather than overestimate.',
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this cleaning job photo and return a JSON object with these fields:
- roomType: e.g. "Living Room", "Kitchen", "Bedroom", "Bathroom", "Office"
- roomSize: "Small", "Medium", "Large", or "Very Large"
- condition: "Clean", "Moderate", "Dirty", or "Very Dirty"
- estimatedMinutes: cleaning time in minutes (integer, 30-480)
- recommendedService: best matching service type from "REGULAR", "DEEP_CLEAN", "END_OF_TENANCY", "COMMERCIAL"
- notes: brief 1-sentence note about what you see and your reasoning

Return ONLY valid JSON, no markdown wrapping.`,
              },
              ...imageContents,
            ],
          },
        ],
        max_tokens: 300,
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        this.logger.warn('AI returned empty response');
        return null;
      }

      // Parse JSON from response (handle markdown wrapping)
      const json = content.replace(/```json\s*|\s*```/g, '').trim();
      const result = JSON.parse(json) as PhotoEstimate;

      this.logger.log(
        `AI estimate: ${result.roomType} ${result.roomSize} — ${result.estimatedMinutes}min`,
      );
      return result;
    } catch (err: any) {
      this.logger.error(`AI estimate failed: ${err.message}`);
      return null;
    }
  }
}
