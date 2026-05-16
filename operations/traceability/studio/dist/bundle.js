import "svelte/internal/disclose-version";
import * as t from "svelte/internal/client";
function It() {
  if (typeof window > "u")
    return null;
  const Ct = window.__zveltio;
  return Ct || (console.warn("[zveltio/sdk/studio] window.__zveltio is not installed. Is the bundle running inside Studio?"), null);
}
function Lt(Ct) {
  var bt;
  (bt = It()) == null || bt.registerRoute(Ct);
}
var Ft = t.from_html('<div class="alert alert-error"> </div>'), Et = t.from_html('<div class="flex justify-center py-12"><span class="loading loading-spinner loading-lg"></span></div>'), Jt = t.from_html("<span> </span>"), Ut = t.from_html('<tr><td class="font-mono text-sm"> </td><td><div class="font-medium"> </div> <div class="text-xs text-base-content/50"> </div></td><td class="text-sm"> </td><td><span> </span></td><td class="text-sm"> </td><td class="text-sm"><!></td><td class="text-xs"> </td><td><a class="btn btn-ghost btn-xs">Detalii</a></td></tr>'), Vt = t.from_html('<tr><td colspan="8" class="text-center text-base-content/50 py-8">Niciun lot găsit</td></tr>'), Bt = t.from_html('<div class="flex justify-center gap-2"><button class="btn btn-sm">‹</button> <span class="flex items-center px-3 text-sm"> </span> <button class="btn btn-sm">›</button></div>'), Gt = t.from_html('<div class="overflow-x-auto"><table class="table table-zebra w-full"><thead><tr><th>Număr lot</th><th>Produs</th><th>Furnizor</th><th>Status</th><th>Cant. rămasă</th><th>Valabilitate</th><th>Locație</th><th></th></tr></thead><tbody><!><!></tbody></table></div> <!>', 1), Ht = t.from_html('<div class="p-6 space-y-4"><div class="flex items-center justify-between"><h1 class="text-2xl font-bold">Loturi</h1> <a href="/admin/trace/reception" class="btn btn-primary btn-sm">+ Recepție nouă</a></div> <div class="flex gap-3 flex-wrap"><select class="select select-bordered select-sm"><option>Toate statusurile</option><option>Carantină</option><option>Disponibil</option><option>Epuizat</option><option>Retras</option></select></div> <!> <!></div>');
function Mt(Ct, bt) {
  t.push(bt, !0);
  const E = "/ext/operations/traceability";
  let r = t.state(t.proxy([])), W = t.state(!0), K = t.state(""), z = t.state(""), n = t.state(1), T = t.state(0);
  const s = 50, st = t.derived(() => Math.ceil(t.get(T) / s));
  async function Q() {
    t.set(W, !0), t.set(K, "");
    try {
      const j = new URLSearchParams({ page: String(t.get(n)), limit: String(s) });
      t.get(z) && j.set("status", t.get(z));
      const tt = await fetch(`${E}/lots?${j}`);
      if (!tt.ok) throw new Error(await tt.text());
      const et = await tt.json();
      t.set(r, et.data, !0), t.set(T, et.meta.total, !0);
    } catch (j) {
      t.set(K, j.message, !0);
    } finally {
      t.set(W, !1);
    }
  }
  t.user_effect(() => {
    Q();
  }), t.user_effect(() => {
    t.get(n), t.get(z), Q();
  });
  function f(j) {
    return {
      available: "badge-success",
      quarantine: "badge-warning",
      exhausted: "badge-neutral",
      recalled: "badge-error",
      returned: "badge-info"
    }[j] ?? "badge-ghost";
  }
  function X(j) {
    return j ? Math.ceil((new Date(j).getTime() - Date.now()) / 864e5) : 999;
  }
  var J = Ht(), Y = t.sibling(t.child(J), 2), gt = t.child(Y), ft = t.child(gt);
  ft.value = ft.__value = "";
  var yt = t.sibling(ft);
  yt.value = yt.__value = "quarantine";
  var jt = t.sibling(yt);
  jt.value = jt.__value = "available";
  var nt = t.sibling(jt);
  nt.value = nt.__value = "exhausted";
  var wt = t.sibling(nt);
  wt.value = wt.__value = "recalled", t.reset(gt), t.reset(Y);
  var mt = t.sibling(Y, 2);
  {
    var _t = (j) => {
      var tt = Ft(), et = t.child(tt, !0);
      t.reset(tt), t.template_effect(() => t.set_text(et, t.get(K))), t.append(j, tt);
    };
    t.if(mt, (j) => {
      t.get(K) && j(_t);
    });
  }
  var Dt = t.sibling(mt, 2);
  {
    var g = (j) => {
      var tt = Et();
      t.append(j, tt);
    }, Z = (j) => {
      var tt = Gt(), et = t.first_child(tt), q = t.child(et), A = t.sibling(t.child(q)), ot = t.child(A);
      t.each(ot, 17, () => t.get(r), t.index, (_, b) => {
        const R = t.derived(() => X(t.get(b).best_before_date));
        var G = Ut(), x = t.child(G), h = t.child(x, !0);
        t.reset(x);
        var o = t.sibling(x), w = t.child(o), L = t.child(w, !0);
        t.reset(w);
        var i = t.sibling(w, 2), a = t.child(i, !0);
        t.reset(i), t.reset(o);
        var u = t.sibling(o), y = t.child(u, !0);
        t.reset(u);
        var P = t.sibling(u), N = t.child(P), e = t.child(N, !0);
        t.reset(N), t.reset(P);
        var l = t.sibling(P), d = t.child(l);
        t.reset(l);
        var p = t.sibling(l), c = t.child(p);
        {
          var $ = (I) => {
            var D = Jt(), it = t.child(D, !0);
            t.reset(D), t.template_effect(() => {
              t.set_class(D, 1, t.clsx(t.get(R) <= 3 ? "text-error font-bold" : t.get(R) <= 7 ? "text-warning" : "")), t.set_text(it, t.get(b).best_before_date);
            }), t.append(I, D);
          }, V = (I) => {
            var D = t.text("—");
            t.append(I, D);
          };
          t.if(c, (I) => {
            t.get(b).best_before_date ? I($) : I(V, -1);
          });
        }
        t.reset(p);
        var U = t.sibling(p), dt = t.child(U, !0);
        t.reset(U);
        var pt = t.sibling(U), B = t.child(pt);
        t.reset(pt), t.reset(G), t.template_effect(
          (I, D) => {
            t.set_class(G, 1, t.clsx(t.get(R) <= 3 && t.get(b).status === "available" ? "bg-error/10" : t.get(R) <= 7 && t.get(b).status === "available" ? "bg-warning/10" : "")), t.set_text(h, t.get(b).lot_number), t.set_text(L, t.get(b).item_name), t.set_text(a, t.get(b).item_code), t.set_text(y, t.get(b).supplier_name ?? "—"), t.set_class(N, 1, `badge ${I ?? ""} badge-sm`), t.set_text(e, t.get(b).status), t.set_text(d, `${t.get(b).quantity_remaining ?? ""} ${t.get(b).unit ?? ""}`), t.set_text(dt, D), t.set_attribute(B, "href", `/admin/trace/lots/${t.get(b).id ?? ""}`);
          },
          [
            () => f(t.get(b).status),
            () => [t.get(b).warehouse, t.get(b).row, t.get(b).shelf].filter(Boolean).join(" / ") || "—"
          ]
        ), t.append(_, G);
      });
      var m = t.sibling(ot);
      {
        var k = (_) => {
          var b = Vt();
          t.append(_, b);
        };
        t.if(m, (_) => {
          t.get(r).length === 0 && _(k);
        });
      }
      t.reset(A), t.reset(q), t.reset(et);
      var H = t.sibling(et, 2);
      {
        var v = (_) => {
          var b = Bt(), R = t.child(b), G = t.sibling(R, 2), x = t.child(G);
          t.reset(G);
          var h = t.sibling(G, 2);
          t.reset(b), t.template_effect(() => {
            R.disabled = t.get(n) === 1, t.set_text(x, `Pagina ${t.get(n) ?? ""} din ${t.get(st) ?? ""}`), h.disabled = t.get(n) === t.get(st);
          }), t.delegated("click", R, () => t.update(n, -1)), t.delegated("click", h, () => t.update(n)), t.append(_, b);
        };
        t.if(H, (_) => {
          t.get(st) > 1 && _(v);
        });
      }
      t.append(j, tt);
    };
    t.if(Dt, (j) => {
      t.get(W) ? j(g) : j(Z, -1);
    });
  }
  t.reset(J), t.bind_select_value(gt, () => t.get(z), (j) => t.set(z, j)), t.append(Ct, J), t.pop();
}
t.delegate(["click"]);
var Kt = t.from_html('<span class="badge badge-warning badge-sm ml-1"> </span>'), Qt = t.from_html('<div class="alert alert-error"> </div>'), Zt = t.from_html('<div class="alert alert-success mb-4">Expediere înregistrată cu succes pentru <strong> </strong>. <button class="btn btn-sm btn-ghost ml-2">+ Alta</button></div>'), Wt = t.from_html("<option> </option>"), Xt = t.from_html("<option> </option>"), Yt = t.from_html('<div class="max-w-lg"><!> <form class="space-y-3"><div><label class="label-text font-medium">Lot *</label> <select class="select select-bordered w-full" required=""><option>Selectați lot disponibil...</option><!></select></div> <div class="grid grid-cols-2 gap-3"><div><label class="label-text font-medium">Cantitate *</label> <input type="number" class="input input-bordered w-full" min="0.001" step="0.001" required=""/></div> <div><label class="label-text font-medium">UM</label> <select class="select select-bordered w-full"></select></div></div> <div><label class="label-text font-medium">Client *</label> <input type="text" class="input input-bordered w-full" required="" placeholder="Denumire client"/></div> <div><label class="label-text font-medium">Nr. factură / aviz (opțional)</label> <input type="text" class="input input-bordered w-full" placeholder="ex: INV-00123"/></div> <div><label class="label-text font-medium">Note</label> <textarea class="textarea textarea-bordered w-full" rows="2"></textarea></div> <button type="submit" class="btn btn-primary w-full"> </button></form></div>'), te = t.from_html('<div class="flex justify-center py-8"><span class="loading loading-spinner"></span></div>'), ee = t.from_html('<tr><td class="text-sm font-medium"> </td><td><div class="text-sm"> </div> <div class="text-xs font-mono opacity-60"> </div></td><td class="text-sm"> </td><td class="text-xs opacity-60"> </td><td><button class="btn btn-ghost btn-xs"> </button></td></tr>'), ae = t.from_html('<tr><td colspan="5" class="text-center opacity-50 py-6"> </td></tr>'), ie = t.from_html('<table class="table table-sm w-full"><thead><tr><th>Client</th><th>Produs / Lot</th><th>Cant. facturată</th><th>Factură</th><th></th></tr></thead><tbody><!><!></tbody></table>'), se = t.from_html('<div class="flex justify-between"><span class="opacity-60">Valabilitate</span> <span class="font-medium"> </span></div>'), re = t.from_html('<div class="flex justify-between"><span class="opacity-60">Factură</span> <span class="font-mono"> </span></div>'), le = t.from_html("<option> </option>"), ne = t.from_html('<div class="alert alert-warning text-sm">Factura nu a avut lot specificat. Selectați lotul care se expediază:</div> <div class="flex gap-2"><select class="select select-bordered select-sm flex-1"><option>Selectați lot...</option><!></select> <button class="btn btn-sm btn-warning">Asignează</button></div>', 1), oe = t.from_html('<form class="space-y-2"><div><label class="label-text text-sm font-medium">Cantitate efectiv expediată <span class="opacity-50"> </span></label> <input type="number" class="input input-bordered w-full" min="0.001" step="0.001" required=""/></div> <div><label class="label-text text-sm">Note</label> <textarea class="textarea textarea-bordered w-full" rows="2"></textarea></div> <div class="flex gap-2"><button type="submit" class="btn btn-success flex-1"> </button> <button type="button" class="btn btn-ghost btn-sm">Anulează</button></div></form>'), de = t.from_html("<!> <!>", 1), ce = t.from_html('<div class="text-sm space-y-1"><div class="flex justify-between"><span class="opacity-60">Cantitate expediată</span> <span class="font-bold text-success"> </span></div> <div class="flex justify-between"><span class="opacity-60">Confirmat la</span> <span> </span></div></div>'), ve = t.from_html('<div class="card bg-base-200 p-4 space-y-3"><h3 class="font-bold"> </h3> <div class="space-y-1 text-sm"><div class="flex justify-between"><span class="opacity-60">Produs (facturat)</span> <span> </span></div> <div class="flex justify-between"><span class="opacity-60">Lot</span> <span class="font-mono"> </span></div> <!> <div class="flex justify-between"><span class="opacity-60">Disponibil în lot</span> <span class="font-bold"> </span></div> <div class="flex justify-between"><span class="opacity-60">Cantitate facturată</span> <span> </span></div> <!></div> <!> <button class="btn btn-ghost btn-sm w-full">Închide</button></div>'), _e = t.from_html('<div class="grid grid-cols-1 lg:grid-cols-2 gap-4"><div class="overflow-x-auto"><!></div> <!></div>'), pe = t.from_html('<div class="p-6 space-y-4"><h1 class="text-2xl font-bold">Expedieri</h1> <div class="tabs tabs-bordered"><button>În așteptare <!></button> <button>Confirmate</button> <button>+ Expediere directă</button></div> <!> <!></div>');
function ue(Ct, bt) {
  t.push(bt, !0);
  const E = "/ext/operations/traceability";
  let r = t.state("pending"), W = t.state(t.proxy([])), K = t.state(!1), z = t.state(""), n = t.state(null), T = t.state(t.proxy({ quantity_dispatched: "", notes: "" })), s = t.state(""), st = t.state(t.proxy([])), Q = t.state(!1), f = t.state(t.proxy({
    lot_id: "",
    quantity_dispatched: "",
    unit: "buc",
    customer_name: "",
    invoice_number: "",
    notes: ""
  })), X = t.state(!1), J = t.state(null);
  t.user_effect(() => {
    t.get(r), Y();
  }), t.user_effect(() => {
    t.get(r) === "direct" && fetch(`${E}/lots?status=available&limit=200`).then((m) => m.json()).then((m) => {
      t.set(st, m.data ?? [], !0);
    });
  });
  async function Y() {
    t.set(K, !0), t.set(z, "");
    try {
      const m = t.get(r) === "pending" ? "pending" : t.get(r) === "confirmed" ? "confirmed" : null, k = m ? `?status=${m}` : "", H = await fetch(`${E}/dispatches${k}`);
      t.set(W, H.ok ? (await H.json()).data : [], !0);
    } catch (m) {
      t.set(z, m.message, !0);
    } finally {
      t.set(K, !1);
    }
  }
  async function gt(m) {
    const k = await fetch(`${E}/dispatches/${m.id}`);
    t.set(n, k.ok ? (await k.json()).data : m, !0), t.set(
      T,
      {
        quantity_dispatched: String(t.get(n).quantity_invoiced ?? ""),
        notes: ""
      },
      !0
    ), t.set(s, t.get(n).lot_id ?? "", !0);
  }
  async function ft() {
    if (!t.get(s) || !t.get(n)) return;
    const m = await fetch(`${E}/dispatches/${t.get(n).id}/assign-lot`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lot_id: t.get(s) })
    });
    m.ok ? t.set(n, { ...t.get(n), lot_id: t.get(s) }, !0) : t.set(z, (await m.json()).error, !0);
  }
  async function yt(m) {
    m.preventDefault(), t.set(Q, !0), t.set(z, "");
    try {
      const k = await fetch(`${E}/dispatches/${t.get(n).id}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity_dispatched: parseFloat(t.get(T).quantity_dispatched),
          notes: t.get(T).notes || void 0
        })
      });
      if (!k.ok) throw new Error((await k.json()).error);
      t.set(n, null), await Y();
    } catch (k) {
      t.set(z, k.message, !0);
    } finally {
      t.set(Q, !1);
    }
  }
  async function jt(m) {
    yt("Anulați expedierea?") && (await fetch(`${E}/dispatches/${m}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}"
    }), t.set(n, null), await Y());
  }
  async function nt(m) {
    m.preventDefault(), t.set(X, !0), t.set(z, ""), t.set(J, null);
    try {
      const k = await fetch(`${E}/dispatches/direct`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lot_id: t.get(f).lot_id,
          quantity_dispatched: parseFloat(t.get(f).quantity_dispatched),
          unit: t.get(f).unit,
          customer_name: t.get(f).customer_name,
          invoice_number: t.get(f).invoice_number || void 0,
          notes: t.get(f).notes || void 0
        })
      });
      if (!k.ok) throw new Error((await k.json()).error);
      t.set(J, (await k.json()).data, !0), t.set(
        f,
        {
          lot_id: "",
          quantity_dispatched: "",
          unit: "buc",
          customer_name: "",
          invoice_number: "",
          notes: ""
        },
        !0
      );
    } catch (k) {
      t.set(z, k.message, !0);
    } finally {
      t.set(X, !1);
    }
  }
  var wt = pe(), mt = t.sibling(t.child(wt), 2), _t = t.child(mt), Dt = t.sibling(t.child(_t));
  {
    var g = (m) => {
      var k = Kt(), H = t.child(k, !0);
      t.reset(k), t.template_effect(() => t.set_text(H, t.get(W).length)), t.append(m, k);
    };
    t.if(Dt, (m) => {
      t.get(r) === "pending" && t.get(W).length > 0 && m(g);
    });
  }
  t.reset(_t);
  var Z = t.sibling(_t, 2), j = t.sibling(Z, 2);
  t.reset(mt);
  var tt = t.sibling(mt, 2);
  {
    var et = (m) => {
      var k = Qt(), H = t.child(k, !0);
      t.reset(k), t.template_effect(() => t.set_text(H, t.get(z))), t.append(m, k);
    };
    t.if(tt, (m) => {
      t.get(z) && m(et);
    });
  }
  var q = t.sibling(tt, 2);
  {
    var A = (m) => {
      var k = Yt(), H = t.child(k);
      {
        var v = (p) => {
          var c = Zt(), $ = t.sibling(t.child(c)), V = t.child($, !0);
          t.reset($);
          var U = t.sibling($, 2);
          t.reset(c), t.template_effect(() => t.set_text(V, t.get(J).customer_name)), t.delegated("click", U, () => t.set(J, null)), t.append(p, c);
        };
        t.if(H, (p) => {
          t.get(J) && p(v);
        });
      }
      var _ = t.sibling(H, 2), b = t.child(_), R = t.sibling(t.child(b), 2), G = t.child(R);
      G.value = G.__value = "";
      var x = t.sibling(G);
      t.each(x, 17, () => t.get(st), t.index, (p, c) => {
        var $ = Wt(), V = t.child($);
        t.reset($);
        var U = {};
        t.template_effect(() => {
          t.set_text(V, `${t.get(c).lot_number ?? ""} — ${t.get(c).item_name ?? ""} (${t.get(c).quantity_remaining ?? ""} ${t.get(c).unit ?? ""})
                ${t.get(c).best_before_date ? " BBD: " + t.get(c).best_before_date : ""}`), U !== (U = t.get(c).id) && ($.value = ($.__value = t.get(c).id) ?? "");
        }), t.append(p, $);
      }), t.reset(R), t.reset(b);
      var h = t.sibling(b, 2), o = t.child(h), w = t.sibling(t.child(o), 2);
      t.remove_input_defaults(w), t.reset(o);
      var L = t.sibling(o, 2), i = t.sibling(t.child(L), 2);
      t.each(i, 20, () => ["kg", "g", "l", "ml", "buc", "cutie", "sac", "palet"], t.index, (p, c) => {
        var $ = Xt(), V = t.child($, !0);
        t.reset($);
        var U = {};
        t.template_effect(() => {
          t.set_text(V, c), U !== (U = c) && ($.value = ($.__value = c) ?? "");
        }), t.append(p, $);
      }), t.reset(i), t.reset(L), t.reset(h);
      var a = t.sibling(h, 2), u = t.sibling(t.child(a), 2);
      t.remove_input_defaults(u), t.reset(a);
      var y = t.sibling(a, 2), P = t.sibling(t.child(y), 2);
      t.remove_input_defaults(P), t.reset(y);
      var N = t.sibling(y, 2), e = t.sibling(t.child(N), 2);
      t.remove_textarea_child(e), t.reset(N);
      var l = t.sibling(N, 2), d = t.child(l, !0);
      t.reset(l), t.reset(_), t.reset(k), t.template_effect(() => {
        l.disabled = t.get(X), t.set_text(d, t.get(X) ? "Se înregistrează..." : "✓ Înregistrează expedierea");
      }), t.event("submit", _, nt), t.bind_select_value(R, () => t.get(f).lot_id, (p) => t.get(f).lot_id = p), t.bind_value(w, () => t.get(f).quantity_dispatched, (p) => t.get(f).quantity_dispatched = p), t.bind_select_value(i, () => t.get(f).unit, (p) => t.get(f).unit = p), t.bind_value(u, () => t.get(f).customer_name, (p) => t.get(f).customer_name = p), t.bind_value(P, () => t.get(f).invoice_number, (p) => t.get(f).invoice_number = p), t.bind_value(e, () => t.get(f).notes, (p) => t.get(f).notes = p), t.append(m, k);
    }, ot = (m) => {
      var k = _e(), H = t.child(k), v = t.child(H);
      {
        var _ = (x) => {
          var h = te();
          t.append(x, h);
        }, b = (x) => {
          var h = ie(), o = t.sibling(t.child(h)), w = t.child(o);
          t.each(w, 17, () => t.get(W), t.index, (a, u) => {
            var y = ee(), P = t.child(y), N = t.child(P, !0);
            t.reset(P);
            var e = t.sibling(P), l = t.child(e), d = t.child(l, !0);
            t.reset(l);
            var p = t.sibling(l, 2), c = t.child(p, !0);
            t.reset(p), t.reset(e);
            var $ = t.sibling(e), V = t.child($);
            t.reset($);
            var U = t.sibling($), dt = t.child(U, !0);
            t.reset(U);
            var pt = t.sibling(U), B = t.child(pt), I = t.child(B, !0);
            t.reset(B), t.reset(pt), t.reset(y), t.template_effect(() => {
              var D;
              t.set_class(y, 1, t.clsx(((D = t.get(n)) == null ? void 0 : D.id) === t.get(u).id ? "bg-primary/10" : "")), t.set_text(N, t.get(u).customer_name ?? "—"), t.set_text(d, t.get(u).item_name_from_invoice ?? t.get(u).item_name ?? "?"), t.set_text(c, t.get(u).lot_number ?? "fără lot"), t.set_text(V, `${t.get(u).quantity_invoiced ?? ""} ${t.get(u).unit ?? ""}`), t.set_text(dt, t.get(u).invoice_number ?? "—"), t.set_text(I, t.get(r) === "pending" ? "Confirmă" : "Detalii");
            }), t.delegated("click", B, () => gt(t.get(u))), t.append(a, y);
          });
          var L = t.sibling(w);
          {
            var i = (a) => {
              var u = ae(), y = t.child(u), P = t.child(y, !0);
              t.reset(y), t.reset(u), t.template_effect(() => t.set_text(P, t.get(r) === "pending" ? "Nicio expediere în așteptare" : "Nicio expediere confirmată")), t.append(a, u);
            };
            t.if(L, (a) => {
              t.get(W).length === 0 && a(i);
            });
          }
          t.reset(o), t.reset(h), t.append(x, h);
        };
        t.if(v, (x) => {
          t.get(K) ? x(_) : x(b, -1);
        });
      }
      t.reset(H);
      var R = t.sibling(H, 2);
      {
        var G = (x) => {
          var h = ve(), o = t.child(h), w = t.child(o, !0);
          t.reset(o);
          var L = t.sibling(o, 2), i = t.child(L), a = t.sibling(t.child(i), 2), u = t.child(a, !0);
          t.reset(a), t.reset(i);
          var y = t.sibling(i, 2), P = t.sibling(t.child(y), 2), N = t.child(P, !0);
          t.reset(P), t.reset(y);
          var e = t.sibling(y, 2);
          {
            var l = (S) => {
              var M = se(), O = t.sibling(t.child(M), 2), rt = t.child(O, !0);
              t.reset(O), t.reset(M), t.template_effect(() => t.set_text(rt, t.get(n).best_before_date)), t.append(S, M);
            };
            t.if(e, (S) => {
              t.get(n).best_before_date && S(l);
            });
          }
          var d = t.sibling(e, 2), p = t.sibling(t.child(d), 2), c = t.child(p);
          t.reset(p), t.reset(d);
          var $ = t.sibling(d, 2), V = t.sibling(t.child($), 2), U = t.child(V);
          t.reset(V), t.reset($);
          var dt = t.sibling($, 2);
          {
            var pt = (S) => {
              var M = re(), O = t.sibling(t.child(M), 2), rt = t.child(O, !0);
              t.reset(O), t.reset(M), t.template_effect(() => t.set_text(rt, t.get(n).invoice_number)), t.append(S, M);
            };
            t.if(dt, (S) => {
              t.get(n).invoice_number && S(pt);
            });
          }
          t.reset(L);
          var B = t.sibling(L, 2);
          {
            var I = (S) => {
              var M = de(), O = t.first_child(M);
              {
                var rt = (ct) => {
                  var at = ne(), vt = t.sibling(t.first_child(at), 2), ut = t.child(vt), Ot = t.child(ut);
                  Ot.value = Ot.__value = "";
                  var Pt = t.sibling(Ot);
                  t.each(Pt, 17, () => t.get(st), t.index, ($t, St) => {
                    var Rt = le(), lt = t.child(Rt);
                    t.reset(Rt);
                    var Tt = {};
                    t.template_effect(() => {
                      t.set_text(lt, `${t.get(St).lot_number ?? ""} — ${t.get(St).item_name ?? ""} (${t.get(St).quantity_remaining ?? ""} ${t.get(St).unit ?? ""})`), Tt !== (Tt = t.get(St).id) && (Rt.value = (Rt.__value = t.get(St).id) ?? "");
                    }), t.append($t, Rt);
                  }), t.reset(ut);
                  var ht = t.sibling(ut, 2);
                  t.reset(vt), t.bind_select_value(ut, () => t.get(s), ($t) => t.set(s, $t)), t.delegated("click", ht, ft), t.append(ct, at);
                };
                t.if(O, (ct) => {
                  t.get(n).lot_id || ct(rt);
                });
              }
              var kt = t.sibling(O, 2);
              {
                var qt = (ct) => {
                  var at = oe(), vt = t.child(at), ut = t.child(vt), Ot = t.sibling(t.child(ut)), Pt = t.child(Ot);
                  t.reset(Ot), t.reset(ut);
                  var ht = t.sibling(ut, 2);
                  t.remove_input_defaults(ht), t.reset(vt);
                  var $t = t.sibling(vt, 2), St = t.sibling(t.child($t), 2);
                  t.remove_textarea_child(St), t.reset($t);
                  var Rt = t.sibling($t, 2), lt = t.child(Rt), Tt = t.child(lt, !0);
                  t.reset(lt);
                  var zt = t.sibling(lt, 2);
                  t.reset(Rt), t.reset(at), t.template_effect(() => {
                    t.set_text(Pt, `(max ${t.get(n).lot_qty_remaining ?? ""} ${t.get(n).unit ?? ""})`), t.set_attribute(ht, "max", t.get(n).lot_qty_remaining), lt.disabled = t.get(Q), t.set_text(Tt, t.get(Q) ? "Se procesează..." : "✓ Confirmă expedierea");
                  }), t.event("submit", at, yt), t.bind_value(ht, () => t.get(T).quantity_dispatched, (At) => t.get(T).quantity_dispatched = At), t.bind_value(St, () => t.get(T).notes, (At) => t.get(T).notes = At), t.delegated("click", zt, () => jt(t.get(n).id)), t.append(ct, at);
                };
                t.if(kt, (ct) => {
                  (t.get(n).lot_id || t.get(n).lot_number) && ct(qt);
                });
              }
              t.append(S, M);
            }, D = (S) => {
              var M = ce(), O = t.child(M), rt = t.sibling(t.child(O), 2), kt = t.child(rt);
              t.reset(rt), t.reset(O);
              var qt = t.sibling(O, 2), ct = t.sibling(t.child(qt), 2), at = t.child(ct, !0);
              t.reset(ct), t.reset(qt), t.reset(M), t.template_effect(
                (vt) => {
                  t.set_text(kt, `${t.get(n).quantity_dispatched ?? ""} ${t.get(n).unit ?? ""}`), t.set_text(at, vt);
                },
                [
                  () => t.get(n).confirmed_at ? new Date(t.get(n).confirmed_at).toLocaleString("ro-RO") : "—"
                ]
              ), t.append(S, M);
            };
            t.if(B, (S) => {
              t.get(r) === "pending" ? S(I) : S(D, -1);
            });
          }
          var it = t.sibling(B, 2);
          t.reset(h), t.template_effect(() => {
            t.set_text(w, t.get(n).customer_name), t.set_text(u, t.get(n).item_name_from_invoice ?? "?"), t.set_text(N, t.get(n).lot_number ?? "—"), t.set_text(c, `${t.get(n).lot_qty_remaining ?? ""} ${t.get(n).unit ?? ""}`), t.set_text(U, `${t.get(n).quantity_invoiced ?? ""} ${t.get(n).unit ?? ""}`);
          }), t.delegated("click", it, () => t.set(n, null)), t.append(x, h);
        };
        t.if(R, (x) => {
          t.get(n) && x(G);
        });
      }
      t.reset(k), t.append(m, k);
    };
    t.if(q, (m) => {
      t.get(r) === "direct" ? m(A) : m(ot, -1);
    });
  }
  t.reset(wt), t.template_effect(() => {
    t.set_class(_t, 1, `tab ${t.get(r) === "pending" ? "tab-active" : ""}`), t.set_class(Z, 1, `tab ${t.get(r) === "confirmed" ? "tab-active" : ""}`), t.set_class(j, 1, `tab ${t.get(r) === "direct" ? "tab-active" : ""}`);
  }), t.delegated("click", _t, () => {
    t.set(r, "pending"), t.set(n, null);
  }), t.delegated("click", Z, () => {
    t.set(r, "confirmed"), t.set(n, null);
  }), t.delegated("click", j, () => {
    t.set(r, "direct"), t.set(n, null);
  }), t.append(Ct, wt), t.pop();
}
t.delegate(["click"]);
var ge = t.from_html('<h1 class="text-2xl font-bold font-mono"> </h1> <span> </span>', 1), be = t.from_html('<div class="alert alert-error"> </div>'), fe = t.from_html('<div class="flex justify-center py-12"><span class="loading loading-spinner loading-lg"></span></div>'), me = t.from_html('<button class="btn btn-success btn-sm"> </button>'), he = t.from_html('<div><span class="text-sm opacity-60">Alergeni:</span> </div>'), xe = t.from_html('<div><span class="text-sm opacity-60">Condiții:</span> </div>'), ye = t.from_html('<div><span class="text-sm opacity-60">BBD:</span> <span class="font-bold"> </span></div>'), we = t.from_html('<div><span class="text-sm opacity-60">Data producție:</span> </div>'), $e = t.from_html('<div><span class="text-sm opacity-60">CUI:</span> </div>'), ke = t.from_html('<div><span class="text-sm opacity-60">Lot furnizor:</span> <span class="font-mono"> </span></div>'), Se = t.from_html('<div><span class="text-sm opacity-60">Factură:</span> </div>'), Ce = t.from_html('<div><span class="text-sm opacity-60">Rând:</span> </div>'), je = t.from_html('<div><span class="text-sm opacity-60">Raft:</span> </div>'), qe = t.from_html('<div><span class="text-sm opacity-60">Zonă:</span> </div>'), Pe = t.from_html('<div class="grid grid-cols-1 md:grid-cols-2 gap-4"><div class="card bg-base-200 p-4 space-y-2"><h3 class="font-bold">Produs</h3> <div><span class="text-sm opacity-60">Denumire:</span> <span class="font-medium"> </span></div> <div><span class="text-sm opacity-60">Cod:</span> <span class="font-mono"> </span></div> <div><span class="text-sm opacity-60">Tip:</span> </div> <!> <!></div> <div class="card bg-base-200 p-4 space-y-2"><h3 class="font-bold">Cantitate & Valabilitate</h3> <div><span class="text-sm opacity-60">Inițial:</span> </div> <div><span class="text-sm opacity-60">Rămas:</span> <span class="font-bold"> </span></div> <!> <!> <div><span class="text-sm opacity-60">Data recepție:</span> </div></div> <div class="card bg-base-200 p-4 space-y-2"><h3 class="font-bold">Furnizor</h3> <div> </div> <!> <!> <!></div> <div class="card bg-base-200 p-4 space-y-2"><h3 class="font-bold">Locație</h3> <div> </div> <!> <!> <!></div></div>'), De = t.from_html('<div class="flex justify-center py-8"><span class="loading loading-spinner"></span></div>'), Te = t.from_html('<div class="card bg-base-200 p-4"><h3 class="font-bold mb-3">Materii prime (upstream)</h3> <pre class="text-sm font-mono whitespace-pre-wrap"> </pre></div>'), Re = t.from_html('<tr><td class="text-xs"> </td><td><span class="badge badge-sm badge-outline"> </span></td><td class="font-mono"> </td><td class="text-sm"> </td><td class="text-xs"> </td></tr>'), Oe = t.from_html('<tr><td colspan="5" class="text-center opacity-50 py-4">Nicio mișcare înregistrată</td></tr>'), ze = t.from_html('<div class="overflow-x-auto"><table class="table table-sm w-full"><thead><tr><th>Data/Ora</th><th>Tip</th><th>Cantitate</th><th>Referință</th><th>Locație</th></tr></thead><tbody><!><!></tbody></table></div>'), Ae = t.from_html('<div class="flex gap-2"><!> <button class="btn btn-outline btn-sm">🖨 Printează etichetă</button></div> <div class="tabs tabs-bordered"><button>Informații</button> <button>Arbore trasabilitate</button> <button>Cronologie</button></div> <!> <!> <!>', 1), Le = t.from_html('<div class="p-6 space-y-4"><div class="flex items-center gap-3"><a href="/admin/trace/lots" class="btn btn-ghost btn-sm">← Înapoi</a> <!></div> <!> <!></div>');
function Ne(Ct, bt) {
  t.push(bt, !0);
  const E = "/ext/operations/traceability";
  let r = t.state(null), W = t.state(t.proxy([])), K = t.state(null), z = t.state(!0), n = t.state(""), T = t.state("info"), s = t.state(!1);
  t.user_effect(() => {
    st();
  });
  async function st() {
    t.set(z, !0), t.set(n, "");
    try {
      const [g, Z] = await Promise.all([
        fetch(`${E}/lots/${bt.id}`),
        fetch(`${E}/tree/${bt.id}/timeline`)
      ]);
      if (!g.ok) throw new Error(await g.text());
      t.set(r, (await g.json()).data, !0), t.set(W, Z.ok ? (await Z.json()).data : [], !0);
    } catch (g) {
      t.set(n, g.message, !0);
    } finally {
      t.set(z, !1);
    }
  }
  async function Q() {
    if (!t.get(K))
      try {
        const g = await fetch(`${E}/tree/${bt.id}/upstream`);
        t.set(K, g.ok ? (await g.json()).data : null, !0);
      } catch {
      }
  }
  async function f() {
    if (confirm("Eliberați lotul din carantină?")) {
      t.set(s, !0);
      try {
        const g = await fetch(`${E}/lots/${bt.id}/release`, { method: "PATCH" });
        if (!g.ok) throw new Error(await g.text());
        await st();
      } catch (g) {
        alert(g.message);
      } finally {
        t.set(s, !1);
      }
    }
  }
  async function X() {
    window.open(`${E}/labels/${bt.id}`, "_blank");
  }
  function J(g) {
    return {
      available: "badge-success",
      quarantine: "badge-warning",
      exhausted: "badge-neutral",
      recalled: "badge-error",
      returned: "badge-info"
    }[g] ?? "badge-ghost";
  }
  function Y(g, Z = 0) {
    if (!g) return "";
    const j = "  ".repeat(Z), tt = g.status ? ` [${g.status}]` : "", et = `${j}${g.item_name ?? "?"} — ${g.lot_number ?? g.lot_id}${tt}`, q = (g.inputs ?? []).map((A) => Y(A, Z + 1)).join(`
`);
    return q ? `${et}
${q}` : et;
  }
  var gt = Le(), ft = t.child(gt), yt = t.sibling(t.child(ft), 2);
  {
    var jt = (g) => {
      var Z = ge(), j = t.first_child(Z), tt = t.child(j, !0);
      t.reset(j);
      var et = t.sibling(j, 2), q = t.child(et, !0);
      t.reset(et), t.template_effect(
        (A) => {
          t.set_text(tt, t.get(r).lot_number), t.set_class(et, 1, `badge ${A ?? ""}`), t.set_text(q, t.get(r).status);
        },
        [() => J(t.get(r).status)]
      ), t.append(g, Z);
    };
    t.if(yt, (g) => {
      t.get(r) && g(jt);
    });
  }
  t.reset(ft);
  var nt = t.sibling(ft, 2);
  {
    var wt = (g) => {
      var Z = be(), j = t.child(Z, !0);
      t.reset(Z), t.template_effect(() => t.set_text(j, t.get(n))), t.append(g, Z);
    };
    t.if(nt, (g) => {
      t.get(n) && g(wt);
    });
  }
  var mt = t.sibling(nt, 2);
  {
    var _t = (g) => {
      var Z = fe();
      t.append(g, Z);
    }, Dt = (g) => {
      var Z = Ae(), j = t.first_child(Z), tt = t.child(j);
      {
        var et = (x) => {
          var h = me(), o = t.child(h, !0);
          t.reset(h), t.template_effect(() => {
            h.disabled = t.get(s), t.set_text(o, t.get(s) ? "Se procesează..." : "✓ Eliberează din carantină");
          }), t.delegated("click", h, f), t.append(x, h);
        };
        t.if(tt, (x) => {
          t.get(r).status === "quarantine" && x(et);
        });
      }
      var q = t.sibling(tt, 2);
      t.reset(j);
      var A = t.sibling(j, 2), ot = t.child(A), m = t.sibling(ot, 2), k = t.sibling(m, 2);
      t.reset(A);
      var H = t.sibling(A, 2);
      {
        var v = (x) => {
          var h = Pe(), o = t.child(h), w = t.sibling(t.child(o), 2), L = t.sibling(t.child(w), 2), i = t.child(L, !0);
          t.reset(L), t.reset(w);
          var a = t.sibling(w, 2), u = t.sibling(t.child(a), 2), y = t.child(u, !0);
          t.reset(u), t.reset(a);
          var P = t.sibling(a, 2), N = t.sibling(t.child(P));
          t.reset(P);
          var e = t.sibling(P, 2);
          {
            var l = (C) => {
              var F = he(), xt = t.sibling(t.child(F));
              t.reset(F), t.template_effect((Nt) => t.set_text(xt, ` ${Nt ?? ""}`), [() => t.get(r).allergens.join(", ")]), t.append(C, F);
            };
            t.if(e, (C) => {
              var F;
              (F = t.get(r).allergens) != null && F.length && C(l);
            });
          }
          var d = t.sibling(e, 2);
          {
            var p = (C) => {
              var F = xe(), xt = t.sibling(t.child(F));
              t.reset(F), t.template_effect(() => t.set_text(xt, ` ${t.get(r).storage_conditions ?? ""}`)), t.append(C, F);
            };
            t.if(d, (C) => {
              t.get(r).storage_conditions && C(p);
            });
          }
          t.reset(o);
          var c = t.sibling(o, 2), $ = t.sibling(t.child(c), 2), V = t.sibling(t.child($));
          t.reset($);
          var U = t.sibling($, 2), dt = t.sibling(t.child(U), 2), pt = t.child(dt);
          t.reset(dt), t.reset(U);
          var B = t.sibling(U, 2);
          {
            var I = (C) => {
              var F = ye(), xt = t.sibling(t.child(F), 2), Nt = t.child(xt, !0);
              t.reset(xt), t.reset(F), t.template_effect(() => t.set_text(Nt, t.get(r).best_before_date)), t.append(C, F);
            };
            t.if(B, (C) => {
              t.get(r).best_before_date && C(I);
            });
          }
          var D = t.sibling(B, 2);
          {
            var it = (C) => {
              var F = we(), xt = t.sibling(t.child(F));
              t.reset(F), t.template_effect(() => t.set_text(xt, ` ${t.get(r).production_date ?? ""}`)), t.append(C, F);
            };
            t.if(D, (C) => {
              t.get(r).production_date && C(it);
            });
          }
          var S = t.sibling(D, 2), M = t.sibling(t.child(S));
          t.reset(S), t.reset(c);
          var O = t.sibling(c, 2), rt = t.sibling(t.child(O), 2), kt = t.child(rt, !0);
          t.reset(rt);
          var qt = t.sibling(rt, 2);
          {
            var ct = (C) => {
              var F = $e(), xt = t.sibling(t.child(F));
              t.reset(F), t.template_effect(() => t.set_text(xt, ` ${t.get(r).supplier_cui ?? ""}`)), t.append(C, F);
            };
            t.if(qt, (C) => {
              t.get(r).supplier_cui && C(ct);
            });
          }
          var at = t.sibling(qt, 2);
          {
            var vt = (C) => {
              var F = ke(), xt = t.sibling(t.child(F), 2), Nt = t.child(xt, !0);
              t.reset(xt), t.reset(F), t.template_effect(() => t.set_text(Nt, t.get(r).supplier_lot_ref)), t.append(C, F);
            };
            t.if(at, (C) => {
              t.get(r).supplier_lot_ref && C(vt);
            });
          }
          var ut = t.sibling(at, 2);
          {
            var Ot = (C) => {
              var F = Se(), xt = t.sibling(t.child(F));
              t.reset(F), t.template_effect(() => t.set_text(xt, ` ${t.get(r).invoice_ref ?? ""}`)), t.append(C, F);
            };
            t.if(ut, (C) => {
              t.get(r).invoice_ref && C(Ot);
            });
          }
          t.reset(O);
          var Pt = t.sibling(O, 2), ht = t.sibling(t.child(Pt), 2), $t = t.child(ht, !0);
          t.reset(ht);
          var St = t.sibling(ht, 2);
          {
            var Rt = (C) => {
              var F = Ce(), xt = t.sibling(t.child(F));
              t.reset(F), t.template_effect(() => t.set_text(xt, ` ${t.get(r).row ?? ""}`)), t.append(C, F);
            };
            t.if(St, (C) => {
              t.get(r).row && C(Rt);
            });
          }
          var lt = t.sibling(St, 2);
          {
            var Tt = (C) => {
              var F = je(), xt = t.sibling(t.child(F));
              t.reset(F), t.template_effect(() => t.set_text(xt, ` ${t.get(r).shelf ?? ""}`)), t.append(C, F);
            };
            t.if(lt, (C) => {
              t.get(r).shelf && C(Tt);
            });
          }
          var zt = t.sibling(lt, 2);
          {
            var At = (C) => {
              var F = qe(), xt = t.sibling(t.child(F));
              t.reset(F), t.template_effect(() => t.set_text(xt, ` ${t.get(r).temperature_zone ?? ""}`)), t.append(C, F);
            };
            t.if(zt, (C) => {
              t.get(r).temperature_zone && C(At);
            });
          }
          t.reset(Pt), t.reset(h), t.template_effect(
            (C) => {
              t.set_text(i, t.get(r).item_name), t.set_text(y, t.get(r).item_code), t.set_text(N, ` ${t.get(r).item_type ?? ""}`), t.set_text(V, ` ${t.get(r).quantity_initial ?? ""} ${t.get(r).unit ?? ""}`), t.set_text(pt, `${t.get(r).quantity_remaining ?? ""} ${t.get(r).unit ?? ""}`), t.set_text(M, ` ${C ?? ""}`), t.set_text(kt, t.get(r).supplier_name ?? "N/A"), t.set_text($t, t.get(r).warehouse ?? "Nespecificat");
            },
            [
              () => {
                var C;
                return t.get(r).reception_date ?? ((C = t.get(r).created_at) == null ? void 0 : C.slice(0, 10));
              }
            ]
          ), t.append(x, h);
        };
        t.if(H, (x) => {
          t.get(T) === "info" && x(v);
        });
      }
      var _ = t.sibling(H, 2);
      {
        var b = (x) => {
          var h = t.comment(), o = t.first_child(h);
          {
            var w = (i) => {
              var a = De();
              t.append(i, a);
            }, L = (i) => {
              var a = Te(), u = t.sibling(t.child(a), 2), y = t.child(u, !0);
              t.reset(u), t.reset(a), t.template_effect((P) => t.set_text(y, P), [() => Y(t.get(K))]), t.append(i, a);
            };
            t.if(o, (i) => {
              t.get(K) ? i(L, -1) : i(w);
            });
          }
          t.append(x, h);
        };
        t.if(_, (x) => {
          t.get(T) === "tree" && x(b);
        });
      }
      var R = t.sibling(_, 2);
      {
        var G = (x) => {
          var h = ze(), o = t.child(h), w = t.sibling(t.child(o)), L = t.child(w);
          t.each(L, 17, () => t.get(W), t.index, (u, y) => {
            var P = Re(), N = t.child(P), e = t.child(N, !0);
            t.reset(N);
            var l = t.sibling(N), d = t.child(l), p = t.child(d, !0);
            t.reset(d), t.reset(l);
            var c = t.sibling(l), $ = t.child(c);
            t.reset(c);
            var V = t.sibling(c), U = t.child(V, !0);
            t.reset(V);
            var dt = t.sibling(V), pt = t.child(dt, !0);
            t.reset(dt), t.reset(P), t.template_effect(
              (B, I) => {
                t.set_text(e, B), t.set_text(p, t.get(y).type), t.set_text($, `${t.get(y).quantity > 0 ? "+" : ""}${t.get(y).quantity ?? ""} ${t.get(y).unit ?? ""}`), t.set_text(U, t.get(y).reference_number ?? "—"), t.set_text(pt, I);
              },
              [
                () => new Date(t.get(y).performed_at).toLocaleString("ro-RO"),
                () => [t.get(y).from_warehouse, t.get(y).to_warehouse].filter(Boolean).join(" → ") || "—"
              ]
            ), t.append(u, P);
          });
          var i = t.sibling(L);
          {
            var a = (u) => {
              var y = Oe();
              t.append(u, y);
            };
            t.if(i, (u) => {
              t.get(W).length === 0 && u(a);
            });
          }
          t.reset(w), t.reset(o), t.reset(h), t.append(x, h);
        };
        t.if(R, (x) => {
          t.get(T) === "timeline" && x(G);
        });
      }
      t.template_effect(() => {
        t.set_class(ot, 1, `tab ${t.get(T) === "info" ? "tab-active" : ""}`), t.set_class(m, 1, `tab ${t.get(T) === "tree" ? "tab-active" : ""}`), t.set_class(k, 1, `tab ${t.get(T) === "timeline" ? "tab-active" : ""}`);
      }), t.delegated("click", q, X), t.delegated("click", ot, () => t.set(T, "info")), t.delegated("click", m, () => {
        t.set(T, "tree"), Q();
      }), t.delegated("click", k, () => t.set(T, "timeline")), t.append(g, Z);
    };
    t.if(mt, (g) => {
      t.get(z) ? g(_t) : t.get(r) && g(Dt, 1);
    });
  }
  t.reset(gt), t.append(Ct, gt), t.pop();
}
t.delegate(["click"]);
var Ie = t.from_html('<div class="alert alert-success mb-4"><div><div class="font-bold">Lot creat cu succes: <span class="font-mono"> </span></div> <div class="text-sm">Statusul inițial: carantină. Eliberați lotul după verificare.</div> <div class="mt-2 flex gap-2"><a class="btn btn-sm btn-success">Detalii lot</a> <a target="_blank" class="btn btn-sm btn-outline">🖨 Printează etichetă</a></div></div></div>'), Fe = t.from_html('<div class="alert alert-error mb-4"> </div>'), Ee = t.from_html("<option> </option>"), Je = t.from_html("<option> </option>"), Ue = t.from_html("<option> </option>"), Ve = t.from_html("<option> </option>"), Be = t.from_html('<div class="p-6 max-w-2xl"><h1 class="text-2xl font-bold mb-6">Recepție materie primă</h1> <!> <!> <form class="space-y-4"><div class="card bg-base-200 p-4"><h3 class="font-semibold mb-2">Scanare GS1 (opțional)</h3> <div class="flex gap-2"><input type="text" class="input input-bordered flex-1" placeholder="Scanați codul GS1-128 de pe eticheta furnizorului..."/> <button type="button" class="btn btn-outline btn-sm">Parsează</button></div></div> <div class="grid grid-cols-2 gap-4"><div class="col-span-2"><label class="label"><span class="label-text font-medium">Produs *</span></label> <select class="select select-bordered w-full" required=""><option>Selectați produsul...</option><!></select></div> <div><label class="label"><span class="label-text font-medium">Cantitate *</span></label> <input type="number" class="input input-bordered w-full" min="0.001" step="0.001" required=""/></div> <div><label class="label"><span class="label-text font-medium">Unitate *</span></label> <select class="select select-bordered w-full"></select></div> <div><label class="label"><span class="label-text font-medium">Furnizor</span></label> <select class="select select-bordered w-full"><option>—</option><!></select></div> <div><label class="label"><span class="label-text font-medium">Lot furnizor</span></label> <input type="text" class="input input-bordered w-full"/></div> <div><label class="label"><span class="label-text font-medium">Data valabilitate (BBD)</span></label> <input type="date" class="input input-bordered w-full"/></div> <div><label class="label"><span class="label-text font-medium">Data recepție *</span></label> <input type="date" class="input input-bordered w-full" required=""/></div> <div><label class="label"><span class="label-text font-medium">Factură / Aviz</span></label> <input type="text" class="input input-bordered w-full"/></div> <div><label class="label"><span class="label-text font-medium">Locație</span></label> <select class="select select-bordered w-full"><option>—</option><!></select></div> <div class="col-span-2"><label class="label"><span class="label-text font-medium">Note</span></label> <textarea class="textarea textarea-bordered w-full" rows="2"></textarea></div></div> <div class="flex justify-end gap-3"><a href="/admin/trace/lots" class="btn btn-ghost">Anulează</a> <button type="submit" class="btn btn-primary"> </button></div></form></div>');
function Ge(Ct, bt) {
  t.push(bt, !0);
  const E = "/ext/operations/traceability";
  let r = t.state(t.proxy([])), W = t.state(t.proxy([])), K = t.state(t.proxy([])), z = t.state(!1), n = t.state(null), T = t.state(""), s = t.state(t.proxy({
    item_id: "",
    lot_type: "inbound",
    quantity_initial: "",
    unit: "kg",
    supplier_id: "",
    supplier_lot_ref: "",
    best_before_date: "",
    production_date: "",
    reception_date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
    invoice_ref: "",
    location_id: "",
    notes: "",
    gs1_raw: ""
  }));
  t.user_effect(() => {
    Promise.all([
      fetch(`${E}/items?type=raw`).then((e) => e.json()).then((e) => {
        t.set(r, e.data ?? [], !0);
      }),
      fetch(`${E}/suppliers`).then((e) => e.json()).then((e) => {
        t.set(W, e.data ?? [], !0);
      }),
      fetch(`${E}/locations`).then((e) => e.json()).then((e) => {
        t.set(K, e.data ?? [], !0);
      })
    ]);
  });
  async function st() {
    if (t.get(s).gs1_raw.trim())
      try {
        const l = (await (await fetch(`${E}/scan/parse-gs1`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ raw: t.get(s).gs1_raw })
        })).json()).data;
        l.supplier_lot_ref && (t.get(s).supplier_lot_ref = l.supplier_lot_ref), l.best_before_date && (t.get(s).best_before_date = l.best_before_date);
      } catch {
      }
  }
  async function Q(e) {
    e.preventDefault(), t.set(z, !0), t.set(T, ""), t.set(n, null);
    try {
      const l = {
        item_id: t.get(s).item_id,
        lot_type: t.get(s).lot_type,
        quantity_initial: parseFloat(t.get(s).quantity_initial),
        unit: t.get(s).unit,
        reception_date: t.get(s).reception_date
      };
      t.get(s).supplier_id && (l.supplier_id = t.get(s).supplier_id), t.get(s).supplier_lot_ref && (l.supplier_lot_ref = t.get(s).supplier_lot_ref), t.get(s).best_before_date && (l.best_before_date = t.get(s).best_before_date), t.get(s).production_date && (l.production_date = t.get(s).production_date), t.get(s).invoice_ref && (l.invoice_ref = t.get(s).invoice_ref), t.get(s).location_id && (l.location_id = t.get(s).location_id), t.get(s).notes && (l.notes = t.get(s).notes);
      const d = await fetch(`${E}/lots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(l)
      });
      if (!d.ok) throw new Error(await d.text());
      t.set(n, (await d.json()).data, !0), t.set(
        s,
        {
          ...t.get(s),
          item_id: "",
          quantity_initial: "",
          supplier_lot_ref: "",
          best_before_date: "",
          production_date: "",
          invoice_ref: "",
          notes: "",
          gs1_raw: ""
        },
        !0
      );
    } catch (l) {
      t.set(T, l.message, !0);
    } finally {
      t.set(z, !1);
    }
  }
  var f = Be(), X = t.sibling(t.child(f), 2);
  {
    var J = (e) => {
      var l = Ie(), d = t.child(l), p = t.child(d), c = t.sibling(t.child(p)), $ = t.child(c, !0);
      t.reset(c), t.reset(p);
      var V = t.sibling(p, 4), U = t.child(V), dt = t.sibling(U, 2);
      t.reset(V), t.reset(d), t.reset(l), t.template_effect(() => {
        t.set_text($, t.get(n).lot_number), t.set_attribute(U, "href", `/admin/trace/lots/${t.get(n).id ?? ""}`), t.set_attribute(dt, "href", `/ext/operations/traceability/labels/${t.get(n).id ?? ""}`);
      }), t.append(e, l);
    };
    t.if(X, (e) => {
      t.get(n) && e(J);
    });
  }
  var Y = t.sibling(X, 2);
  {
    var gt = (e) => {
      var l = Fe(), d = t.child(l, !0);
      t.reset(l), t.template_effect(() => t.set_text(d, t.get(T))), t.append(e, l);
    };
    t.if(Y, (e) => {
      t.get(T) && e(gt);
    });
  }
  var ft = t.sibling(Y, 2), yt = t.child(ft), jt = t.sibling(t.child(yt), 2), nt = t.child(jt);
  t.remove_input_defaults(nt);
  var wt = t.sibling(nt, 2);
  t.reset(jt), t.reset(yt);
  var mt = t.sibling(yt, 2), _t = t.child(mt), Dt = t.sibling(t.child(_t), 2), g = t.child(Dt);
  g.value = g.__value = "";
  var Z = t.sibling(g);
  t.each(Z, 17, () => t.get(r), t.index, (e, l) => {
    var d = Ee(), p = t.child(d);
    t.reset(d);
    var c = {};
    t.template_effect(() => {
      t.set_text(p, `${t.get(l).name ?? ""} (${t.get(l).code ?? ""})`), c !== (c = t.get(l).id) && (d.value = (d.__value = t.get(l).id) ?? "");
    }), t.append(e, d);
  }), t.reset(Dt), t.reset(_t);
  var j = t.sibling(_t, 2), tt = t.sibling(t.child(j), 2);
  t.remove_input_defaults(tt), t.reset(j);
  var et = t.sibling(j, 2), q = t.sibling(t.child(et), 2);
  t.each(q, 20, () => ["kg", "g", "l", "ml", "buc", "cutie", "sac", "palet"], t.index, (e, l) => {
    var d = Je(), p = t.child(d, !0);
    t.reset(d);
    var c = {};
    t.template_effect(() => {
      t.set_text(p, l), c !== (c = l) && (d.value = (d.__value = l) ?? "");
    }), t.append(e, d);
  }), t.reset(q), t.reset(et);
  var A = t.sibling(et, 2), ot = t.sibling(t.child(A), 2), m = t.child(ot);
  m.value = m.__value = "";
  var k = t.sibling(m);
  t.each(k, 17, () => t.get(W), t.index, (e, l) => {
    var d = Ue(), p = t.child(d, !0);
    t.reset(d);
    var c = {};
    t.template_effect(() => {
      t.set_text(p, t.get(l).name), c !== (c = t.get(l).id) && (d.value = (d.__value = t.get(l).id) ?? "");
    }), t.append(e, d);
  }), t.reset(ot), t.reset(A);
  var H = t.sibling(A, 2), v = t.sibling(t.child(H), 2);
  t.remove_input_defaults(v), t.reset(H);
  var _ = t.sibling(H, 2), b = t.sibling(t.child(_), 2);
  t.remove_input_defaults(b), t.reset(_);
  var R = t.sibling(_, 2), G = t.sibling(t.child(R), 2);
  t.remove_input_defaults(G), t.reset(R);
  var x = t.sibling(R, 2), h = t.sibling(t.child(x), 2);
  t.remove_input_defaults(h), t.reset(x);
  var o = t.sibling(x, 2), w = t.sibling(t.child(o), 2), L = t.child(w);
  L.value = L.__value = "";
  var i = t.sibling(L);
  t.each(i, 17, () => t.get(K), t.index, (e, l) => {
    var d = Ve(), p = t.child(d);
    t.reset(d);
    var c = {};
    t.template_effect(() => {
      t.set_text(p, `${t.get(l).warehouse ?? ""}${t.get(l).row ? " / " + t.get(l).row : ""}${t.get(l).shelf ? " / " + t.get(l).shelf : ""}`), c !== (c = t.get(l).id) && (d.value = (d.__value = t.get(l).id) ?? "");
    }), t.append(e, d);
  }), t.reset(w), t.reset(o);
  var a = t.sibling(o, 2), u = t.sibling(t.child(a), 2);
  t.remove_textarea_child(u), t.reset(a), t.reset(mt);
  var y = t.sibling(mt, 2), P = t.sibling(t.child(y), 2), N = t.child(P, !0);
  t.reset(P), t.reset(y), t.reset(ft), t.reset(f), t.template_effect(() => {
    P.disabled = t.get(z), t.set_text(N, t.get(z) ? "Se salvează..." : "Salvează și creează lot");
  }), t.event("submit", ft, Q), t.delegated("change", nt, st), t.bind_value(nt, () => t.get(s).gs1_raw, (e) => t.get(s).gs1_raw = e), t.delegated("click", wt, st), t.bind_select_value(Dt, () => t.get(s).item_id, (e) => t.get(s).item_id = e), t.bind_value(tt, () => t.get(s).quantity_initial, (e) => t.get(s).quantity_initial = e), t.bind_select_value(q, () => t.get(s).unit, (e) => t.get(s).unit = e), t.bind_select_value(ot, () => t.get(s).supplier_id, (e) => t.get(s).supplier_id = e), t.bind_value(v, () => t.get(s).supplier_lot_ref, (e) => t.get(s).supplier_lot_ref = e), t.bind_value(b, () => t.get(s).best_before_date, (e) => t.get(s).best_before_date = e), t.bind_value(G, () => t.get(s).reception_date, (e) => t.get(s).reception_date = e), t.bind_value(h, () => t.get(s).invoice_ref, (e) => t.get(s).invoice_ref = e), t.bind_select_value(w, () => t.get(s).location_id, (e) => t.get(s).location_id = e), t.bind_value(u, () => t.get(s).notes, (e) => t.get(s).notes = e), t.append(Ct, f), t.pop();
}
t.delegate(["change", "click"]);
var He = t.from_html('<div class="alert alert-error"> </div>'), Me = t.from_html("<option> </option>"), Ke = t.from_html("<option> </option>"), Qe = t.from_html("<option> </option>"), Ze = t.from_html('<div class="card bg-base-200 p-4"><h3 class="font-bold mb-3">Ordin nou de producție</h3> <form class="grid grid-cols-2 gap-3"><div class="col-span-2"><label class="label-text font-medium">Produs finit *</label> <select class="select select-bordered w-full" required=""><option>Selectați produsul...</option><!></select></div> <div><label class="label-text">Rețetă (opțional)</label> <select class="select select-bordered w-full"><option>—</option><!></select></div> <div><label class="label-text">Cantitate planificată *</label> <div class="flex gap-2"><input type="number" class="input input-bordered flex-1" min="0.001" step="0.001" required=""/> <select class="select select-bordered w-24"></select></div></div> <div class="col-span-2 flex justify-end gap-2"><button type="button" class="btn btn-ghost btn-sm">Anulează</button> <button type="submit" class="btn btn-primary btn-sm">Creează</button></div></form></div>'), We = t.from_html('<tr><td class="font-mono text-xs"> </td><td class="text-sm"> </td><td><span> </span></td><td class="text-sm"> </td><td><button class="btn btn-ghost btn-xs">Deschide</button></td></tr>'), Xe = t.from_html('<tr><td colspan="5" class="text-center opacity-50 py-4">Niciun ordin</td></tr>'), Ye = t.from_html('<button class="btn btn-warning btn-sm w-full">▶ Pornește producția</button>'), ta = t.from_html("<option> </option>"), ea = t.from_html('<div class="card bg-base-200 p-4"><h4 class="font-semibold mb-2">Înregistrare consum materie primă</h4> <form class="flex gap-2"><select class="select select-bordered select-sm flex-1" required=""><option>Selectați lot...</option><!></select> <input type="number" class="input input-bordered input-sm w-24" placeholder="Cant." min="0.001" step="0.001" required=""/> <button type="submit" class="btn btn-primary btn-sm">+</button></form></div> <div class="card bg-base-200 p-4"><h4 class="font-semibold mb-2">Verificare CCP (HACCP)</h4> <form class="grid grid-cols-2 gap-2"><input type="text" class="input input-bordered input-sm col-span-2" placeholder="Punct CCP (ex: Temperatura coacere)" required=""/> <div class="flex gap-1"><input type="number" class="input input-bordered input-sm flex-1" placeholder="Valoare" step="0.1" required=""/> <input type="text" class="input input-bordered input-sm w-16" placeholder="UM"/></div> <div class="flex items-center gap-2"><input type="number" class="input input-bordered input-sm w-24" placeholder="Limită min" step="0.1"/> <label class="flex items-center gap-1 cursor-pointer"><input type="checkbox" class="checkbox checkbox-success checkbox-sm"/> <span class="text-sm">OK</span></label></div> <button type="submit" class="btn btn-sm btn-success col-span-2">Înregistrează CCP</button></form></div>', 1), aa = t.from_html('<div class="text-sm flex justify-between"><span class="font-mono"> </span> <span> </span> <span class="font-medium"> </span></div>'), ia = t.from_html('<div class="card bg-base-200 p-4"><h4 class="font-semibold mb-2"> </h4> <div class="space-y-1"></div></div>'), sa = t.from_html('<span class="opacity-60"> </span>'), ra = t.from_html('<div class="flex items-center gap-2 text-sm py-1 border-b border-base-300"><span> </span> <span> <strong> </strong></span> <!></div>'), la = t.from_html('<div class="card bg-base-200 p-4"><h4 class="font-semibold mb-2"> </h4> <!></div>'), na = t.from_html('<div class="space-y-3"><div class="card bg-base-200 p-4"><div class="flex items-center justify-between mb-2"><h3 class="font-bold font-mono"> </h3> <span> </span></div> <!></div> <!> <!> <!></div>'), oa = t.from_html('<div class="p-6 space-y-4"><div class="flex items-center justify-between"><h1 class="text-2xl font-bold">Ordine de producție</h1> <button class="btn btn-primary btn-sm">+ Ordin nou</button></div> <!> <!> <div class="flex gap-3"><select class="select select-bordered select-sm"><option>Toate</option><option>Draft</option><option>În execuție</option><option>Finalizat</option></select></div> <div class="grid grid-cols-1 lg:grid-cols-2 gap-4"><div class="overflow-x-auto"><table class="table table-sm w-full"><thead><tr><th>Număr</th><th>Produs finit</th><th>Status</th><th>Cant.</th><th></th></tr></thead><tbody><!><!></tbody></table></div> <!></div></div>');
function da(Ct, bt) {
  t.push(bt, !0);
  const E = "/ext/operations/traceability";
  let r = t.state(t.proxy([])), W = t.state(!0), K = t.state(""), z = t.state(""), n = t.state(!1), T = t.state(t.proxy([])), s = t.state(t.proxy([])), st = t.state(t.proxy([])), Q = t.proxy({
    output_item_id: "",
    recipe_id: "",
    planned_quantity: "",
    unit: "kg",
    notes: ""
  }), f = t.state(null), X = t.state(t.proxy({ lot_id: "", quantity_used: "" })), J = t.state(t.proxy({ ccp: "", value: "", unit: "°C", limit_min: "", ok: !0 })), Y = t.state(!1);
  t.user_effect(() => {
    gt(), fetch(`${E}/items?type=finished`).then((i) => i.json()).then((i) => {
      t.set(T, i.data ?? [], !0);
    }), fetch(`${E}/production/recipes`).then((i) => i.json()).then((i) => {
      t.set(s, i.data ?? [], !0);
    });
  }), t.user_effect(() => {
    t.get(z), gt();
  });
  async function gt() {
    t.set(W, !0);
    try {
      const i = new URLSearchParams();
      t.get(z) && i.set("status", t.get(z));
      const a = await fetch(`${E}/production?${i}`);
      t.set(r, a.ok ? (await a.json()).data : [], !0);
    } finally {
      t.set(W, !1);
    }
  }
  async function ft(i) {
    const a = await fetch(`${E}/lots?status=available&limit=200`);
    t.set(st, a.ok ? (await a.json()).data : [], !0);
  }
  async function yt(i) {
    i.preventDefault(), t.set(Y, !0), t.set(K, "");
    try {
      const a = await fetch(`${E}/production`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          output_item_id: Q.output_item_id,
          recipe_id: Q.recipe_id || void 0,
          planned_quantity: parseFloat(Q.planned_quantity),
          unit: Q.unit,
          notes: Q.notes || void 0
        })
      });
      if (!a.ok) throw new Error(await a.text());
      t.set(n, !1), await gt();
    } catch (a) {
      t.set(K, a.message, !0);
    } finally {
      t.set(Y, !1);
    }
  }
  async function jt(i) {
    var a;
    await fetch(`${E}/production/${i}/start`, { method: "PATCH" }), await gt(), ((a = t.get(f)) == null ? void 0 : a.id) === i && await nt(i);
  }
  async function nt(i) {
    const a = await fetch(`${E}/production/${i}`);
    a.ok && (t.set(f, (await a.json()).data, !0), await ft(t.get(f).output_lot_id));
  }
  async function wt(i) {
    i.preventDefault(), t.set(Y, !0), t.set(K, "");
    try {
      const a = await fetch(`${E}/production/${t.get(f).id}/consume`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lot_id: t.get(X).lot_id,
          quantity_used: parseFloat(t.get(X).quantity_used)
        })
      });
      if (!a.ok) throw new Error(await a.text());
      t.set(X, { lot_id: "", quantity_used: "" }, !0), await nt(t.get(f).id);
    } catch (a) {
      t.set(K, a.message, !0);
    } finally {
      t.set(Y, !1);
    }
  }
  async function mt(i) {
    i.preventDefault(), t.set(Y, !0);
    try {
      await fetch(`${E}/production/${t.get(f).id}/haccp`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          check: {
            ccp: t.get(J).ccp,
            value: parseFloat(t.get(J).value),
            unit: t.get(J).unit,
            limit_min: t.get(J).limit_min ? parseFloat(t.get(J).limit_min) : void 0,
            ok: t.get(J).ok,
            checked_at: (/* @__PURE__ */ new Date()).toISOString()
          }
        })
      }), t.set(J, { ccp: "", value: "", unit: "°C", limit_min: "", ok: !0 }, !0), await nt(t.get(f).id);
    } finally {
      t.set(Y, !1);
    }
  }
  function _t(i) {
    return {
      draft: "badge-ghost",
      in_progress: "badge-warning",
      completed: "badge-success",
      cancelled: "badge-error"
    }[i] ?? "badge-ghost";
  }
  var Dt = oa(), g = t.child(Dt), Z = t.sibling(t.child(g), 2);
  t.reset(g);
  var j = t.sibling(g, 2);
  {
    var tt = (i) => {
      var a = He(), u = t.child(a, !0);
      t.reset(a), t.template_effect(() => t.set_text(u, t.get(K))), t.append(i, a);
    };
    t.if(j, (i) => {
      t.get(K) && i(tt);
    });
  }
  var et = t.sibling(j, 2);
  {
    var q = (i) => {
      var a = Ze(), u = t.sibling(t.child(a), 2), y = t.child(u), P = t.sibling(t.child(y), 2), N = t.child(P);
      N.value = N.__value = "";
      var e = t.sibling(N);
      t.each(e, 17, () => t.get(T), t.index, (D, it) => {
        var S = Me(), M = t.child(S, !0);
        t.reset(S);
        var O = {};
        t.template_effect(() => {
          t.set_text(M, t.get(it).name), O !== (O = t.get(it).id) && (S.value = (S.__value = t.get(it).id) ?? "");
        }), t.append(D, S);
      }), t.reset(P), t.reset(y);
      var l = t.sibling(y, 2), d = t.sibling(t.child(l), 2), p = t.child(d);
      p.value = p.__value = "";
      var c = t.sibling(p);
      t.each(c, 17, () => t.get(s), t.index, (D, it) => {
        var S = Ke(), M = t.child(S);
        t.reset(S);
        var O = {};
        t.template_effect(() => {
          t.set_text(M, `${t.get(it).name ?? ""} v${t.get(it).version ?? ""}`), O !== (O = t.get(it).id) && (S.value = (S.__value = t.get(it).id) ?? "");
        }), t.append(D, S);
      }), t.reset(d), t.reset(l);
      var $ = t.sibling(l, 2), V = t.sibling(t.child($), 2), U = t.child(V);
      t.remove_input_defaults(U);
      var dt = t.sibling(U, 2);
      t.each(dt, 20, () => ["kg", "g", "l", "ml", "buc", "cutie", "sac", "palet"], t.index, (D, it) => {
        var S = Qe(), M = t.child(S, !0);
        t.reset(S);
        var O = {};
        t.template_effect(() => {
          t.set_text(M, it), O !== (O = it) && (S.value = (S.__value = it) ?? "");
        }), t.append(D, S);
      }), t.reset(dt), t.reset(V), t.reset($);
      var pt = t.sibling($, 2), B = t.child(pt), I = t.sibling(B, 2);
      t.reset(pt), t.reset(u), t.reset(a), t.template_effect(() => I.disabled = t.get(Y)), t.event("submit", u, yt), t.bind_select_value(P, () => Q.output_item_id, (D) => Q.output_item_id = D), t.bind_select_value(d, () => Q.recipe_id, (D) => Q.recipe_id = D), t.bind_value(U, () => Q.planned_quantity, (D) => Q.planned_quantity = D), t.bind_select_value(dt, () => Q.unit, (D) => Q.unit = D), t.delegated("click", B, () => t.set(n, !1)), t.append(i, a);
    };
    t.if(et, (i) => {
      t.get(n) && i(q);
    });
  }
  var A = t.sibling(et, 2), ot = t.child(A), m = t.child(ot);
  m.value = m.__value = "";
  var k = t.sibling(m);
  k.value = k.__value = "draft";
  var H = t.sibling(k);
  H.value = H.__value = "in_progress";
  var v = t.sibling(H);
  v.value = v.__value = "completed", t.reset(ot), t.reset(A);
  var _ = t.sibling(A, 2), b = t.child(_), R = t.child(b), G = t.sibling(t.child(R)), x = t.child(G);
  t.each(x, 17, () => t.get(r), t.index, (i, a) => {
    var u = We(), y = t.child(u), P = t.child(y, !0);
    t.reset(y);
    var N = t.sibling(y), e = t.child(N, !0);
    t.reset(N);
    var l = t.sibling(N), d = t.child(l), p = t.child(d, !0);
    t.reset(d), t.reset(l);
    var c = t.sibling(l), $ = t.child(c);
    t.reset(c);
    var V = t.sibling(c), U = t.child(V);
    t.reset(V), t.reset(u), t.template_effect(
      (dt) => {
        var pt;
        t.set_class(u, 1, t.clsx(((pt = t.get(f)) == null ? void 0 : pt.id) === t.get(a).id ? "bg-primary/10" : "")), t.set_text(P, t.get(a).order_number), t.set_text(e, t.get(a).output_item_name ?? "—"), t.set_class(d, 1, `badge badge-sm ${dt ?? ""}`), t.set_text(p, t.get(a).status), t.set_text($, `${t.get(a).planned_quantity ?? ""} ${t.get(a).unit ?? ""}`);
      },
      [() => _t(t.get(a).status)]
    ), t.delegated("click", U, () => nt(t.get(a).id)), t.append(i, u);
  });
  var h = t.sibling(x);
  {
    var o = (i) => {
      var a = Xe();
      t.append(i, a);
    };
    t.if(h, (i) => {
      t.get(r).length === 0 && !t.get(W) && i(o);
    });
  }
  t.reset(G), t.reset(R), t.reset(b);
  var w = t.sibling(b, 2);
  {
    var L = (i) => {
      var a = na(), u = t.child(a), y = t.child(u), P = t.child(y), N = t.child(P, !0);
      t.reset(P);
      var e = t.sibling(P, 2), l = t.child(e, !0);
      t.reset(e), t.reset(y);
      var d = t.sibling(y, 2);
      {
        var p = (B) => {
          var I = Ye();
          t.delegated("click", I, () => jt(t.get(f).id)), t.append(B, I);
        };
        t.if(d, (B) => {
          t.get(f).status === "draft" && B(p);
        });
      }
      t.reset(u);
      var c = t.sibling(u, 2);
      {
        var $ = (B) => {
          var I = ea(), D = t.first_child(I), it = t.sibling(t.child(D), 2), S = t.child(it), M = t.child(S);
          M.value = M.__value = "";
          var O = t.sibling(M);
          t.each(O, 17, () => t.get(st), t.index, (lt, Tt) => {
            var zt = ta(), At = t.child(zt);
            t.reset(zt);
            var C = {};
            t.template_effect(() => {
              t.set_text(At, `${t.get(Tt).lot_number ?? ""} — ${t.get(Tt).item_name ?? ""} (${t.get(Tt).quantity_remaining ?? ""} ${t.get(Tt).unit ?? ""})`), C !== (C = t.get(Tt).id) && (zt.value = (zt.__value = t.get(Tt).id) ?? "");
            }), t.append(lt, zt);
          }), t.reset(S);
          var rt = t.sibling(S, 2);
          t.remove_input_defaults(rt);
          var kt = t.sibling(rt, 2);
          t.reset(it), t.reset(D);
          var qt = t.sibling(D, 2), ct = t.sibling(t.child(qt), 2), at = t.child(ct);
          t.remove_input_defaults(at);
          var vt = t.sibling(at, 2), ut = t.child(vt);
          t.remove_input_defaults(ut);
          var Ot = t.sibling(ut, 2);
          t.remove_input_defaults(Ot), t.reset(vt);
          var Pt = t.sibling(vt, 2), ht = t.child(Pt);
          t.remove_input_defaults(ht);
          var $t = t.sibling(ht, 2), St = t.child($t);
          t.remove_input_defaults(St), t.next(2), t.reset($t), t.reset(Pt);
          var Rt = t.sibling(Pt, 2);
          t.reset(ct), t.reset(qt), t.template_effect(() => {
            kt.disabled = t.get(Y), Rt.disabled = t.get(Y);
          }), t.event("submit", it, wt), t.bind_select_value(S, () => t.get(X).lot_id, (lt) => t.get(X).lot_id = lt), t.bind_value(rt, () => t.get(X).quantity_used, (lt) => t.get(X).quantity_used = lt), t.event("submit", ct, mt), t.bind_value(at, () => t.get(J).ccp, (lt) => t.get(J).ccp = lt), t.bind_value(ut, () => t.get(J).value, (lt) => t.get(J).value = lt), t.bind_value(Ot, () => t.get(J).unit, (lt) => t.get(J).unit = lt), t.bind_value(ht, () => t.get(J).limit_min, (lt) => t.get(J).limit_min = lt), t.bind_checked(St, () => t.get(J).ok, (lt) => t.get(J).ok = lt), t.append(B, I);
        };
        t.if(c, (B) => {
          t.get(f).status === "in_progress" && B($);
        });
      }
      var V = t.sibling(c, 2);
      {
        var U = (B) => {
          var I = ia(), D = t.child(I), it = t.child(D);
          t.reset(D);
          var S = t.sibling(D, 2);
          t.each(S, 21, () => t.get(f).consumptions, t.index, (M, O) => {
            var rt = aa(), kt = t.child(rt), qt = t.child(kt, !0);
            t.reset(kt);
            var ct = t.sibling(kt, 2), at = t.child(ct, !0);
            t.reset(ct);
            var vt = t.sibling(ct, 2), ut = t.child(vt);
            t.reset(vt), t.reset(rt), t.template_effect(() => {
              t.set_text(qt, t.get(O).lot_number), t.set_text(at, t.get(O).item_name), t.set_text(ut, `${t.get(O).quantity_used ?? ""} ${t.get(O).unit ?? ""}`);
            }), t.append(M, rt);
          }), t.reset(S), t.reset(I), t.template_effect(() => t.set_text(it, `Consumuri (${t.get(f).consumptions.length ?? ""})`)), t.append(B, I);
        };
        t.if(V, (B) => {
          var I;
          (I = t.get(f).consumptions) != null && I.length && B(U);
        });
      }
      var dt = t.sibling(V, 2);
      {
        var pt = (B) => {
          var I = la(), D = t.child(I), it = t.child(D);
          t.reset(D);
          var S = t.sibling(D, 2);
          t.each(S, 17, () => t.get(f).haccp_checks, t.index, (M, O) => {
            var rt = ra(), kt = t.child(rt), qt = t.child(kt, !0);
            t.reset(kt);
            var ct = t.sibling(kt, 2), at = t.child(ct), vt = t.sibling(at), ut = t.child(vt);
            t.reset(vt), t.reset(ct);
            var Ot = t.sibling(ct, 2);
            {
              var Pt = (ht) => {
                var $t = sa(), St = t.child($t);
                t.reset($t), t.template_effect(() => t.set_text(St, `min ${t.get(O).limit_min ?? ""}`)), t.append(ht, $t);
              };
              t.if(Ot, (ht) => {
                t.get(O).limit_min && ht(Pt);
              });
            }
            t.reset(rt), t.template_effect(() => {
              t.set_class(kt, 1, t.clsx(t.get(O).ok ? "text-success" : "text-error")), t.set_text(qt, t.get(O).ok ? "✓" : "✗"), t.set_text(at, `${t.get(O).ccp ?? ""}: `), t.set_text(ut, `${t.get(O).value ?? ""} ${t.get(O).unit ?? ""}`);
            }), t.append(M, rt);
          }), t.reset(I), t.template_effect(() => t.set_text(it, `Verificări CCP (${t.get(f).haccp_checks.length ?? ""})`)), t.append(B, I);
        };
        t.if(dt, (B) => {
          var I;
          (I = t.get(f).haccp_checks) != null && I.length && B(pt);
        });
      }
      t.reset(a), t.template_effect(
        (B) => {
          t.set_text(N, t.get(f).order_number), t.set_class(e, 1, `badge ${B ?? ""}`), t.set_text(l, t.get(f).status);
        },
        [() => _t(t.get(f).status)]
      ), t.append(i, a);
    };
    t.if(w, (i) => {
      t.get(f) && i(L);
    });
  }
  t.reset(_), t.reset(Dt), t.delegated("click", Z, () => t.set(n, !0)), t.bind_select_value(ot, () => t.get(z), (i) => t.set(z, i)), t.append(Ct, Dt), t.pop();
}
t.delegate(["click"]);
var ca = t.from_html('<span class="badge badge-error badge-sm ml-1"> </span>'), va = t.from_html('<div class="alert alert-error"> </div>'), _a = t.from_html('<div class="text-sm flex justify-between py-1 border-b border-base-300"><span class="font-mono"> </span> <span> </span> <span> </span> <span class="badge badge-sm badge-outline"> </span></div>'), pa = t.from_html('<div class="card bg-base-200 p-4"><h4 class="font-semibold mb-2">Loturi finite afectate</h4> <div class="space-y-1"></div></div>'), ua = t.from_html('<div><div><div class="font-bold text-lg">Acțiune recomandată: <span class="uppercase"> </span></div> <div class="mt-2 grid grid-cols-3 gap-4 text-center"><div><div class="text-3xl font-bold"> </div> <div class="text-sm">Loturi afectate</div></div> <div><div class="text-3xl font-bold"> </div> <div class="text-sm">Clienți afectați</div></div> <div><div class="text-3xl font-bold"> </div> <div class="text-sm">Livrări afectate</div></div></div></div></div> <!> <div class="card bg-base-200 p-4"><h3 class="font-bold text-error mb-3">⚠ Pasul 2 — Declanșare recall REAL</h3> <p class="text-sm mb-3 opacity-70">Aceasta va marca toate loturile afectate ca "recalled" și va crea un dosar oficial.</p> <form class="space-y-3"><div><label class="label-text font-medium">Motiv recall *</label> <textarea class="textarea textarea-bordered w-full" rows="2" placeholder="Descrieți motivul retragerii (min 10 caractere)..." required=""></textarea></div> <div><label class="label-text font-medium">Tip recall</label> <select class="select select-bordered w-full"><option>Internal (fără distribuție externă)</option><option>Retragere de pe piață</option><option>Recall consumatori</option></select></div> <button type="submit" class="btn btn-error w-full"> </button></form></div>', 1), ga = t.from_html('<div class="alert alert-success">Recall declanșat cu succes. ID: <span class="font-mono"> </span></div>'), ba = t.from_html('<div class="max-w-xl space-y-4"><div class="card bg-base-200 p-4"><h3 class="font-semibold mb-3">Pasul 1 — Identificați lotul suspect</h3> <div class="flex gap-2"><input type="text" class="input input-bordered flex-1" placeholder="UUID lot sau scanați QR-ul..."/> <button class="btn btn-primary"> </button></div></div> <!> <!> <!></div>'), fa = t.from_html('<div class="flex justify-center py-8"><span class="loading loading-spinner"></span></div>'), ma = t.from_html('<div class="text-center opacity-50 py-12">Niciun recall activ</div>'), ha = t.from_html('<form class="mt-3 flex gap-2"><input type="text" class="input input-bordered input-sm flex-1" placeholder="Note rezolvare (min 5 caractere)..." required=""/> <button type="submit" class="btn btn-sm btn-success">Confirmă</button> <button type="button" class="btn btn-sm btn-ghost">Anulează</button></form>'), xa = t.from_html('<div class="card bg-base-200 p-4"><div class="flex items-start justify-between"><div><div class="font-bold"> <span class="font-mono"> </span></div> <div class="text-sm opacity-70"> </div> <div class="text-sm mt-1"> </div> <span class="badge badge-error badge-sm mt-1"> </span></div> <button class="btn btn-sm btn-outline">Rezolvă</button></div> <!></div>'), ya = t.from_html('<div class="space-y-3"></div>'), wa = t.from_html('<div class="p-6 space-y-4"><h1 class="text-2xl font-bold">Recall / Retragere produs</h1> <div class="tabs tabs-bordered"><button>Simulator recall</button> <button>Recall-uri active <!></button></div> <!> <!></div>');
function $a(Ct, bt) {
  t.push(bt, !0);
  const E = "/ext/operations/traceability";
  let r = t.state("simulate"), W = t.state(t.proxy([])), K = t.state(!1), z = t.state(""), n = t.state(!1), T = t.state(null), s = t.state(""), st = t.proxy({ reason: "", scope: "internal" }), Q = t.state(!1), f = t.state(null), X = t.state(t.proxy({ recallId: "", resolution_notes: "" })), J = t.state(!1);
  t.user_effect(() => {
    t.get(r) === "active" && Y();
  });
  async function Y() {
    t.set(K, !0);
    const q = await fetch(`${E}/recalls?status=active`);
    t.set(W, q.ok ? (await q.json()).data : [], !0), t.set(K, !1);
  }
  async function gt() {
    if (t.get(z).trim()) {
      t.set(n, !0), t.set(s, ""), t.set(T, null), t.set(f, null);
      try {
        const q = await fetch(`${E}/recalls/simulate/${t.get(z).trim()}`, { method: "POST" });
        if (!q.ok) throw new Error(await q.text());
        t.set(T, (await q.json()).data, !0);
      } catch (q) {
        t.set(s, q.message, !0);
      } finally {
        t.set(n, !1);
      }
    }
  }
  async function ft(q) {
    if (q.preventDefault(), !!confirm(`Confirmați declanșarea unui recall REAL (${st.scope})?`)) {
      t.set(Q, !0), t.set(s, "");
      try {
        const A = await fetch(`${E}/recalls/initiate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lot_id: t.get(z).trim(),
            reason: st.reason,
            scope: st.scope
          })
        });
        if (!A.ok) throw new Error(await A.text());
        t.set(f, (await A.json()).data, !0), t.set(T, null), await Y();
      } catch (A) {
        t.set(s, A.message, !0);
      } finally {
        t.set(Q, !1);
      }
    }
  }
  async function yt(q) {
    q.preventDefault(), t.set(J, !0);
    try {
      const A = await fetch(`${E}/recalls/${t.get(X).recallId}/resolve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolution_notes: t.get(X).resolution_notes })
      });
      if (!A.ok) throw new Error(await A.text());
      t.set(X, { recallId: "", resolution_notes: "" }, !0), await Y();
    } finally {
      t.set(J, !1);
    }
  }
  function jt(q) {
    return {
      consumer_recall: "alert-error",
      market_withdrawal: "alert-warning",
      internal: "alert-info"
    }[q] ?? "alert-info";
  }
  var nt = wa(), wt = t.sibling(t.child(nt), 2), mt = t.child(wt), _t = t.sibling(mt, 2), Dt = t.sibling(t.child(_t));
  {
    var g = (q) => {
      var A = ca(), ot = t.child(A, !0);
      t.reset(A), t.template_effect(() => t.set_text(ot, t.get(W).length)), t.append(q, A);
    };
    t.if(Dt, (q) => {
      t.get(W).length && q(g);
    });
  }
  t.reset(_t), t.reset(wt);
  var Z = t.sibling(wt, 2);
  {
    var j = (q) => {
      var A = ba(), ot = t.child(A), m = t.sibling(t.child(ot), 2), k = t.child(m);
      t.remove_input_defaults(k);
      var H = t.sibling(k, 2), v = t.child(H, !0);
      t.reset(H), t.reset(m), t.reset(ot);
      var _ = t.sibling(ot, 2);
      {
        var b = (o) => {
          var w = va(), L = t.child(w, !0);
          t.reset(w), t.template_effect(() => t.set_text(L, t.get(s))), t.append(o, w);
        };
        t.if(_, (o) => {
          t.get(s) && o(b);
        });
      }
      var R = t.sibling(_, 2);
      {
        var G = (o) => {
          var w = ua(), L = t.first_child(w), i = t.child(L), a = t.child(i), u = t.sibling(t.child(a)), y = t.child(u, !0);
          t.reset(u), t.reset(a);
          var P = t.sibling(a, 2), N = t.child(P), e = t.child(N), l = t.child(e, !0);
          t.reset(e), t.next(2), t.reset(N);
          var d = t.sibling(N, 2), p = t.child(d), c = t.child(p, !0);
          t.reset(p), t.next(2), t.reset(d);
          var $ = t.sibling(d, 2), V = t.child($), U = t.child(V, !0);
          t.reset(V), t.next(2), t.reset($), t.reset(P), t.reset(i), t.reset(L);
          var dt = t.sibling(L, 2);
          {
            var pt = (at) => {
              var vt = pa(), ut = t.sibling(t.child(vt), 2);
              t.each(ut, 21, () => t.get(T).affected_lots, t.index, (Ot, Pt) => {
                var ht = _a(), $t = t.child(ht), St = t.child($t, !0);
                t.reset($t);
                var Rt = t.sibling($t, 2), lt = t.child(Rt, !0);
                t.reset(Rt);
                var Tt = t.sibling(Rt, 2), zt = t.child(Tt);
                t.reset(Tt);
                var At = t.sibling(Tt, 2), C = t.child(At, !0);
                t.reset(At), t.reset(ht), t.template_effect(() => {
                  t.set_text(St, t.get(Pt).lot_number), t.set_text(lt, t.get(Pt).item_name), t.set_text(zt, `${t.get(Pt).quantity_remaining ?? ""} ${t.get(Pt).unit ?? ""}`), t.set_text(C, t.get(Pt).status);
                }), t.append(Ot, ht);
              }), t.reset(ut), t.reset(vt), t.append(at, vt);
            };
            t.if(dt, (at) => {
              t.get(T).affected_lots.length > 0 && at(pt);
            });
          }
          var B = t.sibling(dt, 2), I = t.sibling(t.child(B), 4), D = t.child(I), it = t.sibling(t.child(D), 2);
          t.remove_textarea_child(it), t.set_attribute(it, "minlength", 10), t.reset(D);
          var S = t.sibling(D, 2), M = t.sibling(t.child(S), 2), O = t.child(M);
          O.value = O.__value = "internal";
          var rt = t.sibling(O);
          rt.value = rt.__value = "market_withdrawal";
          var kt = t.sibling(rt);
          kt.value = kt.__value = "consumer_recall", t.reset(M), t.reset(S);
          var qt = t.sibling(S, 2), ct = t.child(qt, !0);
          t.reset(qt), t.reset(I), t.reset(B), t.template_effect(
            (at, vt, ut) => {
              t.set_class(L, 1, `alert ${at ?? ""}`), t.set_text(y, vt), t.set_text(l, t.get(T).total_lots_affected), t.set_text(c, t.get(T).total_customers_affected), t.set_text(U, t.get(T).affected_customers.length), qt.disabled = ut, t.set_text(ct, t.get(Q) ? "Se procesează..." : "🚨 Declanșează recall REAL");
            },
            [
              () => jt(t.get(T).recommended_action),
              () => t.get(T).recommended_action.replace("_", " "),
              () => t.get(Q) || !st.reason.trim()
            ]
          ), t.event("submit", I, ft), t.bind_value(it, () => st.reason, (at) => st.reason = at), t.bind_select_value(M, () => st.scope, (at) => st.scope = at), t.append(o, w);
        };
        t.if(R, (o) => {
          t.get(T) && o(G);
        });
      }
      var x = t.sibling(R, 2);
      {
        var h = (o) => {
          var w = ga(), L = t.sibling(t.child(w)), i = t.child(L, !0);
          t.reset(L), t.reset(w), t.template_effect(() => t.set_text(i, t.get(f).id)), t.append(o, w);
        };
        t.if(x, (o) => {
          t.get(f) && o(h);
        });
      }
      t.reset(A), t.template_effect(
        (o) => {
          H.disabled = o, t.set_text(v, t.get(n) ? "Calculez..." : "Simulare");
        },
        [() => t.get(n) || !t.get(z).trim()]
      ), t.bind_value(k, () => t.get(z), (o) => t.set(z, o)), t.delegated("click", H, gt), t.append(q, A);
    };
    t.if(Z, (q) => {
      t.get(r) === "simulate" && q(j);
    });
  }
  var tt = t.sibling(Z, 2);
  {
    var et = (q) => {
      var A = t.comment(), ot = t.first_child(A);
      {
        var m = (v) => {
          var _ = fa();
          t.append(v, _);
        }, k = (v) => {
          var _ = ma();
          t.append(v, _);
        }, H = (v) => {
          var _ = ya();
          t.each(_, 21, () => t.get(W), t.index, (b, R) => {
            var G = xa(), x = t.child(G), h = t.child(x), o = t.child(h), w = t.child(o), L = t.sibling(w), i = t.child(L, !0);
            t.reset(L), t.reset(o);
            var a = t.sibling(o, 2), u = t.child(a, !0);
            t.reset(a);
            var y = t.sibling(a, 2), P = t.child(y, !0);
            t.reset(y);
            var N = t.sibling(y, 2), e = t.child(N, !0);
            t.reset(N), t.reset(h);
            var l = t.sibling(h, 2);
            t.reset(x);
            var d = t.sibling(x, 2);
            {
              var p = (c) => {
                var $ = ha(), V = t.child($);
                t.remove_input_defaults(V), t.set_attribute(V, "minlength", 5);
                var U = t.sibling(V, 2), dt = t.sibling(U, 2);
                t.reset($), t.template_effect(() => U.disabled = t.get(J)), t.event("submit", $, yt), t.bind_value(V, () => t.get(X).resolution_notes, (pt) => t.get(X).resolution_notes = pt), t.delegated("click", dt, () => t.set(X, { recallId: "", resolution_notes: "" }, !0)), t.append(c, $);
              };
              t.if(d, (c) => {
                t.get(X).recallId === t.get(R).id && c(p);
              });
            }
            t.reset(G), t.template_effect(
              (c, $) => {
                t.set_text(w, `${t.get(R).item_name ?? ""} — `), t.set_text(i, t.get(R).lot_number), t.set_text(u, c), t.set_text(P, t.get(R).reason), t.set_text(e, $);
              },
              [
                () => new Date(t.get(R).initiated_at).toLocaleString("ro-RO"),
                () => t.get(R).scope.replace("_", " ")
              ]
            ), t.delegated("click", l, () => {
              t.get(X).recallId = t.get(R).id;
            }), t.append(b, G);
          }), t.reset(_), t.append(v, _);
        };
        t.if(ot, (v) => {
          t.get(K) ? v(m) : t.get(W).length === 0 ? v(k, 1) : v(H, -1);
        });
      }
      t.append(q, A);
    };
    t.if(tt, (q) => {
      t.get(r) === "active" && q(et);
    });
  }
  t.reset(nt), t.template_effect(() => {
    t.set_class(mt, 1, `tab ${t.get(r) === "simulate" ? "tab-active" : ""}`), t.set_class(_t, 1, `tab ${t.get(r) === "active" ? "tab-active" : ""}`);
  }), t.delegated("click", mt, () => t.set(r, "simulate")), t.delegated("click", _t, () => t.set(r, "active")), t.append(Ct, nt), t.pop();
}
t.delegate(["click"]);
var ka = t.from_html('<div><label class="label-text text-sm">De la</label> <input type="date" class="input input-bordered input-sm"/></div> <div><label class="label-text text-sm">Până la</label> <input type="date" class="input input-bordered input-sm"/></div>', 1), Sa = t.from_html('<button class="btn btn-outline btn-sm">⬇ Descarcă CSV</button>'), Ca = t.from_html('<div class="alert alert-error"> </div>'), ja = t.from_html('<div class="text-sm opacity-60"> <!> <!></div>'), qa = t.from_html('<th class="whitespace-nowrap"> </th>'), Pa = t.from_html('<span class="font-mono text-xs opacity-70"> </span>'), Da = t.from_html('<td class="whitespace-nowrap max-w-xs overflow-hidden text-ellipsis"><!></td>'), Ta = t.from_html("<tr></tr>"), Ra = t.from_html('<div class="overflow-x-auto" style="max-height: 60vh;"><table class="table table-xs table-zebra w-full"><thead><tr></tr></thead><tbody></tbody></table></div>'), Oa = t.from_html('<div class="text-center opacity-50 py-12">Selectați parametrii și apăsați "Generează" pentru a vedea raportul.</div>'), za = t.from_html('<div class="p-6 space-y-4"><h1 class="text-2xl font-bold">Rapoarte</h1> <div class="flex flex-wrap gap-3 items-end"><div><label class="label-text text-sm">Raport</label> <select class="select select-bordered select-sm"><option>Registru Trasabilitate ANSVSA (Ord. 111/2008)</option><option>Jurnal Recepții</option><option>Jurnal Consumuri</option><option>Stoc Curent (snapshot)</option><option>Registru HACCP / CCP</option></select></div> <!> <button class="btn btn-primary btn-sm"> </button> <!></div> <!> <!> <!></div>');
function Aa(Ct, bt) {
  t.push(bt, !0);
  const E = "/ext/operations/traceability";
  let r = t.state("ansvsa"), W = t.state(t.proxy(new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10))), K = t.state(t.proxy((/* @__PURE__ */ new Date()).toISOString().slice(0, 10))), z = t.state(!1), n = t.state(t.proxy([])), T = t.state(""), s = t.state(null);
  const st = {
    ansvsa: "ansvsa-traceability",
    reception: "reception-log",
    consumption: "consumption-log",
    stock: "stock-snapshot",
    haccp: "haccp-log"
  };
  async function Q() {
    t.set(z, !0), t.set(T, ""), t.set(n, [], !0), t.set(s, null);
    try {
      const v = new URLSearchParams();
      t.get(r) !== "stock" && (v.set("from", t.get(W)), v.set("to", t.get(K)));
      const _ = await fetch(`${E}/reports/${st[t.get(r)]}?${v}`);
      if (!_.ok) throw new Error(await _.text());
      const b = await _.json();
      t.set(n, b.data ?? [], !0), t.set(s, b.meta ?? null, !0);
    } catch (v) {
      t.set(T, v.message, !0);
    } finally {
      t.set(z, !1);
    }
  }
  function f() {
    const v = new URLSearchParams({ format: "csv" });
    t.get(r) !== "stock" && (v.set("from", t.get(W)), v.set("to", t.get(K))), window.open(`${E}/reports/${st[t.get(r)]}?${v}`, "_blank");
  }
  const X = t.derived(() => t.get(n).length > 0 ? Object.keys(t.get(n)[0]) : []);
  var J = za(), Y = t.sibling(t.child(J), 2), gt = t.child(Y), ft = t.sibling(t.child(gt), 2), yt = t.child(ft);
  yt.value = yt.__value = "ansvsa";
  var jt = t.sibling(yt);
  jt.value = jt.__value = "reception";
  var nt = t.sibling(jt);
  nt.value = nt.__value = "consumption";
  var wt = t.sibling(nt);
  wt.value = wt.__value = "stock";
  var mt = t.sibling(wt);
  mt.value = mt.__value = "haccp", t.reset(ft), t.reset(gt);
  var _t = t.sibling(gt, 2);
  {
    var Dt = (v) => {
      var _ = ka(), b = t.first_child(_), R = t.sibling(t.child(b), 2);
      t.remove_input_defaults(R), t.reset(b);
      var G = t.sibling(b, 2), x = t.sibling(t.child(G), 2);
      t.remove_input_defaults(x), t.reset(G), t.bind_value(R, () => t.get(W), (h) => t.set(W, h)), t.bind_value(x, () => t.get(K), (h) => t.set(K, h)), t.append(v, _);
    };
    t.if(_t, (v) => {
      t.get(r) !== "stock" && v(Dt);
    });
  }
  var g = t.sibling(_t, 2), Z = t.child(g, !0);
  t.reset(g);
  var j = t.sibling(g, 2);
  {
    var tt = (v) => {
      var _ = Sa();
      t.delegated("click", _, f), t.append(v, _);
    };
    t.if(j, (v) => {
      t.get(n).length > 0 && v(tt);
    });
  }
  t.reset(Y);
  var et = t.sibling(Y, 2);
  {
    var q = (v) => {
      var _ = Ca(), b = t.child(_, !0);
      t.reset(_), t.template_effect(() => t.set_text(b, t.get(T))), t.append(v, _);
    };
    t.if(et, (v) => {
      t.get(T) && v(q);
    });
  }
  var A = t.sibling(et, 2);
  {
    var ot = (v) => {
      var _ = ja(), b = t.child(_), R = t.sibling(b);
      {
        var G = (o) => {
          var w = t.text();
          t.template_effect(() => t.set_text(w, `| Perioadă: ${t.get(s).from ?? ""} — ${t.get(s).to ?? ""}`)), t.append(o, w);
        };
        t.if(R, (o) => {
          t.get(s).from && o(G);
        });
      }
      var x = t.sibling(R, 2);
      {
        var h = (o) => {
          var w = t.text();
          t.template_effect((L) => t.set_text(w, `| Generat la: ${L ?? ""}`), [
            () => new Date(t.get(s).generated_at).toLocaleString("ro-RO")
          ]), t.append(o, w);
        };
        t.if(x, (o) => {
          t.get(s).generated_at && o(h);
        });
      }
      t.reset(_), t.template_effect(() => t.set_text(b, `${t.get(s).count ?? t.get(n).length ?? ""} înregistrări `)), t.append(v, _);
    };
    t.if(A, (v) => {
      t.get(s) && v(ot);
    });
  }
  var m = t.sibling(A, 2);
  {
    var k = (v) => {
      var _ = Ra(), b = t.child(_), R = t.child(b), G = t.child(R);
      t.each(G, 21, () => t.get(X), t.index, (h, o) => {
        var w = qa(), L = t.child(w, !0);
        t.reset(w), t.template_effect(() => t.set_text(L, t.get(o))), t.append(h, w);
      }), t.reset(G), t.reset(R);
      var x = t.sibling(R);
      t.each(x, 21, () => t.get(n), t.index, (h, o) => {
        var w = Ta();
        t.each(w, 21, () => t.get(X), t.index, (L, i) => {
          var a = Da(), u = t.child(a);
          {
            var y = (N) => {
              var e = Pa(), l = t.child(e);
              t.reset(e), t.template_effect(
                (d, p) => {
                  t.set_attribute(e, "title", d), t.set_text(l, `[${p ?? ""}]`);
                },
                [
                  () => JSON.stringify(t.get(o)[t.get(i)]),
                  () => Array.isArray(t.get(o)[t.get(i)]) ? t.get(o)[t.get(i)].length + " items" : "obj"
                ]
              ), t.append(N, e);
            }, P = (N) => {
              var e = t.text();
              t.template_effect(() => t.set_text(e, t.get(o)[t.get(i)] ?? "—")), t.append(N, e);
            };
            t.if(u, (N) => {
              typeof t.get(o)[t.get(i)] == "object" && t.get(o)[t.get(i)] !== null ? N(y) : N(P, -1);
            });
          }
          t.reset(a), t.append(L, a);
        }), t.reset(w), t.append(h, w);
      }), t.reset(x), t.reset(b), t.reset(_), t.append(v, _);
    }, H = (v) => {
      var _ = Oa();
      t.append(v, _);
    };
    t.if(m, (v) => {
      t.get(n).length > 0 ? v(k) : t.get(z) || v(H, 1);
    });
  }
  t.reset(J), t.template_effect(() => {
    g.disabled = t.get(z), t.set_text(Z, t.get(z) ? "Se încarcă..." : "Generează");
  }), t.bind_select_value(ft, () => t.get(r), (v) => t.set(r, v)), t.delegated("click", g, Q), t.append(Ct, J), t.pop();
}
t.delegate(["click"]);
function La() {
  Lt({
    path: "trace/lots",
    component: Mt,
    label: "Loturi",
    icon: "Package",
    category: "traceability",
    parent: "Trasabilitate"
  }), Lt({
    path: "trace/lots/:id",
    component: Ne,
    hidden: !0
  }), Lt({
    path: "trace/reception",
    component: Ge,
    label: "Recepție",
    icon: "PackagePlus",
    category: "traceability",
    parent: "Trasabilitate"
  }), Lt({
    path: "trace/production",
    component: da,
    label: "Producție",
    icon: "Factory",
    category: "traceability",
    parent: "Trasabilitate"
  }), Lt({
    path: "trace/recalls",
    component: $a,
    label: "Recall / Retragere",
    icon: "AlertTriangle",
    category: "traceability",
    parent: "Trasabilitate"
  }), Lt({
    path: "trace/dispatches",
    component: ue,
    label: "Expedieri",
    icon: "Truck",
    category: "traceability",
    parent: "Trasabilitate"
  }), Lt({
    path: "trace/reports",
    component: Aa,
    label: "Rapoarte ANSVSA",
    icon: "FileText",
    category: "traceability",
    parent: "Trasabilitate"
  });
}
La();
export {
  La as default
};
