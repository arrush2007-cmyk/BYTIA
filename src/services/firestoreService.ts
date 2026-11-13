import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import type {
  AchievementRecord,
  ActivityType,
  BadgeType,
  CommunityListing,
  ExchangeMessage,
  ExchangeRequest,
  ItemCondition,
  MarketplaceCategory,
  PublicProfile,
  ScannedProductRecord,
  UserActivity,
  UserProfile,
  WasteAnalysisResult,
} from '../types/sustainability';
import {
  ECO_POINTS_BY_ACTIVITY,
  evaluateEligibleBadges,
  getEstimatedWeightKg,
  sanitizeFirestoreId,
} from '../utils/impactCalculations';

function toIsoString(val: unknown): string {
  if (val instanceof Timestamp) return val.toDate().toISOString();
  if (val && typeof val === 'object' && 'toDate' in val && typeof (val as { toDate: () => Date }).toDate === 'function') {
    return (val as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof val === 'string') return val;
  return new Date().toISOString();
}

function truncate(val: string | undefined, max: number): string {
  return (val || '').trim().slice(0, max);
}

export async function ensureUserProfiles(
  user: User,
  overrides?: { name?: string; location?: string }
): Promise<{ privateProfile: UserProfile | null; publicProfile: PublicProfile | null }> {
  if (!user.emailVerified) {
    return { privateProfile: null, publicProfile: null };
  }

  const userRef = doc(db, 'users', user.uid);
  const publicRef = doc(db, 'publicProfiles', user.uid);

  let privateSnap;
  try {
    privateSnap = await getDoc(userRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
  }

  const displayName = truncate(overrides?.name || user.displayName || user.email?.split('@')[0] || 'Eco Member', 80);
  const location = truncate(overrides?.location || '', 120);
  const photo = truncate(user.photoURL || '', 200000);
  const email = truncate(user.email || '', 160);

  if (!privateSnap.exists()) {
    const newPrivate = {
      userId: user.uid,
      name: displayName,
      email,
      profileImage: photo,
      location,
      ecoPoints: 0,
      goalReuse: 5,
      goalDonate: 3,
      goalRecycle: 10,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    try {
      await setDoc(userRef, newPrivate);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}`);
    }
  }

  let publicSnap;
  try {
    publicSnap = await getDoc(publicRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `publicProfiles/${user.uid}`);
  }

  if (!publicSnap.exists()) {
    const newPublic = {
      userId: user.uid,
      displayName,
      photoUrl: photo,
      city: truncate(location, 80),
      ecoPoints: 0,
      scannedCount: 0,
      reusedCount: 0,
      donatedCount: 0,
      recycledCount: 0,
      exchangedCount: 0,
      disposedCount: 0,
      estimatedKgDiverted: 0,
      updatedAt: serverTimestamp(),
    };
    try {
      await setDoc(publicRef, newPublic);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `publicProfiles/${user.uid}`);
    }
  }

  let finalPrivate;
  let finalPublic;
  try {
    [finalPrivate, finalPublic] = await Promise.all([getDoc(userRef), getDoc(publicRef)]);
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
  }
  const pData = finalPrivate.data();
  const pubData = finalPublic.data();

  return {
    privateProfile: pData
      ? {
          userId: pData.userId,
          name: pData.name,
          email: pData.email,
          profileImage: pData.profileImage || '',
          location: pData.location || '',
          ecoPoints: pData.ecoPoints ?? 0,
          goalReuse: pData.goalReuse ?? 5,
          goalDonate: pData.goalDonate ?? 3,
          goalRecycle: pData.goalRecycle ?? 10,
          createdAt: toIsoString(pData.createdAt),
          updatedAt: toIsoString(pData.updatedAt),
        }
      : null,
    publicProfile: pubData
      ? {
          userId: pubData.userId,
          displayName: pubData.displayName,
          photoUrl: pubData.photoUrl || '',
          city: pubData.city || '',
          ecoPoints: pubData.ecoPoints ?? 0,
          scannedCount: pubData.scannedCount ?? 0,
          reusedCount: pubData.reusedCount ?? 0,
          donatedCount: pubData.donatedCount ?? 0,
          recycledCount: pubData.recycledCount ?? 0,
          exchangedCount: pubData.exchangedCount ?? 0,
          disposedCount: pubData.disposedCount ?? 0,
          estimatedKgDiverted: pubData.estimatedKgDiverted ?? 0,
          updatedAt: toIsoString(pubData.updatedAt),
        }
      : null,
  };
}

export async function updateUserProfileData(
  uid: string,
  updates: {
    name?: string;
    location?: string;
    profileImage?: string;
    goalReuse?: number;
    goalDonate?: number;
    goalRecycle?: number;
  }
): Promise<void> {
  const userRef = doc(db, 'users', uid);
  const publicRef = doc(db, 'publicProfiles', uid);

  const privatePatch: Record<string, unknown> = { updatedAt: serverTimestamp() };
  const publicPatch: Record<string, unknown> = { updatedAt: serverTimestamp() };

  if (updates.name !== undefined) {
    const cleanName = truncate(updates.name, 100);
    if (cleanName) {
      privatePatch.name = cleanName;
      publicPatch.displayName = truncate(cleanName, 80);
    }
  }
  if (updates.location !== undefined) {
    privatePatch.location = truncate(updates.location, 120);
    publicPatch.city = truncate(updates.location, 80);
  }
  if (updates.profileImage !== undefined) {
    const cleanImg = truncate(updates.profileImage, 200000);
    privatePatch.profileImage = cleanImg;
    publicPatch.photoUrl = cleanImg;
  }
  if (updates.goalReuse !== undefined) {
    privatePatch.goalReuse = Math.max(1, Math.min(500, Math.round(updates.goalReuse)));
  }
  if (updates.goalDonate !== undefined) {
    privatePatch.goalDonate = Math.max(1, Math.min(500, Math.round(updates.goalDonate)));
  }
  if (updates.goalRecycle !== undefined) {
    privatePatch.goalRecycle = Math.max(1, Math.min(500, Math.round(updates.goalRecycle)));
  }

  try {
    await updateDoc(userRef, privatePatch);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
  }

  if (Object.keys(publicPatch).length > 1) {
    try {
      await updateDoc(publicRef, publicPatch);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `publicProfiles/${uid}`);
    }
  }
}

export async function saveScannedProductAndLogScan(
  uid: string,
  analysis: WasteAnalysisResult,
  imageUrl?: string
): Promise<string> {
  const scanId = sanitizeFirestoreId(`scan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
  const scanRef = doc(db, 'scannedProducts', scanId);

  const alternativeUses = (analysis.reuseIdeas || [])
    .slice(0, 6)
    .map((idea) => truncate(`${idea.title}: ${idea.description}`, 240));
  const recyclingSteps = (analysis.recyclingGuidance?.recyclingSteps || [])
    .slice(0, 8)
    .map((s) => truncate(s, 240));

  const payload = {
    scanId,
    userId: uid,
    productName: truncate(analysis.productName, 140) || 'Identified Item',
    category: analysis.category,
    material: truncate(analysis.materialComposition, 200) || 'Not specified',
    condition: truncate(analysis.visibleCondition, 200) || 'Not specified',
    recommendation: analysis.primaryRecommendation,
    alternativeUses,
    recyclingSteps,
    analysisPayload: {
      decisionSummary: truncate(analysis.decisionSummary, 300),
      decisionReasoning: truncate(analysis.decisionReasoning, 400),
      isHazardous: Boolean(analysis.isHazardous),
      hazardWarning: truncate(analysis.hazardWarning, 300),
      estimatedWeightKg: getEstimatedWeightKg(analysis.category, analysis.estimatedWeightKg),
    },
    imageUrl: truncate(imageUrl, 200000),
    isSaved: false,
    actionTaken: '',
    createdAt: serverTimestamp(),
  };

  try {
    await setDoc(scanRef, payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `scannedProducts/${scanId}`);
  }

  await logVerifiedSustainabilityAction(
    uid,
    'scan',
    scanId,
    payload.productName,
    analysis.category,
    0 // Scanning itself doesn't divert waste until user completes Reuse/Donate/Recycle/Exchange
  );

  return scanId;
}

export async function toggleSavedScannedProduct(scanId: string, isSaved: boolean): Promise<void> {
  const scanRef = doc(db, 'scannedProducts', scanId);
  try {
    await updateDoc(scanRef, { isSaved });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `scannedProducts/${scanId}`);
  }
}

export async function deleteScannedProduct(scanId: string): Promise<void> {
  const scanRef = doc(db, 'scannedProducts', scanId);
  try {
    await deleteDoc(scanRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `scannedProducts/${scanId}`);
  }
}

export async function logVerifiedSustainabilityAction(
  uid: string,
  activityType: ActivityType,
  productId: string,
  productName: string,
  category: string,
  estimatedKg: number,
  scanIdToMark?: string
): Promise<{ alreadyLogged: boolean; newlyUnlockedBadges: BadgeType[] }> {
  const cleanProductId = sanitizeFirestoreId(productId).slice(0, 60);
  const activityId = sanitizeFirestoreId(`act_${uid}_${activityType}_${cleanProductId}`);
  const actRef = doc(db, 'userActivities', activityId);

  let existingAct;
  try {
    existingAct = await getDoc(actRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `userActivities/${activityId}`);
  }

  if (existingAct.exists()) {
    return { alreadyLogged: true, newlyUnlockedBadges: [] };
  }

  const pointsEarned = ECO_POINTS_BY_ACTIVITY[activityType];
  const safeKg = activityType === 'scan' || activityType === 'dispose' ? 0 : getEstimatedWeightKg(category, estimatedKg);

  try {
    await setDoc(actRef, {
      activityId,
      userId: uid,
      activityType,
      productId: cleanProductId,
      productName: truncate(productName, 140) || 'Item',
      category: truncate(category, 60) || 'Other materials',
      estimatedKg: safeKg,
      verifiedStatus: 'verified',
      ecoPoints: pointsEarned,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `userActivities/${activityId}`);
  }

  if (scanIdToMark) {
    const scanRef = doc(db, 'scannedProducts', scanIdToMark);
    try {
      await updateDoc(scanRef, { actionTaken: activityType });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `scannedProducts/${scanIdToMark}`);
    }
  }

  const publicRef = doc(db, 'publicProfiles', uid);
  const userRef = doc(db, 'users', uid);

  let pubSnap;
  let userSnap;
  try {
    [pubSnap, userSnap] = await Promise.all([getDoc(publicRef), getDoc(userRef)]);
    if ((!pubSnap.exists() || !userSnap.exists()) && auth.currentUser?.uid === uid) {
      await ensureUserProfiles(auth.currentUser);
      [pubSnap, userSnap] = await Promise.all([getDoc(publicRef), getDoc(userRef)]);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `publicProfiles/${uid}`);
  }
  const pub = pubSnap.data() || {};
  const priv = userSnap.data() || {};

  const nextPublic = {
    ecoPoints: (pub.ecoPoints ?? 0) + pointsEarned,
    scannedCount: (pub.scannedCount ?? 0) + (activityType === 'scan' ? 1 : 0),
    reusedCount: (pub.reusedCount ?? 0) + (activityType === 'reuse' ? 1 : 0),
    donatedCount: (pub.donatedCount ?? 0) + (activityType === 'donate' ? 1 : 0),
    recycledCount: (pub.recycledCount ?? 0) + (activityType === 'recycle' ? 1 : 0),
    exchangedCount: (pub.exchangedCount ?? 0) + (activityType === 'exchange' ? 1 : 0),
    disposedCount: (pub.disposedCount ?? 0) + (activityType === 'dispose' ? 1 : 0),
    estimatedKgDiverted: Math.round(((pub.estimatedKgDiverted ?? 0) + safeKg) * 100) / 100,
    updatedAt: serverTimestamp(),
  };

  try {
    await updateDoc(publicRef, nextPublic);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `publicProfiles/${uid}`);
  }

  try {
    await updateDoc(userRef, {
      ecoPoints: (priv.ecoPoints ?? 0) + pointsEarned,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
  }

  const eligible = evaluateEligibleBadges(nextPublic);
  const newlyUnlocked: BadgeType[] = [];

  for (const badgeType of eligible) {
    const achId = sanitizeFirestoreId(`ach_${uid}_${badgeType.replace(/\s+/g, '_')}`);
    const achRef = doc(db, 'achievements', achId);
    let achSnap;
    try {
      achSnap = await getDoc(achRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `achievements/${achId}`);
    }
    if (!achSnap.exists()) {
      try {
        await setDoc(achRef, {
          achievementId: achId,
          userId: uid,
          badgeType,
          earnedAt: serverTimestamp(),
        });
        newlyUnlocked.push(badgeType);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `achievements/${achId}`);
      }
    }
  }

  return { alreadyLogged: false, newlyUnlockedBadges: newlyUnlocked };
}

export async function createCommunityListing(
  uid: string,
  sellerName: string,
  input: {
    productName: string;
    description: string;
    category: MarketplaceCategory;
    condition: ItemCondition;
    imageUrl?: string;
    approximateLocation: string;
    listingType: 'free' | 'exchange';
    exchangePreference?: string;
  }
): Promise<string> {
  const listingId = sanitizeFirestoreId(`lst_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
  const listingRef = doc(db, 'communityListings', listingId);

  const payload = {
    listingId,
    userId: uid,
    sellerName: truncate(sellerName, 80) || 'Member',
    productName: truncate(input.productName, 120),
    description: truncate(input.description, 1000),
    category: input.category,
    condition: input.condition,
    imageUrl: truncate(input.imageUrl, 200000),
    approximateLocation: truncate(input.approximateLocation, 100),
    listingType: input.listingType,
    exchangePreference: truncate(input.exchangePreference, 160),
    status: 'available',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(listingRef, payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `communityListings/${listingId}`);
  }

  return listingId;
}

export async function updateListingStatus(
  listingId: string,
  status: 'exchanged' | 'unavailable',
  ownerUid?: string,
  listingTitle?: string,
  category?: string
): Promise<void> {
  const listingRef = doc(db, 'communityListings', listingId);
  try {
    await updateDoc(listingRef, {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `communityListings/${listingId}`);
  }

  if (status === 'exchanged' && ownerUid && listingTitle) {
    await logVerifiedSustainabilityAction(
      ownerUid,
      'exchange',
      listingId,
      listingTitle,
      category || 'Household items',
      1.5
    );
  }
}

export async function createExchangeRequest(
  senderId: string,
  senderName: string,
  listing: CommunityListing,
  message: string
): Promise<string> {
  const requestId = sanitizeFirestoreId(`req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);
  const reqRef = doc(db, 'exchangeRequests', requestId);

  try {
    await setDoc(reqRef, {
      requestId,
      listingId: listing.listingId,
      listingTitle: truncate(listing.productName, 140),
      senderId,
      senderName: truncate(senderName, 80) || 'Neighbor',
      receiverId: listing.userId,
      receiverName: truncate(listing.sellerName, 80) || 'Owner',
      message: truncate(message, 600),
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `exchangeRequests/${requestId}`);
  }

  // Also write initial message into messages subcollection
  const msgId = sanitizeFirestoreId(`msg_${Date.now()}_init`);
  const msgRef = doc(db, 'exchangeRequests', requestId, 'messages', msgId);
  try {
    await setDoc(msgRef, {
      messageId: msgId,
      requestId,
      senderId,
      receiverId: listing.userId,
      authorId: senderId,
      authorName: truncate(senderName, 80) || 'Neighbor',
      body: truncate(message, 600),
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `exchangeRequests/${requestId}/messages/${msgId}`);
  }

  return requestId;
}

export async function respondToExchangeRequest(
  requestId: string,
  status: 'accepted' | 'rejected' | 'cancelled'
): Promise<void> {
  const reqRef = doc(db, 'exchangeRequests', requestId);
  try {
    await updateDoc(reqRef, {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `exchangeRequests/${requestId}`);
  }
}

export async function sendExchangeMessage(
  request: ExchangeRequest,
  authorId: string,
  authorName: string,
  body: string
): Promise<void> {
  const msgId = sanitizeFirestoreId(`msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);
  const msgRef = doc(db, 'exchangeRequests', request.requestId, 'messages', msgId);
  try {
    await setDoc(msgRef, {
      messageId: msgId,
      requestId: request.requestId,
      senderId: request.senderId,
      receiverId: request.receiverId,
      authorId,
      authorName: truncate(authorName, 80) || 'Member',
      body: truncate(body, 600),
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `exchangeRequests/${request.requestId}/messages/${msgId}`);
  }
}

// --- Subscriptions ---

export function subscribePublicProfiles(onData: (profiles: PublicProfile[]) => void): Unsubscribe {
  const q = query(collection(db, 'publicProfiles'), orderBy('ecoPoints', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      onData(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            userId: data.userId,
            displayName: data.displayName,
            photoUrl: data.photoUrl || '',
            city: data.city || '',
            ecoPoints: data.ecoPoints ?? 0,
            scannedCount: data.scannedCount ?? 0,
            reusedCount: data.reusedCount ?? 0,
            donatedCount: data.donatedCount ?? 0,
            recycledCount: data.recycledCount ?? 0,
            exchangedCount: data.exchangedCount ?? 0,
            disposedCount: data.disposedCount ?? 0,
            estimatedKgDiverted: data.estimatedKgDiverted ?? 0,
            updatedAt: toIsoString(data.updatedAt),
          };
        })
      );
    },
    (err) => handleFirestoreError(err, OperationType.LIST, 'publicProfiles')
  );
}

export function subscribeCommunityListings(onData: (listings: CommunityListing[]) => void): Unsubscribe {
  const q = query(collection(db, 'communityListings'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      onData(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            listingId: data.listingId,
            userId: data.userId,
            sellerName: data.sellerName,
            productName: data.productName,
            description: data.description,
            category: data.category,
            condition: data.condition,
            imageUrl: data.imageUrl || '',
            approximateLocation: data.approximateLocation,
            listingType: data.listingType,
            exchangePreference: data.exchangePreference || '',
            status: data.status,
            createdAt: toIsoString(data.createdAt),
            updatedAt: toIsoString(data.updatedAt),
          };
        })
      );
    },
    (err) => handleFirestoreError(err, OperationType.LIST, 'communityListings')
  );
}

export function subscribeUserScans(uid: string, onData: (scans: ScannedProductRecord[]) => void): Unsubscribe {
  const q = query(collection(db, 'scannedProducts'), where('userId', '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      const rows: ScannedProductRecord[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          scanId: data.scanId,
          userId: data.userId,
          productName: data.productName,
          category: data.category,
          material: data.material,
          condition: data.condition,
          recommendation: data.recommendation,
          alternativeUses: data.alternativeUses || [],
          recyclingSteps: data.recyclingSteps || [],
          analysisPayload: data.analysisPayload,
          imageUrl: data.imageUrl || '',
          isSaved: Boolean(data.isSaved),
          actionTaken: data.actionTaken || '',
          createdAt: toIsoString(data.createdAt),
        };
      });
      rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onData(rows);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, 'scannedProducts')
  );
}

export function subscribeUserActivities(uid: string, onData: (activities: UserActivity[]) => void): Unsubscribe {
  const q = query(collection(db, 'userActivities'), where('userId', '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      const rows: UserActivity[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          activityId: data.activityId,
          userId: data.userId,
          activityType: data.activityType,
          productId: data.productId,
          productName: data.productName,
          category: data.category,
          estimatedKg: data.estimatedKg ?? 0,
          verifiedStatus: 'verified',
          ecoPoints: data.ecoPoints ?? 0,
          createdAt: toIsoString(data.createdAt),
        };
      });
      rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onData(rows);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, 'userActivities')
  );
}

export function subscribeUserAchievements(uid: string, onData: (achievements: AchievementRecord[]) => void): Unsubscribe {
  const q = query(collection(db, 'achievements'), where('userId', '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      const rows: AchievementRecord[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          achievementId: data.achievementId,
          userId: data.userId,
          badgeType: data.badgeType,
          earnedAt: toIsoString(data.earnedAt),
        };
      });
      onData(rows);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, 'achievements')
  );
}

export function subscribeUserExchangeRequests(
  uid: string,
  onData: (incoming: ExchangeRequest[], outgoing: ExchangeRequest[]) => void
): Unsubscribe {
  let incomingList: ExchangeRequest[] = [];
  let outgoingList: ExchangeRequest[] = [];

  const mapDoc = (d: { data: () => Record<string, unknown> }): ExchangeRequest => {
    const data = d.data();
    return {
      requestId: String(data.requestId),
      listingId: String(data.listingId),
      listingTitle: String(data.listingTitle),
      senderId: String(data.senderId),
      senderName: String(data.senderName),
      receiverId: String(data.receiverId),
      receiverName: String(data.receiverName),
      message: String(data.message),
      status: data.status as ExchangeRequest['status'],
      createdAt: toIsoString(data.createdAt),
      updatedAt: toIsoString(data.updatedAt),
    };
  };

  const unsubIn = onSnapshot(
    query(collection(db, 'exchangeRequests'), where('receiverId', '==', uid)),
    (snap) => {
      incomingList = snap.docs.map(mapDoc).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onData(incomingList, outgoingList);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, 'exchangeRequests')
  );

  const unsubOut = onSnapshot(
    query(collection(db, 'exchangeRequests'), where('senderId', '==', uid)),
    (snap) => {
      outgoingList = snap.docs.map(mapDoc).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onData(incomingList, outgoingList);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, 'exchangeRequests')
  );

  return () => {
    unsubIn();
    unsubOut();
  };
}

export function subscribeRequestMessages(
  requestId: string,
  uid: string,
  role: 'sender' | 'receiver',
  onData: (messages: ExchangeMessage[]) => void
): Unsubscribe {
  const field = role === 'sender' ? 'senderId' : 'receiverId';
  const q = query(collection(db, 'exchangeRequests', requestId, 'messages'), where(field, '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      const rows: ExchangeMessage[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          messageId: data.messageId,
          requestId: data.requestId,
          senderId: data.senderId,
          receiverId: data.receiverId,
          authorId: data.authorId,
          authorName: data.authorName,
          body: data.body,
          createdAt: toIsoString(data.createdAt),
        };
      });
      rows.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      onData(rows);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, `exchangeRequests/${requestId}/messages`)
  );
}
