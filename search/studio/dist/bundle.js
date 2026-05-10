var Le = Object.defineProperty;
var Pe = (d, l, a) => l in d ? Le(d, l, { enumerable: !0, configurable: !0, writable: !0, value: a }) : d[l] = a;
var me = (d, l, a) => Pe(d, typeof l != "symbol" ? l + "" : l, a);
import "svelte/internal/disclose-version";
import * as e from "svelte/internal/client";
import { onMount as Te } from "svelte";
const pe = typeof window < "u" ? window.location.origin : "";
typeof window < "u" && (window.__ZVELTIO_ENGINE_URL__ = pe);
class Fe {
  constructor(l) {
    me(this, "base");
    this.base = l;
  }
  async request(l, a, m) {
    const n = await fetch(`${this.base}${a}`, {
      method: l,
      credentials: "include",
      headers: m ? { "Content-Type": "application/json" } : {},
      body: m ? JSON.stringify(m) : void 0
    });
    if (!n.ok) {
      const w = await n.json().catch(() => ({ error: n.statusText }));
      throw new Error(w.error || `Request failed: ${n.status}`);
    }
    return n.json();
  }
  get(l) {
    return this.request("GET", l);
  }
  post(l, a) {
    return this.request("POST", l, a);
  }
  put(l, a) {
    return this.request("PUT", l, a);
  }
  patch(l, a) {
    return this.request("PATCH", l, a);
  }
  delete(l, a) {
    return this.request("DELETE", l, a);
  }
}
const L = new Fe(pe);
var Ue = e.from_html("<option> </option>"), $e = e.from_html('<p class="error svelte-1yovmmp"> </p>'), je = e.from_html('<th class="svelte-1yovmmp"> </th>'), Ae = e.from_html('<td class="cell svelte-1yovmmp"> </td>'), Me = e.from_html("<tr></tr>"), Oe = e.from_html('<div class="results-table-wrap svelte-1yovmmp"><p class="result-count svelte-1yovmmp"> </p> <div class="table-wrapper svelte-1yovmmp"><table class="svelte-1yovmmp"><thead><tr></tr></thead><tbody></tbody></table></div></div>'), Be = e.from_html('<p class="no-results svelte-1yovmmp">No results found.</p>'), Ge = e.from_html('<p class="loading svelte-1yovmmp">Loading indexes…</p>'), ze = e.from_html('<div class="empty-state svelte-1yovmmp"><p class="svelte-1yovmmp">No search indexes configured yet.</p> <button class="btn-configure svelte-1yovmmp">Configure your first index</button></div>'), De = e.from_html('<tr><td class="collection-name svelte-1yovmmp"> </td><td class="svelte-1yovmmp"><span> </span></td><td class="index-name svelte-1yovmmp"><code class="svelte-1yovmmp"> </code></td><td class="svelte-1yovmmp"><span> </span></td><td class="svelte-1yovmmp"> </td><td class="time svelte-1yovmmp"> </td><td class="svelte-1yovmmp"><button class="btn-sm btn-sync svelte-1yovmmp"> </button> <button class="btn-sm svelte-1yovmmp">Edit</button> <button class="btn-sm btn-danger svelte-1yovmmp">Remove</button></td></tr>'), He = e.from_html('<div class="table-wrapper svelte-1yovmmp"><table class="svelte-1yovmmp"><thead><tr><th class="svelte-1yovmmp">Collection</th><th class="svelte-1yovmmp">Provider</th><th class="svelte-1yovmmp">Index Name</th><th class="svelte-1yovmmp">Status</th><th class="svelte-1yovmmp">Records</th><th class="svelte-1yovmmp">Last Synced</th><th class="svelte-1yovmmp">Actions</th></tr></thead><tbody></tbody></table></div>'), Je = e.from_html("<option> </option>"), Ve = e.from_html('<div class="modal-overlay svelte-1yovmmp"><div class="modal svelte-1yovmmp" role="dialog" aria-modal="true"><h2 class="svelte-1yovmmp">Configure Search Index</h2> <div class="modal-form svelte-1yovmmp"><label class="svelte-1yovmmp">Collection <select class="svelte-1yovmmp"><option>Select collection</option><!></select></label> <label class="svelte-1yovmmp">Provider <select class="svelte-1yovmmp"><option>MeiliSearch</option><option>Typesense</option></select></label> <label class="svelte-1yovmmp">Index Name <input type="text" placeholder="e.g. my_collection" class="svelte-1yovmmp"/></label> <label class="svelte-1yovmmp">Searchable Fields (comma-separated) <input type="text" placeholder="name, description, title" class="svelte-1yovmmp"/></label> <label class="svelte-1yovmmp">Filterable Fields (comma-separated) <input type="text" placeholder="status, category" class="svelte-1yovmmp"/></label> <label class="svelte-1yovmmp">Sortable Fields (comma-separated) <input type="text" placeholder="created_at, name" class="svelte-1yovmmp"/></label> <div class="modal-actions svelte-1yovmmp"><button class="btn-cancel svelte-1yovmmp">Cancel</button> <button class="btn-save svelte-1yovmmp"> </button></div></div></div></div>'), Ze = e.from_html('<div class="search-page svelte-1yovmmp"><h1 class="svelte-1yovmmp">Search Adapter</h1> <section class="search-section svelte-1yovmmp"><div class="search-bar svelte-1yovmmp"><select class="collection-select svelte-1yovmmp"><option>Select collection</option><!></select> <input type="search" class="search-input svelte-1yovmmp" placeholder="Search…"/> <button class="btn-search svelte-1yovmmp"> </button></div> <!> <!></section> <section class="indexes-section svelte-1yovmmp"><div class="section-header svelte-1yovmmp"><h2 class="svelte-1yovmmp">Search Indexes</h2> <button class="btn-configure svelte-1yovmmp">+ Configure Index</button></div> <!></section></div> <!>', 1);
function Ke(d, l) {
  e.push(l, !0);
  let a = e.state(""), m = e.state(""), n = e.state(e.proxy([])), w = e.state(e.proxy([])), P = e.state(e.proxy([])), T = e.state(!1), re = e.state(!0), j = e.state(null), A = e.state(null), F = e.state(!1), U = e.state(""), M = e.state("meilisearch"), $ = e.state(""), O = e.state(""), B = e.state(""), G = e.state(""), z = e.state(!1), ie = e.derived(() => {
    var t, s;
    return e.get(n).length > 0 ? Object.keys(((s = (t = e.get(n)[0]) == null ? void 0 : t.hits) == null ? void 0 : s[0]) ?? e.get(n)[0]).slice(0, 8) : [];
  });
  function W() {
    if (!e.get(n).length) return [];
    const t = e.get(n)[0];
    return t != null && t.hits ? t.hits.map((s) => s.document ?? s) : e.get(n);
  }
  async function oe() {
    if (!(!e.get(a).trim() || !e.get(m))) {
      e.set(T, !0), e.set(j, null);
      try {
        const t = await L.get(`/extensions/search/search?q=${encodeURIComponent(e.get(a))}&collection=${encodeURIComponent(e.get(m))}&limit=50`);
        e.set(n, [t.results], !0);
      } catch (t) {
        e.set(j, t.message ?? "Search failed", !0), e.set(n, [], !0);
      } finally {
        e.set(T, !1);
      }
    }
  }
  async function ge(t) {
    e.set(A, t, !0);
    try {
      await L.post(`/extensions/search/indexes/${encodeURIComponent(t)}/sync`, {}), alert(`Sync started for "${t}". Refresh shortly to see updated count.`);
    } catch (s) {
      alert("Sync failed: " + (s.message ?? ""));
    } finally {
      e.set(A, null);
    }
  }
  async function _e(t) {
    if (confirm(`Remove search index for "${t}"?`))
      try {
        await L.delete(`/extensions/search/indexes/${encodeURIComponent(t)}`), e.set(P, e.get(P).map((s) => s.collection === t ? { ...s, status: "inactive" } : s), !0);
      } catch (s) {
        alert("Failed: " + (s.message ?? ""));
      }
  }
  async function ue() {
    if (!e.get(U) || !e.get($)) return alert("Collection and index name are required");
    e.set(z, !0);
    try {
      await L.post("/extensions/search/indexes", {
        collection: e.get(U),
        provider: e.get(M),
        index_name: e.get($),
        searchable_fields: e.get(O).split(",").map((t) => t.trim()).filter(Boolean),
        filterable_fields: e.get(B).split(",").map((t) => t.trim()).filter(Boolean),
        sortable_fields: e.get(G).split(",").map((t) => t.trim()).filter(Boolean)
      }), e.set(F, !1), await ne();
    } catch (t) {
      alert("Failed: " + (t.message ?? ""));
    } finally {
      e.set(z, !1);
    }
  }
  function X(t = "") {
    e.set(U, t, !0), e.set(M, "meilisearch"), e.set($, t || "", !0), e.set(O, ""), e.set(B, ""), e.set(G, ""), e.set(F, !0);
  }
  async function ne() {
    const t = await L.get("/extensions/search/indexes");
    e.set(P, t.indexes ?? [], !0);
  }
  Te(async () => {
    try {
      const [t] = await Promise.all([L.get("/api/collections")]);
      e.set(w, (t.collections ?? []).map((s) => s.name), !0), e.get(w).length > 0 && e.set(m, e.get(w)[0], !0);
    } catch {
    }
    try {
      await ne();
    } catch {
    }
    e.set(re, !1);
  });
  var ce = Ze(), Y = e.first_child(ce), ee = e.sibling(e.child(Y), 2), te = e.child(ee), D = e.child(te), se = e.child(D);
  se.value = se.__value = "";
  var he = e.sibling(se);
  e.each(he, 17, () => e.get(w), e.index, (t, s) => {
    var i = Ue(), h = e.child(i, !0);
    e.reset(i);
    var p = {};
    e.template_effect(() => {
      e.set_text(h, e.get(s)), p !== (p = e.get(s)) && (i.value = (i.__value = e.get(s)) ?? "");
    }), e.append(t, i);
  }), e.reset(D);
  var H = e.sibling(D, 2);
  e.remove_input_defaults(H);
  var J = e.sibling(H, 2), be = e.child(J, !0);
  e.reset(J), e.reset(te);
  var ve = e.sibling(te, 2);
  {
    var fe = (t) => {
      var s = $e(), i = e.child(s, !0);
      e.reset(s), e.template_effect(() => e.set_text(i, e.get(j))), e.append(t, s);
    };
    e.if(ve, (t) => {
      e.get(j) && t(fe);
    });
  }
  var ye = e.sibling(ve, 2);
  {
    var xe = (t) => {
      var s = Oe(), i = e.child(s), h = e.child(i);
      e.reset(i);
      var p = e.sibling(i, 2), r = e.child(p), g = e.child(r), f = e.child(g);
      e.each(f, 21, () => e.get(ie), e.index, (c, _) => {
        var v = je(), u = e.child(v, !0);
        e.reset(v), e.template_effect(() => e.set_text(u, e.get(_))), e.append(c, v);
      }), e.reset(f), e.reset(g);
      var y = e.sibling(g);
      e.each(y, 21, W, e.index, (c, _) => {
        var v = Me();
        e.each(v, 21, () => e.get(ie), e.index, (u, S) => {
          var b = Ae(), x = e.child(b, !0);
          e.reset(b), e.template_effect(() => e.set_text(x, e.get(_)[e.get(S)] ?? "—")), e.append(u, b);
        }), e.reset(v), e.append(c, v);
      }), e.reset(y), e.reset(r), e.reset(p), e.reset(s), e.template_effect((c) => e.set_text(h, `${c ?? ""} results`), [() => W().length]), e.append(t, s);
    }, we = e.derived(() => W().length > 0), Se = (t) => {
      var s = Be();
      e.append(t, s);
    };
    e.if(ye, (t) => {
      e.get(we) ? t(xe) : !e.get(T) && e.get(a) && e.get(m) && t(Se, 1);
    });
  }
  e.reset(ee);
  var de = e.sibling(ee, 2), le = e.child(de), Ce = e.sibling(e.child(le), 2);
  e.reset(le);
  var Ie = e.sibling(le, 2);
  {
    var ke = (t) => {
      var s = Ge();
      e.append(t, s);
    }, Re = (t) => {
      var s = ze(), i = e.sibling(e.child(s), 2);
      e.reset(s), e.delegated("click", i, () => X()), e.append(t, s);
    }, Ee = (t) => {
      var s = He(), i = e.child(s), h = e.sibling(e.child(i));
      e.each(h, 21, () => e.get(P), e.index, (p, r) => {
        var g = De(), f = e.child(g), y = e.child(f, !0);
        e.reset(f);
        var c = e.sibling(f), _ = e.child(c), v = e.child(_, !0);
        e.reset(_), e.reset(c);
        var u = e.sibling(c), S = e.child(u), b = e.child(S, !0);
        e.reset(S), e.reset(u);
        var x = e.sibling(u), C = e.child(x), V = e.child(C, !0);
        e.reset(C), e.reset(x);
        var I = e.sibling(x), Z = e.child(I, !0);
        e.reset(I);
        var N = e.sibling(I), K = e.child(N, !0);
        e.reset(N);
        var k = e.sibling(N), R = e.child(k), o = e.child(R, !0);
        e.reset(R);
        var q = e.sibling(R, 2), E = e.sibling(q, 2);
        e.reset(k), e.reset(g), e.template_effect(
          (ae, Q) => {
            e.set_text(y, e.get(r).collection), e.set_class(_, 1, `provider-badge provider-${e.get(r).provider ?? ""}`, "svelte-1yovmmp"), e.set_text(v, e.get(r).provider), e.set_text(b, e.get(r).index_name), e.set_class(C, 1, `status-badge status-${e.get(r).status ?? ""}`, "svelte-1yovmmp"), e.set_text(V, e.get(r).status), e.set_text(Z, ae), e.set_text(K, Q), R.disabled = e.get(A) === e.get(r).collection, e.set_text(o, e.get(A) === e.get(r).collection ? "Syncing…" : "Sync");
          },
          [
            () => (e.get(r).record_count ?? 0).toLocaleString(),
            () => e.get(r).last_synced_at ? new Date(e.get(r).last_synced_at).toLocaleString() : "Never"
          ]
        ), e.delegated("click", R, () => ge(e.get(r).collection)), e.delegated("click", q, () => X(e.get(r).collection)), e.delegated("click", E, () => _e(e.get(r).collection)), e.append(p, g);
      }), e.reset(h), e.reset(i), e.reset(s), e.append(t, s);
    };
    e.if(Ie, (t) => {
      e.get(re) ? t(ke) : e.get(P).length === 0 ? t(Re, 1) : t(Ee, -1);
    });
  }
  e.reset(de), e.reset(Y);
  var Ne = e.sibling(Y, 2);
  {
    var qe = (t) => {
      var s = Ve(), i = e.child(s), h = e.sibling(e.child(i), 2), p = e.child(h), r = e.sibling(e.child(p)), g = e.child(r);
      g.value = g.__value = "";
      var f = e.sibling(g);
      e.each(f, 17, () => e.get(w), e.index, (o, q) => {
        var E = Je(), ae = e.child(E, !0);
        e.reset(E);
        var Q = {};
        e.template_effect(() => {
          e.set_text(ae, e.get(q)), Q !== (Q = e.get(q)) && (E.value = (E.__value = e.get(q)) ?? "");
        }), e.append(o, E);
      }), e.reset(r), e.reset(p);
      var y = e.sibling(p, 2), c = e.sibling(e.child(y)), _ = e.child(c);
      _.value = _.__value = "meilisearch";
      var v = e.sibling(_);
      v.value = v.__value = "typesense", e.reset(c), e.reset(y);
      var u = e.sibling(y, 2), S = e.sibling(e.child(u));
      e.remove_input_defaults(S), e.reset(u);
      var b = e.sibling(u, 2), x = e.sibling(e.child(b));
      e.remove_input_defaults(x), e.reset(b);
      var C = e.sibling(b, 2), V = e.sibling(e.child(C));
      e.remove_input_defaults(V), e.reset(C);
      var I = e.sibling(C, 2), Z = e.sibling(e.child(I));
      e.remove_input_defaults(Z), e.reset(I);
      var N = e.sibling(I, 2), K = e.child(N), k = e.sibling(K, 2), R = e.child(k, !0);
      e.reset(k), e.reset(N), e.reset(h), e.reset(i), e.reset(s), e.template_effect(() => {
        k.disabled = e.get(z), e.set_text(R, e.get(z) ? "Saving…" : "Save Index Config");
      }), e.delegated("click", s, () => {
        e.set(F, !1);
      }), e.delegated("click", i, (o) => o.stopPropagation()), e.bind_select_value(r, () => e.get(U), (o) => e.set(U, o)), e.bind_select_value(c, () => e.get(M), (o) => e.set(M, o)), e.bind_value(S, () => e.get($), (o) => e.set($, o)), e.bind_value(x, () => e.get(O), (o) => e.set(O, o)), e.bind_value(V, () => e.get(B), (o) => e.set(B, o)), e.bind_value(Z, () => e.get(G), (o) => e.set(G, o)), e.delegated("click", K, () => {
        e.set(F, !1);
      }), e.delegated("click", k, ue), e.append(t, s);
    };
    e.if(Ne, (t) => {
      e.get(F) && t(qe);
    });
  }
  e.template_effect(
    (t) => {
      J.disabled = t, e.set_text(be, e.get(T) ? "Searching…" : "Search");
    },
    [
      () => e.get(T) || !e.get(m) || !e.get(a).trim()
    ]
  ), e.bind_select_value(D, () => e.get(m), (t) => e.set(m, t)), e.delegated("keydown", H, (t) => t.key === "Enter" && oe()), e.bind_value(H, () => e.get(a), (t) => e.set(a, t)), e.delegated("click", J, oe), e.delegated("click", Ce, () => X()), e.append(d, ce), e.pop();
}
e.delegate(["keydown", "click"]);
function Qe() {
  const d = window.__zveltio;
  d && d.registerRoute({
    path: "search",
    component: Ke,
    label: "Search",
    icon: "Search",
    category: "developer"
  });
}
Qe();
export {
  Qe as default
};
