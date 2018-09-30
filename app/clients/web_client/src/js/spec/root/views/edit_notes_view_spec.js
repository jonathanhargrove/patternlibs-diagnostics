define(function (require) {
  require('spec/spec_helper');
  const Backbone      = require('backbone');
  const EditNotesView = require('root/views/edit_notes_view');
  const FormHelper    = require('utils/form_helper');
  const Honeybadger   = require('honeybadger-js');
  require('sinon');
  require('template_helpers');

  describe('EditNotesView', function () {
    beforeEach(function () {
      this.model = new Backbone.Model({note: 'note'});
      this.model.url = () => 'whydoIhavetospecifythis';
      this.modelSaveSpy = sinon.spy(this.model, 'save');
      this.view = new EditNotesView({model: this.model});
      this.$el = this.view.render().$el;
      this.saveSucceededSpy = sinon.spy(FormHelper.prototype, 'saveSucceeded');
    });

    afterEach(() => FormHelper.prototype.saveSucceeded.restore());

    describe('#saveModel', function () {
      describe('without changes', function () {
        it('does not save the model', function () {
          this.$el.find('button.submit').click();

          expect(this.modelSaveSpy.called).toBeFalsy();
        });

        it('fakes a successful save', function () {
          this.$el.find('button.submit').click();

          expect(this.saveSucceededSpy.called).toBeTruthy();
        });
      });

      describe('with changes', function () {
        beforeEach(function () {
          this.model.set('note', 'new note');
          this.$el.find('button.submit').click();
        });

        describe('with a server error', () =>
          beforeEach(function () {
            this.saveFailedSpy = sinon.spy(FormHelper.prototype, 'saveFailed');
            this.honeybadgerNotifySpy = sinon.spy(Honeybadger, 'notify');

            const spyCall = this.modelSaveSpy.getCall(0);
            const options = spyCall.args[1];
            options.error(null, { status: 500 });

            afterEach(function () {
              FormHelper.prototype.saveFailed.restore();
              Honeybadger.notify.restore();
            });

            it('displays a server error message', function () {
              expect(this.saveFailedSpy.calledWith(true)).toBeTruthy();
            });
          })
        );

        describe('with a success response', function () {
          beforeEach(function () {
            const options = this.modelSaveSpy.getCall(0).args[1];
            options.success();
          });

          it('marks the save as succeeded', function () {
            expect(this.saveSucceededSpy.called).toBeTruthy();
          });
        });

        describe('for a read-only view', function () {
          beforeEach(function () {
            this.view = new EditNotesView({model: this.model, readOnly: true});
            this.$el = this.view.render().$el;
            this.modelSaveSpy.reset();
          });

          it('does not save the model', function () {
            this.$el.find('button.submit').click();
            expect(this.modelSaveSpy.called).toBeFalsy();
          });

          it('fakes a successful save', function () {
            this.$el.find('button.submit').click();
            expect(this.saveSucceededSpy.called).toBeTruthy();
          });
        });
      });
    });
  });
});
