(() => {
  const V = window.VOTERS, CATS = window.CATEGORIES, CH = window.CHAPTERS, ROLES = window.ROLES;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const NUM = (() => { let n = 0, sub = 0; const m = {};
    window.CATEGORIES.forEach((c) => { if (c.sub) { sub++; m[c.id] = n + String.fromCharCode(97 + sub); } else { n++; sub = 0; m[c.id] = n; } });
    return m; })();
  const numTag = (c) => `<span class="num">#${NUM[c.id]}</span>`;
  const ROLE_TIPS = { Lead: "It's yours: you decide and get it done", Help: "Happy to pitch in when the lead asks", Pass: "Not for you this time" };
  const blank = (name) => ({ name, votes: {}, roles: {}, note: "", voteDone: false, roleDone: false });

  // Part 2 items: creative segments, then every open checklist task.
  const ITEMS = [
    ...window.SEGMENTS.map(([s, d], i) => ({ key: "s-" + i, label: s, meta: d, group: "Creative segments" })),
    ...window.CHECKLIST.map((t, i) => ({ t, i })).filter(({ t }) => t.status !== "Done" && !window.HIDE_TASKS.includes(t.task)).map(({ t, i }) => ({
      key: "t-" + i, label: t.task, group: "Checklist · " + t.area,
      meta: ["Due " + t.due, t.timing, t.lead && !window.HIDE_LEADS.includes(t.lead) && "Suggested lead: " + t.lead].filter(Boolean).join(" · "), note: t.note
    }))
  ];

  let all = Object.fromEntries(V.map((n) => [n, null]));
  let me = null; try { me = localStorage.getItem("qb-voter"); } catch {}
  if (!V.includes(me)) me = null;
  let dirty = false, saveTimer = null, saving = false;
  const mine = () => (all[me] ||= blank(me));
  const started = (b) => !!b && (Object.keys(b.votes || {}).length || Object.keys(b.roles || {}).length || b.note || b.voteDone || b.roleDone);

  /* ---------- photos ---------- */
  const pendingTile = (id) => `<div class="pending"><svg width="30" height="34" viewBox="0 0 30 34" aria-hidden="true"><path d="M15 1l13 7.5v17L15 33 2 25.5v-17z" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="15" cy="17" r="4.5" fill="#e5a823"/></svg><span>Photo coming</span><code>${esc(id)}</code></div>`;
  const photo = (id, alt) => id ? `<img src="photos/${esc(id)}.jpg" alt="${esc(alt)}" loading="lazy" data-pid="${esc(id)}">` : "";
  document.addEventListener("error", (e) => {
    const img = e.target;
    if (img.tagName === "IMG" && img.dataset.pid) img.outerHTML = pendingTile(img.dataset.pid);
  }, true);

  /* ---------- Part 1 ---------- */
  function renderVote() {
    const b = me ? mine() : blank("");
    $("chapters").innerHTML = CH.map((ch) => {
      const cats = CATS.filter((c) => c.ch === ch.id);
      return `<div class="chapter" id="ch-${ch.id}"><div class="chapter-head"><h3>${esc(ch.title)}</h3><p>${esc(ch.blurb)}</p></div>${cats.map((c) => catHTML(c, b)).join("")}</div>`;
    }).join("");
    $("note").value = b.note || "";
    updateCounts();
  }
  function catHTML(c, b) {
    const head = `<div class="cat-head"><h4>${numTag(c)}${esc(c.title)}</h4><span class="cnt" data-cnt="${c.id}"></span></div>${c.blurb ? `<p class="blurb">${esc(c.blurb)}</p>` : ""}`;
    const chk = (i) => (b.votes[c.id + "-" + i] ? "checked" : "");
    if (c.kind === "text") {
      const chips = c.opts.map(([l, , d], i) => `<label class="chip"><input type="checkbox" data-v="${c.id}-${i}" ${chk(i)}><span class="box" aria-hidden="true">✓</span><span>${esc(l)}${d ? `<small>${esc(d)}</small>` : ""}</span></label>`).join("");
      return `<article class="cat" id="cat-${NUM[c.id]}">${head}<div class="textcat ${c.hero ? "" : "nohero"}">${c.hero ? `<div class="hero-ph">${photo(c.hero, c.title + " inspiration")}</div>` : ""}<div class="chips">${chips}</div></div></article>`;
    }
    const cards = c.opts.map(([l, p, d], i) => {
      const media = c.kind === "swatch" ? `<div class="swatches" aria-hidden="true">${p.map((h) => `<i style="background:${h}"></i>`).join("")}</div>` : p ? `<div class="ph">${photo(p, l)}</div>` : "";
      const cls = c.kind !== "swatch" && !p ? "opt noimg" : "opt";
      return `<label class="${cls}">${media}<input type="checkbox" data-v="${c.id}-${i}" ${chk(i)}><span class="cap"><span class="box" aria-hidden="true">✓</span><span>${esc(l)}${d && c.kind !== "swatch" ? `<small>${esc(d)}</small>` : ""}</span></span></label>`;
    }).join("");
    return `<article class="cat" id="cat-${NUM[c.id]}">${head}<div class="opts">${cards}</div></article>`;
  }
  function updateCounts() {
    const b = me ? mine() : blank("");
    CATS.forEach((c) => {
      const n = c.opts.filter((_, i) => b.votes[c.id + "-" + i]).length;
      const el = document.querySelector(`[data-cnt="${c.id}"]`);
      if (el) el.textContent = n ? `${n} picked` : "";
    });
  }

  /* ---------- Part 2 ---------- */
  function renderRoles() {
    const b = me ? mine() : blank("");
    const groups = [...new Set(ITEMS.map((x) => x.group))];
    $("segments").innerHTML = groups.map((g) => `<div class="vgroup"><h4>${esc(g)}</h4>${ITEMS.filter((x) => x.group === g).map((x) => `
      <div class="vrow"><div><div class="task">${esc(x.label)}</div>${x.meta ? `<div class="meta">${esc(x.meta)}${x.note ? "<br>" + esc(x.note) : ""}</div>` : ""}</div>
      <div class="roles" role="radiogroup" aria-label="Your role for ${esc(x.label)}">${ROLES.map((r) => `<label class="role" title="${ROLE_TIPS[r]}"><input type="radio" name="r-${x.key}" value="${r}" data-r="${x.key}" ${b.roles[x.key] === r ? "checked" : ""}><span>${r}</span></label>`).join("")}</div>
      <div class="others" data-others="${x.key}"></div></div>`).join("")}</div>`).join("");
    updateOthers();
  }
  function updateOthers() {
    ITEMS.forEach((x) => {
      const el = document.querySelector(`[data-others="${x.key}"]`);
      if (!el) return;
      const o = V.filter((n) => n !== me && all[n]?.roles?.[x.key] && all[n].roles[x.key] !== "Pass").map((n) => `${n}: ${all[n].roles[x.key]}`);
      el.textContent = o.length ? "Also offered · " + o.join(" · ") : "";
    });
  }

  /* ---------- who ---------- */
  function renderWho() {
    $("whoBtns").innerHTML = V.map((n) => {
      const b = all[n];
      const st = started(b) ? [b.voteDone ? "Part 1 ✓" : "Part 1 in progress", b.roleDone ? "Part 2 ✓" : ""].filter(Boolean).join(" · ") : "Not started";
      return `<button type="button" data-who="${n}" aria-pressed="${n === me}">${n}<small>${st}</small></button>`;
    }).join("");
    $("me").hidden = !me;
    $("meName").textContent = me || "";
    $("startBtn").hidden = !!me;
    $("doneVote").classList.toggle("is-done", !!(me && mine().voteDone));
    $("doneRole").classList.toggle("is-done", !!(me && mine().roleDone));
    $("doneVote").textContent = me && mine().voteDone ? "Part 1 submitted ✓" : "I'm done with Part 1";
    $("doneRole").textContent = me && mine().roleDone ? "Part 2 submitted ✓" : "I'm done with Part 2";
  }
  $("whoBtns").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-who]"); if (!btn) return;
    me = btn.dataset.who; try { localStorage.setItem("qb-voter", me); } catch {}
    renderWho(); renderVote(); renderRoles();
    toast(`Hi ${me}! Your answers save automatically.`);
    document.getElementById("vote").scrollIntoView();
  });
  $("switch").addEventListener("click", () => { $("who").scrollIntoView(); });

  /* ---------- edits ---------- */
  function askName() {
    $("who").scrollIntoView({ block: "center" });
    $("who").classList.add("nudge"); setTimeout(() => $("who").classList.remove("nudge"), 2200);
    toast("Tap your name first, then make your picks.");
  }
  $("startBtn").addEventListener("click", askName);
  // Before a name is chosen, taps on options lead to the name buttons instead of being lost.
  document.addEventListener("click", (e) => {
    if (me) return;
    const hit = e.target.closest("#voteFs label, #roleFs label, #doneVote, #doneRole, #note");
    if (hit) { e.preventDefault(); askName(); }
  }, true);
  document.addEventListener("change", (e) => {
    if (!me) return;
    const t = e.target, b = mine();
    if (t.dataset.v) { if (t.checked) b.votes[t.dataset.v] = true; else delete b.votes[t.dataset.v]; updateCounts(); }
    else if (t.dataset.r) { b.roles[t.dataset.r] = t.value; }
    else return;
    queueSave();
  });
  $("note").addEventListener("focus", () => { if (!me) { $("note").blur(); askName(); } });
  $("note").addEventListener("input", (e) => { if (!me) return; mine().note = e.target.value; queueSave(); });
  $("doneVote").addEventListener("click", () => { if (!me) return; mine().voteDone = true; queueSave(true); renderWho(); toast("Part 1 submitted. Thank you!"); });
  $("doneRole").addEventListener("click", () => { if (!me) return; mine().roleDone = true; queueSave(true); renderWho(); toast("Part 2 submitted. Thank you!"); });

  function queueSave(now) {
    dirty = true; setSave("Saving…");
    renderResults();
    clearTimeout(saveTimer); saveTimer = setTimeout(save, now ? 0 : 700);
  }
  async function save() {
    if (saving) { saveTimer = setTimeout(save, 400); return; }
    saving = true; dirty = false;
    try {
      const r = await fetch("/api/ballots", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(mine()) });
      if (!r.ok) throw new Error(r.status);
      if (!dirty) setSave("Saved ✓");
    } catch {
      dirty = true; setSave("Not saved yet, retrying…");
      clearTimeout(saveTimer); saveTimer = setTimeout(save, 4000);
    } finally { saving = false; }
  }
  const setSave = (t) => { $("save").textContent = t; };
  window.addEventListener("beforeunload", (e) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } });

  async function load(first) {
    try {
      const r = await fetch("/api/ballots", { cache: "no-store" });
      if (!r.ok) throw new Error(r.status);
      const data = await r.json();
      V.forEach((n) => { if (n === me && (dirty || saving)) return; all[n] = data[n]; });
      $("synced").textContent = "Last updated " + new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) + ".";
      if (first) { renderVote(); renderRoles(); }
      renderWho(); updateOthers(); renderResults();
    } catch {
      $("synced").textContent = "Couldn't reach the shared results. Check your connection; they'll refresh automatically.";
      if (first) { renderVote(); renderRoles(); renderWho(); renderResults(); }
    }
  }

  /* ---------- results ---------- */
  let vfilter = "all";
  const votersOf = (key) => V.filter((n) => all[n]?.votes?.[key]);
  const active = (n, k) => ["Lead", "Help"].includes(all[n]?.roles?.[k]);
  function renderResults() {
    $("status").innerHTML = V.map((n) => {
      const b = started(all[n]) ? all[n] : null;
      const picks = b ? Object.keys(b.votes).length : 0;
      const offers = b ? Object.values(b.roles).filter((r) => r !== "Pass").length : 0;
      return `<div class="pstat"><b>${n}</b><span>Part 1: ${b?.voteDone ? '<span class="ok">submitted ✓</span>' : b ? "in progress" : "not started"} · ${picks} picks</span><span>Part 2: ${b?.roleDone ? '<span class="ok">submitted ✓</span>' : b ? "in progress" : "not started"} · ${offers} offers</span></div>`;
    }).join("");

    const rows = CATS.flatMap((c) => c.opts.map(([l], i) => ({ c, l, n: votersOf(c.id + "-" + i) })));
    const cnt = (k) => rows.filter((r) => r.n.length === k).length;
    $("sum").innerHTML = `<span>${cnt(3)} unanimous</span><span>${cnt(2)} two of three</span><span>${cnt(1)} one vote</span><span>${rows.length} options in all</span>`;
    const agreed = CATS.map((c) => ({ c, r: rows.filter((r) => r.c === c && r.n.length >= 2).sort((a, b) => b.n.length - a.n.length) })).filter((x) => x.r.length);
    $("short").innerHTML = agreed.length ? agreed.map(({ c, r }) => `<div><div class="rch">#${NUM[c.id]} · ${esc(c.title)}</div><ul class="short">${r.map((x) => `<li>${esc(x.l)} <span>${x.n.length === 3 ? "All three" : x.n.join(" & ")}</span></li>`).join("")}</ul></div>`).join("")
      : `<p class="muted" style="margin:0">Nothing has two votes yet. Choices appear here as soon as two of us pick the same thing.</p>`;

    $("allres").innerHTML = CH.map((ch) => `<div class="rch">${esc(ch.title)}</div><div class="rgrid">${CATS.filter((c) => c.ch === ch.id).map((c) => `<div class="rcat"><h4>${numTag(c)}${esc(c.title)}</h4>${rows.filter((r) => r.c === c).sort((a, b) => b.n.length - a.n.length).map((r) => `<div class="rrow ${r.n.length === 3 ? "all" : ""}"><span>${esc(r.l)}</span><b>${r.n.length} of 3</b><span class="meter"><i style="width:${(r.n.length / 3) * 100}%"></i></span>${r.n.length ? `<span class="names">${r.n.join(", ")}</span>` : ""}</div>`).join("")}</div>`).join("")}</div>`).join("");

    const status = (x) => {
      const leads = V.filter((n) => all[n]?.roles?.[x.key] === "Lead").length;
      if (leads > 1) return ["multi", "Two or more leads"];
      if (leads === 1) return ["ok", "Has a lead"];
      if (V.some((n) => active(n, x.key))) return ["gap", "Needs a lead"];
      return ["gap", "No volunteers yet"];
    };
    const covered = ITEMS.filter((x) => V.some((n) => all[n]?.roles?.[x.key] === "Lead")).length;
    $("vsum").innerHTML = `<span>${covered} of ${ITEMS.length} have a lead</span>` + V.map((n) => `<span>${n}: ${ITEMS.filter((x) => all[n]?.roles?.[x.key] === "Lead").length} lead · ${ITEMS.filter((x) => all[n]?.roles?.[x.key] === "Help").length} helping</span>`).join("");
    const filters = [["all", "Everything"], ["gap", "Needs a lead"], ["multi", "Two or more leads"], ["ok", "Has a lead"]];
    $("vfilter").innerHTML = filters.map(([k, l]) => `<button type="button" data-f="${k}" aria-pressed="${vfilter === k}">${l}</button>`).join("");
    const tag = (r) => r === "Lead" ? `<span class="tag-lead">Lead</span>` : r === "Help" ? `<span class="tag-co">Help</span>` : r === "Pass" ? `<span class="muted">Pass</span>` : `<span class="muted">—</span>`;
    let lastGroup = "";
    $("vtable").innerHTML = ITEMS.map((x) => {
      const [k, s] = status(x);
      if (vfilter !== "all" && vfilter !== k) return "";
      const g = x.group !== lastGroup ? `<tr><th colspan="5" style="position:static;background:var(--ivory);color:var(--sage)">${esc(x.group)}</th></tr>` : "";
      lastGroup = x.group;
      return `${g}<tr><td>${esc(x.label)}${x.meta ? `<small>${esc(x.meta)}</small>` : ""}</td>${V.map((n) => `<td>${tag(all[n]?.roles?.[x.key])}</td>`).join("")}<td><span class="st ${k}">${s}</span></td></tr>`;
    }).join("") || `<tr><td colspan="5" class="muted">Nothing matches this filter.</td></tr>`;

    $("comments").innerHTML = V.map((n) => `<div><b>${n}</b><div class="muted" style="white-space:pre-wrap">${esc(all[n]?.note || "No comments yet.")}</div></div>`).join("");
  }
  $("vfilter").addEventListener("click", (e) => { const b = e.target.closest("[data-f]"); if (b) { vfilter = b.dataset.f; renderResults(); } });

  /* ---------- CSV ---------- */
  $("csv").addEventListener("click", () => {
    const q = (x) => '"' + String(x ?? "").replace(/^[=+\-@]/, "'$&").replace(/"/g, '""') + '"';
    const out = [["#", "Section", "Category", "Option", ...V, "Votes"]];
    CATS.forEach((c) => c.opts.forEach(([l], i) => {
      const n = votersOf(c.id + "-" + i);
      out.push(["#" + NUM[c.id], CH.find((h) => h.id === c.ch).title, c.title, l, ...V.map((v) => n.includes(v) ? "Yes" : ""), n.length]);
    }));
    out.push([], ["", "Group", "Segment or task", "Details", ...V]);
    ITEMS.forEach((x) => out.push(["", x.group, x.label, x.meta || "", ...V.map((n) => all[n]?.roles?.[x.key] || "")]));
    out.push([], ["Comments"], ...V.map((n) => [n, all[n]?.note || ""]));
    const blob = new Blob(["﻿" + out.map((r) => r.map(q).join(",")).join("\r\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "queen-bee-survey-results.csv";
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1500);
  });

  let tt;
  function toast(t) { const el = $("toast"); el.textContent = t; el.hidden = false; clearTimeout(tt); tt = setTimeout(() => (el.hidden = true), 2600); }

  load(true);
  setInterval(() => { if (document.visibilityState === "visible") load(false); }, 20000);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") load(false); });
})();
