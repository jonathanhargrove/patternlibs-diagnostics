/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Framework              = require('nexia_framework');
const TermsAndConditionsView = require('root/views/terms_and_conditions_view');
const Honeybadger            = require('honeybadger-js');
const ServerError            = require('root/server_error');
const Q                      = require('q');

const templates = require('templates');

const Dialogs = require('root/dialogs');
const ButtonSpinner = require('utils/button_spinner');

const TermsAndConditionsAcceptanceView = Framework.View.extend({
  template: templates['terms_and_conditions_acceptance'],

  id: 'login-view',

  events: {
    'click #accept': 'accept',
    'click #reject': 'reject'
  },

  initialize () {
    Framework.View.prototype.initialize.apply(this, arguments);

    this.deferred = Q.defer();
  },

  waitForAcceptance () {
    return this.deferred.promise;
  },

  reject (e) {
    e.preventDefault();
    return this.deferred.reject();
  },

  accept (e) {
    e.preventDefault();

    Dialogs.clearErrors();
    this.buttonSpinner = new ButtonSpinner().start(e.currentTarget);

    this.model.set('termsUpToDate', true);

    return this.model.save(null, {validate: false, patch: true})
      .then(() => this.deferred.resolve())
      .fail(xhr => {
        if (xhr.status !== 401) {
          Honeybadger.notify('Error accepting terms', { context: { username: this.model.attributes.username } });
          ServerError.display();
        }
        return this.buttonSpinner.stop();
      });
  },

  render () {
    Framework.View.prototype.render.apply(this, arguments);

    const contentView = new TermsAndConditionsView().render();
    this.$('#terms-and-conditions-content').html(contentView.$el.html());

    return this;
  }
});

module.exports = TermsAndConditionsAcceptanceView;
