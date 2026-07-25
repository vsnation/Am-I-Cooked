import { createHash } from "node:crypto";
const sha = (s) => createHash("sha256").update(s).digest("hex");
class StubBackend {
  mem = /* @__PURE__ */ new Map();
  agents = /* @__PURE__ */ new Map();
  model = "stub/deepseek-r1-tee";
  async infer(prompt, model) {
    const m = model ?? this.model;
    const ts = Date.now();
    const output = `[stub:${m}] scored input of ${prompt.length} chars`;
    const body = `${m}|${ts}|${sha(prompt + output)}`;
    return { output, attestation: `att1-${body}-${sha(body).slice(0, 16)}` };
  }
  async memoryPut(key, value) {
    this.mem.set(key, value);
    return { cid: `stubcid-${sha(key + value).slice(0, 24)}`, encrypted: true };
  }
  async memoryGet(key) {
    return { value: this.mem.get(key) ?? null };
  }
  async memoryList(prefix = "") {
    return { keys: [...this.mem.keys()].filter((k) => k.startsWith(prefix)) };
  }
  async agentMint(name, meta) {
    const agenticId = `0g-agent-stub-${sha(name + JSON.stringify(meta)).slice(0, 12)}`;
    this.agents.set(agenticId, { meta: { name, ...meta }, memoryRoot: `root-${sha(agenticId).slice(0, 16)}` });
    return { agenticId, explorerUrl: `https://chainscan-galileo.0g.ai/agent/${agenticId}` };
  }
  async agentLoad(agenticId) {
    const a = this.agents.get(agenticId);
    if (!a) throw new Error(`unknown agenticId ${agenticId}`);
    return a;
  }
  async chainCall(to, data, value = "0") {
    return { txHash: `0xstub${sha(to + data + value).slice(0, 58)}` };
  }
  /** Stub attestations are self-consistent by construction and carry NO trust claim —
   *  there is no enclave behind them. teeVerified is always false so nothing built on
   *  the stub can mistake a development record for a real one. */
  async verify(attestation) {
    const m = /^att1-(.+)-([0-9a-f]{16})$/.exec(attestation);
    if (!m) return { valid: false, model: "", timestamp: 0, integrity: false, teeVerified: false, reason: "not a stub attestation" };
    const [, body, mac] = m;
    const integrity = sha(body).slice(0, 16) === mac;
    const [model, ts] = body.split("|");
    return {
      valid: false,
      integrity,
      teeVerified: false,
      model: integrity ? model : "",
      timestamp: integrity ? Number(ts) : 0,
      reason: integrity ? "stub backend \u2014 self-consistent, but no TEE ran" : "integrity check failed"
    };
  }
}
class LiveBackend {
  rpcUrl = process.env.OG_RPC_URL || "https://evmrpc-testnet.0g.ai";
  indexerUrl = process.env.OG_STORAGE_ENDPOINT || "https://indexer-storage-testnet-turbo.0g.ai";
  brokerP;
  walletP;
  memIndex = /* @__PURE__ */ new Map();
  // key -> storage rootHash
  verified = /* @__PURE__ */ new Map();
  // attestation MAC -> TEE check result
  async wallet() {
    if (!this.walletP) this.walletP = (async () => {
      const pk = process.env.OG_PRIVATE_KEY;
      if (!pk) throw new Error("SEAL live mode: OG_PRIVATE_KEY not set (any funded Galileo testnet key)");
      const { ethers } = await import("ethers");
      return new ethers.Wallet(pk, new ethers.JsonRpcProvider(this.rpcUrl));
    })();
    return this.walletP;
  }
  async broker() {
    if (!this.brokerP) this.brokerP = (async () => {
      const wallet = await this.wallet();
      const { createZGComputeNetworkBroker } = await import("@0gfoundation/0g-compute-ts-sdk");
      return createZGComputeNetworkBroker(wallet);
    })();
    return this.brokerP;
  }
  async memCipherKey() {
    const pk = process.env.OG_PRIVATE_KEY;
    if (!pk) throw new Error("SEAL live mode: OG_PRIVATE_KEY not set (memory encryption key derives from it)");
    return createHash("sha256").update(pk + ":seal-mem").digest();
  }
  async infer(prompt, model) {
    const broker = await this.broker();
    const services = await broker.inference.listService();
    const pick = services.find((s) => (model ? s.model === model : true) && (s.serviceType === "chatbot" || !model)) ?? services[0];
    if (!pick) throw new Error("0G Compute: no services listed on testnet");
    const providerAddr = pick.provider;
    await broker.inference.acknowledgeProviderSigner(providerAddr).catch(() => {
    });
    const { endpoint, model: m } = await broker.inference.getServiceMetadata(providerAddr);
    const headers = await broker.inference.getRequestHeaders(providerAddr, prompt);
    const r = await fetch(`${endpoint}/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify({ messages: [{ role: "user", content: prompt }], model: m })
    });
    if (!r.ok) throw new Error(`0G Compute provider ${providerAddr}: HTTP ${r.status} ${(await r.text()).slice(0, 200)}`);
    const data = await r.json();
    const output = data.choices?.[0]?.message?.content ?? "";
    const chatID = r.headers.get("ZG-Res-Key") || data.id;
    const usage = JSON.stringify(data.usage ?? {});
    const valid = await broker.inference.processResponse(providerAddr, chatID, usage).catch(() => null);
    const body = `${m}|${Date.now()}|${providerAddr}|${chatID}|${sha(prompt + output)}`;
    const mac = sha(body).slice(0, 16);
    this.verified.set(mac, valid === true);
    return { output, attestation: `og1-${body}-${mac}` };
  }
  async memoryPut(key, value) {
    const { createCipheriv, randomBytes } = await import("node:crypto");
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", await this.memCipherKey(), iv);
    const ct = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
    const payload = Buffer.from(JSON.stringify({
      iv: iv.toString("base64"),
      tag: cipher.getAuthTag().toString("base64"),
      ct: ct.toString("base64")
    }));
    const { MemData, Indexer } = await import("@0gfoundation/0g-storage-ts-sdk");
    const data = new MemData(payload);
    const [tree, treeErr] = await data.merkleTree();
    if (treeErr) throw new Error(`0G Storage merkle: ${treeErr}`);
    const indexer = new Indexer(this.indexerUrl);
    const [tx, upErr] = await indexer.upload(data, this.rpcUrl, await this.wallet());
    if (upErr) throw new Error(`0G Storage upload: ${upErr}`);
    const cid = tx.rootHash ?? tree.rootHash();
    this.memIndex.set(key, cid);
    return { cid, encrypted: true };
  }
  async memoryGet(key) {
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
    return { keys: [...this.memIndex.keys()].filter((k) => k.startsWith(prefix)) };
  }
  async agentMint(name, meta) {
    const contractAddr = process.env.OG_AGENT_CONTRACT;
    if (!contractAddr) throw new Error("SEAL live mode: OG_AGENT_CONTRACT not set (deploy contracts/AgenticID.sol, see packages/seal/scripts)");
    const metaJson = JSON.stringify({ name, ...meta });
    const { cid } = await this.memoryPut(`agent:${name}:meta`, metaJson);
    const { ethers } = await import("ethers");
    const contract = new ethers.Contract(contractAddr, [
      "function mint(address to, string encryptedURI, bytes32 metadataHash) returns (uint256)",
      "event AgentMinted(uint256 indexed tokenId, address indexed to, string encryptedURI, bytes32 metadataHash)"
    ], await this.wallet());
    const tx = await contract.mint((await this.wallet()).address, `og-storage://${cid}`, ethers.keccak256(ethers.toUtf8Bytes(metaJson)));
    const receipt = await tx.wait();
    const minted = receipt.logs.map((l) => {
      try {
        return contract.interface.parseLog(l);
      } catch {
        return null;
      }
    }).find((l) => l?.name === "AgentMinted");
    const tokenId = minted?.args?.tokenId?.toString() ?? "0";
    return {
      agenticId: `${contractAddr}:${tokenId}`,
      explorerUrl: `https://chainscan-galileo.0g.ai/tx/${receipt.hash}`
    };
  }
  async agentLoad(agenticId) {
    const [contractAddr, tokenId] = agenticId.split(":");
    const { ethers } = await import("ethers");
    const contract = new ethers.Contract(contractAddr, [
      "function encryptedURI(uint256) view returns (string)",
      "function metadataHash(uint256) view returns (bytes32)"
    ], await this.wallet());
    const [uri, hash] = await Promise.all([contract.encryptedURI(tokenId), contract.metadataHash(tokenId)]);
    return { meta: { encryptedURI: uri, metadataHash: hash }, memoryRoot: uri.replace("og-storage://", "") };
  }
  async chainCall(to, data, value = "0") {
    const wallet = await this.wallet();
    const tx = await wallet.sendTransaction({ to, data, value: BigInt(value) });
    const receipt = await tx.wait();
    return { txHash: receipt.hash };
  }
  /** The `-<mac>` suffix is an UNKEYED hash of the record's own bytes: it detects
   *  corruption, and nothing else. Anyone can compute it, so it can never establish that
   *  a TEE ran. Only `this.verified` — set when processResponse checked the provider's
   *  signature at response time — carries that claim. An attestation this process did
   *  not witness is therefore reported unverified, with the provider and chatID embedded
   *  in the body so an auditor can re-check it upstream. */
  async verify(attestation) {
    const m = /^og1-(.+)-([0-9a-f]{16})$/.exec(attestation);
    if (!m) return { valid: false, model: "", timestamp: 0, integrity: false, teeVerified: null, reason: "not a 0G attestation" };
    const [, body, mac] = m;
    const integrity = sha(body).slice(0, 16) === mac;
    const teeVerified = this.verified.has(mac) ? this.verified.get(mac) : null;
    const [model, ts, provider, chatID] = body.split("|");
    const valid = integrity && teeVerified === true;
    const reason = !integrity ? "integrity check failed" : teeVerified === true ? void 0 : teeVerified === false ? "TEE signature check failed at response time" : `not witnessed by this process \u2014 re-check chatID ${chatID} with provider ${provider}`;
    return { valid, integrity, teeVerified, model: integrity ? model : "", timestamp: integrity ? Number(ts) : 0, reason };
  }
}
function makeBackend() {
  return (process.env.SEAL_MODE ?? "stub") === "live" ? new LiveBackend() : new StubBackend();
}
export {
  LiveBackend,
  StubBackend,
  makeBackend,
  sha
};
