const TYPES = ["owner search", "vet care", "foster/adoption", "costs", "general"];
const CATEGORIES = ["food/litter/supplies", "flea treatment", "vet exam/testing", "medication/treatment", "neuter", "other"];
const REVIEW = ["new", "reviewed", "promising", "rejected", "owner-confirmed", "rescue-contacted"];

const HEADERS = {
  "Content-Security-Policy": "default-src 'self'; script-src https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; connect-src 'self' https://challenges.cloudflare.com; img-src 'self' data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'self'",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY"
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    try {
      if (request.method === "GET" && url.pathname === "/") return html(await home(env, url));
      if (request.method === "POST" && url.pathname === "/claim") return saveClaim(request, env, ctx);
      if (request.method === "POST" && url.pathname === "/apply") return saveApplication(request, env, ctx);
      if (request.method === "POST" && url.pathname === "/admin/login") return login(request, env);
      if (request.method === "POST" && url.pathname === "/admin/logout") return redirect("/admin", clearCookie(request));
      if (url.pathname === "/admin" || url.pathname === "/admin/") return admin(request, env, url);
      if (url.pathname.startsWith("/admin/")) {
        if (!authed(request, env)) return html(loginPage("Admin access required."), 401);
        return adminAction(request, env, url);
      }
      return html(page("Not found", `<main class="login"><h1>Not found</h1><p><a class="button secondary" href="/">Back to site</a></p></main>`), 404);
    } catch (err) {
      console.error(err);
      const message = err.publicMessage || "Something went wrong. Please try again.";
      return html(page("Error", `<main class="login"><h1>${e(message)}</h1><p><a class="button secondary" href="/">Back to site</a></p></main>`), err.status || 500);
    }
  }
};

