/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const ButtonSpinner       = require('utils/button_spinner');
const DealersCollection   = require('dealers/models/dealers_collection');
const DealersListItemView = require('dealers/views/dealers_list_item_view');
const Dialogs             = require('root/dialogs');
const Framework           = require('nexia_framework');
const Honeybadger         = require('honeybadger-js');
const ServerError         = require('root/server_error');
const templates           = require('templates');

const NoDealersView = Framework.View.extend({
  template: templates['no_dealers']
});

const DealersListView = Framework.SearchableCollectionView.extend({
  template: templates['dealer_list'],

  id: 'dealer-list',

  className: 'dealers-container',

  events: {
    'submit #search-container': '_applySearch',
    'click #clear-search': '_clearSearch',
    'submit #dealer-form': '_impersonateDealerClicked'
  },

  initialize (options) {
    this.query = options.query;
    this.session = options.session;
    this.router = options.router;
    this.dealers = options.collection;
    this.collection = this._filteredCollection(options.collection, this.query);
    return this.collection.on('sort reset', this.render, this);
  },

  emptyView: new NoDealersView(),
  isEmpty () { return this.dealers.length === 0; },

  itemContainer: '#dealer-list-items',
  itemView (model) { return new DealersListItemView({model}); },

  noResultsContainer: '#dealer-results',

  templateContext () {
    return {
      models: this.collection.models,
      query: this.query
    };
  },

  onRender () {
    this._updateSearch();
    if (this.collection.length > 0) {
      this._updateDealerCount();
      this._updateSortIndicators();
    }

    return $('body').scrollTop(0);
  },

  _updateSearch () {
    return this.$el.find('.header').prepend(templates['dealer_search']({query: this.query}));
  },

  _filteredCollection (collection, query) {
    const models = (query != null)
      ? collection.filter(dealer => dealer.matches(query))
      :      collection.models;

    return new DealersCollection(models);
  },

  _sortList (e) {
    const $target = $(e.target);
    return this.collection.sortOn($target.closest('[data-sort-on]').data('sort-on'));
  },

  _updateSortIndicators () {
    this.$el.find(`[data-sort-on!=${this.collection.sortField}] .sort-controls`).removeClass('icon-sort icon-sort-up icon-sort-down');
    this.$el.find(`[data-sort-on!=${this.collection.sortField}] .sort-controls`).addClass('icon-sort');
    this.$el.find(`[data-sort-on=${this.collection.sortField}] .sort-controls`).removeClass('icon-sort icon-sort-up icon-sort-down');
    return this.$el.find(`[data-sort-on=${this.collection.sortField}] .sort-controls`).addClass(`icon-sort-${this.collection.sortDirection === -1 ? 'up' : 'down'}`);
  },

  _updateDealerCount () {
    return this.$el.find('.title > #dealer-count').text(this.collection.length);
  },

  _clearSearch (e) {
    e.preventDefault();
    return this.router.navigate('/dealers', {trigger: true});
  },

  _applySearch (e) {
    e.preventDefault();
    const $target = $(e.currentTarget);
    const query = $target.find('#search').val();
    const route = `/dealers/search/${encodeURIComponent(query)}`;
    return this.router.navigate(route, {trigger: true});
  },

  _impersonateDealerClicked (e) {
    e.preventDefault();

    Dialogs.clearErrors();
    const buttonSpinner = new ButtonSpinner().start(this.$('button#impersonate'));
    if (!this.session.isAdmin()) { return alert('Not permitted'); }

    const dealerUuid = this.$('#dealer-list-items').val();
    return this.session.save({impersonateDealerId: dealerUuid}, {validate: false, patch: true})
      .then(() => {
        this.router.resetCollections();
        return this.router.navigate('/customers', {trigger: true});
      }).fail(xhr => {
        if (xhr.status !== 401) {
          Honeybadger.notify('Error impersonating user terms', { context: { session: this.session.attributes, dealerUuid } });
          ServerError.display();
        }
        return buttonSpinner.stop();
      });
  }
});

module.exports = DealersListView;
