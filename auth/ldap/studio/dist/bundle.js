import "svelte/internal/disclose-version";
import * as e from "svelte/internal/client";
import { onMount as Se } from "svelte";
const D = typeof window < "u" ? window.location.origin : "";
typeof window < "u" && (window.__ZVELTIO_ENGINE_URL__ = D);
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
const De = {
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
var Le = e.from_svg("<svg><!><!></svg>");
function x(l, r) {
  e.push(r, !0);
  const s = e.prop(r, "color", 3, "currentColor"), d = e.prop(r, "size", 3, 24), n = e.prop(r, "strokeWidth", 3, 2), u = e.prop(r, "absoluteStrokeWidth", 3, !1), i = e.prop(r, "iconNode", 19, () => []), c = e.rest_props(r, [
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
  var m = Le();
  e.attribute_effect(
    m,
    (y) => ({
      ...De,
      ...c,
      width: d(),
      height: d(),
      stroke: s(),
      "stroke-width": y,
      class: [
        "lucide-icon lucide",
        r.name && `lucide-${r.name}`,
        r.class
      ]
    }),
    [
      () => u() ? Number(n()) * 24 / Number(d()) : n()
    ]
  );
  var f = e.child(m);
  e.each(f, 17, i, e.index, (y, L) => {
    var _ = e.derived(() => e.to_array(e.get(L), 2));
    let w = () => e.get(_)[0], C = () => e.get(_)[1];
    var A = e.comment(), T = e.first_child(A);
    e.element(T, w, !0, (M, o) => {
      e.attribute_effect(M, () => ({ ...C() }));
    }), e.append(y, A);
  });
  var v = e.sibling(f);
  e.snippet(v, () => r.children ?? e.noop), e.reset(m), e.append(l, m), e.pop();
}
function Ce(l, r) {
  e.push(r, !0);
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
  let s = e.rest_props(r, ["$$slots", "$$events", "$$legacy"]);
  const d = [
    ["path", { d: "M21.801 10A10 10 0 1 1 17 3.335" }],
    ["path", { d: "m9 11 3 3L22 4" }]
  ];
  x(l, e.spread_props({ name: "circle-check-big" }, () => s, {
    get iconNode() {
      return d;
    },
    children: (n, u) => {
      var i = e.comment(), c = e.first_child(i);
      e.snippet(c, () => r.children ?? e.noop), e.append(n, i);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function Te(l, r) {
  e.push(r, !0);
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
  let s = e.rest_props(r, ["$$slots", "$$events", "$$legacy"]);
  const d = [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["path", { d: "m15 9-6 6" }],
    ["path", { d: "m9 9 6 6" }]
  ];
  x(l, e.spread_props({ name: "circle-x" }, () => s, {
    get iconNode() {
      return d;
    },
    children: (n, u) => {
      var i = e.comment(), c = e.first_child(i);
      e.snippet(c, () => r.children ?? e.noop), e.append(n, i);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function ge(l, r) {
  e.push(r, !0);
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
  let s = e.rest_props(r, ["$$slots", "$$events", "$$legacy"]);
  const d = [
    [
      "path",
      {
        d: "M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2"
      }
    ],
    ["path", { d: "M6.453 15h11.094" }],
    ["path", { d: "M8.5 2h7" }]
  ];
  x(l, e.spread_props({ name: "flask-conical" }, () => s, {
    get iconNode() {
      return d;
    },
    children: (n, u) => {
      var i = e.comment(), c = e.first_child(i);
      e.snippet(c, () => r.children ?? e.noop), e.append(n, i);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function K(l, r) {
  e.push(r, !0);
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
  let s = e.rest_props(r, ["$$slots", "$$events", "$$legacy"]);
  const d = [["path", { d: "M21 12a9 9 0 1 1-6.219-8.56" }]];
  x(l, e.spread_props({ name: "loader-circle" }, () => s, {
    get iconNode() {
      return d;
    },
    children: (n, u) => {
      var i = e.comment(), c = e.first_child(i);
      e.snippet(c, () => r.children ?? e.noop), e.append(n, i);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function Me(l, r) {
  e.push(r, !0);
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
  let s = e.rest_props(r, ["$$slots", "$$events", "$$legacy"]);
  const d = [
    [
      "path",
      {
        d: "M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"
      }
    ],
    ["path", { d: "M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7" }],
    ["path", { d: "M7 3v4a1 1 0 0 0 1 1h7" }]
  ];
  x(l, e.spread_props({ name: "save" }, () => s, {
    get iconNode() {
      return d;
    },
    children: (n, u) => {
      var i = e.comment(), c = e.first_child(i);
      e.snippet(c, () => r.children ?? e.noop), e.append(n, i);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function Ve(l, r) {
  e.push(r, !0);
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
  let s = e.rest_props(r, ["$$slots", "$$events", "$$legacy"]);
  const d = [
    [
      "rect",
      {
        width: "20",
        height: "8",
        x: "2",
        y: "2",
        rx: "2",
        ry: "2"
      }
    ],
    [
      "rect",
      {
        width: "20",
        height: "8",
        x: "2",
        y: "14",
        rx: "2",
        ry: "2"
      }
    ],
    ["line", { x1: "6", x2: "6.01", y1: "6", y2: "6" }],
    ["line", { x1: "6", x2: "6.01", y1: "18", y2: "18" }]
  ];
  x(l, e.spread_props({ name: "server" }, () => s, {
    get iconNode() {
      return d;
    },
    children: (n, u) => {
      var i = e.comment(), c = e.first_child(i);
      e.snippet(c, () => r.children ?? e.noop), e.append(n, i);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
var Ee = e.from_html('<div class="flex items-center gap-2 text-gray-400"><!> Loading...</div>'), je = e.from_html('<div class="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><!> </div>'), ze = e.from_html('<div class="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"><!> </div>'), Be = e.from_html("<!> Saving...", 1), Ue = e.from_html("<!> Save Configuration", 1), Oe = e.from_html("<!> Testing...", 1), We = e.from_html("<!> Test", 1), Fe = e.from_html('<p class="font-medium">Connection successful</p> <p> </p> <p> </p>', 1), Re = e.from_html('<p class="font-medium">Connection failed</p> <p> </p>', 1), qe = e.from_html("<div><!></div>"), Ie = e.from_html('<!> <!> <form class="space-y-4"><div class="flex items-center justify-between rounded-lg border border-gray-200 p-3"><div><p class="text-sm font-medium">Enable LDAP Authentication</p> <p class="text-xs text-gray-500">Allow users to sign in with LDAP credentials</p></div> <input type="checkbox" class="h-4 w-4 rounded accent-indigo-600"/></div> <div class="space-y-3"><div><label class="block text-sm font-medium text-gray-700 mb-1">LDAP URL <span class="text-red-500">*</span></label> <input type="text" required="" placeholder="ldap://ldap.company.com:389" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"/> <p class="mt-1 text-xs text-gray-400">Use ldaps:// for secure connections (port 636)</p></div> <div><label class="block text-sm font-medium text-gray-700 mb-1">Bind DN <span class="text-red-500">*</span></label> <input type="text" required="" placeholder="cn=service-account,dc=company,dc=com" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"/></div> <div><label class="block text-sm font-medium text-gray-700 mb-1">Bind Password <span class="text-red-500">*</span></label> <input type="password" required="" placeholder="Service account password" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"/></div> <div><label class="block text-sm font-medium text-gray-700 mb-1">Search Base <span class="text-red-500">*</span></label> <input type="text" required="" placeholder="ou=users,dc=company,dc=com" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"/></div> <div><label class="block text-sm font-medium text-gray-700 mb-1">Search Filter</label> <input type="text" class="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-sm focus:border-indigo-400 focus:outline-none"/> <p class="mt-1 text-xs text-gray-400">Use &#123;&#123;username&#125;&#125; as placeholder. AD example: (sAMAccountName=&#123;&#123;username&#125;&#125;)</p></div> <div class="grid grid-cols-3 gap-3"><div><label class="block text-sm font-medium text-gray-700 mb-1">Username attr</label> <input type="text" placeholder="uid" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"/></div> <div><label class="block text-sm font-medium text-gray-700 mb-1">Email attr</label> <input type="text" placeholder="mail" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"/></div> <div><label class="block text-sm font-medium text-gray-700 mb-1">Name attr</label> <input type="text" placeholder="cn" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"/></div></div> <div class="flex items-center gap-2"><input type="checkbox" id="tlsVerify" class="h-4 w-4 accent-indigo-600"/> <label for="tlsVerify" class="text-sm">Verify TLS certificate</label> <span class="text-xs text-gray-400">(disable for self-signed certs in dev)</span></div></div> <button type="submit" class="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"><!></button></form> <div class="rounded-lg border border-gray-200 p-4 space-y-3"><div class="flex items-center gap-2"><!> <h2 class="text-sm font-medium">Test Connection</h2></div> <div class="grid grid-cols-2 gap-3"><input type="text" placeholder="Test username" class="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"/> <input type="password" placeholder="Test password" class="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"/></div> <button class="flex items-center gap-2 rounded-lg border border-indigo-200 px-3 py-1.5 text-sm text-indigo-700 hover:bg-indigo-50 disabled:opacity-50"><!></button> <!></div>', 1), He = e.from_html(`<div class="mx-auto max-w-2xl space-y-6 p-6"><div class="flex items-center gap-3"><!> <div><h1 class="text-xl font-semibold">LDAP / Active Directory</h1> <p class="text-sm text-gray-500">Authenticate users via your organization's LDAP or AD server</p></div></div> <!></div>`);
function Ge(l, r) {
  e.push(r, !0);
  let s = e.proxy({
    enabled: !1,
    url: "",
    bindDN: "",
    bindPassword: "",
    searchBase: "",
    searchFilter: "(uid={{username}})",
    usernameAttribute: "uid",
    emailAttribute: "mail",
    nameAttribute: "cn",
    tlsVerify: !0
  }), d = e.state(!0), n = e.state(!1), u = e.state(!1), i = e.state(""), c = e.state(""), m = e.state(""), f = e.state(""), v = e.state(null);
  Se(async () => {
    try {
      const o = await fetch(`${D}/api/auth/ldap/config`, { credentials: "include" });
      if (o.ok) {
        const g = await o.json();
        g.config && Object.assign(s, g.config);
      }
    } catch {
    }
    e.set(d, !1);
  });
  async function y() {
    e.set(n, !0), e.set(i, ""), e.set(c, "");
    try {
      const o = await fetch(`${D}/api/auth/ldap/config`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(s)
      }), g = await o.json();
      if (!o.ok) throw new Error(g.error ?? "Save failed");
      e.set(c, "LDAP configuration saved successfully.");
    } catch (o) {
      e.set(i, o.message, !0);
    } finally {
      e.set(n, !1);
    }
  }
  async function L() {
    if (!(!e.get(m) || !e.get(f))) {
      e.set(u, !0), e.set(v, null);
      try {
        const o = await fetch(`${D}/api/auth/ldap/test`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: e.get(m), password: e.get(f) })
        });
        e.set(v, await o.json(), !0);
      } catch (o) {
        e.set(v, { success: !1, error: o.message }, !0);
      } finally {
        e.set(u, !1);
      }
    }
  }
  var _ = He(), w = e.child(_), C = e.child(w);
  Ve(C, { class: "h-6 w-6 text-indigo-500" }), e.next(2), e.reset(w);
  var A = e.sibling(w, 2);
  {
    var T = (o) => {
      var g = Ee(), P = e.child(g);
      K(P, { class: "h-4 w-4 animate-spin" }), e.next(), e.reset(g), e.append(o, g);
    }, M = (o) => {
      var g = Ie(), P = e.first_child(g);
      {
        var me = (t) => {
          var a = je(), p = e.child(a);
          Te(p, { class: "h-4 w-4 shrink-0" });
          var N = e.sibling(p);
          e.reset(a), e.template_effect(() => e.set_text(N, ` ${e.get(i) ?? ""}`)), e.append(t, a);
        };
        e.if(P, (t) => {
          e.get(i) && t(me);
        });
      }
      var Q = e.sibling(P, 2);
      {
        var fe = (t) => {
          var a = ze(), p = e.child(a);
          Ce(p, { class: "h-4 w-4 shrink-0" });
          var N = e.sibling(p);
          e.reset(a), e.template_effect(() => e.set_text(N, ` ${e.get(c) ?? ""}`)), e.append(t, a);
        };
        e.if(Q, (t) => {
          e.get(c) && t(fe);
        });
      }
      var S = e.sibling(Q, 2), V = e.child(S), X = e.sibling(e.child(V), 2);
      e.remove_input_defaults(X), e.reset(V);
      var E = e.sibling(V, 2), j = e.child(E), Y = e.sibling(e.child(j), 2);
      e.remove_input_defaults(Y), e.next(2), e.reset(j);
      var z = e.sibling(j, 2), ee = e.sibling(e.child(z), 2);
      e.remove_input_defaults(ee), e.reset(z);
      var B = e.sibling(z, 2), te = e.sibling(e.child(B), 2);
      e.remove_input_defaults(te), e.reset(B);
      var U = e.sibling(B, 2), re = e.sibling(e.child(U), 2);
      e.remove_input_defaults(re), e.reset(U);
      var O = e.sibling(U, 2), W = e.sibling(e.child(O), 2);
      e.remove_input_defaults(W), e.set_attribute(W, "placeholder", `(uid=${{ username }})`), e.next(2), e.reset(O);
      var F = e.sibling(O, 2), R = e.child(F), se = e.sibling(e.child(R), 2);
      e.remove_input_defaults(se), e.reset(R);
      var q = e.sibling(R, 2), ie = e.sibling(e.child(q), 2);
      e.remove_input_defaults(ie), e.reset(q);
      var ae = e.sibling(q, 2), ne = e.sibling(e.child(ae), 2);
      e.remove_input_defaults(ne), e.reset(ae), e.reset(F);
      var oe = e.sibling(F, 2), le = e.child(oe);
      e.remove_input_defaults(le), e.next(4), e.reset(oe), e.reset(E);
      var I = e.sibling(E, 2), _e = e.child(I);
      {
        var be = (t) => {
          var a = Be(), p = e.first_child(a);
          K(p, { class: "h-4 w-4 animate-spin" }), e.next(), e.append(t, a);
        }, he = (t) => {
          var a = Ue(), p = e.first_child(a);
          Me(p, { class: "h-4 w-4" }), e.next(), e.append(t, a);
        };
        e.if(_e, (t) => {
          e.get(n) ? t(be) : t(he, -1);
        });
      }
      e.reset(I), e.reset(S);
      var de = e.sibling(S, 2), H = e.child(de), xe = e.child(H);
      ge(xe, { class: "h-4 w-4 text-gray-500" }), e.next(2), e.reset(H);
      var G = e.sibling(H, 2), J = e.child(G);
      e.remove_input_defaults(J);
      var ce = e.sibling(J, 2);
      e.remove_input_defaults(ce), e.reset(G);
      var k = e.sibling(G, 2), ye = e.child(k);
      {
        var we = (t) => {
          var a = Oe(), p = e.first_child(a);
          K(p, { class: "h-3.5 w-3.5 animate-spin" }), e.next(), e.append(t, a);
        }, ke = (t) => {
          var a = We(), p = e.first_child(a);
          ge(p, { class: "h-3.5 w-3.5" }), e.next(), e.append(t, a);
        };
        e.if(ye, (t) => {
          e.get(u) ? t(we) : t(ke, -1);
        });
      }
      e.reset(k);
      var Ne = e.sibling(k, 2);
      {
        var $e = (t) => {
          var a = qe(), p = e.child(a);
          {
            var N = (b) => {
              var $ = Fe(), h = e.sibling(e.first_child($), 2), Z = e.child(h);
              e.reset(h);
              var pe = e.sibling(h, 2), Pe = e.child(pe);
              e.reset(pe), e.template_effect(() => {
                var ue, ve;
                e.set_text(Z, `Email: ${((ue = e.get(v).user) == null ? void 0 : ue.email) ?? ""}`), e.set_text(Pe, `Name: ${((ve = e.get(v).user) == null ? void 0 : ve.displayName) ?? ""}`);
              }), e.append(b, $);
            }, Ae = (b) => {
              var $ = Re(), h = e.sibling(e.first_child($), 2), Z = e.child(h, !0);
              e.reset(h), e.template_effect(() => e.set_text(Z, e.get(v).error)), e.append(b, $);
            };
            e.if(p, (b) => {
              e.get(v).success ? b(N) : b(Ae, -1);
            });
          }
          e.reset(a), e.template_effect(() => e.set_class(a, 1, `rounded-lg p-3 text-sm ${e.get(v).success ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`)), e.append(t, a);
        };
        e.if(Ne, (t) => {
          e.get(v) && t($e);
        });
      }
      e.reset(de), e.template_effect(() => {
        I.disabled = e.get(n), k.disabled = e.get(u) || !e.get(m) || !e.get(f);
      }), e.event("submit", S, (t) => {
        t.preventDefault(), y();
      }), e.bind_checked(X, () => s.enabled, (t) => s.enabled = t), e.bind_value(Y, () => s.url, (t) => s.url = t), e.bind_value(ee, () => s.bindDN, (t) => s.bindDN = t), e.bind_value(te, () => s.bindPassword, (t) => s.bindPassword = t), e.bind_value(re, () => s.searchBase, (t) => s.searchBase = t), e.bind_value(W, () => s.searchFilter, (t) => s.searchFilter = t), e.bind_value(se, () => s.usernameAttribute, (t) => s.usernameAttribute = t), e.bind_value(ie, () => s.emailAttribute, (t) => s.emailAttribute = t), e.bind_value(ne, () => s.nameAttribute, (t) => s.nameAttribute = t), e.bind_checked(le, () => s.tlsVerify, (t) => s.tlsVerify = t), e.bind_value(J, () => e.get(m), (t) => e.set(m, t)), e.bind_value(ce, () => e.get(f), (t) => e.set(f, t)), e.delegated("click", k, L), e.append(o, g);
    };
    e.if(A, (o) => {
      e.get(d) ? o(T) : o(M, -1);
    });
  }
  e.reset(_), e.append(l, _), e.pop();
}
e.delegate(["click"]);
function Je() {
  const l = window.__zveltio;
  l && l.registerRoute({
    path: "auth/ldap",
    component: Ge,
    label: "LDAP / AD",
    icon: "Server",
    category: "auth"
  });
}
Je();
export {
  Je as default
};
