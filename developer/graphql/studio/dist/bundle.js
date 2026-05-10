import "svelte/internal/disclose-version";
import * as t from "svelte/internal/client";
import "svelte";
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
const gt = {
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
var _t = t.from_svg("<svg><!><!></svg>");
function B(g, r) {
  t.push(r, !0);
  const m = t.prop(r, "color", 3, "currentColor"), a = t.prop(r, "size", 3, 24), _ = t.prop(r, "strokeWidth", 3, 2), w = t.prop(r, "absoluteStrokeWidth", 3, !1), h = t.prop(r, "iconNode", 19, () => []), n = t.rest_props(r, [
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
  var k = _t();
  t.attribute_effect(
    k,
    (P) => ({
      ...gt,
      ...n,
      width: a(),
      height: a(),
      stroke: m(),
      "stroke-width": P,
      class: [
        "lucide-icon lucide",
        r.name && `lucide-${r.name}`,
        r.class
      ]
    }),
    [
      () => w() ? Number(_()) * 24 / Number(a()) : _()
    ]
  );
  var S = t.child(k);
  t.each(S, 17, h, t.index, (P, F) => {
    var L = t.derived(() => t.to_array(t.get(F), 2));
    let G = () => t.get(L)[0], I = () => t.get(L)[1];
    var z = t.comment(), O = t.first_child(z);
    t.element(O, G, !0, (U, E) => {
      t.attribute_effect(U, () => ({ ...I() }));
    }), t.append(P, z);
  });
  var T = t.sibling(S);
  t.snippet(T, () => r.children ?? t.noop), t.reset(k), t.append(g, k), t.pop();
}
function ut(g, r) {
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
  let m = t.rest_props(r, ["$$slots", "$$events", "$$legacy"]);
  const a = [
    [
      "rect",
      { x: "16", y: "16", width: "6", height: "6", rx: "1" }
    ],
    [
      "rect",
      { x: "2", y: "16", width: "6", height: "6", rx: "1" }
    ],
    [
      "rect",
      { x: "9", y: "2", width: "6", height: "6", rx: "1" }
    ],
    ["path", { d: "M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" }],
    ["path", { d: "M12 12V8" }]
  ];
  B(g, t.spread_props({ name: "network" }, () => m, {
    get iconNode() {
      return a;
    },
    children: (_, w) => {
      var h = t.comment(), n = t.first_child(h);
      t.snippet(n, () => r.children ?? t.noop), t.append(_, h);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function st(g, r) {
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
  let m = t.rest_props(r, ["$$slots", "$$events", "$$legacy"]);
  const a = [["polygon", { points: "6 3 20 12 6 21 6 3" }]];
  B(g, t.spread_props({ name: "play" }, () => m, {
    get iconNode() {
      return a;
    },
    children: (_, w) => {
      var h = t.comment(), n = t.first_child(h);
      t.snippet(n, () => r.children ?? t.noop), t.append(_, h);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function bt(g, r) {
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
  let m = t.rest_props(r, ["$$slots", "$$events", "$$legacy"]);
  const a = [
    [
      "path",
      {
        d: "M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"
      }
    ],
    ["path", { d: "M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7" }],
    ["path", { d: "M7 3v4a1 1 0 0 0 1 1h7" }]
  ];
  B(g, t.spread_props({ name: "save" }, () => m, {
    get iconNode() {
      return a;
    },
    children: (_, w) => {
      var h = t.comment(), n = t.first_child(h);
      t.snippet(n, () => r.children ?? t.noop), t.append(_, h);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
var ft = t.from_html('<div class="alert alert-error"> </div>'), mt = t.from_html('<div class="grid grid-cols-2 gap-4 h-[60vh]"><div class="bg-base-100 rounded-lg shadow flex flex-col"><div class="p-3 border-b flex items-center justify-between"><span class="font-medium text-sm">Query</span><button class="btn btn-primary btn-sm gap-2"><!> </button></div> <textarea class="textarea textarea-ghost flex-1 font-mono text-sm rounded-none"></textarea></div> <div class="bg-base-100 rounded-lg shadow flex flex-col"><div class="p-3 border-b font-medium text-sm">Response</div> <pre class="flex-1 p-3 overflow-auto font-mono text-xs"> </pre></div></div>'), xt = t.from_html('<tr><td colspan="5" class="text-center py-6 text-base-content/60">No operations logged.</td></tr>'), yt = t.from_html('<tr><td> </td><td class="font-mono text-xs max-w-xs truncate"> </td><td> </td><td> </td><td><span> </span></td></tr>'), wt = t.from_html('<div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Time</th><th>Operation</th><th>User</th><th>Duration</th><th>Status</th></tr></thead><tbody><!></tbody></table></div>'), kt = t.from_html('<tr><td colspan="3" class="text-center py-6 text-base-content/60">No persisted queries.</td></tr>'), Nt = t.from_html('<tr><td class="font-mono text-xs"> </td><td class="font-mono text-xs max-w-md truncate"> </td><td> </td></tr>'), qt = t.from_html('<div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>ID</th><th>Operation</th><th>Created</th></tr></thead><tbody><!></tbody></table></div>'), Pt = t.from_html('<tr><td colspan="4" class="text-center py-6 text-base-content/60">No field policies — all fields readable.</td></tr>'), jt = t.from_html('<tr><td class="font-mono"> </td><td class="font-mono"> </td><td class="text-xs"> </td><td><span class="badge badge-sm"> </span></td></tr>'), St = t.from_html('<div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Type</th><th>Field</th><th>Roles</th><th>Mode</th></tr></thead><tbody><!></tbody></table></div>'), Tt = t.from_html('<div class="p-6 space-y-4"><header><h1 class="text-2xl font-semibold flex items-center gap-2"><!> GraphQL</h1></header> <!> <div role="tablist" class="tabs tabs-bordered"><button role="tab"><!> Playground</button> <button role="tab">Operation logs</button> <button role="tab"><!> Persisted queries</button> <button role="tab">Field policies</button></div> <!></div>');
function zt(g, r) {
  var rt;
  t.push(r, !0);
  const m = ((rt = window.__zveltio) == null ? void 0 : rt.engineUrl) ?? "";
  let a = t.state("playground"), _ = t.state(t.proxy([])), w = t.state(t.proxy([])), h = t.state(t.proxy([])), n = t.state(""), k = t.state(`{
  collections {
    name
    display_name
  }
}`), S = t.state(""), T = t.state(!1);
  async function P(e, s) {
    const i = await fetch(`${m}${e}`, { credentials: "include", ...s }), c = await i.json().catch(() => ({}));
    if (!i.ok) throw new Error(c.error || `HTTP ${i.status}`);
    return c;
  }
  async function F() {
    t.set(T, !0), t.set(n, ""), t.set(S, "");
    try {
      const s = await (await fetch(`${m}/api/graphql`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: t.get(k) })
      })).json();
      t.set(S, JSON.stringify(s, null, 2), !0);
    } catch (e) {
      t.set(n, e.message, !0);
    } finally {
      t.set(T, !1);
    }
  }
  async function L() {
    try {
      const e = await P("/api/graphql/operations?limit=100");
      t.set(_, e.data ?? [], !0);
    } catch (e) {
      t.set(n, e.message, !0);
    }
  }
  async function G() {
    try {
      const e = await P("/api/graphql/persisted");
      t.set(w, e.data ?? [], !0);
    } catch (e) {
      t.set(n, e.message, !0);
    }
  }
  async function I() {
    try {
      const e = await P("/api/graphql/field-policies");
      t.set(h, e.data ?? [], !0);
    } catch (e) {
      t.set(n, e.message, !0);
    }
  }
  t.user_effect(() => {
    t.get(a) === "logs" ? L() : t.get(a) === "persisted" ? G() : t.get(a) === "policies" && I();
  });
  var z = Tt(), O = t.child(z), U = t.child(O), E = t.child(U);
  ut(E, { class: "h-6 w-6" }), t.next(), t.reset(U), t.reset(O);
  var K = t.sibling(O, 2);
  {
    var ot = (e) => {
      var s = ft(), i = t.child(s, !0);
      t.reset(s), t.template_effect(() => t.set_text(i, t.get(n))), t.append(e, s);
    };
    t.if(K, (e) => {
      t.get(n) && e(ot);
    });
  }
  var J = t.sibling(K, 2), R = t.child(J);
  let X;
  var lt = t.child(R);
  st(lt, { class: "h-4 w-4" }), t.next(), t.reset(R);
  var A = t.sibling(R, 2);
  let Y;
  var W = t.sibling(A, 2);
  let Z;
  var it = t.child(W);
  bt(it, { class: "h-4 w-4" }), t.next(), t.reset(W);
  var tt = t.sibling(W, 2);
  let et;
  t.reset(J);
  var dt = t.sibling(J, 2);
  {
    var nt = (e) => {
      var s = mt(), i = t.child(s), c = t.child(i), x = t.sibling(t.child(c)), N = t.child(x);
      st(N, { class: "h-3 w-3" });
      var j = t.sibling(N);
      t.reset(x), t.reset(c);
      var o = t.sibling(c, 2);
      t.remove_textarea_child(o), t.reset(i);
      var d = t.sibling(i, 2), q = t.sibling(t.child(d), 2), p = t.child(q, !0);
      t.reset(q), t.reset(d), t.reset(s), t.template_effect(() => {
        x.disabled = t.get(T), t.set_text(j, ` ${t.get(T) ? "Running…" : "Run"}`), t.set_text(p, t.get(S) || "(run a query to see output)");
      }), t.delegated("click", x, F), t.bind_value(o, () => t.get(k), (l) => t.set(k, l)), t.append(e, s);
    }, ct = (e) => {
      var s = wt(), i = t.child(s), c = t.sibling(t.child(i)), x = t.child(c);
      {
        var N = (o) => {
          var d = xt();
          t.append(o, d);
        }, j = (o) => {
          var d = t.comment(), q = t.first_child(d);
          t.each(q, 17, () => t.get(_), (p) => p.id, (p, l) => {
            var u = yt(), b = t.child(u), $ = t.child(b, !0);
            t.reset(b);
            var f = t.sibling(b), C = t.child(f, !0);
            t.reset(f);
            var y = t.sibling(f), Q = t.child(y, !0);
            t.reset(y);
            var v = t.sibling(y), M = t.child(v);
            t.reset(v);
            var V = t.sibling(v), H = t.child(V);
            let at;
            var pt = t.child(H, !0);
            t.reset(H), t.reset(V), t.reset(u), t.template_effect(
              (D) => {
                t.set_text($, D), t.set_text(C, t.get(l).operation_name ?? t.get(l).query_preview), t.set_text(Q, t.get(l).user_id ?? "anon"), t.set_text(M, `${t.get(l).duration_ms ?? "—" ?? ""} ms`), at = t.set_class(H, 1, "badge badge-sm", null, at, { "badge-error": t.get(l).error }), t.set_text(pt, t.get(l).error ? "error" : "ok");
              },
              [() => {
                var D;
                return (D = t.get(l).created_at) == null ? void 0 : D.slice(0, 19).replace("T", " ");
              }]
            ), t.append(p, u);
          }), t.append(o, d);
        };
        t.if(x, (o) => {
          t.get(_).length === 0 ? o(N) : o(j, -1);
        });
      }
      t.reset(c), t.reset(i), t.reset(s), t.append(e, s);
    }, ht = (e) => {
      var s = qt(), i = t.child(s), c = t.sibling(t.child(i)), x = t.child(c);
      {
        var N = (o) => {
          var d = kt();
          t.append(o, d);
        }, j = (o) => {
          var d = t.comment(), q = t.first_child(d);
          t.each(q, 17, () => t.get(w), (p) => p.id, (p, l) => {
            var u = Nt(), b = t.child(u), $ = t.child(b);
            t.reset(b);
            var f = t.sibling(b), C = t.child(f, !0);
            t.reset(f);
            var y = t.sibling(f), Q = t.child(y, !0);
            t.reset(y), t.reset(u), t.template_effect(
              (v, M) => {
                t.set_text($, `${v ?? ""}…`), t.set_text(C, t.get(l).operation_name ?? t.get(l).query_preview), t.set_text(Q, M);
              },
              [
                () => {
                  var v;
                  return (v = t.get(l).id) == null ? void 0 : v.slice(0, 16);
                },
                () => {
                  var v;
                  return (v = t.get(l).created_at) == null ? void 0 : v.slice(0, 10);
                }
              ]
            ), t.append(p, u);
          }), t.append(o, d);
        };
        t.if(x, (o) => {
          t.get(w).length === 0 ? o(N) : o(j, -1);
        });
      }
      t.reset(c), t.reset(i), t.reset(s), t.append(e, s);
    }, vt = (e) => {
      var s = St(), i = t.child(s), c = t.sibling(t.child(i)), x = t.child(c);
      {
        var N = (o) => {
          var d = Pt();
          t.append(o, d);
        }, j = (o) => {
          var d = t.comment(), q = t.first_child(d);
          t.each(q, 17, () => t.get(h), (p) => p.id, (p, l) => {
            var u = jt(), b = t.child(u), $ = t.child(b, !0);
            t.reset(b);
            var f = t.sibling(b), C = t.child(f, !0);
            t.reset(f);
            var y = t.sibling(f), Q = t.child(y, !0);
            t.reset(y);
            var v = t.sibling(y), M = t.child(v), V = t.child(M, !0);
            t.reset(M), t.reset(v), t.reset(u), t.template_effect(
              (H) => {
                t.set_text($, t.get(l).type_name), t.set_text(C, t.get(l).field_name), t.set_text(Q, H), t.set_text(V, t.get(l).mode ?? "allow");
              },
              [() => (t.get(l).allowed_roles ?? []).join(", ") || "—"]
            ), t.append(p, u);
          }), t.append(o, d);
        };
        t.if(x, (o) => {
          t.get(h).length === 0 ? o(N) : o(j, -1);
        });
      }
      t.reset(c), t.reset(i), t.reset(s), t.append(e, s);
    };
    t.if(dt, (e) => {
      t.get(a) === "playground" ? e(nt) : t.get(a) === "logs" ? e(ct, 1) : t.get(a) === "persisted" ? e(ht, 2) : e(vt, -1);
    });
  }
  t.reset(z), t.template_effect(() => {
    X = t.set_class(R, 1, "tab gap-2", null, X, { "tab-active": t.get(a) === "playground" }), Y = t.set_class(A, 1, "tab", null, Y, { "tab-active": t.get(a) === "logs" }), Z = t.set_class(W, 1, "tab gap-2", null, Z, { "tab-active": t.get(a) === "persisted" }), et = t.set_class(tt, 1, "tab", null, et, { "tab-active": t.get(a) === "policies" });
  }), t.delegated("click", R, () => t.set(a, "playground")), t.delegated("click", A, () => t.set(a, "logs")), t.delegated("click", W, () => t.set(a, "persisted")), t.delegated("click", tt, () => t.set(a, "policies")), t.append(g, z), t.pop();
}
t.delegate(["click"]);
function Mt() {
  const g = window.__zveltio;
  g && g.registerRoute({
    path: "graphql",
    component: zt,
    label: "GraphQL",
    icon: "Network",
    category: "developer"
  });
}
Mt();
export {
  Mt as default
};
