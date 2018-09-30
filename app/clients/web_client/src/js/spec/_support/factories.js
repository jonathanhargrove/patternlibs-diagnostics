const BackboneFactories = require('lib/backbone.factories');
const Customer = require('customers/models/customer');
const Dealer = require('dealers/models/dealer');
const NotificationRecipient = require('notification_recipients/models/notification_recipient');
const Device = require('devices/models/device');
const DevicesCollection = require('devices/models/devices_collection');
const Spider = require('devices/models/spider');
const System = require('systems/models/system');
const Thermostat = require('devices/models/thermostat');
const _ = require('underscore');
const repeat = require('underscore.string').repeat;
const Session = require('root/models/session');

const generateDeviceId = (length = 8) => {
  let randomHex;
  while (true) {
    randomHex = Math.floor(Math.random() * parseInt(repeat('F', length), 16)).toString(16).toUpperCase();
    if (Device.isValidDeviceId(randomHex)) {
      return randomHex;
    }
  }
};

const Factories = new BackboneFactories();
module.exports = Factories.define((factory) => {
  factory('customer', {class: Customer}, ({attribute, option}) => {
    attribute('firstName', 'Jane');
    attribute('lastName', 'Customer');
  });

  factory('dealer', {class: Dealer}, ({attribute, option}) => {
    attribute('dealerName', 'Alpha');
    attribute('address', '123 Main');
    attribute('city', 'Boulder');
    attribute('state', 'CO');
    attribute('zip', '12345');
  });

  factory('notification_recipient', {class: NotificationRecipient}, ({attribute, option}) => {
    attribute('name', 'Dale');
    attribute('email', 'dale@employee.com');
  });

  factory('spider', {class: Spider}, ({attribute, option, afterCreate}) => {
    attribute('configuration', () => ({}));
    attribute('deviceId', generateDeviceId);
    attribute('capabilities', () => ['current_status', 'runtime_history']);
    attribute('timeZone', 'America/Chicago');

    afterCreate((model) => {
      model.set('isNew', false);
    });
  });

  factory('thermostat', {class: Thermostat}, ({attribute, option, afterCreate}) => {
    attribute('deviceId', generateDeviceId);
    attribute('name', () => _.uniqueId('Thermostat '));
    attribute('capabilities', () => []);
    attribute('timeZone', 'America/Chicago');

    afterCreate((model) => {
      model.set('isNew', false);
    });
  });

  factory('system', {class: System}, ({attribute, option, beforeBuild, afterCreate}) => {
    attribute('group', null);

    option('primaryDevice', () => Factories.build('thermostat'));

    beforeBuild((attributes, options) => {
      options.devices = options.devices || new DevicesCollection([options.primaryDevice]);
      if (!options.devices.get(options.primaryDevice.id)) {
        options.devices.add(options.primaryDevice);
      }

      attributes.id = attributes.id || options.primaryDevice.id;
      options.session = options.session || new Session();
    });

    afterCreate((model) => {
      model.set('isNew', false);
    });
  });
});
