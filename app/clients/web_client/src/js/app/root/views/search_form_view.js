const Backbone  = require('backbone');
const Framework = require('nexia_framework');
const templates = require('templates');

const SearchFormView = Framework.View.extend({
  tagName: 'form',
  className: 'search-form-view',
  template: templates['search_form'],

  events: {
    'click [data-js=clear-search]': '_clear',
    'submit': '_submit'
  },

  initialize ({query} = {}) {
    this.viewModel = new Backbone.Model({query});
    this.listenTo(this.viewModel, 'change:query', (_model, query) => {
      this.trigger('queryChanged', query);
    });
  },

  templateContext () {
    return this.viewModel.attributes;
  },

  _clear (e) {
    e.preventDefault();
    this.viewModel.set('query', null);
  },

  _submit (e) {
    e.preventDefault();
    const query = this.$('[data-js=query]').val();
    this.viewModel.set('query', query);
  }
});

module.exports = SearchFormView;
