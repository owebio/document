var zider   = window.zider   || {};
var _Crypto = window.crypto  || window.msCrypto || window.webitCrypto;
var _ZTL    = _Crypto.subtle || _Crypto.webkitSubtle; // webkitSubtle - only mobile;

// OLD SPEC : CryptoOperation, KeyOperation (IE11)
// NEW SPEC : CryptoKey (Chrome, firefox)
// ### zider's inner verion compatibility & dictionary
zider.version = {
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
zider.dictionary = function(version, usage, type) {
  var dict = zider.version[version || 'v1'];
  var type = type || 'key'; // key | exec
  if (type == 'jwk') return {
    alg : (usage == 'sign' || usage == 'verify') ? dict[4] : dict[5],
    e   : dict[6], key_ops : [usage]
  }; 
  if (type == 'exec') return {
    name : (usage == 'sign' || usage == 'verify') ? dict[0] : dict[1],
    hash : (usage == 'sign' || usage == 'verify') ? dict[7] : dict[8],
    publicExponent: dict[2], modulusLength : dict[3],
    usage : [usage]
  };
  return undefined;
};
zider.seed = function(size) { // Random seed
  return _Crypto.getRandomValues(new Uint8Array(size));
}
// ### Normailization Callback - promise / event object.
// [Normalization] New spec [Promise] vs old spec [Event Object, IE11]
// [Minimization ] then(oncomplete) and catch(onerror) as one functon.
// [IE11 BUG     ] IE11 never fires 'onerror', use try-catch statement.
// [Encoding     ] very convenient if possible!
// [CallbackFunc ] cbFunc(value, isError, other);
zider.fn = function(method, arguments, cb, encode) {
  var pseudoCB = function(v, e) {
    if (e) console.log('zider.fn error : ' + method, e);
    var value = (v && v.target && v.target.result/*IE11*/) || v;
    try {
      switch (encode) {
        case 'base64url' : return cb.call(EXEC, zider.convert.base64url.encode(value));
        case 'base64'    : return cb.call(EXEC, zider.convert.base64.encode(value));
        case 'hex'       : return cb.call(EXEC, zider.convert.ab2hex(value));
      }
    } catch (e) {
      if (e) console.log('zider.fn encode error : ' + encode, e);
      cb.call(EXEC, undefined, e);
    }
    return cb.call(EXEC, value, e);
  };
  try { // IE 11 BUG, onerror does not work.
    var EXEC = _ZTL[method].apply(_ZTL, arguments); // _ZTL!
    if (EXEC.then) return EXEC.then(pseudoCB).catch(function(e){pseudoCB(undefined, e)});
    return  EXEC.oncomplete = pseudoCB;
  } catch (e) {pseudoCB(undefined, e)};
};

zider.RSA = function(neutralKey, method, signature, data, func, encode) {
  var exeDict = zider.dictionary(neutralKey.v, method, 'exec');
  zider.key.load(neutralKey, method, function(key){
    if (method == "verify") {
      zider.fn('verify', 
        [{name: exeDict.name, hash: exeDict.hash}, key, signature, data]
        , func, encode);
    } else {
      zider.fn(method, [{name: exeDict.name, hash: exeDict.hash}, key, signature], 
        data, func); // signature -> func, func -> encode
    };
  });
};
zider.AES = function(method, password, vector, data, func, encode) {
  if (zider.convert) { // AUTO CONVERTING FOR STRING
    var UTF8      = zider.convert.UTF8.encode;
    var base64url = zider.convert.base64url.decode;
    var vector    = (typeof vector == 'string') ? base64url(vector) : vector;
    if (method == 'encrypt')      data = (typeof data == 'string') ? UTF8(data)      : data;
    else if (method == 'decrypt') data = (typeof data == 'string') ? base64url(data) : data;
    if (typeof password == 'string') {
      var _password = zider.convert.mergedAb(vector, UTF8(password));
      return zider.hash(_password, function(hashPassword){
        return zider.AES(method, hashPassword, vector, data, func, encode);
      });
    };
  }
  zider.fn('importKey', 
    ["raw", password, {name: "AES-CBC"}, false, ["encrypt", "decrypt"]], 
    function(v, e) {
      zider.fn(method, [{name: "AES-CBC", iv: vector}, v/*key*/, data], func, encode)
    }
  );
  return this;
};
/* KEY */
zider.key = {};
zider.key.neutralize = function(jwk, version) {
  return {
    d : jwk.d, dp : jwk.dp, dq : jwk.dq,
    p : jwk.p, q  : jwk.q,  qi : jwk.qi,
    n : jwk.n, v  : version || 'v1'
  }
};
zider.key.generate = function(func, version) {
  var keyInfo = zider.dictionary(version, 'sign', 'exec');
  zider.fn('generateKey', [ // #1. KEY GENERATION WITH OPTION
    { name: keyInfo.name, modulusLength: keyInfo.modulusLength,
      publicExponent: keyInfo.publicExponent,
      hash: {name: keyInfo.hash} // On IE11, not necessary here but to sign to veryify later. 
    }, true, keyInfo.usage
    ], function(r, e) { // #2. KEY EXPORTING, EXTRACT ONLY PRIVATE KEY TO NEUTRALIZE.
      zider.fn('exportKey', ["jwk", r.privateKey], 
        function(r, e) {
          // ArrayBuffer type : MSIE11, MOBILE BROWSERS / EXCEPT DESKTOP MODERNS
          var jwk = (window.CryptoKey) ? r : JSON.parse(zider.convert.ab2str(r, true));
          func(zider.key.neutralize(jwk, version));
        }
      );
    }
  );
};
zider.key.set = function(neutralKey, method, version) {
  var version = version || neutralKey.version || 'v1';
  var method  = method  || 'sign';
  var keyDict = zider.dictionary(version, method, 'jwk');
  var pseudoKey = {};
  // ★ IE11   - ERROR IF ADDED UNNECESSARY PROPERTIES
  // ★ IE11   PUBLIC  - kty, extractable, n, e (NO MAS NO MENOS)
  // ★ IE11   PRIVATE - d dp dq e extractable kty n p q qi
  // ★ IE11   KEYTYPE - [ARRAYBUFFER! of JSON's STRING};
  // ★ MOBILE KEYTYPE - [ARRAYBUFFER! of JSON's STRING};
  if (document.documentMode != 11) {
    pseudoKey.key_ops = keyDict.key_ops;
    pseudoKey.alg     = keyDict.alg;
  } else pseudoKey.extractable = true;
  pseudoKey.kty = "RSA";
  pseudoKey.e   = keyDict.e;
  pseudoKey.n   = neutralKey.n;
  if (method == 'sign' || method == 'decrypt') {
    ('d,dp,dq,p,q,qi').split(',').forEach(function(e){
      pseudoKey[e] = neutralKey[e];
    });
  }
  // OBJECT : Edge, FF, CHROME, OPERA, SAFARI
  // BUFFER : IE11, MOBILE-CHROME, MOBILE-SAFARI
  if (window.CryptoKey) pseudoKey.ext = true; 
  else pseudoKey = zider.convert.str2ab(JSON.stringify(pseudoKey), true).buffer;
  return pseudoKey;
};
// GET REAL WEB CRYPTOGRAPH KEY
zider.key.load = function(key, method, func, version) {
  var version = version || key.v || 'v1';
  var method  = method  || 'sign';
  var exeDict = zider.dictionary(version, method, 'exec');
  var keyJWK  = zider.key.set(key, method, version);
  zider.fn('importKey', [
    "jwk", keyJWK, {name: exeDict.name, hash: {name: exeDict.hash}},
    false, exeDict.usage
  ], func);
};
/* RSA SHORT FUNCTION - SIGN/VERIFY/ENCRYPT/DECRYPT   */
("sign,verify,encrypt,decrypt").split(',').forEach(function(e){
  zider.RSA[e] = function() {
    // verify : pseudoKey, 'verify', signature, data, **func**
    // other  : pseudoKey, 'sign', data, **func**, encode
    var arg = Array.prototype.slice.call(arguments);
    zider.RSA.apply(zider.RSA, arg.splice(1, 0, e) && arg);
  };
});
/* HASH */
zider.hash = function(data, func, algo, encode) {
  zider.fn('digest', [algo || "SHA-256", data], func, encode);
};
/* AES-CBC encryption/decryption */
zider.encrypt = function(data, password, func, encode) {
  var vector    = zider.seed(16);
  var base64url = zider.convert.base64url.encode;
  var result = { // NEED COLLECT, GETTING RANDOM VECTOR USED
    data     : undefined,
    vector   : base64url(vector)
  };
  zider.AES('encrypt', password, vector, data, function(r) {
    result.data = r;
    func(result);
  }, encode || 'base64url');
};
zider.decrypt = function(data, vector, password, func, encode) {
  zider.AES('decrypt', password, vector, data, func, encode);
};