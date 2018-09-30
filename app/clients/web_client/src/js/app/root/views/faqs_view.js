/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const templates = require('templates');
const Framework = require('nexia_framework');

const FAQsView = Framework.View.extend({
  template: templates['faqs'],

  events: {
    'click .icon-close': '_closeFAQs'
  },

  id: 'faqs-view',

  _closeFAQs () {
    return this.trigger('cancel');
  }
});

module.exports = FAQsView;
