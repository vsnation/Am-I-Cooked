// surgeon — the AgentKit human-backing gate. The Surgeon is an agent with a wallet;
// that wallet is registered once in AgentBook (via `@worldcoin/agentkit-cli register`,
// approved in World App). This gate verifies, per request, whether the calling agent is
// human-backed and returns its authority tier. Anonymous/unregistered → diagnose only;
// human-backed → revoke authority. A safety interlock on autonomous financial authority,
// not a perk. We never hold the user's keys — the human signs each revoke in their wallet.
import { createAgentBookVerifier, createAgentkitHooks, createAgentkitClient, InMemoryAgentKitStorage } from "@worldcoin/agentkit";
import { privateKeyToAccount } from "viem/accounts";

const WORLD_RPC = process.env.WORLD_RPC_URL || "https://worldchain-mainnet.gateway.tenderly.co";
const AGENT_ADDRESS = process.env.SURGEON_AGENT_ADDRESS || null;

let hooks = null;
try {
  const agentBook = createAgentBookVerifier();
  hooks = createAgentkitHooks({
    agentBook,
    storage: new InMemoryAgentKitStorage(),
    mode: { type: "free" },        // human-backed agents get access; others do not
    rpcUrl: WORLD_RPC,
  });
} catch (e) {
  console.error("[surgeon] AgentKit hooks init failed:", e.message);
}

// The Surgeon agent, able to sign AgentKit requests with its own wallet — used to probe
// its own AgentBook registration status (granted iff the wallet is registered).
let selfClient = null;
if (process.env.SURGEON_AGENT_KEY) {
  try {
    const acct = privateKeyToAccount(process.env.SURGEON_AGENT_KEY);
    selfClient = createAgentkitClient({
      signer: { address: acct.address, chainId: "eip155:480", type: "eip191",
        signMessage: (message) => acct.signMessage({ message }) },
    });
  } catch (e) { console.error("[surgeon] self client init failed:", e.message); }
}

/** The Surgeon signs a request to its own backend; granted iff its wallet is human-backed. */
export async function surgeonSelfCheck(probeUrl) {
  if (!selfClient) return { granted: false, reason: "no agent key configured" };
  try { const r = await selfClient.fetch(probeUrl); return { granted: r.ok, status: r.status }; }
  catch (e) { return { granted: false, reason: e.message }; }
}

const ANON = { tier: "anonymous", authority: [], granted: false };

/** Verify the calling agent's human-backing from its AgentKit auth header. */
export async function surgeonAuthorize({ headers, url }) {
  if (!hooks) return { ...ANON, reason: "AgentKit unavailable" };
  const adapter = {
    getHeader: (name) => headers[String(name).toLowerCase()],
    getUrl: () => url,
  };
  try {
    const res = await hooks.requestHook({ adapter, path: new URL(url, "http://x").pathname });
    if (res && res.grantAccess) {
      return { tier: "human-backed", authority: ["revoke"], granted: true, agent: AGENT_ADDRESS };
    }
    return { ...ANON, reason: "agent is not human-backed in AgentBook", agent: AGENT_ADDRESS };
  } catch (e) {
    return { ...ANON, reason: e.message, agent: AGENT_ADDRESS };
  }
}

/** Public status for the UI: who the Surgeon agent is and whether it can be verified. */
export function surgeonStatus() {
  return {
    agent: AGENT_ADDRESS,
    agentBook: hooks ? "ready" : "unavailable",
    worldChainRpc: WORLD_RPC,
    ladder: {
      anonymous: "diagnose + prescribe only — zero signing authority",
      humanBacked: "revoke approvals (defensive) — the human signs each tx in their wallet",
    },
  };
}
