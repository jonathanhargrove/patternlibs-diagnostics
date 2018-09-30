/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Framework = require('nexia_framework');

const LoadingView = Framework.View.extend({
  className: 'loading',

  initialize (options) {
    if (options == null) { options = {}; }

    _.defaults(options, {delay: 500});

    return {delay: this.delay};
  },

  onRender () {
    return setTimeout(() => this.$el.append('<div class="page-spinner">'), this.delay);
  }
});

module.exports = LoadingView;
