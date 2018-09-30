/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
define(function (require) {
  require('spec/spec_helper');
  const Backbone      = require('backbone');
  const ButtonSpinner = require('utils/button_spinner');
  const Dialogs       = require('root/dialogs');
  const FormHelper    = require('utils/form_helper');
  const Framework     = require('nexia_framework');
  const Honeybadger   = require('honeybadger-js');
  const ServerError   = require('root/server_error');

  class FakeModel extends Framework.Model {}

  describe('FormHelper', function () {
    beforeEach(function () {
      this.model = new FakeModel({someAttribute: 'foo'});
      this.view = new Backbone.View({model: this.model});
      this.viewTriggerSpy = sinon.spy(this.view, 'trigger');

      this.formHelper = new FormHelper({view: this.view, recordName: 'fake model'});
      this.formHelper.beginSave();
    });

    describe("when a view triggers 'cancel'", function () {
      describe('with a new model', () =>
        it('destroys the model', function () {
          const modelDestroySpy = sinon.spy(this.model, 'destroy');

          this.view.trigger('cancel');

          expect(modelDestroySpy.called).toBeTruthy();
        })
      );

      describe('with an existing model', () =>
        it('resets the attributes back to the original attributes', function () {
          sinon.stub(this.model, 'isNew').returns(false);
          const modelSetSpy = sinon.spy(this.model, 'set');

          this.model.set('someAttribute', 'bar');
          this.view.trigger('cancel');

          expect(modelSetSpy.calledWith({someAttribute: 'foo'})).toBeTruthy();
        })
      );
    });

    describe("when a model triggers 'invalid'", function () {
      beforeEach(function () {
        this.buttonSpinnerStopSpy = sinon.spy(ButtonSpinner.prototype, 'stop');
        this.dialogErrorSpy = sinon.spy(Dialogs, 'addErrorToElem');
      });

      afterEach(function () {
        ButtonSpinner.prototype.stop.restore();
        Dialogs.addErrorToElem.restore();
      });

      it('stops the button spinner', function () {
        this.model.trigger('invalid', this.model, []);

        expect(this.buttonSpinnerStopSpy.called).toBeTruthy();
      });

      it('displays an error for each field that has an error', function () {
        this.view.$el = $("<div><input name='field'>");
        const error = { attribute: 'field', message: 'message' };
        this.model.trigger('invalid', this.model, [error]);

        expect(this.dialogErrorSpy.calledWith('message')).toBeTruthy();
        expect(this.dialogErrorSpy.getCall(0).args[1].attr('name')).toBe('field');
      });

      it('enables the cancel anchor', function () {
        this.view.$el.html("<a class='cancel disable-anchor'/>");
        const error = { attribute: 'field', message: 'message' };
        this.model.trigger('invalid', this.model, [error]);

        expect(this.view.$el.find('.cancel').hasClass('disable-anchor')).toBeFalsy();
      });

      describe("for an error without an 'attribute' on it", function () {
        beforeEach(function () {
          this.model = new FakeModel({someAttribute: 'foo'});
          this.view = new Backbone.View({model: this.model});
          this.view.$el = $("<div><div class='potato'></div><div><input name='field'><button name='save'>");
          this.error = { message: 'message' };
        });

        describe('with no defaultSelector set', function () {
          beforeEach(function () {
            this.formHelper = new FormHelper({view: this.view, recordName: 'fake model'});
            this.formHelper.beginSave();
            this.model.trigger('invalid', this.model, [this.error]);
          });

          it('displays an error after the save button', function () {
            const errorDiv = this.view.$('[name=save]').siblings('div.error-box');
            expect(errorDiv.length).toBe(1);
            expect(errorDiv.text()).toEqual(this.error.message);
          });
        });

        describe('with a defaultSelector set', function () {
          beforeEach(function () {
            this.formHelper = new FormHelper({view: this.view, recordName: 'fake model', defaultSelector: '.potato'});
            this.formHelper.beginSave();
            this.model.trigger('invalid', this.model, [this.error]);
          });

          it('displays an error after the defaultSelector', function () {
            const errorDiv = this.view.$('.potato').siblings('div.error-box');
            expect(errorDiv.length).toBe(1);
            expect(errorDiv.text()).toEqual(this.error.message);
          });
        });
      });
    });

    describe('#beginSave', function () {
      beforeEach(function () {
        this.dialogsClearErrorSpy = sinon.spy(Dialogs, 'clearErrors');
        this.buttonSpinnerStartSpy = sinon.spy(ButtonSpinner.prototype, 'start');

        this.$button = $("<button name='submit'>");
        this.view.$el.html("<a class='cancel'/>");

        new FormHelper({view: this.view}).beginSave(this.$button);
      });

      afterEach(function () {
        Dialogs.clearErrors.restore();
        ButtonSpinner.prototype.start.restore();
      });

      it('disables the cancel anchor', function () {
        expect(this.view.$el.find('.cancel').hasClass('disable-anchor')).toBeTruthy();
      });

      it('clears any previously display errors', function () {
        expect(this.dialogsClearErrorSpy.called).toBeTruthy();
      });

      it('creates a button spinner for the submit button', function () {
        expect(this.buttonSpinnerStartSpy.called).toBeTruthy();
        expect(this.buttonSpinnerStartSpy.getCall(0).args[0].attr('name')).toBe('submit');
      });
    });

    describe('#confirmCancel', function () {
      beforeEach(function () {
        this.confirmStub = sinon.stub(window, 'confirm');
      });

      afterEach(() => window.confirm.restore());

      describe("with a model that is not the view's model", function () {
        beforeEach(function () {
          this.otherModel = new FakeModel({someAttribute: 'bar'});
          this.formHelper = new FormHelper({view: this.view, model: this.otherModel, recordName: 'fake model', defaultSelector: '.potato'});
        });

        it('does not confirm when the view model changes', function () {
          this.model.set('someAttribute', 'potato');
          this.formHelper.confirmCancel();
          expect(this.confirmStub.called).toBeFalsy();
        });

        it('does confirms when the passed-in model changes', function () {
          this.otherModel.set('someAttribute', 'potato');
          this.formHelper.confirmCancel();
          expect(this.confirmStub.called).toBeTruthy();
        });
      });

      describe('with a model that has changed attributes', function () {
        beforeEach(function () {
          this.model.set('someAttribute', 'bar');
        });

        it('confirms cancelling', function () {
          this.formHelper.confirmCancel();

          expect(this.confirmStub.calledWith('Are you sure you want to cancel?')).toBeTruthy();
        });

        describe('with cancel confirmed', () =>
          it("triggers 'cancel' on the view", function () {
            this.confirmStub.returns(true);

            this.formHelper.confirmCancel();

            expect(this.viewTriggerSpy.calledWith('cancel')).toBeTruthy();
          })
        );

        describe('with cancelling not confirmed', () =>
          it("doesn't trigger 'cancel' on the view", function () {
            this.confirmStub.returns(false);

            this.formHelper.confirmCancel();

            expect(this.viewTriggerSpy.neverCalledWith('cancel')).toBeTruthy();
          })
        );
      });

      describe("with a model that doesn't have changed attributes", () =>
        it("triggers 'cancel' on the view", function () {
          this.formHelper.confirmCancel();

          expect(this.viewTriggerSpy.calledWith('cancel')).toBeTruthy();
        })
      );
    });

    describe('#confirmDelete', function () {
      beforeEach(function () {
        this.confirmStub = sinon.stub(window, 'confirm');
      });

      afterEach(() => window.confirm.restore());

      it('confirms deletion', function () {
        const $deleteButton = $('<button>');

        this.formHelper.confirmDelete($deleteButton);

        const message = 'Are you sure you want to delete this fake model? This cannot be undone.';
        expect(this.confirmStub.calledWith(message)).toBeTruthy();
      });

      describe('with deletion confirmed', function () {
        beforeEach(function () {
          this.confirmStub.returns(true);

          this.buttonSpinnerStartSpy = sinon.spy(ButtonSpinner.prototype, 'start');
          this.modelDestroySpy = sinon.spy(this.model, 'destroy');

          this.$deleteButton = $("<button name='delete'>");
        });

        afterEach(() => ButtonSpinner.prototype.start.restore());

        it('creates a button spinner on the delete button', function () {
          this.formHelper.confirmDelete(this.$deleteButton);

          expect(this.buttonSpinnerStartSpy.called).toBeTruthy();
          expect(this.buttonSpinnerStartSpy.getCall(0).args[0].attr('name')).toBe('delete');
        });

        it('destroys the model', function () {
          this.formHelper.confirmDelete(this.$deleteButton);

          expect(this.modelDestroySpy.called).toBeTruthy();
        });

        describe('; after the model is destroyed', function () {
          beforeEach(function () {
            this.buttonSpinnerStopSpy = sinon.spy(ButtonSpinner.prototype, 'stop');

            this.formHelper.confirmDelete(this.$deleteButton);

            const destroyOptions = this.modelDestroySpy.getCall(0).args[0];
            destroyOptions.success();
          });

          afterEach(() => ButtonSpinner.prototype.stop.restore());

          it('removes the button spinner from the delete button', function () {
            expect(this.buttonSpinnerStopSpy.called).toBeTruthy();
          });

          it("triggers 'deleted' on the view", function () {
            expect(this.viewTriggerSpy.calledWith('deleted')).toBeTruthy();
          });
        });

        describe('with a server error', function () {
          beforeEach(function () {
            this.buttonSpinnerStopSpy = sinon.spy(ButtonSpinner.prototype, 'stop');
            this.serverErrorDisplaySpy = sinon.spy(ServerError, 'display');
            this.honeybadgerNotifySpy = sinon.spy(Honeybadger, 'notify');

            this.formHelper.confirmDelete(this.$deleteButton);

            const destroyOptions = this.modelDestroySpy.getCall(0).args[0];
            destroyOptions.error();
          });

          afterEach(function () {
            ButtonSpinner.prototype.stop.restore();
            ServerError.display.restore();
            Honeybadger.notify.restore();
          });

          it('stops the button spinner', function () {
            expect(this.buttonSpinnerStopSpy.called).toBeTruthy();
          });

          it('displays a server error', function () {
            expect(this.serverErrorDisplaySpy.called).toBeTruthy();
          });

          it("tells honeybadger what's up", function () {
            expect(this.honeybadgerNotifySpy.called).toBeTruthy();
          });
        });
      });
    });

    describe('#saveSucceeded', function () {
      beforeEach(function () {
        this.buttonSpinnerStopSpy = sinon.spy(ButtonSpinner.prototype, 'stop');
        this.formHelper.beginSave();
        this.formHelper.saveSucceeded();
      });

      afterEach(() => ButtonSpinner.prototype.stop.restore());

      it("triggers 'save' on the model", function () {
        expect(this.viewTriggerSpy.calledWith('save', this.model)).toBeTruthy();
      });

      it('removes the button spinner', function () {
        expect(this.buttonSpinnerStopSpy.called).toBeTruthy();
      });
    });

    describe('#saveFailed', function () {
      beforeEach(function () {
        this.buttonSpinnerStopSpy = sinon.spy(ButtonSpinner.prototype, 'stop');
        this.serverErrorDisplaySpy = sinon.spy(ServerError, 'display');
        this.honeybadgerNotifySpy = sinon.spy(Honeybadger, 'notify');

        this.response = { xHr: { response: 'faked' } };

        this.formHelper.beginSave();
      });

      afterEach(function () {
        ButtonSpinner.prototype.stop.restore();
        ServerError.display.restore();
        Honeybadger.notify.restore();
      });

      it('removes the button spinner', function () {
        this.formHelper.saveFailed();

        expect(this.buttonSpinnerStopSpy.called).toBeTruthy();
      });

      it('enables the cancel anchor', function () {
        this.formHelper.saveFailed();

        expect(this.view.$el.find('.cancel').hasClass('disable-anchor')).toBeFalsy();
      });

      describe('with the serverError argument set to true', function () {
        beforeEach(function () {
          this.formHelper.saveFailed(this.response, true);
        });

        it('displays a generic server error', function () {
          expect(this.serverErrorDisplaySpy.called).toBeTruthy();
        });

        it('notifies Honeybadger', function () {
          expect(this.honeybadgerNotifySpy.called).toBeTruthy();
        });
      });

      describe('with the serverError argument set to false', function () {
        beforeEach(function () {
          this.formHelper.saveFailed(this.response, false);
        });

        it("doesn't display a generic server error", function () {
          expect(this.serverErrorDisplaySpy.called).toBeFalsy();
        });

        it("doesn't notify Honeybadger", function () {
          expect(this.honeybadgerNotifySpy.called).toBeFalsy();
        });
      });
    });
  });
});
