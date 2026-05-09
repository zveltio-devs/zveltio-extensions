var ZveltioExtAI=(function(B,D,de){"use strict";var ts=Object.defineProperty;var it=B=>{throw TypeError(B)};var as=(B,D,de)=>D in B?ts(B,D,{enumerable:!0,configurable:!0,writable:!0,value:de}):B[D]=de;var lt=(B,D,de)=>as(B,typeof D!="symbol"?D+"":D,de),ss=(B,D,de)=>D.has(B)||it("Cannot "+de);var Ye=(B,D,de)=>(ss(B,D,"read from private field"),de?de.call(B):D.get(B)),nt=(B,D,de)=>D.has(B)?it("Cannot add the same private member more than once"):D instanceof WeakSet?D.add(B):D.set(B,de);var qe;function ot(v){const t=Object.create(null,{[Symbol.toStringTag]:{value:"Module"}});if(v){for(const n in v)if(n!=="default"){const r=Object.getOwnPropertyDescriptor(v,n);Object.defineProperty(t,n,r.get?r:{enumerable:!0,get:()=>v[n]})}}return t.default=v,Object.freeze(t)}const e=ot(D),Xe=typeof window<"u"?window.location.origin:"";typeof window<"u"&&(window.__ZVELTIO_ENGINE_URL__=Xe);class dt{constructor(t){lt(this,"base");this.base=t}async request(t,n,r){const o=await fetch(`${this.base}${n}`,{method:t,credentials:"include",headers:r?{"Content-Type":"application/json"}:{},body:r?JSON.stringify(r):void 0});if(!o.ok){const g=await o.json().catch(()=>({error:o.statusText}));throw new Error(g.error||`Request failed: ${o.status}`)}return o.json()}get(t){return this.request("GET",t)}post(t,n){return this.request("POST",t,n)}put(t,n){return this.request("PUT",t,n)}patch(t,n){return this.request("PATCH",t,n)}delete(t,n){return this.request("DELETE",t,n)}}const Y=new dt(Xe);/**
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
 */const ct={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"};var pt=e.from_svg("<svg><!><!></svg>");function U(v,t){e.push(t,!0);const n=e.prop(t,"color",3,"currentColor"),r=e.prop(t,"size",3,24),o=e.prop(t,"strokeWidth",3,2),g=e.prop(t,"absoluteStrokeWidth",3,!1),a=e.prop(t,"iconNode",19,()=>[]),u=e.rest_props(t,["$$slots","$$events","$$legacy","name","color","size","strokeWidth","absoluteStrokeWidth","iconNode","children"]);var E=pt();e.attribute_effect(E,R=>({...ct,...u,width:r(),height:r(),stroke:n(),"stroke-width":R,class:["lucide-icon lucide",t.name&&`lucide-${t.name}`,t.class]}),[()=>g()?Number(o())*24/Number(r()):o()]);var X=e.child(E);e.each(X,17,a,e.index,(R,I)=>{var N=e.derived(()=>e.to_array(e.get(I),2));let j=()=>e.get(N)[0],se=()=>e.get(N)[1];var _e=e.comment(),ee=e.first_child(_e);e.element(ee,j,!0,(he,ue)=>{e.attribute_effect(he,()=>({...se()}))}),e.append(R,_e)});var q=e.sibling(X);e.snippet(q,()=>t.children??e.noop),e.reset(E),e.append(v,E),e.pop()}function vt(v,t){e.push(t,!0);/**
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
 */let n=e.rest_props(t,["$$slots","$$events","$$legacy"]);const r=[["path",{d:"m12 19-7-7 7-7"}],["path",{d:"M19 12H5"}]];U(v,e.spread_props({name:"arrow-left"},()=>n,{get iconNode(){return r},children:(o,g)=>{var a=e.comment(),u=e.first_child(a);e.snippet(u,()=>t.children??e.noop),e.append(o,a)},$$slots:{default:!0}})),e.pop()}function _t(v,t){e.push(t,!0);/**
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
 */let n=e.rest_props(t,["$$slots","$$events","$$legacy"]);const r=[["path",{d:"M12 17h1.5"}],["path",{d:"M12 22h1.5"}],["path",{d:"M12 2h1.5"}],["path",{d:"M17.5 22H19a1 1 0 0 0 1-1"}],["path",{d:"M17.5 2H19a1 1 0 0 1 1 1v1.5"}],["path",{d:"M20 14v3h-2.5"}],["path",{d:"M20 8.5V10"}],["path",{d:"M4 10V8.5"}],["path",{d:"M4 19.5V14"}],["path",{d:"M4 4.5A2.5 2.5 0 0 1 6.5 2H8"}],["path",{d:"M8 22H6.5a1 1 0 0 1 0-5H8"}]];U(v,e.spread_props({name:"book-dashed"},()=>n,{get iconNode(){return r},children:(o,g)=>{var a=e.comment(),u=e.first_child(a);e.snippet(u,()=>t.children??e.noop),e.append(o,a)},$$slots:{default:!0}})),e.pop()}function Le(v,t){e.push(t,!0);/**
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
 */let n=e.rest_props(t,["$$slots","$$events","$$legacy"]);const r=[["path",{d:"M12 8V4H8"}],["rect",{width:"16",height:"12",x:"4",y:"8",rx:"2"}],["path",{d:"M2 14h2"}],["path",{d:"M20 14h2"}],["path",{d:"M15 13v2"}],["path",{d:"M9 13v2"}]];U(v,e.spread_props({name:"bot"},()=>n,{get iconNode(){return r},children:(o,g)=>{var a=e.comment(),u=e.first_child(a);e.snippet(u,()=>t.children??e.noop),e.append(o,a)},$$slots:{default:!0}})),e.pop()}function et(v,t){e.push(t,!0);/**
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
 */let n=e.rest_props(t,["$$slots","$$events","$$legacy"]);const r=[["path",{d:"M20 6 9 17l-5-5"}]];U(v,e.spread_props({name:"check"},()=>n,{get iconNode(){return r},children:(o,g)=>{var a=e.comment(),u=e.first_child(a);e.snippet(u,()=>t.children??e.noop),e.append(o,a)},$$slots:{default:!0}})),e.pop()}function ht(v,t){e.push(t,!0);/**
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
 */let n=e.rest_props(t,["$$slots","$$events","$$legacy"]);const r=[["path",{d:"m6 9 6 6 6-6"}]];U(v,e.spread_props({name:"chevron-down"},()=>n,{get iconNode(){return r},children:(o,g)=>{var a=e.comment(),u=e.first_child(a);e.snippet(u,()=>t.children??e.noop),e.append(o,a)},$$slots:{default:!0}})),e.pop()}function gt(v,t){e.push(t,!0);/**
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
 */let n=e.rest_props(t,["$$slots","$$events","$$legacy"]);const r=[["path",{d:"m9 18 6-6-6-6"}]];U(v,e.spread_props({name:"chevron-right"},()=>n,{get iconNode(){return r},children:(o,g)=>{var a=e.comment(),u=e.first_child(a);e.snippet(u,()=>t.children??e.noop),e.append(o,a)},$$slots:{default:!0}})),e.pop()}function Be(v,t){e.push(t,!0);/**
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
 */let n=e.rest_props(t,["$$slots","$$events","$$legacy"]);const r=[["path",{d:"m18 16 4-4-4-4"}],["path",{d:"m6 8-4 4 4 4"}],["path",{d:"m14.5 4-5 16"}]];U(v,e.spread_props({name:"code-xml"},()=>n,{get iconNode(){return r},children:(o,g)=>{var a=e.comment(),u=e.first_child(a);e.snippet(u,()=>t.children??e.noop),e.append(o,a)},$$slots:{default:!0}})),e.pop()}function ut(v,t){e.push(t,!0);/**
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
 */let n=e.rest_props(t,["$$slots","$$events","$$legacy"]);const r=[["path",{d:"M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"}],["circle",{cx:"12",cy:"12",r:"3"}]];U(v,e.spread_props({name:"eye"},()=>n,{get iconNode(){return r},children:(o,g)=>{var a=e.comment(),u=e.first_child(a);e.snippet(u,()=>t.children??e.noop),e.append(o,a)},$$slots:{default:!0}})),e.pop()}function tt(v,t){e.push(t,!0);/**
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
 */let n=e.rest_props(t,["$$slots","$$events","$$legacy"]);const r=[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56"}]];U(v,e.spread_props({name:"loader-circle"},()=>n,{get iconNode(){return r},children:(o,g)=>{var a=e.comment(),u=e.first_child(a);e.snippet(u,()=>t.children??e.noop),e.append(o,a)},$$slots:{default:!0}})),e.pop()}function mt(v,t){e.push(t,!0);/**
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
 */let n=e.rest_props(t,["$$slots","$$events","$$legacy"]);const r=[["path",{d:"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"}]];U(v,e.spread_props({name:"message-square"},()=>n,{get iconNode(){return r},children:(o,g)=>{var a=e.comment(),u=e.first_child(a);e.snippet(u,()=>t.children??e.noop),e.append(o,a)},$$slots:{default:!0}})),e.pop()}function He(v,t){e.push(t,!0);/**
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
 */let n=e.rest_props(t,["$$slots","$$events","$$legacy"]);const r=[["path",{d:"M5 12h14"}],["path",{d:"M12 5v14"}]];U(v,e.spread_props({name:"plus"},()=>n,{get iconNode(){return r},children:(o,g)=>{var a=e.comment(),u=e.first_child(a);e.snippet(u,()=>t.children??e.noop),e.append(o,a)},$$slots:{default:!0}})),e.pop()}function Oe(v,t){e.push(t,!0);/**
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
 */let n=e.rest_props(t,["$$slots","$$events","$$legacy"]);const r=[["path",{d:"m21 21-4.34-4.34"}],["circle",{cx:"11",cy:"11",r:"8"}]];U(v,e.spread_props({name:"search"},()=>n,{get iconNode(){return r},children:(o,g)=>{var a=e.comment(),u=e.first_child(a);e.snippet(u,()=>t.children??e.noop),e.append(o,a)},$$slots:{default:!0}})),e.pop()}function ft(v,t){e.push(t,!0);/**
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
 */let n=e.rest_props(t,["$$slots","$$events","$$legacy"]);const r=[["path",{d:"M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"}],["path",{d:"m21.854 2.147-10.94 10.939"}]];U(v,e.spread_props({name:"send"},()=>n,{get iconNode(){return r},children:(o,g)=>{var a=e.comment(),u=e.first_child(a);e.snippet(u,()=>t.children??e.noop),e.append(o,a)},$$slots:{default:!0}})),e.pop()}function xt(v,t){e.push(t,!0);/**
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
 */let n=e.rest_props(t,["$$slots","$$events","$$legacy"]);const r=[["path",{d:"M20 7h-9"}],["path",{d:"M14 17H5"}],["circle",{cx:"17",cy:"17",r:"3"}],["circle",{cx:"7",cy:"7",r:"3"}]];U(v,e.spread_props({name:"settings-2"},()=>n,{get iconNode(){return r},children:(o,g)=>{var a=e.comment(),u=e.first_child(a);e.snippet(u,()=>t.children??e.noop),e.append(o,a)},$$slots:{default:!0}})),e.pop()}function at(v,t){e.push(t,!0);/**
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
 */let n=e.rest_props(t,["$$slots","$$events","$$legacy"]);const r=[["path",{d:"M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"}],["path",{d:"M20 3v4"}],["path",{d:"M22 5h-4"}],["path",{d:"M4 17v2"}],["path",{d:"M5 18H3"}]];U(v,e.spread_props({name:"sparkles"},()=>n,{get iconNode(){return r},children:(o,g)=>{var a=e.comment(),u=e.first_child(a);e.snippet(u,()=>t.children??e.noop),e.append(o,a)},$$slots:{default:!0}})),e.pop()}function bt(v,t){e.push(t,!0);/**
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
 */let n=e.rest_props(t,["$$slots","$$events","$$legacy"]);const r=[["path",{d:"M3 6h18"}],["path",{d:"M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"}],["path",{d:"M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"}],["line",{x1:"10",x2:"10",y1:"11",y2:"17"}],["line",{x1:"14",x2:"14",y1:"11",y2:"17"}]];U(v,e.spread_props({name:"trash-2"},()=>n,{get iconNode(){return r},children:(o,g)=>{var a=e.comment(),u=e.first_child(a);e.snippet(u,()=>t.children??e.noop),e.append(o,a)},$$slots:{default:!0}})),e.pop()}function We(v,t){e.push(t,!0);/**
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
 */let n=e.rest_props(t,["$$slots","$$events","$$legacy"]);const r=[["path",{d:"m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72"}],["path",{d:"m14 7 3 3"}],["path",{d:"M5 6v4"}],["path",{d:"M19 14v4"}],["path",{d:"M10 2v2"}],["path",{d:"M7 8H3"}],["path",{d:"M21 16h-4"}],["path",{d:"M11 3H9"}]];U(v,e.spread_props({name:"wand-sparkles"},()=>n,{get iconNode(){return r},children:(o,g)=>{var a=e.comment(),u=e.first_child(a);e.snippet(u,()=>t.children??e.noop),e.append(o,a)},$$slots:{default:!0}})),e.pop()}let yt=0;class wt{constructor(){nt(this,qe,e.state(e.proxy([])))}get items(){return e.get(Ye(this,qe))}set items(t){e.set(Ye(this,qe),t,!0)}add(t,n,r=5e3){const o=++yt;return this.items.push({id:o,type:t,message:n}),r>0&&setTimeout(()=>this.remove(o),r),o}remove(t){this.items=this.items.filter(n=>n.id!==t)}success(t){return this.add("success",t)}error(t){return this.add("error",t,8e3)}warning(t){return this.add("warning",t)}info(t){return this.add("info",t)}}qe=new WeakMap;const $e=new wt;var kt=e.from_html("<button><!> </button>"),$t=e.from_html('<div role="button" tabindex="0"><!> <span class="flex-1 text-xs truncate"> </span> <button class="btn btn-ghost btn-xs text-error opacity-0 hover:opacity-100 group-hover:opacity-100"><!></button></div>'),St=e.from_html('<p class="text-xs text-center text-base-content/40 py-4">No chats yet</p>'),Nt=e.from_html('<div class="p-2"><button class="btn btn-primary btn-sm w-full gap-1"><!> New Chat</button></div> <div class="flex-1 overflow-y-auto p-2 space-y-1"><!> <!></div>',1),Mt=e.from_html('<p class="text-xs text-base-content/50 mt-0.5"> </p>'),At=e.from_html('<div class="card bg-base-100 shadow-sm"><div class="card-body p-3 gap-1"><div class="flex items-start justify-between gap-1"><div><p class="font-semibold text-xs"> </p> <!></div> <span class="badge badge-xs badge-outline"> </span></div> <button class="btn btn-xs btn-primary mt-1"><!> Run</button></div></div>'),Ct=e.from_html('<p class="text-xs text-center text-base-content/40 py-4">No templates</p>'),Pt=e.from_html('<div class="flex-1 overflow-y-auto p-2 space-y-2"><!> <!></div>'),zt=e.from_html('<span class="loading loading-spinner loading-xs"></span>'),jt=e.from_html('<div class="flex-1 p-3 space-y-3"><p class="text-xs text-base-content/60">Caută semantic în colecțiile cu AI Search activat.</p> <div class="form-control"><label class="label py-1" for="ai-search-collection"><span class="label-text text-xs">Colecție</span></label> <input id="ai-search-collection" type="text" class="input input-xs" placeholder="ex: articles"/></div> <div class="form-control"><label class="label py-1" for="ai-search-query"><span class="label-text text-xs">Query semantic</span></label> <textarea id="ai-search-query" class="textarea textarea-xs resize-none" placeholder="ex: articole despre machine learning în producție"></textarea></div> <button class="btn btn-primary btn-sm w-full"><!> Caută</button></div>'),qt=e.from_html('<span class="badge badge-xs badge-primary">default</span>'),It=e.from_html('<div class="card bg-base-100 shadow-sm mb-2"><div class="card-body p-3 gap-1"><div class="flex items-center gap-2"><span class="font-semibold text-xs"> </span> <!></div> <p class="text-xs font-mono text-base-content/50"> </p></div></div>'),Tt=e.from_html('<input type="text" placeholder="Label" class="input input-xs"/>'),Et=e.from_html('<input type="password" placeholder="API Key" class="input input-xs"/>'),Rt=e.from_html('<input type="text" placeholder="Base URL" class="input input-xs"/>'),Lt=e.from_html('<div class="card bg-base-100 shadow-sm"><div class="card-body p-3 gap-2"><select class="select select-xs"><option>OpenAI</option><option>Anthropic</option><option>Ollama (local)</option><option>Custom</option></select> <!> <!> <!> <input type="text" placeholder="Default model" class="input input-xs"/> <label class="flex items-center gap-2 text-xs cursor-pointer"><input type="checkbox" class="checkbox checkbox-xs"/> Set as default</label> <div class="flex gap-1"><button class="btn btn-primary btn-xs flex-1"> </button> <button class="btn btn-ghost btn-xs">Cancel</button></div></div></div>'),Ht=e.from_html('<div class="flex-1 overflow-y-auto p-3 space-y-3"><div><p class="text-xs font-semibold text-base-content/60 uppercase mb-2">AI Providers</p> <!> <button class="btn btn-sm btn-outline w-full"><!> Add Provider</button></div> <!></div>'),Ot=e.from_html('<span class="loading loading-spinner loading-xs"></span>'),Gt=e.from_html('<div class="flex-1 p-3 space-y-3"><p class="text-xs text-base-content/60">Ask in natural language — get SQL + results.</p> <textarea class="textarea textarea-xs w-full resize-none" placeholder="ex: Show me the 10 most recent users who signed up this month"></textarea> <button class="btn btn-primary btn-sm w-full"><!> Run Query</button></div>'),Dt=e.from_html('<span class="loading loading-spinner loading-xs"></span>'),Qt=e.from_html('<div class="flex-1 p-3 space-y-3"><p class="text-xs text-base-content/60">Describe your data model — AI generates the schema.</p> <textarea class="textarea textarea-xs w-full resize-none" placeholder="ex: A blog with posts (title, content, status), authors (name, bio), and tags"></textarea> <button class="btn btn-primary btn-sm w-full"><!> Generate Schema</button></div>'),Vt=e.from_html('<p class="text-sm text-warning mt-2">No AI provider configured. <button class="underline">Add one here →</button></p>'),Bt=e.from_html('<button class="text-left p-3 rounded-lg border border-base-300 text-xs text-base-content/60 hover:border-primary/40 hover:text-base-content transition-all"> </button>'),Wt=e.from_html('<button class="btn btn-primary btn-sm"><!> New Chat</button>'),Ft=e.from_html('<div class="flex-1 flex flex-col items-center justify-center gap-6 p-8"><div class="p-4 rounded-2xl bg-primary/5"><!></div> <div class="text-center max-w-sm"><h2 class="font-semibold text-lg">AI Studio</h2> <p class="text-sm text-base-content/50 mt-1">Chat with your data, generate schemas, run SQL queries, and search semantically.</p> <!></div> <div class="grid grid-cols-2 gap-2 w-full max-w-md"></div> <!></div>'),Ut=e.from_html('<div class="text-center text-base-content/40 py-8"><!> <p>Send a message to start the conversation</p></div>'),Jt=e.from_html('<div class="w-7 h-7 bg-primary/20 rounded-full flex items-center justify-center shrink-0 mt-1"><!></div>'),Kt=e.from_html('<div><!> <div class="max-w-xl"><div><p class="text-sm whitespace-pre-wrap"> </p></div></div></div>'),Zt=e.from_html('<div class="flex justify-start gap-2"><div class="w-7 h-7 bg-primary/20 rounded-full flex items-center justify-center shrink-0"><!></div> <div class="bg-base-200 rounded-2xl rounded-tl-none px-4 py-3"><span class="loading loading-dots loading-sm"></span></div></div>'),Yt=e.from_html('<div class="p-4 border-t border-base-300"><div class="flex gap-2 items-end"><textarea placeholder="Type a message… (Enter to send, Shift+Enter for newline)" class="textarea flex-1 resize-none min-h-11 max-h-32 text-sm"></textarea> <button class="btn btn-primary btn-sm h-11"><!></button></div></div>'),Xt=e.from_html('<div class="flex-1 overflow-y-auto p-4 space-y-4"><!> <!> <!></div> <!>',1),ea=e.from_html('<div class="alert alert-error mb-4 text-sm"> </div>'),ta=e.from_html('<div class="flex justify-center py-12"><span class="loading loading-spinner loading-lg text-primary"></span></div>'),aa=e.from_html('<div class="flex gap-2 text-sm mb-0.5"><span class="text-base-content/50 shrink-0 font-medium"> </span> <span class="truncate"> </span></div>'),sa=e.from_html('<div class="badge badge-primary badge-outline shrink-0 text-xs"> </div>'),ra=e.from_html('<div class="card bg-base-200 hover:bg-base-300 transition-colors"><div class="card-body p-4"><div class="flex items-start justify-between gap-2"><div class="flex-1 min-w-0"><p class="font-mono text-xs text-base-content/50 mb-1"> </p> <!></div> <!></div></div></div>'),ia=e.from_html('<div class="space-y-3"><p class="text-sm text-base-content/60"> <strong> </strong> în <code class="text-primary"> </code></p> <!></div>'),la=e.from_html('<div class="flex flex-col items-center justify-center py-16 text-base-content/40 gap-3"><!> <p>Niciun rezultat. Verifică că AI Search e activat pe colecție.</p></div>'),na=e.from_html(`<div class="flex flex-col items-center justify-center py-16 text-base-content/40 gap-3"><!> <p class="text-lg font-semibold">Semantic Search</p> <p class="text-sm text-center max-w-sm">Introdu o colecție și un query în sidebar pentru a căuta semantic în recorduri.
 AI Search trebuie activat pe colecție (Collections → AI Search tab).</p></div>`),oa=e.from_html('<div class="flex-1 overflow-y-auto p-6"><!> <!></div>'),da=e.from_html('<div class="flex justify-center py-12"><span class="loading loading-spinner loading-lg text-primary"></span></div>'),ca=e.from_html("<th> </th>"),pa=e.from_html('<td class="max-w-xs truncate"> </td>'),va=e.from_html("<tr></tr>"),_a=e.from_html('<div class="overflow-x-auto rounded-lg border border-base-300"><table class="table table-xs table-zebra"><thead><tr></tr></thead><tbody></tbody></table></div> <p class="text-xs text-base-content/40"> </p>',1),ha=e.from_html('<p class="text-sm text-base-content/40 text-center py-4">No rows returned</p>'),ga=e.from_html('<div class="space-y-4"><div class="rounded-lg bg-base-200 p-4"><p class="text-xs font-semibold text-base-content/50 uppercase mb-2">Generated SQL</p> <pre class="text-xs font-mono whitespace-pre-wrap text-primary"> </pre></div> <!></div>'),ua=e.from_html('<div class="flex flex-col items-center justify-center h-full text-base-content/40 gap-3"><!> <p class="text-lg font-semibold">AI Query Builder</p> <p class="text-sm text-center max-w-sm">Type a question in plain language — AI generates and runs the SQL read-only query.</p></div>'),ma=e.from_html('<div class="flex-1 overflow-auto p-6"><!></div>'),fa=e.from_html('<div class="flex justify-center py-12"><span class="loading loading-spinner loading-lg text-primary"></span></div>'),xa=e.from_html('<tr><td class="font-mono text-xs"> </td><td><span class="badge badge-sm badge-outline"> </span></td><td class="text-sm"> </td><td> </td><td> </td></tr>'),ba=e.from_html('<div class="space-y-4"><div class="flex items-center justify-between"><h2 class="font-bold text-lg">Generated: <code class="text-primary"> </code></h2> <div class="flex gap-2"><button class="btn btn-ghost btn-sm">Discard</button> <button class="btn btn-primary btn-sm"><!> Create Collection</button></div></div> <div class="overflow-x-auto rounded-lg border border-base-300"><table class="table table-sm"><thead><tr><th>Field</th><th>Type</th><th>Label</th><th>Required</th><th>Unique</th></tr></thead><tbody></tbody></table></div> <details class="collapse collapse-arrow border border-base-300 rounded-lg"><summary class="collapse-title text-xs font-semibold">Raw JSON</summary> <div class="collapse-content"><pre class="text-xs font-mono whitespace-pre-wrap"> </pre></div></details></div>'),ya=e.from_html('<div class="flex flex-col items-center justify-center h-full text-base-content/40 gap-3"><!> <p class="text-lg font-semibold">Schema Generator</p> <p class="text-sm text-center max-w-sm">Describe your data model in plain language — AI generates the collection schema ready to apply.</p></div>'),wa=e.from_html('<div class="flex-1 overflow-auto p-6"><!></div>'),ka=e.from_html('<div class="flex h-full -m-6"><aside class="w-64 border-r border-base-300 bg-base-200 flex flex-col shrink-0"><div class="px-2 pt-3 pb-2 space-y-0.5"></div> <div class="border-b border-base-300"></div> <!></aside> <div class="flex-1 flex flex-col bg-base-100"><!></div></div>');function $a(v,t){e.push(t,!0);let n=e.state(e.proxy([])),r=e.state(e.proxy([])),o=e.state(e.proxy([])),g=e.state(null),a=e.state("chat");const u=[{id:"chat",label:"Chat",icon:mt},{id:"search",label:"Semantic Search",icon:Oe},{id:"query",label:"NL → SQL",icon:Be},{id:"schema",label:"Schema Gen",icon:We},{id:"templates",label:"Templates",icon:_t},{id:"settings",label:"Settings",icon:xt}];let E=e.state(""),X=e.state(!1),q=e.state(e.proxy([])),R=e.state(""),I=e.state(""),N=e.state(e.proxy([])),j=e.state(!1),se=e.state(""),_e=e.state(""),ee=e.state(null),he=e.state(!1),ue=e.state(""),te=e.state(null),ye=e.state(!1),Se=e.state(!1),L=e.state(e.proxy({name:"openai",label:"OpenAI",api_key:"",base_url:"",default_model:"",is_default:!1})),Ae=e.state(!1);de.onMount(async()=>{await Ge()});async function Ge(){const[i,l,p]=await Promise.allSettled([Y.get("/api/ai/providers"),Y.get("/api/ai/chats"),Y.get("/api/ai/templates")]);i.status==="fulfilled"&&e.set(n,i.value.providers||[],!0),l.status==="fulfilled"&&e.set(r,l.value.chats||[],!0),p.status==="fulfilled"&&e.set(o,p.value.templates||[],!0)}async function ze(){const i=await Y.post("/api/ai/chats",{title:"New Chat"});e.set(r,[i.chat,...e.get(r)],!0),await Ie(i.chat)}async function Ie(i){const l=await Y.get(`/api/ai/chats/${i.id}`);e.set(g,l.chat,!0),e.set(q,l.chat.messages||[],!0)}async function De(){if(!e.get(E).trim()||!e.get(g)||e.get(X))return;const i=e.get(E).trim();e.set(E,""),e.set(X,!0),e.set(q,[...e.get(q),{role:"user",content:i}],!0);try{const l=await Y.post(`/api/ai/chats/${e.get(g).id}/messages`,{content:i});e.set(q,[...e.get(q),l.message],!0);const p=e.get(r).map(f=>f.id===e.get(g).id?{...f,title:i.slice(0,60)}:f);e.set(r,p,!0)}catch(l){e.set(q,e.get(q).slice(0,-1),!0),$e.error("Error: "+l.message)}finally{e.set(X,!1)}}async function Fe(i){var l;await Y.delete(`/api/ai/chats/${i}`),e.set(r,e.get(r).filter(p=>p.id!==i),!0),((l=e.get(g))==null?void 0:l.id)===i&&(e.set(g,null),e.set(q,[],!0))}async function M(){e.set(Ae,!0);try{await Y.post("/api/ai/admin/providers",e.get(L)),await Ge(),e.set(Se,!1),e.set(L,{name:"openai",label:"OpenAI",api_key:"",base_url:"",default_model:"",is_default:!1},!0)}catch(i){$e.error(i.message)}finally{e.set(Ae,!1)}}async function W(){if(!(!e.get(R).trim()||!e.get(I).trim())){e.set(j,!0),e.set(se,""),e.set(N,[],!0);try{const i=await Y.post("/api/ai/search",{collection:e.get(R).trim(),query:e.get(I).trim(),limit:10});e.set(N,i.results||[],!0)}catch(i){e.set(se,i.message||"Search failed",!0)}finally{e.set(j,!1)}}}async function re(){if(!(!e.get(_e).trim()||e.get(he))){e.set(he,!0),e.set(ee,null);try{const i=await Y.post("/api/ai/query",{prompt:e.get(_e).trim()});e.set(ee,i,!0)}catch(i){$e.error(i.message??"Query failed")}finally{e.set(he,!1)}}}async function ie(){if(!(!e.get(ue).trim()||e.get(ye))){e.set(ye,!0),e.set(te,null);try{const i=await Y.post("/api/ai/schema-gen",{description:e.get(ue).trim()});e.set(te,i.schema,!0)}catch(i){$e.error(i.message??"Schema generation failed")}finally{e.set(ye,!1)}}}async function we(){if(e.get(te))try{await Y.post("/api/collections",e.get(te)),$e.success(`Collection "${e.get(te).name}" created!`),e.set(te,null),e.set(ue,"")}catch(i){$e.error(i.message??"Failed to create collection")}}async function Ne(i){const l={},p=typeof i.variables=="string"?JSON.parse(i.variables):i.variables||[];for(const k of p){const b=prompt(`Enter value for "${k.name}":`);b!==null&&(l[k.name]=b)}const f=await Y.post(`/api/ai/templates/${i.id}/run`,{variables:l});e.set(q,[{role:"user",content:`[Template: ${i.name}]
${Object.entries(l).map(([k,b])=>`${k}: ${b}`).join(`
`)}`},{role:"assistant",content:f.result.content}],!0),e.set(g,null),e.set(a,"chat")}var ce=ka(),me=e.child(ce),ke=e.child(me);e.each(ke,21,()=>u,e.index,(i,l)=>{var p=kt(),f=e.child(p);e.component(f,()=>e.get(l).icon,(b,_)=>{_(b,{size:14,class:"shrink-0"})});var k=e.sibling(f);e.reset(p),e.template_effect(()=>{e.set_class(p,1,`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12px] font-medium transition-colors
           ${e.get(a)===e.get(l).id?"bg-primary/10 text-primary":"text-base-content/60 hover:bg-base-200 hover:text-base-content"}`),e.set_text(k,` ${e.get(l).label??""}`)}),e.delegated("click",p,()=>e.set(a,e.get(l).id,!0)),e.append(i,p)}),e.reset(ke);var fe=e.sibling(ke,4);{var J=i=>{var l=Nt(),p=e.first_child(l),f=e.child(p),k=e.child(f);He(k,{size:14}),e.next(),e.reset(f),e.reset(p);var b=e.sibling(p,2),_=e.child(b);e.each(_,17,()=>e.get(r),e.index,(h,s)=>{var c=$t(),m=e.child(c);Le(m,{size:14,class:"shrink-0 text-base-content/50"});var w=e.sibling(m,2),A=e.child(w,!0);e.reset(w);var x=e.sibling(w,2),y=e.child(x);bt(y,{size:10}),e.reset(x),e.reset(c),e.template_effect(()=>{var S;e.set_class(c,1,`flex items-center gap-2 p-2 rounded-lg hover:bg-base-300 cursor-pointer ${((S=e.get(g))==null?void 0:S.id)===e.get(s).id?"bg-base-300":""}`),e.set_text(A,e.get(s).title||"New Chat")}),e.delegated("click",c,()=>Ie(e.get(s))),e.delegated("keydown",c,S=>(S.key==="Enter"||S.key===" ")&&Ie(e.get(s))),e.delegated("click",x,S=>{S.stopPropagation(),Fe(e.get(s).id)}),e.append(h,c)});var d=e.sibling(_,2);{var $=h=>{var s=St();e.append(h,s)};e.if(d,h=>{e.get(r).length===0&&h($)})}e.reset(b),e.delegated("click",f,ze),e.append(i,l)},H=i=>{var l=Pt(),p=e.child(l);e.each(p,17,()=>e.get(o),e.index,(b,_)=>{var d=At(),$=e.child(d),h=e.child($),s=e.child(h),c=e.child(s),m=e.child(c,!0);e.reset(c);var w=e.sibling(c,2);{var A=P=>{var z=Mt(),F=e.child(z,!0);e.reset(z),e.template_effect(()=>e.set_text(F,e.get(_).description)),e.append(P,z)};e.if(w,P=>{e.get(_).description&&P(A)})}e.reset(s);var x=e.sibling(s,2),y=e.child(x,!0);e.reset(x),e.reset(h);var S=e.sibling(h,2),O=e.child(S);at(O,{size:10}),e.next(),e.reset(S),e.reset($),e.reset(d),e.template_effect(()=>{e.set_text(m,e.get(_).name),e.set_text(y,e.get(_).category)}),e.delegated("click",S,()=>Ne(e.get(_))),e.append(b,d)});var f=e.sibling(p,2);{var k=b=>{var _=Ct();e.append(b,_)};e.if(f,b=>{e.get(o).length===0&&b(k)})}e.reset(l),e.append(i,l)},ae=i=>{var l=jt(),p=e.sibling(e.child(l),2),f=e.sibling(e.child(p),2);e.remove_input_defaults(f),e.reset(p);var k=e.sibling(p,2),b=e.sibling(e.child(k),2);e.remove_textarea_child(b),e.set_attribute(b,"rows",3),e.reset(k);var _=e.sibling(k,2),d=e.child(_);{var $=s=>{var c=zt();e.append(s,c)},h=s=>{Oe(s,{size:12})};e.if(d,s=>{e.get(j)?s($):s(h,-1)})}e.next(),e.reset(_),e.reset(l),e.template_effect(()=>_.disabled=e.get(j)||!e.get(R)||!e.get(I)),e.bind_value(f,()=>e.get(R),s=>e.set(R,s)),e.bind_value(b,()=>e.get(I),s=>e.set(I,s)),e.delegated("click",_,W),e.append(i,l)},pe=i=>{var l=Ht(),p=e.child(l),f=e.sibling(e.child(p),2);e.each(f,17,()=>e.get(n),e.index,($,h)=>{var s=It(),c=e.child(s),m=e.child(c),w=e.child(m),A=e.child(w,!0);e.reset(w);var x=e.sibling(w,2);{var y=P=>{var z=qt();e.append(P,z)};e.if(x,P=>{e.get(h).isDefault&&P(y)})}e.reset(m);var S=e.sibling(m,2),O=e.child(S,!0);e.reset(S),e.reset(c),e.reset(s),e.template_effect(()=>{e.set_text(A,e.get(h).label),e.set_text(O,e.get(h).name)}),e.append($,s)});var k=e.sibling(f,2),b=e.child(k);He(b,{size:14}),e.next(),e.reset(k),e.reset(p);var _=e.sibling(p,2);{var d=$=>{var h=Lt(),s=e.child(h),c=e.child(s),m=e.child(c);m.value=m.__value="openai";var w=e.sibling(m);w.value=w.__value="anthropic";var A=e.sibling(w);A.value=A.__value="ollama";var x=e.sibling(A);x.value=x.__value="custom",e.reset(c);var y=e.sibling(c,2);{var S=C=>{var V=Tt();e.remove_input_defaults(V),e.bind_value(V,()=>e.get(L).label,oe=>e.get(L).label=oe),e.append(C,V)};e.if(y,C=>{e.get(L).name==="custom"&&C(S)})}var O=e.sibling(y,2);{var P=C=>{var V=Et();e.remove_input_defaults(V),e.bind_value(V,()=>e.get(L).api_key,oe=>e.get(L).api_key=oe),e.append(C,V)};e.if(O,C=>{e.get(L).name!=="ollama"&&C(P)})}var z=e.sibling(O,2);{var F=C=>{var V=Rt();e.remove_input_defaults(V),e.bind_value(V,()=>e.get(L).base_url,oe=>e.get(L).base_url=oe),e.append(C,V)};e.if(z,C=>{(e.get(L).name==="ollama"||e.get(L).name==="custom")&&C(F)})}var ne=e.sibling(z,2);e.remove_input_defaults(ne);var K=e.sibling(ne,2),G=e.child(K);e.remove_input_defaults(G),e.next(),e.reset(K);var Q=e.sibling(K,2),Z=e.child(Q),be=e.child(Z,!0);e.reset(Z);var ve=e.sibling(Z,2);e.reset(Q),e.reset(s),e.reset(h),e.template_effect(()=>{Z.disabled=e.get(Ae),e.set_text(be,e.get(Ae)?"Saving…":"Save")}),e.bind_select_value(c,()=>e.get(L).name,C=>e.get(L).name=C),e.bind_value(ne,()=>e.get(L).default_model,C=>e.get(L).default_model=C),e.bind_checked(G,()=>e.get(L).is_default,C=>e.get(L).is_default=C),e.delegated("click",Z,M),e.delegated("click",ve,()=>e.set(Se,!1)),e.append($,h)};e.if(_,$=>{e.get(Se)&&$(d)})}e.reset(l),e.delegated("click",k,()=>e.set(Se,!e.get(Se))),e.append(i,l)},Ce=i=>{var l=Gt(),p=e.sibling(e.child(l),2);e.remove_textarea_child(p),e.set_attribute(p,"rows",4);var f=e.sibling(p,2),k=e.child(f);{var b=d=>{var $=Ot();e.append(d,$)},_=d=>{Be(d,{size:12})};e.if(k,d=>{e.get(he)?d(b):d(_,-1)})}e.next(),e.reset(f),e.reset(l),e.template_effect(d=>f.disabled=d,[()=>e.get(he)||!e.get(_e).trim()]),e.delegated("keydown",p,d=>{d.key==="Enter"&&(d.metaKey||d.ctrlKey)&&re()}),e.bind_value(p,()=>e.get(_e),d=>e.set(_e,d)),e.delegated("click",f,re),e.append(i,l)},Me=i=>{var l=Qt(),p=e.sibling(e.child(l),2);e.remove_textarea_child(p),e.set_attribute(p,"rows",5);var f=e.sibling(p,2),k=e.child(f);{var b=d=>{var $=Dt();e.append(d,$)},_=d=>{We(d,{size:12})};e.if(k,d=>{e.get(ye)?d(b):d(_,-1)})}e.next(),e.reset(f),e.reset(l),e.template_effect(d=>f.disabled=d,[()=>e.get(ye)||!e.get(ue).trim()]),e.bind_value(p,()=>e.get(ue),d=>e.set(ue,d)),e.delegated("click",f,ie),e.append(i,l)};e.if(fe,i=>{e.get(a)==="chat"?i(J):e.get(a)==="templates"?i(H,1):e.get(a)==="search"?i(ae,2):e.get(a)==="settings"?i(pe,3):e.get(a)==="query"?i(Ce,4):e.get(a)==="schema"&&i(Me,5)})}e.reset(me);var xe=e.sibling(me,2),le=e.child(xe);{var T=i=>{var l=Ft(),p=e.child(l),f=e.child(p);Le(f,{size:40,class:"text-primary/60"}),e.reset(p);var k=e.sibling(p,2),b=e.sibling(e.child(k),4);{var _=s=>{var c=Vt(),m=e.sibling(e.child(c));e.reset(c),e.delegated("click",m,()=>e.set(a,"settings")),e.append(s,c)};e.if(b,s=>{e.get(n).length===0&&s(_)})}e.reset(k);var d=e.sibling(k,2);e.each(d,20,()=>["Show me all collections with their record counts","Generate a schema for an e-commerce product catalog","Find records where status is pending from the last 7 days","What are the most active collections this week?"],e.index,(s,c)=>{var m=Bt(),w=e.child(m,!0);e.reset(m),e.template_effect(()=>e.set_text(w,c)),e.delegated("click",m,async()=>{e.get(g)||await ze(),e.set(E,c,!0)}),e.append(s,m)}),e.reset(d);var $=e.sibling(d,2);{var h=s=>{var c=Wt(),m=e.child(c);He(m,{size:14}),e.next(),e.reset(c),e.delegated("click",c,ze),e.append(s,c)};e.if($,s=>{e.get(g)||s(h)})}e.reset(l),e.append(i,l)},ge=i=>{var l=Xt(),p=e.first_child(l),f=e.child(p);{var k=s=>{var c=Ut(),m=e.child(c);at(m,{size:32,class:"mx-auto mb-2 opacity-30"}),e.next(2),e.reset(c),e.append(s,c)};e.if(f,s=>{e.get(q).length===0&&s(k)})}var b=e.sibling(f,2);e.each(b,17,()=>e.get(q),e.index,(s,c)=>{var m=Kt(),w=e.child(m);{var A=P=>{var z=Jt(),F=e.child(z);Le(F,{size:14,class:"text-primary"}),e.reset(z),e.append(P,z)};e.if(w,P=>{e.get(c).role!=="user"&&P(A)})}var x=e.sibling(w,2),y=e.child(x),S=e.child(y),O=e.child(S,!0);e.reset(S),e.reset(y),e.reset(x),e.reset(m),e.template_effect(()=>{e.set_class(m,1,`flex ${e.get(c).role==="user"?"justify-end":"justify-start"} gap-2`),e.set_class(y,1,`rounded-2xl px-4 py-2.5 ${e.get(c).role==="user"?"bg-primary text-primary-content rounded-tr-none":"bg-base-200 rounded-tl-none"}`),e.set_text(O,e.get(c).content)}),e.append(s,m)});var _=e.sibling(b,2);{var d=s=>{var c=Zt(),m=e.child(c),w=e.child(m);Le(w,{size:14,class:"text-primary"}),e.reset(m),e.next(2),e.reset(c),e.append(s,c)};e.if(_,s=>{e.get(X)&&s(d)})}e.reset(p);var $=e.sibling(p,2);{var h=s=>{var c=Yt(),m=e.child(c),w=e.child(m);e.remove_textarea_child(w),e.set_attribute(w,"rows",1);var A=e.sibling(w,2),x=e.child(A);ft(x,{size:16}),e.reset(A),e.reset(m),e.reset(c),e.template_effect(y=>A.disabled=y,[()=>!e.get(E).trim()||e.get(X)]),e.delegated("keydown",w,y=>{y.key==="Enter"&&!y.shiftKey&&(y.preventDefault(),De())}),e.bind_value(w,()=>e.get(E),y=>e.set(E,y)),e.delegated("click",A,De),e.append(s,c)};e.if($,s=>{e.get(g)&&s(h)})}e.append(i,l)},je=i=>{var l=oa(),p=e.child(l);{var f=h=>{var s=ea(),c=e.child(s,!0);e.reset(s),e.template_effect(()=>e.set_text(c,e.get(se))),e.append(h,s)};e.if(p,h=>{e.get(se)&&h(f)})}var k=e.sibling(p,2);{var b=h=>{var s=ta();e.append(h,s)},_=h=>{var s=ia(),c=e.child(s),m=e.child(c),w=e.sibling(m),A=e.child(w);e.reset(w);var x=e.sibling(w,2),y=e.child(x,!0);e.reset(x),e.reset(c);var S=e.sibling(c,2);e.each(S,17,()=>e.get(N),e.index,(O,P)=>{var z=ra(),F=e.child(z),ne=e.child(F),K=e.child(ne),G=e.child(K),Q=e.child(G,!0);e.reset(G);var Z=e.sibling(G,2);e.each(Z,17,()=>Object.entries(e.get(P)).filter(([C])=>!["id","created_at","updated_at","created_by","updated_by","_score"].includes(C)),e.index,(C,V)=>{var oe=e.derived(()=>e.to_array(e.get(V),2));let Re=()=>e.get(oe)[0],Pe=()=>e.get(oe)[1];var Qe=e.comment(),Ve=e.first_child(Qe);{var Ue=Je=>{var Ke=aa(),Ze=e.child(Ke),Ya=e.child(Ze);e.reset(Ze);var rt=e.sibling(Ze,2),Xa=e.child(rt,!0);e.reset(rt),e.reset(Ke),e.template_effect(es=>{e.set_text(Ya,`${Re()??""}:`),e.set_text(Xa,es)},[()=>String(Pe()).slice(0,200)]),e.append(Je,Ke)},Za=e.derived(()=>Pe()!=null&&String(Pe()).length>0);e.if(Ve,Je=>{e.get(Za)&&Je(Ue)})}e.append(C,Qe)}),e.reset(K);var be=e.sibling(K,2);{var ve=C=>{var V=sa(),oe=e.child(V);e.reset(V),e.template_effect(Re=>e.set_text(oe,`${Re??""}%`),[()=>(e.get(P)._score*100).toFixed(1)]),e.append(C,V)};e.if(be,C=>{e.get(P)._score!=null&&C(ve)})}e.reset(ne),e.reset(F),e.reset(z),e.template_effect(()=>e.set_text(Q,e.get(P).id)),e.append(O,z)}),e.reset(s),e.template_effect(()=>{e.set_text(m,`${e.get(N).length??""} rezultate pentru `),e.set_text(A,`"${e.get(I)??""}"`),e.set_text(y,e.get(R))}),e.append(h,s)},d=h=>{var s=la(),c=e.child(s);Oe(c,{size:40,class:"opacity-20"}),e.next(2),e.reset(s),e.append(h,s)},$=h=>{var s=na(),c=e.child(s);Oe(c,{size:48,class:"opacity-20"}),e.next(4),e.reset(s),e.append(h,s)};e.if(k,h=>{e.get(j)?h(b):e.get(N).length>0?h(_,1):e.get(I)&&!e.get(j)?h(d,2):h($,-1)})}e.reset(l),e.append(i,l)},Te=i=>{var l=ma(),p=e.child(l);{var f=_=>{var d=da();e.append(_,d)},k=_=>{var d=ga(),$=e.child(d),h=e.sibling(e.child($),2),s=e.child(h,!0);e.reset(h),e.reset($);var c=e.sibling($,2);{var m=A=>{var x=_a(),y=e.first_child(x),S=e.child(y),O=e.child(S),P=e.child(O);e.each(P,21,()=>e.get(ee).columns,e.index,(K,G)=>{var Q=ca(),Z=e.child(Q,!0);e.reset(Q),e.template_effect(()=>e.set_text(Z,e.get(G))),e.append(K,Q)}),e.reset(P),e.reset(O);var z=e.sibling(O);e.each(z,21,()=>e.get(ee).data,e.index,(K,G)=>{var Q=va();e.each(Q,21,()=>e.get(ee).columns,e.index,(Z,be)=>{var ve=pa(),C=e.child(ve,!0);e.reset(ve),e.template_effect(()=>e.set_text(C,e.get(G)[e.get(be)]??"")),e.append(Z,ve)}),e.reset(Q),e.append(K,Q)}),e.reset(z),e.reset(S),e.reset(y);var F=e.sibling(y,2),ne=e.child(F);e.reset(F),e.template_effect(()=>e.set_text(ne,`${e.get(ee).data.length??""} row(s) returned`)),e.append(A,x)},w=A=>{var x=ha();e.append(A,x)};e.if(c,A=>{e.get(ee).data.length>0?A(m):A(w,-1)})}e.reset(d),e.template_effect(()=>e.set_text(s,e.get(ee).sql)),e.append(_,d)},b=_=>{var d=ua(),$=e.child(d);Be($,{size:48,class:"opacity-20"}),e.next(4),e.reset(d),e.append(_,d)};e.if(p,_=>{e.get(he)?_(f):e.get(ee)?_(k,1):_(b,-1)})}e.reset(l),e.append(i,l)},Ee=i=>{var l=wa(),p=e.child(l);{var f=_=>{var d=fa();e.append(_,d)},k=_=>{var d=ba(),$=e.child(d),h=e.child($),s=e.sibling(e.child(h)),c=e.child(s,!0);e.reset(s),e.reset(h);var m=e.sibling(h,2),w=e.child(m),A=e.sibling(w,2),x=e.child(A);He(x,{size:14}),e.next(),e.reset(A),e.reset(m),e.reset($);var y=e.sibling($,2),S=e.child(y),O=e.sibling(e.child(S));e.each(O,21,()=>e.get(te).fields||[],e.index,(K,G)=>{var Q=xa(),Z=e.child(Q),be=e.child(Z,!0);e.reset(Z);var ve=e.sibling(Z),C=e.child(ve),V=e.child(C,!0);e.reset(C),e.reset(ve);var oe=e.sibling(ve),Re=e.child(oe,!0);e.reset(oe);var Pe=e.sibling(oe),Qe=e.child(Pe,!0);e.reset(Pe);var Ve=e.sibling(Pe),Ue=e.child(Ve,!0);e.reset(Ve),e.reset(Q),e.template_effect(()=>{e.set_text(be,e.get(G).name),e.set_text(V,e.get(G).type),e.set_text(Re,e.get(G).label||""),e.set_text(Qe,e.get(G).required?"✓":""),e.set_text(Ue,e.get(G).unique?"✓":"")}),e.append(K,Q)}),e.reset(O),e.reset(S),e.reset(y);var P=e.sibling(y,2),z=e.sibling(e.child(P),2),F=e.child(z),ne=e.child(F,!0);e.reset(F),e.reset(z),e.reset(P),e.reset(d),e.template_effect(K=>{e.set_text(c,e.get(te).name),e.set_text(ne,K)},[()=>JSON.stringify(e.get(te),null,2)]),e.delegated("click",w,()=>e.set(te,null)),e.delegated("click",A,we),e.append(_,d)},b=_=>{var d=ya(),$=e.child(d);We($,{size:48,class:"opacity-20"}),e.next(4),e.reset(d),e.append(_,d)};e.if(p,_=>{e.get(ye)?_(f):e.get(te)?_(k,1):_(b,-1)})}e.reset(l),e.append(i,l)};e.if(le,i=>{e.get(a)==="chat"&&(!e.get(g)||e.get(q).length===0)?i(T):e.get(a)==="chat"?i(ge,1):e.get(a)==="search"?i(je,2):e.get(a)==="query"?i(Te,3):e.get(a)==="schema"&&i(Ee,4)})}e.reset(xe),e.reset(ce),e.append(v,ce),e.pop()}e.delegate(["click","keydown"]);var Sa=e.from_html('<span class="badge badge-ghost badge-sm font-mono"> </span>'),Na=e.from_html('<p class="text-sm text-base-content/50 mt-0.5"> </p>'),Ma=e.from_html('<div class="flex items-start justify-between gap-4 mb-6"><div><div class="flex items-center gap-2.5"><h1 class="text-xl font-semibold text-base-content"> </h1> <!></div> <!></div> <!></div>');function Aa(v,t){e.push(t,!0);var n=Ma(),r=e.child(n),o=e.child(r),g=e.child(o),a=e.child(g,!0);e.reset(g);var u=e.sibling(g,2);{var E=N=>{var j=Sa(),se=e.child(j,!0);e.reset(j),e.template_effect(_e=>e.set_text(se,_e),[()=>t.count.toLocaleString()]),e.append(N,j)};e.if(u,N=>{t.count!==void 0&&t.count!==null&&N(E)})}e.reset(o);var X=e.sibling(o,2);{var q=N=>{var j=Na(),se=e.child(j,!0);e.reset(j),e.template_effect(()=>e.set_text(se,t.subtitle)),e.append(N,j)};e.if(X,N=>{t.subtitle&&N(q)})}e.reset(r);var R=e.sibling(r,2);{var I=N=>{var j=e.comment(),se=e.first_child(j);e.snippet(se,()=>t.children),e.append(N,j)};e.if(R,N=>{t.children&&N(I)})}e.reset(n),e.template_effect(()=>e.set_text(a,t.title)),e.append(v,n),e.pop()}var Ca=e.from_html('<a class="text-base-content/60 hover:text-base-content"> </a>'),Pa=e.from_html('<span class="text-base-content font-medium"> </span>'),za=e.from_html("<li><!></li>"),ja=e.from_html("<div><ul></ul></div>");function qa(v,t){e.push(t,!0);let n=e.prop(t,"class",3,"");var r=ja(),o=e.child(r);e.each(o,21,()=>t.crumbs,e.index,(g,a,u)=>{var E=za(),X=e.child(E);{var q=I=>{var N=Ca(),j=e.child(N,!0);e.reset(N),e.template_effect(()=>{e.set_attribute(N,"href",e.get(a).href),e.set_text(j,e.get(a).label)}),e.append(I,N)},R=I=>{var N=Pa(),j=e.child(N,!0);e.reset(N),e.template_effect(()=>e.set_text(j,e.get(a).label)),e.append(I,N)};e.if(X,I=>{e.get(a).href&&u<t.crumbs.length-1?I(q):I(R,-1)})}e.reset(E),e.append(g,E)}),e.reset(o),e.reset(r),e.template_effect(()=>e.set_class(r,1,`breadcrumbs text-sm ${n()??""}`)),e.append(v,r),e.pop()}var Ia=e.from_html("<!> Generating preview...",1),Ta=e.from_html("<!> Preview Schema",1),Ea=e.from_html('<div class="space-y-4"><div><label class="mb-1 block text-sm font-medium text-gray-700" for="desc">Application description</label> <textarea id="desc" placeholder="E.g. A project management app with teams, projects, tasks, comments, and file attachments. Tasks have priority, due date, and status. Team members can be assigned to tasks." class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"></textarea> <p class="mt-1 text-xs text-gray-400"> </p></div> <button class="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"><!></button></div>'),Ra=e.from_html('<p class="text-xs text-gray-500 mt-0.5"> </p>'),La=e.from_html('<tr><td class="py-1 font-mono"> </td><td class="py-1"><span class="rounded bg-blue-100 px-1.5 py-0.5 text-blue-700"> </span></td><td class="py-1 text-gray-500"> </td></tr>'),Ha=e.from_html('<div class="border-t border-gray-100 bg-gray-50 px-4 py-2"><table class="w-full text-xs"><thead><tr class="text-gray-400"><th class="py-1 text-left font-medium">Field</th><th class="py-1 text-left font-medium">Type</th><th class="py-1 text-left font-medium">Required</th></tr></thead><tbody class="divide-y divide-gray-100"></tbody></table></div>'),Oa=e.from_html('<div><button class="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50"><div><span class="font-medium text-sm"> </span> <code class="ml-2 text-xs text-gray-400"> </code> <!></div> <div class="flex items-center gap-2 text-xs text-gray-400"><span> </span> <!></div></button> <!></div>'),Ga=e.from_html("<!> Creating...",1),Da=e.from_html("<!> Create Schema",1),Qa=e.from_html('<div class="space-y-4"><div class="flex gap-4 rounded-lg border border-purple-100 bg-purple-50 px-4 py-3 text-sm"><div><span class="font-semibold text-purple-700"> </span> <span class="text-gray-600">collections</span></div> <div><span class="font-semibold text-purple-700"> </span> <span class="text-gray-600">total fields</span></div> <div class="ml-auto text-xs text-gray-400">Token valid 10 min</div></div> <div class="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white"></div> <div class="flex gap-3"><button class="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"><!> Back</button> <button class="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"><!></button></div></div>'),Va=e.from_html('<code class="rounded bg-green-100 px-2 py-0.5 text-xs text-green-800"> </code>'),Ba=e.from_html('<div class="mt-3"><p class="text-sm font-medium text-green-800 mb-1"> </p> <div class="flex flex-wrap gap-1"></div></div>'),Wa=e.from_html('<code class="rounded bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800"> </code>'),Fa=e.from_html('<div class="mt-2"><p class="text-sm font-medium text-yellow-700 mb-1">Skipped (already exist):</p> <div class="flex flex-wrap gap-1"></div></div>'),Ua=e.from_html('<div class="space-y-4"><div class="rounded-lg border border-green-200 bg-green-50 px-4 py-4"><div class="flex items-center gap-2 text-green-700"><!> <span class="font-semibold">Schema created successfully</span></div> <!> <!></div> <div class="flex gap-3"><a href="/collections" class="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700">View Collections</a> <button class="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Generate Another</button></div></div>'),Ja=e.from_html('<div class="mx-auto max-w-3xl space-y-6 p-6"><!> <!> <div class="flex items-center gap-2 text-sm"><span>1. Describe</span> <span class="text-gray-300">→</span> <span>2. Review</span> <span class="text-gray-300">→</span> <span>3. Done</span></div> <!> <!> <!></div>');function Ka(v,t){e.push(t,!0);const n="";let r=e.state("input"),o=e.state(""),g=e.state(!1),a=e.state(null),u=e.state(""),E=e.state(0),X=e.state(0),q=e.state(e.proxy(new Set)),R=e.state(e.proxy([])),I=e.state(e.proxy([]));async function N(){if(e.get(o).trim()){e.set(g,!0);try{const M=await Y.post("/api/ai/preview-schema",{description:e.get(o)});e.set(a,M.preview,!0),e.set(u,M.confirm_token,!0),e.set(E,M.collections_count,!0),e.set(X,M.estimated_fields,!0),M.preview.collections.length>0&&e.set(q,new Set([M.preview.collections[0].name]),!0),e.set(r,"preview")}catch(M){$e.error(M.message??"Preview generation failed")}finally{e.set(g,!1)}}}async function j(){e.set(g,!0);try{const M=await Y.post("/api/ai/generate-schema",{confirm_token:e.get(u)});e.set(R,M.collections,!0),e.set(I,M.skipped,!0),e.set(r,"done")}catch(M){$e.error(M.message??"Schema creation failed")}finally{e.set(g,!1)}}function se(M){const W=new Set(e.get(q));W.has(M)?W.delete(M):W.add(M),e.set(q,W,!0)}function _e(){e.set(r,"input"),e.set(o,""),e.set(a,null),e.set(u,""),e.set(R,[],!0),e.set(I,[],!0)}var ee=Ja(),he=e.child(ee);qa(he,{crumbs:[{label:"AI Hub",href:`${n}/ai`},{label:"Schema Generator"}]});var ue=e.sibling(he,2);Aa(ue,{title:"AI Schema Generator",subtitle:"Describe your app — AI will design the database schema"});var te=e.sibling(ue,2),ye=e.child(te),Se=e.sibling(ye,4),L=e.sibling(Se,4);e.reset(te);var Ae=e.sibling(te,2);{var Ge=M=>{var W=Ea(),re=e.child(W),ie=e.sibling(e.child(re),2);e.remove_textarea_child(ie),e.set_attribute(ie,"rows",6);var we=e.sibling(ie,2),Ne=e.child(we);e.reset(we),e.reset(re);var ce=e.sibling(re,2),me=e.child(ce);{var ke=J=>{var H=Ia(),ae=e.first_child(H);tt(ae,{class:"h-4 w-4 animate-spin"}),e.next(),e.append(J,H)},fe=J=>{var H=Ta(),ae=e.first_child(H);ut(ae,{class:"h-4 w-4"}),e.next(),e.append(J,H)};e.if(me,J=>{e.get(g)?J(ke):J(fe,-1)})}e.reset(ce),e.reset(W),e.template_effect(J=>{e.set_text(Ne,`${e.get(o).length??""}/4000 characters`),ce.disabled=J},[()=>e.get(g)||e.get(o).trim().length<10]),e.bind_value(ie,()=>e.get(o),J=>e.set(o,J)),e.delegated("click",ce,N),e.append(M,W)};e.if(Ae,M=>{e.get(r)==="input"&&M(Ge)})}var ze=e.sibling(Ae,2);{var Ie=M=>{var W=Qa(),re=e.child(W),ie=e.child(re),we=e.child(ie),Ne=e.child(we,!0);e.reset(we),e.next(2),e.reset(ie);var ce=e.sibling(ie,2),me=e.child(ce),ke=e.child(me,!0);e.reset(me),e.next(2),e.reset(ce),e.next(2),e.reset(re);var fe=e.sibling(re,2);e.each(fe,21,()=>e.get(a).collections,e.index,(le,T)=>{var ge=Oa(),je=e.child(ge),Te=e.child(je),Ee=e.child(Te),i=e.child(Ee,!0);e.reset(Ee);var l=e.sibling(Ee,2),p=e.child(l,!0);e.reset(l);var f=e.sibling(l,2);{var k=x=>{var y=Ra(),S=e.child(y,!0);e.reset(y),e.template_effect(()=>e.set_text(S,e.get(T).description)),e.append(x,y)};e.if(f,x=>{e.get(T).description&&x(k)})}e.reset(Te);var b=e.sibling(Te,2),_=e.child(b),d=e.child(_);e.reset(_);var $=e.sibling(_,2);{var h=x=>{ht(x,{class:"h-4 w-4"})},s=e.derived(()=>e.get(q).has(e.get(T).name)),c=x=>{gt(x,{class:"h-4 w-4"})};e.if($,x=>{e.get(s)?x(h):x(c,-1)})}e.reset(b),e.reset(je);var m=e.sibling(je,2);{var w=x=>{var y=Ha(),S=e.child(y),O=e.sibling(e.child(S));e.each(O,21,()=>e.get(T).fields,e.index,(P,z)=>{var F=La(),ne=e.child(F),K=e.child(ne,!0);e.reset(ne);var G=e.sibling(ne),Q=e.child(G),Z=e.child(Q,!0);e.reset(Q),e.reset(G);var be=e.sibling(G),ve=e.child(be,!0);e.reset(be),e.reset(F),e.template_effect(()=>{e.set_text(K,e.get(z).name),e.set_text(Z,e.get(z).type),e.set_text(ve,e.get(z).required?"Yes":"—")}),e.append(P,F)}),e.reset(O),e.reset(S),e.reset(y),e.append(x,y)},A=e.derived(()=>e.get(q).has(e.get(T).name));e.if(m,x=>{e.get(A)&&x(w)})}e.reset(ge),e.template_effect(()=>{e.set_text(i,e.get(T).displayName??e.get(T).name),e.set_text(p,e.get(T).name),e.set_text(d,`${e.get(T).fields.length??""} fields`)}),e.delegated("click",je,()=>se(e.get(T).name)),e.append(le,ge)}),e.reset(fe);var J=e.sibling(fe,2),H=e.child(J),ae=e.child(H);vt(ae,{class:"h-4 w-4"}),e.next(),e.reset(H);var pe=e.sibling(H,2),Ce=e.child(pe);{var Me=le=>{var T=Ga(),ge=e.first_child(T);tt(ge,{class:"h-4 w-4 animate-spin"}),e.next(),e.append(le,T)},xe=le=>{var T=Da(),ge=e.first_child(T);et(ge,{class:"h-4 w-4"}),e.next(),e.append(le,T)};e.if(Ce,le=>{e.get(g)?le(Me):le(xe,-1)})}e.reset(pe),e.reset(J),e.reset(W),e.template_effect(()=>{e.set_text(Ne,e.get(E)),e.set_text(ke,e.get(X)),pe.disabled=e.get(g)}),e.delegated("click",H,()=>{e.set(r,"input")}),e.delegated("click",pe,j),e.append(M,W)};e.if(ze,M=>{e.get(r)==="preview"&&e.get(a)&&M(Ie)})}var De=e.sibling(ze,2);{var Fe=M=>{var W=Ua(),re=e.child(W),ie=e.child(re),we=e.child(ie);et(we,{class:"h-5 w-5"}),e.next(2),e.reset(ie);var Ne=e.sibling(ie,2);{var ce=H=>{var ae=Ba(),pe=e.child(ae),Ce=e.child(pe);e.reset(pe);var Me=e.sibling(pe,2);e.each(Me,21,()=>e.get(R),e.index,(xe,le)=>{var T=Va(),ge=e.child(T,!0);e.reset(T),e.template_effect(()=>e.set_text(ge,e.get(le))),e.append(xe,T)}),e.reset(Me),e.reset(ae),e.template_effect(()=>e.set_text(Ce,`Created (${e.get(R).length??""}):`)),e.append(H,ae)};e.if(Ne,H=>{e.get(R).length>0&&H(ce)})}var me=e.sibling(Ne,2);{var ke=H=>{var ae=Fa(),pe=e.sibling(e.child(ae),2);e.each(pe,21,()=>e.get(I),e.index,(Ce,Me)=>{var xe=Wa(),le=e.child(xe,!0);e.reset(xe),e.template_effect(()=>e.set_text(le,e.get(Me))),e.append(Ce,xe)}),e.reset(pe),e.reset(ae),e.append(H,ae)};e.if(me,H=>{e.get(I).length>0&&H(ke)})}e.reset(re);var fe=e.sibling(re,2),J=e.sibling(e.child(fe),2);e.reset(fe),e.reset(W),e.delegated("click",J,_e),e.append(M,W)};e.if(De,M=>{e.get(r)==="done"&&M(Fe)})}e.reset(ee),e.template_effect(()=>{e.set_class(ye,1,e.clsx(e.get(r)==="input"?"font-semibold text-purple-600":"text-gray-400")),e.set_class(Se,1,e.clsx(e.get(r)==="preview"?"font-semibold text-purple-600":"text-gray-400")),e.set_class(L,1,e.clsx(e.get(r)==="done"?"font-semibold text-green-600":"text-gray-400"))}),e.append(v,ee),e.pop()}e.delegate(["click"]);function st(){const v=window.__zveltio;if(!v){console.warn("[ai extension] window.__zveltio is not present — Studio loader not initialised yet.");return}v.registerRoute({path:"ai",component:$a,label:"AI Hub",icon:"Bot",category:"intelligence",children:[{path:"ai/schema",component:Ka,label:"AI Schema Generation",icon:"Wand2",category:"intelligence"}]})}return st(),st})(window.__SvelteRuntime.__unknown,window.__SvelteRuntime.internal_client,window.__SvelteRuntime.svelte);
