/**
 * Ambient declaration for `*.svelte` files imported from `.ts`.
 *
 * Studio extensions ship Svelte 5 components alongside an `index.ts`
 * that re-exports them. Without this, `tsc` raises TS2307 on
 * `import Foo from './Foo.svelte'` even though the file is right
 * there on disk — `tsc` doesn't know how to type a Svelte module.
 * The svelte-check / language-server toolchain provides real types
 * at editor time; this declaration just unblocks the bare `tsc`
 * pass that CI runs.
 */

declare module '*.svelte' {
  // The exact runtime is a Svelte component constructor; we type it
  // loosely (`any`) here because extensions use it as a value and the
  // strict type lives in `svelte` itself, which the bundler resolves.
  const Component: any;
  export default Component;
}
