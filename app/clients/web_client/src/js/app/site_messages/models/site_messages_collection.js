const Framework         = require('nexia_framework');
const Theme             = require('utils/theme');
const SiteMessage       = require('site_messages/models/site_message');

const SiteMessagesCollection = Framework.Collection.extend({
  model: SiteMessage,

  initialize () {
    this.theme  = Theme.current();
  },

  url () {
    return `/api/admin/site_messages?theme=${this.theme}`;
  },

  // Backbone fetch does not react to 304 status codes by design (https://github.com/jashkenas/backbone/pull/3410),
  // so we need to handle the status code manually. The below implemenation is one way of doing it.
  parse (response, options) {
    if (options.xhr.status === 304) return this.lastResponse;

    this.lastResponse = response;

    return response;
  },

  comparator (a, b) {
    const aValue = this._comparatorValue(a);
    const bValue = this._comparatorValue(b);

    if (aValue > bValue) {
      return 1;
    } else if (aValue < bValue) {
      return -1;
    } else {
      return 0;
    }
  },

  _comparatorValue (siteMessage) {
    let value = '';

    if (siteMessage.get('siteBannerEnabled')) {
      value += '0';
    } else {
      value += '1';
    }

    value += siteMessage.get('dashboardPanelSlot') || 'z'; // 'z' sorts it last if no dashboard slot

    value += siteMessage.get('primaryText') || siteMessage.get('secondaryText');

    return value.toLowerCase();
  }
});

module.exports = SiteMessagesCollection;
