const ConnectedStatusIconView = require('devices/views/connected_status_icon_view');
const DeviceAlarmsPreviewView = require('devices/views/device_alarms_preview_view');
const DispositionActionView   = require('dashboard/views/disposition_action_view');
const Framework               = require('nexia_framework');
const templates               = require('templates');

const CustomerListItemSystemView = Framework.View.extend({
  className: 'device',
  template: templates['customer_list_item_system'],

  initialize (options) {
    this.listenTo(this.model, 'change', () => this.render());
    this.session = options.session;
    this.customer = options.customer;
    this.visibleActions = options.visibleActions;
    this.showNdm = options.showNdm;
  },

  childViews: {
    '[data-spider-connected]' () { if (this.model.spider()) { return new ConnectedStatusIconView({model: this.model.spider()}); } },
    '[data-system-connected]' () { return new ConnectedStatusIconView({model: this.model}); },
    '[data-customer-alerts]' () { return new DeviceAlarmsPreviewView({model: this.model.primaryDevice}); }
  },

  templateContext () {
    const deviceModel = this.model.primaryDevice.get('deviceModel');

    return _.extend(
      {},
      this.model.primaryDevice.attributes,
      {
        customerId: this.customer.id,
        deviceModel: deviceModel && deviceModel.replace(/^xl/i, ''),
        ndmId: (this.model.spider() && this.session.featureEnabled('ndm')) ? this.model.spider().id : false,
        showNdm: this.showNdm && this.session.featureEnabled('ndm'),
        showInformationIcon: this.visibleActions.showInformationIcon,
        showDispositionDropdown: this.visibleActions.showDispositionDropdown
      }
    );
  },

  onRender () {
    const dispositionActionView = new DispositionActionView({ model: this.model.primaryDevice }).render();

    this.$el.find('.disposition-action-container').append(dispositionActionView.$el);
  }
});

module.exports = CustomerListItemSystemView;
