/* 
  MINIMAL DOM $
  oneiroi 2017-04-09
*/
/* 
  OBJECT HELPER $$
  oneiroi 2017-04-16
*/
/* 
  ZIDER UTIL for CONVERSION
  2017-04-15 oneiroi

  ## zider encoding principle 
  1. Object -> Buffer : Object -> JSON -> UTF8(encode) -> Buffer
  2. Buffer -> Object : Buffer -> UTF8(decode) -> JSON -> OBJECT

  ## Basic Text Charset : UTF-8
  ## Basic Data/buffer String  : base64url

*/

var $ = function(s, b) {
  (s === undefined) && min$;
  if (s.min$) return s;
  if (s.tagName) {
    var id = "tp_"+((new Date())*1);
    s.setAttribute(id, true);
    return $('['+id+']').attr(id, '');
  }
  if (typeof s == 'string' && arguments.length == 1) {
    return document.querySelectorAll(s);
  }
  if (typeof s == 'object') {
    return $$.apply(undefined, Array.prototype.slice.call(arguments));
  }
  //if (typeof s == 'function') {return s.bind(b)}
  return $$.apply(undefined, Array.prototype.slice.call(arguments));
};

$.fn = NodeList.prototype;
$.fn.min$ = "ver 0.0.1a";
$.fn.each = function(cbFunc, arg) {
  if ($.fn.forEach) $.fn.forEach.call(this, cbFunc, arg);
  else Array.prototype.forEach.call(this, cbFunc);
  return this;
};
$.fn.some = function(cbFunc) {
  return Array.prototype.some.call(this, cbFunc);
};
$.fn.get = function(index) { 
  return this.item(index);
};
$.fn.is = function(elem) {return this.item(0) == $(elem).item(0);};
$.fn.indexOf = function(elem) {
  return Array.prototype.indexOf.call(this, $(elem).item(0));
};
$.fn.eq = function(index) {return $(this.item(index));};
$.fn.parent = function()  {return $(this.item(0).parentElement);};
$.fn.children = function(sel) {
  var id = 'tp_'+((new Date())*1);
  this.item(0).setAttribute(id, true);
  var elem = $('['+id+'] > ' + (sel||'*'));
  this.item(0).removeAttribute(id);
  return elem;
};
$.fn.except = function(elem) {
  var _self = this;
  var id = 'tp_'+((new Date())*1);
  var elem = $(elem);
  this.each(function(e, i){
    if (!elem.some(function(_e, i){return _e == e})) {
      e.setAttribute(id, true);
    }
  });
  return $('['+id+']').attr(id, '');
};
$.fn.range = function(startIndes, lastIndex) {
  var id = 'tp_'+((new Date())*1);
  for (var i=startIndes; i < lastIndex + 1; i++) {
    var elem = this.item(i);
    if (elem) elem.setAttribute(id, true);
  }
  var elem = $('['+id+']');
  return elem.attr(id, '');
};
$.fn.attr = function(attr, value) {
  if (value!==undefined) return this.each(function(e){e.setAttribute(attr,value)});
  else if (value=='') return this.each(function(e){e.removeAttribute(attr)});
  return this.item(0).getAttribute(attr);
}
$.fn.on  = function(type, func) {
  this.each(function(e){
    e.addEventListener(type, func);
  });
  return this;
};
$.fn.off = function(type, func) {
  this.each(function(e){
    e.removeEventListener(type, func);
  });
  return this;
};
$.fn.addClass = function(className) {
  this.each(function(e){
    if (!$(e).hasClass(className)) {
      if (e.className) {
        e.className = (e.className).split(' ').push(className).join(' ');
      } else e.className += ' ' + className;
    }
  });
  return this;
};
$.fn.toggleClass = function(className) {
  this.each(function(e){
   var _self = $(e);
   if (_self.hasClass(className)) _self.removeClass(className);
   else _self.addClass(className);
  });
  return this;
};
$.fn.hasClass = function(className) {
  return (this.item(0).className.split(' ').indexOf(className) == -1) ? false : true;
};
$.fn.hasNotClass = function(className) {
  return !(this.hasClass(className));
};
$.fn.removeClass = function(className) {
  this.each(function(e){
   e.className = e.className.replace(className, '').replace(' ', '');
  });
  return this;
};
$.fn.find = function(sel) {
  return this.item(0).querySelectAll(sel);
};
$.fn.html   = function(html) {
  if (html === undefined) return this.item(0).innerHTML;
  else this.each(function(e){ e.innerHTML = html});
  return this;
};
$.fn.val  = function(val) {
  var value = this.item(0).value ;
  if (val !== undefined) this.item(0).value = val;
  else return value;
  return this;
};
$.fn.click = function(fn) {
  if (fn) return this.on('click', fn);
  return this.each(function(e){ e.click && e.click() });
};
$.fn.remove = function() {
  this.each(function(e){
    e.parentNode.removeChild(e);
  });
  return this;
};

