const templates = require('templates');
const Framework = require('nexia_framework');

const NavDealerView = Framework.View.extend({
  template: templates['nav_dealer'],

  initialize (options) {
    this.session = options.session;
  },

  templateContext () {
    return {
      dashboardEnabled: this.session.featureEnabled('dashboard')
    };
  }
});

module.exports = NavDealerView;
