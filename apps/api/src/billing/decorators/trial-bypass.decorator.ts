import { SetMetadata } from '@nestjs/common';

export const TRIAL_BYPASS_KEY = 'TRIAL_BYPASS';

export const TrialBypass = () => SetMetadata(TRIAL_BYPASS_KEY, true);