async function home(env, url) {
  const data = await publicData(env);
  const sentClaim = url.searchParams.get("claim") === "sent";
  const sentApp = url.searchParams.get("apply") === "sent";
  return page("Found Cat Oakland", `
    <header><a class="brand" href="/"><span></span>Found Cat Oakland</a><nav><a href="#owner">Owner</a><a href="#foster">Foster/adopt</a><a href="#costs">Costs</a><a href="#updates">Updates</a></nav></header>
    <main>
      <section class="hero band"><div class="wrap">
        <p class="eyebrow">Found near ${e(data.neighborhood)}</p>
        <h1>Help this friendly Oakland cat get home — or into a safe new home</h1>
        <p class="lead">A very friendly, very skinny male cat was found near East 19th Street and 12th Avenue in Oakland around May 13. Owner reunification comes first; foster, adoption, or rescue placement will only move forward if no credible owner is confirmed.</p>
        <p class="actions"><a class="button primary" href="#owner">I think this is my cat</a><a class="button secondary" href="#foster">Apply to foster or adopt</a><a class="button secondary" href="#costs">Help cover documented care costs</a><a class="button ghost" href="#updates">See updates</a></p>
        <p class="notice"><strong>Safety first:</strong> the exact apartment/address is not public. No same-day impulse handoff. Screening is required.</p>
        <p class="notice"><strong>Community note:</strong> This page is a one-off community effort by Danny to help a found cat in Oakland. It is not a paid service, animal rescue organization, adoption agency, pet care provider, or nonprofit fundraiser. Electron Solutions is only providing temporary web hosting/technical support.</p>
      </div></section>

      <section class="wrap">
        <p class="eyebrow">Photos</p><h2>Photo gallery</h2><p class="muted">Add real cat photos later by replacing these simple placeholders in <code>src/index.js</code>.</p>
        <div class="gallery">${["Front view", "Full body", "Identifying details"].map((label) => `<figure><div class="placeholder"><b>Add real cat photo</b><small>${label}</small></div><figcaption>${label}</figcaption></figure>`).join("")}</div>
      </section>

      <section class="wrap split">
        <div><p class="eyebrow">Current status</p><h2>What is known so far</h2><p>${e(data.status.public_status || "Owner search active. Foster/adopter screening is open if no credible owner is confirmed.")}</p>
          <div class="badges"><span>Friendly/tame</span><span>Male, not neutered yet</span><span>No chip found in initial scan</span><span>Vet exam pending</span><span>Owner search active</span><span>Foster/adopter screening open</span></div>
        </div>
        <div class="card"><h3>Care notes</h3><ul><li>Appears over 1 year old, but no vet age estimate yet.</li><li>Medium/long-haired fur with black, brown, and gray tones.</li><li>Very friendly and tame with the rescuer.</li><li>Has not scratched, bitten, or growled at the rescuer.</li><li>Seems more like a lost or abandoned indoor cat than a feral cat.</li><li>Currently kept safely separated from a resident senior cat.</li><li>Small torn/broken claw is being kept clean.</li></ul></div>
      </section>

      <section class="band" id="updates"><div class="wrap"><p class="eyebrow">Public updates</p><h2>Latest updates</h2><div class="list">${data.updates.length ? data.updates.map(updateCard).join("") : `<p class="muted">No public updates yet.</p>`}</div></div></section>

      <section class="wrap formgrid" id="owner">
        <div><p class="eyebrow">Owner claim</p><h2>I think this is my cat</h2><p>Please provide details or photos that can confirm ownership. The exact current location will only be shared after details reasonably match.</p>${sentClaim ? ok("Thanks. Your claim was received.") : ""}</div>
        <form class="card" method="post" action="/claim">${claimFields()}${trap()}${turnstile(env)}<button class="button primary">Submit owner claim</button></form>
      </section>

      <section class="band" id="foster"><div class="wrap formgrid">
        <div><p class="eyebrow">Foster, adoption, or rescue</p><h2>Apply to be considered</h2><p>Because he has not yet had a full vet exam or FeLV/FIV testing, he should not meet other cats until cleared by a vet. Screening is required. No same-day impulse handoff.</p>${sentApp ? ok("Thanks. Your application was received.") : ""}</div>
        <form class="card" method="post" action="/apply">${appFields()}${trap()}${turnstile(env)}<button class="button primary">Submit application</button></form>
      </div></section>

      <section class="wrap" id="costs">
        <p class="eyebrow">Documented costs only</p><h2>Reimbursement transparency</h2>
        <p>This is documented cost reimbursement for care costs only. Contributions do not create adoption priority, ownership rights, or a service relationship. Reimbursement links are configured manually and can be removed or paused once documented costs are covered. Any excess reimbursement funds will be returned, transferred with the cat to a rescue/adopter, or given to a local cat rescue.</p>
        <div class="stats">${stat("Total documented expenses", money(data.finance.documented_cents))}${stat("Total reimbursed", money(data.finance.reimbursed_cents))}${stat("Remaining documented need", money(data.finance.remaining_cents))}</div>
        <div class="split"><div class="card"><h3>Cost categories</h3><ul class="rows">${CATEGORIES.map((cat) => `<li><span>${cat}</span><b>${money(data.finance.categories[cat] || 0)}</b></li>`).join("")}</ul></div><div class="card"><h3>Reimbursement links</h3><p class="actions">${reimbursementLinks(data.links)}</p></div></div>
        <div class="list">${data.expenses.length ? `<h3>Itemized expenses</h3>${data.expenses.map(expenseCard).join("")}` : `<p class="muted">No public documented expenses have been added yet.</p>`}</div>
      </section>
    </main>
    <footer>One-off community effort by Danny. Electron Solutions is only providing temporary web hosting/technical support. Please do not post exact private location details publicly. <a href="/admin">Admin</a></footer>
    <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
  `);
}

async function publicData(env) {
  const [status, updates, expenses, totals, cats] = await Promise.all([
    env.DB.prepare("SELECT * FROM cat_status WHERE id = 1").first(),
    env.DB.prepare("SELECT title, body, status_type, published_at, created_at FROM updates WHERE is_public = 1 ORDER BY COALESCE(published_at, created_at) DESC, id DESC LIMIT 25").all(),
    env.DB.prepare("SELECT category, description, amount_cents, incurred_on, receipt_url FROM expenses WHERE is_public = 1 ORDER BY COALESCE(incurred_on, created_at) DESC, id DESC").all(),
    env.DB.prepare("SELECT COALESCE((SELECT SUM(amount_cents) FROM expenses WHERE is_public = 1), 0) documented_cents, COALESCE((SELECT SUM(amount_cents) FROM reimbursements), 0) reimbursed_cents").first(),
    env.DB.prepare("SELECT category, COALESCE(SUM(amount_cents), 0) amount_cents FROM expenses WHERE is_public = 1 GROUP BY category").all()
  ]);
  const documented = Number(totals?.documented_cents || 0);
  const reimbursed = Number(totals?.reimbursed_cents || 0);
  return {
    neighborhood: env.PUBLIC_NEIGHBORHOOD || "East 19th Street and 12th Avenue, Oakland, CA",
    status: status || {},
    updates: updates.results || [],
    expenses: expenses.results || [],
    finance: {
      documented_cents: documented,
      reimbursed_cents: reimbursed,
      remaining_cents: Math.max(documented - reimbursed, 0),
      categories: Object.fromEntries((cats.results || []).map((row) => [row.category, row.amount_cents]))
    },
    links: cleanLinks({ venmo: env.VENMO_URL, cashapp: env.CASHAPP_URL, paypal: env.PAYPAL_URL, gofundme: env.GOFUNDME_URL, receipts: env.OPTIONAL_RECEIPTS_URL })
  };
}

