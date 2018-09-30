define(function (require) {
  require('spec/spec_helper');

  const AlertIconDetailView = require('dashboard/views/alert_icon_detail_view');

  describe('AlertIconDetailView', function () {
    describe('#render', function () {
      beforeEach(function () {
        this.customer = Factories.build('customer', {
          'id': 1,
          'firstName': 'Alpha',
          'lastName': 'Bravo',
          'address1': '123 Main',
          'zip': '12345'
        });

        const system1 = Factories.build('system');
        const system2 = Factories.build('system');
        this.device1 = Factories.build('thermostat', { criticalAlerts: 2, majorAlerts: 3, status: 'OPTED IN' });
        this.device2 = Factories.build('thermostat', { majorAlerts: 4, status: 'OPTED IN' });

        system1.getDevices().add([this.device1]);
        system2.getDevices().add([this.device2]);
        this.customer.getSystems().add([system1, system2]);

        this.view = new AlertIconDetailView({ model: this.customer }).render();
      });

      it('displays the customer name', function () {
        expect(this.view.$('.name').html()).toContain('Alpha Bravo');
      });

      it('displays the customer address', function () {
        expect(this.view.$('.steet-address').html()).toContain('123 Main');
        expect(this.view.$('.city-state-zip').html()).toContain('12345');
      });

      it('displays a link to the system detail page for each system', function () {
        const link1 = `a[href="/customers/${this.customer.get('id')}/systems/${this.device1.get('deviceId')}"]`;
        const link2 = `a[href="/customers/${this.customer.get('id')}/systems/${this.device2.get('deviceId')}"]`;

        expect(this.view.$('.device-info:nth-child(1)').has(link1).length).toBeTruthy();
        expect(this.view.$('.device-info:nth-child(2)').has(link2).length).toBeTruthy();
      });

      describe('when the model has critical alerts', function () {
        it('displays a critical alerts icon', function () {
          expect(this.view.$('.device-info:nth-child(1) .alert-icon').hasClass('icon-warning-sign')).toBeTruthy();
        });

        it('displays a count for critical alerts', function () {
          expect(this.view.$('.device-info:nth-child(1) .critical .count').html()).toBe('2');
        });
      });

      describe('when the model has major alerts', function () {
        it('displays a major alerts icon', function () {
          expect(this.view.$('.device-info:nth-child(1) .alert-icon').hasClass('icon-notification')).toBeTruthy();
          expect(this.view.$('.device-info:nth-child(2) .alert-icon').hasClass('icon-notification')).toBeTruthy();
        });

        it('displays a count for major alerts', function () {
          expect(this.view.$('.device-info:nth-child(1) .major .count').html()).toBe('3');
          expect(this.view.$('.device-info:nth-child(2) .major .count').html()).toBe('4');
        });
      });
    });
  });
});
