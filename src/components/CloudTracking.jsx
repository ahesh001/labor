import { useEffect, useState } from 'react';
import { collection, doc, onSnapshot, query, where, orderBy, runTransaction, serverTimestamp, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

export async function deleteCustomerTracking(deliveryId) {
  const reference = doc(db, 'customerTracking', deliveryId);
  try {
    const events = await getDocs(collection(reference, 'events'));
    for (let start = 0; start < events.docs.length; start += 450) {
      const batch = writeBatch(db);
      events.docs.slice(start, start + 450).forEach(event => batch.delete(event.ref));
      await batch.commit();
    }
  } catch (cause) {
    // The parent may not have been published, or event reads may be restricted.
    // Deleting the tracking parent below still removes it from customer lists.
    if (!['permission-denied', 'not-found'].includes(cause.code)) throw cause;
  }
  await writeBatch(db).delete(reference).commit();
}

export function TrackingTimeline({ deliveryId }) {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => onSnapshot(query(collection(db, 'customerTracking', deliveryId, 'events'), orderBy('at')), snapshot => {
    setEvents(snapshot.docs.map(item => ({ id: item.id, ...item.data() })));
    setError('');
  }, () => setError('The delivery timeline could not be loaded.')), [deliveryId]);
  return <section><h3>Tracking timeline</h3>{error && <p role="alert">{error}</p>}<ol>{events.map(event => <li key={event.id}><strong>{event.status}</strong> · {event.at?.toDate().toLocaleString() || 'Updating…'}</li>)}</ol></section>;
}

export function useCustomerTracking(uid, enabled) {
  const [state, setState] = useState({ deliveries: [], loading: true, error: '', cached: false });
  useEffect(() => {
    setState({ deliveries: [], loading: enabled, error: '', cached: false });
    if (!enabled || !uid) return;
    return onSnapshot(query(collection(db, 'customerTracking'), where('customerUid', '==', uid)), { includeMetadataChanges: true }, snapshot => {
      setState({ deliveries: snapshot.docs.map(item => ({ id: item.id, ...item.data() })), loading: false, error: '', cached: snapshot.metadata.fromCache });
    }, () => setState({ deliveries: [], loading: false, error: 'Tracking is unavailable. Check your connection and reload to try again.', cached: false }));
  }, [uid, enabled]);
  return state;
}

