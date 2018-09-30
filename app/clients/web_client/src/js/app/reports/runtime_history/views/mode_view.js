/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const templates = require('templates');
const Framework = require('nexia_framework');

const ModeView = Framework.View.extend({
  template: templates['mode_toggle'],

  events: {
    'click .heating': '_showHeating',
    'click .cooling': '_showCooling'
  },

  initialize (opts) {
    this.chartMode = opts.chartMode;
  },

  render () {
    const markup = this.template({mode: this.chartMode.current()});
    this.$el.html(markup);
    return this;
  },

  _showCooling () {
    return this.trigger('modeChanged', 'cooling');
  },

  _showHeating () {
    return this.trigger('modeChanged', 'heating');
  }
});

module.exports = ModeView;
