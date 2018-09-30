define(function (require) {
  require('spec/spec_helper');
  const TermsAndConditionsView = require('root/views/terms_and_conditions_view');
  const Theme                  = require('utils/theme');

  require('sinon');

  describe('TermsAndConditionsAcceptanceView', function () {
    beforeEach(function () {
      Theme.set('nexia');

      this.view = new TermsAndConditionsView();
    });

    afterEach(() => Theme.set('nexia'));

    describe('with a Nexia theme', () =>
      it('uses the Nexia Terms & Conditions template', function () {
        expect(this.view.render().$el.find('#nexia-ts-and-cs').length).toBeTruthy();
      })
    );

    describe('with a Trane theme', () =>
      it('uses the Trane Terms & Conditions template', function () {
        Theme.set('trane');

        this.view.initialize({});

        expect(this.view.render().$el.find('#trane-ts-and-cs').length).toBeTruthy();
      })
    );
  });
});
