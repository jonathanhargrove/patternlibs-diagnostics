const CollectionView = require('./collection_view');
const NoResultsView  = require('./no_results_view');
const _              = require('underscore');

const SearchableCollectionView = CollectionView.extend({
  hasResults () {
    return !!this.collection.length;
  },

  noResultsContainer: null,

  initialize (options) {
    this.noRecordsMessage = options.noRecordsMessage;
    this.query = options.query;
  },

  _getResultsContainer () {
    let selector = _.result(this, 'noResultsContainer');
    let $results = this.$el.find(selector);
    // Use itemContainer unless there is a noResultsContainer
    return $results.length ? $results : this._getContainer();
  },

  render () {
    CollectionView.prototype.render.apply(this, arguments);

    if (!this.hasResults()) {
      let message;
      if (!this.query && this.noRecordsMessage) {
        message = this.noRecordsMessage;
      }

      let view = new NoResultsView({ message: message });

      this._getResultsContainer().html(view.render().el);
    }

    return this;
  }
});

module.exports = SearchableCollectionView;
