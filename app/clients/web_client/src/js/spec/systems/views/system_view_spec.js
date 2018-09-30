define(function (require) {
  require('spec/spec_helper');
  require('sinon');
  const Factories  = require('spec/_support/factories');
  const SystemView = require('systems/views/system_view');
  const DeviceView = require('devices/views/device_view');
  const Theme      = require('utils/theme');
  const Session    = require('root/models/session');

  describe('SystemView', function () {
    beforeEach(function () {
      Theme.set('nexia');

      this.system = Factories.build('system', {'group': 'A Group'});
      this.spider = Factories.build('spider');
      this.system.getDevices().add(this.spider);
      this.thermostat = this.system.thermostat();
      this.renderSpy = sinon.spy(DeviceView.prototype, 'render');
      this.removeSpy = sinon.spy(DeviceView.prototype, 'remove');
      this.session = new Session();
      this.view = new SystemView({model: this.system, reportCache: {}, session: this.session, canShowGroup: true});
    });

    afterEach(function () {
      Theme.set('nexia');

      this.renderSpy.restore();
      this.removeSpy.restore();
    });

    describe('#render', function () {
      it('renders the thermostat view', function () {
        this.system.primaryDevice.set({status: 'OPTED IN', capabilities: ['current_status']});
        this.view.render();

        const result = _.findWhere(this.view.deviceViews, {model: this.thermostat});

        expect(result).toBeTruthy();
        expect(this.view.$('#thermostat-current-status-container').length).toEqual(1);
      });

      describe('with the ndm feature disabled', function () {
        it('does not display the ndm device', function () {
          this.view.render();

          const result = _.findWhere(this.view.deviceViews, {model: this.spider});

          expect(result).toBeFalsy();
          expect(this.view.$('.ndm-current-status-container').length).toEqual(0);
        });
      });

      describe('with the ndm feature enabled', function () {
        beforeEach(function () {
          this.session.addFeatureCode('ndm', {forceEnable: true});
        });

        it('displays the ndm device', function () {
          this.view.render();

          const result = _.findWhere(this.view.deviceViews, {model: this.spider});

          expect(result).toBeTruthy();
          expect(this.view.$('.ndm-current-status-container').length).toEqual(1);
        });

        describe('with an opted-out thermostat', function () {
          it('will still render the ndm device', function () {
            this.system.primaryDevice.set({status: 'OPTED OUT', capabilities: ['current_status']});

            this.view.render();

            const result = _.findWhere(this.view.deviceViews, {model: this.spider});

            expect(result).toBeTruthy();
            expect(this.view.$('.ndm-current-status-container').length).toEqual(1);
          });
        });
      });
    });

    describe('#remove', () =>
      it('removes device views', function () {
        this.view.render();
        this.view.remove();

        expect(this.removeSpy.called).toBeTruthy();
      })
    );

    describe('for the nexia theme', function () {
      it("doesn't allow the user to change the group", function () {
        const view = new SystemView({model: Factories.build('system'), session: this.session}).render();

        expect(view.$('#change-group').length).toBeFalsy();
      });

      describe("with a system that's assigned to a group", () =>
        it('allows the user to change the group', function () {
          sinon.stub(this.session, 'featureEnabled').returns(true);

          const view = new SystemView({model: Factories.build('system'), session: this.session, canShowGroup: true}).render();

          expect(this.session.featureEnabled.calledWith('sysgroup')).toBeTruthy();
          expect(view.$('#change-group').length).toBeTruthy();

          this.session.featureEnabled.restore();
        })
      );
    });

    describe('for the trane theme', () =>
      it('allows the user to change the group', function () {
        Theme.set('trane');

        this.view.render();

        expect(this.view.$('#change-group').length).toBeTruthy();
      })
    );

    describe('with the sysgroup feature code enabled', () =>
      it('allows the user to change the group', function () {
        sinon.stub(this.session, 'featureEnabled').returns(true);

        this.view.render();

        expect(this.view.$('#change-group').length).toBeTruthy();
      })
    );
  });
});
