/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
class Dialogs {
  static error (message) {
    return $.prompt(`<h1>${I18n.t('javascripts.framework.error_title')}</h1><p>${message}</p>`);
  }

  static confirm (options) {
    if (options == null) { options = {}; }

    if (options.buttons == null) {
      options.buttons = [I18n.t('javascripts.framework.ok'), I18n.t('javascripts.framework.cancel')];
    }

    const buttons = {};
    for (let button of Array.from(options.buttons.reverse())) {
      buttons[button] = _.size(buttons) === (options.buttons.length - 1);
    }

    options.buttons = buttons;
    const defaults = {
      title: I18n.t('javascripts.framework.confirmation_title'),
      message: I18n.t('javascripts.framework.are_you_sure')
    };

    _.extend(defaults, options);

    const text = `<h1>${defaults.title}</h1><p>${defaults.message}</p>`;

    return $.prompt(text, {
      buttons: defaults.buttons,
      focus: 0,
      submit (value) {
        if ((typeof defaults.confirm === 'function') && value) {
          defaults.confirm();
        }
        return true;
      }
    });
  }
}

module.exports = Dialogs;
