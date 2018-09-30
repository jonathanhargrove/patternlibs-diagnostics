const Framework   = require('nexia_framework');
const templates   = require('templates');

const SiteMessageExpandedView = Framework.View.extend({
  id: 'site-message-expanded',

  template: templates['site_message_expanded'],

  events: {
    'click .close': '_close'
  },

  onRender () {
    this.$el.addClass(this.model.get('messageType'));
  },

  _close () {
    this.trigger('cancel');
  }
});

module.exports = SiteMessageExpandedView;
