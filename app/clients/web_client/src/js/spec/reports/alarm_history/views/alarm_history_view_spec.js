define(function (require) {
  require('spec/spec_helper');
  const AlarmHistoryReport     = require('alarm_history/models/alarm_history_report');
  const AlarmHistoryView       = require('alarm_history/views/alarm_history_view');
  const AlarmHistory           = require('alarm_history/models/alarm_history');
  const Session                = require('root/models/session');
  const Factories              = require('spec/_support/factories');

  describe('AlarmHistoryView', function () {
    beforeEach(function () {
      this.alarmHistory = new AlarmHistory();
      this.device = Factories.build('thermostat', {timeZone: 'America/New_York'});
      this.session  = new Session();
      this.model = new AlarmHistoryReport(null, {
        device: this.device,
        session: this.session
      });
      this.view = new AlarmHistoryView({model: this.model});
    });

    describe('fetching more history', function () {
      describe('with more data available', function () {
        beforeEach(function () {
          this.model.set(
            {
              historyDetails: [],
              fromTime: Date.now() - 1000000000,
              toTime: Date.now(),
              moreHistory: true
            },
            {silent: true}
          );
          this.model.fetchSuccess();
          this.view.render();
        });

        it('shows a button to get more data', function () {
          expect(this.view.$('button#get-more').length).toBe(1);
        });

        describe('when clicking the button to get more data', () =>
          it('gets more from the model', function () {
            const getMoreSpy = sinon.spy(this.model, 'getMore');
            this.view.$('button#get-more').click();
            expect(getMoreSpy.called).toBeTruthy();
          })
        );
      });

      describe('with no more data available', function () {
        beforeEach(function () {
          this.model.set(
            {
              historyDetails: [],
              fromTime: Date.now() - 1000000000,
              toTime: Date.now(),
              moreHistory: false
            },
            {silent: true}
          );
          this.model.fetchSuccess();
          this.view.render();
        });

        it('does not show a button to get more data', function () {
          expect(this.view.$('button#get-more').length).toBe(0);
        });
      });
    });

    describe('when no alarm data is available', function () {
      beforeEach(function () {
        this.model.set(
          {
            historyDetails: [],
            fromTime: 1440349200,  // Aug 23, 2015
            toTime: 1440522000,    // Aug 25, 2015
            moreHistory: true
          },
          {silent: true}
        );
        this.model.fetchSuccess();
        this.view.render();
      });

      it('display a message indicating nothing is available', function () {
        expect(this.view.$el.html()).toMatch('No alerts in the last 2 days');
      });
    });

    describe('showing/hiding history', () =>
      describe('with more than one day of history', function () {
        beforeEach(function () {
          this.data =
            [
              {
                lastUpdatedAt: 1400089860000,
                severity: 'normal',
                occurredAt: 1440444585 - 1000,
                clearedAt: 1440444585,
                timeZone: 'America/New_York',
                code: 'CFG.001.01'
              },

              {
                lastUpdatedAt: 1400088750000,
                severity: 'critical',
                occurredAt: 1440344499 - 1000,
                clearedAt: null,
                timeZone: 'America/New_York',
                code: 'CL2.123.45'
              }
            ];

          this.model.set(
            {
              historyDetails: this.data,
              fromTime: this.data[0].lastUpdatedAt / 1000,
              toTime: this.data[1].lastUpdatedAt / 1000
            },
            {silent: true}
          );
          this.model.fetchSuccess();

          this.view.render();
        });

        it('shows all the days with alarms in the history', function () {
          expect(this.view.$('.day-str').length).toBe(2);
          expect(this.view.$('.day-str:first').html()).toBe('Mon, Aug 24, 2015');
          expect(this.view.$('.day-str:last').html()).toBe('Sun, Aug 23, 2015');
        });

        it('shows a summary of the alarms with severity on each day', function () {
          const $firstDay = this.view.$('.day-summary').first();
          const $lastDay = this.view.$('.day-summary').last();

          expect($firstDay.find('.severity-count.normal').text().trim()).toBe('1');
          expect($firstDay.find('.severity-count.major').text().trim()).toBe('0');
          expect($firstDay.find('.severity-count.critical').text().trim()).toBe('0');

          expect($lastDay.find('.severity-count.normal').text().trim()).toBe('0');
          expect($lastDay.find('.severity-count.major').text().trim()).toBe('0');
          expect($lastDay.find('.severity-count.critical').text().trim()).toBe('1');
        });

        it('does not show any alarm info', function () {
          expect(this.view.$el.find('.alarm-history-day.open').length).toBe(0);
          expect(this.view.$el.find('.alarm-history-day.closed').length).toBe(2);
        });

        it("renders CL2.XXX.XX alerts as 'Err XXX.XX'", function () {
          expect(this.view.$el.text()).not.toMatch(/CL2.123.45/);
          expect(this.view.$el.text()).toMatch(/Err 123.45/);
        });

        describe('when a day is clicked on', function () {
          beforeEach(function () {
            this.$firstDay = this.view.$el.find('.day-summary').first();
            this.$firstDay.click();
          });

          it('shows the alarms on that day', function () {
            expect(this.$firstDay.parents('.alarm-history-day.open').length).toBe(1);
            expect(this.view.$('.alarm-history-day.open').length).toBe(1);
          });

          it('shows occurred times for the alarms on that day', function () {
            expect(this.$firstDay.parent().find('.alarm .occurred-at').first().html()).toBe('Mon, Aug 24, 2015 03:13PM');
          });

          it('shows cleared times for the alarms on that day', function () {
            expect(this.$firstDay.parent().find('.alarm .cleared-at').first().html()).toMatch(/Mon, Aug 24, 2015 03:29PM/);
          });

          describe('and an alarm is clicked on', function () {
            beforeEach(function () {
              this.$alarm = this.$firstDay.parent().find('.alarm').first();
              this.$alarm.click();
            });

            it('shows the probable causes for that alarm', function () {
              expect(this.$alarm.hasClass('open')).toBeTruthy();
              expect(this.$alarm.hasClass('closed')).toBeFalsy();
            });

            describe('and another day is clicked', function () {
              beforeEach(function () {
                this.$lastDay = this.view.$el.find('.day-summary').last();
                this.$lastDay.click();
              });

              it('shows the new day', function () {
                expect(this.$lastDay.parents('.alarm-history-day.open').length).toBe(1);
              });

              it('collapses the old alarm info', function () {
                expect(this.view.$el.find('.alarm-history-day.open').length).toBe(1);
              });

              it('collapses the old day', function () {
                expect(this.$firstDay.parents('.alarm-history-day.closed').length).toBe(1);
              });

              it('shows occurred times for the alarms on that day', function () {
                expect(this.$lastDay.parent().find('.alarm .occurred-at').first().html()).toBe('Sun, Aug 23, 2015 11:24AM');
              });

              it("shows 'unknown' if no cleared time is available for the alarms on that day", function () {
                expect(this.$lastDay.parent().find('.alarm .cleared-at').first().html()).toMatch(/unknown/);
              });
            });
          });
        });
      })
    );

    describe('#beforeRemove', () =>
      it('aborts the active request', function () {
        const abortSpy = spyOn(this.view.activeRequest, 'abort');
        this.view.remove();

        expect(abortSpy).toHaveBeenCalled();
      })
    );
  });
});
