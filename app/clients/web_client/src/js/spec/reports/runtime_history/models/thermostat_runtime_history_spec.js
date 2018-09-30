define(function (require) {
  require('spec/spec_helper');
  const ThermostatRuntimeHistory = require('runtime_history/models/thermostat_runtime_history');
  const Session = require('root/models/session');
  const Factories = require('spec/_support/factories');
  const moment = require('moment-timezone');

  describe('ThermostatRuntimeHistory', function () {
    // have to add a day so we don't fail conversions that convert time first
    // and then apply zone offset
    const secondsOfStatDay = seconds => (seconds) + (24 * 60 * 60);

    const jsTime = time => (time) * 1000;

    beforeEach(function () {
      this.session = new Session();
      this.fromTime = moment(jsTime(secondsOfStatDay(1))).format('YYYY-MM-DDTHH:mm:ssZ');
      this.toTime   = moment(jsTime(secondsOfStatDay(20))).format('YYYY-MM-DDTHH:mm:ssZ');
      this.timezone = 'America/New_York';
      this.stagesAttributes = {
        'stages': [
          { 'stage': 'COMPRESSOR_COOLING_STAGE_1', 'runOccurrences': [{ 'operation': 'started', 'occurredAt': secondsOfStatDay(9) }] },
          { 'stage': 'COMPRESSOR_COOLING_STAGE_2', 'runOccurrences': [{ 'operation': 'started', 'occurredAt': secondsOfStatDay(8) }] },
          { 'stage': 'COMPRESSOR_HEATING_STAGE_1', 'runOccurrences': [{ 'operation': 'started', 'occurredAt': secondsOfStatDay(7) }] },
          { 'stage': 'COMPRESSOR_HEATING_STAGE_2', 'runOccurrences': [{ 'operation': 'started', 'occurredAt': secondsOfStatDay(6) }] },
          { 'stage': 'ELECTRIC_HEATING_STAGE_1', 'runOccurrences': [{ 'operation': 'started', 'occurredAt': secondsOfStatDay(5) }] },
          { 'stage': 'ELECTRIC_HEATING_STAGE_2', 'runOccurrences': [{ 'operation': 'started', 'occurredAt': secondsOfStatDay(4) }] },
          { 'stage': 'ELECTRIC_HEATING_STAGE_3', 'runOccurrences': [{ 'operation': 'started', 'occurredAt': secondsOfStatDay(3) }] },
          { 'stage': 'GAS_HEATING_STAGE_1', 'runOccurrences': [{ 'operation': 'started', 'occurredAt': secondsOfStatDay(2) }] },
          { 'stage': 'GAS_HEATING_STAGE_2', 'runOccurrences': [{ 'operation': 'started', 'occurredAt': secondsOfStatDay(1) }] },
          { 'stage': 'GAS_HEATING_STAGE_3', 'runOccurrences': [{ 'operation': 'started', 'occurredAt': secondsOfStatDay(12) }] },
          { 'stage': 'HYDRONIC_HEATING_STAGE_1', 'runOccurrences': [{ 'operation': 'started', 'occurredAt': secondsOfStatDay(11) }] },
          { 'stage': 'DEFROST', 'runOccurrences': [{ 'operation': 'started', 'occurredAt': secondsOfStatDay(13) }] } ]
      };
    });

    describe('parsed data', function () {
      beforeEach(function () {
        const device = Factories.build('thermostat', {dealerUuid: 1, deviceId: 1, timeZone: this.timezone});
        this.runtimeHistory = new ThermostatRuntimeHistory(device, {session: this.session});
        this.parsedAttributes = this.runtimeHistory.parse(_(this.stagesAttributes).extend({'fromTime': this.fromTime, 'toTime': this.toTime}));
      });

      describe('lastStartedMode', function () {
        it('is the mode of the most recently-started stage', function () {
          expect(this.parsedAttributes.lastStartedMode).toBe('heating');
        });

        describe('when the last started stage is OFF', function () {
          beforeEach(function () {
            this.stagesAttributes.stages.push({'stage': 'SYSTEM_MODE_OFF', 'runOccurrences': [{ 'operation': 'started', 'occurredAt': secondsOfStatDay(15) }]});
            this.parsedAttributes = this.runtimeHistory.parse(_(this.stagesAttributes).extend({'fromTime': this.fromTime, 'toTime': this.toTime}));
          });

          it('does not include the OFF stage', function () {
            expect(this.parsedAttributes.lastStartedMode).toBe('heating');
          });
        });

        describe('when the only started stage of the day is OFF', function () {
          beforeEach(function () {
            this.stagesAttributes.stages = [{'stage': 'SYSTEM_MODE_OFF', 'runOccurrences': [{ 'operation': 'started', 'occurredAt': secondsOfStatDay(15) }]}];
            this.parsedAttributes = this.runtimeHistory.parse(_(this.stagesAttributes).extend({'fromTime': this.fromTime, 'toTime': this.toTime}));
          });

          it('does not set the lastStartedMode', function () {
            expect(this.parsedAttributes.lastStartedMode).toBeUndefined();
          });
        });
      });

      describe('stages', function () {
        it('has a color', function () {
          _.each(this.parsedAttributes.stages, stage => expect(stage.color).toBeTruthy());
        });

        it('has a mode', function () {
          _.each(this.parsedAttributes.stages, function (stage) {
            if (/_COOLING_/.test(stage.stage)) {
              expect(stage.mode).toBe('cooling');
            } else if (/_HEATING_/.test(stage.stage)) {
              expect(stage.mode).toBe('heating');
            } else if (/DEFROST/.test(stage.stage)) {
              expect(stage.mode).toBe('heating');
            } else {
              throw new Error('Unexpected stage value.');
            }
          });
        });
      });

      describe('#day', function () {
        beforeEach(function () {
          this.runtimeHistory.set(this.parsedAttributes);
        });

        it('is the day specified in fromTime', function () {
          expect(_(this.runtimeHistory.day()).isEqual(moment.tz(this.toTime, this.timezone))).toBe(true);
        });
      });

      describe('cycleCountSummary', function () {
        it('includes the stages', function () {
          expect(this.parsedAttributes.cycleCountSummary.length).toBe(12);
        });

        it('includes the defrost cycle', function () {
          const defrost = (this.parsedAttributes.cycleCountSummary.filter((cycle) => cycle.stage === 'DEFROST'))[0];
          expect(defrost.mode).toBe('heating');
        });

        describe('with no defrost cycle info', function () {
          beforeEach(function () {
            const defrostStage = { 'stage': 'DEFROST', 'runOccurrences': [{ 'operation': 'started', 'occurredAt': secondsOfStatDay(13) }] };
            this.stagesAttributes.stages.splice(this.stagesAttributes.stages.indexOf(defrostStage), 1);
            this.parsedAttributes = this.runtimeHistory.parse(this.stagesAttributes);
          });

          it('does not include the defrost cycle', function () {
            expect(this.parsedAttributes.cycleCountSummary.length).toBe(11);
            const possiblyDefrost = _.last(this.parsedAttributes.cycleCountSummary);
            expect(possiblyDefrost.stage).not.toBe('DEFROST');
          });
        });

        describe('with no data', function () {
          beforeEach(function () {
            this.parsedAttributes = this.runtimeHistory.parse(null);
          });

          it('includes an empty cycleCountSummary', function () {
            expect(this.parsedAttributes.cycleCountSummary.length).toBe(0);
          });
        });
      });
    });

    describe('#chartData', function () {
      describe('without data', () =>
        it('returns null', function () {
          const device = Factories.build('thermostat', {dealerUuid: 1, deviceId: 1});
          const runtimeHistory = new ThermostatRuntimeHistory(device, {session: this.session});
          return expect(runtimeHistory.chartData()).toBeNull;
        })
      );

      describe('with data, but nothing that is graph-able', function () {
        beforeEach(function () {
          this.attributes = {
            'fromTime': this.fromTime,
            'toTime': this.toTime
          };
        });

        it('returns null', function () {
          const device = Factories.build('thermostat', {dealerUuid: 1, deviceId: 1});
          const runtimeHistory = new ThermostatRuntimeHistory(device, {session: this.session});
          return expect(runtimeHistory.chartData()).toBeNull;
        });
      });

      describe('with data', function () {
        beforeEach(function () {
          this.attributes = {
            'fromTime': this.fromTime,
            'toTime': this.toTime,
            'moreHistory': this.moreHistory,
            'outdoorTemps': [
              { 'temperature': 72, 'occurredAt': secondsOfStatDay(3) }
            ],
            'outdoorHumidity': [
              { 'humidity': 72, 'occurredAt': secondsOfStatDay(3) },
              { 'humidity': 79, 'occurredAt': secondsOfStatDay(9) }
            ],
            'zones': [{
              'damperPositionOccurrences': [{
                'damperPosition': 39,
                'occurredAt': secondsOfStatDay(8)
              }
              ],
              'tempOccurrences': [
                { 'temperature': 72, 'occurredAt': secondsOfStatDay(2) },
                { 'temperature': 73, 'occurredAt': secondsOfStatDay(8) },
                { 'temperature': 74, 'occurredAt': secondsOfStatDay(9) },
                { 'temperature': 75, 'occurredAt': secondsOfStatDay(10) },
                { 'temperature': 76, 'occurredAt': secondsOfStatDay(12) },
                { 'temperature': 77, 'occurredAt': secondsOfStatDay(15) }
              ],
              'humidityOccurrences': [
                { 'humidity': 72, 'occurredAt': secondsOfStatDay(2) },
                { 'humidity': 73, 'occurredAt': secondsOfStatDay(8) },
                { 'humidity': 74, 'occurredAt': secondsOfStatDay(9) },
                { 'humidity': 75, 'occurredAt': secondsOfStatDay(10) },
                { 'humidity': 76, 'occurredAt': secondsOfStatDay(11) },
                { 'humidity': 77, 'occurredAt': secondsOfStatDay(12) }
              ],
              'runOccurrences': [{
                'operation': 'stopped',
                'occurredAt': secondsOfStatDay(7)
              } ],
              'relievingOccurrences': [
                { 'operation': 'stopped', 'occurredAt': secondsOfStatDay(8) },
                { 'operation': 'started', 'occurredAt': secondsOfStatDay(9) },
                { 'operation': 'stopped', 'occurredAt': secondsOfStatDay(10) },
                { 'operation': 'started', 'occurredAt': secondsOfStatDay(11) } ],
              'heatingSetpointOccurrences': [{
                'temperature': 60,
                'occurredAt': secondsOfStatDay(12)
              } ],
              'coolingSetpointOccurrences': [{
                'temperature': 80,
                'occurredAt': secondsOfStatDay(13)
              } ],
              'alarmOccurrences': [{
                'code': 'SP0.1',
                'severity': 'critical',
                'occurredAt': secondsOfStatDay(14)
              } ]
            }
            ],
            'stages': [{
              'stage': 'COMPRESSOR_COOLING_STAGE_1',
              'mode': 'cooling',
              'runOccurrences': [
                { 'operation': 'stopped', 'occurredAt': secondsOfStatDay(15) },
                { 'operation': 'started', 'occurredAt': secondsOfStatDay(16) },
                { 'operation': 'stopped', 'occurredAt': secondsOfStatDay(17) },
                { 'operation': 'started', 'occurredAt': secondsOfStatDay(18) } ]
            }
            ],
            'alarmOccurrences': [{
              'occurredAt': secondsOfStatDay(16),
              'timeZone': 'America/Chicago',
              'from': 16,
              'to': 16,
              'id': 16,
              'severity': 'critical',
              'status': 'new',
              'code': 'CFG.002.00',
              'description': 'There was an error due to damper failure',
              'unitType': 'PlatformA',
              'serialId': '12345678',
              'rootCause': 'Damper failure may be caused by a mechanical failure',
              'zoneId': '123'
            },
            {
              'occurredAt': secondsOfStatDay(16),
              'timeZone': 'America/Chicago',
              'from': 16,
              'to': 16,
              'id': 16,
              'severity': 'critical',
              'status': 'new',
              'code': 'CFG.002.00',
              'description': 'There was an error due to damper failure',
              'unitType': 'PlatformA',
              'serialId': '12345678',
              'rootCause': 'Damper failure may be caused by a mechanical failure',
              'zoneId': '123'
            }]
          };

          this.device = Factories.build('thermostat', {dealerUuid: 1, deviceId: 1});
          this.runtimeHistory = new ThermostatRuntimeHistory(this.device, {session: this.session});
          this.runtimeHistory.parse(this.attributes);
          this.runtimeHistory.set(this.attributes);
          this.chartData = this.runtimeHistory.chartData();
        });

        it('returns the current day', function () {
          expect(this.chartData.day).toMatch(/[a-zA-Z]*\s\d{1,2},\s\d{4}/);
        });

        it('creates an array of outdoor temperature data points', function () {
          expect(this.chartData.outdoorTemps).toEqual([[jsTime(secondsOfStatDay(3)), 72]]);
        });

        it('creates an array of outdoor humidity data points', function () {
          expect(this.chartData.outdoorHumidity).toEqual([[jsTime(secondsOfStatDay(3)), 72], [jsTime(secondsOfStatDay(9)), 79]]);
        });

        describe('outdoor capacity occurrences', function () {
          beforeEach(function () {
            this.outdoorCapacityOccurrences = [
              { 'capacity': 29, 'occurredAt': secondsOfStatDay(15) },
              { 'capacity': 59, 'occurredAt': secondsOfStatDay(16) }
            ];

            this.attributes.compressorCapacityOccurrences = this.outdoorCapacityOccurrences;

            this.runtimeHistory.parse(this.attributes);
            this.runtimeHistory.set(this.attributes);
            this.chartData = this.runtimeHistory.chartData();
          });

          it('has the correct number of occurrences', function () {
            expect(this.chartData.outdoorCapacityOccurrences.length).toBe(this.outdoorCapacityOccurrences.length);
          });

          it('has the correct values for each occurrence', function () {
            expect(this.chartData.outdoorCapacityOccurrences[0]).toEqual([jsTime(secondsOfStatDay(15)), 29]);
          });
        });

        describe('each zone', function () {
          beforeEach(function () {
            this.zone = this.chartData.zones[0];
          });

          it('creates an array of indoor temperature data points', function () {
            expect(this.zone.temp[0]).toEqual([jsTime(secondsOfStatDay(2)), 72]);
          });

          it('creates an array of indoor humidity data points', function () {
            expect(this.zone.temp[0]).toEqual([jsTime(secondsOfStatDay(2)), 72]);
          });

          it('creates an array of cooling setpoint data points', function () {
            expect(this.zone.coolingSetpoints).toEqual([[jsTime(secondsOfStatDay(13)), 80]]);
          });

          it('creates an array of heating setpoint data points', function () {
            expect(this.zone.heatingSetpoints).toEqual([[jsTime(secondsOfStatDay(12)), 60]]);
          });

          it('creates an array of damper position data points', function () {
            expect(this.zone.damperPosition).toEqual([[jsTime(secondsOfStatDay(8)), 39]]);
          });

          it('creates an array of relieving phases', function () {
            expect(this.zone.relievingPhases[1]).toEqual([[jsTime(secondsOfStatDay(9)), 74], [jsTime(secondsOfStatDay(10)), 75]]);
          });

          describe('relieving phases', function () {
            it('fakes in the start of a phase', function () {
              expect(_.first(this.zone.relievingPhases)).toEqual([[jsTime(secondsOfStatDay(1)), 72], [jsTime(secondsOfStatDay(8)), 73]]);
            });

            it('fakes in the end of a phase', function () {
              expect(_.last(this.zone.relievingPhases)).toEqual([[jsTime(secondsOfStatDay(11)), 75.5], [jsTime(secondsOfStatDay(20)), 77]]);
            });
          });
        });

        describe('each stage', function () {
          beforeEach(function () {
            this.stage = this.chartData.stages[0];
            expect(this.chartData.stages).toBeTruthy();
          });

          it('returns a stage', function () {
            expect(this.stage.stage).toBe('COMPRESSOR_COOLING_STAGE_1');
          });

          it('returns a mode', function () {
            expect(this.stage.mode).toBe('cooling');
          });

          describe('each run', function () {
            beforeEach(function () {
              this.run = this.chartData.stages[0].runs[1];
            });

            it('returns a from time', function () {
              expect(this.run.from).toBe(jsTime(secondsOfStatDay(16)));
            });

            it('returns a to time', function () {
              expect(this.run.to).toBe(jsTime(secondsOfStatDay(17)));
            });

            it('returns an id', function () {
              expect(this.run.id).toBe('COMPRESSOR_COOLING_STAGE_1');
            });

            describe('colors and categories', function () {
              beforeEach(function () {});
              const device = Factories.build('thermostat', {dealerUuid: 1, deviceId: 1});
              const runtimeHistory = new ThermostatRuntimeHistory(device, {session: this.session});
              runtimeHistory.parse(this.stagesAttributes);
              runtimeHistory.set(this.stagesAttributes);
              this.chartdata = runtimeHistory.chartData();

              it('returns a color', function () {
                _.each(this.chartData.stages, stage =>
                  _.each(stage.runs, run => expect(run.color).toBeTruthy())
                );
              });

              it('returns a category', function () {
                _.each(this.chartData.stages, stage =>
                  _.each(stage.runs, run => expect(run.category).toBeTruthy())
                );
              });
            });

            it('fakes in a run started for the beginning of the time period', function () {
              const firstRun = _.first(this.chartData.stages[0].runs);

              expect(firstRun.from).toBe(jsTime(secondsOfStatDay(1)));
              expect(firstRun.to).toBe(jsTime(secondsOfStatDay(15)));
            });

            it('fakes in a run stopped for the end of the time period', function () {
              const lastRun = _.last(this.chartData.stages[0].runs);

              expect(lastRun.from).toBe(jsTime(secondsOfStatDay(18)));
              expect(lastRun.to).toBe(jsTime(secondsOfStatDay(20)));
            });

            describe('when the report is for today', function () {
              beforeEach(function () {
                this.attributes.toTime = moment().format('YYYY-MM-DDTHH:mm:ssZ');
                const runtimeHistory = new ThermostatRuntimeHistory(this.device, {session: this.session});
                runtimeHistory.parse(this.attributes);
                runtimeHistory.set(this.attributes);
                this.chartData = runtimeHistory.chartData();
              });

              it('fakes in a run stopped for right now', function () {
                const lastRun = _.last(this.chartData.stages[0].runs);

                expect(lastRun.from).toBe(jsTime(secondsOfStatDay(18)));
                expect(lastRun.to - moment().valueOf()).toBeLessThan(5);
              });
            });
          });

          describe('unique alarm occurrences', function () {
            it('contains unique alarms by timestamp, code, serial id, and status', function () {
              expect(this.chartData.uniqueAlarmOccurrences.length).toBe(1);
              expect(this.chartData.uniqueAlarmOccurrences[0]).toEqual(this.chartData.alarmOccurrences[0]);
            });
          });

          describe('each alarm occurrence', function () {
            describe('when the alarm is restricted', function () {
              beforeEach(function () {
                sinon.stub(this.session, 'featureEnabled').returns(false);
                this.chartData = this.runtimeHistory.chartData();
              });

              it('does not add the alarm to the chart data', function () {
                expect(this.chartData.alarmOccurrences.length).toBe(0);
              });
            });

            describe('when the alarm is not restricted', function () {
              beforeEach(function () {
                this.alarm = this.chartData.alarmOccurrences[0];
              });

              it('adds the alarm info to the chart data', function () {
                expect(this.chartData.alarmOccurrences.length).toBe(2);
              });

              it('returns an occurredAt time', function () {
                expect(this.alarm.occurredAt.valueOf()).toBe(moment(jsTime(secondsOfStatDay(16))).valueOf());
              });

              it('returns an id', function () {
                expect(this.alarm.id.valueOf()).toBe(moment(jsTime(secondsOfStatDay(16))).valueOf());
              });

              it('returns a severityLevel', function () {
                expect(this.alarm.severity).toBe('critical');
              });

              it('returns a status', function () {
                expect(this.alarm.status).toBe('new');
              });

              it('returns a code', function () {
                expect(this.alarm.code).toBe('CFG.002.00');
              });

              it('returns a description', function () {
                expect(this.alarm.description).toBe('There was an error due to damper failure');
              });

              it('returns a unitType', function () {
                expect(this.alarm.unitType).toBe('PlatformA');
              });

              it('returns a serialId', function () {
                expect(this.alarm.serialId).toBe('12345678');
              });

              it('returns a rootCause', function () {
                expect(this.alarm.rootCause).toBe('Damper failure may be caused by a mechanical failure');
              });

              it('returns a zoneId', function () {
                expect(this.alarm.zoneId).toBe('123');
              });
            });
          });
        });
      });
    });
  });
});
