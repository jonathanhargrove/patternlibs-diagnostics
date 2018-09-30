const Backbone = require('backbone');
const _        = require('underscore');

const Sort = {
  ASC: 1,
  DESC: -1
};

const Collection = Backbone.Collection.extend({
  sortDirection: Sort.ASC,

  parse (obj) {
    if (!this.model || !(obj instanceof Array)) { return obj; }

    const Model = this.model;
    const models = [];
    for (let item of obj) {
      models.push(new Model(item, {
        parse: true
      }));
    }
    return models;
  },

  clone () {
    let newThing = Backbone.Collection.prototype.clone.apply(this, arguments);
    newThing.sortDirection = this.sortDirection;
    newThing._sortAttribute = this.sortAttribute;
    return newThing;
  },

  setSortAttribute (attr, {switchDirection = false} = {}) {
    if (_.isFunction(this[`${attr}Comparator`])) {
      this.comparator = this[`${attr}Comparator`];
    } else {
      this.comparator = model => model.get(attr);
    }

    if (switchDirection && this._sortAttribute === attr) {
      this._switchSortDirection();
    }

    this._sortAttribute = attr;

    return this;
  },

  sortBy (iterator, context) {
    const obj = this.models;
    const direction = this.sortDirection || Sort.ASC;
    return _.pluck(_.map(obj, (value, index, list) =>
      ({
        value,
        index,
        criteria: iterator.call(context, value, index, list)
      })
    ).sort(function (left, right) {
      const a = (direction === Sort.ASC ? left.criteria : right.criteria);
      const b = (direction === Sort.ASC ? right.criteria : left.criteria);
      if (a !== b) {
        if ((a > b) || (a === undefined)) return 1;
        if ((a < b) || (b === undefined)) return -1;
      }

      return left.index - right.index;
    }), 'value');
  },

  _switchSortDirection () {
    this.sortDirection = (this.sortDirection === Sort.ASC ? Sort.DESC : Sort.ASC);
  }
});

Object.defineProperty(Collection.prototype, 'sortAttribute', {
  get: function () {
    return this._sortAttribute;
  },

  set: function (_) {
    throw new Error('Use #setSortAttribute to modify the sortAttribute');
  }
});

Collection.Sort = Sort;

module.exports = Collection;
