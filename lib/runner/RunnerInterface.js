var Base = require('../core/Base');
var AssertionHelper = require('./AssertionHelper');
var _ = require('lodash');
var zombie = require('zombie');
var Mocha = require('mocha');
var npath = require('path');
var child = require('child_process');
var Loader = require('../core/Loader');
var createUID = require('../../node_modules/wunderbits.core/public/lib/createUID');

function getRandomInt (min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

var _super = Base.prototype;
var mocha = new Mocha();

var port = getRandomInt(3000, 3999);
var server, _server;

function start () {

  _server = child.spawn('node', [
    'main.js',
    '--port ' + port
  ]);

  _server.stdout.on('data', function (data) {
    if (data.toString().indexOf('[asimov] Started project') >= 0) {
      _.delay(function () {
        server && server.resolve();
      }, 250);
    }
  });
}

module.exports = Base.extend({

  'initialize': function () {

    var self = this;
    _super.initialize.apply(self, arguments);

    var tempPath = self.options.tempPath = npath.join(process.cwd(), 'tests/temp');
    self.filesystem.forceExists(tempPath);

    self.itShould = new AssertionHelper({
      'test': self
    });

    if (!server) {

      server = self.deferred();
      start();
    }
  },

  'writeTempFile': function (path, content) {

    var self = this;

    if (!path || typeof path !== 'string') {
      throw new Error('Cannot write temporary file, invalid path @ ' + path);
    }

    if (!content) {
      throw new Error('Cannot write temporary file, no content provided @ ' + path);
    }

    var tempPath = self.options.tempPath;
    path = npath.join(tempPath, path);

    return self.filesystem.writeFile(path, content);
  },

  'getTempFilename': function () {

    return createUID();
  },

  'removeTempFile': function (path, wait) {

    var self = this;

    if (wait !== false) {
      wait = true;
    }

    if (!path || typeof path !== 'string') {
      throw new Error('Cannot remove temporary file, invalid path @ ' + path);
    }

    var tempPath = self.options.tempPath;
    path = npath.join(tempPath, path);

    if (wait && !self.filesystem.pathExists(path)) {
      return setTimeout(function () {
        self.removeTempFile(path, wait);
      }, 100);
    }

    return self.filesystem.recursiveDelete(path);
  },

  'before': function (callback) {

    return before(callback);
  },

  'beforeEach': function (callback) {

    return beforeEach(callback);
  },

  'after': function (callback) {

    return after(callback);
  },

  'afterEach': function (callback) {

    return afterEach(callback);
  },

  'when': function (name, callback) {

    var self = this;
    return describe('when ' + name, callback);
  },

  'spec': function (name, callback) {

    var self = this;

    if (!process.env.LEGACY_RENDER) {
      name = name.grey.inverse.bold;
    }

    return describe(name, callback);
  },

  'it': function (message, callback) {

    var self = this;

    if (!message || typeof message !== 'string') {
      throw new Error('Message is not a string');
    }

    if (message.indexOf('it') !== 0) {
      message = 'it ' + message;
    }

    return it.call(global, message, callback);
  },

  'integration': function (url, callback) {

    var self = this;

    if (!url || typeof url !== 'string') {
      throw new Error('Message is not a string');
    }

    if (!callback || typeof callback !== 'function') {
      return;
    }

    if (url.indexOf('http') < 0) {
      url = 'http://localhost:' + port + url;
    }

    var displayUrl = process.env.LEGACY_RENDER ? url : url.grey.inverse.bold;

    return describe(displayUrl, function () {

      before(function (done) {

        var _self = this;
        this.timeout(15 * 1000);

        server.done(function () {
          _self.browser = new zombie();
          _self.browser.visit(url, done);
        });
      });

      return (function () {

        return callback.apply(global, arguments);
      })();
    });
  }
});