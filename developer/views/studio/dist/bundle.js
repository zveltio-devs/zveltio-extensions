var ZveltioExt=(function(Ce,ne,re){"use strict";function se(n){const t=Object.create(null,{[Symbol.toStringTag]:{value:"Module"}});if(n){for(const s in n)if(s!=="default"){const r=Object.getOwnPropertyDescriptor(n,s);Object.defineProperty(t,s,r.get?r:{enumerable:!0,get:()=>n[s]})}}return t.default=n,Object.freeze(t)}const e=se(ne);/**
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
 */const oe={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"};var le=e.from_svg("<svg><!><!></svg>");function _(n,t){e.push(t,!0);const s=e.prop(t,"color",3,"currentColor"),r=e.prop(t,"size",3,24),l=e.prop(t,"strokeWidth",3,2),v=e.prop(t,"absoluteStrokeWidth",3,!1),i=e.prop(t,"iconNode",19,()=>[]),o=e.rest_props(t,["$$slots","$$events","$$legacy","name","color","size","strokeWidth","absoluteStrokeWidth","iconNode","children"]);var d=le();e.attribute_effect(d,S=>({...oe,...o,width:r(),height:r(),stroke:s(),"stroke-width":S,class:["lucide-icon lucide",t.name&&`lucide-${t.name}`,t.class]}),[()=>v()?Number(l())*24/Number(r()):l()]);var f=e.child(d);e.each(f,17,i,e.index,(S,R)=>{var W=e.derived(()=>e.to_array(e.get(R),2));let A=()=>e.get(W)[0],D=()=>e.get(W)[1];var x=e.comment(),j=e.first_child(x);e.element(j,A,!0,(P,K)=>{e.attribute_effect(P,()=>({...D()}))}),e.append(S,x)});var M=e.sibling(f);e.snippet(M,()=>t.children??e.noop),e.reset(d),e.append(n,d),e.pop()}function de(n,t){e.push(t,!0);/**
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
 */let s=e.rest_props(t,["$$slots","$$events","$$legacy"]);const r=[["path",{d:"M8 2v4"}],["path",{d:"M16 2v4"}],["rect",{width:"18",height:"18",x:"3",y:"4",rx:"2"}],["path",{d:"M3 10h18"}]];_(n,e.spread_props({name:"calendar"},()=>s,{get iconNode(){return r},children:(l,v)=>{var i=e.comment(),o=e.first_child(i);e.snippet(o,()=>t.children??e.noop),e.append(l,i)},$$slots:{default:!0}})),e.pop()}function B(n,t){e.push(t,!0);/**
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
 */let s=e.rest_props(t,["$$slots","$$events","$$legacy"]);const r=[["rect",{width:"7",height:"7",x:"3",y:"3",rx:"1"}],["rect",{width:"7",height:"7",x:"14",y:"3",rx:"1"}],["rect",{width:"7",height:"7",x:"14",y:"14",rx:"1"}],["rect",{width:"7",height:"7",x:"3",y:"14",rx:"1"}]];_(n,e.spread_props({name:"layout-grid"},()=>s,{get iconNode(){return r},children:(l,v)=>{var i=e.comment(),o=e.first_child(i);e.snippet(o,()=>t.children??e.noop),e.append(l,i)},$$slots:{default:!0}})),e.pop()}function F(n,t){e.push(t,!0);/**
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
 */let s=e.rest_props(t,["$$slots","$$events","$$legacy"]);const r=[["path",{d:"M3 12h.01"}],["path",{d:"M3 18h.01"}],["path",{d:"M3 6h.01"}],["path",{d:"M8 12h13"}],["path",{d:"M8 18h13"}],["path",{d:"M8 6h13"}]];_(n,e.spread_props({name:"list"},()=>s,{get iconNode(){return r},children:(l,v)=>{var i=e.comment(),o=e.first_child(i);e.snippet(o,()=>t.children??e.noop),e.append(l,i)},$$slots:{default:!0}})),e.pop()}function ce(n,t){e.push(t,!0);/**
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
 */let s=e.rest_props(t,["$$slots","$$events","$$legacy"]);const r=[["path",{d:"M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"}],["path",{d:"M15 5.764v15"}],["path",{d:"M9 3.236v15"}]];_(n,e.spread_props({name:"map"},()=>s,{get iconNode(){return r},children:(l,v)=>{var i=e.comment(),o=e.first_child(i);e.snippet(o,()=>t.children??e.noop),e.append(l,i)},$$slots:{default:!0}})),e.pop()}function ve(n,t){e.push(t,!0);/**
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
 */let s=e.rest_props(t,["$$slots","$$events","$$legacy"]);const r=[["path",{d:"M5 12h14"}],["path",{d:"M12 5v14"}]];_(n,e.spread_props({name:"plus"},()=>s,{get iconNode(){return r},children:(l,v)=>{var i=e.comment(),o=e.first_child(i);e.snippet(o,()=>t.children??e.noop),e.append(l,i)},$$slots:{default:!0}})),e.pop()}function pe(n,t){e.push(t,!0);/**
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
 */let s=e.rest_props(t,["$$slots","$$events","$$legacy"]);const r=[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2"}],["path",{d:"M8 7v7"}],["path",{d:"M12 7v4"}],["path",{d:"M16 7v9"}]];_(n,e.spread_props({name:"square-kanban"},()=>s,{get iconNode(){return r},children:(l,v)=>{var i=e.comment(),o=e.first_child(i);e.snippet(o,()=>t.children??e.noop),e.append(l,i)},$$slots:{default:!0}})),e.pop()}function ue(n,t){e.push(t,!0);/**
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
 */let s=e.rest_props(t,["$$slots","$$events","$$legacy"]);const r=[["path",{d:"M18 6 6 18"}],["path",{d:"m6 6 12 12"}]];_(n,e.spread_props({name:"x"},()=>s,{get iconNode(){return r},children:(l,v)=>{var i=e.comment(),o=e.first_child(i);e.snippet(o,()=>t.children??e.noop),e.append(l,i)},$$slots:{default:!0}})),e.pop()}var he=e.from_html('<div class="alert alert-error"> </div>'),ge=e.from_html('<div class="col-span-full bg-base-100 rounded-lg p-12 text-center text-base-content/60">No saved views yet.</div>'),_e=e.from_html('<div class="bg-base-100 rounded-lg shadow p-4"><div class="flex items-start justify-between mb-2"><div class="flex items-center gap-2"><!> <div class="font-medium"> </div></div> <span class="badge badge-ghost badge-sm"> </span></div> <div class="text-xs text-base-content/60 font-mono"> </div> <div class="flex justify-end mt-3"><button class="btn btn-ghost btn-xs">Delete</button></div></div>'),fe=e.from_html("<option> </option>"),be=e.from_html('<div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><div class="bg-base-100 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"><div class="flex items-center justify-between mb-4"><h2 class="text-xl font-semibold">New view</h2><button class="btn btn-ghost btn-sm btn-square"><!></button></div> <div class="space-y-3"><div><label class="label label-text">Name</label><input class="input input-bordered w-full"/></div> <div><label class="label label-text">Collection</label> <select class="select select-bordered w-full"><option>—</option><!></select></div> <div><label class="label label-text">View type</label> <select class="select select-bordered w-full"><option>List</option><option>Kanban board</option><option>Card grid</option><option>Calendar</option><option>Map (requires PostGIS)</option></select></div> <div><label class="label label-text">Config (JSON)</label><textarea class="textarea textarea-bordered w-full font-mono text-xs" rows="8"></textarea></div></div> <div class="flex justify-end gap-2 mt-4"><button class="btn btn-ghost">Cancel</button><button class="btn btn-primary"> </button></div></div></div>'),me=e.from_html('<div class="p-6 space-y-4"><header class="flex items-center justify-between"><h1 class="text-2xl font-semibold flex items-center gap-2"><!> Custom Views</h1> <button class="btn btn-primary btn-sm gap-2"><!> New view</button></header> <!> <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"><!></div></div> <!>',1);function we(n,t){var Q;e.push(t,!0);const s=((Q=window.__zveltio)==null?void 0:Q.engineUrl)??"";let r=e.state(e.proxy([])),l=e.state(e.proxy([])),v=e.state(""),i=e.state(!1),o=e.state(!1),d=e.state(e.proxy({name:"",collection:"",view_type:"list",config:`{
  "columns": [],
  "filters": [],
  "sort": []
}`}));async function f(a,c){const u=await fetch(`${s}${a}`,{credentials:"include",...c}),h=await u.json().catch(()=>({}));if(!u.ok)throw new Error(h.error||`HTTP ${u.status}`);return h}async function M(){try{const a=await f("/api/views");e.set(r,a.data??[],!0)}catch(a){e.set(v,a.message,!0)}}async function S(){try{const a=await f("/api/collections");e.set(l,a.collections??a.data??[],!0)}catch{}}async function R(){e.set(o,!0),e.set(v,"");try{let a={};try{a=JSON.parse(e.get(d).config)}catch{throw new Error("Invalid JSON in config")}await f("/api/views",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...e.get(d),config:a})}),e.set(i,!1),e.set(d,{name:"",collection:"",view_type:"list",config:`{
  "columns": [],
  "filters": [],
  "sort": []
}`},!0),await M()}catch(a){e.set(v,a.message,!0)}finally{e.set(o,!1)}}async function W(a){if(confirm("Delete view?"))try{await f(`/api/views/${a}`,{method:"DELETE"}),await M()}catch(c){e.set(v,c.message,!0)}}re.onMount(()=>{M(),S()});function A(a){return{list:F,board:pe,calendar:de,map:ce,card:B}[a]??F}var D=me(),x=e.first_child(D),j=e.child(x),P=e.child(j),K=e.child(P);B(K,{class:"h-6 w-6"}),e.next(),e.reset(P);var G=e.sibling(P,2),xe=e.child(G);ve(xe,{class:"h-4 w-4"}),e.next(),e.reset(G),e.reset(j);var X=e.sibling(j,2);{var ye=a=>{var c=he(),u=e.child(c,!0);e.reset(c),e.template_effect(()=>e.set_text(u,e.get(v))),e.append(a,c)};e.if(X,a=>{e.get(v)&&a(ye)})}var Z=e.sibling(X,2),$e=e.child(Z);{var Ne=a=>{var c=ge();e.append(a,c)},ke=a=>{var c=e.comment(),u=e.first_child(c);e.each(u,17,()=>e.get(r),h=>h.id,(h,g)=>{const U=e.derived(()=>A(e.get(g).view_type));var b=_e(),m=e.child(b),y=e.child(m),$=e.child(y);e.component($,()=>e.get(U),(V,L)=>{L(V,{class:"h-5 w-5 text-base-content/60"})});var N=e.sibling($,2),C=e.child(N,!0);e.reset(N),e.reset(y);var I=e.sibling(y,2),O=e.child(I,!0);e.reset(I),e.reset(m);var w=e.sibling(m,2),z=e.child(w,!0);e.reset(w);var k=e.sibling(w,2),T=e.child(k);e.reset(k),e.reset(b),e.template_effect(()=>{e.set_text(C,e.get(g).name),e.set_text(O,e.get(g).view_type),e.set_text(z,e.get(g).collection)}),e.delegated("click",T,()=>W(e.get(g).id)),e.append(h,b)}),e.append(a,c)};e.if($e,a=>{e.get(r).length===0?a(Ne):a(ke,-1)})}e.reset(Z),e.reset(x);var Me=e.sibling(x,2);{var Se=a=>{var c=be(),u=e.child(c),h=e.child(u),g=e.sibling(e.child(h)),U=e.child(g);ue(U,{class:"h-4 w-4"}),e.reset(g),e.reset(h);var b=e.sibling(h,2),m=e.child(b),y=e.sibling(e.child(m));e.remove_input_defaults(y),e.reset(m);var $=e.sibling(m,2),N=e.sibling(e.child($),2),C=e.child(N);C.value=C.__value="";var I=e.sibling(C);e.each(I,17,()=>e.get(l),p=>p.name,(p,J)=>{var E=fe(),Pe=e.child(E,!0);e.reset(E);var ie={};e.template_effect(()=>{e.set_text(Pe,e.get(J).display_name??e.get(J).name),ie!==(ie=e.get(J).name)&&(E.value=(E.__value=e.get(J).name)??"")}),e.append(p,E)}),e.reset(N),e.reset($);var O=e.sibling($,2),w=e.sibling(e.child(O),2),z=e.child(w);z.value=z.__value="list";var k=e.sibling(z);k.value=k.__value="board";var T=e.sibling(k);T.value=T.__value="card";var V=e.sibling(T);V.value=V.__value="calendar";var L=e.sibling(V);L.value=L.__value="map",e.reset(w),e.reset(O);var Y=e.sibling(O,2),ee=e.sibling(e.child(Y));e.remove_textarea_child(ee),e.reset(Y),e.reset(b);var te=e.sibling(b,2),ae=e.child(te),q=e.sibling(ae),je=e.child(q,!0);e.reset(q),e.reset(te),e.reset(u),e.reset(c),e.template_effect(()=>{q.disabled=e.get(o)||!e.get(d).name||!e.get(d).collection,e.set_text(je,e.get(o)?"Saving…":"Create")}),e.delegated("click",c,p=>p.target===p.currentTarget&&e.set(i,!1)),e.delegated("click",g,()=>e.set(i,!1)),e.bind_value(y,()=>e.get(d).name,p=>e.get(d).name=p),e.bind_select_value(N,()=>e.get(d).collection,p=>e.get(d).collection=p),e.bind_select_value(w,()=>e.get(d).view_type,p=>e.get(d).view_type=p),e.bind_value(ee,()=>e.get(d).config,p=>e.get(d).config=p),e.delegated("click",ae,()=>e.set(i,!1)),e.delegated("click",q,R),e.append(a,c)};e.if(Me,a=>{e.get(i)&&a(Se)})}e.delegated("click",G,()=>e.set(i,!0)),e.append(n,D),e.pop()}e.delegate(["click"]);function H(){const n=window.__zveltio;n&&n.registerRoute({path:"views",component:we,label:"Custom Views",icon:"LayoutGrid",category:"developer"})}return H(),H})(window.__SvelteRuntime.__unknown,window.__SvelteRuntime.internal_client,window.__SvelteRuntime.svelte);
