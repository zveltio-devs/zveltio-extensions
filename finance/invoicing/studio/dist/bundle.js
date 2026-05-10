import "svelte/internal/disclose-version";
import * as t from "svelte/internal/client";
import { onMount as he } from "svelte";
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
const be = {
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
var ge = t.from_svg("<svg><!><!></svg>");
function O(c, i) {
  t.push(i, !0);
  const v = t.prop(i, "color", 3, "currentColor"), r = t.prop(i, "size", 3, 24), u = t.prop(i, "strokeWidth", 3, 2), _ = t.prop(i, "absoluteStrokeWidth", 3, !1), s = t.prop(i, "iconNode", 19, () => []), o = t.rest_props(i, [
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
  var w = ge();
  t.attribute_effect(
    w,
    (k) => ({
      ...be,
      ...o,
      width: r(),
      height: r(),
      stroke: v(),
      "stroke-width": k,
      class: [
        "lucide-icon lucide",
        i.name && `lucide-${i.name}`,
        i.class
      ]
    }),
    [
      () => _() ? Number(u()) * 24 / Number(r()) : u()
    ]
  );
  var m = t.child(w);
  t.each(m, 17, s, t.index, (k, P) => {
    var n = t.derived(() => t.to_array(t.get(P), 2));
    let j = () => t.get(n)[0], x = () => t.get(n)[1];
    var G = t.comment(), st = t.first_child(G);
    t.element(st, j, !0, (rt, lt) => {
      t.attribute_effect(rt, () => ({ ...x() }));
    }), t.append(k, G);
  });
  var $ = t.sibling(m);
  t.snippet($, () => i.children ?? t.noop), t.reset(w), t.append(c, w), t.pop();
}
function me(c, i) {
  t.push(i, !0);
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
  let v = t.rest_props(i, ["$$slots", "$$events", "$$legacy"]);
  const r = [
    ["path", { d: "M21.801 10A10 10 0 1 1 17 3.335" }],
    ["path", { d: "m9 11 3 3L22 4" }]
  ];
  O(c, t.spread_props({ name: "circle-check-big" }, () => v, {
    get iconNode() {
      return r;
    },
    children: (u, _) => {
      var s = t.comment(), o = t.first_child(s);
      t.snippet(o, () => i.children ?? t.noop), t.append(u, s);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function fe(c, i) {
  t.push(i, !0);
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
  let v = t.rest_props(i, ["$$slots", "$$events", "$$legacy"]);
  const r = [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["path", { d: "m15 9-6 6" }],
    ["path", { d: "m9 9 6 6" }]
  ];
  O(c, t.spread_props({ name: "circle-x" }, () => v, {
    get iconNode() {
      return r;
    },
    children: (u, _) => {
      var s = t.comment(), o = t.first_child(s);
      t.snippet(o, () => i.children ?? t.noop), t.append(u, s);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function xe(c, i) {
  t.push(i, !0);
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
  let v = t.rest_props(i, ["$$slots", "$$events", "$$legacy"]);
  const r = [
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
  O(c, t.spread_props({ name: "file-text" }, () => v, {
    get iconNode() {
      return r;
    },
    children: (u, _) => {
      var s = t.comment(), o = t.first_child(s);
      t.snippet(o, () => i.children ?? t.noop), t.append(u, s);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function Et(c, i) {
  t.push(i, !0);
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
  let v = t.rest_props(i, ["$$slots", "$$events", "$$legacy"]);
  const r = [["path", { d: "M5 12h14" }], ["path", { d: "M12 5v14" }]];
  O(c, t.spread_props({ name: "plus" }, () => v, {
    get iconNode() {
      return r;
    },
    children: (u, _) => {
      var s = t.comment(), o = t.first_child(s);
      t.snippet(o, () => i.children ?? t.noop), t.append(u, s);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function ye(c, i) {
  t.push(i, !0);
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
  let v = t.rest_props(i, ["$$slots", "$$events", "$$legacy"]);
  const r = [
    ["path", { d: "m21 21-4.34-4.34" }],
    ["circle", { cx: "11", cy: "11", r: "8" }]
  ];
  O(c, t.spread_props({ name: "search" }, () => v, {
    get iconNode() {
      return r;
    },
    children: (u, _) => {
      var s = t.comment(), o = t.first_child(s);
      t.snippet(o, () => i.children ?? t.noop), t.append(u, s);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function we(c, i) {
  t.push(i, !0);
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
  let v = t.rest_props(i, ["$$slots", "$$events", "$$legacy"]);
  const r = [
    [
      "path",
      {
        d: "M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"
      }
    ],
    ["path", { d: "m21.854 2.147-10.94 10.939" }]
  ];
  O(c, t.spread_props({ name: "send" }, () => v, {
    get iconNode() {
      return r;
    },
    children: (u, _) => {
      var s = t.comment(), o = t.first_child(s);
      t.snippet(o, () => i.children ?? t.noop), t.append(u, s);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function Vt(c, i) {
  t.push(i, !0);
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
  let v = t.rest_props(i, ["$$slots", "$$events", "$$legacy"]);
  const r = [
    ["path", { d: "M18 6 6 18" }],
    ["path", { d: "m6 6 12 12" }]
  ];
  O(c, t.spread_props({ name: "x" }, () => v, {
    get iconNode() {
      return r;
    },
    children: (u, _) => {
      var s = t.comment(), o = t.first_child(s);
      t.snippet(o, () => i.children ?? t.noop), t.append(u, s);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
var $e = t.from_html('<div class="alert alert-error"> </div>'), ke = t.from_html('<tr><td colspan="7" class="text-center py-6 text-base-content/60">Loading…</td></tr>'), Ne = t.from_html('<tr><td colspan="7" class="text-center py-6 text-base-content/60">No invoices yet.</td></tr>'), Se = t.from_html('<button class="btn btn-ghost btn-xs gap-1" title="Mark paid"><!></button> <button class="btn btn-ghost btn-xs gap-1" title="Cancel"><!></button>', 1), Pe = t.from_html('<tr><td class="font-mono"> </td><td> </td><td> </td><td> </td><td class="text-right"> </td><td><span> </span></td><td><!></td></tr>'), je = t.from_html("<option> </option>"), Ce = t.from_html('<select class="select select-bordered w-full"><option>— Select contact —</option><!></select>'), Te = t.from_html('<input type="text" placeholder="Client name" class="input input-bordered w-full"/>'), Me = t.from_html('<button class="btn btn-ghost btn-xs btn-square"><!></button>'), Ie = t.from_html('<tr><td><input class="input input-xs input-bordered w-full" placeholder="Description"/></td><td><input type="number" step="0.01" class="input input-xs input-bordered w-20"/></td><td><input class="input input-xs input-bordered w-16"/></td><td><input type="number" step="0.01" class="input input-xs input-bordered w-24"/></td><td><input type="number" step="0.01" class="input input-xs input-bordered w-16"/></td><td class="text-right"> </td><td><!></td></tr>'), Oe = t.from_html('<div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><div class="bg-base-100 rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto"><div class="flex items-center justify-between mb-4"><h2 class="text-xl font-semibold">New invoice</h2> <button class="btn btn-ghost btn-sm btn-square"><!></button></div> <div class="grid grid-cols-2 gap-3"><div class="col-span-2"><label class="label label-text">Client</label> <!></div> <div><label class="label label-text">Issue date</label> <input type="date" class="input input-bordered w-full"/></div> <div><label class="label label-text">Due date</label> <input type="date" class="input input-bordered w-full"/></div> <div><label class="label label-text">Currency</label> <input type="text" class="input input-bordered w-full" maxlength="3"/></div> <div><label class="label label-text">Tax rate (default %)</label> <input type="number" step="0.01" class="input input-bordered w-full"/></div></div> <div class="mt-4"><div class="flex items-center justify-between mb-2"><span class="font-medium">Lines</span> <button class="btn btn-ghost btn-xs gap-1"><!> Add line</button></div> <table class="table table-xs"><thead><tr><th>Description</th><th>Qty</th><th>Unit</th><th>Price</th><th>VAT %</th><th class="text-right">Total</th><th></th></tr></thead><tbody></tbody></table> <div class="text-right mt-2 text-lg font-semibold"> </div></div> <div class="flex justify-end gap-2 mt-6"><button class="btn btn-ghost">Cancel</button> <button class="btn btn-primary gap-2"><!> </button></div></div></div>'), qe = t.from_html('<div class="p-6 space-y-4"><header class="flex items-center justify-between"><h1 class="text-2xl font-semibold flex items-center gap-2"><!> Invoicing</h1> <button class="btn btn-primary btn-sm gap-2"><!> New invoice</button></header> <!> <div class="flex gap-3 items-center"><div class="join"><input type="text" placeholder="Search number, client..." class="input input-sm input-bordered join-item"/> <button class="btn btn-sm join-item"><!></button></div> <select class="select select-sm select-bordered"><option>All statuses</option><option>Draft</option><option>Sent</option><option>Paid</option><option>Overdue</option><option>Cancelled</option></select></div> <div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Number</th><th>Client</th><th>Issued</th><th>Due</th><th class="text-right">Total</th><th>Status</th><th></th></tr></thead><tbody><!></tbody></table></div> <div class="flex justify-between items-center text-sm text-base-content/70"><span> </span> <div class="join"><button class="btn btn-xs join-item">Prev</button> <button class="btn btn-xs join-item btn-ghost"> </button> <button class="btn btn-xs join-item">Next</button></div></div></div> <!>', 1);
function ze(c, i) {
  var Wt;
  t.push(i, !0);
  const v = ((Wt = window.__zveltio) == null ? void 0 : Wt.engineUrl) ?? "";
  let r = t.state(t.proxy([])), u = t.state(0), _ = t.state(1), s = t.state(""), o = t.state("all"), w = t.state(!1), m = t.state(""), $ = t.state(!1), k = t.state(!1), P = t.state(t.proxy([])), n = t.proxy({
    client_id: "",
    client_name: "",
    client_email: "",
    client_address: "",
    issue_date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
    due_date: new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10),
    currency: "RON",
    discount_percent: 0,
    tax_rate: 19,
    notes: "",
    lines: [
      {
        description: "",
        quantity: 1,
        unit: "buc",
        unit_price: 0,
        tax_rate: 19,
        sort_order: 0
      }
    ]
  });
  async function j(e, a) {
    const h = await fetch(`${v}${e}`, { credentials: "include", ...a }), f = await h.json().catch(() => ({}));
    if (!h.ok) throw new Error(f.error || `HTTP ${h.status}`);
    return f;
  }
  async function x() {
    var e;
    t.set(w, !0), t.set(m, "");
    try {
      const a = new URLSearchParams({ page: String(t.get(_)), limit: "20" });
      t.get(s) && a.set("search", t.get(s)), t.get(o) !== "all" && a.set("status", t.get(o));
      const h = await j(`/api/invoicing/invoices?${a}`);
      t.set(r, h.data ?? [], !0), t.set(u, ((e = h.meta) == null ? void 0 : e.total) ?? t.get(r).length, !0);
    } catch (a) {
      t.set(m, a.message, !0);
    } finally {
      t.set(w, !1);
    }
  }
  async function G() {
    try {
      const e = await j("/api/contacts?limit=200");
      t.set(
        P,
        (e.data ?? []).map((a) => ({
          id: a.id,
          label: `${a.first_name ?? ""} ${a.last_name ?? ""}`.trim() + (a.email ? ` <${a.email}>` : "")
        })),
        !0
      );
    } catch {
      t.set(P, [], !0);
    }
  }
  function st() {
    n.lines = [
      ...n.lines,
      {
        description: "",
        quantity: 1,
        unit: "buc",
        unit_price: 0,
        tax_rate: n.tax_rate,
        sort_order: n.lines.length
      }
    ];
  }
  function rt(e) {
    n.lines = n.lines.filter((a, h) => h !== e);
  }
  function lt(e) {
    return e.quantity * e.unit_price * (1 - n.discount_percent / 100) * (1 + e.tax_rate / 100);
  }
  let Jt = t.derived(() => n.lines.reduce((e, a) => e + lt(a), 0));
  async function Qt() {
    t.set(k, !0), t.set(m, "");
    try {
      await j("/api/invoicing/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(n)
      }), t.set($, !1), n.lines = [
        {
          description: "",
          quantity: 1,
          unit: "buc",
          unit_price: 0,
          tax_rate: n.tax_rate,
          sort_order: 0
        }
      ], n.client_name = "", n.client_id = "", await x();
    } catch (e) {
      t.set(m, e.message, !0);
    } finally {
      t.set(k, !1);
    }
  }
  async function Xt(e) {
    try {
      await j(`/api/invoicing/invoices/${e}/mark-paid`, { method: "POST" }), await x();
    } catch (a) {
      t.set(m, a.message, !0);
    }
  }
  async function Zt(e) {
    if (confirm("Cancel invoice?"))
      try {
        await j(`/api/invoicing/invoices/${e}/cancel`, { method: "POST" }), await x();
      } catch (a) {
        t.set(m, a.message, !0);
      }
  }
  he(() => {
    x(), G();
  }), t.user_effect(() => {
    t.get(_), t.get(o), x();
  });
  function dt(e, a) {
    return new Intl.NumberFormat("ro-RO", { style: "currency", currency: a || "RON" }).format(e);
  }
  function Gt(e) {
    return {
      draft: "badge-ghost",
      sent: "badge-info",
      paid: "badge-success",
      overdue: "badge-error",
      cancelled: "badge-warning"
    }[e] ?? "badge-ghost";
  }
  var Tt = qe(), ot = t.first_child(Tt), ct = t.child(ot), ut = t.child(ct), Kt = t.child(ut);
  xe(Kt, { class: "h-6 w-6" }), t.next(), t.reset(ut);
  var pt = t.sibling(ut, 2), Yt = t.child(pt);
  Et(Yt, { class: "h-4 w-4" }), t.next(), t.reset(pt), t.reset(ct);
  var Mt = t.sibling(ct, 2);
  {
    var te = (e) => {
      var a = $e(), h = t.child(a, !0);
      t.reset(a), t.template_effect(() => t.set_text(h, t.get(m))), t.append(e, a);
    };
    t.if(Mt, (e) => {
      t.get(m) && e(te);
    });
  }
  var vt = t.sibling(Mt, 2), _t = t.child(vt), K = t.child(_t);
  t.remove_input_defaults(K);
  var ht = t.sibling(K, 2), ee = t.child(ht);
  ye(ee, { class: "h-4 w-4" }), t.reset(ht), t.reset(_t);
  var bt = t.sibling(_t, 2), gt = t.child(bt);
  gt.value = gt.__value = "all";
  var mt = t.sibling(gt);
  mt.value = mt.__value = "draft";
  var ft = t.sibling(mt);
  ft.value = ft.__value = "sent";
  var xt = t.sibling(ft);
  xt.value = xt.__value = "paid";
  var yt = t.sibling(xt);
  yt.value = yt.__value = "overdue";
  var It = t.sibling(yt);
  It.value = It.__value = "cancelled", t.reset(bt), t.reset(vt);
  var wt = t.sibling(vt, 2), Ot = t.child(wt), qt = t.sibling(t.child(Ot)), ie = t.child(qt);
  {
    var ae = (e) => {
      var a = ke();
      t.append(e, a);
    }, ne = (e) => {
      var a = Ne();
      t.append(e, a);
    }, se = (e) => {
      var a = t.comment(), h = t.first_child(a);
      t.each(h, 17, () => t.get(r), (f) => f.id, (f, p) => {
        var F = Pe(), C = t.child(F), H = t.child(C, !0);
        t.reset(C);
        var R = t.sibling(C), St = t.child(R);
        t.reset(R);
        var U = t.sibling(R), B = t.child(U, !0);
        t.reset(U);
        var q = t.sibling(U), E = t.child(q, !0);
        t.reset(q);
        var z = t.sibling(q), V = t.child(z, !0);
        t.reset(z);
        var D = t.sibling(z), L = t.child(D), Y = t.child(L, !0);
        t.reset(L), t.reset(D);
        var W = t.sibling(D), J = t.child(W);
        {
          var Q = (T) => {
            var N = Se(), M = t.first_child(N), tt = t.child(M);
            me(tt, { class: "h-3.5 w-3.5" }), t.reset(M);
            var X = t.sibling(M, 2), et = t.child(X);
            fe(et, { class: "h-3.5 w-3.5" }), t.reset(X), t.delegated("click", M, () => Xt(t.get(p).id)), t.delegated("click", X, () => Zt(t.get(p).id)), t.append(T, N);
          };
          t.if(J, (T) => {
            t.get(p).status !== "paid" && t.get(p).status !== "cancelled" && T(Q);
          });
        }
        t.reset(W), t.reset(F), t.template_effect(
          (T, N) => {
            t.set_text(H, t.get(p).number), t.set_text(St, `${t.get(p).client_name ?? ""}${t.get(p).client_email ? ` <${t.get(p).client_email}>` : ""}`), t.set_text(B, t.get(p).issue_date), t.set_text(E, t.get(p).due_date), t.set_text(V, T), t.set_class(L, 1, `badge ${N ?? ""} badge-sm`), t.set_text(Y, t.get(p).status);
          },
          [
            () => dt(Number(t.get(p).total), t.get(p).currency),
            () => Gt(t.get(p).status)
          ]
        ), t.append(f, F);
      }), t.append(e, a);
    };
    t.if(ie, (e) => {
      t.get(w) ? e(ae) : t.get(r).length === 0 ? e(ne, 1) : e(se, -1);
    });
  }
  t.reset(qt), t.reset(Ot), t.reset(wt);
  var zt = t.sibling(wt, 2), $t = t.child(zt), re = t.child($t);
  t.reset($t);
  var Dt = t.sibling($t, 2), kt = t.child(Dt), Nt = t.sibling(kt, 2), le = t.child(Nt);
  t.reset(Nt);
  var Lt = t.sibling(Nt, 2);
  t.reset(Dt), t.reset(zt), t.reset(ot);
  var de = t.sibling(ot, 2);
  {
    var oe = (e) => {
      var a = Oe(), h = t.child(a), f = t.child(h), p = t.sibling(t.child(f), 2), F = t.child(p);
      Vt(F, { class: "h-4 w-4" }), t.reset(p), t.reset(f);
      var C = t.sibling(f, 2), H = t.child(C), R = t.sibling(t.child(H), 2);
      {
        var St = (l) => {
          var d = Ce(), I = t.child(d);
          I.value = I.__value = "";
          var Z = t.sibling(I);
          t.each(Z, 17, () => t.get(P), (g) => g.id, (g, S) => {
            var y = je(), at = t.child(y, !0);
            t.reset(y);
            var A = {};
            t.template_effect(() => {
              t.set_text(at, t.get(S).label), A !== (A = t.get(S).id) && (y.value = (y.__value = t.get(S).id) ?? "");
            }), t.append(g, y);
          }), t.reset(d), t.delegated("change", d, () => {
            const g = t.get(P).find((S) => S.id === n.client_id);
            g && (n.client_name = g.label.split(" <")[0]);
          }), t.bind_select_value(d, () => n.client_id, (g) => n.client_id = g), t.append(l, d);
        }, U = (l) => {
          var d = Te();
          t.remove_input_defaults(d), t.bind_value(d, () => n.client_name, (I) => n.client_name = I), t.append(l, d);
        };
        t.if(R, (l) => {
          t.get(P).length > 0 ? l(St) : l(U, -1);
        });
      }
      t.reset(H);
      var B = t.sibling(H, 2), q = t.sibling(t.child(B), 2);
      t.remove_input_defaults(q), t.reset(B);
      var E = t.sibling(B, 2), z = t.sibling(t.child(E), 2);
      t.remove_input_defaults(z), t.reset(E);
      var V = t.sibling(E, 2), D = t.sibling(t.child(V), 2);
      t.remove_input_defaults(D), t.reset(V);
      var L = t.sibling(V, 2), Y = t.sibling(t.child(L), 2);
      t.remove_input_defaults(Y), t.reset(L), t.reset(C);
      var W = t.sibling(C, 2), J = t.child(W), Q = t.sibling(t.child(J), 2), T = t.child(Q);
      Et(T, { class: "h-3 w-3" }), t.next(), t.reset(Q), t.reset(J);
      var N = t.sibling(J, 2), M = t.sibling(t.child(N));
      t.each(M, 21, () => n.lines, t.index, (l, d, I) => {
        var Z = Ie(), g = t.child(Z), S = t.child(g);
        t.remove_input_defaults(S), t.reset(g);
        var y = t.sibling(g), at = t.child(y);
        t.remove_input_defaults(at), t.reset(y);
        var A = t.sibling(y), Ht = t.child(A);
        t.remove_input_defaults(Ht), t.reset(A);
        var Pt = t.sibling(A), Rt = t.child(Pt);
        t.remove_input_defaults(Rt), t.reset(Pt);
        var jt = t.sibling(Pt), Ut = t.child(jt);
        t.remove_input_defaults(Ut), t.reset(jt);
        var Ct = t.sibling(jt), ue = t.child(Ct, !0);
        t.reset(Ct);
        var Bt = t.sibling(Ct), pe = t.child(Bt);
        {
          var ve = (b) => {
            var nt = Me(), _e = t.child(nt);
            Vt(_e, { class: "h-3 w-3" }), t.reset(nt), t.delegated("click", nt, () => rt(I)), t.append(b, nt);
          };
          t.if(pe, (b) => {
            n.lines.length > 1 && b(ve);
          });
        }
        t.reset(Bt), t.reset(Z), t.template_effect((b) => t.set_text(ue, b), [() => dt(lt(t.get(d)), n.currency)]), t.bind_value(S, () => t.get(d).description, (b) => t.get(d).description = b), t.bind_value(at, () => t.get(d).quantity, (b) => t.get(d).quantity = b), t.bind_value(Ht, () => t.get(d).unit, (b) => t.get(d).unit = b), t.bind_value(Rt, () => t.get(d).unit_price, (b) => t.get(d).unit_price = b), t.bind_value(Ut, () => t.get(d).tax_rate, (b) => t.get(d).tax_rate = b), t.append(l, Z);
      }), t.reset(M), t.reset(N);
      var tt = t.sibling(N, 2), X = t.child(tt);
      t.reset(tt), t.reset(W);
      var et = t.sibling(W, 2), At = t.child(et), it = t.sibling(At, 2), Ft = t.child(it);
      we(Ft, { class: "h-4 w-4" });
      var ce = t.sibling(Ft);
      t.reset(it), t.reset(et), t.reset(h), t.reset(a), t.template_effect(
        (l, d) => {
          t.set_text(X, `Total: ${l ?? ""}`), it.disabled = d, t.set_text(ce, ` ${t.get(k) ? "Saving…" : "Create invoice"}`);
        },
        [
          () => dt(t.get(Jt), n.currency),
          () => t.get(k) || !n.client_name || n.lines.some((l) => !l.description)
        ]
      ), t.delegated("click", a, (l) => l.target === l.currentTarget && t.set($, !1)), t.delegated("click", p, () => t.set($, !1)), t.bind_value(q, () => n.issue_date, (l) => n.issue_date = l), t.bind_value(z, () => n.due_date, (l) => n.due_date = l), t.bind_value(D, () => n.currency, (l) => n.currency = l), t.bind_value(Y, () => n.tax_rate, (l) => n.tax_rate = l), t.delegated("click", Q, st), t.delegated("click", At, () => t.set($, !1)), t.delegated("click", it, Qt), t.append(e, a);
    };
    t.if(de, (e) => {
      t.get($) && e(oe);
    });
  }
  t.template_effect(() => {
    t.set_text(re, `${t.get(u) ?? ""} invoices`), kt.disabled = t.get(_) <= 1, t.set_text(le, `Page ${t.get(_) ?? ""}`), Lt.disabled = t.get(r).length < 20;
  }), t.delegated("click", pt, () => t.set($, !0)), t.delegated("keydown", K, (e) => e.key === "Enter" && x()), t.bind_value(K, () => t.get(s), (e) => t.set(s, e)), t.delegated("click", ht, x), t.bind_select_value(bt, () => t.get(o), (e) => t.set(o, e)), t.delegated("click", kt, () => t.update(_, -1)), t.delegated("click", Lt, () => t.update(_)), t.append(c, Tt), t.pop();
}
t.delegate(["click", "keydown", "change"]);
function De() {
  const c = window.__zveltio;
  c && c.registerRoute({
    path: "invoicing",
    component: ze,
    label: "Invoicing",
    icon: "FileText",
    category: "finance"
  });
}
De();
export {
  De as default
};
