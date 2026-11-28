// Member survey: check a member number and save one response per member number.
import { getStore } from "@netlify/blobs";
import { GOLF } from "../../private/data.mjs";

const CLUBS = ["JL", "FR", "AC", "WB", "JC", "MO", "MS", "PG", "BI"];
const pick = (v, list) => (list.includes(v) ? v : "");
const text = (v, n) => (typeof v === "string" ? v.trim().slice(0, n) : "");
// Member numbers are 5 digits; accept them typed without leading zeros.
const cleanNum = (v) => { const d = String(v ?? "").replace(/\D/g, "").slice(0, 8); return d && d.length < 5 ? d.padStart(5, "0") : d; };

function clean(a) {
  const ranks = Array.isArray(a.ranks) ? a.ranks.map((r) => pick(r, CLUBS)) : [];
  return {
    first: text(a.first, 40),
    last: text(a.last, 60),
    home: pick(a.home, ["Yes", "Probably", "No"]),
    ranks: ranks.length === 3 && new Set(ranks).size === 3 && ranks.every(Boolean) ? ranks : null,
    count: pick(a.count, ["1", "2", "3", "4"]),
    drive: pick(a.drive, ["0", "1", "2"]),
    alt: pick(a.alt, ["Yes", "Maybe", "No"]),
    notes: text(a.notes, 2000)
  };
}

export default async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "bad-request" }, { status: 400 }); }
  const num = cleanNum(body.num);
  if (!GOLF.has(num)) return Response.json({ ok: false, error: "not-found" }, { status: 404 });
  const store = getStore({ name: "member-responses", consistency: "strong" });
  const headers = { "cache-control": "no-store" };

  if (body.action === "check") {
    const existing = await store.get(num, { type: "json" });
    return Response.json({ ok: true, existing: existing ? existing.answers : null }, { headers });
  }
  if (body.action === "save") {
    const answers = clean(body.answers || {});
    if (!answers.first || !answers.last || !answers.home || !answers.ranks)
      return Response.json({ ok: false, error: "missing" }, { status: 400 });
    const rec = { num, answers, updated: new Date().toISOString() };
    await store.setJSON(num, rec);
    return Response.json({ ok: true, updated: rec.updated }, { headers });
  }
  return Response.json({ error: "bad-request" }, { status: 400 });
};

export const config = { path: "/api/member" };
