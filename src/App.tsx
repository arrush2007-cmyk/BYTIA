import { useEffect, useState } from 'react';
import { onAuthStateChanged, sendEmailVerification, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './services/firebase';
import {
  ensureUserProfiles,
  subscribeCommunityListings,
  subscribePublicProfiles,
  subscribeUserAchievements,
  subscribeUserActivities,
  subscribeUserExchangeRequests,
  subscribeUserScans,
} from './services/firestoreService';
import type {
  AchievementRecord,
  AppRoute,
  CommunityListing,
  ExchangeRequest,
  PublicProfile,
  ScannedProductRecord,
  UserActivity,
  UserProfile,
} from './types/sustainability';
import { SHOWCASE_COMMUNITY_LISTINGS } from './data/seedData';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { HomePage } from './components/HomePage';
import { WasteScannerPage } from './components/WasteScannerPage';
import { CommunityExchangePage } from './components/CommunityExchangePage';
import { RecyclingGuidePage } from './components/RecyclingGuidePage';
import { ImpactDashboardPage } from './components/ImpactDashboardPage';
import { ProfilePage } from './components/ProfilePage';

export default function App() {
  const [activeRoute, setActiveRoute] = useState<AppRoute>('home');
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [verificationNotice, setVerificationNotice] = useState<string | null>(null);

  const [publicProfiles, setPublicProfiles] = useState<PublicProfile[]>([]);
  const [firestoreListings, setFirestoreListings] = useState<CommunityListing[]>([]);
  const [scans, setScans] = useState<ScannedProductRecord[]>([]);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [achievements, setAchievements] = useState<AchievementRecord[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<ExchangeRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<ExchangeRequest[]>([]);

  // Cross-page handoff state
  const [scannerTriggerMode, setScannerTriggerMode] = useState<'camera' | 'upload' | null>(null);
  const [scannerInitialQuery, setScannerInitialQuery] = useState<string | undefined>(undefined);
  const [guideInitialCategory, setGuideInitialCategory] = useState<string | undefined>(undefined);
  const [listingPrefill, setListingPrefill] = useState<{
    productName: string;
    description: string;
    imageUrl?: string;
  } | null>(null);

  // Firebase Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
      if (currentUser && currentUser.emailVerified) {
        try {
          const { privateProfile } = await ensureUserProfiles(currentUser);
          if (privateProfile) setProfile(privateProfile);
        } catch (err) {
          console.error('Profile bootstrap error:', err);
        }
      } else {
        setProfile(null);
      }
    });
    return () => unsub();
  }, []);

  // Public global subscriptions (Leaderboard + Community Listings)
  useEffect(() => {
    const unsubPub = subscribePublicProfiles(setPublicProfiles);
    const unsubLst = subscribeCommunityListings(setFirestoreListings);
    return () => {
      unsubPub();
      unsubLst();
    };
  }, []);

  // Private per-user subscriptions (only when authenticated & ready)
  useEffect(() => {
    if (!authReady || !user) {
      setScans([]);
      setActivities([]);
      setAchievements([]);
      setIncomingRequests([]);
      setOutgoingRequests([]);
      return;
    }

    const unsubProfile = onSnapshot(
      doc(db, 'users', user.uid),
      (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          setProfile({
            userId: d.userId,
            name: d.name,
            email: d.email,
            profileImage: d.profileImage || '',
            location: d.location || '',
            ecoPoints: d.ecoPoints ?? 0,
            goalReuse: d.goalReuse ?? 5,
            goalDonate: d.goalDonate ?? 3,
            goalRecycle: d.goalRecycle ?? 10,
            createdAt: String(d.createdAt || ''),
            updatedAt: String(d.updatedAt || ''),
          });
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, `users/${user.uid}`)
    );

    const unsubScans = subscribeUserScans(user.uid, setScans);
    const unsubActs = subscribeUserActivities(user.uid, setActivities);
    const unsubAch = subscribeUserAchievements(user.uid, setAchievements);
    const unsubReqs = subscribeUserExchangeRequests(user.uid, (inc, out) => {
      setIncomingRequests(inc);
      setOutgoingRequests(out);
    });

    return () => {
      unsubProfile();
      unsubScans();
      unsubActs();
      unsubAch();
      unsubReqs();
    };
  }, [authReady, user]);

  const navigate = (route: AppRoute) => {
    setActiveRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResendVerification = async () => {
    if (!auth.currentUser) return;
    try {
      await sendEmailVerification(auth.currentUser);
      setVerificationNotice('Verification email sent.');
    } catch (err) {
      setVerificationNotice(err instanceof Error ? err.message : 'Please wait before resending.');
    }
  };

  const handleRefreshVerification = async () => {
    if (!auth.currentUser) return;
    await auth.currentUser.reload();
    const refreshed = auth.currentUser;
    setUser(refreshed);
    if (refreshed.emailVerified) {
      setVerificationNotice(null);
      const { privateProfile } = await ensureUserProfiles(refreshed);
      if (privateProfile) setProfile(privateProfile);
    } else {
      setVerificationNotice('Not verified yet — check your inbox and spam folder.');
    }
  };

  const displayListings =
    firestoreListings.length > 0 ? firestoreListings : SHOWCASE_COMMUNITY_LISTINGS;

  const myPublicProfile = user
    ? publicProfiles.find((p) => p.userId === user.uid) || null
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F9F5] text-[#263238]">
      <Navbar
        activeRoute={activeRoute}
        onNavigate={navigate}
        user={user}
        profile={profile}
        onOpenAuth={() => setAuthModalOpen(true)}
        onResendVerification={handleResendVerification}
        onRefreshVerification={handleRefreshVerification}
        verificationNotice={verificationNotice}
      />

      <main className="flex-1">
        {activeRoute === 'home' && (
          <HomePage
            user={user}
            profile={profile}
            publicProfiles={publicProfiles}
            listings={displayListings}
            recentScans={scans}
            onNavigate={navigate}
            onStartScanMode={(mode) => {
              setScannerTriggerMode(mode);
              navigate('scanner');
            }}
            onProductSearch={(q) => {
              setScannerInitialQuery(q);
              navigate('scanner');
            }}
            onOpenAuth={() => setAuthModalOpen(true)}
            onSelectGuideCategory={(catId) => setGuideInitialCategory(catId)}
          />
        )}

        {activeRoute === 'scanner' && (
          <WasteScannerPage
            user={user}
            profile={profile}
            initialMode={scannerTriggerMode}
            initialQuery={scannerInitialQuery}
            onClearInitialTrigger={() => {
              setScannerTriggerMode(null);
              setScannerInitialQuery(undefined);
            }}
            onOpenAuth={() => setAuthModalOpen(true)}
            onListOnExchange={(prefill) => {
              setListingPrefill(prefill);
              navigate('community');
            }}
          />
        )}

        {activeRoute === 'community' && (
          <CommunityExchangePage
            user={user}
            profile={profile}
            listings={displayListings}
            incomingRequests={incomingRequests}
            outgoingRequests={outgoingRequests}
            prefillListing={listingPrefill}
            onClearPrefill={() => setListingPrefill(null)}
            onOpenAuth={() => setAuthModalOpen(true)}
          />
        )}

        {activeRoute === 'guide' && (
          <RecyclingGuidePage
            initialCategoryId={guideInitialCategory}
            defaultLocation={profile?.location}
          />
        )}

        {activeRoute === 'dashboard' && (
          <ImpactDashboardPage
            user={user}
            profile={profile}
            myPublicProfile={myPublicProfile}
            publicProfiles={publicProfiles}
            activities={activities}
            achievements={achievements}
            onOpenAuth={() => setAuthModalOpen(true)}
          />
        )}

        {activeRoute === 'profile' && (
          <ProfilePage
            user={user}
            profile={profile}
            myPublicProfile={myPublicProfile}
            scans={scans}
            activities={activities}
            achievements={achievements}
            onOpenAuth={() => setAuthModalOpen(true)}
          />
        )}
      </main>

      <footer className="border-t border-[#263238]/10 bg-white py-8 mb-14 md:mb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#263238]/70">
          <div>
            <p className="font-display font-bold text-sm text-[#1B5E20]">Before You Throw It Away</p>
            <p className="mt-0.5">Think Before You Throw – Give Every Product a Second Life.</p>
          </div>
          <div className="flex flex-wrap gap-5">
            <button type="button" onClick={() => navigate('scanner')} className="hover:text-[#1B5E20] cursor-pointer">
              AI Scanner
            </button>
            <button type="button" onClick={() => navigate('community')} className="hover:text-[#1B5E20] cursor-pointer">
              Community Exchange
            </button>
            <button type="button" onClick={() => navigate('guide')} className="hover:text-[#1B5E20] cursor-pointer">
              Recycling Guide
            </button>
            <button type="button" onClick={() => navigate('dashboard')} className="hover:text-[#1B5E20] cursor-pointer">
              Impact Dashboard
            </button>
          </div>
        </div>
      </footer>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
}
