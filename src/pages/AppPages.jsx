import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { DetailItem, PageShell, StatCard } from '../components/AppShell';
import { deleteCustomerTracking, PublishTracking, TrackingTimeline, useCustomerTracking } from '../components/CloudTracking';
import HeshwareUpdates from '../components/HeshwareUpdates';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { csv, localDate, statuses, summarize } from '../data/workspace';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../../firebaseConfig';

const money = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
const publicOrderFunctions = getFunctions(app);
function StatusPill({ status }) { return <span className={`status-pill status-${status.toLowerCase().replace(/\s+/g, '-')}`}>{status}</span>; }
function ShiftProgressItem({ worker, hours, dailyHours, canOpen }) {
  const content = <><strong>{worker.name}</strong><p>{worker.title} · {hours.toFixed(1)} / {dailyHours} hours</p><progress aria-label={`${worker.name} shift progress`} value={Math.min(hours, dailyHours)} max={dailyHours} /></>;
  return canOpen
    ? <Link className="signal-item employee-progress-link" to={`/labor/crew/${worker.id}`} target="_blank" rel="noreferrer" aria-label={`Open ${worker.name} employee details in a new tab`}>{content}</Link>
    : <div className="signal-item">{content}</div>;
}
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
  const { role, hasPermission } = useAuth();
  const workspace = useWorkspace();
  if (role === 'Guest') return <GuestOrderLookupPage />;
  if (role === 'User') return <CustomerDashboard />;
  const totals = summarize(workspace);
  return <PageShell title={`${role} Dashboard`} subtitle={`${workspace.preferences.company} · ${localDate()} · Dispatch and labor overview`} actions={role !== 'Guest' && <Link className="primary-link" to="/deliveries">Open deliveries</Link>}>
    <section className="hero-grid"><StatCard label="Open deliveries" value={totals.open} /><StatCard label="Completed today" value={totals.completed} /><StatCard label="Open escalations" value={totals.escalations} /></section>
    <section className="hero-grid"><StatCard label="Hours today" value={totals.hours.toFixed(1)} /><StatCard label="Labor cost today" value={money(totals.cost)} /><StatCard label="Crew members" value={workspace.workers.length} /></section>
    <section className="dashboard-grid"><article className="card panel feature-panel"><p className="section-kicker">Dispatch priorities</p><h2>{totals.escalations ? 'Resolve the flagged handoffs.' : 'Keep your crew and deliveries moving.'}</h2><div className="signal-list">{workspace.deliveries.filter(item => item.status !== 'Delivered').sort((a, b) => Number(b.escalated) - Number(a.escalated)).slice(0, 4).map(item => <div className="signal-item" key={item.id}><strong>{role === 'Guest' ? item.customer : <Link to={`/deliveries/${item.id}`}>{item.customer} →</Link>}</strong><p>{item.status} · {workspace.workers.find(worker => worker.id === item.workerId)?.name || 'Unassigned'}{item.escalated ? ' · Needs attention' : ''}</p></div>)}{!totals.open && <p>No open deliveries. Add a delivery to start dispatching.</p>}</div></article>
    <article className="card panel"><p className="section-kicker">Crew workload today</p><h2>Shift progress</h2><div className="signal-list">{workspace.workers.map(worker => { const hours = workspace.entries.filter(entry => entry.workerId === worker.id && entry.date === localDate()).reduce((sum, entry) => sum + entry.hours, 0); return <ShiftProgressItem key={worker.id} worker={worker} hours={hours} dailyHours={workspace.preferences.dailyHours} canOpen={hasPermission('users:read') && hasPermission('labor:read')} />; })}{!workspace.workers.length && <p>Add your crew in Labor & Crew.</p>}</div></article></section>
    {workspace.preferences.heshwareAds && <HeshwareUpdates />}
  </PageShell>;
}

