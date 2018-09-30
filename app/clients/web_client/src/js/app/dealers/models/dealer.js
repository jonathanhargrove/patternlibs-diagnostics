/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Framework = require('nexia_framework');
const SystemsCollection = require('systems/models/systems_collection');

const Dealer = Framework.Model.extend({
  name () {
    return this.get('dealerName') || this.get('username') || `Unknown (${this.id})`;
  },

  matches (query) {
    const attributesToSearch = ['brand', 'channel', 'contactEmail',
      'dealerName', 'phoneNumber', 'distributor',
      'address', 'city', 'state', 'zip'];

    // search this dealer's direct attrs
    if (_(attributesToSearch).any(attr => __guard__(this.get(attr), x => x.match(new RegExp(query, 'i'))))) { return true; }

    // if that fails, try the systems
    return this.getSystems().any(system => system != null ? system.matches(query) : undefined);
  },

  fullAddress () {
    return `${this.get('address')} ${this.get('city')}, ${this.get('state')} ${this.get('zip')}`;
  },

  nestedCollections: {
    systems: {
      collection: SystemsCollection
    }
  }
});

module.exports = Dealer;

function __guard__ (value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}
