define(function (require) {
  require('spec/spec_helper');
  const CurrentStatusList       = require('current_status/models/current_status_list');
  const Factories               = require('spec/_support/factories');

  describe('CurrentStatusList', function () {
    beforeEach(function () {
      this.device = Factories.create('thermostat');
      this.currentStatusList = new CurrentStatusList();
    });

    describe('#initialize', () =>
      it('creates an empty list', function () {
        expect(this.currentStatusList.length).toBe(0);
      })
    );

    describe('subscribing to the CurrentStatusList', function () {
      beforeEach(function () {
        this.currentStatusList.subscribe(this.device);
        this.report = this.currentStatusList.get(this.device.id);
      });

      it('adds a ThermostatCurrentStatus to the list', function () {
        expect(this.currentStatusList.length).toBe(1);
        expect(this.report).toBeDefined();
      });

      it('listens for changes to the ThermostatCurrentStatus', function () {
        expect(this.device.get('connected')).toBeUndefined();
        this.report.set('connected', true);
        expect(this.device.get('connected')).toEqual(true);
      });
    });

    describe('#unsubscribeAll', () =>
      it('removes all CurrentStatuses from the list', function () {
        this.currentStatusList.subscribe(this.device);

        const spider = Factories.build('spider');
        this.currentStatusList.subscribe(spider);
        expect(this.currentStatusList.length).toBe(2);

        this.currentStatusList.unsubscribeAll();

        expect(this.currentStatusList.length).toBe(0);
      })
    );
  });
});
