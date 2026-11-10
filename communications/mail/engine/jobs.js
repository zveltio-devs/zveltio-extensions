var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __hasOwnProp = Object.prototype.hasOwnProperty;
function __accessProp(key) {
  return this[key];
}
var __toESMCache_node;
var __toESMCache_esm;
var __toESM = (mod, isNodeMode, target) => {
  var canCache = mod != null && typeof mod === "object";
  if (canCache) {
    var cache = isNodeMode ? __toESMCache_node ??= new WeakMap : __toESMCache_esm ??= new WeakMap;
    var cached = cache.get(mod);
    if (cached)
      return cached;
  }
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule || !__hasOwnProp.call(mod, "default") ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  if (mod && typeof mod === "object" || typeof mod === "function") {
    for (let key of __getOwnPropNames(mod))
      if (!__hasOwnProp.call(to, key))
        __defProp(to, key, {
          get: __accessProp.bind(mod, key),
          enumerable: true
        });
  }
  if (canCache)
    cache.set(mod, to);
  return to;
};
var __toCommonJS = (from) => {
  var entry = (__moduleCache ??= new WeakMap).get(from), desc;
  if (entry)
    return entry;
  entry = __defProp({}, "__esModule", { value: true });
  if (from && typeof from === "object" || typeof from === "function") {
    for (var key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(entry, key))
        __defProp(entry, key, {
          get: __accessProp.bind(from, key),
          enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
        });
  }
  __moduleCache.set(from, entry);
  return entry;
};
var __moduleCache;
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __returnValue = (v) => v;
function __exportSetter(name, newValue) {
  this[name] = __returnValue.bind(null, newValue);
}
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: __exportSetter.bind(all, name)
    });
};
var __esm = (fn, res, err) => () => {
  if (fn)
    try {
      res = fn(fn = 0);
    } catch (e) {
      err = [e];
    }
  if (err)
    throw err[0];
  return res;
};
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined")
    return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});

// /zveltio-extension/node_modules/entities/dist/decode-codepoint.js
function isInvalidCodePoint(codePoint) {
  return codePoint === 0 || codePoint >= 55296 && codePoint <= 57343 || codePoint > 1114111;
}
function replaceCodePoint(codePoint) {
  if (isInvalidCodePoint(codePoint)) {
    return 65533;
  }
  if (codePoint >= 128 && codePoint <= 159) {
    return c1[codePoint - 128] || codePoint;
  }
  return codePoint;
}
function replaceCodePointXML(codePoint) {
  return isInvalidCodePoint(codePoint) ? 65533 : codePoint;
}
var c1;
var init_decode_codepoint = __esm(() => {
  c1 = [
    8364,
    0,
    8218,
    402,
    8222,
    8230,
    8224,
    8225,
    710,
    8240,
    352,
    8249,
    338,
    0,
    381,
    0,
    0,
    8216,
    8217,
    8220,
    8221,
    8226,
    8211,
    8212,
    732,
    8482,
    353,
    8250,
    339,
    0,
    382,
    376
  ];
});

// /zveltio-extension/node_modules/entities/dist/internal/decode-shared.js
function decodeTrieDict(input, resultLength, atomCount, dict1AtomCount, ngramCount, dictSize) {
  const base = 91;
  const inputLength = input.length;
  const twoCharBias = dictSize * (base - 1);
  let pos = 0;
  const readSlotCode = () => {
    const c1 = BASE91_INVERSE[input.charCodeAt(pos++)];
    return c1 < dictSize ? c1 : c1 * base - twoCharBias + BASE91_INVERSE[input.charCodeAt(pos++)];
  };
  const dict2AtomCount = atomCount - dict1AtomCount;
  const slotCount = atomCount + ngramCount;
  const single = new Int32Array(slotCount);
  single.fill(-1, dict1AtomCount, dictSize);
  single.fill(-1, dictSize + dict2AtomCount, slotCount);
  const start = new Int32Array(slotCount);
  const length = new Int32Array(slotCount);
  function decodeDelta(count, off) {
    let previous = 0;
    let slot = off;
    const end = off + count;
    while (slot < end) {
      const code = BASE91_INVERSE[input.charCodeAt(pos++)];
      if (code < 89) {
        previous += code;
        single[slot++] = previous;
      } else if (code === 89) {
        let runLength = BASE91_INVERSE[input.charCodeAt(pos++)] + 2;
        while (runLength--)
          single[slot++] = ++previous;
      } else {
        const next = BASE91_INVERSE[input.charCodeAt(pos++)];
        previous += 89 + (next < 90 ? next * base + BASE91_INVERSE[input.charCodeAt(pos++)] : BASE91_INVERSE[input.charCodeAt(pos++)] * 8281 + BASE91_INVERSE[input.charCodeAt(pos++)] * base + BASE91_INVERSE[input.charCodeAt(pos++)]);
        single[slot++] = previous;
      }
    }
  }
  decodeDelta(dict1AtomCount, 0);
  decodeDelta(dict2AtomCount, dictSize);
  const references = new Int32Array(ngramCount * 2);
  let poolSize = 0;
  let ngramIndex = 0;
  function readNgramReferences(count, startSlot) {
    for (let index = 0;index < count; index++) {
      const slot = startSlot + index;
      const a = readSlotCode();
      const b = readSlotCode();
      references[ngramIndex * 2] = a;
      references[ngramIndex * 2 + 1] = b;
      ngramIndex += 1;
      start[slot] = poolSize;
      const entryLength = (single[a] < 0 ? length[a] : 1) + (single[b] < 0 ? length[b] : 1);
      length[slot] = entryLength;
      poolSize += entryLength;
    }
  }
  readNgramReferences(ngramCount - dictSize + dict1AtomCount, dictSize + dict2AtomCount);
  readNgramReferences(dictSize - dict1AtomCount, dict1AtomCount);
  const pool = new Uint16Array(poolSize);
  let write = 0;
  for (let index = 0;index < ngramIndex; index++) {
    for (let half = 0;half < 2; half++) {
      const source = references[index * 2 + half];
      const value = single[source];
      if (value < 0) {
        let read = start[source];
        const readEnd = read + length[source];
        while (read < readEnd)
          pool[write++] = pool[read++];
      } else {
        pool[write++] = value;
      }
    }
  }
  const out = new Uint16Array(resultLength);
  let outIndex = 0;
  while (pos < inputLength) {
    let slot = BASE91_INVERSE[input.charCodeAt(pos++)];
    if (slot >= dictSize) {
      slot = slot * base - twoCharBias + BASE91_INVERSE[input.charCodeAt(pos++)];
    }
    const value = single[slot];
    if (value < 0) {
      let read = start[slot];
      const readEnd = read + length[slot];
      while (read < readEnd)
        out[outIndex++] = pool[read++];
    } else {
      out[outIndex++] = value;
    }
  }
  return out;
}
var BASE91_INVERSE;
var init_decode_shared = __esm(() => {
  BASE91_INVERSE = /* @__PURE__ */ (() => {
    const table = new Uint8Array(127);
    let code = 0;
    for (let char = 33;char <= 126; char++) {
      if (char !== 34 && char !== 36 && char !== 92) {
        table[char] = code++;
      }
    }
    return table;
  })();
});

// /zveltio-extension/node_modules/entities/dist/generated/decode-data-html.js
var htmlDecodeTree;
var init_decode_data_html = __esm(() => {
  init_decode_shared();
  htmlDecodeTree = /* @__PURE__ */ decodeTrieDict("!}.&u%}'&}*'~!6*)%&,~!J~!J~%L~y<~!R,~~%Lu~~#GD~~#|)1#%}^%}2%+#.##%##%}&%##%'#%##&%#%#'%#&#%#&#'#%%#&#%##%#)%''%&%#%#'%#%%#%%}%%%#%#&(23#%%#&-%0%('1#(##%#'##+%'*.:1}#%#6-+(%'%%#%%%}#L'2351&('%}&/N'(0(/*-%(%%}#'+&T%7.2}#&%&#%#36/5##%&%%#&#%%#))2%%##%&&'0~!#*+&'%1~!%).'3q?&%'1~!.##%6(~!+%%%(Gw'rT~!E#<nA%#jZ~!H%(~!42##~!*31&~!G%U~#)5~#`3~!J~!Z~%]~%Y~%C~!q~!u~#kz~%#~!6'~!D~!U~!?~#T~!c%~!G#'~%7|~!G~!J~!G&~#pb~(Df}#%}*&}#%##%##%##&#-}&'#'&%#.++}%mI,#,@&(}*%}*'%&##&#%##%}&0}#.},U},%}+%}&%}#%##&}B%(}(%}+%)})%##%#&}&%##%&}<%}>%#%&}*%}(%}9%}/%})%}*%}*%}?&}&%}3%}&*#%})%#%#)}#&#-#+*%E%%'%'#%}#*V##&##I}#&&##%&%#&&Qf%%))w/0+&%#(#.%-''''++++7}>%4'',##1,#%#&%##&#'##&#*#9)%&%}#*}%,#+P(%A&%#'&##wSD',9E00#y#@}(+}&%&>~!#~!X}#*}(&&}(&}(,%}%&#+&}#&}I%#%}%)#(},'%#*}4%%#%}(''}#/##(##),%-##%%)#&}(.}&%#&}%%}*&#%},&&}&%}#%*'#%})%}D&}&%}-&}6&#&}-,%}#%})-(~+`~,=?~I9'9%~!,#%})%})%}@%}?%}(~!?~#<~#pP~#BG~#=1#%K+~#?#~%;)~#A~#mF1~#A'~'X%'~#lR~#N~'N~#r~#m#-~#i'?%#'%~#B%##%,%#~#_%#0%~#]732~,w~2+#:&#%&'0%&>%}#>##F+)#%&&#(+_}4&}-%}(&}@&}O7Fdf0@+/v4}&WU##&/0#&'('B#%}.%}'+#%}#%%&#&%#%##+#&#)#6#'#.},%}c%},%#%##%&#&%#&~#>'*-.%##%##%}#%%}%'~#)D1}#%*&~#_%%'(~#S2%'.}#~#=##*'*-%}&'%'##&&~'E%.#&~#M4}%%##&'%#~#O1##%&#'+~#<B%##%%'%+~#;#@%}#&%#&&%#(~#H1}'%'##&&~#?A}&'~#D#%32}'&&&&~#[}'(#%}'~#;C})&}%%#%~#=&%,3}%'(#%%~#^'#&&)#%'~#Y%-~#d-%'~#^%%&#&&&}#~#b~2t*&'~&(~&@~0%~e~3}%*''0})&}+~!9##-}#%-hD*)1fC#%/&/fB#40~!+#)*4~!+~!K'&:~!/*7~!.#~!H~!L':~%x&~!H#~!*~%1~!I#~!+A~#p'~!F~~#-#~,,(~.Z~!V~%;'B'mq-W~!N~%I%#&&#&}#%},%%}'%}+X#%}#&}(%}'%}<%}#%}%%'}'%}:~![)9@~%>~#UA%-%##&~!C%~!-.9:~!1~!-^2/:a~!y,D*J#-5)/4~%23,~#G~!L1~!0X3`~!2+~!!0-~&E~!W~!o,>Y&]~%cZx_&~#O*9#A#'#+I'%#)~!0B*-5A+-((F&*M#)(-7-5+'-3a5Vi~!Y~!?+[)%3),ERHm~!+:D,VG.+)?fB%%*(%)'(#&80%1'8`K8?`+'Z#&O&'H5#*9)A%%5&3))0%39+.*7#()&&*=4@**L)<'_&*+..;(#*+)./&0#3)%')-8(4ixD(&.}%,('aI:,)%,k2231T)I'#/-W7,/'Q#.'Y24+h')37</31&83##&0#),H(?'&?/1##%#&&#%''-%&&&#(&''&#.-'%#%%(,')*'&#&#'##%(%(#%('#&##%%%%('%#%#%%#%#&%##h>w+v<ayvyvcg.uuhKr}g/v|g>u9i[~>g5uI~=RvdwEg;v/g;uk!!TTSx]@RT!U!#!@VBRUU!'UTe-d0c`e&gSdicedFcrdTaqb.kYcAohdYd@a3e+d}dMdtd.aJ#bqcK`dle/e.e'dwdPdodddjbEb}ogd^ofdpduc6j?l%d{drdqc)d7bacOdQ%T#Y)X.sR[yH>6Vyv3[xwLu>vo'!*.[yBacahoj>6Rew3[xqdZa#!a&#^(X-[yG>6Vyu3[xvg3sEr|g.u/Ri9db0T#^(Xa)!-[y;>6Vylg4wKs{JwNZt3@3r=c4Z([xlg;wKt!cpq's@v7A'*a(a+!-a#[y<3Dt?3Dt'>6Vym3[xmg9rxsNJwLZt4~?r?db1T#`-!(Xa,!0[yS>6Vz%NuQs.g4wKtnJwNZtS@3r>c4Z([y%g;wKtrdga8!a(!#&T*Y-Xa#!a0<or[yc3Dtq>6Vz43[y3JwNZtf@3s!Ju}!%Dti:pm3c_%X#tjB5pkd6q!r]u?voC'*-a.a2!0a&a+[yI3DtI3Ds~3DtH>6Vyw3[xx;:s#~<5pKJwNZtE@3r~d`a)!a2T#a.(!+U.X1[yT3Dt`3Dtv>6Vz&3[y&g9rxwzcxstPu.<rAJwLZtT~?r@dZa%!a.&^*Za(/Reu[ya>6Vz23[y1g3sEr}wkg{NuQRg{ci(U#5@b`~,cg#U(2WnH5wugcRh7dX#T(Y,a'Ta!!a,[yZ<]mj>6Vz,3[y+Pv#5ReZKu+=,%!H}7ABwkaS?Rh:BcW(X#<]mrj:ubv/ARekdg%!(!a.*Ta(Y.X1!#sP>Rl*Dt6[y>>6Vyo3Wf*jOvuumvuRgRJuq*!:9<B@bX~3jVv&v@s@5Re[d/rQt{uAvo&a&a*)a2!,0Wf!3Dt0=Bs'>6Re}3[xy~<5s%JwJZt1~Gs)c;&!#2sJkNuXvzq7rxu,Re8dka4!a8(aEZ+a@Y.X1Xa)[yd=Bs(3DtP>6Vz53[y4cX#X&Re:avRe9~<5s&JwJZtQ~Gs*i^rzvdRg+Jv{%!2sbB@bX}kdga,!Za?&^*T1/!a'Dt+[y6>6Vyf3Wf%g/u;s4hGu6?Rh-JvZ,!c%#&RoX54Rivj7uyvf8RgTKvZB%*!2sGh<vu5Rgq<=C::9bb~#dZ#T&Ta6Y.X*Dt>[y93Wf)coZ(T,6VyifluvRgC@95@B@bX~/hFu34cC#T,k/unq8w8Q5RkUklwQuzunq8w8Q5Rk8d/rJu?v8w9)-&!a0a;a&aIWejg3sEr/h1s<DtDJvyZqY5aws3Jvy!&Wei~Hr1:au5@Bag>23E~5c:Z&bX};kKv?w&unuVu5Rjc;>bs)#~@:Rh.=ay<a]C;b`}Vd6s/t{uAvoaxa()!a,a7%-a#a2Dt,[yF2Wo[>6Vyt3[xuNuPRi&NuPwpi#RoWh?vf8Ri%Jv]!%Ri:KvxD!.'2WeAjZu`q9rxu,Re7woeAg-unLq(qA_/*2Wg_g3u5q^9:4E}/jTrxrzv=Wkkd~0UX#^^Xa-a1a5T&a=U1a'*aEa]!a*aPaA-adok[y54Rn>;:p3~Dp5g9rpsFNvZqjg3uJp4~<5p0Pw;5qlJwNZt*@3p1Pw:5p/Ou!5p2JvG'!6Vye=<qnJvh_[xhg3v,Rh3kOwOw-sDuev/Re^dha[a%!%!a+#Ta7)-5TaCaO!aka!a)sf[yb2>Rl!9ARiq5E}Qg=ucRkBE|oJrJ_@Wk~@Wk{JrJ_@Wk|@WkyJrJ_@Wk}@WkzJvO_[y2g-vMRmiKuYC!)&>Ri;>Ri<@3RkNc](X#@9Rk=g5vuRmhKvDB!+'=]meg3u4Rmgd)#Y'Vz3CARmfd`a+!%T'!+#Ta1Ta6TaM-sTDt9[yA9sYd'%Y#s[[xpj:ueunaXRgEjRq,v-vuqdd2'`#6Rev<32@5>:2<E}5xIo9a*X#Y(;5RePJvD_g>vyRgNj8w)v8<wggs:RgXiZt|vjx,hSq3ah!-(~@:Ro/Ou!5RhWj^v(pyw8unRhUdx-UY#^Ua.a3a70!)%UX1TaDa)'omRiRRhE[y:3Dsz=Br,>6Vyj3[xkg6ruwjcqsrPw;5r*Ku]D'Zt-@3r(~?r.i[vwv]dU1a--U#`a4(g/vsRhPOu!5RhLj:rmu9Wo!~@:wdh@g/vsRiTjXuvvNr}:RhBj^v(pyw8unRn]dz1UYa'a+^Y(!aETZalaRY.Ta?a4[yDJw1!#qLsW>6Vyrfzq-pLflpwRe|Js>%!Dt@3Dt&Jvy_[xs~HrnjMuwpsw'RecKu+D#'!t<~Grl~?rjg5u-x,gwp{ah!-(~@:Rg~Ou!5Rh'jXuvvNr}:Rh#cW#X/c;&!#2sLi[v7u7RgpJv)(!iLrxu,Re6j7v@s@5Se[e7d`aW!Za(a`T.a#!a3!&aDa-!9)Dt_=6s+3[x~~DR|h~DS6avhGun5RkZj3w)v-]mkKunB!&*]kb97R|i<ARk<c:Z(6Vy}Juh'!wziMRoS:F|vkLuauJv5vtvQRh1d='T+Y#VyO~DR|jcF#T'7R|g97R|kJv3'!ay<Rj,Jvh&!:ReXcsa6*a+#a#_aIRf9aLRf?c,Z&Rf5Rf7c.Z&Rf;Rf>cQ#%T'p-Rf8Rf=ct#%'(*!,p,Rf4p+Rf6Rf:Rf<d~'Ua%U*^UYa(!a,-!#a4YaTalaEX0a8a<Weo3Dt/3Dsx=Br93Wen~Dr;~<5p<JwNZt2@3p=Pw:5p;Ou!5r3c7&!#:p>3Ds}KvGB)_6Vyk2sM=<r7x'eovA(!hFu1ARf}cV#X&@r5j6rvwQa^Rf3c=Za'wkghJv__g;unRggA53B9=b^}%j6uduo5Jq;!(hIv%2Re`Ou4ARe_e%a#^^^Xa&!a*a2!&a6YaP!*ad!#a:aE/5Rn?[y@>6Vyp;:pE~DrY~<5pBJwNZt8@3pCh=rt3rWPw:5pAJup_[xoNuPpF9c!#'45pD5ARn)d8#X'X*3@rU72s]h>v<<sSjJpqvewOJq/(!hNw'5ReBk0s2u3w/w'5ReE5@Jq.!a+JQ!&WeU23d(#Y&RjG5]jBk!u7w&u0udARjEe#+^^^Ub#!a2/a`Z(agT1!a-a;|@TaG!aS[yV=Re~fow'RguNuPRe?bz#'>RoUWeL>:Cbb|?JwPZtVg6ruRmzJvD'!6Vz(g/vmRh~Jvy_[y(g9voRgyx*cy(#2>Ri2B9b]~9kIw9u7rluJu3Rg]dI#a%UY'@=p%CAx.gQZ&RhwwygtRm{x5g_Z'+ABqR9Woa=Bp&dV#^*Xa'!&@o{g4v]Rk;Jv{!%Rk[wkkiA5RkiwwfUB=x,fUuqC&*!>RfTg8v0RfV~ARfSd;rJsAuAv9wR'ae+/aO!a@aza/a#[yQ@Wg!2Wemg3sEr0JvB_g>uvReWg2v+Re=KupB_+[y!2AbY~-~Hr2AJwD!(h<~El>h<~El?Kun@+_:9b`}Kg-v/Ri3g;vtwyk_9]k_d=&T#*U.6qh@Ab`|K9:H|CJv[!&3Dtex'fDwC%!Rf[9WlMd[(^X,!a%Z06Vz!@WgBg=v~Rgvg,QRe@awd,#Y+jTv|Q~EfWj]uNr|~FRfXdy#Y&^Ua%!aO.!(a)Ua;=!a@aKap!a-,a!Ta]a[rSa]p?[y82sK=Bq~;:p:~<5p8Pw:5p7d'#Y'Wf(;RnRi[u4w&RgJJvG'!6Vyh=<r#ijuuv/sIKuYD'ZtG@3p9~Gr&d2#`(g<vtRgFj`u5w&rqpxRf2CJuY!+:wfnTOu!5Rg}jNs1ucv&RfwJvA!&3@q|BDcC#T,k/unq8w8Q5RkTklwQuzunq8w8Q5Rk9dga#!a'!a=#a0!:+Tb*b@aO.a4!aba8aFJv^}?!VyR~Dr<g;u%Rn.~<5p[x'e`wNZtR@3p]Pw:5pZhNvjBp.woe_g5u-r4JwF!%DtO3:ooc7&!#:p^3DtpLuGw(!+%)Dtk6Vz#2sd=<r8d'#Y([y#<x3gJt`w@!)%}MRiowzikRij=]ilxAf3,U(#B2Rf#g0v-Rm[ck{`U#]giKv3>)!&6Ri154s,KuGB_%@r68r:dJ|t`#X(9<E|u2@H|rx3gJu?w'!+'1Nu7Reg4=H~+9<wxgY95Rm]xLggZ-`(X}U2:Ri4h<uOawRmsJv__5@bb{jbV~3dka#a'a]!,#a+U=a>b6a3b%!/aKa/)!arwve^VyJ;:pR~DpTg3uJpS~<5pOPw;5qmPw:5pNOu!5pQJvG'!6Vyx=<qoJvA!{~Jup!%@qk7Rn/KvyD!}''[xz;>wkh'?Rh,x8gyt`w5D!&),(SgyccRgztJ@3pPB5p#d'(Y#<]mmifubw&RgoJvE&!82s^JvF&!8Rf,ADb]~;x=h'rNu]vK!,%'*0RnORh)4Rh*AqQg-vaRnNg;wHwkh'ba~4cE#Ta*x3gctyw@'!+%RnFRnD<4Rn@hFvK5RnCxWg[#`&a0Ua()`1Rm75Rg[c]%X#qi8Rg^NvdRj>BwzgZauwji7Rm6A4wgg]d1#&(*,.0a#Rm;Rm<Rm=Rm>Rm?Rm@RmARmBe%#^^^Xaea?aC/b+(,!a+a#!a/!>a&Ta<aKbD!2wphBRnk[yPw}hE|.=Br-3Dtm>6Vy~g6urRf.x,hPrNav!%'RnqRo%Ro#Nu;q[Pw;5r+JwNZtM@3r)d'#Y'Weh;xChL#`&RnmRnoKu}>%(!Rne~Bs-;2wjcussJv+'!aYSO}6@B<5?ba~8LrNvj!.%*ROwungw~ng~:9;Ri^>wtnig;wHRnixDh@|(UZ.x1h@|)!#:2<H|*xHn]#-UX'3Ro)z=iT}6ARns=Bwsn_wpnaRncw]aR(#UXa&Ua*a/=]iPd'#Y&Ro'WnXf{QRm2hNvj]nZd`'T~&1`{|`#9b]{}c:'!#Wl{>@=be}]?cl{{U#:5Abb}Jds#^YaF!a*b4a#a3aPa>&Tb!bH!*a_!Eau?/a&RjY<]gj>6Vz*;:pe~DrZg,QRj1JwNZtX@wihspcJvZ&!VyX9WmOJu|!|N2WmHJvh&!]ht~Bpbcn&T(!#RmQ<s7Nu;padH#X'`+WmJ@>RmKCARhnKup=!)&Wf+:RhqNuPpf9c!#'45pd5AwghpARn(Ls@w!%,)!RmP@Wfe<E|IJva!&WmNg8vsRmLd`*.`#Y'Xa!axRn*]hrA8Rhug5s@rXg8u!RmMd8#X'X*3@rV72smdI*#UY&RmICARho~GsgxVgd)Ta'U-Y&Xa!T#RnEWnA@Wffg1uDRi0hFvK5RnBxGnG&#`%owp)@wsf+bX}Ze-*1!a*^^^Ua|!#a.aq&Ya2!a>.a6!a:aO`aJDtL[y`@Wg#>6Vz12@wzoYRoZNuPRi!NuPRhzg=ucRi,@=b`{Yg=ucRi-ACJvB!&Sh[ebSh]ebi`wUuFRm4Jw2_[y0JvB!.<Ju(!&SoG}6Shd}6<Ju(!&SoH}6She}6Kur@._g5vHRieJvx!{L2G{Kx6gd'T#?Rh82Wi5cZ#X(g1w)Rm5dW-Y(Ta#!a)!#aYa=wnfE=su2>>bU{0j9udv:<svj8uQv-7RgHdE%#^'sq9sp=>Bb_{TJv`!&g/r|snj6v(us5d,#Y(56H}[978H}]Jw5!&g1rushJvB!+j;v{u5?zDhd}6}bj;v{u5?zDhe}6}ce*#`(^^^a[aea!=!a6a*aoXb1a.!aAbL!b>,b'aL!aV@Wf|2Wlg3[y/JwNZt^@3piPw:5pgJunZou3@rsJva&!Vy_g<v~Rm#JvG'!6Vz0=<r{Ju{%!:pj@WfsiXuJu3Rm:JvZ&!WfA~Bph@c4Z&Dtwax5rubx(#:awRk1@d,#Y&RfjRfid1#,Y(@Wfp2Wlrg5s@ryKu[@!,'=]ig9wlk?Rk>g5u-rqJvy'!@9RkQcH(T#=>Ri~@<wkj(Wj(KuZB*!&<7rw@9RkRcH(T#=>Ri}@<wkj)Wj)dg(Ta2Xa9X#`-!a*CARhg@@=I}d9x;c~#X%so=<sj>2@@=aybb}XjWv0Q~EfEj3vLv;<d,#Y(56H}`978H}_dgaPaFa'a/!#a3Y0a_a;a|!1(a7-[yE3[xt;:pJNvZrrg3uJrvJwNZt=@3pIh=rt3rxPw:5pGOu!5rpJvG'!6Vys=<rz@c4Z&Dt(ax5rtJvZ!&~BpH@wsfNg-vaRlNci*U#=<wei<F}a5@Jq.!a*JQ!%@qZ23d(#Y&RjH5]jCk!u7w&u0udARjFd/prq=tyvpaEa(a:.!a1aZ(@@=I}:9wpd%=<sX55w_h}@@=I{t=ay<aU@@=I}T=ay<2@@=I})?C9:9au@9Cb]}DP~=x-fAZ(2Wl1=ay<aU@@=I}>5@d##Y+jTv|vV~EfFj]uNpn~FRfGdgaK!Z2&!a8a-Tb({E!acTbM*!a(DtY[yYd'%Y#sl[y*hHvh>Re5x2c{Z}.j4uCvcawRiMd+#X+_x&d!},<5RkX;2Hzw@x,gavfB-!{CcF&T#Roe;RodwWbBg5urRgaKvHC*_6Vz+<4opieuew&Rmq@d]&Y)X,T#X0Rh}<BqP=4qS9:ReMg/ujReNJw0!/<Jui%!bd{kawwnemRelAxUa?a3#*.&UX(Ya+a/RhvRnQ<o}9Wmtd-#Y&RgSRmw9;Rmxay=Rmyg-vaRmuxEhSrNu,v-voC!%(aR.a(a7+1Ro1>Ro5CE{A9b]{@;5x#eO{:g;urRi+KrNA!%(Ro3>Ro79;Ri_Ku@>{;&!x%gX|{KunA_+g5QRj/g3u5Rj#g>uERj%wio/xRhS&!,!#^1U}wba{8>>@=be}qC@:D5ba{7Ku+A&!}x?ba}t>>@=be}se(aA^^^Uat!b0#{pa+awUazbGa#aLb9bgaWac'a5TbS=Br!d1#`%scp_Jvl!#rT>Re0JvX&!VyN=H{Fcm#U&:pY=ReaJv2&!]h0=]nUJvG'!6Vy|=<r%JrM_=]h2@Wlud'#)U'Wf'b]{i=]h/Jvh!&~BpWg=v]RnMx+ny#'Nu;pVwjnu=]nwxJnx,T#`&Reqwjnt=]nvieu9vrRjLLuYwP(#+!th@wih5pX~Gr'g5v/Rh4KunA'!-CARnP@wwiN:Rm_9x'cvw>!|l=<saKvAA!0&3@q}>w^e1bp#&Re2Re3BDx7gH#T|f5H|eKuZ>!%(:qNAH{]Jv6!+3B2B9=b^{X<5<B92:E{ZLvhwA(a;a%!igQuyRmad+#Y}m@3Rh5d8#X'X*:AqUAHzmaxwbh<aXRnVcF}RT#Nw&cj#U(BWnug/vsRntdka)(a3+.Zb7aYYan1!bVa@Xa}[y^@b[{G=H{+hFu73Rj&Pv#5ReQcK%T#sig1v{Rj'Ku+D#'!t]~Grm~?rkKuMB!01d5#`'Vy.ta3Dtu~Hroc8#'{^45s85AwZbP&!#Rn!wghxWn#KvEA!)&2RlA2RlBx:h|#(T,=]j09Wobz>x]z/@awRoTd+#Y(az]hFhCrm4d,#Y+jTv|Q~EfMj]uNr|~FRfOdCa!Xa9_X#@<plJvf!%b`{(9;Rgwc;.!#2x7cw#T|UDb]|T5Ju={(!=@E{&Jv)&!Ab`{'awJvf!~*>>@=be{#KuY>!+&4Ezyi[ugv&RjIdea+T)#UXa&T-T&a!Rh9auRmW=]kLg5vuRn+g3u4Rn-Ow6ARn,hHus5xNk?#UX(U~)/g8v0RkD~AwkkF?Ri.OuNBwkkA?Ri/d|a2`a*^UYa.!aBTZaTa'Xa;!(!2!-a#b2[yC>6Vyq3[xr2Wi?g1rusVh%s?DtF~<5rbJs;%!DtBfswKtCj[uvuSsEu3RgVx3o:u+wN'*Zt;@3rd~Grh~?rfg8w)Lq)qE&-a%!>bI|`jWv0vV~EfCjTv|vV~Ef@j]uNpn~FRfBcK#T']gWNu7x,k7q4ai(0!hHv8<RhmkMu9vrsBuev/RhlCJvB!,g<v{wchh~@:Rhji[vrv{wchi~@:RhkdS&a5UY#Ta!RgPwwiI5BwciI~@:Rh`x'iJvj'!5]iJPu8Bwch]~@:Rhach)U#h3rp]gLh@t|Ax,hTq3ah!-(~@:Ro0Ou!5RhXj^v(pyw8unRhVd|)`,^UYas!a?/a2Z'a^Ta{Tb7Ta(a#!a,Wf&9sZ3DtAadamov=Bqt3[xig8vsRm~>waiL2b`{QJv*_Ouv2qgj<v]v2BqfdR'X*X#Y-@3qr~Gqv~?p6hHv-]glPup5Lq+q?_%*b_{qF{n9b^{rOu4ARhpKvCD!+&~Bqp:5Dbb}nwoiKl&unuTuBv]v+ueunaXRf0=Jvh!0nKufu8v1w&w7q%w&uHrz:Rgnj5w,uxDJq/(!hNw'5ReCk0s2u3w/w'5ReFd>Za&!*UaA=<wkgsRnSJv^!%Refifw3vyRgOKu_B'!,<]gkiiu:w&Rh<=C@a^<B57@2F{[<B5@aW:=3away9A5aW=<B=C@a^<B57@2F{Ie-#`(^^^bCara.b8aza6!/bZ,!adTbnTbOb+aFaS!aAT9@Wf~2Wli3Dtl2@d,#Y&RfnRfmJwJZtN~GqyJva&!VyMg<v~Rm%iXuJu3Rm9Jv[_=]ih9wlkDRkCd1#`(@Wg>2Wls3cH#T(@<Rj*=>Ri|b~'#23s9h<~El.d'#Y&Dtxi^rzvdRl#d*#U%(o|B2s`hJwSaxRmDKv4B&!1:Rmdd5#`'Vx}to~Hq{x'f1v3(!BA5ba|bJv_&!Wfug1v]ReIdO+U/Y#&G}-8wze=Rh{g1v]ReHg/uQRf/by#)ibQwERl/cH#T(@<Rj+=>Ri{cNu+vlax-!(#a0qa9<Rii2;;bU{H;x<i=&X#Rk`<4wwi=C9H~8xAI(Y#<azRi@45wXI<B9;5bb~7dL(X#Xa(+!aL6Vy{g5QqOau:5au2@ay547EzbxOcU(UX-T#Ta#:Cbb|A?wjh/b_|SOw6ARgtihr}u7Rhy<d1#T)X1@@=I|~=ay<2@@=aybb}Sj3vLv;<d,#Y(56H}A978H}@dGpvs@uAu`vcw9*!aFa+ai%(b!aXa8.a?a[ozWey=sU2@G}Nch&U#Rf_WexKu+D#'!t:~Gr`~?r^j]uNr|~FRg*j^psurwJt|RmcKv)@&!)7Rkv~Br[@wxfO:Rl3co#U'6Rezj_q#vIuavjRltwzeyh@vr5JqD0!>aY?C9:9au@9Cb]}9cl#U*5;5<H||jbuus1ucv&Rfvg1v~d/pppzqFr^a--a~!aMat1(hFv;Wiz@@=Izoj5uuv-7Rix~Cw`fk2WlVcZ#X,k)u3vWs@u2]ktg;wEx'fBq(_2Wg/jTv|vV~EfoJv]!15x'hzqG!(P~EfU~CRl_j6v(us5x4i-#T(2WmZ?C2F|d>Kq<aj1!*jTqIsBv=Wl`~Cw`fi2WlWj`v0u*~>RlR=c>Z,k#u3vWs@u2]kr<c1Z+jTqIsBv=Wla~Cw`fm2WlXdmb3!a{(arZa`bkTa%TbQTa-a9+c'!aM!/[yL=Bqug.w'RifhFvyDRj.g>vgwyk^9]k^Jv3_@WfbAARkhJw2_[x|JvB_wkoIRoKwkoJRoLd'(Y#<]gm=<9<H|yd'%_X#skDtb3awwqkgNulRkgdB#^',9:p'hJwSaxRmEBwVb8@4=H|qLu+w50&!)@3qs~?pU>Awwn;;Rn=c:Z'ARn<=<qwKvC@!/&~BqqJv6!&]eVb^z^xRge'/a%+^`#Sge}6<4Rn3=]n0Pw2>Rn8Jw0!&>Rn:>Rn6cY#a7+!a&=<wkaNw~h3z_c5Z{=wjh#=]nLKv^D!&)Vyz=bW|swYb<WetcG#T(2wxa@qVx@gD#Y&b^|V5JwG&!5bb|pg/w&RgD@x=kHs=uAvn!a%%/'+RmSRh694Ro`g-vaRmRhHv-]mlxCcS#`&ba~.5cD#Ta)P~=d,#Y(56H{>978H{Dd_#{2^Y%_+qbbb{6g3sERhsbU{?dfa.,`a(Xa<!aiX#(55RiG54RiHcI#T'WiU3RiVNvdwtfcRlKNvdd,#Y&RlHRlExQgf.1*^T'X#Sgf}6Wn4=]hfPrk>Rn7Jw0!&>Rn5>Rn9Lunw?&a2!,5<oq@@wqfdRlJj5Q~=d,#Y(~ARfcOuN]fdDKw;ay(}i!547E}j?cI#T(@5bV}iCbV}hdv(^^Tb?a40,b##Tbo!a*bR!a<b|a/!aKai!aU[yK=]o^g:v>ReGJwPZtK<7Rh+h<~El,Pv#5ReR@awwxjCg,ulRjDJv6&!]j!z?aQeeg>w=Sh<eeJw;!&axEzOg,Qosc!#*:wkeJ]eJ>x'h-u(!%Ro.w~h.zPdNZ(X,Ya![x{;9ReY;wkgxRiF:x?ap#Y&RmUg<s2Rkod]+UY0TZ'!a&A9sw<=bczLNvuw{gqzNhJwSaxRmCKuLay!#&s_Rf-55b^{uJvZa!!c%#(55Ri654wmiu5RiuawLu,vp!+}^%b_}Y9;wkgxba}o>A9:=b^}zKuh=a''!3awRk3c*'!#aHRk6c+Z&Rk5Rk4Jv)&!awRjSawd9*`#0?C2@EzMj8u<uJ5RmbjQrquJu3x,k>uq@_+=ayb^|W~ARkEOuN]k@7dhzV^X/X&a-#zRzSb`zXcJzTT#2WkVKvDBzW!%FzY9;5bbzWjQrquJu3Jw3%!b`zU=ayb^zQd:#X(T-a!6Vyywxh}=b]{Jg=u1RiAdGp~qHtzv!w(wA+a+a;<!aJaYai'anasb(=azRmV:Cbb{MLq2vb!%')RjuRjrRjtRjqx3jnqCw3!%')Rk(Rk+Rk&Rk)Lq2vb!%')Rj{RjxRjzRjwLq2vb!%')RjsRjpRjfRjex3jcqCw3!%')Rk'Rk*RjkRjl9<CbbzfOu4ARhxLq2vb!%')RjyRjvRjhRjgx=joq*uKvb!%')+-Rk.Rk%Rj~Rk-Rk#Rj}x=jdq*uKvb!%')+-Rk,Rk!Rj|RjmRjjRjidAq&qKs@uAv8Aa.'*-a@a&0!aM@a5[y73Dsy3Ds|3Dt):wxgI2sHJwJZt.~Gqxwsf0ikrzt}Rl0Jvy_[xj~HqzKv_A|D!&WfP8axRoVcf,U#k(v]v+ueunaXRf1Ju}'!g8u#Ri=jQw!sCunLprq>!,')~<5qeGzq9F{W=c##%s5au:5aU3CBE|;d4#X(D!a&6Vygx(b;#(=]ed?C2F{N<capoq2r[a&!aPa9,'Pw;5s:@@=I|,55w_h|@@=IzcP~=x'fCqB_2Wl2>aU@@=I|1OuNBc1Z+jTqIsBv=Wlc~Cw`fl2WlZ~AcTa%!Z+jTqIsBv=Wlb~Cw`fh2WlYk+uNqJsBv=WlSg,u3dca3#UXaMYa)TaB-=cM|7T#<bI}l5@B932:aV2G{BOuNBJq:|M!5Ezt=<B=C@a^<B57@2F{v>cB{/T#=ay<bI{3Jv6!a.6BKq0ah&+!5E}HP~Ef{978BaU@@=Iza<7d#.Y#978BaU@@=IzH~AJq0!(@@=IzG978BaU@@=IzFe,aU*Y&^^^bvJb,b:bFad!a,c2Ta>aL.bo6!a#CbTa'T#Re{2Wlh2@G{yg6t~Ro_NvdRfticuRQRllJv3&!x&c|zs@Jw3!%RflwpfkRlpKuL;%(!Re<@G|C2GzdhIvuBwgjAg-u0RjAKQB%!(GzZ@G|5NuuRl7d='T+Y#Vy[g<v~Rm!==G|>JvA!)@wma=]m1ifuaw&RmnLs@vT'!|/+[y,g:v>ReTJw1!#qX=x!eC{bLu+wT&)ZtZauq_~Graci&U#F|89:r_Lupvq!.)&2RlG8RfaC=x!eF{_h?rpWlmd&'!#X|&]k::xJey#`'T|+<E|&2@H|%dE#(^,g;u.RiEg6vjRiC9xCkA{O|zY#g=ucRmXKs0@!&*@G|m@awRknJuh!,3d(}gY}eJvj!%Rm):Jw3!%Rm+Rm-Ls0w(&!a(a#@b[|6cZ#X'7RkxWgAOu4ARn'dH'U#Y*Vz-Wm'CARm}d]*#a%^a*T'aK!a<9bV{PC=p*Jw4!&SgxcbB5r]idw(wBRmF7xFkt#&`(Rm/Rm8E|!JuY_9:Rl5=wrgr2:bbxd@xXfB(a*#T+!.X0X1Ta/a'T&RlDRfL>RlyARl9b[z[>RfZ:RlL:RfRwlg/ARl;9;RlxKv,A/!%7s69<74=BA5ba{-8Bde#`a<XaKYa1,a'P~=wxfB2bZ}}?C972@@=I}r8@55B9;5bb}G978B2@@=aybb}3j3vLv;<Jw3&!>Rfk=ayb^}4~Ad1#`*@@=aybb{w2@>==<bbz]dx+UY#^UaF!a9!bB'Ya1.!ajXa#%olRhD[y=3Dt#Ov5BrHKuMB%!(Rf^Wep~HrJwkiQjKr|~FRg)Ku+D#'!t5~GrF~?rDdV)UY,Z/_7RkuG{<~BrBg,rlsO:235B@bX}|d?a1!#`(6Vyn5@d##Y+jTv|vV~EfIj]uNpn~FRfH7Lq2vb1!a9-978BaU@@=Iz9978BbU}#~AJq0!(@@=Iz8978BaU@@=Iz7~AJQ|}!978BbU}!JvkaK!AdUa21-U#`a+(g/vsRn~Ou!5RPj:rmu9WhOjXuvvNr}:RhAj^v(pyw8unRn[kPr}p|u7vwv]RiSBd;pppzq@qHQa?(b.!a.a`@.|xa(hFv;Wiyj5uuv-7Riw~Cw`fg2WlU978BbU|wOuNBJqG!(P~EfD~CRlQcZ#X,k)u3vWs@u2]ksg;wEx'f@q1_2Wg.j]uNpn~FRfqJv]!15x'h{qG!(@@=IzK~CRl^j6v(us5x4i,#T(2WmY?C2F{1>Kq<aj1!*jTqIsBv=Wld~Cw`fj2Wl[j`v0u*~>RlT=c>Z,k#u3vWs@u2]kq<c1Z+jTqIsBv=Wle~Cw`fn2Wl]dn1#c(a(b^a2!b/bAT(bj!aDa7bu,a_a{c0!2T0g:v>ReD2@G{42@G{5~DpM~<5rc=Bx6i>{RT#RnI@zCx]y]z:2Jv[!zr5Awyk]9]k]dD(Y+X#6Vz.g=wKtgwhaCwgmTWj2Lu,w%_+/[y-B;b^xeg3u3Rj-2@bX{*KrJ<!+'@Wg(g?QRlC@Jv`!%b[zIwsfII}8JQ_@w|kW|=Jv(%!AqcOuNBJvEzh!bYzjLs@wP#(0!oy@>RkdJwMZtc3Dtd@BcG#T'9bWxg2@2Fznd*#Y+;2x'c}w<zizixNgwa#Z'U+!/!a'!a+w~g~z6wcn{Rn}wcnzRn|5Rh%=]nJg5vuRmvNvdRlvcprJu}w*az*a#!%.a.'Bot9qT]kj@Wg'ay2Gzv@Jv`!%b[zEwsfHI}1;ck#Ux`<Cbbx_Lu+w!a&0*!wko*wwo,So,}6Juqxf!E}PigQuyRm`d3(`#8>Rn%:A5B;bZ~%KvhCa!a2!x>k7#Uxb@b{#xaRk7Jw0!)>wwhlShl}6>wwhmShm}6CJvB!.x'hhvj{!!5Bwkhhbaz}x'hivjz~!5Bwkhibaz|xEhTrNu,v-vpD!a%&/)a3a.,%Ro2t[CE{)@3re9b]{%wjo09:rgc:Z&Ro6=<riifuaw&RmoKrNA!%(Ro4>Ro89;Ri`dSaL'UYzxZb)7Rka3xRhT&!,!#^1U}vbaz{>>@=be}yC@:D5bazzKu+A&!}{?ba}y>>@=be}wxBh[t`u~vJvr!%a!a()a,a0a4RoC=]o;Ju(!%RoGRhdwjh`=]oAg>w#Ro?g5vuRo=NvdRl|Ku]C.!&;RoEJvB!%RoORoMBx'h[v+_?w~h`}~5?w~hd~!xKh]oiptu-utv.vp!#%&a30a@a'a+(a/aOp(o~p!RoDJu(!%RoHRhewjha=]oBNvdRl}g>w#Ro@g5vuRo>c[#X']o<CauRoRAd-#Y':RkpauRoQKu]C.!&;RoFJvB!%RoNRoPBx'h]v+_?w~ha}t5?w~he}ue!/UbhYacXaW^Tc&a;b:a-c/#b&aja1(!cL+!bKbt!bmcRc9aIc?8[yW3Dtt94Rg`Jv}!&SiRMzBhEebShEMNuPRe>x7gL#TzuwjirRipc<Z&>on;>z=h-MSh.Mwqczx'a7vj&!>Re4@=ResJt__NuPRi*NuPRi)j]uNr|~FRfzKrJ>_+@Wfy@Wf]2WocKrJ<!+'@Wg%g/QRl@@Jv`!&awRl<wsfFIzgLu(w*!.*&ShBMwvhIRhI9;RhNx1hK'!#Sn]Mx1hK~0!#:2<H~7cNu+w7D*'1ZtW>Rn1~?rOc:Z&Rn2=<rQ<7wjh&=BSnLMc]#X(6Vz)w[b=a!U#9wzgMc3#&(RgMRitRis<x,gKt`ax!&+SioM=BSilMc3#&(RgKRinRimKurB,!&SiQMzBhDebShDM6BJQ!(P~Efx978B2@@=I}WLrJw!!,a*&@G}O@9wkibRid@@x'fKwC!&SlDMSfLMjUv~Q~EfKKv3@a+!(hFv-]mpx/hYZ(C5RiWz<o/MwkhY?So/M@x,gbvfB*&!SgEM:SoeeehFu3:Rgbda(,^TZa)X/7Sg[eb:2RgI~BrMC@wgkc:wwkcRerx3h(uUvK!&*,SnOM4Sh*MArRg;wHRh(x=h;rJvPwI!a4',a'0@Wg&=BSh/Mg>w=Rh=g3w*wwgGRgGcW(X#;Sg}M2Gzk@Jv`!&awRl=wsfGIz`dKZ*T'Y-:RhR7RhQg5u-p`j6v(us5d,#Y+~Awkia?RicOuNBwkibba}Ld6p~tyu_vbAa'a+!a/'a3aEa8a!>Sh,ebJv{!&Sh@ebSaReb9;SgwebNuPRi(NvdRl)NuPRi'hHu^<Rm^Jvv_@Wl(g;u1Si/ebKu'B&!*Sh?eb@Wl'z@aPeb95Si.ebcpputyvjB)!,&a+0a%ShAMWeK@G}C@WfJ9;RhMwvhH9w{ia}ix,hJvRA1(!zAn[MRhHx1hJ~*!#hFv(BSn[MBJQ!(@@=I~'978B2@@=I}2db.Ua<'X}+T#a0XaG2G}E;wkg|wuh!Rh!x,hZu,@)!&So0MVy)C5RiXACJvB!&5RiY5RiZg8w)cG}*T#2@bU}=KsA>(!a.3wkhZba~(x,h^u(A!&(SoCMRhb5Bz=h[eb?w~hb~6x,h_u(A!&(SoDMRhc5Bz=h]eb?w~hc~6e)aA1T#T,^^^c-bMb&blcPaP(a/!0!bA=b5c@a(!bfbrc#2afwmhARnjwchORnp2Wlf3DtsNvdRl-2@wpa<]m0bx(#:awRk2@Jw3!%RfhwpfgRlnKQB%!(G{V@G|'NuuRl6d='T+Y#VyUg<v~Rl~==G|<Jv+'!aYShC}6@B<5?ba~8@Jw3'!g2QRljhLrpWlOd+#Y'g.w'rIg>w*wgj@g-u0Rj@Lu+wT&)ZtUauq]~GrGci&U#F|39:rELrNvj!.%*RhCwunfw~nf~:9;Ri]>wtnhg;wHRnhx3hDs@v~!/+'@Wfr@9RkSNu&Rlo=@<5GzoKs0@_+@Wl+@awRkmJuh!-3d(}pY#qWJvj!%Rm(:Jw3!%Rm,Rm*de&!1U-U#`)Re;@G|.@9Ri82@wjfvRlq=@<5GzpLvOvr!).&2RlF8Rf`C=x!eE{.Jw3_g2QRlkhLrpWlPde(!#U{s,UXa*Ta'[y'g:v>ReS;x0PZ&RnlRnn~HrKJw1}f!=x!eB|2w]aP(#Xa&a*Ta.Ua2a7=]iOd'#Y&Ro&WnWg;u.RiDg6vjRiBNvdRlzhNvj]nYJuW_2Wm3x)kFze{9d])!a.!,Y01!#&aC!a3RndC=ox~BrC@2b^{pg,rlse7x'ksuq!%Rm.E{xidw(wBRmGx9o+)X#wwo-So-}69:Rl4@xSf@a#XZ'X)X,Ta(/ARl8b[xc>RfY:RlI:RfQwlg.ARl:9;Rlwdn'#^XafaQa1X1TaHTa)@b[{zcZ#X'7RkwWg@Ou4ARn&x)kG#{,g7u/RkGdH'U#Y*Vz'Wm&CARm|bx#(A]gUbUzJj9Q~=d,#Y(56H}l978H{U7d,0#U*2>ABb_xZ978BbU{e~AJQ{g!978BbU{hxMh?ad{oUYZ.x1h?{l!#:2<H{mx3n[t{vl!,&a%3Ro(z=iS}6ARnr=Bwsn^wvn`Rnbd`*T}B0!#^X'BG{c9b]{a>>@=be}F?JvS!&BG{d7BG}(Bde#`a1X,Ya@!a'P~=wxf@2bZ}I56B2@@=aybb}08@55B9;5bb}<j3vLv;<Jw3&!>Rfg=ayb^}&OuNBKuLA!)a!P~=x#fD{f2@>==<bbzl?C972@@=Ix^d6rSu,v7w*C(0a)a6#B+a%!sQ[y?3Dt%3[xn~<5rLOu!5p@Ku+D#'!t7~GrP~?rNKvlaya7'!h+v-5qMg=t|cd,U#5AAaa5Abb{S@52B5@a[@52B5Gx[iXueu;d<#`a(!/549C;ag>23ExY5@Dah89b^~689Jv)!~2b[~1Lv'w(%*!a#bX|aPrmawRe]keu7uhv-q6rxu,q`xTo]/a5aU!bNaDXbi!b-!ao!b<bwA!#5@B932:aV2G|:d-)Y#hJrL>RhG<7@C5<H|_=Cau:5aj5@B932:bJ|ng>vIbs)#?C2F|9jPv0w.vISh-MKvUaz(.!9ABbb|[5;5<H|Eg>unwfh;9:4E|YjQsBt|vjx'hYq3!(?C2F|J:2<BaY?C2F|GOu!5x,g|p{ah!-(?C2F|c9:4E|OjXuvvNr}:Rh&i[w*t|cd+U#jJvsu)vsSn~Mkfrmu9p}u7vwv]So!McW#Xa!ax5@A5aY:5;5<H|>kJv~vYrquJu3x4ib#T)2@SmZM?C2F|Bj:rmu9@xPhI(a*a#U#`a3-5Abb|L~@:RhK9:4E|0@52B5G|#C::aY?C2F|-:2<BaY?C2F|.5Jvk!a)javYrquJu3x4ia#T)2@SmYM?C2F|HAxPhH(!a#U#`a*-5Abb|4~@:RhJ9:4E|R@52B5G|F:2<BaY?C2F|Sc^#Xa2j=Qq5CJvB!-g<v{z;hhM?C2F|Zi[vrv{z;hiM?C2F|XKsA>!a)-g<v{z;h[eb?C2F|]i[vrv{z;h]eb?C2F|^iZu.vix,hZq3ah!.(?C2F|QOu!5ShXM:2<BaY?C2F|P", 13494, 2713, 49, 25, 61);
});

// /zveltio-extension/node_modules/entities/dist/generated/decode-data-xml.js
var xmlDecodeTree;
var init_decode_data_xml = __esm(() => {
  xmlDecodeTree = /* @__PURE__ */ new Uint16Array([
    512,
    26465,
    29036,
    7,
    0,
    2,
    4,
    116,
    24638,
    116,
    24636,
    8693,
    29807,
    24610,
    621,
    1,
    0,
    0,
    3,
    112,
    24614,
    111,
    115,
    24615
  ]);
});

// /zveltio-extension/node_modules/entities/dist/internal/bin-trie-flags.js
var BinTrieFlags;
var init_bin_trie_flags = __esm(() => {
  (function(BinTrieFlags) {
    BinTrieFlags[BinTrieFlags["VALUE_LENGTH"] = 49152] = "VALUE_LENGTH";
    BinTrieFlags[BinTrieFlags["FLAG13"] = 8192] = "FLAG13";
    BinTrieFlags[BinTrieFlags["BRANCH_LENGTH"] = 8064] = "BRANCH_LENGTH";
    BinTrieFlags[BinTrieFlags["JUMP_TABLE"] = 127] = "JUMP_TABLE";
    BinTrieFlags[BinTrieFlags["VALUE_MASK"] = 8191] = "VALUE_MASK";
  })(BinTrieFlags || (BinTrieFlags = {}));
});

// /zveltio-extension/node_modules/entities/dist/decode.js
function isNumber(code) {
  return code - CharCodes.ZERO >>> 0 <= 9;
}
function isHexadecimalCharacter(code) {
  return (code | TO_LOWER_BIT) - CharCodes.LOWER_A >>> 0 <= 5;
}
function isAlpha(code) {
  return (code | TO_LOWER_BIT) - CharCodes.LOWER_A >>> 0 <= 25;
}
function isEntityInAttributeInvalidEnd(code) {
  return code === CharCodes.EQUALS || isAlpha(code) || isNumber(code);
}

class EntityDecoder {
  decodeTree;
  emitCodePoint;
  errors;
  state = EntityDecoderState.EntityStart;
  consumed = 1;
  result = 0;
  treeIndex = 0;
  excess = 1;
  decodeMode = DecodingMode.Strict;
  runConsumed = 0;
  constructor(decodeTree, emitCodePoint, errors) {
    this.decodeTree = decodeTree;
    this.emitCodePoint = emitCodePoint;
    this.errors = errors;
  }
  startEntity(decodeMode) {
    this.decodeMode = decodeMode;
    this.state = EntityDecoderState.EntityStart;
    this.result = 0;
    this.treeIndex = 0;
    this.excess = 1;
    this.consumed = 1;
    this.runConsumed = 0;
  }
  write(input, offset) {
    switch (this.state) {
      case EntityDecoderState.EntityStart: {
        if (input.charCodeAt(offset) === CharCodes.NUM) {
          this.state = EntityDecoderState.NumericStart;
          this.consumed += 1;
          return this.stateNumericStart(input, offset + 1);
        }
        this.state = EntityDecoderState.NamedEntity;
        return this.stateNamedEntity(input, offset);
      }
      case EntityDecoderState.NumericStart: {
        return this.stateNumericStart(input, offset);
      }
      case EntityDecoderState.NumericDecimal: {
        return this.stateNumericDecimal(input, offset);
      }
      case EntityDecoderState.NumericHex: {
        return this.stateNumericHex(input, offset);
      }
      default: {
        return this.stateNamedEntity(input, offset);
      }
    }
  }
  stateNumericStart(input, offset) {
    if (offset >= input.length) {
      return -1;
    }
    if ((input.charCodeAt(offset) | TO_LOWER_BIT) === CharCodes.LOWER_X) {
      this.state = EntityDecoderState.NumericHex;
      this.consumed += 1;
      return this.stateNumericHex(input, offset + 1);
    }
    this.state = EntityDecoderState.NumericDecimal;
    return this.stateNumericDecimal(input, offset);
  }
  stateNumericHex(input, offset) {
    const inputLength = input.length;
    let { result } = this;
    let { consumed } = this;
    while (offset < inputLength) {
      const char = input.charCodeAt(offset);
      if (isNumber(char) || isHexadecimalCharacter(char)) {
        const digit = char <= CharCodes.NINE ? char - CharCodes.ZERO : (char | TO_LOWER_BIT) - CharCodes.LOWER_A + 10;
        result = result * 16 + digit;
        consumed += 1;
        offset += 1;
      } else {
        this.result = result;
        this.consumed = consumed;
        return this.emitNumericEntity(char, 3);
      }
    }
    this.result = result;
    this.consumed = consumed;
    return -1;
  }
  stateNumericDecimal(input, offset) {
    const inputLength = input.length;
    let { result } = this;
    let { consumed } = this;
    while (offset < inputLength) {
      const digit = input.charCodeAt(offset) - CharCodes.ZERO;
      if (digit >>> 0 > 9) {
        this.result = result;
        this.consumed = consumed;
        return this.emitNumericEntity(digit + CharCodes.ZERO, 2);
      }
      result = result * 10 + digit;
      consumed += 1;
      offset += 1;
    }
    this.result = result;
    this.consumed = consumed;
    return -1;
  }
  emitNumericEntity(lastCp, expectedLength) {
    if (this.consumed <= expectedLength) {
      this.errors?.absenceOfDigitsInNumericCharacterReference(this.consumed);
      return 0;
    }
    if (lastCp === CharCodes.SEMI) {
      this.consumed += 1;
    } else if (this.decodeMode === DecodingMode.Strict) {
      return 0;
    }
    this.emitCodePoint((this.decodeTree === xmlDecodeTree ? replaceCodePointXML : replaceCodePoint)(this.result), this.consumed);
    if (this.errors) {
      if (lastCp !== CharCodes.SEMI) {
        this.errors.missingSemicolonAfterCharacterReference();
      }
      this.errors.validateNumericCharacterReference(this.result);
    }
    return this.consumed;
  }
  flushAndEmitLegacyOrReject(consumed, excess, char, valueLength) {
    this.consumed = consumed;
    this.excess = excess;
    return this.result === 0 || this.decodeMode === DecodingMode.Attribute && (valueLength === 0 || excess > 1 || isEntityInAttributeInvalidEnd(char)) ? 0 : this.emitNotTerminatedNamedEntity();
  }
  stateNamedEntity(input, offset) {
    const { decodeTree } = this;
    const inputLength = input.length;
    const isStrict = this.decodeMode === DecodingMode.Strict;
    let { treeIndex } = this;
    let { excess } = this;
    let { consumed } = this;
    let current = decodeTree[treeIndex];
    while (offset < inputLength) {
      while ((current & (BinTrieFlags.VALUE_LENGTH | BinTrieFlags.FLAG13)) === 0 && (current & BinTrieFlags.JUMP_TABLE) !== 0) {
        const char = input.charCodeAt(offset);
        const jumpOffset = current & BinTrieFlags.JUMP_TABLE;
        const branchCount = (current & BinTrieFlags.BRANCH_LENGTH) >> 7;
        if (branchCount === 0) {
          if (char !== jumpOffset) {
            return this.flushAndEmitLegacyOrReject(consumed, excess, char, 0);
          }
          treeIndex += 1;
        } else {
          const slot = char - jumpOffset;
          if (slot >>> 0 >= branchCount) {
            return this.flushAndEmitLegacyOrReject(consumed, excess, char, 0);
          }
          const stored = decodeTree[treeIndex + 1 + slot];
          if (stored === 0) {
            return this.flushAndEmitLegacyOrReject(consumed, excess, char, 0);
          }
          treeIndex = treeIndex + branchCount + stored & 65535;
        }
        current = decodeTree[treeIndex];
        offset += 1;
        excess += 1;
        if (offset >= inputLength)
          break;
      }
      if (offset >= inputLength)
        break;
      if ((current & (BinTrieFlags.VALUE_LENGTH | BinTrieFlags.FLAG13)) === BinTrieFlags.FLAG13) {
        const runLength = (current & BinTrieFlags.BRANCH_LENGTH) >> 7;
        let { runConsumed } = this;
        if (runConsumed === 0) {
          const char = input.charCodeAt(offset);
          if (char !== (current & BinTrieFlags.JUMP_TABLE)) {
            return this.flushAndEmitLegacyOrReject(consumed, excess, char, 0);
          }
          offset += 1;
          excess += 1;
          runConsumed = 1;
        }
        while (runConsumed < runLength) {
          if (offset >= inputLength) {
            this.treeIndex = treeIndex;
            this.excess = excess;
            this.consumed = consumed;
            this.runConsumed = runConsumed;
            return -1;
          }
          const charIndexInPacked = runConsumed - 1;
          const packedWord = decodeTree[treeIndex + 1 + (charIndexInPacked >> 1)];
          const expectedChar = packedWord >> ((charIndexInPacked & 1) << 3) & 255;
          const char = input.charCodeAt(offset);
          if (char !== expectedChar) {
            this.runConsumed = 0;
            return this.flushAndEmitLegacyOrReject(consumed, excess, char, 0);
          }
          offset += 1;
          excess += 1;
          runConsumed += 1;
        }
        this.runConsumed = 0;
        treeIndex += 1 + (runLength >> 1);
        current = decodeTree[treeIndex];
        continue;
      }
      const valueLength = current >>> 14;
      const char = input.charCodeAt(offset);
      if (valueLength !== 0) {
        if (!isStrict && (current & BinTrieFlags.FLAG13) === 0) {
          this.result = treeIndex;
          consumed += excess - 1;
          excess = 1;
        }
        if (char === CharCodes.SEMI) {
          return this.emitNamedEntityData(treeIndex, valueLength, consumed + excess);
        }
        if (valueLength === 1) {
          return this.flushAndEmitLegacyOrReject(consumed, excess, char, valueLength);
        }
      }
      const next = determineBranch(decodeTree, current, treeIndex + (valueLength || 1), char);
      if (next < 0) {
        return this.flushAndEmitLegacyOrReject(consumed, excess, char, valueLength);
      }
      treeIndex = next;
      current = decodeTree[treeIndex];
      offset += 1;
      excess += 1;
    }
    if (!isStrict && current >>> 14 !== 0 && (current & BinTrieFlags.FLAG13) === 0) {
      this.result = treeIndex;
      consumed += excess - 1;
      excess = 1;
    }
    this.treeIndex = treeIndex;
    this.excess = excess;
    this.consumed = consumed;
    return -1;
  }
  emitNotTerminatedNamedEntity() {
    const { result, decodeTree } = this;
    const valueLength = decodeTree[result] >>> 14;
    this.emitNamedEntityData(result, valueLength, this.consumed);
    this.errors?.missingSemicolonAfterCharacterReference();
    return this.consumed;
  }
  emitNamedEntityData(result, valueLength, consumed) {
    const { decodeTree } = this;
    this.emitCodePoint(valueLength === 1 ? decodeTree[result] & BinTrieFlags.VALUE_MASK : decodeTree[result + 1], consumed);
    if (valueLength === 3) {
      this.emitCodePoint(decodeTree[result + 2], consumed);
    }
    return consumed;
  }
  end() {
    switch (this.state) {
      case EntityDecoderState.NamedEntity: {
        return this.result !== 0 && (this.decodeMode !== DecodingMode.Attribute || this.result === this.treeIndex) ? this.emitNotTerminatedNamedEntity() : 0;
      }
      case EntityDecoderState.NumericDecimal: {
        return this.emitNumericEntity(0, 2);
      }
      case EntityDecoderState.NumericHex: {
        return this.emitNumericEntity(0, 3);
      }
      case EntityDecoderState.NumericStart: {
        this.errors?.absenceOfDigitsInNumericCharacterReference(this.consumed);
        return 0;
      }
      default: {
        return 0;
      }
    }
  }
}
function determineBranch(decodeTree, current, nodeIndex, char) {
  const branchCount = (current & BinTrieFlags.BRANCH_LENGTH) >> 7;
  const jumpOffset = current & BinTrieFlags.JUMP_TABLE;
  if (jumpOffset) {
    if (branchCount === 0) {
      return char === jumpOffset ? nodeIndex : -1;
    }
    const slot = char - jumpOffset;
    if (slot >>> 0 >= branchCount)
      return -1;
    const stored = decodeTree[nodeIndex + slot];
    return stored === 0 ? -1 : nodeIndex + branchCount + stored - 1 & 65535;
  }
  if (branchCount === 0)
    return -1;
  const packedKeySlots = branchCount + 1 >> 1;
  const branchEnd = nodeIndex + packedKeySlots + branchCount;
  for (let index = 0;index < branchCount; index++) {
    const packed = decodeTree[nodeIndex + (index >> 1)];
    const key = packed >> ((index & 1) << 3) & 255;
    if (key === char) {
      const pointerIndex = nodeIndex + packedKeySlots + index;
      return branchEnd + decodeTree[pointerIndex] & 65535;
    }
    if (key > char)
      return -1;
  }
  return -1;
}
var CharCodes, TO_LOWER_BIT = 32, EntityDecoderState, DecodingMode;
var init_decode = __esm(() => {
  init_decode_codepoint();
  init_decode_data_xml();
  init_bin_trie_flags();
  init_decode_data_html();
  init_decode_data_xml();
  (function(CharCodes) {
    CharCodes[CharCodes["AMP"] = 38] = "AMP";
    CharCodes[CharCodes["NUM"] = 35] = "NUM";
    CharCodes[CharCodes["SEMI"] = 59] = "SEMI";
    CharCodes[CharCodes["EQUALS"] = 61] = "EQUALS";
    CharCodes[CharCodes["ZERO"] = 48] = "ZERO";
    CharCodes[CharCodes["NINE"] = 57] = "NINE";
    CharCodes[CharCodes["LOWER_A"] = 97] = "LOWER_A";
    CharCodes[CharCodes["LOWER_X"] = 120] = "LOWER_X";
  })(CharCodes || (CharCodes = {}));
  (function(EntityDecoderState) {
    EntityDecoderState[EntityDecoderState["EntityStart"] = 0] = "EntityStart";
    EntityDecoderState[EntityDecoderState["NumericStart"] = 1] = "NumericStart";
    EntityDecoderState[EntityDecoderState["NumericDecimal"] = 2] = "NumericDecimal";
    EntityDecoderState[EntityDecoderState["NumericHex"] = 3] = "NumericHex";
    EntityDecoderState[EntityDecoderState["NamedEntity"] = 4] = "NamedEntity";
  })(EntityDecoderState || (EntityDecoderState = {}));
  (function(DecodingMode) {
    DecodingMode[DecodingMode["Legacy"] = 0] = "Legacy";
    DecodingMode[DecodingMode["Strict"] = 1] = "Strict";
    DecodingMode[DecodingMode["Attribute"] = 2] = "Attribute";
  })(DecodingMode || (DecodingMode = {}));
});

// /zveltio-extension/node_modules/htmlparser2/dist/Tokenizer.js
function isWhitespace(c) {
  return c === CharCodes2.Space || c === CharCodes2.NewLine || c === CharCodes2.Tab || c === CharCodes2.FormFeed || c === CharCodes2.CarriageReturn;
}
function isEndOfTagSection(c) {
  return c === CharCodes2.Slash || c === CharCodes2.Gt || isWhitespace(c);
}
function isASCIIAlpha(c) {
  return c >= CharCodes2.LowerA && c <= CharCodes2.LowerZ || c >= CharCodes2.UpperA && c <= CharCodes2.UpperZ;
}

class Tokenizer2 {
  cbs;
  state = State.Text;
  buffer = "";
  sectionStart = 0;
  index = 0;
  entityStart = 0;
  baseState = State.Text;
  isSpecial = false;
  running = true;
  offset = 0;
  xmlMode;
  decodeEntities;
  recognizeSelfClosing;
  entityDecoder;
  constructor({ xmlMode = false, decodeEntities = true, recognizeSelfClosing = xmlMode }, cbs) {
    this.cbs = cbs;
    this.xmlMode = xmlMode;
    this.decodeEntities = decodeEntities;
    this.recognizeSelfClosing = recognizeSelfClosing;
    this.entityDecoder = new EntityDecoder(xmlMode ? xmlDecodeTree : htmlDecodeTree, (cp, consumed) => this.emitCodePoint(cp, consumed));
  }
  reset() {
    this.state = State.Text;
    this.buffer = "";
    this.sectionStart = 0;
    this.index = 0;
    this.baseState = State.Text;
    this.isSpecial = false;
    this.currentSequence = Sequences.Empty;
    this.sequenceIndex = 0;
    this.running = true;
    this.offset = 0;
  }
  write(chunk) {
    this.offset += this.buffer.length;
    this.buffer = chunk;
    this.parse();
  }
  end() {
    if (this.running)
      this.finish();
  }
  pause() {
    this.running = false;
  }
  resume() {
    this.running = true;
    if (this.index < this.buffer.length + this.offset) {
      this.parse();
    }
  }
  stateText(c) {
    if (c === CharCodes2.Lt || !this.decodeEntities && this.fastForwardTo(CharCodes2.Lt)) {
      if (this.index > this.sectionStart) {
        this.cbs.ontext(this.sectionStart, this.index);
      }
      this.state = State.BeforeTagName;
      this.sectionStart = this.index;
    } else if (this.decodeEntities && c === CharCodes2.Amp) {
      this.startEntity();
    }
  }
  currentSequence = Sequences.Empty;
  sequenceIndex = 0;
  enterTagBody() {
    if (this.currentSequence === Sequences.Plaintext) {
      this.currentSequence = Sequences.Empty;
      this.state = State.InPlainText;
    } else if (this.isSpecial) {
      this.state = State.InSpecialTag;
      this.sequenceIndex = 0;
    } else {
      this.state = State.Text;
    }
  }
  stateSpecialStartSequence(c) {
    const lower = c | 32;
    if (this.sequenceIndex < this.currentSequence.length) {
      if (lower === this.currentSequence[this.sequenceIndex]) {
        this.sequenceIndex++;
        return;
      }
      if (this.sequenceIndex === 3) {
        if (this.currentSequence === Sequences.ScriptEnd && lower === Sequences.StyleEnd[3]) {
          this.currentSequence = Sequences.StyleEnd;
          this.sequenceIndex = 4;
          return;
        }
        if (this.currentSequence === Sequences.TitleEnd && lower === Sequences.TextareaEnd[3]) {
          this.currentSequence = Sequences.TextareaEnd;
          this.sequenceIndex = 4;
          return;
        }
      } else if (this.sequenceIndex === 4 && this.currentSequence === Sequences.NoembedEnd && lower === Sequences.NoframesEnd[4]) {
        this.currentSequence = Sequences.NoframesEnd;
        this.sequenceIndex = 5;
        return;
      }
    } else if (isEndOfTagSection(c)) {
      this.sequenceIndex = 0;
      this.state = State.InTagName;
      this.stateInTagName(c);
      return;
    }
    this.isSpecial = false;
    this.currentSequence = Sequences.Empty;
    this.sequenceIndex = 0;
    this.state = State.InTagName;
    this.stateInTagName(c);
  }
  stateCDATASequence(c) {
    if (c === Sequences.Cdata[this.sequenceIndex]) {
      if (++this.sequenceIndex === Sequences.Cdata.length) {
        this.state = State.InCommentLike;
        this.currentSequence = Sequences.CdataEnd;
        this.sequenceIndex = 0;
        this.sectionStart = this.index + 1;
      }
    } else {
      this.sequenceIndex = 0;
      if (this.xmlMode) {
        this.state = State.InDeclaration;
        this.stateInDeclaration(c);
      } else {
        this.state = State.InSpecialComment;
        this.stateInSpecialComment(c);
      }
    }
  }
  fastForwardTo(c) {
    while (++this.index < this.buffer.length + this.offset) {
      if (this.buffer.charCodeAt(this.index - this.offset) === c) {
        return true;
      }
    }
    this.index = this.buffer.length + this.offset - 1;
    return false;
  }
  emitComment(offset) {
    this.cbs.oncomment(this.sectionStart, this.index, offset);
    this.sequenceIndex = 0;
    this.sectionStart = this.index + 1;
    this.state = State.Text;
  }
  stateInCommentLike(c) {
    if (!this.xmlMode && this.currentSequence === Sequences.CommentEnd && this.sequenceIndex <= 1 && this.index === this.sectionStart + this.sequenceIndex && c === CharCodes2.Gt) {
      this.emitComment(this.sequenceIndex);
    } else if (this.currentSequence === Sequences.CommentEnd && this.sequenceIndex === 2 && c === CharCodes2.Gt) {
      this.emitComment(2);
    } else if (this.currentSequence === Sequences.CommentEnd && this.sequenceIndex === this.currentSequence.length - 1 && c !== CharCodes2.Gt) {
      this.sequenceIndex = Number(c === CharCodes2.Dash);
    } else if (c === this.currentSequence[this.sequenceIndex]) {
      if (++this.sequenceIndex === this.currentSequence.length) {
        if (this.currentSequence === Sequences.CdataEnd) {
          this.cbs.oncdata(this.sectionStart, this.index, 2);
        } else {
          this.cbs.oncomment(this.sectionStart, this.index, 3);
        }
        this.sequenceIndex = 0;
        this.sectionStart = this.index + 1;
        this.state = State.Text;
      }
    } else if (this.sequenceIndex === 0) {
      if (this.fastForwardTo(this.currentSequence[0])) {
        this.sequenceIndex = 1;
      }
    } else if (c !== this.currentSequence[this.sequenceIndex - 1]) {
      this.sequenceIndex = 0;
    }
  }
  isTagStartChar(c) {
    return this.xmlMode ? !isEndOfTagSection(c) : isASCIIAlpha(c);
  }
  stateInSpecialTag(c) {
    if (this.sequenceIndex === this.currentSequence.length) {
      if (isEndOfTagSection(c)) {
        const endOfText = this.index - this.currentSequence.length;
        if (this.sectionStart < endOfText) {
          const actualIndex = this.index;
          this.index = endOfText;
          this.cbs.ontext(this.sectionStart, endOfText);
          this.index = actualIndex;
        }
        this.isSpecial = false;
        this.sectionStart = endOfText + 2;
        this.stateInClosingTagName(c);
        return;
      }
      this.sequenceIndex = 0;
    }
    if ((c | 32) === this.currentSequence[this.sequenceIndex]) {
      this.sequenceIndex += 1;
    } else if (this.sequenceIndex === 0) {
      if (this.currentSequence === Sequences.TitleEnd || this.currentSequence === Sequences.TextareaEnd) {
        if (this.decodeEntities && c === CharCodes2.Amp) {
          this.startEntity();
        }
      } else if (this.fastForwardTo(CharCodes2.Lt)) {
        this.sequenceIndex = 1;
      }
    } else {
      this.sequenceIndex = Number(c === CharCodes2.Lt);
    }
  }
  stateBeforeTagName(c) {
    if (c === CharCodes2.ExclamationMark) {
      this.state = State.BeforeDeclaration;
      this.sectionStart = this.index + 1;
    } else if (c === CharCodes2.Questionmark) {
      if (this.xmlMode) {
        this.state = State.InProcessingInstruction;
        this.sequenceIndex = 0;
        this.sectionStart = this.index + 1;
      } else {
        this.state = State.InSpecialComment;
        this.sectionStart = this.index;
      }
    } else if (this.isTagStartChar(c)) {
      this.sectionStart = this.index;
      const special = this.xmlMode || this.cbs.isInForeignContext?.() ? undefined : specialStartSequences.get(c | 32);
      if (special === undefined) {
        this.state = State.InTagName;
      } else {
        this.isSpecial = true;
        this.currentSequence = special;
        this.sequenceIndex = 3;
        this.state = State.SpecialStartSequence;
      }
    } else if (c === CharCodes2.Slash) {
      this.state = State.BeforeClosingTagName;
    } else {
      this.state = State.Text;
      this.stateText(c);
    }
  }
  stateInTagName(c) {
    if (isEndOfTagSection(c)) {
      this.cbs.onopentagname(this.sectionStart, this.index);
      this.sectionStart = -1;
      this.state = State.BeforeAttributeName;
      this.stateBeforeAttributeName(c);
    }
  }
  stateBeforeClosingTagName(c) {
    if (isWhitespace(c)) {
      if (this.xmlMode) {} else {
        this.state = State.InSpecialComment;
        this.sectionStart = this.index;
      }
    } else if (c === CharCodes2.Gt) {
      this.state = State.Text;
      if (!this.xmlMode) {
        this.sectionStart = this.index + 1;
      }
    } else {
      this.state = this.isTagStartChar(c) ? State.InClosingTagName : State.InSpecialComment;
      this.sectionStart = this.index;
    }
  }
  stateInClosingTagName(c) {
    if (isEndOfTagSection(c)) {
      this.cbs.onclosetag(this.sectionStart, this.index);
      this.sectionStart = -1;
      this.state = State.AfterClosingTagName;
      this.stateAfterClosingTagName(c);
    }
  }
  stateAfterClosingTagName(c) {
    if (c === CharCodes2.Gt || this.fastForwardTo(CharCodes2.Gt)) {
      this.state = State.Text;
      this.sectionStart = this.index + 1;
    }
  }
  stateBeforeAttributeName(c) {
    if (c === CharCodes2.Gt) {
      this.cbs.onopentagend(this.index);
      this.enterTagBody();
      this.sectionStart = this.index + 1;
    } else if (c === CharCodes2.Slash) {
      this.state = State.InSelfClosingTag;
    } else if (!isWhitespace(c)) {
      this.state = State.InAttributeName;
      this.sectionStart = this.index;
    }
  }
  stateInSelfClosingTag(c) {
    if (c === CharCodes2.Gt) {
      this.cbs.onselfclosingtag(this.index);
      this.sectionStart = this.index + 1;
      if (!this.recognizeSelfClosing) {
        this.enterTagBody();
        return;
      }
      this.state = State.Text;
      this.isSpecial = false;
      this.currentSequence = Sequences.Empty;
    } else if (!isWhitespace(c)) {
      this.state = State.BeforeAttributeName;
      this.stateBeforeAttributeName(c);
    }
  }
  stateInAttributeName(c) {
    if (c === CharCodes2.Eq || isEndOfTagSection(c)) {
      this.cbs.onattribname(this.sectionStart, this.index);
      this.sectionStart = this.index;
      this.state = State.AfterAttributeName;
      this.stateAfterAttributeName(c);
    }
  }
  stateAfterAttributeName(c) {
    if (c === CharCodes2.Eq) {
      this.state = State.BeforeAttributeValue;
    } else if (c === CharCodes2.Slash || c === CharCodes2.Gt) {
      this.cbs.onattribend(QuoteType.NoValue, this.sectionStart);
      this.sectionStart = -1;
      this.state = State.BeforeAttributeName;
      this.stateBeforeAttributeName(c);
    } else if (!isWhitespace(c)) {
      this.cbs.onattribend(QuoteType.NoValue, this.sectionStart);
      this.state = State.InAttributeName;
      this.sectionStart = this.index;
    }
  }
  stateBeforeAttributeValue(c) {
    if (c === CharCodes2.DoubleQuote) {
      this.state = State.InAttributeValueDq;
      this.sectionStart = this.index + 1;
    } else if (c === CharCodes2.SingleQuote) {
      this.state = State.InAttributeValueSq;
      this.sectionStart = this.index + 1;
    } else if (!isWhitespace(c)) {
      this.sectionStart = this.index;
      this.state = State.InAttributeValueNq;
      this.stateInAttributeValueNoQuotes(c);
    }
  }
  handleInAttributeValue(c, quote) {
    if (c === quote || !this.decodeEntities && this.fastForwardTo(quote)) {
      this.cbs.onattribdata(this.sectionStart, this.index);
      this.sectionStart = -1;
      this.cbs.onattribend(quote === CharCodes2.DoubleQuote ? QuoteType.Double : QuoteType.Single, this.index + 1);
      this.state = State.BeforeAttributeName;
    } else if (this.decodeEntities && c === CharCodes2.Amp) {
      this.startEntity();
    }
  }
  stateInAttributeValueDoubleQuotes(c) {
    this.handleInAttributeValue(c, CharCodes2.DoubleQuote);
  }
  stateInAttributeValueSingleQuotes(c) {
    this.handleInAttributeValue(c, CharCodes2.SingleQuote);
  }
  stateInAttributeValueNoQuotes(c) {
    if (isWhitespace(c) || c === CharCodes2.Gt) {
      this.cbs.onattribdata(this.sectionStart, this.index);
      this.sectionStart = -1;
      this.cbs.onattribend(QuoteType.Unquoted, this.index);
      this.state = State.BeforeAttributeName;
      this.stateBeforeAttributeName(c);
    } else if (this.decodeEntities && c === CharCodes2.Amp) {
      this.startEntity();
    }
  }
  stateBeforeDeclaration(c) {
    if (c === CharCodes2.OpeningSquareBracket) {
      this.state = State.CDATASequence;
      this.sequenceIndex = 0;
    } else if (this.xmlMode) {
      this.state = c === CharCodes2.Dash ? State.BeforeComment : State.InDeclaration;
    } else if ((c | 32) === Sequences.Doctype[0]) {
      this.state = State.DeclarationSequence;
      this.currentSequence = Sequences.Doctype;
      this.sequenceIndex = 1;
    } else if (c === CharCodes2.Gt) {
      this.cbs.oncomment(this.sectionStart, this.index, 0);
      this.state = State.Text;
      this.sectionStart = this.index + 1;
    } else if (c === CharCodes2.Dash) {
      this.state = State.BeforeComment;
    } else {
      this.state = State.InSpecialComment;
    }
  }
  stateDeclarationSequence(c) {
    if (this.sequenceIndex === this.currentSequence.length) {
      this.state = State.InDeclaration;
      this.stateInDeclaration(c);
    } else if ((c | 32) === this.currentSequence[this.sequenceIndex]) {
      this.sequenceIndex += 1;
    } else if (c === CharCodes2.Gt) {
      this.cbs.oncomment(this.sectionStart, this.index, 0);
      this.state = State.Text;
      this.sectionStart = this.index + 1;
    } else {
      this.state = State.InSpecialComment;
    }
  }
  stateInDeclaration(c) {
    if (c === CharCodes2.Gt || this.fastForwardTo(CharCodes2.Gt)) {
      this.cbs.ondeclaration(this.sectionStart, this.index);
      this.state = State.Text;
      this.sectionStart = this.index + 1;
    }
  }
  stateInProcessingInstruction(c) {
    if (c === CharCodes2.Questionmark) {
      this.sequenceIndex = 1;
    } else if (c === CharCodes2.Gt && this.sequenceIndex === 1) {
      this.cbs.onprocessinginstruction(this.sectionStart, this.index - 1);
      this.sequenceIndex = 0;
      this.state = State.Text;
      this.sectionStart = this.index + 1;
    } else {
      this.sequenceIndex = Number(this.fastForwardTo(CharCodes2.Questionmark));
    }
  }
  stateBeforeComment(c) {
    if (c === CharCodes2.Dash) {
      this.state = State.InCommentLike;
      this.currentSequence = Sequences.CommentEnd;
      this.sequenceIndex = 0;
      this.sectionStart = this.index + 1;
    } else if (this.xmlMode) {
      this.state = State.InDeclaration;
    } else if (c === CharCodes2.Gt) {
      this.cbs.oncomment(this.sectionStart, this.index, 0);
      this.state = State.Text;
      this.sectionStart = this.index + 1;
    } else {
      this.state = State.InSpecialComment;
    }
  }
  stateInSpecialComment(c) {
    if (c === CharCodes2.Gt || this.fastForwardTo(CharCodes2.Gt)) {
      this.cbs.oncomment(this.sectionStart, this.index, 0);
      this.state = State.Text;
      this.sectionStart = this.index + 1;
    }
  }
  startEntity() {
    this.baseState = this.state;
    this.state = State.InEntity;
    this.entityStart = this.index;
    this.entityDecoder.startEntity(this.xmlMode ? DecodingMode.Strict : this.baseState === State.Text || this.baseState === State.InSpecialTag ? DecodingMode.Legacy : DecodingMode.Attribute);
  }
  stateInEntity() {
    const indexInBuffer = this.index - this.offset;
    const length = this.entityDecoder.write(this.buffer, indexInBuffer);
    if (length >= 0) {
      this.state = this.baseState;
      if (length === 0) {
        this.index -= 1;
      }
    } else {
      if (indexInBuffer < this.buffer.length && this.buffer.charCodeAt(indexInBuffer) === CharCodes2.Amp) {
        this.state = this.baseState;
        this.index -= 1;
        return;
      }
      this.index = this.offset + this.buffer.length - 1;
    }
  }
  cleanup() {
    if (this.running && this.sectionStart !== this.index) {
      if (this.state === State.Text || this.state === State.InPlainText || this.state === State.InSpecialTag && this.sequenceIndex === 0) {
        this.cbs.ontext(this.sectionStart, this.index);
        this.sectionStart = this.index;
      } else if (this.state === State.InAttributeValueDq || this.state === State.InAttributeValueSq || this.state === State.InAttributeValueNq) {
        this.cbs.onattribdata(this.sectionStart, this.index);
        this.sectionStart = this.index;
      }
    }
  }
  shouldContinue() {
    return this.index < this.buffer.length + this.offset && this.running;
  }
  parse() {
    while (this.shouldContinue()) {
      const c = this.buffer.charCodeAt(this.index - this.offset);
      switch (this.state) {
        case State.Text: {
          this.stateText(c);
          break;
        }
        case State.InPlainText: {
          this.index = this.buffer.length + this.offset - 1;
          break;
        }
        case State.SpecialStartSequence: {
          this.stateSpecialStartSequence(c);
          break;
        }
        case State.InSpecialTag: {
          this.stateInSpecialTag(c);
          break;
        }
        case State.CDATASequence: {
          this.stateCDATASequence(c);
          break;
        }
        case State.DeclarationSequence: {
          this.stateDeclarationSequence(c);
          break;
        }
        case State.InAttributeValueDq: {
          this.stateInAttributeValueDoubleQuotes(c);
          break;
        }
        case State.InAttributeName: {
          this.stateInAttributeName(c);
          break;
        }
        case State.InCommentLike: {
          this.stateInCommentLike(c);
          break;
        }
        case State.InSpecialComment: {
          this.stateInSpecialComment(c);
          break;
        }
        case State.BeforeAttributeName: {
          this.stateBeforeAttributeName(c);
          break;
        }
        case State.InTagName: {
          this.stateInTagName(c);
          break;
        }
        case State.InClosingTagName: {
          this.stateInClosingTagName(c);
          break;
        }
        case State.BeforeTagName: {
          this.stateBeforeTagName(c);
          break;
        }
        case State.AfterAttributeName: {
          this.stateAfterAttributeName(c);
          break;
        }
        case State.InAttributeValueSq: {
          this.stateInAttributeValueSingleQuotes(c);
          break;
        }
        case State.BeforeAttributeValue: {
          this.stateBeforeAttributeValue(c);
          break;
        }
        case State.BeforeClosingTagName: {
          this.stateBeforeClosingTagName(c);
          break;
        }
        case State.AfterClosingTagName: {
          this.stateAfterClosingTagName(c);
          break;
        }
        case State.InAttributeValueNq: {
          this.stateInAttributeValueNoQuotes(c);
          break;
        }
        case State.InSelfClosingTag: {
          this.stateInSelfClosingTag(c);
          break;
        }
        case State.InDeclaration: {
          this.stateInDeclaration(c);
          break;
        }
        case State.BeforeDeclaration: {
          this.stateBeforeDeclaration(c);
          break;
        }
        case State.BeforeComment: {
          this.stateBeforeComment(c);
          break;
        }
        case State.InProcessingInstruction: {
          this.stateInProcessingInstruction(c);
          break;
        }
        case State.InEntity: {
          this.stateInEntity();
          break;
        }
      }
      this.index++;
    }
    this.cleanup();
  }
  finish() {
    if (this.state === State.InEntity) {
      this.entityDecoder.end();
      this.state = this.baseState;
    }
    this.handleTrailingData();
    this.cbs.onend();
  }
  handleTrailingCommentLikeData(endIndex) {
    if (this.state !== State.InCommentLike) {
      return false;
    }
    if (this.currentSequence === Sequences.CdataEnd) {
      if (this.xmlMode) {
        if (this.sectionStart < endIndex) {
          this.cbs.oncdata(this.sectionStart, endIndex, 0);
        }
      } else {
        const cdataStart = this.sectionStart - Sequences.Cdata.length - 1;
        this.cbs.oncomment(cdataStart, endIndex, 0);
      }
    } else {
      const offset = this.xmlMode ? 0 : Math.min(this.sequenceIndex, Sequences.CommentEnd.length - 1);
      this.cbs.oncomment(this.sectionStart, endIndex, offset);
    }
    return true;
  }
  handleTrailingMarkupDeclaration(endIndex) {
    if (this.xmlMode) {
      switch (this.state) {
        case State.InSpecialComment:
        case State.BeforeComment:
        case State.CDATASequence:
        case State.DeclarationSequence:
        case State.InDeclaration: {
          this.cbs.ontext(this.sectionStart, endIndex);
          return true;
        }
        default: {
          return false;
        }
      }
    }
    switch (this.state) {
      case State.BeforeDeclaration:
      case State.InSpecialComment:
      case State.BeforeComment:
      case State.CDATASequence: {
        this.cbs.oncomment(this.sectionStart, endIndex, 0);
        return true;
      }
      case State.DeclarationSequence: {
        if (this.sequenceIndex !== Sequences.Doctype.length) {
          this.cbs.oncomment(this.sectionStart, endIndex, 0);
        }
        return true;
      }
      case State.InDeclaration: {
        return true;
      }
      default: {
        return false;
      }
    }
  }
  handleTrailingData() {
    const endIndex = this.buffer.length + this.offset;
    if (this.handleTrailingCommentLikeData(endIndex) || this.handleTrailingMarkupDeclaration(endIndex)) {
      return;
    }
    if (this.sectionStart >= endIndex) {
      return;
    }
    switch (this.state) {
      case State.InTagName:
      case State.BeforeAttributeName:
      case State.BeforeAttributeValue:
      case State.AfterAttributeName:
      case State.InAttributeName:
      case State.InAttributeValueSq:
      case State.InAttributeValueDq:
      case State.InAttributeValueNq:
      case State.InClosingTagName: {
        break;
      }
      default: {
        this.cbs.ontext(this.sectionStart, endIndex);
      }
    }
  }
  emitCodePoint(cp, consumed) {
    if (this.baseState !== State.Text && this.baseState !== State.InSpecialTag) {
      if (this.sectionStart < this.entityStart) {
        this.cbs.onattribdata(this.sectionStart, this.entityStart);
      }
      this.sectionStart = this.entityStart + consumed;
      this.index = this.sectionStart - 1;
      this.cbs.onattribentity(cp);
    } else {
      if (this.sectionStart < this.entityStart) {
        this.cbs.ontext(this.sectionStart, this.entityStart);
      }
      this.sectionStart = this.entityStart + consumed;
      this.index = this.sectionStart - 1;
      this.cbs.ontextentity(cp, this.sectionStart);
    }
  }
}
var CharCodes2, State, QuoteType, Sequences, specialStartSequences;
var init_Tokenizer = __esm(() => {
  init_decode();
  (function(CharCodes) {
    CharCodes[CharCodes["Tab"] = 9] = "Tab";
    CharCodes[CharCodes["NewLine"] = 10] = "NewLine";
    CharCodes[CharCodes["FormFeed"] = 12] = "FormFeed";
    CharCodes[CharCodes["CarriageReturn"] = 13] = "CarriageReturn";
    CharCodes[CharCodes["Space"] = 32] = "Space";
    CharCodes[CharCodes["ExclamationMark"] = 33] = "ExclamationMark";
    CharCodes[CharCodes["Number"] = 35] = "Number";
    CharCodes[CharCodes["Amp"] = 38] = "Amp";
    CharCodes[CharCodes["SingleQuote"] = 39] = "SingleQuote";
    CharCodes[CharCodes["DoubleQuote"] = 34] = "DoubleQuote";
    CharCodes[CharCodes["Dash"] = 45] = "Dash";
    CharCodes[CharCodes["Slash"] = 47] = "Slash";
    CharCodes[CharCodes["Zero"] = 48] = "Zero";
    CharCodes[CharCodes["Nine"] = 57] = "Nine";
    CharCodes[CharCodes["Semi"] = 59] = "Semi";
    CharCodes[CharCodes["Lt"] = 60] = "Lt";
    CharCodes[CharCodes["Eq"] = 61] = "Eq";
    CharCodes[CharCodes["Gt"] = 62] = "Gt";
    CharCodes[CharCodes["Questionmark"] = 63] = "Questionmark";
    CharCodes[CharCodes["UpperA"] = 65] = "UpperA";
    CharCodes[CharCodes["LowerA"] = 97] = "LowerA";
    CharCodes[CharCodes["UpperF"] = 70] = "UpperF";
    CharCodes[CharCodes["LowerF"] = 102] = "LowerF";
    CharCodes[CharCodes["UpperZ"] = 90] = "UpperZ";
    CharCodes[CharCodes["LowerZ"] = 122] = "LowerZ";
    CharCodes[CharCodes["LowerX"] = 120] = "LowerX";
    CharCodes[CharCodes["OpeningSquareBracket"] = 91] = "OpeningSquareBracket";
  })(CharCodes2 || (CharCodes2 = {}));
  (function(State) {
    State[State["Text"] = 1] = "Text";
    State[State["BeforeTagName"] = 2] = "BeforeTagName";
    State[State["InTagName"] = 3] = "InTagName";
    State[State["InSelfClosingTag"] = 4] = "InSelfClosingTag";
    State[State["BeforeClosingTagName"] = 5] = "BeforeClosingTagName";
    State[State["InClosingTagName"] = 6] = "InClosingTagName";
    State[State["AfterClosingTagName"] = 7] = "AfterClosingTagName";
    State[State["BeforeAttributeName"] = 8] = "BeforeAttributeName";
    State[State["InAttributeName"] = 9] = "InAttributeName";
    State[State["AfterAttributeName"] = 10] = "AfterAttributeName";
    State[State["BeforeAttributeValue"] = 11] = "BeforeAttributeValue";
    State[State["InAttributeValueDq"] = 12] = "InAttributeValueDq";
    State[State["InAttributeValueSq"] = 13] = "InAttributeValueSq";
    State[State["InAttributeValueNq"] = 14] = "InAttributeValueNq";
    State[State["BeforeDeclaration"] = 15] = "BeforeDeclaration";
    State[State["InDeclaration"] = 16] = "InDeclaration";
    State[State["InProcessingInstruction"] = 17] = "InProcessingInstruction";
    State[State["BeforeComment"] = 18] = "BeforeComment";
    State[State["CDATASequence"] = 19] = "CDATASequence";
    State[State["DeclarationSequence"] = 20] = "DeclarationSequence";
    State[State["InSpecialComment"] = 21] = "InSpecialComment";
    State[State["InCommentLike"] = 22] = "InCommentLike";
    State[State["SpecialStartSequence"] = 23] = "SpecialStartSequence";
    State[State["InSpecialTag"] = 24] = "InSpecialTag";
    State[State["InPlainText"] = 25] = "InPlainText";
    State[State["InEntity"] = 26] = "InEntity";
  })(State || (State = {}));
  (function(QuoteType) {
    QuoteType[QuoteType["NoValue"] = 0] = "NoValue";
    QuoteType[QuoteType["Unquoted"] = 1] = "Unquoted";
    QuoteType[QuoteType["Single"] = 2] = "Single";
    QuoteType[QuoteType["Double"] = 3] = "Double";
  })(QuoteType || (QuoteType = {}));
  Sequences = {
    Empty: new Uint8Array(0),
    Cdata: new Uint8Array([67, 68, 65, 84, 65, 91]),
    CdataEnd: new Uint8Array([93, 93, 62]),
    CommentEnd: new Uint8Array([45, 45, 33, 62]),
    Doctype: new Uint8Array([100, 111, 99, 116, 121, 112, 101]),
    IframeEnd: new Uint8Array([60, 47, 105, 102, 114, 97, 109, 101]),
    NoembedEnd: new Uint8Array([
      60,
      47,
      110,
      111,
      101,
      109,
      98,
      101,
      100
    ]),
    NoframesEnd: new Uint8Array([
      60,
      47,
      110,
      111,
      102,
      114,
      97,
      109,
      101,
      115
    ]),
    Plaintext: new Uint8Array([
      60,
      47,
      112,
      108,
      97,
      105,
      110,
      116,
      101,
      120,
      116
    ]),
    ScriptEnd: new Uint8Array([60, 47, 115, 99, 114, 105, 112, 116]),
    StyleEnd: new Uint8Array([60, 47, 115, 116, 121, 108, 101]),
    TitleEnd: new Uint8Array([60, 47, 116, 105, 116, 108, 101]),
    TextareaEnd: new Uint8Array([
      60,
      47,
      116,
      101,
      120,
      116,
      97,
      114,
      101,
      97
    ]),
    XmpEnd: new Uint8Array([60, 47, 120, 109, 112])
  };
  specialStartSequences = new Map([
    [Sequences.IframeEnd[2], Sequences.IframeEnd],
    [Sequences.NoembedEnd[2], Sequences.NoembedEnd],
    [Sequences.Plaintext[2], Sequences.Plaintext],
    [Sequences.ScriptEnd[2], Sequences.ScriptEnd],
    [Sequences.TitleEnd[2], Sequences.TitleEnd],
    [Sequences.XmpEnd[2], Sequences.XmpEnd]
  ]);
});

// /zveltio-extension/node_modules/htmlparser2/dist/Parser.js
class Parser {
  options;
  startIndex = 0;
  endIndex = 0;
  openTagStart = 0;
  tagname = "";
  attribname = "";
  attribvalue = "";
  attribs = null;
  stack = [];
  foreignContext;
  cbs;
  lowerCaseTagNames;
  lowerCaseAttributeNames;
  recognizeSelfClosing;
  htmlMode;
  tokenizer;
  buffers = [];
  bufferOffset = 0;
  writeIndex = 0;
  ended = false;
  constructor(cbs, options = {}) {
    this.options = options;
    this.cbs = cbs ?? {};
    this.htmlMode = !this.options.xmlMode;
    this.lowerCaseTagNames = options.lowerCaseTags ?? this.htmlMode;
    this.lowerCaseAttributeNames = options.lowerCaseAttributeNames ?? this.htmlMode;
    this.recognizeSelfClosing = options.recognizeSelfClosing ?? !this.htmlMode;
    this.tokenizer = new (options.Tokenizer ?? Tokenizer2)(this.options, this);
    this.foreignContext = [ForeignContext.None];
    this.cbs.onparserinit?.(this);
  }
  ontext(start, endIndex) {
    const data = this.getSlice(start, endIndex);
    this.endIndex = endIndex - 1;
    this.cbs.ontext?.(data);
    this.startIndex = endIndex;
  }
  ontextentity(cp, endIndex) {
    this.endIndex = endIndex - 1;
    this.cbs.ontext?.(fromCodePoint(cp));
    this.startIndex = endIndex;
  }
  isInForeignContext() {
    return this.foreignContext[0] !== ForeignContext.None;
  }
  isVoidElement(name) {
    return this.htmlMode && voidElements.has(name);
  }
  readTagName(start, endIndex) {
    const name = this.lowerCaseTagNames ? this.getSlice(start, endIndex).toLowerCase() : this.getSlice(start, endIndex);
    if (!(this.lowerCaseTagNames && this.htmlMode)) {
      return name;
    }
    if (this.foreignContext[0] === ForeignContext.Svg) {
      return svgTagNameAdjustments.get(name) ?? name;
    }
    if (this.foreignContext.length > 1) {
      const adjusted = svgTagNameAdjustments.get(name);
      if (adjusted !== undefined && this.stack.includes(adjusted)) {
        return adjusted;
      }
    }
    if (!this.isInForeignContext()) {
      return name === "image" ? "img" : name;
    }
    return name;
  }
  onopentagname(start, endIndex) {
    this.endIndex = endIndex;
    this.emitOpenTag(this.readTagName(start, endIndex));
  }
  emitOpenTag(name) {
    this.openTagStart = this.startIndex;
    this.tagname = name;
    if (this.htmlMode && name === "form" && this.stack.includes("form")) {
      this.tagname = "";
      return;
    }
    const impliesClose = this.htmlMode && openImpliesClose.get(name);
    if (impliesClose) {
      while (this.stack.length > 0 && impliesClose.has(this.stack[0])) {
        this.popElement(true);
      }
    }
    if (!this.isVoidElement(name)) {
      this.stack.unshift(name);
      if (this.htmlMode) {
        if (name === "svg") {
          this.foreignContext.unshift(ForeignContext.Svg);
        } else if (name === "math") {
          this.foreignContext.unshift(ForeignContext.MathML);
        } else if (htmlIntegrationElements.has(name)) {
          this.foreignContext.unshift(ForeignContext.None);
        }
      }
    }
    this.cbs.onopentagname?.(name);
    if (this.cbs.onopentag)
      this.attribs = {};
  }
  endOpenTag(isImplied) {
    this.startIndex = this.openTagStart;
    if (this.attribs) {
      this.cbs.onopentag?.(this.tagname, this.attribs, isImplied);
      this.attribs = null;
    }
    if (this.cbs.onclosetag && this.isVoidElement(this.tagname)) {
      this.cbs.onclosetag(this.tagname, true);
    }
    this.tagname = "";
  }
  onopentagend(endIndex) {
    this.endIndex = endIndex;
    this.endOpenTag(false);
    this.startIndex = endIndex + 1;
  }
  onclosetag(start, endIndex) {
    this.endIndex = endIndex;
    const name = this.readTagName(start, endIndex);
    if (!this.isVoidElement(name)) {
      const pos = this.stack.indexOf(name);
      if (pos !== -1) {
        for (let index = 0;index < pos; index++) {
          this.popElement(true);
        }
        this.popElement(false);
      } else if (this.htmlMode && name === "p") {
        this.emitOpenTag("p");
        this.closeCurrentTag(true);
      }
    } else if (this.htmlMode && name === "br") {
      this.cbs.onopentagname?.("br");
      this.cbs.onopentag?.("br", {}, true);
      this.cbs.onclosetag?.("br", false);
    }
    this.startIndex = endIndex + 1;
  }
  onselfclosingtag(endIndex) {
    this.endIndex = endIndex;
    if (this.recognizeSelfClosing || this.isInForeignContext()) {
      this.closeCurrentTag(false);
      this.startIndex = endIndex + 1;
    } else {
      this.onopentagend(endIndex);
    }
  }
  popElement(implied) {
    const element = this.stack.shift();
    if (this.htmlMode && (foreignContextElements.has(element) || htmlIntegrationElements.has(element))) {
      this.foreignContext.shift();
    }
    this.cbs.onclosetag?.(element, implied);
  }
  closeCurrentTag(isOpenImplied) {
    const name = this.tagname;
    this.endOpenTag(isOpenImplied);
    if (this.stack[0] === name) {
      this.popElement(!isOpenImplied);
    }
  }
  onattribname(start, endIndex) {
    this.startIndex = start;
    const name = this.getSlice(start, endIndex);
    this.attribname = this.lowerCaseAttributeNames ? name.toLowerCase() : name;
  }
  onattribdata(start, endIndex) {
    this.attribvalue += this.getSlice(start, endIndex);
  }
  onattribentity(cp) {
    this.attribvalue += fromCodePoint(cp);
  }
  onattribend(quote, endIndex) {
    this.endIndex = endIndex;
    this.cbs.onattribute?.(this.attribname, this.attribvalue, quote === QuoteType.Double ? '"' : quote === QuoteType.Single ? "'" : quote === QuoteType.NoValue ? undefined : null);
    if (this.attribs && !Object.hasOwn(this.attribs, this.attribname)) {
      this.attribs[this.attribname] = this.attribvalue;
    }
    this.attribvalue = "";
  }
  getInstructionName(value) {
    const index = value.search(reNameEnd);
    let name = index < 0 ? value : value.substr(0, index);
    if (this.lowerCaseTagNames) {
      name = name.toLowerCase();
    }
    return name;
  }
  ondeclaration(start, endIndex) {
    this.endIndex = endIndex;
    const value = this.getSlice(start, endIndex);
    if (this.cbs.onprocessinginstruction) {
      const name = this.htmlMode ? this.lowerCaseTagNames ? DOCUMENT_TYPE : value.slice(0, DOCUMENT_TYPE.length) : this.getInstructionName(value);
      this.cbs.onprocessinginstruction(`!${name}`, `!${value}`);
    }
    this.startIndex = endIndex + 1;
  }
  onprocessinginstruction(start, endIndex) {
    this.endIndex = endIndex;
    const value = this.getSlice(start, endIndex);
    if (this.cbs.onprocessinginstruction) {
      const name = this.getInstructionName(value);
      this.cbs.onprocessinginstruction(`?${name}`, `?${value}`);
    }
    this.startIndex = endIndex + 1;
  }
  oncomment(start, endIndex, offset) {
    this.endIndex = endIndex;
    this.cbs.oncomment?.(this.getSlice(start, endIndex - offset));
    this.cbs.oncommentend?.();
    this.startIndex = endIndex + 1;
  }
  oncdata(start, endIndex, offset) {
    this.endIndex = endIndex;
    const value = this.getSlice(start, endIndex - offset);
    if (!this.htmlMode || this.options.recognizeCDATA) {
      this.cbs.oncdatastart?.();
      this.cbs.ontext?.(value);
      this.cbs.oncdataend?.();
    } else if (this.isInForeignContext()) {
      this.cbs.ontext?.(value);
    } else {
      this.cbs.oncomment?.(`[CDATA[${value}]]`);
      this.cbs.oncommentend?.();
    }
    this.startIndex = endIndex + 1;
  }
  onend() {
    if (this.cbs.onclosetag) {
      this.endIndex = this.startIndex;
      for (let index = 0;index < this.stack.length; index++) {
        this.cbs.onclosetag(this.stack[index], true);
      }
    }
    this.cbs.onend?.();
  }
  reset() {
    this.cbs.onreset?.();
    this.tokenizer.reset();
    this.tagname = "";
    this.attribname = "";
    this.attribvalue = "";
    this.attribs = null;
    this.stack.length = 0;
    this.startIndex = 0;
    this.endIndex = 0;
    this.cbs.onparserinit?.(this);
    this.buffers.length = 0;
    this.foreignContext.length = 0;
    this.foreignContext.unshift(ForeignContext.None);
    this.bufferOffset = 0;
    this.writeIndex = 0;
    this.ended = false;
  }
  parseComplete(data) {
    this.reset();
    this.end(data);
  }
  getSlice(start, end) {
    if (start === end) {
      return "";
    }
    while (start - this.bufferOffset >= this.buffers[0].length) {
      this.shiftBuffer();
    }
    let slice = this.buffers[0].slice(start - this.bufferOffset, end - this.bufferOffset);
    while (end - this.bufferOffset > this.buffers[0].length) {
      this.shiftBuffer();
      slice += this.buffers[0].slice(0, end - this.bufferOffset);
    }
    return slice;
  }
  shiftBuffer() {
    this.bufferOffset += this.buffers[0].length;
    this.writeIndex--;
    this.buffers.shift();
  }
  write(chunk) {
    if (this.ended) {
      this.cbs.onerror?.(new Error(".write() after done!"));
      return;
    }
    this.buffers.push(chunk);
    if (this.tokenizer.running) {
      this.tokenizer.write(chunk);
      this.writeIndex++;
    }
  }
  end(chunk) {
    if (this.ended) {
      this.cbs.onerror?.(new Error(".end() after done!"));
      return;
    }
    if (chunk)
      this.write(chunk);
    this.ended = true;
    this.tokenizer.end();
  }
  pause() {
    this.tokenizer.pause();
  }
  resume() {
    this.tokenizer.resume();
    while (this.tokenizer.running && this.writeIndex < this.buffers.length) {
      this.tokenizer.write(this.buffers[this.writeIndex++]);
    }
    if (this.ended)
      this.tokenizer.end();
  }
}
var fromCodePoint, formTags, pTag, headingTags, tableSectionTags, ddtTags, rtpTags, openImpliesClose, DOCUMENT_TYPE = "doctype", voidElements, foreignContextElements, htmlIntegrationElements, svgTagNameAdjustments, ForeignContext, reNameEnd;
var init_Parser = __esm(() => {
  init_Tokenizer();
  ({ fromCodePoint } = String);
  formTags = new Set([
    "input",
    "option",
    "optgroup",
    "select",
    "button",
    "datalist",
    "textarea"
  ]);
  pTag = new Set(["p"]);
  headingTags = new Set(["h1", "h2", "h3", "h4", "h5", "h6", "p"]);
  tableSectionTags = new Set(["thead", "tbody"]);
  ddtTags = new Set(["dd", "dt"]);
  rtpTags = new Set(["rt", "rp"]);
  openImpliesClose = new Map([
    ["tr", new Set(["tr", "th", "td"])],
    ["th", new Set(["th"])],
    ["td", new Set(["thead", "th", "td"])],
    ["body", new Set(["head", "link", "script"])],
    ["a", new Set(["a"])],
    ["li", new Set(["li"])],
    ["p", pTag],
    ["h1", headingTags],
    ["h2", headingTags],
    ["h3", headingTags],
    ["h4", headingTags],
    ["h5", headingTags],
    ["h6", headingTags],
    ["select", formTags],
    ["input", formTags],
    ["output", formTags],
    ["button", formTags],
    ["datalist", formTags],
    ["textarea", formTags],
    ["option", new Set(["option"])],
    ["optgroup", new Set(["optgroup", "option"])],
    ["dd", ddtTags],
    ["dt", ddtTags],
    ["address", pTag],
    ["article", pTag],
    ["aside", pTag],
    ["blockquote", pTag],
    ["details", pTag],
    ["div", pTag],
    ["dl", pTag],
    ["fieldset", pTag],
    ["figcaption", pTag],
    ["figure", pTag],
    ["footer", pTag],
    ["form", pTag],
    ["header", pTag],
    ["hr", pTag],
    ["main", pTag],
    ["nav", pTag],
    ["ol", pTag],
    ["pre", pTag],
    ["section", pTag],
    ["table", pTag],
    ["ul", pTag],
    ["rt", rtpTags],
    ["rp", rtpTags],
    ["tbody", tableSectionTags],
    ["tfoot", tableSectionTags]
  ]);
  voidElements = new Set([
    "area",
    "base",
    "basefont",
    "br",
    "col",
    "command",
    "embed",
    "frame",
    "hr",
    "img",
    "input",
    "isindex",
    "keygen",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr"
  ]);
  foreignContextElements = new Set(["math", "svg"]);
  htmlIntegrationElements = new Set([
    "mi",
    "mo",
    "mn",
    "ms",
    "mtext",
    "annotation-xml",
    "foreignObject",
    "desc",
    "title"
  ]);
  svgTagNameAdjustments = new Map([
    ["altglyph", "altGlyph"],
    ["altglyphdef", "altGlyphDef"],
    ["altglyphitem", "altGlyphItem"],
    ["animatecolor", "animateColor"],
    ["animatemotion", "animateMotion"],
    ["animatetransform", "animateTransform"],
    ["clippath", "clipPath"],
    ["feblend", "feBlend"],
    ["fecolormatrix", "feColorMatrix"],
    ["fecomponenttransfer", "feComponentTransfer"],
    ["fecomposite", "feComposite"],
    ["feconvolvematrix", "feConvolveMatrix"],
    ["fediffuselighting", "feDiffuseLighting"],
    ["fedisplacementmap", "feDisplacementMap"],
    ["fedistantlight", "feDistantLight"],
    ["fedropshadow", "feDropShadow"],
    ["feflood", "feFlood"],
    ["fefunca", "feFuncA"],
    ["fefuncb", "feFuncB"],
    ["fefuncg", "feFuncG"],
    ["fefuncr", "feFuncR"],
    ["fegaussianblur", "feGaussianBlur"],
    ["feimage", "feImage"],
    ["femerge", "feMerge"],
    ["femergenode", "feMergeNode"],
    ["femorphology", "feMorphology"],
    ["feoffset", "feOffset"],
    ["fepointlight", "fePointLight"],
    ["fespecularlighting", "feSpecularLighting"],
    ["fespotlight", "feSpotLight"],
    ["fetile", "feTile"],
    ["feturbulence", "feTurbulence"],
    ["foreignobject", "foreignObject"],
    ["glyphref", "glyphRef"],
    ["lineargradient", "linearGradient"],
    ["radialgradient", "radialGradient"],
    ["textpath", "textPath"]
  ]);
  (function(ForeignContext) {
    ForeignContext[ForeignContext["None"] = 0] = "None";
    ForeignContext[ForeignContext["Svg"] = 1] = "Svg";
    ForeignContext[ForeignContext["MathML"] = 2] = "MathML";
  })(ForeignContext || (ForeignContext = {}));
  reNameEnd = /\s|\//;
});

// /zveltio-extension/node_modules/domelementtype/dist/index.js
var ElementType, Root, Text, Directive, Comment, Script, Style, Tag, CDATA, Doctype;
var init_dist = __esm(() => {
  (function(ElementType) {
    ElementType["Root"] = "root";
    ElementType["Text"] = "text";
    ElementType["Directive"] = "directive";
    ElementType["Comment"] = "comment";
    ElementType["Script"] = "script";
    ElementType["Style"] = "style";
    ElementType["Tag"] = "tag";
    ElementType["CDATA"] = "cdata";
    ElementType["Doctype"] = "doctype";
  })(ElementType || (ElementType = {}));
  Root = ElementType.Root;
  Text = ElementType.Text;
  Directive = ElementType.Directive;
  Comment = ElementType.Comment;
  Script = ElementType.Script;
  Style = ElementType.Style;
  Tag = ElementType.Tag;
  CDATA = ElementType.CDATA;
  Doctype = ElementType.Doctype;
});

// /zveltio-extension/node_modules/domutils/dist/querying.js
var init_querying = () => {};

// /zveltio-extension/node_modules/domutils/dist/legacy.js
var init_legacy = () => {};

// /zveltio-extension/node_modules/domutils/dist/stringify.js
var init_stringify = () => {};

// /zveltio-extension/node_modules/domutils/dist/feeds.js
var init_feeds = () => {};

// /zveltio-extension/node_modules/domutils/dist/helpers.js
var DocumentPosition;
var init_helpers = __esm(() => {
  (function(DocumentPosition) {
    DocumentPosition[DocumentPosition["DISCONNECTED"] = 1] = "DISCONNECTED";
    DocumentPosition[DocumentPosition["PRECEDING"] = 2] = "PRECEDING";
    DocumentPosition[DocumentPosition["FOLLOWING"] = 4] = "FOLLOWING";
    DocumentPosition[DocumentPosition["CONTAINS"] = 8] = "CONTAINS";
    DocumentPosition[DocumentPosition["CONTAINED_BY"] = 16] = "CONTAINED_BY";
  })(DocumentPosition || (DocumentPosition = {}));
});

// /zveltio-extension/node_modules/domutils/dist/traversal.js
var init_traversal = () => {};

// /zveltio-extension/node_modules/domutils/dist/index.js
var init_dist2 = __esm(() => {
  init_feeds();
  init_helpers();
  init_legacy();
  init_querying();
  init_stringify();
  init_traversal();
});

// /zveltio-extension/node_modules/htmlparser2/dist/index.js
var init_dist3 = __esm(() => {
  init_Parser();
  init_dist();
  init_dist2();
});

// /zveltio-extension/node_modules/escape-string-regexp/index.js
var require_escape_string_regexp = __commonJS(function(exports, module) {
  module.exports = (string) => {
    if (typeof string !== "string") {
      throw new TypeError("Expected a string");
    }
    return string.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&").replace(/-/g, "\\x2d");
  };
});

// /zveltio-extension/node_modules/is-plain-object/dist/is-plain-object.mjs
function isObject(o) {
  return Object.prototype.toString.call(o) === "[object Object]";
}
function isPlainObject(o) {
  var ctor, prot;
  if (isObject(o) === false)
    return false;
  ctor = o.constructor;
  if (ctor === undefined)
    return true;
  prot = ctor.prototype;
  if (isObject(prot) === false)
    return false;
  if (prot.hasOwnProperty("isPrototypeOf") === false) {
    return false;
  }
  return true;
}
var init_is_plain_object = __esm(() => {
  /*!
   * is-plain-object <https://github.com/jonschlinkert/is-plain-object>
   *
   * Copyright (c) 2014-2017, Jon Schlinkert.
   * Released under the MIT License.
   */
});

// /zveltio-extension/node_modules/parse-srcset/src/parse-srcset.js
var require_parse_srcset = __commonJS(function(exports, module) {
  (function(root, factory) {
    if (typeof define === "function" && define.amd) {
      define([], factory);
    } else if (typeof module === "object" && module.exports) {
      module.exports = factory();
    } else {
      root.parseSrcset = factory();
    }
  })(exports, function() {
    return function(input) {
      function isSpace(c) {
        return c === " " || c === "\t" || c === `
` || c === "\f" || c === "\r";
      }
      function collectCharacters(regEx) {
        var chars, match = regEx.exec(input.substring(pos));
        if (match) {
          chars = match[0];
          pos += chars.length;
          return chars;
        }
      }
      var inputLength = input.length, regexLeadingSpaces = /^[ \t\n\r\u000c]+/, regexLeadingCommasOrSpaces = /^[, \t\n\r\u000c]+/, regexLeadingNotSpaces = /^[^ \t\n\r\u000c]+/, regexTrailingCommas = /[,]+$/, regexNonNegativeInteger = /^\d+$/, regexFloatingPoint = /^-?(?:[0-9]+|[0-9]*\.[0-9]+)(?:[eE][+-]?[0-9]+)?$/, url, descriptors, currentDescriptor, state, c, pos = 0, candidates = [];
      while (true) {
        collectCharacters(regexLeadingCommasOrSpaces);
        if (pos >= inputLength) {
          return candidates;
        }
        url = collectCharacters(regexLeadingNotSpaces);
        descriptors = [];
        if (url.slice(-1) === ",") {
          url = url.replace(regexTrailingCommas, "");
          parseDescriptors();
        } else {
          tokenize();
        }
      }
      function tokenize() {
        collectCharacters(regexLeadingSpaces);
        currentDescriptor = "";
        state = "in descriptor";
        while (true) {
          c = input.charAt(pos);
          if (state === "in descriptor") {
            if (isSpace(c)) {
              if (currentDescriptor) {
                descriptors.push(currentDescriptor);
                currentDescriptor = "";
                state = "after descriptor";
              }
            } else if (c === ",") {
              pos += 1;
              if (currentDescriptor) {
                descriptors.push(currentDescriptor);
              }
              parseDescriptors();
              return;
            } else if (c === "(") {
              currentDescriptor = currentDescriptor + c;
              state = "in parens";
            } else if (c === "") {
              if (currentDescriptor) {
                descriptors.push(currentDescriptor);
              }
              parseDescriptors();
              return;
            } else {
              currentDescriptor = currentDescriptor + c;
            }
          } else if (state === "in parens") {
            if (c === ")") {
              currentDescriptor = currentDescriptor + c;
              state = "in descriptor";
            } else if (c === "") {
              descriptors.push(currentDescriptor);
              parseDescriptors();
              return;
            } else {
              currentDescriptor = currentDescriptor + c;
            }
          } else if (state === "after descriptor") {
            if (isSpace(c)) {} else if (c === "") {
              parseDescriptors();
              return;
            } else {
              state = "in descriptor";
              pos -= 1;
            }
          }
          pos += 1;
        }
      }
      function parseDescriptors() {
        var pError = false, w, d, h, i, candidate = {}, desc, lastChar, value, intVal, floatVal;
        for (i = 0;i < descriptors.length; i++) {
          desc = descriptors[i];
          lastChar = desc[desc.length - 1];
          value = desc.substring(0, desc.length - 1);
          intVal = parseInt(value, 10);
          floatVal = parseFloat(value);
          if (regexNonNegativeInteger.test(value) && lastChar === "w") {
            if (w || d) {
              pError = true;
            }
            if (intVal === 0) {
              pError = true;
            } else {
              w = intVal;
            }
          } else if (regexFloatingPoint.test(value) && lastChar === "x") {
            if (w || d || h) {
              pError = true;
            }
            if (floatVal < 0) {
              pError = true;
            } else {
              d = floatVal;
            }
          } else if (regexNonNegativeInteger.test(value) && lastChar === "h") {
            if (h || d) {
              pError = true;
            }
            if (intVal === 0) {
              pError = true;
            } else {
              h = intVal;
            }
          } else {
            pError = true;
          }
        }
        if (!pError) {
          candidate.url = url;
          if (w) {
            candidate.w = w;
          }
          if (d) {
            candidate.d = d;
          }
          if (h) {
            candidate.h = h;
          }
          candidates.push(candidate);
        } else if (console && console.log) {
          console.log("Invalid srcset descriptor found in '" + input + "' at '" + desc + "'.");
        }
      }
    };
  });
});

// /zveltio-extension/node_modules/picocolors/picocolors.browser.js
var require_picocolors_browser = __commonJS(function(exports, module) {
  var x = String;
  var create = function() {
    return { isColorSupported: false, reset: x, bold: x, dim: x, italic: x, underline: x, inverse: x, hidden: x, strikethrough: x, black: x, red: x, green: x, yellow: x, blue: x, magenta: x, cyan: x, white: x, gray: x, bgBlack: x, bgRed: x, bgGreen: x, bgYellow: x, bgBlue: x, bgMagenta: x, bgCyan: x, bgWhite: x, blackBright: x, redBright: x, greenBright: x, yellowBright: x, blueBright: x, magentaBright: x, cyanBright: x, whiteBright: x, bgBlackBright: x, bgRedBright: x, bgGreenBright: x, bgYellowBright: x, bgBlueBright: x, bgMagentaBright: x, bgCyanBright: x, bgWhiteBright: x };
  };
  module.exports = create();
  module.exports.createColors = create;
});

// /zveltio-extension/node_modules/postcss/lib/css-syntax-error.js
var require_css_syntax_error = __commonJS(function(exports, module) {
  var pico = require_picocolors_browser();
  var terminalHighlight = (() => ({}));

  class CssSyntaxError extends Error {
    constructor(message, line, column, source, file, plugin) {
      super(message);
      this.name = "CssSyntaxError";
      this.reason = message;
      if (file) {
        this.file = file;
      }
      if (source) {
        this.source = source;
      }
      if (plugin) {
        this.plugin = plugin;
      }
      if (typeof line !== "undefined" && typeof column !== "undefined") {
        if (typeof line === "number") {
          this.line = line;
          this.column = column;
        } else {
          this.line = line.line;
          this.column = line.column;
          this.endLine = column.line;
          this.endColumn = column.column;
        }
      }
      this.setMessage();
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, CssSyntaxError);
      }
    }
    setMessage() {
      this.message = this.plugin ? this.plugin + ": " : "";
      this.message += this.file ? this.file : "<css input>";
      if (typeof this.line !== "undefined") {
        this.message += ":" + this.line + ":" + this.column;
      }
      this.message += ": " + this.reason;
    }
    showSourceCode(color) {
      if (!this.source)
        return "";
      let css = this.source;
      if (color == null)
        color = pico.isColorSupported;
      let aside = (text) => text;
      let mark = (text) => text;
      let highlight = (text) => text;
      if (color) {
        let { bold, gray, red } = pico.createColors(true);
        mark = (text) => bold(red(text));
        aside = (text) => gray(text);
        if (terminalHighlight) {
          highlight = (text) => terminalHighlight(text);
        }
      }
      let lines = css.split(/\r?\n/);
      let start = Math.max(this.line - 3, 0);
      let end = Math.min(this.line + 2, lines.length);
      let maxWidth = String(end).length;
      return lines.slice(start, end).map((line, index) => {
        let number = start + 1 + index;
        let gutter = " " + (" " + number).slice(-maxWidth) + " | ";
        if (number === this.line) {
          if (line.length > 160) {
            let padding = 20;
            let subLineStart = Math.max(0, this.column - padding);
            let subLineEnd = Math.max(this.column + padding, this.endColumn + padding);
            let subLine = line.slice(subLineStart, subLineEnd);
            let spacing = aside(gutter.replace(/\d/g, " ")) + line.slice(0, Math.min(this.column - 1, padding - 1)).replace(/[^\t]/g, " ");
            return mark(">") + aside(gutter) + highlight(subLine) + `
 ` + spacing + mark("^");
          }
          let spacing = aside(gutter.replace(/\d/g, " ")) + line.slice(0, this.column - 1).replace(/[^\t]/g, " ");
          return mark(">") + aside(gutter) + highlight(line) + `
 ` + spacing + mark("^");
        }
        return " " + aside(gutter) + highlight(line);
      }).join(`
`);
    }
    toString() {
      let code = this.showSourceCode();
      if (code) {
        code = `

` + code + `
`;
      }
      return this.name + ": " + this.message + code;
    }
  }
  module.exports = CssSyntaxError;
  CssSyntaxError.default = CssSyntaxError;
});

// /zveltio-extension/node_modules/postcss/lib/stringifier.js
var require_stringifier = __commonJS(function(exports, module) {
  var AT_NAME_END = /[\t\n\f\r "#'()/;[\\\]{}]/;
  var DEFAULT_RAW = {
    after: `
`,
    beforeClose: `
`,
    beforeComment: `
`,
    beforeDecl: `
`,
    beforeOpen: " ",
    beforeRule: `
`,
    colon: ": ",
    commentLeft: " ",
    commentRight: " ",
    emptyBody: "",
    indent: "    ",
    semicolon: false
  };
  function capitalize(str) {
    return str[0].toUpperCase() + str.slice(1);
  }
  function atruleStart(str, node) {
    let name = "@" + node.name;
    let params = node.params ? str.rawValue(node, "params") : "";
    let afterName = node.raws.afterName;
    if (typeof afterName === "undefined") {
      afterName = params ? " " : "";
    } else if (afterName === "" && params && !AT_NAME_END.test(params[0])) {
      afterName = " ";
    }
    return name + afterName + params;
  }
  function isCustomProperty(node) {
    if (!node.prop.startsWith("--"))
      return false;
    let before = node.raws.before;
    return typeof before === "undefined" || !/[^\s;]$/.test(before);
  }
  function pushBody(str, stack, node) {
    let nodes = node.nodes;
    let last = nodes.length - 1;
    while (last > 0) {
      if (nodes[last].type !== "comment")
        break;
      last -= 1;
    }
    let semicolon = str.raw(node, "semicolon");
    let isDocument = node.type === "document";
    for (let i = nodes.length - 1;i >= 0; i--) {
      let child = nodes[i];
      let childSemicolon = last !== i || semicolon;
      if (!childSemicolon && i < nodes.length - 1 && (child.type === "atrule" && !child.nodes || child.type === "decl" && isCustomProperty(child))) {
        childSemicolon = true;
      }
      stack.push({
        document: isDocument,
        node: child,
        semicolon: childSemicolon
      });
    }
  }
  function pushBlock(str, stack, node, start) {
    let between = str.raw(node, "between", "beforeOpen");
    str.builder(start + between + "{", node, "start");
    let hasNodes = node.nodes && node.nodes.length;
    let close = () => {
      let after = hasNodes ? str.raw(node, "after") : str.raw(node, "after", "emptyBody");
      if (after)
        str.builder(after);
      str.builder("}", node, "end");
      if (node.type === "rule" && node.raws.ownSemicolon) {
        str.builder(node.raws.ownSemicolon, node, "end");
      }
    };
    if (hasNodes) {
      stack.push(close);
      pushBody(str, stack, node);
    } else {
      close();
    }
  }

  class Stringifier {
    constructor(builder) {
      this.builder = builder;
    }
    atrule(node, semicolon) {
      let start = atruleStart(this, node);
      if (node.nodes) {
        this.block(node, start);
      } else {
        let end = (node.raws.between || "") + (semicolon ? ";" : "");
        this.builder(start + end, node);
      }
    }
    beforeAfter(node, detect) {
      let value;
      if (node.type === "decl") {
        value = this.raw(node, null, "beforeDecl");
      } else if (node.type === "comment") {
        value = this.raw(node, null, "beforeComment");
      } else if (detect === "before") {
        value = this.raw(node, null, "beforeRule");
      } else {
        value = this.raw(node, null, "beforeClose");
      }
      let buf = node.parent;
      let depth = 0;
      while (buf && buf.type !== "root") {
        depth += 1;
        buf = buf.parent;
      }
      if (value.includes(`
`)) {
        let indent = this.raw(node, null, "indent");
        if (indent.length) {
          for (let step = 0;step < depth; step++)
            value += indent;
        }
      }
      return value;
    }
    block(node, start) {
      let between = this.raw(node, "between", "beforeOpen");
      this.builder(start + between + "{", node, "start");
      let after;
      if (node.nodes && node.nodes.length) {
        this.body(node);
        after = this.raw(node, "after");
      } else {
        after = this.raw(node, "after", "emptyBody");
      }
      if (after)
        this.builder(after);
      this.builder("}", node, "end");
    }
    body(node) {
      let proto = Stringifier.prototype;
      let expandable = ["atrule", "block", "body", "rule", "stringify"].every((method) => this[method] === proto[method]);
      let stack = [];
      pushBody(this, stack, node);
      while (stack.length > 0) {
        let entry = stack.pop();
        if (typeof entry === "function") {
          entry();
          continue;
        }
        let child = entry.node;
        let before = this.raw(child, "before");
        if (before) {
          this.builder(before);
        }
        if (expandable && child.type === "rule") {
          pushBlock(this, stack, child, this.rawValue(child, "selector"));
        } else if (expandable && child.type === "atrule" && child.nodes) {
          pushBlock(this, stack, child, atruleStart(this, child));
        } else {
          this.stringify(child, entry.semicolon);
        }
      }
    }
    comment(node) {
      let left = this.raw(node, "left", "commentLeft");
      let right = this.raw(node, "right", "commentRight");
      this.builder("/*" + left + node.text + right + "*/", node);
    }
    decl(node, semicolon) {
      let raws = node.raws;
      let between = this.raw(node, "between", "colon");
      let string = node.prop + between + this.rawValue(node, "value");
      if (node.important) {
        string += raws.important || " !important";
      }
      if (semicolon)
        string += ";";
      this.builder(string, node);
    }
    document(node) {
      this.body(node);
    }
    raw(node, own, detect) {
      let value;
      if (!detect)
        detect = own;
      if (own) {
        value = node.raws[own];
        if (typeof value !== "undefined")
          return value;
      }
      let parent = node.parent;
      if (detect === "before") {
        if (!parent || parent.type === "root" && parent.first === node) {
          return "";
        }
        if (parent && parent.type === "document") {
          return "";
        }
      }
      if (!parent)
        return DEFAULT_RAW[detect];
      let root = node.root();
      let cache = root.rawCache || (root.rawCache = {});
      if (typeof cache[detect] !== "undefined") {
        return cache[detect];
      }
      if (detect === "before" || detect === "after") {
        return this.beforeAfter(node, detect);
      } else {
        let method = "raw" + capitalize(detect);
        if (this[method]) {
          value = this[method](root, node);
        } else {
          root.walk((i) => {
            value = i.raws[own];
            if (typeof value !== "undefined")
              return false;
          });
        }
      }
      if (typeof value === "undefined")
        value = DEFAULT_RAW[detect];
      cache[detect] = value;
      return value;
    }
    rawBeforeClose(root) {
      let value;
      root.walk((i) => {
        if (i.nodes && i.nodes.length > 0) {
          if (typeof i.raws.after !== "undefined") {
            value = i.raws.after;
            if (value.includes(`
`)) {
              value = value.replace(/[^\n]+$/, "");
            }
            return false;
          }
        }
      });
      if (value)
        value = value.replace(/\S/g, "");
      return value;
    }
    rawBeforeComment(root, node) {
      let value;
      root.walkComments((i) => {
        if (typeof i.raws.before !== "undefined") {
          value = i.raws.before;
          if (value.includes(`
`)) {
            value = value.replace(/[^\n]+$/, "");
          }
          return false;
        }
      });
      if (typeof value === "undefined") {
        value = this.raw(node, null, "beforeDecl");
      } else if (value) {
        value = value.replace(/\S/g, "");
      }
      return value;
    }
    rawBeforeDecl(root, node) {
      let value;
      root.walkDecls((i) => {
        if (typeof i.raws.before !== "undefined") {
          value = i.raws.before;
          if (value.includes(`
`)) {
            value = value.replace(/[^\n]+$/, "");
          }
          return false;
        }
      });
      if (typeof value === "undefined") {
        value = this.raw(node, null, "beforeRule");
      } else if (value) {
        value = value.replace(/\S/g, "");
      }
      return value;
    }
    rawBeforeOpen(root) {
      let value;
      root.walk((i) => {
        if (i.type !== "decl") {
          value = i.raws.between;
          if (typeof value !== "undefined")
            return false;
        }
      });
      return value;
    }
    rawBeforeRule(root) {
      let value;
      root.walk((i) => {
        if (i.nodes && (i.parent !== root || root.first !== i)) {
          if (typeof i.raws.before !== "undefined") {
            value = i.raws.before;
            if (value.includes(`
`)) {
              value = value.replace(/[^\n]+$/, "");
            }
            return false;
          }
        }
      });
      if (value)
        value = value.replace(/\S/g, "");
      return value;
    }
    rawColon(root) {
      let value;
      root.walkDecls((i) => {
        if (typeof i.raws.between !== "undefined") {
          value = i.raws.between.replace(/[^\s:]/g, "");
          return false;
        }
      });
      return value;
    }
    rawEmptyBody(root) {
      let value;
      root.walk((i) => {
        if (i.nodes && i.nodes.length === 0) {
          value = i.raws.after;
          if (typeof value !== "undefined")
            return false;
        }
      });
      return value;
    }
    rawIndent(root) {
      if (root.raws.indent)
        return root.raws.indent;
      let value;
      root.walk((i) => {
        let p = i.parent;
        if (p && p !== root && p.parent && p.parent === root) {
          if (typeof i.raws.before !== "undefined") {
            let parts = i.raws.before.split(`
`);
            value = parts[parts.length - 1];
            value = value.replace(/\S/g, "");
            return false;
          }
        }
      });
      return value;
    }
    rawSemicolon(root) {
      let value;
      root.walk((i) => {
        if (i.nodes && i.nodes.length && i.last.type === "decl") {
          value = i.raws.semicolon;
          if (typeof value !== "undefined")
            return false;
        }
      });
      return value;
    }
    rawValue(node, prop) {
      let value = node[prop];
      let raw = node.raws[prop];
      if (raw && raw.value === value) {
        return raw.raw;
      }
      return value;
    }
    root(node) {
      let inDocument = node.parent && node.parent.type === "document";
      if (!inDocument && node.source && node.source.input.hasBOM) {
        this.builder("\uFEFF", node, "start");
      }
      this.body(node);
      if (node.raws.after) {
        this.builder(node.raws.after);
      }
    }
    rule(node) {
      this.block(node, this.rawValue(node, "selector"));
      if (node.raws.ownSemicolon) {
        this.builder(node.raws.ownSemicolon, node, "end");
      }
    }
    stringify(node, semicolon) {
      if (!this[node.type]) {
        throw new Error("Unknown AST node type " + node.type + ". " + "Maybe you need to change PostCSS stringifier.");
      }
      this[node.type](node, semicolon);
    }
  }
  module.exports = Stringifier;
  Stringifier.default = Stringifier;
});

// /zveltio-extension/node_modules/postcss/lib/stringify.js
var require_stringify = __commonJS(function(exports, module) {
  var Stringifier = require_stringifier();
  var STYLE_TAG = /(<)(\/?style\b)/gi;
  var COMMENT_OPEN = /(<)(!--)/g;
  function escapeHTMLInCSS(str) {
    if (!str.includes("<"))
      return str;
    return str.replace(STYLE_TAG, "\\3c $2").replace(COMMENT_OPEN, "\\3c $2");
  }
  function cutEscaped(chunks, css, escaped) {
    let parts = [];
    let at = 0;
    let into = 0;
    for (let i = 0;i < chunks.length; i += 3) {
      let from = into;
      let end = at + chunks[i].length;
      while (at < end) {
        if (css[at] === escaped[into]) {
          at += 1;
          into += 1;
        } else {
          at += 1;
          into += 4;
        }
      }
      parts.push(escaped.slice(from, into));
    }
    return parts;
  }

  class SafeStringifier extends Stringifier {
    escapeHTML(print) {
      let builder = this.builder;
      let chunks, css;
      this.builder = (str, child, type) => {
        if (chunks) {
          css += str;
          chunks.push(str, child, type);
        } else if (str.includes("<")) {
          css = str;
          chunks = [str, child, type];
        } else {
          builder(str, child, type);
        }
      };
      print();
      this.builder = builder;
      if (!chunks)
        return;
      let escaped = escapeHTMLInCSS(css);
      if (escaped === css) {
        for (let i = 0;i < chunks.length; i += 3) {
          builder(chunks[i], chunks[i + 1], chunks[i + 2]);
        }
      } else {
        let parts = cutEscaped(chunks, css, escaped);
        for (let i = 0;i < chunks.length; i += 3) {
          builder(parts[i / 3], chunks[i + 1], chunks[i + 2]);
        }
      }
    }
    root(node) {
      if (node.parent && node.parent.type === "document") {
        this.escapeHTML(() => this.body(node));
        if (node.raws.after)
          this.builder(node.raws.after);
      } else {
        this.escapeHTML(() => super.root(node));
      }
    }
  }
  function stringify(node, builder) {
    let str = new SafeStringifier(builder);
    if (node.type === "root" || node.type === "document") {
      str.stringify(node);
    } else {
      str.escapeHTML(() => str.stringify(node));
    }
  }
  module.exports = stringify;
  stringify.default = stringify;
});

// /zveltio-extension/node_modules/postcss/lib/symbols.js
var require_symbols = __commonJS(function(exports, module) {
  exports.isClean = Symbol("isClean");
  exports.my = Symbol("my");
});

// /zveltio-extension/node_modules/postcss/lib/node.js
var require_node = __commonJS(function(exports, module) {
  var CssSyntaxError = require_css_syntax_error();
  var Stringifier = require_stringifier();
  var stringify = require_stringify();
  var { isClean, my } = require_symbols();
  function cloneNode(obj, parent) {
    let cloned = new obj.constructor;
    let stack = [[obj, cloned, parent]];
    while (stack.length > 0) {
      let [source, target, targetParent] = stack.pop();
      for (let i in source) {
        if (!Object.prototype.hasOwnProperty.call(source, i)) {
          continue;
        }
        if (i === "proxyCache")
          continue;
        let value = source[i];
        let type = typeof value;
        if (i === "parent" && type === "object") {
          if (targetParent)
            target[i] = targetParent;
        } else if (i === "source") {
          target[i] = value;
        } else if (Array.isArray(value)) {
          let children = [];
          target[i] = children;
          for (let j of value) {
            let childClone = new j.constructor;
            children.push(childClone);
            stack.push([j, childClone, target]);
          }
        } else {
          if (type === "object" && value !== null) {
            let valueClone = new value.constructor;
            stack.push([value, valueClone, undefined]);
            value = valueClone;
          }
          target[i] = value;
        }
      }
    }
    return cloned;
  }
  function sourceOffset(inputCSS, position) {
    if (position && typeof position.offset !== "undefined") {
      return position.offset;
    }
    let column = 1;
    let line = 1;
    let offset = 0;
    for (let i = 0;i < inputCSS.length; i++) {
      if (line === position.line && column === position.column) {
        offset = i;
        break;
      }
      if (inputCSS[i] === `
`) {
        column = 1;
        line += 1;
      } else {
        column += 1;
      }
    }
    return offset;
  }

  class Node {
    get proxyOf() {
      return this;
    }
    constructor(defaults = {}) {
      this.raws = {};
      this[isClean] = false;
      this[my] = true;
      for (let name of Object.keys(defaults)) {
        if (name === "__proto__")
          continue;
        if (name === "nodes") {
          this.nodes = [];
          for (let node of defaults[name]) {
            if (typeof node.clone === "function" && node.parent) {
              this.append(node.clone());
            } else {
              this.append(node);
            }
          }
        } else {
          this[name] = defaults[name];
        }
      }
    }
    addToError(error) {
      error.postcssNode = this;
      if (error.stack && this.source && /\n\s{4}at /.test(error.stack)) {
        let s = this.source;
        error.stack = error.stack.replace(/\n\s{4}at /, `$&${s.input.from}:${s.start.line}:${s.start.column}$&`);
      }
      return error;
    }
    after(add) {
      this.parent.insertAfter(this, add);
      return this;
    }
    assign(overrides = {}) {
      for (let name in overrides) {
        this[name] = overrides[name];
      }
      return this;
    }
    before(add) {
      this.parent.insertBefore(this, add);
      return this;
    }
    cleanRaws(keepBetween) {
      delete this.raws.before;
      delete this.raws.after;
      if (!keepBetween)
        delete this.raws.between;
    }
    clone(overrides = {}) {
      let cloned = cloneNode(this);
      for (let name in overrides) {
        cloned[name] = overrides[name];
      }
      return cloned;
    }
    cloneAfter(overrides = {}) {
      let cloned = this.clone(overrides);
      this.parent.insertAfter(this, cloned);
      return cloned;
    }
    cloneBefore(overrides = {}) {
      let cloned = this.clone(overrides);
      this.parent.insertBefore(this, cloned);
      return cloned;
    }
    error(message, opts = {}) {
      if (this.source) {
        let { end, start } = this.rangeBy(opts);
        return this.source.input.error(message, { column: start.column, line: start.line }, { column: end.column, line: end.line }, opts);
      }
      return new CssSyntaxError(message);
    }
    getProxyProcessor() {
      return {
        get(node, prop) {
          if (prop === "proxyOf") {
            return node;
          } else if (prop === "root") {
            return () => node.root().toProxy();
          } else {
            return node[prop];
          }
        },
        set(node, prop, value) {
          if (node[prop] === value)
            return true;
          node[prop] = value;
          if (prop === "prop" || prop === "value" || prop === "name" || prop === "params" || prop === "important" || prop === "text") {
            node.markDirty();
          }
          return true;
        }
      };
    }
    markClean() {
      this[isClean] = true;
    }
    markDirty() {
      if (this[isClean]) {
        this[isClean] = false;
        let next = this;
        while (next = next.parent) {
          next[isClean] = false;
        }
      }
    }
    next() {
      if (!this.parent)
        return;
      let index = this.parent.index(this);
      return this.parent.nodes[index + 1];
    }
    positionBy(opts = {}) {
      let inputString = "document" in this.source.input ? this.source.input.document : this.source.input.css;
      let pos = {
        column: this.source.start.column,
        line: this.source.start.line,
        offset: sourceOffset(inputString, this.source.start)
      };
      if (opts.index) {
        pos = this.positionInside(opts.index);
      } else if (opts.word) {
        let stringRepresentation = inputString.slice(sourceOffset(inputString, this.source.start), this.rangeBy().end.offset);
        let index = stringRepresentation.indexOf(opts.word);
        if (index !== -1)
          pos = this.positionInside(index);
      }
      return pos;
    }
    positionInside(index) {
      let column = this.source.start.column;
      let line = this.source.start.line;
      let inputString = "document" in this.source.input ? this.source.input.document : this.source.input.css;
      let offset = sourceOffset(inputString, this.source.start);
      let end = offset + index;
      for (let i = offset;i < end; i++) {
        if (inputString[i] === `
`) {
          column = 1;
          line += 1;
        } else {
          column += 1;
        }
      }
      return { column, line, offset: end };
    }
    prev() {
      if (!this.parent)
        return;
      let index = this.parent.index(this);
      return this.parent.nodes[index - 1];
    }
    rangeBy(opts = {}) {
      let inputString = "document" in this.source.input ? this.source.input.document : this.source.input.css;
      let start = {
        column: this.source.start.column,
        line: this.source.start.line,
        offset: sourceOffset(inputString, this.source.start)
      };
      let end = this.source.end ? {
        column: this.source.end.column + 1,
        line: this.source.end.line,
        offset: typeof this.source.end.offset === "number" ? this.source.end.offset : sourceOffset(inputString, this.source.end) + 1
      } : {
        column: start.column + 1,
        line: start.line,
        offset: start.offset + 1
      };
      if (opts.word) {
        let stringRepresentation = inputString.slice(sourceOffset(inputString, this.source.start), end.offset);
        let index = stringRepresentation.indexOf(opts.word);
        if (index !== -1) {
          start = this.positionInside(index);
          end = this.positionInside(index + opts.word.length);
        }
      } else {
        if (opts.start) {
          start = {
            column: opts.start.column,
            line: opts.start.line,
            offset: sourceOffset(inputString, opts.start)
          };
        } else if (typeof opts.index === "number") {
          start = this.positionInside(opts.index);
        }
        if (opts.end) {
          end = {
            column: opts.end.column,
            line: opts.end.line,
            offset: sourceOffset(inputString, opts.end)
          };
        } else if (typeof opts.endIndex === "number") {
          end = this.positionInside(opts.endIndex);
        } else if (typeof opts.index === "number") {
          end = this.positionInside(opts.index + 1);
        }
      }
      if (end.line < start.line || end.line === start.line && end.column <= start.column) {
        end = {
          column: start.column + 1,
          line: start.line,
          offset: start.offset + 1
        };
      }
      return { end, start };
    }
    raw(prop, defaultType) {
      let str = new Stringifier;
      return str.raw(this, prop, defaultType);
    }
    remove() {
      if (this.parent) {
        this.parent.removeChild(this);
      }
      this.parent = undefined;
      return this;
    }
    replaceWith(...nodes) {
      if (this.parent) {
        let bookmark = this;
        let foundSelf = false;
        for (let node of nodes) {
          if (node === this) {
            foundSelf = true;
          } else if (foundSelf) {
            this.parent.insertAfter(bookmark, node);
            bookmark = node;
          } else {
            this.parent.insertBefore(bookmark, node);
          }
        }
        if (!foundSelf) {
          this.remove();
        }
      }
      return this;
    }
    root() {
      let result = this;
      while (result.parent && result.parent.type !== "document") {
        result = result.parent;
      }
      return result;
    }
    toJSON(_, inputs) {
      let emitInputs = inputs == null;
      inputs = inputs || new Map;
      let holderOfRoot = [];
      let queue = [[this, holderOfRoot, 0]];
      for (let step = 0;step < queue.length; step++) {
        let [node, holder, key] = queue[step];
        let fixed = {};
        holder[key] = fixed;
        for (let name in node) {
          if (!Object.prototype.hasOwnProperty.call(node, name)) {
            continue;
          }
          if (name === "parent" || name === "proxyCache")
            continue;
          let value = node[name];
          if (Array.isArray(value)) {
            let fixedArray = [];
            fixed[name] = fixedArray;
            for (let i = 0;i < value.length; i++) {
              let item = value[i];
              if (typeof item === "object" && item.toJSON) {
                if (item.toJSON === Node.prototype.toJSON) {
                  queue.push([item, fixedArray, i]);
                } else {
                  fixedArray[i] = item.toJSON(null, inputs);
                }
              } else {
                fixedArray[i] = item;
              }
            }
          } else if (typeof value === "object" && value.toJSON) {
            if (value.toJSON === Node.prototype.toJSON) {
              queue.push([value, fixed, name]);
            } else {
              fixed[name] = value.toJSON(null, inputs);
            }
          } else if (name === "source") {
            if (value == null)
              continue;
            let inputId = inputs.get(value.input);
            if (inputId == null) {
              inputId = inputs.size;
              inputs.set(value.input, inputId);
            }
            fixed[name] = {
              end: value.end,
              inputId,
              start: value.start
            };
          } else {
            fixed[name] = value;
          }
        }
      }
      let fixed = holderOfRoot[0];
      if (emitInputs) {
        fixed.inputs = [...inputs.keys()].map((input) => input.toJSON());
      }
      return fixed;
    }
    toProxy() {
      if (!this.proxyCache) {
        this.proxyCache = new Proxy(this, this.getProxyProcessor());
      }
      return this.proxyCache;
    }
    toString(stringifier = stringify) {
      if (stringifier.stringify)
        stringifier = stringifier.stringify;
      let result = "";
      stringifier(this, (i) => {
        result += i;
      });
      return result;
    }
    warn(result, text, opts = {}) {
      let data = { node: this };
      for (let i in opts)
        data[i] = opts[i];
      return result.warn(text, data);
    }
  }
  module.exports = Node;
  Node.default = Node;
});

// /zveltio-extension/node_modules/postcss/lib/comment.js
var require_comment = __commonJS(function(exports, module) {
  var Node = require_node();

  class Comment extends Node {
    constructor(defaults) {
      super(defaults);
      this.type = "comment";
    }
  }
  module.exports = Comment;
  Comment.default = Comment;
});

// /zveltio-extension/node_modules/postcss/lib/declaration.js
var require_declaration = __commonJS(function(exports, module) {
  var Node = require_node();

  class Declaration extends Node {
    get variable() {
      return this.prop.startsWith("--") || this.prop[0] === "$";
    }
    constructor(defaults) {
      if (defaults && typeof defaults.value !== "undefined" && typeof defaults.value !== "string") {
        defaults = { ...defaults, value: String(defaults.value) };
      }
      super(defaults);
      this.type = "decl";
    }
  }
  module.exports = Declaration;
  Declaration.default = Declaration;
});

// /zveltio-extension/node_modules/postcss/lib/container.js
var require_container = __commonJS(function(exports, module) {
  var Comment = require_comment();
  var Declaration = require_declaration();
  var Node = require_node();
  var { isClean, my } = require_symbols();
  var AtRule;
  var parse;
  var Root;
  var Rule;
  function cleanSource(nodes) {
    let stack = nodes.slice();
    while (stack.length > 0) {
      let node = stack.pop();
      delete node.source;
      if (node.nodes) {
        node.nodes = node.nodes.slice();
        for (let i of node.nodes)
          stack.push(i);
      }
    }
    return nodes.slice();
  }
  function markTreeDirty(node) {
    let stack = [node];
    while (stack.length > 0) {
      let next = stack.pop();
      next[isClean] = false;
      if (next.proxyOf.nodes) {
        for (let i of next.proxyOf.nodes)
          stack.push(i);
      }
    }
  }

  class Container extends Node {
    get first() {
      if (!this.proxyOf.nodes)
        return;
      return this.proxyOf.nodes[0];
    }
    get last() {
      if (!this.proxyOf.nodes)
        return;
      return this.proxyOf.nodes[this.proxyOf.nodes.length - 1];
    }
    append(...children) {
      for (let child of children) {
        let nodes = this.normalize(child, this.last);
        for (let node of nodes)
          this.proxyOf.nodes.push(node);
      }
      this.markDirty();
      return this;
    }
    cleanRaws(keepBetween) {
      let stack = [this];
      while (stack.length > 0) {
        let node = stack.pop();
        if (node !== this && node.cleanRaws !== Container.prototype.cleanRaws) {
          node.cleanRaws(keepBetween);
          continue;
        }
        Node.prototype.cleanRaws.call(node, keepBetween);
        if (node.nodes) {
          for (let child of node.nodes)
            stack.push(child);
        }
      }
    }
    each(callback) {
      if (!this.proxyOf.nodes)
        return;
      let iterator = this.getIterator();
      let index, result;
      while (this.indexes[iterator] < this.proxyOf.nodes.length) {
        index = this.indexes[iterator];
        result = callback(this.proxyOf.nodes[index], index);
        if (result === false)
          break;
        this.indexes[iterator] += 1;
      }
      delete this.indexes[iterator];
      return result;
    }
    every(condition) {
      return this.nodes.every(condition);
    }
    getIterator() {
      if (!this.lastEach)
        this.lastEach = 0;
      if (!this.indexes)
        this.indexes = {};
      this.lastEach += 1;
      let iterator = this.lastEach;
      this.indexes[iterator] = 0;
      return iterator;
    }
    getProxyProcessor() {
      return {
        get(node, prop) {
          if (prop === "proxyOf") {
            return node;
          } else if (!node[prop]) {
            return node[prop];
          } else if (prop === "each" || typeof prop === "string" && prop.startsWith("walk")) {
            return (...args) => {
              return node[prop](...args.map((i) => {
                if (typeof i === "function") {
                  return (child, index) => i(child.toProxy(), index);
                } else {
                  return i;
                }
              }));
            };
          } else if (prop === "every" || prop === "some") {
            return (cb) => {
              return node[prop]((child, ...other) => cb(child.toProxy(), ...other));
            };
          } else if (prop === "root") {
            return () => node.root().toProxy();
          } else if (prop === "nodes") {
            return node.nodes.map((i) => i.toProxy());
          } else if (prop === "first" || prop === "last") {
            return node[prop].toProxy();
          } else {
            return node[prop];
          }
        },
        set(node, prop, value) {
          if (node[prop] === value)
            return true;
          node[prop] = value;
          if (prop === "name" || prop === "params" || prop === "selector") {
            node.markDirty();
          }
          return true;
        }
      };
    }
    index(child) {
      if (typeof child === "number")
        return child;
      if (child.proxyOf)
        child = child.proxyOf;
      return this.proxyOf.nodes.indexOf(child);
    }
    insertAfter(exist, add) {
      let existIndex = this.index(exist);
      let nodes = this.normalize(add, this.proxyOf.nodes[existIndex]).reverse();
      existIndex = this.index(exist);
      for (let node of nodes)
        this.proxyOf.nodes.splice(existIndex + 1, 0, node);
      let index;
      for (let id in this.indexes) {
        index = this.indexes[id];
        if (existIndex < index) {
          this.indexes[id] = index + nodes.length;
        }
      }
      this.markDirty();
      return this;
    }
    insertBefore(exist, add) {
      let existIndex = this.index(exist);
      let type = existIndex === 0 ? "prepend" : false;
      let nodes = this.normalize(add, this.proxyOf.nodes[existIndex], type).reverse();
      existIndex = this.index(exist);
      for (let node of nodes)
        this.proxyOf.nodes.splice(existIndex, 0, node);
      let index;
      for (let id in this.indexes) {
        index = this.indexes[id];
        if (existIndex <= index) {
          this.indexes[id] = index + nodes.length;
        }
      }
      this.markDirty();
      return this;
    }
    normalize(nodes, sample) {
      if (typeof nodes === "string") {
        nodes = cleanSource(parse(nodes).nodes);
      } else if (typeof nodes === "undefined") {
        nodes = [];
      } else if (Array.isArray(nodes)) {
        nodes = nodes.slice(0);
        for (let i of nodes) {
          if (i.parent)
            i.parent.removeChild(i, "ignore");
        }
      } else if (nodes.type === "root" && this.type !== "document") {
        nodes = nodes.nodes.slice(0);
        for (let i of nodes) {
          if (i.parent)
            i.parent.removeChild(i, "ignore");
        }
      } else if (nodes.type) {
        nodes = [nodes];
      } else if (nodes.prop) {
        if (typeof nodes.value === "undefined") {
          throw new Error("Value field is missed in node creation");
        } else if (typeof nodes.value !== "string") {
          nodes.value = String(nodes.value);
        }
        nodes = [new Declaration(nodes)];
      } else if (nodes.selector || nodes.selectors) {
        nodes = [new Rule(nodes)];
      } else if (nodes.name) {
        nodes = [new AtRule(nodes)];
      } else if (nodes.text) {
        nodes = [new Comment(nodes)];
      } else {
        throw new Error("Unknown node type in node creation");
      }
      let processed = nodes.map((i) => {
        if (!i[my])
          Container.rebuild(i);
        i = i.proxyOf;
        if (i.parent)
          i.parent.removeChild(i);
        if (i[isClean])
          markTreeDirty(i);
        if (!i.raws)
          i.raws = {};
        if (typeof i.raws.before === "undefined") {
          if (sample && typeof sample.raws.before !== "undefined") {
            i.raws.before = sample.raws.before.replace(/\S/g, "");
          }
        }
        i.parent = this.proxyOf;
        return i;
      });
      return processed;
    }
    prepend(...children) {
      children = children.reverse();
      for (let child of children) {
        let nodes = this.normalize(child, this.first, "prepend").reverse();
        for (let node of nodes)
          this.proxyOf.nodes.unshift(node);
        for (let id in this.indexes) {
          this.indexes[id] = this.indexes[id] + nodes.length;
        }
      }
      this.markDirty();
      return this;
    }
    push(child) {
      child.parent = this;
      this.proxyOf.nodes.push(child);
      return this;
    }
    removeAll() {
      for (let node of this.proxyOf.nodes)
        node.parent = undefined;
      this.proxyOf.nodes = [];
      this.markDirty();
      return this;
    }
    removeChild(child) {
      child = this.index(child);
      this.proxyOf.nodes[child].parent = undefined;
      this.proxyOf.nodes.splice(child, 1);
      let index;
      for (let id in this.indexes) {
        index = this.indexes[id];
        if (index >= child) {
          this.indexes[id] = index - 1;
        }
      }
      this.markDirty();
      return this;
    }
    replaceValues(pattern, opts, callback) {
      if (!callback) {
        callback = opts;
        opts = {};
      }
      this.walkDecls((decl) => {
        if (opts.props && !opts.props.includes(decl.prop))
          return;
        if (opts.fast && !decl.value.includes(opts.fast))
          return;
        decl.value = decl.value.replace(pattern, callback);
      });
      this.markDirty();
      return this;
    }
    some(condition) {
      return this.nodes.some(condition);
    }
    walk(callback) {
      if (!this.proxyOf.nodes)
        return;
      let stack = [{ iterator: this.getIterator(), node: this.proxyOf }];
      while (stack.length > 0) {
        let { iterator, node } = stack[stack.length - 1];
        let index = node.indexes[iterator];
        if (index >= node.proxyOf.nodes.length) {
          delete node.indexes[iterator];
          stack.pop();
          let parent = stack[stack.length - 1];
          if (parent)
            parent.node.indexes[parent.iterator] += 1;
          continue;
        }
        let child = node.proxyOf.nodes[index];
        let result;
        try {
          result = callback(child, index);
        } catch (e) {
          throw child.addToError(e);
        }
        if (result === false) {
          for (let opened of stack) {
            delete opened.node.indexes[opened.iterator];
          }
          return false;
        }
        if (child.walk && child.proxyOf.nodes) {
          stack.push({ iterator: child.getIterator(), node: child });
        } else {
          node.indexes[iterator] += 1;
        }
      }
      return;
    }
    walkAtRules(name, callback) {
      if (!callback) {
        callback = name;
        return this.walk((child, i) => {
          if (child.type === "atrule") {
            return callback(child, i);
          }
        });
      }
      if (name instanceof RegExp) {
        return this.walk((child, i) => {
          if (child.type === "atrule" && name.test(child.name)) {
            return callback(child, i);
          }
        });
      }
      return this.walk((child, i) => {
        if (child.type === "atrule" && child.name === name) {
          return callback(child, i);
        }
      });
    }
    walkComments(callback) {
      return this.walk((child, i) => {
        if (child.type === "comment") {
          return callback(child, i);
        }
      });
    }
    walkDecls(prop, callback) {
      if (!callback) {
        callback = prop;
        return this.walk((child, i) => {
          if (child.type === "decl") {
            return callback(child, i);
          }
        });
      }
      if (prop instanceof RegExp) {
        return this.walk((child, i) => {
          if (child.type === "decl" && prop.test(child.prop)) {
            return callback(child, i);
          }
        });
      }
      return this.walk((child, i) => {
        if (child.type === "decl" && child.prop === prop) {
          return callback(child, i);
        }
      });
    }
    walkRules(selector, callback) {
      if (!callback) {
        callback = selector;
        return this.walk((child, i) => {
          if (child.type === "rule") {
            return callback(child, i);
          }
        });
      }
      if (selector instanceof RegExp) {
        return this.walk((child, i) => {
          if (child.type === "rule" && selector.test(child.selector)) {
            return callback(child, i);
          }
        });
      }
      return this.walk((child, i) => {
        if (child.type === "rule" && child.selector === selector) {
          return callback(child, i);
        }
      });
    }
  }
  Container.registerParse = (dependant) => {
    parse = dependant;
  };
  Container.registerRule = (dependant) => {
    Rule = dependant;
  };
  Container.registerAtRule = (dependant) => {
    AtRule = dependant;
  };
  Container.registerRoot = (dependant) => {
    Root = dependant;
  };
  module.exports = Container;
  Container.default = Container;
  Container.rebuild = (node) => {
    let stack = [node];
    while (stack.length > 0) {
      let next = stack.pop();
      if (next.type === "atrule") {
        Object.setPrototypeOf(next, AtRule.prototype);
      } else if (next.type === "rule") {
        Object.setPrototypeOf(next, Rule.prototype);
      } else if (next.type === "decl") {
        Object.setPrototypeOf(next, Declaration.prototype);
      } else if (next.type === "comment") {
        Object.setPrototypeOf(next, Comment.prototype);
      } else if (next.type === "root") {
        Object.setPrototypeOf(next, Root.prototype);
      }
      next[my] = true;
      if (next.nodes) {
        for (let child of next.nodes)
          stack.push(child);
      }
    }
  };
});

// /zveltio-extension/node_modules/postcss/lib/at-rule.js
var require_at_rule = __commonJS(function(exports, module) {
  var Container = require_container();

  class AtRule extends Container {
    constructor(defaults) {
      super(defaults);
      this.type = "atrule";
    }
    append(...children) {
      if (!this.proxyOf.nodes)
        this.nodes = [];
      return super.append(...children);
    }
    prepend(...children) {
      if (!this.proxyOf.nodes)
        this.nodes = [];
      return super.prepend(...children);
    }
  }
  module.exports = AtRule;
  AtRule.default = AtRule;
  Container.registerAtRule(AtRule);
});

// /zveltio-extension/node_modules/postcss/lib/document.js
var require_document = __commonJS(function(exports, module) {
  var Container = require_container();
  var LazyResult;
  var Processor;

  class Document extends Container {
    constructor(defaults) {
      super({ type: "document", ...defaults });
      if (!this.nodes) {
        this.nodes = [];
      }
    }
    toResult(opts = {}) {
      let lazy = new LazyResult(new Processor, this, opts);
      return lazy.stringify();
    }
  }
  Document.registerLazyResult = (dependant) => {
    LazyResult = dependant;
  };
  Document.registerProcessor = (dependant) => {
    Processor = dependant;
  };
  module.exports = Document;
  Document.default = Document;
});

// /zveltio-extension/node_modules/postcss/node_modules/nanoid/non-secure/index.cjs
var require_non_secure = __commonJS(function(exports, module) {
  var urlAlphabet = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";
  var customAlphabet = (alphabet, defaultSize = 21) => {
    return (size = defaultSize) => {
      let id = "";
      let i = size | 0;
      while (i-- > 0) {
        id += alphabet[Math.random() * alphabet.length | 0];
      }
      return id;
    };
  };
  var nanoid = (size = 21) => {
    let id = "";
    let i = size | 0;
    while (i-- > 0) {
      id += urlAlphabet[Math.random() * 64 | 0];
    }
    return id;
  };
  module.exports = { nanoid, customAlphabet };
});

// /zveltio-extension/node_modules/postcss/lib/previous-map.js
var require_previous_map = __commonJS(function(exports, module) {
  var { existsSync, readFileSync, realpathSync } = (() => ({}));
  var { dirname, isAbsolute, join, relative, sep } = (() => ({}));
  var { SourceMapConsumer, SourceMapGenerator } = (() => ({}));
  function realPath(path) {
    try {
      return realpathSync(path);
    } catch {
      return path;
    }
  }
  function fromBase64(str) {
    if (Buffer) {
      return Buffer.from(str, "base64").toString();
    } else {
      return window.atob(str);
    }
  }

  class PreviousMap {
    constructor(css, opts) {
      if (opts.map === false)
        return;
      if (opts.unsafeMap)
        this.unsafeMap = true;
      this.loadAnnotation(css);
      this.inline = this.startWith(this.annotation, "data:");
      let prev = opts.map ? opts.map.prev : undefined;
      let text = this.loadMap(opts.from, prev);
      if (!this.mapFile && opts.from) {
        this.mapFile = opts.from;
      }
      if (this.mapFile)
        this.root = dirname(this.mapFile);
      if (text)
        this.text = text;
    }
    consumer() {
      if (!this.consumerCache) {
        this.consumerCache = new SourceMapConsumer(this.json || this.text);
      }
      return this.consumerCache;
    }
    decodeInline(text) {
      let baseCharsetUri = /^data:application\/json;charset=utf-?8;base64,/;
      let baseUri = /^data:application\/json;base64,/;
      let charsetUri = /^data:application\/json;charset=utf-?8,/;
      let uri = /^data:application\/json,/;
      let uriMatch = text.match(charsetUri) || text.match(uri);
      if (uriMatch) {
        return decodeURIComponent(text.substr(uriMatch[0].length));
      }
      let baseUriMatch = text.match(baseCharsetUri) || text.match(baseUri);
      if (baseUriMatch) {
        return fromBase64(text.substr(baseUriMatch[0].length));
      }
      let encoding = text.slice("data:application/json;".length);
      encoding = encoding.slice(0, encoding.indexOf(","));
      throw new Error("Unsupported source map encoding " + encoding);
    }
    getAnnotationURL(sourceMapString) {
      return sourceMapString.replace(/^\/\*\s*# sourceMappingURL=/, "").trim();
    }
    isMap(map) {
      if (typeof map !== "object")
        return false;
      return typeof map.mappings === "string" || typeof map._mappings === "string" || Array.isArray(map.sections);
    }
    loadAnnotation(css) {
      let comments = css.match(/\/\*\s*# sourceMappingURL=/g);
      if (!comments)
        return;
      let start = css.lastIndexOf(comments.pop());
      let end = css.indexOf("*/", start);
      if (start > -1 && end > -1) {
        this.annotation = this.getAnnotationURL(css.substring(start, end));
      }
    }
    loadFile(path, cssFile, trusted) {
      if (!trusted && !this.unsafeMap) {
        if (!/\.map$/i.test(path))
          return;
        if (!cssFile)
          return;
        let rel = relative(realPath(dirname(cssFile)), realPath(path));
        if (rel === ".." || rel.startsWith(".." + sep) || isAbsolute(rel)) {
          return;
        }
      }
      this.root = dirname(path);
      if (existsSync(path)) {
        this.mapFile = path;
        return readFileSync(path, "utf-8").toString().trim();
      }
    }
    loadMap(file, prev) {
      if (prev === false)
        return false;
      if (prev) {
        if (typeof prev === "string") {
          return prev;
        } else if (typeof prev === "function") {
          let prevPath = prev(file);
          if (prevPath) {
            let map = this.loadFile(prevPath, file, true);
            if (!map) {
              throw new Error("Unable to load previous source map: " + prevPath.toString());
            }
            return map;
          }
        } else if (prev instanceof SourceMapConsumer) {
          return SourceMapGenerator.fromSourceMap(prev).toString();
        } else if (prev instanceof SourceMapGenerator) {
          return prev.toString();
        } else if (this.isMap(prev)) {
          return JSON.stringify(prev);
        } else {
          throw new Error("Unsupported previous source map format: " + prev.toString());
        }
      } else if (this.inline) {
        return this.decodeInline(this.annotation);
      } else if (this.annotation) {
        let map = this.annotation;
        if (file)
          map = join(dirname(file), map);
        let unknown = this.loadFile(map, file, false);
        if (unknown) {
          try {
            this.json = JSON.parse(unknown.replace(/^\)]}'[^\n]*\n/, ""));
          } catch {
            return;
          }
        }
        return unknown;
      }
    }
    startWith(string, start) {
      if (!string)
        return false;
      return string.substr(0, start.length) === start;
    }
    withContent() {
      return !!(this.consumer().sourcesContent && this.consumer().sourcesContent.length > 0);
    }
  }
  module.exports = PreviousMap;
  PreviousMap.default = PreviousMap;
});

// /zveltio-extension/node_modules/postcss/lib/input.js
var require_input = __commonJS(function(exports, module) {
  var { nanoid } = require_non_secure();
  var { isAbsolute, resolve } = (() => ({}));
  var { SourceMapConsumer, SourceMapGenerator } = (() => ({}));
  var { fileURLToPath, pathToFileURL } = (() => ({}));
  var CssSyntaxError = require_css_syntax_error();
  var PreviousMap = require_previous_map();
  var terminalHighlight = (() => ({}));
  var lineToIndexCache = Symbol("lineToIndexCache");
  var sourceMapAvailable = Boolean(SourceMapConsumer && SourceMapGenerator);
  var pathAvailable = Boolean(resolve && isAbsolute);
  function getLineToIndex(input) {
    if (input[lineToIndexCache])
      return input[lineToIndexCache];
    let lines = input.css.split(`
`);
    let lineToIndex = new Array(lines.length);
    let prevIndex = 0;
    for (let i = 0, l = lines.length;i < l; i++) {
      lineToIndex[i] = prevIndex;
      prevIndex += lines[i].length + 1;
    }
    input[lineToIndexCache] = lineToIndex;
    return lineToIndex;
  }

  class Input {
    get from() {
      return this.file || this.id;
    }
    constructor(css, opts = {}) {
      if (css === null || typeof css === "undefined" || typeof css === "object" && !css.toString) {
        throw new Error(`PostCSS received ${css} instead of CSS string`);
      }
      this.css = css.toString();
      if (this.css[0] === "\uFEFF" || this.css[0] === "￾") {
        this.hasBOM = true;
        this.css = this.css.slice(1);
      } else {
        this.hasBOM = false;
      }
      this.document = this.css;
      if (opts.document)
        this.document = opts.document.toString();
      if (opts.from) {
        if (!pathAvailable || /^\w+:\/\//.test(opts.from) || isAbsolute(opts.from)) {
          this.file = opts.from;
        } else {
          this.file = resolve(opts.from);
        }
      }
      if (pathAvailable && sourceMapAvailable) {
        let map = new PreviousMap(this.css, opts);
        if (map.text) {
          this.map = map;
          let file = map.consumer().file;
          if (!this.file && file)
            this.file = this.mapResolve(file);
        }
      }
      if (!this.file) {
        this.id = "<input css " + nanoid(6) + ">";
      }
      if (this.map)
        this.map.file = this.from;
    }
    error(message, line, column, opts = {}) {
      let endColumn, endLine, endOffset, offset, result;
      if (line && typeof line === "object") {
        let start = line;
        let end = column;
        if (typeof start.offset === "number") {
          offset = start.offset;
          let pos = this.fromOffset(offset);
          line = pos.line;
          column = pos.col;
        } else {
          line = start.line;
          column = start.column;
          offset = this.fromLineAndColumn(line, column);
        }
        if (typeof end.offset === "number") {
          endOffset = end.offset;
          let pos = this.fromOffset(endOffset);
          endLine = pos.line;
          endColumn = pos.col;
        } else {
          endLine = end.line;
          endColumn = end.column;
          endOffset = this.fromLineAndColumn(end.line, end.column);
        }
      } else if (!column) {
        offset = line;
        let pos = this.fromOffset(offset);
        line = pos.line;
        column = pos.col;
      } else {
        offset = this.fromLineAndColumn(line, column);
      }
      let origin = this.origin(line, column, endLine, endColumn);
      if (origin) {
        result = new CssSyntaxError(message, origin.endLine === undefined ? origin.line : { column: origin.column, line: origin.line }, origin.endLine === undefined ? origin.column : { column: origin.endColumn, line: origin.endLine }, origin.source, origin.file, opts.plugin);
      } else {
        result = new CssSyntaxError(message, endLine === undefined ? line : { column, line }, endLine === undefined ? column : { column: endColumn, line: endLine }, this.css, this.file, opts.plugin);
      }
      result.input = {
        column,
        endColumn,
        endLine,
        endOffset,
        line,
        offset,
        source: this.css
      };
      if (this.file) {
        if (pathToFileURL) {
          result.input.url = pathToFileURL(this.file).toString();
        }
        result.input.file = this.file;
      }
      return result;
    }
    fromLineAndColumn(line, column) {
      let lineToIndex = getLineToIndex(this);
      let index = lineToIndex[line - 1];
      return index + column - 1;
    }
    fromOffset(offset) {
      let lineToIndex = getLineToIndex(this);
      let lastLine = lineToIndex[lineToIndex.length - 1];
      let min = 0;
      if (offset >= lastLine) {
        min = lineToIndex.length - 1;
      } else {
        let max = lineToIndex.length - 2;
        let mid;
        while (min < max) {
          mid = min + (max - min >> 1);
          if (offset < lineToIndex[mid]) {
            max = mid - 1;
          } else if (offset >= lineToIndex[mid + 1]) {
            min = mid + 1;
          } else {
            min = mid;
            break;
          }
        }
      }
      return {
        col: offset - lineToIndex[min] + 1,
        line: min + 1
      };
    }
    mapResolve(file) {
      if (/^\w+:\/\//.test(file)) {
        return file;
      }
      return resolve(this.map.consumer().sourceRoot || this.map.root || ".", file);
    }
    origin(line, column, endLine, endColumn) {
      if (!this.map)
        return false;
      let consumer = this.map.consumer();
      let from = consumer.originalPositionFor({ column: column - 1, line });
      if (!from.source)
        return false;
      let to;
      if (typeof endLine === "number") {
        let toPosition = consumer.originalPositionFor({
          column: endColumn - 1,
          line: endLine
        });
        if (toPosition.source)
          to = toPosition;
      }
      let fromUrl;
      if (isAbsolute(from.source)) {
        fromUrl = pathToFileURL(from.source);
      } else {
        fromUrl = new URL(from.source, pathToFileURL(this.map.mapFile || resolve(".") + "/"));
      }
      let result = {
        column: from.column + 1,
        endColumn: to && to.column + 1,
        endLine: to && to.line,
        line: from.line,
        url: fromUrl.toString()
      };
      if (fromUrl.protocol === "file:") {
        if (fileURLToPath) {
          result.file = fileURLToPath(fromUrl);
        } else {
          throw new Error(`file: protocol is not available in this PostCSS build`);
        }
      }
      let source = consumer.sourceContentFor(from.source);
      if (source)
        result.source = source;
      return result;
    }
    toJSON() {
      let json = {};
      for (let name of ["hasBOM", "css", "file", "id"]) {
        if (this[name] != null) {
          json[name] = this[name];
        }
      }
      if (this.map) {
        json.map = { ...this.map };
        if (json.map.consumerCache) {
          json.map.consumerCache = undefined;
        }
      }
      return json;
    }
  }
  module.exports = Input;
  Input.default = Input;
  if (terminalHighlight && terminalHighlight.registerInput) {
    terminalHighlight.registerInput(Input);
  }
});

// /zveltio-extension/node_modules/postcss/lib/root.js
var require_root = __commonJS(function(exports, module) {
  var Container = require_container();
  var LazyResult;
  var Processor;

  class Root extends Container {
    constructor(defaults) {
      super(defaults);
      this.type = "root";
      if (!this.nodes)
        this.nodes = [];
    }
    normalize(child, sample, type) {
      let keepBefore = new Set;
      for (let node of Array.isArray(child) ? child : [child]) {
        if (node && typeof node === "object" && !node.parent && node.raws && typeof node.raws.before !== "undefined") {
          keepBefore.add(node.raws);
        }
      }
      let nodes = super.normalize(child);
      if (sample) {
        if (type === "prepend") {
          if (this.nodes.length > 1) {
            sample.raws.before = this.nodes[1].raws.before;
          } else {
            delete sample.raws.before;
          }
        } else if (this.first !== sample) {
          for (let node of nodes) {
            if (!keepBefore.has(node.raws)) {
              node.raws.before = sample.raws.before;
            }
          }
        }
      }
      return nodes;
    }
    removeChild(child, ignore) {
      let index = this.index(child);
      if (!ignore && index === 0 && this.nodes.length > 1) {
        this.nodes[1].raws.before = this.nodes[index].raws.before;
      }
      return super.removeChild(child);
    }
    toResult(opts = {}) {
      let lazy = new LazyResult(new Processor, this, opts);
      return lazy.stringify();
    }
  }
  Root.registerLazyResult = (dependant) => {
    LazyResult = dependant;
  };
  Root.registerProcessor = (dependant) => {
    Processor = dependant;
  };
  module.exports = Root;
  Root.default = Root;
  Container.registerRoot(Root);
});

// /zveltio-extension/node_modules/postcss/lib/list.js
var require_list = __commonJS(function(exports, module) {
  var list = {
    comma(string) {
      return list.split(string, [","], true);
    },
    space(string) {
      let spaces = [" ", `
`, "\t"];
      return list.split(string, spaces);
    },
    split(string, separators, last) {
      if (typeof string !== "string")
        return [];
      let array = [];
      let current = "";
      let split = false;
      let func = 0;
      let inQuote = false;
      let prevQuote = "";
      let escape = false;
      let inComment = false;
      for (let i = 0;i < string.length; i++) {
        let letter = string[i];
        if (inComment) {
          current += letter;
          if (letter === "*" && string[i + 1] === "/") {
            current += "/";
            i += 1;
            inComment = false;
          }
          continue;
        }
        if (escape) {
          escape = false;
        } else if (letter === "\\") {
          escape = true;
        } else if (inQuote) {
          if (letter === prevQuote) {
            inQuote = false;
          }
        } else if (letter === '"' || letter === "'") {
          inQuote = true;
          prevQuote = letter;
        } else if (letter === "/" && string[i + 1] === "*") {
          current += "/*";
          i += 1;
          inComment = true;
          continue;
        } else if (letter === "(") {
          func += 1;
        } else if (letter === ")") {
          if (func > 0)
            func -= 1;
        } else if (func === 0) {
          if (separators.includes(letter))
            split = true;
        }
        if (split) {
          let value = current.trim();
          if (last || value !== "")
            array.push(value);
          current = "";
          split = false;
        } else {
          current += letter;
        }
      }
      let value = current.trim();
      if (last || value !== "")
        array.push(value);
      return array;
    }
  };
  module.exports = list;
  list.default = list;
});

// /zveltio-extension/node_modules/postcss/lib/rule.js
var require_rule = __commonJS(function(exports, module) {
  var Container = require_container();
  var list = require_list();

  class Rule extends Container {
    get selectors() {
      return list.comma(this.selector);
    }
    set selectors(values) {
      let match = this.selector ? this.selector.match(/,\s*/) : null;
      let sep = match ? match[0] : "," + this.raw("between", "beforeOpen");
      this.selector = values.join(sep);
    }
    constructor(defaults) {
      super(defaults);
      this.type = "rule";
      if (!this.nodes)
        this.nodes = [];
    }
  }
  module.exports = Rule;
  Rule.default = Rule;
  Container.registerRule(Rule);
});

// /zveltio-extension/node_modules/postcss/lib/fromJSON.js
var require_fromJSON = __commonJS(function(exports, module) {
  var AtRule = require_at_rule();
  var Comment = require_comment();
  var Declaration = require_declaration();
  var Input = require_input();
  var PreviousMap = require_previous_map();
  var Root = require_root();
  var Rule = require_rule();
  function hydrateInputs(json, inputs) {
    if (!json.inputs)
      return inputs;
    return json.inputs.map((input) => {
      let inputHydrated = { ...input, __proto__: Input.prototype };
      if (inputHydrated.map) {
        inputHydrated.map = {
          ...inputHydrated.map,
          __proto__: PreviousMap.prototype
        };
      }
      return inputHydrated;
    });
  }
  function constructNode(json, inputs, children) {
    let defaults = { ...json };
    delete defaults.inputs;
    delete defaults.nodes;
    if (defaults.source) {
      let { inputId, ...source } = defaults.source;
      defaults.source = source;
      if (inputId != null) {
        defaults.source.input = inputs[inputId];
      }
    }
    let node;
    if (defaults.type === "root") {
      node = new Root(defaults);
    } else if (defaults.type === "decl") {
      node = new Declaration(defaults);
    } else if (defaults.type === "rule") {
      node = new Rule(defaults);
    } else if (defaults.type === "comment") {
      node = new Comment(defaults);
    } else if (defaults.type === "atrule") {
      node = new AtRule(defaults);
    } else {
      throw new Error("Unknown node type: " + json.type);
    }
    if (children) {
      node.nodes = children;
      for (let child of children)
        child.parent = node;
    }
    return node;
  }
  function fromJSON(json, inputs) {
    if (Array.isArray(json))
      return json.map((n) => fromJSON(n));
    let result;
    let stack = [
      { childIndex: 0, children: [], inputs: hydrateInputs(json, inputs), json }
    ];
    while (stack.length > 0) {
      let frame = stack[stack.length - 1];
      let jsonNodes = frame.json.nodes;
      if (jsonNodes && frame.childIndex < jsonNodes.length) {
        let childJson = jsonNodes[frame.childIndex];
        frame.childIndex += 1;
        stack.push({
          childIndex: 0,
          children: [],
          inputs: hydrateInputs(childJson, frame.inputs),
          json: childJson
        });
        continue;
      }
      stack.pop();
      let node = constructNode(frame.json, frame.inputs, jsonNodes ? frame.children : undefined);
      if (stack.length > 0) {
        stack[stack.length - 1].children.push(node);
      } else {
        result = node;
      }
    }
    return result;
  }
  module.exports = fromJSON;
  fromJSON.default = fromJSON;
});

// /zveltio-extension/node_modules/postcss/lib/map-generator.js
var require_map_generator = __commonJS(function(exports, module) {
  var { dirname, relative, resolve, sep } = (() => ({}));
  var { SourceMapConsumer, SourceMapGenerator } = (() => ({}));
  var { pathToFileURL } = (() => ({}));
  var Input = require_input();
  var sourceMapAvailable = Boolean(SourceMapConsumer && SourceMapGenerator);
  var pathAvailable = Boolean(dirname && resolve && relative && sep);

  class MapGenerator {
    constructor(stringify, root, opts, cssString) {
      this.stringify = stringify;
      this.mapOpts = opts.map || {};
      this.root = root;
      this.opts = opts;
      this.css = cssString;
      this.originalCSS = cssString;
      this.usesFileUrls = !this.mapOpts.from && this.mapOpts.absolute;
      this.memoizedFileURLs = new Map;
      this.memoizedPaths = new Map;
      this.memoizedURLs = new Map;
    }
    addAnnotation() {
      let content;
      if (this.isInline()) {
        content = "data:application/json;base64," + this.toBase64(this.map.toString());
      } else if (typeof this.mapOpts.annotation === "string") {
        content = this.mapOpts.annotation;
      } else if (typeof this.mapOpts.annotation === "function") {
        content = this.mapOpts.annotation(this.opts.to, this.root);
      } else {
        content = this.outputFile() + ".map";
      }
      let eol = `
`;
      if (this.css.includes(`\r
`))
        eol = `\r
`;
      this.css += eol + "/*# sourceMappingURL=" + content + " */";
    }
    applyPrevMaps() {
      for (let prev of this.previous()) {
        let from = this.toUrl(this.path(prev.file));
        let root = prev.root || dirname(prev.file);
        let map;
        if (this.mapOpts.sourcesContent === false) {
          map = new SourceMapConsumer(prev.text);
          if (map.sourcesContent) {
            map.sourcesContent = null;
          }
        } else {
          map = prev.consumer();
        }
        this.map.applySourceMap(map, from, this.toUrl(this.path(root)));
      }
    }
    clearAnnotation() {
      if (this.mapOpts.annotation === false)
        return;
      if (this.root) {
        let node;
        for (let i = this.root.nodes.length - 1;i >= 0; i--) {
          node = this.root.nodes[i];
          if (node.type !== "comment")
            continue;
          if (node.text.startsWith("# sourceMappingURL=")) {
            this.root.removeChild(i);
          }
        }
      } else if (this.css) {
        let annotation = "/*# sourceMappingURL=";
        let css = "";
        let cursor = 0;
        let startIndex;
        while ((startIndex = this.css.indexOf(annotation, cursor)) !== -1) {
          let endIndex = this.css.indexOf("*/", startIndex + annotation.length);
          if (endIndex === -1)
            break;
          while (startIndex > cursor && this.css[startIndex - 1] === `
`) {
            startIndex--;
          }
          css += this.css.slice(cursor, startIndex);
          cursor = endIndex + 2;
        }
        if (cursor > 0)
          this.css = css + this.css.slice(cursor);
      }
    }
    generate() {
      this.clearAnnotation();
      if (pathAvailable && sourceMapAvailable && this.isMap()) {
        return this.generateMap();
      } else {
        let result = "";
        this.stringify(this.root, (i) => {
          result += i;
        });
        return [result];
      }
    }
    generateMap() {
      if (this.root) {
        this.generateString();
      } else if (this.previous().length === 1) {
        let prev = this.previous()[0].consumer();
        prev.file = this.outputFile();
        this.map = SourceMapGenerator.fromSourceMap(prev, {
          ignoreInvalidMapping: true
        });
      } else {
        this.map = new SourceMapGenerator({
          file: this.outputFile(),
          ignoreInvalidMapping: true
        });
        this.map.addMapping({
          generated: { column: 0, line: 1 },
          original: { column: 0, line: 1 },
          source: this.opts.from ? this.toUrl(this.path(this.opts.from)) : "<no source>"
        });
      }
      if (this.isSourcesContent())
        this.setSourcesContent();
      if (this.root && this.previous().length > 0)
        this.applyPrevMaps();
      if (this.isAnnotation())
        this.addAnnotation();
      if (this.isInline()) {
        return [this.css];
      } else {
        return [this.css, this.map];
      }
    }
    generateString() {
      this.css = "";
      this.map = new SourceMapGenerator({
        file: this.outputFile(),
        ignoreInvalidMapping: true
      });
      let line = 1;
      let column = 1;
      let noSource = "<no source>";
      let mapping = {
        generated: { column: 0, line: 0 },
        original: { column: 0, line: 0 },
        source: ""
      };
      let last, lines;
      this.stringify(this.root, (str, node, type) => {
        this.css += str;
        if (node && type !== "end") {
          mapping.generated.line = line;
          mapping.generated.column = column - 1;
          if (node.source && node.source.start) {
            mapping.source = this.sourcePath(node);
            mapping.original.line = node.source.start.line;
            mapping.original.column = node.source.start.column - 1;
            this.map.addMapping(mapping);
          } else {
            mapping.source = noSource;
            mapping.original.line = 1;
            mapping.original.column = 0;
            this.map.addMapping(mapping);
          }
        }
        lines = str.match(/\n/g);
        if (lines) {
          line += lines.length;
          last = str.lastIndexOf(`
`);
          column = str.length - last;
        } else {
          column += str.length;
        }
        if (node && type !== "start") {
          let p = node.parent || { raws: {} };
          let childless = node.type === "decl" || node.type === "atrule" && !node.nodes;
          if (!childless || node !== p.last || p.raws.semicolon) {
            if (node.source && node.source.end) {
              mapping.source = this.sourcePath(node);
              mapping.original.line = node.source.end.line;
              mapping.original.column = node.source.end.column - 1;
              mapping.generated.line = line;
              mapping.generated.column = column - 2;
              this.map.addMapping(mapping);
            } else {
              mapping.source = noSource;
              mapping.original.line = 1;
              mapping.original.column = 0;
              mapping.generated.line = line;
              mapping.generated.column = column - 1;
              this.map.addMapping(mapping);
            }
          }
        }
      });
    }
    isAnnotation() {
      if (this.isInline()) {
        return true;
      }
      if (typeof this.mapOpts.annotation !== "undefined") {
        return this.mapOpts.annotation;
      }
      if (this.previous().length) {
        return this.previous().some((i) => i.annotation);
      }
      return true;
    }
    isInline() {
      if (typeof this.mapOpts.inline !== "undefined") {
        return this.mapOpts.inline;
      }
      let annotation = this.mapOpts.annotation;
      if (typeof annotation !== "undefined" && annotation !== true) {
        return false;
      }
      if (this.previous().length) {
        return this.previous().some((i) => i.inline);
      }
      return true;
    }
    isMap() {
      if (typeof this.opts.map !== "undefined") {
        return !!this.opts.map;
      }
      return this.previous().length > 0;
    }
    isSourcesContent() {
      if (typeof this.mapOpts.sourcesContent !== "undefined") {
        return this.mapOpts.sourcesContent;
      }
      if (this.previous().length) {
        return this.previous().some((i) => i.withContent());
      }
      return true;
    }
    outputFile() {
      if (this.opts.to) {
        return this.path(this.opts.to);
      } else if (this.opts.from) {
        return this.path(this.opts.from);
      } else {
        return "to.css";
      }
    }
    path(file) {
      if (this.mapOpts.absolute)
        return file;
      if (file.charCodeAt(0) === 60)
        return file;
      if (/^\w+:\/\//.test(file))
        return file;
      let cached = this.memoizedPaths.get(file);
      if (cached)
        return cached;
      let from = this.opts.to ? dirname(this.opts.to) : ".";
      if (typeof this.mapOpts.annotation === "string") {
        from = dirname(resolve(from, this.mapOpts.annotation));
      }
      let path = relative(from, file);
      this.memoizedPaths.set(file, path);
      return path;
    }
    previous() {
      if (!this.previousMaps) {
        this.previousMaps = [];
        if (this.root) {
          this.root.walk((node) => {
            if (node.source && node.source.input.map) {
              let map = node.source.input.map;
              if (!this.previousMaps.includes(map)) {
                this.previousMaps.push(map);
              }
            }
          });
        } else {
          let input = new Input(this.originalCSS, this.opts);
          if (input.map)
            this.previousMaps.push(input.map);
        }
      }
      return this.previousMaps;
    }
    setSourcesContent() {
      let already = {};
      if (this.root) {
        this.root.walk((node) => {
          if (node.source) {
            let from = node.source.input.from;
            if (from && !already[from]) {
              already[from] = true;
              let fromUrl = this.usesFileUrls ? this.toFileUrl(from) : this.toUrl(this.path(from));
              this.map.setSourceContent(fromUrl, node.source.input.css);
            }
          }
        });
      } else if (this.css) {
        let from = this.opts.from ? this.toUrl(this.path(this.opts.from)) : "<no source>";
        this.map.setSourceContent(from, this.css);
      }
    }
    sourcePath(node) {
      if (this.mapOpts.from) {
        return this.toUrl(this.mapOpts.from);
      } else if (this.usesFileUrls) {
        return this.toFileUrl(node.source.input.from);
      } else {
        return this.toUrl(this.path(node.source.input.from));
      }
    }
    toBase64(str) {
      if (Buffer) {
        return Buffer.from(str).toString("base64");
      } else {
        return window.btoa(unescape(encodeURIComponent(str)));
      }
    }
    toFileUrl(path) {
      let cached = this.memoizedFileURLs.get(path);
      if (cached)
        return cached;
      if (pathToFileURL) {
        let fileURL = pathToFileURL(path).toString();
        this.memoizedFileURLs.set(path, fileURL);
        return fileURL;
      } else {
        throw new Error("`map.absolute` option is not available in this PostCSS build");
      }
    }
    toUrl(path) {
      let cached = this.memoizedURLs.get(path);
      if (cached)
        return cached;
      if (sep === "\\") {
        path = path.replace(/\\/g, "/");
      }
      let url = encodeURI(path).replace(/[#?]/g, encodeURIComponent);
      this.memoizedURLs.set(path, url);
      return url;
    }
  }
  module.exports = MapGenerator;
});

// /zveltio-extension/node_modules/postcss/lib/tokenize.js
var require_tokenize = __commonJS(function(exports, module) {
  var SINGLE_QUOTE = 39;
  var DOUBLE_QUOTE = 34;
  var BACKSLASH = 92;
  var SLASH = 47;
  var NEWLINE = 10;
  var SPACE = 32;
  var FEED = 12;
  var TAB = 9;
  var CR = 13;
  var OPEN_SQUARE = 91;
  var CLOSE_SQUARE = 93;
  var OPEN_PARENTHESES = 40;
  var CLOSE_PARENTHESES = 41;
  var OPEN_CURLY = 123;
  var CLOSE_CURLY = 125;
  var SEMICOLON = 59;
  var ASTERISK = 42;
  var COLON = 58;
  var AT = 64;
  var RE_AT_END = /[\t\n\f\r "#'()/;[\\\]{}]/g;
  var RE_WORD_END = /[\t\n\f\r !"#'():;@[\\\]{}]|\/(?=\*)/g;
  var RE_BAD_BRACKET = /.[\r\n"'(/\\]/;
  var RE_HEX_ESCAPE = /[\da-f]/i;
  module.exports = function tokenizer(input, options = {}) {
    let css = input.css.valueOf();
    let ignore = options.ignoreErrors;
    let code, content, escape, next, quote;
    let currentToken, escaped, escapePos, n, prev;
    let length = css.length;
    let pos = 0;
    let buffer = [];
    let returned = [];
    let lastBadParen = -1;
    function position() {
      return pos;
    }
    function unclosed(what) {
      throw input.error("Unclosed " + what, pos);
    }
    function endOfFile() {
      return returned.length === 0 && pos >= length;
    }
    function nextToken(opts) {
      if (returned.length)
        return returned.pop();
      if (pos >= length)
        return;
      let ignoreUnclosed = opts ? opts.ignoreUnclosed : false;
      code = css.charCodeAt(pos);
      switch (code) {
        case NEWLINE:
        case SPACE:
        case TAB:
        case CR:
        case FEED: {
          next = pos;
          do {
            next += 1;
            code = css.charCodeAt(next);
          } while (code === SPACE || code === NEWLINE || code === TAB || code === CR || code === FEED);
          currentToken = ["space", css.slice(pos, next)];
          pos = next - 1;
          break;
        }
        case OPEN_SQUARE:
        case CLOSE_SQUARE:
        case OPEN_CURLY:
        case CLOSE_CURLY:
        case COLON:
        case SEMICOLON:
        case CLOSE_PARENTHESES: {
          let controlChar = String.fromCharCode(code);
          currentToken = [controlChar, controlChar, pos];
          break;
        }
        case OPEN_PARENTHESES: {
          prev = buffer.length ? buffer.pop()[1] : "";
          n = css.charCodeAt(pos + 1);
          if (prev === "url" && n !== SINGLE_QUOTE && n !== DOUBLE_QUOTE && n !== SPACE && n !== NEWLINE && n !== TAB && n !== FEED && n !== CR) {
            next = pos;
            do {
              escaped = false;
              next = css.indexOf(")", next + 1);
              if (next === -1) {
                if (ignore || ignoreUnclosed) {
                  next = pos;
                  break;
                } else {
                  unclosed("bracket");
                }
              }
              escapePos = next;
              while (css.charCodeAt(escapePos - 1) === BACKSLASH) {
                escapePos -= 1;
                escaped = !escaped;
              }
            } while (escaped);
            currentToken = ["brackets", css.slice(pos, next + 1), pos, next];
            pos = next;
          } else if (pos <= lastBadParen) {
            currentToken = ["(", "(", pos];
          } else {
            next = css.indexOf(")", pos + 1);
            content = css.slice(pos, next + 1);
            if (next === -1 || RE_BAD_BRACKET.test(content)) {
              lastBadParen = next === -1 ? length : next;
              currentToken = ["(", "(", pos];
            } else {
              currentToken = ["brackets", content, pos, next];
              pos = next;
            }
          }
          break;
        }
        case SINGLE_QUOTE:
        case DOUBLE_QUOTE: {
          quote = code === SINGLE_QUOTE ? "'" : '"';
          next = pos;
          do {
            escaped = false;
            next = css.indexOf(quote, next + 1);
            if (next === -1) {
              if (ignore || ignoreUnclosed) {
                next = pos + 1;
                break;
              } else {
                unclosed("string");
              }
            }
            escapePos = next;
            while (css.charCodeAt(escapePos - 1) === BACKSLASH) {
              escapePos -= 1;
              escaped = !escaped;
            }
          } while (escaped);
          currentToken = ["string", css.slice(pos, next + 1), pos, next];
          pos = next;
          break;
        }
        case AT: {
          RE_AT_END.lastIndex = pos + 1;
          RE_AT_END.test(css);
          if (RE_AT_END.lastIndex === 0) {
            next = css.length - 1;
          } else {
            next = RE_AT_END.lastIndex - 2;
          }
          currentToken = ["at-word", css.slice(pos, next + 1), pos, next];
          pos = next;
          break;
        }
        case BACKSLASH: {
          next = pos;
          escape = true;
          while (css.charCodeAt(next + 1) === BACKSLASH) {
            next += 1;
            escape = !escape;
          }
          code = css.charCodeAt(next + 1);
          if (escape && code !== SLASH && code !== SPACE && code !== NEWLINE && code !== TAB && code !== CR && code !== FEED) {
            next += 1;
            if (RE_HEX_ESCAPE.test(css.charAt(next))) {
              while (RE_HEX_ESCAPE.test(css.charAt(next + 1))) {
                next += 1;
              }
              if (css.charCodeAt(next + 1) === SPACE) {
                next += 1;
              }
            }
          }
          currentToken = ["word", css.slice(pos, next + 1), pos, next];
          pos = next;
          break;
        }
        default: {
          if (code === SLASH && css.charCodeAt(pos + 1) === ASTERISK) {
            next = css.indexOf("*/", pos + 2) + 1;
            if (next === 0) {
              if (ignore || ignoreUnclosed) {
                next = css.length;
              } else {
                unclosed("comment");
              }
            }
            currentToken = ["comment", css.slice(pos, next + 1), pos, next];
            pos = next;
          } else {
            RE_WORD_END.lastIndex = pos + 1;
            RE_WORD_END.test(css);
            if (RE_WORD_END.lastIndex === 0) {
              next = css.length - 1;
            } else {
              next = RE_WORD_END.lastIndex - 2;
            }
            currentToken = ["word", css.slice(pos, next + 1), pos, next];
            buffer.push(currentToken);
            pos = next;
          }
          break;
        }
      }
      pos++;
      return currentToken;
    }
    function back(token) {
      returned.push(token);
    }
    return {
      back,
      endOfFile,
      nextToken,
      position
    };
  };
});

// /zveltio-extension/node_modules/postcss/lib/parser.js
var require_parser = __commonJS(function(exports, module) {
  var AtRule = require_at_rule();
  var Comment = require_comment();
  var Declaration = require_declaration();
  var Root = require_root();
  var Rule = require_rule();
  var tokenizer = require_tokenize();
  var SAFE_COMMENT_NEIGHBOR = {
    empty: true,
    space: true
  };
  function findLastWithPosition(tokens) {
    for (let i = tokens.length - 1;i >= 0; i--) {
      let token = tokens[i];
      let pos = token[3] || token[2];
      if (pos)
        return pos;
    }
  }
  function tokensToString(tokens, from, to) {
    let result = "";
    for (let i = from;i < to; i++)
      result += tokens[i][1];
    return result;
  }

  class Parser {
    constructor(input) {
      this.input = input;
      this.root = new Root;
      this.current = this.root;
      this.spaces = "";
      this.semicolon = false;
      this.createTokenizer();
      this.root.source = { input, start: { column: 1, line: 1, offset: 0 } };
    }
    atrule(token) {
      let node = new AtRule;
      node.name = token[1].slice(1);
      if (node.name === "") {
        this.unnamedAtrule(node, token);
      }
      this.init(node, token[2]);
      let type;
      let prev;
      let shift;
      let last = false;
      let open = false;
      let params = [];
      let brackets = [];
      while (!this.tokenizer.endOfFile()) {
        token = this.tokenizer.nextToken();
        type = token[0];
        if (type === "(" || type === "[") {
          brackets.push(type === "(" ? ")" : "]");
        } else if (type === "{" && brackets.length > 0) {
          brackets.push("}");
        } else if (type === brackets[brackets.length - 1]) {
          brackets.pop();
        }
        if (brackets.length === 0) {
          if (type === ";") {
            node.source.end = this.getPosition(token[2]);
            node.source.end.offset++;
            this.semicolon = true;
            break;
          } else if (type === "{") {
            open = true;
            break;
          } else if (type === "}") {
            if (params.length > 0) {
              shift = params.length - 1;
              prev = params[shift];
              while (prev && prev[0] === "space") {
                prev = params[--shift];
              }
              if (prev) {
                node.source.end = this.getPosition(prev[3] || prev[2]);
                node.source.end.offset++;
              }
            }
            this.end(token);
            break;
          } else {
            params.push(token);
          }
        } else {
          params.push(token);
        }
        if (this.tokenizer.endOfFile()) {
          last = true;
          break;
        }
      }
      node.raws.between = this.spacesAndCommentsFromEnd(params);
      if (params.length) {
        node.raws.afterName = this.spacesAndCommentsFromStart(params);
        this.raw(node, "params", params);
        if (last) {
          token = params[params.length - 1];
          node.source.end = this.getPosition(token[3] || token[2]);
          node.source.end.offset++;
          this.spaces = node.raws.between;
          node.raws.between = "";
        }
      } else {
        node.raws.afterName = "";
        node.params = "";
      }
      if (open) {
        node.nodes = [];
        this.current = node;
      }
    }
    checkMissedSemicolon(tokens) {
      let colon = this.colon(tokens);
      if (colon === false)
        return;
      let founded = 0;
      let token;
      for (let j = colon - 1;j >= 0; j--) {
        token = tokens[j];
        if (token[0] !== "space") {
          founded += 1;
          if (founded === 2)
            break;
        }
      }
      throw this.input.error("Missed semicolon", token[0] === "word" ? token[3] + 1 : token[2]);
    }
    colon(tokens) {
      let brackets = 0;
      let prev, token, type;
      for (let [i, element] of tokens.entries()) {
        token = element;
        type = token[0];
        if (type === "(") {
          brackets += 1;
        }
        if (type === ")") {
          brackets -= 1;
        }
        if (brackets === 0 && type === ":") {
          if (!prev) {
            this.doubleColon(token);
          } else if (prev[0] === "word" && prev[1] === "progid") {
            continue;
          } else {
            return i;
          }
        }
        prev = token;
      }
      return false;
    }
    comment(token) {
      let node = new Comment;
      this.init(node, token[2]);
      node.source.end = this.getPosition(token[3] || token[2]);
      node.source.end.offset++;
      let text = token[1].slice(2, -2);
      if (!text.trim()) {
        node.text = "";
        node.raws.left = text;
        node.raws.right = "";
      } else {
        let match = text.match(/^(\s*)([^]*\S)(\s*)$/);
        node.text = match[2];
        node.raws.left = match[1];
        node.raws.right = match[3];
      }
    }
    createTokenizer() {
      this.tokenizer = tokenizer(this.input);
    }
    decl(tokens, customProperty) {
      let node = new Declaration;
      this.init(node, tokens[0][2]);
      let last = tokens[tokens.length - 1];
      if (last[0] === ";") {
        this.semicolon = true;
        tokens.pop();
      }
      node.source.end = this.getPosition(last[3] || last[2] || findLastWithPosition(tokens));
      node.source.end.offset++;
      let start = 0;
      while (tokens[start][0] !== "word") {
        if (start === tokens.length - 1)
          this.unknownWord([tokens[start]]);
        start++;
      }
      node.raws.before += tokensToString(tokens, 0, start);
      node.source.start = this.getPosition(tokens[start][2]);
      let propStart = start;
      while (start < tokens.length) {
        let type = tokens[start][0];
        if (type === ":" || type === "space" || type === "comment") {
          break;
        }
        start++;
      }
      node.prop = tokensToString(tokens, propStart, start);
      let betweenStart = start;
      let token;
      while (start < tokens.length) {
        token = tokens[start];
        start++;
        if (token[0] === ":")
          break;
        if (token[0] === "word" && /\w/.test(token[1])) {
          this.unknownWord([token]);
        }
      }
      node.raws.between = tokensToString(tokens, betweenStart, start);
      if (node.prop[0] === "_" || node.prop[0] === "*") {
        node.raws.before += node.prop[0];
        node.prop = node.prop.slice(1);
      }
      let firstSpacesStart = start;
      while (start < tokens.length) {
        let next = tokens[start][0];
        if (next !== "space" && next !== "comment")
          break;
        start++;
      }
      let firstSpaces = tokens.slice(firstSpacesStart, start);
      tokens = tokens.slice(start);
      this.precheckMissedSemicolon(tokens);
      for (let i = tokens.length - 1;i >= 0; i--) {
        token = tokens[i];
        if (token[1].toLowerCase() === "!important") {
          node.important = true;
          let string = this.stringFrom(tokens, i);
          string = this.spacesFromEnd(tokens) + string;
          if (string !== " !important")
            node.raws.important = string;
          break;
        } else if (token[1].toLowerCase() === "important") {
          let cache = tokens.slice(0);
          let str = "";
          for (let j = i;j > 0; j--) {
            let type = cache[j][0];
            if (str.trim().startsWith("!") && type !== "space") {
              break;
            }
            str = cache.pop()[1] + str;
          }
          if (str.trim().startsWith("!")) {
            node.important = true;
            node.raws.important = str;
            tokens = cache;
          }
        }
        if (token[0] !== "space" && token[0] !== "comment") {
          break;
        }
      }
      let hasWord = tokens.some((i) => i[0] !== "space" && i[0] !== "comment");
      if (hasWord) {
        node.raws.between += firstSpaces.map((i) => i[1]).join("");
        firstSpaces = [];
      }
      this.raw(node, "value", firstSpaces.concat(tokens), customProperty);
      if (node.value.includes(":") && !customProperty) {
        this.checkMissedSemicolon(tokens);
      }
    }
    doubleColon(token) {
      throw this.input.error("Double colon", { offset: token[2] }, { offset: token[2] + token[1].length });
    }
    emptyRule(token) {
      let node = new Rule;
      this.init(node, token[2]);
      node.selector = "";
      node.raws.between = "";
      this.current = node;
    }
    end(token) {
      if (this.current.nodes && this.current.nodes.length) {
        this.current.raws.semicolon = this.semicolon;
      }
      this.semicolon = false;
      this.current.raws.after = (this.current.raws.after || "") + this.spaces;
      this.spaces = "";
      if (this.current.parent) {
        this.current.source.end = this.getPosition(token[2]);
        this.current.source.end.offset++;
        this.current = this.current.parent;
      } else {
        this.unexpectedClose(token);
      }
    }
    endFile() {
      if (this.current.parent)
        this.unclosedBlock();
      if (this.current.nodes && this.current.nodes.length) {
        this.current.raws.semicolon = this.semicolon;
      }
      this.current.raws.after = (this.current.raws.after || "") + this.spaces;
      this.root.source.end = this.getPosition(this.tokenizer.position());
    }
    freeSemicolon(token) {
      this.spaces += token[1];
      if (this.current.nodes) {
        let prev = this.current.nodes[this.current.nodes.length - 1];
        if (prev && prev.type === "rule" && !prev.raws.ownSemicolon) {
          prev.raws.ownSemicolon = this.spaces;
          this.spaces = "";
          prev.source.end = this.getPosition(token[2]);
          prev.source.end.offset++;
        }
      }
    }
    getPosition(offset) {
      let pos = this.input.fromOffset(offset);
      return {
        column: pos.col,
        line: pos.line,
        offset
      };
    }
    init(node, offset) {
      this.current.push(node);
      node.source = {
        input: this.input,
        start: this.getPosition(offset)
      };
      node.raws.before = this.spaces;
      this.spaces = "";
      if (node.type !== "comment")
        this.semicolon = false;
    }
    other(start) {
      let end = false;
      let type = null;
      let colon = false;
      let bracket = null;
      let brackets = [];
      let customProperty = start[1].startsWith("--");
      let tokens = [];
      let token = start;
      while (token) {
        type = token[0];
        tokens.push(token);
        if (type === "(" || type === "[") {
          if (!bracket)
            bracket = token;
          brackets.push(type === "(" ? ")" : "]");
        } else if (customProperty && colon && type === "{") {
          if (!bracket)
            bracket = token;
          brackets.push("}");
        } else if (brackets.length === 0) {
          if (type === ";") {
            if (colon) {
              this.decl(tokens, customProperty);
              return;
            } else {
              break;
            }
          } else if (type === "{") {
            this.rule(tokens);
            return;
          } else if (type === "}") {
            this.tokenizer.back(tokens.pop());
            end = true;
            break;
          } else if (type === ":") {
            colon = true;
          }
        } else if (type === brackets[brackets.length - 1]) {
          brackets.pop();
          if (brackets.length === 0)
            bracket = null;
        }
        token = this.tokenizer.nextToken();
      }
      if (this.tokenizer.endOfFile())
        end = true;
      if (brackets.length > 0)
        this.unclosedBracket(bracket);
      if (end && colon) {
        if (!customProperty) {
          while (tokens.length) {
            token = tokens[tokens.length - 1][0];
            if (token !== "space" && token !== "comment")
              break;
            this.tokenizer.back(tokens.pop());
          }
        }
        this.decl(tokens, customProperty);
      } else {
        this.unknownWord(tokens);
      }
    }
    parse() {
      let token;
      while (!this.tokenizer.endOfFile()) {
        token = this.tokenizer.nextToken();
        switch (token[0]) {
          case "space":
            this.spaces += token[1];
            break;
          case ";":
            this.freeSemicolon(token);
            break;
          case "}":
            this.end(token);
            break;
          case "comment":
            this.comment(token);
            break;
          case "at-word":
            this.atrule(token);
            break;
          case "{":
            this.emptyRule(token);
            break;
          default:
            this.other(token);
            break;
        }
      }
      this.endFile();
    }
    precheckMissedSemicolon() {}
    raw(node, prop, tokens, customProperty) {
      let token, type;
      let length = tokens.length;
      let value = "";
      let last = "";
      let clean = true;
      let next, prev;
      for (let i = 0;i < length; i += 1) {
        token = tokens[i];
        type = token[0];
        if (type === "space" && i === length - 1 && !customProperty) {
          clean = false;
        } else if (type === "comment") {
          prev = tokens[i - 1] ? tokens[i - 1][0] : "empty";
          next = tokens[i + 1] ? tokens[i + 1][0] : "empty";
          if (!SAFE_COMMENT_NEIGHBOR[prev] && !SAFE_COMMENT_NEIGHBOR[next]) {
            if (last === ",") {
              clean = false;
            } else {
              value += token[1];
              last = token[1].slice(-1);
            }
          } else {
            clean = false;
          }
        } else {
          value += token[1];
          last = token[1].slice(-1);
        }
      }
      if (!clean) {
        let raw = tokens.reduce((all, i) => all + i[1], "");
        node.raws[prop] = { raw, value };
      }
      node[prop] = value;
    }
    rule(tokens) {
      tokens.pop();
      let node = new Rule;
      this.init(node, tokens[0][2]);
      node.raws.between = this.spacesAndCommentsFromEnd(tokens);
      this.raw(node, "selector", tokens);
      this.current = node;
    }
    spacesAndCommentsFromEnd(tokens) {
      let lastTokenType;
      let spaces = "";
      while (tokens.length) {
        lastTokenType = tokens[tokens.length - 1][0];
        if (lastTokenType !== "space" && lastTokenType !== "comment")
          break;
        spaces = tokens.pop()[1] + spaces;
      }
      return spaces;
    }
    spacesAndCommentsFromStart(tokens) {
      let next;
      let spaces = "";
      while (tokens.length) {
        next = tokens[0][0];
        if (next !== "space" && next !== "comment")
          break;
        spaces += tokens.shift()[1];
      }
      return spaces;
    }
    spacesFromEnd(tokens) {
      let lastTokenType;
      let spaces = "";
      while (tokens.length) {
        lastTokenType = tokens[tokens.length - 1][0];
        if (lastTokenType !== "space")
          break;
        spaces = tokens.pop()[1] + spaces;
      }
      return spaces;
    }
    stringFrom(tokens, from) {
      let result = "";
      for (let i = from;i < tokens.length; i++) {
        result += tokens[i][1];
      }
      tokens.splice(from, tokens.length - from);
      return result;
    }
    unclosedBlock() {
      let pos = this.current.source.start;
      throw this.input.error("Unclosed block", pos.line, pos.column);
    }
    unclosedBracket(bracket) {
      throw this.input.error("Unclosed bracket", { offset: bracket[2] }, { offset: bracket[2] + 1 });
    }
    unexpectedClose(token) {
      throw this.input.error("Unexpected }", { offset: token[2] }, { offset: token[2] + 1 });
    }
    unknownWord(tokens) {
      throw this.input.error("Unknown word " + tokens[0][1], { offset: tokens[0][2] }, { offset: tokens[0][2] + tokens[0][1].length });
    }
    unnamedAtrule(node, token) {
      throw this.input.error("At-rule without name", { offset: token[2] }, { offset: token[2] + token[1].length });
    }
  }
  module.exports = Parser;
});

// /zveltio-extension/node_modules/postcss/lib/parse.js
var require_parse = __commonJS(function(exports, module) {
  var Container = require_container();
  var Input = require_input();
  var Parser = require_parser();
  function parse(css, opts) {
    let input = new Input(css, opts);
    let parser = new Parser(input);
    try {
      parser.parse();
    } catch (e) {
      if (true) {
        if (e.name === "CssSyntaxError" && opts && opts.from) {
          if (/\.scss$/i.test(opts.from)) {
            e.message += `
You tried to parse SCSS with ` + "the standard CSS parser; " + "try again with the postcss-scss parser";
          } else if (/\.sass/i.test(opts.from)) {
            e.message += `
You tried to parse Sass with ` + "the standard CSS parser; " + "try again with the postcss-sass parser";
          } else if (/\.less$/i.test(opts.from)) {
            e.message += `
You tried to parse Less with ` + "the standard CSS parser; " + "try again with the postcss-less parser";
          }
        }
      }
      throw e;
    }
    return parser.root;
  }
  module.exports = parse;
  parse.default = parse;
  Container.registerParse(parse);
});

// /zveltio-extension/node_modules/postcss/lib/warning.js
var require_warning = __commonJS(function(exports, module) {
  var Container = require_container();
  var { my } = require_symbols();

  class Warning {
    constructor(text, opts = {}) {
      this.type = "warning";
      this.text = text;
      if (opts.node && opts.node.source) {
        if (!opts.node[my]) {
          Container.rebuild(opts.node);
        }
        let range = opts.node.rangeBy(opts);
        this.line = range.start.line;
        this.column = range.start.column;
        this.endLine = range.end.line;
        this.endColumn = range.end.column;
      }
      for (let opt in opts)
        this[opt] = opts[opt];
    }
    toString() {
      if (this.node) {
        return this.node.error(this.text, {
          index: this.index,
          plugin: this.plugin,
          start: this.start,
          word: this.word
        }).message;
      }
      if (this.plugin) {
        return this.plugin + ": " + this.text;
      }
      return this.text;
    }
  }
  module.exports = Warning;
  Warning.default = Warning;
});

// /zveltio-extension/node_modules/postcss/lib/result.js
var require_result = __commonJS(function(exports, module) {
  var Warning = require_warning();

  class Result {
    get content() {
      return this.css;
    }
    constructor(processor, root, opts) {
      this.processor = processor;
      this.messages = [];
      this.root = root;
      this.opts = opts;
      this.css = "";
      this.map = undefined;
    }
    toString() {
      return this.css;
    }
    warn(text, opts = {}) {
      if (!opts.plugin) {
        if (this.lastPlugin && this.lastPlugin.postcssPlugin) {
          opts.plugin = this.lastPlugin.postcssPlugin;
        }
      }
      let warning = new Warning(text, opts);
      this.messages.push(warning);
      return warning;
    }
    warnings() {
      return this.messages.filter((i) => i.type === "warning");
    }
  }
  module.exports = Result;
  Result.default = Result;
});

// /zveltio-extension/node_modules/postcss/lib/warn-once.js
var require_warn_once = __commonJS(function(exports, module) {
  var printed = {};
  module.exports = function warnOnce(message) {
    if (printed[message])
      return;
    printed[message] = true;
    if (typeof console !== "undefined" && console.warn) {
      console.warn(message);
    }
  };
});

// /zveltio-extension/node_modules/postcss/lib/lazy-result.js
var require_lazy_result = __commonJS(function(exports, module) {
  var Container = require_container();
  var Document = require_document();
  var MapGenerator = require_map_generator();
  var parse = require_parse();
  var Result = require_result();
  var Root = require_root();
  var stringify = require_stringify();
  var { isClean, my } = require_symbols();
  var warnOnce = require_warn_once();
  var TYPE_TO_CLASS_NAME = {
    atrule: "AtRule",
    comment: "Comment",
    decl: "Declaration",
    document: "Document",
    root: "Root",
    rule: "Rule"
  };
  var PLUGIN_PROPS = {
    AtRule: true,
    AtRuleExit: true,
    Comment: true,
    CommentExit: true,
    Declaration: true,
    DeclarationExit: true,
    Document: true,
    DocumentExit: true,
    Once: true,
    OnceExit: true,
    postcssPlugin: true,
    prepare: true,
    Root: true,
    RootExit: true,
    Rule: true,
    RuleExit: true
  };
  var NOT_VISITORS = {
    Once: true,
    postcssPlugin: true,
    prepare: true
  };
  var CHILDREN = 0;
  function isPromise(obj) {
    return typeof obj === "object" && typeof obj.then === "function";
  }
  function getEvents(node) {
    let key = false;
    let type = TYPE_TO_CLASS_NAME[node.type];
    if (node.type === "decl") {
      key = node.prop.toLowerCase();
    } else if (node.type === "atrule") {
      key = node.name.toLowerCase();
    }
    if (key && node.append) {
      return [
        type,
        type + "-" + key,
        CHILDREN,
        type + "Exit",
        type + "Exit-" + key
      ];
    } else if (key) {
      return [type, type + "-" + key, type + "Exit", type + "Exit-" + key];
    } else if (node.append) {
      return [type, CHILDREN, type + "Exit"];
    } else {
      return [type, type + "Exit"];
    }
  }
  function toStack(node) {
    let events;
    if (node.type === "document") {
      events = ["Document", CHILDREN, "DocumentExit"];
    } else if (node.type === "root") {
      events = ["Root", CHILDREN, "RootExit"];
    } else {
      events = getEvents(node);
    }
    return {
      eventIndex: 0,
      events,
      iterator: 0,
      node,
      visitorIndex: 0,
      visitors: []
    };
  }
  function cleanMarks(node) {
    let stack = [node];
    while (stack.length > 0) {
      let next = stack.pop();
      next[isClean] = false;
      if (next.nodes) {
        for (let i of next.nodes)
          stack.push(i);
      }
    }
    return node;
  }
  var postcss = {};

  class LazyResult {
    get content() {
      return this.stringify().content;
    }
    get css() {
      return this.stringify().css;
    }
    get map() {
      return this.stringify().map;
    }
    get messages() {
      return this.sync().messages;
    }
    get opts() {
      return this.result.opts;
    }
    get processor() {
      return this.result.processor;
    }
    get root() {
      return this.sync().root;
    }
    get [Symbol.toStringTag]() {
      return "LazyResult";
    }
    constructor(processor, css, opts) {
      this.stringified = false;
      this.processed = false;
      let root;
      if (typeof css === "object" && css !== null && (css.type === "root" || css.type === "document")) {
        root = cleanMarks(css);
      } else if (css instanceof LazyResult || css instanceof Result) {
        root = cleanMarks(css.root);
        if (css.map) {
          if (typeof opts.map === "undefined")
            opts.map = {};
          if (!opts.map.inline)
            opts.map.inline = false;
          opts.map.prev = css.map;
        }
      } else {
        let parser = parse;
        if (opts.syntax)
          parser = opts.syntax.parse;
        if (opts.parser)
          parser = opts.parser;
        if (parser.parse)
          parser = parser.parse;
        try {
          root = parser(css, opts);
        } catch (error) {
          this.processed = true;
          this.error = error;
        }
        if (root && !root[my]) {
          Container.rebuild(root);
        }
      }
      this.result = new Result(processor, root, opts);
      this.helpers = { ...postcss, postcss, result: this.result };
      this.plugins = this.processor.plugins.map((plugin) => {
        if (typeof plugin === "object" && plugin.prepare) {
          return { ...plugin, ...plugin.prepare(this.result) };
        } else {
          return plugin;
        }
      });
    }
    async() {
      if (this.error)
        return Promise.reject(this.error);
      if (this.processed)
        return Promise.resolve(this.result);
      if (!this.processing) {
        this.processing = this.runAsync();
      }
      return this.processing;
    }
    catch(onRejected) {
      return this.async().catch(onRejected);
    }
    finally(onFinally) {
      return this.async().finally(onFinally);
    }
    getAsyncError() {
      throw new Error("Use process(css).then(cb) to work with async plugins");
    }
    handleError(error, node) {
      let plugin = this.result.lastPlugin;
      try {
        if (node)
          node.addToError(error);
        this.error = error;
        if (error.name === "CssSyntaxError" && !error.plugin) {
          error.plugin = plugin.postcssPlugin;
          error.setMessage();
        } else if (plugin.postcssVersion) {
          if (true) {
            let pluginName = plugin.postcssPlugin;
            let pluginVer = plugin.postcssVersion;
            let runtimeVer = this.result.processor.version;
            let a = pluginVer.split(".");
            let b = runtimeVer.split(".");
            if (a[0] !== b[0] || parseInt(a[1]) > parseInt(b[1])) {
              console.error("Unknown error from PostCSS plugin. Your current PostCSS " + "version is " + runtimeVer + ", but " + pluginName + " uses " + pluginVer + ". Perhaps this is the source of the error below.");
            }
          }
        }
      } catch (err) {
        if (console && console.error)
          console.error(err);
      }
      return error;
    }
    prepareVisitors() {
      this.listeners = {};
      let add = (plugin, type, cb) => {
        if (!this.listeners[type])
          this.listeners[type] = [];
        this.listeners[type].push([plugin, cb]);
      };
      for (let plugin of this.plugins) {
        if (typeof plugin === "object") {
          for (let event in plugin) {
            if (!PLUGIN_PROPS[event] && /^[A-Z]/.test(event)) {
              throw new Error(`Unknown event ${event} in ${plugin.postcssPlugin}. ` + `Try to update PostCSS (${this.processor.version} now).`);
            }
            if (!NOT_VISITORS[event]) {
              if (typeof plugin[event] === "object") {
                for (let filter in plugin[event]) {
                  if (filter === "*") {
                    add(plugin, event, plugin[event][filter]);
                  } else {
                    add(plugin, event + "-" + filter.toLowerCase(), plugin[event][filter]);
                  }
                }
              } else if (typeof plugin[event] === "function") {
                add(plugin, event, plugin[event]);
              }
            }
          }
        }
      }
      this.hasListener = Object.keys(this.listeners).length > 0;
    }
    async runAsync() {
      this.plugin = 0;
      for (let i = 0;i < this.plugins.length; i++) {
        let plugin = this.plugins[i];
        let promise = this.runOnRoot(plugin);
        if (isPromise(promise)) {
          try {
            await promise;
          } catch (error) {
            throw this.handleError(error);
          }
        }
      }
      this.prepareVisitors();
      if (this.hasListener) {
        let root = this.result.root;
        while (!root[isClean]) {
          root[isClean] = true;
          let stack = [toStack(root)];
          while (stack.length > 0) {
            let promise = this.visitTick(stack);
            if (isPromise(promise)) {
              try {
                await promise;
              } catch (e) {
                let node = stack[stack.length - 1].node;
                throw this.handleError(e, node);
              }
            }
          }
        }
        if (this.listeners.OnceExit) {
          for (let [plugin, visitor] of this.listeners.OnceExit) {
            this.result.lastPlugin = plugin;
            try {
              if (root.type === "document") {
                let roots = root.nodes.map((subRoot) => visitor(subRoot, this.helpers));
                await Promise.all(roots);
              } else {
                await visitor(root, this.helpers);
              }
            } catch (e) {
              throw this.handleError(e);
            }
          }
        }
      }
      this.processed = true;
      return this.stringify();
    }
    runOnRoot(plugin) {
      this.result.lastPlugin = plugin;
      try {
        if (typeof plugin === "object" && plugin.Once) {
          if (this.result.root.type === "document") {
            let roots = this.result.root.nodes.map((root) => plugin.Once(root, this.helpers));
            if (isPromise(roots[0])) {
              return Promise.all(roots);
            }
            return roots;
          }
          return plugin.Once(this.result.root, this.helpers);
        } else if (typeof plugin === "function") {
          return plugin(this.result.root, this.result);
        }
      } catch (error) {
        throw this.handleError(error);
      }
    }
    stringify() {
      if (this.error)
        throw this.error;
      if (this.stringified)
        return this.result;
      this.stringified = true;
      this.sync();
      let opts = this.result.opts;
      let str = stringify;
      if (opts.syntax)
        str = opts.syntax.stringify;
      if (opts.stringifier)
        str = opts.stringifier;
      if (str.stringify)
        str = str.stringify;
      let rootSource = this.result.root.source;
      if (opts.map === undefined && !(rootSource && rootSource.input && rootSource.input.map)) {
        let result = "";
        str(this.result.root, (i) => {
          result += i;
        });
        this.result.css = result;
        return this.result;
      }
      let map = new MapGenerator(str, this.result.root, this.result.opts);
      let data = map.generate();
      this.result.css = data[0];
      this.result.map = data[1];
      return this.result;
    }
    sync() {
      if (this.error)
        throw this.error;
      if (this.processed)
        return this.result;
      this.processed = true;
      if (this.processing) {
        throw this.getAsyncError();
      }
      for (let plugin of this.plugins) {
        let promise = this.runOnRoot(plugin);
        if (isPromise(promise)) {
          throw this.getAsyncError();
        }
      }
      this.prepareVisitors();
      if (this.hasListener) {
        let root = this.result.root;
        while (!root[isClean]) {
          root[isClean] = true;
          this.walkSync(root);
        }
        if (this.listeners.OnceExit) {
          if (root.type === "document") {
            for (let subRoot of root.nodes) {
              this.visitSync(this.listeners.OnceExit, subRoot);
            }
          } else {
            this.visitSync(this.listeners.OnceExit, root);
          }
        }
      }
      return this.result;
    }
    then(onFulfilled, onRejected) {
      if (true) {
        if (!("from" in this.opts)) {
          warnOnce("Without `from` option PostCSS could generate wrong source map " + "and will not find Browserslist config. Set it to CSS file path " + "or to `undefined` to prevent this warning.");
        }
      }
      return this.async().then(onFulfilled, onRejected);
    }
    toString() {
      return this.css;
    }
    visitSync(visitors, node) {
      for (let [plugin, visitor] of visitors) {
        this.result.lastPlugin = plugin;
        let promise;
        try {
          promise = visitor(node, this.helpers);
        } catch (e) {
          throw this.handleError(e, node.proxyOf);
        }
        if (node.type !== "root" && node.type !== "document" && !node.parent) {
          return true;
        }
        if (isPromise(promise)) {
          throw this.getAsyncError();
        }
      }
    }
    visitTick(stack) {
      let visit = stack[stack.length - 1];
      let { node, visitors } = visit;
      if (node.type !== "root" && node.type !== "document" && !node.parent) {
        stack.pop();
        return;
      }
      if (visitors.length > 0 && visit.visitorIndex < visitors.length) {
        let [plugin, visitor] = visitors[visit.visitorIndex];
        visit.visitorIndex += 1;
        if (visit.visitorIndex === visitors.length) {
          visit.visitors = [];
          visit.visitorIndex = 0;
        }
        this.result.lastPlugin = plugin;
        try {
          return visitor(node.toProxy(), this.helpers);
        } catch (e) {
          throw this.handleError(e, node);
        }
      }
      if (visit.iterator !== 0) {
        let iterator = visit.iterator;
        if (visit.descending) {
          visit.descending = false;
          node.indexes[iterator] += 1;
        }
        let child;
        while (child = node.nodes[node.indexes[iterator]]) {
          if (!child[isClean]) {
            child[isClean] = true;
            visit.descending = true;
            stack.push(toStack(child));
            return;
          }
          node.indexes[iterator] += 1;
        }
        visit.iterator = 0;
        delete node.indexes[iterator];
      }
      let events = visit.events;
      while (visit.eventIndex < events.length) {
        let event = events[visit.eventIndex];
        visit.eventIndex += 1;
        if (event === CHILDREN) {
          if (node.nodes && node.nodes.length) {
            node[isClean] = true;
            visit.iterator = node.getIterator();
          }
          return;
        } else if (this.listeners[event]) {
          visit.visitors = this.listeners[event];
          return;
        }
      }
      stack.pop();
    }
    walkSync(node) {
      node[isClean] = true;
      let stack = [{ eventIndex: 0, events: getEvents(node), iterator: 0, node }];
      while (stack.length > 0) {
        let visit = stack[stack.length - 1];
        let visitNode = visit.node;
        if (visit.iterator !== 0) {
          let iterator = visit.iterator;
          if (visit.descending) {
            visit.descending = false;
            visitNode.indexes[iterator] += 1;
          }
          let child;
          let descended = false;
          while (child = visitNode.nodes[visitNode.indexes[iterator]]) {
            if (!child[isClean]) {
              child[isClean] = true;
              visit.descending = true;
              stack.push({
                eventIndex: 0,
                events: getEvents(child),
                iterator: 0,
                node: child
              });
              descended = true;
              break;
            }
            visitNode.indexes[iterator] += 1;
          }
          if (descended)
            continue;
          visit.iterator = 0;
          delete visitNode.indexes[iterator];
        }
        if (visit.eventIndex < visit.events.length) {
          let event = visit.events[visit.eventIndex];
          visit.eventIndex += 1;
          if (event === CHILDREN) {
            if (visitNode.nodes && visitNode.nodes.length) {
              visit.iterator = visitNode.getIterator();
            }
          } else {
            let visitors = this.listeners[event];
            if (visitors) {
              if (this.visitSync(visitors, visitNode.toProxy()))
                stack.pop();
            }
          }
          continue;
        }
        stack.pop();
      }
    }
    warnings() {
      return this.sync().warnings();
    }
  }
  LazyResult.registerPostcss = (dependant) => {
    postcss = dependant;
  };
  module.exports = LazyResult;
  LazyResult.default = LazyResult;
  Root.registerLazyResult(LazyResult);
  Document.registerLazyResult(LazyResult);
});

// /zveltio-extension/node_modules/postcss/lib/no-work-result.js
var require_no_work_result = __commonJS(function(exports, module) {
  var MapGenerator = require_map_generator();
  var parse = require_parse();
  var Result = require_result();
  var stringify = require_stringify();
  var warnOnce = require_warn_once();

  class NoWorkResult {
    get content() {
      return this.result.css;
    }
    get css() {
      return this.result.css;
    }
    get map() {
      return this.result.map;
    }
    get messages() {
      return [];
    }
    get opts() {
      return this.result.opts;
    }
    get processor() {
      return this.result.processor;
    }
    get root() {
      if (this._root) {
        return this._root;
      }
      let root;
      let parser = parse;
      try {
        root = parser(this._css, this._opts);
      } catch (error) {
        this.error = error;
      }
      if (this.error) {
        throw this.error;
      } else {
        this._root = root;
        return root;
      }
    }
    get [Symbol.toStringTag]() {
      return "NoWorkResult";
    }
    constructor(processor, css, opts) {
      css = css.toString();
      this.stringified = false;
      this._processor = processor;
      this._css = css;
      this._opts = opts;
      this._map = undefined;
      let str = stringify;
      this.result = new Result(this._processor, undefined, this._opts);
      this.result.css = css;
      let self2 = this;
      Object.defineProperty(this.result, "root", {
        get() {
          return self2.root;
        }
      });
      let map = new MapGenerator(str, undefined, this._opts, css);
      if (map.isMap()) {
        let [generatedCSS, generatedMap] = map.generate();
        if (generatedCSS) {
          this.result.css = generatedCSS;
        }
        if (generatedMap) {
          this.result.map = generatedMap;
        }
      } else {
        map.clearAnnotation();
        this.result.css = map.css;
      }
    }
    async() {
      if (this.error)
        return Promise.reject(this.error);
      return Promise.resolve(this.result);
    }
    catch(onRejected) {
      return this.async().catch(onRejected);
    }
    finally(onFinally) {
      return this.async().finally(onFinally);
    }
    sync() {
      if (this.error)
        throw this.error;
      return this.result;
    }
    then(onFulfilled, onRejected) {
      if (true) {
        if (!("from" in this._opts)) {
          warnOnce("Without `from` option PostCSS could generate wrong source map " + "and will not find Browserslist config. Set it to CSS file path " + "or to `undefined` to prevent this warning.");
        }
      }
      return this.async().then(onFulfilled, onRejected);
    }
    toString() {
      return this._css;
    }
    warnings() {
      return [];
    }
  }
  module.exports = NoWorkResult;
  NoWorkResult.default = NoWorkResult;
});

// /zveltio-extension/node_modules/postcss/lib/processor.js
var require_processor = __commonJS(function(exports, module) {
  var Document = require_document();
  var LazyResult = require_lazy_result();
  var NoWorkResult = require_no_work_result();
  var Root = require_root();

  class Processor {
    constructor(plugins = []) {
      this.version = "8.5.32";
      this.plugins = this.normalize(plugins);
    }
    normalize(plugins) {
      let normalized = [];
      for (let i of plugins) {
        if (i.postcss === true) {
          i = i();
        } else if (i.postcss) {
          i = i.postcss;
        }
        if (typeof i === "object" && Array.isArray(i.plugins)) {
          normalized = normalized.concat(i.plugins);
        } else if (typeof i === "object" && i.postcssPlugin) {
          normalized.push(i);
        } else if (typeof i === "function") {
          normalized.push(i);
        } else if (typeof i === "object" && (i.parse || i.stringify)) {
          if (true) {
            throw new Error("PostCSS syntaxes cannot be used as plugins. Instead, please use " + "one of the syntax/parser/stringifier options as outlined " + "in your PostCSS runner documentation.");
          }
        } else {
          throw new Error(i + " is not a PostCSS plugin");
        }
      }
      return normalized;
    }
    process(css, opts = {}) {
      if (!this.plugins.length && !opts.parser && !opts.stringifier && !opts.syntax) {
        return new NoWorkResult(this, css, opts);
      } else {
        return new LazyResult(this, css, opts);
      }
    }
    use(plugin) {
      this.plugins = this.plugins.concat(this.normalize([plugin]));
      return this;
    }
  }
  module.exports = Processor;
  Processor.default = Processor;
  Root.registerProcessor(Processor);
  Document.registerProcessor(Processor);
});

// /zveltio-extension/node_modules/postcss/lib/postcss.js
var require_postcss = __commonJS(function(exports, module) {
  var AtRule = require_at_rule();
  var Comment = require_comment();
  var Container = require_container();
  var CssSyntaxError = require_css_syntax_error();
  var Declaration = require_declaration();
  var Document = require_document();
  var fromJSON = require_fromJSON();
  var Input = require_input();
  var LazyResult = require_lazy_result();
  var list = require_list();
  var Node = require_node();
  var parse = require_parse();
  var Processor = require_processor();
  var Result = require_result();
  var Root = require_root();
  var Rule = require_rule();
  var stringify = require_stringify();
  var Warning = require_warning();
  function postcss(...plugins) {
    if (plugins.length === 1 && Array.isArray(plugins[0])) {
      plugins = plugins[0];
    }
    return new Processor(plugins);
  }
  postcss.plugin = function plugin(name, initializer) {
    let warningPrinted = false;
    function creator(...args) {
      if (console && console.warn && !warningPrinted) {
        warningPrinted = true;
        console.warn(name + `: postcss.plugin was deprecated. Migration guide:
` + "https://evilmartians.com/chronicles/postcss-8-plugin-migration");
        if (process.env.LANG && process.env.LANG.startsWith("zh")) {
          console.warn(name + `: 里面 postcss.plugin 被弃用. 迁移指南:
` + "https://www.w3ctech.com/topic/2226");
        }
      }
      let transformer = initializer(...args);
      transformer.postcssPlugin = name;
      transformer.postcssVersion = new Processor().version;
      return transformer;
    }
    let cache;
    Object.defineProperty(creator, "postcss", {
      get() {
        if (!cache)
          cache = creator();
        return cache;
      }
    });
    creator.process = function(css, processOpts, pluginOpts) {
      return postcss([creator(pluginOpts)]).process(css, processOpts);
    };
    return creator;
  };
  postcss.stringify = stringify;
  postcss.parse = parse;
  postcss.fromJSON = fromJSON;
  postcss.list = list;
  postcss.comment = (defaults) => new Comment(defaults);
  postcss.atRule = (defaults) => new AtRule(defaults);
  postcss.decl = (defaults) => new Declaration(defaults);
  postcss.rule = (defaults) => new Rule(defaults);
  postcss.root = (defaults) => new Root(defaults);
  postcss.document = (defaults) => new Document(defaults);
  postcss.CssSyntaxError = CssSyntaxError;
  postcss.Declaration = Declaration;
  postcss.Container = Container;
  postcss.Processor = Processor;
  postcss.Document = Document;
  postcss.Comment = Comment;
  postcss.Warning = Warning;
  postcss.AtRule = AtRule;
  postcss.Result = Result;
  postcss.Input = Input;
  postcss.Rule = Rule;
  postcss.Root = Root;
  postcss.Node = Node;
  LazyResult.registerPostcss(postcss);
  module.exports = postcss;
  postcss.default = postcss;
});

// /zveltio-extension/node_modules/postcss/lib/postcss.mjs
var exports_postcss = {};
__export(exports_postcss, {
  parse: () => parse
});
var import_postcss, stringify2, fromJSON, plugin, parse, list, document, comment, atRule, rule, decl, root, CssSyntaxError, Declaration, Container, Processor, Document, Comment2, Warning, AtRule, Result, Input, Rule, Root2, Node;
var init_postcss = __esm(() => {
  import_postcss = __toESM(require_postcss(), 1);
  stringify2 = import_postcss.default.stringify;
  fromJSON = import_postcss.default.fromJSON;
  plugin = import_postcss.default.plugin;
  parse = import_postcss.default.parse;
  list = import_postcss.default.list;
  document = import_postcss.default.document;
  comment = import_postcss.default.comment;
  atRule = import_postcss.default.atRule;
  rule = import_postcss.default.rule;
  decl = import_postcss.default.decl;
  root = import_postcss.default.root;
  CssSyntaxError = import_postcss.default.CssSyntaxError;
  Declaration = import_postcss.default.Declaration;
  Container = import_postcss.default.Container;
  Processor = import_postcss.default.Processor;
  Document = import_postcss.default.Document;
  Comment2 = import_postcss.default.Comment;
  Warning = import_postcss.default.Warning;
  AtRule = import_postcss.default.AtRule;
  Result = import_postcss.default.Result;
  Input = import_postcss.default.Input;
  Rule = import_postcss.default.Rule;
  Root2 = import_postcss.default.Root;
  Node = import_postcss.default.Node;
});

// /zveltio-extension/node_modules/dayjs/dayjs.min.js
var require_dayjs_min = __commonJS(function(exports, module) {
  (function(t, e) {
    typeof exports == "object" && typeof module != "undefined" ? module.exports = e() : typeof define == "function" && define.amd ? define(e) : (t = typeof globalThis != "undefined" ? globalThis : t || self).dayjs = e();
  })(exports, function() {
    var t = 1000, e = 60000, n = 3600000, r = "millisecond", i = "second", s = "minute", u = "hour", a = "day", o = "week", c = "month", f = "quarter", h = "year", d = "date", l = "Invalid Date", $ = /^(\d{4})[-/]?(\d{1,2})?[-/]?(\d{0,2})[Tt\s]*(\d{1,2})?:?(\d{1,2})?:?(\d{1,2})?[.:]?(\d+)?$/, y = /\[([^\]]+)]|YYYY|YY|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g, M = { name: "en", weekdays: "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"), months: "January_February_March_April_May_June_July_August_September_October_November_December".split("_"), ordinal: function(t) {
      var e = ["th", "st", "nd", "rd"], n = t % 100;
      return "[" + t + (e[(n - 20) % 10] || e[n] || e[0]) + "]";
    } }, m = function(t, e, n) {
      var r = String(t);
      return !r || r.length >= e ? t : "" + Array(e + 1 - r.length).join(n) + t;
    }, v = { s: m, z: function(t) {
      var e = -t.utcOffset(), n = Math.abs(e), r = Math.floor(n / 60), i = n % 60;
      return (e <= 0 ? "+" : "-") + m(r, 2, "0") + ":" + m(i, 2, "0");
    }, m: function t(e, n) {
      if (e.date() < n.date())
        return -t(n, e);
      var r = 12 * (n.year() - e.year()) + (n.month() - e.month()), i = e.clone().add(r, c), s = n - i < 0, u = e.clone().add(r + (s ? -1 : 1), c);
      return +(-(r + (n - i) / (s ? i - u : u - i)) || 0);
    }, a: function(t) {
      return t < 0 ? Math.ceil(t) || 0 : Math.floor(t);
    }, p: function(t) {
      return { M: c, y: h, w: o, d: a, D: d, h: u, m: s, s: i, ms: r, Q: f }[t] || String(t || "").toLowerCase().replace(/s$/, "");
    }, u: function(t) {
      return t === undefined;
    } }, g = "en", D = {};
    D[g] = M;
    var p = "$isDayjsObject", S = function(t) {
      return t instanceof _ || !(!t || !t[p]);
    }, w = function t(e, n, r) {
      var i;
      if (!e)
        return g;
      if (typeof e == "string") {
        var s = e.toLowerCase();
        D[s] && (i = s), n && (D[s] = n, i = s);
        var u = e.split("-");
        if (!i && u.length > 1)
          return t(u[0]);
      } else {
        var a = e.name;
        D[a] = e, i = a;
      }
      return !r && i && (g = i), i || !r && g;
    }, O = function(t, e) {
      if (S(t))
        return t.clone();
      var n = typeof e == "object" ? e : {};
      return n.date = t, n.args = arguments, new _(n);
    }, b = v;
    b.l = w, b.i = S, b.w = function(t, e) {
      return O(t, { locale: e.$L, utc: e.$u, x: e.$x, $offset: e.$offset });
    };
    var _ = function() {
      function M(t) {
        this.$L = w(t.locale, null, true), this.parse(t), this.$x = this.$x || t.x || {}, this[p] = true;
      }
      var m = M.prototype;
      return m.parse = function(t) {
        this.$d = function(t) {
          var { date: e, utc: n } = t;
          if (e === null)
            return new Date(NaN);
          if (b.u(e))
            return new Date;
          if (e instanceof Date)
            return new Date(e);
          if (typeof e == "string" && !/Z$/i.test(e)) {
            var r = e.match($);
            if (r) {
              var i = r[2] - 1 || 0, s = (r[7] || "0").substring(0, 3);
              return n ? new Date(Date.UTC(r[1], i, r[3] || 1, r[4] || 0, r[5] || 0, r[6] || 0, s)) : new Date(r[1], i, r[3] || 1, r[4] || 0, r[5] || 0, r[6] || 0, s);
            }
          }
          return new Date(e);
        }(t), this.init();
      }, m.init = function() {
        var t = this.$d;
        this.$y = t.getFullYear(), this.$M = t.getMonth(), this.$D = t.getDate(), this.$W = t.getDay(), this.$H = t.getHours(), this.$m = t.getMinutes(), this.$s = t.getSeconds(), this.$ms = t.getMilliseconds();
      }, m.$utils = function() {
        return b;
      }, m.isValid = function() {
        return !(this.$d.toString() === l);
      }, m.isSame = function(t, e) {
        var n = O(t);
        return this.startOf(e) <= n && n <= this.endOf(e);
      }, m.isAfter = function(t, e) {
        return O(t) < this.startOf(e);
      }, m.isBefore = function(t, e) {
        return this.endOf(e) < O(t);
      }, m.$g = function(t, e, n) {
        return b.u(t) ? this[e] : this.set(n, t);
      }, m.unix = function() {
        return Math.floor(this.valueOf() / 1000);
      }, m.valueOf = function() {
        return this.$d.getTime();
      }, m.startOf = function(t, e) {
        var n = this, r = !!b.u(e) || e, f = b.p(t), l = function(t, e) {
          var i = b.w(n.$u ? Date.UTC(n.$y, e, t) : new Date(n.$y, e, t), n);
          return r ? i : i.endOf(a);
        }, $ = function(t, e) {
          return b.w(n.toDate()[t].apply(n.toDate("s"), (r ? [0, 0, 0, 0] : [23, 59, 59, 999]).slice(e)), n);
        }, y = this.$W, M = this.$M, m = this.$D, v = "set" + (this.$u ? "UTC" : "");
        switch (f) {
          case h:
            return r ? l(1, 0) : l(31, 11);
          case c:
            return r ? l(1, M) : l(0, M + 1);
          case o:
            var g = this.$locale().weekStart || 0, D = (y < g ? y + 7 : y) - g;
            return l(r ? m - D : m + (6 - D), M);
          case a:
          case d:
            return $(v + "Hours", 0);
          case u:
            return $(v + "Minutes", 1);
          case s:
            return $(v + "Seconds", 2);
          case i:
            return $(v + "Milliseconds", 3);
          default:
            return this.clone();
        }
      }, m.endOf = function(t) {
        return this.startOf(t, false);
      }, m.$set = function(t, e) {
        var n, o = b.p(t), f = "set" + (this.$u ? "UTC" : ""), l = (n = {}, n[a] = f + "Date", n[d] = f + "Date", n[c] = f + "Month", n[h] = f + "FullYear", n[u] = f + "Hours", n[s] = f + "Minutes", n[i] = f + "Seconds", n[r] = f + "Milliseconds", n)[o], $ = o === a ? this.$D + (e - this.$W) : e;
        if (o === c || o === h) {
          var y = this.clone().set(d, 1);
          y.$d[l]($), y.init(), this.$d = y.set(d, Math.min(this.$D, y.daysInMonth())).$d;
        } else
          l && this.$d[l]($);
        return this.init(), this;
      }, m.set = function(t, e) {
        return this.clone().$set(t, e);
      }, m.get = function(t) {
        return this[b.p(t)]();
      }, m.add = function(r, f) {
        var d, l = this;
        r = Number(r);
        var $ = b.p(f), y = function(t) {
          var e = O(l);
          return b.w(e.date(e.date() + Math.round(t * r)), l);
        };
        if ($ === c)
          return this.set(c, this.$M + r);
        if ($ === h)
          return this.set(h, this.$y + r);
        if ($ === a)
          return y(1);
        if ($ === o)
          return y(7);
        var M = (d = {}, d[s] = e, d[u] = n, d[i] = t, d)[$] || 1, m = this.$d.getTime() + r * M;
        return b.w(m, this);
      }, m.subtract = function(t, e) {
        return this.add(-1 * t, e);
      }, m.format = function(t) {
        var e = this, n = this.$locale();
        if (!this.isValid())
          return n.invalidDate || l;
        var r = t || "YYYY-MM-DDTHH:mm:ssZ", i = b.z(this), s = this.$H, u = this.$m, a = this.$M, { weekdays: o, months: c, meridiem: f } = n, h = function(t, n, i, s) {
          return t && (t[n] || t(e, r)) || i[n].slice(0, s);
        }, d = function(t) {
          return b.s(s % 12 || 12, t, "0");
        }, $ = f || function(t, e, n) {
          var r = t < 12 ? "AM" : "PM";
          return n ? r.toLowerCase() : r;
        };
        return r.replace(y, function(t, r) {
          return r || function(t) {
            switch (t) {
              case "YY":
                return String(e.$y).slice(-2);
              case "YYYY":
                return b.s(e.$y, 4, "0");
              case "M":
                return a + 1;
              case "MM":
                return b.s(a + 1, 2, "0");
              case "MMM":
                return h(n.monthsShort, a, c, 3);
              case "MMMM":
                return h(c, a);
              case "D":
                return e.$D;
              case "DD":
                return b.s(e.$D, 2, "0");
              case "d":
                return String(e.$W);
              case "dd":
                return h(n.weekdaysMin, e.$W, o, 2);
              case "ddd":
                return h(n.weekdaysShort, e.$W, o, 3);
              case "dddd":
                return o[e.$W];
              case "H":
                return String(s);
              case "HH":
                return b.s(s, 2, "0");
              case "h":
                return d(1);
              case "hh":
                return d(2);
              case "a":
                return $(s, u, true);
              case "A":
                return $(s, u, false);
              case "m":
                return String(u);
              case "mm":
                return b.s(u, 2, "0");
              case "s":
                return String(e.$s);
              case "ss":
                return b.s(e.$s, 2, "0");
              case "SSS":
                return b.s(e.$ms, 3, "0");
              case "Z":
                return i;
            }
            return null;
          }(t) || i.replace(":", "");
        });
      }, m.utcOffset = function() {
        return 15 * -Math.round(this.$d.getTimezoneOffset() / 15);
      }, m.diff = function(r, d, l) {
        var $, y = this, M = b.p(d), m = O(r), v = (m.utcOffset() - this.utcOffset()) * e, g = this - m, D = function() {
          return b.m(y, m);
        };
        switch (M) {
          case h:
            $ = D() / 12;
            break;
          case c:
            $ = D();
            break;
          case f:
            $ = D() / 3;
            break;
          case o:
            $ = (g - v) / 604800000;
            break;
          case a:
            $ = (g - v) / 86400000;
            break;
          case u:
            $ = g / n;
            break;
          case s:
            $ = g / e;
            break;
          case i:
            $ = g / t;
            break;
          default:
            $ = g;
        }
        return l ? $ : b.a($);
      }, m.daysInMonth = function() {
        return this.endOf(c).$D;
      }, m.$locale = function() {
        return D[this.$L];
      }, m.locale = function(t, e) {
        if (!t)
          return this.$L;
        var n = this.clone(), r = w(t, e, true);
        return r && (n.$L = r), n;
      }, m.clone = function() {
        return b.w(this.$d, this);
      }, m.toDate = function() {
        return new Date(this.valueOf());
      }, m.toJSON = function() {
        return this.isValid() ? this.toISOString() : null;
      }, m.toISOString = function() {
        return this.$d.toISOString();
      }, m.toString = function() {
        return this.$d.toUTCString();
      }, M;
    }(), Y = _.prototype;
    return O.prototype = Y, [["$ms", r], ["$s", i], ["$m", s], ["$H", u], ["$W", a], ["$M", c], ["$y", h], ["$D", d]].forEach(function(t) {
      Y[t[1]] = function(e) {
        return this.$g(e, t[0], t[1]);
      };
    }), O.extend = function(t, e) {
      return t.$i || (t(e, _, O), t.$i = true), O;
    }, O.locale = w, O.isDayjs = S, O.unix = function(t) {
      return O(1000 * t);
    }, O.en = D[g], O.Ls = D, O.p = {}, O;
  });
});

// /zveltio-extension/node_modules/launder/index.js
var require_launder = __commonJS(function(exports, module) {
  var dayjs = require_dayjs_min();
  function cleanHref(href) {
    href = href.replace(/[\x00-\x20]+/g, "");
    while (true) {
      const firstIndex = href.indexOf("<!--");
      if (firstIndex === -1) {
        break;
      }
      const lastIndex = href.indexOf("-->", firstIndex + 4);
      if (lastIndex === -1) {
        break;
      }
      href = href.substring(0, firstIndex) + href.substring(lastIndex + 3);
    }
    return href;
  }
  function naughtyHref(href, options) {
    options = options || {};
    const allowedSchemes = options.allowedSchemes || ["http", "https", "ftp", "mailto", "tel", "sms"];
    const allowProtocolRelative = options.allowProtocolRelative !== false;
    if (typeof href !== "string") {
      return false;
    }
    href = cleanHref(href);
    const matches = href.match(/^([a-zA-Z][a-zA-Z0-9.\-+]*):/);
    if (!matches) {
      if (href.match(/^[/\\]{2}/)) {
        return !allowProtocolRelative;
      }
      return false;
    }
    const scheme = matches[1].toLowerCase();
    return allowedSchemes.indexOf(scheme) === -1;
  }
  module.exports = function(options) {
    const self2 = {};
    self2.options = options || {};
    self2.filterTag = self2.options.filterTag || function(tag) {
      tag = tag.trim();
      return tag.toLowerCase();
    };
    self2.string = function(s, def) {
      if (typeof s !== "string") {
        if (typeof s === "number" || typeof s === "boolean") {
          s += "";
        } else {
          s = "";
        }
      }
      s = s.trim();
      if (def !== undefined) {
        if (s === "") {
          s = def;
        }
      }
      return s;
    };
    self2.strings = function(strings) {
      if (!Array.isArray(strings)) {
        return [];
      }
      return strings.map(function(s) {
        return self2.string(s);
      });
    };
    self2.integer = function(i, def, min, max) {
      if (def === undefined) {
        def = 0;
      }
      if (typeof i === "number") {
        i = Math.floor(i);
      } else {
        try {
          i = parseInt(i, 10);
          if (isNaN(i)) {
            i = def;
          }
        } catch (e) {
          i = def;
        }
      }
      if (typeof min === "number" && i < min) {
        i = min;
      }
      if (typeof max === "number" && i > max) {
        i = max;
      }
      return i;
    };
    self2.padInteger = function(i, places) {
      let s = i + "";
      while (s.length < places) {
        s = "0" + s;
      }
      return s;
    };
    self2.float = function(i, def, min, max) {
      if (def === undefined) {
        def = 0;
      }
      if (!(typeof i === "number")) {
        try {
          i = parseFloat(i, 10);
          if (isNaN(i)) {
            i = def;
          }
        } catch (e) {
          i = def;
        }
      }
      if (typeof min === "number" && i < min) {
        i = min;
      }
      if (typeof max === "number" && i > max) {
        i = max;
      }
      return i;
    };
    self2.naughtyHref = naughtyHref;
    self2.url = function(s, def, httpsFix) {
      s = self2.string(s, def);
      if (s === def) {
        return s;
      }
      s = cleanHref(s);
      if (naughtyHref(s)) {
        return def;
      }
      s = fixUrl(s);
      if (s === null) {
        return def;
      }
      return s;
      function fixUrl(href) {
        if (href.match(/^(((https?|ftp):\/\/)|((mailto|tel|sms):)|#|([^/.]+)?\/|[^/.]+$)/)) {
          return href;
        } else if (href.match(/^[^/.]+\.[^/.]+/)) {
          const protocol = httpsFix ? "https://" : "http://";
          return protocol + href;
        } else {
          return null;
        }
      }
    };
    self2.select = function(s, choices, def) {
      s = self2.string(s);
      if (!choices || !choices.length) {
        return def;
      }
      let choice;
      if (typeof choices[0] === "object") {
        choice = choices.find(function(choice) {
          if (choice.value === null || choice.value === undefined) {
            return false;
          }
          return choice.value.toString() === s;
        });
        if (choice != null) {
          return choice.value;
        }
        return def;
      }
      choice = choices.find(function(choice) {
        if (choice === null || choice === undefined) {
          return false;
        }
        return choice.toString() === s;
      });
      if (choice !== undefined) {
        return choice;
      }
      return def;
    };
    self2.boolean = function(b, def) {
      if (b === true) {
        return true;
      }
      if (b === false) {
        return false;
      }
      b = self2.string(b, def);
      if (b === def) {
        if (b === undefined) {
          return false;
        }
        return b;
      }
      b = b.toLowerCase().charAt(0);
      if (b === "" || b === "n" || b === "0" || b === "f") {
        return false;
      }
      if (b === "t" || b === "y" || b === "1") {
        return true;
      }
      return false;
    };
    self2.addBooleanFilterToCriteria = function(options, name, criteria, def) {
      if (def === undefined) {
        def = null;
      }
      let value = typeof options === "object" && options !== null ? options[name] : options;
      value = value === undefined ? def : value;
      value = self2.booleanOrNull(value);
      if (value === null) {} else if (!value) {
        criteria[name] = { $ne: true };
      } else {
        criteria[name] = true;
      }
    };
    self2.booleanOrNull = function(b, def) {
      if (b === true) {
        return b;
      }
      if (b === false) {
        return b;
      }
      if (b === null) {
        return b;
      }
      b = self2.string(b, def);
      if (b === def) {
        if (def === undefined) {
          return null;
        }
        return b;
      }
      if (b === "null") {
        return null;
      }
      b = b.toLowerCase().charAt(0);
      if (b === "" || b === "n" || b === "0" || b === "f") {
        return false;
      }
      if (b === "t" || b === "y" || b === "1") {
        return true;
      }
      if (b === "a") {
        return null;
      }
      return def;
    };
    self2.date = function(date, def, now) {
      let components;
      function returnDefault() {
        if (def === undefined) {
          def = dayjs().format("YYYY-MM-DD");
        }
        return def;
      }
      if (typeof date === "string") {
        if (date.match(/\//)) {
          components = date.split("/");
          if (components.length === 2) {
            return (now || new Date).getFullYear() + "-" + self2.padInteger(components[0], 2) + "-" + self2.padInteger(components[1], 2);
          } else if (components.length === 3) {
            if (components[2] < 100) {
              const d = now || new Date;
              const nowYear = d.getFullYear() % 100;
              const nowCentury = d.getFullYear() - nowYear;
              let theirYear = parseInt(components[2]) + nowCentury;
              if (theirYear - d.getFullYear() > 50) {
                theirYear -= 100;
              }
              components[2] = theirYear;
            }
            return self2.padInteger(components[2], 4) + "-" + self2.padInteger(components[0], 2) + "-" + self2.padInteger(components[1], 2);
          } else {
            return returnDefault();
          }
        } else if (date.match(/-/)) {
          components = date.split("-");
          if (components.length === 2) {
            return (now || new Date).getFullYear() + "-" + self2.padInteger(components[0], 2) + "-" + self2.padInteger(components[1], 2);
          } else if (components.length === 3) {
            return self2.padInteger(components[0], 4) + "-" + self2.padInteger(components[1], 2) + "-" + self2.padInteger(components[2], 2);
          } else {
            return returnDefault();
          }
        }
      }
      try {
        if (date === null) {
          return returnDefault();
        }
        date = now || new Date(date);
        if (isNaN(date.getTime())) {
          return returnDefault();
        }
        return date.getFullYear() + "-" + self2.padInteger(date.getMonth() + 1, 2) + "-" + self2.padInteger(date.getDate(), 2);
      } catch (e) {
        return returnDefault();
      }
    };
    self2.formatDate = function(date) {
      return dayjs(date).format("YYYY-MM-DD");
    };
    self2.time = function(time, def) {
      time = self2.string(time).toLowerCase();
      time = time.trim();
      const components = time.match(/^(\d+)([:|.](\d+))?([:|.](\d+))?\s*(am|pm|AM|PM|a|p|A|M)?$/);
      if (components) {
        let hours = parseInt(components[1], 10);
        const minutes = components[3] !== undefined ? parseInt(components[3], 10) : 0;
        const seconds = components[5] !== undefined ? parseInt(components[5], 10) : 0;
        let ampm = components[6] ? components[6].toLowerCase() : components[6];
        ampm = ampm && ampm.charAt(0);
        if (hours === 12 && ampm === "a") {
          hours -= 12;
        } else if (hours === 12 && ampm === "p") {} else if (ampm === "p") {
          hours += 12;
        }
        if (hours === 24 || hours === "24") {
          hours = 0;
        }
        return self2.padInteger(hours, 2) + ":" + self2.padInteger(minutes, 2) + ":" + self2.padInteger(seconds, 2);
      } else {
        if (def !== undefined) {
          return def;
        }
        return dayjs().format("HH:mm");
      }
    };
    self2.formatTime = function(date) {
      return dayjs(date).format("HH:mm:ss");
    };
    self2.tags = function(tags, filter) {
      if (typeof tags === "string") {
        tags = tags.split(/,\s*/);
      }
      if (!Array.isArray(tags)) {
        return [];
      }
      const strings = tags.map((tag) => self2.string(tag));
      const rewritten = strings.map(filter || self2.filterTag);
      const filtered = rewritten.filter((tag) => tag.length > 0);
      return filtered;
    };
    self2.idRegExp = self2.options.idRegExp || /^[A-Za-z0-9_]+$/;
    self2.id = function(s, def) {
      const id = self2.string(s, def);
      if (id === def) {
        return id;
      }
      if (!id.match(self2.idRegExp)) {
        return def;
      }
      return id;
    };
    self2.ids = function(ids) {
      if (!Array.isArray(ids)) {
        return [];
      }
      const result = ids.filter(function(id) {
        return self2.id(id) !== undefined;
      });
      return result;
    };
    return self2;
  };
  module.exports.naughtyHref = naughtyHref;
});

// /zveltio-extension/node_modules/sanitize-html/index.js
var require_sanitize_html = __commonJS(function(exports, module) {
  var htmlparser = (init_dist3(), {});
  var escapeStringRegexp = require_escape_string_regexp();
  init_is_plain_object();
  var parseSrcset = require_parse_srcset();
  var { parse: postcssParse } = (init_postcss(), __toCommonJS(exports_postcss));
  var { naughtyHref: launderNaughtyHref } = require_launder();
  var mediaTags = [
    "img",
    "audio",
    "video",
    "picture",
    "svg",
    "object",
    "map",
    "iframe",
    "embed"
  ];
  var vulnerableTags = ["script", "style"];
  var svgAnimationTags = [
    "animate",
    "animatecolor",
    "animatemotion",
    "animatetransform",
    "set"
  ];
  var alwaysUrlAttributes = ["href"];
  var severities = ["debug", "info", "warn", "error"];
  function loggerFor(options) {
    const source = options && options.logger || console;
    const logger = {};
    for (const severity of severities) {
      logger[severity] = typeof source[severity] === "function" ? (...args) => source[severity](...args) : (...args) => console[severity](...args);
    }
    return logger;
  }
  function each(obj, cb) {
    if (obj) {
      Object.keys(obj).forEach(function(key) {
        cb(obj[key], key);
      });
    }
  }
  function has(obj, key) {
    return {}.hasOwnProperty.call(obj, key);
  }
  function mergeClasses(specific, wildcard) {
    if (!Array.isArray(specific) || !Array.isArray(wildcard)) {
      return wildcard;
    }
    return specific.concat(wildcard);
  }
  function mergeStyles(specific, wildcard) {
    const merged = Object.create(null);
    for (const rules of [specific, wildcard]) {
      for (const prop of Object.keys(rules)) {
        merged[prop] = has(merged, prop) ? merged[prop].concat(rules[prop]) : rules[prop];
      }
    }
    return merged;
  }
  function filter(a, cb) {
    const n = [];
    each(a, function(v) {
      if (cb(v)) {
        n.push(v);
      }
    });
    return n;
  }
  function isEmptyObject(obj) {
    for (const key in obj) {
      if (has(obj, key)) {
        return false;
      }
    }
    return true;
  }
  function stringifySrcset(parsedSrcset) {
    return parsedSrcset.map(function(part) {
      if (!part.url) {
        throw new Error("URL missing");
      }
      return part.url + (part.w ? ` ${part.w}w` : "") + (part.h ? ` ${part.h}h` : "") + (part.d ? ` ${part.d}x` : "");
    }).join(", ");
  }
  module.exports = sanitizeHtml;
  var VALID_HTML_ATTRIBUTE_NAME = /^[^\0\t\n\f\r /<=>]+$/;
  var MAX_IFRAME_FALLBACK_DEPTH = 8;
  function sanitizeHtml(html, options, _fallback) {
    if (html == null) {
      return "";
    }
    const baseDepth = _fallback && _fallback.depth || 0;
    const iframeFallbackDepth = _fallback && _fallback.iframeFallbackDepth || 0;
    if (typeof html === "number") {
      html = html.toString();
    }
    let result = "";
    let tempResult = "";
    function Frame(tag, attribs) {
      const that = this;
      this.tag = tag;
      this.attribs = attribs || {};
      this.tagPosition = result.length;
      this.text = "";
      this.openingTagLength = 0;
      this.mediaChildren = [];
      this.updateParentNodeText = function() {
        if (stack.length) {
          const parentFrame = stack[stack.length - 1];
          parentFrame.text += that.text;
        }
      };
      this.updateParentNodeMediaChildren = function() {
        if (stack.length && mediaTags.includes(this.tag)) {
          const parentFrame = stack[stack.length - 1];
          parentFrame.mediaChildren.push(this.tag);
        }
      };
    }
    options = Object.assign({}, sanitizeHtml.defaults, options);
    options.parser = Object.assign({}, htmlParserDefaults, options.parser);
    const logger = loggerFor(options);
    const tagAllowed = function(name) {
      return options.allowedTags === false || (options.allowedTags || []).indexOf(name) > -1;
    };
    vulnerableTags.forEach(function(tag) {
      if (tagAllowed(tag) && !options.allowVulnerableTags) {
        logger.warn(`Your \`allowedTags\` option includes \`${tag}\`, which is inherently ` + "vulnerable to XSS attacks. Please remove it from `allowedTags`, or, " + "to disable this warning, add the `allowVulnerableTags` option and " + "ensure you are accounting for this risk.");
      }
    });
    const nonTextTagsArray = options.nonTextTags || [
      "script",
      "style",
      "textarea",
      "option",
      "xmp"
    ];
    let allowedAttributesMap;
    let allowedAttributesGlobMap;
    if (options.allowedAttributes) {
      allowedAttributesMap = {};
      allowedAttributesGlobMap = {};
      each(options.allowedAttributes, function(attributes, tag) {
        allowedAttributesMap[tag] = [];
        const globRegex = [];
        attributes.forEach(function(obj) {
          if (typeof obj === "string" && obj.indexOf("*") >= 0) {
            globRegex.push(escapeStringRegexp(obj).replace(/\\\*/g, ".*"));
          } else {
            allowedAttributesMap[tag].push(obj);
          }
        });
        if (globRegex.length) {
          allowedAttributesGlobMap[tag] = new RegExp("^(" + globRegex.join("|") + ")$");
        }
      });
    }
    const allowedClassesMap = {};
    const allowedClassesGlobMap = {};
    const allowedClassesRegexMap = {};
    each(options.allowedClasses, function(classes, tag) {
      if (allowedAttributesMap) {
        if (!has(allowedAttributesMap, tag)) {
          allowedAttributesMap[tag] = [];
        }
        allowedAttributesMap[tag].push("class");
      }
      allowedClassesMap[tag] = classes;
      if (Array.isArray(classes)) {
        const globRegex = [];
        allowedClassesMap[tag] = [];
        allowedClassesRegexMap[tag] = [];
        classes.forEach(function(obj) {
          if (typeof obj === "string" && obj.indexOf("*") >= 0) {
            globRegex.push(escapeStringRegexp(obj).replace(/\\\*/g, ".*"));
          } else if (obj instanceof RegExp) {
            allowedClassesRegexMap[tag].push(obj);
          } else {
            allowedClassesMap[tag].push(obj);
          }
        });
        if (globRegex.length) {
          allowedClassesGlobMap[tag] = new RegExp("^(" + globRegex.join("|") + ")$");
        }
      }
    });
    const transformTagsMap = {};
    let transformTagsAll;
    each(options.transformTags, function(transform, tag) {
      let transFun;
      if (typeof transform === "function") {
        transFun = transform;
      } else if (typeof transform === "string") {
        transFun = sanitizeHtml.simpleTransform(transform);
      }
      if (tag === "*") {
        transformTagsAll = transFun;
      } else {
        transformTagsMap[tag] = transFun;
      }
    });
    let depth;
    let stack;
    let skipMap;
    let transformMap;
    let skipText;
    let skipTextDepth;
    let rawTextEnd;
    let skipRawText;
    let addedText = false;
    initializeState();
    const parser = new Parser({
      onopentag: function(name, attribs) {
        if (options.onOpenTag) {
          options.onOpenTag(name, attribs);
        }
        updateRawTextRegion();
        if (options.enforceHtmlBoundary && name === "html") {
          initializeState();
        }
        if (skipRawText) {
          return;
        }
        if (skipText) {
          skipTextDepth++;
          return;
        }
        const frame = new Frame(name, attribs);
        stack.push(frame);
        let skip = false;
        const hasText = !!frame.text;
        let transformedTag;
        if (has(transformTagsMap, name)) {
          transformedTag = transformTagsMap[name](name, attribs);
          frame.attribs = attribs = transformedTag.attribs;
          if (transformedTag.text !== undefined) {
            frame.innerText = transformedTag.text;
          }
          if (name !== transformedTag.tagName) {
            frame.name = name = transformedTag.tagName;
            transformMap[depth] = transformedTag.tagName;
          }
        }
        if (transformTagsAll) {
          transformedTag = transformTagsAll(name, attribs);
          frame.attribs = attribs = transformedTag.attribs;
          if (name !== transformedTag.tagName) {
            frame.name = name = transformedTag.tagName;
            transformMap[depth] = transformedTag.tagName;
          }
        }
        if (!tagAllowed(name) || animatesUrlAttribute(name, attribs) || options.disallowedTagsMode === "recursiveEscape" && !isEmptyObject(skipMap) || options.nestingLimit != null && depth >= options.nestingLimit) {
          skip = true;
          skipMap[depth] = true;
          if (options.disallowedTagsMode === "discard" || options.disallowedTagsMode === "completelyDiscard") {
            if (nonTextTagsArray.indexOf(name) !== -1) {
              skipText = true;
              skipTextDepth = 1;
              if (frame.tag.toLowerCase() === "noscript") {
                rawTextEnd = findRawTextEnd("noscript", parser.endIndex + 1);
              }
            }
          }
        }
        depth++;
        if (skip) {
          if (options.disallowedTagsMode === "discard" || options.disallowedTagsMode === "completelyDiscard") {
            if (frame.innerText && !hasText) {
              const escaped = escapeHtml(frame.innerText);
              if (options.textFilter) {
                result += options.textFilter(escaped, name);
              } else {
                result += escaped;
              }
              addedText = true;
            }
            return;
          }
          tempResult = result;
          result = "";
        }
        result += "<" + name;
        if (name === "script") {
          if (options.allowedScriptHostnames || options.allowedScriptDomains) {
            frame.innerText = "";
          }
        }
        const isBeingEscaped = skip && (options.disallowedTagsMode === "escape" || options.disallowedTagsMode === "recursiveEscape");
        const shouldPreserveEscapedAttributes = isBeingEscaped && options.preserveEscapedAttributes;
        if (shouldPreserveEscapedAttributes) {
          each(attribs, function(value, a) {
            result += " " + a + '="' + escapeHtml(value || "", true) + '"';
          });
        } else if (!allowedAttributesMap || has(allowedAttributesMap, name) || allowedAttributesMap["*"]) {
          each(attribs, function(value, a) {
            if (!VALID_HTML_ATTRIBUTE_NAME.test(a)) {
              delete frame.attribs[a];
              return;
            }
            if (value === "" && !options.allowedEmptyAttributes.includes(a) && (options.nonBooleanAttributes.includes(a) || options.nonBooleanAttributes.includes("*"))) {
              delete frame.attribs[a];
              return;
            }
            let passedAllowedAttributesMapCheck = false;
            if (!allowedAttributesMap || has(allowedAttributesMap, name) && allowedAttributesMap[name].indexOf(a) !== -1 || allowedAttributesMap["*"] && allowedAttributesMap["*"].indexOf(a) !== -1 || has(allowedAttributesGlobMap, name) && allowedAttributesGlobMap[name].test(a) || allowedAttributesGlobMap["*"] && allowedAttributesGlobMap["*"].test(a)) {
              passedAllowedAttributesMapCheck = true;
            } else if (allowedAttributesMap && allowedAttributesMap[name]) {
              for (const o of allowedAttributesMap[name]) {
                if (isPlainObject(o) && o.name && o.name === a) {
                  passedAllowedAttributesMapCheck = true;
                  let newValue = "";
                  if (o.multiple === true) {
                    const splitStrArray = value.split(" ");
                    for (const s of splitStrArray) {
                      if (o.values.indexOf(s) !== -1) {
                        if (newValue === "") {
                          newValue = s;
                        } else {
                          newValue += " " + s;
                        }
                      }
                    }
                  } else if (o.values.indexOf(value) >= 0) {
                    newValue = value;
                  }
                  value = newValue;
                }
              }
            }
            if (passedAllowedAttributesMapCheck) {
              if (options.allowedSchemesAppliedToAttributes.indexOf(a) !== -1) {
                if (naughtyHref(name, value)) {
                  delete frame.attribs[a];
                  return;
                }
              }
              if (name === "meta" && a.toLowerCase() === "content" && isRefresh(attribs) && naughtyRefresh(value)) {
                delete frame.attribs[a];
                return;
              }
              if (name === "script" && a === "src") {
                let allowed = true;
                try {
                  const parsed = parseUrl(value);
                  if (options.allowedScriptHostnames || options.allowedScriptDomains) {
                    const allowedHostname = (options.allowedScriptHostnames || []).find(function(hostname) {
                      return hostname === parsed.url.hostname;
                    });
                    const allowedDomain = (options.allowedScriptDomains || []).find(function(domain) {
                      return parsed.url.hostname === domain || parsed.url.hostname.endsWith(`.${domain}`);
                    });
                    allowed = allowedHostname || allowedDomain;
                  }
                } catch (e) {
                  allowed = false;
                }
                if (!allowed) {
                  delete frame.attribs[a];
                  return;
                }
              }
              if (name === "iframe" && a === "src") {
                let allowed = true;
                try {
                  const parsed = parseUrl(value);
                  if (parsed.isRelativeUrl) {
                    allowed = has(options, "allowIframeRelativeUrls") ? options.allowIframeRelativeUrls : !options.allowedIframeHostnames && !options.allowedIframeDomains;
                  } else if (options.allowedIframeHostnames || options.allowedIframeDomains) {
                    const allowedHostname = (options.allowedIframeHostnames || []).find(function(hostname) {
                      return hostname === parsed.url.hostname;
                    });
                    const allowedDomain = (options.allowedIframeDomains || []).find(function(domain) {
                      return parsed.url.hostname === domain || parsed.url.hostname.endsWith(`.${domain}`);
                    });
                    allowed = allowedHostname || allowedDomain;
                  }
                } catch (e) {
                  allowed = false;
                }
                if (!allowed) {
                  delete frame.attribs[a];
                  return;
                }
              }
              if (a === "srcset" || a === "imagesrcset") {
                try {
                  let parsed = parseSrcset(value);
                  parsed.forEach(function(value) {
                    if (naughtyHref(name, value.url)) {
                      value.evil = true;
                    }
                  });
                  parsed = filter(parsed, function(v) {
                    return !v.evil;
                  });
                  if (!parsed.length) {
                    delete frame.attribs[a];
                    return;
                  } else {
                    value = stringifySrcset(filter(parsed, function(v) {
                      return !v.evil;
                    }));
                    frame.attribs[a] = value;
                  }
                } catch (e) {
                  delete frame.attribs[a];
                  return;
                }
              }
              if (a === "class") {
                const allowedSpecificClasses = allowedClassesMap[name];
                const allowedWildcardClasses = allowedClassesMap["*"];
                const allowedSpecificClassesGlob = allowedClassesGlobMap[name];
                const allowedSpecificClassesRegex = allowedClassesRegexMap[name];
                const allowedWildcardClassesRegex = allowedClassesRegexMap["*"];
                const allowedWildcardClassesGlob = allowedClassesGlobMap["*"];
                const allowedClassesGlobs = [
                  allowedSpecificClassesGlob,
                  allowedWildcardClassesGlob
                ].concat(allowedSpecificClassesRegex, allowedWildcardClassesRegex).filter(function(t) {
                  return t;
                });
                if (allowedSpecificClasses && allowedWildcardClasses) {
                  value = filterClasses(value, mergeClasses(allowedSpecificClasses, allowedWildcardClasses), allowedClassesGlobs);
                } else {
                  value = filterClasses(value, allowedSpecificClasses || allowedWildcardClasses, allowedClassesGlobs);
                }
                if (!value.length) {
                  delete frame.attribs[a];
                  return;
                }
              }
              if (a === "style") {
                if (options.parseStyleAttributes) {
                  try {
                    const abstractSyntaxTree = postcssParse(name + " {" + value + "}", { map: false });
                    const filteredAST = filterCss(abstractSyntaxTree, options.allowedStyles);
                    value = stringifyStyleAttributes(filteredAST);
                    if (value.length === 0) {
                      delete frame.attribs[a];
                      return;
                    }
                  } catch (e) {
                    if (typeof window !== "undefined") {
                      logger.warn(`Failed to parse "${name} {${value}}". If you are ` + "running this in a browser, we recommend disabling " + "style parsing with the parseStyleAttributes option, " + "since it only works in a node environment due to a " + "postcss dependency. More info: " + "https://github.com/apostrophecms/sanitize-html/issues/547");
                    }
                    delete frame.attribs[a];
                    return;
                  }
                } else if (options.allowedStyles) {
                  throw new Error("allowedStyles option cannot be used together with parseStyleAttributes: false.");
                }
              }
              result += " " + a;
              if (value && value.length) {
                result += '="' + escapeHtml(value, true) + '"';
              } else if (options.allowedEmptyAttributes.includes(a)) {
                result += '=""';
              }
            } else {
              delete frame.attribs[a];
            }
          });
        }
        if (options.selfClosing.indexOf(name) !== -1) {
          result += " />";
        } else {
          result += ">";
          if (frame.innerText && !hasText) {
            const escaped = escapeHtml(frame.innerText);
            if (options.textFilter) {
              result += options.textFilter(escaped, name);
            } else {
              result += escaped;
            }
            addedText = true;
          }
        }
        if (skip) {
          result = tempResult + escapeHtml(result);
          tempResult = "";
        }
        frame.openingTagLength = result.length - frame.tagPosition;
      },
      ontext: function(text) {
        updateRawTextRegion();
        if (skipText || skipRawText) {
          return;
        }
        const lastFrame = stack[stack.length - 1];
        let tag;
        if (lastFrame) {
          tag = lastFrame.tag;
          text = lastFrame.innerText !== undefined ? lastFrame.innerText : text;
        }
        if (options.disallowedTagsMode === "completelyDiscard" && !tagAllowed(tag)) {
          text = "";
        } else if (tag && tagAllowed(tag) && (options.disallowedTagsMode === "discard" || options.disallowedTagsMode === "completelyDiscard") && (tag === "script" || tag === "style")) {
          result += text;
        } else if (tag && tagAllowed(tag) && (options.disallowedTagsMode === "discard" || options.disallowedTagsMode === "completelyDiscard") && (tag === "textarea" || tag === "xmp")) {
          if (tag === "xmp") {
            result += text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
          } else {
            result += escapeHtml(text, false);
          }
        } else if (tag === "iframe" && !tagAllowed(tag) && options.disallowedTagsMode === "discard" && iframeFallbackDepth < MAX_IFRAME_FALLBACK_DEPTH) {
          result += sanitizeHtml(text, options, {
            depth,
            iframeFallbackDepth: iframeFallbackDepth + 1
          });
        } else if (!addedText) {
          const escaped = escapeHtml(text, false);
          if (options.textFilter) {
            result += options.textFilter(escaped, tag);
          } else {
            result += escaped;
          }
        }
        if (stack.length) {
          const frame = stack[stack.length - 1];
          frame.text += text;
        }
      },
      onclosetag: function(name, isImplied) {
        if (options.onCloseTag) {
          options.onCloseTag(name, isImplied);
        }
        updateRawTextRegion();
        if (skipRawText) {
          const lastFrame = stack[stack.length - 1];
          if (!lastFrame || lastFrame.tag !== name) {
            return;
          }
        } else if (skipText) {
          skipTextDepth--;
          if (!skipTextDepth) {
            skipText = false;
            if (rawTextEnd !== null) {
              skipRawText = true;
            }
          } else {
            return;
          }
        }
        const frame = stack.pop();
        if (!frame) {
          return;
        }
        if (frame.tag !== name) {
          stack.push(frame);
          return;
        }
        skipText = options.enforceHtmlBoundary ? name === "html" : false;
        depth--;
        const skip = skipMap[depth];
        if (skip) {
          delete skipMap[depth];
          if (options.disallowedTagsMode === "discard" || options.disallowedTagsMode === "completelyDiscard") {
            frame.updateParentNodeText();
            return;
          }
          tempResult = result;
          result = "";
        }
        if (transformMap[depth]) {
          name = transformMap[depth];
          delete transformMap[depth];
        }
        if (options.exclusiveFilter) {
          const filterResult = options.exclusiveFilter(frame);
          if (filterResult === "excludeTag") {
            if (skip) {
              result = tempResult;
              tempResult = "";
            }
            result = result.substring(0, frame.tagPosition) + result.substring(frame.tagPosition + frame.openingTagLength);
            return;
          } else if (filterResult) {
            result = result.substring(0, frame.tagPosition);
            return;
          }
        }
        frame.updateParentNodeMediaChildren();
        frame.updateParentNodeText();
        if (options.selfClosing.indexOf(name) !== -1 || isImplied && !tagAllowed(name) && ["escape", "recursiveEscape"].indexOf(options.disallowedTagsMode) >= 0) {
          if (skip) {
            result = tempResult;
            tempResult = "";
          }
          return;
        }
        result += "</" + name + ">";
        if (skip) {
          result = tempResult + escapeHtml(result);
          tempResult = "";
        }
        addedText = false;
      }
    }, options.parser);
    parser.write(html);
    parser.end();
    if (options.disallowedTagsMode === "escape" || options.disallowedTagsMode === "recursiveEscape") {
      const lastParsedIndex = parser.endIndex;
      if (lastParsedIndex != null && lastParsedIndex >= 0 && lastParsedIndex < html.length) {
        const unparsed = html.substring(lastParsedIndex);
        result += escapeHtml(unparsed);
      } else if ((lastParsedIndex == null || lastParsedIndex < 0) && html.length > 0 && result === "") {
        result = escapeHtml(html);
      }
    }
    return result;
    function initializeState() {
      result = "";
      depth = baseDepth;
      stack = [];
      skipMap = {};
      transformMap = {};
      skipText = false;
      skipTextDepth = 0;
      rawTextEnd = null;
      skipRawText = false;
    }
    function updateRawTextRegion() {
      if (rawTextEnd !== null && parser.startIndex >= rawTextEnd) {
        rawTextEnd = null;
        skipRawText = false;
      }
    }
    function findRawTextEnd(tagName, from) {
      const re = new RegExp("</" + tagName + "[\\t\\n\\f\\r />]", "ig");
      re.lastIndex = from;
      const match = re.exec(html);
      return match ? match.index : Infinity;
    }
    function escapeHtml(s, quote) {
      if (typeof s !== "string") {
        s = s + "";
      }
      if (options.parser.decodeEntities) {
        s = s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        if (quote) {
          s = s.replace(/"/g, "&quot;");
        }
      }
      s = s.replace(/&(?![a-zA-Z0-9#]{1,20};)/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      if (quote) {
        s = s.replace(/"/g, "&quot;");
      }
      return s;
    }
    function naughtyHref(name, href) {
      const allowedSchemes = has(options.allowedSchemesByTag, name) ? options.allowedSchemesByTag[name] : options.allowedSchemes || [];
      return launderNaughtyHref(href, {
        allowedSchemes,
        allowProtocolRelative: options.allowProtocolRelative
      });
    }
    function isRefresh(attribs) {
      return Object.keys(attribs).some(function(a) {
        return a.toLowerCase() === "http-equiv" && String(attribs[a]).trim().toLowerCase() === "refresh";
      });
    }
    function naughtyRefresh(content) {
      const input = String(content);
      const isWhitespace = function(c) {
        return c === " " || c === "\t" || c === `
` || c === "\f" || c === "\r";
      };
      let position = 0;
      const skipWhitespace = function() {
        while (position < input.length && isWhitespace(input[position])) {
          position++;
        }
      };
      const lowerAt = function(i) {
        return (input[i] || "").toLowerCase();
      };
      skipWhitespace();
      const timeStart = position;
      while (position < input.length && /[0-9.]/.test(input[position])) {
        position++;
      }
      if (position === timeStart) {
        return true;
      }
      if (position < input.length) {
        const c = input[position];
        if (c !== ";" && c !== "," && !isWhitespace(c)) {
          return true;
        }
        skipWhitespace();
        if (input[position] === ";" || input[position] === ",") {
          position++;
        }
        skipWhitespace();
      }
      if (position >= input.length) {
        return false;
      }
      let url = input.slice(position);
      let quoted = true;
      if (lowerAt(position) === "u") {
        quoted = false;
        if (lowerAt(position + 1) === "r" && lowerAt(position + 2) === "l") {
          position += 3;
          skipWhitespace();
          if (input[position] === "=") {
            position++;
            skipWhitespace();
            quoted = true;
          }
        }
      }
      if (quoted) {
        const quote = input[position];
        if (quote === '"' || quote === "'") {
          position++;
        }
        url = input.slice(position);
        if (quote === '"' || quote === "'") {
          const end = url.indexOf(quote);
          if (end !== -1) {
            url = url.slice(0, end);
          }
        }
      }
      return naughtyHref("meta", url);
    }
    function animatesUrlAttribute(name, attribs) {
      if (svgAnimationTags.indexOf(localPart(name)) === -1) {
        return false;
      }
      const schemeCheckedAttributes = options.allowedSchemesAppliedToAttributes || [];
      return Object.keys(attribs || {}).some(function(attributeName) {
        if (localPart(attributeName) !== "attributename") {
          return false;
        }
        const target = (attribs[attributeName] || "").trim().toLowerCase();
        const localName = target.slice(target.lastIndexOf(":") + 1);
        return alwaysUrlAttributes.indexOf(localName) !== -1 || schemeCheckedAttributes.indexOf(target) !== -1 || schemeCheckedAttributes.indexOf(localName) !== -1;
      });
    }
    function localPart(name) {
      const lower = name.toLowerCase();
      return lower.slice(lower.lastIndexOf(":") + 1);
    }
    function parseUrl(value) {
      value = value.replace(/^(\w+:)?\s*[\\/]\s*[\\/]/, "$1//");
      if (value.startsWith("relative:")) {
        throw new Error("relative: exploit attempt");
      }
      let base = "relative://relative-site";
      for (let i = 0;i < 100; i++) {
        base += `/${i}`;
      }
      const parsed = new URL(value, base);
      const isRelativeUrl = parsed && parsed.hostname === "relative-site" && parsed.protocol === "relative:";
      return {
        isRelativeUrl,
        url: parsed
      };
    }
    function filterCss(abstractSyntaxTree, allowedStyles) {
      if (!allowedStyles) {
        return abstractSyntaxTree;
      }
      const astRules = abstractSyntaxTree.nodes[0];
      let selectedRule;
      if (allowedStyles[astRules.selector] && allowedStyles["*"]) {
        selectedRule = mergeStyles(allowedStyles[astRules.selector], allowedStyles["*"]);
      } else {
        selectedRule = allowedStyles[astRules.selector] || allowedStyles["*"];
      }
      if (selectedRule) {
        abstractSyntaxTree.nodes[0].nodes = astRules.nodes.reduce(filterDeclarations(selectedRule), []);
      }
      return abstractSyntaxTree;
    }
    function stringifyStyleAttributes(filteredAST) {
      return filteredAST.nodes[0].nodes.reduce(function(extractedAttributes, attrObject) {
        extractedAttributes.push(`${attrObject.prop}:${attrObject.value}${attrObject.important ? " !important" : ""}`);
        return extractedAttributes;
      }, []).join(";");
    }
    function filterDeclarations(selectedRule) {
      return function(allowedDeclarationsList, attributeObject) {
        if (has(selectedRule, attributeObject.prop)) {
          const matchesRegex = selectedRule[attributeObject.prop].some(function(regularExpression) {
            return regularExpression.test(attributeObject.value);
          });
          if (matchesRegex) {
            allowedDeclarationsList.push(attributeObject);
          }
        }
        return allowedDeclarationsList;
      };
    }
    function filterClasses(classes, allowed, allowedGlobs) {
      if (!allowed) {
        return classes;
      }
      classes = classes.split(/\s+/);
      return classes.filter(function(clss) {
        return allowed.indexOf(clss) !== -1 || allowedGlobs.some(function(glob) {
          return glob.test(clss);
        });
      }).join(" ");
    }
  }
  var htmlParserDefaults = {
    decodeEntities: true
  };
  sanitizeHtml.defaults = {
    allowedTags: [
      "address",
      "article",
      "aside",
      "footer",
      "header",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "hgroup",
      "main",
      "nav",
      "section",
      "blockquote",
      "dd",
      "div",
      "dl",
      "dt",
      "figcaption",
      "figure",
      "hr",
      "li",
      "menu",
      "ol",
      "p",
      "pre",
      "ul",
      "a",
      "abbr",
      "b",
      "bdi",
      "bdo",
      "br",
      "cite",
      "code",
      "data",
      "dfn",
      "em",
      "i",
      "kbd",
      "mark",
      "q",
      "rb",
      "rp",
      "rt",
      "rtc",
      "ruby",
      "s",
      "samp",
      "small",
      "span",
      "strong",
      "sub",
      "sup",
      "time",
      "u",
      "var",
      "wbr",
      "caption",
      "col",
      "colgroup",
      "table",
      "tbody",
      "td",
      "tfoot",
      "th",
      "thead",
      "tr"
    ],
    nonBooleanAttributes: [
      "abbr",
      "accept",
      "accept-charset",
      "accesskey",
      "action",
      "allow",
      "alt",
      "as",
      "autocapitalize",
      "autocomplete",
      "blocking",
      "charset",
      "cite",
      "class",
      "color",
      "cols",
      "colspan",
      "content",
      "contenteditable",
      "coords",
      "crossorigin",
      "data",
      "datetime",
      "decoding",
      "dir",
      "dirname",
      "download",
      "draggable",
      "enctype",
      "enterkeyhint",
      "fetchpriority",
      "for",
      "form",
      "formaction",
      "formenctype",
      "formmethod",
      "formtarget",
      "headers",
      "height",
      "hidden",
      "high",
      "href",
      "hreflang",
      "http-equiv",
      "id",
      "imagesizes",
      "imagesrcset",
      "inputmode",
      "integrity",
      "is",
      "itemid",
      "itemprop",
      "itemref",
      "itemtype",
      "kind",
      "label",
      "lang",
      "list",
      "loading",
      "low",
      "max",
      "maxlength",
      "media",
      "method",
      "min",
      "minlength",
      "name",
      "nonce",
      "optimum",
      "pattern",
      "ping",
      "placeholder",
      "popover",
      "popovertarget",
      "popovertargetaction",
      "poster",
      "preload",
      "referrerpolicy",
      "rel",
      "rows",
      "rowspan",
      "sandbox",
      "scope",
      "shape",
      "size",
      "sizes",
      "slot",
      "span",
      "spellcheck",
      "src",
      "srcdoc",
      "srclang",
      "srcset",
      "start",
      "step",
      "style",
      "tabindex",
      "target",
      "title",
      "translate",
      "type",
      "usemap",
      "value",
      "width",
      "wrap",
      "onauxclick",
      "onafterprint",
      "onbeforematch",
      "onbeforeprint",
      "onbeforeunload",
      "onbeforetoggle",
      "onblur",
      "oncancel",
      "oncanplay",
      "oncanplaythrough",
      "onchange",
      "onclick",
      "onclose",
      "oncontextlost",
      "oncontextmenu",
      "oncontextrestored",
      "oncopy",
      "oncuechange",
      "oncut",
      "ondblclick",
      "ondrag",
      "ondragend",
      "ondragenter",
      "ondragleave",
      "ondragover",
      "ondragstart",
      "ondrop",
      "ondurationchange",
      "onemptied",
      "onended",
      "onerror",
      "onfocus",
      "onformdata",
      "onhashchange",
      "oninput",
      "oninvalid",
      "onkeydown",
      "onkeypress",
      "onkeyup",
      "onlanguagechange",
      "onload",
      "onloadeddata",
      "onloadedmetadata",
      "onloadstart",
      "onmessage",
      "onmessageerror",
      "onmousedown",
      "onmouseenter",
      "onmouseleave",
      "onmousemove",
      "onmouseout",
      "onmouseover",
      "onmouseup",
      "onoffline",
      "ononline",
      "onpagehide",
      "onpageshow",
      "onpaste",
      "onpause",
      "onplay",
      "onplaying",
      "onpopstate",
      "onprogress",
      "onratechange",
      "onreset",
      "onresize",
      "onrejectionhandled",
      "onscroll",
      "onscrollend",
      "onsecuritypolicyviolation",
      "onseeked",
      "onseeking",
      "onselect",
      "onslotchange",
      "onstalled",
      "onstorage",
      "onsubmit",
      "onsuspend",
      "ontimeupdate",
      "ontoggle",
      "onunhandledrejection",
      "onunload",
      "onvolumechange",
      "onwaiting",
      "onwheel"
    ],
    disallowedTagsMode: "discard",
    allowedAttributes: {
      a: ["href", "name", "target"],
      img: ["src", "srcset", "alt", "title", "width", "height", "loading"]
    },
    allowedEmptyAttributes: [
      "alt"
    ],
    selfClosing: ["img", "br", "hr", "area", "base", "basefont", "input", "link", "meta", "col"],
    allowedSchemes: ["http", "https", "ftp", "mailto", "tel"],
    allowedSchemesByTag: {},
    allowedSchemesAppliedToAttributes: [
      "href",
      "src",
      "cite",
      "action",
      "formaction",
      "data",
      "xlink:href",
      "poster",
      "background",
      "ping",
      "longdesc",
      "usemap",
      "codebase",
      "classid",
      "archive",
      "profile",
      "manifest",
      "itemid",
      "dynsrc",
      "lowsrc"
    ],
    allowProtocolRelative: true,
    enforceHtmlBoundary: false,
    parseStyleAttributes: true,
    preserveEscapedAttributes: false
  };
  sanitizeHtml.simpleTransform = function(newTagName, newAttribs, merge) {
    merge = merge === undefined ? true : merge;
    newAttribs = newAttribs || {};
    return function(tagName, attribs) {
      let attrib;
      if (merge) {
        for (attrib in newAttribs) {
          attribs[attrib] = newAttribs[attrib];
        }
      } else {
        attribs = newAttribs;
      }
      return {
        tagName: newTagName,
        attribs
      };
    };
  };
});

// engine/lib/wire.ts
var enc = new TextEncoder;
var dec = new TextDecoder;
var MAX_LINE = 1024 * 1024;

class Wire {
  stream;
  buf = new Uint8Array(0);
  bytesIn = 0;
  constructor(stream) {
    this.stream = stream;
  }
  async fill() {
    const chunk = await this.stream.read();
    if (chunk === null)
      throw new Error("the mail server closed the connection");
    this.bytesIn += chunk.length;
    const next = new Uint8Array(this.buf.length + chunk.length);
    next.set(this.buf);
    next.set(chunk, this.buf.length);
    this.buf = next;
  }
  async line() {
    for (;; ) {
      const i = this.buf.indexOf(10);
      if (i >= 0) {
        const end = i > 0 && this.buf[i - 1] === 13 ? i - 1 : i;
        const text = dec.decode(this.buf.subarray(0, end));
        this.buf = this.buf.slice(i + 1);
        return text;
      }
      if (this.buf.length > MAX_LINE)
        throw new Error("the mail server sent a line longer than 1 MiB");
      await this.fill();
    }
  }
  async bytes(n) {
    while (this.buf.length < n)
      await this.fill();
    const out = this.buf.slice(0, n);
    this.buf = this.buf.slice(n);
    return out;
  }
  get pending() {
    return this.buf.length > 0;
  }
  write(data) {
    return this.stream.write(typeof data === "string" ? enc.encode(data) : data);
  }
  startTls() {
    return this.stream.startTls();
  }
  async close() {
    try {
      await this.stream.close();
    } catch {}
  }
}

// engine/lib/imap.ts
class ImapError extends Error {
}
var enc2 = new TextEncoder;
var LIT = "\x01";
function parseTokens(s, lits) {
  let i = 0;
  const list = () => {
    const out = [];
    while (i < s.length) {
      const ch = s[i];
      if (ch === " ") {
        i++;
      } else if (ch === "(") {
        i++;
        out.push(list());
      } else if (ch === ")") {
        i++;
        return out;
      } else if (ch === '"') {
        let v = "";
        i++;
        while (i < s.length && s[i] !== '"') {
          if (s[i] === "\\")
            i++;
          v += s[i++] ?? "";
        }
        i++;
        out.push(v);
      } else if (ch === LIT) {
        const end = s.indexOf(LIT, i + 1);
        out.push(lits[Number(s.slice(i + 1, end))]);
        i = end + 1;
      } else {
        let v = "";
        while (i < s.length && s[i] !== " " && s[i] !== "(" && s[i] !== ")") {
          if (s[i] === "[") {
            const end = s.indexOf("]", i);
            const stop = end < 0 ? s.length : end + 1;
            v += s.slice(i, stop);
            i = stop;
          } else {
            v += s[i++];
          }
        }
        out.push(v.toUpperCase() === "NIL" ? null : v);
      }
    }
    return out;
  };
  return list();
}
function astring(v) {
  if (/^[\x20-\x7e]*$/.test(v) && v.length < 1000)
    return [`"${v.replace(/["\\]/g, "\\$&")}"`];
  return [enc2.encode(v)];
}
function decodeMailbox(name) {
  return name.replace(/&([^-]*)-/g, (_, b64) => {
    if (b64 === "")
      return "&";
    const bin = atob(b64.replace(/,/g, "/") + "===".slice((b64.length + 3) % 4));
    let out = "";
    for (let i = 0;i + 1 < bin.length; i += 2)
      out += String.fromCharCode(bin.charCodeAt(i) << 8 | bin.charCodeAt(i + 1));
    return out;
  });
}
function encodeMailbox(name) {
  return name.replace(/&/g, "&-").replace(/[^\x20-\x7e]+/g, (run) => {
    let bin = "";
    for (const ch of run) {
      for (let i = 0;i < ch.length; i++) {
        const c = ch.charCodeAt(i);
        bin += String.fromCharCode(c >> 8, c & 255);
      }
    }
    return "&" + btoa(bin).replace(/=+$/, "").replace(/\//g, ",") + "-";
  });
}
function fetchItems(v) {
  const m = new Map;
  if (!Array.isArray(v))
    return m;
  for (let i = 0;i + 1 < v.length; i += 2) {
    const k = v[i];
    if (typeof k === "string")
      m.set(k.toUpperCase(), v[i + 1]);
  }
  return m;
}
var str = (v) => typeof v === "string" ? v : v instanceof Uint8Array ? new TextDecoder().decode(v) : "";
var pairs = (v) => {
  const o = {};
  if (Array.isArray(v))
    for (let i = 0;i + 1 < v.length; i += 2)
      o[str(v[i]).toLowerCase()] = str(v[i + 1]);
  return o;
};
function leaves(v, section = "") {
  if (!Array.isArray(v))
    return [];
  if (Array.isArray(v[0])) {
    const out = [];
    for (let n = 0;n < v.length && Array.isArray(v[n]); n++)
      out.push(...leaves(v[n], section ? `${section}.${n + 1}` : String(n + 1)));
    return out;
  }
  const type = `${str(v[0])}/${str(v[1])}`.toLowerCase();
  const md5 = type.startsWith("text/") ? 8 : type === "message/rfc822" ? 10 : 7;
  const disp = v[md5 + 1];
  return [
    {
      section: section || "1",
      type,
      params: pairs(v[2]),
      id: str(v[3]) || null,
      encoding: str(v[5]).toLowerCase() || "7bit",
      size: Number(str(v[6])) || 0,
      disposition: Array.isArray(disp) ? str(disp[0]).toLowerCase() || null : null,
      dparams: Array.isArray(disp) ? pairs(disp[1]) : {}
    }
  ];
}

class Imap {
  seq = 0;
  caps = new Set;
  wire;
  constructor(stream) {
    this.wire = new Wire(stream);
  }
  get bytesIn() {
    return this.wire.bytesIn;
  }
  static async open(stream, tls) {
    const c = new Imap(stream);
    const hello = await c.read();
    if (str(hello.tokens[1]).toUpperCase() === "BYE")
      throw new ImapError("the IMAP server refused the connection");
    await c.capability();
    if (tls === "starttls") {
      if (!c.caps.has("STARTTLS"))
        throw new ImapError("the IMAP server does not offer STARTTLS");
      await c.run(["STARTTLS"]);
      if (c.wire.pending)
        throw new ImapError("the IMAP server sent data after STARTTLS; refusing to continue");
      await c.wire.startTls();
      await c.capability();
    }
    return c;
  }
  async read() {
    const lits = [];
    let text = "";
    for (;; ) {
      const line = await this.wire.line();
      const m = /\{(\d+)\+?\}$/.exec(line);
      if (!m) {
        text += line;
        break;
      }
      text += line.slice(0, m.index) + LIT + lits.length + LIT;
      lits.push(await this.wire.bytes(Number(m[1])));
    }
    const sp = text.indexOf(" ");
    const tag = sp < 0 ? text : text.slice(0, sp);
    return { tag, tokens: parseTokens(text, lits) };
  }
  async run(parts) {
    const tag = `z${++this.seq}`;
    const plus = this.caps.has("LITERAL+");
    const untagged = [];
    let line = `${tag} `;
    for (let i = 0;i < parts.length; i++) {
      const p = parts[i];
      if (typeof p === "string") {
        line += (i > 0 ? " " : "") + p;
        continue;
      }
      await this.wire.write(`${line}${i > 0 ? " " : ""}{${p.length}${plus ? "+" : ""}}\r
`);
      line = "";
      if (!plus) {
        for (;; ) {
          const r = await this.read();
          if (r.tag === "+")
            break;
          if (r.tag === tag)
            throw new ImapError(`IMAP ${String(parts[0])} failed: ${r.tokens.slice(2).map(str).join(" ")}`);
          untagged.push(r.tokens);
        }
      }
      await this.wire.write(p);
    }
    await this.wire.write(`${line}\r
`);
    for (;; ) {
      const r = await this.read();
      if (r.tag === "*") {
        untagged.push(r.tokens.slice(1));
      } else if (r.tag === tag) {
        const status = str(r.tokens[1]).toUpperCase();
        if (status !== "OK") {
          const why = r.tokens.slice(2).map(str).join(" ");
          throw new ImapError(`IMAP ${String(parts[0])} failed: ${why}`);
        }
        return untagged;
      }
    }
  }
  async capability() {
    const res = await this.run(["CAPABILITY"]);
    for (const r of res) {
      if (str(r[0]).toUpperCase() === "CAPABILITY")
        this.caps = new Set(r.slice(1).map((v) => str(v).toUpperCase()));
    }
  }
  async login(user, password) {
    if (this.caps.has("LOGINDISABLED"))
      throw new ImapError("the IMAP server disables LOGIN on this connection");
    await this.run(["LOGIN", ...astring(user), ...astring(password)]);
    await this.capability();
  }
  async xoauth2(user, token) {
    const b64 = btoa(`user=${user}\x01auth=Bearer ${token}\x01\x01`);
    await this.run(["AUTHENTICATE XOAUTH2", b64]);
    await this.capability();
  }
  async list() {
    const res = await this.run(['LIST "" "*"']);
    const out = [];
    for (const r of res) {
      if (str(r[0]).toUpperCase() !== "LIST")
        continue;
      const flags = Array.isArray(r[1]) ? r[1].map((f) => str(f)) : [];
      if (flags.some((f) => f.toLowerCase() === "\\noselect" || f.toLowerCase() === "\\nonexistent"))
        continue;
      const path = str(r[3]);
      const delimiter = str(r[2]);
      const decoded = decodeMailbox(path);
      out.push({ path, delimiter, flags, name: delimiter ? decoded.split(delimiter).pop() : decoded });
    }
    return out;
  }
  async select(path) {
    const res = await this.run(["SELECT", ...astring(path)]);
    let exists = 0;
    let uidValidity = 0;
    let uidNext = 0;
    for (const r of res) {
      if (str(r[1]).toUpperCase() === "EXISTS")
        exists = Number(str(r[0]));
      const code = r.map(str).join(" ");
      const v = /\[UIDVALIDITY (\d+)\]/i.exec(code);
      if (v)
        uidValidity = Number(v[1]);
      const n = /\[UIDNEXT (\d+)\]/i.exec(code);
      if (n)
        uidNext = Number(n[1]);
    }
    return { exists, uidValidity, uidNext };
  }
  async status(path) {
    const res = await this.run(["STATUS", ...astring(path), "(MESSAGES UNSEEN)"]);
    const items = fetchItems(res.find((r) => str(r[0]).toUpperCase() === "STATUS")?.[2] ?? []);
    return { messages: Number(str(items.get("MESSAGES"))) || 0, unseen: Number(str(items.get("UNSEEN"))) || 0 };
  }
  async headers(fromUid) {
    const res = await this.run([`UID FETCH ${fromUid}:* (UID FLAGS RFC822.SIZE INTERNALDATE)`]);
    return this.fetched(res).filter((m) => m.uid >= fromUid);
  }
  async flags() {
    return this.fetched(await this.run(["UID FETCH 1:* (UID FLAGS)"]));
  }
  async body(uid) {
    const [m] = this.fetched(await this.run([`UID FETCH ${uid} (UID BODY.PEEK[])`])).filter((x) => x.uid === uid);
    return m?.raw ?? null;
  }
  async structure(uid) {
    const res = await this.run([`UID FETCH ${uid} (UID BODYSTRUCTURE BODY.PEEK[HEADER])`]);
    for (const r of res) {
      if (str(r[1]).toUpperCase() !== "FETCH")
        continue;
      const it = fetchItems(r[2] ?? null);
      if (Number(str(it.get("UID"))) !== uid)
        continue;
      const h = it.get("BODY[HEADER]");
      return { header: h instanceof Uint8Array ? h : enc2.encode(str(h)), leaves: leaves(it.get("BODYSTRUCTURE") ?? null) };
    }
    return null;
  }
  async parts(uid, sections) {
    const out = new Map;
    if (!sections.every((s) => /^\d+(\.\d+)*$/.test(s)))
      throw new ImapError(`not a part section: ${sections.join(" ")}`);
    if (!sections.length)
      return out;
    const res = await this.run([`UID FETCH ${uid} (UID ${sections.map((s) => `BODY.PEEK[${s}]`).join(" ")})`]);
    for (const r of res) {
      if (str(r[1]).toUpperCase() !== "FETCH")
        continue;
      const it = fetchItems(r[2] ?? null);
      if (Number(str(it.get("UID"))) !== uid)
        continue;
      for (const s of sections) {
        const v = it.get(`BODY[${s}]`);
        if (v !== undefined && v !== null)
          out.set(s, v instanceof Uint8Array ? v : enc2.encode(str(v)));
      }
    }
    return out;
  }
  fetched(res) {
    const out = [];
    for (const r of res) {
      if (str(r[1]).toUpperCase() !== "FETCH")
        continue;
      const it = fetchItems(r[2] ?? null);
      const uid = Number(str(it.get("UID")));
      if (!uid)
        continue;
      const flags = it.get("FLAGS");
      const raw = it.get("BODY[]");
      out.push({
        uid,
        flags: Array.isArray(flags) ? flags.map((f) => str(f)) : [],
        size: Number(str(it.get("RFC822.SIZE"))) || 0,
        internalDate: str(it.get("INTERNALDATE")) || null,
        raw: raw instanceof Uint8Array ? raw : typeof raw === "string" ? enc2.encode(raw) : undefined
      });
    }
    return out;
  }
  async store(uids, op, flags) {
    if (uids.length)
      await this.run([`UID STORE ${uids.join(",")} ${op}FLAGS.SILENT (${flags.join(" ")})`]);
  }
  async move(uids, target) {
    if (!uids.length)
      return;
    const set = uids.join(",");
    if (this.caps.has("MOVE")) {
      await this.run([`UID MOVE ${set}`, ...astring(target)]);
      return;
    }
    await this.run([`UID COPY ${set}`, ...astring(target)]);
    await this.expunge(uids);
  }
  async expunge(uids) {
    if (!uids.length)
      return;
    await this.store(uids, "+", ["\\Deleted"]);
    await this.run([this.caps.has("UIDPLUS") ? `UID EXPUNGE ${uids.join(",")}` : "EXPUNGE"]);
  }
  async append(path, flags, raw) {
    await this.run(["APPEND", ...astring(path), `(${flags.join(" ")})`, raw]);
  }
  async create(path) {
    await this.run(["CREATE", ...astring(path)]);
  }
  async rename(from, to) {
    await this.run(["RENAME", ...astring(from), ...astring(to)]);
  }
  async remove(path) {
    await this.run(["DELETE", ...astring(path)]);
  }
  async logout() {
    try {
      await this.run(["LOGOUT"]);
    } catch {}
    await this.wire.close();
  }
}

// engine/lib/smtp.ts
class SmtpError extends Error {
  code;
  unknownOutcome;
  constructor(message, code, unknownOutcome = false) {
    super(message);
    this.code = code;
    this.unknownOutcome = unknownOutcome;
  }
}
var b64 = (s) => btoa(String.fromCharCode(...new TextEncoder().encode(s)));
function dotStuff(raw) {
  const out = [];
  let lineStart = true;
  for (let i = 0;i < raw.length; i++) {
    const b = raw[i];
    if (b === 10 && (i === 0 || raw[i - 1] !== 13))
      out.push(13);
    if (lineStart && b === 46)
      out.push(46);
    out.push(b);
    lineStart = b === 10;
  }
  if (!lineStart)
    out.push(13, 10);
  out.push(46, 13, 10);
  return Uint8Array.from(out);
}
async function reply(w) {
  const text = [];
  for (;; ) {
    const line = await w.line();
    text.push(line.slice(4));
    if (line[3] !== "-")
      return { code: Number(line.slice(0, 3)) || 0, text };
  }
}
async function expect(w, ok, what) {
  const r = await reply(w);
  if (!ok.includes(r.code))
    throw new SmtpError(`SMTP ${what} refused: ${r.code} ${r.text.join(" ")}`, r.code);
  return r.text;
}
async function say(w, cmd, ok, what = cmd.split(" ")[0]) {
  await w.write(`${cmd}\r
`);
  return expect(w, ok, what);
}
function path(addr) {
  if (/[\r\n<>]/.test(addr))
    throw new SmtpError(`invalid address: ${JSON.stringify(addr)}`, 501);
  return `<${addr}>`;
}
async function sendMail(stream, tls, auth, env, raw, heloName = "zveltio.invalid") {
  const w = new Wire(stream);
  try {
    await expect(w, [220], "greeting");
    let ext = await say(w, `EHLO ${heloName}`, [250]);
    if (tls === "starttls") {
      if (!ext.some((l) => l.toUpperCase() === "STARTTLS"))
        throw new SmtpError("the SMTP server does not offer STARTTLS", 0);
      await say(w, "STARTTLS", [220]);
      if (w.pending)
        throw new SmtpError("the SMTP server sent data after STARTTLS; refusing to continue", 0);
      await w.startTls();
      ext = await say(w, `EHLO ${heloName}`, [250]);
    }
    if (auth) {
      const mechs = (ext.find((l) => /^AUTH[ =]/i.test(l)) ?? "").toUpperCase().split(/[ =]/).slice(1);
      if (auth.accessToken) {
        await say(w, `AUTH XOAUTH2 ${b64(`user=${auth.user}\x01auth=Bearer ${auth.accessToken}\x01\x01`)}`, [235], "AUTH");
      } else if (mechs.includes("PLAIN") || !mechs.includes("LOGIN")) {
        await say(w, `AUTH PLAIN ${b64(`\x00${auth.user}\x00${auth.password ?? ""}`)}`, [235], "AUTH");
      } else {
        await say(w, "AUTH LOGIN", [334], "AUTH");
        await say(w, b64(auth.user), [334], "AUTH");
        await say(w, b64(auth.password ?? ""), [235], "AUTH");
      }
    }
    await say(w, `MAIL FROM:${path(env.from)}`, [250], "MAIL FROM");
    for (const to of env.to)
      await say(w, `RCPT TO:${path(to)}`, [250, 251], "RCPT TO");
    await say(w, "DATA", [354]);
    try {
      await w.write(dotStuff(raw));
      await expect(w, [250], "message");
    } catch (err) {
      if (err instanceof SmtpError)
        throw err;
      throw new SmtpError(`the SMTP server did not confirm the message: ${err.message}`, 0, true);
    }
    try {
      await say(w, "QUIT", [221]);
    } catch {}
  } finally {
    await w.close();
  }
}

// /zveltio-extension/node_modules/postal-mime/src/decode-strings.js
var textEncoder = new TextEncoder;
var base64Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
var base64Lookup = new Uint8Array(256);
for (let i = 0;i < base64Chars.length; i++) {
  base64Lookup[base64Chars.charCodeAt(i)] = i;
}
function decodeBase64(base64) {
  let bufferLength = Math.ceil(base64.length / 4) * 3;
  const len = base64.length;
  let p = 0;
  if (base64.length % 4 === 3) {
    bufferLength--;
  } else if (base64.length % 4 === 2) {
    bufferLength -= 2;
  } else if (base64[base64.length - 1] === "=") {
    bufferLength--;
    if (base64[base64.length - 2] === "=") {
      bufferLength--;
    }
  }
  const arrayBuffer = new ArrayBuffer(bufferLength);
  const bytes = new Uint8Array(arrayBuffer);
  for (let i = 0;i < len; i += 4) {
    let encoded1 = base64Lookup[base64.charCodeAt(i)];
    let encoded2 = base64Lookup[base64.charCodeAt(i + 1)];
    let encoded3 = base64Lookup[base64.charCodeAt(i + 2)];
    let encoded4 = base64Lookup[base64.charCodeAt(i + 3)];
    bytes[p++] = encoded1 << 2 | encoded2 >> 4;
    bytes[p++] = (encoded2 & 15) << 4 | encoded3 >> 2;
    bytes[p++] = (encoded3 & 3) << 6 | encoded4 & 63;
  }
  return arrayBuffer;
}
var charsetAliases = new Map([
  ["iso-8859-8-i", "iso-8859-8"],
  ["iso-8859-8-e", "iso-8859-8"]
]);
function getDecoder(charset) {
  charset = (charset || "utf8").trim().toLowerCase();
  charset = charsetAliases.get(charset) || charset;
  let decoder;
  try {
    decoder = new TextDecoder(charset);
  } catch (err) {
    decoder = new TextDecoder("windows-1252");
  }
  return decoder;
}
async function blobToArrayBuffer(blob) {
  if ("arrayBuffer" in blob) {
    return await blob.arrayBuffer();
  }
  const fr = new FileReader;
  return new Promise((resolve, reject) => {
    fr.onload = function(e) {
      resolve(e.target.result);
    };
    fr.onerror = function(e) {
      reject(fr.error);
    };
    fr.readAsArrayBuffer(blob);
  });
}
function getHex(c) {
  if (c >= 48 && c <= 57 || c >= 97 && c <= 102 || c >= 65 && c <= 70) {
    return String.fromCharCode(c);
  }
  return false;
}
function decodeWord(charset, encoding, str) {
  let splitPos = charset.indexOf("*");
  if (splitPos >= 0) {
    charset = charset.substr(0, splitPos);
  }
  encoding = encoding.toUpperCase();
  let byteStr;
  if (encoding === "Q") {
    str = str.replace(/=\s+([0-9a-fA-F])/g, "=$1").replace(/[_\s]/g, " ");
    let buf = textEncoder.encode(str);
    let encodedBytes = [];
    for (let i = 0, len = buf.length;i < len; i++) {
      let c = buf[i];
      if (i <= len - 2 && c === 61) {
        let c1 = getHex(buf[i + 1]);
        let c2 = getHex(buf[i + 2]);
        if (c1 && c2) {
          let c = parseInt(c1 + c2, 16);
          encodedBytes.push(c);
          i += 2;
          continue;
        }
      }
      encodedBytes.push(c);
    }
    byteStr = new ArrayBuffer(encodedBytes.length);
    let dataView = new DataView(byteStr);
    for (let i = 0, len = encodedBytes.length;i < len; i++) {
      dataView.setUint8(i, encodedBytes[i]);
    }
  } else if (encoding === "B") {
    byteStr = decodeBase64(str.replace(/[^a-zA-Z0-9\+\/=]+/g, ""));
  } else {
    byteStr = textEncoder.encode(str);
  }
  return getDecoder(charset).decode(byteStr);
}
function decodeWords(str) {
  let joinString = true;
  let done = false;
  while (!done) {
    let result = (str || "").toString().replace(/(=\?([^?]+)\?[Bb]\?([^?]*)\?=)\s*(?==\?([^?]+)\?[Bb]\?[^?]*\?=)/g, (match, left, chLeft, encodedLeftStr, chRight) => {
      if (!joinString) {
        return match;
      }
      if (chLeft === chRight && encodedLeftStr.length % 4 === 0 && !/=$/.test(encodedLeftStr)) {
        return left + "__\x00JOIN\x00__";
      }
      return match;
    }).replace(/(=\?([^?]+)\?[Qq]\?[^?]*\?=)\s*(?==\?([^?]+)\?[Qq]\?[^?]*\?=)/g, (match, left, chLeft, chRight) => {
      if (!joinString) {
        return match;
      }
      if (chLeft === chRight) {
        return left + "__\x00JOIN\x00__";
      }
      return match;
    }).replace(/(\?=)?__\x00JOIN\x00__(=\?([^?]+)\?[QqBb]\?)?/g, "").replace(/(=\?[^?]+\?[QqBb]\?[^?]*\?=)\s+(?==\?[^?]+\?[QqBb]\?[^?]*\?=)/g, "$1").replace(/=\?([\w_\-*]+)\?([QqBb])\?([^?]*)\?=/g, (m, charset, encoding, text) => decodeWord(charset, encoding, text));
    if (joinString && result.indexOf("�") >= 0) {
      joinString = false;
    } else {
      return result;
    }
  }
}
function decodeURIComponentWithCharset(encodedStr, charset) {
  charset = charset || "utf-8";
  let encodedBytes = [];
  for (let i = 0;i < encodedStr.length; i++) {
    let c = encodedStr.charAt(i);
    if (c === "%" && /^[a-f0-9]{2}/i.test(encodedStr.substr(i + 1, 2))) {
      let byte = encodedStr.substr(i + 1, 2);
      i += 2;
      encodedBytes.push(parseInt(byte, 16));
    } else if (c.charCodeAt(0) > 126) {
      c = textEncoder.encode(c);
      for (let j = 0;j < c.length; j++) {
        encodedBytes.push(c[j]);
      }
    } else {
      encodedBytes.push(c.charCodeAt(0));
    }
  }
  const byteStr = new ArrayBuffer(encodedBytes.length);
  const dataView = new DataView(byteStr);
  for (let i = 0, len = encodedBytes.length;i < len; i++) {
    dataView.setUint8(i, encodedBytes[i]);
  }
  return getDecoder(charset).decode(byteStr);
}
function decodeParameterValueContinuations(header) {
  let paramKeys = new Map;
  Object.keys(header.params).forEach((key) => {
    let match = key.match(/\*((\d+)\*?)?$/);
    if (!match) {
      return;
    }
    let actualKey = key.substr(0, match.index).toLowerCase();
    let nr = Number(match[2]) || 0;
    let paramVal;
    if (!paramKeys.has(actualKey)) {
      paramVal = {
        charset: false,
        values: []
      };
      paramKeys.set(actualKey, paramVal);
    } else {
      paramVal = paramKeys.get(actualKey);
    }
    let value = header.params[key];
    if (nr === 0 && match[0].charAt(match[0].length - 1) === "*" && (match = value.match(/^([^']*)'[^']*'(.*)$/))) {
      paramVal.charset = match[1] || "utf-8";
      value = match[2];
    }
    paramVal.values.push({ nr, value });
    delete header.params[key];
  });
  paramKeys.forEach((paramVal, key) => {
    header.params[key] = decodeURIComponentWithCharset(paramVal.values.sort((a, b) => a.nr - b.nr).map((a) => a.value).join(""), paramVal.charset);
  });
}

// /zveltio-extension/node_modules/postal-mime/src/pass-through-decoder.js
class PassThroughDecoder {
  constructor() {
    this.chunks = [];
  }
  update(line) {
    this.chunks.push(line);
    this.chunks.push(`
`);
  }
  finalize() {
    return blobToArrayBuffer(new Blob(this.chunks, { type: "application/octet-stream" }));
  }
}

// /zveltio-extension/node_modules/postal-mime/src/base64-decoder.js
class Base64Decoder {
  constructor(opts) {
    opts = opts || {};
    this.decoder = opts.decoder || new TextDecoder;
    this.maxChunkSize = 100 * 1024;
    this.chunks = [];
    this.remainder = "";
  }
  update(buffer) {
    let str = this.decoder.decode(buffer);
    str = str.replace(/[^a-zA-Z0-9+\/]+/g, "");
    this.remainder += str;
    if (this.remainder.length >= this.maxChunkSize) {
      let allowedBytes = Math.floor(this.remainder.length / 4) * 4;
      let base64Str;
      if (allowedBytes === this.remainder.length) {
        base64Str = this.remainder;
        this.remainder = "";
      } else {
        base64Str = this.remainder.substr(0, allowedBytes);
        this.remainder = this.remainder.substr(allowedBytes);
      }
      if (base64Str.length) {
        this.chunks.push(decodeBase64(base64Str));
      }
    }
  }
  finalize() {
    if (this.remainder && !/^=+$/.test(this.remainder)) {
      this.chunks.push(decodeBase64(this.remainder));
    }
    return blobToArrayBuffer(new Blob(this.chunks, { type: "application/octet-stream" }));
  }
}

// /zveltio-extension/node_modules/postal-mime/src/qp-decoder.js
var VALID_QP_REGEX = /^=[a-f0-9]{2}$/i;
var QP_SPLIT_REGEX = /(?==[a-f0-9]{2})/i;
var SOFT_LINE_BREAK_REGEX = /=\r?\n/g;
var PARTIAL_QP_ENDING_REGEX = /=[a-fA-F0-9]?$/;

class QPDecoder {
  constructor(opts) {
    opts = opts || {};
    this.decoder = opts.decoder || new TextDecoder;
    this.maxChunkSize = 100 * 1024;
    this.remainder = "";
    this.chunks = [];
  }
  decodeQPBytes(encodedBytes) {
    let buf = new ArrayBuffer(encodedBytes.length);
    let dataView = new DataView(buf);
    for (let i = 0, len = encodedBytes.length;i < len; i++) {
      dataView.setUint8(i, parseInt(encodedBytes[i], 16));
    }
    return buf;
  }
  decodeChunks(str) {
    str = str.replace(SOFT_LINE_BREAK_REGEX, "");
    let list = str.split(QP_SPLIT_REGEX);
    let encodedBytes = [];
    for (let part of list) {
      if (part.charAt(0) !== "=") {
        if (encodedBytes.length) {
          this.chunks.push(this.decodeQPBytes(encodedBytes));
          encodedBytes = [];
        }
        this.chunks.push(part);
        continue;
      }
      if (part.length === 3) {
        if (VALID_QP_REGEX.test(part)) {
          encodedBytes.push(part.substr(1));
        } else {
          if (encodedBytes.length) {
            this.chunks.push(this.decodeQPBytes(encodedBytes));
            encodedBytes = [];
          }
          this.chunks.push(part);
        }
        continue;
      }
      if (part.length > 3) {
        const firstThree = part.substr(0, 3);
        if (VALID_QP_REGEX.test(firstThree)) {
          encodedBytes.push(part.substr(1, 2));
          this.chunks.push(this.decodeQPBytes(encodedBytes));
          encodedBytes = [];
          part = part.substr(3);
          this.chunks.push(part);
        } else {
          if (encodedBytes.length) {
            this.chunks.push(this.decodeQPBytes(encodedBytes));
            encodedBytes = [];
          }
          this.chunks.push(part);
        }
      }
    }
    if (encodedBytes.length) {
      this.chunks.push(this.decodeQPBytes(encodedBytes));
    }
  }
  update(buffer) {
    let str = this.decoder.decode(buffer) + `
`;
    str = this.remainder + str;
    if (str.length < this.maxChunkSize) {
      this.remainder = str;
      return;
    }
    this.remainder = "";
    let partialEnding = str.match(PARTIAL_QP_ENDING_REGEX);
    if (partialEnding) {
      if (partialEnding.index === 0) {
        this.remainder = str;
        return;
      }
      this.remainder = str.substr(partialEnding.index);
      str = str.substr(0, partialEnding.index);
    }
    this.decodeChunks(str);
  }
  finalize() {
    if (this.remainder.length) {
      this.decodeChunks(this.remainder);
      this.remainder = "";
    }
    return blobToArrayBuffer(new Blob(this.chunks, { type: "application/octet-stream" }));
  }
}

// /zveltio-extension/node_modules/postal-mime/src/mime-node.js
var defaultDecoder = getDecoder();

class MimeNode {
  constructor(options) {
    this.options = options || {};
    this.postalMime = this.options.postalMime;
    this.root = !!this.options.parentNode;
    this.childNodes = [];
    if (this.options.parentNode) {
      this.parentNode = this.options.parentNode;
      this.depth = this.parentNode.depth + 1;
      if (this.depth > this.options.maxNestingDepth) {
        throw new Error(`Maximum MIME nesting depth of ${this.options.maxNestingDepth} levels exceeded`);
      }
      this.options.parentNode.childNodes.push(this);
    } else {
      this.depth = 0;
    }
    this.state = "header";
    this.headerLines = [];
    this.headerSize = 0;
    const parentMultipartType = this.options.parentMultipartType || null;
    const defaultContentType = parentMultipartType === "digest" ? "message/rfc822" : "text/plain";
    this.contentType = {
      value: defaultContentType,
      default: true
    };
    this.contentTransferEncoding = {
      value: "8bit"
    };
    this.contentDisposition = {
      value: ""
    };
    this.headers = [];
    this.contentDecoder = false;
  }
  setupContentDecoder(transferEncoding) {
    if (/base64/i.test(transferEncoding)) {
      this.contentDecoder = new Base64Decoder;
    } else if (/quoted-printable/i.test(transferEncoding)) {
      this.contentDecoder = new QPDecoder({ decoder: getDecoder(this.contentType.parsed.params.charset) });
    } else {
      this.contentDecoder = new PassThroughDecoder;
    }
  }
  async finalize() {
    if (this.state === "finished") {
      return;
    }
    if (this.state === "header") {
      this.processHeaders();
    }
    let boundaries = this.postalMime.boundaries;
    for (let i = boundaries.length - 1;i >= 0; i--) {
      let boundary = boundaries[i];
      if (boundary.node === this) {
        boundaries.splice(i, 1);
        break;
      }
    }
    await this.finalizeChildNodes();
    this.content = this.contentDecoder ? await this.contentDecoder.finalize() : null;
    this.contentDecoder = false;
    this.state = "finished";
  }
  async finalizeChildNodes() {
    for (let childNode of this.childNodes) {
      await childNode.finalize();
    }
  }
  stripComments(str) {
    let result = "";
    let depth = 0;
    let escaped = false;
    let inQuote = false;
    for (let i = 0;i < str.length; i++) {
      const chr = str.charAt(i);
      if (escaped) {
        if (depth === 0) {
          result += chr;
        }
        escaped = false;
        continue;
      }
      if (chr === "\\") {
        escaped = true;
        if (depth === 0) {
          result += chr;
        }
        continue;
      }
      if (chr === '"' && depth === 0) {
        inQuote = !inQuote;
        result += chr;
        continue;
      }
      if (!inQuote) {
        if (chr === "(") {
          depth++;
          continue;
        }
        if (chr === ")" && depth > 0) {
          depth--;
          continue;
        }
      }
      if (depth === 0) {
        result += chr;
      }
    }
    return result;
  }
  parseStructuredHeader(str) {
    str = this.stripComments(str);
    let response = {
      value: false,
      params: {}
    };
    let key = false;
    let value = "";
    let stage = "value";
    let quote = false;
    let escaped = false;
    let chr;
    for (let i = 0, len = str.length;i < len; i++) {
      chr = str.charAt(i);
      switch (stage) {
        case "key":
          if (chr === "=") {
            key = value.trim().toLowerCase();
            stage = "value";
            value = "";
            break;
          }
          value += chr;
          break;
        case "value":
          if (escaped) {
            value += chr;
          } else if (chr === "\\") {
            escaped = true;
            continue;
          } else if (quote && chr === quote) {
            quote = false;
          } else if (!quote && chr === '"') {
            quote = chr;
          } else if (!quote && chr === ";") {
            if (key === false) {
              response.value = value.trim();
            } else {
              response.params[key] = value.trim();
            }
            stage = "key";
            value = "";
          } else {
            value += chr;
          }
          escaped = false;
          break;
      }
    }
    value = value.trim();
    if (stage === "value") {
      if (key === false) {
        response.value = value;
      } else {
        response.params[key] = value;
      }
    } else if (value) {
      response.params[value.toLowerCase()] = "";
    }
    if (response.value) {
      response.value = response.value.toLowerCase();
    }
    decodeParameterValueContinuations(response);
    return response;
  }
  decodeFlowedText(str, delSp) {
    return str.split(/\r?\n/).reduce((previousValue, currentValue) => {
      if (previousValue.endsWith(" ") && previousValue !== "-- " && !previousValue.endsWith(`
-- `)) {
        if (delSp) {
          return previousValue.slice(0, -1) + currentValue;
        } else {
          return previousValue + currentValue;
        }
      } else {
        return previousValue + `
` + currentValue;
      }
    }).replace(/^ /gm, "");
  }
  getTextContent() {
    if (!this.content) {
      return "";
    }
    let str = getDecoder(this.contentType.parsed.params.charset).decode(this.content);
    if (/^flowed$/i.test(this.contentType.parsed.params.format)) {
      str = this.decodeFlowedText(str, /^yes$/i.test(this.contentType.parsed.params.delsp));
    }
    return str;
  }
  processHeaders() {
    for (let i = this.headerLines.length - 1;i >= 0; i--) {
      let line = this.headerLines[i];
      if (i && /^\s/.test(line)) {
        this.headerLines[i - 1] += `
` + line;
        this.headerLines.splice(i, 1);
      }
    }
    this.rawHeaderLines = [];
    for (let i = this.headerLines.length - 1;i >= 0; i--) {
      let rawLine = this.headerLines[i];
      let sep = rawLine.indexOf(":");
      let rawKey = sep < 0 ? rawLine.trim() : rawLine.substr(0, sep).trim();
      this.rawHeaderLines.push({
        key: rawKey.toLowerCase(),
        line: rawLine
      });
      let normalizedLine = rawLine.replace(/\s+/g, " ");
      sep = normalizedLine.indexOf(":");
      let key = sep < 0 ? normalizedLine.trim() : normalizedLine.substr(0, sep).trim();
      let value = sep < 0 ? "" : normalizedLine.substr(sep + 1).trim();
      this.headers.push({ key: key.toLowerCase(), originalKey: key, value });
      switch (key.toLowerCase()) {
        case "content-type":
          if (this.contentType.default) {
            this.contentType = { value, parsed: {} };
          }
          break;
        case "content-transfer-encoding":
          this.contentTransferEncoding = { value, parsed: {} };
          break;
        case "content-disposition":
          this.contentDisposition = { value, parsed: {} };
          break;
        case "content-id":
          this.contentId = value;
          break;
        case "content-description":
          this.contentDescription = value;
          break;
      }
    }
    this.contentType.parsed = this.parseStructuredHeader(this.contentType.value);
    this.contentType.multipart = /^multipart\//i.test(this.contentType.parsed.value) ? this.contentType.parsed.value.substr(this.contentType.parsed.value.indexOf("/") + 1) : false;
    if (this.contentType.multipart && this.contentType.parsed.params.boundary) {
      this.postalMime.boundaries.push({
        value: textEncoder.encode(this.contentType.parsed.params.boundary),
        node: this
      });
    }
    this.contentDisposition.parsed = this.parseStructuredHeader(this.contentDisposition.value);
    this.contentTransferEncoding.encoding = this.contentTransferEncoding.value.toLowerCase().split(/[^\w-]/).shift();
    this.setupContentDecoder(this.contentTransferEncoding.encoding);
  }
  feed(line) {
    switch (this.state) {
      case "header":
        if (!line.length) {
          this.state = "body";
          return this.processHeaders();
        }
        this.headerSize += line.length;
        if (this.headerSize > this.options.maxHeadersSize) {
          let error = new Error(`Maximum header size of ${this.options.maxHeadersSize} bytes exceeded`);
          throw error;
        }
        this.headerLines.push(defaultDecoder.decode(line));
        break;
      case "body": {
        this.contentDecoder.update(line);
      }
    }
  }
}

// /zveltio-extension/node_modules/postal-mime/src/html-entities.js
var htmlEntities = {
  "&AElig": "Æ",
  "&AElig;": "Æ",
  "&AMP": "&",
  "&AMP;": "&",
  "&Aacute": "Á",
  "&Aacute;": "Á",
  "&Abreve;": "Ă",
  "&Acirc": "Â",
  "&Acirc;": "Â",
  "&Acy;": "А",
  "&Afr;": "\uD835\uDD04",
  "&Agrave": "À",
  "&Agrave;": "À",
  "&Alpha;": "Α",
  "&Amacr;": "Ā",
  "&And;": "⩓",
  "&Aogon;": "Ą",
  "&Aopf;": "\uD835\uDD38",
  "&ApplyFunction;": "⁡",
  "&Aring": "Å",
  "&Aring;": "Å",
  "&Ascr;": "\uD835\uDC9C",
  "&Assign;": "≔",
  "&Atilde": "Ã",
  "&Atilde;": "Ã",
  "&Auml": "Ä",
  "&Auml;": "Ä",
  "&Backslash;": "∖",
  "&Barv;": "⫧",
  "&Barwed;": "⌆",
  "&Bcy;": "Б",
  "&Because;": "∵",
  "&Bernoullis;": "ℬ",
  "&Beta;": "Β",
  "&Bfr;": "\uD835\uDD05",
  "&Bopf;": "\uD835\uDD39",
  "&Breve;": "˘",
  "&Bscr;": "ℬ",
  "&Bumpeq;": "≎",
  "&CHcy;": "Ч",
  "&COPY": "©",
  "&COPY;": "©",
  "&Cacute;": "Ć",
  "&Cap;": "⋒",
  "&CapitalDifferentialD;": "ⅅ",
  "&Cayleys;": "ℭ",
  "&Ccaron;": "Č",
  "&Ccedil": "Ç",
  "&Ccedil;": "Ç",
  "&Ccirc;": "Ĉ",
  "&Cconint;": "∰",
  "&Cdot;": "Ċ",
  "&Cedilla;": "¸",
  "&CenterDot;": "·",
  "&Cfr;": "ℭ",
  "&Chi;": "Χ",
  "&CircleDot;": "⊙",
  "&CircleMinus;": "⊖",
  "&CirclePlus;": "⊕",
  "&CircleTimes;": "⊗",
  "&ClockwiseContourIntegral;": "∲",
  "&CloseCurlyDoubleQuote;": "”",
  "&CloseCurlyQuote;": "’",
  "&Colon;": "∷",
  "&Colone;": "⩴",
  "&Congruent;": "≡",
  "&Conint;": "∯",
  "&ContourIntegral;": "∮",
  "&Copf;": "ℂ",
  "&Coproduct;": "∐",
  "&CounterClockwiseContourIntegral;": "∳",
  "&Cross;": "⨯",
  "&Cscr;": "\uD835\uDC9E",
  "&Cup;": "⋓",
  "&CupCap;": "≍",
  "&DD;": "ⅅ",
  "&DDotrahd;": "⤑",
  "&DJcy;": "Ђ",
  "&DScy;": "Ѕ",
  "&DZcy;": "Џ",
  "&Dagger;": "‡",
  "&Darr;": "↡",
  "&Dashv;": "⫤",
  "&Dcaron;": "Ď",
  "&Dcy;": "Д",
  "&Del;": "∇",
  "&Delta;": "Δ",
  "&Dfr;": "\uD835\uDD07",
  "&DiacriticalAcute;": "´",
  "&DiacriticalDot;": "˙",
  "&DiacriticalDoubleAcute;": "˝",
  "&DiacriticalGrave;": "`",
  "&DiacriticalTilde;": "˜",
  "&Diamond;": "⋄",
  "&DifferentialD;": "ⅆ",
  "&Dopf;": "\uD835\uDD3B",
  "&Dot;": "¨",
  "&DotDot;": "⃜",
  "&DotEqual;": "≐",
  "&DoubleContourIntegral;": "∯",
  "&DoubleDot;": "¨",
  "&DoubleDownArrow;": "⇓",
  "&DoubleLeftArrow;": "⇐",
  "&DoubleLeftRightArrow;": "⇔",
  "&DoubleLeftTee;": "⫤",
  "&DoubleLongLeftArrow;": "⟸",
  "&DoubleLongLeftRightArrow;": "⟺",
  "&DoubleLongRightArrow;": "⟹",
  "&DoubleRightArrow;": "⇒",
  "&DoubleRightTee;": "⊨",
  "&DoubleUpArrow;": "⇑",
  "&DoubleUpDownArrow;": "⇕",
  "&DoubleVerticalBar;": "∥",
  "&DownArrow;": "↓",
  "&DownArrowBar;": "⤓",
  "&DownArrowUpArrow;": "⇵",
  "&DownBreve;": "̑",
  "&DownLeftRightVector;": "⥐",
  "&DownLeftTeeVector;": "⥞",
  "&DownLeftVector;": "↽",
  "&DownLeftVectorBar;": "⥖",
  "&DownRightTeeVector;": "⥟",
  "&DownRightVector;": "⇁",
  "&DownRightVectorBar;": "⥗",
  "&DownTee;": "⊤",
  "&DownTeeArrow;": "↧",
  "&Downarrow;": "⇓",
  "&Dscr;": "\uD835\uDC9F",
  "&Dstrok;": "Đ",
  "&ENG;": "Ŋ",
  "&ETH": "Ð",
  "&ETH;": "Ð",
  "&Eacute": "É",
  "&Eacute;": "É",
  "&Ecaron;": "Ě",
  "&Ecirc": "Ê",
  "&Ecirc;": "Ê",
  "&Ecy;": "Э",
  "&Edot;": "Ė",
  "&Efr;": "\uD835\uDD08",
  "&Egrave": "È",
  "&Egrave;": "È",
  "&Element;": "∈",
  "&Emacr;": "Ē",
  "&EmptySmallSquare;": "◻",
  "&EmptyVerySmallSquare;": "▫",
  "&Eogon;": "Ę",
  "&Eopf;": "\uD835\uDD3C",
  "&Epsilon;": "Ε",
  "&Equal;": "⩵",
  "&EqualTilde;": "≂",
  "&Equilibrium;": "⇌",
  "&Escr;": "ℰ",
  "&Esim;": "⩳",
  "&Eta;": "Η",
  "&Euml": "Ë",
  "&Euml;": "Ë",
  "&Exists;": "∃",
  "&ExponentialE;": "ⅇ",
  "&Fcy;": "Ф",
  "&Ffr;": "\uD835\uDD09",
  "&FilledSmallSquare;": "◼",
  "&FilledVerySmallSquare;": "▪",
  "&Fopf;": "\uD835\uDD3D",
  "&ForAll;": "∀",
  "&Fouriertrf;": "ℱ",
  "&Fscr;": "ℱ",
  "&GJcy;": "Ѓ",
  "&GT": ">",
  "&GT;": ">",
  "&Gamma;": "Γ",
  "&Gammad;": "Ϝ",
  "&Gbreve;": "Ğ",
  "&Gcedil;": "Ģ",
  "&Gcirc;": "Ĝ",
  "&Gcy;": "Г",
  "&Gdot;": "Ġ",
  "&Gfr;": "\uD835\uDD0A",
  "&Gg;": "⋙",
  "&Gopf;": "\uD835\uDD3E",
  "&GreaterEqual;": "≥",
  "&GreaterEqualLess;": "⋛",
  "&GreaterFullEqual;": "≧",
  "&GreaterGreater;": "⪢",
  "&GreaterLess;": "≷",
  "&GreaterSlantEqual;": "⩾",
  "&GreaterTilde;": "≳",
  "&Gscr;": "\uD835\uDCA2",
  "&Gt;": "≫",
  "&HARDcy;": "Ъ",
  "&Hacek;": "ˇ",
  "&Hat;": "^",
  "&Hcirc;": "Ĥ",
  "&Hfr;": "ℌ",
  "&HilbertSpace;": "ℋ",
  "&Hopf;": "ℍ",
  "&HorizontalLine;": "─",
  "&Hscr;": "ℋ",
  "&Hstrok;": "Ħ",
  "&HumpDownHump;": "≎",
  "&HumpEqual;": "≏",
  "&IEcy;": "Е",
  "&IJlig;": "Ĳ",
  "&IOcy;": "Ё",
  "&Iacute": "Í",
  "&Iacute;": "Í",
  "&Icirc": "Î",
  "&Icirc;": "Î",
  "&Icy;": "И",
  "&Idot;": "İ",
  "&Ifr;": "ℑ",
  "&Igrave": "Ì",
  "&Igrave;": "Ì",
  "&Im;": "ℑ",
  "&Imacr;": "Ī",
  "&ImaginaryI;": "ⅈ",
  "&Implies;": "⇒",
  "&Int;": "∬",
  "&Integral;": "∫",
  "&Intersection;": "⋂",
  "&InvisibleComma;": "⁣",
  "&InvisibleTimes;": "⁢",
  "&Iogon;": "Į",
  "&Iopf;": "\uD835\uDD40",
  "&Iota;": "Ι",
  "&Iscr;": "ℐ",
  "&Itilde;": "Ĩ",
  "&Iukcy;": "І",
  "&Iuml": "Ï",
  "&Iuml;": "Ï",
  "&Jcirc;": "Ĵ",
  "&Jcy;": "Й",
  "&Jfr;": "\uD835\uDD0D",
  "&Jopf;": "\uD835\uDD41",
  "&Jscr;": "\uD835\uDCA5",
  "&Jsercy;": "Ј",
  "&Jukcy;": "Є",
  "&KHcy;": "Х",
  "&KJcy;": "Ќ",
  "&Kappa;": "Κ",
  "&Kcedil;": "Ķ",
  "&Kcy;": "К",
  "&Kfr;": "\uD835\uDD0E",
  "&Kopf;": "\uD835\uDD42",
  "&Kscr;": "\uD835\uDCA6",
  "&LJcy;": "Љ",
  "&LT": "<",
  "&LT;": "<",
  "&Lacute;": "Ĺ",
  "&Lambda;": "Λ",
  "&Lang;": "⟪",
  "&Laplacetrf;": "ℒ",
  "&Larr;": "↞",
  "&Lcaron;": "Ľ",
  "&Lcedil;": "Ļ",
  "&Lcy;": "Л",
  "&LeftAngleBracket;": "⟨",
  "&LeftArrow;": "←",
  "&LeftArrowBar;": "⇤",
  "&LeftArrowRightArrow;": "⇆",
  "&LeftCeiling;": "⌈",
  "&LeftDoubleBracket;": "⟦",
  "&LeftDownTeeVector;": "⥡",
  "&LeftDownVector;": "⇃",
  "&LeftDownVectorBar;": "⥙",
  "&LeftFloor;": "⌊",
  "&LeftRightArrow;": "↔",
  "&LeftRightVector;": "⥎",
  "&LeftTee;": "⊣",
  "&LeftTeeArrow;": "↤",
  "&LeftTeeVector;": "⥚",
  "&LeftTriangle;": "⊲",
  "&LeftTriangleBar;": "⧏",
  "&LeftTriangleEqual;": "⊴",
  "&LeftUpDownVector;": "⥑",
  "&LeftUpTeeVector;": "⥠",
  "&LeftUpVector;": "↿",
  "&LeftUpVectorBar;": "⥘",
  "&LeftVector;": "↼",
  "&LeftVectorBar;": "⥒",
  "&Leftarrow;": "⇐",
  "&Leftrightarrow;": "⇔",
  "&LessEqualGreater;": "⋚",
  "&LessFullEqual;": "≦",
  "&LessGreater;": "≶",
  "&LessLess;": "⪡",
  "&LessSlantEqual;": "⩽",
  "&LessTilde;": "≲",
  "&Lfr;": "\uD835\uDD0F",
  "&Ll;": "⋘",
  "&Lleftarrow;": "⇚",
  "&Lmidot;": "Ŀ",
  "&LongLeftArrow;": "⟵",
  "&LongLeftRightArrow;": "⟷",
  "&LongRightArrow;": "⟶",
  "&Longleftarrow;": "⟸",
  "&Longleftrightarrow;": "⟺",
  "&Longrightarrow;": "⟹",
  "&Lopf;": "\uD835\uDD43",
  "&LowerLeftArrow;": "↙",
  "&LowerRightArrow;": "↘",
  "&Lscr;": "ℒ",
  "&Lsh;": "↰",
  "&Lstrok;": "Ł",
  "&Lt;": "≪",
  "&Map;": "⤅",
  "&Mcy;": "М",
  "&MediumSpace;": " ",
  "&Mellintrf;": "ℳ",
  "&Mfr;": "\uD835\uDD10",
  "&MinusPlus;": "∓",
  "&Mopf;": "\uD835\uDD44",
  "&Mscr;": "ℳ",
  "&Mu;": "Μ",
  "&NJcy;": "Њ",
  "&Nacute;": "Ń",
  "&Ncaron;": "Ň",
  "&Ncedil;": "Ņ",
  "&Ncy;": "Н",
  "&NegativeMediumSpace;": "​",
  "&NegativeThickSpace;": "​",
  "&NegativeThinSpace;": "​",
  "&NegativeVeryThinSpace;": "​",
  "&NestedGreaterGreater;": "≫",
  "&NestedLessLess;": "≪",
  "&NewLine;": `
`,
  "&Nfr;": "\uD835\uDD11",
  "&NoBreak;": "⁠",
  "&NonBreakingSpace;": " ",
  "&Nopf;": "ℕ",
  "&Not;": "⫬",
  "&NotCongruent;": "≢",
  "&NotCupCap;": "≭",
  "&NotDoubleVerticalBar;": "∦",
  "&NotElement;": "∉",
  "&NotEqual;": "≠",
  "&NotEqualTilde;": "≂̸",
  "&NotExists;": "∄",
  "&NotGreater;": "≯",
  "&NotGreaterEqual;": "≱",
  "&NotGreaterFullEqual;": "≧̸",
  "&NotGreaterGreater;": "≫̸",
  "&NotGreaterLess;": "≹",
  "&NotGreaterSlantEqual;": "⩾̸",
  "&NotGreaterTilde;": "≵",
  "&NotHumpDownHump;": "≎̸",
  "&NotHumpEqual;": "≏̸",
  "&NotLeftTriangle;": "⋪",
  "&NotLeftTriangleBar;": "⧏̸",
  "&NotLeftTriangleEqual;": "⋬",
  "&NotLess;": "≮",
  "&NotLessEqual;": "≰",
  "&NotLessGreater;": "≸",
  "&NotLessLess;": "≪̸",
  "&NotLessSlantEqual;": "⩽̸",
  "&NotLessTilde;": "≴",
  "&NotNestedGreaterGreater;": "⪢̸",
  "&NotNestedLessLess;": "⪡̸",
  "&NotPrecedes;": "⊀",
  "&NotPrecedesEqual;": "⪯̸",
  "&NotPrecedesSlantEqual;": "⋠",
  "&NotReverseElement;": "∌",
  "&NotRightTriangle;": "⋫",
  "&NotRightTriangleBar;": "⧐̸",
  "&NotRightTriangleEqual;": "⋭",
  "&NotSquareSubset;": "⊏̸",
  "&NotSquareSubsetEqual;": "⋢",
  "&NotSquareSuperset;": "⊐̸",
  "&NotSquareSupersetEqual;": "⋣",
  "&NotSubset;": "⊂⃒",
  "&NotSubsetEqual;": "⊈",
  "&NotSucceeds;": "⊁",
  "&NotSucceedsEqual;": "⪰̸",
  "&NotSucceedsSlantEqual;": "⋡",
  "&NotSucceedsTilde;": "≿̸",
  "&NotSuperset;": "⊃⃒",
  "&NotSupersetEqual;": "⊉",
  "&NotTilde;": "≁",
  "&NotTildeEqual;": "≄",
  "&NotTildeFullEqual;": "≇",
  "&NotTildeTilde;": "≉",
  "&NotVerticalBar;": "∤",
  "&Nscr;": "\uD835\uDCA9",
  "&Ntilde": "Ñ",
  "&Ntilde;": "Ñ",
  "&Nu;": "Ν",
  "&OElig;": "Œ",
  "&Oacute": "Ó",
  "&Oacute;": "Ó",
  "&Ocirc": "Ô",
  "&Ocirc;": "Ô",
  "&Ocy;": "О",
  "&Odblac;": "Ő",
  "&Ofr;": "\uD835\uDD12",
  "&Ograve": "Ò",
  "&Ograve;": "Ò",
  "&Omacr;": "Ō",
  "&Omega;": "Ω",
  "&Omicron;": "Ο",
  "&Oopf;": "\uD835\uDD46",
  "&OpenCurlyDoubleQuote;": "“",
  "&OpenCurlyQuote;": "‘",
  "&Or;": "⩔",
  "&Oscr;": "\uD835\uDCAA",
  "&Oslash": "Ø",
  "&Oslash;": "Ø",
  "&Otilde": "Õ",
  "&Otilde;": "Õ",
  "&Otimes;": "⨷",
  "&Ouml": "Ö",
  "&Ouml;": "Ö",
  "&OverBar;": "‾",
  "&OverBrace;": "⏞",
  "&OverBracket;": "⎴",
  "&OverParenthesis;": "⏜",
  "&PartialD;": "∂",
  "&Pcy;": "П",
  "&Pfr;": "\uD835\uDD13",
  "&Phi;": "Φ",
  "&Pi;": "Π",
  "&PlusMinus;": "±",
  "&Poincareplane;": "ℌ",
  "&Popf;": "ℙ",
  "&Pr;": "⪻",
  "&Precedes;": "≺",
  "&PrecedesEqual;": "⪯",
  "&PrecedesSlantEqual;": "≼",
  "&PrecedesTilde;": "≾",
  "&Prime;": "″",
  "&Product;": "∏",
  "&Proportion;": "∷",
  "&Proportional;": "∝",
  "&Pscr;": "\uD835\uDCAB",
  "&Psi;": "Ψ",
  "&QUOT": '"',
  "&QUOT;": '"',
  "&Qfr;": "\uD835\uDD14",
  "&Qopf;": "ℚ",
  "&Qscr;": "\uD835\uDCAC",
  "&RBarr;": "⤐",
  "&REG": "®",
  "&REG;": "®",
  "&Racute;": "Ŕ",
  "&Rang;": "⟫",
  "&Rarr;": "↠",
  "&Rarrtl;": "⤖",
  "&Rcaron;": "Ř",
  "&Rcedil;": "Ŗ",
  "&Rcy;": "Р",
  "&Re;": "ℜ",
  "&ReverseElement;": "∋",
  "&ReverseEquilibrium;": "⇋",
  "&ReverseUpEquilibrium;": "⥯",
  "&Rfr;": "ℜ",
  "&Rho;": "Ρ",
  "&RightAngleBracket;": "⟩",
  "&RightArrow;": "→",
  "&RightArrowBar;": "⇥",
  "&RightArrowLeftArrow;": "⇄",
  "&RightCeiling;": "⌉",
  "&RightDoubleBracket;": "⟧",
  "&RightDownTeeVector;": "⥝",
  "&RightDownVector;": "⇂",
  "&RightDownVectorBar;": "⥕",
  "&RightFloor;": "⌋",
  "&RightTee;": "⊢",
  "&RightTeeArrow;": "↦",
  "&RightTeeVector;": "⥛",
  "&RightTriangle;": "⊳",
  "&RightTriangleBar;": "⧐",
  "&RightTriangleEqual;": "⊵",
  "&RightUpDownVector;": "⥏",
  "&RightUpTeeVector;": "⥜",
  "&RightUpVector;": "↾",
  "&RightUpVectorBar;": "⥔",
  "&RightVector;": "⇀",
  "&RightVectorBar;": "⥓",
  "&Rightarrow;": "⇒",
  "&Ropf;": "ℝ",
  "&RoundImplies;": "⥰",
  "&Rrightarrow;": "⇛",
  "&Rscr;": "ℛ",
  "&Rsh;": "↱",
  "&RuleDelayed;": "⧴",
  "&SHCHcy;": "Щ",
  "&SHcy;": "Ш",
  "&SOFTcy;": "Ь",
  "&Sacute;": "Ś",
  "&Sc;": "⪼",
  "&Scaron;": "Š",
  "&Scedil;": "Ş",
  "&Scirc;": "Ŝ",
  "&Scy;": "С",
  "&Sfr;": "\uD835\uDD16",
  "&ShortDownArrow;": "↓",
  "&ShortLeftArrow;": "←",
  "&ShortRightArrow;": "→",
  "&ShortUpArrow;": "↑",
  "&Sigma;": "Σ",
  "&SmallCircle;": "∘",
  "&Sopf;": "\uD835\uDD4A",
  "&Sqrt;": "√",
  "&Square;": "□",
  "&SquareIntersection;": "⊓",
  "&SquareSubset;": "⊏",
  "&SquareSubsetEqual;": "⊑",
  "&SquareSuperset;": "⊐",
  "&SquareSupersetEqual;": "⊒",
  "&SquareUnion;": "⊔",
  "&Sscr;": "\uD835\uDCAE",
  "&Star;": "⋆",
  "&Sub;": "⋐",
  "&Subset;": "⋐",
  "&SubsetEqual;": "⊆",
  "&Succeeds;": "≻",
  "&SucceedsEqual;": "⪰",
  "&SucceedsSlantEqual;": "≽",
  "&SucceedsTilde;": "≿",
  "&SuchThat;": "∋",
  "&Sum;": "∑",
  "&Sup;": "⋑",
  "&Superset;": "⊃",
  "&SupersetEqual;": "⊇",
  "&Supset;": "⋑",
  "&THORN": "Þ",
  "&THORN;": "Þ",
  "&TRADE;": "™",
  "&TSHcy;": "Ћ",
  "&TScy;": "Ц",
  "&Tab;": "\t",
  "&Tau;": "Τ",
  "&Tcaron;": "Ť",
  "&Tcedil;": "Ţ",
  "&Tcy;": "Т",
  "&Tfr;": "\uD835\uDD17",
  "&Therefore;": "∴",
  "&Theta;": "Θ",
  "&ThickSpace;": "  ",
  "&ThinSpace;": " ",
  "&Tilde;": "∼",
  "&TildeEqual;": "≃",
  "&TildeFullEqual;": "≅",
  "&TildeTilde;": "≈",
  "&Topf;": "\uD835\uDD4B",
  "&TripleDot;": "⃛",
  "&Tscr;": "\uD835\uDCAF",
  "&Tstrok;": "Ŧ",
  "&Uacute": "Ú",
  "&Uacute;": "Ú",
  "&Uarr;": "↟",
  "&Uarrocir;": "⥉",
  "&Ubrcy;": "Ў",
  "&Ubreve;": "Ŭ",
  "&Ucirc": "Û",
  "&Ucirc;": "Û",
  "&Ucy;": "У",
  "&Udblac;": "Ű",
  "&Ufr;": "\uD835\uDD18",
  "&Ugrave": "Ù",
  "&Ugrave;": "Ù",
  "&Umacr;": "Ū",
  "&UnderBar;": "_",
  "&UnderBrace;": "⏟",
  "&UnderBracket;": "⎵",
  "&UnderParenthesis;": "⏝",
  "&Union;": "⋃",
  "&UnionPlus;": "⊎",
  "&Uogon;": "Ų",
  "&Uopf;": "\uD835\uDD4C",
  "&UpArrow;": "↑",
  "&UpArrowBar;": "⤒",
  "&UpArrowDownArrow;": "⇅",
  "&UpDownArrow;": "↕",
  "&UpEquilibrium;": "⥮",
  "&UpTee;": "⊥",
  "&UpTeeArrow;": "↥",
  "&Uparrow;": "⇑",
  "&Updownarrow;": "⇕",
  "&UpperLeftArrow;": "↖",
  "&UpperRightArrow;": "↗",
  "&Upsi;": "ϒ",
  "&Upsilon;": "Υ",
  "&Uring;": "Ů",
  "&Uscr;": "\uD835\uDCB0",
  "&Utilde;": "Ũ",
  "&Uuml": "Ü",
  "&Uuml;": "Ü",
  "&VDash;": "⊫",
  "&Vbar;": "⫫",
  "&Vcy;": "В",
  "&Vdash;": "⊩",
  "&Vdashl;": "⫦",
  "&Vee;": "⋁",
  "&Verbar;": "‖",
  "&Vert;": "‖",
  "&VerticalBar;": "∣",
  "&VerticalLine;": "|",
  "&VerticalSeparator;": "❘",
  "&VerticalTilde;": "≀",
  "&VeryThinSpace;": " ",
  "&Vfr;": "\uD835\uDD19",
  "&Vopf;": "\uD835\uDD4D",
  "&Vscr;": "\uD835\uDCB1",
  "&Vvdash;": "⊪",
  "&Wcirc;": "Ŵ",
  "&Wedge;": "⋀",
  "&Wfr;": "\uD835\uDD1A",
  "&Wopf;": "\uD835\uDD4E",
  "&Wscr;": "\uD835\uDCB2",
  "&Xfr;": "\uD835\uDD1B",
  "&Xi;": "Ξ",
  "&Xopf;": "\uD835\uDD4F",
  "&Xscr;": "\uD835\uDCB3",
  "&YAcy;": "Я",
  "&YIcy;": "Ї",
  "&YUcy;": "Ю",
  "&Yacute": "Ý",
  "&Yacute;": "Ý",
  "&Ycirc;": "Ŷ",
  "&Ycy;": "Ы",
  "&Yfr;": "\uD835\uDD1C",
  "&Yopf;": "\uD835\uDD50",
  "&Yscr;": "\uD835\uDCB4",
  "&Yuml;": "Ÿ",
  "&ZHcy;": "Ж",
  "&Zacute;": "Ź",
  "&Zcaron;": "Ž",
  "&Zcy;": "З",
  "&Zdot;": "Ż",
  "&ZeroWidthSpace;": "​",
  "&Zeta;": "Ζ",
  "&Zfr;": "ℨ",
  "&Zopf;": "ℤ",
  "&Zscr;": "\uD835\uDCB5",
  "&aacute": "á",
  "&aacute;": "á",
  "&abreve;": "ă",
  "&ac;": "∾",
  "&acE;": "∾̳",
  "&acd;": "∿",
  "&acirc": "â",
  "&acirc;": "â",
  "&acute": "´",
  "&acute;": "´",
  "&acy;": "а",
  "&aelig": "æ",
  "&aelig;": "æ",
  "&af;": "⁡",
  "&afr;": "\uD835\uDD1E",
  "&agrave": "à",
  "&agrave;": "à",
  "&alefsym;": "ℵ",
  "&aleph;": "ℵ",
  "&alpha;": "α",
  "&amacr;": "ā",
  "&amalg;": "⨿",
  "&amp": "&",
  "&amp;": "&",
  "&and;": "∧",
  "&andand;": "⩕",
  "&andd;": "⩜",
  "&andslope;": "⩘",
  "&andv;": "⩚",
  "&ang;": "∠",
  "&ange;": "⦤",
  "&angle;": "∠",
  "&angmsd;": "∡",
  "&angmsdaa;": "⦨",
  "&angmsdab;": "⦩",
  "&angmsdac;": "⦪",
  "&angmsdad;": "⦫",
  "&angmsdae;": "⦬",
  "&angmsdaf;": "⦭",
  "&angmsdag;": "⦮",
  "&angmsdah;": "⦯",
  "&angrt;": "∟",
  "&angrtvb;": "⊾",
  "&angrtvbd;": "⦝",
  "&angsph;": "∢",
  "&angst;": "Å",
  "&angzarr;": "⍼",
  "&aogon;": "ą",
  "&aopf;": "\uD835\uDD52",
  "&ap;": "≈",
  "&apE;": "⩰",
  "&apacir;": "⩯",
  "&ape;": "≊",
  "&apid;": "≋",
  "&apos;": "'",
  "&approx;": "≈",
  "&approxeq;": "≊",
  "&aring": "å",
  "&aring;": "å",
  "&ascr;": "\uD835\uDCB6",
  "&ast;": "*",
  "&asymp;": "≈",
  "&asympeq;": "≍",
  "&atilde": "ã",
  "&atilde;": "ã",
  "&auml": "ä",
  "&auml;": "ä",
  "&awconint;": "∳",
  "&awint;": "⨑",
  "&bNot;": "⫭",
  "&backcong;": "≌",
  "&backepsilon;": "϶",
  "&backprime;": "‵",
  "&backsim;": "∽",
  "&backsimeq;": "⋍",
  "&barvee;": "⊽",
  "&barwed;": "⌅",
  "&barwedge;": "⌅",
  "&bbrk;": "⎵",
  "&bbrktbrk;": "⎶",
  "&bcong;": "≌",
  "&bcy;": "б",
  "&bdquo;": "„",
  "&becaus;": "∵",
  "&because;": "∵",
  "&bemptyv;": "⦰",
  "&bepsi;": "϶",
  "&bernou;": "ℬ",
  "&beta;": "β",
  "&beth;": "ℶ",
  "&between;": "≬",
  "&bfr;": "\uD835\uDD1F",
  "&bigcap;": "⋂",
  "&bigcirc;": "◯",
  "&bigcup;": "⋃",
  "&bigodot;": "⨀",
  "&bigoplus;": "⨁",
  "&bigotimes;": "⨂",
  "&bigsqcup;": "⨆",
  "&bigstar;": "★",
  "&bigtriangledown;": "▽",
  "&bigtriangleup;": "△",
  "&biguplus;": "⨄",
  "&bigvee;": "⋁",
  "&bigwedge;": "⋀",
  "&bkarow;": "⤍",
  "&blacklozenge;": "⧫",
  "&blacksquare;": "▪",
  "&blacktriangle;": "▴",
  "&blacktriangledown;": "▾",
  "&blacktriangleleft;": "◂",
  "&blacktriangleright;": "▸",
  "&blank;": "␣",
  "&blk12;": "▒",
  "&blk14;": "░",
  "&blk34;": "▓",
  "&block;": "█",
  "&bne;": "=⃥",
  "&bnequiv;": "≡⃥",
  "&bnot;": "⌐",
  "&bopf;": "\uD835\uDD53",
  "&bot;": "⊥",
  "&bottom;": "⊥",
  "&bowtie;": "⋈",
  "&boxDL;": "╗",
  "&boxDR;": "╔",
  "&boxDl;": "╖",
  "&boxDr;": "╓",
  "&boxH;": "═",
  "&boxHD;": "╦",
  "&boxHU;": "╩",
  "&boxHd;": "╤",
  "&boxHu;": "╧",
  "&boxUL;": "╝",
  "&boxUR;": "╚",
  "&boxUl;": "╜",
  "&boxUr;": "╙",
  "&boxV;": "║",
  "&boxVH;": "╬",
  "&boxVL;": "╣",
  "&boxVR;": "╠",
  "&boxVh;": "╫",
  "&boxVl;": "╢",
  "&boxVr;": "╟",
  "&boxbox;": "⧉",
  "&boxdL;": "╕",
  "&boxdR;": "╒",
  "&boxdl;": "┐",
  "&boxdr;": "┌",
  "&boxh;": "─",
  "&boxhD;": "╥",
  "&boxhU;": "╨",
  "&boxhd;": "┬",
  "&boxhu;": "┴",
  "&boxminus;": "⊟",
  "&boxplus;": "⊞",
  "&boxtimes;": "⊠",
  "&boxuL;": "╛",
  "&boxuR;": "╘",
  "&boxul;": "┘",
  "&boxur;": "└",
  "&boxv;": "│",
  "&boxvH;": "╪",
  "&boxvL;": "╡",
  "&boxvR;": "╞",
  "&boxvh;": "┼",
  "&boxvl;": "┤",
  "&boxvr;": "├",
  "&bprime;": "‵",
  "&breve;": "˘",
  "&brvbar": "¦",
  "&brvbar;": "¦",
  "&bscr;": "\uD835\uDCB7",
  "&bsemi;": "⁏",
  "&bsim;": "∽",
  "&bsime;": "⋍",
  "&bsol;": "\\",
  "&bsolb;": "⧅",
  "&bsolhsub;": "⟈",
  "&bull;": "•",
  "&bullet;": "•",
  "&bump;": "≎",
  "&bumpE;": "⪮",
  "&bumpe;": "≏",
  "&bumpeq;": "≏",
  "&cacute;": "ć",
  "&cap;": "∩",
  "&capand;": "⩄",
  "&capbrcup;": "⩉",
  "&capcap;": "⩋",
  "&capcup;": "⩇",
  "&capdot;": "⩀",
  "&caps;": "∩︀",
  "&caret;": "⁁",
  "&caron;": "ˇ",
  "&ccaps;": "⩍",
  "&ccaron;": "č",
  "&ccedil": "ç",
  "&ccedil;": "ç",
  "&ccirc;": "ĉ",
  "&ccups;": "⩌",
  "&ccupssm;": "⩐",
  "&cdot;": "ċ",
  "&cedil": "¸",
  "&cedil;": "¸",
  "&cemptyv;": "⦲",
  "&cent": "¢",
  "&cent;": "¢",
  "&centerdot;": "·",
  "&cfr;": "\uD835\uDD20",
  "&chcy;": "ч",
  "&check;": "✓",
  "&checkmark;": "✓",
  "&chi;": "χ",
  "&cir;": "○",
  "&cirE;": "⧃",
  "&circ;": "ˆ",
  "&circeq;": "≗",
  "&circlearrowleft;": "↺",
  "&circlearrowright;": "↻",
  "&circledR;": "®",
  "&circledS;": "Ⓢ",
  "&circledast;": "⊛",
  "&circledcirc;": "⊚",
  "&circleddash;": "⊝",
  "&cire;": "≗",
  "&cirfnint;": "⨐",
  "&cirmid;": "⫯",
  "&cirscir;": "⧂",
  "&clubs;": "♣",
  "&clubsuit;": "♣",
  "&colon;": ":",
  "&colone;": "≔",
  "&coloneq;": "≔",
  "&comma;": ",",
  "&commat;": "@",
  "&comp;": "∁",
  "&compfn;": "∘",
  "&complement;": "∁",
  "&complexes;": "ℂ",
  "&cong;": "≅",
  "&congdot;": "⩭",
  "&conint;": "∮",
  "&copf;": "\uD835\uDD54",
  "&coprod;": "∐",
  "&copy": "©",
  "&copy;": "©",
  "&copysr;": "℗",
  "&crarr;": "↵",
  "&cross;": "✗",
  "&cscr;": "\uD835\uDCB8",
  "&csub;": "⫏",
  "&csube;": "⫑",
  "&csup;": "⫐",
  "&csupe;": "⫒",
  "&ctdot;": "⋯",
  "&cudarrl;": "⤸",
  "&cudarrr;": "⤵",
  "&cuepr;": "⋞",
  "&cuesc;": "⋟",
  "&cularr;": "↶",
  "&cularrp;": "⤽",
  "&cup;": "∪",
  "&cupbrcap;": "⩈",
  "&cupcap;": "⩆",
  "&cupcup;": "⩊",
  "&cupdot;": "⊍",
  "&cupor;": "⩅",
  "&cups;": "∪︀",
  "&curarr;": "↷",
  "&curarrm;": "⤼",
  "&curlyeqprec;": "⋞",
  "&curlyeqsucc;": "⋟",
  "&curlyvee;": "⋎",
  "&curlywedge;": "⋏",
  "&curren": "¤",
  "&curren;": "¤",
  "&curvearrowleft;": "↶",
  "&curvearrowright;": "↷",
  "&cuvee;": "⋎",
  "&cuwed;": "⋏",
  "&cwconint;": "∲",
  "&cwint;": "∱",
  "&cylcty;": "⌭",
  "&dArr;": "⇓",
  "&dHar;": "⥥",
  "&dagger;": "†",
  "&daleth;": "ℸ",
  "&darr;": "↓",
  "&dash;": "‐",
  "&dashv;": "⊣",
  "&dbkarow;": "⤏",
  "&dblac;": "˝",
  "&dcaron;": "ď",
  "&dcy;": "д",
  "&dd;": "ⅆ",
  "&ddagger;": "‡",
  "&ddarr;": "⇊",
  "&ddotseq;": "⩷",
  "&deg": "°",
  "&deg;": "°",
  "&delta;": "δ",
  "&demptyv;": "⦱",
  "&dfisht;": "⥿",
  "&dfr;": "\uD835\uDD21",
  "&dharl;": "⇃",
  "&dharr;": "⇂",
  "&diam;": "⋄",
  "&diamond;": "⋄",
  "&diamondsuit;": "♦",
  "&diams;": "♦",
  "&die;": "¨",
  "&digamma;": "ϝ",
  "&disin;": "⋲",
  "&div;": "÷",
  "&divide": "÷",
  "&divide;": "÷",
  "&divideontimes;": "⋇",
  "&divonx;": "⋇",
  "&djcy;": "ђ",
  "&dlcorn;": "⌞",
  "&dlcrop;": "⌍",
  "&dollar;": "$",
  "&dopf;": "\uD835\uDD55",
  "&dot;": "˙",
  "&doteq;": "≐",
  "&doteqdot;": "≑",
  "&dotminus;": "∸",
  "&dotplus;": "∔",
  "&dotsquare;": "⊡",
  "&doublebarwedge;": "⌆",
  "&downarrow;": "↓",
  "&downdownarrows;": "⇊",
  "&downharpoonleft;": "⇃",
  "&downharpoonright;": "⇂",
  "&drbkarow;": "⤐",
  "&drcorn;": "⌟",
  "&drcrop;": "⌌",
  "&dscr;": "\uD835\uDCB9",
  "&dscy;": "ѕ",
  "&dsol;": "⧶",
  "&dstrok;": "đ",
  "&dtdot;": "⋱",
  "&dtri;": "▿",
  "&dtrif;": "▾",
  "&duarr;": "⇵",
  "&duhar;": "⥯",
  "&dwangle;": "⦦",
  "&dzcy;": "џ",
  "&dzigrarr;": "⟿",
  "&eDDot;": "⩷",
  "&eDot;": "≑",
  "&eacute": "é",
  "&eacute;": "é",
  "&easter;": "⩮",
  "&ecaron;": "ě",
  "&ecir;": "≖",
  "&ecirc": "ê",
  "&ecirc;": "ê",
  "&ecolon;": "≕",
  "&ecy;": "э",
  "&edot;": "ė",
  "&ee;": "ⅇ",
  "&efDot;": "≒",
  "&efr;": "\uD835\uDD22",
  "&eg;": "⪚",
  "&egrave": "è",
  "&egrave;": "è",
  "&egs;": "⪖",
  "&egsdot;": "⪘",
  "&el;": "⪙",
  "&elinters;": "⏧",
  "&ell;": "ℓ",
  "&els;": "⪕",
  "&elsdot;": "⪗",
  "&emacr;": "ē",
  "&empty;": "∅",
  "&emptyset;": "∅",
  "&emptyv;": "∅",
  "&emsp13;": " ",
  "&emsp14;": " ",
  "&emsp;": " ",
  "&eng;": "ŋ",
  "&ensp;": " ",
  "&eogon;": "ę",
  "&eopf;": "\uD835\uDD56",
  "&epar;": "⋕",
  "&eparsl;": "⧣",
  "&eplus;": "⩱",
  "&epsi;": "ε",
  "&epsilon;": "ε",
  "&epsiv;": "ϵ",
  "&eqcirc;": "≖",
  "&eqcolon;": "≕",
  "&eqsim;": "≂",
  "&eqslantgtr;": "⪖",
  "&eqslantless;": "⪕",
  "&equals;": "=",
  "&equest;": "≟",
  "&equiv;": "≡",
  "&equivDD;": "⩸",
  "&eqvparsl;": "⧥",
  "&erDot;": "≓",
  "&erarr;": "⥱",
  "&escr;": "ℯ",
  "&esdot;": "≐",
  "&esim;": "≂",
  "&eta;": "η",
  "&eth": "ð",
  "&eth;": "ð",
  "&euml": "ë",
  "&euml;": "ë",
  "&euro;": "€",
  "&excl;": "!",
  "&exist;": "∃",
  "&expectation;": "ℰ",
  "&exponentiale;": "ⅇ",
  "&fallingdotseq;": "≒",
  "&fcy;": "ф",
  "&female;": "♀",
  "&ffilig;": "ﬃ",
  "&fflig;": "ﬀ",
  "&ffllig;": "ﬄ",
  "&ffr;": "\uD835\uDD23",
  "&filig;": "ﬁ",
  "&fjlig;": "fj",
  "&flat;": "♭",
  "&fllig;": "ﬂ",
  "&fltns;": "▱",
  "&fnof;": "ƒ",
  "&fopf;": "\uD835\uDD57",
  "&forall;": "∀",
  "&fork;": "⋔",
  "&forkv;": "⫙",
  "&fpartint;": "⨍",
  "&frac12": "½",
  "&frac12;": "½",
  "&frac13;": "⅓",
  "&frac14": "¼",
  "&frac14;": "¼",
  "&frac15;": "⅕",
  "&frac16;": "⅙",
  "&frac18;": "⅛",
  "&frac23;": "⅔",
  "&frac25;": "⅖",
  "&frac34": "¾",
  "&frac34;": "¾",
  "&frac35;": "⅗",
  "&frac38;": "⅜",
  "&frac45;": "⅘",
  "&frac56;": "⅚",
  "&frac58;": "⅝",
  "&frac78;": "⅞",
  "&frasl;": "⁄",
  "&frown;": "⌢",
  "&fscr;": "\uD835\uDCBB",
  "&gE;": "≧",
  "&gEl;": "⪌",
  "&gacute;": "ǵ",
  "&gamma;": "γ",
  "&gammad;": "ϝ",
  "&gap;": "⪆",
  "&gbreve;": "ğ",
  "&gcirc;": "ĝ",
  "&gcy;": "г",
  "&gdot;": "ġ",
  "&ge;": "≥",
  "&gel;": "⋛",
  "&geq;": "≥",
  "&geqq;": "≧",
  "&geqslant;": "⩾",
  "&ges;": "⩾",
  "&gescc;": "⪩",
  "&gesdot;": "⪀",
  "&gesdoto;": "⪂",
  "&gesdotol;": "⪄",
  "&gesl;": "⋛︀",
  "&gesles;": "⪔",
  "&gfr;": "\uD835\uDD24",
  "&gg;": "≫",
  "&ggg;": "⋙",
  "&gimel;": "ℷ",
  "&gjcy;": "ѓ",
  "&gl;": "≷",
  "&glE;": "⪒",
  "&gla;": "⪥",
  "&glj;": "⪤",
  "&gnE;": "≩",
  "&gnap;": "⪊",
  "&gnapprox;": "⪊",
  "&gne;": "⪈",
  "&gneq;": "⪈",
  "&gneqq;": "≩",
  "&gnsim;": "⋧",
  "&gopf;": "\uD835\uDD58",
  "&grave;": "`",
  "&gscr;": "ℊ",
  "&gsim;": "≳",
  "&gsime;": "⪎",
  "&gsiml;": "⪐",
  "&gt": ">",
  "&gt;": ">",
  "&gtcc;": "⪧",
  "&gtcir;": "⩺",
  "&gtdot;": "⋗",
  "&gtlPar;": "⦕",
  "&gtquest;": "⩼",
  "&gtrapprox;": "⪆",
  "&gtrarr;": "⥸",
  "&gtrdot;": "⋗",
  "&gtreqless;": "⋛",
  "&gtreqqless;": "⪌",
  "&gtrless;": "≷",
  "&gtrsim;": "≳",
  "&gvertneqq;": "≩︀",
  "&gvnE;": "≩︀",
  "&hArr;": "⇔",
  "&hairsp;": " ",
  "&half;": "½",
  "&hamilt;": "ℋ",
  "&hardcy;": "ъ",
  "&harr;": "↔",
  "&harrcir;": "⥈",
  "&harrw;": "↭",
  "&hbar;": "ℏ",
  "&hcirc;": "ĥ",
  "&hearts;": "♥",
  "&heartsuit;": "♥",
  "&hellip;": "…",
  "&hercon;": "⊹",
  "&hfr;": "\uD835\uDD25",
  "&hksearow;": "⤥",
  "&hkswarow;": "⤦",
  "&hoarr;": "⇿",
  "&homtht;": "∻",
  "&hookleftarrow;": "↩",
  "&hookrightarrow;": "↪",
  "&hopf;": "\uD835\uDD59",
  "&horbar;": "―",
  "&hscr;": "\uD835\uDCBD",
  "&hslash;": "ℏ",
  "&hstrok;": "ħ",
  "&hybull;": "⁃",
  "&hyphen;": "‐",
  "&iacute": "í",
  "&iacute;": "í",
  "&ic;": "⁣",
  "&icirc": "î",
  "&icirc;": "î",
  "&icy;": "и",
  "&iecy;": "е",
  "&iexcl": "¡",
  "&iexcl;": "¡",
  "&iff;": "⇔",
  "&ifr;": "\uD835\uDD26",
  "&igrave": "ì",
  "&igrave;": "ì",
  "&ii;": "ⅈ",
  "&iiiint;": "⨌",
  "&iiint;": "∭",
  "&iinfin;": "⧜",
  "&iiota;": "℩",
  "&ijlig;": "ĳ",
  "&imacr;": "ī",
  "&image;": "ℑ",
  "&imagline;": "ℐ",
  "&imagpart;": "ℑ",
  "&imath;": "ı",
  "&imof;": "⊷",
  "&imped;": "Ƶ",
  "&in;": "∈",
  "&incare;": "℅",
  "&infin;": "∞",
  "&infintie;": "⧝",
  "&inodot;": "ı",
  "&int;": "∫",
  "&intcal;": "⊺",
  "&integers;": "ℤ",
  "&intercal;": "⊺",
  "&intlarhk;": "⨗",
  "&intprod;": "⨼",
  "&iocy;": "ё",
  "&iogon;": "į",
  "&iopf;": "\uD835\uDD5A",
  "&iota;": "ι",
  "&iprod;": "⨼",
  "&iquest": "¿",
  "&iquest;": "¿",
  "&iscr;": "\uD835\uDCBE",
  "&isin;": "∈",
  "&isinE;": "⋹",
  "&isindot;": "⋵",
  "&isins;": "⋴",
  "&isinsv;": "⋳",
  "&isinv;": "∈",
  "&it;": "⁢",
  "&itilde;": "ĩ",
  "&iukcy;": "і",
  "&iuml": "ï",
  "&iuml;": "ï",
  "&jcirc;": "ĵ",
  "&jcy;": "й",
  "&jfr;": "\uD835\uDD27",
  "&jmath;": "ȷ",
  "&jopf;": "\uD835\uDD5B",
  "&jscr;": "\uD835\uDCBF",
  "&jsercy;": "ј",
  "&jukcy;": "є",
  "&kappa;": "κ",
  "&kappav;": "ϰ",
  "&kcedil;": "ķ",
  "&kcy;": "к",
  "&kfr;": "\uD835\uDD28",
  "&kgreen;": "ĸ",
  "&khcy;": "х",
  "&kjcy;": "ќ",
  "&kopf;": "\uD835\uDD5C",
  "&kscr;": "\uD835\uDCC0",
  "&lAarr;": "⇚",
  "&lArr;": "⇐",
  "&lAtail;": "⤛",
  "&lBarr;": "⤎",
  "&lE;": "≦",
  "&lEg;": "⪋",
  "&lHar;": "⥢",
  "&lacute;": "ĺ",
  "&laemptyv;": "⦴",
  "&lagran;": "ℒ",
  "&lambda;": "λ",
  "&lang;": "⟨",
  "&langd;": "⦑",
  "&langle;": "⟨",
  "&lap;": "⪅",
  "&laquo": "«",
  "&laquo;": "«",
  "&larr;": "←",
  "&larrb;": "⇤",
  "&larrbfs;": "⤟",
  "&larrfs;": "⤝",
  "&larrhk;": "↩",
  "&larrlp;": "↫",
  "&larrpl;": "⤹",
  "&larrsim;": "⥳",
  "&larrtl;": "↢",
  "&lat;": "⪫",
  "&latail;": "⤙",
  "&late;": "⪭",
  "&lates;": "⪭︀",
  "&lbarr;": "⤌",
  "&lbbrk;": "❲",
  "&lbrace;": "{",
  "&lbrack;": "[",
  "&lbrke;": "⦋",
  "&lbrksld;": "⦏",
  "&lbrkslu;": "⦍",
  "&lcaron;": "ľ",
  "&lcedil;": "ļ",
  "&lceil;": "⌈",
  "&lcub;": "{",
  "&lcy;": "л",
  "&ldca;": "⤶",
  "&ldquo;": "“",
  "&ldquor;": "„",
  "&ldrdhar;": "⥧",
  "&ldrushar;": "⥋",
  "&ldsh;": "↲",
  "&le;": "≤",
  "&leftarrow;": "←",
  "&leftarrowtail;": "↢",
  "&leftharpoondown;": "↽",
  "&leftharpoonup;": "↼",
  "&leftleftarrows;": "⇇",
  "&leftrightarrow;": "↔",
  "&leftrightarrows;": "⇆",
  "&leftrightharpoons;": "⇋",
  "&leftrightsquigarrow;": "↭",
  "&leftthreetimes;": "⋋",
  "&leg;": "⋚",
  "&leq;": "≤",
  "&leqq;": "≦",
  "&leqslant;": "⩽",
  "&les;": "⩽",
  "&lescc;": "⪨",
  "&lesdot;": "⩿",
  "&lesdoto;": "⪁",
  "&lesdotor;": "⪃",
  "&lesg;": "⋚︀",
  "&lesges;": "⪓",
  "&lessapprox;": "⪅",
  "&lessdot;": "⋖",
  "&lesseqgtr;": "⋚",
  "&lesseqqgtr;": "⪋",
  "&lessgtr;": "≶",
  "&lesssim;": "≲",
  "&lfisht;": "⥼",
  "&lfloor;": "⌊",
  "&lfr;": "\uD835\uDD29",
  "&lg;": "≶",
  "&lgE;": "⪑",
  "&lhard;": "↽",
  "&lharu;": "↼",
  "&lharul;": "⥪",
  "&lhblk;": "▄",
  "&ljcy;": "љ",
  "&ll;": "≪",
  "&llarr;": "⇇",
  "&llcorner;": "⌞",
  "&llhard;": "⥫",
  "&lltri;": "◺",
  "&lmidot;": "ŀ",
  "&lmoust;": "⎰",
  "&lmoustache;": "⎰",
  "&lnE;": "≨",
  "&lnap;": "⪉",
  "&lnapprox;": "⪉",
  "&lne;": "⪇",
  "&lneq;": "⪇",
  "&lneqq;": "≨",
  "&lnsim;": "⋦",
  "&loang;": "⟬",
  "&loarr;": "⇽",
  "&lobrk;": "⟦",
  "&longleftarrow;": "⟵",
  "&longleftrightarrow;": "⟷",
  "&longmapsto;": "⟼",
  "&longrightarrow;": "⟶",
  "&looparrowleft;": "↫",
  "&looparrowright;": "↬",
  "&lopar;": "⦅",
  "&lopf;": "\uD835\uDD5D",
  "&loplus;": "⨭",
  "&lotimes;": "⨴",
  "&lowast;": "∗",
  "&lowbar;": "_",
  "&loz;": "◊",
  "&lozenge;": "◊",
  "&lozf;": "⧫",
  "&lpar;": "(",
  "&lparlt;": "⦓",
  "&lrarr;": "⇆",
  "&lrcorner;": "⌟",
  "&lrhar;": "⇋",
  "&lrhard;": "⥭",
  "&lrm;": "‎",
  "&lrtri;": "⊿",
  "&lsaquo;": "‹",
  "&lscr;": "\uD835\uDCC1",
  "&lsh;": "↰",
  "&lsim;": "≲",
  "&lsime;": "⪍",
  "&lsimg;": "⪏",
  "&lsqb;": "[",
  "&lsquo;": "‘",
  "&lsquor;": "‚",
  "&lstrok;": "ł",
  "&lt": "<",
  "&lt;": "<",
  "&ltcc;": "⪦",
  "&ltcir;": "⩹",
  "&ltdot;": "⋖",
  "&lthree;": "⋋",
  "&ltimes;": "⋉",
  "&ltlarr;": "⥶",
  "&ltquest;": "⩻",
  "&ltrPar;": "⦖",
  "&ltri;": "◃",
  "&ltrie;": "⊴",
  "&ltrif;": "◂",
  "&lurdshar;": "⥊",
  "&luruhar;": "⥦",
  "&lvertneqq;": "≨︀",
  "&lvnE;": "≨︀",
  "&mDDot;": "∺",
  "&macr": "¯",
  "&macr;": "¯",
  "&male;": "♂",
  "&malt;": "✠",
  "&maltese;": "✠",
  "&map;": "↦",
  "&mapsto;": "↦",
  "&mapstodown;": "↧",
  "&mapstoleft;": "↤",
  "&mapstoup;": "↥",
  "&marker;": "▮",
  "&mcomma;": "⨩",
  "&mcy;": "м",
  "&mdash;": "—",
  "&measuredangle;": "∡",
  "&mfr;": "\uD835\uDD2A",
  "&mho;": "℧",
  "&micro": "µ",
  "&micro;": "µ",
  "&mid;": "∣",
  "&midast;": "*",
  "&midcir;": "⫰",
  "&middot": "·",
  "&middot;": "·",
  "&minus;": "−",
  "&minusb;": "⊟",
  "&minusd;": "∸",
  "&minusdu;": "⨪",
  "&mlcp;": "⫛",
  "&mldr;": "…",
  "&mnplus;": "∓",
  "&models;": "⊧",
  "&mopf;": "\uD835\uDD5E",
  "&mp;": "∓",
  "&mscr;": "\uD835\uDCC2",
  "&mstpos;": "∾",
  "&mu;": "μ",
  "&multimap;": "⊸",
  "&mumap;": "⊸",
  "&nGg;": "⋙̸",
  "&nGt;": "≫⃒",
  "&nGtv;": "≫̸",
  "&nLeftarrow;": "⇍",
  "&nLeftrightarrow;": "⇎",
  "&nLl;": "⋘̸",
  "&nLt;": "≪⃒",
  "&nLtv;": "≪̸",
  "&nRightarrow;": "⇏",
  "&nVDash;": "⊯",
  "&nVdash;": "⊮",
  "&nabla;": "∇",
  "&nacute;": "ń",
  "&nang;": "∠⃒",
  "&nap;": "≉",
  "&napE;": "⩰̸",
  "&napid;": "≋̸",
  "&napos;": "ŉ",
  "&napprox;": "≉",
  "&natur;": "♮",
  "&natural;": "♮",
  "&naturals;": "ℕ",
  "&nbsp": " ",
  "&nbsp;": " ",
  "&nbump;": "≎̸",
  "&nbumpe;": "≏̸",
  "&ncap;": "⩃",
  "&ncaron;": "ň",
  "&ncedil;": "ņ",
  "&ncong;": "≇",
  "&ncongdot;": "⩭̸",
  "&ncup;": "⩂",
  "&ncy;": "н",
  "&ndash;": "–",
  "&ne;": "≠",
  "&neArr;": "⇗",
  "&nearhk;": "⤤",
  "&nearr;": "↗",
  "&nearrow;": "↗",
  "&nedot;": "≐̸",
  "&nequiv;": "≢",
  "&nesear;": "⤨",
  "&nesim;": "≂̸",
  "&nexist;": "∄",
  "&nexists;": "∄",
  "&nfr;": "\uD835\uDD2B",
  "&ngE;": "≧̸",
  "&nge;": "≱",
  "&ngeq;": "≱",
  "&ngeqq;": "≧̸",
  "&ngeqslant;": "⩾̸",
  "&nges;": "⩾̸",
  "&ngsim;": "≵",
  "&ngt;": "≯",
  "&ngtr;": "≯",
  "&nhArr;": "⇎",
  "&nharr;": "↮",
  "&nhpar;": "⫲",
  "&ni;": "∋",
  "&nis;": "⋼",
  "&nisd;": "⋺",
  "&niv;": "∋",
  "&njcy;": "њ",
  "&nlArr;": "⇍",
  "&nlE;": "≦̸",
  "&nlarr;": "↚",
  "&nldr;": "‥",
  "&nle;": "≰",
  "&nleftarrow;": "↚",
  "&nleftrightarrow;": "↮",
  "&nleq;": "≰",
  "&nleqq;": "≦̸",
  "&nleqslant;": "⩽̸",
  "&nles;": "⩽̸",
  "&nless;": "≮",
  "&nlsim;": "≴",
  "&nlt;": "≮",
  "&nltri;": "⋪",
  "&nltrie;": "⋬",
  "&nmid;": "∤",
  "&nopf;": "\uD835\uDD5F",
  "&not": "¬",
  "&not;": "¬",
  "&notin;": "∉",
  "&notinE;": "⋹̸",
  "&notindot;": "⋵̸",
  "&notinva;": "∉",
  "&notinvb;": "⋷",
  "&notinvc;": "⋶",
  "&notni;": "∌",
  "&notniva;": "∌",
  "&notnivb;": "⋾",
  "&notnivc;": "⋽",
  "&npar;": "∦",
  "&nparallel;": "∦",
  "&nparsl;": "⫽⃥",
  "&npart;": "∂̸",
  "&npolint;": "⨔",
  "&npr;": "⊀",
  "&nprcue;": "⋠",
  "&npre;": "⪯̸",
  "&nprec;": "⊀",
  "&npreceq;": "⪯̸",
  "&nrArr;": "⇏",
  "&nrarr;": "↛",
  "&nrarrc;": "⤳̸",
  "&nrarrw;": "↝̸",
  "&nrightarrow;": "↛",
  "&nrtri;": "⋫",
  "&nrtrie;": "⋭",
  "&nsc;": "⊁",
  "&nsccue;": "⋡",
  "&nsce;": "⪰̸",
  "&nscr;": "\uD835\uDCC3",
  "&nshortmid;": "∤",
  "&nshortparallel;": "∦",
  "&nsim;": "≁",
  "&nsime;": "≄",
  "&nsimeq;": "≄",
  "&nsmid;": "∤",
  "&nspar;": "∦",
  "&nsqsube;": "⋢",
  "&nsqsupe;": "⋣",
  "&nsub;": "⊄",
  "&nsubE;": "⫅̸",
  "&nsube;": "⊈",
  "&nsubset;": "⊂⃒",
  "&nsubseteq;": "⊈",
  "&nsubseteqq;": "⫅̸",
  "&nsucc;": "⊁",
  "&nsucceq;": "⪰̸",
  "&nsup;": "⊅",
  "&nsupE;": "⫆̸",
  "&nsupe;": "⊉",
  "&nsupset;": "⊃⃒",
  "&nsupseteq;": "⊉",
  "&nsupseteqq;": "⫆̸",
  "&ntgl;": "≹",
  "&ntilde": "ñ",
  "&ntilde;": "ñ",
  "&ntlg;": "≸",
  "&ntriangleleft;": "⋪",
  "&ntrianglelefteq;": "⋬",
  "&ntriangleright;": "⋫",
  "&ntrianglerighteq;": "⋭",
  "&nu;": "ν",
  "&num;": "#",
  "&numero;": "№",
  "&numsp;": " ",
  "&nvDash;": "⊭",
  "&nvHarr;": "⤄",
  "&nvap;": "≍⃒",
  "&nvdash;": "⊬",
  "&nvge;": "≥⃒",
  "&nvgt;": ">⃒",
  "&nvinfin;": "⧞",
  "&nvlArr;": "⤂",
  "&nvle;": "≤⃒",
  "&nvlt;": "<⃒",
  "&nvltrie;": "⊴⃒",
  "&nvrArr;": "⤃",
  "&nvrtrie;": "⊵⃒",
  "&nvsim;": "∼⃒",
  "&nwArr;": "⇖",
  "&nwarhk;": "⤣",
  "&nwarr;": "↖",
  "&nwarrow;": "↖",
  "&nwnear;": "⤧",
  "&oS;": "Ⓢ",
  "&oacute": "ó",
  "&oacute;": "ó",
  "&oast;": "⊛",
  "&ocir;": "⊚",
  "&ocirc": "ô",
  "&ocirc;": "ô",
  "&ocy;": "о",
  "&odash;": "⊝",
  "&odblac;": "ő",
  "&odiv;": "⨸",
  "&odot;": "⊙",
  "&odsold;": "⦼",
  "&oelig;": "œ",
  "&ofcir;": "⦿",
  "&ofr;": "\uD835\uDD2C",
  "&ogon;": "˛",
  "&ograve": "ò",
  "&ograve;": "ò",
  "&ogt;": "⧁",
  "&ohbar;": "⦵",
  "&ohm;": "Ω",
  "&oint;": "∮",
  "&olarr;": "↺",
  "&olcir;": "⦾",
  "&olcross;": "⦻",
  "&oline;": "‾",
  "&olt;": "⧀",
  "&omacr;": "ō",
  "&omega;": "ω",
  "&omicron;": "ο",
  "&omid;": "⦶",
  "&ominus;": "⊖",
  "&oopf;": "\uD835\uDD60",
  "&opar;": "⦷",
  "&operp;": "⦹",
  "&oplus;": "⊕",
  "&or;": "∨",
  "&orarr;": "↻",
  "&ord;": "⩝",
  "&order;": "ℴ",
  "&orderof;": "ℴ",
  "&ordf": "ª",
  "&ordf;": "ª",
  "&ordm": "º",
  "&ordm;": "º",
  "&origof;": "⊶",
  "&oror;": "⩖",
  "&orslope;": "⩗",
  "&orv;": "⩛",
  "&oscr;": "ℴ",
  "&oslash": "ø",
  "&oslash;": "ø",
  "&osol;": "⊘",
  "&otilde": "õ",
  "&otilde;": "õ",
  "&otimes;": "⊗",
  "&otimesas;": "⨶",
  "&ouml": "ö",
  "&ouml;": "ö",
  "&ovbar;": "⌽",
  "&par;": "∥",
  "&para": "¶",
  "&para;": "¶",
  "&parallel;": "∥",
  "&parsim;": "⫳",
  "&parsl;": "⫽",
  "&part;": "∂",
  "&pcy;": "п",
  "&percnt;": "%",
  "&period;": ".",
  "&permil;": "‰",
  "&perp;": "⊥",
  "&pertenk;": "‱",
  "&pfr;": "\uD835\uDD2D",
  "&phi;": "φ",
  "&phiv;": "ϕ",
  "&phmmat;": "ℳ",
  "&phone;": "☎",
  "&pi;": "π",
  "&pitchfork;": "⋔",
  "&piv;": "ϖ",
  "&planck;": "ℏ",
  "&planckh;": "ℎ",
  "&plankv;": "ℏ",
  "&plus;": "+",
  "&plusacir;": "⨣",
  "&plusb;": "⊞",
  "&pluscir;": "⨢",
  "&plusdo;": "∔",
  "&plusdu;": "⨥",
  "&pluse;": "⩲",
  "&plusmn": "±",
  "&plusmn;": "±",
  "&plussim;": "⨦",
  "&plustwo;": "⨧",
  "&pm;": "±",
  "&pointint;": "⨕",
  "&popf;": "\uD835\uDD61",
  "&pound": "£",
  "&pound;": "£",
  "&pr;": "≺",
  "&prE;": "⪳",
  "&prap;": "⪷",
  "&prcue;": "≼",
  "&pre;": "⪯",
  "&prec;": "≺",
  "&precapprox;": "⪷",
  "&preccurlyeq;": "≼",
  "&preceq;": "⪯",
  "&precnapprox;": "⪹",
  "&precneqq;": "⪵",
  "&precnsim;": "⋨",
  "&precsim;": "≾",
  "&prime;": "′",
  "&primes;": "ℙ",
  "&prnE;": "⪵",
  "&prnap;": "⪹",
  "&prnsim;": "⋨",
  "&prod;": "∏",
  "&profalar;": "⌮",
  "&profline;": "⌒",
  "&profsurf;": "⌓",
  "&prop;": "∝",
  "&propto;": "∝",
  "&prsim;": "≾",
  "&prurel;": "⊰",
  "&pscr;": "\uD835\uDCC5",
  "&psi;": "ψ",
  "&puncsp;": " ",
  "&qfr;": "\uD835\uDD2E",
  "&qint;": "⨌",
  "&qopf;": "\uD835\uDD62",
  "&qprime;": "⁗",
  "&qscr;": "\uD835\uDCC6",
  "&quaternions;": "ℍ",
  "&quatint;": "⨖",
  "&quest;": "?",
  "&questeq;": "≟",
  "&quot": '"',
  "&quot;": '"',
  "&rAarr;": "⇛",
  "&rArr;": "⇒",
  "&rAtail;": "⤜",
  "&rBarr;": "⤏",
  "&rHar;": "⥤",
  "&race;": "∽̱",
  "&racute;": "ŕ",
  "&radic;": "√",
  "&raemptyv;": "⦳",
  "&rang;": "⟩",
  "&rangd;": "⦒",
  "&range;": "⦥",
  "&rangle;": "⟩",
  "&raquo": "»",
  "&raquo;": "»",
  "&rarr;": "→",
  "&rarrap;": "⥵",
  "&rarrb;": "⇥",
  "&rarrbfs;": "⤠",
  "&rarrc;": "⤳",
  "&rarrfs;": "⤞",
  "&rarrhk;": "↪",
  "&rarrlp;": "↬",
  "&rarrpl;": "⥅",
  "&rarrsim;": "⥴",
  "&rarrtl;": "↣",
  "&rarrw;": "↝",
  "&ratail;": "⤚",
  "&ratio;": "∶",
  "&rationals;": "ℚ",
  "&rbarr;": "⤍",
  "&rbbrk;": "❳",
  "&rbrace;": "}",
  "&rbrack;": "]",
  "&rbrke;": "⦌",
  "&rbrksld;": "⦎",
  "&rbrkslu;": "⦐",
  "&rcaron;": "ř",
  "&rcedil;": "ŗ",
  "&rceil;": "⌉",
  "&rcub;": "}",
  "&rcy;": "р",
  "&rdca;": "⤷",
  "&rdldhar;": "⥩",
  "&rdquo;": "”",
  "&rdquor;": "”",
  "&rdsh;": "↳",
  "&real;": "ℜ",
  "&realine;": "ℛ",
  "&realpart;": "ℜ",
  "&reals;": "ℝ",
  "&rect;": "▭",
  "&reg": "®",
  "&reg;": "®",
  "&rfisht;": "⥽",
  "&rfloor;": "⌋",
  "&rfr;": "\uD835\uDD2F",
  "&rhard;": "⇁",
  "&rharu;": "⇀",
  "&rharul;": "⥬",
  "&rho;": "ρ",
  "&rhov;": "ϱ",
  "&rightarrow;": "→",
  "&rightarrowtail;": "↣",
  "&rightharpoondown;": "⇁",
  "&rightharpoonup;": "⇀",
  "&rightleftarrows;": "⇄",
  "&rightleftharpoons;": "⇌",
  "&rightrightarrows;": "⇉",
  "&rightsquigarrow;": "↝",
  "&rightthreetimes;": "⋌",
  "&ring;": "˚",
  "&risingdotseq;": "≓",
  "&rlarr;": "⇄",
  "&rlhar;": "⇌",
  "&rlm;": "‏",
  "&rmoust;": "⎱",
  "&rmoustache;": "⎱",
  "&rnmid;": "⫮",
  "&roang;": "⟭",
  "&roarr;": "⇾",
  "&robrk;": "⟧",
  "&ropar;": "⦆",
  "&ropf;": "\uD835\uDD63",
  "&roplus;": "⨮",
  "&rotimes;": "⨵",
  "&rpar;": ")",
  "&rpargt;": "⦔",
  "&rppolint;": "⨒",
  "&rrarr;": "⇉",
  "&rsaquo;": "›",
  "&rscr;": "\uD835\uDCC7",
  "&rsh;": "↱",
  "&rsqb;": "]",
  "&rsquo;": "’",
  "&rsquor;": "’",
  "&rthree;": "⋌",
  "&rtimes;": "⋊",
  "&rtri;": "▹",
  "&rtrie;": "⊵",
  "&rtrif;": "▸",
  "&rtriltri;": "⧎",
  "&ruluhar;": "⥨",
  "&rx;": "℞",
  "&sacute;": "ś",
  "&sbquo;": "‚",
  "&sc;": "≻",
  "&scE;": "⪴",
  "&scap;": "⪸",
  "&scaron;": "š",
  "&sccue;": "≽",
  "&sce;": "⪰",
  "&scedil;": "ş",
  "&scirc;": "ŝ",
  "&scnE;": "⪶",
  "&scnap;": "⪺",
  "&scnsim;": "⋩",
  "&scpolint;": "⨓",
  "&scsim;": "≿",
  "&scy;": "с",
  "&sdot;": "⋅",
  "&sdotb;": "⊡",
  "&sdote;": "⩦",
  "&seArr;": "⇘",
  "&searhk;": "⤥",
  "&searr;": "↘",
  "&searrow;": "↘",
  "&sect": "§",
  "&sect;": "§",
  "&semi;": ";",
  "&seswar;": "⤩",
  "&setminus;": "∖",
  "&setmn;": "∖",
  "&sext;": "✶",
  "&sfr;": "\uD835\uDD30",
  "&sfrown;": "⌢",
  "&sharp;": "♯",
  "&shchcy;": "щ",
  "&shcy;": "ш",
  "&shortmid;": "∣",
  "&shortparallel;": "∥",
  "&shy": "­",
  "&shy;": "­",
  "&sigma;": "σ",
  "&sigmaf;": "ς",
  "&sigmav;": "ς",
  "&sim;": "∼",
  "&simdot;": "⩪",
  "&sime;": "≃",
  "&simeq;": "≃",
  "&simg;": "⪞",
  "&simgE;": "⪠",
  "&siml;": "⪝",
  "&simlE;": "⪟",
  "&simne;": "≆",
  "&simplus;": "⨤",
  "&simrarr;": "⥲",
  "&slarr;": "←",
  "&smallsetminus;": "∖",
  "&smashp;": "⨳",
  "&smeparsl;": "⧤",
  "&smid;": "∣",
  "&smile;": "⌣",
  "&smt;": "⪪",
  "&smte;": "⪬",
  "&smtes;": "⪬︀",
  "&softcy;": "ь",
  "&sol;": "/",
  "&solb;": "⧄",
  "&solbar;": "⌿",
  "&sopf;": "\uD835\uDD64",
  "&spades;": "♠",
  "&spadesuit;": "♠",
  "&spar;": "∥",
  "&sqcap;": "⊓",
  "&sqcaps;": "⊓︀",
  "&sqcup;": "⊔",
  "&sqcups;": "⊔︀",
  "&sqsub;": "⊏",
  "&sqsube;": "⊑",
  "&sqsubset;": "⊏",
  "&sqsubseteq;": "⊑",
  "&sqsup;": "⊐",
  "&sqsupe;": "⊒",
  "&sqsupset;": "⊐",
  "&sqsupseteq;": "⊒",
  "&squ;": "□",
  "&square;": "□",
  "&squarf;": "▪",
  "&squf;": "▪",
  "&srarr;": "→",
  "&sscr;": "\uD835\uDCC8",
  "&ssetmn;": "∖",
  "&ssmile;": "⌣",
  "&sstarf;": "⋆",
  "&star;": "☆",
  "&starf;": "★",
  "&straightepsilon;": "ϵ",
  "&straightphi;": "ϕ",
  "&strns;": "¯",
  "&sub;": "⊂",
  "&subE;": "⫅",
  "&subdot;": "⪽",
  "&sube;": "⊆",
  "&subedot;": "⫃",
  "&submult;": "⫁",
  "&subnE;": "⫋",
  "&subne;": "⊊",
  "&subplus;": "⪿",
  "&subrarr;": "⥹",
  "&subset;": "⊂",
  "&subseteq;": "⊆",
  "&subseteqq;": "⫅",
  "&subsetneq;": "⊊",
  "&subsetneqq;": "⫋",
  "&subsim;": "⫇",
  "&subsub;": "⫕",
  "&subsup;": "⫓",
  "&succ;": "≻",
  "&succapprox;": "⪸",
  "&succcurlyeq;": "≽",
  "&succeq;": "⪰",
  "&succnapprox;": "⪺",
  "&succneqq;": "⪶",
  "&succnsim;": "⋩",
  "&succsim;": "≿",
  "&sum;": "∑",
  "&sung;": "♪",
  "&sup1": "¹",
  "&sup1;": "¹",
  "&sup2": "²",
  "&sup2;": "²",
  "&sup3": "³",
  "&sup3;": "³",
  "&sup;": "⊃",
  "&supE;": "⫆",
  "&supdot;": "⪾",
  "&supdsub;": "⫘",
  "&supe;": "⊇",
  "&supedot;": "⫄",
  "&suphsol;": "⟉",
  "&suphsub;": "⫗",
  "&suplarr;": "⥻",
  "&supmult;": "⫂",
  "&supnE;": "⫌",
  "&supne;": "⊋",
  "&supplus;": "⫀",
  "&supset;": "⊃",
  "&supseteq;": "⊇",
  "&supseteqq;": "⫆",
  "&supsetneq;": "⊋",
  "&supsetneqq;": "⫌",
  "&supsim;": "⫈",
  "&supsub;": "⫔",
  "&supsup;": "⫖",
  "&swArr;": "⇙",
  "&swarhk;": "⤦",
  "&swarr;": "↙",
  "&swarrow;": "↙",
  "&swnwar;": "⤪",
  "&szlig": "ß",
  "&szlig;": "ß",
  "&target;": "⌖",
  "&tau;": "τ",
  "&tbrk;": "⎴",
  "&tcaron;": "ť",
  "&tcedil;": "ţ",
  "&tcy;": "т",
  "&tdot;": "⃛",
  "&telrec;": "⌕",
  "&tfr;": "\uD835\uDD31",
  "&there4;": "∴",
  "&therefore;": "∴",
  "&theta;": "θ",
  "&thetasym;": "ϑ",
  "&thetav;": "ϑ",
  "&thickapprox;": "≈",
  "&thicksim;": "∼",
  "&thinsp;": " ",
  "&thkap;": "≈",
  "&thksim;": "∼",
  "&thorn": "þ",
  "&thorn;": "þ",
  "&tilde;": "˜",
  "&times": "×",
  "&times;": "×",
  "&timesb;": "⊠",
  "&timesbar;": "⨱",
  "&timesd;": "⨰",
  "&tint;": "∭",
  "&toea;": "⤨",
  "&top;": "⊤",
  "&topbot;": "⌶",
  "&topcir;": "⫱",
  "&topf;": "\uD835\uDD65",
  "&topfork;": "⫚",
  "&tosa;": "⤩",
  "&tprime;": "‴",
  "&trade;": "™",
  "&triangle;": "▵",
  "&triangledown;": "▿",
  "&triangleleft;": "◃",
  "&trianglelefteq;": "⊴",
  "&triangleq;": "≜",
  "&triangleright;": "▹",
  "&trianglerighteq;": "⊵",
  "&tridot;": "◬",
  "&trie;": "≜",
  "&triminus;": "⨺",
  "&triplus;": "⨹",
  "&trisb;": "⧍",
  "&tritime;": "⨻",
  "&trpezium;": "⏢",
  "&tscr;": "\uD835\uDCC9",
  "&tscy;": "ц",
  "&tshcy;": "ћ",
  "&tstrok;": "ŧ",
  "&twixt;": "≬",
  "&twoheadleftarrow;": "↞",
  "&twoheadrightarrow;": "↠",
  "&uArr;": "⇑",
  "&uHar;": "⥣",
  "&uacute": "ú",
  "&uacute;": "ú",
  "&uarr;": "↑",
  "&ubrcy;": "ў",
  "&ubreve;": "ŭ",
  "&ucirc": "û",
  "&ucirc;": "û",
  "&ucy;": "у",
  "&udarr;": "⇅",
  "&udblac;": "ű",
  "&udhar;": "⥮",
  "&ufisht;": "⥾",
  "&ufr;": "\uD835\uDD32",
  "&ugrave": "ù",
  "&ugrave;": "ù",
  "&uharl;": "↿",
  "&uharr;": "↾",
  "&uhblk;": "▀",
  "&ulcorn;": "⌜",
  "&ulcorner;": "⌜",
  "&ulcrop;": "⌏",
  "&ultri;": "◸",
  "&umacr;": "ū",
  "&uml": "¨",
  "&uml;": "¨",
  "&uogon;": "ų",
  "&uopf;": "\uD835\uDD66",
  "&uparrow;": "↑",
  "&updownarrow;": "↕",
  "&upharpoonleft;": "↿",
  "&upharpoonright;": "↾",
  "&uplus;": "⊎",
  "&upsi;": "υ",
  "&upsih;": "ϒ",
  "&upsilon;": "υ",
  "&upuparrows;": "⇈",
  "&urcorn;": "⌝",
  "&urcorner;": "⌝",
  "&urcrop;": "⌎",
  "&uring;": "ů",
  "&urtri;": "◹",
  "&uscr;": "\uD835\uDCCA",
  "&utdot;": "⋰",
  "&utilde;": "ũ",
  "&utri;": "▵",
  "&utrif;": "▴",
  "&uuarr;": "⇈",
  "&uuml": "ü",
  "&uuml;": "ü",
  "&uwangle;": "⦧",
  "&vArr;": "⇕",
  "&vBar;": "⫨",
  "&vBarv;": "⫩",
  "&vDash;": "⊨",
  "&vangrt;": "⦜",
  "&varepsilon;": "ϵ",
  "&varkappa;": "ϰ",
  "&varnothing;": "∅",
  "&varphi;": "ϕ",
  "&varpi;": "ϖ",
  "&varpropto;": "∝",
  "&varr;": "↕",
  "&varrho;": "ϱ",
  "&varsigma;": "ς",
  "&varsubsetneq;": "⊊︀",
  "&varsubsetneqq;": "⫋︀",
  "&varsupsetneq;": "⊋︀",
  "&varsupsetneqq;": "⫌︀",
  "&vartheta;": "ϑ",
  "&vartriangleleft;": "⊲",
  "&vartriangleright;": "⊳",
  "&vcy;": "в",
  "&vdash;": "⊢",
  "&vee;": "∨",
  "&veebar;": "⊻",
  "&veeeq;": "≚",
  "&vellip;": "⋮",
  "&verbar;": "|",
  "&vert;": "|",
  "&vfr;": "\uD835\uDD33",
  "&vltri;": "⊲",
  "&vnsub;": "⊂⃒",
  "&vnsup;": "⊃⃒",
  "&vopf;": "\uD835\uDD67",
  "&vprop;": "∝",
  "&vrtri;": "⊳",
  "&vscr;": "\uD835\uDCCB",
  "&vsubnE;": "⫋︀",
  "&vsubne;": "⊊︀",
  "&vsupnE;": "⫌︀",
  "&vsupne;": "⊋︀",
  "&vzigzag;": "⦚",
  "&wcirc;": "ŵ",
  "&wedbar;": "⩟",
  "&wedge;": "∧",
  "&wedgeq;": "≙",
  "&weierp;": "℘",
  "&wfr;": "\uD835\uDD34",
  "&wopf;": "\uD835\uDD68",
  "&wp;": "℘",
  "&wr;": "≀",
  "&wreath;": "≀",
  "&wscr;": "\uD835\uDCCC",
  "&xcap;": "⋂",
  "&xcirc;": "◯",
  "&xcup;": "⋃",
  "&xdtri;": "▽",
  "&xfr;": "\uD835\uDD35",
  "&xhArr;": "⟺",
  "&xharr;": "⟷",
  "&xi;": "ξ",
  "&xlArr;": "⟸",
  "&xlarr;": "⟵",
  "&xmap;": "⟼",
  "&xnis;": "⋻",
  "&xodot;": "⨀",
  "&xopf;": "\uD835\uDD69",
  "&xoplus;": "⨁",
  "&xotime;": "⨂",
  "&xrArr;": "⟹",
  "&xrarr;": "⟶",
  "&xscr;": "\uD835\uDCCD",
  "&xsqcup;": "⨆",
  "&xuplus;": "⨄",
  "&xutri;": "△",
  "&xvee;": "⋁",
  "&xwedge;": "⋀",
  "&yacute": "ý",
  "&yacute;": "ý",
  "&yacy;": "я",
  "&ycirc;": "ŷ",
  "&ycy;": "ы",
  "&yen": "¥",
  "&yen;": "¥",
  "&yfr;": "\uD835\uDD36",
  "&yicy;": "ї",
  "&yopf;": "\uD835\uDD6A",
  "&yscr;": "\uD835\uDCCE",
  "&yucy;": "ю",
  "&yuml": "ÿ",
  "&yuml;": "ÿ",
  "&zacute;": "ź",
  "&zcaron;": "ž",
  "&zcy;": "з",
  "&zdot;": "ż",
  "&zeetrf;": "ℨ",
  "&zeta;": "ζ",
  "&zfr;": "\uD835\uDD37",
  "&zhcy;": "ж",
  "&zigrarr;": "⇝",
  "&zopf;": "\uD835\uDD6B",
  "&zscr;": "\uD835\uDCCF",
  "&zwj;": "‍",
  "&zwnj;": "‌"
};
var html_entities_default = htmlEntities;

// /zveltio-extension/node_modules/postal-mime/src/text-format.js
function decodeHTMLEntities(str) {
  return str.replace(/&(#\d+|#x[a-f0-9]+|[a-z]+\d*);?/gi, (match, entity) => {
    if (typeof html_entities_default[match] === "string") {
      return html_entities_default[match];
    }
    if (entity.charAt(0) !== "#" || match.charAt(match.length - 1) !== ";") {
      return match;
    }
    let codePoint;
    if (entity.charAt(1) === "x") {
      codePoint = parseInt(entity.substr(2), 16);
    } else {
      codePoint = parseInt(entity.substr(1), 10);
    }
    let output = "";
    if (codePoint >= 55296 && codePoint <= 57343 || codePoint > 1114111) {
      return "�";
    }
    if (codePoint > 65535) {
      codePoint -= 65536;
      output += String.fromCharCode(codePoint >>> 10 & 1023 | 55296);
      codePoint = 56320 | codePoint & 1023;
    }
    output += String.fromCharCode(codePoint);
    return output;
  });
}
function escapeHtml(str) {
  return str.trim().replace(/[<>"'?&]/g, (c) => {
    let hex = c.charCodeAt(0).toString(16);
    if (hex.length < 2) {
      hex = "0" + hex;
    }
    return "&#x" + hex.toUpperCase() + ";";
  });
}
function textToHtml(str) {
  let html = escapeHtml(str).replace(/\n/g, "<br />");
  return "<div>" + html + "</div>";
}
function htmlToText(str) {
  str = str.replace(/\r?\n/g, "\x01").replace(/<\!\-\-.*?\-\->/gi, " ").replace(/<br\b[^>]*>/gi, `
`).replace(/<\/?(p|div|table|tr|td|th)\b[^>]*>/gi, `

`).replace(/<script\b[^>]*>.*?<\/script\b[^>]*>/gi, " ").replace(/^.*<body\b[^>]*>/i, "").replace(/^.*<\/head\b[^>]*>/i, "").replace(/^.*<\!doctype\b[^>]*>/i, "").replace(/<\/body\b[^>]*>.*$/i, "").replace(/<\/html\b[^>]*>.*$/i, "").replace(/<a\b[^>]*href\s*=\s*["']?([^\s"']+)[^>]*>/gi, " ($1) ").replace(/<\/?(span|em|i|strong|b|u|a)\b[^>]*>/gi, "").replace(/<li\b[^>]*>[\n\u0001\s]*/gi, "* ").replace(/<hr\b[^>]*>/g, `
-------------
`).replace(/<[^>]*>/g, " ").replace(/\u0001/g, `
`).replace(/[ \t]+/g, " ").replace(/^\s+$/gm, "").replace(/\n\n+/g, `

`).replace(/^\n+/, `
`).replace(/\n+$/, `
`);
  str = decodeHTMLEntities(str);
  return str;
}
function formatTextAddress(address) {
  return [].concat(address.name || []).concat(address.name ? `<${address.address}>` : address.address).join(" ");
}
function formatTextAddresses(addresses) {
  let parts = [];
  let processAddress = (address, partCounter) => {
    if (partCounter) {
      parts.push(", ");
    }
    if (address.group) {
      let groupStart = `${address.name}:`;
      let groupEnd = `;`;
      parts.push(groupStart);
      address.group.forEach(processAddress);
      parts.push(groupEnd);
    } else {
      parts.push(formatTextAddress(address));
    }
  };
  addresses.forEach(processAddress);
  return parts.join("");
}
function formatHtmlAddress(address) {
  return `<a href="mailto:${escapeHtml(address.address)}" class="postal-email-address">${escapeHtml(address.name || `<${address.address}>`)}</a>`;
}
function formatHtmlAddresses(addresses) {
  let parts = [];
  let processAddress = (address, partCounter) => {
    if (partCounter) {
      parts.push('<span class="postal-email-address-separator">, </span>');
    }
    if (address.group) {
      let groupStart = `<span class="postal-email-address-group">${escapeHtml(address.name)}:</span>`;
      let groupEnd = `<span class="postal-email-address-group">;</span>`;
      parts.push(groupStart);
      address.group.forEach(processAddress);
      parts.push(groupEnd);
    } else {
      parts.push(formatHtmlAddress(address));
    }
  };
  addresses.forEach(processAddress);
  return parts.join(" ");
}
function foldLines(str, lineLength, afterSpace) {
  str = (str || "").toString();
  lineLength = lineLength || 76;
  let pos = 0, len = str.length, result = "", line, match;
  while (pos < len) {
    line = str.substr(pos, lineLength);
    if (line.length < lineLength) {
      result += line;
      break;
    }
    if (match = line.match(/^[^\n\r]*(\r?\n|\r)/)) {
      line = match[0];
      result += line;
      pos += line.length;
      continue;
    } else if ((match = line.match(/(\s+)[^\s]*$/)) && match[0].length - (afterSpace ? (match[1] || "").length : 0) < line.length) {
      line = line.substr(0, line.length - (match[0].length - (afterSpace ? (match[1] || "").length : 0)));
    } else if (match = str.substr(pos + line.length).match(/^[^\s]+(\s*)/)) {
      line = line + match[0].substr(0, match[0].length - (!afterSpace ? (match[1] || "").length : 0));
    }
    result += line;
    pos += line.length;
    if (pos < len) {
      result += `\r
`;
    }
  }
  return result;
}
function formatTextHeader(message) {
  let rows = [];
  if (message.from) {
    rows.push({ key: "From", val: formatTextAddress(message.from) });
  }
  if (message.subject) {
    rows.push({ key: "Subject", val: message.subject });
  }
  if (message.date) {
    let dateOptions = {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: false
    };
    let dateStr = typeof Intl === "undefined" ? message.date : new Intl.DateTimeFormat("default", dateOptions).format(new Date(message.date));
    rows.push({ key: "Date", val: dateStr });
  }
  if (message.to && message.to.length) {
    rows.push({ key: "To", val: formatTextAddresses(message.to) });
  }
  if (message.cc && message.cc.length) {
    rows.push({ key: "Cc", val: formatTextAddresses(message.cc) });
  }
  if (message.bcc && message.bcc.length) {
    rows.push({ key: "Bcc", val: formatTextAddresses(message.bcc) });
  }
  let maxKeyLength = rows.map((r) => r.key.length).reduce((acc, cur) => {
    return cur > acc ? cur : acc;
  }, 0);
  rows = rows.flatMap((row) => {
    let sepLen = maxKeyLength - row.key.length;
    let prefix = `${row.key}: ${" ".repeat(sepLen)}`;
    let emptyPrefix = `${" ".repeat(row.key.length + 1)} ${" ".repeat(sepLen)}`;
    let foldedLines = foldLines(row.val, 80, true).split(/\r?\n/).map((line) => line.trim());
    return foldedLines.map((line, i) => `${i ? emptyPrefix : prefix}${line}`);
  });
  let maxLineLength = rows.map((r) => r.length).reduce((acc, cur) => {
    return cur > acc ? cur : acc;
  }, 0);
  let lineMarker = "-".repeat(maxLineLength);
  let template = `
${lineMarker}
${rows.join(`
`)}
${lineMarker}
`;
  return template;
}
function formatHtmlHeader(message) {
  let rows = [];
  if (message.from) {
    rows.push(`<div class="postal-email-header-key">From</div><div class="postal-email-header-value">${formatHtmlAddress(message.from)}</div>`);
  }
  if (message.subject) {
    rows.push(`<div class="postal-email-header-key">Subject</div><div class="postal-email-header-value postal-email-header-subject">${escapeHtml(message.subject)}</div>`);
  }
  if (message.date) {
    let dateOptions = {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: false
    };
    let dateStr = typeof Intl === "undefined" ? message.date : new Intl.DateTimeFormat("default", dateOptions).format(new Date(message.date));
    rows.push(`<div class="postal-email-header-key">Date</div><div class="postal-email-header-value postal-email-header-date" data-date="${escapeHtml(message.date)}">${escapeHtml(dateStr)}</div>`);
  }
  if (message.to && message.to.length) {
    rows.push(`<div class="postal-email-header-key">To</div><div class="postal-email-header-value">${formatHtmlAddresses(message.to)}</div>`);
  }
  if (message.cc && message.cc.length) {
    rows.push(`<div class="postal-email-header-key">Cc</div><div class="postal-email-header-value">${formatHtmlAddresses(message.cc)}</div>`);
  }
  if (message.bcc && message.bcc.length) {
    rows.push(`<div class="postal-email-header-key">Bcc</div><div class="postal-email-header-value">${formatHtmlAddresses(message.bcc)}</div>`);
  }
  let template = `<div class="postal-email-header">${rows.length ? '<div class="postal-email-header-row">' : ""}${rows.join(`</div>
<div class="postal-email-header-row">`)}${rows.length ? "</div>" : ""}</div>`;
  return template;
}

// /zveltio-extension/node_modules/postal-mime/src/address-parser.js
function _handleAddress(tokens, depth) {
  let isGroup = false;
  let state = "text";
  let address;
  let addresses = [];
  let data = {
    address: [],
    comment: [],
    group: [],
    text: [],
    textWasQuoted: []
  };
  let i;
  let len;
  let insideQuotes = false;
  for (i = 0, len = tokens.length;i < len; i++) {
    let token = tokens[i];
    let prevToken = i ? tokens[i - 1] : null;
    if (token.type === "operator") {
      switch (token.value) {
        case "<":
          state = "address";
          insideQuotes = false;
          break;
        case "(":
          state = "comment";
          insideQuotes = false;
          break;
        case ":":
          state = "group";
          isGroup = true;
          insideQuotes = false;
          break;
        case '"':
          insideQuotes = !insideQuotes;
          state = "text";
          break;
        default:
          state = "text";
          insideQuotes = false;
          break;
      }
    } else if (token.value) {
      if (state === "address") {
        token.value = token.value.replace(/^[^<]*<\s*/, "");
      }
      if (prevToken && prevToken.noBreak && data[state].length) {
        data[state][data[state].length - 1] += token.value;
        if (state === "text" && insideQuotes) {
          data.textWasQuoted[data.textWasQuoted.length - 1] = true;
        }
      } else {
        data[state].push(token.value);
        if (state === "text") {
          data.textWasQuoted.push(insideQuotes);
        }
      }
    }
  }
  if (!data.text.length && data.comment.length) {
    data.text = data.comment;
    data.comment = [];
  }
  if (isGroup) {
    data.text = data.text.join(" ");
    let groupMembers = [];
    if (data.group.length) {
      let parsedGroup = addressParser(data.group.join(","), { _depth: depth + 1 });
      parsedGroup.forEach((member) => {
        if (member.group) {
          groupMembers = groupMembers.concat(member.group);
        } else {
          groupMembers.push(member);
        }
      });
    }
    addresses.push({
      name: decodeWords(data.text || address && address.name),
      group: groupMembers
    });
  } else {
    if (!data.address.length && data.text.length) {
      for (i = data.text.length - 1;i >= 0; i--) {
        if (!data.textWasQuoted[i] && data.text[i].match(/^[^@\s]+@[^@\s]+$/)) {
          data.address = data.text.splice(i, 1);
          data.textWasQuoted.splice(i, 1);
          break;
        }
      }
      let _regexHandler = function(address) {
        if (!data.address.length) {
          data.address = [address.trim()];
          return " ";
        } else {
          return address;
        }
      };
      if (!data.address.length) {
        for (i = data.text.length - 1;i >= 0; i--) {
          if (!data.textWasQuoted[i]) {
            data.text[i] = data.text[i].replace(/\s*\b[^@\s]+@[^\s]+\b\s*/, _regexHandler).trim();
            if (data.address.length) {
              break;
            }
          }
        }
      }
    }
    if (!data.text.length && data.comment.length) {
      data.text = data.comment;
      data.comment = [];
    }
    if (data.address.length > 1) {
      data.text = data.text.concat(data.address.splice(1));
    }
    data.text = data.text.join(" ");
    data.address = data.address.join(" ");
    if (!data.address && /^=\?[^=]+?=$/.test(data.text.trim())) {
      const decodedText = decodeWords(data.text);
      if (/<[^<>]+@[^<>]+>/.test(decodedText)) {
        const parsedSubAddresses = addressParser(decodedText);
        if (parsedSubAddresses && parsedSubAddresses.length) {
          return parsedSubAddresses;
        }
      }
      return [{ address: "", name: decodedText }];
    }
    address = {
      address: data.address || data.text || "",
      name: decodeWords(data.text || data.address || "")
    };
    if (address.address === address.name) {
      if ((address.address || "").match(/@/)) {
        address.name = "";
      } else {
        address.address = "";
      }
    }
    addresses.push(address);
  }
  return addresses;
}

class Tokenizer {
  constructor(str) {
    this.str = (str || "").toString();
    this.operatorCurrent = "";
    this.operatorExpecting = "";
    this.node = null;
    this.escaped = false;
    this.list = [];
    this.operators = {
      '"': '"',
      "(": ")",
      "<": ">",
      ",": "",
      ":": ";",
      ";": ""
    };
  }
  tokenize() {
    let list = [];
    for (let i = 0, len = this.str.length;i < len; i++) {
      let chr = this.str.charAt(i);
      let nextChr = i < len - 1 ? this.str.charAt(i + 1) : null;
      this.checkChar(chr, nextChr);
    }
    this.list.forEach((node) => {
      node.value = (node.value || "").toString().trim();
      if (node.value) {
        list.push(node);
      }
    });
    return list;
  }
  checkChar(chr, nextChr) {
    if (this.escaped) {} else if (chr === this.operatorExpecting) {
      this.node = {
        type: "operator",
        value: chr
      };
      if (nextChr && ![" ", "\t", "\r", `
`, ",", ";"].includes(nextChr)) {
        this.node.noBreak = true;
      }
      this.list.push(this.node);
      this.node = null;
      this.operatorExpecting = "";
      this.escaped = false;
      return;
    } else if (!this.operatorExpecting && chr in this.operators) {
      this.node = {
        type: "operator",
        value: chr
      };
      this.list.push(this.node);
      this.node = null;
      this.operatorExpecting = this.operators[chr];
      this.escaped = false;
      return;
    } else if (this.operatorExpecting === '"' && chr === "\\") {
      this.escaped = true;
      return;
    }
    if (!this.node) {
      this.node = {
        type: "text",
        value: ""
      };
      this.list.push(this.node);
    }
    if (chr === `
`) {
      chr = " ";
    }
    if (chr.charCodeAt(0) >= 33 || [" ", "\t"].includes(chr)) {
      this.node.value += chr;
    }
    this.escaped = false;
  }
}
var MAX_NESTED_GROUP_DEPTH = 50;
function addressParser(str, options) {
  options = options || {};
  let depth = options._depth || 0;
  if (depth > MAX_NESTED_GROUP_DEPTH) {
    return [];
  }
  let tokenizer = new Tokenizer(str);
  let tokens = tokenizer.tokenize();
  let addresses = [];
  let address = [];
  let parsedAddresses = [];
  tokens.forEach((token) => {
    if (token.type === "operator" && (token.value === "," || token.value === ";")) {
      if (address.length) {
        addresses.push(address);
      }
      address = [];
    } else {
      address.push(token);
    }
  });
  if (address.length) {
    addresses.push(address);
  }
  addresses.forEach((address) => {
    address = _handleAddress(address, depth);
    if (address.length) {
      parsedAddresses = parsedAddresses.concat(address);
    }
  });
  if (options.flatten) {
    let addresses = [];
    let walkAddressList = (list) => {
      list.forEach((address) => {
        if (address.group) {
          return walkAddressList(address.group);
        } else {
          addresses.push(address);
        }
      });
    };
    walkAddressList(parsedAddresses);
    return addresses;
  }
  return parsedAddresses;
}
var address_parser_default = addressParser;

// /zveltio-extension/node_modules/postal-mime/src/base64-encoder.js
function base64ArrayBuffer(arrayBuffer) {
  var base64 = "";
  var encodings = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  var bytes = new Uint8Array(arrayBuffer);
  var byteLength = bytes.byteLength;
  var byteRemainder = byteLength % 3;
  var mainLength = byteLength - byteRemainder;
  var a, b, c, d;
  var chunk;
  for (var i = 0;i < mainLength; i = i + 3) {
    chunk = bytes[i] << 16 | bytes[i + 1] << 8 | bytes[i + 2];
    a = (chunk & 16515072) >> 18;
    b = (chunk & 258048) >> 12;
    c = (chunk & 4032) >> 6;
    d = chunk & 63;
    base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d];
  }
  if (byteRemainder == 1) {
    chunk = bytes[mainLength];
    a = (chunk & 252) >> 2;
    b = (chunk & 3) << 4;
    base64 += encodings[a] + encodings[b] + "==";
  } else if (byteRemainder == 2) {
    chunk = bytes[mainLength] << 8 | bytes[mainLength + 1];
    a = (chunk & 64512) >> 10;
    b = (chunk & 1008) >> 4;
    c = (chunk & 15) << 2;
    base64 += encodings[a] + encodings[b] + encodings[c] + "=";
  }
  return base64;
}

// /zveltio-extension/node_modules/postal-mime/src/postal-mime.js
var MAX_NESTING_DEPTH = 256;
var MAX_HEADERS_SIZE = 2 * 1024 * 1024;
var MAX_RFC822_NESTING_DEPTH = 10;
function toCamelCase(key) {
  return key.replace(/-(.)/g, (o, c) => c.toUpperCase());
}
function parseLimitOption(value, defaultValue, name) {
  if (value === undefined || value === null) {
    return defaultValue;
  }
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new TypeError(`${name} must be a non-negative integer`);
  }
  return value;
}

class PostalMime {
  static async parse(buf, options) {
    const parser = new PostalMime(options);
    return parser.parse(buf);
  }
  constructor(options, rfc822NestingDepth = 0) {
    this.options = options || {};
    this.mimeOptions = {
      maxNestingDepth: parseLimitOption(this.options.maxNestingDepth, MAX_NESTING_DEPTH, "maxNestingDepth"),
      maxHeadersSize: parseLimitOption(this.options.maxHeadersSize, MAX_HEADERS_SIZE, "maxHeadersSize")
    };
    this.maxRfc822NestingDepth = parseLimitOption(this.options.maxRfc822NestingDepth, MAX_RFC822_NESTING_DEPTH, "maxRfc822NestingDepth");
    this.rfc822NestingDepth = rfc822NestingDepth;
    this.root = this.currentNode = new MimeNode({
      postalMime: this,
      ...this.mimeOptions
    });
    this.boundaries = [];
    this.textContent = {};
    this.attachments = [];
    this.attachmentEncoding = (this.options.attachmentEncoding || "").toString().replace(/[-_\s]/g, "").trim().toLowerCase() || "arraybuffer";
    this.started = false;
  }
  async finalize() {
    await this.root.finalize();
  }
  async processLine(line, isFinal) {
    let boundaries = this.boundaries;
    if (boundaries.length && line.length > 2 && line[0] === 45 && line[1] === 45) {
      for (let i = boundaries.length - 1;i >= 0; i--) {
        let boundary = boundaries[i];
        if (line.length < boundary.value.length + 2) {
          continue;
        }
        let boundaryMatches = true;
        for (let j = 0;j < boundary.value.length; j++) {
          if (line[j + 2] !== boundary.value[j]) {
            boundaryMatches = false;
            break;
          }
        }
        if (!boundaryMatches) {
          continue;
        }
        let boundaryEnd = boundary.value.length + 2;
        let isTerminator = false;
        if (line.length >= boundary.value.length + 4 && line[boundary.value.length + 2] === 45 && line[boundary.value.length + 3] === 45) {
          isTerminator = true;
          boundaryEnd = boundary.value.length + 4;
        }
        let hasValidTrailing = true;
        for (let j = boundaryEnd;j < line.length; j++) {
          if (line[j] !== 32 && line[j] !== 9) {
            hasValidTrailing = false;
            break;
          }
        }
        if (!hasValidTrailing) {
          continue;
        }
        if (isTerminator) {
          await boundary.node.finalize();
          this.currentNode = boundary.node.parentNode || this.root;
        } else {
          await boundary.node.finalizeChildNodes();
          this.currentNode = new MimeNode({
            postalMime: this,
            parentNode: boundary.node,
            parentMultipartType: boundary.node.contentType.multipart,
            ...this.mimeOptions
          });
        }
        if (isFinal) {
          return this.finalize();
        }
        return;
      }
    }
    this.currentNode.feed(line);
    if (isFinal) {
      return this.finalize();
    }
  }
  readLine() {
    let startPos = this.readPos;
    let endPos = this.readPos;
    while (this.readPos < this.av.length) {
      const c = this.av[this.readPos++];
      if (c !== 13 && c !== 10) {
        endPos = this.readPos;
      }
      if (c === 10) {
        return {
          bytes: new Uint8Array(this.buf, startPos, endPos - startPos),
          done: this.readPos >= this.av.length
        };
      }
    }
    return {
      bytes: new Uint8Array(this.buf, startPos, endPos - startPos),
      done: this.readPos >= this.av.length
    };
  }
  async processNodeTree() {
    let textContent = {};
    let textTypes = new Set;
    let textMap = this.textMap = new Map;
    let forceRfc822Attachments = this.forceRfc822Attachments();
    let walk = async (node, alternative, related) => {
      alternative = alternative || false;
      related = related || false;
      if (!node.contentType.multipart) {
        const inlineRfc822 = this.isInlineMessageRfc822(node) && !forceRfc822Attachments;
        const rfc822DepthExceeded = inlineRfc822 && this.rfc822NestingDepth >= this.maxRfc822NestingDepth;
        if (inlineRfc822 && !rfc822DepthExceeded) {
          const subParser = new PostalMime({
            ...this.mimeOptions,
            maxRfc822NestingDepth: this.maxRfc822NestingDepth,
            attachmentEncoding: "arraybuffer"
          }, this.rfc822NestingDepth + 1);
          node.subMessage = await subParser.parse(node.content);
          if (!textMap.has(node)) {
            textMap.set(node, {});
          }
          let textEntry = textMap.get(node);
          if (node.subMessage.text || !node.subMessage.html) {
            textEntry.plain = textEntry.plain || [];
            textEntry.plain.push({ type: "subMessage", value: node.subMessage });
            textTypes.add("plain");
          }
          if (node.subMessage.html) {
            textEntry.html = textEntry.html || [];
            textEntry.html.push({ type: "subMessage", value: node.subMessage });
            textTypes.add("html");
          }
          if (subParser.textMap) {
            subParser.textMap.forEach((subTextEntry, subTextNode) => {
              textMap.set(subTextNode, subTextEntry);
            });
          }
          for (let attachment of node.subMessage.attachments || []) {
            this.attachments.push(attachment);
          }
        } else if (this.isInlineTextNode(node)) {
          let textType = node.contentType.parsed.value.substr(node.contentType.parsed.value.indexOf("/") + 1);
          let selectorNode = alternative || node;
          if (!textMap.has(selectorNode)) {
            textMap.set(selectorNode, {});
          }
          let textEntry = textMap.get(selectorNode);
          textEntry[textType] = textEntry[textType] || [];
          textEntry[textType].push({ type: "text", value: node.getTextContent() });
          textTypes.add(textType);
        } else if (node.content) {
          const filename = node.contentDisposition?.parsed?.params?.filename || node.contentType.parsed.params.name || null;
          const attachment = {
            filename: filename ? decodeWords(filename) : null,
            mimeType: node.contentType.parsed.value,
            disposition: node.contentDisposition?.parsed?.value || null
          };
          if (related && node.contentId && !rfc822DepthExceeded) {
            attachment.related = true;
          }
          if (rfc822DepthExceeded) {
            attachment.rfc822DepthExceeded = true;
          }
          if (node.contentDescription) {
            attachment.description = node.contentDescription;
          }
          if (node.contentId) {
            attachment.contentId = node.contentId;
          }
          switch (node.contentType.parsed.value) {
            case "text/calendar":
            case "application/ics": {
              if (node.contentType.parsed.params.method) {
                attachment.method = node.contentType.parsed.params.method.toString().toUpperCase().trim();
              }
              const decodedText = node.getTextContent().replace(/\r?\n/g, `
`).replace(/\n*$/, `
`);
              attachment.content = textEncoder.encode(decodedText);
              break;
            }
            default:
              attachment.content = node.content;
          }
          this.attachments.push(attachment);
        }
      } else if (node.contentType.multipart === "alternative") {
        alternative = node;
      } else if (node.contentType.multipart === "related") {
        related = node;
      }
      for (let childNode of node.childNodes) {
        await walk(childNode, alternative, related);
      }
    };
    await walk(this.root, false, false);
    textMap.forEach((mapEntry) => {
      textTypes.forEach((textType) => {
        if (!textContent[textType]) {
          textContent[textType] = [];
        }
        if (mapEntry[textType]) {
          mapEntry[textType].forEach((textEntry) => {
            switch (textEntry.type) {
              case "text":
                textContent[textType].push(textEntry.value);
                break;
              case "subMessage":
                {
                  switch (textType) {
                    case "html":
                      textContent[textType].push(formatHtmlHeader(textEntry.value));
                      break;
                    case "plain":
                      textContent[textType].push(formatTextHeader(textEntry.value));
                      break;
                  }
                }
                break;
            }
          });
        } else {
          let alternativeType;
          switch (textType) {
            case "html":
              alternativeType = "plain";
              break;
            case "plain":
              alternativeType = "html";
              break;
          }
          (mapEntry[alternativeType] || []).forEach((textEntry) => {
            switch (textEntry.type) {
              case "text":
                switch (textType) {
                  case "html":
                    textContent[textType].push(textToHtml(textEntry.value));
                    break;
                  case "plain":
                    textContent[textType].push(htmlToText(textEntry.value));
                    break;
                }
                break;
              case "subMessage":
                {
                  switch (textType) {
                    case "html":
                      textContent[textType].push(formatHtmlHeader(textEntry.value));
                      break;
                    case "plain":
                      textContent[textType].push(formatTextHeader(textEntry.value));
                      break;
                  }
                }
                break;
            }
          });
        }
      });
    });
    Object.keys(textContent).forEach((textType) => {
      textContent[textType] = textContent[textType].join(`
`);
    });
    this.textContent = textContent;
  }
  isInlineTextNode(node) {
    if (node.contentDisposition?.parsed?.value === "attachment") {
      return false;
    }
    switch (node.contentType.parsed?.value) {
      case "text/html":
      case "text/plain":
        return true;
      case "text/calendar":
      case "text/csv":
      default:
        return false;
    }
  }
  isInlineMessageRfc822(node) {
    if (node.contentType.parsed?.value !== "message/rfc822") {
      return false;
    }
    let disposition = node.contentDisposition?.parsed?.value || (this.options.rfc822Attachments ? "attachment" : "inline");
    return disposition === "inline";
  }
  forceRfc822Attachments() {
    if (this.options.forceRfc822Attachments) {
      return true;
    }
    let forceRfc822Attachments = false;
    let walk = (node) => {
      if (!node.contentType.multipart) {
        if (node.contentType.parsed && ["message/delivery-status", "message/feedback-report"].includes(node.contentType.parsed.value)) {
          forceRfc822Attachments = true;
        }
      }
      for (let childNode of node.childNodes) {
        walk(childNode);
      }
    };
    walk(this.root);
    return forceRfc822Attachments;
  }
  async resolveStream(stream) {
    let chunkLen = 0;
    let chunks = [];
    const reader = stream.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      chunks.push(value);
      chunkLen += value.length;
    }
    const result = new Uint8Array(chunkLen);
    let chunkPointer = 0;
    for (let chunk of chunks) {
      result.set(chunk, chunkPointer);
      chunkPointer += chunk.length;
    }
    return result;
  }
  async parse(buf) {
    if (this.started) {
      throw new Error("Can not reuse parser, create a new PostalMime object");
    }
    this.started = true;
    if (buf && typeof buf.getReader === "function") {
      buf = await this.resolveStream(buf);
    }
    buf = buf || new ArrayBuffer(0);
    if (typeof buf === "string") {
      buf = textEncoder.encode(buf);
    }
    if (buf instanceof Blob || Object.prototype.toString.call(buf) === "[object Blob]") {
      buf = await blobToArrayBuffer(buf);
    }
    if (buf.buffer instanceof ArrayBuffer) {
      buf = new Uint8Array(buf).buffer;
    }
    this.buf = buf;
    this.av = new Uint8Array(buf);
    this.readPos = 0;
    while (this.readPos < this.av.length) {
      const line = this.readLine();
      await this.processLine(line.bytes, line.done);
    }
    await this.processNodeTree();
    const message = {
      headers: this.root.headers.map((entry) => ({ key: entry.key, originalKey: entry.originalKey, value: entry.value })).reverse()
    };
    for (const key of ["from", "sender"]) {
      const addressHeader = this.root.headers.find((line) => line.key === key);
      if (addressHeader && addressHeader.value) {
        const addresses = address_parser_default(addressHeader.value);
        if (addresses && addresses.length) {
          message[key] = addresses[0];
        }
      }
    }
    for (const key of ["delivered-to", "return-path"]) {
      const addressHeader = this.root.headers.find((line) => line.key === key);
      if (addressHeader && addressHeader.value) {
        const addresses = address_parser_default(addressHeader.value);
        if (addresses && addresses.length && addresses[0].address) {
          const camelKey = toCamelCase(key);
          message[camelKey] = addresses[0].address;
        }
      }
    }
    for (const key of ["to", "cc", "bcc", "reply-to"]) {
      const addressHeaders = this.root.headers.filter((line) => line.key === key);
      let addresses = [];
      addressHeaders.filter((entry) => entry && entry.value).map((entry) => address_parser_default(entry.value)).forEach((parsed) => addresses = addresses.concat(parsed || []));
      if (addresses && addresses.length) {
        const camelKey = toCamelCase(key);
        message[camelKey] = addresses;
      }
    }
    for (const key of ["subject", "message-id", "in-reply-to", "references"]) {
      const header = this.root.headers.find((line) => line.key === key);
      if (header && header.value) {
        const camelKey = toCamelCase(key);
        message[camelKey] = decodeWords(header.value);
      }
    }
    let dateHeader = this.root.headers.find((line) => line.key === "date");
    if (dateHeader) {
      let date = new Date(dateHeader.value);
      if (date.toString() === "Invalid Date") {
        date = dateHeader.value;
      } else {
        date = date.toISOString();
      }
      message.date = date;
    }
    if (this.textContent?.html) {
      message.html = this.textContent.html;
    }
    if (this.textContent?.plain) {
      message.text = this.textContent.plain;
    }
    message.attachments = this.attachments;
    message.headerLines = (this.root.rawHeaderLines || []).slice().reverse();
    switch (this.attachmentEncoding) {
      case "arraybuffer":
        break;
      case "base64":
        for (let attachment of message.attachments || []) {
          if (attachment?.content) {
            attachment.content = base64ArrayBuffer(attachment.content);
            attachment.encoding = "base64";
          }
        }
        break;
      case "utf8":
        let attachmentDecoder = new TextDecoder("utf8");
        for (let attachment of message.attachments || []) {
          if (attachment?.content) {
            attachment.content = attachmentDecoder.decode(attachment.content);
            attachment.encoding = "utf8";
          }
        }
        break;
      default:
        throw new Error("Unknown attachment encoding");
    }
    return message;
  }
}

// engine/lib/mime.ts
var import_sanitize_html = __toESM(require_sanitize_html());
var enc3 = new TextEncoder;
function cleanHtml(html) {
  return import_sanitize_html.default(html, {
    allowedTags: import_sanitize_html.default.defaults.allowedTags.concat(["img", "center", "font", "span", "del", "ins", "u", "s"]),
    allowedAttributes: {
      "*": ["style", "align", "valign", "width", "height", "bgcolor", "color", "dir", "lang", "title"],
      a: ["href", "name", "target", "rel"],
      img: ["src", "alt", "width", "height"],
      font: ["face", "size", "color"],
      td: ["colspan", "rowspan", "style", "align", "valign", "width", "bgcolor"],
      th: ["colspan", "rowspan", "style", "align", "valign", "width", "bgcolor"],
      table: ["border", "cellpadding", "cellspacing", "width", "bgcolor", "style", "align"]
    },
    allowedSchemes: ["http", "https", "mailto", "cid", "data"],
    allowedSchemesByTag: { a: ["http", "https", "mailto"], img: ["http", "https", "cid", "data"] },
    allowProtocolRelative: false,
    transformTags: { a: import_sanitize_html.default.simpleTransform("a", { target: "_blank", rel: "noopener noreferrer" }) }
  });
}
var addrs = (v) => {
  const out = [];
  for (const a of Array.isArray(v) ? v : v ? [v] : []) {
    if (a.group)
      out.push(...addrs(a.group));
    else if (a.address)
      out.push(a.name ? { address: a.address, name: a.name } : { address: a.address });
  }
  return out;
};
async function parseMessage(raw) {
  const m = await PostalMime.parse(raw, { attachmentEncoding: "arraybuffer" });
  const header = (k) => m.headers.find((h) => h.key === k)?.value ?? null;
  const prio = (header("x-priority") ?? header("importance") ?? "").toLowerCase();
  const text = m.text ?? null;
  const html = m.html ? cleanHtml(m.html) : null;
  const plain = text ?? (html ? html.replace(/<[^>]*>/g, " ") : "");
  return {
    messageId: m.messageId ?? null,
    inReplyTo: m.inReplyTo ?? null,
    references: m.references ?? null,
    from: addrs(m.from)[0] ?? { address: "" },
    to: addrs(m.to),
    cc: addrs(m.cc),
    replyTo: addrs(m.replyTo)[0]?.address ?? null,
    subject: m.subject ?? null,
    text,
    html,
    snippet: plain.replace(/\s+/g, " ").trim().slice(0, 200),
    date: m.date && !Number.isNaN(Date.parse(m.date)) ? new Date(m.date).toISOString() : null,
    priority: /^[12]\b|high/.test(prio) ? "high" : /^[45]\b|low/.test(prio) ? "low" : "normal",
    readReceipt: header("disposition-notification-to") !== null,
    attachments: m.attachments.map((a) => {
      const content = new Uint8Array(a.content);
      return {
        filename: a.filename || "attachment",
        mimeType: a.mimeType || "application/octet-stream",
        size: content.length,
        contentId: a.contentId ? a.contentId.replace(/^<|>$/g, "") : null,
        inline: a.disposition === "inline",
        content
      };
    })
  };
}
function decodeTransfer(bytes, encoding) {
  if (encoding === "base64") {
    let s = "";
    for (let i = 0;i < bytes.length; i += 32768)
      s += String.fromCharCode(...bytes.subarray(i, i + 32768));
    s = s.replace(/[^A-Za-z0-9+/]/g, "");
    const bin = atob(s.slice(0, s.length - (s.length % 4 === 1 ? 1 : 0)));
    const out = new Uint8Array(bin.length);
    for (let i = 0;i < bin.length; i++)
      out[i] = bin.charCodeAt(i);
    return out;
  }
  if (encoding === "quoted-printable") {
    const out = new Uint8Array(bytes.length);
    let n = 0;
    const hex = (c) => c !== undefined && /[0-9A-Fa-f]/.test(String.fromCharCode(c));
    for (let i = 0;i < bytes.length; i++) {
      const b = bytes[i];
      if (b !== 61) {
        out[n++] = b;
      } else if (bytes[i + 1] === 13 && bytes[i + 2] === 10) {
        i += 2;
      } else if (bytes[i + 1] === 10) {
        i += 1;
      } else if (hex(bytes[i + 1]) && hex(bytes[i + 2])) {
        out[n++] = parseInt(String.fromCharCode(bytes[i + 1], bytes[i + 2]), 16);
        i += 2;
      } else {
        out[n++] = b;
      }
    }
    return out.subarray(0, n);
  }
  return bytes;
}
function partText(bytes, leaf) {
  const raw = decodeTransfer(bytes, leaf.encoding);
  try {
    return new TextDecoder(leaf.params.charset || "utf-8").decode(raw);
  } catch {
    return new TextDecoder().decode(raw);
  }
}
function param(o, name) {
  if (o[name])
    return decodeWords(o[name]);
  const keys = Object.keys(o).filter((k) => k === `${name}*` || new RegExp(`^${name}\\*\\d+\\*?$`).test(k)).sort((a, b) => Number(a.split("*")[1] || 0) - Number(b.split("*")[1] || 0));
  if (!keys.length)
    return null;
  const joined = keys.map((k) => o[k]).join("");
  const m = /^([^']*)'[^']*'(.*)$/.exec(joined);
  if (!m)
    return joined;
  const bytes = [];
  for (let i = 0;i < m[2].length; i++) {
    const h = m[2].slice(i + 1, i + 3);
    if (m[2][i] === "%" && /^[0-9A-Fa-f]{2}$/.test(h)) {
      bytes.push(parseInt(h, 16));
      i += 2;
    } else
      bytes.push(m[2].charCodeAt(i) & 255);
  }
  try {
    return new TextDecoder(m[1] || "utf-8").decode(new Uint8Array(bytes));
  } catch {
    return new TextDecoder().decode(new Uint8Array(bytes));
  }
}
function splitParts(all) {
  let text = null;
  let html = null;
  const attachments = [];
  for (const l of all) {
    const name = param(l.dparams, "filename") ?? param(l.params, "name");
    const body = l.disposition !== "attachment" && !name && (l.type === "text/plain" || l.type === "text/html");
    if (body) {
      if (l.type === "text/plain" && !text)
        text = l;
      else if (l.type === "text/html" && !html)
        html = l;
      continue;
    }
    const sub = l.type === "message/rfc822" ? "eml" : l.type.split("/")[1] ?? "";
    attachments.push({
      section: l.section,
      encoding: l.encoding,
      filename: name?.replace(/[\r\n/\\]/g, "_") || `attachment${/^[a-z0-9]{1,8}$/.test(sub) ? `.${sub}` : ""}`,
      mimeType: l.type,
      size: l.size,
      contentId: l.id ? l.id.replace(/^<|>$/g, "") : null,
      inline: l.disposition === "inline" || l.disposition === null && !!l.id
    });
  }
  return { text, html, attachments };
}
async function parseListed(header, text, html) {
  const p = await parseMessage(header);
  const clean = html ? cleanHtml(html) : null;
  const plain = text ?? (clean ? clean.replace(/<[^>]*>/g, " ") : "");
  return { ...p, text, html: clean, snippet: plain.replace(/\s+/g, " ").trim().slice(0, 200), attachments: [] };
}
function encodeWord(v) {
  if (/^[\x20-\x7e]*$/.test(v))
    return v;
  const words = [];
  let chunk = "";
  for (const ch of v) {
    if (enc3.encode(chunk + ch).length > 45) {
      words.push(chunk);
      chunk = "";
    }
    chunk += ch;
  }
  if (chunk)
    words.push(chunk);
  return words.map((w) => `=?UTF-8?B?${b642(enc3.encode(w))}?=`).join(" ");
}
function b642(bytes) {
  let bin = "";
  for (let i = 0;i < bytes.length; i += 32768)
    bin += String.fromCharCode(...bytes.subarray(i, i + 32768));
  return btoa(bin);
}
var b64Lines = (bytes) => b642(bytes).replace(/.{76}(?=.)/g, `$&\r
`);
function formatAddress(a) {
  if (/[\r\n<>,;"]/.test(a.address) || !a.address.includes("@"))
    throw new Error(`invalid address: ${JSON.stringify(a.address)}`);
  if (!a.name)
    return a.address;
  const name = /^[\w .'-]*$/.test(a.name) ? `"${a.name}"` : encodeWord(a.name.replace(/[\r\n]/g, " "));
  return `${name} <${a.address}>`;
}
var noCrlf = (v) => v.replace(/[\r\n]+/g, " ");
function buildMessage(o) {
  const domain = o.from.address.split("@")[1] ?? "zveltio.invalid";
  const messageId = o.messageId ?? `<${crypto.randomUUID()}@${domain}>`;
  const boundary = o.boundary ?? `zv-${crypto.randomUUID()}`;
  const h = [
    `From: ${formatAddress(o.from)}`,
    ...o.to.length ? [`To: ${o.to.map(formatAddress).join(", ")}`] : [],
    ...o.cc.length ? [`Cc: ${o.cc.map(formatAddress).join(", ")}`] : [],
    ...o.replyTo ? [`Reply-To: ${formatAddress({ address: o.replyTo })}`] : [],
    `Subject: ${encodeWord(noCrlf(o.subject))}`,
    `Date: ${(o.date ?? new Date).toUTCString().replace("GMT", "+0000")}`,
    `Message-ID: ${messageId}`,
    ...o.inReplyTo ? [`In-Reply-To: ${noCrlf(o.inReplyTo)}`] : [],
    ...o.references ? [`References: ${noCrlf(o.references)}`] : [],
    ...o.priority === "high" ? ["X-Priority: 1", "Importance: high"] : o.priority === "low" ? ["X-Priority: 5", "Importance: low"] : [],
    ...o.readReceipt ? [`Disposition-Notification-To: ${formatAddress(o.from)}`] : [],
    "MIME-Version: 1.0"
  ];
  const textPart = (type, body) => `Content-Type: ${type}; charset=utf-8\r
Content-Transfer-Encoding: base64\r
\r
${b64Lines(enc3.encode(body))}\r
`;
  const alt = o.html ? `Content-Type: multipart/alternative; boundary="${boundary}-a"\r
\r
` + `--${boundary}-a\r
${textPart("text/plain", o.text)}--${boundary}-a\r
${textPart("text/html", o.html)}--${boundary}-a--\r
` : textPart("text/plain", o.text);
  let body;
  if (!o.attachments.length) {
    body = alt;
  } else {
    body = `Content-Type: multipart/mixed; boundary="${boundary}"\r
\r
--${boundary}\r
${alt}`;
    for (const a of o.attachments) {
      const name = encodeWord(noCrlf(a.filename).replace(/"/g, ""));
      body += `--${boundary}\r
Content-Type: ${noCrlf(a.mimeType)}; name="${name}"\r
` + `Content-Disposition: attachment; filename="${name}"\r
Content-Transfer-Encoding: base64\r
\r
${b64Lines(a.content)}\r
`;
    }
    body += `--${boundary}--\r
`;
  }
  return { raw: enc3.encode(`${h.join(`\r
`)}\r
${body}`), messageId };
}

// engine/mail.ts
var ACCOUNTS = "mail_accounts";
var FOLDERS = "mail_folders";
var MESSAGES = "mail_messages";
var ATTACHMENTS = "mail_attachments";
var DRAFTS = "mail_drafts";
var IDENTITIES = "mail_identities";
var FILTERS = "mail_filters";
var CONTACTS = "mail_contacts";
var SLOT = "mail";
var STALE_MS = 15 * 60000;

// engine/jobs.ts
var CALL_BUDGET = 850;
var BYTE_BUDGET = 48 * 1024 * 1024;
var MAX_TEXT = 5 * 1024 * 1024;
var FIRST_SYNC = 50;
var RECONCILE = 500;
var VIRTUAL = ["\\all", "\\flagged", "\\important"];
var message = (err) => (err instanceof Error ? err.message : String(err)).slice(0, 2000);
var isPrecondition = (err) => /precondition/i.test(message(err)) || err?.status === 409;

class Run {
  host;
  calls = 0;
  constructor(host) {
    this.host = host;
  }
  get c() {
    this.calls++;
    return this.host.collections;
  }
  get spent() {
    return this.calls >= CALL_BUDGET;
  }
  read(coll, id) {
    return this.c.read(coll, id);
  }
  async rows(coll, filter, extra = {}) {
    const res = await this.c.list(coll, { filter, limit: 1000, count: "none", ...extra });
    return res.records ?? [];
  }
  insert(coll, data) {
    return this.c.insert(coll, data);
  }
  update(coll, id, data, expect) {
    return this.c.update(coll, id, data, expect ? { expect } : undefined);
  }
  delete(coll, id) {
    return this.c.delete(coll, id);
  }
}
async function open(run, kind, acct) {
  const egress = run.host.egress;
  if (!egress?.connect)
    throw new Error("This engine cannot relay a mail connection; Mail needs 3.0.0-beta.109 or later.");
  if (!(await egress.slot(SLOT)).length) {
    throw new Error('No mail server is allowed yet: an operator binds the "mail" slot to the IMAP and SMTP host:port of this account.');
  }
  return egress.connect(SLOT, {
    host: String(acct[`${kind}_host`]).trim().toLowerCase(),
    port: Number(acct[`${kind}_port`]),
    tls: acct[`${kind}_tls`]
  });
}
async function imapOf(run, acct) {
  const c = await Imap.open(await open(run, "imap", acct), acct.imap_tls);
  await c.login(String(acct.imap_user), String(acct.imap_password ?? ""));
  return c;
}
var ORDER = ["inbox", "sent", "drafts", "archive", "other", "spam", "trash"];
function folderType(f) {
  if (f.path.toUpperCase() === "INBOX")
    return "inbox";
  const flags = f.flags.map((x) => x.toLowerCase());
  const special = [
    ["\\sent", "sent"],
    ["\\drafts", "drafts"],
    ["\\trash", "trash"],
    ["\\junk", "spam"],
    ["\\archive", "archive"]
  ];
  for (const [flag, type] of special)
    if (flags.includes(flag))
      return type;
  const n = f.name.toLowerCase();
  if (/^(sent|sent items|sent mail|sent messages|trimise)$/.test(n))
    return "sent";
  if (/^(drafts?|ciorne)$/.test(n))
    return "drafts";
  if (/^(trash|deleted|deleted items|deleted messages|bin|gunoi|coș de gunoi)$/.test(n))
    return "trash";
  if (/^(spam|junk|junk e-mail|junk email)$/.test(n))
    return "spam";
  if (/^(archive|archives|arhivă|arhiva)$/.test(n))
    return "archive";
  return "other";
}
async function syncFolders(run, imap, acct) {
  const remote = (await imap.list()).filter((f) => !f.flags.some((x) => VIRTUAL.includes(x.toLowerCase())));
  const local = await run.rows(FOLDERS, { account_id: acct.id });
  const byPath = new Map(local.map((r) => [String(r.path), r]));
  const paths = new Set(remote.map((f) => f.path));
  for (const r of local) {
    if (!paths.has(String(r.path))) {
      await run.delete(FOLDERS, r.id);
      byPath.delete(String(r.path));
    }
  }
  for (const f of remote) {
    if (!byPath.has(f.path)) {
      byPath.set(f.path, await run.insert(FOLDERS, { account_id: acct.id, name: f.name, path: f.path, type: folderType(f) }));
    }
  }
  return [...byPath.values()].sort((a, b) => ORDER.indexOf(a.type) - ORDER.indexOf(b.type));
}
function judge(filters, p, size) {
  const v = {};
  for (const f of filters) {
    const conds = Array.isArray(f.conditions) ? f.conditions : [];
    const acts = Array.isArray(f.actions) ? f.actions : [];
    if (!conds.length || !conds.every((c) => matches(c, p, size)))
      continue;
    for (const a of acts) {
      if (a?.type === "mark_read")
        v.read = true;
      else if (a?.type === "mark_starred")
        v.star = true;
      else if (a?.type === "move" && typeof a.folder === "string" && a.folder)
        v.moveTo = a.folder;
      else if (a?.type === "delete")
        v.delete = true;
      else if (a?.type === "stop")
        return v;
    }
  }
  return v;
}
function matches(c, p, size) {
  const value = String(c?.value ?? "").toLowerCase();
  if (c?.field === "size") {
    const n = Number(c.value);
    if (!Number.isFinite(n))
      return false;
    return c.operator === "greater_than" ? size > n : c.operator === "less_than" ? size < n : false;
  }
  const hay = (c?.field === "from" ? `${p.from.name ?? ""} <${p.from.address}>` : c?.field === "to" ? [...p.to, ...p.cc].map((a) => `${a.name ?? ""} <${a.address}>`).join(", ") : c?.field === "subject" ? p.subject ?? "" : c?.field === "body" ? p.text ?? "" : null)?.toLowerCase();
  if (hay === null || hay === undefined || !value)
    return false;
  switch (c.operator) {
    case "contains":
      return hay.includes(value);
    case "is":
      return hay === value || c.field === "from" && p.from.address.toLowerCase() === value;
    case "begins_with":
      return hay.startsWith(value);
    case "ends_with":
      return hay.endsWith(value) || c.field === "from" && p.from.address.toLowerCase().endsWith(value);
    default:
      return false;
  }
}
var has = (m, flag) => m.flags.some((f) => f.toLowerCase() === flag);
async function insertMessage(run, acct, folder, m, p, parts, v, headerOnly) {
  const date = m.internalDate ? Date.parse(m.internalDate) : Number.NaN;
  let row;
  try {
    row = await run.insert(MESSAGES, {
      account_id: acct.id,
      folder_id: folder.id,
      uid: m.uid,
      message_id: p.messageId,
      in_reply_to: p.inReplyTo,
      references_header: p.references,
      from_address: p.from.address || null,
      from_name: p.from.name ?? null,
      to_addresses: p.to,
      cc_addresses: p.cc,
      reply_to: p.replyTo,
      subject: p.subject,
      body_text: headerOnly ? `(This message's text is over ${MAX_TEXT / 1048576} MiB; open it in your mail server's webmail.)` : p.text,
      body_html: headerOnly ? null : p.html,
      snippet: p.snippet,
      priority: p.priority,
      is_read: has(m, "\\seen") || v.read === true,
      is_starred: has(m, "\\flagged") || v.star === true,
      has_attachments: parts.some((a) => !a.inline),
      read_receipt_requested: p.readReceipt,
      size: m.size,
      sent_at: p.date,
      received_at: Number.isFinite(date) ? new Date(date).toISOString() : p.date ?? new Date().toISOString()
    });
  } catch (err) {
    const [dup] = await run.rows(MESSAGES, { folder_id: folder.id, uid: m.uid }, { limit: 1 });
    if (dup)
      return;
    throw err;
  }
  for (const a of parts) {
    if (run.spent)
      break;
    await run.insert(ATTACHMENTS, {
      message_id: row.id,
      filename: a.filename,
      mime_type: a.mimeType,
      size: a.size,
      content_id: a.contentId,
      is_inline: a.inline,
      section: a.section,
      encoding: a.encoding,
      file_id: null
    });
  }
}
async function syncFolder(run, imap, acct, folder, filters) {
  const sel = await imap.select(String(folder.path));
  const validity = String(sel.uidValidity);
  let lastUid = Number(folder.last_uid) || 0;
  if (folder.uid_validity && folder.uid_validity !== validity) {
    for (;; ) {
      const old = await run.rows(MESSAGES, { folder_id: folder.id }, { limit: 100 });
      if (!old.length)
        break;
      for (const r of old) {
        if (run.spent)
          return true;
        await run.delete(MESSAGES, r.id);
      }
    }
    lastUid = 0;
  }
  const server = await imap.flags();
  const onServer = new Map(server.map((m) => [m.uid, m]));
  const local = await run.rows(MESSAGES, { folder_id: folder.id }, { sort: "uid", order: "desc", limit: RECONCILE });
  let more = false;
  for (const r of local) {
    if (run.spent)
      return true;
    const s = onServer.get(Number(r.uid));
    if (!s) {
      await run.delete(MESSAGES, r.id);
      continue;
    }
    const read = has(s, "\\seen");
    const star = has(s, "\\flagged");
    if (read !== Boolean(r.is_read) || star !== Boolean(r.is_starred)) {
      await run.update(MESSAGES, r.id, { is_read: read, is_starred: star });
    }
  }
  let fresh = await imap.headers(lastUid + 1);
  if (lastUid === 0)
    fresh = fresh.slice(-FIRST_SYNC);
  const rules = folder.type === "inbox" ? filters : [];
  for (const m of fresh) {
    if (run.spent || imap.bytesIn > BYTE_BUDGET) {
      more = true;
      break;
    }
    const listed = await imap.structure(m.uid);
    if (listed) {
      const { text, html, attachments } = splitParts(listed.leaves);
      const body = [text, html].filter((l) => l !== null);
      const headerOnly = body.reduce((n, l) => n + l.size, 0) > MAX_TEXT;
      const got = headerOnly ? new Map : await imap.parts(m.uid, body.map((l) => l.section));
      const textOf = (l) => l && got.has(l.section) ? partText(got.get(l.section), l) : null;
      const p = await parseListed(listed.header, textOf(text), textOf(html));
      const v = judge(rules, p, m.size);
      if (v.delete) {
        await imap.expunge([m.uid]);
      } else if (v.moveTo && v.moveTo !== folder.path) {
        await imap.move([m.uid], encodeMailbox(v.moveTo));
      } else {
        const add = [...v.read && !has(m, "\\seen") ? ["\\Seen"] : [], ...v.star && !has(m, "\\flagged") ? ["\\Flagged"] : []];
        if (add.length)
          await imap.store([m.uid], "+", add);
        await insertMessage(run, acct, folder, m, p, attachments, v, headerOnly);
      }
    }
    lastUid = m.uid;
  }
  await run.update(FOLDERS, folder.id, {
    uid_validity: validity,
    last_uid: lastUid,
    total_count: server.length,
    unread_count: server.filter((m) => !has(m, "\\seen")).length
  });
  return more;
}
var sync = async (input, host) => {
  const run = new Run(host);
  const acct = await run.read(ACCOUNTS, input.account_id);
  if (!acct)
    return;
  try {
    await run.update(ACCOUNTS, acct.id, { sync_status: "syncing" }, { sync_status: ["queued"] });
  } catch (err) {
    if (isPrecondition(err))
      return;
    throw err;
  }
  let imap = null;
  try {
    if (!acct.is_active)
      throw new Error("The account is inactive.");
    imap = await imapOf(run, acct);
    const folders = await syncFolders(run, imap, acct);
    const filters = await run.rows(FILTERS, { account_id: acct.id, is_active: true }, { sort: "sort_order", order: "asc" });
    let more = false;
    for (const f of folders) {
      if (run.spent || imap.bytesIn > BYTE_BUDGET) {
        more = true;
        break;
      }
      if (await syncFolder(run, imap, acct, f, filters))
        more = true;
    }
    await run.update(ACCOUNTS, acct.id, { sync_status: "idle", sync_error: null, sync_more: more, last_sync_at: new Date().toISOString() });
  } catch (err) {
    await run.update(ACCOUNTS, acct.id, { sync_status: "error", sync_error: message(err), sync_more: false });
  } finally {
    await imap?.logout();
  }
};
var addressList = (v) => (Array.isArray(v) ? v : []).map((a) => typeof a === "string" ? { address: a } : a && typeof a === "object" ? a : null).filter((a) => !!a && typeof a.address === "string" && a.address.includes("@")).map((a) => a.name ? { address: a.address.trim(), name: String(a.name) } : { address: a.address.trim() });
var SAVES_SENT = /(^|\.)(gmail\.com|googlemail\.com|office365\.com|outlook\.com)$/i;
var send = async (input, host) => {
  const run = new Run(host);
  const draft = await run.read(DRAFTS, input.draft_id);
  if (!draft)
    return;
  try {
    await run.update(DRAFTS, draft.id, { send_status: "sending", send_error: null }, { send_status: ["queued"] });
  } catch (err) {
    if (isPrecondition(err))
      return;
    throw err;
  }
  let raw;
  let acct;
  try {
    acct = await run.read(ACCOUNTS, String(draft.account_id));
    if (!acct?.is_active)
      throw new Error("The account is gone or inactive.");
    const ident = draft.identity_id ? await run.read(IDENTITIES, String(draft.identity_id)) : null;
    const from = { address: String(ident?.email_address ?? acct.email_address) };
    const name = ident?.display_name ?? acct.display_name;
    if (name)
      from.name = String(name);
    const to = addressList(draft.to_addresses);
    const cc = addressList(draft.cc_addresses);
    const bcc = addressList(draft.bcc_addresses);
    if (!to.length && !cc.length && !bcc.length)
      throw new Error("The draft has no recipient.");
    const attached = Array.isArray(draft.attachments) ? draft.attachments : [];
    const files = host.files;
    if (attached.length && !files)
      throw new Error("This engine cannot hand a job its files; attachments need 3.0.0-beta.109 or later.");
    const attachments = [];
    for (const a of attached) {
      const name = String(a.filename ?? a.file_id);
      const f = await files.get(String(a.file_id)).catch((err) => {
        throw new Error(`The attachment ${name} was not handed to this send: ${message(err)}`);
      });
      if (!f)
        throw new Error(`The attachment ${name} is gone, or no longer yours to read.`);
      attachments.push({ filename: String(a.filename || f.name), mimeType: String(a.mime_type || f.contentType), content: f.bytes });
    }
    ({ raw } = buildMessage({
      from,
      to,
      cc,
      bcc,
      replyTo: ident?.reply_to ?? null,
      subject: String(draft.subject ?? ""),
      text: String(draft.body_text ?? ""),
      html: draft.body_html ? String(draft.body_html) : null,
      inReplyTo: draft.in_reply_to ?? null,
      references: draft.references_header ?? null,
      priority: draft.priority,
      readReceipt: draft.request_read_receipt === true,
      attachments
    }));
    const user = String(acct.smtp_user || acct.imap_user || "");
    const password = String(acct.smtp_password || acct.imap_password || "");
    await sendMail(await open(run, "smtp", acct), acct.smtp_tls, user ? { user, password } : null, { from: from.address, to: [...to, ...cc, ...bcc].map((a) => a.address) }, raw);
  } catch (err) {
    const why = err instanceof SmtpError && err.unknownOutcome ? `${message(err)}. It may have been delivered: check the recipient or Sent before sending it again.` : message(err);
    await run.update(DRAFTS, draft.id, { send_status: "failed", send_error: why });
    return;
  }
  if (!SAVES_SENT.test(String(acct.smtp_host))) {
    let imap = null;
    try {
      const [sent] = await run.rows(FOLDERS, { account_id: acct.id, type: "sent" }, { limit: 1 });
      if (sent) {
        imap = await imapOf(run, acct);
        await imap.append(String(sent.path), ["\\Seen"], raw);
      }
    } catch {} finally {
      await imap?.logout();
    }
  }
  try {
    for (const a of [...addressList(draft.to_addresses), ...addressList(draft.cc_addresses)].slice(0, 20)) {
      const [known] = await run.rows(CONTACTS, { email_address: a.address }, { limit: 1 });
      if (!known)
        await run.insert(CONTACTS, { email_address: a.address, display_name: a.name ?? null });
    }
  } catch {}
  await run.delete(DRAFTS, draft.id);
};
var apply = async (input, host) => {
  const i = input;
  const run = new Run(host);
  const acct = await run.read(ACCOUNTS, i.account_id);
  if (!acct)
    return;
  let imap = null;
  try {
    imap = await imapOf(run, acct);
    const folderOf = new Map;
    const folder = async (id) => {
      if (!folderOf.has(id)) {
        const f = await run.read(FOLDERS, id);
        folderOf.set(id, f && f.account_id === acct.id ? f : null);
      }
      return folderOf.get(id) ?? null;
    };
    if (i.op === "createFolder" || i.op === "renameFolder" || i.op === "deleteFolder") {
      const name = String(i.name ?? "").trim();
      if (i.op === "createFolder") {
        await imap.create(encodeMailbox(name));
      } else {
        const f = await folder(String(i.folder_id));
        if (!f)
          return;
        if (i.op === "deleteFolder") {
          await imap.remove(String(f.path));
          await run.delete(FOLDERS, f.id);
          return;
        }
        const delim = (await imap.list()).find((x) => x.path === f.path)?.delimiter ?? "";
        const parent = delim && String(f.path).includes(delim) ? String(f.path).slice(0, String(f.path).lastIndexOf(delim) + 1) : "";
        const path = parent + encodeMailbox(name);
        await imap.rename(String(f.path), path);
        await run.update(FOLDERS, f.id, { path, name });
      }
      await syncFolders(run, imap, acct);
      return;
    }
    const groups = new Map;
    for (const id of i.message_ids ?? []) {
      const m = await run.read(MESSAGES, id);
      if (!m || m.account_id !== acct.id)
        continue;
      const list = groups.get(String(m.folder_id)) ?? [];
      list.push(m);
      groups.set(String(m.folder_id), list);
    }
    const [trash] = i.op === "delete" ? await run.rows(FOLDERS, { account_id: acct.id, type: "trash" }, { limit: 1 }) : [];
    const target = i.op === "move" ? await folder(String(i.folder_id)) : trash ?? null;
    if (i.op === "move" && !target)
      throw new Error("The target folder is gone.");
    for (const [folderId, msgs] of groups) {
      const f = await folder(folderId);
      if (!f)
        continue;
      const uids = msgs.map((m) => Number(m.uid));
      await imap.select(String(f.path));
      if (i.op === "flags") {
        for (const [field, flag] of [["is_read", "\\Seen"], ["is_starred", "\\Flagged"]]) {
          if (typeof i[field] === "boolean")
            await imap.store(uids, i[field] ? "+" : "-", [flag]);
        }
        continue;
      }
      if (i.op === "move" || target && target.id !== f.id)
        await imap.move(uids, String(target.path));
      else
        await imap.expunge(uids);
      for (const m of msgs)
        await run.delete(MESSAGES, m.id);
    }
    if (target && i.op !== "flags")
      await syncFolder(run, imap, acct, await run.read(FOLDERS, target.id), []);
  } catch (err) {
    await run.update(ACCOUNTS, acct.id, { sync_error: message(err) });
  } finally {
    await imap?.logout();
  }
};
var fetchAttachment = async (input, host) => {
  const run = new Run(host);
  const att = await run.read(ATTACHMENTS, input.attachment_id);
  if (!att || att.file_id)
    return;
  let imap = null;
  try {
    const msg = await run.read(MESSAGES, String(att.message_id));
    const folder = msg && await run.read(FOLDERS, String(msg.folder_id));
    const acct = msg && await run.read(ACCOUNTS, String(msg.account_id));
    if (!msg || !folder)
      throw new Error("The message is gone.");
    if (!acct?.is_active)
      throw new Error("The account is gone or inactive.");
    if (!host.files)
      throw new Error("This engine cannot hand a job its files; downloads need 3.0.0-beta.109 or later.");
    imap = await imapOf(run, acct);
    const sel = await imap.select(String(folder.path));
    if (String(sel.uidValidity) !== String(folder.uid_validity))
      throw new Error("The folder changed on the mail server: sync, then try again.");
    const raw = (await imap.parts(Number(msg.uid), [String(att.section)])).get(String(att.section));
    if (!raw)
      throw new Error("The message is no longer on the mail server.");
    const file = await host.files.put(decodeTransfer(raw, String(att.encoding ?? "")));
    await run.update(ATTACHMENTS, att.id, { file_id: file.id, fetch_status: null, fetch_error: null });
  } catch (err) {
    await run.update(ATTACHMENTS, att.id, { fetch_status: "failed", fetch_error: message(err) });
  } finally {
    await imap?.logout();
  }
};
var jobs_default = { sync, send, apply, fetchAttachment };
export {
  jobs_default as default,
  folderType,
  judge
};
