var ZveltioExt=(function(pe,R,V){"use strict";function A(i){const a=Object.create(null,{[Symbol.toStringTag]:{value:"Module"}});if(i){for(const n in i)if(n!=="default"){const s=Object.getOwnPropertyDescriptor(i,n);Object.defineProperty(a,n,s.get?s:{enumerable:!0,get:()=>i[n]})}}return a.default=i,Object.freeze(a)}const e=A(R);/**
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
 */const F={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"};var C=e.from_svg("<svg><!><!></svg>");function N(i,a){e.push(a,!0);const n=e.prop(a,"color",3,"currentColor"),s=e.prop(a,"size",3,24),l=e.prop(a,"strokeWidth",3,2),c=e.prop(a,"absoluteStrokeWidth",3,!1),d=e.prop(a,"iconNode",19,()=>[]),p=e.rest_props(a,["$$slots","$$events","$$legacy","name","color","size","strokeWidth","absoluteStrokeWidth","iconNode","children"]);var u=C();e.attribute_effect(u,m=>({...F,...p,width:s(),height:s(),stroke:n(),"stroke-width":m,class:["lucide-icon lucide",a.name&&`lucide-${a.name}`,a.class]}),[()=>c()?Number(l())*24/Number(s()):l()]);var w=e.child(u);e.each(w,17,d,e.index,(m,j)=>{var f=e.derived(()=>e.to_array(e.get(j),2));let _=()=>e.get(f)[0],b=()=>e.get(f)[1];var x=e.comment(),k=e.first_child(x);e.element(k,_,!0,($,M)=>{e.attribute_effect($,()=>({...b()}))}),e.append(m,x)});var y=e.sibling(w);e.snippet(y,()=>a.children??e.noop),e.reset(u),e.append(i,u),e.pop()}function T(i,a){e.push(a,!0);/**
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
 */let n=e.rest_props(a,["$$slots","$$events","$$legacy"]);const s=[["path",{d:"M18 22H4a2 2 0 0 1-2-2V6"}],["path",{d:"m22 13-1.296-1.296a2.41 2.41 0 0 0-3.408 0L11 18"}],["circle",{cx:"12",cy:"8",r:"2"}],["rect",{width:"16",height:"16",x:"6",y:"2",rx:"2"}]];N(i,e.spread_props({name:"images"},()=>n,{get iconNode(){return s},children:(l,c)=>{var d=e.comment(),p=e.first_child(d);e.snippet(p,()=>a.children??e.noop),e.append(l,d)},$$slots:{default:!0}})),e.pop()}function q(i,a){e.push(a,!0);/**
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
 */let n=e.rest_props(a,["$$slots","$$events","$$legacy"]);const s=[["path",{d:"M3 6h18"}],["path",{d:"M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"}],["path",{d:"M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"}],["line",{x1:"10",x2:"10",y1:"11",y2:"17"}],["line",{x1:"14",x2:"14",y1:"11",y2:"17"}]];N(i,e.spread_props({name:"trash-2"},()=>n,{get iconNode(){return s},children:(l,c)=>{var d=e.comment(),p=e.first_child(d);e.snippet(p,()=>a.children??e.noop),e.append(l,d)},$$slots:{default:!0}})),e.pop()}function O(i,a){e.push(a,!0);/**
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
 */let n=e.rest_props(a,["$$slots","$$events","$$legacy"]);const s=[["path",{d:"M12 3v12"}],["path",{d:"m17 8-5-5-5 5"}],["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"}]];N(i,e.spread_props({name:"upload"},()=>n,{get iconNode(){return s},children:(l,c)=>{var d=e.comment(),p=e.first_child(d);e.snippet(p,()=>a.children??e.noop),e.append(l,d)},$$slots:{default:!0}})),e.pop()}var G=e.from_html('<div class="alert alert-error"> </div>'),K=e.from_html('<img class="w-full h-full object-cover"/>'),Z=e.from_html('<div class="bg-base-100 rounded-lg shadow overflow-hidden group relative"><div class="aspect-square bg-base-200 flex items-center justify-center overflow-hidden"><!></div> <div class="p-2"><div class="text-xs truncate"> </div> <div class="text-[10px] text-base-content/60"> </div></div> <button class="btn btn-error btn-xs btn-circle absolute top-2 right-2 opacity-0 group-hover:opacity-100" title="Delete"><!></button></div>'),J=e.from_html('<div class="col-span-full text-center py-12 text-base-content/60">No media uploaded yet.</div>'),Q=e.from_html('<div class="p-6 space-y-4"><header class="flex items-center justify-between"><h1 class="text-2xl font-semibold flex items-center gap-2"><!> Media Library</h1> <label class="btn btn-primary btn-sm gap-2"><!> <input type="file" multiple="" class="hidden"/></label></header> <!> <div><!> <p class="text-sm text-base-content/60">Drag files here, or click "Upload" above.</p></div> <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3"><!> <!></div></div>');function X(i,a){var I;e.push(a,!0);const n=((I=window.__zveltio)==null?void 0:I.engineUrl)??"";let s=e.state(e.proxy([])),l=e.state(""),c=e.state(!1),d=e.state(!1);async function p(t,r){const o=await fetch(`${n}${t}`,{credentials:"include",...r}),v=await o.json().catch(()=>({}));if(!o.ok)throw new Error(v.error||`HTTP ${o.status}`);return v}async function u(){try{const t=await p("/api/media");e.set(s,t.data??t.items??[],!0)}catch(t){e.set(l,t.message,!0)}}async function w(t){if(confirm("Delete asset?"))try{await p(`/api/media/${t}`,{method:"DELETE"}),await u()}catch(r){e.set(l,r.message,!0)}}async function y(t){if(!(!t||!t.length)){e.set(d,!0),e.set(l,"");try{for(const r of Array.from(t)){const o=new FormData;o.append("file",r),await fetch(`${n}/api/storage/upload`,{method:"POST",credentials:"include",body:o}).then(async v=>{if(!v.ok)throw new Error((await v.json().catch(()=>({}))).error||"Upload failed")})}await u()}catch(r){e.set(l,r.message,!0)}finally{e.set(d,!1)}}}function m(t){return(t.mime_type??t.contentType??"").startsWith("image/")}function j(t){if(!t)return"—";const r=["B","KB","MB","GB"];let o=0;for(;t>1024&&o<r.length-1;)t/=1024,o++;return`${t.toFixed(1)} ${r[o]}`}V.onMount(u);var f=Q(),_=e.child(f),b=e.child(_),x=e.child(b);T(x,{class:"h-6 w-6"}),e.next(),e.reset(b);var k=e.sibling(b,2),$=e.child(k);O($,{class:"h-4 w-4"});var M=e.sibling($),Y=e.sibling(M);e.reset(k),e.reset(_);var W=e.sibling(_,2);{var ee=t=>{var r=G(),o=e.child(r,!0);e.reset(r),e.template_effect(()=>e.set_text(o,e.get(l))),e.append(t,r)};e.if(W,t=>{e.get(l)&&t(ee)})}var g=e.sibling(W,2);let B;var te=e.child(g);O(te,{class:"h-8 w-8 mx-auto mb-2 text-base-content/40"}),e.next(2),e.reset(g);var E=e.sibling(g,2),H=e.child(E);e.each(H,17,()=>e.get(s),t=>t.id,(t,r)=>{var o=Z(),v=e.child(o),ie=e.child(v);{var ne=h=>{var P=K();e.template_effect(()=>{e.set_attribute(P,"src",e.get(r).url??`${n}/api/media/${e.get(r).id}/raw`),e.set_attribute(P,"alt",e.get(r).filename??e.get(r).name)}),e.append(h,P)},se=e.derived(()=>m(e.get(r))),oe=h=>{T(h,{class:"h-10 w-10 text-base-content/40"})};e.if(ie,h=>{e.get(se)?h(ne):h(oe,-1)})}e.reset(v);var z=e.sibling(v,2),D=e.child(z),le=e.child(D,!0);e.reset(D);var L=e.sibling(D,2),de=e.child(L,!0);e.reset(L),e.reset(z);var S=e.sibling(z,2),ce=e.child(S);q(ce,{class:"h-3 w-3"}),e.reset(S),e.reset(o),e.template_effect(h=>{e.set_text(le,e.get(r).filename??e.get(r).name),e.set_text(de,h)},[()=>j(Number(e.get(r).size_bytes??e.get(r).size??0))]),e.delegated("click",S,()=>w(e.get(r).id)),e.append(t,o)});var re=e.sibling(H,2);{var ae=t=>{var r=J();e.append(t,r)};e.if(re,t=>{e.get(s).length===0&&t(ae)})}e.reset(E),e.reset(f),e.template_effect(()=>{e.set_text(M,` ${e.get(d)?"Uploading…":"Upload"} `),B=e.set_class(g,1,"border-2 border-dashed rounded-lg p-8 text-center transition",null,B,{"border-primary":e.get(c),"bg-primary":e.get(c),"bg-opacity-5":e.get(c)})}),e.delegated("change",Y,t=>y(t.target.files)),e.event("dragover",g,t=>{t.preventDefault(),e.set(c,!0)}),e.event("dragleave",g,()=>e.set(c,!1)),e.event("drop",g,t=>{var r;t.preventDefault(),e.set(c,!1),y(((r=t.dataTransfer)==null?void 0:r.files)??null)}),e.append(i,f),e.pop()}e.delegate(["change","click"]);function U(){const i=window.__zveltio;i&&i.registerRoute({path:"media-library",component:X,label:"Media Library",icon:"Images",category:"content"})}return U(),U})(window.__SvelteRuntime.__unknown,window.__SvelteRuntime.internal_client,window.__SvelteRuntime.svelte);
