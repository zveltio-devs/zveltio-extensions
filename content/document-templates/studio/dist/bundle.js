var ZveltioExt=(function(ke,ee,te){"use strict";function ae(r){const t=Object.create(null,{[Symbol.toStringTag]:{value:"Module"}});if(r){for(const o in r)if(o!=="default"){const i=Object.getOwnPropertyDescriptor(r,o);Object.defineProperty(t,o,i.get?i:{enumerable:!0,get:()=>r[o]})}}return t.default=r,Object.freeze(t)}const e=ae(ee);/**
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
 */const re={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"};var se=e.from_svg("<svg><!><!></svg>");function F(r,t){e.push(t,!0);const o=e.prop(t,"color",3,"currentColor"),i=e.prop(t,"size",3,24),d=e.prop(t,"strokeWidth",3,2),v=e.prop(t,"absoluteStrokeWidth",3,!1),n=e.prop(t,"iconNode",19,()=>[]),c=e.rest_props(t,["$$slots","$$events","$$legacy","name","color","size","strokeWidth","absoluteStrokeWidth","iconNode","children"]);var s=se();e.attribute_effect(s,k=>({...re,...c,width:i(),height:i(),stroke:o(),"stroke-width":k,class:["lucide-icon lucide",t.name&&`lucide-${t.name}`,t.class]}),[()=>v()?Number(d())*24/Number(i()):d()]);var _=e.child(s);e.each(_,17,n,e.index,(k,H)=>{var P=e.derived(()=>e.to_array(e.get(H),2));let C=()=>e.get(P)[0],N=()=>e.get(P)[1];var f=e.comment(),$=e.first_child(f);e.element($,C,!0,(W,O)=>{e.attribute_effect(W,()=>({...N()}))}),e.append(k,f)});var T=e.sibling(_);e.snippet(T,()=>t.children??e.noop),e.reset(s),e.append(r,s),e.pop()}function ie(r,t){e.push(t,!0);/**
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
 */let o=e.rest_props(t,["$$slots","$$events","$$legacy"]);const i=[["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4"}],["path",{d:"M9 13v-1h6v1"}],["path",{d:"M12 12v6"}],["path",{d:"M11 18h2"}]];F(r,e.spread_props({name:"file-type"},()=>o,{get iconNode(){return i},children:(d,v)=>{var n=e.comment(),c=e.first_child(n);e.snippet(c,()=>t.children??e.noop),e.append(d,n)},$$slots:{default:!0}})),e.pop()}function ne(r,t){e.push(t,!0);/**
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
 */let o=e.rest_props(t,["$$slots","$$events","$$legacy"]);const i=[["path",{d:"M5 12h14"}],["path",{d:"M12 5v14"}]];F(r,e.spread_props({name:"plus"},()=>o,{get iconNode(){return i},children:(d,v)=>{var n=e.comment(),c=e.first_child(n);e.snippet(c,()=>t.children??e.noop),e.append(d,n)},$$slots:{default:!0}})),e.pop()}function le(r,t){e.push(t,!0);/**
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
 */let o=e.rest_props(t,["$$slots","$$events","$$legacy"]);const i=[["path",{d:"M18 6 6 18"}],["path",{d:"m6 6 12 12"}]];F(r,e.spread_props({name:"x"},()=>o,{get iconNode(){return i},children:(d,v)=>{var n=e.comment(),c=e.first_child(n);e.snippet(c,()=>t.children??e.noop),e.append(d,n)},$$slots:{default:!0}})),e.pop()}var oe=e.from_html('<div class="alert alert-error"> </div>'),de=e.from_html('<tr><td colspan="4" class="text-center py-6 text-base-content/60">No templates.</td></tr>'),ce=e.from_html('<tr><td> </td><td><span class="badge badge-ghost badge-sm"> </span></td><td class="max-w-xs truncate"> </td><td><button class="btn btn-ghost btn-xs">Edit</button></td></tr>'),ve=e.from_html('<div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><div class="bg-base-100 rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto"><div class="flex items-center justify-between mb-4"><h2 class="text-xl font-semibold"> </h2><button class="btn btn-ghost btn-sm btn-square"><!></button></div> <div class="space-y-3"><div class="grid grid-cols-2 gap-3"><div><label class="label label-text">Name</label><input class="input input-bordered w-full"/></div> <div><label class="label label-text">Format</label><select class="select select-bordered w-full"><option>HTML (PDF)</option><option>DOCX</option><option>Markdown</option></select></div></div> <div><label class="label label-text">Description</label><input class="input input-bordered w-full"/></div> <div><label class="label label-text">Body — use <code class="text-xs"></code> for substitution</label> <textarea class="textarea textarea-bordered w-full font-mono text-xs" rows="14"></textarea></div></div> <div class="flex justify-end gap-2 mt-4"><button class="btn btn-ghost">Cancel</button><button class="btn btn-primary"> </button></div></div></div>'),pe=e.from_html('<div class="p-6 space-y-4"><header class="flex items-center justify-between"><h1 class="text-2xl font-semibold flex items-center gap-2"><!> Document Templates</h1> <button class="btn btn-primary btn-sm gap-2"><!> New template</button></header> <!> <div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Name</th><th>Format</th><th>Description</th><th></th></tr></thead><tbody><!></tbody></table></div></div> <!>',1);function ue(r,t){var q;e.push(t,!0);const o=((q=window.__zveltio)==null?void 0:q.engineUrl)??"";let i=e.state(e.proxy([])),d=e.state(""),v=e.state(!1),n=e.state(!1),c=e.state(null),s=e.state(e.proxy({name:"",description:"",format:"html",body:`<h1>{{title}}</h1>
<p>Hello {{client_name}}</p>`}));async function _(a,l){const p=await fetch(`${o}${a}`,{credentials:"include",...l}),u=await p.json().catch(()=>({}));if(!p.ok)throw new Error(u.error||`HTTP ${p.status}`);return u}async function T(){try{const a=await _("/api/document-templates");e.set(i,a.data??[],!0)}catch(a){e.set(d,a.message,!0)}}function k(){e.set(c,null),e.set(s,{name:"",description:"",format:"html",body:`<h1>{{title}}</h1>
<p>Hello {{client_name}}</p>`},!0),e.set(v,!0)}function H(a){e.set(c,a,!0),e.set(s,{name:a.name,description:a.description??"",format:a.format,body:a.body},!0),e.set(v,!0)}async function P(){e.set(n,!0),e.set(d,"");try{e.get(c)?await _(`/api/document-templates/${e.get(c).id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(e.get(s))}):await _("/api/document-templates",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(e.get(s))}),e.set(v,!1),await T()}catch(a){e.set(d,a.message,!0)}finally{e.set(n,!1)}}te.onMount(T);var C=pe(),N=e.first_child(C),f=e.child(N),$=e.child(f),W=e.child($);ie(W,{class:"h-6 w-6"}),e.next(),e.reset($);var O=e.sibling($,2),he=e.child(O);ne(he,{class:"h-4 w-4"}),e.next(),e.reset(O),e.reset(f);var U=e.sibling(f,2);{var be=a=>{var l=oe(),p=e.child(l,!0);e.reset(l),e.template_effect(()=>e.set_text(p,e.get(d))),e.append(a,l)};e.if(U,a=>{e.get(d)&&a(be)})}var V=e.sibling(U,2),X=e.child(V),Z=e.sibling(e.child(X)),ge=e.child(Z);{var me=a=>{var l=de();e.append(a,l)},_e=a=>{var l=e.comment(),p=e.first_child(l);e.each(p,17,()=>e.get(i),u=>u.id,(u,b)=>{var j=ce(),g=e.child(j),E=e.child(g,!0);e.reset(g);var m=e.sibling(g),x=e.child(m),S=e.child(x,!0);e.reset(x),e.reset(m);var w=e.sibling(m),z=e.child(w,!0);e.reset(w);var y=e.sibling(w),M=e.child(y);e.reset(y),e.reset(j),e.template_effect(()=>{e.set_text(E,e.get(b).name),e.set_text(S,e.get(b).format),e.set_text(z,e.get(b).description??"—")}),e.delegated("click",M,()=>H(e.get(b))),e.append(u,j)}),e.append(a,l)};e.if(ge,a=>{e.get(i).length===0?a(me):a(_e,-1)})}e.reset(Z),e.reset(X),e.reset(V),e.reset(N);var fe=e.sibling(N,2);{var xe=a=>{var l=ve(),p=e.child(l),u=e.child(p),b=e.child(u),j=e.child(b);e.reset(b);var g=e.sibling(b),E=e.child(g);le(E,{class:"h-4 w-4"}),e.reset(g),e.reset(u);var m=e.sibling(u,2),x=e.child(m),S=e.child(x),w=e.sibling(e.child(S));e.remove_input_defaults(w),e.reset(S);var z=e.sibling(S,2),y=e.sibling(e.child(z)),M=e.child(y);M.value=M.__value="html";var R=e.sibling(M);R.value=R.__value="docx";var I=e.sibling(R);I.value=I.__value="markdown",e.reset(y),e.reset(z),e.reset(x);var A=e.sibling(x,2),L=e.sibling(e.child(A));e.remove_input_defaults(L),e.reset(A);var G=e.sibling(A,2),B=e.child(G),we=e.sibling(e.child(B));we.textContent="{{var_name}}",e.next(),e.reset(B);var K=e.sibling(B,2);e.remove_textarea_child(K),e.reset(G),e.reset(m);var Q=e.sibling(m,2),Y=e.child(Q),D=e.sibling(Y),ye=e.child(D,!0);e.reset(D),e.reset(Q),e.reset(p),e.reset(l),e.template_effect(()=>{e.set_text(j,`${e.get(c)?"Edit":"New"} template`),D.disabled=e.get(n)||!e.get(s).name,e.set_text(ye,e.get(n)?"Saving…":"Save")}),e.delegated("click",l,h=>h.target===h.currentTarget&&e.set(v,!1)),e.delegated("click",g,()=>e.set(v,!1)),e.bind_value(w,()=>e.get(s).name,h=>e.get(s).name=h),e.bind_select_value(y,()=>e.get(s).format,h=>e.get(s).format=h),e.bind_value(L,()=>e.get(s).description,h=>e.get(s).description=h),e.bind_value(K,()=>e.get(s).body,h=>e.get(s).body=h),e.delegated("click",Y,()=>e.set(v,!1)),e.delegated("click",D,P),e.append(a,l)};e.if(fe,a=>{e.get(v)&&a(xe)})}e.delegated("click",O,k),e.append(r,C),e.pop()}e.delegate(["click"]);function J(){const r=window.__zveltio;r&&r.registerRoute({path:"document-templates",component:ue,label:"Document Templates",icon:"FileType",category:"content"})}return J(),J})(window.__SvelteRuntime.__unknown,window.__SvelteRuntime.internal_client,window.__SvelteRuntime.svelte);
