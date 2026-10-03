export const statuses = ['Pending', 'In Transit', 'Delivered'];
export const localDate = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export const emptyWorkspace = () => ({ deliveries: [], workers: [], entries: [], preferences: { company: 'SmartBox', dailyHours: 8 } });
export function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00`);
  return Number.isFinite(date.getTime()) && localDate(date) === value;
}

export function createDemoWorkspace(now = new Date()) {
  const today = localDate(now);
  const previous = new Date(now);
  previous.setDate(previous.getDate() - 1);
  const yesterday = localDate(previous);
  const workers = [
    { id: 'w1', name: 'Jordan Ellis', title: 'Driver', rate: 26 },
    { id: 'w2', name: 'Morgan Reed', title: 'Driver', rate: 25 },
    { id: 'w3', name: 'Taylor Brooks', title: 'Warehouse associate', rate: 22 },
    { id: 'w4', name: 'Casey Rivera', title: 'Crew lead', rate: 30 },
  ];
  const customers = ['Acme Foods', 'Northside Retail', 'Fulton Clinic', 'Peachtree Market', 'Oakwood Supply', 'Riverbend Cafe', 'Westside Hardware', 'Central Pharmacy', 'Pinecrest School', 'Summit Office', 'Eastgate Grocers', 'Harbor Medical'];
  const deliveries = customers.map((customer, i) => ({
    id: String(123 + i), customer,
    address: `${204 + i * 17} ${['Spring St', 'Lake Ave', 'Central Blvd', 'Peachtree Rd'][i % 4]}, Atlanta, GA`,
    status: i < 4 ? 'Pending' : i < 7 ? 'In Transit' : 'Delivered',
    workerId: workers[i % workers.length].id,
    scheduledDate: i < 10 ? today : yesterday,
    completedAt: i >= 7 ? `${i < 10 ? today : yesterday}T10:00:00` : null,
    notes: i === 2 ? 'Use the receiving entrance. Call on arrival.' : 'Confirm receipt with the receiving team.',
    escalated: i === 2 || i === 5,
    events: [{ at: now.toISOString(), text: 'Demo delivery created' }],
  }));
  const entries = workers.flatMap((worker, i) => [
    { id: `e${i}a`, workerId: worker.id, date: today, hours: 4 + i * 0.5, deliveryId: String(123 + i), notes: 'Morning dispatch and loading', rate: worker.rate },
    { id: `e${i}b`, workerId: worker.id, date: yesterday, hours: 7.5 + (i % 2) * 0.5, deliveryId: '', notes: 'Completed shift', rate: worker.rate },
  ]);
  return { deliveries, workers, entries, preferences: { company: 'SmartBox Demo', dailyHours: 8 } };
}

export function validateDelivery(delivery, workspace) {
  if (!delivery.customer?.trim() || !delivery.address?.trim()) throw new Error('Customer and address are required.');
  if (!validDate(delivery.scheduledDate)) throw new Error('Choose a valid scheduled date.');
  if (!statuses.includes(delivery.status)) throw new Error('Choose a valid status.');
  if (delivery.workerId && !workspace.workers.some(worker => worker.id === delivery.workerId)) throw new Error('Choose an existing crew member.');
  return delivery;
}

export function validateEntry(entry, workspace) {
  if (!workspace.workers.some(worker => worker.id === entry.workerId)) throw new Error('Choose a crew member.');
  if (!validDate(entry.date) || entry.date > localDate()) throw new Error('Choose today or an earlier work date.');
  if (!Number.isFinite(entry.hours) || entry.hours <= 0 || entry.hours > 24) throw new Error('Hours must be greater than zero and no more than 24.');
  if (entry.deliveryId && !workspace.deliveries.some(delivery => delivery.id === entry.deliveryId)) throw new Error('Choose an existing delivery.');
  const total = workspace.entries.filter(item => item.workerId === entry.workerId && item.date === entry.date && item.id !== entry.id).reduce((sum, item) => sum + item.hours, 0);
  if (total + entry.hours > 24) throw new Error('Total hours for one person in a day cannot exceed 24.');
  return entry;
}

export function summarize(workspace, today = localDate()) {
  const entries = workspace.entries.filter(entry => entry.date === today);
  return {
    open: workspace.deliveries.filter(item => item.status !== 'Delivered').length,
    completed: workspace.deliveries.filter(item => item.status === 'Delivered' && item.completedAt && localDate(new Date(item.completedAt)) === today).length,
    escalations: workspace.deliveries.filter(item => item.escalated && item.status !== 'Delivered').length,
    hours: entries.reduce((sum, entry) => sum + entry.hours, 0),
    cost: entries.reduce((sum, entry) => sum + entry.hours * entry.rate, 0),
  };
}

export function csv(rows) {
  return rows.map(row => row.map(value => {
    let text = String(value ?? '');
    if (/^[\s]*[=+\-@]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  }).join(',')).join('\r\n');
}

export function isWorkspace(value) {
  return Boolean(value && Array.isArray(value.workers) && Array.isArray(value.deliveries) && Array.isArray(value.entries) &&
    value.workers.every(item => item && typeof item.id === 'string' && typeof item.name === 'string' && typeof item.title === 'string' && Number.isFinite(item.rate) && item.rate > 0) &&
    value.deliveries.every(item => item && typeof item.id === 'string' && typeof item.customer === 'string' && typeof item.address === 'string' && typeof item.notes === 'string' && typeof item.escalated === 'boolean' && validDate(item.scheduledDate) && statuses.includes(item.status) && (!item.workerId || value.workers.some(worker => worker.id === item.workerId)) && (!item.completedAt || Number.isFinite(new Date(item.completedAt).getTime())) && Array.isArray(item.events) && item.events.every(event => typeof event?.text === 'string' && Number.isFinite(new Date(event.at).getTime()))) &&
    value.entries.every(item => item && typeof item.id === 'string' && validDate(item.date) && Number.isFinite(item.hours) && item.hours > 0 && item.hours <= 24 && Number.isFinite(item.rate) && item.rate > 0 && value.workers.some(worker => worker.id === item.workerId) && (!item.deliveryId || value.deliveries.some(delivery => delivery.id === item.deliveryId))) &&
    typeof value.preferences?.company === 'string' && Number.isFinite(value.preferences.dailyHours) && value.preferences.dailyHours > 0 && value.preferences.dailyHours <= 24);
}
