#!/usr/bin/env node
// cooked-skill — MCP server: wallet address in → cross-protocol risk profile out.
// stdio transport; tool names use underscores (MCP name rules).
// GRAPH_API_KEY comes from the environment only — it is never a tool argument,
// so an agent client can never leak it into a transcript.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { REGISTRY, autopsy, lendingSurface, dexSurface } from "./autopsy.js";

const key = () => {
  const k = process.env.GRAPH_API_KEY;
  if (!k) throw new Error("GRAPH_API_KEY not set — get one at https://thegraph.com/studio/apikeys/");
  return k;
};

const ADDRESS = z.string().regex(/^0x[0-9a-fA-F]{40}$/, "EVM address (0x + 40 hex chars)");
const server = new McpServer({ name: "cooked", version: "0.1.0" });
const asText = (o) => ({ content: [{ type: "text", text: JSON.stringify(o) }] });

server.registerTool("cooked_autopsy",
  { description: "Full wallet autopsy: lending positions (Messari standardized schemas: Aave v3, Compound v3, Spark) + DEX surface (Uniswap v3 LPs and recent swaps), all live from The Graph gateway.",
    inputSchema: { address: ADDRESS } },
  async ({ address }) => asText(await autopsy(key(), address)));

server.registerTool("cooked_lending_surface",
  { description: "Lending surface only: open positions per protocol via ONE standardized Messari query shape across every conforming market.",
    inputSchema: { address: ADDRESS } },
  async ({ address }) => asText(await lendingSurface(key(), address)));

server.registerTool("cooked_dex_surface",
  { description: "DEX surface only: Uniswap v3 LP positions + recent swap flow for an address.",
    inputSchema: { address: ADDRESS } },
  async ({ address }) => asText(await dexSurface(key(), address)));

server.registerTool("cooked_sources",
  { description: "List the subgraph registry this skill scans: name, chain, schema dialect, subgraph id. Adding a Messari-conforming lending protocol is one registry line.",
    inputSchema: {} },
  async () => asText(REGISTRY));

await server.connect(new StdioServerTransport());
console.error(`[cooked] up · 4 tools on stdio · key=${process.env.GRAPH_API_KEY ? "set" : "MISSING"}`);
