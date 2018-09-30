/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Framework = require('nexia_framework');
const Dealer = require('dealers/models/dealer');

const DealersCollection = Framework.Collection.extend({
  model: Dealer,

  initialize (options) {
    this.sortField = 'dealerName';
    this.sortDirection = 1;
  },

  url () {
    return '/api/dealers';
  },

  sortOn (field) {
    if (this.sortField === field) {
      this.sortDirection = -1 * this.sortDirection;
    } else {
      this.sortField = field;
      this.sortDirection = 1;
    }

    return this.sort();
  },

  comparator (dealerA, dealerB) {
    const nameA = dealerA.get('dealerName');
    const nameB = dealerB.get('dealerName');

    if ((nameA != null ? nameA.toLowerCase() : undefined) < (nameB != null ? nameB.toLowerCase() : undefined)) { return (-1 * this.sortDirection); }
    if ((nameA != null ? nameA.toLowerCase() : undefined) > (nameB != null ? nameB.toLowerCase() : undefined)) { return (1 * this.sortDirection); }
    return  0;
  }
});

module.exports = DealersCollection;
