import "svelte/internal/disclose-version";
import * as t from "svelte/internal/client";
import { onMount as ie } from "svelte";
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
const ne = {
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
var le = t.from_svg("<svg><!><!></svg>");
function Y(b, s) {
  t.push(s, !0);
  const y = t.prop(s, "color", 3, "currentColor"), i = t.prop(s, "size", 3, 24), h = t.prop(s, "strokeWidth", 3, 2), z = t.prop(s, "absoluteStrokeWidth", 3, !1), l = t.prop(s, "iconNode", 19, () => []), d = t.rest_props(s, [
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
  var O = le();
  t.attribute_effect(
    O,
    (v) => ({
      ...ne,
      ...d,
      width: i(),
      height: i(),
      stroke: y(),
      "stroke-width": v,
      class: [
        "lucide-icon lucide",
        s.name && `lucide-${s.name}`,
        s.class
      ]
    }),
    [
      () => z() ? Number(h()) * 24 / Number(i()) : h()
    ]
  );
  var W = t.child(O);
  t.each(W, 17, l, t.index, (v, k) => {
    var R = t.derived(() => t.to_array(t.get(k), 2));
    let H = () => t.get(R)[0], V = () => t.get(R)[1];
    var Z = t.comment(), st = t.first_child(Z);
    t.element(st, H, !0, (q, mt) => {
      t.attribute_effect(q, () => ({ ...V() }));
    }), t.append(v, Z);
  });
  var F = t.sibling(W);
  t.snippet(F, () => s.children ?? t.noop), t.reset(O), t.append(b, O), t.pop();
}
function de(b, s) {
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
  let y = t.rest_props(s, ["$$slots", "$$events", "$$legacy"]);
  const i = [
    ["path", { d: "M12 7v14" }],
    [
      "path",
      {
        d: "M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"
      }
    ]
  ];
  Y(b, t.spread_props({ name: "book-open" }, () => y, {
    get iconNode() {
      return i;
    },
    children: (h, z) => {
      var l = t.comment(), d = t.first_child(l);
      t.snippet(d, () => s.children ?? t.noop), t.append(h, l);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function oe(b, s) {
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
  let y = t.rest_props(s, ["$$slots", "$$events", "$$legacy"]);
  const i = [
    [
      "rect",
      { width: "16", height: "20", x: "4", y: "2", rx: "2" }
    ],
    ["line", { x1: "8", x2: "16", y1: "6", y2: "6" }],
    ["line", { x1: "16", x2: "16", y1: "14", y2: "18" }],
    ["path", { d: "M16 10h.01" }],
    ["path", { d: "M12 10h.01" }],
    ["path", { d: "M8 10h.01" }],
    ["path", { d: "M12 14h.01" }],
    ["path", { d: "M8 14h.01" }],
    ["path", { d: "M12 18h.01" }],
    ["path", { d: "M8 18h.01" }]
  ];
  Y(b, t.spread_props({ name: "calculator" }, () => y, {
    get iconNode() {
      return i;
    },
    children: (h, z) => {
      var l = t.comment(), d = t.first_child(l);
      t.snippet(d, () => s.children ?? t.noop), t.append(h, l);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function ce(b, s) {
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
  let y = t.rest_props(s, ["$$slots", "$$events", "$$legacy"]);
  const i = [
    ["circle", { cx: "8", cy: "8", r: "6" }],
    ["path", { d: "M18.09 10.37A6 6 0 1 1 10.34 18" }],
    ["path", { d: "M7 6h1v4" }],
    ["path", { d: "m16.71 13.88.7.71-2.82 2.82" }]
  ];
  Y(b, t.spread_props({ name: "coins" }, () => y, {
    get iconNode() {
      return i;
    },
    children: (h, z) => {
      var l = t.comment(), d = t.first_child(l);
      t.snippet(d, () => s.children ?? t.noop), t.append(h, l);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function gt(b, s) {
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
  let y = t.rest_props(s, ["$$slots", "$$events", "$$legacy"]);
  const i = [["path", { d: "M5 12h14" }], ["path", { d: "M12 5v14" }]];
  Y(b, t.spread_props({ name: "plus" }, () => y, {
    get iconNode() {
      return i;
    },
    children: (h, z) => {
      var l = t.comment(), d = t.first_child(l);
      t.snippet(d, () => s.children ?? t.noop), t.append(h, l);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function ve(b, s) {
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
  let y = t.rest_props(s, ["$$slots", "$$events", "$$legacy"]);
  const i = [
    ["path", { d: "M16 7h6v6" }],
    ["path", { d: "m22 7-8.5 8.5-5-5L2 17" }]
  ];
  Y(b, t.spread_props({ name: "trending-up" }, () => y, {
    get iconNode() {
      return i;
    },
    children: (h, z) => {
      var l = t.comment(), d = t.first_child(l);
      t.snippet(d, () => s.children ?? t.noop), t.append(h, l);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function ft(b, s) {
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
  let y = t.rest_props(s, ["$$slots", "$$events", "$$legacy"]);
  const i = [
    ["path", { d: "M18 6 6 18" }],
    ["path", { d: "m6 6 12 12" }]
  ];
  Y(b, t.spread_props({ name: "x" }, () => y, {
    get iconNode() {
      return i;
    },
    children: (h, z) => {
      var l = t.comment(), d = t.first_child(l);
      t.snippet(d, () => s.children ?? t.noop), t.append(h, l);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
var ue = t.from_html('<button class="btn btn-primary btn-sm gap-2"><!> New entry</button>'), pe = t.from_html('<button class="btn btn-primary btn-sm gap-2"><!> New account</button>'), _e = t.from_html('<div class="alert alert-error"> </div>'), be = t.from_html('<tr><td colspan="6" class="text-center py-6 text-base-content/60">No journal entries.</td></tr>'), he = t.from_html('<tr><td> </td><td class="font-mono text-xs"> </td><td> </td><td class="text-right"> </td><td class="text-right"> </td><td><span class="badge badge-sm"> </span></td></tr>'), ge = t.from_html('<div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Date</th><th>Doc #</th><th>Description</th><th class="text-right">Debit</th><th class="text-right">Credit</th><th>Status</th></tr></thead><tbody><!></tbody></table></div>'), fe = t.from_html('<tr><td colspan="4" class="text-center py-6 text-base-content/60">No accounts. Create one to start.</td></tr>'), me = t.from_html('<tr><td class="font-mono"> </td><td> </td><td><span class="badge badge-ghost badge-sm"> </span></td><td class="font-mono text-xs"> </td></tr>'), xe = t.from_html('<div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Code</th><th>Name</th><th>Type</th><th>Parent</th></tr></thead><tbody><!></tbody></table></div>'), ye = t.from_html('<tr><td colspan="4" class="text-center py-6 text-base-content/60">No fiscal years.</td></tr>'), we = t.from_html('<tr><td> </td><td> </td><td> </td><td><span class="badge badge-sm"> </span></td></tr>'), Ne = t.from_html('<div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Year</th><th>Start</th><th>End</th><th>Status</th></tr></thead><tbody><!></tbody></table></div>'), ke = t.from_html("<option> </option>"), $e = t.from_html('<button class="btn btn-ghost btn-xs btn-square"><!></button>'), Me = t.from_html('<tr><td><select class="select select-xs select-bordered w-32"><option>—</option><!></select></td><td><input class="input input-xs input-bordered w-full" placeholder="Description"/></td><td><input type="number" step="0.01" class="input input-xs input-bordered w-24 text-right"/></td><td><input type="number" step="0.01" class="input input-xs input-bordered w-24 text-right"/></td><td><!></td></tr>'), je = t.from_html('<span class="text-error text-xs"> </span>'), Ce = t.from_html('<div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><div class="bg-base-100 rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto"><div class="flex items-center justify-between mb-4"><h2 class="text-xl font-semibold">New journal entry</h2> <button class="btn btn-ghost btn-sm btn-square"><!></button></div> <div class="grid grid-cols-2 gap-3"><div><label class="label label-text">Date</label><input type="date" class="input input-bordered w-full"/></div> <div><label class="label label-text">Document #</label><input class="input input-bordered w-full"/></div> <div class="col-span-2"><label class="label label-text">Description</label><input class="input input-bordered w-full"/></div></div> <div class="mt-4"><div class="flex items-center justify-between mb-2"><span class="font-medium">Lines</span><button class="btn btn-ghost btn-xs gap-1"><!> Add line</button></div> <table class="table table-xs"><thead><tr><th>Account</th><th>Description</th><th class="text-right">Debit</th><th class="text-right">Credit</th><th></th></tr></thead><tbody></tbody><tfoot><tr class="font-medium"><td colspan="2" class="text-right">Totals</td><td class="text-right"> </td><td class="text-right"> </td><td><!></td></tr></tfoot></table></div> <div class="flex justify-end gap-2 mt-6"><button class="btn btn-ghost">Cancel</button> <button class="btn btn-primary"> </button></div></div></div>'), Se = t.from_html('<div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><div class="bg-base-100 rounded-xl p-6 w-full max-w-md"><div class="flex items-center justify-between mb-4"><h2 class="text-xl font-semibold">New account</h2> <button class="btn btn-ghost btn-sm btn-square"><!></button></div> <div class="space-y-3"><div><label class="label label-text">Code (e.g. 4111)</label><input class="input input-bordered w-full font-mono"/></div> <div><label class="label label-text">Name</label><input class="input input-bordered w-full"/></div> <div><label class="label label-text">Type</label><select class="select select-bordered w-full"><option>Asset</option><option>Liability</option><option>Equity</option><option>Revenue</option><option>Expense</option></select></div> <div><label class="label label-text">Parent code (optional)</label><input class="input input-bordered w-full font-mono"/></div></div> <div class="flex justify-end gap-2 mt-4"><button class="btn btn-ghost">Cancel</button> <button class="btn btn-primary"> </button></div></div></div>'), Pe = t.from_html('<div class="p-6 space-y-4"><header class="flex items-center justify-between"><h1 class="text-2xl font-semibold flex items-center gap-2"><!> Accounting</h1> <div class="flex gap-2"><!> <!></div></header> <!> <div role="tablist" class="tabs tabs-bordered"><button role="tab"><!> Journal entries</button> <button role="tab"><!> Chart of accounts</button> <button role="tab"><!> Fiscal years</button></div> <!></div> <!> <!>', 1);
function De(b, s) {
  var Ct;
  t.push(s, !0);
  const y = ((Ct = window.__zveltio) == null ? void 0 : Ct.engineUrl) ?? "";
  let i = t.state("entries"), h = t.state(t.proxy([])), z = t.state(t.proxy([])), l = t.state(t.proxy([])), d = t.state(""), O = t.state(!1), W = t.state(!1), F = t.state(!1), v = t.state(t.proxy({
    entry_date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
    description: "",
    document_number: "",
    lines: [
      { account_code: "", description: "", debit: 0, credit: 0 },
      { account_code: "", description: "", debit: 0, credit: 0 }
    ]
  })), k = t.state(t.proxy({ code: "", name: "", account_type: "asset", parent_code: "" }));
  async function R(e, a) {
    const r = await fetch(`${y}${e}`, { credentials: "include", ...a }), o = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(o.error || `HTTP ${r.status}`);
    return o;
  }
  async function H() {
    try {
      const e = await R("/api/accounting/journal-entries?limit=100");
      t.set(h, e.data ?? [], !0);
    } catch (e) {
      t.set(d, e.message, !0);
    }
  }
  async function V() {
    try {
      const e = await R("/api/accounting/accounts");
      t.set(z, e.data ?? [], !0);
    } catch (e) {
      t.set(d, e.message, !0);
    }
  }
  async function Z() {
    try {
      const e = await R("/api/accounting/fiscal-years");
      t.set(l, e.data ?? [], !0);
    } catch (e) {
      t.set(d, e.message, !0);
    }
  }
  function st() {
    const e = t.get(v).lines.reduce((r, o) => r + (Number(o.debit) || 0), 0), a = t.get(v).lines.reduce((r, o) => r + (Number(o.credit) || 0), 0);
    return { debit: e, credit: a, balanced: Math.abs(e - a) < 5e-3 };
  }
  let q = t.derived(st);
  function mt() {
    t.get(v).lines = [
      ...t.get(v).lines,
      { account_code: "", description: "", debit: 0, credit: 0 }
    ];
  }
  function Et(e) {
    t.get(v).lines = t.get(v).lines.filter((a, r) => r !== e);
  }
  async function Ft() {
    t.set(F, !0), t.set(d, "");
    try {
      await R("/api/accounting/journal-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(t.get(v))
      }), t.set(O, !1), t.set(
        v,
        {
          entry_date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
          description: "",
          document_number: "",
          lines: [
            { account_code: "", description: "", debit: 0, credit: 0 },
            { account_code: "", description: "", debit: 0, credit: 0 }
          ]
        },
        !0
      ), await H();
    } catch (e) {
      t.set(d, e.message, !0);
    } finally {
      t.set(F, !1);
    }
  }
  async function Wt() {
    t.set(F, !0), t.set(d, "");
    try {
      await R("/api/accounting/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(t.get(k))
      }), t.set(W, !1), t.set(k, { code: "", name: "", account_type: "asset", parent_code: "" }, !0), await V();
    } catch (e) {
      t.set(d, e.message, !0);
    } finally {
      t.set(F, !1);
    }
  }
  t.user_effect(() => {
    t.get(i) === "entries" ? H() : t.get(i) === "accounts" ? V() : Z();
  }), ie(() => {
    H(), V();
  });
  function X(e, a = "RON") {
    return new Intl.NumberFormat("ro-RO", { style: "currency", currency: a }).format(e);
  }
  var xt = Pe(), rt = t.first_child(xt), it = t.child(rt), nt = t.child(it), qt = t.child(nt);
  oe(qt, { class: "h-6 w-6" }), t.next(), t.reset(nt);
  var yt = t.sibling(nt, 2), wt = t.child(yt);
  {
    var Lt = (e) => {
      var a = ue(), r = t.child(a);
      gt(r, { class: "h-4 w-4" }), t.next(), t.reset(a), t.delegated("click", a, () => t.set(O, !0)), t.append(e, a);
    };
    t.if(wt, (e) => {
      t.get(i) === "entries" && e(Lt);
    });
  }
  var It = t.sibling(wt, 2);
  {
    var Rt = (e) => {
      var a = pe(), r = t.child(a);
      gt(r, { class: "h-4 w-4" }), t.next(), t.reset(a), t.delegated("click", a, () => t.set(W, !0)), t.append(e, a);
    };
    t.if(It, (e) => {
      t.get(i) === "accounts" && e(Rt);
    });
  }
  t.reset(yt), t.reset(it);
  var Nt = t.sibling(it, 2);
  {
    var Jt = (e) => {
      var a = _e(), r = t.child(a, !0);
      t.reset(a), t.template_effect(() => t.set_text(r, t.get(d))), t.append(e, a);
    };
    t.if(Nt, (e) => {
      t.get(d) && e(Jt);
    });
  }
  var lt = t.sibling(Nt, 2), G = t.child(lt);
  let kt;
  var Bt = t.child(G);
  de(Bt, { class: "h-4 w-4" }), t.next(), t.reset(G);
  var K = t.sibling(G, 2);
  let $t;
  var Ut = t.child(K);
  ce(Ut, { class: "h-4 w-4" }), t.next(), t.reset(K);
  var tt = t.sibling(K, 2);
  let Mt;
  var Yt = t.child(tt);
  ve(Yt, { class: "h-4 w-4" }), t.next(), t.reset(tt), t.reset(lt);
  var Ht = t.sibling(lt, 2);
  {
    var Vt = (e) => {
      var a = ge(), r = t.child(a), o = t.sibling(t.child(r)), C = t.child(o);
      {
        var L = (n) => {
          var u = be();
          t.append(n, u);
        }, S = (n) => {
          var u = t.comment(), P = t.first_child(u);
          t.each(P, 17, () => t.get(h), (f) => f.id, (f, c) => {
            var g = he(), p = t.child(g), D = t.child(p, !0);
            t.reset(p);
            var _ = t.sibling(p), E = t.child(_, !0);
            t.reset(_);
            var m = t.sibling(_), T = t.child(m, !0);
            t.reset(m);
            var $ = t.sibling(m), A = t.child($, !0);
            t.reset($);
            var M = t.sibling($), J = t.child(M, !0);
            t.reset(M);
            var B = t.sibling(M), w = t.child(B), et = t.child(w, !0);
            t.reset(w), t.reset(B), t.reset(g), t.template_effect(
              (dt, ot) => {
                t.set_text(D, t.get(c).entry_date), t.set_text(E, t.get(c).document_number ?? "—"), t.set_text(T, t.get(c).description), t.set_text(A, dt), t.set_text(J, ot), t.set_text(et, t.get(c).status ?? "posted");
              },
              [
                () => X(Number(t.get(c).total_debit ?? 0)),
                () => X(Number(t.get(c).total_credit ?? 0))
              ]
            ), t.append(f, g);
          }), t.append(n, u);
        };
        t.if(C, (n) => {
          t.get(h).length === 0 ? n(L) : n(S, -1);
        });
      }
      t.reset(o), t.reset(r), t.reset(a), t.append(e, a);
    }, Xt = (e) => {
      var a = xe(), r = t.child(a), o = t.sibling(t.child(r)), C = t.child(o);
      {
        var L = (n) => {
          var u = fe();
          t.append(n, u);
        }, S = (n) => {
          var u = t.comment(), P = t.first_child(u);
          t.each(P, 17, () => t.get(z), (f) => f.code, (f, c) => {
            var g = me(), p = t.child(g), D = t.child(p, !0);
            t.reset(p);
            var _ = t.sibling(p), E = t.child(_, !0);
            t.reset(_);
            var m = t.sibling(_), T = t.child(m), $ = t.child(T, !0);
            t.reset(T), t.reset(m);
            var A = t.sibling(m), M = t.child(A, !0);
            t.reset(A), t.reset(g), t.template_effect(() => {
              t.set_text(D, t.get(c).code), t.set_text(E, t.get(c).name), t.set_text($, t.get(c).account_type), t.set_text(M, t.get(c).parent_code ?? "—");
            }), t.append(f, g);
          }), t.append(n, u);
        };
        t.if(C, (n) => {
          t.get(z).length === 0 ? n(L) : n(S, -1);
        });
      }
      t.reset(o), t.reset(r), t.reset(a), t.append(e, a);
    }, Gt = (e) => {
      var a = Ne(), r = t.child(a), o = t.sibling(t.child(r)), C = t.child(o);
      {
        var L = (n) => {
          var u = ye();
          t.append(n, u);
        }, S = (n) => {
          var u = t.comment(), P = t.first_child(u);
          t.each(P, 17, () => t.get(l), (f) => f.id, (f, c) => {
            var g = we(), p = t.child(g), D = t.child(p, !0);
            t.reset(p);
            var _ = t.sibling(p), E = t.child(_, !0);
            t.reset(_);
            var m = t.sibling(_), T = t.child(m, !0);
            t.reset(m);
            var $ = t.sibling(m), A = t.child($), M = t.child(A, !0);
            t.reset(A), t.reset($), t.reset(g), t.template_effect(() => {
              t.set_text(D, t.get(c).name), t.set_text(E, t.get(c).start_date), t.set_text(T, t.get(c).end_date), t.set_text(M, t.get(c).is_closed ? "closed" : "open");
            }), t.append(f, g);
          }), t.append(n, u);
        };
        t.if(C, (n) => {
          t.get(l).length === 0 ? n(L) : n(S, -1);
        });
      }
      t.reset(o), t.reset(r), t.reset(a), t.append(e, a);
    };
    t.if(Ht, (e) => {
      t.get(i) === "entries" ? e(Vt) : t.get(i) === "accounts" ? e(Xt, 1) : e(Gt, -1);
    });
  }
  t.reset(rt);
  var jt = t.sibling(rt, 2);
  {
    var Kt = (e) => {
      var a = Ce(), r = t.child(a), o = t.child(r), C = t.sibling(t.child(o), 2), L = t.child(C);
      ft(L, { class: "h-4 w-4" }), t.reset(C), t.reset(o);
      var S = t.sibling(o, 2), n = t.child(S), u = t.sibling(t.child(n));
      t.remove_input_defaults(u), t.reset(n);
      var P = t.sibling(n, 2), f = t.sibling(t.child(P));
      t.remove_input_defaults(f), t.reset(P);
      var c = t.sibling(P, 2), g = t.sibling(t.child(c));
      t.remove_input_defaults(g), t.reset(c), t.reset(S);
      var p = t.sibling(S, 2), D = t.child(p), _ = t.sibling(t.child(D)), E = t.child(_);
      gt(E, { class: "h-3 w-3" }), t.next(), t.reset(_), t.reset(D);
      var m = t.sibling(D, 2), T = t.sibling(t.child(m));
      t.each(T, 21, () => t.get(v).lines, t.index, (x, j, ct) => {
        var Q = Me(), vt = t.child(Q), ut = t.child(vt), pt = t.child(ut);
        pt.value = pt.__value = "";
        var ee = t.sibling(pt);
        t.each(ee, 17, () => t.get(z), (N) => N.code, (N, I) => {
          var U = ke(), re = t.child(U);
          t.reset(U);
          var Ot = {};
          t.template_effect(() => {
            t.set_text(re, `${t.get(I).code ?? ""} ${t.get(I).name ?? ""}`), Ot !== (Ot = t.get(I).code) && (U.value = (U.__value = t.get(I).code) ?? "");
          }), t.append(N, U);
        }), t.reset(ut), t.reset(vt);
        var _t = t.sibling(vt), Dt = t.child(_t);
        t.remove_input_defaults(Dt), t.reset(_t);
        var bt = t.sibling(_t), Tt = t.child(bt);
        t.remove_input_defaults(Tt), t.reset(bt);
        var ht = t.sibling(bt), At = t.child(ht);
        t.remove_input_defaults(At), t.reset(ht);
        var zt = t.sibling(ht), ae = t.child(zt);
        {
          var se = (N) => {
            var I = $e(), U = t.child(I);
            ft(U, { class: "h-3 w-3" }), t.reset(I), t.delegated("click", I, () => Et(ct)), t.append(N, I);
          };
          t.if(ae, (N) => {
            t.get(v).lines.length > 2 && N(se);
          });
        }
        t.reset(zt), t.reset(Q), t.bind_select_value(ut, () => t.get(j).account_code, (N) => t.get(j).account_code = N), t.bind_value(Dt, () => t.get(j).description, (N) => t.get(j).description = N), t.bind_value(Tt, () => t.get(j).debit, (N) => t.get(j).debit = N), t.bind_value(At, () => t.get(j).credit, (N) => t.get(j).credit = N), t.append(x, Q);
      }), t.reset(T);
      var $ = t.sibling(T), A = t.child($), M = t.sibling(t.child(A)), J = t.child(M, !0);
      t.reset(M);
      var B = t.sibling(M), w = t.child(B, !0);
      t.reset(B);
      var et = t.sibling(B), dt = t.child(et);
      {
        var ot = (x) => {
          var j = je(), ct = t.child(j);
          t.reset(j), t.template_effect((Q) => t.set_text(ct, `Off by ${Q ?? ""}`), [
            () => X(Math.abs(t.get(q).debit - t.get(q).credit))
          ]), t.append(x, j);
        };
        t.if(dt, (x) => {
          t.get(q).balanced || x(ot);
        });
      }
      t.reset(et), t.reset(A), t.reset($), t.reset(m), t.reset(p);
      var St = t.sibling(p, 2), Pt = t.child(St), at = t.sibling(Pt, 2), te = t.child(at, !0);
      t.reset(at), t.reset(St), t.reset(r), t.reset(a), t.template_effect(
        (x, j) => {
          t.set_text(J, x), t.set_text(w, j), at.disabled = t.get(F) || !t.get(q).balanced || t.get(q).debit === 0 || !t.get(v).description, t.set_text(te, t.get(F) ? "Posting…" : "Post entry");
        },
        [
          () => X(t.get(q).debit),
          () => X(t.get(q).credit)
        ]
      ), t.delegated("click", a, (x) => x.target === x.currentTarget && t.set(O, !1)), t.delegated("click", C, () => t.set(O, !1)), t.bind_value(u, () => t.get(v).entry_date, (x) => t.get(v).entry_date = x), t.bind_value(f, () => t.get(v).document_number, (x) => t.get(v).document_number = x), t.bind_value(g, () => t.get(v).description, (x) => t.get(v).description = x), t.delegated("click", _, mt), t.delegated("click", Pt, () => t.set(O, !1)), t.delegated("click", at, Ft), t.append(e, a);
    };
    t.if(jt, (e) => {
      t.get(O) && e(Kt);
    });
  }
  var Qt = t.sibling(jt, 2);
  {
    var Zt = (e) => {
      var a = Se(), r = t.child(a), o = t.child(r), C = t.sibling(t.child(o), 2), L = t.child(C);
      ft(L, { class: "h-4 w-4" }), t.reset(C), t.reset(o);
      var S = t.sibling(o, 2), n = t.child(S), u = t.sibling(t.child(n));
      t.remove_input_defaults(u), t.reset(n);
      var P = t.sibling(n, 2), f = t.sibling(t.child(P));
      t.remove_input_defaults(f), t.reset(P);
      var c = t.sibling(P, 2), g = t.sibling(t.child(c)), p = t.child(g);
      p.value = p.__value = "asset";
      var D = t.sibling(p);
      D.value = D.__value = "liability";
      var _ = t.sibling(D);
      _.value = _.__value = "equity";
      var E = t.sibling(_);
      E.value = E.__value = "revenue";
      var m = t.sibling(E);
      m.value = m.__value = "expense", t.reset(g), t.reset(c);
      var T = t.sibling(c, 2), $ = t.sibling(t.child(T));
      t.remove_input_defaults($), t.reset(T), t.reset(S);
      var A = t.sibling(S, 2), M = t.child(A), J = t.sibling(M, 2), B = t.child(J, !0);
      t.reset(J), t.reset(A), t.reset(r), t.reset(a), t.template_effect(() => {
        J.disabled = t.get(F) || !t.get(k).code || !t.get(k).name, t.set_text(B, t.get(F) ? "Saving…" : "Create");
      }), t.delegated("click", a, (w) => w.target === w.currentTarget && t.set(W, !1)), t.delegated("click", C, () => t.set(W, !1)), t.bind_value(u, () => t.get(k).code, (w) => t.get(k).code = w), t.bind_value(f, () => t.get(k).name, (w) => t.get(k).name = w), t.bind_select_value(g, () => t.get(k).account_type, (w) => t.get(k).account_type = w), t.bind_value($, () => t.get(k).parent_code, (w) => t.get(k).parent_code = w), t.delegated("click", M, () => t.set(W, !1)), t.delegated("click", J, Wt), t.append(e, a);
    };
    t.if(Qt, (e) => {
      t.get(W) && e(Zt);
    });
  }
  t.template_effect(() => {
    kt = t.set_class(G, 1, "tab gap-2", null, kt, { "tab-active": t.get(i) === "entries" }), $t = t.set_class(K, 1, "tab gap-2", null, $t, { "tab-active": t.get(i) === "accounts" }), Mt = t.set_class(tt, 1, "tab gap-2", null, Mt, { "tab-active": t.get(i) === "fiscal" });
  }), t.delegated("click", G, () => t.set(i, "entries")), t.delegated("click", K, () => t.set(i, "accounts")), t.delegated("click", tt, () => t.set(i, "fiscal")), t.append(b, xt), t.pop();
}
t.delegate(["click"]);
function Te() {
  const b = window.__zveltio;
  b && b.registerRoute({
    path: "accounting",
    component: De,
    label: "Accounting",
    icon: "Calculator",
    category: "finance"
  });
}
Te();
export {
  Te as default
};
