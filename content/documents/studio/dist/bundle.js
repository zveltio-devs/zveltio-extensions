var ZveltioExt=(function(Ne,ee,te){"use strict";function ae(r){const a=Object.create(null,{[Symbol.toStringTag]:{value:"Module"}});if(r){for(const l in r)if(l!=="default"){const s=Object.getOwnPropertyDescriptor(r,l);Object.defineProperty(a,l,s.get?s:{enumerable:!0,get:()=>r[l]})}}return a.default=r,Object.freeze(a)}const e=ae(ee);/**
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
 */const re={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"};var se=e.from_svg("<svg><!><!></svg>");function R(r,a){e.push(a,!0);const l=e.prop(a,"color",3,"currentColor"),s=e.prop(a,"size",3,24),v=e.prop(a,"strokeWidth",3,2),p=e.prop(a,"absoluteStrokeWidth",3,!1),n=e.prop(a,"iconNode",19,()=>[]),o=e.rest_props(a,["$$slots","$$events","$$legacy","name","color","size","strokeWidth","absoluteStrokeWidth","iconNode","children"]);var _=se();e.attribute_effect(_,b=>({...re,...o,width:s(),height:s(),stroke:l(),"stroke-width":b,class:["lucide-icon lucide",a.name&&`lucide-${a.name}`,a.class]}),[()=>p()?Number(v())*24/Number(s()):v()]);var d=e.child(_);e.each(d,17,n,e.index,(b,F)=>{var U=e.derived(()=>e.to_array(e.get(F),2));let J=()=>e.get(U)[0],C=()=>e.get(U)[1];var w=e.comment(),S=e.first_child(w);e.element(S,J,!0,(j,Z)=>{e.attribute_effect(j,()=>({...C()}))}),e.append(b,w)});var N=e.sibling(d);e.snippet(N,()=>a.children??e.noop),e.reset(_),e.append(r,_),e.pop()}function ne(r,a){e.push(a,!0);/**
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
 */let l=e.rest_props(a,["$$slots","$$events","$$legacy"]);const s=[["path",{d:"M12 15V3"}],["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"}],["path",{d:"m7 10 5 5 5-5"}]];R(r,e.spread_props({name:"download"},()=>l,{get iconNode(){return s},children:(v,p)=>{var n=e.comment(),o=e.first_child(n);e.snippet(o,()=>a.children??e.noop),e.append(v,n)},$$slots:{default:!0}})),e.pop()}function le(r,a){e.push(a,!0);/**
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
 */let l=e.rest_props(a,["$$slots","$$events","$$legacy"]);const s=[["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4"}],["path",{d:"M10 9H8"}],["path",{d:"M16 13H8"}],["path",{d:"M16 17H8"}]];R(r,e.spread_props({name:"file-text"},()=>l,{get iconNode(){return s},children:(v,p)=>{var n=e.comment(),o=e.first_child(n);e.snippet(o,()=>a.children??e.noop),e.append(v,n)},$$slots:{default:!0}})),e.pop()}function ie(r,a){e.push(a,!0);/**
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
 */let l=e.rest_props(a,["$$slots","$$events","$$legacy"]);const s=[["path",{d:"M5 12h14"}],["path",{d:"M12 5v14"}]];R(r,e.spread_props({name:"plus"},()=>l,{get iconNode(){return s},children:(v,p)=>{var n=e.comment(),o=e.first_child(n);e.snippet(o,()=>a.children??e.noop),e.append(v,n)},$$slots:{default:!0}})),e.pop()}function oe(r,a){e.push(a,!0);/**
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
 */let l=e.rest_props(a,["$$slots","$$events","$$legacy"]);const s=[["path",{d:"M18 6 6 18"}],["path",{d:"m6 6 12 12"}]];R(r,e.spread_props({name:"x"},()=>l,{get iconNode(){return s},children:(v,p)=>{var n=e.comment(),o=e.first_child(n);e.snippet(o,()=>a.children??e.noop),e.append(v,n)},$$slots:{default:!0}})),e.pop()}var de=e.from_html('<div class="alert alert-error"> </div>'),ce=e.from_html('<tr><td colspan="5" class="text-center py-6 text-base-content/60">No documents yet. Use "Generate" with a template.</td></tr>'),ve=e.from_html('<tr><td> </td><td> </td><td> </td><td><span class="badge badge-ghost badge-sm"> </span></td><td><a class="btn btn-ghost btn-xs gap-1" target="_blank"><!></a></td></tr>'),pe=e.from_html("<option> </option>"),ue=e.from_html('<div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><div class="bg-base-100 rounded-xl p-6 w-full max-w-md"><div class="flex items-center justify-between mb-4"><h2 class="text-xl font-semibold">Generate document</h2><button class="btn btn-ghost btn-sm btn-square"><!></button></div> <div class="space-y-3"><div><label class="label label-text">Template</label> <select class="select select-bordered w-full"><option>— Select template —</option><!></select></div> <div><label class="label label-text">Document name</label><input class="input input-bordered w-full"/></div> <div><label class="label label-text">Variables (JSON)</label><textarea class="textarea textarea-bordered w-full font-mono text-xs" rows="6"></textarea></div></div> <div class="flex justify-end gap-2 mt-4"><button class="btn btn-ghost">Cancel</button><button class="btn btn-primary"> </button></div></div></div>'),he=e.from_html('<div class="p-6 space-y-4"><header class="flex items-center justify-between"><h1 class="text-2xl font-semibold flex items-center gap-2"><!> Documents</h1> <button class="btn btn-primary btn-sm gap-2"><!> Generate document</button></header> <!> <div class="join"><input class="input input-sm input-bordered join-item" placeholder="Search..."/> <button class="btn btn-sm join-item">Search</button></div> <div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Name</th><th>Template</th><th>Generated</th><th>Format</th><th></th></tr></thead><tbody><!></tbody></table></div></div> <!>',1);function _e(r,a){var Q;e.push(a,!0);const l=((Q=window.__zveltio)==null?void 0:Q.engineUrl)??"";let s=e.state(e.proxy([])),v=e.state(e.proxy([])),p=e.state(""),n=e.state(""),o=e.state(!1),_=e.state(!1),d=e.state(e.proxy({template_id:"",name:"",variables:"{}"}));async function N(t,i){const u=await fetch(`${l}${t}`,{credentials:"include",...i}),h=await u.json().catch(()=>({}));if(!u.ok)throw new Error(h.error||`HTTP ${u.status}`);return h}async function b(){try{const t=new URLSearchParams;e.get(n)&&t.set("q",e.get(n));const i=await N(`/api/documents?${t}`);e.set(s,i.data??[],!0)}catch(t){e.set(p,t.message,!0)}}async function F(){try{const t=await N("/api/document-templates");e.set(v,t.data??[],!0)}catch{}}async function U(){e.set(_,!0),e.set(p,"");try{let t={};try{t=JSON.parse(e.get(d).variables)}catch{throw new Error("Invalid JSON in variables")}await N("/api/documents",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...e.get(d),variables:t})}),e.set(o,!1),e.set(d,{template_id:"",name:"",variables:"{}"},!0),await b()}catch(t){e.set(p,t.message,!0)}finally{e.set(_,!1)}}te.onMount(()=>{b(),F()});function J(t){return`${l}/api/documents/${t}/download`}var C=he(),w=e.first_child(C),S=e.child(w),j=e.child(S),Z=e.child(j);le(Z,{class:"h-6 w-6"}),e.next(),e.reset(j);var V=e.sibling(j,2),me=e.child(V);ie(me,{class:"h-4 w-4"}),e.next(),e.reset(V),e.reset(S);var B=e.sibling(S,2);{var be=t=>{var i=de(),u=e.child(i,!0);e.reset(i),e.template_effect(()=>e.set_text(u,e.get(p))),e.append(t,i)};e.if(B,t=>{e.get(p)&&t(be)})}var q=e.sibling(B,2),E=e.child(q);e.remove_input_defaults(E);var ge=e.sibling(E,2);e.reset(q);var L=e.sibling(q,2),X=e.child(L),K=e.sibling(e.child(X)),fe=e.child(K);{var we=t=>{var i=ce();e.append(t,i)},xe=t=>{var i=e.comment(),u=e.first_child(i);e.each(u,17,()=>e.get(s),h=>h.id,(h,m)=>{var M=ve(),g=e.child(M),P=e.child(g,!0);e.reset(g);var f=e.sibling(g),T=e.child(f,!0);e.reset(f);var O=e.sibling(f),z=e.child(O,!0);e.reset(O);var x=e.sibling(O),D=e.child(x),G=e.child(D,!0);e.reset(D),e.reset(x);var H=e.sibling(x),y=e.child(H),k=e.child(y);ne(k,{class:"h-3 w-3"}),e.reset(y),e.reset(H),e.reset(M),e.template_effect(($,c)=>{e.set_text(P,e.get(m).name),e.set_text(T,e.get(m).template_name??"—"),e.set_text(z,$),e.set_text(G,e.get(m).format??"pdf"),e.set_attribute(y,"href",c)},[()=>{var $;return($=e.get(m).created_at)==null?void 0:$.slice(0,16).replace("T"," ")},()=>J(e.get(m).id)]),e.append(h,M)}),e.append(t,i)};e.if(fe,t=>{e.get(s).length===0?t(we):t(xe,-1)})}e.reset(K),e.reset(X),e.reset(L),e.reset(w);var ye=e.sibling(w,2);{var ke=t=>{var i=ue(),u=e.child(i),h=e.child(u),m=e.sibling(e.child(h)),M=e.child(m);oe(M,{class:"h-4 w-4"}),e.reset(m),e.reset(h);var g=e.sibling(h,2),P=e.child(g),f=e.sibling(e.child(P),2),T=e.child(f);T.value=T.__value="";var O=e.sibling(T);e.each(O,17,()=>e.get(v),c=>c.id,(c,A)=>{var W=pe(),$e=e.child(W,!0);e.reset(W);var Y={};e.template_effect(()=>{e.set_text($e,e.get(A).name),Y!==(Y=e.get(A).id)&&(W.value=(W.__value=e.get(A).id)??"")}),e.append(c,W)}),e.reset(f),e.reset(P);var z=e.sibling(P,2),x=e.sibling(e.child(z));e.remove_input_defaults(x),e.reset(z);var D=e.sibling(z,2),G=e.sibling(e.child(D));e.remove_textarea_child(G),e.set_attribute(G,"placeholder",'{"client_name":"Acme","amount":1000}'),e.reset(D),e.reset(g);var H=e.sibling(g,2),y=e.child(H),k=e.sibling(y),$=e.child(k,!0);e.reset(k),e.reset(H),e.reset(u),e.reset(i),e.template_effect(()=>{k.disabled=e.get(_)||!e.get(d).template_id||!e.get(d).name,e.set_text($,e.get(_)?"Generating…":"Generate")}),e.delegated("click",i,c=>c.target===c.currentTarget&&e.set(o,!1)),e.delegated("click",m,()=>e.set(o,!1)),e.bind_select_value(f,()=>e.get(d).template_id,c=>e.get(d).template_id=c),e.bind_value(x,()=>e.get(d).name,c=>e.get(d).name=c),e.bind_value(G,()=>e.get(d).variables,c=>e.get(d).variables=c),e.delegated("click",y,()=>e.set(o,!1)),e.delegated("click",k,U),e.append(t,i)};e.if(ye,t=>{e.get(o)&&t(ke)})}e.delegated("click",V,()=>e.set(o,!0)),e.delegated("keydown",E,t=>t.key==="Enter"&&b()),e.bind_value(E,()=>e.get(n),t=>e.set(n,t)),e.delegated("click",ge,b),e.append(r,C),e.pop()}e.delegate(["click","keydown"]);function I(){const r=window.__zveltio;r&&r.registerRoute({path:"documents",component:_e,label:"Documents",icon:"FileText",category:"content"})}return I(),I})(window.__SvelteRuntime.__unknown,window.__SvelteRuntime.internal_client,window.__SvelteRuntime.svelte);
