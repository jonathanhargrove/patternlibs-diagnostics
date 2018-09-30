/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const templates = require('templates');
const Framework = require('nexia_framework');

const CycleCountView = Framework.View.extend({
  template: templates['cycle_count'],

  initialize (opts) {
    this.stages = opts.stages;
  },

  render () {
    const markup = this.template({stages: this.stages});
    this.$el.html(markup);

    return this;
  }
});

module.exports = CycleCountView;
