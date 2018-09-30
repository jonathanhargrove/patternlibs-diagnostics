/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const DateTimeFormatter = require('utils/date_time_formatter');
const Theme             = require('utils/theme');
const Handlebars        = require('handlebars');
const _                 = require('underscore');

let DEFAULT_DISPLAY_VALUE;
let ZONED_STAT_MODELS;
let FRIENDLY_NAMES;
let NDM_FRIENDLY_NAMES;
let SYSTEM_CONFIG_FRIENDLY_NAMES;
let LOCKOUT_STATES;
let NDM_DESCRIPTIONS;

class HandlebarsHelpers {
  constructor () {
    this.alarmIcon              = this.alarmIcon.bind(this);
    this.alarmLevelClass        = this.alarmLevelClass.bind(this);
    this.boolText               = this.boolText.bind(this);
    this.cityStateZip           = this.cityStateZip.bind(this);
    this.constToTitleCase       = this.constToTitleCase.bind(this);
    this.constructor            = this.constructor.bind(this);
    this.csvDownloadFileName    = this.csvDownloadFileName.bind(this);
    this.customerDeviceModel    = this.customerDeviceModel.bind(this);
    this.damperAngle            = this.damperAngle.bind(this);
    this.debug                  = this.debug.bind(this);
    this.defaultIfOutrageous    = this.defaultIfOutrageous.bind(this);
    this.degrees                = this.degrees.bind(this);
    this.degreesF               = this.degreesF.bind(this);
    this.displayComponentStatus = this.displayComponentStatus.bind(this);
    this.displayStage           = this.displayStage.bind(this);
    this.downcase               = this.downcase.bind(this);
    this.eq                     = this.eq.bind(this);
    this.fanStatusImg           = this.fanStatusImg.bind(this);
    this.formAction             = this.formAction.bind(this);
    this.friendlyDeviceType     = this.friendlyDeviceType.bind(this);
    this.friendlyNDM            = this.friendlyNDM.bind(this);
    this.friendlyName           = this.friendlyName.bind(this);
    this.friendlySystemConfig   = this.friendlySystemConfig.bind(this);
    this.fullName               = this.fullName.bind(this);
    this.ifEqual                = this.ifEqual.bind(this);
    this.inputOrValue           = this.inputOrValue.bind(this);
    this.lockoutValue           = this.lockoutValue.bind(this);
    this.momentToUriComponent   = this.momentToUriComponent.bind(this);
    this.ndmDescription         = this.ndmDescription.bind(this);
    this.nullText               = this.nullText.bind(this);
    this.onOff                  = this.onOff.bind(this);
    this.optedIn                = this.optedIn; // intentionally not bound to this
    this.outrageous             = this.outrageous.bind(this);
    this.percent                = this.percent.bind(this);
    this.percentRh              = this.percentRh.bind(this);
    this.phoneNumber            = this.phoneNumber.bind(this);
    this.pluralize              = this.pluralize.bind(this);
    this.posNegColor            = this.posNegColor.bind(this);
    this.precision              = this.precision.bind(this);
    this.productFullName        = this.productFullName.bind(this);
    this.productName            = this.productName.bind(this);
    this.productShortName       = this.productShortName.bind(this);
    this.ratioToPercent         = this.ratioToPercent.bind(this);
    this.replace                = this.replace.bind(this);
    this.selectedAlerts         = this.selectedAlerts.bind(this);
    this.stageStatusName        = this.stageStatusName.bind(this);
    this.streetAddress          = this.streetAddress.bind(this);
    this.tempColor              = this.tempColor.bind(this);
    this.titleCase              = this.titleCase.bind(this);
    this.upperCase              = this.upperCase.bind(this);
    this.yesNo                  = this.yesNo.bind(this);
  }

