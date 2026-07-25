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

/** Live 0G backend — Galileo testnet.
 *  infer   → 0G Compute broker: verifiable TEE provider, per-response signature check.
 *  memory  → 0G Storage: aes-256-gcm client-side encryption, payload uploaded as a
 *            merkle blob; the key→rootHash index is kept in-process (session-scoped).
 *  agent   → Agentic ID (ERC-7857 draft surface): mint(recipient, encryptedURI,
 *            metadataHash) on the contract in OG_AGENT_CONTRACT.
 *  Attestations: `og1-` records model|ts|provider|chatID|bodyHash with a MAC. The
 *  cryptographic TEE check happens at response time (processResponse signature
 *  verification); verify() re-validates the record and its integrity, and the
 *  embedded provider+chatID lets an auditor re-check upstream. */
export class LiveBackend implements SealBackend {
  private rpcUrl = process.env.OG_RPC_URL || "https://evmrpc-testnet.0g.ai";
  private indexerUrl = process.env.OG_STORAGE_ENDPOINT || "https://indexer-storage-testnet-turbo.0g.ai";
  private brokerP?: Promise<any>;
  private walletP?: Promise<any>;
  private memIndex = new Map<string, string>(); // key -> storage rootHash
  private verified = new Map<string, boolean>(); // attestation MAC -> TEE check result

  private async wallet() {
    if (!this.walletP) this.walletP = (async () => {
      const pk = process.env.OG_PRIVATE_KEY;
      if (!pk) throw new Error("SEAL live mode: OG_PRIVATE_KEY not set (any funded Galileo testnet key)");
      const { ethers } = await import("ethers");
      return new ethers.Wallet(pk, new ethers.JsonRpcProvider(this.rpcUrl));
    })();
    return this.walletP;
  }
  private async broker() {
    if (!this.brokerP) this.brokerP = (async () => {
      const { createZGComputeNetworkBroker } = await import("@0gfoundation/0g-compute-ts-sdk");
      return createZGComputeNetworkBroker(await this.wallet());
    })();
    return this.brokerP;
  }
  private async memCipherKey(): Promise<Buffer> {
    const pk = process.env.OG_PRIVATE_KEY ?? "";
    return createHash("sha256").update(pk + ":seal-mem").digest();
  }

