var ZveltioExt=(function(Wt,lt){"use strict";function it(i){const r=Object.create(null,{[Symbol.toStringTag]:{value:"Module"}});if(i){for(const c in i)if(c!=="default"){const a=Object.getOwnPropertyDescriptor(i,c);Object.defineProperty(r,c,a.get?a:{enumerable:!0,get:()=>i[c]})}}return r.default=i,Object.freeze(r)}const t=it(lt);/**
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
 */const nt={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"};var dt=t.from_svg("<svg><!><!></svg>");function E(i,r){t.push(r,!0);const c=t.prop(r,"color",3,"currentColor"),a=t.prop(r,"size",3,24),u=t.prop(r,"strokeWidth",3,2),w=t.prop(r,"absoluteStrokeWidth",3,!1),p=t.prop(r,"iconNode",19,()=>[]),v=t.rest_props(r,["$$slots","$$events","$$legacy","name","color","size","strokeWidth","absoluteStrokeWidth","iconNode","children"]);var k=dt();t.attribute_effect(k,P=>({...nt,...v,width:a(),height:a(),stroke:c(),"stroke-width":P,class:["lucide-icon lucide",r.name&&`lucide-${r.name}`,r.class]}),[()=>w()?Number(u())*24/Number(a()):u()]);var S=t.child(k);t.each(S,17,p,t.index,(P,F)=>{var V=t.derived(()=>t.to_array(t.get(F),2));let G=()=>t.get(V)[0],I=()=>t.get(V)[1];var T=t.comment(),R=t.first_child(T);t.element(R,G,!0,(H,K)=>{t.attribute_effect(H,()=>({...I()}))}),t.append(P,T)});var O=t.sibling(S);t.snippet(O,()=>r.children??t.noop),t.reset(k),t.append(i,k),t.pop()}function ct(i,r){t.push(r,!0);/**
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
 */let c=t.rest_props(r,["$$slots","$$events","$$legacy"]);const a=[["rect",{x:"16",y:"16",width:"6",height:"6",rx:"1"}],["rect",{x:"2",y:"16",width:"6",height:"6",rx:"1"}],["rect",{x:"9",y:"2",width:"6",height:"6",rx:"1"}],["path",{d:"M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"}],["path",{d:"M12 12V8"}]];E(i,t.spread_props({name:"network"},()=>c,{get iconNode(){return a},children:(u,w)=>{var p=t.comment(),v=t.first_child(p);t.snippet(v,()=>r.children??t.noop),t.append(u,p)},$$slots:{default:!0}})),t.pop()}function B(i,r){t.push(r,!0);/**
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
 */let c=t.rest_props(r,["$$slots","$$events","$$legacy"]);const a=[["polygon",{points:"6 3 20 12 6 21 6 3"}]];E(i,t.spread_props({name:"play"},()=>c,{get iconNode(){return a},children:(u,w)=>{var p=t.comment(),v=t.first_child(p);t.snippet(v,()=>r.children??t.noop),t.append(u,p)},$$slots:{default:!0}})),t.pop()}function vt(i,r){t.push(r,!0);/**
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
 */let c=t.rest_props(r,["$$slots","$$events","$$legacy"]);const a=[["path",{d:"M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"}],["path",{d:"M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"}],["path",{d:"M7 3v4a1 1 0 0 0 1 1h7"}]];E(i,t.spread_props({name:"save"},()=>c,{get iconNode(){return a},children:(u,w)=>{var p=t.comment(),v=t.first_child(p);t.snippet(v,()=>r.children??t.noop),t.append(u,p)},$$slots:{default:!0}})),t.pop()}var ht=t.from_html('<div class="alert alert-error"> </div>'),pt=t.from_html('<div class="grid grid-cols-2 gap-4 h-[60vh]"><div class="bg-base-100 rounded-lg shadow flex flex-col"><div class="p-3 border-b flex items-center justify-between"><span class="font-medium text-sm">Query</span><button class="btn btn-primary btn-sm gap-2"><!> </button></div> <textarea class="textarea textarea-ghost flex-1 font-mono text-sm rounded-none"></textarea></div> <div class="bg-base-100 rounded-lg shadow flex flex-col"><div class="p-3 border-b font-medium text-sm">Response</div> <pre class="flex-1 p-3 overflow-auto font-mono text-xs"> </pre></div></div>'),_t=t.from_html('<tr><td colspan="5" class="text-center py-6 text-base-content/60">No operations logged.</td></tr>'),gt=t.from_html('<tr><td> </td><td class="font-mono text-xs max-w-xs truncate"> </td><td> </td><td> </td><td><span> </span></td></tr>'),ut=t.from_html('<div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Time</th><th>Operation</th><th>User</th><th>Duration</th><th>Status</th></tr></thead><tbody><!></tbody></table></div>'),bt=t.from_html('<tr><td colspan="3" class="text-center py-6 text-base-content/60">No persisted queries.</td></tr>'),ft=t.from_html('<tr><td class="font-mono text-xs"> </td><td class="font-mono text-xs max-w-md truncate"> </td><td> </td></tr>'),mt=t.from_html('<div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>ID</th><th>Operation</th><th>Created</th></tr></thead><tbody><!></tbody></table></div>'),xt=t.from_html('<tr><td colspan="4" class="text-center py-6 text-base-content/60">No field policies — all fields readable.</td></tr>'),yt=t.from_html('<tr><td class="font-mono"> </td><td class="font-mono"> </td><td class="text-xs"> </td><td><span class="badge badge-sm"> </span></td></tr>'),wt=t.from_html('<div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Type</th><th>Field</th><th>Roles</th><th>Mode</th></tr></thead><tbody><!></tbody></table></div>'),kt=t.from_html('<div class="p-6 space-y-4"><header><h1 class="text-2xl font-semibold flex items-center gap-2"><!> GraphQL</h1></header> <!> <div role="tablist" class="tabs tabs-bordered"><button role="tab"><!> Playground</button> <button role="tab">Operation logs</button> <button role="tab"><!> Persisted queries</button> <button role="tab">Field policies</button></div> <!></div>');function Nt(i,r){var st;t.push(r,!0);const c=((st=window.__zveltio)==null?void 0:st.engineUrl)??"";let a=t.state("playground"),u=t.state(t.proxy([])),w=t.state(t.proxy([])),p=t.state(t.proxy([])),v=t.state(""),k=t.state(`{
  collections {
    name
    display_name
  }
}`),S=t.state(""),O=t.state(!1);async function P(e,s){const n=await fetch(`${c}${e}`,{credentials:"include",...s}),h=await n.json().catch(()=>({}));if(!n.ok)throw new Error(h.error||`HTTP ${n.status}`);return h}async function F(){t.set(O,!0),t.set(v,""),t.set(S,"");try{const s=await(await fetch(`${c}/api/graphql`,{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({query:t.get(k)})})).json();t.set(S,JSON.stringify(s,null,2),!0)}catch(e){t.set(v,e.message,!0)}finally{t.set(O,!1)}}async function V(){try{const e=await P("/api/graphql/operations?limit=100");t.set(u,e.data??[],!0)}catch(e){t.set(v,e.message,!0)}}async function G(){try{const e=await P("/api/graphql/persisted");t.set(w,e.data??[],!0)}catch(e){t.set(v,e.message,!0)}}async function I(){try{const e=await P("/api/graphql/field-policies");t.set(p,e.data??[],!0)}catch(e){t.set(v,e.message,!0)}}t.user_effect(()=>{t.get(a)==="logs"?V():t.get(a)==="persisted"?G():t.get(a)==="policies"&&I()});var T=kt(),R=t.child(T),H=t.child(R),K=t.child(H);ct(K,{class:"h-6 w-6"}),t.next(),t.reset(H),t.reset(R);var X=t.sibling(R,2);{var qt=e=>{var s=ht(),n=t.child(s,!0);t.reset(s),t.template_effect(()=>t.set_text(n,t.get(v))),t.append(e,s)};t.if(X,e=>{t.get(v)&&e(qt)})}var J=t.sibling(X,2),M=t.child(J);let Y;var Pt=t.child(M);B(Pt,{class:"h-4 w-4"}),t.next(),t.reset(M);var A=t.sibling(M,2);let tt;var W=t.sibling(A,2);let et;var jt=t.child(W);vt(jt,{class:"h-4 w-4"}),t.next(),t.reset(W);var rt=t.sibling(W,2);let at;t.reset(J);var St=t.sibling(J,2);{var Ot=e=>{var s=pt(),n=t.child(s),h=t.child(n),x=t.sibling(t.child(h)),N=t.child(x);B(N,{class:"h-3 w-3"});var j=t.sibling(N);t.reset(x),t.reset(h);var o=t.sibling(h,2);t.remove_textarea_child(o),t.reset(n);var d=t.sibling(n,2),q=t.sibling(t.child(d),2),g=t.child(q,!0);t.reset(q),t.reset(d),t.reset(s),t.template_effect(()=>{x.disabled=t.get(O),t.set_text(j,` ${t.get(O)?"Running…":"Run"}`),t.set_text(g,t.get(S)||"(run a query to see output)")}),t.delegated("click",x,F),t.bind_value(o,()=>t.get(k),l=>t.set(k,l)),t.append(e,s)},Tt=e=>{var s=ut(),n=t.child(s),h=t.sibling(t.child(n)),x=t.child(h);{var N=o=>{var d=_t();t.append(o,d)},j=o=>{var d=t.comment(),q=t.first_child(d);t.each(q,17,()=>t.get(u),g=>g.id,(g,l)=>{var b=gt(),f=t.child(b),$=t.child(f,!0);t.reset(f);var m=t.sibling(f),C=t.child(m,!0);t.reset(m);var y=t.sibling(m),D=t.child(y,!0);t.reset(y);var _=t.sibling(y),z=t.child(_);t.reset(_);var L=t.sibling(_),Q=t.child(L);let ot;var Mt=t.child(Q,!0);t.reset(Q),t.reset(L),t.reset(b),t.template_effect(U=>{t.set_text($,U),t.set_text(C,t.get(l).operation_name??t.get(l).query_preview),t.set_text(D,t.get(l).user_id??"anon"),t.set_text(z,`${t.get(l).duration_ms??"—"??""} ms`),ot=t.set_class(Q,1,"badge badge-sm",null,ot,{"badge-error":t.get(l).error}),t.set_text(Mt,t.get(l).error?"error":"ok")},[()=>{var U;return(U=t.get(l).created_at)==null?void 0:U.slice(0,19).replace("T"," ")}]),t.append(g,b)}),t.append(o,d)};t.if(x,o=>{t.get(u).length===0?o(N):o(j,-1)})}t.reset(h),t.reset(n),t.reset(s),t.append(e,s)},zt=e=>{var s=mt(),n=t.child(s),h=t.sibling(t.child(n)),x=t.child(h);{var N=o=>{var d=bt();t.append(o,d)},j=o=>{var d=t.comment(),q=t.first_child(d);t.each(q,17,()=>t.get(w),g=>g.id,(g,l)=>{var b=ft(),f=t.child(b),$=t.child(f);t.reset(f);var m=t.sibling(f),C=t.child(m,!0);t.reset(m);var y=t.sibling(m),D=t.child(y,!0);t.reset(y),t.reset(b),t.template_effect((_,z)=>{t.set_text($,`${_??""}…`),t.set_text(C,t.get(l).operation_name??t.get(l).query_preview),t.set_text(D,z)},[()=>{var _;return(_=t.get(l).id)==null?void 0:_.slice(0,16)},()=>{var _;return(_=t.get(l).created_at)==null?void 0:_.slice(0,10)}]),t.append(g,b)}),t.append(o,d)};t.if(x,o=>{t.get(w).length===0?o(N):o(j,-1)})}t.reset(h),t.reset(n),t.reset(s),t.append(e,s)},Rt=e=>{var s=wt(),n=t.child(s),h=t.sibling(t.child(n)),x=t.child(h);{var N=o=>{var d=xt();t.append(o,d)},j=o=>{var d=t.comment(),q=t.first_child(d);t.each(q,17,()=>t.get(p),g=>g.id,(g,l)=>{var b=yt(),f=t.child(b),$=t.child(f,!0);t.reset(f);var m=t.sibling(f),C=t.child(m,!0);t.reset(m);var y=t.sibling(m),D=t.child(y,!0);t.reset(y);var _=t.sibling(y),z=t.child(_),L=t.child(z,!0);t.reset(z),t.reset(_),t.reset(b),t.template_effect(Q=>{t.set_text($,t.get(l).type_name),t.set_text(C,t.get(l).field_name),t.set_text(D,Q),t.set_text(L,t.get(l).mode??"allow")},[()=>(t.get(l).allowed_roles??[]).join(", ")||"—"]),t.append(g,b)}),t.append(o,d)};t.if(x,o=>{t.get(p).length===0?o(N):o(j,-1)})}t.reset(h),t.reset(n),t.reset(s),t.append(e,s)};t.if(St,e=>{t.get(a)==="playground"?e(Ot):t.get(a)==="logs"?e(Tt,1):t.get(a)==="persisted"?e(zt,2):e(Rt,-1)})}t.reset(T),t.template_effect(()=>{Y=t.set_class(M,1,"tab gap-2",null,Y,{"tab-active":t.get(a)==="playground"}),tt=t.set_class(A,1,"tab",null,tt,{"tab-active":t.get(a)==="logs"}),et=t.set_class(W,1,"tab gap-2",null,et,{"tab-active":t.get(a)==="persisted"}),at=t.set_class(rt,1,"tab",null,at,{"tab-active":t.get(a)==="policies"})}),t.delegated("click",M,()=>t.set(a,"playground")),t.delegated("click",A,()=>t.set(a,"logs")),t.delegated("click",W,()=>t.set(a,"persisted")),t.delegated("click",rt,()=>t.set(a,"policies")),t.append(i,T),t.pop()}t.delegate(["click"]);function Z(){const i=window.__zveltio;i&&i.registerRoute({path:"graphql",component:Nt,label:"GraphQL",icon:"Network",category:"developer"})}return Z(),Z})(window.__SvelteRuntime.__unknown,window.__SvelteRuntime.internal_client);
