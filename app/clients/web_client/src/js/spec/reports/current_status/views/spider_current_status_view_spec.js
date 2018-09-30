define(function (require) {
  require('spec/spec_helper');
  require('vendor/foundation');
  const Factories               = require('spec/_support/factories');
  const HandlebarsHelpers       = require('template_helpers');
  const ReportUtils             = require('devices/utils/spider_report_utils');
  const SpiderConfig            = require('devices/models/spider_config');
  const SpiderCurrentStatus     = require('current_status/models/spider_current_status');
  const SpiderCurrentStatusView = require('current_status/views/spider_current_status_view');
  const StreamView              = require('reports/common/stream_view');
  const templates               = require('templates');
  const _                       = require('underscore');

  const SpiderCurrentStatusViewConfigSpecs = require('./_spider_current_status_view_config_spec');

  const handlebarsHelpers = new HandlebarsHelpers();
  const friendly = handlebarsHelpers.friendlyNDM.bind(handlebarsHelpers);

  describe('SpiderCurrentStatusView', function () {
    beforeEach(function () {
      this.model = new SpiderCurrentStatus({
        deviceId: 'xyz123',
        firmwareVersion: '1.0.0',
        connected: true,
        rssi: 50,
        thermostatLoadValue: null,
        thermostatAirflowPercentage: null,
        outdoorCoilTemperature: 1,
        outdoorLiquidTemperature: 2,
        outdoorY1Signal: true,
        outdoorY2Signal: true,
        outdoorSovSignal: true,
        outdoorLiquidPressure: 7,
        outdoorGasPressure: 8,
        outdoorCompressorCurrent: 9,
        outdoorCompressorSuctionTemperature: 37,
        outdoorFanCurrent: 10,
        indoorY1Signal: true,
        indoorY2Signal: true,
        indoorGSignal: true,
        indoorW1Signal: true,
        indoorW2Signal: true,
        indoorW3Signal: true,
        indoorOSignal: true,
        indoorCondensateSwitch: 'open',
        indoorBKSignal: 19,
        indoorCoilTemperature: 20,
        indoorGasLineTemperature: 22,
        indoorReturnAirTemperature: 23,
        indoorSupplyAirTemperature: 24,
        indoorLiquidTemperature: 25,
        indoorAmbientTemperature: 26,
        indoorAirPressureRise: 27,
        indoorBlowerCurrent: 28
      });

      this.spider = Factories.create('spider');
      this.configModel = new SpiderConfig(null, {model: this.spider});
      this.configModel.selectAll();
      this.view = new SpiderCurrentStatusView({configModel: this.configModel, model: this.model});
      this.view.render();
    });

    it('is a StreamView', function () {
      expect(this.view instanceof StreamView).toBe(true);
    });

    it('renders current SpiderCurrentStatus values', function () {
      const expectedValues = {
        deviceId: 'xyz123',
        firmwareVersion: '1.0.0',
        rssi: '50',
        outdoorCoilTemperature: '1.0°',
        outdoorLiquidTemperature: '2.0°',
        outdoorY1Signal: 'true',
        outdoorY2Signal: 'true',
        outdoorSovSignal: 'true',
        outdoorLiquidPressure: '7 psig',
        outdoorGasPressure: '8 psig',
        outdoorCompressorCurrent: '9 A',
        outdoorFanCurrent: '10 A',
        indoorY1Signal: 'true',
        indoorY2Signal: 'true',
        indoorGSignal: 'true',
        indoorW1Signal: 'true',
        indoorW2Signal: 'true',
        indoorW3Signal: 'true',
        indoorOSignal: 'true',
        indoorCondensateSwitch: 'open',
        indoorBKSignal: '19',
        indoorCoilTemperature: '20.0°',
        indoorGasLineTemperature: '22.0°',
        indoorReturnAirTemperature: '23.0°',
        indoorSupplyAirTemperature: '24.0°',
        indoorLiquidTemperature: '25.0°',
        indoorAirPressureRise: '0.27 "H2O',
        indoorBlowerCurrent: '28 A'
      };

      for (var attr in expectedValues) {
        var label;
        const container = (() => {
          switch (false) {
            case !/^indoor/.test(attr): return '.indoor';
            case !/^outdoor/.test(attr): return '.outdoor';
            default: return '.status';
          }
        })();

        label = this.view.$(`${container} .field-label:contains(${friendly(attr)})`);

        expect(label.length).toEqual(1);

        const value = label.siblings('.field-value');

        expect(value.text().trim()).toEqual(expectedValues[attr].toString());
      }
    });

    it('retains a reference to configModel', function () {
      expect(this.view.configModel).toEqual(this.configModel);
    });

    it('properly renders sensors disabled in configModel', function () {
      this.configModel.set('outdoorCoilTemperature', false);
      this.view.render();

      ReportUtils.OUTDOOR_ATTRIBUTES.forEach(attr => {
        const friendlyAttr = friendly(attr);
        if (attr === 'outdoorCoilTemperature') {
          expect(this.view.$(`.outdoor .disabled.field .field-label:contains(${friendlyAttr})`).length).toEqual(1);
          expect(this.view.$('.outdoor .disabled.field .field-value:contains("Not Tracked")').length).toEqual(1);
        } else {
          expect(this.view.$(`.outdoor :not(.disabled).field .field-label:contains("${friendlyAttr}")`).length).toEqual(1);
        }
      });

      ReportUtils.INDOOR_ATTRIBUTES.forEach(attr => {
        const friendlyAttr = friendly(attr);
        expect(
          this.view.$(`.indoor :not(.disabled).field .field-label:contains("${friendlyAttr}")`).length
        ).toEqual(1);
      });
    });

    it('renders descriptions for sensors that have one', function () {
      _.each(HandlebarsHelpers.NDM_DESCRIPTIONS, (description, attr) => {
        expect(
          this.view.$(`[data-sensor=${attr}] .field-description`).text()
        ).toEqual(`(${description})`);
      });
    });

    describe('empty state', function () {
      beforeEach(function () {
        // Strip HTML from templates for test verification
        this.noDataText   = $(templates['no_stream_data']()).text();
      });

      describe('data has not been received', function () {
        beforeEach(function () {
          this.view.render({watermark: true});
        });

        it('renders "no_stream_data"', function () {
          expect(this.view.$el.text()).toContain(this.noDataText);
        });
      });
    });

    describe('configuration', SpiderCurrentStatusViewConfigSpecs);
  });
});
