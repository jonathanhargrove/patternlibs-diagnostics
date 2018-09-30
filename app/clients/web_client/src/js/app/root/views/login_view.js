/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Framework = require('nexia_framework');
const Honeybadger = require('honeybadger-js');
const ServerError  = require('root/server_error');
const Theme = require('utils/theme');
const Q = require('q');

const templates = require('templates');

const Dialogs = require('root/dialogs');
const ButtonSpinner = require('utils/button_spinner');

const LoginView = Framework.View.extend({
  template: templates['login'],

  templateContext () {
    return {
      title: this.title,
      isTraneTheme: Theme.isTrane()
    };
  },

  id: 'login-view',

  bindings: {
    'input[name=username]': 'username',
    'input[name=password]': 'password'
  },

  events: {
    'click .submit': 'authenticate'
  },

  initialize (options) {
    this.title = Theme.productName();

    $('#trane-legal-footer').hide();

    Framework.View.prototype.initialize.apply(this, arguments);

    this.model.clear();

    this.listenTo(this.model, 'invalid', (model, errors) => {
      if (this.buttonSpinner != null) {
        this.buttonSpinner.stop();
      }
      return Array.from(errors).map((error) =>
        this._showErrorMessage(error.attribute, error.message));
    });

    this.listenTo(this.model, 'sync', () => {
      if (this.buttonSpinner != null) {
        this.buttonSpinner.stop();
      }
      return this.trigger('loggedIn');
    });

    this.deferred = Q.defer();
  },

  waitForLogin () {
    return this.deferred.promise;
  },

  authenticate (e) {
    e.preventDefault();
    // BUG WORKAROUND:
    // Firefox saved username and password was not being set on the model on login form submission
    // Expliclty set the attributes on the session model fixes this
    this.model.attributes.username = $("input[name='username']").val();
    this.model.attributes.password = $("input[name='password']").val();

    Dialogs.clearErrors();
    this.buttonSpinner = new ButtonSpinner().start(e.currentTarget);

    return this.model.save(null, {validate: true})
      .then(() => this.deferred.resolve())
      .fail(xhr => {
        if (xhr.status !== 401) {
          Honeybadger.notify('Error authenticating', { context: { username: this.model.attributes.username } });
          ServerError.display();
        }
        return this.buttonSpinner.stop();
      });
  },

  _showErrorMessage (field, message) {
    const $elem = field ? this.$(`[name=${field}]`) : this.$('.errors');
    return Dialogs.addErrorToElem(message, $elem);
  }
});

module.exports = LoginView;
