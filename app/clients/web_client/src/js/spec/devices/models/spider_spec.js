define(function (require) {
  require('spec/spec_helper');
  const Spider = require('devices/models/spider');

  const SpiderCurrentStatus = require('current_status/models/spider_current_status');
  const SpiderCurrentStatusView = require('current_status/views/spider_current_status_view');

  const SpiderRuntimeHistory = require('runtime_history/models/spider_runtime_history');
  const SpiderRuntimeHistoryView = require('runtime_history/views/spider_runtime_history_view');

  require('sinon');

  describe('Spider', function () {
    beforeEach(function () {
      this.device = new Spider({deviceId: '12345678'});
    });

    it("indicates it's a spider", function () {
      expect(this.device.isSpider()).toBe(true);
    });

    it("doesn't indicate it's a thermostat", function () {
      expect(this.device.isThermostat()).toBeFalsy();
    });

    it('returns a current status model', function () {
      const currentStatus = this.device.currentStatusModel();
      expect(currentStatus.constructor).toEqual(SpiderCurrentStatus);
    });

    it('returns a current status view', function () {
      const currentStatusView = this.device.currentStatusView();
      expect(currentStatusView.constructor).toEqual(SpiderCurrentStatusView);
      expect(currentStatusView.model.constructor).toEqual(SpiderCurrentStatus);
    });

    it('returns a runtime history model', function () {
      const runtimeHistory = this.device.runtimeHistoryModel();
      expect(runtimeHistory.constructor).toEqual(SpiderRuntimeHistory);
    });

    describe('validations', function () {
      beforeEach(function () {
        this.device = new Spider();
      });

      describe('deviceId is missing', function () {
        beforeEach(function () {
          this.device.unset('deviceId');
        });

        it('is not valid', function () {
          expect(this.device.isValid()).toBe(false);
        });
      });

      describe('deviceId is present, but has too few characters', function () {
        beforeEach(function () {
          this.device.set('deviceId', '12');
        });

        it('is not valid', function () {
          expect(this.device.isValid()).toBe(false);
        });
      });

      describe('deviceId is present, but has too many characters', function () {
        beforeEach(function () {
          this.device.set('deviceId', '1234567890123');
        });

        it('is not valid', function () {
          expect(this.device.isValid()).toBe(false);
        });
      });

      describe('deviceId is present and is a 10-character serial number', function () {
        beforeEach(function () {
          this.device.set('deviceId', '1417C1ABJX');
        });

        it('is valid', function () {
          expect(this.device.isValid()).toBe(true);
        });
      });

      describe('deviceId is present and 12 digits', function () {
        beforeEach(function () {
          this.device.set('deviceId', '00C004D81234');
        });

        it('is valid', function () {
          expect(this.device.isValid()).toBe(true);
        });
      });

      describe('deviceId has two valid IDs in it', function () {
        beforeEach(function () {
          this.device.set('deviceId', '00C004D81234; 00C004D81235');
        });

        it('is invalid', function () {
          expect(this.device.isValid()).toBe(false);
        });
      });
    });

    describe('#runtimeHistoryView', function () {
      beforeEach(function () {
        this.runtimeHistoryView = this.device.runtimeHistoryView();
      });

      it('returns a runtime history view', function () {
        expect(this.runtimeHistoryView.constructor).toEqual(SpiderRuntimeHistoryView);
      });

      it('builds a runtime history model for the view', function () {
        expect(this.runtimeHistoryView.model.constructor).toEqual(SpiderRuntimeHistory);
      });

      it("passes any options into the model's runtime history model", function () {
        const { model } = this.device.runtimeHistoryView({dataSource: 'potato'});
        expect(model.dataSource).toEqual('potato');
      });
    });
  });
});
