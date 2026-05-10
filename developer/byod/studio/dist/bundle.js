import "svelte/internal/disclose-version";
import * as t from "svelte/internal/client";
import { onMount as ut } from "svelte";
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
const vt = {
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
var bt = t.from_svg("<svg><!><!></svg>");
function Y(p, a) {
  t.push(a, !0);
  const g = t.prop(a, "color", 3, "currentColor"), l = t.prop(a, "size", 3, 24), u = t.prop(a, "strokeWidth", 3, 2), N = t.prop(a, "absoluteStrokeWidth", 3, !1), r = t.prop(a, "iconNode", 19, () => []), v = t.rest_props(a, [
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
  var f = bt();
  t.attribute_effect(
    f,
    ($) => ({
      ...vt,
      ...v,
      width: l(),
      height: l(),
      stroke: g(),
      "stroke-width": $,
      class: [
        "lucide-icon lucide",
        a.name && `lucide-${a.name}`,
        a.class
      ]
    }),
    [
      () => N() ? Number(u()) * 24 / Number(l()) : u()
    ]
  );
  var P = t.child(f);
  t.each(P, 17, r, t.index, ($, D) => {
    var E = t.derived(() => t.to_array(t.get(D), 2));
    let Z = () => t.get(E)[0], F = () => t.get(E)[1];
    var H = t.comment(), q = t.first_child(H);
    t.element(q, Z, !0, (L, I) => {
      t.attribute_effect(L, () => ({ ...F() }));
    }), t.append($, H);
  });
  var i = t.sibling(P);
  t.snippet(i, () => a.children ?? t.noop), t.reset(f), t.append(p, f), t.pop();
}
function _t(p, a) {
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
  let g = t.rest_props(a, ["$$slots", "$$events", "$$legacy"]);
  const l = [
    ["ellipse", { cx: "12", cy: "5", rx: "9", ry: "3" }],
    ["path", { d: "M3 5V19A9 3 0 0 0 15 21.84" }],
    ["path", { d: "M21 5V8" }],
    ["path", { d: "M21 12L18 17H22L19 22" }],
    ["path", { d: "M3 12A9 3 0 0 0 14.59 14.87" }]
  ];
  Y(p, t.spread_props({ name: "database-zap" }, () => g, {
    get iconNode() {
      return l;
    },
    children: (u, N) => {
      var r = t.comment(), v = t.first_child(r);
      t.snippet(v, () => a.children ?? t.noop), t.append(u, r);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function ht(p, a) {
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
  let g = t.rest_props(a, ["$$slots", "$$events", "$$legacy"]);
  const l = [["polygon", { points: "6 3 20 12 6 21 6 3" }]];
  Y(p, t.spread_props({ name: "play" }, () => g, {
    get iconNode() {
      return l;
    },
    children: (u, N) => {
      var r = t.comment(), v = t.first_child(r);
      t.snippet(v, () => a.children ?? t.noop), t.append(u, r);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function gt(p, a) {
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
  let g = t.rest_props(a, ["$$slots", "$$events", "$$legacy"]);
  const l = [["path", { d: "M5 12h14" }], ["path", { d: "M12 5v14" }]];
  Y(p, t.spread_props({ name: "plus" }, () => g, {
    get iconNode() {
      return l;
    },
    children: (u, N) => {
      var r = t.comment(), v = t.first_child(r);
      t.snippet(v, () => a.children ?? t.noop), t.append(u, r);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function ft(p, a) {
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
  let g = t.rest_props(a, ["$$slots", "$$events", "$$legacy"]);
  const l = [
    ["path", { d: "M18 6 6 18" }],
    ["path", { d: "m6 6 12 12" }]
  ];
  Y(p, t.spread_props({ name: "x" }, () => g, {
    get iconNode() {
      return l;
    },
    children: (u, N) => {
      var r = t.comment(), v = t.first_child(r);
      t.snippet(v, () => a.children ?? t.noop), t.append(u, r);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
var mt = t.from_html('<button class="btn btn-primary btn-sm gap-2"><!> New profile</button>'), xt = t.from_html('<div class="alert alert-error"> </div>'), yt = t.from_html('<tr><td colspan="5" class="text-center py-6 text-base-content/60">No profiles. Create one to scan an external DB.</td></tr>'), wt = t.from_html('<tr><td> </td><td class="font-mono text-xs"> </td><td> </td><td> </td><td><button class="btn btn-ghost btn-xs gap-1"><!> </button> <button class="btn btn-ghost btn-xs">Delete</button></td></tr>'), kt = t.from_html('<div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Name</th><th>Schema</th><th>Last scan</th><th>Tables found</th><th></th></tr></thead><tbody><!></tbody></table></div>'), Nt = t.from_html('<tr><td colspan="5" class="text-center py-6 text-base-content/60">No scans yet.</td></tr>'), $t = t.from_html('<tr><td> </td><td> </td><td> </td><td> </td><td><span class="badge badge-sm"> </span></td></tr>'), St = t.from_html('<div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Profile</th><th>Started</th><th>Duration</th><th>Tables</th><th>Status</th></tr></thead><tbody><!></tbody></table></div>'), Pt = t.from_html('<div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><div class="bg-base-100 rounded-xl p-6 w-full max-w-lg"><div class="flex items-center justify-between mb-4"><h2 class="text-xl font-semibold">New connection profile</h2><button class="btn btn-ghost btn-sm btn-square"><!></button></div> <div class="space-y-3"><div><label class="label label-text">Name</label><input class="input input-bordered w-full"/></div> <div><label class="label label-text">Connection string</label><input type="password" class="input input-bordered w-full font-mono" placeholder="postgresql://user:pass@host:5432/db"/></div> <div><label class="label label-text">Schema</label><input class="input input-bordered w-full font-mono"/></div> <div><label class="label label-text">Include patterns (comma-separated)</label><input class="input input-bordered w-full font-mono text-xs" placeholder="public.users, public.orders*"/></div> <div><label class="label label-text">Exclude patterns</label><input class="input input-bordered w-full font-mono text-xs"/></div></div> <div class="flex justify-end gap-2 mt-4"><button class="btn btn-ghost">Cancel</button><button class="btn btn-primary"> </button></div></div></div>'), Tt = t.from_html('<div class="p-6 space-y-4"><header class="flex items-center justify-between"><h1 class="text-2xl font-semibold flex items-center gap-2"><!> Bring Your Own Database</h1> <!></header> <!> <p class="text-sm text-base-content/70">Connect to an external PostgreSQL database, scan its schema, and surface tables as virtual collections in Zveltio.</p> <div role="tablist" class="tabs tabs-bordered"><button role="tab">Connection profiles</button> <button role="tab">Scan history</button></div> <!></div> <!>', 1);
function zt(p, a) {
  var et;
  t.push(a, !0);
  const g = ((et = window.__zveltio) == null ? void 0 : et.engineUrl) ?? "";
  let l = t.state("profiles"), u = t.state(t.proxy([])), N = t.state(t.proxy([])), r = t.state(""), v = t.state(null), f = t.state(!1), P = t.state(!1), i = t.state(t.proxy({
    name: "",
    connection_string: "",
    schema: "public",
    include_patterns: "",
    exclude_patterns: "pg_*,information_schema.*"
  }));
  async function $(e, s) {
    const c = await fetch(`${g}${e}`, { credentials: "include", ...s }), b = await c.json().catch(() => ({}));
    if (!c.ok) throw new Error(b.error || `HTTP ${c.status}`);
    return b;
  }
  async function D() {
    try {
      const e = await $("/api/byod/scan-profiles");
      t.set(u, e.data ?? [], !0);
    } catch (e) {
      t.set(r, e.message, !0);
    }
  }
  async function E() {
    try {
      const e = await $("/api/byod/scan-history?limit=50");
      t.set(N, e.data ?? [], !0);
    } catch (e) {
      t.set(r, e.message, !0);
    }
  }
  async function Z() {
    t.set(P, !0), t.set(r, "");
    try {
      await $("/api/byod/scan-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...t.get(i),
          include_patterns: t.get(i).include_patterns.split(",").map((e) => e.trim()).filter(Boolean),
          exclude_patterns: t.get(i).exclude_patterns.split(",").map((e) => e.trim()).filter(Boolean)
        })
      }), t.set(f, !1), t.set(
        i,
        {
          name: "",
          connection_string: "",
          schema: "public",
          include_patterns: "",
          exclude_patterns: "pg_*,information_schema.*"
        },
        !0
      ), await D();
    } catch (e) {
      t.set(r, e.message, !0);
    } finally {
      t.set(P, !1);
    }
  }
  async function F(e) {
    t.set(v, e, !0), t.set(r, "");
    try {
      await $(`/api/byod/scan-profiles/${e}/scan`, { method: "POST" }), t.set(l, "history"), await E();
    } catch (s) {
      t.set(r, s.message, !0);
    } finally {
      t.set(v, null);
    }
  }
  async function H(e) {
    if (confirm("Delete profile?"))
      try {
        await $(`/api/byod/scan-profiles/${e}`, { method: "DELETE" }), await D();
      } catch (s) {
        t.set(r, s.message, !0);
      }
  }
  t.user_effect(() => {
    t.get(l) === "profiles" ? D() : E();
  }), ut(D);
  var q = Tt(), L = t.first_child(q), I = t.child(L), J = t.child(I), at = t.child(J);
  _t(at, { class: "h-6 w-6" }), t.next(), t.reset(J);
  var st = t.sibling(J, 2);
  {
    var rt = (e) => {
      var s = mt(), c = t.child(s);
      gt(c, { class: "h-4 w-4" }), t.next(), t.reset(s), t.delegated("click", s, () => t.set(f, !0)), t.append(e, s);
    };
    t.if(st, (e) => {
      t.get(l) === "profiles" && e(rt);
    });
  }
  t.reset(I);
  var X = t.sibling(I, 2);
  {
    var lt = (e) => {
      var s = xt(), c = t.child(s, !0);
      t.reset(s), t.template_effect(() => t.set_text(c, t.get(r))), t.append(e, s);
    };
    t.if(X, (e) => {
      t.get(r) && e(lt);
    });
  }
  var Q = t.sibling(X, 4), R = t.child(Q);
  let G;
  var K = t.sibling(R, 2);
  let tt;
  t.reset(Q);
  var nt = t.sibling(Q, 2);
  {
    var it = (e) => {
      var s = kt(), c = t.child(s), b = t.sibling(t.child(c)), T = t.child(b);
      {
        var O = (d) => {
          var _ = yt();
          t.append(d, _);
        }, z = (d) => {
          var _ = t.comment(), C = t.first_child(_);
          t.each(C, 17, () => t.get(u), (x) => x.id, (x, n) => {
            var y = wt(), m = t.child(y), j = t.child(m, !0);
            t.reset(m);
            var w = t.sibling(m), M = t.child(w, !0);
            t.reset(w);
            var k = t.sibling(w), B = t.child(k, !0);
            t.reset(k);
            var h = t.sibling(k), A = t.child(h, !0);
            t.reset(h);
            var o = t.sibling(h), S = t.child(o), U = t.child(S);
            ht(U, { class: "h-3 w-3" });
            var W = t.sibling(U);
            t.reset(S);
            var pt = t.sibling(S, 2);
            t.reset(o), t.reset(y), t.template_effect(
              (V) => {
                t.set_text(j, t.get(n).name), t.set_text(M, t.get(n).schema), t.set_text(B, V), t.set_text(A, t.get(n).tables_found ?? "—"), S.disabled = t.get(v) === t.get(n).id, t.set_text(W, ` ${t.get(v) === t.get(n).id ? "Scanning…" : "Scan"}`);
              },
              [
                () => {
                  var V;
                  return ((V = t.get(n).last_scanned_at) == null ? void 0 : V.slice(0, 16).replace("T", " ")) ?? "never";
                }
              ]
            ), t.delegated("click", S, () => F(t.get(n).id)), t.delegated("click", pt, () => H(t.get(n).id)), t.append(x, y);
          }), t.append(d, _);
        };
        t.if(T, (d) => {
          t.get(u).length === 0 ? d(O) : d(z, -1);
        });
      }
      t.reset(b), t.reset(c), t.reset(s), t.append(e, s);
    }, ot = (e) => {
      var s = St(), c = t.child(s), b = t.sibling(t.child(c)), T = t.child(b);
      {
        var O = (d) => {
          var _ = Nt();
          t.append(d, _);
        }, z = (d) => {
          var _ = t.comment(), C = t.first_child(_);
          t.each(C, 17, () => t.get(N), (x) => x.id, (x, n) => {
            var y = $t(), m = t.child(y), j = t.child(m, !0);
            t.reset(m);
            var w = t.sibling(m), M = t.child(w, !0);
            t.reset(w);
            var k = t.sibling(w), B = t.child(k);
            t.reset(k);
            var h = t.sibling(k), A = t.child(h, !0);
            t.reset(h);
            var o = t.sibling(h), S = t.child(o), U = t.child(S, !0);
            t.reset(S), t.reset(o), t.reset(y), t.template_effect(
              (W) => {
                t.set_text(j, t.get(n).profile_name ?? t.get(n).profile_id), t.set_text(M, W), t.set_text(B, `${t.get(n).duration_ms ?? "—" ?? ""} ms`), t.set_text(A, t.get(n).tables_count ?? 0), t.set_text(U, t.get(n).status);
              },
              [() => {
                var W;
                return (W = t.get(n).started_at) == null ? void 0 : W.slice(0, 16).replace("T", " ");
              }]
            ), t.append(x, y);
          }), t.append(d, _);
        };
        t.if(T, (d) => {
          t.get(N).length === 0 ? d(O) : d(z, -1);
        });
      }
      t.reset(b), t.reset(c), t.reset(s), t.append(e, s);
    };
    t.if(nt, (e) => {
      t.get(l) === "profiles" ? e(it) : e(ot, -1);
    });
  }
  t.reset(L);
  var dt = t.sibling(L, 2);
  {
    var ct = (e) => {
      var s = Pt(), c = t.child(s), b = t.child(c), T = t.sibling(t.child(b)), O = t.child(T);
      ft(O, { class: "h-4 w-4" }), t.reset(T), t.reset(b);
      var z = t.sibling(b, 2), d = t.child(z), _ = t.sibling(t.child(d));
      t.remove_input_defaults(_), t.reset(d);
      var C = t.sibling(d, 2), x = t.sibling(t.child(C));
      t.remove_input_defaults(x), t.reset(C);
      var n = t.sibling(C, 2), y = t.sibling(t.child(n));
      t.remove_input_defaults(y), t.reset(n);
      var m = t.sibling(n, 2), j = t.sibling(t.child(m));
      t.remove_input_defaults(j), t.reset(m);
      var w = t.sibling(m, 2), M = t.sibling(t.child(w));
      t.remove_input_defaults(M), t.reset(w), t.reset(z);
      var k = t.sibling(z, 2), B = t.child(k), h = t.sibling(B), A = t.child(h, !0);
      t.reset(h), t.reset(k), t.reset(c), t.reset(s), t.template_effect(() => {
        h.disabled = t.get(P) || !t.get(i).name || !t.get(i).connection_string, t.set_text(A, t.get(P) ? "Saving…" : "Create");
      }), t.delegated("click", s, (o) => o.target === o.currentTarget && t.set(f, !1)), t.delegated("click", T, () => t.set(f, !1)), t.bind_value(_, () => t.get(i).name, (o) => t.get(i).name = o), t.bind_value(x, () => t.get(i).connection_string, (o) => t.get(i).connection_string = o), t.bind_value(y, () => t.get(i).schema, (o) => t.get(i).schema = o), t.bind_value(j, () => t.get(i).include_patterns, (o) => t.get(i).include_patterns = o), t.bind_value(M, () => t.get(i).exclude_patterns, (o) => t.get(i).exclude_patterns = o), t.delegated("click", B, () => t.set(f, !1)), t.delegated("click", h, Z), t.append(e, s);
    };
    t.if(dt, (e) => {
      t.get(f) && e(ct);
    });
  }
  t.template_effect(() => {
    G = t.set_class(R, 1, "tab", null, G, { "tab-active": t.get(l) === "profiles" }), tt = t.set_class(K, 1, "tab", null, tt, { "tab-active": t.get(l) === "history" });
  }), t.delegated("click", R, () => t.set(l, "profiles")), t.delegated("click", K, () => t.set(l, "history")), t.append(p, q), t.pop();
}
t.delegate(["click"]);
function Ct() {
  const p = window.__zveltio;
  p && p.registerRoute({
    path: "byod",
    component: zt,
    label: "BYOD",
    icon: "DatabaseZap",
    category: "developer"
  });
}
Ct();
export {
  Ct as default
};
