import { z } from 'zod';

/** Platforms the user owns. */
export const platformSchema = z.enum([
  'pc',
  'playstation-4',
  'playstation-5',
  'nintendo-switch',
  'nintendo-switch-2',
  'mobile',
]);
export type Platform = z.infer<typeof platformSchema>;

export const PLATFORM_LABELS: Record<Platform, string> = {
  pc: 'PC',
  'playstation-4': 'PlayStation 4',
  'playstation-5': 'PlayStation 5',
  'nintendo-switch': 'Nintendo Switch',
  'nintendo-switch-2': 'Nintendo Switch 2',
  mobile: 'Mobile',
};
