import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { DetailItem, PageShell, StatCard } from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { csv, localDate, statuses, summarize } from '../data/workspace';

const money = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
function StatusPill({ status }) { return <span className={`status-pill status-${status.toLowerCase().replace(/\s+/g, '-')}`}>{status}</span>; }
function Feedback({ error, message }) { return <div aria-live="polite">{error && <p role="alert" className="error-text">{error}</p>}{message && <p className="success-text">{message}</p>}</div>; }
function downloadCsv(filename, rows) {
  const url = URL.createObjectURL(new Blob(['\uFEFF', csv(rows)], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function DeliveryTable({ deliveries }) {
  return <div className="table"><div className="table-row table-header"><span>ID</span><span>Customer</span><span>Status</span><span>Destination</span></div>{deliveries.map(delivery => <Link className="table-row table-link" key={delivery.id} to={`/deliveries/${delivery.id}`}><span>#{delivery.id}</span><span>{delivery.customer}<small>{delivery.scheduledDate}</small></span><StatusPill status={delivery.status} /><span>{delivery.address}{delivery.escalated && <small className="error-text">Escalated</small>}</span></Link>)}{!deliveries.length && <p className="empty-state">No deliveries match this view.</p>}</div>;
}

export function DashboardPage() {
  const { role } = useAuth();
  const workspace = useWorkspace();
  const totals = summarize(workspace);
  return <PageShell title={`${role} Dashboard`} subtitle={`${workspace.preferences.company} · ${localDate()} · Dispatch and labor overview`} actions={role !== 'Guest' && <Link className="primary-link" to="/deliveries">Open deliveries</Link>}>
    <section className="hero-grid"><StatCard label="Open deliveries" value={totals.open} /><StatCard label="Completed today" value={totals.completed} /><StatCard label="Open escalations" value={totals.escalations} /></section>
    <section className="hero-grid"><StatCard label="Hours today" value={totals.hours.toFixed(1)} /><StatCard label="Labor cost today" value={money(totals.cost)} /><StatCard label="Crew members" value={workspace.workers.length} /></section>
    <section className="dashboard-grid"><article className="card panel feature-panel"><p className="section-kicker">Dispatch priorities</p><h2>{totals.escalations ? 'Resolve the flagged handoffs.' : 'Keep your crew and deliveries moving.'}</h2><div className="signal-list">{workspace.deliveries.filter(item => item.status !== 'Delivered').sort((a, b) => Number(b.escalated) - Number(a.escalated)).slice(0, 4).map(item => <div className="signal-item" key={item.id}><strong>{role === 'Guest' ? item.customer : <Link to={`/deliveries/${item.id}`}>{item.customer} →</Link>}</strong><p>{item.status} · {workspace.workers.find(worker => worker.id === item.workerId)?.name || 'Unassigned'}{item.escalated ? ' · Needs attention' : ''}</p></div>)}{!totals.open && <p>No open deliveries. Add a delivery to start dispatching.</p>}</div></article>
    <article className="card panel"><p className="section-kicker">Crew workload today</p><h2>Shift progress</h2><div className="signal-list">{workspace.workers.map(worker => { const hours = workspace.entries.filter(entry => entry.workerId === worker.id && entry.date === localDate()).reduce((sum, entry) => sum + entry.hours, 0); return <div className="signal-item" key={worker.id}><strong>{worker.name}</strong><p>{worker.title} · {hours.toFixed(1)} / {workspace.preferences.dailyHours} hours</p><progress aria-label={`${worker.name} shift progress`} value={Math.min(hours, workspace.preferences.dailyHours)} max={workspace.preferences.dailyHours} /></div>; })}{!workspace.workers.length && <p>Add your crew in Labor & Crew.</p>}</div></article></section>
  </PageShell>;
}

function DeliveryFields({ draft, setDraft, workers }) {
  const change = (key, value) => setDraft(previous => ({ ...previous, [key]: value }));
  return <>
    <label>Customer<input required maxLength={120} value={draft.customer} onChange={event => change('customer', event.target.value)} /></label>
    <label>Address<input required maxLength={240} value={draft.address} onChange={event => change('address', event.target.value)} /></label>
    <label>Scheduled date<input required type="date" value={draft.scheduledDate} onChange={event => change('scheduledDate', event.target.value)} /></label>
    <label>Assigned crew member<select value={draft.workerId} onChange={event => change('workerId', event.target.value)}><option value="">Unassigned</option>{workers.map(worker => <option key={worker.id} value={worker.id}>{worker.name}</option>)}</select></label>
    <label>Status<select value={draft.status} onChange={event => change('status', event.target.value)}>{statuses.map(status => <option key={status}>{status}</option>)}</select></label>
    <label>Notes<textarea maxLength={2000} value={draft.notes} onChange={event => change('notes', event.target.value)} /></label>
    <label className="check-label"><input type="checkbox" checked={draft.escalated} onChange={event => change('escalated', event.target.checked)} /> Needs attention</label>
  </>;
}

export function DeliveryListPage() {
  const workspace = useWorkspace();
  const navigateTo = useState(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState({ customer: '', address: '', status: 'Pending', workerId: '', scheduledDate: localDate(), notes: '', escalated: false });
  const deliveries = workspace.deliveries.filter(item => item.status !== 'Delivered' && (!status || item.status === status) && `${item.customer} ${item.id} ${item.address}`.toLowerCase().includes(query.toLowerCase()));
  return <PageShell title="Deliveries" subtitle="Create, assign, and update active deliveries." actions={<button className="primary-button" onClick={() => setShowForm(!showForm)}>{showForm ? 'Close form' : 'New delivery'}</button>}>
    {showForm && <section className="card panel"><h2>New delivery</h2><form className="form form-grid" onSubmit={event => { event.preventDefault(); setError(''); try { const id = workspace.addDelivery(draft); navigateTo[1](id); setShowForm(false); } catch (err) { setError(err.message); } }}><DeliveryFields draft={draft} setDraft={setDraft} workers={workspace.workers} /><Feedback error={error} /><button className="primary-button" type="submit">Create delivery</button></form></section>}
    {navigateTo[0] && <p role="status" className="success-text">Delivery created. <Link to={`/deliveries/${navigateTo[0]}`}>Open delivery #{navigateTo[0]} →</Link></p>}
    <section className="card panel"><div className="panel-header"><h2>Active board</h2><Link className="secondary-link" to="/deliveries/history">View history</Link></div><div className="filter-bar"><label>Search deliveries<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Customer, ID, or address" /></label><label>Status<select value={status} onChange={event => setStatus(event.target.value)}><option value="">All active statuses</option><option>Pending</option><option>In Transit</option></select></label><span className="panel-chip">{deliveries.length} routes</span></div><DeliveryTable deliveries={deliveries} /></section>
  </PageShell>;
}

export function DeliveryDetailPage() {
  const { id } = useParams();
  const workspace = useWorkspace();
  const delivery = workspace.deliveries.find(item => item.id === id);
  if (!delivery) return <PageShell title="Delivery not found" subtitle="This delivery may have been removed when the demo was reset."><Link className="primary-link" to="/deliveries">Back to deliveries</Link></PageShell>;
  return <DeliveryEditor key={id} delivery={delivery} />;
}
function DeliveryEditor({ delivery }) {
  const workspace = useWorkspace();
  const [draft, setDraft] = useState(delivery);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const hours = workspace.entries.filter(entry => entry.deliveryId === delivery.id).reduce((sum, entry) => sum + entry.hours, 0);
  return <PageShell title={`Delivery #${delivery.id}`} subtitle={`${delivery.customer} · ${delivery.address}`} actions={<Link className="secondary-link" to={delivery.status === 'Delivered' ? '/deliveries/history' : '/deliveries'}>Back to list</Link>}>
    <section className="detail-layout"><article className="card panel"><div className="delivery-hero"><h2>Delivery details</h2><StatusPill status={delivery.status} /></div><div className="progress-rail">{statuses.map((status, i) => <span key={status} className={i <= statuses.indexOf(delivery.status) ? 'is-complete' : ''}>{status}</span>)}</div><form className="form" onSubmit={event => { event.preventDefault(); setMessage(''); setError(''); try { workspace.updateDelivery(delivery.id, draft); setMessage('Delivery saved. Dashboard and history are updated.'); } catch (err) { setError(err.message); } }}><DeliveryFields draft={draft} setDraft={setDraft} workers={workspace.workers} /><Feedback error={error} message={message} /><button className="primary-button" type="submit">Save delivery</button></form></article>
    <article className="card panel"><h2>Work and activity</h2><DetailItem label="Assigned crew member" value={workspace.workers.find(worker => worker.id === delivery.workerId)?.name || 'Unassigned'} /><DetailItem label="Labor recorded" value={`${hours.toFixed(1)} hours`} /><DetailItem label="Completed" value={delivery.completedAt ? new Date(delivery.completedAt).toLocaleString() : 'Awaiting completion'} /><div className="signal-list activity-list">{[...delivery.events].reverse().map((event, index) => <div className="signal-item" key={index}><strong>{event.text}</strong><p>{new Date(event.at).toLocaleString()}</p></div>)}</div></article></section>
  </PageShell>;
}

export function DeliveryHistoryPage() {
  const { deliveries } = useWorkspace();
  const [query, setQuery] = useState('');
  const completed = deliveries.filter(item => item.status === 'Delivered' && `${item.customer} ${item.id} ${item.address}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''));
  return <PageShell title="Delivery History" subtitle="Completed deliveries, most recent first." actions={<button className="secondary-button" onClick={() => downloadCsv('delivery-history.csv', [['ID', 'Customer', 'Address', 'Completed'], ...completed.map(item => [item.id, item.customer, item.address, item.completedAt])])}>Export CSV</button>}><section className="card panel"><div className="filter-bar"><label>Search history<input type="search" value={query} onChange={event => setQuery(event.target.value)} /></label><span className="panel-chip">{completed.length} completed</span></div><DeliveryTable deliveries={completed} /></section></PageShell>;
}

export function LaborPage() {
  const workspace = useWorkspace();
  const { role } = useAuth();
  const [draft, setDraft] = useState({ workerId: '', date: localDate(), hours: '', deliveryId: '', notes: '' });
  const [worker, setWorker] = useState({ name: '', title: '', rate: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [workerFilter, setWorkerFilter] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const entries = workspace.entries.filter(entry => (!dateFilter || entry.date === dateFilter) && (!workerFilter || entry.workerId === workerFilter)).sort((a, b) => b.date.localeCompare(a.date));
  const hours = entries.reduce((sum, entry) => sum + entry.hours, 0);
  const cost = entries.reduce((sum, entry) => sum + entry.hours * entry.rate, 0);
  function perform(action, success) { setError(''); setMessage(''); try { action(); setMessage(success); } catch (err) { setError(err.message); } }
  const setField = (key, value) => setDraft(previous => ({ ...previous, [key]: value }));
  return <PageShell title="Labor & Crew" subtitle="Record work hours, assign jobs, and review labor costs." actions={<button className="secondary-button" onClick={() => downloadCsv('labor-hours.csv', [['Date', 'Crew member', 'Hours', 'Hourly rate', 'Cost', 'Delivery', 'Notes'], ...entries.map(entry => [entry.date, workspace.workers.find(item => item.id === entry.workerId)?.name || 'Unknown', entry.hours, entry.rate, entry.hours * entry.rate, entry.deliveryId, entry.notes])])}>Export hours CSV</button>}>
    <Feedback error={error} message={message} /><section className="hero-grid"><StatCard label="Filtered hours" value={hours.toFixed(1)} /><StatCard label="Filtered labor cost" value={money(cost)} /><StatCard label="Crew members" value={workspace.workers.length} /></section>
    <section className="detail-layout"><article className="card panel"><h2>Log work hours</h2><form className="form" onSubmit={event => { event.preventDefault(); perform(() => { workspace.addEntry({ ...draft, hours: Number(draft.hours) }); setDraft({ ...draft, hours: '', notes: '' }); }, 'Work hours saved.'); }}>
      <label>Crew member<select required value={draft.workerId} onChange={event => setField('workerId', event.target.value)}><option value="">Choose a crew member</option>{workspace.workers.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label>Work date<input required type="date" max={localDate()} value={draft.date} onChange={event => setField('date', event.target.value)} /></label>
      <label>Hours<input required type="number" min="0.25" max="24" step="0.25" value={draft.hours} onChange={event => setField('hours', event.target.value)} /></label>
      <label>Delivery (optional)<select value={draft.deliveryId} onChange={event => setField('deliveryId', event.target.value)}><option value="">General shift work</option>{workspace.deliveries.map(item => <option key={item.id} value={item.id}>#{item.id} · {item.customer}</option>)}</select></label>
      <label>Work notes<textarea value={draft.notes} maxLength={2000} onChange={event => setField('notes', event.target.value)} /></label><button className="primary-button" type="submit">Save hours</button></form></article>
    <article className="card panel"><h2>Crew roster</h2><div className="signal-list">{workspace.workers.map(item => <div className="signal-item" key={item.id}><strong>{item.name}</strong><p>{item.title} · {money(item.rate)}/hour</p></div>)}</div>{['Admin', 'Lead'].includes(role) && <form className="form activity-list" onSubmit={event => { event.preventDefault(); perform(() => { workspace.addWorker({ ...worker, rate: Number(worker.rate) }); setWorker({ name: '', title: '', rate: '' }); }, 'Crew member added.'); }}><h2>Add crew member</h2>{[['name', 'Name', 'text'], ['title', 'Job title', 'text'], ['rate', 'Hourly rate ($)', 'number']].map(([key, label, type]) => <label key={key}>{label}<input required type={type} min={type === 'number' ? '0.01' : undefined} step={type === 'number' ? '0.01' : undefined} maxLength={120} value={worker[key]} onChange={event => setWorker({ ...worker, [key]: event.target.value })} /></label>)}<button className="primary-button" type="submit">Add crew member</button></form>}</article></section>
    <section className="card panel"><h2>Timesheet</h2><div className="filter-bar"><label>Filter date<input type="date" value={dateFilter} onChange={event => setDateFilter(event.target.value)} /></label><label>Filter crew<select value={workerFilter} onChange={event => setWorkerFilter(event.target.value)}><option value="">All crew members</option>{workspace.workers.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><button className="secondary-button" onClick={() => { setDateFilter(''); setWorkerFilter(''); }}>Clear filters</button></div><div className="signal-list">{entries.map(entry => <div className="timesheet-row signal-item" key={entry.id}><div><strong>{workspace.workers.find(item => item.id === entry.workerId)?.name}</strong><p>{entry.date} · {entry.hours} hours · {money(entry.hours * entry.rate)}{entry.deliveryId && <> · <Link to={`/deliveries/${entry.deliveryId}`}>Delivery #{entry.deliveryId}</Link></>}</p><p>{entry.notes}</p></div>{deleteId === entry.id ? <div className="toolbar"><button className="secondary-button" onClick={() => { perform(() => workspace.removeEntry(entry.id), 'Entry removed.'); setDeleteId(null); }}>Confirm removal</button><button className="secondary-button" onClick={() => setDeleteId(null)}>Cancel</button></div> : <button className="secondary-button" onClick={() => setDeleteId(entry.id)}>Remove entry</button>}</div>)}{!entries.length && <p className="empty-state">No work hours match these filters.</p>}</div></section>
  </PageShell>;
}

export function SettingsPage() {
  const workspace = useWorkspace();
  const { role, isDemo, signInDemo } = useAuth();
  const [draft, setDraft] = useState(workspace.preferences);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  return <PageShell title="Settings" subtitle="Workspace preferences and demonstration controls."><section className="detail-layout"><article className="card panel"><h2>Workspace preferences</h2><form className="form" onSubmit={event => { event.preventDefault(); setError(''); setMessage(''); try { workspace.savePreferences({ ...draft, dailyHours: Number(draft.dailyHours) }); setMessage('Preferences saved.'); } catch (err) { setError(err.message); } }}><label>Company name<input required maxLength={120} value={draft.company} onChange={event => setDraft({ ...draft, company: event.target.value })} /></label><label>Daily shift target (hours)<input required type="number" min="0.25" max="24" step="0.25" value={draft.dailyHours} onChange={event => setDraft({ ...draft, dailyHours: event.target.value })} /></label><Feedback error={error} message={message} /><button className="primary-button" type="submit">Save preferences</button></form></article><article className="card panel"><h2>{isDemo ? 'Demo controls' : 'Workspace storage'}</h2><p>Work records are saved in this browser for this workspace. Use CSV exports to keep a copy. Shared cloud operations are not configured.</p>{isDemo && <div className="form"><label>Demo role<select value={role} onChange={event => { try { signInDemo(event.target.value); } catch (err) { setError(err.message); } }}><option>Admin</option><option>Lead</option><option>User</option></select></label><p>Switch roles to demonstrate crew management and operator access.</p>{confirmReset ? <><p>Replace all demo edits with a fresh sample dataset?</p><button className="primary-button" onClick={() => { try { workspace.resetDemo(); setDraft({ company: 'SmartBox Demo', dailyHours: 8 }); setConfirmReset(false); setMessage('Demo data reset.'); setError(''); } catch (err) { setError(err.message); } }}>Confirm reset</button><button className="secondary-button" onClick={() => setConfirmReset(false)}>Cancel</button></> : <button className="secondary-button" onClick={() => setConfirmReset(true)}>Reset demo data</button>}</div>}</article></section></PageShell>;
}

export function ProfilePage() {
  const { user, role, isDemo } = useAuth();
  return <PageShell title="Profile" subtitle="Current session and workspace access."><section className="card detail-grid"><DetailItem label="Email" value={user?.email || 'Guest session'} /><DetailItem label="Role" value={role} /><DetailItem label="User ID" value={user?.uid || 'Unavailable'} /><DetailItem label="Session" value={isDemo ? 'Local demo workspace' : user?.isAnonymous ? 'Read-only guest' : 'Firebase account'} /><DetailItem label="Access" value={role === 'Guest' ? 'Dashboard and profile' : ['Admin', 'Lead'].includes(role) ? 'Dispatch, labor entries, crew management, and settings' : 'Dispatch, labor entries, and settings'} /></section></PageShell>;
}
export function NotFoundPage() {
  const { isAuthenticated } = useAuth();
  return <div className="centered-page gradient-page"><div className="card auth-card"><p className="eyebrow">404</p><h2>Page not found</h2><Link className="primary-link" to={isAuthenticated ? '/dashboard' : '/'}>Return to {isAuthenticated ? 'dashboard' : 'sign in'}</Link></div></div>;
}
