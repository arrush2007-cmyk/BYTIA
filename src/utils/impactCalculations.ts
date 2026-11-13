import type {
  ActivityType,
  BadgeType,
  PublicProfile,
  UserActivity,
  WasteCategory,
} from '../types/sustainability';

export const ECO_POINTS_BY_ACTIVITY: Record<ActivityType, number> = {
  scan: 10,
  reuse: 30,
  donate: 35,
  recycle: 20,
  exchange: 40,
  dispose: 15,
};

/**
 * Conservative average item weights in kilograms used when a specific weight is not measured.
 * Displayed transparently on the dashboard as "Estimated diversion" rather than exact mass.
 */
export const DEFAULT_WEIGHT_KG: Record<WasteCategory, number> = {
  Plastic: 0.15,
  'Paper and cardboard': 0.4,
  Glass: 0.45,
  Metal: 0.35,
  'Electronic waste': 1.5,
  'Clothes and textiles': 0.6,
  Furniture: 8.0,
  Wood: 3.0,
  'Food waste': 0.5,
  'Household items': 0.8,
  'Other materials': 0.5,
};

export function getEstimatedWeightKg(category: string, overrideKg?: number): number {
  if (typeof overrideKg === 'number' && Number.isFinite(overrideKg) && overrideKg > 0 && overrideKg <= 200) {
    return Math.round(overrideKg * 100) / 100;
  }
  const fallback = DEFAULT_WEIGHT_KG[category as WasteCategory] ?? 0.5;
  return fallback;
}

export interface BadgeDefinition {
  badgeType: BadgeType;
  description: string;
  requirementText: string;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    badgeType: 'First Scan',
    description: 'Completed your first AI product assessment before discarding an item.',
    requirementText: 'Scan 1 product',
  },
  {
    badgeType: 'Reuse Champion',
    description: 'Gave unwanted items practical second lives through creative reuse.',
    requirementText: 'Reuse 3 products',
  },
  {
    badgeType: 'Recycling Hero',
    description: 'Sorted and prepared recyclable materials according to local streams.',
    requirementText: 'Recycle 5 products',
  },
  {
    badgeType: 'Donation Supporter',
    description: 'Passed functional goods on to people and organizations who can use them.',
    requirementText: 'Donate 2 products',
  },
  {
    badgeType: 'Community Helper',
    description: 'Shared or exchanged usable items directly with neighbors.',
    requirementText: 'Complete 1 community exchange',
  },
  {
    badgeType: 'Eco Warrior',
    description: 'Sustained circular living across multiple waste-diversion pathways.',
    requirementText: 'Earn 200 eco-points',
  },
];

export function evaluateEligibleBadges(stats: Pick<
  PublicProfile,
  'scannedCount' | 'reusedCount' | 'recycledCount' | 'donatedCount' | 'exchangedCount' | 'ecoPoints'
>): BadgeType[] {
  const earned: BadgeType[] = [];
  if (stats.scannedCount >= 1) earned.push('First Scan');
  if (stats.reusedCount >= 3) earned.push('Reuse Champion');
  if (stats.recycledCount >= 5) earned.push('Recycling Hero');
  if (stats.donatedCount >= 2) earned.push('Donation Supporter');
  if (stats.exchangedCount >= 1) earned.push('Community Helper');
  if (stats.ecoPoints >= 200) earned.push('Eco Warrior');
  return earned;
}

