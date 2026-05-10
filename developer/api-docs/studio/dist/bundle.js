import "svelte/internal/disclose-version";
import * as e from "svelte/internal/client";
import { onMount as me } from "svelte";
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
const xe = {
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
var ye = e.from_svg("<svg><!><!></svg>");
function E(v, s) {
  e.push(s, !0);
  const _ = e.prop(s, "color", 3, "currentColor"), r = e.prop(s, "size", 3, 24), p = e.prop(s, "strokeWidth", 3, 2), $ = e.prop(s, "absoluteStrokeWidth", 3, !1), d = e.prop(s, "iconNode", 19, () => []), i = e.rest_props(s, [
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
  var N = ye();
  e.attribute_effect(
    N,
    (P) => ({
      ...xe,
      ...i,
      width: r(),
      height: r(),
      stroke: _(),
      "stroke-width": P,
      class: [
        "lucide-icon lucide",
        s.name && `lucide-${s.name}`,
        s.class
      ]
    }),
    [
      () => $() ? Number(p()) * 24 / Number(r()) : p()
    ]
  );
  var S = e.child(N);
  e.each(S, 17, d, e.index, (P, I) => {
    var A = e.derived(() => e.to_array(e.get(I), 2));
    let O = () => e.get(A)[0], V = () => e.get(A)[1];
    var F = e.comment(), G = e.first_child(F);
    e.element(G, O, !0, (L, R) => {
      e.attribute_effect(L, () => ({ ...V() }));
    }), e.append(P, F);
  });
  var b = e.sibling(S);
  e.snippet(b, () => s.children ?? e.noop), e.reset(N), e.append(v, N), e.pop();
}
function ke(v, s) {
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
  let _ = e.rest_props(s, ["$$slots", "$$events", "$$legacy"]);
  const r = [
    ["path", { d: "M12 7v14" }],
    [
      "path",
      {
        d: "M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"
      }
    ]
  ];
  E(v, e.spread_props({ name: "book-open" }, () => _, {
    get iconNode() {
      return r;
    },
    children: (p, $) => {
      var d = e.comment(), i = e.first_child(d);
      e.snippet(i, () => s.children ?? e.noop), e.append(p, d);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function we(v, s) {
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
  let _ = e.rest_props(s, ["$$slots", "$$events", "$$legacy"]);
  const r = [
    ["path", { d: "M10 12.5 8 15l2 2.5" }],
    ["path", { d: "m14 12.5 2 2.5-2 2.5" }],
    ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }],
    [
      "path",
      {
        d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"
      }
    ]
  ];
  E(v, e.spread_props({ name: "file-code" }, () => _, {
    get iconNode() {
      return r;
    },
    children: (p, $) => {
      var d = e.comment(), i = e.first_child(d);
      e.snippet(i, () => s.children ?? e.noop), e.append(p, d);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function Ne(v, s) {
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
  let _ = e.rest_props(s, ["$$slots", "$$events", "$$legacy"]);
  const r = [
    [
      "path",
      {
        d: "m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4"
      }
    ],
    ["path", { d: "m21 2-9.6 9.6" }],
    ["circle", { cx: "7.5", cy: "15.5", r: "5.5" }]
  ];
  E(v, e.spread_props({ name: "key" }, () => _, {
    get iconNode() {
      return r;
    },
    children: (p, $) => {
      var d = e.comment(), i = e.first_child(d);
      e.snippet(i, () => s.children ?? e.noop), e.append(p, d);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function se(v, s) {
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
  let _ = e.rest_props(s, ["$$slots", "$$events", "$$legacy"]);
  const r = [["path", { d: "M5 12h14" }], ["path", { d: "M12 5v14" }]];
  E(v, e.spread_props({ name: "plus" }, () => _, {
    get iconNode() {
      return r;
    },
    children: (p, $) => {
      var d = e.comment(), i = e.first_child(d);
      e.snippet(i, () => s.children ?? e.noop), e.append(p, d);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function $e(v, s) {
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
  let _ = e.rest_props(s, ["$$slots", "$$events", "$$legacy"]);
  const r = [
    ["path", { d: "M18 6 6 18" }],
    ["path", { d: "m6 6 12 12" }]
  ];
  E(v, e.spread_props({ name: "x" }, () => _, {
    get iconNode() {
      return r;
    },
    children: (p, $) => {
      var d = e.comment(), i = e.first_child(d);
      e.snippet(i, () => s.children ?? e.noop), e.append(p, d);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
var Pe = e.from_html('<button class="btn btn-primary btn-sm gap-2"><!> New page</button>'), Te = e.from_html('<button class="btn btn-primary btn-sm gap-2"><!> Generate token</button>'), Ce = e.from_html('<div class="alert alert-error"> </div>'), Me = e.from_html('<div class="bg-base-100 rounded-lg p-12 text-center text-base-content/60">No changelog entries.</div>'), je = e.from_html('<div class="bg-base-100 rounded-lg shadow p-4"><div class="flex items-baseline justify-between mb-2"><h3 class="font-semibold"> </h3> <span class="text-xs text-base-content/60"> </span></div> <div class="text-sm whitespace-pre-line"> </div></div>'), ze = e.from_html('<div class="space-y-3"><a class="link link-primary text-sm" target="_blank">View OpenAPI spec →</a> <!></div>'), Se = e.from_html('<tr><td colspan="4" class="text-center py-6 text-base-content/60">No custom doc pages.</td></tr>'), We = e.from_html('<tr><td class="font-mono text-xs"> </td><td> </td><td> </td><td> </td></tr>'), Ae = e.from_html('<div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Slug</th><th>Title</th><th>Public</th><th>Updated</th></tr></thead><tbody><!></tbody></table></div>'), Oe = e.from_html('<tr><td colspan="4" class="text-center py-6 text-base-content/60">No tokens. Generate one for read-only doc access.</td></tr>'), Be = e.from_html('<tr><td class="font-mono text-xs"> </td><td> </td><td> </td><td><button class="btn btn-ghost btn-xs">Revoke</button></td></tr>'), De = e.from_html('<div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Token</th><th>Created</th><th>Last used</th><th></th></tr></thead><tbody><!></tbody></table></div>'), Ee = e.from_html('<div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><div class="bg-base-100 rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto"><div class="flex items-center justify-between mb-4"><h2 class="text-xl font-semibold">New doc page</h2><button class="btn btn-ghost btn-sm btn-square"><!></button></div> <div class="space-y-3"><div class="grid grid-cols-2 gap-3"><div><label class="label label-text">Slug</label><input class="input input-bordered w-full font-mono" placeholder="getting-started"/></div> <div class="flex items-end"><label class="label cursor-pointer gap-2"><input type="checkbox" class="checkbox checkbox-sm"/><span class="label-text">Public</span></label></div></div> <div><label class="label label-text">Title</label><input class="input input-bordered w-full"/></div> <div><label class="label label-text">Body (Markdown)</label><textarea class="textarea textarea-bordered w-full font-mono text-xs" rows="14"></textarea></div></div> <div class="flex justify-end gap-2 mt-4"><button class="btn btn-ghost">Cancel</button><button class="btn btn-primary"> </button></div></div></div>'), Ie = e.from_html('<div class="p-6 space-y-4"><header class="flex items-center justify-between"><h1 class="text-2xl font-semibold flex items-center gap-2"><!> API Docs</h1> <div class="flex gap-2"><!> <!></div></header> <!> <div role="tablist" class="tabs tabs-bordered"><button role="tab">Changelog</button> <button role="tab"><!> Custom pages</button> <button role="tab"><!> Access tokens</button></div> <!></div> <!>', 1);
function Fe(v, s) {
  var ae;
  e.push(s, !0);
  const _ = ((ae = window.__zveltio) == null ? void 0 : ae.engineUrl) ?? "";
  let r = e.state("changelog"), p = e.state(e.proxy([])), $ = e.state(e.proxy([])), d = e.state(e.proxy([])), i = e.state(""), N = e.state(!1), S = e.state(!1), b = e.state(e.proxy({
    slug: "",
    title: "",
    body: `# New documentation page

Write content in Markdown.`,
    is_public: !1
  }));
  async function P(t, a) {
    const n = await fetch(`${_}${t}`, { credentials: "include", ...a }), f = await n.json().catch(() => ({}));
    if (!n.ok) throw new Error(f.error || `HTTP ${n.status}`);
    return f;
  }
  async function I() {
    try {
      const t = await P("/api/api-docs/changelogs");
      e.set(p, t.data ?? [], !0);
    } catch (t) {
      e.set(i, t.message, !0);
    }
  }
  async function A() {
    try {
      const t = await P("/api/api-docs/custom");
      e.set($, t.data ?? [], !0);
    } catch (t) {
      e.set(i, t.message, !0);
    }
  }
  async function O() {
    try {
      const t = await P("/api/api-docs/access-tokens");
      e.set(d, t.data ?? [], !0);
    } catch (t) {
      e.set(i, t.message, !0);
    }
  }
  async function V() {
    e.set(S, !0), e.set(i, "");
    try {
      await P("/api/api-docs/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(e.get(b))
      }), e.set(N, !1), e.set(
        b,
        {
          slug: "",
          title: "",
          body: `# New documentation page

Write content in Markdown.`,
          is_public: !1
        },
        !0
      ), await A();
    } catch (t) {
      e.set(i, t.message, !0);
    } finally {
      e.set(S, !1);
    }
  }
  async function F() {
    try {
      await P("/api/api-docs/access-tokens", { method: "POST" }), await O();
    } catch (t) {
      e.set(i, t.message, !0);
    }
  }
  async function G(t) {
    if (confirm("Revoke token?"))
      try {
        await P(`/api/api-docs/access-tokens/${t}`, { method: "DELETE" }), await O();
      } catch (a) {
        e.set(i, a.message, !0);
      }
  }
  e.user_effect(() => {
    e.get(r) === "changelog" ? I() : e.get(r) === "custom" ? A() : O();
  }), me(I);
  var L = Ie(), R = e.first_child(L), H = e.child(R), q = e.child(H), re = e.child(q);
  ke(re, { class: "h-6 w-6" }), e.next(), e.reset(q);
  var X = e.sibling(q, 2), Q = e.child(X);
  {
    var le = (t) => {
      var a = Pe(), n = e.child(a);
      se(n, { class: "h-4 w-4" }), e.next(), e.reset(a), e.delegated("click", a, () => e.set(N, !0)), e.append(t, a);
    };
    e.if(Q, (t) => {
      e.get(r) === "custom" && t(le);
    });
  }
  var oe = e.sibling(Q, 2);
  {
    var ie = (t) => {
      var a = Te(), n = e.child(a);
      se(n, { class: "h-4 w-4" }), e.next(), e.reset(a), e.delegated("click", a, F), e.append(t, a);
    };
    e.if(oe, (t) => {
      e.get(r) === "tokens" && t(ie);
    });
  }
  e.reset(X), e.reset(H);
  var Y = e.sibling(H, 2);
  {
    var ne = (t) => {
      var a = Ce(), n = e.child(a, !0);
      e.reset(a), e.template_effect(() => e.set_text(n, e.get(i))), e.append(t, a);
    };
    e.if(Y, (t) => {
      e.get(i) && t(ne);
    });
  }
  var J = e.sibling(Y, 2), K = e.child(J);
  let Z;
  var B = e.sibling(K, 2);
  let ee;
  var de = e.child(B);
  we(de, { class: "h-4 w-4" }), e.next(), e.reset(B);
  var U = e.sibling(B, 2);
  let te;
  var ce = e.child(U);
  Ne(ce, { class: "h-4 w-4" }), e.next(), e.reset(U), e.reset(J);
  var ve = e.sibling(J, 2);
  {
    var pe = (t) => {
      var a = ze(), n = e.child(a), f = e.sibling(n, 2);
      {
        var C = (m) => {
          var o = Me();
          e.append(m, o);
        }, W = (m) => {
          var o = e.comment(), h = e.first_child(o);
          e.each(h, 17, () => e.get(p), (T) => T.id, (T, x) => {
            var c = je(), y = e.child(c), g = e.child(y), M = e.child(g);
            e.reset(g);
            var k = e.sibling(g, 2), j = e.child(k, !0);
            e.reset(k), e.reset(y);
            var w = e.sibling(y, 2), z = e.child(w, !0);
            e.reset(w), e.reset(c), e.template_effect(
              (u) => {
                e.set_text(M, `v${e.get(x).version ?? ""}`), e.set_text(j, u), e.set_text(z, e.get(x).notes);
              },
              [() => {
                var u;
                return (u = e.get(x).released_at) == null ? void 0 : u.slice(0, 10);
              }]
            ), e.append(T, c);
          }), e.append(m, o);
        };
        e.if(f, (m) => {
          e.get(p).length === 0 ? m(C) : m(W, -1);
        });
      }
      e.reset(a), e.template_effect(() => e.set_attribute(n, "href", `${_ ?? ""}/api/openapi.json`)), e.append(t, a);
    }, he = (t) => {
      var a = Ae(), n = e.child(a), f = e.sibling(e.child(n)), C = e.child(f);
      {
        var W = (o) => {
          var h = Se();
          e.append(o, h);
        }, m = (o) => {
          var h = e.comment(), T = e.first_child(h);
          e.each(T, 17, () => e.get($), (x) => x.id, (x, c) => {
            var y = We(), g = e.child(y), M = e.child(g, !0);
            e.reset(g);
            var k = e.sibling(g), j = e.child(k, !0);
            e.reset(k);
            var w = e.sibling(k), z = e.child(w, !0);
            e.reset(w);
            var u = e.sibling(w), D = e.child(u, !0);
            e.reset(u), e.reset(y), e.template_effect(
              (l) => {
                e.set_text(M, e.get(c).slug), e.set_text(j, e.get(c).title), e.set_text(z, e.get(c).is_public ? "✓" : "—"), e.set_text(D, l);
              },
              [() => {
                var l;
                return (l = e.get(c).updated_at) == null ? void 0 : l.slice(0, 10);
              }]
            ), e.append(x, y);
          }), e.append(o, h);
        };
        e.if(C, (o) => {
          e.get($).length === 0 ? o(W) : o(m, -1);
        });
      }
      e.reset(f), e.reset(n), e.reset(a), e.append(t, a);
    }, ge = (t) => {
      var a = De(), n = e.child(a), f = e.sibling(e.child(n)), C = e.child(f);
      {
        var W = (o) => {
          var h = Oe();
          e.append(o, h);
        }, m = (o) => {
          var h = e.comment(), T = e.first_child(h);
          e.each(T, 17, () => e.get(d), (x) => x.id, (x, c) => {
            var y = Be(), g = e.child(y), M = e.child(g, !0);
            e.reset(g);
            var k = e.sibling(g), j = e.child(k, !0);
            e.reset(k);
            var w = e.sibling(k), z = e.child(w, !0);
            e.reset(w);
            var u = e.sibling(w), D = e.child(u);
            e.reset(u), e.reset(y), e.template_effect(
              (l, be, fe) => {
                e.set_text(M, l), e.set_text(j, be), e.set_text(z, fe);
              },
              [
                () => {
                  var l;
                  return e.get(c).token_preview ?? `${(l = e.get(c).token) == null ? void 0 : l.slice(0, 12)}…`;
                },
                () => {
                  var l;
                  return (l = e.get(c).created_at) == null ? void 0 : l.slice(0, 16).replace("T", " ");
                },
                () => {
                  var l;
                  return ((l = e.get(c).last_used_at) == null ? void 0 : l.slice(0, 16).replace("T", " ")) ?? "never";
                }
              ]
            ), e.delegated("click", D, () => G(e.get(c).id)), e.append(x, y);
          }), e.append(o, h);
        };
        e.if(C, (o) => {
          e.get(d).length === 0 ? o(W) : o(m, -1);
        });
      }
      e.reset(f), e.reset(n), e.reset(a), e.append(t, a);
    };
    e.if(ve, (t) => {
      e.get(r) === "changelog" ? t(pe) : e.get(r) === "custom" ? t(he, 1) : t(ge, -1);
    });
  }
  e.reset(R);
  var ue = e.sibling(R, 2);
  {
    var _e = (t) => {
      var a = Ee(), n = e.child(a), f = e.child(n), C = e.sibling(e.child(f)), W = e.child(C);
      $e(W, { class: "h-4 w-4" }), e.reset(C), e.reset(f);
      var m = e.sibling(f, 2), o = e.child(m), h = e.child(o), T = e.sibling(e.child(h));
      e.remove_input_defaults(T), e.reset(h);
      var x = e.sibling(h, 2), c = e.child(x), y = e.child(c);
      e.remove_input_defaults(y), e.next(), e.reset(c), e.reset(x), e.reset(o);
      var g = e.sibling(o, 2), M = e.sibling(e.child(g));
      e.remove_input_defaults(M), e.reset(g);
      var k = e.sibling(g, 2), j = e.sibling(e.child(k));
      e.remove_textarea_child(j), e.reset(k), e.reset(m);
      var w = e.sibling(m, 2), z = e.child(w), u = e.sibling(z), D = e.child(u, !0);
      e.reset(u), e.reset(w), e.reset(n), e.reset(a), e.template_effect(() => {
        u.disabled = e.get(S) || !e.get(b).slug || !e.get(b).title, e.set_text(D, e.get(S) ? "Saving…" : "Create");
      }), e.delegated("click", a, (l) => l.target === l.currentTarget && e.set(N, !1)), e.delegated("click", C, () => e.set(N, !1)), e.bind_value(T, () => e.get(b).slug, (l) => e.get(b).slug = l), e.bind_checked(y, () => e.get(b).is_public, (l) => e.get(b).is_public = l), e.bind_value(M, () => e.get(b).title, (l) => e.get(b).title = l), e.bind_value(j, () => e.get(b).body, (l) => e.get(b).body = l), e.delegated("click", z, () => e.set(N, !1)), e.delegated("click", u, V), e.append(t, a);
    };
    e.if(ue, (t) => {
      e.get(N) && t(_e);
    });
  }
  e.template_effect(() => {
    Z = e.set_class(K, 1, "tab", null, Z, { "tab-active": e.get(r) === "changelog" }), ee = e.set_class(B, 1, "tab gap-2", null, ee, { "tab-active": e.get(r) === "custom" }), te = e.set_class(U, 1, "tab gap-2", null, te, { "tab-active": e.get(r) === "tokens" });
  }), e.delegated("click", K, () => e.set(r, "changelog")), e.delegated("click", B, () => e.set(r, "custom")), e.delegated("click", U, () => e.set(r, "tokens")), e.append(v, L), e.pop();
}
e.delegate(["click"]);
function Le() {
  const v = window.__zveltio;
  v && v.registerRoute({
    path: "api-docs",
    component: Fe,
    label: "API Docs",
    icon: "BookOpen",
    category: "developer"
  });
}
Le();
export {
  Le as default
};
