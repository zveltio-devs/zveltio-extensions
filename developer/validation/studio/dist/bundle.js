var ZveltioExt=(function(st,Oe,Me){"use strict";function ze(s){const i=Object.create(null,{[Symbol.toStringTag]:{value:"Module"}});if(s){for(const d in s)if(d!=="default"){const o=Object.getOwnPropertyDescriptor(s,d);Object.defineProperty(i,d,o.get?o:{enumerable:!0,get:()=>s[d]})}}return i.default=s,Object.freeze(i)}const e=ze(Oe);/**
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
 */const Te={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"};var De=e.from_svg("<svg><!><!></svg>");function A(s,i){e.push(i,!0);const d=e.prop(i,"color",3,"currentColor"),o=e.prop(i,"size",3,24),p=e.prop(i,"strokeWidth",3,2),g=e.prop(i,"absoluteStrokeWidth",3,!1),r=e.prop(i,"iconNode",19,()=>[]),c=e.rest_props(i,["$$slots","$$events","$$legacy","name","color","size","strokeWidth","absoluteStrokeWidth","iconNode","children"]);var h=De();e.attribute_effect(h,b=>({...Te,...c,width:o(),height:o(),stroke:d(),"stroke-width":b,class:["lucide-icon lucide",i.name&&`lucide-${i.name}`,i.class]}),[()=>g()?Number(p())*24/Number(o()):p()]);var f=e.child(h);e.each(f,17,r,e.index,(b,m)=>{var x=e.derived(()=>e.to_array(e.get(m),2));let L=()=>e.get(x)[0],F=()=>e.get(x)[1];var q=e.comment(),I=e.first_child(q);e.element(I,L,!0,(V,G)=>{e.attribute_effect(V,()=>({...F()}))}),e.append(b,q)});var a=e.sibling(f);e.snippet(a,()=>i.children??e.noop),e.reset(h),e.append(s,h),e.pop()}function Ae(s,i){e.push(i,!0);/**
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
 */let d=e.rest_props(i,["$$slots","$$events","$$legacy"]);const o=[["path",{d:"M5 12h14"}],["path",{d:"M12 5v14"}]];A(s,e.spread_props({name:"plus"},()=>d,{get iconNode(){return o},children:(p,g)=>{var r=e.comment(),c=e.first_child(r);e.snippet(c,()=>i.children??e.noop),e.append(p,r)},$$slots:{default:!0}})),e.pop()}function qe(s,i){e.push(i,!0);/**
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
 */let d=e.rest_props(i,["$$slots","$$events","$$legacy"]);const o=[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"}],["path",{d:"m9 12 2 2 4-4"}]];A(s,e.spread_props({name:"shield-check"},()=>d,{get iconNode(){return o},children:(p,g)=>{var r=e.comment(),c=e.first_child(r);e.snippet(c,()=>i.children??e.noop),e.append(p,r)},$$slots:{default:!0}})),e.pop()}function Ee(s,i){e.push(i,!0);/**
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
 */let d=e.rest_props(i,["$$slots","$$events","$$legacy"]);const o=[["path",{d:"M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"}],["path",{d:"M20 3v4"}],["path",{d:"M22 5h-4"}],["path",{d:"M4 17v2"}],["path",{d:"M5 18H3"}]];A(s,e.spread_props({name:"sparkles"},()=>d,{get iconNode(){return o},children:(p,g)=>{var r=e.comment(),c=e.first_child(r);e.snippet(c,()=>i.children??e.noop),e.append(p,r)},$$slots:{default:!0}})),e.pop()}function Je(s,i){e.push(i,!0);/**
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
 */let d=e.rest_props(i,["$$slots","$$events","$$legacy"]);const o=[["path",{d:"M18 6 6 18"}],["path",{d:"m6 6 12 12"}]];A(s,e.spread_props({name:"x"},()=>d,{get iconNode(){return o},children:(p,g)=>{var r=e.comment(),c=e.first_child(r);e.snippet(c,()=>i.children??e.noop),e.append(p,r)},$$slots:{default:!0}})),e.pop()}var We=e.from_html('<div class="alert alert-error"> </div>'),Le=e.from_html("<option> </option>"),Fe=e.from_html('<tr><td colspan="6" class="text-center py-6 text-base-content/60">No validation rules.</td></tr>'),Ie=e.from_html('<tr><td><span class="badge badge-ghost badge-sm"> </span></td><td class="font-mono text-xs"> </td><td> </td><td class="max-w-xs truncate"> </td><td><span> </span></td><td><button class="btn btn-ghost btn-xs">Delete</button></td></tr>'),Ve=e.from_html("<option> </option>"),Ge=e.from_html(`<div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><div class="bg-base-100 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"><div class="flex items-center justify-between mb-4"><h2 class="text-xl font-semibold">New validation rule</h2> <button class="btn btn-ghost btn-sm btn-square"><!></button></div> <div class="grid grid-cols-2 gap-3"><div><label class="label label-text">Collection</label> <select class="select select-bordered w-full"><option>—</option><!></select></div> <div><label class="label label-text">Field</label><input class="input input-bordered w-full font-mono"/></div> <div><label class="label label-text">Field type</label> <select class="select select-bordered w-full"><option>text</option><option>integer</option><option>number</option><option>email</option><option>date</option><option>uuid</option><option>boolean</option></select></div> <div><label class="label label-text">Rule type</label> <select class="select select-bordered w-full"><option>required</option><option>min</option><option>max</option><option>pattern (regex)</option><option>enum</option><option>custom</option></select></div> <div><label class="label label-text">Severity</label> <select class="select select-bordered w-full"><option>error (block)</option><option>warning (allow)</option></select></div></div> <div class="bg-base-200 rounded-lg p-3 mt-4"><div class="flex items-center gap-2 mb-2"><!> <span class="font-medium text-sm">AI-assisted</span></div> <div class="flex gap-2"><input class="input input-sm input-bordered flex-1" placeholder="e.g. 'Romanian CNP - 13 digits'"/> <button class="btn btn-primary btn-sm"> </button></div> <p class="text-xs text-base-content/60 mt-1">Requires the AI extension to be active.</p></div> <div class="mt-3"><label class="label label-text">Description</label><input class="input input-bordered w-full"/></div> <div><label class="label label-text">Config (JSON)</label><textarea class="textarea textarea-bordered w-full font-mono text-xs" rows="6"></textarea></div> <div class="flex justify-end gap-2 mt-4"><button class="btn btn-ghost">Cancel</button> <button class="btn btn-primary"> </button></div></div></div>`),Ue=e.from_html('<div class="p-6 space-y-4"><header class="flex items-center justify-between"><h1 class="text-2xl font-semibold flex items-center gap-2"><!> Data Validation Rules</h1> <button class="btn btn-primary btn-sm gap-2"><!> New rule</button></header> <!> <div class="flex gap-3"><select class="select select-sm select-bordered"><option>All collections</option><!></select></div> <div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Collection</th><th>Field</th><th>Rule type</th><th>Description</th><th>Severity</th><th></th></tr></thead><tbody><!></tbody></table></div></div> <!>',1);function Be(s,i){var xe;e.push(i,!0);const d=((xe=window.__zveltio)==null?void 0:xe.engineUrl)??"";let o=e.state(e.proxy([])),p=e.state(e.proxy([])),g=e.state(""),r=e.state(""),c=e.state(!1),h=e.state(!1),f=e.state(!1),a=e.state(e.proxy({collection:"",field_name:"",field_type:"text",rule_type:"required",description:"",config:"{}",severity:"error"})),b=e.state("");async function m(t,l){const v=await fetch(`${d}${t}`,{credentials:"include",...l}),_=await v.json().catch(()=>({}));if(!v.ok)throw new Error(_.error||`HTTP ${v.status}`);return _}async function x(){try{const t=new URLSearchParams;e.get(g)&&t.set("collection",e.get(g));const l=await m(`/api/validation/rules?${t}`);e.set(o,l.data??[],!0)}catch(t){e.set(r,t.message,!0)}}async function L(){try{const t=await m("/api/collections");e.set(p,t.collections??t.data??[],!0)}catch{e.set(p,[],!0)}}async function F(){e.set(h,!0),e.set(r,"");try{let t={};try{t=JSON.parse(e.get(a).config)}catch{throw new Error("Invalid JSON in config")}await m("/api/validation/rules",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...e.get(a),config:t})}),e.set(c,!1),e.set(a,{collection:"",field_name:"",field_type:"text",rule_type:"required",description:"",config:"{}",severity:"error"},!0),e.set(b,""),await x()}catch(t){e.set(r,t.message,!0)}finally{e.set(h,!1)}}async function q(){if(!(!e.get(b).trim()||!e.get(a).field_name)){e.set(f,!0),e.set(r,"");try{const t=await m("/api/validation/ai-generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({field_name:e.get(a).field_name,field_type:e.get(a).field_type,description:e.get(b)})}),l=t.data??t;e.get(a).rule_type=l.rule_type??e.get(a).rule_type,e.get(a).description=l.description??e.get(b),e.get(a).config=JSON.stringify(l.config??{},null,2)}catch(t){e.set(r,t.message,!0)}finally{e.set(f,!1)}}}async function I(t){if(confirm("Delete rule?"))try{await m(`/api/validation/rules/${t}`,{method:"DELETE"}),await x()}catch(l){e.set(r,l.message,!0)}}e.user_effect(()=>{e.get(g),x()}),Me.onMount(()=>{L(),x()});function V(t){return t==="error"?"badge-error":"badge-warning"}var G=Ue(),U=e.first_child(G),B=e.child(U),H=e.child(B),He=e.child(H);qe(He,{class:"h-6 w-6"}),e.next(),e.reset(H);var X=e.sibling(H,2),Xe=e.child(X);Ae(Xe,{class:"h-4 w-4"}),e.next(),e.reset(X),e.reset(B);var be=e.sibling(B,2);{var Ze=t=>{var l=We(),v=e.child(l,!0);e.reset(l),e.template_effect(()=>e.set_text(v,e.get(r))),e.append(t,l)};e.if(be,t=>{e.get(r)&&t(Ze)})}var Z=e.sibling(be,2),K=e.child(Z),Q=e.child(K);Q.value=Q.__value="";var Ke=e.sibling(Q);e.each(Ke,17,()=>e.get(p),t=>t.name,(t,l)=>{var v=Le(),_=e.child(v,!0);e.reset(v);var u={};e.template_effect(()=>{e.set_text(_,e.get(l).display_name??e.get(l).name),u!==(u=e.get(l).name)&&(v.value=(v.__value=e.get(l).name)??"")}),e.append(t,v)}),e.reset(K),e.reset(Z);var he=e.sibling(Z,2),fe=e.child(he),me=e.sibling(e.child(fe)),Qe=e.child(me);{var Ye=t=>{var l=Fe();e.append(t,l)},et=t=>{var l=e.comment(),v=e.first_child(l);e.each(v,17,()=>e.get(o),_=>_.id,(_,u)=>{var R=Ie(),y=e.child(R),C=e.child(y),j=e.child(C,!0);e.reset(C),e.reset(y);var w=e.sibling(y),Y=e.child(w,!0);e.reset(w);var k=e.sibling(w),E=e.child(k,!0);e.reset(k);var N=e.sibling(k),O=e.child(N,!0);e.reset(N);var S=e.sibling(N),$=e.child(S),M=e.child($,!0);e.reset($),e.reset(S);var P=e.sibling(S),z=e.child(P);e.reset(P),e.reset(R),e.template_effect(T=>{e.set_text(j,e.get(u).collection),e.set_text(Y,e.get(u).field_name??"—"),e.set_text(E,e.get(u).rule_type),e.set_text(O,e.get(u).description??"—"),e.set_class($,1,`badge ${T??""} badge-sm`),e.set_text(M,e.get(u).severity)},[()=>V(e.get(u).severity)]),e.delegated("click",z,()=>I(e.get(u).id)),e.append(_,R)}),e.append(t,l)};e.if(Qe,t=>{e.get(o).length===0?t(Ye):t(et,-1)})}e.reset(me),e.reset(fe),e.reset(he),e.reset(U);var tt=e.sibling(U,2);{var it=t=>{var l=Ge(),v=e.child(l),_=e.child(v),u=e.sibling(e.child(_),2),R=e.child(u);Je(R,{class:"h-4 w-4"}),e.reset(u),e.reset(_);var y=e.sibling(_,2),C=e.child(y),j=e.sibling(e.child(C),2),w=e.child(j);w.value=w.__value="";var Y=e.sibling(w);e.each(Y,17,()=>e.get(p),n=>n.name,(n,_e)=>{var D=Ve(),rt=e.child(D,!0);e.reset(D);var je={};e.template_effect(()=>{e.set_text(rt,e.get(_e).name),je!==(je=e.get(_e).name)&&(D.value=(D.__value=e.get(_e).name)??"")}),e.append(n,D)}),e.reset(j),e.reset(C);var k=e.sibling(C,2),E=e.sibling(e.child(k));e.remove_input_defaults(E),e.reset(k);var N=e.sibling(k,2),O=e.sibling(e.child(N),2),S=e.child(O);S.value=S.__value="text";var $=e.sibling(S);$.value=$.__value="integer";var M=e.sibling($);M.value=M.__value="number";var P=e.sibling(M);P.value=P.__value="email";var z=e.sibling(P);z.value=z.__value="date";var T=e.sibling(z);T.value=T.__value="uuid";var ye=e.sibling(T);ye.value=ye.__value="boolean",e.reset(O),e.reset(N);var ee=e.sibling(N,2),te=e.sibling(e.child(ee),2),ie=e.child(te);ie.value=ie.__value="required";var ae=e.sibling(ie);ae.value=ae.__value="min";var le=e.sibling(ae);le.value=le.__value="max";var ne=e.sibling(le);ne.value=ne.__value="pattern";var re=e.sibling(ne);re.value=re.__value="enum";var we=e.sibling(re);we.value=we.__value="custom",e.reset(te),e.reset(ee);var ke=e.sibling(ee,2),se=e.sibling(e.child(ke),2),oe=e.child(se);oe.value=oe.__value="error";var Ne=e.sibling(oe);Ne.value=Ne.__value="warning",e.reset(se),e.reset(ke),e.reset(y);var de=e.sibling(y,2),ce=e.child(de),at=e.child(ce);Ee(at,{class:"h-4 w-4 text-primary"}),e.next(2),e.reset(ce);var Se=e.sibling(ce,2),ve=e.child(Se);e.remove_input_defaults(ve);var J=e.sibling(ve,2),lt=e.child(J,!0);e.reset(J),e.reset(Se),e.next(2),e.reset(de);var pe=e.sibling(de,2),$e=e.sibling(e.child(pe));e.remove_input_defaults($e),e.reset(pe);var ue=e.sibling(pe,2),Ce=e.sibling(e.child(ue));e.remove_textarea_child(Ce),e.reset(ue);var Pe=e.sibling(ue,2),Re=e.child(Pe),W=e.sibling(Re,2),nt=e.child(W,!0);e.reset(W),e.reset(Pe),e.reset(v),e.reset(l),e.template_effect(n=>{J.disabled=n,e.set_text(lt,e.get(f)?"…":"Generate"),W.disabled=e.get(h)||!e.get(a).collection||!e.get(a).field_name,e.set_text(nt,e.get(h)?"Saving…":"Create rule")},[()=>e.get(f)||!e.get(b).trim()||!e.get(a).field_name]),e.delegated("click",l,n=>n.target===n.currentTarget&&e.set(c,!1)),e.delegated("click",u,()=>e.set(c,!1)),e.bind_select_value(j,()=>e.get(a).collection,n=>e.get(a).collection=n),e.bind_value(E,()=>e.get(a).field_name,n=>e.get(a).field_name=n),e.bind_select_value(O,()=>e.get(a).field_type,n=>e.get(a).field_type=n),e.bind_select_value(te,()=>e.get(a).rule_type,n=>e.get(a).rule_type=n),e.bind_select_value(se,()=>e.get(a).severity,n=>e.get(a).severity=n),e.bind_value(ve,()=>e.get(b),n=>e.set(b,n)),e.delegated("click",J,q),e.bind_value($e,()=>e.get(a).description,n=>e.get(a).description=n),e.bind_value(Ce,()=>e.get(a).config,n=>e.get(a).config=n),e.delegated("click",Re,()=>e.set(c,!1)),e.delegated("click",W,F),e.append(t,l)};e.if(tt,t=>{e.get(c)&&t(it)})}e.delegated("click",X,()=>e.set(c,!0)),e.bind_select_value(K,()=>e.get(g),t=>e.set(g,t)),e.append(s,G),e.pop()}e.delegate(["click"]);function ge(){const s=window.__zveltio;s&&s.registerRoute({path:"validation",component:Be,label:"Validation Rules",icon:"ShieldCheck",category:"developer"})}return ge(),ge})(window.__SvelteRuntime.__unknown,window.__SvelteRuntime.internal_client,window.__SvelteRuntime.svelte);