async function saveClaim(request, env, ctx) {
  const form = await request.formData();
  if (text(form, "company", 50)) return redirect("/?claim=sent#owner");
  await rateLimit(request, env, "claim");
  await verifyTurnstile(request, env, form);
  const fields = ["name", "contact", "lost_when", "lost_where", "photos_link", "sex", "age_estimate", "neuter_status", "collar_tag_history", "microchip_details", "identifying_details", "personality_details", "proof", "message"].map((key) => text(form, key, 2000));
  if (!fields[0] || !fields[1] || !fields[10]) throw publicError("Please include your name, contact information, and identifying details.");
  await env.DB.prepare("INSERT INTO owner_claims (name, contact, lost_when, lost_where, photos_link, sex, age_estimate, neuter_status, collar_tag_history, microchip_details, identifying_details, personality_details, proof, message, ip_hash, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .bind(...fields, await ipHash(request, env), request.headers.get("User-Agent") || "")
    .run();
  ctx.waitUntil(notify(env, "New possible owner claim", fields.join("\n\n")));
  return redirect("/?claim=sent#owner");
}

async function saveApplication(request, env, ctx) {
  const form = await request.formData();
  if (text(form, "company", 50)) return redirect("/?apply=sent#foster");
  await rateLimit(request, env, "apply");
  await verifyTurnstile(request, env, form);
  const fields = ["name", "contact", "city_neighborhood", "interest_type", "household_type", "rent_own_pets_allowed", "current_pets", "cats_vaccinated_tested", "can_quarantine", "cat_experience", "indoor_only", "vet_care", "neuter_willingness", "owner_return_willingness", "vet_reference", "rescue_reference", "message"].map((key) => text(form, key, 2000));
  if (!fields[0] || !fields[1] || !fields[3] || !fields[8]) throw publicError("Please include your name, contact information, interest type, and quarantine answer.");
  await env.DB.prepare("INSERT INTO applications (name, contact, city_neighborhood, interest_type, household_type, rent_own_pets_allowed, current_pets, cats_vaccinated_tested, can_quarantine, cat_experience, indoor_only, vet_care, neuter_willingness, owner_return_willingness, vet_reference, rescue_reference, message, ip_hash, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .bind(...fields, await ipHash(request, env), request.headers.get("User-Agent") || "")
    .run();
  ctx.waitUntil(notify(env, "New foster/adoption/rescue application", fields.join("\n\n")));
  return redirect("/?apply=sent#foster");
}

async function verifyTurnstile(request, env, form) {
  const token = text(form, "cf-turnstile-response", 3000);
  if (!env.TURNSTILE_SECRET_KEY || !token) throw publicError("Verification is missing. Please refresh and try again.");
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret: env.TURNSTILE_SECRET_KEY, response: token, remoteip: clientIp(request) })
  });
  const result = response.ok ? await response.json() : {};
  if (!result.success) throw publicError("Verification failed. Please refresh and try again.");
}

async function rateLimit(request, env, endpoint) {
  const hash = await ipHash(request, env);
  const windowStart = new Date(Math.floor(Date.now() / 3600000) * 3600000).toISOString();
  const existing = await env.DB.prepare("SELECT count FROM rate_limits WHERE endpoint = ? AND ip_hash = ? AND window_start = ?").bind(endpoint, hash, windowStart).first();
  if (existing && Number(existing.count) >= 5) throw publicError("Too many submissions from this connection. Please try again later.", 429);
  if (existing) await env.DB.prepare("UPDATE rate_limits SET count = count + 1, updated_at = CURRENT_TIMESTAMP WHERE endpoint = ? AND ip_hash = ? AND window_start = ?").bind(endpoint, hash, windowStart).run();
  else await env.DB.prepare("INSERT INTO rate_limits (endpoint, ip_hash, window_start, count) VALUES (?, ?, ?, 1)").bind(endpoint, hash, windowStart).run();
}

