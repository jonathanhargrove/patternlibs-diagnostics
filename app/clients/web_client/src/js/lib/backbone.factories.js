/*
 *  Usage:
 *
 *    const Factories = new BackboneFactories()
 *    Factories.define((factory) => {
 *      factory('user', {class: User}, ({attribute, option}) => {
 *        attribute('firstName', 'Jane')
 *        attribute('lastName', 'Doe')
 *        option('parse', true)
 *      })
 *    })
 *
 *    let joe = Factories.build('user', {firstName: 'Joe'})
 *
 */
const _ = require('underscore');

const result = (value, ...args) => {
  return _.isFunction(value) ? value.apply(null, args) : value;
};

// TODO: DRY up this class
class Factory {
  constructor (options, factory) {
    this.class = options.class;
    this.factory = factory;
    this.hooks = {
      beforeBuild: () => {},
      afterBuild: () => {},
      afterCreate: () => {}
    };
    this._registerHooks();
  }

  attributesFor (overrides = {}) {
    let attributes = {};
    this.factory.call(null, {
      attribute: (key, value) => {
        attributes[key] = overrides[key] || result(value);
      },
      option: _.noop,
      beforeBuild: _.noop,
      afterBuild: _.noop,
      afterCreate: _.noop
    });
    return _.extend(attributes, overrides);
  }

  optionsFor (overrides = {}) {
    let options = {};
    this.factory.call(null, {
      attribute: _.noop,
      option: (key, value) => {
        options[key] = overrides[key] || result(value);
      },
      beforeBuild: _.noop,
      afterBuild: _.noop,
      afterCreate: _.noop
    });
    return _.extend(options, overrides);
  }

  _registerHooks () {
    this.factory.call(null, {
      attribute: _.noop,
      option: _.noop,
      beforeBuild: (hook) => {
        this.hooks['beforeBuild'] = hook;
      },
      afterBuild: (hook) => {
        this.hooks['afterBuild'] = hook;
      },
      afterCreate: (hook) => {
        this.hooks['afterCreate'] = hook;
      }
    });
  }

  build (attributeOverrides, optionOverrides) {
    let attributes = this.attributesFor(attributeOverrides);
    let options = this.optionsFor(optionOverrides);

    this.hooks.beforeBuild.call(null, attributes, options);

    let Klass = this.class;
    let model = new Klass(attributes, options);

    this.hooks.afterBuild.call(null, model);
    return model;
  }

  create (attributeOverrides, optionOverrides) {
    let model = this.build(attributeOverrides, optionOverrides);
    if (!model.id) {
      model.id = _.uniqueId('factory-');
      model.set(model.idAttribute, model.id);
    }
    this.hooks.afterCreate.call(null, model);
    return model;
  }
}

module.exports = class Factories {
  constructor () {
    this.registry = {};
  }

  define (definer) {
    definer(this.factory.bind(this));
    return this;
  }

  factory (name, options, factory) {
    this.registry[name] = new Factory(options, factory);
  }

  build (name, attributes, options) {
    return this.registry[name].build(attributes, options);
  }

  create (name, attributes, options) {
    return this.registry[name].create(attributes, options);
  }

  attributesFor (name, attributes) {
    return this.registry[name].attributesFor(attributes);
  }
};
