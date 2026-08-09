import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { ExtensionContext } from '@zveltio/sdk/extension';
import { permissionGate } from '@zveltio/sdk/extension';

async function getUser(c: any, auth: any) {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  return session?.user ?? null;
}

const goodSchema = z.object({
  tariff_code: z.string().min(1),
  description: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string().default('BUC'),
  weight_kg: z.number().min(0),
});

const declarationSchema = z.object({
  transport_date: z.string().min(1),
  vehicle_plate: z.string().min(1),
  driver_name: z.string().min(1),
  driver_cnp: z.string().optional(),
  departure_address: z.string().min(1),
  departure_county: z.string().min(1),
  departure_country: z.string().default('RO'),
  destination_address: z.string().min(1),
  destination_county: z.string().min(1),
  destination_country: z.string().default('RO'),
  goods: z.array(goodSchema).default([]),
  total_weight_kg: z.number().min(0).default(0),
  purpose: z.enum(['commercial', 'personal', 'return']).default('commercial'),
});

export function etransportRoutes(ctx: ExtensionContext): Hono {
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
  app.use('*', permissionGate(ctx, 'etransport'));

  app.get('/', async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const { status, from, to } = c.req.query();
    let query = db
      .selectFrom('zv_etransport_declarations')
      .select(['id', 'uit', 'transport_date', 'vehicle_plate', 'driver_name',
               'departure_county', 'destination_county', 'total_weight_kg',
               'purpose', 'status', 'created_at'])
      .orderBy('transport_date', 'desc');

    if (status) query = query.where('status', '=', status);
    if (from) query = query.where('transport_date', '>=', from);
    if (to) query = query.where('transport_date', '<=', to);

    const declarations = await query.execute();
    return c.json({ declarations });
  });

  app.get('/:id', zValidator('param', z.object({ id: z.string().uuid() })), async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const decl = await db
      .selectFrom('zv_etransport_declarations')
      .selectAll()
      .where('id', '=', c.req.param('id'))
      .executeTakeFirst();

    if (!decl) return c.json({ error: 'Declaration not found' }, 404);
    const goods = typeof decl.goods === 'string' ? JSON.parse(decl.goods) : decl.goods;
    return c.json({ declaration: { ...decl, goods } });
  });

  app.post('/', zValidator('json', declarationSchema), async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const body = c.req.valid('json');
    const decl = await db
      .insertInto('zv_etransport_declarations')
      .values({ ...body, goods: JSON.stringify(body.goods) })
      .returningAll()
      .executeTakeFirst();

    return c.json({ declaration: decl }, 201);
  });

  app.patch('/:id', zValidator('param', z.object({ id: z.string().uuid() })), zValidator('json', declarationSchema.partial()), async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const body = c.req.valid('json');
    const updates: any = { updated_at: new Date() };
    for (const [k, v] of Object.entries(body)) {
      if (v !== undefined) updates[k] = k === 'goods' ? JSON.stringify(v) : v;
    }

    const decl = await db
      .updateTable('zv_etransport_declarations')
      .set(updates)
      .where('id', '=', c.req.param('id'))
      .where('status', '=', 'draft')
      .returningAll()
      .executeTakeFirst();

    if (!decl) return c.json({ error: 'Declaration not found or not editable' }, 404);
    return c.json({ declaration: decl });
  });

  app.delete('/:id', zValidator('param', z.object({ id: z.string().uuid() })), async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    await db
      .deleteFrom('zv_etransport_declarations')
      .where('id', '=', c.req.param('id'))
      .where('status', '=', 'draft')
      .execute();

    return c.json({ success: true });
  });

  app.post('/:id/declare', zValidator('param', z.object({ id: z.string().uuid() })), async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const decl = await db
      .selectFrom('zv_etransport_declarations')
      .selectAll()
      .where('id', '=', c.req.param('id'))
      .executeTakeFirst();

    if (!decl) return c.json({ error: 'Declaration not found' }, 404);
    if (decl.status !== 'draft') return c.json({ error: 'Only draft declarations can be declared' }, 400);

    // No UIT is invented here, and that is the entire point of this branch.
    //
    // This route used to FABRICATE one: `RO` followed by the current
    // timestamp. It stored that as the UIT, moved the declaration to
    // `declared`, saved a made-up ANAF response with `ExecutionStatus: '0'`,
    // and replied "Declaration submitted to ANAF". Nothing was ever sent —
    // there is no call to anaf.ro anywhere in this extension, and no XML
    // generator to send.
    //
    // A fabricated e-Factura index costs somebody a penalty months later. A
    // fabricated UIT costs them the same afternoon: the code travels WITH the
    // goods, the driver is required to have it, and it is checked at the
    // roadside. A number that does not exist in ANAF's system means a fine and
    // seized goods, for a driver who was told the paperwork was done.
    //
    // What is missing, so nobody has to rediscover it: the declaration XML
    // (ANAF's e-Transport v2 XSD), the OAuth client, and several mandatory
    // fields this table cannot hold — customs codes (NC) per goods line, net
    // weight alongside gross, and the partner's identification.
    return c.json(
      {
        code: 'anaf_etransport_not_implemented',
        error:
          'Declaring to ANAF is not implemented: this build has no e-Transport XML generator and no SPV integration. ' +
          'NO UIT was issued and the declaration is unchanged. A UIT can only come from ANAF — obtain it in SPV and ' +
          'record it here, because a code that did not come from them is not a UIT.',
        declared: false,
      },
      501,
    );
  });


  /**
   * Record a UIT obtained in SPV by hand.
   *
   * Until this extension can talk to ANAF, the declaration still has to travel
   * with the goods — so the useful thing is not to pretend, but to let somebody
   * who got the code the manual way keep it where the rest of the transport
   * lives. That turns the extension from something that fabricates into a
   * register that is merely incomplete, which is a different kind of thing.
   *
   * The format is checked only for shape, not validity: only ANAF can say
   * whether a UIT is real, and refusing a correctly-shaped code because this
   * codebase does not recognise it would be the same overconfidence in reverse.
   */
  app.post('/:id/record-uit',
    zValidator('param', z.object({ id: z.string().uuid() })),
    zValidator('json', z.object({
      uit: z.string().trim().min(4).max(64),
      /** Where it came from, since it did not come from here. */
      note: z.string().optional(),
    })),
    async (c) => {
      const user = await getUser(c, auth);
      if (!user) return c.json({ error: 'Unauthorized' }, 401);
      const d = c.req.valid('json');

      const row = await db
        .updateTable('zv_etransport_declarations')
        .set({
          uit: d.uit,
          status: 'declared',
          anaf_response: JSON.stringify({
            source: 'manual',
            recorded_by: user.id,
            recorded_at: new Date().toISOString(),
            note: d.note ?? null,
          }),
          updated_at: new Date(),
        })
        .where('id', '=', c.req.param('id'))
        .where('status', '=', 'draft')
        .returning(['id', 'uit', 'status'])
        .execute();

      if (!row.length) return c.json({ error: 'Declaration not found, or not a draft' }, 404);
      return c.json({ data: row[0] });
    },
  );

  app.post('/:id/complete', zValidator('param', z.object({ id: z.string().uuid() })), async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    await db
      .updateTable('zv_etransport_declarations')
      .set({ status: 'completed', updated_at: new Date() })
      .where('id', '=', c.req.param('id'))
      .where('status', 'in', ['declared', 'in_transit'])
      .execute();

    return c.json({ success: true });
  });

  app.post('/:id/cancel', zValidator('param', z.object({ id: z.string().uuid() })), async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    await db
      .updateTable('zv_etransport_declarations')
      .set({ status: 'cancelled', updated_at: new Date() })
      .where('id', '=', c.req.param('id'))
      .where('status', 'not in', ['completed', 'cancelled'])
      .execute();

    return c.json({ success: true });
  });

  return app;
}
