var zider = window.zider  || {};
var crypt = window.crypto || window.msCrypto || window.webitCrypto;
var ZTL   = crypt.subtle  || crypt.webkitSubtle; // webkitSubtle - only mobile;

// object helper util @ oneiroi 2017-04-15
var $$ = /*window.$$ ||*/ function (o, b, j) {
  if (typeof o == 'string') {
    var p = {}, s = j.split(',');
     o.split(',').forEach(function(e, n) {p[e] = b[s[n]]});
    var o = {}, b = p, j = undefined;
  }
  switch (typeof j) {
    case 'string' : var i = j.split(','); break;
    case 'object' : var i = j; break;
    default       : var i = Object.getOwnPropertyNames(b);
  }
  switch (typeof b) {
    case 'function' : i.forEach(function(z) {var v = b(z, o); return v && (o[z] = v)}); break;
    default         : i.forEach(function(z,s,a) {o[z] = b[z]});
  }
  return o;
};

// OLD SPEC : CryptoOperation, KeyOperation (IE11)
// NEW SPEC : CryptoKey (Chrome, firefox)

zider.scheme = {
  v1 : [
    'RSASSA-PKCS1-v1_5', 'RSA-OAEP',     new Uint8Array([0x01, 0x00, 0x01]), 2048, 
    'RS256',             'RSA-OAEP',     'AQAB',
    'SHA-256',           'SHA-1'   
  ],
  v2 : [
    'RSASSA-PKCS1-v1_5', 'RSA-OAEP',     new Uint8Array([0x01, 0x00, 0x01]), 2048, 
    'RS256',             'RSA-OAEP-256', 'AQAB',
    'SHA-256',           'SHA-256' 
  ]
};
zider.dictionary = function(v, u) {
  var r = $$({}, {v: v || 'v1', usage : [u], key_ops : [u]}), d = zider.scheme[r.v];
  $$(r, $$('publicExponent,modulusLength,e', d, '2,3,6'));
  $$(r, (u == 'sign' || u == 'verify') ? $$('name,hash,alg', d, '0,7,4') : $$('name,hash,alg', d, '1,8,5'));
  return r;
};
zider.seed = function(size) { 
  return crypt.getRandomValues(new Uint8Array(size));
};
// ### Normailization Callback - promise / event object.
// [Normalization] New spec [Promise] vs old spec [Event Object, IE11]
// [Minimization ] then(oncomplete) and catch(onerror) as one functon.
// [IE11 BUG     ] IE11 never fires 'onerror', use try-catch statement.
// [Encoding     ] very convenient if possible!
// [Callback Func] cbFunc(value, ifError);
zider.fn = function(m, a, c, e, u) {
  try { // FIXING IE 11 BUG : onerror, never expect it!
    var f = function(v, n) {
      if (n) console.log('zider.fn error : [' + m + ']', n, a);
      var _ = (v && v.target && v.target.result/*IE11*/) || v;
      return c.call(x, _ && zider.encode(e, _), n);
    };
    var x = ZTL[m].apply(ZTL, a); // _ZTL! or Error! :)
    if (x.then) return x.then(f).catch(function(n) {f(u, n)});
    return x.oncomplete = f;
  } catch (n) {f(u, n)};
};
/* KEY */
zider.key = {};
zider.key.generate = function(f, v) {
  var d = zider.dictionary(v, 'sign');
  zider.fn('generateKey', // #1. KEY GENERATION
    // On IE11, hash info is not necessary here but to sign to veryify later.
    [$$({hash: {name: d.hash}}, d, 'name,modulusLength,publicExponent'), true, d.usage], 
    function (r, e) {     // #2. KEY EXPORTING
      zider.fn('exportKey', ["jwk", r.privateKey], 
        function(r, e) {  // #3. KEY NEUTRALIZING.
          // ArrayBuffer type : MSIE11, MOBILE WEBKIT BROWSERS / EXCEPT DESKTOP MODERNS
          var jwk = (window.CryptoKey) ? r : JSON.parse(zider.convert.ab2str(r, true));
          f($$($$({}, jwk, 'd,dp,dq,p,q,qi,n'), {v : d.v}), e);
        }
      );
    }
  );
};
zider.key.set = function(s, m, v) { // RSA KEY TO LOAD
  var d = zider.dictionary(v || s.v || 'v1', m);
  // ★ IE11 : ERROR IF ADDING MORE PROPERTY
  // ★ IE11 : kty, extractable, n, e | d dp dq e extractable kty n p q qi
  // ★ MOBILE WEBKIT & IE11 KEYTYPE - [ARRAYBUFFER! of Stringified JSON]
  var k = $$({}, {kty: "RSA", e: d.e, n: s.n});
  ((document.documentMode == 11) && $$(k, {extractable: true})) || $$(k, d, 'key_ops,alg');
  if (m == 'sign' || m == 'decrypt') $$(k, s, 'd,dp,dq,p,q,qi');
  return (window.CryptoKey)? $$(k, {ext: true}) : zider.encode('str2ab', JSON.stringify(k)).buffer;
};
// GET REAL KEY OF WEB CRYPTOGRAPH 
zider.key.load = function(k, m, f, v) { // ONLY FOR RSA
  var d = zider.dictionary(v || k.v || 'v1', m);
  var j = zider.key.set(k, m, d.v);
  return zider.fn('importKey', ["jwk", j, {name:d.name, hash:{name: d.hash}}, false, d.usage], f);
};
zider.RSA = function(p, m, s, d, f, e) { // pseudoKey, method, signature, data, func, encode
  var c = zider.dictionary(p.v, m);
  zider.key.load(p, m, function(k){
    if (m == "verify") zider.fn(m, [$$({}, c, 'name,hash'), k, s, d], f, e);
    else zider.fn(m, [$$({}, c, 'name,hash'), k, s], d, f);
  });
};
zider.AES = function(m, d, p, v, f, e) {
  var v = (typeof v == 'string') ? zider.decode('base64url', v) : v;
  if (typeof d == "string") d = (m == 'encrypt') ? zider.encode('utf8', d) : zider.decode('base64url', d);
  if (typeof p == 'string') {
    return zider.hash(zider.convert.mergedAb(v, zider.encode('utf8', p)), function(h) {
      return zider.AES(m, d, h, ((typeof v == 'string') ? zider.decode('base64url', v) : v), f, e);
    });
  };
  zider.fn('importKey', ["raw", p, {name: "AES-CBC"}, false, ["encrypt", "decrypt"]], 
    function(k, n) {
      zider.fn(m, [{name: "AES-CBC", iv: v}, k/*key*/, d], f, e)
    }
  );
  return this;
};
/* 
   RSA SHORT FUNCTION 
   zider.RSA.sign/verify/encrypt/decrypt
*/
$$(zider.RSA, function(e){
  return function() {
    var arg = Array.prototype.slice.call(arguments);
    zider.RSA.apply(zider.RSA, arg.splice(1, 0, e) && arg);
    return this;
  };
}, "sign,verify,encrypt,decrypt");
/* HASH IE11, SHA-1 - NO SUPPORTING*/
zider.hash = function(d, f, a, e) { // data, func, algo, encode
  zider.fn('digest', [a || "SHA-256", d], f, e);
};
/* AES-CBC encryption/decryption */
zider.encrypt = function(d, p, f, e) { // data, password, vector
  var v = zider.seed(16);
  zider.AES('encrypt', d, p, v, function(r) {
    f({data:r, vector: zider.encode('base64url', v)});
  }, e || 'base64url');
};
zider.decrypt = function(d, p, v, f, e) {zider.AES('decrypt', d, p, v, f, e);};