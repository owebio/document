/* ZIDER UTIL for CONVERSION */
zider = window.zider || {};
zider.convert = {}
zider.convert.str2ab = function(string, bit8) {
  var buffer = new ArrayBuffer(string.length*((bit8) ? 1:2));
  var UintView = (bit8) ? new Uint8Array(buffer) : new Uint16Array(buffer);
  for (var i = 0; i < UintView.length; i++) {
    UintView[i] = string.charCodeAt(i);
  }
  return UintView;
};
zider.convert.ab2str = function(buf, bit8) {
  return String.fromCharCode.apply(null, (bit8) ? new Uint8Array(buf) : new Uint16Array(buf));
};
zider.convert.ab2hex = function(buf, sep) {
  var r = '';
  var UintView = new Uint8Array(buf);
  for (var i = 0; i < UintView.length; i++) {
    r += ((i!=0 && sep) ? sep : '') + ("0" + (UintView[i]).toString(16)).slice(-2);
  };
  return r;
};
zider.convert.mergedAb = function(a, b) {
  var result = new Int8Array(a.length + b.length);
  result.set(a);
  result.set(b, a.length);
  return result;
};
zider.convert.hex2ab = function(hex) {
  var hex = Array.isArray(hex) ? hex : hex.toLowerCase().match(/[0-9a-f]{2}/g);
  var UintView = new Uint8Array(new ArrayBuffer(hex.length));
  for (var i = 0; i < UintView.length; i++) {
    UintView[i] = parseInt(hex[i], 16);
  }
  return UintView;
};
zider.convert.UTF8 = {
  encode : function(str) {
    if (window.TextEncoder) return (new TextEncoder("utf-8")).encode(str);
    return zider.convert.str2ab(unescape(encodeURIComponent(str)), true);
  },
  decode : function(data) {
    if (window.TextDecoder) return (new TextDecoder("utf-8")).decode(data);
    return decodeURIComponent(escape(zider.convert.ab2str(data, true)));
  }
};
zider.convert.base64 = {
  encode : function(data) {
    return window.btoa(zider.convert.ab2str(data, true));
  },
  decode : function(str) {
    return zider.convert.str2ab(window.atob(str), true);
  }
};
zider.convert.base64url = {
  encode : function(data) {
    var base64 = zider.convert.base64.encode(data)
    return base64.split('=')[0].replace(/\+/g, "-").replace(/\//g, "_");
  },
  decode : function(str) {
    var str = str.replace(/\-/g, "+").replace(/_/g, "/");
    switch (str.length % 4) {
      case 0: str;break;
      case 2: str += "==";break;
      case 3: str += "=";break;
      default: throw "Illegal base64url string!";
    };
    return zider.convert.base64.decode(str);
  }
};