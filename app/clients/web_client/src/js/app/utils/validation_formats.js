const VALID_PHONE = /^\d{10}$/;
const VALID_POSTAL = /(^\d{5}$)|(^\d{5}-\d{4}$)|(^[ABCEGHJKLMNPRSTVXY][0-9][ABCEGHJKLMNPRSTVWXYZ] ?[0-9][ABCEGHJKLMNPRSTVWXYZ][0-9])$/;
const VALID_EMAIL = /^(['+\-.\w]+)@((\w[+\-.\w]*)\.[\w]{2,})$/;

class ValidationFormats {
  static phoneMatcher (phone) {
    if (phone && !phone.match(VALID_PHONE)) {
      return 'Please enter a valid phone number';
    }
  }
  static postalCodeMatcher (zip) {
    if (zip && !zip.match(VALID_POSTAL)) {
      return 'Please enter a valid zip code';
    }
  }
  static emailMatcher (email) {
    if (email && !email.match(VALID_EMAIL)) {
      return 'Please enter a valid email';
    }
  }

  static lengthMatcher (string, length, attrName) {
    if (string == null) { string = ''; }
    if (length == null) { length = 1; }
    if (attrName == null) { attrName = 'Attribute'; }
    if (!(string.length <= length)) {
      return `${attrName} must contain fewer than ${length + 1} characters.`;
    }
  }
};

module.exports = ValidationFormats;
