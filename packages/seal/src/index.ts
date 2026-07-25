#!/usr/bin/env bun
// SEAL — MCP server exposing 0G (Compute / Storage / Chain / Agentic ID) to any AI client.
// stdio transport; tool names use underscores (MCP name rules): seal_infer = seal.infer etc.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { makeBackend } from "./core.js";

const backend = makeBackend();
const server = new McpServer({ name: "seal", version: "0.1.0" });
const asText = (o: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(o) }] });

server.registerTool("seal_infer",
  { description: "Private inference inside a 0G Compute TEE. Returns output + attestation proving where it ran.",
    inputSchema: { prompt: z.string(), model: z.string().optional() } },
  async ({ prompt, model }) => asText(await backend.infer(prompt, model)));

server.registerTool("seal_memory_put",
  { description: "Persist an encrypted value to 0G Storage. Returns the content id.",
    inputSchema: { key: z.string(), value: z.string() } },
  async ({ key, value }) => asText(await backend.memoryPut(key, value)));

server.registerTool("seal_memory_get",
  { description: "Read a value previously stored with seal_memory_put.",
    inputSchema: { key: z.string() } },
  async ({ key }) => asText(await backend.memoryGet(key)));

server.registerTool("seal_memory_list",
  { description: "List stored keys, optionally by prefix.",
    inputSchema: { prefix: z.string().optional() } },
  async ({ prefix }) => asText(await backend.memoryList(prefix)));

server.registerTool("seal_agent_mint",
  { description: "Mint a 0G Agentic ID for an agent. Returns the id + explorer link.",
    inputSchema: { name: z.string(), meta: z.record(z.unknown()).default({}) } },
  async ({ name, meta }) => asText(await backend.agentMint(name, meta as Record<string, unknown>)));

server.registerTool("seal_agent_load",
  { description: "Load an agent's metadata + memory root by Agentic ID.",
    inputSchema: { agenticId: z.string() } },
  async ({ agenticId }) => asText(await backend.agentLoad(agenticId)));

server.registerTool("seal_chain_call",
  { description: "Submit a transaction to 0G Chain. Returns the tx hash.",
    inputSchema: { to: z.string(), data: z.string(), value: z.string().optional() } },
  async ({ to, data, value }) => asText(await backend.chainCall(to, data, value)));

server.registerTool("seal_verify",
  { description: "Verify ANY agent's attestation. Returns {valid, integrity, teeVerified, model, timestamp, reason}. valid=true ONLY when a TEE signature was checked at response time; integrity=true just means the record is intact (its MAC is unkeyed, so integrity alone proves nothing). teeVerified=null means this process never witnessed the response — re-check the embedded provider+chatID upstream.",
    inputSchema: { attestation: z.string() } },
  async ({ attestation }) => asText(await backend.verify(attestation)));

await server.connect(new StdioServerTransport());
console.error(`[seal] up · mode=${process.env.SEAL_MODE ?? "stub"} · 8 tools on stdio`);
