var ZveltioExt=(function(Ke,ue,_e){"use strict";function pe(l){const a=Object.create(null,{[Symbol.toStringTag]:{value:"Module"}});if(l){for(const v in l)if(v!=="default"){const r=Object.getOwnPropertyDescriptor(l,v);Object.defineProperty(a,v,r.get?r:{enumerable:!0,get:()=>l[v]})}}return a.default=l,Object.freeze(a)}const e=pe(ue);/**
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
 */const be={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"};var ge=e.from_svg("<svg><!><!></svg>");function B(l,a){e.push(a,!0);const v=e.prop(a,"color",3,"currentColor"),r=e.prop(a,"size",3,24),_=e.prop(a,"strokeWidth",3,2),j=e.prop(a,"absoluteStrokeWidth",3,!1),i=e.prop(a,"iconNode",19,()=>[]),d=e.rest_props(a,["$$slots","$$events","$$legacy","name","color","size","strokeWidth","absoluteStrokeWidth","iconNode","children"]);var P=ge();e.attribute_effect(P,T=>({...be,...d,width:r(),height:r(),stroke:v(),"stroke-width":T,class:["lucide-icon lucide",a.name&&`lucide-${a.name}`,a.class]}),[()=>j()?Number(_())*24/Number(r()):_()]);var I=e.child(P);e.each(I,17,i,e.index,(T,D)=>{var Z=e.derived(()=>e.to_array(e.get(D),2));let Q=()=>e.get(Z)[0],Y=()=>e.get(Z)[1];var q=e.comment(),F=e.first_child(q);e.element(F,Q,!0,(J,X)=>{e.attribute_effect(J,()=>({...Y()}))}),e.append(T,q)});var n=e.sibling(I);e.snippet(n,()=>a.children??e.noop),e.reset(P),e.append(l,P),e.pop()}function me(l,a){e.push(a,!0);/**
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
 */let v=e.rest_props(a,["$$slots","$$events","$$legacy"]);const r=[["path",{d:"m3 17 2 2 4-4"}],["path",{d:"m3 7 2 2 4-4"}],["path",{d:"M13 6h8"}],["path",{d:"M13 12h8"}],["path",{d:"M13 18h8"}]];B(l,e.spread_props({name:"list-checks"},()=>v,{get iconNode(){return r},children:(_,j)=>{var i=e.comment(),d=e.first_child(i);e.snippet(d,()=>a.children??e.noop),e.append(_,i)},$$slots:{default:!0}})),e.pop()}function re(l,a){e.push(a,!0);/**
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
 */let v=e.rest_props(a,["$$slots","$$events","$$legacy"]);const r=[["path",{d:"M12 22v-5"}],["path",{d:"M9 8V2"}],["path",{d:"M15 8V2"}],["path",{d:"M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"}]];B(l,e.spread_props({name:"plug"},()=>v,{get iconNode(){return r},children:(_,j)=>{var i=e.comment(),d=e.first_child(i);e.snippet(d,()=>a.children??e.noop),e.append(_,i)},$$slots:{default:!0}})),e.pop()}function fe(l,a){e.push(a,!0);/**
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
 */let v=e.rest_props(a,["$$slots","$$events","$$legacy"]);const r=[["path",{d:"M5 12h14"}],["path",{d:"M12 5v14"}]];B(l,e.spread_props({name:"plus"},()=>v,{get iconNode(){return r},children:(_,j)=>{var i=e.comment(),d=e.first_child(i);e.snippet(d,()=>a.children??e.noop),e.append(_,i)},$$slots:{default:!0}})),e.pop()}function xe(l,a){e.push(a,!0);/**
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
 */let v=e.rest_props(a,["$$slots","$$events","$$legacy"]);const r=[["path",{d:"M18 16.98h-5.99c-1.1 0-1.95.94-2.48 1.9A4 4 0 0 1 2 17c.01-.7.2-1.4.57-2"}],["path",{d:"m6 17 3.13-5.78c.53-.97.1-2.18-.5-3.1a4 4 0 1 1 6.89-4.06"}],["path",{d:"m12 6 3.13 5.73C15.66 12.7 16.9 13 18 13a4 4 0 0 1 0 8"}]];B(l,e.spread_props({name:"webhook"},()=>v,{get iconNode(){return r},children:(_,j)=>{var i=e.comment(),d=e.first_child(i);e.snippet(d,()=>a.children??e.noop),e.append(_,i)},$$slots:{default:!0}})),e.pop()}function we(l,a){e.push(a,!0);/**
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
 */let v=e.rest_props(a,["$$slots","$$events","$$legacy"]);const r=[["path",{d:"M18 6 6 18"}],["path",{d:"m6 6 12 12"}]];B(l,e.spread_props({name:"x"},()=>v,{get iconNode(){return r},children:(_,j)=>{var i=e.comment(),d=e.first_child(i);e.snippet(d,()=>a.children??e.noop),e.append(_,i)},$$slots:{default:!0}})),e.pop()}var ye=e.from_html('<button class="btn btn-primary btn-sm gap-2"><!> New connection</button>'),ke=e.from_html('<div class="alert alert-error"> </div>'),Ne=e.from_html('<div class="col-span-full bg-base-100 rounded-lg p-12 text-center text-base-content/60">No external API connections yet.</div>'),Pe=e.from_html('<div class="bg-base-100 rounded-lg shadow p-4"><div class="flex items-start justify-between mb-2"><div class="font-medium"> </div> <span class="badge badge-ghost badge-sm"> </span></div> <div class="text-xs text-base-content/60 font-mono break-all"> </div> <div class="flex justify-end mt-3"><button class="btn btn-ghost btn-xs">Delete</button></div></div>'),$e=e.from_html('<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"><!></div>'),Ce=e.from_html('<tr><td colspan="4" class="text-center py-6 text-base-content/60">No incoming webhook endpoints.</td></tr>'),Se=e.from_html('<tr><td> </td><td class="font-mono text-xs"><code> </code></td><td> </td><td> </td></tr>'),je=e.from_html('<div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Name</th><th>URL</th><th>Created</th><th>Last received</th></tr></thead><tbody><!></tbody></table></div>'),Me=e.from_html('<tr><td colspan="6" class="text-center py-6 text-base-content/60">No call logs.</td></tr>'),Oe=e.from_html('<tr><td> </td><td> </td><td><span class="badge badge-ghost badge-sm"> </span></td><td class="font-mono text-xs max-w-md truncate"> </td><td><span> </span></td><td> </td></tr>'),Te=e.from_html('<div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Time</th><th>Connection</th><th>Method</th><th>URL</th><th>Status</th><th>Duration</th></tr></thead><tbody><!></tbody></table></div>'),ze=e.from_html('<div><label class="label label-text">Token</label><input type="password" class="input input-bordered w-full font-mono"/></div>'),Ae=e.from_html('<div class="grid grid-cols-2 gap-3"><div><label class="label label-text">Username</label><input class="input input-bordered w-full"/></div> <div><label class="label label-text">Password</label><input type="password" class="input input-bordered w-full"/></div></div>'),We=e.from_html('<div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><div class="bg-base-100 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"><div class="flex items-center justify-between mb-4"><h2 class="text-xl font-semibold">New API connection</h2><button class="btn btn-ghost btn-sm btn-square"><!></button></div> <div class="space-y-3"><div><label class="label label-text">Name</label><input class="input input-bordered w-full"/></div> <div><label class="label label-text">Base URL</label><input class="input input-bordered w-full font-mono" placeholder="https://api.example.com"/></div> <div><label class="label label-text">Auth</label> <select class="select select-bordered w-full"><option>None</option><option>Bearer token</option><option>Basic auth</option><option>OAuth 2.0</option></select></div> <!> <div><label class="label label-text">Extra headers (JSON)</label><textarea class="textarea textarea-bordered w-full font-mono text-xs" rows="4"></textarea></div></div> <div class="flex justify-end gap-2 mt-4"><button class="btn btn-ghost">Cancel</button><button class="btn btn-primary"> </button></div></div></div>'),Ee=e.from_html('<div class="p-6 space-y-4"><header class="flex items-center justify-between"><h1 class="text-2xl font-semibold flex items-center gap-2"><!> API Connector</h1> <!></header> <!> <div role="tablist" class="tabs tabs-bordered"><button role="tab"><!> Connections</button> <button role="tab"><!> Incoming webhooks</button> <button role="tab"><!> Call logs</button></div> <!></div> <!>',1);function Ie(l,a){var ce;e.push(a,!0);const v=((ce=window.__zveltio)==null?void 0:ce.engineUrl)??"";let r=e.state("connections"),_=e.state(e.proxy([])),j=e.state(e.proxy([])),i=e.state(e.proxy([])),d=e.state(""),P=e.state(!1),I=e.state(!1),n=e.state(e.proxy({name:"",base_url:"",auth_type:"none",auth_token:"",auth_username:"",auth_password:"",headers:"{}"}));async function T(t,s){const u=await fetch(`${v}${t}`,{credentials:"include",...s}),g=await u.json().catch(()=>({}));if(!u.ok)throw new Error(g.error||`HTTP ${u.status}`);return g}async function D(){try{const t=await T("/api/connector/connections");e.set(_,t.data??[],!0)}catch(t){e.set(d,t.message,!0)}}async function Z(){try{const t=await T("/api/connector/incoming-webhooks");e.set(j,t.data??[],!0)}catch(t){e.set(d,t.message,!0)}}async function Q(){try{const t=await T("/api/connector/logs?limit=100");e.set(i,t.data??[],!0)}catch(t){e.set(d,t.message,!0)}}async function Y(){e.set(I,!0),e.set(d,"");try{let t={};try{t=JSON.parse(e.get(n).headers)}catch{throw new Error("Invalid JSON in headers")}await T("/api/connector/connections",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...e.get(n),headers:t})}),e.set(P,!1),e.set(n,{name:"",base_url:"",auth_type:"none",auth_token:"",auth_username:"",auth_password:"",headers:"{}"},!0),await D()}catch(t){e.set(d,t.message,!0)}finally{e.set(I,!1)}}async function q(t){if(confirm("Delete connection?"))try{await T(`/api/connector/connections/${t}`,{method:"DELETE"}),await D()}catch(s){e.set(d,s.message,!0)}}e.user_effect(()=>{e.get(r)==="connections"?D():e.get(r)==="webhooks"?Z():Q()}),_e.onMount(D);var F=Ee(),J=e.first_child(F),X=e.child(J),ee=e.child(X),Le=e.child(ee);re(Le,{class:"h-6 w-6"}),e.next(),e.reset(ee);var Re=e.sibling(ee,2);{var De=t=>{var s=ye(),u=e.child(s);fe(u,{class:"h-4 w-4"}),e.next(),e.reset(s),e.delegated("click",s,()=>e.set(P,!0)),e.append(t,s)};e.if(Re,t=>{e.get(r)==="connections"&&t(De)})}e.reset(X);var le=e.sibling(X,2);{var Ue=t=>{var s=ke(),u=e.child(s,!0);e.reset(s),e.template_effect(()=>e.set_text(u,e.get(d))),e.append(t,s)};e.if(le,t=>{e.get(d)&&t(Ue)})}var te=e.sibling(le,2),V=e.child(te);let oe;var Be=e.child(V);re(Be,{class:"h-4 w-4"}),e.next(),e.reset(V);var H=e.sibling(V,2);let ie;var Je=e.child(H);xe(Je,{class:"h-4 w-4"}),e.next(),e.reset(H);var G=e.sibling(H,2);let de;var Ve=e.child(G);me(Ve,{class:"h-4 w-4"}),e.next(),e.reset(G),e.reset(te);var He=e.sibling(te,2);{var Ze=t=>{var s=$e(),u=e.child(s);{var g=y=>{var k=Ne();e.append(y,k)},z=y=>{var k=e.comment(),h=e.first_child(k);e.each(h,17,()=>e.get(_),p=>p.id,(p,N)=>{var m=Pe(),o=e.child(m),b=e.child(o),x=e.child(b,!0);e.reset(b);var M=e.sibling(b,2),w=e.child(M,!0);e.reset(M),e.reset(o);var $=e.sibling(o,2),O=e.child($,!0);e.reset($);var C=e.sibling($,2),L=e.child(C);e.reset(C),e.reset(m),e.template_effect(()=>{e.set_text(x,e.get(N).name),e.set_text(w,e.get(N).auth_type),e.set_text(O,e.get(N).base_url)}),e.delegated("click",L,()=>q(e.get(N).id)),e.append(p,m)}),e.append(y,k)};e.if(u,y=>{e.get(_).length===0?y(g):y(z,-1)})}e.reset(s),e.append(t,s)},qe=t=>{var s=je(),u=e.child(s),g=e.sibling(e.child(u)),z=e.child(g);{var y=h=>{var p=Ce();e.append(h,p)},k=h=>{var p=e.comment(),N=e.first_child(p);e.each(N,17,()=>e.get(j),m=>m.id,(m,o)=>{var b=Se(),x=e.child(b),M=e.child(x,!0);e.reset(x);var w=e.sibling(x),$=e.child(w),O=e.child($);e.reset($),e.reset(w);var C=e.sibling(w),L=e.child(C,!0);e.reset(C);var A=e.sibling(C),U=e.child(A,!0);e.reset(A),e.reset(b),e.template_effect((f,E)=>{e.set_text(M,e.get(o).name),e.set_text(O,`${v??""}/api/webhook/${e.get(o).slug??""}`),e.set_text(L,f),e.set_text(U,E)},[()=>{var f;return(f=e.get(o).created_at)==null?void 0:f.slice(0,10)},()=>{var f;return((f=e.get(o).last_received_at)==null?void 0:f.slice(0,16).replace("T"," "))??"never"}]),e.append(m,b)}),e.append(h,p)};e.if(z,h=>{e.get(j).length===0?h(y):h(k,-1)})}e.reset(g),e.reset(u),e.reset(s),e.append(t,s)},Fe=t=>{var s=Te(),u=e.child(s),g=e.sibling(e.child(u)),z=e.child(g);{var y=h=>{var p=Me();e.append(h,p)},k=h=>{var p=e.comment(),N=e.first_child(p);e.each(N,17,()=>e.get(i),m=>m.id,(m,o)=>{var b=Oe(),x=e.child(b),M=e.child(x,!0);e.reset(x);var w=e.sibling(x),$=e.child(w,!0);e.reset(w);var O=e.sibling(w),C=e.child(O),L=e.child(C,!0);e.reset(C),e.reset(O);var A=e.sibling(O),U=e.child(A,!0);e.reset(A);var f=e.sibling(A),E=e.child(f);let R;var ae=e.child(E,!0);e.reset(E),e.reset(f);var c=e.sibling(f),W=e.child(c);e.reset(c),e.reset(b),e.template_effect(S=>{e.set_text(M,S),e.set_text($,e.get(o).connection_name??"—"),e.set_text(L,e.get(o).method),e.set_text(U,e.get(o).url),R=e.set_class(E,1,"badge badge-sm",null,R,{"badge-success":e.get(o).status_code<400,"badge-error":e.get(o).status_code>=400}),e.set_text(ae,e.get(o).status_code),e.set_text(W,`${e.get(o).duration_ms??"—"??""} ms`)},[()=>{var S;return(S=e.get(o).created_at)==null?void 0:S.slice(0,19).replace("T"," ")}]),e.append(m,b)}),e.append(h,p)};e.if(z,h=>{e.get(i).length===0?h(y):h(k,-1)})}e.reset(g),e.reset(u),e.reset(s),e.append(t,s)};e.if(He,t=>{e.get(r)==="connections"?t(Ze):e.get(r)==="webhooks"?t(qe,1):t(Fe,-1)})}e.reset(J);var Xe=e.sibling(J,2);{var Ge=t=>{var s=We(),u=e.child(s),g=e.child(u),z=e.sibling(e.child(g)),y=e.child(z);we(y,{class:"h-4 w-4"}),e.reset(z),e.reset(g);var k=e.sibling(g,2),h=e.child(k),p=e.sibling(e.child(h));e.remove_input_defaults(p),e.reset(h);var N=e.sibling(h,2),m=e.sibling(e.child(N));e.remove_input_defaults(m),e.reset(N);var o=e.sibling(N,2),b=e.sibling(e.child(o),2),x=e.child(b);x.value=x.__value="none";var M=e.sibling(x);M.value=M.__value="bearer";var w=e.sibling(M);w.value=w.__value="basic";var $=e.sibling(w);$.value=$.__value="oauth2",e.reset(b),e.reset(o);var O=e.sibling(o,2);{var C=c=>{var W=ze(),S=e.sibling(e.child(W));e.remove_input_defaults(S),e.reset(W),e.bind_value(S,()=>e.get(n).auth_token,K=>e.get(n).auth_token=K),e.append(c,W)},L=c=>{var W=Ae(),S=e.child(W),K=e.sibling(e.child(S));e.remove_input_defaults(K),e.reset(S);var ve=e.sibling(S,2),he=e.sibling(e.child(ve));e.remove_input_defaults(he),e.reset(ve),e.reset(W),e.bind_value(K,()=>e.get(n).auth_username,se=>e.get(n).auth_username=se),e.bind_value(he,()=>e.get(n).auth_password,se=>e.get(n).auth_password=se),e.append(c,W)};e.if(O,c=>{e.get(n).auth_type==="bearer"?c(C):e.get(n).auth_type==="basic"&&c(L,1)})}var A=e.sibling(O,2),U=e.sibling(e.child(A));e.remove_textarea_child(U),e.reset(A),e.reset(k);var f=e.sibling(k,2),E=e.child(f),R=e.sibling(E),ae=e.child(R,!0);e.reset(R),e.reset(f),e.reset(u),e.reset(s),e.template_effect(()=>{R.disabled=e.get(I)||!e.get(n).name||!e.get(n).base_url,e.set_text(ae,e.get(I)?"Saving…":"Create")}),e.delegated("click",s,c=>c.target===c.currentTarget&&e.set(P,!1)),e.delegated("click",z,()=>e.set(P,!1)),e.bind_value(p,()=>e.get(n).name,c=>e.get(n).name=c),e.bind_value(m,()=>e.get(n).base_url,c=>e.get(n).base_url=c),e.bind_select_value(b,()=>e.get(n).auth_type,c=>e.get(n).auth_type=c),e.bind_value(U,()=>e.get(n).headers,c=>e.get(n).headers=c),e.delegated("click",E,()=>e.set(P,!1)),e.delegated("click",R,Y),e.append(t,s)};e.if(Xe,t=>{e.get(P)&&t(Ge)})}e.template_effect(()=>{oe=e.set_class(V,1,"tab gap-2",null,oe,{"tab-active":e.get(r)==="connections"}),ie=e.set_class(H,1,"tab gap-2",null,ie,{"tab-active":e.get(r)==="webhooks"}),de=e.set_class(G,1,"tab gap-2",null,de,{"tab-active":e.get(r)==="logs"})}),e.delegated("click",V,()=>e.set(r,"connections")),e.delegated("click",H,()=>e.set(r,"webhooks")),e.delegated("click",G,()=>e.set(r,"logs")),e.append(l,F),e.pop()}e.delegate(["click"]);function ne(){const l=window.__zveltio;l&&l.registerRoute({path:"api-connector",component:Ie,label:"API Connector",icon:"Plug",category:"integrations"})}return ne(),ne})(window.__SvelteRuntime.__unknown,window.__SvelteRuntime.internal_client,window.__SvelteRuntime.svelte);
