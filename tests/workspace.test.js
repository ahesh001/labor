import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDemoWorkspace, emptyWorkspace, summarize, validateDelivery, validateEntry, csv, isWorkspace, localDate, validDate } from '../src/data/workspace.js';

test('demo provides consistent assignments, dates, labor cost, and dashboard counts', () => {
  const data = createDemoWorkspace();
  assert.equal(isWorkspace(data), true);
  assert.equal(data.deliveries.length, 12);
  assert.equal(data.workers.length, 4);
  assert.equal(data.entries.length, 8);
  assert.deepEqual(summarize(data), { open: 7, completed: 3, escalations: 2, hours: 19, cost: 491.5 });
  for (const delivery of data.deliveries) validateDelivery(delivery, data);
  for (const entry of data.entries) validateEntry(entry, data);
});
test('demo can be serialized and remains distinct from an empty account workspace', () => {
  assert.equal(isWorkspace(JSON.parse(JSON.stringify(createDemoWorkspace()))), true);
  assert.deepEqual(summarize(emptyWorkspace()), { open: 0, completed: 0, escalations: 0, hours: 0, cost: 0 });
});
test('completion removes jobs and escalations from active dashboard totals', () => {
  const data = createDemoWorkspace();
  data.deliveries[2].status = 'Delivered';
  data.deliveries[2].completedAt = new Date().toISOString();
  assert.deepEqual(summarize(data), { open: 6, completed: 4, escalations: 1, hours: 19, cost: 491.5 });
  data.deliveries[2].status = 'Pending'; data.deliveries[2].completedAt = null;
  assert.equal(summarize(data).completed, 3);
});
test('hours reject invalid inputs, future dates, and totals beyond 24 hours', () => {
  const data = createDemoWorkspace();
  const entry = { workerId: 'w1', date: localDate(), hours: 1, deliveryId: '' };
  for (const hours of [0, -1, 25, NaN, Infinity]) assert.throws(() => validateEntry({ ...entry, hours }, data));
  assert.throws(() => validateEntry({ ...entry, hours: 21 }, data), /cannot exceed 24/);
  assert.throws(() => validateEntry({ ...entry, workerId: 'missing' }, data), /crew member/);
  assert.throws(() => validateEntry({ ...entry, deliveryId: 'missing' }, data), /delivery/);
  assert.throws(() => validateEntry({ ...entry, date: '2999-01-01' }, data), /earlier/);
  assert.throws(() => validateEntry({ ...entry, date: '2026-02-30' }, data));
  assert.doesNotThrow(() => validateEntry({ ...entry, hours: 20 }, data));
});
test('delivery validation rejects missing fields, unknown status, and bad assignments', () => {
  const data = createDemoWorkspace();
  const delivery = data.deliveries[0];
  for (const changes of [{ customer: ' ' }, { address: '' }, { status: 'Unknown' }, { workerId: 'missing' }, { scheduledDate: '2026-02-30' }]) assert.throws(() => validateDelivery({ ...delivery, ...changes }, data));
});
test('calendar validation handles leap days and local dates', () => {
  assert.equal(validDate('2028-02-29'), true);
  assert.equal(validDate('2026-02-29'), false);
  assert.equal(validDate('2026-13-01'), false);
  assert.equal(localDate(new Date(2026, 9, 2, 23, 59)), '2026-10-02');
});
test('CSV preserves quotes and line breaks and neutralizes spreadsheet formulas', () => {
  assert.equal(csv([['Acme, Inc.', 'Said "hello"', 'two\nlines'], ['=1+1', ' @SUM(A1)', '+cmd', '-cmd']]), '"Acme, Inc.","Said ""hello""","two\nlines"\r\n"\'=1+1","\' @SUM(A1)","\'+cmd","\'-cmd"');
});
test('storage validation catches malformed records before pages read them', () => {
  for (const value of [null, {}, { workers: [], entries: [], deliveries: [] }]) assert.equal(isWorkspace(value), false);
  const data = createDemoWorkspace();
  data.deliveries[0].events = [null];
  assert.equal(isWorkspace(data), false);
});
