define(function (require) {
  require('spec/spec_helper');
  const ModeView = require('runtime_history/views/mode_view');

  describe('ModeView', function () {
    describe('selecting cooling', () =>
      it('triggers a modeChanged event with a "cooling" argument', function () {
        const fakeChartMode = { current () { 'cooling'; } }; // TODO: start using fixtures
        const view = new ModeView({ chartMode: fakeChartMode }).render();
        const triggerSpy = sinon.spy(view, 'trigger');

        view.$('.cooling').click();

        expect(triggerSpy.calledWith('modeChanged', 'cooling')).toBeTruthy();
      })
    );

    describe('selecting heating', () =>
      it('triggers a modeChanged event with a "heating" argument', function () {
        const fakeChartMode = { current () { 'heating'; } };
        const view = new ModeView({ chartMode: fakeChartMode }).render();
        const triggerSpy = sinon.spy(view, 'trigger');

        view.$('.heating').click();

        expect(triggerSpy.calledWith('modeChanged', 'heating')).toBeTruthy();
      })
    );
  });
});
