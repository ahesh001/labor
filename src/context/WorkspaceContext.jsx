import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { createDemoWorkspace, emptyWorkspace, isWorkspace, validateDelivery, validateEntry } from '../data/workspace';
import { applyOptionalCollectionPreferences } from '../services/optionalCollection';
import { browserImportBatches, planBrowserImport, readSharedWorkspace, sameWorkspaceRecord, sharedRecordWrites, sharedWorkspaceId } from '../data/sharedWorkspace';
import { subscribeToWorkspace, writeWorkspaceRecords } from '../services/sharedWorkspace';
import { db } from '../../firebaseConfig';

const WorkspaceContext = createContext(null);

export function WorkspaceProvider({ children }) {
  const { user, isDemo, role, workspaceId } = useAuth();
  const signedIn = user && !isDemo && !user.isAnonymous && !['User', 'Guest'].includes(role);
  const cloudId = signedIn ? sharedWorkspaceId(user.uid, workspaceId) : '';
  const scope = isDemo ? 'demo' : user?.uid || 'guest';
  return <WorkspaceSession key={`${scope}:${cloudId}`} storageKey={`laborTracker.workspace.${scope}.v1`} seeded={isDemo || Boolean(user?.isAnonymous)} cloudId={cloudId}>{children}</WorkspaceSession>;
}

function readBrowser(storageKey, seeded) {
  try {
    const raw = localStorage.getItem(storageKey);
    const data = raw ? JSON.parse(raw) : seeded ? createDemoWorkspace() : emptyWorkspace();
    return { raw, data: isWorkspace(data) ? data : null };
  } catch {
    // Keep any unreadable copy in its original browser key.
    try { return { raw: localStorage.getItem(storageKey), data: null }; }
    catch { return { raw: null, data: null }; }
  }
}

function readableWriteError(error) {
  if (error.code === 'permission-denied') return new Error('This account could not save the shared records. Check workspace access and try again.');
  if (['unavailable', 'deadline-exceeded', 'failed-precondition'].includes(error.code)) return new Error('Shared storage is unavailable. Check your connection and try again.');
  return error;
}