export function GuestOrderLookupPage() {
  const [name, setName] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [delivery, setDelivery] = useState(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  async function lookup(event) {
    event.preventDefault(); setError(''); setDelivery(null); setPending(true);
    try {
      const lookupOrder = httpsCallable(publicOrderFunctions, 'lookupGuestOrder');
      const response = await lookupOrder({ recipientName: name.trim(), orderNumber: orderNumber.trim() });
      setDelivery(response.data);
    } catch (cause) {
      setError(cause.code === 'functions/resource-exhausted'
        ? 'Too many lookup attempts. Please wait a little while and try again.'
        : cause.code === 'functions/unavailable'
          ? 'Order tracking is temporarily unavailable. Please try again later.'
          : 'We could not find a delivery matching that name and order number. Check both and try again.');
    } finally { setPending(false); }
  }
  const expectedText = delivery?.scheduledDate ? new Date(`${delivery.scheduledDate}T12:00:00`).toLocaleDateString(undefined, { dateStyle: 'long' }) : '';
  return <main className="guest-lookup-page">
    <a className="skip-link" href="#order-lookup">Skip to order lookup</a>
    <section className="guest-lookup-card card panel" aria-labelledby="guest-lookup-title">
      <p className="eyebrow">LaborTracker delivery lookup</p>
      <h1 id="guest-lookup-title">Track your order</h1>
      <p>Enter the recipient name and order number provided with your order to see its delivery status and scheduled date.</p>
      <form className="form" id="order-lookup" onSubmit={lookup}>
        <label>Recipient name<input required autoComplete="name" maxLength={120} value={name} onChange={event => setName(event.target.value)} /></label>
        <label>Order number<input required autoComplete="off" maxLength={80} value={orderNumber} onChange={event => setOrderNumber(event.target.value)} /></label>
        {error && <p className="error-text" role="alert">{error}</p>}
        <button className="primary-button" type="submit" disabled={pending} aria-busy={pending}>{pending ? 'Looking up order…' : 'Find my delivery'}</button>
      </form>
      {delivery && <article className="guest-order-result" aria-live="polite" aria-labelledby="guest-order-result-title">
        <div className="panel-header"><h2 id="guest-order-result-title">Delivery details</h2><StatusPill status={delivery.status} /></div>
        <DetailItem label="Order" value={delivery.orderNumber} />
        <DetailItem label="Order description" value={delivery.orderDescription || 'Order details are not available.'} />
        <DetailItem label="Destination" value={delivery.address} />
        <DetailItem label="Scheduled for" value={expectedText} />
        <p>{delivery.status === 'Delivered' ? 'This order has been delivered.' : delivery.status === 'In Transit' ? 'This order is on its way. The scheduled delivery date is shown above.' : 'This order is awaiting dispatch. The scheduled delivery date is shown above.'}</p>
        <p className="form-caption">A live arrival time is not available for this order.</p>
        {delivery.events?.length > 0 && <section><h3>Recent updates</h3><ol>{delivery.events.map((event, index) => <li key={`${event.status}-${index}`}><strong>{event.status}</strong>{event.at ? ` · ${new Date(event.at).toLocaleString()}` : ''}</li>)}</ol></section>}
      </article>}
      <p className="guest-lookup-return"><Link to="/">Back to sign in</Link></p>
    </section>
  </main>;
}

function CustomerDashboard() {
  const { user, isDemo, signInDemo } = useAuth();
  const { deliveries } = useWorkspace();
  const tracking = useCustomerTracking(user?.uid, !isDemo);
  const ownDeliveries = isDemo ? deliveries.filter(item => item.customer === 'Acme Foods') : tracking.deliveries;
  return <PageShell title="My deliveries" subtitle="Follow the status of your deliveries.">
    {isDemo && <label>Demo view<select value="User" onChange={event => signInDemo(event.target.value)}><option>User</option><option>Admin</option><option>Lead</option></select></label>}
    {!isDemo && tracking.loading && <p>Loading your deliveries…</p>}{!isDemo && tracking.error && <p role="alert">{tracking.error}</p>}{!isDemo && tracking.cached && <p>Showing cached tracking. Waiting for a live connection.</p>}{!tracking.loading && !tracking.error && ownDeliveries.length === 0 && <section className="card panel"><h2>No deliveries linked yet</h2><p>Your deliveries will appear here when they are assigned to your account.</p></section>}
    {ownDeliveries.map(item => <article className="card panel" key={item.id}>
      <div className="panel-header"><h2>Delivery #{item.id}</h2><StatusPill status={item.status} /></div>
      <DetailItem label="Destination" value={item.address} />
      <DetailItem label="Scheduled date" value={item.scheduledDate} />
      <div className="progress-rail">{statuses.map((status, index) => <span key={status} className={index <= statuses.indexOf(item.status) ? 'is-complete' : ''}>{status}</span>)}</div>
      <p>{item.status === 'Delivered' ? 'Your delivery has arrived.' : item.status === 'In Transit' ? 'Your delivery is on its way.' : 'Your delivery is awaiting dispatch.'}</p>
      <p>Live location and arrival estimates are not available yet.</p>{!isDemo && <><p>Last updated: {item.updatedAt?.toDate().toLocaleString() || "Updating…"}</p><TrackingTimeline deliveryId={item.id} /></>}
    </article>)}
  </PageShell>;
}

function DeliveryFields({ draft, setDraft, workers }) {
  const change = (key, value) => setDraft(previous => ({ ...previous, [key]: value }));
  return <>
    <label>Customer<input required maxLength={120} value={draft.customer} onChange={event => change('customer', event.target.value)} /></label>
    <label>Order description<input maxLength={240} value={draft.orderDescription || ''} onChange={event => change('orderDescription', event.target.value)} /></label>
    <label>Recipient name<input maxLength={120} value={draft.recipientName || ''} onChange={event => change('recipientName', event.target.value)} /></label>
    <label>Customer order number<input maxLength={80} value={draft.orderNumber || ''} onChange={event => change('orderNumber', event.target.value)} /></label>
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
  const [draft, setDraft] = useState({ customer: '', recipientName: '', orderNumber: '', orderDescription: '', address: '', status: 'Pending', workerId: '', scheduledDate: localDate(), notes: '', escalated: false });
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
  const { isDemo, hasPermission, user } = useAuth();
  const workspace = useWorkspace();
  const navigate = useNavigate();
  const [draft, setDraft] = useState(delivery);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [deleteState, setDeleteState] = useState('idle');
  const [deleting, setDeleting] = useState(false);
  const hours = workspace.entries.filter(entry => entry.deliveryId === delivery.id).reduce((sum, entry) => sum + entry.hours, 0);
  async function removeDelivery() {
    setDeleting(true); setError('');
    try {
      if (!isDemo) await deleteCustomerTracking(delivery.id);
      workspace.removeDelivery(delivery.id);
      navigate('/deliveries', { replace: true });
    } catch (cause) {
      const message = cause.code === 'permission-denied'
        ? 'Could not delete this delivery. Check your connection and administrator access, then try again.'
        : cause.code === 'unavailable'
          ? 'Delivery deletion is temporarily unavailable. Check your connection and try again.'
          : cause.message || 'Delivery could not be deleted. Please try again.';
      setError(message);
      setDeleteState('idle');
    } finally { setDeleting(false); }
  }
  return <PageShell title={`Delivery #${delivery.id}`} subtitle={`${delivery.customer} · ${delivery.address}`} actions={<Link className="secondary-link" to={delivery.status === 'Delivered' ? '/deliveries/history' : '/deliveries'}>Back to list</Link>}>
    <PublishTracking delivery={delivery} isDemo={isDemo} userUid={user?.uid} canRemove={hasPermission('tracking:delete')} />
    <section className="detail-layout"><article className="card panel"><div className="delivery-hero"><h2>Delivery details</h2><StatusPill status={delivery.status} /></div><div className="progress-rail">{statuses.map((status, i) => <span key={status} className={i <= statuses.indexOf(delivery.status) ? 'is-complete' : ''}>{status}</span>)}</div><form className="form" onSubmit={event => { event.preventDefault(); setMessage(''); setError(''); try { workspace.updateDelivery(delivery.id, draft); setMessage('Delivery saved. Dashboard and history are updated.'); } catch (err) { setError(err.message); } }}><DeliveryFields draft={draft} setDraft={setDraft} workers={workspace.workers} /><Feedback error={error} message={message} /><button className="primary-button" type="submit">Save delivery</button></form>
      {hasPermission('orders:cancel') && <div className="danger-zone"><h3>Delete delivery</h3><p>Deleting removes this delivery from the workspace and removes its customer tracking record.</p>{deleteState === 'confirm' ? <div className="toolbar"><button className="danger-button" type="button" disabled={deleting} onClick={removeDelivery}>{deleting ? 'Deleting…' : 'Confirm delete'}</button><button className="secondary-button" type="button" disabled={deleting} onClick={() => setDeleteState('idle')}>Keep delivery</button></div> : <button className="danger-button" type="button" onClick={() => setDeleteState('confirm')}>Delete delivery</button>}</div>}
    </article>
    <article className="card panel"><h2>Work and activity</h2><DetailItem label="Assigned crew member" value={workspace.workers.find(worker => worker.id === delivery.workerId)?.name || 'Unassigned'} /><DetailItem label="Labor recorded" value={`${hours.toFixed(1)} hours`} /><DetailItem label="Completed" value={delivery.completedAt ? new Date(delivery.completedAt).toLocaleString() : 'Awaiting completion'} /><div className="signal-list activity-list">{[...delivery.events].reverse().map((event, index) => <div className="signal-item" key={index}><strong>{event.text}</strong><p>{new Date(event.at).toLocaleString()}</p></div>)}</div></article></section>
  </PageShell>;
}

export function DeliveryHistoryPage() {
  const { deliveries } = useWorkspace();
  const [query, setQuery] = useState('');
  const completed = deliveries.filter(item => item.status === 'Delivered' && `${item.customer} ${item.id} ${item.address}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''));
  return <PageShell title="Delivery History" subtitle="Completed deliveries, most recent first." actions={<button className="secondary-button" onClick={() => downloadCsv('delivery-history.csv', [['ID', 'Customer', 'Address', 'Completed'], ...completed.map(item => [item.id, item.customer, item.address, item.completedAt])])}>Export CSV</button>}><section className="card panel"><div className="filter-bar"><label>Search history<input type="search" value={query} onChange={event => setQuery(event.target.value)} /></label><span className="panel-chip">{completed.length} completed</span></div><DeliveryTable deliveries={completed} /></section></PageShell>;
}

export function CrewMemberPage() {
  const { workerId } = useParams();
  const workspace = useWorkspace();
  const worker = workspace.workers.find(item => item.id === workerId);
  if (!worker) return <PageShell title="Crew member not found" subtitle="This crew record may have been removed."><Link className="primary-link" to="/labor">Back to Labor &amp; Crew</Link></PageShell>;
  const records = workspace.entries.filter(item => item.workerId === workerId).sort((a, b) => b.date.localeCompare(a.date));
  const hours = records.reduce((sum, item) => sum + item.hours, 0);
  const laborCost = records.reduce((sum, item) => sum + item.hours * item.rate, 0);
  const assignedDeliveries = workspace.deliveries.filter(item => item.workerId === workerId);
  return <PageShell title={worker.name} subtitle={`${worker.title} · Crew member details`} actions={<Link className="secondary-link" to="/labor">Back to Labor &amp; Crew</Link>}>
    <section className="hero-grid"><StatCard label="Recorded hours" value={hours.toFixed(1)} /><StatCard label="Recorded labor cost" value={money(laborCost)} /><StatCard label="Hourly rate" value={`${money(worker.rate)}/hr`} /></section>
    <section className="dashboard-grid">
      <article className="card panel"><h2>Work history</h2><div className="signal-list">{records.map(item => <div className="signal-item" key={item.id}><strong>{item.date} · {item.hours} hours</strong><p>{money(item.hours * item.rate)} labor cost{item.deliveryId && <> · <Link to={`/deliveries/${item.deliveryId}`}>Delivery #{item.deliveryId}</Link></>}</p>{item.notes && <p>{item.notes}</p>}</div>)}{!records.length && <p className="empty-state">No hours have been recorded for this crew member.</p>}</div></article>
      <article className="card panel"><h2>Delivery assignments</h2><div className="signal-list">{assignedDeliveries.map(item => <Link className="signal-item" key={item.id} to={`/deliveries/${item.id}`}><strong>Delivery #{item.id} · {item.customer}</strong><p>{item.status} · {item.scheduledDate} · {item.address}</p></Link>)}{!assignedDeliveries.length && <p className="empty-state">No deliveries are currently assigned.</p>}</div><div className="activity-list"><DetailItem label="Job title" value={worker.title} /><DetailItem label="Hourly rate" value={`${money(worker.rate)} per hour`} /></div></article>
    </section>
  </PageShell>;
}

export function LaborPage() {
  const workspace = useWorkspace();
  const { hasPermission } = useAuth();
  const [crewPage, setCrewPage] = useState(1);
  const crewPageSize = 10;
  const [draft, setDraft] = useState({ workerId: '', date: localDate(), hours: '', deliveryId: '', notes: '' });
  const [worker, setWorker] = useState({ name: '', title: '', rate: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [workerFilter, setWorkerFilter] = useState('');
  const [crewSearch, setCrewSearch] = useState('');
  const [entryCrewSearch, setEntryCrewSearch] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const entries = workspace.entries.filter(entry => (!dateFilter || entry.date === dateFilter) && (!workerFilter || entry.workerId === workerFilter)).sort((a, b) => b.date.localeCompare(a.date));
  const filteredCrew = workspace.workers.filter(item => `${item.name} ${item.title}`.toLowerCase().includes(crewSearch.trim().toLowerCase()));
  const crewPages = Math.max(1, Math.ceil(filteredCrew.length / crewPageSize));
  const currentCrewPage = Math.min(crewPage, crewPages);
  const visibleCrew = filteredCrew.slice((currentCrewPage - 1) * crewPageSize, currentCrewPage * crewPageSize);
  const selectableCrew = workspace.workers.filter(item => `${item.name} ${item.title}`.toLowerCase().includes(entryCrewSearch.trim().toLowerCase()));
  const hours = entries.reduce((sum, entry) => sum + entry.hours, 0);
  const cost = entries.reduce((sum, entry) => sum + entry.hours * entry.rate, 0);
  function perform(action, success) { setError(''); setMessage(''); try { action(); setMessage(success); } catch (err) { setError(err.message); } }
  const setField = (key, value) => setDraft(previous => ({ ...previous, [key]: value }));
  return <PageShell title="Labor & Crew" subtitle="Record work hours, assign jobs, and review labor costs." actions={<button className="secondary-button" onClick={() => downloadCsv('labor-hours.csv', [['Date', 'Crew member', 'Hours', 'Hourly rate', 'Cost', 'Delivery', 'Notes'], ...entries.map(entry => [entry.date, workspace.workers.find(item => item.id === entry.workerId)?.name || 'Unknown', entry.hours, entry.rate, entry.hours * entry.rate, entry.deliveryId, entry.notes])])}>Export hours CSV</button>}>
    <Feedback error={error} message={message} /><section className="hero-grid">{hasPermission('labor:read') && <><StatCard label="Filtered hours" value={hours.toFixed(1)} /><StatCard label="Filtered labor cost" value={money(cost)} /><StatCard label="Crew members" value={workspace.workers.length} /></>}</section>
    <section className="labor-workspace-grid">{hasPermission('labor:update') && <article className="card panel labor-entry-panel"><h2>Log work hours</h2><form className="form labor-entry-form" onSubmit={event => { event.preventDefault(); perform(() => { workspace.addEntry({ ...draft, hours: Number(draft.hours) }); setDraft({ ...draft, hours: '', notes: '' }); }, 'Work hours saved.'); }}>
      <label>Crew member<select required value={draft.workerId} onChange={event => setField('workerId', event.target.value)}><option value="">Choose a crew member</option>{selectableCrew.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      {workspace.workers.length > 10 && <label>Filter crew member<input type="search" value={entryCrewSearch} onChange={event => setEntryCrewSearch(event.target.value)} placeholder="Type a name or job title" /></label>}
      <label>Work date<input required type="date" max={localDate()} value={draft.date} onChange={event => setField('date', event.target.value)} /></label>
      <label>Hours<input required type="number" min="0.25" max="24" step="0.25" value={draft.hours} onChange={event => setField('hours', event.target.value)} /></label>
      <label>Delivery (optional)<select value={draft.deliveryId} onChange={event => setField('deliveryId', event.target.value)}><option value="">General shift work</option>{workspace.deliveries.map(item => <option key={item.id} value={item.id}>#{item.id} · {item.customer}</option>)}</select></label>
      <label>Work notes<textarea value={draft.notes} maxLength={2000} onChange={event => setField('notes', event.target.value)} /></label><button className="primary-button" type="submit">Save hours</button></form></article>}
    {hasPermission('users:read') && <article className="card panel"><div className="panel-header"><h2>Crew roster</h2><span className="panel-chip">{filteredCrew.length} crew</span></div>{workspace.workers.length > 3 && <label className="crew-roster-filter">Filter crew roster<input type="search" value={crewSearch} onChange={event => { setCrewSearch(event.target.value); setCrewPage(1); }} placeholder="Type a crew member name" /></label>}<div className="signal-list">{visibleCrew.map(item => <div className="signal-item" key={item.id}><strong>{item.name}</strong><p>{item.title} · {money(item.rate)}/hour</p></div>)}{workspace.workers.length === 0 && <p className="empty-state">No crew members have been added.</p>}{workspace.workers.length > 0 && !filteredCrew.length && <p className="empty-state">No crew members match this search.</p>}</div>{filteredCrew.length > crewPageSize && <div className="crew-pagination"><button className="secondary-button" type="button" disabled={currentCrewPage <= 1} onClick={() => setCrewPage(page => Math.max(1, page - 1))}>Previous</button><p>Showing {(currentCrewPage - 1) * crewPageSize + 1}–{Math.min(currentCrewPage * crewPageSize, filteredCrew.length)} of {filteredCrew.length}</p><button className="secondary-button" type="button" disabled={currentCrewPage >= crewPages} onClick={() => setCrewPage(page => Math.min(crewPages, page + 1))}>Next</button></div>}</article>}
    {hasPermission('users:create') && <article className="card panel"><h2>Add crew member</h2><form className="form" onSubmit={event => { event.preventDefault(); perform(() => { workspace.addWorker({ ...worker, rate: Number(worker.rate) }); setWorker({ name: '', title: '', rate: '' }); setCrewPage(Math.floor(workspace.workers.length / crewPageSize) + 1); }, 'Crew member added.'); }}>{[['name', 'Name', 'text'], ['title', 'Job title', 'text'], ['rate', 'Hourly rate ($)', 'number']].map(([key, label, type]) => <label key={key}>{label}<input required type={type} min={type === 'number' ? '0.01' : undefined} step={type === 'number' ? '0.01' : undefined} maxLength={120} value={worker[key]} onChange={event => setWorker({ ...worker, [key]: event.target.value })} /></label>)}<button className="primary-button" type="submit">Add crew member</button></form></article>}</section>
    {hasPermission('labor:read') && <section className="card panel"><h2>Timesheet</h2><div className="filter-bar"><label>Filter date<input type="date" value={dateFilter} onChange={event => setDateFilter(event.target.value)} /></label><label>Filter crew<select value={workerFilter} onChange={event => setWorkerFilter(event.target.value)}><option value="">All crew members</option>{workspace.workers.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><button className="secondary-button" onClick={() => { setDateFilter(''); setWorkerFilter(''); }}>Clear filters</button></div><div className="signal-list">{entries.map(entry => <div className="timesheet-row signal-item" key={entry.id}><div><strong>{workspace.workers.find(item => item.id === entry.workerId)?.name}</strong><p>{entry.date} · {entry.hours} hours · {money(entry.hours * entry.rate)}{entry.deliveryId && <> · <Link to={`/deliveries/${entry.deliveryId}`}>Delivery #{entry.deliveryId}</Link></>}</p><p>{entry.notes}</p></div>{hasPermission('labor:update') && (deleteId === entry.id ? <div className="toolbar"><button className="secondary-button" onClick={() => { perform(() => workspace.removeEntry(entry.id), 'Entry removed.'); setDeleteId(null); }}>Confirm removal</button><button className="secondary-button" onClick={() => setDeleteId(null)}>Cancel</button></div> : <button className="secondary-button" onClick={() => setDeleteId(entry.id)}>Remove entry</button>)}</div>)}{!entries.length && <p className="empty-state">No work hours match these filters.</p>}</div></section>}
  </PageShell>;
}

export function SettingsPage() {
  const workspace = useWorkspace();
  const { role, isDemo, signInDemo } = useAuth();
  const { settings: accessibility, updateSetting } = useAccessibility();
  const canManageWorkspace = !['User', 'Guest'].includes(role);
  const [draft, setDraft] = useState({ ...workspace.preferences });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const setPreference = (key, value) => setDraft(previous => ({ ...previous, [key]: value }));
  return <PageShell title="Settings" subtitle="Workspace preferences and demonstration controls.">
    <section className="detail-layout">
      <article className="card panel">
        <h2>Accessibility &amp; display</h2>
        <p>Choose display settings for readability and reduced motion. These settings apply across LaborTracker on this browser, for every account and role.</p>
        <div className="accessibility-preferences">
          <label htmlFor="accessibility-text-size">Text size<select id="accessibility-text-size" value={accessibility.textSize} onChange={event => updateSetting('textSize', event.target.value)}><option value="standard">Standard</option><option value="large">Large</option><option value="largest">Largest</option></select></label>
          <label htmlFor="accessibility-contrast">Contrast<select id="accessibility-contrast" value={accessibility.contrast} onChange={event => updateSetting('contrast', event.target.value)}><option value="standard">Standard contrast</option><option value="high">High contrast</option></select></label>
          <label className="check-label"><input type="checkbox" checked={accessibility.reduceMotion} onChange={event => updateSetting('reduceMotion', event.target.checked)} />Reduce animations and motion</label>
        </div>
      </article>
      {canManageWorkspace && <article className="card panel workspace-preferences-panel">
        <h2>Workspace preferences</h2>
        <form className="form" onSubmit={event => {
          event.preventDefault(); setError(''); setMessage('');
          try { workspace.savePreferences({ ...draft, dailyHours: Number(draft.dailyHours) }); setMessage('Preferences saved.'); }
          catch (err) { setError(err.message); }
        }}>
          <label>Company name<input required maxLength={120} value={draft.company} onChange={event => setPreference('company', event.target.value)} /></label>
          <label>Daily shift target (hours)<input required type="number" min="0.25" max="24" step="0.25" value={draft.dailyHours} onChange={event => setPreference('dailyHours', event.target.value)} /></label>
          <details className="optional-preferences">
            <summary><span className="optional-title">Optional <span className="optional-chevron" aria-hidden="true">⌄</span></span><small>Choose what you want to see and what optional information may be collected.</small></summary>
            <div className="optional-preferences-list">
              <label className="checkbox-label"><input type="checkbox" checked={Boolean(draft.heshwareAds)} onChange={event => setPreference('heshwareAds', event.target.checked)} /><span><strong>Heshware Ads</strong><small>Show up to two recent public Heshware project announcements on your Dashboard. This makes a request to Heshware for its public updates. Your work activity is not used to personalize them.</small></span></label>
              <label className="checkbox-label"><input type="checkbox" checked={Boolean(draft.analyticsCookies)} onChange={event => setPreference('analyticsCookies', event.target.checked)} /><span><strong>Analytics cookies</strong><small>Allow Firebase Analytics to collect basic app session metrics to help improve LaborTracker. Page-view collection and ad-personalization signals are disabled. Collection stays off unless you enable this. Essential sign-in and workspace storage are separate.</small></span></label>
              <label className="checkbox-label"><input type="checkbox" checked={Boolean(draft.performanceInfo)} onChange={event => setPreference('performanceInfo', event.target.checked)} /><span><strong>Performance information</strong><small>Allow Firebase Performance Monitoring to collect app load and network timing information so we can improve the software and keep it working well as products and browsers are updated. Collection stays off unless you enable this.</small></span></label>
            </div>
          </details>
          <Feedback error={error} message={message} />
          <button className="primary-button" type="submit">Save preferences</button>
        </form>
      </article>}
      {canManageWorkspace && <article className="card panel">
        <h2>{isDemo ? 'Demo controls' : 'Workspace storage'}</h2>
        <p>Work records are saved in this browser for this workspace. Use CSV exports to keep a copy. Shared cloud operations are not configured.</p>
        {isDemo && <div className="form">
          <label>Demo role<select value={role} onChange={event => { try { signInDemo(event.target.value); } catch (err) { setError(err.message); } }}><option>Super Admin</option><option>Admin</option><option>OperationsAdmin</option><option>RegionalAdmin</option><option>Lead</option><option>User</option></select></label>
          <p>Switch roles to demonstrate the permission scopes applied to each staff role.</p>
          {confirmReset ? <><p>Replace all demo edits with a fresh sample dataset?</p><button className="primary-button" onClick={() => { try { workspace.resetDemo(); setDraft({ company: 'SmartBox Demo', dailyHours: 8, heshwareAds: false, analyticsCookies: false, performanceInfo: false }); setConfirmReset(false); setMessage('Demo data reset.'); setError(''); } catch (err) { setError(err.message); } }}>Confirm reset</button><button className="secondary-button" onClick={() => setConfirmReset(false)}>Cancel</button></> : <button className="secondary-button" onClick={() => setConfirmReset(true)}>Reset demo data</button>}
        </div>}
      </article>}
    </section>
  </PageShell>;
}

export function ProfilePage() {
  const { user, role, isDemo } = useAuth();
  return <PageShell title="Profile" subtitle="Your account details."><section className="card detail-grid"><DetailItem label="Email" value={user?.email || 'Guest session'} /><DetailItem label="Role" value={role} /><DetailItem label="User ID" value={user?.uid || 'Unavailable'} /></section></PageShell>;
}

export function AboutInformationPage() {
  const { user, role, isDemo } = useAuth();
  const session = isDemo ? 'Local demonstration workspace' : user?.isAnonymous ? 'Guest session' : 'Signed-in account';
  const access = role === 'Guest' ? 'View the dashboard and profile.' : role === 'User' ? 'View deliveries assigned to your account.' : role === 'Super Admin' || role === 'Admin' ? 'Full system access (*:*).' : role === 'OperationsAdmin' ? 'Operational access across assigned operations. Financial and security administration remain restricted.' : role === 'RegionalAdmin' ? 'Operational access limited to assigned regions. Financial and security administration remain restricted.' : 'Manage assigned deliveries and publish customer tracking. Financial and security administration remain restricted.';
  return <PageShell title="About & Information" subtitle="How this workspace works and what your account can access."><section className="card detail-grid"><DetailItem label="Current session" value={session} /><DetailItem label="Role" value={role} /><DetailItem label="Access" value={access} /><DetailItem label="Data storage" value={isDemo ? 'Demo changes are saved in this browser.' : 'Customer tracking updates are shared through your account.'} /></section><section className="card panel"><h2>About LaborTracker</h2><p>LaborTracker helps teams coordinate deliveries and labor. Customer accounts see the delivery tracking information assigned to them.</p></section></PageShell>;
}
export function NotFoundPage() {
  const { isAuthenticated } = useAuth();
  return <div className="centered-page gradient-page"><div className="card auth-card"><p className="eyebrow">404</p><h2>Page not found</h2><Link className="primary-link" to={isAuthenticated ? '/dashboard' : '/'}>Return to {isAuthenticated ? 'dashboard' : 'sign in'}</Link></div></div>;
}
