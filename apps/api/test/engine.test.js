// t42 verification: approvalsSurface against a fully mocked JSON-RPC provider.
// Proves: (1) failed allowance re-check fails CLOSED (wound kept, flagged unverified),
// (2) malformed allowance return does not crash the surface (BigInt guard),
// (3) "0x" empty return still counts as revoked, (4) per-chain blockSeconds honored.
import { test } from 'node:test';
import assert from 'node:assert/strict';

const OWNER = '0x' + 'aa'.repeat(20);
const TOKENS = ['0x' + '01'.repeat(20), '0x' + '02'.repeat(20), '0x' + '03'.repeat(20), '0x' + '04'.repeat(20)];
const SPENDER = '0x' + 'bb'.repeat(20);
const pad32 = v => v.toLowerCase().replace(/^0x/, '').padStart(64, '0');
const TIP = 1_000_000;
const GRANT_BLOCK = TIP - 100_000; // 100k blocks ago

// Four grants in the log history; allowance() re-check then behaves differently per token:
// t0 -> healthy huge allowance, t1 -> per-item RPC error (null), t2 -> malformed hex,
// t3 -> "0x" empty return (token gone).
const LOGS = TOKENS.map((t, i) => ({
  address: t,
  topics: ['0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925', '0x' + pad32(OWNER), '0x' + pad32(SPENDER)],
  data: '0x' + (1n << 200n).toString(16).padStart(64, '0'),
  blockNumber: '0x' + GRANT_BLOCK.toString(16),
  logIndex: '0x' + i.toString(16),
}));

globalThis.fetch = async (url, { body }) => {
  const req = JSON.parse(body);
  const reply = o => ({ ok: true, status: 200, text: async () => JSON.stringify(o) });
  if (Array.isArray(req)) { // batched eth_call: allowance() per pair
    return reply(req.map(item => {
      const token = item.params[0].to;
      const i = TOKENS.indexOf(token);
      if (i === 1) return { id: item.id, error: { code: -32000, message: 'execution aborted' } }; // null result
      if (i === 2) return { id: item.id, result: '0xnothex' };                                     // malformed
      if (i === 3) return { id: item.id, result: '0x' };                                           // empty
      return { id: item.id, result: '0x' + (1n << 200n).toString(16).padStart(64, '0') };          // healthy
    }));
  }
  if (req.method === 'eth_blockNumber') return reply({ result: '0x' + TIP.toString(16) });
  if (req.method === 'eth_getLogs') return reply({ result: LOGS });
  return reply({ result: null });
};

const { approvalsSurface } = await import('../approvals.js');

test('allowance re-check failures fail closed; blockSeconds honored (mocked JSON-RPC)', async () => {
// blockSeconds=2 (a Base-like chain): 100k blocks ago = ~2.3 days -> age must be far under 2y.
const s = await approvalsSurface('http://mock', OWNER, { addresses: [] }, { fromBlock: 1, blockSeconds: 2 });

const byToken = Object.fromEntries(s.wounds.map(w => [w.token, w]));
const [t0, t1, t2, t3] = TOKENS;

assert.ok(byToken[t0], 'healthy allowance stays open');
assert.equal(byToken[t0].allowanceUnverified, false, 'healthy re-check is verified');

assert.ok(byToken[t1], 'FAIL-CLOSED: per-item RPC error keeps the wound open');
assert.equal(byToken[t1].allowanceUnverified, true, 'RPC-error wound flagged unverified');
assert.ok(byToken[t1].reasons.some(r => /re-check failed/.test(r)), 'unverified reason present');

assert.ok(byToken[t2], 'FAIL-CLOSED: malformed hex keeps the wound open (no BigInt crash)');
assert.equal(byToken[t2].allowanceUnverified, true, 'malformed-return wound flagged unverified');

assert.equal(byToken[t3], undefined, '"0x" empty return still counts as revoked');
assert.equal(s.openCount, 3, 'openCount = healthy + 2 unverified');

const age = byToken[t0].grantedAtEst;
const days = (Date.now() - new Date(age).getTime()) / 86400000;
assert.ok(days < 30, `blockSeconds honored: grant ~2.3 days ago, got ~${days.toFixed(1)}d`);
assert.ok(!byToken[t0].reasons.some(r => /never revoked/.test(r)), 'no bogus >2y age reason on a 2s-block chain');
});
