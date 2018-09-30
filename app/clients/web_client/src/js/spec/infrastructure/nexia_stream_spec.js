define(function (require) {
  require('spec/spec_helper');
  const NexiaStream = require('infrastructure/nexia_stream');
  const Cookies = require('infrastructure/cookies');

  describe('NexiaStream', function () {
    beforeEach(function () {
      this.mockEventSource = {
        eventListeners: [],
        addEventListener (type, callback) {
          this.eventListeners.push({type, callback});
        },
        removeEventListener () {},
        close () {}
      };
    });

    afterEach(() => NexiaStream.reset());

    describe('.instance', function () {
      it('is a singleton', () => expect(NexiaStream.instance()).toBe(NexiaStream.instance()));

      it('writes a cookie containing a RFC1422-compliant uuid for the EventSource', function () {
        NexiaStream.reset();

        sinon.spy(Cookies, 'setStreamId');

        NexiaStream.instance();

        expect(Cookies.setStreamId.called).toBeTruthy();
      });
    });

    describe('construction', () =>
      it('throws an exception if you try manually new one up', function () {
        new NexiaStream(this.mockEventSource); // eslint-disable-line no-new
        expect(() => new NexiaStream()).toThrow();
      })
    );

    describe('#addEventListener', function () {
      beforeEach(function () {
        this.stream = new NexiaStream(this.mockEventSource);
      });

      it('adds an event listener to the event source', function () {
        const addEventListenerSpy = sinon.spy(this.mockEventSource, 'addEventListener');
        const fakeCallback = function () {};

        this.stream.addEventListener('fakeEvent', fakeCallback);

        expect(addEventListenerSpy.calledWith('fakeEvent', fakeCallback)).toBeTruthy();
      });

      it('keeps track of the event listener -so it can be remove later', function () {
        const eventListenerCount = this.stream.eventListeners().length;

        this.stream.addEventListener('fakeEvent', function () {});

        expect(this.stream.eventListeners().length).toBe(eventListenerCount + 1);
      });
    });

    describe('#removeEventListener', function () {
      beforeEach(function () {
        this.stream = new NexiaStream(this.mockEventSource);
      });

      it('removes an event listener from the event source', function () {
        const removeEventListenerSpy = sinon.spy(this.stream.eventSource, 'removeEventListener');
        const fakeCallback = function () {};

        this.stream.removeEventListener('fakeEvent', fakeCallback);

        expect(removeEventListenerSpy.calledWith('fakeEvent', fakeCallback)).toBeTruthy();
      });

      it('removes the event from the tracking list', function () {
        const fakeCallback = function () {};

        this.stream.addEventListener('fakeEvent', fakeCallback);

        expect(this.stream.eventListeners().length).toBeGreaterThan(1);

        this.stream.removeEventListener('fakeEvent', fakeCallback);

        expect(this.stream.eventListeners().length).toBe(0);
      });
    });

    describe('#removeAllEventListeners', function () {
      it('removes all event listeners from the event source', function () {
        const stream = new NexiaStream(this.mockEventSource);

        expect(stream.eventListeners().length).toBeGreaterThan(0);

        stream.removeAllEventListeners();

        expect(stream.eventListeners().length).toBe(0);
      });

      describe('when an event source errors', () =>
        describe('with the .errorCallback set', () =>
          it('calls the errorCallback', function () {
            new NexiaStream(this.mockEventSource); // eslint-disable-line no-new

            const errorCallbackSpy = sinon.spy();
            NexiaStream.errorCallback = errorCallbackSpy;

            const close = _.find(this.mockEventSource.eventListeners, event => event.type === 'error');

            close.callback();

            expect(errorCallbackSpy.called).toBeTruthy();
          })
        )
      );
    });

    describe('.reset', () =>
      describe('current event source', function () {
        beforeEach(function () {
          this.stream = new NexiaStream(this.mockEventSource);
        });

        it('is closed', function () {
          const closeSpy = sinon.spy(this.stream.eventSource, 'close');

          NexiaStream.reset();

          expect(closeSpy.called).toBeTruthy();
        });
        it('has all event listeners removed', function () {
          const removeAllEventsSpy = sinon.spy(this.stream, 'removeAllEventListeners');

          NexiaStream.reset();

          expect(removeAllEventsSpy.called).toBeTruthy();
        });

        it('is dereferrenced as the singleton instance', function () {
          NexiaStream.reset();

          expect(NexiaStream._instance).toBeNull();
        });
      })
    );

    describe('#whenConnected', function () {
      beforeEach(function () {
        this.stream = new NexiaStream(this.mockEventSource);
        this.callbackSpy = sinon.spy();
      });

      describe('if the stream is open', function () {
        beforeEach(function () {
          this.stream.setConnected();
        });

        it('runs the callback immediately', function () {
          this.stream.whenConnected(this.callbackSpy);
          expect(this.callbackSpy.called).toBeTruthy();
        });
      });

      describe('if the stream is not yet open', function () {
        beforeEach(function () {
          this.stream.setConnected(false);
        });

        it('does not call the callback', function () {
          this.stream.whenConnected(this.callbackSpy);
          expect(this.callbackSpy.called).toBeFalsy();
        });

        it('adds it to the pending callbacks list', function () {
          this.stream.whenConnected(this.callbackSpy);
          expect(this.stream.pendingConnectCallbacks).toContain(this.callbackSpy);
        });
      });
    });

    describe('._onOpen', function () {
      beforeEach(function () {
        this.stream = new NexiaStream(this.mockEventSource);
        this.setConnectedSpy = sinon.spy(this.stream, 'setConnected');
        this.runCallbacksSpy = sinon.spy(this.stream, 'runPendingConnectCallbacks');
      });

      afterEach(function () {
        this.stream.setConnected.restore();
        this.stream.runPendingConnectCallbacks.restore();
      });

      it("sets the instance's connected status", function () {
        _(this.stream._onOpen).bind(this)();
        expect(this.setConnectedSpy.called).toBeTruthy();
      });

      it('runs the pending connect callbacks', function () {
        _(this.stream._onOpen).bind(this)();
        expect(this.runCallbacksSpy.called).toBeTruthy();
      });
    });

    describe('#subscribeTo', function () {
      beforeEach(function () {
        this.stream = new NexiaStream(this.mockEventSource);
        this.url = 'whatever';

        this.ajaxStub = sinon.stub($, 'ajax');
      });

      afterEach(function () {
        this.ajaxStub.restore();
      });

      it('increments the count of subscriptions for that url', function () {
        expect(this.stream.subscriptions[this.url]).toBeUndefined();

        this.stream.subscribeTo(this.url);
        this.stream.subscribeTo(this.url);

        expect(this.stream.subscriptions[this.url]).toBe(2);
      });

      it('makes an ajax call to the URL', function (done) {
        this.stream.subscribeTo(this.url);

        setTimeout(() => {
          expect(this.ajaxStub.calledWith(this.url + `?streamSocketId=${this.stream.streamId()}`)).toBeTruthy();

          done();
        }, 10);
      });

      it('does not make requests on subsequent subscribes', function (done) {
        this.stream.subscribeTo(this.url);
        this.stream.subscribeTo(this.url);

        setTimeout(() => {
          expect(this.stream.subscriptions[this.url]).toBe(2);
          expect(this.ajaxStub.args.length).toBe(1);

          done();
        }, 10);
      });
    });

    describe('#unsubscribeFrom', function () {
      beforeEach(function () {
        this.stream = new NexiaStream(this.mockEventSource);
        this.url = 'whatever';

        this.ajaxStub = sinon.stub($, 'ajax');
      });

      afterEach(function () {
        this.ajaxStub.restore();
      });

      it('decrements the count of subscriptions for that url', function () {
        expect(this.stream.subscriptions[this.url]).toBeUndefined();

        this.stream.subscribeTo(this.url);
        this.stream.subscribeTo(this.url);

        expect(this.stream.subscriptions[this.url]).toBe(2);

        this.stream.unsubscribeFrom(this.url);
        this.stream.unsubscribeFrom(this.url);

        expect(this.stream.subscriptions[this.url]).toBe(null);
      });

      it('makes an ajax call to the URL', function (done) {
        this.stream.subscribeTo(this.url);
        this.stream.unsubscribeFrom(this.url);

        setTimeout(() => {
          expect(this.ajaxStub.calledWith(this.url + `?streamSocketId=${this.stream.streamId()}`, { type: 'DELETE' })).toBeTruthy();

          done();
        }, 10);
      });

      it('makes request for only the last unsubscribe', function (done) {
        this.stream.subscribeTo(this.url);
        this.stream.subscribeTo(this.url);
        this.stream.unsubscribeFrom(this.url);
        this.stream.unsubscribeFrom(this.url);

        setTimeout(() => {
          expect(this.stream.subscriptions[this.url]).toBeNull();

          expect(this.ajaxStub.args.length).toBe(2);
          expect(this.ajaxStub.calledWith(this.url + `?streamSocketId=${this.stream.streamId()}`)).toBeTruthy();
          expect(this.ajaxStub.calledWith(this.url + `?streamSocketId=${this.stream.streamId()}`, { type: 'DELETE' })).toBeTruthy();

          done();
        }, 10);
      });
    });

    it('PENDING: should include a hook to ensure the saftey of events that has not been implemented yet', function () {});
  });
});
// NexiaStream.instance()
// expect(NexiaStream._event_source.dispatchEvent).toBe NexiaStream.instance().safeDispatchEvent
