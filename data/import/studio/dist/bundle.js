import "svelte/internal/disclose-version";
import * as e from "svelte/internal/client";
import { onMount as Te } from "svelte";
/**
 * @license @lucide/svelte v0.511.0 - ISC
 *
 * ISC License
 * 
 * Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.
 * 
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 * 
 */
const ze = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  "stroke-width": 2,
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
};
var De = e.from_svg("<svg><!><!></svg>");
function G(v, s) {
  e.push(s, !0);
  const h = e.prop(s, "color", 3, "currentColor"), c = e.prop(s, "size", 3, 24), _ = e.prop(s, "strokeWidth", 3, 2), m = e.prop(s, "absoluteStrokeWidth", 3, !1), o = e.prop(s, "iconNode", 19, () => []), p = e.rest_props(s, [
    "$$slots",
    "$$events",
    "$$legacy",
    "name",
    "color",
    "size",
    "strokeWidth",
    "absoluteStrokeWidth",
    "iconNode",
    "children"
  ]);
  var x = De();
  e.attribute_effect(
    x,
    (j) => ({
      ...ze,
      ...p,
      width: c(),
      height: c(),
      stroke: h(),
      "stroke-width": j,
      class: [
        "lucide-icon lucide",
        s.name && `lucide-${s.name}`,
        s.class
      ]
    }),
    [
      () => m() ? Number(_()) * 24 / Number(c()) : _()
    ]
  );
  var g = e.child(x);
  e.each(g, 17, o, e.index, (j, M) => {
    var O = e.derived(() => e.to_array(e.get(M), 2));
    let W = () => e.get(O)[0], K = () => e.get(O)[1];
    var J = e.comment(), E = e.first_child(J);
    e.element(E, W, !0, (z, H) => {
      e.attribute_effect(z, () => ({ ...K() }));
    }), e.append(j, J);
  });
  var a = e.sibling(g);
  e.snippet(a, () => s.children ?? e.noop), e.reset(x), e.append(v, x), e.pop();
}
function Ie(v, s) {
  e.push(s, !0);
  /**
   * @license @lucide/svelte v0.511.0 - ISC
   *
   * ISC License
   *
   * Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.
   *
   * Permission to use, copy, modify, and/or distribute this software for any
   * purpose with or without fee is hereby granted, provided that the above
   * copyright notice and this permission notice appear in all copies.
   *
   * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
   * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
   * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
   * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
   * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
   * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
   * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
   *
   */
  let h = e.rest_props(s, ["$$slots", "$$events", "$$legacy"]);
  const c = [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["line", { x1: "12", x2: "12", y1: "8", y2: "12" }],
    [
      "line",
      { x1: "12", x2: "12.01", y1: "16", y2: "16" }
    ]
  ];
  G(v, e.spread_props({ name: "circle-alert" }, () => h, {
    get iconNode() {
      return c;
    },
    children: (_, m) => {
      var o = e.comment(), p = e.first_child(o);
      e.snippet(p, () => s.children ?? e.noop), e.append(_, o);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function Pe(v, s) {
  e.push(s, !0);
  /**
   * @license @lucide/svelte v0.511.0 - ISC
   *
   * ISC License
   *
   * Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.
   *
   * Permission to use, copy, modify, and/or distribute this software for any
   * purpose with or without fee is hereby granted, provided that the above
   * copyright notice and this permission notice appear in all copies.
   *
   * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
   * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
   * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
   * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
   * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
   * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
   * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
   *
   */
  let h = e.rest_props(s, ["$$slots", "$$events", "$$legacy"]);
  const c = [
    ["path", { d: "M21.801 10A10 10 0 1 1 17 3.335" }],
    ["path", { d: "m9 11 3 3L22 4" }]
  ];
  G(v, e.spread_props({ name: "circle-check-big" }, () => h, {
    get iconNode() {
      return c;
    },
    children: (_, m) => {
      var o = e.comment(), p = e.first_child(o);
      e.snippet(p, () => s.children ?? e.noop), e.append(_, o);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function q(v, s) {
  e.push(s, !0);
  /**
   * @license @lucide/svelte v0.511.0 - ISC
   *
   * ISC License
   *
   * Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.
   *
   * Permission to use, copy, modify, and/or distribute this software for any
   * purpose with or without fee is hereby granted, provided that the above
   * copyright notice and this permission notice appear in all copies.
   *
   * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
   * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
   * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
   * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
   * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
   * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
   * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
   *
   */
  let h = e.rest_props(s, ["$$slots", "$$events", "$$legacy"]);
  const c = [
    ["path", { d: "M12 3v12" }],
    ["path", { d: "m17 8-5-5-5 5" }],
    ["path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }]
  ];
  G(v, e.spread_props({ name: "upload" }, () => h, {
    get iconNode() {
      return c;
    },
    children: (_, m) => {
      var o = e.comment(), p = e.first_child(o);
      e.snippet(p, () => s.children ?? e.noop), e.append(_, o);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function Ue(v, s) {
  e.push(s, !0);
  /**
   * @license @lucide/svelte v0.511.0 - ISC
   *
   * ISC License
   *
   * Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.
   *
   * Permission to use, copy, modify, and/or distribute this software for any
   * purpose with or without fee is hereby granted, provided that the above
   * copyright notice and this permission notice appear in all copies.
   *
   * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
   * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
   * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
   * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
   * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
   * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
   * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
   *
   */
  let h = e.rest_props(s, ["$$slots", "$$events", "$$legacy"]);
  const c = [
    ["path", { d: "M18 6 6 18" }],
    ["path", { d: "m6 6 12 12" }]
  ];
  G(v, e.spread_props({ name: "x" }, () => h, {
    get iconNode() {
      return c;
    },
    children: (_, m) => {
      var o = e.comment(), p = e.first_child(o);
      e.snippet(p, () => s.children ?? e.noop), e.append(_, o);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
var Be = e.from_html('<div class="alert alert-error"><!> </div>'), Fe = e.from_html('<tr><td colspan="6" class="text-center py-6 text-base-content/60">No imports yet.</td></tr>'), Me = e.from_html('<tr><td> </td><td> </td><td><span class="badge badge-ghost badge-sm"> </span></td><td> </td><td> </td><td><span> </span></td></tr>'), Oe = e.from_html("<option> </option>"), We = e.from_html('<div class="font-medium"> </div> <div class="text-xs text-base-content/60"> </div>', 1), Je = e.from_html('<!> <div class="text-sm text-base-content/60">Drag a CSV / JSON / NDJSON file, or click to browse</div>', 1), Ee = e.from_html('<div class="text-xs"> </div>'), He = e.from_html('<div class="alert alert-success mt-3 text-sm"><!> <div><div class="font-medium"> </div> <!></div></div>'), Re = e.from_html('<div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><div class="bg-base-100 rounded-xl p-6 w-full max-w-lg"><div class="flex items-center justify-between mb-4"><h2 class="text-xl font-semibold">Import data</h2><button class="btn btn-ghost btn-sm btn-square"><!></button></div> <div class="space-y-3"><div><label class="label label-text">Target collection</label> <select class="select select-bordered w-full"><option>— Select —</option><!></select></div> <div><input id="import-file" type="file" class="hidden" accept=".csv,.json,.ndjson,.jsonl"/> <label for="import-file" class="cursor-pointer block"><!></label></div> <div><label class="label label-text">Format</label> <select class="select select-bordered w-full"><option>CSV</option><option>JSON</option><option>NDJSON</option></select></div> <div><label class="label label-text">Upsert on field (optional, e.g. <code class="text-xs">email</code>)</label><input class="input input-bordered w-full font-mono"/></div> <label class="label cursor-pointer gap-2"><input type="checkbox" class="checkbox checkbox-sm"/><span class="label-text">Create missing columns automatically</span></label></div> <!> <div class="flex justify-end gap-2 mt-4"><button class="btn btn-ghost">Close</button><button class="btn btn-primary gap-2"><!> </button></div></div></div>'), Ae = e.from_html('<div class="p-6 space-y-4"><header class="flex items-center justify-between"><h1 class="text-2xl font-semibold flex items-center gap-2"><!> Data Import</h1> <button class="btn btn-primary btn-sm gap-2"><!> New import</button></header> <!> <div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Time</th><th>Collection</th><th>Format</th><th>Rows</th><th>Errors</th><th>Status</th></tr></thead><tbody><!></tbody></table></div></div> <!>', 1);
function Le(v, s) {
  var ne;
  e.push(s, !0);
  const h = ((ne = window.__zveltio) == null ? void 0 : ne.engineUrl) ?? "";
  let c = e.state(e.proxy([])), _ = e.state(e.proxy([])), m = e.state(""), o = e.state(!1), p = e.state(!1), x = e.state(!1), g = e.state(null), a = e.proxy({
    collection: "",
    format: "csv",
    upsert_on: "",
    create_missing_columns: !1,
    file: null
  });
  async function j(t, l) {
    const n = await fetch(`${h}${t}`, { credentials: "include", ...l }), f = await n.json().catch(() => ({}));
    if (!n.ok) throw new Error(f.error || `HTTP ${n.status}`);
    return f;
  }
  async function M() {
    try {
      const t = await j("/api/import/logs?limit=50");
      e.set(c, t.data ?? [], !0);
    } catch (t) {
      e.set(m, t.message, !0);
    }
  }
  async function O() {
    try {
      const t = await j("/api/collections");
      e.set(_, t.collections ?? t.data ?? [], !0);
    } catch {
    }
  }
  function W(t) {
    if (a.file = t, t && !a.collection) {
      const l = t.name.toLowerCase().split(".").pop();
      l === "json" ? a.format = "json" : l === "ndjson" || l === "jsonl" ? a.format = "ndjson" : a.format = "csv";
    }
  }
  async function K() {
    if (!(!a.file || !a.collection)) {
      e.set(p, !0), e.set(m, ""), e.set(g, null);
      try {
        const t = new FormData();
        t.append("file", a.file), t.append("format", a.format), a.upsert_on && t.append("upsert_on", a.upsert_on), t.append("create_missing_columns", String(a.create_missing_columns));
        const l = await fetch(`${h}/api/import/${encodeURIComponent(a.collection)}`, { method: "POST", credentials: "include", body: t }), n = await l.json();
        if (!l.ok) throw new Error(n.error || `HTTP ${l.status}`);
        e.set(g, n, !0), await M();
      } catch (t) {
        e.set(m, t.message, !0);
      } finally {
        e.set(p, !1);
      }
    }
  }
  Te(() => {
    M(), O();
  });
  function J(t) {
    if (!t) return "—";
    const l = ["B", "KB", "MB", "GB"];
    let n = 0;
    for (; t > 1024 && n < l.length - 1; )
      t /= 1024, n++;
    return `${t.toFixed(1)} ${l[n]}`;
  }
  var E = Ae(), z = e.first_child(E), H = e.child(z), X = e.child(H), me = e.child(X);
  q(me, { class: "h-6 w-6" }), e.next(), e.reset(X);
  var Q = e.sibling(X, 2), ge = e.child(Q);
  q(ge, { class: "h-4 w-4" }), e.next(), e.reset(Q), e.reset(H);
  var ae = e.sibling(H, 2);
  {
    var be = (t) => {
      var l = Be(), n = e.child(l);
      Ie(n, { class: "h-4 w-4" });
      var f = e.sibling(n);
      e.reset(l), e.template_effect(() => e.set_text(f, ` ${e.get(m) ?? ""}`)), e.append(t, l);
    };
    e.if(ae, (t) => {
      e.get(m) && t(be);
    });
  }
  var le = e.sibling(ae, 2), ie = e.child(le), oe = e.sibling(e.child(ie)), xe = e.child(oe);
  {
    var we = (t) => {
      var l = Fe();
      e.append(t, l);
    }, ye = (t) => {
      var l = e.comment(), n = e.first_child(l);
      e.each(n, 17, () => e.get(c), (f) => f.id, (f, u) => {
        var D = Me(), k = e.child(D), I = e.child(k, !0);
        e.reset(k);
        var $ = e.sibling(k), P = e.child($, !0);
        e.reset($);
        var U = e.sibling($), b = e.child(U), R = e.child(b, !0);
        e.reset(b), e.reset(U);
        var S = e.sibling(U), A = e.child(S);
        e.reset(S);
        var B = e.sibling(S), Y = e.child(B, !0);
        e.reset(B);
        var L = e.sibling(B), N = e.child(L), F = e.child(N, !0);
        e.reset(N), e.reset(L), e.reset(D), e.template_effect(
          (y) => {
            e.set_text(I, y), e.set_text(P, e.get(u).collection), e.set_text(R, e.get(u).format), e.set_text(A, `${e.get(u).rows_imported ?? "—" ?? ""} / ${e.get(u).total_rows ?? "?" ?? ""}`), e.set_text(Y, e.get(u).error_count ?? 0), e.set_class(N, 1, `badge ${e.get(u).status === "completed" ? "badge-success" : e.get(u).status === "failed" ? "badge-error" : "badge-warning"} badge-sm`), e.set_text(F, e.get(u).status);
          },
          [() => {
            var y;
            return (y = e.get(u).created_at) == null ? void 0 : y.slice(0, 16).replace("T", " ");
          }]
        ), e.append(f, D);
      }), e.append(t, l);
    };
    e.if(xe, (t) => {
      e.get(c).length === 0 ? t(we) : t(ye, -1);
    });
  }
  e.reset(oe), e.reset(ie), e.reset(le), e.reset(z);
  var ke = e.sibling(z, 2);
  {
    var $e = (t) => {
      var l = Re(), n = e.child(l), f = e.child(n), u = e.sibling(e.child(f)), D = e.child(u);
      Ue(D, { class: "h-4 w-4" }), e.reset(u), e.reset(f);
      var k = e.sibling(f, 2), I = e.child(k), $ = e.sibling(e.child(I), 2), P = e.child($);
      P.value = P.__value = "";
      var U = e.sibling(P);
      e.each(U, 17, () => e.get(_), (r) => r.name, (r, i) => {
        var d = Oe(), C = e.child(d, !0);
        e.reset(d);
        var w = {};
        e.template_effect(() => {
          e.set_text(C, e.get(i).display_name ?? e.get(i).name), w !== (w = e.get(i).name) && (d.value = (d.__value = e.get(i).name) ?? "");
        }), e.append(r, d);
      }), e.reset($), e.reset(I);
      var b = e.sibling(I, 2);
      let R;
      var S = e.child(b), A = e.sibling(S, 2), B = e.child(A);
      {
        var Y = (r) => {
          var i = We(), d = e.first_child(i), C = e.child(d, !0);
          e.reset(d);
          var w = e.sibling(d, 2), te = e.child(w, !0);
          e.reset(w), e.template_effect(
            (re) => {
              e.set_text(C, a.file.name), e.set_text(te, re);
            },
            [() => J(a.file.size)]
          ), e.append(r, i);
        }, L = (r) => {
          var i = Je(), d = e.first_child(i);
          q(d, { class: "h-8 w-8 mx-auto mb-2 text-base-content/40" }), e.next(2), e.append(r, i);
        };
        e.if(B, (r) => {
          a.file ? r(Y) : r(L, -1);
        });
      }
      e.reset(A), e.reset(b);
      var N = e.sibling(b, 2), F = e.sibling(e.child(N), 2), y = e.child(F);
      y.value = y.__value = "csv";
      var Z = e.sibling(y);
      Z.value = Z.__value = "json";
      var de = e.sibling(Z);
      de.value = de.__value = "ndjson", e.reset(F), e.reset(N);
      var ee = e.sibling(N, 2), ce = e.sibling(e.child(ee));
      e.remove_input_defaults(ce), e.reset(ee);
      var ve = e.sibling(ee, 2), pe = e.child(ve);
      e.remove_input_defaults(pe), e.next(), e.reset(ve), e.reset(k);
      var _e = e.sibling(k, 2);
      {
        var Ne = (r) => {
          var i = He(), d = e.child(i);
          Pe(d, { class: "h-4 w-4" });
          var C = e.sibling(d, 2), w = e.child(C), te = e.child(w);
          e.reset(w);
          var re = e.sibling(w, 2);
          {
            var Se = (se) => {
              var T = Ee(), Ce = e.child(T);
              e.reset(T), e.template_effect(() => e.set_text(Ce, `${e.get(g).errors.length ?? ""} errors — see job log`)), e.append(se, T);
            };
            e.if(re, (se) => {
              var T;
              (T = e.get(g).errors) != null && T.length && se(Se);
            });
          }
          e.reset(C), e.reset(i), e.template_effect(() => e.set_text(te, `Imported ${e.get(g).rows_imported ?? "?" ?? ""} rows`)), e.append(r, i);
        };
        e.if(_e, (r) => {
          e.get(g) && r(Ne);
        });
      }
      var ue = e.sibling(_e, 2), he = e.child(ue), V = e.sibling(he), fe = e.child(V);
      q(fe, { class: "h-4 w-4" });
      var je = e.sibling(fe);
      e.reset(V), e.reset(ue), e.reset(n), e.reset(l), e.template_effect(() => {
        R = e.set_class(b, 1, "border-2 border-dashed rounded-lg p-6 text-center transition cursor-pointer", null, R, { "border-primary": e.get(x) }), V.disabled = e.get(p) || !a.file || !a.collection, e.set_text(je, ` ${e.get(p) ? "Uploading…" : "Import"}`);
      }), e.delegated("click", l, (r) => r.target === r.currentTarget && e.set(o, !1)), e.delegated("click", u, () => e.set(o, !1)), e.bind_select_value($, () => a.collection, (r) => a.collection = r), e.event("dragover", b, (r) => {
        r.preventDefault(), e.set(x, !0);
      }), e.event("dragleave", b, () => e.set(x, !1)), e.event("drop", b, (r) => {
        var i, d;
        r.preventDefault(), e.set(x, !1), W(((d = (i = r.dataTransfer) == null ? void 0 : i.files) == null ? void 0 : d[0]) ?? null);
      }), e.delegated("change", S, (r) => {
        var i;
        return W(((i = r.target.files) == null ? void 0 : i[0]) ?? null);
      }), e.bind_select_value(F, () => a.format, (r) => a.format = r), e.bind_value(ce, () => a.upsert_on, (r) => a.upsert_on = r), e.bind_checked(pe, () => a.create_missing_columns, (r) => a.create_missing_columns = r), e.delegated("click", he, () => e.set(o, !1)), e.delegated("click", V, K), e.append(t, l);
    };
    e.if(ke, (t) => {
      e.get(o) && t($e);
    });
  }
  e.delegated("click", Q, () => {
    e.set(o, !0), e.set(g, null);
  }), e.append(v, E), e.pop();
}
e.delegate(["click", "change"]);
function Ve() {
  const v = window.__zveltio;
  v && v.registerRoute({
    path: "import",
    component: Le,
    label: "Data Import",
    icon: "Upload",
    category: "data"
  });
}
Ve();
export {
  Ve as default
};
