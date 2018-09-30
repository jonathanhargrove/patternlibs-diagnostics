/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Framework = require('nexia_framework');

const templates = require('templates');

const LoadingView = Framework.View.extend({
  template: templates['failure'],
  className: 'failure',

  onRender () {
    return this;
  }
});

module.exports = LoadingView;
