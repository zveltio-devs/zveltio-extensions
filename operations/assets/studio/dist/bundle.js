import "svelte/internal/disclose-version";
import * as t from "svelte/internal/client";
import { onMount as St } from "svelte";
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
const Ct = {
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
var At = t.from_svg("<svg><!><!></svg>");
function X(u, a) {
  t.push(a, !0);
  const y = t.prop(a, "color", 3, "currentColor"), i = t.prop(a, "size", 3, 24), h = t.prop(a, "strokeWidth", 3, 2), S = t.prop(a, "absoluteStrokeWidth", 3, !1), d = t.prop(a, "iconNode", 19, () => []), o = t.rest_props(a, [
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
  var k = At();
  t.attribute_effect(
    k,
    (q) => ({
      ...Ct,
      ...o,
      width: i(),
      height: i(),
      stroke: y(),
      "stroke-width": q,
      class: [
        "lucide-icon lucide",
        a.name && `lucide-${a.name}`,
        a.class
      ]
    }),
    [
      () => S() ? Number(h()) * 24 / Number(i()) : h()
    ]
  );
  var B = t.child(k);
  t.each(B, 17, d, t.index, (q, U) => {
    var G = t.derived(() => t.to_array(t.get(U), 2));
    let at = () => t.get(G)[0], st = () => t.get(G)[1];
    var P = t.comment(), K = t.first_child(P);
    t.element(K, at, !0, (V, Q) => {
      t.attribute_effect(V, () => ({ ...st() }));
    }), t.append(q, P);
  });
  var n = t.sibling(B);
  t.snippet(n, () => a.children ?? t.noop), t.reset(k), t.append(u, k), t.pop();
}
function _t(u, a) {
  t.push(a, !0);
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
  let y = t.rest_props(a, ["$$slots", "$$events", "$$legacy"]);
  const i = [
    [
      "rect",
      {
        width: "16",
        height: "20",
        x: "4",
        y: "2",
        rx: "2",
        ry: "2"
      }
    ],
    ["path", { d: "M9 22v-4h6v4" }],
    ["path", { d: "M8 6h.01" }],
    ["path", { d: "M16 6h.01" }],
    ["path", { d: "M12 6h.01" }],
    ["path", { d: "M12 10h.01" }],
    ["path", { d: "M12 14h.01" }],
    ["path", { d: "M16 10h.01" }],
    ["path", { d: "M16 14h.01" }],
    ["path", { d: "M8 10h.01" }],
    ["path", { d: "M8 14h.01" }]
  ];
  X(u, t.spread_props({ name: "building" }, () => y, {
    get iconNode() {
      return i;
    },
    children: (h, S) => {
      var d = t.comment(), o = t.first_child(d);
      t.snippet(o, () => a.children ?? t.noop), t.append(h, d);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function Pt(u, a) {
  t.push(a, !0);
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
  let y = t.rest_props(a, ["$$slots", "$$events", "$$legacy"]);
  const i = [["path", { d: "M5 12h14" }], ["path", { d: "M12 5v14" }]];
  X(u, t.spread_props({ name: "plus" }, () => y, {
    get iconNode() {
      return i;
    },
    children: (h, S) => {
      var d = t.comment(), o = t.first_child(d);
      t.snippet(o, () => a.children ?? t.noop), t.append(h, d);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function Dt(u, a) {
  t.push(a, !0);
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
  let y = t.rest_props(a, ["$$slots", "$$events", "$$legacy"]);
  const i = [
    ["path", { d: "M16 17h6v-6" }],
    ["path", { d: "m22 17-8.5-8.5-5 5L2 7" }]
  ];
  X(u, t.spread_props({ name: "trending-down" }, () => y, {
    get iconNode() {
      return i;
    },
    children: (h, S) => {
      var d = t.comment(), o = t.first_child(d);
      t.snippet(o, () => a.children ?? t.noop), t.append(h, d);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function Ot(u, a) {
  t.push(a, !0);
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
  let y = t.rest_props(a, ["$$slots", "$$events", "$$legacy"]);
  const i = [
    [
      "path",
      {
        d: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
      }
    ]
  ];
  X(u, t.spread_props({ name: "wrench" }, () => y, {
    get iconNode() {
      return i;
    },
    children: (h, S) => {
      var d = t.comment(), o = t.first_child(d);
      t.snippet(o, () => a.children ?? t.noop), t.append(h, d);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function jt(u, a) {
  t.push(a, !0);
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
  let y = t.rest_props(a, ["$$slots", "$$events", "$$legacy"]);
  const i = [
    ["path", { d: "M18 6 6 18" }],
    ["path", { d: "m6 6 12 12" }]
  ];
  X(u, t.spread_props({ name: "x" }, () => y, {
    get iconNode() {
      return i;
    },
    children: (h, S) => {
      var d = t.comment(), o = t.first_child(d);
      t.snippet(o, () => a.children ?? t.noop), t.append(h, d);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
var zt = t.from_html('<button class="btn btn-primary btn-sm gap-2"><!> New asset</button>'), Tt = t.from_html('<div class="alert alert-error"> </div>'), qt = t.from_html('<tr><td colspan="7" class="text-center py-6 text-base-content/60">No assets.</td></tr>'), Wt = t.from_html('<tr><td class="font-mono"> </td><td> </td><td><span class="badge badge-ghost badge-sm"> </span></td><td> </td><td class="text-right"> </td><td class="text-right"> </td><td><span class="badge badge-sm"> </span></td></tr>'), Bt = t.from_html('<div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Tag</th><th>Name</th><th>Category</th><th>Acquired</th><th class="text-right">Cost</th><th class="text-right">NBV</th><th>Status</th></tr></thead><tbody><!></tbody></table></div>'), Rt = t.from_html('<tr><td colspan="5" class="text-center py-6 text-base-content/60">No maintenance records.</td></tr>'), Ft = t.from_html('<tr><td> </td><td> </td><td class="max-w-xs truncate"> </td><td class="text-right"> </td><td><span class="badge badge-sm"> </span></td></tr>'), It = t.from_html('<div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Asset</th><th>Date</th><th>Description</th><th class="text-right">Cost</th><th>Status</th></tr></thead><tbody><!></tbody></table></div>'), Ut = t.from_html('<tr><td colspan="5" class="text-center py-6 text-base-content/60">No depreciation entries.</td></tr>'), Vt = t.from_html('<tr><td> </td><td> </td><td class="text-right"> </td><td class="text-right"> </td><td class="text-right"> </td></tr>'), Et = t.from_html('<div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Asset</th><th>Period</th><th class="text-right">Depreciation</th><th class="text-right">Accumulated</th><th class="text-right">NBV</th></tr></thead><tbody><!></tbody></table></div>'), Ht = t.from_html('<div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><div class="bg-base-100 rounded-xl p-6 w-full max-w-md"><div class="flex items-center justify-between mb-4"><h2 class="text-xl font-semibold">New asset</h2><button class="btn btn-ghost btn-sm btn-square"><!></button></div> <div class="grid grid-cols-2 gap-3"><div class="col-span-1"><label class="label label-text">Tag</label><input class="input input-bordered w-full font-mono"/></div> <div class="col-span-1"><label class="label label-text">Category</label><select class="select select-bordered w-full"><option>Equipment</option><option>Vehicle</option><option>Building</option><option>Furniture</option><option>Other</option></select></div> <div class="col-span-2"><label class="label label-text">Name</label><input class="input input-bordered w-full"/></div> <div><label class="label label-text">Acquired</label><input type="date" class="input input-bordered w-full"/></div> <div><label class="label label-text">Useful life (years)</label><input type="number" class="input input-bordered w-full"/></div> <div><label class="label label-text">Cost</label><input type="number" step="0.01" class="input input-bordered w-full"/></div> <div><label class="label label-text">Currency</label><input class="input input-bordered w-full" maxlength="3"/></div> <div class="col-span-2"><label class="label label-text">Depreciation method</label><select class="select select-bordered w-full"><option>Straight line</option><option>Declining balance</option></select></div></div> <div class="flex justify-end gap-2 mt-4"><button class="btn btn-ghost">Cancel</button><button class="btn btn-primary"> </button></div></div></div>'), Jt = t.from_html('<div class="p-6 space-y-4"><header class="flex items-center justify-between"><h1 class="text-2xl font-semibold flex items-center gap-2"><!> Fixed Assets</h1> <!></header> <!> <div role="tablist" class="tabs tabs-bordered"><button role="tab"><!> Register</button> <button role="tab"><!> Maintenance</button> <button role="tab"><!> Depreciation</button></div> <!></div> <!>', 1);
function Lt(u, a) {
  var ct;
  t.push(a, !0);
  const y = ((ct = window.__zveltio) == null ? void 0 : ct.engineUrl) ?? "";
  let i = t.state("register"), h = t.state(t.proxy([])), S = t.state(t.proxy([])), d = t.state(t.proxy([])), o = t.state(""), k = t.state(!1), B = t.state(!1), n = t.state(t.proxy({
    name: "",
    asset_tag: "",
    category: "equipment",
    purchase_date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
    purchase_cost: 0,
    useful_life_years: 5,
    depreciation_method: "straight_line",
    currency: "RON"
  }));
  async function q(e, s) {
    const c = await fetch(`${y}${e}`, { credentials: "include", ...s }), p = await c.json().catch(() => ({}));
    if (!c.ok) throw new Error(p.error || `HTTP ${c.status}`);
    return p;
  }
  async function U() {
    try {
      const e = await q("/api/assets");
      t.set(h, e.data ?? [], !0);
    } catch (e) {
      t.set(o, e.message, !0);
    }
  }
  async function G() {
    try {
      const e = await q("/api/assets/maintenance");
      t.set(S, e.data ?? [], !0);
    } catch (e) {
      t.set(o, e.message, !0);
    }
  }
  async function at() {
    try {
      const e = await q("/api/assets/depreciation");
      t.set(d, e.data ?? [], !0);
    } catch (e) {
      t.set(o, e.message, !0);
    }
  }
  async function st() {
    t.set(B, !0), t.set(o, "");
    try {
      await q("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(t.get(n))
      }), t.set(k, !1), t.set(
        n,
        {
          name: "",
          asset_tag: "",
          category: "equipment",
          purchase_date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
          purchase_cost: 0,
          useful_life_years: 5,
          depreciation_method: "straight_line",
          currency: "RON"
        },
        !0
      ), await U();
    } catch (e) {
      t.set(o, e.message, !0);
    } finally {
      t.set(B, !1);
    }
  }
  t.user_effect(() => {
    t.get(i) === "register" ? U() : t.get(i) === "maintenance" ? G() : at();
  }), St(U);
  function P(e, s = "RON") {
    return new Intl.NumberFormat("ro-RO", { style: "currency", currency: s }).format(e);
  }
  var K = Jt(), V = t.first_child(K), Q = t.child(V), rt = t.child(Q), ut = t.child(rt);
  _t(ut, { class: "h-6 w-6" }), t.next(), t.reset(rt);
  var ht = t.sibling(rt, 2);
  {
    var pt = (e) => {
      var s = zt(), c = t.child(s);
      Pt(c, { class: "h-4 w-4" }), t.next(), t.reset(s), t.delegated("click", s, () => t.set(k, !0)), t.append(e, s);
    };
    t.if(ht, (e) => {
      t.get(i) === "register" && e(pt);
    });
  }
  t.reset(Q);
  var lt = t.sibling(Q, 2);
  {
    var gt = (e) => {
      var s = Tt(), c = t.child(s, !0);
      t.reset(s), t.template_effect(() => t.set_text(c, t.get(o))), t.append(e, s);
    };
    t.if(lt, (e) => {
      t.get(o) && e(gt);
    });
  }
  var it = t.sibling(lt, 2), E = t.child(it);
  let nt;
  var bt = t.child(E);
  _t(bt, { class: "h-4 w-4" }), t.next(), t.reset(E);
  var H = t.sibling(E, 2);
  let dt;
  var mt = t.child(H);
  Ot(mt, { class: "h-4 w-4" }), t.next(), t.reset(H);
  var Y = t.sibling(H, 2);
  let ot;
  var ft = t.child(Y);
  Dt(ft, { class: "h-4 w-4" }), t.next(), t.reset(Y), t.reset(it);
  var xt = t.sibling(it, 2);
  {
    var yt = (e) => {
      var s = Bt(), c = t.child(s), p = t.sibling(t.child(c)), D = t.child(p);
      {
        var R = (l) => {
          var _ = qt();
          t.append(l, _);
        }, O = (l) => {
          var _ = t.comment(), j = t.first_child(_);
          t.each(j, 17, () => t.get(h), (g) => g.id, (g, r) => {
            var b = Wt(), m = t.child(b), z = t.child(m, !0);
            t.reset(m);
            var f = t.sibling(m), T = t.child(f, !0);
            t.reset(f);
            var x = t.sibling(f), C = t.child(x), w = t.child(C, !0);
            t.reset(C), t.reset(x);
            var M = t.sibling(x), A = t.child(M, !0);
            t.reset(M);
            var N = t.sibling(M), W = t.child(N, !0);
            t.reset(N);
            var $ = t.sibling(N), F = t.child($, !0);
            t.reset($);
            var J = t.sibling($), I = t.child(J), L = t.child(I, !0);
            t.reset(I), t.reset(J), t.reset(b), t.template_effect(
              (Z, tt) => {
                t.set_text(z, t.get(r).asset_tag), t.set_text(T, t.get(r).name), t.set_text(w, t.get(r).category), t.set_text(A, t.get(r).purchase_date), t.set_text(W, Z), t.set_text(F, tt), t.set_text(L, t.get(r).status ?? "active");
              },
              [
                () => P(Number(t.get(r).purchase_cost), t.get(r).currency),
                () => P(Number(t.get(r).net_book_value ?? t.get(r).purchase_cost), t.get(r).currency)
              ]
            ), t.append(g, b);
          }), t.append(l, _);
        };
        t.if(D, (l) => {
          t.get(h).length === 0 ? l(R) : l(O, -1);
        });
      }
      t.reset(p), t.reset(c), t.reset(s), t.append(e, s);
    }, wt = (e) => {
      var s = It(), c = t.child(s), p = t.sibling(t.child(c)), D = t.child(p);
      {
        var R = (l) => {
          var _ = Rt();
          t.append(l, _);
        }, O = (l) => {
          var _ = t.comment(), j = t.first_child(_);
          t.each(j, 17, () => t.get(S), (g) => g.id, (g, r) => {
            var b = Ft(), m = t.child(b), z = t.child(m, !0);
            t.reset(m);
            var f = t.sibling(m), T = t.child(f, !0);
            t.reset(f);
            var x = t.sibling(f), C = t.child(x, !0);
            t.reset(x);
            var w = t.sibling(x), M = t.child(w, !0);
            t.reset(w);
            var A = t.sibling(w), N = t.child(A), W = t.child(N, !0);
            t.reset(N), t.reset(A), t.reset(b), t.template_effect(
              ($) => {
                t.set_text(z, t.get(r).asset_name ?? t.get(r).asset_id), t.set_text(T, t.get(r).maintenance_date), t.set_text(C, t.get(r).description), t.set_text(M, $), t.set_text(W, t.get(r).status);
              },
              [() => P(Number(t.get(r).cost ?? 0))]
            ), t.append(g, b);
          }), t.append(l, _);
        };
        t.if(D, (l) => {
          t.get(S).length === 0 ? l(R) : l(O, -1);
        });
      }
      t.reset(p), t.reset(c), t.reset(s), t.append(e, s);
    }, Nt = (e) => {
      var s = Et(), c = t.child(s), p = t.sibling(t.child(c)), D = t.child(p);
      {
        var R = (l) => {
          var _ = Ut();
          t.append(l, _);
        }, O = (l) => {
          var _ = t.comment(), j = t.first_child(_);
          t.each(j, 17, () => t.get(d), (g) => g.id, (g, r) => {
            var b = Vt(), m = t.child(b), z = t.child(m, !0);
            t.reset(m);
            var f = t.sibling(m), T = t.child(f, !0);
            t.reset(f);
            var x = t.sibling(f), C = t.child(x, !0);
            t.reset(x);
            var w = t.sibling(x), M = t.child(w, !0);
            t.reset(w);
            var A = t.sibling(w), N = t.child(A, !0);
            t.reset(A), t.reset(b), t.template_effect(
              (W, $, F) => {
                t.set_text(z, t.get(r).asset_name), t.set_text(T, t.get(r).period), t.set_text(C, W), t.set_text(M, $), t.set_text(N, F);
              },
              [
                () => P(Number(t.get(r).depreciation_amount)),
                () => P(Number(t.get(r).accumulated)),
                () => P(Number(t.get(r).net_book_value))
              ]
            ), t.append(g, b);
          }), t.append(l, _);
        };
        t.if(D, (l) => {
          t.get(d).length === 0 ? l(R) : l(O, -1);
        });
      }
      t.reset(p), t.reset(c), t.reset(s), t.append(e, s);
    };
    t.if(xt, (e) => {
      t.get(i) === "register" ? e(yt) : t.get(i) === "maintenance" ? e(wt, 1) : e(Nt, -1);
    });
  }
  t.reset(V);
  var kt = t.sibling(V, 2);
  {
    var Mt = (e) => {
      var s = Ht(), c = t.child(s), p = t.child(c), D = t.sibling(t.child(p)), R = t.child(D);
      jt(R, { class: "h-4 w-4" }), t.reset(D), t.reset(p);
      var O = t.sibling(p, 2), l = t.child(O), _ = t.sibling(t.child(l));
      t.remove_input_defaults(_), t.reset(l);
      var j = t.sibling(l, 2), g = t.sibling(t.child(j)), r = t.child(g);
      r.value = r.__value = "equipment";
      var b = t.sibling(r);
      b.value = b.__value = "vehicle";
      var m = t.sibling(b);
      m.value = m.__value = "building";
      var z = t.sibling(m);
      z.value = z.__value = "furniture";
      var f = t.sibling(z);
      f.value = f.__value = "other", t.reset(g), t.reset(j);
      var T = t.sibling(j, 2), x = t.sibling(t.child(T));
      t.remove_input_defaults(x), t.reset(T);
      var C = t.sibling(T, 2), w = t.sibling(t.child(C));
      t.remove_input_defaults(w), t.reset(C);
      var M = t.sibling(C, 2), A = t.sibling(t.child(M));
      t.remove_input_defaults(A), t.reset(M);
      var N = t.sibling(M, 2), W = t.sibling(t.child(N));
      t.remove_input_defaults(W), t.reset(N);
      var $ = t.sibling(N, 2), F = t.sibling(t.child($));
      t.remove_input_defaults(F), t.reset($);
      var J = t.sibling($, 2), I = t.sibling(t.child(J)), L = t.child(I);
      L.value = L.__value = "straight_line";
      var Z = t.sibling(L);
      Z.value = Z.__value = "declining_balance", t.reset(I), t.reset(J), t.reset(O);
      var tt = t.sibling(O, 2), vt = t.child(tt), et = t.sibling(vt), $t = t.child(et, !0);
      t.reset(et), t.reset(tt), t.reset(c), t.reset(s), t.template_effect(() => {
        et.disabled = t.get(B) || !t.get(n).name || !t.get(n).asset_tag, t.set_text($t, t.get(B) ? "Saving…" : "Create");
      }), t.delegated("click", s, (v) => v.target === v.currentTarget && t.set(k, !1)), t.delegated("click", D, () => t.set(k, !1)), t.bind_value(_, () => t.get(n).asset_tag, (v) => t.get(n).asset_tag = v), t.bind_select_value(g, () => t.get(n).category, (v) => t.get(n).category = v), t.bind_value(x, () => t.get(n).name, (v) => t.get(n).name = v), t.bind_value(w, () => t.get(n).purchase_date, (v) => t.get(n).purchase_date = v), t.bind_value(A, () => t.get(n).useful_life_years, (v) => t.get(n).useful_life_years = v), t.bind_value(W, () => t.get(n).purchase_cost, (v) => t.get(n).purchase_cost = v), t.bind_value(F, () => t.get(n).currency, (v) => t.get(n).currency = v), t.bind_select_value(I, () => t.get(n).depreciation_method, (v) => t.get(n).depreciation_method = v), t.delegated("click", vt, () => t.set(k, !1)), t.delegated("click", et, st), t.append(e, s);
    };
    t.if(kt, (e) => {
      t.get(k) && e(Mt);
    });
  }
  t.template_effect(() => {
    nt = t.set_class(E, 1, "tab gap-2", null, nt, { "tab-active": t.get(i) === "register" }), dt = t.set_class(H, 1, "tab gap-2", null, dt, { "tab-active": t.get(i) === "maintenance" }), ot = t.set_class(Y, 1, "tab gap-2", null, ot, { "tab-active": t.get(i) === "depreciation" });
  }), t.delegated("click", E, () => t.set(i, "register")), t.delegated("click", H, () => t.set(i, "maintenance")), t.delegated("click", Y, () => t.set(i, "depreciation")), t.append(u, K), t.pop();
}
t.delegate(["click"]);
function Xt() {
  const u = window.__zveltio;
  u && u.registerRoute({
    path: "assets",
    component: Lt,
    label: "Fixed Assets",
    icon: "Building",
    category: "operations"
  });
}
Xt();
export {
  Xt as default
};
