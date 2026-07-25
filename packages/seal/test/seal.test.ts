import { describe, expect, test } from "bun:test";
import { StubBackend } from "../src/core.js";

describe("SEAL core (stub backend — same interface live mode must satisfy)", () => {
  test("infer returns output + an integral attestation that claims no TEE", async () => {
    const s = new StubBackend();
    const r = await s.infer("am i cooked?");
    expect(r.output).toContain("scored input");
    const v = await s.verify(r.attestation);
    expect(v.integrity).toBe(true);
    expect(v.model).toBe(s.model);
    expect(v.timestamp).toBeGreaterThan(0);
    // The stub has no enclave behind it. Reporting valid=true here is what let a
    // development record pass for a real one downstream.
    expect(v.valid).toBe(false);
    expect(v.teeVerified).toBe(false);
  });

  test("tampered attestation fails the integrity check", async () => {
    const s = new StubBackend();
    const r = await s.infer("x");
    const forged = r.attestation.replace(/.$/, c => (c === "a" ? "b" : "a"));
    expect((await s.verify(forged)).integrity).toBe(false);
    expect((await s.verify("att1-garbage")).integrity).toBe(false);
    expect((await s.verify("")).integrity).toBe(false);
    for (const bad of [forged, "att1-garbage", ""]) expect((await s.verify(bad)).valid).toBe(false);
  });

  test("a hand-forged record is never valid — the MAC is unkeyed, so integrity is not proof", async () => {
    const { LiveBackend } = await import("../src/core.js");
    const live = new LiveBackend();
    // Anyone can build a well-formed record: the suffix is sha256 of the body, no secret.
    const { createHash } = await import("node:crypto");
    const body = "deepseek-r1|1700000000|0xprovider|chat-123|" + "0".repeat(64);
    const mac = createHash("sha256").update(body).digest("hex").slice(0, 16);
    const v = await live.verify(`og1-${body}-${mac}`);
    expect(v.integrity).toBe(true);   // it IS well-formed…
    expect(v.valid).toBe(false);      // …and that proves nothing
    expect(v.teeVerified).toBeNull();
    expect(v.reason).toContain("not witnessed by this process");
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
    const pk = process.env.OG_PRIVATE_KEY;
    delete process.env.OG_PRIVATE_KEY;
    const { makeBackend } = await import("../src/core.js");
    const live = makeBackend();
    await expect(live.infer("x")).rejects.toThrow(/OG_PRIVATE_KEY/);
    if (pk) process.env.OG_PRIVATE_KEY = pk;
    process.env.SEAL_MODE = "stub";
  });
});