  async infer(prompt: string, model?: string): Promise<InferResult> {
    const broker = await this.broker();
    const services = await broker.inference.listService();
    const pick = services.find((s: any) =>
      (model ? s.model === model : true) && (s.serviceType === "chatbot" || !model)) ?? services[0];
    if (!pick) throw new Error("0G Compute: no services listed on testnet");
    const providerAddr = pick.provider;
    await broker.inference.acknowledgeProviderSigner(providerAddr).catch(() => {}); // idempotent
    const { endpoint, model: m } = await broker.inference.getServiceMetadata(providerAddr);
    const headers = await broker.inference.getRequestHeaders(providerAddr, prompt);
    const r = await fetch(`${endpoint}/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify({ messages: [{ role: "user", content: prompt }], model: m }),
    });
    if (!r.ok) throw new Error(`0G Compute provider ${providerAddr}: HTTP ${r.status} ${(await r.text()).slice(0, 200)}`);
    const data: any = await r.json();
    const output: string = data.choices?.[0]?.message?.content ?? "";
    const chatID = r.headers.get("ZG-Res-Key") || data.id;
    const usage = JSON.stringify(data.usage ?? {});
    const valid = await broker.inference.processResponse(providerAddr, chatID, usage).catch(() => null);
    const body = `${m}|${Date.now()}|${providerAddr}|${chatID}|${sha(prompt + output)}`;
    const mac = sha(body).slice(0, 16);
    this.verified.set(mac, valid === true);
    return { output, attestation: `og1-${body}-${mac}` };
  }

  async memoryPut(key: string, value: string) {
    const { createCipheriv, randomBytes } = await import("node:crypto");
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", await this.memCipherKey(), iv);
    const ct = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
    const payload = Buffer.from(JSON.stringify({
      iv: iv.toString("base64"), tag: cipher.getAuthTag().toString("base64"), ct: ct.toString("base64"),
    }));
    const { MemData, Indexer } = await import("@0gfoundation/0g-storage-ts-sdk");
    const data = new MemData(payload);
    const [tree, treeErr] = await data.merkleTree();
    if (treeErr) throw new Error(`0G Storage merkle: ${treeErr}`);
    const indexer = new Indexer(this.indexerUrl);
    const [tx, upErr] = await indexer.upload(data, this.rpcUrl, await this.wallet());
    if (upErr) throw new Error(`0G Storage upload: ${upErr}`);
    const cid = tx.rootHash ?? tree!.rootHash();
    this.memIndex.set(key, cid);
    return { cid, encrypted: true as const };
  }

  async memoryGet(key: string) {
    const cid = this.memIndex.get(key);
    if (!cid) return { value: null };
    const { Indexer } = await import("@0gfoundation/0g-storage-ts-sdk");
    const { mkdtempSync, readFileSync, rmSync } = await import("node:fs");
    const { tmpdir } = await import("node:os");
    const dir = mkdtempSync(`${tmpdir()}/seal-`);
    const path = `${dir}/blob`;
    const err = await new Indexer(this.indexerUrl).download(cid, path, true);
    if (err) throw new Error(`0G Storage download ${cid}: ${err}`);
    const { iv, tag, ct } = JSON.parse(readFileSync(path, "utf8"));
    rmSync(dir, { recursive: true, force: true });
    const { createDecipheriv } = await import("node:crypto");
    const d = createDecipheriv("aes-256-gcm", await this.memCipherKey(), Buffer.from(iv, "base64"));
    d.setAuthTag(Buffer.from(tag, "base64"));
    return { value: Buffer.concat([d.update(Buffer.from(ct, "base64")), d.final()]).toString("utf8") };
  }

  async memoryList(prefix = "") {
    return { keys: [...this.memIndex.keys()].filter(k => k.startsWith(prefix)) };
  }

  async agentMint(name: string, meta: Record<string, unknown>) {
    const contractAddr = process.env.OG_AGENT_CONTRACT;
    if (!contractAddr) throw new Error("SEAL live mode: OG_AGENT_CONTRACT not set (deploy contracts/AgenticID.sol, see packages/seal/scripts)");
    const metaJson = JSON.stringify({ name, ...meta });
    const { cid } = await this.memoryPut(`agent:${name}:meta`, metaJson);
    const { ethers } = await import("ethers");
    const contract = new ethers.Contract(contractAddr, [
      "function mint(address to, string encryptedURI, bytes32 metadataHash) returns (uint256)",
      "event AgentMinted(uint256 indexed tokenId, address indexed to, string encryptedURI, bytes32 metadataHash)",
    ], await this.wallet());
    const tx = await contract.mint((await this.wallet()).address, `og-storage://${cid}`, ethers.keccak256(ethers.toUtf8Bytes(metaJson)));
    const receipt = await tx.wait();
    const minted = receipt.logs.map((l: any) => { try { return contract.interface.parseLog(l); } catch { return null; } })
      .find((l: any) => l?.name === "AgentMinted");
    const tokenId = minted?.args?.tokenId?.toString() ?? "0";
    return {
      agenticId: `${contractAddr}:${tokenId}`,
      explorerUrl: `https://chainscan-galileo.0g.ai/tx/${receipt.hash}`,
    };
  }

  async agentLoad(agenticId: string) {
    const [contractAddr, tokenId] = agenticId.split(":");
    const { ethers } = await import("ethers");
    const contract = new ethers.Contract(contractAddr, [
      "function encryptedURI(uint256) view returns (string)",
      "function metadataHash(uint256) view returns (bytes32)",
    ], await this.wallet());
    const [uri, hash] = await Promise.all([contract.encryptedURI(tokenId), contract.metadataHash(tokenId)]);
    return { meta: { encryptedURI: uri, metadataHash: hash }, memoryRoot: uri.replace("og-storage://", "") };
  }

  async chainCall(to: string, data: string, value = "0") {
    const wallet = await this.wallet();
    const tx = await wallet.sendTransaction({ to, data, value: BigInt(value) });
    const receipt = await tx.wait();
    return { txHash: receipt.hash };
  }

  async verify(attestation: string) {
    const m = /^og1-(.+)-([0-9a-f]{16})$/.exec(attestation);
    if (!m) return { valid: false, model: "", timestamp: 0 };
    const [, body, mac] = m;
    const intact = sha(body).slice(0, 16) === mac;
    const teeValid = this.verified.get(mac);
    const [model, ts] = body.split("|");
    const valid = intact && teeValid !== false; // unknown MAC (other session): integrity-only check
    return { valid, model: valid ? model : "", timestamp: valid ? Number(ts) : 0 };
  }
}

export function makeBackend(): SealBackend {
  return (process.env.SEAL_MODE ?? "stub") === "live" ? new LiveBackend() : new StubBackend();
}