async function admin(request, env, url) {
  const token = url.searchParams.get("token");
  if (token) return token === env.ADMIN_TOKEN ? redirect("/admin", cookie(request, env)) : html(loginPage("Invalid admin token."), 401);
  if (!authed(request, env)) return html(loginPage(""), 401);
  const data = await adminData(env);
  return html(page("Found Cat Admin", `
    <header><a class="brand" href="/admin"><span></span>Found Cat Admin</a><form method="post" action="/admin/logout"><button class="button ghost">Sign out</button></form></header>
    <main class="wrap">
      <p class="eyebrow">Admin</p><h1>Dashboard</h1>
      <div class="stats">${stat("Owner claims", data.claims.length)}${stat("Applications", data.apps.length)}${stat("Remaining documented need", money(data.finance.remaining_cents))}</div>
      <section class="card" id="status"><h2>Cat status</h2><form method="post" action="/admin/status" class="grid">${field("Public status", "public_status", data.status.public_status, "textarea")}${field("Owner search status", "owner_search_status", data.status.owner_search_status)}${field("Medical status", "medical_status", data.status.medical_status)}${field("Placement status", "placement_status", data.status.placement_status)}<button class="button primary">Save status</button></form></section>
      <section class="card" id="updates"><h2>Updates</h2><form method="post" action="/admin/update" class="grid">${field("Title", "title")}${selectField("Type", "status_type", TYPES)}${field("Body", "body", "", "textarea")}${check("Public", "is_public", true)}<button class="button primary">Add update</button></form><div class="list">${data.updates.map(adminUpdate).join("")}</div></section>
      <section class="card" id="claims"><h2>Owner claims</h2><p><a class="button secondary" href="/admin/export/owner-claims.csv">Export CSV</a></p>${data.claims.map((row) => submission(row, "claim")).join("") || `<p class="muted">No claims yet.</p>`}</section>
      <section class="card" id="applications"><h2>Applications</h2><p><a class="button secondary" href="/admin/export/applications.csv">Export CSV</a></p>${data.apps.map((row) => submission(row, "app")).join("") || `<p class="muted">No applications yet.</p>`}</section>
      <section class="card" id="expenses"><h2>Expenses and reimbursements</h2><div class="stats">${stat("Documented", money(data.finance.documented_cents))}${stat("Reimbursed", money(data.finance.reimbursed_cents))}${stat("Remaining", money(data.finance.remaining_cents))}</div><form method="post" action="/admin/expense" class="grid">${selectField("Category", "category", CATEGORIES)}${field("Amount", "amount")}${field("Date", "incurred_on", "", "date")}${field("Description", "description")}${field("Receipt URL", "receipt_url", "", "url")}${check("Public", "is_public", true)}<button class="button primary">Add expense</button></form><form method="post" action="/admin/reimbursement" class="grid">${field("Reimbursement amount", "amount")}${field("Received on", "received_on", "", "date")}${field("Source", "source")}${field("Note", "note")}<button class="button primary">Add reimbursement</button></form><div class="list">${data.expenses.map(adminExpense).join("")}${data.reimbursements.map(adminReimbursement).join("")}</div></section>
    </main>
  `));
}

async function adminData(env) {
  const [status, updates, claims, apps, expenses, reimbursements] = await Promise.all([
    env.DB.prepare("SELECT * FROM cat_status WHERE id = 1").first(),
    env.DB.prepare("SELECT * FROM updates ORDER BY created_at DESC, id DESC").all(),
    env.DB.prepare("SELECT * FROM owner_claims ORDER BY created_at DESC, id DESC LIMIT 250").all(),
    env.DB.prepare("SELECT * FROM applications ORDER BY created_at DESC, id DESC LIMIT 250").all(),
    env.DB.prepare("SELECT * FROM expenses ORDER BY COALESCE(incurred_on, created_at) DESC, id DESC").all(),
    env.DB.prepare("SELECT * FROM reimbursements ORDER BY COALESCE(received_on, created_at) DESC, id DESC").all()
  ]);
  const expenseRows = expenses.results || [];
  const reimbursementRows = reimbursements.results || [];
  const documented = expenseRows.reduce((sum, row) => sum + Number(row.amount_cents || 0), 0);
  const reimbursed = reimbursementRows.reduce((sum, row) => sum + Number(row.amount_cents || 0), 0);
  return { status: status || {}, updates: updates.results || [], claims: claims.results || [], apps: apps.results || [], expenses: expenseRows, reimbursements: reimbursementRows, finance: { documented_cents: documented, reimbursed_cents: reimbursed, remaining_cents: Math.max(documented - reimbursed, 0) } };
}

