import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';
import type { ExtensionContext } from '@zveltio/sdk/extension';
import { permissionGate } from '@zveltio/sdk/extension';
import { toJsonb } from '@zveltio/sdk/extension';

async function getUser(c: any, auth: any) {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  return session?.user ?? null;
}

const DOC_TYPES = ['contract', 'pv', 'nir', 'dispozitie_plata', 'proces_verbal', 'notificare', 'other'] as const;

/**
 * Prefixes used when a company issues its first document of a type and its
 * register sequence is created. Same values 001_initial.sql seeds, kept here
 * because sequences are now created on demand, per company, rather than only at
 * install time. A company can change its prefix or format afterwards; this is
 * only the starting point.
 */
const DEFAULT_PREFIX: Record<(typeof DOC_TYPES)[number], string> = {
  contract: 'CTR',
  pv: 'PV',
  nir: 'NIR',
  dispozitie_plata: 'DP',
  proces_verbal: 'PVG',
  notificare: 'NOT',
  other: 'DOC',
};

/**
 * May this user take the decision this module exists to record?
 *
 * Semnarea unui document. Semnătura e chiar actul; cine o poate aplica în numele firmei nu poate fi „oricine are acces la modul”.
 *
 * It sat behind one `ro-documents` permission — the same one needed to look at the
 * list — and asked nothing else. Found by `scripts/check-decision-routes.ts`,
 * which was written after the same shape turned up in four extensions in a row.
 *
 * `ro-documents:sign`, granted deliberately, with `admin` still sufficient so an
 * existing install keeps working before anyone edits policies.
 */
async function mayDecide(ctx: ExtensionContext, user: any): Promise<boolean> {
  if (await ctx.checkPermission(user.id, 'ro-documents', 'sign').catch(() => false)) return true;
  return ctx.checkPermission(user.id, 'admin', '*').catch(() => false);
}

/** Thrown so the transaction rolls back — a RETURNED value commits, and the
 *  register number has already been advanced by then. */
const NO_REGISTER_NUMBER = Symbol('ro-documents-no-number');

