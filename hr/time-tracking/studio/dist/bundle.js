var ZveltioExt=(function(ht,U,F){"use strict";function H(o){const r=Object.create(null,{[Symbol.toStringTag]:{value:"Module"}});if(o){for(const s in o)if(s!=="default"){const n=Object.getOwnPropertyDescriptor(o,s);Object.defineProperty(r,s,n.get?n:{enumerable:!0,get:()=>o[s]})}}return r.default=o,Object.freeze(r)}const t=H(U);/**
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
 */const I={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"};var J=t.from_svg("<svg><!><!></svg>");function O(o,r){t.push(r,!0);const s=t.prop(r,"color",3,"currentColor"),n=t.prop(r,"size",3,24),u=t.prop(r,"strokeWidth",3,2),_=t.prop(r,"absoluteStrokeWidth",3,!1),l=t.prop(r,"iconNode",19,()=>[]),c=t.rest_props(r,["$$slots","$$events","$$legacy","name","color","size","strokeWidth","absoluteStrokeWidth","iconNode","children"]);var v=J();t.attribute_effect(v,j=>({...I,...c,width:n(),height:n(),stroke:s(),"stroke-width":j,class:["lucide-icon lucide",r.name&&`lucide-${r.name}`,r.class]}),[()=>_()?Number(u())*24/Number(n()):u()]);var b=t.child(v);t.each(b,17,l,t.index,(j,z)=>{var P=t.derived(()=>t.to_array(t.get(z),2));let S=()=>t.get(P)[0],T=()=>t.get(P)[1];var N=t.comment(),D=t.first_child(N);t.element(D,S,!0,($,M)=>{t.attribute_effect($,()=>({...T()}))}),t.append(j,N)});var k=t.sibling(b);t.snippet(k,()=>r.children??t.noop),t.reset(v),t.append(o,v),t.pop()}function V(o,r){t.push(r,!0);/**
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
 */let s=t.rest_props(r,["$$slots","$$events","$$legacy"]);const n=[["circle",{cx:"12",cy:"12",r:"10"}],["polyline",{points:"12 6 12 12 16 14"}]];O(o,t.spread_props({name:"clock"},()=>s,{get iconNode(){return n},children:(u,_)=>{var l=t.comment(),c=t.first_child(l);t.snippet(c,()=>r.children??t.noop),t.append(u,l)},$$slots:{default:!0}})),t.pop()}function Z(o,r){t.push(r,!0);/**
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
 */let s=t.rest_props(r,["$$slots","$$events","$$legacy"]);const n=[["polygon",{points:"6 3 20 12 6 21 6 3"}]];O(o,t.spread_props({name:"play"},()=>s,{get iconNode(){return n},children:(u,_)=>{var l=t.comment(),c=t.first_child(l);t.snippet(c,()=>r.children??t.noop),t.append(u,l)},$$slots:{default:!0}})),t.pop()}function G(o,r){t.push(r,!0);/**
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
 */let s=t.rest_props(r,["$$slots","$$events","$$legacy"]);const n=[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2"}]];O(o,t.spread_props({name:"square"},()=>s,{get iconNode(){return n},children:(u,_)=>{var l=t.comment(),c=t.first_child(l);t.snippet(c,()=>r.children??t.noop),t.append(u,l)},$$slots:{default:!0}})),t.pop()}var K=t.from_html('<div class="alert alert-error"> </div>'),Q=t.from_html('<div class="flex items-center justify-between"><div><div class="text-xs text-base-content/60">Tracking now</div> <div class="font-medium"> </div> <div class="text-xs text-base-content/60"> </div></div> <button class="btn btn-error btn-sm gap-2"><!> Stop timer</button></div>'),X=t.from_html("<option> </option>"),Y=t.from_html('<div class="grid grid-cols-1 md:grid-cols-3 gap-3"><select class="select select-bordered w-full"><option>— Project —</option><!></select> <input class="input input-bordered w-full md:col-span-1" placeholder="What are you working on?"/> <button class="btn btn-primary gap-2"><!> Start timer</button></div>'),tt=t.from_html('<tr><td colspan="5" class="text-center py-6 text-base-content/60">Loading…</td></tr>'),et=t.from_html('<tr><td colspan="5" class="text-center py-6 text-base-content/60">No time entries.</td></tr>'),rt=t.from_html("<tr><td> </td><td> </td><td> </td><td> </td><td> </td></tr>"),it=t.from_html('<div class="p-6 space-y-4"><header class="flex items-center justify-between"><h1 class="text-2xl font-semibold flex items-center gap-2"><!> Time Tracking</h1></header> <!> <div class="bg-base-100 rounded-lg shadow p-4"><!></div> <div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Date</th><th>Project</th><th>Description</th><th>Duration</th><th>Billable</th></tr></thead><tbody><!></tbody></table></div></div>');function at(o,r){var E;t.push(r,!0);const s=((E=window.__zveltio)==null?void 0:E.engineUrl)??"";let n=t.state(t.proxy([])),u=t.state(t.proxy([])),_=t.state(null),l=t.state(!1),c=t.state(""),v=t.state(t.proxy({project_id:"",description:""}));async function b(e,i){const a=await fetch(`${s}${e}`,{credentials:"include",...i}),d=await a.json().catch(()=>({}));if(!a.ok)throw new Error(d.error||`HTTP ${a.status}`);return d}async function k(){t.set(l,!0),t.set(c,"");try{const[e,i,a]=await Promise.all([b("/api/time/entries?limit=50"),b("/api/time/projects"),b("/api/time/timer/active").catch(()=>({data:null}))]);t.set(n,e.data??[],!0),t.set(u,i.data??[],!0),t.set(_,a.data,!0)}catch(e){t.set(c,e.message,!0)}finally{t.set(l,!1)}}async function j(){try{await b("/api/time/timer/start",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(t.get(v))}),t.set(v,{project_id:"",description:""},!0),await k()}catch(e){t.set(c,e.message,!0)}}async function z(){try{await b("/api/time/timer/stop",{method:"POST"}),await k()}catch(e){t.set(c,e.message,!0)}}function P(e){const i=Math.floor(e/60),a=e%60;return`${i}h ${String(a).padStart(2,"0")}m`}F.onMount(k);var S=it(),T=t.child(S),N=t.child(T),D=t.child(N);V(D,{class:"h-6 w-6"}),t.next(),t.reset(N),t.reset(T);var $=t.sibling(T,2);{var M=e=>{var i=K(),a=t.child(i,!0);t.reset(i),t.template_effect(()=>t.set_text(a,t.get(c))),t.append(e,i)};t.if($,e=>{t.get(c)&&e(M)})}var W=t.sibling($,2),ot=t.child(W);{var nt=e=>{var i=Q(),a=t.child(i),d=t.sibling(t.child(a),2),m=t.child(d,!0);t.reset(d);var h=t.sibling(d,2),g=t.child(h);t.reset(h),t.reset(a);var x=t.sibling(a,2),p=t.child(x);G(p,{class:"h-4 w-4"}),t.next(),t.reset(x),t.reset(i),t.template_effect(w=>{t.set_text(m,t.get(_).description||t.get(_).project_name||"(no description)"),t.set_text(g,`Started: ${w??""}`)},[()=>new Date(t.get(_).started_at).toLocaleString()]),t.delegated("click",x,z),t.append(e,i)},st=e=>{var i=Y(),a=t.child(i),d=t.child(a);d.value=d.__value="";var m=t.sibling(d);t.each(m,17,()=>t.get(u),p=>p.id,(p,w)=>{var f=X(),C=t.child(f,!0);t.reset(f);var y={};t.template_effect(()=>{t.set_text(C,t.get(w).name),y!==(y=t.get(w).id)&&(f.value=(f.__value=t.get(w).id)??"")}),t.append(p,f)}),t.reset(a);var h=t.sibling(a,2);t.remove_input_defaults(h);var g=t.sibling(h,2),x=t.child(g);Z(x,{class:"h-4 w-4"}),t.next(),t.reset(g),t.reset(i),t.template_effect(()=>g.disabled=!t.get(v).project_id),t.bind_select_value(a,()=>t.get(v).project_id,p=>t.get(v).project_id=p),t.bind_value(h,()=>t.get(v).description,p=>t.get(v).description=p),t.delegated("click",g,j),t.append(e,i)};t.if(ot,e=>{t.get(_)?e(nt):e(st,-1)})}t.reset(W);var q=t.sibling(W,2),A=t.child(q),B=t.sibling(t.child(A)),lt=t.child(B);{var ct=e=>{var i=tt();t.append(e,i)},dt=e=>{var i=et();t.append(e,i)},pt=e=>{var i=t.comment(),a=t.first_child(i);t.each(a,17,()=>t.get(n),d=>d.id,(d,m)=>{var h=rt(),g=t.child(h),x=t.child(g,!0);t.reset(g);var p=t.sibling(g),w=t.child(p,!0);t.reset(p);var f=t.sibling(p),C=t.child(f,!0);t.reset(f);var y=t.sibling(f),vt=t.child(y,!0);t.reset(y);var L=t.sibling(y),ut=t.child(L,!0);t.reset(L),t.reset(h),t.template_effect(_t=>{t.set_text(x,t.get(m).date),t.set_text(w,t.get(m).project_name??"—"),t.set_text(C,t.get(m).description??"—"),t.set_text(vt,_t),t.set_text(ut,t.get(m).billable?"✓":"")},[()=>P(Number(t.get(m).minutes??0))]),t.append(d,h)}),t.append(e,i)};t.if(lt,e=>{t.get(l)?e(ct):t.get(n).length===0?e(dt,1):e(pt,-1)})}t.reset(B),t.reset(A),t.reset(q),t.reset(S),t.append(o,S),t.pop()}t.delegate(["click"]);function R(){const o=window.__zveltio;o&&o.registerRoute({path:"hr-time-tracking",component:at,label:"Time Tracking",icon:"Clock",category:"hr"})}return R(),R})(window.__SvelteRuntime.__unknown,window.__SvelteRuntime.internal_client,window.__SvelteRuntime.svelte);
