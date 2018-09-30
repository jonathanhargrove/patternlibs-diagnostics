const Framework = require('nexia_framework');
const templates = require('templates');

const ModalDialog             = require('utils/modal_dialog');
const SiteMessageExpandedView = require('root/views/site_message_expanded_view');

const SiteMessagesView = Framework.View.extend({
  id: 'site-messages',

  template: templates['site_messages'],

  events: {
    'click .image': '_openFullViewModal'
  },

  templateContext () {
    let n = 1;

    return {
      messages: _
        .chain(this.collection.models)
        .filter((model) => model.get('dashboardPanelSlot'))
        .sortBy((model) => model.get('dashboardPanelSlot'))
        .map((model) => {
          const attrs = _.clone(model.attributes);
          // reset the slot number based on order so CSS displays properly (for case where only slot 2 is enabled)
          attrs.dashboardPanelSlot = n;
          n = n + 1;
          return attrs;
        })
        .value()
    };
  },

  _openFullViewModal (e) {
    const id = $(e.currentTarget).data('id');
    const model = this.collection.get(id);

    const view = new SiteMessageExpandedView({ model: model }).render();

    const dialog = new ModalDialog(view, true);

    dialog.show();

    this.listenTo(view, 'close', dialog.close);
  }
});

module.exports = SiteMessagesView;
