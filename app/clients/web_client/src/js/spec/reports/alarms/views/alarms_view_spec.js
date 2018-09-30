define(function (require) {
  require('spec/spec_helper');
  const AlarmsCollection = require('alarms/models/alarms_collection');
  const AlarmsView       = require('alarms/views/alarms_view');
  const Backbone         = require('backbone');
  const moment           = require('moment-timezone');

  describe('AlarmsView', function () {
    beforeEach(function () {
      this.collection = new AlarmsCollection();
    });

    describe('lastUpdatedAt', function () {
      describe('with time data', () =>
        it("does display 'last updated'", function () {
          this.collection.add(
            [
              new Backbone.Model({lastUpdatedAt: 1400089860000, severity: 'normal', date: {s: 1405962134}})
            ]
          );
          const view = new AlarmsView({collection: this.collection});
          view.render();

          expect(view.$el.find('.last-updated-at').length).toBe(1);
        })
      );

      describe('without time data', () =>
        it("doesn't display 'last updated'", function () {
          this.collection.add([new Backbone.Model({ severity: 'normal', date: { s: 1405962134 } })]);
          const view = new AlarmsView({collection: this.collection});
          view.render();

          expect(view.$el.find('.last-updated-at').length).toBe(0);
        })
      );
    });

    describe('#render', function () {
      beforeEach(function () {
        this.collection.add(
          [
            new Backbone.Model({
              severity: 'normal',
              date: {s: 1405962134},
              occurredAt: moment(1400089860000).tz('America/New_York')
            })
          ]
        );
        this.view = new AlarmsView({el: '<div>', collection: this.collection});
        this.view.render();
      });

      describe('displaying occurredAt', () =>
        it('renders it in the correct time zone', function () {
          expect(this.view.$el.find('.alarm-date').html()).toBe('05/14/2014 01:51PM');
        })
      );

      describe('with an already expanded alarm', () =>
        it('keeps the alarm expanded', function () {
          expect(this.view.$('.alarm.closed').length).toBe(1);
          expect(this.view.$('.alarm.open').length).toBe(0);

          this.view.$('.icon-drawer-state').click();

          expect(this.view.$('.alarm.closed').length).toBe(0);
          expect(this.view.$('.alarm.open').length).toBe(1);

          this.view.render();

          expect(this.view.$('.alarm.closed').length).toBe(0);
          expect(this.view.$('.alarm.open').length).toBe(1);
        })
      );

      describe('with a CL2.xxx.xx alarm', function () {
        beforeEach(function () {
          this.collection.add(
            [
              new Backbone.Model({
                code: 'CL2.123.45',
                severity: 'normal',
                date: {s: 1405962134},
                occurredAt: moment(1400089860000).tz('America/New_York')
              })
            ]
          );
          this.view.render();
        });

        it('renders it as ERR xxx.xx', function () {
          expect(this.view.$el.text()).not.toMatch('CL2.123.45');
          expect(this.view.$el.text()).toMatch('Err 123.45');
        });
      });
    });
  });
});
