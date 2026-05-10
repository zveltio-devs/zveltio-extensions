import "svelte/internal/disclose-version";
import * as t from "svelte/internal/client";
import { onMount as xt } from "svelte";
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
const yt = {
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
var wt = t.from_svg("<svg><!><!></svg>");
function L(p, a) {
  t.push(a, !0);
  const y = t.prop(a, "color", 3, "currentColor"), s = t.prop(a, "size", 3, 24), b = t.prop(a, "strokeWidth", 3, 2), P = t.prop(a, "absoluteStrokeWidth", 3, !1), l = t.prop(a, "iconNode", 19, () => []), g = t.rest_props(a, [
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
  var M = wt();
  t.attribute_effect(
    M,
    (u) => ({
      ...yt,
      ...g,
      width: s(),
      height: s(),
      stroke: y(),
      "stroke-width": u,
      class: [
        "lucide-icon lucide",
        a.name && `lucide-${a.name}`,
        a.class
      ]
    }),
    [
      () => P() ? Number(b()) * 24 / Number(s()) : b()
    ]
  );
  var C = t.child(M);
  t.each(C, 17, l, t.index, (u, R) => {
    var D = t.derived(() => t.to_array(t.get(R), 2));
    let X = () => t.get(D)[0], Z = () => t.get(D)[1];
    var q = t.comment(), H = t.first_child(q);
    t.element(H, X, !0, (E, J) => {
      t.attribute_effect(E, () => ({ ...Z() }));
    }), t.append(u, q);
  });
  var W = t.sibling(C);
  t.snippet(W, () => a.children ?? t.noop), t.reset(M), t.append(p, M), t.pop();
}
function kt(p, a) {
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
  const s = [
    ["path", { d: "M8 3 4 7l4 4" }],
    ["path", { d: "M4 7h16" }],
    ["path", { d: "m16 21 4-4-4-4" }],
    ["path", { d: "M20 17H4" }]
  ];
  L(p, t.spread_props({ name: "arrow-left-right" }, () => y, {
    get iconNode() {
      return s;
    },
    children: (b, P) => {
      var l = t.comment(), g = t.first_child(l);
      t.snippet(g, () => a.children ?? t.noop), t.append(b, l);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function Nt(p, a) {
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
  const s = [
    [
      "path",
      {
        d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"
      }
    ],
    ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }],
    ["path", { d: "M8 13h2" }],
    ["path", { d: "M14 13h2" }],
    ["path", { d: "M8 17h2" }],
    ["path", { d: "M14 17h2" }]
  ];
  L(p, t.spread_props({ name: "file-spreadsheet" }, () => y, {
    get iconNode() {
      return s;
    },
    children: (b, P) => {
      var l = t.comment(), g = t.first_child(l);
      t.snippet(g, () => a.children ?? t.noop), t.append(b, l);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function it(p, a) {
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
  const s = [
    ["path", { d: "M10 18v-7" }],
    [
      "path",
      {
        d: "M11.12 2.198a2 2 0 0 1 1.76.006l7.866 3.847c.476.233.31.949-.22.949H3.474c-.53 0-.695-.716-.22-.949z"
      }
    ],
    ["path", { d: "M14 18v-7" }],
    ["path", { d: "M18 18v-7" }],
    ["path", { d: "M3 22h18" }],
    ["path", { d: "M6 18v-7" }]
  ];
  L(p, t.spread_props({ name: "landmark" }, () => y, {
    get iconNode() {
      return s;
    },
    children: (b, P) => {
      var l = t.comment(), g = t.first_child(l);
      t.snippet(g, () => a.children ?? t.noop), t.append(b, l);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function Mt(p, a) {
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
  const s = [["path", { d: "M5 12h14" }], ["path", { d: "M12 5v14" }]];
  L(p, t.spread_props({ name: "plus" }, () => y, {
    get iconNode() {
      return s;
    },
    children: (b, P) => {
      var l = t.comment(), g = t.first_child(l);
      t.snippet(g, () => a.children ?? t.noop), t.append(b, l);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function $t(p, a) {
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
  const s = [
    ["path", { d: "M18 6 6 18" }],
    ["path", { d: "m6 6 12 12" }]
  ];
  L(p, t.spread_props({ name: "x" }, () => y, {
    get iconNode() {
      return s;
    },
    children: (b, P) => {
      var l = t.comment(), g = t.first_child(l);
      t.snippet(g, () => a.children ?? t.noop), t.append(b, l);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
var At = t.from_html('<button class="btn btn-primary btn-sm gap-2"><!> New account</button>'), Pt = t.from_html('<div class="alert alert-error"> </div>'), jt = t.from_html('<tr><td colspan="5" class="text-center py-6 text-base-content/60">No accounts.</td></tr>'), zt = t.from_html('<tr><td> </td><td> </td><td class="font-mono text-xs"> </td><td> </td><td class="text-right"> </td></tr>'), Bt = t.from_html('<div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Name</th><th>Bank</th><th class="font-mono">IBAN</th><th>Currency</th><th class="text-right">Balance</th></tr></thead><tbody><!></tbody></table></div>'), Ct = t.from_html('<tr><td colspan="5" class="text-center py-6 text-base-content/60">No transactions yet — import a bank statement to start.</td></tr>'), Ot = t.from_html('<tr><td> </td><td> </td><td class="max-w-xs truncate"> </td><td> </td><td> </td></tr>'), Rt = t.from_html('<div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Date</th><th>Account</th><th>Description</th><th class="text-right">Amount</th><th>Reconciled</th></tr></thead><tbody><!></tbody></table></div>'), Tt = t.from_html('<tr><td colspan="3" class="text-center py-6 text-base-content/60">All clear.</td></tr>'), It = t.from_html('<tr><td> </td><td class="max-w-xs truncate"> </td><td class="text-right"> </td></tr>'), St = t.from_html('<tr><td colspan="3" class="text-center py-6 text-base-content/60">No open invoices.</td></tr>'), Wt = t.from_html('<tr><td class="font-mono"> </td><td> </td><td class="text-right"> </td></tr>'), Dt = t.from_html('<div class="grid grid-cols-1 lg:grid-cols-2 gap-4"><div class="bg-base-100 rounded-lg shadow"><div class="p-3 font-medium border-b">Unreconciled transactions</div> <table class="table table-sm"><thead><tr><th>Date</th><th>Description</th><th class="text-right">Amount</th></tr></thead><tbody><!></tbody></table></div> <div class="bg-base-100 rounded-lg shadow"><div class="p-3 font-medium border-b">Open invoices (sent)</div> <table class="table table-sm"><thead><tr><th>Number</th><th>Client</th><th class="text-right">Total</th></tr></thead><tbody><!></tbody></table></div></div>'), Ht = t.from_html('<div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><div class="bg-base-100 rounded-xl p-6 w-full max-w-md"><div class="flex items-center justify-between mb-4"><h2 class="text-xl font-semibold">New bank account</h2><button class="btn btn-ghost btn-sm btn-square"><!></button></div> <div class="space-y-3"><div><label class="label label-text">Internal name</label><input class="input input-bordered w-full"/></div> <div><label class="label label-text">Bank</label><input class="input input-bordered w-full"/></div> <div><label class="label label-text">IBAN</label><input class="input input-bordered w-full font-mono"/></div> <div><label class="label label-text">Currency</label><input class="input input-bordered w-full" maxlength="3"/></div> <div><label class="label label-text">Opening balance</label><input type="number" step="0.01" class="input input-bordered w-full"/></div></div> <div class="flex justify-end gap-2 mt-4"><button class="btn btn-ghost">Cancel</button><button class="btn btn-primary"> </button></div></div></div>'), Ft = t.from_html('<div class="p-6 space-y-4"><header class="flex items-center justify-between"><h1 class="text-2xl font-semibold flex items-center gap-2"><!> Banking</h1> <!></header> <!> <div role="tablist" class="tabs tabs-bordered"><button role="tab"><!> Accounts</button> <button role="tab"><!> Transactions</button> <button role="tab"><!> Reconciliation</button></div> <!></div> <!>', 1);
function Ut(p, a) {
  var nt;
  t.push(a, !0);
  const y = ((nt = window.__zveltio) == null ? void 0 : nt.engineUrl) ?? "";
  let s = t.state("accounts"), b = t.state(t.proxy([])), P = t.state(t.proxy([])), l = t.state(t.proxy([])), g = t.state(t.proxy([])), M = t.state(""), C = t.state(!1), W = t.state(!1), u = t.state(t.proxy({
    name: "",
    bank_name: "",
    iban: "",
    currency: "RON",
    opening_balance: 0
  }));
  async function R(e, r) {
    const o = await fetch(`${y}${e}`, { credentials: "include", ...r }), m = await o.json().catch(() => ({}));
    if (!o.ok) throw new Error(m.error || `HTTP ${o.status}`);
    return m;
  }
  async function D() {
    try {
      const e = await R("/api/banking/accounts");
      t.set(b, e.data ?? [], !0);
    } catch (e) {
      t.set(M, e.message, !0);
    }
  }
  async function X() {
    try {
      const e = await R("/api/banking/transactions?limit=100");
      t.set(P, e.data ?? [], !0);
    } catch (e) {
      t.set(M, e.message, !0);
    }
  }
  async function Z() {
    try {
      const [e, r] = await Promise.all([
        R("/api/banking/transactions?reconciled=false&limit=100"),
        R("/api/invoicing/invoices?status=sent&limit=100").catch(() => ({ data: [] }))
      ]);
      t.set(l, e.data ?? [], !0), t.set(g, r.data ?? [], !0);
    } catch (e) {
      t.set(M, e.message, !0);
    }
  }
  async function q() {
    t.set(W, !0), t.set(M, "");
    try {
      await R("/api/banking/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(t.get(u))
      }), t.set(C, !1), t.set(
        u,
        {
          name: "",
          bank_name: "",
          iban: "",
          currency: "RON",
          opening_balance: 0
        },
        !0
      ), await D();
    } catch (e) {
      t.set(M, e.message, !0);
    } finally {
      t.set(W, !1);
    }
  }
  t.user_effect(() => {
    t.get(s) === "accounts" ? D() : t.get(s) === "transactions" ? X() : Z();
  }), xt(() => D());
  function H(e, r = "RON") {
    return new Intl.NumberFormat("ro-RO", { style: "currency", currency: r }).format(e);
  }
  var E = Ft(), J = t.first_child(E), G = t.child(J), K = t.child(G), lt = t.child(K);
  it(lt, { class: "h-6 w-6" }), t.next(), t.reset(K);
  var ot = t.sibling(K, 2);
  {
    var dt = (e) => {
      var r = At(), o = t.child(r);
      Mt(o, { class: "h-4 w-4" }), t.next(), t.reset(r), t.delegated("click", r, () => t.set(C, !0)), t.append(e, r);
    };
    t.if(ot, (e) => {
      t.get(s) === "accounts" && e(dt);
    });
  }
  t.reset(G);
  var et = t.sibling(G, 2);
  {
    var ct = (e) => {
      var r = Pt(), o = t.child(r, !0);
      t.reset(r), t.template_effect(() => t.set_text(o, t.get(M))), t.append(e, r);
    };
    t.if(et, (e) => {
      t.get(M) && e(ct);
    });
  }
  var Q = t.sibling(et, 2), F = t.child(Q);
  let at;
  var vt = t.child(F);
  it(vt, { class: "h-4 w-4" }), t.next(), t.reset(F);
  var U = t.sibling(F, 2);
  let rt;
  var ht = t.child(U);
  Nt(ht, { class: "h-4 w-4" }), t.next(), t.reset(U);
  var V = t.sibling(U, 2);
  let st;
  var ut = t.child(V);
  kt(ut, { class: "h-4 w-4" }), t.next(), t.reset(V), t.reset(Q);
  var _t = t.sibling(Q, 2);
  {
    var pt = (e) => {
      var r = Bt(), o = t.child(r), m = t.sibling(t.child(o)), j = t.child(m);
      {
        var T = (h) => {
          var f = jt();
          t.append(h, f);
        }, O = (h) => {
          var f = t.comment(), z = t.first_child(f);
          t.each(z, 17, () => t.get(b), (w) => w.id, (w, d) => {
            var $ = zt(), k = t.child($), c = t.child(k, !0);
            t.reset(k);
            var v = t.sibling(k), B = t.child(v, !0);
            t.reset(v);
            var _ = t.sibling(v), x = t.child(_, !0);
            t.reset(_);
            var i = t.sibling(_), N = t.child(i, !0);
            t.reset(i);
            var n = t.sibling(i), A = t.child(n, !0);
            t.reset(n), t.reset($), t.template_effect(
              (I) => {
                t.set_text(c, t.get(d).name), t.set_text(B, t.get(d).bank_name), t.set_text(x, t.get(d).iban), t.set_text(N, t.get(d).currency), t.set_text(A, I);
              },
              [() => H(Number(t.get(d).balance), t.get(d).currency)]
            ), t.append(w, $);
          }), t.append(h, f);
        };
        t.if(j, (h) => {
          t.get(b).length === 0 ? h(T) : h(O, -1);
        });
      }
      t.reset(m), t.reset(o), t.reset(r), t.append(e, r);
    }, bt = (e) => {
      var r = Rt(), o = t.child(r), m = t.sibling(t.child(o)), j = t.child(m);
      {
        var T = (h) => {
          var f = Ct();
          t.append(h, f);
        }, O = (h) => {
          var f = t.comment(), z = t.first_child(f);
          t.each(z, 17, () => t.get(P), (w) => w.id, (w, d) => {
            var $ = Ot(), k = t.child($), c = t.child(k, !0);
            t.reset(k);
            var v = t.sibling(k), B = t.child(v, !0);
            t.reset(v);
            var _ = t.sibling(v), x = t.child(_, !0);
            t.reset(_);
            var i = t.sibling(_), N = t.child(i, !0);
            t.reset(i);
            var n = t.sibling(i), A = t.child(n, !0);
            t.reset(n), t.reset($), t.template_effect(
              (I, S) => {
                t.set_text(c, t.get(d).transaction_date), t.set_text(B, t.get(d).account_name ?? "—"), t.set_text(x, t.get(d).description), t.set_class(i, 1, `text-right ${I ?? ""}`), t.set_text(N, S), t.set_text(A, t.get(d).reconciled ? "✓" : "—");
              },
              [
                () => Number(t.get(d).amount) < 0 ? "text-error" : "text-success",
                () => H(Number(t.get(d).amount), t.get(d).currency)
              ]
            ), t.append(w, $);
          }), t.append(h, f);
        };
        t.if(j, (h) => {
          t.get(P).length === 0 ? h(T) : h(O, -1);
        });
      }
      t.reset(m), t.reset(o), t.reset(r), t.append(e, r);
    }, gt = (e) => {
      var r = Dt(), o = t.child(r), m = t.sibling(t.child(o), 2), j = t.sibling(t.child(m)), T = t.child(j);
      {
        var O = (c) => {
          var v = Tt();
          t.append(c, v);
        }, h = (c) => {
          var v = t.comment(), B = t.first_child(v);
          t.each(B, 17, () => t.get(l), (_) => _.id, (_, x) => {
            var i = It(), N = t.child(i), n = t.child(N, !0);
            t.reset(N);
            var A = t.sibling(N), I = t.child(A, !0);
            t.reset(A);
            var S = t.sibling(A), Y = t.child(S, !0);
            t.reset(S), t.reset(i), t.template_effect(
              (tt) => {
                t.set_text(n, t.get(x).transaction_date), t.set_text(I, t.get(x).description), t.set_text(Y, tt);
              },
              [() => H(Number(t.get(x).amount))]
            ), t.append(_, i);
          }), t.append(c, v);
        };
        t.if(T, (c) => {
          t.get(l).length === 0 ? c(O) : c(h, -1);
        });
      }
      t.reset(j), t.reset(m), t.reset(o);
      var f = t.sibling(o, 2), z = t.sibling(t.child(f), 2), w = t.sibling(t.child(z)), d = t.child(w);
      {
        var $ = (c) => {
          var v = St();
          t.append(c, v);
        }, k = (c) => {
          var v = t.comment(), B = t.first_child(v);
          t.each(B, 17, () => t.get(g), (_) => _.id, (_, x) => {
            var i = Wt(), N = t.child(i), n = t.child(N, !0);
            t.reset(N);
            var A = t.sibling(N), I = t.child(A, !0);
            t.reset(A);
            var S = t.sibling(A), Y = t.child(S, !0);
            t.reset(S), t.reset(i), t.template_effect(
              (tt) => {
                t.set_text(n, t.get(x).number), t.set_text(I, t.get(x).client_name), t.set_text(Y, tt);
              },
              [() => H(Number(t.get(x).total))]
            ), t.append(_, i);
          }), t.append(c, v);
        };
        t.if(d, (c) => {
          t.get(g).length === 0 ? c($) : c(k, -1);
        });
      }
      t.reset(w), t.reset(z), t.reset(f), t.reset(r), t.append(e, r);
    };
    t.if(_t, (e) => {
      t.get(s) === "accounts" ? e(pt) : t.get(s) === "transactions" ? e(bt, 1) : e(gt, -1);
    });
  }
  t.reset(J);
  var mt = t.sibling(J, 2);
  {
    var ft = (e) => {
      var r = Ht(), o = t.child(r), m = t.child(o), j = t.sibling(t.child(m)), T = t.child(j);
      $t(T, { class: "h-4 w-4" }), t.reset(j), t.reset(m);
      var O = t.sibling(m, 2), h = t.child(O), f = t.sibling(t.child(h));
      t.remove_input_defaults(f), t.reset(h);
      var z = t.sibling(h, 2), w = t.sibling(t.child(z));
      t.remove_input_defaults(w), t.reset(z);
      var d = t.sibling(z, 2), $ = t.sibling(t.child(d));
      t.remove_input_defaults($), t.reset(d);
      var k = t.sibling(d, 2), c = t.sibling(t.child(k));
      t.remove_input_defaults(c), t.reset(k);
      var v = t.sibling(k, 2), B = t.sibling(t.child(v));
      t.remove_input_defaults(B), t.reset(v), t.reset(O);
      var _ = t.sibling(O, 2), x = t.child(_), i = t.sibling(x), N = t.child(i, !0);
      t.reset(i), t.reset(_), t.reset(o), t.reset(r), t.template_effect(() => {
        i.disabled = t.get(W) || !t.get(u).name || !t.get(u).iban, t.set_text(N, t.get(W) ? "Saving…" : "Create");
      }), t.delegated("click", r, (n) => n.target === n.currentTarget && t.set(C, !1)), t.delegated("click", j, () => t.set(C, !1)), t.bind_value(f, () => t.get(u).name, (n) => t.get(u).name = n), t.bind_value(w, () => t.get(u).bank_name, (n) => t.get(u).bank_name = n), t.bind_value($, () => t.get(u).iban, (n) => t.get(u).iban = n), t.bind_value(c, () => t.get(u).currency, (n) => t.get(u).currency = n), t.bind_value(B, () => t.get(u).opening_balance, (n) => t.get(u).opening_balance = n), t.delegated("click", x, () => t.set(C, !1)), t.delegated("click", i, q), t.append(e, r);
    };
    t.if(mt, (e) => {
      t.get(C) && e(ft);
    });
  }
  t.template_effect(() => {
    at = t.set_class(F, 1, "tab gap-2", null, at, { "tab-active": t.get(s) === "accounts" }), rt = t.set_class(U, 1, "tab gap-2", null, rt, { "tab-active": t.get(s) === "transactions" }), st = t.set_class(V, 1, "tab gap-2", null, st, { "tab-active": t.get(s) === "reconciliation" });
  }), t.delegated("click", F, () => t.set(s, "accounts")), t.delegated("click", U, () => t.set(s, "transactions")), t.delegated("click", V, () => t.set(s, "reconciliation")), t.append(p, E), t.pop();
}
t.delegate(["click"]);
function Lt() {
  const p = window.__zveltio;
  p && p.registerRoute({
    path: "banking",
    component: Ut,
    label: "Banking",
    icon: "Landmark",
    category: "finance"
  });
}
Lt();
export {
  Lt as default
};
