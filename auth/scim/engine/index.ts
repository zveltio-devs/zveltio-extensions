import type { ZveltioExtension } from '@zveltio/sdk/extension';
import {
  createUser,
  deleteUser,
  getUser,
  keepContext,
  listGroups,
  listUsers,
  mintToken,
  patchUser,
  replaceUser,
  serviceProviderConfig,
} from './routes.js';

/**
 * auth/scim — SCIM 2.0 provisioning for Azure AD / Entra, Okta and friends.
 * Every route is declared in the manifest (ADR 0039) and served under
 * /ext/auth/scim: the SCIM protocol at /ext/auth/scim/v2 (public, bearer-auth'd),
 * minting a token at /ext/auth/scim/tokens. The directory itself is the
 * engine's, through `host.identity` (ADR 0039 decision 9).
 */
const extension: ZveltioExtension = {
  name: 'auth/scim',
  category: 'auth',
  mountStrategy: 'subapp',
  routes: {
    mintToken,
    serviceProviderConfig,
    listUsers,
    getUser,
    createUser,
    replaceUser,
    patchUser,
    deleteUser,
    listGroups,
  },

  async register(_app, ctx) {
    keepContext(ctx);
  },
};

export default extension;
