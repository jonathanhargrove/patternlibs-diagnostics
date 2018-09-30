const $ = require('jquery');

class ButtonSpinner {
  start (button) {
    this.$button = $(button);
    this.originalText = this.$button.html();

    this.$button.css('height', this.$button.outerHeight());
    this.$button.css('width', this.$button.outerWidth());

    this.$button.prop('disabled', true);
    this.$button.html('<div class="button-spinner">&nbsp;</div>');

    return this;
  }

  stop () {
    if (this.$button) {
      this.$button.prop('disabled', false);
      this.$button.html(this.originalText);
      this.$button = null;
    }
  }
};

module.exports = ButtonSpinner;
