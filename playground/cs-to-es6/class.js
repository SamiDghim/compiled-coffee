/*
// FROM
class Foo
    a: 1
    b = 2
    @c: 3
 */
var Foo, Bar;

Foo = (function() {
  var b;

  function Foo() { alert('aaa')}

  Foo.prototype.a = 1;

  b = 2;

  Foo.c = 3;

  return Foo;

})();
