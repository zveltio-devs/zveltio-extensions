var ZveltioExt=(function(Me,de,ce){"use strict";function pe(i){const t=Object.create(null,{[Symbol.toStringTag]:{value:"Module"}});if(i){for(const r in i)if(r!=="default"){const l=Object.getOwnPropertyDescriptor(i,r);Object.defineProperty(t,r,l.get?l:{enumerable:!0,get:()=>i[r]})}}return t.default=i,Object.freeze(t)}const e=pe(de),_=typeof window<"u"?window.location.origin:"";typeof window<"u"&&(window.__ZVELTIO_ENGINE_URL__=_);/**
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
 */const ue={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"};var ve=e.from_svg("<svg><!><!></svg>");function g(i,t){e.push(t,!0);const r=e.prop(t,"color",3,"currentColor"),l=e.prop(t,"size",3,24),n=e.prop(t,"strokeWidth",3,2),u=e.prop(t,"absoluteStrokeWidth",3,!1),s=e.prop(t,"iconNode",19,()=>[]),o=e.rest_props(t,["$$slots","$$events","$$legacy","name","color","size","strokeWidth","absoluteStrokeWidth","iconNode","children"]);var b=ve();e.attribute_effect(b,m=>({...ue,...o,width:l(),height:l(),stroke:r(),"stroke-width":m,class:["lucide-icon lucide",t.name&&`lucide-${t.name}`,t.class]}),[()=>u()?Number(n())*24/Number(l()):n()]);var x=e.child(b);e.each(x,17,s,e.index,(m,w)=>{var y=e.derived(()=>e.to_array(e.get(w),2));let S=()=>e.get(y)[0],k=()=>e.get(y)[1];var d=e.comment(),c=e.first_child(d);e.element(c,S,!0,(f,F)=>{e.attribute_effect(f,()=>({...k()}))}),e.append(m,d)});var h=e.sibling(x);e.snippet(h,()=>t.children??e.noop),e.reset(b),e.append(i,b),e.pop()}function me(i,t){e.push(t,!0);/**
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
 */let r=e.rest_props(t,["$$slots","$$events","$$legacy"]);const l=[["path",{d:"M21.801 10A10 10 0 1 1 17 3.335"}],["path",{d:"m9 11 3 3L22 4"}]];g(i,e.spread_props({name:"circle-check-big"},()=>r,{get iconNode(){return l},children:(n,u)=>{var s=e.comment(),o=e.first_child(s);e.snippet(o,()=>t.children??e.noop),e.append(n,s)},$$slots:{default:!0}})),e.pop()}function ge(i,t){e.push(t,!0);/**
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
 */let r=e.rest_props(t,["$$slots","$$events","$$legacy"]);const l=[["circle",{cx:"12",cy:"12",r:"10"}],["path",{d:"m15 9-6 6"}],["path",{d:"m9 9 6 6"}]];g(i,e.spread_props({name:"circle-x"},()=>r,{get iconNode(){return l},children:(n,u)=>{var s=e.comment(),o=e.first_child(s);e.snippet(o,()=>t.children??e.noop),e.append(n,s)},$$slots:{default:!0}})),e.pop()}function be(i,t){e.push(t,!0);/**
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
 */let r=e.rest_props(t,["$$slots","$$events","$$legacy"]);const l=[["rect",{width:"14",height:"14",x:"8",y:"8",rx:"2",ry:"2"}],["path",{d:"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"}]];g(i,e.spread_props({name:"copy"},()=>r,{get iconNode(){return l},children:(n,u)=>{var s=e.comment(),o=e.first_child(s);e.snippet(o,()=>t.children??e.noop),e.append(n,s)},$$slots:{default:!0}})),e.pop()}function G(i,t){e.push(t,!0);/**
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
 */let r=e.rest_props(t,["$$slots","$$events","$$legacy"]);const l=[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56"}]];g(i,e.spread_props({name:"loader-circle"},()=>r,{get iconNode(){return l},children:(n,u)=>{var s=e.comment(),o=e.first_child(s);e.snippet(o,()=>t.children??e.noop),e.append(n,s)},$$slots:{default:!0}})),e.pop()}function fe(i,t){e.push(t,!0);/**
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
 */let r=e.rest_props(t,["$$slots","$$events","$$legacy"]);const l=[["path",{d:"M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"}],["path",{d:"M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"}],["path",{d:"M7 3v4a1 1 0 0 0 1 1h7"}]];g(i,e.spread_props({name:"save"},()=>r,{get iconNode(){return l},children:(n,u)=>{var s=e.comment(),o=e.first_child(s);e.snippet(o,()=>t.children??e.noop),e.append(n,s)},$$slots:{default:!0}})),e.pop()}function he(i,t){e.push(t,!0);/**
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
 */let r=e.rest_props(t,["$$slots","$$events","$$legacy"]);const l=[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"}]];g(i,e.spread_props({name:"shield"},()=>r,{get iconNode(){return l},children:(n,u)=>{var s=e.comment(),o=e.first_child(s);e.snippet(o,()=>t.children??e.noop),e.append(n,s)},$$slots:{default:!0}})),e.pop()}var _e=e.from_html('<div class="flex items-center gap-2 text-gray-400"><!> Loading...</div>'),xe=e.from_html('<div class="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><!> </div>'),ye=e.from_html('<div class="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"><!> </div>'),we=e.from_html("<!> Saving...",1),Se=e.from_html("<!> Save Configuration",1),ke=e.from_html('<!> <!> <div class="rounded-lg border border-gray-200 bg-gray-50 p-4"><p class="text-xs font-medium text-gray-600 mb-1">Service Provider Metadata URL</p> <div class="flex items-center gap-2"><code class="flex-1 truncate text-xs text-gray-800"> </code> <button class="rounded p-1 hover:bg-gray-200" title="Copy"><!></button></div> <p class="mt-1 text-xs text-gray-400">Register this URL in your IdP as the SP metadata endpoint.</p></div> <form class="space-y-4"><div class="flex items-center justify-between rounded-lg border border-gray-200 p-3"><div><p class="text-sm font-medium">Enable SAML SSO</p> <p class="text-xs text-gray-500">Allow users to sign in via your Identity Provider</p></div> <input type="checkbox" class="h-4 w-4 rounded accent-blue-600"/></div> <div class="space-y-3"><div><label class="block text-sm font-medium text-gray-700 mb-1">IdP SSO URL <span class="text-red-500">*</span></label> <input type="url" required="" placeholder="https://idp.example.com/sso/saml" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"/></div> <div><label class="block text-sm font-medium text-gray-700 mb-1">SP Entity ID / Issuer <span class="text-red-500">*</span></label> <input type="text" required="" placeholder="https://your-zveltio-instance.com" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"/></div> <div><label class="block text-sm font-medium text-gray-700 mb-1">ACS Callback URL <span class="text-red-500">*</span></label> <input type="url" required="" placeholder="https://your-zveltio-instance.com/api/auth/saml/callback" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"/></div> <div><label class="block text-sm font-medium text-gray-700 mb-1">IdP Certificate (PEM) <span class="text-red-500">*</span></label> <textarea required="" placeholder="-----BEGIN CERTIFICATE----- ... -----END CERTIFICATE-----" class="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-xs focus:border-blue-400 focus:outline-none"></textarea></div> <div><label class="block text-sm font-medium text-gray-700 mb-1">SP Private Key (optional)</label> <textarea placeholder="-----BEGIN PRIVATE KEY----- ... -----END PRIVATE KEY-----" class="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-xs focus:border-blue-400 focus:outline-none"></textarea> <p class="mt-1 text-xs text-gray-400">Required only for signed authentication requests.</p></div> <div class="grid grid-cols-2 gap-3"><div><label class="block text-sm font-medium text-gray-700 mb-1">Signature Algorithm</label> <select class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"><option>SHA-256 (recommended)</option><option>SHA-512</option><option>SHA-1 (legacy)</option></select></div> <div class="flex items-end pb-2"><label class="flex items-center gap-2 text-sm"><input type="checkbox" class="h-4 w-4 accent-blue-600"/> Require signed response</label></div></div> <div class="grid grid-cols-2 gap-3"><div><label class="block text-sm font-medium text-gray-700 mb-1">Email attribute</label> <input type="text" placeholder="email" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"/></div> <div><label class="block text-sm font-medium text-gray-700 mb-1">Name attribute</label> <input type="text" placeholder="displayName" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"/></div></div></div> <button type="submit" class="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"><!></button></form>',1),Ne=e.from_html('<div class="mx-auto max-w-2xl space-y-6 p-6"><div class="flex items-center gap-3"><!> <div><h1 class="text-xl font-semibold">SAML 2.0 SSO</h1> <p class="text-sm text-gray-500">Configure Single Sign-On with an external Identity Provider</p></div></div> <!></div>');function $e(i,t){e.push(t,!0);let r=e.proxy({enabled:!1,entryPoint:"",issuer:"",cert:"",callbackUrl:"",privateKey:"",signatureAlgorithm:"sha256",wantAuthnResponseSigned:!0,mapEmail:"email",mapName:"displayName"}),l=e.state(!0),n=e.state(!1),u=e.state(""),s=e.state(""),o=e.state("");ce.onMount(async()=>{e.set(o,`${_}/api/auth/saml/metadata`);try{const d=await fetch(`${_}/api/auth/saml/config`,{credentials:"include"});if(d.ok){const c=await d.json();c.config&&Object.assign(r,c.config)}}catch{}e.set(l,!1)});async function b(){e.set(n,!0),e.set(u,""),e.set(s,"");try{const d=await fetch(`${_}/api/auth/saml/config`,{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify(r)}),c=await d.json();if(!d.ok)throw new Error(c.error??"Save failed");e.set(s,"SAML configuration saved successfully.")}catch(d){e.set(u,d.message,!0)}finally{e.set(n,!1)}}async function x(){await navigator.clipboard.writeText(e.get(o))}var h=Ne(),m=e.child(h),w=e.child(m);he(w,{class:"h-6 w-6 text-blue-500"}),e.next(2),e.reset(m);var y=e.sibling(m,2);{var S=d=>{var c=_e(),f=e.child(c);G(f,{class:"h-4 w-4 animate-spin"}),e.next(),e.reset(c),e.append(d,c)},k=d=>{var c=ke(),f=e.first_child(c);{var F=a=>{var p=xe(),v=e.child(p);ge(v,{class:"h-4 w-4 shrink-0"});var H=e.sibling(v);e.reset(p),e.template_effect(()=>e.set_text(H,` ${e.get(u)??""}`)),e.append(a,p)};e.if(f,a=>{e.get(u)&&a(F)})}var Y=e.sibling(f,2);{var Ee=a=>{var p=ye(),v=e.child(p);me(v,{class:"h-4 w-4 shrink-0"});var H=e.sibling(v);e.reset(p),e.template_effect(()=>e.set_text(H,` ${e.get(s)??""}`)),e.append(a,p)};e.if(Y,a=>{e.get(s)&&a(Ee)})}var N=e.sibling(Y,2),Z=e.sibling(e.child(N),2),$=e.child(Z),Pe=e.child($,!0);e.reset($);var E=e.sibling($,2),Ae=e.child(E);be(Ae,{class:"h-3.5 w-3.5 text-gray-500"}),e.reset(E),e.reset(Z),e.next(2),e.reset(N);var P=e.sibling(N,2),A=e.child(P),J=e.sibling(e.child(A),2);e.remove_input_defaults(J),e.reset(A);var R=e.sibling(A,2),C=e.child(R),Q=e.sibling(e.child(C),2);e.remove_input_defaults(Q),e.reset(C);var I=e.sibling(C,2),X=e.sibling(e.child(I),2);e.remove_input_defaults(X),e.reset(I);var M=e.sibling(I,2),ee=e.sibling(e.child(M),2);e.remove_input_defaults(ee),e.reset(M);var L=e.sibling(M,2),O=e.sibling(e.child(L),2);e.remove_textarea_child(O),e.set_attribute(O,"rows",4),e.reset(L);var T=e.sibling(L,2),U=e.sibling(e.child(T),2);e.remove_textarea_child(U),e.set_attribute(U,"rows",3),e.next(2),e.reset(T);var j=e.sibling(T,2),z=e.child(j),V=e.sibling(e.child(z),2),q=e.child(V);q.value=q.__value="sha256";var D=e.sibling(q);D.value=D.__value="sha512";var te=e.sibling(D);te.value=te.__value="sha1",e.reset(V),e.reset(z);var re=e.sibling(z,2),ae=e.child(re),ie=e.child(ae);e.remove_input_defaults(ie),e.next(),e.reset(ae),e.reset(re),e.reset(j);var se=e.sibling(j,2),K=e.child(se),le=e.sibling(e.child(K),2);e.remove_input_defaults(le),e.reset(K);var ne=e.sibling(K,2),oe=e.sibling(e.child(ne),2);e.remove_input_defaults(oe),e.reset(ne),e.reset(se),e.reset(R);var W=e.sibling(R,2),Re=e.child(W);{var Ce=a=>{var p=we(),v=e.first_child(p);G(v,{class:"h-4 w-4 animate-spin"}),e.next(),e.append(a,p)},Ie=a=>{var p=Se(),v=e.first_child(p);fe(v,{class:"h-4 w-4"}),e.next(),e.append(a,p)};e.if(Re,a=>{e.get(n)?a(Ce):a(Ie,-1)})}e.reset(W),e.reset(P),e.template_effect(()=>{e.set_text(Pe,e.get(o)),W.disabled=e.get(n)}),e.delegated("click",E,x),e.event("submit",P,a=>{a.preventDefault(),b()}),e.bind_checked(J,()=>r.enabled,a=>r.enabled=a),e.bind_value(Q,()=>r.entryPoint,a=>r.entryPoint=a),e.bind_value(X,()=>r.issuer,a=>r.issuer=a),e.bind_value(ee,()=>r.callbackUrl,a=>r.callbackUrl=a),e.bind_value(O,()=>r.cert,a=>r.cert=a),e.bind_value(U,()=>r.privateKey,a=>r.privateKey=a),e.bind_select_value(V,()=>r.signatureAlgorithm,a=>r.signatureAlgorithm=a),e.bind_checked(ie,()=>r.wantAuthnResponseSigned,a=>r.wantAuthnResponseSigned=a),e.bind_value(le,()=>r.mapEmail,a=>r.mapEmail=a),e.bind_value(oe,()=>r.mapName,a=>r.mapName=a),e.append(d,c)};e.if(y,d=>{e.get(l)?d(S):d(k,-1)})}e.reset(h),e.append(i,h),e.pop()}e.delegate(["click"]);function B(){const i=window.__zveltio;i&&i.registerRoute({path:"auth/saml",component:$e,label:"SAML SSO",icon:"Shield",category:"auth"})}return B(),B})(window.__SvelteRuntime.__unknown,window.__SvelteRuntime.internal_client,window.__SvelteRuntime.svelte);
