define(function (require) {
  require('spec/spec_helper');
  const Stream = require('reports/common/stream');
  const NexiaStream = require('infrastructure/nexia_stream');
  require('sinon');

  describe('Stream', function () {
    beforeEach(function () {
      this.addEventListenerSpy = sinon.spy(NexiaStream.instance(), 'addEventListener');
      this.removeEventListenerSpy = sinon.spy(NexiaStream.instance(), 'removeEventListener');
      this.whenConnectedListenerSpy = sinon.spy(NexiaStream.instance(), 'whenConnected');
      this.updateSpy = sinon.spy(Stream.prototype, '_update');
      this.handleErrorSpy = sinon.spy(Stream.prototype, '_handleError');
      this.registerSpy = sinon.spy(Stream.prototype, '_register');

      this.stream = new Stream();
      this.stream.deviceId = 'A987654A';
      this.stream.eventType = 'stream_event';
    });

    afterEach(function () {
      this.addEventListenerSpy.restore();
      this.removeEventListenerSpy.restore();
      this.whenConnectedListenerSpy.restore();
      this.updateSpy.restore();
      this.handleErrorSpy.restore();
      this.registerSpy.restore();
    });

    describe('#subscribe', function () {
      beforeEach(function () {
        this.stream.url = () => 'fake_url';
        this.ajaxSpy = sinon.spy($, 'ajax');
      });

      afterEach(() => $.ajax.restore());

      it('adds an update event listener for the device and its event type', function () {
        this.stream.subscribe();

        expect(this.addEventListenerSpy.calledWith('A987654A_stream_event', this.updateSpy));
      });

      it('removes the stream error listener on window unload', function () {
        const onSpy = sinon.spy();
        const fakejQuery =
          {on: onSpy};

        sinon.stub(window, '$').returns(fakejQuery);

        this.stream.subscribe();

        const unloadCallback = fakejQuery.on.getCall(0).args[1];
        unloadCallback();

        expect(this.removeEventListenerSpy.calledWith('error', this.handleErrorSpy));

        window.$.restore();
      });

      it('adds an error event listener', function () {
        this.stream.subscribe();

        expect(this.addEventListenerSpy.calledWith('error', this.handleErrorSpy));
      });

      it('fetches the model data when connected', function () {
        const subscribeToSpy = sinon.stub(NexiaStream.instance(), 'subscribeTo');
        this.stream.subscribe();

        expect(this.whenConnectedListenerSpy.called).toBeTruthy();
        // first argument is a callback that should call the Ajax URL
        this.whenConnectedListenerSpy.firstCall.args[0]();

        expect(subscribeToSpy.calledWith('fake_url')).toBeTruthy();
      });
    });

    describe('#unsubscribe', function () {
      beforeEach(function () {
        this.unsubscribeSpy = sinon.spy(NexiaStream.instance(), 'unsubscribeFrom');
        this.stream.url = () => 'fake_delete_url';
      });

      afterEach(function () {
        this.unsubscribeSpy.restore();
      });

      it('removes the error event listener', function () {
        this.stream.unsubscribe();

        expect(this.removeEventListenerSpy.calledWith('error', this.handleErrorSpy));
      });

      it('removes the reconnect event listener', function () {
        this.stream.unsubscribe();

        expect(this.removeEventListenerSpy.calledWith('open', this.registerSpy));
      });

      it('removes the update event listener', function () {
        this.stream.unsubscribe();

        expect(this.removeEventListenerSpy.calledWith('A987654A_stream_event', this.updateSpy));
      });

      it('sends a DELETE request to the server for the subscription', function () {
        this.stream.unsubscribe();

        expect(this.unsubscribeSpy.calledWith('fake_delete_url')).toBeTruthy();
      });
    });

    describe('onErrorCallback', () => it("gets called when there's a NexiaStream error"));

    describe('onMessageCallback', () => it("gets called when there's a successfull NexiaStream message"));
  });
});