export function roDocumentsRoutes(ctx: ExtensionContext): Hono {
  const { db, auth } = ctx;

  // `db` is `ctx.db`: a proxy the engine hands over that resolves the CURRENT
  // tenant transaction per query via AsyncLocalStorage (H-12). A plain `db` in
  // a handler is therefore already RLS-scoped — there is one spelling, so there
  // is none to forget.

  const app = new Hono();

  app.use('*', async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    c.set('user', session.user);
    await next();
  });
  app.use('*', permissionGate(ctx, 'ro-documents'));

  // GET /templates
  app.get('/templates', async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const templates = await db
      .selectFrom('zv_ro_document_templates')
      .select(['id', 'name', 'type', 'description', 'variables'])
      .where('is_active', '=', true)
      .orderBy('name', 'asc')
      .execute();

    return c.json({ templates });
  });

  // GET / — list documents
  app.get('/', async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const { type, status, category, search } = c.req.query();
    let query = db
      .selectFrom('zv_ro_documents')
      .select(['id', 'type', 'number', 'date', 'title', 'status', 'category', 'version_number', 'signed_at', 'created_at'])
      .orderBy('date', 'desc');

    if (type) query = query.where('type', '=', type);
    if (status) query = query.where('status', '=', status);
    if (category) query = query.where('category', '=', category);
    if (search) query = query.where('title', 'ilike', `%${search}%`);

    const documents = await query.execute();
    return c.json({ documents });
  });

  // GET /stats
  app.get('/stats', async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const stats = await sql<any>`
      SELECT
        COUNT(*) FILTER (WHERE status = 'draft')::int AS drafts,
        COUNT(*) FILTER (WHERE status = 'signed')::int AS signed,
        COUNT(*) FILTER (WHERE status = 'archived')::int AS archived,
        COUNT(*) FILTER (WHERE date >= CURRENT_DATE - INTERVAL '30 days')::int AS last_30_days,
        type,
        COUNT(*)::int AS count
      FROM zv_ro_documents
      GROUP BY GROUPING SETS ((), (type))
    `.execute(db).catch((err) => {
      // An empty result renders as a register with nothing in it, which is a
      // believable thing to see and a bad thing to be wrong about.
      console.error(
        `[ro/documents] register statistics failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      return { rows: [] };
    });

    return c.json({ stats: stats.rows });
  });

  // GET /:id
  app.get('/:id', async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const doc = await db
      .selectFrom('zv_ro_documents')
      .selectAll()
      .where('id', '=', c.req.param('id'))
      .executeTakeFirst();

    if (!doc) return c.json({ error: 'Document not found' }, 404);
    return c.json({ document: doc });
  });

  // POST /
  app.post(
    '/',
    zValidator(
      'json',
      z.object({
        type: z.enum(DOC_TYPES),
        number: z.string().min(1).optional(),
        date: z.string(),
        title: z.string().min(1),
        category: z.string().optional(),
        parties: z.array(z.object({ name: z.string(), cui: z.string().optional(), role: z.string() })).default([]),
        content: z.string().optional(),
        template_id: z.string().optional(),
        metadata: z.record(z.string(), z.any()).default({}),
        internal_notes: z.string().optional(),
      }),
    ),
    async (c) => {
      const user = await getUser(c, auth);
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const body = c.req.valid('json');

      // Auto-generate number from the register sequence if not provided.
      //
      // Deliberately one statement. It claims the next number, creates the
      // company's sequence the first time it issues a document, and restarts the
      // count in January — atomically, so two documents created at the same
      // moment cannot take the same number.
      //
      // There is no fallback number, and that is the point. This used to fall
      // back to a millisecond timestamp whenever the claim came back empty,
      // which was the normal path for every company but the first (see
      // migration 004). An issued number is a legal fact; the register either
      // gives out the next one in the series or the document is not created.
      // Claiming the register number and writing the document it belongs to.
      // The number comes from an upsert that advances a per-year sequence, so
      // claiming it without writing the document leaves a hole in a register
      // whose whole purpose is to have none.
      let doc: Awaited<ReturnType<typeof createDocument>>;
      const createDocument = () =>
        db.transaction().execute(async (trx) => {
        let number = body.number;
        if (!number) {
          const seq = await sql<{
            prefix: string;
            year: number;
            last_seq: number;
            format: string;
          }>`
            INSERT INTO zv_ro_doc_number_sequences (type, prefix, format, year, last_seq)
            VALUES (
              ${body.type},
              ${DEFAULT_PREFIX[body.type]},
              '{prefix}-{year}-{seq:4d}',
              EXTRACT(YEAR FROM NOW())::int,
              1
            )
            ON CONFLICT (tenant_id, type) DO UPDATE
            SET last_seq = CASE
                  WHEN zv_ro_doc_number_sequences.year = EXCLUDED.year
                  THEN zv_ro_doc_number_sequences.last_seq + 1
                  ELSE 1
                END,
                year = EXCLUDED.year,
                updated_at = NOW()
            RETURNING prefix, year, last_seq, format
          `.execute(trx);

          const claimed = seq.rows[0];
          if (!claimed) {
            // Unreachable in practice — the statement above always returns a row —
            // but a register that cannot number a document must say so rather than
            // store one without a number.
            // Thrown, not returned: the upsert above has already advanced the
            // sequence, and returning here would commit that — a register number
            // consumed by a document that was never created, which in a numbered
            // register is a gap somebody has to account for.
            throw NO_REGISTER_NUMBER;
          }
          number = claimed.format
            .replace('{prefix}', claimed.prefix)
            .replace('{year}', String(claimed.year))
            .replace(/{seq:(\d+)d}/, (_: string, w: string) =>
              String(claimed.last_seq).padStart(Number.parseInt(w, 10), '0'),
            );
        }

        const doc = await trx
          .insertInto('zv_ro_documents')
          .values({
            ...body,
            number,
            parties: toJsonb(body.parties),
            metadata: toJsonb(body.metadata),
            created_by: user.id,
          })
          .returningAll()
          .executeTakeFirst();

          return doc;
        });
      try {
        doc = await createDocument();
      } catch (err) {
        if (err === NO_REGISTER_NUMBER) {
          return c.json(
            { error: 'Could not claim a register number; the document was not created' },
            500,
          );
        }
        throw err;
      }

      return c.json({ document: doc }, 201);
    },
  );

  // PATCH /:id
  app.patch(
    '/:id',
    zValidator('json', z.object({
      title: z.string().optional(),
      content: z.string().optional(),
      parties: z.array(z.any()).optional(),
      metadata: z.record(z.string(), z.any()).optional(),
      internal_notes: z.string().optional(),
      category: z.string().optional(),
    })),
    async (c) => {
      const user = await getUser(c, auth);
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const body = c.req.valid('json');
      const existing = await db.selectFrom('zv_ro_documents').select(['id', 'status', 'version_number', 'content']).where('id', '=', c.req.param('id')).executeTakeFirst();
      if (!existing) return c.json({ error: 'Document not found' }, 404);
      if (existing.status !== 'draft') return c.json({ error: 'Only draft documents can be edited' }, 400);

      // Save version snapshot.
      //
      // Not caught, on purpose. This is the copy of the text as it stands right
      // now, and the update below overwrites it. Swallowing a failure here means
      // the edit still goes through and the previous version is gone for good —
      // silent, permanent loss of exactly the history this register exists to
      // keep. If the snapshot cannot be written, the edit must not happen.
      //
      // The note above is only true inside a transaction: without one, "the edit
      // must not happen" is a hope, not a guarantee.
      const updates: any = { updated_at: new Date(), version_number: existing.version_number + 1 };
      if (body.title !== undefined) updates.title = body.title;
      if (body.content !== undefined) updates.content = body.content;
      if (body.parties !== undefined) updates.parties = JSON.stringify(body.parties);
      if (body.metadata !== undefined) updates.metadata = JSON.stringify(body.metadata);
      if (body.internal_notes !== undefined) updates.internal_notes = body.internal_notes;
      if (body.category !== undefined) updates.category = body.category;

      const doc = await db.transaction().execute(async (trx) => {
        await sql`
          INSERT INTO zv_ro_document_versions (document_id, version, content, changed_by)
          VALUES (${existing.id}::uuid, ${existing.version_number}, ${existing.content ?? null}, ${user.id})
        `.execute(trx);
        return await trx
          .updateTable('zv_ro_documents')
          .set(updates)
          .where('id', '=', c.req.param('id'))
          .returningAll()
          .executeTakeFirst();
      });
      return c.json({ document: doc });
    },
  );

  // PATCH /:id/sign — mark as signed
  app.patch('/:id/sign', async (c) => {
    const _u = c.get('user') as any;
    if (!(await mayDecide(ctx, _u))) return c.json({ error: 'Not allowed' }, 403);
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const doc = await db
      .updateTable('zv_ro_documents')
      .set({ status: 'signed', signed_at: new Date(), updated_at: new Date() })
      .where('id', '=', c.req.param('id'))
      .returningAll()
      .executeTakeFirst();

    if (!doc) return c.json({ error: 'Document not found' }, 404);
    return c.json({ document: doc });
  });

  // PATCH /:id/archive
  app.patch('/:id/archive', async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const doc = await db
      .updateTable('zv_ro_documents')
      .set({ status: 'archived', archived_at: new Date(), updated_at: new Date() })
      .where('id', '=', c.req.param('id'))
      .returningAll()
      .executeTakeFirst();

    if (!doc) return c.json({ error: 'Document not found' }, 404);
    return c.json({ document: doc });
  });

  // GET /:id/versions
  app.get('/:id/versions', async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const versions = await sql<any>`
      SELECT id, version, changed_by, change_note, created_at
      FROM zv_ro_document_versions
      WHERE document_id = ${c.req.param('id')}::uuid
      ORDER BY version DESC
    `.execute(db).catch((err) => {
      // Showing "no earlier versions" for a document that has them is the exact
      // opposite of what a register is for, so say so in the log at least.
      console.error(
        `[ro/documents] version history failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      return { rows: [] };
    });

    return c.json({ versions: versions.rows });
  });

  // POST /:id/versions/:version/restore
  app.post('/:id/versions/:version/restore', async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    // Not caught: an empty result becomes "Version not found" below, so
    // swallowing a failure would tell someone their version no longer exists
    // when in fact the read broke. On a document register, a missing version and
    // a broken query must not look the same.
    const version = await sql<any>`
      SELECT content FROM zv_ro_document_versions
      WHERE document_id = ${c.req.param('id')}::uuid AND version = ${parseInt(c.req.param('version'), 10)}
    `.execute(db);

    if (!version.rows[0]) return c.json({ error: 'Version not found' }, 404);

    const existing = await db.selectFrom('zv_ro_documents').select(['version_number']).where('id', '=', c.req.param('id')).executeTakeFirst();
    if (!existing) return c.json({ error: 'Document not found' }, 404);

    // Same reasoning as the snapshot on edit, and it matters more here: the
    // restore below replaces the current text wholesale, so a swallowed failure
    // would destroy it with nothing kept back.
    const doc = await db.transaction().execute(async (trx) => {
      await sql`
        INSERT INTO zv_ro_document_versions (document_id, version, content, changed_by, change_note)
        SELECT id, ${existing.version_number}::int, content, ${user.id}, 'Pre-restore snapshot'
        FROM zv_ro_documents WHERE id = ${c.req.param('id')}::uuid
      `.execute(trx);

      return await trx
        .updateTable('zv_ro_documents')
        .set({ content: version.rows[0].content, status: 'draft', version_number: existing.version_number + 1, updated_at: new Date() })
        .where('id', '=', c.req.param('id'))
        .returningAll()
        .executeTakeFirst();
    });

    return c.json({ document: doc });
  });

  // POST /bulk-sign
  app.post(
    '/bulk-sign',
    zValidator('json', z.object({ ids: z.array(z.string().uuid()).min(1).max(50) })),
    async (c) => {
      const user = await getUser(c, auth);
      if (!user) return c.json({ error: 'Unauthorized' }, 401);
      // The bulk door needs the same key as the single one. Guarding `/:id/sign`
      // and leaving this open would only mean signing fifty at a time instead.
      if (!(await mayDecide(ctx, user))) return c.json({ error: 'Not allowed' }, 403);

      const result = await sql<any>`
        UPDATE zv_ro_documents
        SET status = 'signed', signed_at = NOW(), updated_at = NOW()
        WHERE id = ANY(${c.req.valid('json').ids}::uuid[]) AND status = 'draft'
        RETURNING id, number, title
      `.execute(db);

      return c.json({ signed: result.rows, count: result.rows.length });
    },
  );

  // DELETE /:id
  app.delete('/:id', async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    await db
      .deleteFrom('zv_ro_documents')
      .where('id', '=', c.req.param('id'))
      .where('status', '=', 'draft')
      .execute();

    return c.json({ success: true });
  });

  return app;
}
