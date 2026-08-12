import { sql } from 'kysely';
import type { ExtensionContext } from '@zveltio/sdk/extension';

/**
 * What other HR modules need to know about somebody's employment, without
 * reading this extension's tables.
 *
 * `hr/payroll` used to run `SELECT * FROM zvd_employees` itself — four times —
 * and take `salary` off the row. That is another extension's table, and it is
 * also the reason payroll could not see a contract: it was reading the
 * projection rather than the thing being projected.
 *
 * Registered on `ctx.services` as `hr.employment`. The same mechanism that
 * carries `identity.nationalId`, used the same way: the module that owns the
 * data answers questions about it, and nobody else opens the table.
 *
 * Deliberately narrow. This is not "employees, exposed" — it is the two
 * questions payroll actually asks: who do I pay this period, and on what terms.
 */
export interface EmploymentTerms {
  employee_id: string;
  employee_name: string;
  /** Null when the person has no contract yet — the caller must not guess. */
  contract_id: string | null;
  salary: number | null;
  currency: string;
  /** `hour` | `day` | `month` | `year`. The caller decides what it can compute. */
  salary_period: string;
  weekly_hours: number;
  /** Identity and banking, for payslips and statutory filings. */
  national_id: string | null;
  iban: string | null;
  hire_date: string | null;
  end_date: string | null;
}

export function buildEmploymentService(ctx: ExtensionContext) {
  const { db } = ctx;

  return {
    /**
     * Everybody who should appear on a payroll run.
     *
     * A suspended contract is excluded: somebody on parental leave is still
     * employed but is not paid a salary by the employer, and putting them on the
     * run at full salary is how a suspension becomes invisible.
     *
     * `COALESCE(c.*, e.*)` throughout, so an instance that has not created
     * contracts yet is still paid from the flat fields. The contract wins when
     * there is one.
     */
    async payrollSubjects(): Promise<EmploymentTerms[]> {
      const rows = await sql<EmploymentTerms>`
        SELECT
          e.id AS employee_id,
          e.first_name || ' ' || e.last_name AS employee_name,
          c.id AS contract_id,
          COALESCE(c.salary, e.salary) AS salary,
          COALESCE(c.currency, e.currency, 'RON') AS currency,
          COALESCE(c.salary_period, 'month') AS salary_period,
          COALESCE(c.weekly_hours, 40) AS weekly_hours,
          e.national_id, e.iban,
          COALESCE(c.start_date, e.hire_date) AS hire_date,
          COALESCE(c.end_date, e.end_date) AS end_date
        FROM zvd_employees e
        LEFT JOIN zvd_employment_contracts c
          ON c.employee_id = e.id AND c.status = 'active'
        WHERE e.status = 'active'
          AND e.employment_type <> 'contractor'
          AND NOT EXISTS (
            SELECT 1 FROM zvd_employment_contracts s
             WHERE s.employee_id = e.id AND s.status = 'suspended'
          )
        ORDER BY e.last_name, e.first_name
      `.execute(db);
      return rows.rows;
    },

    /**
     * The employee behind a signed-in user, with their manager.
     *
     * `hr/leave` and `hr/time-tracking` each grew their own copy of this — the
     * same twenty lines, both opening `zvd_employees` directly. Two copies is a
     * duplication; a third would be a pattern, and the rule for that was
     * already written down. This is the third caller, so it lives here now.
     *
     * `user_id` first, because that is the link the schema declares. Email is
     * the fallback both copies used on their own, and it is the weaker one:
     * somebody whose work address differs from their login could not file leave
     * or start a timer at all.
     */
    async identify(user: {
      id: string;
      email?: string;
    }): Promise<{ id: string; manager_id: string | null } | null> {
      const rows = await sql<{ id: string; manager_id: string | null }>`
        SELECT id, manager_id FROM zvd_employees
         WHERE user_id = ${user.id} OR email = ${user.email ?? ''} OR work_email = ${user.email ?? ''}
         LIMIT 1
      `.execute(db);
      return rows.rows[0] ?? null;
    },

    /**
     * May this user act on behalf of `employeeId`?
     *
     * Three ways in, and the order is the point: it is you, you manage the
     * person, or you administer the instance.
     *
     * Callers that must EXCLUDE the own-record case — approving your own leave,
     * approving your own timesheet — call `identify()` and refuse before asking
     * this. That is left to the caller deliberately: submitting your own
     * timesheet and approving it are different acts, and one helper deciding
     * for both would get one of them wrong.
     */
    async mayActFor(user: { id: string; email?: string }, employeeId: string): Promise<boolean> {
      const me = await this.identify(user);
      if (me && me.id === employeeId) return true;

      const target = await sql<{ manager_id: string | null }>`
        SELECT manager_id FROM zvd_employees WHERE id = ${employeeId}
      `.execute(db);
      const managerId = target.rows[0]?.manager_id;
      if (me && managerId && managerId === me.id) return true;

      return ctx.checkPermission(user.id, 'admin', '*').catch(() => false);
    },


    /**
     * One person's current terms, or null if there is no such employee.
     *
     * Written out rather than sharing a SELECT string with the query above:
     * a shared string would have to be interpolated to take the id, and an
     * interpolated identifier is how SQL injection gets in. The duplication is
     * the cheaper mistake.
     */
    async currentTerms(employeeId: string): Promise<EmploymentTerms | null> {
      const rows = await sql<EmploymentTerms>`
        SELECT
          e.id AS employee_id,
          e.first_name || ' ' || e.last_name AS employee_name,
          c.id AS contract_id,
          COALESCE(c.salary, e.salary) AS salary,
          COALESCE(c.currency, e.currency, 'RON') AS currency,
          COALESCE(c.salary_period, 'month') AS salary_period,
          COALESCE(c.weekly_hours, 40) AS weekly_hours,
          e.national_id, e.iban,
          COALESCE(c.start_date, e.hire_date) AS hire_date,
          COALESCE(c.end_date, e.end_date) AS end_date
        FROM zvd_employees e
        LEFT JOIN zvd_employment_contracts c
          ON c.employee_id = e.id AND c.status = 'active'
        WHERE e.id = ${employeeId}
      `.execute(db);
      return (rows.rows[0] as EmploymentTerms) ?? null;
    },
  };
}

export type EmploymentService = ReturnType<typeof buildEmploymentService>;
