import "svelte/internal/disclose-version";
import * as t from "svelte/internal/client";
import { onMount as nt } from "svelte";
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
const ot = {
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
var lt = t.from_svg("<svg><!><!></svg>");
function R(d, r) {
  t.push(r, !0);
  const h = t.prop(r, "color", 3, "currentColor"), a = t.prop(r, "size", 3, 24), c = t.prop(r, "strokeWidth", 3, 2), _ = t.prop(r, "absoluteStrokeWidth", 3, !1), o = t.prop(r, "iconNode", 19, () => []), l = t.rest_props(r, [
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
  var m = lt();
  t.attribute_effect(
    m,
    (x) => ({
      ...ot,
      ...l,
      width: a(),
      height: a(),
      stroke: h(),
      "stroke-width": x,
      class: [
        "lucide-icon lucide",
        r.name && `lucide-${r.name}`,
        r.class
      ]
    }),
    [
      () => _() ? Number(c()) * 24 / Number(a()) : c()
    ]
  );
  var N = t.child(m);
  t.each(N, 17, o, t.index, (x, z) => {
    var M = t.derived(() => t.to_array(t.get(z), 2));
    let O = () => t.get(M)[0], P = () => t.get(M)[1];
    var S = t.comment(), T = t.first_child(S);
    t.element(T, O, !0, (C, W) => {
      t.attribute_effect(C, () => ({ ...P() }));
    }), t.append(x, S);
  });
  var b = t.sibling(N);
  t.snippet(b, () => r.children ?? t.noop), t.reset(m), t.append(d, m), t.pop();
}
function dt(d, r) {
  t.push(r, !0);
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
  let h = t.rest_props(r, ["$$slots", "$$events", "$$legacy"]);
  const a = [["polygon", { points: "6 3 20 12 6 21 6 3" }]];
  R(d, t.spread_props({ name: "play" }, () => h, {
    get iconNode() {
      return a;
    },
    children: (c, _) => {
      var o = t.comment(), l = t.first_child(o);
      t.snippet(l, () => r.children ?? t.noop), t.append(c, o);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function ct(d, r) {
  t.push(r, !0);
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
  let h = t.rest_props(r, ["$$slots", "$$events", "$$legacy"]);
  const a = [
    [
      "path",
      {
        d: "M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"
      }
    ],
    ["path", { d: "M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" }],
    ["path", { d: "M12 17.5v-11" }]
  ];
  R(d, t.spread_props({ name: "receipt" }, () => h, {
    get iconNode() {
      return a;
    },
    children: (c, _) => {
      var o = t.comment(), l = t.first_child(o);
      t.snippet(l, () => r.children ?? t.noop), t.append(c, o);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function pt(d, r) {
  t.push(r, !0);
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
  let h = t.rest_props(r, ["$$slots", "$$events", "$$legacy"]);
  const a = [
    ["path", { d: "M3 7V5a2 2 0 0 1 2-2h2" }],
    ["path", { d: "M17 3h2a2 2 0 0 1 2 2v2" }],
    ["path", { d: "M21 17v2a2 2 0 0 1-2 2h-2" }],
    ["path", { d: "M7 21H5a2 2 0 0 1-2-2v-2" }],
    ["path", { d: "M7 12h10" }]
  ];
  R(d, t.spread_props({ name: "scan-line" }, () => h, {
    get iconNode() {
      return a;
    },
    children: (c, _) => {
      var o = t.comment(), l = t.first_child(o);
      t.snippet(l, () => r.children ?? t.noop), t.append(c, o);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function vt(d, r) {
  t.push(r, !0);
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
  let h = t.rest_props(r, ["$$slots", "$$events", "$$legacy"]);
  const a = [
    [
      "rect",
      { width: "18", height: "18", x: "3", y: "3", rx: "2" }
    ]
  ];
  R(d, t.spread_props({ name: "square" }, () => h, {
    get iconNode() {
      return a;
    },
    children: (c, _) => {
      var o = t.comment(), l = t.first_child(o);
      t.snippet(l, () => r.children ?? t.noop), t.append(c, o);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
var ht = t.from_html('<div class="alert alert-error"> </div>'), ut = t.from_html('<div class="flex items-center justify-between"><div><div class="text-xs text-base-content/60">Session open since</div> <div class="font-medium"> </div> <div class="text-xs text-base-content/60"> </div></div> <div class="flex gap-2 items-center"><input type="number" step="0.01" placeholder="Closing float" class="input input-sm input-bordered w-32"/> <button class="btn btn-error btn-sm gap-2"><!> Close session</button></div></div>'), gt = t.from_html('<div class="flex items-center justify-between"><div class="text-base-content/70">No open session.</div> <div class="flex gap-2 items-center"><input type="number" step="0.01" placeholder="Opening float" class="input input-sm input-bordered w-32"/> <button class="btn btn-primary btn-sm gap-2"><!> Open session</button></div></div>'), _t = t.from_html('<tr><td colspan="4" class="text-center py-6 text-base-content/60">No orders yet.</td></tr>'), mt = t.from_html('<tr><td class="font-mono"> </td><td> </td><td class="text-right"> </td><td><span class="badge badge-sm"> </span></td></tr>'), ft = t.from_html('<tr><td colspan="3" class="text-center py-6 text-base-content/60">No reports.</td></tr>'), bt = t.from_html('<tr><td> </td><td class="text-right"> </td><td class="text-right"> </td></tr>'), xt = t.from_html('<div class="p-6 space-y-4"><header class="flex items-center justify-between"><h1 class="text-2xl font-semibold flex items-center gap-2"><!> Point of Sale</h1></header> <!> <div class="bg-base-100 rounded-lg shadow p-4"><!></div> <div class="grid grid-cols-1 lg:grid-cols-2 gap-4"><div class="bg-base-100 rounded-lg shadow"><div class="p-3 font-medium border-b flex items-center gap-2"><!> Recent orders</div> <table class="table table-sm"><thead><tr><th>Number</th><th>Time</th><th class="text-right">Total</th><th>Status</th></tr></thead><tbody><!></tbody></table></div> <div class="bg-base-100 rounded-lg shadow"><div class="p-3 font-medium border-b">Recent Z-reports</div> <table class="table table-sm"><thead><tr><th>Date</th><th class="text-right">Sales</th><th class="text-right">Orders</th></tr></thead><tbody><!></tbody></table></div></div></div>');
function yt(d, r) {
  var V;
  t.push(r, !0);
  const h = ((V = window.__zveltio) == null ? void 0 : V.engineUrl) ?? "";
  let a = t.state(null), c = t.state(t.proxy([])), _ = t.state(t.proxy([])), o = t.state(!1), l = t.state(""), m = t.state(0), N = t.state(0);
  async function b(e, s) {
    const i = await fetch(`${h}${e}`, { credentials: "include", ...s }), n = await i.json().catch(() => ({}));
    if (!i.ok) throw new Error(n.error || `HTTP ${i.status}`);
    return n;
  }
  async function x() {
    t.set(o, !0), t.set(l, "");
    try {
      const [e, s, i] = await Promise.all([
        b("/api/pos/sessions/active").catch(() => ({ data: null })),
        b("/api/pos/orders?limit=20"),
        b("/api/pos/z-reports?limit=10").catch(() => ({ data: [] }))
      ]);
      t.set(a, e.data, !0), t.set(c, s.data ?? [], !0), t.set(_, i.data ?? [], !0);
    } catch (e) {
      t.set(l, e.message, !0);
    } finally {
      t.set(o, !1);
    }
  }
  async function z() {
    try {
      await b("/api/pos/sessions/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opening_float: t.get(m) })
      }), await x();
    } catch (e) {
      t.set(l, e.message, !0);
    }
  }
  async function M() {
    if (t.get(a))
      try {
        await b(`/api/pos/sessions/${t.get(a).id}/close`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ closing_float: t.get(N) })
        }), await x();
      } catch (e) {
        t.set(l, e.message, !0);
      }
  }
  nt(x);
  function O(e) {
    return new Intl.NumberFormat("ro-RO", { style: "currency", currency: "RON" }).format(e);
  }
  var P = xt(), S = t.child(P), T = t.child(S), C = t.child(T);
  pt(C, { class: "h-6 w-6" }), t.next(), t.reset(T), t.reset(S);
  var W = t.sibling(S, 2);
  {
    var Z = (e) => {
      var s = ht(), i = t.child(s, !0);
      t.reset(s), t.template_effect(() => t.set_text(i, t.get(l))), t.append(e, s);
    };
    t.if(W, (e) => {
      t.get(l) && e(Z);
    });
  }
  var D = t.sibling(W, 2), B = t.child(D);
  {
    var E = (e) => {
      var s = ut(), i = t.child(s), n = t.sibling(t.child(i), 2), p = t.child(n, !0);
      t.reset(n);
      var v = t.sibling(n, 2), u = t.child(v);
      t.reset(v), t.reset(i);
      var k = t.sibling(i, 2), g = t.child(k);
      t.remove_input_defaults(g);
      var y = t.sibling(g, 2), f = t.child(y);
      vt(f, { class: "h-4 w-4" }), t.next(), t.reset(y), t.reset(k), t.reset(s), t.template_effect(
        (w, $) => {
          t.set_text(p, w), t.set_text(u, `Opening float: ${$ ?? ""}`);
        },
        [
          () => new Date(t.get(a).opened_at).toLocaleString(),
          () => O(Number(t.get(a).opening_float))
        ]
      ), t.bind_value(g, () => t.get(N), (w) => t.set(N, w)), t.delegated("click", y, M), t.append(e, s);
    }, G = (e) => {
      var s = gt(), i = t.sibling(t.child(s), 2), n = t.child(i);
      t.remove_input_defaults(n);
      var p = t.sibling(n, 2), v = t.child(p);
      dt(v, { class: "h-4 w-4" }), t.next(), t.reset(p), t.reset(i), t.reset(s), t.bind_value(n, () => t.get(m), (u) => t.set(m, u)), t.delegated("click", p, z), t.append(e, s);
    };
    t.if(B, (e) => {
      t.get(a) ? e(E) : e(G, -1);
    });
  }
  t.reset(D);
  var H = t.sibling(D, 2), L = t.child(H), F = t.child(L), K = t.child(F);
  ct(K, { class: "h-4 w-4" }), t.next(), t.reset(F);
  var q = t.sibling(F, 2), A = t.sibling(t.child(q)), Q = t.child(A);
  {
    var X = (e) => {
      var s = _t();
      t.append(e, s);
    }, Y = (e) => {
      var s = t.comment(), i = t.first_child(s);
      t.each(i, 17, () => t.get(c), (n) => n.id, (n, p) => {
        var v = mt(), u = t.child(v), k = t.child(u, !0);
        t.reset(u);
        var g = t.sibling(u), y = t.child(g, !0);
        t.reset(g);
        var f = t.sibling(g), w = t.child(f, !0);
        t.reset(f);
        var $ = t.sibling(f), j = t.child($), st = t.child(j, !0);
        t.reset(j), t.reset($), t.reset(v), t.template_effect(
          (at, it) => {
            t.set_text(k, t.get(p).order_number), t.set_text(y, at), t.set_text(w, it), t.set_text(st, t.get(p).status);
          },
          [
            () => new Date(t.get(p).created_at).toLocaleTimeString(),
            () => O(Number(t.get(p).total))
          ]
        ), t.append(n, v);
      }), t.append(e, s);
    };
    t.if(Q, (e) => {
      t.get(c).length === 0 ? e(X) : e(Y, -1);
    });
  }
  t.reset(A), t.reset(q), t.reset(L);
  var I = t.sibling(L, 2), J = t.sibling(t.child(I), 2), U = t.sibling(t.child(J)), tt = t.child(U);
  {
    var et = (e) => {
      var s = ft();
      t.append(e, s);
    }, rt = (e) => {
      var s = t.comment(), i = t.first_child(s);
      t.each(i, 17, () => t.get(_), (n) => n.id, (n, p) => {
        var v = bt(), u = t.child(v), k = t.child(u, !0);
        t.reset(u);
        var g = t.sibling(u), y = t.child(g, !0);
        t.reset(g);
        var f = t.sibling(g), w = t.child(f, !0);
        t.reset(f), t.reset(v), t.template_effect(
          ($, j) => {
            t.set_text(k, $), t.set_text(y, j), t.set_text(w, t.get(p).order_count);
          },
          [
            () => new Date(t.get(p).created_at).toLocaleDateString(),
            () => O(Number(t.get(p).total_sales))
          ]
        ), t.append(n, v);
      }), t.append(e, s);
    };
    t.if(tt, (e) => {
      t.get(_).length === 0 ? e(et) : e(rt, -1);
    });
  }
  t.reset(U), t.reset(J), t.reset(I), t.reset(H), t.reset(P), t.append(d, P), t.pop();
}
t.delegate(["click"]);
function wt() {
  const d = window.__zveltio;
  d && d.registerRoute({
    path: "pos",
    component: yt,
    label: "POS",
    icon: "ScanLine",
    category: "operations"
  });
}
wt();
export {
  wt as default
};
