import { useState, type FormEvent } from 'react';
import {
  ArrowRight,
  BookOpen,
  Camera,
  Lightbulb,
  Repeat,
  Search,
  Sparkles,
  Upload,
} from 'lucide-react';
import type { User } from 'firebase/auth';
import type {
  AppRoute,
  CommunityListing,
  PublicProfile,
  ScannedProductRecord,
  UserProfile,
} from '../types/sustainability';
import { FEATURED_REUSE_IDEAS, GENERATED_ASSETS, SUSTAINABILITY_TIPS } from '../data/seedData';
import { SafeImage } from './SafeImage';

interface HomePageProps {
  user: User | null;
  profile: UserProfile | null;
  publicProfiles: PublicProfile[];
  listings: CommunityListing[];
  recentScans: ScannedProductRecord[];
  onNavigate: (route: AppRoute) => void;
  onStartScanMode: (mode: 'camera' | 'upload') => void;
  onProductSearch: (queryText: string) => void;
  onOpenAuth: () => void;
  onSelectGuideCategory: (categoryId: string) => void;
}

export function HomePage({
  user,
  profile,
  publicProfiles,
  listings,
  recentScans,
  onNavigate,
  onStartScanMode,
  onProductSearch,
  onOpenAuth,
  onSelectGuideCategory,
}: HomePageProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    onProductSearch(q);
  };

  // Real aggregated community statistics from Firestore publicProfiles & communityListings
  const totalScanned = publicProfiles.reduce((acc, p) => acc + (p.scannedCount || 0), 0);
  const totalSecondLife = publicProfiles.reduce(
    (acc, p) => acc + (p.reusedCount || 0) + (p.donatedCount || 0) + (p.exchangedCount || 0),
    0
  );
  const totalKgDiverted =
    Math.round(publicProfiles.reduce((acc, p) => acc + (p.estimatedKgDiverted || 0), 0) * 10) / 10;
  const activeMarketplaceCount = listings.filter((l) => l.status === 'available').length;

  const previewListings = listings.slice(0, 3);

  return (
    <div className="space-y-16 pb-16">
      {/* 1. Hero Section */}
      <section className="pt-8 sm:pt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            <div className="lg:col-span-7 flex flex-col justify-between bg-white rounded-2xl border border-[#263238]/10 p-6 sm:p-10">
              <div className="space-y-5">
                {user && (
                  <p className="text-sm font-medium text-[#1B5E20]">
                    Welcome back, {profile?.name || user.displayName || 'Contributor'}
                    {profile?.location ? ` · ${profile.location}` : ''}
                  </p>
                )}

                <h1
                  className="font-display font-bold tracking-tight text-[#263238] leading-[1.08]"
                  style={{ fontSize: 'clamp(2.25rem, 4vw, 3.75rem)', textWrap: 'balance' }}
                >
                  Before You Throw It Away
                </h1>

                <p className="text-base sm:text-lg text-[#263238]/80 max-w-2xl leading-relaxed">
                  Discover the hidden value of unwanted products. Reuse, donate, exchange, or recycle instead of throwing them away.
                </p>

                <p className="text-xs font-medium text-[#263238]/60">
                  Think Before You Throw – Give Every Product a Second Life.
                </p>
              </div>

              <div className="mt-8 space-y-5">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onStartScanMode('camera')}
                    className="px-6 py-3 rounded-xl bg-[#1B5E20] hover:bg-[#144718] text-white font-semibold text-sm inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Camera className="w-4 h-4" />
                    Scan Your Waste
                  </button>
                  <button
                    type="button"
                    onClick={() => onStartScanMode('upload')}
                    className="px-5 py-3 rounded-xl bg-[#E8F5E9] hover:bg-[#d7eed9] text-[#1B5E20] font-semibold text-sm inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Image
                  </button>
                  {!user && (
                    <button
                      type="button"
                      onClick={onOpenAuth}
                      className="px-5 py-3 rounded-xl border border-[#263238]/20 hover:border-[#1B5E20] text-[#263238] font-medium text-sm transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      Register / Sign In
                    </button>
                  )}
                </div>

                <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2">
                  <label htmlFor="home-product-search" className="sr-only">
                    Search for a product to check reuse or recycling options
                  </label>
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-[#263238]/45 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="home-product-search"
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search for a product (e.g., glass jam jar, old laptop, denim jeans)"
                      className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-[#263238]/20 bg-[#F7F9F5] focus:bg-white focus:outline-none focus:border-[#1B5E20]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#263238] hover:bg-[#1a2226] text-white text-sm font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Analyze Product
                  </button>
                </form>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="h-full min-h-[280px] rounded-2xl overflow-hidden border border-[#263238]/10 bg-white">
                <SafeImage
                  src={GENERATED_ASSETS.heroStudio}
                  alt="Sorted amber glass jars, folded linen textiles, ceramic planters, and solid oak stool in a sunlit circular studio"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Live Platform Statistics Strip */}
          <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-[#263238]/10 px-5 py-4">
              <p className="text-xs text-[#263238]/65">Products Assessed</p>
              <p className="font-mono tabular-nums text-2xl font-bold text-[#1B5E20] mt-1">{totalScanned}</p>
            </div>
            <div className="bg-white rounded-xl border border-[#263238]/10 px-5 py-4">
              <p className="text-xs text-[#263238]/65">Second Lives Given</p>
              <p className="font-mono tabular-nums text-2xl font-bold text-[#1B5E20] mt-1">{totalSecondLife}</p>
            </div>
            <div className="bg-white rounded-xl border border-[#263238]/10 px-5 py-4">
              <p className="text-xs text-[#263238]/65">Est. Landfill Diverted</p>
              <p className="font-mono tabular-nums text-2xl font-bold text-[#1B5E20] mt-1">{totalKgDiverted} kg</p>
            </div>
            <div className="bg-white rounded-xl border border-[#263238]/10 px-5 py-4">
              <p className="text-xs text-[#263238]/65">Active Exchange Items</p>
              <p className="font-mono tabular-nums text-2xl font-bold text-[#1B5E20] mt-1">{activeMarketplaceCount}</p>
            </div>
          </div>
          <p className="text-xs text-[#263238]/55 mt-2">
            Live metrics calculated directly from verified community activities and active listings in Firestore.
          </p>
        </div>
      </section>

      {/* 2. Four Main Feature Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#263238]">
              Four Pathways Out of the Landfill
            </h2>
            <p className="text-sm text-[#263238]/75 mt-1">
              Every unwanted item follows a clear hierarchy: reuse first, donate when functional, recycle cleanly, or dispose safely.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <button
            type="button"
            onClick={() => onNavigate('scanner')}
            className="text-left bg-white hover:bg-[#E8F5E9]/40 rounded-2xl border border-[#263238]/10 p-6 transition-colors flex flex-col justify-between cursor-pointer group"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#E8F5E9] text-[#1B5E20] flex items-center justify-center mb-4">
                <Camera className="w-5 h-5" />
              </div>
              <h3 className="font-display text-lg font-bold text-[#263238]">01. AI Waste Scanner</h3>
              <p className="text-sm text-[#263238]/75 mt-2 leading-relaxed">
                Snap a photo or upload an image to identify materials, condition, safety risks, and the optimal circular action.
              </p>
            </div>
            <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-[#1B5E20] group-hover:translate-x-0.5 transition-transform">
              Open Scanner <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('scanner')}
            className="text-left bg-white hover:bg-[#E8F5E9]/40 rounded-2xl border border-[#263238]/10 p-6 transition-colors flex flex-col justify-between cursor-pointer group"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#E8F5E9] text-[#1B5E20] flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-display text-lg font-bold text-[#263238]">02. Discover Alternative Uses</h3>
              <p className="text-sm text-[#263238]/75 mt-2 leading-relaxed">
                Get step-by-step DIY repurposing instructions, required tools, time estimates, and practical home upgrades.
              </p>
            </div>
            <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-[#1B5E20] group-hover:translate-x-0.5 transition-transform">
              Explore Reuse Engine <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('community')}
            className="text-left bg-white hover:bg-[#E8F5E9]/40 rounded-2xl border border-[#263238]/10 p-6 transition-colors flex flex-col justify-between cursor-pointer group"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#E8F5E9] text-[#1B5E20] flex items-center justify-center mb-4">
                <Repeat className="w-5 h-5" />
              </div>
              <h3 className="font-display text-lg font-bold text-[#263238]">03. Community Exchange</h3>
              <p className="text-sm text-[#263238]/75 mt-2 leading-relaxed">
                Offer usable items for free giveaway or local swap with privacy-protected approximate locations and messaging.
              </p>
            </div>
            <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-[#1B5E20] group-hover:translate-x-0.5 transition-transform">
              Browse Marketplace <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('guide')}
            className="text-left bg-white hover:bg-[#E8F5E9]/40 rounded-2xl border border-[#263238]/10 p-6 transition-colors flex flex-col justify-between cursor-pointer group"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#E8F5E9] text-[#1B5E20] flex items-center justify-center mb-4">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-display text-lg font-bold text-[#263238]">04. Recycling Guide</h3>
              <p className="text-sm text-[#263238]/75 mt-2 leading-relaxed">
                Check 8 material streams—from #1/#2 plastics to lithium batteries—with preparation steps and municipal lookup advice.
              </p>
            </div>
            <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-[#1B5E20] group-hover:translate-x-0.5 transition-transform">
              Read Recycling Guide <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </button>
        </div>
      </section>

      {/* 3. Recently Scanned Products + Environmental Impact Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white rounded-2xl border border-[#263238]/10 p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="font-display text-xl font-bold text-[#263238]">Recently Scanned Products</h2>
                <p className="text-xs text-[#263238]/65 mt-0.5">
                  {user ? 'Your latest AI material analyses' : 'Sign in to keep a private log of every item you scan'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate(user ? 'profile' : 'scanner')}
                className="text-xs font-semibold text-[#1B5E20] hover:underline cursor-pointer whitespace-nowrap"
              >
                {user ? 'View Full History' : 'Scan First Item'}
              </button>
            </div>

            {user && recentScans.length > 0 ? (
              <div className="divide-y divide-[#263238]/10">
                {recentScans.slice(0, 4).map((scan) => (
                  <div key={scan.scanId} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl overflow-hidden border border-[#263238]/10 shrink-0">
                        <SafeImage src={scan.imageUrl} alt={scan.productName} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-[#263238] truncate">{scan.productName}</p>
                        <p className="text-xs text-[#263238]/65 truncate">
                          {scan.category} · {scan.condition}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-[#1B5E20] whitespace-nowrap shrink-0">
                      {scan.recommendation}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl bg-[#F7F9F5] border border-[#263238]/10 p-6 text-center space-y-3">
                <p className="text-sm text-[#263238]/80">
                  {user
                    ? 'You have not scanned an item yet. Snap a quick photo to receive a Reuse, Donate, Recycle, or Disposal plan.'
                    : 'Scan any household item instantly with Gemini Vision, or sign in to preserve your personal scan history.'}
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('scanner')}
                  className="px-4 py-2 rounded-lg bg-[#1B5E20] text-white text-xs font-semibold hover:bg-[#144718] cursor-pointer"
                >
                  Try AI Waste Scanner
                </button>
              </div>
            )}
          </div>

          {/* Impact Dashboard Preview */}
          <div className="lg:col-span-5 bg-[#1B5E20] text-white rounded-2xl p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold">Environmental Impact Dashboard</h2>
              <p className="text-sm text-white/85 mt-2 leading-relaxed">
                Track verified items reused, donated, recycled, and exchanged alongside monthly goals, category breakdowns, and contributor milestones.
              </p>

              <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/15">
                <div>
                  <p className="text-xs text-white/75">Community Eco-Points</p>
                  <p className="font-mono tabular-nums text-2xl font-bold mt-0.5">
                    {publicProfiles.reduce((acc, p) => acc + (p.ecoPoints || 0), 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-white/75">Verified Contributors</p>
                  <p className="font-mono tabular-nums text-2xl font-bold mt-0.5">{publicProfiles.length}</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className="mt-8 w-full py-2.5 px-4 rounded-xl bg-white text-[#1B5E20] hover:bg-[#E8F5E9] font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              Open Impact Dashboard <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 4. Community Exchange Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#263238]">Community Exchange Preview</h2>
            <p className="text-sm text-[#263238]/75 mt-1">
              Usable furniture, kitchenware, books, and clothing shared nearby—never showing private addresses or phone numbers.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('community')}
            className="text-sm font-semibold text-[#1B5E20] hover:underline inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
          >
            View All Listings <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {previewListings.map((item) => (
            <button
              key={item.listingId}
              type="button"
              onClick={() => onNavigate('community')}
              className="text-left bg-white rounded-2xl border border-[#263238]/10 overflow-hidden hover:border-[#1B5E20]/40 transition-colors cursor-pointer flex flex-col"
            >
              <div className="aspect-[4/3] w-full overflow-hidden bg-[#F7F9F5]">
                <SafeImage src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
              </div>
              <div className="p-5 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-display text-base font-bold text-[#263238] line-clamp-1">
                    {item.productName}
                  </h3>
                  <p className="text-xs text-[#263238]/65 mt-1">
                    {item.listingType === 'free' ? 'Free Giveaway' : 'Open to Exchange'} · {item.condition} ·{' '}
                    {item.category}
                  </p>
                  <p className="text-sm text-[#263238]/80 mt-2.5 line-clamp-2">{item.description}</p>
                </div>
                <p className="text-xs font-medium text-[#1B5E20] pt-2">{item.approximateLocation}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 5. Featured Reuse Ideas & Recycling Guide Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#263238]">Featured Reuse Ideas</h2>
          <p className="text-sm text-[#263238]/75 mt-1">
            Practical DIY upcycling projects that extend everyday materials without specialized machinery.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURED_REUSE_IDEAS.map((idea) => (
            <article
              key={idea.id}
              className="bg-white rounded-2xl border border-[#263238]/10 overflow-hidden flex flex-col"
            >
              <div className="aspect-[4/3] w-full overflow-hidden">
                <SafeImage src={idea.imageUrl} alt={idea.title} className="w-full h-full object-cover" />
              </div>
              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-display text-base font-bold text-[#263238]">{idea.title}</h3>
                  <p className="text-xs text-[#263238]/65 mt-1">
                    {idea.sourceItem} · {idea.difficulty} · {idea.estimatedTime}
                  </p>
                  <p className="text-sm text-[#263238]/80 mt-2 leading-relaxed">{idea.summary}</p>
                </div>
                <p className="text-xs text-[#1B5E20] font-medium pt-2 border-t border-[#263238]/10">
                  {idea.environmentalBenefit}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 6. Recycling Guide Preview & Sustainability Tips */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-6 bg-white rounded-2xl border border-[#263238]/10 p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold text-[#263238]">Recycling Guide Preview</h2>
              <p className="text-sm text-[#263238]/75 mt-2">
                Prepare materials properly so clean recyclables are actually reprocessed instead of rejected for contamination.
              </p>

              <div className="grid grid-cols-2 gap-2.5 mt-5">
                {[
                  { id: 'plastic', label: 'Plastic (#1, #2, #5)' },
                  { id: 'paper', label: 'Paper & Cardboard' },
                  { id: 'glass', label: 'Container Glass' },
                  { id: 'metal', label: 'Aluminum & Steel' },
                  { id: 'ewaste', label: 'Electronic Waste' },
                  { id: 'battery', label: 'Battery Safety' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      onSelectGuideCategory(cat.id);
                      onNavigate('guide');
                    }}
                    className="text-left px-3.5 py-2.5 rounded-xl border border-[#263238]/10 hover:border-[#1B5E20] hover:bg-[#E8F5E9]/40 text-xs font-semibold text-[#263238] transition-colors cursor-pointer"
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 flex items-center gap-4">
              <div className="w-24 h-18 rounded-xl overflow-hidden border border-[#263238]/10 shrink-0">
                <SafeImage
                  src={GENERATED_ASSETS.recyclingSorting}
                  alt="Sorted plastic, cardboard, cans, and glass"
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => onNavigate('guide')}
                className="text-sm font-semibold text-[#1B5E20] hover:underline inline-flex items-center gap-1.5 cursor-pointer"
              >
                Explore All 8 Material Guides <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 bg-white rounded-2xl border border-[#263238]/10 p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-5 h-5 text-[#1B5E20]" />
              <h2 className="font-display text-2xl font-bold text-[#263238]">Sustainability Tips</h2>
            </div>

            <div className="divide-y divide-[#263238]/10">
              {SUSTAINABILITY_TIPS.map((tip) => (
                <div key={tip.id} className="py-3.5 first:pt-0 last:pb-0">
                  <p className="text-sm font-semibold text-[#263238]">{tip.title}</p>
                  <p className="text-xs text-[#263238]/60 mt-0.5">{tip.category}</p>
                  <p className="text-xs sm:text-sm text-[#263238]/80 mt-1.5 leading-relaxed">{tip.summary}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
