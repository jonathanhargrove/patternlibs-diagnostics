/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
require('event-source-polyfill');
const Cookies     = require('infrastructure/cookies');

// class StreamSecurityError extends Error {
// constructor (msg) {
// super(msg);
// this.message = msg;
// this.name = 'StreamSecurityError';
// }
// }

require('rate_limit');

class NexiaStream {
  static initClass () {
    NexiaStream.WAITING = EventSource.WAITING;
    NexiaStream.CONNECTING = EventSource.CONNECTING;
    NexiaStream.OPEN = EventSource.OPEN;
    NexiaStream.CLOSED = EventSource.CLOSED;

    this.prototype._eventListeners = [];
  }

  eventListeners () { return this._eventListeners.slice(0); }

  constructor (eventSource, streamSocketId) {
    this.eventListeners = this.eventListeners.bind(this);
    this._ensureSafe = this._ensureSafe.bind(this);
    if (streamSocketId == null) { streamSocketId = undefined; }
    if (NexiaStream._instance) {
      throw new Error('Singleton Class: use NexiaStream.instance() instead of constructor');
    } else {
      NexiaStream._instance = this;
      this.eventSource = eventSource;
      this.streamSocketId = streamSocketId;
      this.eventSource.dispatchEvent = this.safeDispatchEvent(this.eventSource.dispatchEvent, this._ensureSafe);
      this.pendingConnectCallbacks = [];
      this.connected = false;
      this.subscriptions = {};

      // HACK: Hundreds of sequential subscribes can lock up the UI.
      // Rate limiting them by 1ms gives the UI enough time to be responsive.
      this.rateLimitSubscribeTo = _.rateLimit((url) => $.ajax(this._urlWithStreamId(url)), 1);
      this.rateLimitUnsubscribeFrom = _.rateLimit((url) => $.ajax(this._urlWithStreamId(url), { type: 'DELETE' }), 1);

      this.addEventListener('open', this._onOpen);
      this.addEventListener('message', this._onMessage); // catchall for events without a type
      this.addEventListener('close', this._onClose);
      this.addEventListener('error', this._onError);
    }
  }

  addEventListener (type, callback) {
    this._eventListeners.push({ type, callback });
    return this.eventSource.addEventListener(type, callback);
  }

  removeEventListener (type, callback) {
    this._eventListeners = _.reject(this._eventlisteners, event => (event.type === type) && (event.callback === callback));
    return this.eventSource.removeEventListener(type, callback);
  }

  removeAllEventListeners () {
    return _.each(this._eventListeners, event => {
      return this.removeEventListener(event.type, event.callback);
    });
  }

  safeDispatchEvent (originalDispatcher, ensureSafe) {
    return function () {
      ensureSafe.apply(this, arguments);
      return originalDispatcher.apply(this, arguments);
    };
  }

  whenConnected (onConnectCallback) {
    if (!this.connected) {
      return this.pendingConnectCallbacks.push(onConnectCallback);
    } else {
      return onConnectCallback();
    }
  }

  subscribeTo (url) {
    if (!this.subscriptions[url]) {
      this.subscriptions[url] = 1;
      this.rateLimitSubscribeTo(url);
    } else {
      this.subscriptions[url]++;
    }
  }

  unsubscribeFrom (url) {
    if (this.subscriptions[url] == null) { return; }

    if (--this.subscriptions[url] === 0) {
      this.rateLimitUnsubscribeFrom(url);
      this.subscriptions[url] = null;
    }
  }

  setConnected (value) {
    if (value == null) { value = true; }
    this.connected = value;
  }

  runPendingConnectCallbacks () {
    _(this.pendingConnectCallbacks).each(callback => callback());
    this.pendingConnectCallbacks = [];
  }

  streamId () {
    return this.streamSocketId;
  }

  _urlWithStreamId (url) {
    return url + `?streamSocketId=${this.streamId()}`;
  }

  _ensureSafe (e) {
    return this._debugStream(e);
  }
  // if event.origin != "http://dealer.mynexia" # is it possible to check origin for eventsource?
  // throw new StreamSecurityError("Cross Site Scripting Attack Detected: Your IP has been logged.")
  // if(checksum(event.data) != event.checksum)  #is asymetic key signing possible in JS? how concerned are we about this?
  //   throw new StreamSecurityError("This message has been tapered with. Your IP has been logged.")

  _close () {
    return this.eventSource.close();
  }

  _onError () {
    return (typeof NexiaStream.errorCallback === 'function' ? NexiaStream.errorCallback() : undefined);
  }

  _onOpen () {
    console.log('NexiaStream: Connection opened.');
    NexiaStream.instance().setConnected();
    return NexiaStream.instance().runPendingConnectCallbacks();
  }

  _onMessage (e) {
    // don't log anything to console
    // console.log('no event for onMessage') unless e
    // console.log('NexiaStream: onMessage catchall for events without a type') unless e.type
    // console.log("lastId: #{e.lastEventId}") #eventstream message format
    // console.log("type: #{e.type}")
    // console.log("data: #{e.data}")
  }

  _onClose () {
    console.log('NexiaStream: Connection closed.');
    return NexiaStream.instance().setConnected(false);
  }

  _debugStream (e) {
    return this._onMessage(e);
  }
}
NexiaStream.initClass();

NexiaStream.instance = function (url, options) {
  if (!NexiaStream._instance) {
    Cookies.setStreamId();
    const uuid = Cookies.uuid();
    url = (url || '/stream/') + `?streamSocketId=${uuid}`;
    const eventSource = new EventSource(url, options);
    new NexiaStream(eventSource, uuid); // eslint-disable-line no-new
  }
  return NexiaStream._instance;
};

NexiaStream.reset = function () {
  if (NexiaStream._instance) {
    NexiaStream._instance._close();
    NexiaStream._instance.removeAllEventListeners();
    NexiaStream._instance = null;
  }
};

NexiaStream.errorCallback = null;

module.exports = NexiaStream;
