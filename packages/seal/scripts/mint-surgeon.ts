// Mints the Surgeon's Agentic ID on 0G Galileo through SEAL's LiveBackend:
// metadata is encrypted client-side, stored on 0G Storage, and the chain holds
// its URI + keccak256. Requires OG_PRIVATE_KEY (funded) and OG_AGENT_CONTRACT
// (from deploy-agentic-id.ts). Run: bun scripts/mint-surgeon.ts
import { LiveBackend } from "../src/core";

const backend = new LiveBackend();
const meta = {
  role: "surgeon",
  purpose: "revokes dangerous ERC-20 approvals diagnosed by the wallet autopsy",
  authority: "acts only with World-verified human backing; the human signs every revoke",
  rubricHash: "0x81bb26fc5fc56e58b91e7c5433b320f214db29c6b34d46c427991403a493607e",
  chain: "0g-galileo-16602",
  mintedAt: new Date().toISOString(),
};
const t0 = Date.now();
const { agenticId, explorerUrl } = await backend.agentMint("The Surgeon", meta);
console.log(`agenticId   ${agenticId}`);
console.log(`explorer    ${explorerUrl}`);
console.log(`minted in   ${Date.now() - t0}ms`);
const loaded = await backend.agentLoad(agenticId);
console.log(`on-chain    encryptedURI ${String(loaded.meta.encryptedURI).slice(0, 40)}… · metadataHash ${loaded.meta.metadataHash}`);
