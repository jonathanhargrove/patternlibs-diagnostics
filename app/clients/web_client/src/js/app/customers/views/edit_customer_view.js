/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const templates              = require('templates');
const Framework              = require('nexia_framework');
const FormHelper             = require('utils/form_helper');
const InputFormatter         = require('utils/input_formatter');
const CustomerFormView       = require('customers/views/customer_form_view');

const EditCustomerView = Framework.View.extend({
  className: 'edit-customer-view',
  template: templates['edit_customer'],

  events: {
    'click .submit': 'saveCustomer',
    'click .cancel': 'close',
    'click .delete-customer': 'deleteCustomer'
  },

  initialize (options) {
    Framework.View.prototype.initialize.apply(this, arguments);

    this.readOnly = options.readOnly;
    this.notificationRecipients = options.notificationRecipients;
    this.form = new CustomerFormView({model: this.model, notificationRecipients: this.notificationRecipients});
    this.formHelper = new FormHelper({view: this, recordName: 'customer'});
    this.inputFormatter = new InputFormatter();

    return this.on('cancel', () => this._cancelChanges);
  },

  onRender () {
    this.form.setElement(this.$el.find('.form-view'));
    return this.form.render();
  },

  saveCustomer (e) {
    e.preventDefault();

    if (this.readOnly) {
      alert(`Read-only view: can't ${this.model.isNew() ? 'create' : 'edit'} customer`);
      return;
    }

    if (this.notificationRecipients) {
      this.model.set('notificationRecipientIds', this._getSelectedNotificationRecipientIds());
    }

    this.formHelper.beginSave();

    return this.model.save(null, {
      validate: true,
      patch: true,
      success: () => {
        this.saved = true;
        this.collection.add(this.model);
        if (this.notificationRecipients != null) {
          this.notificationRecipients.fetch();
        }
        return this.formHelper.saveSucceeded();
      },
      error: (_, response) => {
        return this.formHelper.saveFailed(response);
      }
    }
    );
  },

  deleteCustomer (e) {
    e.preventDefault();

    if (this.readOnly) {
      alert("Read-only view: can't delete customer");
      return;
    }

    if (this.formHelper.confirmDelete($(e.currentTarget))) {
      return this.model.unassignDevices();
    }
  },

  close (event) {
    this.formHelper.confirmCancel();
    return event.preventDefault();
  },

  remove () {
    if (this.saved == null) { this._cancelChanges(); }
    this.form.remove();
    return Framework.View.prototype.remove.apply(this, arguments);
  },

  _cancelChanges () {
    return this.model.set(this.initialAttributes, {silent: true});
  },

  _getSelectedNotificationRecipientIds () {
    return _.chain(this.$('input[name^=notification-recipient-]'))
      .filter(input => $(input).is(':checked'))
      .map(input => parseInt($(input).attr('name').split('-')[2]))
      .value();
  }
});

module.exports = EditCustomerView;
