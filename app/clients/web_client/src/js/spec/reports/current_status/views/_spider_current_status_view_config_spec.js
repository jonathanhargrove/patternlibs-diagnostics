require('spec/spec_helper');
const SpiderCurrentStatusView = require('current_status/views/spider_current_status_view');
const SpiderConfig = require('devices/models/spider_config');
const ReportUtils = require('devices/utils/spider_report_utils');
const cloneDeep = require('lodash.clonedeep');

// NOTE: These specs start under than assumption that all configuration
// attributes are "selected" (i.e. truthy), and therefore they often make
// changes (either through the UI or the model) and then expect the value to be
// falsy

module.exports = function () {
  beforeEach(function () {
    this.view.configEnabled = true;
    this.view.render();
  });

  it('hides checkboxes by default', function () {
    this.view.$('.toggle-field-config').each(function () {
      expect($(this).is(':visible')).toBe(false);
    });
    this.view.$('.toggle-field').each(function () {
      expect($(this).is(':visible')).toBe(true);
    });
  });

  describe('panel title toggle checkbox', () =>
    it('shows and hides individual sensor checkboxes', function () {
      this.view.$('#spider-config-toggle').click();

      this.view.$('.toggle-field-config').each(function () {
        expect($(this).is(':visible')).toBe(true);
      });
      this.view.$('.toggle-field').each(function () {
        expect($(this).is(':visible')).toBe(false);
      });

      this.view.$('#spider-config-toggle').click();

      this.view.$('.toggle-field-config').each(function () {
        expect($(this).is(':visible')).toBe(false);
      });
      this.view.$('.toggle-field').each(function () {
        expect($(this).is(':visible')).toBe(true);
      });

      expect(this.view.$('.toggle-field-config').is(':visible')).toBe(false);
    })
  );

  it('renders checkboxes for all spider status properties', function () {
    ReportUtils.ATTRIBUTES.forEach(attr => {
      if (_.includes(SpiderConfig.UNCONFIGURABLE_ATTRIBUTES, attr)) { return; }

      const selector = `input[type=checkbox][data-toggle-sensor=${attr}]`;
      expect(this.view.$(selector).length).toEqual(1);
    });
  });

  it('renders checkboxes checked or unchecked depending on property state', function () {
    this.configModel.set('outdoorCoilTemperature', false);
    this.view.render();

    ReportUtils.ATTRIBUTES.forEach(attr => {
      if (_.includes(SpiderConfig.UNCONFIGURABLE_ATTRIBUTES, attr)) { return; }

      const selector = `input[type=checkbox][data-toggle-sensor=${attr}]`;
      if (attr === 'outdoorCoilTemperature') {
        expect(this.view.$(selector).prop('checked')).toBeFalsy();
      } else {
        expect(this.view.$(selector).prop('checked')).toBeTruthy();
      }
    });
  });

  it('updates the model when a box is checked', function (done) {
    this.configModel.on('change', () => {
      expect(this.configModel.get('outdoorCoilTemperature')).toBeFalsy();
      done();
    });

    this.view
      .render()
      .$el
      .find('input[type=checkbox][data-toggle-sensor=outdoorCoilTemperature]')
      .click();
  });

  _.each(['all', 'indoor', 'outdoor', 'thermostat', 'status'], function (scope) {
    const attributes = scope === 'all'
      ? 'ATTRIBUTES'
      :      `${scope.toUpperCase()}_ATTRIBUTES`;
    const checkboxCount = ReportUtils[attributes].length;

    it(`checks all checkboxes when data-toggle-sensor-type=${scope} is selected`, function () {
      this.configModel.clearAll();
      this.view.render();

      this.view.$('#spider-config-toggle').click();

      expect(this.view.$(`[data-toggle-sensor-type=${scope}]`).prop('checked')).toBeFalsy();
      this.view.$(`[data-toggle-sensor-type=${scope}]`).click();

      this.configModel.on('change', () => {
        expect(this.view.$(`[data-toggle-sensor-type=${scope}]`).prop('checked')).toBeTruthy();
        expect(this.view.$('[data-toggle-sensor]:checked').length).toEqual(checkboxCount);
      });
    });

    it(`unchecks ${scope} checkboxes when data-toggle-sensor-type is deselected`, function () {
      this.configModel.selectAll();
      this.view.render();

      this.view.$('#spider-config-toggle').click();

      expect(this.view.$(`[data-toggle-sensor-type=${scope}]`).prop('checked')).toBeTruthy();

      this.view.$(`[data-toggle-sensor-type=${scope}]`).click();

      this.configModel.on('change', () => {
        expect(this.view.$(`[data-toggle-sensor-type=${scope}]`).prop('checked')).toBeFalsy();
        expect(this.view.$('[data-toggle-sensor]:not(:checked)').length).toEqual(checkboxCount);
      });
    });
  });

  it('reconciles local and server changes', function (done) {
    this.configModel.unsavedChanges = {}; // flush unsaved changes
    const attrChangedOnClient = 'outdoorLiquidTemperature';
    const attrChangedOnServer = 'outdoorCoilTemperature';
    const response = cloneDeep(this.spider.attributes);
    response.configuration[attrChangedOnServer] = false;
    this.server = sinon.fakeServer.create({respondImmediately: true});
    this.server.respondWith(this.spider.url(), JSON.stringify(response));

    expect(this.view.$(`[data-toggle-sensor=${attrChangedOnClient}]`).prop('checked')).toBe(true);
    this.view.$(`[data-toggle-sensor=${attrChangedOnClient}]`).click();
    expect(this.view.$(`[data-toggle-sensor=${attrChangedOnClient}]`).prop('checked')).toBe(false);

    // Make a change remotely but not locally and should be merged with local changes
    expect(this.view.$(`[data-toggle-sensor=${attrChangedOnServer}]`).prop('checked')).toBe(true);
    this.spider.fetch().then(() => {
      this.view.render();
      expect(this.view.$(`[data-toggle-sensor=${attrChangedOnServer}]`).prop('checked')).toBe(false);
      expect(this.view.$(`[data-toggle-sensor=${attrChangedOnClient}]`).prop('checked')).toBe(false);
      this.server.restore();
      done();
    });
  });

  describe('saving indicator', function () {
    beforeEach(function () {
      this.configModel = new SpiderConfig(null, {model: this.spider, saveWaitTime: 0});
      this.view = new SpiderCurrentStatusView({configModel: this.configModel, model: this.model, stateTimeout: 0});
      this.view.render();

      this.server = sinon.fakeServer.create();
    });

    afterEach(function () {
      this.server.restore();
    });

    describe('with save failure', () =>
      it('renders an error message', function () {
        this.server.respondWith([400, { 'Content-Type': 'application/json' }, '{}']);

        this.configModel.set('outdoorCoilTemperature', true);
        this.server.respond();

        const serverStatus = this.view.$('.server-status').text();
        expect(serverStatus).toMatch(/error/i);
      })
    );

    describe('with save success', () =>
      it('Renders saving labels as it progresses', function (done) {
        this.server.respondWith([200, { 'Content-Type': 'application/json' }, '{}']);

        this.configModel.set('outdoorCoilTemperature', true);
        const serverStatusSelector = '.server-status';

        let serverStatus = this.view.render().$(serverStatusSelector).text().replace(/\s+/g, '');
        expect(serverStatus).toEqual('Saving...');

        this.server.respond();

        serverStatus = this.view.render().$(serverStatusSelector).text().replace(/\s+/g, '');
        expect(serverStatus).toEqual('Saved');

        setTimeout(() => {
          serverStatus = this.view.render().$(serverStatusSelector).text();
          expect(serverStatus).toMatch(/last updated/i);
          done();
        });
      })
    );
  });
};
