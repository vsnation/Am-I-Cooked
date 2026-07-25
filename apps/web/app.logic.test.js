// t82 verification: the verdict/discharge maths inside index.html, exercised for real.
// The app is a single inline script with no bundler, so the harness loads it against a
// minimal DOM stub and pulls the pure functions out. Proves: (1) the verdict footnote
// reports coverage instead of the old invented "84% of wallets" percentile, (2) a scan
// that lost chains never renders as clean, (3) the discharge score is the rubric applied
// to the wounds that are actually gone.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const app = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).pop();

function el() {
  const e = {
    style: {}, classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    children: [], textContent: '', innerHTML: '', value: '', disabled: false,
    addEventListener() {}, querySelector: () => el(), querySelectorAll: () => [],
    getContext: () => ({ clearRect() {}, beginPath() {}, arc() {}, fill() {} }),
    offsetWidth: 0, offsetHeight: 0, focus() {}, remove() {},
  };
  return e;
}
const sandbox = {
  document: { getElementById: () => el(), querySelector: () => el(), querySelectorAll: () => [], addEventListener() {} },
  window: { matchMedia: () => ({ matches: false }), addEventListener() {}, ethereum: null },
  matchMedia: () => ({ matches: false }),
  location: { search: '' }, navigator: {}, URLSearchParams,
  fetch: async () => ({ json: async () => ({}) }),
  setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
  requestAnimationFrame: () => 0, console,
};
const load = new Function(...Object.keys(sandbox),
  `${app}\n;return { coverageLine, woundsScore, bandOf, projectedAfter, setVD: v => { VD = v; } };`);
const api = load(...Object.values(sandbox));

test('verdict footnote reports real coverage, never an invented percentile', () => {
  const line = api.coverageLine(
    { coverage: { scanned: 21, total: 21, complete: true }, chainsScanned: 21 },
    { unscannedChains: [] }, 3);
  assert.match(line, /3 KNIVES STILL IN · 21 CHAINS SCANNED/);
  assert.doesNotMatch(line, /84%/, 'the fabricated percentile must be gone');
});

test('a scan that lost chains is labelled partial and names them', () => {
  const line = api.coverageLine(
    { coverage: { scanned: 18, total: 21, complete: false } },
    { unscannedChains: ['Ethereum', 'Base', 'Arbitrum'] }, 0);
  assert.match(line, /^PARTIAL · 18\/21 CHAINS SCANNED/);
  assert.match(line, /ETHEREUM, BASE, ARBITRUM UNCHECKED/);
  assert.doesNotMatch(line, /NO OPEN WOUNDS/, 'incomplete coverage must never read as clean');
});

test('full coverage with nothing found says so explicitly', () => {
  const line = api.coverageLine({ coverage: { scanned: 21, total: 21, complete: true } }, { unscannedChains: [] }, 0);
  assert.match(line, /NO OPEN WOUNDS FOUND · 21\/21 CHAINS SCANNED/);
});

test('woundsScore mirrors the engine formula (one critical floors at 70)', () => {
  assert.equal(api.woundsScore([{ risk: 'critical' }]), 70);
  assert.equal(api.woundsScore([{ risk: 'high' }, { risk: 'low' }]), 21);
  assert.equal(api.woundsScore([]), 0);
  assert.equal(api.bandOf(70), 'COOKED');
  assert.equal(api.bandOf(31), 'MEDIUM RARE');
});

test('discharge score is the rubric over the wounds actually revoked', () => {
  const wounds = [
    { risk: 'critical', chainId: 1, token: '0xt1', spender: '0xs1' },
    { risk: 'high', chainId: 1, token: '0xt2', spender: '0xs2' },
  ];
  api.setVD({ score: 44, wounds, components: { exploitExposure: 34, ghostPortfolio: 0, behavioral: 0 } });

  const both = api.projectedAfter(['1:0xt1:0xs1', '1:0xt2:0xs2']);
  assert.equal(both.left, 0);
  assert.equal(both.score, Math.round(0 * 0.4 + 34 * 0.25), 'all wounds gone -> wounds component is 0');

  const one = api.projectedAfter(['1:0xt1:0xs1']);
  assert.equal(one.left, 1);
  assert.equal(one.score, Math.round(18 * 0.4 + 34 * 0.25), 'the remaining high still counts');
  assert.ok(one.score > both.score, 'revoking less must not look better');
});

test('projectedAfter refuses to invent a score without real components', () => {
  api.setVD(null);
  assert.equal(api.projectedAfter([]), null);
});
