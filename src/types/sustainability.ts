export type WasteCategory =
  | 'Plastic'
  | 'Paper and cardboard'
  | 'Glass'
  | 'Metal'
  | 'Electronic waste'
  | 'Clothes and textiles'
  | 'Furniture'
  | 'Wood'
  | 'Food waste'
  | 'Household items'
  | 'Other materials';

export const WASTE_CATEGORIES: WasteCategory[] = [
  'Plastic',
  'Paper and cardboard',
  'Glass',
  'Metal',
  'Electronic waste',
  'Clothes and textiles',
  'Furniture',
  'Wood',
  'Food waste',
  'Household items',
  'Other materials',
];

export type RecommendationType = 'REUSE' | 'DONATE' | 'RECYCLE' | 'DISPOSE';

export type MarketplaceCategory =
  | 'Electronics'
  | 'Furniture'
  | 'Clothing'
  | 'Books'
  | 'Toys'
  | 'Household products'
  | 'Kitchen items'
  | 'School supplies'
  | 'Other';

export const MARKETPLACE_CATEGORIES: MarketplaceCategory[] = [
  'Electronics',
  'Furniture',
  'Clothing',
  'Books',
  'Toys',
  'Household products',
  'Kitchen items',
  'School supplies',
  'Other',
];

export type ItemCondition = 'Like New' | 'Good' | 'Fair';

export interface ReuseIdeaDetail {
  title: string;
  description: string;
  requiredMaterials: string[];
  difficulty: 'Easy' | 'Moderate' | 'Advanced';
  estimatedTime: string;
  steps: string[];
  environmentalBenefits: string;
}

export interface DonationGuidance {
  suitable: boolean;
  whySuitableOrNot: string;
  whoMightBenefit: string[];
  suggestedOptions: string[];
  preparationSteps: string[];
}

export interface RecyclingGuidance {
  eligible: boolean;
  materialType: string;
  preparationInstructions: string[];
  separationRequirements: string[];
  recyclingSteps: string[];
  collectionOptions: string[];
}

export interface DisposalGuidance {
  whyNotReusable: string;
  whyNotDonatable: string;
  appropriateMethod: string;
  safetyPrecautions: string[];
  localGuidance: string;
}

export interface WasteAnalysisResult {
  identified: boolean;
  clarificationNeededReason?: string;
  productName: string;
  category: WasteCategory;
  materialComposition: string;
  visibleCondition: string;
  isReusable: boolean;
  isRepairable: boolean;
  isRecyclable: boolean;
  isHazardous: boolean;
  hazardWarning?: string;
  donationSuitable: boolean;
  primaryRecommendation: RecommendationType;
  decisionSummary: string;
  decisionReasoning: string;
  estimatedWeightKg: number;
  reuseIdeas: ReuseIdeaDetail[];
  donationGuidance: DonationGuidance;
  recyclingGuidance: RecyclingGuidance;
  disposalGuidance: DisposalGuidance;
}

export interface UserProfile {
  userId: string;
  name: string;
  email: string;
  profileImage?: string;
  location?: string;
  ecoPoints: number;
  goalReuse: number;
  goalDonate: number;
  goalRecycle: number;
  createdAt: string;
  updatedAt: string;
}

export interface PublicProfile {
  userId: string;
  displayName: string;
  photoUrl?: string;
  city?: string;
  ecoPoints: number;
  scannedCount: number;
  reusedCount: number;
  donatedCount: number;
  recycledCount: number;
  exchangedCount: number;
  disposedCount: number;
  estimatedKgDiverted: number;
  updatedAt: string;
}

export interface ScannedProductRecord {
  scanId: string;
  userId: string;
  productName: string;
  category: WasteCategory;
  material: string;
  condition: string;
  recommendation: RecommendationType;
  alternativeUses: string[];
  recyclingSteps: string[];
  analysisPayload?: WasteAnalysisResult;
  imageUrl?: string;
  isSaved: boolean;
  actionTaken?: string;
  createdAt: string;
}

export interface CommunityListing {
  listingId: string;
  userId: string;
  sellerName: string;
  productName: string;
  description: string;
  category: MarketplaceCategory;
  condition: ItemCondition;
  imageUrl?: string;
  approximateLocation: string;
  listingType: 'free' | 'exchange';
  exchangePreference?: string;
  status: 'available' | 'exchanged' | 'unavailable';
  createdAt: string;
  updatedAt: string;
  isSample?: boolean;
}

export interface ExchangeRequest {
  requestId: string;
  listingId: string;
  listingTitle: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface ExchangeMessage {
  messageId: string;
  requestId: string;
  senderId: string;
  receiverId: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
}

export type ActivityType = 'scan' | 'reuse' | 'donate' | 'recycle' | 'exchange' | 'dispose';

export interface UserActivity {
  activityId: string;
  userId: string;
  activityType: ActivityType;
  productId: string;
  productName: string;
  category: string;
  estimatedKg: number;
  verifiedStatus: 'verified';
  ecoPoints: number;
  createdAt: string;
}

export type BadgeType =
  | 'First Scan'
  | 'Reuse Champion'
  | 'Recycling Hero'
  | 'Donation Supporter'
  | 'Community Helper'
  | 'Eco Warrior';

export interface AchievementRecord {
  achievementId: string;
  userId: string;
  badgeType: BadgeType;
  earnedAt: string;
}

export type AppRoute =
  | 'home'
  | 'scanner'
  | 'community'
  | 'guide'
  | 'dashboard'
  | 'profile';
