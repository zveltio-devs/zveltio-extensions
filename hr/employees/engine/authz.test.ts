// Bespoke: exercises the `employees` permission gate in both directions, on
// both route sets mounted under this extension's subapp (employeesRoutes AND
// contractRoutes — the latter has no auth middleware of its own and relies
// entirely on the parent app.use('*', ...) in index.ts).
import { describe, expect, it } from 'bun:test';
import { mountForTest } from '../../../testing/ext-harness';

const ENGINE_DIR = import.meta.dir;

describe('hr/employees — permission gate is exercised, not just present', () => {
  it('unauthenticated: 401 on both route sets', async () => {
    const { app } = await mountForTest(ENGINE_DIR, { authed: false, admin: false });
    const employees = await app.request('/');
    expect(employees.status).toBe(401);
    const contracts = await app.request('/employees/00000000-0000-0000-0000-000000000001/contracts');
    expect(contracts.status).toBe(401);
  });

  it('authenticated, no grant on `employees`: 403 on both route sets', async () => {
    const { app, ctx } = await mountForTest(ENGINE_DIR, { authed: true, admin: true });
    // The harness's checkPermission mock is a boolean switch, not resource-aware
    // (`async () => opts.admin`). Overriding it here simulates a real signed-in
    // user who holds no Casbin grant on `employees` — the actual refusal path
    // `permissionGate` exists to produce. `ctx` is the same object reference the
    // routes closed over, so this takes effect on the next request.
    ctx.checkPermission = async () => false;
    const employees = await app.request('/');
    expect(employees.status).toBe(403);
    const body = await employees.json();
    expect(body.code).toBe('permission_required');
    const contracts = await app.request('/employees/00000000-0000-0000-0000-000000000001/contracts');
    expect(contracts.status).toBe(403);
  });

  it('positive control: authenticated with a grant reaches the handler', async () => {
    const { app, ctx } = await mountForTest(ENGINE_DIR, { authed: true, admin: true });
    ctx.checkPermission = async () => true;
    const employees = await app.request('/');
    expect(employees.status).toBe(200);
    const contracts = await app.request('/employees/00000000-0000-0000-0000-000000000001/contracts');
    expect(contracts.status).toBe(200);
  });
});
