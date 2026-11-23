import { emptyWorkspace, isWorkspace } from './workspace.js';

const groups = ['workers', 'deliveries', 'entries'];
const kinds = { workers: 'crew', deliveries: 'delivery', entries: 'hours' };
const idPattern = /^[\w-]{1,128}$/;

export function workspaceRecordKey(group, id) {
  if (!idPattern.test(id)) throw new Error('A saved record has an invalid ID. Download a backup before proceeding.');
  return `${kinds[group]}-${id}`;
}

export function sharedWorkspaceId(userId, teamId) {
  return typeof teamId === 'string' && idPattern.test(teamId) ? `team-${teamId}` : `account-${userId}`;
}

export function readSharedWorkspace(rows) {
  const data = emptyWorkspace();
  const records = new Map(rows);
  const revision = records.get('revision')?.value ?? 0;
  for (const [key, record] of records) {
    if (key === 'revision' || record.deleted) continue;
    const group = groups.find(item => kinds[item] === record.kind);
    if (!group || !record.data || workspaceRecordKey(group, record.data.id) !== key) {
      throw new Error('A shared record could not be read. Changes are blocked to protect your data.');
    }
    data[group].push(record.data);
  }
  const deletedDeliveries = new Set([...records.values()].filter(r => r.kind === 'delivery' && r.deleted).map(r => r.id));
  data.entries = data.entries.map(entry => deletedDeliveries.has(entry.deliveryId) ? { ...entry, deliveryId: '' } : entry);
  data.deliveries.sort((a, b) => (b.events[0]?.at || '').localeCompare(a.events[0]?.at || '') || a.id.localeCompare(b.id));
  data.workers.sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
  if (!isWorkspace(data)) throw new Error('Some shared records could not be validated. Changes are blocked to protect your data.');
  return { data, records, revision };
}

function fingerprintValue(value) {
  if (Array.isArray(value)) return value.map(fingerprintValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, fingerprintValue(value[key])]));
  }
  return value;
}

export function sameWorkspaceRecord(left, right) {
  return JSON.stringify(fingerprintValue(left)) === JSON.stringify(fingerprintValue(right));
}

async function importFingerprint(data) {
  const bytes = new TextEncoder().encode(JSON.stringify(fingerprintValue(data)));
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function planBrowserImport(snapshot, records) {
  if (!isWorkspace(snapshot)) throw new Error('The browser records could not be validated. Download a backup to recover them.');
  const additions = [];
  const seen = new Set();
  for (const group of groups) {
    for (const data of snapshot[group]) {
      const key = workspaceRecordKey(group, data.id);
      if (seen.has(key)) throw new Error('The browser has duplicate record IDs. Download a backup before importing.');
      seen.add(key);
      const previous = records.get(key);
      const origin = await importFingerprint(data);
      if (!previous) {
        const deletedDelivery = group === 'entries' && data.deliveryId && records.get(workspaceRecordKey('deliveries', data.deliveryId))?.deleted;
        additions.push([key, { kind: kinds[group], data: deletedDelivery ? { ...data, deliveryId: '' } : data, origin }]);
      }
      else if (previous.origin !== origin && (previous.deleted || !sameWorkspaceRecord(previous.data, data))) {
        throw new Error(`A browser ${kinds[group]} record conflicts with a shared record. No conflicting record was overwritten. Download your browser backup before resolving the conflict.`);
      }
    }
  }
  return additions;
}

export function* browserImportBatches(additions) {
  for (const kind of ['crew', 'delivery', 'hours']) {
    const rows = additions.filter(([, record]) => record.kind === kind);
    // Linked records need additional rule reads. Keep below Firestore's batch budget.
    const size = kind === 'crew' ? 150 : 7;
    for (let start = 0; start < rows.length; start += size) yield rows.slice(start, start + size);
  }
}

export function sharedRecordWrites(previous, next, records) {
  const writes = [];
  for (const group of groups) {
    const current = new Map(next[group].map(item => [item.id, item]));
    for (const item of previous[group]) {
      if (!current.has(item.id)) {
        const key = workspaceRecordKey(group, item.id);
        const { origin } = records.get(key) || {};
        writes.push([key, { kind: kinds[group], id: item.id, deleted: true, ...(origin ? { origin } : {}) }]);
      }
    }
    const before = new Map(previous[group].map(item => [item.id, item]));
    for (const data of next[group]) {
      if (sameWorkspaceRecord(before.get(data.id), data)) continue;
      const key = workspaceRecordKey(group, data.id);
      const prior = records.get(key);
      if (prior && !before.has(data.id)) throw new Error('That record ID is already in use. Try again.');
      writes.push([key, { kind: kinds[group], data, ...(prior?.origin ? { origin: prior.origin } : {}) }]);
    }
  }
  return writes;
}
