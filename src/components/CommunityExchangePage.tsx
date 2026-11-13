import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  MapPin,
  MessageSquare,
  Plus,
  Search,
  Send,
  Upload,
  X,
} from 'lucide-react';
import type { User } from 'firebase/auth';
import {
  MARKETPLACE_CATEGORIES,
  type CommunityListing,
  type ExchangeMessage,
  type ExchangeRequest,
  type ItemCondition,
  type MarketplaceCategory,
  type UserProfile,
} from '../types/sustainability';
import {
  createCommunityListing,
  createExchangeRequest,
  respondToExchangeRequest,
  sendExchangeMessage,
  subscribeRequestMessages,
  updateListingStatus,
} from '../services/firestoreService';
import { processImageFile } from '../utils/imageCompression';
import { validateListingInput } from '../utils/impactCalculations';
import { SafeImage } from './SafeImage';

interface CommunityExchangePageProps {
  user: User | null;
  profile: UserProfile | null;
  listings: CommunityListing[];
  incomingRequests: ExchangeRequest[];
  outgoingRequests: ExchangeRequest[];
  prefillListing?: { productName: string; description: string; imageUrl?: string } | null;
  onClearPrefill?: () => void;
  onOpenAuth: () => void;
}

type MarketplaceTab = 'all' | 'near' | 'free' | 'exchange' | 'recent' | 'messages';

