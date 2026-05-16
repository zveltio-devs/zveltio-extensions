import "svelte/internal/disclose-version";
import * as i from "svelte/internal/client";
function r() {
  if (typeof window > "u")
    return null;
  const e = window.__zveltio;
  return e || (console.warn("[zveltio/sdk/studio] window.__zveltio is not installed. Is the bundle running inside Studio?"), null);
}
function o(e) {
  var t;
  (t = r()) == null || t.registerAssetPreview(e);
}
var s = i.from_html('<iframe class="w-full rounded border border-base-300" style="height: 65vh; min-height: 400px;"></iframe>');
function u(e, t) {
  i.push(t, !0);
  var n = s();
  i.template_effect(() => {
    i.set_attribute(n, "src", t.asset.url), i.set_attribute(n, "title", t.asset.name ?? "PDF Document");
  }), i.append(e, n), i.pop();
}
function a() {
  o({
    match: (e) => {
      var t, n;
      return e.mimeType === "application/pdf" || ((t = e.name) == null ? void 0 : t.toLowerCase().endsWith(".pdf")) || ((n = e.url) == null ? void 0 : n.toLowerCase().endsWith(".pdf"));
    },
    component: u
  });
}
a();
export {
  a as default
};
