import "svelte/internal/disclose-version";
import * as e from "svelte/internal/client";
import { onMount as ke } from "svelte";
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
const Pe = {
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
var $e = e.from_svg("<svg><!><!></svg>");
function K(p, r) {
  e.push(r, !0);
  const b = e.prop(r, "color", 3, "currentColor"), d = e.prop(r, "size", 3, 24), o = e.prop(r, "strokeWidth", 3, 2), l = e.prop(r, "absoluteStrokeWidth", 3, !1), c = e.prop(r, "iconNode", 19, () => []), s = e.rest_props(r, [
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
  var m = $e();
  e.attribute_effect(
    m,
    (x) => ({
      ...Pe,
      ...s,
      width: d(),
      height: d(),
      stroke: b(),
      "stroke-width": x,
      class: [
        "lucide-icon lucide",
        r.name && `lucide-${r.name}`,
        r.class
      ]
    }),
    [
      () => l() ? Number(o()) * 24 / Number(d()) : o()
    ]
  );
  var w = e.child(m);
  e.each(w, 17, c, e.index, (x, z) => {
    var W = e.derived(() => e.to_array(e.get(z), 2));
    let A = () => e.get(W)[0], G = () => e.get(W)[1];
    var T = e.comment(), N = e.first_child(T);
    e.element(N, A, !0, (E, O) => {
      e.attribute_effect(E, () => ({ ...G() }));
    }), e.append(x, T);
  });
  var v = e.sibling(w);
  e.snippet(v, () => r.children ?? e.noop), e.reset(m), e.append(p, m), e.pop();
}
function Se(p, r) {
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
  let b = e.rest_props(r, ["$$slots", "$$events", "$$legacy"]);
  const d = [
    ["path", { d: "M12 15V3" }],
    ["path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }],
    ["path", { d: "m7 10 5 5 5-5" }]
  ];
  K(p, e.spread_props({ name: "download" }, () => b, {
    get iconNode() {
      return d;
    },
    children: (o, l) => {
      var c = e.comment(), s = e.first_child(c);
      e.snippet(s, () => r.children ?? e.noop), e.append(o, c);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function se(p, r) {
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
  let b = e.rest_props(r, ["$$slots", "$$events", "$$legacy"]);
  const d = [["path", { d: "M5 12h14" }], ["path", { d: "M12 5v14" }]];
  K(p, e.spread_props({ name: "plus" }, () => b, {
    get iconNode() {
      return d;
    },
    children: (o, l) => {
      var c = e.comment(), s = e.first_child(c);
      e.snippet(s, () => r.children ?? e.noop), e.append(o, c);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function Me(p, r) {
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
  let b = e.rest_props(r, ["$$slots", "$$events", "$$legacy"]);
  const d = [
    [
      "path",
      {
        d: "M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"
      }
    ],
    ["path", { d: "M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" }]
  ];
  K(p, e.spread_props({ name: "wallet" }, () => b, {
    get iconNode() {
      return d;
    },
    children: (o, l) => {
      var c = e.comment(), s = e.first_child(c);
      e.snippet(s, () => r.children ?? e.noop), e.append(o, c);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
var je = e.from_html('<div class="alert alert-error"> </div>'), Ce = e.from_html('<li><button><div><div class="font-medium"> </div> <div class="text-xs opacity-60"> </div> <div class="text-xs"><span class="badge badge-xs"> </span></div></div></button></li>'), We = e.from_html('<p class="text-base-content/60 text-center py-12">Select a period to view payroll entries.</p>'), ze = e.from_html('<tr><td colspan="6" class="text-center py-6 text-base-content/60">No entries — click "Generate".</td></tr>'), Te = e.from_html('<tr><td> </td><td class="text-right"> </td><td class="text-right"> </td><td class="text-right"> </td><td class="text-right"> </td><td class="text-right font-medium"> </td></tr>'), Ee = e.from_html('<div class="flex items-center justify-between mb-4"><h2 class="text-lg font-medium">Entries</h2> <div class="flex gap-2"><button class="btn btn-sm gap-1"><!> Generate from active employees</button> <button class="btn btn-sm gap-1"><!> Revisal XML</button></div></div> <div class="overflow-x-auto"><table class="table table-sm"><thead><tr><th>Employee</th><th class="text-right">Gross</th><th class="text-right">CAS (25%)</th><th class="text-right">CASS (10%)</th><th class="text-right">Income tax (10%)</th><th class="text-right">Net</th></tr></thead><tbody><!></tbody></table></div>', 1), Oe = e.from_html('<div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><div class="bg-base-100 rounded-xl p-6 w-full max-w-md"><h2 class="text-xl font-semibold mb-4">New payroll period</h2> <div class="space-y-3"><div><label class="label label-text">Name (e.g. November 2026)</label><input class="input input-bordered w-full"/></div> <div><label class="label label-text">Period start</label><input type="date" class="input input-bordered w-full"/></div> <div><label class="label label-text">Period end</label><input type="date" class="input input-bordered w-full"/></div> <div><label class="label label-text">Pay date</label><input type="date" class="input input-bordered w-full"/></div></div> <div class="flex justify-end gap-2 mt-4"><button class="btn btn-ghost">Cancel</button> <button class="btn btn-primary"> </button></div></div></div>'), Re = e.from_html('<div class="p-6 space-y-4"><header class="flex items-center justify-between"><h1 class="text-2xl font-semibold flex items-center gap-2"><!> Payroll</h1> <button class="btn btn-primary btn-sm gap-2"><!> New period</button></header> <!> <div class="grid grid-cols-12 gap-4"><aside class="col-span-3"><div class="bg-base-100 rounded-lg shadow"><div class="p-3 font-medium border-b">Periods</div> <ul class="menu menu-sm"></ul></div></aside> <main class="col-span-9 bg-base-100 rounded-lg shadow p-4"><!></main></div></div> <!>', 1);
function Ae(p, r) {
  var ae;
  e.push(r, !0);
  const b = ((ae = window.__zveltio) == null ? void 0 : ae.engineUrl) ?? "";
  let d = e.state(e.proxy([])), o = e.state(e.proxy([])), l = e.state(null), c = e.state(!1), s = e.state(""), m = e.state(!1), w = e.state(!1), v = e.state(e.proxy({ name: "", period_start: "", period_end: "", pay_date: "" }));
  async function x(t, a) {
    const i = await fetch(`${b}${t}`, { credentials: "include", ...a }), n = await i.json().catch(() => ({}));
    if (!i.ok) throw new Error(n.error || `HTTP ${i.status}`);
    return n;
  }
  async function z() {
    e.set(c, !0), e.set(s, "");
    try {
      const t = await x("/api/payroll/periods");
      e.set(d, t.data ?? [], !0), !e.get(l) && e.get(d).length > 0 && e.set(l, e.get(d)[0].id, !0);
    } catch (t) {
      e.set(s, t.message, !0);
    } finally {
      e.set(c, !1);
    }
  }
  async function W() {
    if (!e.get(l)) {
      e.set(o, [], !0);
      return;
    }
    try {
      const t = await x(`/api/payroll/periods/${e.get(l)}/entries`);
      e.set(o, t.data ?? [], !0);
    } catch (t) {
      e.set(s, t.message, !0);
    }
  }
  async function A() {
    e.set(w, !0), e.set(s, "");
    try {
      await x("/api/payroll/periods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(e.get(v))
      }), e.set(m, !1), e.set(v, { name: "", period_start: "", period_end: "", pay_date: "" }, !0), await z();
    } catch (t) {
      e.set(s, t.message, !0);
    } finally {
      e.set(w, !1);
    }
  }
  async function G(t) {
    try {
      await x(`/api/payroll/periods/${t}/generate`, { method: "POST" }), await W();
    } catch (a) {
      e.set(s, a.message, !0);
    }
  }
  async function T(t) {
    window.open(`${b}/api/payroll/periods/${t}/revisal-export`, "_blank");
  }
  ke(z), e.user_effect(() => {
    e.get(l), W();
  });
  function N(t, a = "RON") {
    return new Intl.NumberFormat("ro-RO", { style: "currency", currency: a }).format(t);
  }
  var E = Re(), O = e.first_child(E), H = e.child(O), I = e.child(H), ie = e.child(I);
  Me(ie, { class: "h-6 w-6" }), e.next(), e.reset(I);
  var F = e.sibling(I, 2), le = e.child(F);
  se(le, { class: "h-4 w-4" }), e.next(), e.reset(F), e.reset(H);
  var Q = e.sibling(H, 2);
  {
    var de = (t) => {
      var a = je(), i = e.child(a, !0);
      e.reset(a), e.template_effect(() => e.set_text(i, e.get(s))), e.append(t, a);
    };
    e.if(Q, (t) => {
      e.get(s) && t(de);
    });
  }
  var Y = e.sibling(Q, 2), U = e.child(Y), Z = e.child(U), ee = e.sibling(e.child(Z), 2);
  e.each(ee, 21, () => e.get(d), (t) => t.id, (t, a) => {
    var i = Ce(), n = e.child(i);
    let h;
    var k = e.child(n), g = e.child(k), S = e.child(g, !0);
    e.reset(g);
    var f = e.sibling(g, 2), P = e.child(f);
    e.reset(f);
    var y = e.sibling(f, 2), $ = e.child(y), M = e.child($, !0);
    e.reset($), e.reset(y), e.reset(k), e.reset(n), e.reset(i), e.template_effect(() => {
      h = e.set_class(n, 1, "", null, h, { active: e.get(l) === e.get(a).id }), e.set_text(S, e.get(a).name), e.set_text(P, `${e.get(a).period_start ?? ""} → ${e.get(a).period_end ?? ""}`), e.set_text(M, e.get(a).status);
    }), e.delegated("click", n, () => e.set(l, e.get(a).id, !0)), e.append(t, i);
  }), e.reset(ee), e.reset(Z), e.reset(U);
  var te = e.sibling(U, 2), ne = e.child(te);
  {
    var oe = (t) => {
      var a = We();
      e.append(t, a);
    }, ce = (t) => {
      var a = Ee(), i = e.first_child(a), n = e.sibling(e.child(i), 2), h = e.child(n), k = e.child(h);
      se(k, { class: "h-3.5 w-3.5" }), e.next(), e.reset(h);
      var g = e.sibling(h, 2), S = e.child(g);
      Se(S, { class: "h-3.5 w-3.5" }), e.next(), e.reset(g), e.reset(n), e.reset(i);
      var f = e.sibling(i, 2), P = e.child(f), y = e.sibling(e.child(P)), $ = e.child(y);
      {
        var M = (_) => {
          var j = ze();
          e.append(_, j);
        }, R = (_) => {
          var j = e.comment(), u = e.first_child(j);
          e.each(u, 17, () => e.get(o), (V) => V.id, (V, C) => {
            var B = Te(), D = e.child(B), ue = e.child(D, !0);
            e.reset(D);
            var J = e.sibling(D), he = e.child(J, !0);
            e.reset(J);
            var L = e.sibling(J), ge = e.child(L, !0);
            e.reset(L);
            var X = e.sibling(L), _e = e.child(X, !0);
            e.reset(X);
            var q = e.sibling(X), be = e.child(q, !0);
            e.reset(q);
            var re = e.sibling(q), me = e.child(re, !0);
            e.reset(re), e.reset(B), e.template_effect(
              (fe, xe, ye, we, Ne) => {
                e.set_text(ue, e.get(C).employee_name), e.set_text(he, fe), e.set_text(ge, xe), e.set_text(_e, ye), e.set_text(be, we), e.set_text(me, Ne);
              },
              [
                () => N(Number(e.get(C).gross_salary)),
                () => N(Number(e.get(C).cas)),
                () => N(Number(e.get(C).cass)),
                () => N(Number(e.get(C).income_tax)),
                () => N(Number(e.get(C).net_salary))
              ]
            ), e.append(V, B);
          }), e.append(_, j);
        };
        e.if($, (_) => {
          e.get(o).length === 0 ? _(M) : _(R, -1);
        });
      }
      e.reset(y), e.reset(P), e.reset(f), e.delegated("click", h, () => G(e.get(l))), e.delegated("click", g, () => T(e.get(l))), e.append(t, a);
    };
    e.if(ne, (t) => {
      e.get(l) ? t(ce, -1) : t(oe);
    });
  }
  e.reset(te), e.reset(Y), e.reset(O);
  var ve = e.sibling(O, 2);
  {
    var pe = (t) => {
      var a = Oe(), i = e.child(a), n = e.sibling(e.child(i), 2), h = e.child(n), k = e.sibling(e.child(h));
      e.remove_input_defaults(k), e.reset(h);
      var g = e.sibling(h, 2), S = e.sibling(e.child(g));
      e.remove_input_defaults(S), e.reset(g);
      var f = e.sibling(g, 2), P = e.sibling(e.child(f));
      e.remove_input_defaults(P), e.reset(f);
      var y = e.sibling(f, 2), $ = e.sibling(e.child(y));
      e.remove_input_defaults($), e.reset(y), e.reset(n);
      var M = e.sibling(n, 2), R = e.child(M), _ = e.sibling(R, 2), j = e.child(_, !0);
      e.reset(_), e.reset(M), e.reset(i), e.reset(a), e.template_effect(() => {
        _.disabled = e.get(w) || !e.get(v).name, e.set_text(j, e.get(w) ? "Saving…" : "Create");
      }), e.delegated("click", a, (u) => u.target === u.currentTarget && e.set(m, !1)), e.bind_value(k, () => e.get(v).name, (u) => e.get(v).name = u), e.bind_value(S, () => e.get(v).period_start, (u) => e.get(v).period_start = u), e.bind_value(P, () => e.get(v).period_end, (u) => e.get(v).period_end = u), e.bind_value($, () => e.get(v).pay_date, (u) => e.get(v).pay_date = u), e.delegated("click", R, () => e.set(m, !1)), e.delegated("click", _, A), e.append(t, a);
    };
    e.if(ve, (t) => {
      e.get(m) && t(pe);
    });
  }
  e.delegated("click", F, () => e.set(m, !0)), e.append(p, E), e.pop();
}
e.delegate(["click"]);
function Ge() {
  const p = window.__zveltio;
  p && p.registerRoute({
    path: "hr-payroll",
    component: Ae,
    label: "Payroll",
    icon: "Wallet",
    category: "hr"
  });
}
Ge();
export {
  Ge as default
};
