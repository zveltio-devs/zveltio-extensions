import "svelte/internal/disclose-version";
import * as e from "svelte/internal/client";
import { onMount as $e } from "svelte";
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
var Ce = e.from_svg("<svg><!><!></svg>");
function H(h, a) {
  e.push(a, !0);
  const b = e.prop(a, "color", 3, "currentColor"), r = e.prop(a, "size", 3, 24), _ = e.prop(a, "strokeWidth", 3, 2), j = e.prop(a, "absoluteStrokeWidth", 3, !1), l = e.prop(a, "iconNode", 19, () => []), i = e.rest_props(a, [
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
  var $ = Ce();
  e.attribute_effect(
    $,
    (A) => ({
      ...Pe,
      ...i,
      width: r(),
      height: r(),
      stroke: b(),
      "stroke-width": A,
      class: [
        "lucide-icon lucide",
        a.name && `lucide-${a.name}`,
        a.class
      ]
    }),
    [
      () => j() ? Number(_()) * 24 / Number(r()) : _()
    ]
  );
  var E = e.child($);
  e.each(E, 17, l, e.index, (A, B) => {
    var q = e.derived(() => e.to_array(e.get(B), 2));
    let Q = () => e.get(q)[0], Y = () => e.get(q)[1];
    var F = e.comment(), X = e.first_child(F);
    e.element(X, Q, !0, (J, Z) => {
      e.attribute_effect(J, () => ({ ...Y() }));
    }), e.append(A, F);
  });
  var n = e.sibling(E);
  e.snippet(n, () => a.children ?? e.noop), e.reset($), e.append(h, $), e.pop();
}
function Me(h, a) {
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
  let b = e.rest_props(a, ["$$slots", "$$events", "$$legacy"]);
  const r = [
    ["path", { d: "m3 17 2 2 4-4" }],
    ["path", { d: "m3 7 2 2 4-4" }],
    ["path", { d: "M13 6h8" }],
    ["path", { d: "M13 12h8" }],
    ["path", { d: "M13 18h8" }]
  ];
  H(h, e.spread_props({ name: "list-checks" }, () => b, {
    get iconNode() {
      return r;
    },
    children: (_, j) => {
      var l = e.comment(), i = e.first_child(l);
      e.snippet(i, () => a.children ?? e.noop), e.append(_, l);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function ve(h, a) {
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
  let b = e.rest_props(a, ["$$slots", "$$events", "$$legacy"]);
  const r = [
    ["path", { d: "M12 22v-5" }],
    ["path", { d: "M9 8V2" }],
    ["path", { d: "M15 8V2" }],
    ["path", { d: "M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z" }]
  ];
  H(h, e.spread_props({ name: "plug" }, () => b, {
    get iconNode() {
      return r;
    },
    children: (_, j) => {
      var l = e.comment(), i = e.first_child(l);
      e.snippet(i, () => a.children ?? e.noop), e.append(_, l);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function je(h, a) {
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
  let b = e.rest_props(a, ["$$slots", "$$events", "$$legacy"]);
  const r = [["path", { d: "M5 12h14" }], ["path", { d: "M12 5v14" }]];
  H(h, e.spread_props({ name: "plus" }, () => b, {
    get iconNode() {
      return r;
    },
    children: (_, j) => {
      var l = e.comment(), i = e.first_child(l);
      e.snippet(i, () => a.children ?? e.noop), e.append(_, l);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function Se(h, a) {
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
  let b = e.rest_props(a, ["$$slots", "$$events", "$$legacy"]);
  const r = [
    [
      "path",
      {
        d: "M18 16.98h-5.99c-1.1 0-1.95.94-2.48 1.9A4 4 0 0 1 2 17c.01-.7.2-1.4.57-2"
      }
    ],
    [
      "path",
      {
        d: "m6 17 3.13-5.78c.53-.97.1-2.18-.5-3.1a4 4 0 1 1 6.89-4.06"
      }
    ],
    [
      "path",
      {
        d: "m12 6 3.13 5.73C15.66 12.7 16.9 13 18 13a4 4 0 0 1 0 8"
      }
    ]
  ];
  H(h, e.spread_props({ name: "webhook" }, () => b, {
    get iconNode() {
      return r;
    },
    children: (_, j) => {
      var l = e.comment(), i = e.first_child(l);
      e.snippet(i, () => a.children ?? e.noop), e.append(_, l);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function Te(h, a) {
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
  let b = e.rest_props(a, ["$$slots", "$$events", "$$legacy"]);
  const r = [
    ["path", { d: "M18 6 6 18" }],
    ["path", { d: "m6 6 12 12" }]
  ];
  H(h, e.spread_props({ name: "x" }, () => b, {
    get iconNode() {
      return r;
    },
    children: (_, j) => {
      var l = e.comment(), i = e.first_child(l);
      e.snippet(i, () => a.children ?? e.noop), e.append(_, l);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
var Ae = e.from_html('<button class="btn btn-primary btn-sm gap-2"><!> New connection</button>'), We = e.from_html('<div class="alert alert-error"> </div>'), ze = e.from_html('<div class="col-span-full bg-base-100 rounded-lg p-12 text-center text-base-content/60">No external API connections yet.</div>'), Ie = e.from_html('<div class="bg-base-100 rounded-lg shadow p-4"><div class="flex items-start justify-between mb-2"><div class="font-medium"> </div> <span class="badge badge-ghost badge-sm"> </span></div> <div class="text-xs text-base-content/60 font-mono break-all"> </div> <div class="flex justify-end mt-3"><button class="btn btn-ghost btn-xs">Delete</button></div></div>'), Le = e.from_html('<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"><!></div>'), Ee = e.from_html('<tr><td colspan="4" class="text-center py-6 text-base-content/60">No incoming webhook endpoints.</td></tr>'), Oe = e.from_html('<tr><td> </td><td class="font-mono text-xs"><code> </code></td><td> </td><td> </td></tr>'), Ue = e.from_html('<div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Name</th><th>URL</th><th>Created</th><th>Last received</th></tr></thead><tbody><!></tbody></table></div>'), Be = e.from_html('<tr><td colspan="6" class="text-center py-6 text-base-content/60">No call logs.</td></tr>'), De = e.from_html('<tr><td> </td><td> </td><td><span class="badge badge-ghost badge-sm"> </span></td><td class="font-mono text-xs max-w-md truncate"> </td><td><span> </span></td><td> </td></tr>'), Je = e.from_html('<div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Time</th><th>Connection</th><th>Method</th><th>URL</th><th>Status</th><th>Duration</th></tr></thead><tbody><!></tbody></table></div>'), Re = e.from_html('<div><label class="label label-text">Token</label><input type="password" class="input input-bordered w-full font-mono"/></div>'), Ve = e.from_html('<div class="grid grid-cols-2 gap-3"><div><label class="label label-text">Username</label><input class="input input-bordered w-full"/></div> <div><label class="label label-text">Password</label><input type="password" class="input input-bordered w-full"/></div></div>'), He = e.from_html('<div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><div class="bg-base-100 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"><div class="flex items-center justify-between mb-4"><h2 class="text-xl font-semibold">New API connection</h2><button class="btn btn-ghost btn-sm btn-square"><!></button></div> <div class="space-y-3"><div><label class="label label-text">Name</label><input class="input input-bordered w-full"/></div> <div><label class="label label-text">Base URL</label><input class="input input-bordered w-full font-mono" placeholder="https://api.example.com"/></div> <div><label class="label label-text">Auth</label> <select class="select select-bordered w-full"><option>None</option><option>Bearer token</option><option>Basic auth</option><option>OAuth 2.0</option></select></div> <!> <div><label class="label label-text">Extra headers (JSON)</label><textarea class="textarea textarea-bordered w-full font-mono text-xs" rows="4"></textarea></div></div> <div class="flex justify-end gap-2 mt-4"><button class="btn btn-ghost">Cancel</button><button class="btn btn-primary"> </button></div></div></div>'), qe = e.from_html('<div class="p-6 space-y-4"><header class="flex items-center justify-between"><h1 class="text-2xl font-semibold flex items-center gap-2"><!> API Connector</h1> <!></header> <!> <div role="tablist" class="tabs tabs-bordered"><button role="tab"><!> Connections</button> <button role="tab"><!> Incoming webhooks</button> <button role="tab"><!> Call logs</button></div> <!></div> <!>', 1);
function Fe(h, a) {
  var ie;
  e.push(a, !0);
  const b = ((ie = window.__zveltio) == null ? void 0 : ie.engineUrl) ?? "";
  let r = e.state("connections"), _ = e.state(e.proxy([])), j = e.state(e.proxy([])), l = e.state(e.proxy([])), i = e.state(""), $ = e.state(!1), E = e.state(!1), n = e.state(e.proxy({
    name: "",
    base_url: "",
    auth_type: "none",
    auth_token: "",
    auth_username: "",
    auth_password: "",
    headers: "{}"
  }));
  async function A(t, s) {
    const v = await fetch(`${b}${t}`, { credentials: "include", ...s }), g = await v.json().catch(() => ({}));
    if (!v.ok) throw new Error(g.error || `HTTP ${v.status}`);
    return g;
  }
  async function B() {
    try {
      const t = await A("/api/connector/connections");
      e.set(_, t.data ?? [], !0);
    } catch (t) {
      e.set(i, t.message, !0);
    }
  }
  async function q() {
    try {
      const t = await A("/api/connector/incoming-webhooks");
      e.set(j, t.data ?? [], !0);
    } catch (t) {
      e.set(i, t.message, !0);
    }
  }
  async function Q() {
    try {
      const t = await A("/api/connector/logs?limit=100");
      e.set(l, t.data ?? [], !0);
    } catch (t) {
      e.set(i, t.message, !0);
    }
  }
  async function Y() {
    e.set(E, !0), e.set(i, "");
    try {
      let t = {};
      try {
        t = JSON.parse(e.get(n).headers);
      } catch {
        throw new Error("Invalid JSON in headers");
      }
      await A("/api/connector/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...e.get(n), headers: t })
      }), e.set($, !1), e.set(
        n,
        {
          name: "",
          base_url: "",
          auth_type: "none",
          auth_token: "",
          auth_username: "",
          auth_password: "",
          headers: "{}"
        },
        !0
      ), await B();
    } catch (t) {
      e.set(i, t.message, !0);
    } finally {
      e.set(E, !1);
    }
  }
  async function F(t) {
    if (confirm("Delete connection?"))
      try {
        await A(`/api/connector/connections/${t}`, { method: "DELETE" }), await B();
      } catch (s) {
        e.set(i, s.message, !0);
      }
  }
  e.user_effect(() => {
    e.get(r) === "connections" ? B() : e.get(r) === "webhooks" ? q() : Q();
  }), $e(B);
  var X = qe(), J = e.first_child(X), Z = e.child(J), ee = e.child(Z), he = e.child(ee);
  ve(he, { class: "h-6 w-6" }), e.next(), e.reset(ee);
  var _e = e.sibling(ee, 2);
  {
    var pe = (t) => {
      var s = Ae(), v = e.child(s);
      je(v, { class: "h-4 w-4" }), e.next(), e.reset(s), e.delegated("click", s, () => e.set($, !0)), e.append(t, s);
    };
    e.if(_e, (t) => {
      e.get(r) === "connections" && t(pe);
    });
  }
  e.reset(Z);
  var re = e.sibling(Z, 2);
  {
    var ue = (t) => {
      var s = We(), v = e.child(s, !0);
      e.reset(s), e.template_effect(() => e.set_text(v, e.get(i))), e.append(t, s);
    };
    e.if(re, (t) => {
      e.get(i) && t(ue);
    });
  }
  var te = e.sibling(re, 2), R = e.child(te);
  let ne;
  var be = e.child(R);
  ve(be, { class: "h-4 w-4" }), e.next(), e.reset(R);
  var V = e.sibling(R, 2);
  let oe;
  var ge = e.child(V);
  Se(ge, { class: "h-4 w-4" }), e.next(), e.reset(V);
  var G = e.sibling(V, 2);
  let le;
  var me = e.child(G);
  Me(me, { class: "h-4 w-4" }), e.next(), e.reset(G), e.reset(te);
  var fe = e.sibling(te, 2);
  {
    var xe = (t) => {
      var s = Le(), v = e.child(s);
      {
        var g = (y) => {
          var k = ze();
          e.append(y, k);
        }, W = (y) => {
          var k = e.comment(), c = e.first_child(k);
          e.each(c, 17, () => e.get(_), (p) => p.id, (p, N) => {
            var m = Ie(), o = e.child(m), u = e.child(o), x = e.child(u, !0);
            e.reset(u);
            var S = e.sibling(u, 2), w = e.child(S, !0);
            e.reset(S), e.reset(o);
            var P = e.sibling(o, 2), T = e.child(P, !0);
            e.reset(P);
            var C = e.sibling(P, 2), O = e.child(C);
            e.reset(C), e.reset(m), e.template_effect(() => {
              e.set_text(x, e.get(N).name), e.set_text(w, e.get(N).auth_type), e.set_text(T, e.get(N).base_url);
            }), e.delegated("click", O, () => F(e.get(N).id)), e.append(p, m);
          }), e.append(y, k);
        };
        e.if(v, (y) => {
          e.get(_).length === 0 ? y(g) : y(W, -1);
        });
      }
      e.reset(s), e.append(t, s);
    }, we = (t) => {
      var s = Ue(), v = e.child(s), g = e.sibling(e.child(v)), W = e.child(g);
      {
        var y = (c) => {
          var p = Ee();
          e.append(c, p);
        }, k = (c) => {
          var p = e.comment(), N = e.first_child(p);
          e.each(N, 17, () => e.get(j), (m) => m.id, (m, o) => {
            var u = Oe(), x = e.child(u), S = e.child(x, !0);
            e.reset(x);
            var w = e.sibling(x), P = e.child(w), T = e.child(P);
            e.reset(P), e.reset(w);
            var C = e.sibling(w), O = e.child(C, !0);
            e.reset(C);
            var z = e.sibling(C), D = e.child(z, !0);
            e.reset(z), e.reset(u), e.template_effect(
              (f, L) => {
                e.set_text(S, e.get(o).name), e.set_text(T, `${b ?? ""}/api/webhook/${e.get(o).slug ?? ""}`), e.set_text(O, f), e.set_text(D, L);
              },
              [
                () => {
                  var f;
                  return (f = e.get(o).created_at) == null ? void 0 : f.slice(0, 10);
                },
                () => {
                  var f;
                  return ((f = e.get(o).last_received_at) == null ? void 0 : f.slice(0, 16).replace("T", " ")) ?? "never";
                }
              ]
            ), e.append(m, u);
          }), e.append(c, p);
        };
        e.if(W, (c) => {
          e.get(j).length === 0 ? c(y) : c(k, -1);
        });
      }
      e.reset(g), e.reset(v), e.reset(s), e.append(t, s);
    }, ye = (t) => {
      var s = Je(), v = e.child(s), g = e.sibling(e.child(v)), W = e.child(g);
      {
        var y = (c) => {
          var p = Be();
          e.append(c, p);
        }, k = (c) => {
          var p = e.comment(), N = e.first_child(p);
          e.each(N, 17, () => e.get(l), (m) => m.id, (m, o) => {
            var u = De(), x = e.child(u), S = e.child(x, !0);
            e.reset(x);
            var w = e.sibling(x), P = e.child(w, !0);
            e.reset(w);
            var T = e.sibling(w), C = e.child(T), O = e.child(C, !0);
            e.reset(C), e.reset(T);
            var z = e.sibling(T), D = e.child(z, !0);
            e.reset(z);
            var f = e.sibling(z), L = e.child(f);
            let U;
            var ae = e.child(L, !0);
            e.reset(L), e.reset(f);
            var d = e.sibling(f), I = e.child(d);
            e.reset(d), e.reset(u), e.template_effect(
              (M) => {
                e.set_text(S, M), e.set_text(P, e.get(o).connection_name ?? "—"), e.set_text(O, e.get(o).method), e.set_text(D, e.get(o).url), U = e.set_class(L, 1, "badge badge-sm", null, U, {
                  "badge-success": e.get(o).status_code < 400,
                  "badge-error": e.get(o).status_code >= 400
                }), e.set_text(ae, e.get(o).status_code), e.set_text(I, `${e.get(o).duration_ms ?? "—" ?? ""} ms`);
              },
              [() => {
                var M;
                return (M = e.get(o).created_at) == null ? void 0 : M.slice(0, 19).replace("T", " ");
              }]
            ), e.append(m, u);
          }), e.append(c, p);
        };
        e.if(W, (c) => {
          e.get(l).length === 0 ? c(y) : c(k, -1);
        });
      }
      e.reset(g), e.reset(v), e.reset(s), e.append(t, s);
    };
    e.if(fe, (t) => {
      e.get(r) === "connections" ? t(xe) : e.get(r) === "webhooks" ? t(we, 1) : t(ye, -1);
    });
  }
  e.reset(J);
  var ke = e.sibling(J, 2);
  {
    var Ne = (t) => {
      var s = He(), v = e.child(s), g = e.child(v), W = e.sibling(e.child(g)), y = e.child(W);
      Te(y, { class: "h-4 w-4" }), e.reset(W), e.reset(g);
      var k = e.sibling(g, 2), c = e.child(k), p = e.sibling(e.child(c));
      e.remove_input_defaults(p), e.reset(c);
      var N = e.sibling(c, 2), m = e.sibling(e.child(N));
      e.remove_input_defaults(m), e.reset(N);
      var o = e.sibling(N, 2), u = e.sibling(e.child(o), 2), x = e.child(u);
      x.value = x.__value = "none";
      var S = e.sibling(x);
      S.value = S.__value = "bearer";
      var w = e.sibling(S);
      w.value = w.__value = "basic";
      var P = e.sibling(w);
      P.value = P.__value = "oauth2", e.reset(u), e.reset(o);
      var T = e.sibling(o, 2);
      {
        var C = (d) => {
          var I = Re(), M = e.sibling(e.child(I));
          e.remove_input_defaults(M), e.reset(I), e.bind_value(M, () => e.get(n).auth_token, (K) => e.get(n).auth_token = K), e.append(d, I);
        }, O = (d) => {
          var I = Ve(), M = e.child(I), K = e.sibling(e.child(M));
          e.remove_input_defaults(K), e.reset(M);
          var de = e.sibling(M, 2), ce = e.sibling(e.child(de));
          e.remove_input_defaults(ce), e.reset(de), e.reset(I), e.bind_value(K, () => e.get(n).auth_username, (se) => e.get(n).auth_username = se), e.bind_value(ce, () => e.get(n).auth_password, (se) => e.get(n).auth_password = se), e.append(d, I);
        };
        e.if(T, (d) => {
          e.get(n).auth_type === "bearer" ? d(C) : e.get(n).auth_type === "basic" && d(O, 1);
        });
      }
      var z = e.sibling(T, 2), D = e.sibling(e.child(z));
      e.remove_textarea_child(D), e.reset(z), e.reset(k);
      var f = e.sibling(k, 2), L = e.child(f), U = e.sibling(L), ae = e.child(U, !0);
      e.reset(U), e.reset(f), e.reset(v), e.reset(s), e.template_effect(() => {
        U.disabled = e.get(E) || !e.get(n).name || !e.get(n).base_url, e.set_text(ae, e.get(E) ? "Saving…" : "Create");
      }), e.delegated("click", s, (d) => d.target === d.currentTarget && e.set($, !1)), e.delegated("click", W, () => e.set($, !1)), e.bind_value(p, () => e.get(n).name, (d) => e.get(n).name = d), e.bind_value(m, () => e.get(n).base_url, (d) => e.get(n).base_url = d), e.bind_select_value(u, () => e.get(n).auth_type, (d) => e.get(n).auth_type = d), e.bind_value(D, () => e.get(n).headers, (d) => e.get(n).headers = d), e.delegated("click", L, () => e.set($, !1)), e.delegated("click", U, Y), e.append(t, s);
    };
    e.if(ke, (t) => {
      e.get($) && t(Ne);
    });
  }
  e.template_effect(() => {
    ne = e.set_class(R, 1, "tab gap-2", null, ne, { "tab-active": e.get(r) === "connections" }), oe = e.set_class(V, 1, "tab gap-2", null, oe, { "tab-active": e.get(r) === "webhooks" }), le = e.set_class(G, 1, "tab gap-2", null, le, { "tab-active": e.get(r) === "logs" });
  }), e.delegated("click", R, () => e.set(r, "connections")), e.delegated("click", V, () => e.set(r, "webhooks")), e.delegated("click", G, () => e.set(r, "logs")), e.append(h, X), e.pop();
}
e.delegate(["click"]);
function Xe() {
  const h = window.__zveltio;
  h && h.registerRoute({
    path: "api-connector",
    component: Fe,
    label: "API Connector",
    icon: "Plug",
    category: "integrations"
  });
}
Xe();
export {
  Xe as default
};
