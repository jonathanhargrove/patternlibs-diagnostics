/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Backbone = require('backbone');

class StatusStateMachine {
  static initClass () {
    this.states = ['saving', 'saved', 'lastUpdatedAt'];
  }

  constructor (state, timeout) {
    if (state == null) { state = 'lastUpdatedAt'; }
    if (timeout == null) { timeout = 2000; }
    _.extend(this, Backbone.Events);
    this.state = state;
    this.timeout = timeout;
  }

  saving () {
    this.state = 'saving';
    return this.trigger('stateChange', this.state);
  }

  saved () {
    this.state = 'saved';
    this.trigger('stateChange', this.state);
    return setTimeout(() => this.lastUpdatedAt(), this.timeout);
  }

  lastUpdatedAt () {
    this.state = 'lastUpdatedAt';
    return this.trigger('stateChange', this.state);
  }

  error () {
    this.state = 'error';
    this.trigger('stateChange', this.state);
    return setTimeout(() => this.lastUpdatedAt(), this.timeout);
  }
}
StatusStateMachine.initClass();

module.exports = StatusStateMachine;
