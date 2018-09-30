/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Framework = require('nexia_framework');
const System = require('systems/models/system');
const Backbone = require('backbone');

const SystemsCollection = Framework.Collection.extend({
  model: System,

  url () {
    return '/api/systems';
  },

  numberOfGroups () {
    return _.filter(this.models, model => model.get('group')).length;
  },

  generateOrderedGroupModels () {
    const UNASSIGNED = '';
    return _.chain(this.models)
      .map(s => s.get('group'))
      .uniq()
      .sortBy(g => g || UNASSIGNED)
      .map(g => new Backbone.Model({name: g}))
      .value();
  },

  comparator (systemA, systemB) {
    const nameA = String(systemA.primaryDevice.get('name') || systemA.primaryDevice.get('deviceId')).toLowerCase();
    const nameB = String(systemB.primaryDevice.get('name') || systemB.primaryDevice.get('deviceId')).toLowerCase();

    if (nameA < nameB) { return -1; }
    if (nameA > nameB) { return 1; }

    return 0;
  }
});

module.exports = SystemsCollection;
