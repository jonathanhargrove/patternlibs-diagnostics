/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const FormHelper             = require('utils/form_helper');
const Framework              = require('nexia_framework');
const InputFormatter         = require('utils/input_formatter');
const RequiredFieldsStylizer = require('utils/required_fields_stylizer');
const templates              = require('templates');
const tippy                  = require('tippy.js');
const _                      = require('underscore');

const EditNotificationRecipientView = Framework.View.extend({
  template: templates['edit_notification_recipient'],

  templateContext () {
    return {
      betaAlertsTitle: 'Beta Alerts currently consist of "Failure to Achieve Set Point" alerts.  Please provide your feedback on Beta alerts via the feedback button.',
      majorAlertsTitle: 'Major alerts consist of issues where some functionality has been lost or reduced and may need attention as soon as is convenient.',
      criticalAlertsTitle: 'Critical alerts consist of issues where primary functionality has been lost and likely require prompt attention.',
      customerListColumns: this._buildCustomerOptionsColumns()
    };
  },

  id: 'edit-notification-recipient-view',

  bindings: {
    'input[name=name]': {
      observe: 'name',
      onSet (val) { return this.inputFormatter.scrubBlankAndTrim(val); }
    },
    'input[name=email]': {
      observe: 'email',
      onSet (val) { return this.inputFormatter.scrubBlankAndTrim(val); }
    },
    'input[name=majorAlerts]': 'majorAlerts',
    'input[name=criticalAlerts]': 'criticalAlerts',
    'input[name=betaAlerts]': 'betaAlerts',
    'input[name=customers]': 'customerSelectionType'
  },

  events: {
    'click .submit': 'saveNotificationRecipient',
    'click .cancel': 'close',
    'click .delete-notification-recipient': 'deleteNotificationRecipient',
    'change input[name=customers]' (e) {
      return $('#customer-columns-container').toggleClass('hidden', $('#all-customers').is(':checked'));
    }
  },

  initialize (options) {
    this.inputFormatter = new InputFormatter();
    this.readOnly = options.readOnly;
    this.formHelper = new FormHelper({view: this, recordName: 'notification recipient'});

    this.customers = options.customers;
  },

  saveNotificationRecipient (event) {
    event.preventDefault();

    if (this.readOnly) {
      alert(`Read-only view: can't ${this.model.isNew() ? 'create' : 'edit'} notification recipient`);
      return;
    }

    this.model.set('customerIds', this._getSelectedCustomerIds());

    this.formHelper.beginSave();

    return this.collection.create(this.model, {
      wait: true,
      validate: true,
      patch: true,
      success: () => this.formHelper.saveSucceeded(),
      error: (_, response) => {
        return this.formHelper.saveFailed(response, response.status !== 400);
      }
    }
    );
  },

  deleteNotificationRecipient (e) {
    e.preventDefault();

    if (this.readOnly) {
      alert("Read-only view: can't delete notification recipient");
      return;
    }

    return this.formHelper.confirmDelete($(e.currentTarget));
  },

  close (event) {
    event.preventDefault();
    return this.formHelper.confirmCancel();
  },

  postRenderSetup () {
    tippy(this.$('[data-tooltip]')[0], {
      arrow: true,
      position: 'top-start'
    });

    new RequiredFieldsStylizer(this.model, this.el).style();

    if (this.model.get('customerSelectionType') !== 'all') {
      return this.$('#selected-customers').prop('checked', true).change();
    }
  },

  _buildCustomerOptionsColumns () {
    const columns = [];
    const customers = this._buildCustomerOptions();

    if (customers.length < 40) {
      while (customers.length) { columns.push(customers.splice(0, 10)); }
    } else {
      const numberOfItermsPerColumn = (customers.length / 4) + (customers.length % 4 ? 1 : 0);

      _.times(3, () => columns.push(customers.splice(0, numberOfItermsPerColumn)));
      columns.push(customers);
    }

    return columns;
  },

  _buildCustomerOptions () {
    return _.chain(this.customers.models)
      .map(customer => {
        return {
          id: customer.id,
          name: customer.fullName(),
          selected: _.contains(this.model.get('customerIds'), customer.id)
        };
      })
      .sortBy(customer => customer.name.toLowerCase())
      .value();
  },

  _getSelectedCustomerIds () {
    return _.chain(this.$('input[name^=customer-]'))
      .filter(input => $(input).is(':checked'))
      .map(input => parseInt($(input).attr('name').split('-')[1]))
      .value();
  },

  onRender () {
    _.each(this.$('[data-tooltip]'), element =>
      tippy(element, {
        arrow: true,
        position: 'top-start'
      })
    );
  }
});

module.exports = EditNotificationRecipientView;
