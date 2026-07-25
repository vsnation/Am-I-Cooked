// world.test.js — the World ID verify mapping + action allow-list, exercised without a
// network round-trip (a stub fetch stands in for World's cloud verifier). Run:
//   node --test apps/api/world.test.js
import { test } from "node:test";
import assert from "node:assert/strict";

// world.js reads config from env at import time, so set it before importing.
process.env.WORLD_APP_ID = "app_" + "a".repeat(32);
process.env.WORLD_ACTION_LIVENESS = "surgeon-liveness";
process.env.WORLD_ACTION_RECOURSE = "recourse-eligibility";
const { verifyBody, verifyWorldProof, WORLD } = await import("./world.js");

const PROOF = { nullifier_hash: "0xnull", merkle_root: "0xroot", proof: "0xproof", verification_level: "orb" };
const okFetch = async () => ({ ok: true, json: async () => ({ success: true }) });
const failFetch = async () => ({ ok: false, status: 400, json: async () => ({ detail: "invalid proof" }) });
const throwFetch = async () => { throw new Error("network down"); };

test("verifyBody maps IDKit proof fields and defaults the level", () => {
  const b = verifyBody({ nullifier_hash: "a", merkle_root: "b", proof: "c" }, "surgeon-liveness");
  assert.equal(b.nullifier_hash, "a");
  assert.equal(b.merkle_root, "b");
  assert.equal(b.proof, "c");
  assert.equal(b.action, "surgeon-liveness");
  assert.equal(b.verification_level, "device"); // defaulted — device works for any World App user (no Orb)
  assert.equal("signal_hash" in b, false);   // omitted when no signal
  assert.equal(verifyBody(PROOF, "x", "0xsig").signal_hash, "0xsig"); // included when given
});

test("kindOf maps only the two configured actions", () => {
  assert.equal(WORLD.kindOf("surgeon-liveness"), "selfie");
  assert.equal(WORLD.kindOf("recourse-eligibility"), "identity");
  assert.equal(WORLD.kindOf("something-else"), null);
  assert.equal(WORLD.kindOf(undefined), null);
});

test("rejects an unknown action before calling out", async () => {
  let called = false;
  const v = await verifyWorldProof({ action: "nope", proof: PROOF }, async () => { called = true; return okFetch(); });
  assert.equal(v.verified, false);
  assert.equal(called, false); // never hits the network for an action we don't own
});

test("rejects an incomplete proof", async () => {
  const v = await verifyWorldProof({ action: "surgeon-liveness", proof: { nullifier_hash: "x" } }, okFetch);
  assert.equal(v.verified, false);
  assert.match(v.reason, /incomplete/);
});

test("Selfie Check verifies on a 200 and reports its kind", async () => {
  const v = await verifyWorldProof({ action: "surgeon-liveness", proof: PROOF }, okFetch);
  assert.equal(v.verified, true);
  assert.equal(v.kind, "selfie");
  assert.equal(v.nullifierHash, "0xnull");
  // a liveness check must not leak identity attributes
  assert.equal("over18" in v, false);
});

test("Identity Check yields exactly the two assurances World gives us", async () => {
  const v = await verifyWorldProof({ action: "recourse-eligibility", proof: PROOF }, okFetch);
  assert.equal(v.verified, true);
  assert.equal(v.kind, "identity");
  assert.equal(v.over18, true);
  assert.equal(v.idVerified, true);
});

test("a non-200 from the verifier is a hard fail with a reason", async () => {
  const v = await verifyWorldProof({ action: "surgeon-liveness", proof: PROOF }, failFetch);
  assert.equal(v.verified, false);
  assert.match(v.reason, /invalid proof/);
});

test("a network error never throws — it degrades to unverified", async () => {
  const v = await verifyWorldProof({ action: "surgeon-liveness", proof: PROOF }, throwFetch);
  assert.equal(v.verified, false);
  assert.match(v.reason, /unreachable/);
});
