define(function (require) {
  require('spec/spec_helper');
  const ValidationFormats = require('utils/validation_formats');
  require('sinon');

  describe('ValidationFormats', function () {
    describe('phoneMatcher', function () {
      describe('when the phone is undefined', () =>
        it('returns null', () => expect(ValidationFormats.phoneMatcher()).toBe(undefined))
      );

      describe('when the phone is valid', () =>
        it('returns null', () => expect(ValidationFormats.phoneMatcher('1234567890')).toBe(undefined))
      );

      describe('when the phone is invalid', () =>
        it('returns an error message', function () {
          const invalidPhones = ['123', 'abc', '123-456-7890'];
          for (let i in invalidPhones) {
            const phone = invalidPhones[i];
            expect(ValidationFormats.phoneMatcher(phone)).toBe('Please enter a valid phone number');
          }
        })
      );
    });

    describe('postalCodeMatcher', function () {
      describe('when the zip code is undefined', () =>
        it('returns null', () => expect(ValidationFormats.postalCodeMatcher()).toBe(undefined))
      );

      describe('when the zip code is valid', () =>
        it('returns null', function () {
          const validZipCodes = ['80302', '80302-1234', 'T2X 1V3', 'T2X1V3'];
          for (let i in validZipCodes) {
            const zipCode = validZipCodes[i];
            expect(ValidationFormats.postalCodeMatcher(zipCode)).toBe(undefined);
          }
        })
      );

      describe('when the zip code is invalid', () =>
        it('returns an error message', function () {
          const invalidZipCodes = ['123', '80302-142', 'A1D2I3', 'Z1B2C3', 'T3K 8K1 foo', 'CAT T2X 1V3'];
          for (let i in invalidZipCodes) {
            const zipCode = invalidZipCodes[i];
            expect(ValidationFormats.postalCodeMatcher(zipCode)).toBe('Please enter a valid zip code');
          }
        })
      );
    });

    describe('emailMatcher', function () {
      describe('when the email is undefined', () =>
        it('returns null', () => expect(ValidationFormats.emailMatcher()).toBe(undefined))
      );

      describe('when the email is valid', () =>
        it('returns null', () => expect(ValidationFormats.emailMatcher('dan@domain.com')).toBe(undefined))
      );

      describe('when the email is invalid', () =>
        it('returns an error message', function () {
          const invalidEmails = ['dan', 'domain.com', 'dan@domain'];
          for (let i in invalidEmails) {
            const email = invalidEmails[i];
            expect(ValidationFormats.emailMatcher(email)).toBe('Please enter a valid email');
          }
        })
      );
    });

    describe('lengthMatcher', function () {
      describe('when the length is valid', () =>
        it('returns undefined', () => expect(ValidationFormats.lengthMatcher('ABC', 5)).toBe(undefined))
      );

      describe('when the length is invalid', () =>
        it('returns an error message', () => expect(ValidationFormats.lengthMatcher('ABCEFG', 5)).toBe('Attribute must contain fewer than 6 characters.'))
      );
    });
  });
});
