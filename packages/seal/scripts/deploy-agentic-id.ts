// Deploys MockOracle + AgenticID to 0G Galileo testnet and prints the env line
// SEAL live mode needs. Requires a funded OG_PRIVATE_KEY.
// Run: bun scripts/deploy-agentic-id.ts
import { readFileSync } from "node:fs";
import { ethers } from "ethers";
import solc from "solc";

const RPC = process.env.OG_RPC_URL || "https://evmrpc-testnet.0g.ai";
const pk = process.env.OG_PRIVATE_KEY;
if (!pk) { console.error("OG_PRIVATE_KEY not set"); process.exit(1); }

const source = readFileSync(new URL("../../../contracts/AgenticID.sol", import.meta.url), "utf8");
const out = JSON.parse(solc.compile(JSON.stringify({
  language: "Solidity",
  sources: { "AgenticID.sol": { content: source } },
  settings: { optimizer: { enabled: true, runs: 200 }, outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } } },
})));
const errors = (out.errors ?? []).filter((e: any) => e.severity === "error");
if (errors.length) { console.error(errors.map((e: any) => e.formattedMessage).join("\n")); process.exit(1); }

const wallet = new ethers.Wallet(pk, new ethers.JsonRpcProvider(RPC));
console.log(`deployer ${wallet.address} · balance ${ethers.formatEther(await wallet.provider!.getBalance(wallet.address))} OG`);

const deploy = async (name: string, args: unknown[] = []) => {
  const c = out.contracts["AgenticID.sol"][name];
  const f = new ethers.ContractFactory(c.abi, c.evm.bytecode.object, wallet);
  const inst = await f.deploy(...args);
  await inst.waitForDeployment();
  const addr = await inst.getAddress();
  console.log(`${name} deployed at ${addr} · https://chainscan-galileo.0g.ai/address/${addr}`);
  return addr;
};

const oracle = await deploy("MockOracle");
const agentic = await deploy("AgenticID", [oracle]);
console.log(`\nadd to .env:\nOG_AGENT_CONTRACT=${agentic}`);
