/**
 * Ambient declaration for `*.sql` imports.
 *
 * The engine's `db/migrations/embedded.ts` uses Bun's static
 * `import sql from './sql/001_auth.sql' with { type: 'text' }`
 * syntax so the migration text is embedded at bundle time. TypeScript
 * doesn't know that loader by default, so without this stub every
 * .sql import would raise TS2307 when the engine source is included
 * in the extensions' typecheck via the `@zveltio/engine/*` path alias.
 *
 * Same shape the engine declares for itself in
 * `packages/engine/src/types/sql.d.ts`.
 */

declare module '*.sql' {
  const content: string;
  export default content;
}
