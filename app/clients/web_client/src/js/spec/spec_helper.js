import _ from 'underscore';

require('../../setup');

window.Factories = require('spec/_support/factories');

window.alert = function (alertText) {
  // console.log("Alert! ", alertText); // uncomment if you want to see this
};

window.confirm = function (confirmText) {
  // console.log("confirm! ", confirmText); // uncomment if you want to see this
};

window.prompt = function (promptText) {
  // console.log("prompt! ", promptText); // uncomment if you want to see this
};

// Shim honeybadger so tests can have a thing without having to load the real Honeybadger js file
window.Honeybadger = {
  notify: function () {
    // console.log("Honeybadger notified with ", arguments); // uncomment if you want to see this
  }
};

// console.error always fails tests
window.console.error = _.wrap(console.error, function (error) {
  error.apply(console, _.rest(arguments));
  throw new Error('console.error called in test');
});

// console.warn fails tests unless the environment has FAIL_ON_WARNING=0
window.console.warn = _.wrap(console.warn, function (warn) {
  warn.apply(console, _.rest(arguments));
  if (!_.contains(window.__karma__.config.args, 'failOnWarning')) {
    throw new Error('console.warn called in test. Use FAIL_ON_WARNING=0 to disable.');
  }
});

window.runningSpecs = true;
