var ZveltioExt=(function(Vt,dt){"use strict";function it(n){const r=Object.create(null,{[Symbol.toStringTag]:{value:"Module"}});if(n){for(const h in n)if(h!=="default"){const a=Object.getOwnPropertyDescriptor(n,h);Object.defineProperty(r,h,a.get?a:{enumerable:!0,get:()=>n[h]})}}return r.default=n,Object.freeze(r)}const t=it(dt);/**
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
 */const nt={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"};var ot=t.from_svg("<svg><!><!></svg>");function B(n,r){t.push(r,!0);const h=t.prop(r,"color",3,"currentColor"),a=t.prop(r,"size",3,24),_=t.prop(r,"strokeWidth",3,2),j=t.prop(r,"absoluteStrokeWidth",3,!1),l=t.prop(r,"iconNode",19,()=>[]),f=t.rest_props(r,["$$slots","$$events","$$legacy","name","color","size","strokeWidth","absoluteStrokeWidth","iconNode","children"]);var m=ot();t.attribute_effect(m,T=>({...nt,...f,width:a(),height:a(),stroke:h(),"stroke-width":T,class:["lucide-icon lucide",r.name&&`lucide-${r.name}`,r.class]}),[()=>j()?Number(_())*24/Number(a()):_()]);var y=t.child(m);t.each(y,17,l,t.index,(T,V)=>{var A=t.derived(()=>t.to_array(t.get(V),2));let E=()=>t.get(A)[0],L=()=>t.get(A)[1];var G=t.comment(),J=t.first_child(G);t.element(J,E,!0,(H,C)=>{t.attribute_effect(H,()=>({...L()}))}),t.append(T,G)});var I=t.sibling(y);t.snippet(I,()=>r.children??t.noop),t.reset(m),t.append(n,m),t.pop()}function lt(n,r){t.push(r,!0);/**
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
 */let h=t.rest_props(r,["$$slots","$$events","$$legacy"]);const a=[["ellipse",{cx:"12",cy:"5",rx:"9",ry:"3"}],["path",{d:"M3 5V19A9 3 0 0 0 21 19V5"}],["path",{d:"M3 12A9 3 0 0 0 21 12"}]];B(n,t.spread_props({name:"database"},()=>h,{get iconNode(){return a},children:(_,j)=>{var l=t.comment(),f=t.first_child(l);t.snippet(f,()=>r.children??t.noop),t.append(_,l)},$$slots:{default:!0}})),t.pop()}function ct(n,r){t.push(r,!0);/**
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
 */let h=t.rest_props(r,["$$slots","$$events","$$legacy"]);const a=[["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"}],["path",{d:"M12 9v4"}],["path",{d:"M12 17h.01"}]];B(n,t.spread_props({name:"file-warning"},()=>h,{get iconNode(){return a},children:(_,j)=>{var l=t.comment(),f=t.first_child(l);t.snippet(f,()=>r.children??t.noop),t.append(_,l)},$$slots:{default:!0}})),t.pop()}function ht(n,r){t.push(r,!0);/**
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
 */let h=t.rest_props(r,["$$slots","$$events","$$legacy"]);const a=[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"}]];B(n,t.spread_props({name:"shield"},()=>h,{get iconNode(){return a},children:(_,j)=>{var l=t.comment(),f=t.first_child(l);t.snippet(f,()=>r.children??t.noop),t.append(_,l)},$$slots:{default:!0}})),t.pop()}function _t(n,r){t.push(r,!0);/**
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
 */let h=t.rest_props(r,["$$slots","$$events","$$legacy"]);const a=[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"}],["path",{d:"M16 3.128a4 4 0 0 1 0 7.744"}],["path",{d:"M22 21v-2a4 4 0 0 0-3-3.87"}],["circle",{cx:"9",cy:"7",r:"4"}]];B(n,t.spread_props({name:"users"},()=>h,{get iconNode(){return a},children:(_,j)=>{var l=t.comment(),f=t.first_child(l);t.snippet(f,()=>r.children??t.noop),t.append(_,l)},$$slots:{default:!0}})),t.pop()}var vt=t.from_html('<div class="alert alert-error"> </div>'),pt=t.from_html('<tr><td colspan="5" class="text-center py-6 text-base-content/60">No requests.</td></tr>'),gt=t.from_html('<button class="btn btn-ghost btn-xs">Fulfill</button> <button class="btn btn-ghost btn-xs">Reject</button>',1),ut=t.from_html('<tr><td><span class="badge badge-sm"> </span></td><td> </td><td> </td><td><span class="badge badge-sm"> </span></td><td><!></td></tr>'),bt=t.from_html('<div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Type</th><th>Subject</th><th>Requested</th><th>Status</th><th></th></tr></thead><tbody><!></tbody></table></div>'),ft=t.from_html('<tr><td colspan="5" class="text-center py-6 text-base-content/60">No breach incidents recorded.</td></tr>'),mt=t.from_html('<tr><td> </td><td class="max-w-xs truncate"> </td><td><span class="badge badge-error badge-sm"> </span></td><td> </td><td> </td></tr>'),xt=t.from_html('<div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Date</th><th>Description</th><th>Severity</th><th>Affected</th><th>Notified DPA</th></tr></thead><tbody><!></tbody></table></div>'),wt=t.from_html('<tr><td colspan="4" class="text-center py-6 text-base-content/60">No consents recorded.</td></tr>'),yt=t.from_html("<tr><td> </td><td> </td><td> </td><td> </td></tr>"),kt=t.from_html('<div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Subject</th><th>Purpose</th><th>Granted</th><th>Withdrawn</th></tr></thead><tbody><!></tbody></table></div>'),Nt=t.from_html('<tr><td colspan="4" class="text-center py-6 text-base-content/60">No records of processing yet.</td></tr>'),jt=t.from_html('<tr><td> </td><td> </td><td class="text-xs"> </td><td> </td></tr>'),qt=t.from_html('<div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Activity</th><th>Lawful basis</th><th>Categories</th><th>Retention</th></tr></thead><tbody><!></tbody></table></div>'),Pt=t.from_html('<div class="p-6 space-y-4"><header><h1 class="text-2xl font-semibold flex items-center gap-2"><!> GDPR Compliance</h1></header> <!> <div role="tablist" class="tabs tabs-bordered"><button role="tab"><!> Access requests</button> <button role="tab"><!> Breaches</button> <button role="tab">Consents</button> <button role="tab"><!> Processing records</button></div> <!></div>');function St(n,r){var rt;t.push(r,!0);const h=((rt=window.__zveltio)==null?void 0:rt.engineUrl)??"";let a=t.state("requests"),_=t.state(t.proxy([])),j=t.state(t.proxy([])),l=t.state(t.proxy([])),f=t.state(t.proxy([])),m=t.state("");async function y(e,d){const c=await fetch(`${h}${e}`,{credentials:"include",...d}),u=await c.json().catch(()=>({}));if(!c.ok)throw new Error(u.error||`HTTP ${c.status}`);return u}t.user_effect(()=>{t.get(a)==="requests"?y("/api/gdpr/access-requests").then(e=>t.set(_,e.data??[],!0)).catch(e=>t.set(m,e.message,!0)):t.get(a)==="breaches"?y("/api/gdpr/breach-incidents").then(e=>t.set(j,e.data??[],!0)).catch(e=>t.set(m,e.message,!0)):t.get(a)==="consents"?y("/api/gdpr/consents").then(e=>t.set(l,e.data??[],!0)).catch(e=>t.set(m,e.message,!0)):t.get(a)==="records"&&y("/api/gdpr/processing-records").then(e=>t.set(f,e.data??[],!0)).catch(e=>t.set(m,e.message,!0))});async function I(e){try{await y(`/api/gdpr/access-requests/${e}/fulfill`,{method:"POST"}),t.set(_,(await y("/api/gdpr/access-requests")).data??[],!0)}catch(d){t.set(m,d.message,!0)}}async function T(e){try{await y(`/api/gdpr/access-requests/${e}/reject`,{method:"POST"}),t.set(_,(await y("/api/gdpr/access-requests")).data??[],!0)}catch(d){t.set(m,d.message,!0)}}var V=Pt(),A=t.child(V),E=t.child(A),L=t.child(E);ht(L,{class:"h-6 w-6"}),t.next(),t.reset(E),t.reset(A);var G=t.sibling(A,2);{var J=e=>{var d=vt(),c=t.child(d,!0);t.reset(d),t.template_effect(()=>t.set_text(c,t.get(m))),t.append(e,d)};t.if(G,e=>{t.get(m)&&e(J)})}var H=t.sibling(G,2),C=t.child(H);let X;var Mt=t.child(C);_t(Mt,{class:"h-4 w-4"}),t.next(),t.reset(C);var U=t.sibling(C,2);let Y;var zt=t.child(U);ct(zt,{class:"h-4 w-4"}),t.next(),t.reset(U);var K=t.sibling(U,2);let tt;var F=t.sibling(K,2);let et;var Dt=t.child(F);lt(Dt,{class:"h-4 w-4"}),t.next(),t.reset(F),t.reset(H);var Rt=t.sibling(H,2);{var $t=e=>{var d=bt(),c=t.child(d),u=t.sibling(t.child(c)),z=t.child(u);{var D=s=>{var o=pt();t.append(s,o)},R=s=>{var o=t.comment(),$=t.first_child(o);t.each($,17,()=>t.get(_),v=>v.id,(v,i)=>{var p=ut(),g=t.child(p),S=t.child(g),x=t.child(S,!0);t.reset(S),t.reset(g);var q=t.sibling(g),w=t.child(q,!0);t.reset(q);var N=t.sibling(q),P=t.child(N,!0);t.reset(N);var k=t.sibling(N),b=t.child(k),O=t.child(b,!0);t.reset(b),t.reset(k);var Z=t.sibling(k),W=t.child(Z);{var Wt=M=>{var at=gt(),st=t.first_child(at),Tt=t.sibling(st,2);t.delegated("click",st,()=>I(t.get(i).id)),t.delegated("click",Tt,()=>T(t.get(i).id)),t.append(M,at)};t.if(W,M=>{t.get(i).status==="pending"&&M(Wt)})}t.reset(Z),t.reset(p),t.template_effect(M=>{t.set_text(x,t.get(i).request_type),t.set_text(w,t.get(i).subject_email??t.get(i).subject_id),t.set_text(P,M),t.set_text(O,t.get(i).status)},[()=>{var M;return(M=t.get(i).created_at)==null?void 0:M.slice(0,10)}]),t.append(v,p)}),t.append(s,o)};t.if(z,s=>{t.get(_).length===0?s(D):s(R,-1)})}t.reset(u),t.reset(c),t.reset(d),t.append(e,d)},At=e=>{var d=xt(),c=t.child(d),u=t.sibling(t.child(c)),z=t.child(u);{var D=s=>{var o=ft();t.append(s,o)},R=s=>{var o=t.comment(),$=t.first_child(o);t.each($,17,()=>t.get(j),v=>v.id,(v,i)=>{var p=mt(),g=t.child(p),S=t.child(g,!0);t.reset(g);var x=t.sibling(g),q=t.child(x,!0);t.reset(x);var w=t.sibling(x),N=t.child(w),P=t.child(N,!0);t.reset(N),t.reset(w);var k=t.sibling(w),b=t.child(k,!0);t.reset(k);var O=t.sibling(k),Z=t.child(O,!0);t.reset(O),t.reset(p),t.template_effect(W=>{t.set_text(S,W),t.set_text(q,t.get(i).description),t.set_text(P,t.get(i).severity),t.set_text(b,t.get(i).affected_count??"?"),t.set_text(Z,t.get(i).notified_dpa_at?"✓":"—")},[()=>{var W;return(W=t.get(i).detected_at)==null?void 0:W.slice(0,10)}]),t.append(v,p)}),t.append(s,o)};t.if(z,s=>{t.get(j).length===0?s(D):s(R,-1)})}t.reset(u),t.reset(c),t.reset(d),t.append(e,d)},Ct=e=>{var d=kt(),c=t.child(d),u=t.sibling(t.child(c)),z=t.child(u);{var D=s=>{var o=wt();t.append(s,o)},R=s=>{var o=t.comment(),$=t.first_child(o);t.each($,17,()=>t.get(l),v=>v.id,(v,i)=>{var p=yt(),g=t.child(p),S=t.child(g,!0);t.reset(g);var x=t.sibling(g),q=t.child(x,!0);t.reset(x);var w=t.sibling(x),N=t.child(w,!0);t.reset(w);var P=t.sibling(w),k=t.child(P,!0);t.reset(P),t.reset(p),t.template_effect((b,O)=>{t.set_text(S,t.get(i).subject_id),t.set_text(q,t.get(i).purpose),t.set_text(N,b),t.set_text(k,O)},[()=>{var b;return(b=t.get(i).granted_at)==null?void 0:b.slice(0,10)},()=>{var b;return((b=t.get(i).withdrawn_at)==null?void 0:b.slice(0,10))??"—"}]),t.append(v,p)}),t.append(s,o)};t.if(z,s=>{t.get(l).length===0?s(D):s(R,-1)})}t.reset(u),t.reset(c),t.reset(d),t.append(e,d)},Ot=e=>{var d=qt(),c=t.child(d),u=t.sibling(t.child(c)),z=t.child(u);{var D=s=>{var o=Nt();t.append(s,o)},R=s=>{var o=t.comment(),$=t.first_child(o);t.each($,17,()=>t.get(f),v=>v.id,(v,i)=>{var p=jt(),g=t.child(p),S=t.child(g,!0);t.reset(g);var x=t.sibling(g),q=t.child(x,!0);t.reset(x);var w=t.sibling(x),N=t.child(w,!0);t.reset(w);var P=t.sibling(w),k=t.child(P,!0);t.reset(P),t.reset(p),t.template_effect(b=>{t.set_text(S,t.get(i).activity_name),t.set_text(q,t.get(i).lawful_basis),t.set_text(N,b),t.set_text(k,t.get(i).retention_period??"—")},[()=>(t.get(i).data_categories??[]).join(", ")]),t.append(v,p)}),t.append(s,o)};t.if(z,s=>{t.get(f).length===0?s(D):s(R,-1)})}t.reset(u),t.reset(c),t.reset(d),t.append(e,d)};t.if(Rt,e=>{t.get(a)==="requests"?e($t):t.get(a)==="breaches"?e(At,1):t.get(a)==="consents"?e(Ct,2):e(Ot,-1)})}t.reset(V),t.template_effect(()=>{X=t.set_class(C,1,"tab gap-2",null,X,{"tab-active":t.get(a)==="requests"}),Y=t.set_class(U,1,"tab gap-2",null,Y,{"tab-active":t.get(a)==="breaches"}),tt=t.set_class(K,1,"tab",null,tt,{"tab-active":t.get(a)==="consents"}),et=t.set_class(F,1,"tab gap-2",null,et,{"tab-active":t.get(a)==="records"})}),t.delegated("click",C,()=>t.set(a,"requests")),t.delegated("click",U,()=>t.set(a,"breaches")),t.delegated("click",K,()=>t.set(a,"consents")),t.delegated("click",F,()=>t.set(a,"records")),t.append(n,V),t.pop()}t.delegate(["click"]);function Q(){const n=window.__zveltio;n&&n.registerRoute({path:"gdpr",component:St,label:"GDPR",icon:"Shield",category:"compliance"})}return Q(),Q})(window.__SvelteRuntime.__unknown,window.__SvelteRuntime.internal_client);
