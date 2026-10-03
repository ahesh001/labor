import { createContext, useContext, useState } from 'react';
import { useAuth } from './AuthContext';
import { createDemoWorkspace, emptyWorkspace, isWorkspace, validateDelivery, validateEntry } from '../data/workspace';

const WorkspaceContext = createContext(null);

export function WorkspaceProvider({ children }) {
  const { user, isDemo } = useAuth();
  return <WorkspaceSession key={isDemo ? 'demo' : user?.uid || 'guest'} storageKey={isDemo ? 'laborTracker.workspace.demo.v1' : `laborTracker.workspace.${user?.uid || 'guest'}.v1`} seeded={isDemo || Boolean(user?.isAnonymous)}>{children}</WorkspaceSession>;
}

function WorkspaceSession({ children, storageKey, seeded }) {
  const { role } = useAuth();
  const [storageError, setStorageError] = useState('');
  const [data, setData] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const saved = JSON.parse(raw);
        if (!isWorkspace(saved)) throw new Error('Invalid saved data');
        return saved;
      }
    } catch {
      // Preserve the original value until the user explicitly saves or resets.
      return null;
    }
    return seeded ? createDemoWorkspace() : emptyWorkspace();
  });
  const [fallback] = useState(() => seeded ? createDemoWorkspace() : emptyWorkspace());
  const workspace = data || fallback;
  function commit(next) {
    if (role === 'Guest') throw new Error('Guest workspaces are read-only.');
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      setStorageError('Changes could not be saved. Check browser storage permissions or available space and try again.');
      throw new Error('Changes could not be saved to this browser.');
    }
    setStorageError('');
    setData(next);
  }
  const value = {
    ...workspace,
    storageError: storageError || (!data ? 'Saved data could not be read. A temporary workspace is shown; reset demo data to recover.' : ''),
    addDelivery(input) {
      validateDelivery(input, workspace);
      const now = new Date().toISOString();
      const item = { ...input, customer: input.customer.trim(), address: input.address.trim(), id: crypto.randomUUID().slice(0, 8), completedAt: input.status === 'Delivered' ? now : null, events: [{ at: now, text: 'Delivery created' }] };
      commit({ ...workspace, deliveries: [item, ...workspace.deliveries] });
      return item.id;
    },
    updateDelivery(id, changes) {
      const previous = workspace.deliveries.find(item => item.id === id);
      if (!previous) throw new Error('Delivery no longer exists.');
      const now = new Date().toISOString();
      const item = { ...previous, ...changes, id: previous.id };
      validateDelivery(item, workspace);
      item.completedAt = item.status === 'Delivered' ? previous.completedAt || now : null;
      item.events = [...previous.events, { at: now, text: `Saved: ${item.status}${item.escalated ? ' · Escalated' : ''}` }];
      commit({ ...workspace, deliveries: workspace.deliveries.map(delivery => delivery.id === id ? item : delivery) });
    },
    addEntry(input) {
      validateEntry(input, workspace);
      const worker = workspace.workers.find(item => item.id === input.workerId);
      commit({ ...workspace, entries: [{ ...input, rate: worker.rate, id: crypto.randomUUID() }, ...workspace.entries] });
    },
    removeEntry(id) { commit({ ...workspace, entries: workspace.entries.filter(item => item.id !== id) }); },
    addWorker(input) {
      if (!['Admin', 'Lead'].includes(role)) throw new Error('Crew management requires an Admin or Lead role.');
      if (!input.name.trim() || !input.title.trim() || !Number.isFinite(input.rate) || input.rate <= 0) throw new Error('Name, job title, and a positive hourly rate are required.');
      commit({ ...workspace, workers: [...workspace.workers, { ...input, name: input.name.trim(), title: input.title.trim(), id: crypto.randomUUID() }] });
    },
    savePreferences(input) {
      if (!input.company.trim() || !Number.isFinite(input.dailyHours) || input.dailyHours <= 0 || input.dailyHours > 24) throw new Error('Company and a daily target between 0 and 24 hours are required.');
      commit({ ...workspace, preferences: { ...input, company: input.company.trim() } });
    },
    resetDemo() { if (!seeded) throw new Error('Reset is only available in demo mode.'); commit(createDemoWorkspace()); },
  };
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export const useWorkspace = () => useContext(WorkspaceContext);
