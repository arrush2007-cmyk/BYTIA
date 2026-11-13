import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCategoryDistribution,
  buildMonthlyProgressSeries,
  buildWeeklyActivitySeries,
  computeGoalProgress,
  evaluateEligibleBadges,
  getEstimatedWeightKg,
  sanitizeFirestoreId,
  validateListingInput,
} from './impactCalculations';
import type { UserActivity } from '../types/sustainability';

test('evaluateEligibleBadges unlocks expected milestones', () => {
  const badges = evaluateEligibleBadges({
    scannedCount: 1,
    reusedCount: 3,
    recycledCount: 5,
    donatedCount: 2,
    exchangedCount: 1,
    ecoPoints: 245,
  });

  assert.deepEqual(badges, [
    'First Scan',
    'Reuse Champion',
    'Recycling Hero',
    'Donation Supporter',
    'Community Helper',
    'Eco Warrior',
  ]);
});

test('evaluateEligibleBadges returns empty array for new account', () => {
  const badges = evaluateEligibleBadges({
    scannedCount: 0,
    reusedCount: 0,
    recycledCount: 0,
    donatedCount: 0,
    exchangedCount: 0,
    ecoPoints: 0,
  });
  assert.deepEqual(badges, []);
});

test('computeGoalProgress clamps between 0 and 100 safely', () => {
  assert.equal(computeGoalProgress(3, 5), 60);
  assert.equal(computeGoalProgress(8, 5), 100);
  assert.equal(computeGoalProgress(2, 0), 0);
  assert.equal(computeGoalProgress(-1, 5), 0);
});

test('getEstimatedWeightKg uses safe override or category default', () => {
  assert.equal(getEstimatedWeightKg('Plastic'), 0.15);
  assert.equal(getEstimatedWeightKg('Furniture'), 8.0);
  assert.equal(getEstimatedWeightKg('Plastic', 1.25), 1.25);
  assert.equal(getEstimatedWeightKg('Unknown', -5), 0.5);
});

test('buildWeeklyActivitySeries and buildMonthlyProgressSeries aggregate real activities', () => {
  const ref = new Date('2026-11-12T12:00:00Z');
  const activities: UserActivity[] = [
    {
      activityId: 'a1',
      userId: 'u1',
      activityType: 'reuse',
      productId: 'p1',
      productName: 'Glass Jar',
      category: 'Glass',
      estimatedKg: 0.45,
      verifiedStatus: 'verified',
      ecoPoints: 30,
      createdAt: '2026-11-12T08:00:00Z',
    },
    {
      activityId: 'a2',
      userId: 'u1',
      activityType: 'recycle',
      productId: 'p2',
      productName: 'Aluminum Can',
      category: 'Metal',
      estimatedKg: 0.35,
      verifiedStatus: 'verified',
      ecoPoints: 20,
      createdAt: '2026-11-11T09:00:00Z',
    },
    {
      activityId: 'a3',
      userId: 'u1',
      activityType: 'donate',
      productId: 'p3',
      productName: 'Winter Coat',
      category: 'Clothes and textiles',
      estimatedKg: 0.6,
      verifiedStatus: 'verified',
      ecoPoints: 35,
      createdAt: '2026-10-15T10:00:00Z',
    },
  ];

  const weekly = buildWeeklyActivitySeries(activities, ref);
  assert.equal(weekly.length, 7);
  assert.equal(weekly[6].reused, 1);
  assert.equal(weekly[5].recycled, 1);

  const monthly = buildMonthlyProgressSeries(activities, ref);
  assert.equal(monthly.length, 6);
  assert.equal(monthly[5].month, 'Nov');
  assert.equal(monthly[5].recycled, 1);
  assert.equal(monthly[5].secondLifeCount, 1);
  assert.equal(monthly[5].divertedKg, 0.8);
  assert.equal(monthly[4].month, 'Oct');
  assert.equal(monthly[4].secondLifeCount, 1);

  const categories = buildCategoryDistribution(activities);
  assert.equal(categories.length, 3);
});

test('validateListingInput enforces safety, privacy, and field validation', () => {
  assert.equal(
    validateListingInput({
      productName: 'Solid Oak Desk Lamp',
      description: 'Works cleanly, warm light bulb included.',
      approximateLocation: 'North Seattle, WA',
      listingType: 'free',
    }).valid,
    true
  );

  const unsafe = validateListingInput({
    productName: 'Leaking battery pack',
    description: 'Swollen cell from old laptop.',
    approximateLocation: 'Downtown',
    listingType: 'free',
  });
  assert.equal(unsafe.valid, false);

  const phonePrivacy = validateListingInput({
    productName: 'Wooden Chair',
    description: 'Call me at 555-234-5678 for pickup.',
    approximateLocation: 'Austin, TX',
    listingType: 'exchange',
  });
  assert.equal(phonePrivacy.valid, false);
});

test('sanitizeFirestoreId strips unsafe characters', () => {
  assert.equal(sanitizeFirestoreId('scan/123$test!'), 'scan_123_test_');
});
