const _    = require('underscore');
const View = require('./view');

const MODEL_CID_TAG = 'data-model-cid';

const CollectionView = View.extend({
  constructor () {
    View.prototype.constructor.apply(this, arguments);

    this._itemViews = [];

    if (this.collection != null) {
      for (var model of Array.from(this.collection.models)) {
        this._createItemView(model);
      }

      this.listenTo(this.collection, 'reset sort', collection => {
        if (collection !== this.collection) { return; }

        _(this._itemViews).invoke('remove');
        this._getContainer().empty();
        this._itemViews = [];

        for (model of collection.models) {
          this._createItemView(model);
        }
      });

      this.listenTo(this.collection, 'add', (model, collection) => {
        if (collection !== this.collection) { return; }
        const view = this._createItemView(model, this.collection.indexOf(model));
        view.$el.hide().fadeIn();
      });

      this.listenTo(this.collection, 'remove', (model, collection, options) => {
        if (collection !== this.collection) { return; }
        this._itemViews.splice(options.index, 1);
      });

      this.listenTo(this.collection, 'request', (modelOrCollection, xhr, options) => {
        if (modelOrCollection !== this.collection) {
          this._triggerLoadingBegin();
        }
      });

      this.listenTo(this.collection, 'sync error destroy', modelOrCollection => {
        if (modelOrCollection !== this.collection) { return; }
        this._triggerLoadingEnd();
      });
    }
  },

  emptyView: null,

  itemView (model) {
    const viewClass = View;
    return new viewClass({ // eslint-disable-line new-cap
      model
    });
  },

  getItemViews () {
    return this._itemViews;
  },

  getItemView (index) {
    return this._itemViews[index];
  },

  getItemFromElement (elem) {
    const $elem = $(elem);
    const cid = $elem.closest(`[${MODEL_CID_TAG}]`).attr(MODEL_CID_TAG);
    return this.collection.find(model => model.cid === cid);
  },

  isEmpty () {
    return this.collection && this.collection.length === 0;
  },

  _getContainer () {
    if (this.itemContainer) {
      return this.$(this.itemContainer);
    } else {
      return this.$el;
    }
  },

  _createItemView (model, index) {
    const view = this.itemView(model);

    if (!view.model) {
      view.model = model;
    }

    view.$el.attr(MODEL_CID_TAG, model.cid);
    const container = this._getContainer();
    if (index < container.children().length) {
      $(container.children()[index]).before(view.render().el);
      this._itemViews.splice(index, 0, view);
    } else {
      container.append(view.render().el);
      this._itemViews.push(view);
    }

    return view;
  },

  _renderEmptyView () {
    this._emptyView = _.result(this, 'emptyView');
    if (this._emptyView) {
      this.$el.html(this._emptyView.render().el);
      this._emptyView.delegateEvents();
    }
  },

  _removeEmptyView () {
    if (this._emptyView) {
      this._emptyView.remove();
      delete this._emptyView;
    }
  },

  render () {
    this.beforeRender();

    if (this.isEmpty() && this.emptyView) {
      this._renderEmptyView();
    } else {
      this._removeEmptyView();
      this._renderTemplate();
      const container = this._getContainer();
      for (let view of Array.from(this._itemViews)) {
        container.append(view.render().el);
        view.delegateEvents();
      }

      this.onRender();
      this.renderChildViews();
    }

    return this;
  },

  remove () {
    View.prototype.remove.apply(this, arguments);

    _(this._itemViews).each(view => view.remove());
  }
});

CollectionView._MODEL_CID_TAG = MODEL_CID_TAG;

module.exports = CollectionView;
