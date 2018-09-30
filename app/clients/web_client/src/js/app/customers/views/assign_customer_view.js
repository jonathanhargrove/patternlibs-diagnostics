const _                      = require('underscore');
const templates              = require('templates');

const Customer               = require('customers/models/customer');
const CustomerFormView       = require('customers/views/customer_form_view');
const CustomerSearchFormView = require('customers/views/customer_search_form_view');
const Dialogs                = require('root/dialogs');
const FormHelper             = require('utils/form_helper');
const Framework              = require('nexia_framework');
const InputFormatter         = require('utils/input_formatter');
const System                 = require('systems/models/system');

var AssignCustomerView = Framework.View.extend({
  template: templates['assign_customer'],
  childViews: {
    '.new-form-view' () {
      return new CustomerFormView({model: this.newCustomer});
    },
    '.search-form-view' () {
      return _.tap(new CustomerSearchFormView({collection: this.customers, device: this.model}), view => {
        this.listenTo(view, 'selected:customer', customer => { this.selectedCustomer = customer; });
      });
    }
  },

  events: {
    'click .submit': 'assignCustomer',
    'click .cancel': 'close',
    'click .delete-customer': 'deleteCustomer',
    'change [name="customer_type"]': 'toggleFormType'
  },

  initialize (options) {
    AssignCustomerView = Framework.View.prototype.initialize.apply(this, arguments);
    this.customers = options.collection;
    this.selectedCustomer = null;
    this.newCustomer = new Customer({dealerUuid: this.customers.dealerUuid});
    this.formHelper = new FormHelper({view: this, model: this.newCustomer, recordName: 'customer'});
    this.readOnly = options.readOnly;
    this.inputFormatter = new InputFormatter();
  },

  onRender () {
    this.$el.find('.new-form-view').addClass('hidden');
  },

  toggleFormType (e) {
    this.formType = e.currentTarget.value;
    this.$el.find('.new-form-view').toggleClass('hidden');
    this.$el.find('.search-form-view').toggleClass('hidden');
  },

  assignCustomer (e) {
    e.preventDefault();

    if (this.readOnly) {
      alert("Read-only view: can't assign customer");
      return;
    }

    this.formHelper.beginSave();
    if (this.formType === 'new') {
      this.addCustomerAndDevice();
    } else {
      this.addExistingCustomerToDevice();
    }
  },

  validateSelectedCustomer () {
    if (this.selectedCustomer != null) { return true; }

    Dialogs.addErrorToElem('Select an existing customer', this.$el.find('.search-and-results'));
    this.formHelper.buttonSpinner.stop();
    return false;
  },

  addExistingCustomerToDevice () {
    if (!this.validateSelectedCustomer()) { return; }

    const system = new System({
      dealerUuid: this.selectedCustomer.get('dealerUuid'),
      customerId: this.selectedCustomer.id,
      primaryDeviceId: this.model.id,
      session: this.session
    }, {
      primaryDevice: this.model
    });

    this.selectedCustomer.getSystems().create(system, {
      wait: true,
      validate: true,
      success: response => {
        this.formHelper.saveSucceeded();
        this.customers.trigger('device:assigned', response.id, this.selectedCustomer.id);
      },
      error: (_, response) => {
        this.formHelper.saveFailed(response);
      }
    }
    );
  },

  addCustomerAndDevice () {
    this.newCustomer.setUnassignedDeviceId(this.model.id);

    this.newCustomer.save(null, {
      wait: true,
      validate: true,
      success: response => {
        this.formHelper.saveSucceeded();
        this.customers.add(response);
        this.customers.trigger('device:assigned', this.model.get('deviceId'), response.id);
      },
      error: (_, response) => {
        return this.formHelper.saveFailed(response);
      }
    }
    );
  },

  close (event) {
    this.formHelper.confirmCancel();
    return event.preventDefault();
  }
});

module.exports = AssignCustomerView;
