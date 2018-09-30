import Backbone from 'backbone';
import ShutdownDevice from 'systems/models/shutdown_device';
import ShutdownDeviceCollection from 'systems/models/shutdown_device_collection';
import ShutdownDevicesView from 'reports/sys_config/views/shutdown_devices_view';
import sinon from 'sinon';

require('spec/spec_helper');

describe('ShutdownDevicesView', function () {
  beforeEach(function () {
    this.state = new Backbone.Model();
    this.model = new ShutdownDevice({deviceType: 'smoke_detector'});
    this.collection = new ShutdownDeviceCollection([this.model]);
    this.view = new ShutdownDevicesView({
      collection: this.collection,
      state: this.state
    });
  });

  describe('render on change', function () {
    beforeEach(function () {
      sinon.stub(ShutdownDevicesView.prototype, 'render');
    });

    afterEach(function () {
      ShutdownDevicesView.prototype.render.restore();
    });

    it('renders on user input', function () {
      // emulate user input
      this.model.trigger('change');
      expect(this.view.render.called).toBeTruthy();
    });

    it("doesn't render on user input of an 'other' field", function () {
      // emulate user input on otherDeviceType
      this.model.trigger('change', this.model, {
        stickitChange: {
          observe: 'otherDeviceType'
        }
      });
      expect(this.view.render.called).toBeFalsy();
    });
  });
});
