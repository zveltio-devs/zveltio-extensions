import "svelte/internal/disclose-version";
import * as e from "svelte/internal/client";
import { onMount as We } from "svelte";
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
var Ie = e.from_svg("<svg><!><!></svg>");
function H(c, t) {
  e.push(t, !0);
  const o = e.prop(t, "color", 3, "currentColor"), r = e.prop(t, "size", 3, 24), d = e.prop(t, "strokeWidth", 3, 2), n = e.prop(t, "absoluteStrokeWidth", 3, !1), i = e.prop(t, "iconNode", 19, () => []), v = e.rest_props(t, [
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
  var $ = Ie();
  e.attribute_effect(
    $,
    (x) => ({
      ...De,
      ...v,
      width: r(),
      height: r(),
      stroke: o(),
      "stroke-width": x,
      class: [
        "lucide-icon lucide",
        t.name && `lucide-${t.name}`,
        t.class
      ]
    }),
    [
      () => n() ? Number(d()) * 24 / Number(r()) : d()
    ]
  );
  var j = e.child($);
  e.each(j, 17, i, e.index, (x, z) => {
    var f = e.derived(() => e.to_array(e.get(z), 2));
    let U = () => e.get(f)[0], S = () => e.get(f)[1];
    var M = e.comment(), V = e.first_child(M);
    e.element(V, U, !0, (J, ne) => {
      e.attribute_effect(J, () => ({ ...S() }));
    }), e.append(x, M);
  });
  var u = e.sibling(j);
  e.snippet(u, () => t.children ?? e.noop), e.reset($), e.append(c, $), e.pop();
}
function Ue(c, t) {
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
  let o = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const r = [
    ["path", { d: "M21.801 10A10 10 0 1 1 17 3.335" }],
    ["path", { d: "m9 11 3 3L22 4" }]
  ];
  H(c, e.spread_props({ name: "circle-check-big" }, () => o, {
    get iconNode() {
      return r;
    },
    children: (d, n) => {
      var i = e.comment(), v = e.first_child(i);
      e.snippet(v, () => t.children ?? e.noop), e.append(d, i);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function ve(c, t) {
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
  let o = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const r = [
    ["path", { d: "m16 18 6-6-6-6" }],
    ["path", { d: "m8 6-6 6 6 6" }]
  ];
  H(c, e.spread_props({ name: "code" }, () => o, {
    get iconNode() {
      return r;
    },
    children: (d, n) => {
      var i = e.comment(), v = e.first_child(i);
      e.snippet(v, () => t.children ?? e.noop), e.append(d, i);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function Ve(c, t) {
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
  let o = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const r = [["polygon", { points: "6 3 20 12 6 21 6 3" }]];
  H(c, e.spread_props({ name: "play" }, () => o, {
    get iconNode() {
      return r;
    },
    children: (d, n) => {
      var i = e.comment(), v = e.first_child(i);
      e.snippet(v, () => t.children ?? e.noop), e.append(d, i);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function ge(c, t) {
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
  let o = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const r = [["path", { d: "M5 12h14" }], ["path", { d: "M12 5v14" }]];
  H(c, e.spread_props({ name: "plus" }, () => o, {
    get iconNode() {
      return r;
    },
    children: (d, n) => {
      var i = e.comment(), v = e.first_child(i);
      e.snippet(v, () => t.children ?? e.noop), e.append(d, i);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function Je(c, t) {
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
  let o = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const r = [
    [
      "path",
      {
        d: "M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"
      }
    ],
    ["path", { d: "M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7" }],
    ["path", { d: "M7 3v4a1 1 0 0 0 1 1h7" }]
  ];
  H(c, e.spread_props({ name: "save" }, () => o, {
    get iconNode() {
      return r;
    },
    children: (d, n) => {
      var i = e.comment(), v = e.first_child(i);
      e.snippet(v, () => t.children ?? e.noop), e.append(d, i);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function Ze(c, t) {
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
  let o = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const r = [
    ["path", { d: "M3 6h18" }],
    ["path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" }],
    ["path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" }],
    ["line", { x1: "10", x2: "10", y1: "11", y2: "17" }],
    ["line", { x1: "14", x2: "14", y1: "11", y2: "17" }]
  ];
  H(c, e.spread_props({ name: "trash-2" }, () => o, {
    get iconNode() {
      return r;
    },
    children: (d, n) => {
      var i = e.comment(), v = e.first_child(i);
      e.snippet(v, () => t.children ?? e.noop), e.append(d, i);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
var qe = e.from_html('<div class="flex justify-center py-6"><span class="loading loading-spinner loading-sm"></span></div>'), Ge = e.from_html('<div class="p-4 text-center text-sm text-base-content/40"><!> No functions yet</div>'), Be = e.from_html('<button><div class="flex items-center justify-between"><span class="font-medium text-sm truncate"> </span> <span> </span></div> <p class="text-xs text-base-content/40 font-mono mt-0.5 truncate"> </p></button>'), Ye = e.from_html('<span class="loading loading-spinner loading-xs"></span>'), Ke = e.from_html('<span class="loading loading-spinner loading-xs"></span>'), Qe = e.from_html('<p class="text-xs font-mono text-base-content/60"> </p>'), Xe = e.from_html('<div class="mt-2"><p class="text-xs font-medium mb-1">Console logs</p> <!></div>'), et = e.from_html('<p class="text-xs text-error mt-1"> </p>'), tt = e.from_html('<div class="mt-3"><div class="flex items-center gap-2 mb-1"><span class="text-xs font-medium">Response</span> <span> </span> <span class="text-xs text-base-content/40"> </span></div> <pre class="text-xs font-mono bg-base-200 rounded p-2 overflow-auto max-h-40"> </pre> <!> <!></div>'), st = e.from_html('<div class="flex-1 flex flex-col"><div class="border-b border-base-300 px-4 py-2 flex items-center justify-between bg-base-100"><div class="flex items-center gap-3"><h2 class="font-semibold"> </h2> <span class="badge badge-outline badge-sm font-mono"> </span> <label class="label cursor-pointer gap-1"><span class="label-text text-xs"> </span> <input type="checkbox" class="toggle toggle-xs toggle-success"/></label></div> <div class="flex gap-2"><button class="btn btn-ghost btn-sm text-error"><!></button> <button class="btn btn-primary btn-sm gap-1"><!> Save</button></div></div> <div class="flex flex-1 overflow-hidden"><div class="flex-1 flex flex-col"><textarea class="flex-1 font-mono text-sm p-4 resize-none bg-base-900 text-base-content border-0 outline-none" style="background: #1e1e2e; color: #cdd6f4;" spellcheck="false"></textarea></div> <div class="w-72 border-l border-base-300 flex flex-col bg-base-100"><div class="p-3 border-b border-base-300"><p class="font-medium text-sm">Test Invoke</p></div> <div class="p-3 flex-1 flex flex-col"><label class="label" for="invoke-body"><span class="label-text text-xs">Request body (JSON)</span></label> <textarea id="invoke-body" class="textarea textarea-sm font-mono flex-1 resize-none text-xs"></textarea> <button class="btn btn-primary btn-sm mt-3 gap-1 w-full"><!> Run</button> <!></div></div></div></div>'), at = e.from_html('<div class="flex-1 flex items-center justify-center text-base-content/40"><div class="text-center"><!> <p>Select a function or create one to get started</p> <button class="btn btn-primary btn-sm mt-4"><!> New Function</button></div></div>'), nt = e.from_html('<span class="loading loading-spinner loading-sm"></span>'), it = e.from_html('<dialog class="modal modal-open"><div class="modal-box"><h3 class="font-bold text-lg mb-4">New Edge Function</h3> <div class="space-y-3"><div class="form-control"><label class="label" for="fn-name"><span class="label-text">Name (URL-safe)</span></label> <input id="fn-name" type="text" placeholder="my-function" class="input font-mono"/> <p class="label"><span class="label-text-alt text-xs"> </span></p></div> <div class="form-control"><label class="label" for="fn-display-name"><span class="label-text">Display name</span></label> <input id="fn-display-name" type="text" placeholder="My Function" class="input"/></div> <div class="form-control"><label class="label" for="fn-http-method"><span class="label-text">HTTP method</span></label> <select id="fn-http-method" class="select"><option>GET</option><option>POST</option><option>PUT</option><option>PATCH</option><option>DELETE</option><option>ANY</option></select></div></div> <div class="modal-action"><button class="btn btn-ghost">Cancel</button> <button class="btn btn-primary"><!> Create</button></div></div> <button class="modal-backdrop"></button></dialog>'), lt = e.from_html('<div class="flex h-[calc(100vh-4rem)]"><div class="w-60 border-r border-base-300 flex flex-col bg-base-100"><div class="p-3 border-b border-base-300 flex items-center justify-between"><span class="font-semibold text-sm">Edge Functions</span> <button class="btn btn-ghost btn-xs"><!></button></div> <div class="flex-1 overflow-y-auto"><!></div></div> <!></div> <!>', 1);
function ot(c, t) {
  e.push(t, !0);
  const o = window.__ZVELTIO_ENGINE_URL__ || "";
  let r = e.state(e.proxy([])), d = e.state(!0), n = e.state(null), i = e.state(!1), v = e.state(!1), $ = e.state(!1), j = e.state("{}"), u = e.state(null), x = e.state(!1), z = e.state(!1), f = e.state(e.proxy({
    name: "",
    display_name: "",
    description: "",
    http_method: "POST"
  }));
  const U = `// Edge function — runs inside the Zveltio engine
export default async function handler(ctx) {
 const body = await ctx.request.json().catch(() => ({}));
 return Response.json({ message: "Hello from edge!", input: body });
}
`;
  We(async () => {
    await S();
  });
  async function S() {
    e.set(d, !0);
    try {
      const a = await (await fetch(`${o}/api/edge-functions`, { credentials: "include" })).json();
      e.set(r, a.functions || [], !0), e.get(r).length > 0 && !e.get(n) && await M(e.get(r)[0]);
    } finally {
      e.set(d, !1);
    }
  }
  async function M(s) {
    const g = await (await fetch(`${o}/api/edge-functions/${s.id}`, { credentials: "include" })).json();
    e.set(n, g.function, !0), e.set(u, null);
  }
  async function V() {
    if (e.get(n)) {
      e.set(i, !0);
      try {
        await fetch(`${o}/api/edge-functions/${e.get(n).id}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: e.get(n).code })
        }), e.set(v, !0), setTimeout(() => e.set(v, !1), 2e3);
      } finally {
        e.set(i, !1);
      }
    }
  }
  async function J() {
    if (e.get(n)) {
      e.set($, !0), e.set(u, null);
      try {
        const a = await (await fetch(`${o}/api/edge-functions/${e.get(n).id}/invoke`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: e.get(j)
        })).json();
        e.set(u, a.result, !0);
      } finally {
        e.set($, !1);
      }
    }
  }
  async function ne() {
    if (!(!e.get(f).name || !e.get(f).display_name)) {
      e.set(z, !0);
      try {
        const a = await (await fetch(`${o}/api/edge-functions`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...e.get(f), code: U })
        })).json();
        e.set(x, !1), e.set(
          f,
          {
            name: "",
            display_name: "",
            description: "",
            http_method: "POST"
          },
          !0
        ), await S(), await M(a.function);
      } finally {
        e.set(z, !1);
      }
    }
  }
  async function ue(s) {
    confirm("Delete this function?") && (await fetch(`${o}/api/edge-functions/${s}`, { method: "DELETE", credentials: "include" }), e.set(n, null), await S());
  }
  async function fe(s) {
    var a;
    await fetch(`${o}/api/edge-functions/${s.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !s.is_active })
    }), await S(), ((a = e.get(n)) == null ? void 0 : a.id) === s.id && (e.get(n).is_active = !s.is_active);
  }
  var ie = lt(), Z = e.first_child(ie), q = e.child(Z), G = e.child(q), B = e.sibling(e.child(G), 2), _e = e.child(B);
  ge(_e, { size: 14 }), e.reset(B), e.reset(G);
  var le = e.sibling(G, 2), be = e.child(le);
  {
    var he = (s) => {
      var a = qe();
      e.append(s, a);
    }, me = (s) => {
      var a = Ge(), g = e.child(a);
      ve(g, { size: 32, class: "mx-auto mb-2 opacity-30" }), e.next(), e.reset(a), e.append(s, a);
    }, xe = (s) => {
      var a = e.comment(), g = e.first_child(a);
      e.each(g, 17, () => e.get(r), e.index, (b, p) => {
        var _ = Be(), y = e.child(_), P = e.child(y), F = e.child(P, !0);
        e.reset(P);
        var h = e.sibling(P, 2), O = e.child(h, !0);
        e.reset(h), e.reset(y);
        var N = e.sibling(y, 2), A = e.child(N, !0);
        e.reset(N), e.reset(_), e.template_effect(() => {
          var w;
          e.set_class(_, 1, `w-full text-left px-3 py-2.5 hover:bg-base-200 transition-colors ${((w = e.get(n)) == null ? void 0 : w.id) === e.get(p).id ? "bg-primary/10 border-r-2 border-primary" : ""}`), e.set_text(F, e.get(p).display_name), e.set_class(h, 1, `badge badge-xs ${e.get(p).is_active ? "badge-success" : "badge-ghost"}`), e.set_text(O, e.get(p).http_method), e.set_text(A, e.get(p).path);
        }), e.delegated("click", _, () => M(e.get(p))), e.append(b, _);
      }), e.append(s, a);
    };
    e.if(be, (s) => {
      e.get(d) ? s(he) : e.get(r).length === 0 ? s(me, 1) : s(xe, -1);
    });
  }
  e.reset(le), e.reset(q);
  var ye = e.sibling(q, 2);
  {
    var we = (s) => {
      var a = st(), g = e.child(a), b = e.child(g), p = e.child(b), _ = e.child(p, !0);
      e.reset(p);
      var y = e.sibling(p, 2), P = e.child(y, !0);
      e.reset(y);
      var F = e.sibling(y, 2), h = e.child(F), O = e.child(h, !0);
      e.reset(h);
      var N = e.sibling(h, 2);
      e.remove_input_defaults(N), e.reset(F), e.reset(b);
      var A = e.sibling(b, 2), w = e.child(A), L = e.child(w);
      Ze(L, { size: 14 }), e.reset(w);
      var T = e.sibling(w, 2), Y = e.child(T);
      {
        var K = (l) => {
          var C = Ye();
          e.append(l, C);
        }, Q = (l) => {
          Ue(l, { size: 14 });
        }, m = (l) => {
          Je(l, { size: 14 });
        };
        e.if(Y, (l) => {
          e.get(i) ? l(K) : e.get(v) ? l(Q, 1) : l(m, -1);
        });
      }
      e.next(), e.reset(T), e.reset(A), e.reset(g);
      var W = e.sibling(g, 2), X = e.child(W), oe = e.child(X);
      e.remove_textarea_child(oe), e.reset(X);
      var re = e.sibling(X, 2), de = e.sibling(e.child(re), 2), D = e.sibling(e.child(de), 2);
      e.remove_textarea_child(D), e.set_attribute(D, "placeholder", "{}");
      var R = e.sibling(D, 2), Te = e.child(R);
      {
        var Pe = (l) => {
          var C = Ke();
          e.append(l, C);
        }, Ce = (l) => {
          Ve(l, { size: 12 });
        };
        e.if(Te, (l) => {
          e.get($) ? l(Pe) : l(Ce, -1);
        });
      }
      e.next(), e.reset(R);
      var Ee = e.sibling(R, 2);
      {
        var je = (l) => {
          var C = tt(), ee = e.child(C), I = e.sibling(e.child(ee), 2), ze = e.child(I, !0);
          e.reset(I);
          var ce = e.sibling(I, 2), Se = e.child(ce);
          e.reset(ce), e.reset(ee);
          var te = e.sibling(ee, 2), Me = e.child(te, !0);
          e.reset(te);
          var pe = e.sibling(te, 2);
          {
            var Fe = (E) => {
              var k = Xe(), se = e.sibling(e.child(k), 2);
              e.each(se, 17, () => e.get(u).logs, e.index, (He, Re) => {
                var ae = Qe(), Le = e.child(ae, !0);
                e.reset(ae), e.template_effect(() => e.set_text(Le, e.get(Re))), e.append(He, ae);
              }), e.reset(k), e.append(E, k);
            };
            e.if(pe, (E) => {
              var k;
              (k = e.get(u).logs) != null && k.length && E(Fe);
            });
          }
          var Oe = e.sibling(pe, 2);
          {
            var Ae = (E) => {
              var k = et(), se = e.child(k, !0);
              e.reset(k), e.template_effect(() => e.set_text(se, e.get(u).error)), e.append(E, k);
            };
            e.if(Oe, (E) => {
              e.get(u).error && E(Ae);
            });
          }
          e.reset(C), e.template_effect(() => {
            e.set_class(I, 1, `badge badge-xs ${e.get(u).status < 400 ? "badge-success" : "badge-error"}`), e.set_text(ze, e.get(u).status), e.set_text(Se, `${e.get(u).duration_ms ?? ""}ms`), e.set_text(Me, e.get(u).body);
          }), e.append(l, C);
        };
        e.if(Ee, (l) => {
          e.get(u) && l(je);
        });
      }
      e.reset(de), e.reset(re), e.reset(W), e.reset(a), e.template_effect(() => {
        e.set_text(_, e.get(n).display_name), e.set_text(P, e.get(n).path), e.set_text(O, e.get(n).is_active ? "Active" : "Inactive"), e.set_checked(N, e.get(n).is_active), T.disabled = e.get(i), R.disabled = e.get($);
      }), e.delegated("change", N, () => fe(e.get(n))), e.delegated("click", w, () => ue(e.get(n).id)), e.delegated("click", T, V), e.bind_value(oe, () => e.get(n).code, (l) => e.get(n).code = l), e.bind_value(D, () => e.get(j), (l) => e.set(j, l)), e.delegated("click", R, J), e.append(s, a);
    }, ke = (s) => {
      var a = at(), g = e.child(a), b = e.child(g);
      ve(b, { size: 64, class: "mx-auto mb-4 opacity-20" });
      var p = e.sibling(b, 4), _ = e.child(p);
      ge(_, { size: 14 }), e.next(), e.reset(p), e.reset(g), e.reset(a), e.delegated("click", p, () => e.set(x, !0)), e.append(s, a);
    };
    e.if(ye, (s) => {
      e.get(n) ? s(we) : e.get(d) || s(ke, 1);
    });
  }
  e.reset(Z);
  var $e = e.sibling(Z, 2);
  {
    var Ne = (s) => {
      var a = it(), g = e.child(a), b = e.sibling(e.child(g), 2), p = e.child(b), _ = e.sibling(e.child(p), 2);
      e.remove_input_defaults(_);
      var y = e.sibling(_, 2), P = e.child(y), F = e.child(P);
      e.reset(P), e.reset(y), e.reset(p);
      var h = e.sibling(p, 2), O = e.sibling(e.child(h), 2);
      e.remove_input_defaults(O), e.reset(h);
      var N = e.sibling(h, 2), A = e.sibling(e.child(N), 2);
      e.reset(N), e.reset(b);
      var w = e.sibling(b, 2), L = e.child(w), T = e.sibling(L, 2), Y = e.child(T);
      {
        var K = (m) => {
          var W = nt();
          e.append(m, W);
        };
        e.if(Y, (m) => {
          e.get(z) && m(K);
        });
      }
      e.next(), e.reset(T), e.reset(w), e.reset(g);
      var Q = e.sibling(g, 2);
      e.reset(a), e.template_effect(() => {
        e.set_text(F, `Will be mounted at /api/fn/${(e.get(f).name || "...") ?? ""}`), T.disabled = e.get(z);
      }), e.bind_value(_, () => e.get(f).name, (m) => e.get(f).name = m), e.bind_value(O, () => e.get(f).display_name, (m) => e.get(f).display_name = m), e.bind_select_value(A, () => e.get(f).http_method, (m) => e.get(f).http_method = m), e.delegated("click", L, () => e.set(x, !1)), e.delegated("click", T, ne), e.delegated("click", Q, () => e.set(x, !1)), e.append(s, a);
    };
    e.if($e, (s) => {
      e.get(x) && s(Ne);
    });
  }
  e.delegated("click", B, () => e.set(x, !0)), e.append(c, ie), e.pop();
}
e.delegate(["click", "change"]);
function rt() {
  const c = window.__zveltio;
  c && c.registerRoute({
    path: "edge-functions",
    component: ot,
    label: "Edge Functions",
    icon: "Zap",
    category: "developer"
  });
}
rt();
export {
  rt as default
};
