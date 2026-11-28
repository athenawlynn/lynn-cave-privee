// Results for Lynnie and Derek: every response, plus the women listed on the member list. Passcode required.
import { getStore } from "@netlify/blobs";
import { WOMEN, PASS_HASH } from "../../private/data.mjs";

async function sha256(s) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  let body;
  try { body = await req.json(); } catch { return new Response("Bad request", { status: 400 }); }
  if ((await sha256(String(body.passcode || ""))) !== PASS_HASH) {
    await new Promise((r) => setTimeout(r, 800)); // slow down guessing
    return Response.json({ ok: false, error: "wrong-passcode" }, { status: 401 });
  }
  const store = getStore({ name: "member-responses", consistency: "strong" });
  const { blobs } = await store.list();
  const responses = (await Promise.all(blobs.map((b) => store.get(b.key, { type: "json" })))).filter(Boolean);
  return Response.json({ ok: true, responses, women: WOMEN }, { headers: { "cache-control": "no-store" } });
};

export const config = { path: "/api/member-admin" };
