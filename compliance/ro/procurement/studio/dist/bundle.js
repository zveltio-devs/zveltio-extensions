import "svelte/internal/disclose-version";
import * as t from "svelte/internal/client";
import { onMount as Wt } from "svelte";
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
const qt = {
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
var Bt = t.from_svg("<svg><!><!></svg>");
function et(f, s) {
  t.push(s, !0);
  const g = t.prop(s, "color", 3, "currentColor"), l = t.prop(s, "size", 3, 24), x = t.prop(s, "strokeWidth", 3, 2), U = t.prop(s, "absoluteStrokeWidth", 3, !1), v = t.prop(s, "iconNode", 19, () => []), k = t.rest_props(s, [
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
  var R = Bt();
  t.attribute_effect(
    R,
    (r) => ({
      ...qt,
      ...k,
      width: l(),
      height: l(),
      stroke: g(),
      "stroke-width": r,
      class: [
        "lucide-icon lucide",
        s.name && `lucide-${s.name}`,
        s.class
      ]
    }),
    [
      () => U() ? Number(x()) * 24 / Number(l()) : x()
    ]
  );
  var B = t.child(R);
  t.each(B, 17, v, t.index, (r, y) => {
    var L = t.derived(() => t.to_array(t.get(y), 2));
    let at = () => t.get(L)[0], nt = () => t.get(L)[1];
    var st = t.comment(), ot = t.first_child(st);
    t.element(ot, at, !0, (dt, ft) => {
      t.attribute_effect(dt, () => ({ ...nt() }));
    }), t.append(r, st);
  });
  var I = t.sibling(B);
  t.snippet(I, () => s.children ?? t.noop), t.reset(R), t.append(f, R), t.pop();
}
function Lt(f, s) {
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
  let g = t.rest_props(s, ["$$slots", "$$events", "$$legacy"]);
  const l = [
    ["path", { d: "M3 3v16a2 2 0 0 0 2 2h16" }],
    ["path", { d: "M18 17V9" }],
    ["path", { d: "M13 17V5" }],
    ["path", { d: "M8 17v-3" }]
  ];
  et(f, t.spread_props({ name: "chart-column" }, () => g, {
    get iconNode() {
      return l;
    },
    children: (x, U) => {
      var v = t.comment(), k = t.first_child(v);
      t.snippet(k, () => s.children ?? t.noop), t.append(x, v);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function Et(f, s) {
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
  let g = t.rest_props(s, ["$$slots", "$$events", "$$legacy"]);
  const l = [
    ["path", { d: "M21.801 10A10 10 0 1 1 17 3.335" }],
    ["path", { d: "m9 11 3 3L22 4" }]
  ];
  et(f, t.spread_props({ name: "circle-check-big" }, () => g, {
    get iconNode() {
      return l;
    },
    children: (x, U) => {
      var v = t.comment(), k = t.first_child(v);
      t.snippet(k, () => s.children ?? t.noop), t.append(x, v);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function Jt(f, s) {
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
  let g = t.rest_props(s, ["$$slots", "$$events", "$$legacy"]);
  const l = [
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
  et(f, t.spread_props({ name: "package" }, () => g, {
    get iconNode() {
      return l;
    },
    children: (x, U) => {
      var v = t.comment(), k = t.first_child(v);
      t.snippet(k, () => s.children ?? t.noop), t.append(x, v);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function $t(f, s) {
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
  let g = t.rest_props(s, ["$$slots", "$$events", "$$legacy"]);
  const l = [["path", { d: "M5 12h14" }], ["path", { d: "M12 5v14" }]];
  et(f, t.spread_props({ name: "plus" }, () => g, {
    get iconNode() {
      return l;
    },
    children: (x, U) => {
      var v = t.comment(), k = t.first_child(v);
      t.snippet(k, () => s.children ?? t.noop), t.append(x, v);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function Gt(f, s) {
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
  let g = t.rest_props(s, ["$$slots", "$$events", "$$legacy"]);
  const l = [
    ["path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }],
    ["path", { d: "M16 3.128a4 4 0 0 1 0 7.744" }],
    ["path", { d: "M22 21v-2a4 4 0 0 0-3-3.87" }],
    ["circle", { cx: "9", cy: "7", r: "4" }]
  ];
  et(f, t.spread_props({ name: "users" }, () => g, {
    get iconNode() {
      return l;
    },
    children: (x, U) => {
      var v = t.comment(), k = t.first_child(v);
      t.snippet(k, () => s.children ?? t.noop), t.append(x, v);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
var Ht = t.from_html('<button class="btn btn-primary btn-sm gap-2"><!>Comanda noua</button>'), Yt = t.from_html('<button class="btn btn-primary btn-sm gap-2"><!>Furnizor nou</button>'), Zt = t.from_html('<div class="flex justify-center py-12"><span class="loading loading-spinner loading-lg"></span></div>'), Kt = t.from_html('<div class="card bg-base-200 text-center py-12"><p class="text-base-content/60">Nu există comenzi de achizitie</p></div>'), Qt = t.from_html('<button class="btn btn-ghost btn-xs">Aprobare</button>'), Xt = t.from_html('<button class="btn btn-ghost btn-xs gap-1"><!>Receptie</button>'), te = t.from_html('<tr><td class="font-mono"> </td><td> </td><td class="text-sm"> </td><td class="text-sm max-w-48 truncate"> </td><td class="font-mono"> </td><td><span> </span></td><td><div class="flex gap-1"><!></div></td></tr>'), ee = t.from_html('<div class="card bg-base-200"><div class="overflow-x-auto"><table class="table table-sm"><thead><tr><th>Număr</th><th>Data</th><th>Furnizor</th><th>Descriere</th><th>Total</th><th>Status</th><th></th></tr></thead><tbody></tbody></table></div></div>'), ae = t.from_html('<p class="text-xs text-base-content/40"> </p>'), se = t.from_html('<span class="badge badge-outline badge-xs"> </span>'), re = t.from_html('<div class="card bg-base-200"><div class="card-body p-3"><div class="flex items-start justify-between"><div><h3 class="font-semibold"> </h3> <p class="text-sm font-mono text-base-content/60"> </p> <!> <!></div></div></div></div>'), ie = t.from_html('<div class="col-span-2 text-center py-8 text-base-content/40">Nu există furnizori inregistrati</div>'), le = t.from_html('<div class="grid grid-cols-1 md:grid-cols-2 gap-3"></div>'), ne = t.from_html('<div class="card bg-base-200 text-center py-12"><p class="text-base-content/60">Nu există linii bugetare</p></div>'), oe = t.from_html('<div class="card bg-base-200"><div class="card-body p-3"><div class="flex items-start justify-between"><div><div class="flex items-center gap-2"><span class="font-mono text-sm font-bold"> </span> <span class="text-sm"> </span></div> <div class="flex gap-4 mt-1 text-xs text-base-content/60"><span>Alocat: <strong class="font-mono"> </strong></span> <span>Cheltuit: <strong class="font-mono text-warning"> </strong></span> <span>Ramas: <strong class="font-mono text-success"> </strong> </span></div></div> <span class="text-sm font-mono"> </span></div> <progress max="100"></progress></div></div>'), de = t.from_html('<div class="space-y-3"></div>'), ce = t.from_html('<tr><td><input type="text" class="input input-xs w-36"/></td><td><input type="number" class="input input-xs w-16"/></td><td><input type="text" class="input input-xs w-12"/></td><td><input type="number" step="0.01" class="input input-xs w-24"/></td><td class="font-mono text-xs"> </td></tr>'), pe = t.from_html('<span class="loading loading-spinner loading-sm"></span>'), ue = t.from_html('<dialog class="modal modal-open"><div class="modal-box w-11/12 max-w-3xl"><h3 class="font-bold text-lg mb-4">Comanda noua de achizitie</h3> <div class="grid grid-cols-2 gap-3 mb-4"><div class="form-control"><label class="label" for="order-number"><span class="label-text">Număr comanda</span></label> <input id="order-number" type="text" placeholder="CA-2026-001" class="input input-sm font-mono"/></div> <div class="form-control"><label class="label" for="order-date"><span class="label-text">Data</span></label> <input id="order-date" type="date" class="input input-sm"/></div> <div class="form-control"><label class="label" for="order-supplier"><span class="label-text">Furnizor</span></label> <input id="order-supplier" type="text" class="input input-sm"/></div> <div class="form-control"><label class="label" for="order-supplier-cui"><span class="label-text">CUI Furnizor</span></label> <input id="order-supplier-cui" type="text" class="input input-sm font-mono"/></div> <div class="form-control col-span-2"><label class="label" for="order-description"><span class="label-text">Descriere obiect achizitie</span></label> <input id="order-description" type="text" class="input input-sm"/></div></div> <div class="overflow-x-auto mb-4"><table class="table table-xs"><thead><tr><th>Articol</th><th>Cant.</th><th>UM</th><th>Pret unitar</th><th>Total</th></tr></thead><tbody></tbody></table> <button class="btn btn-ghost btn-xs mt-1">+ Linie</button></div> <div class="text-right text-sm"><p>Subtotal: <strong class="font-mono"> </strong></p> <p>TVA 19%: <strong class="font-mono"> </strong></p> <p class="text-base font-bold">Total: <strong class="font-mono"> </strong></p></div> <div class="modal-action"><button class="btn btn-ghost">Anulare</button> <button class="btn btn-primary"><!> Creare comanda</button></div></div> <button class="modal-backdrop"></button></dialog>'), ve = t.from_html('<span class="loading loading-spinner loading-sm"></span>'), _e = t.from_html('<dialog class="modal modal-open"><div class="modal-box"><h3 class="font-bold text-lg mb-4">Furnizor nou</h3> <div class="space-y-3"><div class="form-control"><label class="label" for="supplier-name"><span class="label-text">Denumire</span></label> <input id="supplier-name" type="text" class="input"/></div> <div class="form-control"><label class="label" for="supplier-cui"><span class="label-text">CUI</span></label> <input id="supplier-cui" type="text" class="input font-mono"/></div> <div class="grid grid-cols-2 gap-3"><div class="form-control"><label class="label" for="supplier-county"><span class="label-text">Judet</span></label> <input id="supplier-county" type="text" class="input input-sm"/></div> <div class="form-control"><label class="label" for="supplier-category"><span class="label-text">Categorie</span></label> <input id="supplier-category" type="text" class="input input-sm"/></div></div> <div class="form-control"><label class="label" for="supplier-email"><span class="label-text">Email contact</span></label> <input id="supplier-email" type="email" class="input input-sm"/></div></div> <div class="modal-action"><button class="btn btn-ghost">Anulare</button> <button class="btn btn-primary"><!> Inregistrare</button></div></div> <button class="modal-backdrop"></button></dialog>'), ge = t.from_html('<div class="space-y-6"><div class="flex items-center justify-between"><div><h1 class="text-2xl font-bold">Achizitii Publice RO</h1> <p class="text-base-content/60 text-sm mt-1">Comenzi de achizitie, furnizori, executie bugetara</p></div> <!></div> <div class="tabs tabs-boxed w-fit"><button><!>Comenzi</button> <button><!>Furnizori</button> <button><!>Buget</button></div> <!></div> <!> <!>', 1);
function be(f, s) {
  t.push(s, !0);
  const g = window.__ZVELTIO_ENGINE_URL__ || "";
  let l = t.state("orders"), x = t.state(t.proxy([])), U = t.state(t.proxy([])), v = t.state(t.proxy([])), k = t.state(!0), R = t.state(!1), B = t.state(!1), I = t.state(!1), r = t.proxy({
    number: "",
    date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    supplier_name: "",
    supplier_cui: "",
    description: "",
    currency: "RON",
    subtotal: 0,
    vat_total: 0,
    total: 0,
    items: [
      {
        description: "",
        quantity: 1,
        unit: "BUC",
        unit_price: 0,
        total: 0
      }
    ]
  }), y = t.state(t.proxy({
    name: "",
    cui: "",
    county: "",
    category: "",
    contact_email: ""
  }));
  Wt(() => L());
  async function L() {
    t.set(k, !0);
    const [e, a, d] = await Promise.all([
      fetch(`${g}/api/ro-procurement/orders`, { credentials: "include" }).then((i) => i.json()),
      fetch(`${g}/api/ro-procurement/suppliers`, { credentials: "include" }).then((i) => i.json()),
      fetch(`${g}/api/ro-procurement/budget?year=${(/* @__PURE__ */ new Date()).getFullYear()}`, { credentials: "include" }).then((i) => i.json())
    ]);
    t.set(x, e.orders || [], !0), t.set(U, a.suppliers || [], !0), t.set(v, d.budget_lines || [], !0), t.set(k, !1);
  }
  function at(e) {
    e.total = Math.round(e.quantity * e.unit_price * 100) / 100, r.subtotal = r.items.reduce((a, d) => a + d.total, 0), r.vat_total = Math.round(r.subtotal * 0.19 * 100) / 100, r.total = r.subtotal + r.vat_total;
  }
  async function nt() {
    if (!(!r.number || !r.supplier_name)) {
      t.set(I, !0);
      try {
        await fetch(`${g}/api/ro-procurement/orders`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(r)
        }), t.set(R, !1), await L();
      } finally {
        t.set(I, !1);
      }
    }
  }
  async function st() {
    if (!(!t.get(y).name || !t.get(y).cui)) {
      t.set(I, !0);
      try {
        await fetch(`${g}/api/ro-procurement/suppliers`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(t.get(y))
        }), t.set(B, !1), t.set(
          y,
          {
            name: "",
            cui: "",
            county: "",
            category: "",
            contact_email: ""
          },
          !0
        ), await L();
      } finally {
        t.set(I, !1);
      }
    }
  }
  async function ot(e) {
    await fetch(`${g}/api/ro-procurement/orders/${e}/approve`, { method: "POST", credentials: "include" }), await L();
  }
  async function dt(e) {
    await fetch(`${g}/api/ro-procurement/orders/${e}/receive`, { method: "POST", credentials: "include" }), await L();
  }
  function ft(e) {
    return {
      draft: "badge-warning",
      approved: "badge-info",
      received: "badge-success",
      cancelled: "badge-error"
    }[e] || "badge-ghost";
  }
  function rt(e) {
    return !e.allocated || e.allocated === 0 ? 0 : Math.min(100, Math.round(e.spent / e.allocated * 100));
  }
  var xt = ge(), ct = t.first_child(xt), pt = t.child(ct), zt = t.sibling(t.child(pt), 2);
  {
    var Ct = (e) => {
      var a = Ht(), d = t.child(a);
      $t(d, { size: 16 }), t.next(), t.reset(a), t.delegated("click", a, () => t.set(R, !0)), t.append(e, a);
    }, Mt = (e) => {
      var a = Yt(), d = t.child(a);
      $t(d, { size: 16 }), t.next(), t.reset(a), t.delegated("click", a, () => t.set(B, !0)), t.append(e, a);
    };
    t.if(zt, (e) => {
      t.get(l) === "orders" ? e(Ct) : t.get(l) === "suppliers" && e(Mt, 1);
    });
  }
  t.reset(pt);
  var ut = t.sibling(pt, 2), K = t.child(ut), Ot = t.child(K);
  Jt(Ot, { size: 14 }), t.next(), t.reset(K);
  var Q = t.sibling(K, 2), Ft = t.child(Q);
  Gt(Ft, { size: 14 }), t.next(), t.reset(Q);
  var it = t.sibling(Q, 2), Pt = t.child(it);
  Lt(Pt, { size: 14 }), t.next(), t.reset(it), t.reset(ut);
  var St = t.sibling(ut, 2);
  {
    var At = (e) => {
      var a = Zt();
      t.append(e, a);
    }, Tt = (e) => {
      var a = t.comment(), d = t.first_child(a);
      {
        var i = (c) => {
          var p = Kt();
          t.append(c, p);
        }, N = (c) => {
          var p = ee(), P = t.child(p), n = t.child(P), $ = t.sibling(t.child(n));
          t.each($, 21, () => t.get(x), t.index, (z, o) => {
            var w = te(), C = t.child(w), M = t.child(C, !0);
            t.reset(C);
            var O = t.sibling(C), m = t.child(O, !0);
            t.reset(O);
            var _ = t.sibling(O), F = t.child(_, !0);
            t.reset(_);
            var S = t.sibling(_), D = t.child(S, !0);
            t.reset(S);
            var u = t.sibling(S), j = t.child(u);
            t.reset(u);
            var V = t.sibling(u), J = t.child(V), G = t.child(J, !0);
            t.reset(J), t.reset(V);
            var W = t.sibling(V), Y = t.child(W), Z = t.child(Y);
            {
              var H = (A) => {
                var T = Qt();
                t.delegated("click", T, () => ot(t.get(o).id)), t.append(A, T);
              }, E = (A) => {
                var T = Xt(), X = t.child(T);
                Et(X, { size: 12 }), t.next(), t.reset(T), t.delegated("click", T, () => dt(t.get(o).id)), t.append(A, T);
              };
              t.if(Z, (A) => {
                t.get(o).status === "draft" ? A(H) : t.get(o).status === "approved" && A(E, 1);
              });
            }
            t.reset(Y), t.reset(W), t.reset(w), t.template_effect(
              (A, T) => {
                t.set_text(M, t.get(o).number), t.set_text(m, t.get(o).date), t.set_text(F, t.get(o).supplier_name), t.set_text(D, t.get(o).description), t.set_text(j, `${A ?? ""} ${t.get(o).currency ?? ""}`), t.set_class(J, 1, `badge badge-sm ${T ?? ""}`), t.set_text(G, t.get(o).status);
              },
              [
                () => Number(t.get(o).total).toFixed(2),
                () => ft(t.get(o).status)
              ]
            ), t.append(z, w);
          }), t.reset($), t.reset(n), t.reset(P), t.reset(p), t.append(c, p);
        };
        t.if(d, (c) => {
          t.get(x).length === 0 ? c(i) : c(N, -1);
        });
      }
      t.append(e, a);
    }, jt = (e) => {
      var a = le();
      t.each(
        a,
        21,
        () => t.get(U),
        t.index,
        (d, i) => {
          var N = re(), c = t.child(N), p = t.child(c), P = t.child(p), n = t.child(P), $ = t.child(n, !0);
          t.reset(n);
          var z = t.sibling(n, 2), o = t.child(z);
          t.reset(z);
          var w = t.sibling(z, 2);
          {
            var C = (m) => {
              var _ = ae(), F = t.child(_, !0);
              t.reset(_), t.template_effect(() => t.set_text(F, t.get(i).county)), t.append(m, _);
            };
            t.if(w, (m) => {
              t.get(i).county && m(C);
            });
          }
          var M = t.sibling(w, 2);
          {
            var O = (m) => {
              var _ = se(), F = t.child(_, !0);
              t.reset(_), t.template_effect(() => t.set_text(F, t.get(i).category)), t.append(m, _);
            };
            t.if(M, (m) => {
              t.get(i).category && m(O);
            });
          }
          t.reset(P), t.reset(p), t.reset(c), t.reset(N), t.template_effect(() => {
            t.set_text($, t.get(i).name), t.set_text(o, `CUI: ${t.get(i).cui ?? ""}`);
          }), t.append(d, N);
        },
        (d) => {
          var i = ie();
          t.append(d, i);
        }
      ), t.reset(a), t.append(e, a);
    }, Rt = (e) => {
      var a = t.comment(), d = t.first_child(a);
      {
        var i = (c) => {
          var p = ne();
          t.append(c, p);
        }, N = (c) => {
          var p = de();
          t.each(p, 21, () => t.get(v), t.index, (P, n) => {
            var $ = oe(), z = t.child($), o = t.child(z), w = t.child(o), C = t.child(w), M = t.child(C), O = t.child(M, !0);
            t.reset(M);
            var m = t.sibling(M, 2), _ = t.child(m, !0);
            t.reset(m), t.reset(C);
            var F = t.sibling(C, 2), S = t.child(F), D = t.sibling(t.child(S)), u = t.child(D, !0);
            t.reset(D), t.reset(S);
            var j = t.sibling(S, 2), V = t.sibling(t.child(j)), J = t.child(V, !0);
            t.reset(V), t.reset(j);
            var G = t.sibling(j, 2), W = t.sibling(t.child(G)), Y = t.child(W, !0);
            t.reset(W);
            var Z = t.sibling(W);
            t.reset(G), t.reset(F), t.reset(w);
            var H = t.sibling(w, 2), E = t.child(H);
            t.reset(H), t.reset(o);
            var A = t.sibling(o, 2);
            t.reset(z), t.reset($), t.template_effect(
              (T, X, b, h, lt, tt) => {
                t.set_text(O, t.get(n).code), t.set_text(_, t.get(n).name), t.set_text(u, T), t.set_text(J, X), t.set_text(Y, b), t.set_text(Z, ` ${t.get(n).currency ?? ""}`), t.set_text(E, `${h ?? ""}%`), t.set_class(A, 1, `progress ${lt ?? ""} mt-2`), t.set_value(A, tt);
              },
              [
                () => Number(t.get(n).allocated).toFixed(2),
                () => Number(t.get(n).spent).toFixed(2),
                () => Number(t.get(n).remaining).toFixed(2),
                () => rt(t.get(n)),
                () => rt(t.get(n)) > 90 ? "progress-error" : rt(t.get(n)) > 70 ? "progress-warning" : "progress-primary",
                () => rt(t.get(n))
              ]
            ), t.append(P, $);
          }), t.reset(p), t.append(c, p);
        };
        t.if(d, (c) => {
          t.get(v).length === 0 ? c(i) : c(N, -1);
        });
      }
      t.append(e, a);
    };
    t.if(St, (e) => {
      t.get(k) ? e(At) : t.get(l) === "orders" ? e(Tt, 1) : t.get(l) === "suppliers" ? e(jt, 2) : t.get(l) === "budget" && e(Rt, 3);
    });
  }
  t.reset(ct);
  var yt = t.sibling(ct, 2);
  {
    var It = (e) => {
      var a = ue(), d = t.child(a), i = t.sibling(t.child(d), 2), N = t.child(i), c = t.sibling(t.child(N), 2);
      t.remove_input_defaults(c), t.reset(N);
      var p = t.sibling(N, 2), P = t.sibling(t.child(p), 2);
      t.remove_input_defaults(P), t.reset(p);
      var n = t.sibling(p, 2), $ = t.sibling(t.child(n), 2);
      t.remove_input_defaults($), t.reset(n);
      var z = t.sibling(n, 2), o = t.sibling(t.child(z), 2);
      t.remove_input_defaults(o), t.reset(z);
      var w = t.sibling(z, 2), C = t.sibling(t.child(w), 2);
      t.remove_input_defaults(C), t.reset(w), t.reset(i);
      var M = t.sibling(i, 2), O = t.child(M), m = t.sibling(t.child(O));
      t.each(m, 21, () => r.items, t.index, (b, h, lt) => {
        var tt = ce(), vt = t.child(tt), wt = t.child(vt);
        t.remove_input_defaults(wt), t.reset(vt);
        var _t = t.sibling(vt), gt = t.child(_t);
        t.remove_input_defaults(gt), t.reset(_t);
        var bt = t.sibling(_t), kt = t.child(bt);
        t.remove_input_defaults(kt), t.reset(bt);
        var mt = t.sibling(bt), ht = t.child(mt);
        t.remove_input_defaults(ht), t.reset(mt);
        var Nt = t.sibling(mt), Vt = t.child(Nt, !0);
        t.reset(Nt), t.reset(tt), t.template_effect((q) => t.set_text(Vt, q), [() => t.get(h).total.toFixed(2)]), t.bind_value(wt, () => t.get(h).description, (q) => t.get(h).description = q), t.delegated("input", gt, () => at(t.get(h))), t.bind_value(gt, () => t.get(h).quantity, (q) => t.get(h).quantity = q), t.bind_value(kt, () => t.get(h).unit, (q) => t.get(h).unit = q), t.delegated("input", ht, () => at(t.get(h))), t.bind_value(ht, () => t.get(h).unit_price, (q) => t.get(h).unit_price = q), t.append(b, tt);
      }), t.reset(m), t.reset(O);
      var _ = t.sibling(O, 2);
      t.reset(M);
      var F = t.sibling(M, 2), S = t.child(F), D = t.sibling(t.child(S)), u = t.child(D);
      t.reset(D), t.reset(S);
      var j = t.sibling(S, 2), V = t.sibling(t.child(j)), J = t.child(V);
      t.reset(V), t.reset(j);
      var G = t.sibling(j, 2), W = t.sibling(t.child(G)), Y = t.child(W);
      t.reset(W), t.reset(G), t.reset(F);
      var Z = t.sibling(F, 2), H = t.child(Z), E = t.sibling(H, 2), A = t.child(E);
      {
        var T = (b) => {
          var h = pe();
          t.append(b, h);
        };
        t.if(A, (b) => {
          t.get(I) && b(T);
        });
      }
      t.next(), t.reset(E), t.reset(Z), t.reset(d);
      var X = t.sibling(d, 2);
      t.reset(a), t.template_effect(
        (b, h, lt) => {
          t.set_text(u, `${b ?? ""} RON`), t.set_text(J, `${h ?? ""} RON`), t.set_text(Y, `${lt ?? ""} RON`), E.disabled = t.get(I);
        },
        [
          () => r.subtotal.toFixed(2),
          () => r.vat_total.toFixed(2),
          () => r.total.toFixed(2)
        ]
      ), t.bind_value(c, () => r.number, (b) => r.number = b), t.bind_value(P, () => r.date, (b) => r.date = b), t.bind_value($, () => r.supplier_name, (b) => r.supplier_name = b), t.bind_value(o, () => r.supplier_cui, (b) => r.supplier_cui = b), t.bind_value(C, () => r.description, (b) => r.description = b), t.delegated("click", _, () => r.items = [
        ...r.items,
        {
          description: "",
          quantity: 1,
          unit: "BUC",
          unit_price: 0,
          total: 0
        }
      ]), t.delegated("click", H, () => t.set(R, !1)), t.delegated("click", E, nt), t.delegated("click", X, () => t.set(R, !1)), t.append(e, a);
    };
    t.if(yt, (e) => {
      t.get(R) && e(It);
    });
  }
  var Ut = t.sibling(yt, 2);
  {
    var Dt = (e) => {
      var a = _e(), d = t.child(a), i = t.sibling(t.child(d), 2), N = t.child(i), c = t.sibling(t.child(N), 2);
      t.remove_input_defaults(c), t.reset(N);
      var p = t.sibling(N, 2), P = t.sibling(t.child(p), 2);
      t.remove_input_defaults(P), t.reset(p);
      var n = t.sibling(p, 2), $ = t.child(n), z = t.sibling(t.child($), 2);
      t.remove_input_defaults(z), t.reset($);
      var o = t.sibling($, 2), w = t.sibling(t.child(o), 2);
      t.remove_input_defaults(w), t.reset(o), t.reset(n);
      var C = t.sibling(n, 2), M = t.sibling(t.child(C), 2);
      t.remove_input_defaults(M), t.reset(C), t.reset(i);
      var O = t.sibling(i, 2), m = t.child(O), _ = t.sibling(m, 2), F = t.child(_);
      {
        var S = (u) => {
          var j = ve();
          t.append(u, j);
        };
        t.if(F, (u) => {
          t.get(I) && u(S);
        });
      }
      t.next(), t.reset(_), t.reset(O), t.reset(d);
      var D = t.sibling(d, 2);
      t.reset(a), t.template_effect(() => _.disabled = t.get(I)), t.bind_value(c, () => t.get(y).name, (u) => t.get(y).name = u), t.bind_value(P, () => t.get(y).cui, (u) => t.get(y).cui = u), t.bind_value(z, () => t.get(y).county, (u) => t.get(y).county = u), t.bind_value(w, () => t.get(y).category, (u) => t.get(y).category = u), t.bind_value(M, () => t.get(y).contact_email, (u) => t.get(y).contact_email = u), t.delegated("click", m, () => t.set(B, !1)), t.delegated("click", _, st), t.delegated("click", D, () => t.set(B, !1)), t.append(e, a);
    };
    t.if(Ut, (e) => {
      t.get(B) && e(Dt);
    });
  }
  t.template_effect(() => {
    t.set_class(K, 1, `tab gap-2 ${t.get(l) === "orders" ? "tab-active" : ""}`), t.set_class(Q, 1, `tab gap-2 ${t.get(l) === "suppliers" ? "tab-active" : ""}`), t.set_class(it, 1, `tab gap-2 ${t.get(l) === "budget" ? "tab-active" : ""}`);
  }), t.delegated("click", K, () => t.set(l, "orders")), t.delegated("click", Q, () => t.set(l, "suppliers")), t.delegated("click", it, () => t.set(l, "budget")), t.append(f, xt), t.pop();
}
t.delegate(["click", "input"]);
function me() {
  const f = window.__zveltio;
  f && f.registerRoute({
    path: "ro-procurement",
    component: be,
    label: "Achizitii RO",
    icon: "ShoppingCart",
    category: "compliance"
  });
}
me();
export {
  me as default
};
