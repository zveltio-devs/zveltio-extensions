var ot = Object.defineProperty;
var Ye = (o) => {
  throw TypeError(o);
};
var dt = (o, t, l) => t in o ? ot(o, t, { enumerable: !0, configurable: !0, writable: !0, value: l }) : o[t] = l;
var Ze = (o, t, l) => dt(o, typeof t != "symbol" ? t + "" : t, l), ct = (o, t, l) => t.has(o) || Ye("Cannot " + l);
var Fe = (o, t, l) => (ct(o, t, "read from private field"), l ? l.call(o) : t.get(o)), Xe = (o, t, l) => t.has(o) ? Ye("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(o) : t.set(o, l);
import "svelte/internal/disclose-version";
import * as e from "svelte/internal/client";
import { onMount as pt } from "svelte";
const st = typeof window < "u" ? window.location.origin : "";
typeof window < "u" && (window.__ZVELTIO_ENGINE_URL__ = st);
class vt {
  constructor(t) {
    Ze(this, "base");
    this.base = t;
  }
  async request(t, l, i) {
    const d = await fetch(`${this.base}${l}`, {
      method: t,
      credentials: "include",
      headers: i ? { "Content-Type": "application/json" } : {},
      body: i ? JSON.stringify(i) : void 0
    });
    if (!d.ok) {
      const g = await d.json().catch(() => ({ error: d.statusText }));
      throw new Error(g.error || `Request failed: ${d.status}`);
    }
    return d.json();
  }
  get(t) {
    return this.request("GET", t);
  }
  post(t, l) {
    return this.request("POST", t, l);
  }
  put(t, l) {
    return this.request("PUT", t, l);
  }
  patch(t, l) {
    return this.request("PATCH", t, l);
  }
  delete(t, l) {
    return this.request("DELETE", t, l);
  }
}
const ee = new vt(st);
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
const ht = {
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
var _t = e.from_svg("<svg><!><!></svg>");
function J(o, t) {
  e.push(t, !0);
  const l = e.prop(t, "color", 3, "currentColor"), i = e.prop(t, "size", 3, 24), d = e.prop(t, "strokeWidth", 3, 2), g = e.prop(t, "absoluteStrokeWidth", 3, !1), a = e.prop(t, "iconNode", 19, () => []), u = e.rest_props(t, [
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
  var E = _t();
  e.attribute_effect(
    E,
    (L) => ({
      ...ht,
      ...u,
      width: i(),
      height: i(),
      stroke: l(),
      "stroke-width": L,
      class: [
        "lucide-icon lucide",
        t.name && `lucide-${t.name}`,
        t.class
      ]
    }),
    [
      () => g() ? Number(d()) * 24 / Number(i()) : d()
    ]
  );
  var K = e.child(E);
  e.each(K, 17, a, e.index, (L, j) => {
    var N = e.derived(() => e.to_array(e.get(j), 2));
    let q = () => e.get(N)[0], te = () => e.get(N)[1];
    var ce = e.comment(), Y = e.first_child(ce);
    e.element(Y, q, !0, (pe, he) => {
      e.attribute_effect(pe, () => ({ ...te() }));
    }), e.append(L, ce);
  });
  var I = e.sibling(K);
  e.snippet(I, () => t.children ?? e.noop), e.reset(E), e.append(o, E), e.pop();
}
function gt(o, t) {
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
  let l = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const i = [
    ["path", { d: "m12 19-7-7 7-7" }],
    ["path", { d: "M19 12H5" }]
  ];
  J(o, e.spread_props({ name: "arrow-left" }, () => l, {
    get iconNode() {
      return i;
    },
    children: (d, g) => {
      var a = e.comment(), u = e.first_child(a);
      e.snippet(u, () => t.children ?? e.noop), e.append(d, a);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function ut(o, t) {
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
  let l = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const i = [
    ["path", { d: "M12 17h1.5" }],
    ["path", { d: "M12 22h1.5" }],
    ["path", { d: "M12 2h1.5" }],
    ["path", { d: "M17.5 22H19a1 1 0 0 0 1-1" }],
    ["path", { d: "M17.5 2H19a1 1 0 0 1 1 1v1.5" }],
    ["path", { d: "M20 14v3h-2.5" }],
    ["path", { d: "M20 8.5V10" }],
    ["path", { d: "M4 10V8.5" }],
    ["path", { d: "M4 19.5V14" }],
    ["path", { d: "M4 4.5A2.5 2.5 0 0 1 6.5 2H8" }],
    ["path", { d: "M8 22H6.5a1 1 0 0 1 0-5H8" }]
  ];
  J(o, e.spread_props({ name: "book-dashed" }, () => l, {
    get iconNode() {
      return i;
    },
    children: (d, g) => {
      var a = e.comment(), u = e.first_child(a);
      e.snippet(u, () => t.children ?? e.noop), e.append(d, a);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function Re(o, t) {
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
  let l = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const i = [
    ["path", { d: "M12 8V4H8" }],
    [
      "rect",
      { width: "16", height: "12", x: "4", y: "8", rx: "2" }
    ],
    ["path", { d: "M2 14h2" }],
    ["path", { d: "M20 14h2" }],
    ["path", { d: "M15 13v2" }],
    ["path", { d: "M9 13v2" }]
  ];
  J(o, e.spread_props({ name: "bot" }, () => l, {
    get iconNode() {
      return i;
    },
    children: (d, g) => {
      var a = e.comment(), u = e.first_child(a);
      e.snippet(u, () => t.children ?? e.noop), e.append(d, a);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function et(o, t) {
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
  let l = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const i = [["path", { d: "M20 6 9 17l-5-5" }]];
  J(o, e.spread_props({ name: "check" }, () => l, {
    get iconNode() {
      return i;
    },
    children: (d, g) => {
      var a = e.comment(), u = e.first_child(a);
      e.snippet(u, () => t.children ?? e.noop), e.append(d, a);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function mt(o, t) {
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
  let l = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const i = [["path", { d: "m6 9 6 6 6-6" }]];
  J(o, e.spread_props({ name: "chevron-down" }, () => l, {
    get iconNode() {
      return i;
    },
    children: (d, g) => {
      var a = e.comment(), u = e.first_child(a);
      e.snippet(u, () => t.children ?? e.noop), e.append(d, a);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function ft(o, t) {
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
  let l = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const i = [["path", { d: "m9 18 6-6-6-6" }]];
  J(o, e.spread_props({ name: "chevron-right" }, () => l, {
    get iconNode() {
      return i;
    },
    children: (d, g) => {
      var a = e.comment(), u = e.first_child(a);
      e.snippet(u, () => t.children ?? e.noop), e.append(d, a);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function Ue(o, t) {
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
  let l = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const i = [
    ["path", { d: "m18 16 4-4-4-4" }],
    ["path", { d: "m6 8-4 4 4 4" }],
    ["path", { d: "m14.5 4-5 16" }]
  ];
  J(o, e.spread_props({ name: "code-xml" }, () => l, {
    get iconNode() {
      return i;
    },
    children: (d, g) => {
      var a = e.comment(), u = e.first_child(a);
      e.snippet(u, () => t.children ?? e.noop), e.append(d, a);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function xt(o, t) {
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
  let l = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const i = [
    [
      "path",
      {
        d: "M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"
      }
    ],
    ["circle", { cx: "12", cy: "12", r: "3" }]
  ];
  J(o, e.spread_props({ name: "eye" }, () => l, {
    get iconNode() {
      return i;
    },
    children: (d, g) => {
      var a = e.comment(), u = e.first_child(a);
      e.snippet(u, () => t.children ?? e.noop), e.append(d, a);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function tt(o, t) {
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
  let l = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const i = [["path", { d: "M21 12a9 9 0 1 1-6.219-8.56" }]];
  J(o, e.spread_props({ name: "loader-circle" }, () => l, {
    get iconNode() {
      return i;
    },
    children: (d, g) => {
      var a = e.comment(), u = e.first_child(a);
      e.snippet(u, () => t.children ?? e.noop), e.append(d, a);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function bt(o, t) {
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
  let l = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const i = [
    [
      "path",
      {
        d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
      }
    ]
  ];
  J(o, e.spread_props({ name: "message-square" }, () => l, {
    get iconNode() {
      return i;
    },
    children: (d, g) => {
      var a = e.comment(), u = e.first_child(a);
      e.snippet(u, () => t.children ?? e.noop), e.append(d, a);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function Ge(o, t) {
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
  let l = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const i = [["path", { d: "M5 12h14" }], ["path", { d: "M12 5v14" }]];
  J(o, e.spread_props({ name: "plus" }, () => l, {
    get iconNode() {
      return i;
    },
    children: (d, g) => {
      var a = e.comment(), u = e.first_child(a);
      e.snippet(u, () => t.children ?? e.noop), e.append(d, a);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function De(o, t) {
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
  let l = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const i = [
    ["path", { d: "m21 21-4.34-4.34" }],
    ["circle", { cx: "11", cy: "11", r: "8" }]
  ];
  J(o, e.spread_props({ name: "search" }, () => l, {
    get iconNode() {
      return i;
    },
    children: (d, g) => {
      var a = e.comment(), u = e.first_child(a);
      e.snippet(u, () => t.children ?? e.noop), e.append(d, a);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function yt(o, t) {
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
  let l = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const i = [
    [
      "path",
      {
        d: "M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"
      }
    ],
    ["path", { d: "m21.854 2.147-10.94 10.939" }]
  ];
  J(o, e.spread_props({ name: "send" }, () => l, {
    get iconNode() {
      return i;
    },
    children: (d, g) => {
      var a = e.comment(), u = e.first_child(a);
      e.snippet(u, () => t.children ?? e.noop), e.append(d, a);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function wt(o, t) {
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
  let l = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const i = [
    ["path", { d: "M20 7h-9" }],
    ["path", { d: "M14 17H5" }],
    ["circle", { cx: "17", cy: "17", r: "3" }],
    ["circle", { cx: "7", cy: "7", r: "3" }]
  ];
  J(o, e.spread_props({ name: "settings-2" }, () => l, {
    get iconNode() {
      return i;
    },
    children: (d, g) => {
      var a = e.comment(), u = e.first_child(a);
      e.snippet(u, () => t.children ?? e.noop), e.append(d, a);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function at(o, t) {
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
  let l = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const i = [
    [
      "path",
      {
        d: "M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"
      }
    ],
    ["path", { d: "M20 3v4" }],
    ["path", { d: "M22 5h-4" }],
    ["path", { d: "M4 17v2" }],
    ["path", { d: "M5 18H3" }]
  ];
  J(o, e.spread_props({ name: "sparkles" }, () => l, {
    get iconNode() {
      return i;
    },
    children: (d, g) => {
      var a = e.comment(), u = e.first_child(a);
      e.snippet(u, () => t.children ?? e.noop), e.append(d, a);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function kt(o, t) {
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
  let l = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const i = [
    ["path", { d: "M3 6h18" }],
    ["path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" }],
    ["path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" }],
    ["line", { x1: "10", x2: "10", y1: "11", y2: "17" }],
    ["line", { x1: "14", x2: "14", y1: "11", y2: "17" }]
  ];
  J(o, e.spread_props({ name: "trash-2" }, () => l, {
    get iconNode() {
      return i;
    },
    children: (d, g) => {
      var a = e.comment(), u = e.first_child(a);
      e.snippet(u, () => t.children ?? e.noop), e.append(d, a);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function Je(o, t) {
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
  let l = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const i = [
    [
      "path",
      {
        d: "m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72"
      }
    ],
    ["path", { d: "m14 7 3 3" }],
    ["path", { d: "M5 6v4" }],
    ["path", { d: "M19 14v4" }],
    ["path", { d: "M10 2v2" }],
    ["path", { d: "M7 8H3" }],
    ["path", { d: "M21 16h-4" }],
    ["path", { d: "M11 3H9" }]
  ];
  J(o, e.spread_props({ name: "wand-sparkles" }, () => l, {
    get iconNode() {
      return i;
    },
    children: (d, g) => {
      var a = e.comment(), u = e.first_child(a);
      e.snippet(u, () => t.children ?? e.noop), e.append(d, a);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
let $t = 0;
var je;
class St {
  constructor() {
    Xe(this, je, e.state(e.proxy([])));
  }
  get items() {
    return e.get(Fe(this, je));
  }
  set items(t) {
    e.set(Fe(this, je), t, !0);
  }
  add(t, l, i = 5e3) {
    const d = ++$t;
    return this.items.push({ id: d, type: t, message: l }), i > 0 && setTimeout(() => this.remove(d), i), d;
  }
  remove(t) {
    this.items = this.items.filter((l) => l.id !== t);
  }
  success(t) {
    return this.add("success", t);
  }
  error(t) {
    return this.add("error", t, 8e3);
  }
  warning(t) {
    return this.add("warning", t);
  }
  info(t) {
    return this.add("info", t);
  }
}
je = new WeakMap();
const $e = new St();
var Nt = e.from_html("<button><!> </button>"), Mt = e.from_html('<div role="button" tabindex="0"><!> <span class="flex-1 text-xs truncate"> </span> <button class="btn btn-ghost btn-xs text-error opacity-0 hover:opacity-100 group-hover:opacity-100"><!></button></div>'), At = e.from_html('<p class="text-xs text-center text-base-content/40 py-4">No chats yet</p>'), Ct = e.from_html('<div class="p-2"><button class="btn btn-primary btn-sm w-full gap-1"><!> New Chat</button></div> <div class="flex-1 overflow-y-auto p-2 space-y-1"><!> <!></div>', 1), zt = e.from_html('<p class="text-xs text-base-content/50 mt-0.5"> </p>'), Pt = e.from_html('<div class="card bg-base-100 shadow-sm"><div class="card-body p-3 gap-1"><div class="flex items-start justify-between gap-1"><div><p class="font-semibold text-xs"> </p> <!></div> <span class="badge badge-xs badge-outline"> </span></div> <button class="btn btn-xs btn-primary mt-1"><!> Run</button></div></div>'), qt = e.from_html('<p class="text-xs text-center text-base-content/40 py-4">No templates</p>'), It = e.from_html('<div class="flex-1 overflow-y-auto p-2 space-y-2"><!> <!></div>'), jt = e.from_html('<span class="loading loading-spinner loading-xs"></span>'), Tt = e.from_html('<div class="flex-1 p-3 space-y-3"><p class="text-xs text-base-content/60">Caută semantic în colecțiile cu AI Search activat.</p> <div class="form-control"><label class="label py-1" for="ai-search-collection"><span class="label-text text-xs">Colecție</span></label> <input id="ai-search-collection" type="text" class="input input-xs" placeholder="ex: articles"/></div> <div class="form-control"><label class="label py-1" for="ai-search-query"><span class="label-text text-xs">Query semantic</span></label> <textarea id="ai-search-query" class="textarea textarea-xs resize-none" placeholder="ex: articole despre machine learning în producție"></textarea></div> <button class="btn btn-primary btn-sm w-full"><!> Caută</button></div>'), Et = e.from_html('<span class="badge badge-xs badge-primary">default</span>'), Lt = e.from_html('<div class="card bg-base-100 shadow-sm mb-2"><div class="card-body p-3 gap-1"><div class="flex items-center gap-2"><span class="font-semibold text-xs"> </span> <!></div> <p class="text-xs font-mono text-base-content/50"> </p></div></div>'), Ht = e.from_html('<input type="text" placeholder="Label" class="input input-xs"/>'), Rt = e.from_html('<input type="password" placeholder="API Key" class="input input-xs"/>'), Gt = e.from_html('<input type="text" placeholder="Base URL" class="input input-xs"/>'), Dt = e.from_html('<div class="card bg-base-100 shadow-sm"><div class="card-body p-3 gap-2"><select class="select select-xs"><option>OpenAI</option><option>Anthropic</option><option>Ollama (local)</option><option>Custom</option></select> <!> <!> <!> <input type="text" placeholder="Default model" class="input input-xs"/> <label class="flex items-center gap-2 text-xs cursor-pointer"><input type="checkbox" class="checkbox checkbox-xs"/> Set as default</label> <div class="flex gap-1"><button class="btn btn-primary btn-xs flex-1"> </button> <button class="btn btn-ghost btn-xs">Cancel</button></div></div></div>'), Ot = e.from_html('<div class="flex-1 overflow-y-auto p-3 space-y-3"><div><p class="text-xs font-semibold text-base-content/60 uppercase mb-2">AI Providers</p> <!> <button class="btn btn-sm btn-outline w-full"><!> Add Provider</button></div> <!></div>'), Qt = e.from_html('<span class="loading loading-spinner loading-xs"></span>'), Vt = e.from_html('<div class="flex-1 p-3 space-y-3"><p class="text-xs text-base-content/60">Ask in natural language — get SQL + results.</p> <textarea class="textarea textarea-xs w-full resize-none" placeholder="ex: Show me the 10 most recent users who signed up this month"></textarea> <button class="btn btn-primary btn-sm w-full"><!> Run Query</button></div>'), Bt = e.from_html('<span class="loading loading-spinner loading-xs"></span>'), Wt = e.from_html('<div class="flex-1 p-3 space-y-3"><p class="text-xs text-base-content/60">Describe your data model — AI generates the schema.</p> <textarea class="textarea textarea-xs w-full resize-none" placeholder="ex: A blog with posts (title, content, status), authors (name, bio), and tags"></textarea> <button class="btn btn-primary btn-sm w-full"><!> Generate Schema</button></div>'), Ft = e.from_html('<p class="text-sm text-warning mt-2">No AI provider configured. <button class="underline">Add one here →</button></p>'), Ut = e.from_html('<button class="text-left p-3 rounded-lg border border-base-300 text-xs text-base-content/60 hover:border-primary/40 hover:text-base-content transition-all"> </button>'), Jt = e.from_html('<button class="btn btn-primary btn-sm"><!> New Chat</button>'), Kt = e.from_html('<div class="flex-1 flex flex-col items-center justify-center gap-6 p-8"><div class="p-4 rounded-2xl bg-primary/5"><!></div> <div class="text-center max-w-sm"><h2 class="font-semibold text-lg">AI Studio</h2> <p class="text-sm text-base-content/50 mt-1">Chat with your data, generate schemas, run SQL queries, and search semantically.</p> <!></div> <div class="grid grid-cols-2 gap-2 w-full max-w-md"></div> <!></div>'), Yt = e.from_html('<div class="text-center text-base-content/40 py-8"><!> <p>Send a message to start the conversation</p></div>'), Zt = e.from_html('<div class="w-7 h-7 bg-primary/20 rounded-full flex items-center justify-center shrink-0 mt-1"><!></div>'), Xt = e.from_html('<div><!> <div class="max-w-xl"><div><p class="text-sm whitespace-pre-wrap"> </p></div></div></div>'), ea = e.from_html('<div class="flex justify-start gap-2"><div class="w-7 h-7 bg-primary/20 rounded-full flex items-center justify-center shrink-0"><!></div> <div class="bg-base-200 rounded-2xl rounded-tl-none px-4 py-3"><span class="loading loading-dots loading-sm"></span></div></div>'), ta = e.from_html('<div class="p-4 border-t border-base-300"><div class="flex gap-2 items-end"><textarea placeholder="Type a message… (Enter to send, Shift+Enter for newline)" class="textarea flex-1 resize-none min-h-11 max-h-32 text-sm"></textarea> <button class="btn btn-primary btn-sm h-11"><!></button></div></div>'), aa = e.from_html('<div class="flex-1 overflow-y-auto p-4 space-y-4"><!> <!> <!></div> <!>', 1), sa = e.from_html('<div class="alert alert-error mb-4 text-sm"> </div>'), ra = e.from_html('<div class="flex justify-center py-12"><span class="loading loading-spinner loading-lg text-primary"></span></div>'), ia = e.from_html('<div class="flex gap-2 text-sm mb-0.5"><span class="text-base-content/50 shrink-0 font-medium"> </span> <span class="truncate"> </span></div>'), la = e.from_html('<div class="badge badge-primary badge-outline shrink-0 text-xs"> </div>'), na = e.from_html('<div class="card bg-base-200 hover:bg-base-300 transition-colors"><div class="card-body p-4"><div class="flex items-start justify-between gap-2"><div class="flex-1 min-w-0"><p class="font-mono text-xs text-base-content/50 mb-1"> </p> <!></div> <!></div></div></div>'), oa = e.from_html('<div class="space-y-3"><p class="text-sm text-base-content/60"> <strong> </strong> în <code class="text-primary"> </code></p> <!></div>'), da = e.from_html('<div class="flex flex-col items-center justify-center py-16 text-base-content/40 gap-3"><!> <p>Niciun rezultat. Verifică că AI Search e activat pe colecție.</p></div>'), ca = e.from_html(`<div class="flex flex-col items-center justify-center py-16 text-base-content/40 gap-3"><!> <p class="text-lg font-semibold">Semantic Search</p> <p class="text-sm text-center max-w-sm">Introdu o colecție și un query în sidebar pentru a căuta semantic în recorduri.
 AI Search trebuie activat pe colecție (Collections → AI Search tab).</p></div>`), pa = e.from_html('<div class="flex-1 overflow-y-auto p-6"><!> <!></div>'), va = e.from_html('<div class="flex justify-center py-12"><span class="loading loading-spinner loading-lg text-primary"></span></div>'), ha = e.from_html("<th> </th>"), _a = e.from_html('<td class="max-w-xs truncate"> </td>'), ga = e.from_html("<tr></tr>"), ua = e.from_html('<div class="overflow-x-auto rounded-lg border border-base-300"><table class="table table-xs table-zebra"><thead><tr></tr></thead><tbody></tbody></table></div> <p class="text-xs text-base-content/40"> </p>', 1), ma = e.from_html('<p class="text-sm text-base-content/40 text-center py-4">No rows returned</p>'), fa = e.from_html('<div class="space-y-4"><div class="rounded-lg bg-base-200 p-4"><p class="text-xs font-semibold text-base-content/50 uppercase mb-2">Generated SQL</p> <pre class="text-xs font-mono whitespace-pre-wrap text-primary"> </pre></div> <!></div>'), xa = e.from_html('<div class="flex flex-col items-center justify-center h-full text-base-content/40 gap-3"><!> <p class="text-lg font-semibold">AI Query Builder</p> <p class="text-sm text-center max-w-sm">Type a question in plain language — AI generates and runs the SQL read-only query.</p></div>'), ba = e.from_html('<div class="flex-1 overflow-auto p-6"><!></div>'), ya = e.from_html('<div class="flex justify-center py-12"><span class="loading loading-spinner loading-lg text-primary"></span></div>'), wa = e.from_html('<tr><td class="font-mono text-xs"> </td><td><span class="badge badge-sm badge-outline"> </span></td><td class="text-sm"> </td><td> </td><td> </td></tr>'), ka = e.from_html('<div class="space-y-4"><div class="flex items-center justify-between"><h2 class="font-bold text-lg">Generated: <code class="text-primary"> </code></h2> <div class="flex gap-2"><button class="btn btn-ghost btn-sm">Discard</button> <button class="btn btn-primary btn-sm"><!> Create Collection</button></div></div> <div class="overflow-x-auto rounded-lg border border-base-300"><table class="table table-sm"><thead><tr><th>Field</th><th>Type</th><th>Label</th><th>Required</th><th>Unique</th></tr></thead><tbody></tbody></table></div> <details class="collapse collapse-arrow border border-base-300 rounded-lg"><summary class="collapse-title text-xs font-semibold">Raw JSON</summary> <div class="collapse-content"><pre class="text-xs font-mono whitespace-pre-wrap"> </pre></div></details></div>'), $a = e.from_html('<div class="flex flex-col items-center justify-center h-full text-base-content/40 gap-3"><!> <p class="text-lg font-semibold">Schema Generator</p> <p class="text-sm text-center max-w-sm">Describe your data model in plain language — AI generates the collection schema ready to apply.</p></div>'), Sa = e.from_html('<div class="flex-1 overflow-auto p-6"><!></div>'), Na = e.from_html('<div class="flex h-full -m-6"><aside class="w-64 border-r border-base-300 bg-base-200 flex flex-col shrink-0"><div class="px-2 pt-3 pb-2 space-y-0.5"></div> <div class="border-b border-base-300"></div> <!></aside> <div class="flex-1 flex flex-col bg-base-100"><!></div></div>');
function Ma(o, t) {
  e.push(t, !0);
  let l = e.state(e.proxy([])), i = e.state(e.proxy([])), d = e.state(e.proxy([])), g = e.state(null), a = e.state("chat");
  const u = [
    { id: "chat", label: "Chat", icon: bt },
    { id: "search", label: "Semantic Search", icon: De },
    { id: "query", label: "NL → SQL", icon: Ue },
    { id: "schema", label: "Schema Gen", icon: Je },
    { id: "templates", label: "Templates", icon: ut },
    { id: "settings", label: "Settings", icon: wt }
  ];
  let E = e.state(""), K = e.state(!1), I = e.state(e.proxy([])), L = e.state(""), j = e.state(""), N = e.state(e.proxy([])), q = e.state(!1), te = e.state(""), ce = e.state(""), Y = e.state(null), pe = e.state(!1), he = e.state(""), Z = e.state(null), fe = e.state(!1), ye = e.state(!1), H = e.state(e.proxy({
    name: "openai",
    label: "OpenAI",
    api_key: "",
    base_url: "",
    default_model: "",
    is_default: !1
  })), Se = e.state(!1);
  pt(async () => {
    await Te();
  });
  async function Te() {
    const [r, n, v] = await Promise.allSettled([
      ee.get("/api/ai/providers"),
      ee.get("/api/ai/chats"),
      ee.get("/api/ai/templates")
    ]);
    r.status === "fulfilled" && e.set(l, r.value.providers || [], !0), n.status === "fulfilled" && e.set(i, n.value.chats || [], !0), v.status === "fulfilled" && e.set(d, v.value.templates || [], !0);
  }
  async function Ae() {
    const r = await ee.post("/api/ai/chats", { title: "New Chat" });
    e.set(i, [r.chat, ...e.get(i)], !0), await ze(r.chat);
  }
  async function ze(r) {
    const n = await ee.get(`/api/ai/chats/${r.id}`);
    e.set(g, n.chat, !0), e.set(I, n.chat.messages || [], !0);
  }
  async function Ee() {
    if (!e.get(E).trim() || !e.get(g) || e.get(K)) return;
    const r = e.get(E).trim();
    e.set(E, ""), e.set(K, !0), e.set(I, [...e.get(I), { role: "user", content: r }], !0);
    try {
      const n = await ee.post(`/api/ai/chats/${e.get(g).id}/messages`, { content: r });
      e.set(I, [...e.get(I), n.message], !0);
      const v = e.get(i).map((f) => f.id === e.get(g).id ? { ...f, title: r.slice(0, 60) } : f);
      e.set(i, v, !0);
    } catch (n) {
      e.set(I, e.get(
        I
        // remove optimistic user message
      ).slice(0, -1), !0), $e.error("Error: " + n.message);
    } finally {
      e.set(K, !1);
    }
  }
  async function Oe(r) {
    var n;
    await ee.delete(`/api/ai/chats/${r}`), e.set(i, e.get(i).filter((v) => v.id !== r), !0), ((n = e.get(g)) == null ? void 0 : n.id) === r && (e.set(g, null), e.set(I, [], !0));
  }
  async function M() {
    e.set(Se, !0);
    try {
      await ee.post("/api/ai/admin/providers", e.get(H)), await Te(), e.set(ye, !1), e.set(
        H,
        {
          name: "openai",
          label: "OpenAI",
          api_key: "",
          base_url: "",
          default_model: "",
          is_default: !1
        },
        !0
      );
    } catch (r) {
      $e.error(r.message);
    } finally {
      e.set(Se, !1);
    }
  }
  async function V() {
    if (!(!e.get(L).trim() || !e.get(j).trim())) {
      e.set(q, !0), e.set(te, ""), e.set(N, [], !0);
      try {
        const r = await ee.post("/api/ai/search", {
          collection: e.get(L).trim(),
          query: e.get(j).trim(),
          limit: 10
        });
        e.set(N, r.results || [], !0);
      } catch (r) {
        e.set(te, r.message || "Search failed", !0);
      } finally {
        e.set(q, !1);
      }
    }
  }
  async function ae() {
    if (!(!e.get(ce).trim() || e.get(pe))) {
      e.set(pe, !0), e.set(Y, null);
      try {
        const r = await ee.post("/api/ai/query", { prompt: e.get(ce).trim() });
        e.set(Y, r, !0);
      } catch (r) {
        $e.error(r.message ?? "Query failed");
      } finally {
        e.set(pe, !1);
      }
    }
  }
  async function se() {
    if (!(!e.get(he).trim() || e.get(fe))) {
      e.set(fe, !0), e.set(Z, null);
      try {
        const r = await ee.post("/api/ai/schema-gen", { description: e.get(he).trim() });
        e.set(Z, r.schema, !0);
      } catch (r) {
        $e.error(r.message ?? "Schema generation failed");
      } finally {
        e.set(fe, !1);
      }
    }
  }
  async function xe() {
    if (e.get(Z))
      try {
        await ee.post("/api/collections", e.get(Z)), $e.success(`Collection "${e.get(Z).name}" created!`), e.set(Z, null), e.set(he, "");
      } catch (r) {
        $e.error(r.message ?? "Failed to create collection");
      }
  }
  async function we(r) {
    const n = {}, v = typeof r.variables == "string" ? JSON.parse(r.variables) : r.variables || [];
    for (const k of v) {
      const b = prompt(`Enter value for "${k.name}":`);
      b !== null && (n[k.name] = b);
    }
    const f = await ee.post(`/api/ai/templates/${r.id}/run`, { variables: n });
    e.set(
      I,
      [
        {
          role: "user",
          content: `[Template: ${r.name}]
${Object.entries(n).map(([k, b]) => `${k}: ${b}`).join(`
`)}`
        },
        { role: "assistant", content: f.result.content }
      ],
      !0
    ), e.set(g, null), e.set(a, "chat");
  }
  var ne = Na(), _e = e.child(ne), be = e.child(_e);
  e.each(be, 21, () => u, e.index, (r, n) => {
    var v = Nt(), f = e.child(v);
    e.component(f, () => e.get(n).icon, (b, h) => {
      h(b, { size: 14, class: "shrink-0" });
    });
    var k = e.sibling(f);
    e.reset(v), e.template_effect(() => {
      e.set_class(v, 1, `w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12px] font-medium transition-colors
           ${e.get(a) === e.get(n).id ? "bg-primary/10 text-primary" : "text-base-content/60 hover:bg-base-200 hover:text-base-content"}`), e.set_text(k, ` ${e.get(n).label ?? ""}`);
    }), e.delegated("click", v, () => e.set(a, e.get(n).id, !0)), e.append(r, v);
  }), e.reset(be);
  var ge = e.sibling(be, 4);
  {
    var W = (r) => {
      var n = Ct(), v = e.first_child(n), f = e.child(v), k = e.child(f);
      Ge(k, { size: 14 }), e.next(), e.reset(f), e.reset(v);
      var b = e.sibling(v, 2), h = e.child(b);
      e.each(h, 17, () => e.get(i), e.index, (_, s) => {
        var p = Mt(), m = e.child(p);
        Re(m, { size: 14, class: "shrink-0 text-base-content/50" });
        var w = e.sibling(m, 2), A = e.child(w, !0);
        e.reset(w);
        var x = e.sibling(w, 2), y = e.child(x);
        kt(y, { size: 10 }), e.reset(x), e.reset(p), e.template_effect(() => {
          var S;
          e.set_class(p, 1, `flex items-center gap-2 p-2 rounded-lg hover:bg-base-300 cursor-pointer ${((S = e.get(g)) == null ? void 0 : S.id) === e.get(s).id ? "bg-base-300" : ""}`), e.set_text(A, e.get(s).title || "New Chat");
        }), e.delegated("click", p, () => ze(e.get(s))), e.delegated("keydown", p, (S) => (S.key === "Enter" || S.key === " ") && ze(e.get(s))), e.delegated("click", x, (S) => {
          S.stopPropagation(), Oe(e.get(s).id);
        }), e.append(_, p);
      });
      var c = e.sibling(h, 2);
      {
        var $ = (_) => {
          var s = At();
          e.append(_, s);
        };
        e.if(c, (_) => {
          e.get(i).length === 0 && _($);
        });
      }
      e.reset(b), e.delegated("click", f, Ae), e.append(r, n);
    }, R = (r) => {
      var n = It(), v = e.child(n);
      e.each(v, 17, () => e.get(d), e.index, (b, h) => {
        var c = Pt(), $ = e.child(c), _ = e.child($), s = e.child(_), p = e.child(s), m = e.child(p, !0);
        e.reset(p);
        var w = e.sibling(p, 2);
        {
          var A = (z) => {
            var P = zt(), B = e.child(P, !0);
            e.reset(P), e.template_effect(() => e.set_text(B, e.get(h).description)), e.append(z, P);
          };
          e.if(w, (z) => {
            e.get(h).description && z(A);
          });
        }
        e.reset(s);
        var x = e.sibling(s, 2), y = e.child(x, !0);
        e.reset(x), e.reset(_);
        var S = e.sibling(_, 2), G = e.child(S);
        at(G, { size: 10 }), e.next(), e.reset(S), e.reset($), e.reset(c), e.template_effect(() => {
          e.set_text(m, e.get(h).name), e.set_text(y, e.get(h).category);
        }), e.delegated("click", S, () => we(e.get(h))), e.append(b, c);
      });
      var f = e.sibling(v, 2);
      {
        var k = (b) => {
          var h = qt();
          e.append(b, h);
        };
        e.if(f, (b) => {
          e.get(d).length === 0 && b(k);
        });
      }
      e.reset(n), e.append(r, n);
    }, X = (r) => {
      var n = Tt(), v = e.sibling(e.child(n), 2), f = e.sibling(e.child(v), 2);
      e.remove_input_defaults(f), e.reset(v);
      var k = e.sibling(v, 2), b = e.sibling(e.child(k), 2);
      e.remove_textarea_child(b), e.set_attribute(b, "rows", 3), e.reset(k);
      var h = e.sibling(k, 2), c = e.child(h);
      {
        var $ = (s) => {
          var p = jt();
          e.append(s, p);
        }, _ = (s) => {
          De(s, { size: 12 });
        };
        e.if(c, (s) => {
          e.get(q) ? s($) : s(_, -1);
        });
      }
      e.next(), e.reset(h), e.reset(n), e.template_effect(() => h.disabled = e.get(q) || !e.get(L) || !e.get(j)), e.bind_value(f, () => e.get(L), (s) => e.set(L, s)), e.bind_value(b, () => e.get(j), (s) => e.set(j, s)), e.delegated("click", h, V), e.append(r, n);
    }, oe = (r) => {
      var n = Ot(), v = e.child(n), f = e.sibling(e.child(v), 2);
      e.each(f, 17, () => e.get(l), e.index, ($, _) => {
        var s = Lt(), p = e.child(s), m = e.child(p), w = e.child(m), A = e.child(w, !0);
        e.reset(w);
        var x = e.sibling(w, 2);
        {
          var y = (z) => {
            var P = Et();
            e.append(z, P);
          };
          e.if(x, (z) => {
            e.get(_).isDefault && z(y);
          });
        }
        e.reset(m);
        var S = e.sibling(m, 2), G = e.child(S, !0);
        e.reset(S), e.reset(p), e.reset(s), e.template_effect(() => {
          e.set_text(A, e.get(_).label), e.set_text(G, e.get(_).name);
        }), e.append($, s);
      });
      var k = e.sibling(f, 2), b = e.child(k);
      Ge(b, { size: 14 }), e.next(), e.reset(k), e.reset(v);
      var h = e.sibling(v, 2);
      {
        var c = ($) => {
          var _ = Dt(), s = e.child(_), p = e.child(s), m = e.child(p);
          m.value = m.__value = "openai";
          var w = e.sibling(m);
          w.value = w.__value = "anthropic";
          var A = e.sibling(w);
          A.value = A.__value = "ollama";
          var x = e.sibling(A);
          x.value = x.__value = "custom", e.reset(p);
          var y = e.sibling(p, 2);
          {
            var S = (C) => {
              var Q = Ht();
              e.remove_input_defaults(Q), e.bind_value(Q, () => e.get(H).label, (le) => e.get(H).label = le), e.append(C, Q);
            };
            e.if(y, (C) => {
              e.get(H).name === "custom" && C(S);
            });
          }
          var G = e.sibling(y, 2);
          {
            var z = (C) => {
              var Q = Rt();
              e.remove_input_defaults(Q), e.bind_value(Q, () => e.get(H).api_key, (le) => e.get(H).api_key = le), e.append(C, Q);
            };
            e.if(G, (C) => {
              e.get(H).name !== "ollama" && C(z);
            });
          }
          var P = e.sibling(G, 2);
          {
            var B = (C) => {
              var Q = Gt();
              e.remove_input_defaults(Q), e.bind_value(Q, () => e.get(H).base_url, (le) => e.get(H).base_url = le), e.append(C, Q);
            };
            e.if(P, (C) => {
              (e.get(H).name === "ollama" || e.get(H).name === "custom") && C(B);
            });
          }
          var ie = e.sibling(P, 2);
          e.remove_input_defaults(ie);
          var F = e.sibling(ie, 2), D = e.child(F);
          e.remove_input_defaults(D), e.next(), e.reset(F);
          var O = e.sibling(F, 2), U = e.child(O), me = e.child(U, !0);
          e.reset(U);
          var de = e.sibling(U, 2);
          e.reset(O), e.reset(s), e.reset(_), e.template_effect(() => {
            U.disabled = e.get(Se), e.set_text(me, e.get(Se) ? "Saving…" : "Save");
          }), e.bind_select_value(p, () => e.get(H).name, (C) => e.get(H).name = C), e.bind_value(ie, () => e.get(H).default_model, (C) => e.get(H).default_model = C), e.bind_checked(D, () => e.get(H).is_default, (C) => e.get(H).is_default = C), e.delegated("click", U, M), e.delegated("click", de, () => e.set(ye, !1)), e.append($, _);
        };
        e.if(h, ($) => {
          e.get(ye) && $(c);
        });
      }
      e.reset(n), e.delegated("click", k, () => e.set(ye, !e.get(ye))), e.append(r, n);
    }, Ne = (r) => {
      var n = Vt(), v = e.sibling(e.child(n), 2);
      e.remove_textarea_child(v), e.set_attribute(v, "rows", 4);
      var f = e.sibling(v, 2), k = e.child(f);
      {
        var b = (c) => {
          var $ = Qt();
          e.append(c, $);
        }, h = (c) => {
          Ue(c, { size: 12 });
        };
        e.if(k, (c) => {
          e.get(pe) ? c(b) : c(h, -1);
        });
      }
      e.next(), e.reset(f), e.reset(n), e.template_effect((c) => f.disabled = c, [() => e.get(pe) || !e.get(ce).trim()]), e.delegated("keydown", v, (c) => {
        c.key === "Enter" && (c.metaKey || c.ctrlKey) && ae();
      }), e.bind_value(v, () => e.get(ce), (c) => e.set(ce, c)), e.delegated("click", f, ae), e.append(r, n);
    }, ke = (r) => {
      var n = Wt(), v = e.sibling(e.child(n), 2);
      e.remove_textarea_child(v), e.set_attribute(v, "rows", 5);
      var f = e.sibling(v, 2), k = e.child(f);
      {
        var b = (c) => {
          var $ = Bt();
          e.append(c, $);
        }, h = (c) => {
          Je(c, { size: 12 });
        };
        e.if(k, (c) => {
          e.get(fe) ? c(b) : c(h, -1);
        });
      }
      e.next(), e.reset(f), e.reset(n), e.template_effect((c) => f.disabled = c, [
        () => e.get(fe) || !e.get(he).trim()
      ]), e.bind_value(v, () => e.get(he), (c) => e.set(he, c)), e.delegated("click", f, se), e.append(r, n);
    };
    e.if(ge, (r) => {
      e.get(a) === "chat" ? r(W) : e.get(a) === "templates" ? r(R, 1) : e.get(a) === "search" ? r(X, 2) : e.get(a) === "settings" ? r(oe, 3) : e.get(a) === "query" ? r(Ne, 4) : e.get(a) === "schema" && r(ke, 5);
    });
  }
  e.reset(_e);
  var ue = e.sibling(_e, 2), re = e.child(ue);
  {
    var T = (r) => {
      var n = Kt(), v = e.child(n), f = e.child(v);
      Re(f, { size: 40, class: "text-primary/60" }), e.reset(v);
      var k = e.sibling(v, 2), b = e.sibling(e.child(k), 4);
      {
        var h = (s) => {
          var p = Ft(), m = e.sibling(e.child(p));
          e.reset(p), e.delegated("click", m, () => e.set(a, "settings")), e.append(s, p);
        };
        e.if(b, (s) => {
          e.get(l).length === 0 && s(h);
        });
      }
      e.reset(k);
      var c = e.sibling(k, 2);
      e.each(
        c,
        20,
        () => [
          "Show me all collections with their record counts",
          "Generate a schema for an e-commerce product catalog",
          "Find records where status is pending from the last 7 days",
          "What are the most active collections this week?"
        ],
        e.index,
        (s, p) => {
          var m = Ut(), w = e.child(m, !0);
          e.reset(m), e.template_effect(() => e.set_text(w, p)), e.delegated("click", m, async () => {
            e.get(g) || await Ae(), e.set(E, p, !0);
          }), e.append(s, m);
        }
      ), e.reset(c);
      var $ = e.sibling(c, 2);
      {
        var _ = (s) => {
          var p = Jt(), m = e.child(p);
          Ge(m, { size: 14 }), e.next(), e.reset(p), e.delegated("click", p, Ae), e.append(s, p);
        };
        e.if($, (s) => {
          e.get(g) || s(_);
        });
      }
      e.reset(n), e.append(r, n);
    }, ve = (r) => {
      var n = aa(), v = e.first_child(n), f = e.child(v);
      {
        var k = (s) => {
          var p = Yt(), m = e.child(p);
          at(m, { size: 32, class: "mx-auto mb-2 opacity-30" }), e.next(2), e.reset(p), e.append(s, p);
        };
        e.if(f, (s) => {
          e.get(I).length === 0 && s(k);
        });
      }
      var b = e.sibling(f, 2);
      e.each(b, 17, () => e.get(I), e.index, (s, p) => {
        var m = Xt(), w = e.child(m);
        {
          var A = (z) => {
            var P = Zt(), B = e.child(P);
            Re(B, { size: 14, class: "text-primary" }), e.reset(P), e.append(z, P);
          };
          e.if(w, (z) => {
            e.get(p).role !== "user" && z(A);
          });
        }
        var x = e.sibling(w, 2), y = e.child(x), S = e.child(y), G = e.child(S, !0);
        e.reset(S), e.reset(y), e.reset(x), e.reset(m), e.template_effect(() => {
          e.set_class(m, 1, `flex ${e.get(p).role === "user" ? "justify-end" : "justify-start"} gap-2`), e.set_class(y, 1, `rounded-2xl px-4 py-2.5 ${e.get(p).role === "user" ? "bg-primary text-primary-content rounded-tr-none" : "bg-base-200 rounded-tl-none"}`), e.set_text(G, e.get(p).content);
        }), e.append(s, m);
      });
      var h = e.sibling(b, 2);
      {
        var c = (s) => {
          var p = ea(), m = e.child(p), w = e.child(m);
          Re(w, { size: 14, class: "text-primary" }), e.reset(m), e.next(2), e.reset(p), e.append(s, p);
        };
        e.if(h, (s) => {
          e.get(K) && s(c);
        });
      }
      e.reset(v);
      var $ = e.sibling(v, 2);
      {
        var _ = (s) => {
          var p = ta(), m = e.child(p), w = e.child(m);
          e.remove_textarea_child(w), e.set_attribute(w, "rows", 1);
          var A = e.sibling(w, 2), x = e.child(A);
          yt(x, { size: 16 }), e.reset(A), e.reset(m), e.reset(p), e.template_effect((y) => A.disabled = y, [() => !e.get(E).trim() || e.get(K)]), e.delegated("keydown", w, (y) => {
            y.key === "Enter" && !y.shiftKey && (y.preventDefault(), Ee());
          }), e.bind_value(w, () => e.get(E), (y) => e.set(E, y)), e.delegated("click", A, Ee), e.append(s, p);
        };
        e.if($, (s) => {
          e.get(g) && s(_);
        });
      }
      e.append(r, n);
    }, Ce = (r) => {
      var n = pa(), v = e.child(n);
      {
        var f = (_) => {
          var s = sa(), p = e.child(s, !0);
          e.reset(s), e.template_effect(() => e.set_text(p, e.get(te))), e.append(_, s);
        };
        e.if(v, (_) => {
          e.get(te) && _(f);
        });
      }
      var k = e.sibling(v, 2);
      {
        var b = (_) => {
          var s = ra();
          e.append(_, s);
        }, h = (_) => {
          var s = oa(), p = e.child(s), m = e.child(p), w = e.sibling(m), A = e.child(w);
          e.reset(w);
          var x = e.sibling(w, 2), y = e.child(x, !0);
          e.reset(x), e.reset(p);
          var S = e.sibling(p, 2);
          e.each(S, 17, () => e.get(N), e.index, (G, z) => {
            var P = na(), B = e.child(P), ie = e.child(B), F = e.child(ie), D = e.child(F), O = e.child(D, !0);
            e.reset(D);
            var U = e.sibling(D, 2);
            e.each(
              U,
              17,
              () => Object.entries(e.get(z)).filter(([C]) => ![
                "id",
                "created_at",
                "updated_at",
                "created_by",
                "updated_by",
                "_score"
              ].includes(C)),
              e.index,
              (C, Q) => {
                var le = e.derived(() => e.to_array(e.get(Q), 2));
                let Ie = () => e.get(le)[0], Me = () => e.get(le)[1];
                var Le = e.comment(), He = e.first_child(Le);
                {
                  var Qe = (Ve) => {
                    var Be = ia(), We = e.child(Be), it = e.child(We);
                    e.reset(We);
                    var Ke = e.sibling(We, 2), lt = e.child(Ke, !0);
                    e.reset(Ke), e.reset(Be), e.template_effect(
                      (nt) => {
                        e.set_text(it, `${Ie() ?? ""}:`), e.set_text(lt, nt);
                      },
                      [() => String(Me()).slice(0, 200)]
                    ), e.append(Ve, Be);
                  }, rt = e.derived(() => Me() != null && String(Me()).length > 0);
                  e.if(He, (Ve) => {
                    e.get(rt) && Ve(Qe);
                  });
                }
                e.append(C, Le);
              }
            ), e.reset(F);
            var me = e.sibling(F, 2);
            {
              var de = (C) => {
                var Q = la(), le = e.child(Q);
                e.reset(Q), e.template_effect((Ie) => e.set_text(le, `${Ie ?? ""}%`), [() => (e.get(z)._score * 100).toFixed(1)]), e.append(C, Q);
              };
              e.if(me, (C) => {
                e.get(z)._score != null && C(de);
              });
            }
            e.reset(ie), e.reset(B), e.reset(P), e.template_effect(() => e.set_text(O, e.get(z).id)), e.append(G, P);
          }), e.reset(s), e.template_effect(() => {
            e.set_text(m, `${e.get(N).length ?? ""} rezultate pentru `), e.set_text(A, `"${e.get(j) ?? ""}"`), e.set_text(y, e.get(L));
          }), e.append(_, s);
        }, c = (_) => {
          var s = da(), p = e.child(s);
          De(p, { size: 40, class: "opacity-20" }), e.next(2), e.reset(s), e.append(_, s);
        }, $ = (_) => {
          var s = ca(), p = e.child(s);
          De(p, { size: 48, class: "opacity-20" }), e.next(4), e.reset(s), e.append(_, s);
        };
        e.if(k, (_) => {
          e.get(q) ? _(b) : e.get(N).length > 0 ? _(h, 1) : e.get(j) && !e.get(q) ? _(c, 2) : _($, -1);
        });
      }
      e.reset(n), e.append(r, n);
    }, Pe = (r) => {
      var n = ba(), v = e.child(n);
      {
        var f = (h) => {
          var c = va();
          e.append(h, c);
        }, k = (h) => {
          var c = fa(), $ = e.child(c), _ = e.sibling(e.child($), 2), s = e.child(_, !0);
          e.reset(_), e.reset($);
          var p = e.sibling($, 2);
          {
            var m = (A) => {
              var x = ua(), y = e.first_child(x), S = e.child(y), G = e.child(S), z = e.child(G);
              e.each(z, 21, () => e.get(Y).columns, e.index, (F, D) => {
                var O = ha(), U = e.child(O, !0);
                e.reset(O), e.template_effect(() => e.set_text(U, e.get(D))), e.append(F, O);
              }), e.reset(z), e.reset(G);
              var P = e.sibling(G);
              e.each(P, 21, () => e.get(Y).data, e.index, (F, D) => {
                var O = ga();
                e.each(O, 21, () => e.get(Y).columns, e.index, (U, me) => {
                  var de = _a(), C = e.child(de, !0);
                  e.reset(de), e.template_effect(() => e.set_text(C, e.get(D)[e.get(me)] ?? "")), e.append(U, de);
                }), e.reset(O), e.append(F, O);
              }), e.reset(P), e.reset(S), e.reset(y);
              var B = e.sibling(y, 2), ie = e.child(B);
              e.reset(B), e.template_effect(() => e.set_text(ie, `${e.get(Y).data.length ?? ""} row(s) returned`)), e.append(A, x);
            }, w = (A) => {
              var x = ma();
              e.append(A, x);
            };
            e.if(p, (A) => {
              e.get(Y).data.length > 0 ? A(m) : A(w, -1);
            });
          }
          e.reset(c), e.template_effect(() => e.set_text(s, e.get(Y).sql)), e.append(h, c);
        }, b = (h) => {
          var c = xa(), $ = e.child(c);
          Ue($, { size: 48, class: "opacity-20" }), e.next(4), e.reset(c), e.append(h, c);
        };
        e.if(v, (h) => {
          e.get(pe) ? h(f) : e.get(Y) ? h(k, 1) : h(b, -1);
        });
      }
      e.reset(n), e.append(r, n);
    }, qe = (r) => {
      var n = Sa(), v = e.child(n);
      {
        var f = (h) => {
          var c = ya();
          e.append(h, c);
        }, k = (h) => {
          var c = ka(), $ = e.child(c), _ = e.child($), s = e.sibling(e.child(_)), p = e.child(s, !0);
          e.reset(s), e.reset(_);
          var m = e.sibling(_, 2), w = e.child(m), A = e.sibling(w, 2), x = e.child(A);
          Ge(x, { size: 14 }), e.next(), e.reset(A), e.reset(m), e.reset($);
          var y = e.sibling($, 2), S = e.child(y), G = e.sibling(e.child(S));
          e.each(G, 21, () => e.get(Z).fields || [], e.index, (F, D) => {
            var O = wa(), U = e.child(O), me = e.child(U, !0);
            e.reset(U);
            var de = e.sibling(U), C = e.child(de), Q = e.child(C, !0);
            e.reset(C), e.reset(de);
            var le = e.sibling(de), Ie = e.child(le, !0);
            e.reset(le);
            var Me = e.sibling(le), Le = e.child(Me, !0);
            e.reset(Me);
            var He = e.sibling(Me), Qe = e.child(He, !0);
            e.reset(He), e.reset(O), e.template_effect(() => {
              e.set_text(me, e.get(D).name), e.set_text(Q, e.get(D).type), e.set_text(Ie, e.get(D).label || ""), e.set_text(Le, e.get(D).required ? "✓" : ""), e.set_text(Qe, e.get(D).unique ? "✓" : "");
            }), e.append(F, O);
          }), e.reset(G), e.reset(S), e.reset(y);
          var z = e.sibling(y, 2), P = e.sibling(e.child(z), 2), B = e.child(P), ie = e.child(B, !0);
          e.reset(B), e.reset(P), e.reset(z), e.reset(c), e.template_effect(
            (F) => {
              e.set_text(p, e.get(Z).name), e.set_text(ie, F);
            },
            [() => JSON.stringify(e.get(Z), null, 2)]
          ), e.delegated("click", w, () => e.set(Z, null)), e.delegated("click", A, xe), e.append(h, c);
        }, b = (h) => {
          var c = $a(), $ = e.child(c);
          Je($, { size: 48, class: "opacity-20" }), e.next(4), e.reset(c), e.append(h, c);
        };
        e.if(v, (h) => {
          e.get(fe) ? h(f) : e.get(Z) ? h(k, 1) : h(b, -1);
        });
      }
      e.reset(n), e.append(r, n);
    };
    e.if(re, (r) => {
      e.get(a) === "chat" && (!e.get(g) || e.get(I).length === 0) ? r(T) : e.get(a) === "chat" ? r(ve, 1) : e.get(a) === "search" ? r(Ce, 2) : e.get(a) === "query" ? r(Pe, 3) : e.get(a) === "schema" && r(qe, 4);
    });
  }
  e.reset(ue), e.reset(ne), e.append(o, ne), e.pop();
}
e.delegate(["click", "keydown"]);
var Aa = e.from_html('<span class="badge badge-ghost badge-sm font-mono"> </span>'), Ca = e.from_html('<p class="text-sm text-base-content/50 mt-0.5"> </p>'), za = e.from_html('<div class="flex items-start justify-between gap-4 mb-6"><div><div class="flex items-center gap-2.5"><h1 class="text-xl font-semibold text-base-content"> </h1> <!></div> <!></div> <!></div>');
function Pa(o, t) {
  e.push(t, !0);
  var l = za(), i = e.child(l), d = e.child(i), g = e.child(d), a = e.child(g, !0);
  e.reset(g);
  var u = e.sibling(g, 2);
  {
    var E = (N) => {
      var q = Aa(), te = e.child(q, !0);
      e.reset(q), e.template_effect((ce) => e.set_text(te, ce), [() => t.count.toLocaleString()]), e.append(N, q);
    };
    e.if(u, (N) => {
      t.count !== void 0 && t.count !== null && N(E);
    });
  }
  e.reset(d);
  var K = e.sibling(d, 2);
  {
    var I = (N) => {
      var q = Ca(), te = e.child(q, !0);
      e.reset(q), e.template_effect(() => e.set_text(te, t.subtitle)), e.append(N, q);
    };
    e.if(K, (N) => {
      t.subtitle && N(I);
    });
  }
  e.reset(i);
  var L = e.sibling(i, 2);
  {
    var j = (N) => {
      var q = e.comment(), te = e.first_child(q);
      e.snippet(te, () => t.children), e.append(N, q);
    };
    e.if(L, (N) => {
      t.children && N(j);
    });
  }
  e.reset(l), e.template_effect(() => e.set_text(a, t.title)), e.append(o, l), e.pop();
}
var qa = e.from_html('<a class="text-base-content/60 hover:text-base-content"> </a>'), Ia = e.from_html('<span class="text-base-content font-medium"> </span>'), ja = e.from_html("<li><!></li>"), Ta = e.from_html("<div><ul></ul></div>");
function Ea(o, t) {
  e.push(t, !0);
  let l = e.prop(t, "class", 3, "");
  var i = Ta(), d = e.child(i);
  e.each(d, 21, () => t.crumbs, e.index, (g, a, u) => {
    var E = ja(), K = e.child(E);
    {
      var I = (j) => {
        var N = qa(), q = e.child(N, !0);
        e.reset(N), e.template_effect(() => {
          e.set_attribute(N, "href", e.get(a).href), e.set_text(q, e.get(a).label);
        }), e.append(j, N);
      }, L = (j) => {
        var N = Ia(), q = e.child(N, !0);
        e.reset(N), e.template_effect(() => e.set_text(q, e.get(a).label)), e.append(j, N);
      };
      e.if(K, (j) => {
        e.get(a).href && u < t.crumbs.length - 1 ? j(I) : j(L, -1);
      });
    }
    e.reset(E), e.append(g, E);
  }), e.reset(d), e.reset(i), e.template_effect(() => e.set_class(i, 1, `breadcrumbs text-sm ${l() ?? ""}`)), e.append(o, i), e.pop();
}
var La = e.from_html("<!> Generating preview...", 1), Ha = e.from_html("<!> Preview Schema", 1), Ra = e.from_html('<div class="space-y-4"><div><label class="mb-1 block text-sm font-medium text-gray-700" for="desc">Application description</label> <textarea id="desc" placeholder="E.g. A project management app with teams, projects, tasks, comments, and file attachments. Tasks have priority, due date, and status. Team members can be assigned to tasks." class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"></textarea> <p class="mt-1 text-xs text-gray-400"> </p></div> <button class="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"><!></button></div>'), Ga = e.from_html('<p class="text-xs text-gray-500 mt-0.5"> </p>'), Da = e.from_html('<tr><td class="py-1 font-mono"> </td><td class="py-1"><span class="rounded bg-blue-100 px-1.5 py-0.5 text-blue-700"> </span></td><td class="py-1 text-gray-500"> </td></tr>'), Oa = e.from_html('<div class="border-t border-gray-100 bg-gray-50 px-4 py-2"><table class="w-full text-xs"><thead><tr class="text-gray-400"><th class="py-1 text-left font-medium">Field</th><th class="py-1 text-left font-medium">Type</th><th class="py-1 text-left font-medium">Required</th></tr></thead><tbody class="divide-y divide-gray-100"></tbody></table></div>'), Qa = e.from_html('<div><button class="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50"><div><span class="font-medium text-sm"> </span> <code class="ml-2 text-xs text-gray-400"> </code> <!></div> <div class="flex items-center gap-2 text-xs text-gray-400"><span> </span> <!></div></button> <!></div>'), Va = e.from_html("<!> Creating...", 1), Ba = e.from_html("<!> Create Schema", 1), Wa = e.from_html('<div class="space-y-4"><div class="flex gap-4 rounded-lg border border-purple-100 bg-purple-50 px-4 py-3 text-sm"><div><span class="font-semibold text-purple-700"> </span> <span class="text-gray-600">collections</span></div> <div><span class="font-semibold text-purple-700"> </span> <span class="text-gray-600">total fields</span></div> <div class="ml-auto text-xs text-gray-400">Token valid 10 min</div></div> <div class="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white"></div> <div class="flex gap-3"><button class="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"><!> Back</button> <button class="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"><!></button></div></div>'), Fa = e.from_html('<code class="rounded bg-green-100 px-2 py-0.5 text-xs text-green-800"> </code>'), Ua = e.from_html('<div class="mt-3"><p class="text-sm font-medium text-green-800 mb-1"> </p> <div class="flex flex-wrap gap-1"></div></div>'), Ja = e.from_html('<code class="rounded bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800"> </code>'), Ka = e.from_html('<div class="mt-2"><p class="text-sm font-medium text-yellow-700 mb-1">Skipped (already exist):</p> <div class="flex flex-wrap gap-1"></div></div>'), Ya = e.from_html('<div class="space-y-4"><div class="rounded-lg border border-green-200 bg-green-50 px-4 py-4"><div class="flex items-center gap-2 text-green-700"><!> <span class="font-semibold">Schema created successfully</span></div> <!> <!></div> <div class="flex gap-3"><a href="/collections" class="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700">View Collections</a> <button class="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Generate Another</button></div></div>'), Za = e.from_html('<div class="mx-auto max-w-3xl space-y-6 p-6"><!> <!> <div class="flex items-center gap-2 text-sm"><span>1. Describe</span> <span class="text-gray-300">→</span> <span>2. Review</span> <span class="text-gray-300">→</span> <span>3. Done</span></div> <!> <!> <!></div>');
function Xa(o, t) {
  e.push(t, !0);
  const l = "";
  let i = e.state("input"), d = e.state(""), g = e.state(!1), a = e.state(null), u = e.state(""), E = e.state(0), K = e.state(0), I = e.state(e.proxy(/* @__PURE__ */ new Set())), L = e.state(e.proxy([])), j = e.state(e.proxy([]));
  async function N() {
    if (e.get(d).trim()) {
      e.set(g, !0);
      try {
        const M = await ee.post("/api/ai/preview-schema", { description: e.get(d) });
        e.set(a, M.preview, !0), e.set(u, M.confirm_token, !0), e.set(E, M.collections_count, !0), e.set(K, M.estimated_fields, !0), M.preview.collections.length > 0 && e.set(I, /* @__PURE__ */ new Set([M.preview.collections[0].name]), !0), e.set(i, "preview");
      } catch (M) {
        $e.error(M.message ?? "Preview generation failed");
      } finally {
        e.set(g, !1);
      }
    }
  }
  async function q() {
    e.set(g, !0);
    try {
      const M = await ee.post("/api/ai/generate-schema", { confirm_token: e.get(u) });
      e.set(L, M.collections, !0), e.set(j, M.skipped, !0), e.set(i, "done");
    } catch (M) {
      $e.error(M.message ?? "Schema creation failed");
    } finally {
      e.set(g, !1);
    }
  }
  function te(M) {
    const V = new Set(e.get(I));
    V.has(M) ? V.delete(M) : V.add(M), e.set(I, V, !0);
  }
  function ce() {
    e.set(i, "input"), e.set(d, ""), e.set(a, null), e.set(u, ""), e.set(L, [], !0), e.set(j, [], !0);
  }
  var Y = Za(), pe = e.child(Y);
  Ea(pe, {
    crumbs: [
      { label: "AI Hub", href: `${l}/ai` },
      { label: "Schema Generator" }
    ]
  });
  var he = e.sibling(pe, 2);
  Pa(he, {
    title: "AI Schema Generator",
    subtitle: "Describe your app — AI will design the database schema"
  });
  var Z = e.sibling(he, 2), fe = e.child(Z), ye = e.sibling(fe, 4), H = e.sibling(ye, 4);
  e.reset(Z);
  var Se = e.sibling(Z, 2);
  {
    var Te = (M) => {
      var V = Ra(), ae = e.child(V), se = e.sibling(e.child(ae), 2);
      e.remove_textarea_child(se), e.set_attribute(se, "rows", 6);
      var xe = e.sibling(se, 2), we = e.child(xe);
      e.reset(xe), e.reset(ae);
      var ne = e.sibling(ae, 2), _e = e.child(ne);
      {
        var be = (W) => {
          var R = La(), X = e.first_child(R);
          tt(X, { class: "h-4 w-4 animate-spin" }), e.next(), e.append(W, R);
        }, ge = (W) => {
          var R = Ha(), X = e.first_child(R);
          xt(X, { class: "h-4 w-4" }), e.next(), e.append(W, R);
        };
        e.if(_e, (W) => {
          e.get(g) ? W(be) : W(ge, -1);
        });
      }
      e.reset(ne), e.reset(V), e.template_effect(
        (W) => {
          e.set_text(we, `${e.get(d).length ?? ""}/4000 characters`), ne.disabled = W;
        },
        [
          () => e.get(g) || e.get(d).trim().length < 10
        ]
      ), e.bind_value(se, () => e.get(d), (W) => e.set(d, W)), e.delegated("click", ne, N), e.append(M, V);
    };
    e.if(Se, (M) => {
      e.get(i) === "input" && M(Te);
    });
  }
  var Ae = e.sibling(Se, 2);
  {
    var ze = (M) => {
      var V = Wa(), ae = e.child(V), se = e.child(ae), xe = e.child(se), we = e.child(xe, !0);
      e.reset(xe), e.next(2), e.reset(se);
      var ne = e.sibling(se, 2), _e = e.child(ne), be = e.child(_e, !0);
      e.reset(_e), e.next(2), e.reset(ne), e.next(2), e.reset(ae);
      var ge = e.sibling(ae, 2);
      e.each(ge, 21, () => e.get(a).collections, e.index, (re, T) => {
        var ve = Qa(), Ce = e.child(ve), Pe = e.child(Ce), qe = e.child(Pe), r = e.child(qe, !0);
        e.reset(qe);
        var n = e.sibling(qe, 2), v = e.child(n, !0);
        e.reset(n);
        var f = e.sibling(n, 2);
        {
          var k = (x) => {
            var y = Ga(), S = e.child(y, !0);
            e.reset(y), e.template_effect(() => e.set_text(S, e.get(T).description)), e.append(x, y);
          };
          e.if(f, (x) => {
            e.get(T).description && x(k);
          });
        }
        e.reset(Pe);
        var b = e.sibling(Pe, 2), h = e.child(b), c = e.child(h);
        e.reset(h);
        var $ = e.sibling(h, 2);
        {
          var _ = (x) => {
            mt(x, { class: "h-4 w-4" });
          }, s = e.derived(() => e.get(I).has(e.get(T).name)), p = (x) => {
            ft(x, { class: "h-4 w-4" });
          };
          e.if($, (x) => {
            e.get(s) ? x(_) : x(p, -1);
          });
        }
        e.reset(b), e.reset(Ce);
        var m = e.sibling(Ce, 2);
        {
          var w = (x) => {
            var y = Oa(), S = e.child(y), G = e.sibling(e.child(S));
            e.each(G, 21, () => e.get(T).fields, e.index, (z, P) => {
              var B = Da(), ie = e.child(B), F = e.child(ie, !0);
              e.reset(ie);
              var D = e.sibling(ie), O = e.child(D), U = e.child(O, !0);
              e.reset(O), e.reset(D);
              var me = e.sibling(D), de = e.child(me, !0);
              e.reset(me), e.reset(B), e.template_effect(() => {
                e.set_text(F, e.get(P).name), e.set_text(U, e.get(P).type), e.set_text(de, e.get(P).required ? "Yes" : "—");
              }), e.append(z, B);
            }), e.reset(G), e.reset(S), e.reset(y), e.append(x, y);
          }, A = e.derived(() => e.get(I).has(e.get(T).name));
          e.if(m, (x) => {
            e.get(A) && x(w);
          });
        }
        e.reset(ve), e.template_effect(() => {
          e.set_text(r, e.get(T).displayName ?? e.get(T).name), e.set_text(v, e.get(T).name), e.set_text(c, `${e.get(T).fields.length ?? ""} fields`);
        }), e.delegated("click", Ce, () => te(e.get(T).name)), e.append(re, ve);
      }), e.reset(ge);
      var W = e.sibling(ge, 2), R = e.child(W), X = e.child(R);
      gt(X, { class: "h-4 w-4" }), e.next(), e.reset(R);
      var oe = e.sibling(R, 2), Ne = e.child(oe);
      {
        var ke = (re) => {
          var T = Va(), ve = e.first_child(T);
          tt(ve, { class: "h-4 w-4 animate-spin" }), e.next(), e.append(re, T);
        }, ue = (re) => {
          var T = Ba(), ve = e.first_child(T);
          et(ve, { class: "h-4 w-4" }), e.next(), e.append(re, T);
        };
        e.if(Ne, (re) => {
          e.get(g) ? re(ke) : re(ue, -1);
        });
      }
      e.reset(oe), e.reset(W), e.reset(V), e.template_effect(() => {
        e.set_text(we, e.get(E)), e.set_text(be, e.get(K)), oe.disabled = e.get(g);
      }), e.delegated("click", R, () => {
        e.set(i, "input");
      }), e.delegated("click", oe, q), e.append(M, V);
    };
    e.if(Ae, (M) => {
      e.get(i) === "preview" && e.get(a) && M(ze);
    });
  }
  var Ee = e.sibling(Ae, 2);
  {
    var Oe = (M) => {
      var V = Ya(), ae = e.child(V), se = e.child(ae), xe = e.child(se);
      et(xe, { class: "h-5 w-5" }), e.next(2), e.reset(se);
      var we = e.sibling(se, 2);
      {
        var ne = (R) => {
          var X = Ua(), oe = e.child(X), Ne = e.child(oe);
          e.reset(oe);
          var ke = e.sibling(oe, 2);
          e.each(ke, 21, () => e.get(L), e.index, (ue, re) => {
            var T = Fa(), ve = e.child(T, !0);
            e.reset(T), e.template_effect(() => e.set_text(ve, e.get(re))), e.append(ue, T);
          }), e.reset(ke), e.reset(X), e.template_effect(() => e.set_text(Ne, `Created (${e.get(L).length ?? ""}):`)), e.append(R, X);
        };
        e.if(we, (R) => {
          e.get(L).length > 0 && R(ne);
        });
      }
      var _e = e.sibling(we, 2);
      {
        var be = (R) => {
          var X = Ka(), oe = e.sibling(e.child(X), 2);
          e.each(oe, 21, () => e.get(j), e.index, (Ne, ke) => {
            var ue = Ja(), re = e.child(ue, !0);
            e.reset(ue), e.template_effect(() => e.set_text(re, e.get(ke))), e.append(Ne, ue);
          }), e.reset(oe), e.reset(X), e.append(R, X);
        };
        e.if(_e, (R) => {
          e.get(j).length > 0 && R(be);
        });
      }
      e.reset(ae);
      var ge = e.sibling(ae, 2), W = e.sibling(e.child(ge), 2);
      e.reset(ge), e.reset(V), e.delegated("click", W, ce), e.append(M, V);
    };
    e.if(Ee, (M) => {
      e.get(i) === "done" && M(Oe);
    });
  }
  e.reset(Y), e.template_effect(() => {
    e.set_class(fe, 1, e.clsx(e.get(i) === "input" ? "font-semibold text-purple-600" : "text-gray-400")), e.set_class(ye, 1, e.clsx(e.get(i) === "preview" ? "font-semibold text-purple-600" : "text-gray-400")), e.set_class(H, 1, e.clsx(e.get(i) === "done" ? "font-semibold text-green-600" : "text-gray-400"));
  }), e.append(o, Y), e.pop();
}
e.delegate(["click"]);
function es() {
  const o = window.__zveltio;
  if (!o) {
    console.warn("[ai extension] window.__zveltio is not present — Studio loader not initialised yet.");
    return;
  }
  o.registerRoute({
    path: "ai",
    component: Ma,
    label: "AI Hub",
    icon: "Bot",
    category: "intelligence",
    children: [
      {
        path: "ai/schema",
        component: Xa,
        label: "AI Schema Generation",
        icon: "Wand2",
        category: "intelligence"
      }
    ]
  });
}
es();
export {
  es as default
};
