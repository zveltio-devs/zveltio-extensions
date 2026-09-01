/**
 * Minimal Bun globals shim.
 *
 * `bun-types` lives at `node_modules/bun-types/` (not under `@types/`),
 * and this repo's `typeRoots` is locked to the engine's `@types`
 * folder so the studio + engine + extensions all share one TS view.
 * Pulling `bun-types` in via `"types": ["bun-types"]` requires adding
 * `./node_modules` as a typeRoot, which then exposes hundreds of
 * unrelated package types and cascades into 300+ false-positive
 * errors. Cheaper to declare the handful of globals we actually
 * touch as `any` and stay out of the `typeRoots` trap.
 *
 * Real types live in `bun-types/index.d.ts`; runtime is unchanged.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

declare const Bun: any;

declare module 'bun' {
  export function spawn(...args: any[]): any;
  export function spawnSync(...args: any[]): any;
  export function write(...args: any[]): Promise<number>;
  export function file(...args: any[]): any;
  export function serve(...args: any[]): any;
  export function password(...args: any[]): any;
  // `SQL` is imported by the ENGINE's `db/pool-autosize.ts`, which this repo
  // typechecks through the `../zveltio` path alias. Missing from the shim, it
  // failed the whole extensions typecheck with a single TS2614 — on a file
  // nobody here edits, for a reason nobody here would look for.
  //
  // That is the cost of a hand-written shim: it has to grow when the engine
  // starts using another Bun API. The alternative is documented above and is
  // worse (300+ false positives from unrelated package types).
  // Callable AND newable: the engine does `new SQL(url)` and then calls the
  // instance as a tagged template — `sql\`SELECT …\``.
  export const SQL: {
    new (...args: any[]): any;
    (...args: any[]): any;
  };
  const _default: any;
  export default _default;
}
