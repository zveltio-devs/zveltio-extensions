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
function J(d, a) {
  e.push(a, !0);
  const u = e.prop(a, "color", 3, "currentColor"), n = e.prop(a, "size", 3, 24), l = e.prop(a, "strokeWidth", 3, 2), c = e.prop(a, "absoluteStrokeWidth", 3, !1), s = e.prop(a, "iconNode", 19, () => []), o = e.rest_props(a, [
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
  var r = ce();
  e.attribute_effect(
    r,
    (k) => ({
      ...de,
      ...o,
      width: n(),
      height: n(),
      stroke: u(),
      "stroke-width": k,
      class: [
        "lucide-icon lucide",
        a.name && `lucide-${a.name}`,
        a.class
      ]
    }),
    [
      () => c() ? Number(l()) * 24 / Number(n()) : l()
    ]
  );
  var f = e.child(r);
  e.each(f, 17, s, e.index, (k, H) => {
    var P = e.derived(() => e.to_array(e.get(H), 2));
    let S = () => e.get(P)[0], N = () => e.get(P)[1];
    var _ = e.comment(), $ = e.first_child(_);
    e.element($, S, !0, (W, z) => {
      e.attribute_effect(W, () => ({ ...N() }));
    }), e.append(k, _);
  });
  var C = e.sibling(f);
  e.snippet(C, () => a.children ?? e.noop), e.reset(r), e.append(d, r), e.pop();
}
function ve(d, a) {
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
  let u = e.rest_props(a, ["$$slots", "$$events", "$$legacy"]);
  const n = [
    [
      "path",
      {
        d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"
      }
    ],
    ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }],
    ["path", { d: "M9 13v-1h6v1" }],
    ["path", { d: "M12 12v6" }],
    ["path", { d: "M11 18h2" }]
  ];
  J(d, e.spread_props({ name: "file-type" }, () => u, {
    get iconNode() {
      return n;
    },
    children: (l, c) => {
      var s = e.comment(), o = e.first_child(s);
      e.snippet(o, () => a.children ?? e.noop), e.append(l, s);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function pe(d, a) {
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
  let u = e.rest_props(a, ["$$slots", "$$events", "$$legacy"]);
  const n = [["path", { d: "M5 12h14" }], ["path", { d: "M12 5v14" }]];
  J(d, e.spread_props({ name: "plus" }, () => u, {
    get iconNode() {
      return n;
    },
    children: (l, c) => {
      var s = e.comment(), o = e.first_child(s);
      e.snippet(o, () => a.children ?? e.noop), e.append(l, s);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function he(d, a) {
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
  let u = e.rest_props(a, ["$$slots", "$$events", "$$legacy"]);
  const n = [
    ["path", { d: "M18 6 6 18" }],
    ["path", { d: "m6 6 12 12" }]
  ];
  J(d, e.spread_props({ name: "x" }, () => u, {
    get iconNode() {
      return n;
    },
    children: (l, c) => {
      var s = e.comment(), o = e.first_child(s);
      e.snippet(o, () => a.children ?? e.noop), e.append(l, s);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
var ue = e.from_html('<div class="alert alert-error"> </div>'), be = e.from_html('<tr><td colspan="4" class="text-center py-6 text-base-content/60">No templates.</td></tr>'), me = e.from_html('<tr><td> </td><td><span class="badge badge-ghost badge-sm"> </span></td><td class="max-w-xs truncate"> </td><td><button class="btn btn-ghost btn-xs">Edit</button></td></tr>'), ge = e.from_html('<div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><div class="bg-base-100 rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto"><div class="flex items-center justify-between mb-4"><h2 class="text-xl font-semibold"> </h2><button class="btn btn-ghost btn-sm btn-square"><!></button></div> <div class="space-y-3"><div class="grid grid-cols-2 gap-3"><div><label class="label label-text">Name</label><input class="input input-bordered w-full"/></div> <div><label class="label label-text">Format</label><select class="select select-bordered w-full"><option>HTML (PDF)</option><option>DOCX</option><option>Markdown</option></select></div></div> <div><label class="label label-text">Description</label><input class="input input-bordered w-full"/></div> <div><label class="label label-text">Body — use <code class="text-xs"></code> for substitution</label> <textarea class="textarea textarea-bordered w-full font-mono text-xs" rows="14"></textarea></div></div> <div class="flex justify-end gap-2 mt-4"><button class="btn btn-ghost">Cancel</button><button class="btn btn-primary"> </button></div></div></div>'), fe = e.from_html('<div class="p-6 space-y-4"><header class="flex items-center justify-between"><h1 class="text-2xl font-semibold flex items-center gap-2"><!> Document Templates</h1> <button class="btn btn-primary btn-sm gap-2"><!> New template</button></header> <!> <div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Name</th><th>Format</th><th>Description</th><th></th></tr></thead><tbody><!></tbody></table></div></div> <!>', 1);
function _e(d, a) {
  var L;
  e.push(a, !0);
  const u = ((L = window.__zveltio) == null ? void 0 : L.engineUrl) ?? "";
  let n = e.state(e.proxy([])), l = e.state(""), c = e.state(!1), s = e.state(!1), o = e.state(null), r = e.state(e.proxy({
    name: "",
    description: "",
    format: "html",
    body: `<h1>{{title}}</h1>
<p>Hello {{client_name}}</p>`
  }));
  async function f(t, i) {
    const v = await fetch(`${u}${t}`, { credentials: "include", ...i }), p = await v.json().catch(() => ({}));
    if (!v.ok) throw new Error(p.error || `HTTP ${v.status}`);
    return p;
  }
  async function C() {
    try {
      const t = await f("/api/document-templates");
      e.set(n, t.data ?? [], !0);
    } catch (t) {
      e.set(l, t.message, !0);
    }
  }
  function k() {
    e.set(o, null), e.set(
      r,
      {
        name: "",
        description: "",
        format: "html",
        body: `<h1>{{title}}</h1>
<p>Hello {{client_name}}</p>`
      },
      !0
    ), e.set(c, !0);
  }
  function H(t) {
    e.set(o, t, !0), e.set(
      r,
      {
        name: t.name,
        description: t.description ?? "",
        format: t.format,
        body: t.body
      },
      !0
    ), e.set(c, !0);
  }
  async function P() {
    e.set(s, !0), e.set(l, "");
    try {
      e.get(o) ? await f(`/api/document-templates/${e.get(o).id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(e.get(r))
      }) : await f("/api/document-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(e.get(r))
      }), e.set(c, !1), await C();
    } catch (t) {
      e.set(l, t.message, !0);
    } finally {
      e.set(s, !1);
    }
  }
  oe(C);
  var S = fe(), N = e.first_child(S), _ = e.child(N), $ = e.child(_), W = e.child($);
  ve(W, { class: "h-6 w-6" }), e.next(), e.reset($);
  var z = e.sibling($, 2), Y = e.child(z);
  pe(Y, { class: "h-4 w-4" }), e.next(), e.reset(z), e.reset(_);
  var U = e.sibling(_, 2);
  {
    var ee = (t) => {
      var i = ue(), v = e.child(i, !0);
      e.reset(i), e.template_effect(() => e.set_text(v, e.get(l))), e.append(t, i);
    };
    e.if(U, (t) => {
      e.get(l) && t(ee);
    });
  }
  var X = e.sibling(U, 2), q = e.child(X), I = e.sibling(e.child(q)), te = e.child(I);
  {
    var ae = (t) => {
      var i = be();
      e.append(t, i);
    }, re = (t) => {
      var i = e.comment(), v = e.first_child(i);
      e.each(v, 17, () => e.get(n), (p) => p.id, (p, b) => {
        var M = me(), m = e.child(M), E = e.child(m, !0);
        e.reset(m);
        var g = e.sibling(m), x = e.child(g), T = e.child(x, !0);
        e.reset(x), e.reset(g);
        var y = e.sibling(g), D = e.child(y, !0);
        e.reset(y);
        var w = e.sibling(y), j = e.child(w);
        e.reset(w), e.reset(M), e.template_effect(() => {
          e.set_text(E, e.get(b).name), e.set_text(T, e.get(b).format), e.set_text(D, e.get(b).description ?? "—");
        }), e.delegated("click", j, () => H(e.get(b))), e.append(p, M);
      }), e.append(t, i);
    };
    e.if(te, (t) => {
      e.get(n).length === 0 ? t(ae) : t(re, -1);
    });
  }
  e.reset(I), e.reset(q), e.reset(X), e.reset(N);
  var se = e.sibling(N, 2);
  {
    var ie = (t) => {
      var i = ge(), v = e.child(i), p = e.child(v), b = e.child(p), M = e.child(b);
      e.reset(b);
      var m = e.sibling(b), E = e.child(m);
      he(E, { class: "h-4 w-4" }), e.reset(m), e.reset(p);
      var g = e.sibling(p, 2), x = e.child(g), T = e.child(x), y = e.sibling(e.child(T));
      e.remove_input_defaults(y), e.reset(T);
      var D = e.sibling(T, 2), w = e.sibling(e.child(D)), j = e.child(w);
      j.value = j.__value = "html";
      var O = e.sibling(j);
      O.value = O.__value = "docx";
      var R = e.sibling(O);
      R.value = R.__value = "markdown", e.reset(w), e.reset(D), e.reset(x);
      var A = e.sibling(x, 2), V = e.sibling(e.child(A));
      e.remove_input_defaults(V), e.reset(A);
      var Z = e.sibling(A, 2), B = e.child(Z), le = e.sibling(e.child(B));
      le.textContent = "{{var_name}}", e.next(), e.reset(B);
      var G = e.sibling(B, 2);
      e.remove_textarea_child(G), e.reset(Z), e.reset(g);
      var K = e.sibling(g, 2), Q = e.child(K), F = e.sibling(Q), ne = e.child(F, !0);
      e.reset(F), e.reset(K), e.reset(v), e.reset(i), e.template_effect(() => {
        e.set_text(M, `${e.get(o) ? "Edit" : "New"} template`), F.disabled = e.get(s) || !e.get(r).name, e.set_text(ne, e.get(s) ? "Saving…" : "Save");
      }), e.delegated("click", i, (h) => h.target === h.currentTarget && e.set(c, !1)), e.delegated("click", m, () => e.set(c, !1)), e.bind_value(y, () => e.get(r).name, (h) => e.get(r).name = h), e.bind_select_value(w, () => e.get(r).format, (h) => e.get(r).format = h), e.bind_value(V, () => e.get(r).description, (h) => e.get(r).description = h), e.bind_value(G, () => e.get(r).body, (h) => e.get(r).body = h), e.delegated("click", Q, () => e.set(c, !1)), e.delegated("click", F, P), e.append(t, i);
    };
    e.if(se, (t) => {
      e.get(c) && t(ie);
    });
  }
  e.delegated("click", z, k), e.append(d, S), e.pop();
}
e.delegate(["click"]);
function xe() {
  const d = window.__zveltio;
  d && d.registerRoute({
    path: "document-templates",
    component: _e,
    label: "Document Templates",
    icon: "FileType",
    category: "content"
  });
}
xe();
export {
  xe as default
};
