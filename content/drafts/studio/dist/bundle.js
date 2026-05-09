var ZveltioExt=(function(at,H,U){"use strict";function A(a){const e=Object.create(null,{[Symbol.toStringTag]:{value:"Module"}});if(a){for(const o in a)if(o!=="default"){const n=Object.getOwnPropertyDescriptor(a,o);Object.defineProperty(e,o,n.get?n:{enumerable:!0,get:()=>a[o]})}}return e.default=a,Object.freeze(e)}const t=A(H);/**
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
 */const F={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"};var V=t.from_svg("<svg><!><!></svg>");function M(a,e){t.push(e,!0);const o=t.prop(e,"color",3,"currentColor"),n=t.prop(e,"size",3,24),i=t.prop(e,"strokeWidth",3,2),l=t.prop(e,"absoluteStrokeWidth",3,!1),d=t.prop(e,"iconNode",19,()=>[]),c=t.rest_props(e,["$$slots","$$events","$$legacy","name","color","size","strokeWidth","absoluteStrokeWidth","iconNode","children"]);var p=V();t.attribute_effect(p,f=>({...F,...c,width:n(),height:n(),stroke:o(),"stroke-width":f,class:["lucide-icon lucide",e.name&&`lucide-${e.name}`,e.class]}),[()=>l()?Number(i())*24/Number(n()):i()]);var v=t.child(p);t.each(v,17,d,t.index,(f,N)=>{var b=t.derived(()=>t.to_array(t.get(N),2));let P=()=>t.get(b)[0],w=()=>t.get(b)[1];var m=t.comment(),x=t.first_child(m);t.element(x,P,!0,(S,T)=>{t.attribute_effect(S,()=>({...w()}))}),t.append(f,m)});var _=t.sibling(v);t.snippet(_,()=>e.children??t.noop),t.reset(p),t.append(a,p),t.pop()}function B(a,e){t.push(e,!0);/**
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
 */let o=t.rest_props(e,["$$slots","$$events","$$legacy"]);const n=[["path",{d:"M12.5 22H18a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v9.5"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4"}],["path",{d:"M13.378 15.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"}]];M(a,t.spread_props({name:"file-pen"},()=>o,{get iconNode(){return n},children:(i,l)=>{var d=t.comment(),c=t.first_child(d);t.snippet(c,()=>e.children??t.noop),t.append(i,d)},$$slots:{default:!0}})),t.pop()}function I(a,e){t.push(e,!0);/**
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
 */let o=t.rest_props(e,["$$slots","$$events","$$legacy"]);const n=[["path",{d:"M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"}],["path",{d:"m21.854 2.147-10.94 10.939"}]];M(a,t.spread_props({name:"send"},()=>o,{get iconNode(){return n},children:(i,l)=>{var d=t.comment(),c=t.first_child(d);t.snippet(c,()=>e.children??t.noop),t.append(i,d)},$$slots:{default:!0}})),t.pop()}var L=t.from_html('<div class="alert alert-error"> </div>'),Z=t.from_html('<tr><td colspan="5" class="text-center py-6 text-base-content/60">No pending drafts.</td></tr>'),q=t.from_html('<tr><td><span class="badge badge-ghost"> </span></td><td class="font-mono text-xs"> </td><td> </td><td> </td><td><button class="btn btn-success btn-xs gap-1"><!> Publish</button> <button class="btn btn-ghost btn-xs">Discard</button></td></tr>'),G=t.from_html('<div class="p-6 space-y-4"><header><h1 class="text-2xl font-semibold flex items-center gap-2"><!> Drafts</h1></header> <!> <p class="text-sm text-base-content/70">Pending drafts across all collections that have draft/publish enabled. Publish promotes the draft to the live record.</p> <div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Collection</th><th>Record</th><th>Author</th><th>Updated</th><th></th></tr></thead><tbody><!></tbody></table></div></div>');function J(a,e){var W;t.push(e,!0);const o=((W=window.__zveltio)==null?void 0:W.engineUrl)??"";let n=t.state(t.proxy([])),i=t.state("");async function l(r,s){const h=await fetch(`${o}${r}`,{credentials:"include",...s}),g=await h.json().catch(()=>({}));if(!h.ok)throw new Error(g.error||`HTTP ${h.status}`);return g}async function d(){try{const r=await l("/api/drafts");t.set(n,r.data??[],!0)}catch(r){t.set(i,r.message,!0)}}async function c(r){try{await l(`/api/drafts/${r}/publish`,{method:"POST"}),await d()}catch(s){t.set(i,s.message,!0)}}async function p(r){if(confirm("Discard draft?"))try{await l(`/api/drafts/${r}`,{method:"DELETE"}),await d()}catch(s){t.set(i,s.message,!0)}}U.onMount(d);var v=G(),_=t.child(v),f=t.child(_),N=t.child(f);B(N,{class:"h-6 w-6"}),t.next(),t.reset(f),t.reset(_);var b=t.sibling(_,2);{var P=r=>{var s=L(),h=t.child(s,!0);t.reset(s),t.template_effect(()=>t.set_text(h,t.get(i))),t.append(r,s)};t.if(b,r=>{t.get(i)&&r(P)})}var w=t.sibling(b,4),m=t.child(w),x=t.sibling(t.child(m)),S=t.child(x);{var T=r=>{var s=Z();t.append(r,s)},K=r=>{var s=t.comment(),h=t.first_child(s);t.each(h,17,()=>t.get(n),g=>g.id,(g,u)=>{var z=q(),$=t.child(z),R=t.child($),Q=t.child(R,!0);t.reset(R),t.reset($);var j=t.sibling($),X=t.child(j,!0);t.reset(j);var D=t.sibling(j),Y=t.child(D,!0);t.reset(D);var E=t.sibling(D),tt=t.child(E,!0);t.reset(E);var C=t.sibling(E),y=t.child(C),et=t.child(y);I(et,{class:"h-3 w-3"}),t.next(),t.reset(y);var rt=t.sibling(y,2);t.reset(C),t.reset(z),t.template_effect(k=>{t.set_text(Q,t.get(u).collection),t.set_text(X,t.get(u).record_id),t.set_text(Y,t.get(u).author_name??t.get(u).author_id),t.set_text(tt,k)},[()=>{var k;return(k=t.get(u).updated_at)==null?void 0:k.slice(0,16).replace("T"," ")}]),t.delegated("click",y,()=>c(t.get(u).id)),t.delegated("click",rt,()=>p(t.get(u).id)),t.append(g,z)}),t.append(r,s)};t.if(S,r=>{t.get(n).length===0?r(T):r(K,-1)})}t.reset(x),t.reset(m),t.reset(w),t.reset(v),t.append(a,v),t.pop()}t.delegate(["click"]);function O(){const a=window.__zveltio;a&&a.registerRoute({path:"drafts",component:J,label:"Drafts",icon:"FileEdit",category:"content"})}return O(),O})(window.__SvelteRuntime.__unknown,window.__SvelteRuntime.internal_client,window.__SvelteRuntime.svelte);
