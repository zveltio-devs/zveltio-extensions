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

  // ── Departments ────────────────────────────────────────────────
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
    parent_id: z.string().uuid().optional(),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_departments (name, description, manager_id, parent_id, created_by)
      VALUES (${d.name}, ${d.description ?? null}, ${d.manager_id ?? null}, ${d.parent_id ?? null}, ${user.id})
      RETURNING *
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  app.patch('/departments/:id', zValidator('json', z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    manager_id: z.string().uuid().optional(),
  })), async (c) => {
    const d = c.req.valid('json');
    const row = await sql`
      UPDATE zvd_departments SET
        name = COALESCE(${d.name ?? null}, name),
        description = COALESCE(${d.description ?? null}, description),
        manager_id = COALESCE(${d.manager_id ?? null}, manager_id),
        updated_at = NOW()
      WHERE id = ${c.req.param('id')} RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: row.rows[0] });
  });

  // ── Job Positions ──────────────────────────────────────────────
  app.get('/positions', async (c) => {
    const rows = await sql`SELECT * FROM zvd_job_positions WHERE is_active = true ORDER BY title`.execute(db);
    return c.json({ data: rows.rows });
  });

  app.post('/positions', zValidator('json', z.object({
    title: z.string().min(1),
    department_id: z.string().uuid().optional(),
    level: z.enum(['junior','mid','senior','lead','manager','director','executive']).default('mid'),
    description: z.string().optional(),
    min_salary: z.number().optional(),
    max_salary: z.number().optional(),
  })), async (c) => {
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_job_positions (title, department_id, level, description, min_salary, max_salary)
      VALUES (${d.title}, ${d.department_id ?? null}, ${d.level}, ${d.description ?? null}, ${d.min_salary ?? null}, ${d.max_salary ?? null})
      RETURNING *
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  app.patch('/positions/:id', zValidator('json', z.object({
    title: z.string().optional(),
    is_active: z.boolean().optional(),
    description: z.string().optional(),
    min_salary: z.number().optional(),
    max_salary: z.number().optional(),
  })), async (c) => {
    const d = c.req.valid('json');
    const row = await sql`
      UPDATE zvd_job_positions SET
        title = COALESCE(${d.title ?? null}, title),
        is_active = COALESCE(${d.is_active ?? null}, is_active),
        description = COALESCE(${d.description ?? null}, description),
        min_salary = COALESCE(${d.min_salary ?? null}, min_salary),
        max_salary = COALESCE(${d.max_salary ?? null}, max_salary)
      WHERE id = ${c.req.param('id')} RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: row.rows[0] });
  });

  // ── Employees ──────────────────────────────────────────────────
  app.get('/', async (c) => {
    const { limit = '50', page = '1', department_id, status, q } = c.req.query();
    const lim = Math.min(+limit, 200);
    const offset = (Math.max(1, +page) - 1) * lim;
    const rows = await sql`
      SELECT e.*, d.name as department_name, p.title as position_title,
        m.first_name || ' ' || m.last_name as manager_name
      FROM zvd_employees e
      LEFT JOIN zvd_departments d ON d.id = e.department_id
      LEFT JOIN zvd_job_positions p ON p.id = e.position_id
      LEFT JOIN zvd_employees m ON m.id = e.manager_id
      WHERE (${department_id ? sql`e.department_id = ${department_id}` : sql`TRUE`})
        AND (${status ? sql`e.status = ${status}` : sql`TRUE`})
        AND (${q ? sql`(e.first_name ILIKE ${'%' + q + '%'} OR e.last_name ILIKE ${'%' + q + '%'} OR e.email ILIKE ${'%' + q + '%'} OR e.employee_number ILIKE ${'%' + q + '%'})` : sql`TRUE`})
      ORDER BY e.last_name, e.first_name
      LIMIT ${lim} OFFSET ${offset}
    `.execute(db);
    return c.json({ data: rows.rows });
  });

  app.get('/:id', async (c) => {
    const row = await sql`
      SELECT e.*, d.name as department_name, p.title as position_title,
        m.first_name || ' ' || m.last_name as manager_name,
        COALESCE(json_agg(DISTINCT ec.*::text::jsonb) FILTER (WHERE ec.id IS NOT NULL), '[]') as emergency_contacts,
        COALESCE(json_agg(DISTINCT doc.*::text::jsonb ORDER BY (doc.created_at) DESC) FILTER (WHERE doc.id IS NOT NULL), '[]') as documents,
        COALESCE(json_agg(DISTINCT ben.*::text::jsonb) FILTER (WHERE ben.id IS NOT NULL), '[]') as benefits
      FROM zvd_employees e
      LEFT JOIN zvd_departments d ON d.id = e.department_id
      LEFT JOIN zvd_job_positions p ON p.id = e.position_id
      LEFT JOIN zvd_employees m ON m.id = e.manager_id
      LEFT JOIN zvd_employee_emergency_contacts ec ON ec.employee_id = e.id
      LEFT JOIN zvd_employee_documents doc ON doc.employee_id = e.id
      LEFT JOIN zvd_employee_benefits ben ON ben.employee_id = e.id
      WHERE e.id = ${c.req.param('id')}
      GROUP BY e.id, d.name, p.title, m.first_name, m.last_name
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    const salary = await sql`SELECT * FROM zvd_salary_history WHERE employee_id = ${c.req.param('id')} ORDER BY effective_date DESC LIMIT 1`.execute(db);
    const emp = row.rows[0] as any;
    emp.current_salary = salary.rows[0] ?? null;
    return c.json({ data: emp });
  });

  app.post('/', zValidator('json', z.object({
    first_name: z.string().min(1),
    last_name: z.string().min(1),
    email: z.string().email(),
    work_email: z.string().email().optional(),
    phone: z.string().optional(),
    birth_date: z.string().optional(),
    gender: z.enum(['m','f','other']).optional(),
    national_id: z.string().optional(),
    tax_id: z.string().optional(),
    hire_date: z.string(),
    department_id: z.string().uuid().optional(),
    position_id: z.string().uuid().optional(),
    manager_id: z.string().uuid().optional(),
    employment_type: z.enum(['full_time','part_time','contractor','intern']).default('full_time'),
    probation_end_date: z.string().optional(),
    salary: z.number().positive().optional(),
    salary_type: z.enum(['gross','net']).default('gross'),
    currency: z.string().default('RON'),
    iban: z.string().optional(),
    bank_name: z.string().optional(),
    address: z.string().optional(),
    notes: z.string().optional(),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    // Auto-generate employee number
    const counter = await sql`SELECT COUNT(*) as cnt FROM zvd_employees`.execute(db);
    const empNum = 'EMP-' + String(+(counter.rows[0] as any).cnt + 1).padStart(4, '0');
    const row = await sql`
      INSERT INTO zvd_employees (employee_number, first_name, last_name, email, work_email, phone, birth_date, gender,
        national_id, tax_id, hire_date, department_id, position_id, manager_id, employment_type,
        probation_end_date, salary, currency, iban, bank_name, address, notes, created_by)
      VALUES (${empNum}, ${d.first_name}, ${d.last_name}, ${d.email}, ${d.work_email ?? null},
        ${d.phone ?? null}, ${d.birth_date ?? null}, ${d.gender ?? null},
        ${d.national_id ?? null}, ${d.tax_id ?? null}, ${d.hire_date},
        ${d.department_id ?? null}, ${d.position_id ?? null}, ${d.manager_id ?? null},
        ${d.employment_type}, ${d.probation_end_date ?? null},
        ${d.salary ?? null}, ${d.currency}, ${d.iban ?? null}, ${d.bank_name ?? null},
        ${d.address ?? null}, ${d.notes ?? null}, ${user.id})
      RETURNING *
    `.execute(db);
    const emp = row.rows[0] as any;
    if (d.salary) {
      await sql`
        INSERT INTO zvd_salary_history (employee_id, effective_date, salary, salary_type, currency, reason, changed_by)
        VALUES (${emp.id}, ${d.hire_date}, ${d.salary}, ${d.salary_type}, ${d.currency}, 'Initial salary', ${user.id})
      `.execute(db);
    }
    return c.json({ data: emp }, 201);
  });

  app.patch('/:id', zValidator('json', z.object({
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    email: z.string().email().optional(),
    work_email: z.string().email().optional(),
    phone: z.string().optional(),
    department_id: z.string().uuid().optional(),
    position_id: z.string().uuid().optional(),
    manager_id: z.string().uuid().optional(),
    employment_type: z.enum(['full_time','part_time','contractor','intern']).optional(),
    probation_end_date: z.string().optional(),
    status: z.enum(['active','inactive','on_leave','terminated']).optional(),
    iban: z.string().optional(),
    bank_name: z.string().optional(),
    address: z.string().optional(),
    tax_id: z.string().optional(),
    notes: z.string().optional(),
  })), async (c) => {
    const d = c.req.valid('json');
    const row = await sql`
      UPDATE zvd_employees SET
        first_name = COALESCE(${d.first_name ?? null}, first_name),
        last_name = COALESCE(${d.last_name ?? null}, last_name),
        email = COALESCE(${d.email ?? null}, email),
        work_email = COALESCE(${d.work_email ?? null}, work_email),
        phone = COALESCE(${d.phone ?? null}, phone),
        department_id = COALESCE(${d.department_id ?? null}, department_id),
        position_id = COALESCE(${d.position_id ?? null}, position_id),
        manager_id = COALESCE(${d.manager_id ?? null}, manager_id),
        employment_type = COALESCE(${d.employment_type ?? null}, employment_type),
        probation_end_date = COALESCE(${d.probation_end_date ?? null}, probation_end_date),
        status = COALESCE(${d.status ?? null}, status),
        iban = COALESCE(${d.iban ?? null}, iban),
        bank_name = COALESCE(${d.bank_name ?? null}, bank_name),
        address = COALESCE(${d.address ?? null}, address),
        tax_id = COALESCE(${d.tax_id ?? null}, tax_id),
        notes = COALESCE(${d.notes ?? null}, notes),
        updated_at = NOW()
      WHERE id = ${c.req.param('id')} RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: row.rows[0] });
  });

  app.post('/:id/terminate', zValidator('json', z.object({
    end_date: z.string(),
    reason: z.string().optional(),
  })), async (c) => {
    const d = c.req.valid('json');
    const row = await sql`
      UPDATE zvd_employees SET status = 'terminated', end_date = ${d.end_date}, notes = COALESCE(${d.reason ?? null}, notes), updated_at = NOW()
      WHERE id = ${c.req.param('id')} AND status != 'terminated' RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Employee not found or already terminated' }, 400);
    return c.json({ data: row.rows[0] });
  });

  // ── Org chart ──────────────────────────────────────────────────
  app.get('/org-chart', async (c) => {
    const rows = await sql`
      WITH RECURSIVE org AS (
        SELECT id, first_name, last_name, position_id, department_id, manager_id,
          0 as depth, ARRAY[id] as path
        FROM zvd_employees WHERE manager_id IS NULL AND status = 'active'
        UNION ALL
        SELECT e.id, e.first_name, e.last_name, e.position_id, e.department_id, e.manager_id,
          org.depth + 1, org.path || e.id
        FROM zvd_employees e
        JOIN org ON org.id = e.manager_id
        WHERE e.status = 'active' AND NOT (e.id = ANY(org.path))
      )
      SELECT org.*, p.title as position_title, d.name as department_name
      FROM org
      LEFT JOIN zvd_job_positions p ON p.id = org.position_id
      LEFT JOIN zvd_departments d ON d.id = org.department_id
      ORDER BY depth, last_name
    `.execute(db);
    return c.json({ data: rows.rows });
  });

  // ── Emergency contacts ─────────────────────────────────────────
  app.get('/:id/emergency-contacts', async (c) => {
    const rows = await sql`SELECT * FROM zvd_employee_emergency_contacts WHERE employee_id = ${c.req.param('id')} ORDER BY is_primary DESC, name`.execute(db);
    return c.json({ data: rows.rows });
  });

  app.post('/:id/emergency-contacts', zValidator('json', z.object({
    name: z.string().min(1),
    relationship: z.string().min(1),
    phone: z.string().min(1),
    email: z.string().email().optional(),
    is_primary: z.boolean().default(false),
  })), async (c) => {
    const d = c.req.valid('json');
    if (d.is_primary) {
      await sql`UPDATE zvd_employee_emergency_contacts SET is_primary = false WHERE employee_id = ${c.req.param('id')}`.execute(db);
    }
    const row = await sql`
      INSERT INTO zvd_employee_emergency_contacts (employee_id, name, relationship, phone, email, is_primary)
      VALUES (${c.req.param('id')}, ${d.name}, ${d.relationship}, ${d.phone}, ${d.email ?? null}, ${d.is_primary})
      RETURNING *
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  app.delete('/:id/emergency-contacts/:contactId', async (c) => {
    await sql`DELETE FROM zvd_employee_emergency_contacts WHERE id = ${c.req.param('contactId')} AND employee_id = ${c.req.param('id')}`.execute(db);
    return c.json({ success: true });
  });

  // ── Salary history ─────────────────────────────────────────────
  app.get('/:id/salary-history', async (c) => {
    const rows = await sql`SELECT * FROM zvd_salary_history WHERE employee_id = ${c.req.param('id')} ORDER BY effective_date DESC`.execute(db);
    return c.json({ data: rows.rows });
  });

  app.post('/:id/salary', zValidator('json', z.object({
    effective_date: z.string(),
    salary: z.number().positive(),
    salary_type: z.enum(['gross','net']).default('gross'),
    currency: z.string().default('RON'),
    reason: z.string().optional(),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_salary_history (employee_id, effective_date, salary, salary_type, currency, reason, changed_by)
      VALUES (${c.req.param('id')}, ${d.effective_date}, ${d.salary}, ${d.salary_type}, ${d.currency}, ${d.reason ?? null}, ${user.id})
      RETURNING *
    `.execute(db);
    // Update current salary on employee record
    await sql`UPDATE zvd_employees SET salary = ${d.salary}, currency = ${d.currency}, updated_at = NOW() WHERE id = ${c.req.param('id')}`.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  // ── Documents ──────────────────────────────────────────────────
  app.get('/:id/documents', async (c) => {
    const rows = await sql`SELECT * FROM zvd_employee_documents WHERE employee_id = ${c.req.param('id')} ORDER BY created_at DESC`.execute(db);
    return c.json({ data: rows.rows });
  });

  app.post('/:id/documents', zValidator('json', z.object({
    type: z.enum(['contract','id_card','diploma','certificate','other']).default('other'),
    name: z.string().min(1),
    file_url: z.string().min(1),
    expires_at: z.string().optional(),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_employee_documents (employee_id, type, name, file_url, expires_at, created_by)
      VALUES (${c.req.param('id')}, ${d.type}, ${d.name}, ${d.file_url}, ${d.expires_at ?? null}, ${user.id})
      RETURNING *
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  app.delete('/:id/documents/:docId', async (c) => {
    await sql`DELETE FROM zvd_employee_documents WHERE id = ${c.req.param('docId')} AND employee_id = ${c.req.param('id')}`.execute(db);
    return c.json({ success: true });
  });

  // ── Benefits ───────────────────────────────────────────────────
  app.get('/:id/benefits', async (c) => {
    const rows = await sql`SELECT * FROM zvd_employee_benefits WHERE employee_id = ${c.req.param('id')} ORDER BY start_date DESC`.execute(db);
    return c.json({ data: rows.rows });
  });

  app.post('/:id/benefits', zValidator('json', z.object({
    type: z.string().min(1),
    description: z.string().optional(),
    value: z.number().optional(),
    start_date: z.string(),
    end_date: z.string().optional(),
  })), async (c) => {
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_employee_benefits (employee_id, type, description, value, start_date, end_date)
      VALUES (${c.req.param('id')}, ${d.type}, ${d.description ?? null}, ${d.value ?? null}, ${d.start_date}, ${d.end_date ?? null})
      RETURNING *
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  // ── Onboarding ────────────────────────────────────────────────
  app.get('/:id/onboarding', async (c) => {
    const rows = await sql`SELECT * FROM zvd_onboarding_tasks WHERE employee_id = ${c.req.param('id')} ORDER BY created_at`.execute(db);
    return c.json({ data: rows.rows });
  });

  app.post('/:id/onboarding', zValidator('json', z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    assigned_to: z.string().optional(),
    due_date: z.string().optional(),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_onboarding_tasks (employee_id, title, description, assigned_to, due_date, created_by)
      VALUES (${c.req.param('id')}, ${d.title}, ${d.description ?? null}, ${d.assigned_to ?? null}, ${d.due_date ?? null}, ${user.id})
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
        completed_at = CASE WHEN ${d.is_completed ?? null} = true THEN NOW() ELSE completed_at END
      WHERE id = ${c.req.param('taskId')} RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: row.rows[0] });
  });

  // ── Performance Cycles ─────────────────────────────────────────
  app.get('/performance/cycles', async (c) => {
    const rows = await sql`
      SELECT c.*, COUNT(r.id) as review_count,
        COUNT(r.id) FILTER (WHERE r.status = 'submitted') as submitted_count
      FROM zvd_performance_cycles c
      LEFT JOIN zvd_performance_reviews r ON r.cycle_id = c.id
      GROUP BY c.id ORDER BY c.start_date DESC
    `.execute(db);
    return c.json({ data: rows.rows });
  });

  app.post('/performance/cycles', zValidator('json', z.object({
    name: z.string().min(1),
    start_date: z.string(),
    end_date: z.string(),
  })), async (c) => {
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_performance_cycles (name, start_date, end_date)
      VALUES (${d.name}, ${d.start_date}, ${d.end_date}) RETURNING *
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  app.post('/performance/cycles/:id/close', async (c) => {
    const row = await sql`UPDATE zvd_performance_cycles SET status = 'closed' WHERE id = ${c.req.param('id')} RETURNING *`.execute(db);
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: row.rows[0] });
  });

  app.get('/performance/cycles/:cycleId/reviews', async (c) => {
    const rows = await sql`
      SELECT r.*, e.first_name || ' ' || e.last_name as employee_name, e.employee_number,
        d.name as department_name
      FROM zvd_performance_reviews r
      JOIN zvd_employees e ON e.id = r.employee_id
      LEFT JOIN zvd_departments d ON d.id = e.department_id
      WHERE r.cycle_id = ${c.req.param('cycleId')} ORDER BY e.last_name
    `.execute(db);
    return c.json({ data: rows.rows });
  });

  app.post('/performance/cycles/:cycleId/reviews', zValidator('json', z.object({
    employee_id: z.string().uuid(),
    reviewer_id: z.string().uuid().optional(),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_performance_reviews (cycle_id, employee_id, reviewer_id)
      VALUES (${c.req.param('cycleId')}, ${d.employee_id}, ${d.reviewer_id ?? user.id})
      ON CONFLICT (cycle_id, employee_id) DO NOTHING RETURNING *
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  app.patch('/performance/reviews/:id', zValidator('json', z.object({
    overall_rating: z.number().min(1).max(5).optional(),
    goals_rating: z.number().min(1).max(5).optional(),
    competency_rating: z.number().min(1).max(5).optional(),
    strengths: z.string().optional(),
    improvements: z.string().optional(),
    comments: z.string().optional(),
    status: z.enum(['submitted','acknowledged']).optional(),
  })), async (c) => {
    const d = c.req.valid('json');
    const row = await sql`
      UPDATE zvd_performance_reviews SET
        overall_rating = COALESCE(${d.overall_rating ?? null}, overall_rating),
        goals_rating = COALESCE(${d.goals_rating ?? null}, goals_rating),
        competency_rating = COALESCE(${d.competency_rating ?? null}, competency_rating),
        strengths = COALESCE(${d.strengths ?? null}, strengths),
        improvements = COALESCE(${d.improvements ?? null}, improvements),
        comments = COALESCE(${d.comments ?? null}, comments),
        status = COALESCE(${d.status ?? null}, status),
        submitted_at = CASE WHEN ${d.status ?? null} = 'submitted' AND submitted_at IS NULL THEN NOW() ELSE submitted_at END,
        acknowledged_at = CASE WHEN ${d.status ?? null} = 'acknowledged' AND acknowledged_at IS NULL THEN NOW() ELSE acknowledged_at END
      WHERE id = ${c.req.param('id')} RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: row.rows[0] });
  });

  // ── Stats ──────────────────────────────────────────────────────
  app.get('/stats', async (c) => {
    const row = await sql`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'active') as active,
        COUNT(*) FILTER (WHERE status = 'terminated') as terminated,
        COUNT(*) FILTER (WHERE status = 'on_leave') as on_leave,
        COUNT(*) FILTER (WHERE employment_type = 'full_time') as full_time,
        COUNT(*) FILTER (WHERE employment_type = 'part_time') as part_time,
        COUNT(*) FILTER (WHERE employment_type = 'contractor') as contractors,
        COUNT(*) FILTER (WHERE probation_end_date >= CURRENT_DATE AND status = 'active') as on_probation,
        COUNT(*) FILTER (WHERE hire_date >= CURRENT_DATE - INTERVAL '90 days') as new_hires_90d,
        COUNT(*) FILTER (WHERE expires_at_docs <= CURRENT_DATE + 30) as docs_expiring_soon
      FROM zvd_employees e
      LEFT JOIN LATERAL (
        SELECT MIN(d.expires_at) as expires_at_docs
        FROM zvd_employee_documents d WHERE d.employee_id = e.id AND d.expires_at IS NOT NULL
      ) docs ON true
    `.execute(db);
    const byDept = await sql`
      SELECT d.name as department, COUNT(e.id) as count
      FROM zvd_departments d LEFT JOIN zvd_employees e ON e.department_id = d.id AND e.status = 'active'
      GROUP BY d.id, d.name ORDER BY count DESC
    `.execute(db);
    return c.json({ data: { ...(row.rows[0] as any), by_department: byDept.rows } });
  });

  return app;
}
