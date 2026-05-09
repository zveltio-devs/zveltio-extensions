var ZveltioExt=(function(Ft,lt,nt){"use strict";function ot(n){const a=Object.create(null,{[Symbol.toStringTag]:{value:"Module"}});if(n){for(const v in n)if(v!=="default"){const l=Object.getOwnPropertyDescriptor(n,v);Object.defineProperty(a,v,l.get?l:{enumerable:!0,get:()=>n[v]})}}return a.default=n,Object.freeze(a)}const t=ot(lt);/**
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
 */const it={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"};var dt=t.from_svg("<svg><!><!></svg>");function W(n,a){t.push(a,!0);const v=t.prop(a,"color",3,"currentColor"),l=t.prop(a,"size",3,24),h=t.prop(a,"strokeWidth",3,2),x=t.prop(a,"absoluteStrokeWidth",3,!1),d=t.prop(a,"iconNode",19,()=>[]),u=t.rest_props(a,["$$slots","$$events","$$legacy","name","color","size","strokeWidth","absoluteStrokeWidth","iconNode","children"]);var $=dt();t.attribute_effect($,M=>({...it,...u,width:l(),height:l(),stroke:v(),"stroke-width":M,class:["lucide-icon lucide",a.name&&`lucide-${a.name}`,a.class]}),[()=>x()?Number(h())*24/Number(l()):h()]);var w=t.child($);t.each(w,17,d,t.index,(M,j)=>{var O=t.derived(()=>t.to_array(t.get(j),2));let C=()=>t.get(O)[0],R=()=>t.get(O)[1];var K=t.comment(),D=t.first_child(K);t.element(D,C,!0,(F,J)=>{t.attribute_effect(F,()=>({...R()}))}),t.append(M,K)});var L=t.sibling(w);t.snippet(L,()=>a.children??t.noop),t.reset($),t.append(n,$),t.pop()}function ct(n,a){t.push(a,!0);/**
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
 */let v=t.rest_props(a,["$$slots","$$events","$$legacy"]);const l=[["circle",{cx:"12",cy:"12",r:"10"}],["path",{d:"M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"}],["path",{d:"M2 12h20"}]];W(n,t.spread_props({name:"globe"},()=>v,{get iconNode(){return l},children:(h,x)=>{var d=t.comment(),u=t.first_child(d);t.snippet(u,()=>a.children??t.noop),t.append(h,d)},$$slots:{default:!0}})),t.pop()}function vt(n,a){t.push(a,!0);/**
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
 */let v=t.rest_props(a,["$$slots","$$events","$$legacy"]);const l=[["path",{d:"m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4"}],["path",{d:"m21 2-9.6 9.6"}],["circle",{cx:"7.5",cy:"15.5",r:"5.5"}]];W(n,t.spread_props({name:"key"},()=>v,{get iconNode(){return l},children:(h,x)=>{var d=t.comment(),u=t.first_child(d);t.snippet(u,()=>a.children??t.noop),t.append(h,d)},$$slots:{default:!0}})),t.pop()}function pt(n,a){t.push(a,!0);/**
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
 */let v=t.rest_props(a,["$$slots","$$events","$$legacy"]);const l=[["path",{d:"m5 8 6 6"}],["path",{d:"m4 14 6-6 2-3"}],["path",{d:"M2 5h12"}],["path",{d:"M7 2h1"}],["path",{d:"m22 22-5-10-5 10"}],["path",{d:"M14 18h6"}]];W(n,t.spread_props({name:"languages"},()=>v,{get iconNode(){return l},children:(h,x)=>{var d=t.comment(),u=t.first_child(d);t.snippet(u,()=>a.children??t.noop),t.append(h,d)},$$slots:{default:!0}})),t.pop()}function ht(n,a){t.push(a,!0);/**
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
 */let v=t.rest_props(a,["$$slots","$$events","$$legacy"]);const l=[["path",{d:"M5 12h14"}],["path",{d:"M12 5v14"}]];W(n,t.spread_props({name:"plus"},()=>v,{get iconNode(){return l},children:(h,x)=>{var d=t.comment(),u=t.first_child(d);t.snippet(u,()=>a.children??t.noop),t.append(h,d)},$$slots:{default:!0}})),t.pop()}function ut(n,a){t.push(a,!0);/**
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
 */let v=t.rest_props(a,["$$slots","$$events","$$legacy"]);const l=[["path",{d:"M18 6 6 18"}],["path",{d:"m6 6 12 12"}]];W(n,t.spread_props({name:"x"},()=>v,{get iconNode(){return l},children:(h,x)=>{var d=t.comment(),u=t.first_child(d);t.snippet(u,()=>a.children??t.noop),t.append(h,d)},$$slots:{default:!0}})),t.pop()}var _t=t.from_html('<button class="btn btn-primary btn-sm gap-2"><!> Add locale</button>'),gt=t.from_html('<div class="alert alert-error"> </div>'),bt=t.from_html("<option> </option>"),ft=t.from_html('<tr><td colspan="3" class="text-center py-6 text-base-content/60">No keys.</td></tr>'),mt=t.from_html('<tr><td class="font-mono text-xs"> </td><td><input class="input input-xs input-bordered w-full"/></td><td class="text-xs text-base-content/60"> </td></tr>'),yt=t.from_html('<div class="flex gap-3"><select class="select select-sm select-bordered"></select> <div class="join"><input class="input input-sm input-bordered join-item" placeholder="Search keys..."/> <button class="btn btn-sm join-item">Search</button></div></div> <div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Key</th><th>Value</th><th>Notes</th></tr></thead><tbody><!></tbody></table></div>',1),xt=t.from_html('<tr><td colspan="3" class="text-center py-6 text-base-content/60">No locales.</td></tr>'),wt=t.from_html('<tr><td class="font-mono"> </td><td> </td><td> </td></tr>'),kt=t.from_html('<div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Code</th><th>Name</th><th>Active</th></tr></thead><tbody><!></tbody></table></div>'),Nt=t.from_html('<tr><td colspan="4" class="text-center py-6 text-base-content/60">Glossary empty.</td></tr>'),$t=t.from_html('<tr><td> </td><td> </td><td><span class="badge badge-sm"> </span></td><td> </td></tr>'),jt=t.from_html('<div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Term</th><th>Translation</th><th>Locale</th><th>Context</th></tr></thead><tbody><!></tbody></table></div>'),St=t.from_html('<div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><div class="bg-base-100 rounded-xl p-6 w-full max-w-sm"><div class="flex items-center justify-between mb-4"><h2 class="text-xl font-semibold">New locale</h2><button class="btn btn-ghost btn-sm btn-square"><!></button></div> <div class="space-y-3"><div><label class="label label-text">Code (e.g. ro, en, de)</label><input class="input input-bordered w-full font-mono" maxlength="5"/></div> <div><label class="label label-text">Name</label><input class="input input-bordered w-full"/></div></div> <div class="flex justify-end gap-2 mt-4"><button class="btn btn-ghost">Cancel</button><button class="btn btn-primary"> </button></div></div></div>'),Tt=t.from_html('<div class="p-6 space-y-4"><header class="flex items-center justify-between"><h1 class="text-2xl font-semibold flex items-center gap-2"><!> Translations</h1> <!></header> <!> <div role="tablist" class="tabs tabs-bordered"><button role="tab"><!> Keys</button> <button role="tab"><!> Locales</button> <button role="tab">Glossary</button></div> <!></div> <!>',1);function Pt(n,a){var st;t.push(a,!0);const v=((st=window.__zveltio)==null?void 0:st.engineUrl)??"";let l=t.state("translations"),h=t.state(t.proxy([])),x=t.state(t.proxy([])),d=t.state(t.proxy([])),u=t.state("en"),$=t.state(""),w=t.state(""),L=t.state(!1),M=t.state(!1),j=t.state(t.proxy({code:"",name:"",is_active:!0}));async function O(e,s){const o=await fetch(`${v}${e}`,{credentials:"include",...s}),p=await o.json().catch(()=>({}));if(!o.ok)throw new Error(p.error||`HTTP ${o.status}`);return p}async function C(){try{const e=new URLSearchParams({locale:t.get(u)});t.get($)&&e.set("q",t.get($));const s=await O(`/api/translations/keys?${e}`);t.set(h,s.data??[],!0)}catch(e){t.set(w,e.message,!0)}}async function R(){try{const e=await O("/api/translations/locales");t.set(x,e.data??[],!0)}catch(e){t.set(w,e.message,!0)}}async function K(){try{const e=await O("/api/translations/glossary");t.set(d,e.data??[],!0)}catch(e){t.set(w,e.message,!0)}}async function D(e,s){try{await O("/api/translations/keys",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:e,locale:t.get(u),value:s})})}catch(o){t.set(w,o.message,!0)}}async function F(){t.set(M,!0),t.set(w,"");try{await O("/api/translations/locales",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(t.get(j))}),t.set(L,!1),t.set(j,{code:"",name:"",is_active:!0},!0),await R()}catch(e){t.set(w,e.message,!0)}finally{t.set(M,!1)}}t.user_effect(()=>{t.get(l)==="translations"?C():t.get(l)==="locales"?R():K()}),nt.onMount(()=>{C(),R()});var J=Tt(),V=t.first_child(J),B=t.child(V),H=t.child(B),Lt=t.child(H);pt(Lt,{class:"h-6 w-6"}),t.next(),t.reset(H);var Mt=t.sibling(H,2);{var Ot=e=>{var s=_t(),o=t.child(s);ht(o,{class:"h-4 w-4"}),t.next(),t.reset(s),t.delegated("click",s,()=>t.set(L,!0)),t.append(e,s)};t.if(Mt,e=>{t.get(l)==="locales"&&e(Ot)})}t.reset(B);var Q=t.sibling(B,2);{var zt=e=>{var s=gt(),o=t.child(s,!0);t.reset(s),t.template_effect(()=>t.set_text(o,t.get(w))),t.append(e,s)};t.if(Q,e=>{t.get(w)&&e(zt)})}var I=t.sibling(Q,2),A=t.child(I);let Y;var Ct=t.child(A);vt(Ct,{class:"h-4 w-4"}),t.next(),t.reset(A);var G=t.sibling(A,2);let tt;var Wt=t.child(G);ct(Wt,{class:"h-4 w-4"}),t.next(),t.reset(G);var et=t.sibling(G,2);let at;t.reset(I);var Rt=t.sibling(I,2);{var At=e=>{var s=yt(),o=t.first_child(s),p=t.child(o);t.each(p,21,()=>t.get(x),r=>r.code,(r,g)=>{var i=bt(),P=t.child(i);t.reset(i);var b={};t.template_effect(()=>{t.set_text(P,`${t.get(g).name??""} (${t.get(g).code??""})`),b!==(b=t.get(g).code)&&(i.value=(i.__value=t.get(g).code)??"")}),t.append(r,i)}),t.reset(p);var k=t.sibling(p,2),N=t.child(k);t.remove_input_defaults(N);var S=t.sibling(N,2);t.reset(k),t.reset(o);var c=t.sibling(o,2),_=t.child(c),T=t.sibling(t.child(_)),m=t.child(T);{var f=r=>{var g=ft();t.append(r,g)},y=r=>{var g=t.comment(),i=t.first_child(g);t.each(i,17,()=>t.get(h),P=>P.key,(P,b)=>{var z=mt(),q=t.child(z),U=t.child(q,!0);t.reset(q);var E=t.sibling(q),X=t.child(E);t.remove_input_defaults(X),t.reset(E);var rt=t.sibling(E),Ut=t.child(rt,!0);t.reset(rt),t.reset(z),t.template_effect(()=>{t.set_text(U,t.get(b).key),t.set_value(X,t.get(b).value??""),t.set_text(Ut,t.get(b).context??"")}),t.event("blur",X,Dt=>D(t.get(b).key,Dt.target.value)),t.append(P,z)}),t.append(r,g)};t.if(m,r=>{t.get(h).length===0?r(f):r(y,-1)})}t.reset(T),t.reset(_),t.reset(c),t.delegated("change",p,C),t.bind_select_value(p,()=>t.get(u),r=>t.set(u,r)),t.delegated("keydown",N,r=>r.key==="Enter"&&C()),t.bind_value(N,()=>t.get($),r=>t.set($,r)),t.delegated("click",S,C),t.append(e,s)},Gt=e=>{var s=kt(),o=t.child(s),p=t.sibling(t.child(o)),k=t.child(p);{var N=c=>{var _=xt();t.append(c,_)},S=c=>{var _=t.comment(),T=t.first_child(_);t.each(T,17,()=>t.get(x),m=>m.code,(m,f)=>{var y=wt(),r=t.child(y),g=t.child(r,!0);t.reset(r);var i=t.sibling(r),P=t.child(i,!0);t.reset(i);var b=t.sibling(i),z=t.child(b,!0);t.reset(b),t.reset(y),t.template_effect(()=>{t.set_text(g,t.get(f).code),t.set_text(P,t.get(f).name),t.set_text(z,t.get(f).is_active?"✓":"—")}),t.append(m,y)}),t.append(c,_)};t.if(k,c=>{t.get(x).length===0?c(N):c(S,-1)})}t.reset(p),t.reset(o),t.reset(s),t.append(e,s)},qt=e=>{var s=jt(),o=t.child(s),p=t.sibling(t.child(o)),k=t.child(p);{var N=c=>{var _=Nt();t.append(c,_)},S=c=>{var _=t.comment(),T=t.first_child(_);t.each(T,17,()=>t.get(d),m=>m.id,(m,f)=>{var y=$t(),r=t.child(y),g=t.child(r,!0);t.reset(r);var i=t.sibling(r),P=t.child(i,!0);t.reset(i);var b=t.sibling(i),z=t.child(b),q=t.child(z,!0);t.reset(z),t.reset(b);var U=t.sibling(b),E=t.child(U,!0);t.reset(U),t.reset(y),t.template_effect(()=>{t.set_text(g,t.get(f).term),t.set_text(P,t.get(f).translation),t.set_text(q,t.get(f).locale),t.set_text(E,t.get(f).context??"—")}),t.append(m,y)}),t.append(c,_)};t.if(k,c=>{t.get(d).length===0?c(N):c(S,-1)})}t.reset(p),t.reset(o),t.reset(s),t.append(e,s)};t.if(Rt,e=>{t.get(l)==="translations"?e(At):t.get(l)==="locales"?e(Gt,1):e(qt,-1)})}t.reset(V);var Et=t.sibling(V,2);{var Kt=e=>{var s=St(),o=t.child(s),p=t.child(o),k=t.sibling(t.child(p)),N=t.child(k);ut(N,{class:"h-4 w-4"}),t.reset(k),t.reset(p);var S=t.sibling(p,2),c=t.child(S),_=t.sibling(t.child(c));t.remove_input_defaults(_),t.reset(c);var T=t.sibling(c,2),m=t.sibling(t.child(T));t.remove_input_defaults(m),t.reset(T),t.reset(S);var f=t.sibling(S,2),y=t.child(f),r=t.sibling(y),g=t.child(r,!0);t.reset(r),t.reset(f),t.reset(o),t.reset(s),t.template_effect(()=>{r.disabled=t.get(M)||!t.get(j).code,t.set_text(g,t.get(M)?"Saving…":"Add")}),t.delegated("click",s,i=>i.target===i.currentTarget&&t.set(L,!1)),t.delegated("click",k,()=>t.set(L,!1)),t.bind_value(_,()=>t.get(j).code,i=>t.get(j).code=i),t.bind_value(m,()=>t.get(j).name,i=>t.get(j).name=i),t.delegated("click",y,()=>t.set(L,!1)),t.delegated("click",r,F),t.append(e,s)};t.if(Et,e=>{t.get(L)&&e(Kt)})}t.template_effect(()=>{Y=t.set_class(A,1,"tab gap-2",null,Y,{"tab-active":t.get(l)==="translations"}),tt=t.set_class(G,1,"tab gap-2",null,tt,{"tab-active":t.get(l)==="locales"}),at=t.set_class(et,1,"tab",null,at,{"tab-active":t.get(l)==="glossary"})}),t.delegated("click",A,()=>t.set(l,"translations")),t.delegated("click",G,()=>t.set(l,"locales")),t.delegated("click",et,()=>t.set(l,"glossary")),t.append(n,J),t.pop()}t.delegate(["click","change","keydown"]);function Z(){const n=window.__zveltio;n&&n.registerRoute({path:"translations",component:Pt,label:"Translations",icon:"Languages",category:"i18n"})}return Z(),Z})(window.__SvelteRuntime.__unknown,window.__SvelteRuntime.internal_client,window.__SvelteRuntime.svelte);
