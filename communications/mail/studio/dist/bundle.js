var ra = (c) => {
  throw TypeError(c);
};
var Ya = (c, t, d) => t.has(c) || ra("Cannot " + d);
var Ft = (c, t, d) => (Ya(c, t, "read from private field"), d ? d.call(c) : t.get(c)), na = (c, t, d) => t.has(c) ? ra("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(c) : t.set(c, d);
import "svelte/internal/disclose-version";
import * as e from "svelte/internal/client";
const ut = typeof window < "u" ? window.location.origin : "";
typeof window < "u" && (window.__ZVELTIO_ENGINE_URL__ = ut);
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
const es = {
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
var ts = e.from_svg("<svg><!><!></svg>");
function ee(c, t) {
  e.push(t, !0);
  const d = e.prop(t, "color", 3, "currentColor"), o = e.prop(t, "size", 3, 24), r = e.prop(t, "strokeWidth", 3, 2), x = e.prop(t, "absoluteStrokeWidth", 3, !1), l = e.prop(t, "iconNode", 19, () => []), i = e.rest_props(t, [
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
  var g = ts();
  e.attribute_effect(
    g,
    (le) => ({
      ...es,
      ...i,
      width: o(),
      height: o(),
      stroke: d(),
      "stroke-width": le,
      class: [
        "lucide-icon lucide",
        t.name && `lucide-${t.name}`,
        t.class
      ]
    }),
    [
      () => x() ? Number(r()) * 24 / Number(o()) : r()
    ]
  );
  var V = e.child(g);
  e.each(V, 17, l, e.index, (le, oe) => {
    var D = e.derived(() => e.to_array(e.get(oe), 2));
    let L = () => e.get(D)[0], re = () => e.get(D)[1];
    var de = e.comment(), _e = e.first_child(de);
    e.element(_e, L, !0, (be, he) => {
      e.attribute_effect(be, () => ({ ...re() }));
    }), e.append(le, de);
  });
  var me = e.sibling(V);
  e.snippet(me, () => t.children ?? e.noop), e.reset(g), e.append(c, g), e.pop();
}
function as(c, t) {
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
  let d = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const o = [
    [
      "rect",
      { width: "20", height: "5", x: "2", y: "3", rx: "1" }
    ],
    ["path", { d: "M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" }],
    ["path", { d: "M10 12h4" }]
  ];
  ee(c, e.spread_props({ name: "archive" }, () => d, {
    get iconNode() {
      return o;
    },
    children: (r, x) => {
      var l = e.comment(), i = e.first_child(l);
      e.snippet(i, () => t.children ?? e.noop), e.append(r, l);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function ss(c, t) {
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
  let d = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const o = [["path", { d: "m6 9 6 6 6-6" }]];
  ee(c, e.spread_props({ name: "chevron-down" }, () => d, {
    get iconNode() {
      return o;
    },
    children: (r, x) => {
      var l = e.comment(), i = e.first_child(l);
      e.snippet(i, () => t.children ?? e.noop), e.append(r, l);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function is(c, t) {
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
  let d = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const o = [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["line", { x1: "12", x2: "12", y1: "8", y2: "12" }],
    [
      "line",
      { x1: "12", x2: "12.01", y1: "16", y2: "16" }
    ]
  ];
  ee(c, e.spread_props({ name: "circle-alert" }, () => d, {
    get iconNode() {
      return o;
    },
    children: (r, x) => {
      var l = e.comment(), i = e.first_child(l);
      e.snippet(i, () => t.children ?? e.noop), e.append(r, l);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function oa(c, t) {
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
  let d = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const o = [
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
  ee(c, e.spread_props({ name: "file-text" }, () => d, {
    get iconNode() {
      return o;
    },
    children: (r, x) => {
      var l = e.comment(), i = e.first_child(l);
      e.snippet(i, () => t.children ?? e.noop), e.append(r, l);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function ls(c, t) {
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
  let d = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const o = [
    ["path", { d: "m15 17 5-5-5-5" }],
    ["path", { d: "M4 18v-2a4 4 0 0 1 4-4h12" }]
  ];
  ee(c, e.spread_props({ name: "forward" }, () => d, {
    get iconNode() {
      return o;
    },
    children: (r, x) => {
      var l = e.comment(), i = e.first_child(l);
      e.snippet(i, () => t.children ?? e.noop), e.append(r, l);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function da(c, t) {
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
  let d = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const o = [
    [
      "path",
      {
        d: "M10 20a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341L21.74 4.67A1 1 0 0 0 21 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14z"
      }
    ]
  ];
  ee(c, e.spread_props({ name: "funnel" }, () => d, {
    get iconNode() {
      return o;
    },
    children: (r, x) => {
      var l = e.comment(), i = e.first_child(l);
      e.snippet(i, () => t.children ?? e.noop), e.append(r, l);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function zt(c, t) {
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
  let d = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const o = [
    [
      "polyline",
      { points: "22 12 16 12 14 15 10 15 8 12 2 12" }
    ],
    [
      "path",
      {
        d: "M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"
      }
    ]
  ];
  ee(c, e.spread_props({ name: "inbox" }, () => d, {
    get iconNode() {
      return o;
    },
    children: (r, x) => {
      var l = e.comment(), i = e.first_child(l);
      e.snippet(i, () => t.children ?? e.noop), e.append(r, l);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function Ht(c, t) {
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
  let d = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const o = [
    ["path", { d: "m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" }],
    [
      "rect",
      { x: "2", y: "4", width: "20", height: "16", rx: "2" }
    ]
  ];
  ee(c, e.spread_props({ name: "mail" }, () => d, {
    get iconNode() {
      return o;
    },
    children: (r, x) => {
      var l = e.comment(), i = e.first_child(l);
      e.snippet(i, () => t.children ?? e.noop), e.append(r, l);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function Rt(c, t) {
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
  let d = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const o = [
    ["path", { d: "M13.234 20.252 21 12.3" }],
    [
      "path",
      {
        d: "m16 6-8.414 8.586a2 2 0 0 0 0 2.828 2 2 0 0 0 2.828 0l8.414-8.586a4 4 0 0 0 0-5.656 4 4 0 0 0-5.656 0l-8.415 8.585a6 6 0 1 0 8.486 8.486"
      }
    ]
  ];
  ee(c, e.spread_props({ name: "paperclip" }, () => d, {
    get iconNode() {
      return o;
    },
    children: (r, x) => {
      var l = e.comment(), i = e.first_child(l);
      e.snippet(i, () => t.children ?? e.noop), e.append(r, l);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function et(c, t) {
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
  let d = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const o = [["path", { d: "M5 12h14" }], ["path", { d: "M12 5v14" }]];
  ee(c, e.spread_props({ name: "plus" }, () => d, {
    get iconNode() {
      return o;
    },
    children: (r, x) => {
      var l = e.comment(), i = e.first_child(l);
      e.snippet(i, () => t.children ?? e.noop), e.append(r, l);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function rs(c, t) {
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
  let d = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const o = [
    [
      "path",
      { d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" }
    ],
    ["path", { d: "M21 3v5h-5" }],
    [
      "path",
      { d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" }
    ],
    ["path", { d: "M8 16H3v5" }]
  ];
  ee(c, e.spread_props({ name: "refresh-cw" }, () => d, {
    get iconNode() {
      return o;
    },
    children: (r, x) => {
      var l = e.comment(), i = e.first_child(l);
      e.snippet(i, () => t.children ?? e.noop), e.append(r, l);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function ns(c, t) {
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
  let d = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const o = [
    ["path", { d: "m12 17-5-5 5-5" }],
    ["path", { d: "M22 18v-2a4 4 0 0 0-4-4H7" }],
    ["path", { d: "m7 17-5-5 5-5" }]
  ];
  ee(c, e.spread_props({ name: "reply-all" }, () => d, {
    get iconNode() {
      return o;
    },
    children: (r, x) => {
      var l = e.comment(), i = e.first_child(l);
      e.snippet(i, () => t.children ?? e.noop), e.append(r, l);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function os(c, t) {
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
  let d = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const o = [
    ["path", { d: "M20 18v-2a4 4 0 0 0-4-4H4" }],
    ["path", { d: "m9 17-5-5 5-5" }]
  ];
  ee(c, e.spread_props({ name: "reply" }, () => d, {
    get iconNode() {
      return o;
    },
    children: (r, x) => {
      var l = e.comment(), i = e.first_child(l);
      e.snippet(i, () => t.children ?? e.noop), e.append(r, l);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function ds(c, t) {
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
  let d = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
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
  ee(c, e.spread_props({ name: "save" }, () => d, {
    get iconNode() {
      return o;
    },
    children: (r, x) => {
      var l = e.comment(), i = e.first_child(l);
      e.snippet(i, () => t.children ?? e.noop), e.append(r, l);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function cs(c, t) {
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
  let d = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const o = [
    ["path", { d: "m21 21-4.34-4.34" }],
    ["circle", { cx: "11", cy: "11", r: "8" }]
  ];
  ee(c, e.spread_props({ name: "search" }, () => d, {
    get iconNode() {
      return o;
    },
    children: (r, x) => {
      var l = e.comment(), i = e.first_child(l);
      e.snippet(i, () => t.children ?? e.noop), e.append(r, l);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function Bt(c, t) {
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
  let d = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const o = [
    [
      "path",
      {
        d: "M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"
      }
    ],
    ["path", { d: "m21.854 2.147-10.94 10.939" }]
  ];
  ee(c, e.spread_props({ name: "send" }, () => d, {
    get iconNode() {
      return o;
    },
    children: (r, x) => {
      var l = e.comment(), i = e.first_child(l);
      e.snippet(i, () => t.children ?? e.noop), e.append(r, l);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function ps(c, t) {
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
  let d = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const o = [
    [
      "path",
      {
        d: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
      }
    ],
    ["circle", { cx: "12", cy: "12", r: "3" }]
  ];
  ee(c, e.spread_props({ name: "settings" }, () => d, {
    get iconNode() {
      return o;
    },
    children: (r, x) => {
      var l = e.comment(), i = e.first_child(l);
      e.snippet(i, () => t.children ?? e.noop), e.append(r, l);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function vs(c, t) {
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
  let d = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const o = [
    [
      "path",
      {
        d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"
      }
    ]
  ];
  ee(c, e.spread_props({ name: "shield" }, () => d, {
    get iconNode() {
      return o;
    },
    children: (r, x) => {
      var l = e.comment(), i = e.first_child(l);
      e.snippet(i, () => t.children ?? e.noop), e.append(r, l);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function us(c, t) {
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
  let d = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const o = [
    [
      "path",
      {
        d: "M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"
      }
    ]
  ];
  ee(c, e.spread_props({ name: "star" }, () => d, {
    get iconNode() {
      return o;
    },
    children: (r, x) => {
      var l = e.comment(), i = e.first_child(l);
      e.snippet(i, () => t.children ?? e.noop), e.append(r, l);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function vt(c, t) {
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
  let d = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const o = [
    ["path", { d: "M3 6h18" }],
    ["path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" }],
    ["path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" }],
    ["line", { x1: "10", x2: "10", y1: "11", y2: "17" }],
    ["line", { x1: "14", x2: "14", y1: "11", y2: "17" }]
  ];
  ee(c, e.spread_props({ name: "trash-2" }, () => d, {
    get iconNode() {
      return o;
    },
    children: (r, x) => {
      var l = e.comment(), i = e.first_child(l);
      e.snippet(i, () => t.children ?? e.noop), e.append(r, l);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function _s(c, t) {
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
  let d = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const o = [
    ["path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }],
    ["path", { d: "M16 3.128a4 4 0 0 1 0 7.744" }],
    ["path", { d: "M22 21v-2a4 4 0 0 0-3-3.87" }],
    ["circle", { cx: "9", cy: "7", r: "4" }]
  ];
  ee(c, e.spread_props({ name: "users" }, () => d, {
    get iconNode() {
      return o;
    },
    children: (r, x) => {
      var l = e.comment(), i = e.first_child(l);
      e.snippet(i, () => t.children ?? e.noop), e.append(r, l);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function ca(c, t) {
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
  let d = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const o = [
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
  ee(c, e.spread_props({ name: "wand-sparkles" }, () => d, {
    get iconNode() {
      return o;
    },
    children: (r, x) => {
      var l = e.comment(), i = e.first_child(l);
      e.snippet(i, () => t.children ?? e.noop), e.append(r, l);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function St(c, t) {
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
  let d = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const o = [
    ["path", { d: "M18 6 6 18" }],
    ["path", { d: "m6 6 12 12" }]
  ];
  ee(c, e.spread_props({ name: "x" }, () => d, {
    get iconNode() {
      return o;
    },
    children: (r, x) => {
      var l = e.comment(), i = e.first_child(l);
      e.snippet(i, () => t.children ?? e.noop), e.append(r, l);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
var gs = e.from_html('<span class="badge badge-ghost badge-sm font-mono"> </span>'), ms = e.from_html('<p class="text-sm text-base-content/50 mt-0.5"> </p>'), bs = e.from_html('<div class="flex items-start justify-between gap-4 mb-6"><div><div class="flex items-center gap-2.5"><h1 class="text-xl font-semibold text-base-content"> </h1> <!></div> <!></div> <!></div>');
function pa(c, t) {
  e.push(t, !0);
  var d = bs(), o = e.child(d), r = e.child(o), x = e.child(r), l = e.child(x, !0);
  e.reset(x);
  var i = e.sibling(x, 2);
  {
    var g = (D) => {
      var L = gs(), re = e.child(L, !0);
      e.reset(L), e.template_effect((de) => e.set_text(re, de), [() => t.count.toLocaleString()]), e.append(D, L);
    };
    e.if(i, (D) => {
      t.count !== void 0 && t.count !== null && D(g);
    });
  }
  e.reset(r);
  var V = e.sibling(r, 2);
  {
    var me = (D) => {
      var L = ms(), re = e.child(L, !0);
      e.reset(L), e.template_effect(() => e.set_text(re, t.subtitle)), e.append(D, L);
    };
    e.if(V, (D) => {
      t.subtitle && D(me);
    });
  }
  e.reset(o);
  var le = e.sibling(o, 2);
  {
    var oe = (D) => {
      var L = e.comment(), re = e.first_child(L);
      e.snippet(re, () => t.children), e.append(D, L);
    };
    e.if(le, (D) => {
      t.children && D(oe);
    });
  }
  e.reset(d), e.template_effect(() => e.set_text(l, t.title)), e.append(c, d), e.pop();
}
let hs = 0;
var _t;
class fs {
  constructor() {
    na(this, _t, e.state(e.proxy([])));
  }
  get items() {
    return e.get(Ft(this, _t));
  }
  set items(t) {
    e.set(Ft(this, _t), t, !0);
  }
  add(t, d, o = 5e3) {
    const r = ++hs;
    return this.items.push({ id: r, type: t, message: d }), o > 0 && setTimeout(() => this.remove(r), o), r;
  }
  remove(t) {
    this.items = this.items.filter((d) => d.id !== t);
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
_t = new WeakMap();
const je = new fs();
var xs = e.from_html('<span class="badge badge-primary badge-xs"> </span>'), ys = e.from_html("<option> </option>"), ws = e.from_html('<div class="px-2 pt-2"><select class="select select-xs select-bordered w-full"></select></div>'), ks = e.from_html('<div class="px-3 py-1 text-xs text-base-content/50 truncate"> </div>'), $s = e.from_html('<span class="badge badge-xs badge-primary"> </span>'), Ss = e.from_html('<button><!> <span class="flex-1 text-left truncate"> </span> <!></button>'), Ns = e.from_html('<span class="badge badge-xs badge-neutral ml-auto"> </span>'), Ms = e.from_html("<button><!> <!></button>"), js = e.from_html('<ul class="dropdown-content menu menu-xs bg-base-100 shadow-lg rounded-lg z-50 w-36"><li><button>Mark read</button></li> <li><button>Mark unread</button></li> <li><button>Star</button></li> <li><button>Delete</button></li> <li><button>Spam</button></li></ul>'), Ps = e.from_html('<div class="flex items-center gap-1"><span class="text-xs text-base-content/60"> </span> <div class="dropdown dropdown-bottom ml-auto"><button class="btn btn-xs btn-ghost gap-1">Actions <!></button> <!></div> <button class="btn btn-xs btn-ghost"><!></button></div>'), As = e.from_html('<div class="flex justify-center py-8"><span class="loading loading-spinner loading-md"></span></div>'), Ts = e.from_html('<div class="flex flex-col items-center justify-center py-12 text-base-content/40 gap-2"><!><p class="text-sm">No messages</p></div>'), Os = e.from_html('<span class="w-1.5 h-1.5 bg-primary rounded-full"></span>'), Cs = e.from_html('<div><input type="checkbox"/> <button class="flex-1 text-left px-2 py-2.5 min-w-0"><div class="flex items-center justify-between gap-1"><span> </span> <span class="text-xs text-base-content/40 shrink-0"> </span></div> <p> </p> <p class="text-xs text-base-content/40 truncate"> </p></button> <div class="flex flex-col items-center gap-1 p-1 shrink-0"><!> <button class="opacity-0 group-hover:opacity-100 btn btn-ghost btn-xs p-0.5"><!></button></div></div>'), Ds = e.from_html("<span> </span>"), Es = e.from_html('<span class="badge badge-xs badge-error">High priority</span>'), Is = e.from_html('<span class="loading loading-spinner loading-xs"></span>'), Ls = e.from_html('<span class="loading loading-spinner loading-xs"></span>'), Fs = e.from_html('<div class="mt-2 p-2 bg-primary/5 border border-primary/20 rounded-lg text-sm whitespace-pre-wrap"> </div>'), zs = e.from_html('<iframe class="w-full min-h-96 border-0 bg-white rounded-lg" title="Email body" sandbox="allow-same-origin"></iframe>'), Hs = e.from_html('<pre class="whitespace-pre-wrap text-sm font-sans"> </pre>'), Rs = e.from_html('<div class="flex items-center justify-center h-32 text-base-content/40 text-sm"><span class="loading loading-spinner loading-sm mr-2"></span> Loading...</div>'), Bs = e.from_html('<div class="badge badge-outline gap-1 p-3 text-xs"><!> <span class="opacity-40"> </span></div>'), Js = e.from_html('<div class="mt-4 border-t border-base-200 pt-4"><p class="text-sm font-semibold mb-2 flex items-center gap-1"><!> Attachments</p> <div class="flex flex-wrap gap-2"></div></div>'), Us = e.from_html('<div class="p-4 border-b border-base-300 bg-base-100"><div class="flex items-start justify-between gap-3"><div class="flex-1 min-w-0"><h2 class="text-lg font-semibold"> </h2> <div class="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-sm text-base-content/60"><span>From: <strong> </strong></span> <!> <span> </span> <!></div></div> <div class="flex gap-1 shrink-0 flex-wrap justify-end"><button class="btn btn-xs btn-ghost gap-1" title="Reply"><!></button> <button class="btn btn-xs btn-ghost gap-1" title="Reply All"><!></button> <button class="btn btn-xs btn-ghost gap-1" title="Forward"><!></button> <button class="btn btn-xs btn-ghost gap-1" title="Download .eml"><!></button> <button class="btn btn-xs btn-ghost text-error"><!></button></div></div> <div class="flex gap-2 mt-3 flex-wrap"><button class="btn btn-xs btn-outline gap-1"><!> Summarize</button> <button class="btn btn-xs btn-outline gap-1"><!> AI Reply</button></div> <!></div> <div class="flex-1 overflow-y-auto p-4"><!> <!></div>', 1), qs = e.from_html('<div class="flex-1 flex flex-col items-center justify-center gap-4 text-base-content/40"><!> <div class="text-center"><p class="text-lg font-semibold">No mail accounts</p> <p class="text-sm">Add an IMAP/SMTP account to get started.</p></div> <button class="btn btn-primary gap-2"><!> Add Account</button></div>'), Vs = e.from_html('<div class="flex-1 flex items-center justify-center text-base-content/30"><p>Select a message</p></div>'), Ws = e.from_html('<div class="w-72 shrink-0 border-r border-base-200 flex flex-col bg-base-100"><div class="p-2 border-b border-base-300 space-y-1"><div class="join w-full"><input class="input input-bordered input-sm join-item flex-1" placeholder="Search..."/> <button class="btn btn-sm join-item"><!></button></div> <!></div> <div class="flex-1 overflow-y-auto divide-y divide-base-200"><!></div></div> <div class="flex-1 overflow-y-auto flex flex-col"><!></div>', 1), Gs = e.from_html('<div class="card bg-base-200 shadow-sm"><div class="card-body p-4 flex-row items-center justify-between gap-3"><div class="min-w-0 flex-1"><p class="font-medium truncate"> </p> <p class="text-xs text-base-content/50"> </p></div> <div class="flex gap-2 shrink-0"><button class="btn btn-xs btn-ghost">Edit</button> <button class="btn btn-xs btn-ghost text-error"><!></button></div></div></div>'), Zs = e.from_html('<div class="text-center py-12 text-base-content/40"><!> No drafts saved.</div>'), Xs = e.from_html('<div class="flex-1 p-6 overflow-y-auto"><div class="flex items-center justify-between mb-4"><h2 class="text-lg font-bold">Drafts</h2></div> <div class="space-y-2"></div></div>'), Ks = e.from_html('<tr><td class="font-mono text-xs"> </td><td> </td><td> </td><td><span class="badge badge-xs"> </span></td></tr>'), Qs = e.from_html(`<tr><td colspan="4" class="text-center text-base-content/40 py-8">No contacts yet. They're collected automatically when you send emails.</td></tr>`), Ys = e.from_html('<div class="flex-1 p-6 overflow-y-auto"><div class="flex items-center justify-between mb-4 gap-3"><h2 class="text-lg font-bold">Address Book</h2> <input class="input input-sm input-bordered w-56" placeholder="Search contacts..."/></div> <div class="overflow-x-auto"><table class="table table-sm"><thead><tr><th>Email</th><th>Name</th><th>Company</th><th>Frequency</th></tr></thead><tbody></tbody></table></div></div>'), ei = e.from_html('<div class="card bg-base-200 mb-4"><div class="card-body gap-3"><h3 class="font-semibold text-sm"> </h3> <div class="form-control"><div class="label py-1"><span class="label-text text-sm">Name</span></div> <input class="input input-sm input-bordered" placeholder="Work, Personal..."/></div> <div class="form-control"><div class="label py-1"><span class="label-text text-sm">Signature HTML</span></div> <textarea class="textarea textarea-bordered min-h-24 font-mono text-xs" placeholder="&lt;p>Your signature here...&lt;/p>"></textarea></div> <label class="label cursor-pointer justify-start gap-2"><input type="checkbox" class="checkbox checkbox-sm"/> <span class="label-text text-sm">Set as default</span></label> <div class="flex gap-2"><button class="btn btn-sm btn-primary">Save</button> <button class="btn btn-sm btn-ghost">Cancel</button></div></div></div>'), ti = e.from_html('<span class="badge badge-xs badge-primary ml-1">Default</span>'), ai = e.from_html('<div class="card bg-base-200 shadow-sm"><div class="card-body p-4 flex-row items-center justify-between"><div><p class="font-medium"> <!></p> <p class="text-xs text-base-content/50 mt-0.5"> </p></div> <div class="flex gap-2 shrink-0"><button class="btn btn-xs btn-ghost">Edit</button> <button class="btn btn-xs btn-ghost text-error"><!></button></div></div></div>'), si = e.from_html('<div class="text-center py-12 text-base-content/40">No signatures yet.</div>'), ii = e.from_html('<div class="flex-1 p-6 overflow-y-auto max-w-2xl"><div class="flex items-center justify-between mb-4"><h2 class="text-lg font-bold">Signatures</h2> <button class="btn btn-sm btn-primary gap-1"><!> New</button></div> <!> <div class="space-y-2"></div></div>'), li = e.from_html('<div class="alert alert-warning text-sm">Select a mail account first to manage filters.</div>'), ri = e.from_html('<span class="badge badge-xs badge-neutral">Disabled</span>'), ni = e.from_html('<div class="card bg-base-200 shadow-sm"><div class="card-body p-4 flex-row items-center justify-between gap-3"><div class="flex-1 min-w-0"><div class="flex items-center gap-2"><p class="font-medium"> </p> <!></div> <p class="text-xs text-base-content/50 mt-0.5"> </p></div> <div class="flex gap-2 shrink-0"><input type="checkbox" class="toggle toggle-sm"/> <button class="btn btn-xs btn-ghost text-error"><!></button></div></div></div>'), oi = e.from_html('<div class="text-center py-12 text-base-content/40"><!> No filters configured.</div>'), di = e.from_html('<div class="space-y-2"></div>'), ci = e.from_html('<div class="flex-1 p-6 overflow-y-auto max-w-3xl"><div class="flex items-center justify-between mb-4"><h2 class="text-lg font-bold">Mail Filters</h2> <button class="btn btn-sm btn-primary gap-1"><!> New Filter</button></div> <!></div>'), pi = e.from_html('<span class="text-xs text-base-content/40">Draft saved</span>'), vi = e.from_html('<li><button class="w-full text-left px-3 py-1.5 text-sm hover:bg-base-200"> <span class="text-xs text-base-content/40 ml-1"> </span></button></li>'), ui = e.from_html('<ul class="absolute top-full left-0 right-0 bg-base-100 shadow-lg border border-base-300 rounded-lg z-50 max-h-40 overflow-y-auto"></ul>'), _i = e.from_html('<span class="loading loading-spinner loading-sm"></span>'), gi = e.from_html('<dialog class="modal modal-open"><div class="modal-box max-w-2xl"><div class="flex items-center justify-between mb-4"><h3 class="font-bold text-lg"> </h3> <div class="flex gap-2 items-center"><!> <button class="btn btn-sm btn-ghost"><!></button></div></div> <div class="space-y-2"><div class="form-control relative"><div class="label py-1"><span class="label-text text-sm">To</span></div> <input class="input input-bordered input-sm" placeholder="email@example.com, ..."/> <!></div> <div class="form-control"><div class="label py-1"><span class="label-text text-sm">Cc</span></div> <input class="input input-bordered input-sm" placeholder="Optional"/></div> <div class="form-control"><div class="label py-1"><span class="label-text text-sm">Bcc</span></div> <input class="input input-bordered input-sm" placeholder="Optional"/></div> <div class="form-control"><div class="label py-1"><span class="label-text text-sm">Subject</span></div> <input class="input input-bordered input-sm" placeholder="Subject"/></div> <div class="flex gap-4 items-center text-xs text-base-content/60"><label class="flex items-center gap-1">Priority: <select class="select select-xs select-bordered"><option>Normal</option><option>High</option><option>Low</option></select></label> <label class="flex items-center gap-1 cursor-pointer"><input type="checkbox" class="checkbox checkbox-xs"/> Read receipt</label></div> <div class="form-control"><div class="label py-1"><span class="label-text text-sm">Message</span></div> <textarea class="textarea textarea-bordered min-h-48" placeholder="Write your message..."></textarea></div></div> <div class="modal-action"><button class="btn btn-ghost btn-sm">Save Draft</button> <button class="btn btn-ghost">Discard</button> <button class="btn btn-primary gap-2"><!> Send</button></div></div> <button class="modal-backdrop" aria-label="Close"></button></dialog>'), mi = e.from_html('<span class="loading loading-spinner loading-sm"></span>'), bi = e.from_html('<dialog class="modal modal-open"><div class="modal-box max-w-xl max-h-[90vh] overflow-y-auto"><h3 class="font-bold text-lg mb-4">Add Mail Account</h3> <div class="space-y-3"><div class="grid grid-cols-2 gap-3"><div class="form-control"><div class="label py-1"><span class="label-text text-sm">Account Name</span></div> <input class="input input-bordered input-sm" placeholder="Work, Personal..."/></div> <div class="form-control"><div class="label py-1"><span class="label-text text-sm">Email Address</span></div> <input class="input input-bordered input-sm" type="email"/></div></div> <div class="form-control"><div class="label py-1"><span class="label-text text-sm">Display Name</span></div> <input class="input input-bordered input-sm" placeholder="Optional"/></div> <div class="divider text-xs">IMAP (Incoming)</div> <div class="grid grid-cols-3 gap-2"><div class="form-control col-span-2"><div class="label py-1"><span class="label-text text-sm">Host</span></div> <input class="input input-bordered input-sm" placeholder="imap.gmail.com"/></div> <div class="form-control"><div class="label py-1"><span class="label-text text-sm">Port</span></div> <input class="input input-bordered input-sm" type="number"/></div></div> <div class="grid grid-cols-2 gap-2"><div class="form-control"><div class="label py-1"><span class="label-text text-sm">Username</span></div> <input class="input input-bordered input-sm"/></div> <div class="form-control"><div class="label py-1"><span class="label-text text-sm">Password</span></div> <input class="input input-bordered input-sm" type="password"/></div></div> <label class="label cursor-pointer justify-start gap-2"><input type="checkbox" class="checkbox checkbox-sm"/> <span class="label-text text-sm">Use SSL/TLS</span></label> <div class="divider text-xs">SMTP (Outgoing)</div> <div class="grid grid-cols-3 gap-2"><div class="form-control col-span-2"><div class="label py-1"><span class="label-text text-sm">Host</span></div> <input class="input input-bordered input-sm" placeholder="smtp.gmail.com"/></div> <div class="form-control"><div class="label py-1"><span class="label-text text-sm">Port</span></div> <input class="input input-bordered input-sm" type="number"/></div></div> <label class="label cursor-pointer justify-start gap-2"><input type="checkbox" class="checkbox checkbox-sm"/> <span class="label-text text-sm">Set as default account</span></label></div> <div class="modal-action"><button class="btn btn-ghost">Cancel</button> <button class="btn btn-primary gap-2"><!> Add Account</button></div></div> <button class="modal-backdrop" aria-label="Close"></button></dialog>'), hi = e.from_html('<div class="flex gap-2 mb-2 items-center"><select class="select select-xs select-bordered"><option>From</option><option>To</option><option>Subject</option><option>Body</option></select> <select class="select select-xs select-bordered"><option>contains</option><option>is exactly</option><option>starts with</option><option>ends with</option></select> <input class="input input-xs input-bordered flex-1" placeholder="value..."/> <button class="btn btn-xs btn-ghost text-error"><!></button></div>'), fi = e.from_html('<input class="input input-xs input-bordered flex-1" placeholder="INBOX.Newsletter"/>'), xi = e.from_html('<input class="input input-xs input-bordered flex-1" placeholder="forward@example.com" type="email"/>'), yi = e.from_html('<div class="flex gap-2 mb-2 items-center"><select class="select select-xs select-bordered"><option>Mark as read</option><option>Star</option><option>Move to folder</option><option>Delete</option><option>Forward to</option><option>Stop processing</option></select> <!> <button class="btn btn-xs btn-ghost text-error"><!></button></div>'), wi = e.from_html('<dialog class="modal modal-open"><div class="modal-box max-w-lg"><h3 class="font-bold text-lg mb-4">New Mail Filter</h3> <div class="space-y-3"><div class="form-control"><div class="label py-1"><span class="label-text text-sm">Filter Name</span></div> <input class="input input-bordered input-sm" placeholder="Block newsletters..."/></div> <div><p class="text-sm font-semibold mb-2">Conditions (all must match)</p> <!> <button class="btn btn-xs btn-ghost gap-1"><!> Add Condition</button></div> <div><p class="text-sm font-semibold mb-2">Actions</p> <!> <button class="btn btn-xs btn-ghost gap-1"><!> Add Action</button></div></div> <div class="modal-action"><button class="btn btn-ghost">Cancel</button> <button class="btn btn-primary">Save Filter</button></div></div> <button class="modal-backdrop" aria-label="Close"></button></dialog>'), ki = e.from_html('<!> <div class="flex h-[calc(100vh-100px)] -mx-6 border-t border-base-200 overflow-hidden"><div class="w-48 shrink-0 border-r border-base-200 bg-base-200 flex flex-col"><div class="p-3 border-b border-base-300 flex items-center justify-between"><span class="font-semibold text-sm flex items-center gap-1"><!> Mail <!></span> <div class="flex gap-1"><button class="btn btn-xs btn-ghost" title="Sync"><!></button> <button class="btn btn-xs btn-ghost" title="Add Account"><!></button></div></div> <!> <nav class="flex-1 overflow-y-auto py-2"><!></nav> <div class="border-t border-base-300 py-1"></div> <div class="p-2 border-t border-base-300"><button class="btn btn-primary btn-sm w-full gap-1"><!> Compose</button></div></div> <div class="flex-1 flex overflow-hidden"><!></div></div> <!> <!> <!>', 1);
function $i(c, t) {
  e.push(t, !0);
  let d = e.state("mail"), o = e.state(e.proxy([])), r = e.state(null), x = e.state(e.proxy([])), l = e.state(null), i = e.state(e.proxy([])), g = e.state(null), V = e.state(e.proxy(/* @__PURE__ */ new Set())), me = e.state(""), le = e.state(!1), oe = e.state(!1), D = e.state(e.proxy({})), L = e.state(!1), re = e.state(null), de = e.state(""), _e = e.state(""), be = e.state(""), he = e.state(""), fe = e.state(""), tt = e.state("normal"), F = e.state(!1), te = e.state(!1), W = e.state(null), Pe = null, xe = e.state(e.proxy([])), Ae = e.state(!1), ce = e.state(""), Se = e.state(!1), He = e.state(!1), Ne = e.state(!1), R = e.state(e.proxy({
    name: "",
    email_address: "",
    display_name: "",
    imap_host: "",
    imap_port: 993,
    imap_secure: !0,
    imap_user: "",
    imap_password: "",
    smtp_host: "",
    smtp_port: 587,
    smtp_secure: !0,
    smtp_user: "",
    smtp_password: "",
    is_default: !1
  })), Ee = e.state(!1), Re = e.state(e.proxy([])), Ue = e.state(e.proxy([])), qe = e.state(""), at = e.state(e.proxy([])), ye = e.state(null), we = e.state(""), Te = e.state(""), Ie = e.state(!1), Le = e.state(e.proxy([])), Fe = e.state(!1), ie = e.state(e.proxy({
    name: "",
    conditions: [{ field: "from", operator: "contains", value: "" }],
    actions: [{ type: "mark_read" }],
    is_active: !0
  })), Ve = e.state(!1);
  async function T(a, s = {}) {
    const n = await fetch(`${ut}${a}`, {
      credentials: "include",
      headers: s.body && !(s.body instanceof FormData) ? { "Content-Type": "application/json" } : {},
      ...s
    });
    if (!n.ok) {
      const v = await n.json().catch(() => ({}));
      throw new Error(v.error || `${n.status} ${n.statusText}`);
    }
    return n.json();
  }
  async function We() {
    e.set(le, !0);
    try {
      const a = await T("/api/mail/accounts");
      e.set(o, a.accounts ?? [], !0), e.get(o).length > 0 && !e.get(r) && await st(e.get(o).find((s) => s.is_default) ?? e.get(o)[0]), await Ge();
    } catch (a) {
      je.error(a.message ?? "Operation failed");
    } finally {
      e.set(le, !1);
    }
  }
  async function Ge() {
    try {
      const a = await T("/api/mail/stats");
      e.set(
        D,
        a.stats ?? {},
        /* ignore */
        !0
      );
    } catch {
    }
  }
  async function st(a) {
    e.set(r, a, !0), e.set(l, null), e.set(g, null), e.set(i, [], !0), e.set(x, [], !0), e.set(ce, ""), e.set(le, !0);
    try {
      const s = await T(`/api/mail/accounts/${a.id}/folders`);
      e.set(x, s.folders ?? [], !0);
      const n = e.get(x).find((v) => v.type === "inbox") ?? e.get(x)[0];
      n && await Be(n);
    } catch (s) {
      je.error(s.message ?? "Operation failed");
    } finally {
      e.set(le, !1);
    }
  }
  async function Be(a) {
    e.set(l, a, !0), e.set(g, null), e.set(ce, ""), e.set(V, /* @__PURE__ */ new Set(), !0), e.set(i, [], !0), e.set(le, !0);
    try {
      const s = await T(`/api/mail/folders/${a.id}/messages?limit=50`);
      e.set(i, s.messages ?? [], !0);
    } catch (s) {
      je.error(s.message ?? "Operation failed");
    } finally {
      e.set(le, !1);
    }
  }
  async function gt(a) {
    e.set(ce, ""), e.set(le, !0);
    try {
      const s = await T(`/api/mail/messages/${a.id}`);
      e.set(g, s.message, !0), e.set(i, e.get(i).map((n) => n.id === a.id ? { ...n, is_read: !0 } : n), !0);
    } catch (s) {
      je.error(s.message ?? "Operation failed");
    } finally {
      e.set(le, !1);
    }
  }
  async function mt() {
    if (e.get(r)) {
      e.set(oe, !0);
      try {
        await T(`/api/mail/accounts/${e.get(r).id}/sync`, { method: "POST" }), e.get(l) && await Be(e.get(l)), await Ge();
      } catch (a) {
        je.error(a.message ?? "Operation failed");
      } finally {
        e.set(oe, !1);
      }
    }
  }
  async function bt(a) {
    await T(`/api/mail/messages/${a.id}`, {
      method: "PATCH",
      body: JSON.stringify({ is_starred: !a.is_starred })
    }), e.set(i, e.get(i).map((s) => s.id === a.id ? { ...s, is_starred: !s.is_starred } : s), !0);
  }
  async function it(a) {
    var s;
    await T(`/api/mail/messages/${a.id}`, { method: "DELETE" }), e.set(i, e.get(i).filter((n) => n.id !== a.id), !0), ((s = e.get(g)) == null ? void 0 : s.id) === a.id && e.set(g, null);
  }
  async function ht() {
    if (!e.get(g)) return;
    const s = await (await fetch(`${ut}/api/mail/messages/${e.get(g).id}/eml`, { credentials: "include" })).blob(), n = document.createElement("a");
    n.href = URL.createObjectURL(s), n.download = `${e.get(g).subject || "message"}.eml`, n.click();
  }
  async function Oe(a, s) {
    if (e.get(V).size !== 0) {
      if (await T("/api/mail/bulk", {
        method: "POST",
        body: JSON.stringify({
          message_ids: [...e.get(V)],
          action: a,
          target_folder_id: s
        })
      }), a === "delete" || a === "spam" || a === "move")
        e.set(i, e.get(i).filter((n) => !e.get(V).has(n.id)), !0);
      else {
        const n = a === "mark_read", v = a === "star";
        e.set(
          i,
          e.get(i).map((p) => e.get(V).has(p.id) ? a === "mark_read" || a === "mark_unread" ? { ...p, is_read: n } : a === "star" || a === "unstar" ? { ...p, is_starred: v } : p : p),
          !0
        );
      }
      e.set(V, /* @__PURE__ */ new Set(), !0), e.set(Ve, !1);
    }
  }
  function ft(a) {
    const s = new Set(e.get(V));
    s.has(a) ? s.delete(a) : s.add(a), e.set(V, s, !0);
  }
  function lt(a) {
    e.set(de, "", !0), e.set(_e, ""), e.set(be, ""), e.set(he, "", !0), e.set(fe, "", !0), e.set(W, null, !0), e.set(re, null), e.set(L, !0);
  }
  async function Je(a) {
    if (e.get(g))
      try {
        const s = await T(`/api/mail/messages/${e.get(g).id}/reply-context`, { method: "POST", body: JSON.stringify({ type: a }) });
        e.set(de, (s.to ?? []).map((n) => n.address).join(", "), !0), e.set(_e, (s.cc ?? []).map((n) => n.address).join(", "), !0), e.set(he, s.subject ?? "", !0), e.set(fe, s.bodyText ?? "", !0), e.set(W, e.get(g).id, !0), e.set(re, null), e.set(L, !0);
      } catch (s) {
        je.error(s.message ?? "Operation failed");
      }
  }
  async function Ze() {
    if (!(!e.get(r) || !e.get(L)))
      try {
        const a = await T("/api/mail/drafts", {
          method: "POST",
          body: JSON.stringify({
            draft_id: e.get(re),
            account_id: e.get(r).id,
            to: e.get(de).split(",").map((s) => ({ address: s.trim() })).filter((s) => s.address),
            cc: e.get(_e) ? e.get(_e).split(",").map((s) => ({ address: s.trim() })) : [],
            bcc: e.get(be) ? e.get(be).split(",").map((s) => ({ address: s.trim() })) : [],
            subject: e.get(he),
            body_html: `<p>${e.get(fe).replace(/\n/g, "<br/>")}</p>`,
            body_text: e.get(fe),
            priority: e.get(tt),
            request_read_receipt: e.get(F),
            reply_type: e.get(W) ? "reply" : null,
            original_msg_id: e.get(W)
          })
        });
        e.set(re, a.draft_id, !0);
      } catch {
      }
  }
  async function xt() {
    var a;
    if (!(!e.get(r) || !e.get(de).trim() || !e.get(he).trim())) {
      e.set(te, !0);
      try {
        e.get(re) ? (await Ze(), await T(`/api/mail/drafts/${e.get(re)}/send`, { method: "POST" })) : await T("/api/mail/send", {
          method: "POST",
          body: JSON.stringify({
            account_id: e.get(r).id,
            to: e.get(de).split(",").map((s) => s.trim()).filter(Boolean),
            cc: e.get(_e) ? e.get(_e).split(",").map((s) => s.trim()).filter(Boolean) : void 0,
            bcc: e.get(be) ? e.get(be).split(",").map((s) => s.trim()).filter(Boolean) : void 0,
            subject: e.get(he),
            body_html: `<p>${e.get(fe).replace(/\n/g, "<br/>")}</p>`,
            body_text: e.get(fe),
            reply_to_message_id: e.get(W) ?? void 0
          })
        }), e.set(L, !1), ((a = e.get(l)) == null ? void 0 : a.type) === "sent" && await Be(e.get(l)), await Ge();
      } catch (s) {
        je.error(s.message ?? "Operation failed");
      } finally {
        e.set(te, !1);
      }
    }
  }
  async function q(a) {
    if (a.length < 2) {
      e.set(xe, [], !0);
      return;
    }
    try {
      const s = await T(`/api/mail/contacts?q=${encodeURIComponent(a)}&limit=8`);
      e.set(xe, s.contacts ?? [], !0);
    } catch {
      e.set(xe, [], !0);
    }
  }
  function Xe(a) {
    const s = e.get(de).split(",");
    s[s.length - 1] = a.display_name ? `${a.display_name} <${a.email}>` : a.email, e.set(de, s.join(", ") + ", "), e.set(xe, [], !0), e.set(Ae, !1);
  }
  async function rt() {
    if (e.get(g)) {
      e.set(Se, !0), e.set(ce, "");
      try {
        const a = await T(`/api/mail/messages/${e.get(g).id}/summarize`, { method: "POST" });
        e.set(ce, a.summary ?? "", !0);
      } catch (a) {
        je.error(a.message ?? "Operation failed");
      } finally {
        e.set(Se, !1);
      }
    }
  }
  async function nt() {
    if (e.get(g)) {
      e.set(He, !0);
      try {
        const a = await T(`/api/mail/messages/${e.get(g).id}/reply-draft`, { method: "POST" });
        a.draft && Je("reply").then(() => {
          e.set(fe, a.draft, !0);
        });
      } catch (a) {
        je.error(a.message ?? "Operation failed");
      } finally {
        e.set(He, !1);
      }
    }
  }
  async function ot() {
    try {
      const a = await T("/api/mail/drafts");
      e.set(
        Re,
        a.drafts ?? [],
        /* ignore */
        !0
      );
    } catch {
    }
  }
  async function Nt(a) {
    await T(`/api/mail/drafts/${a}`, { method: "DELETE" }), e.set(Re, e.get(Re).filter((s) => s.id !== a), !0);
  }
  async function yt(a) {
    var p;
    const n = (await T(`/api/mail/drafts/${a.id}`)).draft, v = (h) => {
      try {
        return (Array.isArray(h) ? h : JSON.parse(h)).map((P) => P.address).join(", ");
      } catch {
        return "";
      }
    };
    e.set(de, v(n.to_addresses), !0), e.set(_e, v(n.cc_addresses), !0), e.set(be, v(n.bcc_addresses), !0), e.set(he, n.subject, !0), e.set(fe, n.body_text || ((p = n.body_html) == null ? void 0 : p.replace(/<[^>]*>/g, "")) || "", !0), e.set(re, n.id, !0), e.set(d, "mail"), e.set(L, !0);
  }
  async function wt() {
    try {
      const a = await T(`/api/mail/contacts?q=${encodeURIComponent(e.get(
        qe
        /* ignore */
      ))}&limit=50`);
      e.set(Ue, a.contacts ?? [], !0);
    } catch {
    }
  }
  async function Ke() {
    try {
      const a = await T("/api/mail/signatures");
      e.set(
        at,
        a.signatures ?? [],
        /* ignore */
        !0
      );
    } catch {
    }
  }
  async function Mt() {
    if (!e.get(we).trim()) return;
    const a = e.get(ye) ? "PUT" : "POST", s = e.get(ye) ? `/api/mail/signatures/${e.get(ye).id}` : "/api/mail/signatures";
    await T(s, {
      method: a,
      body: JSON.stringify({
        name: e.get(we),
        body_html: e.get(Te),
        is_default: e.get(Ie)
      })
    }), e.set(ye, null), e.set(we, ""), e.set(Te, ""), e.set(Ie, !1), await Ke();
  }
  async function va(a) {
    await T(`/api/mail/signatures/${a}`, { method: "DELETE" }), await Ke();
  }
  async function jt() {
    if (e.get(r))
      try {
        const a = await T(`/api/mail/accounts/${e.get(
          r
          /* ignore */
        ).id}/filters`);
        e.set(Le, a.filters ?? [], !0);
      } catch {
      }
  }
  async function ua() {
    !e.get(r) || !e.get(ie).name || (await T(`/api/mail/accounts/${e.get(r).id}/filters`, { method: "POST", body: JSON.stringify(e.get(ie)) }), e.set(Fe, !1), e.set(
      ie,
      {
        name: "",
        conditions: [{ field: "from", operator: "contains", value: "" }],
        actions: [{ type: "mark_read" }],
        is_active: !0
      },
      !0
    ), await jt());
  }
  async function _a(a) {
    await T(`/api/mail/accounts/${e.get(r).id}/filters/${a.id}`, {
      method: "PATCH",
      body: JSON.stringify({ is_active: !a.is_active })
    }), await jt();
  }
  async function ga(a) {
    await T(`/api/mail/accounts/${e.get(r).id}/filters/${a}`, { method: "DELETE" }), e.set(Le, e.get(Le).filter((s) => s.id !== a), !0);
  }
  e.user_effect(() => {
    We();
  }), e.user_effect(() => (Pe && clearInterval(Pe), e.get(L) && (Pe = setInterval(Ze, 3e4)), () => clearInterval(Pe)));
  function ma(a) {
    return {
      inbox: zt,
      sent: Bt,
      trash: vt,
      archive: as,
      spam: is
    }[a] ?? Ht;
  }
  function Jt(a) {
    const s = new Date(a), n = /* @__PURE__ */ new Date();
    return s.toDateString() === n.toDateString() ? s.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : s.toLocaleDateString([], { month: "short", day: "numeric" });
  }
  const ba = e.derived(() => e.get(V).size > 0);
  var Ut = ki(), qt = e.first_child(Ut);
  pa(qt, { title: "Mail", subtitle: "Integrated email client" });
  var Pt = e.sibling(qt, 2), At = e.child(Pt), Tt = e.child(At), Ot = e.child(Tt), Vt = e.child(Ot);
  Ht(Vt, { class: "w-4 h-4" });
  var ha = e.sibling(Vt, 2);
  {
    var fa = (a) => {
      var s = xs(), n = e.child(s, !0);
      e.reset(s), e.template_effect(() => e.set_text(n, e.get(D).unread_inbox)), e.append(a, s);
    };
    e.if(ha, (a) => {
      e.get(D).unread_inbox > 0 && a(fa);
    });
  }
  e.reset(Ot);
  var Wt = e.sibling(Ot, 2), dt = e.child(Wt), xa = e.child(dt);
  {
    let a = e.derived(() => e.get(oe) ? "animate-spin" : "");
    rs(xa, {
      get class() {
        return `w-3 h-3 ${e.get(a) ?? ""}`;
      }
    });
  }
  e.reset(dt);
  var Ct = e.sibling(dt, 2), ya = e.child(Ct);
  et(ya, { class: "w-3 h-3" }), e.reset(Ct), e.reset(Wt), e.reset(Tt);
  var Gt = e.sibling(Tt, 2);
  {
    var wa = (a) => {
      var s = ws(), n = e.child(s);
      e.each(n, 21, () => e.get(o), e.index, (v, p) => {
        var h = ys(), P = e.child(h, !0);
        e.reset(h);
        var M = {};
        e.template_effect(() => {
          var _;
          e.set_selected(h, e.get(p).id === ((_ = e.get(r)) == null ? void 0 : _.id)), e.set_text(P, e.get(p).name), M !== (M = e.get(p).id) && (h.value = (h.__value = e.get(p).id) ?? "");
        }), e.append(v, h);
      }), e.reset(n), e.reset(s), e.delegated("change", n, (v) => {
        const p = e.get(o).find((h) => h.id === v.target.value);
        p && st(p);
      }), e.append(a, s);
    }, ka = (a) => {
      var s = ks(), n = e.child(s, !0);
      e.reset(s), e.template_effect(() => {
        var v;
        return e.set_text(n, (v = e.get(o)[0]) == null ? void 0 : v.email_address);
      }), e.append(a, s);
    };
    e.if(Gt, (a) => {
      e.get(o).length > 1 ? a(wa) : e.get(o).length === 1 && a(ka, 1);
    });
  }
  var Dt = e.sibling(Gt, 2), $a = e.child(Dt);
  {
    var Sa = (a) => {
      var s = e.comment(), n = e.first_child(s);
      e.each(n, 17, () => e.get(x), e.index, (v, p) => {
        const h = e.derived(() => ma(e.get(p).type));
        var P = Ss(), M = e.child(P);
        e.component(M, () => e.get(h), ($, A) => {
          A($, { class: "w-3.5 h-3.5 shrink-0" });
        });
        var _ = e.sibling(M, 2), w = e.child(_, !0);
        e.reset(_);
        var z = e.sibling(_, 2);
        {
          var k = ($) => {
            var A = $s(), B = e.child(A, !0);
            e.reset(A), e.template_effect(() => e.set_text(B, e.get(p).unread_count)), e.append($, A);
          };
          e.if(z, ($) => {
            e.get(p).unread_count > 0 && $(k);
          });
        }
        e.reset(P), e.template_effect(() => {
          var $;
          e.set_class(P, 1, `flex items-center gap-2 w-full px-3 py-1.5 text-sm rounded-lg mx-1 hover:bg-base-300 transition-colors ${(($ = e.get(l)) == null ? void 0 : $.id) === e.get(p).id ? "bg-primary/10 text-primary font-semibold" : ""}`), e.set_text(w, e.get(p).name);
        }), e.delegated("click", P, () => Be(e.get(p))), e.append(v, P);
      }), e.append(a, s);
    };
    e.if($a, (a) => {
      e.get(d) === "mail" && a(Sa);
    });
  }
  e.reset(Dt);
  var Et = e.sibling(Dt, 2);
  e.each(
    Et,
    21,
    () => [
      { id: "mail", icon: zt, label: "Mail" },
      {
        id: "drafts",
        icon: oa,
        label: "Drafts",
        badge: e.get(D).drafts
      },
      { id: "contacts", icon: _s, label: "Contacts" },
      { id: "signatures", icon: ps, label: "Signatures" },
      { id: "filters", icon: da, label: "Filters" }
    ],
    e.index,
    (a, s) => {
      var n = Ms(), v = e.child(n);
      e.component(v, () => e.get(s).icon, (M, _) => {
        _(M, { class: "w-3.5 h-3.5 shrink-0" });
      });
      var p = e.sibling(v), h = e.sibling(p);
      {
        var P = (M) => {
          var _ = Ns(), w = e.child(_, !0);
          e.reset(_), e.template_effect(() => e.set_text(w, e.get(s).badge)), e.append(M, _);
        };
        e.if(h, (M) => {
          e.get(s).badge > 0 && M(P);
        });
      }
      e.reset(n), e.template_effect(() => {
        e.set_class(n, 1, `flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-base-300 rounded-lg mx-1 transition-colors ${e.get(d) === e.get(s).id ? "text-primary font-semibold" : "text-base-content/60"}`), e.set_text(p, ` ${e.get(s).label ?? ""} `);
      }), e.delegated("click", n, () => {
        e.set(d, e.get(s).id, !0), e.get(s).id === "drafts" && ot(), e.get(s).id === "contacts" && wt(), e.get(s).id === "signatures" && Ke(), e.get(s).id === "filters" && jt();
      }), e.append(a, n);
    }
  ), e.reset(Et);
  var Zt = e.sibling(Et, 2), It = e.child(Zt), Na = e.child(It);
  Bt(Na, { class: "w-3 h-3" }), e.next(), e.reset(It), e.reset(Zt), e.reset(At);
  var Xt = e.sibling(At, 2), Ma = e.child(Xt);
  {
    var ja = (a) => {
      var s = Ws(), n = e.first_child(s), v = e.child(n), p = e.child(v), h = e.child(p);
      e.remove_input_defaults(h);
      var P = e.sibling(h, 2), M = e.child(P);
      cs(M, { class: "w-3 h-3" }), e.reset(P), e.reset(p);
      var _ = e.sibling(p, 2);
      {
        var w = (u) => {
          var b = Ps(), f = e.child(b), j = e.child(f);
          e.reset(f);
          var m = e.sibling(f, 2), H = e.child(m), I = e.sibling(e.child(H));
          ss(I, { class: "w-3 h-3" }), e.reset(H);
          var U = e.sibling(H, 2);
          {
            var ae = (ne) => {
              var Q = js(), Y = e.child(Q), se = e.child(Y);
              e.reset(Y);
              var O = e.sibling(Y, 2), S = e.child(O);
              e.reset(O);
              var ge = e.sibling(O, 2), $e = e.child(ge);
              e.reset(ge);
              var Ce = e.sibling(ge, 2), y = e.child(Ce);
              e.reset(Ce);
              var ve = e.sibling(Ce, 2), ue = e.child(ve);
              e.reset(ve), e.reset(Q), e.delegated("click", se, () => Oe("mark_read")), e.delegated("click", S, () => Oe("mark_unread")), e.delegated("click", $e, () => Oe("star")), e.delegated("click", y, () => Oe("delete")), e.delegated("click", ue, () => Oe("spam")), e.append(ne, Q);
            };
            e.if(U, (ne) => {
              e.get(Ve) && ne(ae);
            });
          }
          e.reset(m);
          var X = e.sibling(m, 2), pe = e.child(X);
          St(pe, { class: "w-3 h-3" }), e.reset(X), e.reset(b), e.template_effect(() => e.set_text(j, `${e.get(V).size ?? ""} selected`)), e.delegated("click", H, () => e.set(Ve, !e.get(Ve))), e.delegated("click", X, () => e.set(V, /* @__PURE__ */ new Set(), !0)), e.append(u, b);
        };
        e.if(_, (u) => {
          e.get(ba) && u(w);
        });
      }
      e.reset(v);
      var z = e.sibling(v, 2), k = e.child(z);
      {
        var $ = (u) => {
          var b = As();
          e.append(u, b);
        }, A = (u) => {
          var b = Ts(), f = e.child(b);
          zt(f, { class: "w-8 h-8" }), e.next(), e.reset(b), e.append(u, b);
        }, B = (u) => {
          var b = e.comment(), f = e.first_child(b);
          e.each(f, 17, () => e.get(i), e.index, (j, m) => {
            var H = Cs(), I = e.child(H);
            e.remove_input_defaults(I);
            var U = e.sibling(I, 2), ae = e.child(U), X = e.child(ae), pe = e.child(X, !0);
            e.reset(X);
            var ne = e.sibling(X, 2), Q = e.child(ne, !0);
            e.reset(ne), e.reset(ae);
            var Y = e.sibling(ae, 2), se = e.child(Y, !0);
            e.reset(Y);
            var O = e.sibling(Y, 2), S = e.child(O, !0);
            e.reset(O), e.reset(U);
            var ge = e.sibling(U, 2), $e = e.child(ge);
            {
              var Ce = (ue) => {
                var ke = Os();
                e.append(ue, ke);
              };
              e.if($e, (ue) => {
                e.get(m).is_read || ue(Ce);
              });
            }
            var y = e.sibling($e, 2), ve = e.child(y);
            {
              let ue = e.derived(() => e.get(m).is_starred ? "fill-yellow-400 text-yellow-400" : "");
              us(ve, {
                get class() {
                  return `w-3 h-3 ${e.get(ue) ?? ""}`;
                }
              });
            }
            e.reset(y), e.reset(ge), e.reset(H), e.template_effect(
              (ue, ke, Me) => {
                var ze;
                e.set_class(H, 1, `flex items-start group hover:bg-base-200 transition-colors ${((ze = e.get(g)) == null ? void 0 : ze.id) === e.get(m).id ? "bg-primary/10" : ""}`), e.set_class(I, 1, `checkbox checkbox-xs m-3 mt-4 shrink-0 opacity-0 group-hover:opacity-100 ${ue ?? ""}`), e.set_checked(I, ke), e.set_class(X, 1, `text-xs font-semibold truncate ${e.get(m).is_read ? "text-base-content/70" : "text-primary"}`), e.set_text(pe, e.get(m).from_name || e.get(m).from_address), e.set_text(Q, Me), e.set_class(Y, 1, `text-xs font-medium truncate ${e.get(m).is_read ? "text-base-content/60" : ""}`), e.set_text(se, e.get(m).subject || "(no subject)"), e.set_text(S, e.get(m).snippet || "");
              },
              [
                () => e.get(V).has(e.get(m).id) ? "opacity-100" : "",
                () => e.get(V).has(e.get(m).id),
                () => Jt(e.get(m).received_at)
              ]
            ), e.delegated("change", I, () => ft(e.get(m).id)), e.delegated("click", U, () => gt(e.get(m))), e.delegated("click", y, () => bt(e.get(m))), e.append(j, H);
          }), e.append(u, b);
        };
        e.if(k, (u) => {
          e.get(le) && e.get(i).length === 0 ? u($) : e.get(i).length === 0 ? u(A, 1) : u(B, -1);
        });
      }
      e.reset(z), e.reset(n);
      var G = e.sibling(n, 2), J = e.child(G);
      {
        var Z = (u) => {
          var b = Us(), f = e.first_child(b), j = e.child(f), m = e.child(j), H = e.child(m), I = e.child(H, !0);
          e.reset(H);
          var U = e.sibling(H, 2), ae = e.child(U), X = e.sibling(e.child(ae)), pe = e.child(X, !0);
          e.reset(X), e.reset(ae);
          var ne = e.sibling(ae, 2);
          {
            var Q = (N) => {
              var C = Ds(), De = e.child(C);
              e.reset(C), e.template_effect((Ye) => e.set_text(De, `To: ${Ye ?? ""}`), [
                () => e.get(g).to_addresses.map((Ye) => Ye.name || Ye.address).join(", ")
              ]), e.append(N, C);
            };
            e.if(ne, (N) => {
              var C;
              (C = e.get(g).to_addresses) != null && C.length && N(Q);
            });
          }
          var Y = e.sibling(ne, 2), se = e.child(Y, !0);
          e.reset(Y);
          var O = e.sibling(Y, 2);
          {
            var S = (N) => {
              var C = Es();
              e.append(N, C);
            };
            e.if(O, (N) => {
              e.get(g).priority === "high" && N(S);
            });
          }
          e.reset(U), e.reset(m);
          var ge = e.sibling(m, 2), $e = e.child(ge), Ce = e.child($e);
          os(Ce, { class: "w-3.5 h-3.5" }), e.reset($e);
          var y = e.sibling($e, 2), ve = e.child(y);
          ns(ve, { class: "w-3.5 h-3.5" }), e.reset(y);
          var ue = e.sibling(y, 2), ke = e.child(ue);
          ls(ke, { class: "w-3.5 h-3.5" }), e.reset(ue);
          var Me = e.sibling(ue, 2), ze = e.child(Me);
          Rt(ze, { class: "w-3.5 h-3.5" }), e.reset(Me);
          var Qe = e.sibling(Me, 2), kt = e.child(Qe);
          vt(kt, { class: "w-3.5 h-3.5" }), e.reset(Qe), e.reset(ge), e.reset(j);
          var ct = e.sibling(j, 2), pt = e.child(ct), La = e.child(pt);
          {
            var Fa = (N) => {
              var C = Is();
              e.append(N, C);
            }, za = (N) => {
              ca(N, { class: "w-3 h-3" });
            };
            e.if(La, (N) => {
              e.get(Se) ? N(Fa) : N(za, -1);
            });
          }
          e.next(), e.reset(pt);
          var $t = e.sibling(pt, 2), Ha = e.child($t);
          {
            var Ra = (N) => {
              var C = Ls();
              e.append(N, C);
            }, Ba = (N) => {
              ca(N, { class: "w-3 h-3" });
            };
            e.if(Ha, (N) => {
              e.get(He) ? N(Ra) : N(Ba, -1);
            });
          }
          e.next(), e.reset($t), e.reset(ct);
          var Ja = e.sibling(ct, 2);
          {
            var Ua = (N) => {
              var C = Fs(), De = e.child(C, !0);
              e.reset(C), e.template_effect(() => e.set_text(De, e.get(ce))), e.append(N, C);
            };
            e.if(Ja, (N) => {
              e.get(ce) && N(Ua);
            });
          }
          e.reset(f);
          var Yt = e.sibling(f, 2), ea = e.child(Yt);
          {
            var qa = (N) => {
              var C = zs();
              e.template_effect(() => e.set_attribute(C, "srcdoc", e.get(g).body_html)), e.append(N, C);
            }, Va = (N) => {
              var C = Hs(), De = e.child(C, !0);
              e.reset(C), e.template_effect(() => e.set_text(De, e.get(g).body_text)), e.append(N, C);
            }, Wa = (N) => {
              var C = Rs();
              e.append(N, C);
            };
            e.if(ea, (N) => {
              e.get(g).body_html ? N(qa) : e.get(g).body_text ? N(Va, 1) : N(Wa, -1);
            });
          }
          var Ga = e.sibling(ea, 2);
          {
            var Za = (N) => {
              var C = Js(), De = e.child(C), Ye = e.child(De);
              Rt(Ye, { class: "w-3.5 h-3.5" }), e.next(), e.reset(De);
              var ta = e.sibling(De, 2);
              e.each(ta, 21, () => e.get(g).attachments, e.index, (Xa, aa) => {
                var Lt = Bs(), sa = e.child(Lt);
                Rt(sa, { class: "w-3 h-3" });
                var ia = e.sibling(sa), la = e.sibling(ia), Ka = e.child(la);
                e.reset(la), e.reset(Lt), e.template_effect(
                  (Qa) => {
                    e.set_text(ia, ` ${e.get(aa).filename ?? ""} `), e.set_text(Ka, `(${Qa ?? ""} KB)`);
                  },
                  [() => (e.get(aa).size_bytes / 1024).toFixed(1)]
                ), e.append(Xa, Lt);
              }), e.reset(ta), e.reset(C), e.append(N, C);
            };
            e.if(Ga, (N) => {
              var C;
              ((C = e.get(g).attachments) == null ? void 0 : C.length) > 0 && N(Za);
            });
          }
          e.reset(Yt), e.template_effect(
            (N) => {
              e.set_text(I, e.get(g).subject || "(no subject)"), e.set_text(pe, e.get(g).from_name || e.get(g).from_address), e.set_text(se, N), pt.disabled = e.get(Se), $t.disabled = e.get(He);
            },
            [
              () => new Date(e.get(g).received_at).toLocaleString()
            ]
          ), e.delegated("click", $e, () => Je("reply")), e.delegated("click", y, () => Je("reply_all")), e.delegated("click", ue, () => Je("forward")), e.delegated("click", Me, ht), e.delegated("click", Qe, () => it(e.get(g))), e.delegated("click", pt, rt), e.delegated("click", $t, nt), e.append(u, b);
        }, K = (u) => {
          var b = qs(), f = e.child(b);
          Ht(f, { class: "w-16 h-16" });
          var j = e.sibling(f, 4), m = e.child(j);
          et(m, { class: "w-4 h-4" }), e.next(), e.reset(j), e.reset(b), e.delegated("click", j, () => e.set(Ne, !0)), e.append(u, b);
        }, E = (u) => {
          var b = Vs();
          e.append(u, b);
        };
        e.if(J, (u) => {
          e.get(g) ? u(Z) : e.get(o).length === 0 && !e.get(le) ? u(K, 1) : u(E, -1);
        });
      }
      e.reset(G), e.delegated("keydown", h, (u) => u.key === "Enter" && T(`/api/mail/search?q=${encodeURIComponent(e.get(me))}`).then((b) => e.set(i, b.messages, !0))), e.bind_value(h, () => e.get(me), (u) => e.set(me, u)), e.delegated("click", P, () => T(`/api/mail/search?q=${encodeURIComponent(e.get(me))}`).then((u) => e.set(i, u.messages, !0))), e.append(a, s);
    }, Pa = (a) => {
      var s = Xs(), n = e.sibling(e.child(s), 2);
      e.each(
        n,
        21,
        () => e.get(Re),
        e.index,
        (v, p) => {
          var h = Gs(), P = e.child(h), M = e.child(P), _ = e.child(M), w = e.child(_, !0);
          e.reset(_);
          var z = e.sibling(_, 2), k = e.child(z);
          e.reset(z), e.reset(M);
          var $ = e.sibling(M, 2), A = e.child($), B = e.sibling(A, 2), G = e.child(B);
          vt(G, { class: "w-3 h-3" }), e.reset(B), e.reset($), e.reset(P), e.reset(h), e.template_effect(
            (J, Z) => {
              e.set_text(w, e.get(p).subject || "(no subject)"), e.set_text(k, `To: ${J ?? ""}
                    · ${Z ?? ""}`);
            },
            [
              () => Array.isArray(e.get(p).to_addresses) ? e.get(p).to_addresses.map((J) => J.address).join(", ") : "—",
              () => e.get(p).auto_saved_at ? "Saved " + Jt(e.get(p).auto_saved_at) : "Draft"
            ]
          ), e.delegated("click", A, () => yt(e.get(p))), e.delegated("click", B, () => Nt(e.get(p).id)), e.append(v, h);
        },
        (v) => {
          var p = Zs(), h = e.child(p);
          oa(h, { class: "w-8 h-8 mx-auto mb-2" }), e.next(), e.reset(p), e.append(v, p);
        }
      ), e.reset(n), e.reset(s), e.append(a, s);
    }, Aa = (a) => {
      var s = Ys(), n = e.child(s), v = e.sibling(e.child(n), 2);
      e.remove_input_defaults(v), e.reset(n);
      var p = e.sibling(n, 2), h = e.child(p), P = e.sibling(e.child(h));
      e.each(
        P,
        21,
        () => e.get(Ue),
        e.index,
        (M, _) => {
          var w = Ks(), z = e.child(w), k = e.child(z, !0);
          e.reset(z);
          var $ = e.sibling(z), A = e.child($, !0);
          e.reset($);
          var B = e.sibling($), G = e.child(B, !0);
          e.reset(B);
          var J = e.sibling(B), Z = e.child(J), K = e.child(Z);
          e.reset(Z), e.reset(J), e.reset(w), e.template_effect(() => {
            e.set_text(k, e.get(_).email), e.set_text(A, e.get(_).display_name || "—"), e.set_text(G, e.get(_).company || "—"), e.set_text(K, `${e.get(_).frequency ?? ""}x`);
          }), e.append(M, w);
        },
        (M) => {
          var _ = Qs();
          e.append(M, _);
        }
      ), e.reset(P), e.reset(h), e.reset(p), e.reset(s), e.delegated("keydown", v, (M) => M.key === "Enter" && wt()), e.bind_value(v, () => e.get(qe), (M) => e.set(qe, M)), e.append(a, s);
    }, Ta = (a) => {
      var s = ii(), n = e.child(s), v = e.sibling(e.child(n), 2), p = e.child(v);
      et(p, { class: "w-3 h-3" }), e.next(), e.reset(v), e.reset(n);
      var h = e.sibling(n, 2);
      {
        var P = (_) => {
          var w = ei(), z = e.child(w), k = e.child(z), $ = e.child(k, !0);
          e.reset(k);
          var A = e.sibling(k, 2), B = e.sibling(e.child(A), 2);
          e.remove_input_defaults(B), e.reset(A);
          var G = e.sibling(A, 2), J = e.sibling(e.child(G), 2);
          e.remove_textarea_child(J), e.reset(G);
          var Z = e.sibling(G, 2), K = e.child(Z);
          e.remove_input_defaults(K), e.next(2), e.reset(Z);
          var E = e.sibling(Z, 2), u = e.child(E), b = e.sibling(u, 2);
          e.reset(E), e.reset(z), e.reset(w), e.template_effect(
            (f) => {
              e.set_text($, e.get(ye) ? "Edit Signature" : "New Signature"), u.disabled = f;
            },
            [() => !e.get(we).trim()]
          ), e.bind_value(B, () => e.get(we), (f) => e.set(we, f)), e.bind_value(J, () => e.get(Te), (f) => e.set(Te, f)), e.bind_checked(K, () => e.get(Ie), (f) => e.set(Ie, f)), e.delegated("click", u, Mt), e.delegated("click", b, () => e.set(ye, void 0)), e.append(_, w);
        };
        e.if(h, (_) => {
          e.get(ye) !== void 0 && _(P);
        });
      }
      var M = e.sibling(h, 2);
      e.each(
        M,
        21,
        () => e.get(at),
        e.index,
        (_, w) => {
          var z = ai(), k = e.child(z), $ = e.child(k), A = e.child($), B = e.child(A), G = e.sibling(B);
          {
            var J = (j) => {
              var m = ti();
              e.append(j, m);
            };
            e.if(G, (j) => {
              e.get(w).is_default && j(J);
            });
          }
          e.reset(A);
          var Z = e.sibling(A, 2), K = e.child(Z);
          e.reset(Z), e.reset($);
          var E = e.sibling($, 2), u = e.child(E), b = e.sibling(u, 2), f = e.child(b);
          vt(f, { class: "w-3 h-3" }), e.reset(b), e.reset(E), e.reset(k), e.reset(z), e.template_effect(
            (j) => {
              e.set_text(B, `${e.get(w).name ?? ""} `), e.set_text(K, `${j ?? ""}...`);
            },
            [
              () => e.get(w).body_html.replace(/<[^>]*>/g, "").slice(0, 80)
            ]
          ), e.delegated("click", u, () => {
            e.set(ye, e.get(w), !0), e.set(we, e.get(w).name, !0), e.set(Te, e.get(w).body_html, !0), e.set(Ie, e.get(w).is_default, !0);
          }), e.delegated("click", b, () => va(e.get(w).id)), e.append(_, z);
        },
        (_) => {
          var w = si();
          e.append(_, w);
        }
      ), e.reset(M), e.reset(s), e.delegated("click", v, () => {
        e.set(ye, null), e.set(we, ""), e.set(Te, ""), e.set(Ie, !1);
      }), e.append(a, s);
    }, Oa = (a) => {
      var s = ci(), n = e.child(s), v = e.sibling(e.child(n), 2), p = e.child(v);
      et(p, { class: "w-3 h-3" }), e.next(), e.reset(v), e.reset(n);
      var h = e.sibling(n, 2);
      {
        var P = (_) => {
          var w = li();
          e.append(_, w);
        }, M = (_) => {
          var w = di();
          e.each(
            w,
            21,
            () => e.get(Le),
            e.index,
            (z, k) => {
              var $ = ni(), A = e.child($), B = e.child(A), G = e.child(B), J = e.child(G), Z = e.child(J, !0);
              e.reset(J);
              var K = e.sibling(J, 2);
              {
                var E = (I) => {
                  var U = ri();
                  e.append(I, U);
                };
                e.if(K, (I) => {
                  e.get(k).is_active || I(E);
                });
              }
              e.reset(G);
              var u = e.sibling(G, 2), b = e.child(u);
              e.reset(u), e.reset(B);
              var f = e.sibling(B, 2), j = e.child(f);
              e.remove_input_defaults(j);
              var m = e.sibling(j, 2), H = e.child(m);
              vt(H, { class: "w-3 h-3" }), e.reset(m), e.reset(f), e.reset(A), e.reset($), e.template_effect(
                (I, U) => {
                  e.set_text(Z, e.get(k).name), e.set_text(b, `${I ?? ""} condition(s) →
                      ${U ?? ""}`), e.set_checked(j, e.get(k).is_active);
                },
                [
                  () => (typeof e.get(k).conditions == "string" ? JSON.parse(e.get(k).conditions) : e.get(k).conditions).length,
                  () => (typeof e.get(k).actions == "string" ? JSON.parse(e.get(k).actions) : e.get(k).actions).map((I) => I.type).join(", ")
                ]
              ), e.delegated("change", j, () => _a(e.get(k))), e.delegated("click", m, () => ga(e.get(k).id)), e.append(z, $);
            },
            (z) => {
              var k = oi(), $ = e.child(k);
              da($, { class: "w-8 h-8 mx-auto mb-2" }), e.next(), e.reset(k), e.append(z, k);
            }
          ), e.reset(w), e.append(_, w);
        };
        e.if(h, (_) => {
          e.get(r) ? _(M, -1) : _(P);
        });
      }
      e.reset(s), e.template_effect(() => v.disabled = !e.get(r)), e.delegated("click", v, () => e.set(Fe, !0)), e.append(a, s);
    };
    e.if(Ma, (a) => {
      e.get(d) === "mail" ? a(ja) : e.get(d) === "drafts" ? a(Pa, 1) : e.get(d) === "contacts" ? a(Aa, 2) : e.get(d) === "signatures" ? a(Ta, 3) : e.get(d) === "filters" && a(Oa, 4);
    });
  }
  e.reset(Xt), e.reset(Pt);
  var Kt = e.sibling(Pt, 2);
  {
    var Ca = (a) => {
      var s = gi(), n = e.child(s), v = e.child(n), p = e.child(v), h = e.child(p, !0);
      e.reset(p);
      var P = e.sibling(p, 2), M = e.child(P);
      {
        var _ = (y) => {
          var ve = pi();
          e.append(y, ve);
        };
        e.if(M, (y) => {
          e.get(re) && y(_);
        });
      }
      var w = e.sibling(M, 2), z = e.child(w);
      St(z, { class: "w-4 h-4" }), e.reset(w), e.reset(P), e.reset(v);
      var k = e.sibling(v, 2), $ = e.child(k), A = e.sibling(e.child($), 2);
      e.remove_input_defaults(A);
      var B = e.sibling(A, 2);
      {
        var G = (y) => {
          var ve = ui();
          e.each(ve, 21, () => e.get(xe), e.index, (ue, ke) => {
            var Me = vi(), ze = e.child(Me), Qe = e.child(ze), kt = e.sibling(Qe), ct = e.child(kt);
            e.reset(kt), e.reset(ze), e.reset(Me), e.template_effect(() => {
              e.set_text(Qe, `${(e.get(ke).display_name ? `${e.get(ke).display_name} <${e.get(ke).email}>` : e.get(ke).email) ?? ""} `), e.set_text(ct, `${e.get(ke).frequency ?? ""}x`);
            }), e.delegated("click", ze, () => Xe(e.get(ke))), e.append(ue, Me);
          }), e.reset(ve), e.append(y, ve);
        };
        e.if(B, (y) => {
          e.get(Ae) && e.get(xe).length > 0 && y(G);
        });
      }
      e.reset($);
      var J = e.sibling($, 2), Z = e.sibling(e.child(J), 2);
      e.remove_input_defaults(Z), e.reset(J);
      var K = e.sibling(J, 2), E = e.sibling(e.child(K), 2);
      e.remove_input_defaults(E), e.reset(K);
      var u = e.sibling(K, 2), b = e.sibling(e.child(u), 2);
      e.remove_input_defaults(b), e.reset(u);
      var f = e.sibling(u, 2), j = e.child(f), m = e.sibling(e.child(j)), H = e.child(m);
      H.value = H.__value = "normal";
      var I = e.sibling(H);
      I.value = I.__value = "high";
      var U = e.sibling(I);
      U.value = U.__value = "low", e.reset(m), e.reset(j);
      var ae = e.sibling(j, 2), X = e.child(ae);
      e.remove_input_defaults(X), e.next(), e.reset(ae), e.reset(f);
      var pe = e.sibling(f, 2), ne = e.sibling(e.child(pe), 2);
      e.remove_textarea_child(ne), e.reset(pe), e.reset(k);
      var Q = e.sibling(k, 2), Y = e.child(Q), se = e.sibling(Y, 2), O = e.sibling(se, 2), S = e.child(O);
      {
        var ge = (y) => {
          var ve = _i();
          e.append(y, ve);
        }, $e = (y) => {
          Bt(y, { class: "w-4 h-4" });
        };
        e.if(S, (y) => {
          e.get(te) ? y(ge) : y($e, -1);
        });
      }
      e.next(), e.reset(O), e.reset(Q), e.reset(n);
      var Ce = e.sibling(n, 2);
      e.reset(s), e.template_effect(
        (y) => {
          e.set_text(h, e.get(W) ? "Reply" : e.get(re) ? "Draft" : "New Message"), O.disabled = y;
        },
        [
          () => e.get(te) || !e.get(de).trim() || !e.get(he).trim()
        ]
      ), e.delegated("click", w, () => e.set(L, !1)), e.delegated("input", A, (y) => {
        var ve;
        q(((ve = y.target.value.split(",").pop()) == null ? void 0 : ve.trim()) ?? ""), e.set(Ae, !0);
      }), e.event("blur", A, () => setTimeout(() => e.set(Ae, !1), 200)), e.bind_value(A, () => e.get(de), (y) => e.set(de, y)), e.bind_value(Z, () => e.get(_e), (y) => e.set(_e, y)), e.bind_value(E, () => e.get(be), (y) => e.set(be, y)), e.bind_value(b, () => e.get(he), (y) => e.set(he, y)), e.bind_select_value(m, () => e.get(tt), (y) => e.set(tt, y)), e.bind_checked(X, () => e.get(F), (y) => e.set(F, y)), e.bind_value(ne, () => e.get(fe), (y) => e.set(fe, y)), e.delegated("click", Y, Ze), e.delegated("click", se, () => e.set(L, !1)), e.delegated("click", O, xt), e.delegated("click", Ce, () => e.set(L, !1)), e.append(a, s);
    };
    e.if(Kt, (a) => {
      e.get(L) && a(Ca);
    });
  }
  var Qt = e.sibling(Kt, 2);
  {
    var Da = (a) => {
      var s = bi(), n = e.child(s), v = e.sibling(e.child(n), 2), p = e.child(v), h = e.child(p), P = e.sibling(e.child(h), 2);
      e.remove_input_defaults(P), e.reset(h);
      var M = e.sibling(h, 2), _ = e.sibling(e.child(M), 2);
      e.remove_input_defaults(_), e.reset(M), e.reset(p);
      var w = e.sibling(p, 2), z = e.sibling(e.child(w), 2);
      e.remove_input_defaults(z), e.reset(w);
      var k = e.sibling(w, 4), $ = e.child(k), A = e.sibling(e.child($), 2);
      e.remove_input_defaults(A), e.reset($);
      var B = e.sibling($, 2), G = e.sibling(e.child(B), 2);
      e.remove_input_defaults(G), e.reset(B), e.reset(k);
      var J = e.sibling(k, 2), Z = e.child(J), K = e.sibling(e.child(Z), 2);
      e.remove_input_defaults(K), e.reset(Z);
      var E = e.sibling(Z, 2), u = e.sibling(e.child(E), 2);
      e.remove_input_defaults(u), e.reset(E), e.reset(J);
      var b = e.sibling(J, 2), f = e.child(b);
      e.remove_input_defaults(f), e.next(2), e.reset(b);
      var j = e.sibling(b, 4), m = e.child(j), H = e.sibling(e.child(m), 2);
      e.remove_input_defaults(H), e.reset(m);
      var I = e.sibling(m, 2), U = e.sibling(e.child(I), 2);
      e.remove_input_defaults(U), e.reset(I), e.reset(j);
      var ae = e.sibling(j, 2), X = e.child(ae);
      e.remove_input_defaults(X), e.next(2), e.reset(ae), e.reset(v);
      var pe = e.sibling(v, 2), ne = e.child(pe), Q = e.sibling(ne, 2), Y = e.child(Q);
      {
        var se = (S) => {
          var ge = mi();
          e.append(S, ge);
        };
        e.if(Y, (S) => {
          e.get(Ee) && S(se);
        });
      }
      e.next(), e.reset(Q), e.reset(pe), e.reset(n);
      var O = e.sibling(n, 2);
      e.reset(s), e.template_effect(() => Q.disabled = e.get(Ee) || !e.get(R).email_address || !e.get(R).imap_host), e.bind_value(P, () => e.get(R).name, (S) => e.get(R).name = S), e.bind_value(_, () => e.get(R).email_address, (S) => e.get(R).email_address = S), e.bind_value(z, () => e.get(R).display_name, (S) => e.get(R).display_name = S), e.bind_value(A, () => e.get(R).imap_host, (S) => e.get(R).imap_host = S), e.bind_value(G, () => e.get(R).imap_port, (S) => e.get(R).imap_port = S), e.bind_value(K, () => e.get(R).imap_user, (S) => e.get(R).imap_user = S), e.bind_value(u, () => e.get(R).imap_password, (S) => e.get(R).imap_password = S), e.bind_checked(f, () => e.get(R).imap_secure, (S) => e.get(R).imap_secure = S), e.bind_value(H, () => e.get(R).smtp_host, (S) => e.get(R).smtp_host = S), e.bind_value(U, () => e.get(R).smtp_port, (S) => e.get(R).smtp_port = S), e.bind_checked(X, () => e.get(R).is_default, (S) => e.get(R).is_default = S), e.delegated("click", ne, () => e.set(Ne, !1)), e.delegated("click", Q, async () => {
        e.set(Ee, !0);
        try {
          await T("/api/mail/accounts", { method: "POST", body: JSON.stringify(e.get(R)) }), e.set(Ne, !1), e.set(
            R,
            {
              name: "",
              email_address: "",
              display_name: "",
              imap_host: "",
              imap_port: 993,
              imap_secure: !0,
              imap_user: "",
              imap_password: "",
              smtp_host: "",
              smtp_port: 587,
              smtp_secure: !0,
              smtp_user: "",
              smtp_password: "",
              is_default: !1
            },
            !0
          ), await We();
        } catch (S) {
          je.error(S.message ?? "Operation failed");
        } finally {
          e.set(Ee, !1);
        }
      }), e.delegated("click", O, () => e.set(Ne, !1)), e.append(a, s);
    };
    e.if(Qt, (a) => {
      e.get(Ne) && a(Da);
    });
  }
  var Ea = e.sibling(Qt, 2);
  {
    var Ia = (a) => {
      var s = wi(), n = e.child(s), v = e.sibling(e.child(n), 2), p = e.child(v), h = e.sibling(e.child(p), 2);
      e.remove_input_defaults(h), e.reset(p);
      var P = e.sibling(p, 2), M = e.sibling(e.child(P), 2);
      e.each(M, 17, () => e.get(ie).conditions, e.index, (K, E, u) => {
        var b = hi(), f = e.child(b), j = e.child(f);
        j.value = j.__value = "from";
        var m = e.sibling(j);
        m.value = m.__value = "to";
        var H = e.sibling(m);
        H.value = H.__value = "subject";
        var I = e.sibling(H);
        I.value = I.__value = "body", e.reset(f);
        var U = e.sibling(f, 2), ae = e.child(U);
        ae.value = ae.__value = "contains";
        var X = e.sibling(ae);
        X.value = X.__value = "is";
        var pe = e.sibling(X);
        pe.value = pe.__value = "begins_with";
        var ne = e.sibling(pe);
        ne.value = ne.__value = "ends_with", e.reset(U);
        var Q = e.sibling(U, 2);
        e.remove_input_defaults(Q);
        var Y = e.sibling(Q, 2), se = e.child(Y);
        St(se, { class: "w-3 h-3" }), e.reset(Y), e.reset(b), e.bind_select_value(f, () => e.get(E).field, (O) => e.get(E).field = O), e.bind_select_value(U, () => e.get(E).operator, (O) => e.get(E).operator = O), e.bind_value(Q, () => e.get(E).value, (O) => e.get(E).value = O), e.delegated("click", Y, () => e.get(ie).conditions = e.get(ie).conditions.filter((O, S) => S !== u)), e.append(K, b);
      });
      var _ = e.sibling(M, 2), w = e.child(_);
      et(w, { class: "w-3 h-3" }), e.next(), e.reset(_), e.reset(P);
      var z = e.sibling(P, 2), k = e.sibling(e.child(z), 2);
      e.each(k, 17, () => e.get(ie).actions, e.index, (K, E, u) => {
        var b = yi(), f = e.child(b), j = e.child(f);
        j.value = j.__value = "mark_read";
        var m = e.sibling(j);
        m.value = m.__value = "mark_starred";
        var H = e.sibling(m);
        H.value = H.__value = "move";
        var I = e.sibling(H);
        I.value = I.__value = "delete";
        var U = e.sibling(I);
        U.value = U.__value = "forward";
        var ae = e.sibling(U);
        ae.value = ae.__value = "stop", e.reset(f);
        var X = e.sibling(f, 2);
        {
          var pe = (se) => {
            var O = fi();
            e.remove_input_defaults(O), e.bind_value(O, () => e.get(E).folder, (S) => e.get(E).folder = S), e.append(se, O);
          }, ne = (se) => {
            var O = xi();
            e.remove_input_defaults(O), e.bind_value(O, () => e.get(E).address, (S) => e.get(E).address = S), e.append(se, O);
          };
          e.if(X, (se) => {
            e.get(E).type === "move" ? se(pe) : e.get(E).type === "forward" && se(ne, 1);
          });
        }
        var Q = e.sibling(X, 2), Y = e.child(Q);
        St(Y, { class: "w-3 h-3" }), e.reset(Q), e.reset(b), e.bind_select_value(f, () => e.get(E).type, (se) => e.get(E).type = se), e.delegated("click", Q, () => e.get(ie).actions = e.get(ie).actions.filter((se, O) => O !== u)), e.append(K, b);
      });
      var $ = e.sibling(k, 2), A = e.child($);
      et(A, { class: "w-3 h-3" }), e.next(), e.reset($), e.reset(z), e.reset(v);
      var B = e.sibling(v, 2), G = e.child(B), J = e.sibling(G, 2);
      e.reset(B), e.reset(n);
      var Z = e.sibling(n, 2);
      e.reset(s), e.template_effect(() => J.disabled = !e.get(ie).name || !e.get(ie).conditions.length), e.bind_value(h, () => e.get(ie).name, (K) => e.get(ie).name = K), e.delegated("click", _, () => e.get(ie).conditions = [
        ...e.get(ie).conditions,
        { field: "from", operator: "contains", value: "" }
      ]), e.delegated("click", $, () => e.get(ie).actions = [...e.get(ie).actions, { type: "mark_read" }]), e.delegated("click", G, () => e.set(Fe, !1)), e.delegated("click", J, ua), e.delegated("click", Z, () => e.set(Fe, !1)), e.append(a, s);
    };
    e.if(Ea, (a) => {
      e.get(Fe) && a(Ia);
    });
  }
  e.template_effect(() => dt.disabled = e.get(oe) || !e.get(r)), e.delegated("click", dt, mt), e.delegated("click", Ct, () => e.set(Ne, !0)), e.delegated("click", It, () => lt()), e.append(c, Ut), e.pop();
}
e.delegate(["click", "change", "keydown", "input"]);
var Si = e.from_html('<a class="text-base-content/60 hover:text-base-content"> </a>'), Ni = e.from_html('<span class="text-base-content font-medium"> </span>'), Mi = e.from_html("<li><!></li>"), ji = e.from_html("<div><ul></ul></div>");
function Pi(c, t) {
  e.push(t, !0);
  let d = e.prop(t, "class", 3, "");
  var o = ji(), r = e.child(o);
  e.each(r, 21, () => t.crumbs, e.index, (x, l, i) => {
    var g = Mi(), V = e.child(g);
    {
      var me = (oe) => {
        var D = Si(), L = e.child(D, !0);
        e.reset(D), e.template_effect(() => {
          e.set_attribute(D, "href", e.get(l).href), e.set_text(L, e.get(l).label);
        }), e.append(oe, D);
      }, le = (oe) => {
        var D = Ni(), L = e.child(D, !0);
        e.reset(D), e.template_effect(() => e.set_text(L, e.get(l).label)), e.append(oe, D);
      };
      e.if(V, (oe) => {
        e.get(l).href && i < t.crumbs.length - 1 ? oe(me) : oe(le, -1);
      });
    }
    e.reset(g), e.append(x, g);
  }), e.reset(r), e.reset(o), e.template_effect(() => e.set_class(o, 1, `breadcrumbs text-sm ${d() ?? ""}`)), e.append(c, o), e.pop();
}
var Ai = e.from_html('<span class="loading loading-spinner loading-sm"></span>'), Ti = e.from_html('<button class="btn btn-primary gap-2"><!> Save Settings</button>'), Oi = e.from_html('<div class="alert alert-error text-sm"> </div>'), Ci = e.from_html('<div class="alert alert-success text-sm">Settings saved successfully.</div>'), Di = e.from_html('<div class="flex justify-center py-12"><span class="loading loading-spinner loading-lg"></span></div>'), Ei = e.from_html('<div class="flex items-center justify-between py-1"><div><p class="font-medium text-sm"> </p> <p class="text-xs text-base-content/50"> </p></div> <input type="checkbox" class="toggle toggle-sm"/></div>'), Ii = e.from_html('<div class="card bg-base-200 shadow"><div class="card-body gap-4"><h2 class="card-title text-base">General</h2> <div class="flex items-center justify-between"><div><p class="font-medium text-sm">Mail Client Enabled</p> <p class="text-xs text-base-content/50">Allow users to access the mail client feature</p></div> <input type="checkbox" class="toggle toggle-primary"/></div> <div class="divider my-0"></div> <div class="grid grid-cols-2 gap-4"><div class="form-control"><label class="label" for="mail-max-accounts"><span class="label-text text-sm">Max accounts per user</span></label> <input id="mail-max-accounts" class="input input-bordered input-sm" type="number" min="1" max="50"/></div> <div class="form-control"><label class="label" for="mail-max-attach"><span class="label-text text-sm">Max attachment size (MB)</span></label> <input id="mail-max-attach" class="input input-bordered input-sm" type="number" min="1" max="100"/></div> <div class="form-control"><label class="label" for="mail-max-sync"><span class="label-text text-sm">Max messages to sync per account</span></label> <input id="mail-max-sync" class="input input-bordered input-sm" type="number" min="50" max="10000"/></div> <div class="form-control"><label class="label" for="mail-sync-interval"><span class="label-text text-sm">Sync interval (minutes)</span></label> <input id="mail-sync-interval" class="input input-bordered input-sm" type="number" min="1" max="60"/></div> <div class="form-control"><label class="label" for="mail-trash-days"><span class="label-text text-sm">Trash auto-delete (days, 0 = never)</span></label> <input id="mail-trash-days" class="input input-bordered input-sm" type="number" min="0" max="365"/></div></div></div></div> <div class="card bg-base-200 shadow"><div class="card-body gap-3"><h2 class="card-title text-base">Features</h2> <!></div></div> <div class="card bg-base-200 shadow"><div class="card-body gap-4"><h2 class="card-title text-base flex items-center gap-2"><!> Domain Restrictions</h2> <div class="grid grid-cols-2 gap-4"><div class="form-control"><label class="label" for="mail-allowed-domains"><span class="label-text text-sm">Allowed domains</span> <span class="label-text-alt text-xs">(one per line, empty = all allowed)</span></label> <textarea id="mail-allowed-domains" class="textarea textarea-bordered min-h-24 font-mono text-xs" placeholder="gmail.com company.com"></textarea></div> <div class="form-control"><label class="label" for="mail-blocked-domains"><span class="label-text text-sm">Blocked domains</span> <span class="label-text-alt text-xs">(one per line)</span></label> <textarea id="mail-blocked-domains" class="textarea textarea-bordered min-h-24 font-mono text-xs" placeholder="spam.com tempmail.com"></textarea></div></div></div></div> <div class="card bg-base-200 shadow"><div class="card-body gap-4"><h2 class="card-title text-base">OAuth2 (Gmail / Outlook)</h2> <p class="text-sm text-base-content/60">Configure OAuth2 app credentials for one-click Gmail and Outlook account setup.</p> <div class="grid grid-cols-2 gap-3"><div class="col-span-2 font-semibold text-sm text-base-content/70">Gmail</div> <div class="form-control"><div class="label py-1"><span class="label-text text-sm">Client ID</span></div> <input class="input input-bordered input-sm" placeholder="xxx.apps.googleusercontent.com"/></div> <div class="form-control"><div class="label py-1"><span class="label-text text-sm">Client Secret</span></div> <input class="input input-bordered input-sm" type="password"/></div> <div class="col-span-2 font-semibold text-sm text-base-content/70 mt-2">Outlook / Microsoft 365</div> <div class="form-control"><div class="label py-1"><span class="label-text text-sm">Client ID</span></div> <input class="input input-bordered input-sm" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"/></div> <div class="form-control"><div class="label py-1"><span class="label-text text-sm">Client Secret</span></div> <input class="input input-bordered input-sm" type="password"/></div></div></div></div>', 1), Li = e.from_html('<div class="p-6 max-w-3xl mx-auto space-y-6"><!> <!> <!> <!> <!></div>');
function Fi(c, t) {
  e.push(t, !0);
  const d = "";
  let o = e.state(!0), r = e.state(!1), x = e.state(""), l = e.state(!1), i = e.state(e.proxy({
    enabled: !0,
    max_accounts_per_user: 5,
    max_attachment_size_mb: 25,
    allowed_domains: [],
    blocked_domains: [],
    require_admin_approval: !1,
    auto_collect_contacts: !0,
    imap_idle_enabled: !0,
    sieve_enabled: !0,
    pgp_enabled: !0,
    oauth2_gmail_client_id: "",
    oauth2_gmail_client_secret: "",
    oauth2_outlook_client_id: "",
    oauth2_outlook_client_secret: "",
    max_messages_sync: 1e3,
    sync_interval_minutes: 5,
    trash_auto_delete_days: 30
  })), g = e.state(""), V = e.state("");
  async function me() {
    e.set(o, !0), e.set(x, "");
    try {
      const F = await fetch(`${ut}/api/mail/admin/config`, { credentials: "include" });
      if (!F.ok) throw new Error(await F.text());
      const te = await F.json();
      e.set(i, { ...e.get(i), ...te.config }, !0), e.set(g, (e.get(i).allowed_domains || []).join(`
`), !0), e.set(V, (e.get(i).blocked_domains || []).join(`
`), !0);
    } catch (F) {
      e.set(x, F.message, !0);
    } finally {
      e.set(o, !1);
    }
  }
  async function le() {
    e.set(r, !0), e.set(x, ""), e.set(l, !1);
    try {
      const F = {
        ...e.get(i),
        allowed_domains: e.get(g).split(`
`).map((W) => W.trim()).filter(Boolean),
        blocked_domains: e.get(V).split(`
`).map((W) => W.trim()).filter(Boolean)
      }, te = await fetch(`${ut}/api/mail/admin/config`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(F)
      });
      if (!te.ok) {
        const W = await te.json().catch(() => ({}));
        throw new Error(W.error || `${te.status}`);
      }
      e.set(l, !0), setTimeout(() => e.set(l, !1), 3e3);
    } catch (F) {
      e.set(x, F.message, !0);
    } finally {
      e.set(r, !1);
    }
  }
  e.user_effect(() => {
    me();
  });
  var oe = Li(), D = e.child(oe);
  Pi(D, {
    crumbs: [
      { label: "Mail", href: `${d}/mail` },
      { label: "Settings" }
    ]
  });
  var L = e.sibling(D, 2);
  pa(L, {
    title: "Mail Settings",
    subtitle: "Global configuration for the Zveltio Mail Client (admin only).",
    children: (F, te) => {
      var W = Ti(), Pe = e.child(W);
      {
        var xe = (ce) => {
          var Se = Ai();
          e.append(ce, Se);
        }, Ae = (ce) => {
          ds(ce, { class: "w-4 h-4" });
        };
        e.if(Pe, (ce) => {
          e.get(r) ? ce(xe) : ce(Ae, -1);
        });
      }
      e.next(), e.reset(W), e.template_effect(() => W.disabled = e.get(r) || e.get(o)), e.delegated("click", W, le), e.append(F, W);
    },
    $$slots: { default: !0 }
  });
  var re = e.sibling(L, 2);
  {
    var de = (F) => {
      var te = Oi(), W = e.child(te, !0);
      e.reset(te), e.template_effect(() => e.set_text(W, e.get(x))), e.append(F, te);
    };
    e.if(re, (F) => {
      e.get(x) && F(de);
    });
  }
  var _e = e.sibling(re, 2);
  {
    var be = (F) => {
      var te = Ci();
      e.append(F, te);
    };
    e.if(_e, (F) => {
      e.get(l) && F(be);
    });
  }
  var he = e.sibling(_e, 2);
  {
    var fe = (F) => {
      var te = Di();
      e.append(F, te);
    }, tt = (F) => {
      var te = Ii(), W = e.first_child(te), Pe = e.child(W), xe = e.sibling(e.child(Pe), 2), Ae = e.sibling(e.child(xe), 2);
      e.remove_input_defaults(Ae), e.reset(xe);
      var ce = e.sibling(xe, 4), Se = e.child(ce), He = e.sibling(e.child(Se), 2);
      e.remove_input_defaults(He), e.reset(Se);
      var Ne = e.sibling(Se, 2), R = e.sibling(e.child(Ne), 2);
      e.remove_input_defaults(R), e.reset(Ne);
      var Ee = e.sibling(Ne, 2), Re = e.sibling(e.child(Ee), 2);
      e.remove_input_defaults(Re), e.reset(Ee);
      var Ue = e.sibling(Ee, 2), qe = e.sibling(e.child(Ue), 2);
      e.remove_input_defaults(qe), e.reset(Ue);
      var at = e.sibling(Ue, 2), ye = e.sibling(e.child(at), 2);
      e.remove_input_defaults(ye), e.reset(at), e.reset(ce), e.reset(Pe), e.reset(W);
      var we = e.sibling(W, 2), Te = e.child(we), Ie = e.sibling(e.child(Te), 2);
      e.each(
        Ie,
        16,
        () => [
          {
            key: "auto_collect_contacts",
            label: "Auto-collect contacts",
            desc: "Automatically add recipients to address book when sending"
          },
          {
            key: "imap_idle_enabled",
            label: "IMAP IDLE (push)",
            desc: "Real-time push notifications for new messages (when supported by server)"
          },
          {
            key: "sieve_enabled",
            label: "Sieve Filters",
            desc: "Server-side mail filtering rules (requires ManageSieve support)"
          },
          {
            key: "pgp_enabled",
            label: "PGP Encryption",
            desc: "Allow users to encrypt/sign messages with PGP keys"
          },
          {
            key: "require_admin_approval",
            label: "Require admin approval",
            desc: "New mail accounts must be approved by an admin before syncing"
          }
        ],
        e.index,
        (q, Xe) => {
          var rt = Ei(), nt = e.child(rt), ot = e.child(nt), Nt = e.child(ot, !0);
          e.reset(ot);
          var yt = e.sibling(ot, 2), wt = e.child(yt, !0);
          e.reset(yt), e.reset(nt);
          var Ke = e.sibling(nt, 2);
          e.remove_input_defaults(Ke), e.reset(rt), e.template_effect(() => {
            e.set_text(Nt, Xe.label), e.set_text(wt, Xe.desc);
          }), e.bind_checked(Ke, () => e.get(i)[Xe.key], (Mt) => e.get(i)[Xe.key] = Mt), e.append(q, rt);
        }
      ), e.reset(Te), e.reset(we);
      var Le = e.sibling(we, 2), Fe = e.child(Le), ie = e.child(Fe), Ve = e.child(ie);
      vs(Ve, { class: "w-4 h-4" }), e.next(), e.reset(ie);
      var T = e.sibling(ie, 2), We = e.child(T), Ge = e.sibling(e.child(We), 2);
      e.remove_textarea_child(Ge), e.reset(We);
      var st = e.sibling(We, 2), Be = e.sibling(e.child(st), 2);
      e.remove_textarea_child(Be), e.reset(st), e.reset(T), e.reset(Fe), e.reset(Le);
      var gt = e.sibling(Le, 2), mt = e.child(gt), bt = e.sibling(e.child(mt), 4), it = e.sibling(e.child(bt), 2), ht = e.sibling(e.child(it), 2);
      e.remove_input_defaults(ht), e.reset(it);
      var Oe = e.sibling(it, 2), ft = e.sibling(e.child(Oe), 2);
      e.remove_input_defaults(ft), e.reset(Oe);
      var lt = e.sibling(Oe, 4), Je = e.sibling(e.child(lt), 2);
      e.remove_input_defaults(Je), e.reset(lt);
      var Ze = e.sibling(lt, 2), xt = e.sibling(e.child(Ze), 2);
      e.remove_input_defaults(xt), e.reset(Ze), e.reset(bt), e.reset(mt), e.reset(gt), e.bind_checked(Ae, () => e.get(i).enabled, (q) => e.get(i).enabled = q), e.bind_value(He, () => e.get(i).max_accounts_per_user, (q) => e.get(i).max_accounts_per_user = q), e.bind_value(R, () => e.get(i).max_attachment_size_mb, (q) => e.get(i).max_attachment_size_mb = q), e.bind_value(Re, () => e.get(i).max_messages_sync, (q) => e.get(i).max_messages_sync = q), e.bind_value(qe, () => e.get(i).sync_interval_minutes, (q) => e.get(i).sync_interval_minutes = q), e.bind_value(ye, () => e.get(i).trash_auto_delete_days, (q) => e.get(i).trash_auto_delete_days = q), e.bind_value(Ge, () => e.get(g), (q) => e.set(g, q)), e.bind_value(Be, () => e.get(V), (q) => e.set(V, q)), e.bind_value(ht, () => e.get(i).oauth2_gmail_client_id, (q) => e.get(i).oauth2_gmail_client_id = q), e.bind_value(ft, () => e.get(i).oauth2_gmail_client_secret, (q) => e.get(i).oauth2_gmail_client_secret = q), e.bind_value(Je, () => e.get(i).oauth2_outlook_client_id, (q) => e.get(i).oauth2_outlook_client_id = q), e.bind_value(xt, () => e.get(i).oauth2_outlook_client_secret, (q) => e.get(i).oauth2_outlook_client_secret = q), e.append(F, te);
    };
    e.if(he, (F) => {
      e.get(o) ? F(fe) : F(tt, -1);
    });
  }
  e.reset(oe), e.append(c, oe), e.pop();
}
e.delegate(["click"]);
function zi() {
  const c = window.__zveltio;
  c && c.registerRoute({
    path: "mail",
    component: $i,
    label: "Mail",
    icon: "Mail",
    category: "communications",
    children: [
      {
        path: "mail/settings",
        component: Fi,
        label: "Mail Settings",
        icon: "Settings",
        category: "communications"
      }
    ]
  });
}
zi();
export {
  zi as default
};
