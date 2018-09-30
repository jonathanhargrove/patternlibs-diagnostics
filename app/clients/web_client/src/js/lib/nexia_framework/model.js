const Backbone    = require('backbone');
const Reflection  = require('./reflection');
const Translator  = require('./translator');
const Validatable = require('./validatable');
const _           = require('underscore');

const Model = Backbone.Model.extend({
  constructor (attrs, options) {
    this._initNestedObjects();
    Backbone.Model.prototype.constructor.apply(this, arguments);
    if (options && _.isString(options.url)) {
      this.url = () => options.url;
    }
    this.listenTo(this, 'error', this._handleServerError);
  },

  parse (attrs) {
    if (Reflection.getPrototypeOption(this, 'nestedAutoParse') !== false) {
      return this.parseNestedObjects(attrs);
    }
    return attrs;
  },

  parseNestedObjects (attrs) {
    attrs = _.clone(attrs);

    for (var key in this._nestedCollections) {
      const collection = this._nestedCollections[key];
      if (attrs[key]) {
        collection.set(attrs[key], {
          parse: true
        });
      }
      delete attrs[key];
    }

    for (key in this._nestedModels) {
      const model = this._nestedModels[key];
      if (attrs[key]) {
        model.set(model.parse(attrs[key]));
      }
      delete attrs[key];
    }
    return attrs;
  },

  toJSON () {
    const attrs = Backbone.Model.prototype.toJSON.apply(this, arguments);
    if (Reflection.getPrototypeOption(this, 'nestedAutoSerialize') !== false) {
      for (var key in this._nestedCollections) {
        const collection = this._nestedCollections[key];
        attrs[key] = collection.toJSON();
      }
      for (key in this._nestedModels) {
        const model = this._nestedModels[key];
        attrs[key] = model.toJSON();
      }
    }
    return attrs;
  },

  sync (method, model, options) {
    return Backbone.Model.prototype.sync.apply(this, [method, model, this._defaultAjaxOptions(options)]);
  },

  clone () {
    const result = Backbone.Model.prototype.clone.apply(this, arguments);

    for (var key in this._nestedModels) {
      const model = this._nestedModels[key];
      result._nestedModels[key] = model.clone();
    }
    for (key in this._nestedCollections) {
      const collection = this._nestedCollections[key];
      result._nestedCollections[key] = collection.clone();
    }

    return result;
  },

  validate (attributes, options) {
    let modelResult;
    let result = this._validateAttributes(attributes, options);
    for (var key in this._nestedModels) {
      const model = this._nestedModels[key];
      if (_.isFunction(model.validate)) {
        modelResult = model.validate(model.attributes, options);
      }
      if (modelResult) {
        if (!result) { result = {}; }
        result[key] = modelResult;
      }
    }
    for (key in this._nestedCollections) {
      const collection = this._nestedCollections[key];
      collection.models.forEach(function (model, i) {
        if (_.isFunction(model.validate)) {
          modelResult = model.validate(model.attributes, options);
        }
        if (modelResult) {
          if (!result) { result = {}; }
          result[`${key}[${i}]`] = modelResult;
        }
      });
    }

    this._triggerValidationEvents(result);
    return result;
  },

  _initNestedObjects () {
    let properties;
    const collectionDefs = Reflection.getPrototypeOption(this, 'nestedCollections');
    this._nestedCollections = {};
    for (var defaultAttribute in collectionDefs) {
      properties = collectionDefs[defaultAttribute];
      this._createNestedCollection(defaultAttribute, properties);
    }

    const modelDefs = Reflection.getPrototypeOption(this, 'nestedModels');
    this._nestedModels = {};
    for (defaultAttribute in modelDefs) {
      properties = modelDefs[defaultAttribute];
      this._createNestedModel(defaultAttribute, properties);
    }
  },

  _createNestedCollection (defaultAttribute, properties) {
    let nestedCollection;
    const attribute = properties.attribute || defaultAttribute;
    if (properties.model) {
      nestedCollection = new Backbone.Collection([], {
        model: properties.model
      });
    } else if (properties.collection) {
      nestedCollection = new properties.collection(); // eslint-disable-line new-cap
    } else {
      throw new Error(`Nested collection '${defaultAttribute}' needs either a model class or collection class`);
    }

    this._nestedCollections[attribute] = nestedCollection;
    this[this._getMethodNameForAccessor(defaultAttribute)] = () => {
      return this._nestedCollections[attribute];
    };
    this._listenToNestedEvents(nestedCollection);
  },

  _createNestedModel (defaultAttribute, properties) {
    const modelClass = properties.model;
    const attribute = properties.attribute || defaultAttribute;
    if (!modelClass) { throw new Error(`Nested model '${defaultAttribute}' needs a model class`); }

    this._nestedModels[attribute] = new modelClass(); // eslint-disable-line new-cap
    this[this._getMethodNameForAccessor(defaultAttribute)] = () => {
      return this._nestedModels[attribute];
    };
    this._listenToNestedEvents(this._nestedModels[attribute]);
  },

  _listenToNestedEvents (object) {
    if (Reflection.getPrototypeOption(this, 'nestedEventsPropagate') === true) {
      this.listenTo(object, 'all', function () {
        this.trigger.apply(this, arguments);
      }.bind(this));
    }
  },

  _getMethodNameForAccessor (attribute) {
    return `get${_.titleize(_.camelize(attribute))}`;
  },

  _defaultAjaxOptions (options) {
    const defaults = {
      wait: true,
      accepts: 'application/json',
      dataType: 'json'
    };
    return _.extend(defaults, options);
  },

  _translateErrorObject (response) {
    return [
      {
        message: response.error.message
      }
    ];
  },

  _translateArrayOfErrors (response) {
    const errors = [];
    for (let responseError of response) {
      const error = {
        message: responseError.message
      };
      if (responseError.attribute) {
        error.attribute = responseError.attribute;
      }
      errors.push(error);
    }
    return errors;
  },

  _translateHashOfErrors (response) {
    const errors = [];
    for (let key in response) {
      const value = response[key];
      for (let responseError of value) {
        const error = {
          message: responseError.name
        };
        if (key !== 'base') {
          error.attribute = key;
        }
        errors.push(error);
      }
    }
    return errors;
  },

  _handleServerError (model, xhr, options) {
    let header;
    const defaultOptions = {
      translate: true
    };
    options = _.extend(defaultOptions, options);
    if (options.validate === false) { return; }

    if ((xhr.status >= 400 && xhr.status <= 499) && (header = xhr.getResponseHeader('Content-Type')) && header.match(/application\/json/)) {
      const response = JSON.parse(xhr.responseText);
      let errors = [];
      if (options.translate) {
        if (_.isArray(response)) {
          errors = this._translateArrayOfErrors(response);
        } else if (response.error) {
          errors = this._translateErrorObject(response);
        } else {
          errors = this._translateHashOfErrors(response);
        }
      } else {
        errors = response;
      }
      this.validationError = errors;
      return this._triggerValidationEvents(errors, true);
    }
  },

  _triggerValidationEvents (errors, includeBackboneEvent) {
    if (!includeBackboneEvent) {
      includeBackboneEvent = false;
    }
    if (_.isEmpty(errors)) {
      this.trigger('validated', true, this, {});
      return this.trigger('valid', this);
    } else {
      if (includeBackboneEvent) {
        this.trigger('invalid', this, errors, {});
      }
      return this.trigger('validated', false, this, errors);
    }
  }
});

Model.prototype._validateAttributes = Validatable.prototype._validateAttributes;
Model.prototype._addValidationError = Validatable.prototype._addValidationError;

Model.prototype.t = Translator.prototype.t;

module.exports = Model;
