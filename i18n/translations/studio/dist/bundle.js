import "svelte/internal/disclose-version";
import * as t from "svelte/internal/client";
import { onMount as mt } from "svelte";
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
const ft = {
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
var yt = t.from_svg("<svg><!><!></svg>");
function U(v, a) {
  t.push(a, !0);
  const b = t.prop(a, "color", 3, "currentColor"), l = t.prop(a, "size", 3, 24), p = t.prop(a, "strokeWidth", 3, 2), x = t.prop(a, "absoluteStrokeWidth", 3, !1), i = t.prop(a, "iconNode", 19, () => []), h = t.rest_props(a, [
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
  var $ = yt();
  t.attribute_effect(
    $,
    (M) => ({
      ...ft,
      ...h,
      width: l(),
      height: l(),
      stroke: b(),
      "stroke-width": M,
      class: [
        "lucide-icon lucide",
        a.name && `lucide-${a.name}`,
        a.class
      ]
    }),
    [
      () => x() ? Number(p()) * 24 / Number(l()) : p()
    ]
  );
  var w = t.child($);
  t.each(w, 17, i, t.index, (M, T) => {
    var C = t.derived(() => t.to_array(t.get(T), 2));
    let W = () => t.get(C)[0], A = () => t.get(C)[1];
    var E = t.comment(), J = t.first_child(E);
    t.element(J, W, !0, (R, B) => {
      t.attribute_effect(R, () => ({ ...A() }));
    }), t.append(M, E);
  });
  var L = t.sibling(w);
  t.snippet(L, () => a.children ?? t.noop), t.reset($), t.append(v, $), t.pop();
}
function xt(v, a) {
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
  let b = t.rest_props(a, ["$$slots", "$$events", "$$legacy"]);
  const l = [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    [
      "path",
      { d: "M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" }
    ],
    ["path", { d: "M2 12h20" }]
  ];
  U(v, t.spread_props({ name: "globe" }, () => b, {
    get iconNode() {
      return l;
    },
    children: (p, x) => {
      var i = t.comment(), h = t.first_child(i);
      t.snippet(h, () => a.children ?? t.noop), t.append(p, i);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function wt(v, a) {
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
  let b = t.rest_props(a, ["$$slots", "$$events", "$$legacy"]);
  const l = [
    [
      "path",
      {
        d: "m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4"
      }
    ],
    ["path", { d: "m21 2-9.6 9.6" }],
    ["circle", { cx: "7.5", cy: "15.5", r: "5.5" }]
  ];
  U(v, t.spread_props({ name: "key" }, () => b, {
    get iconNode() {
      return l;
    },
    children: (p, x) => {
      var i = t.comment(), h = t.first_child(i);
      t.snippet(h, () => a.children ?? t.noop), t.append(p, i);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function kt(v, a) {
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
  let b = t.rest_props(a, ["$$slots", "$$events", "$$legacy"]);
  const l = [
    ["path", { d: "m5 8 6 6" }],
    ["path", { d: "m4 14 6-6 2-3" }],
    ["path", { d: "M2 5h12" }],
    ["path", { d: "M7 2h1" }],
    ["path", { d: "m22 22-5-10-5 10" }],
    ["path", { d: "M14 18h6" }]
  ];
  U(v, t.spread_props({ name: "languages" }, () => b, {
    get iconNode() {
      return l;
    },
    children: (p, x) => {
      var i = t.comment(), h = t.first_child(i);
      t.snippet(h, () => a.children ?? t.noop), t.append(p, i);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function Nt(v, a) {
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
  let b = t.rest_props(a, ["$$slots", "$$events", "$$legacy"]);
  const l = [["path", { d: "M5 12h14" }], ["path", { d: "M12 5v14" }]];
  U(v, t.spread_props({ name: "plus" }, () => b, {
    get iconNode() {
      return l;
    },
    children: (p, x) => {
      var i = t.comment(), h = t.first_child(i);
      t.snippet(h, () => a.children ?? t.noop), t.append(p, i);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function $t(v, a) {
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
  let b = t.rest_props(a, ["$$slots", "$$events", "$$legacy"]);
  const l = [
    ["path", { d: "M18 6 6 18" }],
    ["path", { d: "m6 6 12 12" }]
  ];
  U(v, t.spread_props({ name: "x" }, () => b, {
    get iconNode() {
      return l;
    },
    children: (p, x) => {
      var i = t.comment(), h = t.first_child(i);
      t.snippet(h, () => a.children ?? t.noop), t.append(p, i);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
var Tt = t.from_html('<button class="btn btn-primary btn-sm gap-2"><!> Add locale</button>'), jt = t.from_html('<div class="alert alert-error"> </div>'), Pt = t.from_html("<option> </option>"), St = t.from_html('<tr><td colspan="3" class="text-center py-6 text-base-content/60">No keys.</td></tr>'), Lt = t.from_html('<tr><td class="font-mono text-xs"> </td><td><input class="input input-xs input-bordered w-full"/></td><td class="text-xs text-base-content/60"> </td></tr>'), Mt = t.from_html('<div class="flex gap-3"><select class="select select-sm select-bordered"></select> <div class="join"><input class="input input-sm input-bordered join-item" placeholder="Search keys..."/> <button class="btn btn-sm join-item">Search</button></div></div> <div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Key</th><th>Value</th><th>Notes</th></tr></thead><tbody><!></tbody></table></div>', 1), Ct = t.from_html('<tr><td colspan="3" class="text-center py-6 text-base-content/60">No locales.</td></tr>'), zt = t.from_html('<tr><td class="font-mono"> </td><td> </td><td> </td></tr>'), Wt = t.from_html('<div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Code</th><th>Name</th><th>Active</th></tr></thead><tbody><!></tbody></table></div>'), At = t.from_html('<tr><td colspan="4" class="text-center py-6 text-base-content/60">Glossary empty.</td></tr>'), Gt = t.from_html('<tr><td> </td><td> </td><td><span class="badge badge-sm"> </span></td><td> </td></tr>'), Ot = t.from_html('<div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Term</th><th>Translation</th><th>Locale</th><th>Context</th></tr></thead><tbody><!></tbody></table></div>'), qt = t.from_html('<div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><div class="bg-base-100 rounded-xl p-6 w-full max-w-sm"><div class="flex items-center justify-between mb-4"><h2 class="text-xl font-semibold">New locale</h2><button class="btn btn-ghost btn-sm btn-square"><!></button></div> <div class="space-y-3"><div><label class="label label-text">Code (e.g. ro, en, de)</label><input class="input input-bordered w-full font-mono" maxlength="5"/></div> <div><label class="label label-text">Name</label><input class="input input-bordered w-full"/></div></div> <div class="flex justify-end gap-2 mt-4"><button class="btn btn-ghost">Cancel</button><button class="btn btn-primary"> </button></div></div></div>'), Kt = t.from_html('<div class="p-6 space-y-4"><header class="flex items-center justify-between"><h1 class="text-2xl font-semibold flex items-center gap-2"><!> Translations</h1> <!></header> <!> <div role="tablist" class="tabs tabs-bordered"><button role="tab"><!> Keys</button> <button role="tab"><!> Locales</button> <button role="tab">Glossary</button></div> <!></div> <!>', 1);
function Ut(v, a) {
  var at;
  t.push(a, !0);
  const b = ((at = window.__zveltio) == null ? void 0 : at.engineUrl) ?? "";
  let l = t.state("translations"), p = t.state(t.proxy([])), x = t.state(t.proxy([])), i = t.state(t.proxy([])), h = t.state("en"), $ = t.state(""), w = t.state(""), L = t.state(!1), M = t.state(!1), T = t.state(t.proxy({ code: "", name: "", is_active: !0 }));
  async function C(e, s) {
    const o = await fetch(`${b}${e}`, { credentials: "include", ...s }), c = await o.json().catch(() => ({}));
    if (!o.ok) throw new Error(c.error || `HTTP ${o.status}`);
    return c;
  }
  async function W() {
    try {
      const e = new URLSearchParams({ locale: t.get(h) });
      t.get($) && e.set("q", t.get($));
      const s = await C(`/api/translations/keys?${e}`);
      t.set(p, s.data ?? [], !0);
    } catch (e) {
      t.set(w, e.message, !0);
    }
  }
  async function A() {
    try {
      const e = await C("/api/translations/locales");
      t.set(x, e.data ?? [], !0);
    } catch (e) {
      t.set(w, e.message, !0);
    }
  }
  async function E() {
    try {
      const e = await C("/api/translations/glossary");
      t.set(i, e.data ?? [], !0);
    } catch (e) {
      t.set(w, e.message, !0);
    }
  }
  async function J(e, s) {
    try {
      await C("/api/translations/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: e, locale: t.get(h), value: s })
      });
    } catch (o) {
      t.set(w, o.message, !0);
    }
  }
  async function R() {
    t.set(M, !0), t.set(w, "");
    try {
      await C("/api/translations/locales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(t.get(T))
      }), t.set(L, !1), t.set(T, { code: "", name: "", is_active: !0 }, !0), await A();
    } catch (e) {
      t.set(w, e.message, !0);
    } finally {
      t.set(M, !1);
    }
  }
  t.user_effect(() => {
    t.get(l) === "translations" ? W() : t.get(l) === "locales" ? A() : E();
  }), mt(() => {
    W(), A();
  });
  var B = Kt(), H = t.first_child(B), I = t.child(H), V = t.child(I), rt = t.child(V);
  kt(rt, { class: "h-6 w-6" }), t.next(), t.reset(V);
  var lt = t.sibling(V, 2);
  {
    var ot = (e) => {
      var s = Tt(), o = t.child(s);
      Nt(o, { class: "h-4 w-4" }), t.next(), t.reset(s), t.delegated("click", s, () => t.set(L, !0)), t.append(e, s);
    };
    t.if(lt, (e) => {
      t.get(l) === "locales" && e(ot);
    });
  }
  t.reset(I);
  var Q = t.sibling(I, 2);
  {
    var nt = (e) => {
      var s = jt(), o = t.child(s, !0);
      t.reset(s), t.template_effect(() => t.set_text(o, t.get(w))), t.append(e, s);
    };
    t.if(Q, (e) => {
      t.get(w) && e(nt);
    });
  }
  var X = t.sibling(Q, 2), G = t.child(X);
  let Y;
  var it = t.child(G);
  wt(it, { class: "h-4 w-4" }), t.next(), t.reset(G);
  var O = t.sibling(G, 2);
  let Z;
  var dt = t.child(O);
  xt(dt, { class: "h-4 w-4" }), t.next(), t.reset(O);
  var tt = t.sibling(O, 2);
  let et;
  t.reset(X);
  var ct = t.sibling(X, 2);
  {
    var vt = (e) => {
      var s = Mt(), o = t.first_child(s), c = t.child(o);
      t.each(c, 21, () => t.get(x), (r) => r.code, (r, u) => {
        var n = Pt(), S = t.child(n);
        t.reset(n);
        var g = {};
        t.template_effect(() => {
          t.set_text(S, `${t.get(u).name ?? ""} (${t.get(u).code ?? ""})`), g !== (g = t.get(u).code) && (n.value = (n.__value = t.get(u).code) ?? "");
        }), t.append(r, n);
      }), t.reset(c);
      var k = t.sibling(c, 2), N = t.child(k);
      t.remove_input_defaults(N);
      var j = t.sibling(N, 2);
      t.reset(k), t.reset(o);
      var d = t.sibling(o, 2), _ = t.child(d), P = t.sibling(t.child(_)), f = t.child(P);
      {
        var m = (r) => {
          var u = St();
          t.append(r, u);
        }, y = (r) => {
          var u = t.comment(), n = t.first_child(u);
          t.each(n, 17, () => t.get(p), (S) => S.key, (S, g) => {
            var z = Lt(), q = t.child(z), F = t.child(q, !0);
            t.reset(q);
            var K = t.sibling(q), D = t.child(K);
            t.remove_input_defaults(D), t.reset(K);
            var st = t.sibling(K), gt = t.child(st, !0);
            t.reset(st), t.reset(z), t.template_effect(() => {
              t.set_text(F, t.get(g).key), t.set_value(D, t.get(g).value ?? ""), t.set_text(gt, t.get(g).context ?? "");
            }), t.event("blur", D, (bt) => J(t.get(g).key, bt.target.value)), t.append(S, z);
          }), t.append(r, u);
        };
        t.if(f, (r) => {
          t.get(p).length === 0 ? r(m) : r(y, -1);
        });
      }
      t.reset(P), t.reset(_), t.reset(d), t.delegated("change", c, W), t.bind_select_value(c, () => t.get(h), (r) => t.set(h, r)), t.delegated("keydown", N, (r) => r.key === "Enter" && W()), t.bind_value(N, () => t.get($), (r) => t.set($, r)), t.delegated("click", j, W), t.append(e, s);
    }, pt = (e) => {
      var s = Wt(), o = t.child(s), c = t.sibling(t.child(o)), k = t.child(c);
      {
        var N = (d) => {
          var _ = Ct();
          t.append(d, _);
        }, j = (d) => {
          var _ = t.comment(), P = t.first_child(_);
          t.each(P, 17, () => t.get(x), (f) => f.code, (f, m) => {
            var y = zt(), r = t.child(y), u = t.child(r, !0);
            t.reset(r);
            var n = t.sibling(r), S = t.child(n, !0);
            t.reset(n);
            var g = t.sibling(n), z = t.child(g, !0);
            t.reset(g), t.reset(y), t.template_effect(() => {
              t.set_text(u, t.get(m).code), t.set_text(S, t.get(m).name), t.set_text(z, t.get(m).is_active ? "✓" : "—");
            }), t.append(f, y);
          }), t.append(d, _);
        };
        t.if(k, (d) => {
          t.get(x).length === 0 ? d(N) : d(j, -1);
        });
      }
      t.reset(c), t.reset(o), t.reset(s), t.append(e, s);
    }, ht = (e) => {
      var s = Ot(), o = t.child(s), c = t.sibling(t.child(o)), k = t.child(c);
      {
        var N = (d) => {
          var _ = At();
          t.append(d, _);
        }, j = (d) => {
          var _ = t.comment(), P = t.first_child(_);
          t.each(P, 17, () => t.get(i), (f) => f.id, (f, m) => {
            var y = Gt(), r = t.child(y), u = t.child(r, !0);
            t.reset(r);
            var n = t.sibling(r), S = t.child(n, !0);
            t.reset(n);
            var g = t.sibling(n), z = t.child(g), q = t.child(z, !0);
            t.reset(z), t.reset(g);
            var F = t.sibling(g), K = t.child(F, !0);
            t.reset(F), t.reset(y), t.template_effect(() => {
              t.set_text(u, t.get(m).term), t.set_text(S, t.get(m).translation), t.set_text(q, t.get(m).locale), t.set_text(K, t.get(m).context ?? "—");
            }), t.append(f, y);
          }), t.append(d, _);
        };
        t.if(k, (d) => {
          t.get(i).length === 0 ? d(N) : d(j, -1);
        });
      }
      t.reset(c), t.reset(o), t.reset(s), t.append(e, s);
    };
    t.if(ct, (e) => {
      t.get(l) === "translations" ? e(vt) : t.get(l) === "locales" ? e(pt, 1) : e(ht, -1);
    });
  }
  t.reset(H);
  var _t = t.sibling(H, 2);
  {
    var ut = (e) => {
      var s = qt(), o = t.child(s), c = t.child(o), k = t.sibling(t.child(c)), N = t.child(k);
      $t(N, { class: "h-4 w-4" }), t.reset(k), t.reset(c);
      var j = t.sibling(c, 2), d = t.child(j), _ = t.sibling(t.child(d));
      t.remove_input_defaults(_), t.reset(d);
      var P = t.sibling(d, 2), f = t.sibling(t.child(P));
      t.remove_input_defaults(f), t.reset(P), t.reset(j);
      var m = t.sibling(j, 2), y = t.child(m), r = t.sibling(y), u = t.child(r, !0);
      t.reset(r), t.reset(m), t.reset(o), t.reset(s), t.template_effect(() => {
        r.disabled = t.get(M) || !t.get(T).code, t.set_text(u, t.get(M) ? "Saving…" : "Add");
      }), t.delegated("click", s, (n) => n.target === n.currentTarget && t.set(L, !1)), t.delegated("click", k, () => t.set(L, !1)), t.bind_value(_, () => t.get(T).code, (n) => t.get(T).code = n), t.bind_value(f, () => t.get(T).name, (n) => t.get(T).name = n), t.delegated("click", y, () => t.set(L, !1)), t.delegated("click", r, R), t.append(e, s);
    };
    t.if(_t, (e) => {
      t.get(L) && e(ut);
    });
  }
  t.template_effect(() => {
    Y = t.set_class(G, 1, "tab gap-2", null, Y, { "tab-active": t.get(l) === "translations" }), Z = t.set_class(O, 1, "tab gap-2", null, Z, { "tab-active": t.get(l) === "locales" }), et = t.set_class(tt, 1, "tab", null, et, { "tab-active": t.get(l) === "glossary" });
  }), t.delegated("click", G, () => t.set(l, "translations")), t.delegated("click", O, () => t.set(l, "locales")), t.delegated("click", tt, () => t.set(l, "glossary")), t.append(v, B), t.pop();
}
t.delegate(["click", "change", "keydown"]);
function Et() {
  const v = window.__zveltio;
  v && v.registerRoute({
    path: "translations",
    component: Ut,
    label: "Translations",
    icon: "Languages",
    category: "i18n"
  });
}
Et();
export {
  Et as default
};
