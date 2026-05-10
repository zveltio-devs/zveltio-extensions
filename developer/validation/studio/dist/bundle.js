import "svelte/internal/disclose-version";
import * as e from "svelte/internal/client";
import { onMount as Ie } from "svelte";
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
const Ge = {
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
var Ue = e.from_svg("<svg><!><!></svg>");
function E(v, a) {
  e.push(a, !0);
  const _ = e.prop(a, "color", 3, "currentColor"), d = e.prop(a, "size", 3, 24), c = e.prop(a, "strokeWidth", 3, 2), g = e.prop(a, "absoluteStrokeWidth", 3, !1), r = e.prop(a, "iconNode", 19, () => []), n = e.rest_props(a, [
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
  var h = Ue();
  e.attribute_effect(
    h,
    (b) => ({
      ...Ge,
      ...n,
      width: d(),
      height: d(),
      stroke: _(),
      "stroke-width": b,
      class: [
        "lucide-icon lucide",
        a.name && `lucide-${a.name}`,
        a.class
      ]
    }),
    [
      () => g() ? Number(c()) * 24 / Number(d()) : c()
    ]
  );
  var f = e.child(h);
  e.each(f, 17, r, e.index, (b, m) => {
    var x = e.derived(() => e.to_array(e.get(m), 2));
    let L = () => e.get(x)[0], F = () => e.get(x)[1];
    var q = e.comment(), I = e.first_child(q);
    e.element(I, L, !0, (G, U) => {
      e.attribute_effect(G, () => ({ ...F() }));
    }), e.append(b, q);
  });
  var i = e.sibling(f);
  e.snippet(i, () => a.children ?? e.noop), e.reset(h), e.append(v, h), e.pop();
}
function Ve(v, a) {
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
  let _ = e.rest_props(a, ["$$slots", "$$events", "$$legacy"]);
  const d = [["path", { d: "M5 12h14" }], ["path", { d: "M12 5v14" }]];
  E(v, e.spread_props({ name: "plus" }, () => _, {
    get iconNode() {
      return d;
    },
    children: (c, g) => {
      var r = e.comment(), n = e.first_child(r);
      e.snippet(n, () => a.children ?? e.noop), e.append(c, r);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function Be(v, a) {
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
  let _ = e.rest_props(a, ["$$slots", "$$events", "$$legacy"]);
  const d = [
    [
      "path",
      {
        d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"
      }
    ],
    ["path", { d: "m9 12 2 2 4-4" }]
  ];
  E(v, e.spread_props({ name: "shield-check" }, () => _, {
    get iconNode() {
      return d;
    },
    children: (c, g) => {
      var r = e.comment(), n = e.first_child(r);
      e.snippet(n, () => a.children ?? e.noop), e.append(c, r);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function He(v, a) {
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
  let _ = e.rest_props(a, ["$$slots", "$$events", "$$legacy"]);
  const d = [
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
  E(v, e.spread_props({ name: "sparkles" }, () => _, {
    get iconNode() {
      return d;
    },
    children: (c, g) => {
      var r = e.comment(), n = e.first_child(r);
      e.snippet(n, () => a.children ?? e.noop), e.append(c, r);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
function Xe(v, a) {
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
  let _ = e.rest_props(a, ["$$slots", "$$events", "$$legacy"]);
  const d = [
    ["path", { d: "M18 6 6 18" }],
    ["path", { d: "m6 6 12 12" }]
  ];
  E(v, e.spread_props({ name: "x" }, () => _, {
    get iconNode() {
      return d;
    },
    children: (c, g) => {
      var r = e.comment(), n = e.first_child(r);
      e.snippet(n, () => a.children ?? e.noop), e.append(c, r);
    },
    $$slots: { default: !0 }
  })), e.pop();
}
var Ke = e.from_html('<div class="alert alert-error"> </div>'), Qe = e.from_html("<option> </option>"), Ye = e.from_html('<tr><td colspan="6" class="text-center py-6 text-base-content/60">No validation rules.</td></tr>'), Ze = e.from_html('<tr><td><span class="badge badge-ghost badge-sm"> </span></td><td class="font-mono text-xs"> </td><td> </td><td class="max-w-xs truncate"> </td><td><span> </span></td><td><button class="btn btn-ghost btn-xs">Delete</button></td></tr>'), et = e.from_html("<option> </option>"), tt = e.from_html(`<div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><div class="bg-base-100 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"><div class="flex items-center justify-between mb-4"><h2 class="text-xl font-semibold">New validation rule</h2> <button class="btn btn-ghost btn-sm btn-square"><!></button></div> <div class="grid grid-cols-2 gap-3"><div><label class="label label-text">Collection</label> <select class="select select-bordered w-full"><option>—</option><!></select></div> <div><label class="label label-text">Field</label><input class="input input-bordered w-full font-mono"/></div> <div><label class="label label-text">Field type</label> <select class="select select-bordered w-full"><option>text</option><option>integer</option><option>number</option><option>email</option><option>date</option><option>uuid</option><option>boolean</option></select></div> <div><label class="label label-text">Rule type</label> <select class="select select-bordered w-full"><option>required</option><option>min</option><option>max</option><option>pattern (regex)</option><option>enum</option><option>custom</option></select></div> <div><label class="label label-text">Severity</label> <select class="select select-bordered w-full"><option>error (block)</option><option>warning (allow)</option></select></div></div> <div class="bg-base-200 rounded-lg p-3 mt-4"><div class="flex items-center gap-2 mb-2"><!> <span class="font-medium text-sm">AI-assisted</span></div> <div class="flex gap-2"><input class="input input-sm input-bordered flex-1" placeholder="e.g. 'Romanian CNP - 13 digits'"/> <button class="btn btn-primary btn-sm"> </button></div> <p class="text-xs text-base-content/60 mt-1">Requires the AI extension to be active.</p></div> <div class="mt-3"><label class="label label-text">Description</label><input class="input input-bordered w-full"/></div> <div><label class="label label-text">Config (JSON)</label><textarea class="textarea textarea-bordered w-full font-mono text-xs" rows="6"></textarea></div> <div class="flex justify-end gap-2 mt-4"><button class="btn btn-ghost">Cancel</button> <button class="btn btn-primary"> </button></div></div></div>`), at = e.from_html('<div class="p-6 space-y-4"><header class="flex items-center justify-between"><h1 class="text-2xl font-semibold flex items-center gap-2"><!> Data Validation Rules</h1> <button class="btn btn-primary btn-sm gap-2"><!> New rule</button></header> <!> <div class="flex gap-3"><select class="select select-sm select-bordered"><option>All collections</option><!></select></div> <div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Collection</th><th>Field</th><th>Rule type</th><th>Description</th><th>Severity</th><th></th></tr></thead><tbody><!></tbody></table></div></div> <!>', 1);
function it(v, a) {
  var me;
  e.push(a, !0);
  const _ = ((me = window.__zveltio) == null ? void 0 : me.engineUrl) ?? "";
  let d = e.state(e.proxy([])), c = e.state(e.proxy([])), g = e.state(""), r = e.state(""), n = e.state(!1), h = e.state(!1), f = e.state(!1), i = e.state(e.proxy({
    collection: "",
    field_name: "",
    field_type: "text",
    rule_type: "required",
    description: "",
    config: "{}",
    severity: "error"
  })), b = e.state("");
  async function m(t, l) {
    const o = await fetch(`${_}${t}`, { credentials: "include", ...l }), u = await o.json().catch(() => ({}));
    if (!o.ok) throw new Error(u.error || `HTTP ${o.status}`);
    return u;
  }
  async function x() {
    try {
      const t = new URLSearchParams();
      e.get(g) && t.set("collection", e.get(g));
      const l = await m(`/api/validation/rules?${t}`);
      e.set(d, l.data ?? [], !0);
    } catch (t) {
      e.set(r, t.message, !0);
    }
  }
  async function L() {
    try {
      const t = await m("/api/collections");
      e.set(c, t.collections ?? t.data ?? [], !0);
    } catch {
      e.set(c, [], !0);
    }
  }
  async function F() {
    e.set(h, !0), e.set(r, "");
    try {
      let t = {};
      try {
        t = JSON.parse(e.get(i).config);
      } catch {
        throw new Error("Invalid JSON in config");
      }
      await m("/api/validation/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...e.get(i), config: t })
      }), e.set(n, !1), e.set(
        i,
        {
          collection: "",
          field_name: "",
          field_type: "text",
          rule_type: "required",
          description: "",
          config: "{}",
          severity: "error"
        },
        !0
      ), e.set(b, ""), await x();
    } catch (t) {
      e.set(r, t.message, !0);
    } finally {
      e.set(h, !1);
    }
  }
  async function q() {
    if (!(!e.get(b).trim() || !e.get(i).field_name)) {
      e.set(f, !0), e.set(r, "");
      try {
        const t = await m("/api/validation/ai-generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            field_name: e.get(i).field_name,
            field_type: e.get(i).field_type,
            description: e.get(b)
          })
        }), l = t.data ?? t;
        e.get(i).rule_type = l.rule_type ?? e.get(i).rule_type, e.get(i).description = l.description ?? e.get(b), e.get(i).config = JSON.stringify(l.config ?? {}, null, 2);
      } catch (t) {
        e.set(r, t.message, !0);
      } finally {
        e.set(f, !1);
      }
    }
  }
  async function I(t) {
    if (confirm("Delete rule?"))
      try {
        await m(`/api/validation/rules/${t}`, { method: "DELETE" }), await x();
      } catch (l) {
        e.set(r, l.message, !0);
      }
  }
  e.user_effect(() => {
    e.get(g), x();
  }), Ie(() => {
    L(), x();
  });
  function G(t) {
    return t === "error" ? "badge-error" : "badge-warning";
  }
  var U = at(), V = e.first_child(U), B = e.child(V), H = e.child(B), Me = e.child(H);
  Be(Me, { class: "h-6 w-6" }), e.next(), e.reset(H);
  var X = e.sibling(H, 2), je = e.child(X);
  Ve(je, { class: "h-4 w-4" }), e.next(), e.reset(X), e.reset(B);
  var ge = e.sibling(B, 2);
  {
    var ze = (t) => {
      var l = Ke(), o = e.child(l, !0);
      e.reset(l), e.template_effect(() => e.set_text(o, e.get(r))), e.append(t, l);
    };
    e.if(ge, (t) => {
      e.get(r) && t(ze);
    });
  }
  var K = e.sibling(ge, 2), Q = e.child(K), Y = e.child(Q);
  Y.value = Y.__value = "";
  var Oe = e.sibling(Y);
  e.each(Oe, 17, () => e.get(c), (t) => t.name, (t, l) => {
    var o = Qe(), u = e.child(o, !0);
    e.reset(o);
    var p = {};
    e.template_effect(() => {
      e.set_text(u, e.get(l).display_name ?? e.get(l).name), p !== (p = e.get(l).name) && (o.value = (o.__value = e.get(l).name) ?? "");
    }), e.append(t, o);
  }), e.reset(Q), e.reset(K);
  var be = e.sibling(K, 2), he = e.child(be), fe = e.sibling(e.child(he)), Te = e.child(fe);
  {
    var Ae = (t) => {
      var l = Ye();
      e.append(t, l);
    }, qe = (t) => {
      var l = e.comment(), o = e.first_child(l);
      e.each(o, 17, () => e.get(d), (u) => u.id, (u, p) => {
        var R = Ze(), y = e.child(R), C = e.child(y), M = e.child(C, !0);
        e.reset(C), e.reset(y);
        var w = e.sibling(y), Z = e.child(w, !0);
        e.reset(w);
        var k = e.sibling(w), D = e.child(k, !0);
        e.reset(k);
        var N = e.sibling(k), j = e.child(N, !0);
        e.reset(N);
        var $ = e.sibling(N), S = e.child($), z = e.child(S, !0);
        e.reset(S), e.reset($);
        var P = e.sibling($), O = e.child(P);
        e.reset(P), e.reset(R), e.template_effect(
          (T) => {
            e.set_text(M, e.get(p).collection), e.set_text(Z, e.get(p).field_name ?? "—"), e.set_text(D, e.get(p).rule_type), e.set_text(j, e.get(p).description ?? "—"), e.set_class(S, 1, `badge ${T ?? ""} badge-sm`), e.set_text(z, e.get(p).severity);
          },
          [() => G(e.get(p).severity)]
        ), e.delegated("click", O, () => I(e.get(p).id)), e.append(u, R);
      }), e.append(t, l);
    };
    e.if(Te, (t) => {
      e.get(d).length === 0 ? t(Ae) : t(qe, -1);
    });
  }
  e.reset(fe), e.reset(he), e.reset(be), e.reset(V);
  var De = e.sibling(V, 2);
  {
    var Je = (t) => {
      var l = tt(), o = e.child(l), u = e.child(o), p = e.sibling(e.child(u), 2), R = e.child(p);
      Xe(R, { class: "h-4 w-4" }), e.reset(p), e.reset(u);
      var y = e.sibling(u, 2), C = e.child(y), M = e.sibling(e.child(C), 2), w = e.child(M);
      w.value = w.__value = "";
      var Z = e.sibling(w);
      e.each(Z, 17, () => e.get(c), (s) => s.name, (s, _e) => {
        var A = et(), Fe = e.child(A, !0);
        e.reset(A);
        var Re = {};
        e.template_effect(() => {
          e.set_text(Fe, e.get(_e).name), Re !== (Re = e.get(_e).name) && (A.value = (A.__value = e.get(_e).name) ?? "");
        }), e.append(s, A);
      }), e.reset(M), e.reset(C);
      var k = e.sibling(C, 2), D = e.sibling(e.child(k));
      e.remove_input_defaults(D), e.reset(k);
      var N = e.sibling(k, 2), j = e.sibling(e.child(N), 2), $ = e.child(j);
      $.value = $.__value = "text";
      var S = e.sibling($);
      S.value = S.__value = "integer";
      var z = e.sibling(S);
      z.value = z.__value = "number";
      var P = e.sibling(z);
      P.value = P.__value = "email";
      var O = e.sibling(P);
      O.value = O.__value = "date";
      var T = e.sibling(O);
      T.value = T.__value = "uuid";
      var xe = e.sibling(T);
      xe.value = xe.__value = "boolean", e.reset(j), e.reset(N);
      var ee = e.sibling(N, 2), te = e.sibling(e.child(ee), 2), ae = e.child(te);
      ae.value = ae.__value = "required";
      var ie = e.sibling(ae);
      ie.value = ie.__value = "min";
      var le = e.sibling(ie);
      le.value = le.__value = "max";
      var se = e.sibling(le);
      se.value = se.__value = "pattern";
      var re = e.sibling(se);
      re.value = re.__value = "enum";
      var ye = e.sibling(re);
      ye.value = ye.__value = "custom", e.reset(te), e.reset(ee);
      var we = e.sibling(ee, 2), ne = e.sibling(e.child(we), 2), oe = e.child(ne);
      oe.value = oe.__value = "error";
      var ke = e.sibling(oe);
      ke.value = ke.__value = "warning", e.reset(ne), e.reset(we), e.reset(y);
      var de = e.sibling(y, 2), ce = e.child(de), We = e.child(ce);
      He(We, { class: "h-4 w-4 text-primary" }), e.next(2), e.reset(ce);
      var Ne = e.sibling(ce, 2), ve = e.child(Ne);
      e.remove_input_defaults(ve);
      var J = e.sibling(ve, 2), Ee = e.child(J, !0);
      e.reset(J), e.reset(Ne), e.next(2), e.reset(de);
      var pe = e.sibling(de, 2), $e = e.sibling(e.child(pe));
      e.remove_input_defaults($e), e.reset(pe);
      var ue = e.sibling(pe, 2), Se = e.sibling(e.child(ue));
      e.remove_textarea_child(Se), e.reset(ue);
      var Ce = e.sibling(ue, 2), Pe = e.child(Ce), W = e.sibling(Pe, 2), Le = e.child(W, !0);
      e.reset(W), e.reset(Ce), e.reset(o), e.reset(l), e.template_effect(
        (s) => {
          J.disabled = s, e.set_text(Ee, e.get(f) ? "…" : "Generate"), W.disabled = e.get(h) || !e.get(i).collection || !e.get(i).field_name, e.set_text(Le, e.get(h) ? "Saving…" : "Create rule");
        },
        [
          () => e.get(f) || !e.get(b).trim() || !e.get(i).field_name
        ]
      ), e.delegated("click", l, (s) => s.target === s.currentTarget && e.set(n, !1)), e.delegated("click", p, () => e.set(n, !1)), e.bind_select_value(M, () => e.get(i).collection, (s) => e.get(i).collection = s), e.bind_value(D, () => e.get(i).field_name, (s) => e.get(i).field_name = s), e.bind_select_value(j, () => e.get(i).field_type, (s) => e.get(i).field_type = s), e.bind_select_value(te, () => e.get(i).rule_type, (s) => e.get(i).rule_type = s), e.bind_select_value(ne, () => e.get(i).severity, (s) => e.get(i).severity = s), e.bind_value(ve, () => e.get(b), (s) => e.set(b, s)), e.delegated("click", J, q), e.bind_value($e, () => e.get(i).description, (s) => e.get(i).description = s), e.bind_value(Se, () => e.get(i).config, (s) => e.get(i).config = s), e.delegated("click", Pe, () => e.set(n, !1)), e.delegated("click", W, F), e.append(t, l);
    };
    e.if(De, (t) => {
      e.get(n) && t(Je);
    });
  }
  e.delegated("click", X, () => e.set(n, !0)), e.bind_select_value(Q, () => e.get(g), (t) => e.set(g, t)), e.append(v, U), e.pop();
}
e.delegate(["click"]);
function lt() {
  const v = window.__zveltio;
  v && v.registerRoute({
    path: "validation",
    component: it,
    label: "Validation Rules",
    icon: "ShieldCheck",
    category: "developer"
  });
}
lt();
export {
  lt as default
};
