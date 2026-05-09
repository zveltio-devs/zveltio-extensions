var ZveltioExt=(function(Ke,me,be){"use strict";function xe(i){const r=Object.create(null,{[Symbol.toStringTag]:{value:"Module"}});if(i){for(const v in i)if(v!=="default"){const c=Object.getOwnPropertyDescriptor(i,v);Object.defineProperty(r,v,c.get?c:{enumerable:!0,get:()=>i[v]})}}return r.default=i,Object.freeze(r)}const e=xe(me);/**
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
 */const we={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"};var ye=e.from_svg("<svg><!><!></svg>");function B(i,r){e.push(r,!0);const v=e.prop(r,"color",3,"currentColor"),c=e.prop(r,"size",3,24),u=e.prop(r,"strokeWidth",3,2),g=e.prop(r,"absoluteStrokeWidth",3,!1),n=e.prop(r,"iconNode",19,()=>[]),_=e.rest_props(r,["$$slots","$$events","$$legacy","name","color","size","strokeWidth","absoluteStrokeWidth","iconNode","children"]);var x=ye();e.attribute_effect(x,S=>({...we,..._,width:c(),height:c(),stroke:v(),"stroke-width":S,class:["lucide-icon lucide",r.name&&`lucide-${r.name}`,r.class]}),[()=>g()?Number(u())*24/Number(c()):u()]);var m=e.child(x);e.each(m,17,n,e.index,(S,R)=>{var W=e.derived(()=>e.to_array(e.get(R),2));let E=()=>e.get(W)[0],K=()=>e.get(W)[1];var J=e.comment(),H=e.first_child(J);e.element(H,E,!0,(T,V)=>{e.attribute_effect(T,()=>({...K()}))}),e.append(S,J)});var a=e.sibling(m);e.snippet(a,()=>r.children??e.noop),e.reset(x),e.append(i,x),e.pop()}function ke(i,r){e.push(r,!0);/**
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
 */let v=e.rest_props(r,["$$slots","$$events","$$legacy"]);const c=[["circle",{cx:"12",cy:"12",r:"10"}],["line",{x1:"12",x2:"12",y1:"8",y2:"12"}],["line",{x1:"12",x2:"12.01",y1:"16",y2:"16"}]];B(i,e.spread_props({name:"circle-alert"},()=>v,{get iconNode(){return c},children:(u,g)=>{var n=e.comment(),_=e.first_child(n);e.snippet(_,()=>r.children??e.noop),e.append(u,n)},$$slots:{default:!0}})),e.pop()}function $e(i,r){e.push(r,!0);/**
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
 */let v=e.rest_props(r,["$$slots","$$events","$$legacy"]);const c=[["path",{d:"M21.801 10A10 10 0 1 1 17 3.335"}],["path",{d:"m9 11 3 3L22 4"}]];B(i,e.spread_props({name:"circle-check-big"},()=>v,{get iconNode(){return c},children:(u,g)=>{var n=e.comment(),_=e.first_child(n);e.snippet(_,()=>r.children??e.noop),e.append(u,n)},$$slots:{default:!0}})),e.pop()}function F(i,r){e.push(r,!0);/**
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
 */let v=e.rest_props(r,["$$slots","$$events","$$legacy"]);const c=[["path",{d:"M12 3v12"}],["path",{d:"m17 8-5-5-5 5"}],["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"}]];B(i,e.spread_props({name:"upload"},()=>v,{get iconNode(){return c},children:(u,g)=>{var n=e.comment(),_=e.first_child(n);e.snippet(_,()=>r.children??e.noop),e.append(u,n)},$$slots:{default:!0}})),e.pop()}function Ne(i,r){e.push(r,!0);/**
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
 */let v=e.rest_props(r,["$$slots","$$events","$$legacy"]);const c=[["path",{d:"M18 6 6 18"}],["path",{d:"m6 6 12 12"}]];B(i,e.spread_props({name:"x"},()=>v,{get iconNode(){return c},children:(u,g)=>{var n=e.comment(),_=e.first_child(n);e.snippet(_,()=>r.children??e.noop),e.append(u,n)},$$slots:{default:!0}})),e.pop()}var Se=e.from_html('<div class="alert alert-error"><!> </div>'),je=e.from_html('<tr><td colspan="6" class="text-center py-6 text-base-content/60">No imports yet.</td></tr>'),Ce=e.from_html('<tr><td> </td><td> </td><td><span class="badge badge-ghost badge-sm"> </span></td><td> </td><td> </td><td><span> </span></td></tr>'),Oe=e.from_html("<option> </option>"),Te=e.from_html('<div class="font-medium"> </div> <div class="text-xs text-base-content/60"> </div>',1),De=e.from_html('<!> <div class="text-sm text-base-content/60">Drag a CSV / JSON / NDJSON file, or click to browse</div>',1),Pe=e.from_html('<div class="text-xs"> </div>'),ze=e.from_html('<div class="alert alert-success mt-3 text-sm"><!> <div><div class="font-medium"> </div> <!></div></div>'),Ie=e.from_html('<div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><div class="bg-base-100 rounded-xl p-6 w-full max-w-lg"><div class="flex items-center justify-between mb-4"><h2 class="text-xl font-semibold">Import data</h2><button class="btn btn-ghost btn-sm btn-square"><!></button></div> <div class="space-y-3"><div><label class="label label-text">Target collection</label> <select class="select select-bordered w-full"><option>— Select —</option><!></select></div> <div><input id="import-file" type="file" class="hidden" accept=".csv,.json,.ndjson,.jsonl"/> <label for="import-file" class="cursor-pointer block"><!></label></div> <div><label class="label label-text">Format</label> <select class="select select-bordered w-full"><option>CSV</option><option>JSON</option><option>NDJSON</option></select></div> <div><label class="label label-text">Upsert on field (optional, e.g. <code class="text-xs">email</code>)</label><input class="input input-bordered w-full font-mono"/></div> <label class="label cursor-pointer gap-2"><input type="checkbox" class="checkbox checkbox-sm"/><span class="label-text">Create missing columns automatically</span></label></div> <!> <div class="flex justify-end gap-2 mt-4"><button class="btn btn-ghost">Close</button><button class="btn btn-primary gap-2"><!> </button></div></div></div>'),Me=e.from_html('<div class="p-6 space-y-4"><header class="flex items-center justify-between"><h1 class="text-2xl font-semibold flex items-center gap-2"><!> Data Import</h1> <button class="btn btn-primary btn-sm gap-2"><!> New import</button></header> <!> <div class="overflow-x-auto bg-base-100 rounded-lg shadow"><table class="table table-sm"><thead><tr><th>Time</th><th>Collection</th><th>Format</th><th>Rows</th><th>Errors</th><th>Status</th></tr></thead><tbody><!></tbody></table></div></div> <!>',1);function Ue(i,r){var ce;e.push(r,!0);const v=((ce=window.__zveltio)==null?void 0:ce.engineUrl)??"";let c=e.state(e.proxy([])),u=e.state(e.proxy([])),g=e.state(""),n=e.state(!1),_=e.state(!1),x=e.state(!1),m=e.state(null),a=e.proxy({collection:"",format:"csv",upsert_on:"",create_missing_columns:!1,file:null});async function S(t,l){const d=await fetch(`${v}${t}`,{credentials:"include",...l}),h=await d.json().catch(()=>({}));if(!d.ok)throw new Error(h.error||`HTTP ${d.status}`);return h}async function R(){try{const t=await S("/api/import/logs?limit=50");e.set(c,t.data??[],!0)}catch(t){e.set(g,t.message,!0)}}async function W(){try{const t=await S("/api/collections");e.set(u,t.collections??t.data??[],!0)}catch{}}function E(t){if(a.file=t,t&&!a.collection){const l=t.name.toLowerCase().split(".").pop();l==="json"?a.format="json":l==="ndjson"||l==="jsonl"?a.format="ndjson":a.format="csv"}}async function K(){if(!(!a.file||!a.collection)){e.set(_,!0),e.set(g,""),e.set(m,null);try{const t=new FormData;t.append("file",a.file),t.append("format",a.format),a.upsert_on&&t.append("upsert_on",a.upsert_on),t.append("create_missing_columns",String(a.create_missing_columns));const l=await fetch(`${v}/api/import/${encodeURIComponent(a.collection)}`,{method:"POST",credentials:"include",body:t}),d=await l.json();if(!l.ok)throw new Error(d.error||`HTTP ${l.status}`);e.set(m,d,!0),await R()}catch(t){e.set(g,t.message,!0)}finally{e.set(_,!1)}}}be.onMount(()=>{R(),W()});function J(t){if(!t)return"—";const l=["B","KB","MB","GB"];let d=0;for(;t>1024&&d<l.length-1;)t/=1024,d++;return`${t.toFixed(1)} ${l[d]}`}var H=Me(),T=e.first_child(H),V=e.child(T),X=e.child(V),Be=e.child(X);F(Be,{class:"h-6 w-6"}),e.next(),e.reset(X);var Z=e.sibling(X,2),Fe=e.child(Z);F(Fe,{class:"h-4 w-4"}),e.next(),e.reset(Z),e.reset(V);var le=e.sibling(V,2);{var Re=t=>{var l=Se(),d=e.child(l);ke(d,{class:"h-4 w-4"});var h=e.sibling(d);e.reset(l),e.template_effect(()=>e.set_text(h,` ${e.get(g)??""}`)),e.append(t,l)};e.if(le,t=>{e.get(g)&&t(Re)})}var ie=e.sibling(le,2),oe=e.child(ie),ne=e.sibling(e.child(oe)),We=e.child(ne);{var Ee=t=>{var l=je();e.append(t,l)},Je=t=>{var l=e.comment(),d=e.first_child(l);e.each(d,17,()=>e.get(c),h=>h.id,(h,f)=>{var D=Ce(),k=e.child(D),P=e.child(k,!0);e.reset(k);var $=e.sibling(k),z=e.child($,!0);e.reset($);var I=e.sibling($),b=e.child(I),A=e.child(b,!0);e.reset(b),e.reset(I);var j=e.sibling(I),L=e.child(j);e.reset(j);var M=e.sibling(j),Q=e.child(M,!0);e.reset(M);var q=e.sibling(M),N=e.child(q),U=e.child(N,!0);e.reset(N),e.reset(q),e.reset(D),e.template_effect(y=>{e.set_text(P,y),e.set_text(z,e.get(f).collection),e.set_text(A,e.get(f).format),e.set_text(L,`${e.get(f).rows_imported??"—"??""} / ${e.get(f).total_rows??"?"??""}`),e.set_text(Q,e.get(f).error_count??0),e.set_class(N,1,`badge ${e.get(f).status==="completed"?"badge-success":e.get(f).status==="failed"?"badge-error":"badge-warning"} badge-sm`),e.set_text(U,e.get(f).status)},[()=>{var y;return(y=e.get(f).created_at)==null?void 0:y.slice(0,16).replace("T"," ")}]),e.append(h,D)}),e.append(t,l)};e.if(We,t=>{e.get(c).length===0?t(Ee):t(Je,-1)})}e.reset(ne),e.reset(oe),e.reset(ie),e.reset(T);var He=e.sibling(T,2);{var Ve=t=>{var l=Ie(),d=e.child(l),h=e.child(d),f=e.sibling(e.child(h)),D=e.child(f);Ne(D,{class:"h-4 w-4"}),e.reset(f),e.reset(h);var k=e.sibling(h,2),P=e.child(k),$=e.sibling(e.child(P),2),z=e.child($);z.value=z.__value="";var I=e.sibling(z);e.each(I,17,()=>e.get(u),s=>s.name,(s,o)=>{var p=Oe(),C=e.child(p,!0);e.reset(p);var w={};e.template_effect(()=>{e.set_text(C,e.get(o).display_name??e.get(o).name),w!==(w=e.get(o).name)&&(p.value=(p.__value=e.get(o).name)??"")}),e.append(s,p)}),e.reset($),e.reset(P);var b=e.sibling(P,2);let A;var j=e.child(b),L=e.sibling(j,2),M=e.child(L);{var Q=s=>{var o=Te(),p=e.first_child(o),C=e.child(p,!0);e.reset(p);var w=e.sibling(p,2),te=e.child(w,!0);e.reset(w),e.template_effect(re=>{e.set_text(C,a.file.name),e.set_text(te,re)},[()=>J(a.file.size)]),e.append(s,o)},q=s=>{var o=De(),p=e.first_child(o);F(p,{class:"h-8 w-8 mx-auto mb-2 text-base-content/40"}),e.next(2),e.append(s,o)};e.if(M,s=>{a.file?s(Q):s(q,-1)})}e.reset(L),e.reset(b);var N=e.sibling(b,2),U=e.sibling(e.child(N),2),y=e.child(U);y.value=y.__value="csv";var Y=e.sibling(y);Y.value=Y.__value="json";var de=e.sibling(Y);de.value=de.__value="ndjson",e.reset(U),e.reset(N);var ee=e.sibling(N,2),ve=e.sibling(e.child(ee));e.remove_input_defaults(ve),e.reset(ee);var pe=e.sibling(ee,2),_e=e.child(pe);e.remove_input_defaults(_e),e.next(),e.reset(pe),e.reset(k);var ue=e.sibling(k,2);{var Ae=s=>{var o=ze(),p=e.child(o);$e(p,{class:"h-4 w-4"});var C=e.sibling(p,2),w=e.child(C),te=e.child(w);e.reset(w);var re=e.sibling(w,2);{var qe=se=>{var O=Pe(),Ge=e.child(O);e.reset(O),e.template_effect(()=>e.set_text(Ge,`${e.get(m).errors.length??""} errors — see job log`)),e.append(se,O)};e.if(re,se=>{var O;(O=e.get(m).errors)!=null&&O.length&&se(qe)})}e.reset(C),e.reset(o),e.template_effect(()=>e.set_text(te,`Imported ${e.get(m).rows_imported??"?"??""} rows`)),e.append(s,o)};e.if(ue,s=>{e.get(m)&&s(Ae)})}var fe=e.sibling(ue,2),he=e.child(fe),G=e.sibling(he),ge=e.child(G);F(ge,{class:"h-4 w-4"});var Le=e.sibling(ge);e.reset(G),e.reset(fe),e.reset(d),e.reset(l),e.template_effect(()=>{A=e.set_class(b,1,"border-2 border-dashed rounded-lg p-6 text-center transition cursor-pointer",null,A,{"border-primary":e.get(x)}),G.disabled=e.get(_)||!a.file||!a.collection,e.set_text(Le,` ${e.get(_)?"Uploading…":"Import"}`)}),e.delegated("click",l,s=>s.target===s.currentTarget&&e.set(n,!1)),e.delegated("click",f,()=>e.set(n,!1)),e.bind_select_value($,()=>a.collection,s=>a.collection=s),e.event("dragover",b,s=>{s.preventDefault(),e.set(x,!0)}),e.event("dragleave",b,()=>e.set(x,!1)),e.event("drop",b,s=>{var o,p;s.preventDefault(),e.set(x,!1),E(((p=(o=s.dataTransfer)==null?void 0:o.files)==null?void 0:p[0])??null)}),e.delegated("change",j,s=>{var o;return E(((o=s.target.files)==null?void 0:o[0])??null)}),e.bind_select_value(U,()=>a.format,s=>a.format=s),e.bind_value(ve,()=>a.upsert_on,s=>a.upsert_on=s),e.bind_checked(_e,()=>a.create_missing_columns,s=>a.create_missing_columns=s),e.delegated("click",he,()=>e.set(n,!1)),e.delegated("click",G,K),e.append(t,l)};e.if(He,t=>{e.get(n)&&t(Ve)})}e.delegated("click",Z,()=>{e.set(n,!0),e.set(m,null)}),e.append(i,H),e.pop()}e.delegate(["click","change"]);function ae(){const i=window.__zveltio;i&&i.registerRoute({path:"import",component:Ue,label:"Data Import",icon:"Upload",category:"data"})}return ae(),ae})(window.__SvelteRuntime.__unknown,window.__SvelteRuntime.internal_client,window.__SvelteRuntime.svelte);
