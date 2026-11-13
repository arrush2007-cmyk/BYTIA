import type { CommunityListing } from '../types/sustainability';

export const GENERATED_ASSETS = {
  heroStudio: '/src/assets/images/hero_circular_studio_1794542223661.jpg',
  reuseGlassPlanter: '/src/assets/images/reuse_glass_planter_1794542224115.jpg',
  communityChair: '/src/assets/images/community_vintage_chair_1794542225365.jpg',
  reuseDenimTote: '/src/assets/images/reuse_denim_tote_1794542224826.jpg',
  recyclingSorting: '/src/assets/images/recycling_sorting_guide_1794542224472.jpg',
};

export interface FeaturedReuseIdea {
  id: string;
  title: string;
  sourceItem: string;
  difficulty: 'Easy' | 'Moderate';
  estimatedTime: string;
  imageUrl: string;
  summary: string;
  steps: string[];
  environmentalBenefit: string;
}

export const FEATURED_REUSE_IDEAS: FeaturedReuseIdea[] = [
  {
    id: 'idea_glass_herb_planter',
    title: 'Windowsill Herb Planters from Glass Jars',
    sourceItem: 'Empty Jam & Sauce Jars',
    difficulty: 'Easy',
    estimatedTime: '20 mins',
    imageUrl: GENERATED_ASSETS.reuseGlassPlanter,
    summary:
      'Turn wide-mouth food jars into self-draining indoor herb gardens for basil, mint, and chives.',
    steps: [
      'Soak jars in warm soapy water to remove adhesive labels cleanly.',
      'Add a 2 cm base layer of small pebbles or broken ceramic shards for drainage.',
      'Fill with organic potting mix, plant herb seedlings, and label with masking tape.',
    ],
    environmentalBenefit: 'Extends container utility indefinitely and cuts demand for single-use plastic herb clamshells.',
  },
  {
    id: 'idea_denim_market_tote',
    title: 'Heavy-Duty Market Tote from Old Jeans',
    sourceItem: 'Worn-Out Denim Trousers',
    difficulty: 'Moderate',
    estimatedTime: '45 mins',
    imageUrl: GENERATED_ASSETS.reuseDenimTote,
    summary:
      'Repurpose thick cotton denim legs and reinforced back pockets into a washable grocery tote.',
    steps: [
      'Cut both pant legs above the knee and preserve the intact back-pocket panel.',
      'Stitch the bottom seam with double-fold reinforcing thread and attach waistband strips as handles.',
      'Use leftover scraps as sturdy pot holders or quilt patches.',
    ],
    environmentalBenefit: 'Diverts high-water-footprint cotton denim from textile waste while replacing hundreds of disposable bags.',
  },
  {
    id: 'idea_oak_chair_refresh',
    title: 'Beeswax Conditioning for Scuffed Wood Furniture',
    sourceItem: 'Scratched Wooden Chairs & Stools',
    difficulty: 'Easy',
    estimatedTime: '35 mins',
    imageUrl: GENERATED_ASSETS.communityChair,
    summary:
      'Revive dull solid wood frames with gentle sanding and food-safe beeswax balm instead of replacing.',
    steps: [
      'Tighten loose dowels or screws and wipe away surface dust.',
      'Lightly buff scratches along the wood grain using 220-grit sandpaper.',
      'Rub in natural beeswax and buff with a clean lint-free cotton cloth.',
    ],
    environmentalBenefit: 'Preserves embodied carbon in solid timber furniture and avoids bulky landfill disposal.',
  },
];

export interface SustainabilityTip {
  id: string;
  title: string;
  category: string;
  summary: string;
}

export const SUSTAINABILITY_TIPS: SustainabilityTip[] = [
  {
    id: 'tip_wishcycling',
    title: 'Avoid "Wish-Cycling" Contaminating Clean Batches',
    category: 'Recycling Hygiene',
    summary:
      'Tossing greasy containers or plastic bags into a recycling cart hoping they will be sorted often forces an entire truckload into landfill.',
  },
  {
    id: 'tip_reuse_first',
    title: 'Prioritize Direct Reuse Over Melting Down',
    category: 'Circular Hierarchy',
    summary:
      'Passing a working chair, coat, or jar to a neighbor keeps 100% of its manufacturing energy intact—requiring zero industrial reprocessing.',
  },
  {
    id: 'tip_battery_tape',
    title: 'Always Tape Battery Terminals Before Storage',
    category: 'Fire Prevention',
    summary:
      'Cover exposed battery contacts with clear tape before storing them for hazardous drop-off to prevent thermal short-circuits.',
  },
  {
    id: 'tip_repair_check',
    title: 'Run a 5-Minute Fix Check on Small Electronics',
    category: 'Right to Repair',
    summary:
      'Dead lamps, kettles, and headphones frequently only need a replacement cord, fuse, or earpad rather than full replacement.',
  },
];

export const SHOWCASE_COMMUNITY_LISTINGS: CommunityListing[] = [
  {
    listingId: 'sample_oak_chair_01',
    userId: 'community_showcase',
    sellerName: 'Maya R.',
    productName: 'Restored Solid Oak Dining Chair + Design Books',
    description:
      'Sturdy spindle-back oak chair with fresh beeswax finish and six hardcover architecture & craft books. Clean, smoke-free home.',
    category: 'Furniture',
    condition: 'Good',
    imageUrl: GENERATED_ASSETS.communityChair,
    approximateLocation: 'Northside · Portland, OR',
    listingType: 'exchange',
    exchangePreference: 'Looking for ceramic plant pots or indoor watering can',
    status: 'available',
    createdAt: '2026-11-10T14:20:00Z',
    updatedAt: '2026-11-10T14:20:00Z',
    isSample: true,
  },
  {
    listingId: 'sample_glass_jars_02',
    userId: 'community_showcase',
    sellerName: 'Daniel K.',
    productName: 'Set of 5 Wide-Mouth Glass Herb Planter Jars',
    description:
      'Clean sterilized glass jars ready for pantry bulk storage, propagation, or windowsill kitchen herbs. No chips or cracks.',
    category: 'Kitchen items',
    condition: 'Like New',
    imageUrl: GENERATED_ASSETS.reuseGlassPlanter,
    approximateLocation: 'Greenwood · Seattle, WA',
    listingType: 'free',
    status: 'available',
    createdAt: '2026-11-11T09:15:00Z',
    updatedAt: '2026-11-11T09:15:00Z',
    isSample: true,
  },
  {
    listingId: 'sample_denim_tote_03',
    userId: 'community_showcase',
    sellerName: 'Priya S.',
    productName: 'Upcycled Heavy Denim Market Tote & Cotton Scraps',
    description:
      'Hand-stitched indigo denim tote plus neatly folded organic cotton swatches for mending or quilting projects.',
    category: 'Clothing',
    condition: 'Like New',
    imageUrl: GENERATED_ASSETS.reuseDenimTote,
    approximateLocation: 'Capitol Hill · Denver, CO',
    listingType: 'exchange',
    exchangePreference: 'Open to hardcover fiction books or kitchenware',
    status: 'available',
    createdAt: '2026-11-12T07:45:00Z',
    updatedAt: '2026-11-12T07:45:00Z',
    isSample: true,
  },
];
