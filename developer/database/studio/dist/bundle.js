import "svelte/internal/disclose-version";
import * as e from "svelte/internal/client";
import { onMount as ke } from "svelte";
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
const Ne = {
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
var $e = e.from_svg("<svg><!><!></svg>");
function Q(p, a) {
  e.push(a, !0);
  const _ = e.prop(a, "color", 3, "currentColor"), d = e.prop(a, "size", 3, 24), c = e.prop(a, "strokeWidth", 3, 2), g = e.prop(a, "absoluteStrokeWidth", 3, !1), i = e.prop(a, "iconNode", 19, () => []), v = e.rest_props(a, [
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
  var f = $e();
  e.attribute_effect(
    f,
    (N) => ({
      ...Ne,
      ...v,
      width: d(),
      height: d(),
      stroke: _(),
      "stroke-width": N,
      class: [
        "lucide-icon lucide",
        a.name && `lucide-${a.name}`,
        a.class
      ]
    }),
    [
      () => g() ? Number(c()) * 24 / Number(d()) : c()
    ]
  );
  var k = e.child(f);
  e.each(k, 17, i, e.index, (N, D) => {
    var P = e.derived(() => e.to_array(e.get(D), 2));
    let L = () => e.get(P)[0], C = () => e.get(P)[1];
    var $ = e.comment(), V = e.first_child($);
    e.element(V, L, !0, (I, R) => {
      e.attribute_effect(I, () => ({ ...C() }));
    }), e.append(N, $);
  });
  var b = e.sibling(k);
  e.snippet(b, () => a.children ?? e.noop), e.reset(f), e.append(p, f), e.pop();
}
function Se(p, a) {
  e.push(a, !0);
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
  let _ = e.rest_props(a, ["$$slots", "$$events", "$$legacy"]);
  const d = [
    ["ellipse", { cx: "12", cy: "5", rx: "9", ry: "3" }],
    ["path", { d: "M3 5V19A9 3 0 0 0 21 19V5" }],
    ["path", { d: "M3 12A9 3 0 0 0 21 12" }]
  ];
  Q(p, e.spread_props({ name: "database" }, () => _, {
    get iconNode() {
      return d;
    },
    children: (c, g) => {
      var i = e.comment(), v = e.first_child(i);
      e.snippet(v, () => a.children ?? e.noop), e.append(c, i);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function Te(p, a) {
  e.push(a, !0);
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
  let _ = e.rest_props(a, ["$$slots", "$$events", "$$legacy"]);
  const d = [
    ["path", { d: "m21 21-4.34-4.34" }],
    ["circle", { cx: "11", cy: "11", r: "8" }]
  ];
  Q(p, e.spread_props({ name: "search" }, () => _, {
    get iconNode() {
      return d;
    },
    children: (c, g) => {
      var i = e.comment(), v = e.first_child(i);
      e.snippet(v, () => a.children ?? e.noop), e.append(c, i);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function je(p, a) {
  e.push(a, !0);
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
  let _ = e.rest_props(a, ["$$slots", "$$events", "$$legacy"]);
  const d = [
    [
      "path",
      {
        d: "M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"
      }
    ]
  ];
  Q(p, e.spread_props({ name: "table-2" }, () => _, {
    get iconNode() {
      return d;
    },
    children: (c, g) => {
      var i = e.comment(), v = e.first_child(i);
      e.snippet(v, () => a.children ?? e.noop), e.append(c, i);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
var ze = e.from_html('<div class="alert alert-error"> </div>'), Ce = e.from_html('<li class="p-3 text-base-content/60">Loading…</li>'), Me = e.from_html('<li class="p-3 text-base-content/60">No tables.</li>'), We = e.from_html("<li><button><!> </button></li>"), De = e.from_html('<div class="bg-base-100 rounded-lg p-12 text-center text-base-content/60">Select a table to inspect.</div>'), Pe = e.from_html('<tr><td class="font-mono"> </td><td><span class="badge badge-ghost badge-xs"> </span></td><td> </td><td class="font-mono text-xs text-base-content/60"> </td></tr>'), Le = e.from_html('<th class="font-mono"> </th>'), Ve = e.from_html('<tr><td class="text-center py-6 text-base-content/60">No rows.</td></tr>'), Ae = e.from_html('<td class="max-w-xs truncate"> </td>'), He = e.from_html("<tr></tr>"), Ue = e.from_html('<div class="text-xs text-base-content/60 mt-2"> </div>'), Ie = e.from_html('<div class="bg-base-100 rounded-lg shadow"><div class="p-3 border-b flex items-center justify-between"><div><div class="font-mono font-medium"> </div> <div class="text-xs text-base-content/60"> </div></div></div> <div class="p-3 border-b"><div class="font-medium text-sm mb-2">Schema</div> <table class="table table-xs"><thead><tr><th>Column</th><th>Type</th><th>Nullable</th><th>Default</th></tr></thead><tbody></tbody></table></div> <div class="p-3"><div class="font-medium text-sm mb-2">Sample rows</div> <div class="overflow-x-auto"><table class="table table-xs"><thead><tr></tr></thead><tbody><!></tbody></table></div> <!></div></div>'), Re = e.from_html('<div class="p-6 space-y-4"><header><h1 class="text-2xl font-semibold flex items-center gap-2"><!> Database</h1></header> <!> <div class="grid grid-cols-12 gap-4"><aside class="col-span-3"><div class="bg-base-100 rounded-lg shadow"><div class="p-3 border-b"><div class="font-medium mb-2"> </div> <div class="join w-full"><input class="input input-xs input-bordered join-item flex-1" placeholder="Filter..."/> <button class="btn btn-xs join-item"><!></button></div></div> <ul class="menu menu-sm max-h-[60vh] overflow-y-auto"><!></ul></div></aside> <main class="col-span-9"><!></main></div></div>');
function qe(p, a) {
  var ae;
  e.push(a, !0);
  const _ = ((ae = window.__zveltio) == null ? void 0 : ae.engineUrl) ?? "";
  let d = e.state(e.proxy([])), c = e.state(""), g = e.state(null), i = e.state(e.proxy([])), v = e.state(e.proxy([])), f = e.state(0), k = e.state(!1), b = e.state("");
  async function N(t, r) {
    const o = await fetch(`${_}${t}`, { credentials: "include", ...r }), m = await o.json().catch(() => ({}));
    if (!o.ok) throw new Error(m.error || `HTTP ${o.status}`);
    return m;
  }
  async function D() {
    e.set(k, !0), e.set(b, "");
    try {
      const t = await N("/api/database/tables");
      e.set(d, (t.data ?? t.tables ?? []).filter((r) => {
        var o;
        return !((o = r.name) != null && o.startsWith("zv_")) || r.is_data;
      }), !0);
    } catch (t) {
      e.set(b, t.message, !0);
    } finally {
      e.set(k, !1);
    }
  }
  async function P(t) {
    var r, o, m;
    e.set(g, t, !0);
    try {
      const n = await N(`/api/database/tables/${encodeURIComponent(t.name)}`);
      e.set(i, n.columns ?? ((r = n.data) == null ? void 0 : r.columns) ?? [], !0), e.set(v, n.rows ?? ((o = n.data) == null ? void 0 : o.rows) ?? [], !0), e.set(f, n.row_count ?? ((m = n.data) == null ? void 0 : m.row_count) ?? e.get(v).length, !0);
    } catch (n) {
      e.set(b, n.message, !0);
    }
  }
  let L = e.derived(() => e.get(c) ? e.get(d).filter((t) => t.name.toLowerCase().includes(e.get(c).toLowerCase())) : e.get(d));
  ke(D);
  var C = Re(), $ = e.child(C), V = e.child($), I = e.child(V);
  Se(I, { class: "h-6 w-6" }), e.next(), e.reset(V), e.reset($);
  var R = e.sibling($, 2);
  {
    var oe = (t) => {
      var r = ze(), o = e.child(r, !0);
      e.reset(r), e.template_effect(() => e.set_text(o, e.get(b))), e.append(t, r);
    };
    e.if(R, (t) => {
      e.get(b) && t(oe);
    });
  }
  var X = e.sibling(R, 2), q = e.child(X), Y = e.child(q), B = e.child(Y), E = e.child(B), ne = e.child(E);
  e.reset(E);
  var Z = e.sibling(E, 2), F = e.child(Z);
  e.remove_input_defaults(F);
  var J = e.sibling(F, 2), de = e.child(J);
  Te(de, { class: "h-3 w-3" }), e.reset(J), e.reset(Z), e.reset(B);
  var ee = e.sibling(B, 2), ce = e.child(ee);
  {
    var ve = (t) => {
      var r = Ce();
      e.append(t, r);
    }, he = (t) => {
      var r = Me();
      e.append(t, r);
    }, pe = (t) => {
      var r = e.comment(), o = e.first_child(r);
      e.each(o, 17, () => e.get(L), (m) => m.name, (m, n) => {
        var M = We(), x = e.child(M);
        let A;
        var S = e.child(x);
        je(S, { class: "h-3.5 w-3.5 shrink-0" });
        var H = e.sibling(S);
        e.reset(x), e.reset(M), e.template_effect(() => {
          var W;
          A = e.set_class(x, 1, "font-mono text-xs gap-1", null, A, { active: ((W = e.get(g)) == null ? void 0 : W.name) === e.get(n).name }), e.set_text(H, ` ${e.get(n).name ?? ""}`);
        }), e.delegated("click", x, () => P(e.get(n))), e.append(m, M);
      }), e.append(t, r);
    };
    e.if(ce, (t) => {
      e.get(k) ? t(ve) : e.get(L).length === 0 ? t(he, 1) : t(pe, -1);
    });
  }
  e.reset(ee), e.reset(Y), e.reset(q);
  var te = e.sibling(q, 2), me = e.child(te);
  {
    var _e = (t) => {
      var r = De();
      e.append(t, r);
    }, ge = (t) => {
      var r = Ie(), o = e.child(r), m = e.child(o), n = e.child(m), M = e.child(n, !0);
      e.reset(n);
      var x = e.sibling(n, 2), A = e.child(x);
      e.reset(x), e.reset(m), e.reset(o);
      var S = e.sibling(o, 2), H = e.sibling(e.child(S), 2), W = e.sibling(e.child(H));
      e.each(W, 21, () => e.get(i), (s) => s.name, (s, l) => {
        var h = Pe(), u = e.child(h), T = e.child(u, !0);
        e.reset(u);
        var w = e.sibling(u), j = e.child(w), z = e.child(j, !0);
        e.reset(j), e.reset(w);
        var y = e.sibling(w), K = e.child(y, !0);
        e.reset(y);
        var U = e.sibling(y), ye = e.child(U, !0);
        e.reset(U), e.reset(h), e.template_effect(() => {
          e.set_text(T, e.get(l).name), e.set_text(z, e.get(l).type ?? e.get(l).data_type), e.set_text(K, e.get(l).nullable ?? e.get(l).is_nullable ? "yes" : "no"), e.set_text(ye, e.get(l).default ?? "—");
        }), e.append(s, h);
      }), e.reset(W), e.reset(H), e.reset(S);
      var re = e.sibling(S, 2), O = e.sibling(e.child(re), 2), se = e.child(O), G = e.child(se), le = e.child(G);
      e.each(le, 21, () => e.get(i).slice(0, 8), (s) => s.name, (s, l) => {
        var h = Le(), u = e.child(h, !0);
        e.reset(h), e.template_effect(() => e.set_text(u, e.get(l).name)), e.append(s, h);
      }), e.reset(le), e.reset(G);
      var ie = e.sibling(G), ue = e.child(ie);
      {
        var fe = (s) => {
          var l = Ve(), h = e.child(l);
          e.reset(l), e.template_effect((u) => e.set_attribute(h, "colspan", u), [() => Math.max(1, e.get(i).length)]), e.append(s, l);
        }, be = (s) => {
          var l = e.comment(), h = e.first_child(l);
          e.each(h, 17, () => e.get(v).slice(0, 50), e.index, (u, T) => {
            var w = He();
            e.each(w, 21, () => e.get(i).slice(0, 8), (j) => j.name, (j, z) => {
              var y = Ae(), K = e.child(y, !0);
              e.reset(y), e.template_effect((U) => e.set_text(K, U), [
                () => e.get(T)[e.get(z).name] === null ? "—" : typeof e.get(T)[e.get(z).name] == "object" ? JSON.stringify(e.get(T)[e.get(z).name]) : String(e.get(T)[e.get(z).name])
              ]), e.append(j, y);
            }), e.reset(w), e.append(u, w);
          }), e.append(s, l);
        };
        e.if(ue, (s) => {
          e.get(v).length === 0 ? s(fe) : s(be, -1);
        });
      }
      e.reset(ie), e.reset(se), e.reset(O);
      var xe = e.sibling(O, 2);
      {
        var we = (s) => {
          var l = Ue(), h = e.child(l);
          e.reset(l), e.template_effect(() => e.set_text(h, `Showing first 50 of ${e.get(f) ?? ""}.`)), e.append(s, l);
        };
        e.if(xe, (s) => {
          e.get(v).length > 50 && s(we);
        });
      }
      e.reset(re), e.reset(r), e.template_effect(
        (s) => {
          e.set_text(M, e.get(g).name), e.set_text(A, `${s ?? ""} rows · ${e.get(i).length ?? ""} columns`);
        },
        [() => e.get(f).toLocaleString()]
      ), e.append(t, r);
    };
    e.if(me, (t) => {
      e.get(g) ? t(ge, -1) : t(_e);
    });
  }
  e.reset(te), e.reset(X), e.reset(C), e.template_effect(() => e.set_text(ne, `Tables (${e.get(d).length ?? ""})`)), e.bind_value(F, () => e.get(c), (t) => e.set(c, t)), e.delegated("click", J, D), e.append(p, C), e.pop();
}
e.delegate(["click"]);
function Be() {
  const p = window.__zveltio;
  p && p.registerRoute({
    path: "database",
    component: qe,
    label: "Database",
    icon: "Database",
    category: "developer"
  });
}
Be();
export {
  Be as default
};
