const AssignCustomerView = require('customers/views/assign_customer_view');
const DeviceView         = require('devices/views/device_view');
const Framework          = require('nexia_framework');
const ModalDialog        = require('utils/modal_dialog');
const templates          = require('templates');

module.exports = Framework.View.extend({
  template: templates['unassigned_device'],
  id: 'customer-container',
  events: {
    'click #assign-device': '_displayAssignDeviceDialog'
  },

  initialize (options) {
    this.rthSource = options.rthSource;
    this.reportCache = options.reportCache;
    this.readOnly = options.readOnly;
    this.session = options.session;
    this.customers = options.customers;
  },

  childViews: {
    '[data-device-view-container]': function () {
      return new DeviceView({
        customers: this.customers,
        model: this.model,
        reportCache: this.reportCache,
        readOnly: this.readOnly,
        session: this.session,
        rthSource: this.rthSource
      });
    }
  },

  _displayAssignDeviceDialog () {
    var view = new AssignCustomerView({collection: this.customers, model: this.model, session: this.session});
    var dialog = new ModalDialog(view, false, 'assign-customer-dialog');
    dialog.show();
  }
});
