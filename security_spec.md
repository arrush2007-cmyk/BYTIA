# Security Specification: Before You Throw It Away

## 1. Data Invariants
1. **PII Isolation**: User emails and private profile settings in `/users/{userId}` may ONLY be read and written by `request.auth.uid == userId`. Leaderboard stats are isolated in `/publicProfiles/{userId}` with zero PII fields.
2. **Ownership & Identity Integrity**: Every created `scannedProducts`, `communityListings`, `userActivities`, and `achievements` document MUST have `userId == request.auth.uid`, and `userId` is immutable on update.
3. **Verified Email Mandate**: All client write operations require `request.auth != null && request.auth.token.email_verified == true`.
4. **Exchange Privacy & Relational Integrity**: An `exchangeRequests` document can only be created for an existing `communityListings` document, `senderId` must equal `request.auth.uid`, `senderId != receiverId`, `receiverId` must match the listing's `userId`, and only `senderId` or `receiverId` may read/list the request or its `/messages` subcollection.
5. **Terminal State Locking**: Once a `communityListings` status becomes `'exchanged'` or `'unavailable'`, non-terminal updates are blocked; once an `exchangeRequests` status becomes `'rejected'` or `'cancelled'`, its status cannot be mutated again.
6. **Temporal Integrity & Anti-Fraud**: `createdAt` and `updatedAt` timestamps must match `request.time`. `userActivities` and `achievements` are create-only and immutable after creation to prevent duplicate or fraudulent eco-point manipulation.
7. **Volumetric Limits**: Every string and array field is bounded in size, and all document IDs match `^[a-zA-Z0-9_-]+$` (`<= 128` chars).

## 2. "Dirty Dozen" Adversarial Payloads (Expected: PERMISSION_DENIED)
1. **Unverified Email Write**: Authenticated user with `email_verified: false` attempts to create `/scannedProducts/scan_1`.
2. **Cross-User Profile Read (PII Leak)**: User A attempts `get` on `/users/userB`.
3. **Ghost Field Shadow Write**: User A adds `isAdmin: true` when creating `/users/userA`.
4. **Identity Spoofing on Scan**: User A creates `/scannedProducts/scan_2` with `userId: "userB"`.
5. **Cross-User Scan History List**: User A lists `/scannedProducts` without filtering `userId == userA`.
6. **ID Poisoning**: User A writes `/communityListings/invalid$id*with!badchars` or 500-char ID.
7. **Self-Exchange Request**: Seller A creates `/exchangeRequests/req_1` with `senderId == receiverId == userA`.
8. **Orphaned Exchange Request**: User B creates `/exchangeRequests/req_2` referencing non-existent `listingId: "ghost_listing"`.
9. **Unauthorized Message Snooping**: User C attempts to read or write `/exchangeRequests/req_AB/messages/msg_1`.
10. **Terminal State Bypass**: Owner tries to change `/exchangeRequests/req_1` status from `'rejected'` back to `'accepted'`.
11. **Timestamp Forgery**: User A creates `/userActivities/act_1` with backdated `createdAt` instead of `request.time`.
12. **Activity Point Farming (Mutation)**: User A attempts `update` or `delete` on `/userActivities/act_1` to replay or inflate `ecoPoints`.
