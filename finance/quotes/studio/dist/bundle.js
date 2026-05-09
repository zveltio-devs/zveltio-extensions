var ZveltioExt=(function(_e,Ct,Rt){"use strict";function qt(r){const a=Object.create(null,{[Symbol.toStringTag]:{value:"Module"}});if(r){for(const c in r)if(c!=="default"){const l=Object.getOwnPropertyDescriptor(r,c);Object.defineProperty(a,c,l.get?l:{enumerable:!0,get:()=>r[c]})}}return a.default=r,Object.freeze(a)}const t=qt(Ct);/**
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
 */const Dt={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"};var At=t.from_svg("<svg><!><!></svg>");function R(r,a){t.push(a,!0);const c=t.prop(a,"color",3,"currentColor"),l=t.prop(a,"size",3,24),u=t.prop(a,"strokeWidth",3,2),_=t.prop(a,"absoluteStrokeWidth",3,!1),s=t.prop(a,"iconNode",19,()=>[]),p=t.rest_props(a,["$$slots","$$events","$$legacy","name","color","size","strokeWidth","absoluteStrokeWidth","iconNode","children"]);var y=At();t.attribute_effect(y,w=>({...Dt,...p,width:l(),height:l(),stroke:c(),"stroke-width":w,class:["lucide-icon lucide",a.name&&`lucide-${a.name}`,a.class]}),[()=>_()?Number(u())*24/Number(l()):u()]);var n=t.child(y);t.each(n,17,s,t.index,(w,Y)=>{var E=t.derived(()=>t.to_array(t.get(Y),2));let tt=()=>t.get(E)[0],U=()=>t.get(E)[1];var B=t.comment(),et=t.first_child(B);t.element(et,tt,!0,(at,xt)=>{t.attribute_effect(at,()=>({...U()}))}),t.append(w,B)});var N=t.sibling(n);t.snippet(N,()=>a.children??t.noop),t.reset(y),t.append(r,y),t.pop()}function Ft(r,a){t.push(a,!0);/**
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
 */let c=t.rest_props(a,["$$slots","$$events","$$legacy"]);const l=[["path",{d:"m18 5-2.414-2.414A2 2 0 0 0 14.172 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2"}],["path",{d:"M21.378 12.626a1 1 0 0 0-3.004-3.004l-4.01 4.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"}],["path",{d:"M8 18h1"}]];R(r,t.spread_props({name:"file-pen-line"},()=>c,{get iconNode(){return l},children:(u,_)=>{var s=t.comment(),p=t.first_child(s);t.snippet(p,()=>a.children??t.noop),t.append(u,s)},$$slots:{default:!0}})),t.pop()}function Ht(r,a){t.push(a,!0);/**
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
 */let c=t.rest_props(a,["$$slots","$$events","$$legacy"]);const l=[["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4"}],["path",{d:"M10 9H8"}],["path",{d:"M16 13H8"}],["path",{d:"M16 17H8"}]];R(r,t.spread_props({name:"file-text"},()=>c,{get iconNode(){return l},children:(u,_)=>{var s=t.comment(),p=t.first_child(s);t.snippet(p,()=>a.children??t.noop),t.append(u,s)},$$slots:{default:!0}})),t.pop()}function gt(r,a){t.push(a,!0);/**
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
 */let c=t.rest_props(a,["$$slots","$$events","$$legacy"]);const l=[["path",{d:"M5 12h14"}],["path",{d:"M12 5v14"}]];R(r,t.spread_props({name:"plus"},()=>c,{get iconNode(){return l},children:(u,_)=>{var s=t.comment(),p=t.first_child(s);t.snippet(p,()=>a.children??t.noop),t.append(u,s)},$$slots:{default:!0}})),t.pop()}function Wt(r,a){t.push(a,!0);/**
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
 */let c=t.rest_props(a,["$$slots","$$events","$$legacy"]);const l=[["path",{d:"M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"}],["path",{d:"m21.854 2.147-10.94 10.939"}]];R(r,t.spread_props({name:"send"},()=>c,{get iconNode(){return l},children:(u,_)=>{var s=t.comment(),p=t.first_child(s);t.snippet(p,()=>a.children??t.noop),t.append(u,s)},$$slots:{default:!0}})),t.pop()}function ft(r,a){t.push(a,!0);/**
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
 */let c=t.rest_props(a,["$$slots","$$events","$$legacy"]);const l=[["path",{d:"M18 6 6 18"}],["path",{d:"m6 6 12 12"}]];R(r,t.spread_props({name:"x"},()=>c,{get iconNode(){return l},children:(u,_)=>{var s=t.comment(),p=t.first_child(s);t.snippet(p,()=>a.children??t.noop),t.append(u,s)},$$slots:{default:!0}})),t.pop()}var Vt=t.from_html('<div class="alert alert-error"> </div>'),It=t.from_html('<tr><td colspan="6" class="text-center py-6 text-base-content/60">No quotes.</td></tr>'),Lt=t.from_html('<button class="btn btn-ghost btn-xs gap-1"><!> Send</button>'),Qt=t.from_html('<button class="btn btn-ghost btn-xs gap-1"><!> → Invoice</button>'),Et=t.from_html('<tr><td class="font-mono"> </td><td> </td><td> </td><td class="text-right"> </td><td><span> </span></td><td><!><!></td></tr>'),Ut=t.from_html("<option> </option>"),Bt=t.from_html('<select class="select select-bordered w-full"><option>— Select contact —</option><!></select>'),Zt=t.from_html('<input class="input input-bordered w-full" placeholder="Client name"/>'),Jt=t.from_html('<button class="btn btn-ghost btn-xs btn-square"><!></button>'),Xt=t.from_html('<tr><td><input class="input input-xs input-bordered w-full"/></td><td><input type="number" step="0.01" class="input input-xs input-bordered w-20"/></td><td><input type="number" step="0.01" class="input input-xs input-bordered w-24"/></td><td><input type="number" step="0.01" class="input input-xs input-bordered w-16"/></td><td class="text-right"> </td><td><!></td></tr>'),Gt=t.from_html('<div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><div class="bg-base-100 rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto"><div class="flex items-center justify-between mb-4"><h2 class="text-xl font-semibold">New quote</h2><button class="btn btn-ghost btn-sm btn-square"><!></button></div> <div class="grid grid-cols-2 gap-3"><div class="col-span-2"><label class="label label-text">Client</label> <!></div> <div><label class="label label-text">Valid until</label><input type="date" class="input input-bordered w-full"/></div> <div><label class="label label-text">Currency</label><input class="input input-bordered w-full" maxlength="3"/></div> <div><label class="label label-text">Discount %</label><input type="number" step="0.01" class="input input-bordered w-full"/></div></div> <div class="mt-4"><div class="flex items-center justify-between mb-2"><span class="font-medium">Lines</span><button class="btn btn-ghost btn-xs gap-1"><!> Add</button></div> <table class="table table-xs"><thead><tr><th>Description</th><th>Qty</th><th>Price</th><th>VAT %</th><th class="text-right">Total</th><th></th></tr></thead><tbody></tbody></table> <div class="text-right mt-2 text-lg font-semibold"> </div></div> <div class="flex justify-end gap-2 mt-6"><button class="btn btn-ghost">Cancel</button><button class="btn btn-primary"> </button></div></div></div>'),Kt=t.from_html('<div class="p-6 space-y-4"><header class="flex items-center justify-between"><h1 class="text-2xl font-semibold flex items-center gap-2"><!> Quotes</h1> <button class="btn btn-primary btn-sm gap-2"><!> New quote</button></header> <!> <select class="select select-sm select-bordered max-w-xs"><option>All</option><option>Draft</option><option>Sent</option><option>Accepted</option><option>Rejected</option><option>Expired</option></select> <div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Number</th><th>Client</th><th>Valid until</th><th class="text-right">Total</th><th>Status</th><th></th></tr></thead><tbody><!></tbody></table></div></div> <!>',1);function Yt(r,a){var jt;t.push(a,!0);const c=((jt=window.__zveltio)==null?void 0:jt.engineUrl)??"";let l=t.state(t.proxy([])),u=t.state(t.proxy([])),_=t.state(""),s=t.state("all"),p=t.state(!1),y=t.state(!1),n=t.proxy({client_id:"",client_name:"",valid_until:new Date(Date.now()+30*864e5).toISOString().slice(0,10),currency:"RON",discount_percent:0,notes:"",lines:[{description:"",quantity:1,unit_price:0,tax_rate:19}]});async function N(e,i){const g=await fetch(`${c}${e}`,{credentials:"include",...i}),x=await g.json().catch(()=>({}));if(!g.ok)throw new Error(x.error||`HTTP ${g.status}`);return x}async function w(){try{const e=new URLSearchParams;t.get(s)!=="all"&&e.set("status",t.get(s));const i=await N(`/api/quotes?${e}`);t.set(l,i.data??[],!0)}catch(e){t.set(_,e.message,!0)}}async function Y(){try{const e=await N("/api/contacts?limit=200");t.set(u,(e.data??[]).map(i=>({id:i.id,label:`${i.first_name??""} ${i.last_name??""}`.trim()})),!0)}catch{t.set(u,[],!0)}}function E(){n.lines=[...n.lines,{description:"",quantity:1,unit_price:0,tax_rate:19}]}function tt(e){n.lines=n.lines.filter((i,g)=>g!==e)}function U(e){return e.quantity*e.unit_price*(1-n.discount_percent/100)*(1+e.tax_rate/100)}let B=t.derived(()=>n.lines.reduce((e,i)=>e+U(i),0));async function et(){t.set(y,!0),t.set(_,"");try{await N("/api/quotes",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(n)}),t.set(p,!1),n.lines=[{description:"",quantity:1,unit_price:0,tax_rate:19}],n.client_name="",n.client_id="",await w()}catch(e){t.set(_,e.message,!0)}finally{t.set(y,!1)}}async function at(e){try{await N(`/api/quotes/${e}/send`,{method:"POST"}),await w()}catch(i){t.set(_,i.message,!0)}}async function xt(e){try{await N(`/api/quotes/${e}/convert-to-invoice`,{method:"POST"}),await w()}catch(i){t.set(_,i.message,!0)}}t.user_effect(()=>{t.get(s),w()}),Rt.onMount(()=>{w(),Y()});function nt(e,i="RON"){return new Intl.NumberFormat("ro-RO",{style:"currency",currency:i}).format(e)}function te(e){return{draft:"badge-ghost",sent:"badge-info",accepted:"badge-success",rejected:"badge-error",expired:"badge-warning"}[e]??"badge-ghost"}var yt=Kt(),it=t.first_child(yt),rt=t.child(it),st=t.child(rt),ee=t.child(st);Ft(ee,{class:"h-6 w-6"}),t.next(),t.reset(st);var lt=t.sibling(st,2),ae=t.child(lt);gt(ae,{class:"h-4 w-4"}),t.next(),t.reset(lt),t.reset(rt);var wt=t.sibling(rt,2);{var ne=e=>{var i=Vt(),g=t.child(i,!0);t.reset(i),t.template_effect(()=>t.set_text(g,t.get(_))),t.append(e,i)};t.if(wt,e=>{t.get(_)&&e(ne)})}var Z=t.sibling(wt,2),ot=t.child(Z);ot.value=ot.__value="all";var dt=t.sibling(ot);dt.value=dt.__value="draft";var ct=t.sibling(dt);ct.value=ct.__value="sent";var ut=t.sibling(ct);ut.value=ut.__value="accepted";var pt=t.sibling(ut);pt.value=pt.__value="rejected";var $t=t.sibling(pt);$t.value=$t.__value="expired",t.reset(Z);var kt=t.sibling(Z,2),Nt=t.child(kt),St=t.sibling(t.child(Nt)),ie=t.child(St);{var re=e=>{var i=It();t.append(e,i)},se=e=>{var i=t.comment(),g=t.first_child(i);t.each(g,17,()=>t.get(l),x=>x.id,(x,v)=>{var q=Et(),S=t.child(q),D=t.child(S,!0);t.reset(S);var A=t.sibling(S),vt=t.child(A,!0);t.reset(A);var F=t.sibling(A),H=t.child(F,!0);t.reset(F);var P=t.sibling(F),W=t.child(P,!0);t.reset(P);var M=t.sibling(P),O=t.child(M),J=t.child(O,!0);t.reset(O),t.reset(M);var T=t.sibling(M),z=t.child(T);{var V=f=>{var h=Lt(),L=t.child(h);Wt(L,{class:"h-3 w-3"}),t.next(),t.reset(h),t.delegated("click",h,()=>at(t.get(v).id)),t.append(f,h)};t.if(z,f=>{t.get(v).status==="draft"&&f(V)})}var _t=t.sibling(z);{var I=f=>{var h=Qt(),L=t.child(h);Ht(L,{class:"h-3 w-3"}),t.next(),t.reset(h),t.delegated("click",h,()=>xt(t.get(v).id)),t.append(f,h)};t.if(_t,f=>{t.get(v).status==="accepted"&&f(I)})}t.reset(T),t.reset(q),t.template_effect((f,h)=>{t.set_text(D,t.get(v).number),t.set_text(vt,t.get(v).client_name),t.set_text(H,t.get(v).valid_until),t.set_text(W,f),t.set_class(O,1,`badge ${h??""} badge-sm`),t.set_text(J,t.get(v).status)},[()=>nt(Number(t.get(v).total),t.get(v).currency),()=>te(t.get(v).status)]),t.append(x,q)}),t.append(e,i)};t.if(ie,e=>{t.get(l).length===0?e(re):e(se,-1)})}t.reset(St),t.reset(Nt),t.reset(kt),t.reset(it);var le=t.sibling(it,2);{var oe=e=>{var i=Gt(),g=t.child(i),x=t.child(g),v=t.sibling(t.child(x)),q=t.child(v);ft(q,{class:"h-4 w-4"}),t.reset(v),t.reset(x);var S=t.sibling(x,2),D=t.child(S),A=t.sibling(t.child(D),2);{var vt=o=>{var d=Bt(),j=t.child(d);j.value=j.__value="";var Q=t.sibling(j);t.each(Q,17,()=>t.get(u),m=>m.id,(m,k)=>{var $=Ut(),G=t.child($,!0);t.reset($);var C={};t.template_effect(()=>{t.set_text(G,t.get(k).label),C!==(C=t.get(k).id)&&($.value=($.__value=t.get(k).id)??"")}),t.append(m,$)}),t.reset(d),t.delegated("change",d,()=>{const m=t.get(u).find(k=>k.id===n.client_id);m&&(n.client_name=m.label)}),t.bind_select_value(d,()=>n.client_id,m=>n.client_id=m),t.append(o,d)},F=o=>{var d=Zt();t.remove_input_defaults(d),t.bind_value(d,()=>n.client_name,j=>n.client_name=j),t.append(o,d)};t.if(A,o=>{t.get(u).length>0?o(vt):o(F,-1)})}t.reset(D);var H=t.sibling(D,2),P=t.sibling(t.child(H));t.remove_input_defaults(P),t.reset(H);var W=t.sibling(H,2),M=t.sibling(t.child(W));t.remove_input_defaults(M),t.reset(W);var O=t.sibling(W,2),J=t.sibling(t.child(O));t.remove_input_defaults(J),t.reset(O),t.reset(S);var T=t.sibling(S,2),z=t.child(T),V=t.sibling(t.child(z)),_t=t.child(V);gt(_t,{class:"h-3 w-3"}),t.next(),t.reset(V),t.reset(z);var I=t.sibling(z,2),f=t.sibling(t.child(I));t.each(f,21,()=>n.lines,t.index,(o,d,j)=>{var Q=Xt(),m=t.child(Q),k=t.child(m);t.remove_input_defaults(k),t.reset(m);var $=t.sibling(m),G=t.child($);t.remove_input_defaults(G),t.reset($);var C=t.sibling($),Ot=t.child(C);t.remove_input_defaults(Ot),t.reset(C);var ht=t.sibling(C),Tt=t.child(ht);t.remove_input_defaults(Tt),t.reset(ht);var bt=t.sibling(ht),ce=t.child(bt,!0);t.reset(bt);var zt=t.sibling(bt),ue=t.child(zt);{var pe=b=>{var K=Jt(),ve=t.child(K);ft(ve,{class:"h-3 w-3"}),t.reset(K),t.delegated("click",K,()=>tt(j)),t.append(b,K)};t.if(ue,b=>{n.lines.length>1&&b(pe)})}t.reset(zt),t.reset(Q),t.template_effect(b=>t.set_text(ce,b),[()=>nt(U(t.get(d)),n.currency)]),t.bind_value(k,()=>t.get(d).description,b=>t.get(d).description=b),t.bind_value(G,()=>t.get(d).quantity,b=>t.get(d).quantity=b),t.bind_value(Ot,()=>t.get(d).unit_price,b=>t.get(d).unit_price=b),t.bind_value(Tt,()=>t.get(d).tax_rate,b=>t.get(d).tax_rate=b),t.append(o,Q)}),t.reset(f),t.reset(I);var h=t.sibling(I,2),L=t.child(h);t.reset(h),t.reset(T);var Pt=t.sibling(T,2),Mt=t.child(Pt),X=t.sibling(Mt),de=t.child(X,!0);t.reset(X),t.reset(Pt),t.reset(g),t.reset(i),t.template_effect(o=>{t.set_text(L,`Total: ${o??""}`),X.disabled=t.get(y)||!n.client_name,t.set_text(de,t.get(y)?"Saving…":"Create")},[()=>nt(t.get(B),n.currency)]),t.delegated("click",i,o=>o.target===o.currentTarget&&t.set(p,!1)),t.delegated("click",v,()=>t.set(p,!1)),t.bind_value(P,()=>n.valid_until,o=>n.valid_until=o),t.bind_value(M,()=>n.currency,o=>n.currency=o),t.bind_value(J,()=>n.discount_percent,o=>n.discount_percent=o),t.delegated("click",V,E),t.delegated("click",Mt,()=>t.set(p,!1)),t.delegated("click",X,et),t.append(e,i)};t.if(le,e=>{t.get(p)&&e(oe)})}t.delegated("click",lt,()=>t.set(p,!0)),t.bind_select_value(Z,()=>t.get(s),e=>t.set(s,e)),t.append(r,yt),t.pop()}t.delegate(["click","change"]);function mt(){const r=window.__zveltio;r&&r.registerRoute({path:"quotes",component:Yt,label:"Quotes",icon:"FileSignature",category:"finance"})}return mt(),mt})(window.__SvelteRuntime.__unknown,window.__SvelteRuntime.internal_client,window.__SvelteRuntime.svelte);
