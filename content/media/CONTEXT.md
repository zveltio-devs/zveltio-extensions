# content/media — context

## Engine dual door removed (2026-08-21)

`/api/media` in the engine is a **410 Gone** shim pointing at
`/ext/content/media`. Studio already used the extension; keeping a live twin
in core was the audit failure mode (fix the dead copy). Do not remount
handlers under `/api/media`.

---

Repaired 2026-08-11. Deletion is pressed live with a positive control; the
remaining routes (27) were not walked, so this is **not "verified"**.

## The hole: any user could trash any file in their tenant

The router required only a session, and `moveToTrash` filters on id, `deleted_at`
and tenant — nowhere any owner check. So anyone authenticated could destroy
anyone's file by naming its id. On **both** doors: the simple one and
`POST /files/batch-delete`, which takes an arbitrary list.

The engine received the repair on 2026-07-31 (`462310a`), on `routes/media.ts` —
which has **zero consumers**. Studio reaches media through `/ext/content/media`.
The repair sat for two weeks on the copy nobody runs.

Now: owner or tenant administrator. Deliberately not "anyone who can read it" —
reading a shared file and destroying it are different acts.

## Why nobody saw it

The same cause as [data/import](../../data/import/CONTEXT.md): the feature moved
from the engine into the extension, but the old route stayed mounted. The audit
read the engine, where the code was still visible and still had routes, and found
exactly the problem — on the dead side. The move took the feature out of the
audit's range without taking it out of the product.

Automated checking could not catch it: there is no test that puts two users in the
same tenant and has them step on each other.

## What was actually pressed

Virgin database, two users, extension enabled:

1. Mallory, with `*` on the `media` resource, deletes Owner's file → **403**, file
   `INTACT`.
2. The same, on the batch door → `{"deleted":0,"refused":1}`, file `INTACT`.
3. **Positive control:** Owner deletes their own file → **200**, `deleted_at` set.

Point 1 without 3 would have meant nothing — a 403 is also what you get by
breaking everything. The first 403 received actually came from the permission
gate, because under deny-by-default a new user has no access to media at all; `*`
had to be granted **in order to reach** the code under test.

## Section G — pressed 2026-08-12: 27/27

All 27 routes pressed on a virgin database, with a live engine. Two things
repaired, both found only by pressing — reading the code would not have shown
them.

### Collections were impossible to use from any client

`randomUUID().replace(/-/g, '')` generated ids **without hyphens** for files,
folders and tags. The column is `uuid`, so Postgres normalised on storage — but
the response returned the locally built object, not the saved row. The client
received `bec8520945ff46c6ba19506735a65fe9` for a row stored as
`bec85209-45ff-46c6-ba19-506735a65fe9`.

Three endpoints validate `z.string().uuid()`: `POST /collections`
(`cover_file_id`), `PATCH /collections/:id` (`cover_file_id`) and
`POST /collections/:id/files`. **All three rejected with 400 exactly the id the
API had just handed out.** The same file, written with hyphens: `{"added":1}`.

Repaired by separating the two things that had been one: the row's `id` is a
canonical UUID, and the storage key stays hyphen-free — object names always looked
like that and existing files are named that way. `storage/cloud` already did it
correctly (`${id.replace(/-/g,'')}${ext}`); the wrong pattern was only here,
verified by searching the whole repository.

**Why nothing caught it:** no test takes an id from a response and sends it back.
Tests build their own UUIDs, which have hyphens.

### Quotas answered 500 to an administrator's mistake

`POST /admin/quotas` with a non-existent or malformed `user_id` gave 500 — a
foreign key violation coming out as an internal error. Now: `.uuid()` in the
schema catches the wrong shape, and SQLSTATE `23503` becomes a 400 with "Unknown
user_id". Verified in all three directions, including that a real user still
returns 201.

### Verified, not assumed

`DELETE /files/:id` and `POST /files/batch-delete` were separately confirmed to
**actually delete** — the first response received was a 404 on a file already
deleted by the previous step, and `batch-delete` had at one point reported
`deleted:0`. A success code on a delete that does not delete looks identical to
one that does.

## What is still open
- `cc11e15` (engine): "files are the uploader's unless they are library assets" —
  a listing visibility change, again on the dead copy, **not ported**.
- The engine's `routes/media.ts` (784 lines, 17 routes, all covered by the
  extension) and `zv_storage_quotas` / `zv_media_favorites` in `schema.ts` — to be
  deleted.
- `lib/cloud/trash.ts` and `lib/cloud/document-indexer.ts` stay in the engine and
  are borrowed through `ctx.internals`. Once `routes/media.ts` goes, they have no
  host consumer left — an owner's decision.

## SDUI migration (2026-08-21)
Branch: feat/sdui-tier3-reduced
Folders/tags/collections; file browser+upload deferred.
