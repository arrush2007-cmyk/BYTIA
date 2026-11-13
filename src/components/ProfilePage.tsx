import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { signOut } from 'firebase/auth';
import {
  Award,
  Bookmark,
  Camera,
  CheckCircle2,
  History,
  LogOut,
  MapPin,
  Trash2,
} from 'lucide-react';
import type { User } from 'firebase/auth';
import type {
  AchievementRecord,
  PublicProfile,
  ScannedProductRecord,
  UserActivity,
  UserProfile,
} from '../types/sustainability';
import { auth } from '../services/firebase';
import {
  deleteScannedProduct,
  toggleSavedScannedProduct,
  updateUserProfileData,
} from '../services/firestoreService';
import { processImageFile } from '../utils/imageCompression';
import { SafeImage } from './SafeImage';

interface ProfilePageProps {
  user: User | null;
  profile: UserProfile | null;
  myPublicProfile: PublicProfile | null;
  scans: ScannedProductRecord[];
  activities: UserActivity[];
  achievements: AchievementRecord[];
  onOpenAuth: () => void;
}

type ProfileTab = 'scans' | 'saved' | 'activities' | 'badges';

export function ProfilePage({
  user,
  profile,
  myPublicProfile,
  scans,
  activities,
  achievements,
  onOpenAuth,
}: ProfilePageProps) {
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>('scans');
  const [nameInput, setNameInput] = useState(profile?.name || user?.displayName || '');
  const [locationInput, setLocationInput] = useState(profile?.location || '');
  const [editing, setEditing] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [expandedScanId, setExpandedScanId] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center space-y-5">
        <div className="bg-white rounded-2xl border border-[#263238]/10 p-10 space-y-4">
          <h1 className="font-display text-3xl font-bold text-[#263238]">Your Sustainability Profile</h1>
          <p className="text-sm text-[#263238]/75 max-w-md mx-auto">
            Sign in with Google or register an account to access your private scan history, saved reuse recommendations, exchange history, and earned eco-badges.
          </p>
          <button
            type="button"
            onClick={onOpenAuth}
            className="px-6 py-3 rounded-xl bg-[#1B5E20] hover:bg-[#144718] text-white text-sm font-semibold cursor-pointer"
          >
            Sign In or Create Account
          </button>
        </div>
      </div>
    );
  }

  const handleAvatarUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user.emailVerified) return;
    try {
      const processed = await processImageFile(file);
      await updateUserProfileData(user.uid, { profileImage: processed.storageDataUrl });
      setStatusNotice('Profile picture updated.');
    } catch (err) {
      setStatusNotice(err instanceof Error ? err.message : 'Unable to upload profile picture.');
    }
  };

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!user.emailVerified) {
      setStatusNotice('Please verify your email address before saving profile updates.');
      return;
    }
    try {
      await updateUserProfileData(user.uid, {
        name: nameInput.trim(),
        location: locationInput.trim(),
      });
      setEditing(false);
      setStatusNotice('Profile details saved.');
    } catch (err) {
      setStatusNotice(err instanceof Error ? err.message : 'Failed to save profile.');
    }
  };

  const savedScans = scans.filter((s) => s.isSaved);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 pb-20 space-y-8">
      {/* Header Profile Card */}
      <section className="bg-white rounded-2xl border border-[#263238]/10 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="relative w-20 h-20 shrink-0">
            <div className="w-20 h-20 rounded-2xl overflow-hidden border border-[#263238]/10 bg-[#E8F5E9]">
              <SafeImage
                src={profile?.profileImage || user.photoURL || undefined}
                alt={profile?.name || user.displayName || 'Profile picture'}
                className="w-full h-full object-cover"
                fallbackLabel={(profile?.name || user.email || 'U').slice(0, 2).toUpperCase()}
              />
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="sr-only"
              id="profile-avatar-upload"
            />
            {user.emailVerified && (
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                aria-label="Upload profile picture"
                className="absolute -bottom-2 -right-2 p-1.5 rounded-lg bg-[#1B5E20] text-white shadow-sm hover:bg-[#144718] cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#263238]">
              {profile?.name || user.displayName || 'Eco Member'}
            </h1>
            <p className="text-sm text-[#263238]/70">{user.email}</p>
            <p className="text-xs text-[#1B5E20] font-medium inline-flex items-center gap-1 mt-1">
              <MapPin className="w-3.5 h-3.5" />
              {profile?.location || 'Location not set'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="px-4 py-2.5 rounded-xl bg-[#E8F5E9] text-[#1B5E20]">
            <span className="text-[11px] block">Eco-Points</span>
            <span className="font-mono tabular-nums text-lg font-bold">{myPublicProfile?.ecoPoints ?? 0}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setNameInput(profile?.name || user.displayName || '');
              setLocationInput(profile?.location || '');
              setEditing(!editing);
            }}
            className="px-4 py-2.5 rounded-xl border border-[#263238]/20 hover:border-[#1B5E20] text-xs font-semibold cursor-pointer"
          >
            {editing ? 'Cancel Edit' : 'Edit Profile'}
          </button>
          <button
            type="button"
            onClick={() => signOut(auth)}
            className="px-4 py-2.5 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </section>

      {statusNotice && (
        <div className="p-3 rounded-xl bg-[#E8F5E9] border border-[#4CAF50]/40 text-xs text-[#1B5E20] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusNotice}</span>
        </div>
      )}

      {editing && (
        <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl border border-[#263238]/10 p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label htmlFor="prof-name" className="block text-xs font-semibold text-[#263238] mb-1">
              Full Name
            </label>
            <input
              id="prof-name"
              type="text"
              required
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#263238]/20"
            />
          </div>
          <div>
            <label htmlFor="prof-loc" className="block text-xs font-semibold text-[#263238] mb-1">
              City / Approximate Location
            </label>
            <input
              id="prof-loc"
              type="text"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              placeholder="e.g., Seattle, WA"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#263238]/20"
            />
          </div>
          <button
            type="submit"
            className="py-2.5 px-5 rounded-xl bg-[#1B5E20] text-white text-sm font-semibold cursor-pointer"
          >
            Save Changes
          </button>
        </form>
      )}

      {/* Summary Counts */}
      <section className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: 'Total Scanned', value: myPublicProfile?.scannedCount ?? 0 },
          { label: 'Reused', value: myPublicProfile?.reusedCount ?? 0 },
          { label: 'Donated', value: myPublicProfile?.donatedCount ?? 0 },
          { label: 'Recycled', value: myPublicProfile?.recycledCount ?? 0 },
          { label: 'Exchanged', value: myPublicProfile?.exchangedCount ?? 0 },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-[#263238]/10 px-4 py-3.5">
            <p className="text-xs text-[#263238]/65">{stat.label}</p>
            <p className="font-mono tabular-nums text-2xl font-bold text-[#1B5E20] mt-1">{stat.value}</p>
          </div>
        ))}
      </section>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-white border border-[#263238]/10 rounded-xl overflow-x-auto">
        {(
          [
            { id: 'scans', label: `Scan History (${scans.length})` },
            { id: 'saved', label: `Saved Recommendations (${savedScans.length})` },
            { id: 'activities', label: `Activity History (${activities.length})` },
            { id: 'badges', label: `Earned Badges (${achievements.length})` },
          ] as { id: ProfileTab; label: string }[]
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === tab.id ? 'bg-[#1B5E20] text-white' : 'text-[#263238]/75 hover:bg-[#E8F5E9]/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {(activeTab === 'scans' || activeTab === 'saved') && (
        <section className="space-y-4">
          {(activeTab === 'scans' ? scans : savedScans).length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#263238]/10 p-8 text-center text-sm text-[#263238]/70">
              {activeTab === 'scans'
                ? 'No scans recorded yet. Scan a product in AI Scanner to build your history.'
                : 'No saved recommendations yet. Click "Save" on any scan result to bookmark it here.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {(activeTab === 'scans' ? scans : savedScans).map((scan) => {
                const isExpanded = expandedScanId === scan.scanId;
                return (
                  <article
                    key={scan.scanId}
                    className="bg-white rounded-2xl border border-[#263238]/10 p-5 space-y-3"
                  >
                    <div className="flex gap-4 justify-between">
                      <div className="flex gap-4 min-w-0">
                        <div className="w-20 h-20 rounded-xl overflow-hidden border border-[#263238]/10 shrink-0">
                          <SafeImage src={scan.imageUrl} alt={scan.productName} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0 space-y-1">
                          <h2 className="font-display text-base font-bold text-[#263238] truncate">{scan.productName}</h2>
                          <p className="text-xs font-medium text-[#1B5E20]">
                            {scan.recommendation} · {scan.category}
                          </p>
                          <p className="text-xs text-[#263238]/70 line-clamp-2">
                            {scan.material} · {scan.condition}
                          </p>
                          {scan.alternativeUses.length > 0 && (
                            <p className="text-xs text-[#263238]/80 line-clamp-1">
                              Idea: {scan.alternativeUses[0]}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col justify-between items-end shrink-0">
                        <button
                          type="button"
                          onClick={() => toggleSavedScannedProduct(scan.scanId, !scan.isSaved)}
                          aria-label={scan.isSaved ? 'Remove from saved' : 'Save recommendation'}
                          className={`p-1.5 rounded-lg cursor-pointer ${
                            scan.isSaved ? 'text-[#1B5E20] bg-[#E8F5E9]' : 'text-[#263238]/45 hover:text-[#1B5E20]'
                          }`}
                        >
                          <Bookmark className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteScannedProduct(scan.scanId)}
                          aria-label={`Delete scan ${scan.productName}`}
                          className="p-1.5 rounded-lg text-[#263238]/40 hover:text-red-700 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#263238]/10 flex items-center justify-between text-xs">
                      <span className="text-[#263238]/60">
                        {new Date(scan.createdAt).toLocaleDateString()}
                        {scan.actionTaken ? ` · Action: ${scan.actionTaken}` : ''}
                      </span>
                      <button
                        type="button"
                        onClick={() => setExpandedScanId(isExpanded ? null : scan.scanId)}
                        className="font-semibold text-[#1B5E20] hover:underline cursor-pointer"
                      >
                        {isExpanded ? 'Hide Guidance' : 'Revisit Analysis'}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="pt-2 space-y-2.5 text-xs text-[#263238]/85 bg-[#F7F9F5] rounded-xl p-3.5">
                        {scan.alternativeUses.length > 0 && (
                          <div>
                            <p className="font-semibold text-[#263238] mb-1">Alternative Uses</p>
                            <ul className="list-disc list-inside space-y-1">
                              {scan.alternativeUses.map((u, idx) => (
                                <li key={idx}>{u}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {scan.recyclingSteps.length > 0 && (
                          <div>
                            <p className="font-semibold text-[#263238] mb-1">Recycling Steps</p>
                            <ol className="list-decimal list-inside space-y-1">
                              {scan.recyclingSteps.map((st, idx) => (
                                <li key={idx}>{st}</li>
                              ))}
                            </ol>
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {activeTab === 'activities' && (
        <section className="bg-white rounded-2xl border border-[#263238]/10 p-6">
          {activities.length === 0 ? (
            <p className="text-sm text-[#263238]/70 text-center py-6">No logged activities yet.</p>
          ) : (
            <div className="divide-y divide-[#263238]/10">
              {activities.map((act) => (
                <div key={act.activityId} className="py-3.5 flex items-center justify-between gap-4 text-sm">
                  <div className="flex items-center gap-3">
                    <History className="w-4 h-4 text-[#1B5E20] shrink-0" />
                    <div>
                      <p className="font-semibold text-[#263238]">
                        <span className="capitalize">{act.activityType}</span> · {act.productName}
                      </p>
                      <p className="text-xs text-[#263238]/60">
                        {act.category} · {new Date(act.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono tabular-nums text-xs font-bold text-[#1B5E20] shrink-0">
                    +{act.ecoPoints} pts
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === 'badges' && (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.length === 0 ? (
            <div className="col-span-full bg-white rounded-2xl border border-[#263238]/10 p-8 text-center text-sm text-[#263238]/70">
              Earn your first badge by scanning an item or logging a reuse, donation, or recycling action.
            </div>
          ) : (
            achievements.map((ach) => (
              <div key={ach.achievementId} className="bg-[#E8F5E9]/60 rounded-2xl border border-[#4CAF50]/40 p-5 flex items-start gap-3">
                <Award className="w-5 h-5 text-[#1B5E20] shrink-0 mt-0.5" />
                <div>
                  <h2 className="font-display text-base font-bold text-[#263238]">{ach.badgeType}</h2>
                  <p className="text-xs text-[#263238]/70 mt-0.5">
                    Unlocked {new Date(ach.earnedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </section>
      )}
    </div>
  );
}
