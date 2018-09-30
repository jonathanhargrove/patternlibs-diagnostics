const Framework = require('nexia_framework');

const SiteMessage = Framework.Model.extend({
  urlRoot: '',

  url () {
    return `/api/admin/site_messages${this.isNew() ? '' : '/' + this.id}`;
  },

  defaults: {
    siteBannerEnabled: false,
    messageType: 'info'
  },

  validations: {
    dashboardPanelSlot: {
      fn (slot) {
        const hasTitle = this.get('dashboardPanelTitle') && this.get('dashboardPanelTitle').length;

        if (slot && !hasTitle) {
          return 'Title is required if a dashboard panel slot is selected';
        }
      }
    },

    siteBannerEnabled: {
      fn (enabled) {
        const hasPrimaryText = this.get('primaryText') && this.get('primaryText').length;
        const hasSecondaryText = this.get('secondaryText') && this.get('secondaryText').length;

        if (enabled && !hasPrimaryText && !hasSecondaryText) {
          return 'Primary or secondary text is required if site banner is enabled';
        }
      }
    }
  },

  isSiteBannerDismissed () {
    return localStorage.getItem('siteBannerDismissed') === this.get('updatedAt');
  }
});

module.exports = SiteMessage;
