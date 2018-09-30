/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS201: Simplify complex destructure assignments
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const SpiderReportUtils = require('devices/utils/spider_report_utils');
const HandlebarsHelpers = require('template_helpers');
const SpiderConfig = require('devices/models/spider_config');

const helpers = new HandlebarsHelpers();

class SpiderCurrentStatusPresenter {
  constructor (options) {
    this._presentSensor = this._presentSensor.bind(this);
    ({model: this.model, configModel: this.configModel, configEnabled: this.configEnabled} = options);
  }

  templateContext () {
    return {
      status: this._deviceAttributes().concat(this._statusAttributes()),
      indoor: this._indoorAttributes(),
      outdoor: this._outdoorAttributes(),
      thermostat: this._thermostatAttributes(),
      configEnabled: this.configEnabled,
      allThermostatEnabled: this._allThermostatEnabled(),
      allOutdoorEnabled: this._allOutdoorEnabled(),
      allIndoorEnabled: this._allIndoorEnabled(),
      allStatusEnabled: this._allStatusEnabled()
    };
  }

  _enabledAttributes () {
    const pairs = (this.configModel != null ? this.configModel.pairs() : undefined) || [];
    return _.chain(pairs)
      .inject(function (memo, ...rest) {
        const [attr, enabled] = Array.from(rest[0]);
        if (enabled) { memo.push(attr); }
        return memo;
      }
        , [])
      .union(SpiderConfig.UNCONFIGURABLE_ATTRIBUTES)
      .uniq()
      .value();
  }

  _deviceAttributes () {
    return _.map(['deviceId', 'firmwareVersion'], k => {
      return {
        label: helpers.friendlyNDM(k),
        value: this.model.get(k),
        className: _.dasherize(k),
        attr: k,
        configurable: false
      };
    });
  }

  _thermostatAttributes () {
    return _.chain(this.model.attributes)
      .pick(SpiderReportUtils.THERMOSTAT_ATTRIBUTES)
      .map(this._presentSensor)
      .value();
  }

  _statusAttributes () {
    return _.chain(this.model.attributes)
      .pick(SpiderReportUtils.STATUS_ATTRIBUTES)
      .map(this._presentSensor)
      .value();
  }

  _indoorAttributes () {
    return _.chain(this.model.attributes)
      .pick(SpiderReportUtils.INDOOR_ATTRIBUTES)
      .map(this._presentSensor)
      .value();
  }

  _outdoorAttributes () {
    return _.chain(this.model.attributes)
      .pick(SpiderReportUtils.OUTDOOR_ATTRIBUTES)
      .map(this._presentSensor)
      .value();
  }

  _presentSensor (value, key) {
    return {
      className: this._classesForSensor(value, key).join(' '),
      value: this._sensorValueWithUnits(value, key),
      label: helpers.friendlyNDM(key),
      attr: key,
      configurable: SpiderConfig.isConfigurable(key),
      enabled: this.configModel.get(key),
      description: helpers.ndmDescription(key)
    };
  }

  _classesForSensor (value, key) {
    if (this._isDisabled(key)) {
      return ['disabled'];
    } else {
      return [];
    }
  }

  _sensorValueWithUnits (value, key) {
    switch (false) {
      case !this._isDisabled(key): return this._disabledText(value, key);
      case !this._isTemperature(key): return helpers.degrees(value, 1);
      // IndoorAirPressureRise is recorded as a float but transmitted as an
      // int32 by multiplying it by 100, so we need to display it properly by
      // undoing the multiplication
      case !this._isIndoorAirPresureRise(key): return `${(value / 100).toFixed(2)} "H<sub>2</sub>O`;
      case !this._isAmps(key): return `${value} A`;
      case !this._isPsig(key): return `${value} psig`;
      case !this._isRssi(key): return `${value}`;
      default: return String(value);
    }
  }

  _disabledText (value, key) {
    if (this.configEnabled) {
      return '—';
    } else {
      return 'Not Tracked';
    }
  }

  _isDisabled (key) {
    return !_.include(this._enabledAttributes(), key);
  }

  _isTemperature (key) {
    return _.contains(SpiderReportUtils.TEMP_ATTRIBUTES, key);
  }

  _isIndoorAirPresureRise (key) {
    return key === 'indoorAirPressureRise';
  }

  _isAmps (key) {
    return key.match(/Current$/);
  }

  _isPsig (key) {
    return key.match(/^outdoor.+Pressure$/);
  }

  _isRssi (key) {
    return key.match(/^rssi$/);
  }

  _allThermostatEnabled () {
    return this.configModel.allSelected('thermostat');
  }

  _allOutdoorEnabled () {
    return this.configModel.allSelected('outdoor');
  }

  _allIndoorEnabled () {
    return this.configModel.allSelected('indoor');
  }

  _allStatusEnabled () {
    return this.configModel.allSelected('status');
  }
}

module.exports = SpiderCurrentStatusPresenter;
