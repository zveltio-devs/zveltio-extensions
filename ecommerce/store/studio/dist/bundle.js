var ZveltioExt=(function(jt,et,rt){"use strict";function at(s){const e=Object.create(null,{[Symbol.toStringTag]:{value:"Module"}});if(s){for(const d in s)if(d!=="default"){const a=Object.getOwnPropertyDescriptor(s,d);Object.defineProperty(e,d,a.get?a:{enumerable:!0,get:()=>s[d]})}}return e.default=s,Object.freeze(e)}const t=at(et);/**
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
 */const st={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"};var ot=t.from_svg("<svg><!><!></svg>");function V(s,e){t.push(e,!0);const d=t.prop(e,"color",3,"currentColor"),a=t.prop(e,"size",3,24),h=t.prop(e,"strokeWidth",3,2),x=t.prop(e,"absoluteStrokeWidth",3,!1),l=t.prop(e,"iconNode",19,()=>[]),i=t.rest_props(e,["$$slots","$$events","$$legacy","name","color","size","strokeWidth","absoluteStrokeWidth","iconNode","children"]);var y=ot();t.attribute_effect(y,N=>({...st,...i,width:a(),height:a(),stroke:d(),"stroke-width":N,class:["lucide-icon lucide",e.name&&`lucide-${e.name}`,e.class]}),[()=>x()?Number(h())*24/Number(a()):h()]);var k=t.child(y);t.each(k,17,l,t.index,(N,E)=>{var U=t.derived(()=>t.to_array(t.get(E),2));let S=()=>t.get(U)[0],P=()=>t.get(U)[1];var $=t.comment(),F=t.first_child($);t.element(F,S,!0,(B,J)=>{t.attribute_effect(B,()=>({...P()}))}),t.append(N,$)});var q=t.sibling(k);t.snippet(q,()=>e.children??t.noop),t.reset(y),t.append(s,y),t.pop()}function ct(s,e){t.push(e,!0);/**
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
 */let d=t.rest_props(e,["$$slots","$$events","$$legacy"]);const a=[["path",{d:"M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"}],["path",{d:"M12 22V12"}],["polyline",{points:"3.29 7 12 12 20.71 7"}],["path",{d:"m7.5 4.27 9 5.15"}]];V(s,t.spread_props({name:"package"},()=>d,{get iconNode(){return a},children:(h,x)=>{var l=t.comment(),i=t.first_child(l);t.snippet(i,()=>e.children??t.noop),t.append(h,l)},$$slots:{default:!0}})),t.pop()}function nt(s,e){t.push(e,!0);/**
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
 */let d=t.rest_props(e,["$$slots","$$events","$$legacy"]);const a=[["circle",{cx:"8",cy:"21",r:"1"}],["circle",{cx:"19",cy:"21",r:"1"}],["path",{d:"M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"}]];V(s,t.spread_props({name:"shopping-cart"},()=>d,{get iconNode(){return a},children:(h,x)=>{var l=t.comment(),i=t.first_child(l);t.snippet(i,()=>e.children??t.noop),t.append(h,l)},$$slots:{default:!0}})),t.pop()}function lt(s,e){t.push(e,!0);/**
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
 */let d=t.rest_props(e,["$$slots","$$events","$$legacy"]);const a=[["path",{d:"M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"}],["circle",{cx:"7.5",cy:"7.5",r:".5",fill:"currentColor"}]];V(s,t.spread_props({name:"tag"},()=>d,{get iconNode(){return a},children:(h,x)=>{var l=t.comment(),i=t.first_child(l);t.snippet(i,()=>e.children??t.noop),t.append(h,l)},$$slots:{default:!0}})),t.pop()}function dt(s,e){t.push(e,!0);/**
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
 */let d=t.rest_props(e,["$$slots","$$events","$$legacy"]);const a=[["path",{d:"M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"}],["path",{d:"M15 18H9"}],["path",{d:"M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"}],["circle",{cx:"17",cy:"18",r:"2"}],["circle",{cx:"7",cy:"18",r:"2"}]];V(s,t.spread_props({name:"truck"},()=>d,{get iconNode(){return a},children:(h,x)=>{var l=t.comment(),i=t.first_child(l);t.snippet(i,()=>e.children??t.noop),t.append(h,l)},$$slots:{default:!0}})),t.pop()}var it=t.from_html('<div class="alert alert-error"> </div>'),ht=t.from_html('<tr><td colspan="5" class="text-center py-6 text-base-content/60">No orders.</td></tr>'),vt=t.from_html('<tr><td class="font-mono"> </td><td> </td><td> </td><td class="text-right"> </td><td><span> </span></td></tr>'),_t=t.from_html('<div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Number</th><th>Customer</th><th>Date</th><th class="text-right">Total</th><th>Status</th></tr></thead><tbody><!></tbody></table></div>'),ut=t.from_html('<tr><td colspan="5" class="text-center py-6 text-base-content/60">No products.</td></tr>'),gt=t.from_html('<tr><td class="font-mono text-xs"> </td><td> </td><td> </td><td class="text-right"> </td><td class="text-right"> </td></tr>'),pt=t.from_html('<div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>SKU</th><th>Name</th><th>Category</th><th class="text-right">Price</th><th class="text-right">Stock</th></tr></thead><tbody><!></tbody></table></div>'),mt=t.from_html('<tr><td colspan="3" class="text-center py-6 text-base-content/60">No categories.</td></tr>'),bt=t.from_html('<tr><td class="font-mono text-xs"> </td><td> </td><td> </td></tr>'),ft=t.from_html('<div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Slug</th><th>Name</th><th>Active</th></tr></thead><tbody><!></tbody></table></div>'),xt=t.from_html('<div class="p-6 space-y-4"><header><h1 class="text-2xl font-semibold flex items-center gap-2"><!> eCommerce</h1></header> <!> <div role="tablist" class="tabs tabs-bordered"><button role="tab"><!> Orders</button> <button role="tab"><!> Products</button> <button role="tab"><!> Categories</button></div> <!></div>');function yt(s,e){var tt;t.push(e,!0);const d=((tt=window.__zveltio)==null?void 0:tt.engineUrl)??"";let a=t.state("orders"),h=t.state(t.proxy([])),x=t.state(t.proxy([])),l=t.state(t.proxy([])),i=t.state("");async function y(r,c){const v=await fetch(`${d}${r}`,{credentials:"include",...c}),u=await v.json().catch(()=>({}));if(!v.ok)throw new Error(u.error||`HTTP ${v.status}`);return u}async function k(){try{const r=await y("/api/ecommerce/orders?limit=50");t.set(h,r.data??[],!0)}catch(r){t.set(i,r.message,!0)}}async function q(){try{const r=await y("/api/ecommerce/products?limit=100");t.set(x,r.data??[],!0)}catch(r){t.set(i,r.message,!0)}}async function N(){try{const r=await y("/api/ecommerce/categories");t.set(l,r.data??[],!0)}catch(r){t.set(i,r.message,!0)}}t.user_effect(()=>{t.get(a)==="orders"?k():t.get(a)==="products"?q():N()}),rt.onMount(()=>k());function E(r,c="RON"){return new Intl.NumberFormat("ro-RO",{style:"currency",currency:c}).format(r)}function U(r){return{pending:"badge-warning",paid:"badge-success",shipped:"badge-info",delivered:"badge-success",cancelled:"badge-error"}[r]??"badge-ghost"}var S=xt(),P=t.child(S),$=t.child(P),F=t.child($);nt(F,{class:"h-6 w-6"}),t.next(),t.reset($),t.reset(P);var B=t.sibling(P,2);{var J=r=>{var c=it(),v=t.child(c,!0);t.reset(c),t.template_effect(()=>t.set_text(v,t.get(i))),t.append(r,c)};t.if(B,r=>{t.get(i)&&r(J)})}var K=t.sibling(B,2),C=t.child(K);let Q;var wt=t.child(C);dt(wt,{class:"h-4 w-4"}),t.next(),t.reset(C);var M=t.sibling(C,2);let X;var kt=t.child(M);ct(kt,{class:"h-4 w-4"}),t.next(),t.reset(M);var I=t.sibling(M,2);let Y;var Nt=t.child(I);lt(Nt,{class:"h-4 w-4"}),t.next(),t.reset(I),t.reset(K);var St=t.sibling(K,2);{var Pt=r=>{var c=_t(),v=t.child(c),u=t.sibling(t.child(v)),z=t.child(u);{var O=o=>{var _=ht();t.append(o,_)},j=o=>{var _=t.comment(),A=t.first_child(_);t.each(A,17,()=>t.get(h),g=>g.id,(g,n)=>{var p=vt(),m=t.child(p),H=t.child(m,!0);t.reset(m);var b=t.sibling(m),R=t.child(b,!0);t.reset(b);var f=t.sibling(b),T=t.child(f,!0);t.reset(f);var w=t.sibling(f),L=t.child(w,!0);t.reset(w);var W=t.sibling(w),D=t.child(W),Z=t.child(D,!0);t.reset(D),t.reset(W),t.reset(p),t.template_effect((Mt,zt,Ot)=>{t.set_text(H,t.get(n).order_number),t.set_text(R,t.get(n).customer_email??"—"),t.set_text(T,Mt),t.set_text(L,zt),t.set_class(D,1,`badge ${Ot??""} badge-sm`),t.set_text(Z,t.get(n).status)},[()=>new Date(t.get(n).created_at).toLocaleDateString(),()=>E(Number(t.get(n).total),t.get(n).currency),()=>U(t.get(n).status)]),t.append(g,p)}),t.append(o,_)};t.if(z,o=>{t.get(h).length===0?o(O):o(j,-1)})}t.reset(u),t.reset(v),t.reset(c),t.append(r,c)},$t=r=>{var c=pt(),v=t.child(c),u=t.sibling(t.child(v)),z=t.child(u);{var O=o=>{var _=ut();t.append(o,_)},j=o=>{var _=t.comment(),A=t.first_child(_);t.each(A,17,()=>t.get(x),g=>g.id,(g,n)=>{var p=gt(),m=t.child(p),H=t.child(m,!0);t.reset(m);var b=t.sibling(m),R=t.child(b,!0);t.reset(b);var f=t.sibling(b),T=t.child(f,!0);t.reset(f);var w=t.sibling(f),L=t.child(w,!0);t.reset(w);var W=t.sibling(w),D=t.child(W,!0);t.reset(W),t.reset(p),t.template_effect(Z=>{t.set_text(H,t.get(n).sku),t.set_text(R,t.get(n).name),t.set_text(T,t.get(n).category_name??"—"),t.set_text(L,Z),t.set_text(D,t.get(n).stock_qty)},[()=>E(Number(t.get(n).price),t.get(n).currency)]),t.append(g,p)}),t.append(o,_)};t.if(z,o=>{t.get(x).length===0?o(O):o(j,-1)})}t.reset(u),t.reset(v),t.reset(c),t.append(r,c)},Ct=r=>{var c=ft(),v=t.child(c),u=t.sibling(t.child(v)),z=t.child(u);{var O=o=>{var _=mt();t.append(o,_)},j=o=>{var _=t.comment(),A=t.first_child(_);t.each(A,17,()=>t.get(l),g=>g.id,(g,n)=>{var p=bt(),m=t.child(p),H=t.child(m,!0);t.reset(m);var b=t.sibling(m),R=t.child(b,!0);t.reset(b);var f=t.sibling(b),T=t.child(f,!0);t.reset(f),t.reset(p),t.template_effect(()=>{t.set_text(H,t.get(n).slug),t.set_text(R,t.get(n).name),t.set_text(T,t.get(n).is_active?"✓":"—")}),t.append(g,p)}),t.append(o,_)};t.if(z,o=>{t.get(l).length===0?o(O):o(j,-1)})}t.reset(u),t.reset(v),t.reset(c),t.append(r,c)};t.if(St,r=>{t.get(a)==="orders"?r(Pt):t.get(a)==="products"?r($t,1):r(Ct,-1)})}t.reset(S),t.template_effect(()=>{Q=t.set_class(C,1,"tab gap-2",null,Q,{"tab-active":t.get(a)==="orders"}),X=t.set_class(M,1,"tab gap-2",null,X,{"tab-active":t.get(a)==="products"}),Y=t.set_class(I,1,"tab gap-2",null,Y,{"tab-active":t.get(a)==="categories"})}),t.delegated("click",C,()=>t.set(a,"orders")),t.delegated("click",M,()=>t.set(a,"products")),t.delegated("click",I,()=>t.set(a,"categories")),t.append(s,S),t.pop()}t.delegate(["click"]);function G(){const s=window.__zveltio;s&&s.registerRoute({path:"ecommerce",component:yt,label:"eCommerce",icon:"ShoppingCart",category:"ecommerce"})}return G(),G})(window.__SvelteRuntime.__unknown,window.__SvelteRuntime.internal_client,window.__SvelteRuntime.svelte);
