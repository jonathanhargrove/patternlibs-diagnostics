const $                      = require('jquery');
const Alarm                  = require('reports/alarms/models/alarm');
const NotificationPolicyView = require('notifications/views/notification_policy_view');
const Framework              = require('nexia_framework');
const ModalDialog            = require('utils/modal_dialog');
const templates              = require('templates');
const ServerError            = require('root/server_error');

const NotificationConfigurationItemView = Framework.View.extend({
  tagName: 'tr',
  template: templates['notification_configuration_item'],
  events: {
    'change [type=checkbox]': 'updateConfiguration',
    'click [data-js=notification-label]': 'displayPolicyModal'
  },

  templateContext () {
    return { displayValue: Alarm.alarmCodeDisplayValue(this.model.get('alarmId')) };
  },

  initialize (options) {
    this.config = options.config;
    this.listenTo(this.config, 'change', this.renderEnabled);
  },

  onRender () {
    this.renderEnabled();
  },

  updateConfiguration (e) {
    let $input = $(e.target);
    let enabled = $input.is(':checked');
    this.config.set('enabled', enabled);

    this.config.save(null, {validate: false})
      .then((_model, response) => {
        this.config.set(response);
      }).fail((response) => {
        this.config.set('enabled', !enabled);
        ServerError.display();
      });
  },

  renderEnabled () {
    let enabled = this.config.get('enabled');
    let policy = this.config.get('activeInterval') || this.config.get('occurrenceInterval');
    let label;

    if (enabled && policy) {
      label = 'SEND IF';
    } else if (enabled) {
      label = 'SEND';
    } else {
      label = "DON'T SEND";
    }

    this.$el.toggleClass('disabled', !enabled);

    this.$('[type=checkbox]').prop('checked', enabled);
    this.$('[data-js=notification-label]').text(label);
  },

  displayPolicyModal (e) {
    let view = new NotificationPolicyView({ model: this.config });
    let modal = new ModalDialog(view);
    modal.show();
    this.listenTo(view, 'closeModal', () => { modal.close(); });
  }
});

module.exports = NotificationConfigurationItemView;
