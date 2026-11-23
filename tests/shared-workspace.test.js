import assert from 'node:assert/strict';
import test from 'node:test';
import { deleteApp, initializeApp } from 'firebase/app';
import { connectAuthEmulator, createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { collection, connectFirestoreEmulator, doc, getDocFromServer, getDocsFromServer, getFirestore, serverTimestamp, terminate, updateDoc, writeBatch } from 'firebase/firestore';
import { browserImportBatches, planBrowserImport, readSharedWorkspace, sharedRecordWrites } from '../src/data/sharedWorkspace.js';
import { createDemoWorkspace } from '../src/data/workspace.js';
import { subscribeToWorkspace, writeWorkspaceRecords } from '../src/services/sharedWorkspace.js';

const project = 'demo-labortracker';
const firestoreHost = process.env.FIRESTORE_EMULATOR_HOST;
const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;

function waitForWorkspace(db, id, revision) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => finish(reject, new Error('Workspace snapshot timed out')), 12000);
    const dispose = subscribeToWorkspace(db, id, state => {
      if (state && state.revision >= revision) finish(resolve, state);
    }, error => finish(reject, error));
    function finish(fn, value) { clearTimeout(timer); dispose(); fn(value); }
  });
}

test('preserves browser records on retry and detects different records with the same ID', async () => {
  const browser = createDemoWorkspace();
  const original = JSON.stringify(browser);
  const writes = await planBrowserImport(browser, new Map());
  const records = new Map(writes);
  assert.deepEqual(await planBrowserImport(browser, records), []);
  records.set(writes[0][0], { kind: 'crew', data: { ...writes[0][1].data, rate: 1 } });
  await assert.rejects(planBrowserImport(browser, records), /conflicts with a shared record/);
  assert.equal(JSON.stringify(browser), original);
  const imported = new Map(writes);
  const delivered = writes.find(([, row]) => row.kind === 'delivery');
  imported.set(delivered[0], { kind: 'delivery', id: delivered[1].data.id, deleted: true, origin: delivered[1].origin });
  assert.deepEqual(await planBrowserImport(browser, imported), []);
  const snapshot = readSharedWorkspace(imported);
  assert.equal(snapshot.data.entries.length, browser.entries.length);
  assert.ok(snapshot.data.entries.every(entry => entry.deliveryId !== delivered[1].data.id));
});

test('syncs actual workspace records between signed-in sessions and enforces Firestore access', { skip: !firestoreHost || !authHost, timeout: 60000 }, async t => {
  const clients = [];
  t.after(async () => { await Promise.all(clients.map(async ({ app, db }) => { await terminate(db); await deleteApp(app); })); });
  const prefix = crypto.randomUUID();
  async function client(label, role, workspaceId, existingEmail) {
    const app = initializeApp({ projectId: project, apiKey: 'demo-api-key' }, `${prefix}-${label}`);
    const auth = getAuth(app);
    connectAuthEmulator(auth, `http://${authHost}`, { disableWarnings: true });
    const db = getFirestore(app);
    const [host, port] = firestoreHost.split(':');
    connectFirestoreEmulator(db, host, Number(port));
    clients.push({ app, db });
    const email = existingEmail || `${label}-${prefix}@example.test`;
    const signIn = existingEmail ? signInWithEmailAndPassword : createUserWithEmailAndPassword;
    const { user } = await signIn(auth, email, 'Synthetic-test-only-42');
    if (!existingEmail) {
      const fields = { role: { stringValue: role }, ...(workspaceId ? { workspaceId: { stringValue: workspaceId } } : {}) };
      const response = await fetch(`http://${firestoreHost}/v1/projects/${project}/databases/(default)/documents/users/${user.uid}`, {
        method: 'PATCH', headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' }, body: JSON.stringify({ fields }),
      });
      assert.equal(response.status, 200);
    }
    return { db, email, uid: user.uid };
  }
  const team = `team-${prefix}`;
  const [first, colleague, outsider, customer] = await Promise.all([
    client('admin', 'Admin', prefix), client('lead', 'Lead', prefix),
    client('outsider', 'Admin', `${prefix}-other`), client('customer', 'User'),
  ]);
  const second = await client('second-device', null, null, first.email);
  const original = createDemoWorkspace();
  const records = collection(first.db, 'sharedWorkspaces', team, 'records');
  const pending = await planBrowserImport(original, new Map());
  let revision = 0;
  for (const writes of browserImportBatches(pending)) revision = await writeWorkspaceRecords(first.db, team, revision, writes);
  const secondView = await waitForWorkspace(second.db, team, revision);
  const leadView = await waitForWorkspace(colleague.db, team, revision);
  assert.equal(secondView.data.workers.length, original.workers.length);
  assert.equal(secondView.data.deliveries.length, original.deliveries.length);
  assert.equal(leadView.data.entries.length, original.entries.length);
  assert.deepEqual(await planBrowserImport(original, secondView.records), []);
  await assert.rejects(getDocsFromServer(collection(outsider.db, records.path)), { code: 'permission-denied' });
  await assert.rejects(getDocsFromServer(collection(customer.db, records.path)), { code: 'permission-denied' });
  await assert.rejects(updateDoc(doc(colleague.db, 'users', colleague.uid), { workspaceId: 'another-team' }), { code: 'permission-denied' });
  const forbiddenCrew = ['crew-unauthorized', { kind: 'crew', data: { id: 'unauthorized', name: 'Synthetic', title: 'Driver', rate: 1 } }];
  await assert.rejects(writeWorkspaceRecords(colleague.db, team, revision, [forbiddenCrew]), { code: 'permission-denied' });

  const delivery = secondView.data.deliveries.find(row => original.entries.some(entry => entry.deliveryId === row.id));
  const tracking = doc(first.db, 'customerTracking', delivery.id);
  const publish = writeBatch(first.db);
  publish.set(tracking, { customerUid: customer.uid, address: delivery.address, scheduledDate: delivery.scheduledDate, status: delivery.status, regionId: 'default', updatedAt: serverTimestamp() });
  publish.set(doc(tracking, 'events', 'first'), { status: delivery.status, at: serverTimestamp() });
  await publish.commit();
  assert.equal((await getDocFromServer(doc(customer.db, tracking.path))).data().status, delivery.status);
  const next = { ...secondView.data, deliveries: secondView.data.deliveries.filter(row => row.id !== delivery.id) };
  const deleteWrites = sharedRecordWrites(secondView.data, next, secondView.records);
  await assert.rejects(writeWorkspaceRecords(colleague.db, team, revision, deleteWrites), { code: 'permission-denied' });
  revision = await writeWorkspaceRecords(first.db, team, revision, deleteWrites, delivery.id);
  await assert.rejects(writeWorkspaceRecords(second.db, team, revision - 1, deleteWrites), /changed on another device/);
  const latest = await waitForWorkspace(second.db, team, revision);
  assert.equal(latest.data.deliveries.length, original.deliveries.length - 1);
  assert.equal(latest.data.entries.length, original.entries.length);
  assert.ok(latest.data.entries.every(entry => entry.deliveryId !== delivery.id));
  assert.equal((await getDocFromServer(tracking)).exists(), false);
});
