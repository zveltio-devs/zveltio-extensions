var He = Object.defineProperty;
var We = (y, d, p) => d in y ? He(y, d, { enumerable: !0, configurable: !0, writable: !0, value: p }) : y[d] = p;
var Ee = (y, d, p) => We(y, typeof d != "symbol" ? d + "" : d, p);
import "svelte/internal/disclose-version";
import * as e from "svelte/internal/client";
import { onMount as Fe } from "svelte";
const Pe = typeof window < "u" ? window.location.origin : "";
typeof window < "u" && (window.__ZVELTIO_ENGINE_URL__ = Pe);
class Ze {
  constructor(d) {
    Ee(this, "base");
    this.base = d;
  }
  async request(d, p, k) {
    const N = await fetch(`${this.base}${p}`, {
      method: d,
      credentials: "include",
      headers: k ? { "Content-Type": "application/json" } : {},
      body: k ? JSON.stringify(k) : void 0
    });
    if (!N.ok) {
      const X = await N.json().catch(() => ({ error: N.statusText }));
      throw new Error(X.error || `Request failed: ${N.status}`);
    }
    return N.json();
  }
  get(d) {
    return this.request("GET", d);
  }
  post(d, p) {
    return this.request("POST", d, p);
  }
  put(d, p) {
    return this.request("PUT", d, p);
  }
  patch(d, p) {
    return this.request("PATCH", d, p);
  }
  delete(d, p) {
    return this.request("DELETE", d, p);
  }
}
const ae = new Ze(Pe);
var Ke = e.from_html('<div class="flex justify-center py-16"><span class="loading loading-spinner loading-lg text-primary"></span></div>'), Qe = e.from_html('<div class="alert alert-error"><span> </span></div>'), Xe = e.from_html('<div class="flex flex-col items-center justify-center py-20 text-base-content/40 gap-3"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="opacity-20"><rect width="18" height="18" x="3" y="3" rx="2"></rect><path d="M3 9h18M9 21V9"></path></svg> <p class="text-lg font-semibold text-base-content/60">No forms yet</p> <p class="text-sm text-center max-w-sm">Create embeddable forms to collect data from your users.</p> <button class="btn btn-primary btn-sm mt-2">Create Form</button></div>'), Ye = e.from_html('<tr class="cursor-pointer hover"><td class="font-medium"> </td><td><code class="badge badge-outline badge-sm font-mono"> </code></td><td> </td><td> </td><td><input type="checkbox" class="toggle toggle-success toggle-sm"/></td><td><div class="flex gap-1"><button class="btn btn-ghost btn-xs">Responses</button> <button class="btn btn-error btn-xs btn-ghost">Delete</button></div></td></tr>'), et = e.from_html('<div class="card bg-base-100 shadow-sm border border-base-300"><div class="overflow-x-auto"><table class="table table-zebra"><thead><tr><th>Name</th><th>Slug</th><th>Fields</th><th>Submissions</th><th>Status</th><th>Actions</th></tr></thead><tbody></tbody></table></div></div>'), tt = e.from_html('<div class="space-y-6"><div class="flex items-center justify-between flex-wrap gap-4"><div><h1 class="text-2xl font-bold">Forms</h1> <p class="text-base-content/60 text-sm mt-0.5">Manage embeddable forms and their submissions</p></div> <button class="btn btn-primary btn-sm">+ Create Form</button></div> <!></div>');
function at(y, d) {
  e.push(d, !0);
  const p = (a) => {
    window.location.hash = a;
  };
  let k = e.state(e.proxy([])), N = e.state(!0), X = e.state(null), se = e.state(null);
  Fe(async () => {
    await D();
  });
  async function D() {
    e.set(N, !0);
    try {
      const a = await ae.get("/extensions/forms/forms");
      e.set(k, a.forms ?? [], !0);
    } catch (a) {
      e.set(X, a.message ?? "Failed to load forms", !0);
    } finally {
      e.set(N, !1);
    }
  }
  async function m(a) {
    e.set(se, a.id, !0);
    try {
      await ae.patch(`/extensions/forms/forms/${a.id}`, { active: !a.active }), a.active = !a.active, e.set(k, [...e.get(k)], !0);
    } catch (i) {
      alert("Failed to update form: " + (i.message ?? ""));
    } finally {
      e.set(se, null);
    }
  }
  async function H(a, i) {
    if (confirm(`Delete form "${i}"? This will also delete all submissions.`))
      try {
        await ae.delete(`/extensions/forms/forms/${a}`), e.set(k, e.get(k).filter((z) => z.id !== a), !0);
      } catch (z) {
        alert("Failed to delete form: " + (z.message ?? ""));
      }
  }
  function O(a) {
    try {
      const i = typeof a.fields == "string" ? JSON.parse(a.fields) : a.fields;
      return Array.isArray(i) ? i.length : 0;
    } catch {
      return 0;
    }
  }
  var R = tt(), S = e.child(R), u = e.sibling(e.child(S), 2);
  e.reset(S);
  var ie = e.sibling(S, 2);
  {
    var $ = (a) => {
      var i = Ke();
      e.append(a, i);
    }, Y = (a) => {
      var i = Qe(), z = e.child(i), ee = e.child(z, !0);
      e.reset(z), e.reset(i), e.template_effect(() => e.set_text(ee, e.get(X))), e.append(a, i);
    }, W = (a) => {
      var i = Xe(), z = e.sibling(e.child(i), 6);
      e.reset(i), e.delegated("click", z, () => p("/admin/forms/new")), e.append(a, i);
    }, le = (a) => {
      var i = et(), z = e.child(i), ee = e.child(z), ne = e.sibling(e.child(ee));
      e.each(ne, 21, () => e.get(k), e.index, (de, b) => {
        var x = Ye(), U = e.child(x), l = e.child(U, !0);
        e.reset(U);
        var r = e.sibling(U), j = e.child(r), F = e.child(j, !0);
        e.reset(j), e.reset(r);
        var I = e.sibling(r), B = e.child(I, !0);
        e.reset(I);
        var C = e.sibling(I), q = e.child(C, !0);
        e.reset(C);
        var J = e.sibling(C), E = e.child(J);
        e.remove_input_defaults(E), e.reset(J);
        var M = e.sibling(J), _ = e.child(M), P = e.child(_), Z = e.sibling(P, 2);
        e.reset(_), e.reset(M), e.reset(x), e.template_effect(
          (V) => {
            e.set_text(l, e.get(b).name), e.set_text(F, e.get(b).slug), e.set_text(B, V), e.set_text(q, e.get(b).submission_count ?? 0), e.set_checked(E, e.get(b).active), E.disabled = e.get(se) === e.get(b).id, e.set_attribute(E, "aria-label", e.get(b).active ? "Deactivate" : "Activate");
          },
          [() => O(e.get(b))]
        ), e.delegated("click", x, () => p(`/admin/forms/${e.get(b).id}`)), e.delegated("click", r, (V) => V.stopPropagation()), e.delegated("click", J, (V) => V.stopPropagation()), e.delegated("change", E, () => m(e.get(b))), e.delegated("click", M, (V) => V.stopPropagation()), e.delegated("click", P, () => p(`/admin/forms/${e.get(b).id}/responses`)), e.delegated("click", Z, () => H(e.get(b).id, e.get(b).name)), e.append(de, x);
      }), e.reset(ne), e.reset(ee), e.reset(z), e.reset(i), e.append(a, i);
    };
    e.if(ie, (a) => {
      e.get(N) ? a($) : e.get(X) ? a(Y, 1) : e.get(k).length === 0 ? a(W, 2) : a(le, -1);
    });
  }
  e.reset(R), e.delegated("click", u, () => p("/admin/forms/new")), e.append(y, R), e.pop();
}
e.delegate(["click", "change"]);
var st = e.from_html('<p class="loading svelte-nzqqqk">Loading…</p>'), lt = e.from_html('<p class="error svelte-nzqqqk"> </p>'), rt = e.from_html('<div class="palette-item svelte-nzqqqk" draggable="true" title="Double-click or drag to add"><span class="palette-icon svelte-nzqqqk"> </span> <span> </span></div>'), it = e.from_html("<option> </option>"), nt = e.from_html('<div class="canvas-empty svelte-nzqqqk">Drag fields here or double-click palette items to add</div>'), ot = e.from_html('<span class="required-star svelte-nzqqqk">*</span>'), dt = e.from_html('<input disabled="" class="svelte-nzqqqk"/>'), ct = e.from_html('<textarea disabled="" rows="2" class="svelte-nzqqqk"></textarea>'), vt = e.from_html("<option> </option>"), pt = e.from_html('<select disabled="" class="svelte-nzqqqk"></select>'), gt = e.from_html('<input type="checkbox" disabled="" class="svelte-nzqqqk"/>'), ut = e.from_html('<input type="date" disabled="" class="svelte-nzqqqk"/>'), _t = e.from_html('<div class="field-type-badge svelte-nzqqqk"> </div>'), ft = e.from_html('<div draggable="true" role="button" tabindex="0"><span class="field-drag-handle svelte-nzqqqk">⋮⋮</span> <div class="field-preview svelte-nzqqqk"><label class="svelte-nzqqqk"> <!></label> <!></div> <button class="remove-field svelte-nzqqqk" aria-label="Remove field">✕</button></div>'), ht = e.from_html('<!> <div class="canvas-drop-end svelte-nzqqqk">Drop here to add at end</div>', 1), mt = e.from_html('<label class="svelte-nzqqqk">Options (one per line) <textarea rows="5" class="svelte-nzqqqk"></textarea></label>'), bt = e.from_html('<div class="config-form svelte-nzqqqk"><label class="svelte-nzqqqk">Label <input type="text" class="svelte-nzqqqk"/></label> <label class="svelte-nzqqqk">Placeholder <input type="text" class="svelte-nzqqqk"/></label> <label class="checkbox-label svelte-nzqqqk"><input type="checkbox"/> Required</label> <!> <div class="field-type-info svelte-nzqqqk"><strong>Type:</strong> </div></div>'), qt = e.from_html('<p class="no-selection svelte-nzqqqk">Select a field to configure it.</p>'), xt = e.from_html('<div class="builder-layout svelte-nzqqqk"><aside class="palette svelte-nzqqqk"><h3 class="svelte-nzqqqk">Field Types</h3> <!></aside> <main class="canvas svelte-nzqqqk"><div class="form-meta svelte-nzqqqk"><input type="text" class="input-name svelte-nzqqqk" placeholder="Form name"/> <input type="text" class="input-slug svelte-nzqqqk" placeholder="slug (auto-generated)"/> <textarea class="input-desc svelte-nzqqqk" placeholder="Description (optional)" rows="2"></textarea> <div class="target-row svelte-nzqqqk"><label>Target collection:</label> <select class="svelte-nzqqqk"><option>None (submissions only)</option><!></select></div></div> <div class="fields-canvas svelte-nzqqqk"><!></div></main> <aside class="field-config svelte-nzqqqk"><h3 class="svelte-nzqqqk">Field Properties</h3> <!></aside></div>'), wt = e.from_html('<div class="builder-page svelte-nzqqqk"><div class="builder-header svelte-nzqqqk"><button class="btn-back svelte-nzqqqk">← Back</button> <h1 class="svelte-nzqqqk"> </h1> <div class="header-actions svelte-nzqqqk"><button class="btn-save svelte-nzqqqk">Save Draft</button> <button class="btn-publish svelte-nzqqqk">Publish</button></div></div> <!></div>');
function yt(y, d) {
  e.push(d, !0);
  const p = () => e.store_get(X, "$page", k), [k, N] = e.setup_stores(), X = {
    url: { pathname: window.location.pathname },
    params: Object.fromEntries(new URL(window.location.href).searchParams)
  }, se = (t) => {
    window.location.hash = t;
  }, D = [
    { type: "text", label: "Text", icon: "T" },
    { type: "textarea", label: "Textarea", icon: "¶" },
    { type: "email", label: "Email", icon: "@" },
    { type: "number", label: "Number", icon: "#" },
    { type: "select", label: "Select", icon: "▾" },
    { type: "multiselect", label: "Multi-select", icon: "☑" },
    { type: "checkbox", label: "Checkbox", icon: "✓" },
    { type: "date", label: "Date", icon: "📅" },
    { type: "file", label: "File Upload", icon: "↑" }
  ];
  let m = e.state(null), H = e.state(""), O = e.state(""), R = e.state(""), S = e.state(""), u = e.state(e.proxy([])), ie = e.state(e.proxy([])), $ = e.state(null), Y = e.state(!1), W = e.state(!1), le = e.state(null), a = e.state(null), i = e.derived(() => e.get(u).find((t) => t.id === e.get($)) ?? null);
  function z(t) {
    return t.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 60);
  }
  function ee(t) {
    const s = t.target.value;
    e.set(H, s, !0), e.get(
      m
      // Auto-generate only for new forms
    ) || e.set(O, z(s), !0);
  }
  function ne(t) {
    var n;
    const s = crypto.randomUUID();
    e.set(
      u,
      [
        ...e.get(u),
        {
          id: s,
          type: t,
          label: ((n = D.find((w) => w.type === t)) == null ? void 0 : n.label) ?? t,
          required: !1,
          placeholder: "",
          options: t === "select" || t === "multiselect" ? ["Option 1"] : void 0
        }
      ],
      !0
    ), e.set($, s, !0);
  }
  function de(t) {
    e.set(u, e.get(u).filter((s) => s.id !== t), !0), e.get($) === t && e.set($, null);
  }
  function b(t, s) {
    e.set(u, e.get(u).map((n) => n.id === t ? { ...n, ...s } : n), !0);
  }
  let x = e.state(null), U = e.state(null);
  function l(t) {
    e.set(x, t, !0), e.set(U, null);
  }
  function r(t) {
    e.set(U, t, !0), e.set(x, null);
  }
  function j(t, s) {
    t.preventDefault(), e.set(a, s, !0);
  }
  function F(t, s) {
    var n;
    if (t.preventDefault(), e.set(a, null), e.get(x) !== null) {
      const w = crypto.randomUUID(), te = {
        id: w,
        type: e.get(x),
        label: ((n = D.find((re) => re.type === e.get(x))) == null ? void 0 : n.label) ?? e.get(x),
        required: !1,
        placeholder: "",
        options: e.get(x) === "select" || e.get(x) === "multiselect" ? ["Option 1"] : void 0
      }, K = [...e.get(u)];
      K.splice(s, 0, te), e.set(u, K, !0), e.set($, w, !0), e.set(x, null);
    } else if (e.get(U) !== null && e.get(U) !== s) {
      const w = [...e.get(u)], [te] = w.splice(e.get(U), 1);
      w.splice(s, 0, te), e.set(u, w, !0), e.set(U, null);
    }
  }
  function I() {
    e.set(a, null);
  }
  async function B(t = !1) {
    var s;
    if (!e.get(H).trim()) return alert("Form name is required");
    if (!e.get(O).trim()) return alert("Slug is required");
    e.set(W, !0);
    try {
      const n = {
        name: e.get(H),
        slug: e.get(O),
        description: e.get(R) || void 0,
        fields: e.get(u),
        target_collection: e.get(S) || void 0,
        active: t
      };
      if (e.get(m))
        await ae.patch(`/extensions/forms/forms/${e.get(m)}`, n);
      else {
        const w = await ae.post("/extensions/forms/forms", n);
        e.set(m, (s = w.form) == null ? void 0 : s.id, !0);
      }
      se("/admin/forms");
    } catch (n) {
      alert("Save failed: " + (n.message ?? ""));
    } finally {
      e.set(W, !1);
    }
  }
  Fe(async () => {
    const t = p().params.id;
    if (t && t !== "new") {
      e.set(m, t, !0), e.set(Y, !0);
      try {
        const n = (await ae.get(`/extensions/forms/forms/${t}`)).form;
        e.set(H, n.name, !0), e.set(O, n.slug, !0), e.set(R, n.description ?? "", !0), e.set(S, n.target_collection ?? "", !0), e.set(u, typeof n.fields == "string" ? JSON.parse(n.fields) : n.fields ?? [], !0);
      } catch (s) {
        e.set(le, s.message ?? "Failed to load form", !0);
      } finally {
        e.set(Y, !1);
      }
    }
    try {
      const s = await ae.get("/api/collections");
      e.set(ie, (s.collections ?? []).map((n) => n.name), !0);
    } catch {
    }
  });
  var C = wt(), q = e.child(C), J = e.child(q), E = e.sibling(J, 2), M = e.child(E, !0);
  e.reset(E);
  var _ = e.sibling(E, 2), P = e.child(_), Z = e.sibling(P, 2);
  e.reset(_), e.reset(q);
  var V = e.sibling(q, 2);
  {
    var he = (t) => {
      var s = st();
      e.append(t, s);
    }, ce = (t) => {
      var s = lt(), n = e.child(s, !0);
      e.reset(s), e.template_effect(() => e.set_text(n, e.get(le))), e.append(t, s);
    }, xe = (t) => {
      var s = xt(), n = e.child(s), w = e.sibling(e.child(n), 2);
      e.each(w, 17, () => D, e.index, (c, f) => {
        var g = rt(), A = e.child(g), L = e.child(A, !0);
        e.reset(A);
        var v = e.sibling(A, 2), Q = e.child(v, !0);
        e.reset(v), e.reset(g), e.template_effect(() => {
          e.set_text(L, e.get(f).icon), e.set_text(Q, e.get(f).label);
        }), e.event("dragstart", g, () => l(e.get(f).type)), e.delegated("dblclick", g, () => ne(e.get(f).type)), e.append(c, g);
      }), e.reset(n);
      var te = e.sibling(n, 2), K = e.child(te), re = e.child(K);
      e.remove_input_defaults(re);
      var ve = e.sibling(re, 2);
      e.remove_input_defaults(ve);
      var we = e.sibling(ve, 2);
      e.remove_textarea_child(we);
      var De = e.sibling(we, 2), ye = e.sibling(e.child(De), 2), ke = e.child(ye);
      ke.value = ke.__value = "";
      var Le = e.sibling(ke);
      e.each(Le, 17, () => e.get(ie), e.index, (c, f) => {
        var g = it(), A = e.child(g, !0);
        e.reset(g);
        var L = {};
        e.template_effect(() => {
          e.set_text(A, e.get(f)), L !== (L = e.get(f)) && (g.value = (g.__value = e.get(f)) ?? "");
        }), e.append(c, g);
      }), e.reset(ye), e.reset(De), e.reset(K);
      var me = e.sibling(K, 2), Ne = e.child(me);
      {
        var Re = (c) => {
          var f = nt();
          e.event("dragover", f, (g) => {
            g.preventDefault(), e.set(a, 0);
          }), e.event("drop", f, (g) => F(g, 0)), e.append(c, f);
        }, Te = (c) => {
          var f = ht(), g = e.first_child(f);
          e.each(g, 17, () => e.get(u), e.index, (L, v, Q) => {
            var T = ft();
            let pe;
            var ge = e.sibling(e.child(T), 2), oe = e.child(ge), be = e.child(oe), G = e.sibling(be);
            {
              var ue = (o) => {
                var h = ot();
                e.append(o, h);
              };
              e.if(G, (o) => {
                e.get(v).required && o(ue);
              });
            }
            e.reset(oe);
            var _e = e.sibling(oe, 2);
            {
              var fe = (o) => {
                var h = dt();
                e.template_effect(() => {
                  e.set_attribute(h, "type", e.get(v).type), e.set_attribute(h, "placeholder", e.get(v).placeholder);
                }), e.append(o, h);
              }, Ae = (o) => {
                var h = ct();
                e.template_effect(() => e.set_attribute(h, "placeholder", e.get(v).placeholder)), e.append(o, h);
              }, Ie = (o) => {
                var h = pt();
                e.each(h, 21, () => e.get(v).options ?? [], e.index, (ze, je) => {
                  var qe = vt(), Ge = e.child(qe, !0);
                  e.reset(qe);
                  var Ce = {};
                  e.template_effect(() => {
                    e.set_text(Ge, e.get(je)), Ce !== (Ce = e.get(je)) && (qe.__value = e.get(je));
                  }), e.append(ze, qe);
                }), e.reset(h), e.append(o, h);
              }, Be = (o) => {
                var h = gt();
                e.append(o, h);
              }, Je = (o) => {
                var h = ut();
                e.append(o, h);
              }, Me = (o) => {
                var h = _t(), ze = e.child(h, !0);
                e.reset(h), e.template_effect(() => e.set_text(ze, e.get(v).type)), e.append(o, h);
              };
              e.if(_e, (o) => {
                e.get(v).type === "text" || e.get(v).type === "email" || e.get(v).type === "number" ? o(fe) : e.get(v).type === "textarea" ? o(Ae, 1) : e.get(v).type === "select" ? o(Ie, 2) : e.get(v).type === "checkbox" ? o(Be, 3) : e.get(v).type === "date" ? o(Je, 4) : o(Me, -1);
              });
            }
            e.reset(ge);
            var Ve = e.sibling(ge, 2);
            e.reset(T), e.template_effect(() => {
              pe = e.set_class(T, 1, "canvas-field svelte-nzqqqk", null, pe, {
                selected: e.get($) === e.get(v).id,
                "drag-over": e.get(a) === Q
              }), e.set_text(be, `${e.get(v).label ?? ""} `);
            }), e.event("dragstart", T, () => r(Q)), e.event("dragover", T, (o) => j(o, Q)), e.event("drop", T, (o) => F(o, Q)), e.delegated("click", T, () => {
              e.set($, e.get(v).id, !0);
            }), e.delegated("keydown", T, (o) => o.key === "Enter" && e.set($, e.get(v).id, !0)), e.delegated("click", Ve, (o) => {
              o.stopPropagation(), de(e.get(v).id);
            }), e.append(L, T);
          });
          var A = e.sibling(g, 2);
          e.event("dragover", A, (L) => {
            L.preventDefault(), e.set(a, e.get(u).length, !0);
          }), e.event("drop", A, (L) => F(L, e.get(u).length)), e.append(c, f);
        };
        e.if(Ne, (c) => {
          e.get(u).length === 0 ? c(Re) : c(Te, -1);
        });
      }
      e.reset(me), e.reset(te);
      var Se = e.sibling(te, 2), Oe = e.sibling(e.child(Se), 2);
      {
        var $e = (c) => {
          var f = bt(), g = e.child(f), A = e.sibling(e.child(g));
          e.remove_input_defaults(A), e.reset(g);
          var L = e.sibling(g, 2), v = e.sibling(e.child(L));
          e.remove_input_defaults(v), e.reset(L);
          var Q = e.sibling(L, 2), T = e.child(Q);
          e.remove_input_defaults(T), e.next(), e.reset(Q);
          var pe = e.sibling(Q, 2);
          {
            var ge = (G) => {
              var ue = mt(), _e = e.sibling(e.child(ue));
              e.remove_textarea_child(_e), e.reset(ue), e.template_effect((fe) => e.set_value(_e, fe), [() => (e.get(i).options ?? []).join(`
`)]), e.delegated("input", _e, (fe) => b(e.get(i).id, { options: fe.target.value.split(`
`).filter(Boolean) })), e.append(G, ue);
            };
            e.if(pe, (G) => {
              (e.get(i).type === "select" || e.get(i).type === "multiselect") && G(ge);
            });
          }
          var oe = e.sibling(pe, 2), be = e.sibling(e.child(oe));
          e.reset(oe), e.reset(f), e.template_effect(() => {
            e.set_value(A, e.get(i).label), e.set_value(v, e.get(i).placeholder ?? ""), e.set_checked(T, e.get(i).required), e.set_text(be, ` ${e.get(i).type ?? ""}`);
          }), e.delegated("input", A, (G) => b(e.get(i).id, { label: G.target.value })), e.delegated("input", v, (G) => b(e.get(i).id, { placeholder: G.target.value })), e.delegated("change", T, (G) => b(e.get(i).id, { required: G.target.checked })), e.append(c, f);
        }, Ue = (c) => {
          var f = qt();
          e.append(c, f);
        };
        e.if(Oe, (c) => {
          e.get(i) ? c($e) : c(Ue, -1);
        });
      }
      e.reset(Se), e.reset(s), e.template_effect(() => e.set_value(re, e.get(H))), e.delegated("input", re, ee), e.bind_value(ve, () => e.get(O), (c) => e.set(O, c)), e.bind_value(we, () => e.get(R), (c) => e.set(R, c)), e.bind_select_value(ye, () => e.get(S), (c) => e.set(S, c)), e.event("dragover", me, (c) => c.preventDefault()), e.event("dragleave", me, I), e.append(t, s);
    };
    e.if(V, (t) => {
      e.get(Y) ? t(he) : e.get(le) ? t(ce, 1) : t(xe, -1);
    });
  }
  e.reset(C), e.template_effect(() => {
    e.set_text(M, e.get(m) ? "Edit Form" : "New Form"), P.disabled = e.get(W), Z.disabled = e.get(W);
  }), e.delegated("click", J, () => se("/admin/forms")), e.delegated("click", P, () => B(!1)), e.delegated("click", Z, () => B(!0)), e.append(y, C), e.pop(), N();
}
e.delegate(["click", "dblclick", "input", "keydown", "change"]);
var kt = e.from_html('<h1 class="svelte-1gwj1wp"> </h1>'), zt = e.from_html('<h1 class="svelte-1gwj1wp">Responses</h1>'), jt = e.from_html('<p class="loading svelte-1gwj1wp">Loading responses…</p>'), Ft = e.from_html('<p class="error svelte-1gwj1wp"> </p>'), Dt = e.from_html('<div class="empty-state svelte-1gwj1wp"><p>No submissions yet.</p></div>'), St = e.from_html('<th class="svelte-1gwj1wp"> </th>'), Ct = e.from_html('<td class="cell-value svelte-1gwj1wp"> </td>'), Et = e.from_html('<tr><td class="time svelte-1gwj1wp"> </td><!><td class="ip svelte-1gwj1wp"> </td><td class="svelte-1gwj1wp"><button class="btn-delete svelte-1gwj1wp"> </button></td></tr>'), Pt = e.from_html('<p class="count svelte-1gwj1wp"> </p> <div class="table-wrapper svelte-1gwj1wp"><table class="svelte-1gwj1wp"><thead><tr><th class="svelte-1gwj1wp">Submitted At</th><!><th class="svelte-1gwj1wp">IP</th><th class="svelte-1gwj1wp"></th></tr></thead><tbody></tbody></table></div>', 1), Lt = e.from_html('<div class="responses-page svelte-1gwj1wp"><div class="page-header svelte-1gwj1wp"><button class="btn-back svelte-1gwj1wp">← Back to Forms</button> <!> <button class="btn-export svelte-1gwj1wp">Export CSV</button></div> <!></div>');
function Nt(y, d) {
  e.push(d, !0);
  const p = () => e.store_get(X, "$page", k), [k, N] = e.setup_stores(), X = {
    url: { pathname: window.location.pathname },
    params: Object.fromEntries(new URL(window.location.href).searchParams)
  }, se = (l) => {
    window.location.hash = l;
  };
  let D = e.state(null), m = e.state(e.proxy([])), H = e.state(!0), O = e.state(null), R = e.state(null), S = e.derived(() => e.get(D) ? typeof e.get(D).fields == "string" ? JSON.parse(e.get(D).fields) : e.get(D).fields ?? [] : []);
  Fe(async () => {
    const l = p().params.id;
    try {
      const r = await ae.get(`/extensions/forms/forms/${l}/responses`);
      e.set(D, r.form, !0), e.set(m, r.submissions ?? [], !0);
    } catch (r) {
      e.set(O, r.message ?? "Failed to load responses", !0);
    } finally {
      e.set(H, !1);
    }
  });
  async function u(l) {
    if (confirm("Delete this submission?")) {
      e.set(R, l, !0);
      try {
        await ae.delete(`/extensions/forms/submissions/${l}`), e.set(m, e.get(m).filter((r) => r.id !== l), !0);
      } catch (r) {
        alert("Failed to delete: " + (r.message ?? ""));
      } finally {
        e.set(R, null);
      }
    }
  }
  function ie() {
    var C;
    if (!e.get(S).length || !e.get(m).length) return;
    const l = [
      "id",
      "created_at",
      ...e.get(S).map((q) => q.label ?? q.id)
    ], r = e.get(m).map((q) => {
      const J = typeof q.data == "string" ? JSON.parse(q.data) : q.data;
      return [
        q.id,
        q.created_at,
        ...e.get(S).map((E) => {
          const M = J[E.id] ?? "", _ = String(M);
          return _.includes(",") || _.includes('"') || _.includes(`
`) ? `"${_.replace(/"/g, '""')}"` : _;
        })
      ].join(",");
    }), j = [l.join(","), ...r].join(`
`), F = new Blob([j], { type: "text/csv" }), I = URL.createObjectURL(F), B = document.createElement("a");
    B.href = I, B.download = `${((C = e.get(D)) == null ? void 0 : C.slug) ?? "responses"}.csv`, B.click(), URL.revokeObjectURL(I);
  }
  function $(l, r) {
    const F = (typeof l.data == "string" ? JSON.parse(l.data) : l.data)[r];
    return F == null ? "—" : Array.isArray(F) ? F.join(", ") : String(F);
  }
  var Y = Lt(), W = e.child(Y), le = e.child(W), a = e.sibling(le, 2);
  {
    var i = (l) => {
      var r = kt(), j = e.child(r);
      e.reset(r), e.template_effect(() => e.set_text(j, `Responses: ${e.get(D).name ?? ""}`)), e.append(l, r);
    }, z = (l) => {
      var r = zt();
      e.append(l, r);
    };
    e.if(a, (l) => {
      e.get(D) ? l(i) : l(z, -1);
    });
  }
  var ee = e.sibling(a, 2);
  e.reset(W);
  var ne = e.sibling(W, 2);
  {
    var de = (l) => {
      var r = jt();
      e.append(l, r);
    }, b = (l) => {
      var r = Ft(), j = e.child(r, !0);
      e.reset(r), e.template_effect(() => e.set_text(j, e.get(O))), e.append(l, r);
    }, x = (l) => {
      var r = Dt();
      e.append(l, r);
    }, U = (l) => {
      var r = Pt(), j = e.first_child(r), F = e.child(j);
      e.reset(j);
      var I = e.sibling(j, 2), B = e.child(I), C = e.child(B), q = e.child(C), J = e.sibling(e.child(q));
      e.each(J, 17, () => e.get(S), e.index, (M, _) => {
        var P = St(), Z = e.child(P, !0);
        e.reset(P), e.template_effect(() => e.set_text(Z, e.get(_).label ?? e.get(_).id)), e.append(M, P);
      }), e.next(2), e.reset(q), e.reset(C);
      var E = e.sibling(C);
      e.each(E, 21, () => e.get(m), e.index, (M, _) => {
        var P = Et(), Z = e.child(P), V = e.child(Z, !0);
        e.reset(Z);
        var he = e.sibling(Z);
        e.each(he, 17, () => e.get(S), e.index, (w, te) => {
          var K = Ct(), re = e.child(K, !0);
          e.reset(K), e.template_effect((ve) => e.set_text(re, ve), [() => $(e.get(_), e.get(te).id)]), e.append(w, K);
        });
        var ce = e.sibling(he), xe = e.child(ce, !0);
        e.reset(ce);
        var t = e.sibling(ce), s = e.child(t), n = e.child(s, !0);
        e.reset(s), e.reset(t), e.reset(P), e.template_effect(
          (w) => {
            e.set_text(V, w), e.set_text(xe, e.get(_).ip_address ?? "—"), s.disabled = e.get(R) === e.get(_).id, e.set_text(n, e.get(R) === e.get(_).id ? "…" : "Delete");
          },
          [() => new Date(e.get(_).created_at).toLocaleString()]
        ), e.delegated("click", s, () => u(e.get(_).id)), e.append(M, P);
      }), e.reset(E), e.reset(B), e.reset(I), e.template_effect(() => e.set_text(F, `${e.get(m).length ?? ""} submission${e.get(m).length !== 1 ? "s" : ""}`)), e.append(l, r);
    };
    e.if(ne, (l) => {
      e.get(H) ? l(de) : e.get(O) ? l(b, 1) : e.get(m).length === 0 ? l(x, 2) : l(U, -1);
    });
  }
  e.reset(Y), e.template_effect(() => ee.disabled = !e.get(m).length), e.delegated("click", le, () => se("/admin/forms")), e.delegated("click", ee, ie), e.append(y, Y), e.pop(), N();
}
e.delegate(["click"]);
function Rt() {
  const y = window.__zveltio;
  y && y.registerRoute({
    path: "forms",
    component: at,
    label: "Forms",
    icon: "ClipboardList",
    category: "content",
    children: [
      {
        path: "forms/:id/builder",
        component: yt,
        label: "Form Builder",
        icon: "Wand2",
        category: "content"
      },
      {
        path: "forms/:id/responses",
        component: Nt,
        label: "Responses",
        icon: "BarChart2",
        category: "content"
      }
    ]
  });
}
Rt();
export {
  Rt as default
};
