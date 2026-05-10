var se = Object.defineProperty;
var ae = (y, o, p) => o in y ? se(y, o, { enumerable: !0, configurable: !0, writable: !0, value: p }) : y[o] = p;
var X = (y, o, p) => ae(y, typeof o != "symbol" ? o + "" : o, p);
import "svelte/internal/disclose-version";
import * as e from "svelte/internal/client";
import { onMount as Q } from "svelte";
const Z = typeof window < "u" ? window.location.origin : "";
typeof window < "u" && (window.__ZVELTIO_ENGINE_URL__ = Z);
class ie {
  constructor(o) {
    X(this, "base");
    this.base = o;
  }
  async request(o, p, S) {
    const q = await fetch(`${this.base}${p}`, {
      method: o,
      credentials: "include",
      headers: S ? { "Content-Type": "application/json" } : {},
      body: S ? JSON.stringify(S) : void 0
    });
    if (!q.ok) {
      const B = await q.json().catch(() => ({ error: q.statusText }));
      throw new Error(B.error || `Request failed: ${q.status}`);
    }
    return q.json();
  }
  get(o) {
    return this.request("GET", o);
  }
  post(o, p) {
    return this.request("POST", o, p);
  }
  put(o, p) {
    return this.request("PUT", o, p);
  }
  patch(o, p) {
    return this.request("PATCH", o, p);
  }
  delete(o, p) {
    return this.request("DELETE", o, p);
  }
}
const z = new ie(Z);
var le = e.from_html('<p class="loading svelte-bquc6i">Loading billing data…</p>'), re = e.from_html('<p class="error svelte-bquc6i"> </p>'), ne = e.from_html('<p class="plan-renewal svelte-bquc6i"> </p>'), oe = e.from_html('<div class="plan-card svelte-bquc6i"><div class="plan-header svelte-bquc6i"><span class="plan-name svelte-bquc6i"> </span> <span> </span></div> <p class="plan-price svelte-bquc6i"> </p> <!></div>'), ve = e.from_html('<p class="no-plan svelte-bquc6i">No active subscription. Choose a plan below.</p>'), ce = e.from_html('<span class="usage-pct svelte-bquc6i"> </span>'), de = e.from_html('<div class="usage-bar-item svelte-bquc6i"><div class="usage-bar-label svelte-bquc6i"><span> </span> <span> </span></div> <div class="usage-bar-track svelte-bquc6i"><div class="usage-bar-fill svelte-bquc6i"></div></div> <!></div>'), pe = e.from_html('<li class="svelte-bquc6i"> </li>'), ge = e.from_html('<ul class="limits svelte-bquc6i"></ul>'), _e = e.from_html('<button class="btn-upgrade svelte-bquc6i"> </button>'), ue = e.from_html('<span class="current-badge svelte-bquc6i">Current Plan</span>'), he = e.from_html('<div><h3> </h3> <p class="price svelte-bquc6i"> </p> <!> <!></div>'), be = e.from_html('<section class="current-plan svelte-bquc6i"><h2 class="svelte-bquc6i">Current Plan</h2> <!></section> <section class="usage-section svelte-bquc6i"><h2 class="svelte-bquc6i">Usage This Period</h2> <!></section> <section class="plans-section svelte-bquc6i"><h2 class="svelte-bquc6i">Available Plans</h2> <div class="plans-grid svelte-bquc6i"></div></section>', 1), fe = e.from_html('<div class="billing-page svelte-bquc6i"><h1 class="svelte-bquc6i">Billing &amp; Subscription</h1> <!></div>');
function me(y, o) {
  e.push(o, !0);
  let p = e.state(e.proxy([])), S = e.state(e.proxy([])), q = e.state(e.proxy({})), B = e.state(!0), I = e.state(null), E = e.derived(() => e.get(S)[0] ?? null), T = e.derived(() => e.get(E) ? e.get(p).find((t) => t.id === e.get(E).plan_id) ?? null : null);
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
      e.set(p, t.plans ?? [], !0), e.set(S, v.subscriptions ?? [], !0);
      const L = {};
      for (const k of P.usage ?? [])
        L[k.event_type] = (L[k.event_type] ?? 0) + Number(k.total);
      e.set(q, L, !0);
    } catch (t) {
      e.set(I, t.message ?? "Failed to load billing data", !0);
    } finally {
      e.set(B, !1);
    }
  });
  async function M(t) {
    alert("Upgrade flow: integrate with Stripe Checkout for plan " + t);
  }
  var j = fe(), K = e.sibling(e.child(j), 2);
  {
    var V = (t) => {
      var v = le();
      e.append(t, v);
    }, G = (t) => {
      var v = re(), P = e.child(v, !0);
      e.reset(v), e.template_effect(() => e.set_text(P, e.get(I))), e.append(t, v);
    }, g = (t) => {
      var v = be(), P = e.first_child(v), L = e.sibling(e.child(P), 2);
      {
        var k = (c) => {
          var s = oe(), b = e.child(s), u = e.child(b), r = e.child(u, !0);
          e.reset(u);
          var a = e.sibling(u, 2), d = e.child(a, !0);
          e.reset(a), e.reset(b);
          var h = e.sibling(b, 2), f = e.child(h);
          e.reset(h);
          var C = e.sibling(h, 2);
          {
            var $ = (m) => {
              var w = ne(), n = e.child(w);
              e.reset(w), e.template_effect((i) => e.set_text(n, `Renews: ${i ?? ""}`), [
                () => new Date(e.get(E).current_period_end).toLocaleDateString()
              ]), e.append(m, w);
            };
            e.if(C, (m) => {
              e.get(E).current_period_end && m($);
            });
          }
          e.reset(s), e.template_effect(
            (m) => {
              e.set_text(r, e.get(T).name), e.set_class(a, 1, `plan-status status-${e.get(E).status ?? ""}`, "svelte-bquc6i"), e.set_text(d, e.get(E).status), e.set_text(f, `$${m ?? ""} / ${e.get(T).interval ?? ""}`);
            },
            [
              () => ((e.get(T).price_cents ?? 0) / 100).toFixed(2)
            ]
          ), e.append(c, s);
        }, O = (c) => {
          var s = ve();
          e.append(c, s);
        };
        e.if(L, (c) => {
          e.get(E) && e.get(T) ? c(k) : c(O, -1);
        });
      }
      e.reset(P);
      var R = e.sibling(P, 2), N = e.sibling(e.child(R), 2);
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
          const b = e.derived(() => e.get(q)[s.key] ?? 0), u = e.derived(() => {
            var l, _;
            return ((_ = (l = e.get(T)) == null ? void 0 : l.limits) == null ? void 0 : _[s.limitKey]) ?? 0;
          }), r = e.derived(() => F(e.get(b), e.get(u)));
          var a = de(), d = e.child(a), h = e.child(d), f = e.child(h, !0);
          e.reset(h);
          var C = e.sibling(h, 2), $ = e.child(C);
          e.reset(C), e.reset(d);
          var m = e.sibling(d, 2), w = e.child(m);
          e.reset(m);
          var n = e.sibling(m, 2);
          {
            var i = (l) => {
              var _ = ce(), x = e.child(_);
              e.reset(_), e.template_effect(() => e.set_text(x, `${e.get(r) ?? ""}%`)), e.append(l, _);
            };
            e.if(n, (l) => {
              e.get(u) && l(i);
            });
          }
          e.reset(a), e.template_effect(
            (l, _) => {
              e.set_text(f, s.label), e.set_text($, `${l ?? ""} ${_ ?? ""}`), e.set_style(w, `width: ${e.get(r) ?? ""}%; background: ${e.get(r) > 90 ? "#ef4444" : e.get(r) > 70 ? "#f59e0b" : "#22c55e"}`);
            },
            [
              () => e.get(b).toLocaleString(),
              () => e.get(u) ? `/ ${e.get(u).toLocaleString()}` : ""
            ]
          ), e.append(c, a);
        }
      ), e.reset(R);
      var U = e.sibling(R, 2), A = e.sibling(e.child(U), 2);
      e.each(A, 21, () => e.get(p), e.index, (c, s) => {
        var b = he();
        let u;
        var r = e.child(b), a = e.child(r, !0);
        e.reset(r);
        var d = e.sibling(r, 2), h = e.child(d);
        e.reset(d);
        var f = e.sibling(d, 2);
        {
          var C = (n) => {
            const i = e.derived(() => typeof e.get(s).limits == "string" ? JSON.parse(e.get(s).limits) : e.get(s).limits);
            var l = ge();
            e.each(l, 21, () => Object.entries(e.get(i)), e.index, (_, x) => {
              var D = e.derived(() => e.to_array(e.get(x), 2));
              let H = () => e.get(D)[0], J = () => e.get(D)[1];
              var W = pe(), Y = e.child(W);
              e.reset(W), e.template_effect((ee, te) => e.set_text(Y, `${ee ?? ""}: ${te ?? ""}`), [() => H().replace(/_/g, " "), () => String(J())]), e.append(_, W);
            }), e.reset(l), e.append(n, l);
          };
          e.if(f, (n) => {
            e.get(s).limits && n(C);
          });
        }
        var $ = e.sibling(f, 2);
        {
          var m = (n) => {
            var i = _e(), l = e.child(i);
            e.reset(i), e.template_effect(() => e.set_text(l, `Upgrade to ${e.get(s).name ?? ""}`)), e.delegated("click", i, () => M(e.get(s).id)), e.append(n, i);
          }, w = (n) => {
            var i = ue();
            e.append(n, i);
          };
          e.if($, (n) => {
            var i;
            ((i = e.get(T)) == null ? void 0 : i.id) !== e.get(s).id ? n(m) : n(w, -1);
          });
        }
        e.reset(b), e.template_effect(
          (n) => {
            var i;
            u = e.set_class(b, 1, "plan-card svelte-bquc6i", null, u, { active: ((i = e.get(T)) == null ? void 0 : i.id) === e.get(s).id }), e.set_text(a, e.get(s).name), e.set_text(h, `$${n ?? ""} / ${e.get(s).interval ?? ""}`);
          },
          [() => ((e.get(s).price_cents ?? 0) / 100).toFixed(2)]
        ), e.append(c, b);
      }), e.reset(A), e.reset(U), e.append(t, v);
    };
    e.if(K, (t) => {
      e.get(B) ? t(V) : e.get(I) ? t(G, 1) : t(g, -1);
    });
  }
  e.reset(j), e.append(y, j), e.pop();
}
e.delegate(["click"]);
var xe = e.from_html('<p class="loading svelte-2btvui">Loading usage data…</p>'), ye = e.from_html('<p class="error svelte-2btvui"> </p>'), qe = e.from_svg('<line x1="50" x2="590" stroke="#f3f4f6" stroke-width="1"></line><text x="44" font-size="9" fill="#9ca3af" text-anchor="end"> </text>', 1), we = e.from_svg('<polygon fill="#6366f1" fill-opacity="0.08"></polygon>'), $e = e.from_svg('<text y="195" font-size="9" fill="#9ca3af" text-anchor="middle"> </text>'), Pe = e.from_html('<div class="chart-wrapper svelte-2btvui"><svg viewBox="0 0 600 200" class="line-chart svelte-2btvui" aria-label="API calls chart"><!><polyline fill="none" stroke="#6366f1" stroke-width="2" stroke-linejoin="round"></polyline><!><!></svg></div>'), ke = e.from_html('<p class="no-data svelte-2btvui">No API call data available.</p>'), Ce = e.from_html("<option> </option>"), Se = e.from_html('<tr><td class="svelte-2btvui"><span class="badge svelte-2btvui"> </span></td><td class="svelte-2btvui"> </td><td class="svelte-2btvui"> </td><td class="svelte-2btvui"> </td><td class="time svelte-2btvui"> </td></tr>'), Ee = e.from_html('<tr><td colspan="5" class="empty svelte-2btvui">No events found.</td></tr>'), Te = e.from_html('<section class="chart-section svelte-2btvui"><h2 class="svelte-2btvui">API Calls — Last 30 Days</h2> <!></section> <section class="events-section svelte-2btvui"><div class="events-header svelte-2btvui"><h2 class="svelte-2btvui">Recent Events</h2> <select class="filter-select svelte-2btvui"><option>All types</option><!></select></div> <div class="table-wrapper svelte-2btvui"><table class="svelte-2btvui"><thead><tr><th class="svelte-2btvui">Event Type</th><th class="svelte-2btvui">Collection</th><th class="svelte-2btvui">Tenant</th><th class="svelte-2btvui">Quantity</th><th class="svelte-2btvui">Time</th></tr></thead><tbody></tbody></table></div></section>', 1), Le = e.from_html('<div class="usage-page svelte-2btvui"><h1 class="svelte-2btvui">Usage Dashboard</h1> <!></div>');
function Re(y, o) {
  e.push(o, !0);
  let p = e.state(e.proxy([])), S = e.state(e.proxy([])), q = e.state(""), B = e.state(!0), I = e.state(null), E = e.derived(() => [...new Set(e.get(p).map((g) => g.event_type))]), T = e.derived(() => e.get(q) ? e.get(S).filter((g) => g.event_type === e.get(q)) : e.get(S)), F = e.derived(() => () => {
    const g = e.get(p).filter((c) => c.event_type === "api_call");
    if (g.length === 0) return { points: "", labels: [], maxVal: 0 };
    const t = [...g].sort((c, s) => c.day.localeCompare(s.day)), v = Math.max(...t.map((c) => c.total), 1), P = 600, L = 200, k = 50, O = 30, R = P - k - 10, N = L - O - 10, U = t.map((c, s) => {
      const b = k + s / Math.max(t.length - 1, 1) * R, u = 10 + N - c.total / v * N;
      return `${b},${u}`;
    }).join(" "), A = t.filter((c, s) => s === 0 || s === t.length - 1 || s % 5 === 0).map((c, s, b) => {
      const u = t.indexOf(c);
      return { x: k + u / Math.max(t.length - 1, 1) * R, label: c.day.slice(5, 10) };
    });
    return { points: U, labels: A, maxVal: v };
  });
  Q(async () => {
    try {
      const [g, t] = await Promise.all([
        z.get("/extensions/billing/usage"),
        z.get("/extensions/billing/usage/live")
      ]);
      e.set(p, (g.usage ?? []).map((v) => ({ ...v, total: Number(v.total) })), !0), e.set(S, t.events ?? [], !0);
    } catch (g) {
      e.set(I, g.message ?? "Failed to load usage data", !0);
    } finally {
      e.set(B, !1);
    }
  });
  var M = Le(), j = e.sibling(e.child(M), 2);
  {
    var K = (g) => {
      var t = xe();
      e.append(g, t);
    }, V = (g) => {
      var t = ye(), v = e.child(t, !0);
      e.reset(t), e.template_effect(() => e.set_text(v, e.get(I))), e.append(g, t);
    }, G = (g) => {
      var t = Te(), v = e.first_child(t), P = e.sibling(e.child(v), 2);
      {
        var L = (r) => {
          const a = e.derived(() => e.get(F)());
          var d = Pe(), h = e.child(d), f = e.child(h);
          e.each(f, 16, () => [0.25, 0.5, 0.75, 1], e.index, (n, i) => {
            const l = e.derived(() => 10 + (1 - i) * 160);
            var _ = qe(), x = e.first_child(_), D = e.sibling(x), H = e.child(D, !0);
            e.reset(D), e.template_effect(
              (J) => {
                e.set_attribute(x, "y1", e.get(l)), e.set_attribute(x, "y2", e.get(l)), e.set_attribute(D, "y", e.get(l) + 4), e.set_text(H, J);
              },
              [
                () => Math.round(e.get(a).maxVal * i).toLocaleString()
              ]
            ), e.append(n, _);
          });
          var C = e.sibling(f), $ = e.sibling(C);
          {
            var m = (n) => {
              const i = e.derived(() => {
                var x;
                return (x = e.get(a).points.split(" ")[0]) == null ? void 0 : x.split(",")[0];
              }), l = e.derived(() => {
                var x;
                return (x = e.get(a).points.split(" ").at(-1)) == null ? void 0 : x.split(",")[0];
              });
              var _ = we();
              e.template_effect(() => e.set_attribute(_, "points", `${e.get(a).points ?? ""} ${e.get(l) ?? ""},170 ${e.get(i) ?? ""},170`)), e.append(n, _);
            };
            e.if($, (n) => {
              e.get(a).points && n(m);
            });
          }
          var w = e.sibling($);
          e.each(w, 17, () => e.get(a).labels, e.index, (n, i) => {
            var l = $e(), _ = e.child(l, !0);
            e.reset(l), e.template_effect(() => {
              e.set_attribute(l, "x", e.get(i).x), e.set_text(_, e.get(i).label);
            }), e.append(n, l);
          }), e.reset(h), e.reset(d), e.template_effect(() => e.set_attribute(C, "points", e.get(a).points)), e.append(r, d);
        }, k = e.derived(() => e.get(F)().points), O = (r) => {
          var a = ke();
          e.append(r, a);
        };
        e.if(P, (r) => {
          e.get(k) ? r(L) : r(O, -1);
        });
      }
      e.reset(v);
      var R = e.sibling(v, 2), N = e.child(R), U = e.sibling(e.child(N), 2), A = e.child(U);
      A.value = A.__value = "";
      var c = e.sibling(A);
      e.each(c, 17, () => e.get(E), e.index, (r, a) => {
        var d = Ce(), h = e.child(d, !0);
        e.reset(d);
        var f = {};
        e.template_effect(() => {
          e.set_text(h, e.get(a)), f !== (f = e.get(a)) && (d.value = (d.__value = e.get(a)) ?? "");
        }), e.append(r, d);
      }), e.reset(U), e.reset(N);
      var s = e.sibling(N, 2), b = e.child(s), u = e.sibling(e.child(b));
      e.each(
        u,
        21,
        () => e.get(T),
        e.index,
        (r, a) => {
          var d = Se(), h = e.child(d), f = e.child(h), C = e.child(f, !0);
          e.reset(f), e.reset(h);
          var $ = e.sibling(h), m = e.child($, !0);
          e.reset($);
          var w = e.sibling($), n = e.child(w, !0);
          e.reset(w);
          var i = e.sibling(w), l = e.child(i, !0);
          e.reset(i);
          var _ = e.sibling(i), x = e.child(_, !0);
          e.reset(_), e.reset(d), e.template_effect(
            (D) => {
              e.set_text(C, e.get(a).event_type), e.set_text(m, e.get(a).collection ?? "—"), e.set_text(n, e.get(a).tenant_id ?? "—"), e.set_text(l, e.get(a).quantity), e.set_text(x, D);
            },
            [() => new Date(e.get(a).created_at).toLocaleString()]
          ), e.append(r, d);
        },
        (r) => {
          var a = Ee();
          e.append(r, a);
        }
      ), e.reset(u), e.reset(b), e.reset(s), e.reset(R), e.bind_select_value(U, () => e.get(q), (r) => e.set(q, r)), e.append(g, t);
    };
    e.if(j, (g) => {
      e.get(B) ? g(K) : e.get(I) ? g(V, 1) : g(G, -1);
    });
  }
  e.reset(M), e.append(y, M), e.pop();
}
function Ne() {
  const y = window.__zveltio;
  y && y.registerRoute({
    path: "billing",
    component: me,
    label: "Billing",
    icon: "CreditCard",
    category: "operations",
    children: [
      {
        path: "billing/usage",
        component: Re,
        label: "Usage",
        icon: "BarChart2",
        category: "operations"
      }
    ]
  });
}
Ne();
export {
  Ne as default
};
