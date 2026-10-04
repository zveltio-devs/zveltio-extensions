/**
 * Adopt CRM tables into Studio metadata after migrations create them.
 *
 * Tables come from CRM SQL migrations. The engine must not CREATE or adopt
 * them — that was the BaaS purity leak. We register empty field lists then
 * `syncFieldsFromDB` so Studio matches the live CRM schema (status, deal
 * columns, etc.) rather than a stale core ideal shape.
 */
import type { ExtensionContext } from '@zveltio/sdk/extension';

const CRM_COLLECTIONS = [
  { name: 'contacts', displayName: 'Contacts', icon: 'Users', singularName: 'Contact' },
  {
    name: 'organizations',
    displayName: 'Organizations',
    icon: 'Building2',
    singularName: 'Organization',
  },
  {
    name: 'transactions',
    displayName: 'Transactions',
    icon: 'Receipt',
    singularName: 'Transaction',
  },
] as const;

type Ddl = ExtensionContext['DDLManager'] & {
  registerMetadata: (db: ExtensionContext['db'], def: Record<string, unknown>) => Promise<void>;
  getCollection: (db: ExtensionContext['db'], name: string) => Promise<{ name: string } | null>;
  syncFieldsFromDB: (db: ExtensionContext['db'], name: string) => Promise<number>;
};

export async function adoptCrmCollections(ctx: ExtensionContext): Promise<void> {
  const ddl = ctx.DDLManager as Ddl;
  for (const def of CRM_COLLECTIONS) {
    try {
      if (!(await ddl.tableExists(ctx.db, def.name))) continue;
      const existing = await ddl.getCollection(ctx.db, def.name);
      if (existing) continue;
      await ddl.registerMetadata(ctx.db, {
        name: def.name,
        displayName: def.displayName,
        icon: def.icon,
        singularName: def.singularName,
        fields: [],
        isManaged: true,
        isSystem: false,
        schemaLocked: false,
      });
      await ddl.syncFieldsFromDB(ctx.db, def.name);
      console.log(`   📇 CRM adopted collection '${def.name}'`);
    } catch (err) {
      console.warn(`   ⚠  CRM adopt '${def.name}' failed:`, (err as Error).message);
    }
  }

  // The contact ↔ organization relation is registered by migration 005, which
  // runs as the engine. This used to insert it again here, through `ctx.db`,
  // which engine #858 refuses to an extension: a refused write and a warning at
  // every boot, for a row the migration had already written.
}
