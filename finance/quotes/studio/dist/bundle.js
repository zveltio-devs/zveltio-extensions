import "svelte/internal/disclose-version";
import * as t from "svelte/internal/client";
import { onMount as Bt } from "svelte";
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
const Et = {
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
var Jt = t.from_svg("<svg><!><!></svg>");
function V(u, a) {
  t.push(a, !0);
  const h = t.prop(a, "color", 3, "currentColor"), c = t.prop(a, "size", 3, 24), o = t.prop(a, "strokeWidth", 3, 2), v = t.prop(a, "absoluteStrokeWidth", 3, !1), r = t.prop(a, "iconNode", 19, () => []), d = t.rest_props(a, [
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
  var y = Jt();
  t.attribute_effect(
    y,
    (w) => ({
      ...Et,
      ...d,
      width: c(),
      height: c(),
      stroke: h(),
      "stroke-width": w,
      class: [
        "lucide-icon lucide",
        a.name && `lucide-${a.name}`,
        a.class
      ]
    }),
    [
      () => v() ? Number(o()) * 24 / Number(c()) : o()
    ]
  );
  var i = t.child(y);
  t.each(i, 17, r, t.index, (w, Y) => {
    var U = t.derived(() => t.to_array(t.get(Y), 2));
    let tt = () => t.get(U)[0], B = () => t.get(U)[1];
    var E = t.comment(), et = t.first_child(E);
    t.element(et, tt, !0, (at, gt) => {
      t.attribute_effect(at, () => ({ ...B() }));
    }), t.append(w, E);
  });
  var N = t.sibling(i);
  t.snippet(N, () => a.children ?? t.noop), t.reset(y), t.append(u, y), t.pop();
}
function Xt(u, a) {
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
  let h = t.rest_props(a, ["$$slots", "$$events", "$$legacy"]);
  const c = [
    [
      "path",
      {
        d: "m18 5-2.414-2.414A2 2 0 0 0 14.172 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2"
      }
    ],
    [
      "path",
      {
        d: "M21.378 12.626a1 1 0 0 0-3.004-3.004l-4.01 4.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"
      }
    ],
    ["path", { d: "M8 18h1" }]
  ];
  V(u, t.spread_props({ name: "file-pen-line" }, () => h, {
    get iconNode() {
      return c;
    },
    children: (o, v) => {
      var r = t.comment(), d = t.first_child(r);
      t.snippet(d, () => a.children ?? t.noop), t.append(o, r);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function Zt(u, a) {
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
  let h = t.rest_props(a, ["$$slots", "$$events", "$$legacy"]);
  const c = [
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
  V(u, t.spread_props({ name: "file-text" }, () => h, {
    get iconNode() {
      return c;
    },
    children: (o, v) => {
      var r = t.comment(), d = t.first_child(r);
      t.snippet(d, () => a.children ?? t.noop), t.append(o, r);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function Tt(u, a) {
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
  let h = t.rest_props(a, ["$$slots", "$$events", "$$legacy"]);
  const c = [["path", { d: "M5 12h14" }], ["path", { d: "M12 5v14" }]];
  V(u, t.spread_props({ name: "plus" }, () => h, {
    get iconNode() {
      return c;
    },
    children: (o, v) => {
      var r = t.comment(), d = t.first_child(r);
      t.snippet(d, () => a.children ?? t.noop), t.append(o, r);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function Gt(u, a) {
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
  let h = t.rest_props(a, ["$$slots", "$$events", "$$legacy"]);
  const c = [
    [
      "path",
      {
        d: "M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"
      }
    ],
    ["path", { d: "m21.854 2.147-10.94 10.939" }]
  ];
  V(u, t.spread_props({ name: "send" }, () => h, {
    get iconNode() {
      return c;
    },
    children: (o, v) => {
      var r = t.comment(), d = t.first_child(r);
      t.snippet(d, () => a.children ?? t.noop), t.append(o, r);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function Ct(u, a) {
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
  let h = t.rest_props(a, ["$$slots", "$$events", "$$legacy"]);
  const c = [
    ["path", { d: "M18 6 6 18" }],
    ["path", { d: "m6 6 12 12" }]
  ];
  V(u, t.spread_props({ name: "x" }, () => h, {
    get iconNode() {
      return c;
    },
    children: (o, v) => {
      var r = t.comment(), d = t.first_child(r);
      t.snippet(d, () => a.children ?? t.noop), t.append(o, r);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
var Kt = t.from_html('<div class="alert alert-error"> </div>'), Yt = t.from_html('<tr><td colspan="6" class="text-center py-6 text-base-content/60">No quotes.</td></tr>'), te = t.from_html('<button class="btn btn-ghost btn-xs gap-1"><!> Send</button>'), ee = t.from_html('<button class="btn btn-ghost btn-xs gap-1"><!> → Invoice</button>'), ae = t.from_html('<tr><td class="font-mono"> </td><td> </td><td> </td><td class="text-right"> </td><td><span> </span></td><td><!><!></td></tr>'), ie = t.from_html("<option> </option>"), ne = t.from_html('<select class="select select-bordered w-full"><option>— Select contact —</option><!></select>'), re = t.from_html('<input class="input input-bordered w-full" placeholder="Client name"/>'), se = t.from_html('<button class="btn btn-ghost btn-xs btn-square"><!></button>'), le = t.from_html('<tr><td><input class="input input-xs input-bordered w-full"/></td><td><input type="number" step="0.01" class="input input-xs input-bordered w-20"/></td><td><input type="number" step="0.01" class="input input-xs input-bordered w-24"/></td><td><input type="number" step="0.01" class="input input-xs input-bordered w-16"/></td><td class="text-right"> </td><td><!></td></tr>'), oe = t.from_html('<div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><div class="bg-base-100 rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto"><div class="flex items-center justify-between mb-4"><h2 class="text-xl font-semibold">New quote</h2><button class="btn btn-ghost btn-sm btn-square"><!></button></div> <div class="grid grid-cols-2 gap-3"><div class="col-span-2"><label class="label label-text">Client</label> <!></div> <div><label class="label label-text">Valid until</label><input type="date" class="input input-bordered w-full"/></div> <div><label class="label label-text">Currency</label><input class="input input-bordered w-full" maxlength="3"/></div> <div><label class="label label-text">Discount %</label><input type="number" step="0.01" class="input input-bordered w-full"/></div></div> <div class="mt-4"><div class="flex items-center justify-between mb-2"><span class="font-medium">Lines</span><button class="btn btn-ghost btn-xs gap-1"><!> Add</button></div> <table class="table table-xs"><thead><tr><th>Description</th><th>Qty</th><th>Price</th><th>VAT %</th><th class="text-right">Total</th><th></th></tr></thead><tbody></tbody></table> <div class="text-right mt-2 text-lg font-semibold"> </div></div> <div class="flex justify-end gap-2 mt-6"><button class="btn btn-ghost">Cancel</button><button class="btn btn-primary"> </button></div></div></div>'), de = t.from_html('<div class="p-6 space-y-4"><header class="flex items-center justify-between"><h1 class="text-2xl font-semibold flex items-center gap-2"><!> Quotes</h1> <button class="btn btn-primary btn-sm gap-2"><!> New quote</button></header> <!> <select class="select select-sm select-bordered max-w-xs"><option>All</option><option>Draft</option><option>Sent</option><option>Accepted</option><option>Rejected</option><option>Expired</option></select> <div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Number</th><th>Client</th><th>Valid until</th><th class="text-right">Total</th><th>Status</th><th></th></tr></thead><tbody><!></tbody></table></div></div> <!>', 1);
function ce(u, a) {
  var kt;
  t.push(a, !0);
  const h = ((kt = window.__zveltio) == null ? void 0 : kt.engineUrl) ?? "";
  let c = t.state(t.proxy([])), o = t.state(t.proxy([])), v = t.state(""), r = t.state("all"), d = t.state(!1), y = t.state(!1), i = t.proxy({
    client_id: "",
    client_name: "",
    valid_until: new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10),
    currency: "RON",
    discount_percent: 0,
    notes: "",
    lines: [
      { description: "", quantity: 1, unit_price: 0, tax_rate: 19 }
    ]
  });
  async function N(e, n) {
    const g = await fetch(`${h}${e}`, { credentials: "include", ...n }), x = await g.json().catch(() => ({}));
    if (!g.ok) throw new Error(x.error || `HTTP ${g.status}`);
    return x;
  }
  async function w() {
    try {
      const e = new URLSearchParams();
      t.get(r) !== "all" && e.set("status", t.get(r));
      const n = await N(`/api/quotes?${e}`);
      t.set(c, n.data ?? [], !0);
    } catch (e) {
      t.set(v, e.message, !0);
    }
  }
  async function Y() {
    try {
      const e = await N("/api/contacts?limit=200");
      t.set(
        o,
        (e.data ?? []).map((n) => ({
          id: n.id,
          label: `${n.first_name ?? ""} ${n.last_name ?? ""}`.trim()
        })),
        !0
      );
    } catch {
      t.set(o, [], !0);
    }
  }
  function U() {
    i.lines = [
      ...i.lines,
      { description: "", quantity: 1, unit_price: 0, tax_rate: 19 }
    ];
  }
  function tt(e) {
    i.lines = i.lines.filter((n, g) => g !== e);
  }
  function B(e) {
    return e.quantity * e.unit_price * (1 - i.discount_percent / 100) * (1 + e.tax_rate / 100);
  }
  let E = t.derived(() => i.lines.reduce((e, n) => e + B(n), 0));
  async function et() {
    t.set(y, !0), t.set(v, "");
    try {
      await N("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(i)
      }), t.set(d, !1), i.lines = [
        { description: "", quantity: 1, unit_price: 0, tax_rate: 19 }
      ], i.client_name = "", i.client_id = "", await w();
    } catch (e) {
      t.set(v, e.message, !0);
    } finally {
      t.set(y, !1);
    }
  }
  async function at(e) {
    try {
      await N(`/api/quotes/${e}/send`, { method: "POST" }), await w();
    } catch (n) {
      t.set(v, n.message, !0);
    }
  }
  async function gt(e) {
    try {
      await N(`/api/quotes/${e}/convert-to-invoice`, { method: "POST" }), await w();
    } catch (n) {
      t.set(v, n.message, !0);
    }
  }
  t.user_effect(() => {
    t.get(r), w();
  }), Bt(() => {
    w(), Y();
  });
  function it(e, n = "RON") {
    return new Intl.NumberFormat("ro-RO", { style: "currency", currency: n }).format(e);
  }
  function zt(e) {
    return {
      draft: "badge-ghost",
      sent: "badge-info",
      accepted: "badge-success",
      rejected: "badge-error",
      expired: "badge-warning"
    }[e] ?? "badge-ghost";
  }
  var ft = de(), nt = t.first_child(ft), rt = t.child(nt), st = t.child(rt), Ot = t.child(st);
  Xt(Ot, { class: "h-6 w-6" }), t.next(), t.reset(st);
  var lt = t.sibling(st, 2), qt = t.child(lt);
  Tt(qt, { class: "h-4 w-4" }), t.next(), t.reset(lt), t.reset(rt);
  var mt = t.sibling(rt, 2);
  {
    var At = (e) => {
      var n = Kt(), g = t.child(n, !0);
      t.reset(n), t.template_effect(() => t.set_text(g, t.get(v))), t.append(e, n);
    };
    t.if(mt, (e) => {
      t.get(v) && e(At);
    });
  }
  var J = t.sibling(mt, 2), ot = t.child(J);
  ot.value = ot.__value = "all";
  var dt = t.sibling(ot);
  dt.value = dt.__value = "draft";
  var ct = t.sibling(dt);
  ct.value = ct.__value = "sent";
  var ut = t.sibling(ct);
  ut.value = ut.__value = "accepted";
  var pt = t.sibling(ut);
  pt.value = pt.__value = "rejected";
  var xt = t.sibling(pt);
  xt.value = xt.__value = "expired", t.reset(J);
  var yt = t.sibling(J, 2), wt = t.child(yt), $t = t.sibling(t.child(wt)), Ft = t.child($t);
  {
    var Ht = (e) => {
      var n = Yt();
      t.append(e, n);
    }, Rt = (e) => {
      var n = t.comment(), g = t.first_child(n);
      t.each(g, 17, () => t.get(c), (x) => x.id, (x, p) => {
        var q = ae(), S = t.child(q), A = t.child(S, !0);
        t.reset(S);
        var F = t.sibling(S), vt = t.child(F, !0);
        t.reset(F);
        var H = t.sibling(F), R = t.child(H, !0);
        t.reset(H);
        var P = t.sibling(H), W = t.child(P, !0);
        t.reset(P);
        var j = t.sibling(P), T = t.child(j), X = t.child(T, !0);
        t.reset(T), t.reset(j);
        var C = t.sibling(j), z = t.child(C);
        {
          var D = (f) => {
            var _ = te(), L = t.child(_);
            Gt(L, { class: "h-3 w-3" }), t.next(), t.reset(_), t.delegated("click", _, () => at(t.get(p).id)), t.append(f, _);
          };
          t.if(z, (f) => {
            t.get(p).status === "draft" && f(D);
          });
        }
        var _t = t.sibling(z);
        {
          var I = (f) => {
            var _ = ee(), L = t.child(_);
            Zt(L, { class: "h-3 w-3" }), t.next(), t.reset(_), t.delegated("click", _, () => gt(t.get(p).id)), t.append(f, _);
          };
          t.if(_t, (f) => {
            t.get(p).status === "accepted" && f(I);
          });
        }
        t.reset(C), t.reset(q), t.template_effect(
          (f, _) => {
            t.set_text(A, t.get(p).number), t.set_text(vt, t.get(p).client_name), t.set_text(R, t.get(p).valid_until), t.set_text(W, f), t.set_class(T, 1, `badge ${_ ?? ""} badge-sm`), t.set_text(X, t.get(p).status);
          },
          [
            () => it(Number(t.get(p).total), t.get(p).currency),
            () => zt(t.get(p).status)
          ]
        ), t.append(x, q);
      }), t.append(e, n);
    };
    t.if(Ft, (e) => {
      t.get(c).length === 0 ? e(Ht) : e(Rt, -1);
    });
  }
  t.reset($t), t.reset(wt), t.reset(yt), t.reset(nt);
  var Wt = t.sibling(nt, 2);
  {
    var Dt = (e) => {
      var n = oe(), g = t.child(n), x = t.child(g), p = t.sibling(t.child(x)), q = t.child(p);
      Ct(q, { class: "h-4 w-4" }), t.reset(p), t.reset(x);
      var S = t.sibling(x, 2), A = t.child(S), F = t.sibling(t.child(A), 2);
      {
        var vt = (s) => {
          var l = ne(), M = t.child(l);
          M.value = M.__value = "";
          var Q = t.sibling(M);
          t.each(Q, 17, () => t.get(o), (m) => m.id, (m, k) => {
            var $ = ie(), G = t.child($, !0);
            t.reset($);
            var O = {};
            t.template_effect(() => {
              t.set_text(G, t.get(k).label), O !== (O = t.get(k).id) && ($.value = ($.__value = t.get(k).id) ?? "");
            }), t.append(m, $);
          }), t.reset(l), t.delegated("change", l, () => {
            const m = t.get(o).find((k) => k.id === i.client_id);
            m && (i.client_name = m.label);
          }), t.bind_select_value(l, () => i.client_id, (m) => i.client_id = m), t.append(s, l);
        }, H = (s) => {
          var l = re();
          t.remove_input_defaults(l), t.bind_value(l, () => i.client_name, (M) => i.client_name = M), t.append(s, l);
        };
        t.if(F, (s) => {
          t.get(o).length > 0 ? s(vt) : s(H, -1);
        });
      }
      t.reset(A);
      var R = t.sibling(A, 2), P = t.sibling(t.child(R));
      t.remove_input_defaults(P), t.reset(R);
      var W = t.sibling(R, 2), j = t.sibling(t.child(W));
      t.remove_input_defaults(j), t.reset(W);
      var T = t.sibling(W, 2), X = t.sibling(t.child(T));
      t.remove_input_defaults(X), t.reset(T), t.reset(S);
      var C = t.sibling(S, 2), z = t.child(C), D = t.sibling(t.child(z)), _t = t.child(D);
      Tt(_t, { class: "h-3 w-3" }), t.next(), t.reset(D), t.reset(z);
      var I = t.sibling(z, 2), f = t.sibling(t.child(I));
      t.each(f, 21, () => i.lines, t.index, (s, l, M) => {
        var Q = le(), m = t.child(Q), k = t.child(m);
        t.remove_input_defaults(k), t.reset(m);
        var $ = t.sibling(m), G = t.child($);
        t.remove_input_defaults(G), t.reset($);
        var O = t.sibling($), Mt = t.child(O);
        t.remove_input_defaults(Mt), t.reset(O);
        var ht = t.sibling(O), Pt = t.child(ht);
        t.remove_input_defaults(Pt), t.reset(ht);
        var bt = t.sibling(ht), Lt = t.child(bt, !0);
        t.reset(bt);
        var jt = t.sibling(bt), Qt = t.child(jt);
        {
          var Vt = (b) => {
            var K = se(), Ut = t.child(K);
            Ct(Ut, { class: "h-3 w-3" }), t.reset(K), t.delegated("click", K, () => tt(M)), t.append(b, K);
          };
          t.if(Qt, (b) => {
            i.lines.length > 1 && b(Vt);
          });
        }
        t.reset(jt), t.reset(Q), t.template_effect((b) => t.set_text(Lt, b), [() => it(B(t.get(l)), i.currency)]), t.bind_value(k, () => t.get(l).description, (b) => t.get(l).description = b), t.bind_value(G, () => t.get(l).quantity, (b) => t.get(l).quantity = b), t.bind_value(Mt, () => t.get(l).unit_price, (b) => t.get(l).unit_price = b), t.bind_value(Pt, () => t.get(l).tax_rate, (b) => t.get(l).tax_rate = b), t.append(s, Q);
      }), t.reset(f), t.reset(I);
      var _ = t.sibling(I, 2), L = t.child(_);
      t.reset(_), t.reset(C);
      var Nt = t.sibling(C, 2), St = t.child(Nt), Z = t.sibling(St), It = t.child(Z, !0);
      t.reset(Z), t.reset(Nt), t.reset(g), t.reset(n), t.template_effect(
        (s) => {
          t.set_text(L, `Total: ${s ?? ""}`), Z.disabled = t.get(y) || !i.client_name, t.set_text(It, t.get(y) ? "Saving…" : "Create");
        },
        [() => it(t.get(E), i.currency)]
      ), t.delegated("click", n, (s) => s.target === s.currentTarget && t.set(d, !1)), t.delegated("click", p, () => t.set(d, !1)), t.bind_value(P, () => i.valid_until, (s) => i.valid_until = s), t.bind_value(j, () => i.currency, (s) => i.currency = s), t.bind_value(X, () => i.discount_percent, (s) => i.discount_percent = s), t.delegated("click", D, U), t.delegated("click", St, () => t.set(d, !1)), t.delegated("click", Z, et), t.append(e, n);
    };
    t.if(Wt, (e) => {
      t.get(d) && e(Dt);
    });
  }
  t.delegated("click", lt, () => t.set(d, !0)), t.bind_select_value(J, () => t.get(r), (e) => t.set(r, e)), t.append(u, ft), t.pop();
}
t.delegate(["click", "change"]);
function ue() {
  const u = window.__zveltio;
  u && u.registerRoute({
    path: "quotes",
    component: ce,
    label: "Quotes",
    icon: "FileSignature",
    category: "finance"
  });
}
ue();
export {
  ue as default
};
