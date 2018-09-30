const Honeybadger = require('honeybadger-js');
window.jQuery = window.$ = require('jquery');
var _ = window._ = require('underscore');
var underscoreString = require('underscore.string');
_.mixin(underscoreString.exports());

window.modernizr = require('modernizr');

require('template_helpers');

const tippy = require('tippy.js');
_.extend(tippy.Defaults, {
  animateFill: false,
  arrowSize: 'big',
  position: 'top-end',
  theme: 'nexia'
});

if (RACK_ENV === 'production') {
  Honeybadger.configure({
    api_key: '03eef3bcd9e52f0b067110600e996842', // Public API key
    environment: RACK_ENV
  });
}
