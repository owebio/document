

var zider   = window.zider   || {};
var _Crypto = window.crypto  || window.msCrypto || window.webitCrypto;
var _ZTL    = _Crypto.subtle || _Crypto.webkitSubtle; //webkitSubtle - only mobile;

// ### zider's inner verion compatibility & dictionary
zider.version = {
  v1 : [ // Current standard version for most.  
    'RSASSA-PKCS1-v1_5', 'RSA-OAEP',     new Uint8Array([0x01, 0x00, 0x01]), 2048, 
    'RS256',             'RSA-OAEP',     'AQAB',
    'SHA-256',           'SHA-1'   
  ],
  v2 : [ // Next standard version. [Mobile Webkit, now no support SHA-256 for encryption.]
    'RSASSA-PKCS1-v1_5', 'RSA-OAEP',     new Uint8Array([0x01, 0x00, 0x01]), 2048, 
    'RS256',             'RSA-OAEP-256', 'AQAB',
    'SHA-256',           'SHA-256' 
  ]
};

/* 0. Zider core utils */
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
// ### Random seed : For Padding and Password
zider.seed = function(size) {
  return _Crypto.getRandomValues(new Uint8Array(size));
}
// ### Normailization Callback - promise / event object.
zider.fnCb = function(poe, cbFnc, encode) {
  // [Normalization] Promise/Event Object(IE11)
  // [Minimization ] then(oncomplete) and catch(onerror) as one functon.
  // [Encoding     ] 
  var result    = {value : undefined, error : undefined};
  var convert   = zider.convert;
  var base64    = convert.base64;
  var base64url = convert.base64url;
  var normalizeCBFunc = function(value, other) {
    if (!result.error) {
      switch (encode) {
        case 'base64url' : result.value = base64url.encode(value); break;
        case 'base64'    : result.value = base64.encode(value);    break;
        case 'hex'       : result.value = convert.ab2hex(value);   break;
        default          : result.value = value;
      }
    }
    var _args = [result];
    if (other) _args.push(other);
    return cbFnc.apply({}, _args);
  };
  if (poe.then) { // 1. Promise Object [Web Cryptography new spec.]
    poe.then(normalizeCBFunc).catch(function(err) {
      result.error = true; normalizeCBFunc(err);
    });
  } else {        // 2. Event Object [Web Cryptography old spec.] - MSIE11
    poe.oncomplete = function(e) {normalizeCBFunc(e.target.result, e);};
    poe.onerror    = function(e) {
      result.error = true;
      normalizeCBFunc(e.target.result, e);
    };
  };
};
// ### RSA Exec
zider.RSA = function(neutralKey, method, signature, data, func, encode) {
  var exeDict = zider.dictionary(neutralKey.v, method, 'exec');
  zider.key.load(neutralKey, method, function(key){
    if (method == "verify") {
      zider.fnCb(_ZTL.verify(
        {name: exeDict.name, hash: exeDict.hash},
        key, signature, data
      ), function(r){func(r)}, encode);
    } else {
      zider.fnCb(_ZTL[method](
        {name: exeDict.name, hash: exeDict.hash},
        key, signature // signature -> func, func -> encode
      ), function(r){data(r)}, func);
    };
  });
};
// ### AES Exec
zider.AES = function(method, password, vector, data, func, encode){
  var UTF8      = zider.convert.UTF8.encode;
  var base64url = zider.convert.base64url.decode;
  var vector    = (typeof vector == 'string') ? base64url(vector) : vector;
  if (method == 'encrypt') data = (typeof data == 'string') ? UTF8(data) : data;
  else if (method == 'decrypt') data = (typeof data == 'string') ? base64url(data) : data;
  if (typeof password == 'string') {
    var _password = zider.convert.mergedAb(vector, UTF8(password));
    return zider.hash(_password, function(hashPassword){
      return zider.AES(method, hashPassword, vector, data, func, encode);
    });
  };
  zider.fnCb(
    _ZTL.importKey("raw", password, {name: "AES-CBC"}, false, ["encrypt", "decrypt"]), 
    function(r) {
      zider.fnCb(
        _ZTL[method]({name: "AES-CBC", iv: vector}, r.value/*key*/, data),
        func, encode
      );
    }
  );
  return this;
};

/* 1. Legacy Crypto Key */
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
  zider.fnCb(_ZTL.generateKey( // #1. KEY GENERATION WITH OPTION
    { name: keyInfo.name, modulusLength: keyInfo.modulusLength,
      publicExponent: keyInfo.publicExponent,
      hash: {name: keyInfo.hash} // On IE11, not necessary here but to sign to veryify later. 
    }, true, keyInfo.usage
    ), function(r) { // #2. KEY EXPORTING, EXTRACT ONLY PRIVATE KEY TO NEUTRALIZE.
      zider.fnCb(_ZTL.exportKey("jwk", r.value.privateKey), 
        function(r) {
          // ArrayBuffer type : MSIE11, MOBILE BROWSERS / EXCEPT DESKTOP MODERNS
          var jwk = (window.CryptoKey) ? r.value : JSON.parse(zider.convert.ab2str(r.value, true));
          func(zider.key.neutralize(jwk, version));
        }
      );
    }
  );
};
// CONVERT KEY METHOD SIGN, VERIFY, ENCRYPT, DECRYPT FROM RSA INFO;
// BUILD PROTOTYPE KEY
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
  zider.fnCb(_ZTL.importKey(
    "jwk", keyJWK, {name: exeDict.name, hash: {name: exeDict.hash}},
    false, exeDict.usage
  ),
  function(r) { // GET Real Key Object (r.value)
    func(r.value, keyJWK);
  });
};

/* RSA SIGN/VERIFY */
zider.sign = function(pseudoKey, data, func, encode) {
  zider.RSA(pseudoKey, 'sign', data, function(r) {
    func(r.value);
  }, encode);
};
zider.verify = function(pseudoKey, signature, source, func) {
  zider.RSA(pseudoKey, 'verify', signature, source, function(r) {
    func(r.value);
  });
};
// RSA ENCRYPT/DECRYPT
zider.RSAEncrypt = function(pseudoKey, data, func, encode) {
  zider.RSA(pseudoKey, 'encrypt', data, function(r) {
    func(r.value);
  }, encode);
};
zider.RSADecrypt = function(pseudoKey, data, func, encode) {
  zider.RSA(pseudoKey, 'decrypt', data, function(r) {
    func(r.value);
  }, encode);
};
/* HASH */
zider.hash = function(data, func, algo, encode) {
  zider.fnCb(
    _ZTL.digest(algo || "SHA-256", data),
    function(r) {func(r.value)}, encode
  );
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
    result.data = r.value;
    func(result);
  }, encode || 'base64url');
};
zider.decrypt = function(data, vector, password, func, encode) {
  zider.AES('decrypt', password, vector, data, function(r) {
    func(r.value);
  }, encode);
};