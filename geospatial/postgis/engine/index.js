// @bun
// engine/index.ts
var extension = {
  name: "geospatial/postgis",
  category: "geospatial",
  mountStrategy: "subapp",
  async register() {}
};
var engine_default = extension;
export {
  engine_default as default
};
