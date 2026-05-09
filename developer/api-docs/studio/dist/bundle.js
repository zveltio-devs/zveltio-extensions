var ZveltioExt=(function(Ue,le,ne){"use strict";function ie(n){const a=Object.create(null,{[Symbol.toStringTag]:{value:"Module"}});if(n){for(const v in n)if(v!=="default"){const r=Object.getOwnPropertyDescriptor(n,v);Object.defineProperty(a,v,r.get?r:{enumerable:!0,get:()=>n[v]})}}return a.default=n,Object.freeze(a)}const e=ie(le);/**
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
 */const oe={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"};var de=e.from_svg("<svg><!><!></svg>");function W(n,a){e.push(a,!0);const v=e.prop(a,"color",3,"currentColor"),r=e.prop(a,"size",3,24),u=e.prop(a,"strokeWidth",3,2),$=e.prop(a,"absoluteStrokeWidth",3,!1),c=e.prop(a,"iconNode",19,()=>[]),o=e.rest_props(a,["$$slots","$$events","$$legacy","name","color","size","strokeWidth","absoluteStrokeWidth","iconNode","children"]);var N=de();e.attribute_effect(N,P=>({...oe,...o,width:r(),height:r(),stroke:v(),"stroke-width":P,class:["lucide-icon lucide",a.name&&`lucide-${a.name}`,a.class]}),[()=>$()?Number(u())*24/Number(r()):u()]);var z=e.child(N);e.each(z,17,c,e.index,(P,B)=>{var D=e.derived(()=>e.to_array(e.get(B),2));let R=()=>e.get(D)[0],U=()=>e.get(D)[1];var I=e.comment(),G=e.first_child(I);e.element(G,R,!0,(V,F)=>{e.attribute_effect(V,()=>({...U()}))}),e.append(P,I)});var b=e.sibling(z);e.snippet(b,()=>a.children??e.noop),e.reset(N),e.append(n,N),e.pop()}function ce(n,a){e.push(a,!0);/**
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
 */let v=e.rest_props(a,["$$slots","$$events","$$legacy"]);const r=[["path",{d:"M12 7v14"}],["path",{d:"M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"}]];W(n,e.spread_props({name:"book-open"},()=>v,{get iconNode(){return r},children:(u,$)=>{var c=e.comment(),o=e.first_child(c);e.snippet(o,()=>a.children??e.noop),e.append(u,c)},$$slots:{default:!0}})),e.pop()}function ve(n,a){e.push(a,!0);/**
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
 */let v=e.rest_props(a,["$$slots","$$events","$$legacy"]);const r=[["path",{d:"M10 12.5 8 15l2 2.5"}],["path",{d:"m14 12.5 2 2.5-2 2.5"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4"}],["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"}]];W(n,e.spread_props({name:"file-code"},()=>v,{get iconNode(){return r},children:(u,$)=>{var c=e.comment(),o=e.first_child(c);e.snippet(o,()=>a.children??e.noop),e.append(u,c)},$$slots:{default:!0}})),e.pop()}function pe(n,a){e.push(a,!0);/**
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
 */let v=e.rest_props(a,["$$slots","$$events","$$legacy"]);const r=[["path",{d:"m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4"}],["path",{d:"m21 2-9.6 9.6"}],["circle",{cx:"7.5",cy:"15.5",r:"5.5"}]];W(n,e.spread_props({name:"key"},()=>v,{get iconNode(){return r},children:(u,$)=>{var c=e.comment(),o=e.first_child(c);e.snippet(o,()=>a.children??e.noop),e.append(u,c)},$$slots:{default:!0}})),e.pop()}function X(n,a){e.push(a,!0);/**
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
 */let v=e.rest_props(a,["$$slots","$$events","$$legacy"]);const r=[["path",{d:"M5 12h14"}],["path",{d:"M12 5v14"}]];W(n,e.spread_props({name:"plus"},()=>v,{get iconNode(){return r},children:(u,$)=>{var c=e.comment(),o=e.first_child(c);e.snippet(o,()=>a.children??e.noop),e.append(u,c)},$$slots:{default:!0}})),e.pop()}function ue(n,a){e.push(a,!0);/**
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
 */let v=e.rest_props(a,["$$slots","$$events","$$legacy"]);const r=[["path",{d:"M18 6 6 18"}],["path",{d:"m6 6 12 12"}]];W(n,e.spread_props({name:"x"},()=>v,{get iconNode(){return r},children:(u,$)=>{var c=e.comment(),o=e.first_child(c);e.snippet(o,()=>a.children??e.noop),e.append(u,c)},$$slots:{default:!0}})),e.pop()}var he=e.from_html('<button class="btn btn-primary btn-sm gap-2"><!> New page</button>'),ge=e.from_html('<button class="btn btn-primary btn-sm gap-2"><!> Generate token</button>'),_e=e.from_html('<div class="alert alert-error"> </div>'),be=e.from_html('<div class="bg-base-100 rounded-lg p-12 text-center text-base-content/60">No changelog entries.</div>'),fe=e.from_html('<div class="bg-base-100 rounded-lg shadow p-4"><div class="flex items-baseline justify-between mb-2"><h3 class="font-semibold"> </h3> <span class="text-xs text-base-content/60"> </span></div> <div class="text-sm whitespace-pre-line"> </div></div>'),me=e.from_html('<div class="space-y-3"><a class="link link-primary text-sm" target="_blank">View OpenAPI spec →</a> <!></div>'),xe=e.from_html('<tr><td colspan="4" class="text-center py-6 text-base-content/60">No custom doc pages.</td></tr>'),we=e.from_html('<tr><td class="font-mono text-xs"> </td><td> </td><td> </td><td> </td></tr>'),ye=e.from_html('<div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Slug</th><th>Title</th><th>Public</th><th>Updated</th></tr></thead><tbody><!></tbody></table></div>'),ke=e.from_html('<tr><td colspan="4" class="text-center py-6 text-base-content/60">No tokens. Generate one for read-only doc access.</td></tr>'),Ne=e.from_html('<tr><td class="font-mono text-xs"> </td><td> </td><td> </td><td><button class="btn btn-ghost btn-xs">Revoke</button></td></tr>'),$e=e.from_html('<div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Token</th><th>Created</th><th>Last used</th><th></th></tr></thead><tbody><!></tbody></table></div>'),Pe=e.from_html('<div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><div class="bg-base-100 rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto"><div class="flex items-center justify-between mb-4"><h2 class="text-xl font-semibold">New doc page</h2><button class="btn btn-ghost btn-sm btn-square"><!></button></div> <div class="space-y-3"><div class="grid grid-cols-2 gap-3"><div><label class="label label-text">Slug</label><input class="input input-bordered w-full font-mono" placeholder="getting-started"/></div> <div class="flex items-end"><label class="label cursor-pointer gap-2"><input type="checkbox" class="checkbox checkbox-sm"/><span class="label-text">Public</span></label></div></div> <div><label class="label label-text">Title</label><input class="input input-bordered w-full"/></div> <div><label class="label label-text">Body (Markdown)</label><textarea class="textarea textarea-bordered w-full font-mono text-xs" rows="14"></textarea></div></div> <div class="flex justify-end gap-2 mt-4"><button class="btn btn-ghost">Cancel</button><button class="btn btn-primary"> </button></div></div></div>'),Te=e.from_html('<div class="p-6 space-y-4"><header class="flex items-center justify-between"><h1 class="text-2xl font-semibold flex items-center gap-2"><!> API Docs</h1> <div class="flex gap-2"><!> <!></div></header> <!> <div role="tablist" class="tabs tabs-bordered"><button role="tab">Changelog</button> <button role="tab"><!> Custom pages</button> <button role="tab"><!> Access tokens</button></div> <!></div> <!>',1);function je(n,a){var re;e.push(a,!0);const v=((re=window.__zveltio)==null?void 0:re.engineUrl)??"";let r=e.state("changelog"),u=e.state(e.proxy([])),$=e.state(e.proxy([])),c=e.state(e.proxy([])),o=e.state(""),N=e.state(!1),z=e.state(!1),b=e.state(e.proxy({slug:"",title:"",body:`# New documentation page

Write content in Markdown.`,is_public:!1}));async function P(t,s){const d=await fetch(`${v}${t}`,{credentials:"include",...s}),f=await d.json().catch(()=>({}));if(!d.ok)throw new Error(f.error||`HTTP ${d.status}`);return f}async function B(){try{const t=await P("/api/api-docs/changelogs");e.set(u,t.data??[],!0)}catch(t){e.set(o,t.message,!0)}}async function D(){try{const t=await P("/api/api-docs/custom");e.set($,t.data??[],!0)}catch(t){e.set(o,t.message,!0)}}async function R(){try{const t=await P("/api/api-docs/access-tokens");e.set(c,t.data??[],!0)}catch(t){e.set(o,t.message,!0)}}async function U(){e.set(z,!0),e.set(o,"");try{await P("/api/api-docs/custom",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(e.get(b))}),e.set(N,!1),e.set(b,{slug:"",title:"",body:`# New documentation page

Write content in Markdown.`,is_public:!1},!0),await D()}catch(t){e.set(o,t.message,!0)}finally{e.set(z,!1)}}async function I(){try{await P("/api/api-docs/access-tokens",{method:"POST"}),await R()}catch(t){e.set(o,t.message,!0)}}async function G(t){if(confirm("Revoke token?"))try{await P(`/api/api-docs/access-tokens/${t}`,{method:"DELETE"}),await R()}catch(s){e.set(o,s.message,!0)}}e.user_effect(()=>{e.get(r)==="changelog"?B():e.get(r)==="custom"?D():R()}),ne.onMount(B);var V=Te(),F=e.first_child(V),H=e.child(F),q=e.child(H),Se=e.child(q);ce(Se,{class:"h-6 w-6"}),e.next(),e.reset(q);var Q=e.sibling(q,2),Y=e.child(Q);{var Me=t=>{var s=he(),d=e.child(s);X(d,{class:"h-4 w-4"}),e.next(),e.reset(s),e.delegated("click",s,()=>e.set(N,!0)),e.append(t,s)};e.if(Y,t=>{e.get(r)==="custom"&&t(Me)})}var Ce=e.sibling(Y,2);{var ze=t=>{var s=ge(),d=e.child(s);X(d,{class:"h-4 w-4"}),e.next(),e.reset(s),e.delegated("click",s,I),e.append(t,s)};e.if(Ce,t=>{e.get(r)==="tokens"&&t(ze)})}e.reset(Q),e.reset(H);var ee=e.sibling(H,2);{var Oe=t=>{var s=_e(),d=e.child(s,!0);e.reset(s),e.template_effect(()=>e.set_text(d,e.get(o))),e.append(t,s)};e.if(ee,t=>{e.get(o)&&t(Oe)})}var J=e.sibling(ee,2),K=e.child(J);let te;var A=e.sibling(K,2);let ae;var We=e.child(A);ve(We,{class:"h-4 w-4"}),e.next(),e.reset(A);var L=e.sibling(A,2);let se;var De=e.child(L);pe(De,{class:"h-4 w-4"}),e.next(),e.reset(L),e.reset(J);var Re=e.sibling(J,2);{var Ae=t=>{var s=me(),d=e.child(s),f=e.sibling(d,2);{var j=m=>{var i=be();e.append(m,i)},O=m=>{var i=e.comment(),h=e.first_child(i);e.each(h,17,()=>e.get(u),T=>T.id,(T,x)=>{var p=fe(),w=e.child(p),g=e.child(w),S=e.child(g);e.reset(g);var y=e.sibling(g,2),M=e.child(y,!0);e.reset(y),e.reset(w);var k=e.sibling(w,2),C=e.child(k,!0);e.reset(k),e.reset(p),e.template_effect(_=>{e.set_text(S,`v${e.get(x).version??""}`),e.set_text(M,_),e.set_text(C,e.get(x).notes)},[()=>{var _;return(_=e.get(x).released_at)==null?void 0:_.slice(0,10)}]),e.append(T,p)}),e.append(m,i)};e.if(f,m=>{e.get(u).length===0?m(j):m(O,-1)})}e.reset(s),e.template_effect(()=>e.set_attribute(d,"href",`${v??""}/api/openapi.json`)),e.append(t,s)},Ee=t=>{var s=ye(),d=e.child(s),f=e.sibling(e.child(d)),j=e.child(f);{var O=i=>{var h=xe();e.append(i,h)},m=i=>{var h=e.comment(),T=e.first_child(h);e.each(T,17,()=>e.get($),x=>x.id,(x,p)=>{var w=we(),g=e.child(w),S=e.child(g,!0);e.reset(g);var y=e.sibling(g),M=e.child(y,!0);e.reset(y);var k=e.sibling(y),C=e.child(k,!0);e.reset(k);var _=e.sibling(k),E=e.child(_,!0);e.reset(_),e.reset(w),e.template_effect(l=>{e.set_text(S,e.get(p).slug),e.set_text(M,e.get(p).title),e.set_text(C,e.get(p).is_public?"✓":"—"),e.set_text(E,l)},[()=>{var l;return(l=e.get(p).updated_at)==null?void 0:l.slice(0,10)}]),e.append(x,w)}),e.append(i,h)};e.if(j,i=>{e.get($).length===0?i(O):i(m,-1)})}e.reset(f),e.reset(d),e.reset(s),e.append(t,s)},Be=t=>{var s=$e(),d=e.child(s),f=e.sibling(e.child(d)),j=e.child(f);{var O=i=>{var h=ke();e.append(i,h)},m=i=>{var h=e.comment(),T=e.first_child(h);e.each(T,17,()=>e.get(c),x=>x.id,(x,p)=>{var w=Ne(),g=e.child(w),S=e.child(g,!0);e.reset(g);var y=e.sibling(g),M=e.child(y,!0);e.reset(y);var k=e.sibling(y),C=e.child(k,!0);e.reset(k);var _=e.sibling(k),E=e.child(_);e.reset(_),e.reset(w),e.template_effect((l,Fe,Le)=>{e.set_text(S,l),e.set_text(M,Fe),e.set_text(C,Le)},[()=>{var l;return e.get(p).token_preview??`${(l=e.get(p).token)==null?void 0:l.slice(0,12)}…`},()=>{var l;return(l=e.get(p).created_at)==null?void 0:l.slice(0,16).replace("T"," ")},()=>{var l;return((l=e.get(p).last_used_at)==null?void 0:l.slice(0,16).replace("T"," "))??"never"}]),e.delegated("click",E,()=>G(e.get(p).id)),e.append(x,w)}),e.append(i,h)};e.if(j,i=>{e.get(c).length===0?i(O):i(m,-1)})}e.reset(f),e.reset(d),e.reset(s),e.append(t,s)};e.if(Re,t=>{e.get(r)==="changelog"?t(Ae):e.get(r)==="custom"?t(Ee,1):t(Be,-1)})}e.reset(F);var Ie=e.sibling(F,2);{var Ve=t=>{var s=Pe(),d=e.child(s),f=e.child(d),j=e.sibling(e.child(f)),O=e.child(j);ue(O,{class:"h-4 w-4"}),e.reset(j),e.reset(f);var m=e.sibling(f,2),i=e.child(m),h=e.child(i),T=e.sibling(e.child(h));e.remove_input_defaults(T),e.reset(h);var x=e.sibling(h,2),p=e.child(x),w=e.child(p);e.remove_input_defaults(w),e.next(),e.reset(p),e.reset(x),e.reset(i);var g=e.sibling(i,2),S=e.sibling(e.child(g));e.remove_input_defaults(S),e.reset(g);var y=e.sibling(g,2),M=e.sibling(e.child(y));e.remove_textarea_child(M),e.reset(y),e.reset(m);var k=e.sibling(m,2),C=e.child(k),_=e.sibling(C),E=e.child(_,!0);e.reset(_),e.reset(k),e.reset(d),e.reset(s),e.template_effect(()=>{_.disabled=e.get(z)||!e.get(b).slug||!e.get(b).title,e.set_text(E,e.get(z)?"Saving…":"Create")}),e.delegated("click",s,l=>l.target===l.currentTarget&&e.set(N,!1)),e.delegated("click",j,()=>e.set(N,!1)),e.bind_value(T,()=>e.get(b).slug,l=>e.get(b).slug=l),e.bind_checked(w,()=>e.get(b).is_public,l=>e.get(b).is_public=l),e.bind_value(S,()=>e.get(b).title,l=>e.get(b).title=l),e.bind_value(M,()=>e.get(b).body,l=>e.get(b).body=l),e.delegated("click",C,()=>e.set(N,!1)),e.delegated("click",_,U),e.append(t,s)};e.if(Ie,t=>{e.get(N)&&t(Ve)})}e.template_effect(()=>{te=e.set_class(K,1,"tab",null,te,{"tab-active":e.get(r)==="changelog"}),ae=e.set_class(A,1,"tab gap-2",null,ae,{"tab-active":e.get(r)==="custom"}),se=e.set_class(L,1,"tab gap-2",null,se,{"tab-active":e.get(r)==="tokens"})}),e.delegated("click",K,()=>e.set(r,"changelog")),e.delegated("click",A,()=>e.set(r,"custom")),e.delegated("click",L,()=>e.set(r,"tokens")),e.append(n,V),e.pop()}e.delegate(["click"]);function Z(){const n=window.__zveltio;n&&n.registerRoute({path:"api-docs",component:je,label:"API Docs",icon:"BookOpen",category:"developer"})}return Z(),Z})(window.__SvelteRuntime.__unknown,window.__SvelteRuntime.internal_client,window.__SvelteRuntime.svelte);
