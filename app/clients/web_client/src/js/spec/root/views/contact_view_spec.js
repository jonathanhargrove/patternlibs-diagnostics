define(function (require) {
  require('spec/spec_helper');
  const ContactView             = require('root/views/contact_view');
  const Session                 = require('root/models/session');
  const RestrictionsManagerView = require('restrictions/views/restrictions_manager_view');
  const ModalDialog             = require('utils/modal_dialog');
  const Theme                   = require('utils/theme');

  require('sinon');

  describe('ContactView', function () {
    beforeEach(function () {
      $.fn.foundation = sinon.stub();

      Theme.set('nexia');
      this.session = new Session();
      this.view = new ContactView({session: this.session});

      this.view.render();
    });

    afterEach(function () {
      $.fn.foundation = undefined;
    });

    describe('#render', function () {
      describe('with a nexia theme', () =>
        it('renders a nexia feedback form', function () {
          const iframe = this.view.$el.find('iframe');

          expect(iframe.length).toBeGreaterThan(0);
          expect(iframe[0].src).toEqual(this.view.NEXIA_FORM);
        })
      );

      describe('with a trane theme', () =>
        it('renders a trane feedback form', function () {
          Theme.set('trane');

          const view = new ContactView({session: this.session});

          view.render();

          const iframe = view.$el.find('iframe');

          expect(iframe.length).toBeGreaterThan(0);
          expect(iframe[0].src).toEqual(view.TRANE_FORM);
        })
      );
    });

    it('renders a Feature Code button', function () {
      expect(this.view.$el.find('button.feature-code').length).toEqual(1);
    });

    describe('Feature Code button', function () {
      beforeEach(function () {
        this.modalSpy = sinon.spy(ModalDialog.prototype, 'show');
        this.restrictionsManagerViewSpy = sinon.spy(RestrictionsManagerView.prototype, 'render');
        this.view.$el.find('button.feature-code').click();
      });

      afterEach(function () {
        this.modalSpy.restore();
        this.restrictionsManagerViewSpy.restore();
      });

      it('renders the RestrictionsManagerView as a modal', function () {
        expect(this.modalSpy.called).toBe(true);
        expect(this.restrictionsManagerViewSpy.called).toBe(true);
      });
    });
  });
});
