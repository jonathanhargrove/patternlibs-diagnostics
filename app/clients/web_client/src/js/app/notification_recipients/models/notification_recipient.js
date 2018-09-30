/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Framework = require('nexia_framework');
const ValidationFormats = require('utils/validation_formats');
const _ = require('underscore');

const NotificationRecipient = Framework.Model.extend({
  urlRoot: '',

  validations: {
    name: {
      required: true,
      fn (name) {
        return ValidationFormats.lengthMatcher(name, 200, 'Name');
      }
    },

    email: {
      required: 'Email is required',
      fn (email) {
        return (
          ValidationFormats.emailMatcher(email) ||
          ValidationFormats.lengthMatcher(email, 100, 'Email address')
        );
      }
    }
  },

  subscribedToCustomer (customer) {
    return (this.get('customerSelectionType') === 'all') ||
      _.contains(this.get('customerIds'), customer.id);
  }
});

module.exports = NotificationRecipient;
