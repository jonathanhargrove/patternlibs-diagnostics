/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
define(function (require) {
  require('nexia_framework'); // to get underscore

  const ATTRIBUTES = [
    'rssi',

    'outdoorCoilTemperature',
    'outdoorLiquidTemperature',
    'outdoorCompressorSuctionTemperature',
    'outdoorY1Signal',
    'outdoorY2Signal',
    'outdoorSovSignal',

    'outdoorLiquidPressure',
    'outdoorGasPressure',

    'outdoorCompressorCurrent',
    'outdoorFanCurrent',

    'indoorY1Signal',
    'indoorY2Signal',
    'indoorGSignal',
    'indoorW1Signal',
    'indoorW2Signal',
    'indoorW3Signal',
    'indoorOSignal',

    'indoorCondensateSwitch',
    'indoorBKSignal',

    'indoorCoilTemperature',
    'indoorGasLineTemperature',
    'indoorReturnAirTemperature',
    'indoorSupplyAirTemperature',
    'indoorLiquidTemperature',
    'indoorAirPressureRise',
    'indoorBlowerCurrent',

    'thermostatLoadValue',
    'thermostatAirflowPercentage'
  ];

  const STATUS_ATTRIBUTES = ['rssi'];
  const OUTDOOR_ATTRIBUTES = _.filter(ATTRIBUTES, attr => attr.match(/^outdoor/));
  const INDOOR_ATTRIBUTES = _.filter(ATTRIBUTES, attr => attr.match(/^indoor/));
  const TEMP_ATTRIBUTES = _.filter(ATTRIBUTES, attr => attr.match(/Temperature$/));
  const THERMOSTAT_ATTRIBUTES = _.filter(ATTRIBUTES, attr => attr.match(/^thermostat/));

  return {
    STATUS_ATTRIBUTES,
    INDOOR_ATTRIBUTES,
    OUTDOOR_ATTRIBUTES,
    TEMP_ATTRIBUTES,
    THERMOSTAT_ATTRIBUTES,
    ATTRIBUTES
  };
});
