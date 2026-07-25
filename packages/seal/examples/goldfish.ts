#!/usr/bin/env bun
// goldfish — the minimal SEAL agent (~20 lines of logic): mints an identity, thinks
// privately in a TEE, remembers forever, and can prove every answer. The joke: a
// goldfish with permanent memory. Runs on the stub backend today, live 0G tomorrow —
// zero code changes, that's the point of SEAL.
import { makeBackend } from "../src/core.js";

const seal = makeBackend();

const { agenticId, explorerUrl } = await seal.agentMint("goldfish", { species: "carassius", memory: "infinite" });
console.log("1· minted    ", agenticId, "→", explorerUrl);

const thought = await seal.infer("Rate the vibes of wallet 0x4c…e9f2 in one word.");
console.log("2· inferred  ", thought.output);

await seal.memoryPut("goldfish:lastThought", thought.output);
const recalled = await seal.memoryGet("goldfish:lastThought");
console.log("3· remembered", recalled.value);

const proof = await seal.verify(thought.attestation);
console.log("4· proved    ", proof.valid ? `✓ ran on ${proof.model} @ ${new Date(proof.timestamp).toISOString()}` : "✗ INVALID");

if (!proof.valid || recalled.value !== thought.output) { console.error("goldfish is broken"); process.exit(1); }
console.log("goldfish remembers everything and can prove it. 🐟");
