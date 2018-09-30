define(function (require) {
  require('spec/spec_helper');
  const SpiderRuntimeHistory = require('runtime_history/models/spider_runtime_history');
  const Session = require('root/models/session');
  const Factories = require('spec/_support/factories');
  const moment = require('moment-timezone');
  const _ = require('underscore');

  const secondsOfSpiderDay = seconds => (seconds) + (24 * 60 * 60);

  const temperatureOccurrences = () =>
    [{ temperature: 72, occurredAt: secondsOfSpiderDay(2) },
      { temperature: 73, occurredAt: secondsOfSpiderDay(8) },
      { temperature: 74, occurredAt: secondsOfSpiderDay(9) },
      { temperature: 75, occurredAt: secondsOfSpiderDay(10) },
      { temperature: 76, occurredAt: secondsOfSpiderDay(12) },
      { temperature: 77, occurredAt: secondsOfSpiderDay(15) }]
  ;

  const pressureOccurrences = () =>
    [{ pressure: 72, occurredAt: secondsOfSpiderDay(2) },
      { pressure: 73, occurredAt: secondsOfSpiderDay(8) },
      { pressure: 74, occurredAt: secondsOfSpiderDay(9) }]
  ;

  const loadOccurrences = () =>
    [{ loadValue: 1, occurredAt: secondsOfSpiderDay(2) },
      { loadValue: 1.5, occurredAt: secondsOfSpiderDay(8) }]
  ;

  const airflowOccurrences = () =>
    [{ airflow: 2, occurredAt: secondsOfSpiderDay(2) },
      { airflow: 10, occurredAt: secondsOfSpiderDay(8) }]
  ;

  const disconnectOccurrences = () =>
    [{ occurredAt: secondsOfSpiderDay(2), state: 'started' },
      { occurredAt: secondsOfSpiderDay(8), state: 'stopped' }]
  ;

  describe('SpiderRuntimeHistory', function () {
    const jsTime = time => (time) * 1000;

    beforeEach(function () {
      this.session = new Session();
      this.fromTime = moment(jsTime(secondsOfSpiderDay(1))).format('YYYY-MM-DDTHH:mm:ssZ');
      this.toTime   = moment(jsTime(secondsOfSpiderDay(20))).format('YYYY-MM-DDTHH:mm:ssZ');
      this.timeZone = 'America/New_York';
      const device = Factories.create('spider', {dealerUuid: 1, deviceId: 1, timeZone: this.timeZone});
      this.runtimeHistory = new SpiderRuntimeHistory(device, {session: this.session});
    });

    describe('parsed data', () =>
      describe('#day', function () {
        beforeEach(function () {
          this.runtimeHistory.set({fromTime: this.fromTime, toTime: this.toTime});
        });

        it('is the day specified in toTime', function () {
          expect(this.runtimeHistory.day()).toEqual(moment.tz(this.toTime, this.timeZone));
        });
      })
    );

    describe('#chartData', function () {
      describe('without data', () =>
        it('returns null', function () {
          const device = Factories.create('spider', {dealerUuid: 1, deviceId: 1});
          const runtimeHistory = new SpiderRuntimeHistory(device, {session: this.session});
          expect(runtimeHistory.chartData()).toBeNull();
        })
      );

      describe('with data, but nothing that is graph-able', function () {
        beforeEach(function () {
          this.runtimeHistory.parse({fromTime: this.fromTime, toTime: this.toTime});
        });

        it('returns null', function () {
          const device = Factories.create('spider', {dealerUuid: 1, deviceId: 1});
          const runtimeHistory = new SpiderRuntimeHistory(device, {session: this.session});
          expect(runtimeHistory.chartData()).toBeNull();
        });
      });

      describe('with data', function () {
        beforeEach(function () {
          this.attributes = {
            moreHistory: false,
            indoorCoilTemperatures: temperatureOccurrences(),
            indoorGasLineTemperatures: temperatureOccurrences(),
            indoorReturnAirTemperatures: temperatureOccurrences(),
            indoorSupplyAirTemperatures: temperatureOccurrences(),
            indoorLiquidTemperatures: temperatureOccurrences(),
            outdoorCompressorSuctionTemperatures: temperatureOccurrences(),
            outdoorCoilTemperatures: temperatureOccurrences(),
            outdoorLiquidTemperatures: temperatureOccurrences(),
            indoorAirPressureRises: pressureOccurrences(),
            outdoorLiquidPressures: pressureOccurrences(),
            outdoorGasPressures: pressureOccurrences(),
            thermostatLoadValues: loadOccurrences(),
            thermostatAirflowPercentages: airflowOccurrences(),
            disconnects: disconnectOccurrences()
          };

          this.runtimeHistory.set(this.runtimeHistory.parse(this.attributes));

          this.chartData = this.runtimeHistory.chartData();
        });

        it('returns the current day', function () {
          expect(this.chartData.day).toMatch(/[a-zA-Z]*\s\d{1,2},\s\d{4}/);
        });

        it('creates arrays based on attributes', function () {
          for (let attr in this.attributes) {
            var transformedValue;
            const value = this.attributes[attr];
            if (_.includes(['startTime', 'endTime'], attr)) {
              expect(this.chartData[attr]).toEqual(moment(value));
            } else if (attr === 'moreHistory') {
              expect(this.chartData[attr]).toEqual(value);
            } else if (attr === 'disconnects') {
              return [{ occurredAt: secondsOfSpiderDay(2) }, { occurredAt: secondsOfSpiderDay(8) }];
            } else if (attr === 'indoorAirPressureRises') {
              transformedValue = value.map(reading =>
                // Divide by 100, rounding to 1 decimal place ↓
                [reading.occurredAt * 1000, Math.round(reading.pressure / 10) / 10]);
              expect(this.chartData[attr]).toEqual(transformedValue);
            } else {
              transformedValue = value.map(function (reading) {
                const readingValue = reading.temperature || reading.pressure || reading.loadValue || reading.airflow;
                return [reading.occurredAt * 1000, readingValue];
              });

              expect(this.chartData[attr]).toEqual(transformedValue);
            }
          }
        });

        it('pads missing reconnect when there is only a disconnect event', function () {
          this.attributes.disconnects = [{ occurredAt: secondsOfSpiderDay(2), state: 'started' }];
          this.runtimeHistory.set(_.extend({}, {fromTime: this.fromTime, toTime: this.toTime}, this.runtimeHistory.parse(this.attributes)));
          this.chartData = this.runtimeHistory.chartData();

          const disconnect = this.chartData.disconnects[0];
          expect(disconnect).toBeTruthy();
          expect(disconnect.length).toEqual(2);
          expect(disconnect[0].occurredAt).toEqual(secondsOfSpiderDay(2));
          expect(disconnect[1].occurredAt).toEqual(moment(this.toTime).unix());
        });

        it('pads missing disconnect when there is only a reconnect event', function () {
          this.attributes.disconnects = [{ occurredAt: secondsOfSpiderDay(2), state: 'stopped' }];
          this.runtimeHistory.set(_.extend({}, {fromTime: this.fromTime, toTime: this.toTime}, this.runtimeHistory.parse(this.attributes)));
          this.chartData = this.runtimeHistory.chartData();

          const disconnect = this.chartData.disconnects[0];
          expect(disconnect).toBeTruthy();
          expect(disconnect.length).toEqual(2);
          expect(disconnect[0].occurredAt).toEqual(moment(this.fromTime).unix());
          expect(disconnect[1].occurredAt).toEqual(secondsOfSpiderDay(2));
        });
      });

      describe('rounding and sorting', function () {
        beforeEach(function () {
          this.attributes = {
            thermostatLoadValues: [
              { loadValue: 1, occurredAt: secondsOfSpiderDay(8) },
              { loadValue: 1.55555555555, occurredAt: secondsOfSpiderDay(2) }
            ],
            thermostatAirflowPercentages: [
              { airflow: 2, occurredAt: secondsOfSpiderDay(8) },
              { airflow: 10, occurredAt: secondsOfSpiderDay(2) }
            ],
            indoorSuperheats: [
              { temperature: 1.8888888, occurredAt: secondsOfSpiderDay(10) },
              { temperature: null, occurredAt: secondsOfSpiderDay(1) }
            ]
          };

          this.runtimeHistory.set(this.runtimeHistory.parse(this.attributes));
          this.chartData = this.runtimeHistory.chartData();
        });

        it('rounds values to 10 decimal places and sorts by occurred at time', function () {
          expect(this.chartData.thermostatLoadValues[0][1]).toEqual(1.6);
          expect(this.chartData.thermostatLoadValues[1][1]).toEqual(1);

          expect(this.chartData.thermostatAirflowPercentages[0][1]).toEqual(10);
          expect(this.chartData.thermostatAirflowPercentages[1][1]).toEqual(2);
        });

        it('preserves null values', function () {
          expect(this.chartData.indoorSuperheats[0][1]).toEqual(null);
          expect(this.chartData.indoorSuperheats[1][1]).toEqual(1.9);
        });
      });
    });
  });
});
