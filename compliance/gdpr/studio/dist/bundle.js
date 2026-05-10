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
const pt = {
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
var gt = t.from_svg("<svg><!><!></svg>");
function I(p, r) {
  t.push(r, !0);
  const y = t.prop(r, "color", 3, "currentColor"), a = t.prop(r, "size", 3, 24), c = t.prop(r, "strokeWidth", 3, 2), q = t.prop(r, "absoluteStrokeWidth", 3, !1), l = t.prop(r, "iconNode", 19, () => []), b = t.rest_props(r, [
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
  var f = gt();
  t.attribute_effect(
    f,
    (V) => ({
      ...pt,
      ...b,
      width: a(),
      height: a(),
      stroke: y(),
      "stroke-width": V,
      class: [
        "lucide-icon lucide",
        r.name && `lucide-${r.name}`,
        r.class
      ]
    }),
    [
      () => q() ? Number(c()) * 24 / Number(a()) : c()
    ]
  );
  var w = t.child(f);
  t.each(w, 17, l, t.index, (V, G) => {
    var W = t.derived(() => t.to_array(t.get(G), 2));
    let F = () => t.get(W)[0], Z = () => t.get(W)[1];
    var H = t.comment(), J = t.first_child(H);
    t.element(J, F, !0, (U, D) => {
      t.attribute_effect(U, () => ({ ...Z() }));
    }), t.append(V, H);
  });
  var L = t.sibling(w);
  t.snippet(L, () => r.children ?? t.noop), t.reset(f), t.append(p, f), t.pop();
}
function ut(p, r) {
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
  let y = t.rest_props(r, ["$$slots", "$$events", "$$legacy"]);
  const a = [
    ["ellipse", { cx: "12", cy: "5", rx: "9", ry: "3" }],
    ["path", { d: "M3 5V19A9 3 0 0 0 21 19V5" }],
    ["path", { d: "M3 12A9 3 0 0 0 21 12" }]
  ];
  I(p, t.spread_props({ name: "database" }, () => y, {
    get iconNode() {
      return a;
    },
    children: (c, q) => {
      var l = t.comment(), b = t.first_child(l);
      t.snippet(b, () => r.children ?? t.noop), t.append(c, l);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function bt(p, r) {
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
  let y = t.rest_props(r, ["$$slots", "$$events", "$$legacy"]);
  const a = [
    [
      "path",
      {
        d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"
      }
    ],
    ["path", { d: "M12 9v4" }],
    ["path", { d: "M12 17h.01" }]
  ];
  I(p, t.spread_props({ name: "file-warning" }, () => y, {
    get iconNode() {
      return a;
    },
    children: (c, q) => {
      var l = t.comment(), b = t.first_child(l);
      t.snippet(b, () => r.children ?? t.noop), t.append(c, l);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function ft(p, r) {
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
  let y = t.rest_props(r, ["$$slots", "$$events", "$$legacy"]);
  const a = [
    [
      "path",
      {
        d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"
      }
    ]
  ];
  I(p, t.spread_props({ name: "shield" }, () => y, {
    get iconNode() {
      return a;
    },
    children: (c, q) => {
      var l = t.comment(), b = t.first_child(l);
      t.snippet(b, () => r.children ?? t.noop), t.append(c, l);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function mt(p, r) {
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
  let y = t.rest_props(r, ["$$slots", "$$events", "$$legacy"]);
  const a = [
    ["path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }],
    ["path", { d: "M16 3.128a4 4 0 0 1 0 7.744" }],
    ["path", { d: "M22 21v-2a4 4 0 0 0-3-3.87" }],
    ["circle", { cx: "9", cy: "7", r: "4" }]
  ];
  I(p, t.spread_props({ name: "users" }, () => y, {
    get iconNode() {
      return a;
    },
    children: (c, q) => {
      var l = t.comment(), b = t.first_child(l);
      t.snippet(b, () => r.children ?? t.noop), t.append(c, l);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
var xt = t.from_html('<div class="alert alert-error"> </div>'), yt = t.from_html('<tr><td colspan="5" class="text-center py-6 text-base-content/60">No requests.</td></tr>'), wt = t.from_html('<button class="btn btn-ghost btn-xs">Fulfill</button> <button class="btn btn-ghost btn-xs">Reject</button>', 1), kt = t.from_html('<tr><td><span class="badge badge-sm"> </span></td><td> </td><td> </td><td><span class="badge badge-sm"> </span></td><td><!></td></tr>'), Nt = t.from_html('<div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Type</th><th>Subject</th><th>Requested</th><th>Status</th><th></th></tr></thead><tbody><!></tbody></table></div>'), qt = t.from_html('<tr><td colspan="5" class="text-center py-6 text-base-content/60">No breach incidents recorded.</td></tr>'), Pt = t.from_html('<tr><td> </td><td class="max-w-xs truncate"> </td><td><span class="badge badge-error badge-sm"> </span></td><td> </td><td> </td></tr>'), jt = t.from_html('<div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Date</th><th>Description</th><th>Severity</th><th>Affected</th><th>Notified DPA</th></tr></thead><tbody><!></tbody></table></div>'), St = t.from_html('<tr><td colspan="4" class="text-center py-6 text-base-content/60">No consents recorded.</td></tr>'), Mt = t.from_html("<tr><td> </td><td> </td><td> </td><td> </td></tr>"), $t = t.from_html('<div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Subject</th><th>Purpose</th><th>Granted</th><th>Withdrawn</th></tr></thead><tbody><!></tbody></table></div>'), zt = t.from_html('<tr><td colspan="4" class="text-center py-6 text-base-content/60">No records of processing yet.</td></tr>'), At = t.from_html('<tr><td> </td><td> </td><td class="text-xs"> </td><td> </td></tr>'), Ct = t.from_html('<div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Activity</th><th>Lawful basis</th><th>Categories</th><th>Retention</th></tr></thead><tbody><!></tbody></table></div>'), Wt = t.from_html('<div class="p-6 space-y-4"><header><h1 class="text-2xl font-semibold flex items-center gap-2"><!> GDPR Compliance</h1></header> <!> <div role="tablist" class="tabs tabs-bordered"><button role="tab"><!> Access requests</button> <button role="tab"><!> Breaches</button> <button role="tab">Consents</button> <button role="tab"><!> Processing records</button></div> <!></div>');
function Dt(p, r) {
  var et;
  t.push(r, !0);
  const y = ((et = window.__zveltio) == null ? void 0 : et.engineUrl) ?? "";
  let a = t.state("requests"), c = t.state(t.proxy([])), q = t.state(t.proxy([])), l = t.state(t.proxy([])), b = t.state(t.proxy([])), f = t.state("");
  async function w(e, d) {
    const n = await fetch(`${y}${e}`, { credentials: "include", ...d }), g = await n.json().catch(() => ({}));
    if (!n.ok) throw new Error(g.error || `HTTP ${n.status}`);
    return g;
  }
  t.user_effect(() => {
    t.get(a) === "requests" ? w("/api/gdpr/access-requests").then((e) => t.set(c, e.data ?? [], !0)).catch((e) => t.set(f, e.message, !0)) : t.get(a) === "breaches" ? w("/api/gdpr/breach-incidents").then((e) => t.set(q, e.data ?? [], !0)).catch((e) => t.set(f, e.message, !0)) : t.get(a) === "consents" ? w("/api/gdpr/consents").then((e) => t.set(l, e.data ?? [], !0)).catch((e) => t.set(f, e.message, !0)) : t.get(a) === "records" && w("/api/gdpr/processing-records").then((e) => t.set(b, e.data ?? [], !0)).catch((e) => t.set(f, e.message, !0));
  });
  async function L(e) {
    try {
      await w(`/api/gdpr/access-requests/${e}/fulfill`, { method: "POST" }), t.set(c, (await w("/api/gdpr/access-requests")).data ?? [], !0);
    } catch (d) {
      t.set(f, d.message, !0);
    }
  }
  async function V(e) {
    try {
      await w(`/api/gdpr/access-requests/${e}/reject`, { method: "POST" }), t.set(c, (await w("/api/gdpr/access-requests")).data ?? [], !0);
    } catch (d) {
      t.set(f, d.message, !0);
    }
  }
  var G = Wt(), W = t.child(G), F = t.child(W), Z = t.child(F);
  ft(Z, { class: "h-6 w-6" }), t.next(), t.reset(F), t.reset(W);
  var H = t.sibling(W, 2);
  {
    var J = (e) => {
      var d = xt(), n = t.child(d, !0);
      t.reset(d), t.template_effect(() => t.set_text(n, t.get(f))), t.append(e, d);
    };
    t.if(H, (e) => {
      t.get(f) && e(J);
    });
  }
  var U = t.sibling(H, 2), D = t.child(U);
  let Q;
  var st = t.child(D);
  mt(st, { class: "h-4 w-4" }), t.next(), t.reset(D);
  var B = t.sibling(D, 2);
  let X;
  var dt = t.child(B);
  bt(dt, { class: "h-4 w-4" }), t.next(), t.reset(B);
  var K = t.sibling(B, 2);
  let Y;
  var O = t.sibling(K, 2);
  let tt;
  var it = t.child(O);
  ut(it, { class: "h-4 w-4" }), t.next(), t.reset(O), t.reset(U);
  var ot = t.sibling(U, 2);
  {
    var lt = (e) => {
      var d = Nt(), n = t.child(d), g = t.sibling(t.child(n)), $ = t.child(g);
      {
        var z = (s) => {
          var o = yt();
          t.append(s, o);
        }, A = (s) => {
          var o = t.comment(), C = t.first_child(o);
          t.each(C, 17, () => t.get(c), (h) => h.id, (h, i) => {
            var _ = kt(), v = t.child(_), S = t.child(v), m = t.child(S, !0);
            t.reset(S), t.reset(v);
            var P = t.sibling(v), x = t.child(P, !0);
            t.reset(P);
            var N = t.sibling(P), j = t.child(N, !0);
            t.reset(N);
            var k = t.sibling(N), u = t.child(k), R = t.child(u, !0);
            t.reset(u), t.reset(k);
            var E = t.sibling(k), T = t.child(E);
            {
              var _t = (M) => {
                var rt = wt(), at = t.first_child(rt), vt = t.sibling(at, 2);
                t.delegated("click", at, () => L(t.get(i).id)), t.delegated("click", vt, () => V(t.get(i).id)), t.append(M, rt);
              };
              t.if(T, (M) => {
                t.get(i).status === "pending" && M(_t);
              });
            }
            t.reset(E), t.reset(_), t.template_effect(
              (M) => {
                t.set_text(m, t.get(i).request_type), t.set_text(x, t.get(i).subject_email ?? t.get(i).subject_id), t.set_text(j, M), t.set_text(R, t.get(i).status);
              },
              [() => {
                var M;
                return (M = t.get(i).created_at) == null ? void 0 : M.slice(0, 10);
              }]
            ), t.append(h, _);
          }), t.append(s, o);
        };
        t.if($, (s) => {
          t.get(c).length === 0 ? s(z) : s(A, -1);
        });
      }
      t.reset(g), t.reset(n), t.reset(d), t.append(e, d);
    }, nt = (e) => {
      var d = jt(), n = t.child(d), g = t.sibling(t.child(n)), $ = t.child(g);
      {
        var z = (s) => {
          var o = qt();
          t.append(s, o);
        }, A = (s) => {
          var o = t.comment(), C = t.first_child(o);
          t.each(C, 17, () => t.get(q), (h) => h.id, (h, i) => {
            var _ = Pt(), v = t.child(_), S = t.child(v, !0);
            t.reset(v);
            var m = t.sibling(v), P = t.child(m, !0);
            t.reset(m);
            var x = t.sibling(m), N = t.child(x), j = t.child(N, !0);
            t.reset(N), t.reset(x);
            var k = t.sibling(x), u = t.child(k, !0);
            t.reset(k);
            var R = t.sibling(k), E = t.child(R, !0);
            t.reset(R), t.reset(_), t.template_effect(
              (T) => {
                t.set_text(S, T), t.set_text(P, t.get(i).description), t.set_text(j, t.get(i).severity), t.set_text(u, t.get(i).affected_count ?? "?"), t.set_text(E, t.get(i).notified_dpa_at ? "✓" : "—");
              },
              [() => {
                var T;
                return (T = t.get(i).detected_at) == null ? void 0 : T.slice(0, 10);
              }]
            ), t.append(h, _);
          }), t.append(s, o);
        };
        t.if($, (s) => {
          t.get(q).length === 0 ? s(z) : s(A, -1);
        });
      }
      t.reset(g), t.reset(n), t.reset(d), t.append(e, d);
    }, ct = (e) => {
      var d = $t(), n = t.child(d), g = t.sibling(t.child(n)), $ = t.child(g);
      {
        var z = (s) => {
          var o = St();
          t.append(s, o);
        }, A = (s) => {
          var o = t.comment(), C = t.first_child(o);
          t.each(C, 17, () => t.get(l), (h) => h.id, (h, i) => {
            var _ = Mt(), v = t.child(_), S = t.child(v, !0);
            t.reset(v);
            var m = t.sibling(v), P = t.child(m, !0);
            t.reset(m);
            var x = t.sibling(m), N = t.child(x, !0);
            t.reset(x);
            var j = t.sibling(x), k = t.child(j, !0);
            t.reset(j), t.reset(_), t.template_effect(
              (u, R) => {
                t.set_text(S, t.get(i).subject_id), t.set_text(P, t.get(i).purpose), t.set_text(N, u), t.set_text(k, R);
              },
              [
                () => {
                  var u;
                  return (u = t.get(i).granted_at) == null ? void 0 : u.slice(0, 10);
                },
                () => {
                  var u;
                  return ((u = t.get(i).withdrawn_at) == null ? void 0 : u.slice(0, 10)) ?? "—";
                }
              ]
            ), t.append(h, _);
          }), t.append(s, o);
        };
        t.if($, (s) => {
          t.get(l).length === 0 ? s(z) : s(A, -1);
        });
      }
      t.reset(g), t.reset(n), t.reset(d), t.append(e, d);
    }, ht = (e) => {
      var d = Ct(), n = t.child(d), g = t.sibling(t.child(n)), $ = t.child(g);
      {
        var z = (s) => {
          var o = zt();
          t.append(s, o);
        }, A = (s) => {
          var o = t.comment(), C = t.first_child(o);
          t.each(C, 17, () => t.get(b), (h) => h.id, (h, i) => {
            var _ = At(), v = t.child(_), S = t.child(v, !0);
            t.reset(v);
            var m = t.sibling(v), P = t.child(m, !0);
            t.reset(m);
            var x = t.sibling(m), N = t.child(x, !0);
            t.reset(x);
            var j = t.sibling(x), k = t.child(j, !0);
            t.reset(j), t.reset(_), t.template_effect(
              (u) => {
                t.set_text(S, t.get(i).activity_name), t.set_text(P, t.get(i).lawful_basis), t.set_text(N, u), t.set_text(k, t.get(i).retention_period ?? "—");
              },
              [() => (t.get(i).data_categories ?? []).join(", ")]
            ), t.append(h, _);
          }), t.append(s, o);
        };
        t.if($, (s) => {
          t.get(b).length === 0 ? s(z) : s(A, -1);
        });
      }
      t.reset(g), t.reset(n), t.reset(d), t.append(e, d);
    };
    t.if(ot, (e) => {
      t.get(a) === "requests" ? e(lt) : t.get(a) === "breaches" ? e(nt, 1) : t.get(a) === "consents" ? e(ct, 2) : e(ht, -1);
    });
  }
  t.reset(G), t.template_effect(() => {
    Q = t.set_class(D, 1, "tab gap-2", null, Q, { "tab-active": t.get(a) === "requests" }), X = t.set_class(B, 1, "tab gap-2", null, X, { "tab-active": t.get(a) === "breaches" }), Y = t.set_class(K, 1, "tab", null, Y, { "tab-active": t.get(a) === "consents" }), tt = t.set_class(O, 1, "tab gap-2", null, tt, { "tab-active": t.get(a) === "records" });
  }), t.delegated("click", D, () => t.set(a, "requests")), t.delegated("click", B, () => t.set(a, "breaches")), t.delegated("click", K, () => t.set(a, "consents")), t.delegated("click", O, () => t.set(a, "records")), t.append(p, G), t.pop();
}
t.delegate(["click"]);
function Rt() {
  const p = window.__zveltio;
  p && p.registerRoute({
    path: "gdpr",
    component: Dt,
    label: "GDPR",
    icon: "Shield",
    category: "compliance"
  });
}
Rt();
export {
  Rt as default
};
