import type { ZveltioExtension } from '../../../packages/engine/src/lib/extension-loader.js';
import { projectsRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'projects',
  category: 'projects',
  async register(app, ctx) {
    app.route('/api/projects', projectsRoutes(ctx.db, ctx.auth));
  },
};

export default extension;
