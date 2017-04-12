

var zider = {};
var _Crypto = window.crypto || window.msCrypto || window.webitCrypto;
var _ZTL    = _Crypto.subtle || _Crypto.webkitSubtle; //webkitSubtle : mobile;
var JWKTYPE = undefined; // 'jsonbuffer' || 'jsonobject';  
/* Legacy Crypto Key */
zider.key = {};
zider.key.jwkToNeutral = function(jwk) {
  return {
    d : jwk.d, dp : jwk.dp, dq : jwk.dq,
    p : jwk.p, q  : jwk.q,  qi : jwk.qi,
    n : jwk.n
  }
};
zider.key.generate = function(func/*, ver*/) {
  var cbFuncGetKey = function(_pKey) {
    var privateKey = ((_pKey.target && _pKey.target.result) || _pKey).privateKey;
    var cbFuncKeyNormalize = function(_jwk) {
      var jwk = (_jwk.target && _jwk.target.result) || _jwk;
      jwk = (window.CryptoKey) ? jwk : JSON.parse(zider.convert.ab2str(jwk, true));
      func(zider.key.jwkToNeutral(jwk));
    };
    var getJWK = _ZTL.exportKey("jwk", privateKey);
    if (getJWK.then) getJWK.then(cbFuncKeyNormalize);
    else getJWK.oncomplete = cbFuncKeyNormalize;
  };
  var getKey = _ZTL.generateKey(
    { name: "RSASSA-PKCS1-v1_5", 
      modulusLength: 2048,
      publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
      // IE11, HASH is not necessary but necessary to sign and to verify 
      hash: { name: "SHA-256"} 
    },
    true,
    ["sign", "verify"]
  );
  if (getKey.then) getKey.then(cbFuncGetKey);
  else getKey.oncomplete = cbFuncGetKey;
};
// CONVERT KEY METHOD SIGN, VERIFY, ENCRYPT, DECRYPT FROM RSA INFO;
zider.key.set = function(neutralKey, method) {
  var method = method || 'sign';
  var modifiedKey = {};
  // ★ IE11   - ERROR IF ADDED UNNECESSARY PROPERTIES
  // ★ IE11   PUBLIC  - kty, extractable, n, e (NO MAS NO MENOS)
  // ★ IE11   PRIVATE - d dp dq e extractable kty n p q qi
  // ★ IE11   KEYTYPE - [ARRAYBUFFER! of JSON's STRING};
  // ★ MOBILE KEYTYPE - [ARRAYBUFFER! of JSON's STRING};
  if (document.documentMode != 11) {
    switch (method) {
      case "sign":
        modifiedKey.key_ops = ['sign'];
        modifiedKey.alg = "RS256";
        break;
      case "verify":
        modifiedKey.alg = "RS256";
        modifiedKey.key_ops = ['verify'];
        break;
      case "encrypt":
        modifiedKey.alg = "RSA-OAEP"; // MOBILE compaitibility : RSA-OAEP-256
        modifiedKey.key_ops = ['encrypt'];
        break;
      case "decrypt":
        modifiedKey.alg = "RSA-OAEP";
        modifiedKey.key_ops = ['decrypt'];
        break;
    }
  };
  modifiedKey.kty = "RSA";
  modifiedKey.e   = "AQAB";
  modifiedKey.n   = neutralKey.n;
  if (method == 'sign' || method == 'decrypt') {
    ('d,dp,dq,p,q,qi').split(',').forEach(function(e){
      modifiedKey[e] = neutralKey[e];
    });
  }
  if (window.CryptoKey) {
    modifiedKey.ext = true;
  } else {
    modifiedKey.extractable = true;
    modifiedKey = zider.convert.str2ab(JSON.stringify(modifiedKey), true).buffer;
  }
  return modifiedKey;
};
zider.key.load = function(neutralKey, method, func) {
  var key = zider.key.set(neutralKey, method || 'sign');
  var algo   =  (method == 'sign' || method == 'verify') ? "RSASSA-PKCS1-v1_5" : "RSA-OAEP";
  var hash   =  (algo == "RSA-OAEP") ? "SHA-1" : "SHA-256"; // UNSUPPORTED MOBILE STUFF;
  var cbFunc = function(e){
    var realKey = (e.target && e.target.result) || e;
    func(realKey, key);
  };
  var importKey = _ZTL.importKey(
    "jwk", key, { name: algo, hash: {name: hash}},
    false, [method]
  );
  if (importKey.then) importKey.then(cbFunc);
  else importKey.oncomplete = cbFunc;
};