function WorkspaceSession({ children, storageKey, seeded, cloudId }) {
  const { role, hasPermission } = useAuth();
  const [storageError, setStorageError] = useState('');
  const [legacy] = useState(() => readBrowser(storageKey, seeded));
  const [data, setData] = useState(legacy.data);
  const [fallback] = useState(() => seeded ? createDemoWorkspace() : emptyWorkspace());
  const [remote, setRemote] = useState(null);
  const remoteRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [retry, setRetry] = useState(0);
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const preferenceKey = `${storageKey}.preferences`;
  const importKey = `${storageKey}.imported.${cloudId}`;
  const [imported, setImported] = useState(false);
  const [fingerprint, setFingerprint] = useState('');
  const [preferences, setPreferences] = useState(() => {
    const defaults = legacy.data?.preferences || fallback.preferences;
    try {
      const saved = JSON.parse(localStorage.getItem(preferenceKey) || 'null');
      return saved && isWorkspace({ ...emptyWorkspace(), preferences: saved }) ? saved : defaults;
    } catch { return defaults; }
  });
  const browserCounts = legacy.data && [legacy.data.workers.length, legacy.data.deliveries.length, legacy.data.entries.length];
  const hasBrowserRecords = Boolean(browserCounts?.some(count => count > 0));
  const workspace = cloudId ? { ...(remote?.data || fallback), preferences } : data || fallback;

  function acceptRemote(value) {
    if (remoteRef.current && value.revision < remoteRef.current.revision) return;
    remoteRef.current = value;
    setRemote(value);
  }
  useEffect(() => {
    if (!cloudId) return undefined;
    return subscribeToWorkspace(db, cloudId, value => {
      if (!value) { setConnected(false); return; }
      acceptRemote(value);
      setConnected(true);
      setStorageError('');
    }, () => {
      setConnected(false);
      setStorageError('Shared workspace records are unavailable. Check your account access and connection, then retry in Settings.');
    });
  }, [cloudId, retry]);

  useEffect(() => {
    if (!cloudId || !legacy.raw) return undefined;
    let active = true;
    crypto.subtle.digest('SHA-256', new TextEncoder().encode(legacy.raw)).then(buffer => {
      if (!active) return;
      const digest = Array.from(new Uint8Array(buffer), byte => byte.toString(16).padStart(2, '0')).join('');
      setFingerprint(digest);
      try { setImported(localStorage.getItem(importKey) === digest); }
      catch { /* Import still works when the marker cannot be read. */ }
    }).catch(() => {});
    return () => { active = false; };
  }, [cloudId, importKey, legacy.raw]);
  useEffect(() => {
    void applyOptionalCollectionPreferences(workspace.preferences);
  }, [workspace.preferences.analyticsCookies, workspace.preferences.performanceInfo]);
  function commit(next, recover = false) {
    if (role === 'Guest' || role === 'User') throw new Error('Customer and guest workspaces are read-only.');
    if (!data && !recover) throw new Error('Saved data could not be read. Changes are blocked to protect the original records.');
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      setStorageError('Changes could not be saved. Check browser storage permissions or available space and try again.');
      throw new Error('Changes could not be saved to this browser.');
    }
    setStorageError('');
    setData(next);
  }

  async function exclusive(operation) {
    if (!connected || !remoteRef.current) throw new Error('Connect to the shared workspace before saving.');
    if (busy.current) throw new Error('A workspace change is already being saved.');
    busy.current = true;
    setSaving(true);
    try { return await operation(); }
    catch (error) { throw readableWriteError(error); }
    finally { busy.current = false; setSaving(false); }
  }

  async function change(operation, trackingId = '') {
    if (!cloudId) {
      const { next, result } = operation(workspace);
      commit(next);
      return result;
    }
    return exclusive(async () => {
      const current = remoteRef.current;
      const { next, result } = operation(current.data);
      const writes = sharedRecordWrites(current.data, next, current.records);
      const revision = await writeWorkspaceRecords(db, cloudId, current.revision, writes, trackingId);
      const records = new Map([...current.records, ...writes, ['revision', { value: revision }]]);
      acceptRemote(readSharedWorkspace(records));
      return result;
    });
  }

  function downloadBrowserBackup() {
    if (!legacy.raw) return;
    const url = URL.createObjectURL(new Blob([legacy.raw], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'labortracker-browser-workspace-backup.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function importBrowserRecords() {
    return exclusive(async () => {
      if (!hasBrowserRecords || !fingerprint) throw new Error('No readable browser records are available for import.');
      if (localStorage.getItem(storageKey) !== legacy.raw) throw new Error('Browser records changed. Reload the page before importing.');
      const current = remoteRef.current;
      const additions = await planBrowserImport(legacy.data, current.records);
      let revision = current.revision;
      const records = new Map(current.records);
      for (const chunk of browserImportBatches(additions)) {
        revision = await writeWorkspaceRecords(db, cloudId, revision, chunk);
        for (const [key, record] of chunk) records.set(key, record);
        records.set('revision', { value: revision });
        acceptRemote(readSharedWorkspace(records));
      }
      if (localStorage.getItem(storageKey) !== legacy.raw) throw new Error('Browser records changed during import. Reload to review the updated backup.');
      try { localStorage.setItem(importKey, fingerprint); } catch { /* The cloud has already confirmed the import. */ }
      setImported(true);
      return additions.length;
    });
  }

  const value = {
    ...workspace,
    cloudId, connected, saving, cloudLoading: Boolean(cloudId && !remote && !storageError),
    browserCounts, hasBrowserRecords, hasBrowserBackup: Boolean(legacy.raw), imported,
    canImport: Boolean(hasBrowserRecords && fingerprint && hasPermission('users:create') && hasPermission('orders:create') && hasPermission('labor:update')),
    retryStorage() { setStorageError(''); setRetry(number => number + 1); },
    importBrowserRecords, downloadBrowserBackup,
    storageError: storageError || (!(cloudId ? legacy.data : data) ? 'The original browser records could not be read. Keep a backup before attempting recovery.' : ''),
    addDelivery: input => change(current => {
      validateDelivery(input, current);
      const now = new Date().toISOString();
      const uuid = crypto.randomUUID();
      const item = { ...input, customer: input.customer.trim(), address: input.address.trim(), id: cloudId ? uuid : uuid.slice(0, 8), completedAt: input.status === 'Delivered' ? now : null, events: [{ at: now, text: 'Delivery created' }] };
      return { next: { ...current, deliveries: [item, ...current.deliveries] }, result: item.id };
    }),
    updateDelivery: (id, changes, base) => change(current => {
      const previous = current.deliveries.find(item => item.id === id);
      if (!previous) throw new Error('Delivery no longer exists.');
      if (cloudId && base && !sameWorkspaceRecord(base, previous)) throw new Error('This delivery changed on another device. Reload the saved delivery before editing again.');
      const now = new Date().toISOString();
      const item = { ...previous, ...changes, id: previous.id };
      validateDelivery(item, current);
      item.completedAt = item.status === 'Delivered' ? previous.completedAt || now : null;
      item.events = [...previous.events, { at: now, text: `Saved: ${item.status}${item.escalated ? ' · Escalated' : ''}` }];
      return { next: { ...current, deliveries: current.deliveries.map(delivery => delivery.id === id ? item : delivery) }, result: item };
    }),
    removeDelivery: id => change(current => {
      if (!hasPermission('orders:cancel')) throw new Error('You do not have access to delete deliveries.');
      if (!current.deliveries.some(item => item.id === id)) throw new Error('Delivery no longer exists.');
      const entries = cloudId ? current.entries : current.entries.map(entry => {
        if (entry.deliveryId !== id) return entry;
        const { deliveryId, ...unlinkedEntry } = entry;
        return unlinkedEntry;
      });
      return { next: { ...current, deliveries: current.deliveries.filter(item => item.id !== id), entries } };
    }, cloudId ? id : ''),
    addEntry: input => change(current => {
      validateEntry(input, current);
      const worker = current.workers.find(item => item.id === input.workerId);
      return { next: { ...current, entries: [{ ...input, rate: worker.rate, id: crypto.randomUUID() }, ...current.entries] } };
    }),
    removeEntry: id => change(current => ({ next: { ...current, entries: current.entries.filter(item => item.id !== id) } })),
    addWorker: input => change(current => {
      if (!hasPermission('users:create')) throw new Error('Crew management is not available for this account.');
      if (!input.name.trim() || !input.title.trim() || !Number.isFinite(input.rate) || input.rate <= 0) throw new Error('Name, job title, and a positive hourly rate are required.');
      return { next: { ...current, workers: [...current.workers, { ...input, name: input.name.trim(), title: input.title.trim(), id: crypto.randomUUID() }] } };
    }),
    savePreferences(input) {
      if (!input.company.trim() || !Number.isFinite(input.dailyHours) || input.dailyHours <= 0 || input.dailyHours > 24) throw new Error('Company and a daily target between 0 and 24 hours are required.');
      const next = { ...input, company: input.company.trim() };
      if (!cloudId) { commit({ ...workspace, preferences: next }); return; }
      try { localStorage.setItem(preferenceKey, JSON.stringify(next)); }
      catch { throw new Error('Preferences could not be saved to this browser.'); }
      setPreferences(next);
    },
    resetDemo() { if (!seeded) throw new Error('Reset is only available in demo mode.'); commit(createDemoWorkspace(), true); },
  };
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export const useWorkspace = () => useContext(WorkspaceContext);
