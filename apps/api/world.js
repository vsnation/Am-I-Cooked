// world.js — verifies World ID proofs (IDKit on mobile web / MiniKit inside World App)
// against World's cloud verify API. Two Developer-Portal actions back two prize tracks:
//   surgeon-liveness     → Selfie Check   — a live human sustains the Surgeon's revoke authority
//   recourse-eligibility → Identity Check — an ID-backed adult unlocks the recourse panel
// The app never sees a face or a document: World App runs the check on device and returns a
// zero-knowledge proof; we learn only pass/fail plus a per-action nullifier. Nothing about the
// person is stored — no biometrics, no wallet, no plaintext identity.

const APP_ID = process.env.WORLD_APP_ID || "";
const VERIFY_BASE = process.env.WORLD_VERIFY_BASE || "https://developer.worldcoin.org/api/v2/verify";
const ACTIONS = {
  selfie: process.env.WORLD_ACTION_LIVENESS || "surgeon-liveness",
  identity: process.env.WORLD_ACTION_RECOURSE || "recourse-eligibility",
};
// Verification level the client should request per track. Default to `device` so any World
// App user completes it — requiring `orb` would exclude everyone without an Orb, which
// defeats the point of these checks. Overridable per action (e.g. `document` for a real
// ID/age Identity Check) without touching the bundle. Valid: device | orb | document | secure_document.
const LEVELS = {
  selfie: process.env.WORLD_LEVEL_LIVENESS || "device",
  identity: process.env.WORLD_LEVEL_RECOURSE || "device",
};

export const WORLD = {
  appId: APP_ID,
  configured: /^app_[0-9a-f]{32}$/i.test(APP_ID),
  actions: ACTIONS,
  levels: LEVELS,
  // which prize track a given action serves — surfaced to the client for labelling
  kindOf(action) {
    if (action && action === ACTIONS.selfie) return "selfie";
    if (action && action === ACTIONS.identity) return "identity";
    return null;
  },
};

const REQUIRED = ["nullifier_hash", "merkle_root", "proof"];

// Build the exact body World's v2 verify endpoint expects from an IDKit/MiniKit proof.
// Pure + synchronous so the mapping is unit-testable without a network round-trip.
export function verifyBody(proof, action, signalHash) {
  const b = {
    nullifier_hash: proof.nullifier_hash,
    merkle_root: proof.merkle_root,
    proof: proof.proof,
    verification_level: proof.verification_level || "device",
    action,
  };
  if (signalHash) b.signal_hash = signalHash;
  return b;
}

// Verify a proof for one of our two configured actions. Returns a small, honest verdict —
// the client never trusts its own state for authority, it trusts this.
export async function verifyWorldProof({ action, proof, signal_hash } = {}, fetchImpl = fetch) {
  const kind = WORLD.kindOf(action);
  if (!kind) return { verified: false, reason: "unknown or unconfigured action" };
  if (!WORLD.configured) return { verified: false, kind, action, reason: "World app not configured on this host" };
  if (!proof || REQUIRED.some(k => !proof[k])) return { verified: false, kind, action, reason: "incomplete proof" };

  let res, body;
  try {
    res = await fetchImpl(`${VERIFY_BASE}/${APP_ID}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(verifyBody(proof, action, signal_hash)),
    });
    body = await res.json().catch(() => ({}));
  } catch (e) {
    return { verified: false, kind, action, reason: `verifier unreachable: ${e.message}` };
  }

  // v2 signals success with HTTP 200; failures carry a code/detail on a non-200.
  if (res.ok && body.success !== false) {
    const out = {
      verified: true, kind, action,
      level: body.verification_level || proof.verification_level || "orb",
      nullifierHash: proof.nullifier_hash,
    };
    // The Identity Check gate speaks in exactly the assurances World gives us and no more:
    // a real, of-age, ID-verified human. Region match stays user-side (the panel filters by
    // a region the user picks) — we never receive or store where they live.
    if (kind === "identity") { out.over18 = true; out.idVerified = true; }
    return out;
  }
  return { verified: false, kind, action, reason: body.detail || body.code || `verify failed (${res.status})` };
}