async function adminAction(request, env, url) {
  if (request.method === "GET" && url.pathname === "/admin/export/owner-claims.csv") return exportCsv(env, "owner_claims");
  if (request.method === "GET" && url.pathname === "/admin/export/applications.csv") return exportCsv(env, "applications");
  if (request.method !== "POST") return redirect("/admin");
  const form = await request.formData();
  if (url.pathname === "/admin/status") {
    await env.DB.prepare("INSERT INTO cat_status (id, public_status, owner_search_status, medical_status, placement_status, updated_at) VALUES (1, ?, ?, ?, ?, CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET public_status = excluded.public_status, owner_search_status = excluded.owner_search_status, medical_status = excluded.medical_status, placement_status = excluded.placement_status, updated_at = CURRENT_TIMESTAMP")
      .bind(text(form, "public_status", 1000), text(form, "owner_search_status", 300), text(form, "medical_status", 300), text(form, "placement_status", 300)).run();
  } else if (url.pathname === "/admin/update") {
    await env.DB.prepare("INSERT INTO updates (title, body, status_type, is_public, published_at) VALUES (?, ?, ?, ?, CASE WHEN ? = 1 THEN CURRENT_TIMESTAMP ELSE NULL END)")
      .bind(text(form, "title", 240), text(form, "body", 4000), valid(text(form, "status_type", 80), TYPES, "general"), form.has("is_public") ? 1 : 0, form.has("is_public") ? 1 : 0).run();
  } else if (url.pathname === "/admin/expense") {
    await env.DB.prepare("INSERT INTO expenses (category, description, amount_cents, incurred_on, receipt_url, is_public) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(valid(text(form, "category", 80), CATEGORIES, "other"), text(form, "description", 1000), cents(text(form, "amount", 50)), text(form, "incurred_on", 50), text(form, "receipt_url", 1000), form.has("is_public") ? 1 : 0).run();
  } else if (url.pathname === "/admin/reimbursement") {
    await env.DB.prepare("INSERT INTO reimbursements (amount_cents, received_on, source, note) VALUES (?, ?, ?, ?)").bind(cents(text(form, "amount", 50)), text(form, "received_on", 50), text(form, "source", 240), text(form, "note", 1000)).run();
  } else {
    const match = url.pathname.match(/^\/admin\/(claim|app)\/(\d+)$/);
    if (match) {
      const table = match[1] === "claim" ? "owner_claims" : "applications";
      await env.DB.prepare(`UPDATE ${table} SET review_status = ?, internal_notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(valid(text(form, "review_status", 80), REVIEW, "reviewed"), text(form, "internal_notes", 4000), Number(match[2])).run();
    }
  }
  return redirect("/admin");
}

async function login(request, env) {
  const form = await request.formData();
  return text(form, "token", 500) === env.ADMIN_TOKEN ? redirect("/admin", cookie(request, env)) : html(loginPage("Invalid admin token."), 401);
}

function loginPage(message) {
  return page("Admin sign in", `<main class="login card"><p class="eyebrow">Found Cat Oakland</p><h1>Admin sign in</h1>${message ? `<p class="error">${e(message)}</p>` : ""}<form method="post" action="/admin/login" class="grid"><label>Admin token<input name="token" type="password" required></label><button class="button primary">Sign in</button></form></main>`);
}

function claimFields() {
  return [field("Name", "name", "", "text", true), field("Phone/email", "contact", "", "text", true), field("When cat was lost", "lost_when"), field("Where cat was lost", "lost_where"), field("Recent photos link", "photos_link", "", "url"), field("Sex", "sex"), field("Age estimate", "age_estimate"), field("Neuter status", "neuter_status"), field("Collar/tag history", "collar_tag_history", "", "textarea"), field("Microchip details if known", "microchip_details", "", "textarea"), field("Unique identifying details", "identifying_details", "", "textarea", true), field("Personality details", "personality_details", "", "textarea"), field("Vet/rescue proof optional", "proof", "", "textarea"), field("Message", "message", "", "textarea")].join("");
}

function appFields() {
  return [field("Name", "name", "", "text", true), field("Phone/email", "contact", "", "text", true), field("City/neighborhood", "city_neighborhood"), selectField("Interest type", "interest_type", ["", "foster", "adoption", "rescue intake", "backup foster"], true), field("Household type", "household_type"), field("Rent/own and pets allowed", "rent_own_pets_allowed"), field("Current pets", "current_pets", "", "textarea"), field("Whether current cats are vaccinated/tested", "cats_vaccinated_tested", "", "textarea"), field("Ability to quarantine him from other pets until vet clearance", "can_quarantine", "", "textarea", true), field("Cat experience", "cat_experience", "", "textarea"), selectField("Ability/willingness to keep indoor-only", "indoor_only", ["", "yes", "no", "needs discussion"]), selectField("Willingness to get/continue vet care", "vet_care", ["", "yes", "no", "needs discussion"]), selectField("Willingness to neuter if needed", "neuter_willingness", ["", "yes", "no", "needs discussion"]), selectField("Return him if a credible owner is confirmed", "owner_return_willingness", ["", "yes", "no", "needs discussion"]), field("Vet reference", "vet_reference", "", "textarea"), field("Rescue/adoption reference", "rescue_reference", "", "textarea"), field("Message", "message", "", "textarea")].join("");
}

function field(label, name, value = "", type = "text", required = false) {
  const attr = `name="${e(name)}"${required ? " required" : ""}`;
  return `<label>${e(label)}${type === "textarea" ? `<textarea ${attr} rows="4">${e(value)}</textarea>` : `<input ${attr} type="${e(type)}" value="${e(value)}">`}</label>`;
}

function selectField(label, name, values, required = false) {
  return `<label>${e(label)}<select name="${e(name)}"${required ? " required" : ""}>${values.map((value) => `<option value="${e(value)}">${value ? e(value) : "Select one"}</option>`).join("")}</select></label>`;
}

function check(label, name, checked) {
  return `<label class="check"><input name="${e(name)}" type="checkbox"${checked ? " checked" : ""}> ${e(label)}</label>`;
}

function submission(row, kind) {
  const details = Object.entries(row).filter(([key, value]) => value && !["ip_hash", "user_agent"].includes(key)).map(([key, value]) => `<dt>${e(key.replaceAll("_", " "))}</dt><dd>${e(value)}</dd>`).join("");
  return `<article class="item"><h3>${e(row.name || `#${row.id}`)}</h3><p class="muted">${e(row.contact || "")} · ${e(row.created_at || "")}</p><dl>${details}</dl><form method="post" action="/admin/${kind}/${row.id}" class="grid">${selectField("Review status", "review_status", REVIEW)}${field("Internal notes", "internal_notes", row.internal_notes || "", "textarea")}<button class="button primary">Save review</button></form></article>`;
}

function adminUpdate(row) {
  return `<article class="item"><h3>${e(row.title)}</h3><p>${e(row.body)}</p><p class="muted">${e(row.status_type)} · ${row.is_public ? "public" : "private"}</p></article>`;
}

function adminExpense(row) {
  return `<article class="item"><b>${money(row.amount_cents)}</b> ${e(row.description)} <span class="muted">${e(row.category || "")}</span></article>`;
}

function adminReimbursement(row) {
  return `<article class="item"><b>${money(row.amount_cents)}</b> reimbursed <span class="muted">${e(row.source || "")}</span></article>`;
}

function updateCard(row) {
  return `<article class="item"><p class="muted">${e(row.status_type || "general")} · ${date(row.published_at || row.created_at)}</p><h3>${e(row.title)}</h3><p>${e(row.body)}</p></article>`;
}

function expenseCard(row) {
  return `<article class="item row"><span><b>${e(row.description)}</b><br><small>${e(row.category || "")}${row.incurred_on ? ` · ${e(row.incurred_on)}` : ""}</small></span><b>${money(row.amount_cents)}</b>${row.receipt_url ? `<a href="${e(row.receipt_url)}">Receipt</a>` : ""}</article>`;
}

function stat(label, value) {
  return `<article><span>${e(label)}</span><b>${e(value)}</b></article>`;
}

function reimbursementLinks(links) {
  const names = { venmo: "Venmo", cashapp: "Cash App", paypal: "PayPal", gofundme: "GoFundMe", receipts: "Receipt folder" };
  const entries = Object.entries(links || {});
  return entries.length ? entries.map(([key, href]) => `<a class="button secondary" href="${e(href)}">${names[key] || key}</a>`).join("") : `<span class="muted">Reimbursement links will appear here when manually configured.</span>`;
}

function trap() {
  return `<label class="trap">Company<input name="company" tabindex="-1" autocomplete="off"></label>`;
}

function turnstile(env) {
  return env.TURNSTILE_SITE_KEY ? `<div class="cf-turnstile" data-sitekey="${e(env.TURNSTILE_SITE_KEY)}" data-theme="dark"></div>` : `<p class="error">Turnstile is not configured.</p>`;
}

async function exportCsv(env, table) {
  const rows = (await env.DB.prepare(`SELECT * FROM ${table} ORDER BY created_at DESC, id DESC`).all()).results || [];
  const cols = Object.keys(rows[0] || { id: "", created_at: "", name: "", contact: "", review_status: "", internal_notes: "" });
  const body = [cols.join(","), ...rows.map((row) => cols.map((col) => `"${String(row[col] ?? "").replace(/"/g, '""')}"`).join(","))].join("\r\n");
  return withHeaders(new Response(body, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${table}.csv"` } }));
}

async function notify(env, subject, body) {
  if (!env.CONTACT_EMAIL) return;
  if (env.RESEND_API_KEY && env.EMAIL_FROM) {
    await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: env.EMAIL_FROM, to: [env.CONTACT_EMAIL], subject, text: body }) });
  } else if (env.EMAIL_WEBHOOK_URL) {
    await fetch(env.EMAIL_WEBHOOK_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ to: env.CONTACT_EMAIL, subject, body }) });
  }
}

