import "svelte/internal/disclose-version";
import * as t from "svelte/internal/client";
import { onMount as dt } from "svelte";
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
const ct = {
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
var ht = t.from_svg("<svg><!><!></svg>");
function U(c, s) {
  t.push(s, !0);
  const p = t.prop(s, "color", 3, "currentColor"), n = t.prop(s, "size", 3, 24), o = t.prop(s, "strokeWidth", 3, 2), g = t.prop(s, "absoluteStrokeWidth", 3, !1), r = t.prop(s, "iconNode", 19, () => []), h = t.rest_props(s, [
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
  var v = ht();
  t.attribute_effect(
    v,
    (y) => ({
      ...ct,
      ...h,
      width: n(),
      height: n(),
      stroke: p(),
      "stroke-width": y,
      class: [
        "lucide-icon lucide",
        s.name && `lucide-${s.name}`,
        s.class
      ]
    }),
    [
      () => g() ? Number(o()) * 24 / Number(n()) : o()
    ]
  );
  var _ = t.child(v);
  t.each(_, 17, r, t.index, (y, j) => {
    var z = t.derived(() => t.to_array(t.get(j), 2));
    let x = () => t.get(z)[0], w = () => t.get(z)[1];
    var k = t.comment(), q = t.first_child(k);
    t.element(q, x, !0, (C, V) => {
      t.attribute_effect(C, () => ({ ...w() }));
    }), t.append(y, k);
  });
  var T = t.sibling(_);
  t.snippet(T, () => s.children ?? t.noop), t.reset(v), t.append(c, v), t.pop();
}
function vt(c, s) {
  t.push(s, !0);
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
  let p = t.rest_props(s, ["$$slots", "$$events", "$$legacy"]);
  const n = [["polygon", { points: "6 3 20 12 6 21 6 3" }]];
  U(c, t.spread_props({ name: "play" }, () => p, {
    get iconNode() {
      return n;
    },
    children: (o, g) => {
      var r = t.comment(), h = t.first_child(r);
      t.snippet(h, () => s.children ?? t.noop), t.append(o, r);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function pt(c, s) {
  t.push(s, !0);
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
  let p = t.rest_props(s, ["$$slots", "$$events", "$$legacy"]);
  const n = [
    ["path", { d: "M3 7V5a2 2 0 0 1 2-2h2" }],
    ["path", { d: "M17 3h2a2 2 0 0 1 2 2v2" }],
    ["path", { d: "M21 17v2a2 2 0 0 1-2 2h-2" }],
    ["path", { d: "M7 21H5a2 2 0 0 1-2-2v-2" }],
    ["circle", { cx: "12", cy: "12", r: "3" }],
    ["path", { d: "m16 16-1.9-1.9" }]
  ];
  U(c, t.spread_props({ name: "scan-search" }, () => p, {
    get iconNode() {
      return n;
    },
    children: (o, g) => {
      var r = t.comment(), h = t.first_child(r);
      t.snippet(h, () => s.children ?? t.noop), t.append(o, r);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function gt(c, s) {
  t.push(s, !0);
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
  let p = t.rest_props(s, ["$$slots", "$$events", "$$legacy"]);
  const n = [
    [
      "path",
      {
        d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"
      }
    ],
    ["path", { d: "M12 9v4" }],
    ["path", { d: "M12 17h.01" }]
  ];
  U(c, t.spread_props({ name: "triangle-alert" }, () => p, {
    get iconNode() {
      return n;
    },
    children: (o, g) => {
      var r = t.comment(), h = t.first_child(r);
      t.snippet(h, () => s.children ?? t.noop), t.append(o, r);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
var _t = t.from_html('<div class="alert alert-error"> </div>'), ut = t.from_html("<option> </option>"), bt = t.from_html('<tr><td colspan="4" class="text-center py-6 text-base-content/60">No scans yet.</td></tr>'), mt = t.from_html('<tr><td> </td><td> </td><td><span class="badge badge-sm"> </span></td><td><button class="btn btn-ghost btn-xs">View</button></td></tr>'), ft = t.from_html('<tr><td colspan="4" class="text-center py-6 text-base-content/60">No issues to show. Run a scan.</td></tr>'), yt = t.from_html('<tr><td><span> </span></td><td> </td><td class="font-mono text-xs"> </td><td class="max-w-xs truncate"> </td></tr>'), xt = t.from_html('<div class="p-6 space-y-4"><header><h1 class="text-2xl font-semibold flex items-center gap-2"><!> Data Quality</h1></header> <!> <div class="bg-base-100 rounded-lg shadow p-4"><div class="flex gap-2 items-end"><div class="flex-1"><label class="label label-text">Collection</label> <select class="select select-bordered w-full"><option>— Select collection —</option><!></select></div> <button class="btn btn-primary gap-2"><!> </button></div></div> <div class="grid grid-cols-1 lg:grid-cols-2 gap-4"><div class="bg-base-100 rounded-lg shadow"><div class="p-3 font-medium border-b">Scan history</div> <table class="table table-sm"><thead><tr><th>Collection</th><th>Date</th><th>Issues</th><th></th></tr></thead><tbody><!></tbody></table></div> <div class="bg-base-100 rounded-lg shadow"><div class="p-3 font-medium border-b flex items-center gap-2"><!> Issues</div> <table class="table table-sm"><thead><tr><th>Severity</th><th>Type</th><th>Field</th><th>Description</th></tr></thead><tbody><!></tbody></table></div></div></div>');
function wt(c, s) {
  var Z;
  t.push(s, !0);
  const p = ((Z = window.__zveltio) == null ? void 0 : Z.engineUrl) ?? "";
  let n = t.state(t.proxy([])), o = t.state(t.proxy([])), g = t.state(t.proxy([])), r = t.state(""), h = t.state(!1), v = t.state("");
  async function _(e, a) {
    const i = await fetch(`${p}${e}`, { credentials: "include", ...a }), l = await i.json().catch(() => ({}));
    if (!i.ok) throw new Error(l.error || `HTTP ${i.status}`);
    return l;
  }
  async function T() {
    try {
      const [e, a] = await Promise.all([
        _("/api/quality/scans"),
        _("/api/collections").catch(() => ({ collections: [] }))
      ]);
      t.set(n, e.data ?? [], !0), t.set(g, a.collections ?? [], !0);
    } catch (e) {
      t.set(v, e.message, !0);
    }
  }
  async function y() {
    if (t.get(r)) {
      t.set(h, !0), t.set(v, "");
      try {
        const e = await _("/api/quality/scans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ collection: t.get(r) })
        });
        t.set(o, e.issues ?? [], !0), await T();
      } catch (e) {
        t.set(v, e.message, !0);
      } finally {
        t.set(h, !1);
      }
    }
  }
  async function j(e) {
    try {
      const a = await _(`/api/quality/scans/${e}/issues`);
      t.set(o, a.data ?? [], !0);
    } catch (a) {
      t.set(v, a.message, !0);
    }
  }
  dt(T);
  function z(e) {
    return {
      critical: "badge-error",
      high: "badge-warning",
      info: "badge-info"
    }[e] ?? "badge-ghost";
  }
  var x = xt(), w = t.child(x), k = t.child(w), q = t.child(k);
  pt(q, { class: "h-6 w-6" }), t.next(), t.reset(k), t.reset(w);
  var C = t.sibling(w, 2);
  {
    var V = (e) => {
      var a = _t(), i = t.child(a, !0);
      t.reset(a), t.template_effect(() => t.set_text(i, t.get(v))), t.append(e, a);
    };
    t.if(C, (e) => {
      t.get(v) && e(V);
    });
  }
  var D = t.sibling(C, 2), E = t.child(D), I = t.child(E), A = t.sibling(t.child(I), 2), R = t.child(A);
  R.value = R.__value = "";
  var tt = t.sibling(R);
  t.each(tt, 17, () => t.get(g), (e) => e.name, (e, a) => {
    var i = ut(), l = t.child(i, !0);
    t.reset(i);
    var d = {};
    t.template_effect(() => {
      t.set_text(l, t.get(a).display_name ?? t.get(a).name), d !== (d = t.get(a).name) && (i.value = (i.__value = t.get(a).name) ?? "");
    }), t.append(e, i);
  }), t.reset(A), t.reset(I);
  var W = t.sibling(I, 2), F = t.child(W);
  vt(F, { class: "h-4 w-4" });
  var et = t.sibling(F);
  t.reset(W), t.reset(E), t.reset(D);
  var J = t.sibling(D, 2), B = t.child(J), G = t.sibling(t.child(B), 2), K = t.sibling(t.child(G)), at = t.child(K);
  {
    var st = (e) => {
      var a = bt();
      t.append(e, a);
    }, rt = (e) => {
      var a = t.comment(), i = t.first_child(a);
      t.each(i, 17, () => t.get(n), (l) => l.id, (l, d) => {
        var u = mt(), b = t.child(u), $ = t.child(b, !0);
        t.reset(b);
        var N = t.sibling(b), S = t.child(N, !0);
        t.reset(N);
        var P = t.sibling(N), m = t.child(P), O = t.child(m, !0);
        t.reset(m), t.reset(P);
        var M = t.sibling(P), Q = t.child(M);
        t.reset(M), t.reset(u), t.template_effect(
          (f) => {
            t.set_text($, t.get(d).collection), t.set_text(S, f), t.set_text(O, t.get(d).issue_count ?? 0);
          },
          [() => {
            var f;
            return (f = t.get(d).created_at) == null ? void 0 : f.slice(0, 16).replace("T", " ");
          }]
        ), t.delegated("click", Q, () => j(t.get(d).id)), t.append(l, u);
      }), t.append(e, a);
    };
    t.if(at, (e) => {
      t.get(n).length === 0 ? e(st) : e(rt, -1);
    });
  }
  t.reset(K), t.reset(G), t.reset(B);
  var L = t.sibling(B, 2), H = t.child(L), it = t.child(H);
  gt(it, { class: "h-4 w-4" }), t.next(), t.reset(H);
  var X = t.sibling(H, 2), Y = t.sibling(t.child(X)), lt = t.child(Y);
  {
    var nt = (e) => {
      var a = ft();
      t.append(e, a);
    }, ot = (e) => {
      var a = t.comment(), i = t.first_child(a);
      t.each(i, 17, () => t.get(o), (l) => l.id ?? `${l.field_name}-${l.issue_type}`, (l, d) => {
        var u = yt(), b = t.child(u), $ = t.child(b), N = t.child($, !0);
        t.reset($), t.reset(b);
        var S = t.sibling(b), P = t.child(S, !0);
        t.reset(S);
        var m = t.sibling(S), O = t.child(m, !0);
        t.reset(m);
        var M = t.sibling(m), Q = t.child(M, !0);
        t.reset(M), t.reset(u), t.template_effect(
          (f) => {
            t.set_class($, 1, `badge ${f ?? ""} badge-sm`), t.set_text(N, t.get(d).severity), t.set_text(P, t.get(d).issue_type), t.set_text(O, t.get(d).field_name ?? "—"), t.set_text(Q, t.get(d).description);
          },
          [() => z(t.get(d).severity)]
        ), t.append(l, u);
      }), t.append(e, a);
    };
    t.if(lt, (e) => {
      t.get(o).length === 0 ? e(nt) : e(ot, -1);
    });
  }
  t.reset(Y), t.reset(X), t.reset(L), t.reset(J), t.reset(x), t.template_effect(() => {
    W.disabled = t.get(h) || !t.get(r), t.set_text(et, ` ${t.get(h) ? "Scanning…" : "Run scan"}`);
  }), t.bind_select_value(A, () => t.get(r), (e) => t.set(r, e)), t.delegated("click", W, y), t.append(c, x), t.pop();
}
t.delegate(["click"]);
function kt() {
  const c = window.__zveltio;
  c && c.registerRoute({
    path: "data-quality",
    component: wt,
    label: "Data Quality",
    icon: "ScanSearch",
    category: "analytics"
  });
}
kt();
export {
  kt as default
};
