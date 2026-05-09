var ZveltioExt=(function(Kt,ht,pt){"use strict";function gt(n){const a=Object.create(null,{[Symbol.toStringTag]:{value:"Module"}});if(n){for(const _ in n)if(_!=="default"){const r=Object.getOwnPropertyDescriptor(n,_);Object.defineProperty(a,_,r.get?r:{enumerable:!0,get:()=>n[_]})}}return a.default=n,Object.freeze(a)}const t=gt(ht);/**
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
 */const bt={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"};var ft=t.from_svg("<svg><!><!></svg>");function V(n,a){t.push(a,!0);const _=t.prop(a,"color",3,"currentColor"),r=t.prop(a,"size",3,24),p=t.prop(a,"strokeWidth",3,2),$=t.prop(a,"absoluteStrokeWidth",3,!1),o=t.prop(a,"iconNode",19,()=>[]),c=t.rest_props(a,["$$slots","$$events","$$legacy","name","color","size","strokeWidth","absoluteStrokeWidth","iconNode","children"]);var k=ft();t.attribute_effect(k,T=>({...bt,...c,width:r(),height:r(),stroke:_(),"stroke-width":T,class:["lucide-icon lucide",a.name&&`lucide-${a.name}`,a.class]}),[()=>$()?Number(p())*24/Number(r()):p()]);var W=t.child(k);t.each(W,17,o,t.index,(T,E)=>{var Z=t.derived(()=>t.to_array(t.get(E),2));let at=()=>t.get(Z)[0],st=()=>t.get(Z)[1];var P=t.comment(),G=t.first_child(P);t.element(G,at,!0,(U,K)=>{t.attribute_effect(U,()=>({...st()}))}),t.append(T,P)});var d=t.sibling(W);t.snippet(d,()=>a.children??t.noop),t.reset(k),t.append(n,k),t.pop()}function lt(n,a){t.push(a,!0);/**
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
 */let _=t.rest_props(a,["$$slots","$$events","$$legacy"]);const r=[["rect",{width:"16",height:"20",x:"4",y:"2",rx:"2",ry:"2"}],["path",{d:"M9 22v-4h6v4"}],["path",{d:"M8 6h.01"}],["path",{d:"M16 6h.01"}],["path",{d:"M12 6h.01"}],["path",{d:"M12 10h.01"}],["path",{d:"M12 14h.01"}],["path",{d:"M16 10h.01"}],["path",{d:"M16 14h.01"}],["path",{d:"M8 10h.01"}],["path",{d:"M8 14h.01"}]];V(n,t.spread_props({name:"building"},()=>_,{get iconNode(){return r},children:(p,$)=>{var o=t.comment(),c=t.first_child(o);t.snippet(c,()=>a.children??t.noop),t.append(p,o)},$$slots:{default:!0}})),t.pop()}function mt(n,a){t.push(a,!0);/**
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
 */let _=t.rest_props(a,["$$slots","$$events","$$legacy"]);const r=[["path",{d:"M5 12h14"}],["path",{d:"M12 5v14"}]];V(n,t.spread_props({name:"plus"},()=>_,{get iconNode(){return r},children:(p,$)=>{var o=t.comment(),c=t.first_child(o);t.snippet(c,()=>a.children??t.noop),t.append(p,o)},$$slots:{default:!0}})),t.pop()}function xt(n,a){t.push(a,!0);/**
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
 */let _=t.rest_props(a,["$$slots","$$events","$$legacy"]);const r=[["path",{d:"M16 17h6v-6"}],["path",{d:"m22 17-8.5-8.5-5 5L2 7"}]];V(n,t.spread_props({name:"trending-down"},()=>_,{get iconNode(){return r},children:(p,$)=>{var o=t.comment(),c=t.first_child(o);t.snippet(c,()=>a.children??t.noop),t.append(p,o)},$$slots:{default:!0}})),t.pop()}function yt(n,a){t.push(a,!0);/**
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
 */let _=t.rest_props(a,["$$slots","$$events","$$legacy"]);const r=[["path",{d:"M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"}]];V(n,t.spread_props({name:"wrench"},()=>_,{get iconNode(){return r},children:(p,$)=>{var o=t.comment(),c=t.first_child(o);t.snippet(c,()=>a.children??t.noop),t.append(p,o)},$$slots:{default:!0}})),t.pop()}function wt(n,a){t.push(a,!0);/**
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
 */let _=t.rest_props(a,["$$slots","$$events","$$legacy"]);const r=[["path",{d:"M18 6 6 18"}],["path",{d:"m6 6 12 12"}]];V(n,t.spread_props({name:"x"},()=>_,{get iconNode(){return r},children:(p,$)=>{var o=t.comment(),c=t.first_child(o);t.snippet(c,()=>a.children??t.noop),t.append(p,o)},$$slots:{default:!0}})),t.pop()}var Nt=t.from_html('<button class="btn btn-primary btn-sm gap-2"><!> New asset</button>'),kt=t.from_html('<div class="alert alert-error"> </div>'),Mt=t.from_html('<tr><td colspan="7" class="text-center py-6 text-base-content/60">No assets.</td></tr>'),St=t.from_html('<tr><td class="font-mono"> </td><td> </td><td><span class="badge badge-ghost badge-sm"> </span></td><td> </td><td class="text-right"> </td><td class="text-right"> </td><td><span class="badge badge-sm"> </span></td></tr>'),$t=t.from_html('<div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Tag</th><th>Name</th><th>Category</th><th>Acquired</th><th class="text-right">Cost</th><th class="text-right">NBV</th><th>Status</th></tr></thead><tbody><!></tbody></table></div>'),Ot=t.from_html('<tr><td colspan="5" class="text-center py-6 text-base-content/60">No maintenance records.</td></tr>'),jt=t.from_html('<tr><td> </td><td> </td><td class="max-w-xs truncate"> </td><td class="text-right"> </td><td><span class="badge badge-sm"> </span></td></tr>'),Pt=t.from_html('<div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Asset</th><th>Date</th><th>Description</th><th class="text-right">Cost</th><th>Status</th></tr></thead><tbody><!></tbody></table></div>'),Ct=t.from_html('<tr><td colspan="5" class="text-center py-6 text-base-content/60">No depreciation entries.</td></tr>'),Dt=t.from_html('<tr><td> </td><td> </td><td class="text-right"> </td><td class="text-right"> </td><td class="text-right"> </td></tr>'),At=t.from_html('<div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Asset</th><th>Period</th><th class="text-right">Depreciation</th><th class="text-right">Accumulated</th><th class="text-right">NBV</th></tr></thead><tbody><!></tbody></table></div>'),zt=t.from_html('<div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><div class="bg-base-100 rounded-xl p-6 w-full max-w-md"><div class="flex items-center justify-between mb-4"><h2 class="text-xl font-semibold">New asset</h2><button class="btn btn-ghost btn-sm btn-square"><!></button></div> <div class="grid grid-cols-2 gap-3"><div class="col-span-1"><label class="label label-text">Tag</label><input class="input input-bordered w-full font-mono"/></div> <div class="col-span-1"><label class="label label-text">Category</label><select class="select select-bordered w-full"><option>Equipment</option><option>Vehicle</option><option>Building</option><option>Furniture</option><option>Other</option></select></div> <div class="col-span-2"><label class="label label-text">Name</label><input class="input input-bordered w-full"/></div> <div><label class="label label-text">Acquired</label><input type="date" class="input input-bordered w-full"/></div> <div><label class="label label-text">Useful life (years)</label><input type="number" class="input input-bordered w-full"/></div> <div><label class="label label-text">Cost</label><input type="number" step="0.01" class="input input-bordered w-full"/></div> <div><label class="label label-text">Currency</label><input class="input input-bordered w-full" maxlength="3"/></div> <div class="col-span-2"><label class="label label-text">Depreciation method</label><select class="select select-bordered w-full"><option>Straight line</option><option>Declining balance</option></select></div></div> <div class="flex justify-end gap-2 mt-4"><button class="btn btn-ghost">Cancel</button><button class="btn btn-primary"> </button></div></div></div>'),Rt=t.from_html('<div class="p-6 space-y-4"><header class="flex items-center justify-between"><h1 class="text-2xl font-semibold flex items-center gap-2"><!> Fixed Assets</h1> <!></header> <!> <div role="tablist" class="tabs tabs-bordered"><button role="tab"><!> Register</button> <button role="tab"><!> Maintenance</button> <button role="tab"><!> Depreciation</button></div> <!></div> <!>',1);function Tt(n,a){var _t;t.push(a,!0);const _=((_t=window.__zveltio)==null?void 0:_t.engineUrl)??"";let r=t.state("register"),p=t.state(t.proxy([])),$=t.state(t.proxy([])),o=t.state(t.proxy([])),c=t.state(""),k=t.state(!1),W=t.state(!1),d=t.state(t.proxy({name:"",asset_tag:"",category:"equipment",purchase_date:new Date().toISOString().slice(0,10),purchase_cost:0,useful_life_years:5,depreciation_method:"straight_line",currency:"RON"}));async function T(e,s){const u=await fetch(`${_}${e}`,{credentials:"include",...s}),g=await u.json().catch(()=>({}));if(!u.ok)throw new Error(g.error||`HTTP ${u.status}`);return g}async function E(){try{const e=await T("/api/assets");t.set(p,e.data??[],!0)}catch(e){t.set(c,e.message,!0)}}async function Z(){try{const e=await T("/api/assets/maintenance");t.set($,e.data??[],!0)}catch(e){t.set(c,e.message,!0)}}async function at(){try{const e=await T("/api/assets/depreciation");t.set(o,e.data??[],!0)}catch(e){t.set(c,e.message,!0)}}async function st(){t.set(W,!0),t.set(c,"");try{await T("/api/assets",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(t.get(d))}),t.set(k,!1),t.set(d,{name:"",asset_tag:"",category:"equipment",purchase_date:new Date().toISOString().slice(0,10),purchase_cost:0,useful_life_years:5,depreciation_method:"straight_line",currency:"RON"},!0),await E()}catch(e){t.set(c,e.message,!0)}finally{t.set(W,!1)}}t.user_effect(()=>{t.get(r)==="register"?E():t.get(r)==="maintenance"?Z():at()}),pt.onMount(E);function P(e,s="RON"){return new Intl.NumberFormat("ro-RO",{style:"currency",currency:s}).format(e)}var G=Rt(),U=t.first_child(G),K=t.child(U),rt=t.child(K),qt=t.child(rt);lt(qt,{class:"h-6 w-6"}),t.next(),t.reset(rt);var Wt=t.sibling(rt,2);{var Bt=e=>{var s=Nt(),u=t.child(s);mt(u,{class:"h-4 w-4"}),t.next(),t.reset(s),t.delegated("click",s,()=>t.set(k,!0)),t.append(e,s)};t.if(Wt,e=>{t.get(r)==="register"&&e(Bt)})}t.reset(K);var dt=t.sibling(K,2);{var Ft=e=>{var s=kt(),u=t.child(s,!0);t.reset(s),t.template_effect(()=>t.set_text(u,t.get(c))),t.append(e,s)};t.if(dt,e=>{t.get(c)&&e(Ft)})}var it=t.sibling(dt,2),H=t.child(it);let ot;var It=t.child(H);lt(It,{class:"h-4 w-4"}),t.next(),t.reset(H);var J=t.sibling(H,2);let ct;var Vt=t.child(J);yt(Vt,{class:"h-4 w-4"}),t.next(),t.reset(J);var Q=t.sibling(J,2);let ut;var Et=t.child(Q);xt(Et,{class:"h-4 w-4"}),t.next(),t.reset(Q),t.reset(it);var Ut=t.sibling(it,2);{var Ht=e=>{var s=$t(),u=t.child(s),g=t.sibling(t.child(u)),C=t.child(g);{var B=l=>{var h=Mt();t.append(l,h)},D=l=>{var h=t.comment(),A=t.first_child(h);t.each(A,17,()=>t.get(p),b=>b.id,(b,i)=>{var f=St(),m=t.child(f),z=t.child(m,!0);t.reset(m);var x=t.sibling(m),R=t.child(x,!0);t.reset(x);var y=t.sibling(x),O=t.child(y),w=t.child(O,!0);t.reset(O),t.reset(y);var M=t.sibling(y),j=t.child(M,!0);t.reset(M);var N=t.sibling(M),q=t.child(N,!0);t.reset(N);var S=t.sibling(N),F=t.child(S,!0);t.reset(S);var L=t.sibling(S),I=t.child(L),X=t.child(I,!0);t.reset(I),t.reset(L),t.reset(f),t.template_effect((Y,tt)=>{t.set_text(z,t.get(i).asset_tag),t.set_text(R,t.get(i).name),t.set_text(w,t.get(i).category),t.set_text(j,t.get(i).purchase_date),t.set_text(q,Y),t.set_text(F,tt),t.set_text(X,t.get(i).status??"active")},[()=>P(Number(t.get(i).purchase_cost),t.get(i).currency),()=>P(Number(t.get(i).net_book_value??t.get(i).purchase_cost),t.get(i).currency)]),t.append(b,f)}),t.append(l,h)};t.if(C,l=>{t.get(p).length===0?l(B):l(D,-1)})}t.reset(g),t.reset(u),t.reset(s),t.append(e,s)},Jt=e=>{var s=Pt(),u=t.child(s),g=t.sibling(t.child(u)),C=t.child(g);{var B=l=>{var h=Ot();t.append(l,h)},D=l=>{var h=t.comment(),A=t.first_child(h);t.each(A,17,()=>t.get($),b=>b.id,(b,i)=>{var f=jt(),m=t.child(f),z=t.child(m,!0);t.reset(m);var x=t.sibling(m),R=t.child(x,!0);t.reset(x);var y=t.sibling(x),O=t.child(y,!0);t.reset(y);var w=t.sibling(y),M=t.child(w,!0);t.reset(w);var j=t.sibling(w),N=t.child(j),q=t.child(N,!0);t.reset(N),t.reset(j),t.reset(f),t.template_effect(S=>{t.set_text(z,t.get(i).asset_name??t.get(i).asset_id),t.set_text(R,t.get(i).maintenance_date),t.set_text(O,t.get(i).description),t.set_text(M,S),t.set_text(q,t.get(i).status)},[()=>P(Number(t.get(i).cost??0))]),t.append(b,f)}),t.append(l,h)};t.if(C,l=>{t.get($).length===0?l(B):l(D,-1)})}t.reset(g),t.reset(u),t.reset(s),t.append(e,s)},Lt=e=>{var s=At(),u=t.child(s),g=t.sibling(t.child(u)),C=t.child(g);{var B=l=>{var h=Ct();t.append(l,h)},D=l=>{var h=t.comment(),A=t.first_child(h);t.each(A,17,()=>t.get(o),b=>b.id,(b,i)=>{var f=Dt(),m=t.child(f),z=t.child(m,!0);t.reset(m);var x=t.sibling(m),R=t.child(x,!0);t.reset(x);var y=t.sibling(x),O=t.child(y,!0);t.reset(y);var w=t.sibling(y),M=t.child(w,!0);t.reset(w);var j=t.sibling(w),N=t.child(j,!0);t.reset(j),t.reset(f),t.template_effect((q,S,F)=>{t.set_text(z,t.get(i).asset_name),t.set_text(R,t.get(i).period),t.set_text(O,q),t.set_text(M,S),t.set_text(N,F)},[()=>P(Number(t.get(i).depreciation_amount)),()=>P(Number(t.get(i).accumulated)),()=>P(Number(t.get(i).net_book_value))]),t.append(b,f)}),t.append(l,h)};t.if(C,l=>{t.get(o).length===0?l(B):l(D,-1)})}t.reset(g),t.reset(u),t.reset(s),t.append(e,s)};t.if(Ut,e=>{t.get(r)==="register"?e(Ht):t.get(r)==="maintenance"?e(Jt,1):e(Lt,-1)})}t.reset(U);var Xt=t.sibling(U,2);{var Zt=e=>{var s=zt(),u=t.child(s),g=t.child(u),C=t.sibling(t.child(g)),B=t.child(C);wt(B,{class:"h-4 w-4"}),t.reset(C),t.reset(g);var D=t.sibling(g,2),l=t.child(D),h=t.sibling(t.child(l));t.remove_input_defaults(h),t.reset(l);var A=t.sibling(l,2),b=t.sibling(t.child(A)),i=t.child(b);i.value=i.__value="equipment";var f=t.sibling(i);f.value=f.__value="vehicle";var m=t.sibling(f);m.value=m.__value="building";var z=t.sibling(m);z.value=z.__value="furniture";var x=t.sibling(z);x.value=x.__value="other",t.reset(b),t.reset(A);var R=t.sibling(A,2),y=t.sibling(t.child(R));t.remove_input_defaults(y),t.reset(R);var O=t.sibling(R,2),w=t.sibling(t.child(O));t.remove_input_defaults(w),t.reset(O);var M=t.sibling(O,2),j=t.sibling(t.child(M));t.remove_input_defaults(j),t.reset(M);var N=t.sibling(M,2),q=t.sibling(t.child(N));t.remove_input_defaults(q),t.reset(N);var S=t.sibling(N,2),F=t.sibling(t.child(S));t.remove_input_defaults(F),t.reset(S);var L=t.sibling(S,2),I=t.sibling(t.child(L)),X=t.child(I);X.value=X.__value="straight_line";var Y=t.sibling(X);Y.value=Y.__value="declining_balance",t.reset(I),t.reset(L),t.reset(D);var tt=t.sibling(D,2),vt=t.child(tt),et=t.sibling(vt),Gt=t.child(et,!0);t.reset(et),t.reset(tt),t.reset(u),t.reset(s),t.template_effect(()=>{et.disabled=t.get(W)||!t.get(d).name||!t.get(d).asset_tag,t.set_text(Gt,t.get(W)?"Saving…":"Create")}),t.delegated("click",s,v=>v.target===v.currentTarget&&t.set(k,!1)),t.delegated("click",C,()=>t.set(k,!1)),t.bind_value(h,()=>t.get(d).asset_tag,v=>t.get(d).asset_tag=v),t.bind_select_value(b,()=>t.get(d).category,v=>t.get(d).category=v),t.bind_value(y,()=>t.get(d).name,v=>t.get(d).name=v),t.bind_value(w,()=>t.get(d).purchase_date,v=>t.get(d).purchase_date=v),t.bind_value(j,()=>t.get(d).useful_life_years,v=>t.get(d).useful_life_years=v),t.bind_value(q,()=>t.get(d).purchase_cost,v=>t.get(d).purchase_cost=v),t.bind_value(F,()=>t.get(d).currency,v=>t.get(d).currency=v),t.bind_select_value(I,()=>t.get(d).depreciation_method,v=>t.get(d).depreciation_method=v),t.delegated("click",vt,()=>t.set(k,!1)),t.delegated("click",et,st),t.append(e,s)};t.if(Xt,e=>{t.get(k)&&e(Zt)})}t.template_effect(()=>{ot=t.set_class(H,1,"tab gap-2",null,ot,{"tab-active":t.get(r)==="register"}),ct=t.set_class(J,1,"tab gap-2",null,ct,{"tab-active":t.get(r)==="maintenance"}),ut=t.set_class(Q,1,"tab gap-2",null,ut,{"tab-active":t.get(r)==="depreciation"})}),t.delegated("click",H,()=>t.set(r,"register")),t.delegated("click",J,()=>t.set(r,"maintenance")),t.delegated("click",Q,()=>t.set(r,"depreciation")),t.append(n,G),t.pop()}t.delegate(["click"]);function nt(){const n=window.__zveltio;n&&n.registerRoute({path:"assets",component:Tt,label:"Fixed Assets",icon:"Building",category:"operations"})}return nt(),nt})(window.__SvelteRuntime.__unknown,window.__SvelteRuntime.internal_client,window.__SvelteRuntime.svelte);
