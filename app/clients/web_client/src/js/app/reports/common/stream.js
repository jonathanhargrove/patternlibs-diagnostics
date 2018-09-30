/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const NexiaStream = require('infrastructure/nexia_stream');

class Stream {
  constructor () {
    this._handleError = this._handleError.bind(this);
    this._register = this._register.bind(this);
  }

  subscribe () {
    if (!this.handleErrorWrapper) { this.handleErrorWrapper = () => this._handleError(); }
    if (!this.registerWrapper) { this.registerWrapper = () => this._register(); }
    if (!this.handleMessageWrapper) { this.handleMessageWrapper = e => (typeof this.onMessageCallback === 'function' ? this.onMessageCallback() : undefined); }

    NexiaStream.instance().addEventListener(`${this.deviceId}_${this.eventType}`, this._update.bind(this));
    NexiaStream.instance().addEventListener('message', this.handleMessageWrapper);
    NexiaStream.instance().addEventListener('error', this.handleErrorWrapper);

    // debugger unless $(window).on
    $(window).on('unload', () => NexiaStream.instance().removeEventListener('error', this.handleErrorWrapper));

    // wait until the stream is established to subscribe to the thing
    const url = this.url();
    return NexiaStream.instance().whenConnected(() => NexiaStream.instance().subscribeTo(url));
  }

  unsubscribe () {
    NexiaStream.instance().removeEventListener('error', this.handleErrorWrapper);
    NexiaStream.instance().removeEventListener('message', this.handleMessageWrapper);
    NexiaStream.instance().removeEventListener('open', this.registerWrapper);
    NexiaStream.instance().removeEventListener(`${this.deviceId}_${this.eventType}`, this._update);

    // you can safely unsubscribe immediately-- if the stream isn't established,
    // you didn't really do anything with the subscribe in the first place
    return NexiaStream.instance().unsubscribeFrom(this.url());
  }

  onErrorCallback () {}

  onMessageCallback () {}

  _update () {
    throw new Error('The method "update" must be overridden in the subclass.');
  }

  _handleError () {
    if (typeof this.onErrorCallback === 'function') {
      this.onErrorCallback();
    }
    return NexiaStream.instance().addEventListener('open', this.registerWrapper);
  }

  _register () {
    NexiaStream.instance().removeEventListener('open', this.registerWrapper);
    return this.subscribe();
  }

  extendOnTo (destination) {
    destination.subscribe = Stream.prototype.subscribe;
    destination.unsubscribe = Stream.prototype.unsubscribe;
    destination.onErrorCallback = Stream.prototype.onErrorCallback;
    destination.onMessageCallback = Stream.prototype.onMessageCallback;

    destination._update = Stream.prototype._update;
    destination._handleError = Stream.prototype._handleError;
    destination._register = Stream.prototype._register;
  }
}

module.exports = Stream;
