// Generated by CoffeeScript 1.3.3
(function() {
  "Merge default values (found in TS files).\n\nTODO:\nconstructor: (@string_attr, @number_attr) ->";

  var RegExpQuote, fs, merge, mergeFile, _ref;

  fs = require('fs');

  require('sugar');

  if ((_ref = global.log) == null) {
    global.log = function() {};
  }

  mergeFile = function(name) {
    var definition, definition_file, source;
    definition_file = name.replace(/\.ts$/, '.d.ts');
    if (!fs.existsSync(definition_file)) {
      log("No definition d.ts file for '" + name + "'");
      return;
    }
    source = fs.readFileSync(name, 'utf8');
    definition = fs.readFileSync(definition_file, 'utf8');
    return merge(source, definition);
  };

  RegExpQuote = function(str) {
    return (str + '').replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");
  };

  merge = function(source, headers) {
    var INDENT, def, regexp, regexps;
    INDENT = function(tabs) {
      return "(?:^|\\n)(?:\\s{" + (tabs * 2) + "}|\\t{" + tabs + "})";
    };
    regexps = {
      DEFINITION_REF: function() {
        return new RegExp("^///\\s*<reference.*?(/>\\n?)", 'igm');
      },
      CLASS: function(name) {
        if (name == null) {
          name = '[\\w$]+';
        }
        return new RegExp("(?:export\\s+)?class\\s+(" + name + ")([.$<>\\s\\w]+?)\\{((?:\\n|.)+?)(?:\\n\\})", 'ig');
      },
      METHOD: function(indent, name) {
        if (name == null) {
          name = '[\\w$]+';
        }
        indent = INDENT(indent);
        return new RegExp("(" + indent + ")((?:(?:public|private)\\s)?((?:static\\s+)?" + name + ")(?=\\()((?:\\n|[^=])+?))(?:\\s?\\{)", 'ig');
      },
      ATTRIBUTE: function(indent, name) {
        if (name == null) {
          name = '[\\w$]+';
        }
        indent = INDENT(indent);
        return new RegExp("(" + indent + ")((?:(?:public|private)\\s)?((?:static\\s+)?" + name + ")(?=:|=|;|\\s)((?:\\n|[^()])+?))(?:\\s?(=|;))", 'ig');
      },
      METHOD_DEF: function(indent, name) {
        name = RegExpQuote(name);
        indent = INDENT(indent);
        return new RegExp("" + indent + "((?:public|private)?\\s?((?:static\\s+)?" + name + ")(?=\\()(\\n|.)+?)(\\s?;)", 'ig');
      },
      ATTRIBUTE_DEF: function(indent, name) {
        name = RegExpQuote(name);
        indent = INDENT(indent);
        return new RegExp("" + indent + "((?:public|private)?\\s?((?:static\\s+)?" + name + ")(?=:|=|;|\\s)((?:\\n|.)+?))(\\s?;)", 'i');
      },
      INTERFACE_DEF: function(name) {
        if (name == null) {
          name = '[\\w$]+';
        }
        return new RegExp("(^|\\n)(export\\s+)?interface\\s(" + name + ")(?=\\s|\\{)((?:\\n|.)+?)(?:\\n\\})", 'ig');
      }
    };
    regexp = regexps.INTERFACE_DEF();
    while (def = regexp.exec(headers)) {
      source += def[0];
    }
    regexp = regexps.DEFINITION_REF();
    while (def = regexp.exec(headers)) {
      source = def[0] + "\n" + source;
    }
    source = source.replace(regexps.CLASS(), function(match, name, extension, body) {
      var class_def, ret;
      log("Found class '" + name + "'");
      class_def = regexps.CLASS(name).exec(headers);
      if (!class_def) {
        return match;
      }
      log("Found definition for class '" + name + "'");
      ret = "export class " + class_def[1] + class_def[2] + extension + "{" + body + "\n}";
      ret = ret.replace(regexps.METHOD(2), function(match, indent, signature, name) {
        var defs, _i, _len, _ref1;
        log("Found method '" + name + "'");
        defs = [];
        regexp = regexps.METHOD_DEF(1, name);
        while (def = regexp.exec(class_def[3])) {
          defs.push(def);
        }
        if (!defs.length) {
          return match;
        }
        log("Found " + defs.length + " definition(s) for the method '" + name + "'");
        ret = '';
        _ref1 = defs.slice(0, -1);
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          def = _ref1[_i];
          ret += "" + indent + def[1] + ";";
        }
        return "" + ret + indent + (defs.last()[1]) + " {";
      });
      ret = ret.replace(regexps.ATTRIBUTE(2), function(match, indent, signature, name, space, suffix) {
        if (name === 'params') {
          console.log(ret, match);
        }
        log("Found attribute '" + name + "'");
        def = regexps.ATTRIBUTE_DEF(1, name).exec(class_def[3]);
        if (!def) {
          return match;
        }
        log("Found definition for method '" + name + "'");
        return "" + indent + def[1] + " " + suffix;
      });
      return ret;
    });
    return source;
  };

  module.exports = {
    merge: merge,
    mergeFile: mergeFile
  };

}).call(this);
