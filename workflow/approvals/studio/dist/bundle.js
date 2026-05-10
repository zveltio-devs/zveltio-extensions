import "svelte/internal/disclose-version";
import * as e from "svelte/internal/client";
import { onMount as pe } from "svelte";
var be = e.from_html("<button> </button>"), fe = e.from_html('<div class="flex justify-center py-12"><span class="loading loading-spinner loading-lg"></span></div>'), ue = e.from_html('<div class="card bg-base-200 text-center py-12"><p class="text-base-content/60">No approval requests found</p></div>'), me = e.from_html('<div class="flex gap-2 shrink-0"><button class="btn btn-success btn-sm">Approve</button> <button class="btn btn-error btn-sm btn-outline">Reject</button> <button class="btn btn-ghost btn-sm">Cancel</button></div>'), he = e.from_html('<div class="card bg-base-200"><div class="card-body p-4"><div class="flex items-start justify-between gap-4"><div class="flex-1"><div class="flex items-center gap-2 mb-1"><span class="font-semibold"> </span> <span> </span></div> <p class="text-sm text-base-content/60"> </p> <p class="text-xs text-base-content/40 mt-1"> </p></div> <!></div></div></div>'), xe = e.from_html('<div class="space-y-3"></div>'), we = e.from_html('<div class="space-y-6"><div class="flex items-center justify-between"><div><h1 class="text-2xl font-bold">Approval Requests</h1> <p class="text-base-content/60 text-sm mt-1">Track and manage approval workflows</p></div> <div class="flex gap-2"><a href="extensions/approvals/workflows" class="btn btn-ghost btn-sm">Workflows</a></div></div> <div class="flex gap-2"></div> <!></div>');
function ye(E, K) {
  e.push(K, !0);
  const k = window.__ZVELTIO_ENGINE_URL__ || "";
  let j = e.state(e.proxy([])), T = e.state(!0), u = e.state("all");
  pe(async () => {
    await p();
  });
  async function p() {
    e.set(T, !0);
    try {
      const s = e.get(u) !== "all" ? `?status=${e.get(u)}` : "", c = await (await fetch(`${k}/api/approvals${s}`, { credentials: "include" })).json();
      e.set(j, c.requests || [], !0);
    } finally {
      e.set(T, !1);
    }
  }
  e.user_effect(() => {
    e.get(
      u
      // reactive dependency
    ), p();
  });
  function N(s) {
    return {
      pending: "badge-warning",
      approved: "badge-success",
      rejected: "badge-error",
      cancelled: "badge-ghost"
    }[s] || "badge-ghost";
  }
  async function i(s, n) {
    const c = n === "rejected" ? prompt("Rejection reason (optional):") : void 0;
    await fetch(`${k}/api/approvals/${s}/decide`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision: n, comment: c })
    }), await p();
  }
  async function O(s) {
    confirm("Cancel this approval request?") && (await fetch(`${k}/api/approvals/${s}/cancel`, { method: "POST", credentials: "include" }), await p());
  }
  var P = we(), L = e.sibling(e.child(P), 2);
  e.each(L, 20, () => ["all", "pending", "approved", "rejected"], e.index, (s, n) => {
    var c = be(), d = e.child(c, !0);
    e.reset(c), e.template_effect(
      (C) => {
        e.set_class(c, 1, `btn btn-sm ${e.get(u) === n ? "btn-primary" : "btn-ghost"}`), e.set_text(d, C);
      },
      [() => n.charAt(0).toUpperCase() + n.slice(1)]
    ), e.delegated("click", c, () => e.set(u, n, !0)), e.append(s, c);
  }), e.reset(L);
  var Q = e.sibling(L, 2);
  {
    var X = (s) => {
      var n = fe();
      e.append(s, n);
    }, Y = (s) => {
      var n = ue();
      e.append(s, n);
    }, z = (s) => {
      var n = xe();
      e.each(n, 21, () => e.get(j), e.index, (c, d) => {
        var C = he(), B = e.child(C), J = e.child(B), I = e.child(J), M = e.child(I), t = e.child(M), r = e.child(t, !0);
        e.reset(t);
        var v = e.sibling(t, 2), o = e.child(v, !0);
        e.reset(v), e.reset(M);
        var g = e.sibling(M, 2), A = e.child(g);
        e.reset(g);
        var m = e.sibling(g, 2), h = e.child(m);
        e.reset(m), e.reset(I);
        var x = e.sibling(I, 2);
        {
          var S = (_) => {
            var f = me(), W = e.child(f), w = e.sibling(W, 2), $ = e.sibling(w, 2);
            e.reset(f), e.delegated("click", W, () => i(e.get(d).id, "approved")), e.delegated("click", w, () => i(e.get(d).id, "rejected")), e.delegated("click", $, () => O(e.get(d).id)), e.append(_, f);
          };
          e.if(x, (_) => {
            e.get(d).status === "pending" && _(S);
          });
        }
        e.reset(J), e.reset(B), e.reset(C), e.template_effect(
          (_, f) => {
            e.set_text(r, e.get(d).workflow_name), e.set_class(v, 1, `badge ${_ ?? ""} badge-sm`), e.set_text(o, e.get(d).status), e.set_text(A, `${e.get(d).collection ?? ""} / ${e.get(d).record_id ?? ""}`), e.set_text(h, `Requested by ${(e.get(d).requested_by_name || "unknown") ?? ""}
 · ${f ?? ""}`);
          },
          [
            () => N(e.get(d).status),
            () => new Date(e.get(d).requested_at).toLocaleDateString()
          ]
        ), e.append(c, C);
      }), e.reset(n), e.append(s, n);
    };
    e.if(Q, (s) => {
      e.get(T) ? s(X) : e.get(j).length === 0 ? s(Y, 1) : s(z, -1);
    });
  }
  e.reset(P), e.append(E, P), e.pop();
}
e.delegate(["click"]);
var ke = e.from_html('<div class="flex justify-center py-12"><span class="loading loading-spinner loading-lg"></span></div>'), $e = e.from_html('<div class="card bg-base-200 text-center py-12"><p class="text-base-content/60">No workflows yet</p> <button class="btn btn-primary btn-sm mt-4">Create First Workflow</button></div>'), je = e.from_html('<span class="badge badge-ghost badge-sm">inactive</span>'), Ce = e.from_html('<p class="text-sm text-base-content/50 mt-1"> </p>'), Ae = e.from_html('<span class="badge badge-info badge-sm"> </span>'), Se = e.from_html('<div class="card bg-base-200"><div class="card-body p-4"><div class="flex items-start justify-between"><div><div class="flex items-center gap-2"><h3 class="font-semibold"> </h3> <!></div> <p class="text-sm text-base-content/60 mt-0.5">Collection: <code class="font-mono"> </code></p> <!> <div class="mt-2 flex gap-2"><span class="badge badge-outline badge-sm"> </span> <!></div></div> <button class="btn btn-ghost btn-xs text-error">Delete</button></div></div></div>'), We = e.from_html('<div class="space-y-3"></div>'), Ee = e.from_html("<option> </option>"), Te = e.from_html('<button class="btn btn-ghost btn-xs text-error mt-1">✕</button>'), Ne = e.from_html('<div class="card bg-base-200"><div class="card-body p-3"><div class="flex gap-2 items-start"><div class="flex-1 space-y-2"><input type="text" placeholder="Step name (e.g. Manager Approval)" class="input input-sm w-full"/> <div class="flex gap-2"><select class="select select-sm flex-1"><option>Admin</option><option>Manager</option><option>Member</option></select> <input type="number" placeholder="Deadline (hours)" class="input input-sm w-40"/></div></div> <!></div></div></div>'), De = e.from_html('<span class="loading loading-spinner loading-sm"></span>'), Re = e.from_html('<dialog class="modal modal-open"><div class="modal-box w-11/12 max-w-2xl"><h3 class="font-bold text-lg mb-4">Create Workflow</h3> <div class="grid grid-cols-2 gap-4 mb-4"><div class="form-control col-span-2"><label class="label" for="workflow-name"><span class="label-text">Workflow name</span></label> <input id="workflow-name" type="text" placeholder="e.g. Document Approval" class="input"/></div> <div class="form-control col-span-2"><label class="label" for="workflow-collection"><span class="label-text">Collection</span></label> <select id="workflow-collection" class="select"><option>Select collection...</option><!></select></div> <div class="form-control"><label class="label" for="workflow-trigger-field"><span class="label-text">Trigger field (optional)</span></label> <input id="workflow-trigger-field" type="text" placeholder="status" class="input input-sm"/></div> <div class="form-control"><label class="label" for="workflow-trigger-value"><span class="label-text">Trigger value</span></label> <input id="workflow-trigger-value" type="text" placeholder="pending_approval" class="input input-sm"/></div></div> <div class="mb-4"><div class="flex items-center justify-between mb-2"><label class="label-text font-medium">Approval Steps</label> <button class="btn btn-ghost btn-xs">+ Add step</button></div> <div class="space-y-2"></div></div> <div class="modal-action"><button class="btn btn-ghost">Cancel</button> <button class="btn btn-primary"><!> Create</button></div></div> <button class="modal-backdrop"></button></dialog>'), Oe = e.from_html('<div class="space-y-6"><div class="flex items-center justify-between"><div><h1 class="text-2xl font-bold">Approval Workflows</h1> <p class="text-base-content/60 text-sm mt-1">Define multi-step approval processes</p></div> <button class="btn btn-primary btn-sm">+ New Workflow</button></div> <!></div> <!>', 1);
function Pe(E, K) {
  e.push(K, !0);
  const k = window.__ZVELTIO_ENGINE_URL__ || "";
  let j = e.state(e.proxy([])), T = e.state(e.proxy([])), u = e.state(!0), p = e.state(!1), N = e.state(!1), i = e.state(e.proxy({
    name: "",
    description: "",
    collection: "",
    trigger_field: "",
    trigger_value: "",
    steps: [{ name: "", approver_role: "manager", deadline_hours: null }]
  }));
  pe(async () => {
    await Promise.all([O(), P()]);
  });
  async function O() {
    e.set(u, !0);
    try {
      const r = await (await fetch(`${k}/api/approvals/workflows`, { credentials: "include" })).json();
      e.set(j, r.workflows || [], !0);
    } finally {
      e.set(u, !1);
    }
  }
  async function P() {
    const r = await (await fetch(`${k}/api/collections`, { credentials: "include" })).json();
    e.set(T, r.collections || [], !0);
  }
  function L() {
    e.get(i).steps = [
      ...e.get(i).steps,
      { name: "", approver_role: "manager", deadline_hours: null }
    ];
  }
  function Q(t) {
    e.get(i).steps = e.get(i).steps.filter((r, v) => v !== t);
  }
  async function X() {
    if (!(!e.get(i).name || !e.get(i).collection || e.get(i).steps.some((t) => !t.name))) {
      e.set(N, !0);
      try {
        const t = await fetch(`${k}/api/approvals/workflows`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(e.get(i))
        });
        if (!t.ok) {
          const r = await t.json();
          throw new Error(r.error || "Failed to create workflow");
        }
        e.set(p, !1), e.set(
          i,
          {
            name: "",
            description: "",
            collection: "",
            trigger_field: "",
            trigger_value: "",
            steps: [{ name: "", approver_role: "manager", deadline_hours: null }]
          },
          !0
        ), await O();
      } catch (t) {
        alert(t instanceof Error ? t.message : "Failed to create workflow");
      } finally {
        e.set(N, !1);
      }
    }
  }
  async function Y(t) {
    confirm("Delete this workflow?") && (await fetch(`${k}/api/approvals/workflows/${t}`, { method: "DELETE", credentials: "include" }), await O());
  }
  var z = Oe(), s = e.first_child(z), n = e.child(s), c = e.sibling(e.child(n), 2);
  e.reset(n);
  var d = e.sibling(n, 2);
  {
    var C = (t) => {
      var r = ke();
      e.append(t, r);
    }, B = (t) => {
      var r = $e(), v = e.sibling(e.child(r), 2);
      e.reset(r), e.delegated("click", v, () => e.set(p, !0)), e.append(t, r);
    }, J = (t) => {
      var r = We();
      e.each(r, 21, () => e.get(j), e.index, (v, o) => {
        var g = Se(), A = e.child(g), m = e.child(A), h = e.child(m), x = e.child(h), S = e.child(x), _ = e.child(S, !0);
        e.reset(S);
        var f = e.sibling(S, 2);
        {
          var W = (a) => {
            var l = je();
            e.append(a, l);
          };
          e.if(f, (a) => {
            e.get(o).is_active || a(W);
          });
        }
        e.reset(x);
        var w = e.sibling(x, 2), $ = e.sibling(e.child(w)), U = e.child($, !0);
        e.reset($), e.reset(w);
        var V = e.sibling(w, 2);
        {
          var q = (a) => {
            var l = Ce(), b = e.child(l, !0);
            e.reset(l), e.template_effect(() => e.set_text(b, e.get(o).description)), e.append(a, l);
          };
          e.if(V, (a) => {
            e.get(o).description && a(q);
          });
        }
        var F = e.sibling(V, 2), D = e.child(F), R = e.child(D);
        e.reset(D);
        var ee = e.sibling(D, 2);
        {
          var te = (a) => {
            var l = Ae(), b = e.child(l);
            e.reset(l), e.template_effect(() => e.set_text(b, `trigger: ${e.get(o).trigger_field ?? ""} = ${e.get(o).trigger_value ?? ""}`)), e.append(a, l);
          };
          e.if(ee, (a) => {
            e.get(o).trigger_field && a(te);
          });
        }
        e.reset(F), e.reset(h);
        var ae = e.sibling(h, 2);
        e.reset(m), e.reset(A), e.reset(g), e.template_effect(() => {
          e.set_text(_, e.get(o).name), e.set_text(U, e.get(o).collection), e.set_text(R, `${e.get(o).step_count ?? ""} steps`);
        }), e.delegated("click", ae, () => Y(e.get(o).id)), e.append(v, g);
      }), e.reset(r), e.append(t, r);
    };
    e.if(d, (t) => {
      e.get(u) ? t(C) : e.get(j).length === 0 ? t(B, 1) : t(J, -1);
    });
  }
  e.reset(s);
  var I = e.sibling(s, 2);
  {
    var M = (t) => {
      var r = Re(), v = e.child(r), o = e.sibling(e.child(v), 2), g = e.child(o), A = e.sibling(e.child(g), 2);
      e.remove_input_defaults(A), e.reset(g);
      var m = e.sibling(g, 2), h = e.sibling(e.child(m), 2), x = e.child(h);
      x.value = x.__value = "";
      var S = e.sibling(x);
      e.each(S, 17, () => e.get(T), e.index, (a, l) => {
        var b = Ee(), G = e.child(b, !0);
        e.reset(b);
        var Z = {};
        e.template_effect(() => {
          e.set_text(G, e.get(l).display_name || e.get(l).name), Z !== (Z = e.get(l).name) && (b.value = (b.__value = e.get(l).name) ?? "");
        }), e.append(a, b);
      }), e.reset(h), e.reset(m);
      var _ = e.sibling(m, 2), f = e.sibling(e.child(_), 2);
      e.remove_input_defaults(f), e.reset(_);
      var W = e.sibling(_, 2), w = e.sibling(e.child(W), 2);
      e.remove_input_defaults(w), e.reset(W), e.reset(o);
      var $ = e.sibling(o, 2), U = e.child($), V = e.sibling(e.child(U), 2);
      e.reset(U);
      var q = e.sibling(U, 2);
      e.each(q, 21, () => e.get(i).steps, e.index, (a, l, b) => {
        var G = Ne(), Z = e.child(G), ne = e.child(Z), se = e.child(ne), le = e.child(se);
        e.remove_input_defaults(le);
        var oe = e.sibling(le, 2), H = e.child(oe), ie = e.child(H);
        ie.value = ie.__value = "admin";
        var re = e.sibling(ie);
        re.value = re.__value = "manager";
        var de = e.sibling(re);
        de.value = de.__value = "member", e.reset(H);
        var ce = e.sibling(H, 2);
        e.remove_input_defaults(ce), e.reset(oe), e.reset(se);
        var ge = e.sibling(se, 2);
        {
          var _e = (y) => {
            var ve = Te();
            e.delegated("click", ve, () => Q(b)), e.append(y, ve);
          };
          e.if(ge, (y) => {
            e.get(i).steps.length > 1 && y(_e);
          });
        }
        e.reset(ne), e.reset(Z), e.reset(G), e.bind_value(le, () => e.get(l).name, (y) => e.get(l).name = y), e.bind_select_value(H, () => e.get(l).approver_role, (y) => e.get(l).approver_role = y), e.bind_value(ce, () => e.get(l).deadline_hours, (y) => e.get(l).deadline_hours = y), e.append(a, G);
      }), e.reset(q), e.reset($);
      var F = e.sibling($, 2), D = e.child(F), R = e.sibling(D, 2), ee = e.child(R);
      {
        var te = (a) => {
          var l = De();
          e.append(a, l);
        };
        e.if(ee, (a) => {
          e.get(N) && a(te);
        });
      }
      e.next(), e.reset(R), e.reset(F), e.reset(v);
      var ae = e.sibling(v, 2);
      e.reset(r), e.template_effect(() => R.disabled = e.get(N)), e.bind_value(A, () => e.get(i).name, (a) => e.get(i).name = a), e.bind_select_value(h, () => e.get(i).collection, (a) => e.get(i).collection = a), e.bind_value(f, () => e.get(i).trigger_field, (a) => e.get(i).trigger_field = a), e.bind_value(w, () => e.get(i).trigger_value, (a) => e.get(i).trigger_value = a), e.delegated("click", V, L), e.delegated("click", D, () => e.set(p, !1)), e.delegated("click", R, X), e.delegated("click", ae, () => e.set(p, !1)), e.append(t, r);
    };
    e.if(I, (t) => {
      e.get(p) && t(M);
    });
  }
  e.delegated("click", c, () => e.set(p, !0)), e.append(E, z), e.pop();
}
e.delegate(["click"]);
function Le() {
  const E = window.__zveltio;
  if (!E) {
    console.error("[approvals] Zveltio Studio API not available");
    return;
  }
  E.registerRoute({
    path: "approvals",
    component: ye,
    label: "Approvals",
    icon: "GitBranch",
    category: "workflow",
    children: [
      {
        path: "approvals/workflows",
        component: Pe,
        label: "Workflows",
        icon: "Workflow",
        category: "workflow"
      }
    ]
  });
}
Le();
export {
  Le as default
};
