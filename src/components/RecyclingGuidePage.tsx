import { useState } from 'react';
import {
  BatteryCharging,
  CheckCircle2,
  Cpu,
  FileText,
  Layers,
  MapPin,
  Search,
  ShieldAlert,
  Shirt,
  Sprout,
  Wine,
  Wrench,
} from 'lucide-react';
import {
  getLocationAwareGuidance,
  RECYCLING_GUIDE_CATEGORIES,
} from '../data/recyclingGuideData';
import { GENERATED_ASSETS } from '../data/seedData';
import { SafeImage } from './SafeImage';

interface RecyclingGuidePageProps {
  initialCategoryId?: string;
  defaultLocation?: string;
}

const CATEGORY_ICONS: Record<string, typeof Layers> = {
  plastic: Layers,
  paper: FileText,
  glass: Wine,
  metal: Wrench,
  ewaste: Cpu,
  textiles: Shirt,
  compost: Sprout,
  battery: BatteryCharging,
};

export function RecyclingGuidePage({ initialCategoryId, defaultLocation }: RecyclingGuidePageProps) {
  const [selectedId, setSelectedId] = useState(initialCategoryId || 'plastic');
  const [searchTerm, setSearchTerm] = useState('');
  const [locationInput, setLocationInput] = useState(defaultLocation || '');
  const [completedSteps, setCompletedSteps] = useState<Record<string, number[]>>({});

  const filteredCategories = RECYCLING_GUIDE_CATEGORIES.filter((cat) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return (
      cat.title.toLowerCase().includes(q) ||
      cat.introduction.toLowerCase().includes(q) ||
      cat.examples.some((ex) => ex.toLowerCase().includes(q)) ||
      cat.recyclableMaterials.some((m) => m.toLowerCase().includes(q))
    );
  });

  const activeCategory =
    filteredCategories.find((c) => c.id === selectedId) ||
    filteredCategories[0] ||
    RECYCLING_GUIDE_CATEGORIES[0];

  const localGuidance = getLocationAwareGuidance(locationInput);
  const doneSteps = completedSteps[activeCategory.id] || [];

  const toggleStep = (stepNumber: number) => {
    setCompletedSteps((prev) => {
      const current = prev[activeCategory.id] || [];
      const next = current.includes(stepNumber)
        ? current.filter((n) => n !== stepNumber)
        : [...current, stepNumber];
      return { ...prev, [activeCategory.id]: next };
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 pb-20 space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8 bg-white rounded-2xl border border-[#263238]/10 p-6 sm:p-8 flex flex-col justify-between space-y-5">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#263238]" style={{ textWrap: 'balance' }}>
              Recycling & Safe Material Guide
            </h1>
            <p className="text-sm sm:text-base text-[#263238]/75 mt-2">
              Learn how to sort, clean, and prepare 8 material streams so recyclables pass inspection and hazardous items never cause fires or contamination.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="guide-search" className="block text-xs font-semibold text-[#263238] mb-1">
                Search Recycling Guide
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-[#263238]/45 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="guide-search"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search e.g. plastic bottle, battery, pizza box..."
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-[#263238]/20 focus:outline-none focus:border-[#1B5E20]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="guide-location" className="block text-xs font-semibold text-[#263238] mb-1">
                Your City or PIN / ZIP Code
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-[#263238]/45 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="guide-location"
                  type="text"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  placeholder="e.g. Portland, 94107, 560001"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-[#263238]/20 focus:outline-none focus:border-[#1B5E20]"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 rounded-2xl overflow-hidden border border-[#263238]/10 bg-white">
          <SafeImage
            src={GENERATED_ASSETS.recyclingSorting}
            alt="Sorted plastic, cardboard, metal cans, and glass jars in woven trays"
            className="w-full h-full object-cover min-h-[180px]"
          />
        </div>
      </div>

      {/* Category Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {filteredCategories.map((cat) => {
          const Icon = CATEGORY_ICONS[cat.id] || Layers;
          const active = cat.id === activeCategory.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedId(cat.id)}
              className={`p-3 rounded-xl border text-left transition-colors cursor-pointer flex flex-col gap-2 ${
                active
                  ? 'bg-[#1B5E20] text-white border-[#1B5E20]'
                  : 'bg-white text-[#263238] border-[#263238]/10 hover:border-[#1B5E20]/50'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="text-xs font-semibold leading-tight">{cat.shortLabel}</span>
            </button>
          );
        })}
      </div>

      {/* Active Category Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-2xl border border-[#263238]/10 p-6 sm:p-8 space-y-6">
            <div>
              <p className="text-xs font-medium text-[#1B5E20]">{activeCategory.resinOrCode}</p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#263238] mt-1">
                {activeCategory.title}
              </h2>
              <p className="text-sm text-[#263238]/80 mt-2 leading-relaxed">{activeCategory.introduction}</p>
              <p className="text-xs text-[#263238]/65 mt-3">
                Common examples: {activeCategory.examples.join(' · ')}
              </p>
            </div>

            {/* Step-by-Step Interactive Progress */}
            <div className="space-y-3 pt-4 border-t border-[#263238]/10">
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-display text-lg font-bold text-[#263238]">Step-by-Step Recycling Process</h3>
                <span className="font-mono tabular-nums text-xs font-semibold text-[#1B5E20]">
                  {doneSteps.length}/{activeCategory.steps.length} steps checked
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#E8F5E9] overflow-hidden">
                <div
                  className="h-full bg-[#4CAF50] transition-all duration-200"
                  style={{ width: `${(doneSteps.length / activeCategory.steps.length) * 100}%` }}
                />
              </div>

              <div className="space-y-2.5 pt-2">
                {activeCategory.steps.map((step) => {
                  const checked = doneSteps.includes(step.stepNumber);
                  return (
                    <button
                      key={step.stepNumber}
                      type="button"
                      onClick={() => toggleStep(step.stepNumber)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-colors flex items-start gap-3 cursor-pointer ${
                        checked
                          ? 'bg-[#E8F5E9]/60 border-[#4CAF50]/40'
                          : 'bg-[#F7F9F5] border-[#263238]/10 hover:border-[#1B5E20]/40'
                      }`}
                    >
                      <CheckCircle2
                        className={`w-5 h-5 shrink-0 mt-0.5 ${
                          checked ? 'text-[#1B5E20]' : 'text-[#263238]/30'
                        }`}
                      />
                      <div>
                        <p className="text-sm font-semibold text-[#263238]">
                          Step {step.stepNumber}: {step.title}
                        </p>
                        <p className="text-xs text-[#263238]/75 mt-0.5">{step.instruction}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recyclable vs Non-Recyclable */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-[#263238]/10">
              <div className="rounded-xl bg-[#E8F5E9]/45 p-4 space-y-2">
                <h3 className="font-display text-sm font-bold text-[#1B5E20]">Recyclable Materials</h3>
                <ul className="list-disc list-inside space-y-1.5 text-xs text-[#263238]/85">
                  {activeCategory.recyclableMaterials.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl bg-red-50/70 p-4 space-y-2">
                <h3 className="font-display text-sm font-bold text-red-900">Non-Recyclable / Keep Out</h3>
                <ul className="list-disc list-inside space-y-1.5 text-xs text-[#263238]/85">
                  {activeCategory.nonRecyclableMaterials.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Preparation & Safety */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-[#263238]/10">
              <div className="space-y-2">
                <h3 className="font-display text-sm font-bold text-[#263238]">Preparation Instructions</h3>
                <ul className="list-disc list-inside space-y-1.5 text-xs text-[#263238]/80">
                  {activeCategory.preparationInstructions.map((prep, idx) => (
                    <li key={idx}>{prep}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-display text-sm font-bold text-[#263238] inline-flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-700" />
                  Safety Precautions
                </h3>
                <ul className="list-disc list-inside space-y-1.5 text-xs text-[#263238]/80">
                  {activeCategory.safetyPrecautions.map((safe, idx) => (
                    <li key={idx}>{safe}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* FAQs */}
          <div className="bg-white rounded-2xl border border-[#263238]/10 p-6 sm:p-8 space-y-4">
            <h3 className="font-display text-xl font-bold text-[#263238]">Frequently Asked Questions</h3>
            <div className="divide-y divide-[#263238]/10">
              {activeCategory.faqs.map((faq, idx) => (
                <div key={idx} className="py-3.5 first:pt-0 last:pb-0">
                  <p className="text-sm font-semibold text-[#263238]">{faq.question}</p>
                  <p className="text-xs sm:text-sm text-[#263238]/75 mt-1 leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Location-Aware Guidance & Disposal Options */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl border border-[#263238]/10 p-6 space-y-3">
            <div className="flex items-center gap-2 text-[#1B5E20]">
              <MapPin className="w-4 h-4" />
              <h3 className="font-display text-base font-bold">{localGuidance.regionLabel}</h3>
            </div>
            <p className="text-xs text-[#263238]/80 leading-relaxed">{localGuidance.curbsideNotes}</p>
            <p className="text-xs text-[#263238]/80 leading-relaxed">{localGuidance.dropOffGuidance}</p>
            <div className="pt-2 border-t border-[#263238]/10">
              <p className="text-xs font-semibold text-[#263238] mb-1.5">How to verify local facilities</p>
              <ul className="list-disc list-inside space-y-1 text-xs text-[#263238]/75">
                {localGuidance.verificationSteps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#263238]/10 p-6 space-y-3">
            <h3 className="font-display text-base font-bold text-[#263238]">Appropriate Disposal Methods</h3>
            <ul className="list-disc list-inside space-y-2 text-xs text-[#263238]/80">
              {activeCategory.disposalMethods.map((method, idx) => (
                <li key={idx}>{method}</li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
