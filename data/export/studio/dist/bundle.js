import "svelte/internal/disclose-version";
import * as t from "svelte/internal/client";
import { onMount as vt } from "svelte";
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
const pt = {
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
var ut = t.from_svg("<svg><!><!></svg>");
function A(d, l) {
  t.push(l, !0);
  const v = t.prop(l, "color", 3, "currentColor"), n = t.prop(l, "size", 3, 24), c = t.prop(l, "strokeWidth", 3, 2), _ = t.prop(l, "absoluteStrokeWidth", 3, !1), i = t.prop(l, "iconNode", 19, () => []), r = t.rest_props(l, [
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
  var b = ut();
  t.attribute_effect(
    b,
    ($) => ({
      ...pt,
      ...r,
      width: n(),
      height: n(),
      stroke: v(),
      "stroke-width": $,
      class: [
        "lucide-icon lucide",
        l.name && `lucide-${l.name}`,
        l.class
      ]
    }),
    [
      () => _() ? Number(c()) * 24 / Number(n()) : c()
    ]
  );
  var N = t.child(b);
  t.each(N, 17, i, t.index, ($, O) => {
    var T = t.derived(() => t.to_array(t.get(O), 2));
    let U = () => t.get(T)[0], S = () => t.get(T)[1];
    var w = t.comment(), z = t.first_child(w);
    t.element(z, U, !0, (V, W) => {
      t.attribute_effect(V, () => ({ ...S() }));
    }), t.append($, w);
  });
  var L = t.sibling(N);
  t.snippet(L, () => l.children ?? t.noop), t.reset(b), t.append(d, b), t.pop();
}
function et(d, l) {
  t.push(l, !0);
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
  let v = t.rest_props(l, ["$$slots", "$$events", "$$legacy"]);
  const n = [
    ["path", { d: "M12 15V3" }],
    ["path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }],
    ["path", { d: "m7 10 5 5 5-5" }]
  ];
  A(d, t.spread_props({ name: "download" }, () => v, {
    get iconNode() {
      return n;
    },
    children: (c, _) => {
      var i = t.comment(), r = t.first_child(i);
      t.snippet(r, () => l.children ?? t.noop), t.append(c, i);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function ht(d, l) {
  t.push(l, !0);
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
  let v = t.rest_props(l, ["$$slots", "$$events", "$$legacy"]);
  const n = [["path", { d: "M5 12h14" }], ["path", { d: "M12 5v14" }]];
  A(d, t.spread_props({ name: "plus" }, () => v, {
    get iconNode() {
      return n;
    },
    children: (c, _) => {
      var i = t.comment(), r = t.first_child(i);
      t.snippet(r, () => l.children ?? t.noop), t.append(c, i);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function _t(d, l) {
  t.push(l, !0);
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
  let v = t.rest_props(l, ["$$slots", "$$events", "$$legacy"]);
  const n = [
    ["path", { d: "M18 6 6 18" }],
    ["path", { d: "m6 6 12 12" }]
  ];
  A(d, t.spread_props({ name: "x" }, () => v, {
    get iconNode() {
      return n;
    },
    children: (c, _) => {
      var i = t.comment(), r = t.first_child(i);
      t.snippet(r, () => l.children ?? t.noop), t.append(c, i);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
var bt = t.from_html('<div class="alert alert-error"> </div>'), ft = t.from_html('<tr><td colspan="6" class="text-center py-6 text-base-content/60">No exports recorded.</td></tr>'), mt = t.from_html('<tr><td> </td><td> </td><td><span class="badge badge-ghost badge-sm"> </span></td><td> </td><td> </td><td> </td></tr>'), gt = t.from_html("<option> </option>"), xt = t.from_html('<div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><div class="bg-base-100 rounded-xl p-6 w-full max-w-md"><div class="flex items-center justify-between mb-4"><h2 class="text-xl font-semibold">Export collection</h2><button class="btn btn-ghost btn-sm btn-square"><!></button></div> <div class="space-y-3"><div><label class="label label-text">Collection</label> <select class="select select-bordered w-full"><option>— Select —</option><!></select></div> <div><label class="label label-text">Format</label> <select class="select select-bordered w-full"><option>CSV</option><option>JSON</option><option>NDJSON</option><option>Excel (xlsx)</option></select></div> <div><label class="label label-text">Filter (Zveltio query, optional)</label><input class="input input-bordered w-full font-mono text-xs" placeholder="status=active"/></div> <div><label class="label label-text">Row limit (0 = all)</label><input type="number" class="input input-bordered w-full"/></div></div> <div class="flex justify-end gap-2 mt-4"><button class="btn btn-ghost">Cancel</button><button class="btn btn-primary gap-2"><!> Download</button></div></div></div>'), wt = t.from_html('<div class="p-6 space-y-4"><header class="flex items-center justify-between"><h1 class="text-2xl font-semibold flex items-center gap-2"><!> Data Export</h1> <button class="btn btn-primary btn-sm gap-2"><!> New export</button></header> <!> <div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Time</th><th>Collection</th><th>Format</th><th>Rows</th><th>Size</th><th>User</th></tr></thead><tbody><!></tbody></table></div></div> <!>', 1);
function yt(d, l) {
  var Q;
  t.push(l, !0);
  const v = ((Q = window.__zveltio) == null ? void 0 : Q.engineUrl) ?? "";
  let n = t.state(t.proxy([])), c = t.state(t.proxy([])), _ = t.state(""), i = t.state(!1), r = t.proxy({ collection: "", format: "csv", filter: "", limit: 0 });
  async function b(e, a) {
    const o = await fetch(`${v}${e}`, { credentials: "include", ...a }), p = await o.json().catch(() => ({}));
    if (!o.ok) throw new Error(p.error || `HTTP ${o.status}`);
    return p;
  }
  async function N() {
    try {
      const e = await b("/api/export/jobs");
      t.set(n, e.data ?? e.audit ?? [], !0);
    } catch (e) {
      t.set(_, e.message, !0);
    }
  }
  async function L() {
    try {
      const e = await b("/api/collections");
      t.set(c, e.collections ?? e.data ?? [], !0);
    } catch {
    }
  }
  function $() {
    const e = new URLSearchParams({ format: r.format });
    return r.filter && e.set("filter", r.filter), r.limit > 0 && e.set("limit", String(r.limit)), `${v}/api/export/${encodeURIComponent(r.collection)}?${e}`;
  }
  function O() {
    r.collection && (window.open($(), "_blank"), t.set(i, !1), setTimeout(N, 1e3));
  }
  vt(() => {
    N(), L();
  });
  function T(e) {
    if (!e) return "—";
    const a = ["B", "KB", "MB", "GB"];
    let o = 0;
    for (; e > 1024 && o < a.length - 1; )
      e /= 1024, o++;
    return `${e.toFixed(1)} ${a[o]}`;
  }
  var U = wt(), S = t.first_child(U), w = t.child(S), z = t.child(w), V = t.child(z);
  et(V, { class: "h-6 w-6" }), t.next(), t.reset(z);
  var W = t.sibling(z, 2), lt = t.child(W);
  ht(lt, { class: "h-4 w-4" }), t.next(), t.reset(W), t.reset(w);
  var G = t.sibling(w, 2);
  {
    var rt = (e) => {
      var a = bt(), o = t.child(a, !0);
      t.reset(a), t.template_effect(() => t.set_text(o, t.get(_))), t.append(e, a);
    };
    t.if(G, (e) => {
      t.get(_) && e(rt);
    });
  }
  var K = t.sibling(G, 2), X = t.child(K), Z = t.sibling(t.child(X)), at = t.child(Z);
  {
    var it = (e) => {
      var a = ft();
      t.append(e, a);
    }, ot = (e) => {
      var a = t.comment(), o = t.first_child(a);
      t.each(o, 17, () => t.get(n), (p) => p.id, (p, u) => {
        var C = mt(), f = t.child(C), M = t.child(f, !0);
        t.reset(f);
        var m = t.sibling(f), P = t.child(m, !0);
        t.reset(m);
        var j = t.sibling(m), y = t.child(j), B = t.child(y, !0);
        t.reset(y), t.reset(j);
        var g = t.sibling(j), D = t.child(g, !0);
        t.reset(g);
        var x = t.sibling(g), F = t.child(x, !0);
        t.reset(x);
        var k = t.sibling(x), R = t.child(k, !0);
        t.reset(k), t.reset(C), t.template_effect(
          (h, q, H) => {
            t.set_text(M, h), t.set_text(P, t.get(u).collection), t.set_text(B, t.get(u).format), t.set_text(D, q), t.set_text(F, H), t.set_text(R, t.get(u).user_id);
          },
          [
            () => {
              var h;
              return (h = t.get(u).created_at) == null ? void 0 : h.slice(0, 16).replace("T", " ");
            },
            () => {
              var h;
              return ((h = t.get(u).row_count) == null ? void 0 : h.toLocaleString()) ?? "—";
            },
            () => T(Number(t.get(u).size_bytes ?? 0))
          ]
        ), t.append(p, C);
      }), t.append(e, a);
    };
    t.if(at, (e) => {
      t.get(n).length === 0 ? e(it) : e(ot, -1);
    });
  }
  t.reset(Z), t.reset(X), t.reset(K), t.reset(S);
  var st = t.sibling(S, 2);
  {
    var nt = (e) => {
      var a = xt(), o = t.child(a), p = t.child(o), u = t.sibling(t.child(p)), C = t.child(u);
      _t(C, { class: "h-4 w-4" }), t.reset(u), t.reset(p);
      var f = t.sibling(p, 2), M = t.child(f), m = t.sibling(t.child(M), 2), P = t.child(m);
      P.value = P.__value = "";
      var j = t.sibling(P);
      t.each(j, 17, () => t.get(c), (s) => s.name, (s, J) => {
        var E = gt(), ct = t.child(E, !0);
        t.reset(E);
        var tt = {};
        t.template_effect(() => {
          t.set_text(ct, t.get(J).display_name ?? t.get(J).name), tt !== (tt = t.get(J).name) && (E.value = (E.__value = t.get(J).name) ?? "");
        }), t.append(s, E);
      }), t.reset(m), t.reset(M);
      var y = t.sibling(M, 2), B = t.sibling(t.child(y), 2), g = t.child(B);
      g.value = g.__value = "csv";
      var D = t.sibling(g);
      D.value = D.__value = "json";
      var x = t.sibling(D);
      x.value = x.__value = "ndjson";
      var F = t.sibling(x);
      F.value = F.__value = "xlsx", t.reset(B), t.reset(y);
      var k = t.sibling(y, 2), R = t.sibling(t.child(k));
      t.remove_input_defaults(R), t.reset(k);
      var h = t.sibling(k, 2), q = t.sibling(t.child(h));
      t.remove_input_defaults(q), t.reset(h), t.reset(f);
      var H = t.sibling(f, 2), Y = t.child(H), I = t.sibling(Y), dt = t.child(I);
      et(dt, { class: "h-4 w-4" }), t.next(), t.reset(I), t.reset(H), t.reset(o), t.reset(a), t.template_effect(() => I.disabled = !r.collection), t.delegated("click", a, (s) => s.target === s.currentTarget && t.set(i, !1)), t.delegated("click", u, () => t.set(i, !1)), t.bind_select_value(m, () => r.collection, (s) => r.collection = s), t.bind_select_value(B, () => r.format, (s) => r.format = s), t.bind_value(R, () => r.filter, (s) => r.filter = s), t.bind_value(q, () => r.limit, (s) => r.limit = s), t.delegated("click", Y, () => t.set(i, !1)), t.delegated("click", I, O), t.append(e, a);
    };
    t.if(st, (e) => {
      t.get(i) && e(nt);
    });
  }
  t.delegated("click", W, () => t.set(i, !0)), t.append(d, U), t.pop();
}
t.delegate(["click"]);
function kt() {
  const d = window.__zveltio;
  d && d.registerRoute({
    path: "export",
    component: yt,
    label: "Data Export",
    icon: "Download",
    category: "data"
  });
}
kt();
export {
  kt as default
};
