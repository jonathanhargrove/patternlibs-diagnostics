const Framework = require('nexia_framework');
const Sort = Framework.Collection.Sort;

const SortIndicatorView = Framework.View.extend({
  initialize ({sortAttribute}) {
    this.sortAttribute = sortAttribute;
    this.listenTo(this.collection, 'sort reset', this.render);
  },

  render () {
    this.$el.removeClass('icon-sort icon-sort-up icon-sort-down').addClass(this._sortClass());
    return this;
  },

  _sortClass () {
    if (this.collection.sortAttribute === this.sortAttribute) {
      return (this.collection.sortDirection === Sort.ASC) ? 'icon-sort-down' : 'icon-sort-up';
    } else {
      return 'icon-sort';
    }
  }
});

module.exports = SortIndicatorView;
