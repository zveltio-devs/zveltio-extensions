import "svelte/internal/disclose-version";
import * as t from "svelte/internal/client";
var a = t.from_html('<iframe class="w-full rounded border border-base-300" style="height: 65vh; min-height: 400px;"></iframe>');
function s(i, e) {
  t.push(e, !0);
  var r = a();
  t.template_effect(() => {
    t.set_attribute(r, "src", e.asset.url), t.set_attribute(r, "title", e.asset.name ?? "PDF Document");
  }), t.append(i, r), t.pop();
}
function n() {
  const i = window.__zveltio;
  i && i.registerAssetPreview({
    match: (e) => {
      var r, o;
      return e.mimeType === "application/pdf" || ((r = e.name) == null ? void 0 : r.toLowerCase().endsWith(".pdf")) || ((o = e.url) == null ? void 0 : o.toLowerCase().endsWith(".pdf"));
    },
    component: s
  });
}
n();
export {
  n as default
};