export function CommunityExchangePage({
  user,
  profile,
  listings,
  incomingRequests,
  outgoingRequests,
  prefillListing,
  onClearPrefill,
  onOpenAuth,
}: CommunityExchangePageProps) {
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [activeTab, setActiveTab] = useState<MarketplaceTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [locationFilter, setLocationFilter] = useState('');

  // Create Listing Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<MarketplaceCategory>('Household products');
  const [condition, setCondition] = useState<ItemCondition>('Good');
  const [approximateLocation, setApproximateLocation] = useState(profile?.location || '');
  const [listingType, setListingType] = useState<'free' | 'exchange'>('free');
  const [exchangePreference, setExchangePreference] = useState('');
  const [listingImageUrl, setListingImageUrl] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [submittingCreate, setSubmittingCreate] = useState(false);

  // Listing Detail & Request state
  const [selectedListing, setSelectedListing] = useState<CommunityListing | null>(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [requestFeedback, setRequestFeedback] = useState<string | null>(null);

  // Active Chat Request Thread
  const [activeRequest, setActiveRequest] = useState<ExchangeRequest | null>(null);
  const [threadMessages, setThreadMessages] = useState<ExchangeMessage[]>([]);
  const [chatDraft, setChatDraft] = useState('');

  useEffect(() => {
    if (prefillListing) {
      setProductName(prefillListing.productName);
      setDescription(prefillListing.description);
      setListingImageUrl(prefillListing.imageUrl || '');
      setApproximateLocation(profile?.location || '');
      setShowCreateModal(true);
      onClearPrefill?.();
    }
  }, [prefillListing, profile?.location, onClearPrefill]);

  useEffect(() => {
    if (!activeRequest || !user) {
      setThreadMessages([]);
      return;
    }
    const role = activeRequest.senderId === user.uid ? 'sender' : 'receiver';
    const unsub = subscribeRequestMessages(activeRequest.requestId, user.uid, role, setThreadMessages);
    return () => unsub();
  }, [activeRequest, user]);

  const userCityToken = (profile?.location || locationFilter || '').split(',')[0].trim().toLowerCase();

  const filteredListings = listings
    .filter((item) => {
      if (item.status !== 'available' && activeTab !== 'messages') {
        if (!user || item.userId !== user.uid) return false;
      }
      if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
      if (activeTab === 'free' && item.listingType !== 'free') return false;
      if (activeTab === 'exchange' && item.listingType !== 'exchange') return false;
      if (activeTab === 'near' && userCityToken) {
        if (!item.approximateLocation.toLowerCase().includes(userCityToken)) return false;
      }
      const q = searchQuery.trim().toLowerCase();
      if (q) {
        const matchesQuery =
          item.productName.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }
      const locQ = locationFilter.trim().toLowerCase();
      if (locQ && !item.approximateLocation.toLowerCase().includes(locQ)) return false;
      return true;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleOpenCreate = () => {
    if (!user) {
      onOpenAuth();
      return;
    }
    setCreateError(null);
    setApproximateLocation(profile?.location || '');
    setShowCreateModal(true);
  };

  const handleImageSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCreateError(null);
    try {
      const processed = await processImageFile(file);
      setListingImageUrl(processed.storageDataUrl);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Unable to process photo.');
    }
  };

  const handleCreateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth();
      return;
    }
    if (!user.emailVerified) {
      setCreateError('Please verify your email address before creating a public listing.');
      return;
    }

    const validation = validateListingInput({
      productName,
      description,
      approximateLocation,
      listingType,
      exchangePreference,
    });
    if (!validation.valid) {
      setCreateError(validation.error || 'Please check your listing inputs.');
      return;
    }

    setSubmittingCreate(true);
    setCreateError(null);
    try {
      await createCommunityListing(user.uid, profile?.name || user.displayName || 'Neighbor', {
        productName,
        description,
        category,
        condition,
        imageUrl: listingImageUrl,
        approximateLocation,
        listingType,
        exchangePreference: listingType === 'exchange' ? exchangePreference : '',
      });
      setShowCreateModal(false);
      setProductName('');
      setDescription('');
      setExchangePreference('');
      setListingImageUrl('');
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to publish listing.');
    } finally {
      setSubmittingCreate(false);
    }
  };

  const handleSendRequest = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedListing) return;
    if (!user) {
      onOpenAuth();
      return;
    }
    if (!user.emailVerified) {
      setRequestFeedback('Please verify your email address before sending exchange requests.');
      return;
    }
    if (selectedListing.isSample) {
      setRequestFeedback('This is an example showcase item. Create or select a live member listing to send requests.');
      return;
    }
    if (selectedListing.userId === user.uid) {
      setRequestFeedback('You cannot send an exchange request to your own listing.');
      return;
    }
    if (!requestMessage.trim()) {
      setRequestFeedback('Please include a short message for the owner.');
      return;
    }

    try {
      await createExchangeRequest(
        user.uid,
        profile?.name || user.displayName || 'Neighbor',
        selectedListing,
        requestMessage.trim()
      );
      setRequestMessage('');
      setRequestFeedback('Exchange request sent! Check "Requests & Messages" to chat.');
    } catch (err) {
      setRequestFeedback(err instanceof Error ? err.message : 'Could not send request.');
    }
  };

  const handleSendChatMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeRequest || !user || !chatDraft.trim()) return;
    try {
      await sendExchangeMessage(
        activeRequest,
        user.uid,
        profile?.name || user.displayName || 'Member',
        chatDraft.trim()
      );
      setChatDraft('');
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const allRequests = [...incomingRequests, ...outgoingRequests];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 pb-20 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#263238]">
            Community Exchange Marketplace
          </h1>
          <p className="text-sm text-[#263238]/75 mt-1">
            Give away usable goods for free or swap directly with neighbors. Only approximate neighborhood/city locations are displayed.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="px-5 py-2.5 rounded-xl bg-[#1B5E20] hover:bg-[#144718] text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          List an Item
        </button>
      </div>

      {/* Section Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-white border border-[#263238]/10 rounded-xl overflow-x-auto">
        {(
          [
            { id: 'all', label: 'All Available' },
            { id: 'near', label: 'Available Near Me' },
            { id: 'free', label: 'Free Giveaways' },
            { id: 'exchange', label: 'Exchange Products' },
            { id: 'recent', label: 'Recently Added' },
            { id: 'messages', label: `Requests & Messages (${allRequests.length})` },
          ] as { id: MarketplaceTab; label: string }[]
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === tab.id
                ? 'bg-[#1B5E20] text-white'
                : 'text-[#263238]/75 hover:bg-[#E8F5E9]/60 hover:text-[#1B5E20]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'messages' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white rounded-2xl border border-[#263238]/10 p-5 space-y-4">
            <h2 className="font-display text-lg font-bold text-[#263238]">Exchange Requests</h2>
            {!user ? (
              <div className="p-4 rounded-xl bg-[#F7F9F5] text-sm text-[#263238]/75 space-y-3">
                <p>Sign in to view incoming and outgoing exchange requests.</p>
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="px-4 py-2 rounded-lg bg-[#1B5E20] text-white text-xs font-semibold cursor-pointer"
                >
                  Sign In
                </button>
              </div>
            ) : allRequests.length === 0 ? (
              <p className="text-sm text-[#263238]/65">No exchange requests yet. Browse listings to send a request.</p>
            ) : (
              <div className="space-y-3">
                {allRequests.map((req) => {
                  const isIncoming = req.receiverId === user.uid;
                  const isSelected = activeRequest?.requestId === req.requestId;
                  return (
                    <div
                      key={req.requestId}
                      className={`p-4 rounded-xl border transition-colors ${
                        isSelected ? 'border-[#1B5E20] bg-[#E8F5E9]/40' : 'border-[#263238]/10 bg-[#F7F9F5]'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setActiveRequest(req)}
                        className="w-full text-left cursor-pointer"
                      >
                        <p className="font-semibold text-sm text-[#263238]">{req.listingTitle}</p>
                        <p className="text-xs text-[#263238]/65 mt-0.5">
                          {isIncoming ? `From ${req.senderName}` : `To ${req.receiverName}`} · Status:{' '}
                          <span className="font-semibold text-[#1B5E20] capitalize">{req.status}</span>
                        </p>
                        <p className="text-xs text-[#263238]/80 mt-2 line-clamp-2">{req.message}</p>
                      </button>

                      {req.status === 'pending' && (
                        <div className="flex flex-wrap gap-2 mt-3 pt-2.5 border-t border-[#263238]/10">
                          {isIncoming ? (
                            <>
                              <button
                                type="button"
                                onClick={() => respondToExchangeRequest(req.requestId, 'accepted')}
                                className="px-3 py-1.5 rounded-lg bg-[#1B5E20] text-white text-xs font-semibold cursor-pointer"
                              >
                                Accept
                              </button>
                              <button
                                type="button"
                                onClick={() => respondToExchangeRequest(req.requestId, 'rejected')}
                                className="px-3 py-1.5 rounded-lg border border-red-300 text-red-700 text-xs font-semibold cursor-pointer"
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => respondToExchangeRequest(req.requestId, 'cancelled')}
                              className="px-3 py-1.5 rounded-lg border border-[#263238]/20 text-xs font-semibold cursor-pointer"
                            >
                              Cancel Request
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="lg:col-span-7 bg-white rounded-2xl border border-[#263238]/10 p-6 flex flex-col min-h-[380px]">
            {activeRequest ? (
              <>
                <div className="pb-4 border-b border-[#263238]/10 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-display text-lg font-bold text-[#263238]">{activeRequest.listingTitle}</h3>
                    <p className="text-xs text-[#263238]/65">
                      Coordinate safe public meetup · Status: {activeRequest.status}
                    </p>
                  </div>
                </div>

                <div className="flex-1 py-4 space-y-3 overflow-y-auto max-h-[340px]">
                  {threadMessages.map((msg) => {
                    const isMine = msg.authorId === user?.uid;
                    return (
                      <div
                        key={msg.messageId}
                        className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${
                          isMine
                            ? 'ml-auto bg-[#1B5E20] text-white'
                            : 'mr-auto bg-[#F7F9F5] border border-[#263238]/10 text-[#263238]'
                        }`}
                      >
                        <p className={`text-[11px] font-semibold mb-0.5 ${isMine ? 'text-white/80' : 'text-[#1B5E20]'}`}>
                          {msg.authorName}
                        </p>
                        <p>{msg.body}</p>
                      </div>
                    );
                  })}
                </div>

                {(activeRequest.status === 'pending' || activeRequest.status === 'accepted') && (
                  <form onSubmit={handleSendChatMessage} className="pt-3 border-t border-[#263238]/10 flex gap-2">
                    <label htmlFor="exchange-chat-input" className="sr-only">
                      Message
                    </label>
                    <input
                      id="exchange-chat-input"
                      type="text"
                      value={chatDraft}
                      onChange={(e) => setChatDraft(e.target.value)}
                      placeholder="Suggest a public pickup spot or ask a question..."
                      className="flex-1 px-3.5 py-2 text-sm rounded-xl border border-[#263238]/20 focus:outline-none focus:border-[#1B5E20]"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-[#1B5E20] text-white text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      Send
                    </button>
                  </form>
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-[#263238]/60">
                <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm">Select an exchange request to open the in-app chat thread.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Filter Bar */}
          <div className="bg-white rounded-2xl border border-[#263238]/10 p-4 grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-5 relative">
              <Search className="w-4 h-4 text-[#263238]/45 absolute left-3 top-1/2 -translate-y-1/2" />
              <label htmlFor="market-search" className="sr-only">
                Search products
              </label>
              <input
                id="market-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search items (books, lamp, kitchenware...)"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-[#263238]/20 focus:outline-none focus:border-[#1B5E20]"
              />
            </div>

            <div className="md:col-span-4">
              <label htmlFor="market-category" className="sr-only">
                Filter by category
              </label>
              <select
                id="market-category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-[#263238]/20 bg-white focus:outline-none focus:border-[#1B5E20]"
              >
                <option value="All">All Categories</option>
                {MARKETPLACE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3 relative">
              <MapPin className="w-4 h-4 text-[#263238]/45 absolute left-3 top-1/2 -translate-y-1/2" />
              <label htmlFor="market-location" className="sr-only">
                Filter by location
              </label>
              <input
                id="market-location"
                type="text"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                placeholder="Filter city or area..."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-[#263238]/20 focus:outline-none focus:border-[#1B5E20]"
              />
            </div>
          </div>

          {/* Available Near Me location notice */}
          {activeTab === 'near' && !userCityToken && (
            <div className="bg-[#E8F5E9] border border-[#4CAF50]/40 rounded-xl px-4 py-3 text-xs text-[#1B5E20]">
              Enter a city or neighborhood in the &ldquo;Filter city or area...&rdquo; field above (or save your city in My Profile) to narrow items to your local area.
            </div>
          )}

          {/* Product Grid */}
          {filteredListings.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#263238]/10 p-10 text-center space-y-3">
              <p className="font-display text-lg font-bold text-[#263238]">No matching items found</p>
              <p className="text-sm text-[#263238]/70">
                Try clearing filters, or list a clean usable product from your home to start the local exchange.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredListings.map((item) => (
                <article
                  key={item.listingId}
                  className="bg-white rounded-2xl border border-[#263238]/10 overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    <div className="aspect-[4/3] w-full overflow-hidden bg-[#F7F9F5]">
                      <SafeImage src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-5 space-y-2">
                      <h2 className="font-display text-lg font-bold text-[#263238] line-clamp-1">
                        {item.productName}
                      </h2>
                      <p className="text-xs font-medium text-[#1B5E20]">
                        {item.listingType === 'free' ? 'Free Giveaway' : 'Exchange'} · {item.condition} ·{' '}
                        {item.category}
                      </p>
                      <p className="text-sm text-[#263238]/80 line-clamp-2">{item.description}</p>
                      {item.exchangePreference && (
                        <p className="text-xs text-[#263238]/65">Seeking: {item.exchangePreference}</p>
                      )}
                    </div>
                  </div>

                  <div className="px-5 pb-5 pt-2 flex items-center justify-between gap-3 border-t border-[#263238]/10">
                    <span className="text-xs text-[#263238]/65 truncate">
                      {item.approximateLocation} · {item.sellerName}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedListing(item);
                        setRequestFeedback(null);
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-[#E8F5E9] hover:bg-[#1B5E20] text-[#1B5E20] hover:text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      View Details
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      {/* Create Listing Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 bg-[#263238]/55 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-listing-title"
        >
          <div className="bg-white w-full max-w-lg rounded-2xl border border-[#263238]/10 shadow-xl overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-[#263238]/10 flex items-center justify-between">
              <h2 id="create-listing-title" className="font-display text-xl font-bold text-[#263238]">
                Create Community Listing
              </h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                aria-label="Close listing form"
                className="p-1.5 rounded-lg hover:bg-[#E8F5E9] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {createError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                  <span>{createError}</span>
                </div>
              )}

              <div>
                <label htmlFor="lst-name" className="block text-xs font-semibold text-[#263238] mb-1">
                  Product Name
                </label>
                <input
                  id="lst-name"
                  type="text"
                  required
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g., Solid Oak Study Desk Chair"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#263238]/20 focus:outline-none focus:border-[#1B5E20]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="lst-cat" className="block text-xs font-semibold text-[#263238] mb-1">
                    Category
                  </label>
                  <select
                    id="lst-cat"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as MarketplaceCategory)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-[#263238]/20 bg-white"
                  >
                    {MARKETPLACE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="lst-cond" className="block text-xs font-semibold text-[#263238] mb-1">
                    Condition
                  </label>
                  <select
                    id="lst-cond"
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as ItemCondition)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-[#263238]/20 bg-white"
                  >
                    <option value="Like New">Like New</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="lst-desc" className="block text-xs font-semibold text-[#263238] mb-1">
                  Description (Safe & usable items only)
                </label>
                <textarea
                  id="lst-desc"
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe size, functionality, and condition honestly. Never include personal phone numbers."
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#263238]/20 focus:outline-none focus:border-[#1B5E20]"
                />
              </div>

              <div>
                <label htmlFor="lst-loc" className="block text-xs font-semibold text-[#263238] mb-1">
                  Approximate Neighborhood / City
                </label>
                <input
                  id="lst-loc"
                  type="text"
                  required
                  value={approximateLocation}
                  onChange={(e) => setApproximateLocation(e.target.value)}
                  placeholder="e.g., Northside · Portland, OR (never share street address)"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#263238]/20 focus:outline-none focus:border-[#1B5E20]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setListingType('free')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-semibold cursor-pointer ${
                    listingType === 'free'
                      ? 'bg-[#1B5E20] text-white border-[#1B5E20]'
                      : 'bg-white text-[#263238] border-[#263238]/20'
                  }`}
                >
                  Free Giveaway
                </button>
                <button
                  type="button"
                  onClick={() => setListingType('exchange')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-semibold cursor-pointer ${
                    listingType === 'exchange'
                      ? 'bg-[#1B5E20] text-white border-[#1B5E20]'
                      : 'bg-white text-[#263238] border-[#263238]/20'
                  }`}
                >
                  Exchange Item
                </button>
              </div>

              {listingType === 'exchange' && (
                <div>
                  <label htmlFor="lst-pref" className="block text-xs font-semibold text-[#263238] mb-1">
                    What would you like in exchange? (optional)
                  </label>
                  <input
                    id="lst-pref"
                    type="text"
                    value={exchangePreference}
                    onChange={(e) => setExchangePreference(e.target.value)}
                    placeholder="e.g., Books, ceramic pots, or gardening tools"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#263238]/20"
                  />
                </div>
              )}

              <div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="sr-only"
                  id="lst-photo-input"
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-[#E8F5E9] text-[#1B5E20] text-xs font-semibold inline-flex items-center gap-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  {listingImageUrl ? 'Change Photo' : 'Upload Product Photo'}
                </button>
                {listingImageUrl && (
                  <div className="mt-2 w-28 h-20 rounded-xl overflow-hidden border border-[#263238]/10">
                    <SafeImage src={listingImageUrl} alt="Listing preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={submittingCreate}
                className="w-full py-2.5 px-4 rounded-xl bg-[#1B5E20] hover:bg-[#144718] text-white text-sm font-semibold cursor-pointer disabled:opacity-60"
              >
                {submittingCreate ? 'Publishing...' : 'Publish Listing'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Listing Detail Modal */}
      {selectedListing && (
        <div
          className="fixed inset-0 z-50 bg-[#263238]/55 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="detail-listing-title"
        >
          <div className="bg-white w-full max-w-lg rounded-2xl border border-[#263238]/10 shadow-xl overflow-hidden my-8">
            <div className="aspect-[16/10] w-full bg-[#F7F9F5] relative">
              <SafeImage
                src={selectedListing.imageUrl}
                alt={selectedListing.productName}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setSelectedListing(null)}
                aria-label="Close product details"
                className="absolute top-3 right-3 p-2 rounded-full bg-white/90 text-[#263238] hover:bg-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h2 id="detail-listing-title" className="font-display text-2xl font-bold text-[#263238]">
                  {selectedListing.productName}
                </h2>
                <p className="text-xs font-medium text-[#1B5E20] mt-1">
                  {selectedListing.listingType === 'free' ? 'Free Giveaway' : 'Exchange'} ·{' '}
                  {selectedListing.condition} · {selectedListing.category} · Status: {selectedListing.status}
                </p>
                <p className="text-xs text-[#263238]/65 mt-1">
                  Offered by {selectedListing.sellerName} · {selectedListing.approximateLocation}
                </p>
              </div>

              <p className="text-sm text-[#263238]/85 leading-relaxed">{selectedListing.description}</p>

              {selectedListing.exchangePreference && (
                <p className="text-xs text-[#263238]/75 bg-[#F7F9F5] p-3 rounded-xl">
                  <strong>Looking for in exchange:</strong> {selectedListing.exchangePreference}
                </p>
              )}

              {user && selectedListing.userId === user.uid ? (
                <div className="pt-3 border-t border-[#263238]/10 flex flex-wrap gap-2">
                  {selectedListing.status === 'available' && (
                    <>
                      <button
                        type="button"
                        onClick={async () => {
                          await updateListingStatus(
                            selectedListing.listingId,
                            'exchanged',
                            user.uid,
                            selectedListing.productName,
                            selectedListing.category
                          );
                          setSelectedListing(null);
                        }}
                        className="px-4 py-2 rounded-xl bg-[#1B5E20] text-white text-xs font-semibold cursor-pointer"
                      >
                        Mark as Exchanged (+40 pts)
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await updateListingStatus(selectedListing.listingId, 'unavailable');
                          setSelectedListing(null);
                        }}
                        className="px-4 py-2 rounded-xl border border-[#263238]/20 text-xs font-semibold cursor-pointer"
                      >
                        Mark Unavailable
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSendRequest} className="pt-3 border-t border-[#263238]/10 space-y-3">
                  <label htmlFor="req-msg" className="block text-xs font-semibold text-[#263238]">
                    Send {selectedListing.listingType === 'free' ? 'Pickup' : 'Exchange'} Request
                  </label>
                  <textarea
                    id="req-msg"
                    rows={2}
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                    placeholder="Introduce yourself and propose a safe public meetup time..."
                    className="w-full px-3 py-2 text-sm rounded-xl border border-[#263238]/20"
                  />
                  {requestFeedback && (
                    <div className="p-2.5 rounded-xl bg-[#E8F5E9] text-xs text-[#1B5E20] flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{requestFeedback}</span>
                    </div>
                  )}
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-xl bg-[#1B5E20] hover:bg-[#144718] text-white text-sm font-semibold cursor-pointer"
                  >
                    Send Request
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