  static initClass () {
    DEFAULT_DISPLAY_VALUE = '--';
    ZONED_STAT_MODELS = ['950', '1050'];

    FRIENDLY_NAMES = {
      SINGLE_STAGE: '1',
      TWO_STAGE: '2',
      THREE_STAGE: '3',
      VARIABLE: 'VS',
      VARIABLE_SPEED: 'VS',
      NON_VARIABLE_SPEED: 'Non-VS',
      COOLING_ONLY: 'Clg Only',
      HEAT_PUMP: 'HP',
      SINGLE_COMPRESSOR_ONE_STAGE: '1 Stg',
      SINGLE_COMPRESSOR_TWO_STAGE: '1 Comp, 2 Stg',
      TWO_COMPRESSOR_TWO_STAGE: '2 Comp, 2 Stg',
      VARIABLE_SPEED_COMPRESSOR: 'VS',
      GAS_OIL: 'Fossil',
      ELECTRIC: 'Elect',
      HYDRONIC: 'Hydro',
      AUX_HEATING: 'Aux Heat',
      COMPRESSOR: 'Comp',
      COMPRESSOR_COOLING: 'Clg',
      COMPRESSOR_HEATING: 'Comp Htg',
      INDOOR_HEATING: 'ID Heat',
      ELECTRONIC_FILTER: 'EAC',
      COMM_AIR_CLEANER_DISCOVERED: 'COMM EAC',
      SYSTEM_HEATING: 'HTG',
      SYSTEM_COOLING: 'CLG',
      SYSTEM_IDLE: 'IDLE'
    };

    NDM_FRIENDLY_NAMES = {
      deviceId: 'Device ID',
      firmwareVersion: 'Firmware',

      indoorY1Signal: 'Y1 Signal',
      indoorY2Signal: 'Y2 Signal',
      indoorGSignal: 'G Signal',
      indoorW1Signal: 'W1 Signal',
      indoorW2Signal: 'W2 Signal',
      indoorW3Signal: 'W3 Signal',
      indoorOSignal: 'O Signal',
      indoorCondensateSwitch: 'Condensate Switch',
      indoorBKSignal: 'BK Signal',
      indoorCoilTemperature: 'Coil Temp',
      indoorCoilInletTemperature: 'Coil Inlet Temp',
      indoorGasLineTemperature: 'Gas Temp',
      indoorReturnAirTemperature: 'Return Air Temp',
      indoorSupplyAirTemperature: 'Supply Air Temp',
      indoorLiquidTemperature: 'Liquid Temp',
      indoorAirPressureRise: 'External Static Pressure',
      indoorBlowerCurrent: 'Blower Current',

      outdoorCoilTemperature: 'Coil Temp',
      outdoorCompressorSuctionTemperature: 'Suction Temp',
      outdoorY1Signal: 'Y1 Signal',
      outdoorY2Signal: 'Y2 Signal',
      outdoorSovSignal: 'O Signal',

      outdoorLiquidTemperature: 'Liquid Temperature',

      outdoorLiquidPressure: 'Liquid Pressure',
      outdoorGasPressure: 'Gas Pressure',

      outdoorCompressorCurrent: 'Comp Current',
      outdoorFanCurrent: 'Fan Current',

      rssi: 'RSSI',

      thermostatLoadValue: 'Load',
      thermostatAirflowPercentage: 'Airflow (BK)'
    };

    SYSTEM_CONFIG_FRIENDLY_NAMES = {
      ah_coil_condensate_switch: 'AH Coil Condensate Switch',
      breaks_r_to_stat: 'Breaks Y To Stat',
      breaks_y_to_odu: 'Breaks Y To ODU',
      filter_grill: 'Filter Grill',
      frost_stat_defrost_kit: 'Frost Stat Defrost Kit',
      furnace_condensate_switch: 'Furnace Condensate Switch',
      indoor_unit: 'Indoor Unit',
      load_shed_device: 'Load Shed Device',
      r22: 'R-22',
      r410a: 'R-410A',
      smoke_detector: 'Smoke Detector',
      system_transformer: 'System Transformer',
      to_ah_input: 'To AH Input',
      wall_transformer: 'Wall Transformer',

      other: 'Other'
    };

    NDM_DESCRIPTIONS = {
      outdoorCompressorCurrent: 'Compressor',
      outdoorCompressorSuctionTemperature: 'Condensor Supply'
    };

    LOCKOUT_STATES = [ 'UNKNOWN', 'ENABLED', 'DISABLED', 'N/A' ];

    this.prototype.POSITIVE_VALUES = ['enabled', 'installed', true];
    this.prototype.NEGATIVE_VALUES = ['disabled', 'not_installed', false];
  }

