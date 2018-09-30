define(function (require) {
  require('spec/spec_helper');
  const ChartMode = require('runtime_history/components/chart_mode');

  describe('ChartMode', function () {
    beforeEach(function () {
      this.chartMode = new ChartMode();
    });

    it('defaults to cooling', function () {
      expect(this.chartMode.current()).toBe('cooling');
    });

    describe('with a default value in the constructor', () =>
      it('uses the passed-in default', function () {
        const chartMode = new ChartMode('heating');
        expect(chartMode.current()).toBe('heating');
      })
    );

    describe('with an invalid default', () =>
      it('uses the passed-in default', () => expect(() => new ChartMode('potato')).toThrow(new Error("Unexpected mode value 'potato'.")))
    );

    describe('#isCooling', function () {
      it('returns true if the current mode is set to cooling', function () {
        this.chartMode.set('cooling');
        expect(this.chartMode.isCooling()).toBeTruthy();
      });

      it('returns false if the current mode is set to heating', function () {
        this.chartMode.set('heating');
        expect(this.chartMode.isCooling()).toBeFalsy();
      });
    });

    describe('#isHeating', function () {
      it('returns true if the current mode is set to heating', function () {
        this.chartMode.set('heating');
        expect(this.chartMode.isHeating()).toBeTruthy();
      });

      it('returns false if the current mode is set to cooling', function () {
        this.chartMode.set('cooling');
        expect(this.chartMode.isHeating()).toBeFalsy();
      });
    });

    describe('#set', function () {
      it('changes the current set mode', function () {
        this.chartMode.set('heating');
        expect(this.chartMode.current()).toBe('heating');

        this.chartMode.set('cooling');
        expect(this.chartMode.current()).toBe('cooling');
      });

      describe('given an invalid value', () =>
        it('throws an unexpected argument error', function () {
          expect(() => this.chartMode.set('foo'))
            .toThrow(new Error("Unexpected mode value 'foo'."));
        })
      );
    });
  });
});
