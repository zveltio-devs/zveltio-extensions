import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';

export function employeesRoutes(db: any, auth: any): Hono {
  const app = new Hono();

  app.use('*', async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    c.set('user', session.user);
    await next();
  });

  // ── Departments ───────────────────────────────────────────────
  app.get('/departments', async (c) => {
    const rows = await sql`
      SELECT d.*, COUNT(e.id) as employee_count
      FROM zvd_departments d
      LEFT JOIN zvd_employees e ON e.department_id = d.id AND e.status = 'active'
      GROUP BY d.id ORDER BY d.name
    `.execute(db);
    return c.json({ data: rows.rows });
  });

  app.post('/departments', zValidator('json', z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    manager_id: z.string().uuid().optional(),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_departments (name, description, manager_id, created_by)
      VALUES (${d.name}, ${d.description ?? null}, ${d.manager_id ?? null}, ${user.id})
      RETURNING *
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  // ── Job Positions ─────────────────────────────────────────────
  app.get('/positions', async (c) => {
    const rows = await sql`SELECT * FROM zvd_job_positions ORDER BY title`.execute(db);
    return c.json({ data: rows.rows });
  });

  app.post('/positions', zValidator('json', z.object({
    title: z.string().min(1),
    department_id: z.string().uuid().optional(),
    description: z.string().optional(),
    min_salary: z.number().optional(),
    max_salary: z.number().optional(),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_job_positions (title, department_id, description, min_salary, max_salary, created_by)
      VALUES (${d.title}, ${d.department_id ?? null}, ${d.description ?? null},
        ${d.min_salary ?? null}, ${d.max_salary ?? null}, ${user.id})
      RETURNING *
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  // ── Employees ─────────────────────────────────────────────────
  app.get('/', async (c) => {
    const { limit = '50', page = '1', department_id, status, q } = c.req.query();
    const lim = Math.min(+limit, 200);
    const offset = (Math.max(1, +page) - 1) * lim;
    const rows = await sql`
      SELECT e.*, d.name as department_name, p.title as position_title
      FROM zvd_employees e
      LEFT JOIN zvd_departments d ON d.id = e.department_id
      LEFT JOIN zvd_job_positions p ON p.id = e.position_id
      WHERE (${department_id ? sql`e.department_id = ${department_id}` : sql`TRUE`})
        AND (${status ? sql`e.status = ${status}` : sql`TRUE`})
        AND (${q ? sql`(e.first_name ILIKE ${'%' + q + '%'} OR e.last_name ILIKE ${'%' + q + '%'} OR e.email ILIKE ${'%' + q + '%'})` : sql`TRUE`})
      ORDER BY e.last_name, e.first_name
      LIMIT ${lim} OFFSET ${offset}
    `.execute(db);
    return c.json({ data: rows.rows });
  });

  app.get('/:id', async (c) => {
    const row = await sql`
      SELECT e.*, d.name as department_name, p.title as position_title
      FROM zvd_employees e
      LEFT JOIN zvd_departments d ON d.id = e.department_id
      LEFT JOIN zvd_job_positions p ON p.id = e.position_id
      WHERE e.id = ${c.req.param('id')}
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: row.rows[0] });
  });

  app.post('/', zValidator('json', z.object({
    first_name: z.string().min(1),
    last_name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
    cnp: z.string().optional(),
    department_id: z.string().uuid().optional(),
    position_id: z.string().uuid().optional(),
    manager_id: z.string().uuid().optional(),
    hire_date: z.string(),
    contract_type: z.enum(['full_time','part_time','contractor','intern']).default('full_time'),
    gross_salary: z.number().positive(),
    bank_iban: z.string().optional(),
    address: z.string().optional(),
    notes: z.string().optional(),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_employees (first_name, last_name, email, phone, cnp, department_id, position_id,
        manager_id, hire_date, contract_type, gross_salary, bank_iban, address, notes, created_by)
      VALUES (${d.first_name}, ${d.last_name}, ${d.email}, ${d.phone ?? null}, ${d.cnp ?? null},
        ${d.department_id ?? null}, ${d.position_id ?? null}, ${d.manager_id ?? null},
        ${d.hire_date}, ${d.contract_type}, ${d.gross_salary}, ${d.bank_iban ?? null},
        ${d.address ?? null}, ${d.notes ?? null}, ${user.id})
      RETURNING *
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  app.patch('/:id', zValidator('json', z.object({
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    department_id: z.string().uuid().optional(),
    position_id: z.string().uuid().optional(),
    manager_id: z.string().uuid().optional(),
    gross_salary: z.number().optional(),
    bank_iban: z.string().optional(),
    address: z.string().optional(),
    notes: z.string().optional(),
  })), async (c) => {
    const d = c.req.valid('json');
    const row = await sql`
      UPDATE zvd_employees SET
        first_name = COALESCE(${d.first_name ?? null}, first_name),
        last_name = COALESCE(${d.last_name ?? null}, last_name),
        email = COALESCE(${d.email ?? null}, email),
        phone = COALESCE(${d.phone ?? null}, phone),
        department_id = COALESCE(${d.department_id ?? null}, department_id),
        position_id = COALESCE(${d.position_id ?? null}, position_id),
        manager_id = COALESCE(${d.manager_id ?? null}, manager_id),
        gross_salary = COALESCE(${d.gross_salary ?? null}, gross_salary),
        bank_iban = COALESCE(${d.bank_iban ?? null}, bank_iban),
        address = COALESCE(${d.address ?? null}, address),
        notes = COALESCE(${d.notes ?? null}, notes),
        updated_at = NOW()
      WHERE id = ${c.req.param('id')} RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: row.rows[0] });
  });

  app.post('/:id/terminate', zValidator('json', z.object({
    termination_date: z.string(),
    reason: z.string().optional(),
  })), async (c) => {
    const d = c.req.valid('json');
    const row = await sql`
      UPDATE zvd_employees SET status = 'terminated', termination_date = ${d.termination_date},
        termination_reason = ${d.reason ?? null}, updated_at = NOW()
      WHERE id = ${c.req.param('id')} AND status = 'active' RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Employee not found or already terminated' }, 400);
    return c.json({ data: row.rows[0] });
  });

  // ── Documents ─────────────────────────────────────────────────
  app.get('/:id/documents', async (c) => {
    const rows = await sql`SELECT * FROM zvd_employee_documents WHERE employee_id = ${c.req.param('id')} ORDER BY created_at DESC`.execute(db);
    return c.json({ data: rows.rows });
  });

  app.post('/:id/documents', zValidator('json', z.object({
    type: z.string().min(1),
    name: z.string().min(1),
    file_url: z.string().url(),
    expiry_date: z.string().optional(),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_employee_documents (employee_id, type, name, file_url, expiry_date, created_by)
      VALUES (${c.req.param('id')}, ${d.type}, ${d.name}, ${d.file_url}, ${d.expiry_date ?? null}, ${user.id})
      RETURNING *
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  // ── Onboarding ────────────────────────────────────────────────
  app.get('/:id/onboarding', async (c) => {
    const rows = await sql`SELECT * FROM zvd_onboarding_tasks WHERE employee_id = ${c.req.param('id')} ORDER BY sort_order`.execute(db);
    return c.json({ data: rows.rows });
  });

  app.post('/:id/onboarding', zValidator('json', z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    assigned_to: z.string().uuid().optional(),
    due_date: z.string().optional(),
    sort_order: z.number().int().default(0),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_onboarding_tasks (employee_id, title, description, assigned_to, due_date, sort_order, created_by)
      VALUES (${c.req.param('id')}, ${d.title}, ${d.description ?? null}, ${d.assigned_to ?? null},
        ${d.due_date ?? null}, ${d.sort_order}, ${user.id})
      RETURNING *
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  app.patch('/onboarding/:taskId', zValidator('json', z.object({
    is_completed: z.boolean().optional(),
    notes: z.string().optional(),
  })), async (c) => {
    const d = c.req.valid('json');
    const row = await sql`
      UPDATE zvd_onboarding_tasks SET
        is_completed = COALESCE(${d.is_completed ?? null}, is_completed),
        completed_at = ${d.is_completed === true ? sql`NOW()` : sql`completed_at`},
        notes = COALESCE(${d.notes ?? null}, notes),
        updated_at = NOW()
      WHERE id = ${c.req.param('taskId')} RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: row.rows[0] });
  });

  // ── Stats ─────────────────────────────────────────────────────
  app.get('/stats', async (c) => {
    const row = await sql`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'active') as active,
        COUNT(*) FILTER (WHERE status = 'terminated') as terminated,
        COUNT(*) FILTER (WHERE hire_date >= date_trunc('month', NOW())) as new_this_month,
        COUNT(*) FILTER (WHERE contract_type = 'full_time') as full_time,
        COUNT(*) FILTER (WHERE contract_type = 'part_time') as part_time
      FROM zvd_employees
    `.execute(db);
    return c.json({ data: row.rows[0] });
  });

  return app;
}
