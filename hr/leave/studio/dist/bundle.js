import "svelte/internal/disclose-version";
import * as e from "svelte/internal/client";
import { onMount as xe } from "svelte";
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
const we = {
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
var ke = e.from_svg("<svg><!><!></svg>");
function K(c, a) {
  e.push(a, !0);
  const g = e.prop(a, "color", 3, "currentColor"), d = e.prop(a, "size", 3, 24), p = e.prop(a, "strokeWidth", 3, 2), m = e.prop(a, "absoluteStrokeWidth", 3, !1), i = e.prop(a, "iconNode", 19, () => []), n = e.rest_props(a, [
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
  var b = ke();
  e.attribute_effect(
    b,
    (l) => ({
      ...we,
      ...n,
      width: d(),
      height: d(),
      stroke: g(),
      "stroke-width": l,
      class: [
        "lucide-icon lucide",
        a.name && `lucide-${a.name}`,
        a.class
      ]
    }),
    [
      () => m() ? Number(p()) * 24 / Number(d()) : p()
    ]
  );
  var f = e.child(b);
  e.each(f, 17, i, e.index, (l, x) => {
    var w = e.derived(() => e.to_array(e.get(x), 2));
    let Q = () => e.get(w)[0], B = () => e.get(w)[1];
    var D = e.comment(), H = e.first_child(D);
    e.element(H, Q, !0, (T, I) => {
      e.attribute_effect(T, () => ({ ...B() }));
    }), e.append(l, D);
  });
  var P = e.sibling(f);
  e.snippet(P, () => a.children ?? e.noop), e.reset(b), e.append(c, b), e.pop();
}
function $e(c, a) {
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
  let g = e.rest_props(a, ["$$slots", "$$events", "$$legacy"]);
  const d = [
    ["path", { d: "M8 2v4" }],
    ["path", { d: "M16 2v4" }],
    [
      "rect",
      { width: "18", height: "18", x: "3", y: "4", rx: "2" }
    ],
    ["path", { d: "M3 10h18" }],
    ["path", { d: "M8 14h.01" }],
    ["path", { d: "M12 14h.01" }],
    ["path", { d: "M16 14h.01" }],
    ["path", { d: "M8 18h.01" }],
    ["path", { d: "M12 18h.01" }],
    ["path", { d: "M16 18h.01" }]
  ];
  K(c, e.spread_props({ name: "calendar-days" }, () => g, {
    get iconNode() {
      return d;
    },
    children: (p, m) => {
      var i = e.comment(), n = e.first_child(i);
      e.snippet(n, () => a.children ?? e.noop), e.append(p, i);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function Ne(c, a) {
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
  let g = e.rest_props(a, ["$$slots", "$$events", "$$legacy"]);
  const d = [["path", { d: "M20 6 9 17l-5-5" }]];
  K(c, e.spread_props({ name: "check" }, () => g, {
    get iconNode() {
      return d;
    },
    children: (p, m) => {
      var i = e.comment(), n = e.first_child(i);
      e.snippet(n, () => a.children ?? e.noop), e.append(p, i);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function Me(c, a) {
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
  let g = e.rest_props(a, ["$$slots", "$$events", "$$legacy"]);
  const d = [["path", { d: "M5 12h14" }], ["path", { d: "M12 5v14" }]];
  K(c, e.spread_props({ name: "plus" }, () => g, {
    get iconNode() {
      return d;
    },
    children: (p, m) => {
      var i = e.comment(), n = e.first_child(i);
      e.snippet(n, () => a.children ?? e.noop), e.append(p, i);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function ve(c, a) {
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
  let g = e.rest_props(a, ["$$slots", "$$events", "$$legacy"]);
  const d = [
    ["path", { d: "M18 6 6 18" }],
    ["path", { d: "m6 6 12 12" }]
  ];
  K(c, e.spread_props({ name: "x" }, () => g, {
    get iconNode() {
      return d;
    },
    children: (p, m) => {
      var i = e.comment(), n = e.first_child(i);
      e.snippet(n, () => a.children ?? e.noop), e.append(p, i);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
var je = e.from_html('<div class="alert alert-error"> </div>'), Pe = e.from_html('<tr><td colspan="7" class="text-center py-6 text-base-content/60">Loading…</td></tr>'), qe = e.from_html('<tr><td colspan="7" class="text-center py-6 text-base-content/60">No requests.</td></tr>'), Se = e.from_html('<button class="btn btn-ghost btn-xs" title="Approve"><!></button> <button class="btn btn-ghost btn-xs" title="Reject"><!></button>', 1), Te = e.from_html("<tr><td> </td><td> </td><td> </td><td> </td><td> </td><td><span> </span></td><td><!></td></tr>"), ze = e.from_html("<option> </option>"), Ce = e.from_html("<option> </option>"), Le = e.from_html('<div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><div class="bg-base-100 rounded-xl p-6 w-full max-w-md"><div class="flex items-center justify-between mb-4"><h2 class="text-xl font-semibold">New leave request</h2> <button class="btn btn-ghost btn-sm btn-square"><!></button></div> <div class="space-y-3"><div><label class="label label-text">Employee</label> <select class="select select-bordered w-full"><option>—</option><!></select></div> <div><label class="label label-text">Leave type</label> <select class="select select-bordered w-full"><option>—</option><!></select></div> <div><label class="label label-text">Start date</label><input type="date" class="input input-bordered w-full"/></div> <div><label class="label label-text">End date</label><input type="date" class="input input-bordered w-full"/></div> <div><label class="label label-text">Reason</label><textarea class="textarea textarea-bordered w-full"></textarea></div></div> <div class="flex justify-end gap-2 mt-4"><button class="btn btn-ghost">Cancel</button> <button class="btn btn-primary"> </button></div></div></div>'), Re = e.from_html('<div class="p-6 space-y-4"><header class="flex items-center justify-between"><h1 class="text-2xl font-semibold flex items-center gap-2"><!> Leave</h1> <button class="btn btn-primary btn-sm gap-2"><!> New request</button></header> <!> <div class="flex gap-3"><select class="select select-sm select-bordered"><option>All</option><option>Pending</option><option>Approved</option><option>Rejected</option></select></div> <div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Employee</th><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Status</th><th></th></tr></thead><tbody><!></tbody></table></div></div> <!>', 1);
function We(c, a) {
  var ce;
  e.push(a, !0);
  const g = ((ce = window.__zveltio) == null ? void 0 : ce.engineUrl) ?? "";
  let d = e.state(e.proxy([])), p = e.state(e.proxy([])), m = e.state(e.proxy([])), i = e.state(!1), n = e.state(""), b = e.state("all"), f = e.state(!1), P = e.state(!1), l = e.state(e.proxy({
    employee_id: "",
    leave_type_id: "",
    start_date: "",
    end_date: "",
    reason: ""
  }));
  async function x(t, r) {
    const v = await fetch(`${g}${t}`, { credentials: "include", ...r }), h = await v.json().catch(() => ({}));
    if (!v.ok) throw new Error(h.error || `HTTP ${v.status}`);
    return h;
  }
  async function w() {
    e.set(i, !0), e.set(n, "");
    try {
      const t = new URLSearchParams();
      e.get(b) !== "all" && t.set("status", e.get(b));
      const [r, v, h] = await Promise.all([
        x(`/api/leave/requests?${t}`),
        x("/api/hr?limit=200"),
        x("/api/leave/types")
      ]);
      e.set(d, r.data ?? [], !0), e.set(p, v.data ?? [], !0), e.set(m, h.data ?? [], !0);
    } catch (t) {
      e.set(n, t.message, !0);
    } finally {
      e.set(i, !1);
    }
  }
  async function Q() {
    e.set(P, !0), e.set(n, "");
    try {
      await x("/api/leave/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(e.get(l))
      }), e.set(f, !1), e.set(
        l,
        {
          employee_id: "",
          leave_type_id: "",
          start_date: "",
          end_date: "",
          reason: ""
        },
        !0
      ), await w();
    } catch (t) {
      e.set(n, t.message, !0);
    } finally {
      e.set(P, !1);
    }
  }
  async function B(t, r) {
    try {
      await x(`/api/leave/requests/${t}/${r ? "approve" : "reject"}`, { method: "POST" }), await w();
    } catch (v) {
      e.set(n, v.message, !0);
    }
  }
  xe(w), e.user_effect(() => {
    e.get(b), w();
  });
  function D(t) {
    return {
      pending: "badge-warning",
      approved: "badge-success",
      rejected: "badge-error",
      cancelled: "badge-ghost"
    }[t] ?? "badge-ghost";
  }
  var H = Re(), T = e.first_child(H), I = e.child(T), V = e.child(I), pe = e.child(V);
  $e(pe, { class: "h-6 w-6" }), e.next(), e.reset(V);
  var Y = e.sibling(V, 2), _e = e.child(Y);
  Me(_e, { class: "h-4 w-4" }), e.next(), e.reset(Y), e.reset(I);
  var le = e.sibling(I, 2);
  {
    var he = (t) => {
      var r = je(), v = e.child(r, !0);
      e.reset(r), e.template_effect(() => e.set_text(v, e.get(n))), e.append(t, r);
    };
    e.if(le, (t) => {
      e.get(n) && t(he);
    });
  }
  var Z = e.sibling(le, 2), ee = e.child(Z), te = e.child(ee);
  te.value = te.__value = "all";
  var ae = e.sibling(te);
  ae.value = ae.__value = "pending";
  var se = e.sibling(ae);
  se.value = se.__value = "approved";
  var ie = e.sibling(se);
  ie.value = ie.__value = "rejected", e.reset(ee), e.reset(Z);
  var ne = e.sibling(Z, 2), de = e.child(ne), oe = e.sibling(e.child(de)), ue = e.child(oe);
  {
    var ge = (t) => {
      var r = Pe();
      e.append(t, r);
    }, be = (t) => {
      var r = qe();
      e.append(t, r);
    }, fe = (t) => {
      var r = e.comment(), v = e.first_child(r);
      e.each(v, 17, () => e.get(d), (h) => h.id, (h, o) => {
        var z = Te(), k = e.child(z), C = e.child(k, !0);
        e.reset(k);
        var $ = e.sibling(k), L = e.child($, !0);
        e.reset($);
        var R = e.sibling($), W = e.child(R, !0);
        e.reset(R);
        var N = e.sibling(R), A = e.child(N, !0);
        e.reset(N);
        var E = e.sibling(N), F = e.child(E, !0);
        e.reset(E);
        var q = e.sibling(E), M = e.child(q), J = e.child(M, !0);
        e.reset(M), e.reset(q);
        var O = e.sibling(q), X = e.child(O);
        {
          var G = (y) => {
            var j = Se(), S = e.first_child(j), s = e.child(S);
            Ne(s, { class: "h-3.5 w-3.5" }), e.reset(S);
            var u = e.sibling(S, 2), _ = e.child(u);
            ve(_, { class: "h-3.5 w-3.5" }), e.reset(u), e.delegated("click", S, () => B(e.get(o).id, !0)), e.delegated("click", u, () => B(e.get(o).id, !1)), e.append(y, j);
          };
          e.if(X, (y) => {
            e.get(o).status === "pending" && y(G);
          });
        }
        e.reset(O), e.reset(z), e.template_effect(
          (y) => {
            e.set_text(C, e.get(o).employee_name ?? e.get(o).employee_id), e.set_text(L, e.get(o).leave_type_name ?? "—"), e.set_text(W, e.get(o).start_date), e.set_text(A, e.get(o).end_date), e.set_text(F, e.get(o).working_days ?? "—"), e.set_class(M, 1, `badge ${y ?? ""} badge-sm`), e.set_text(J, e.get(o).status);
          },
          [() => D(e.get(o).status)]
        ), e.append(h, z);
      }), e.append(t, r);
    };
    e.if(ue, (t) => {
      e.get(i) ? t(ge) : e.get(d).length === 0 ? t(be, 1) : t(fe, -1);
    });
  }
  e.reset(oe), e.reset(de), e.reset(ne), e.reset(T);
  var me = e.sibling(T, 2);
  {
    var ye = (t) => {
      var r = Le(), v = e.child(r), h = e.child(v), o = e.sibling(e.child(h), 2), z = e.child(o);
      ve(z, { class: "h-4 w-4" }), e.reset(o), e.reset(h);
      var k = e.sibling(h, 2), C = e.child(k), $ = e.sibling(e.child(C), 2), L = e.child($);
      L.value = L.__value = "";
      var R = e.sibling(L);
      e.each(R, 17, () => e.get(p), (s) => s.id, (s, u) => {
        var _ = ze(), re = e.child(_);
        e.reset(_);
        var U = {};
        e.template_effect(() => {
          e.set_text(re, `${e.get(u).first_name ?? ""} ${e.get(u).last_name ?? ""}`), U !== (U = e.get(u).id) && (_.value = (_.__value = e.get(u).id) ?? "");
        }), e.append(s, _);
      }), e.reset($), e.reset(C);
      var W = e.sibling(C, 2), N = e.sibling(e.child(W), 2), A = e.child(N);
      A.value = A.__value = "";
      var E = e.sibling(A);
      e.each(E, 17, () => e.get(m), (s) => s.id, (s, u) => {
        var _ = Ce(), re = e.child(_, !0);
        e.reset(_);
        var U = {};
        e.template_effect(() => {
          e.set_text(re, e.get(u).name), U !== (U = e.get(u).id) && (_.value = (_.__value = e.get(u).id) ?? "");
        }), e.append(s, _);
      }), e.reset(N), e.reset(W);
      var F = e.sibling(W, 2), q = e.sibling(e.child(F));
      e.remove_input_defaults(q), e.reset(F);
      var M = e.sibling(F, 2), J = e.sibling(e.child(M));
      e.remove_input_defaults(J), e.reset(M);
      var O = e.sibling(M, 2), X = e.sibling(e.child(O));
      e.remove_textarea_child(X), e.reset(O), e.reset(k);
      var G = e.sibling(k, 2), y = e.child(G), j = e.sibling(y, 2), S = e.child(j, !0);
      e.reset(j), e.reset(G), e.reset(v), e.reset(r), e.template_effect(() => {
        j.disabled = e.get(P) || !e.get(l).employee_id || !e.get(l).start_date || !e.get(l).end_date, e.set_text(S, e.get(P) ? "Saving…" : "Submit request");
      }), e.delegated("click", r, (s) => s.target === s.currentTarget && e.set(f, !1)), e.delegated("click", o, () => e.set(f, !1)), e.bind_select_value($, () => e.get(l).employee_id, (s) => e.get(l).employee_id = s), e.bind_select_value(N, () => e.get(l).leave_type_id, (s) => e.get(l).leave_type_id = s), e.bind_value(q, () => e.get(l).start_date, (s) => e.get(l).start_date = s), e.bind_value(J, () => e.get(l).end_date, (s) => e.get(l).end_date = s), e.bind_value(X, () => e.get(l).reason, (s) => e.get(l).reason = s), e.delegated("click", y, () => e.set(f, !1)), e.delegated("click", j, Q), e.append(t, r);
    };
    e.if(me, (t) => {
      e.get(f) && t(ye);
    });
  }
  e.delegated("click", Y, () => e.set(f, !0)), e.bind_select_value(ee, () => e.get(b), (t) => e.set(b, t)), e.append(c, H), e.pop();
}
e.delegate(["click"]);
function Ae() {
  const c = window.__zveltio;
  c && c.registerRoute({
    path: "hr-leave",
    component: We,
    label: "Leave Management",
    icon: "CalendarDays",
    category: "hr"
  });
}
Ae();
export {
  Ae as default
};
