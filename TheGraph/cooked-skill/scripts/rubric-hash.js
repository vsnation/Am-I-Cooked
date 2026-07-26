// Prints the bytes32 rubricHash for the CookedRegistry constructor (t7 deploy).
// Hashes the rubric's git blob bytes (LF) — not the possibly-CRLF working-tree file —
// so the hash is stable across every teammate's checkout.
// Usage: node scripts/rubric-hash.js
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { keccak256 } from "js-sha3";

const path = new URL("../../../contracts/rubric.md", import.meta.url).pathname;
let bytes;
try {
  bytes = execFileSync("git", ["show", ":contracts/rubric.md"], { cwd: new URL("..", import.meta.url).pathname });
  console.error("source: git index blob (LF-normalized)");
} catch {
  bytes = readFileSync(path);
  console.error("source: working tree file (git unavailable) — verify endings are LF");
}
console.log(`0x${keccak256(bytes)}`);
