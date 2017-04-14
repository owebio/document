/* 
  ZIDER MINI CERTIFICATION V1
  2017-04-12, ONEIREOI@OWEB
*/

zider = window.zider || {};
zider.certification = {};

var convert   = zider.convert;
var UTF8      = convert.UTF8;
var base64url = convert.base64url;

zider.certification.create = function(password, name, func, version) {
  var password = password || "zider.io";
  var _______  = undefined;
  var convert  = zider.convert;
  var version  = version || 'v1';
  var cert = { 
    version : version,
    name    : name    || '',
    time    : 1*(new Date()),
    hid     : _______,  // zider.hash(zider.sign(n), hex);
    nid     : _______,  //
    /* <-- protected */
    data    : {
      d  : _______, dp : _______, dq : _______,
      p  : _______, q  : _______, qi : _______,
      n  : _______, v  : version
    },
    _encrypt : {
      data   : _______,
      vector : _______
    },
    /* protected --> */
    signature : _______
  };
  zider.key.generate(function(key){
    cert.data = key;
    cert.nid  = key.n;
    // 1. sign 
    zider.RSA.sign(cert.data, base64url.decode(cert.nid), function(signed){
      cert.signature = base64url.encode(signed);
      // 2. hash
      zider.hash(signed, function(hid){
        cert.hid = hid;
        // 3. encrypt
        var _data = convert.str2ab(JSON.stringify(cert.data), true);
        zider.encrypt(_data, password, function(encrypted){
          cert._encrypt = encrypted;
          // 4. build certification
          var ziderCertification = new _ziderCertification(cert);
          if (func) func(ziderCertification);
        }, 'base64url');
      }, '', 'hex');
    });
  }, version);
};
zider.certification.shareLink = function(cert, html, className) {
  var url = 'https://www.zider.io/?method=sharelink';
  url += '&name=' + cert.name + '&hid=' + cert.hid;
  url += '&nid=' + cert.nid + '&signature=' + cert.signature;
  if (html) {
    var element = document.createElement("a");
    element.href = url;
    element.innerHTML = '⚷ zider : ' + cert.name;
    element.title     = '⚷ zider : ' + cert.name;
    element.className = 'zider zider_sharelink' + ((className) ? ' ' + className : '');
    element.setAttribute('data-hid', cert.hid);
    element.setAttribute('data-nid', cert.nid);
    element.setAttribute('data-signature', cert.signature);
    return element;
  };
  return url;
};
zider.certification.sign    = function(cert, method, type, msg, func, receiver) {
  var randomSeed = zider.seed(16);
  var itemForSigning = {
    version  : cert.v || 'v1',
    method   : method || 'message', // login | message
    type     : type   || 'text',    // text  | json | data 
    message  : msg,                 
    signer   : cert.n,
    date     : 1*(new Date()),
    seed     : base64url.encode(randomSeed)
  };
 if (receiver) itemForSigning.receiver = receiver; // [{nid:nid, hid: hid}]
  switch ((msg).constructor) {
    case String : itemForSigning.type = "text"; break;
    case Object : itemForSigning.type = "json"; break;
    default     : 
      itemForSigning.type    = "data";
      itemForSigning.message = base64url.encode(msg);
  };
  var source = UTF8.encode(JSON.stringify(itemForSigning));
  zider.hash(source, function(hash){
    zider.RSA.sign(cert, hash, function(_signature){
      var signature = {
        source    : base64url.encode(source),
        signature : _signature
      };
      func(signature);
    }, 'base64url');
  });
  return this;
};
zider.certification.verify  = function(signature, source, func) {
  var source     = base64url.decode(source);
  var parsed     = JSON.parse(UTF8.decode(source));
  var pseudoCert = {n : parsed.signer, v: parsed.version};
  var signature  = base64url.decode(signature);
  zider.hash(source, function(hash){
    zider.RSA.verify(pseudoCert, signature, hash, function(validation){
      func(validation, parsed);
    });
  });
};
zider.certification.encrypt = function(cert, data, func) {
  var source = {
    type    : undefined,     // text  | object | raw 
    data    : data                  // [{nid:nid, hid: hid}]
  };
  var password = zider.seed(32);
  if (data.buffer) {
    source.type = "raw";
    source.data = zider.convert.base64url.encode(data);
  } else if (typeof data == "string") source.type = "text";
  else if (typeof data == "object") source.type = "object";
  var source = JSON.stringify(source);
  var cbFunc = function(result) {
    func(JSON.stringify(result));
  };
  var result = {
    data   : undefined,
    vector : undefined,
    key    : undefined
  }
  zider.RSA.encrypt(cert, password, function(value){
    result.key = value;
    if (result.vector) cbFunc(result);
  }, 'base64url');
  zider.encrypt(zider.convert.UTF8.encode(source), password, function(e){
    result.vector = e.vector;
    result.data   = e.data;
    if (result.key) cbFunc(result);
  }, 'base64url');
};
zider.certification.decrypt = function(cert, source, func) {
  var source = (typeof source == 'string') ? JSON.parse(source) : source;
  var vector = zider.convert.base64url.decode(source.vector);
  var data   = zider.convert.base64url.decode(source.data);
  var key    = zider.convert.base64url.decode(source.key);
  zider.RSA.decrypt(cert, key, function(_KEY){
    zider.decrypt(data, vector, _KEY, function(original){
      func(JSON.parse(zider.convert.UTF8.decode(original)));
    })
  });
};

/*

  INSTANCE OF ZIDERCERTIFICATION ^___^;/b 

*/

var _ziderCertification = function(cert) {
  var _self     = this;
  var innerVars = {
    data    : cert.data,
    encrypt : cert._encrypt
  };
  var type      = (innerVars && (innerVars.data || innerVars.encrypt)) ? "owner" : "shared";
  var isLocked  = false;
  ('version,name,time,hid,nid,signature').split(',').forEach(function(e){
    _self[e] = cert[e];
  });
  temp = this;
  this.getData = function() {
    return innerVars.data;
  };
  this.getEncryption = function() {
    return innerVars.encrypt;
  };
  Object.defineProperty(this, "isLocked", 
    { get: function () { return isLocked}}
  );
  Object.defineProperty(this, "type", 
    { get: function () { return type}}
  );
  this.lock     = function() {
    if (isLocked) return this;
    delete innerVars.data;
    isLocked = true;
  };
  this.unlock  = function(password, func) {
    var data   = innerVars.encrypt.data;
    var vector = innerVars.encrypt.vector;
    zider.decrypt(data, vector, password, function(data){
      innerVars.data = JSON.parse(convert.ab2str(data, true));
      isLocked = false;
    }, "base64url");
  };
  this.password = function(newPassword, oldPassword) {
  };
  /* TRIM UNNECESSARY THINGS IN THE CONTEXT ANY MORE */
  argument = [];
  cert = undefined;
  return this;
};
_ziderCertification.fn = _ziderCertification.prototype;
_ziderCertification.fn.sign   = function(method, type, msg, func, receiver) {
  zider.certification.sign(this.getData(), method, type, msg, func, receiver);
  return this;
};
_ziderCertification.fn.verify = function(signature, source, func) {
  zider.certification.verify(signature, source, func);
  return this;
};
_ziderCertification.fn.encrypt = function(data, func) {
  return zider.certification.encrypt(this.getData(), data, func);
};
_ziderCertification.fn.decrypt = function(data, func) {
  return zider.certification.decrypt(this.getData(), data, func);
};