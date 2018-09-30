define(function (require) {
  require('sinon');
  require('spec/spec_helper');
  require('template_helpers');

  const Backbone    = require('backbone');
  const Factories   = require('spec/_support/factories');
  const Honeybadger = require('honeybadger-js');

  const FormHelper   = require('utils/form_helper');

  const ChangeGroupView = require('systems/views/change_group_view');

  describe('ChangeGroupView', function () {
    beforeEach(function () {
      const system1 = Factories.build('system', {group: 'group 1'});
      const system2 = Factories.build('system', {group: 'group 2'});

      this.model = system1;
      this.model.url = () => 'fake url';
      this.modelSaveSpy = sinon.spy(this.model, 'save');

      this.view = new ChangeGroupView({
        model: this.model,
        collection: new Backbone.Collection([system1, system2])
      });
    });

    afterEach(function () {
      this.model.save.restore();
    });

    it('renders the group selector', function () {
      expect(this.view.render().$('#group-selector').length).toBeTruthy();
    });

    describe('#saveModel', function () {
      describe('without changes', function () {
        beforeEach(function () {
          sinon.stub(this.view.groupSelector, 'isDirty').returns(false);

          this.$el = this.view.render().$el;
        });

        it('does not save the model', function () {
          this.$el.find('button.submit').click();

          expect(this.modelSaveSpy.called).toBeFalsy();
        });

        it('fakes a successful save', function () {
          const saveSucceededSpy = sinon.spy(FormHelper.prototype, 'saveSucceeded');

          this.$el.find('button.submit').click();

          expect(saveSucceededSpy.called).toBeTruthy();

          FormHelper.prototype.saveSucceeded.restore();
        });
      });

      describe('with changes', function () {
        beforeEach(function () {
          this.$el = this.view.render().$el;

          this.$el.find('#group-selector').val('group 2');

          this.$el.find('button.submit').click();
        });

        describe('with a server error', function () {
          beforeEach(function () {
            this.saveFailedSpy = sinon.spy(FormHelper.prototype, 'saveFailed');
            this.honeybadgerNotifySpy = sinon.spy(Honeybadger, 'notify');

            const spyCall = this.modelSaveSpy.getCall(0);
            const options = spyCall.args[1];
            options.error(null, { status: 500 });
          });

          afterEach(function () {
            FormHelper.prototype.saveFailed.restore();
            Honeybadger.notify.restore();
          });

          it('displays a server error message', function () {
            expect(this.saveFailedSpy.calledWith({ status: 500 }, true)).toBeTruthy();
          });
        });

        describe('with a success response', function () {
          beforeEach(function () {
            this.saveSucceededSpy = sinon.spy(FormHelper.prototype, 'saveSucceeded');
            const options = this.modelSaveSpy.getCall(0).args[1];
            options.success();
          });

          afterEach(() => FormHelper.prototype.saveSucceeded.restore());

          it('marks the save as succeeded', function () {
            expect(this.saveSucceededSpy.called).toBeTruthy();
          });
        });
      });
    });
  });
});
