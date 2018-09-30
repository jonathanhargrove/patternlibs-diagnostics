define(function (require) {
  require('spec/spec_helper');
  const Backbone                         = require('backbone');
  const Q                                = require('q');
  const TermsAndConditionsAcceptanceView = require('root/views/terms_and_conditions_acceptance_view');

  require('sinon');

  describe('TermsAndConditionsAcceptanceView', function () {
    beforeEach(function () {
      this.model = new Backbone.Model();
      this.model.url = () => 'whydoIhavetospecifythis';

      this.saveDeferred = Q.defer();

      this.saveStub = sinon.stub(this.model, 'save');
      this.saveStub.returns(this.saveDeferred.promise);

      this.view = new TermsAndConditionsAcceptanceView({model: this.model});
      this.$el = this.view.render().$el;
    });

    describe('waitForAcceptance', () =>
      it("returns a promise from the view's deferred", function () {
        expect(this.view.waitForAcceptance()).toBe(this.view.deferred.promise);
      })
    );

    describe('accepting terms', function () {
      beforeEach(function () {
        this.$el.find('#accept').click();
      });

      it("sets the model's termsUpToDate", function () {
        expect(this.model.get('termsUpToDate')).toBe(true);
      });

      it('saves the model', function () {
        expect(this.saveStub.called).toBe(true);
      });

      describe('when the save succeeds', function () {
        beforeEach(function () {
          this.saveDeferred.resolve();
        });

        it("resolves the view's deferred", function () {
          // in the success case, we expect a tautology;
          // in the fail case, we expect a contradiction
          this.view.waitForAcceptance()
            .then(() => expect(true).toBe(true))
            .fail(() => expect(true).toBe(false));
        });
      });
    });

    describe('rejecting terms', function () {
      beforeEach(function () {
        this.$el.find('#reject').click();
      });

      it('rejects the deferred', function () {
        // in the success case, we expect a contradiction;
        // in the fail case, we expect a tautology
        this.view.waitForAcceptance()
          .then(() => expect(false).toBe(true))
          .fail(() => expect(true).toBe(true));
      });
    });
  });
});