/* LEGACY SIGN FOR INIT WITH MODIFIED KEY */
zider.sign = function(initCertKey, data, func, encode) {
  var callback = function (e) {
    var result = (e.target && e.target.result) || e;
    switch (encode) {
      case 'base64'    : return func(zider.convert.base64.encode(result));
      case 'base64url' : return func(zider.convert.base64url.encode(result));
      case 'hex'       : return func(zider.convert.ab2hex.encode(result));
    }
    return func(result);
  };
  zider.key.load(initCertKey, 'sign', function(privateKey){
    var sign = _ZTL.sign(
      { 
        name: "RSASSA-PKCS1-v1_5",
        hash: "SHA-256" // ONLY FOR IE11
      },
      privateKey, //from generateKey or importKey above
      data //ArrayBuffer of data you want to sign
    );
    if (sign.then) sign.then(callback);
    else sign.oncomplete = callback;
  })
};
zider.verify = function(initCertKey, signature, source, func) {
  var callback = function (e) {
    if (e.target) return func(e.target.result);
    else return func(e);
  };
  zider.key.load(initCertKey, 'verify', function(publicKey){
    var verify = _ZTL.verify(
      { 
        name: "RSASSA-PKCS1-v1_5",
        hash: "SHA-256" // ONLY FOR IE11
      },
      publicKey, //from generateKey or importKey above
      signature, //ArrayBuffer of the signature
      source //ArrayBuffer of the data
    );
    if (verify.then) verify.then(callback);
    else verify.oncomplete = callback;
  })
};

/* HASH */
zider.hash = function(data, func, algo, encode) {
  // encode = buffer, base64, base64url
  var _callback = function(e) {
    var result = (e.target && e.target.result) || e;
    switch (encode || 'buffer'){
      case 'buffer'    : return func(result);
      case 'hex'       : return func(zider.convert.ab2hex(result));
      case 'base64'    : return func(zider.convert.base64.encode(result));
      case 'base64url' : return func(zider.convert.base64url.encode(result));
    }
  };
  var hash = _ZTL.digest( algo || "SHA-256", data);
  if (hash.then) hash.then(_callback)
  else hash.oncomplete = _callback;
};

