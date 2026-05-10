import "svelte/internal/disclose-version";
import * as e from "svelte/internal/client";
import { onMount as _e, onDestroy as Pe } from "svelte";
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
const Ce = {
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
function le(w, t) {
  e.push(t, !0);
  const v = e.prop(t, "color", 3, "currentColor"), a = e.prop(t, "size", 3, 24), i = e.prop(t, "strokeWidth", 3, 2), f = e.prop(t, "absoluteStrokeWidth", 3, !1), s = e.prop(t, "iconNode", 19, () => []), r = e.rest_props(t, [
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
  var S = Ne();
  e.attribute_effect(
    S,
    (ee) => ({
      ...Ce,
      ...r,
      width: a(),
      height: a(),
      stroke: v(),
      "stroke-width": ee,
      class: [
        "lucide-icon lucide",
        t.name && `lucide-${t.name}`,
        t.class
      ]
    }),
    [
      () => f() ? Number(i()) * 24 / Number(a()) : i()
    ]
  );
  var Z = e.child(S);
  e.each(Z, 17, s, e.index, (ee, Q) => {
    var q = e.derived(() => e.to_array(e.get(Q), 2));
    let ae = () => e.get(q)[0], te = () => e.get(q)[1];
    var M = e.comment(), E = e.first_child(M);
    e.element(E, ae, !0, (H, J) => {
      e.attribute_effect(H, () => ({ ...te() }));
    }), e.append(ee, M);
  });
  var K = e.sibling(Z);
  e.snippet(K, () => t.children ?? e.noop), e.reset(S), e.append(w, S), e.pop();
}
function je(w, t) {
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
  let v = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const a = [
    ["path", { d: "m12 19-7-7 7-7" }],
    ["path", { d: "M19 12H5" }]
  ];
  le(w, e.spread_props({ name: "arrow-left" }, () => v, {
    get iconNode() {
      return a;
    },
    children: (i, f) => {
      var s = e.comment(), r = e.first_child(s);
      e.snippet(r, () => t.children ?? e.noop), e.append(i, s);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function Me(w, t) {
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
  let v = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const a = [["path", { d: "M20 6 9 17l-5-5" }]];
  le(w, e.spread_props({ name: "check" }, () => v, {
    get iconNode() {
      return a;
    },
    children: (i, f) => {
      var s = e.comment(), r = e.first_child(s);
      e.snippet(r, () => t.children ?? e.noop), e.append(i, s);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function ze(w, t) {
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
  let v = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const a = [["path", { d: "m6 9 6 6 6-6" }]];
  le(w, e.spread_props({ name: "chevron-down" }, () => v, {
    get iconNode() {
      return a;
    },
    children: (i, f) => {
      var s = e.comment(), r = e.first_child(s);
      e.snippet(r, () => t.children ?? e.noop), e.append(i, s);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function Le(w, t) {
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
  let v = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const a = [["path", { d: "m18 15-6-6-6 6" }]];
  le(w, e.spread_props({ name: "chevron-up" }, () => v, {
    get iconNode() {
      return a;
    },
    children: (i, f) => {
      var s = e.comment(), r = e.first_child(s);
      e.snippet(r, () => t.children ?? e.noop), e.append(i, s);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function Se(w, t) {
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
  let v = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const a = [
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
  le(w, e.spread_props({ name: "file-text" }, () => v, {
    get iconNode() {
      return a;
    },
    children: (i, f) => {
      var s = e.comment(), r = e.first_child(s);
      e.snippet(r, () => t.children ?? e.noop), e.append(i, s);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function he(w, t) {
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
  let v = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const a = [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    [
      "path",
      { d: "M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" }
    ],
    ["path", { d: "M2 12h20" }]
  ];
  le(w, e.spread_props({ name: "globe" }, () => v, {
    get iconNode() {
      return a;
    },
    children: (i, f) => {
      var s = e.comment(), r = e.first_child(s);
      e.snippet(r, () => t.children ?? e.noop), e.append(i, s);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function De(w, t) {
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
  let v = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const a = [
    ["circle", { cx: "9", cy: "12", r: "1" }],
    ["circle", { cx: "9", cy: "5", r: "1" }],
    ["circle", { cx: "9", cy: "19", r: "1" }],
    ["circle", { cx: "15", cy: "12", r: "1" }],
    ["circle", { cx: "15", cy: "5", r: "1" }],
    ["circle", { cx: "15", cy: "19", r: "1" }]
  ];
  le(w, e.spread_props({ name: "grip-vertical" }, () => v, {
    get iconNode() {
      return a;
    },
    children: (i, f) => {
      var s = e.comment(), r = e.first_child(s);
      e.snippet(r, () => t.children ?? e.noop), e.append(i, s);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function be(w, t) {
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
  let v = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const a = [["path", { d: "M21 12a9 9 0 1 1-6.219-8.56" }]];
  le(w, e.spread_props({ name: "loader-circle" }, () => v, {
    get iconNode() {
      return a;
    },
    children: (i, f) => {
      var s = e.comment(), r = e.first_child(s);
      e.snippet(r, () => t.children ?? e.noop), e.append(i, s);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function Re(w, t) {
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
  let v = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const a = [
    [
      "rect",
      { width: "20", height: "14", x: "2", y: "3", rx: "2" }
    ],
    ["line", { x1: "8", x2: "16", y1: "21", y2: "21" }],
    ["line", { x1: "12", x2: "12", y1: "17", y2: "21" }]
  ];
  le(w, e.spread_props({ name: "monitor" }, () => v, {
    get iconNode() {
      return a;
    },
    children: (i, f) => {
      var s = e.comment(), r = e.first_child(s);
      e.snippet(r, () => t.children ?? e.noop), e.append(i, s);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function Ee(w, t) {
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
  let v = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const a = [["path", { d: "M5 12h14" }], ["path", { d: "M12 5v14" }]];
  le(w, e.spread_props({ name: "plus" }, () => v, {
    get iconNode() {
      return a;
    },
    children: (i, f) => {
      var s = e.comment(), r = e.first_child(s);
      e.snippet(r, () => t.children ?? e.noop), e.append(i, s);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function Be(w, t) {
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
  let v = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const a = [
    [
      "path",
      { d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" }
    ],
    ["path", { d: "M3 3v5h5" }]
  ];
  le(w, e.spread_props({ name: "rotate-ccw" }, () => v, {
    get iconNode() {
      return a;
    },
    children: (i, f) => {
      var s = e.comment(), r = e.first_child(s);
      e.snippet(r, () => t.children ?? e.noop), e.append(i, s);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function Ie(w, t) {
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
  let v = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const a = [
    [
      "path",
      { d: "M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" }
    ],
    ["path", { d: "M21 3v5h-5" }]
  ];
  le(w, e.spread_props({ name: "rotate-cw" }, () => v, {
    get iconNode() {
      return a;
    },
    children: (i, f) => {
      var s = e.comment(), r = e.first_child(s);
      e.snippet(r, () => t.children ?? e.noop), e.append(i, s);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function Ue(w, t) {
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
  let v = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const a = [
    [
      "path",
      {
        d: "M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"
      }
    ],
    ["path", { d: "M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7" }],
    ["path", { d: "M7 3v4a1 1 0 0 0 1 1h7" }]
  ];
  le(w, e.spread_props({ name: "save" }, () => v, {
    get iconNode() {
      return a;
    },
    children: (i, f) => {
      var s = e.comment(), r = e.first_child(s);
      e.snippet(r, () => t.children ?? e.noop), e.append(i, s);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function Ae(w, t) {
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
  let v = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const a = [
    [
      "rect",
      {
        width: "14",
        height: "20",
        x: "5",
        y: "2",
        rx: "2",
        ry: "2"
      }
    ],
    ["path", { d: "M12 18h.01" }]
  ];
  le(w, e.spread_props({ name: "smartphone" }, () => v, {
    get iconNode() {
      return a;
    },
    children: (i, f) => {
      var s = e.comment(), r = e.first_child(s);
      e.snippet(r, () => t.children ?? e.noop), e.append(i, s);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function He(w, t) {
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
  let v = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const a = [
    [
      "path",
      {
        d: "M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
      }
    ],
    [
      "path",
      {
        d: "M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"
      }
    ]
  ];
  le(w, e.spread_props({ name: "square-pen" }, () => v, {
    get iconNode() {
      return a;
    },
    children: (i, f) => {
      var s = e.comment(), r = e.first_child(s);
      e.snippet(r, () => t.children ?? e.noop), e.append(i, s);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function $e(w, t) {
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
  let v = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const a = [
    [
      "rect",
      {
        width: "16",
        height: "20",
        x: "4",
        y: "2",
        rx: "2",
        ry: "2"
      }
    ],
    [
      "line",
      { x1: "12", x2: "12.01", y1: "18", y2: "18" }
    ]
  ];
  le(w, e.spread_props({ name: "tablet" }, () => v, {
    get iconNode() {
      return a;
    },
    children: (i, f) => {
      var s = e.comment(), r = e.first_child(s);
      e.snippet(r, () => t.children ?? e.noop), e.append(i, s);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function Ve(w, t) {
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
  let v = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const a = [
    ["path", { d: "M3 6h18" }],
    ["path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" }],
    ["path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" }],
    ["line", { x1: "10", x2: "10", y1: "11", y2: "17" }],
    ["line", { x1: "14", x2: "14", y1: "11", y2: "17" }]
  ];
  le(w, e.spread_props({ name: "trash-2" }, () => v, {
    get iconNode() {
      return a;
    },
    children: (i, f) => {
      var s = e.comment(), r = e.first_child(s);
      e.snippet(r, () => t.children ?? e.noop), e.append(i, s);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function Fe(w, t) {
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
  let v = e.rest_props(t, ["$$slots", "$$events", "$$legacy"]);
  const a = [
    ["path", { d: "M18 6 6 18" }],
    ["path", { d: "m6 6 12 12" }]
  ];
  le(w, e.spread_props({ name: "x" }, () => v, {
    get iconNode() {
      return a;
    },
    children: (i, f) => {
      var s = e.comment(), r = e.first_child(s);
      e.snippet(r, () => t.children ?? e.noop), e.append(i, s);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
var Oe = e.from_html("<button> </button>"), We = e.from_html('<div class="flex justify-center py-12"><span class="loading loading-spinner loading-lg"></span></div>'), Ze = e.from_html('<div class="card bg-base-200 text-center py-12"><!> <p class="text-base-content/60">No pages yet</p> <button class="btn btn-primary btn-sm mt-4">Create First Page</button></div>'), Ge = e.from_html('<p class="text-sm text-base-content/40 mt-0.5"> </p>'), Ke = e.from_html('<a target="_blank" class="btn btn-ghost btn-xs gap-1"><!></a>'), qe = e.from_html('<div class="card bg-base-200"><div class="card-body p-4"><div class="flex items-center justify-between"><div><div class="flex items-center gap-2"><h3 class="font-semibold"> </h3> <span> </span></div> <p class="text-sm font-mono text-base-content/50"> </p> <!></div> <div class="flex gap-1"><!> <a class="btn btn-ghost btn-xs gap-1"><!> Edit</a> <button class="btn btn-ghost btn-xs text-error"><!></button></div></div></div></div>'), Ye = e.from_html('<div class="space-y-2"></div>'), Je = e.from_html('<span class="loading loading-spinner loading-sm"></span>'), Xe = e.from_html('<dialog class="modal modal-open"><div class="modal-box"><h3 class="font-bold text-lg mb-4">New Page</h3> <div class="space-y-3"><div class="form-control"><label class="label" for="page-title"><span class="label-text">Title</span></label> <input type="text" id="page-title" placeholder="About Us" class="input"/></div> <div class="form-control"><label class="label" for="page-slug"><span class="label-text">Slug</span></label> <div class="input flex items-center gap-1 pr-0"><span class="text-base-content/40 text-sm">/</span> <input id="page-slug" type="text" placeholder="about-us" class="flex-1 bg-transparent outline-none text-sm"/></div></div> <div class="form-control"><label class="label" for="page-description"><span class="label-text">Description (optional)</span></label> <input id="page-description" type="text" class="input input-sm"/></div></div> <div class="modal-action"><button class="btn btn-ghost">Cancel</button> <button class="btn btn-primary"><!> Create & Edit</button></div></div> <button class="modal-backdrop"></button></dialog>'), Qe = e.from_html('<div class="space-y-6"><div class="flex items-center justify-between"><div><h1 class="text-2xl font-bold">Pages</h1> <p class="text-base-content/60 text-sm mt-1">Manage public pages with the visual builder</p></div> <button class="btn btn-primary btn-sm gap-2"><!> New Page</button></div> <div class="tabs tabs-boxed w-fit"></div> <!></div> <!>', 1);
function et(w, t) {
  e.push(t, !0);
  const v = window.__ZVELTIO_ENGINE_URL__ || "";
  let a = e.state(e.proxy([])), i = e.state(!0), f = e.state("all"), s = e.state(!1), r = e.state(!1), S = e.state(e.proxy({ title: "", slug: "", description: "", template: "default" }));
  _e(async () => {
    await Z();
  });
  async function Z() {
    e.set(i, !0);
    try {
      const g = e.get(f) !== "all" ? `?status=${e.get(f)}` : "", o = await (await fetch(`${v}/api/pages${g}`, { credentials: "include" })).json();
      e.set(a, o.pages || [], !0);
    } finally {
      e.set(i, !1);
    }
  }
  e.user_effect(() => {
    e.get(f) && Z();
  });
  function K(g) {
    return g.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }
  function ee() {
    e.get(S).slug || (e.get(S).slug = K(e.get(S).title));
  }
  async function Q() {
    if (!(!e.get(S).title || !e.get(S).slug)) {
      e.set(r, !0);
      try {
        const g = await fetch(`${v}/api/pages`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(e.get(S))
        });
        if (!g.ok) throw new Error("Failed");
        const m = await g.json();
        e.set(s, !1), e.set(S, { title: "", slug: "", description: "", template: "default" }, !0), window.location.hash = `#/pages/${m.page.id}/edit`, await Z();
      } finally {
        e.set(r, !1);
      }
    }
  }
  async function q(g, m) {
    confirm(`Delete "${m}"?`) && (await fetch(`${v}/api/pages/${g}`, { method: "DELETE", credentials: "include" }), await Z());
  }
  function ae(g) {
    return g === "published" ? "badge-success" : g === "archived" ? "badge-ghost" : "badge-warning";
  }
  var te = Qe(), M = e.first_child(te), E = e.child(M), H = e.sibling(e.child(E), 2), J = e.child(H);
  Ee(J, { size: 16 }), e.next(), e.reset(H), e.reset(E);
  var l = e.sibling(E, 2);
  e.each(l, 20, () => ["all", "draft", "published", "archived"], e.index, (g, m) => {
    var o = Oe(), b = e.child(o, !0);
    e.reset(o), e.template_effect(
      (h) => {
        e.set_class(o, 1, `tab ${e.get(f) === m ? "tab-active" : ""}`), e.set_text(b, h);
      },
      [() => m.charAt(0).toUpperCase() + m.slice(1)]
    ), e.delegated("click", o, () => e.set(f, m, !0)), e.append(g, o);
  }), e.reset(l);
  var n = e.sibling(l, 2);
  {
    var u = (g) => {
      var m = We();
      e.append(g, m);
    }, L = (g) => {
      var m = Ze(), o = e.child(m);
      Se(o, { size: 48, class: "mx-auto text-base-content/20 mb-3" });
      var b = e.sibling(o, 4);
      e.reset(m), e.delegated("click", b, () => e.set(s, !0)), e.append(g, m);
    }, A = (g) => {
      var m = Ye();
      e.each(m, 21, () => e.get(a), e.index, (o, b) => {
        var h = qe(), V = e.child(h), Y = e.child(V), W = e.child(Y), T = e.child(W), C = e.child(T), c = e.child(C, !0);
        e.reset(C);
        var p = e.sibling(C, 2), _ = e.child(p, !0);
        e.reset(p), e.reset(T);
        var z = e.sibling(T, 2), $ = e.child(z);
        e.reset(z);
        var N = e.sibling(z, 2);
        {
          var D = (k) => {
            var y = Ge(), X = e.child(y, !0);
            e.reset(y), e.template_effect(() => e.set_text(X, e.get(b).description)), e.append(k, y);
          };
          e.if(N, (k) => {
            e.get(b).description && k(D);
          });
        }
        e.reset(W);
        var d = e.sibling(W, 2), x = e.child(d);
        {
          var j = (k) => {
            var y = Ke(), X = e.child(y);
            he(X, { size: 12 }), e.reset(y), e.template_effect(() => e.set_attribute(y, "href", `/${e.get(b).slug ?? ""}`)), e.append(k, y);
          };
          e.if(x, (k) => {
            e.get(b).status === "published" && k(j);
          });
        }
        var I = e.sibling(x, 2), R = e.child(I);
        He(R, { size: 12 }), e.next(), e.reset(I);
        var B = e.sibling(I, 2), U = e.child(B);
        Ve(U, { size: 12 }), e.reset(B), e.reset(d), e.reset(Y), e.reset(V), e.reset(h), e.template_effect(
          (k) => {
            e.set_text(c, e.get(b).title), e.set_class(p, 1, `badge badge-sm ${k ?? ""}`), e.set_text(_, e.get(b).status), e.set_text($, `/${e.get(b).slug ?? ""}`), e.set_attribute(I, "href", `#/pages/${e.get(b).id ?? ""}/edit`);
          },
          [() => ae(e.get(b).status)]
        ), e.delegated("click", B, () => q(e.get(b).id, e.get(b).title)), e.append(o, h);
      }), e.reset(m), e.append(g, m);
    };
    e.if(n, (g) => {
      e.get(i) ? g(u) : e.get(a).length === 0 ? g(L, 1) : g(A, -1);
    });
  }
  e.reset(M);
  var P = e.sibling(M, 2);
  {
    var O = (g) => {
      var m = Xe(), o = e.child(m), b = e.sibling(e.child(o), 2), h = e.child(b), V = e.sibling(e.child(h), 2);
      e.remove_input_defaults(V), e.reset(h);
      var Y = e.sibling(h, 2), W = e.sibling(e.child(Y), 2), T = e.sibling(e.child(W), 2);
      e.remove_input_defaults(T), e.reset(W), e.reset(Y);
      var C = e.sibling(Y, 2), c = e.sibling(e.child(C), 2);
      e.remove_input_defaults(c), e.reset(C), e.reset(b);
      var p = e.sibling(b, 2), _ = e.child(p), z = e.sibling(_, 2), $ = e.child(z);
      {
        var N = (d) => {
          var x = Je();
          e.append(d, x);
        };
        e.if($, (d) => {
          e.get(r) && d(N);
        });
      }
      e.next(), e.reset(z), e.reset(p), e.reset(o);
      var D = e.sibling(o, 2);
      e.reset(m), e.template_effect(() => z.disabled = e.get(r) || !e.get(S).title || !e.get(S).slug), e.delegated("input", V, ee), e.bind_value(V, () => e.get(S).title, (d) => e.get(S).title = d), e.bind_value(T, () => e.get(S).slug, (d) => e.get(S).slug = d), e.bind_value(c, () => e.get(S).description, (d) => e.get(S).description = d), e.delegated("click", _, () => e.set(s, !1)), e.delegated("click", z, Q), e.delegated("click", D, () => e.set(s, !1)), e.append(g, m);
    };
    e.if(P, (g) => {
      e.get(s) && g(O);
    });
  }
  e.delegated("click", H, () => e.set(s, !0)), e.append(w, te), e.pop();
}
e.delegate(["click", "input"]);
const xe = [
  // Layout
  {
    type: "columns",
    label: "Columns",
    description: "2–4 column grid",
    category: "layout",
    emoji: "⣿",
    defaultProps: { count: 2, items: ["<p>Column 1</p>", "<p>Column 2</p>"] }
  },
  {
    type: "spacer",
    label: "Spacer",
    description: "Vertical whitespace",
    category: "layout",
    emoji: "↕",
    defaultProps: { height: 48 }
  },
  {
    type: "divider",
    label: "Divider",
    description: "Horizontal separator",
    category: "layout",
    emoji: "─",
    defaultProps: { color: "#e5e7eb", thickness: 1, line_style: "solid" }
  },
  // Content
  {
    type: "hero",
    label: "Hero",
    description: "Full-width hero section",
    category: "content",
    emoji: "🖼",
    defaultProps: { title: "Welcome", subtitle: "A short description goes here", bg_color: "#1e293b", text_color: "#ffffff", cta_text: "Get Started", cta_url: "/", image_url: "", overlay_opacity: 40 }
  },
  {
    type: "richtext",
    label: "Rich Text",
    description: "Formatted text content",
    category: "content",
    emoji: "✏️",
    defaultProps: { content: "<p>Start writing your content here…</p>" }
  },
  {
    type: "cta",
    label: "Call to Action",
    description: "CTA banner section",
    category: "content",
    emoji: "📢",
    defaultProps: { heading: "Ready to get started?", text: "", button_text: "Contact Us", button_url: "/", variant: "primary" }
  },
  {
    type: "stats",
    label: "Stats",
    description: "Key metrics display",
    category: "content",
    emoji: "📊",
    defaultProps: { items: [{ value: "100+", label: "Users" }, { value: "50+", label: "Projects" }, { value: "99%", label: "Satisfaction" }, { value: "24/7", label: "Support" }], columns: 4 }
  },
  // Media
  {
    type: "image",
    label: "Image",
    description: "Single image with caption",
    category: "media",
    emoji: "🖼",
    defaultProps: { url: "", alt: "", caption: "", link: "" }
  },
  {
    type: "video",
    label: "Video",
    description: "YouTube / Vimeo embed",
    category: "media",
    emoji: "▶️",
    defaultProps: { url: "", caption: "" }
  },
  {
    type: "gallery",
    label: "Gallery",
    description: "Image grid",
    category: "media",
    emoji: "⊞",
    defaultProps: { images: [], columns: 3 }
  },
  {
    type: "embed",
    label: "Embed",
    description: "Raw HTML / iframe",
    category: "media",
    emoji: "</>",
    defaultProps: { html: "" }
  },
  // Zveltio
  {
    type: "data_table",
    label: "Data Table",
    description: "Live collection data",
    category: "zveltio",
    emoji: "⊟",
    defaultProps: { collection: "", fields: [], limit: 10, title: "" }
  }
];
var tt = e.from_html('<button class="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-base-200 text-left cursor-grab active:cursor-grabbing transition-colors" draggable="true"><span class="text-sm w-5 text-center shrink-0 leading-none"> </span> <div class="min-w-0"><p class="text-xs font-medium leading-tight"> </p> <p class="text-[10px] text-base-content/40 leading-tight truncate"> </p></div></button>'), at = e.from_html('<div class="px-2 pt-3 pb-1"><p class="text-[9px] font-bold text-base-content/30 uppercase tracking-widest px-1 mb-1"> </p> <!></div>'), rt = e.from_html('<div class="w-52 shrink-0 bg-base-100 border-r border-base-300 overflow-y-auto flex flex-col"><div class="px-3 py-2.5 border-b border-base-300"><span class="text-[10px] font-bold text-base-content/40 uppercase tracking-widest">Blocks</span></div> <!></div>');
function it(w, t) {
  e.push(t, !0);
  const v = [
    { key: "layout", label: "Layout" },
    { key: "content", label: "Content" },
    { key: "media", label: "Media" },
    { key: "zveltio", label: "Zveltio" }
  ];
  function a(r) {
    return {
      id: crypto.randomUUID(),
      type: r.type,
      props: { ...r.defaultProps },
      style: {}
    };
  }
  function i(r, S) {
    r.dataTransfer.setData("text/block-type", S.type), r.dataTransfer.effectAllowed = "copy";
  }
  var f = rt(), s = e.sibling(e.child(f), 2);
  e.each(s, 17, () => v, e.index, (r, S) => {
    const Z = e.derived(() => xe.filter((ae) => ae.category === e.get(S).key));
    var K = at(), ee = e.child(K), Q = e.child(ee, !0);
    e.reset(ee);
    var q = e.sibling(ee, 2);
    e.each(q, 17, () => e.get(Z), e.index, (ae, te) => {
      var M = tt(), E = e.child(M), H = e.child(E, !0);
      e.reset(E);
      var J = e.sibling(E, 2), l = e.child(J), n = e.child(l, !0);
      e.reset(l);
      var u = e.sibling(l, 2), L = e.child(u, !0);
      e.reset(u), e.reset(J), e.reset(M), e.template_effect(() => {
        e.set_attribute(M, "title", e.get(te).description), e.set_text(H, e.get(te).emoji), e.set_text(n, e.get(te).label), e.set_text(L, e.get(te).description);
      }), e.event("dragstart", M, (A) => i(A, e.get(te))), e.delegated("click", M, () => t.onAdd(a(e.get(te)))), e.append(ae, M);
    }), e.reset(K), e.template_effect(() => e.set_text(Q, e.get(S).label)), e.append(r, K);
  }), e.reset(f), e.append(w, f), e.pop();
}
e.delegate(["click"]);
var lt = e.from_html('<img alt="" class="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"/> <div class="absolute inset-0"></div>', 1), nt = e.from_html('<p class="text-base opacity-80"> </p>'), st = e.from_html('<span class="inline-block mt-3 px-5 py-2 rounded-lg text-sm font-semibold bg-white/20 border border-white/30"> </span>'), ot = e.from_html('<div class="relative flex flex-col items-center justify-center px-8 py-16 text-center min-h-[180px]"><!> <div class="relative z-10 space-y-2"><h1 class="text-3xl font-bold leading-tight"> </h1> <!> <!></div></div>'), dt = e.from_html('<div class="prose prose-sm max-w-none px-4 py-3"></div>'), ct = e.from_html('<p class="text-sm opacity-80 mt-0.5"> </p>'), pt = e.from_html("<span> </span>"), vt = e.from_html('<div><div><p class="font-bold text-lg leading-tight"> </p> <!></div> <!></div>'), ut = e.from_html('<div class="text-center"><p class="text-3xl font-extrabold text-primary leading-none"> </p> <p class="text-xs text-base-content/60 mt-1"> </p></div>'), gt = e.from_html('<div class="grid gap-4 py-6 px-4"></div>'), _t = e.from_html('<div class="min-h-[60px] bg-base-200 rounded-lg p-3 text-sm prose prose-sm max-w-none"></div>'), ft = e.from_html('<div class="grid gap-3 p-3"></div>'), mt = e.from_html('<div class="w-full flex items-center justify-center"><span class="text-[10px] text-base-content/20 font-mono"> </span></div>'), bt = e.from_html('<div class="px-4 py-3"><hr/></div>'), ht = e.from_html('<img class="w-full object-cover rounded"/>'), xt = e.from_html('<div class="flex items-center justify-center bg-base-200 rounded h-32 text-base-content/30 text-sm gap-2"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg> Image</div>'), yt = e.from_html('<figcaption class="text-center text-xs text-base-content/50 mt-1"> </figcaption>'), wt = e.from_html('<figure class="w-full"><!> <!></figure>'), kt = e.from_html('<iframe class="w-full h-full rounded" allowfullscreen=""></iframe>'), Tt = e.from_html('<div class="flex flex-col items-center gap-2 text-base-content/30"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8" fill="currentColor"></polygon></svg> <span class="text-xs">Video</span></div>'), Pt = e.from_html('<div class="w-full aspect-video bg-base-300 rounded flex items-center justify-center"><!></div>'), Ct = e.from_html('<img class="w-full aspect-square object-cover rounded"/>'), Nt = e.from_html('<div class="aspect-square bg-base-200 rounded flex items-center justify-center text-base-content/20 text-xs"></div>'), jt = e.from_html('<div class="grid gap-1.5 p-1"></div>'), Mt = e.from_html('<div class="p-3"></div>'), zt = e.from_html('<div class="flex items-center justify-center h-16 bg-base-200 rounded text-base-content/30 text-xs gap-1.5 font-mono"><span>&lt;/&gt;</span> HTML / Embed</div>'), Lt = e.from_html('<p class="text-sm font-semibold"> </p>'), St = e.from_html('<span class="text-[10px] badge badge-ghost font-mono"> </span>'), Dt = e.from_html('<th class="font-mono text-[10px]"> </th>'), Rt = e.from_html('<th class="text-base-content/30 text-[10px] italic">Configure fields in properties →</th>'), Et = e.from_html("<td><div></div></td>"), Bt = e.from_html('<td><div class="h-2.5 rounded bg-base-200 w-24"></div></td>'), It = e.from_html("<tr><!></tr>"), Ut = e.from_html('<p class="text-[10px] text-base-content/30 mt-1"> </p>'), At = e.from_html('<div class="p-3"><div class="flex items-center justify-between mb-2"><!> <!></div> <div class="overflow-hidden rounded border border-base-300"><table class="table table-xs w-full"><thead><tr class="bg-base-200"><!></tr></thead><tbody></tbody></table></div> <!></div>'), Ht = e.from_html('<div class="flex items-center justify-center h-12 bg-base-200 rounded text-base-content/30 text-xs font-mono"> </div>'), $t = e.from_html('<div class="w-full overflow-hidden"><!></div>');
function Vt(w, t) {
  e.push(t, !0);
  function v(l = {}) {
    const n = [];
    return l.paddingTop != null && n.push(`padding-top:${l.paddingTop}px`), l.paddingBottom != null && n.push(`padding-bottom:${l.paddingBottom}px`), l.paddingLeft != null && n.push(`padding-left:${l.paddingLeft}px`), l.paddingRight != null && n.push(`padding-right:${l.paddingRight}px`), l.marginTop != null && n.push(`margin-top:${l.marginTop}px`), l.marginBottom != null && n.push(`margin-bottom:${l.marginBottom}px`), l.backgroundColor && n.push(`background-color:${l.backgroundColor}`), l.textColor && n.push(`color:${l.textColor}`), l.borderRadius != null && n.push(`border-radius:${l.borderRadius}px`), l.textAlign && n.push(`text-align:${l.textAlign}`), n.join(";");
  }
  const a = e.derived(() => t.block.props), i = e.derived(() => v(t.block.style));
  var f = $t(), s = e.child(f);
  {
    var r = (l) => {
      var n = ot(), u = e.child(n);
      {
        var L = (h) => {
          var V = lt(), Y = e.first_child(V), W = e.sibling(Y, 2);
          e.template_effect(() => {
            e.set_attribute(Y, "src", e.get(a).image_url), e.set_style(W, `background:rgba(0,0,0,${(e.get(a).overlay_opacity ?? 40) / 100})`);
          }), e.append(h, V);
        };
        e.if(u, (h) => {
          e.get(a).image_url && h(L);
        });
      }
      var A = e.sibling(u, 2), P = e.child(A), O = e.child(P, !0);
      e.reset(P);
      var g = e.sibling(P, 2);
      {
        var m = (h) => {
          var V = nt(), Y = e.child(V, !0);
          e.reset(V), e.template_effect(() => e.set_text(Y, e.get(a).subtitle)), e.append(h, V);
        };
        e.if(g, (h) => {
          e.get(a).subtitle && h(m);
        });
      }
      var o = e.sibling(g, 2);
      {
        var b = (h) => {
          var V = st(), Y = e.child(V, !0);
          e.reset(V), e.template_effect(() => e.set_text(Y, e.get(a).cta_text)), e.append(h, V);
        };
        e.if(o, (h) => {
          e.get(a).cta_text && h(b);
        });
      }
      e.reset(A), e.reset(n), e.template_effect(() => {
        e.set_style(n, `background-color:${e.get(a).bg_color ?? "#1e293b" ?? ""}; color:${e.get(a).text_color ?? "#fff" ?? ""}`), e.set_text(O, e.get(a).title ?? "Hero Title");
      }), e.append(l, n);
    }, S = (l) => {
      var n = dt();
      e.html(n, () => e.get(a).content ?? "<p>Rich text…</p>", !0), e.reset(n), e.append(l, n);
    }, Z = (l) => {
      const n = e.derived(() => e.get(a).variant ?? "primary");
      var u = vt(), L = e.child(u), A = e.child(L), P = e.child(A, !0);
      e.reset(A);
      var O = e.sibling(A, 2);
      {
        var g = (b) => {
          var h = ct(), V = e.child(h, !0);
          e.reset(h), e.template_effect(() => e.set_text(V, e.get(a).text)), e.append(b, h);
        };
        e.if(O, (b) => {
          e.get(a).text && b(g);
        });
      }
      e.reset(L);
      var m = e.sibling(L, 2);
      {
        var o = (b) => {
          var h = pt(), V = e.child(h, !0);
          e.reset(h), e.template_effect(() => {
            e.set_class(h, 1, `btn btn-sm shrink-0 ${e.get(n) === "primary" ? "btn-neutral" : "btn-primary"}`), e.set_text(V, e.get(a).button_text);
          }), e.append(b, h);
        };
        e.if(m, (b) => {
          e.get(a).button_text && b(o);
        });
      }
      e.reset(u), e.template_effect(() => {
        e.set_class(u, 1, `flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-8 rounded-xl
      ${e.get(n) === "primary" ? "bg-primary text-primary-content" : e.get(n) === "dark" ? "bg-neutral text-neutral-content" : "bg-base-200"}`), e.set_text(P, e.get(a).heading ?? "Ready to get started?");
      }), e.append(l, u);
    }, K = (l) => {
      const n = e.derived(() => e.get(a).columns ?? 4);
      var u = gt();
      e.each(u, 21, () => e.get(a).items ?? [], e.index, (L, A) => {
        var P = ut(), O = e.child(P), g = e.child(O, !0);
        e.reset(O);
        var m = e.sibling(O, 2), o = e.child(m, !0);
        e.reset(m), e.reset(P), e.template_effect(() => {
          e.set_text(g, e.get(A).value), e.set_text(o, e.get(A).label);
        }), e.append(L, P);
      }), e.reset(u), e.template_effect(() => e.set_style(u, `grid-template-columns:repeat(${e.get(n) ?? ""},1fr)`)), e.append(l, u);
    }, ee = (l) => {
      const n = e.derived(() => e.get(a).count ?? 2);
      var u = ft();
      e.each(u, 21, () => e.get(a).items ?? [], e.index, (L, A) => {
        var P = _t();
        e.html(P, () => e.get(A), !0), e.reset(P), e.append(L, P);
      }), e.reset(u), e.template_effect(() => e.set_style(u, `grid-template-columns:repeat(${e.get(n) ?? ""},1fr)`)), e.append(l, u);
    }, Q = (l) => {
      var n = mt(), u = e.child(n), L = e.child(u);
      e.reset(u), e.reset(n), e.template_effect(() => {
        e.set_style(n, `height:${e.get(a).height ?? 48 ?? ""}px`), e.set_text(L, `${e.get(a).height ?? 48 ?? ""}px`);
      }), e.append(l, n);
    }, q = (l) => {
      var n = bt(), u = e.child(n);
      e.reset(n), e.template_effect(() => e.set_style(u, `border-color:${e.get(a).color ?? "#e5e7eb" ?? ""};border-top-width:${e.get(a).thickness ?? 1 ?? ""}px;border-style:${e.get(a).line_style ?? "solid" ?? ""}`)), e.append(l, n);
    }, ae = (l) => {
      var n = wt(), u = e.child(n);
      {
        var L = (g) => {
          var m = ht();
          e.template_effect(() => {
            e.set_attribute(m, "src", e.get(a).url), e.set_attribute(m, "alt", e.get(a).alt ?? "");
          }), e.append(g, m);
        }, A = (g) => {
          var m = xt();
          e.append(g, m);
        };
        e.if(u, (g) => {
          e.get(a).url ? g(L) : g(A, -1);
        });
      }
      var P = e.sibling(u, 2);
      {
        var O = (g) => {
          var m = yt(), o = e.child(m, !0);
          e.reset(m), e.template_effect(() => e.set_text(o, e.get(a).caption)), e.append(g, m);
        };
        e.if(P, (g) => {
          e.get(a).caption && g(O);
        });
      }
      e.reset(n), e.append(l, n);
    }, te = (l) => {
      var n = Pt(), u = e.child(n);
      {
        var L = (P) => {
          const O = e.derived(() => e.get(a).url.includes("youtu") ? e.get(a).url.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/") : e.get(a).url);
          var g = kt();
          e.template_effect(() => {
            e.set_attribute(g, "src", e.get(O)), e.set_attribute(g, "title", e.get(a).caption ?? "video");
          }), e.append(P, g);
        }, A = (P) => {
          var O = Tt();
          e.append(P, O);
        };
        e.if(u, (P) => {
          e.get(a).url ? P(L) : P(A, -1);
        });
      }
      e.reset(n), e.append(l, n);
    }, M = (l) => {
      const n = e.derived(() => e.get(a).columns ?? 3);
      var u = jt();
      e.each(
        u,
        21,
        () => e.get(a).images ?? [],
        e.index,
        (L, A) => {
          var P = Ct();
          e.template_effect(() => {
            e.set_attribute(P, "src", e.get(A).url ?? e.get(A)), e.set_attribute(P, "alt", e.get(A).alt ?? "");
          }), e.append(L, P);
        },
        (L) => {
          var A = e.comment(), P = e.first_child(A);
          e.each(P, 17, () => ({ length: e.get(n) }), e.index, (O, g, m) => {
            var o = Nt();
            o.textContent = m + 1, e.append(O, o);
          }), e.append(L, A);
        }
      ), e.reset(u), e.template_effect(() => e.set_style(u, `grid-template-columns:repeat(${e.get(n) ?? ""},1fr)`)), e.append(l, u);
    }, E = (l) => {
      var n = e.comment(), u = e.first_child(n);
      {
        var L = (P) => {
          var O = Mt();
          e.html(O, () => e.get(a).html, !0), e.reset(O), e.append(P, O);
        }, A = (P) => {
          var O = zt();
          e.append(P, O);
        };
        e.if(u, (P) => {
          e.get(a).html ? P(L) : P(A, -1);
        });
      }
      e.append(l, n);
    }, H = (l) => {
      var n = At(), u = e.child(n), L = e.child(u);
      {
        var A = (c) => {
          var p = Lt(), _ = e.child(p, !0);
          e.reset(p), e.template_effect(() => e.set_text(_, e.get(a).title)), e.append(c, p);
        };
        e.if(L, (c) => {
          e.get(a).title && c(A);
        });
      }
      var P = e.sibling(L, 2);
      {
        var O = (c) => {
          var p = St(), _ = e.child(p, !0);
          e.reset(p), e.template_effect(() => e.set_text(_, e.get(a).collection)), e.append(c, p);
        };
        e.if(P, (c) => {
          e.get(a).collection && c(O);
        });
      }
      e.reset(u);
      var g = e.sibling(u, 2), m = e.child(g), o = e.child(m), b = e.child(o), h = e.child(b);
      {
        var V = (c) => {
          var p = e.comment(), _ = e.first_child(p);
          e.each(_, 17, () => e.get(a).fields, e.index, (z, $) => {
            var N = Dt(), D = e.child(N, !0);
            e.reset(N), e.template_effect(() => e.set_text(D, e.get($))), e.append(z, N);
          }), e.append(c, p);
        }, Y = (c) => {
          var p = Rt();
          e.append(c, p);
        };
        e.if(h, (c) => {
          var p;
          ((p = e.get(a).fields) == null ? void 0 : p.length) > 0 ? c(V) : c(Y, -1);
        });
      }
      e.reset(b), e.reset(o);
      var W = e.sibling(o);
      e.each(W, 20, () => ({ length: 3 }), e.index, (c, p) => {
        var _ = It(), z = e.child(_);
        {
          var $ = (D) => {
            var d = e.comment(), x = e.first_child(d);
            e.each(x, 17, () => e.get(a).fields, e.index, (j, I, R, B) => {
              var U = Et(), k = e.child(U);
              e.set_class(k, 1, `h-2.5 rounded bg-base-200 w-${R % 2 === 0 ? 20 : 16}`), e.reset(U), e.append(j, U);
            }), e.append(D, d);
          }, N = (D) => {
            var d = Bt();
            e.append(D, d);
          };
          e.if(z, (D) => {
            var d;
            ((d = e.get(a).fields) == null ? void 0 : d.length) > 0 ? D($) : D(N, -1);
          });
        }
        e.reset(_), e.append(c, _);
      }), e.reset(W), e.reset(m), e.reset(g);
      var T = e.sibling(g, 2);
      {
        var C = (c) => {
          var p = Ut(), _ = e.child(p);
          e.reset(p), e.template_effect(() => e.set_text(_, `Showing up to ${e.get(a).limit ?? ""} records`)), e.append(c, p);
        };
        e.if(T, (c) => {
          e.get(a).limit && c(C);
        });
      }
      e.reset(n), e.append(l, n);
    }, J = (l) => {
      var n = Ht(), u = e.child(n, !0);
      e.reset(n), e.template_effect(() => e.set_text(u, t.block.type)), e.append(l, n);
    };
    e.if(s, (l) => {
      t.block.type === "hero" ? l(r) : t.block.type === "richtext" ? l(S, 1) : t.block.type === "cta" ? l(Z, 2) : t.block.type === "stats" ? l(K, 3) : t.block.type === "columns" ? l(ee, 4) : t.block.type === "spacer" ? l(Q, 5) : t.block.type === "divider" ? l(q, 6) : t.block.type === "image" ? l(ae, 7) : t.block.type === "video" ? l(te, 8) : t.block.type === "gallery" ? l(M, 9) : t.block.type === "embed" ? l(E, 10) : t.block.type === "data_table" ? l(H, 11) : l(J, -1);
    });
  }
  e.reset(f), e.template_effect(() => e.set_style(f, e.get(i))), e.append(w, f), e.pop();
}
var Ft = e.from_html(
  `<div role="region" aria-label="Drop zone"></div> <div role="button" tabindex="0"><div><span class="text-[9px] font-mono text-base-content/40 px-1 border-r border-base-300 mr-0.5"> </span> <button class="btn btn-ghost btn-xs p-0.5 h-5 min-h-0" title="Move up"><!></button> <button class="btn btn-ghost btn-xs p-0.5 h-5 min-h-0" title="Move down"><!></button> <button class="btn btn-ghost btn-xs p-0.5 h-5 min-h-0 text-error" title="Delete block"><!></button></div> <div class="absolute -left-6 top-1/2 -translate-y-1/2 z-10
            cursor-grab active:cursor-grabbing
            opacity-0 group-hover:opacity-40 hover:!opacity-80 transition-opacity
            text-base-content" draggable="true" role="button" tabindex="-1" aria-label="Drag to reorder"><!></div> <!></div>`,
  1
), Ot = e.from_html('<div role="region"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><rect x="3" y="3" width="18" height="18" rx="3"></rect><path d="M12 8v8M8 12h8"></path></svg> <p class="text-sm">Drag blocks from the left panel or click to add</p></div>'), Wt = e.from_html('<div class="flex-1 overflow-y-auto bg-base-200 py-8 px-8" role="region" aria-label="Page canvas"><div><!> <div role="region" aria-label="Drop zone"></div> <!></div></div>');
function Zt(w, t) {
  e.push(t, !0);
  let v = e.state(null);
  const a = e.derived(() => t.device === "mobile" ? "max-w-sm" : t.device === "tablet" ? "max-w-2xl" : "max-w-5xl");
  function i(M, E) {
    M.dataTransfer.setData("text/canvas-index", String(E)), M.dataTransfer.effectAllowed = "move", M.stopPropagation();
  }
  function f(M, E) {
    M.preventDefault(), M.stopPropagation(), e.set(v, E, !0);
  }
  function s(M, E) {
    M.preventDefault(), M.stopPropagation(), e.get(v), e.set(v, null);
    const H = M.dataTransfer.getData("text/block-type"), J = M.dataTransfer.getData("text/canvas-index");
    if (H) {
      const l = xe.find((L) => L.type === H);
      if (!l) return;
      const n = {
        id: crypto.randomUUID(),
        type: l.type,
        props: { ...l.defaultProps },
        style: {}
      }, u = [...t.blocks];
      u.splice(E, 0, n), t.onChange(u), t.onSelect(n.id);
    } else if (J !== "") {
      const l = Number(J);
      if (l === E || l + 1 === E) return;
      const n = [...t.blocks], [u] = n.splice(l, 1), L = l < E ? E - 1 : E;
      n.splice(L, 0, u), t.onChange(n);
    }
  }
  function r() {
    e.set(v, null);
  }
  function S(M, E) {
    const H = M + E;
    if (H < 0 || H >= t.blocks.length) return;
    const J = [...t.blocks];
    [J[M], J[H]] = [J[H], J[M]], t.onChange(J);
  }
  function Z(M) {
    t.onChange(t.blocks.filter((E, H) => H !== M));
  }
  var K = Wt(), ee = e.child(K), Q = e.child(ee);
  e.each(Q, 17, () => t.blocks, e.index, (M, E, H) => {
    var J = Ft(), l = e.first_child(J), n = e.sibling(l, 2), u = e.child(n), L = e.child(u), A = e.child(L, !0);
    e.reset(L);
    var P = e.sibling(L, 2);
    P.disabled = H === 0;
    var O = e.child(P);
    Le(O, { size: 11 }), e.reset(P);
    var g = e.sibling(P, 2), m = e.child(g);
    ze(m, { size: 11 }), e.reset(g);
    var o = e.sibling(g, 2), b = e.child(o);
    Fe(b, { size: 11 }), e.reset(o), e.reset(u);
    var h = e.sibling(u, 2), V = e.child(h);
    De(V, { size: 16 }), e.reset(h);
    var Y = e.sibling(h, 2);
    Vt(Y, {
      get block() {
        return e.get(E);
      }
    }), e.reset(n), e.template_effect(() => {
      e.set_class(l, 1, `rounded-full mx-2 transition-all duration-150
          ${e.get(v) === H ? "h-8 bg-primary/15 border-2 border-dashed border-primary my-2" : "h-1.5 my-1"}`), e.set_class(n, 1, `group relative rounded-xl transition-all duration-100 cursor-pointer
          ${t.selectedId === e.get(E).id ? "ring-2 ring-primary shadow-lg shadow-primary/10" : "hover:ring-2 hover:ring-base-300"}`), e.set_class(u, 1, `absolute -top-3.5 right-2 z-20 flex items-center gap-0.5
          bg-base-100 border border-base-300 rounded-lg px-1 py-0.5 shadow-sm
          opacity-0 group-hover:opacity-100 transition-opacity
          ${t.selectedId === e.get(E).id ? "!opacity-100" : ""}`), e.set_text(A, e.get(E).type), g.disabled = H === t.blocks.length - 1;
    }), e.event("dragover", l, (W) => f(W, H)), e.event("drop", l, (W) => s(W, H)), e.delegated("click", n, () => t.onSelect(e.get(E).id)), e.delegated("keydown", n, (W) => W.key === "Enter" && t.onSelect(e.get(E).id)), e.delegated("click", P, (W) => {
      W.stopPropagation(), S(H, -1);
    }), e.delegated("click", g, (W) => {
      W.stopPropagation(), S(H, 1);
    }), e.delegated("click", o, (W) => {
      W.stopPropagation(), Z(H);
    }), e.event("dragstart", h, (W) => i(W, H)), e.event("dragend", h, () => e.set(v, null)), e.append(M, J);
  });
  var q = e.sibling(Q, 2), ae = e.sibling(q, 2);
  {
    var te = (M) => {
      var E = Ot();
      e.template_effect(() => e.set_class(E, 1, `mt-2 border-2 border-dashed rounded-2xl py-24 flex flex-col items-center gap-3 transition-colors
          ${e.get(v) === 0 ? "border-primary bg-primary/5 text-primary" : "border-base-300 text-base-content/25"}`)), e.event("dragover", E, (H) => f(H, 0)), e.event("drop", E, (H) => s(H, 0)), e.append(M, E);
    };
    e.if(ae, (M) => {
      t.blocks.length === 0 && M(te);
    });
  }
  e.reset(ee), e.reset(K), e.template_effect(() => {
    e.set_class(ee, 1, `mx-auto transition-all duration-300 ${e.get(a) ?? ""}`), e.set_class(q, 1, `rounded-full mx-2 transition-all duration-150
        ${e.get(v) === t.blocks.length ? "h-8 bg-primary/15 border-2 border-dashed border-primary my-2" : "h-1.5 my-1"}`);
  }), e.event("dragleave", K, r), e.event("dragover", q, (M) => f(M, t.blocks.length)), e.event("drop", q, (M) => s(M, t.blocks.length)), e.append(w, K), e.pop();
}
e.delegate(["click", "keydown"]);
const F = (w, t = e.noop) => {
  var v = Gt(), a = e.child(v, !0);
  e.reset(v), e.template_effect(() => e.set_text(a, t())), e.append(w, v);
}, me = (w, t = e.noop, v = e.noop) => {
  var a = Kt(), i = e.child(a);
  e.remove_input_defaults(i);
  var f = e.sibling(i, 2);
  e.remove_input_defaults(f), e.reset(a), e.template_effect(() => {
    e.set_value(i, t() || "#000000"), e.set_value(f, t());
  }), e.delegated("input", i, (s) => v()(s.currentTarget.value)), e.delegated("input", f, (s) => v()(s.currentTarget.value)), e.append(w, a);
};
var Gt = e.from_html('<label class="block text-[10px] text-base-content/50 mb-0.5"> </label>'), Kt = e.from_html('<div class="flex gap-1 items-center"><input type="color" class="h-6 w-8 rounded cursor-pointer border border-base-300 p-0.5 shrink-0"/> <input class="input input-xs flex-1 font-mono"/></div>'), qt = e.from_html('<div><!> <input class="input input-xs w-full"/></div> <div><!> <input class="input input-xs w-full"/></div> <div><!> <!></div> <div><!> <!></div> <div><!> <input class="input input-xs w-full"/></div> <div><!> <input class="input input-xs w-full font-mono"/></div> <div><!> <input class="input input-xs w-full font-mono"/></div> <div><!> <input type="range" min="0" max="100" class="range range-xs range-primary w-full"/></div>', 1), Yt = e.from_html('<div><!> <textarea class="textarea textarea-xs w-full font-mono text-[10px] resize-y min-h-[120px]"></textarea></div>'), Jt = e.from_html('<div><!> <input class="input input-xs w-full"/></div> <div><!> <input class="input input-xs w-full"/></div> <div><!> <input class="input input-xs w-full"/></div> <div><!> <input class="input input-xs w-full font-mono"/></div> <div><!> <select class="select select-xs w-full"><option>Primary</option><option>Dark</option><option>Light</option></select></div>', 1), Xt = e.from_html('<div class="flex gap-1"><input class="input input-xs flex-1 min-w-0" placeholder="Value"/> <input class="input input-xs flex-1 min-w-0" placeholder="Label"/> <button class="btn btn-ghost btn-xs text-error px-1">×</button></div>'), Qt = e.from_html('<div><!> <input type="number" min="1" max="6" class="input input-xs w-full"/></div> <div><p class="text-[10px] font-medium text-base-content/60 mb-1">Items</p> <div class="space-y-1.5"><!> <button class="btn btn-xs btn-ghost w-full border border-dashed border-base-300">+ Add item</button></div></div>', 1), ea = e.from_html('<textarea class="textarea textarea-xs w-full font-mono text-[10px] resize-y min-h-[60px] mb-1"></textarea>'), ta = e.from_html('<div><!> <input type="number" min="1" max="4" class="input input-xs w-full"/></div> <div><p class="text-[10px] font-medium text-base-content/60 mb-1">Column content (HTML)</p> <!></div>', 1), aa = e.from_html('<div><!> <input type="number" min="4" max="400" class="input input-xs w-full"/></div>'), ra = e.from_html('<div><!> <!></div> <div><!> <input type="number" min="1" max="16" class="input input-xs w-full"/></div> <div><!> <select class="select select-xs w-full"><option>Solid</option><option>Dashed</option><option>Dotted</option></select></div>', 1), ia = e.from_html('<div><!> <input class="input input-xs w-full font-mono"/></div> <div><!> <input class="input input-xs w-full"/></div> <div><!> <input class="input input-xs w-full"/></div> <div><!> <input class="input input-xs w-full font-mono"/></div>', 1), la = e.from_html('<div><!> <input class="input input-xs w-full font-mono" placeholder="youtube.com/watch?v=…"/></div> <div><!> <input class="input input-xs w-full"/></div>', 1), na = e.from_html('<div class="flex gap-1 items-center"><input class="input input-xs flex-1 min-w-0 font-mono text-[10px]" placeholder="URL"/> <button class="btn btn-ghost btn-xs text-error px-1">×</button></div>'), sa = e.from_html('<div><!> <input type="number" min="1" max="6" class="input input-xs w-full"/></div> <div><p class="text-[10px] font-medium text-base-content/60 mb-1">Images</p> <div class="space-y-1"><!> <button class="btn btn-xs btn-ghost w-full border border-dashed border-base-300">+ Add image</button></div></div>', 1), oa = e.from_html('<div><!> <textarea class="textarea textarea-xs w-full font-mono text-[10px] resize-y min-h-[120px]"></textarea></div>'), da = e.from_html("<option> </option>"), ca = e.from_html('<select class="select select-xs w-full font-mono"><option>— choose —</option><!></select>'), pa = e.from_html('<input class="input input-xs w-full font-mono"/>'), va = e.from_html('<div><!> <!></div> <div><!> <input class="input input-xs w-full"/></div> <div><!> <input class="input input-xs w-full font-mono"/></div> <div><!> <input type="number" min="1" max="200" class="input input-xs w-full"/></div>', 1), ua = e.from_html('<div><label class="text-[9px] text-base-content/40"> </label> <input type="number" min="0" class="input input-xs w-full"/></div>'), ga = e.from_html('<div><label class="text-[9px] text-base-content/40"> </label> <input type="number" class="input input-xs w-full"/></div>'), _a = e.from_html('<button class="btn btn-ghost btn-xs px-1 text-base-content/40">×</button>'), fa = e.from_html('<button class="btn btn-ghost btn-xs px-1 text-base-content/40">×</button>'), ma = e.from_html("<button> </button>"), ba = e.from_html('<p class="text-[10px] font-bold text-base-content/40 uppercase tracking-widest">Padding</p> <div class="grid grid-cols-2 gap-1.5"></div> <p class="text-[10px] font-bold text-base-content/40 uppercase tracking-widest mt-2">Margin</p> <div class="grid grid-cols-2 gap-1.5"></div> <p class="text-[10px] font-bold text-base-content/40 uppercase tracking-widest mt-2">Colors</p> <div><!> <div class="flex gap-1 items-center"><input type="color" class="h-6 w-8 rounded cursor-pointer border border-base-300 p-0.5 shrink-0"/> <input class="input input-xs flex-1 font-mono"/> <!></div></div> <div><!> <div class="flex gap-1 items-center"><input type="color" class="h-6 w-8 rounded cursor-pointer border border-base-300 p-0.5 shrink-0"/> <input class="input input-xs flex-1 font-mono"/> <!></div></div> <p class="text-[10px] font-bold text-base-content/40 uppercase tracking-widest mt-2">Typography</p> <div><!> <div class="flex gap-1"></div></div> <div><!> <input type="number" min="0" max="64" class="input input-xs w-full"/></div>', 1), ha = e.from_html('<div class="w-64 shrink-0 bg-base-100 border-l border-base-300 flex flex-col overflow-hidden"><div class="px-3 py-2.5 border-b border-base-300 flex items-center justify-between"><span class="text-[10px] font-bold text-base-content/40 uppercase tracking-widest">Properties</span> <span class="text-[10px] badge badge-ghost font-mono"> </span></div> <div class="flex border-b border-base-300"><button>Content</button> <button>Style</button></div> <div class="flex-1 overflow-y-auto px-3 py-3 space-y-3"><!></div></div>');
function xa(w, t) {
  e.push(t, !0);
  let v = e.state("content"), a = e.state(e.proxy([]));
  _e(async () => {
    try {
      const n = await (await fetch("/api/collections")).json();
      e.set(a, (n.collections ?? []).map((u) => u.name), !0);
    } catch {
    }
  });
  function i(l, n) {
    t.onPatch((u) => ({ ...u, props: { ...u.props, [l]: n } }));
  }
  function f(l, n) {
    const u = n === "" ? void 0 : n;
    t.onPatch((L) => ({ ...L, style: { ...L.style ?? {}, [l]: u } }));
  }
  function s(l) {
    t.onPatch((n) => ({ ...n, props: { ...n.props, items: l } }));
  }
  const r = e.derived(() => t.block.props), S = e.derived(() => t.block.style ?? {});
  var Z = ha(), K = e.child(Z), ee = e.sibling(e.child(K), 2), Q = e.child(ee, !0);
  e.reset(ee), e.reset(K);
  var q = e.sibling(K, 2), ae = e.child(q), te = e.sibling(ae, 2);
  e.reset(q);
  var M = e.sibling(q, 2), E = e.child(M);
  {
    var H = (l) => {
      var n = e.comment(), u = e.first_child(n);
      {
        var L = (T) => {
          var C = qt(), c = e.first_child(C), p = e.child(c);
          F(p, () => "Title");
          var _ = e.sibling(p, 2);
          e.remove_input_defaults(_), e.reset(c);
          var z = e.sibling(c, 2), $ = e.child(z);
          F($, () => "Subtitle");
          var N = e.sibling($, 2);
          e.remove_input_defaults(N), e.reset(z);
          var D = e.sibling(z, 2), d = e.child(D);
          F(d, () => "Background color");
          var x = e.sibling(d, 2);
          me(x, () => e.get(r).bg_color ?? "#1e293b", () => (ne) => i("bg_color", ne)), e.reset(D);
          var j = e.sibling(D, 2), I = e.child(j);
          F(I, () => "Text color");
          var R = e.sibling(I, 2);
          me(R, () => e.get(r).text_color ?? "#ffffff", () => (ne) => i("text_color", ne)), e.reset(j);
          var B = e.sibling(j, 2), U = e.child(B);
          F(U, () => "CTA text");
          var k = e.sibling(U, 2);
          e.remove_input_defaults(k), e.reset(B);
          var y = e.sibling(B, 2), X = e.child(y);
          F(X, () => "CTA URL");
          var de = e.sibling(X, 2);
          e.remove_input_defaults(de), e.reset(y);
          var se = e.sibling(y, 2), ie = e.child(se);
          F(ie, () => "Image URL");
          var ce = e.sibling(ie, 2);
          e.remove_input_defaults(ce), e.reset(se);
          var oe = e.sibling(se, 2), ue = e.child(oe);
          F(ue, () => `Overlay opacity (${e.get(r).overlay_opacity ?? 40}%)`);
          var ve = e.sibling(ue, 2);
          e.remove_input_defaults(ve), e.reset(oe), e.template_effect(() => {
            e.set_value(_, e.get(r).title ?? ""), e.set_value(N, e.get(r).subtitle ?? ""), e.set_value(k, e.get(r).cta_text ?? ""), e.set_value(de, e.get(r).cta_url ?? ""), e.set_value(ce, e.get(r).image_url ?? ""), e.set_value(ve, e.get(r).overlay_opacity ?? 40);
          }), e.delegated("input", _, (ne) => i("title", ne.currentTarget.value)), e.delegated("input", N, (ne) => i("subtitle", ne.currentTarget.value)), e.delegated("input", k, (ne) => i("cta_text", ne.currentTarget.value)), e.delegated("input", de, (ne) => i("cta_url", ne.currentTarget.value)), e.delegated("input", ce, (ne) => i("image_url", ne.currentTarget.value)), e.delegated("input", ve, (ne) => i("overlay_opacity", Number(ne.currentTarget.value))), e.append(T, C);
        }, A = (T) => {
          var C = Yt(), c = e.child(C);
          F(c, () => "Content (HTML)");
          var p = e.sibling(c, 2);
          e.remove_textarea_child(p), e.reset(C), e.template_effect(() => e.set_value(p, e.get(r).content ?? "")), e.delegated("input", p, (_) => i("content", _.currentTarget.value)), e.append(T, C);
        }, P = (T) => {
          var C = Jt(), c = e.first_child(C), p = e.child(c);
          F(p, () => "Heading");
          var _ = e.sibling(p, 2);
          e.remove_input_defaults(_), e.reset(c);
          var z = e.sibling(c, 2), $ = e.child(z);
          F($, () => "Subtext");
          var N = e.sibling($, 2);
          e.remove_input_defaults(N), e.reset(z);
          var D = e.sibling(z, 2), d = e.child(D);
          F(d, () => "Button text");
          var x = e.sibling(d, 2);
          e.remove_input_defaults(x), e.reset(D);
          var j = e.sibling(D, 2), I = e.child(j);
          F(I, () => "Button URL");
          var R = e.sibling(I, 2);
          e.remove_input_defaults(R), e.reset(j);
          var B = e.sibling(j, 2), U = e.child(B);
          F(U, () => "Variant");
          var k = e.sibling(U, 2), y = e.child(k);
          y.value = y.__value = "primary";
          var X = e.sibling(y);
          X.value = X.__value = "dark";
          var de = e.sibling(X);
          de.value = de.__value = "light", e.reset(k);
          var se;
          e.init_select(k), e.reset(B), e.template_effect(() => {
            e.set_value(_, e.get(r).heading ?? ""), e.set_value(N, e.get(r).text ?? ""), e.set_value(x, e.get(r).button_text ?? ""), e.set_value(R, e.get(r).button_url ?? ""), se !== (se = e.get(r).variant ?? "primary") && (k.value = (k.__value = e.get(r).variant ?? "primary") ?? "", e.select_option(k, e.get(r).variant ?? "primary"));
          }), e.delegated("input", _, (ie) => i("heading", ie.currentTarget.value)), e.delegated("input", N, (ie) => i("text", ie.currentTarget.value)), e.delegated("input", x, (ie) => i("button_text", ie.currentTarget.value)), e.delegated("input", R, (ie) => i("button_url", ie.currentTarget.value)), e.delegated("change", k, (ie) => i("variant", ie.currentTarget.value)), e.append(T, C);
        }, O = (T) => {
          var C = Qt(), c = e.first_child(C), p = e.child(c);
          F(p, () => "Columns");
          var _ = e.sibling(p, 2);
          e.remove_input_defaults(_), e.reset(c);
          var z = e.sibling(c, 2), $ = e.sibling(e.child(z), 2), N = e.child($);
          e.each(N, 17, () => e.get(r).items ?? [], e.index, (d, x, j) => {
            var I = Xt(), R = e.child(I);
            e.remove_input_defaults(R);
            var B = e.sibling(R, 2);
            e.remove_input_defaults(B);
            var U = e.sibling(B, 2);
            e.reset(I), e.template_effect(() => {
              e.set_value(R, e.get(x).value), e.set_value(B, e.get(x).label);
            }), e.delegated("input", R, (k) => {
              const y = [...e.get(r).items ?? []];
              y[j] = { ...y[j], value: k.currentTarget.value }, s(y);
            }), e.delegated("input", B, (k) => {
              const y = [...e.get(r).items ?? []];
              y[j] = { ...y[j], label: k.currentTarget.value }, s(y);
            }), e.delegated("click", U, () => s((e.get(r).items ?? []).filter((k, y) => y !== j))), e.append(d, I);
          });
          var D = e.sibling(N, 2);
          e.reset($), e.reset(z), e.template_effect(() => e.set_value(_, e.get(r).columns ?? 4)), e.delegated("input", _, (d) => i("columns", Number(d.currentTarget.value))), e.delegated("click", D, () => s([...e.get(r).items ?? [], { value: "—", label: "Label" }])), e.append(T, C);
        }, g = (T) => {
          var C = ta(), c = e.first_child(C), p = e.child(c);
          F(p, () => "Columns");
          var _ = e.sibling(p, 2);
          e.remove_input_defaults(_), e.reset(c);
          var z = e.sibling(c, 2), $ = e.sibling(e.child(z), 2);
          e.each($, 17, () => e.get(r).items ?? [], e.index, (N, D, d) => {
            var x = ea();
            e.remove_textarea_child(x), e.template_effect(() => e.set_value(x, e.get(D))), e.delegated("input", x, (j) => {
              const I = [...e.get(r).items ?? []];
              I[d] = j.currentTarget.value, t.onPatch((R) => ({ ...R, props: { ...R.props, items: I } }));
            }), e.append(N, x);
          }), e.reset(z), e.template_effect(() => e.set_value(_, e.get(r).count ?? 2)), e.delegated("input", _, (N) => i("count", Number(N.currentTarget.value))), e.append(T, C);
        }, m = (T) => {
          var C = aa(), c = e.child(C);
          F(c, () => "Height (px)");
          var p = e.sibling(c, 2);
          e.remove_input_defaults(p), e.reset(C), e.template_effect(() => e.set_value(p, e.get(r).height ?? 48)), e.delegated("input", p, (_) => i("height", Number(_.currentTarget.value))), e.append(T, C);
        }, o = (T) => {
          var C = ra(), c = e.first_child(C), p = e.child(c);
          F(p, () => "Color");
          var _ = e.sibling(p, 2);
          me(_, () => e.get(r).color ?? "#e5e7eb", () => (U) => i("color", U)), e.reset(c);
          var z = e.sibling(c, 2), $ = e.child(z);
          F($, () => "Thickness (px)");
          var N = e.sibling($, 2);
          e.remove_input_defaults(N), e.reset(z);
          var D = e.sibling(z, 2), d = e.child(D);
          F(d, () => "Style");
          var x = e.sibling(d, 2), j = e.child(x);
          j.value = j.__value = "solid";
          var I = e.sibling(j);
          I.value = I.__value = "dashed";
          var R = e.sibling(I);
          R.value = R.__value = "dotted", e.reset(x);
          var B;
          e.init_select(x), e.reset(D), e.template_effect(() => {
            e.set_value(N, e.get(r).thickness ?? 1), B !== (B = e.get(r).line_style ?? "solid") && (x.value = (x.__value = e.get(r).line_style ?? "solid") ?? "", e.select_option(x, e.get(r).line_style ?? "solid"));
          }), e.delegated("input", N, (U) => i("thickness", Number(U.currentTarget.value))), e.delegated("change", x, (U) => i("line_style", U.currentTarget.value)), e.append(T, C);
        }, b = (T) => {
          var C = ia(), c = e.first_child(C), p = e.child(c);
          F(p, () => "Image URL");
          var _ = e.sibling(p, 2);
          e.remove_input_defaults(_), e.reset(c);
          var z = e.sibling(c, 2), $ = e.child(z);
          F($, () => "Alt text");
          var N = e.sibling($, 2);
          e.remove_input_defaults(N), e.reset(z);
          var D = e.sibling(z, 2), d = e.child(D);
          F(d, () => "Caption");
          var x = e.sibling(d, 2);
          e.remove_input_defaults(x), e.reset(D);
          var j = e.sibling(D, 2), I = e.child(j);
          F(I, () => "Link URL");
          var R = e.sibling(I, 2);
          e.remove_input_defaults(R), e.reset(j), e.template_effect(() => {
            e.set_value(_, e.get(r).url ?? ""), e.set_value(N, e.get(r).alt ?? ""), e.set_value(x, e.get(r).caption ?? ""), e.set_value(R, e.get(r).link ?? "");
          }), e.delegated("input", _, (B) => i("url", B.currentTarget.value)), e.delegated("input", N, (B) => i("alt", B.currentTarget.value)), e.delegated("input", x, (B) => i("caption", B.currentTarget.value)), e.delegated("input", R, (B) => i("link", B.currentTarget.value)), e.append(T, C);
        }, h = (T) => {
          var C = la(), c = e.first_child(C), p = e.child(c);
          F(p, () => "Video URL");
          var _ = e.sibling(p, 2);
          e.remove_input_defaults(_), e.reset(c);
          var z = e.sibling(c, 2), $ = e.child(z);
          F($, () => "Caption");
          var N = e.sibling($, 2);
          e.remove_input_defaults(N), e.reset(z), e.template_effect(() => {
            e.set_value(_, e.get(r).url ?? ""), e.set_value(N, e.get(r).caption ?? "");
          }), e.delegated("input", _, (D) => i("url", D.currentTarget.value)), e.delegated("input", N, (D) => i("caption", D.currentTarget.value)), e.append(T, C);
        }, V = (T) => {
          var C = sa(), c = e.first_child(C), p = e.child(c);
          F(p, () => "Columns");
          var _ = e.sibling(p, 2);
          e.remove_input_defaults(_), e.reset(c);
          var z = e.sibling(c, 2), $ = e.sibling(e.child(z), 2), N = e.child($);
          e.each(N, 17, () => e.get(r).images ?? [], e.index, (d, x, j) => {
            var I = na(), R = e.child(I);
            e.remove_input_defaults(R);
            var B = e.sibling(R, 2);
            e.reset(I), e.template_effect(() => e.set_value(R, e.get(x).url ?? e.get(x))), e.delegated("input", R, (U) => {
              const k = [...e.get(r).images ?? []];
              k[j] = { url: U.currentTarget.value, alt: e.get(x).alt ?? "" }, t.onPatch((y) => ({ ...y, props: { ...y.props, images: k } }));
            }), e.delegated("click", B, () => t.onPatch((U) => ({
              ...U,
              props: {
                ...U.props,
                images: (e.get(r).images ?? []).filter((k, y) => y !== j)
              }
            }))), e.append(d, I);
          });
          var D = e.sibling(N, 2);
          e.reset($), e.reset(z), e.template_effect(() => e.set_value(_, e.get(r).columns ?? 3)), e.delegated("input", _, (d) => i("columns", Number(d.currentTarget.value))), e.delegated("click", D, () => t.onPatch((d) => ({
            ...d,
            props: {
              ...d.props,
              images: [...e.get(r).images ?? [], { url: "", alt: "" }]
            }
          }))), e.append(T, C);
        }, Y = (T) => {
          var C = oa(), c = e.child(C);
          F(c, () => "HTML / iframe");
          var p = e.sibling(c, 2);
          e.remove_textarea_child(p), e.reset(C), e.template_effect(() => e.set_value(p, e.get(r).html ?? "")), e.delegated("input", p, (_) => i("html", _.currentTarget.value)), e.append(T, C);
        }, W = (T) => {
          var C = va(), c = e.first_child(C), p = e.child(c);
          F(p, () => "Collection");
          var _ = e.sibling(p, 2);
          {
            var z = (k) => {
              var y = ca(), X = e.child(y);
              X.value = X.__value = "";
              var de = e.sibling(X);
              e.each(de, 17, () => e.get(a), e.index, (ie, ce) => {
                var oe = da(), ue = e.child(oe, !0);
                e.reset(oe);
                var ve = {};
                e.template_effect(() => {
                  e.set_text(ue, e.get(ce)), ve !== (ve = e.get(ce)) && (oe.value = (oe.__value = e.get(ce)) ?? "");
                }), e.append(ie, oe);
              }), e.reset(y);
              var se;
              e.init_select(y), e.template_effect(() => {
                se !== (se = e.get(r).collection ?? "") && (y.value = (y.__value = e.get(r).collection ?? "") ?? "", e.select_option(y, e.get(r).collection ?? ""));
              }), e.delegated("change", y, (ie) => i("collection", ie.currentTarget.value)), e.append(k, y);
            }, $ = (k) => {
              var y = pa();
              e.remove_input_defaults(y), e.template_effect(() => e.set_value(y, e.get(r).collection ?? "")), e.delegated("input", y, (X) => i("collection", X.currentTarget.value)), e.append(k, y);
            };
            e.if(_, (k) => {
              e.get(a).length > 0 ? k(z) : k($, -1);
            });
          }
          e.reset(c);
          var N = e.sibling(c, 2), D = e.child(N);
          F(D, () => "Title");
          var d = e.sibling(D, 2);
          e.remove_input_defaults(d), e.reset(N);
          var x = e.sibling(N, 2), j = e.child(x);
          F(j, () => "Fields (comma-separated)");
          var I = e.sibling(j, 2);
          e.remove_input_defaults(I), e.reset(x);
          var R = e.sibling(x, 2), B = e.child(R);
          F(B, () => "Row limit");
          var U = e.sibling(B, 2);
          e.remove_input_defaults(U), e.reset(R), e.template_effect(
            (k) => {
              e.set_value(d, e.get(r).title ?? ""), e.set_value(I, k), e.set_value(U, e.get(r).limit ?? 10);
            },
            [() => (e.get(r).fields ?? []).join(", ")]
          ), e.delegated("input", d, (k) => i("title", k.currentTarget.value)), e.delegated("input", I, (k) => i("fields", k.currentTarget.value.split(",").map((y) => y.trim()).filter(Boolean))), e.delegated("input", U, (k) => i("limit", Number(k.currentTarget.value))), e.append(T, C);
        };
        e.if(u, (T) => {
          t.block.type === "hero" ? T(L) : t.block.type === "richtext" ? T(A, 1) : t.block.type === "cta" ? T(P, 2) : t.block.type === "stats" ? T(O, 3) : t.block.type === "columns" ? T(g, 4) : t.block.type === "spacer" ? T(m, 5) : t.block.type === "divider" ? T(o, 6) : t.block.type === "image" ? T(b, 7) : t.block.type === "video" ? T(h, 8) : t.block.type === "gallery" ? T(V, 9) : t.block.type === "embed" ? T(Y, 10) : t.block.type === "data_table" && T(W, 11);
        });
      }
      e.append(l, n);
    }, J = (l) => {
      var n = ba(), u = e.sibling(e.first_child(n), 2);
      e.each(
        u,
        20,
        () => [
          ["Top", "paddingTop"],
          ["Bottom", "paddingBottom"],
          ["Left", "paddingLeft"],
          ["Right", "paddingRight"]
        ],
        e.index,
        (d, x) => {
          var j = e.derived(() => e.to_array(x, 2));
          let I = () => e.get(j)[0], R = () => e.get(j)[1];
          var B = ua(), U = e.child(B), k = e.child(U, !0);
          e.reset(U);
          var y = e.sibling(U, 2);
          e.remove_input_defaults(y), e.reset(B), e.template_effect(() => {
            e.set_text(k, I()), e.set_value(y, e.get(S)[R()] ?? "");
          }), e.delegated("input", y, (X) => f(R(), X.currentTarget.value === "" ? void 0 : Number(X.currentTarget.value))), e.append(d, B);
        }
      ), e.reset(u);
      var L = e.sibling(u, 4);
      e.each(L, 20, () => [["Top", "marginTop"], ["Bottom", "marginBottom"]], e.index, (d, x) => {
        var j = e.derived(() => e.to_array(x, 2));
        let I = () => e.get(j)[0], R = () => e.get(j)[1];
        var B = ga(), U = e.child(B), k = e.child(U, !0);
        e.reset(U);
        var y = e.sibling(U, 2);
        e.remove_input_defaults(y), e.reset(B), e.template_effect(() => {
          e.set_text(k, I()), e.set_value(y, e.get(S)[R()] ?? "");
        }), e.delegated("input", y, (X) => f(R(), X.currentTarget.value === "" ? void 0 : Number(X.currentTarget.value))), e.append(d, B);
      }), e.reset(L);
      var A = e.sibling(L, 4), P = e.child(A);
      F(P, () => "Background");
      var O = e.sibling(P, 2), g = e.child(O);
      e.remove_input_defaults(g);
      var m = e.sibling(g, 2);
      e.remove_input_defaults(m);
      var o = e.sibling(m, 2);
      {
        var b = (d) => {
          var x = _a();
          e.delegated("click", x, () => f("backgroundColor", void 0)), e.append(d, x);
        };
        e.if(o, (d) => {
          e.get(S).backgroundColor && d(b);
        });
      }
      e.reset(O), e.reset(A);
      var h = e.sibling(A, 2), V = e.child(h);
      F(V, () => "Text color");
      var Y = e.sibling(V, 2), W = e.child(Y);
      e.remove_input_defaults(W);
      var T = e.sibling(W, 2);
      e.remove_input_defaults(T);
      var C = e.sibling(T, 2);
      {
        var c = (d) => {
          var x = fa();
          e.delegated("click", x, () => f("textColor", void 0)), e.append(d, x);
        };
        e.if(C, (d) => {
          e.get(S).textColor && d(c);
        });
      }
      e.reset(Y), e.reset(h);
      var p = e.sibling(h, 4), _ = e.child(p);
      F(_, () => "Text align");
      var z = e.sibling(_, 2);
      e.each(z, 20, () => ["left", "center", "right"], e.index, (d, x) => {
        var j = ma(), I = e.child(j, !0);
        e.reset(j), e.template_effect(
          (R) => {
            e.set_class(j, 1, `btn btn-xs flex-1 ${e.get(S).textAlign === x ? "btn-primary" : "btn-ghost border border-base-300"}`), e.set_text(I, R);
          },
          [() => x[0].toUpperCase()]
        ), e.delegated("click", j, () => f("textAlign", e.get(S).textAlign === x ? void 0 : x)), e.append(d, j);
      }), e.reset(z), e.reset(p);
      var $ = e.sibling(p, 2), N = e.child($);
      F(N, () => "Border radius (px)");
      var D = e.sibling(N, 2);
      e.remove_input_defaults(D), e.reset($), e.template_effect(() => {
        e.set_value(g, e.get(S).backgroundColor || "#ffffff"), e.set_value(m, e.get(S).backgroundColor ?? ""), e.set_value(W, e.get(S).textColor || "#000000"), e.set_value(T, e.get(S).textColor ?? ""), e.set_value(D, e.get(S).borderRadius ?? "");
      }), e.delegated("input", g, (d) => f("backgroundColor", d.currentTarget.value)), e.delegated("input", m, (d) => f("backgroundColor", d.currentTarget.value || void 0)), e.delegated("input", W, (d) => f("textColor", d.currentTarget.value)), e.delegated("input", T, (d) => f("textColor", d.currentTarget.value || void 0)), e.delegated("input", D, (d) => f("borderRadius", d.currentTarget.value === "" ? void 0 : Number(d.currentTarget.value))), e.append(l, n);
    };
    e.if(E, (l) => {
      e.get(v) === "content" ? l(H) : l(J, -1);
    });
  }
  e.reset(M), e.reset(Z), e.template_effect(() => {
    e.set_text(Q, t.block.type), e.set_class(ae, 1, `flex-1 py-2 text-xs font-medium transition-colors
        ${e.get(v) === "content" ? "text-primary border-b-2 border-primary" : "text-base-content/50 hover:text-base-content"}`), e.set_class(te, 1, `flex-1 py-2 text-xs font-medium transition-colors
        ${e.get(v) === "style" ? "text-primary border-b-2 border-primary" : "text-base-content/50 hover:text-base-content"}`);
  }), e.delegated("click", ae, () => e.set(v, "content")), e.delegated("click", te, () => e.set(v, "style")), e.append(w, Z), e.pop();
}
e.delegate(["input", "click", "change"]);
var ya = e.from_html('<div class="flex items-center justify-center h-screen"><!></div>'), wa = e.from_html('<div class="flex flex-col items-center justify-center h-screen gap-3 text-base-content/40"><p class="text-lg">Page not found</p> <a href="#/pages" class="btn btn-ghost btn-sm">← Back to pages</a></div>'), ka = e.from_html('<input class="input input-xs font-semibold max-w-[220px]"/>'), Ta = e.from_html('<button class="text-sm font-semibold truncate max-w-[220px] hover:text-primary transition-colors text-left" title="Click to rename"> </button>'), Pa = e.from_html("<button><!></button>"), Ca = e.from_html('<button class="btn btn-ghost btn-xs gap-1"><!> Publish</button>'), Na = e.from_html('<div class="w-64 shrink-0 bg-base-100 border-l border-base-300 flex flex-col items-center justify-center gap-2 text-base-content/25 select-none"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect><rect x="14" y="14" width="7" height="7" rx="1"></rect></svg> <p class="text-xs text-center px-4 leading-relaxed">Select a block to edit its properties</p></div>'), ja = e.from_html('<div class="flex flex-col h-screen overflow-hidden bg-base-200"><header class="flex items-center justify-between gap-3 px-3 py-2 bg-base-100 border-b border-base-300 shrink-0 z-30"><div class="flex items-center gap-2 min-w-0"><a href="#/pages" class="btn btn-ghost btn-xs gap-1 shrink-0"><!> Pages</a> <div class="h-4 w-px bg-base-300 shrink-0"></div> <!> <span class="text-xs text-base-content/30 font-mono truncate hidden sm:block"> </span> <span> </span></div> <div class="flex items-center gap-0.5 bg-base-200 rounded-lg p-0.5 shrink-0"></div> <div class="flex items-center gap-1 shrink-0"><button class="btn btn-ghost btn-xs" title="Undo (Ctrl+Z)"><!></button> <button class="btn btn-ghost btn-xs" title="Redo (Ctrl+Y)"><!></button> <div class="h-4 w-px bg-base-300 mx-0.5"></div> <!> <button class="btn btn-primary btn-xs gap-1"><!> </button></div></header> <div class="flex flex-1 overflow-hidden"><!> <!> <!></div></div>');
function Ma(w, t) {
  var m;
  e.push(t, !0);
  const v = window.__ZVELTIO_ENGINE_URL__ ?? "", a = (m = window.location.hash.match(/\/pages\/([^/]+)\/edit/)) == null ? void 0 : m[1];
  let i = e.state(null), f = e.state(!0), s = e.state(!1), r = e.state(!1), S = e.state(!1), Z = e.state(e.proxy([])), K = e.state(null), ee = e.state("desktop"), Q = e.state(e.proxy([])), q = e.state(e.proxy([]));
  function ae(o) {
    e.set(Q, [...e.get(Q), e.get(Z)], !0), e.set(q, [], !0), e.set(Z, o, !0);
  }
  function te() {
    e.get(Q).length && (e.set(q, [e.get(Z), ...e.get(q)], !0), e.set(Z, e.get(Q)[e.get(Q).length - 1], !0), e.set(Q, e.get(Q).slice(0, -1), !0));
  }
  function M() {
    e.get(q).length && (e.set(Q, [...e.get(Q), e.get(Z)], !0), e.set(Z, e.get(q)[0], !0), e.set(q, e.get(q).slice(1), !0));
  }
  const E = e.derived(() => e.get(Z).find((o) => o.id === e.get(K)) ?? null);
  _e(async () => {
    var o;
    if (!a) {
      e.set(f, !1);
      return;
    }
    try {
      const h = await (await fetch(`${v}/api/pages/${a}`, { credentials: "include" })).json();
      e.set(i, h.page, !0), e.set(Z, Array.isArray((o = e.get(i)) == null ? void 0 : o.blocks) ? e.get(i).blocks : [], !0);
    } finally {
      e.set(f, !1);
    }
  });
  async function H(o) {
    if (!(!e.get(i) || e.get(s))) {
      e.set(s, !0);
      try {
        await fetch(`${v}/api/pages/${a}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: e.get(i).title,
            slug: e.get(i).slug,
            description: e.get(i).description,
            blocks: e.get(Z),
            meta: e.get(i).meta,
            ...o ? { status: o } : {}
          })
        }), o && (e.get(i).status = o), e.set(r, !0), setTimeout(() => e.set(r, !1), 2e3);
      } finally {
        e.set(s, !1);
      }
    }
  }
  function J(o) {
    const b = o.metaKey || o.ctrlKey;
    if (b && o.key === "z" && !o.shiftKey) {
      o.preventDefault(), te();
      return;
    }
    if (b && (o.key === "y" || o.key === "z" && o.shiftKey)) {
      o.preventDefault(), M();
      return;
    }
    if (b && o.key === "s") {
      o.preventDefault(), H();
      return;
    }
    if (o.key === "Escape") {
      e.set(K, null);
      return;
    }
    if ((o.key === "Delete" || o.key === "Backspace") && e.get(K)) {
      const h = document.activeElement;
      if (h && (h.tagName === "INPUT" || h.tagName === "TEXTAREA" || h.tagName === "SELECT")) return;
      o.preventDefault(), ae(e.get(Z).filter((V) => V.id !== e.get(K))), e.set(K, null);
    }
  }
  _e(() => {
    window.addEventListener("keydown", J);
  }), Pe(() => {
    window.removeEventListener("keydown", J);
  });
  function l(o) {
    ae([...e.get(Z), o]), e.set(K, o.id, !0);
  }
  function n(o) {
    ae(o);
  }
  function u(o) {
    ae(e.get(Z).map((b) => b.id === e.get(K) ? o(b) : b));
  }
  var L = e.comment(), A = e.first_child(L);
  {
    var P = (o) => {
      var b = ya(), h = e.child(b);
      be(h, { size: 28, class: "animate-spin text-base-content/40" }), e.reset(b), e.append(o, b);
    }, O = (o) => {
      var b = wa();
      e.append(o, b);
    }, g = (o) => {
      var b = ja(), h = e.child(b), V = e.child(h), Y = e.child(V), W = e.child(Y);
      je(W, { size: 13 }), e.next(), e.reset(Y);
      var T = e.sibling(Y, 4);
      {
        var C = (G) => {
          var re = ka();
          e.remove_input_defaults(re), e.autofocus(re, !0), e.event("blur", re, () => e.set(S, !1)), e.delegated("keydown", re, (pe) => pe.key === "Enter" && e.set(S, !1)), e.bind_value(re, () => e.get(i).title, (pe) => e.get(i).title = pe), e.append(G, re);
        }, c = (G) => {
          var re = Ta(), pe = e.child(re, !0);
          e.reset(re), e.template_effect(() => e.set_text(pe, e.get(i).title)), e.delegated("click", re, () => e.set(S, !0)), e.append(G, re);
        };
        e.if(T, (G) => {
          e.get(S) ? G(C) : G(c, -1);
        });
      }
      var p = e.sibling(T, 2), _ = e.child(p);
      e.reset(p);
      var z = e.sibling(p, 2), $ = e.child(z, !0);
      e.reset(z), e.reset(V);
      var N = e.sibling(V, 2);
      e.each(
        N,
        21,
        () => [
          ["desktop", Re],
          ["tablet", $e],
          ["mobile", Ae]
        ],
        e.index,
        (G, re) => {
          var pe = e.derived(() => e.to_array(e.get(re), 2));
          let fe = () => e.get(pe)[0], ye = () => e.get(pe)[1];
          var ge = Pa(), we = e.child(ge);
          e.component(we, ye, (ke, Te) => {
            Te(ke, { size: 14 });
          }), e.reset(ge), e.template_effect(() => {
            e.set_class(ge, 1, `p-1.5 rounded-md transition-colors ${e.get(ee) === fe() ? "bg-base-100 shadow-sm text-primary" : "text-base-content/40 hover:text-base-content"}`), e.set_attribute(ge, "title", fe());
          }), e.delegated("click", ge, () => e.set(ee, fe(), !0)), e.append(G, ge);
        }
      ), e.reset(N);
      var D = e.sibling(N, 2), d = e.child(D), x = e.child(d);
      Be(x, { size: 13 }), e.reset(d);
      var j = e.sibling(d, 2), I = e.child(j);
      Ie(I, { size: 13 }), e.reset(j);
      var R = e.sibling(j, 4);
      {
        var B = (G) => {
          var re = Ca(), pe = e.child(re);
          he(pe, { size: 13 }), e.next(), e.reset(re), e.delegated("click", re, () => H("published")), e.append(G, re);
        };
        e.if(R, (G) => {
          e.get(i).status !== "published" && G(B);
        });
      }
      var U = e.sibling(R, 2), k = e.child(U);
      {
        var y = (G) => {
          be(G, { size: 12, class: "animate-spin" });
        }, X = (G) => {
          Me(G, { size: 12 });
        }, de = (G) => {
          Ue(G, { size: 12 });
        };
        e.if(k, (G) => {
          e.get(s) ? G(y) : e.get(r) ? G(X, 1) : G(de, -1);
        });
      }
      var se = e.sibling(k);
      e.reset(U), e.reset(D), e.reset(h);
      var ie = e.sibling(h, 2), ce = e.child(ie);
      it(ce, { onAdd: l });
      var oe = e.sibling(ce, 2);
      Zt(oe, {
        get blocks() {
          return e.get(Z);
        },
        get selectedId() {
          return e.get(K);
        },
        get device() {
          return e.get(ee);
        },
        onChange: n,
        onSelect: (G) => e.set(K, G, !0)
      });
      var ue = e.sibling(oe, 2);
      {
        var ve = (G) => {
          xa(G, {
            get block() {
              return e.get(E);
            },
            onPatch: u
          });
        }, ne = (G) => {
          var re = Na();
          e.append(G, re);
        };
        e.if(ue, (G) => {
          e.get(E) ? G(ve) : G(ne, -1);
        });
      }
      e.reset(ie), e.reset(b), e.template_effect(() => {
        e.set_text(_, `/${e.get(i).slug ?? ""}`), e.set_class(z, 1, `badge badge-xs ${e.get(i).status === "published" ? "badge-success" : "badge-warning"} shrink-0`), e.set_text($, e.get(i).status), d.disabled = !e.get(Q).length, j.disabled = !e.get(q).length, U.disabled = e.get(s), e.set_text(se, ` ${e.get(r) ? "Saved" : "Save"}`);
      }), e.delegated("click", d, te), e.delegated("click", j, M), e.delegated("click", U, () => H()), e.append(o, b);
    };
    e.if(A, (o) => {
      e.get(f) ? o(P) : e.get(i) ? o(g, -1) : o(O, 1);
    });
  }
  e.append(w, L), e.pop();
}
e.delegate(["keydown", "click"]);
function za() {
  const w = window.__zveltio;
  w && w.registerRoute({
    path: "pages",
    component: et,
    label: "Pages",
    icon: "FileText",
    category: "content",
    children: [
      {
        path: "pages/:id/edit",
        component: Ma,
        label: "Page Editor",
        icon: "Edit",
        category: "content"
      }
    ]
  });
}
za();
export {
  za as default
};
