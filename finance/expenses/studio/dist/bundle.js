import "svelte/internal/disclose-version";
import * as e from "svelte/internal/client";
import { onMount as fe } from "svelte";
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
const me = {
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
var xe = e.from_svg("<svg><!><!></svg>");
function J(d, a) {
  e.push(a, !0);
  const u = e.prop(a, "color", 3, "currentColor"), o = e.prop(a, "size", 3, 24), l = e.prop(a, "strokeWidth", 3, 2), v = e.prop(a, "absoluteStrokeWidth", 3, !1), i = e.prop(a, "iconNode", 19, () => []), c = e.rest_props(a, [
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
  var s = xe();
  e.attribute_effect(
    s,
    (P) => ({
      ...me,
      ...c,
      width: o(),
      height: o(),
      stroke: u(),
      "stroke-width": P,
      class: [
        "lucide-icon lucide",
        a.name && `lucide-${a.name}`,
        a.class
      ]
    }),
    [
      () => v() ? Number(l()) * 24 / Number(o()) : l()
    ]
  );
  var y = e.child(s);
  e.each(y, 17, i, e.index, (P, X) => {
    var U = e.derived(() => e.to_array(e.get(X), 2));
    let Z = () => e.get(U)[0], F = () => e.get(U)[1];
    var N = e.comment(), j = e.first_child(N);
    e.element(j, Z, !0, (C, te) => {
      e.attribute_effect(C, () => ({ ...F() }));
    }), e.append(P, N);
  });
  var k = e.sibling(y);
  e.snippet(k, () => a.children ?? e.noop), e.reset(s), e.append(d, s), e.pop();
}
function we(d, a) {
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
  let u = e.rest_props(a, ["$$slots", "$$events", "$$legacy"]);
  const o = [["path", { d: "M20 6 9 17l-5-5" }]];
  J(d, e.spread_props({ name: "check" }, () => u, {
    get iconNode() {
      return o;
    },
    children: (l, v) => {
      var i = e.comment(), c = e.first_child(i);
      e.snippet(c, () => a.children ?? e.noop), e.append(l, i);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function ye(d, a) {
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
  let u = e.rest_props(a, ["$$slots", "$$events", "$$legacy"]);
  const o = [["path", { d: "M5 12h14" }], ["path", { d: "M12 5v14" }]];
  J(d, e.spread_props({ name: "plus" }, () => u, {
    get iconNode() {
      return o;
    },
    children: (l, v) => {
      var i = e.comment(), c = e.first_child(i);
      e.snippet(c, () => a.children ?? e.noop), e.append(l, i);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function ke(d, a) {
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
  let u = e.rest_props(a, ["$$slots", "$$events", "$$legacy"]);
  const o = [
    [
      "path",
      {
        d: "M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"
      }
    ],
    ["path", { d: "M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" }],
    ["path", { d: "M12 17.5v-11" }]
  ];
  J(d, e.spread_props({ name: "receipt" }, () => u, {
    get iconNode() {
      return o;
    },
    children: (l, v) => {
      var i = e.comment(), c = e.first_child(i);
      e.snippet(c, () => a.children ?? e.noop), e.append(l, i);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function Ne(d, a) {
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
  let u = e.rest_props(a, ["$$slots", "$$events", "$$legacy"]);
  const o = [
    ["path", { d: "M18 6 6 18" }],
    ["path", { d: "m6 6 12 12" }]
  ];
  J(d, e.spread_props({ name: "x" }, () => u, {
    get iconNode() {
      return o;
    },
    children: (l, v) => {
      var i = e.comment(), c = e.first_child(i);
      e.snippet(c, () => a.children ?? e.noop), e.append(l, i);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
var $e = e.from_html('<div class="alert alert-error"> </div>'), Se = e.from_html('<tr><td colspan="7" class="text-center py-6 text-base-content/60">No expenses.</td></tr>'), Oe = e.from_html('<button class="btn btn-ghost btn-xs" title="Approve"><!></button>'), Re = e.from_html('<tr><td> </td><td><span class="badge badge-ghost badge-sm"> </span></td><td> </td><td class="max-w-xs truncate"> </td><td class="text-right"> </td><td><span> </span></td><td><!></td></tr>'), Me = e.from_html('<div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><div class="bg-base-100 rounded-xl p-6 w-full max-w-md"><div class="flex items-center justify-between mb-4"><h2 class="text-xl font-semibold">New expense</h2><button class="btn btn-ghost btn-sm btn-square"><!></button></div> <div class="grid grid-cols-2 gap-3"><div><label class="label label-text">Date</label><input type="date" class="input input-bordered w-full"/></div> <div><label class="label label-text">Category</label><select class="select select-bordered w-full"><option>Travel</option><option>Meals</option><option>Office</option><option>Software</option><option>Other</option></select></div> <div class="col-span-2"><label class="label label-text">Vendor</label><input class="input input-bordered w-full"/></div> <div class="col-span-2"><label class="label label-text">Description</label><input class="input input-bordered w-full"/></div> <div><label class="label label-text">Amount</label><input type="number" step="0.01" class="input input-bordered w-full"/></div> <div><label class="label label-text">Currency</label><input class="input input-bordered w-full" maxlength="3"/></div> <div class="col-span-2"><label class="label label-text">Receipt URL (optional)</label><input class="input input-bordered w-full"/></div></div> <div class="flex justify-end gap-2 mt-4"><button class="btn btn-ghost">Cancel</button><button class="btn btn-primary"> </button></div></div></div>'), Pe = e.from_html('<div class="p-6 space-y-4"><header class="flex items-center justify-between"><h1 class="text-2xl font-semibold flex items-center gap-2"><!> Expenses</h1> <button class="btn btn-primary btn-sm gap-2"><!> New expense</button></header> <!> <select class="select select-sm select-bordered max-w-xs"><option>All</option><option>Draft</option><option>Submitted</option><option>Approved</option><option>Reimbursed</option></select> <div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Date</th><th>Category</th><th>Vendor</th><th>Description</th><th class="text-right">Amount</th><th>Status</th><th></th></tr></thead><tbody><!></tbody></table></div></div> <!>', 1);
function je(d, a) {
  var ne;
  e.push(a, !0);
  const u = ((ne = window.__zveltio) == null ? void 0 : ne.engineUrl) ?? "";
  let o = e.state(e.proxy([])), l = e.state(""), v = e.state("all"), i = e.state(!1), c = e.state(!1), s = e.state(e.proxy({
    expense_date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
    category: "travel",
    description: "",
    amount: 0,
    currency: "RON",
    vendor: "",
    receipt_url: ""
  }));
  async function y(t, r) {
    const g = await fetch(`${u}${t}`, { credentials: "include", ...r }), b = await g.json().catch(() => ({}));
    if (!g.ok) throw new Error(b.error || `HTTP ${g.status}`);
    return b;
  }
  async function k() {
    try {
      const t = new URLSearchParams();
      e.get(v) !== "all" && t.set("status", e.get(v));
      const r = await y(`/api/expenses?${t}`);
      e.set(o, r.data ?? [], !0);
    } catch (t) {
      e.set(l, t.message, !0);
    }
  }
  async function P() {
    e.set(c, !0), e.set(l, "");
    try {
      await y("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(e.get(s))
      }), e.set(i, !1), e.set(
        s,
        {
          expense_date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
          category: "travel",
          description: "",
          amount: 0,
          currency: "RON",
          vendor: "",
          receipt_url: ""
        },
        !0
      ), await k();
    } catch (t) {
      e.set(l, t.message, !0);
    } finally {
      e.set(c, !1);
    }
  }
  async function X(t) {
    try {
      await y(`/api/expenses/${t}/approve`, { method: "POST" }), await k();
    } catch (r) {
      e.set(l, r.message, !0);
    }
  }
  e.user_effect(() => {
    e.get(v), k();
  }), fe(k);
  function U(t, r = "RON") {
    return new Intl.NumberFormat("ro-RO", { style: "currency", currency: r }).format(t);
  }
  function Z(t) {
    return {
      draft: "badge-ghost",
      submitted: "badge-warning",
      approved: "badge-success",
      reimbursed: "badge-info",
      rejected: "badge-error"
    }[t] ?? "badge-ghost";
  }
  var F = Pe(), N = e.first_child(F), j = e.child(N), C = e.child(j), te = e.child(C);
  ke(te, { class: "h-6 w-6" }), e.next(), e.reset(C);
  var G = e.sibling(C, 2), ce = e.child(G);
  ye(ce, { class: "h-4 w-4" }), e.next(), e.reset(G), e.reset(j);
  var ae = e.sibling(j, 2);
  {
    var pe = (t) => {
      var r = $e(), g = e.child(r, !0);
      e.reset(r), e.template_effect(() => e.set_text(g, e.get(l))), e.append(t, r);
    };
    e.if(ae, (t) => {
      e.get(l) && t(pe);
    });
  }
  var V = e.sibling(ae, 2), K = e.child(V);
  K.value = K.__value = "all";
  var Q = e.sibling(K);
  Q.value = Q.__value = "draft";
  var Y = e.sibling(Q);
  Y.value = Y.__value = "submitted";
  var ee = e.sibling(Y);
  ee.value = ee.__value = "approved";
  var se = e.sibling(ee);
  se.value = se.__value = "reimbursed", e.reset(V);
  var re = e.sibling(V, 2), ie = e.child(re), le = e.sibling(e.child(ie)), ue = e.child(le);
  {
    var ve = (t) => {
      var r = Se();
      e.append(t, r);
    }, ge = (t) => {
      var r = e.comment(), g = e.first_child(r);
      e.each(g, 17, () => e.get(o), (b) => b.id, (b, p) => {
        var z = Re(), f = e.child(z), D = e.child(f, !0);
        e.reset(f);
        var $ = e.sibling(f), S = e.child($), T = e.child(S, !0);
        e.reset(S), e.reset($);
        var m = e.sibling($), A = e.child(m, !0);
        e.reset(m);
        var x = e.sibling(m), W = e.child(x, !0);
        e.reset(x);
        var O = e.sibling(x), E = e.child(O, !0);
        e.reset(O);
        var R = e.sibling(O), w = e.child(R), B = e.child(w, !0);
        e.reset(w), e.reset(R);
        var M = e.sibling(R), H = e.child(M);
        {
          var I = (h) => {
            var _ = Oe(), L = e.child(_);
            we(L, { class: "h-3.5 w-3.5" }), e.reset(_), e.delegated("click", _, () => X(e.get(p).id)), e.append(h, _);
          };
          e.if(H, (h) => {
            e.get(p).status === "submitted" && h(I);
          });
        }
        e.reset(M), e.reset(z), e.template_effect(
          (h, _) => {
            e.set_text(D, e.get(p).expense_date), e.set_text(T, e.get(p).category), e.set_text(A, e.get(p).vendor ?? "—"), e.set_text(W, e.get(p).description), e.set_text(E, h), e.set_class(w, 1, `badge ${_ ?? ""} badge-sm`), e.set_text(B, e.get(p).status);
          },
          [
            () => U(Number(e.get(p).amount), e.get(p).currency),
            () => Z(e.get(p).status)
          ]
        ), e.append(b, z);
      }), e.append(t, r);
    };
    e.if(ue, (t) => {
      e.get(o).length === 0 ? t(ve) : t(ge, -1);
    });
  }
  e.reset(le), e.reset(ie), e.reset(re), e.reset(N);
  var be = e.sibling(N, 2);
  {
    var _e = (t) => {
      var r = Me(), g = e.child(r), b = e.child(g), p = e.sibling(e.child(b)), z = e.child(p);
      Ne(z, { class: "h-4 w-4" }), e.reset(p), e.reset(b);
      var f = e.sibling(b, 2), D = e.child(f), $ = e.sibling(e.child(D));
      e.remove_input_defaults($), e.reset(D);
      var S = e.sibling(D, 2), T = e.sibling(e.child(S)), m = e.child(T);
      m.value = m.__value = "travel";
      var A = e.sibling(m);
      A.value = A.__value = "meals";
      var x = e.sibling(A);
      x.value = x.__value = "office";
      var W = e.sibling(x);
      W.value = W.__value = "software";
      var O = e.sibling(W);
      O.value = O.__value = "other", e.reset(T), e.reset(S);
      var E = e.sibling(S, 2), R = e.sibling(e.child(E));
      e.remove_input_defaults(R), e.reset(E);
      var w = e.sibling(E, 2), B = e.sibling(e.child(w));
      e.remove_input_defaults(B), e.reset(w);
      var M = e.sibling(w, 2), H = e.sibling(e.child(M));
      e.remove_input_defaults(H), e.reset(M);
      var I = e.sibling(M, 2), h = e.sibling(e.child(I));
      e.remove_input_defaults(h), e.reset(I);
      var _ = e.sibling(I, 2), L = e.sibling(e.child(_));
      e.remove_input_defaults(L), e.reset(_), e.reset(f);
      var oe = e.sibling(f, 2), de = e.child(oe), q = e.sibling(de), he = e.child(q, !0);
      e.reset(q), e.reset(oe), e.reset(g), e.reset(r), e.template_effect(() => {
        q.disabled = e.get(c) || !e.get(s).description || e.get(s).amount <= 0, e.set_text(he, e.get(c) ? "Saving…" : "Submit");
      }), e.delegated("click", r, (n) => n.target === n.currentTarget && e.set(i, !1)), e.delegated("click", p, () => e.set(i, !1)), e.bind_value($, () => e.get(s).expense_date, (n) => e.get(s).expense_date = n), e.bind_select_value(T, () => e.get(s).category, (n) => e.get(s).category = n), e.bind_value(R, () => e.get(s).vendor, (n) => e.get(s).vendor = n), e.bind_value(B, () => e.get(s).description, (n) => e.get(s).description = n), e.bind_value(H, () => e.get(s).amount, (n) => e.get(s).amount = n), e.bind_value(h, () => e.get(s).currency, (n) => e.get(s).currency = n), e.bind_value(L, () => e.get(s).receipt_url, (n) => e.get(s).receipt_url = n), e.delegated("click", de, () => e.set(i, !1)), e.delegated("click", q, P), e.append(t, r);
    };
    e.if(be, (t) => {
      e.get(i) && t(_e);
    });
  }
  e.delegated("click", G, () => e.set(i, !0)), e.bind_select_value(V, () => e.get(v), (t) => e.set(v, t)), e.append(d, F), e.pop();
}
e.delegate(["click"]);
function Ce() {
  const d = window.__zveltio;
  d && d.registerRoute({
    path: "expenses",
    component: je,
    label: "Expenses",
    icon: "Receipt",
    category: "finance"
  });
}
Ce();
export {
  Ce as default
};
