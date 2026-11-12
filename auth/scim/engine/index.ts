import type { ZveltioExtension } from '@zveltio/sdk/extension';
import {
  createUser,
  deleteUser,
  getUser,
  listGroups,
  listUsers,
  patchUser,
  replaceUser,
  serviceProviderConfig,
} from './routes.js';

/**
 * auth/scim — SCIM 2.0 provisioning for Azure AD / Entra, Okta and friends.
 * Every route is declared in the manifest (ADR 0039) and served under
 * /ext/auth/scim/v2 as a `caller` route: the identity provider authenticates
 * with an engine API key holding `$ext:auth/scim` (ADR 0045). The directory
 * itself is the engine's, through `host.identity` (ADR 0039 decision 9).
 */
const extension: ZveltioExtension = {
  name: 'auth/scim',
  category: 'auth',
  mountStrategy: 'subapp',
  routes: {
    serviceProviderConfig,
    listUsers,
    getUser,
    createUser,
    replaceUser,
    patchUser,
    deleteUser,
    listGroups,
  },

  async register() {},
};

export default extension;
