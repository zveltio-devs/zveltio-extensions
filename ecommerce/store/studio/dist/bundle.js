import "svelte/internal/disclose-version";
import * as t from "svelte/internal/client";
import { onMount as nt } from "svelte";
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
const ht = {
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
var vt = t.from_svg("<svg><!><!></svg>");
function I(i, r) {
  t.push(r, !0);
  const g = t.prop(r, "color", 3, "currentColor"), a = t.prop(r, "size", 3, 24), n = t.prop(r, "strokeWidth", 3, 2), x = t.prop(r, "absoluteStrokeWidth", 3, !1), c = t.prop(r, "iconNode", 19, () => []), l = t.rest_props(r, [
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
  var y = vt();
  t.attribute_effect(
    y,
    (N) => ({
      ...ht,
      ...l,
      width: a(),
      height: a(),
      stroke: g(),
      "stroke-width": N,
      class: [
        "lucide-icon lucide",
        r.name && `lucide-${r.name}`,
        r.class
      ]
    }),
    [
      () => x() ? Number(n()) * 24 / Number(a()) : n()
    ]
  );
  var k = t.child(y);
  t.each(k, 17, c, t.index, (N, U) => {
    var V = t.derived(() => t.to_array(t.get(U), 2));
    let $ = () => t.get(V)[0], C = () => t.get(V)[1];
    var P = t.comment(), F = t.first_child(P);
    t.element(F, $, !0, (B, J) => {
      t.attribute_effect(B, () => ({ ...C() }));
    }), t.append(N, P);
  });
  var q = t.sibling(k);
  t.snippet(q, () => r.children ?? t.noop), t.reset(y), t.append(i, y), t.pop();
}
function gt(i, r) {
  t.push(r, !0);
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
  let g = t.rest_props(r, ["$$slots", "$$events", "$$legacy"]);
  const a = [
    [
      "path",
      {
        d: "M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"
      }
    ],
    ["path", { d: "M12 22V12" }],
    ["polyline", { points: "3.29 7 12 12 20.71 7" }],
    ["path", { d: "m7.5 4.27 9 5.15" }]
  ];
  I(i, t.spread_props({ name: "package" }, () => g, {
    get iconNode() {
      return a;
    },
    children: (n, x) => {
      var c = t.comment(), l = t.first_child(c);
      t.snippet(l, () => r.children ?? t.noop), t.append(n, c);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function pt(i, r) {
  t.push(r, !0);
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
  let g = t.rest_props(r, ["$$slots", "$$events", "$$legacy"]);
  const a = [
    ["circle", { cx: "8", cy: "21", r: "1" }],
    ["circle", { cx: "19", cy: "21", r: "1" }],
    [
      "path",
      {
        d: "M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
      }
    ]
  ];
  I(i, t.spread_props({ name: "shopping-cart" }, () => g, {
    get iconNode() {
      return a;
    },
    children: (n, x) => {
      var c = t.comment(), l = t.first_child(c);
      t.snippet(l, () => r.children ?? t.noop), t.append(n, c);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function _t(i, r) {
  t.push(r, !0);
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
  let g = t.rest_props(r, ["$$slots", "$$events", "$$legacy"]);
  const a = [
    [
      "path",
      {
        d: "M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"
      }
    ],
    [
      "circle",
      { cx: "7.5", cy: "7.5", r: ".5", fill: "currentColor" }
    ]
  ];
  I(i, t.spread_props({ name: "tag" }, () => g, {
    get iconNode() {
      return a;
    },
    children: (n, x) => {
      var c = t.comment(), l = t.first_child(c);
      t.snippet(l, () => r.children ?? t.noop), t.append(n, c);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function ut(i, r) {
  t.push(r, !0);
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
  let g = t.rest_props(r, ["$$slots", "$$events", "$$legacy"]);
  const a = [
    [
      "path",
      {
        d: "M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"
      }
    ],
    ["path", { d: "M15 18H9" }],
    [
      "path",
      {
        d: "M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"
      }
    ],
    ["circle", { cx: "17", cy: "18", r: "2" }],
    ["circle", { cx: "7", cy: "18", r: "2" }]
  ];
  I(i, t.spread_props({ name: "truck" }, () => g, {
    get iconNode() {
      return a;
    },
    children: (n, x) => {
      var c = t.comment(), l = t.first_child(c);
      t.snippet(l, () => r.children ?? t.noop), t.append(n, c);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
var mt = t.from_html('<div class="alert alert-error"> </div>'), bt = t.from_html('<tr><td colspan="5" class="text-center py-6 text-base-content/60">No orders.</td></tr>'), ft = t.from_html('<tr><td class="font-mono"> </td><td> </td><td> </td><td class="text-right"> </td><td><span> </span></td></tr>'), xt = t.from_html('<div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Number</th><th>Customer</th><th>Date</th><th class="text-right">Total</th><th>Status</th></tr></thead><tbody><!></tbody></table></div>'), yt = t.from_html('<tr><td colspan="5" class="text-center py-6 text-base-content/60">No products.</td></tr>'), wt = t.from_html('<tr><td class="font-mono text-xs"> </td><td> </td><td> </td><td class="text-right"> </td><td class="text-right"> </td></tr>'), kt = t.from_html('<div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>SKU</th><th>Name</th><th>Category</th><th class="text-right">Price</th><th class="text-right">Stock</th></tr></thead><tbody><!></tbody></table></div>'), Nt = t.from_html('<tr><td colspan="3" class="text-center py-6 text-base-content/60">No categories.</td></tr>'), $t = t.from_html('<tr><td class="font-mono text-xs"> </td><td> </td><td> </td></tr>'), Ct = t.from_html('<div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Slug</th><th>Name</th><th>Active</th></tr></thead><tbody><!></tbody></table></div>'), Pt = t.from_html('<div class="p-6 space-y-4"><header><h1 class="text-2xl font-semibold flex items-center gap-2"><!> eCommerce</h1></header> <!> <div role="tablist" class="tabs tabs-bordered"><button role="tab"><!> Orders</button> <button role="tab"><!> Products</button> <button role="tab"><!> Categories</button></div> <!></div>');
function St(i, r) {
  var Z;
  t.push(r, !0);
  const g = ((Z = window.__zveltio) == null ? void 0 : Z.engineUrl) ?? "";
  let a = t.state("orders"), n = t.state(t.proxy([])), x = t.state(t.proxy([])), c = t.state(t.proxy([])), l = t.state("");
  async function y(e, o) {
    const h = await fetch(`${g}${e}`, { credentials: "include", ...o }), p = await h.json().catch(() => ({}));
    if (!h.ok) throw new Error(p.error || `HTTP ${h.status}`);
    return p;
  }
  async function k() {
    try {
      const e = await y("/api/ecommerce/orders?limit=50");
      t.set(n, e.data ?? [], !0);
    } catch (e) {
      t.set(l, e.message, !0);
    }
  }
  async function q() {
    try {
      const e = await y("/api/ecommerce/products?limit=100");
      t.set(x, e.data ?? [], !0);
    } catch (e) {
      t.set(l, e.message, !0);
    }
  }
  async function N() {
    try {
      const e = await y("/api/ecommerce/categories");
      t.set(c, e.data ?? [], !0);
    } catch (e) {
      t.set(l, e.message, !0);
    }
  }
  t.user_effect(() => {
    t.get(a) === "orders" ? k() : t.get(a) === "products" ? q() : N();
  }), nt(() => k());
  function U(e, o = "RON") {
    return new Intl.NumberFormat("ro-RO", { style: "currency", currency: o }).format(e);
  }
  function V(e) {
    return {
      pending: "badge-warning",
      paid: "badge-success",
      shipped: "badge-info",
      delivered: "badge-success",
      cancelled: "badge-error"
    }[e] ?? "badge-ghost";
  }
  var $ = Pt(), C = t.child($), P = t.child(C), F = t.child(P);
  pt(F, { class: "h-6 w-6" }), t.next(), t.reset(P), t.reset(C);
  var B = t.sibling(C, 2);
  {
    var J = (e) => {
      var o = mt(), h = t.child(o, !0);
      t.reset(o), t.template_effect(() => t.set_text(h, t.get(l))), t.append(e, o);
    };
    t.if(B, (e) => {
      t.get(l) && e(J);
    });
  }
  var K = t.sibling(B, 2), S = t.child(K);
  let Q;
  var tt = t.child(S);
  ut(tt, { class: "h-4 w-4" }), t.next(), t.reset(S);
  var M = t.sibling(S, 2);
  let X;
  var et = t.child(M);
  gt(et, { class: "h-4 w-4" }), t.next(), t.reset(M);
  var E = t.sibling(M, 2);
  let Y;
  var rt = t.child(E);
  _t(rt, { class: "h-4 w-4" }), t.next(), t.reset(E), t.reset(K);
  var at = t.sibling(K, 2);
  {
    var st = (e) => {
      var o = xt(), h = t.child(o), p = t.sibling(t.child(h)), z = t.child(p);
      {
        var A = (s) => {
          var v = bt();
          t.append(s, v);
        }, H = (s) => {
          var v = t.comment(), W = t.first_child(v);
          t.each(W, 17, () => t.get(n), (_) => _.id, (_, d) => {
            var u = ft(), m = t.child(u), T = t.child(m, !0);
            t.reset(m);
            var b = t.sibling(m), O = t.child(b, !0);
            t.reset(b);
            var f = t.sibling(b), j = t.child(f, !0);
            t.reset(f);
            var w = t.sibling(f), L = t.child(w, !0);
            t.reset(w);
            var D = t.sibling(w), R = t.child(D), G = t.child(R, !0);
            t.reset(R), t.reset(D), t.reset(u), t.template_effect(
              (ct, lt, it) => {
                t.set_text(T, t.get(d).order_number), t.set_text(O, t.get(d).customer_email ?? "—"), t.set_text(j, ct), t.set_text(L, lt), t.set_class(R, 1, `badge ${it ?? ""} badge-sm`), t.set_text(G, t.get(d).status);
              },
              [
                () => new Date(t.get(d).created_at).toLocaleDateString(),
                () => U(Number(t.get(d).total), t.get(d).currency),
                () => V(t.get(d).status)
              ]
            ), t.append(_, u);
          }), t.append(s, v);
        };
        t.if(z, (s) => {
          t.get(n).length === 0 ? s(A) : s(H, -1);
        });
      }
      t.reset(p), t.reset(h), t.reset(o), t.append(e, o);
    }, ot = (e) => {
      var o = kt(), h = t.child(o), p = t.sibling(t.child(h)), z = t.child(p);
      {
        var A = (s) => {
          var v = yt();
          t.append(s, v);
        }, H = (s) => {
          var v = t.comment(), W = t.first_child(v);
          t.each(W, 17, () => t.get(x), (_) => _.id, (_, d) => {
            var u = wt(), m = t.child(u), T = t.child(m, !0);
            t.reset(m);
            var b = t.sibling(m), O = t.child(b, !0);
            t.reset(b);
            var f = t.sibling(b), j = t.child(f, !0);
            t.reset(f);
            var w = t.sibling(f), L = t.child(w, !0);
            t.reset(w);
            var D = t.sibling(w), R = t.child(D, !0);
            t.reset(D), t.reset(u), t.template_effect(
              (G) => {
                t.set_text(T, t.get(d).sku), t.set_text(O, t.get(d).name), t.set_text(j, t.get(d).category_name ?? "—"), t.set_text(L, G), t.set_text(R, t.get(d).stock_qty);
              },
              [() => U(Number(t.get(d).price), t.get(d).currency)]
            ), t.append(_, u);
          }), t.append(s, v);
        };
        t.if(z, (s) => {
          t.get(x).length === 0 ? s(A) : s(H, -1);
        });
      }
      t.reset(p), t.reset(h), t.reset(o), t.append(e, o);
    }, dt = (e) => {
      var o = Ct(), h = t.child(o), p = t.sibling(t.child(h)), z = t.child(p);
      {
        var A = (s) => {
          var v = Nt();
          t.append(s, v);
        }, H = (s) => {
          var v = t.comment(), W = t.first_child(v);
          t.each(W, 17, () => t.get(c), (_) => _.id, (_, d) => {
            var u = $t(), m = t.child(u), T = t.child(m, !0);
            t.reset(m);
            var b = t.sibling(m), O = t.child(b, !0);
            t.reset(b);
            var f = t.sibling(b), j = t.child(f, !0);
            t.reset(f), t.reset(u), t.template_effect(() => {
              t.set_text(T, t.get(d).slug), t.set_text(O, t.get(d).name), t.set_text(j, t.get(d).is_active ? "✓" : "—");
            }), t.append(_, u);
          }), t.append(s, v);
        };
        t.if(z, (s) => {
          t.get(c).length === 0 ? s(A) : s(H, -1);
        });
      }
      t.reset(p), t.reset(h), t.reset(o), t.append(e, o);
    };
    t.if(at, (e) => {
      t.get(a) === "orders" ? e(st) : t.get(a) === "products" ? e(ot, 1) : e(dt, -1);
    });
  }
  t.reset($), t.template_effect(() => {
    Q = t.set_class(S, 1, "tab gap-2", null, Q, { "tab-active": t.get(a) === "orders" }), X = t.set_class(M, 1, "tab gap-2", null, X, { "tab-active": t.get(a) === "products" }), Y = t.set_class(E, 1, "tab gap-2", null, Y, { "tab-active": t.get(a) === "categories" });
  }), t.delegated("click", S, () => t.set(a, "orders")), t.delegated("click", M, () => t.set(a, "products")), t.delegated("click", E, () => t.set(a, "categories")), t.append(i, $), t.pop();
}
t.delegate(["click"]);
function Mt() {
  const i = window.__zveltio;
  i && i.registerRoute({
    path: "ecommerce",
    component: St,
    label: "eCommerce",
    icon: "ShoppingCart",
    category: "ecommerce"
  });
}
Mt();
export {
  Mt as default
};
