import "svelte/internal/disclose-version";
import * as e from "svelte/internal/client";
import { onMount as Ce } from "svelte";
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
const ze = {
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
var Fe = e.from_svg("<svg><!><!></svg>");
function Z(b, a) {
  e.push(a, !0);
  const N = e.prop(a, "color", 3, "currentColor"), v = e.prop(a, "size", 3, 24), p = e.prop(a, "strokeWidth", 3, 2), _ = e.prop(a, "absoluteStrokeWidth", 3, !1), d = e.prop(a, "iconNode", 19, () => []), o = e.rest_props(a, [
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
  var M = Fe();
  e.attribute_effect(
    M,
    (m) => ({
      ...ze,
      ...o,
      width: v(),
      height: v(),
      stroke: N(),
      "stroke-width": m,
      class: [
        "lucide-icon lucide",
        a.name && `lucide-${a.name}`,
        a.class
      ]
    }),
    [
      () => _() ? Number(p()) * 24 / Number(v()) : p()
    ]
  );
  var O = e.child(M);
  e.each(O, 17, d, e.index, (m, x) => {
    var R = e.derived(() => e.to_array(e.get(x), 2));
    let J = () => e.get(R)[0], G = () => e.get(R)[1];
    var K = e.comment(), Y = e.first_child(K);
    e.element(Y, J, !0, (ee, de) => {
      e.attribute_effect(ee, () => ({ ...G() }));
    }), e.append(m, K);
  });
  var z = e.sibling(O);
  e.snippet(z, () => a.children ?? e.noop), e.reset(M), e.append(b, M), e.pop();
}
function We(b, a) {
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
  let N = e.rest_props(a, ["$$slots", "$$events", "$$legacy"]);
  const v = [
    [
      "path",
      {
        d: "M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"
      }
    ],
    ["path", { d: "M8 10v4" }],
    ["path", { d: "M12 10v2" }],
    ["path", { d: "M16 10v6" }]
  ];
  Z(b, e.spread_props({ name: "folder-kanban" }, () => N, {
    get iconNode() {
      return v;
    },
    children: (p, _) => {
      var d = e.comment(), o = e.first_child(d);
      e.snippet(o, () => a.children ?? e.noop), e.append(p, d);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function Ae(b, a) {
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
  let N = e.rest_props(a, ["$$slots", "$$events", "$$legacy"]);
  const v = [
    ["path", { d: "M3 12h.01" }],
    ["path", { d: "M3 18h.01" }],
    ["path", { d: "M3 6h.01" }],
    ["path", { d: "M8 12h13" }],
    ["path", { d: "M8 18h13" }],
    ["path", { d: "M8 6h13" }]
  ];
  Z(b, e.spread_props({ name: "list" }, () => N, {
    get iconNode() {
      return v;
    },
    children: (p, _) => {
      var d = e.comment(), o = e.first_child(d);
      e.snippet(o, () => a.children ?? e.noop), e.append(p, d);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function he(b, a) {
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
  let N = e.rest_props(a, ["$$slots", "$$events", "$$legacy"]);
  const v = [["path", { d: "M5 12h14" }], ["path", { d: "M12 5v14" }]];
  Z(b, e.spread_props({ name: "plus" }, () => N, {
    get iconNode() {
      return v;
    },
    children: (p, _) => {
      var d = e.comment(), o = e.first_child(d);
      e.snippet(o, () => a.children ?? e.noop), e.append(p, d);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function De(b, a) {
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
  let N = e.rest_props(a, ["$$slots", "$$events", "$$legacy"]);
  const v = [
    [
      "rect",
      { width: "18", height: "18", x: "3", y: "3", rx: "2" }
    ],
    ["path", { d: "M8 7v7" }],
    ["path", { d: "M12 7v4" }],
    ["path", { d: "M16 7v9" }]
  ];
  Z(b, e.spread_props({ name: "square-kanban" }, () => N, {
    get iconNode() {
      return v;
    },
    children: (p, _) => {
      var d = e.comment(), o = e.first_child(d);
      e.snippet(o, () => a.children ?? e.noop), e.append(p, d);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function fe(b, a) {
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
  let N = e.rest_props(a, ["$$slots", "$$events", "$$legacy"]);
  const v = [
    ["path", { d: "M18 6 6 18" }],
    ["path", { d: "m6 6 12 12" }]
  ];
  Z(b, e.spread_props({ name: "x" }, () => N, {
    get iconNode() {
      return v;
    },
    children: (p, _) => {
      var d = e.comment(), o = e.first_child(d);
      e.snippet(o, () => a.children ?? e.noop), e.append(p, d);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
var Oe = e.from_html('<div class="alert alert-error"> </div>'), qe = e.from_html('<div class="bg-base-100 rounded-lg p-12 text-center text-base-content/60">No projects yet — create one to start.</div>'), He = e.from_html("<option> </option>"), Ue = e.from_html('<button class="btn btn-sm gap-2"><!> New task</button>'), Ee = e.from_html('<div class="text-xs text-base-content/60 mt-1 line-clamp-2"> </div>'), Je = e.from_html('<button class="btn btn-ghost btn-xs"> </button>'), Be = e.from_html('<div class="bg-base-100 p-3 rounded shadow-sm cursor-move"><div class="font-medium text-sm"> </div> <!> <div class="flex gap-1 mt-2"></div></div>'), Ie = e.from_html('<div class="bg-base-200 rounded-lg p-3"><div class="font-medium text-sm mb-3 flex items-center justify-between"><span> </span> <span class="badge badge-sm badge-ghost"> </span></div> <div class="space-y-2 min-h-32"></div></div>'), Le = e.from_html('<div class="grid grid-cols-4 gap-4"></div>'), Re = e.from_html('<tr><td colspan="5" class="text-center py-6 text-base-content/60">No tasks.</td></tr>'), Ke = e.from_html('<tr><td> </td><td><span class="badge badge-sm"> </span></td><td><span class="badge badge-ghost badge-sm"> </span></td><td> </td><td> </td></tr>'), Ve = e.from_html('<div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Title</th><th>Status</th><th>Priority</th><th>Due date</th><th>Assignee</th></tr></thead><tbody><!></tbody></table></div>'), Xe = e.from_html('<div class="flex gap-4 items-center"><select class="select select-sm select-bordered"></select> <!></div> <!>', 1), Ze = e.from_html('<div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><div class="bg-base-100 rounded-xl p-6 w-full max-w-md"><div class="flex items-center justify-between mb-4"><h2 class="text-xl font-semibold">New project</h2><button class="btn btn-ghost btn-sm btn-square"><!></button></div> <div class="space-y-3"><div><label class="label label-text">Name</label><input class="input input-bordered w-full"/></div> <div><label class="label label-text">Description</label><textarea class="textarea textarea-bordered w-full"></textarea></div> <div class="grid grid-cols-2 gap-3"><div><label class="label label-text">Start</label><input type="date" class="input input-bordered w-full"/></div> <div><label class="label label-text">End</label><input type="date" class="input input-bordered w-full"/></div></div></div> <div class="flex justify-end gap-2 mt-4"><button class="btn btn-ghost">Cancel</button><button class="btn btn-primary"> </button></div></div></div>'), Ge = e.from_html("<option> </option>"), Qe = e.from_html('<div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><div class="bg-base-100 rounded-xl p-6 w-full max-w-md"><div class="flex items-center justify-between mb-4"><h2 class="text-xl font-semibold">New task</h2><button class="btn btn-ghost btn-sm btn-square"><!></button></div> <div class="space-y-3"><div><label class="label label-text">Title</label><input class="input input-bordered w-full"/></div> <div><label class="label label-text">Description</label><textarea class="textarea textarea-bordered w-full"></textarea></div> <div class="grid grid-cols-2 gap-3"><div><label class="label label-text">Status</label><select class="select select-bordered w-full"></select></div> <div><label class="label label-text">Priority</label><select class="select select-bordered w-full"><option>Low</option><option>Medium</option><option>High</option><option>Urgent</option></select></div></div> <div><label class="label label-text">Due date</label><input type="date" class="input input-bordered w-full"/></div></div> <div class="flex justify-end gap-2 mt-4"><button class="btn btn-ghost">Cancel</button><button class="btn btn-primary"> </button></div></div></div>'), Ye = e.from_html('<div class="p-6 space-y-4"><header class="flex items-center justify-between"><h1 class="text-2xl font-semibold flex items-center gap-2"><!> Projects</h1> <div class="flex gap-2"><div class="join"><button><!></button> <button><!></button></div> <button class="btn btn-primary btn-sm gap-2"><!> New project</button></div></header> <!> <!></div> <!> <!>', 1);
function et(b, a) {
  var ge;
  e.push(a, !0);
  const N = ((ge = window.__zveltio) == null ? void 0 : ge.engineUrl) ?? "";
  let v = e.state("board"), p = e.state(e.proxy([])), _ = e.state(null), d = e.state(e.proxy([])), o = e.state(""), M = e.state(!1), O = e.state(!1), z = e.state(!1), m = e.state(e.proxy({ name: "", description: "", start_date: "", end_date: "" })), x = e.state(e.proxy({
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    assignee_id: "",
    due_date: ""
  }));
  const R = [
    { id: "todo", label: "To do" },
    { id: "in_progress", label: "In progress" },
    { id: "review", label: "Review" },
    { id: "done", label: "Done" }
  ];
  async function J(t, l) {
    const g = await fetch(`${N}${t}`, { credentials: "include", ...l }), u = await g.json().catch(() => ({}));
    if (!g.ok) throw new Error(u.error || `HTTP ${g.status}`);
    return u;
  }
  async function G() {
    try {
      const t = await J("/api/projects");
      e.set(p, t.data ?? [], !0), !e.get(_) && e.get(p)[0] && e.set(_, e.get(p)[0], !0);
    } catch (t) {
      e.set(o, t.message, !0);
    }
  }
  async function K() {
    if (!e.get(_)) {
      e.set(d, [], !0);
      return;
    }
    try {
      const t = await J(`/api/projects/${e.get(_).id}/tasks`);
      e.set(d, t.data ?? [], !0);
    } catch (t) {
      e.set(o, t.message, !0);
    }
  }
  async function Y() {
    e.set(z, !0), e.set(o, "");
    try {
      await J("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(e.get(m))
      }), e.set(M, !1), e.set(m, { name: "", description: "", start_date: "", end_date: "" }, !0), await G();
    } catch (t) {
      e.set(o, t.message, !0);
    } finally {
      e.set(z, !1);
    }
  }
  async function ee() {
    if (e.get(_)) {
      e.set(z, !0), e.set(o, "");
      try {
        await J(`/api/projects/${e.get(_).id}/tasks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(e.get(x))
        }), e.set(O, !1), e.set(
          x,
          {
            title: "",
            description: "",
            status: "todo",
            priority: "medium",
            assignee_id: "",
            due_date: ""
          },
          !0
        ), await K();
      } catch (t) {
        e.set(o, t.message, !0);
      } finally {
        e.set(z, !1);
      }
    }
  }
  async function de(t, l) {
    try {
      await J(`/api/projects/tasks/${t}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: l })
      }), await K();
    } catch (g) {
      e.set(o, g.message, !0);
    }
  }
  Ce(G), e.user_effect(() => {
    e.get(_), K();
  });
  function ne(t) {
    return e.get(d).filter((l) => l.status === t);
  }
  var oe = Ye(), te = e.first_child(oe), ae = e.child(te), se = e.child(ae), me = e.child(se);
  We(me, { class: "h-6 w-6" }), e.next(), e.reset(se);
  var ce = e.sibling(se, 2), ie = e.child(ce), V = e.child(ie);
  let ve;
  var xe = e.child(V);
  De(xe, { class: "h-4 w-4" }), e.reset(V);
  var Q = e.sibling(V, 2);
  let pe;
  var ye = e.child(Q);
  Ae(ye, { class: "h-4 w-4" }), e.reset(Q), e.reset(ie);
  var re = e.sibling(ie, 2), we = e.child(re);
  he(we, { class: "h-4 w-4" }), e.next(), e.reset(re), e.reset(ce), e.reset(ae);
  var _e = e.sibling(ae, 2);
  {
    var ke = (t) => {
      var l = Oe(), g = e.child(l, !0);
      e.reset(l), e.template_effect(() => e.set_text(g, e.get(o))), e.append(t, l);
    };
    e.if(_e, (t) => {
      e.get(o) && t(ke);
    });
  }
  var je = e.sibling(_e, 2);
  {
    var Ne = (t) => {
      var l = qe();
      e.append(t, l);
    }, $e = (t) => {
      var l = Xe(), g = e.first_child(l), u = e.child(g);
      e.each(u, 21, () => e.get(p), (i) => i.id, (i, s) => {
        var r = He(), h = e.child(r, !0);
        e.reset(r);
        var w = {};
        e.template_effect(() => {
          e.set_text(h, e.get(s).name), w !== (w = e.get(s).id) && (r.value = (r.__value = e.get(s).id) ?? "");
        }), e.append(i, r);
      }), e.reset(u);
      var F;
      e.init_select(u);
      var X = e.sibling(u, 2);
      {
        var q = (i) => {
          var s = Ue(), r = e.child(s);
          he(r, { class: "h-3.5 w-3.5" }), e.next(), e.reset(s), e.delegated("click", s, () => e.set(O, !0)), e.append(i, s);
        };
        e.if(X, (i) => {
          e.get(_) && i(q);
        });
      }
      e.reset(g);
      var H = e.sibling(g, 2);
      {
        var B = (i) => {
          var s = Le();
          e.each(s, 21, () => R, (r) => r.id, (r, h) => {
            var w = Ie(), $ = e.child(w), P = e.child($), y = e.child(P, !0);
            e.reset(P);
            var f = e.sibling(P, 2), E = e.child(f, !0);
            e.reset(f), e.reset($);
            var c = e.sibling($, 2);
            e.each(c, 21, () => ne(e.get(h).id), (k) => k.id, (k, S) => {
              var W = Be(), A = e.child(W), I = e.child(A, !0);
              e.reset(A);
              var n = e.sibling(A, 2);
              {
                var L = (j) => {
                  var C = Ee(), D = e.child(C, !0);
                  e.reset(C), e.template_effect(() => e.set_text(D, e.get(S).description)), e.append(j, C);
                };
                e.if(n, (j) => {
                  e.get(S).description && j(L);
                });
              }
              var T = e.sibling(n, 2);
              e.each(T, 21, () => R.filter((j) => j.id !== e.get(h).id), (j) => j.id, (j, C) => {
                var D = Je(), le = e.child(D);
                e.reset(D), e.template_effect(() => e.set_text(le, `→ ${e.get(C).label ?? ""}`)), e.delegated("click", D, () => de(e.get(S).id, e.get(C).id)), e.append(j, D);
              }), e.reset(T), e.reset(W), e.template_effect(() => e.set_text(I, e.get(S).title)), e.append(k, W);
            }), e.reset(c), e.reset(w), e.template_effect(
              (k) => {
                e.set_text(y, e.get(h).label), e.set_text(E, k);
              },
              [() => ne(e.get(h).id).length]
            ), e.append(r, w);
          }), e.reset(s), e.append(i, s);
        }, U = (i) => {
          var s = Ve(), r = e.child(s), h = e.sibling(e.child(r)), w = e.child(h);
          {
            var $ = (y) => {
              var f = Re();
              e.append(y, f);
            }, P = (y) => {
              var f = e.comment(), E = e.first_child(f);
              e.each(E, 17, () => e.get(d), (c) => c.id, (c, k) => {
                var S = Ke(), W = e.child(S), A = e.child(W, !0);
                e.reset(W);
                var I = e.sibling(W), n = e.child(I), L = e.child(n, !0);
                e.reset(n), e.reset(I);
                var T = e.sibling(I), j = e.child(T), C = e.child(j, !0);
                e.reset(j), e.reset(T);
                var D = e.sibling(T), le = e.child(D, !0);
                e.reset(D);
                var be = e.sibling(D), Se = e.child(be, !0);
                e.reset(be), e.reset(S), e.template_effect(() => {
                  e.set_text(A, e.get(k).title), e.set_text(L, e.get(k).status), e.set_text(C, e.get(k).priority), e.set_text(le, e.get(k).due_date ?? "—"), e.set_text(Se, e.get(k).assignee_name ?? "—");
                }), e.append(c, S);
              }), e.append(y, f);
            };
            e.if(w, (y) => {
              e.get(d).length === 0 ? y($) : y(P, -1);
            });
          }
          e.reset(h), e.reset(r), e.reset(s), e.append(i, s);
        };
        e.if(H, (i) => {
          e.get(v) === "board" ? i(B) : i(U, -1);
        });
      }
      e.template_effect(() => {
        var i, s, r;
        F !== (F = ((i = e.get(_)) == null ? void 0 : i.id) ?? "") && (u.value = (u.__value = ((s = e.get(_)) == null ? void 0 : s.id) ?? "") ?? "", e.select_option(u, ((r = e.get(_)) == null ? void 0 : r.id) ?? ""));
      }), e.delegated("change", u, (i) => {
        e.set(_, e.get(p).find((s) => s.id === i.target.value) ?? null, !0);
      }), e.append(t, l);
    };
    e.if(je, (t) => {
      e.get(p).length === 0 ? t(Ne) : t($e, -1);
    });
  }
  e.reset(te);
  var ue = e.sibling(te, 2);
  {
    var Pe = (t) => {
      var l = Ze(), g = e.child(l), u = e.child(g), F = e.sibling(e.child(u)), X = e.child(F);
      fe(X, { class: "h-4 w-4" }), e.reset(F), e.reset(u);
      var q = e.sibling(u, 2), H = e.child(q), B = e.sibling(e.child(H));
      e.remove_input_defaults(B), e.reset(H);
      var U = e.sibling(H, 2), i = e.sibling(e.child(U));
      e.remove_textarea_child(i), e.reset(U);
      var s = e.sibling(U, 2), r = e.child(s), h = e.sibling(e.child(r));
      e.remove_input_defaults(h), e.reset(r);
      var w = e.sibling(r, 2), $ = e.sibling(e.child(w));
      e.remove_input_defaults($), e.reset(w), e.reset(s), e.reset(q);
      var P = e.sibling(q, 2), y = e.child(P), f = e.sibling(y), E = e.child(f, !0);
      e.reset(f), e.reset(P), e.reset(g), e.reset(l), e.template_effect(() => {
        f.disabled = e.get(z) || !e.get(m).name, e.set_text(E, e.get(z) ? "Saving…" : "Create");
      }), e.delegated("click", l, (c) => c.target === c.currentTarget && e.set(M, !1)), e.delegated("click", F, () => e.set(M, !1)), e.bind_value(B, () => e.get(m).name, (c) => e.get(m).name = c), e.bind_value(i, () => e.get(m).description, (c) => e.get(m).description = c), e.bind_value(h, () => e.get(m).start_date, (c) => e.get(m).start_date = c), e.bind_value($, () => e.get(m).end_date, (c) => e.get(m).end_date = c), e.delegated("click", y, () => e.set(M, !1)), e.delegated("click", f, Y), e.append(t, l);
    };
    e.if(ue, (t) => {
      e.get(M) && t(Pe);
    });
  }
  var Te = e.sibling(ue, 2);
  {
    var Me = (t) => {
      var l = Qe(), g = e.child(l), u = e.child(g), F = e.sibling(e.child(u)), X = e.child(F);
      fe(X, { class: "h-4 w-4" }), e.reset(F), e.reset(u);
      var q = e.sibling(u, 2), H = e.child(q), B = e.sibling(e.child(H));
      e.remove_input_defaults(B), e.reset(H);
      var U = e.sibling(H, 2), i = e.sibling(e.child(U));
      e.remove_textarea_child(i), e.reset(U);
      var s = e.sibling(U, 2), r = e.child(s), h = e.sibling(e.child(r));
      e.each(h, 21, () => R, (n) => n.id, (n, L) => {
        var T = Ge(), j = e.child(T, !0);
        e.reset(T);
        var C = {};
        e.template_effect(() => {
          e.set_text(j, e.get(L).label), C !== (C = e.get(L).id) && (T.value = (T.__value = e.get(L).id) ?? "");
        }), e.append(n, T);
      }), e.reset(h), e.reset(r);
      var w = e.sibling(r, 2), $ = e.sibling(e.child(w)), P = e.child($);
      P.value = P.__value = "low";
      var y = e.sibling(P);
      y.value = y.__value = "medium";
      var f = e.sibling(y);
      f.value = f.__value = "high";
      var E = e.sibling(f);
      E.value = E.__value = "urgent", e.reset($), e.reset(w), e.reset(s);
      var c = e.sibling(s, 2), k = e.sibling(e.child(c));
      e.remove_input_defaults(k), e.reset(c), e.reset(q);
      var S = e.sibling(q, 2), W = e.child(S), A = e.sibling(W), I = e.child(A, !0);
      e.reset(A), e.reset(S), e.reset(g), e.reset(l), e.template_effect(() => {
        A.disabled = e.get(z) || !e.get(x).title, e.set_text(I, e.get(z) ? "Saving…" : "Create");
      }), e.delegated("click", l, (n) => n.target === n.currentTarget && e.set(O, !1)), e.delegated("click", F, () => e.set(O, !1)), e.bind_value(B, () => e.get(x).title, (n) => e.get(x).title = n), e.bind_value(i, () => e.get(x).description, (n) => e.get(x).description = n), e.bind_select_value(h, () => e.get(x).status, (n) => e.get(x).status = n), e.bind_select_value($, () => e.get(x).priority, (n) => e.get(x).priority = n), e.bind_value(k, () => e.get(x).due_date, (n) => e.get(x).due_date = n), e.delegated("click", W, () => e.set(O, !1)), e.delegated("click", A, ee), e.append(t, l);
    };
    e.if(Te, (t) => {
      e.get(O) && t(Me);
    });
  }
  e.template_effect(() => {
    ve = e.set_class(V, 1, "btn btn-sm join-item", null, ve, { "btn-active": e.get(v) === "board" }), pe = e.set_class(Q, 1, "btn btn-sm join-item", null, pe, { "btn-active": e.get(v) === "list" });
  }), e.delegated("click", V, () => e.set(v, "board")), e.delegated("click", Q, () => e.set(v, "list")), e.delegated("click", re, () => e.set(M, !0)), e.append(b, oe), e.pop();
}
e.delegate(["click", "change"]);
function tt() {
  const b = window.__zveltio;
  b && b.registerRoute({
    path: "projects",
    component: et,
    label: "Projects",
    icon: "FolderKanban",
    category: "projects"
  });
}
tt();
export {
  tt as default
};