/* OBJECT HELPER $$ */
var $$ = function (o, b, j, e, c, t) {
  if (!b) return o;
  var L = arguments.length;
  if (typeof o == 'string') {
    var p = {}, s = j.split(',');
     o.split(',').forEach(function(e, n) {p[e] = b[s[n]]});
    var o = {}, b = p, j = undefined;
  }
  var e = (typeof e == 'function') ?  e(o) : e;
  if (L > 3 && !e) return $$({}, [o, c, t]);
  if (L == 2 && typeof o == "object" && typeof b == "string") {
    return $({}, o, b);
  }
  switch (typeof j) {
    case 'string'   : var i = j.split(','); break;
    case 'object'   : var i = j; break;
    default         : var i = Object.getOwnPropertyNames(b);
  }
  switch (typeof b) {
    case 'function' : 
      i.forEach(function(z) {
        var v = b(z, o); return v && (o[z] = v)
      }); break;
    case 'string'   :
      b = b.split(',');
      i.forEach(function(z, n) {
        o[b[n]] = z;
      }); break;
    default         : i.forEach(function(z) {o[z] = b[z]});
  }
  return o;
};
var zider = window.zider || {};
var convert = zider.convert = {}
convert.str2ab = function(string, bit8) { //UCS2, UTF16
  var buffer = new ArrayBuffer(string.length*((bit8) ? 1:2));
  var UintView = (bit8) ? new Uint8Array(buffer) : new Uint16Array(buffer);
  for (var i = 0; i < UintView.length; i++) {
    UintView[i] = string.charCodeAt(i);
  }
  return UintView;
};
convert.ab2str = function(buf, bit8) { //UCS2, UTF16
  return String.fromCharCode.apply(null, (bit8) ? new Uint8Array(buf) : new Uint16Array(buf));
};
convert.ab2hex = function(buf, sep) {
  var r = '';
  var UintView = new Uint8Array(buf);
  for (var i = 0; i < UintView.length; i++) {
    r += ((i!=0 && sep) ? sep : '') + ("0" + (UintView[i]).toString(16)).slice(-2);
  };
  return r;
};
convert.mergedAb = function(a, b) {
  var result = new Int8Array(a.length + b.length);
  result.set(a);
  result.set(b, a.length);
  return result;
};
convert.hex2ab = function(hex) {
  var hex = Array.isArray(hex) ? hex : hex.toLowerCase().match(/[0-9a-f]{2}/g);
  var UintView = new Uint8Array(new ArrayBuffer(hex.length));
  for (var i = 0; i < UintView.length; i++) {
    UintView[i] = parseInt(hex[i], 16);
  }
  return UintView;
};
convert.UTF8 = {
  encode : function(str) {
    if (window.TextEncoder) return (new TextEncoder("utf-8")).encode(str);
    return zider.convert.str2ab(unescape(encodeURIComponent(str)), true);
  },
  decode : function(data) {
    if (window.TextDecoder) return (new TextDecoder("utf-8")).decode(data);
    return decodeURIComponent(escape(zider.convert.ab2str(data, true)));
  }
};
convert.base64 = {
  encode : function(data) {
    return window.btoa(zider.convert.ab2str(data, true));
  },
  decode : function(str) {
    return zider.convert.str2ab(window.atob(str), true);
  }
};
convert.base64url = {
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
zider.encode = function(type, source) {
  try {
    switch (type) {
      case 'ab2str'    : return zider.convert.ab2str(source, true);
      case 'ab2str16'  : return zider.convert.ab2str(source);
      case 'ab2hex'    : return zider.convert.ab2hex(source);
      case 'str2ab'    : return zider.convert.str2ab(source, true);
      case 'json'      : return JSON.stringify(source); // string -> JSON
      case 'utf8'      : return zider.convert.UTF8.encode(source);
      case 'base64url' : return zider.convert.base64url.encode(source);
      case 'base64'    : return zider.convert.base64url.encode(source);
      default          : return source;
    }
  } catch (e) {console.log("zider.io : encode error : type " + type, source)};
}
zider.decode = function(type, source) {
  try {
    switch (type) {
      case 'ab2str'    : return zider.convert.ab2str(source, true);
      case 'ab2str16'  : return zider.convert.ab2str(source);
      case 'ab2hex'    : return zider.convert.ab2hex(source);
      case 'utf8'      : return zider.convert.UTF8.decode(source);
      case 'json'      : return JSON.parse(source); // JSON -> object
      case 'base64url' : return zider.convert.base64url.decode(source);
      case 'base64'    : return zider.convert.base64url.decode(source);
      default          : return source;
    }
  } catch (e) {console.log("zider.io : decode error : type " + type, source)};
}

Object.prototype.JSON = function() { return (this.Z == "O") && JSON.stringify(this) || undefined};
Object.prototype.UTF8 = function() {return (this.JSON) && zider.convert.UTF8.encode(this.JSON()) || undefined};
String.prototype.base64url = function() {return zider.convert.base64url.decode(this)};
String.prototype.UTF8 = function() {return zider.convert.UTF8.encode(this)};
String.prototype.JSON = function() {return JSON.parse(this)};
String.base64url = function(s) {return zider.convert.base64url.encode(s)};
String.UTF8 = function(s) {return zider.convert.UTF8.decode(s)};
String.JSON = function(s) {return JSON.stringify(s)};

[Uint8Array, Uint16Array, ArrayBuffer].forEach(function(e){
  e.prototype.JSON      = function(){return JSON.parse(String.UTF8(this.buffer || this))};
  e.prototype.base64url = function(){return zider.convert.base64url.encode(this.buffer || this)};
  e.prototype.hex       = function(){return zider.convert.ab2hex(this.buffer || this)};
  e.prototype.UTF8      = function(){return zider.convert.UTF8.decode(this.buffer || this)};
});


// EXTENDING PROTOTYPE OF LEGACY OBJECT
// SETTING TYPE INFO OF EACH OBJECT

// 제일 많은 패턴
// 해당 값과 자신이 일치하면 

(function() { // attaching type tag
var OBJECT_TYPE = {
  ID     : [],
  SOURCE : []
};
(   'O:Object,A:Array,S:String,F:Function,N:Number,M:Math,D:Date,R:RegExp,B:Boolean,' //ECMA Basic
  + 'c:Int8Array,c:Int16Array,c:Uint8Array,c:Uint16Array,c:Uint16Array,c:Float32Array,c:Float64Array,'
  + 'b:ArrayBuffer,'
  + 'E:HTMLElement,N:Node,W:Window'
  + 'P:Promise' 
  // Set,WeakSet,Map,WeakMap,Generator,Proxy,Intl
).split(',').forEach(function(e) {
  var R = e.split(":"), t = R[0], T = R[1];
  if (window[T]) {
    if (window[T].prototype) window[T].prototype.Z = t; 
    OBJECT_TYPE.ID.push(t); 
    OBJECT_TYPE.SOURCE.push(window[T]);
  }
});
_TYPE = function(t) {
  if (t === null) return "0";
  if (t === undefined) return "U";
  if (t.Z) return t.Z;
};

// $ IS 일치여부   (TYPE 검사, 정규표현식, 최종적으로 값의 일치 여부)
// _ HAS 존재여부  (모두 같음, 최종적으로 값의 설정 유무)
// 해당 타입이며, A 결과를 반환하가니 실행. 아니면 B의 결과를 반환하거나 실행. B가 없으면 자신을 반환.
// 해당 내용과 자신이 일치하면, A의 결과를 반환 (문자, 숫자)
// 해당 내용이 설정되면 A의 결과를 반환

var _PROTO = Object.prototype;
_PROTO.$ =_PROTO.IS = function(IF, TRUE, FALSE, BIND) { // 일치여부냐 존재유무냐.
  var S = this, T = this.Z, OIF = IF;
  var IF = (_TYPE(IF) == "F") ? IF() : IF ; //IF FUNC, RUN;
  if (T == "S" && _TYPE(IF) == "R") {
    IF = IF.test(S) ? true : false;
  }
  if (IF !== true && IF !== false) {
    if (_TYPE(IF) == "S" && IF.length == 1 && /[A-Z]/.test(IF)) {
      IF = (IF == T ) ? true : false;
    } else IF = (IF == S) ? !0 : !1;    
  }
  var EXE = function(X) {
    if (T == "F" && _TYPE(X) == "A") return S.apply(BIND, X); //IF BINDING FUNC
    return (X && X.Z == "F") ? X(S) : X ; // IF FUNC OR NOT
  }
  switch (arguments.length) {
    case 0 : return T;
    case 1 : return IF ? !0 : !1;
    case 2 : return IF ? EXE(TRUE) : S ;
    case 3 : return IF ? EXE(TRUE) : EXE(FALSE);
    case 4 : return IF ? EXE(TRUE) : EXE(FALSE);
  }
};
_PROTO._ =_PROTO.HAS = function(IF, TRUE, FALSE, BIND) {
  var T = _TYPE(this), S = this;
  var IF = (_TYPE(IF) == "F") ? IF() : IF ; //IF FUNC, RUN;
  if (T == "S" && _TYPE(IF) == "R") IF = IF.test(S) ? true : false;
  if (IF !== true && IF !== false) {
    if (_TYPE(IF) == "S" && IF.length == 1 && /[A-Z]/.test(IF)) {
      IF = (IF == T ) ? true : false;
    } else IF = IF ? !0 : !1;
  }
  var EXE = function(X) {
    if (T == "F" && _TYPE(X) == "A") return S.apply(BIND, X); //IF BINDING FUNC
    return (_TYPE(X) == "F") ? X() : X ; // IF FUNC OR NOT
  }
  switch (arguments.length) {
    case 0 : return !!IF;
    case 1 : return IF ? !0 : !1;
    case 2 : return IF ? EXE(TRUE) : S ;
    case 3 : return IF ? EXE(TRUE) : EXE(FALSE);
    case 4 : return IF ? EXE(TRUE) : EXE(FALSE);
  }
};
_PROTO.__ = function () {
  var S = this;
  return Array.prototype.slice.call(arguments).some(function(e) {
    var r = e;
    if (e.Z == "F") r = e();
    if (S.Z == "S" && r.Z == "R") return r.test(S);
    return r == S;
  });
};
})();
