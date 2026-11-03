import type { ZveltioExtension } from '@zveltio/sdk/extension';

// Location history is the collection this extension declares in
// `schema/collections/` (manifest `collections`); the engine creates it, owns
// its rules and serves it through the data API. Proximity and bounding-box
// questions are data API filters on any `location` field
// (`location[near]=lat,lng,radius`, `location[within]=minLat,minLng,maxLat,maxLng`,
// ADR 0019), so no route of its own is left.
const extension: ZveltioExtension = {
  name: 'geospatial/postgis',
  category: 'geospatial',
  mountStrategy: 'subapp',

  async register() {},
};

export default extension;
