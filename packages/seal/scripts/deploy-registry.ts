// Deploys CookedRegistry to 0G Galileo with the canonical rubric hash (computed
// from contracts/rubric.md, never hardcoded) and the sealed-judge backend account
// as the only authorized submitter. Run: bun scripts/deploy-registry.ts
import { readFileSync } from "node:fs";
import { ethers } from "ethers";
import solc from "solc";

const RPC = process.env.OG_RPC_URL || "https://evmrpc-testnet.0g.ai";
const pk = process.env.OG_PRIVATE_KEY;
if (!pk) { console.error("OG_PRIVATE_KEY not set"); process.exit(1); }

const rubric = readFileSync(new URL("../../../contracts/rubric.md", import.meta.url), "utf8");
const rubricHash = ethers.keccak256(ethers.toUtf8Bytes(rubric));
console.log(`rubricHash ${rubricHash} (keccak256 of contracts/rubric.md)`);

const source = readFileSync(new URL("../../../contracts/CookedRegistry.sol", import.meta.url), "utf8");
const out = JSON.parse(solc.compile(JSON.stringify({
  language: "Solidity",
  sources: { "CookedRegistry.sol": { content: source } },
  settings: { optimizer: { enabled: true, runs: 200 }, outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } } },
})));
const errors = (out.errors ?? []).filter((e: any) => e.severity === "error");
if (errors.length) { console.error(errors.map((e: any) => e.formattedMessage).join("\n")); process.exit(1); }

const wallet = new ethers.Wallet(pk, new ethers.JsonRpcProvider(RPC));
const c = out.contracts["CookedRegistry.sol"]["CookedRegistry"];
const factory = new ethers.ContractFactory(c.abi, c.evm.bytecode.object, wallet);
const inst = await factory.deploy(rubricHash, wallet.address);
await inst.waitForDeployment();
const addr = await inst.getAddress();

const onchainRubric = await (inst as any).rubricHash();
const onchainSubmitter = await (inst as any).submitter();
console.log(`CookedRegistry deployed at ${addr}`);
console.log(`explorer   https://chainscan-galileo.0g.ai/address/${addr}`);
console.log(`on-chain   rubricHash ${onchainRubric} · submitter ${onchainSubmitter}`);
console.log(`readback   ${onchainRubric === rubricHash ? "MATCHES canonical rubric" : "MISMATCH — do not use"}`);
console.log(`\nadd to .env:\nOG_REGISTRY_CONTRACT=${addr}`);
