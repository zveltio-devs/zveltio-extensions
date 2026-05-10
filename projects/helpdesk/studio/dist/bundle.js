import "svelte/internal/disclose-version";
import * as e from "svelte/internal/client";
import { onMount as Me } from "svelte";
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
const qe = {
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
var ze = e.from_svg("<svg><!><!></svg>");
function re(u, s) {
  e.push(s, !0);
  const m = e.prop(s, "color", 3, "currentColor"), p = e.prop(s, "size", 3, 24), b = e.prop(s, "strokeWidth", 3, 2), g = e.prop(s, "absoluteStrokeWidth", 3, !1), r = e.prop(s, "iconNode", 19, () => []), i = e.rest_props(s, [
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
  var z = ze();
  e.attribute_effect(
    z,
    (S) => ({
      ...qe,
      ...i,
      width: p(),
      height: p(),
      stroke: m(),
      "stroke-width": S,
      class: [
        "lucide-icon lucide",
        s.name && `lucide-${s.name}`,
        s.class
      ]
    }),
    [
      () => g() ? Number(b()) * 24 / Number(p()) : b()
    ]
  );
  var f = e.child(z);
  e.each(f, 17, r, e.index, (S, l) => {
    var x = e.derived(() => e.to_array(e.get(l), 2));
    let W = () => e.get(x)[0], I = () => e.get(x)[1];
    var U = e.comment(), X = e.first_child(U);
    e.element(X, W, !0, (G, le) => {
      e.attribute_effect(G, () => ({ ...I() }));
    }), e.append(S, U);
  });
  var N = e.sibling(f);
  e.snippet(N, () => s.children ?? e.noop), e.reset(z), e.append(u, z), e.pop();
}
function He(u, s) {
  e.push(s, !0);
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
  let m = e.rest_props(s, ["$$slots", "$$events", "$$legacy"]);
  const p = [
    [
      "path",
      {
        d: "M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"
      }
    ]
  ];
  re(u, e.spread_props({ name: "headphones" }, () => m, {
    get iconNode() {
      return p;
    },
    children: (b, g) => {
      var r = e.comment(), i = e.first_child(r);
      e.snippet(i, () => s.children ?? e.noop), e.append(b, r);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function Oe(u, s) {
  e.push(s, !0);
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
  let m = e.rest_props(s, ["$$slots", "$$events", "$$legacy"]);
  const p = [["path", { d: "M5 12h14" }], ["path", { d: "M12 5v14" }]];
  re(u, e.spread_props({ name: "plus" }, () => m, {
    get iconNode() {
      return p;
    },
    children: (b, g) => {
      var r = e.comment(), i = e.first_child(r);
      e.snippet(i, () => s.children ?? e.noop), e.append(b, r);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function We(u, s) {
  e.push(s, !0);
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
  let m = e.rest_props(s, ["$$slots", "$$events", "$$legacy"]);
  const p = [
    ["path", { d: "M18 6 6 18" }],
    ["path", { d: "m6 6 12 12" }]
  ];
  re(u, e.spread_props({ name: "x" }, () => m, {
    get iconNode() {
      return p;
    },
    children: (b, g) => {
      var r = e.comment(), i = e.first_child(r);
      e.snippet(i, () => s.children ?? e.noop), e.append(b, r);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
var Re = e.from_html('<div class="alert alert-error"> </div>'), Ue = e.from_html('<tr><td colspan="3" class="text-center py-6 text-base-content/60">No tickets.</td></tr>'), Fe = e.from_html('<tr><td> </td><td><span> </span></td><td><span class="badge badge-ghost badge-sm"> </span></td></tr>'), Le = e.from_html('<div class="text-center py-12 text-base-content/60">Select a ticket to view conversation.</div>'), Ae = e.from_html('<button class="btn btn-success btn-sm">Mark resolved</button>'), Be = e.from_html('<div><div class="text-xs text-base-content/60 mb-1"> </div> <div> </div></div>'), De = e.from_html('<div class="flex items-center justify-between mb-3"><div><div class="font-medium"> </div> <div class="text-xs text-base-content/60"> </div></div> <!></div> <div class="space-y-3 mb-4 max-h-[40vh] overflow-y-auto"><div class="bg-base-200 rounded-lg p-3 text-sm"> </div> <!></div> <div class="flex gap-2"><textarea class="textarea textarea-bordered flex-1" rows="2" placeholder="Reply..."></textarea> <button class="btn btn-primary self-end">Send</button></div>', 1), Je = e.from_html("<option> </option>"), Ee = e.from_html('<div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><div class="bg-base-100 rounded-xl p-6 w-full max-w-md"><div class="flex items-center justify-between mb-4"><h2 class="text-xl font-semibold">New ticket</h2><button class="btn btn-ghost btn-sm btn-square"><!></button></div> <div class="space-y-3"><div><label class="label label-text">Subject</label><input class="input input-bordered w-full"/></div> <div><label class="label label-text">Requester email</label><input type="email" class="input input-bordered w-full"/></div> <div class="grid grid-cols-2 gap-3"><div><label class="label label-text">Category</label><select class="select select-bordered w-full"><option>—</option><!></select></div> <div><label class="label label-text">Priority</label><select class="select select-bordered w-full"><option>Low</option><option>Medium</option><option>High</option><option>Urgent</option></select></div></div> <div><label class="label label-text">Description</label><textarea class="textarea textarea-bordered w-full" rows="4"></textarea></div></div> <div class="flex justify-end gap-2 mt-4"><button class="btn btn-ghost">Cancel</button><button class="btn btn-primary"> </button></div></div></div>'), Ie = e.from_html('<div class="p-6 space-y-4"><header class="flex items-center justify-between"><h1 class="text-2xl font-semibold flex items-center gap-2"><!> Helpdesk</h1> <button class="btn btn-primary btn-sm gap-2"><!> New ticket</button></header> <!> <select class="select select-sm select-bordered max-w-xs"><option>All</option><option>Open</option><option>Pending</option><option>Resolved</option><option>Closed</option></select> <div class="grid grid-cols-12 gap-4"><div class="col-span-5 bg-base-100 rounded-lg shadow overflow-y-auto max-h-[70vh]"><table class="table table-sm"><thead><tr><th>Subject</th><th>Priority</th><th>Status</th></tr></thead><tbody><!></tbody></table></div> <div class="col-span-7 bg-base-100 rounded-lg shadow p-4"><!></div></div></div> <!>', 1);
function Xe(u, s) {
  var ue;
  e.push(s, !0);
  const m = ((ue = window.__zveltio) == null ? void 0 : ue.engineUrl) ?? "";
  let p = e.state(e.proxy([])), b = e.state(e.proxy([])), g = e.state(""), r = e.state("open"), i = e.state(null), z = e.state(e.proxy([])), f = e.state(""), N = e.state(!1), S = e.state(!1), l = e.state(e.proxy({
    subject: "",
    description: "",
    category_id: "",
    priority: "medium",
    requester_email: ""
  }));
  async function x(t, a) {
    const o = await fetch(`${m}${t}`, { credentials: "include", ...a }), c = await o.json().catch(() => ({}));
    if (!o.ok) throw new Error(c.error || `HTTP ${o.status}`);
    return c;
  }
  async function W() {
    try {
      const t = new URLSearchParams();
      e.get(r) !== "all" && t.set("status", e.get(r));
      const a = await x(`/api/helpdesk/tickets?${t}`);
      e.set(p, a.data ?? [], !0);
    } catch (t) {
      e.set(g, t.message, !0);
    }
  }
  async function I() {
    try {
      const t = await x("/api/helpdesk/categories");
      e.set(b, t.data ?? [], !0);
    } catch {
    }
  }
  async function U(t) {
    try {
      const a = await x(`/api/helpdesk/tickets/${t}/messages`);
      e.set(z, a.data ?? [], !0);
    } catch (a) {
      e.set(g, a.message, !0);
    }
  }
  async function X() {
    e.set(S, !0), e.set(g, "");
    try {
      await x("/api/helpdesk/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(e.get(l))
      }), e.set(N, !1), e.set(
        l,
        {
          subject: "",
          description: "",
          category_id: "",
          priority: "medium",
          requester_email: ""
        },
        !0
      ), await W();
    } catch (t) {
      e.set(g, t.message, !0);
    } finally {
      e.set(S, !1);
    }
  }
  async function G() {
    if (!(!e.get(i) || !e.get(f).trim()))
      try {
        await x(`/api/helpdesk/tickets/${e.get(i).id}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: e.get(f) })
        }), e.set(f, ""), await U(e.get(i).id);
      } catch (t) {
        e.set(g, t.message, !0);
      }
  }
  async function le(t) {
    var a;
    try {
      await x(`/api/helpdesk/tickets/${t}/resolve`, { method: "POST" }), await W(), ((a = e.get(i)) == null ? void 0 : a.id) === t && e.set(i, null);
    } catch (o) {
      e.set(g, o.message, !0);
    }
  }
  e.user_effect(() => {
    e.get(r), W();
  }), e.user_effect(() => {
    e.get(i) && U(e.get(i).id);
  }), Me(() => {
    W(), I();
  });
  function he(t) {
    return {
      low: "badge-ghost",
      medium: "badge-info",
      high: "badge-warning",
      urgent: "badge-error"
    }[t] ?? "badge-ghost";
  }
  var oe = Ie(), K = e.first_child(oe), Q = e.child(K), V = e.child(Q), me = e.child(V);
  He(me, { class: "h-6 w-6" }), e.next(), e.reset(V);
  var Y = e.sibling(V, 2), fe = e.child(Y);
  Oe(fe, { class: "h-4 w-4" }), e.next(), e.reset(Y), e.reset(Q);
  var ne = e.sibling(Q, 2);
  {
    var xe = (t) => {
      var a = Re(), o = e.child(a, !0);
      e.reset(a), e.template_effect(() => e.set_text(o, e.get(g))), e.append(t, a);
    };
    e.if(ne, (t) => {
      e.get(g) && t(xe);
    });
  }
  var A = e.sibling(ne, 2), Z = e.child(A);
  Z.value = Z.__value = "all";
  var ee = e.sibling(Z);
  ee.value = ee.__value = "open";
  var te = e.sibling(ee);
  te.value = te.__value = "pending";
  var ae = e.sibling(te);
  ae.value = ae.__value = "resolved";
  var de = e.sibling(ae);
  de.value = de.__value = "closed", e.reset(A);
  var ce = e.sibling(A, 2), se = e.child(ce), ve = e.child(se), pe = e.sibling(e.child(ve)), ye = e.child(pe);
  {
    var we = (t) => {
      var a = Ue();
      e.append(t, a);
    }, ke = (t) => {
      var a = e.comment(), o = e.first_child(a);
      e.each(o, 17, () => e.get(p), (c) => c.id, (c, v) => {
        var y = Fe();
        let w;
        var k = e.child(y), R = e.child(k, !0);
        e.reset(k);
        var j = e.sibling(k), h = e.child(j), $ = e.child(h, !0);
        e.reset(h), e.reset(j);
        var P = e.sibling(j), T = e.child(P), C = e.child(T, !0);
        e.reset(T), e.reset(P), e.reset(y), e.template_effect(
          (H) => {
            var M;
            w = e.set_class(y, 1, "cursor-pointer hover:bg-base-200", null, w, { "bg-base-200": ((M = e.get(i)) == null ? void 0 : M.id) === e.get(v).id }), e.set_text(R, e.get(v).subject), e.set_class(h, 1, `badge ${H ?? ""} badge-sm`), e.set_text($, e.get(v).priority), e.set_text(C, e.get(v).status);
          },
          [() => he(e.get(v).priority)]
        ), e.delegated("click", y, () => e.set(i, e.get(v), !0)), e.append(c, y);
      }), e.append(t, a);
    };
    e.if(ye, (t) => {
      e.get(p).length === 0 ? t(we) : t(ke, -1);
    });
  }
  e.reset(pe), e.reset(ve), e.reset(se);
  var ge = e.sibling(se, 2), je = e.child(ge);
  {
    var $e = (t) => {
      var a = Le();
      e.append(t, a);
    }, Ne = (t) => {
      var a = De(), o = e.first_child(a), c = e.child(o), v = e.child(c), y = e.child(v, !0);
      e.reset(v);
      var w = e.sibling(v, 2), k = e.child(w);
      e.reset(w), e.reset(c);
      var R = e.sibling(c, 2);
      {
        var j = (d) => {
          var _ = Ae();
          e.delegated("click", _, () => le(e.get(i).id)), e.append(d, _);
        };
        e.if(R, (d) => {
          e.get(i).status !== "resolved" && e.get(i).status !== "closed" && d(j);
        });
      }
      e.reset(o);
      var h = e.sibling(o, 2), $ = e.child(h), P = e.child($, !0);
      e.reset($);
      var T = e.sibling($, 2);
      e.each(T, 17, () => e.get(z), (d) => d.id, (d, _) => {
        var q = Be(), O = e.child(q), B = e.child(O);
        e.reset(O);
        var F = e.sibling(O, 2), D = e.child(F, !0);
        e.reset(F), e.reset(q), e.template_effect(
          (J) => {
            e.set_class(q, 1, `rounded-lg p-3 text-sm ${e.get(_).is_internal ? "bg-primary/10" : ""}`), e.set_text(B, `${e.get(_).author_name ?? e.get(_).author_id ?? ""} · ${J ?? ""}`), e.set_text(D, e.get(_).body);
          },
          [() => new Date(e.get(_).created_at).toLocaleString()]
        ), e.append(d, q);
      }), e.reset(h);
      var C = e.sibling(h, 2), H = e.child(C);
      e.remove_textarea_child(H);
      var M = e.sibling(H, 2);
      e.reset(C), e.template_effect(
        (d) => {
          e.set_text(y, e.get(i).subject), e.set_text(k, `From: ${e.get(i).requester_email ?? e.get(i).requester_id ?? "—" ?? ""}`), e.set_text(P, e.get(i).description), M.disabled = d;
        },
        [() => !e.get(f).trim()]
      ), e.bind_value(H, () => e.get(f), (d) => e.set(f, d)), e.delegated("click", M, G), e.append(t, a);
    };
    e.if(je, (t) => {
      e.get(i) ? t(Ne, -1) : t($e);
    });
  }
  e.reset(ge), e.reset(ce), e.reset(K);
  var Se = e.sibling(K, 2);
  {
    var Pe = (t) => {
      var a = Ee(), o = e.child(a), c = e.child(o), v = e.sibling(e.child(c)), y = e.child(v);
      We(y, { class: "h-4 w-4" }), e.reset(v), e.reset(c);
      var w = e.sibling(c, 2), k = e.child(w), R = e.sibling(e.child(k));
      e.remove_input_defaults(R), e.reset(k);
      var j = e.sibling(k, 2), h = e.sibling(e.child(j));
      e.remove_input_defaults(h), e.reset(j);
      var $ = e.sibling(j, 2), P = e.child($), T = e.sibling(e.child(P)), C = e.child(T);
      C.value = C.__value = "";
      var H = e.sibling(C);
      e.each(H, 17, () => e.get(b), (n) => n.id, (n, ie) => {
        var L = Je(), Ce = e.child(L, !0);
        e.reset(L);
        var be = {};
        e.template_effect(() => {
          e.set_text(Ce, e.get(ie).name), be !== (be = e.get(ie).id) && (L.value = (L.__value = e.get(ie).id) ?? "");
        }), e.append(n, L);
      }), e.reset(T), e.reset(P);
      var M = e.sibling(P, 2), d = e.sibling(e.child(M)), _ = e.child(d);
      _.value = _.__value = "low";
      var q = e.sibling(_);
      q.value = q.__value = "medium";
      var O = e.sibling(q);
      O.value = O.__value = "high";
      var B = e.sibling(O);
      B.value = B.__value = "urgent", e.reset(d), e.reset(M), e.reset($);
      var F = e.sibling($, 2), D = e.sibling(e.child(F));
      e.remove_textarea_child(D), e.reset(F), e.reset(w);
      var J = e.sibling(w, 2), _e = e.child(J), E = e.sibling(_e), Te = e.child(E, !0);
      e.reset(E), e.reset(J), e.reset(o), e.reset(a), e.template_effect(() => {
        E.disabled = e.get(S) || !e.get(l).subject || !e.get(l).description, e.set_text(Te, e.get(S) ? "Saving…" : "Create");
      }), e.delegated("click", a, (n) => n.target === n.currentTarget && e.set(N, !1)), e.delegated("click", v, () => e.set(N, !1)), e.bind_value(R, () => e.get(l).subject, (n) => e.get(l).subject = n), e.bind_value(h, () => e.get(l).requester_email, (n) => e.get(l).requester_email = n), e.bind_select_value(T, () => e.get(l).category_id, (n) => e.get(l).category_id = n), e.bind_select_value(d, () => e.get(l).priority, (n) => e.get(l).priority = n), e.bind_value(D, () => e.get(l).description, (n) => e.get(l).description = n), e.delegated("click", _e, () => e.set(N, !1)), e.delegated("click", E, X), e.append(t, a);
    };
    e.if(Se, (t) => {
      e.get(N) && t(Pe);
    });
  }
  e.delegated("click", Y, () => e.set(N, !0)), e.bind_select_value(A, () => e.get(r), (t) => e.set(r, t)), e.append(u, oe), e.pop();
}
e.delegate(["click"]);
function Ge() {
  const u = window.__zveltio;
  u && u.registerRoute({
    path: "helpdesk",
    component: Xe,
    label: "Helpdesk",
    icon: "Headphones",
    category: "projects"
  });
}
Ge();
export {
  Ge as default
};
