var ZveltioExt=(function(Ke,ue,he){"use strict";function ve(o){const r=Object.create(null,{[Symbol.toStringTag]:{value:"Module"}});if(o){for(const l in o)if(l!=="default"){const n=Object.getOwnPropertyDescriptor(o,l);Object.defineProperty(r,l,n.get?n:{enumerable:!0,get:()=>o[l]})}}return r.default=o,Object.freeze(r)}const e=ve(ue);/**
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
 */const fe={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"};var _e=e.from_svg("<svg><!><!></svg>");function y(o,r){e.push(r,!0);const l=e.prop(r,"color",3,"currentColor"),n=e.prop(r,"size",3,24),c=e.prop(r,"strokeWidth",3,2),v=e.prop(r,"absoluteStrokeWidth",3,!1),s=e.prop(r,"iconNode",19,()=>[]),i=e.rest_props(r,["$$slots","$$events","$$legacy","name","color","size","strokeWidth","absoluteStrokeWidth","iconNode","children"]);var S=_e();e.attribute_effect(S,g=>({...fe,...i,width:n(),height:n(),stroke:l(),"stroke-width":g,class:["lucide-icon lucide",r.name&&`lucide-${r.name}`,r.class]}),[()=>v()?Number(c())*24/Number(n()):c()]);var w=e.child(S);e.each(w,17,s,e.index,(g,H)=>{var P=e.derived(()=>e.to_array(e.get(H),2));let z=()=>e.get(P)[0],q=()=>e.get(P)[1];var E=e.comment(),A=e.first_child(E);e.element(A,z,!0,(V,te)=>{e.attribute_effect(V,()=>({...q()}))}),e.append(g,E)});var M=e.sibling(w);e.snippet(M,()=>r.children??e.noop),e.reset(S),e.append(o,S),e.pop()}function ge(o,r){e.push(r,!0);/**
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
 */let l=e.rest_props(r,["$$slots","$$events","$$legacy"]);const n=[["path",{d:"m12 19-7-7 7-7"}],["path",{d:"M19 12H5"}]];y(o,e.spread_props({name:"arrow-left"},()=>l,{get iconNode(){return n},children:(c,v)=>{var s=e.comment(),i=e.first_child(s);e.snippet(i,()=>r.children??e.noop),e.append(c,s)},$$slots:{default:!0}})),e.pop()}function me(o,r){e.push(r,!0);/**
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
 */let l=e.rest_props(r,["$$slots","$$events","$$legacy"]);const n=[["path",{d:"m9 18 6-6-6-6"}]];y(o,e.spread_props({name:"chevron-right"},()=>l,{get iconNode(){return n},children:(c,v)=>{var s=e.comment(),i=e.first_child(s);e.snippet(i,()=>r.children??e.noop),e.append(c,s)},$$slots:{default:!0}})),e.pop()}function be(o,r){e.push(r,!0);/**
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
 */let l=e.rest_props(r,["$$slots","$$events","$$legacy"]);const n=[["path",{d:"M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"}]];y(o,e.spread_props({name:"cloud"},()=>l,{get iconNode(){return n},children:(c,v)=>{var s=e.comment(),i=e.first_child(s);e.snippet(i,()=>r.children??e.noop),e.append(c,s)},$$slots:{default:!0}})),e.pop()}function xe(o,r){e.push(r,!0);/**
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
 */let l=e.rest_props(r,["$$slots","$$events","$$legacy"]);const n=[["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4"}],["path",{d:"M10 9H8"}],["path",{d:"M16 13H8"}],["path",{d:"M16 17H8"}]];y(o,e.spread_props({name:"file-text"},()=>l,{get iconNode(){return n},children:(c,v)=>{var s=e.comment(),i=e.first_child(s);e.snippet(i,()=>r.children??e.noop),e.append(c,s)},$$slots:{default:!0}})),e.pop()}function Q(o,r){e.push(r,!0);/**
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
 */let l=e.rest_props(r,["$$slots","$$events","$$legacy"]);const n=[["path",{d:"M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"}]];y(o,e.spread_props({name:"folder"},()=>l,{get iconNode(){return n},children:(c,v)=>{var s=e.comment(),i=e.first_child(s);e.snippet(i,()=>r.children??e.noop),e.append(c,s)},$$slots:{default:!0}})),e.pop()}function Y(o,r){e.push(r,!0);/**
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
 */let l=e.rest_props(r,["$$slots","$$events","$$legacy"]);const n=[["circle",{cx:"18",cy:"5",r:"3"}],["circle",{cx:"6",cy:"12",r:"3"}],["circle",{cx:"18",cy:"19",r:"3"}],["line",{x1:"8.59",x2:"15.42",y1:"13.51",y2:"17.49"}],["line",{x1:"15.41",x2:"8.59",y1:"6.51",y2:"10.49"}]];y(o,e.spread_props({name:"share-2"},()=>l,{get iconNode(){return n},children:(c,v)=>{var s=e.comment(),i=e.first_child(s);e.snippet(i,()=>r.children??e.noop),e.append(c,s)},$$slots:{default:!0}})),e.pop()}function ye(o,r){e.push(r,!0);/**
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
 */let l=e.rest_props(r,["$$slots","$$events","$$legacy"]);const n=[["path",{d:"M3 6h18"}],["path",{d:"M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"}],["path",{d:"M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"}],["line",{x1:"10",x2:"10",y1:"11",y2:"17"}],["line",{x1:"14",x2:"14",y1:"11",y2:"17"}]];y(o,e.spread_props({name:"trash-2"},()=>l,{get iconNode(){return n},children:(c,v)=>{var s=e.comment(),i=e.first_child(s);e.snippet(i,()=>r.children??e.noop),e.append(c,s)},$$slots:{default:!0}})),e.pop()}function we(o,r){e.push(r,!0);/**
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
 */let l=e.rest_props(r,["$$slots","$$events","$$legacy"]);const n=[["path",{d:"M12 3v12"}],["path",{d:"m17 8-5-5-5 5"}],["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"}]];y(o,e.spread_props({name:"upload"},()=>l,{get iconNode(){return n},children:(c,v)=>{var s=e.comment(),i=e.first_child(s);e.snippet(i,()=>r.children??e.noop),e.append(c,s)},$$slots:{default:!0}})),e.pop()}function $e(o,r){e.push(r,!0);/**
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
 */let l=e.rest_props(r,["$$slots","$$events","$$legacy"]);const n=[["path",{d:"M18 6 6 18"}],["path",{d:"m6 6 12 12"}]];y(o,e.spread_props({name:"x"},()=>l,{get iconNode(){return n},children:(c,v)=>{var s=e.comment(),i=e.first_child(s);e.snippet(i,()=>r.children??e.noop),e.append(c,s)},$$slots:{default:!0}})),e.pop()}var ke=e.from_html('<div class="alert alert-error"> </div>'),Ne=e.from_html('<button class="btn btn-ghost btn-xs btn-square"><!></button>'),Se=e.from_html('<!> <button class="link"> </button>',1),Me=e.from_html('<div class="p-12 text-center text-base-content/60"><!> Empty folder. Drag files here or click Upload.</div>'),Pe=e.from_html('<button class="link"> </button>'),je=e.from_html('<a class="link" target="_blank"> </a>'),Ce=e.from_html('<button class="btn btn-ghost btn-xs btn-square" title="Share"><!></button>'),Te=e.from_html('<tr class="hover:bg-base-200"><td class="w-10"><!></td><td><!></td><td class="text-right"> </td><td class="text-xs text-base-content/60"> </td><td><!> <button class="btn btn-ghost btn-xs btn-square text-error" title="Delete"><!></button></td></tr>'),ze=e.from_html('<table class="table table-sm"><thead><tr><th></th><th>Name</th><th class="text-right">Size</th><th>Modified</th><th></th></tr></thead><tbody></tbody></table>'),Ue=e.from_html('<div class="space-y-3"><div><label class="label label-text">Expires (hours)</label><input type="number" class="input input-bordered w-full"/></div> <div><label class="label label-text">Password (optional)</label><input type="password" class="input input-bordered w-full"/></div></div> <div class="flex justify-end gap-2 mt-4"><button class="btn btn-ghost">Cancel</button><button class="btn btn-primary gap-2"><!> Generate link</button></div>',1),De=e.from_html('<div class="space-y-3"><p class="text-sm"> </p> <input class="input input-bordered w-full font-mono text-xs" readonly=""/></div> <div class="flex justify-end mt-4"><button class="btn btn-primary">Copy & close</button></div>',1),He=e.from_html('<div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><div class="bg-base-100 rounded-xl p-6 w-full max-w-md"><div class="flex items-center justify-between mb-4"><h2 class="text-xl font-semibold"> </h2><button class="btn btn-ghost btn-sm btn-square"><!></button></div> <!></div></div>'),Ee=e.from_html('<div class="p-6 space-y-4"><header class="flex items-center justify-between"><h1 class="text-2xl font-semibold flex items-center gap-2"><!> Cloud Storage</h1> <label class="btn btn-primary btn-sm gap-2"><!> <input type="file" multiple="" class="hidden"/></label></header> <!> <div class="flex items-center gap-2 text-sm"><!> <button class="link">Root</button> <!></div> <div><!></div></div> <!>',1);function Oe(o,r){var pe;e.push(r,!0);const l=((pe=window.__zveltio)==null?void 0:pe.engineUrl)??"";let n=e.state("/"),c=e.state(e.proxy([])),v=e.state(null),s=e.state(""),i=e.state(!1),S=e.state(!1),w=e.state(!1),M=e.state(""),g=e.state(e.proxy({expires_in_hours:24,password:""}));async function H(t,a){const d=await fetch(`${l}${t}`,{credentials:"include",...a}),h=await d.json().catch(()=>({}));if(!d.ok)throw new Error(h.error||`HTTP ${d.status}`);return h}async function P(){try{const t=await H(`/api/cloud/files?path=${encodeURIComponent(e.get(n))}`);e.set(c,t.data??t.entries??[],!0)}catch(t){e.set(s,t.message,!0)}}function z(t){e.set(n,t,!0),e.set(v,null)}function q(){const t=e.get(n).split("/").filter(Boolean);t.pop(),z("/"+t.join("/"))}async function E(t){if(t!=null&&t.length){e.set(S,!0),e.set(s,"");try{for(const a of Array.from(t)){const d=new FormData;d.append("file",a),d.append("path",e.get(n)),await fetch(`${l}/api/cloud/upload`,{method:"POST",credentials:"include",body:d}).then(async h=>{if(!h.ok)throw new Error((await h.json().catch(()=>({}))).error||"Upload failed")})}await P()}catch(a){e.set(s,a.message,!0)}finally{e.set(S,!1)}}}async function A(t){if(confirm(`Delete ${t.name}?`))try{await H(`/api/cloud/files/${encodeURIComponent(t.id??t.path)}`,{method:"DELETE"}),await P()}catch(a){e.set(s,a.message,!0)}}async function V(t){e.set(v,t,!0),e.set(g,{expires_in_hours:24,password:""},!0),e.set(M,""),e.set(w,!0)}async function te(){if(e.get(v))try{const t=await H("/api/cloud/shares",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({file_id:e.get(v).id,...e.get(g)})});e.set(M,t.share_url??`${l}/share/${t.token}`,!0)}catch(t){e.set(s,t.message,!0)}}e.user_effect(()=>{e.get(n),P()}),he.onMount(P);function Be(t){if(!t)return"—";const a=["B","KB","MB","GB"];let d=0;for(;t>1024&&d<a.length-1;)t/=1024,d++;return`${t.toFixed(1)} ${a[d]}`}function re(t){return t.split("/").filter(Boolean)}var ae=Ee(),I=e.first_child(ae),Z=e.child(I),G=e.child(Z),Re=e.child(G);be(Re,{class:"h-6 w-6"}),e.next(),e.reset(G);var se=e.sibling(G,2),ne=e.child(se);we(ne,{class:"h-4 w-4"});var oe=e.sibling(ne),Fe=e.sibling(oe);e.reset(se),e.reset(Z);var le=e.sibling(Z,2);{var We=t=>{var a=ke(),d=e.child(a,!0);e.reset(a),e.template_effect(()=>e.set_text(d,e.get(s))),e.append(t,a)};e.if(le,t=>{e.get(s)&&t(We)})}var L=e.sibling(le,2),ie=e.child(L);{var qe=t=>{var a=Ne(),d=e.child(a);ge(d,{class:"h-4 w-4"}),e.reset(a),e.delegated("click",a,q),e.append(t,a)};e.if(ie,t=>{e.get(n)!=="/"&&t(qe)})}var de=e.sibling(ie,2),Ae=e.sibling(de,2);e.each(Ae,17,()=>re(e.get(n)),e.index,(t,a,d)=>{var h=Se(),p=e.first_child(h);me(p,{class:"h-3 w-3 text-base-content/40"});var $=e.sibling(p,2),k=e.child($,!0);e.reset($),e.template_effect(()=>e.set_text(k,e.get(a))),e.delegated("click",$,()=>z("/"+re(e.get(n)).slice(0,d+1).join("/"))),e.append(t,h)}),e.reset(L);var U=e.sibling(L,2);let ce;var Ve=e.child(U);{var Ie=t=>{var a=Me(),d=e.child(a);Q(d,{class:"h-10 w-10 mx-auto mb-2 opacity-40"}),e.next(),e.reset(a),e.append(t,a)},Ze=t=>{var a=ze(),d=e.sibling(e.child(a));e.each(d,21,()=>e.get(c),h=>h.id??h.name,(h,p)=>{var $=Te(),k=e.child($),J=e.child(k);{var K=u=>{Q(u,{class:"h-4 w-4 text-warning"})},X=u=>{xe(u,{class:"h-4 w-4 text-base-content/60"})};e.if(J,u=>{e.get(p).is_folder??e.get(p).type==="folder"?u(K):u(X,-1)})}e.reset(k);var O=e.sibling(k),_=e.child(O);{var j=u=>{var f=Pe(),W=e.child(f,!0);e.reset(f),e.template_effect(()=>e.set_text(W,e.get(p).name)),e.delegated("click",f,()=>z(`${e.get(n)==="/"?"":e.get(n)}/${e.get(p).name}`)),e.append(u,f)},N=u=>{var f=je(),W=e.child(f,!0);e.reset(f),e.template_effect(Je=>{e.set_attribute(f,"href",`${l??""}/api/cloud/files/${Je??""}/download`),e.set_text(W,e.get(p).name)},[()=>e.get(p).id??encodeURIComponent(e.get(p).path)]),e.append(u,f)};e.if(_,u=>{e.get(p).is_folder??e.get(p).type==="folder"?u(j):u(N,-1)})}e.reset(O);var m=e.sibling(O),D=e.child(m,!0);e.reset(m);var b=e.sibling(m),C=e.child(b,!0);e.reset(b);var T=e.sibling(b),x=e.child(T);{var B=u=>{var f=Ce(),W=e.child(f);Y(W,{class:"h-3 w-3"}),e.reset(f),e.delegated("click",f,()=>V(e.get(p))),e.append(u,f)};e.if(x,u=>{(e.get(p).is_folder??e.get(p).type==="folder")||u(B)})}var R=e.sibling(x,2),F=e.child(R);ye(F,{class:"h-3 w-3"}),e.reset(R),e.reset(T),e.reset($),e.template_effect((u,f)=>{e.set_text(D,u),e.set_text(C,f)},[()=>e.get(p).is_folder?"—":Be(Number(e.get(p).size_bytes??e.get(p).size??0)),()=>{var u;return((u=e.get(p).updated_at)==null?void 0:u.slice(0,16).replace("T"," "))??"—"}]),e.delegated("click",R,()=>A(e.get(p))),e.append(h,$)}),e.reset(d),e.reset(a),e.append(t,a)};e.if(Ve,t=>{e.get(c).length===0?t(Ie):t(Ze,-1)})}e.reset(U),e.reset(I);var Ge=e.sibling(I,2);{var Le=t=>{var a=He(),d=e.child(a),h=e.child(d),p=e.child(h),$=e.child(p);e.reset(p);var k=e.sibling(p),J=e.child(k);$e(J,{class:"h-4 w-4"}),e.reset(k),e.reset(h);var K=e.sibling(h,2);{var X=_=>{var j=Ue(),N=e.first_child(j),m=e.child(N),D=e.sibling(e.child(m));e.remove_input_defaults(D),e.reset(m);var b=e.sibling(m,2),C=e.sibling(e.child(b));e.remove_input_defaults(C),e.reset(b),e.reset(N);var T=e.sibling(N,2),x=e.child(T),B=e.sibling(x),R=e.child(B);Y(R,{class:"h-4 w-4"}),e.next(),e.reset(B),e.reset(T),e.bind_value(D,()=>e.get(g).expires_in_hours,F=>e.get(g).expires_in_hours=F),e.bind_value(C,()=>e.get(g).password,F=>e.get(g).password=F),e.delegated("click",x,()=>e.set(w,!1)),e.delegated("click",B,te),e.append(_,j)},O=_=>{var j=De(),N=e.first_child(j),m=e.child(N),D=e.child(m);e.reset(m);var b=e.sibling(m,2);e.remove_input_defaults(b),e.reset(N);var C=e.sibling(N,2),T=e.child(C);e.reset(C),e.template_effect(()=>{e.set_text(D,`Anyone with this link can access the file${e.get(g).password?" (password required)":""} for ${e.get(g).expires_in_hours??""}h:`),e.set_value(b,e.get(M))}),e.delegated("click",b,x=>x.target.select()),e.delegated("click",T,()=>{var x;(x=navigator.clipboard)==null||x.writeText(e.get(M)),e.set(w,!1)}),e.append(_,j)};e.if(K,_=>{e.get(M)?_(O,-1):_(X)})}e.reset(d),e.reset(a),e.template_effect(()=>{var _;return e.set_text($,`Share ${((_=e.get(v))==null?void 0:_.name)??""}`)}),e.delegated("click",a,_=>_.target===_.currentTarget&&e.set(w,!1)),e.delegated("click",k,()=>e.set(w,!1)),e.append(t,a)};e.if(Ge,t=>{e.get(w)&&t(Le)})}e.template_effect(()=>{e.set_text(oe,` ${e.get(S)?"Uploading…":"Upload"} `),ce=e.set_class(U,1,"bg-base-100 rounded-lg shadow",null,ce,{"ring-2":e.get(i),"ring-primary":e.get(i)})}),e.delegated("change",Fe,t=>E(t.target.files)),e.delegated("click",de,()=>z("/")),e.event("dragover",U,t=>{t.preventDefault(),e.set(i,!0)}),e.event("dragleave",U,()=>e.set(i,!1)),e.event("drop",U,t=>{var a;t.preventDefault(),e.set(i,!1),E(((a=t.dataTransfer)==null?void 0:a.files)??null)}),e.append(o,ae),e.pop()}e.delegate(["change","click"]);function ee(){const o=window.__zveltio;o&&o.registerRoute({path:"cloud",component:Oe,label:"Cloud Storage",icon:"Cloud",category:"storage"})}return ee(),ee})(window.__SvelteRuntime.__unknown,window.__SvelteRuntime.internal_client,window.__SvelteRuntime.svelte);
