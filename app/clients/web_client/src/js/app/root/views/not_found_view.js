/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const templates = require('templates');
const Framework = require('nexia_framework');

const NotFoundView = Framework.View.extend({
  template: templates['not_found'],

  className: 'not-found',

  events: {
    'click a': '_backToPage'
  },

  _backToPage (e) {
    e.preventDefault();
    return this.trigger('navigate', $(e.currentTarget).attr('href'));
  }
});

module.exports = NotFoundView;
