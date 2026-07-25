import { describe, expect, test } from "bun:test";
import { StubBackend } from "../src/core.js";

describe("SEAL core (stub backend — same interface live mode must satisfy)", () => {
  test("infer returns output + verifiable attestation", async () => {
    const s = new StubBackend();
    const r = await s.infer("am i cooked?");
    expect(r.output).toContain("scored input");
    const v = await s.verify(r.attestation);
    expect(v.valid).toBe(true);
    expect(v.model).toBe(s.model);
    expect(v.timestamp).toBeGreaterThan(0);
  });

  test("tampered attestation fails verification", async () => {
    const s = new StubBackend();
    const r = await s.infer("x");
    const forged = r.attestation.replace(/.$/, c => (c === "a" ? "b" : "a"));
    expect((await s.verify(forged)).valid).toBe(false);
    expect((await s.verify("att1-garbage")).valid).toBe(false);
    expect((await s.verify("")).valid).toBe(false);
  });

  test("memory roundtrip + prefix list", async () => {
    const s = new StubBackend();
    await s.memoryPut("scan:0xabc", "cooked:68");
    await s.memoryPut("scan:0xdef", "cooked:12");
    await s.memoryPut("other", "x");
    expect((await s.memoryGet("scan:0xabc")).value).toBe("cooked:68");
    expect((await s.memoryGet("missing")).value).toBeNull();
    expect((await s.memoryList("scan:")).keys.sort()).toEqual(["scan:0xabc", "scan:0xdef"]);
    const cid = await s.memoryPut("scan:0xabc", "cooked:68");
    expect(cid.encrypted).toBe(true);
  });

  test("agent mint → load roundtrip; unknown id throws", async () => {
    const s = new StubBackend();
    const { agenticId, explorerUrl } = await s.agentMint("surgeon", { role: "revoker" });
    expect(explorerUrl).toContain(agenticId);
    const loaded = await s.agentLoad(agenticId);
    expect(loaded.meta.name).toBe("surgeon");
    expect(loaded.memoryRoot).toMatch(/^root-/);
    await expect(s.agentLoad("nope")).rejects.toThrow();
  });

  test("chain call returns deterministic tx hash", async () => {
    const s = new StubBackend();
    const a = await s.chainCall("0x1", "0xdead");
    const b = await s.chainCall("0x1", "0xdead");
    expect(a.txHash).toBe(b.txHash);
    expect(a.txHash).toMatch(/^0xstub/);
  });

  test("live mode fails loudly with the exact requirements", async () => {
    process.env.SEAL_MODE = "live";
    const { makeBackend } = await import("../src/core.js");
    const live = makeBackend();
    await expect(live.infer("x")).rejects.toThrow(/OG_RPC_URL/);
    process.env.SEAL_MODE = "stub";
  });
});
