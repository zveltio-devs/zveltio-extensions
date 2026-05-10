import "svelte/internal/disclose-version";
import * as t from "svelte/internal/client";
import { onMount as Zt } from "svelte";
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
const Kt = {
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
var Xt = t.from_svg("<svg><!><!></svg>");
function S(p, e) {
  t.push(e, !0);
  const l = t.prop(e, "color", 3, "currentColor"), c = t.prop(e, "size", 3, 24), u = t.prop(e, "strokeWidth", 3, 2), g = t.prop(e, "absoluteStrokeWidth", 3, !1), i = t.prop(e, "iconNode", 19, () => []), d = t.rest_props(e, [
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
  var $ = Xt();
  t.attribute_effect(
    $,
    (k) => ({
      ...Kt,
      ...d,
      width: c(),
      height: c(),
      stroke: l(),
      "stroke-width": k,
      class: [
        "lucide-icon lucide",
        e.name && `lucide-${e.name}`,
        e.class
      ]
    }),
    [
      () => g() ? Number(u()) * 24 / Number(c()) : u()
    ]
  );
  var a = t.child($);
  t.each(a, 17, i, t.index, (k, rt) => {
    var Q = t.derived(() => t.to_array(t.get(rt), 2));
    let Z = () => t.get(Q)[0], it = () => t.get(Q)[1];
    var K = t.comment(), st = t.first_child(K);
    t.element(st, Z, !0, (nt, mt) => {
      t.attribute_effect(nt, () => ({ ...it() }));
    }), t.append(k, K);
  });
  var y = t.sibling(a);
  t.snippet(y, () => e.children ?? t.noop), t.reset($), t.append(p, $), t.pop();
}
function Yt(p, e) {
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
  let l = t.rest_props(e, ["$$slots", "$$events", "$$legacy"]);
  const c = [
    ["path", { d: "M21.801 10A10 10 0 1 1 17 3.335" }],
    ["path", { d: "m9 11 3 3L22 4" }]
  ];
  S(p, t.spread_props({ name: "circle-check-big" }, () => l, {
    get iconNode() {
      return c;
    },
    children: (u, g) => {
      var i = t.comment(), d = t.first_child(i);
      t.snippet(d, () => e.children ?? t.noop), t.append(u, i);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function te(p, e) {
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
  let l = t.rest_props(e, ["$$slots", "$$events", "$$legacy"]);
  const c = [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["path", { d: "m15 9-6 6" }],
    ["path", { d: "m9 9 6 6" }]
  ];
  S(p, t.spread_props({ name: "circle-x" }, () => l, {
    get iconNode() {
      return c;
    },
    children: (u, g) => {
      var i = t.comment(), d = t.first_child(i);
      t.snippet(d, () => e.children ?? t.noop), t.append(u, i);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function ee(p, e) {
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
  let l = t.rest_props(e, ["$$slots", "$$events", "$$legacy"]);
  const c = [["path", { d: "M5 12h14" }], ["path", { d: "M12 5v14" }]];
  S(p, t.spread_props({ name: "plus" }, () => l, {
    get iconNode() {
      return c;
    },
    children: (u, g) => {
      var i = t.comment(), d = t.first_child(i);
      t.snippet(d, () => e.children ?? t.noop), t.append(u, i);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function ae(p, e) {
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
  let l = t.rest_props(e, ["$$slots", "$$events", "$$legacy"]);
  const c = [
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
  S(p, t.spread_props({ name: "refresh-cw" }, () => l, {
    get iconNode() {
      return c;
    },
    children: (u, g) => {
      var i = t.comment(), d = t.first_child(i);
      t.snippet(d, () => e.children ?? t.noop), t.append(u, i);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function re(p, e) {
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
  let l = t.rest_props(e, ["$$slots", "$$events", "$$legacy"]);
  const c = [
    [
      "path",
      {
        d: "M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"
      }
    ],
    ["path", { d: "m21.854 2.147-10.94 10.939" }]
  ];
  S(p, t.spread_props({ name: "send" }, () => l, {
    get iconNode() {
      return c;
    },
    children: (u, g) => {
      var i = t.comment(), d = t.first_child(i);
      t.snippet(d, () => e.children ?? t.noop), t.append(u, i);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function ie(p, e) {
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
  let l = t.rest_props(e, ["$$slots", "$$events", "$$legacy"]);
  const c = [
    ["path", { d: "M3 6h18" }],
    ["path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" }],
    ["path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" }],
    ["line", { x1: "10", x2: "10", y1: "11", y2: "17" }],
    ["line", { x1: "14", x2: "14", y1: "11", y2: "17" }]
  ];
  S(p, t.spread_props({ name: "trash-2" }, () => l, {
    get iconNode() {
      return c;
    },
    children: (u, g) => {
      var i = t.comment(), d = t.first_child(i);
      t.snippet(d, () => e.children ?? t.noop), t.append(u, i);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function se(p, e) {
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
  let l = t.rest_props(e, ["$$slots", "$$events", "$$legacy"]);
  const c = [
    [
      "path",
      {
        d: "M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"
      }
    ],
    ["path", { d: "M15 18H9" }],
    [
      "path",
      {
        d: "M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"
      }
    ],
    ["circle", { cx: "17", cy: "18", r: "2" }],
    ["circle", { cx: "7", cy: "18", r: "2" }]
  ];
  S(p, t.spread_props({ name: "truck" }, () => l, {
    get iconNode() {
      return c;
    },
    children: (u, g) => {
      var i = t.comment(), d = t.first_child(i);
      t.snippet(d, () => e.children ?? t.noop), t.append(u, i);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
var ne = t.from_html("<button> </button>"), le = t.from_html('<div class="flex justify-center py-12"><span class="loading loading-spinner loading-lg"></span></div>'), oe = t.from_html('<div class="card bg-base-200 text-center py-12"><!> <p class="text-base-content/60">No transport declarations</p> <button class="btn btn-primary btn-sm mt-4">Create Declaration</button></div>'), de = t.from_html('<button class="btn btn-ghost btn-xs text-primary" title="Declare to ANAF"><!></button> <button class="btn btn-ghost btn-xs text-error"><!></button>', 1), ce = t.from_html('<button class="btn btn-ghost btn-xs text-success" title="Mark completed"><!></button> <button class="btn btn-ghost btn-xs text-error" title="Cancel"><!></button>', 1), pe = t.from_html('<tr><td class="font-mono text-xs text-base-content/50"> </td><td> </td><td class="font-mono font-medium"> </td><td> </td><td class="text-xs"> </td><td class="font-mono text-xs"> </td><td><span> </span></td><td><div class="flex gap-1"><!> <!></div></td></tr>'), ue = t.from_html('<div class="card bg-base-200"><div class="overflow-x-auto"><table class="table table-sm"><thead><tr><th>UIT</th><th>Date</th><th>Vehicle</th><th>Driver</th><th>Route</th><th>Weight (kg)</th><th>Status</th><th></th></tr></thead><tbody></tbody></table></div></div>'), ve = t.from_html('<button class="btn btn-ghost btn-xs text-error">✕</button>'), _e = t.from_html('<tr><td><input type="text" class="input input-xs w-24 font-mono"/></td><td><input type="text" class="input input-xs w-40"/></td><td><input type="number" class="input input-xs w-16"/></td><td><input type="text" class="input input-xs w-16"/></td><td><input type="number" step="0.01" class="input input-xs w-20"/></td><td><!></td></tr>'), ge = t.from_html('<span class="loading loading-spinner loading-sm"></span>'), he = t.from_html('<dialog class="modal modal-open"><div class="modal-box w-11/12 max-w-3xl"><h3 class="font-bold text-lg mb-4"> </h3> <div class="grid grid-cols-2 gap-4 mb-4"><div class="form-control"><label class="label" for="transport-date"><span class="label-text text-xs">Transport date</span></label> <input id="transport-date" type="date" class="input input-sm"/></div> <div class="form-control"><label class="label" for="transport-purpose"><span class="label-text text-xs">Purpose</span></label> <select id="transport-purpose" class="select select-sm"><option>Commercial</option><option>Personal</option><option>Return</option></select></div> <div class="form-control"><label class="label" for="transport-vehicle-plate"><span class="label-text text-xs">Vehicle plate</span></label> <input id="transport-vehicle-plate" type="text" placeholder="B 123 ABC" class="input input-sm font-mono uppercase"/></div> <div class="form-control"><label class="label" for="transport-driver-name"><span class="label-text text-xs">Driver name</span></label> <input id="transport-driver-name" type="text" placeholder="Ion Popescu" class="input input-sm"/></div></div> <div class="grid grid-cols-2 gap-4 mb-4"><div class="card bg-base-200 p-3"><p class="font-semibold text-sm mb-2">Departure</p> <div class="space-y-2"><input type="text" placeholder="Address" class="input input-sm w-full"/> <div class="grid grid-cols-2 gap-2"><input type="text" placeholder="County" class="input input-sm"/> <input type="text" placeholder="Country" class="input input-sm font-mono"/></div></div></div> <div class="card bg-base-200 p-3"><p class="font-semibold text-sm mb-2">Destination</p> <div class="space-y-2"><input type="text" placeholder="Address" class="input input-sm w-full"/> <div class="grid grid-cols-2 gap-2"><input type="text" placeholder="County" class="input input-sm"/> <input type="text" placeholder="Country" class="input input-sm font-mono"/></div></div></div></div> <div class="mb-4"><div class="flex items-center justify-between mb-2"><p class="font-semibold text-sm">Goods</p> <button class="btn btn-ghost btn-xs">+ Add good</button></div> <div class="overflow-x-auto"><table class="table table-xs"><thead><tr><th>Tariff code</th><th>Description</th><th>Qty</th><th>Unit</th><th>Weight (kg)</th><th></th></tr></thead><tbody></tbody></table></div> <p class="text-right text-sm mt-2">Total weight: <strong class="font-mono"> </strong></p></div> <div class="modal-action"><button class="btn btn-ghost">Cancel</button> <button class="btn btn-primary"><!> </button></div></div> <button class="modal-backdrop"></button></dialog>'), be = t.from_html('<div class="space-y-6"><div class="flex items-center justify-between"><div><h1 class="text-2xl font-bold">e-Transport RO</h1> <p class="text-base-content/60 text-sm mt-1">Declare and track road transport of goods via ANAF</p></div> <div class="flex gap-2"><button class="btn btn-ghost btn-sm"><!></button> <button class="btn btn-primary btn-sm gap-2"><!> New Declaration</button></div></div> <div class="tabs tabs-boxed w-fit"></div> <!></div> <!>', 1);
function me(p, e) {
  t.push(e, !0);
  const l = window.__ZVELTIO_ENGINE_URL__ || "";
  let c = t.state(t.proxy([])), u = t.state(!0), g = t.state("all"), i = t.state(!1), d = t.state(null), $ = t.state(!1), a = t.state(t.proxy({
    transport_date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    vehicle_plate: "",
    driver_name: "",
    driver_cnp: "",
    departure_address: "",
    departure_county: "",
    departure_country: "RO",
    destination_address: "",
    destination_county: "",
    destination_country: "RO",
    goods: [
      {
        tariff_code: "",
        description: "",
        quantity: 1,
        unit: "BUC",
        weight_kg: 0
      }
    ],
    total_weight_kg: 0,
    purpose: "commercial"
  }));
  Zt(() => y()), t.user_effect(() => {
    t.get(g) && y();
  });
  async function y() {
    t.set(u, !0);
    try {
      const r = t.get(g) !== "all" ? `?status=${t.get(g)}` : "", o = await (await fetch(`${l}/api/etransport${r}`, { credentials: "include" })).json();
      t.set(c, o.declarations || [], !0);
    } finally {
      t.set(u, !1);
    }
  }
  function k() {
    t.get(a).total_weight_kg = t.get(a).goods.reduce((r, s) => r + Number(s.weight_kg || 0), 0);
  }
  function rt() {
    t.get(a).goods = [
      ...t.get(a).goods,
      {
        tariff_code: "",
        description: "",
        quantity: 1,
        unit: "BUC",
        weight_kg: 0
      }
    ];
  }
  function Q(r) {
    t.get(a).goods = t.get(a).goods.filter((s, o) => o !== r), k();
  }
  function Z() {
    t.set(d, null), t.set(
      a,
      {
        transport_date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        vehicle_plate: "",
        driver_name: "",
        driver_cnp: "",
        departure_address: "",
        departure_county: "",
        departure_country: "RO",
        destination_address: "",
        destination_county: "",
        destination_country: "RO",
        goods: [
          {
            tariff_code: "",
            description: "",
            quantity: 1,
            unit: "BUC",
            weight_kg: 0
          }
        ],
        total_weight_kg: 0,
        purpose: "commercial"
      },
      !0
    ), t.set(i, !0);
  }
  async function it() {
    if (!(!t.get(a).vehicle_plate || !t.get(a).driver_name)) {
      k(), t.set($, !0);
      try {
        const r = t.get(d) ? `${l}/api/etransport/${t.get(d)}` : `${l}/api/etransport`, s = t.get(d) ? "PATCH" : "POST";
        if (!(await fetch(r, {
          method: s,
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(t.get(a))
        })).ok) throw new Error("Failed");
        t.set(i, !1), await y();
      } finally {
        t.set($, !1);
      }
    }
  }
  async function K(r) {
    if (!confirm("Submit this declaration to ANAF e-Transport?")) return;
    const s = await fetch(`${l}/api/etransport/${r}/declare`, { method: "POST", credentials: "include" }), o = await s.json();
    s.ok ? (alert(`Declared! UIT: ${o.uit}`), await y()) : alert(o.error || "Failed");
  }
  async function st(r) {
    await fetch(`${l}/api/etransport/${r}/complete`, { method: "POST", credentials: "include" }), await y();
  }
  async function nt(r) {
    confirm("Cancel this declaration?") && (await fetch(`${l}/api/etransport/${r}/cancel`, { method: "POST", credentials: "include" }), await y());
  }
  async function mt(r) {
    confirm("Delete this declaration?") && (await fetch(`${l}/api/etransport/${r}`, { method: "DELETE", credentials: "include" }), await y());
  }
  function Ot(r) {
    return {
      draft: "badge-warning",
      declared: "badge-primary",
      in_transit: "badge-info",
      completed: "badge-success",
      cancelled: "badge-error"
    }[r] || "badge-ghost";
  }
  const zt = [
    "all",
    "draft",
    "declared",
    "in_transit",
    "completed",
    "cancelled"
  ];
  var ft = be(), lt = t.first_child(ft), ot = t.child(lt), xt = t.sibling(t.child(ot), 2), X = t.child(xt), Rt = t.child(X);
  ae(Rt, { size: 14 }), t.reset(X);
  var dt = t.sibling(X, 2), Et = t.child(dt);
  ee(Et, { size: 16 }), t.next(), t.reset(dt), t.reset(xt), t.reset(ot);
  var ct = t.sibling(ot, 2);
  t.each(ct, 21, () => zt, t.index, (r, s) => {
    var o = ne(), w = t.child(o, !0);
    t.reset(o), t.template_effect(
      (M) => {
        t.set_class(o, 1, `tab ${t.get(g) === t.get(s) ? "tab-active" : ""}`), t.set_text(w, M);
      },
      [
        () => t.get(s) === "all" ? "All" : t.get(s).replace("_", " ")
      ]
    ), t.delegated("click", o, () => t.set(g, t.get(s), !0)), t.append(r, o);
  }), t.reset(ct);
  var It = t.sibling(ct, 2);
  {
    var Ut = (r) => {
      var s = le();
      t.append(r, s);
    }, Wt = (r) => {
      var s = oe(), o = t.child(s);
      se(o, { size: 48, class: "mx-auto text-base-content/20 mb-3" });
      var w = t.sibling(o, 4);
      t.reset(s), t.delegated("click", w, Z), t.append(r, s);
    }, jt = (r) => {
      var s = ue(), o = t.child(s), w = t.child(o), M = t.sibling(t.child(w));
      t.each(M, 21, () => t.get(c), t.index, (I, v) => {
        var P = pe(), N = t.child(P), U = t.child(N, !0);
        t.reset(N);
        var T = t.sibling(N), W = t.child(T, !0);
        t.reset(T);
        var A = t.sibling(T), j = t.child(A, !0);
        t.reset(A);
        var O = t.sibling(A), Y = t.child(O, !0);
        t.reset(O);
        var z = t.sibling(O), B = t.child(z);
        t.reset(z);
        var C = t.sibling(z), tt = t.child(C, !0);
        t.reset(C);
        var D = t.sibling(C), R = t.child(D), F = t.child(R, !0);
        t.reset(R), t.reset(D);
        var q = t.sibling(D), H = t.child(q), L = t.child(H);
        {
          var V = (b) => {
            var f = de(), _ = t.first_child(f), J = t.child(_);
            re(J, { size: 12 }), t.reset(_);
            var x = t.sibling(_, 2), E = t.child(x);
            ie(E, { size: 12 }), t.reset(x), t.delegated("click", _, () => K(t.get(v).id)), t.delegated("click", x, () => mt(t.get(v).id)), t.append(b, f);
          };
          t.if(L, (b) => {
            t.get(v).status === "draft" && b(V);
          });
        }
        var et = t.sibling(L, 2);
        {
          var G = (b) => {
            var f = ce(), _ = t.first_child(f), J = t.child(_);
            Yt(J, { size: 12 }), t.reset(_);
            var x = t.sibling(_, 2), E = t.child(x);
            te(E, { size: 12 }), t.reset(x), t.delegated("click", _, () => st(t.get(v).id)), t.delegated("click", x, () => nt(t.get(v).id)), t.append(b, f);
          };
          t.if(et, (b) => {
            (t.get(v).status === "declared" || t.get(v).status === "in_transit") && b(G);
          });
        }
        t.reset(H), t.reset(q), t.reset(P), t.template_effect(
          (b, f, _) => {
            t.set_text(U, t.get(v).uit || "—"), t.set_text(W, t.get(v).transport_date), t.set_text(j, t.get(v).vehicle_plate), t.set_text(Y, t.get(v).driver_name), t.set_text(B, `${t.get(v).departure_county ?? ""} → ${t.get(v).destination_county ?? ""}`), t.set_text(tt, b), t.set_class(R, 1, `badge badge-sm ${f ?? ""}`), t.set_text(F, _);
          },
          [
            () => Number(t.get(v).total_weight_kg).toFixed(0),
            () => Ot(t.get(v).status),
            () => t.get(v).status.replace("_", " ")
          ]
        ), t.append(I, P);
      }), t.reset(M), t.reset(w), t.reset(o), t.reset(s), t.append(r, s);
    };
    t.if(It, (r) => {
      t.get(u) ? r(Ut) : t.get(c).length === 0 ? r(Wt, 1) : r(jt, -1);
    });
  }
  t.reset(lt);
  var Bt = t.sibling(lt, 2);
  {
    var Ft = (r) => {
      var s = he(), o = t.child(s), w = t.child(o), M = t.child(w);
      t.reset(w);
      var I = t.sibling(w, 2), v = t.child(I), P = t.sibling(t.child(v), 2);
      t.remove_input_defaults(P), t.reset(v);
      var N = t.sibling(v, 2), U = t.sibling(t.child(N), 2), T = t.child(U);
      T.value = T.__value = "commercial";
      var W = t.sibling(T);
      W.value = W.__value = "personal";
      var A = t.sibling(W);
      A.value = A.__value = "return", t.reset(U), t.reset(N);
      var j = t.sibling(N, 2), O = t.sibling(t.child(j), 2);
      t.remove_input_defaults(O), t.reset(j);
      var Y = t.sibling(j, 2), z = t.sibling(t.child(Y), 2);
      t.remove_input_defaults(z), t.reset(Y), t.reset(I);
      var B = t.sibling(I, 2), C = t.child(B), tt = t.sibling(t.child(C), 2), D = t.child(tt);
      t.remove_input_defaults(D);
      var R = t.sibling(D, 2), F = t.child(R);
      t.remove_input_defaults(F);
      var q = t.sibling(F, 2);
      t.remove_input_defaults(q), t.reset(R), t.reset(tt), t.reset(C);
      var H = t.sibling(C, 2), L = t.sibling(t.child(H), 2), V = t.child(L);
      t.remove_input_defaults(V);
      var et = t.sibling(V, 2), G = t.child(et);
      t.remove_input_defaults(G);
      var b = t.sibling(G, 2);
      t.remove_input_defaults(b), t.reset(et), t.reset(L), t.reset(H), t.reset(B);
      var f = t.sibling(B, 2), _ = t.child(f), J = t.sibling(t.child(_), 2);
      t.reset(_);
      var x = t.sibling(_, 2), E = t.child(x), yt = t.sibling(t.child(E));
      t.each(yt, 21, () => t.get(a).goods, t.index, (n, m, Gt) => {
        var pt = _e(), ut = t.child(pt), Ct = t.child(ut);
        t.remove_input_defaults(Ct), t.reset(ut);
        var vt = t.sibling(ut), Dt = t.child(vt);
        t.remove_input_defaults(Dt), t.reset(vt);
        var _t = t.sibling(vt), St = t.child(_t);
        t.remove_input_defaults(St), t.reset(_t);
        var gt = t.sibling(_t), Mt = t.child(gt);
        t.remove_input_defaults(Mt), t.reset(gt);
        var ht = t.sibling(gt), bt = t.child(ht);
        t.remove_input_defaults(bt), t.reset(ht);
        var Pt = t.sibling(ht), Jt = t.child(Pt);
        {
          var Qt = (h) => {
            var At = ve();
            t.delegated("click", At, () => Q(Gt)), t.append(h, At);
          };
          t.if(Jt, (h) => {
            t.get(a).goods.length > 1 && h(Qt);
          });
        }
        t.reset(Pt), t.reset(pt), t.bind_value(Ct, () => t.get(m).tariff_code, (h) => t.get(m).tariff_code = h), t.bind_value(Dt, () => t.get(m).description, (h) => t.get(m).description = h), t.bind_value(St, () => t.get(m).quantity, (h) => t.get(m).quantity = h), t.bind_value(Mt, () => t.get(m).unit, (h) => t.get(m).unit = h), t.delegated("input", bt, k), t.bind_value(bt, () => t.get(m).weight_kg, (h) => t.get(m).weight_kg = h), t.append(n, pt);
      }), t.reset(yt), t.reset(E), t.reset(x);
      var wt = t.sibling(x, 2), $t = t.sibling(t.child(wt)), qt = t.child($t);
      t.reset($t), t.reset(wt), t.reset(f);
      var kt = t.sibling(f, 2), Nt = t.child(kt), at = t.sibling(Nt, 2), Tt = t.child(at);
      {
        var Ht = (n) => {
          var m = ge();
          t.append(n, m);
        };
        t.if(Tt, (n) => {
          t.get($) && n(Ht);
        });
      }
      var Lt = t.sibling(Tt);
      t.reset(at), t.reset(kt), t.reset(o);
      var Vt = t.sibling(o, 2);
      t.reset(s), t.template_effect(
        (n) => {
          t.set_text(M, `${t.get(d) ? "Edit" : "New"} Transport Declaration`), t.set_text(qt, `${n ?? ""} kg`), at.disabled = t.get($), t.set_text(Lt, ` ${t.get(d) ? "Save Changes" : "Create Declaration"}`);
        },
        [() => t.get(a).total_weight_kg.toFixed(2)]
      ), t.bind_value(P, () => t.get(a).transport_date, (n) => t.get(a).transport_date = n), t.bind_select_value(U, () => t.get(a).purpose, (n) => t.get(a).purpose = n), t.bind_value(O, () => t.get(a).vehicle_plate, (n) => t.get(a).vehicle_plate = n), t.bind_value(z, () => t.get(a).driver_name, (n) => t.get(a).driver_name = n), t.bind_value(D, () => t.get(a).departure_address, (n) => t.get(a).departure_address = n), t.bind_value(F, () => t.get(a).departure_county, (n) => t.get(a).departure_county = n), t.bind_value(q, () => t.get(a).departure_country, (n) => t.get(a).departure_country = n), t.bind_value(V, () => t.get(a).destination_address, (n) => t.get(a).destination_address = n), t.bind_value(G, () => t.get(a).destination_county, (n) => t.get(a).destination_county = n), t.bind_value(b, () => t.get(a).destination_country, (n) => t.get(a).destination_country = n), t.delegated("click", J, rt), t.delegated("click", Nt, () => t.set(i, !1)), t.delegated("click", at, it), t.delegated("click", Vt, () => t.set(i, !1)), t.append(r, s);
    };
    t.if(Bt, (r) => {
      t.get(i) && r(Ft);
    });
  }
  t.delegated("click", X, y), t.delegated("click", dt, Z), t.append(p, ft), t.pop();
}
t.delegate(["click", "input"]);
function fe() {
  const p = window.__zveltio;
  p && p.registerRoute({
    path: "etransport",
    component: me,
    label: "e-Transport RO",
    icon: "Truck",
    category: "compliance"
  });
}
fe();
export {
  fe as default
};
