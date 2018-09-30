require('spec/spec_helper');

const Factories                    = require('spec/_support/factories');
const Honeybadger                  = require('honeybadger-js');
const ModalDialog                  = require('utils/modal_dialog');
const moment                       = require('moment-timezone');
const Session                      = require('root/models/session');
const sinon                        = require('sinon');
const ThermostatRuntimeHistory     = require('runtime_history/models/thermostat_runtime_history');
const ThermostatRuntimeHistoryView = require('runtime_history/views/thermostat_runtime_history_view');
const rthData                      = require('spec/_support/thermostat_rth_data');
const _                            = require('underscore');
const Theme                        = require('utils/theme');

const AllChartComponents = [ {name: 'date paginator', selector: '.date-paginator'},
  { name: 'date picker', selector: '.date-picker' },
  { name: 'mode toggle', selector: '.mode-toggle' },
  { name: 'chart', selector: '.chart' },
  { name: 'legends', selector: '.legends' },
  { name: 'stages', selector: '.stages' }
];

describe('ThermostatRuntimeHistoryView', function () {
  beforeEach(function () {
    this.session = new Session();
    const device = Factories.build('thermostat', {timeZone: 'America/New_York'});

    this.model = new ThermostatRuntimeHistory(device, {session: this.session});
    this.view = new ThermostatRuntimeHistoryView({model: this.model});

    this.server = sinon.fakeServer.create({
      respondImmediately: true
    });
    this.server.respondWith([200, {}, JSON.stringify(rthData)]);

    Theme.set('nexia');
  });

  afterEach(function () {
    this.server.restore();
  });

  const itRendersTheChartComponents = function (components) {
    if (components == null) { components = AllChartComponents; }
    _(components).each(component => itRendersTheComponent(component.name, component.selector));
  };

  const itRendersTheChartComponentsExcept = function (missingOnes) {
    const onesToCheck = _(AllChartComponents).filter(component => !_(missingOnes).contains(component.name));
    itRendersTheChartComponents(onesToCheck);
  };

  const itRendersTheComponent = (caption, selector) => {
    it(`renders the ${caption}`, function (done) {
      expect(this.view.$(selector).html()).toBeUndefined();

      this.view.render();
      this.view.fetch().done(() => {
        expect(this.view.$(selector).html().length).toBeGreaterThan(0);
        done();
      });
    });
  };

  const itReRendersTheChartComponents = (cb) =>
    _.each(AllChartComponents, (component) =>
      itReRendersTheComponent(component.name, component.selector, cb));

  const itReRendersTheComponent = (caption, selector, cb) => {
    it(`re-renders the ${caption}`, function () {
      this.view.$(selector).html('');
      cb.apply(this);
      this.view.activeRequest.done(() => {
        expect(this.view.$(selector).html()).not.toBe('');
      });
    });
  };

  const itAbortsThePendingRequest = (cb) => {
    it('aborts the pending request', function () {
      cb.apply(this); // Sets 'pending' active request
      const abortSpy = spyOn(this.view.activeRequest, 'abort');
      cb.apply(this); // Aborts 'pending' active request
      expect(abortSpy).toHaveBeenCalled();
    });
  };

  describe('with no stage info', function () {
    beforeEach(function () {
      this.model.set({stages: []}, {parse: true});
    });

    it('renders everything except stages', () => itRendersTheChartComponentsExcept(['stages']));

    it("doesn't put anything in the stages div", function () {
      expect(this.view.$('.stages').html()).toBeUndefined();
    });
  });

  describe('refreshing runtime history', function () {
    beforeEach(function () {
      this.view.render();
      this.view.fetch();
    });

    it('refreshes the runtime history', function () {
      this.view.$('.refresh').click();
      itRendersTheChartComponents();
    });
  });

  describe('showing FAQs', function () {
    beforeEach(function (done) {
      this.view.render();
      this.view.fetch().then(done);
    });

    it('shows the FAQs in a modal when clicked', function () {
      spyOn(ModalDialog.prototype, 'show');
      this.view.$('.faqs').click();
      expect(ModalDialog.prototype.show).toHaveBeenCalled();
    });
  });

  describe('on the initial load', function () {
    it('displays a loading spinner for the container', function () {
      this.view.render();
      this.view.fetch();

      expect(this.view.$('.loading').length).toBeTruthy();
    });

    itRendersTheChartComponents();
  });

  describe('when rendering', function () {
    describe('without chart data', function () {
      beforeEach(function () {
        this.model.clear();
      });

      it("doesn't render the legend", function () {
        expect(this.view.$el.find('.legends').length).toBe(0);
      });

      it("doesn't render the csv download link", function () {
        expect(this.view.$el.find('.download-csv > a').length).toBe(0);
      });
    });

    describe('with a server error', function () {
      beforeEach(function () {
        this.server.respondImmediately = false;
        spyOn(Honeybadger, 'notify');
      });

      afterEach(function () {
        // FIXME: is this necessary?
        this.server.respondImmediately = true;
      });

      describe('when the request is aborted', function () {
        beforeEach(function () {
          this.view.render();
          this.view.fetch();
          this.view.activeRequest.abort();
          this.server.respond([500, {}, '{}']);
        });

        it('does not display a server error message', function () {
          expect(this.view.$el.text()).not.toContain('Server Error');
        });

        it("doesn't notify Honeybadger", function () {
          expect(Honeybadger.notify).not.toHaveBeenCalled();
        });
      });

      describe('when something else goes wrong', function () {
        beforeEach(function () {
          this.view.render();
          this.view.fetch();
          this.server.respond([500, {}, '{}']);
        });

        it('displays a server error message', function () {
          expect(this.view.$el.text()).toContain('Server Error');
        });

        it('notifies Honeybadger', function () {
          expect(Honeybadger.notify).toHaveBeenCalled();
        });
      });
    });
  });

  describe('when paging to a different date', function () {
    beforeEach(function (done) {
      this.view.render();
      this.view.fetch().then(done);
    });

    itReRendersTheChartComponents(function () {
      // TODO: This breaks encapsulation, consider refactoring the view
      this.view.paginator.trigger('dateChanged', moment());
    });

    it('does not render the refresh button', function () {
      expect(this.view.$el.find('.refresh').prop('style')['display']).toContain('none');
    });

    describe('with an already pending request', function () {
      itAbortsThePendingRequest(function () {
        // TODO: This breaks encapsulation, consider refactoring the view
        this.view.paginator.trigger('dateChanged', moment());
      });
    });
  });

  describe('while on first day', function () {
    beforeEach(function (done) {
      this.view.render();
      this.view.fetch().then(() => {
        this.view.paginator.changeDate('BEGIN');
      }).then(done);
    });

    it('first page button is disabled', function () {
      expect(this.view.$el.find('.page-first').hasClass('disabled')).toBeTruthy();
    });

    it('previous page button is disabled', function () {
      expect(this.view.$el.find('.page-prev').hasClass('disabled')).toBeTruthy();
    });
  });

  describe('while on last day', function () {
    beforeEach(function (done) {
      this.view.render();
      this.view.fetch().then(() => {
        this.view.paginator.changeDate(moment());
      }).then(done);
    });

    it('first page button is disabled', function () {
      expect(this.view.$el.find('.page-last').hasClass('disabled')).toBeTruthy();
    });

    it('next page button is disabled', function () {
      expect(this.view.$el.find('.page-next').hasClass('disabled')).toBeTruthy();
    });
  });

  describe('when selecting a different date from the date picker', function () {
    beforeEach(function (done) {
      this.view.render();
      this.view.fetch().then(done);
    });

    itReRendersTheChartComponents(function () {
      // TODO: This breaks encapsulation, consider refactoring the view
      this.view.datePicker.trigger('dateChanged', moment());
    });

    it('does not render the refresh button', function () {
      expect(this.view.$el.find('.refresh').prop('style')['display']).toContain('none');
    });

    describe('with an already pending request', function () {
      itAbortsThePendingRequest(function () {
        // TODO: This breaks encapsulation, consider refactoring the view
        this.view.datePicker.trigger('dateChanged', moment());
      });
    });
  });

  describe('when toggling the mode', function () {
    beforeEach(function (done) {
      this.view.render();
      this.view.fetch().then(done);
    });

    it('sets the new mode', function () {
      spyOn(this.view.chartMode, 'set');
      // TODO: This breaks encapsulation, consider refactoring the view
      this.view.modeView.trigger('modeChanged', 'heating');

      expect(this.view.chartMode.set).toHaveBeenCalledWith('heating');
    });

    it('re-renders the mode', function () {
      this.view.$('.mode-toggle').html('');
      // TODO: This breaks encapsulation, consider refactoring the view
      this.view.modeView.trigger('modeChanged', 'heating');

      expect(this.view.$('.mode-toggle').html()).not.toBe('');
    });

    it('updates the chart to show the setpoint lines respective to the mode', function () {
      // TODO: This breaks encapsulation, consider refactoring the view
      spyOn(this.view.chartView, 'update');
      this.view.modeView.trigger('modeChanged', 'heating');

      expect(this.view.chartView.update).toHaveBeenCalled();
    });

    it('re-renders the stages', function () {
      // TODO: This breaks encapsulation, consider refactoring the view
      this.view.modeView.$el.html('');
      this.view.modeView.trigger('modeChanged', 'heating');
      expect(this.view.modeView.$el.html()).not.toBe('');
    });
  });

  describe('when toggling a zone', function () {
    beforeEach(function (done) {
      this.view.render();
      this.view.fetch().then(done);
    });

    it('updates the chart to show series lines for the selected zones', function () {
      // TODO: This breaks encapsulation, consider refactoring the view
      spyOn(this.view.chartView, 'update');
      this.view.legendView.trigger('zoneToggled');
      expect(this.view.chartView.update).toHaveBeenCalled();
    });
  });

  describe('when removed', () =>
    it('aborts the active request', function () {
      this.view.render();
      this.view.fetch();
      spyOn(this.view.activeRequest, 'abort');
      this.view.remove();

      expect(this.view.activeRequest.abort).toHaveBeenCalled();
    })
  );

  describe('with hidden duplicate alerts', function () {
    describe('for an admin only', function () {
      it('displays a warning message', function (done) {
        sinon.stub(this.model, 'chartData').returns({
          alarmOccurrences: ['fake alarm 1', 'fake alarm 1'],
          uniqueAlarmOccurrences: ['fake alarm 1'],
          startTime: moment(),
          endTime: moment(),
          timeZone: 'America/New_York'
        });

        sinon.stub(this.model.session, 'isAdmin').returns(true);

        this.view.render();
        this.view.fetch();

        this.view.fetch().done(() => {
          expect(this.view.$('.alert-filter-warning').length).toBeTruthy();
          done();
        });
      });
    });
  });

  describe('without any hidden duplicate alerts', function () {
    it('does not display a warning message', function (done) {
      sinon.stub(this.model, 'chartData').returns({
        alarmOccurrences: ['fake alarm 1'],
        uniqueAlarmOccurrences: ['fake alarm 1'],
        startTime: moment(),
        endTime: moment(),
        timeZone: 'America/New_York'
      });

      this.view.render();
      this.view.fetch();

      this.view.fetch().done(() => {
        expect(this.view.$('.alert-filter-warning').length).toBeFalsy();
        done();
      });
    });
  });

  it('renders the csv download link', function (done) {
    this.view.render();
    this.view.fetch().done(() => {
      expect(this.view.$el.find('.download-csv > a').length).toBe(1);
      done();
    });
  });

  describe('reset zoom button', function () {
    beforeEach(function (done) {
      this.view.render();
      this.view.fetch().then(done);
    });

    it("isn't visible by default", function () {
      expect(this.view.$('.reset-zoom').hasClass('visible')).toBe(false);
    });

    it('becomes visible after a zoomChanged event from the chartView', function () {
      this.view.chartView.trigger('zoomChanged');

      expect(this.view.$('.reset-zoom').hasClass('visible')).toBe(true);
    });

    describe('on click', function () {
      beforeEach(function () {
        this.view.chartView.trigger('zoomChanged');
        spyOn(this.view.chartView, 'resetZoom');
        this.view.$('.reset-zoom').click();
      });

      it('becomes invisible', function () {
        expect(this.view.$('.reset-zoom').hasClass('visible')).toBe(false);
      });

      it('invokes resetZoom() on the chartView', function () {
        expect(this.view.chartView.resetZoom).toHaveBeenCalled();
      });
    });
  });
});
