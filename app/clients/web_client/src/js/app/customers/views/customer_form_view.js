/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Framework              = require('nexia_framework');
const InputFormatter         = require('utils/input_formatter');
const Theme                  = require('utils/theme');
const InputMask              = require('utils/input_mask');
const RequiredFieldsStylizer = require('utils/required_fields_stylizer');
const templates              = require('templates');
const tippy                  = require('tippy.js');
const _                      = require('underscore');

const CustomerFormView = Framework.View.extend({
  className: 'customer-form-view',
  template: templates['customer_form'],

  templateContext () {
    return {
      betaAlertsTitle: 'Beta Alerts currently consist of "Failure to Achieve Set Point" alerts.  Please provide your feedback on Beta alerts via the feedback button.',
      majorAlertsTitle: 'Major alerts consist of issues where some functionality has been lost or reduced and may need attention as soon as is convenient.',
      criticalAlertsTitle: 'Critical alerts consist of issues where primary functionality has been lost and likely require prompt attention.',
      notificationRecipients: this.notificationRecipients && this._buildNotificationRecipientOptions(),
      isTrane: Theme.isTrane()
    };
  },

  bindings: {
    'input[name=firstName]': {
      observe: 'firstName',
      onSet (val) { return this.inputFormatter.scrubBlankAndTrim(val); }
    },
    'input[name=lastName]': {
      observe: 'lastName',
      onSet (val) { return this.inputFormatter.scrubBlankAndTrim(val); }
    },
    'input[name=companyName]': 'companyName',
    'input[name=address1]': 'address1',
    'input[name=address2]': 'address2',
    'input[name=city]': 'city',
    'select[name=state]': 'state',
    'input[name=zip]': {
      observe: 'zip',
      onSet (val) { return this.inputFormatter.cleanPostalCode(val); }
    },
    'input[name=email]': 'email',
    'textarea[name=note]': 'note',
    'input[name=phone]': {
      observe: 'phone',
      onSet (val) { return this.inputFormatter.cleanPhone(val); },
      update ($el, val) {
        // Call the default implementation of `update`
        $el.val(val);
        // When the phone number is updated by stickit, the browser doesn't
        // fire `input` events, so the input mask doesn't get updated on
        // initial render, so trigger it manually after stickit has updated
        // the DOM, but only if the value is truthy so that if phone is
        // undefined, it won't try to update the input mask
        if (val) { return $el.trigger('input'); }
      }
    },
    'input[name=majorAlerts]': 'majorAlerts',
    'input[name=criticalAlerts]': 'criticalAlerts',
    'input[name=betaAlerts]': 'betaAlerts'
  },

  initialize (options) {
    Framework.View.prototype.initialize.apply(this, arguments);

    this.notificationRecipients = options.notificationRecipients;

    this.inputFormatter = new InputFormatter();
  },

  onRender () {
    if (!this.$el.hasClass(this.className)) { this.$el.addClass(this.className); }

    _.each(this.$('[data-tooltip]'), element =>
      tippy(element, {
        arrow: true,
        position: 'top-start'
      })
    );

    new RequiredFieldsStylizer(this.model, this.el).style();
    return new InputMask(this.el, 'input[name="phone"]').mask('(000) 000-0000');
  },

  _buildNotificationRecipientOptions () {
    return _.chain(this.notificationRecipients.models)
      .map(recipient => {
        return {
          id: recipient.id,
          email: recipient.get('email'),
          name: recipient.get('name'),
          selected: this.model.isNew() || recipient.subscribedToCustomer(this.model)
        };
      })
      .sortBy(recipient => recipient.name.toLowerCase())
      .value();
  }
});

module.exports = CustomerFormView;
