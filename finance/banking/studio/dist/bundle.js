var ZveltioExt=(function(Zt,ot,dt){"use strict";function ct(s){const a=Object.create(null,{[Symbol.toStringTag]:{value:"Module"}});if(s){for(const _ in s)if(_!=="default"){const n=Object.getOwnPropertyDescriptor(s,_);Object.defineProperty(a,_,n.get?n:{enumerable:!0,get:()=>s[_]})}}return a.default=s,Object.freeze(a)}const t=ct(ot);/**
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
 */const vt={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"};var ut=t.from_svg("<svg><!><!></svg>");function F(s,a){t.push(a,!0);const _=t.prop(a,"color",3,"currentColor"),n=t.prop(a,"size",3,24),g=t.prop(a,"strokeWidth",3,2),j=t.prop(a,"absoluteStrokeWidth",3,!1),o=t.prop(a,"iconNode",19,()=>[]),m=t.rest_props(a,["$$slots","$$events","$$legacy","name","color","size","strokeWidth","absoluteStrokeWidth","iconNode","children"]);var M=ut();t.attribute_effect(M,b=>({...vt,...m,width:n(),height:n(),stroke:_(),"stroke-width":b,class:["lucide-icon lucide",a.name&&`lucide-${a.name}`,a.class]}),[()=>j()?Number(g())*24/Number(n()):g()]);var S=t.child(M);t.each(S,17,o,t.index,(b,T)=>{var W=t.derived(()=>t.to_array(t.get(T),2));let J=()=>t.get(W)[0],X=()=>t.get(W)[1];var L=t.comment(),H=t.first_child(L);t.element(H,J,!0,(V,Z)=>{t.attribute_effect(V,()=>({...X()}))}),t.append(b,L)});var I=t.sibling(S);t.snippet(I,()=>a.children??t.noop),t.reset(M),t.append(s,M),t.pop()}function ht(s,a){t.push(a,!0);/**
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
 */let _=t.rest_props(a,["$$slots","$$events","$$legacy"]);const n=[["path",{d:"M8 3 4 7l4 4"}],["path",{d:"M4 7h16"}],["path",{d:"m16 21 4-4-4-4"}],["path",{d:"M20 17H4"}]];F(s,t.spread_props({name:"arrow-left-right"},()=>_,{get iconNode(){return n},children:(g,j)=>{var o=t.comment(),m=t.first_child(o);t.snippet(m,()=>a.children??t.noop),t.append(g,o)},$$slots:{default:!0}})),t.pop()}function _t(s,a){t.push(a,!0);/**
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
 */let _=t.rest_props(a,["$$slots","$$events","$$legacy"]);const n=[["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4"}],["path",{d:"M8 13h2"}],["path",{d:"M14 13h2"}],["path",{d:"M8 17h2"}],["path",{d:"M14 17h2"}]];F(s,t.spread_props({name:"file-spreadsheet"},()=>_,{get iconNode(){return n},children:(g,j)=>{var o=t.comment(),m=t.first_child(o);t.snippet(m,()=>a.children??t.noop),t.append(g,o)},$$slots:{default:!0}})),t.pop()}function et(s,a){t.push(a,!0);/**
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
 */let _=t.rest_props(a,["$$slots","$$events","$$legacy"]);const n=[["path",{d:"M10 18v-7"}],["path",{d:"M11.12 2.198a2 2 0 0 1 1.76.006l7.866 3.847c.476.233.31.949-.22.949H3.474c-.53 0-.695-.716-.22-.949z"}],["path",{d:"M14 18v-7"}],["path",{d:"M18 18v-7"}],["path",{d:"M3 22h18"}],["path",{d:"M6 18v-7"}]];F(s,t.spread_props({name:"landmark"},()=>_,{get iconNode(){return n},children:(g,j)=>{var o=t.comment(),m=t.first_child(o);t.snippet(m,()=>a.children??t.noop),t.append(g,o)},$$slots:{default:!0}})),t.pop()}function bt(s,a){t.push(a,!0);/**
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
 */let _=t.rest_props(a,["$$slots","$$events","$$legacy"]);const n=[["path",{d:"M5 12h14"}],["path",{d:"M12 5v14"}]];F(s,t.spread_props({name:"plus"},()=>_,{get iconNode(){return n},children:(g,j)=>{var o=t.comment(),m=t.first_child(o);t.snippet(m,()=>a.children??t.noop),t.append(g,o)},$$slots:{default:!0}})),t.pop()}function pt(s,a){t.push(a,!0);/**
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
 */let _=t.rest_props(a,["$$slots","$$events","$$legacy"]);const n=[["path",{d:"M18 6 6 18"}],["path",{d:"m6 6 12 12"}]];F(s,t.spread_props({name:"x"},()=>_,{get iconNode(){return n},children:(g,j)=>{var o=t.comment(),m=t.first_child(o);t.snippet(m,()=>a.children??t.noop),t.append(g,o)},$$slots:{default:!0}})),t.pop()}var gt=t.from_html('<button class="btn btn-primary btn-sm gap-2"><!> New account</button>'),mt=t.from_html('<div class="alert alert-error"> </div>'),ft=t.from_html('<tr><td colspan="5" class="text-center py-6 text-base-content/60">No accounts.</td></tr>'),xt=t.from_html('<tr><td> </td><td> </td><td class="font-mono text-xs"> </td><td> </td><td class="text-right"> </td></tr>'),yt=t.from_html('<div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Name</th><th>Bank</th><th class="font-mono">IBAN</th><th>Currency</th><th class="text-right">Balance</th></tr></thead><tbody><!></tbody></table></div>'),wt=t.from_html('<tr><td colspan="5" class="text-center py-6 text-base-content/60">No transactions yet — import a bank statement to start.</td></tr>'),kt=t.from_html('<tr><td> </td><td> </td><td class="max-w-xs truncate"> </td><td> </td><td> </td></tr>'),Nt=t.from_html('<div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Date</th><th>Account</th><th>Description</th><th class="text-right">Amount</th><th>Reconciled</th></tr></thead><tbody><!></tbody></table></div>'),Mt=t.from_html('<tr><td colspan="3" class="text-center py-6 text-base-content/60">All clear.</td></tr>'),$t=t.from_html('<tr><td> </td><td class="max-w-xs truncate"> </td><td class="text-right"> </td></tr>'),Ot=t.from_html('<tr><td colspan="3" class="text-center py-6 text-base-content/60">No open invoices.</td></tr>'),jt=t.from_html('<tr><td class="font-mono"> </td><td> </td><td class="text-right"> </td></tr>'),Pt=t.from_html('<div class="grid grid-cols-1 lg:grid-cols-2 gap-4"><div class="bg-base-100 rounded-lg shadow"><div class="p-3 font-medium border-b">Unreconciled transactions</div> <table class="table table-sm"><thead><tr><th>Date</th><th>Description</th><th class="text-right">Amount</th></tr></thead><tbody><!></tbody></table></div> <div class="bg-base-100 rounded-lg shadow"><div class="p-3 font-medium border-b">Open invoices (sent)</div> <table class="table table-sm"><thead><tr><th>Number</th><th>Client</th><th class="text-right">Total</th></tr></thead><tbody><!></tbody></table></div></div>'),At=t.from_html('<div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><div class="bg-base-100 rounded-xl p-6 w-full max-w-md"><div class="flex items-center justify-between mb-4"><h2 class="text-xl font-semibold">New bank account</h2><button class="btn btn-ghost btn-sm btn-square"><!></button></div> <div class="space-y-3"><div><label class="label label-text">Internal name</label><input class="input input-bordered w-full"/></div> <div><label class="label label-text">Bank</label><input class="input input-bordered w-full"/></div> <div><label class="label label-text">IBAN</label><input class="input input-bordered w-full font-mono"/></div> <div><label class="label label-text">Currency</label><input class="input input-bordered w-full" maxlength="3"/></div> <div><label class="label label-text">Opening balance</label><input type="number" step="0.01" class="input input-bordered w-full"/></div></div> <div class="flex justify-end gap-2 mt-4"><button class="btn btn-ghost">Cancel</button><button class="btn btn-primary"> </button></div></div></div>'),Rt=t.from_html('<div class="p-6 space-y-4"><header class="flex items-center justify-between"><h1 class="text-2xl font-semibold flex items-center gap-2"><!> Banking</h1> <!></header> <!> <div role="tablist" class="tabs tabs-bordered"><button role="tab"><!> Accounts</button> <button role="tab"><!> Transactions</button> <button role="tab"><!> Reconciliation</button></div> <!></div> <!>',1);function St(s,a){var lt;t.push(a,!0);const _=((lt=window.__zveltio)==null?void 0:lt.engineUrl)??"";let n=t.state("accounts"),g=t.state(t.proxy([])),j=t.state(t.proxy([])),o=t.state(t.proxy([])),m=t.state(t.proxy([])),M=t.state(""),S=t.state(!1),I=t.state(!1),b=t.state(t.proxy({name:"",bank_name:"",iban:"",currency:"RON",opening_balance:0}));async function T(e,r){const d=await fetch(`${_}${e}`,{credentials:"include",...r}),f=await d.json().catch(()=>({}));if(!d.ok)throw new Error(f.error||`HTTP ${d.status}`);return f}async function W(){try{const e=await T("/api/banking/accounts");t.set(g,e.data??[],!0)}catch(e){t.set(M,e.message,!0)}}async function J(){try{const e=await T("/api/banking/transactions?limit=100");t.set(j,e.data??[],!0)}catch(e){t.set(M,e.message,!0)}}async function X(){try{const[e,r]=await Promise.all([T("/api/banking/transactions?reconciled=false&limit=100"),T("/api/invoicing/invoices?status=sent&limit=100").catch(()=>({data:[]}))]);t.set(o,e.data??[],!0),t.set(m,r.data??[],!0)}catch(e){t.set(M,e.message,!0)}}async function L(){t.set(I,!0),t.set(M,"");try{await T("/api/banking/accounts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(t.get(b))}),t.set(S,!1),t.set(b,{name:"",bank_name:"",iban:"",currency:"RON",opening_balance:0},!0),await W()}catch(e){t.set(M,e.message,!0)}finally{t.set(I,!1)}}t.user_effect(()=>{t.get(n)==="accounts"?W():t.get(n)==="transactions"?J():X()}),dt.onMount(()=>W());function H(e,r="RON"){return new Intl.NumberFormat("ro-RO",{style:"currency",currency:r}).format(e)}var V=Rt(),Z=t.first_child(V),G=t.child(Z),K=t.child(G),zt=t.child(K);et(zt,{class:"h-6 w-6"}),t.next(),t.reset(K);var Tt=t.sibling(K,2);{var Bt=e=>{var r=gt(),d=t.child(r);bt(d,{class:"h-4 w-4"}),t.next(),t.reset(r),t.delegated("click",r,()=>t.set(S,!0)),t.append(e,r)};t.if(Tt,e=>{t.get(n)==="accounts"&&e(Bt)})}t.reset(G);var rt=t.sibling(G,2);{var Ct=e=>{var r=mt(),d=t.child(r,!0);t.reset(r),t.template_effect(()=>t.set_text(d,t.get(M))),t.append(e,r)};t.if(rt,e=>{t.get(M)&&e(Ct)})}var Q=t.sibling(rt,2),U=t.child(Q);let nt;var Dt=t.child(U);et(Dt,{class:"h-4 w-4"}),t.next(),t.reset(U);var E=t.sibling(U,2);let st;var It=t.child(E);_t(It,{class:"h-4 w-4"}),t.next(),t.reset(E);var q=t.sibling(E,2);let it;var Wt=t.child(q);ht(Wt,{class:"h-4 w-4"}),t.next(),t.reset(q),t.reset(Q);var Ht=t.sibling(Q,2);{var Ft=e=>{var r=yt(),d=t.child(r),f=t.sibling(t.child(d)),P=t.child(f);{var B=h=>{var x=ft();t.append(h,x)},z=h=>{var x=t.comment(),A=t.first_child(x);t.each(A,17,()=>t.get(g),w=>w.id,(w,c)=>{var $=xt(),k=t.child($),v=t.child(k,!0);t.reset(k);var u=t.sibling(k),R=t.child(u,!0);t.reset(u);var p=t.sibling(u),y=t.child(p,!0);t.reset(p);var l=t.sibling(p),N=t.child(l,!0);t.reset(l);var i=t.sibling(l),O=t.child(i,!0);t.reset(i),t.reset($),t.template_effect(C=>{t.set_text(v,t.get(c).name),t.set_text(R,t.get(c).bank_name),t.set_text(y,t.get(c).iban),t.set_text(N,t.get(c).currency),t.set_text(O,C)},[()=>H(Number(t.get(c).balance),t.get(c).currency)]),t.append(w,$)}),t.append(h,x)};t.if(P,h=>{t.get(g).length===0?h(B):h(z,-1)})}t.reset(f),t.reset(d),t.reset(r),t.append(e,r)},Ut=e=>{var r=Nt(),d=t.child(r),f=t.sibling(t.child(d)),P=t.child(f);{var B=h=>{var x=wt();t.append(h,x)},z=h=>{var x=t.comment(),A=t.first_child(x);t.each(A,17,()=>t.get(j),w=>w.id,(w,c)=>{var $=kt(),k=t.child($),v=t.child(k,!0);t.reset(k);var u=t.sibling(k),R=t.child(u,!0);t.reset(u);var p=t.sibling(u),y=t.child(p,!0);t.reset(p);var l=t.sibling(p),N=t.child(l,!0);t.reset(l);var i=t.sibling(l),O=t.child(i,!0);t.reset(i),t.reset($),t.template_effect((C,D)=>{t.set_text(v,t.get(c).transaction_date),t.set_text(R,t.get(c).account_name??"—"),t.set_text(y,t.get(c).description),t.set_class(l,1,`text-right ${C??""}`),t.set_text(N,D),t.set_text(O,t.get(c).reconciled?"✓":"—")},[()=>Number(t.get(c).amount)<0?"text-error":"text-success",()=>H(Number(t.get(c).amount),t.get(c).currency)]),t.append(w,$)}),t.append(h,x)};t.if(P,h=>{t.get(j).length===0?h(B):h(z,-1)})}t.reset(f),t.reset(d),t.reset(r),t.append(e,r)},Et=e=>{var r=Pt(),d=t.child(r),f=t.sibling(t.child(d),2),P=t.sibling(t.child(f)),B=t.child(P);{var z=v=>{var u=Mt();t.append(v,u)},h=v=>{var u=t.comment(),R=t.first_child(u);t.each(R,17,()=>t.get(o),p=>p.id,(p,y)=>{var l=$t(),N=t.child(l),i=t.child(N,!0);t.reset(N);var O=t.sibling(N),C=t.child(O,!0);t.reset(O);var D=t.sibling(O),Y=t.child(D,!0);t.reset(D),t.reset(l),t.template_effect(tt=>{t.set_text(i,t.get(y).transaction_date),t.set_text(C,t.get(y).description),t.set_text(Y,tt)},[()=>H(Number(t.get(y).amount))]),t.append(p,l)}),t.append(v,u)};t.if(B,v=>{t.get(o).length===0?v(z):v(h,-1)})}t.reset(P),t.reset(f),t.reset(d);var x=t.sibling(d,2),A=t.sibling(t.child(x),2),w=t.sibling(t.child(A)),c=t.child(w);{var $=v=>{var u=Ot();t.append(v,u)},k=v=>{var u=t.comment(),R=t.first_child(u);t.each(R,17,()=>t.get(m),p=>p.id,(p,y)=>{var l=jt(),N=t.child(l),i=t.child(N,!0);t.reset(N);var O=t.sibling(N),C=t.child(O,!0);t.reset(O);var D=t.sibling(O),Y=t.child(D,!0);t.reset(D),t.reset(l),t.template_effect(tt=>{t.set_text(i,t.get(y).number),t.set_text(C,t.get(y).client_name),t.set_text(Y,tt)},[()=>H(Number(t.get(y).total))]),t.append(p,l)}),t.append(v,u)};t.if(c,v=>{t.get(m).length===0?v($):v(k,-1)})}t.reset(w),t.reset(A),t.reset(x),t.reset(r),t.append(e,r)};t.if(Ht,e=>{t.get(n)==="accounts"?e(Ft):t.get(n)==="transactions"?e(Ut,1):e(Et,-1)})}t.reset(Z);var Lt=t.sibling(Z,2);{var Vt=e=>{var r=At(),d=t.child(r),f=t.child(d),P=t.sibling(t.child(f)),B=t.child(P);pt(B,{class:"h-4 w-4"}),t.reset(P),t.reset(f);var z=t.sibling(f,2),h=t.child(z),x=t.sibling(t.child(h));t.remove_input_defaults(x),t.reset(h);var A=t.sibling(h,2),w=t.sibling(t.child(A));t.remove_input_defaults(w),t.reset(A);var c=t.sibling(A,2),$=t.sibling(t.child(c));t.remove_input_defaults($),t.reset(c);var k=t.sibling(c,2),v=t.sibling(t.child(k));t.remove_input_defaults(v),t.reset(k);var u=t.sibling(k,2),R=t.sibling(t.child(u));t.remove_input_defaults(R),t.reset(u),t.reset(z);var p=t.sibling(z,2),y=t.child(p),l=t.sibling(y),N=t.child(l,!0);t.reset(l),t.reset(p),t.reset(d),t.reset(r),t.template_effect(()=>{l.disabled=t.get(I)||!t.get(b).name||!t.get(b).iban,t.set_text(N,t.get(I)?"Saving…":"Create")}),t.delegated("click",r,i=>i.target===i.currentTarget&&t.set(S,!1)),t.delegated("click",P,()=>t.set(S,!1)),t.bind_value(x,()=>t.get(b).name,i=>t.get(b).name=i),t.bind_value(w,()=>t.get(b).bank_name,i=>t.get(b).bank_name=i),t.bind_value($,()=>t.get(b).iban,i=>t.get(b).iban=i),t.bind_value(v,()=>t.get(b).currency,i=>t.get(b).currency=i),t.bind_value(R,()=>t.get(b).opening_balance,i=>t.get(b).opening_balance=i),t.delegated("click",y,()=>t.set(S,!1)),t.delegated("click",l,L),t.append(e,r)};t.if(Lt,e=>{t.get(S)&&e(Vt)})}t.template_effect(()=>{nt=t.set_class(U,1,"tab gap-2",null,nt,{"tab-active":t.get(n)==="accounts"}),st=t.set_class(E,1,"tab gap-2",null,st,{"tab-active":t.get(n)==="transactions"}),it=t.set_class(q,1,"tab gap-2",null,it,{"tab-active":t.get(n)==="reconciliation"})}),t.delegated("click",U,()=>t.set(n,"accounts")),t.delegated("click",E,()=>t.set(n,"transactions")),t.delegated("click",q,()=>t.set(n,"reconciliation")),t.append(s,V),t.pop()}t.delegate(["click"]);function at(){const s=window.__zveltio;s&&s.registerRoute({path:"banking",component:St,label:"Banking",icon:"Landmark",category:"finance"})}return at(),at})(window.__SvelteRuntime.__unknown,window.__SvelteRuntime.internal_client,window.__SvelteRuntime.svelte);
