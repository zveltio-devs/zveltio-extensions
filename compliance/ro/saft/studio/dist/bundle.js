import "svelte/internal/disclose-version";
import * as t from "svelte/internal/client";
import { onMount as zt } from "svelte";
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
const jt = {
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
var Rt = t.from_svg("<svg><!><!></svg>");
function J(y, s) {
  t.push(s, !0);
  const d = t.prop(s, "color", 3, "currentColor"), _ = t.prop(s, "size", 3, 24), S = t.prop(s, "strokeWidth", 3, 2), P = t.prop(s, "absoluteStrokeWidth", 3, !1), u = t.prop(s, "iconNode", 19, () => []), $ = t.rest_props(s, [
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
  var I = Rt();
  t.attribute_effect(
    I,
    (R) => ({
      ...jt,
      ...$,
      width: _(),
      height: _(),
      stroke: d(),
      "stroke-width": R,
      class: [
        "lucide-icon lucide",
        s.name && `lucide-${s.name}`,
        s.class
      ]
    }),
    [
      () => P() ? Number(S()) * 24 / Number(_()) : S()
    ]
  );
  var j = t.child(I);
  t.each(j, 17, u, t.index, (R, D) => {
    var E = t.derived(() => t.to_array(t.get(D), 2));
    let L = () => t.get(E)[0], m = () => t.get(E)[1];
    var V = t.comment(), X = t.first_child(V);
    t.element(X, L, !0, (B, Z) => {
      t.attribute_effect(B, () => ({ ...m() }));
    }), t.append(R, V);
  });
  var U = t.sibling(j);
  t.snippet(U, () => s.children ?? t.noop), t.reset(I), t.append(y, I), t.pop();
}
function It(y, s) {
  t.push(s, !0);
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
  let d = t.rest_props(s, ["$$slots", "$$events", "$$legacy"]);
  const _ = [
    ["path", { d: "M12 15V3" }],
    ["path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }],
    ["path", { d: "m7 10 5 5 5-5" }]
  ];
  J(y, t.spread_props({ name: "download" }, () => d, {
    get iconNode() {
      return _;
    },
    children: (S, P) => {
      var u = t.comment(), $ = t.first_child(u);
      t.snippet($, () => s.children ?? t.noop), t.append(S, u);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function Ut(y, s) {
  t.push(s, !0);
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
  let d = t.rest_props(s, ["$$slots", "$$events", "$$legacy"]);
  const _ = [
    [
      "path",
      {
        d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"
      }
    ],
    ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }],
    ["path", { d: "M8 13h2" }],
    ["path", { d: "M14 13h2" }],
    ["path", { d: "M8 17h2" }],
    ["path", { d: "M14 17h2" }]
  ];
  J(y, t.spread_props({ name: "file-spreadsheet" }, () => d, {
    get iconNode() {
      return _;
    },
    children: (S, P) => {
      var u = t.comment(), $ = t.first_child(u);
      t.snippet($, () => s.children ?? t.noop), t.append(S, u);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function st(y, s) {
  t.push(s, !0);
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
  let d = t.rest_props(s, ["$$slots", "$$events", "$$legacy"]);
  const _ = [["path", { d: "M5 12h14" }], ["path", { d: "M12 5v14" }]];
  J(y, t.spread_props({ name: "plus" }, () => d, {
    get iconNode() {
      return _;
    },
    children: (S, P) => {
      var u = t.comment(), $ = t.first_child(u);
      t.snippet($, () => s.children ?? t.noop), t.append(S, u);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function Xt(y, s) {
  t.push(s, !0);
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
  let d = t.rest_props(s, ["$$slots", "$$events", "$$legacy"]);
  const _ = [
    [
      "path",
      { d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" }
    ],
    ["path", { d: "M21 3v5h-5" }],
    [
      "path",
      { d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" }
    ],
    ["path", { d: "M8 16H3v5" }]
  ];
  J(y, t.spread_props({ name: "refresh-cw" }, () => d, {
    get iconNode() {
      return _;
    },
    children: (S, P) => {
      var u = t.comment(), $ = t.first_child(u);
      t.snippet($, () => s.children ?? t.noop), t.append(S, u);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function Wt(y, s) {
  t.push(s, !0);
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
  let d = t.rest_props(s, ["$$slots", "$$events", "$$legacy"]);
  const _ = [
    [
      "path",
      {
        d: "M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"
      }
    ],
    ["path", { d: "m21.854 2.147-10.94 10.939" }]
  ];
  J(y, t.spread_props({ name: "send" }, () => d, {
    get iconNode() {
      return _;
    },
    children: (S, P) => {
      var u = t.comment(), $ = t.first_child(u);
      t.snippet($, () => s.children ?? t.noop), t.append(S, u);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
function it(y, s) {
  t.push(s, !0);
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
  let d = t.rest_props(s, ["$$slots", "$$events", "$$legacy"]);
  const _ = [
    ["path", { d: "M3 6h18" }],
    ["path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" }],
    ["path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" }],
    ["line", { x1: "10", x2: "10", y1: "11", y2: "17" }],
    ["line", { x1: "14", x2: "14", y1: "11", y2: "17" }]
  ];
  J(y, t.spread_props({ name: "trash-2" }, () => d, {
    get iconNode() {
      return _;
    },
    children: (S, P) => {
      var u = t.comment(), $ = t.first_child(u);
      t.snippet($, () => s.children ?? t.noop), t.append(S, u);
    },
    $$slots: { default: !0 }
  })), t.pop();
}
var Jt = t.from_html('<button class="btn btn-primary btn-sm gap-2"><!> New Export</button>'), Vt = t.from_html('<button class="btn btn-primary btn-sm gap-2"><!> Add Account</button>'), Bt = t.from_html('<button class="btn btn-primary btn-sm gap-2"><!> Add Entry</button>'), Ht = t.from_html("<button> </button>"), Gt = t.from_html('<div class="flex justify-center py-12"><span class="loading loading-spinner loading-lg"></span></div>'), Zt = t.from_html('<div class="card bg-base-200 text-center py-12"><!> <p class="text-base-content/60">No SAF-T exports yet</p> <button class="btn btn-primary btn-sm mt-4">Create Export</button></div>'), Yt = t.from_html('<button class="btn btn-ghost btn-xs" title="Generate XML">XML</button>'), qt = t.from_html('<button class="btn btn-ghost btn-xs"><!></button>'), Kt = t.from_html('<button class="btn btn-ghost btn-xs text-primary"><!></button>'), Qt = t.from_html('<button class="btn btn-ghost btn-xs text-error"><!></button>'), te = t.from_html('<tr><td class="font-mono text-sm"> </td><td> </td><td class="font-mono text-xs"> </td><td><span> </span></td><td><div class="flex gap-1"><!> <!> <!> <!></div></td></tr>'), ee = t.from_html('<div class="card bg-base-200"><div class="overflow-x-auto"><table class="table table-sm"><thead><tr><th>Period</th><th>Company</th><th>CUI</th><th>Status</th><th></th></tr></thead><tbody></tbody></table></div></div>'), ae = t.from_html('<tr><td colspan="4" class="text-center text-base-content/40 py-8">No accounts defined</td></tr>'), se = t.from_html('<tr><td class="font-mono font-medium"> </td><td> </td><td><span class="badge badge-sm badge-ghost"> </span></td><td><button class="btn btn-ghost btn-xs text-error"><!></button></td></tr>'), ie = t.from_html('<div class="card bg-base-200"><div class="overflow-x-auto"><table class="table table-sm"><thead><tr><th>Code</th><th>Description</th><th>Type</th><th></th></tr></thead><tbody><!><!></tbody></table></div></div>'), ne = t.from_html('<tr><td colspan="7" class="text-center text-base-content/40 py-8">No journal entries</td></tr>'), re = t.from_html('<tr><td class="font-mono text-xs"> </td><td class="font-mono text-xs font-medium"> </td><td class="max-w-48 truncate"> </td><td class="font-mono text-xs text-base-content/50"> </td><td class="text-right font-mono text-xs"> </td><td class="text-right font-mono text-xs"> </td><td><button class="btn btn-ghost btn-xs text-error"><!></button></td></tr>'), le = t.from_html('<div class="card bg-base-200"><div class="overflow-x-auto"><table class="table table-sm"><thead><tr><th>Date</th><th>Account</th><th>Description</th><th>Document</th><th class="text-right">Debit</th><th class="text-right">Credit</th><th></th></tr></thead><tbody><!><!></tbody></table></div></div>'), oe = t.from_html('<span class="loading loading-spinner loading-sm"></span>'), de = t.from_html('<dialog class="modal modal-open"><div class="modal-box max-w-lg"><h3 class="font-bold text-lg mb-4">New SAF-T Export</h3> <div class="space-y-3"><div class="grid grid-cols-2 gap-3"><div class="form-control"><label class="label" for="saft-period-start"><span class="label-text text-xs">Period start</span></label> <input id="saft-period-start" type="date" class="input input-sm"/></div> <div class="form-control"><label class="label" for="saft-period-end"><span class="label-text text-xs">Period end</span></label> <input id="saft-period-end" type="date" class="input input-sm"/></div></div> <div class="form-control"><label class="label" for="saft-company-name"><span class="label-text text-xs">Company name</span></label> <input id="saft-company-name" type="text" placeholder="SC Example SRL" class="input input-sm"/></div> <div class="form-control"><label class="label" for="saft-company-cui"><span class="label-text text-xs">CUI/CIF</span></label> <input id="saft-company-cui" type="text" placeholder="RO12345678" class="input input-sm font-mono"/></div> <div class="form-control"><label class="label" for="saft-company-address"><span class="label-text text-xs">Address (optional)</span></label> <input id="saft-company-address" type="text" placeholder="Str. Exemplu nr. 1, București" class="input input-sm"/></div></div> <div class="modal-action"><button class="btn btn-ghost">Cancel</button> <button class="btn btn-primary"><!> Create Export</button></div></div> <button class="modal-backdrop" aria-label="Close"></button></dialog>'), ce = t.from_html('<dialog class="modal modal-open"><div class="modal-box max-w-sm"><h3 class="font-bold text-lg mb-4">Add Account</h3> <div class="space-y-3"><div class="form-control"><label class="label" for="account-code"><span class="label-text text-xs">Account code</span></label> <input id="account-code" type="text" placeholder="101" class="input input-sm font-mono"/></div> <div class="form-control"><label class="label" for="account-description"><span class="label-text text-xs">Description</span></label> <input id="account-description" type="text" placeholder="Capital social" class="input input-sm"/></div> <div class="form-control"><label class="label" for="account-type"><span class="label-text text-xs">Type</span></label> <select id="account-type" class="select select-sm"><option>Balance</option><option>Income</option><option>Expense</option></select></div></div> <div class="modal-action"><button class="btn btn-ghost">Cancel</button> <button class="btn btn-primary">Add</button></div></div> <button class="modal-backdrop" aria-label="Close"></button></dialog>'), pe = t.from_html('<dialog class="modal modal-open"><div class="modal-box max-w-lg"><h3 class="font-bold text-lg mb-4">Add Journal Entry</h3> <div class="space-y-3"><div class="grid grid-cols-2 gap-3"><div class="form-control"><label class="label" for="entry-date"><span class="label-text text-xs">Date</span></label> <input id="entry-date" type="date" class="input input-sm"/></div> <div class="form-control"><label class="label" for="entry-account-code"><span class="label-text text-xs">Account code</span></label> <input id="entry-account-code" type="text" placeholder="101" class="input input-sm font-mono"/></div></div> <div class="form-control"><label class="label" for="entry-description"><span class="label-text text-xs">Description</span></label> <input id="entry-description" type="text" placeholder="Entry description" class="input input-sm"/></div> <div class="form-control"><label class="label" for="entry-document-number"><span class="label-text text-xs">Document number (optional)</span></label> <input id="entry-document-number" type="text" placeholder="FAC-2026-001" class="input input-sm font-mono"/></div> <div class="grid grid-cols-2 gap-3"><div class="form-control"><label class="label" for="entry-debit"><span class="label-text text-xs">Debit (RON)</span></label> <input id="entry-debit" type="number" step="0.01" class="input input-sm font-mono"/></div> <div class="form-control"><label class="label" for="entry-credit"><span class="label-text text-xs">Credit (RON)</span></label> <input id="entry-credit" type="number" step="0.01" class="input input-sm font-mono"/></div></div></div> <div class="modal-action"><button class="btn btn-ghost">Cancel</button> <button class="btn btn-primary">Add Entry</button></div></div> <button class="modal-backdrop" aria-label="Close"></button></dialog>'), ue = t.from_html('<div class="space-y-6"><div class="flex items-center justify-between"><div><h1 class="text-2xl font-bold">SAF-T RO</h1> <p class="text-base-content/60 text-sm mt-1">Standard Audit File for Tax — generate D.394 XML for ANAF</p></div> <div class="flex gap-2"><button class="btn btn-ghost btn-sm"><!></button> <!></div></div> <div class="tabs tabs-boxed w-fit"></div> <!></div> <!> <!> <!>', 1);
function ve(y, s) {
  t.push(s, !0);
  const d = window.__ZVELTIO_ENGINE_URL__ || "";
  let _ = t.state("exports");
  function S(e) {
    t.set(_, e, !0);
  }
  let P = t.state(t.proxy([])), u = t.state(t.proxy([])), $ = t.state(t.proxy([])), I = t.state(!0), j = t.state(!1), U = t.state(!1), R = t.state(!1), D = t.state(!1), E = t.proxy({
    period_start: new Date((/* @__PURE__ */ new Date()).getFullYear(), 0, 1).toISOString().split("T")[0],
    period_end: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    company_name: "",
    company_cui: "",
    company_address: ""
  }), L = t.state(t.proxy({ code: "", description: "", account_type: "balance" })), m = t.state(t.proxy({
    account_code: "",
    entry_date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    description: "",
    debit: 0,
    credit: 0,
    document_number: ""
  }));
  zt(() => V());
  async function V() {
    t.set(I, !0), await Promise.all([X(), B(), Z()]), t.set(I, !1);
  }
  async function X() {
    const a = await (await fetch(`${d}/api/saft`, { credentials: "include" })).json();
    t.set(P, a.exports || [], !0);
  }
  async function B() {
    const a = await (await fetch(`${d}/api/saft/accounts`, { credentials: "include" })).json();
    t.set(u, a.accounts || [], !0);
  }
  async function Z() {
    const a = await (await fetch(`${d}/api/saft/entries`, { credentials: "include" })).json();
    t.set($, a.entries || [], !0);
  }
  async function ct() {
    if (!(!E.company_name || !E.company_cui)) {
      t.set(D, !0);
      try {
        if (!(await fetch(`${d}/api/saft`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(E)
        })).ok) throw new Error("Failed");
        t.set(j, !1), await X();
      } finally {
        t.set(D, !1);
      }
    }
  }
  async function pt(e) {
    const a = await fetch(`${d}/api/saft/${e}/generate`, { method: "POST", credentials: "include" });
    if (a.ok)
      alert("SAF-T XML generated successfully!"), await X();
    else {
      const n = await a.json();
      alert(n.error || "Failed to generate XML");
    }
  }
  async function ut(e, a, n) {
    const c = await fetch(`${d}/api/saft/${e}/xml`, { credentials: "include" });
    if (!c.ok) {
      alert("Generate XML first");
      return;
    }
    const v = await c.blob(), r = URL.createObjectURL(v), o = document.createElement("a");
    o.href = r, o.download = `SAFT_${a}_${n}.xml`, o.click(), URL.revokeObjectURL(r);
  }
  async function vt(e) {
    if (!confirm("Submit this SAF-T export to ANAF?")) return;
    const a = await fetch(`${d}/api/saft/${e}/submit`, { method: "POST", credentials: "include" }), n = await a.json();
    a.ok ? (alert("Submitted to ANAF!"), await X()) : alert(n.error || "Submission failed");
  }
  async function bt(e) {
    confirm("Delete this export?") && (await fetch(`${d}/api/saft/${e}`, { method: "DELETE", credentials: "include" }), await X());
  }
  async function _t() {
    if (!(!t.get(L).code || !t.get(L).description)) {
      t.set(D, !0);
      try {
        await fetch(`${d}/api/saft/accounts`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(t.get(L))
        }), t.set(U, !1), t.set(L, { code: "", description: "", account_type: "balance" }, !0), await B();
      } finally {
        t.set(D, !1);
      }
    }
  }
  async function ht(e) {
    confirm("Delete this account?") && (await fetch(`${d}/api/saft/accounts/${e}`, { method: "DELETE", credentials: "include" }), await B());
  }
  async function mt() {
    if (!(!t.get(m).account_code || !t.get(m).description)) {
      t.set(D, !0);
      try {
        await fetch(`${d}/api/saft/entries`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...t.get(m),
            debit: Number(t.get(m).debit),
            credit: Number(t.get(m).credit)
          })
        }), t.set(R, !1), t.set(
          m,
          {
            account_code: "",
            entry_date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
            description: "",
            debit: 0,
            credit: 0,
            document_number: ""
          },
          !0
        ), await Z();
      } finally {
        t.set(D, !1);
      }
    }
  }
  async function gt(e) {
    confirm("Delete this entry?") && (await fetch(`${d}/api/saft/entries/${e}`, { method: "DELETE", credentials: "include" }), await Z());
  }
  function ft(e) {
    return {
      draft: "badge-warning",
      generated: "badge-info",
      submitted: "badge-success"
    }[e] || "badge-ghost";
  }
  var nt = ue(), K = t.first_child(nt), Q = t.child(K), rt = t.sibling(t.child(Q), 2), Y = t.child(rt), xt = t.child(Y);
  Xt(xt, { size: 14 }), t.reset(Y);
  var yt = t.sibling(Y, 2);
  {
    var wt = (e) => {
      var a = Jt(), n = t.child(a);
      st(n, { size: 16 }), t.next(), t.reset(a), t.delegated("click", a, () => t.set(j, !0)), t.append(e, a);
    }, kt = (e) => {
      var a = Vt(), n = t.child(a);
      st(n, { size: 16 }), t.next(), t.reset(a), t.delegated("click", a, () => t.set(U, !0)), t.append(e, a);
    }, $t = (e) => {
      var a = Bt(), n = t.child(a);
      st(n, { size: 16 }), t.next(), t.reset(a), t.delegated("click", a, () => t.set(R, !0)), t.append(e, a);
    };
    t.if(yt, (e) => {
      t.get(_) === "exports" ? e(wt) : t.get(_) === "accounts" ? e(kt, 1) : e($t, -1);
    });
  }
  t.reset(rt), t.reset(Q);
  var tt = t.sibling(Q, 2);
  t.each(
    tt,
    20,
    () => [
      ["exports", "Exports"],
      ["accounts", "Accounts"],
      ["entries", "Journal Entries"]
    ],
    t.index,
    (e, a) => {
      var n = t.derived(() => t.to_array(a, 2));
      let c = () => t.get(n)[0], v = () => t.get(n)[1];
      var r = Ht(), o = t.child(r, !0);
      t.reset(r), t.template_effect(() => {
        t.set_class(r, 1, `tab ${t.get(_) === c() ? "tab-active" : ""}`), t.set_text(o, v());
      }), t.delegated("click", r, () => S(c())), t.append(e, r);
    }
  ), t.reset(tt);
  var At = t.sibling(tt, 2);
  {
    var Nt = (e) => {
      var a = Gt();
      t.append(e, a);
    }, St = (e) => {
      var a = t.comment(), n = t.first_child(a);
      {
        var c = (r) => {
          var o = Zt(), w = t.child(o);
          Ut(w, { size: 48, class: "mx-auto text-base-content/20 mb-3" });
          var p = t.sibling(w, 4);
          t.reset(o), t.delegated("click", p, () => t.set(j, !0)), t.append(r, o);
        }, v = (r) => {
          var o = ee(), w = t.child(o), p = t.child(w), l = t.sibling(t.child(p));
          t.each(l, 21, () => t.get(P), t.index, (x, i) => {
            var T = te(), g = t.child(T), C = t.child(g);
            t.reset(g);
            var f = t.sibling(g), F = t.child(f, !0);
            t.reset(f);
            var b = t.sibling(f), z = t.child(b, !0);
            t.reset(b);
            var M = t.sibling(b), O = t.child(M), h = t.child(O, !0);
            t.reset(O), t.reset(M);
            var k = t.sibling(M), H = t.child(k), W = t.child(H);
            {
              var et = (A) => {
                var N = Yt();
                t.delegated("click", N, () => pt(t.get(i).id)), t.append(A, N);
              };
              t.if(W, (A) => {
                t.get(i).status === "draft" && A(et);
              });
            }
            var q = t.sibling(W, 2);
            {
              var at = (A) => {
                var N = qt(), G = t.child(N);
                It(G, { size: 12 }), t.reset(N), t.delegated("click", N, () => ut(t.get(i).id, t.get(i).period_start, t.get(i).period_end)), t.append(A, N);
              };
              t.if(q, (A) => {
                t.get(i).status !== "draft" && A(at);
              });
            }
            var dt = t.sibling(q, 2);
            {
              var Lt = (A) => {
                var N = Kt(), G = t.child(N);
                Wt(G, { size: 12 }), t.reset(N), t.delegated("click", N, () => vt(t.get(i).id)), t.append(A, N);
              };
              t.if(dt, (A) => {
                t.get(i).status === "generated" && A(Lt);
              });
            }
            var Ot = t.sibling(dt, 2);
            {
              var Pt = (A) => {
                var N = Qt(), G = t.child(N);
                it(G, { size: 12 }), t.reset(N), t.delegated("click", N, () => bt(t.get(i).id)), t.append(A, N);
              };
              t.if(Ot, (A) => {
                t.get(i).status === "draft" && A(Pt);
              });
            }
            t.reset(H), t.reset(k), t.reset(T), t.template_effect(
              (A) => {
                t.set_text(C, `${t.get(i).period_start ?? ""} → ${t.get(i).period_end ?? ""}`), t.set_text(F, t.get(i).company_name), t.set_text(z, t.get(i).company_cui), t.set_class(O, 1, `badge badge-sm ${A ?? ""}`), t.set_text(h, t.get(i).status);
              },
              [() => ft(t.get(i).status)]
            ), t.append(x, T);
          }), t.reset(l), t.reset(p), t.reset(w), t.reset(o), t.append(r, o);
        };
        t.if(n, (r) => {
          t.get(P).length === 0 ? r(c) : r(v, -1);
        });
      }
      t.append(e, a);
    }, Et = (e) => {
      var a = ie(), n = t.child(a), c = t.child(n), v = t.sibling(t.child(c)), r = t.child(v);
      {
        var o = (p) => {
          var l = ae();
          t.append(p, l);
        };
        t.if(r, (p) => {
          t.get(u).length === 0 && p(o);
        });
      }
      var w = t.sibling(r);
      t.each(w, 17, () => t.get(u), t.index, (p, l) => {
        var x = se(), i = t.child(x), T = t.child(i, !0);
        t.reset(i);
        var g = t.sibling(i), C = t.child(g, !0);
        t.reset(g);
        var f = t.sibling(g), F = t.child(f), b = t.child(F, !0);
        t.reset(F), t.reset(f);
        var z = t.sibling(f), M = t.child(z), O = t.child(M);
        it(O, { size: 12 }), t.reset(M), t.reset(z), t.reset(x), t.template_effect(() => {
          t.set_text(T, t.get(l).code), t.set_text(C, t.get(l).description), t.set_text(b, t.get(l).account_type);
        }), t.delegated("click", M, () => ht(t.get(l).id)), t.append(p, x);
      }), t.reset(v), t.reset(c), t.reset(n), t.reset(a), t.append(e, a);
    }, Tt = (e) => {
      var a = le(), n = t.child(a), c = t.child(n), v = t.sibling(t.child(c)), r = t.child(v);
      {
        var o = (p) => {
          var l = ne();
          t.append(p, l);
        };
        t.if(r, (p) => {
          t.get($).length === 0 && p(o);
        });
      }
      var w = t.sibling(r);
      t.each(w, 17, () => t.get($), t.index, (p, l) => {
        var x = re(), i = t.child(x), T = t.child(i, !0);
        t.reset(i);
        var g = t.sibling(i), C = t.child(g, !0);
        t.reset(g);
        var f = t.sibling(g), F = t.child(f, !0);
        t.reset(f);
        var b = t.sibling(f), z = t.child(b, !0);
        t.reset(b);
        var M = t.sibling(b), O = t.child(M, !0);
        t.reset(M);
        var h = t.sibling(M), k = t.child(h, !0);
        t.reset(h);
        var H = t.sibling(h), W = t.child(H), et = t.child(W);
        it(et, { size: 12 }), t.reset(W), t.reset(H), t.reset(x), t.template_effect(
          (q, at) => {
            t.set_text(T, t.get(l).entry_date), t.set_text(C, t.get(l).account_code), t.set_text(F, t.get(l).description), t.set_text(z, t.get(l).document_number || "—"), t.set_text(O, q), t.set_text(k, at);
          },
          [
            () => Number(t.get(l).debit).toFixed(2),
            () => Number(t.get(l).credit).toFixed(2)
          ]
        ), t.delegated("click", W, () => gt(t.get(l).id)), t.append(p, x);
      }), t.reset(v), t.reset(c), t.reset(n), t.reset(a), t.append(e, a);
    };
    t.if(At, (e) => {
      t.get(I) ? e(Nt) : t.get(_) === "exports" ? e(St, 1) : t.get(_) === "accounts" ? e(Et, 2) : e(Tt, -1);
    });
  }
  t.reset(K);
  var lt = t.sibling(K, 2);
  {
    var Mt = (e) => {
      var a = de(), n = t.child(a), c = t.sibling(t.child(n), 2), v = t.child(c), r = t.child(v), o = t.sibling(t.child(r), 2);
      t.remove_input_defaults(o), t.reset(r);
      var w = t.sibling(r, 2), p = t.sibling(t.child(w), 2);
      t.remove_input_defaults(p), t.reset(w), t.reset(v);
      var l = t.sibling(v, 2), x = t.sibling(t.child(l), 2);
      t.remove_input_defaults(x), t.reset(l);
      var i = t.sibling(l, 2), T = t.sibling(t.child(i), 2);
      t.remove_input_defaults(T), t.reset(i);
      var g = t.sibling(i, 2), C = t.sibling(t.child(g), 2);
      t.remove_input_defaults(C), t.reset(g), t.reset(c);
      var f = t.sibling(c, 2), F = t.child(f), b = t.sibling(F, 2), z = t.child(b);
      {
        var M = (h) => {
          var k = oe();
          t.append(h, k);
        };
        t.if(z, (h) => {
          t.get(D) && h(M);
        });
      }
      t.next(), t.reset(b), t.reset(f), t.reset(n);
      var O = t.sibling(n, 2);
      t.reset(a), t.template_effect(() => b.disabled = t.get(D)), t.bind_value(o, () => E.period_start, (h) => E.period_start = h), t.bind_value(p, () => E.period_end, (h) => E.period_end = h), t.bind_value(x, () => E.company_name, (h) => E.company_name = h), t.bind_value(T, () => E.company_cui, (h) => E.company_cui = h), t.bind_value(C, () => E.company_address, (h) => E.company_address = h), t.delegated("click", F, () => t.set(j, !1)), t.delegated("click", b, ct), t.delegated("click", O, () => t.set(j, !1)), t.append(e, a);
    };
    t.if(lt, (e) => {
      t.get(j) && e(Mt);
    });
  }
  var ot = t.sibling(lt, 2);
  {
    var Ct = (e) => {
      var a = ce(), n = t.child(a), c = t.sibling(t.child(n), 2), v = t.child(c), r = t.sibling(t.child(v), 2);
      t.remove_input_defaults(r), t.reset(v);
      var o = t.sibling(v, 2), w = t.sibling(t.child(o), 2);
      t.remove_input_defaults(w), t.reset(o);
      var p = t.sibling(o, 2), l = t.sibling(t.child(p), 2), x = t.child(l);
      x.value = x.__value = "balance";
      var i = t.sibling(x);
      i.value = i.__value = "income";
      var T = t.sibling(i);
      T.value = T.__value = "expense", t.reset(l), t.reset(p), t.reset(c);
      var g = t.sibling(c, 2), C = t.child(g), f = t.sibling(C, 2);
      t.reset(g), t.reset(n);
      var F = t.sibling(n, 2);
      t.reset(a), t.template_effect(() => f.disabled = t.get(D)), t.bind_value(r, () => t.get(L).code, (b) => t.get(L).code = b), t.bind_value(w, () => t.get(L).description, (b) => t.get(L).description = b), t.bind_select_value(l, () => t.get(L).account_type, (b) => t.get(L).account_type = b), t.delegated("click", C, () => t.set(U, !1)), t.delegated("click", f, _t), t.delegated("click", F, () => t.set(U, !1)), t.append(e, a);
    };
    t.if(ot, (e) => {
      t.get(U) && e(Ct);
    });
  }
  var Ft = t.sibling(ot, 2);
  {
    var Dt = (e) => {
      var a = pe(), n = t.child(a), c = t.sibling(t.child(n), 2), v = t.child(c), r = t.child(v), o = t.sibling(t.child(r), 2);
      t.remove_input_defaults(o), t.reset(r);
      var w = t.sibling(r, 2), p = t.sibling(t.child(w), 2);
      t.remove_input_defaults(p), t.reset(w), t.reset(v);
      var l = t.sibling(v, 2), x = t.sibling(t.child(l), 2);
      t.remove_input_defaults(x), t.reset(l);
      var i = t.sibling(l, 2), T = t.sibling(t.child(i), 2);
      t.remove_input_defaults(T), t.reset(i);
      var g = t.sibling(i, 2), C = t.child(g), f = t.sibling(t.child(C), 2);
      t.remove_input_defaults(f), t.reset(C);
      var F = t.sibling(C, 2), b = t.sibling(t.child(F), 2);
      t.remove_input_defaults(b), t.reset(F), t.reset(g), t.reset(c);
      var z = t.sibling(c, 2), M = t.child(z), O = t.sibling(M, 2);
      t.reset(z), t.reset(n);
      var h = t.sibling(n, 2);
      t.reset(a), t.template_effect(() => O.disabled = t.get(D)), t.bind_value(o, () => t.get(m).entry_date, (k) => t.get(m).entry_date = k), t.bind_value(p, () => t.get(m).account_code, (k) => t.get(m).account_code = k), t.bind_value(x, () => t.get(m).description, (k) => t.get(m).description = k), t.bind_value(T, () => t.get(m).document_number, (k) => t.get(m).document_number = k), t.bind_value(f, () => t.get(m).debit, (k) => t.get(m).debit = k), t.bind_value(b, () => t.get(m).credit, (k) => t.get(m).credit = k), t.delegated("click", M, () => t.set(R, !1)), t.delegated("click", O, mt), t.delegated("click", h, () => t.set(R, !1)), t.append(e, a);
    };
    t.if(Ft, (e) => {
      t.get(R) && e(Dt);
    });
  }
  t.delegated("click", Y, V), t.append(y, nt), t.pop();
}
t.delegate(["click"]);
function be() {
  const y = window.__zveltio;
  y && y.registerRoute({
    path: "saft",
    component: ve,
    label: "SAF-T RO",
    icon: "FileSpreadsheet",
    category: "compliance"
  });
}
be();
export {
  be as default
};
