/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS104: Avoid inline assignments
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Reflection = require('./reflection');
const _ = require('underscore');

class Validatable {
  _validateAttributes (attributes, options) {
    let shouldValidate;
    const errors = [];
    const flattenedAttributes = {};
    Reflection.flatten(attributes, flattenedAttributes);

    if (options != null ? options.match : undefined) {
      if (options.match instanceof RegExp) {
        shouldValidate = attr => options.match.test(attr);
      } else if (_.isFunction(options.match)) {
        shouldValidate = options.match;
      }
    } else {
      shouldValidate = () => true;
    }

    const object = Reflection.getInheritedPrototypeOption(this, 'validations');
    for (let attr in object) {
      var message;
      let validation = object[attr];
      if (!shouldValidate.call(this, attr)) { continue; }

      const value = flattenedAttributes[attr];
      let required = false;
      if (validation.required != null) {
        required = Reflection.evaluate(validation.required, this);
      }

      let runCustom = required || (value != null);
      if (typeof validation === 'function') {
        validation = {
          fn: validation
        };
        runCustom = true;
      }

      if (typeof validation.fn === 'string') {
        validation.fn = this[validation.fn];
      }

      if (runCustom && (typeof validation.fn === 'function')) {
        message = validation.fn.call(this, value, attr);
        if (_.isString(message)) {
          this._addValidationError(errors, attr, validation, message);
        }
      }

      if (value == null) {
        if (required) {
          message = _.isString(required) ? required : `${attr} is required`;
          this._addValidationError(errors, attr, validation, message);
        }

        continue;
      }

      if (validation.pattern != null) {
        let { pattern } = validation;
        if (_.isString(pattern)) {
          if (pattern === 'email') {
            pattern = /^(['+\-.\w]+)@((\w[+\-.\w]*)\.[\w]{2,})$/;
          }

          if (pattern === 'number') {
            pattern = /\d+/;
          }
        }

        if (pattern instanceof RegExp) {
          if (!(value != null ? value : '').toString().match(pattern)) {
            this._addValidationError(errors, attr, validation, `${attr} is invalid`);
          }
        }
      }
    }

    if (!_.isEmpty(errors)) {
      return errors;
    }
  }

  _addValidationError (errors, attr, validation, defaultMessage) {
    let left;
    return errors.push({
      attribute: attr,
      message: (left = Reflection.evaluate(validation.message)) != null ? left : defaultMessage
    });
  }
}

module.exports = Validatable;
