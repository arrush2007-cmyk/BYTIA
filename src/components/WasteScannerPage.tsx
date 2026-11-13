import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  AlertTriangle,
  Bookmark,
  Camera,
  CheckCircle2,
  Gift,
  HelpCircle,
  Loader2,
  Recycle,
  RefreshCw,
  Repeat,
  ShieldAlert,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import type { User } from 'firebase/auth';
import type {
  ActivityType,
  BadgeType,
  RecommendationType,
  UserProfile,
  WasteAnalysisResult,
} from '../types/sustainability';
import { processDataUrl, processImageFile } from '../utils/imageCompression';
import {
  logVerifiedSustainabilityAction,
  saveScannedProductAndLogScan,
  toggleSavedScannedProduct,
} from '../services/firestoreService';
import { SafeImage } from './SafeImage';

interface WasteScannerPageProps {
  user: User | null;
  profile: UserProfile | null;
  initialMode?: 'camera' | 'upload' | null;
  initialQuery?: string;
  onClearInitialTrigger?: () => void;
  onOpenAuth: () => void;
  onListOnExchange: (prefill: {
    productName: string;
    description: string;
    imageUrl?: string;
  }) => void;
}

const RECOMMENDATION_META: Record<
  RecommendationType,
  { label: string; headline: string; icon: typeof Sparkles; bg: string; text: string; border: string }
> = {
  REUSE: {
    label: 'REUSE',
    headline: 'Recommended First Step: Creative Reuse',
    icon: Sparkles,
    bg: 'bg-[#E8F5E9]',
    text: 'text-[#1B5E20]',
    border: 'border-[#4CAF50]/40',
  },
  DONATE: {
    label: 'DONATE',
    headline: 'Recommended First Step: Donate or Pass On',
    icon: Gift,
    bg: 'bg-[#E8F5E9]',
    text: 'text-[#1B5E20]',
    border: 'border-[#4CAF50]/40',
  },
  RECYCLE: {
    label: 'RECYCLE',
    headline: 'Recommended First Step: Clean Material Recycling',
    icon: Recycle,
    bg: 'bg-[#DCC9A3]/30',
    text: 'text-[#263238]',
    border: 'border-[#DCC9A3]',
  },
  DISPOSE: {
    label: 'DISPOSE',
    headline: 'Recommended First Step: Safe Responsible Disposal',
    icon: Trash2,
    bg: 'bg-red-50',
    text: 'text-red-900',
    border: 'border-red-200',
  },
};

