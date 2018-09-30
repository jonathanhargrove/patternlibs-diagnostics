define(function (require) {
  require('spec/spec_helper');
  const Backbone    = require('backbone');
  const ModalDialog = require('utils/modal_dialog');

  describe('ModalDialog', function () {
    beforeEach(function () {
      this.sandbox = sinon.sandbox.create();
    });

    afterEach(function () {
      this.sandbox.restore();
    });

    it('decorates the view for foundation', function () {
      const $el = $('<div>');
      const view = {
        render () { return this; },
        $el,
        on () {}
      };

      new ModalDialog(view); // eslint-disable-line no-new

      expect($el.attr('class')).toMatch(/modal/);
      expect($el.attr('data-reveal')).toBeDefined();
    });

    describe('when the view is shown', function () {
      beforeEach(function () {
        this.view = new Backbone.View({ el: $('<div id="fake">')[0] });
        this.view.$el.foundation = this.sandbox.spy();

        $('body').append('<div id="main-content">');
      });

      afterEach(function () {
        $('#main-content').remove();
      });

      describe('with dismissable not set (or set to false)', function () {
        it('shows the modal dialog', function () {
          new ModalDialog(this.view, false).show();

          expect($('#fake').length).toBe(1);
          expect(this.view.$el.foundation.calledWith('reveal', 'open')).toBeTruthy();
        });
      });

      describe('with dismissable set', function () {
        it('dismisses when clicked off', function (done) {
          $('body').append('<div class="reveal-modal-bg">');

          new ModalDialog(this.view, true).show();

          this.view.on('closedModal', () => {
            expect($('#fake').length).toBe(0);

            done();
          });

          $('.reveal-modal-bg').click();
        });
      });
    });

    describe('when the view is saved/cancelled', function () {
      beforeEach(function () {
        this.view = new Backbone.View();
        this.view.$el = $('<div>');
        this.view.$el.foundation = function () {};
      });

      it('closes the modal dialog', function () {
        const removeSpy = sinon.spy(this.view, 'remove');

        new ModalDialog(this.view); // eslint-disable-line no-new

        this.view.trigger('cancel');

        expect(removeSpy.called).toBeTruthy();
      });

      it('removes the view', function () {
        const removeSpy = sinon.spy(this.view, 'remove');
        const offSpy = sinon.spy(this.view, 'off');

        new ModalDialog(this.view); // eslint-disable-line no-new

        this.view.trigger('cancel');

        expect(offSpy.called).toBeTruthy();
        expect(removeSpy.called).toBeTruthy();
      });
    });
  });
});
