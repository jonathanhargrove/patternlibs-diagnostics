define(function (require) {
  require('spec/spec_helper');
  const DevicesCollection = require('devices/models/devices_collection');
  const Spider = require('devices/models/spider');
  const AddSpiderView = require('devices/views/add_spider_view');
  const Dialogs = require('root/dialogs');
  const FormHelper = require('utils/form_helper');
  const Honeybadger = require('honeybadger-js');
  require('template_helpers');
  require('sinon');

  describe('AddSpiderView', function () {
    beforeEach(function () {
      this.devices = new DevicesCollection();
      this.device = new Spider({systemId: 'xyz123'});
      this.addSpider = new AddSpiderView({collection: this.devices, model: this.device});
      this.$el = this.addSpider.render().$el;
    });

    describe('save', function () {
      beforeEach(function () {
        this.viewTriggerSpy  = sinon.spy(this.addSpider, 'trigger');
        this.collectionCreateSpy = sinon.spy(this.addSpider.collection, 'create');

        const { $el } = this.addSpider.render();
        $el.find('button.submit').click();
      });

      describe('for a read-only view', function () {
        beforeEach(function () {
          this.collectionCreateSpy.reset();
          this.addSpider = new AddSpiderView({collection: this.devices, model: this.device, readOnly: true});
          this.alertSpy = sinon.spy(window, 'alert');
          const { $el } = this.addSpider.render();
          $el.find('button.submit').click();
        });

        afterEach(function () {
          this.alertSpy.restore();
        });

        it('does not create a new device', function () {
          expect(this.collectionCreateSpy.called).toBeFalsy();
        });

        it("alerts the user that add won't work", function () {
          expect(this.alertSpy.calledWith("Read-only view: can't add device")).toBeTruthy();
        });
      });

      describe('with a success response', function () {
        beforeEach(function () {
          const spyCall = this.collectionCreateSpy.getCall(0);
          const options = spyCall.args[1];
          options.success();
        });

        it('redirects after success', function () {
          expect(this.viewTriggerSpy.calledWith('save')).toBeTruthy();
        });
      });

      describe('with an error response', function () {
        describe('with a validation error', function () {
          beforeEach(function () {
            this.errorSpy = sinon.spy(Dialogs, 'addErrorToElem');
          });

          afterEach(function () {
            this.errorSpy.restore();
          });

          it('shows an error', function () {
            this.$el.find('.submit').click();

            expect(this.errorSpy.called).toBeTruthy();
          });
        });

        describe('with a server error', function () {
          beforeEach(function () {
            this.saveFailedSpy = sinon.spy(FormHelper.prototype, 'saveFailed');
            this.honeybadgerNotifySpy = sinon.spy(Honeybadger, 'notify');
            this.response = { status: 500 };

            const spyCall = this.collectionCreateSpy.getCall(0);
            const options = spyCall.args[1];
            options.error(null, this.response);
          });

          afterEach(function () {
            FormHelper.prototype.saveFailed.restore();
            Honeybadger.notify.restore();
          });

          it('displays a server error message', function () {
            expect(this.saveFailedSpy.calledWith(this.response, true)).toBeTruthy();
          });
        });
      });
    });
  });
});
