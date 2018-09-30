/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

const COOLING = 'cooling';
const HEATING = 'heating';

class ChartMode {
  VALID_MODES () { return [COOLING, HEATING]; }

  constructor (mode) {
    this.current = this.current.bind(this);
    this.isCooling = this.isCooling.bind(this);
    this.isHeating = this.isHeating.bind(this);
    this.set = this.set.bind(this);
    this.set((mode != null) ? mode : COOLING);
  }

  current () { return this._current; }
  isCooling () { return this._current === COOLING; }
  isHeating () { return this._current === HEATING; }

  set (mode) {
    if (!_.contains(this.VALID_MODES(), mode)) {
      throw new Error(`Unexpected mode value '${mode}'.`);
    }

    this._current = mode;
  }
};

module.exports = ChartMode;
