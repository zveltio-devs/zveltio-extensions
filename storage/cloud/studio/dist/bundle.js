import "svelte/internal/disclose-version";
import * as e from "svelte/internal/client";
import { onMount as $e } from "svelte";
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
const ke = {
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
var Ne = e.from_svg("<svg><!><!></svg>");
function N(i, r) {
  e.push(r, !0);
  const d = e.prop(r, "color", 3, "currentColor"), n = e.prop(r, "size", 3, 24), c = e.prop(r, "strokeWidth", 3, 2), v = e.prop(r, "absoluteStrokeWidth", 3, !1), s = e.prop(r, "iconNode", 19, () => []), o = e.rest_props(r, [
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
  var M = Ne();
  e.attribute_effect(
    M,
    (_) => ({
      ...ke,
      ...o,
      width: n(),
      height: n(),
      stroke: d(),
      "stroke-width": _,
      class: [
        "lucide-icon lucide",
        r.name && `lucide-${r.name}`,
        r.class
      ]
    }),
    [
      () => v() ? Number(c()) * 24 / Number(n()) : c()
    ]
  );
  var y = e.child(M);
  e.each(y, 17, s, e.index, (_, B) => {
    var S = e.derived(() => e.to_array(e.get(B), 2));
    let U = () => e.get(S)[0], R = () => e.get(S)[1];
    var D = e.comment(), I = e.first_child(D);
    e.element(I, U, !0, (O, Q) => {
      e.attribute_effect(O, () => ({ ...R() }));
    }), e.append(_, D);
  });
  var P = e.sibling(y);
  e.snippet(P, () => r.children ?? e.noop), e.reset(M), e.append(i, M), e.pop();
}
function Me(i, r) {
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
  let d = e.rest_props(r, ["$$slots", "$$events", "$$legacy"]);
  const n = [
    ["path", { d: "m12 19-7-7 7-7" }],
    ["path", { d: "M19 12H5" }]
  ];
  N(i, e.spread_props({ name: "arrow-left" }, () => d, {
    get iconNode() {
      return n;
    },
    children: (c, v) => {
      var s = e.comment(), o = e.first_child(s);
      e.snippet(o, () => r.children ?? e.noop), e.append(c, s);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function Pe(i, r) {
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
  let d = e.rest_props(r, ["$$slots", "$$events", "$$legacy"]);
  const n = [["path", { d: "m9 18 6-6-6-6" }]];
  N(i, e.spread_props({ name: "chevron-right" }, () => d, {
    get iconNode() {
      return n;
    },
    children: (c, v) => {
      var s = e.comment(), o = e.first_child(s);
      e.snippet(o, () => r.children ?? e.noop), e.append(c, s);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function Se(i, r) {
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
  let d = e.rest_props(r, ["$$slots", "$$events", "$$legacy"]);
  const n = [
    [
      "path",
      { d: "M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" }
    ]
  ];
  N(i, e.spread_props({ name: "cloud" }, () => d, {
    get iconNode() {
      return n;
    },
    children: (c, v) => {
      var s = e.comment(), o = e.first_child(s);
      e.snippet(o, () => r.children ?? e.noop), e.append(c, s);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function Ce(i, r) {
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
  let d = e.rest_props(r, ["$$slots", "$$events", "$$legacy"]);
  const n = [
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
  N(i, e.spread_props({ name: "file-text" }, () => d, {
    get iconNode() {
      return n;
    },
    children: (c, v) => {
      var s = e.comment(), o = e.first_child(s);
      e.snippet(o, () => r.children ?? e.noop), e.append(c, s);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function de(i, r) {
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
  let d = e.rest_props(r, ["$$slots", "$$events", "$$legacy"]);
  const n = [
    [
      "path",
      {
        d: "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"
      }
    ]
  ];
  N(i, e.spread_props({ name: "folder" }, () => d, {
    get iconNode() {
      return n;
    },
    children: (c, v) => {
      var s = e.comment(), o = e.first_child(s);
      e.snippet(o, () => r.children ?? e.noop), e.append(c, s);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function ce(i, r) {
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
  let d = e.rest_props(r, ["$$slots", "$$events", "$$legacy"]);
  const n = [
    ["circle", { cx: "18", cy: "5", r: "3" }],
    ["circle", { cx: "6", cy: "12", r: "3" }],
    ["circle", { cx: "18", cy: "19", r: "3" }],
    [
      "line",
      { x1: "8.59", x2: "15.42", y1: "13.51", y2: "17.49" }
    ],
    [
      "line",
      { x1: "15.41", x2: "8.59", y1: "6.51", y2: "10.49" }
    ]
  ];
  N(i, e.spread_props({ name: "share-2" }, () => d, {
    get iconNode() {
      return n;
    },
    children: (c, v) => {
      var s = e.comment(), o = e.first_child(s);
      e.snippet(o, () => r.children ?? e.noop), e.append(c, s);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function je(i, r) {
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
  let d = e.rest_props(r, ["$$slots", "$$events", "$$legacy"]);
  const n = [
    ["path", { d: "M3 6h18" }],
    ["path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" }],
    ["path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" }],
    ["line", { x1: "10", x2: "10", y1: "11", y2: "17" }],
    ["line", { x1: "14", x2: "14", y1: "11", y2: "17" }]
  ];
  N(i, e.spread_props({ name: "trash-2" }, () => d, {
    get iconNode() {
      return n;
    },
    children: (c, v) => {
      var s = e.comment(), o = e.first_child(s);
      e.snippet(o, () => r.children ?? e.noop), e.append(c, s);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function Te(i, r) {
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
  let d = e.rest_props(r, ["$$slots", "$$events", "$$legacy"]);
  const n = [
    ["path", { d: "M12 3v12" }],
    ["path", { d: "m17 8-5-5-5 5" }],
    ["path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }]
  ];
  N(i, e.spread_props({ name: "upload" }, () => d, {
    get iconNode() {
      return n;
    },
    children: (c, v) => {
      var s = e.comment(), o = e.first_child(s);
      e.snippet(o, () => r.children ?? e.noop), e.append(c, s);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function Ue(i, r) {
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
  let d = e.rest_props(r, ["$$slots", "$$events", "$$legacy"]);
  const n = [
    ["path", { d: "M18 6 6 18" }],
    ["path", { d: "m6 6 12 12" }]
  ];
  N(i, e.spread_props({ name: "x" }, () => d, {
    get iconNode() {
      return n;
    },
    children: (c, v) => {
      var s = e.comment(), o = e.first_child(s);
      e.snippet(o, () => r.children ?? e.noop), e.append(c, s);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
var ze = e.from_html('<div class="alert alert-error"> </div>'), He = e.from_html('<button class="btn btn-ghost btn-xs btn-square"><!></button>'), Be = e.from_html('<!> <button class="link"> </button>', 1), De = e.from_html('<div class="p-12 text-center text-base-content/60"><!> Empty folder. Drag files here or click Upload.</div>'), Ee = e.from_html('<button class="link"> </button>'), Fe = e.from_html('<a class="link" target="_blank"> </a>'), We = e.from_html('<button class="btn btn-ghost btn-xs btn-square" title="Share"><!></button>'), qe = e.from_html('<tr class="hover:bg-base-200"><td class="w-10"><!></td><td><!></td><td class="text-right"> </td><td class="text-xs text-base-content/60"> </td><td><!> <button class="btn btn-ghost btn-xs btn-square text-error" title="Delete"><!></button></td></tr>'), Ae = e.from_html('<table class="table table-sm"><thead><tr><th></th><th>Name</th><th class="text-right">Size</th><th>Modified</th><th></th></tr></thead><tbody></tbody></table>'), Re = e.from_html('<div class="space-y-3"><div><label class="label label-text">Expires (hours)</label><input type="number" class="input input-bordered w-full"/></div> <div><label class="label label-text">Password (optional)</label><input type="password" class="input input-bordered w-full"/></div></div> <div class="flex justify-end gap-2 mt-4"><button class="btn btn-ghost">Cancel</button><button class="btn btn-primary gap-2"><!> Generate link</button></div>', 1), Ie = e.from_html('<div class="space-y-3"><p class="text-sm"> </p> <input class="input input-bordered w-full font-mono text-xs" readonly=""/></div> <div class="flex justify-end mt-4"><button class="btn btn-primary">Copy & close</button></div>', 1), Oe = e.from_html('<div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><div class="bg-base-100 rounded-xl p-6 w-full max-w-md"><div class="flex items-center justify-between mb-4"><h2 class="text-xl font-semibold"> </h2><button class="btn btn-ghost btn-sm btn-square"><!></button></div> <!></div></div>'), Ve = e.from_html('<div class="p-6 space-y-4"><header class="flex items-center justify-between"><h1 class="text-2xl font-semibold flex items-center gap-2"><!> Cloud Storage</h1> <label class="btn btn-primary btn-sm gap-2"><!> <input type="file" multiple="" class="hidden"/></label></header> <!> <div class="flex items-center gap-2 text-sm"><!> <button class="link">Root</button> <!></div> <div><!></div></div> <!>', 1);
function Ze(i, r) {
  var ie;
  e.push(r, !0);
  const d = ((ie = window.__zveltio) == null ? void 0 : ie.engineUrl) ?? "";
  let n = e.state("/"), c = e.state(e.proxy([])), v = e.state(null), s = e.state(""), o = e.state(!1), M = e.state(!1), y = e.state(!1), P = e.state(""), _ = e.state(e.proxy({ expires_in_hours: 24, password: "" }));
  async function B(t, a) {
    const l = await fetch(`${d}${t}`, { credentials: "include", ...a }), u = await l.json().catch(() => ({}));
    if (!l.ok) throw new Error(u.error || `HTTP ${l.status}`);
    return u;
  }
  async function S() {
    try {
      const t = await B(`/api/cloud/files?path=${encodeURIComponent(e.get(n))}`);
      e.set(c, t.data ?? t.entries ?? [], !0);
    } catch (t) {
      e.set(s, t.message, !0);
    }
  }
  function U(t) {
    e.set(n, t, !0), e.set(v, null);
  }
  function R() {
    const t = e.get(n).split("/").filter(Boolean);
    t.pop(), U("/" + t.join("/"));
  }
  async function D(t) {
    if (t != null && t.length) {
      e.set(M, !0), e.set(s, "");
      try {
        for (const a of Array.from(t)) {
          const l = new FormData();
          l.append("file", a), l.append("path", e.get(n)), await fetch(`${d}/api/cloud/upload`, { method: "POST", credentials: "include", body: l }).then(async (u) => {
            if (!u.ok) throw new Error((await u.json().catch(() => ({}))).error || "Upload failed");
          });
        }
        await S();
      } catch (a) {
        e.set(s, a.message, !0);
      } finally {
        e.set(M, !1);
      }
    }
  }
  async function I(t) {
    if (confirm(`Delete ${t.name}?`))
      try {
        await B(`/api/cloud/files/${encodeURIComponent(t.id ?? t.path)}`, { method: "DELETE" }), await S();
      } catch (a) {
        e.set(s, a.message, !0);
      }
  }
  async function O(t) {
    e.set(v, t, !0), e.set(_, { expires_in_hours: 24, password: "" }, !0), e.set(P, ""), e.set(y, !0);
  }
  async function Q() {
    if (e.get(v))
      try {
        const t = await B("/api/cloud/shares", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file_id: e.get(v).id, ...e.get(_) })
        });
        e.set(P, t.share_url ?? `${d}/share/${t.token}`, !0);
      } catch (t) {
        e.set(s, t.message, !0);
      }
  }
  e.user_effect(() => {
    e.get(n), S();
  }), $e(S);
  function pe(t) {
    if (!t) return "—";
    const a = ["B", "KB", "MB", "GB"];
    let l = 0;
    for (; t > 1024 && l < a.length - 1; )
      t /= 1024, l++;
    return `${t.toFixed(1)} ${a[l]}`;
  }
  function Y(t) {
    return t.split("/").filter(Boolean);
  }
  var ee = Ve(), V = e.first_child(ee), Z = e.child(V), G = e.child(Z), he = e.child(G);
  Se(he, { class: "h-6 w-6" }), e.next(), e.reset(G);
  var te = e.sibling(G, 2), re = e.child(te);
  Te(re, { class: "h-4 w-4" });
  var ae = e.sibling(re), ue = e.sibling(ae);
  e.reset(te), e.reset(Z);
  var se = e.sibling(Z, 2);
  {
    var ve = (t) => {
      var a = ze(), l = e.child(a, !0);
      e.reset(a), e.template_effect(() => e.set_text(l, e.get(s))), e.append(t, a);
    };
    e.if(se, (t) => {
      e.get(s) && t(ve);
    });
  }
  var L = e.sibling(se, 2), ne = e.child(L);
  {
    var fe = (t) => {
      var a = He(), l = e.child(a);
      Me(l, { class: "h-4 w-4" }), e.reset(a), e.delegated("click", a, R), e.append(t, a);
    };
    e.if(ne, (t) => {
      e.get(n) !== "/" && t(fe);
    });
  }
  var oe = e.sibling(ne, 2), ge = e.sibling(oe, 2);
  e.each(ge, 17, () => Y(e.get(n)), e.index, (t, a, l) => {
    var u = Be(), p = e.first_child(u);
    Pe(p, { class: "h-3 w-3 text-base-content/40" });
    var w = e.sibling(p, 2), $ = e.child(w, !0);
    e.reset(w), e.template_effect(() => e.set_text($, e.get(a))), e.delegated("click", w, () => U("/" + Y(e.get(n)).slice(0, l + 1).join("/"))), e.append(t, u);
  }), e.reset(L);
  var z = e.sibling(L, 2);
  let le;
  var _e = e.child(z);
  {
    var me = (t) => {
      var a = De(), l = e.child(a);
      de(l, { class: "h-10 w-10 mx-auto mb-2 opacity-40" }), e.next(), e.reset(a), e.append(t, a);
    }, be = (t) => {
      var a = Ae(), l = e.sibling(e.child(a));
      e.each(l, 21, () => e.get(c), (u) => u.id ?? u.name, (u, p) => {
        var w = qe(), $ = e.child(w), J = e.child($);
        {
          var K = (h) => {
            de(h, { class: "h-4 w-4 text-warning" });
          }, X = (h) => {
            Ce(h, { class: "h-4 w-4 text-base-content/60" });
          };
          e.if(J, (h) => {
            e.get(p).is_folder ?? e.get(p).type === "folder" ? h(K) : h(X, -1);
          });
        }
        e.reset($);
        var E = e.sibling($), g = e.child(E);
        {
          var C = (h) => {
            var f = Ee(), A = e.child(f, !0);
            e.reset(f), e.template_effect(() => e.set_text(A, e.get(p).name)), e.delegated("click", f, () => U(`${e.get(n) === "/" ? "" : e.get(n)}/${e.get(p).name}`)), e.append(h, f);
          }, k = (h) => {
            var f = Fe(), A = e.child(f, !0);
            e.reset(f), e.template_effect(
              (we) => {
                e.set_attribute(f, "href", `${d ?? ""}/api/cloud/files/${we ?? ""}/download`), e.set_text(A, e.get(p).name);
              },
              [() => e.get(p).id ?? encodeURIComponent(e.get(p).path)]
            ), e.append(h, f);
          };
          e.if(g, (h) => {
            e.get(p).is_folder ?? e.get(p).type === "folder" ? h(C) : h(k, -1);
          });
        }
        e.reset(E);
        var m = e.sibling(E), H = e.child(m, !0);
        e.reset(m);
        var b = e.sibling(m), j = e.child(b, !0);
        e.reset(b);
        var T = e.sibling(b), x = e.child(T);
        {
          var F = (h) => {
            var f = We(), A = e.child(f);
            ce(A, { class: "h-3 w-3" }), e.reset(f), e.delegated("click", f, () => O(e.get(p))), e.append(h, f);
          };
          e.if(x, (h) => {
            (e.get(p).is_folder ?? e.get(p).type === "folder") || h(F);
          });
        }
        var W = e.sibling(x, 2), q = e.child(W);
        je(q, { class: "h-3 w-3" }), e.reset(W), e.reset(T), e.reset(w), e.template_effect(
          (h, f) => {
            e.set_text(H, h), e.set_text(j, f);
          },
          [
            () => e.get(p).is_folder ? "—" : pe(Number(e.get(p).size_bytes ?? e.get(p).size ?? 0)),
            () => {
              var h;
              return ((h = e.get(p).updated_at) == null ? void 0 : h.slice(0, 16).replace("T", " ")) ?? "—";
            }
          ]
        ), e.delegated("click", W, () => I(e.get(p))), e.append(u, w);
      }), e.reset(l), e.reset(a), e.append(t, a);
    };
    e.if(_e, (t) => {
      e.get(c).length === 0 ? t(me) : t(be, -1);
    });
  }
  e.reset(z), e.reset(V);
  var xe = e.sibling(V, 2);
  {
    var ye = (t) => {
      var a = Oe(), l = e.child(a), u = e.child(l), p = e.child(u), w = e.child(p);
      e.reset(p);
      var $ = e.sibling(p), J = e.child($);
      Ue(J, { class: "h-4 w-4" }), e.reset($), e.reset(u);
      var K = e.sibling(u, 2);
      {
        var X = (g) => {
          var C = Re(), k = e.first_child(C), m = e.child(k), H = e.sibling(e.child(m));
          e.remove_input_defaults(H), e.reset(m);
          var b = e.sibling(m, 2), j = e.sibling(e.child(b));
          e.remove_input_defaults(j), e.reset(b), e.reset(k);
          var T = e.sibling(k, 2), x = e.child(T), F = e.sibling(x), W = e.child(F);
          ce(W, { class: "h-4 w-4" }), e.next(), e.reset(F), e.reset(T), e.bind_value(H, () => e.get(_).expires_in_hours, (q) => e.get(_).expires_in_hours = q), e.bind_value(j, () => e.get(_).password, (q) => e.get(_).password = q), e.delegated("click", x, () => e.set(y, !1)), e.delegated("click", F, Q), e.append(g, C);
        }, E = (g) => {
          var C = Ie(), k = e.first_child(C), m = e.child(k), H = e.child(m);
          e.reset(m);
          var b = e.sibling(m, 2);
          e.remove_input_defaults(b), e.reset(k);
          var j = e.sibling(k, 2), T = e.child(j);
          e.reset(j), e.template_effect(() => {
            e.set_text(H, `Anyone with this link can access the file${e.get(_).password ? " (password required)" : ""} for ${e.get(_).expires_in_hours ?? ""}h:`), e.set_value(b, e.get(P));
          }), e.delegated("click", b, (x) => x.target.select()), e.delegated("click", T, () => {
            var x;
            (x = navigator.clipboard) == null || x.writeText(e.get(P)), e.set(y, !1);
          }), e.append(g, C);
        };
        e.if(K, (g) => {
          e.get(P) ? g(E, -1) : g(X);
        });
      }
      e.reset(l), e.reset(a), e.template_effect(() => {
        var g;
        return e.set_text(w, `Share ${((g = e.get(v)) == null ? void 0 : g.name) ?? ""}`);
      }), e.delegated("click", a, (g) => g.target === g.currentTarget && e.set(y, !1)), e.delegated("click", $, () => e.set(y, !1)), e.append(t, a);
    };
    e.if(xe, (t) => {
      e.get(y) && t(ye);
    });
  }
  e.template_effect(() => {
    e.set_text(ae, ` ${e.get(M) ? "Uploading…" : "Upload"} `), le = e.set_class(z, 1, "bg-base-100 rounded-lg shadow", null, le, { "ring-2": e.get(o), "ring-primary": e.get(o) });
  }), e.delegated("change", ue, (t) => D(t.target.files)), e.delegated("click", oe, () => U("/")), e.event("dragover", z, (t) => {
    t.preventDefault(), e.set(o, !0);
  }), e.event("dragleave", z, () => e.set(o, !1)), e.event("drop", z, (t) => {
    var a;
    t.preventDefault(), e.set(o, !1), D(((a = t.dataTransfer) == null ? void 0 : a.files) ?? null);
  }), e.append(i, ee), e.pop();
}
e.delegate(["change", "click"]);
function Ge() {
  const i = window.__zveltio;
  i && i.registerRoute({
    path: "cloud",
    component: Ze,
    label: "Cloud Storage",
    icon: "Cloud",
    category: "storage"
  });
}
Ge();
export {
  Ge as default
};