export function WasteScannerPage({
  user,
  profile,
  initialMode,
  initialQuery,
  onClearInitialTrigger,
  onOpenAuth,
  onListOnExchange,
}: WasteScannerPageProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysisBase64, setAnalysisBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');

  const [productQuery, setProductQuery] = useState(initialQuery || '');
  const [additionalContext, setAdditionalContext] = useState('');

  const [analyzing, setAnalyzing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [result, setResult] = useState<WasteAnalysisResult | null>(null);
  const [activeDecisionTab, setActiveDecisionTab] = useState<RecommendationType>('REUSE');

  const [savedScanId, setSavedScanId] = useState<string | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [unlockedBadges, setUnlockedBadges] = useState<BadgeType[]>([]);
  const resultsRef = useRef<HTMLElement | null>(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (initialQuery) {
      setProductQuery(initialQuery);
      void runAnalysis({ queryOverride: initialQuery });
      onClearInitialTrigger?.();
    } else if (initialMode === 'camera') {
      void startCamera();
      onClearInitialTrigger?.();
    } else if (initialMode === 'upload') {
      fileInputRef.current?.click();
      onClearInitialTrigger?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMode, initialQuery]);

  const startCamera = async () => {
    setCameraError(null);
    setApiError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera access is not supported in this browser. Please upload a photo from your device.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      });
    } catch {
      setCameraError('Unable to access camera. Check browser camera permissions or upload an image file instead.');
    }
  };

  const capturePhoto = async () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 800;
    canvas.height = video.videoHeight || 600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const rawDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    stopCamera();

    try {
      const compressed = await processDataUrl(rawDataUrl);
      setPreviewUrl(compressed.storageDataUrl);
      setAnalysisBase64(compressed.analysisBase64);
      setMimeType(compressed.mimeType);
      setResult(null);
      setSavedScanId(null);
      setActionFeedback(null);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Failed to process captured image.');
    }
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setApiError(null);
    setCameraError(null);
    stopCamera();

    try {
      const compressed = await processImageFile(file);
      setPreviewUrl(compressed.storageDataUrl);
      setAnalysisBase64(compressed.analysisBase64);
      setMimeType(compressed.mimeType);
      setResult(null);
      setSavedScanId(null);
      setActionFeedback(null);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Could not load image.');
    }
  };

  const runAnalysis = async (opts?: { queryOverride?: string }) => {
    const queryText = (opts?.queryOverride ?? productQuery).trim();
    if (!analysisBase64 && !queryText) {
      setApiError('Capture or upload a product photo, or enter a product name to analyze.');
      return;
    }

    setAnalyzing(true);
    setApiError(null);
    setActionFeedback(null);
    setUnlockedBadges([]);

    try {
      const resp = await fetch('/api/analyze-waste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: analysisBase64,
          mimeType,
          productQuery: queryText,
          additionalContext: additionalContext.trim(),
          userCity: profile?.location || '',
        }),
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || 'AI analysis failed.');
      }

      const analysis: WasteAnalysisResult = data.analysis;
      setResult(analysis);
      setActiveDecisionTab(analysis.primaryRecommendation || 'REUSE');
      setIsBookmarked(false);
      requestAnimationFrame(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });

      if (user && user.emailVerified && analysis.identified) {
        try {
          const newScanId = await saveScannedProductAndLogScan(user.uid, analysis, previewUrl || undefined);
          setSavedScanId(newScanId);
        } catch (err) {
          console.error('Failed to persist scan:', err);
        }
      }
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Unable to analyze item.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmitForm = (e: FormEvent) => {
    e.preventDefault();
    void runAnalysis();
  };

  const handleLogOutcome = async (activityType: ActivityType) => {
    if (!user) {
      onOpenAuth();
      return;
    }
    if (!user.emailVerified) {
      setActionFeedback('Please verify your email address first to log verified eco-points.');
      return;
    }
    if (!result) return;

    const targetId = savedScanId || `adhoc_${Date.now()}`;
    try {
      const outcome = await logVerifiedSustainabilityAction(
        user.uid,
        activityType,
        targetId,
        result.productName,
        result.category,
        result.estimatedWeightKg,
        savedScanId || undefined
      );
      if (outcome.alreadyLogged) {
        setActionFeedback(`You already logged "${activityType}" for this scan.`);
      } else {
        setActionFeedback(`Verified! Logged ${activityType} action for "${result.productName}".`);
        if (outcome.newlyUnlockedBadges.length > 0) {
          setUnlockedBadges(outcome.newlyUnlockedBadges);
        }
      }
    } catch (err) {
      setActionFeedback(err instanceof Error ? err.message : 'Could not log activity.');
    }
  };

  const handleToggleSave = async () => {
    if (!user) {
      onOpenAuth();
      return;
    }
    if (!savedScanId) {
      setActionFeedback('Scan persistence requires a verified email account.');
      return;
    }
    try {
      const next = !isBookmarked;
      await toggleSavedScannedProduct(savedScanId, next);
      setIsBookmarked(next);
      setActionFeedback(next ? 'Saved recommendation to your Profile.' : 'Removed from saved recommendations.');
    } catch (err) {
      setActionFeedback(err instanceof Error ? err.message : 'Could not update saved state.');
    }
  };

  const resetScanner = () => {
    stopCamera();
    setPreviewUrl(null);
    setAnalysisBase64(null);
    setResult(null);
    setApiError(null);
    setSavedScanId(null);
    setActionFeedback(null);
    setUnlockedBadges([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const activeMeta = result ? RECOMMENDATION_META[result.primaryRecommendation] : null;
  const ActiveIcon = activeMeta?.icon || Sparkles;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 pb-20 space-y-8">
      <div className="max-w-3xl">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#263238]" style={{ textWrap: 'balance' }}>
          AI Waste Scanner & Circular Decision Engine
        </h1>
        <p className="text-sm sm:text-base text-[#263238]/75 mt-2 leading-relaxed">
          Photograph an unwanted item or describe it below. Gemini identifies its material and condition, warns of hazards, and recommends the highest-value next step: Reuse, Donate, Recycle, or Safe Disposal.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Capture / Upload / Query Controls */}
        <section className="lg:col-span-5 bg-white rounded-2xl border border-[#263238]/10 p-6 space-y-5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="sr-only"
            id="waste-image-upload"
          />

          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => (cameraActive ? stopCamera() : startCamera())}
              className="flex-1 min-w-[140px] py-2.5 px-4 rounded-xl bg-[#1B5E20] hover:bg-[#144718] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              {cameraActive ? 'Close Camera' : 'Open Camera'}
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 min-w-[140px] py-2.5 px-4 rounded-xl bg-[#E8F5E9] hover:bg-[#d7eed9] text-[#1B5E20] text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              Upload Photo
            </button>
          </div>

          {cameraError && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
              {cameraError}
            </div>
          )}

          {cameraActive && (
            <div className="space-y-3">
              <div className="aspect-[4/3] w-full rounded-xl overflow-hidden bg-[#263238] relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={capturePhoto}
                className="w-full py-2.5 px-4 rounded-xl bg-[#4CAF50] hover:bg-[#3d9441] text-white text-sm font-semibold cursor-pointer"
              >
                Capture Photograph
              </button>
            </div>
          )}

          {!cameraActive && previewUrl && (
            <div className="space-y-2.5">
              <div className="aspect-[4/3] w-full rounded-xl overflow-hidden border border-[#263238]/10 bg-[#F7F9F5]">
                <SafeImage src={previewUrl} alt="Captured product preview" className="w-full h-full object-cover" />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#263238]/70">Photo ready for inspection</span>
                <button
                  type="button"
                  onClick={resetScanner}
                  className="text-[#1B5E20] font-semibold inline-flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Retake / Clear
                </button>
              </div>
            </div>
          )}

          {!cameraActive && !previewUrl && (
            <div
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
              }}
              className="aspect-[4/3] w-full rounded-xl border-2 border-dashed border-[#263238]/20 hover:border-[#1B5E20] bg-[#F7F9F5] flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-colors"
            >
              <Upload className="w-8 h-8 text-[#1B5E20]/70 mb-2" />
              <p className="text-sm font-semibold text-[#263238]">Drop or click to upload a product photo</p>
              <p className="text-xs text-[#263238]/60 mt-1">JPEG, PNG, or WebP up to 8 MB</p>
            </div>
          )}

          <form onSubmit={handleSubmitForm} className="space-y-4 pt-2 border-t border-[#263238]/10">
            <div>
              <label htmlFor="scanner-product-query" className="block text-xs font-semibold text-[#263238] mb-1">
                Product Name or Search Query {previewUrl ? '(optional)' : '(or describe item)'}
              </label>
              <input
                id="scanner-product-query"
                type="text"
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
                placeholder="e.g., Clear PET plastic bottle, scratched oak chair"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#263238]/20 focus:outline-none focus:border-[#1B5E20]"
              />
            </div>

            <div>
              <label htmlFor="scanner-context" className="block text-xs font-semibold text-[#263238] mb-1">
                Additional Condition Details (optional)
              </label>
              <textarea
                id="scanner-context"
                rows={2}
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
                placeholder="e.g., Still powers on, clean inside, missing cap..."
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#263238]/20 focus:outline-none focus:border-[#1B5E20]"
              />
            </div>

            {apiError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <span>{apiError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={analyzing}
              className="w-full py-3 px-4 rounded-xl bg-[#1B5E20] hover:bg-[#144718] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing Material & Next Steps...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Analyze with Gemini AI
                </>
              )}
            </button>
          </form>

          <div className="pt-2 border-t border-[#263238]/10">
            <p className="text-xs font-medium text-[#263238]/65 mb-2">Quick Product Queries:</p>
            <div className="flex flex-wrap gap-2">
              {['Empty PET plastic bottle', 'Worn cotton denim jeans', 'Swollen lithium laptop battery'].map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => {
                    setProductQuery(sample);
                    void runAnalysis({ queryOverride: sample });
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#F7F9F5] hover:bg-[#E8F5E9] border border-[#263238]/10 text-xs font-medium text-[#263238] cursor-pointer"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Right Column: AI Results & Decision Engine */}
        <section ref={resultsRef} className="lg:col-span-7 space-y-6 scroll-mt-20">
          {!result && !analyzing && (
            <div className="bg-white rounded-2xl border border-[#263238]/10 p-8 sm:p-10 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#E8F5E9] text-[#1B5E20] flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="font-display text-xl font-bold text-[#263238]">Ready to Inspect Your Item</h2>
              <p className="text-sm text-[#263238]/75 max-w-md mx-auto leading-relaxed">
                Upload a photo or enter a product description on the left. We evaluate material composition, visible condition, safety hazards, and prioritize Reuse, Donation, Recycling, or Safe Disposal.
              </p>
            </div>
          )}

          {analyzing && (
            <div className="bg-white rounded-2xl border border-[#263238]/10 p-10 text-center space-y-4">
              <Loader2 className="w-8 h-8 text-[#1B5E20] animate-spin mx-auto" />
              <p className="font-display text-lg font-bold text-[#263238]">Evaluating Material & Decision Pathways</p>
              <p className="text-xs text-[#263238]/65">
                Checking condition, safety hazards, DIY reuse opportunities, and recycling eligibility...
              </p>
            </div>
          )}

          {result && !result.identified && (
            <div className="bg-white rounded-2xl border border-amber-300 p-6 sm:p-8 space-y-4">
              <div className="flex items-start gap-3">
                <HelpCircle className="w-6 h-6 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <h2 className="font-display text-xl font-bold text-[#263238]">Need a Clearer View or More Context</h2>
                  <p className="text-sm text-[#263238]/80 mt-1.5 leading-relaxed">
                    {result.clarificationNeededReason ||
                      'The uploaded image or description did not provide enough visual detail to confidently verify the material or condition.'}
                  </p>
                </div>
              </div>
              <p className="text-xs text-[#263238]/70">
                Try retaking the photo in bright light, showing any recycling codes or labels, or adding notes in the &ldquo;Additional Condition Details&rdquo; field and submitting again.
              </p>
            </div>
          )}

          {result && result.identified && activeMeta && (
            <div className="space-y-6">
              {/* Hazard Warning Banner */}
              {result.isHazardous && (
                <div className="rounded-2xl bg-red-50 border border-red-300 p-5 flex items-start gap-3">
                  <ShieldAlert className="w-6 h-6 text-red-700 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-display text-base font-bold text-red-900">Safety & Hazard Warning</h3>
                    <p className="text-sm text-red-800 mt-1 leading-relaxed">
                      {result.hazardWarning ||
                        'This item may contain hazardous components. Do not place in household trash or donate if damaged.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Primary Identification & Decision Card */}
              <div className="bg-white rounded-2xl border border-[#263238]/10 overflow-hidden">
                <div className={`px-6 py-4 border-b ${activeMeta.bg} ${activeMeta.border} flex flex-wrap items-center justify-between gap-3`}>
                  <div className="flex items-center gap-2.5">
                    <ActiveIcon className={`w-5 h-5 ${activeMeta.text}`} />
                    <span className={`font-display text-base font-bold ${activeMeta.text}`}>
                      {activeMeta.headline}
                    </span>
                  </div>
                  <span className="font-mono tabular-nums text-xs font-semibold text-[#263238]/75">
                    Est. {result.estimatedWeightKg} kg
                  </span>
                </div>

                <div className="p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row gap-5">
                    {previewUrl && (
                      <div className="w-full sm:w-36 aspect-square rounded-xl overflow-hidden border border-[#263238]/10 shrink-0">
                        <SafeImage src={previewUrl} alt={result.productName} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h2 className="font-display text-2xl font-bold text-[#263238]">{result.productName}</h2>
                        <button
                          type="button"
                          onClick={handleToggleSave}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
                            isBookmarked
                              ? 'bg-[#1B5E20] text-white border-[#1B5E20]'
                              : 'bg-white text-[#263238] border-[#263238]/20 hover:border-[#1B5E20]'
                          }`}
                        >
                          <Bookmark className="w-3.5 h-3.5" />
                          {isBookmarked ? 'Saved' : 'Save'}
                        </button>
                      </div>
                      <p className="text-xs font-medium text-[#1B5E20]">
                        {result.category} · {result.materialComposition} · Condition: {result.visibleCondition}
                      </p>
                      <p className="text-sm text-[#263238]/85 leading-relaxed pt-1">{result.decisionSummary}</p>
                      <p className="text-xs text-[#263238]/70 leading-relaxed">{result.decisionReasoning}</p>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs">
                        <div className="rounded-lg bg-[#F7F9F5] px-3 py-2">
                          <span className="text-[#263238]/60 block">Reusable</span>
                          <span className="font-semibold text-[#263238]">{result.isReusable ? 'Yes' : 'No'}</span>
                        </div>
                        <div className="rounded-lg bg-[#F7F9F5] px-3 py-2">
                          <span className="text-[#263238]/60 block">Repairable</span>
                          <span className="font-semibold text-[#263238]">{result.isRepairable ? 'Yes' : 'No'}</span>
                        </div>
                        <div className="rounded-lg bg-[#F7F9F5] px-3 py-2">
                          <span className="text-[#263238]/60 block">Recyclable</span>
                          <span className="font-semibold text-[#263238]">{result.isRecyclable ? 'Yes' : 'No'}</span>
                        </div>
                        <div className="rounded-lg bg-[#F7F9F5] px-3 py-2">
                          <span className="text-[#263238]/60 block">Donatable</span>
                          <span className="font-semibold text-[#263238]">{result.donationSuitable ? 'Yes' : 'No'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Verified Action Buttons */}
                  <div className="pt-4 border-t border-[#263238]/10 space-y-3">
                    <p className="text-xs font-semibold text-[#263238]">Record Your Action to Earn Verified Eco-Points:</p>
                    <div className="flex flex-wrap gap-2">
                      {result.isReusable && (
                        <button
                          type="button"
                          onClick={() => handleLogOutcome('reuse')}
                          className="px-3.5 py-2 rounded-xl bg-[#1B5E20] hover:bg-[#144718] text-white text-xs font-semibold cursor-pointer"
                        >
                          I Reused This (+30 pts)
                        </button>
                      )}
                      {result.donationSuitable && (
                        <button
                          type="button"
                          onClick={() => handleLogOutcome('donate')}
                          className="px-3.5 py-2 rounded-xl bg-[#4CAF50] hover:bg-[#3e9442] text-white text-xs font-semibold cursor-pointer"
                        >
                          I Donated This (+35 pts)
                        </button>
                      )}
                      {result.isRecyclable && (
                        <button
                          type="button"
                          onClick={() => handleLogOutcome('recycle')}
                          className="px-3.5 py-2 rounded-xl bg-[#E8F5E9] hover:bg-[#d7eed9] text-[#1B5E20] text-xs font-semibold cursor-pointer"
                        >
                          I Recycled This (+20 pts)
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleLogOutcome('dispose')}
                        className="px-3.5 py-2 rounded-xl border border-[#263238]/20 hover:border-[#263238] text-[#263238] text-xs font-semibold cursor-pointer"
                      >
                        Safely Disposed (+15 pts)
                      </button>
                      {!result.isHazardous && (result.isReusable || result.donationSuitable) && (
                        <button
                          type="button"
                          onClick={() =>
                            onListOnExchange({
                              productName: result.productName,
                              description: `${result.materialComposition}. Condition: ${result.visibleCondition}.`,
                              imageUrl: previewUrl || undefined,
                            })
                          }
                          className="px-3.5 py-2 rounded-xl border border-[#1B5E20] text-[#1B5E20] hover:bg-[#E8F5E9] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Repeat className="w-3.5 h-3.5" />
                          List on Exchange
                        </button>
                      )}
                    </div>

                    {actionFeedback && (
                      <div className="p-3 rounded-xl bg-[#E8F5E9] text-xs text-[#1B5E20] font-medium flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>{actionFeedback}</span>
                      </div>
                    )}
                    {unlockedBadges.length > 0 && (
                      <div className="p-3 rounded-xl bg-[#DCC9A3]/40 text-xs text-[#263238] font-semibold">
                        Achievement Unlocked: {unlockedBadges.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Decision Engine Tabs (A. Reuse, B. Donate, C. Recycle, D. Dispose) */}
              <div className="bg-white rounded-2xl border border-[#263238]/10 overflow-hidden">
                <div className="flex border-b border-[#263238]/10 bg-[#F7F9F5] p-1.5 gap-1 overflow-x-auto">
                  {(['REUSE', 'DONATE', 'RECYCLE', 'DISPOSE'] as RecommendationType[]).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveDecisionTab(tab)}
                      className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        activeDecisionTab === tab
                          ? 'bg-white text-[#1B5E20] shadow-xs'
                          : 'text-[#263238]/70 hover:text-[#263238]'
                      }`}
                    >
                      {tab === 'REUSE' && 'A. Reuse Ideas'}
                      {tab === 'DONATE' && 'B. Donation'}
                      {tab === 'RECYCLE' && 'C. Recycling'}
                      {tab === 'DISPOSE' && 'D. Safe Disposal'}
                    </button>
                  ))}
                </div>

                <div className="p-6">
                  {activeDecisionTab === 'REUSE' && (
                    <div className="space-y-5">
                      {result.reuseIdeas && result.reuseIdeas.length > 0 ? (
                        result.reuseIdeas.map((idea, idx) => (
                          <div key={idx} className="pb-5 last:pb-0 border-b last:border-b-0 border-[#263238]/10 space-y-3">
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                              <h3 className="font-display text-lg font-bold text-[#263238]">{idea.title}</h3>
                              <span className="text-xs text-[#263238]/65">
                                {idea.difficulty} · {idea.estimatedTime}
                              </span>
                            </div>
                            <p className="text-sm text-[#263238]/80">{idea.description}</p>
                            {idea.requiredMaterials.length > 0 && (
                              <p className="text-xs text-[#263238]/75">
                                <strong>Materials needed:</strong> {idea.requiredMaterials.join(', ')}
                              </p>
                            )}
                            <ol className="list-decimal list-inside space-y-1 text-sm text-[#263238]/85">
                              {idea.steps.map((step, sIdx) => (
                                <li key={sIdx}>{step}</li>
                              ))}
                            </ol>
                            <p className="text-xs font-medium text-[#1B5E20]">
                              Environmental benefit: {idea.environmentalBenefits}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-[#263238]/70">
                          Creative reuse is not recommended for this item due to safety, contamination, or condition.
                        </p>
                      )}
                    </div>
                  )}

                  {activeDecisionTab === 'DONATE' && (
                    <div className="space-y-4 text-sm text-[#263238]/85">
                      <p className="font-semibold text-[#263238]">
                        {result.donationGuidance.suitable
                          ? 'Suitable for donation'
                          : 'Not recommended for donation'}
                      </p>
                      <p>{result.donationGuidance.whySuitableOrNot}</p>
                      {result.donationGuidance.whoMightBenefit.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-[#263238] mb-1">Who might benefit</p>
                          <ul className="list-disc list-inside space-y-1">
                            {result.donationGuidance.whoMightBenefit.map((w, i) => (
                              <li key={i}>{w}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {result.donationGuidance.suggestedOptions.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-[#263238] mb-1">Suggested donation channels</p>
                          <ul className="list-disc list-inside space-y-1">
                            {result.donationGuidance.suggestedOptions.map((o, i) => (
                              <li key={i}>{o}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {result.donationGuidance.preparationSteps.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-[#263238] mb-1">Preparation before donating</p>
                          <ol className="list-decimal list-inside space-y-1">
                            {result.donationGuidance.preparationSteps.map((p, i) => (
                              <li key={i}>{p}</li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </div>
                  )}

                  {activeDecisionTab === 'RECYCLE' && (
                    <div className="space-y-4 text-sm text-[#263238]/85">
                      <p className="font-semibold text-[#263238]">
                        {result.recyclingGuidance.eligible ? 'Eligible for Recycling' : 'Limited / Not Curbside Recyclable'} —{' '}
                        {result.recyclingGuidance.materialType}
                      </p>
                      {result.recyclingGuidance.preparationInstructions.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-[#263238] mb-1">Preparation instructions</p>
                          <ul className="list-disc list-inside space-y-1">
                            {result.recyclingGuidance.preparationInstructions.map((step, i) => (
                              <li key={i}>{step}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {result.recyclingGuidance.separationRequirements.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-[#263238] mb-1">Separation requirements</p>
                          <ul className="list-disc list-inside space-y-1">
                            {result.recyclingGuidance.separationRequirements.map((step, i) => (
                              <li key={i}>{step}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {result.recyclingGuidance.recyclingSteps.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-[#263238] mb-1">Step-by-step recycling process</p>
                          <ol className="list-decimal list-inside space-y-1">
                            {result.recyclingGuidance.recyclingSteps.map((step, i) => (
                              <li key={i}>{step}</li>
                            ))}
                          </ol>
                        </div>
                      )}
                      {result.recyclingGuidance.collectionOptions.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-[#263238] mb-1">Collection options</p>
                          <ul className="list-disc list-inside space-y-1">
                            {result.recyclingGuidance.collectionOptions.map((opt, i) => (
                              <li key={i}>{opt}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {activeDecisionTab === 'DISPOSE' && (
                    <div className="space-y-4 text-sm text-[#263238]/85">
                      <div>
                        <p className="text-xs font-semibold text-[#263238]">Why reuse is unsuitable</p>
                        <p className="mt-0.5">{result.disposalGuidance.whyNotReusable}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#263238]">Why donation is unsuitable</p>
                        <p className="mt-0.5">{result.disposalGuidance.whyNotDonatable}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#263238]">Appropriate disposal method</p>
                        <p className="mt-0.5">{result.disposalGuidance.appropriateMethod}</p>
                      </div>
                      {result.disposalGuidance.safetyPrecautions.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-[#263238] mb-1">Safety precautions</p>
                          <ul className="list-disc list-inside space-y-1">
                            {result.disposalGuidance.safetyPrecautions.map((prec, i) => (
                              <li key={i}>{prec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-semibold text-[#263238]">Local disposal guidance</p>
                        <p className="mt-0.5">{result.disposalGuidance.localGuidance}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
