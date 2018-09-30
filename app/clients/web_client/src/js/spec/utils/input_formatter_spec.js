define(function (require) {
  require('spec/spec_helper');
  const InputFormatter = require('utils/input_formatter');

  describe('InputFormatter', function () {
    beforeEach(function () {
      this.inputFormatter = new InputFormatter();
    });

    describe('#scrubBlankAndTrim', function () {
      it('returns null for pure whitespace', function () {
        const trimmedSpace = this.inputFormatter.scrubBlankAndTrim('       ');
        expect(trimmedSpace).toBe(null);
      });

      it('removes leading and trailing whitespace', function () {
        const trimmedWord = this.inputFormatter.scrubBlankAndTrim('   Trimmed    ');
        expect(trimmedWord).toBe('Trimmed');
      });

      it('returns null for null', function () {
        expect(this.inputFormatter.scrubBlankAndTrim(null)).toBeNull();
      });
    });

    describe('#cleanPhone', () =>
      it('removes non numeric chars', function () {
        const trimmedNumber = this.inputFormatter.cleanPhone(' 777 258 a! 4561');
        expect(trimmedNumber).toBe('7772584561');
      })
    );

    describe('#cleanPostalCode', function () {
      it('upcases', function () {
        const formatted = this.inputFormatter.cleanPostalCode('a4b5c6');
        expect(formatted).toBe('A4B5C6');
      });

      it('trims', function () {
        const formatted = this.inputFormatter.cleanPostalCode(' a4b5c6   ');
        expect(formatted).toBe('A4B5C6');
      });

      it('does not remove embedded space', function () {
        const formatted = this.inputFormatter.cleanPostalCode(' a4b 5c6   ');
        expect(formatted).toBe('A4B 5C6');
      });

      it('does not crash when passed a blank string', function () {
        expect(() => this.inputFormatter.cleanPostalCode('')).not.toThrow();
      });
    });
  });
});
