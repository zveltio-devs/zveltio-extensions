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
/**
 * Same namespace-vs-class trap as graphql for `S3Client` — promote it
 * to an `any`-typed class so storage/cloud code can both call `new
 * S3Client(...)` and annotate variables as `S3Client`.
 */
declare module '@aws-sdk/client-s3' {
  export class S3Client { constructor(config?: any); [k: string]: any; }
  export class PutObjectCommand { constructor(input?: any); }
  export class GetObjectCommand { constructor(input?: any); }
  export class DeleteObjectCommand { constructor(input?: any); }
  export class CopyObjectCommand { constructor(input?: any); }
  export class HeadObjectCommand { constructor(input?: any); }
  export class ListObjectsV2Command { constructor(input?: any); }
  const _default: any;
  export default _default;
}
declare module '@aws-sdk/s3-request-presigner' {
  export const getSignedUrl: (...args: any[]) => Promise<string>;
}
declare module 'nanoid';
declare module 'pdf-parse';
declare module 'pdfkit';
declare module 'qrcode';

/**
 * graphql exposes its public surface as both runtime values AND types
 * (e.g. `GraphQLSchema` is a class — usable as a value or a type).
 * The bare `declare module 'graphql';` form types every export as a
 * namespace, which trips TS2709 the moment extension code uses
 * `let s: GraphQLSchema`. Declare the surface we touch as `any`-typed
 * classes so both call sites and annotations work.
 */
declare module 'graphql' {
  export class GraphQLSchema { constructor(config?: any); [k: string]: any; }
  export class GraphQLObjectType { constructor(config?: any); [k: string]: any; }
  export class GraphQLInputObjectType { constructor(config?: any); [k: string]: any; }
  export class GraphQLString {}
  export class GraphQLInt {}
  export class GraphQLFloat {}
  export class GraphQLBoolean {}
  export class GraphQLID {}
  export class GraphQLList { constructor(of: any); }
  export class GraphQLNonNull { constructor(of: any); }
  export class GraphQLEnumType { constructor(config?: any); }
  export const printSchema: (schema: any) => string;
  export const parse: (source: string) => any;
  export const validate: (...args: any[]) => any[];
  export const graphql: (...args: any[]) => Promise<any>;
  export const buildSchema: (source: string) => any;
  const _default: any;
  export default _default;
}

/**
 * `better-auth` is part of the engine bundle, not an extension peer
 * dep — but extensions that bridge SSO (SAML, LDAP, OIDC) reach into
 * it for type names. Same shape as graphql so namespace uses don't
 * trip TS2709.
 */
declare module 'better-auth' {
  const x: any;
  export = x;
}
