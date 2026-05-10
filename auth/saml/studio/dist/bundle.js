import "svelte/internal/disclose-version";
import * as e from "svelte/internal/client";
import { onMount as me } from "svelte";
const y = typeof window < "u" ? window.location.origin : "";
typeof window < "u" && (window.__ZVELTIO_ENGINE_URL__ = y);
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
const ge = {
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
var be = e.from_svg("<svg><!><!></svg>");
function h(l, t) {
  e.push(t, !0);
  const r = e.prop(t, "color", 3, "currentColor"), o = e.prop(t, "size", 3, 24), s = e.prop(t, "strokeWidth", 3, 2), u = e.prop(t, "absoluteStrokeWidth", 3, !1), i = e.prop(t, "iconNode", 19, () => []), n = e.rest_props(t, [
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
  var g = be();
  e.attribute_effect(
    g,
    (m) => ({
      ...ge,
      ...n,
      width: o(),
      height: o(),
      stroke: r(),
      "stroke-width": m,
      class: [
        "lucide-icon lucide",
        t.name && `lucide-${t.name}`,
        t.class
      ]
    }),
    [
      () => u() ? Number(s()) * 24 / Number(o()) : s()
    ]
  );
  var _ = e.child(g);
  e.each(_, 17, i, e.index, (m, w) => {
    var x = e.derived(() => e.to_array(e.get(w), 2));
    let S = () => e.get(x)[0], k = () => e.get(x)[1];
    var d = e.comment(), c = e.first_child(d);
    e.element(c, S, !0, (b, G) => {
      e.attribute_effect(b, () => ({ ...k() }));
    }), e.append(m, d);
  });
  var f = e.sibling(_);
  e.snippet(f, () => t.children ?? e.noop), e.reset(g), e.append(l, g), e.pop();
}
function he(l, t) {
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
  let r = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const o = [
    ["path", { d: "M21.801 10A10 10 0 1 1 17 3.335" }],
    ["path", { d: "m9 11 3 3L22 4" }]
  ];
  h(l, e.spread_props({ name: "circle-check-big" }, () => r, {
    get iconNode() {
      return o;
    },
    children: (s, u) => {
      var i = e.comment(), n = e.first_child(i);
      e.snippet(n, () => t.children ?? e.noop), e.append(s, i);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function fe(l, t) {
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
  let r = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const o = [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["path", { d: "m15 9-6 6" }],
    ["path", { d: "m9 9 6 6" }]
  ];
  h(l, e.spread_props({ name: "circle-x" }, () => r, {
    get iconNode() {
      return o;
    },
    children: (s, u) => {
      var i = e.comment(), n = e.first_child(i);
      e.snippet(n, () => t.children ?? e.noop), e.append(s, i);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function _e(l, t) {
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
  let r = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const o = [
    [
      "rect",
      {
        width: "14",
        height: "14",
        x: "8",
        y: "8",
        rx: "2",
        ry: "2"
      }
    ],
    [
      "path",
      {
        d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"
      }
    ]
  ];
  h(l, e.spread_props({ name: "copy" }, () => r, {
    get iconNode() {
      return o;
    },
    children: (s, u) => {
      var i = e.comment(), n = e.first_child(i);
      e.snippet(n, () => t.children ?? e.noop), e.append(s, i);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function oe(l, t) {
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
  let r = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const o = [["path", { d: "M21 12a9 9 0 1 1-6.219-8.56" }]];
  h(l, e.spread_props({ name: "loader-circle" }, () => r, {
    get iconNode() {
      return o;
    },
    children: (s, u) => {
      var i = e.comment(), n = e.first_child(i);
      e.snippet(n, () => t.children ?? e.noop), e.append(s, i);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function xe(l, t) {
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
  let r = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const o = [
    [
      "path",
      {
        d: "M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"
      }
    ],
    ["path", { d: "M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7" }],
    ["path", { d: "M7 3v4a1 1 0 0 0 1 1h7" }]
  ];
  h(l, e.spread_props({ name: "save" }, () => r, {
    get iconNode() {
      return o;
    },
    children: (s, u) => {
      var i = e.comment(), n = e.first_child(i);
      e.snippet(n, () => t.children ?? e.noop), e.append(s, i);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function ye(l, t) {
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
  let r = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const o = [
    [
      "path",
      {
        d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"
      }
    ]
  ];
  h(l, e.spread_props({ name: "shield" }, () => r, {
    get iconNode() {
      return o;
    },
    children: (s, u) => {
      var i = e.comment(), n = e.first_child(i);
      e.snippet(n, () => t.children ?? e.noop), e.append(s, i);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
var we = e.from_html('<div class="flex items-center gap-2 text-gray-400"><!> Loading...</div>'), Se = e.from_html('<div class="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><!> </div>'), ke = e.from_html('<div class="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"><!> </div>'), Ne = e.from_html("<!> Saving...", 1), $e = e.from_html("<!> Save Configuration", 1), Ee = e.from_html('<!> <!> <div class="rounded-lg border border-gray-200 bg-gray-50 p-4"><p class="text-xs font-medium text-gray-600 mb-1">Service Provider Metadata URL</p> <div class="flex items-center gap-2"><code class="flex-1 truncate text-xs text-gray-800"> </code> <button class="rounded p-1 hover:bg-gray-200" title="Copy"><!></button></div> <p class="mt-1 text-xs text-gray-400">Register this URL in your IdP as the SP metadata endpoint.</p></div> <form class="space-y-4"><div class="flex items-center justify-between rounded-lg border border-gray-200 p-3"><div><p class="text-sm font-medium">Enable SAML SSO</p> <p class="text-xs text-gray-500">Allow users to sign in via your Identity Provider</p></div> <input type="checkbox" class="h-4 w-4 rounded accent-blue-600"/></div> <div class="space-y-3"><div><label class="block text-sm font-medium text-gray-700 mb-1">IdP SSO URL <span class="text-red-500">*</span></label> <input type="url" required="" placeholder="https://idp.example.com/sso/saml" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"/></div> <div><label class="block text-sm font-medium text-gray-700 mb-1">SP Entity ID / Issuer <span class="text-red-500">*</span></label> <input type="text" required="" placeholder="https://your-zveltio-instance.com" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"/></div> <div><label class="block text-sm font-medium text-gray-700 mb-1">ACS Callback URL <span class="text-red-500">*</span></label> <input type="url" required="" placeholder="https://your-zveltio-instance.com/api/auth/saml/callback" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"/></div> <div><label class="block text-sm font-medium text-gray-700 mb-1">IdP Certificate (PEM) <span class="text-red-500">*</span></label> <textarea required="" placeholder="-----BEGIN CERTIFICATE----- ... -----END CERTIFICATE-----" class="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-xs focus:border-blue-400 focus:outline-none"></textarea></div> <div><label class="block text-sm font-medium text-gray-700 mb-1">SP Private Key (optional)</label> <textarea placeholder="-----BEGIN PRIVATE KEY----- ... -----END PRIVATE KEY-----" class="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-xs focus:border-blue-400 focus:outline-none"></textarea> <p class="mt-1 text-xs text-gray-400">Required only for signed authentication requests.</p></div> <div class="grid grid-cols-2 gap-3"><div><label class="block text-sm font-medium text-gray-700 mb-1">Signature Algorithm</label> <select class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"><option>SHA-256 (recommended)</option><option>SHA-512</option><option>SHA-1 (legacy)</option></select></div> <div class="flex items-end pb-2"><label class="flex items-center gap-2 text-sm"><input type="checkbox" class="h-4 w-4 accent-blue-600"/> Require signed response</label></div></div> <div class="grid grid-cols-2 gap-3"><div><label class="block text-sm font-medium text-gray-700 mb-1">Email attribute</label> <input type="text" placeholder="email" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"/></div> <div><label class="block text-sm font-medium text-gray-700 mb-1">Name attribute</label> <input type="text" placeholder="displayName" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"/></div></div></div> <button type="submit" class="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"><!></button></form>', 1), Pe = e.from_html('<div class="mx-auto max-w-2xl space-y-6 p-6"><div class="flex items-center gap-3"><!> <div><h1 class="text-xl font-semibold">SAML 2.0 SSO</h1> <p class="text-sm text-gray-500">Configure Single Sign-On with an external Identity Provider</p></div></div> <!></div>');
function Ae(l, t) {
  e.push(t, !0);
  let r = e.proxy({
    enabled: !1,
    entryPoint: "",
    issuer: "",
    cert: "",
    callbackUrl: "",
    privateKey: "",
    signatureAlgorithm: "sha256",
    wantAuthnResponseSigned: !0,
    mapEmail: "email",
    mapName: "displayName"
  }), o = e.state(!0), s = e.state(!1), u = e.state(""), i = e.state(""), n = e.state("");
  me(async () => {
    e.set(n, `${y}/api/auth/saml/metadata`);
    try {
      const d = await fetch(`${y}/api/auth/saml/config`, { credentials: "include" });
      if (d.ok) {
        const c = await d.json();
        c.config && Object.assign(r, c.config);
      }
    } catch {
    }
    e.set(o, !1);
  });
  async function g() {
    e.set(s, !0), e.set(u, ""), e.set(i, "");
    try {
      const d = await fetch(`${y}/api/auth/saml/config`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(r)
      }), c = await d.json();
      if (!d.ok) throw new Error(c.error ?? "Save failed");
      e.set(i, "SAML configuration saved successfully.");
    } catch (d) {
      e.set(u, d.message, !0);
    } finally {
      e.set(s, !1);
    }
  }
  async function _() {
    await navigator.clipboard.writeText(e.get(n));
  }
  var f = Pe(), m = e.child(f), w = e.child(m);
  ye(w, { class: "h-6 w-6 text-blue-500" }), e.next(2), e.reset(m);
  var x = e.sibling(m, 2);
  {
    var S = (d) => {
      var c = we(), b = e.child(c);
      oe(b, { class: "h-4 w-4 animate-spin" }), e.next(), e.reset(c), e.append(d, c);
    }, k = (d) => {
      var c = Ee(), b = e.first_child(c);
      {
        var G = (a) => {
          var p = Se(), v = e.child(p);
          fe(v, { class: "h-4 w-4 shrink-0" });
          var D = e.sibling(v);
          e.reset(p), e.template_effect(() => e.set_text(D, ` ${e.get(u) ?? ""}`)), e.append(a, p);
        };
        e.if(b, (a) => {
          e.get(u) && a(G);
        });
      }
      var B = e.sibling(b, 2);
      {
        var ne = (a) => {
          var p = ke(), v = e.child(p);
          he(v, { class: "h-4 w-4 shrink-0" });
          var D = e.sibling(v);
          e.reset(p), e.template_effect(() => e.set_text(D, ` ${e.get(i) ?? ""}`)), e.append(a, p);
        };
        e.if(B, (a) => {
          e.get(i) && a(ne);
        });
      }
      var N = e.sibling(B, 2), F = e.sibling(e.child(N), 2), $ = e.child(F), de = e.child($, !0);
      e.reset($);
      var E = e.sibling($, 2), ce = e.child(E);
      _e(ce, { class: "h-3.5 w-3.5 text-gray-500" }), e.reset(E), e.reset(F), e.next(2), e.reset(N);
      var P = e.sibling(N, 2), A = e.child(P), Y = e.sibling(e.child(A), 2);
      e.remove_input_defaults(Y), e.reset(A);
      var C = e.sibling(A, 2), I = e.child(C), J = e.sibling(e.child(I), 2);
      e.remove_input_defaults(J), e.reset(I);
      var R = e.sibling(I, 2), Z = e.sibling(e.child(R), 2);
      e.remove_input_defaults(Z), e.reset(R);
      var M = e.sibling(R, 2), Q = e.sibling(e.child(M), 2);
      e.remove_input_defaults(Q), e.reset(M);
      var L = e.sibling(M, 2), U = e.sibling(e.child(L), 2);
      e.remove_textarea_child(U), e.set_attribute(U, "rows", 4), e.reset(L);
      var T = e.sibling(L, 2), z = e.sibling(e.child(T), 2);
      e.remove_textarea_child(z), e.set_attribute(z, "rows", 3), e.next(2), e.reset(T);
      var O = e.sibling(T, 2), q = e.child(O), V = e.sibling(e.child(q), 2), j = e.child(V);
      j.value = j.__value = "sha256";
      var K = e.sibling(j);
      K.value = K.__value = "sha512";
      var X = e.sibling(K);
      X.value = X.__value = "sha1", e.reset(V), e.reset(q);
      var ee = e.sibling(q, 2), te = e.child(ee), re = e.child(te);
      e.remove_input_defaults(re), e.next(), e.reset(te), e.reset(ee), e.reset(O);
      var ae = e.sibling(O, 2), W = e.child(ae), ie = e.sibling(e.child(W), 2);
      e.remove_input_defaults(ie), e.reset(W);
      var se = e.sibling(W, 2), le = e.sibling(e.child(se), 2);
      e.remove_input_defaults(le), e.reset(se), e.reset(ae), e.reset(C);
      var H = e.sibling(C, 2), pe = e.child(H);
      {
        var ue = (a) => {
          var p = Ne(), v = e.first_child(p);
          oe(v, { class: "h-4 w-4 animate-spin" }), e.next(), e.append(a, p);
        }, ve = (a) => {
          var p = $e(), v = e.first_child(p);
          xe(v, { class: "h-4 w-4" }), e.next(), e.append(a, p);
        };
        e.if(pe, (a) => {
          e.get(s) ? a(ue) : a(ve, -1);
        });
      }
      e.reset(H), e.reset(P), e.template_effect(() => {
        e.set_text(de, e.get(n)), H.disabled = e.get(s);
      }), e.delegated("click", E, _), e.event("submit", P, (a) => {
        a.preventDefault(), g();
      }), e.bind_checked(Y, () => r.enabled, (a) => r.enabled = a), e.bind_value(J, () => r.entryPoint, (a) => r.entryPoint = a), e.bind_value(Z, () => r.issuer, (a) => r.issuer = a), e.bind_value(Q, () => r.callbackUrl, (a) => r.callbackUrl = a), e.bind_value(U, () => r.cert, (a) => r.cert = a), e.bind_value(z, () => r.privateKey, (a) => r.privateKey = a), e.bind_select_value(V, () => r.signatureAlgorithm, (a) => r.signatureAlgorithm = a), e.bind_checked(re, () => r.wantAuthnResponseSigned, (a) => r.wantAuthnResponseSigned = a), e.bind_value(ie, () => r.mapEmail, (a) => r.mapEmail = a), e.bind_value(le, () => r.mapName, (a) => r.mapName = a), e.append(d, c);
    };
    e.if(x, (d) => {
      e.get(o) ? d(S) : d(k, -1);
    });
  }
  e.reset(f), e.append(l, f), e.pop();
}
e.delegate(["click"]);
function Ce() {
  const l = window.__zveltio;
  l && l.registerRoute({
    path: "auth/saml",
    component: Ae,
    label: "SAML SSO",
    icon: "Shield",
    category: "auth"
  });
}
Ce();
export {
  Ce as default
};
