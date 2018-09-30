require('spec/spec_helper');
const Session = require('root/models/session');
const SysConfig = require('sys_config/models/sys_config');
const SystemConfig = require('systems/models/system_config').default;
const SysConfigView = require('sys_config/views/sys_config_view').default;
const Factories = require('spec/_support/factories');

describe('SysConfigView', function () {
  beforeEach(function () {
    this.deviceModel = 'XL850';
    this.session = new Session({roles: [], enabledFeatures: []});
    this.system = Factories.create('system');
    this.sysConfig = new SysConfig({deviceId: '014001A8', deviceModel: this.deviceModel});
    this.view = new SysConfigView({model: this.sysConfig, system: this.system, session: this.session});
    this.view.render();
  });

  describe('with no OD Unit Stages', function () {
    beforeEach(function () {
      this.sysConfig.set('outdoorStage', null);
    });

    it('displays N/A for the outdoor stage', function () {
      const stages = this.view.render().$el.find('.field-value.od-stages').html();
      expect(stages).toBe('N/A');
    });
  });

  describe('with no OD Compressor', function () {
    beforeEach(function () {
      this.sysConfig.set('compressorType', null);
    });

    it('displays N/A for the outdoor compressor type', function () {
      const compressor = this.view.render().$el.find('.field-value.od-compressor').html();
      expect(compressor).toBe('N/A');
    });
  });

  describe('with OD compressor and unit stages', function () {
    beforeEach(function () {
      this.outdoorStage = 'the globe';
      this.compressorType = 'limiter';

      this.sysConfig.set('compressorType', this.compressorType);
      this.sysConfig.set('outdoorStage', this.outdoorStage);
    });

    it('displays the OD compressor type value correctly', function () {
      const compressor = this.view.render().$el.find('.field-value.od-compressor').html();
      expect(compressor).toBe(this.compressorType);
    });

    it('displays the OD compressor type value correctly', function () {
      const stage = this.view.render().$el.find('.field-value.od-stages').html();
      expect(stage).toBe(this.outdoorStage);
    });
  });

  describe('when the device model is an 950', function () {
    beforeEach(function () {
      this.deviceModel = 'XL950';
      this.sysConfig = new SysConfig({deviceId: '014001A8', deviceModel: this.deviceModel});
      this.view = new SysConfigView({model: this.sysConfig, system: this.system, session: this.session});
    });

    it("renders an 'Experimental' label", function () {
      expect(this.view.render().$el.find('.panel-header .experimental').length).toBe(1);
    });
  });

  describe('with the ndm feature code', function () {
    beforeEach(function () {
      this.session.addFeatureCode('ndm', {forceEnable: true});
      this.view.render();
    });

    describe('SystemConfig model', function () {
      it('renders when the config syncs', function () {
        sinon.stub(SysConfigView.prototype, 'render');
        this.view = new SysConfigView({model: this.sysConfig, system: this.system, session: this.session});

        this.view.config.trigger('sync');
        expect(this.view.render.called).toBeTruthy();

        SysConfigView.prototype.render.restore();
      });

      describe('auto save', function () {
        beforeEach(function () {
          sinon.stub(SystemConfig.prototype, 'save');
          this.view = new SysConfigView({model: this.sysConfig, system: this.system, saveWaitTime: 0, session: this.session});
          this.view.render();
        });

        afterEach(() => SystemConfig.prototype.save.restore());

        it('fires when it changes via user input', function () {
          this.view.config.trigger('change', 'modelFake', {stickitChange: true});
          expect(this.view.config.save.called).toBeTruthy();
        });

        it("doesn't fire when it changes via sync", function () {
          this.view.config.trigger('change');
          expect(this.view.config.save.called).toBeFalsy();
        });
      });
    });

    describe('toggling edit mode', () =>
      it('has the correct class and button text', function () {
        const buttonSelector = '[data-js=toggle-is-editing]';

        expect(this.view.$el.hasClass('is-editing')).toBeFalsy();
        expect(_.trim(this.view.$(buttonSelector).text())).toEqual('Edit');

        this.view.$(buttonSelector).click();

        expect(this.view.$el.hasClass('is-editing')).toBeTruthy();
        expect(_.trim(this.view.$(buttonSelector).text())).toEqual('Done');
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
