# Context

**Status 2026-09-07: `reviewed` for `engine/`.** Every file under `engine/` read
end to end, the guards exercised in both directions, tenant boundary and RLS
checked in the catalog. `client/` is 10 lines and `studio/` is not covered.

---

# Section 6 of the review campaign — 2026-09-07

Four defects. Two false alarms I caught before writing them down, which are
recorded here because the checks that caught them are the reusable part.

## Any member of the tenant could delete any file, and the owner could not get it back

`POST /files/:id/trash`, `DELETE /files/:id` and `POST /files/:id/restore` all
filtered on id and `deleted_at`. `moveToTrash(db, fileId, userId)` takes the user
only to STAMP `deleted_by`; nothing compared it to `created_by`.

Measured on a two-user database:

```
stranger trashes owner's file -> ACCEPTED
file created_by  : owner
deleted_by       : stranger
owner     sees it in trash: NO
stranger  sees it in trash: yes
```

The second half is what makes it worse than a permission gap. `listTrash`
filtered on `deleted_by`, so the file left the owner's view entirely — they
could not restore what they could not see — and `purgeExpiredTrash` removed it
permanently after thirty days.

**Third door onto this operation.** The engine's `/api/media` got the check on
2026-07-31; `content/media` got it later, with a note saying the engine's copy
"has been sitting on the copy nobody runs while this one stayed open". This
extension writes the same tables through the same helper and asked nothing.

`mayDeleteFile` is owner-or-tenant-admin, the same rule and the same wording as
`content/media`. `listTrash` now matches `deleted_by OR created_by`: owning the
file is as good a reason to see it in the trash as having put it there.

## The download limit on a public share was advisory

`validateShareToken` read `download_count` and compared it to `max_downloads`;
the route then presigned a URL and called a separate unconditional increment.
Nothing held the row between the two. Measured, `max_downloads: 1`:

```
A: SERVED FILE
B: SERVED FILE
download_count now: 2 (limit 1)
```

The token is the only other thing between a recipient and unlimited
redistribution, so the limit is the whole control. `claimDownload` makes the
check and the increment one statement, and the route claims BEFORE the URL is
handed out.

**The calling block exists twice** — `/share/:token` and
`makePublicShareHandler`. The edit asserted on finding both and found two; one
of them would otherwise have kept the race, and the token a recipient actually
receives is served by only one of the two.

## A purge that deleted the record and left the bytes

`deleteObject` returned `void` and swallowed everything — `if (!aws) return`
when storage is unconfigured, and `.catch(() => undefined)` on the request.
`purgeExpiredTrash` then deleted the row regardless.

So on an install with no object storage configured, or one where the DELETE is
refused, every expired file lost its record and kept its bytes: orphaned objects
the operator pays for, with nothing left that knows they exist. And `purged`
counted them.

`deleteObject` returns a boolean now (a 404 counts as done — the caller wanted
the object gone). The purge keeps the row when any object survives and says so,
which is what makes the next daily run a retry rather than a no-op.

`file-versions.ts` also calls it and deliberately ignores the result; its comment
already argues row-first, object-second, because an orphaned blob is the cheaper
failure there. Unchanged.

## Two false alarms, and what caught them

**"No owner column, so unscoped delete is correct."** I queried four column names
and `created_by` was not among them, concluded the library was tenant-shared by
design, and nearly closed the finding. `content/media`'s own `mayDeleteFile`
reads `created_by` — the column exists and I had asked the wrong question. Ask
the schema what it HAS, not whether it has the name you guessed.

**"The media tables have no RLS at all."** Measured `relrowsecurity = f` on
`zv_media_files` and had a cross-tenant read and write to prove it. The cause was
my database: I had applied `storage/cloud`'s migrations and not `content/media`'s,
and `content/media` migration 002 is what enables RLS on those tables. With both
applied, they are ENABLE + FORCE with a policy.

That one would have been a false critical in a published document. The tables an
extension READS may be created and policed by a DIFFERENT extension, so a
database holding only the extension under review is not the product.

## Still open, and not mine to close

- **`zv_media_versions` and `zv_media_favorites` are refused by the table
  guard.** Both are engine-declared and created by `content/media`; neither is in
  `EXTENSION_TABLE_GRANTS['storage/cloud']`. Verified through the real
  `createRestrictedDb` with two positive controls: `zv_media_files` and
  `zv_cloud_shares` pass, these two do not. The builder call sites — favourites
  in `routes.ts:237-251`, versions in `file-versions.ts:40,58,143` — refuse; the
  raw `sql` sites beside them work, because the proxy guards the query builder
  and not the statement. Adding the two entries is a one-line change in the
  ENGINE repository.
- **`zv_media_versions` and `zv_media_shares` carry no `tenant_id`** and are
  absent from `content/media` migration 002. Already known and mitigated for
  versions: `listFileVersions` INNER JOINs the policed parent and
  `restoreFileVersion` checks the file before fetching bytes, both with the
  reasoning written out. Shares are reached by a 32-character nanoid token, and
  `listUserShares`/`revokeShare` scope by `created_by`. Recorded rather than
  changed: adding the column belongs with whoever owns those tables.

## What was verified

- All three `storage/cloud` migrations and both `content/media` migrations on a
  database built from scratch (`zv_sc_s1`).
- 33 tests across four files. Reverting `claimDownload` to unconditional turns
  three red; reverting `mayDeleteFile` and `listTrash` turns three others red.
  Each suite carries its control — two downloads that DO fit are both served, a
  tenant admin MAY delete, an unrelated member does NOT see the file — because a
  guard that refuses everything passes every refusal test.
- 735 pass / 2 skip / 0 fail; eleven extension gates green; the engine's
  `admin-gate-check`, `check:atomic-writes` (32) and `catch:fabricated` (0) all
  green.

---

## SDUI migration (2026-08-21)
Branch: feat/sdui-edge-i18n-storage
Files (path search), shares, retention, quotas. Tradeoff: no drag-upload / breadcrumb browser.
