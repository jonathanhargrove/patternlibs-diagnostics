/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
define(function (require) {
  require('jquery-mask-plugin');

  class InputMask {
    constructor (el, inputSelector) {
      this.$el = $(el);
      if (this.$el) {
        this.input = this.$el.find(inputSelector);
      }
    }

    mask (format) {
      if (this.input) {
        return this.input.mask(format);
      }
    }
  }

  return InputMask;
});
