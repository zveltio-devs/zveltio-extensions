import "svelte/internal/disclose-version";
import * as t from "svelte/internal/client";
import { onMount as O } from "svelte";
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
const V = {
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
var q = t.from_svg("<svg><!><!></svg>");
function H(i, e) {
  t.push(e, !0);
  const d = t.prop(e, "color", 3, "currentColor"), o = t.prop(e, "size", 3, 24), s = t.prop(e, "strokeWidth", 3, 2), l = t.prop(e, "absoluteStrokeWidth", 3, !1), n = t.prop(e, "iconNode", 19, () => []), c = t.rest_props(e, [
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
  var u = q();
  t.attribute_effect(
    u,
    (f) => ({
      ...V,
      ...c,
      width: o(),
      height: o(),
      stroke: d(),
      "stroke-width": f,
      class: [
        "lucide-icon lucide",
        e.name && `lucide-${e.name}`,
        e.class
      ]
    }),
    [
      () => l() ? Number(s()) * 24 / Number(o()) : s()
    ]
  );
  var v = t.child(u);
  t.each(v, 17, n, t.index, (f, N) => {
    var m = t.derived(() => t.to_array(t.get(N), 2));
    let z = () => t.get(m)[0], x = () => t.get(m)[1];
    var b = t.comment(), w = t.first_child(b);
    t.element(w, z, !0, (P, S) => {
      t.attribute_effect(P, () => ({ ...x() }));
    }), t.append(f, b);
  });
  var _ = t.sibling(v);
  t.snippet(_, () => e.children ?? t.noop), t.reset(u), t.append(i, u), t.pop();
}
function G(i, e) {
  t.push(e, !0);
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
  let d = t.rest_props(e, ["$$slots", "$$events", "$$legacy"]);
  const o = [
    [
      "path",
      { d: "M12.5 22H18a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v9.5" }
    ],
    ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }],
    [
      "path",
      {
        d: "M13.378 15.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"
      }
    ]
  ];
  H(i, t.spread_props({ name: "file-pen" }, () => d, {
    get iconNode() {
      return o;
    },
    children: (s, l) => {
      var n = t.comment(), c = t.first_child(n);
      t.snippet(c, () => e.children ?? t.noop), t.append(s, n);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function J(i, e) {
  t.push(e, !0);
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
  let d = t.rest_props(e, ["$$slots", "$$events", "$$legacy"]);
  const o = [
    [
      "path",
      {
        d: "M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"
      }
    ],
    ["path", { d: "m21.854 2.147-10.94 10.939" }]
  ];
  H(i, t.spread_props({ name: "send" }, () => d, {
    get iconNode() {
      return o;
    },
    children: (s, l) => {
      var n = t.comment(), c = t.first_child(n);
      t.snippet(c, () => e.children ?? t.noop), t.append(s, n);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
var K = t.from_html('<div class="alert alert-error"> </div>'), Q = t.from_html('<tr><td colspan="5" class="text-center py-6 text-base-content/60">No pending drafts.</td></tr>'), X = t.from_html('<tr><td><span class="badge badge-ghost"> </span></td><td class="font-mono text-xs"> </td><td> </td><td> </td><td><button class="btn btn-success btn-xs gap-1"><!> Publish</button> <button class="btn btn-ghost btn-xs">Discard</button></td></tr>'), Y = t.from_html('<div class="p-6 space-y-4"><header><h1 class="text-2xl font-semibold flex items-center gap-2"><!> Drafts</h1></header> <!> <p class="text-sm text-base-content/70">Pending drafts across all collections that have draft/publish enabled. Publish promotes the draft to the live record.</p> <div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Collection</th><th>Record</th><th>Author</th><th>Updated</th><th></th></tr></thead><tbody><!></tbody></table></div></div>');
function Z(i, e) {
  var T;
  t.push(e, !0);
  const d = ((T = window.__zveltio) == null ? void 0 : T.engineUrl) ?? "";
  let o = t.state(t.proxy([])), s = t.state("");
  async function l(r, a) {
    const h = await fetch(`${d}${r}`, { credentials: "include", ...a }), g = await h.json().catch(() => ({}));
    if (!h.ok) throw new Error(g.error || `HTTP ${h.status}`);
    return g;
  }
  async function n() {
    try {
      const r = await l("/api/drafts");
      t.set(o, r.data ?? [], !0);
    } catch (r) {
      t.set(s, r.message, !0);
    }
  }
  async function c(r) {
    try {
      await l(`/api/drafts/${r}/publish`, { method: "POST" }), await n();
    } catch (a) {
      t.set(s, a.message, !0);
    }
  }
  async function u(r) {
    if (confirm("Discard draft?"))
      try {
        await l(`/api/drafts/${r}`, { method: "DELETE" }), await n();
      } catch (a) {
        t.set(s, a.message, !0);
      }
  }
  O(n);
  var v = Y(), _ = t.child(v), f = t.child(_), N = t.child(f);
  G(N, { class: "h-6 w-6" }), t.next(), t.reset(f), t.reset(_);
  var m = t.sibling(_, 2);
  {
    var z = (r) => {
      var a = K(), h = t.child(a, !0);
      t.reset(a), t.template_effect(() => t.set_text(h, t.get(s))), t.append(r, a);
    };
    t.if(m, (r) => {
      t.get(s) && r(z);
    });
  }
  var x = t.sibling(m, 4), b = t.child(x), w = t.sibling(t.child(b)), P = t.child(w);
  {
    var S = (r) => {
      var a = Q();
      t.append(r, a);
    }, U = (r) => {
      var a = t.comment(), h = t.first_child(a);
      t.each(h, 17, () => t.get(o), (g) => g.id, (g, p) => {
        var $ = X(), W = t.child($), j = t.child(W), A = t.child(j, !0);
        t.reset(j), t.reset(W);
        var D = t.sibling(W), F = t.child(D, !0);
        t.reset(D);
        var E = t.sibling(D), R = t.child(E, !0);
        t.reset(E);
        var M = t.sibling(E), B = t.child(M, !0);
        t.reset(M);
        var C = t.sibling(M), y = t.child(C), I = t.child(y);
        J(I, { class: "h-3 w-3" }), t.next(), t.reset(y);
        var L = t.sibling(y, 2);
        t.reset(C), t.reset($), t.template_effect(
          (k) => {
            t.set_text(A, t.get(p).collection), t.set_text(F, t.get(p).record_id), t.set_text(R, t.get(p).author_name ?? t.get(p).author_id), t.set_text(B, k);
          },
          [() => {
            var k;
            return (k = t.get(p).updated_at) == null ? void 0 : k.slice(0, 16).replace("T", " ");
          }]
        ), t.delegated("click", y, () => c(t.get(p).id)), t.delegated("click", L, () => u(t.get(p).id)), t.append(g, $);
      }), t.append(r, a);
    };
    t.if(P, (r) => {
      t.get(o).length === 0 ? r(S) : r(U, -1);
    });
  }
  t.reset(w), t.reset(b), t.reset(x), t.reset(v), t.append(i, v), t.pop();
}
t.delegate(["click"]);
function tt() {
  const i = window.__zveltio;
  i && i.registerRoute({
    path: "drafts",
    component: Z,
    label: "Drafts",
    icon: "FileEdit",
    category: "content"
  });
}
tt();
export {
  tt as default
};
