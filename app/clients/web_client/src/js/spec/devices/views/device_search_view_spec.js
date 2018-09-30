require('spec/spec_helper');
const DeviceSearchView = require('devices/views/device_search_view');
const sinon            = require('sinon');
const Factories        = require('spec/_support/factories');

describe('DeviceSearchView', () => {
  let view, showSystemSpy, server, session, router;

  beforeEach(() => {
    router = {
      navigate: sinon.stub()
    };
    session = {
      featureEnabled: sinon.stub()
    };
    view = new DeviceSearchView({ router, dealerUUid: '123456', deviceId: null, session });
    showSystemSpy = sinon.spy(view, '_showSystem');

    server = sinon.fakeServer.create();
  });

  afterEach(() => {
    showSystemSpy.restore();
    server.restore();
  });

  it('renders a system', () => {
    let system = Factories.create('system');
    system.set('dealer', {
      username: 'DEALER NAME',
      dealerName: 'DEALERSHIP NAME',
      phoneNumber: '1111111111'
    });
    let deviceId = system.primaryDevice.id;
    let systemJson = JSON.stringify(system.toJSON());
    server.respondWith(`/api/systems/${deviceId}`, [200, {'Content-Type': 'application/json'}, systemJson]);

    view = new DeviceSearchView({ router, deviceId, session });
    view.render();
    server.respond();

    let dealerInfo = 'DEALERSHIP NAME, 1111111111';
    expect(view.$('#system-header').html()).toEqual(`<h1>System ${deviceId}</h1><p>Dealer: ${dealerInfo}</p>`);
  });

  it('escapes input values', () => {
    view.render().$('input[name=deviceId]').val('<script>console.info("alert");</script>');
    view.$('#devices-search').trigger('submit');

    expect(showSystemSpy.calledWith('<script>console.info("alert");</script>')).toBeFalsy();
  });

  it('trims whitespace', () => {
    let whitespaceId = ' 1234567890 ';
    let noWhitespaceId = '1234567890';
    view.render().$('input[name=deviceId]').val(whitespaceId);
    view.$('#devices-search').trigger('submit');

    expect(showSystemSpy.calledWith(whitespaceId)).toBeFalsy();
    expect(showSystemSpy.calledWith(noWhitespaceId)).toBeTruthy();
  });
});
