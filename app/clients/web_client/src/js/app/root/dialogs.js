/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const $ = require('jquery');

class Dialogs {
  static initClass () {
    this.clearErrors = () => {
      this._removeModalBackground();
      return $('.error-box').remove();
    };

    this._clearDialogs = () => {
      this._removeModalBackground();
      return $('.dialog-box-modal').remove();
    };
  }

  static confirm (message, callback) {
    this._addModalBackground();

    const $dialog = $(`<div>${message}</div>`)
      .addClass('dialog-box-modal')
      .appendTo(document.body).hide().fadeIn();

    $('<button>Ok</button>')
      .appendTo($dialog)
      .css('margin-left', '20px')
      .click(() => {
        this._clearDialogs();
        if (_.isFunction(callback)) { return callback(); }
      });

    $('<button class="secondary-button">Cancel</button>')
      .appendTo($dialog)
      .click(this._clearDialogs);
    return $('button').css('margin-right', '5px');
  }

  static addErrorToElem (message, elem) {
    const $elem = $(elem);

    return $(`<div>${message}</div>`)
      .addClass('error-box error-box-arrow-top')
      .css({'marginTop': $elem.height() - 4})
      .insertAfter($elem).hide().fadeIn();
  }

  static error (message, callback) {
    this.clearErrors();
    this._addModalBackground();

    const $dialog = $(`<div>${message}</div>`)
      .addClass('error-box error-box-modal')
      .appendTo(document.body).hide().fadeIn();

    const $previouslyFocused = $(document.activeElement);
    return $('<button>Ok</button>')
      .appendTo($dialog)
      .css('margin-left', '20px')
      .focus()
      .click(() => {
        this.clearErrors();
        $previouslyFocused.focus();
        if (_.isFunction(callback)) { return callback(); }
      });
  }

  static _addModalBackground () {
    return $('<div></div>').addClass('modal-background').appendTo(document.body);
  }

  static _removeModalBackground () {
    return $('.modal-background').remove();
  }
};
Dialogs.initClass();

module.exports = Dialogs;