function page(title, body) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(title)}</title><style>${CSS}</style></head><body>${body}</body></html>`;
}

function html(markup, status = 200) {
  return withHeaders(new Response(markup, { status, headers: { "Content-Type": "text/html; charset=utf-8" } }));
}

function redirect(location, setCookie) {
  const headers = { Location: location };
  if (setCookie) headers["Set-Cookie"] = setCookie;
  return withHeaders(new Response(null, { status: 303, headers }));
}

function withHeaders(response) {
  const headers = new Headers(response.headers);
  Object.entries(HEADERS).forEach(([key, value]) => headers.set(key, value));
  return new Response(response.body, { status: response.status, headers });
}

function authed(request, env) {
  return Boolean(env.ADMIN_TOKEN && cookies(request).found_cat_admin === env.ADMIN_TOKEN);
}

function cookie(request, env) {
  return `found_cat_admin=${encodeURIComponent(env.ADMIN_TOKEN)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200${new URL(request.url).protocol === "https:" ? "; Secure" : ""}`;
}

function clearCookie(request) {
  return `found_cat_admin=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${new URL(request.url).protocol === "https:" ? "; Secure" : ""}`;
}

function cookies(request) {
  return Object.fromEntries((request.headers.get("Cookie") || "").split(";").map((part) => part.trim()).filter(Boolean).map((part) => {
    const [key, ...rest] = part.split("=");
    return [key, decodeURIComponent(rest.join("=") || "")];
  }));
}

async function ipHash(request, env) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${clientIp(request)}:${env.ADMIN_TOKEN || "found-cat-oakland"}`));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function clientIp(request) {
  return request.headers.get("CF-Connecting-IP") || (request.headers.get("X-Forwarded-For") || "").split(",")[0].trim() || "unknown";
}