/* Symmetric encryption / decryption */
zider.encrypt = function(data, password, func, encode) {
  var vector = zider.seed(16);
  var result = {
    data     : undefined,
    vector   : vector
  };
  var cbEncFunc = function(e) {
    result.data = (e.target && e.target.result) || e;
    switch (encode || '') {
      case 'base64' : 
        result.data   = zider.convert.base64.encode(result.data);
        result.vector = zider.convert.base64.encode(result.vector);
        break;
      case 'base64url' : 
        result.data   = zider.convert.base64url.encode(result.data);
        result.vector = zider.convert.base64url.encode(result.vector);
        break;
    }
    func(result);
  };
  var cbKeyFunc = function(e) {
    var key = (e.target && e.target.result) || e;
    var encrypt = _ZTL.encrypt({name: "AES-CBC", iv: vector}, key, data);
    if (encrypt.then) encrypt.then(cbEncFunc);
    else encrypt.oncomplete = cbEncFunc;
  };  
  //reset password.
  if (typeof password == 'string') {
    var password = zider.convert.mergedAb(vector, zider.convert.UTF8.encode(password));
    zider.hash(password, function(hash){
      var keyImport = _ZTL.importKey("raw", hash, {name: "AES-CBC"}, false, ["encrypt", "decrypt"]);
      if (keyImport.then) keyImport.then(cbKeyFunc);
      else keyImport.oncomplete = cbKeyFunc;
    });
  } else {
    var keyImport = _ZTL.importKey("raw", password, {name: "AES-CBC"}, false, ["encrypt", "decrypt"]);
    if (keyImport.then) keyImport.then(cbKeyFunc);
    else keyImport.oncomplete = cbKeyFunc;
  };  
};
zider.decrypt = function(data, vector, password, func, encode) {
  switch (encode || '') {
    case 'base64' : 
      var vector = zider.convert.base64.decode(vector);
      var data   = zider.convert.base64.decode(data);
      break;
    case 'base64url' : 
      var vector = zider.convert.base64url.decode(vector);
      var data   = zider.convert.base64url.decode(data);
      break;
  };
  var cbDecFunc = function(e) {
    result = (e.target && e.target.result) || e;
    func(result);
  };
  var cbKeyFunc = function(e) {
    var key = (e.target && e.target.result) || e;
    var decrypt = _ZTL.decrypt({name: "AES-CBC", iv: vector}, key, data);
    if (decrypt.then) decrypt.then(cbDecFunc);
    else decrypt.oncomplete = cbDecFunc;
  };  
  if (typeof password == 'string') {  
    var password = zider.convert.mergedAb(vector, zider.convert.UTF8.encode(password));
    zider.hash(password, function(hash){
      var keyImport = _ZTL.importKey("raw", hash, {name: "AES-CBC"}, false, ["encrypt", "decrypt"]);
      if (keyImport.then) keyImport.then(cbKeyFunc);
      else keyImport.oncomplete = cbKeyFunc;
    });
  } else {
    var keyImport = _ZTL.importKey("raw", password, {name: "AES-CBC"}, false, ["encrypt", "decrypt"]);
    if (keyImport.then) keyImport.then(cbKeyFunc);
    else keyImport.oncomplete = cbKeyFunc;
  };
};

// RSA ENCRYPT /DECRYPT
zider.asyEncrypt = function(neutralKey, data, func, encode) {
  var cbFunc = function(e) {
    var result = (e.target && e.target.result) || e;
    switch (encode || 'buffer'){
      case 'buffer'    : return func(result);
      case 'hex'       : return func(zider.convert.ab2hex(result));
      case 'base64'    : return func(zider.convert.base64.encode(result));
      case 'base64url' : return func(zider.convert.base64url.encode(result));
    }
  };
  zider.key.load(neutralKey, 'encrypt', function(publicKey){
    var encrypt = _ZTL.encrypt(
      { 
        name: "RSA-OAEP",
        hash: "SHA-1" // ONLY FOR IE11 && SHA-1 IS FOR MOBILE, CAN NOT BE OVER;
      },
      publicKey,
      data
    );
    if (encrypt.then) encrypt.then(cbFunc).catch(function(e){console.log(e)});
    else encrypt.oncomplete = cbFunc;
  });
};
zider.asyDecrypt = function(neutralKey, data, func) {
  var cbFunc = function(e) {
    var result = (e.target && e.target.result) || e;
    return func(result);
  };
  zider.key.load(neutralKey, 'decrypt', function(publicKey){
    var decrypt = _ZTL.decrypt(
      { 
        name: "RSA-OAEP",
        hash: "SHA-1" // ONLY FOR IE11 && SHA-1 IS FOR MOBILE, CAN NOT BE OVER;
      },
      publicKey,
      data
    );
    if (decrypt.then) decrypt.then(cbFunc);
    else decrypt.oncomplete = cbFunc;
  });
};

// RandomSeed
zider.seed = function(size) {
  return _Crypto.getRandomValues(new Uint8Array(size));
}
