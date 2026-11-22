import { createHash } from 'node:crypto';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

initializeApp();
const db = getFirestore();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_LOOKUPS = 8;

function normalizeOrderNumber(value) {
  return value.normalize('NFKC').trim().replace(/\s+/g, '').toUpperCase();
}

function normalizeRecipientName(value) {
  return value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
}

export const lookupGuestOrder = onCall({ region: 'us-central1', maxInstances: 10 }, async request => {
  const recipientName = typeof request.data?.recipientName === 'string' ? request.data.recipientName.trim() : '';
  const orderNumber = typeof request.data?.orderNumber === 'string' ? request.data.orderNumber.trim() : '';
  if (recipientName.length < 2 || recipientName.length > 120 || orderNumber.length < 3 || orderNumber.length > 80) {
    throw new HttpsError('invalid-argument', 'Enter a valid recipient name and order number.');
  }

  const ip = request.rawRequest.ip || 'unknown';
  const limiterId = createHash('sha256').update(ip).digest('hex');
  const limiter = db.doc(`guestLookupLimits/${limiterId}`);
  const now = Date.now();
  await db.runTransaction(async transaction => {
    const snapshot = await transaction.get(limiter);
    const stored = snapshot.exists ? snapshot.data() : {};
    const startedAt = stored.startedAt?.toMillis?.() || 0;
    const count = now - startedAt < WINDOW_MS ? (stored.count || 0) : 0;
    if (count >= MAX_LOOKUPS) throw new HttpsError('resource-exhausted', 'Too many lookup attempts. Try again later.');
    transaction.set(limiter, { startedAt: count ? stored.startedAt : Timestamp.fromMillis(now), count: count + 1 });
  });

  const orderKey = normalizeOrderNumber(orderNumber);
  const recipientKey = normalizeRecipientName(recipientName);
  const matches = await db.collection('customerTracking').where('orderNumberNormalized', '==', orderKey).get();
  const matchedOrders = matches.docs.filter(item => item.data().recipientNameNormalized === recipientKey);
  const match = matchedOrders.length === 1 ? matchedOrders[0] : null;
  if (!match) {
    throw new HttpsError('not-found', 'We could not find that delivery.');
  }

  const data = match.data();
  const events = await match.ref.collection('events').orderBy('at', 'desc').limit(8).get();
  return {
    orderNumber: data.orderNumber,
    orderDescription: data.orderDescription || '',
    address: data.address,
    scheduledDate: data.scheduledDate,
    status: data.status,
    events: events.docs.map(event => ({ status: event.data().status, at: event.data().at?.toDate?.().toISOString() || null })),
  };
});
