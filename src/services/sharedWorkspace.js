import { collection, doc, onSnapshot, runTransaction, serverTimestamp } from 'firebase/firestore';
import { readSharedWorkspace } from '../data/sharedWorkspace.js';

function workspaceRecords(db, workspaceId) {
  return collection(db, 'sharedWorkspaces', workspaceId, 'records');
}

export function subscribeToWorkspace(db, workspaceId, onData, onError) {
  return onSnapshot(workspaceRecords(db, workspaceId), { includeMetadataChanges: true }, snapshot => {
    if (snapshot.metadata.hasPendingWrites || snapshot.metadata.fromCache) {
      onData(null);
      return;
    }
    try {
      onData(readSharedWorkspace(snapshot.docs.map(row => [row.id, row.data()])));
    } catch (error) { onError(error); }
  }, onError);
}

export async function writeWorkspaceRecords(db, workspaceId, expectedRevision, writes, trackingId = '') {
  if (!writes.length) return expectedRevision;
  const records = workspaceRecords(db, workspaceId);
  const revision = doc(records, 'revision');
  return runTransaction(db, async transaction => {
    const previous = await transaction.get(revision);
    const current = previous.data()?.value ?? 0;
    if (current !== expectedRevision) throw new Error('The workspace changed on another device. Review the latest records and try again.');
    for (const [key, data] of writes) transaction.set(doc(records, key), data);
    if (trackingId) transaction.delete(doc(db, 'customerTracking', trackingId));
    transaction.set(revision, { value: current + 1, updatedAt: serverTimestamp() });
    return current + 1;
  });
}
