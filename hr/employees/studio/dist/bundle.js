import "svelte/internal/disclose-version";
import * as e from "svelte/internal/client";
import { onMount as Le } from "svelte";
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
const Re = {
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
var qe = e.from_svg("<svg><!><!></svg>");
function G(d, i) {
  e.push(i, !0);
  const u = e.prop(i, "color", 3, "currentColor"), o = e.prop(i, "size", 3, 24), c = e.prop(i, "strokeWidth", 3, 2), m = e.prop(i, "absoluteStrokeWidth", 3, !1), r = e.prop(i, "iconNode", 19, () => []), n = e.rest_props(i, [
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
  var g = qe();
  e.attribute_effect(
    g,
    (y) => ({
      ...Re,
      ...n,
      width: o(),
      height: o(),
      stroke: u(),
      "stroke-width": y,
      class: [
        "lucide-icon lucide",
        i.name && `lucide-${i.name}`,
        i.class
      ]
    }),
    [
      () => m() ? Number(c()) * 24 / Number(o()) : c()
    ]
  );
  var h = e.child(g);
  e.each(h, 17, r, e.index, (y, a) => {
    var x = e.derived(() => e.to_array(e.get(a), 2));
    let w = () => e.get(x)[0], K = () => e.get(x)[1];
    var R = e.comment(), q = e.first_child(R);
    e.element(q, w, !0, (C, B) => {
      e.attribute_effect(C, () => ({ ...K() }));
    }), e.append(y, R);
  });
  var f = e.sibling(h);
  e.snippet(f, () => i.children ?? e.noop), e.reset(g), e.append(d, g), e.pop();
}
function Be(d, i) {
  e.push(i, !0);
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
  let u = e.rest_props(i, ["$$slots", "$$events", "$$legacy"]);
  const o = [["path", { d: "M5 12h14" }], ["path", { d: "M12 5v14" }]];
  G(d, e.spread_props({ name: "plus" }, () => u, {
    get iconNode() {
      return o;
    },
    children: (c, m) => {
      var r = e.comment(), n = e.first_child(r);
      e.snippet(n, () => i.children ?? e.noop), e.append(c, r);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function Je(d, i) {
  e.push(i, !0);
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
  let u = e.rest_props(i, ["$$slots", "$$events", "$$legacy"]);
  const o = [
    ["path", { d: "m21 21-4.34-4.34" }],
    ["circle", { cx: "11", cy: "11", r: "8" }]
  ];
  G(d, e.spread_props({ name: "search" }, () => u, {
    get iconNode() {
      return o;
    },
    children: (c, m) => {
      var r = e.comment(), n = e.first_child(r);
      e.snippet(n, () => i.children ?? e.noop), e.append(c, r);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function Xe(d, i) {
  e.push(i, !0);
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
  let u = e.rest_props(i, ["$$slots", "$$events", "$$legacy"]);
  const o = [
    ["path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }],
    ["path", { d: "M16 3.128a4 4 0 0 1 0 7.744" }],
    ["path", { d: "M22 21v-2a4 4 0 0 0-3-3.87" }],
    ["circle", { cx: "9", cy: "7", r: "4" }]
  ];
  G(d, e.spread_props({ name: "users" }, () => u, {
    get iconNode() {
      return o;
    },
    children: (c, m) => {
      var r = e.comment(), n = e.first_child(r);
      e.snippet(n, () => i.children ?? e.noop), e.append(c, r);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function Ge(d, i) {
  e.push(i, !0);
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
  let u = e.rest_props(i, ["$$slots", "$$events", "$$legacy"]);
  const o = [
    ["path", { d: "M18 6 6 18" }],
    ["path", { d: "m6 6 12 12" }]
  ];
  G(d, e.spread_props({ name: "x" }, () => u, {
    get iconNode() {
      return o;
    },
    children: (c, m) => {
      var r = e.comment(), n = e.first_child(r);
      e.snippet(n, () => i.children ?? e.noop), e.append(c, r);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
var Ke = e.from_html('<div class="alert alert-error"> </div>'), Qe = e.from_html('<tr><td colspan="7" class="text-center py-6 text-base-content/60">Loading…</td></tr>'), Ve = e.from_html('<tr><td colspan="7" class="text-center py-6 text-base-content/60">No employees yet.</td></tr>'), Ye = e.from_html('<tr><td class="font-mono text-xs"> </td><td> </td><td> </td><td> </td><td> </td><td> </td><td><span> </span></td></tr>'), Ze = e.from_html("<option> </option>"), et = e.from_html("<option> </option>"), tt = e.from_html('<div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><div class="bg-base-100 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"><div class="flex items-center justify-between mb-4"><h2 class="text-xl font-semibold">New employee</h2> <button class="btn btn-ghost btn-sm btn-square"><!></button></div> <div class="grid grid-cols-2 gap-3"><div><label class="label label-text">First name</label><input class="input input-bordered w-full"/></div> <div><label class="label label-text">Last name</label><input class="input input-bordered w-full"/></div> <div><label class="label label-text">Email</label><input type="email" class="input input-bordered w-full"/></div> <div><label class="label label-text">Work email</label><input type="email" class="input input-bordered w-full"/></div> <div><label class="label label-text">Phone</label><input class="input input-bordered w-full"/></div> <div><label class="label label-text">Hire date</label><input type="date" class="input input-bordered w-full"/></div> <div><label class="label label-text">Department</label> <select class="select select-bordered w-full"><option>— None —</option><!></select></div> <div><label class="label label-text">Position</label> <select class="select select-bordered w-full"><option>— None —</option><!></select></div> <div><label class="label label-text">Employment type</label> <select class="select select-bordered w-full"><option>Full time</option><option>Part time</option><option>Contractor</option><option>Intern</option></select></div> <div><label class="label label-text">Salary</label><input type="number" step="0.01" class="input input-bordered w-full"/></div> <div><label class="label label-text">Currency</label> <input class="input input-bordered w-full" maxlength="3"/></div> <div class="col-span-2"><label class="label label-text">Address</label><input class="input input-bordered w-full"/></div></div> <div class="flex justify-end gap-2 mt-6"><button class="btn btn-ghost">Cancel</button> <button class="btn btn-primary"> </button></div></div></div>'), at = e.from_html('<div class="p-6 space-y-4"><header class="flex items-center justify-between"><h1 class="text-2xl font-semibold flex items-center gap-2"><!> Employees</h1> <button class="btn btn-primary btn-sm gap-2"><!> New employee</button></header> <!> <div class="flex gap-3 items-center"><div class="join"><input type="text" placeholder="Search name, email..." class="input input-sm input-bordered join-item"/> <button class="btn btn-sm join-item"><!></button></div> <select class="select select-sm select-bordered"><option>All statuses</option><option>Active</option><option>On leave</option><option>Terminated</option></select></div> <div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>#</th><th>Name</th><th>Email</th><th>Department</th><th>Position</th><th>Hire date</th><th>Status</th></tr></thead><tbody><!></tbody></table></div></div> <!>', 1);
function lt(d, i) {
  var xe;
  e.push(i, !0);
  const u = ((xe = window.__zveltio) == null ? void 0 : xe.engineUrl) ?? "";
  let o = e.state(e.proxy([])), c = e.state(e.proxy([])), m = e.state(e.proxy([])), r = e.state(!1), n = e.state(""), g = e.state(""), h = e.state("active"), f = e.state(!1), y = e.state(!1), a = e.state(e.proxy({
    first_name: "",
    last_name: "",
    email: "",
    work_email: "",
    phone: "",
    hire_date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
    department_id: "",
    position_id: "",
    employment_type: "full_time",
    salary: 0,
    salary_type: "gross",
    currency: "RON",
    address: ""
  }));
  async function x(t, s) {
    const v = await fetch(`${u}${t}`, { credentials: "include", ...s }), _ = await v.json().catch(() => ({}));
    if (!v.ok) throw new Error(_.error || `HTTP ${v.status}`);
    return _;
  }
  async function w() {
    e.set(r, !0), e.set(n, "");
    try {
      const t = new URLSearchParams({ limit: "100" });
      e.get(g) && t.set("q", e.get(g)), e.get(h) !== "all" && t.set("status", e.get(h));
      const [s, v, _] = await Promise.all([
        x(`/api/hr?${t}`),
        x("/api/hr/departments"),
        x("/api/hr/positions")
      ]);
      e.set(o, s.data ?? [], !0), e.set(c, v.data ?? [], !0), e.set(m, _.data ?? [], !0);
    } catch (t) {
      e.set(n, t.message, !0);
    } finally {
      e.set(r, !1);
    }
  }
  async function K() {
    e.set(y, !0), e.set(n, "");
    try {
      await x("/api/hr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...e.get(a),
          department_id: e.get(a).department_id || void 0,
          position_id: e.get(a).position_id || void 0,
          salary: e.get(a).salary || void 0
        })
      }), e.set(f, !1), e.set(
        a,
        {
          first_name: "",
          last_name: "",
          email: "",
          work_email: "",
          phone: "",
          hire_date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
          department_id: "",
          position_id: "",
          employment_type: "full_time",
          salary: 0,
          salary_type: "gross",
          currency: "RON",
          address: ""
        },
        !0
      ), await w();
    } catch (t) {
      e.set(n, t.message, !0);
    } finally {
      e.set(y, !1);
    }
  }
  Le(w), e.user_effect(() => {
    e.get(h), w();
  });
  function R(t) {
    return {
      active: "badge-success",
      on_leave: "badge-warning",
      terminated: "badge-error",
      inactive: "badge-ghost"
    }[t] ?? "badge-ghost";
  }
  var q = at(), C = e.first_child(q), B = e.child(C), Q = e.child(B), Ee = e.child(Q);
  Xe(Ee, { class: "h-6 w-6" }), e.next(), e.reset(Q);
  var V = e.sibling(Q, 2), ze = e.child(V);
  Be(ze, { class: "h-4 w-4" }), e.next(), e.reset(V), e.reset(B);
  var ge = e.sibling(B, 2);
  {
    var Ce = (t) => {
      var s = Ke(), v = e.child(s, !0);
      e.reset(s), e.template_effect(() => e.set_text(v, e.get(n))), e.append(t, s);
    };
    e.if(ge, (t) => {
      e.get(n) && t(Ce);
    });
  }
  var Y = e.sibling(ge, 2), Z = e.child(Y), J = e.child(Z);
  e.remove_input_defaults(J);
  var ee = e.sibling(J, 2), Me = e.child(ee);
  Je(Me, { class: "h-4 w-4" }), e.reset(ee), e.reset(Z);
  var te = e.sibling(Z, 2), ae = e.child(te);
  ae.value = ae.__value = "all";
  var le = e.sibling(ae);
  le.value = le.__value = "active";
  var ie = e.sibling(le);
  ie.value = ie.__value = "on_leave";
  var me = e.sibling(ie);
  me.value = me.__value = "terminated", e.reset(te), e.reset(Y);
  var he = e.sibling(Y, 2), fe = e.child(he), ye = e.sibling(e.child(fe)), Oe = e.child(ye);
  {
    var We = (t) => {
      var s = Qe();
      e.append(t, s);
    }, Te = (t) => {
      var s = Ve();
      e.append(t, s);
    }, Ae = (t) => {
      var s = e.comment(), v = e.first_child(s);
      e.each(v, 17, () => e.get(o), (_) => _.id, (_, p) => {
        var M = Ye(), k = e.child(M), O = e.child(k, !0);
        e.reset(k);
        var S = e.sibling(k), W = e.child(S);
        e.reset(S);
        var P = e.sibling(S), T = e.child(P, !0);
        e.reset(P);
        var j = e.sibling(P), A = e.child(j, !0);
        e.reset(j);
        var E = e.sibling(j), U = e.child(E, !0);
        e.reset(E);
        var z = e.sibling(E), D = e.child(z, !0);
        e.reset(z);
        var F = e.sibling(z), N = e.child(F), H = e.child(N, !0);
        e.reset(N), e.reset(F), e.reset(M), e.template_effect(
          (I) => {
            e.set_text(O, e.get(p).employee_number), e.set_text(W, `${e.get(p).first_name ?? ""} ${e.get(p).last_name ?? ""}`), e.set_text(T, e.get(p).email), e.set_text(A, e.get(p).department_name ?? "—"), e.set_text(U, e.get(p).position_title ?? "—"), e.set_text(D, e.get(p).hire_date), e.set_class(N, 1, `badge ${I ?? ""} badge-sm`), e.set_text(H, e.get(p).status);
          },
          [() => R(e.get(p).status)]
        ), e.append(_, M);
      }), e.append(t, s);
    };
    e.if(Oe, (t) => {
      e.get(r) ? t(We) : e.get(o).length === 0 ? t(Te, 1) : t(Ae, -1);
    });
  }
  e.reset(ye), e.reset(fe), e.reset(he), e.reset(C);
  var Ue = e.sibling(C, 2);
  {
    var De = (t) => {
      var s = tt(), v = e.child(s), _ = e.child(v), p = e.sibling(e.child(_), 2), M = e.child(p);
      Ge(M, { class: "h-4 w-4" }), e.reset(p), e.reset(_);
      var k = e.sibling(_, 2), O = e.child(k), S = e.sibling(e.child(O));
      e.remove_input_defaults(S), e.reset(O);
      var W = e.sibling(O, 2), P = e.sibling(e.child(W));
      e.remove_input_defaults(P), e.reset(W);
      var T = e.sibling(W, 2), j = e.sibling(e.child(T));
      e.remove_input_defaults(j), e.reset(T);
      var A = e.sibling(T, 2), E = e.sibling(e.child(A));
      e.remove_input_defaults(E), e.reset(A);
      var U = e.sibling(A, 2), z = e.sibling(e.child(U));
      e.remove_input_defaults(z), e.reset(U);
      var D = e.sibling(U, 2), F = e.sibling(e.child(D));
      e.remove_input_defaults(F), e.reset(D);
      var N = e.sibling(D, 2), H = e.sibling(e.child(N), 2), I = e.child(H);
      I.value = I.__value = "";
      var Fe = e.sibling(I);
      e.each(Fe, 17, () => e.get(c), (l) => l.id, (l, $) => {
        var b = Ze(), be = e.child(b, !0);
        e.reset(b);
        var L = {};
        e.template_effect(() => {
          e.set_text(be, e.get($).name), L !== (L = e.get($).id) && (b.value = (b.__value = e.get($).id) ?? "");
        }), e.append(l, b);
      }), e.reset(H), e.reset(N);
      var se = e.sibling(N, 2), re = e.sibling(e.child(se), 2), ne = e.child(re);
      ne.value = ne.__value = "";
      var He = e.sibling(ne);
      e.each(He, 17, () => e.get(m), (l) => l.id, (l, $) => {
        var b = et(), be = e.child(b, !0);
        e.reset(b);
        var L = {};
        e.template_effect(() => {
          e.set_text(be, e.get($).title), L !== (L = e.get($).id) && (b.value = (b.__value = e.get($).id) ?? "");
        }), e.append(l, b);
      }), e.reset(re), e.reset(se);
      var oe = e.sibling(se, 2), de = e.sibling(e.child(oe), 2), ce = e.child(de);
      ce.value = ce.__value = "full_time";
      var pe = e.sibling(ce);
      pe.value = pe.__value = "part_time";
      var ve = e.sibling(pe);
      ve.value = ve.__value = "contractor";
      var we = e.sibling(ve);
      we.value = we.__value = "intern", e.reset(de), e.reset(oe);
      var _e = e.sibling(oe, 2), ke = e.sibling(e.child(_e));
      e.remove_input_defaults(ke), e.reset(_e);
      var ue = e.sibling(_e, 2), Ne = e.sibling(e.child(ue), 2);
      e.remove_input_defaults(Ne), e.reset(ue);
      var $e = e.sibling(ue, 2), Se = e.sibling(e.child($e));
      e.remove_input_defaults(Se), e.reset($e), e.reset(k);
      var Pe = e.sibling(k, 2), je = e.child(Pe), X = e.sibling(je, 2), Ie = e.child(X, !0);
      e.reset(X), e.reset(Pe), e.reset(v), e.reset(s), e.template_effect(() => {
        X.disabled = e.get(y) || !e.get(a).first_name || !e.get(a).last_name || !e.get(a).email, e.set_text(Ie, e.get(y) ? "Saving…" : "Create employee");
      }), e.delegated("click", s, (l) => l.target === l.currentTarget && e.set(f, !1)), e.delegated("click", p, () => e.set(f, !1)), e.bind_value(S, () => e.get(a).first_name, (l) => e.get(a).first_name = l), e.bind_value(P, () => e.get(a).last_name, (l) => e.get(a).last_name = l), e.bind_value(j, () => e.get(a).email, (l) => e.get(a).email = l), e.bind_value(E, () => e.get(a).work_email, (l) => e.get(a).work_email = l), e.bind_value(z, () => e.get(a).phone, (l) => e.get(a).phone = l), e.bind_value(F, () => e.get(a).hire_date, (l) => e.get(a).hire_date = l), e.bind_select_value(H, () => e.get(a).department_id, (l) => e.get(a).department_id = l), e.bind_select_value(re, () => e.get(a).position_id, (l) => e.get(a).position_id = l), e.bind_select_value(de, () => e.get(a).employment_type, (l) => e.get(a).employment_type = l), e.bind_value(ke, () => e.get(a).salary, (l) => e.get(a).salary = l), e.bind_value(Ne, () => e.get(a).currency, (l) => e.get(a).currency = l), e.bind_value(Se, () => e.get(a).address, (l) => e.get(a).address = l), e.delegated("click", je, () => e.set(f, !1)), e.delegated("click", X, K), e.append(t, s);
    };
    e.if(Ue, (t) => {
      e.get(f) && t(De);
    });
  }
  e.delegated("click", V, () => e.set(f, !0)), e.delegated("keydown", J, (t) => t.key === "Enter" && w()), e.bind_value(J, () => e.get(g), (t) => e.set(g, t)), e.delegated("click", ee, w), e.bind_select_value(te, () => e.get(h), (t) => e.set(h, t)), e.append(d, q), e.pop();
}
e.delegate(["click", "keydown"]);
function it() {
  const d = window.__zveltio;
  d && d.registerRoute({
    path: "hr-employees",
    component: lt,
    label: "Employees",
    icon: "Users",
    category: "hr"
  });
}
it();
export {
  it as default
};
