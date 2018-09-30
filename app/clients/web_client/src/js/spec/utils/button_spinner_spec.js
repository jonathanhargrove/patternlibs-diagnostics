define(function (require) {
  require('spec/spec_helper');
  const ButtonSpinner = require('utils/button_spinner');

  describe('ButtonSpinner', function () {
    beforeEach(function () {
      this.$button = $('<button>Save</button>');
      this.buttonSpinner = new ButtonSpinner().start(this.$button);
    });

    afterEach(function () {
      this.$button.remove();
    });

    describe('construction', function () {
      it('disables the button', function () {
        expect(this.$button.prop('disabled')).toBeTruthy();
      });

      it('replaces the content with a spinner', function () {
        expect(this.$button.text()).not.toBe('Save');
        expect(this.$button.find('.button-spinner').length).toBeTruthy();
      });
    });

    describe('#stop', function () {
      beforeEach(function () {
        this.buttonSpinner.stop();
      });

      it('enables the button', function () {
        expect(this.$button.prop('disabled')).toBeFalsy();
      });

      it('places the original content back into the button', function () {
        expect(this.$button.text()).toBe('Save');
      });

      it('lets go of the reference to the button in the DOM', function () {
        expect(this.buttonSpinner.$button).toBeNull();
      });

      it('can be called subsequently', function () {
        // second call to stop doesn't raise an error
        this.buttonSpinner.stop();
      });
    });
  });
});
