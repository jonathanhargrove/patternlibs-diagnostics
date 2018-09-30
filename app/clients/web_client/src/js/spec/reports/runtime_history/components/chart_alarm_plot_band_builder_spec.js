define(function (require) {
  require('spec/spec_helper');
  const Highcharts = require('highstock');
  const ChartAlarmPlotBandBuilder = require('runtime_history/components/chart_alarm_plot_band_builder');
  const sinon = require('sinon');

  describe('ChartAlarmPlotBandBuilder', function () {
    beforeEach(function () {
      const renderer = new Highcharts.SVGRenderer($('body')[0], 100, 100, '', true, true);

      const gStub = {
        attr () { return null; },
        clip () { return null; },
        css () { return null; },
        add () { return null; },
        destroy () { return null; }
      };
      this.rendererGStub = sinon.stub(renderer, 'g').returns(gStub);
      this.gAttrSpy = sinon.stub(gStub, 'attr').returns(gStub);
      this.gClipSpy = sinon.stub(gStub, 'clip').returns(gStub);
      this.gCssSpy  = sinon.stub(gStub, 'css').returns(gStub);
      this.gAddSpy  = sinon.stub(gStub, 'add').returns(gStub);
      this.gDestroySpy  = sinon.stub(gStub, 'destroy').returns(gStub);

      const imageStub = {
        attr () { return null; },
        add () { return null; }
      };

      this.rendererImageStub = sinon.stub(renderer, 'image').returns(imageStub);
      this.imageAttrSpy = sinon.stub(imageStub, 'attr').returns(imageStub);
      this.imageAddSpy  = sinon.stub(imageStub, 'add').returns(imageStub);

      this.chart = {
        renderer,
        xAxis: [{ toPixels (time) { return time.valueOf(); } }]
      };

      const alarmOccurrences = [
        { id: 1, severity: 'critical', status: 'new', occurredAt: { valueOf () { return 35; } } },
        { id: 2, severity: 'major', status: 'new', occurredAt: { valueOf () { return 36; } } },
        { id: 3, severity: 'normal', status: 'new', occurredAt: { valueOf () { return 37; } } }
      ];

      sinon.stub(ChartAlarmPlotBandBuilder.prototype,
        '_alarmOccurrencesWithinVisibleRange').returns(alarmOccurrences);

      spyOn(ChartAlarmPlotBandBuilder.prototype, '_AlarmTooltipManagerClass');
      this.builder = new ChartAlarmPlotBandBuilder(this.chart, alarmOccurrences);
    });

    afterEach(() => ChartAlarmPlotBandBuilder.prototype._alarmOccurrencesWithinVisibleRange.restore());

    describe('#build', function () {
      beforeEach(function () { this.builder.build(); });

      it('adds an SVG g element for each alarm', function () {
        expect(this.rendererGStub.callCount).toBe(3);
        expect(this.gAttrSpy.getCall(0).args[0].translateX).toBe(19.5);
        expect(this.gAttrSpy.getCall(0).args[0].translateY).toBe(276.5);
        expect(this.gAttrSpy.getCall(1).args[0].translateX).toBe(20.5);
        expect(this.gAttrSpy.getCall(1).args[0].translateY).toBe(276.5);
        expect(this.gAttrSpy.getCall(2).args[0].translateX).toBe(21.5);
        expect(this.gAttrSpy.getCall(2).args[0].translateY).toBe(276.5);
      });

      it('adds the g element to the renderer', function () {
        expect(this.gAddSpy.callCount).toBe(3);
      });

      it('creates icon images with the correct x and y offsets', function () {
        expect(this.rendererImageStub.callCount).toBe(3);

        // testing only call 1, just because this is quite verbose
        // expect(@rendererImageStub.getCall(0).args[0]).toMatch(/\.png$/) # a PNG URL
        expect(this.rendererImageStub.getCall(0).args[1]).toBe(-50);
        expect(this.rendererImageStub.getCall(0).args[2]).toBe(0);
        expect(this.rendererImageStub.getCall(0).args[3]).toBe(150);
        expect(this.rendererImageStub.getCall(0).args[4]).toBe(25);

        // likewise here
        expect(this.imageAttrSpy.getCall(0).args[0]).toEqual({'data-image-x': 50, 'data-image-y': 0});
      });

      describe("when already built and hasn't been cleared", () =>
        describe('building again', () =>
          it('throws an error', function () {
            expect(() => this.builder.build()).toThrow();
          })
        )
      );
    });

    describe('#clear', () =>
      it('removes all alarm plot bands (which removes contained icon spans)', function () {
        this.builder.build();
        this.builder.clear();

        expect(this.gDestroySpy.callCount).toBe(3);
      })
    );
  });
});
