import type { TimeFrame } from './stock';
import type { IndicatorConfig } from '@/components/chart/indicators/types';

export interface ChartSettings {
  defaultInterval: TimeFrame;
  indicators: IndicatorConfig[];
  theme: 'light' | 'dark';
}

export interface UserProfile {
  name: string | null;
  email: string;
}

export interface UserSettings extends ChartSettings {
  profile: UserProfile;
}
