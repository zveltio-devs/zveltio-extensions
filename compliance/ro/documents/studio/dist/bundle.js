import "svelte/internal/disclose-version";
import * as t from "svelte/internal/client";
import { onMount as ot } from "svelte";
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
const dt = {
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
var ct = t.from_svg("<svg><!><!></svg>");
function G(d, e) {
  t.push(e, !0);
  const c = t.prop(e, "color", 3, "currentColor"), p = t.prop(e, "size", 3, 24), u = t.prop(e, "strokeWidth", 3, 2), m = t.prop(e, "absoluteStrokeWidth", 3, !1), s = t.prop(e, "iconNode", 19, () => []), n = t.rest_props(e, [
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
  var g = ct();
  t.attribute_effect(
    g,
    (f) => ({
      ...dt,
      ...n,
      width: p(),
      height: p(),
      stroke: c(),
      "stroke-width": f,
      class: [
        "lucide-icon lucide",
        e.name && `lucide-${e.name}`,
        e.class
      ]
    }),
    [
      () => m() ? Number(u()) * 24 / Number(p()) : u()
    ]
  );
  var k = t.child(g);
  t.each(k, 17, s, t.index, (f, Z) => {
    var R = t.derived(() => t.to_array(t.get(Z), 2));
    let q = () => t.get(R)[0], J = () => t.get(R)[1];
    var S = t.comment(), E = t.first_child(S);
    t.element(E, q, !0, (O, V) => {
      t.attribute_effect(O, () => ({ ...J() }));
    }), t.append(f, S);
  });
  var l = t.sibling(k);
  t.snippet(l, () => e.children ?? t.noop), t.reset(g), t.append(d, g), t.pop();
}
function pt(d, e) {
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
  let c = t.rest_props(e, ["$$slots", "$$events", "$$legacy"]);
  const p = [
    ["path", { d: "M21.801 10A10 10 0 1 1 17 3.335" }],
    ["path", { d: "m9 11 3 3L22 4" }]
  ];
  G(d, t.spread_props({ name: "circle-check-big" }, () => c, {
    get iconNode() {
      return p;
    },
    children: (u, m) => {
      var s = t.comment(), n = t.first_child(s);
      t.snippet(n, () => e.children ?? t.noop), t.append(u, s);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function ut(d, e) {
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
  let c = t.rest_props(e, ["$$slots", "$$events", "$$legacy"]);
  const p = [
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
  G(d, t.spread_props({ name: "file-text" }, () => c, {
    get iconNode() {
      return p;
    },
    children: (u, m) => {
      var s = t.comment(), n = t.first_child(s);
      t.snippet(n, () => e.children ?? t.noop), t.append(u, s);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function vt(d, e) {
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
  let c = t.rest_props(e, ["$$slots", "$$events", "$$legacy"]);
  const p = [["path", { d: "M5 12h14" }], ["path", { d: "M12 5v14" }]];
  G(d, t.spread_props({ name: "plus" }, () => c, {
    get iconNode() {
      return p;
    },
    children: (u, m) => {
      var s = t.comment(), n = t.first_child(s);
      t.snippet(n, () => e.children ?? t.noop), t.append(u, s);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function bt(d, e) {
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
  let c = t.rest_props(e, ["$$slots", "$$events", "$$legacy"]);
  const p = [
    ["path", { d: "M3 6h18" }],
    ["path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" }],
    ["path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" }],
    ["line", { x1: "10", x2: "10", y1: "11", y2: "17" }],
    ["line", { x1: "14", x2: "14", y1: "11", y2: "17" }]
  ];
  G(d, t.spread_props({ name: "trash-2" }, () => c, {
    get iconNode() {
      return p;
    },
    children: (u, m) => {
      var s = t.comment(), n = t.first_child(s);
      t.snippet(n, () => e.children ?? t.noop), t.append(u, s);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
var ht = t.from_html("<button> </button>"), _t = t.from_html('<div class="flex justify-center py-12"><span class="loading loading-spinner loading-lg"></span></div>'), gt = t.from_html('<div class="card bg-base-200 text-center py-12"><!> <p class="text-base-content/60">Nu există documente</p></div>'), mt = t.from_html('<button class="btn btn-ghost btn-xs gap-1"><!> Semnat</button> <button class="btn btn-ghost btn-xs text-error"><!></button>', 1), ft = t.from_html('<tr><td><span class="badge badge-outline badge-sm"> </span></td><td class="font-mono"> </td><td> </td><td> </td><td><span> </span></td><td><div class="flex gap-1"><!></div></td></tr>'), xt = t.from_html('<div class="card bg-base-200"><div class="overflow-x-auto"><table class="table table-sm"><thead><tr><th>Tip</th><th>Număr</th><th>Data</th><th>Titlu</th><th>Status</th><th></th></tr></thead><tbody></tbody></table></div></div>'), yt = t.from_html("<option> </option>"), wt = t.from_html('<div class="grid grid-cols-3 gap-2 mb-2"><input type="text" placeholder="Denumire" class="input input-xs"/> <input type="text" placeholder="CUI" class="input input-xs font-mono"/> <input type="text" placeholder="Rol" class="input input-xs"/></div>'), kt = t.from_html('<span class="loading loading-spinner loading-sm"></span>'), $t = t.from_html('<dialog class="modal modal-open"><div class="modal-box w-11/12 max-w-2xl"><h3 class="font-bold text-lg mb-4">Document nou</h3> <div class="grid grid-cols-2 gap-3 mb-4"><div class="form-control"><label class="label" for="doc-type"><span class="label-text">Tip document</span></label> <select id="doc-type" class="select select-sm"></select></div> <div class="form-control"><label class="label" for="doc-number"><span class="label-text">Număr</span></label> <input id="doc-number" type="text" placeholder="CT-2026-001" class="input input-sm font-mono"/></div> <div class="form-control"><label class="label" for="doc-date"><span class="label-text">Data</span></label> <input id="doc-date" type="date" class="input input-sm"/></div> <div class="form-control col-span-2"><label class="label" for="doc-title"><span class="label-text">Titlu</span></label> <input id="doc-title" type="text" placeholder="Contract prestari servicii IT" class="input input-sm"/></div></div> <div class="mb-4"><div class="flex justify-between mb-2"><label class="label-text font-medium">Parti implicate</label> <button class="btn btn-ghost btn-xs">+ Parte</button></div> <!></div> <div class="modal-action"><button class="btn btn-ghost">Anulare</button> <button class="btn btn-primary"><!> Creare</button></div></div> <button class="modal-backdrop"></button></dialog>'), Nt = t.from_html('<div class="space-y-6"><div class="flex items-center justify-between"><div><h1 class="text-2xl font-bold">Documente RO</h1> <p class="text-base-content/60 text-sm mt-1">Gestiune documente de conformitate</p></div> <button class="btn btn-primary btn-sm gap-2"><!> Document nou</button></div> <div class="flex flex-wrap gap-2"><button>Toate</button> <!></div> <!></div> <!>', 1);
function Dt(d, e) {
  t.push(e, !0);
  const c = window.__ZVELTIO_ENGINE_URL__ || "", p = [
    "contract",
    "pv",
    "nir",
    "dispozitie_plata",
    "proces_verbal",
    "notificare",
    "other"
  ], u = {
    contract: "Contract",
    pv: "Proces Verbal",
    nir: "NIR",
    dispozitie_plata: "Dispozitie Plata",
    proces_verbal: "Proces Verbal",
    notificare: "Notificare",
    other: "Altele"
  };
  let m = t.state(t.proxy([])), s = t.state(!0), n = t.state("all"), g = t.state(!1), k = t.state(!1), l = t.proxy({
    type: "contract",
    number: "",
    date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    title: "",
    parties: [{ name: "", cui: "", role: "client" }],
    content: ""
  });
  ot(() => f());
  async function f() {
    t.set(s, !0);
    try {
      const a = t.get(n) !== "all" ? `?type=${t.get(n)}` : "", o = await (await fetch(`${c}/api/ro-documents${a}`, { credentials: "include" })).json();
      t.set(m, o.documents || [], !0);
    } finally {
      t.set(s, !1);
    }
  }
  t.user_effect(() => {
    t.get(n) && f();
  });
  async function Z() {
    if (!(!l.title || !l.number)) {
      t.set(k, !0);
      try {
        if (!(await fetch(`${c}/api/ro-documents`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(l)
        })).ok) throw new Error("Failed");
        t.set(g, !1), await f();
      } finally {
        t.set(k, !1);
      }
    }
  }
  async function R(a) {
    confirm("Mark this document as signed?") && (await fetch(`${c}/api/ro-documents/${a}/sign`, { method: "PATCH", credentials: "include" }), await f());
  }
  async function q(a) {
    confirm("Delete this draft?") && (await fetch(`${c}/api/ro-documents/${a}`, { method: "DELETE", credentials: "include" }), await f());
  }
  function J(a) {
    return a === "signed" ? "badge-success" : a === "archived" ? "badge-ghost" : "badge-warning";
  }
  var S = Nt(), E = t.first_child(S), O = t.child(E), V = t.sibling(t.child(O), 2), tt = t.child(V);
  vt(tt, { size: 16 }), t.next(), t.reset(V), t.reset(O);
  var Y = t.sibling(O, 2), K = t.child(Y), et = t.sibling(K, 2);
  t.each(et, 17, () => p, t.index, (a, i) => {
    var o = ht(), x = t.child(o, !0);
    t.reset(o), t.template_effect(() => {
      t.set_class(o, 1, `btn btn-sm ${t.get(n) === t.get(i) ? "btn-primary" : "btn-ghost"}`), t.set_text(x, u[t.get(i)]);
    }), t.delegated("click", o, () => t.set(n, t.get(i), !0)), t.append(a, o);
  }), t.reset(Y);
  var at = t.sibling(Y, 2);
  {
    var it = (a) => {
      var i = _t();
      t.append(a, i);
    }, st = (a) => {
      var i = gt(), o = t.child(i);
      ut(o, { size: 48, class: "mx-auto text-base-content/20 mb-3" }), t.next(2), t.reset(i), t.append(a, i);
    }, nt = (a) => {
      var i = xt(), o = t.child(i), x = t.child(o), T = t.sibling(t.child(x));
      t.each(T, 21, () => t.get(m), t.index, (I, v) => {
        var M = ft(), $ = t.child(M), j = t.child($), W = t.child(j, !0);
        t.reset(j), t.reset($);
        var P = t.sibling($), A = t.child(P, !0);
        t.reset(P);
        var N = t.sibling(P), Q = t.child(N, !0);
        t.reset(N);
        var H = t.sibling(N), B = t.child(H, !0);
        t.reset(H);
        var C = t.sibling(H), y = t.child(C), X = t.child(y, !0);
        t.reset(y), t.reset(C);
        var F = t.sibling(C), U = t.child(F), r = t.child(U);
        {
          var b = (h) => {
            var w = mt(), _ = t.first_child(w), L = t.child(_);
            pt(L, { size: 12 }), t.next(), t.reset(_);
            var z = t.sibling(_, 2), D = t.child(z);
            bt(D, { size: 12 }), t.reset(z), t.delegated("click", _, () => R(t.get(v).id)), t.delegated("click", z, () => q(t.get(v).id)), t.append(h, w);
          };
          t.if(r, (h) => {
            t.get(v).status === "draft" && h(b);
          });
        }
        t.reset(U), t.reset(F), t.reset(M), t.template_effect(
          (h) => {
            t.set_text(W, u[t.get(v).type] || t.get(v).type), t.set_text(A, t.get(v).number), t.set_text(Q, t.get(v).date), t.set_text(B, t.get(v).title), t.set_class(y, 1, `badge badge-sm ${h ?? ""}`), t.set_text(X, t.get(v).status);
          },
          [() => J(t.get(v).status)]
        ), t.append(I, M);
      }), t.reset(T), t.reset(x), t.reset(o), t.reset(i), t.append(a, i);
    };
    t.if(at, (a) => {
      t.get(s) ? a(it) : t.get(m).length === 0 ? a(st, 1) : a(nt, -1);
    });
  }
  t.reset(E);
  var rt = t.sibling(E, 2);
  {
    var lt = (a) => {
      var i = $t(), o = t.child(i), x = t.sibling(t.child(o), 2), T = t.child(x), I = t.sibling(t.child(T), 2);
      t.each(I, 21, () => p, t.index, (r, b) => {
        var h = yt(), w = t.child(h, !0);
        t.reset(h);
        var _ = {};
        t.template_effect(() => {
          t.set_text(w, u[t.get(b)]), _ !== (_ = t.get(b)) && (h.value = (h.__value = t.get(b)) ?? "");
        }), t.append(r, h);
      }), t.reset(I), t.reset(T);
      var v = t.sibling(T, 2), M = t.sibling(t.child(v), 2);
      t.remove_input_defaults(M), t.reset(v);
      var $ = t.sibling(v, 2), j = t.sibling(t.child($), 2);
      t.remove_input_defaults(j), t.reset($);
      var W = t.sibling($, 2), P = t.sibling(t.child(W), 2);
      t.remove_input_defaults(P), t.reset(W), t.reset(x);
      var A = t.sibling(x, 2), N = t.child(A), Q = t.sibling(t.child(N), 2);
      t.reset(N);
      var H = t.sibling(N, 2);
      t.each(H, 17, () => l.parties, t.index, (r, b, h) => {
        var w = wt(), _ = t.child(w);
        t.remove_input_defaults(_);
        var L = t.sibling(_, 2);
        t.remove_input_defaults(L);
        var z = t.sibling(L, 2);
        t.remove_input_defaults(z), t.reset(w), t.bind_value(_, () => t.get(b).name, (D) => t.get(b).name = D), t.bind_value(L, () => t.get(b).cui, (D) => t.get(b).cui = D), t.bind_value(z, () => t.get(b).role, (D) => t.get(b).role = D), t.append(r, w);
      }), t.reset(A);
      var B = t.sibling(A, 2), C = t.child(B), y = t.sibling(C, 2), X = t.child(y);
      {
        var F = (r) => {
          var b = kt();
          t.append(r, b);
        };
        t.if(X, (r) => {
          t.get(k) && r(F);
        });
      }
      t.next(), t.reset(y), t.reset(B), t.reset(o);
      var U = t.sibling(o, 2);
      t.reset(i), t.template_effect(() => y.disabled = t.get(k)), t.bind_select_value(I, () => l.type, (r) => l.type = r), t.bind_value(M, () => l.number, (r) => l.number = r), t.bind_value(j, () => l.date, (r) => l.date = r), t.bind_value(P, () => l.title, (r) => l.title = r), t.delegated("click", Q, () => l.parties = [...l.parties, { name: "", cui: "", role: "beneficiar" }]), t.delegated("click", C, () => t.set(g, !1)), t.delegated("click", y, Z), t.delegated("click", U, () => t.set(g, !1)), t.append(a, i);
    };
    t.if(rt, (a) => {
      t.get(g) && a(lt);
    });
  }
  t.template_effect(() => t.set_class(K, 1, `btn btn-sm ${t.get(n) === "all" ? "btn-primary" : "btn-ghost"}`)), t.delegated("click", V, () => t.set(g, !0)), t.delegated("click", K, () => t.set(n, "all")), t.append(d, S), t.pop();
}
t.delegate(["click"]);
function Tt() {
  const d = window.__zveltio;
  d && d.registerRoute({
    path: "ro-documents",
    component: Dt,
    label: "Documente RO",
    icon: "FolderOpen",
    category: "compliance"
  });
}
Tt();
export {
  Tt as default
};
