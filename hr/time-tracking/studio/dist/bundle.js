import "svelte/internal/disclose-version";
import * as t from "svelte/internal/client";
import { onMount as X } from "svelte";
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
const Y = {
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
var Z = t.from_svg("<svg><!><!></svg>");
function O(c, r) {
  t.push(r, !0);
  const g = t.prop(r, "color", 3, "currentColor"), l = t.prop(r, "size", 3, 24), v = t.prop(r, "strokeWidth", 3, 2), h = t.prop(r, "absoluteStrokeWidth", 3, !1), o = t.prop(r, "iconNode", 19, () => []), s = t.rest_props(r, [
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
  var p = Z();
  t.attribute_effect(
    p,
    (j) => ({
      ...Y,
      ...s,
      width: l(),
      height: l(),
      stroke: g(),
      "stroke-width": j,
      class: [
        "lucide-icon lucide",
        r.name && `lucide-${r.name}`,
        r.class
      ]
    }),
    [
      () => h() ? Number(v()) * 24 / Number(l()) : v()
    ]
  );
  var b = t.child(p);
  t.each(b, 17, o, t.index, (j, W) => {
    var P = t.derived(() => t.to_array(t.get(W), 2));
    let T = () => t.get(P)[0], N = () => t.get(P)[1];
    var S = t.comment(), z = t.first_child(S);
    t.element(z, T, !0, ($, q) => {
      t.attribute_effect($, () => ({ ...N() }));
    }), t.append(j, S);
  });
  var k = t.sibling(b);
  t.snippet(k, () => r.children ?? t.noop), t.reset(p), t.append(c, p), t.pop();
}
function tt(c, r) {
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
  let g = t.rest_props(r, ["$$slots", "$$events", "$$legacy"]);
  const l = [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["polyline", { points: "12 6 12 12 16 14" }]
  ];
  O(c, t.spread_props({ name: "clock" }, () => g, {
    get iconNode() {
      return l;
    },
    children: (v, h) => {
      var o = t.comment(), s = t.first_child(o);
      t.snippet(s, () => r.children ?? t.noop), t.append(v, o);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function et(c, r) {
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
  let g = t.rest_props(r, ["$$slots", "$$events", "$$legacy"]);
  const l = [["polygon", { points: "6 3 20 12 6 21 6 3" }]];
  O(c, t.spread_props({ name: "play" }, () => g, {
    get iconNode() {
      return l;
    },
    children: (v, h) => {
      var o = t.comment(), s = t.first_child(o);
      t.snippet(s, () => r.children ?? t.noop), t.append(v, o);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function rt(c, r) {
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
  let g = t.rest_props(r, ["$$slots", "$$events", "$$legacy"]);
  const l = [
    [
      "rect",
      { width: "18", height: "18", x: "3", y: "3", rx: "2" }
    ]
  ];
  O(c, t.spread_props({ name: "square" }, () => g, {
    get iconNode() {
      return l;
    },
    children: (v, h) => {
      var o = t.comment(), s = t.first_child(o);
      t.snippet(s, () => r.children ?? t.noop), t.append(v, o);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
var it = t.from_html('<div class="alert alert-error"> </div>'), at = t.from_html('<div class="flex items-center justify-between"><div><div class="text-xs text-base-content/60">Tracking now</div> <div class="font-medium"> </div> <div class="text-xs text-base-content/60"> </div></div> <button class="btn btn-error btn-sm gap-2"><!> Stop timer</button></div>'), ot = t.from_html("<option> </option>"), st = t.from_html('<div class="grid grid-cols-1 md:grid-cols-3 gap-3"><select class="select select-bordered w-full"><option>— Project —</option><!></select> <input class="input input-bordered w-full md:col-span-1" placeholder="What are you working on?"/> <button class="btn btn-primary gap-2"><!> Start timer</button></div>'), nt = t.from_html('<tr><td colspan="5" class="text-center py-6 text-base-content/60">Loading…</td></tr>'), lt = t.from_html('<tr><td colspan="5" class="text-center py-6 text-base-content/60">No time entries.</td></tr>'), dt = t.from_html("<tr><td> </td><td> </td><td> </td><td> </td><td> </td></tr>"), ct = t.from_html('<div class="p-6 space-y-4"><header class="flex items-center justify-between"><h1 class="text-2xl font-semibold flex items-center gap-2"><!> Time Tracking</h1></header> <!> <div class="bg-base-100 rounded-lg shadow p-4"><!></div> <div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Date</th><th>Project</th><th>Description</th><th>Duration</th><th>Billable</th></tr></thead><tbody><!></tbody></table></div></div>');
function pt(c, r) {
  var M;
  t.push(r, !0);
  const g = ((M = window.__zveltio) == null ? void 0 : M.engineUrl) ?? "";
  let l = t.state(t.proxy([])), v = t.state(t.proxy([])), h = t.state(null), o = t.state(!1), s = t.state(""), p = t.state(t.proxy({ project_id: "", description: "" }));
  async function b(e, i) {
    const a = await fetch(`${g}${e}`, { credentials: "include", ...i }), n = await a.json().catch(() => ({}));
    if (!a.ok) throw new Error(n.error || `HTTP ${a.status}`);
    return n;
  }
  async function k() {
    t.set(o, !0), t.set(s, "");
    try {
      const [e, i, a] = await Promise.all([
        b("/api/time/entries?limit=50"),
        b("/api/time/projects"),
        b("/api/time/timer/active").catch(() => ({ data: null }))
      ]);
      t.set(l, e.data ?? [], !0), t.set(v, i.data ?? [], !0), t.set(h, a.data, !0);
    } catch (e) {
      t.set(s, e.message, !0);
    } finally {
      t.set(o, !1);
    }
  }
  async function j() {
    try {
      await b("/api/time/timer/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(t.get(p))
      }), t.set(p, { project_id: "", description: "" }, !0), await k();
    } catch (e) {
      t.set(s, e.message, !0);
    }
  }
  async function W() {
    try {
      await b("/api/time/timer/stop", { method: "POST" }), await k();
    } catch (e) {
      t.set(s, e.message, !0);
    }
  }
  function P(e) {
    const i = Math.floor(e / 60), a = e % 60;
    return `${i}h ${String(a).padStart(2, "0")}m`;
  }
  X(k);
  var T = ct(), N = t.child(T), S = t.child(N), z = t.child(S);
  tt(z, { class: "h-6 w-6" }), t.next(), t.reset(S), t.reset(N);
  var $ = t.sibling(N, 2);
  {
    var q = (e) => {
      var i = it(), a = t.child(i, !0);
      t.reset(i), t.template_effect(() => t.set_text(a, t.get(s))), t.append(e, i);
    };
    t.if($, (e) => {
      t.get(s) && e(q);
    });
  }
  var C = t.sibling($, 2), E = t.child(C);
  {
    var F = (e) => {
      var i = at(), a = t.child(i), n = t.sibling(t.child(a), 2), m = t.child(n, !0);
      t.reset(n);
      var u = t.sibling(n, 2), _ = t.child(u);
      t.reset(u), t.reset(a);
      var x = t.sibling(a, 2), d = t.child(x);
      rt(d, { class: "h-4 w-4" }), t.next(), t.reset(x), t.reset(i), t.template_effect(
        (y) => {
          t.set_text(m, t.get(h).description || t.get(h).project_name || "(no description)"), t.set_text(_, `Started: ${y ?? ""}`);
        },
        [
          () => new Date(t.get(h).started_at).toLocaleString()
        ]
      ), t.delegated("click", x, W), t.append(e, i);
    }, H = (e) => {
      var i = st(), a = t.child(i), n = t.child(a);
      n.value = n.__value = "";
      var m = t.sibling(n);
      t.each(m, 17, () => t.get(v), (d) => d.id, (d, y) => {
        var f = ot(), D = t.child(f, !0);
        t.reset(f);
        var w = {};
        t.template_effect(() => {
          t.set_text(D, t.get(y).name), w !== (w = t.get(y).id) && (f.value = (f.__value = t.get(y).id) ?? "");
        }), t.append(d, f);
      }), t.reset(a);
      var u = t.sibling(a, 2);
      t.remove_input_defaults(u);
      var _ = t.sibling(u, 2), x = t.child(_);
      et(x, { class: "h-4 w-4" }), t.next(), t.reset(_), t.reset(i), t.template_effect(() => _.disabled = !t.get(p).project_id), t.bind_select_value(a, () => t.get(p).project_id, (d) => t.get(p).project_id = d), t.bind_value(u, () => t.get(p).description, (d) => t.get(p).description = d), t.delegated("click", _, j), t.append(e, i);
    };
    t.if(E, (e) => {
      t.get(h) ? e(F) : e(H, -1);
    });
  }
  t.reset(C);
  var A = t.sibling(C, 2), B = t.child(A), L = t.sibling(t.child(B)), I = t.child(L);
  {
    var J = (e) => {
      var i = nt();
      t.append(e, i);
    }, R = (e) => {
      var i = lt();
      t.append(e, i);
    }, G = (e) => {
      var i = t.comment(), a = t.first_child(i);
      t.each(a, 17, () => t.get(l), (n) => n.id, (n, m) => {
        var u = dt(), _ = t.child(u), x = t.child(_, !0);
        t.reset(_);
        var d = t.sibling(_), y = t.child(d, !0);
        t.reset(d);
        var f = t.sibling(d), D = t.child(f, !0);
        t.reset(f);
        var w = t.sibling(f), K = t.child(w, !0);
        t.reset(w);
        var U = t.sibling(w), Q = t.child(U, !0);
        t.reset(U), t.reset(u), t.template_effect(
          (V) => {
            t.set_text(x, t.get(m).date), t.set_text(y, t.get(m).project_name ?? "—"), t.set_text(D, t.get(m).description ?? "—"), t.set_text(K, V), t.set_text(Q, t.get(m).billable ? "✓" : "");
          },
          [() => P(Number(t.get(m).minutes ?? 0))]
        ), t.append(n, u);
      }), t.append(e, i);
    };
    t.if(I, (e) => {
      t.get(o) ? e(J) : t.get(l).length === 0 ? e(R, 1) : e(G, -1);
    });
  }
  t.reset(L), t.reset(B), t.reset(A), t.reset(T), t.append(c, T), t.pop();
}
t.delegate(["click"]);
function vt() {
  const c = window.__zveltio;
  c && c.registerRoute({
    path: "hr-time-tracking",
    component: pt,
    label: "Time Tracking",
    icon: "Clock",
    category: "hr"
  });
}
vt();
export {
  vt as default
};
