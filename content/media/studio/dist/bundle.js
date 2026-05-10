import "svelte/internal/disclose-version";
import * as e from "svelte/internal/client";
import { onMount as Y } from "svelte";
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
const Z = {
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
var ee = e.from_svg("<svg><!><!></svg>");
function U(l, a) {
  e.push(a, !0);
  const d = e.prop(a, "color", 3, "currentColor"), n = e.prop(a, "size", 3, 24), s = e.prop(a, "strokeWidth", 3, 2), c = e.prop(a, "absoluteStrokeWidth", 3, !1), o = e.prop(a, "iconNode", 19, () => []), p = e.rest_props(a, [
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
  var h = ee();
  e.attribute_effect(
    h,
    (m) => ({
      ...Z,
      ...p,
      width: n(),
      height: n(),
      stroke: d(),
      "stroke-width": m,
      class: [
        "lucide-icon lucide",
        a.name && `lucide-${a.name}`,
        a.class
      ]
    }),
    [
      () => c() ? Number(s()) * 24 / Number(n()) : s()
    ]
  );
  var y = e.child(h);
  e.each(y, 17, o, e.index, (m, N) => {
    var f = e.derived(() => e.to_array(e.get(N), 2));
    let _ = () => e.get(f)[0], b = () => e.get(f)[1];
    var w = e.comment(), $ = e.first_child(w);
    e.element($, _, !0, (k, M) => {
      e.attribute_effect(k, () => ({ ...b() }));
    }), e.append(m, w);
  });
  var x = e.sibling(y);
  e.snippet(x, () => a.children ?? e.noop), e.reset(h), e.append(l, h), e.pop();
}
function L(l, a) {
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
  let d = e.rest_props(a, ["$$slots", "$$events", "$$legacy"]);
  const n = [
    ["path", { d: "M18 22H4a2 2 0 0 1-2-2V6" }],
    [
      "path",
      { d: "m22 13-1.296-1.296a2.41 2.41 0 0 0-3.408 0L11 18" }
    ],
    ["circle", { cx: "12", cy: "8", r: "2" }],
    [
      "rect",
      { width: "16", height: "16", x: "6", y: "2", rx: "2" }
    ]
  ];
  U(l, e.spread_props({ name: "images" }, () => d, {
    get iconNode() {
      return n;
    },
    children: (s, c) => {
      var o = e.comment(), p = e.first_child(o);
      e.snippet(p, () => a.children ?? e.noop), e.append(s, o);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function te(l, a) {
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
  let d = e.rest_props(a, ["$$slots", "$$events", "$$legacy"]);
  const n = [
    ["path", { d: "M3 6h18" }],
    ["path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" }],
    ["path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" }],
    ["line", { x1: "10", x2: "10", y1: "11", y2: "17" }],
    ["line", { x1: "14", x2: "14", y1: "11", y2: "17" }]
  ];
  U(l, e.spread_props({ name: "trash-2" }, () => d, {
    get iconNode() {
      return n;
    },
    children: (s, c) => {
      var o = e.comment(), p = e.first_child(o);
      e.snippet(p, () => a.children ?? e.noop), e.append(s, o);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function S(l, a) {
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
  let d = e.rest_props(a, ["$$slots", "$$events", "$$legacy"]);
  const n = [
    ["path", { d: "M12 3v12" }],
    ["path", { d: "m17 8-5-5-5 5" }],
    ["path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }]
  ];
  U(l, e.spread_props({ name: "upload" }, () => d, {
    get iconNode() {
      return n;
    },
    children: (s, c) => {
      var o = e.comment(), p = e.first_child(o);
      e.snippet(p, () => a.children ?? e.noop), e.append(s, o);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
var re = e.from_html('<div class="alert alert-error"> </div>'), ae = e.from_html('<img class="w-full h-full object-cover"/>'), ie = e.from_html('<div class="bg-base-100 rounded-lg shadow overflow-hidden group relative"><div class="aspect-square bg-base-200 flex items-center justify-center overflow-hidden"><!></div> <div class="p-2"><div class="text-xs truncate"> </div> <div class="text-[10px] text-base-content/60"> </div></div> <button class="btn btn-error btn-xs btn-circle absolute top-2 right-2 opacity-0 group-hover:opacity-100" title="Delete"><!></button></div>'), se = e.from_html('<div class="col-span-full text-center py-12 text-base-content/60">No media uploaded yet.</div>'), oe = e.from_html('<div class="p-6 space-y-4"><header class="flex items-center justify-between"><h1 class="text-2xl font-semibold flex items-center gap-2"><!> Media Library</h1> <label class="btn btn-primary btn-sm gap-2"><!> <input type="file" multiple="" class="hidden"/></label></header> <!> <div><!> <p class="text-sm text-base-content/60">Drag files here, or click "Upload" above.</p></div> <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3"><!> <!></div></div>');
function ne(l, a) {
  var H;
  e.push(a, !0);
  const d = ((H = window.__zveltio) == null ? void 0 : H.engineUrl) ?? "";
  let n = e.state(e.proxy([])), s = e.state(""), c = e.state(!1), o = e.state(!1);
  async function p(t, r) {
    const i = await fetch(`${d}${t}`, { credentials: "include", ...r }), v = await i.json().catch(() => ({}));
    if (!i.ok) throw new Error(v.error || `HTTP ${i.status}`);
    return v;
  }
  async function h() {
    try {
      const t = await p("/api/media");
      e.set(n, t.data ?? t.items ?? [], !0);
    } catch (t) {
      e.set(s, t.message, !0);
    }
  }
  async function y(t) {
    if (confirm("Delete asset?"))
      try {
        await p(`/api/media/${t}`, { method: "DELETE" }), await h();
      } catch (r) {
        e.set(s, r.message, !0);
      }
  }
  async function x(t) {
    if (!(!t || !t.length)) {
      e.set(o, !0), e.set(s, "");
      try {
        for (const r of Array.from(t)) {
          const i = new FormData();
          i.append("file", r), await fetch(`${d}/api/storage/upload`, { method: "POST", credentials: "include", body: i }).then(async (v) => {
            if (!v.ok) throw new Error((await v.json().catch(() => ({}))).error || "Upload failed");
          });
        }
        await h();
      } catch (r) {
        e.set(s, r.message, !0);
      } finally {
        e.set(o, !1);
      }
    }
  }
  function m(t) {
    return (t.mime_type ?? t.contentType ?? "").startsWith("image/");
  }
  function N(t) {
    if (!t) return "—";
    const r = ["B", "KB", "MB", "GB"];
    let i = 0;
    for (; t > 1024 && i < r.length - 1; )
      t /= 1024, i++;
    return `${t.toFixed(1)} ${r[i]}`;
  }
  Y(h);
  var f = oe(), _ = e.child(f), b = e.child(_), w = e.child(b);
  L(w, { class: "h-6 w-6" }), e.next(), e.reset(b);
  var $ = e.sibling(b, 2), k = e.child($);
  S(k, { class: "h-4 w-4" });
  var M = e.sibling(k), A = e.sibling(M);
  e.reset($), e.reset(_);
  var W = e.sibling(_, 2);
  {
    var F = (t) => {
      var r = re(), i = e.child(r, !0);
      e.reset(r), e.template_effect(() => e.set_text(i, e.get(s))), e.append(t, r);
    };
    e.if(W, (t) => {
      e.get(s) && t(F);
    });
  }
  var u = e.sibling(W, 2);
  let B;
  var V = e.child(u);
  S(V, { class: "h-8 w-8 mx-auto mb-2 text-base-content/40" }), e.next(2), e.reset(u);
  var P = e.sibling(u, 2), E = e.child(P);
  e.each(E, 17, () => e.get(n), (t) => t.id, (t, r) => {
    var i = ie(), v = e.child(i), q = e.child(v);
    {
      var G = (g) => {
        var T = ae();
        e.template_effect(() => {
          e.set_attribute(T, "src", e.get(r).url ?? `${d}/api/media/${e.get(r).id}/raw`), e.set_attribute(T, "alt", e.get(r).filename ?? e.get(r).name);
        }), e.append(g, T);
      }, K = e.derived(() => m(e.get(r))), R = (g) => {
        L(g, { class: "h-10 w-10 text-base-content/40" });
      };
      e.if(q, (g) => {
        e.get(K) ? g(G) : g(R, -1);
      });
    }
    e.reset(v);
    var z = e.sibling(v, 2), j = e.child(z), J = e.child(j, !0);
    e.reset(j);
    var I = e.sibling(j, 2), Q = e.child(I, !0);
    e.reset(I), e.reset(z);
    var D = e.sibling(z, 2), X = e.child(D);
    te(X, { class: "h-3 w-3" }), e.reset(D), e.reset(i), e.template_effect(
      (g) => {
        e.set_text(J, e.get(r).filename ?? e.get(r).name), e.set_text(Q, g);
      },
      [
        () => N(Number(e.get(r).size_bytes ?? e.get(r).size ?? 0))
      ]
    ), e.delegated("click", D, () => y(e.get(r).id)), e.append(t, i);
  });
  var C = e.sibling(E, 2);
  {
    var O = (t) => {
      var r = se();
      e.append(t, r);
    };
    e.if(C, (t) => {
      e.get(n).length === 0 && t(O);
    });
  }
  e.reset(P), e.reset(f), e.template_effect(() => {
    e.set_text(M, ` ${e.get(o) ? "Uploading…" : "Upload"} `), B = e.set_class(u, 1, "border-2 border-dashed rounded-lg p-8 text-center transition", null, B, {
      "border-primary": e.get(c),
      "bg-primary": e.get(c),
      "bg-opacity-5": e.get(c)
    });
  }), e.delegated("change", A, (t) => x(t.target.files)), e.event("dragover", u, (t) => {
    t.preventDefault(), e.set(c, !0);
  }), e.event("dragleave", u, () => e.set(c, !1)), e.event("drop", u, (t) => {
    var r;
    t.preventDefault(), e.set(c, !1), x(((r = t.dataTransfer) == null ? void 0 : r.files) ?? null);
  }), e.append(l, f), e.pop();
}
e.delegate(["change", "click"]);
function le() {
  const l = window.__zveltio;
  l && l.registerRoute({
    path: "media-library",
    component: ne,
    label: "Media Library",
    icon: "Images",
    category: "content"
  });
}
le();
export {
  le as default
};
