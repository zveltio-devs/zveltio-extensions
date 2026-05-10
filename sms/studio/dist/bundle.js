var ke = Object.defineProperty;
var Ae = (n, r, d) => r in n ? ke(n, r, { enumerable: !0, configurable: !0, writable: !0, value: d }) : n[r] = d;
var ge = (n, r, d) => Ae(n, typeof r != "symbol" ? r + "" : r, d);
import "svelte/internal/disclose-version";
import * as e from "svelte/internal/client";
import { onMount as Ce } from "svelte";
const ue = typeof window < "u" ? window.location.origin : "";
typeof window < "u" && (window.__ZVELTIO_ENGINE_URL__ = ue);
class Ie {
  constructor(r) {
    ge(this, "base");
    this.base = r;
  }
  async request(r, d, p) {
    const c = await fetch(`${this.base}${d}`, {
      method: r,
      credentials: "include",
      headers: p ? { "Content-Type": "application/json" } : {},
      body: p ? JSON.stringify(p) : void 0
    });
    if (!c.ok) {
      const f = await c.json().catch(() => ({ error: c.statusText }));
      throw new Error(f.error || `Request failed: ${c.status}`);
    }
    return c.json();
  }
  get(r) {
    return this.request("GET", r);
  }
  post(r, d) {
    return this.request("POST", r, d);
  }
  put(r, d) {
    return this.request("PUT", r, d);
  }
  patch(r, d) {
    return this.request("PATCH", r, d);
  }
  delete(r, d) {
    return this.request("DELETE", r, d);
  }
}
const D = new Ie(ue);
var Fe = e.from_html('<p class="loading svelte-1dvqsh4">Loading…</p>'), je = e.from_html('<p class="error svelte-1dvqsh4"> </p>'), Ge = e.from_html('<div class="stat-card svelte-1dvqsh4"><div class="stat-value svelte-1dvqsh4"> </div> <div class="stat-label svelte-1dvqsh4"> </div></div>'), Ue = e.from_html("<option> </option>"), ze = e.from_html('<label class="svelte-1dvqsh4">Variables (JSON) <input type="text" placeholder="{&quot;name&quot;: &quot;John&quot;}" class="svelte-1dvqsh4"/></label>'), He = e.from_html('<label class="svelte-1dvqsh4">Message Body <textarea rows="3" placeholder="Your message here…" maxlength="1600" class="svelte-1dvqsh4"></textarea></label>'), We = e.from_html("<p> </p>"), Ye = e.from_html('<tr><td class="number svelte-1dvqsh4"> </td><td class="body-preview svelte-1dvqsh4"> </td><td class="svelte-1dvqsh4"> </td><td class="svelte-1dvqsh4"><span class="status-badge svelte-1dvqsh4"> </span></td><td class="time svelte-1dvqsh4"> </td></tr>'), Ze = e.from_html('<tr><td colspan="5" class="empty svelte-1dvqsh4">No messages yet.</td></tr>'), Ke = e.from_html('<div class="tpl-card svelte-1dvqsh4"><div class="tpl-header svelte-1dvqsh4"><strong> </strong> <span class="tpl-provider svelte-1dvqsh4"> </span></div> <code class="tpl-body svelte-1dvqsh4"> </code></div>'), Qe = e.from_html('<section class="stats-section svelte-1dvqsh4"></section> <section class="send-section svelte-1dvqsh4"><h2 class="svelte-1dvqsh4">Send SMS</h2> <div class="send-form svelte-1dvqsh4"><div class="form-row svelte-1dvqsh4"><label class="svelte-1dvqsh4">Provider <select class="svelte-1dvqsh4"><option>Twilio</option><option>Vonage</option></select></label> <label class="svelte-1dvqsh4">To Number <input type="tel" placeholder="+1234567890" class="svelte-1dvqsh4"/></label></div> <div class="form-row svelte-1dvqsh4"><label class="svelte-1dvqsh4">Template (optional) <select class="svelte-1dvqsh4"><option>— Custom message —</option><!></select></label> <!></div> <button class="btn-send svelte-1dvqsh4"> </button> <!></div></section> <section class="messages-section svelte-1dvqsh4"><h2 class="svelte-1dvqsh4">Message Log</h2> <div class="table-wrapper svelte-1dvqsh4"><table class="svelte-1dvqsh4"><thead><tr><th class="svelte-1dvqsh4">To</th><th class="svelte-1dvqsh4">Body</th><th class="svelte-1dvqsh4">Provider</th><th class="svelte-1dvqsh4">Status</th><th class="svelte-1dvqsh4">Sent At</th></tr></thead><tbody></tbody></table></div></section> <section class="templates-section svelte-1dvqsh4"><h2 class="svelte-1dvqsh4">Templates</h2> <!> <div class="new-tpl-form svelte-1dvqsh4"><h3 class="svelte-1dvqsh4">New Template</h3> <div class="form-row svelte-1dvqsh4"><label class="svelte-1dvqsh4">Name <input type="text" placeholder="Template name" class="svelte-1dvqsh4"/></label> <label class="svelte-1dvqsh4">Provider <select class="svelte-1dvqsh4"><option>Twilio</option><option>Vonage</option></select></label></div> <label class="svelte-1dvqsh4">Body (use &#123;&#123;variable&#125;&#125; for interpolation) <textarea rows="3" class="svelte-1dvqsh4"></textarea></label> <button class="btn-save-tpl svelte-1dvqsh4"> </button></div></section>', 1), Xe = e.from_html('<div class="sms-page svelte-1dvqsh4"><h1 class="svelte-1dvqsh4">SMS / Notifications</h1> <!></div>');
function et(n, r) {
  e.push(r, !0);
  let d = e.state(e.proxy({})), p = e.state(e.proxy([])), c = e.state(e.proxy([])), f = e.state(!0), O = e.state(null), V = e.state("twilio"), q = e.state(""), x = e.state(""), g = e.state(""), y = e.state(""), R = e.state(!1), u = e.state(null), w = e.state(""), S = e.state(""), $ = e.state("twilio"), L = e.state(!1), be = e.derived(() => e.get(p).filter((a) => {
    const o = new Date(a.created_at), h = /* @__PURE__ */ new Date();
    return o.toDateString() === h.toDateString();
  }).length);
  Ce(async () => {
    await ee();
  });
  async function ee() {
    e.set(f, !0);
    try {
      const [a, o, h] = await Promise.all([
        D.get("/extensions/sms/stats"),
        D.get("/extensions/sms/messages?limit=50"),
        D.get("/extensions/sms/templates")
      ]), T = a.stats ?? [], N = {};
      for (const b of T) N[b.status] = b.count;
      e.set(d, N, !0), e.set(p, o.messages ?? [], !0), e.set(c, h.templates ?? [], !0);
    } catch (a) {
      e.set(O, a.message ?? "Failed to load SMS data", !0);
    } finally {
      e.set(f, !1);
    }
  }
  async function me() {
    if (!e.get(q).trim()) return alert("Phone number is required");
    if (!e.get(x).trim() && !e.get(g)) return alert("Body or template is required");
    e.set(R, !0), e.set(u, null);
    try {
      const a = { provider: e.get(V), to: e.get(q).trim() };
      if (e.get(g)) {
        if (a.template_id = e.get(g), e.get(y).trim())
          try {
            a.variables = JSON.parse(e.get(y));
          } catch {
            return alert('Variables must be valid JSON, e.g. {"name": "John"}');
          }
      } else
        a.body = e.get(x).trim();
      const o = await D.post("/extensions/sms/send", a);
      e.set(u, `Sent! ID: ${o.id}`), e.set(q, ""), e.set(x, ""), e.set(g, ""), e.set(y, ""), await ee();
    } catch (a) {
      e.set(u, "Error: " + (a.message ?? "Failed to send"));
    } finally {
      e.set(R, !1);
    }
  }
  async function fe() {
    if (!e.get(w).trim() || !e.get(S).trim()) return alert("Name and body are required");
    e.set(L, !0);
    try {
      const a = await D.post("/extensions/sms/templates", {
        name: e.get(w).trim(),
        body: e.get(S).trim(),
        provider: e.get($)
      });
      e.set(c, [...e.get(c), a.template], !0), e.set(w, ""), e.set(S, "");
    } catch (a) {
      alert("Failed to create template: " + (a.message ?? ""));
    } finally {
      e.set(L, !1);
    }
  }
  function te(a) {
    return {
      sent: "#22c55e",
      delivered: "#16a34a",
      failed: "#ef4444",
      pending: "#f59e0b"
    }[a] ?? "#6b7280";
  }
  var k = Xe(), qe = e.sibling(e.child(k), 2);
  {
    var xe = (a) => {
      var o = Fe();
      e.append(a, o);
    }, ye = (a) => {
      var o = je(), h = e.child(o, !0);
      e.reset(o), e.template_effect(() => e.set_text(h, e.get(O))), e.append(a, o);
    }, we = (a) => {
      var o = Qe(), h = e.first_child(o);
      e.each(
        h,
        21,
        () => [
          {
            label: "Sent Today",
            value: e.get(be),
            color: "#6366f1"
          },
          {
            label: "Delivered (7d)",
            value: e.get(d).delivered ?? 0,
            color: "#22c55e"
          },
          {
            label: "Failed (7d)",
            value: e.get(d).failed ?? 0,
            color: "#ef4444"
          },
          {
            label: "Pending (7d)",
            value: e.get(d).pending ?? 0,
            color: "#f59e0b"
          }
        ],
        e.index,
        (s, t) => {
          var l = Ge(), i = e.child(l), v = e.child(i, !0);
          e.reset(i);
          var _ = e.sibling(i, 2), m = e.child(_, !0);
          e.reset(_), e.reset(l), e.template_effect(() => {
            e.set_style(i, `color: ${e.get(t).color ?? ""}`), e.set_text(v, e.get(t).value), e.set_text(m, e.get(t).label);
          }), e.append(s, l);
        }
      ), e.reset(h);
      var T = e.sibling(h, 2), N = e.sibling(e.child(T), 2), b = e.child(N), A = e.child(b), C = e.sibling(e.child(A)), I = e.child(C);
      I.value = I.__value = "twilio";
      var se = e.sibling(I);
      se.value = se.__value = "vonage", e.reset(C), e.reset(A);
      var ae = e.sibling(A, 2), le = e.sibling(e.child(ae));
      e.remove_input_defaults(le), e.reset(ae), e.reset(b);
      var F = e.sibling(b, 2), j = e.child(F), G = e.sibling(e.child(j)), U = e.child(G);
      U.value = U.__value = "";
      var Se = e.sibling(U);
      e.each(Se, 17, () => e.get(c), e.index, (s, t) => {
        var l = Ue(), i = e.child(l, !0);
        e.reset(l);
        var v = {};
        e.template_effect(() => {
          e.set_text(i, e.get(t).name), v !== (v = e.get(t).id) && (l.value = (l.__value = e.get(t).id) ?? "");
        }), e.append(s, l);
      }), e.reset(G), e.reset(j);
      var Te = e.sibling(j, 2);
      {
        var Ne = (s) => {
          var t = ze(), l = e.sibling(e.child(t));
          e.remove_input_defaults(l), e.reset(t), e.bind_value(l, () => e.get(y), (i) => e.set(y, i)), e.append(s, t);
        }, Ee = (s) => {
          var t = He(), l = e.sibling(e.child(t));
          e.remove_textarea_child(l), e.reset(t), e.bind_value(l, () => e.get(x), (i) => e.set(x, i)), e.append(s, t);
        };
        e.if(Te, (s) => {
          e.get(g) ? s(Ne) : s(Ee, -1);
        });
      }
      e.reset(F);
      var E = e.sibling(F, 2), Pe = e.child(E, !0);
      e.reset(E);
      var Me = e.sibling(E, 2);
      {
        var De = (s) => {
          var t = We();
          let l;
          var i = e.child(t, !0);
          e.reset(t), e.template_effect(
            (v) => {
              l = e.set_class(t, 1, "send-result svelte-1dvqsh4", null, l, v), e.set_text(i, e.get(u));
            },
            [() => ({ success: !e.get(u).startsWith("Error") })]
          ), e.append(s, t);
        };
        e.if(Me, (s) => {
          e.get(u) && s(De);
        });
      }
      e.reset(N), e.reset(T);
      var z = e.sibling(T, 2), re = e.sibling(e.child(z), 2), ie = e.child(re), de = e.sibling(e.child(ie));
      e.each(
        de,
        21,
        () => e.get(p),
        e.index,
        (s, t) => {
          var l = Ye(), i = e.child(l), v = e.child(i, !0);
          e.reset(i);
          var _ = e.sibling(i), m = e.child(_);
          e.reset(_);
          var P = e.sibling(_), J = e.child(P, !0);
          e.reset(P);
          var M = e.sibling(P), X = e.child(M), Le = e.child(X, !0);
          e.reset(X), e.reset(M);
          var pe = e.sibling(M), Be = e.child(pe, !0);
          e.reset(pe), e.reset(l), e.template_effect(
            (Je, Oe, Ve, $e) => {
              e.set_text(v, e.get(t).to_number), e.set_attribute(_, "title", e.get(t).body), e.set_text(m, `${Je ?? ""}${e.get(t).body.length > 60 ? "…" : ""}`), e.set_text(J, e.get(t).provider), e.set_style(X, `color: ${Oe ?? ""}; background: ${Ve ?? ""}1a`), e.set_text(Le, e.get(t).status), e.set_text(Be, $e);
            },
            [
              () => e.get(t).body.slice(0, 60),
              () => te(e.get(t).status),
              () => te(e.get(t).status),
              () => e.get(t).sent_at ? new Date(e.get(t).sent_at).toLocaleString() : "—"
            ]
          ), e.append(s, l);
        },
        (s) => {
          var t = Ze();
          e.append(s, t);
        }
      ), e.reset(de), e.reset(ie), e.reset(re), e.reset(z);
      var oe = e.sibling(z, 2), ve = e.sibling(e.child(oe), 2);
      e.each(ve, 17, () => e.get(c), e.index, (s, t) => {
        var l = Ke(), i = e.child(l), v = e.child(i), _ = e.child(v, !0);
        e.reset(v);
        var m = e.sibling(v, 2), P = e.child(m, !0);
        e.reset(m), e.reset(i);
        var J = e.sibling(i, 2), M = e.child(J, !0);
        e.reset(J), e.reset(l), e.template_effect(() => {
          e.set_text(_, e.get(t).name), e.set_text(P, e.get(t).provider), e.set_text(M, e.get(t).body);
        }), e.append(s, l);
      });
      var ne = e.sibling(ve, 2), H = e.sibling(e.child(ne), 2), W = e.child(H), ce = e.sibling(e.child(W));
      e.remove_input_defaults(ce), e.reset(W);
      var he = e.sibling(W, 2), Y = e.sibling(e.child(he)), Z = e.child(Y);
      Z.value = Z.__value = "twilio";
      var _e = e.sibling(Z);
      _e.value = _e.__value = "vonage", e.reset(Y), e.reset(he), e.reset(H);
      var K = e.sibling(H, 2), Q = e.sibling(e.child(K));
      e.remove_textarea_child(Q), e.set_attribute(Q, "placeholder", `Hello ${{ name }}, your code is ${{ code }}`), e.reset(K);
      var B = e.sibling(K, 2), Re = e.child(B, !0);
      e.reset(B), e.reset(ne), e.reset(oe), e.template_effect(() => {
        E.disabled = e.get(R), e.set_text(Pe, e.get(R) ? "Sending…" : "Send SMS"), B.disabled = e.get(L), e.set_text(Re, e.get(L) ? "Saving…" : "Save Template");
      }), e.bind_select_value(C, () => e.get(V), (s) => e.set(V, s)), e.bind_value(le, () => e.get(q), (s) => e.set(q, s)), e.bind_select_value(G, () => e.get(g), (s) => e.set(g, s)), e.delegated("click", E, me), e.bind_value(ce, () => e.get(w), (s) => e.set(w, s)), e.bind_select_value(Y, () => e.get($), (s) => e.set($, s)), e.bind_value(Q, () => e.get(S), (s) => e.set(S, s)), e.delegated("click", B, fe), e.append(a, o);
    };
    e.if(qe, (a) => {
      e.get(f) ? a(xe) : e.get(O) ? a(ye, 1) : a(we, -1);
    });
  }
  e.reset(k), e.append(n, k), e.pop();
}
e.delegate(["click"]);
function tt() {
  const n = window.__zveltio;
  n && n.registerRoute({
    path: "sms",
    component: et,
    label: "SMS",
    icon: "MessageSquare",
    category: "communications"
  });
}
tt();
export {
  tt as default
};