  customerDeviceModel (model, zoning) {
    if (!model) { return ''; }

    if (_.includes(ZONED_STAT_MODELS, model)) {
      const zoneInfo = zoning ? 'Zoned' : 'Non-zoned';
      return `${model} - ${zoneInfo}`;
    } else {
      return model;
    }
  }

  csvDownloadFileName (startMoment, endMoment, timeZone) {
    const start = startMoment.tz(timeZone).format('YYYY-MM-DD HH:mm:ss');
    const end = endMoment.tz(timeZone).format('YYYY-MM-DD HH:mm:ss');
    return `${start} - ${end}.csv`;
  }

  momentToUriComponent (moment, timeZone) {
    const timeString = moment.tz(timeZone).format('YYYY-MM-DD HH:mm:ss');
    return encodeURIComponent(timeString);
  }

  alarmLevelClass (alarmLevel) {
    switch (alarmLevel) {
      case 'critical':
        return 'error';
      case 'major':
        return 'warning';
      case 'normal':
        return 'success';
    }
  }

  debug (optionalValue) {
    console.log('Current Context');
    console.log('====================');
    console.log(this);
    if (optionalValue) {
      console.log('Value');
      console.log('====================');
      return console.log(optionalValue);
    }
  }

  ratioToPercent (n, precision) {
    if (precision == null) { precision = 0; }
    return this.outrageous(n, () => {
      const num = Number(n);
      return this.percent(num * 100, precision);
    });
  }

  phoneNumber (number) {
    if (!number) { return ''; }
    return number.replace(/(\d\d\d)(\d\d\d)(\d\d\d\d)/, '($1) $2-$3');
  }

  streetAddress (model) {
    return _.compact([
      model.address1,
      model.address2
    ]).join(', ');
  }

  cityStateZip (model) {
    return _.compact([
      model.city,
      _.compact([model.state, model.zip]).join(' ')
    ]).join(', ');
  }

  nullText (value, nullText) {
    if (nullText == null) { nullText = '--'; }
    if (value) {
      return value;
    } else if (typeof (nullText) !== 'object') { // HACK: 'object' is the side-effect of the
      return nullText;                           // calling function from handlebars
    } else {                                 // having the nullText argument omitted.
      return '--';
    }
  }

  boolText (value, positiveText, negativeText, nullText) {
    if (value === true) {
      return positiveText;
    } else if (value === false) {
      return negativeText;
    } else if ((value === null) || (value === undefined)) {
      return nullText;
    } else {
      throw new Error(`The value passed to "value" must be true, false, or null, but '${value}' was passed in.`);
    }
  }

  fullName (model) {
    const fullName = _.compact([model.firstName, model.lastName]).join(' ');
    if (fullName.length > 0) { return fullName; }
    return '[No name given]';
  }

  formAction (model) {
    if (model.id) { return 'Edit'; } else { return 'Add'; }
  }

  damperAngle (number, precision) {
    if (precision == null) { precision = 0; }
    return `${((100 - this.precision(number, precision)) / 100) * 90}deg`;
  }

  percent (n, precision) {
    if (precision == null) { precision = 0; }
    return this.outrageous(n, () => {
      const num = this.precision(n, precision);
      return `${num}%`;
    });
  }

