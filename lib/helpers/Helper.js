var Base = require('../core/Base');
var _ = require('lodash');
var handlebars = require('handlebars');
var _super = Base.prototype;

module.exports = Base.extend({

  'initialize': function () {

    var self = this;
    _super.initialize.apply(self, arguments);

    if (typeof self.run !== 'function') {
      throw new Error('Cannot register template helper without callback:' + JSON.stringify(self.attributes));
    }

    handlebars.registerHelper(self.options.name, self.execute);

    self.bindTo(self.mediator, 'rendering:page', self.setCurrentPage);
  },

  'setCurrentPage': function (page) {

    var self = this;
    self.currentPage = page;
    self.currentUrl = page.attributes.url;
  },

  'vent': function () {

    var self = this;
    var args = _.toArray(arguments);
    args[0] = 'vent:' + args[0];
    self.trigger.apply(self, args);
  },

  'execute': function () {

    var self = this;
    var result = self.run.apply(self, arguments);
    return _.isString(result) ? new handlebars.SafeString(result) : result;
  },

  'html': function (tagName, data) {

    var self = this;

    if (!tagName) {
      throw new Error('Cannot format HTML tag without declaring its tagName');
    }

    data || (data = {});

    var markup = '<' + tagName;
    var attributes = [];

    var nonAttributes = ['text', 'html', 'tagName'];
    var booleanAttributes = ['allowfullscreen', 'enabled', 'disabled'];
    _.each(data, function (attribute, key) {
      if (attribute && nonAttributes.indexOf(key) < 0) {

        if (booleanAttributes.indexOf(key) >= 0) {
          attributes.push(key);
        }
        else {
          attributes.push(key + '="' + attribute + '"');
        }
      }
    });

    attributes = _.sortBy(attributes, function (value) {
      return value;
    });

    attributes.length && (markup += ' ' + attributes.join(' '));

    markup += '>';

    if (data.html) {
     markup += data.html;
    }
    else if (data.text) {
      markup += _.escape(data.text);
    }

    markup += '</' + tagName + '>';

    return markup;
  },

  'opts': function (args) {

    var self = this;
    var options;

    _.each(_.toArray(args), function (argument) {
      if (_.isObject(argument) && argument.hash) {
        options = argument;
      }
    });

    return options || {};
  }
});