class InputFormatter {
  scrubBlankAndTrim (val) {
    if (_.isEmpty(val && val.trim())) {
      return null;
    }

    return val.trim();
  }

  cleanPhone (number) {
    return number.replace(/[^0-9]+/g, '');
  }

  cleanPostalCode (val) {
    const value = this.scrubBlankAndTrim(val);
    return value && value.toUpperCase();
  }
};

module.exports = InputFormatter;
