define(function (require) {
  require('spec/spec_helper');
  const SpiderConfig = require('devices/models/spider_config');
  const ReportUtils = require('devices/utils/spider_report_utils');
  const Factories = require('spec/_support/factories');

  beforeEach(function () {
    this.spider = Factories.create('spider');
    this.config = new SpiderConfig(null, {model: this.spider, saveWaitTime: 0});
  });

  it('enables all properties by default', function () {
    ReportUtils.ATTRIBUTES.forEach(attr => {
      expect(this.config.get(attr)).toEqual(false);
    });
  });

  describe('persistence', function () {
    beforeEach(function () {
      this.saveStub = sinon.stub(this.spider, 'save');
    });

    afterEach(function () {
      this.saveStub.restore();
    });

    it('persists updates on every change after a timeout', function () {
      this.config.set('outdoorCoilTemperature', true);

      expect(this.saveStub.calledOnce).toBeTruthy();

      const firstArg = this.saveStub.args[0][0];
      const secondArg = this.saveStub.args[0][1];

      expect(firstArg).toEqual({
        configuration: {outdoorCoilTemperature: true}
      });

      expect(secondArg.silent).toBe(true);
      expect(secondArg.patch).toBe(true);
      expect(typeof secondArg.success).toEqual('function');
      expect(typeof secondArg.error).toEqual('function');
    });
  });

  describe('#url', () =>
    it('should be the update URL for its device', function () {
      expect(this.config.url()).toEqual(this.spider.url());
    })
  );

  describe('event propagation', function () {
    beforeEach(function () {
      this.server = sinon.fakeServer.create();
    });

    afterEach(function () {
      this.server.restore();
    });

    it('propagates spider success event as sync', function () {
      const callback = sinon.spy();

      this.config.on('sync', callback);
      this.server.respondWith([200, { 'Content-Type': 'application/json' }, '{}']);

      this.config.set('outdoorCoilTemperature', true);
      this.server.respond();

      expect(callback.calledOnce).toBe(true);
    });

    it('propagates spider error event as error', function () {
      const callback = sinon.spy();

      this.config.on('error', callback);
      this.server.respondWith([400, { 'Content-Type': 'application/json' }, '{}']);

      this.config.set('outdoorCoilTemperature', true);
      this.server.respond();

      expect(callback.calledOnce).toBe(true);
    });
  });
});
