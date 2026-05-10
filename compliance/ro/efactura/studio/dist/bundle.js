import "svelte/internal/disclose-version";
import * as t from "svelte/internal/client";
import { onMount as Yt } from "svelte";
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
const te = {
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
var ee = t.from_svg("<svg><!><!></svg>");
function V(b, s) {
  t.push(s, !0);
  const p = t.prop(s, "color", 3, "currentColor"), v = t.prop(s, "size", 3, 24), g = t.prop(s, "strokeWidth", 3, 2), m = t.prop(s, "absoluteStrokeWidth", 3, !1), d = t.prop(s, "iconNode", 19, () => []), _ = t.rest_props(s, [
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
  var a = ee();
  t.attribute_effect(
    a,
    (j) => ({
      ...te,
      ..._,
      width: v(),
      height: v(),
      stroke: p(),
      "stroke-width": j,
      class: [
        "lucide-icon lucide",
        s.name && `lucide-${s.name}`,
        s.class
      ]
    }),
    [
      () => m() ? Number(g()) * 24 / Number(v()) : g()
    ]
  );
  var y = t.child(a);
  t.each(y, 17, d, t.index, (j, et) => {
    var $ = t.derived(() => t.to_array(t.get(et), 2));
    let at = () => t.get($)[0], it = () => t.get($)[1];
    var X = t.comment(), st = t.first_child(X);
    t.element(st, at, !0, (nt, Mt) => {
      t.attribute_effect(nt, () => ({ ...it() }));
    }), t.append(j, X);
  });
  var R = t.sibling(y);
  t.snippet(R, () => s.children ?? t.noop), t.reset(a), t.append(b, a), t.pop();
}
function ae(b, s) {
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
  const v = [
    ["path", { d: "M12 15V3" }],
    ["path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }],
    ["path", { d: "m7 10 5 5 5-5" }]
  ];
  V(b, t.spread_props({ name: "download" }, () => p, {
    get iconNode() {
      return v;
    },
    children: (g, m) => {
      var d = t.comment(), _ = t.first_child(d);
      t.snippet(_, () => s.children ?? t.noop), t.append(g, d);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function ie(b, s) {
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
  const v = [
    [
      "path",
      {
        d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"
      }
    ],
    ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }],
    ["path", { d: "M10 9H8" }],
    ["path", { d: "M16 13H8" }],
    ["path", { d: "M16 17H8" }]
  ];
  V(b, t.spread_props({ name: "file-text" }, () => p, {
    get iconNode() {
      return v;
    },
    children: (g, m) => {
      var d = t.comment(), _ = t.first_child(d);
      t.snippet(_, () => s.children ?? t.noop), t.append(g, d);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function se(b, s) {
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
  const v = [["path", { d: "M5 12h14" }], ["path", { d: "M12 5v14" }]];
  V(b, t.spread_props({ name: "plus" }, () => p, {
    get iconNode() {
      return v;
    },
    children: (g, m) => {
      var d = t.comment(), _ = t.first_child(d);
      t.snippet(_, () => s.children ?? t.noop), t.append(g, d);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function ne(b, s) {
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
  const v = [
    [
      "path",
      {
        d: "M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"
      }
    ],
    ["path", { d: "m21.854 2.147-10.94 10.939" }]
  ];
  V(b, t.spread_props({ name: "send" }, () => p, {
    get iconNode() {
      return v;
    },
    children: (g, m) => {
      var d = t.comment(), _ = t.first_child(d);
      t.snippet(_, () => s.children ?? t.noop), t.append(g, d);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function re(b, s) {
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
  const v = [
    ["path", { d: "M3 6h18" }],
    ["path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" }],
    ["path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" }],
    ["line", { x1: "10", x2: "10", y1: "11", y2: "17" }],
    ["line", { x1: "14", x2: "14", y1: "11", y2: "17" }]
  ];
  V(b, t.spread_props({ name: "trash-2" }, () => p, {
    get iconNode() {
      return v;
    },
    children: (g, m) => {
      var d = t.comment(), _ = t.first_child(d);
      t.snippet(_, () => s.children ?? t.noop), t.append(g, d);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
var le = t.from_html("<button> </button>"), oe = t.from_html('<div class="flex justify-center py-12"><span class="loading loading-spinner loading-lg"></span></div>'), de = t.from_html('<div class="card bg-base-200 text-center py-12"><!> <p class="text-base-content/60">No invoices</p> <button class="btn btn-primary btn-sm mt-4">Create Invoice</button></div>'), ce = t.from_html('<button class="btn btn-ghost btn-xs" title="Generate XML">XML</button>'), ue = t.from_html('<button class="btn btn-ghost btn-xs"><!></button>'), pe = t.from_html('<button class="btn btn-ghost btn-xs text-primary"><!></button>'), ve = t.from_html('<button class="btn btn-ghost btn-xs text-error"><!></button>'), _e = t.from_html('<tr><td class="font-mono font-medium"> </td><td> </td><td> </td><td class="font-mono"> </td><td><span> </span></td><td class="font-mono text-xs text-base-content/50"> </td><td><div class="flex gap-1"><!> <!> <!> <!></div></td></tr>'), be = t.from_html('<div class="card bg-base-200"><div class="overflow-x-auto"><table class="table table-sm"><thead><tr><th>Number</th><th>Date</th><th>Buyer</th><th>Total</th><th>Status</th><th>ANAF Index</th><th></th></tr></thead><tbody></tbody></table></div></div>'), ge = t.from_html('<button class="btn btn-ghost btn-xs text-error">✕</button>'), he = t.from_html('<tr><td><input type="text" class="input input-xs w-40"/></td><td><input type="number" class="input input-xs w-16"/></td><td><input type="text" class="input input-xs w-16"/></td><td><input type="number" step="0.01" class="input input-xs w-24"/></td><td><select class="select select-xs w-16"><option>0%</option><option>5%</option><option>9%</option><option>19%</option></select></td><td class="font-mono text-xs"> </td><td class="font-mono text-xs font-medium"> </td><td><!></td></tr>'), me = t.from_html('<span class="loading loading-spinner loading-sm"></span>'), fe = t.from_html('<dialog class="modal modal-open"><div class="modal-box w-11/12 max-w-4xl"><h3 class="font-bold text-lg mb-4">New Invoice</h3> <div class="grid grid-cols-2 gap-4 mb-4"><div class="form-control"><label class="label" for="invoice-number"><span class="label-text">Invoice number</span></label> <input id="invoice-number" type="text" placeholder="FAC-2026-001" class="input input-sm"/></div> <div class="form-control"><label class="label" for="invoice-currency"><span class="label-text">Currency</span></label> <select id="invoice-currency" class="select select-sm"><option>RON</option><option>EUR</option><option>USD</option></select></div> <div class="form-control"><label class="label" for="invoice-date"><span class="label-text">Invoice date</span></label> <input id="invoice-date" type="date" class="input input-sm"/></div> <div class="form-control"><label class="label" for="invoice-due-date"><span class="label-text">Due date</span></label> <input id="invoice-due-date" type="date" class="input input-sm"/></div></div> <div class="grid grid-cols-2 gap-4 mb-4"><div class="card bg-base-200 p-3"><p class="font-semibold text-sm mb-2">Seller (Emitent)</p> <div class="space-y-2"><input type="text" placeholder="Company name" class="input input-sm w-full"/> <input type="text" placeholder="CUI/CIF" class="input input-sm w-full font-mono"/> <input type="text" placeholder="Address" class="input input-sm w-full"/> <input type="text" placeholder="IBAN" class="input input-sm w-full font-mono"/></div></div> <div class="card bg-base-200 p-3"><p class="font-semibold text-sm mb-2">Buyer (Beneficiar)</p> <div class="space-y-2"><input type="text" placeholder="Company/person name" class="input input-sm w-full"/> <input type="text" placeholder="CUI/CIF (optional)" class="input input-sm w-full font-mono"/> <input type="text" placeholder="Address" class="input input-sm w-full"/></div></div></div> <div class="mb-4"><div class="flex items-center justify-between mb-2"><p class="font-semibold text-sm">Invoice lines</p> <button class="btn btn-ghost btn-xs">+ Add line</button></div> <div class="overflow-x-auto"><table class="table table-xs"><thead><tr><th>Description</th><th>Qty</th><th>Unit</th><th>Price</th><th>VAT%</th><th>VAT</th><th>Total</th><th></th></tr></thead><tbody></tbody></table></div> <div class="text-right text-sm mt-2 space-y-1"><p>Subtotal: <strong class="font-mono"> </strong></p> <p>TVA: <strong class="font-mono"> </strong></p> <p class="text-base font-bold">Total: <strong class="font-mono"> </strong></p></div></div> <div class="modal-action"><button class="btn btn-ghost">Cancel</button> <button class="btn btn-primary"><!> Create Invoice</button></div></div> <button class="modal-backdrop"></button></dialog>'), xe = t.from_html('<div class="space-y-6"><div class="flex items-center justify-between"><div><h1 class="text-2xl font-bold">e-Factura RO</h1> <p class="text-base-content/60 text-sm mt-1">Generate and submit UBL XML invoices to ANAF</p></div> <button class="btn btn-primary btn-sm gap-2"><!> New Invoice</button></div> <div class="tabs tabs-boxed w-fit"></div> <!></div> <!>', 1);
function ye(b, s) {
  t.push(s, !0);
  const p = window.__ZVELTIO_ENGINE_URL__ || "";
  let v = t.state(t.proxy([])), g = t.state(!0), m = t.state(!1), d = t.state(!1), _ = t.state("all"), a = t.proxy({
    invoice_number: "",
    invoice_date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    due_date: "",
    seller_name: "",
    seller_cui: "",
    seller_address: "",
    seller_iban: "",
    buyer_name: "",
    buyer_cui: "",
    buyer_address: "",
    currency: "RON",
    lines: [
      {
        description: "",
        quantity: 1,
        unit: "BUC",
        unit_price: 0,
        vat_rate: 19,
        vat_amount: 0,
        line_total: 0
      }
    ]
  });
  Yt(() => y());
  async function y() {
    t.set(g, !0);
    try {
      const e = t.get(_) !== "all" ? `?status=${t.get(_)}` : "", r = await (await fetch(`${p}/api/efactura${e}`, { credentials: "include" })).json();
      t.set(v, r.invoices || [], !0);
    } finally {
      t.set(g, !1);
    }
  }
  t.user_effect(() => {
    t.get(_) && y();
  });
  function R(e) {
    const i = e.quantity * e.unit_price;
    e.vat_amount = Math.round(i * (e.vat_rate / 100) * 100) / 100, e.line_total = Math.round((i + e.vat_amount) * 100) / 100;
  }
  function j() {
    a.lines = [
      ...a.lines,
      {
        description: "",
        quantity: 1,
        unit: "BUC",
        unit_price: 0,
        vat_rate: 19,
        vat_amount: 0,
        line_total: 0
      }
    ];
  }
  function et(e) {
    a.lines = a.lines.filter((i, r) => r !== e);
  }
  const $ = t.derived(() => ({
    subtotal: a.lines.reduce((e, i) => e + (i.line_total - i.vat_amount), 0),
    vat_total: a.lines.reduce((e, i) => e + i.vat_amount, 0),
    total: a.lines.reduce((e, i) => e + i.line_total, 0)
  }));
  async function at() {
    if (!(!a.invoice_number || !a.seller_name || !a.buyer_name)) {
      t.set(d, !0);
      try {
        if (!(await fetch(`${p}/api/efactura`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...a, ...t.get($) })
        })).ok) throw new Error("Failed");
        t.set(m, !1), await y();
      } catch {
        alert("Failed to create invoice");
      } finally {
        t.set(d, !1);
      }
    }
  }
  async function it(e) {
    (await fetch(`${p}/api/efactura/${e}/generate-xml`, { method: "POST", credentials: "include" })).ok && (alert("XML generated! Use Download to get the file."), await y());
  }
  async function X(e, i) {
    const r = await fetch(`${p}/api/efactura/${e}/xml`, { credentials: "include" });
    if (!r.ok) {
      alert("Generate XML first");
      return;
    }
    const f = await r.blob(), x = URL.createObjectURL(f), w = document.createElement("a");
    w.href = x, w.download = `factura_${i}.xml`, w.click(), URL.revokeObjectURL(x);
  }
  async function st(e) {
    if (!confirm("Submit this invoice to ANAF e-Factura?")) return;
    const i = await fetch(`${p}/api/efactura/${e}/submit`, { method: "POST", credentials: "include" }), r = await i.json();
    i.ok ? (alert(`Submitted! ANAF index: ${r.anaf_index}`), await y()) : alert(r.error || "Submission failed");
  }
  async function nt(e) {
    confirm("Delete this invoice?") && (await fetch(`${p}/api/efactura/${e}`, { method: "DELETE", credentials: "include" }), await y());
  }
  function Mt(e) {
    return {
      draft: "badge-warning",
      xml_generated: "badge-info",
      submitted: "badge-primary",
      accepted: "badge-success",
      rejected: "badge-error"
    }[e] || "badge-ghost";
  }
  var At = xe(), rt = t.first_child(At), lt = t.child(rt), ot = t.sibling(t.child(lt), 2), jt = t.child(ot);
  se(jt, { size: 16 }), t.next(), t.reset(ot), t.reset(lt);
  var dt = t.sibling(lt, 2);
  t.each(
    dt,
    20,
    () => [
      "all",
      "draft",
      "xml_generated",
      "submitted",
      "accepted",
      "rejected"
    ],
    t.index,
    (e, i) => {
      var r = le(), f = t.child(r, !0);
      t.reset(r), t.template_effect(
        (x) => {
          t.set_class(r, 1, `tab ${t.get(_) === i ? "tab-active" : ""}`), t.set_text(f, x);
        },
        [() => i === "all" ? "All" : i.replace("_", " ")]
      ), t.delegated("click", r, () => t.set(_, i, !0)), t.append(e, r);
    }
  ), t.reset(dt);
  var zt = t.sibling(dt, 2);
  {
    var Et = (e) => {
      var i = oe();
      t.append(e, i);
    }, Pt = (e) => {
      var i = de(), r = t.child(i);
      ie(r, { size: 48, class: "mx-auto text-base-content/20 mb-3" });
      var f = t.sibling(r, 4);
      t.reset(i), t.delegated("click", f, () => t.set(m, !0)), t.append(e, i);
    }, Bt = (e) => {
      var i = be(), r = t.child(i), f = t.child(r), x = t.sibling(t.child(f));
      t.each(x, 21, () => t.get(v), t.index, (w, l) => {
        var z = _e(), k = t.child(z), q = t.child(k, !0);
        t.reset(k);
        var I = t.sibling(k), H = t.child(I, !0);
        t.reset(I);
        var N = t.sibling(I), E = t.child(N, !0);
        t.reset(N);
        var L = t.sibling(N), P = t.child(L);
        t.reset(L);
        var M = t.sibling(L), A = t.child(M), W = t.child(A, !0);
        t.reset(A), t.reset(M);
        var C = t.sibling(M), G = t.child(C, !0);
        t.reset(C);
        var S = t.sibling(C), T = t.child(S), B = t.child(T);
        {
          var D = (c) => {
            var o = ce();
            t.delegated("click", o, () => it(t.get(l).id)), t.append(c, o);
          };
          t.if(B, (c) => {
            t.get(l).status === "draft" && c(D);
          });
        }
        var U = t.sibling(B, 2);
        {
          var ct = (c) => {
            var o = ue(), F = t.child(o);
            ae(F, { size: 12 }), t.reset(o), t.delegated("click", o, () => X(t.get(l).id, t.get(l).invoice_number)), t.append(c, o);
          };
          t.if(U, (c) => {
            (t.get(l).status === "xml_generated" || t.get(l).status === "draft") && c(ct);
          });
        }
        var O = t.sibling(U, 2);
        {
          var Z = (c) => {
            var o = pe(), F = t.child(o);
            ne(F, { size: 12 }), t.reset(o), t.delegated("click", o, () => st(t.get(l).id)), t.append(c, o);
          };
          t.if(O, (c) => {
            t.get(l).status === "xml_generated" && c(Z);
          });
        }
        var J = t.sibling(O, 2);
        {
          var Q = (c) => {
            var o = ve(), F = t.child(o);
            re(F, { size: 12 }), t.reset(o), t.delegated("click", o, () => nt(t.get(l).id)), t.append(c, o);
          };
          t.if(J, (c) => {
            t.get(l).status === "draft" && c(Q);
          });
        }
        t.reset(T), t.reset(S), t.reset(z), t.template_effect(
          (c, o) => {
            t.set_text(q, t.get(l).invoice_number), t.set_text(H, t.get(l).invoice_date), t.set_text(E, t.get(l).buyer_name), t.set_text(P, `${c ?? ""} ${t.get(l).currency ?? ""}`), t.set_class(A, 1, `badge badge-sm ${o ?? ""}`), t.set_text(W, t.get(l).status), t.set_text(G, t.get(l).anaf_index || "—");
          },
          [
            () => Number(t.get(l).total).toFixed(2),
            () => Mt(t.get(l).status)
          ]
        ), t.append(w, z);
      }), t.reset(x), t.reset(f), t.reset(r), t.reset(i), t.append(e, i);
    };
    t.if(zt, (e) => {
      t.get(g) ? e(Et) : t.get(v).length === 0 ? e(Pt, 1) : e(Bt, -1);
    });
  }
  t.reset(rt);
  var Dt = t.sibling(rt, 2);
  {
    var Vt = (e) => {
      var i = fe(), r = t.child(i), f = t.sibling(t.child(r), 2), x = t.child(f), w = t.sibling(t.child(x), 2);
      t.remove_input_defaults(w), t.reset(x);
      var l = t.sibling(x, 2), z = t.sibling(t.child(l), 2);
      t.reset(l);
      var k = t.sibling(l, 2), q = t.sibling(t.child(k), 2);
      t.remove_input_defaults(q), t.reset(k);
      var I = t.sibling(k, 2), H = t.sibling(t.child(I), 2);
      t.remove_input_defaults(H), t.reset(I), t.reset(f);
      var N = t.sibling(f, 2), E = t.child(N), L = t.sibling(t.child(E), 2), P = t.child(L);
      t.remove_input_defaults(P);
      var M = t.sibling(P, 2);
      t.remove_input_defaults(M);
      var A = t.sibling(M, 2);
      t.remove_input_defaults(A);
      var W = t.sibling(A, 2);
      t.remove_input_defaults(W), t.reset(L), t.reset(E);
      var C = t.sibling(E, 2), G = t.sibling(t.child(C), 2), S = t.child(G);
      t.remove_input_defaults(S);
      var T = t.sibling(S, 2);
      t.remove_input_defaults(T);
      var B = t.sibling(T, 2);
      t.remove_input_defaults(B), t.reset(G), t.reset(C), t.reset(N);
      var D = t.sibling(N, 2), U = t.child(D), ct = t.sibling(t.child(U), 2);
      t.reset(U);
      var O = t.sibling(U, 2), Z = t.child(O), J = t.sibling(t.child(Z));
      t.each(J, 21, () => a.lines, t.index, (n, u, pt) => {
        var vt = he(), _t = t.child(vt), Tt = t.child(_t);
        t.remove_input_defaults(Tt), t.reset(_t);
        var bt = t.sibling(_t), gt = t.child(bt);
        t.remove_input_defaults(gt), t.reset(bt);
        var ht = t.sibling(bt), Ut = t.child(ht);
        t.remove_input_defaults(Ut), t.reset(ht);
        var mt = t.sibling(ht), ft = t.child(mt);
        t.remove_input_defaults(ft), t.reset(mt);
        var xt = t.sibling(mt), Y = t.child(xt), yt = t.child(Y);
        yt.value = yt.__value = 0;
        var wt = t.sibling(yt);
        wt.value = wt.__value = 5;
        var $t = t.sibling(wt);
        $t.value = $t.__value = 9;
        var Ot = t.sibling($t);
        Ot.value = Ot.__value = 19, t.reset(Y), t.reset(xt);
        var kt = t.sibling(xt), Zt = t.child(kt, !0);
        t.reset(kt);
        var Nt = t.sibling(kt), Jt = t.child(Nt, !0);
        t.reset(Nt);
        var Rt = t.sibling(Nt), Qt = t.child(Rt);
        {
          var Kt = (h) => {
            var tt = ge();
            t.delegated("click", tt, () => et(pt)), t.append(h, tt);
          };
          t.if(Qt, (h) => {
            a.lines.length > 1 && h(Kt);
          });
        }
        t.reset(Rt), t.reset(vt), t.template_effect(
          (h, tt) => {
            t.set_text(Zt, h), t.set_text(Jt, tt);
          },
          [
            () => t.get(u).vat_amount.toFixed(2),
            () => t.get(u).line_total.toFixed(2)
          ]
        ), t.bind_value(Tt, () => t.get(u).description, (h) => t.get(u).description = h), t.delegated("input", gt, () => R(t.get(u))), t.bind_value(gt, () => t.get(u).quantity, (h) => t.get(u).quantity = h), t.bind_value(Ut, () => t.get(u).unit, (h) => t.get(u).unit = h), t.delegated("input", ft, () => R(t.get(u))), t.bind_value(ft, () => t.get(u).unit_price, (h) => t.get(u).unit_price = h), t.delegated("change", Y, () => R(t.get(u))), t.bind_select_value(Y, () => t.get(u).vat_rate, (h) => t.get(u).vat_rate = h), t.append(n, vt);
      }), t.reset(J), t.reset(Z), t.reset(O);
      var Q = t.sibling(O, 2), c = t.child(Q), o = t.sibling(t.child(c)), F = t.child(o);
      t.reset(o), t.reset(c);
      var ut = t.sibling(c, 2), Ft = t.sibling(t.child(ut)), Xt = t.child(Ft);
      t.reset(Ft), t.reset(ut);
      var It = t.sibling(ut, 2), Lt = t.sibling(t.child(It)), qt = t.child(Lt);
      t.reset(Lt), t.reset(It), t.reset(Q), t.reset(D);
      var Ct = t.sibling(D, 2), St = t.child(Ct), K = t.sibling(St, 2), Ht = t.child(K);
      {
        var Wt = (n) => {
          var u = me();
          t.append(n, u);
        };
        t.if(Ht, (n) => {
          t.get(d) && n(Wt);
        });
      }
      t.next(), t.reset(K), t.reset(Ct), t.reset(r);
      var Gt = t.sibling(r, 2);
      t.reset(i), t.template_effect(
        (n, u, pt) => {
          t.set_text(F, `${n ?? ""} ${a.currency ?? ""}`), t.set_text(Xt, `${u ?? ""} ${a.currency ?? ""}`), t.set_text(qt, `${pt ?? ""} ${a.currency ?? ""}`), K.disabled = t.get(d);
        },
        [
          () => t.get($).subtotal.toFixed(2),
          () => t.get($).vat_total.toFixed(2),
          () => t.get($).total.toFixed(2)
        ]
      ), t.bind_value(w, () => a.invoice_number, (n) => a.invoice_number = n), t.bind_select_value(z, () => a.currency, (n) => a.currency = n), t.bind_value(q, () => a.invoice_date, (n) => a.invoice_date = n), t.bind_value(H, () => a.due_date, (n) => a.due_date = n), t.bind_value(P, () => a.seller_name, (n) => a.seller_name = n), t.bind_value(M, () => a.seller_cui, (n) => a.seller_cui = n), t.bind_value(A, () => a.seller_address, (n) => a.seller_address = n), t.bind_value(W, () => a.seller_iban, (n) => a.seller_iban = n), t.bind_value(S, () => a.buyer_name, (n) => a.buyer_name = n), t.bind_value(T, () => a.buyer_cui, (n) => a.buyer_cui = n), t.bind_value(B, () => a.buyer_address, (n) => a.buyer_address = n), t.delegated("click", ct, j), t.delegated("click", St, () => t.set(m, !1)), t.delegated("click", K, at), t.delegated("click", Gt, () => t.set(m, !1)), t.append(e, i);
    };
    t.if(Dt, (e) => {
      t.get(m) && e(Vt);
    });
  }
  t.delegated("click", ot, () => t.set(m, !0)), t.append(b, At), t.pop();
}
t.delegate(["click", "input", "change"]);
function we() {
  const b = window.__zveltio;
  b && b.registerRoute({
    path: "efactura",
    component: ye,
    label: "e-Factura RO",
    icon: "Receipt",
    category: "compliance"
  });
}
we();
export {
  we as default
};
