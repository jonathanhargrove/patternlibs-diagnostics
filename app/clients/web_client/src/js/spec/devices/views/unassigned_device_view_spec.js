/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
define(function (require) {
  require('spec/spec_helper');
  const Customer             = require('customers/models/customer');
  const CustomersCollection  = require('customers/models/customers_collection');
  const ModalDialog          = require('utils/modal_dialog');
  const Session              = require('root/models/session');
  const Thermostat           = require('devices/models/thermostat');
  const UnassignedDeviceView = require('devices/views/unassigned_device_view');

  require('sinon');

  describe('UnassignedDeviceView', function () {
    beforeEach(function () {
      this.session = new Session({roles: [], enabledFeatures: []});
      this.model = new Thermostat({deviceId: '014001A8'});

      const customer = new Customer();
      customer.setUnassignedDeviceId(this.model.id);
      this.customers = new CustomersCollection();
      this.customers.add(customer);

      this.view = new UnassignedDeviceView({model: this.model, session: this.session, customers: this.customers, reportCache: {}, rthSource: {}, readOnly: true});
      sinon.stub(this.view, 'renderChildViews').returns(true);
    });

    describe("when 'assign system' is clicked", function () {
      beforeEach(function () {
        $.fn.foundation = sinon.stub();
        this.showSpy = sinon.spy(ModalDialog.prototype, 'show');
      });

      afterEach(function () {
        $.fn.foundation = undefined;
        this.showSpy.restore();
      });

      it('shows the assign system dialog', function () {
        this.view.render().$el.find('#assign-device').click();
        expect(this.showSpy.called).toBeTruthy();
      });
    });
  });
});
