define(function (require) {
  require('spec/spec_helper');
  const SysConfig = require('sys_config/models/sys_config');

  describe('SysConfig', function () {
    beforeEach(function () {
      this.deviceModel = 'XL824';
      this.sysConfig = new SysConfig({deviceId: '12345678', deviceModel: this.deviceModel});
    });

    describe('#_update', () =>
      describe('when event is null', () =>
        it("doesn't blow up", function () {
          expect(() => this.sysConfig._update(null)).not.toThrow();
        })
      )
    );

    describe('#initialize', function () {
      it('has an deviceId', function () {
        expect(this.sysConfig.deviceId).toBe('12345678');
      });

      it('has an eventType', function () {
        expect(this.sysConfig.eventType).toBe('sys_config');
      });

      it('has an url for its event type and deviceId', function () {
        expect(this.sysConfig.url()).toBe('/stream/sys_config/12345678');
      });

      it('is NOT experimental', function () {
        expect(this.sysConfig.experimental).toBeFalsy();
      });

      describe('for a 950', function () {
        beforeEach(function () {
          this.deviceModel = 'XL950';
          this.sysConfig = new SysConfig({deviceId: '12345678', deviceModel: this.deviceModel});
        });

        it('is experimental', function () {
          expect(this.sysConfig.experimental).toBeTruthy();
        });
      });
    });
  });
});
