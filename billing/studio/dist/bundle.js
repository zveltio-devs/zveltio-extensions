var se = Object.defineProperty;
var ae = (f, l, p) => l in f ? se(f, l, { enumerable: !0, configurable: !0, writable: !0, value: p }) : f[l] = p;
var X = (f, l, p) => ae(f, typeof l != "symbol" ? l + "" : l, p);
import "svelte/internal/disclose-version";
import * as e from "svelte/internal/client";
import { onMount as Q } from "svelte";
function ie() {
  if (typeof window > "u")
    return null;
  const f = window.__zveltio;
  return f || (console.warn("[zveltio/sdk/studio] window.__zveltio is not installed. Is the bundle running inside Studio?"), null);
}
function le(f) {
  var l;
  (l = ie()) == null || l.registerRoute(f);
}
const Z = typeof window < "u" ? window.location.origin : "";
typeof window < "u" && (window.__ZVELTIO_ENGINE_URL__ = Z);
class re {
  constructor(l) {
    X(this, "base");
    this.base = l;
  }
  async request(l, p, C) {
    const w = await fetch(`${this.base}${p}`, {
      method: l,
      credentials: "include",
      headers: C ? { "Content-Type": "application/json" } : {},
      body: C ? JSON.stringify(C) : void 0
    });
    if (!w.ok) {
      const I = await w.json().catch(() => ({ error: w.statusText }));
      throw new Error(I.error || `Request failed: ${w.status}`);
    }
    return w.json();
  }
  get(l) {
    return this.request("GET", l);
  }
  post(l, p) {
    return this.request("POST", l, p);
  }
  put(l, p) {
    return this.request("PUT", l, p);
  }
  patch(l, p) {
    return this.request("PATCH", l, p);
  }
  delete(l, p) {
    return this.request("DELETE", l, p);
  }
}
const z = new re(Z);
var ne = e.from_html('<p class="loading svelte-bquc6i">Loading billing data…</p>'), oe = e.from_html('<p class="error svelte-bquc6i"> </p>'), ve = e.from_html('<p class="plan-renewal svelte-bquc6i"> </p>'), ce = e.from_html('<div class="plan-card svelte-bquc6i"><div class="plan-header svelte-bquc6i"><span class="plan-name svelte-bquc6i"> </span> <span> </span></div> <p class="plan-price svelte-bquc6i"> </p> <!></div>'), de = e.from_html('<p class="no-plan svelte-bquc6i">No active subscription. Choose a plan below.</p>'), pe = e.from_html('<span class="usage-pct svelte-bquc6i"> </span>'), ge = e.from_html('<div class="usage-bar-item svelte-bquc6i"><div class="usage-bar-label svelte-bquc6i"><span> </span> <span> </span></div> <div class="usage-bar-track svelte-bquc6i"><div class="usage-bar-fill svelte-bquc6i"></div></div> <!></div>'), ue = e.from_html('<li class="svelte-bquc6i"> </li>'), _e = e.from_html('<ul class="limits svelte-bquc6i"></ul>'), he = e.from_html('<button class="btn-upgrade svelte-bquc6i"> </button>'), be = e.from_html('<span class="current-badge svelte-bquc6i">Current Plan</span>'), fe = e.from_html('<div><h3> </h3> <p class="price svelte-bquc6i"> </p> <!> <!></div>'), me = e.from_html('<section class="current-plan svelte-bquc6i"><h2 class="svelte-bquc6i">Current Plan</h2> <!></section> <section class="usage-section svelte-bquc6i"><h2 class="svelte-bquc6i">Usage This Period</h2> <!></section> <section class="plans-section svelte-bquc6i"><h2 class="svelte-bquc6i">Available Plans</h2> <div class="plans-grid svelte-bquc6i"></div></section>', 1), xe = e.from_html('<div class="billing-page svelte-bquc6i"><h1 class="svelte-bquc6i">Billing &amp; Subscription</h1> <!></div>');
function ye(f, l) {
  e.push(l, !0);
  let p = e.state(e.proxy([])), C = e.state(e.proxy([])), w = e.state(e.proxy({})), I = e.state(!0), B = e.state(null), E = e.derived(() => e.get(C)[0] ?? null), R = e.derived(() => e.get(E) ? e.get(p).find((t) => t.id === e.get(E).plan_id) ?? null : null);
  function F(t, v) {
    return v ? Math.min(100, Math.round(t / v * 100)) : 0;
  }
  Q(async () => {
    try {
      const [t, v, P] = await Promise.all([
        z.get("/extensions/billing/plans"),
        z.get("/extensions/billing/subscriptions"),
        z.get("/extensions/billing/usage")
      ]);
      e.set(p, t.plans ?? [], !0), e.set(C, v.subscriptions ?? [], !0);
      const T = {};
      for (const k of P.usage ?? [])
        T[k.event_type] = (T[k.event_type] ?? 0) + Number(k.total);
      e.set(w, T, !0);
    } catch (t) {
      e.set(B, t.message ?? "Failed to load billing data", !0);
    } finally {
      e.set(I, !1);
    }
  });
  async function M(t) {
    alert("Upgrade flow: integrate with Stripe Checkout for plan " + t);
  }
  var j = xe(), G = e.sibling(e.child(j), 2);
  {
    var K = (t) => {
      var v = ne();
      e.append(t, v);
    }, V = (t) => {
      var v = oe(), P = e.child(v, !0);
      e.reset(v), e.template_effect(() => e.set_text(P, e.get(B))), e.append(t, v);
    }, g = (t) => {
      var v = me(), P = e.first_child(v), T = e.sibling(e.child(P), 2);
      {
        var k = (c) => {
          var s = ce(), b = e.child(s), _ = e.child(b), n = e.child(_, !0);
          e.reset(_);
          var a = e.sibling(_, 2), d = e.child(a, !0);
          e.reset(a), e.reset(b);
          var h = e.sibling(b, 2), m = e.child(h);
          e.reset(h);
          var S = e.sibling(h, 2);
          {
            var $ = (x) => {
              var q = ve(), o = e.child(q);
              e.reset(q), e.template_effect((i) => e.set_text(o, `Renews: ${i ?? ""}`), [
                () => new Date(e.get(E).current_period_end).toLocaleDateString()
              ]), e.append(x, q);
            };
            e.if(S, (x) => {
              e.get(E).current_period_end && x($);
            });
          }
          e.reset(s), e.template_effect(
            (x) => {
              e.set_text(n, e.get(R).name), e.set_class(a, 1, `plan-status status-${e.get(E).status ?? ""}`, "svelte-bquc6i"), e.set_text(d, e.get(E).status), e.set_text(m, `$${x ?? ""} / ${e.get(R).interval ?? ""}`);
            },
            [
              () => ((e.get(R).price_cents ?? 0) / 100).toFixed(2)
            ]
          ), e.append(c, s);
        }, O = (c) => {
          var s = de();
          e.append(c, s);
        };
        e.if(T, (c) => {
          e.get(E) && e.get(R) ? c(k) : c(O, -1);
        });
      }
      e.reset(P);
      var L = e.sibling(P, 2), N = e.sibling(e.child(L), 2);
      e.each(
        N,
        16,
        () => [
          { key: "api_call", label: "API Calls", limitKey: "api_calls" },
          {
            key: "storage_write",
            label: "Storage Writes",
            limitKey: "storage_mb"
          },
          {
            key: "record_created",
            label: "Records Created",
            limitKey: "records"
          }
        ],
        e.index,
        (c, s) => {
          const b = e.derived(() => e.get(w)[s.key] ?? 0), _ = e.derived(() => {
            var r, u;
            return ((u = (r = e.get(R)) == null ? void 0 : r.limits) == null ? void 0 : u[s.limitKey]) ?? 0;
          }), n = e.derived(() => F(e.get(b), e.get(_)));
          var a = ge(), d = e.child(a), h = e.child(d), m = e.child(h, !0);
          e.reset(h);
          var S = e.sibling(h, 2), $ = e.child(S);
          e.reset(S), e.reset(d);
          var x = e.sibling(d, 2), q = e.child(x);
          e.reset(x);
          var o = e.sibling(x, 2);
          {
            var i = (r) => {
              var u = pe(), y = e.child(u);
              e.reset(u), e.template_effect(() => e.set_text(y, `${e.get(n) ?? ""}%`)), e.append(r, u);
            };
            e.if(o, (r) => {
              e.get(_) && r(i);
            });
          }
          e.reset(a), e.template_effect(
            (r, u) => {
              e.set_text(m, s.label), e.set_text($, `${r ?? ""} ${u ?? ""}`), e.set_style(q, `width: ${e.get(n) ?? ""}%; background: ${e.get(n) > 90 ? "#ef4444" : e.get(n) > 70 ? "#f59e0b" : "#22c55e"}`);
            },
            [
              () => e.get(b).toLocaleString(),
              () => e.get(_) ? `/ ${e.get(_).toLocaleString()}` : ""
            ]
          ), e.append(c, a);
        }
      ), e.reset(L);
      var U = e.sibling(L, 2), A = e.sibling(e.child(U), 2);
      e.each(A, 21, () => e.get(p), e.index, (c, s) => {
        var b = fe();
        let _;
        var n = e.child(b), a = e.child(n, !0);
        e.reset(n);
        var d = e.sibling(n, 2), h = e.child(d);
        e.reset(d);
        var m = e.sibling(d, 2);
        {
          var S = (o) => {
            const i = e.derived(() => typeof e.get(s).limits == "string" ? JSON.parse(e.get(s).limits) : e.get(s).limits);
            var r = _e();
            e.each(r, 21, () => Object.entries(e.get(i)), e.index, (u, y) => {
              var D = e.derived(() => e.to_array(e.get(y), 2));
              let H = () => e.get(D)[0], J = () => e.get(D)[1];
              var W = ue(), Y = e.child(W);
              e.reset(W), e.template_effect((ee, te) => e.set_text(Y, `${ee ?? ""}: ${te ?? ""}`), [() => H().replace(/_/g, " "), () => String(J())]), e.append(u, W);
            }), e.reset(r), e.append(o, r);
          };
          e.if(m, (o) => {
            e.get(s).limits && o(S);
          });
        }
        var $ = e.sibling(m, 2);
        {
          var x = (o) => {
            var i = he(), r = e.child(i);
            e.reset(i), e.template_effect(() => e.set_text(r, `Upgrade to ${e.get(s).name ?? ""}`)), e.delegated("click", i, () => M(e.get(s).id)), e.append(o, i);
          }, q = (o) => {
            var i = be();
            e.append(o, i);
          };
          e.if($, (o) => {
            var i;
            ((i = e.get(R)) == null ? void 0 : i.id) !== e.get(s).id ? o(x) : o(q, -1);
          });
        }
        e.reset(b), e.template_effect(
          (o) => {
            var i;
            _ = e.set_class(b, 1, "plan-card svelte-bquc6i", null, _, { active: ((i = e.get(R)) == null ? void 0 : i.id) === e.get(s).id }), e.set_text(a, e.get(s).name), e.set_text(h, `$${o ?? ""} / ${e.get(s).interval ?? ""}`);
          },
          [() => ((e.get(s).price_cents ?? 0) / 100).toFixed(2)]
        ), e.append(c, b);
      }), e.reset(A), e.reset(U), e.append(t, v);
    };
    e.if(G, (t) => {
      e.get(I) ? t(K) : e.get(B) ? t(V, 1) : t(g, -1);
    });
  }
  e.reset(j), e.append(f, j), e.pop();
}
e.delegate(["click"]);
var we = e.from_html('<p class="loading svelte-2btvui">Loading usage data…</p>'), qe = e.from_html('<p class="error svelte-2btvui"> </p>'), $e = e.from_svg('<line x1="50" x2="590" stroke="#f3f4f6" stroke-width="1"></line><text x="44" font-size="9" fill="#9ca3af" text-anchor="end"> </text>', 1), Pe = e.from_svg('<polygon fill="#6366f1" fill-opacity="0.08"></polygon>'), ke = e.from_svg('<text y="195" font-size="9" fill="#9ca3af" text-anchor="middle"> </text>'), Se = e.from_html('<div class="chart-wrapper svelte-2btvui"><svg viewBox="0 0 600 200" class="line-chart svelte-2btvui" aria-label="API calls chart"><!><polyline fill="none" stroke="#6366f1" stroke-width="2" stroke-linejoin="round"></polyline><!><!></svg></div>'), Ce = e.from_html('<p class="no-data svelte-2btvui">No API call data available.</p>'), Ee = e.from_html("<option> </option>"), Re = e.from_html('<tr><td class="svelte-2btvui"><span class="badge svelte-2btvui"> </span></td><td class="svelte-2btvui"> </td><td class="svelte-2btvui"> </td><td class="svelte-2btvui"> </td><td class="time svelte-2btvui"> </td></tr>'), Te = e.from_html('<tr><td colspan="5" class="empty svelte-2btvui">No events found.</td></tr>'), Le = e.from_html('<section class="chart-section svelte-2btvui"><h2 class="svelte-2btvui">API Calls — Last 30 Days</h2> <!></section> <section class="events-section svelte-2btvui"><div class="events-header svelte-2btvui"><h2 class="svelte-2btvui">Recent Events</h2> <select class="filter-select svelte-2btvui"><option>All types</option><!></select></div> <div class="table-wrapper svelte-2btvui"><table class="svelte-2btvui"><thead><tr><th class="svelte-2btvui">Event Type</th><th class="svelte-2btvui">Collection</th><th class="svelte-2btvui">Tenant</th><th class="svelte-2btvui">Quantity</th><th class="svelte-2btvui">Time</th></tr></thead><tbody></tbody></table></div></section>', 1), Ne = e.from_html('<div class="usage-page svelte-2btvui"><h1 class="svelte-2btvui">Usage Dashboard</h1> <!></div>');
function Ue(f, l) {
  e.push(l, !0);
  let p = e.state(e.proxy([])), C = e.state(e.proxy([])), w = e.state(""), I = e.state(!0), B = e.state(null), E = e.derived(() => [...new Set(e.get(p).map((g) => g.event_type))]), R = e.derived(() => e.get(w) ? e.get(C).filter((g) => g.event_type === e.get(w)) : e.get(C)), F = e.derived(() => () => {
    const g = e.get(p).filter((c) => c.event_type === "api_call");
    if (g.length === 0) return { points: "", labels: [], maxVal: 0 };
    const t = [...g].sort((c, s) => c.day.localeCompare(s.day)), v = Math.max(...t.map((c) => c.total), 1), P = 600, T = 200, k = 50, O = 30, L = P - k - 10, N = T - O - 10, U = t.map((c, s) => {
      const b = k + s / Math.max(t.length - 1, 1) * L, _ = 10 + N - c.total / v * N;
      return `${b},${_}`;
    }).join(" "), A = t.filter((c, s) => s === 0 || s === t.length - 1 || s % 5 === 0).map((c, s, b) => {
      const _ = t.indexOf(c);
      return { x: k + _ / Math.max(t.length - 1, 1) * L, label: c.day.slice(5, 10) };
    });
    return { points: U, labels: A, maxVal: v };
  });
  Q(async () => {
    try {
      const [g, t] = await Promise.all([
        z.get("/extensions/billing/usage"),
        z.get("/extensions/billing/usage/live")
      ]);
      e.set(p, (g.usage ?? []).map((v) => ({ ...v, total: Number(v.total) })), !0), e.set(C, t.events ?? [], !0);
    } catch (g) {
      e.set(B, g.message ?? "Failed to load usage data", !0);
    } finally {
      e.set(I, !1);
    }
  });
  var M = Ne(), j = e.sibling(e.child(M), 2);
  {
    var G = (g) => {
      var t = we();
      e.append(g, t);
    }, K = (g) => {
      var t = qe(), v = e.child(t, !0);
      e.reset(t), e.template_effect(() => e.set_text(v, e.get(B))), e.append(g, t);
    }, V = (g) => {
      var t = Le(), v = e.first_child(t), P = e.sibling(e.child(v), 2);
      {
        var T = (n) => {
          const a = e.derived(() => e.get(F)());
          var d = Se(), h = e.child(d), m = e.child(h);
          e.each(m, 16, () => [0.25, 0.5, 0.75, 1], e.index, (o, i) => {
            const r = e.derived(() => 10 + (1 - i) * 160);
            var u = $e(), y = e.first_child(u), D = e.sibling(y), H = e.child(D, !0);
            e.reset(D), e.template_effect(
              (J) => {
                e.set_attribute(y, "y1", e.get(r)), e.set_attribute(y, "y2", e.get(r)), e.set_attribute(D, "y", e.get(r) + 4), e.set_text(H, J);
              },
              [
                () => Math.round(e.get(a).maxVal * i).toLocaleString()
              ]
            ), e.append(o, u);
          });
          var S = e.sibling(m), $ = e.sibling(S);
          {
            var x = (o) => {
              const i = e.derived(() => {
                var y;
                return (y = e.get(a).points.split(" ")[0]) == null ? void 0 : y.split(",")[0];
              }), r = e.derived(() => {
                var y;
                return (y = e.get(a).points.split(" ").at(-1)) == null ? void 0 : y.split(",")[0];
              });
              var u = Pe();
              e.template_effect(() => e.set_attribute(u, "points", `${e.get(a).points ?? ""} ${e.get(r) ?? ""},170 ${e.get(i) ?? ""},170`)), e.append(o, u);
            };
            e.if($, (o) => {
              e.get(a).points && o(x);
            });
          }
          var q = e.sibling($);
          e.each(q, 17, () => e.get(a).labels, e.index, (o, i) => {
            var r = ke(), u = e.child(r, !0);
            e.reset(r), e.template_effect(() => {
              e.set_attribute(r, "x", e.get(i).x), e.set_text(u, e.get(i).label);
            }), e.append(o, r);
          }), e.reset(h), e.reset(d), e.template_effect(() => e.set_attribute(S, "points", e.get(a).points)), e.append(n, d);
        }, k = e.derived(() => e.get(F)().points), O = (n) => {
          var a = Ce();
          e.append(n, a);
        };
        e.if(P, (n) => {
          e.get(k) ? n(T) : n(O, -1);
        });
      }
      e.reset(v);
      var L = e.sibling(v, 2), N = e.child(L), U = e.sibling(e.child(N), 2), A = e.child(U);
      A.value = A.__value = "";
      var c = e.sibling(A);
      e.each(c, 17, () => e.get(E), e.index, (n, a) => {
        var d = Ee(), h = e.child(d, !0);
        e.reset(d);
        var m = {};
        e.template_effect(() => {
          e.set_text(h, e.get(a)), m !== (m = e.get(a)) && (d.value = (d.__value = e.get(a)) ?? "");
        }), e.append(n, d);
      }), e.reset(U), e.reset(N);
      var s = e.sibling(N, 2), b = e.child(s), _ = e.sibling(e.child(b));
      e.each(
        _,
        21,
        () => e.get(R),
        e.index,
        (n, a) => {
          var d = Re(), h = e.child(d), m = e.child(h), S = e.child(m, !0);
          e.reset(m), e.reset(h);
          var $ = e.sibling(h), x = e.child($, !0);
          e.reset($);
          var q = e.sibling($), o = e.child(q, !0);
          e.reset(q);
          var i = e.sibling(q), r = e.child(i, !0);
          e.reset(i);
          var u = e.sibling(i), y = e.child(u, !0);
          e.reset(u), e.reset(d), e.template_effect(
            (D) => {
              e.set_text(S, e.get(a).event_type), e.set_text(x, e.get(a).collection ?? "—"), e.set_text(o, e.get(a).tenant_id ?? "—"), e.set_text(r, e.get(a).quantity), e.set_text(y, D);
            },
            [() => new Date(e.get(a).created_at).toLocaleString()]
          ), e.append(n, d);
        },
        (n) => {
          var a = Te();
          e.append(n, a);
        }
      ), e.reset(_), e.reset(b), e.reset(s), e.reset(L), e.bind_select_value(U, () => e.get(w), (n) => e.set(w, n)), e.append(g, t);
    };
    e.if(j, (g) => {
      e.get(I) ? g(G) : e.get(B) ? g(K, 1) : g(V, -1);
    });
  }
  e.reset(M), e.append(f, M), e.pop();
}
function Ae() {
  le({
    path: "billing",
    component: ye,
    label: "Billing",
    icon: "CreditCard",
    category: "operations",
    children: [
      {
        path: "billing/usage",
        component: Ue,
        label: "Usage",
        icon: "BarChart2",
        category: "operations"
      }
    ]
  });
}
Ae();
export {
  Ae as default
};
