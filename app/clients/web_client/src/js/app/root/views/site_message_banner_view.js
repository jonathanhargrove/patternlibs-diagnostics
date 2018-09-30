const Framework = require('nexia_framework');
const templates = require('templates');

const ModalDialog             = require('utils/modal_dialog');
const SiteMessageExpandedView = require('root/views/site_message_expanded_view');

const SiteMessageBannerView = Framework.View.extend({
  id: 'site-message-banner',

  events: {
    'click .dismiss': '_dismiss',
    'click .image': '_openFullViewModal'
  },

  initialize () {
    this.$previouslyFocused = $(document.activeElement);
  },

  template: templates['site_message_banner'],

  onRender () {
    this.$el.addClass(this.model.get('messageType'));
  },

  _dismiss () {
    this.$previouslyFocused.focus();

    this.trigger('dismissed');
  },

  _openFullViewModal () {
    const view = new SiteMessageExpandedView({ model: this.model }).render();

    const dialog = new ModalDialog(view, true);

    dialog.show();

    this.listenTo(view, 'close', dialog.close);
  }
});

module.exports = SiteMessageBannerView;
