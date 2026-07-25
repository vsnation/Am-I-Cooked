// SEAL core — one interface, two backends. The MCP server and every example run
// against SealBackend; SEAL_MODE=stub|live picks the implementation at boot.
import { createHash } from "node:crypto";

export interface InferResult { output: string; attestation: string; txHash?: string }
export interface SealBackend {
  infer(prompt: string, model?: string): Promise<InferResult>;
  memoryPut(key: string, value: string): Promise<{ cid: string; encrypted: true }>;
  memoryGet(key: string): Promise<{ value: string | null }>;
  memoryList(prefix?: string): Promise<{ keys: string[] }>;
  agentMint(name: string, meta: Record<string, unknown>): Promise<{ agenticId: string; explorerUrl: string }>;
  agentLoad(agenticId: string): Promise<{ meta: Record<string, unknown>; memoryRoot: string }>;
  chainCall(to: string, data: string, value?: string): Promise<{ txHash: string }>;
  verify(attestation: string): Promise<{ valid: boolean; model: string; timestamp: number }>;
}

export const sha = (s: string) => createHash("sha256").update(s).digest("hex");

/**
 * Deterministic development backend. Attestations are self-consistent — verify()
 * validates exactly what infer() emits and rejects any tampering — so agent logic
 * built against this backend ports to the live 0G backend without code changes.
 */
export class StubBackend implements SealBackend {
  private mem = new Map<string, string>();
  private agents = new Map<string, { meta: Record<string, unknown>; memoryRoot: string }>();
  readonly model = "stub/deepseek-r1-tee";

  async infer(prompt: string, model?: string): Promise<InferResult> {
    const m = model ?? this.model;
    const ts = Date.now();
    const output = `[stub:${m}] scored input of ${prompt.length} chars`;
    const body = `${m}|${ts}|${sha(prompt + output)}`;
    return { output, attestation: `att1-${body}-${sha(body).slice(0, 16)}` };
  }
  async memoryPut(key: string, value: string) {
    this.mem.set(key, value);
    return { cid: `stubcid-${sha(key + value).slice(0, 24)}`, encrypted: true as const };
  }
  async memoryGet(key: string) { return { value: this.mem.get(key) ?? null }; }
  async memoryList(prefix = "") { return { keys: [...this.mem.keys()].filter(k => k.startsWith(prefix)) }; }
  async agentMint(name: string, meta: Record<string, unknown>) {
    const agenticId = `0g-agent-stub-${sha(name + JSON.stringify(meta)).slice(0, 12)}`;
    this.agents.set(agenticId, { meta: { name, ...meta }, memoryRoot: `root-${sha(agenticId).slice(0, 16)}` });
    return { agenticId, explorerUrl: `https://chainscan-galileo.0g.ai/agent/${agenticId}` };
  }
  async agentLoad(agenticId: string) {
    const a = this.agents.get(agenticId);
    if (!a) throw new Error(`unknown agenticId ${agenticId}`);
    return a;
  }
  async chainCall(to: string, data: string, value = "0") {
    return { txHash: `0xstub${sha(to + data + value).slice(0, 58)}` };
  }
  async verify(attestation: string) {
    const m = /^att1-(.+)-([0-9a-f]{16})$/.exec(attestation);
    if (!m) return { valid: false, model: "", timestamp: 0 };
    const [, body, mac] = m;
    const valid = sha(body).slice(0, 16) === mac;
    const [model, ts] = body.split("|");
    return { valid, model: valid ? model : "", timestamp: valid ? Number(ts) : 0 };
  }
}

/** Live 0G backend. Until credentials are configured, every method fails loudly
 *  naming its exact requirements — no silent fallbacks in live mode. */
export class LiveBackend implements SealBackend {
  private need(what: string): never {
    throw new Error(
      `SEAL live mode not wired yet: ${what}. Required env: OG_RPC_URL, OG_PRIVATE_KEY, ` +
      `OG_COMPUTE_ENDPOINT, OG_STORAGE_ENDPOINT.`
    );
  }
  async infer(): Promise<never> { this.need("0G Compute broker (TEE inference + attestation)"); }
  async memoryPut(): Promise<never> { this.need("0G Storage upload (client-side encryption)"); }
  async memoryGet(): Promise<never> { this.need("0G Storage download + decrypt"); }
  async memoryList(): Promise<never> { this.need("0G Storage index"); }
  async agentMint(): Promise<never> { this.need("0G Agentic ID (ERC-7857) mint"); }
  async agentLoad(): Promise<never> { this.need("0G Agentic ID metadata read"); }
  async chainCall(): Promise<never> { this.need("0G Chain transaction submission"); }
  async verify(): Promise<never> { this.need("0G Compute attestation verification"); }
}

export function makeBackend(): SealBackend {
  return (process.env.SEAL_MODE ?? "stub") === "live" ? new LiveBackend() : new StubBackend();
}
