define(function (require) {
  require('spec/spec_helper');
  const PlotBandTransformer = require('runtime_history/components/plot_band_transformer');
  require('sinon');

  describe('PlotBandTransformer', function () {
    beforeEach(function () {
      this.attrSpy = sinon.spy();
      this.bands = [{
        svgElem: {
          d: 'M 0 0 L 0 0 0 0 0 0',
          attr: this.attrSpy
        }
      }
      ];
      this.bottomPosition = 400;
      this.defaultTopPosition = 267;
    });

    describe('default', () =>
      it('sets the top and bottom positions as default values', function () {
        const defaultBottom = 316;
        const defaultPath = `M 0 ${defaultBottom} L 0 ${this.defaultTopPosition} 0 ${this.defaultTopPosition} 0 ${defaultBottom}`;

        PlotBandTransformer.transform(this.bands);

        const drawCommand = this.attrSpy.getCall(0).args[0];
        const pathArg = this.attrSpy.getCall(0).args[1];

        expect(this.attrSpy.calledOnce).toBeTruthy();
        expect(drawCommand).toBe('d');
        expect(pathArg).toBe(defaultPath);
      })
    );

    describe('cooling', () =>
      it('sets only the bottom position and defaults the top position of the band', function () {
        const coolingPath = `M 0 ${this.bottomPosition} L 0 ${this.defaultTopPosition} 0 ${this.defaultTopPosition} 0 ${this.bottomPosition}`;

        PlotBandTransformer.transform(this.bands, this.bottomPosition);

        const drawCommand = this.attrSpy.getCall(0).args[0];
        const pathArg = this.attrSpy.getCall(0).args[1];

        expect(this.attrSpy.calledOnce).toBeTruthy();
        expect(drawCommand).toBe('d');
        expect(pathArg).toBe(coolingPath);
      })
    );

    describe('heating', () =>
      it('sets both the top and bottom position of the band', function () {
        const topPosition = 100;
        const heatingPath = `M 0 ${this.bottomPosition} L 0 ${topPosition} 0 ${topPosition} 0 ${this.bottomPosition}`;

        PlotBandTransformer.transform(this.bands, this.bottomPosition, topPosition);

        const drawCommand = this.attrSpy.getCall(0).args[0];
        const pathArg = this.attrSpy.getCall(0).args[1];

        expect(this.attrSpy.calledOnce).toBeTruthy();
        expect(drawCommand).toBe('d');
        expect(pathArg).toBe(heatingPath);
      })
    );

    describe('bands with capacities', function () {
      beforeEach(function () {
        this.capacity = 40;
        this.bands[0].options = { capacity: this.capacity };
      });

      it('sets the height of the band to the match the capacity', function () {
        const topPosition = 100;
        const bottomPosition = 200;
        const scaledTopPosition = bottomPosition - ((bottomPosition - topPosition) * (this.capacity / 100));
        const expectedPath = `M 0 ${bottomPosition} L 0 ${scaledTopPosition} 0 ${scaledTopPosition} 0 ${bottomPosition}`;

        PlotBandTransformer.transform(this.bands, bottomPosition, topPosition);

        const drawCommand = this.attrSpy.getCall(0).args[0];
        const pathArg = this.attrSpy.getCall(0).args[1];

        expect(this.attrSpy.calledOnce).toBeTruthy();
        expect(drawCommand).toBe('d');
        expect(pathArg).toBe(expectedPath);
      });
    });
  });
});
