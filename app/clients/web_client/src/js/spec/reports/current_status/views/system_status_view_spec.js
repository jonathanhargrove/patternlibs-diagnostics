define(function (require) {
  require('spec/spec_helper');
  const ThermostatCurrentStatus = require('current_status/models/thermostat_current_status');
  const SystemStatusView = require('current_status/views/system_status_view');

  describe('SystemStatusView', function () {
    describe("when there's one or fewer zones", () =>
      it('displays the single-zone info panel', function () {
        const currentStatus = new ThermostatCurrentStatus({zones: [1]});
        const view = new SystemStatusView({model: currentStatus});
        view.render();

        expect(view.$el.find('.multi-zone').length).toBe(0);
        expect(view.$el.find('.single-zone').length).toBe(1);
      })
    );

    describe("when there's more than one zone", () =>
      it('displays the multi-zone info panel', function () {
        const currentStatus = new ThermostatCurrentStatus({zones: [1, 2]});
        const view = new SystemStatusView({model: currentStatus});
        view.render();

        expect(view.$el.find('.multi-zone').length).toBe(1);
        expect(view.$el.find('.single-zone').length).toBe(0);
      })
    );

    describe('lastUpdatedAt', function () {
      describe('with time data', () =>
        it('does display "last updated"', function () {
          const currentStatus = new ThermostatCurrentStatus({lastUpdatedAt: '2014-05-15T10:44:51-06:00'});
          const view = new SystemStatusView({model: currentStatus});
          view.render();

          expect(view.$el.find('.last-updated-at').length).toBe(1);
        })
      );

      describe('without time data', () =>
        it("doesn't display 'last updated'", function () {
          const currentStatus = new ThermostatCurrentStatus({deviceId: ''});
          const view = new SystemStatusView({model: currentStatus});
          view.render();

          expect(view.$el.find('.last-updated-at').length).toBe(0);
        })
      );
    });

    describe('staticPressure', function () {
      describe('when it is invalid (32768)', function () {
        beforeEach(function () {
          const currentStatus = new ThermostatCurrentStatus({staticPressure: 32768, zones: [{name: 'firstZone'}, {name: 'lastZone'}]});
          this.view = new SystemStatusView({model: currentStatus});
          this.view.render();
        });

        it("renders '--'", function () {
          expect(this.view.$el.find('.field.static-pressure .field-value').html()).toBe('-- "WC');
        });
      });

      describe('when it is valid (hundredths of an inch of water column)', function () {
        beforeEach(function () {
          const currentStatus = new ThermostatCurrentStatus({staticPressure: 50.46, zones: [{name: 'firstZone'}, {name: 'lastZone'}]});
          this.view = new SystemStatusView({model: currentStatus});
          this.view.render();
        });

        it('renders the value in inches to 3 decimal points', function () {
          expect(this.view.$el.find('.field.static-pressure .field-value').html()).toBe('0.505 "WC');
        });
      });

      describe('rendering compressor delivered capacity', function () {
        describe('with compressor delivered capacity specified', function () {
          beforeEach(function () {
            this.compressorDeliveredCapacity = 50;
            const currentStatus = new ThermostatCurrentStatus({compressorDeliveredCapacity: this.compressorDeliveredCapacity});
            this.view = new SystemStatusView({model: currentStatus});
            this.view.render();
          });

          it('renders the compressor delivered capacity', function () {
            expect(this.view.$el.find('.field.compressor-capacity').length).toBe(1);
            expect(this.view.$el.find('.field.compressor-capacity .field-value').html()).toEqual(`${this.compressorDeliveredCapacity}%`);
          });
        });

        describe('with compressor delivered capacity undefined', function () {
          beforeEach(function () {
            this.compressorDeliveredCapacity = undefined;
            const currentStatus = new ThermostatCurrentStatus({compressorDeliveredCapacity: this.compressorDeliveredCapacity});
            this.view = new SystemStatusView({model: currentStatus});
            this.view.render();
          });

          it('does NOT render the compressor delivered capacity', function () {
            expect(this.view.$el.find('.field.compressor-capacity').length).toBe(0);
          });
        });
      });

      describe('rendering furnace delivered capacity', function () {
        describe('with furnace delivered capacity specified', function () {
          beforeEach(function () {
            this.furnaceDeliveredCapacity = 50;
            const currentStatus = new ThermostatCurrentStatus({furnaceDeliveredCapacity: this.furnaceDeliveredCapacity});
            this.view = new SystemStatusView({model: currentStatus});
            this.view.render();
          });

          it('renders the furnace delivered capacity', function () {
            expect(this.view.$el.find('.field.furnace-capacity').length).toBe(1);
            expect(this.view.$el.find('.field.furnace-capacity .field-value').html()).toEqual(`${this.furnaceDeliveredCapacity}%`);
          });
        });

        describe('with furnace delivered capacity undefined', function () {
          beforeEach(function () {
            this.furnaceDeliveredCapacity = undefined;
            const currentStatus = new ThermostatCurrentStatus({furnaceDeliveredCapacity: this.furnaceDeliveredCapacity});
            this.view = new SystemStatusView({model: currentStatus});
            this.view.render();
          });

          it('does NOT render the furnace delivered capacity', function () {
            expect(this.view.$el.find('.field.furnace-capacity').length).toBe(0);
          });
        });
      });

      describe('rendering system status with stages', function () {
        beforeEach(function () {
          this.operatingStatus = 'cooling';
        });

        describe('with no stage info', function () {
          beforeEach(function () {
            const currentStatus = new ThermostatCurrentStatus({operatingStatus: this.operatingStatus});
            this.view = new SystemStatusView({model: currentStatus});
            this.view.render();
          });

          it('Does not show stages in the status label', function () {
            expect(this.view.$el.find('.field.sys-status .field-label').html()).toBe('Sys Status');
          });

          it('Shows the operating status in the status field', function () {
            expect(this.view.$el.find('.field.sys-status .field-value').html()).toBe(this.operatingStatus);
          });
        });

        describe('with cooling stages', function () {
          beforeEach(function () {
            this.operatingStage = 2;
            const statusInfo = {
              operatingStatus: this.operatingStatus,
              coolingOperatingStages: {
                compressorOperatingStage: this.operatingStage
              }
            };
            const currentStatus = new ThermostatCurrentStatus(statusInfo);

            this.view = new SystemStatusView({model: currentStatus});
            this.view.render();
          });

          it('Does not show stages in the status label', function () {
            expect(this.view.$el.find(".field-label:contains('Sys Status')").length).toBe(1);
          });

          it('Shows the operating status in the status field', function () {
            const stageInfo = `${this.operatingStatus} STG ${this.operatingStage}`;
            expect(this.view.$el.find(`.field-value:contains('${stageInfo}')`).length).toBe(1);
          });
        });

        describe('with heating stages', function () {
          beforeEach(function () {
            this.operatingStatus = 'heating';
            this.operatingStage  = 2;
            const statusInfo = {
              operatingStatus: this.operatingStatus,
              heatingOperatingStages: {
                indoorOperatingStage: this.operatingStage
              }
            };
            const currentStatus    = new ThermostatCurrentStatus(statusInfo);

            this.view = new SystemStatusView({model: currentStatus});
            this.view.render();
          });

          it('Does not show stages in the status label', function () {
            expect(this.view.$el.find(".field-label:contains('Sys Status')").length).toBe(1);
          });

          it('Shows the operating status in the status field', function () {
            const stageInfo = `${this.operatingStatus} STG ${this.operatingStage}`;
            expect(this.view.$el.find(`.field-value:contains('${stageInfo}')`).length).toBe(1);
          });
        });

        describe('with indoor and outdoor stages', function () {
          beforeEach(function () {
            this.operatingStatus = 'heating';
            this.idStage = 2;
            this.odStage = 1;
            const statusInfo = {
              operatingStatus: this.operatingStatus,
              heatingOperatingStages: {
                indoorOperatingStage: this.idStage,
                outdoorOperatingStage: this.odStage
              }
            };
            const currentStatus    = new ThermostatCurrentStatus(statusInfo);

            this.view = new SystemStatusView({model: currentStatus});
            this.view.render();
          });

          it('Shows stages in the status label', function () {
            expect(this.view.$el.find(".field-label:contains('outdoor Status')").length).toBe(1);
            expect(this.view.$el.find(".field-label:contains('indoor Status')").length).toBe(1);
          });

          it('Shows the operating status in the status field', function () {
            const odStageInfo = `${this.operatingStatus} STG ${this.odStage}`;
            expect(this.view.$el.find(`.field-value:contains('${odStageInfo}')`).length).toBe(1);
            const idStageInfo = `${this.operatingStatus} STG ${this.idStage}`;
            expect(this.view.$el.find(`.field-value:contains('${idStageInfo}')`).length).toBe(1);
          });
        });
      });
    });
  });
});