export function computeGoalProgress(current: number, target: number): number {
  if (!Number.isFinite(target) || target <= 0) return 0;
  if (!Number.isFinite(current) || current <= 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

export interface WeeklyChartPoint {
  day: string;
  reused: number;
  donated: number;
  recycled: number;
  exchanged: number;
  scanned: number;
}

export interface MonthlyChartPoint {
  month: string;
  recycled: number;
  divertedKg: number;
  secondLifeCount: number;
}

export interface CategoryDistributionPoint {
  category: string;
  count: number;
}

export function buildWeeklyActivitySeries(
  activities: UserActivity[],
  referenceDate: Date = new Date()
): WeeklyChartPoint[] {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const points: WeeklyChartPoint[] = [];
  const keyMap = new Map<string, WeeklyChartPoint>();

  for (let offset = 6; offset >= 0; offset--) {
    const d = new Date(referenceDate);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - offset);
    const isoDay = d.toISOString().slice(0, 10);
    const point: WeeklyChartPoint = {
      day: dayNames[d.getDay()],
      reused: 0,
      donated: 0,
      recycled: 0,
      exchanged: 0,
      scanned: 0,
    };
    points.push(point);
    keyMap.set(isoDay, point);
  }

  for (const act of activities) {
    const parsed = new Date(act.createdAt);
    if (Number.isNaN(parsed.getTime())) continue;
    const isoDay = parsed.toISOString().slice(0, 10);
    const target = keyMap.get(isoDay);
    if (!target) continue;
    if (act.activityType === 'reuse') target.reused += 1;
    else if (act.activityType === 'donate') target.donated += 1;
    else if (act.activityType === 'recycle') target.recycled += 1;
    else if (act.activityType === 'exchange') target.exchanged += 1;
    else if (act.activityType === 'scan') target.scanned += 1;
  }

  return points;
}

export function buildMonthlyProgressSeries(
  activities: UserActivity[],
  referenceDate: Date = new Date()
): MonthlyChartPoint[] {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const points: MonthlyChartPoint[] = [];
  const keyMap = new Map<string, MonthlyChartPoint>();

  for (let offset = 5; offset >= 0; offset--) {
    const d = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - offset, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const point: MonthlyChartPoint = {
      month: monthNames[d.getMonth()],
      recycled: 0,
      divertedKg: 0,
      secondLifeCount: 0,
    };
    points.push(point);
    keyMap.set(key, point);
  }

  for (const act of activities) {
    const parsed = new Date(act.createdAt);
    if (Number.isNaN(parsed.getTime())) continue;
    const key = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
    const target = keyMap.get(key);
    if (!target) continue;
    if (act.activityType === 'recycle') {
      target.recycled += 1;
      target.divertedKg = Math.round((target.divertedKg + act.estimatedKg) * 100) / 100;
    } else if (
      act.activityType === 'reuse' ||
      act.activityType === 'donate' ||
      act.activityType === 'exchange'
    ) {
      target.secondLifeCount += 1;
      target.divertedKg = Math.round((target.divertedKg + act.estimatedKg) * 100) / 100;
    }
  }

  return points;
}

export function buildCategoryDistribution(activities: UserActivity[]): CategoryDistributionPoint[] {
  const counts = new Map<string, number>();
  for (const act of activities) {
    const cat = act.category || 'Other materials';
    counts.set(cat, (counts.get(cat) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

const UNSAFE_LISTING_PATTERNS = [
  'broken glass',
  'leaking battery',
  'leaking acid',
  'asbestos',
  'expired medicine',
  'prescription drug',
  'hazardous chemical',
  'biohazard',
  'moldy food',
  'rotten',
  'contaminated',
  'frayed live wire',
];

export interface ListingValidationInput {
  productName: string;
  description: string;
  approximateLocation: string;
  listingType: 'free' | 'exchange';
  exchangePreference?: string;
}

export function validateListingInput(input: ListingValidationInput): { valid: boolean; error?: string } {
  const name = input.productName.trim();
  const desc = input.description.trim();
  const loc = input.approximateLocation.trim();

  if (name.length < 2 || name.length > 120) {
    return { valid: false, error: 'Product name must be between 2 and 120 characters.' };
  }
  if (desc.length < 5 || desc.length > 1000) {
    return { valid: false, error: 'Please provide a clear description (at least 5 characters).' };
  }
  if (loc.length < 2 || loc.length > 100) {
    return { valid: false, error: 'Please enter an approximate neighborhood or city (never your exact street address).' };
  }
  const combined = `${name} ${desc}`.toLowerCase();
  for (const banned of UNSAFE_LISTING_PATTERNS) {
    if (combined.includes(banned)) {
      return {
        valid: false,
        error: `Only safe and usable items may be listed. Detected unsafe phrase: "${banned}". Check the Recycling or Disposal Guide instead.`,
      };
    }
  }
  if (/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/.test(combined)) {
    return {
      valid: false,
      error: 'For your privacy, please do not include personal phone numbers in public listings. Use in-app messaging instead.',
    };
  }
  return { valid: true };
}

export function sanitizeFirestoreId(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120);
  return cleaned || `id_${Date.now()}`;
}
