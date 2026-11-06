import { test, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

async function loadSource(path) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  return import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'));
}
const { apiClient, ApiError } = await loadSource('../src/shared/api/client.ts');
const { decodeVinFromNHTSA } = await loadSource('../src/shared/lib/vinService.ts');
afterEach(() => mock.restoreAll());

function browserSession() {
  const storage = new Map([['carship_token', 'customer-token'], ['carship_user', '{"role":"customer"}']]);
  const browser = new EventTarget();
  mock.method(globalThis, 'fetch', async () => new Response('{}', { status: 401 }));
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: key => storage.get(key) ?? null,
    removeItem: key => storage.delete(key),
    setItem: (key, value) => storage.set(key, value),
  } });
  Object.defineProperty(globalThis, 'window', { configurable: true, value: browser });
  return { storage, browser };
}

test('401 clears the expired session without logging in as another account or retrying a mutation', async () => {
  const { storage, browser } = browserSession();
  let changes = 0;
  browser.addEventListener('carship_auth_change', () => changes++);
  await assert.rejects(apiClient('/invoices', { method: 'POST', body: '{}' }), ApiError);
  assert.equal(fetch.mock.callCount(), 1);
  assert.equal(storage.size, 0);
  assert.equal(changes, 1);
});

test('a late 401 cannot clear a newer login session', async () => {
  const { storage } = browserSession();
  mock.method(globalThis, 'fetch', async () => {
    storage.set('carship_token', 'new-session');
    return new Response('{}', { status: 401 });
  });
  await assert.rejects(apiClient('/cars'), ApiError);
  assert.equal(storage.get('carship_token'), 'new-session');
});

test('403 preserves the signed-in identity', async () => {
  const { storage } = browserSession();
  mock.method(globalThis, 'fetch', async () => new Response('{}', { status: 403 }));
  await assert.rejects(apiClient('/users'), ApiError);
  assert.equal(storage.get('carship_token'), 'customer-token');
});

test('VIN specifications never invent vehicle history, including sample VIN endings', async () => {
  mock.method(globalThis, 'fetch', async () => Response.json({ Results: [
    { Variable: 'Make', Value: 'FORD' }, { Variable: 'Model', Value: 'F-150' },
    { Variable: 'Model Year', Value: '2022' },
  ] }));
  for (const vin of ['1FTFW1ED5NFA12345', '1FTFW1ED5NFA54321']) {
    const result = await decodeVinFromNHTSA(vin);
    assert.equal(result.make, 'FORD');
    assert.deepEqual(result.titleCheck, {
      cleanTitle: null, floodDamage: null, salvageOrTotalLoss: null,
      odometerStatus: null, recordedMiles: null, accidentHistoryCount: null,
      nmvtisVerified: false,
    });
  }
});
