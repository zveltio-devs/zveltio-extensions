var ZveltioExt=(function(Ct,st,rt){"use strict";function nt(l){const a=Object.create(null,{[Symbol.toStringTag]:{value:"Module"}});if(l){for(const u in l)if(u!=="default"){const r=Object.getOwnPropertyDescriptor(l,u);Object.defineProperty(a,u,r.get?r:{enumerable:!0,get:()=>l[u]})}}return a.default=l,Object.freeze(a)}const t=nt(st);/**
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
 */const lt={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"};var it=t.from_svg("<svg><!><!></svg>");function A(l,a){t.push(a,!0);const u=t.prop(a,"color",3,"currentColor"),r=t.prop(a,"size",3,24),v=t.prop(a,"strokeWidth",3,2),N=t.prop(a,"absoluteStrokeWidth",3,!1),n=t.prop(a,"iconNode",19,()=>[]),_=t.rest_props(a,["$$slots","$$events","$$legacy","name","color","size","strokeWidth","absoluteStrokeWidth","iconNode","children"]);var f=it();t.attribute_effect(f,S=>({...lt,..._,width:r(),height:r(),stroke:u(),"stroke-width":S,class:["lucide-icon lucide",a.name&&`lucide-${a.name}`,a.class]}),[()=>N()?Number(v())*24/Number(r()):v()]);var P=t.child(f);t.each(P,17,n,t.index,(S,z)=>{var E=t.derived(()=>t.to_array(t.get(z),2));let U=()=>t.get(E)[0],Y=()=>t.get(E)[1];var H=t.comment(),V=t.first_child(H);t.element(V,U,!0,(W,Z)=>{t.attribute_effect(W,()=>({...Y()}))}),t.append(S,H)});var o=t.sibling(P);t.snippet(o,()=>a.children??t.noop),t.reset(f),t.append(l,f),t.pop()}function ot(l,a){t.push(a,!0);/**
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
 */let u=t.rest_props(a,["$$slots","$$events","$$legacy"]);const r=[["ellipse",{cx:"12",cy:"5",rx:"9",ry:"3"}],["path",{d:"M3 5V19A9 3 0 0 0 15 21.84"}],["path",{d:"M21 5V8"}],["path",{d:"M21 12L18 17H22L19 22"}],["path",{d:"M3 12A9 3 0 0 0 14.59 14.87"}]];A(l,t.spread_props({name:"database-zap"},()=>u,{get iconNode(){return r},children:(v,N)=>{var n=t.comment(),_=t.first_child(n);t.snippet(_,()=>a.children??t.noop),t.append(v,n)},$$slots:{default:!0}})),t.pop()}function dt(l,a){t.push(a,!0);/**
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
 */let u=t.rest_props(a,["$$slots","$$events","$$legacy"]);const r=[["polygon",{points:"6 3 20 12 6 21 6 3"}]];A(l,t.spread_props({name:"play"},()=>u,{get iconNode(){return r},children:(v,N)=>{var n=t.comment(),_=t.first_child(n);t.snippet(_,()=>a.children??t.noop),t.append(v,n)},$$slots:{default:!0}})),t.pop()}function ct(l,a){t.push(a,!0);/**
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
 */let u=t.rest_props(a,["$$slots","$$events","$$legacy"]);const r=[["path",{d:"M5 12h14"}],["path",{d:"M12 5v14"}]];A(l,t.spread_props({name:"plus"},()=>u,{get iconNode(){return r},children:(v,N)=>{var n=t.comment(),_=t.first_child(n);t.snippet(_,()=>a.children??t.noop),t.append(v,n)},$$slots:{default:!0}})),t.pop()}function ut(l,a){t.push(a,!0);/**
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
 */let u=t.rest_props(a,["$$slots","$$events","$$legacy"]);const r=[["path",{d:"M18 6 6 18"}],["path",{d:"m6 6 12 12"}]];A(l,t.spread_props({name:"x"},()=>u,{get iconNode(){return r},children:(v,N)=>{var n=t.comment(),_=t.first_child(n);t.snippet(_,()=>a.children??t.noop),t.append(v,n)},$$slots:{default:!0}})),t.pop()}var pt=t.from_html('<button class="btn btn-primary btn-sm gap-2"><!> New profile</button>'),vt=t.from_html('<div class="alert alert-error"> </div>'),_t=t.from_html('<tr><td colspan="5" class="text-center py-6 text-base-content/60">No profiles. Create one to scan an external DB.</td></tr>'),bt=t.from_html('<tr><td> </td><td class="font-mono text-xs"> </td><td> </td><td> </td><td><button class="btn btn-ghost btn-xs gap-1"><!> </button> <button class="btn btn-ghost btn-xs">Delete</button></td></tr>'),ht=t.from_html('<div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Name</th><th>Schema</th><th>Last scan</th><th>Tables found</th><th></th></tr></thead><tbody><!></tbody></table></div>'),gt=t.from_html('<tr><td colspan="5" class="text-center py-6 text-base-content/60">No scans yet.</td></tr>'),ft=t.from_html('<tr><td> </td><td> </td><td> </td><td> </td><td><span class="badge badge-sm"> </span></td></tr>'),mt=t.from_html('<div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Profile</th><th>Started</th><th>Duration</th><th>Tables</th><th>Status</th></tr></thead><tbody><!></tbody></table></div>'),xt=t.from_html('<div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><div class="bg-base-100 rounded-xl p-6 w-full max-w-lg"><div class="flex items-center justify-between mb-4"><h2 class="text-xl font-semibold">New connection profile</h2><button class="btn btn-ghost btn-sm btn-square"><!></button></div> <div class="space-y-3"><div><label class="label label-text">Name</label><input class="input input-bordered w-full"/></div> <div><label class="label label-text">Connection string</label><input type="password" class="input input-bordered w-full font-mono" placeholder="postgresql://user:pass@host:5432/db"/></div> <div><label class="label label-text">Schema</label><input class="input input-bordered w-full font-mono"/></div> <div><label class="label label-text">Include patterns (comma-separated)</label><input class="input input-bordered w-full font-mono text-xs" placeholder="public.users, public.orders*"/></div> <div><label class="label label-text">Exclude patterns</label><input class="input input-bordered w-full font-mono text-xs"/></div></div> <div class="flex justify-end gap-2 mt-4"><button class="btn btn-ghost">Cancel</button><button class="btn btn-primary"> </button></div></div></div>'),yt=t.from_html('<div class="p-6 space-y-4"><header class="flex items-center justify-between"><h1 class="text-2xl font-semibold flex items-center gap-2"><!> Bring Your Own Database</h1> <!></header> <!> <p class="text-sm text-base-content/70">Connect to an external PostgreSQL database, scan its schema, and surface tables as virtual collections in Zveltio.</p> <div role="tablist" class="tabs tabs-bordered"><button role="tab">Connection profiles</button> <button role="tab">Scan history</button></div> <!></div> <!>',1);function wt(l,a){var at;t.push(a,!0);const u=((at=window.__zveltio)==null?void 0:at.engineUrl)??"";let r=t.state("profiles"),v=t.state(t.proxy([])),N=t.state(t.proxy([])),n=t.state(""),_=t.state(null),f=t.state(!1),P=t.state(!1),o=t.state(t.proxy({name:"",connection_string:"",schema:"public",include_patterns:"",exclude_patterns:"pg_*,information_schema.*"}));async function S(e,s){const p=await fetch(`${u}${e}`,{credentials:"include",...s}),b=await p.json().catch(()=>({}));if(!p.ok)throw new Error(b.error||`HTTP ${p.status}`);return b}async function z(){try{const e=await S("/api/byod/scan-profiles");t.set(v,e.data??[],!0)}catch(e){t.set(n,e.message,!0)}}async function E(){try{const e=await S("/api/byod/scan-history?limit=50");t.set(N,e.data??[],!0)}catch(e){t.set(n,e.message,!0)}}async function U(){t.set(P,!0),t.set(n,"");try{await S("/api/byod/scan-profiles",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...t.get(o),include_patterns:t.get(o).include_patterns.split(",").map(e=>e.trim()).filter(Boolean),exclude_patterns:t.get(o).exclude_patterns.split(",").map(e=>e.trim()).filter(Boolean)})}),t.set(f,!1),t.set(o,{name:"",connection_string:"",schema:"public",include_patterns:"",exclude_patterns:"pg_*,information_schema.*"},!0),await z()}catch(e){t.set(n,e.message,!0)}finally{t.set(P,!1)}}async function Y(e){t.set(_,e,!0),t.set(n,"");try{await S(`/api/byod/scan-profiles/${e}/scan`,{method:"POST"}),t.set(r,"history"),await E()}catch(s){t.set(n,s.message,!0)}finally{t.set(_,null)}}async function H(e){if(confirm("Delete profile?"))try{await S(`/api/byod/scan-profiles/${e}`,{method:"DELETE"}),await z()}catch(s){t.set(n,s.message,!0)}}t.user_effect(()=>{t.get(r)==="profiles"?z():E()}),rt.onMount(z);var V=yt(),W=t.first_child(V),Z=t.child(W),F=t.child(Z),kt=t.child(F);ot(kt,{class:"h-6 w-6"}),t.next(),t.reset(F);var Nt=t.sibling(F,2);{var St=e=>{var s=pt(),p=t.child(s);ct(p,{class:"h-4 w-4"}),t.next(),t.reset(s),t.delegated("click",s,()=>t.set(f,!0)),t.append(e,s)};t.if(Nt,e=>{t.get(r)==="profiles"&&e(St)})}t.reset(Z);var G=t.sibling(Z,2);{var $t=e=>{var s=vt(),p=t.child(s,!0);t.reset(s),t.template_effect(()=>t.set_text(p,t.get(n))),t.append(e,s)};t.if(G,e=>{t.get(n)&&e($t)})}var J=t.sibling(G,4),Q=t.child(J);let K;var tt=t.sibling(Q,2);let et;t.reset(J);var Pt=t.sibling(J,2);{var jt=e=>{var s=ht(),p=t.child(s),b=t.sibling(t.child(p)),j=t.child(b);{var L=c=>{var h=_t();t.append(c,h)},T=c=>{var h=t.comment(),D=t.first_child(h);t.each(D,17,()=>t.get(v),x=>x.id,(x,i)=>{var y=bt(),m=t.child(y),O=t.child(m,!0);t.reset(m);var w=t.sibling(m),C=t.child(w,!0);t.reset(w);var k=t.sibling(w),M=t.child(k,!0);t.reset(k);var g=t.sibling(k),R=t.child(g,!0);t.reset(g);var d=t.sibling(g),$=t.child(d),q=t.child($);dt(q,{class:"h-3 w-3"});var B=t.sibling(q);t.reset($);var Ot=t.sibling($,2);t.reset(d),t.reset(y),t.template_effect(I=>{t.set_text(O,t.get(i).name),t.set_text(C,t.get(i).schema),t.set_text(M,I),t.set_text(R,t.get(i).tables_found??"—"),$.disabled=t.get(_)===t.get(i).id,t.set_text(B,` ${t.get(_)===t.get(i).id?"Scanning…":"Scan"}`)},[()=>{var I;return((I=t.get(i).last_scanned_at)==null?void 0:I.slice(0,16).replace("T"," "))??"never"}]),t.delegated("click",$,()=>Y(t.get(i).id)),t.delegated("click",Ot,()=>H(t.get(i).id)),t.append(x,y)}),t.append(c,h)};t.if(j,c=>{t.get(v).length===0?c(L):c(T,-1)})}t.reset(b),t.reset(p),t.reset(s),t.append(e,s)},Tt=e=>{var s=mt(),p=t.child(s),b=t.sibling(t.child(p)),j=t.child(b);{var L=c=>{var h=gt();t.append(c,h)},T=c=>{var h=t.comment(),D=t.first_child(h);t.each(D,17,()=>t.get(N),x=>x.id,(x,i)=>{var y=ft(),m=t.child(y),O=t.child(m,!0);t.reset(m);var w=t.sibling(m),C=t.child(w,!0);t.reset(w);var k=t.sibling(w),M=t.child(k);t.reset(k);var g=t.sibling(k),R=t.child(g,!0);t.reset(g);var d=t.sibling(g),$=t.child(d),q=t.child($,!0);t.reset($),t.reset(d),t.reset(y),t.template_effect(B=>{t.set_text(O,t.get(i).profile_name??t.get(i).profile_id),t.set_text(C,B),t.set_text(M,`${t.get(i).duration_ms??"—"??""} ms`),t.set_text(R,t.get(i).tables_count??0),t.set_text(q,t.get(i).status)},[()=>{var B;return(B=t.get(i).started_at)==null?void 0:B.slice(0,16).replace("T"," ")}]),t.append(x,y)}),t.append(c,h)};t.if(j,c=>{t.get(N).length===0?c(L):c(T,-1)})}t.reset(b),t.reset(p),t.reset(s),t.append(e,s)};t.if(Pt,e=>{t.get(r)==="profiles"?e(jt):e(Tt,-1)})}t.reset(W);var Dt=t.sibling(W,2);{var zt=e=>{var s=xt(),p=t.child(s),b=t.child(p),j=t.sibling(t.child(b)),L=t.child(j);ut(L,{class:"h-4 w-4"}),t.reset(j),t.reset(b);var T=t.sibling(b,2),c=t.child(T),h=t.sibling(t.child(c));t.remove_input_defaults(h),t.reset(c);var D=t.sibling(c,2),x=t.sibling(t.child(D));t.remove_input_defaults(x),t.reset(D);var i=t.sibling(D,2),y=t.sibling(t.child(i));t.remove_input_defaults(y),t.reset(i);var m=t.sibling(i,2),O=t.sibling(t.child(m));t.remove_input_defaults(O),t.reset(m);var w=t.sibling(m,2),C=t.sibling(t.child(w));t.remove_input_defaults(C),t.reset(w),t.reset(T);var k=t.sibling(T,2),M=t.child(k),g=t.sibling(M),R=t.child(g,!0);t.reset(g),t.reset(k),t.reset(p),t.reset(s),t.template_effect(()=>{g.disabled=t.get(P)||!t.get(o).name||!t.get(o).connection_string,t.set_text(R,t.get(P)?"Saving…":"Create")}),t.delegated("click",s,d=>d.target===d.currentTarget&&t.set(f,!1)),t.delegated("click",j,()=>t.set(f,!1)),t.bind_value(h,()=>t.get(o).name,d=>t.get(o).name=d),t.bind_value(x,()=>t.get(o).connection_string,d=>t.get(o).connection_string=d),t.bind_value(y,()=>t.get(o).schema,d=>t.get(o).schema=d),t.bind_value(O,()=>t.get(o).include_patterns,d=>t.get(o).include_patterns=d),t.bind_value(C,()=>t.get(o).exclude_patterns,d=>t.get(o).exclude_patterns=d),t.delegated("click",M,()=>t.set(f,!1)),t.delegated("click",g,U),t.append(e,s)};t.if(Dt,e=>{t.get(f)&&e(zt)})}t.template_effect(()=>{K=t.set_class(Q,1,"tab",null,K,{"tab-active":t.get(r)==="profiles"}),et=t.set_class(tt,1,"tab",null,et,{"tab-active":t.get(r)==="history"})}),t.delegated("click",Q,()=>t.set(r,"profiles")),t.delegated("click",tt,()=>t.set(r,"history")),t.append(l,V),t.pop()}t.delegate(["click"]);function X(){const l=window.__zveltio;l&&l.registerRoute({path:"byod",component:wt,label:"BYOD",icon:"DatabaseZap",category:"developer"})}return X(),X})(window.__SvelteRuntime.__unknown,window.__SvelteRuntime.internal_client,window.__SvelteRuntime.svelte);
