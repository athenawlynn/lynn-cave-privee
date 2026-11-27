import { getStore } from "@netlify/blobs";

const VOTERS = ["Athena", "Lynnie", "Beth"];
const ROLES = ["Lead", "Co-plan", "Assist", "Pass"];
const KEY = /^[a-z0-9-]{1,60}$/;

function clean(b) {
  const votes = {};
  for (const [k, v] of Object.entries(b.votes || {})) if (KEY.test(k) && v === true) votes[k] = true;
  const roles = {};
  for (const [k, v] of Object.entries(b.roles || {})) if (KEY.test(k) && ROLES.includes(v)) roles[k] = v;
  return {
    name: b.name,
    votes,
    roles,
    note: typeof b.note === "string" ? b.note.slice(0, 4000) : "",
    voteDone: b.voteDone === true,
    roleDone: b.roleDone === true,
    updated: Date.now()
  };
}

export default async (req) => {
  const store = getStore({ name: "queen-bee-ballots", consistency: "strong" });
  const headers = { "cache-control": "no-store" };
  if (req.method === "GET") {
    const out = {};
    for (const n of VOTERS) out[n] = (await store.get(n, { type: "json" })) || null;
    return Response.json(out, { headers });
  }
  if (req.method === "PUT") {
    let body;
    try { body = await req.json(); } catch { return new Response("Invalid JSON", { status: 400 }); }
    if (!body || !VOTERS.includes(body.name)) return new Response("Unknown voter", { status: 400 });
    const ballot = clean(body);
    await store.setJSON(ballot.name, ballot);
    return Response.json({ ok: true, updated: ballot.updated }, { headers });
  }
  return new Response("Method not allowed", { status: 405 });
};

export const config = { path: "/api/ballots" };
