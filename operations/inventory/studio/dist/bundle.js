import "svelte/internal/disclose-version";
import * as e from "svelte/internal/client";
import { onMount as ze } from "svelte";
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
const Te = {
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
var Ve = e.from_svg("<svg><!><!></svg>");
function F(u, r) {
  e.push(r, !0);
  const x = e.prop(r, "color", 3, "currentColor"), s = e.prop(r, "size", 3, 24), p = e.prop(r, "strokeWidth", 3, 2), W = e.prop(r, "absoluteStrokeWidth", 3, !1), o = e.prop(r, "iconNode", 19, () => []), m = e.rest_props(r, [
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
  var y = Ve();
  e.attribute_effect(
    y,
    (M) => ({
      ...Te,
      ...m,
      width: s(),
      height: s(),
      stroke: x(),
      "stroke-width": M,
      class: [
        "lucide-icon lucide",
        r.name && `lucide-${r.name}`,
        r.class
      ]
    }),
    [
      () => W() ? Number(p()) * 24 / Number(s()) : p()
    ]
  );
  var R = e.child(y);
  e.each(R, 17, o, e.index, (M, h) => {
    var C = e.derived(() => e.to_array(e.get(h), 2));
    let S = () => e.get(C)[0], U = () => e.get(C)[1];
    var V = e.comment(), I = e.first_child(V);
    e.element(I, S, !0, (Z, Y) => {
      e.attribute_effect(Z, () => ({ ...U() }));
    }), e.append(M, V);
  });
  var T = e.sibling(R);
  e.snippet(T, () => r.children ?? e.noop), e.reset(y), e.append(u, y), e.pop();
}
function oe(u, r) {
  e.push(r, !0);
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
  let x = e.rest_props(r, ["$$slots", "$$events", "$$legacy"]);
  const s = [
    [
      "path",
      {
        d: "M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 .97 1.71l3 1.8a2 2 0 0 0 2.06 0L12 19v-5.5l-5-3-4.03 2.42Z"
      }
    ],
    ["path", { d: "m7 16.5-4.74-2.85" }],
    ["path", { d: "m7 16.5 5-3" }],
    ["path", { d: "M7 16.5v5.17" }],
    [
      "path",
      {
        d: "M12 13.5V19l3.97 2.38a2 2 0 0 0 2.06 0l3-1.8a2 2 0 0 0 .97-1.71v-3.24a2 2 0 0 0-.97-1.71L17 10.5l-5 3Z"
      }
    ],
    ["path", { d: "m17 16.5-5-3" }],
    ["path", { d: "m17 16.5 4.74-2.85" }],
    ["path", { d: "M17 16.5v5.17" }],
    [
      "path",
      {
        d: "M7.97 4.42A2 2 0 0 0 7 6.13v4.37l5 3 5-3V6.13a2 2 0 0 0-.97-1.71l-3-1.8a2 2 0 0 0-2.06 0l-3 1.8Z"
      }
    ],
    ["path", { d: "M12 8 7.26 5.15" }],
    ["path", { d: "m12 8 4.74-2.85" }],
    ["path", { d: "M12 13.5V8" }]
  ];
  F(u, e.spread_props({ name: "boxes" }, () => x, {
    get iconNode() {
      return s;
    },
    children: (p, W) => {
      var o = e.comment(), m = e.first_child(o);
      e.snippet(m, () => r.children ?? e.noop), e.append(p, o);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function Oe(u, r) {
  e.push(r, !0);
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
  let x = e.rest_props(r, ["$$slots", "$$events", "$$legacy"]);
  const s = [
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
  F(u, e.spread_props({ name: "package" }, () => x, {
    get iconNode() {
      return s;
    },
    children: (p, W) => {
      var o = e.comment(), m = e.first_child(o);
      e.snippet(m, () => r.children ?? e.noop), e.append(p, o);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function ce(u, r) {
  e.push(r, !0);
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
  let x = e.rest_props(r, ["$$slots", "$$events", "$$legacy"]);
  const s = [["path", { d: "M5 12h14" }], ["path", { d: "M12 5v14" }]];
  F(u, e.spread_props({ name: "plus" }, () => x, {
    get iconNode() {
      return s;
    },
    children: (p, W) => {
      var o = e.comment(), m = e.first_child(o);
      e.snippet(m, () => r.children ?? e.noop), e.append(p, o);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function qe(u, r) {
  e.push(r, !0);
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
  let x = e.rest_props(r, ["$$slots", "$$events", "$$legacy"]);
  const s = [
    ["path", { d: "m21 21-4.34-4.34" }],
    ["circle", { cx: "11", cy: "11", r: "8" }]
  ];
  F(u, e.spread_props({ name: "search" }, () => x, {
    get iconNode() {
      return s;
    },
    children: (p, W) => {
      var o = e.comment(), m = e.first_child(o);
      e.snippet(m, () => r.children ?? e.noop), e.append(p, o);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function Re(u, r) {
  e.push(r, !0);
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
  let x = e.rest_props(r, ["$$slots", "$$events", "$$legacy"]);
  const s = [
    [
      "path",
      { d: "M18 21V10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1v11" }
    ],
    [
      "path",
      {
        d: "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 1.132-1.803l7.95-3.974a2 2 0 0 1 1.837 0l7.948 3.974A2 2 0 0 1 22 8z"
      }
    ],
    ["path", { d: "M6 13h12" }],
    ["path", { d: "M6 17h12" }]
  ];
  F(u, e.spread_props({ name: "warehouse" }, () => x, {
    get iconNode() {
      return s;
    },
    children: (p, W) => {
      var o = e.comment(), m = e.first_child(o);
      e.snippet(m, () => r.children ?? e.noop), e.append(p, o);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function ve(u, r) {
  e.push(r, !0);
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
  let x = e.rest_props(r, ["$$slots", "$$events", "$$legacy"]);
  const s = [
    ["path", { d: "M18 6 6 18" }],
    ["path", { d: "m6 6 12 12" }]
  ];
  F(u, e.spread_props({ name: "x" }, () => x, {
    get iconNode() {
      return s;
    },
    children: (p, W) => {
      var o = e.comment(), m = e.first_child(o);
      e.snippet(m, () => r.children ?? e.noop), e.append(p, o);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
var Ue = e.from_html('<button class="btn btn-primary btn-sm gap-2"><!> New product</button>'), Fe = e.from_html('<button class="btn btn-primary btn-sm gap-2"><!> New warehouse</button>'), Ie = e.from_html('<div class="alert alert-error"> </div>'), Le = e.from_html('<tr><td colspan="5" class="text-center py-6 text-base-content/60">Loading…</td></tr>'), Be = e.from_html('<tr><td colspan="5" class="text-center py-6 text-base-content/60">No products.</td></tr>'), He = e.from_html('<tr><td class="font-mono text-xs"> </td><td> </td><td class="text-right"> </td><td> </td><td> </td></tr>'), Ke = e.from_html('<div class="join"><input class="input input-sm input-bordered join-item" placeholder="Search SKU / name..."/> <button class="btn btn-sm join-item"><!></button></div> <div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>SKU</th><th>Name</th><th class="text-right">Price</th><th>VAT</th><th>Active</th></tr></thead><tbody><!></tbody></table></div>', 1), Ze = e.from_html('<tr><td colspan="3" class="text-center py-6 text-base-content/60">No warehouses.</td></tr>'), Ee = e.from_html('<tr><td class="font-mono"> </td><td> </td><td> </td></tr>'), Je = e.from_html('<div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Code</th><th>Name</th><th>Address</th></tr></thead><tbody><!></tbody></table></div>'), De = e.from_html('<tr><td colspan="3" class="text-center py-6 text-base-content/60">No stock data.</td></tr>'), Qe = e.from_html("<tr><td> </td><td> </td><td> </td></tr>"), Xe = e.from_html('<div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Product</th><th>Warehouse</th><th class="text-right">Quantity</th></tr></thead><tbody><!></tbody></table></div>'), Ge = e.from_html('<div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><div class="bg-base-100 rounded-xl p-6 w-full max-w-md"><div class="flex items-center justify-between mb-4"><h2 class="text-xl font-semibold">New product</h2> <button class="btn btn-ghost btn-sm btn-square"><!></button></div> <div class="grid grid-cols-2 gap-3"><div class="col-span-1"><label class="label label-text">SKU</label><input class="input input-bordered w-full"/></div> <div class="col-span-1"><label class="label label-text">Currency</label><input class="input input-bordered w-full" maxlength="3"/></div> <div class="col-span-2"><label class="label label-text">Name</label><input class="input input-bordered w-full"/></div> <div class="col-span-2"><label class="label label-text">Description</label><textarea class="textarea textarea-bordered w-full"></textarea></div> <div><label class="label label-text">Price</label><input type="number" step="0.01" class="input input-bordered w-full"/></div> <div><label class="label label-text">VAT %</label><input type="number" step="0.01" class="input input-bordered w-full"/></div></div> <div class="flex justify-end gap-2 mt-4"><button class="btn btn-ghost">Cancel</button> <button class="btn btn-primary"> </button></div></div></div>'), Ye = e.from_html('<div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><div class="bg-base-100 rounded-xl p-6 w-full max-w-md"><div class="flex items-center justify-between mb-4"><h2 class="text-xl font-semibold">New warehouse</h2> <button class="btn btn-ghost btn-sm btn-square"><!></button></div> <div class="space-y-3"><div><label class="label label-text">Code</label><input class="input input-bordered w-full"/></div> <div><label class="label label-text">Name</label><input class="input input-bordered w-full"/></div> <div><label class="label label-text">Address</label><input class="input input-bordered w-full"/></div></div> <div class="flex justify-end gap-2 mt-4"><button class="btn btn-ghost">Cancel</button> <button class="btn btn-primary"> </button></div></div></div>'), et = e.from_html('<div class="p-6 space-y-4"><header class="flex items-center justify-between"><h1 class="text-2xl font-semibold flex items-center gap-2"><!> Inventory</h1> <div class="flex gap-2"><!></div></header> <!> <div role="tablist" class="tabs tabs-bordered"><button role="tab"><!> Products</button> <button role="tab"><!> Warehouses</button> <button role="tab"><!> Stock levels</button></div> <!></div> <!> <!>', 1);
function tt(u, r) {
  var ne;
  e.push(r, !0);
  const x = ((ne = window.__zveltio) == null ? void 0 : ne.engineUrl) ?? "";
  let s = e.state("products"), p = e.state(e.proxy([])), W = e.state(e.proxy([])), o = e.state(e.proxy([])), m = e.state(!1), y = e.state(""), R = e.state(""), T = e.state(!1), M = e.state(!1), h = e.state(e.proxy({
    sku: "",
    name: "",
    description: "",
    price: 0,
    currency: "RON",
    tax_rate: 19,
    is_active: !0
  })), C = e.state(!1), S = e.state(e.proxy({ name: "", code: "", address: "" }));
  async function U(t, a) {
    const i = await fetch(`${x}${t}`, { credentials: "include", ...a }), c = await i.json().catch(() => ({}));
    if (!i.ok) throw new Error(c.error || `HTTP ${i.status}`);
    return c;
  }
  async function V() {
    e.set(m, !0), e.set(y, "");
    try {
      const t = new URLSearchParams();
      e.get(R) && t.set("q", e.get(R));
      const a = await U(`/api/inventory/products?${t}`);
      e.set(p, a.data ?? [], !0);
    } catch (t) {
      e.set(y, t.message, !0);
    } finally {
      e.set(m, !1);
    }
  }
  async function I() {
    try {
      const t = await U("/api/inventory/warehouses");
      e.set(W, t.data ?? [], !0);
    } catch (t) {
      e.set(y, t.message, !0);
    }
  }
  async function Z() {
    try {
      const t = await U("/api/inventory/stock-levels");
      e.set(o, t.data ?? [], !0);
    } catch (t) {
      e.set(y, t.message, !0);
    }
  }
  async function Y() {
    e.set(M, !0), e.set(y, "");
    try {
      await U("/api/inventory/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(e.get(h))
      }), e.set(T, !1), e.set(
        h,
        {
          sku: "",
          name: "",
          description: "",
          price: 0,
          currency: "RON",
          tax_rate: 19,
          is_active: !0
        },
        !0
      ), await V();
    } catch (t) {
      e.set(y, t.message, !0);
    } finally {
      e.set(M, !1);
    }
  }
  async function ue() {
    e.set(M, !0), e.set(y, "");
    try {
      await U("/api/inventory/warehouses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(e.get(S))
      }), e.set(C, !1), e.set(S, { name: "", code: "", address: "" }, !0), await I();
    } catch (t) {
      e.set(y, t.message, !0);
    } finally {
      e.set(M, !1);
    }
  }
  e.user_effect(() => {
    e.get(s) === "products" ? V() : e.get(s) === "warehouses" ? I() : Z();
  }), ze(() => {
    V(), I();
  });
  function pe(t, a = "RON") {
    return new Intl.NumberFormat("ro-RO", { style: "currency", currency: a }).format(t);
  }
  var ee = et(), E = e.first_child(ee), J = e.child(E), D = e.child(J), he = e.child(D);
  oe(he, { class: "h-6 w-6" }), e.next(), e.reset(D);
  var te = e.sibling(D, 2), be = e.child(te);
  {
    var _e = (t) => {
      var a = Ue(), i = e.child(a);
      ce(i, { class: "h-4 w-4" }), e.next(), e.reset(a), e.delegated("click", a, () => e.set(T, !0)), e.append(t, a);
    }, ge = (t) => {
      var a = Fe(), i = e.child(a);
      ce(i, { class: "h-4 w-4" }), e.next(), e.reset(a), e.delegated("click", a, () => e.set(C, !0)), e.append(t, a);
    };
    e.if(be, (t) => {
      e.get(s) === "products" ? t(_e) : e.get(s) === "warehouses" && t(ge, 1);
    });
  }
  e.reset(te), e.reset(J);
  var ae = e.sibling(J, 2);
  {
    var me = (t) => {
      var a = Ie(), i = e.child(a, !0);
      e.reset(a), e.template_effect(() => e.set_text(i, e.get(y))), e.append(t, a);
    };
    e.if(ae, (t) => {
      e.get(y) && t(me);
    });
  }
  var Q = e.sibling(ae, 2), L = e.child(Q);
  let re;
  var fe = e.child(L);
  Oe(fe, { class: "h-4 w-4" }), e.next(), e.reset(L);
  var B = e.sibling(L, 2);
  let se;
  var xe = e.child(B);
  Re(xe, { class: "h-4 w-4" }), e.next(), e.reset(B);
  var H = e.sibling(B, 2);
  let le;
  var ye = e.child(H);
  oe(ye, { class: "h-4 w-4" }), e.next(), e.reset(H), e.reset(Q);
  var we = e.sibling(Q, 2);
  {
    var ke = (t) => {
      var a = Ke(), i = e.first_child(a), c = e.child(i);
      e.remove_input_defaults(c);
      var w = e.sibling(c, 2), z = e.child(w);
      qe(z, { class: "h-4 w-4" }), e.reset(w), e.reset(i);
      var $ = e.sibling(i, 2), d = e.child($), b = e.sibling(e.child(d)), P = e.child(b);
      {
        var k = (l) => {
          var f = Le();
          e.append(l, f);
        }, v = (l) => {
          var f = Be();
          e.append(l, f);
        }, N = (l) => {
          var f = e.comment(), _ = e.first_child(f);
          e.each(_, 17, () => e.get(p), (j) => j.id, (j, n) => {
            var A = He(), O = e.child(A), K = e.child(O, !0);
            e.reset(O);
            var q = e.sibling(O), X = e.child(q, !0);
            e.reset(q);
            var g = e.sibling(q), je = e.child(g, !0);
            e.reset(g);
            var G = e.sibling(g), We = e.child(G);
            e.reset(G);
            var de = e.sibling(G), Ae = e.child(de, !0);
            e.reset(de), e.reset(A), e.template_effect(
              (Ce) => {
                e.set_text(K, e.get(n).sku), e.set_text(X, e.get(n).name), e.set_text(je, Ce), e.set_text(We, `${e.get(n).tax_rate ?? ""}%`), e.set_text(Ae, e.get(n).is_active ? "✓" : "—");
              },
              [() => pe(Number(e.get(n).price), e.get(n).currency)]
            ), e.append(j, A);
          }), e.append(l, f);
        };
        e.if(P, (l) => {
          e.get(m) ? l(k) : e.get(p).length === 0 ? l(v, 1) : l(N, -1);
        });
      }
      e.reset(b), e.reset(d), e.reset($), e.delegated("keydown", c, (l) => l.key === "Enter" && V()), e.bind_value(c, () => e.get(R), (l) => e.set(R, l)), e.delegated("click", w, V), e.append(t, a);
    }, Ne = (t) => {
      var a = Je(), i = e.child(a), c = e.sibling(e.child(i)), w = e.child(c);
      {
        var z = (d) => {
          var b = Ze();
          e.append(d, b);
        }, $ = (d) => {
          var b = e.comment(), P = e.first_child(b);
          e.each(P, 17, () => e.get(W), (k) => k.id, (k, v) => {
            var N = Ee(), l = e.child(N), f = e.child(l, !0);
            e.reset(l);
            var _ = e.sibling(l), j = e.child(_, !0);
            e.reset(_);
            var n = e.sibling(_), A = e.child(n, !0);
            e.reset(n), e.reset(N), e.template_effect(() => {
              e.set_text(f, e.get(v).code), e.set_text(j, e.get(v).name), e.set_text(A, e.get(v).address ?? "—");
            }), e.append(k, N);
          }), e.append(d, b);
        };
        e.if(w, (d) => {
          e.get(W).length === 0 ? d(z) : d($, -1);
        });
      }
      e.reset(c), e.reset(i), e.reset(a), e.append(t, a);
    }, $e = (t) => {
      var a = Xe(), i = e.child(a), c = e.sibling(e.child(i)), w = e.child(c);
      {
        var z = (d) => {
          var b = De();
          e.append(d, b);
        }, $ = (d) => {
          var b = e.comment(), P = e.first_child(b);
          e.each(P, 17, () => e.get(o), (k) => k.id, (k, v) => {
            var N = Qe(), l = e.child(N), f = e.child(l, !0);
            e.reset(l);
            var _ = e.sibling(l), j = e.child(_, !0);
            e.reset(_);
            var n = e.sibling(_), A = e.child(n, !0);
            e.reset(n), e.reset(N), e.template_effect(
              (O) => {
                e.set_text(f, e.get(v).product_name ?? e.get(v).product_id), e.set_text(j, e.get(v).warehouse_name ?? e.get(v).warehouse_id), e.set_class(n, 1, `text-right font-medium ${O ?? ""}`), e.set_text(A, e.get(v).quantity);
              },
              [() => Number(e.get(v).quantity) <= 0 ? "text-error" : ""]
            ), e.append(k, N);
          }), e.append(d, b);
        };
        e.if(w, (d) => {
          e.get(o).length === 0 ? d(z) : d($, -1);
        });
      }
      e.reset(c), e.reset(i), e.reset(a), e.append(t, a);
    };
    e.if(we, (t) => {
      e.get(s) === "products" ? t(ke) : e.get(s) === "warehouses" ? t(Ne, 1) : t($e, -1);
    });
  }
  e.reset(E);
  var ie = e.sibling(E, 2);
  {
    var Pe = (t) => {
      var a = Ge(), i = e.child(a), c = e.child(i), w = e.sibling(e.child(c), 2), z = e.child(w);
      ve(z, { class: "h-4 w-4" }), e.reset(w), e.reset(c);
      var $ = e.sibling(c, 2), d = e.child($), b = e.sibling(e.child(d));
      e.remove_input_defaults(b), e.reset(d);
      var P = e.sibling(d, 2), k = e.sibling(e.child(P));
      e.remove_input_defaults(k), e.reset(P);
      var v = e.sibling(P, 2), N = e.sibling(e.child(v));
      e.remove_input_defaults(N), e.reset(v);
      var l = e.sibling(v, 2), f = e.sibling(e.child(l));
      e.remove_textarea_child(f), e.reset(l);
      var _ = e.sibling(l, 2), j = e.sibling(e.child(_));
      e.remove_input_defaults(j), e.reset(_);
      var n = e.sibling(_, 2), A = e.sibling(e.child(n));
      e.remove_input_defaults(A), e.reset(n), e.reset($);
      var O = e.sibling($, 2), K = e.child(O), q = e.sibling(K, 2), X = e.child(q, !0);
      e.reset(q), e.reset(O), e.reset(i), e.reset(a), e.template_effect(() => {
        q.disabled = e.get(M) || !e.get(h).sku || !e.get(h).name, e.set_text(X, e.get(M) ? "Saving…" : "Create");
      }), e.delegated("click", a, (g) => g.target === g.currentTarget && e.set(T, !1)), e.delegated("click", w, () => e.set(T, !1)), e.bind_value(b, () => e.get(h).sku, (g) => e.get(h).sku = g), e.bind_value(k, () => e.get(h).currency, (g) => e.get(h).currency = g), e.bind_value(N, () => e.get(h).name, (g) => e.get(h).name = g), e.bind_value(f, () => e.get(h).description, (g) => e.get(h).description = g), e.bind_value(j, () => e.get(h).price, (g) => e.get(h).price = g), e.bind_value(A, () => e.get(h).tax_rate, (g) => e.get(h).tax_rate = g), e.delegated("click", K, () => e.set(T, !1)), e.delegated("click", q, Y), e.append(t, a);
    };
    e.if(ie, (t) => {
      e.get(T) && t(Pe);
    });
  }
  var Me = e.sibling(ie, 2);
  {
    var Se = (t) => {
      var a = Ye(), i = e.child(a), c = e.child(i), w = e.sibling(e.child(c), 2), z = e.child(w);
      ve(z, { class: "h-4 w-4" }), e.reset(w), e.reset(c);
      var $ = e.sibling(c, 2), d = e.child($), b = e.sibling(e.child(d));
      e.remove_input_defaults(b), e.reset(d);
      var P = e.sibling(d, 2), k = e.sibling(e.child(P));
      e.remove_input_defaults(k), e.reset(P);
      var v = e.sibling(P, 2), N = e.sibling(e.child(v));
      e.remove_input_defaults(N), e.reset(v), e.reset($);
      var l = e.sibling($, 2), f = e.child(l), _ = e.sibling(f, 2), j = e.child(_, !0);
      e.reset(_), e.reset(l), e.reset(i), e.reset(a), e.template_effect(() => {
        _.disabled = e.get(M) || !e.get(S).code || !e.get(S).name, e.set_text(j, e.get(M) ? "Saving…" : "Create");
      }), e.delegated("click", a, (n) => n.target === n.currentTarget && e.set(C, !1)), e.delegated("click", w, () => e.set(C, !1)), e.bind_value(b, () => e.get(S).code, (n) => e.get(S).code = n), e.bind_value(k, () => e.get(S).name, (n) => e.get(S).name = n), e.bind_value(N, () => e.get(S).address, (n) => e.get(S).address = n), e.delegated("click", f, () => e.set(C, !1)), e.delegated("click", _, ue), e.append(t, a);
    };
    e.if(Me, (t) => {
      e.get(C) && t(Se);
    });
  }
  e.template_effect(() => {
    re = e.set_class(L, 1, "tab gap-2", null, re, { "tab-active": e.get(s) === "products" }), se = e.set_class(B, 1, "tab gap-2", null, se, { "tab-active": e.get(s) === "warehouses" }), le = e.set_class(H, 1, "tab gap-2", null, le, { "tab-active": e.get(s) === "stock" });
  }), e.delegated("click", L, () => e.set(s, "products")), e.delegated("click", B, () => e.set(s, "warehouses")), e.delegated("click", H, () => e.set(s, "stock")), e.append(u, ee), e.pop();
}
e.delegate(["click", "keydown"]);
function at() {
  const u = window.__zveltio;
  u && u.registerRoute({
    path: "inventory",
    component: tt,
    label: "Inventory",
    icon: "Boxes",
    category: "operations"
  });
}
at();
export {
  at as default
};
