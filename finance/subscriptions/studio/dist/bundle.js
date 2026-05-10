import "svelte/internal/disclose-version";
import * as t from "svelte/internal/client";
import { onMount as ft } from "svelte";
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
const xt = {
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
var yt = t.from_svg("<svg><!><!></svg>");
function Q(g, a) {
  t.push(a, !0);
  const N = t.prop(a, "color", 3, "currentColor"), i = t.prop(a, "size", 3, 24), m = t.prop(a, "strokeWidth", 3, 2), S = t.prop(a, "absoluteStrokeWidth", 3, !1), o = t.prop(a, "iconNode", 19, () => []), c = t.rest_props(a, [
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
  var k = yt();
  t.attribute_effect(
    k,
    (W) => ({
      ...xt,
      ...c,
      width: i(),
      height: i(),
      stroke: N(),
      "stroke-width": W,
      class: [
        "lucide-icon lucide",
        a.name && `lucide-${a.name}`,
        a.class
      ]
    }),
    [
      () => S() ? Number(m()) * 24 / Number(i()) : m()
    ]
  );
  var F = t.child(k);
  t.each(F, 17, o, t.index, (W, U) => {
    var H = t.derived(() => t.to_array(t.get(U), 2));
    let X = () => t.get(H)[0], Y = () => t.get(H)[1];
    var B = t.comment(), G = t.first_child(B);
    t.element(G, X, !0, (E, J) => {
      t.attribute_effect(E, () => ({ ...Y() }));
    }), t.append(W, B);
  });
  var d = t.sibling(F);
  t.snippet(d, () => a.children ?? t.noop), t.reset(k), t.append(g, k), t.pop();
}
function wt(g, a) {
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
  let N = t.rest_props(a, ["$$slots", "$$events", "$$legacy"]);
  const i = [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["line", { x1: "12", x2: "12", y1: "8", y2: "12" }],
    [
      "line",
      { x1: "12", x2: "12.01", y1: "16", y2: "16" }
    ]
  ];
  Q(g, t.spread_props({ name: "circle-alert" }, () => N, {
    get iconNode() {
      return i;
    },
    children: (m, S) => {
      var o = t.comment(), c = t.first_child(o);
      t.snippet(c, () => a.children ?? t.noop), t.append(m, o);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function Nt(g, a) {
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
  let N = t.rest_props(a, ["$$slots", "$$events", "$$legacy"]);
  const i = [["path", { d: "M5 12h14" }], ["path", { d: "M12 5v14" }]];
  Q(g, t.spread_props({ name: "plus" }, () => N, {
    get iconNode() {
      return i;
    },
    children: (m, S) => {
      var o = t.comment(), c = t.first_child(o);
      t.snippet(c, () => a.children ?? t.noop), t.append(m, o);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function kt(g, a) {
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
  let N = t.rest_props(a, ["$$slots", "$$events", "$$legacy"]);
  const i = [
    ["path", { d: "m17 2 4 4-4 4" }],
    ["path", { d: "M3 11v-1a4 4 0 0 1 4-4h14" }],
    ["path", { d: "m7 22-4-4 4-4" }],
    ["path", { d: "M21 13v1a4 4 0 0 1-4 4H3" }]
  ];
  Q(g, t.spread_props({ name: "repeat" }, () => N, {
    get iconNode() {
      return i;
    },
    children: (m, S) => {
      var o = t.comment(), c = t.first_child(o);
      t.snippet(c, () => a.children ?? t.noop), t.append(m, o);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function Pt(g, a) {
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
  let N = t.rest_props(a, ["$$slots", "$$events", "$$legacy"]);
  const i = [
    ["path", { d: "M18 6 6 18" }],
    ["path", { d: "m6 6 12 12" }]
  ];
  Q(g, t.spread_props({ name: "x" }, () => N, {
    get iconNode() {
      return i;
    },
    children: (m, S) => {
      var o = t.comment(), c = t.first_child(o);
      t.snippet(c, () => a.children ?? t.noop), t.append(m, o);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
var St = t.from_html('<button class="btn btn-primary btn-sm gap-2"><!> New plan</button>'), $t = t.from_html('<div class="alert alert-error"> </div>'), Ct = t.from_html('<tr><td colspan="6" class="text-center py-6 text-base-content/60">No subscribers.</td></tr>'), Mt = t.from_html('<tr><td> </td><td> </td><td> </td><td> </td><td class="text-right"> </td><td><span> </span></td></tr>'), Rt = t.from_html('<div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Subscriber</th><th>Plan</th><th>Started</th><th>Next bill</th><th class="text-right">MRR</th><th>Status</th></tr></thead><tbody><!></tbody></table></div>'), jt = t.from_html('<tr><td colspan="5" class="text-center py-6 text-base-content/60">No plans yet.</td></tr>'), zt = t.from_html('<tr><td class="font-mono text-xs"> </td><td> </td><td> </td><td class="text-right"> </td><td> </td></tr>'), Tt = t.from_html('<div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Code</th><th>Name</th><th>Interval</th><th class="text-right">Price</th><th>Trial days</th></tr></thead><tbody><!></tbody></table></div>'), Ot = t.from_html('<tr><td colspan="5" class="text-center py-6 text-base-content/60">No failed payments.</td></tr>'), Wt = t.from_html('<tr><td> </td><td> </td><td> </td><td class="text-right"> </td><td><span class="badge badge-warning badge-sm"> </span></td></tr>'), It = t.from_html('<div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Subscriber</th><th>Attempt #</th><th>Last attempt</th><th class="text-right">Amount</th><th>Status</th></tr></thead><tbody><!></tbody></table></div>'), At = t.from_html('<div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><div class="bg-base-100 rounded-xl p-6 w-full max-w-md"><div class="flex items-center justify-between mb-4"><h2 class="text-xl font-semibold">New plan</h2><button class="btn btn-ghost btn-sm btn-square"><!></button></div> <div class="space-y-3"><div><label class="label label-text">Code</label><input class="input input-bordered w-full font-mono"/></div> <div><label class="label label-text">Name</label><input class="input input-bordered w-full"/></div> <div class="grid grid-cols-2 gap-3"><div><label class="label label-text">Price</label><input type="number" step="0.01" class="input input-bordered w-full"/></div> <div><label class="label label-text">Currency</label><input class="input input-bordered w-full" maxlength="3"/></div></div> <div class="grid grid-cols-2 gap-3"><div><label class="label label-text">Interval</label><select class="select select-bordered w-full"><option>Monthly</option><option>Quarterly</option><option>Yearly</option></select></div> <div><label class="label label-text">Trial days</label><input type="number" class="input input-bordered w-full"/></div></div></div> <div class="flex justify-end gap-2 mt-4"><button class="btn btn-ghost">Cancel</button><button class="btn btn-primary"> </button></div></div></div>'), Ft = t.from_html('<div class="p-6 space-y-4"><header class="flex items-center justify-between"><h1 class="text-2xl font-semibold flex items-center gap-2"><!> Subscriptions</h1> <!></header> <!> <div role="tablist" class="tabs tabs-bordered"><button role="tab">Subscribers</button> <button role="tab">Plans</button> <button role="tab"><!> Dunning</button></div> <!></div> <!>', 1);
function qt(g, a) {
  var nt;
  t.push(a, !0);
  const N = ((nt = window.__zveltio) == null ? void 0 : nt.engineUrl) ?? "";
  let i = t.state("subscribers"), m = t.state(t.proxy([])), S = t.state(t.proxy([])), o = t.state(t.proxy([])), c = t.state(""), k = t.state(!1), F = t.state(!1), d = t.state(t.proxy({
    name: "",
    code: "",
    price: 0,
    currency: "RON",
    interval: "monthly",
    trial_days: 0
  }));
  async function W(e, r) {
    const n = await fetch(`${N}${e}`, { credentials: "include", ...r }), b = await n.json().catch(() => ({}));
    if (!n.ok) throw new Error(b.error || `HTTP ${n.status}`);
    return b;
  }
  async function U() {
    try {
      const e = await W("/api/subscriptions/subscribers");
      t.set(m, e.data ?? [], !0);
    } catch (e) {
      t.set(c, e.message, !0);
    }
  }
  async function H() {
    try {
      const e = await W("/api/subscriptions/plans");
      t.set(S, e.data ?? [], !0);
    } catch (e) {
      t.set(c, e.message, !0);
    }
  }
  async function X() {
    try {
      const e = await W("/api/subscriptions/dunning");
      t.set(o, e.data ?? [], !0);
    } catch (e) {
      t.set(c, e.message, !0);
    }
  }
  async function Y() {
    t.set(F, !0), t.set(c, "");
    try {
      await W("/api/subscriptions/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(t.get(d))
      }), t.set(k, !1), t.set(
        d,
        {
          name: "",
          code: "",
          price: 0,
          currency: "RON",
          interval: "monthly",
          trial_days: 0
        },
        !0
      ), await H();
    } catch (e) {
      t.set(c, e.message, !0);
    } finally {
      t.set(F, !1);
    }
  }
  t.user_effect(() => {
    t.get(i) === "subscribers" ? U() : t.get(i) === "plans" ? H() : X();
  }), ft(U);
  function B(e, r = "RON") {
    return new Intl.NumberFormat("ro-RO", { style: "currency", currency: r }).format(e);
  }
  function G(e) {
    return {
      active: "badge-success",
      trialing: "badge-info",
      past_due: "badge-warning",
      cancelled: "badge-error"
    }[e] ?? "badge-ghost";
  }
  var E = Ft(), J = t.first_child(E), K = t.child(J), V = t.child(K), dt = t.child(V);
  kt(dt, { class: "h-6 w-6" }), t.next(), t.reset(V);
  var ot = t.sibling(V, 2);
  {
    var ct = (e) => {
      var r = St(), n = t.child(r);
      Nt(n, { class: "h-4 w-4" }), t.next(), t.reset(r), t.delegated("click", r, () => t.set(k, !0)), t.append(e, r);
    };
    t.if(ot, (e) => {
      t.get(i) === "plans" && e(ct);
    });
  }
  t.reset(K);
  var rt = t.sibling(K, 2);
  {
    var vt = (e) => {
      var r = $t(), n = t.child(r, !0);
      t.reset(r), t.template_effect(() => t.set_text(n, t.get(c))), t.append(e, r);
    };
    t.if(rt, (e) => {
      t.get(c) && e(vt);
    });
  }
  var Z = t.sibling(rt, 2), tt = t.child(Z);
  let st;
  var et = t.sibling(tt, 2);
  let lt;
  var L = t.sibling(et, 2);
  let it;
  var ut = t.child(L);
  wt(ut, { class: "h-4 w-4" }), t.next(), t.reset(L), t.reset(Z);
  var bt = t.sibling(Z, 2);
  {
    var _t = (e) => {
      var r = Rt(), n = t.child(r), b = t.sibling(t.child(n)), $ = t.child(b);
      {
        var q = (l) => {
          var v = Ct();
          t.append(l, v);
        }, C = (l) => {
          var v = t.comment(), M = t.first_child(v);
          t.each(M, 17, () => t.get(m), (f) => f.id, (f, s) => {
            var _ = Mt(), x = t.child(_), I = t.child(x, !0);
            t.reset(x);
            var y = t.sibling(x), A = t.child(y, !0);
            t.reset(y);
            var p = t.sibling(y), R = t.child(p, !0);
            t.reset(p);
            var h = t.sibling(p), j = t.child(h, !0);
            t.reset(h);
            var w = t.sibling(h), z = t.child(w, !0);
            t.reset(w);
            var T = t.sibling(w), P = t.child(T), D = t.child(P, !0);
            t.reset(P), t.reset(T), t.reset(_), t.template_effect(
              (O, at, u) => {
                t.set_text(I, t.get(s).subscriber_email ?? t.get(s).subscriber_id), t.set_text(A, t.get(s).plan_name), t.set_text(R, O), t.set_text(j, t.get(s).next_billing_date), t.set_text(z, at), t.set_class(P, 1, `badge ${u ?? ""} badge-sm`), t.set_text(D, t.get(s).status);
              },
              [
                () => {
                  var O;
                  return (O = t.get(s).started_at) == null ? void 0 : O.slice(0, 10);
                },
                () => B(Number(t.get(s).mrr ?? t.get(s).price), t.get(s).currency),
                () => G(t.get(s).status)
              ]
            ), t.append(f, _);
          }), t.append(l, v);
        };
        t.if($, (l) => {
          t.get(m).length === 0 ? l(q) : l(C, -1);
        });
      }
      t.reset(b), t.reset(n), t.reset(r), t.append(e, r);
    }, pt = (e) => {
      var r = Tt(), n = t.child(r), b = t.sibling(t.child(n)), $ = t.child(b);
      {
        var q = (l) => {
          var v = jt();
          t.append(l, v);
        }, C = (l) => {
          var v = t.comment(), M = t.first_child(v);
          t.each(M, 17, () => t.get(S), (f) => f.id, (f, s) => {
            var _ = zt(), x = t.child(_), I = t.child(x, !0);
            t.reset(x);
            var y = t.sibling(x), A = t.child(y, !0);
            t.reset(y);
            var p = t.sibling(y), R = t.child(p, !0);
            t.reset(p);
            var h = t.sibling(p), j = t.child(h, !0);
            t.reset(h);
            var w = t.sibling(h), z = t.child(w, !0);
            t.reset(w), t.reset(_), t.template_effect(
              (T) => {
                t.set_text(I, t.get(s).code), t.set_text(A, t.get(s).name), t.set_text(R, t.get(s).interval), t.set_text(j, T), t.set_text(z, t.get(s).trial_days ?? 0);
              },
              [() => B(Number(t.get(s).price), t.get(s).currency)]
            ), t.append(f, _);
          }), t.append(l, v);
        };
        t.if($, (l) => {
          t.get(S).length === 0 ? l(q) : l(C, -1);
        });
      }
      t.reset(b), t.reset(n), t.reset(r), t.append(e, r);
    }, ht = (e) => {
      var r = It(), n = t.child(r), b = t.sibling(t.child(n)), $ = t.child(b);
      {
        var q = (l) => {
          var v = Ot();
          t.append(l, v);
        }, C = (l) => {
          var v = t.comment(), M = t.first_child(v);
          t.each(M, 17, () => t.get(o), (f) => f.id, (f, s) => {
            var _ = Wt(), x = t.child(_), I = t.child(x, !0);
            t.reset(x);
            var y = t.sibling(x), A = t.child(y, !0);
            t.reset(y);
            var p = t.sibling(y), R = t.child(p, !0);
            t.reset(p);
            var h = t.sibling(p), j = t.child(h, !0);
            t.reset(h);
            var w = t.sibling(h), z = t.child(w), T = t.child(z, !0);
            t.reset(z), t.reset(w), t.reset(_), t.template_effect(
              (P, D) => {
                t.set_text(I, t.get(s).subscriber_email), t.set_text(A, t.get(s).attempt_count), t.set_text(R, P), t.set_text(j, D), t.set_text(T, t.get(s).status);
              },
              [
                () => {
                  var P;
                  return (P = t.get(s).last_attempt_at) == null ? void 0 : P.slice(0, 16);
                },
                () => B(Number(t.get(s).amount))
              ]
            ), t.append(f, _);
          }), t.append(l, v);
        };
        t.if($, (l) => {
          t.get(o).length === 0 ? l(q) : l(C, -1);
        });
      }
      t.reset(b), t.reset(n), t.reset(r), t.append(e, r);
    };
    t.if(bt, (e) => {
      t.get(i) === "subscribers" ? e(_t) : t.get(i) === "plans" ? e(pt, 1) : e(ht, -1);
    });
  }
  t.reset(J);
  var gt = t.sibling(J, 2);
  {
    var mt = (e) => {
      var r = At(), n = t.child(r), b = t.child(n), $ = t.sibling(t.child(b)), q = t.child($);
      Pt(q, { class: "h-4 w-4" }), t.reset($), t.reset(b);
      var C = t.sibling(b, 2), l = t.child(C), v = t.sibling(t.child(l));
      t.remove_input_defaults(v), t.reset(l);
      var M = t.sibling(l, 2), f = t.sibling(t.child(M));
      t.remove_input_defaults(f), t.reset(M);
      var s = t.sibling(M, 2), _ = t.child(s), x = t.sibling(t.child(_));
      t.remove_input_defaults(x), t.reset(_);
      var I = t.sibling(_, 2), y = t.sibling(t.child(I));
      t.remove_input_defaults(y), t.reset(I), t.reset(s);
      var A = t.sibling(s, 2), p = t.child(A), R = t.sibling(t.child(p)), h = t.child(R);
      h.value = h.__value = "monthly";
      var j = t.sibling(h);
      j.value = j.__value = "quarterly";
      var w = t.sibling(j);
      w.value = w.__value = "yearly", t.reset(R), t.reset(p);
      var z = t.sibling(p, 2), T = t.sibling(t.child(z));
      t.remove_input_defaults(T), t.reset(z), t.reset(A), t.reset(C);
      var P = t.sibling(C, 2), D = t.child(P), O = t.sibling(D), at = t.child(O, !0);
      t.reset(O), t.reset(P), t.reset(n), t.reset(r), t.template_effect(() => {
        O.disabled = t.get(F) || !t.get(d).code || !t.get(d).name, t.set_text(at, t.get(F) ? "Saving…" : "Create");
      }), t.delegated("click", r, (u) => u.target === u.currentTarget && t.set(k, !1)), t.delegated("click", $, () => t.set(k, !1)), t.bind_value(v, () => t.get(d).code, (u) => t.get(d).code = u), t.bind_value(f, () => t.get(d).name, (u) => t.get(d).name = u), t.bind_value(x, () => t.get(d).price, (u) => t.get(d).price = u), t.bind_value(y, () => t.get(d).currency, (u) => t.get(d).currency = u), t.bind_select_value(R, () => t.get(d).interval, (u) => t.get(d).interval = u), t.bind_value(T, () => t.get(d).trial_days, (u) => t.get(d).trial_days = u), t.delegated("click", D, () => t.set(k, !1)), t.delegated("click", O, Y), t.append(e, r);
    };
    t.if(gt, (e) => {
      t.get(k) && e(mt);
    });
  }
  t.template_effect(() => {
    st = t.set_class(tt, 1, "tab", null, st, { "tab-active": t.get(i) === "subscribers" }), lt = t.set_class(et, 1, "tab", null, lt, { "tab-active": t.get(i) === "plans" }), it = t.set_class(L, 1, "tab gap-2", null, it, { "tab-active": t.get(i) === "dunning" });
  }), t.delegated("click", tt, () => t.set(i, "subscribers")), t.delegated("click", et, () => t.set(i, "plans")), t.delegated("click", L, () => t.set(i, "dunning")), t.append(g, E), t.pop();
}
t.delegate(["click"]);
function Bt() {
  const g = window.__zveltio;
  g && g.registerRoute({
    path: "subscriptions",
    component: qt,
    label: "Subscriptions",
    icon: "Repeat",
    category: "finance"
  });
}
Bt();
export {
  Bt as default
};
