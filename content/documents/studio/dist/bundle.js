import "svelte/internal/disclose-version";
import * as e from "svelte/internal/client";
import { onMount as oe } from "svelte";
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
const de = {
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
var ce = e.from_svg("<svg><!><!></svg>");
function J(i, a) {
  e.push(a, !0);
  const p = e.prop(a, "color", 3, "currentColor"), l = e.prop(a, "size", 3, 24), c = e.prop(a, "strokeWidth", 3, 2), v = e.prop(a, "absoluteStrokeWidth", 3, !1), r = e.prop(a, "iconNode", 19, () => []), n = e.rest_props(a, [
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
  var m = ce();
  e.attribute_effect(
    m,
    (g) => ({
      ...de,
      ...n,
      width: l(),
      height: l(),
      stroke: p(),
      "stroke-width": g,
      class: [
        "lucide-icon lucide",
        a.name && `lucide-${a.name}`,
        a.class
      ]
    }),
    [
      () => v() ? Number(c()) * 24 / Number(l()) : c()
    ]
  );
  var o = e.child(m);
  e.each(o, 17, r, e.index, (g, q) => {
    var U = e.derived(() => e.to_array(e.get(q), 2));
    let E = () => e.get(U)[0], C = () => e.get(U)[1];
    var x = e.comment(), S = e.first_child(x);
    e.element(S, E, !0, (j, R) => {
      e.attribute_effect(j, () => ({ ...C() }));
    }), e.append(g, x);
  });
  var N = e.sibling(o);
  e.snippet(N, () => a.children ?? e.noop), e.reset(m), e.append(i, m), e.pop();
}
function pe(i, a) {
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
  let p = e.rest_props(a, ["$$slots", "$$events", "$$legacy"]);
  const l = [
    ["path", { d: "M12 15V3" }],
    ["path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }],
    ["path", { d: "m7 10 5 5 5-5" }]
  ];
  J(i, e.spread_props({ name: "download" }, () => p, {
    get iconNode() {
      return l;
    },
    children: (c, v) => {
      var r = e.comment(), n = e.first_child(r);
      e.snippet(n, () => a.children ?? e.noop), e.append(c, r);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function ve(i, a) {
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
  let p = e.rest_props(a, ["$$slots", "$$events", "$$legacy"]);
  const l = [
    [
      "path",
      {
        d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"
      }
    ],
    ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }],
    ["path", { d: "M10 9H8" }],
    ["path", { d: "M16 13H8" }],
    ["path", { d: "M16 17H8" }]
  ];
  J(i, e.spread_props({ name: "file-text" }, () => p, {
    get iconNode() {
      return l;
    },
    children: (c, v) => {
      var r = e.comment(), n = e.first_child(r);
      e.snippet(n, () => a.children ?? e.noop), e.append(c, r);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function he(i, a) {
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
  let p = e.rest_props(a, ["$$slots", "$$events", "$$legacy"]);
  const l = [["path", { d: "M5 12h14" }], ["path", { d: "M12 5v14" }]];
  J(i, e.spread_props({ name: "plus" }, () => p, {
    get iconNode() {
      return l;
    },
    children: (c, v) => {
      var r = e.comment(), n = e.first_child(r);
      e.snippet(n, () => a.children ?? e.noop), e.append(c, r);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function ue(i, a) {
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
  let p = e.rest_props(a, ["$$slots", "$$events", "$$legacy"]);
  const l = [
    ["path", { d: "M18 6 6 18" }],
    ["path", { d: "m6 6 12 12" }]
  ];
  J(i, e.spread_props({ name: "x" }, () => p, {
    get iconNode() {
      return l;
    },
    children: (c, v) => {
      var r = e.comment(), n = e.first_child(r);
      e.snippet(n, () => a.children ?? e.noop), e.append(c, r);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
var me = e.from_html('<div class="alert alert-error"> </div>'), be = e.from_html('<tr><td colspan="5" class="text-center py-6 text-base-content/60">No documents yet. Use "Generate" with a template.</td></tr>'), ge = e.from_html('<tr><td> </td><td> </td><td> </td><td><span class="badge badge-ghost badge-sm"> </span></td><td><a class="btn btn-ghost btn-xs gap-1" target="_blank"><!></a></td></tr>'), _e = e.from_html("<option> </option>"), fe = e.from_html('<div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><div class="bg-base-100 rounded-xl p-6 w-full max-w-md"><div class="flex items-center justify-between mb-4"><h2 class="text-xl font-semibold">Generate document</h2><button class="btn btn-ghost btn-sm btn-square"><!></button></div> <div class="space-y-3"><div><label class="label label-text">Template</label> <select class="select select-bordered w-full"><option>— Select template —</option><!></select></div> <div><label class="label label-text">Document name</label><input class="input input-bordered w-full"/></div> <div><label class="label label-text">Variables (JSON)</label><textarea class="textarea textarea-bordered w-full font-mono text-xs" rows="6"></textarea></div></div> <div class="flex justify-end gap-2 mt-4"><button class="btn btn-ghost">Cancel</button><button class="btn btn-primary"> </button></div></div></div>'), xe = e.from_html('<div class="p-6 space-y-4"><header class="flex items-center justify-between"><h1 class="text-2xl font-semibold flex items-center gap-2"><!> Documents</h1> <button class="btn btn-primary btn-sm gap-2"><!> Generate document</button></header> <!> <div class="join"><input class="input input-sm input-bordered join-item" placeholder="Search..."/> <button class="btn btn-sm join-item">Search</button></div> <div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Name</th><th>Template</th><th>Generated</th><th>Format</th><th></th></tr></thead><tbody><!></tbody></table></div></div> <!>', 1);
function we(i, a) {
  var K;
  e.push(a, !0);
  const p = ((K = window.__zveltio) == null ? void 0 : K.engineUrl) ?? "";
  let l = e.state(e.proxy([])), c = e.state(e.proxy([])), v = e.state(""), r = e.state(""), n = e.state(!1), m = e.state(!1), o = e.state(e.proxy({ template_id: "", name: "", variables: "{}" }));
  async function N(t, s) {
    const h = await fetch(`${p}${t}`, { credentials: "include", ...s }), u = await h.json().catch(() => ({}));
    if (!h.ok) throw new Error(u.error || `HTTP ${h.status}`);
    return u;
  }
  async function g() {
    try {
      const t = new URLSearchParams();
      e.get(r) && t.set("q", e.get(r));
      const s = await N(`/api/documents?${t}`);
      e.set(l, s.data ?? [], !0);
    } catch (t) {
      e.set(v, t.message, !0);
    }
  }
  async function q() {
    try {
      const t = await N("/api/document-templates");
      e.set(c, t.data ?? [], !0);
    } catch {
    }
  }
  async function U() {
    e.set(m, !0), e.set(v, "");
    try {
      let t = {};
      try {
        t = JSON.parse(e.get(o).variables);
      } catch {
        throw new Error("Invalid JSON in variables");
      }
      await N("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...e.get(o), variables: t })
      }), e.set(n, !1), e.set(o, { template_id: "", name: "", variables: "{}" }, !0), await g();
    } catch (t) {
      e.set(v, t.message, !0);
    } finally {
      e.set(m, !1);
    }
  }
  oe(() => {
    g(), q();
  });
  function E(t) {
    return `${p}/api/documents/${t}/download`;
  }
  var C = xe(), x = e.first_child(C), S = e.child(x), j = e.child(S), R = e.child(j);
  ve(R, { class: "h-6 w-6" }), e.next(), e.reset(j);
  var V = e.sibling(j, 2), Y = e.child(V);
  he(Y, { class: "h-4 w-4" }), e.next(), e.reset(V), e.reset(S);
  var B = e.sibling(S, 2);
  {
    var ee = (t) => {
      var s = me(), h = e.child(s, !0);
      e.reset(s), e.template_effect(() => e.set_text(h, e.get(v))), e.append(t, s);
    };
    e.if(B, (t) => {
      e.get(v) && t(ee);
    });
  }
  var A = e.sibling(B, 2), F = e.child(A);
  e.remove_input_defaults(F);
  var te = e.sibling(F, 2);
  e.reset(A);
  var L = e.sibling(A, 2), X = e.child(L), Z = e.sibling(e.child(X)), ae = e.child(Z);
  {
    var re = (t) => {
      var s = be();
      e.append(t, s);
    }, se = (t) => {
      var s = e.comment(), h = e.first_child(s);
      e.each(h, 17, () => e.get(l), (u) => u.id, (u, b) => {
        var M = ge(), _ = e.child(M), T = e.child(_, !0);
        e.reset(_);
        var f = e.sibling(_), P = e.child(f, !0);
        e.reset(f);
        var z = e.sibling(f), G = e.child(z, !0);
        e.reset(z);
        var w = e.sibling(z), H = e.child(w), W = e.child(H, !0);
        e.reset(H), e.reset(w);
        var D = e.sibling(w), y = e.child(D), k = e.child(y);
        pe(k, { class: "h-3 w-3" }), e.reset(y), e.reset(D), e.reset(M), e.template_effect(
          ($, d) => {
            e.set_text(T, e.get(b).name), e.set_text(P, e.get(b).template_name ?? "—"), e.set_text(G, $), e.set_text(W, e.get(b).format ?? "pdf"), e.set_attribute(y, "href", d);
          },
          [
            () => {
              var $;
              return ($ = e.get(b).created_at) == null ? void 0 : $.slice(0, 16).replace("T", " ");
            },
            () => E(e.get(b).id)
          ]
        ), e.append(u, M);
      }), e.append(t, s);
    };
    e.if(ae, (t) => {
      e.get(l).length === 0 ? t(re) : t(se, -1);
    });
  }
  e.reset(Z), e.reset(X), e.reset(L), e.reset(x);
  var ne = e.sibling(x, 2);
  {
    var le = (t) => {
      var s = fe(), h = e.child(s), u = e.child(h), b = e.sibling(e.child(u)), M = e.child(b);
      ue(M, { class: "h-4 w-4" }), e.reset(b), e.reset(u);
      var _ = e.sibling(u, 2), T = e.child(_), f = e.sibling(e.child(T), 2), P = e.child(f);
      P.value = P.__value = "";
      var z = e.sibling(P);
      e.each(z, 17, () => e.get(c), (d) => d.id, (d, I) => {
        var O = _e(), ie = e.child(O, !0);
        e.reset(O);
        var Q = {};
        e.template_effect(() => {
          e.set_text(ie, e.get(I).name), Q !== (Q = e.get(I).id) && (O.value = (O.__value = e.get(I).id) ?? "");
        }), e.append(d, O);
      }), e.reset(f), e.reset(T);
      var G = e.sibling(T, 2), w = e.sibling(e.child(G));
      e.remove_input_defaults(w), e.reset(G);
      var H = e.sibling(G, 2), W = e.sibling(e.child(H));
      e.remove_textarea_child(W), e.set_attribute(W, "placeholder", '{"client_name":"Acme","amount":1000}'), e.reset(H), e.reset(_);
      var D = e.sibling(_, 2), y = e.child(D), k = e.sibling(y), $ = e.child(k, !0);
      e.reset(k), e.reset(D), e.reset(h), e.reset(s), e.template_effect(() => {
        k.disabled = e.get(m) || !e.get(o).template_id || !e.get(o).name, e.set_text($, e.get(m) ? "Generating…" : "Generate");
      }), e.delegated("click", s, (d) => d.target === d.currentTarget && e.set(n, !1)), e.delegated("click", b, () => e.set(n, !1)), e.bind_select_value(f, () => e.get(o).template_id, (d) => e.get(o).template_id = d), e.bind_value(w, () => e.get(o).name, (d) => e.get(o).name = d), e.bind_value(W, () => e.get(o).variables, (d) => e.get(o).variables = d), e.delegated("click", y, () => e.set(n, !1)), e.delegated("click", k, U), e.append(t, s);
    };
    e.if(ne, (t) => {
      e.get(n) && t(le);
    });
  }
  e.delegated("click", V, () => e.set(n, !0)), e.delegated("keydown", F, (t) => t.key === "Enter" && g()), e.bind_value(F, () => e.get(r), (t) => e.set(r, t)), e.delegated("click", te, g), e.append(i, C), e.pop();
}
e.delegate(["click", "keydown"]);
function ye() {
  const i = window.__zveltio;
  i && i.registerRoute({
    path: "documents",
    component: we,
    label: "Documents",
    icon: "FileText",
    category: "content"
  });
}
ye();
export {
  ye as default
};
