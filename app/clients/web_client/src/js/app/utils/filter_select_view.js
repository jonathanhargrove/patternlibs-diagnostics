const Framework = require('nexia_framework');
const Backbone  = require('backbone');
const templates = require('templates');
const $         = require('jquery');

const SearchResultsView = Framework.CollectionView.extend({
  events: {
    [`click [${Framework.CollectionView._MODEL_CID_TAG}]`]: 'selectResult'
  },

  initialize (options) {
    this.itemViewClass = options.itemViewClass;
  },

  itemView (result) {
    // eslint-disable-next-line new-cap
    return new this.itemViewClass({ model: result });
  },

  selectResult (e) {
    let resultCid = $(e.currentTarget).attr(Framework.CollectionView._MODEL_CID_TAG);
    let result = this.collection.get(resultCid);
    this.trigger('selected:result', result);
  }
});

const FilterSelectView = Framework.View.extend({
  className: 'filter-select-view',

  events: {
    'click button': '_showHideFilter'
  },

  childViews: {
    '.search-results': function () {
      let view = new SearchResultsView({ collection: this.results, itemViewClass: this.resultItemView });
      this.listenTo(view, 'selected:result', (item) => { this._itemSelected(item); });

      return view;
    }
  },

  viewModelBindings: {
    '[name=searchterm]': 'searchTerm'
  },

  initialize (options) {
    this.label = this.defaultLabel = options.defaultLabel || 'Choose...';
    this.resultItemView = options.resultItemView;
    this.collection = options.collection;
    this.itemDisplayCallback = options.itemDisplayCallback;

    this.results = new Framework.Collection();

    this.viewModel = new Backbone.Model({ searchTerm: '', result: null, expanded: false });
    this.listenTo(this.viewModel, 'change:searchTerm', this._performSearch);
    this.listenTo(this.viewModel, 'change:expanded', () => this.render());
  },

  onRender () {
    this.unstickit();
    this.stickit(this.viewModel, this.viewModelBindings);

    return this;
  },

  templateContext () {
    return {
      expandedClass: this._expandedClass(),
      buttonLabel: this._buttonLabel()
    };
  },

  template: templates['filter_select_view'],

  _buttonLabel () {
    if (this.viewModel.get('result')) {
      return this.itemDisplayCallback(this.viewModel.get('result'));
    } else {
      return this.defaultLabel;
    }
  },

  _itemSelected (item) {
    this.trigger('selected:item', item);
    this.viewModel.set('result', item);
    this.viewModel.set('expanded', false);
  },

  _expandedClass (expanded = this.viewModel.get('expanded')) {
    return expanded ? 'expanded' : 'collapsed';
  },

  _showHideFilter () {
    this.viewModel.set('expanded', !this.viewModel.get('expanded'));
  },

  _performSearch (viewModel, searchTerm) {
    let results;

    if (searchTerm) {
      results = this.collection.filter(function (item) { return item.matches(searchTerm); });

      this.results.set(results);
    } else {
      this.results.set([]);
    }
  }
});

module.exports = FilterSelectView;
