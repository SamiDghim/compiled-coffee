let var = macro {
  rule {
		$($name);
	} => {
    $(var $name)
  }
}

var Foo;

Foo = (function() {
  var b;

  function Foo() {}

  Foo.prototype.a = 1;

  b = 2;

  Foo.c = 3;

  return Foo;

})();