// Generated by CoffeeScript 1.3.3
(function() {
  var Builder, Commands, EventEmitter, async, fs, go, path, spawn, suspend, writestreamp,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Commands = require('./commands');

  suspend = require('suspend');

  go = suspend.resume;

  spawn = require('child_process').spawn;

  async = require('async');

  fs = require('fs');

  writestreamp = require('writestreamp');

  path = require('path');

  EventEmitter = require('events').EventEmitter;

  require('sugar');

  Builder = (function(_super) {

    __extends(Builder, _super);

    Builder.prototype.clock = 0;

    Builder.prototype.build_dirs_created = false;

    Builder.prototype.source_dir = null;

    Builder.prototype.output_dir = null;

    Builder.prototype.sep = path.sep;

    function Builder(files, source_dir, output_dir, pack) {
      this.files = files;
      this.pack = pack != null ? pack : false;
      Builder.__super__.constructor.apply(this, arguments);
      this.output_dir = path.resolve(output_dir);
      this.source_dir = path.resolve(source_dir);
      this.coffee_suffix = /\.coffee$/;
    }

    Builder.prototype.prepareDirs = suspend.async(function*() {
      var dirs,
        _this = this;
      if (this.build_dirs_created) {
        return;
      }
      dirs = ['cs2ts', 'dist', 'typed', 'dist-pkg'];
      yield async.each(dirs, suspend.async(function*(dir) {
        var dir_path, exists;
        dir_path = _this.output_dir + _this.sep + dir;
        exists = yield fs.exists(dir_path, suspend.resumeRaw());
        if (!exists[0]) {
          return yield fs.mkdir(dir_path, go());
        }
      }), go());
      return this.build_dirs_created = true;
    });

    Builder.prototype.build = suspend.async(function*() {
      var cmd, module_name, tick,
        _this = this;
      tick = ++this.clock;
      yield this.prepareDirs(go());
      cmd = Commands.cs2ts(this.output_dir, this.source_dir);
      this.proc = spawn("" + __dirname + "/../../" + cmd[0], cmd.slice(1), {
        cwd: this.source_dir
      });
      this.proc.on('error', console.log);
      this.proc.stderr.setEncoding('utf8');
      this.proc.stderr.on('data', function(err) {
        return console.log(err);
      });
      yield this.proc.on('close', go());
      if (this.clock !== tick) {
        return this.emit('aborted');
      }
      yield async.map(this.files, this.copyDefinitionFiles.bind(this), go());
      if (this.clock !== tick) {
        return this.emit('aborted');
      }
      this.proc = spawn("" + __dirname + "/../../bin/dts-merger", ['--output', "../typed"].include(this.tsFiles()), {
        cwd: "" + this.output_dir + "/cs2ts/"
      });
      this.proc.on('error', console.log);
      this.proc.stderr.setEncoding('utf8');
      this.proc.stderr.on('data', function(err) {
        return console.log(err);
      });
      yield this.proc.on('close', go());
      if (this.clock !== tick) {
        return this.emit('aborted');
      }
      this.proc = spawn("" + __dirname + "/../../bin/commonjs-to-typescript", ['--output', "../dist"].include(this.tsFiles()), {
        cwd: "" + this.output_dir + "/typed/"
      });
      this.proc.on('error', console.log);
      this.proc.stderr.setEncoding('utf8');
      this.proc.stderr.on('data', function(err) {
        return console.log(err);
      });
      yield this.proc.on('close', go());
      if (this.clock !== tick) {
        return this.emit('aborted');
      }
      this.proc = spawn("" + __dirname + "/../../node_modules/typescript/bin/tsc", ["" + __dirname + "/../../d.ts/ecma.d.ts", "--module", "commonjs", "--declaration", "--noLib"].include(this.tsFiles()), {
        cwd: "" + this.output_dir + "/dist/"
      });
      this.proc.stderr.setEncoding('utf8');
      this.proc.stderr.on('data', function(err) {
        var remove;
        remove = "" + _this.output_dir + _this.sep + "dist";
        while (~err.indexOf(remove)) {
          err = err.replace(remove, '');
        }
        return process.stdout.write(err);
      });
      yield this.proc.on('close', go());
      if (this.clock !== tick) {
        return this.emit('aborted');
      }
      if (this.pack) {
        module_name = (this.pack.split(':')).slice(-1);
        this.proc = spawn("" + __dirname + "/../../node_modules/browserify/bin/cmd.js", ["-r", "./" + this.pack, "--no-builtins", "-o", "" + this.output_dir + "/dist-pkg/" + module_name + ".js"], {
          cwd: "" + this.output_dir + "/dist/"
        });
        this.proc.stderr.setEncoding('utf8');
        this.proc.stderr.on('data', function(err) {
          var remove;
          remove = "" + _this.output_dir + _this.sep + "dist";
          while (~err.indexOf(remove)) {
            err = err.replace(remove, '');
          }
          return process.stdout.write(err);
        });
        yield this.proc.on('close', go());
        if (this.clock !== tick) {
          return this.emit('aborted');
        }
      }
      return this.proc = null;
    });

    Builder.prototype.tsFiles = function() {
      var file, files;
      return files = (function() {
        var _i, _len, _ref, _results;
        _ref = this.files;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          file = _ref[_i];
          _results.push(file.replace(this.coffee_suffix, '.ts'));
        }
        return _results;
      }).call(this);
    };

    Builder.prototype.dtsFiles = function() {
      var file, files;
      return files = (function() {
        var _i, _len, _ref, _results;
        _ref = this.files;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          file = _ref[_i];
          _results.push(file.replace(this.coffee_suffix, '.d.ts'));
        }
        return _results;
      }).call(this);
    };

    Builder.prototype.copyDefinitionFiles = function(file, next) {
      var destination, dts_file;
      dts_file = file.replace(this.coffee_suffix, '.d.ts');
      if (!fs.existsSync(this.source_dir + this.sep + dts_file)) {
        return next();
      }
      destination = writestreamp("" + this.output_dir + "/cs2ts/" + dts_file);
      destination.on('close', next);
      return (fs.createReadStream(this.source_dir + this.sep + dts_file)).pipe(destination);
    };

    Builder.prototype.close = function() {
      var _ref;
      return (_ref = this.proc) != null ? _ref.kill() : void 0;
    };

    Builder.prototype.clean = function() {
      throw new Error('not implemented');
    };

    Builder.prototype.reload = function() {
      var _ref;
      console.log('-'.repeat(20));
      if ((_ref = this.proc) != null) {
        _ref.kill();
      }
      return this.build(function() {
        return console.log("Compilation completed");
      });
    };

    Builder.prototype.watch = function() {
      var file, node, _i, _j, _len, _len1, _ref, _ref1;
      _ref = this.files;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        file = _ref[_i];
        node = this.source_dir + this.sep + file;
        fs.watchFile(node, {
          persistent: true,
          interval: 500
        }, this.reload.bind(this));
      }
      _ref1 = this.dtsFiles();
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        file = _ref1[_j];
        node = this.source_dir + this.sep + file;
        if (!fs.existsSync(node)) {
          continue;
        }
        fs.watchFile(node, {
          persistent: true,
          interval: 500
        }, this.reload.bind(this));
      }
      return this.build(function() {
        return console.log("Compilation completed");
      });
    };

    return Builder;

  })(EventEmitter);

  module.exports = Builder;

}).call(this);
