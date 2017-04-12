/* 
  MINIMAL DOM $
  oneiroi 2017-04-09
*/
(function(){
var $ = function(selector) {
  if (selector.min$) return selector;
  if (selector.tagName) {
    var id = "tp_"+((new Date())*1);
    selector.setAttribute(id, true);
    var elem = $('['+id+']');
    selector.removeAttribute(id);
    return elem;
  }
  var item = document.querySelectorAll(selector);
  return item;
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
$.fn.is = function(elem) {
  return this.item(0) == $(elem).item(0);
};
$.fn.indexOf = function(elem) {
  return Array.prototype.indexOf.call(this, $(elem).item(0));
};
$.fn.eq = function(index) {
  return $(this.item(index));
};
$.fn.parent = function() {
  return $(this.item(0).parentElement);
};
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
$.fn.val  = function() {
  var value = this.item(0).value ;
  if (value != undefined) return value;
};
$.fn.click = function(fn) {
  if (fn) return this.on('click', fn);
  return this.each(function(e){ e.click && e.click() });
};

window.$ = $;
})();