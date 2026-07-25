import { test } from "node:test";
import assert from "node:assert/strict";
import { AlarmEngine } from "./alarm.js";

test("dust pools never alarm", () => {
  let t = 0; const e = new AlarmEngine({ now: () => t });
  e.observe({ poolId: "d", pair: "A/B", tvlUSD: 5000 }); t += 60000;
  e.observe({ poolId: "d", tvlUSD: 50 });
  assert.equal(e.active().length, 0);
});

test("large pool drop past threshold raises a severity-scaled alarm", () => {
  let t = 0; const e = new AlarmEngine({ now: () => t });
  e.observe({ poolId: "p", protocol: "Big", pair: "USDC/WETH", tvlUSD: 5_000_000 }); t += 120000;
  const a = e.observe({ poolId: "p", tvlUSD: 1_500_000 });
  assert.equal(a.severity, "critical");
  assert.equal(a.dropPct, 70);
});

test("small drop below threshold does not alarm", () => {
  let t = 0; const e = new AlarmEngine({ now: () => t });
  e.observe({ poolId: "p", pair: "X/Y", tvlUSD: 1_000_000 }); t += 60000;
  assert.equal(e.observe({ poolId: "p", tvlUSD: 900_000 }), null); // 10% < 25%
});

test("exposure matching: only alarms the wallet is exposed to", () => {
  let t = 0; const e = new AlarmEngine({ now: () => t });
  e.observe({ poolId: "p", protocol: "Big", pair: "USDC/WETH", tvlUSD: 5_000_000 }); t += 120000;
  e.observe({ poolId: "p", tvlUSD: 1_000_000 });
  const exposed = { surfaces: { dex: { lpPositions: [{ pair: "USDC/WETH" }] }, lending: [], approvals: { items: [] }, incidents: { matches: [] } } };
  const notExposed = { surfaces: { dex: { lpPositions: [{ pair: "DAI/FRAX" }] }, lending: [], approvals: { items: [] }, incidents: { matches: [] } } };
  assert.equal(e.forExposure(exposed).length, 1);
  assert.equal(e.forExposure(notExposed).length, 0);
});

test("stale alarms drop out of the active feed", () => {
  let t = 0; const e = new AlarmEngine({ now: () => t });
  e.observe({ poolId: "p", pair: "A/B", tvlUSD: 5_000_000 }); t += 120000;
  e.observe({ poolId: "p", tvlUSD: 1_000_000 });
  assert.equal(e.active().length, 1);
  t += 13 * 60 * 1000; // past the window with no updates
  assert.equal(e.active().length, 0);
});