export function PublishTracking({ delivery, isDemo, userUid, canRemove }) {
  const [uid, setUid] = useState('');
  const [assignment, setAssignment] = useState(isDemo ? 'demo' : 'loading');
  const [expanded, setExpanded] = useState(isDemo);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [confirmRemove, setConfirmRemove] = useState(false);
  const attemptKey = `laborTracker.trackingAttempted.${userUid || 'unknown'}.${delivery.id}`;
  const [hasAttemptedPublish, setHasAttemptedPublish] = useState(() => {
    try { return sessionStorage.getItem(attemptKey) === 'true'; } catch { return false; }
  });

  useEffect(() => {
    if (isDemo) { setAssignment('demo'); setExpanded(true); return undefined; }
    setAssignment('loading');
    return onSnapshot(doc(db, 'customerTracking', delivery.id), snapshot => {
      if (snapshot.exists()) {
        setUid(snapshot.data().customerUid || '');
        setAssignment('assigned');
        setExpanded(false);
      } else {
        setUid('');
        setAssignment('unassigned');
        setExpanded(true);
      }
      setError('');
    }, () => {
      // Keep the form available for recovery without leaving a stale permission alert on screen.
      setAssignment('unavailable');
      setExpanded(true);
    });
  }, [delivery.id, isDemo]);

  async function publish(event) {
    event?.preventDefault();
    setHasAttemptedPublish(true);
    try { sessionStorage.setItem(attemptKey, 'true'); } catch { /* The form still works without session storage. */ }
    setBusy(true); setMessage(''); setError('');
    try {
      const customerUid = uid.trim();
      if (!customerUid || customerUid.includes('/')) throw new Error('Enter the Customer ID from the customer’s Profile page.');
      const reference = doc(db, 'customerTracking', delivery.id);
      await runTransaction(db, async transaction => {
        const previous = await transaction.get(reference);
        if (previous.exists() && previous.data().customerUid !== customerUid) throw new Error('This delivery is already linked to another customer. Remove its tracking assignment before linking a different customer.');
        transaction.set(reference, { customerUid, address: delivery.address, scheduledDate: delivery.scheduledDate, status: delivery.status, regionId: delivery.regionId || 'default', updatedAt: serverTimestamp() });
        if (!previous.exists() || previous.data().status !== delivery.status) {
          transaction.set(doc(collection(reference, 'events')), { status: delivery.status, at: serverTimestamp() });
        }
      });
      setAssignment('assigned');
      setExpanded(false);
      setMessage('Published. The customer can now see this saved status and destination.');
    } catch (cause) {
      const messages = {
        'permission-denied': 'Could not publish this delivery. Check the Customer ID and your account access, then try again.',
        'unavailable': 'Updates are temporarily unavailable. Check your connection and try again.',
      };
      setError(messages[cause.code] || cause.message || 'Could not publish this delivery. Check the Customer ID and try again.');
    }
    finally { setBusy(false); }
  }

  async function removeAssignment() {
    setBusy(true); setError(''); setMessage('');
    try {
      await deleteCustomerTracking(delivery.id);
      setUid(''); setAssignment('unassigned'); setExpanded(true); setConfirmRemove(false);
      setMessage('Customer tracking was removed.');
    } catch (cause) {
      setError(cause.code === 'permission-denied' ? 'Could not remove customer tracking. Check administrator access and try again.' : 'Customer tracking could not be removed. Check your connection and try again.');
      setConfirmRemove(false);
    } finally { setBusy(false); }
  }

  if (assignment === 'loading') return <section className="card panel tracking-loading" aria-live="polite">Checking customer tracking…</section>;
  return <section className="card panel"><details className="tracking-panel" open={expanded} onToggle={event => setExpanded(event.currentTarget.open)}>
    <summary><span>Customer tracking</span><span className="tracking-state">{assignment === 'assigned' ? 'Connected' : assignment === 'demo' ? 'Demo only' : 'Not connected'}</span></summary>
    {isDemo ? <p>Cloud publishing is disabled in demo mode. Sign in with a staff account to connect a real customer.</p> : assignment === 'assigned' ? <div className="form">
      <p>Customer tracking is connected. Save delivery changes, then publish the saved status. Internal notes and crew details are never shared.</p>
      <button className="primary-button" type="button" disabled={busy} onClick={publish}>{busy ? 'Publishing…' : 'Publish saved delivery status'}</button>
      {canRemove && (confirmRemove ? <div className="toolbar"><button className="danger-button" type="button" disabled={busy} onClick={removeAssignment}>{busy ? 'Removing…' : 'Confirm remove tracking'}</button><button className="secondary-button" type="button" disabled={busy} onClick={() => setConfirmRemove(false)}>Keep tracking</button></div> : <button className="secondary-button" type="button" disabled={busy} onClick={() => setConfirmRemove(true)}>Remove customer tracking</button>)}
      {error && <p role="alert" className="error-text">{error}</p>}
    </div> : <form className="form" onSubmit={publish}>
      <p>Connect this delivery to the customer account that should see its tracking updates. Internal notes and crew details are never shared.</p>
      <label>Customer ID<input required value={uid} onChange={event => setUid(event.target.value)} placeholder="Paste the ID from the customer’s Profile page" autoComplete="off" /></label>
      {!hasAttemptedPublish && <p>Use the Customer ID from the customer’s Profile page. Remove tracking before connecting a different customer.</p>}
      <button className="primary-button" disabled={busy}>{busy ? 'Publishing…' : 'Publish saved delivery status'}</button>
      {error && <p role="alert" className="error-text">{error}</p>}
    </form>}
  </details>{message && <p role="status" className="success-text tracking-message">{message}</p>}</section>;
}
