var ZveltioExt=(function(it,xe,we){"use strict";function ye(n){const t=Object.create(null,{[Symbol.toStringTag]:{value:"Module"}});if(n){for(const b in n)if(b!=="default"){const d=Object.getOwnPropertyDescriptor(n,b);Object.defineProperty(t,b,d.get?d:{enumerable:!0,get:()=>n[b]})}}return t.default=n,Object.freeze(t)}const e=ye(xe);/**
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
 */const ke={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"};var je=e.from_svg("<svg><!><!></svg>");function Z(n,t){e.push(t,!0);const b=e.prop(t,"color",3,"currentColor"),d=e.prop(t,"size",3,24),_=e.prop(t,"strokeWidth",3,2),u=e.prop(t,"absoluteStrokeWidth",3,!1),o=e.prop(t,"iconNode",19,()=>[]),v=e.rest_props(t,["$$slots","$$events","$$legacy","name","color","size","strokeWidth","absoluteStrokeWidth","iconNode","children"]);var T=je();e.attribute_effect(T,x=>({...ke,...v,width:d(),height:d(),stroke:b(),"stroke-width":x,class:["lucide-icon lucide",t.name&&`lucide-${t.name}`,t.class]}),[()=>u()?Number(_())*24/Number(d()):_()]);var A=e.child(T);e.each(A,17,o,e.index,(x,w)=>{var L=e.derived(()=>e.to_array(e.get(w),2));let U=()=>e.get(L)[0],G=()=>e.get(L)[1];var V=e.comment(),Y=e.first_child(V);e.element(Y,U,!0,(ee,ce)=>{e.attribute_effect(ee,()=>({...G()}))}),e.append(x,V)});var O=e.sibling(A);e.snippet(O,()=>t.children??e.noop),e.reset(T),e.append(n,T),e.pop()}function Ne(n,t){e.push(t,!0);/**
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
 */let b=e.rest_props(t,["$$slots","$$events","$$legacy"]);const d=[["path",{d:"M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"}],["path",{d:"M8 10v4"}],["path",{d:"M12 10v2"}],["path",{d:"M16 10v6"}]];Z(n,e.spread_props({name:"folder-kanban"},()=>b,{get iconNode(){return d},children:(_,u)=>{var o=e.comment(),v=e.first_child(o);e.snippet(v,()=>t.children??e.noop),e.append(_,o)},$$slots:{default:!0}})),e.pop()}function $e(n,t){e.push(t,!0);/**
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
 */let b=e.rest_props(t,["$$slots","$$events","$$legacy"]);const d=[["path",{d:"M3 12h.01"}],["path",{d:"M3 18h.01"}],["path",{d:"M3 6h.01"}],["path",{d:"M8 12h13"}],["path",{d:"M8 18h13"}],["path",{d:"M8 6h13"}]];Z(n,e.spread_props({name:"list"},()=>b,{get iconNode(){return d},children:(_,u)=>{var o=e.comment(),v=e.first_child(o);e.snippet(v,()=>t.children??e.noop),e.append(_,o)},$$slots:{default:!0}})),e.pop()}function ne(n,t){e.push(t,!0);/**
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
 */let b=e.rest_props(t,["$$slots","$$events","$$legacy"]);const d=[["path",{d:"M5 12h14"}],["path",{d:"M12 5v14"}]];Z(n,e.spread_props({name:"plus"},()=>b,{get iconNode(){return d},children:(_,u)=>{var o=e.comment(),v=e.first_child(o);e.snippet(v,()=>t.children??e.noop),e.append(_,o)},$$slots:{default:!0}})),e.pop()}function Se(n,t){e.push(t,!0);/**
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
 */let b=e.rest_props(t,["$$slots","$$events","$$legacy"]);const d=[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2"}],["path",{d:"M8 7v7"}],["path",{d:"M12 7v4"}],["path",{d:"M16 7v9"}]];Z(n,e.spread_props({name:"square-kanban"},()=>b,{get iconNode(){return d},children:(_,u)=>{var o=e.comment(),v=e.first_child(o);e.snippet(v,()=>t.children??e.noop),e.append(_,o)},$$slots:{default:!0}})),e.pop()}function de(n,t){e.push(t,!0);/**
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
 */let b=e.rest_props(t,["$$slots","$$events","$$legacy"]);const d=[["path",{d:"M18 6 6 18"}],["path",{d:"m6 6 12 12"}]];Z(n,e.spread_props({name:"x"},()=>b,{get iconNode(){return d},children:(_,u)=>{var o=e.comment(),v=e.first_child(o);e.snippet(v,()=>t.children??e.noop),e.append(_,o)},$$slots:{default:!0}})),e.pop()}var Pe=e.from_html('<div class="alert alert-error"> </div>'),Te=e.from_html('<div class="bg-base-100 rounded-lg p-12 text-center text-base-content/60">No projects yet — create one to start.</div>'),Me=e.from_html("<option> </option>"),Ce=e.from_html('<button class="btn btn-sm gap-2"><!> New task</button>'),Oe=e.from_html('<div class="text-xs text-base-content/60 mt-1 line-clamp-2"> </div>'),ze=e.from_html('<button class="btn btn-ghost btn-xs"> </button>'),De=e.from_html('<div class="bg-base-100 p-3 rounded shadow-sm cursor-move"><div class="font-medium text-sm"> </div> <!> <div class="flex gap-1 mt-2"></div></div>'),Fe=e.from_html('<div class="bg-base-200 rounded-lg p-3"><div class="font-medium text-sm mb-3 flex items-center justify-between"><span> </span> <span class="badge badge-sm badge-ghost"> </span></div> <div class="space-y-2 min-h-32"></div></div>'),We=e.from_html('<div class="grid grid-cols-4 gap-4"></div>'),Ae=e.from_html('<tr><td colspan="5" class="text-center py-6 text-base-content/60">No tasks.</td></tr>'),Re=e.from_html('<tr><td> </td><td><span class="badge badge-sm"> </span></td><td><span class="badge badge-ghost badge-sm"> </span></td><td> </td><td> </td></tr>'),qe=e.from_html('<div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Title</th><th>Status</th><th>Priority</th><th>Due date</th><th>Assignee</th></tr></thead><tbody><!></tbody></table></div>'),Ee=e.from_html('<div class="flex gap-4 items-center"><select class="select select-sm select-bordered"></select> <!></div> <!>',1),He=e.from_html('<div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><div class="bg-base-100 rounded-xl p-6 w-full max-w-md"><div class="flex items-center justify-between mb-4"><h2 class="text-xl font-semibold">New project</h2><button class="btn btn-ghost btn-sm btn-square"><!></button></div> <div class="space-y-3"><div><label class="label label-text">Name</label><input class="input input-bordered w-full"/></div> <div><label class="label label-text">Description</label><textarea class="textarea textarea-bordered w-full"></textarea></div> <div class="grid grid-cols-2 gap-3"><div><label class="label label-text">Start</label><input type="date" class="input input-bordered w-full"/></div> <div><label class="label label-text">End</label><input type="date" class="input input-bordered w-full"/></div></div></div> <div class="flex justify-end gap-2 mt-4"><button class="btn btn-ghost">Cancel</button><button class="btn btn-primary"> </button></div></div></div>'),Ue=e.from_html("<option> </option>"),Je=e.from_html('<div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><div class="bg-base-100 rounded-xl p-6 w-full max-w-md"><div class="flex items-center justify-between mb-4"><h2 class="text-xl font-semibold">New task</h2><button class="btn btn-ghost btn-sm btn-square"><!></button></div> <div class="space-y-3"><div><label class="label label-text">Title</label><input class="input input-bordered w-full"/></div> <div><label class="label label-text">Description</label><textarea class="textarea textarea-bordered w-full"></textarea></div> <div class="grid grid-cols-2 gap-3"><div><label class="label label-text">Status</label><select class="select select-bordered w-full"></select></div> <div><label class="label label-text">Priority</label><select class="select select-bordered w-full"><option>Low</option><option>Medium</option><option>High</option><option>Urgent</option></select></div></div> <div><label class="label label-text">Due date</label><input type="date" class="input input-bordered w-full"/></div></div> <div class="flex justify-end gap-2 mt-4"><button class="btn btn-ghost">Cancel</button><button class="btn btn-primary"> </button></div></div></div>'),Be=e.from_html('<div class="p-6 space-y-4"><header class="flex items-center justify-between"><h1 class="text-2xl font-semibold flex items-center gap-2"><!> Projects</h1> <div class="flex gap-2"><div class="join"><button><!></button> <button><!></button></div> <button class="btn btn-primary btn-sm gap-2"><!> New project</button></div></header> <!> <!></div> <!> <!>',1);function Ie(n,t){var fe;e.push(t,!0);const b=((fe=window.__zveltio)==null?void 0:fe.engineUrl)??"";let d=e.state("board"),_=e.state(e.proxy([])),u=e.state(null),o=e.state(e.proxy([])),v=e.state(""),T=e.state(!1),A=e.state(!1),O=e.state(!1),x=e.state(e.proxy({name:"",description:"",start_date:"",end_date:""})),w=e.state(e.proxy({title:"",description:"",status:"todo",priority:"medium",assignee_id:"",due_date:""}));const L=[{id:"todo",label:"To do"},{id:"in_progress",label:"In progress"},{id:"review",label:"Review"},{id:"done",label:"Done"}];async function U(a,l){const h=await fetch(`${b}${a}`,{credentials:"include",...l}),g=await h.json().catch(()=>({}));if(!h.ok)throw new Error(g.error||`HTTP ${h.status}`);return g}async function G(){try{const a=await U("/api/projects");e.set(_,a.data??[],!0),!e.get(u)&&e.get(_)[0]&&e.set(u,e.get(_)[0],!0)}catch(a){e.set(v,a.message,!0)}}async function V(){if(!e.get(u)){e.set(o,[],!0);return}try{const a=await U(`/api/projects/${e.get(u).id}/tasks`);e.set(o,a.data??[],!0)}catch(a){e.set(v,a.message,!0)}}async function Y(){e.set(O,!0),e.set(v,"");try{await U("/api/projects",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(e.get(x))}),e.set(T,!1),e.set(x,{name:"",description:"",start_date:"",end_date:""},!0),await G()}catch(a){e.set(v,a.message,!0)}finally{e.set(O,!1)}}async function ee(){if(e.get(u)){e.set(O,!0),e.set(v,"");try{await U(`/api/projects/${e.get(u).id}/tasks`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(e.get(w))}),e.set(A,!1),e.set(w,{title:"",description:"",status:"todo",priority:"medium",assignee_id:"",due_date:""},!0),await V()}catch(a){e.set(v,a.message,!0)}finally{e.set(O,!1)}}}async function ce(a,l){try{await U(`/api/projects/tasks/${a}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:l})}),await V()}catch(h){e.set(v,h.message,!0)}}we.onMount(G),e.user_effect(()=>{e.get(u),V()});function ve(a){return e.get(o).filter(l=>l.status===a)}var pe=Be(),te=e.first_child(pe),ae=e.child(te),se=e.child(ae),Le=e.child(se);Ne(Le,{class:"h-6 w-6"}),e.next(),e.reset(se);var _e=e.sibling(se,2),ie=e.child(_e),K=e.child(ie);let ue;var Ve=e.child(K);Se(Ve,{class:"h-4 w-4"}),e.reset(K);var Q=e.sibling(K,2);let ge;var Ze=e.child(Q);$e(Ze,{class:"h-4 w-4"}),e.reset(Q),e.reset(ie);var re=e.sibling(ie,2),Ke=e.child(re);ne(Ke,{class:"h-4 w-4"}),e.next(),e.reset(re),e.reset(_e),e.reset(ae);var be=e.sibling(ae,2);{var Xe=a=>{var l=Pe(),h=e.child(l,!0);e.reset(l),e.template_effect(()=>e.set_text(h,e.get(v))),e.append(a,l)};e.if(be,a=>{e.get(v)&&a(Xe)})}var Ge=e.sibling(be,2);{var Qe=a=>{var l=Te();e.append(a,l)},Ye=a=>{var l=Ee(),h=e.first_child(l),g=e.child(h);e.each(g,21,()=>e.get(_),i=>i.id,(i,s)=>{var r=Me(),f=e.child(r,!0);e.reset(r);var k={};e.template_effect(()=>{e.set_text(f,e.get(s).name),k!==(k=e.get(s).id)&&(r.value=(r.__value=e.get(s).id)??"")}),e.append(i,r)}),e.reset(g);var z;e.init_select(g);var X=e.sibling(g,2);{var R=i=>{var s=Ce(),r=e.child(s);ne(r,{class:"h-3.5 w-3.5"}),e.next(),e.reset(s),e.delegated("click",s,()=>e.set(A,!0)),e.append(i,s)};e.if(X,i=>{e.get(u)&&i(R)})}e.reset(h);var q=e.sibling(h,2);{var J=i=>{var s=We();e.each(s,21,()=>L,r=>r.id,(r,f)=>{var k=Fe(),$=e.child(k),S=e.child($),y=e.child(S,!0);e.reset(S);var m=e.sibling(S,2),H=e.child(m,!0);e.reset(m),e.reset($);var p=e.sibling($,2);e.each(p,21,()=>ve(e.get(f).id),j=>j.id,(j,M)=>{var D=De(),F=e.child(D),B=e.child(F,!0);e.reset(F);var c=e.sibling(F,2);{var I=N=>{var C=Oe(),W=e.child(C,!0);e.reset(C),e.template_effect(()=>e.set_text(W,e.get(M).description)),e.append(N,C)};e.if(c,N=>{e.get(M).description&&N(I)})}var P=e.sibling(c,2);e.each(P,21,()=>L.filter(N=>N.id!==e.get(f).id),N=>N.id,(N,C)=>{var W=ze(),le=e.child(W);e.reset(W),e.template_effect(()=>e.set_text(le,`→ ${e.get(C).label??""}`)),e.delegated("click",W,()=>ce(e.get(M).id,e.get(C).id)),e.append(N,W)}),e.reset(P),e.reset(D),e.template_effect(()=>e.set_text(B,e.get(M).title)),e.append(j,D)}),e.reset(p),e.reset(k),e.template_effect(j=>{e.set_text(y,e.get(f).label),e.set_text(H,j)},[()=>ve(e.get(f).id).length]),e.append(r,k)}),e.reset(s),e.append(i,s)},E=i=>{var s=qe(),r=e.child(s),f=e.sibling(e.child(r)),k=e.child(f);{var $=y=>{var m=Ae();e.append(y,m)},S=y=>{var m=e.comment(),H=e.first_child(m);e.each(H,17,()=>e.get(o),p=>p.id,(p,j)=>{var M=Re(),D=e.child(M),F=e.child(D,!0);e.reset(D);var B=e.sibling(D),c=e.child(B),I=e.child(c,!0);e.reset(c),e.reset(B);var P=e.sibling(B),N=e.child(P),C=e.child(N,!0);e.reset(N),e.reset(P);var W=e.sibling(P),le=e.child(W,!0);e.reset(W);var me=e.sibling(W),st=e.child(me,!0);e.reset(me),e.reset(M),e.template_effect(()=>{e.set_text(F,e.get(j).title),e.set_text(I,e.get(j).status),e.set_text(C,e.get(j).priority),e.set_text(le,e.get(j).due_date??"—"),e.set_text(st,e.get(j).assignee_name??"—")}),e.append(p,M)}),e.append(y,m)};e.if(k,y=>{e.get(o).length===0?y($):y(S,-1)})}e.reset(f),e.reset(r),e.reset(s),e.append(i,s)};e.if(q,i=>{e.get(d)==="board"?i(J):i(E,-1)})}e.template_effect(()=>{var i,s,r;z!==(z=((i=e.get(u))==null?void 0:i.id)??"")&&(g.value=(g.__value=((s=e.get(u))==null?void 0:s.id)??"")??"",e.select_option(g,((r=e.get(u))==null?void 0:r.id)??""))}),e.delegated("change",g,i=>{e.set(u,e.get(_).find(s=>s.id===i.target.value)??null,!0)}),e.append(a,l)};e.if(Ge,a=>{e.get(_).length===0?a(Qe):a(Ye,-1)})}e.reset(te);var he=e.sibling(te,2);{var et=a=>{var l=He(),h=e.child(l),g=e.child(h),z=e.sibling(e.child(g)),X=e.child(z);de(X,{class:"h-4 w-4"}),e.reset(z),e.reset(g);var R=e.sibling(g,2),q=e.child(R),J=e.sibling(e.child(q));e.remove_input_defaults(J),e.reset(q);var E=e.sibling(q,2),i=e.sibling(e.child(E));e.remove_textarea_child(i),e.reset(E);var s=e.sibling(E,2),r=e.child(s),f=e.sibling(e.child(r));e.remove_input_defaults(f),e.reset(r);var k=e.sibling(r,2),$=e.sibling(e.child(k));e.remove_input_defaults($),e.reset(k),e.reset(s),e.reset(R);var S=e.sibling(R,2),y=e.child(S),m=e.sibling(y),H=e.child(m,!0);e.reset(m),e.reset(S),e.reset(h),e.reset(l),e.template_effect(()=>{m.disabled=e.get(O)||!e.get(x).name,e.set_text(H,e.get(O)?"Saving…":"Create")}),e.delegated("click",l,p=>p.target===p.currentTarget&&e.set(T,!1)),e.delegated("click",z,()=>e.set(T,!1)),e.bind_value(J,()=>e.get(x).name,p=>e.get(x).name=p),e.bind_value(i,()=>e.get(x).description,p=>e.get(x).description=p),e.bind_value(f,()=>e.get(x).start_date,p=>e.get(x).start_date=p),e.bind_value($,()=>e.get(x).end_date,p=>e.get(x).end_date=p),e.delegated("click",y,()=>e.set(T,!1)),e.delegated("click",m,Y),e.append(a,l)};e.if(he,a=>{e.get(T)&&a(et)})}var tt=e.sibling(he,2);{var at=a=>{var l=Je(),h=e.child(l),g=e.child(h),z=e.sibling(e.child(g)),X=e.child(z);de(X,{class:"h-4 w-4"}),e.reset(z),e.reset(g);var R=e.sibling(g,2),q=e.child(R),J=e.sibling(e.child(q));e.remove_input_defaults(J),e.reset(q);var E=e.sibling(q,2),i=e.sibling(e.child(E));e.remove_textarea_child(i),e.reset(E);var s=e.sibling(E,2),r=e.child(s),f=e.sibling(e.child(r));e.each(f,21,()=>L,c=>c.id,(c,I)=>{var P=Ue(),N=e.child(P,!0);e.reset(P);var C={};e.template_effect(()=>{e.set_text(N,e.get(I).label),C!==(C=e.get(I).id)&&(P.value=(P.__value=e.get(I).id)??"")}),e.append(c,P)}),e.reset(f),e.reset(r);var k=e.sibling(r,2),$=e.sibling(e.child(k)),S=e.child($);S.value=S.__value="low";var y=e.sibling(S);y.value=y.__value="medium";var m=e.sibling(y);m.value=m.__value="high";var H=e.sibling(m);H.value=H.__value="urgent",e.reset($),e.reset(k),e.reset(s);var p=e.sibling(s,2),j=e.sibling(e.child(p));e.remove_input_defaults(j),e.reset(p),e.reset(R);var M=e.sibling(R,2),D=e.child(M),F=e.sibling(D),B=e.child(F,!0);e.reset(F),e.reset(M),e.reset(h),e.reset(l),e.template_effect(()=>{F.disabled=e.get(O)||!e.get(w).title,e.set_text(B,e.get(O)?"Saving…":"Create")}),e.delegated("click",l,c=>c.target===c.currentTarget&&e.set(A,!1)),e.delegated("click",z,()=>e.set(A,!1)),e.bind_value(J,()=>e.get(w).title,c=>e.get(w).title=c),e.bind_value(i,()=>e.get(w).description,c=>e.get(w).description=c),e.bind_select_value(f,()=>e.get(w).status,c=>e.get(w).status=c),e.bind_select_value($,()=>e.get(w).priority,c=>e.get(w).priority=c),e.bind_value(j,()=>e.get(w).due_date,c=>e.get(w).due_date=c),e.delegated("click",D,()=>e.set(A,!1)),e.delegated("click",F,ee),e.append(a,l)};e.if(tt,a=>{e.get(A)&&a(at)})}e.template_effect(()=>{ue=e.set_class(K,1,"btn btn-sm join-item",null,ue,{"btn-active":e.get(d)==="board"}),ge=e.set_class(Q,1,"btn btn-sm join-item",null,ge,{"btn-active":e.get(d)==="list"})}),e.delegated("click",K,()=>e.set(d,"board")),e.delegated("click",Q,()=>e.set(d,"list")),e.delegated("click",re,()=>e.set(T,!0)),e.append(n,pe),e.pop()}e.delegate(["click","change"]);function oe(){const n=window.__zveltio;n&&n.registerRoute({path:"projects",component:Ie,label:"Projects",icon:"FolderKanban",category:"projects"})}return oe(),oe})(window.__SvelteRuntime.__unknown,window.__SvelteRuntime.internal_client,window.__SvelteRuntime.svelte);