function text(form, key, max = 1000) {
  return String(form.get(key) || "").replace(/\u0000/g, "").trim().slice(0, max);
}

function valid(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

function cents(value) {
  return Math.round(Number(String(value || "").replace(/[^0-9.]/g, "")) * 100) || 0;
}

function money(value) {
  return `$${(Number(value || 0) / 100).toFixed(2)}`;
}

function date(value) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? e(value || "") : new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(d);
}

function cleanLinks(links) {
  return Object.fromEntries(Object.entries(links).filter(([, value]) => value));
}

function ok(message) {
  return `<p class="ok">${e(message)}</p>`;
}

function publicError(message, status = 400) {
  const error = new Error(message);
  error.publicMessage = message;
  error.status = status;
  return error;
}

function e(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

const CSS = `
:root{color-scheme:dark;--bg:#151412;--panel:#26211b;--panel2:#30291f;--text:#fff8ea;--muted:#d3c6ad;--gold:#f2b84b;--mint:#86c6a8;--blue:#8ec6d8;--danger:#ff9b8c;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--text);font-size:16px;line-height:1.6}a{color:inherit}.wrap{width:min(1120px,calc(100% - 32px));margin:auto;padding-block:54px}header{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 16px;border-bottom:1px solid #ffffff20;background:#151412ee;backdrop-filter:blur(14px)}nav{display:none;gap:8px}.brand{display:inline-flex;align-items:center;gap:10px;font-weight:900;text-decoration:none}.brand span,.placeholder:before{width:28px;height:28px;border:2px solid var(--gold);border-radius:8px;background:linear-gradient(135deg,var(--gold),transparent 55%),linear-gradient(315deg,var(--mint),transparent 55%),var(--panel);content:"";display:inline-block}.band{background:linear-gradient(180deg,#30291fcc,#1e1b17d6);border-block:1px solid #ffffff18}.hero .wrap{display:grid;gap:22px;padding-block:70px 46px}.eyebrow{margin:0 0 8px;color:var(--gold);font-size:.78rem;font-weight:900;text-transform:uppercase}h1,h2,h3{margin:0;line-height:1.1}h1{max-width:980px;font-size:2.4rem}h2{font-size:1.8rem}p{overflow-wrap:anywhere}.lead{max-width:760px;color:var(--muted);font-size:1.08rem}.actions{display:flex;flex-wrap:wrap;gap:10px}.button{display:inline-flex;min-height:44px;align-items:center;justify-content:center;padding:10px 15px;border:1px solid transparent;border-radius:8px;font:inherit;font-weight:900;text-align:center;text-decoration:none;cursor:pointer}.primary{background:var(--gold);color:#20170d}.secondary{border-color:#fff8ea38;background:#fff8ea14}.ghost{border-color:#f2b84b80;color:var(--gold);background:transparent}.notice,.card,.item,.stats article{border:1px solid #fff8ea21;border-radius:8px;background:#26211bea;box-shadow:0 18px 50px #00000038}.notice{max-width:820px;padding:16px;color:var(--muted)}.muted,small,figcaption{color:var(--muted)}.gallery,.split,.formgrid,.stats,.grid{display:grid;gap:14px}.gallery figure{margin:0;overflow:hidden;border:1px solid #fff8ea24;border-radius:8px;background:var(--panel)}.placeholder{display:grid;min-height:230px;place-items:center;align-content:center;gap:10px;background:linear-gradient(135deg,#f2b84b29,#86c6a81f);text-align:center}.placeholder:before{width:58px;height:58px}.gallery figcaption{padding:10px 12px;font-weight:800}.badges{display:flex;flex-wrap:wrap;gap:9px;margin-top:18px}.badges span,.status{display:inline-flex;min-height:32px;align-items:center;padding:5px 10px;border:1px solid #86c6a859;border-radius:8px;color:#d9f4e7;background:#86c6a81c;font-weight:900}.card,.item,.stats article{padding:18px}.list{display:grid;gap:14px;margin-top:18px}.item{border-left:4px solid var(--mint)}.row,.rows li{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.rows{display:grid;gap:10px;padding:0;list-style:none}label{display:grid;gap:6px;font-weight:900}input,select,textarea{width:100%;min-height:44px;border:1px solid #fff8ea38;border-radius:8px;padding:10px;background:#0c0b0a99;color:var(--text);font:inherit}textarea{resize:vertical}.trap{position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden}.ok{color:var(--mint);font-weight:900}.error{color:var(--danger);font-weight:900}.stats{margin:22px 0}.stats span{display:block;color:var(--muted);font-weight:900}.stats b{display:block;margin-top:6px;font-size:1.45rem}dl{display:grid;gap:6px}dt{color:var(--gold);font-weight:900}dd{margin:0 0 8px;color:var(--muted);white-space:pre-wrap}.check{display:flex;align-items:center;gap:10px}.check input{width:20px;min-height:20px}footer{padding:30px 16px;border-top:1px solid #fff8ea20;color:var(--muted)}.login{width:min(460px,calc(100% - 32px));margin:8vh auto}.login.card{padding:24px}@media(min-width:720px){nav{display:flex}h1{font-size:3.4rem}h2{font-size:2.1rem}.gallery,.stats{grid-template-columns:repeat(3,1fr)}.split,.formgrid{grid-template-columns:minmax(0,.85fr) minmax(0,1.15fr)}.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:520px){.actions .button{width:100%}header{align-items:flex-start}.stats b{font-size:1.25rem}}
`;
