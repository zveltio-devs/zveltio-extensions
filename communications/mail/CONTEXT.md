# communications/mail — context

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
