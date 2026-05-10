import "svelte/internal/disclose-version";
import * as e from "svelte/internal/client";
import { onMount as pe } from "svelte";
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
const he = {
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
var ue = e.from_svg("<svg><!><!></svg>");
function w(r, t) {
  e.push(t, !0);
  const d = e.prop(t, "color", 3, "currentColor"), s = e.prop(t, "size", 3, 24), o = e.prop(t, "strokeWidth", 3, 2), v = e.prop(t, "absoluteStrokeWidth", 3, !1), i = e.prop(t, "iconNode", 19, () => []), n = e.rest_props(t, [
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
  var l = ue();
  e.attribute_effect(
    l,
    (C) => ({
      ...he,
      ...n,
      width: s(),
      height: s(),
      stroke: d(),
      "stroke-width": C,
      class: [
        "lucide-icon lucide",
        t.name && `lucide-${t.name}`,
        t.class
      ]
    }),
    [
      () => v() ? Number(o()) * 24 / Number(s()) : o()
    ]
  );
  var _ = e.child(l);
  e.each(_, 17, i, e.index, (C, D) => {
    var I = e.derived(() => e.to_array(e.get(D), 2));
    let G = () => e.get(I)[0], L = () => e.get(I)[1];
    var x = e.comment(), P = e.first_child(x);
    e.element(P, G, !0, (S, F) => {
      e.attribute_effect(S, () => ({ ...L() }));
    }), e.append(C, x);
  });
  var M = e.sibling(_);
  e.snippet(M, () => t.children ?? e.noop), e.reset(l), e.append(r, l), e.pop();
}
function ge(r, t) {
  e.push(t, !0);
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
  let d = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const s = [
    ["path", { d: "M8 2v4" }],
    ["path", { d: "M16 2v4" }],
    [
      "rect",
      { width: "18", height: "18", x: "3", y: "4", rx: "2" }
    ],
    ["path", { d: "M3 10h18" }]
  ];
  w(r, e.spread_props({ name: "calendar" }, () => d, {
    get iconNode() {
      return s;
    },
    children: (o, v) => {
      var i = e.comment(), n = e.first_child(i);
      e.snippet(n, () => t.children ?? e.noop), e.append(o, i);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function te(r, t) {
  e.push(t, !0);
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
  let d = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const s = [
    [
      "rect",
      { width: "7", height: "7", x: "3", y: "3", rx: "1" }
    ],
    [
      "rect",
      { width: "7", height: "7", x: "14", y: "3", rx: "1" }
    ],
    [
      "rect",
      { width: "7", height: "7", x: "14", y: "14", rx: "1" }
    ],
    [
      "rect",
      { width: "7", height: "7", x: "3", y: "14", rx: "1" }
    ]
  ];
  w(r, e.spread_props({ name: "layout-grid" }, () => d, {
    get iconNode() {
      return s;
    },
    children: (o, v) => {
      var i = e.comment(), n = e.first_child(i);
      e.snippet(n, () => t.children ?? e.noop), e.append(o, i);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function ae(r, t) {
  e.push(t, !0);
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
  let d = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const s = [
    ["path", { d: "M3 12h.01" }],
    ["path", { d: "M3 18h.01" }],
    ["path", { d: "M3 6h.01" }],
    ["path", { d: "M8 12h13" }],
    ["path", { d: "M8 18h13" }],
    ["path", { d: "M8 6h13" }]
  ];
  w(r, e.spread_props({ name: "list" }, () => d, {
    get iconNode() {
      return s;
    },
    children: (o, v) => {
      var i = e.comment(), n = e.first_child(i);
      e.snippet(n, () => t.children ?? e.noop), e.append(o, i);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function _e(r, t) {
  e.push(t, !0);
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
  let d = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const s = [
    [
      "path",
      {
        d: "M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"
      }
    ],
    ["path", { d: "M15 5.764v15" }],
    ["path", { d: "M9 3.236v15" }]
  ];
  w(r, e.spread_props({ name: "map" }, () => d, {
    get iconNode() {
      return s;
    },
    children: (o, v) => {
      var i = e.comment(), n = e.first_child(i);
      e.snippet(n, () => t.children ?? e.noop), e.append(o, i);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function fe(r, t) {
  e.push(t, !0);
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
  let d = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const s = [["path", { d: "M5 12h14" }], ["path", { d: "M12 5v14" }]];
  w(r, e.spread_props({ name: "plus" }, () => d, {
    get iconNode() {
      return s;
    },
    children: (o, v) => {
      var i = e.comment(), n = e.first_child(i);
      e.snippet(n, () => t.children ?? e.noop), e.append(o, i);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function me(r, t) {
  e.push(t, !0);
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
  let d = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const s = [
    [
      "rect",
      { width: "18", height: "18", x: "3", y: "3", rx: "2" }
    ],
    ["path", { d: "M8 7v7" }],
    ["path", { d: "M12 7v4" }],
    ["path", { d: "M16 7v9" }]
  ];
  w(r, e.spread_props({ name: "square-kanban" }, () => d, {
    get iconNode() {
      return s;
    },
    children: (o, v) => {
      var i = e.comment(), n = e.first_child(i);
      e.snippet(n, () => t.children ?? e.noop), e.append(o, i);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function be(r, t) {
  e.push(t, !0);
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
  let d = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const s = [
    ["path", { d: "M18 6 6 18" }],
    ["path", { d: "m6 6 12 12" }]
  ];
  w(r, e.spread_props({ name: "x" }, () => d, {
    get iconNode() {
      return s;
    },
    children: (o, v) => {
      var i = e.comment(), n = e.first_child(i);
      e.snippet(n, () => t.children ?? e.noop), e.append(o, i);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
var we = e.from_html('<div class="alert alert-error"> </div>'), xe = e.from_html('<div class="col-span-full bg-base-100 rounded-lg p-12 text-center text-base-content/60">No saved views yet.</div>'), ye = e.from_html('<div class="bg-base-100 rounded-lg shadow p-4"><div class="flex items-start justify-between mb-2"><div class="flex items-center gap-2"><!> <div class="font-medium"> </div></div> <span class="badge badge-ghost badge-sm"> </span></div> <div class="text-xs text-base-content/60 font-mono"> </div> <div class="flex justify-end mt-3"><button class="btn btn-ghost btn-xs">Delete</button></div></div>'), $e = e.from_html("<option> </option>"), Ne = e.from_html('<div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><div class="bg-base-100 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"><div class="flex items-center justify-between mb-4"><h2 class="text-xl font-semibold">New view</h2><button class="btn btn-ghost btn-sm btn-square"><!></button></div> <div class="space-y-3"><div><label class="label label-text">Name</label><input class="input input-bordered w-full"/></div> <div><label class="label label-text">Collection</label> <select class="select select-bordered w-full"><option>—</option><!></select></div> <div><label class="label label-text">View type</label> <select class="select select-bordered w-full"><option>List</option><option>Kanban board</option><option>Card grid</option><option>Calendar</option><option>Map (requires PostGIS)</option></select></div> <div><label class="label label-text">Config (JSON)</label><textarea class="textarea textarea-bordered w-full font-mono text-xs" rows="8"></textarea></div></div> <div class="flex justify-end gap-2 mt-4"><button class="btn btn-ghost">Cancel</button><button class="btn btn-primary"> </button></div></div></div>'), ke = e.from_html('<div class="p-6 space-y-4"><header class="flex items-center justify-between"><h1 class="text-2xl font-semibold flex items-center gap-2"><!> Custom Views</h1> <button class="btn btn-primary btn-sm gap-2"><!> New view</button></header> <!> <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"><!></div></div> <!>', 1);
function Me(r, t) {
  var R;
  e.push(t, !0);
  const d = ((R = window.__zveltio) == null ? void 0 : R.engineUrl) ?? "";
  let s = e.state(e.proxy([])), o = e.state(e.proxy([])), v = e.state(""), i = e.state(!1), n = e.state(!1), l = e.state(e.proxy({
    name: "",
    collection: "",
    view_type: "list",
    config: `{
  "columns": [],
  "filters": [],
  "sort": []
}`
  }));
  async function _(a, c) {
    const h = await fetch(`${d}${a}`, { credentials: "include", ...c }), u = await h.json().catch(() => ({}));
    if (!h.ok) throw new Error(u.error || `HTTP ${h.status}`);
    return u;
  }
  async function M() {
    try {
      const a = await _("/api/views");
      e.set(s, a.data ?? [], !0);
    } catch (a) {
      e.set(v, a.message, !0);
    }
  }
  async function C() {
    try {
      const a = await _("/api/collections");
      e.set(o, a.collections ?? a.data ?? [], !0);
    } catch {
    }
  }
  async function D() {
    e.set(n, !0), e.set(v, "");
    try {
      let a = {};
      try {
        a = JSON.parse(e.get(l).config);
      } catch {
        throw new Error("Invalid JSON in config");
      }
      await _("/api/views", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...e.get(l), config: a })
      }), e.set(i, !1), e.set(
        l,
        {
          name: "",
          collection: "",
          view_type: "list",
          config: `{
  "columns": [],
  "filters": [],
  "sort": []
}`
        },
        !0
      ), await M();
    } catch (a) {
      e.set(v, a.message, !0);
    } finally {
      e.set(n, !1);
    }
  }
  async function I(a) {
    if (confirm("Delete view?"))
      try {
        await _(`/api/views/${a}`, { method: "DELETE" }), await M();
      } catch (c) {
        e.set(v, c.message, !0);
      }
  }
  pe(() => {
    M(), C();
  });
  function G(a) {
    return {
      list: ae,
      board: me,
      calendar: ge,
      map: _e,
      card: te
    }[a] ?? ae;
  }
  var L = ke(), x = e.first_child(L), P = e.child(x), S = e.child(P), F = e.child(S);
  te(F, { class: "h-6 w-6" }), e.next(), e.reset(S);
  var U = e.sibling(S, 2), ie = e.child(U);
  fe(ie, { class: "h-4 w-4" }), e.next(), e.reset(U), e.reset(P);
  var H = e.sibling(P, 2);
  {
    var se = (a) => {
      var c = we(), h = e.child(c, !0);
      e.reset(c), e.template_effect(() => e.set_text(h, e.get(v))), e.append(a, c);
    };
    e.if(H, (a) => {
      e.get(v) && a(se);
    });
  }
  var K = e.sibling(H, 2), re = e.child(K);
  {
    var ne = (a) => {
      var c = xe();
      e.append(a, c);
    }, oe = (a) => {
      var c = e.comment(), h = e.first_child(c);
      e.each(h, 17, () => e.get(s), (u) => u.id, (u, g) => {
        const B = e.derived(() => G(e.get(g).view_type));
        var f = ye(), m = e.child(f), y = e.child(m), $ = e.child(y);
        e.component($, () => e.get(B), (W, q) => {
          q(W, { class: "h-5 w-5 text-base-content/60" });
        });
        var N = e.sibling($, 2), j = e.child(N, !0);
        e.reset(N), e.reset(y);
        var O = e.sibling(y, 2), z = e.child(O, !0);
        e.reset(O), e.reset(m);
        var b = e.sibling(m, 2), T = e.child(b, !0);
        e.reset(b);
        var k = e.sibling(b, 2), V = e.child(k);
        e.reset(k), e.reset(f), e.template_effect(() => {
          e.set_text(j, e.get(g).name), e.set_text(z, e.get(g).view_type), e.set_text(T, e.get(g).collection);
        }), e.delegated("click", V, () => I(e.get(g).id)), e.append(u, f);
      }), e.append(a, c);
    };
    e.if(re, (a) => {
      e.get(s).length === 0 ? a(ne) : a(oe, -1);
    });
  }
  e.reset(K), e.reset(x);
  var le = e.sibling(x, 2);
  {
    var de = (a) => {
      var c = Ne(), h = e.child(c), u = e.child(h), g = e.sibling(e.child(u)), B = e.child(g);
      be(B, { class: "h-4 w-4" }), e.reset(g), e.reset(u);
      var f = e.sibling(u, 2), m = e.child(f), y = e.sibling(e.child(m));
      e.remove_input_defaults(y), e.reset(m);
      var $ = e.sibling(m, 2), N = e.sibling(e.child($), 2), j = e.child(N);
      j.value = j.__value = "";
      var O = e.sibling(j);
      e.each(O, 17, () => e.get(o), (p) => p.name, (p, A) => {
        var E = $e(), ve = e.child(E, !0);
        e.reset(E);
        var ee = {};
        e.template_effect(() => {
          e.set_text(ve, e.get(A).display_name ?? e.get(A).name), ee !== (ee = e.get(A).name) && (E.value = (E.__value = e.get(A).name) ?? "");
        }), e.append(p, E);
      }), e.reset(N), e.reset($);
      var z = e.sibling($, 2), b = e.sibling(e.child(z), 2), T = e.child(b);
      T.value = T.__value = "list";
      var k = e.sibling(T);
      k.value = k.__value = "board";
      var V = e.sibling(k);
      V.value = V.__value = "card";
      var W = e.sibling(V);
      W.value = W.__value = "calendar";
      var q = e.sibling(W);
      q.value = q.__value = "map", e.reset(b), e.reset(z);
      var X = e.sibling(z, 2), Q = e.sibling(e.child(X));
      e.remove_textarea_child(Q), e.reset(X), e.reset(f);
      var Y = e.sibling(f, 2), Z = e.child(Y), J = e.sibling(Z), ce = e.child(J, !0);
      e.reset(J), e.reset(Y), e.reset(h), e.reset(c), e.template_effect(() => {
        J.disabled = e.get(n) || !e.get(l).name || !e.get(l).collection, e.set_text(ce, e.get(n) ? "Saving…" : "Create");
      }), e.delegated("click", c, (p) => p.target === p.currentTarget && e.set(i, !1)), e.delegated("click", g, () => e.set(i, !1)), e.bind_value(y, () => e.get(l).name, (p) => e.get(l).name = p), e.bind_select_value(N, () => e.get(l).collection, (p) => e.get(l).collection = p), e.bind_select_value(b, () => e.get(l).view_type, (p) => e.get(l).view_type = p), e.bind_value(Q, () => e.get(l).config, (p) => e.get(l).config = p), e.delegated("click", Z, () => e.set(i, !1)), e.delegated("click", J, D), e.append(a, c);
    };
    e.if(le, (a) => {
      e.get(i) && a(de);
    });
  }
  e.delegated("click", U, () => e.set(i, !0)), e.append(r, L), e.pop();
}
e.delegate(["click"]);
function Ce() {
  const r = window.__zveltio;
  r && r.registerRoute({
    path: "views",
    component: Me,
    label: "Custom Views",
    icon: "LayoutGrid",
    category: "developer"
  });
}
Ce();
export {
  Ce as default
};
