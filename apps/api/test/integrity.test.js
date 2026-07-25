// t82 verification: the audit fixes that keep the verdict honest.
// Proves: (1) a scan that lost chains is reported partial and names them, (2) a fully
// down feed is still feedDown, (3) incident matching is word-level (no substring
// false positives), (4) an Approval that carries `value` as a topic is not lost.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cookedScore, incidentSurface, loadIncidents } from '../autopsy.js';
import { latestPairs } from '../approvals.js';

loadIncidents(JSON.parse(readFileSync(new URL('../incidents.json', import.meta.url), 'utf8')));

const surfaces = (approvals) => ({
  incidents: { matches: [] }, ghost: { score: 0 }, behavioral: { score: 0 }, approvals,
});

test('cookedScore: chains lost to timeout make the verdict partial and say which', () => {
  const c = cookedScore(surfaces({
    items: [], score: 0, chainsScanned: 19,
    skipped: [{ chain: 'Ethereum', reason: 'timeout after 45000ms' }, { chain: 'Base', reason: 'HTTP 503' }],
    coverage: { scanned: 19, total: 21, complete: false },
  }));
  assert.equal(c.partial, true, 'a scan missing chains cannot be a full verdict');
  assert.equal(c.feedDown, false, 'the feed itself was up');
  assert.deepEqual(c.unscannedChains, ['Ethereum', 'Base']);
  assert.match(c.pendingFeeds[0], /2\/21 chains unscanned — Ethereum, Base/);
});

test('cookedScore: full coverage is a full verdict', () => {
  const c = cookedScore(surfaces({
    items: [], score: 0, chainsScanned: 21, skipped: [], coverage: { scanned: 21, total: 21, complete: true },
  }));
  assert.equal(c.partial, false);
  assert.deepEqual(c.pendingFeeds, []);
});

test('cookedScore: a feed that is entirely down stays feedDown (never cached)', () => {
  const c = cookedScore(surfaces({ status: 'unavailable', error: 'rpc dead' }));
  assert.equal(c.partial, true);
  assert.equal(c.feedDown, true);
  assert.equal(c.components.openWounds, null);
});

test('incidentSurface: matches whole words, not substrings', () => {
  // "multi" is a registry alias for Multichain; it must not fire on unrelated names
  // that merely contain those letters — every false positive is worth +34 exploit.
  const noise = incidentSurface(['multipass vault', 'curveball token', 'beanstalker']);
  assert.deepEqual(noise.matches, [], `unexpected matches: ${noise.matches.map(m => m.target).join(', ')}`);

  const real = incidentSurface(['curve', 'multi']);
  const targets = real.matches.map(m => m.target);
  assert.ok(targets.some(t => /curve/i.test(t)), 'a real symbol still matches');
});

test('incidentSurface: one match per protocol, largest loss wins', () => {
  const r = incidentSurface(['mim']);
  const roots = r.matches.map(m => m.target.toLowerCase().split(/\s+/)[0]);
  assert.equal(new Set(roots).size, roots.length, `duplicate protocol roots: ${roots.join(', ')}`);
});

test('latestPairs: value carried in topics[3] is not read as a revoked grant', () => {
  const owner = '0x' + 'aa'.repeat(20), spender = '0x' + 'bb'.repeat(20);
  const pad = v => v.toLowerCase().replace(/^0x/, '').padStart(64, '0');
  const [pair] = latestPairs([{
    address: '0x' + '01'.repeat(20),
    topics: ['0x8c5b', '0x' + pad(owner), '0x' + pad(spender), '0x' + (123n).toString(16).padStart(64, '0')],
    data: '0x',                       // non-standard token: value is indexed, data is empty
    blockNumber: '0x10', logIndex: '0x0',
  }]);
  assert.equal(pair.approvedValue, 123n, 'the grant must survive, not read as value 0');
});
