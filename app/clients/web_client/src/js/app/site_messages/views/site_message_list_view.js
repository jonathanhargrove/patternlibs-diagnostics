const templates = require('templates');
const Framework = require('nexia_framework');

const SiteMessageListView = Framework.View.extend({
  template: templates['site_message_list'],

  id: 'site-message-list',

  templateContext () {
    return {
      items: _.map(this.collection.models, (model) => {
        const attrs = _.clone(model.attributes);

        if (attrs.dashboardPanelSlot === 1) {
          attrs.slotOneSet = true;
        } else if (attrs.dashboardPanelSlot === 2) {
          attrs.slotTwoSet = true;
        }

        return attrs;
      })
    };
  },

  events: {
    'click .edit': '_navigate',
    'click #new': '_navigate'
  },

  initialize () {
    this.collection.sort();
  },

  _navigate (e) {
    e.preventDefault();

    this.trigger('navigate', $(e.currentTarget).attr('href'));
  }
});

module.exports = SiteMessageListView;
