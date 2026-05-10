import "svelte/internal/disclose-version";
import * as e from "svelte/internal/client";
import { onMount as ce } from "svelte";
var de = e.from_html('<div class="flex justify-center py-12"><span class="loading loading-spinner loading-lg"></span></div>'), oe = e.from_html('<div class="card bg-base-200 text-center py-12"><p class="text-base-content/60">No checklists found</p> <p class="text-sm text-base-content/40 mt-2">Checklists are attached to individual records from the data view</p></div>'), ve = e.from_html('<span class="badge badge-success badge-sm">completed</span>'), pe = e.from_html('<div class="card bg-base-200"><div class="card-body p-4"><div class="flex items-start justify-between"><div class="flex-1"><div class="flex items-center gap-2 mb-1"><h3 class="font-semibold"> </h3> <!></div> <p class="text-sm text-base-content/60"> <code class="font-mono"> </code></p> <div class="mt-2"><div class="flex items-center gap-2"><progress class="progress progress-primary flex-1" max="100"></progress> <span class="text-xs text-base-content/60 w-10 text-right"> </span></div> <p class="text-xs text-base-content/40 mt-1"> </p></div></div></div></div></div>'), be = e.from_html('<div class="space-y-3"></div>'), me = e.from_html('<div class="space-y-6"><div><h1 class="text-2xl font-bold">Checklists</h1> <p class="text-base-content/60 text-sm mt-1">Track checklist completion across records</p></div> <div class="tabs tabs-boxed w-fit"><button>All</button> <button>Active</button> <button>Completed</button></div> <!></div>');
function ge(P, te) {
  e.push(te, !0);
  const N = window.__ZVELTIO_ENGINE_URL__ || "";
  let q = e.state(e.proxy([])), L = e.state(!0), p = e.state("all");
  ce(async () => {
    await D();
  });
  async function D() {
    e.set(L, !0);
    try {
      const i = await fetch(`${N}/api/checklists/summary`, { credentials: "include" });
      if (i.ok) {
        const g = await i.json();
        e.set(q, g.checklists || [], !0);
      }
    } finally {
      e.set(L, !1);
    }
  }
  const T = e.derived(() => e.get(p) === "all" ? e.get(q) : e.get(p) === "completed" ? e.get(q).filter((i) => i.completed_at) : e.get(q).filter((i) => !i.completed_at));
  function S(i) {
    if (!i.items || i.items.length === 0) return 0;
    const g = i.items.filter((U) => U.checked).length;
    return Math.round(g / i.items.length * 100);
  }
  var c = me(), s = e.sibling(e.child(c), 2), I = e.child(s), M = e.sibling(I, 2), K = e.sibling(M, 2);
  e.reset(s);
  var ae = e.sibling(s, 2);
  {
    var le = (i) => {
      var g = de();
      e.append(i, g);
    }, se = (i) => {
      var g = oe();
      e.append(i, g);
    }, ie = (i) => {
      var g = be();
      e.each(g, 21, () => e.get(T), e.index, (U, _) => {
        var A = pe(), Q = e.child(A), W = e.child(Q), X = e.child(W), Z = e.child(X), z = e.child(Z), Y = e.child(z, !0);
        e.reset(z);
        var ne = e.sibling(z, 2);
        {
          var re = (d) => {
            var m = ve();
            e.append(d, m);
          };
          e.if(ne, (d) => {
            e.get(_).completed_at && d(re);
          });
        }
        e.reset(Z);
        var J = e.sibling(Z, 2), t = e.child(J), a = e.sibling(t), l = e.child(a);
        e.reset(a), e.reset(J);
        var n = e.sibling(J, 2), b = e.child(n), y = e.child(b), f = e.sibling(y, 2), k = e.child(f);
        e.reset(f), e.reset(b);
        var u = e.sibling(b, 2), w = e.child(u);
        e.reset(u), e.reset(n), e.reset(X), e.reset(W), e.reset(Q), e.reset(A), e.template_effect(
          (d, m, j, C) => {
            var h;
            e.set_text(Y, e.get(_).name), e.set_text(t, `${e.get(_).collection ?? ""} / `), e.set_text(l, `${d ?? ""}...`), e.set_value(y, m), e.set_text(k, `${j ?? ""}%`), e.set_text(w, `${C ?? ""} / ${((h = e.get(_).items) == null ? void 0 : h.length) ?? 0 ?? ""} items`);
          },
          [
            () => {
              var d;
              return (d = e.get(_).record_id) == null ? void 0 : d.slice(0, 8);
            },
            () => S(e.get(_)),
            () => S(e.get(_)),
            () => {
              var d;
              return ((d = e.get(_).items) == null ? void 0 : d.filter((m) => m.checked).length) ?? 0;
            }
          ]
        ), e.append(U, A);
      }), e.reset(g), e.append(i, g);
    };
    e.if(ae, (i) => {
      e.get(L) ? i(le) : e.get(T).length === 0 ? i(se, 1) : i(ie, -1);
    });
  }
  e.reset(c), e.template_effect(() => {
    e.set_class(I, 1, `tab ${e.get(p) === "all" ? "tab-active" : ""}`), e.set_class(M, 1, `tab ${e.get(p) === "active" ? "tab-active" : ""}`), e.set_class(K, 1, `tab ${e.get(p) === "completed" ? "tab-active" : ""}`);
  }), e.delegated("click", I, () => e.set(p, "all")), e.delegated("click", M, () => e.set(p, "active")), e.delegated("click", K, () => e.set(p, "completed")), e.append(P, c), e.pop();
}
e.delegate(["click"]);
var ue = e.from_html('<div class="flex justify-center py-12"><span class="loading loading-spinner loading-lg"></span></div>'), _e = e.from_html('<div class="card bg-base-200 text-center py-12"><p class="text-base-content/60">No templates yet</p> <button class="btn btn-primary btn-sm mt-4">Create Template</button></div>'), fe = e.from_html('<p class="text-sm text-base-content/60">Collection: <code> </code></p>'), he = e.from_html('<p class="text-sm text-base-content/40">Global template</p>'), xe = e.from_html('<p class="text-sm text-base-content/50 mt-1"> </p>'), ye = e.from_html('<div class="card bg-base-200"><div class="card-body p-4"><div class="flex items-start justify-between"><div><h3 class="font-semibold"> </h3> <!> <!></div> <div class="flex gap-1"><button class="btn btn-ghost btn-xs">Edit</button> <button class="btn btn-ghost btn-xs text-error">Delete</button></div></div></div></div>'), ke = e.from_html('<div class="space-y-3"></div>'), we = e.from_html('<button class="btn btn-ghost btn-xs text-error">✕</button>'), Te = e.from_html('<div class="flex gap-2 items-center"><input type="text" placeholder="Item label" class="input input-sm flex-1"/> <label class="label cursor-pointer gap-1"><span class="label-text text-xs">Required</span> <input type="checkbox" class="checkbox checkbox-xs"/></label> <!></div>'), Ce = e.from_html('<span class="loading loading-spinner loading-sm"></span>'), Ee = e.from_html('<dialog class="modal modal-open"><div class="modal-box w-11/12 max-w-xl"><h3 class="font-bold text-lg mb-4">Create Template</h3> <div class="space-y-3 mb-4"><div class="form-control"><label class="label" for="create-template-name"><span class="label-text">Template name</span></label> <input id="create-template-name" type="text" class="input"/></div> <div class="form-control"><label class="label" for="create-template-collection"><span class="label-text">Collection (optional)</span></label> <input id="create-template-collection" type="text" placeholder="Leave blank for global" class="input input-sm"/></div></div> <div class="mb-4"><div class="flex items-center justify-between mb-2"><label class="label-text font-medium">Items</label> <button class="btn btn-ghost btn-xs">+ Add item</button></div> <div class="space-y-2"></div></div> <div class="modal-action"><button class="btn btn-ghost">Cancel</button> <button class="btn btn-primary"><!> Create</button></div></div> <button class="modal-backdrop"></button></dialog>'), $e = e.from_html('<div class="flex gap-2 items-center"><input type="text" placeholder="Item label" class="input input-sm flex-1"/> <label class="label cursor-pointer gap-1"><span class="label-text text-xs">Required</span> <input type="checkbox" class="checkbox checkbox-xs"/></label> <button class="btn btn-ghost btn-xs text-error">✕</button></div>'), qe = e.from_html('<span class="loading loading-spinner loading-sm"></span>'), Ie = e.from_html('<dialog class="modal modal-open"><div class="modal-box w-11/12 max-w-xl"><h3 class="font-bold text-lg mb-4">Edit Template</h3> <div class="space-y-3 mb-4"><div class="form-control"><label class="label" for="edit-template-name"><span class="label-text">Template name</span></label> <input id="edit-template-name" type="text" class="input"/></div> <div class="form-control"><label class="label" for="edit-template-description"><span class="label-text">Description (optional)</span></label> <input id="edit-template-description" type="text" class="input input-sm"/></div> <div class="form-control"><label class="label" for="edit-template-collection"><span class="label-text">Collection (optional)</span></label> <input id="edit-template-collection" type="text" placeholder="Leave blank for global" class="input input-sm"/></div></div> <div class="mb-4"><div class="flex items-center justify-between mb-2"><label class="label-text font-medium">Items</label> <button class="btn btn-ghost btn-xs">+ Add item</button></div> <div class="space-y-2"></div></div> <div class="modal-action"><button class="btn btn-ghost">Cancel</button> <button class="btn btn-primary"><!> Save</button></div></div> <button class="modal-backdrop"></button></dialog>'), je = e.from_html('<div class="space-y-6"><div class="flex items-center justify-between"><div><h1 class="text-2xl font-bold">Checklist Templates</h1> <p class="text-base-content/60 text-sm mt-1">Reusable checklist definitions</p></div> <button class="btn btn-primary btn-sm">+ New Template</button></div> <!></div> <!> <!>', 1);
function Ne(P, te) {
  e.push(te, !0);
  const N = window.__ZVELTIO_ENGINE_URL__ || "";
  let q = e.state(e.proxy([])), L = e.state(!0), p = e.state(!1), D = e.state(!1), T = e.state(null), S = e.state(!1), c = e.state(e.proxy({
    name: "",
    description: "",
    collection: "",
    items: [{ label: "", required: !1, order_idx: 0 }]
  })), s = e.state(e.proxy({ name: "", description: "", collection: "", items: [] }));
  ce(async () => {
    await I();
  });
  async function I() {
    e.set(L, !0);
    try {
      const a = await (await fetch(`${N}/api/checklists/templates`, { credentials: "include" })).json();
      e.set(q, a.templates || [], !0);
    } finally {
      e.set(L, !1);
    }
  }
  function M() {
    e.get(c).items = [
      ...e.get(c).items,
      {
        label: "",
        required: !1,
        order_idx: e.get(c).items.length
      }
    ];
  }
  function K(t) {
    e.get(c).items = e.get(c).items.filter((a, l) => l !== t);
  }
  function ae() {
    e.get(s).items = [
      ...e.get(s).items,
      {
        label: "",
        required: !1,
        order_idx: e.get(s).items.length
      }
    ];
  }
  function le(t) {
    e.get(s).items = e.get(s).items.filter((a, l) => l !== t);
  }
  async function se(t) {
    const a = await fetch(`${N}/api/checklists/templates/${t.id}`, { credentials: "include" });
    if (!a.ok) return;
    const l = await a.json();
    e.set(T, l.template, !0), e.set(
      s,
      {
        name: l.template.name,
        description: l.template.description || "",
        collection: l.template.collection || "",
        items: (l.template.items || []).map((n) => ({
          label: n.label,
          required: n.required,
          order_idx: n.order_idx
        }))
      },
      !0
    );
  }
  async function ie() {
    if (!(!e.get(s).name || e.get(s).items.some((t) => !t.label))) {
      e.set(S, !0);
      try {
        if (!(await fetch(`${N}/api/checklists/templates/${e.get(T).id}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: e.get(s).name,
            description: e.get(s).description || void 0,
            collection: e.get(s).collection || null,
            items: e.get(s).items.map((a, l) => ({ ...a, order_idx: l }))
          })
        })).ok) throw new Error("Failed");
        e.set(T, null), await I();
      } finally {
        e.set(S, !1);
      }
    }
  }
  async function i() {
    if (!(!e.get(c).name || e.get(c).items.some((t) => !t.label))) {
      e.set(D, !0);
      try {
        if (!(await fetch(`${N}/api/checklists/templates`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...e.get(c),
            collection: e.get(c).collection || void 0
          })
        })).ok) throw new Error("Failed");
        e.set(p, !1), e.set(
          c,
          {
            name: "",
            description: "",
            collection: "",
            items: [{ label: "", required: !1, order_idx: 0 }]
          },
          !0
        ), await I();
      } finally {
        e.set(D, !1);
      }
    }
  }
  async function g(t) {
    confirm("Delete this template?") && (await fetch(`${N}/api/checklists/templates/${t}`, { method: "DELETE", credentials: "include" }), await I());
  }
  var U = je(), _ = e.first_child(U), A = e.child(_), Q = e.sibling(e.child(A), 2);
  e.reset(A);
  var W = e.sibling(A, 2);
  {
    var X = (t) => {
      var a = ue();
      e.append(t, a);
    }, Z = (t) => {
      var a = _e(), l = e.sibling(e.child(a), 2);
      e.reset(a), e.delegated("click", l, () => e.set(p, !0)), e.append(t, a);
    }, z = (t) => {
      var a = ke();
      e.each(a, 21, () => e.get(q), e.index, (l, n) => {
        var b = ye(), y = e.child(b), f = e.child(y), k = e.child(f), u = e.child(k), w = e.child(u, !0);
        e.reset(u);
        var d = e.sibling(u, 2);
        {
          var m = (r) => {
            var o = fe(), v = e.sibling(e.child(o)), x = e.child(v, !0);
            e.reset(v), e.reset(o), e.template_effect(() => e.set_text(x, e.get(n).collection)), e.append(r, o);
          }, j = (r) => {
            var o = he();
            e.append(r, o);
          };
          e.if(d, (r) => {
            e.get(n).collection ? r(m) : r(j, -1);
          });
        }
        var C = e.sibling(d, 2);
        {
          var h = (r) => {
            var o = xe(), v = e.child(o, !0);
            e.reset(o), e.template_effect(() => e.set_text(v, e.get(n).description)), e.append(r, o);
          };
          e.if(C, (r) => {
            e.get(n).description && r(h);
          });
        }
        e.reset(k);
        var R = e.sibling(k, 2), E = e.child(R), V = e.sibling(E, 2);
        e.reset(R), e.reset(f), e.reset(y), e.reset(b), e.template_effect(() => e.set_text(w, e.get(n).name)), e.delegated("click", E, () => se(e.get(n))), e.delegated("click", V, () => g(e.get(n).id)), e.append(l, b);
      }), e.reset(a), e.append(t, a);
    };
    e.if(W, (t) => {
      e.get(L) ? t(X) : e.get(q).length === 0 ? t(Z, 1) : t(z, -1);
    });
  }
  e.reset(_);
  var Y = e.sibling(_, 2);
  {
    var ne = (t) => {
      var a = Ee(), l = e.child(a), n = e.sibling(e.child(l), 2), b = e.child(n), y = e.sibling(e.child(b), 2);
      e.remove_input_defaults(y), e.reset(b);
      var f = e.sibling(b, 2), k = e.sibling(e.child(f), 2);
      e.remove_input_defaults(k), e.reset(f), e.reset(n);
      var u = e.sibling(n, 2), w = e.child(u), d = e.sibling(e.child(w), 2);
      e.reset(w);
      var m = e.sibling(w, 2);
      e.each(m, 21, () => e.get(c).items, e.index, (r, o, v) => {
        var x = Te(), H = e.child(x);
        e.remove_input_defaults(H);
        var O = e.sibling(H, 2), F = e.sibling(e.child(O), 2);
        e.remove_input_defaults(F), e.reset(O);
        var B = e.sibling(O, 2);
        {
          var ee = ($) => {
            var G = we();
            e.delegated("click", G, () => K(v)), e.append($, G);
          };
          e.if(B, ($) => {
            e.get(c).items.length > 1 && $(ee);
          });
        }
        e.reset(x), e.bind_value(H, () => e.get(o).label, ($) => e.get(o).label = $), e.bind_checked(F, () => e.get(o).required, ($) => e.get(o).required = $), e.append(r, x);
      }), e.reset(m), e.reset(u);
      var j = e.sibling(u, 2), C = e.child(j), h = e.sibling(C, 2), R = e.child(h);
      {
        var E = (r) => {
          var o = Ce();
          e.append(r, o);
        };
        e.if(R, (r) => {
          e.get(D) && r(E);
        });
      }
      e.next(), e.reset(h), e.reset(j), e.reset(l);
      var V = e.sibling(l, 2);
      e.reset(a), e.template_effect(() => h.disabled = e.get(D)), e.bind_value(y, () => e.get(c).name, (r) => e.get(c).name = r), e.bind_value(k, () => e.get(c).collection, (r) => e.get(c).collection = r), e.delegated("click", d, M), e.delegated("click", C, () => e.set(p, !1)), e.delegated("click", h, i), e.delegated("click", V, () => e.set(p, !1)), e.append(t, a);
    };
    e.if(Y, (t) => {
      e.get(p) && t(ne);
    });
  }
  var re = e.sibling(Y, 2);
  {
    var J = (t) => {
      var a = Ie(), l = e.child(a), n = e.sibling(e.child(l), 2), b = e.child(n), y = e.sibling(e.child(b), 2);
      e.remove_input_defaults(y), e.reset(b);
      var f = e.sibling(b, 2), k = e.sibling(e.child(f), 2);
      e.remove_input_defaults(k), e.reset(f);
      var u = e.sibling(f, 2), w = e.sibling(e.child(u), 2);
      e.remove_input_defaults(w), e.reset(u), e.reset(n);
      var d = e.sibling(n, 2), m = e.child(d), j = e.sibling(e.child(m), 2);
      e.reset(m);
      var C = e.sibling(m, 2);
      e.each(C, 21, () => e.get(s).items, e.index, (v, x, H) => {
        var O = $e(), F = e.child(O);
        e.remove_input_defaults(F);
        var B = e.sibling(F, 2), ee = e.sibling(e.child(B), 2);
        e.remove_input_defaults(ee), e.reset(B);
        var $ = e.sibling(B, 2);
        e.reset(O), e.bind_value(F, () => e.get(x).label, (G) => e.get(x).label = G), e.bind_checked(ee, () => e.get(x).required, (G) => e.get(x).required = G), e.delegated("click", $, () => le(H)), e.append(v, O);
      }), e.reset(C), e.reset(d);
      var h = e.sibling(d, 2), R = e.child(h), E = e.sibling(R, 2), V = e.child(E);
      {
        var r = (v) => {
          var x = qe();
          e.append(v, x);
        };
        e.if(V, (v) => {
          e.get(S) && v(r);
        });
      }
      e.next(), e.reset(E), e.reset(h), e.reset(l);
      var o = e.sibling(l, 2);
      e.reset(a), e.template_effect(() => E.disabled = e.get(S)), e.bind_value(y, () => e.get(s).name, (v) => e.get(s).name = v), e.bind_value(k, () => e.get(s).description, (v) => e.get(s).description = v), e.bind_value(w, () => e.get(s).collection, (v) => e.get(s).collection = v), e.delegated("click", j, ae), e.delegated("click", R, () => e.set(T, null)), e.delegated("click", E, ie), e.delegated("click", o, () => e.set(T, null)), e.append(t, a);
    };
    e.if(re, (t) => {
      e.get(T) && t(J);
    });
  }
  e.delegated("click", Q, () => e.set(p, !0)), e.append(P, U), e.pop();
}
e.delegate(["click"]);
function Le() {
  const P = window.__zveltio;
  if (!P) {
    console.error("Zveltio Studio API not available");
    return;
  }
  P.registerRoute({
    path: "checklists",
    component: ge,
    label: "Checklists",
    icon: "CheckSquare",
    category: "workflow",
    children: [
      {
        path: "checklists/templates",
        component: Ne,
        label: "Templates",
        icon: "LayoutTemplate",
        category: "workflow"
      }
    ]
  });
}
Le();
export {
  Le as default
};
