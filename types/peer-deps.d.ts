/**
 * Ambient declarations for extension peer dependencies.
 *
 * Each extension declares its third-party runtime needs in its own
 * `manifest.json` `peerDependencies` block (see dependabot.yml in this
 * repo). The Zveltio engine's extension loader installs those at
 * activation time, so they're not in this monorepo's root
 * `node_modules` — which makes `tsc` raise TS2307 ("Cannot find
 * module") when type-checking the extension source statically.
 *
 * The runtime resolution is correct; the typecheck just needs a stub
 * so it doesn't choke on the import. Each entry below is `any`-typed
 * on purpose: the goal is to unblock the build, not to provide deep
 * types for libraries we don't ship. Extension authors who want
 * proper types can `bun add -d <pkg>` in their feature branch — the
 * real types take precedence over the stub.
 *
 * If you add a new peer dependency to a manifest, add a matching
 * declare-module line here so CI stays green.
 */

declare module 'imapflow';
declare module 'nanoid';
declare module 'pdf-parse';
declare module 'pdfkit';
declare module 'qrcode';
