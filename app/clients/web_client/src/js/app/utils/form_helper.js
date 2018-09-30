/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS201: Simplify complex destructure assignments
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

const Dialogs = require('root/dialogs');
const Honeybadger = require('honeybadger-js');
const ServerError = require('root/server_error');
const ButtonSpinner = require('utils/button_spinner');
const _ = require('underscore');

class FormHelper {
  constructor (options) {
    this.view = options.view;
    this.recordName = options.recordName;
    this.model = options.model || options.view.model;
    this.defaultSelector = options.defaultSelector || '[name=save]';

    if (!this.model) { this.model = this.view.model; }
    this.previousAttributes = _.clone(this.model.attributes);

    this.view.listenTo(this.model, 'invalid', (model, errors) => {
      this.view.$el.find('.cancel').removeClass('disable-anchor');

      this.buttonSpinner.stop();

      errors.map((error) => this.showErrorMessage(error.attribute, error.message));
    });

    this.view.on('cancel', () => this._undoChanges());
  }

  showErrorMessage (field, message) {
    const $elem = field
      ? this.view.$(`[name=${field}]`).last() // pick last field in case of multiple radio buttons with the same name
      : this.view.$(this.defaultSelector);
    Dialogs.addErrorToElem(message, $elem);
  }

  beginSave ($button = null) {
    this.view.$el.find('.cancel').addClass('disable-anchor');

    if (!$button) { $button = this.view.$el.find('.submit'); }
    Dialogs.clearErrors();
    this.buttonSpinner = new ButtonSpinner().start($button);
  }

  saveSucceeded () {
    this.view.trigger('save', this.model);
    this.buttonSpinner.stop();
  }

  saveFailed (response, showServerError = true) {
    if (showServerError) {
      Honeybadger.notify('Error saving in FormHelper#saveFailed', { context: { response, model: this.model.attributes } });
      ServerError.display();
    }
    this.view.$el.find('.cancel').removeClass('disable-anchor');
    this.buttonSpinner.stop();
  }

  confirmCancel () {
    if (this._changed()) {
      if (confirm('Are you sure you want to cancel?')) {
        this.view.trigger('cancel');
      }
    } else {
      this.view.trigger('cancel');
    }
  }

  confirmDelete ($button) {
    if (confirm(`Are you sure you want to delete this ${this.recordName}? This cannot be undone.`)) {
      this.buttonSpinner = new ButtonSpinner().start($button);
      return this.model.destroy({
        wait: true,
        success: () => {
          this.view.trigger('deleted');
          this.buttonSpinner.stop();
        },
        error: () => {
          Honeybadger.notify('Error destroying in FormHelper#confirmDelete', { context: { model: this.model.attributes } });
          ServerError.display();
          this.buttonSpinner.stop();
        }
      });
    }
  }

  // HACK: for some reason the view's changedAttributes() isn't working properly,
  // likely due to stickit. So we're doing the comparison manually via _changed().
  _changed () {
    return (JSON.stringify(this.model.attributes) !== JSON.stringify(this.previousAttributes));
  }

  _undoChanges () {
    if (this.model.isNew()) {
      this.model.destroy();
    } else {
      this.model.set(this.previousAttributes);
    }
  }
}

module.exports = FormHelper;