  precision (n, precision) {
    return this.outrageous(n, function () {
      const num = Number(n);
      return (Number(num).toFixed(precision));
    });
  }

  percentRh (n, precision) {
    return this.outrageous(n, () => Number(n).toFixed(precision) + '%rh');
  }

  degreesF (n, precision) {
    return this.outrageous(n, () => Number(n).toFixed(precision) + '°F');
  }

  degrees (n, precision) {
    return this.outrageous(n, () => Number(n).toFixed(precision) + '°');
  }

  defaultIfOutrageous (value) {
    return this.outrageous(value, () => value);
  }

  outrageous (value, ifNotOutrageous) {
    if ((value === null) || (value === '') || (value === '--') || isNaN(value) || (Number(value) === 32768)) {
      return DEFAULT_DISPLAY_VALUE;
    } else {
      return ifNotOutrageous();
    }
  }

  onOff (value) {
    if ((value === undefined) || (value === null) || (value === '')) { return 'N/A'; }
    if (value === true) { return 'on'; } else { return 'off'; }
  }

  yesNo (value) {
    if ((value === undefined) || (value === null)) { return null; }
    if (value === true) { return 'Yes'; } else { return 'No'; }
  }

  ifEqual (valueA, valueB, trueValue, falseValue = null) {
    if (valueA === valueB) {
      return trueValue;
    } else {
      return falseValue;
    }
  }

  downcase (value) {
    if (value) { return value.toLowerCase(); }
  }

  lockoutValue (lockout) {
    if (!lockout) { return 'N/A'; }
    let value = `${LOCKOUT_STATES[lockout.state]}`;
    if (LOCKOUT_STATES[lockout.state] === 'ENABLED') { value += ` (${this.degrees(lockout.temperature, 0)})`; }
    return value;
  }

  tempColor (temperature) {
    if (!isNaN(temperature)) {
      const temp = parseInt(temperature);
      if (temp <= 65) { return 'cool'; }
      if (temp > 65) { return 'hot'; }
    }
  }

  upperCase (str) {
    if (str == null) { str = ''; }
    return str.toUpperCase();
  }

  titleCase (str) {
    return str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  }

  constToTitleCase (str) {
    if (str) {
      const words = str.split('_');
      return _.map(words, word => this.titleCase(word)).join(' ');
    }
  }

  friendlyName (name, ifMissing) {
    if (ifMissing == null) { ifMissing = '--'; }
    name = this.nullText(name, ifMissing);
    if (FRIENDLY_NAMES[name]) {
      return FRIENDLY_NAMES[name];
    } else {
      return this.replace(name);
    }
  }

  replace (str, find, replace) {
    if (find == null) { find = '_'; }
    if (replace == null) { replace = ' '; }
    if ((str === undefined) || (str === null) || (str === '')) { return null; }
    return str.replace(new RegExp(find, 'g'), replace);
  }
  posNegColor (value) {
    if (typeof value === 'string') { value = value.toLowerCase(); }
    if (_.contains(HandlebarsHelpers.prototype.POSITIVE_VALUES, value)) { return 'positive'; }
    if (_.contains(HandlebarsHelpers.prototype.NEGATIVE_VALUES, value)) { return 'negative'; }
  }

  alarmIcon (alarmLevel) {
    if (alarmLevel === 'critical') {
      return 'icon-warning-sign';
    } else if (alarmLevel === 'major') {
      return 'icon-notification';
    } else if (alarmLevel === 'normal') {
      return 'icon-warning2';
    } else {
      throw new Error(`Unexpected alarmLevel '${alarmLevel}'`);
    }
  }

  pluralize (count, noun) {
    if (count === 1) {
      return noun;
    } else {
      return noun + 's';
    }
  }

  optedIn (status, options) {
    if (status === 'OPTED IN') {
      return options.fn(this);
    } else {
      return options.inverse(this);
    }
  }

