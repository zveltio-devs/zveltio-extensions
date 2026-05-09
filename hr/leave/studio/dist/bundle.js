var ZveltioExt=(function(De,_e,ue){"use strict";function he(l){const t=Object.create(null,{[Symbol.toStringTag]:{value:"Module"}});if(l){for(const c in l)if(c!=="default"){const n=Object.getOwnPropertyDescriptor(l,c);Object.defineProperty(t,c,n.get?n:{enumerable:!0,get:()=>l[c]})}}return t.default=l,Object.freeze(t)}const e=he(_e);/**
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
 */const ge={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"};var be=e.from_svg("<svg><!><!></svg>");function U(l,t){e.push(t,!0);const c=e.prop(t,"color",3,"currentColor"),n=e.prop(t,"size",3,24),_=e.prop(t,"strokeWidth",3,2),m=e.prop(t,"absoluteStrokeWidth",3,!1),d=e.prop(t,"iconNode",19,()=>[]),o=e.rest_props(t,["$$slots","$$events","$$legacy","name","color","size","strokeWidth","absoluteStrokeWidth","iconNode","children"]);var b=be();e.attribute_effect(b,i=>({...ge,...o,width:n(),height:n(),stroke:c(),"stroke-width":i,class:["lucide-icon lucide",t.name&&`lucide-${t.name}`,t.class]}),[()=>m()?Number(_())*24/Number(n()):_()]);var f=e.child(b);e.each(f,17,d,e.index,(i,x)=>{var w=e.derived(()=>e.to_array(e.get(x),2));let G=()=>e.get(w)[0],B=()=>e.get(w)[1];var H=e.comment(),I=e.first_child(H);e.element(I,G,!0,(T,J)=>{e.attribute_effect(T,()=>({...B()}))}),e.append(i,H)});var S=e.sibling(f);e.snippet(S,()=>t.children??e.noop),e.reset(b),e.append(l,b),e.pop()}function fe(l,t){e.push(t,!0);/**
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
 */let c=e.rest_props(t,["$$slots","$$events","$$legacy"]);const n=[["path",{d:"M8 2v4"}],["path",{d:"M16 2v4"}],["rect",{width:"18",height:"18",x:"3",y:"4",rx:"2"}],["path",{d:"M3 10h18"}],["path",{d:"M8 14h.01"}],["path",{d:"M12 14h.01"}],["path",{d:"M16 14h.01"}],["path",{d:"M8 18h.01"}],["path",{d:"M12 18h.01"}],["path",{d:"M16 18h.01"}]];U(l,e.spread_props({name:"calendar-days"},()=>c,{get iconNode(){return n},children:(_,m)=>{var d=e.comment(),o=e.first_child(d);e.snippet(o,()=>t.children??e.noop),e.append(_,d)},$$slots:{default:!0}})),e.pop()}function me(l,t){e.push(t,!0);/**
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
 */let c=e.rest_props(t,["$$slots","$$events","$$legacy"]);const n=[["path",{d:"M20 6 9 17l-5-5"}]];U(l,e.spread_props({name:"check"},()=>c,{get iconNode(){return n},children:(_,m)=>{var d=e.comment(),o=e.first_child(d);e.snippet(o,()=>t.children??e.noop),e.append(_,d)},$$slots:{default:!0}})),e.pop()}function ye(l,t){e.push(t,!0);/**
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
 */let c=e.rest_props(t,["$$slots","$$events","$$legacy"]);const n=[["path",{d:"M5 12h14"}],["path",{d:"M12 5v14"}]];U(l,e.spread_props({name:"plus"},()=>c,{get iconNode(){return n},children:(_,m)=>{var d=e.comment(),o=e.first_child(d);e.snippet(o,()=>t.children??e.noop),e.append(_,d)},$$slots:{default:!0}})),e.pop()}function le(l,t){e.push(t,!0);/**
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
 */let c=e.rest_props(t,["$$slots","$$events","$$legacy"]);const n=[["path",{d:"M18 6 6 18"}],["path",{d:"m6 6 12 12"}]];U(l,e.spread_props({name:"x"},()=>c,{get iconNode(){return n},children:(_,m)=>{var d=e.comment(),o=e.first_child(d);e.snippet(o,()=>t.children??e.noop),e.append(_,d)},$$slots:{default:!0}})),e.pop()}var xe=e.from_html('<div class="alert alert-error"> </div>'),we=e.from_html('<tr><td colspan="7" class="text-center py-6 text-base-content/60">Loading…</td></tr>'),ke=e.from_html('<tr><td colspan="7" class="text-center py-6 text-base-content/60">No requests.</td></tr>'),$e=e.from_html('<button class="btn btn-ghost btn-xs" title="Approve"><!></button> <button class="btn btn-ghost btn-xs" title="Reject"><!></button>',1),Ne=e.from_html("<tr><td> </td><td> </td><td> </td><td> </td><td> </td><td><span> </span></td><td><!></td></tr>"),je=e.from_html("<option> </option>"),Me=e.from_html("<option> </option>"),Se=e.from_html('<div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><div class="bg-base-100 rounded-xl p-6 w-full max-w-md"><div class="flex items-center justify-between mb-4"><h2 class="text-xl font-semibold">New leave request</h2> <button class="btn btn-ghost btn-sm btn-square"><!></button></div> <div class="space-y-3"><div><label class="label label-text">Employee</label> <select class="select select-bordered w-full"><option>—</option><!></select></div> <div><label class="label label-text">Leave type</label> <select class="select select-bordered w-full"><option>—</option><!></select></div> <div><label class="label label-text">Start date</label><input type="date" class="input input-bordered w-full"/></div> <div><label class="label label-text">End date</label><input type="date" class="input input-bordered w-full"/></div> <div><label class="label label-text">Reason</label><textarea class="textarea textarea-bordered w-full"></textarea></div></div> <div class="flex justify-end gap-2 mt-4"><button class="btn btn-ghost">Cancel</button> <button class="btn btn-primary"> </button></div></div></div>'),Pe=e.from_html('<div class="p-6 space-y-4"><header class="flex items-center justify-between"><h1 class="text-2xl font-semibold flex items-center gap-2"><!> Leave</h1> <button class="btn btn-primary btn-sm gap-2"><!> New request</button></header> <!> <div class="flex gap-3"><select class="select select-sm select-bordered"><option>All</option><option>Pending</option><option>Approved</option><option>Rejected</option></select></div> <div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Employee</th><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Status</th><th></th></tr></thead><tbody><!></tbody></table></div></div> <!>',1);function qe(l,t){var pe;e.push(t,!0);const c=((pe=window.__zveltio)==null?void 0:pe.engineUrl)??"";let n=e.state(e.proxy([])),_=e.state(e.proxy([])),m=e.state(e.proxy([])),d=e.state(!1),o=e.state(""),b=e.state("all"),f=e.state(!1),S=e.state(!1),i=e.state(e.proxy({employee_id:"",leave_type_id:"",start_date:"",end_date:"",reason:""}));async function x(a,r){const p=await fetch(`${c}${a}`,{credentials:"include",...r}),h=await p.json().catch(()=>({}));if(!p.ok)throw new Error(h.error||`HTTP ${p.status}`);return h}async function w(){e.set(d,!0),e.set(o,"");try{const a=new URLSearchParams;e.get(b)!=="all"&&a.set("status",e.get(b));const[r,p,h]=await Promise.all([x(`/api/leave/requests?${a}`),x("/api/hr?limit=200"),x("/api/leave/types")]);e.set(n,r.data??[],!0),e.set(_,p.data??[],!0),e.set(m,h.data??[],!0)}catch(a){e.set(o,a.message,!0)}finally{e.set(d,!1)}}async function G(){e.set(S,!0),e.set(o,"");try{await x("/api/leave/requests",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(e.get(i))}),e.set(f,!1),e.set(i,{employee_id:"",leave_type_id:"",start_date:"",end_date:"",reason:""},!0),await w()}catch(a){e.set(o,a.message,!0)}finally{e.set(S,!1)}}async function B(a,r){try{await x(`/api/leave/requests/${a}/${r?"approve":"reject"}`,{method:"POST"}),await w()}catch(p){e.set(o,p.message,!0)}}ue.onMount(w),e.user_effect(()=>{e.get(b),w()});function H(a){return{pending:"badge-warning",approved:"badge-success",rejected:"badge-error",cancelled:"badge-ghost"}[a]??"badge-ghost"}var I=Pe(),T=e.first_child(I),J=e.child(T),K=e.child(J),Te=e.child(K);fe(Te,{class:"h-6 w-6"}),e.next(),e.reset(K);var Q=e.sibling(K,2),Re=e.child(Q);ye(Re,{class:"h-4 w-4"}),e.next(),e.reset(Q),e.reset(J);var ne=e.sibling(J,2);{var ze=a=>{var r=xe(),p=e.child(r,!0);e.reset(r),e.template_effect(()=>e.set_text(p,e.get(o))),e.append(a,r)};e.if(ne,a=>{e.get(o)&&a(ze)})}var Y=e.sibling(ne,2),ee=e.child(Y),te=e.child(ee);te.value=te.__value="all";var ae=e.sibling(te);ae.value=ae.__value="pending";var se=e.sibling(ae);se.value=se.__value="approved";var de=e.sibling(se);de.value=de.__value="rejected",e.reset(ee),e.reset(Y);var oe=e.sibling(Y,2),ce=e.child(oe),ve=e.sibling(e.child(ce)),Oe=e.child(ve);{var Ce=a=>{var r=we();e.append(a,r)},Le=a=>{var r=ke();e.append(a,r)},We=a=>{var r=e.comment(),p=e.first_child(r);e.each(p,17,()=>e.get(n),h=>h.id,(h,v)=>{var R=Ne(),k=e.child(R),z=e.child(k,!0);e.reset(k);var $=e.sibling(k),O=e.child($,!0);e.reset($);var C=e.sibling($),L=e.child(C,!0);e.reset(C);var N=e.sibling(C),W=e.child(N,!0);e.reset(N);var A=e.sibling(N),E=e.child(A,!0);e.reset(A);var P=e.sibling(A),j=e.child(P),V=e.child(j,!0);e.reset(j),e.reset(P);var D=e.sibling(P),X=e.child(D);{var Z=y=>{var M=$e(),q=e.first_child(M),s=e.child(q);me(s,{class:"h-3.5 w-3.5"}),e.reset(q);var g=e.sibling(q,2),u=e.child(g);le(u,{class:"h-3.5 w-3.5"}),e.reset(g),e.delegated("click",q,()=>B(e.get(v).id,!0)),e.delegated("click",g,()=>B(e.get(v).id,!1)),e.append(y,M)};e.if(X,y=>{e.get(v).status==="pending"&&y(Z)})}e.reset(D),e.reset(R),e.template_effect(y=>{e.set_text(z,e.get(v).employee_name??e.get(v).employee_id),e.set_text(O,e.get(v).leave_type_name??"—"),e.set_text(L,e.get(v).start_date),e.set_text(W,e.get(v).end_date),e.set_text(E,e.get(v).working_days??"—"),e.set_class(j,1,`badge ${y??""} badge-sm`),e.set_text(V,e.get(v).status)},[()=>H(e.get(v).status)]),e.append(h,R)}),e.append(a,r)};e.if(Oe,a=>{e.get(d)?a(Ce):e.get(n).length===0?a(Le,1):a(We,-1)})}e.reset(ve),e.reset(ce),e.reset(oe),e.reset(T);var Ae=e.sibling(T,2);{var Ee=a=>{var r=Se(),p=e.child(r),h=e.child(p),v=e.sibling(e.child(h),2),R=e.child(v);le(R,{class:"h-4 w-4"}),e.reset(v),e.reset(h);var k=e.sibling(h,2),z=e.child(k),$=e.sibling(e.child(z),2),O=e.child($);O.value=O.__value="";var C=e.sibling(O);e.each(C,17,()=>e.get(_),s=>s.id,(s,g)=>{var u=je(),re=e.child(u);e.reset(u);var F={};e.template_effect(()=>{e.set_text(re,`${e.get(g).first_name??""} ${e.get(g).last_name??""}`),F!==(F=e.get(g).id)&&(u.value=(u.__value=e.get(g).id)??"")}),e.append(s,u)}),e.reset($),e.reset(z);var L=e.sibling(z,2),N=e.sibling(e.child(L),2),W=e.child(N);W.value=W.__value="";var A=e.sibling(W);e.each(A,17,()=>e.get(m),s=>s.id,(s,g)=>{var u=Me(),re=e.child(u,!0);e.reset(u);var F={};e.template_effect(()=>{e.set_text(re,e.get(g).name),F!==(F=e.get(g).id)&&(u.value=(u.__value=e.get(g).id)??"")}),e.append(s,u)}),e.reset(N),e.reset(L);var E=e.sibling(L,2),P=e.sibling(e.child(E));e.remove_input_defaults(P),e.reset(E);var j=e.sibling(E,2),V=e.sibling(e.child(j));e.remove_input_defaults(V),e.reset(j);var D=e.sibling(j,2),X=e.sibling(e.child(D));e.remove_textarea_child(X),e.reset(D),e.reset(k);var Z=e.sibling(k,2),y=e.child(Z),M=e.sibling(y,2),q=e.child(M,!0);e.reset(M),e.reset(Z),e.reset(p),e.reset(r),e.template_effect(()=>{M.disabled=e.get(S)||!e.get(i).employee_id||!e.get(i).start_date||!e.get(i).end_date,e.set_text(q,e.get(S)?"Saving…":"Submit request")}),e.delegated("click",r,s=>s.target===s.currentTarget&&e.set(f,!1)),e.delegated("click",v,()=>e.set(f,!1)),e.bind_select_value($,()=>e.get(i).employee_id,s=>e.get(i).employee_id=s),e.bind_select_value(N,()=>e.get(i).leave_type_id,s=>e.get(i).leave_type_id=s),e.bind_value(P,()=>e.get(i).start_date,s=>e.get(i).start_date=s),e.bind_value(V,()=>e.get(i).end_date,s=>e.get(i).end_date=s),e.bind_value(X,()=>e.get(i).reason,s=>e.get(i).reason=s),e.delegated("click",y,()=>e.set(f,!1)),e.delegated("click",M,G),e.append(a,r)};e.if(Ae,a=>{e.get(f)&&a(Ee)})}e.delegated("click",Q,()=>e.set(f,!0)),e.bind_select_value(ee,()=>e.get(b),a=>e.set(b,a)),e.append(l,I),e.pop()}e.delegate(["click"]);function ie(){const l=window.__zveltio;l&&l.registerRoute({path:"hr-leave",component:qe,label:"Leave Management",icon:"CalendarDays",category:"hr"})}return ie(),ie})(window.__SvelteRuntime.__unknown,window.__SvelteRuntime.internal_client,window.__SvelteRuntime.svelte);
