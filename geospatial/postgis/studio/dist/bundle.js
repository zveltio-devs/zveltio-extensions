import "svelte/internal/disclose-version";
import * as e from "svelte/internal/client";
import { onMount as ce } from "svelte";
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
var pe = e.from_svg("<svg><!><!></svg>");
function se(c, s) {
  e.push(s, !0);
  const d = e.prop(s, "color", 3, "currentColor"), o = e.prop(s, "size", 3, 24), p = e.prop(s, "strokeWidth", 3, 2), r = e.prop(s, "absoluteStrokeWidth", 3, !1), i = e.prop(s, "iconNode", 19, () => []), v = e.rest_props(s, [
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
  var u = pe();
  e.attribute_effect(
    u,
    (m) => ({
      ...de,
      ...v,
      width: o(),
      height: o(),
      stroke: d(),
      "stroke-width": m,
      class: [
        "lucide-icon lucide",
        s.name && `lucide-${s.name}`,
        s.class
      ]
    }),
    [
      () => r() ? Number(p()) * 24 / Number(o()) : p()
    ]
  );
  var b = e.child(u);
  e.each(b, 17, i, e.index, (m, J) => {
    var M = e.derived(() => e.to_array(e.get(J), 2));
    let H = () => e.get(M)[0], K = () => e.get(M)[1];
    var G = e.comment(), L = e.first_child(G);
    e.element(L, H, !0, (D, P) => {
      e.attribute_effect(D, () => ({ ...K() }));
    }), e.append(m, G);
  });
  var w = e.sibling(b);
  e.snippet(w, () => s.children ?? e.noop), e.reset(u), e.append(c, u), e.pop();
}
function ve(c, s) {
  e.push(s, !0);
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
  let d = e.rest_props(s, ["$$slots", "$$events", "$$legacy"]);
  const o = [
    [
      "path",
      {
        d: "M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"
      }
    ],
    ["circle", { cx: "12", cy: "10", r: "3" }]
  ];
  se(c, e.spread_props({ name: "map-pin" }, () => d, {
    get iconNode() {
      return o;
    },
    children: (p, r) => {
      var i = e.comment(), v = e.first_child(i);
      e.snippet(v, () => s.children ?? e.noop), e.append(p, i);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function ge(c, s) {
  e.push(s, !0);
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
  let d = e.rest_props(s, ["$$slots", "$$events", "$$legacy"]);
  const o = [
    ["path", { d: "m21 21-4.34-4.34" }],
    ["circle", { cx: "11", cy: "11", r: "8" }]
  ];
  se(c, e.spread_props({ name: "search" }, () => d, {
    get iconNode() {
      return o;
    },
    children: (p, r) => {
      var i = e.comment(), v = e.first_child(i);
      e.snippet(v, () => s.children ?? e.noop), e.append(p, i);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
var ue = e.from_html('<span class="loading loading-spinner loading-xs"></span>'), _e = e.from_html('<div class="bg-base-300 rounded p-2 text-xs font-mono"><div class="flex justify-between"><span class="font-medium"> </span> <span class="text-base-content/60"> </span></div></div>'), fe = e.from_html('<div class="mt-4"><p class="text-sm font-medium mb-2"> </p> <div class="space-y-2 max-h-64 overflow-y-auto"></div></div>'), be = e.from_html('<div class="card bg-base-200 max-w-xl"><div class="card-body"><h2 class="card-title text-base">Find Records Near a Point</h2> <div class="grid grid-cols-2 gap-3"><div class="form-control col-span-2"><label class="label" for="near-collection"><span class="label-text">Collection</span></label> <input id="near-collection" type="text" placeholder="locations" class="input input-sm"/></div> <div class="form-control col-span-2"><label class="label" for="near-location-field"><span class="label-text">Location field</span></label> <input id="near-location-field" type="text" class="input input-sm"/></div> <div class="form-control"><label class="label" for="near-lat"><span class="label-text">Latitude</span></label> <input id="near-lat" type="number" step="0.000001" class="input input-sm"/></div> <div class="form-control"><label class="label" for="near-lng"><span class="label-text">Longitude</span></label> <input id="near-lng" type="number" step="0.000001" class="input input-sm"/></div> <div class="form-control col-span-2"><label class="label" for="near-radius"><span class="label-text">Radius (meters)</span></label> <input id="near-radius" type="number" class="input input-sm"/></div></div> <button class="btn btn-primary btn-sm gap-2 mt-2"><!> Search</button> <!></div></div>'), me = e.from_html('<span class="loading loading-spinner loading-xs"></span>'), he = e.from_html('<div class="flex justify-center py-6"><span class="loading loading-spinner"></span></div>'), xe = e.from_html('<p class="text-base-content/40 text-center py-4">No geofences yet</p>'), ye = e.from_html('<p class="text-xs text-base-content/50"> </p>'), we = e.from_html('<div class="card bg-base-200"><div class="card-body p-3"><div class="flex items-center justify-between"><div><h3 class="font-semibold text-sm"> </h3> <!> <p class="text-xs text-base-content/40 mt-0.5"> </p></div> <button class="btn btn-ghost btn-xs text-error">Delete</button></div></div></div>'), Ne = e.from_html('<div class="grid grid-cols-1 gap-4 max-w-2xl"><div class="card bg-base-200"><div class="card-body"><h2 class="card-title text-base">New Geofence</h2> <div class="form-control"><label class="label" for="geofence-name"><span class="label-text">Name</span></label> <input id="geofence-name" type="text" placeholder="City Center Zone" class="input input-sm"/></div> <div class="form-control"><label class="label" for="geofence-coordinates"><span class="label-text">Coordinates (GeoJSON polygon array)</span></label> <textarea id="geofence-coordinates" placeholder="[[[lng1,lat1],[lng2,lat2],[lng3,lat3],[lng1,lat1]]]" class="textarea textarea-sm font-mono text-xs" rows="4"></textarea></div> <button class="btn btn-primary btn-sm gap-2"><!> Create Geofence</button></div></div> <!></div>'), ke = e.from_html('<div class="card bg-base-200 max-w-xl"><div class="card-body"><h2 class="card-title text-base">Point Clustering (DBSCAN)</h2> <p class="text-sm text-base-content/60">Use the API endpoint <code class="font-mono">POST /api/geo/cluster</code> with parameters:</p> <pre class="bg-base-300 rounded p-3 text-xs font-mono mt-2"></pre> <p class="text-sm text-base-content/60 mt-2">Returns clusters with centroid coordinates and point counts.</p></div></div>'), Se = e.from_html('<div class="space-y-6"><div><h1 class="text-2xl font-bold">Geospatial</h1> <p class="text-base-content/60 text-sm mt-1">PostGIS-powered proximity search and geofencing</p></div> <div class="tabs tabs-boxed w-fit"><button>Proximity Search</button> <button> </button> <button>Clustering</button></div> <!></div>');
function Ce(c, s) {
  e.push(s, !0);
  const d = window.__ZVELTIO_ENGINE_URL__ || "";
  let o = e.state(e.proxy([])), p = e.state(!0), r = e.state("proximity"), i = e.proxy({
    collection: "",
    location_field: "location",
    lat: 0,
    lng: 0,
    radius_meters: 1e3
  }), v = e.state(e.proxy([])), u = e.state(!1), b = e.state(""), w = e.state(""), m = e.state(!1);
  ce(async () => {
    await J();
  });
  async function J() {
    e.set(p, !0);
    try {
      const n = await (await fetch(`${d}/api/geo/geofences`, { credentials: "include" })).json();
      e.set(o, n.geofences || [], !0);
    } finally {
      e.set(p, !1);
    }
  }
  async function M() {
    if (i.collection) {
      e.set(u, !0);
      try {
        const n = await (await fetch(`${d}/api/geo/near`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(i)
        })).json();
        e.set(v, n.records || [], !0);
      } finally {
        e.set(u, !1);
      }
    }
  }
  async function H() {
    if (!(!e.get(b) || !e.get(w))) {
      e.set(m, !0);
      try {
        const l = JSON.parse(e.get(w));
        await fetch(`${d}/api/geo/geofences`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: e.get(b), coordinates: l })
        }), e.set(b, ""), e.set(w, ""), await J();
      } catch {
        alert("Invalid coordinates JSON");
      } finally {
        e.set(m, !1);
      }
    }
  }
  async function K(l) {
    confirm("Delete this geofence?") && (await fetch(`${d}/api/geo/geofences/${l}`, { method: "DELETE", credentials: "include" }), await J());
  }
  var G = Se(), L = e.sibling(e.child(G), 2), D = e.child(L), P = e.sibling(D, 2), ie = e.child(P);
  e.reset(P);
  var ae = e.sibling(P, 2);
  e.reset(L);
  var le = e.sibling(L, 2);
  {
    var ne = (l) => {
      var n = be(), _ = e.child(n), h = e.sibling(e.child(_), 2), N = e.child(h), E = e.sibling(e.child(N), 2);
      e.remove_input_defaults(E), e.reset(N);
      var k = e.sibling(N, 2), I = e.sibling(e.child(k), 2);
      e.remove_input_defaults(I), e.reset(k);
      var x = e.sibling(k, 2), $ = e.sibling(e.child(x), 2);
      e.remove_input_defaults($), e.reset(x);
      var R = e.sibling(x, 2), A = e.sibling(e.child(R), 2);
      e.remove_input_defaults(A), e.reset(R);
      var U = e.sibling(R, 2), B = e.sibling(e.child(U), 2);
      e.remove_input_defaults(B), e.reset(U), e.reset(h);
      var S = e.sibling(h, 2), Q = e.child(S);
      {
        var a = (t) => {
          var f = ue();
          e.append(t, f);
        }, g = (t) => {
          ge(t, { size: 14 });
        };
        e.if(Q, (t) => {
          e.get(u) ? t(a) : t(g, -1);
        });
      }
      e.next(), e.reset(S);
      var X = e.sibling(S, 2);
      {
        var Y = (t) => {
          var f = fe(), O = e.child(f), F = e.child(O);
          e.reset(O);
          var j = e.sibling(O, 2);
          e.each(j, 21, () => e.get(v), e.index, (W, Z) => {
            var T = _e(), V = e.child(T), z = e.child(V), ee = e.child(z);
            e.reset(z);
            var q = e.sibling(z, 2), C = e.child(q);
            e.reset(q), e.reset(V), e.reset(T), e.template_effect(
              (y, te) => {
                e.set_text(ee, `${y ?? ""}...`), e.set_text(C, `${te ?? ""}m away`);
              },
              [
                () => {
                  var y;
                  return (y = e.get(Z).id) == null ? void 0 : y.slice(0, 8);
                },
                () => Math.round(e.get(Z).distance_meters)
              ]
            ), e.append(W, T);
          }), e.reset(j), e.reset(f), e.template_effect(() => e.set_text(F, `${e.get(v).length ?? ""} results`)), e.append(t, f);
        };
        e.if(X, (t) => {
          e.get(v).length > 0 && t(Y);
        });
      }
      e.reset(_), e.reset(n), e.template_effect(() => S.disabled = e.get(u)), e.bind_value(E, () => i.collection, (t) => i.collection = t), e.bind_value(I, () => i.location_field, (t) => i.location_field = t), e.bind_value($, () => i.lat, (t) => i.lat = t), e.bind_value(A, () => i.lng, (t) => i.lng = t), e.bind_value(B, () => i.radius_meters, (t) => i.radius_meters = t), e.delegated("click", S, M), e.append(l, n);
    }, re = (l) => {
      var n = Ne(), _ = e.child(n), h = e.child(_), N = e.sibling(e.child(h), 2), E = e.sibling(e.child(N), 2);
      e.remove_input_defaults(E), e.reset(N);
      var k = e.sibling(N, 2), I = e.sibling(e.child(k), 2);
      e.remove_textarea_child(I), e.reset(k);
      var x = e.sibling(k, 2), $ = e.child(x);
      {
        var R = (a) => {
          var g = me();
          e.append(a, g);
        }, A = (a) => {
          ve(a, { size: 14 });
        };
        e.if($, (a) => {
          e.get(m) ? a(R) : a(A, -1);
        });
      }
      e.next(), e.reset(x), e.reset(h), e.reset(_);
      var U = e.sibling(_, 2);
      {
        var B = (a) => {
          var g = he();
          e.append(a, g);
        }, S = (a) => {
          var g = xe();
          e.append(a, g);
        }, Q = (a) => {
          var g = e.comment(), X = e.first_child(g);
          e.each(X, 17, () => e.get(o), e.index, (Y, t) => {
            var f = we(), O = e.child(f), F = e.child(O), j = e.child(F), W = e.child(j), Z = e.child(W, !0);
            e.reset(W);
            var T = e.sibling(W, 2);
            {
              var V = (C) => {
                var y = ye(), te = e.child(y, !0);
                e.reset(y), e.template_effect(() => e.set_text(te, e.get(t).description)), e.append(C, y);
              };
              e.if(T, (C) => {
                e.get(t).description && C(V);
              });
            }
            var z = e.sibling(T, 2), ee = e.child(z, !0);
            e.reset(z), e.reset(j);
            var q = e.sibling(j, 2);
            e.reset(F), e.reset(O), e.reset(f), e.template_effect(
              (C) => {
                e.set_text(Z, e.get(t).name), e.set_text(ee, C);
              },
              [() => new Date(e.get(t).created_at).toLocaleDateString()]
            ), e.delegated("click", q, () => K(e.get(t).id)), e.append(Y, f);
          }), e.append(a, g);
        };
        e.if(U, (a) => {
          e.get(p) ? a(B) : e.get(o).length === 0 ? a(S, 1) : a(Q, -1);
        });
      }
      e.reset(n), e.template_effect(() => x.disabled = e.get(m)), e.bind_value(E, () => e.get(b), (a) => e.set(b, a)), e.bind_value(I, () => e.get(w), (a) => e.set(w, a)), e.delegated("click", x, H), e.append(l, n);
    }, oe = (l) => {
      var n = ke(), _ = e.child(n), h = e.sibling(e.child(_), 4);
      h.textContent = JSON.stringify(
        {
          collection: "your_collection",
          location_field: "location",
          eps_meters: 500,
          min_points: 3
        },
        null,
        2
      ), e.next(2), e.reset(_), e.reset(n), e.append(l, n);
    };
    e.if(le, (l) => {
      e.get(r) === "proximity" ? l(ne) : e.get(r) === "geofences" ? l(re, 1) : e.get(r) === "cluster" && l(oe, 2);
    });
  }
  e.reset(G), e.template_effect(() => {
    e.set_class(D, 1, `tab ${e.get(r) === "proximity" ? "tab-active" : ""}`), e.set_class(P, 1, `tab ${e.get(r) === "geofences" ? "tab-active" : ""}`), e.set_text(ie, `Geofences (${e.get(o).length ?? ""})`), e.set_class(ae, 1, `tab ${e.get(r) === "cluster" ? "tab-active" : ""}`);
  }), e.delegated("click", D, () => e.set(r, "proximity")), e.delegated("click", P, () => e.set(r, "geofences")), e.delegated("click", ae, () => e.set(r, "cluster")), e.append(c, G), e.pop();
}
e.delegate(["click"]);
function Ge() {
  const c = window.__zveltio;
  c && c.registerRoute({
    path: "geo",
    component: Ce,
    label: "Geospatial",
    icon: "MapPin",
    category: "geospatial"
  });
}
Ge();
export {
  Ge as default
};