  selectedAlerts (notificationRecipient) {
    const alerts = [];
    if (notificationRecipient.majorAlerts) { alerts.push('Major'); }
    if (notificationRecipient.criticalAlerts) { alerts.push('Critical'); }
    if (notificationRecipient.betaAlerts) { alerts.push('Beta'); }

    if (alerts.length) {
      return alerts.join(', ');
    } else {
      return 'None';
    }
  }

  stageStatusName (stageKey, operatingStages) {
    if (_(operatingStages).keys().length === 1) { return 'Sys'; }
    return stageKey.replace(/^(.*)OperatingStage/, (_, kind) => kind);
  }

  displayStage (operatingStatus, operatingStage) {
    if (operatingStage === 0) { return 'idle'; }
    return `${this.friendlyName(operatingStatus)} STG ${operatingStage}`;
  }

  fanStatusImg (fanStatusOn) {
    if (fanStatusOn) { return '/img/devices/fan-blades-anima.gif'; }
    return '/img/devices/fan-blades-static.png';
  }

  displayComponentStatus (isConnected) {
    if (isConnected) { return 'Online'; } else { return 'Offline'; }
  }

  inputOrValue (model, field, options) {
    if (model.isEditing) {
      return `<input type='text' name='${field}' />`;
    } else {
      return Handlebars.Utils.escapeExpression(model[field]);
    }
  }

  friendlyNDM (attr, ifMissing) {
    if (ifMissing == null) { ifMissing = '--'; }
    const name = this.nullText(attr, ifMissing);
    return NDM_FRIENDLY_NAMES[name] || this.replace(name);
  }

  friendlySystemConfig (attr, ifMissing) {
    if (ifMissing == null) { ifMissing = '--'; }
    const name = this.nullText(attr, ifMissing);
    return SYSTEM_CONFIG_FRIENDLY_NAMES[name] || this.constToTitleCase(name);
  }

  ndmDescription (attr, ifMissing) {
    if (ifMissing == null) { ifMissing = ''; }
    return NDM_DESCRIPTIONS[attr] || ifMissing;
  }

  friendlyDeviceType (deviceType) {
    switch (deviceType) {
      case 'ndm':
        if (Theme.isNexia()) {
          return 'Nexia Data Module';
        } else if (Theme.isTrane()) {
          return 'Trane Data Module';
        }
        break;
      default:
        return _.capitalize(deviceType);
    }
  }

  productName () {
    return Theme.productName();
  }

  productFullName () {
    if (Theme.isNexia()) {
      return 'Nexia Home Intelligence';
    } else if (Theme.isTrane()) {
      return 'Trane Commercial Services';
    }
  }

  productShortName () {
    if (Theme.isNexia()) {
      return 'Nexia';
    } else if (Theme.isTrane()) {
      return 'Trane';
    }
  }

  eq (a, b) {
    return _.isEqual(a, b);
  }

  static registerHelpers () {
    const helpers = new HandlebarsHelpers();

    for (let helperName in helpers) {
      const helperFunction = helpers[helperName];
      Handlebars.registerHelper(helperName, helperFunction);
    }
  }
};

HandlebarsHelpers.initClass();

HandlebarsHelpers.prototype.longDateTime         = DateTimeFormatter.longDateTime;
HandlebarsHelpers.prototype.shortDateTime        = DateTimeFormatter.shortDateTime;
HandlebarsHelpers.prototype.longDate             = DateTimeFormatter.longDate;
HandlebarsHelpers.prototype.shortTime            = DateTimeFormatter.shortTime;
HandlebarsHelpers.prototype.alarmHistoryDate     = DateTimeFormatter.alarmHistoryDate;
HandlebarsHelpers.prototype.alarmHistoryDateTime = DateTimeFormatter.alarmHistoryDateTime;

HandlebarsHelpers.registerHelpers();

module.exports = HandlebarsHelpers;
