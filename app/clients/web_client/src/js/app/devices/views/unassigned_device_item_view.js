const ConnectedStatusIconView = require('devices/views/connected_status_icon_view');
const DeviceAlarmsPreviewView = require('devices/views/device_alarms_preview_view');
const DispositionActionView   = require('dashboard/views/disposition_action_view');
const Framework               = require('nexia_framework');
const templates               = require('templates');

module.exports = Framework.View.extend({
  // FIXME: don't use customer class
  className: 'customer unassigned-device',

  template: templates['unassigned_device_list_item'],

  childViews: {
    '[data-device-connected]': function () {
      return new ConnectedStatusIconView({model: this.model});
    },
    '[data-device-alerts]': function () {
      return new DeviceAlarmsPreviewView({model: this.model});
    }
  },

  initialize (options) {
    this.session = options.session;
    this.currentStatusList = options.currentStatusList;
    this.visibleActions = options.visibleActions;
    this.showNdm = options.showNdm;
  },

  templateContext () {
    return {
      deviceModel: (this.model.get('deviceModel') || '').replace(/^xl/i, ''),
      placeholderName: '[unassigned system]',
      ndmEnabled: this.showNdm && this.session.featureEnabled('ndm'),
      showInformationIcon: this.visibleActions.showInformationIcon,
      showDispositionDropdown: this.visibleActions.showDispositionDropdown
    };
  },

  onRender () {
    const dispositionActionView = new DispositionActionView({ model: this.model }).render();

    this.$el.find('.disposition-action-container').append(dispositionActionView.$el);

    if (this.currentStatusList) {
      this.currentStatusList.subscribe(this.model);
    }
  },

  beforeRemove () {
    if (this.currentStatusList) {
      this.currentStatusList.unsubscribe(this.model);
    }
  }
});
