var Ct = Object.defineProperty;
var St = (h, e, o) => e in h ? Ct(h, e, { enumerable: !0, configurable: !0, writable: !0, value: o }) : h[e] = o;
var $t = (h, e, o) => St(h, typeof e != "symbol" ? e + "" : e, o);
import "svelte/internal/disclose-version";
import * as t from "svelte/internal/client";
import { onMount as kt } from "svelte";
const Tt = typeof window < "u" ? window.location.origin : "";
typeof window < "u" && (window.__ZVELTIO_ENGINE_URL__ = Tt);
class zt {
  constructor(e) {
    $t(this, "base");
    this.base = e;
  }
  async request(e, o, b) {
    const l = await fetch(`${this.base}${o}`, {
      method: e,
      credentials: "include",
      headers: b ? { "Content-Type": "application/json" } : {},
      body: b ? JSON.stringify(b) : void 0
    });
    if (!l.ok) {
      const f = await l.json().catch(() => ({ error: l.statusText }));
      throw new Error(f.error || `Request failed: ${l.status}`);
    }
    return l.json();
  }
  get(e) {
    return this.request("GET", e);
  }
  post(e, o) {
    return this.request("POST", e, o);
  }
  put(e, o) {
    return this.request("PUT", e, o);
  }
  patch(e, o) {
    return this.request("PATCH", e, o);
  }
  delete(e, o) {
    return this.request("DELETE", e, o);
  }
}
const Z = new zt(Tt);
var Et = t.from_html('<div class="flex justify-center py-12"><span class="loading loading-spinner loading-lg"></span></div>'), jt = t.from_html('<tr><td class="font-medium"> </td><td> </td><td> </td><td> </td><td class="text-right space-x-2"><button class="btn btn-ghost btn-xs">Edit</button> <button class="btn btn-ghost btn-xs text-error">Delete</button></td></tr>'), Pt = t.from_html('<tr><td colspan="5" class="text-center text-base-content/40 py-8">No contacts found</td></tr>'), Mt = t.from_html('<div class="overflow-x-auto"><table class="table table-zebra w-full"><thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Company</th><th></th></tr></thead><tbody><!><!></tbody></table></div> <div class="flex justify-center gap-2 mt-4"><button class="btn btn-sm">Prev</button> <span class="btn btn-sm btn-disabled"> </span> <button class="btn btn-sm">Next</button></div>', 1), Ot = t.from_html('<div class="modal modal-open"><div class="modal-box"><h3 class="font-bold text-lg mb-4"> </h3> <div class="space-y-3"><div class="grid grid-cols-2 gap-3"><div class="form-control"><label class="label" for="contact-first-name"><span class="label-text">First Name *</span></label> <input id="contact-first-name" class="input input-bordered" required=""/></div> <div class="form-control"><label class="label" for="contact-last-name"><span class="label-text">Last Name</span></label> <input id="contact-last-name" class="input input-bordered"/></div></div> <div class="form-control"><label class="label" for="contact-email"><span class="label-text">Email</span></label> <input id="contact-email" type="email" class="input input-bordered"/></div> <div class="form-control"><label class="label" for="contact-phone"><span class="label-text">Phone</span></label> <input id="contact-phone" class="input input-bordered"/></div> <div class="grid grid-cols-2 gap-3"><div class="form-control"><label class="label" for="contact-company"><span class="label-text">Company</span></label> <input id="contact-company" class="input input-bordered"/></div> <div class="form-control"><label class="label" for="contact-job-title"><span class="label-text">Job Title</span></label> <input id="contact-job-title" class="input input-bordered"/></div></div></div> <div class="modal-action"><button class="btn">Cancel</button> <button class="btn btn-primary">Save</button></div></div> <button class="modal-backdrop" aria-label="Close"></button></div>'), Dt = t.from_html('<div class="space-y-6"><div class="flex items-center justify-between"><div><h1 class="text-2xl font-bold">Contacts</h1> <p class="text-base-content/60"> </p></div> <button class="btn btn-primary">+ New Contact</button></div> <div class="form-control w-full max-w-sm"><input type="search" placeholder="Search contacts..." class="input input-bordered"/></div> <!></div> <!>', 1);
function Rt(h, e) {
  t.push(e, !0);
  let o = t.state(t.proxy([])), b = t.state(0), l = t.state(1), f = t.state(""), g = t.state(!1), m = t.state(!1), _ = t.state(null), s = t.state(t.proxy({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    company: "",
    job_title: ""
  }));
  async function i() {
    t.set(g, !0);
    try {
      const n = new URLSearchParams({ page: String(t.get(l)), limit: "20" });
      t.get(f) && n.set("search", t.get(f));
      const w = await Z.get(`/contacts?${n}`);
      t.set(o, w.data, !0), t.set(b, w.meta.total, !0);
    } finally {
      t.set(g, !1);
    }
  }
  function B() {
    t.set(_, null), t.set(
      s,
      {
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        company: "",
        job_title: ""
      },
      !0
    ), t.set(m, !0);
  }
  function tt(n) {
    t.set(_, n, !0), t.set(
      s,
      {
        first_name: n.first_name ?? "",
        last_name: n.last_name ?? "",
        email: n.email ?? "",
        phone: n.phone ?? "",
        company: n.company ?? "",
        job_title: n.job_title ?? ""
      },
      !0
    ), t.set(m, !0);
  }
  async function et() {
    t.get(_) ? await Z.patch(`/contacts/${t.get(_).id}`, t.get(s)) : await Z.post("/contacts", t.get(s)), t.set(m, !1), await i();
  }
  async function D(n) {
    confirm("Delete this contact?") && (await Z.delete(`/contacts/${n}`), await i());
  }
  kt(i);
  var $ = Dt(), V = t.first_child($), Y = t.child(V), K = t.child(Y), lt = t.sibling(t.child(K), 2), ot = t.child(lt);
  t.reset(lt), t.reset(K);
  var nt = t.sibling(K, 2);
  t.reset(Y);
  var F = t.sibling(Y, 2), at = t.child(F);
  t.remove_input_defaults(at), t.reset(F);
  var dt = t.sibling(F, 2);
  {
    var ut = (n) => {
      var w = Et();
      t.append(n, w);
    }, bt = (n) => {
      var w = Mt(), T = t.first_child(w), R = t.child(T), W = t.sibling(t.child(R)), L = t.child(W);
      t.each(L, 17, () => t.get(o), t.index, (d, u) => {
        var k = jt(), C = t.child(k), z = t.child(C);
        t.reset(C);
        var E = t.sibling(C), j = t.child(E, !0);
        t.reset(E);
        var N = t.sibling(E), M = t.child(N, !0);
        t.reset(N);
        var S = t.sibling(N), P = t.child(S, !0);
        t.reset(S);
        var r = t.sibling(S), O = t.child(r), q = t.sibling(O, 2);
        t.reset(r), t.reset(k), t.template_effect(() => {
          t.set_text(z, `${t.get(u).first_name ?? ""} ${t.get(u).last_name ?? "" ?? ""}`), t.set_text(j, t.get(u).email ?? "—"), t.set_text(M, t.get(u).phone ?? "—"), t.set_text(P, t.get(u).company ?? "—");
        }), t.delegated("click", O, () => tt(t.get(u))), t.delegated("click", q, () => D(t.get(u).id)), t.append(d, k);
      });
      var H = t.sibling(L);
      {
        var U = (d) => {
          var u = Pt();
          t.append(d, u);
        };
        t.if(H, (d) => {
          t.get(o).length || d(U);
        });
      }
      t.reset(W), t.reset(R), t.reset(T);
      var I = t.sibling(T, 2), A = t.child(I), a = t.sibling(A, 2), p = t.child(a);
      t.reset(a);
      var v = t.sibling(a, 2);
      t.reset(I), t.template_effect(
        (d) => {
          A.disabled = t.get(l) === 1, t.set_text(p, `Page ${t.get(l) ?? ""} of ${d ?? ""}`), v.disabled = t.get(l) * 20 >= t.get(b);
        },
        [() => Math.ceil(t.get(b) / 20) || 1]
      ), t.delegated("click", A, () => {
        t.update(l, -1), i();
      }), t.delegated("click", v, () => {
        t.update(l), i();
      }), t.append(n, w);
    };
    t.if(dt, (n) => {
      t.get(g) ? n(ut) : n(bt, -1);
    });
  }
  t.reset(V);
  var rt = t.sibling(V, 2);
  {
    var c = (n) => {
      var w = Ot(), T = t.child(w), R = t.child(T), W = t.child(R, !0);
      t.reset(R);
      var L = t.sibling(R, 2), H = t.child(L), U = t.child(H), I = t.sibling(t.child(U), 2);
      t.remove_input_defaults(I), t.reset(U);
      var A = t.sibling(U, 2), a = t.sibling(t.child(A), 2);
      t.remove_input_defaults(a), t.reset(A), t.reset(H);
      var p = t.sibling(H, 2), v = t.sibling(t.child(p), 2);
      t.remove_input_defaults(v), t.reset(p);
      var d = t.sibling(p, 2), u = t.sibling(t.child(d), 2);
      t.remove_input_defaults(u), t.reset(d);
      var k = t.sibling(d, 2), C = t.child(k), z = t.sibling(t.child(C), 2);
      t.remove_input_defaults(z), t.reset(C);
      var E = t.sibling(C, 2), j = t.sibling(t.child(E), 2);
      t.remove_input_defaults(j), t.reset(E), t.reset(k), t.reset(L);
      var N = t.sibling(L, 2), M = t.child(N), S = t.sibling(M, 2);
      t.reset(N), t.reset(T);
      var P = t.sibling(T, 2);
      t.reset(w), t.template_effect(() => t.set_text(W, t.get(_) ? "Edit Contact" : "New Contact")), t.bind_value(I, () => t.get(s).first_name, (r) => t.get(s).first_name = r), t.bind_value(a, () => t.get(s).last_name, (r) => t.get(s).last_name = r), t.bind_value(v, () => t.get(s).email, (r) => t.get(s).email = r), t.bind_value(u, () => t.get(s).phone, (r) => t.get(s).phone = r), t.bind_value(z, () => t.get(s).company, (r) => t.get(s).company = r), t.bind_value(j, () => t.get(s).job_title, (r) => t.get(s).job_title = r), t.delegated("click", M, () => t.set(m, !1)), t.delegated("click", S, et), t.delegated("click", P, () => t.set(m, !1)), t.append(n, w);
    };
    t.if(rt, (n) => {
      t.get(m) && n(c);
    });
  }
  t.template_effect(() => t.set_text(ot, `${t.get(b) ?? ""} contacts`)), t.delegated("click", nt, B), t.delegated("input", at, () => {
    t.set(l, 1), i();
  }), t.bind_value(at, () => t.get(f), (n) => t.set(f, n)), t.append(h, $), t.pop();
}
t.delegate(["click", "input"]);
var It = t.from_html('<div class="flex justify-center py-12"><span class="loading loading-spinner loading-lg"></span></div>'), At = t.from_html('<tr><td class="font-medium"> </td><td class="font-mono text-sm"> </td><td><span class="badge badge-ghost"> </span></td><td> </td><td><span> </span></td><td class="text-right space-x-2"><button class="btn btn-ghost btn-xs">Edit</button> <button class="btn btn-ghost btn-xs text-error">Delete</button></td></tr>'), Lt = t.from_html('<tr><td colspan="6" class="text-center text-base-content/40 py-8">No organizations found</td></tr>'), Ut = t.from_html('<div class="overflow-x-auto"><table class="table table-zebra w-full"><thead><tr><th>Name</th><th>Tax ID</th><th>Type</th><th>Industry</th><th>Status</th><th></th></tr></thead><tbody><!><!></tbody></table></div> <div class="flex justify-center gap-2 mt-4"><button class="btn btn-sm">Prev</button> <span class="btn btn-sm btn-disabled"> </span> <button class="btn btn-sm">Next</button></div>', 1), qt = t.from_html('<div class="modal modal-open"><div class="modal-box"><h3 class="font-bold text-lg mb-4"> </h3> <div class="space-y-3"><div class="form-control"><label class="label" for="org-name"><span class="label-text">Name *</span></label> <input id="org-name" class="input input-bordered" required=""/></div> <div class="grid grid-cols-2 gap-3"><div class="form-control"><label class="label" for="org-legal-name"><span class="label-text">Legal Name</span></label> <input id="org-legal-name" class="input input-bordered"/></div> <div class="form-control"><label class="label" for="org-tax-id"><span class="label-text">Tax ID (CUI)</span></label> <input id="org-tax-id" class="input input-bordered"/></div></div> <div class="grid grid-cols-2 gap-3"><div class="form-control"><label class="label" for="org-type"><span class="label-text">Type</span></label> <select id="org-type" class="select select-bordered"><option>Company</option><option>Nonprofit</option><option>Government</option><option>Individual</option></select></div> <div class="form-control"><label class="label" for="org-industry"><span class="label-text">Industry</span></label> <input id="org-industry" class="input input-bordered"/></div></div> <div class="form-control"><label class="label" for="org-website"><span class="label-text">Website</span></label> <input id="org-website" type="url" class="input input-bordered" placeholder="https://"/></div> <div class="grid grid-cols-2 gap-3"><div class="form-control"><label class="label" for="org-email"><span class="label-text">Email</span></label> <input id="org-email" type="email" class="input input-bordered"/></div> <div class="form-control"><label class="label" for="org-phone"><span class="label-text">Phone</span></label> <input id="org-phone" class="input input-bordered"/></div></div></div> <div class="modal-action"><button class="btn">Cancel</button> <button class="btn btn-primary">Save</button></div></div> <button class="modal-backdrop" aria-label="Close"></button></div>'), Wt = t.from_html('<div class="space-y-6"><div class="flex items-center justify-between"><div><h1 class="text-2xl font-bold">Organizations</h1> <p class="text-base-content/60"> </p></div> <button class="btn btn-primary">+ New Organization</button></div> <input type="search" placeholder="Search organizations..." class="input input-bordered w-full max-w-sm"/> <!></div> <!>', 1);
function Gt(h, e) {
  t.push(e, !0);
  let o = t.state(t.proxy([])), b = t.state(0), l = t.state(1), f = t.state(""), g = t.state(!1), m = t.state(!1), _ = t.state(null), s = t.state(t.proxy({
    name: "",
    legal_name: "",
    tax_id: "",
    type: "company",
    industry: "",
    website: "",
    email: "",
    phone: ""
  }));
  async function i() {
    t.set(g, !0);
    try {
      const c = new URLSearchParams({ page: String(t.get(l)), limit: "20" });
      t.get(f) && c.set("search", t.get(f));
      const n = await Z.get(`/organizations?${c}`);
      t.set(o, n.data, !0), t.set(b, n.meta.total, !0);
    } finally {
      t.set(g, !1);
    }
  }
  function B() {
    t.set(_, null), t.set(
      s,
      {
        name: "",
        legal_name: "",
        tax_id: "",
        type: "company",
        industry: "",
        website: "",
        email: "",
        phone: ""
      },
      !0
    ), t.set(m, !0);
  }
  function tt(c) {
    t.set(_, c, !0), t.set(
      s,
      {
        name: c.name ?? "",
        legal_name: c.legal_name ?? "",
        tax_id: c.tax_id ?? "",
        type: c.type ?? "company",
        industry: c.industry ?? "",
        website: c.website ?? "",
        email: c.email ?? "",
        phone: c.phone ?? ""
      },
      !0
    ), t.set(m, !0);
  }
  async function et() {
    t.get(_) ? await Z.patch(`/organizations/${t.get(_).id}`, t.get(s)) : await Z.post("/organizations", t.get(s)), t.set(m, !1), await i();
  }
  async function D(c) {
    confirm("Delete this organization?") && (await Z.delete(`/organizations/${c}`), await i());
  }
  kt(i);
  var $ = Wt(), V = t.first_child($), Y = t.child(V), K = t.child(Y), lt = t.sibling(t.child(K), 2), ot = t.child(lt);
  t.reset(lt), t.reset(K);
  var nt = t.sibling(K, 2);
  t.reset(Y);
  var F = t.sibling(Y, 2);
  t.remove_input_defaults(F);
  var at = t.sibling(F, 2);
  {
    var dt = (c) => {
      var n = It();
      t.append(c, n);
    }, ut = (c) => {
      var n = Ut(), w = t.first_child(n), T = t.child(w), R = t.sibling(t.child(T)), W = t.child(R);
      t.each(W, 17, () => t.get(o), t.index, (v, d) => {
        var u = At(), k = t.child(u), C = t.child(k, !0);
        t.reset(k);
        var z = t.sibling(k), E = t.child(z, !0);
        t.reset(z);
        var j = t.sibling(z), N = t.child(j), M = t.child(N, !0);
        t.reset(N), t.reset(j);
        var S = t.sibling(j), P = t.child(S, !0);
        t.reset(S);
        var r = t.sibling(S), O = t.child(r), q = t.child(O, !0);
        t.reset(O), t.reset(r);
        var Q = t.sibling(r), J = t.child(Q), X = t.sibling(J, 2);
        t.reset(Q), t.reset(u), t.template_effect(() => {
          t.set_text(C, t.get(d).name), t.set_text(E, t.get(d).tax_id ?? "—"), t.set_text(M, t.get(d).type), t.set_text(P, t.get(d).industry ?? "—"), t.set_class(O, 1, `badge ${t.get(d).is_active ? "badge-success" : "badge-error"} badge-sm`), t.set_text(q, t.get(d).is_active ? "Active" : "Inactive");
        }), t.delegated("click", J, () => tt(t.get(d))), t.delegated("click", X, () => D(t.get(d).id)), t.append(v, u);
      });
      var L = t.sibling(W);
      {
        var H = (v) => {
          var d = Lt();
          t.append(v, d);
        };
        t.if(L, (v) => {
          t.get(o).length || v(H);
        });
      }
      t.reset(R), t.reset(T), t.reset(w);
      var U = t.sibling(w, 2), I = t.child(U), A = t.sibling(I, 2), a = t.child(A);
      t.reset(A);
      var p = t.sibling(A, 2);
      t.reset(U), t.template_effect(() => {
        I.disabled = t.get(l) === 1, t.set_text(a, `Page ${t.get(l) ?? ""}`), p.disabled = t.get(l) * 20 >= t.get(b);
      }), t.delegated("click", I, () => {
        t.update(l, -1), i();
      }), t.delegated("click", p, () => {
        t.update(l), i();
      }), t.append(c, n);
    };
    t.if(at, (c) => {
      t.get(g) ? c(dt) : c(ut, -1);
    });
  }
  t.reset(V);
  var bt = t.sibling(V, 2);
  {
    var rt = (c) => {
      var n = qt(), w = t.child(n), T = t.child(w), R = t.child(T, !0);
      t.reset(T);
      var W = t.sibling(T, 2), L = t.child(W), H = t.sibling(t.child(L), 2);
      t.remove_input_defaults(H), t.reset(L);
      var U = t.sibling(L, 2), I = t.child(U), A = t.sibling(t.child(I), 2);
      t.remove_input_defaults(A), t.reset(I);
      var a = t.sibling(I, 2), p = t.sibling(t.child(a), 2);
      t.remove_input_defaults(p), t.reset(a), t.reset(U);
      var v = t.sibling(U, 2), d = t.child(v), u = t.sibling(t.child(d), 2), k = t.child(u);
      k.value = k.__value = "company";
      var C = t.sibling(k);
      C.value = C.__value = "nonprofit";
      var z = t.sibling(C);
      z.value = z.__value = "government";
      var E = t.sibling(z);
      E.value = E.__value = "individual", t.reset(u), t.reset(d);
      var j = t.sibling(d, 2), N = t.sibling(t.child(j), 2);
      t.remove_input_defaults(N), t.reset(j), t.reset(v);
      var M = t.sibling(v, 2), S = t.sibling(t.child(M), 2);
      t.remove_input_defaults(S), t.reset(M);
      var P = t.sibling(M, 2), r = t.child(P), O = t.sibling(t.child(r), 2);
      t.remove_input_defaults(O), t.reset(r);
      var q = t.sibling(r, 2), Q = t.sibling(t.child(q), 2);
      t.remove_input_defaults(Q), t.reset(q), t.reset(P), t.reset(W);
      var J = t.sibling(W, 2), X = t.child(J), ct = t.sibling(X, 2);
      t.reset(J), t.reset(w);
      var it = t.sibling(w, 2);
      t.reset(n), t.template_effect(() => t.set_text(R, t.get(_) ? "Edit Organization" : "New Organization")), t.bind_value(H, () => t.get(s).name, (y) => t.get(s).name = y), t.bind_value(A, () => t.get(s).legal_name, (y) => t.get(s).legal_name = y), t.bind_value(p, () => t.get(s).tax_id, (y) => t.get(s).tax_id = y), t.bind_select_value(u, () => t.get(s).type, (y) => t.get(s).type = y), t.bind_value(N, () => t.get(s).industry, (y) => t.get(s).industry = y), t.bind_value(S, () => t.get(s).website, (y) => t.get(s).website = y), t.bind_value(O, () => t.get(s).email, (y) => t.get(s).email = y), t.bind_value(Q, () => t.get(s).phone, (y) => t.get(s).phone = y), t.delegated("click", X, () => t.set(m, !1)), t.delegated("click", ct, et), t.delegated("click", it, () => t.set(m, !1)), t.append(c, n);
    };
    t.if(bt, (c) => {
      t.get(m) && c(rt);
    });
  }
  t.template_effect(() => t.set_text(ot, `${t.get(b) ?? ""} organizations`)), t.delegated("click", nt, B), t.delegated("input", F, () => {
    t.set(l, 1), i();
  }), t.bind_value(F, () => t.get(f), (c) => t.set(f, c)), t.append(h, $), t.pop();
}
t.delegate(["click", "input"]);
var Bt = t.from_html("<option> </option>"), Vt = t.from_html("<option> </option>"), Ft = t.from_html('<div class="flex justify-center py-12"><span class="loading loading-spinner loading-lg"></span></div>'), Ht = t.from_html('<tr><td class="font-mono text-sm"> </td><td><span class="badge badge-ghost"> </span></td><td><span> </span></td><td class="font-medium"> </td><td> </td><td class="text-right space-x-2"><button class="btn btn-ghost btn-xs">Edit</button> <button class="btn btn-ghost btn-xs text-error">Delete</button></td></tr>'), Jt = t.from_html('<tr><td colspan="6" class="text-center text-base-content/40 py-8">No transactions found</td></tr>'), Zt = t.from_html('<div class="overflow-x-auto"><table class="table table-zebra w-full"><thead><tr><th>Number</th><th>Type</th><th>Status</th><th>Amount</th><th>Due Date</th><th></th></tr></thead><tbody><!><!></tbody></table></div> <div class="flex justify-center gap-2 mt-4"><button class="btn btn-sm">Prev</button> <span class="btn btn-sm btn-disabled"> </span> <button class="btn btn-sm">Next</button></div>', 1), Yt = t.from_html("<option> </option>"), Kt = t.from_html("<option> </option>"), Qt = t.from_html('<div class="modal modal-open"><div class="modal-box"><h3 class="font-bold text-lg mb-4"> </h3> <div class="space-y-3"><div class="grid grid-cols-2 gap-3"><div class="form-control"><label class="label" for="tx-type"><span class="label-text">Type *</span></label> <select id="tx-type" class="select select-bordered"></select></div> <div class="form-control"><label class="label" for="tx-status"><span class="label-text">Status</span></label> <select id="tx-status" class="select select-bordered"></select></div></div> <div class="grid grid-cols-2 gap-3"><div class="form-control"><label class="label" for="tx-number"><span class="label-text">Number</span></label> <input id="tx-number" class="input input-bordered" placeholder="e.g. INV-2024-001"/></div> <div class="form-control"><label class="label" for="tx-currency"><span class="label-text">Currency</span></label> <input id="tx-currency" class="input input-bordered"/></div></div> <div class="grid grid-cols-3 gap-3"><div class="form-control"><label class="label" for="tx-amount"><span class="label-text">Amount</span></label> <input id="tx-amount" type="number" class="input input-bordered" step="0.01"/></div> <div class="form-control"><label class="label" for="tx-tax"><span class="label-text">Tax</span></label> <input id="tx-tax" type="number" class="input input-bordered" step="0.01"/></div> <div class="form-control"><label class="label" for="tx-total"><span class="label-text">Total</span></label> <input id="tx-total" type="number" class="input input-bordered" step="0.01"/></div></div> <div class="form-control"><label class="label" for="tx-due-date"><span class="label-text">Due Date</span></label> <input id="tx-due-date" type="date" class="input input-bordered"/></div> <div class="form-control"><label class="label" for="tx-notes"><span class="label-text">Notes</span></label> <textarea id="tx-notes" class="textarea textarea-bordered"></textarea></div></div> <div class="modal-action"><button class="btn">Cancel</button> <button class="btn btn-primary">Save</button></div></div> <button class="modal-backdrop" aria-label="Close"></button></div>'), Xt = t.from_html('<div class="space-y-6"><div class="flex items-center justify-between"><div><h1 class="text-2xl font-bold">Transactions</h1> <p class="text-base-content/60"> </p></div> <button class="btn btn-primary">+ New Transaction</button></div> <div class="flex gap-3"><select class="select select-bordered select-sm"><option>All types</option><!></select> <select class="select select-bordered select-sm"><option>All statuses</option><!></select></div> <!></div> <!>', 1);
function te(h, e) {
  t.push(e, !0);
  let o = t.state(t.proxy([])), b = t.state(0), l = t.state(1), f = t.state(""), g = t.state(""), m = t.state(!1), _ = t.state(!1), s = t.state(null), i = t.state(t.proxy({
    type: "invoice",
    status: "draft",
    number: "",
    currency: "RON",
    amount: 0,
    tax_amount: 0,
    total_amount: 0,
    due_date: "",
    notes: ""
  }));
  const B = [
    "invoice",
    "payment",
    "credit_note",
    "expense",
    "transfer",
    "other"
  ], tt = ["draft", "pending", "completed", "cancelled", "refunded"], et = {
    draft: "badge-ghost",
    pending: "badge-warning",
    completed: "badge-success",
    cancelled: "badge-error",
    refunded: "badge-info"
  };
  async function D() {
    t.set(m, !0);
    try {
      const a = new URLSearchParams({ page: String(t.get(l)), limit: "20" });
      t.get(f) && a.set("type", t.get(f)), t.get(g) && a.set("status", t.get(g));
      const p = await Z.get(`/transactions?${a}`);
      t.set(o, p.data, !0), t.set(b, p.meta.total, !0);
    } finally {
      t.set(m, !1);
    }
  }
  function $() {
    t.set(s, null), t.set(
      i,
      {
        type: "invoice",
        status: "draft",
        number: "",
        currency: "RON",
        amount: 0,
        tax_amount: 0,
        total_amount: 0,
        due_date: "",
        notes: ""
      },
      !0
    ), t.set(_, !0);
  }
  function V(a) {
    t.set(s, a, !0), t.set(
      i,
      {
        type: a.type,
        status: a.status,
        number: a.number ?? "",
        currency: a.currency ?? "RON",
        amount: a.amount ?? 0,
        tax_amount: a.tax_amount ?? 0,
        total_amount: a.total_amount ?? 0,
        due_date: a.due_date ?? "",
        notes: a.notes ?? ""
      },
      !0
    ), t.set(_, !0);
  }
  async function Y() {
    const a = {
      ...t.get(i),
      amount: Number(t.get(i).amount),
      tax_amount: Number(t.get(i).tax_amount),
      total_amount: Number(t.get(i).total_amount)
    };
    t.get(s) ? await Z.patch(`/transactions/${t.get(s).id}`, a) : await Z.post("/transactions", a), t.set(_, !1), await D();
  }
  async function K(a) {
    confirm("Delete this transaction?") && (await Z.delete(`/transactions/${a}`), await D());
  }
  function lt(a, p) {
    return new Intl.NumberFormat("ro-RO", { style: "currency", currency: p || "RON" }).format(a);
  }
  kt(D);
  var ot = Xt(), nt = t.first_child(ot), F = t.child(nt), at = t.child(F), dt = t.sibling(t.child(at), 2), ut = t.child(dt);
  t.reset(dt), t.reset(at);
  var bt = t.sibling(at, 2);
  t.reset(F);
  var rt = t.sibling(F, 2), c = t.child(rt), n = t.child(c);
  n.value = n.__value = "";
  var w = t.sibling(n);
  t.each(w, 17, () => B, t.index, (a, p) => {
    var v = Bt(), d = t.child(v, !0);
    t.reset(v);
    var u = {};
    t.template_effect(() => {
      t.set_text(d, t.get(p)), u !== (u = t.get(p)) && (v.value = (v.__value = t.get(p)) ?? "");
    }), t.append(a, v);
  }), t.reset(c);
  var T = t.sibling(c, 2), R = t.child(T);
  R.value = R.__value = "";
  var W = t.sibling(R);
  t.each(W, 17, () => tt, t.index, (a, p) => {
    var v = Vt(), d = t.child(v, !0);
    t.reset(v);
    var u = {};
    t.template_effect(() => {
      t.set_text(d, t.get(p)), u !== (u = t.get(p)) && (v.value = (v.__value = t.get(p)) ?? "");
    }), t.append(a, v);
  }), t.reset(T), t.reset(rt);
  var L = t.sibling(rt, 2);
  {
    var H = (a) => {
      var p = Ft();
      t.append(a, p);
    }, U = (a) => {
      var p = Zt(), v = t.first_child(p), d = t.child(v), u = t.sibling(t.child(d)), k = t.child(u);
      t.each(k, 17, () => t.get(o), t.index, (P, r) => {
        var O = Ht(), q = t.child(O), Q = t.child(q, !0);
        t.reset(q);
        var J = t.sibling(q), X = t.child(J), ct = t.child(X, !0);
        t.reset(X), t.reset(J);
        var it = t.sibling(J), y = t.child(it), gt = t.child(y, !0);
        t.reset(y), t.reset(it);
        var vt = t.sibling(it), ht = t.child(vt, !0);
        t.reset(vt);
        var pt = t.sibling(vt), ft = t.child(pt, !0);
        t.reset(pt);
        var _t = t.sibling(pt), xt = t.child(_t), yt = t.sibling(xt, 2);
        t.reset(_t), t.reset(O), t.template_effect(
          (x, st, G) => {
            t.set_text(Q, x), t.set_text(ct, t.get(r).type), t.set_class(y, 1, `badge ${et[t.get(r).status] ?? "badge-ghost" ?? ""} badge-sm`), t.set_text(gt, t.get(r).status), t.set_text(ht, st), t.set_text(ft, G);
          },
          [
            () => t.get(r).number ?? t.get(r).id.slice(0, 8),
            () => lt(t.get(r).total_amount ?? t.get(r).amount ?? 0, t.get(r).currency),
            () => t.get(r).due_date ? new Date(t.get(r).due_date).toLocaleDateString("ro-RO") : "—"
          ]
        ), t.delegated("click", xt, () => V(t.get(r))), t.delegated("click", yt, () => K(t.get(r).id)), t.append(P, O);
      });
      var C = t.sibling(k);
      {
        var z = (P) => {
          var r = Jt();
          t.append(P, r);
        };
        t.if(C, (P) => {
          t.get(o).length || P(z);
        });
      }
      t.reset(u), t.reset(d), t.reset(v);
      var E = t.sibling(v, 2), j = t.child(E), N = t.sibling(j, 2), M = t.child(N);
      t.reset(N);
      var S = t.sibling(N, 2);
      t.reset(E), t.template_effect(() => {
        j.disabled = t.get(l) === 1, t.set_text(M, `Page ${t.get(l) ?? ""}`), S.disabled = t.get(l) * 20 >= t.get(b);
      }), t.delegated("click", j, () => {
        t.update(l, -1), D();
      }), t.delegated("click", S, () => {
        t.update(l), D();
      }), t.append(a, p);
    };
    t.if(L, (a) => {
      t.get(m) ? a(H) : a(U, -1);
    });
  }
  t.reset(nt);
  var I = t.sibling(nt, 2);
  {
    var A = (a) => {
      var p = Qt(), v = t.child(p), d = t.child(v), u = t.child(d, !0);
      t.reset(d);
      var k = t.sibling(d, 2), C = t.child(k), z = t.child(C), E = t.sibling(t.child(z), 2);
      t.each(E, 21, () => B, t.index, (x, st) => {
        var G = Yt(), wt = t.child(G, !0);
        t.reset(G);
        var mt = {};
        t.template_effect(() => {
          t.set_text(wt, t.get(st)), mt !== (mt = t.get(st)) && (G.value = (G.__value = t.get(st)) ?? "");
        }), t.append(x, G);
      }), t.reset(E), t.reset(z);
      var j = t.sibling(z, 2), N = t.sibling(t.child(j), 2);
      t.each(N, 21, () => tt, t.index, (x, st) => {
        var G = Kt(), wt = t.child(G, !0);
        t.reset(G);
        var mt = {};
        t.template_effect(() => {
          t.set_text(wt, t.get(st)), mt !== (mt = t.get(st)) && (G.value = (G.__value = t.get(st)) ?? "");
        }), t.append(x, G);
      }), t.reset(N), t.reset(j), t.reset(C);
      var M = t.sibling(C, 2), S = t.child(M), P = t.sibling(t.child(S), 2);
      t.remove_input_defaults(P), t.reset(S);
      var r = t.sibling(S, 2), O = t.sibling(t.child(r), 2);
      t.remove_input_defaults(O), t.reset(r), t.reset(M);
      var q = t.sibling(M, 2), Q = t.child(q), J = t.sibling(t.child(Q), 2);
      t.remove_input_defaults(J), t.reset(Q);
      var X = t.sibling(Q, 2), ct = t.sibling(t.child(X), 2);
      t.remove_input_defaults(ct), t.reset(X);
      var it = t.sibling(X, 2), y = t.sibling(t.child(it), 2);
      t.remove_input_defaults(y), t.reset(it), t.reset(q);
      var gt = t.sibling(q, 2), vt = t.sibling(t.child(gt), 2);
      t.remove_input_defaults(vt), t.reset(gt);
      var ht = t.sibling(gt, 2), pt = t.sibling(t.child(ht), 2);
      t.remove_textarea_child(pt), t.reset(ht), t.reset(k);
      var ft = t.sibling(k, 2), _t = t.child(ft), xt = t.sibling(_t, 2);
      t.reset(ft), t.reset(v);
      var yt = t.sibling(v, 2);
      t.reset(p), t.template_effect(() => t.set_text(u, t.get(s) ? "Edit Transaction" : "New Transaction")), t.bind_select_value(E, () => t.get(i).type, (x) => t.get(i).type = x), t.bind_select_value(N, () => t.get(i).status, (x) => t.get(i).status = x), t.bind_value(P, () => t.get(i).number, (x) => t.get(i).number = x), t.bind_value(O, () => t.get(i).currency, (x) => t.get(i).currency = x), t.bind_value(J, () => t.get(i).amount, (x) => t.get(i).amount = x), t.bind_value(ct, () => t.get(i).tax_amount, (x) => t.get(i).tax_amount = x), t.bind_value(y, () => t.get(i).total_amount, (x) => t.get(i).total_amount = x), t.bind_value(vt, () => t.get(i).due_date, (x) => t.get(i).due_date = x), t.bind_value(pt, () => t.get(i).notes, (x) => t.get(i).notes = x), t.delegated("click", _t, () => t.set(_, !1)), t.delegated("click", xt, Y), t.delegated("click", yt, () => t.set(_, !1)), t.append(a, p);
    };
    t.if(I, (a) => {
      t.get(_) && a(A);
    });
  }
  t.template_effect(() => t.set_text(ut, `${t.get(b) ?? ""} transactions`)), t.delegated("click", bt, $), t.delegated("change", c, () => {
    t.set(l, 1), D();
  }), t.bind_select_value(c, () => t.get(f), (a) => t.set(f, a)), t.delegated("change", T, () => {
    t.set(l, 1), D();
  }), t.bind_select_value(T, () => t.get(g), (a) => t.set(g, a)), t.append(h, ot), t.pop();
}
t.delegate(["click", "change"]);
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
const ee = {
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
var ae = t.from_svg("<svg><!><!></svg>");
function Nt(h, e) {
  t.push(e, !0);
  const o = t.prop(e, "color", 3, "currentColor"), b = t.prop(e, "size", 3, 24), l = t.prop(e, "strokeWidth", 3, 2), f = t.prop(e, "absoluteStrokeWidth", 3, !1), g = t.prop(e, "iconNode", 19, () => []), m = t.rest_props(e, [
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
  var _ = ae();
  t.attribute_effect(
    _,
    (B) => ({
      ...ee,
      ...m,
      width: b(),
      height: b(),
      stroke: o(),
      "stroke-width": B,
      class: [
        "lucide-icon lucide",
        e.name && `lucide-${e.name}`,
        e.class
      ]
    }),
    [
      () => f() ? Number(l()) * 24 / Number(b()) : l()
    ]
  );
  var s = t.child(_);
  t.each(s, 17, g, t.index, (B, tt) => {
    var et = t.derived(() => t.to_array(t.get(tt), 2));
    let D = () => t.get(et)[0], $ = () => t.get(et)[1];
    var V = t.comment(), Y = t.first_child(V);
    t.element(Y, D, !0, (K, lt) => {
      t.attribute_effect(K, () => ({ ...$() }));
    }), t.append(B, V);
  });
  var i = t.sibling(s);
  t.snippet(i, () => e.children ?? t.noop), t.reset(_), t.append(h, _), t.pop();
}
function se(h, e) {
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
  let o = t.rest_props(e, ["$$slots", "$$events", "$$legacy"]);
  const b = [
    ["path", { d: "M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" }],
    ["path", { d: "M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" }],
    ["path", { d: "M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" }],
    ["path", { d: "M10 6h4" }],
    ["path", { d: "M10 10h4" }],
    ["path", { d: "M10 14h4" }],
    ["path", { d: "M10 18h4" }]
  ];
  Nt(h, t.spread_props({ name: "building-2" }, () => o, {
    get iconNode() {
      return b;
    },
    children: (l, f) => {
      var g = t.comment(), m = t.first_child(g);
      t.snippet(m, () => e.children ?? t.noop), t.append(l, g);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function le(h, e) {
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
  let o = t.rest_props(e, ["$$slots", "$$events", "$$legacy"]);
  const b = [
    ["path", { d: "M16 7h6v6" }],
    ["path", { d: "m22 7-8.5 8.5-5-5L2 17" }]
  ];
  Nt(h, t.spread_props({ name: "trending-up" }, () => o, {
    get iconNode() {
      return b;
    },
    children: (l, f) => {
      var g = t.comment(), m = t.first_child(g);
      t.snippet(m, () => e.children ?? t.noop), t.append(l, g);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function ie(h, e) {
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
  let o = t.rest_props(e, ["$$slots", "$$events", "$$legacy"]);
  const b = [
    ["path", { d: "M18 21a8 8 0 0 0-16 0" }],
    ["circle", { cx: "10", cy: "8", r: "5" }],
    ["path", { d: "M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3" }]
  ];
  Nt(h, t.spread_props({ name: "users-round" }, () => o, {
    get iconNode() {
      return b;
    },
    children: (l, f) => {
      var g = t.comment(), m = t.first_child(g);
      t.snippet(m, () => e.children ?? t.noop), t.append(l, g);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
var ne = t.from_html('<div class="flex flex-col h-full"><div class="flex border-b border-base-content/10 px-6"><button><!> Contacts</button> <button><!> Organizations</button> <button><!> Transactions</button></div> <div class="flex-1 overflow-auto"><!></div></div>');
function re(h) {
  let e = t.state("contacts");
  var o = ne(), b = t.child(o), l = t.child(b), f = t.child(l);
  ie(f, { class: "h-4 w-4" }), t.next(), t.reset(l);
  var g = t.sibling(l, 2), m = t.child(g);
  se(m, { class: "h-4 w-4" }), t.next(), t.reset(g);
  var _ = t.sibling(g, 2), s = t.child(_);
  le(s, { class: "h-4 w-4" }), t.next(), t.reset(_), t.reset(b);
  var i = t.sibling(b, 2), B = t.child(i);
  {
    var tt = ($) => {
      Rt($, {});
    }, et = ($) => {
      Gt($, {});
    }, D = ($) => {
      te($, {});
    };
    t.if(B, ($) => {
      t.get(e) === "contacts" ? $(tt) : t.get(e) === "organizations" ? $(et, 1) : $(D, -1);
    });
  }
  t.reset(i), t.reset(o), t.template_effect(() => {
    t.set_class(l, 1, `flex items-center gap-2 px-4 py-3 text-sm border-b-2 transition-colors ${t.get(e) === "contacts" ? "border-primary text-primary" : "border-transparent text-base-content/60 hover:text-base-content"}`), t.set_class(g, 1, `flex items-center gap-2 px-4 py-3 text-sm border-b-2 transition-colors ${t.get(e) === "organizations" ? "border-primary text-primary" : "border-transparent text-base-content/60 hover:text-base-content"}`), t.set_class(_, 1, `flex items-center gap-2 px-4 py-3 text-sm border-b-2 transition-colors ${t.get(e) === "transactions" ? "border-primary text-primary" : "border-transparent text-base-content/60 hover:text-base-content"}`);
  }), t.delegated("click", l, () => t.set(e, "contacts")), t.delegated("click", g, () => t.set(e, "organizations")), t.delegated("click", _, () => t.set(e, "transactions")), t.append(h, o);
}
t.delegate(["click"]);
function oe() {
  const h = window.__zveltio;
  h && h.registerRoute({
    path: "crm",
    component: re,
    label: "CRM",
    icon: "Users2",
    category: "crm"
  });
}
oe();
export {
  oe as default
};
