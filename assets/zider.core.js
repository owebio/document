/*
   Wrapping Web Cryptography for zider core.
   oneiroi, 2017-04-19
*/
(function(W, $A, $E, $D, $S, $V, $I, $64, $8, $J) {
var Z = zider = W.zider || {}, $B = !(W.CryptoKey);
var $C = W.crypto || W.msCrypto || W.webitCrypto;
var ZTL= $C.subtle  || $C.webkitSubtle; // [Webkit Mobile];
Z.scheme = {
  v1 : [
    'RSASSA-PKCS1-v1_5', 'RSA-OAEP', new Uint8Array([0x01, 0x00, 0x01]), 2048, 
    'RS256',             'RSA-OAEP', 'AQAB',
    'SHA-256',           'SHA-1'   
  ]
};
Z.scheme.v2 = $$($$([], Z.scheme.v1), {8:'SHA-256'});
var $T = Z.dictionary = function(v, u) {
  var T = {v: v || 'v1', usage : [u], key_ops : [u]}, d = Z.scheme[T.v];
  $(T, $('publicExponent,modulusLength,e', d, '2,3,6'));
  return $(T, u.__($S, $V) ? $('name,hash,alg', d, '0,7,4') : $('name,hash,alg', d, '1,8,5'));
};
zider.seed = function(l) {return $C.getRandomValues(new Uint8Array(l))};
var fn = zider.fn = function(m, a, c, e, u) {
  try {
    var f = function(v, n) {
      !!n && console.log('zider.fn error : [' + m + ']', n, a);
      var _ = (v && v.target && v.target.result/*IE11*/) || v;
      return c.call(x, _ && zider.encode(e, _), n);
    };
    var x = ZTL[m].apply(ZTL, a);
    return x.then ? x.then(f).catch(function(n) {f(u, n)}) : x.oncomplete = f;
  } catch (n) {f(u, n)};
};
var key = zider.key = { /* KEY */
  generate : function(f, v) {
    var d = $T(v, $S);
    fn('generateKey', [$({hash: {name: d.hash}}, d, 'name,modulusLength,publicExponent'), !0, d.usage], 
      function(r, e) {fn('exportKey', [$J, r.privateKey],
        function(j, e) {
          f($($($B ? j.JSON() : j , 'd,dp,dq,p,q,qi,n'), {v : d.v}), e);
        });
      });
  },
  set : function(s, m, v) { // RSA KEY TO LOAD
    var d = $T(v || s.v || 'v1', m), k = {kty: 'RSA', e: d.e, n: s.n};
    $(k, {extractable: !0}, !1, W.msCrypto,  d, 'key_ops,alg');
    $(k, s, 'd,dp,dq,p,q,qi', m.__($S, $D));
    return $B ? k[$8]() : $(k, {ext: !0});
  },
  load : function(k, m, f, v) {
    var d = $T(v || k.v || 'v1', m);
    fn($I, [$J, key.set(k, m, d.v), {name: d.name, hash: {name: d.hash}}, !1, d.usage], f);
  }
};
var RSA = Z.RSA = function(p, m, s, d, f) { /* RSA */
  var a = $($T(p.v, m), 'name,hash');
  key.load(p, m, function(k) {fn.$(m == $V, [m, [a, k, s, d], f], [m, [a, k, s], d, f])});
};
var AES = Z.AES = function(m, d, p, v, f, e) { /* AES */
  var v = v.$('S') ? v[$64]() : v, d = d.$('S') ? d[m.$($E, $8, $64)]() : d;
  if (p.$('S')) return Z.hash(Z.convert.mergedAb(v, p[$8]()), function(h) {
    return AES(m, d, h, v, f, e);
  });
  fn($I, ["raw", p, {name: $A}, !1, [$E, $D]],
    function(k, n) {fn(m, [{name: $A, iv: v}, k, d], f, e)}
  );
};/* HASH */ // [IE11] - NOT SUPPORTING : SHA-1
Z.hash = function(d, f, a, e) {fn('digest', [a || "SHA-256", d], f, e)};
$$(RSA, function(e){ return function(arg) { /* SHORT_HAND FUNCTION */
  arg = Array.prototype.slice.call(arguments);
  RSA.apply(RSA, arg.splice(1, 0, e) && arg); return this};
}, [$S, $E, $V, $D].join(','));
Z.encrypt = function(d, p, f, e, v) {
  AES($E, d, p, v = Z.seed(16), function(r, e) {f({data:r, vector: String[$64](v)})}, e || $64);
};
Z.decrypt = function(d, p, v, f, e) {AES($D, d, p, v, f, e)};
})(window,'AES-CBC','encrypt','decrypt','sign','verify','importKey','base64url','UTF8','jwk');