// 0G desk check — verifies every live surface SEAL depends on, deepest first:
// chain RPC → Compute service marketplace → provider endpoints → Storage indexer →
// wallet funding → (when funded) real TEE inference + verification + encrypted memory
// round-trip through the LiveBackend. Run: bun examples/desk-check.ts
import { LiveBackend } from "../src/core";

const RPC = process.env.OG_RPC_URL || "https://evmrpc-testnet.0g.ai";
const INDEXER = process.env.OG_STORAGE_ENDPOINT || "https://indexer-storage-testnet-turbo.0g.ai";
const pass = (n: string, d: string) => console.log(`PASS  ${n} — ${d}`);
const fail = (n: string, d: string) => { console.log(`FAIL  ${n} — ${d}`); process.exitCode = 1; };

// 1 · chain RPC
const rpc = async (method: string, params: unknown[] = []) =>
  (await (await fetch(RPC, { method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) })).json()).result;
const chainId = parseInt(await rpc("eth_chainId"), 16);
const block = parseInt(await rpc("eth_blockNumber"), 16);
chainId === 16602
  ? pass("0G Chain RPC", `${RPC} · chainId ${chainId} (Galileo) · block ${block}`)
  : fail("0G Chain RPC", `unexpected chainId ${chainId}`);

// 2 · Compute marketplace (read-only, no wallet needed)
const { createZGComputeNetworkReadOnlyBroker } = await import("@0gfoundation/0g-compute-ts-sdk");
const ro = await createZGComputeNetworkReadOnlyBroker(RPC);
const services = await ro.inference.listService();
services.length
  ? pass("0G Compute marketplace", `${services.length} services on-chain`)
  : fail("0G Compute marketplace", "no services listed");
for (const s of services.slice(0, 6))
  console.log(`      · ${s.model} @ ${s.provider.slice(0, 10)}… · ${s.serviceType} · verifiability: ${s.verifiability || "none"} · ${s.url}`);

// 3 · provider endpoint reachability
const first = services[0];
if (first) {
  try {
    const r = await fetch(first.url, { method: "GET" });
    pass("Compute provider endpoint", `${first.url} reachable (HTTP ${r.status})`);
  } catch (e: any) { fail("Compute provider endpoint", `${first.url}: ${e.message}`); }
}

// 4 · Storage indexer
try {
  const r = await fetch(INDEXER, { method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "indexer_getShardedNodes", params: [] }) });
  const j: any = await r.json();
  pass("0G Storage indexer", `${INDEXER} responding (${j.result ? "nodes listed" : `HTTP ${r.status}`})`);
} catch (e: any) { fail("0G Storage indexer", e.message); }

// 5 · wallet
const pk = process.env.OG_PRIVATE_KEY;
if (!pk) { fail("wallet", "OG_PRIVATE_KEY not set"); process.exit(1); }
const { ethers } = await import("ethers");
const wallet = new ethers.Wallet(pk, new ethers.JsonRpcProvider(RPC));
const bal = await wallet.provider!.getBalance(wallet.address);
console.log(`      wallet ${wallet.address} · balance ${ethers.formatEther(bal)} OG`);
if (bal === 0n) {
  console.log(`\nNEXT  fund via https://faucet.0g.ai (promo ETH-LISBON-26) → re-run for the live-path checks`);
  process.exit(0);
}
pass("wallet funded", `${ethers.formatEther(bal)} OG`);

// 6 · live path: ledger + TEE inference + verification + encrypted memory round-trip
const live = new LiveBackend();
const { createZGComputeNetworkBroker } = await import("@0gfoundation/0g-compute-ts-sdk");
const broker = await createZGComputeNetworkBroker(wallet);
try {
  const ledger = await broker.ledger.getLedger();
  pass("compute ledger", `exists · balance ${ethers.formatEther(ledger.totalBalance ?? ledger[1] ?? 0n)} OG`);
} catch {
  const dep = Number(process.env.OG_LEDGER_DEPOSIT || 0.1);
  await broker.ledger.addLedger(dep);
  pass("compute ledger", `created with ${dep} OG deposit`);
}
const t0 = Date.now();
const res = await live.infer("Reply with exactly: SEAL-LIVE-OK");
pass("TEE inference", `${Date.now() - t0}ms · output: ${JSON.stringify(res.output.slice(0, 60))}`);
const v = await live.verify(res.attestation);
v.valid
  ? pass("attestation verify", `model ${v.model} · ts ${v.timestamp}`)
  : fail("attestation verify", res.attestation.slice(0, 60));

const putT = Date.now();
const { cid } = await live.memoryPut("desk-check", `sealed at block ${block}`);
pass("0G Storage upload (encrypted)", `root ${cid.slice(0, 18)}… · ${Date.now() - putT}ms`);
const got = await live.memoryGet("desk-check");
got.value === `sealed at block ${block}`
  ? pass("0G Storage round-trip", "downloaded + decrypted, byte-exact")
  : fail("0G Storage round-trip", String(got.value));

console.log("\ndesk check complete");
